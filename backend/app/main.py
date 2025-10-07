from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import auth, users, centres, studies, reports, billing, ai, imaging_machines

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="PACS System", lifespan=lifespan)

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://teleradiology-pacs-app-ubdzmbb7.devinapps.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(centres.router)
app.include_router(studies.router)
app.include_router(reports.router)
app.include_router(billing.router)
app.include_router(ai.router)
app.include_router(imaging_machines.router)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "PACS System API", "version": "1.0.0"}
