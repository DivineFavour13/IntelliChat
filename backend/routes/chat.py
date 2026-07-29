"""
Website-facing chat API.

POST /api/chat            -> send a message, get a reply
GET  /api/conversations/:session_id -> fetch history for a session
"""

from flask import Blueprint, request, jsonify

from core.assistant import get_assistant_reply
from models.db import (
    SessionLocal,
    init_db,
    get_or_create_conversation,
    get_recent_messages,
    save_message,
)

chat_bp = Blueprint("chat", __name__)

HISTORY_LIMIT = 10  # how many past messages to send as context


@chat_bp.record_once
def _on_register(setup_state):
    # Ensure tables exist. Cheap no-op if they already do.
    init_db()


@chat_bp.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}
    session_id = (data.get("session_id") or "").strip()
    message = (data.get("message") or "").strip()

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400
    if not message:
        return jsonify({"error": "message is required"}), 400
    if len(message) > 4000:
        return jsonify({"error": "message is too long"}), 400

    db = SessionLocal()
    try:
        convo = get_or_create_conversation(db, channel="website", external_user_id=session_id)

        recent = get_recent_messages(db, convo.id, limit=HISTORY_LIMIT)
        history = [{"role": m.role, "content": m.content} for m in recent]

        try:
            reply = get_assistant_reply(history, message)
        except Exception as e:  # noqa: BLE001 — surface a clean error to the client
            return jsonify({"error": "assistant_unavailable", "detail": str(e)}), 502

        save_message(db, convo.id, "user", message)
        save_message(db, convo.id, "assistant", reply)

        return jsonify({"reply": reply})
    finally:
        db.close()


@chat_bp.get("/conversations/<session_id>")
def get_conversation(session_id: str):
    db = SessionLocal()
    try:
        convo = get_or_create_conversation(db, channel="website", external_user_id=session_id)
        messages = get_recent_messages(db, convo.id, limit=100)
        return jsonify(
            {
                "messages": [
                    {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
                    for m in messages
                ]
            }
        )
    finally:
        db.close()
