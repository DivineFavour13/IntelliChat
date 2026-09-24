"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/types/chat";
import { streamChatMessage, fetchThreadMessages, ApiError } from "@/lib/api";
import MessageBubble from "@/components/MessageBubble";
import InputBar from "@/components/InputBar";

interface ChatWindowProps {
  conversationId: number;
  /** Called once the first message in a fresh thread gets a title, so the
   * sidebar can refresh and show it instead of "New chat". */
  onFirstMessageSent?: () => void;
}

export default function ChatWindow({ conversationId, onFirstMessageSent }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInteractedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reload messages whenever the selected conversation changes (switching
  // threads in the sidebar, or starting a new one).
  useEffect(() => {
    hasInteractedRef.current = false;
    setMessages([]);
    setError(null);

    fetchThreadMessages(conversationId)
      .then((history) => {
        if (!hasInteractedRef.current) {
          setMessages(history);
        }
      })
      .catch(() => {
        // A brand-new thread has no messages yet — that's fine.
      });
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = async (text: string) => {
    hasInteractedRef.current = true;
    setError(null);
    const wasFirstMessage = messages.length === 0;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsSending(true);
    // Placeholder assistant message that fills in live as chunks arrive.
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      await streamChatMessage(conversationId, text, (textSoFar) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: textSoFar };
          return next;
        });
      });

      if (wasFirstMessage) {
        onFirstMessageSent?.();
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong reaching the assistant.";
      setError(message);
      // Drop the empty placeholder bubble if nothing ever streamed into it.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="custom-scrollbar flex h-[60vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-white/5 p-4">
        {messages.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-muted">
            Say something — I'll remember this conversation as we go.
          </p>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {isSending && messages[messages.length - 1]?.content === "" && (
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