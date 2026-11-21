from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, SessionLocal, engine
from .seed import seed_initial_data
from .routers import auth, finances, public, raffles, tickets


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de tablas y datos semilla en memoria
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Rifas Alejandro GM - API",
    description="Sistema de gestión y venta de boletos con soporte multimoneda (USD, COP, BS)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS para comunicación con el frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de routers
app.include_router(auth.router)
app.include_router(raffles.router)
app.include_router(tickets.router)
app.include_router(finances.router)
app.include_router(public.router)


@app.get("/")
def root():
    return {
        "app": "Rifas Alejandro GM API",
        "status": "online",
        "mode": "in-memory",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
