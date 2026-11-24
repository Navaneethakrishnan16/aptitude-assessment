# Aptitude Assessment Dashboard

A candidate-facing timed aptitude test (registration → instructions → 10-question test → result)
plus an admin panel (dashboard, question bank management, candidate results, settings).

**Live demo:** : https://aptitude-assessment-nine.vercel.app/
**Admin login:** : https://aptitude-assessment-nine.vercel.app/admin/login
**Backend API:** : https://aptitude-assessment-mfvx.onrender.com/
**Backend API Health status:** : https://aptitude-assessment-mfvx.onrender.com/api/health
**Backend API Docs:** : https://aptitude-assessment-mfvx.onrender.com/docs

## AI tools used

**Claude (Claude Sonnet, via Claude.ai)** — used throughout: architecture planning, full backend
and frontend scaffolding, debugging real runtime/deploy errors, and iterating on validation rules.

### Key prompts (chronological)

1. **Initial brief + stack choice**
   > "we will going to start the web application as new as we got an interview to do a task we
   > can use the AI, i will attach all the details so we will start building the APP... we will do
   > this in Typescript and Python fast API, give me all the things to do this and also we gain
   > some knowledge in Python fast API one more thing chose db for this"
   (with the assignment doc attached) — produced the architecture plan, DB choice (SQLite for
   dev / PostgreSQL for deploy), DB schema, and a step-by-step build plan.

2. **Scaffold everything**
   > "yes start and things we need to install"
   — generated the full FastAPI backend (models, schemas, routers, auth, seed script) and the
   full React + TypeScript frontend (all candidate and admin pages, routing, timer logic).

3. **Continue / finish the build**
   > "Continue"
   — completed the remaining pages, fixed a real bug found during testing (the countdown timer
   was being initialized with a placeholder value before the real test duration loaded, which
   would have made it auto-submit almost immediately), and packaged the project.

4. **Deployment troubleshooting (Render)** — shared screenshots of the Render environment
   variables screen and asked where to find/whether to set `ADMIN_SEED_PASSWORD`; shared a
   build-failure log (`Could not open requirements file`) and asked for a fix — diagnosed as a
   missing Root Directory setting (`backend`), since the repo keeps the frontend and backend in
   separate folders.

5. **Deployment (Vercel)**
   > "we will start the frontend deploy"
   — walked through importing the repo, setting Root Directory to `frontend`, and wiring
   `VITE_API_BASE_URL` (frontend) and `CORS_ORIGINS` (backend) so the two deployed services
   could talk to each other.

6. **Validation tightening**
   > "can we show run time errors like enter proper gmail and phone number will be strict by
   > only 10 digits... add a +91 dropdown fixed and a name will be 3 letters and age will be
   > 0-100"
   — added live (as-you-type) field validation, capped the phone input at 10 digits, added a
   fixed +91 prefix, and adjusted name/age rules on both frontend and backend to stay consistent.

### How AI was used vs. reviewed
Claude generated the initial implementation; every piece was then actually run (backend hit with
curl end-to-end: registration, shuffle, scoring, CSV export; frontend built with `npm run build`)
rather than taken on faith, and at least one real bug (the timer initialization issue above) was
caught and fixed this way before deployment.

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, Pydantic, JWT (python-jose) + bcrypt (passlib) for admin auth
- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router, Recharts
- **Database:** PostgreSQL (Neon) in production; SQLite for local development — one `DATABASE_URL`
  env var switches between them, no code changes needed.
- **Deployment:** Render (backend), Vercel (frontend)

## Setup and run (local)

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # edit if you want a non-default JWT secret / DB URL
python seed.py                   # creates admin account + seeds 10 questions
uvicorn app.main:app --reload --port 8000
```
API docs available at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env             # VITE_API_BASE_URL should point at your backend
npm run dev
```
App available at `http://localhost:5173`.

## Deployment

**Backend (Render):**
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  (`seed.py` is idempotent — safe to re-run on every deploy)
- Env vars: `DATABASE_URL`, `JWT_SECRET_KEY`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`,
  `CORS_ORIGINS` (set to the deployed frontend URL), `PYTHON_VERSION`

**Frontend (Vercel):**
- Root Directory: `frontend`
- Framework Preset: Vite (auto-detected)
- Env var: `VITE_API_BASE_URL` (set to the deployed backend URL, no trailing slash) — must be set
  *before* building, since Vite bakes env vars in at build time

## Environment variables

**Backend (`backend/.env`)**
| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | DB connection string | `sqlite:///./aptitude.db` |
| `JWT_SECRET_KEY` | Signs admin JWTs — change for any real deployment | placeholder |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_EXPIRE_MINUTES` | Admin session length | `120` |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Used by `seed.py` to create the admin account | see below |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `http://localhost:5173` |

**Frontend (`frontend/.env`)**
| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend base URL | `http://localhost:8000` |

## Admin credentials (seeded)
Set via `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` before running `seed.py` (or deploying, since
the Start Command runs it automatically). Passwords are stored bcrypt-hashed, never in plain text.
_(Fill in the actual values you used for your deployed instance here before submitting, or note
that the reviewer should ask you for them separately rather than committing real credentials.)_

## Database schema

- **admins** — id, email, password_hash
- **questions** — id, text, option_a–d, correct_option, category (Quantitative / Logical
  Reasoning / Verbal), difficulty (Easy / Medium / Hard), is_active
- **candidates** — id, full_name, email (unique), age, phone, gender, qualification, city,
  created_at
- **attempts** — id, candidate_id (unique — one attempt per candidate), started_at, submitted_at,
  score, percentage, correct/incorrect/unattempted counts, marks_deducted, time_taken_seconds,
  status
- **attempt_answers** — id, attempt_id, question_id, question_order (records the per-candidate
  shuffle so the admin detail view can reconstruct it), selected_option, is_correct
- **settings** — single row: test_duration_minutes, pass_percentage

## Assumptions and notes

- The assignment specifies a marking scheme of +2/correct, −1/wrong, 0/unattempted across 10
  questions (raw max = 20), but separately states the net score display has "maximum 10." These
  two statements are mathematically inconsistent as written. We implemented the marking scheme
  literally (raw score out of 20, percentage = score/20 × 100, pass/fail against the configurable
  percentage cutoff) since that's what's fully specified; the "maximum 10" phrasing is treated as
  likely a typo in the brief.
- Scoring is always computed server-side on submission — the frontend never calculates or can
  tamper with the score.
- Question order is shuffled once per candidate (stored via `question_order`) and is stable
  across an accidental refresh — the candidate doesn't get a new shuffle each reload.
- A registered candidate with no attempt yet can "re-register" (idempotent) in case they close
  the tab before starting; once an attempt is submitted, the same email is permanently blocked
  from a new attempt, per the "one attempt per email" requirement.
- CSV export respects the currently applied search/status filters.
- Registration validation was deliberately customized beyond a generic form: full name requires
  3+ letters, age accepts 0–100 (not just working-age adults), and phone number is locked to a
  10-digit Indian mobile format with a fixed +91 prefix. Email validation is intentionally kept
  generic (not Gmail-restricted) for now.
- No Alembic migrations — `Base.metadata.create_all()` is used for simplicity given the project
  scope; a production system would add migrations.

## Screenshots

 ![API health status](./screenshots/api-health.png)
