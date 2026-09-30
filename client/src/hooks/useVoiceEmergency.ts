import { useCallback, useEffect, useRef, useState } from 'react';

/* -------------------------------------------------------------------------- */
/*  Minimal Web Speech API typings                                            */
/*  lib.dom.d.ts does not ship SpeechRecognition (it is still vendor-prefixed  */
/*  in Chromium/Safari), so we declare only what we use. Names are prefixed    */
/*  with "Voice" so they never collide with a future lib.dom or @types/dom-*.  */
/* -------------------------------------------------------------------------- */

interface VoiceAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface VoiceResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: VoiceAlternative;
}

interface VoiceResultList {
  readonly length: number;
  [index: number]: VoiceResult;
}

interface VoiceRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: VoiceResultList;
}

type VoiceRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

interface VoiceRecognitionErrorEvent extends Event {
  readonly error: VoiceRecognitionErrorCode;
  readonly message: string;
}

interface VoiceRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: VoiceRecognitionErrorEvent) => void) | null;
  onresult: ((ev: VoiceRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type VoiceRecognitionCtor = new () => VoiceRecognition;

interface VoiceWindow extends Window {
  SpeechRecognition?: VoiceRecognitionCtor;
  webkitSpeechRecognition?: VoiceRecognitionCtor;
  webkitAudioContext?: typeof AudioContext;
}

const getRecognitionCtor = (): VoiceRecognitionCtor | null => {
  if (typeof window === 'undefined') return null; // SSR (Next.js)
  const w = window as VoiceWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/* -------------------------------------------------------------------------- */
/*  Transcript normalizer + patient-ID extractor                              */
/* -------------------------------------------------------------------------- */

/** Patient IDs are "PAT-" + 6 digits. Change here if the backend format changes. */
const ID_DIGITS = 6;

/** Unambiguous spoken digits. */
const STRONG_DIGITS: Record<string, string> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  niner: '9', // aviation / EMS radio style
  // Frequent recognizer mishearings that are never real words in this context
  sex: '6', // "six" -> "sex"
};

/**
 * Homophones that are ONLY treated as digits when they sit next to another
 * digit ("one two to four" -> 1224, but "open to patient" is untouched).
 */
const WEAK_DIGITS: Record<string, string> = {
  oh: '0', o: '0', to: '2', too: '2', for: '4', fore: '4',
  won: '1', ate: '8', nein: '9',
};

/** Words that may be spoken for the "PAT" prefix (incl. common mishearings). */
const PREFIX_WORDS = new Set(['pat', 'patient', 'pet', 'pad', 'bat']);

/** Command / filler words that carry no information and must not break a digit run. */
const FILLER_WORDS = new Set([
  'emergency', 'lookup', 'look', 'up', 'open', 'find', 'show', 'search',
  'id', 'number', 'no', 'the', 'a', 'is', 'um', 'uh', 'er', 'please',
]);

const DASH_WORDS = new Set(['dash', 'hyphen', 'minus', 'tack']);

type Token =
  | { kind: 'digit'; value: string }
  | { kind: 'weak'; value: string }
  | { kind: 'prefix' }
  | { kind: 'dash' }
  | { kind: 'filler' }
  | { kind: 'break' }; // any unknown word: ends a digit run so "room 12 ... 3456" can't merge

const tokenize = (raw: string): Token[] => {
  const cleaned = raw
    .toLowerCase()
    // "p a t" spelled out letter by letter
    .replace(/\bp[\s.]*a[\s.]*t\b/g, ' pat ')
    // Split glued letters/digits: "pat123456" -> "pat 123456"
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    // Recognizers emit "-", "–", "—" for spoken dash; keep it as its own token
    .replace(/[-‐-―]/g, ' - ')
    .replace(/[^a-z0-9\s-]/g, ' ');

  const words = cleaned.split(/\s+/).filter(Boolean);
  const tokens: Token[] = [];
  let repeat = 1; // "double"/"triple"

  const pushDigits = (digits: string) => {
    for (let i = 0; i < repeat; i += 1) {
      for (const d of digits) tokens.push({ kind: 'digit', value: d });
    }
    repeat = 1;
  };

  for (const word of words) {
    if (word === 'double') { repeat = 2; continue; }
    if (word === 'triple') { repeat = 3; continue; }

    if (/^\d+$/.test(word)) pushDigits(word);
    else if (word in STRONG_DIGITS) pushDigits(STRONG_DIGITS[word]);
    else if (word in WEAK_DIGITS) {
      for (let i = 0; i < repeat; i += 1) tokens.push({ kind: 'weak', value: WEAK_DIGITS[word] });
      repeat = 1;
    } else if (word === '-' || DASH_WORDS.has(word)) tokens.push({ kind: 'dash' });
    else if (PREFIX_WORDS.has(word)) tokens.push({ kind: 'prefix' });
    else if (FILLER_WORDS.has(word)) tokens.push({ kind: 'filler' });
    else tokens.push({ kind: 'break' });
  }
  return tokens;
};

/**
 * Turns free speech into a compact string such as "PAT-123456" or "123456".
 * Exported for unit tests.
 *
 *   "emergency patient one two three four five six" -> "PAT-123456"
 *   "open pat dash 1 2 3 4 5 6"                     -> "PAT-123456"
 *   "lookup double five one two three four"         -> "551234"
 */
export const normalizeTranscript = (raw: string): string => {
  const tokens = tokenize(raw);

  // Promote weak homophones ("to", "for", "oh") that touch a digit. Two sweeps
  // (forward then backward) so chains like "one oh oh two" fully resolve.
  const isDigit = (t: Token | undefined): boolean => t?.kind === 'digit';
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t.kind === 'weak' && (isDigit(tokens[i - 1]) || isDigit(tokens[i + 1]))) {
      tokens[i] = { kind: 'digit', value: t.value };
    }
  }
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const t = tokens[i];
    if (t.kind === 'weak' && (isDigit(tokens[i - 1]) || isDigit(tokens[i + 1]))) {
      tokens[i] = { kind: 'digit', value: t.value };
    }
  }

  let out = '';
  for (const t of tokens) {
    switch (t.kind) {
      case 'digit': out += t.value; break;
      case 'prefix': out += 'PAT'; break;
      case 'dash': out += '-'; break;
      case 'break': out += ' '; break; // real separator: digit runs cannot cross it
      case 'weak': out += ' '; break; // an un-promoted homophone was just a word
      case 'filler': break; // transparent
    }
  }
  // "123-456" -> "123456" (dash between digits is a speech artefact, not part of the ID)
  return out.replace(/(\d)-+(?=\d)/g, '$1').replace(/\s+/g, ' ').trim();
};

