# IntelliChat — MVP Scaffold (website only)

This is the Phase 1–5 scaffold from the project plan: a working website chat,
backed by Flask + PostgreSQL, with the shared assistant logic already
structured so WhatsApp and Instagram can be bolted on later without touching
this code.

## What's here

```
ai-chatbot/
├── backend/     Flask API (Python)
└── frontend/    Next.js + TypeScript (React)
```

## Run the backend locally

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env: add your OPENAI_API_KEY and DATABASE_URL (Neon connection string)

python app.py
```

Backend runs at `http://localhost:5000`. Visit `http://localhost:5000/api/health`
to confirm it's up.

## Run the frontend locally

```bash
cd frontend
npm install

cp .env.local.example .env.local
# defaults to http://localhost:5000, which matches the backend above

npm run dev
```

Frontend runs at `http://localhost:3000`.

## Getting a free Postgres database (Neon)

1. Create a free account at neon.tech
2. Create a new project — Neon gives you a connection string immediately
3. Paste that connection string into `backend/.env` as `DATABASE_URL`
4. Tables are created automatically the first time the backend starts (via `init_db()`)

## Deploying

**Backend → Render:**
1. Push this repo to GitHub
2. New Web Service on Render, point it at `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app` (already in the Procfile)
5. Add environment variables: `OPENAI_API_KEY`, `DATABASE_URL`, `FRONTEND_ORIGIN` (your Vercel URL once you have it)

**Frontend → Vercel:**
1. New Project on Vercel, point it at `frontend/`
2. Add environment variable: `NEXT_PUBLIC_API_BASE_URL` = your Render backend URL
3. Deploy

Once both are live, update `FRONTEND_ORIGIN` on Render to your real Vercel URL
(CORS will reject requests from it otherwise).

## What's intentionally not here yet

- WhatsApp / Instagram webhooks (Phase 6–7 in the plan)
- Voice input/output, streaming responses, multi-thread history (Phase 2 features)

These build on top of `core/assistant.py` without changing it — that's the point
of keeping the assistant logic separate from any one channel.
