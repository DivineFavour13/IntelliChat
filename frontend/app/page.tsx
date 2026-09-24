"use client";

import { useEffect, useState } from "react";
import { Thread } from "@/types/chat";
import { listThreads, createThread, getOrCreateSessionId } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const refreshThreads = async (sid: string) => {
    const list = await listThreads(sid);
    setThreads(list);
    return list;
  };

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    refreshThreads(sid).then((list) => {
      const first = list[0];
      if (first) {
        setActiveThreadId(first.id);
      }
    });
  }, []);

  const handleNewChat = async () => {
    if (!sessionId || isCreating) return;
    setIsCreating(true);
    try {
      const thread = await createThread(sessionId);
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.id);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="flex h-screen">
      {sessionId && (
        <Sidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onSelect={setActiveThreadId}
          onNewChat={handleNewChat}
          isCreating={isCreating}
        />
      )}

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-10 sm:py-16">
        <div className="flex w-full max-w-2xl flex-1 flex-col gap-6">
          <header className="flex items-baseline justify-between">
            <h1 className="text-xl font-semibold tracking-tight">IntelliChat</h1>
            <span className="font-mono text-xs text-muted">v2 — website</span>
          </header>

          {activeThreadId !== null && (
            <ChatWindow
              key={activeThreadId}
              conversationId={activeThreadId}
              onFirstMessageSent={() => sessionId && refreshThreads(sessionId)}
            />
          )}
        </div>
      </div>
    </main>
  );
}