"use client";

/**
 * VoiceDictation — Web Speech API live dictation button.
 * Appends transcribed text to whatever textarea/state the parent controls.
 * Falls back gracefully in unsupported browsers.
 */

import { useRef, useState } from "react";

interface VoiceDictationProps {
  /** Called with each recognised phrase — append or replace as needed */
  onTranscript: (text: string) => void;
  /** Disabled while form is submitting */
  disabled?: boolean;
}

// TypeScript doesn't ship SpeechRecognition types universally — declare minimally.
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function VoiceDictation({ onTranscript, disabled }: VoiceDictationProps) {
  // Initialise lazily so it runs only in the browser (avoids SSR issues)
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  });
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  if (!supported) return null;

  function startListening() {
    setError(null);
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = e.results.length - 1; i >= 0; i--) {
        if (e.results[i].isFinal) {
          transcript = e.results[i][0].transcript;
          break;
        }
      }
      if (transcript) onTranscript(transcript.trim() + " ");
    };

    recognition.onerror = () => {
      setError("Microphone access denied or unavailable.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        disabled={disabled}
        title={listening ? "Stop dictation" : "Dictate with your voice"}
        aria-label={listening ? "Stop voice dictation" : "Start voice dictation"}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-50 ${
          listening
            ? "animate-pulse bg-red-100 text-red-700 ring-2 ring-red-400/40"
            : "bg-[var(--surface-hover)] text-[var(--foreground)] hover:bg-[var(--border)]"
        }`}
      >
        <span aria-hidden="true">{listening ? "⏹" : "🎙️"}</span>
        <span>{listening ? "Stop" : "Dictate"}</span>
      </button>

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}

      {listening && (
        <span className="text-xs text-[var(--muted)] animate-pulse" aria-live="polite">
          Listening…
        </span>
      )}
    </div>
  );
}