/**
 * Regex decisions:
 *  - PREFIXED: "PAT" then an optional dash then exactly ID_DIGITS digits. The
 *    trailing (?!\d) rejects 7+ digit runs so a garbled/over-long number is not
 *    silently truncated to the wrong patient.
 *  - BARE: exactly ID_DIGITS digits bounded by non-digits. We avoid lookbehind
 *    ((?<!\d)) because Safari < 16.4 throws a SyntaxError on it at parse time.
 * Both are global so we can take the LAST match (the most recent thing said).
 */
const PREFIXED = new RegExp(`PAT-?(\\d{${ID_DIGITS}})(?!\\d)`, 'g');
const BARE = new RegExp(`(?:^|[^0-9])(\\d{${ID_DIGITS}})(?![0-9])`, 'g');

const lastCapture = (re: RegExp, text: string): { id: string; index: number } | null => {
  let found: { id: string; index: number } | null = null;
  re.lastIndex = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    found = { id: m[1], index: m.index };
    if (m[0].length === 0) re.lastIndex += 1;
  }
  return found;
};

/** Returns a canonical "PAT-123456", or null when no clean ID is present. */
export const extractPatientId = (raw: string): string | null => {
  const text = normalizeTranscript(raw);
  const prefixed = lastCapture(PREFIXED, text);
  const bare = lastCapture(BARE, text);
  // If both exist take the later one (a correction: "PAT 111111 no wait 222222").
  const best = prefixed && bare ? (bare.index > prefixed.index ? bare : prefixed) : prefixed ?? bare;
  return best ? `PAT-${best.id}` : null;
};

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

