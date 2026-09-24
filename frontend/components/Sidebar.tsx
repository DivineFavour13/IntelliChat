"use client";

import { Thread } from "@/types/chat";

interface SidebarProps {
  threads: Thread[];
  activeThreadId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  isCreating?: boolean;
}

export default function Sidebar({
  threads,
  activeThreadId,
  onSelect,
  onNewChat,
  isCreating,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-3 border-r border-white/5 p-3">
      <button
        onClick={onNewChat}
        disabled={isCreating}
        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-panel px-3 py-2 text-sm font-medium text-paper transition-opacity hover:border-signal/40 disabled:opacity-50"
      >
        + New chat
      </button>

      <div className="custom-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto">
        {threads.map((t) => {
          const isActive = t.id === activeThreadId;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "bg-userBubble text-paper"
                  : "text-muted hover:bg-panel hover:text-paper"
              }`}
              title={t.title ?? "New chat"}
            >
              {t.title ?? "New chat"}
            </button>
          );
        })}

        {threads.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted">No chats yet.</p>
        )}
      </div>
    </aside>
  );
}