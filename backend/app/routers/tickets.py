from datetime import datetime, timedelta, timezone
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..auth import get_current_admin
from ..database import get_db
from ..models import ExchangeRate, Payment, Raffle, Ticket
from ..schemas import PaymentCreate, PaymentResponse, TicketReserve, TicketResponse

router = APIRouter(prefix="/api", tags=["tickets"])


def format_ticket(ticket: Ticket, raffle: Raffle) -> TicketResponse:
    ticket_price = raffle.ticket_price_usd
    total_paid = round(ticket.total_paid_usd or 0.0, 2)
    balance = max(0.0, round(ticket_price - total_paid, 2))
    percent = min(100.0, round((total_paid / ticket_price) * 100, 1)) if ticket_price > 0 else 0.0

    # Parsear múltiples juegos especiales
    qualified_games = []
    if raffle.special_games_json:
        try:
            games = json.loads(raffle.special_games_json)
            for g in games:
                min_req = float(g.get("min_amount", 0))
                if total_paid >= min_req and min_req > 0:
                    qualified_games.append(g["name"])
        except Exception:
            pass

    qualifies_any = len(qualified_games) > 0 or (
        total_paid >= raffle.min_abono_juego_especial if raffle.min_abono_juego_especial > 0 else False
    )

    payments_resp = [
        PaymentResponse(
            id=p.id,
            ticket_id=p.ticket_id,
            amount=p.amount,
            currency=p.currency,
            exchange_rate_applied=p.exchange_rate_applied,
            amount_usd_equivalent=p.amount_usd_equivalent,
            payment_date=p.payment_date,
            notes=p.notes,
        )
        for p in sorted(ticket.payments, key=lambda x: x.payment_date, reverse=True)
    ]

    numbers = []
    if getattr(ticket, "numbers_json", None):
        try:
            numbers = json.loads(ticket.numbers_json)
        except Exception:
            numbers = [ticket.ticket_number]
    else:
        numbers = [ticket.ticket_number]

    return TicketResponse(
        id=ticket.id,
        raffle_id=ticket.raffle_id,
        ticket_number=ticket.ticket_number,
        numbers=numbers,
        customer_name=ticket.customer_name,
        customer_phone=ticket.customer_phone,
        customer_address=ticket.customer_address,
        status=ticket.status,
        reserved_at=ticket.reserved_at,
        total_paid_usd=total_paid,
        ticket_price_usd=ticket_price,
        balance_usd=balance,
        percent_paid=percent,
        qualifies_for_special_draw=qualifies_any,
        qualified_games=qualified_games,
        payments=payments_resp,
    )