export type VoiceErrorCode = 'permission-denied' | 'no-microphone' | 'network' | 'unsupported' | 'unknown';

export interface UseVoiceEmergencyOptions {
  /** Fired immediately when a clean patient ID is extracted. */
  onPatientFound: (patientId: string) => void;
  /** BCP-47 tag. Default 'en-US' (ID digits are recognized best in English). */
  lang?: string;
  /** Stop the microphone after a match. Default true (hands-free, but no stray re-triggers). */
  stopOnMatch?: boolean;
  /**
   * An ID seen only in an INTERIM result must stay unchanged this long before we
   * act on it, so "PAT 123456" is not fired while the medic is still saying
   * "...7". Final results fire instantly. Default 500 ms.
   */
  interimConfirmMs?: number;
}

export interface UseVoiceEmergencyResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  errorCode: VoiceErrorCode | null;
  supported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

const MAX_RESTART_DELAY_MS = 3000;

export const useVoiceEmergency = ({
  onPatientFound,
  lang = 'en-US',
  stopOnMatch = true,
  interimConfirmMs = 500,
}: UseVoiceEmergencyOptions): UseVoiceEmergencyResult => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);
  // Start false and flip in an effect so SSR and first client render agree (Next.js hydration).
  const [supported, setSupported] = useState(false);

  const recognitionRef = useRef<VoiceRecognition | null>(null);
  /** The user's intent. onend consults this (not React state) to decide whether to restart. */
  const wantListeningRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const failedRestartsRef = useRef(0);
  const sessionStartedAtRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  /** Results with index < baseline were already consumed by a match. */
  const baselineRef = useRef(0);
  const pendingRef = useRef<{ id: string; timer: number } | null>(null);

  // Keep the latest callback/options without re-creating the recognizer.
  const onFoundRef = useRef(onPatientFound);
  const optsRef = useRef({ lang, stopOnMatch, interimConfirmMs });
  useEffect(() => {
    onFoundRef.current = onPatientFound;
    optsRef.current = { lang, stopOnMatch, interimConfirmMs };
  });

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  /* ------------------------------ audio cue ------------------------------ */

  const ensureAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext ?? (window as VoiceWindow).webkitAudioContext;
        if (Ctx) audioCtxRef.current = new Ctx();
      }
      // Autoplay policy: contexts start "suspended" until resumed inside a user gesture.
      if (audioCtxRef.current?.state === 'suspended') void audioCtxRef.current.resume();
    } catch {
      /* audio is a nicety; never let it break listening */
    }
  }, []);

  const playBeep = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Two rising tones = "confirmed"
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = now + i * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        // Short attack/release envelope avoids the audible "click" of a hard cut
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.12);
      });
    } catch {
      /* ignore */
    }
  }, []);

  /* ----------------------------- housekeeping ---------------------------- */

  const clearRestartTimer = () => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const clearPending = () => {
    if (pendingRef.current) {
      window.clearTimeout(pendingRef.current.timer);
      pendingRef.current = null;
    }
  };

  const fail = (code: VoiceErrorCode, message: string, fatal: boolean) => {
    setError(message);
    setErrorCode(code);
    if (fatal) {
      wantListeningRef.current = false;
      clearRestartTimer();
      setIsListening(false);
    }
  };

  /* ------------------------------ core logic ----------------------------- */

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    clearRestartTimer();
    clearPending();
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const handleMatch = useCallback(
    (id: string, consumedCount: number) => {
      clearPending();
      baselineRef.current = consumedCount;
      playBeep();
      onFoundRef.current(id);
      if (optsRef.current.stopOnMatch) stopListening();
    },
    [playBeep, stopListening],
  );

  const handleResult = useCallback(
    (ev: VoiceRecognitionEvent) => {
      failedRestartsRef.current = 0; // the engine is clearly alive

      const parts: string[] = [];
      for (let i = baselineRef.current; i < ev.results.length; i += 1) {
        parts.push(ev.results[i][0].transcript);
      }
      const text = parts.join(' ').trim();
      setTranscript(text);

      // Garbled speech: no clean ID -> do nothing and keep listening.
      const id = extractPatientId(text);
      if (!id) {
        clearPending();
        return;
      }

      const lastIsFinal = ev.results[ev.results.length - 1].isFinal;
      if (lastIsFinal) {
        handleMatch(id, ev.results.length);
        return;
      }

      // Interim: wait until the same ID has been stable for interimConfirmMs.
      if (pendingRef.current?.id === id) return;
      clearPending();
      const consumed = ev.results.length;
      pendingRef.current = {
        id,
        timer: window.setTimeout(() => handleMatch(id, consumed), optsRef.current.interimConfirmMs),
      };
    },
    [handleMatch],
  );

  const startRecognizer = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      fail('unsupported', 'Speech recognition is not supported in this browser.', true);
      return;
    }

    // A fresh instance each (re)start is more reliable than reusing one that Chrome
    // has silently put into a bad state after a network/no-speech hiccup.
    const rec = new Ctor();
    rec.continuous = true; // keep listening across pauses
    rec.interimResults = true; // live transcript + fastest possible match
    rec.maxAlternatives = 1;
    rec.lang = optsRef.current.lang;

    rec.onstart = () => {
      sessionStartedAtRef.current = Date.now();
      baselineRef.current = 0; // event.results is reset for every new session
      setError(null);
      setErrorCode(null);
      setIsListening(true);
    };

    rec.onresult = handleResult;

    rec.onerror = (ev) => {
      switch (ev.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          fail('permission-denied', 'Microphone access was blocked.', true);
          break;
        case 'audio-capture':
          fail('no-microphone', 'No microphone was found.', true);
          break;
        case 'network':
          // Chrome's recognizer is server-backed. Surface it but keep retrying.
          fail('network', 'Speech service unreachable, retrying…', false);
          break;
        case 'no-speech':
        case 'aborted':
          break; // routine; onend restarts us
        default:
          fail('unknown', `Speech recognition error: ${ev.error}`, false);
      }
    };

    // WORKAROUND: Chrome ends a "continuous" session on its own after ~5-60 s of
    // silence (and after every network blip) WITHOUT any error. If the user still
    // wants to listen we restart, with exponential backoff if it dies instantly
    // (otherwise a revoked permission would spin the CPU in a tight loop).
    rec.onend = () => {
      if (recognitionRef.current === rec) recognitionRef.current = null;
      if (!wantListeningRef.current) {
        setIsListening(false);
        return;
      }
      const lived = Date.now() - sessionStartedAtRef.current;
      failedRestartsRef.current = lived < 1000 ? failedRestartsRef.current + 1 : 0;
      const delay = Math.min(250 * 2 ** failedRestartsRef.current, MAX_RESTART_DELAY_MS);
      clearRestartTimer();
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        if (wantListeningRef.current) startRecognizer();
      }, delay);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      // InvalidStateError: a previous instance has not fully ended yet. Retry shortly.
      recognitionRef.current = null;
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        if (wantListeningRef.current) startRecognizer();
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleResult]);

  const startListening = useCallback(() => {
    if (wantListeningRef.current) return;
    if (!getRecognitionCtor()) {
      fail('unsupported', 'Speech recognition is not supported in this browser.', true);
      return;
    }
    setError(null);
    setErrorCode(null);
    setTranscript('');
    failedRestartsRef.current = 0;
    wantListeningRef.current = true;
    ensureAudio(); // must run inside the click/tap handler
    startRecognizer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureAudio, startRecognizer]);

  // Full teardown on unmount.
  useEffect(
    () => () => {
      wantListeningRef.current = false;
      clearRestartTimer();
      clearPending();
      const rec = recognitionRef.current;
      if (rec) {
        rec.onend = null;
        rec.onresult = null;
        rec.onerror = null;
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
      }
      void audioCtxRef.current?.close().catch(() => undefined);
      audioCtxRef.current = null;
    },
    [],
  );

  return { isListening, transcript, error, errorCode, supported, startListening, stopListening };
};
