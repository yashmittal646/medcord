import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { AppError } from '../utils/appError.js';

const GROQ_CANDIDATE_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'allam-2-7b',
];

const CANDIDATE_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3-flash-preview'];

/** Which AI providers are configured (used by the health endpoint; key values are never exposed) */
export const aiProviderStatus = () => ({
  groq: Boolean(process.env.GROQ_API_KEY),
  gemini: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
});

const MAX_TURNS = 20;
const MAX_CHARS_PER_TURN = 4000;

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

function getSystemInstruction(langCode: string): string {
  const langNames: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    kn: 'Kannada',
    ta: 'Tamil',
    te: 'Telugu',
  };
  const langName = langNames[langCode] || 'English';

  return `You are FollowUp Health Advisor, a helpful and empathetic medical advisor embedded in the FollowUp patient portal. Your goal is to guide patients with clear, practical, and easily understandable health information.

CRITICAL LANGUAGE & COMMUNICATION RULES:
1. Converse naturally in ${langName} (${langCode}).
2. DO NOT use literal, artificial, or hyper-formal textbook translations. Instead, use natural, everyday "like-for-like" conversational replacements that ordinary people actually speak, hear, and understand daily in their home language.
3. For medical or technical terms, use the familiar, everyday words that patients commonly use when talking to a local doctor or family (e.g. in Hindi: 'सिरदर्द', 'पेट दर्द', 'दवाइयाँ', 'बुखार', 'जाँच/टेस्ट', 'ब्लड प्रेशर/BP', 'आराम', 'पानी पिएं', avoiding stiff Sanskritized/archaic terms).
4. Explain health conditions simply so any reader immediately grasps what is happening, what to look out for, and what to do next.

CLINICAL INTERACTION PROTOCOL:
1. You are an AI health advisor, NOT a licensed doctor.
2. When the patient first asks a question or shares a symptom, greet them warmly and ask 1-2 focused, conversational follow-up questions to understand the duration, severity, and any accompanying symptoms.
3. Once you have enough context (or if they provide full details), give structured guidance with practical tips, lifestyle remedies, and when to see a physician.
4. BEFORE giving your final health assessment/guidance, ALWAYS include a clear, everyday medical disclaimer block at the beginning, enclosed in triple asterisks:
***⚠️ [Important Note: This is general AI health advice and is not a substitute for a real doctor's treatment. For any serious problem, please consult a qualified doctor.]*** (translate into natural, simple ${langName})

5. If symptoms suggest an emergency (e.g., severe chest pain, sudden paralysis/numbness, acute breathing difficulty, uncontrolled bleeding), immediately and prominently advise urgent hospital/emergency care.
6. Never prescribe specific medication dosages or prescription-only drugs.
7. Keep tone supportive, clear, and reassuring.
8. STRICT BOUNDARY: ONLY answer questions related to health, medical conditions, symptoms, wellness, nutrition, and fitness. If a user asks a question completely unrelated to the medical field (e.g., programming, math, general trivia, unrelated tasks), politely decline to answer. Tell the user you are a specialized Health Advisor and ask them to ask relevant health-related questions only.`;
}

export const getAiAdvice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, langCode = 'en' } = req.body as {
      messages: ChatTurn[];
      langCode: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return next(new AppError('Messages array is required', 400));
    }
    if (messages.length > MAX_TURNS || messages.some((m) => typeof m?.content !== 'string' || m.content.length > MAX_CHARS_PER_TURN)) {
      return next(new AppError('Your message is too long. Please shorten it and try again.', 400));
    }
    const failures: string[] = [];

    const groqApiKey = process.env.GROQ_API_KEY;
    const lastMessage = messages[messages.length - 1];

    // 1. Try Groq API first if GROQ_API_KEY is available
    if (groqApiKey) {
      const groqMessages = [
        { role: 'system', content: getSystemInstruction(langCode) },
        ...messages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ];

      for (const modelName of GROQ_CANDIDATE_MODELS) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              messages: groqMessages,
              temperature: 0.7,
              max_tokens: 2048,
            }),
          });

          if (response.ok) {
            const data = (await response.json()) as any;
            const reply = data?.choices?.[0]?.message?.content;
            if (reply) {
              return res.json({ reply, model: modelName });
            }
          } else {
            const errText = await response.text();
            failures.push(`groq:${modelName}:${response.status}`);
            console.warn(`Groq model ${modelName} returned ${response.status}: ${errText.slice(0, 300)}`);
          }
        } catch (e: any) {
          failures.push(`groq:${modelName}:error`);
          console.warn(`Groq model ${modelName} error:`, e?.message);
        }
      }
    }

    // 2. Fallback to Gemini API if available
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);

      const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: msg.content }],
      }));

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: getSystemInstruction(langCode),
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            ],
          });

          const chat = model.startChat({ history });
          const result = await chat.sendMessage(lastMessage.content);
          const text = result.response.text();

          if (text) {
            return res.json({ reply: text, model: modelName });
          }
        } catch (e: any) {
          failures.push(`gemini:${modelName}:error`);
          console.warn(`Gemini model ${modelName} attempt failed:`, e?.message);
          continue;
        }
      }
    }

    // 3. Neither provider answered
    // A generic canned answer to every question (including serious ones) is worse than an honest error
    const status = aiProviderStatus();
    console.error(
      `⚠️ AI advisor unavailable. groqKey=${status.groq} geminiKey=${status.gemini} attempts=${failures.join(',') || 'none'}`
    );
    return next(
      new AppError(
        status.groq || status.gemini
          ? 'The AI health advisor could not answer right now. Please try again in a minute.'
          : 'The AI health advisor is not configured on this server yet. Please try again later.',
        503
      )
    );
  } catch (err) {
    return next(err);
  }
};
