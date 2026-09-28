import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { AppError } from '../utils/appError.js';

const GROQ_CANDIDATE_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'allam-2-7b',
];

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

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

function getFallbackAdvice(userText: string, langCode: string): string {
  const isHindi = langCode === 'hi';
  const isTelugu = langCode === 'te';
  const isTamil = langCode === 'ta';
  const isKannada = langCode === 'kn';

  if (isHindi) {
    return `***⚠️ [ज़रूरी सूचना: यह एआई स्वास्थ्य सलाह है और डॉक्टर के इलाज का विकल्प नहीं है। गंभीर समस्या होने पर तुरंत डॉक्टर से संपर्क करें।]***\n\nनमस्ते! आपकी सेहत से जुड़ी जानकारी समझने के लिए धन्यवाद।\n\nआपकी समस्या ("${userText}") के संबंध में सामान्य सलाह:\n1. **आराम और हाइडे्रशन**: पर्याप्त पानी पिएं और शरीर को पूरा आराम दें।\n2. **लक्षणों पर नज़र रखें**: यदि बुखार, सिरदर्द या दर्द बढ़ रहा हो तो इसे नोट करें।\n3. **डॉक्टर से परामर्श**: अगर लक्षण 24-48 घंटों से अधिक बने रहते हैं, तो कृपया फ़ॉलो-अप पोर्टल के माध्यम से अपॉइंटमेंट बुक करें।\n\nक्या आप बता सकते हैं कि यह समस्या कितने समय से है या कोई अन्य लक्षण भी हैं?`;
  }
  if (isTelugu) {
    return `***⚠️ [ముఖ్య గమనిక: ఇది AI సాధారణ ఆరోగ్య సూచన మాత్రమే. తీవ్రమైన సమస్యలకు అనుభవజ్ఞుడైన డాక్టర్‌ను సంప్రదించండి.]***\n\nనమస్కారం! మీ ఆరోగ్య పరిస్థితిని తెలిపినందుకు ధన్యవాదాలు.\n\nమీ సమస్య ("${userText}") కోసం సాధారణ సలహాలు:\n1. **విశ్రాంతి & మంచి నీరు**: తగినంత విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు తాగండి.\n2. **లక్షణాలను గమనించండి**: సమస్య పెరుగుతుందా లేదా అనేది గమనించండి.\n3. **డాక్టర్ సలహా**: లక్షణాలు 1-2 రోజులు మించి ఉంటే అనుభవజ్ఞుడైన డాక్టర్‌ను సంప్రదించండి.\n\nఈ సమస్య ఎంతకాలంగా ఉందో లేదా మరిన్ని వివరాలు చెప్పగలరా?`;
  }
  return `***⚠️ [Important Note: This is general AI health guidance and is not a substitute for a real doctor's treatment. For any severe condition, please consult a qualified doctor.]***\n\nHello! Thank you for sharing your concern.\n\nRegarding "${userText}":\n1. **Rest & Hydration**: Ensure plenty of fluids and adequate rest.\n2. **Monitor Symptoms**: Keep track of any changes or accompanying symptoms.\n3. **Consultation**: If symptoms persist for more than 24-48 hours, please book a follow-up consultation with a doctor.\n\nCould you share how long you have experienced this or if there are any other symptoms?`;
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
            console.warn(`Groq model ${modelName} returned ${response.status}: ${errText}`);
          }
        } catch (e: any) {
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
          console.warn(`Gemini model ${modelName} attempt failed:`, e?.message);
          continue;
        }
      }
    }

    // 3. Graceful local fallback if both remote APIs fail/are unconfigured
    const fallbackReply = getFallbackAdvice(lastMessage?.content || 'Health inquiry', langCode);
    return res.json({ reply: fallbackReply, model: 'fallback-advisor' });
  } catch (err) {
    return next(err);
  }
};
