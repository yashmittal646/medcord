import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, LangCode } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
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
  FileHeart,
} from 'lucide-react';
import { tr } from '../../context/LanguageContext.js';
import { translateServerMessage } from '../../utils/serverMessage.js';

/* ─── Types ──────────────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isDisclaimer?: boolean;
}

/* ─── Backend AI proxy helper ───────────────────────────────── */

const SPEECH_LANG_MAP: Record<LangCode, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};



/** What the advisor read from the patient's record for the latest answer (counts only) */
interface AdvisorContext {
  conditions: number;
  medications: number;
  allergies: number;
  labTests: number;
  records: number;
  carePlans: number;
}

const USE_RECORD_KEY = 'FollowUp_advice_use_record';
const readUseRecord = () => {
  try {
    return localStorage.getItem(USE_RECORD_KEY) !== 'false';
  } catch {
    return true;
  }
};

async function callAiAdvice(
  messages: ChatMessage[],
  langCode: LangCode,
  token: string | null,
  useHealthContext: boolean
): Promise<{ reply: string; context: AdvisorContext | null }> {
  if (!token) throw new Error(tr('Not authenticated. Please log in and try again.'));

  const res = await fetch('/api/ai/advice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      langCode,
      useHealthContext,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      translateServerMessage(errData?.message) || tr('Server error {status}. Please try again.', { status: res.status })
    );
  }

  const data = await res.json();
  if (!data?.reply) throw new Error(tr('No response received from the AI advisor.'));
  return { reply: data.reply, context: data.context ?? null };
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

  // Markdown tables (the model sometimes uses them despite instructions): collect consecutive "|" rows
  let table: string[][] = [];
  const flushTable = (key: number) => {
    if (!table.length) return;
    const [head, ...body] = table;
    elements.push(
      <div key={`t${key}`} className="my-2 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-100">
            <tr>{head.map((c, j) => <th key={j} className="px-2.5 py-1.5 text-left font-semibold text-slate-700">{renderInline(c)}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr key={r} className="border-t border-slate-100 align-top">
                {row.map((c, j) => <td key={j} className="px-2.5 py-1.5">{renderInline(c.replace(/<br\s*\/?>/gi, ' · '))}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    table = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
      if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) table.push(cells); // skip the |---| divider row
      return;
    }
    flushTable(i);
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

  flushTable(lines.length);
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
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const [useRecord, setUseRecord] = useState<boolean>(readUseRecord);
  const [usedContext, setUsedContext] = useState<AdvisorContext | null>(null);

  const toggleUseRecord = () => {
    setUseRecord((on) => {
      try {
        localStorage.setItem(USE_RECORD_KEY, String(!on));
      } catch {
        /* per-browser preference only */
      }
      return !on;
    });
    setUsedContext(null);
  };

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
      setError(t('Speech recognition is not supported in your browser.'));
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
      setError(t('Speech recognition failed. Please try again.'));
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
      const { reply, context } = await callAiAdvice(updatedMessages, lang, token, useRecord);
      setUsedContext(context);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || t('Failed to get a response. Please try again.'));
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

  const suggestions = useRecord
    ? [
        t('Explain my latest lab results in simple words'),
        t('What should I eat based on my conditions and reports?'),
        t('Could any of my medicines be making me tired?'),
        t('Summarise my health history for my next doctor visit'),
      ]
    : [t('advice.suggestion1'), t('advice.suggestion2'), t('advice.suggestion3'), t('advice.suggestion4')];

  const contextChips = usedContext
    ? [
        { label: t('Conditions'), n: usedContext.conditions },
        { label: t('Medicines'), n: usedContext.medications },
        { label: t('Allergies'), n: usedContext.allergies },
        { label: t('Lab tests'), n: usedContext.labTests },
        { label: t('Care plans'), n: usedContext.carePlans },
        { label: t('Records'), n: usedContext.records },
      ].filter((c) => c.n > 0)
    : [];

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1f4e8c] flex items-center justify-center shadow-md">
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

      {/* Health record switch: answers are grounded in the patient's own data unless they turn it off */}
      <div className={`rounded-xl border p-3 mb-4 flex items-start gap-3 shrink-0 transition-colors ${useRecord ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
        <FileHeart className={`w-4 h-4 shrink-0 mt-0.5 ${useRecord ? 'text-indigo-600' : 'text-slate-400'}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${useRecord ? 'text-indigo-900' : 'text-slate-700'}`}>
            {useRecord ? t('Personalised with your health record') : t('General answers (health record not used)')}
          </p>
          {useRecord && contextChips.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {contextChips.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1 rounded-full bg-white border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {c.label} <span className="text-indigo-400">{c.n}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className={`mt-0.5 text-[11px] leading-relaxed ${useRecord ? 'text-indigo-700/80' : 'text-slate-500'}`}>
              {useRecord
                ? t('The advisor reads your conditions, medicines, allergies, lab results and recent records to tailor its answers. They go to our AI provider only to answer you.')
                : t('Turn this on for answers that take your conditions, medicines, allergies and lab results into account.')}
            </p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useRecord}
          aria-label={t('Use my health record')}
          title={t('Use my health record')}
          onClick={toggleUseRecord}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${useRecord ? 'bg-indigo-600' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${useRecord ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-sm mb-4">
        {!hasMessages ? (
          /* ── Empty State ─────────────────────────────────── */
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#e9eff8] border-2 border-dashed border-blue-200 flex items-center justify-center mb-6">
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
                  <div className="w-8 h-8 rounded-lg bg-[#1f4e8c] flex items-center justify-center shrink-0 shadow-sm">
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
                <div className="w-8 h-8 rounded-lg bg-[#1f4e8c] flex items-center justify-center shrink-0 shadow-sm">
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-[#1f4e8c] text-white shadow-md hover:shadow-lg hover:bg-[#183f72] transition-all disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
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
