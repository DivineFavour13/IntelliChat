"""
Website-facing chat API.

GET  /api/threads                        -> list this session's saved chats (sidebar)
POST /api/threads                        -> start a new, empty chat
GET  /api/threads/<id>/messages          -> full message history for one chat
POST /api/chat                           -> send a message, stream back the reply
"""

from flask import Blueprint, request, jsonify, Response, stream_with_context

from core.assistant import get_assistant_reply, stream_assistant_reply
from models.db import (
    SessionLocal,
    init_db,
    create_conversation,
    get_or_create_first_conversation,
    list_conversations,
    get_conversation,
    get_recent_messages,
    save_message,
)

chat_bp = Blueprint("chat", __name__)

HISTORY_LIMIT = 10  # how many past messages to send as context


@chat_bp.record_once
def _on_register(setup_state):
    # Ensure tables exist. Cheap no-op if they already do.
    init_db()


def _serialize_conversation(convo) -> dict:
    return {
        "id": convo.id,
        "title": convo.title,  # null until the first message arrives
        "created_at": convo.created_at.isoformat(),
    }


@chat_bp.get("/threads")
def list_threads():
    session_id = (request.args.get("session_id") or "").strip()
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    db = SessionLocal()
    try:
        # First-ever visit: make sure there's at least one thread to show,
        # rather than returning an empty sidebar with nothing to click.
        get_or_create_first_conversation(db, channel="website", external_user_id=session_id)
        threads = list_conversations(db, channel="website", external_user_id=session_id)
        return jsonify({"threads": [_serialize_conversation(t) for t in threads]})
    finally:
        db.close()


@chat_bp.post("/threads")
def new_thread():
    data = request.get_json(silent=True) or {}
    session_id = (data.get("session_id") or "").strip()
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    db = SessionLocal()
    try:
        convo = create_conversation(db, channel="website", external_user_id=session_id)
        return jsonify(_serialize_conversation(convo)), 201
    finally:
        db.close()


@chat_bp.get("/threads/<int:conversation_id>/messages")
def thread_messages(conversation_id: int):
    db = SessionLocal()
    try:
        convo = get_conversation(db, conversation_id)
        if convo is None:
            return jsonify({"error": "not_found"}), 404
        messages = get_recent_messages(db, conversation_id, limit=200)
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


@chat_bp.post("/chat")
def chat():
    """
    Streams the assistant's reply back as plain text, chunk by chunk, so the
    frontend can render it as it's generated. The full reply is only saved
    to the database once the stream finishes.
    """
    data = request.get_json(silent=True) or {}
    conversation_id = data.get("conversation_id")
    message = (data.get("message") or "").strip()

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400
    if not message:
        return jsonify({"error": "message is required"}), 400
    if len(message) > 4000:
        return jsonify({"error": "message is too long"}), 400

    db = SessionLocal()
    convo = get_conversation(db, conversation_id)
    if convo is None:
        db.close()
        return jsonify({"error": "not_found"}), 404

    recent = get_recent_messages(db, convo.id, limit=HISTORY_LIMIT)
    history = [{"role": m.role, "content": m.content} for m in recent]

    try:
        # This line makes the actual API call and raises immediately if
        # something's wrong (bad key, invalid model, Groq down) — before
        # we've committed to a streaming HTTP response we can't cleanly
        # turn into a JSON error anymore.
        chunks = stream_assistant_reply(history, message)
    except Exception as e:  # noqa: BLE001
        db.close()
        return jsonify({"error": "assistant_unavailable", "detail": str(e)}), 502

    # Save the user's message now — even if the stream fails partway
    # through, their message isn't lost.
    save_message(db, convo.id, "user", message)

    def generate():
        full_reply = ""
        try:
            for chunk in chunks:
                full_reply += chunk
                yield chunk
        finally:
            # Runs even if the client disconnects mid-stream, so we still
            # save whatever the assistant had generated so far.
            if full_reply:
                save_message(db, convo.id, "assistant", full_reply)
            db.close()

    return Response(stream_with_context(generate()), mimetype="text/plain")


@chat_bp.post("/chat/sync")
def chat_sync():
    """
    Non-streaming fallback: same as /chat but returns the full reply as JSON
    in one go. Not used by the current frontend, but kept around as a
    simpler integration point (e.g. for testing with curl/Postman).
    """
    data = request.get_json(silent=True) or {}
    conversation_id = data.get("conversation_id")
    message = (data.get("message") or "").strip()

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400
    if not message:
        return jsonify({"error": "message is required"}), 400

    db = SessionLocal()
    try:
        convo = get_conversation(db, conversation_id)
        if convo is None:
            return jsonify({"error": "not_found"}), 404

        recent = get_recent_messages(db, convo.id, limit=HISTORY_LIMIT)
        history = [{"role": m.role, "content": m.content} for m in recent]

        try:
            reply = get_assistant_reply(history, message)
        except Exception as e:  # noqa: BLE001
            return jsonify({"error": "assistant_unavailable", "detail": str(e)}), 502

        save_message(db, convo.id, "user", message)
        save_message(db, convo.id, "assistant", reply)

        return jsonify({"reply": reply})
    finally:
        db.close()