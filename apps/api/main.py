from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from routers import ideas, crawl, saved, settings
from scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield


app = FastAPI(title="IdeaRadar API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", "http://localhost:8080"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ideas.router, prefix="/ideas", tags=["ideas"])
app.include_router(crawl.router, prefix="/crawl", tags=["crawl"])
app.include_router(saved.router, prefix="/saved", tags=["saved"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])


@app.get("/health")
def health():
    return {"status": "ok"}
