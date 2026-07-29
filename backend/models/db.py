"""
Database models and session setup, using SQLAlchemy against PostgreSQL
(Neon, Supabase, or any Postgres host — set DATABASE_URL in your env).

Schema:
  conversations: one row per (channel, external_user_id) pair
  messages: every user/assistant message, linked to a conversation
"""

import os
from datetime import datetime, timezone

from sqlalchemy import create_engine, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
)


class Base(DeclarativeBase):
    pass


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    channel: Mapped[str] = mapped_column(String(20))  # "website" | "whatsapp" | "instagram"
    external_user_id: Mapped[str] = mapped_column(String(255), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"))
    role: Mapped[str] = mapped_column(String(20))  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


def _database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Add your Neon/Postgres connection string "
            "to .env locally, or as an environment variable in Render."
        )
    # SQLAlchemy + psycopg (v3) wants "postgresql+psycopg://"; Neon/hosts
    # usually give you "postgres://" or plain "postgresql://" — normalize
    # either to psycopg. Unlike pg8000, psycopg wraps libpq directly, so
    # Neon's "sslmode=require" and "channel_binding=require" params are
    # understood natively — no translation needed at all.
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


engine = create_engine(_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def init_db() -> None:
    """Create tables if they don't exist yet. Call once on startup."""
    Base.metadata.create_all(bind=engine)


def get_or_create_conversation(
    session, channel: str, external_user_id: str
) -> Conversation:
    convo = (
        session.query(Conversation)
        .filter_by(channel=channel, external_user_id=external_user_id)
        .first()
    )
    if convo is None:
        convo = Conversation(channel=channel, external_user_id=external_user_id)
        session.add(convo)
        session.commit()
        session.refresh(convo)
    return convo


def get_recent_messages(session, conversation_id: int, limit: int = 10) -> list[Message]:
    return (
        session.query(Message)
        .filter_by(conversation_id=conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()[::-1]  # re-reverse to chronological order
    )


def save_message(session, conversation_id: int, role: str, content: str) -> Message:
    msg = Message(conversation_id=conversation_id, role=role, content=content)
    session.add(msg)
    session.commit()
    return msg