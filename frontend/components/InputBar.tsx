"use client";

import { useState, KeyboardEvent } from "react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState("");

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

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-panel p-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message…"
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-paper placeholder:text-muted focus:outline-none disabled:opacity-50"
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
