'use client'; // Next.js App Router: this component uses hooks + browser APIs. Ignored by Vite.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceEmergency } from '../hooks/useVoiceEmergency.js';

/**
 * Router-agnostic on purpose: it imports neither react-router nor next/navigation,
 * so the same file compiles in Vite and Next.js. Inject navigation from the page:
 *
 *   React Router:  const navigate = useNavigate();
 *                  <VoiceEmergencyTrigger navigate={navigate} />
 *   Next.js:       const router = useRouter();
 *                  <VoiceEmergencyTrigger navigate={(p) => router.push(p)} />
 */
export interface VoiceEmergencyTriggerProps {
  /** Called with the canonical ID ("PAT-123456"). Runs before navigation. */
  onPatientFound?: (patientId: string) => void;
  /** Router push/navigate function. Omit to only use onPatientFound. */
  navigate?: (path: string) => void;
  /** Builds the destination. Default: /emergency?patientId=PAT-123456 */
  buildPath?: (patientId: string) => string;
  /** BCP-47 language tag passed to the recognizer. */
  lang?: string;
  /** Focus the mic button on mount so a keyboard/Enter/Space press starts listening. */
  autoFocus?: boolean;
  className?: string;
}

const defaultBuildPath = (id: string) => `/emergency?patientId=${encodeURIComponent(id)}`;

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v4" />
    <path d="M8 22h8" />
  </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const WarnIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const VoiceEmergencyTrigger: React.FC<VoiceEmergencyTriggerProps> = ({
  onPatientFound,
  navigate,
  buildPath = defaultBuildPath,
  lang,
  autoFocus = false,
  className = '',
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [recognizedId, setRecognizedId] = useState<string | null>(null);

  const handleFound = useCallback(
    (id: string) => {
      setRecognizedId(id);
      onPatientFound?.(id);
      navigate?.(buildPath(id));
    },
    [onPatientFound, navigate, buildPath],
  );

  const { isListening, transcript, error, errorCode, supported, startListening, stopListening } =
    useVoiceEmergency({ onPatientFound: handleFound, lang });

  useEffect(() => {
    if (autoFocus) buttonRef.current?.focus();
  }, [autoFocus]);

  // Hide the "recognized" confirmation after a few seconds.
  useEffect(() => {
    if (!recognizedId) return undefined;
    const t = window.setTimeout(() => setRecognizedId(null), 4000);
    return () => window.clearTimeout(t);
  }, [recognizedId]);

  const toggle = () => {
    if (isListening) stopListening();
    else {
      setRecognizedId(null);
      startListening();
    }
  };

  return (
    <div className={`flex w-full flex-col items-center gap-4 ${className}`}>
      {/* ---------------------------- mic button ---------------------------- */}
      <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
        {isListening && (
          <>
            {/* red recording aura */}
            <span className="absolute -inset-4 rounded-full bg-red-500/20 blur-xl" aria-hidden="true" />
            {/* ping rings */}
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" aria-hidden="true" />
            <span
              className="absolute -inset-2 animate-ping rounded-full bg-red-500/20"
              style={{ animationDelay: '0.4s' }}
              aria-hidden="true"
            />
          </>
        )}
        <button
          ref={buttonRef}
          type="button"
          onClick={toggle}
          disabled={!supported}
          aria-pressed={isListening}
          aria-label={isListening ? 'Stop voice patient lookup' : 'Start voice patient lookup'}
          className={[
            'relative z-10 flex h-full w-full items-center justify-center rounded-full text-white shadow-lg',
            'ring-4 ring-offset-2 transition-all focus:outline-none focus-visible:ring-blue-500 active:scale-95',
            'disabled:cursor-not-allowed disabled:opacity-40',
            isListening
              ? 'bg-red-600 ring-red-300 hover:bg-red-700'
              : 'bg-slate-900 ring-slate-300 hover:bg-slate-800',
          ].join(' ')}
        >
          {isListening ? <StopIcon className="h-10 w-10" /> : <MicIcon className="h-12 w-12" />}
        </button>
      </div>

      <p className="text-center text-sm font-bold uppercase tracking-widest text-slate-700">
        {isListening ? 'Listening… say the patient ID' : 'Tap to speak patient ID'}
      </p>

      {/* ------------------------ live transcript pill ---------------------- */}
      {/* role=status + aria-live lets screen readers announce recognized speech */}
      <div role="status" aria-live="polite" className="flex min-h-[2.5rem] w-full justify-center">
        {isListening && (
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 font-mono text-sm text-red-800 shadow-sm">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-600" aria-hidden="true" />
            <span className="truncate">{transcript || 'Waiting for speech…'}</span>
          </span>
        )}
        {!isListening && recognizedId && (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-mono text-sm font-bold text-emerald-800 shadow-sm">
            <CheckIcon className="h-4 w-4" />
            Recognized {recognizedId}
          </span>
        )}
      </div>

      {/* ------------------------------ banners ----------------------------- */}
      {!supported && (
        <Banner tone="amber" title="Voice lookup isn't available in this browser">
          <p>
            Use the latest <strong>Chrome</strong> or <strong>Edge</strong> on desktop or Android. Safari (especially on
            iPhone/iPad) only supports speech recognition when Siri &amp; Dictation are enabled, and in-app browsers
            don&apos;t support it at all. Type the patient ID instead.
          </p>
        </Banner>
      )}

      {supported && errorCode === 'permission-denied' && (
        <Banner tone="red" title="Microphone access is blocked">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Click the lock / tune icon at the left of the address bar.</li>
            <li>
              Set <strong>Microphone</strong> to <strong>Allow</strong>, then reload this page.
            </li>
            <li>
              The page must be served over <strong>HTTPS</strong> (or localhost) for the microphone to work.
            </li>
          </ol>
        </Banner>
      )}

      {supported && errorCode === 'no-microphone' && (
        <Banner tone="red" title="No microphone detected">
          <p>Connect or enable a microphone in your system sound settings, then tap the button again.</p>
        </Banner>
      )}

      {supported && (errorCode === 'network' || errorCode === 'unknown') && error && (
        <Banner tone="amber" title="Voice recognition hiccup">
          <p>{error} Voice recognition in Chrome needs an internet connection.</p>
        </Banner>
      )}
    </div>
  );
};

const TONES = {
  red: 'border-red-300 bg-red-50 text-red-900',
  amber: 'border-amber-300 bg-amber-50 text-amber-900',
} as const;

const Banner: React.FC<{ tone: keyof typeof TONES; title: string; children: React.ReactNode }> = ({
  tone,
  title,
  children,
}) => (
  <div role="alert" className={`w-full max-w-md rounded-xl border-2 p-4 text-left text-xs leading-relaxed ${TONES[tone]}`}>
    <div className="mb-1.5 flex items-center gap-2 text-sm font-black">
      <WarnIcon className="h-5 w-5 shrink-0" />
      {title}
    </div>
    {children}
  </div>
);

export default VoiceEmergencyTrigger;
