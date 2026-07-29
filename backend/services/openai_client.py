"""
Thin wrapper around an OpenAI-compatible chat completions API.

Using Groq here instead of OpenAI directly — Groq's API is a drop-in
replacement (same request/response shape) and its free tier requires no
credit card. If you ever want to switch to real OpenAI or another provider,
only this file changes.
"""

import os
from openai import OpenAI

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to your .env file locally, "
                "or as an environment variable in Render for production. "
                "Get a free key at console.groq.com — no credit card needed."
            )
        _client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
    return _client


def call_openai(messages: list[dict], model: str | None = None) -> str:
    """
    messages: list of {"role": "system"|"user"|"assistant", "content": str}
    Returns the assistant's reply text.
    """
    model = model or os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    client = get_client()
    response = client.chat.completions.create(
        model=model,
        messages=messages,  # type: ignore[arg-type]
        temperature=0.7,
    )

    content = response.choices[0].message.content
    return content or ""