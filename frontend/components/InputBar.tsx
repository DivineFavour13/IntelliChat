"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

// The Web Speech API's SpeechRecognition constructor isn't in TypeScript's
// built-in DOM types yet, and browsers still expose it under the vendor-
// prefixed "webkitSpeechRecognition" name (Chrome/Edge) as well as the
// unprefixed one (some others) — this type covers both without `any`.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Roughly 5 lines at text-sm (14px, ~20px line-height) plus the box's own
  // vertical padding — past this, the box stops growing and scrolls instead.
  const MAX_HEIGHT_PX = 132;

  useEffect(() => {
    setVoiceSupported(getSpeechRecognition() !== null);
  }, []);

  // Re-measure and resize the textarea every time its content changes, so
  // it grows line by line as the person types (or as speech-to-text fills
  // it in), capping out at MAX_HEIGHT_PX and scrolling beyond that.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      // Concatenate every result segment so far (interim + final) into one
      // string, so the textarea updates live as the person speaks.
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setValue(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-panel p-2">
      {voiceSupported && (
        <button
          onClick={toggleVoice}
          disabled={disabled}
          title={isListening ? "Stop listening" : "Speak your message"}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm transition-colors disabled:opacity-30 ${
            isListening
              ? "bg-signal text-ink"
              : "bg-userBubble text-paper hover:bg-userBubble/70"
          }`}
        >
          {isListening ? "●" : "🎤"}
        </button>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening…" : "Type your message…"}
        rows={1}
        disabled={disabled}
        className="custom-scrollbar flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm text-paper placeholder:text-muted focus:outline-none disabled:opacity-50"
        style={{ maxHeight: MAX_HEIGHT_PX }}
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="rounded-xl bg-signal px-4 py-2 text-sm font-medium text-ink transition-opacity disabled:opacity-30"
      >
        Send
      </button>
    </div>
  );
}