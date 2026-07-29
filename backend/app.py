"""
Flask app entry point.

This is intentionally small: it wires together config, CORS, and route
blueprints. All the actual logic lives in core/, services/, and routes/.
"""

import os
from dotenv import load_dotenv

load_dotenv()  # reads .env into environment variables — must run before any
                # module (like models/db.py) reads os.environ at import time

from flask import Flask, jsonify
from flask_cors import CORS

from routes.chat import chat_bp


def create_app() -> Flask:
    app = Flask(__name__)

    # CORS: only allow the frontend origin(s), never "*" once deployed.
    # Set FRONTEND_ORIGIN in your environment (e.g. https://your-app.vercel.app).
    frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
    CORS(app, origins=[frontend_origin])

    app.register_blueprint(chat_bp, url_prefix="/api")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()

if __name__ == "__main__":
    # Local dev only. In production, Render runs this via gunicorn (see Procfile).
    app.run(debug=True, port=5000)