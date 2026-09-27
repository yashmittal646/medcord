import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, LangCode, LANGUAGE_NAMES } from '../../context/LanguageContext.js';
import {
  MessageSquareHeart,
  Send,
  Mic,
  MicOff,
  AlertTriangle,
  Bot,
  User,
  Loader2,
  Sparkles,
  ShieldAlert,
  Trash2,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isDisclaimer?: boolean;
}

/* ─── Gemini API helper ──────────────────────────────────────── */
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

const SPEECH_LANG_MAP: Record<LangCode, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

function getSystemInstruction(langCode: LangCode): string {
  const langName = LANGUAGE_NAMES[langCode] || 'English';
  return `You are MedCord Health Advisor, a helpful and empathetic medical advisor embedded in the MedCord patient portal. Your goal is to guide patients with clear, practical, and easily understandable health information.

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
***⚠️ [ज़रूरी ध्यान दें / Important Note: यह AI द्वारा दी गई सामान्य स्वास्थ्य सलाह है और असली डॉक्टर के इलाज का विकल्प नहीं है। किसी भी गंभीर परेशानी के लिए कृपया योग्य डॉक्टर से सलाह लें।]*** (translate into natural, simple ${langName})

5. If symptoms suggest an emergency (e.g., severe chest pain, sudden paralysis/numbness, acute breathing difficulty, uncontrolled bleeding), immediately and prominently advise urgent hospital/emergency care.
6. Never prescribe specific medication dosages or prescription-only drugs.
7. Keep tone supportive, clear, and reassuring.`;
}

async function callGemini(messages: ChatMessage[], langCode: LangCode): Promise<string> {
  // Build conversation history for Gemini
  const contents = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const body = {
    system_instruction: {
      parts: [{ text: getSystemInstruction(langCode) }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  let lastError = '';
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) return responseText;
      } else {
        const errData = await res.json().catch(() => ({}));
        lastError = errData?.error?.message || `Error ${res.status}`;
      }
    } catch (e: any) {
      lastError = e?.message || 'Network error';
    }
  }

  throw new Error(lastError || 'Failed to get AI advice. Please try again.');
}

/* ─── Markdown-light renderer ────────────────────────────────── */
function renderMessageContent(content: string) {
  // Match disclaimer block wrapped in triple asterisks or warning signs
  const disclaimerMatch = content.match(/\*\*\*[\s\S]*?(?:DISCLAIMER|अस्वीकरण|ಹಕ್ಕುತ್ಯಾಗ|மறுப்பு|హక్కుత్యాగ|⚠️)[\s\S]*?\*\*\*/i);

  if (disclaimerMatch) {
    const parts = content.split(disclaimerMatch[0]);
    const disclaimerText = disclaimerMatch[0].replace(/\*\*\*/g, '').trim();

    return (
      <>
        {parts[0] && <div className="mb-3">{renderTextBlock(parts[0])}</div>}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-3 flex gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium leading-relaxed">{disclaimerText}</p>
        </div>
        {parts[1] && <div>{renderTextBlock(parts[1])}</div>}
      </>
    );
  }

  return renderTextBlock(content);
}

function renderTextBlock(text: string) {
  // Very simple markdown: bold, bullet points, headers
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<br key={i} />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="font-bold text-slate-800 mt-3 mb-1 text-sm">
          {trimmed.replace('### ', '')}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="font-bold text-slate-800 mt-3 mb-1">
          {trimmed.replace('## ', '')}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2 mb-0.5">
          <span className="text-blue-500 mt-1.5 shrink-0">•</span>
          <span>{renderInline(trimmed.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\.\s/)?.[1];
      elements.push(
        <div key={i} className="flex gap-2 ml-2 mb-0.5">
          <span className="text-blue-600 font-semibold shrink-0">{num}.</span>
          <span>{renderInline(trimmed.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="mb-1">
          {renderInline(trimmed)}
        </p>
      );
    }
  });

  return <>{elements}</>;
}

function renderInline(text: string) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ─── Main Component ─────────────────────────────────────────── */
export const PatientAskAdvicePage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  /* ── Speech Recognition ──────────────────────────────────── */
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = SPEECH_LANG_MAP[lang] || 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setError('Speech recognition failed. Please try again.');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  /* ── Send Message ────────────────────────────────────────── */
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const reply = await callGemini(updatedMessages, lang);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const hasMessages = messages.length > 0;

  const suggestions = [
    t('advice.suggestion1'),
    t('advice.suggestion2'),
    t('advice.suggestion3'),
    t('advice.suggestion4'),
  ];

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <MessageSquareHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('page.askAdvice')}</h1>
            <p className="text-xs text-slate-500">{t('page.askAdviceSubtitle')}</p>
          </div>
        </div>
        {hasMessages && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('advice.clearChat')}
          </button>
        )}
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 mb-4 flex gap-3 shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-bold">{t('advice.disclaimer')}</span> {t('advice.disclaimerText')}
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-sm mb-4">
        {!hasMessages ? (
          /* ── Empty State ─────────────────────────────────── */
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 flex items-center justify-center mb-6">
              <Sparkles className="w-9 h-9 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              {t('advice.emptyTitle')}
            </h2>
            <p className="text-sm text-slate-500 max-w-md mb-8">
              {t('advice.emptySubtitle')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="text-left px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-all group"
                >
                  <span className="line-clamp-2">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Messages ───────────────────────────────────── */
          <div className="p-4 sm:p-6 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant'
                    ? renderMessageContent(msg.content)
                    : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-slate-500">{t('advice.thinking')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 mb-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('advice.placeholder')}
          rows={2}
          disabled={isLoading}
          className="w-full resize-none bg-slate-50/50 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 border-0 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50"
        />
        <div className="flex items-center justify-between mt-2 px-1">
          <button
            onClick={toggleListening}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
              isListening
                ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50'
            } disabled:opacity-50`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                {t('advice.stopListening')}
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                {t('advice.speakInstead')}
              </>
            )}
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isLoading ? t('advice.thinking') : t('advice.getAdvice')}
          </button>
        </div>
      </div>
    </div>
  );
};
