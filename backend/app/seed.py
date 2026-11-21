from datetime import datetime, timedelta, timezone
import json
from sqlalchemy.orm import Session
from .models import User, ExchangeRate, Raffle, Ticket, Payment
from .auth import hash_password


def seed_initial_data(db: Session):
    if db.query(User).first():
        return

    # 1. Admin
    admin = User(
        username="admin",
        password_hash=hash_password("admin123"),
        is_admin=True,
    )
    db.add(admin)

    # 2. Exchange Rates con fórmulas solicitadas
    # - Bolivares a Pesos: Cantidad de Bs * Taza = Pesos (ej: 70)
    # - Bolivares a Dolares: Cantidad de Bs / Taza = Dolares (ej: 600 Bs / 60 = 10 USD)
    # - Pesos a Dolares: Cantidad de pesos / Taza = Dolares (ej: 42000 COP / 4200 = 10 USD)
    rates = ExchangeRate(
        rate_bs_to_cop=70.0,
        rate_bs_to_usd=60.0,
        rate_cop_to_usd=4200.0,
        cop_per_usd=4200.0,
        bs_per_usd=60.0,
    )
    db.add(rates)
    db.commit()

    # 3. Rifa inicial con múltiples juegos especiales
    special_games = [
        {"id": 1, "name": "Sorteo Anticipado 1 - Tanque Lleno", "min_amount": 3.0},
        {"id": 2, "name": "Sorteo Anticipado 2 - Casco Certificado", "min_amount": 5.0},
        {"id": 3, "name": "Bono Especial Alejandro GM ($100 USD)", "min_amount": 8.0},
    ]

    raffle = Raffle(
        title="Gran Sorteo Moto Bera SBR 2026 - Alejandro GM",
        description="Sorteo oficial con 100 números (00 al 99). Primer premio: Moto Bera SBR 0km + Tanque Lleno. Múltiples sorteos anticipados con tus abonos.",
        total_numbers=100,
        ticket_price_usd=10.0,
        total_investment_usd=400.0,
        min_abono_juego_especial=3.0,
        special_games_json=json.dumps(special_games),
        status="active",
    )
    db.add(raffle)
    db.commit()
    db.refresh(raffle)

    # 4. Crear los 100 números con clientes semilla
    now = datetime.now(timezone.utc)
    demo_clients = [
        # (name, phone, addr, pay_amount, currency, rate_divisor, days_ago)
        # Para COP y BS: usd_equiv = pay_amount / rate_divisor
        ("Carlos Mendoza", "+58 412 5550101", "Barquisimeto, Av. Lara", 10.0, "USD", 1.0, 0),
        ("Mariana Silva", "+58 424 9998877", "Caracas, El Paraíso", 42000.0, "COP", 4200.0, 0),
        ("Andrés Eloy", "+58 414 1234567", "Maracaibo, 5 de Julio", 600.0, "BS", 60.0, 1),
        ("Yorbi Hernández", "+58 416 7772211", "San Cristóbal, Barrio Obrero", 5.0, "USD", 1.0, 2),
        ("Daniela Morales", "+58 424 3331122", "Valencia, Los Sauces", 21000.0, "COP", 4200.0, 3),
        ("Roberto Gómez", "+58 412 8889900", "Puerto Ordaz, Alta Vista", 120.0, "BS", 60.0, 7),
        ("Alejandra Pérez", "+58 414 6665544", "Mérida, El Vigía", 10.0, "USD", 1.0, 1),
        ("José Gregorio", "+58 416 3334455", "Barinas, Centro", 300.0, "BS", 60.0, 0),
    ]

    for i in range(100):
        num_str = f"{i:02d}"
        ticket = Ticket(
            raffle_id=raffle.id,
            ticket_number=num_str,
            status="available",
            total_paid_usd=0.0,
        )

        if i < len(demo_clients):
            name, phone, addr, pay_amount, curr, rate_factor, days_ago = demo_clients[i]
            if curr == "USD":
                usd_equiv = round(pay_amount, 2)
            elif curr == "COP":
                # Pesos a dólares: Cantidad / Tasa = USD
                usd_equiv = round(pay_amount / rate_factor, 2)
            else:
                # Bolívares a dólares: Cantidad / Tasa = USD
                usd_equiv = round(pay_amount / rate_factor, 2)

            pay_date = now - timedelta(days=days_ago, hours=i * 2)

            ticket.customer_name = name
            ticket.customer_phone = phone
            ticket.customer_address = addr
            ticket.reserved_at = pay_date
            ticket.total_paid_usd = usd_equiv

            if usd_equiv >= raffle.ticket_price_usd:
                ticket.status = "paid"
            else:
                ticket.status = "reserved"

            db.add(ticket)
            db.commit()
            db.refresh(ticket)

            payment = Payment(
                ticket_id=ticket.id,
                amount=pay_amount,
                currency=curr,
                exchange_rate_applied=rate_factor,
                amount_usd_equivalent=usd_equiv,
                payment_date=pay_date,
                notes="Abono inicial registrado" if ticket.status == "reserved" else "Pago completo del ticket",
            )
            db.add(payment)
        else:
            db.add(ticket)

    db.commit()
