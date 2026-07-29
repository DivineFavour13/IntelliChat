"""
The shared "brain" of the assistant.

Every channel (website /api/chat, WhatsApp webhook, Instagram webhook — added
later) calls get_assistant_reply(). This keeps the AI logic in one place, so
improvements here apply everywhere automatically.
"""

from typing import TypedDict, Literal

from services.openai_client import call_openai

Role = Literal["user", "assistant"]


class ChatMessage(TypedDict):
    role: Role
    content: str


SYSTEM_PROMPT = (
    "You are a helpful, friendly general-purpose assistant. "
    "Answer clearly and concisely. If you don't know something, say so "
    "rather than guessing."
)


def get_assistant_reply(history: list[ChatMessage], new_message: str) -> str:
    """
    Given the recent conversation history and a new user message, return the
    assistant's reply as plain text.

    `history` should already be trimmed to the last N messages by the caller
    (see routes/chat.py) — this function doesn't do trimming itself, so it
    stays easy to test and reuse.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": new_message})

    return call_openai(messages)
