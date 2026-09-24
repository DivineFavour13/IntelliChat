"""
The shared "brain" of the assistant.

The website calls get_assistant_reply() (or stream_assistant_reply() for
live-typing responses). Keeping the AI logic in one place means any future
channel, or any prompt/model improvement, applies everywhere automatically.
"""

from typing import Iterator, TypedDict, Literal

from services.openai_client import call_openai, stream_openai

Role = Literal["user", "assistant"]


class ChatMessage(TypedDict):
    role: Role
    content: str


SYSTEM_PROMPT = (
    "You are a helpful, friendly general-purpose assistant. "
    "Answer clearly and concisely. If you don't know something, say so "
    "rather than guessing."
)


def _build_messages(history: list[ChatMessage], new_message: str) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": new_message})
    return messages


def get_assistant_reply(history: list[ChatMessage], new_message: str) -> str:
    """
    Given the recent conversation history and a new user message, return the
    assistant's full reply as plain text (non-streaming).

    `history` should already be trimmed to the last N messages by the caller
    (see routes/chat.py) — this function doesn't do trimming itself, so it
    stays easy to test and reuse.
    """
    return call_openai(_build_messages(history, new_message))


def stream_assistant_reply(history: list[ChatMessage], new_message: str) -> Iterator[str]:
    """
    Same as get_assistant_reply, but yields the reply incrementally as text
    chunks arrive from the model — used for the live-typing effect on the
    website. Any error from the API surfaces on the *first* call, before any
    chunk is yielded, so callers can still return a clean error response.
    """
    return stream_openai(_build_messages(history, new_message))