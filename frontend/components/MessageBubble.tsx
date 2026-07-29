import { ChatMessage } from "@/types/chat";

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-userBubble text-paper" : "bg-panel text-paper border border-white/5"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.created_at && (
          <span className="mt-1 block font-mono text-[10px] text-muted">
            {formatTime(message.created_at)}
          </span>
        )}
      </div>
    </div>
  );
}
