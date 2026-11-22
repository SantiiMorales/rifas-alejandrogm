from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, SessionLocal, engine
from .seed import seed_initial_data
from .routers import auth, finances, public, raffles, tickets


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de tablas y datos semilla
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Migración segura en SQLite si la BD ya existía sin las nuevas columnas
        from sqlalchemy import text
        try:
            res = db.execute(text("PRAGMA table_info(raffles)")).fetchall()
            cols = [r[1] for r in res]
            if "scheme" not in cols:
                db.execute(text("ALTER TABLE raffles ADD COLUMN scheme VARCHAR(50) DEFAULT 'standard_100'"))
                db.commit()
        except Exception as e:
            print("[Migration] Notice on raffles:", e)

        try:
            res = db.execute(text("PRAGMA table_info(tickets)")).fetchall()
            cols = [r[1] for r in res]
            if "numbers_json" not in cols:
                db.execute(text("ALTER TABLE tickets ADD COLUMN numbers_json TEXT"))
                db.commit()
        except Exception as e:
            print("[Migration] Notice on tickets:", e)

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
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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
        "mode": "sqlite-persistent",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
