from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings as app_settings
from app.database import Base, engine
from app.models import admin, question, candidate, attempt, settings  # noqa: F401 — register models
from app.routers import auth, candidates, questions, tests, admin_dashboard, settings as settings_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Aptitude Assessment Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip().rstrip("/") for o in app_settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(candidates.router)
app.include_router(questions.router)
app.include_router(tests.router)
app.include_router(admin_dashboard.router)
app.include_router(settings_router.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
