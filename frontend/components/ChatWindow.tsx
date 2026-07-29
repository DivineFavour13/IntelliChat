"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/types/chat";
import { sendMessage, fetchHistory, getOrCreateSessionId, ApiError } from "@/lib/api";
import MessageBubble from "@/components/MessageBubble";
import InputBar from "@/components/InputBar";

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const hasInteractedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    fetchHistory(sessionIdRef.current)
      .then((history) => {
        // If the user already sent a message while this fetch was in
        // flight, applying old history now would wipe out what they just
        // saw — so only apply it if nothing's happened yet.
        if (!hasInteractedRef.current) {
          setMessages(history);
        }
      })
      .catch(() => {
        // No history yet is fine — just start with an empty conversation.
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = async (text: string) => {
    hasInteractedRef.current = true;
    setError(null);
    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const reply = await sendMessage(sessionIdRef.current, text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong reaching the assistant.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="custom-scrollbar flex h-[60vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-white/5 p-4">
        {messages.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-muted">
            Say something — I'll remember this conversation as we go.
          </p>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {isSending && (
          <div className="flex gap-1 px-4 py-2">
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-signal" />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-signal [animation-delay:0.15s]" />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-signal [animation-delay:0.3s]" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <InputBar onSend={handleSend} disabled={isSending} />
    </div>
  );
}