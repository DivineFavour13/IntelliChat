import { ChatMessage, ChatResponse, ChatErrorResponse } from "@/types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function sendMessage(sessionId: string, message: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ChatErrorResponse | null;
    throw new ApiError(body?.error ?? `Request failed with status ${res.status}`);
  }

  const data = (await res.json()) as ChatResponse;
  return data.reply;
}

export async function fetchHistory(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/api/conversations/${sessionId}`);
  if (!res.ok) {
    throw new ApiError(`Failed to load history (status ${res.status})`);
  }
  const data = (await res.json()) as { messages: ChatMessage[] };
  return data.messages;
}

/** One id per browser session, so refreshing the tab keeps your history. */
export function getOrCreateSessionId(): string {
  const key = "chat_session_id";
  let id = window.sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(key, id);
  }
  return id;
}
