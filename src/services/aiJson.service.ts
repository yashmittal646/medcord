import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Structured (JSON) calls to the configured AI providers, used by the Health Tracker. Groq serves text
 * prompts and images (vision model); Gemini also reads PDFs. Every reply is parsed defensively: callers get
 * `null` rather than an exception when a provider is down or answers with something that is not JSON.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_TEXT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3-flash-preview'];

/** Groq rejects inline images above ~4 MB once base64-encoded */
const GROQ_IMAGE_LIMIT = 3 * 1024 * 1024;

const groqKey = () => process.env.GROQ_API_KEY;
const geminiKey = () => process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

export const aiJsonAvailable = () => ({
  text: Boolean(groqKey() || geminiKey()),
  documents: Boolean(geminiKey()),
  images: Boolean(geminiKey() || groqKey()),
});

/** Pull the first JSON object out of a model reply (tolerates code fences and stray prose) */
export function parseJsonReply(text: string | undefined | null): any | null {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function groqJson(model: string, messages: unknown[], maxTokens: number, timeoutMs: number): Promise<any | null> {
  const key = groqKey();
  if (!key) return null;
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.warn(`Groq ${model} returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    return parseJsonReply(((await res.json()) as any)?.choices?.[0]?.message?.content);
  } catch (e: any) {
    console.warn(`Groq ${model} failed:`, e?.message);
    return null;
  }
}

async function geminiJson(parts: any[], system: string | undefined, maxTokens: number): Promise<any | null> {
  const key = geminiKey();
  if (!key) return null;
  const genAI = new GoogleGenerativeAI(key);
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(system ? { systemInstruction: system } : {}),
        generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(parts);
      const parsed = parseJsonReply(result.response.text());
      if (parsed) return parsed;
    } catch (e: any) {
      console.warn(`Gemini ${modelName} failed:`, e?.message);
    }
  }
  return null;
}

/** A system + user prompt that must come back as JSON */
export async function aiJsonFromText(system: string, user: string, maxTokens = 3000): Promise<any | null> {
  for (const model of GROQ_TEXT_MODELS) {
    const out = await groqJson(
      model,
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      maxTokens,
      60_000
    );
    if (out) return out;
  }
  return geminiJson([{ text: user }], system, maxTokens);
}

/** A PDF or image plus instructions; Gemini reads both, Groq's vision model covers small images */
export async function aiJsonFromDocument(prompt: string, mimeType: string, bytes: Buffer, maxTokens = 8000): Promise<any | null> {
  const fromGemini = await geminiJson([{ inlineData: { mimeType, data: bytes.toString('base64') } }, { text: prompt }], undefined, maxTokens);
  if (fromGemini) return fromGemini;
  if (mimeType.startsWith('image/') && bytes.length <= GROQ_IMAGE_LIMIT) {
    return groqJson(
      GROQ_VISION_MODEL,
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${bytes.toString('base64')}` } },
          ],
        },
      ],
      Math.min(maxTokens, 8000),
      90_000
    );
  }
  return null;
}
