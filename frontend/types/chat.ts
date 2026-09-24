export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
  created_at?: string;
}

export interface Thread {
  id: number;
  title: string | null; // null until the first message is sent
  created_at: string;
}

export interface ChatResponse {
  reply: string;
}

export interface ChatErrorResponse {
  error: string;
  detail?: string;
}