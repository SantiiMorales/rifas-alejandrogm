import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_and_auth(client):
    # Login admin
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert data["username"] == "admin"
    assert data["is_admin"] is True

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify me endpoint
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "admin"


def test_active_raffle_and_tickets(client):
    # Get active raffle
    raffle_resp = client.get("/api/raffles/active")
    assert raffle_resp.status_code == 200
    raffle = raffle_resp.json()
    assert raffle["total_numbers"] == 100
    assert raffle["status"] == "active"
    raffle_id = raffle["id"]

    # Login to get admin token
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Fetch tickets
    tickets_resp = client.get(f"/api/raffles/{raffle_id}/tickets", headers=headers)
    assert tickets_resp.status_code == 200
    tickets = tickets_resp.json()
    assert len(tickets) == 100

    # Test search
    search_resp = client.get(f"/api/raffles/{raffle_id}/tickets?search=Carlos", headers=headers)
    assert search_resp.status_code == 200
    assert len(search_resp.json()) >= 1


def test_reserve_and_payment_flow(client):
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Find an available ticket
    raffle_resp = client.get("/api/raffles/active")
    raffle_id = raffle_resp.json()["id"]

    tickets_resp = client.get(f"/api/raffles/{raffle_id}/tickets?status=available", headers=headers)
    available_tickets = tickets_resp.json()
    assert len(available_tickets) > 0
    test_ticket = available_tickets[0]
    ticket_id = test_ticket["id"]

    # Reserve ticket with initial partial abono in COP ($21,000 COP = $5 USD with 4200 rate)
    reserve_payload = {
        "customer_name": "Pedro Test",
        "customer_phone": "+58 412 1112233",
        "customer_address": "Calle 10, Edif Central",
        "initial_payment": 21000.0,
        "initial_currency": "COP",
        "notes": "Abono 50%",
    }
    res_resp = client.post(f"/api/tickets/{ticket_id}/reserve", json=reserve_payload, headers=headers)
    assert res_resp.status_code == 200
    res_data = res_resp.json()
    assert res_data["status"] == "reserved"
    assert res_data["customer_name"] == "Pedro Test"
    assert res_data["total_paid_usd"] == 5.0
    assert res_data["qualifies_for_special_draw"] is True  # $5 >= min_abono_juego_especial ($5)

    # Add second payment in USD ($5 USD to complete $10)
    pay_payload = {
        "amount": 5.0,
        "currency": "USD",
        "notes": "Pago final restante",
    }
    pay_resp = client.post(f"/api/tickets/{ticket_id}/payment", json=pay_payload, headers=headers)
    assert pay_resp.status_code == 200
    pay_data = pay_resp.json()
    assert pay_data["status"] == "paid"
    assert pay_data["total_paid_usd"] == 10.0
    assert pay_data["balance_usd"] == 0.0


def test_finances_and_rates(client):
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Summary
    summary_resp = client.get("/api/finances/summary", headers=headers)
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert "total_collected_usd" in summary
    assert "total_collected_cop" in summary
    assert "total_collected_bs" in summary
    assert "pending_to_break_even_usd" in summary

    # Daily sales
    sales_resp = client.get("/api/finances/daily-sales", headers=headers)
    assert sales_resp.status_code == 200
    sales_data = sales_resp.json()
    assert "sales" in sales_data

    # Update rates
    rate_payload = {"cop_per_usd": 4300.0, "bs_per_usd": 62.0}
    update_rate_resp = client.put("/api/finances/rates", json=rate_payload, headers=headers)
    assert update_rate_resp.status_code == 200
    assert update_rate_resp.json()["cop_per_usd"] == 4300.0


def test_public_query(client):
    # Query ticket by phone
    pub_resp = client.get("/api/public/ticket?query=5550101")
    assert pub_resp.status_code == 200
    results = pub_resp.json()
    assert len(results) >= 1
    assert results[0]["customer_name"] == "Carlos Mendoza"
