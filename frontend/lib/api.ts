import { ChatMessage, ChatErrorResponse, Thread } from "@/types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorBody(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as ChatErrorResponse | null;
  return body?.error ?? `Request failed with status ${res.status}`;
}

export async function listThreads(sessionId: string): Promise<Thread[]> {
  const res = await fetch(`${API_BASE_URL}/api/threads?session_id=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new ApiError(await parseErrorBody(res));
  const data = (await res.json()) as { threads: Thread[] };
  return data.threads;
}

export async function createThread(sessionId: string): Promise<Thread> {
  const res = await fetch(`${API_BASE_URL}/api/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new ApiError(await parseErrorBody(res));
  return (await res.json()) as Thread;
}

export async function fetchThreadMessages(conversationId: number): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/api/threads/${conversationId}/messages`);
  if (!res.ok) throw new ApiError(await parseErrorBody(res));
  const data = (await res.json()) as { messages: ChatMessage[] };
  return data.messages;
}

/**
 * Sends a message and streams the reply back chunk by chunk via onChunk,
 * so the UI can render it as it's generated. Resolves with the full reply
 * once the stream ends.
 */
export async function streamChatMessage(
  conversationId: number,
  message: string,
  onChunk: (textSoFar: string) => void
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });

  if (!res.ok || !res.body) {
    throw new ApiError(await parseErrorBody(res));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onChunk(full);
  }

  return full;
}

/**
 * One id per browser, stored in localStorage (not sessionStorage) so saved
 * chats are still there next time you open the site, not just within the
 * current tab.
 */
export function getOrCreateSessionId(): string {
  const key = "chat_session_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}