@router.get("/raffles/{raffle_id}/tickets", response_model=List[TicketResponse])
def get_raffle_tickets(
    raffle_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    reserved_filter: Optional[str] = Query(None),
    special_draw_only: Optional[bool] = Query(False),
    game_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")

    query = db.query(Ticket).filter(Ticket.raffle_id == raffle_id)

    # 1. Filtro por status
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Ticket.status == status_filter.lower())

    # 2. Búsqueda por número, cliente o celular
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.ticket_number.ilike(term),
                Ticket.numbers_json.ilike(term),
                Ticket.customer_name.ilike(term),
                Ticket.customer_phone.ilike(term),
            )
        )

    # 3. Filtro por fecha de apartado (ej: apartadas hace una semana)
    now = datetime.now(timezone.utc)
    if reserved_filter and reserved_filter != "all":
        if reserved_filter == "today":
            one_day_ago = now - timedelta(days=1)
            query = query.filter(Ticket.reserved_at >= one_day_ago)
        elif reserved_filter == "last_3_days":
            three_days_ago = now - timedelta(days=3)
            query = query.filter(Ticket.reserved_at >= three_days_ago)
        elif reserved_filter == "last_week":
            seven_days_ago = now - timedelta(days=7)
            query = query.filter(Ticket.reserved_at >= seven_days_ago)
        elif reserved_filter == "older_than_week":
            seven_days_ago = now - timedelta(days=7)
            query = query.filter(Ticket.reserved_at < seven_days_ago, Ticket.status.in_(["reserved", "paid"]))

    tickets = query.order_by(Ticket.id.asc()).all()

    # Formatear
    result = [format_ticket(t, raffle) for t in tickets]

    # Filtro por juegos especiales
    if special_draw_only:
        result = [t for t in result if t.qualifies_for_special_draw]

    if game_filter and game_filter != "all":
        result = [t for t in result if game_filter in t.qualified_games]

    return result


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket_detail(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    raffle = db.query(Raffle).filter(Raffle.id == ticket.raffle_id).first()
    return format_ticket(ticket, raffle)


@router.post("/tickets/{ticket_id}/reserve", response_model=TicketResponse)
def reserve_ticket(
    ticket_id: int,
    payload: TicketReserve,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    ticket = None

    # 1. Si viene raffle_id y ticket_number, buscar exactamente en esa rifa
    if payload.raffle_id and payload.ticket_number:
        ticket = (
            db.query(Ticket)
            .filter(
                Ticket.raffle_id == payload.raffle_id,
                Ticket.ticket_number == str(payload.ticket_number).strip(),
            )
            .first()
        )

    # 2. Si no se encontró por (raffle_id, ticket_number), buscar por ticket_id
    if not ticket and ticket_id > 0:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    # 3. Validar existencia del ticket en la BD
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El ticket no existe en esta rifa",
        )

    # 4. Validar disponibilidad
    if ticket.status != "available":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este ticket ya no se encuentra disponible",
        )

    # 5. Validar datos requeridos del comprador
    if not payload.customer_name or not payload.customer_name.strip() or not payload.customer_phone or not payload.customer_phone.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre y celular son obligatorios",
        )

    raffle = db.query(Raffle).filter(Raffle.id == ticket.raffle_id).first()
    rates = db.query(ExchangeRate).first()
    if not rates:
        rates = ExchangeRate()

    now = datetime.now(timezone.utc)
    ticket.customer_name = payload.customer_name.strip()
    ticket.customer_phone = payload.customer_phone.strip()
    ticket.customer_address = payload.customer_address.strip() if payload.customer_address else None
    ticket.reserved_at = now
    ticket.status = "reserved"

    # Conversión del abono inicial según las tasas del usuario:
    if payload.initial_payment and payload.initial_payment > 0:
        curr = payload.initial_currency.upper() if payload.initial_currency else "USD"
        rate_applied = 1.0

        if curr == "COP":
            # Pesos a dólares: Cantidad de pesos / Tasa = Dólares
            rate_applied = max(0.0001, rates.rate_cop_to_usd or 4200.0)
            usd_val = round(payload.initial_payment / rate_applied, 2)
        elif curr == "BS":
            # Bolívares a dólares: Cantidad de Bs / Tasa = Dólares
            rate_applied = max(0.0001, rates.rate_bs_to_usd or 60.0)
            usd_val = round(payload.initial_payment / rate_applied, 2)
        else:
            usd_val = round(payload.initial_payment, 2)

        ticket.total_paid_usd = usd_val

        if ticket.total_paid_usd >= raffle.ticket_price_usd:
            ticket.status = "paid"

        payment = Payment(
            ticket_id=ticket.id,
            amount=payload.initial_payment,
            currency=curr,
            exchange_rate_applied=rate_applied,
            amount_usd_equivalent=usd_val,
            payment_date=now,
            notes=payload.notes or "Abono inicial al apartar",
        )
        db.add(payment)

    db.commit()
    db.refresh(ticket)
    return format_ticket(ticket, raffle)


@router.post("/tickets/{ticket_id}/payment", response_model=TicketResponse)
def add_ticket_payment(
    ticket_id: int,
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if ticket.status == "available":
        raise HTTPException(status_code=400, detail="Debe apartar el ticket a nombre de un cliente antes de registrar pagos")

    raffle = db.query(Raffle).filter(Raffle.id == ticket.raffle_id).first()
    rates = db.query(ExchangeRate).first()
    if not rates:
        rates = ExchangeRate()

    curr = payload.currency.upper()
    rate_applied = 1.0

    if curr == "COP":
        # Pesos a dólares: Cantidad de pesos / Tasa = Dólares
        rate_applied = max(0.0001, rates.rate_cop_to_usd or 4200.0)
        usd_val = round(payload.amount / rate_applied, 2)
    elif curr == "BS":
        # Bolívares a dólares: Cantidad de Bs / Tasa = Dólares
        rate_applied = max(0.0001, rates.rate_bs_to_usd or 60.0)
        usd_val = round(payload.amount / rate_applied, 2)
    else:
        usd_val = round(payload.amount, 2)

    ticket.total_paid_usd = round((ticket.total_paid_usd or 0.0) + usd_val, 2)

    if ticket.total_paid_usd >= raffle.ticket_price_usd:
        ticket.status = "paid"
    else:
        ticket.status = "reserved"

    now = datetime.now(timezone.utc)
    payment = Payment(
        ticket_id=ticket.id,
        amount=payload.amount,
        currency=curr,
        exchange_rate_applied=rate_applied,
        amount_usd_equivalent=usd_val,
        payment_date=now,
        notes=payload.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(ticket)
    return format_ticket(ticket, raffle)


@router.post("/tickets/{ticket_id}/release", response_model=TicketResponse)
def release_ticket(ticket_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    raffle = db.query(Raffle).filter(Raffle.id == ticket.raffle_id).first()

    db.query(Payment).filter(Payment.ticket_id == ticket.id).delete()
    ticket.customer_name = None
    ticket.customer_phone = None
    ticket.customer_address = None
    ticket.reserved_at = None
    ticket.total_paid_usd = 0.0
    ticket.status = "available"

    db.commit()
    db.refresh(ticket)
    return format_ticket(ticket, raffle)
