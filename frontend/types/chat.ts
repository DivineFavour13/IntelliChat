export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
  created_at?: string;
}

export interface ChatResponse {
  reply: string;
}

export interface ChatErrorResponse {
  error: string;
  detail?: string;
}
