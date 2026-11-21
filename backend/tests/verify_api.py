import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath("."))

import httpx
from backend.app.main import app
from backend.app.database import Base, engine, SessionLocal
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
        assert r.status_code == 200

        # 2. Login admin
        r = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert r.status_code == 200
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Active raffle with multiple special games
        r = await client.get("/api/raffles/active")
        assert r.status_code == 200
        raffle = r.json()
        assert len(raffle["special_games"]) >= 2
        print(f"Raffle has {len(raffle['special_games'])} special games configured:")
        for g in raffle["special_games"]:
            print(f" - {g['name']} (Min: ${g['min_amount']} USD)")
        raffle_id = raffle["id"]

        # 4. Tickets list (Now accessible without blocking)
        r = await client.get(f"/api/raffles/{raffle_id}/tickets")
        assert r.status_code == 200
        tickets = r.json()
        assert len(tickets) == 100
        print(f"Fetched {len(tickets)} tickets successfully")

        # 5. Check qualified games on ticket with abono
        reserved = [t for t in tickets if t["status"] == "reserved"]
        assert len(reserved) > 0
        first_res = reserved[0]
        print(f"Ticket #{first_res['ticket_number']} has qualified games: {first_res['qualified_games']}")

        # 6. Reserve an available ticket with COP
        avail = [t for t in tickets if t["status"] == "available"][0]
        ticket_id = avail["id"]
        # 21000 COP / 4200 = 5.0 USD
        r = await client.post(
            f"/api/tickets/{ticket_id}/reserve",
            json={
                "customer_name": "Gabriel Marquez",
                "customer_phone": "+58 412 8887766",
                "customer_address": "Av. Libertador",
                "initial_payment": 21000.0,
                "initial_currency": "COP",
                "notes": "Abono inicial",
            },
            headers=headers,
        )
        assert r.status_code == 200
        res_data = r.json()
        assert res_data["status"] == "reserved"
        assert res_data["total_paid_usd"] == 5.0
        assert len(res_data["qualified_games"]) >= 1

        # 7. Add payment to complete 100%
        r = await client.post(
            f"/api/tickets/{ticket_id}/payment",
            json={"amount": 5.0, "currency": "USD", "notes": "Completando pago"},
            headers=headers,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "paid"

        # 8. Check Exchange Rates endpoint with requested formulas
        r = await client.get("/api/finances/rates")
        assert r.status_code == 200
        rates = r.json()
        assert "rate_bs_to_cop" in rates
        assert "rate_bs_to_usd" in rates
        assert "rate_cop_to_usd" in rates
        print(f"Exchange rates: Bs->COP: {rates['rate_bs_to_cop']}, Bs->USD: {rates['rate_bs_to_usd']}, COP->USD: {rates['rate_cop_to_usd']}")

        # 9. Update rates
        r = await client.put(
            "/api/finances/rates",
            json={"rate_bs_to_cop": 75.0, "rate_bs_to_usd": 62.0, "rate_cop_to_usd": 4300.0},
            headers=headers,
        )
        assert r.status_code == 200
        assert r.json()["rate_bs_to_cop"] == 75.0
        assert r.json()["rate_bs_to_usd"] == 62.0

        # 10. Public query
        r = await client.get("/api/public/ticket?query=8887766")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    print("\n>>> ALL TESTS PASSED WITH NEW SPECIAL GAMES & RATE FORMULAS! <<<")


if __name__ == "__main__":
    asyncio.run(main())
