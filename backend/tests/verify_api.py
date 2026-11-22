import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath("."))

import httpx
from backend.app.main import app
from backend.app.database import Base, engine, SessionLocal
from backend.app.models import Raffle
from backend.app.seed import seed_initial_data


async def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        r = await client.get("/api/health")
        assert r.status_code == 200, f"Health check falló: {r.status_code}"
        print("✓ Health check OK")

        # 2. POST /api/raffles SIN token → 401
        r = await client.post("/api/raffles", json={
            "title": "Rifa sin auth",
            "total_numbers": 100,
            "ticket_price_usd": 10.0,
            "total_investment_usd": 400.0,
        })
        assert r.status_code == 401, f"Se esperaba 401, se obtuvo {r.status_code}"
        print("✓ POST /api/raffles sin token → 401")

        # 3. POST /api/tickets/1/reserve SIN token → 401
        r = await client.post("/api/tickets/1/reserve", json={
            "customer_name": "Test",
            "customer_phone": "1234567",
        })
        assert r.status_code == 401, f"Se esperaba 401, se obtuvo {r.status_code}"
        print("✓ POST /api/tickets/1/reserve sin token → 401")

        # 4. Login con credenciales INVÁLIDAS → 401
        r = await client.post("/api/auth/login", json={"username": "admin", "password": "wrong_pass"})
        assert r.status_code == 401, f"Se esperaba 401, se obtuvo {r.status_code}"
        print("✓ Login con credenciales inválidas → 401")

        # 5. Login con credenciales VÁLIDAS → 200 + access_token
        admin_user = os.getenv("ADMIN_USERNAME", "admin")
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        r = await client.post("/api/auth/login", json={"username": admin_user, "password": admin_pass})
        assert r.status_code == 200, f"Login falló: {r.status_code} {r.text}"
        token_data = r.json()
        assert "access_token" in token_data, "No se recibió access_token"
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✓ Login con credenciales válidas → 200 + access_token")

        # 6. GET /api/auth/me con token válido → authenticated: true
        r = await client.get("/api/auth/me", headers=headers)
        assert r.status_code == 200
        assert r.json()["authenticated"] is True
        print("✓ GET /api/auth/me → authenticated: true")

        # 7. POST /api/raffles CON token → 201, elimina anterior y crea nueva
        raffle_id_before = None
        r_active = await client.get("/api/raffles/active")
        if r_active.status_code == 200:
            raffle_id_before = r_active.json()["id"]

        r = await client.post("/api/raffles", json={
            "title": "Rifa de Verificación JWT",
            "description": "Rifa creada en test de seguridad",
            "total_numbers": 333,
            "scheme": "triples_333",
            "ticket_price_usd": 15.0,
            "total_investment_usd": 500.0,
            "special_games": [
                {"id": 1, "name": "Sorteo Anticipado 1", "min_amount": 3.0},
                {"id": 2, "name": "Sorteo Anticipado 2", "min_amount": 5.0},
            ],
        }, headers=headers)
        assert r.status_code == 201, f"Creación de rifa falló: {r.status_code} {r.text}"
        new_raffle = r.json()
        new_raffle_id = new_raffle["id"]
        print(f"✓ POST /api/raffles con token → 201, nueva rifa ID={new_raffle_id}")

        # 8. Verificar que solo existe 1 rifa en la BD
        r = await client.get("/api/raffles", headers=headers)
        all_raffles = r.json()
        assert len(all_raffles) == 1, f"Se esperaba 1 rifa, se encontraron {len(all_raffles)}"
        check_db = SessionLocal()
        try:
            assert check_db.query(Raffle).count() == 1, f"db.query(Raffle).count() esperado 1, se obtuvo {check_db.query(Raffle).count()}"
        finally:
            check_db.close()
        print(f"✓ BD limpia: solo 1 rifa activa (eliminó la anterior ID={raffle_id_before})")

        # 9. Verificar boletos creados (333 para triples_333)
        r = await client.get(f"/api/raffles/{new_raffle_id}/tickets")
        assert r.status_code == 200
        tickets = r.json()
        assert len(tickets) == 333, f"Se esperaban 333 boletos, se encontraron {len(tickets)}"
        print(f"✓ 333 boletos creados correctamente")

        # 10. Apartar boleto #001 CON token → 200
        avail = [t for t in tickets if t["status"] == "available"][0]
        r = await client.post(
            f"/api/tickets/{avail['id']}/reserve",
            json={
                "raffle_id": new_raffle_id,
                "ticket_number": avail["ticket_number"],
                "customer_name": "Verificación JWT",
                "customer_phone": "+58 412 0000001",
                "initial_payment": 5.0,
                "initial_currency": "USD",
            },
            headers=headers,
        )
        assert r.status_code == 200, f"Reserve falló: {r.status_code} {r.text}"
        assert r.json()["status"] == "reserved"
        print(f"✓ Apartar boleto #{avail['ticket_number']} con token → 200")

        # 11. Vista pública sigue siendo accesible SIN token
        r = await client.get("/api/raffles/active")
        assert r.status_code == 200
        r = await client.get(f"/api/raffles/{new_raffle_id}/tickets")
        assert r.status_code == 200
        r = await client.get("/api/finances/rates")
        assert r.status_code == 200
        print("✓ Endpoints públicos accesibles sin token")

    print("\n>>> TODOS LOS TESTS DE SEGURIDAD JWT PASARON CORRECTAMENTE <<<")


if __name__ == "__main__":
    asyncio.run(main())
