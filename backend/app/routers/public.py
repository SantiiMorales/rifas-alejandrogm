from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import ExchangeRate, Payment, Raffle, Ticket
from ..schemas import TicketResponse
from .tickets import format_ticket

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/ticket", response_model=List[TicketResponse])
def public_query_ticket(
    query: str = Query(..., min_length=1, description="Número de ticket o número de celular"),
    db: Session = Depends(get_db),
):
    term = query.strip()
    clean_phone = term.replace(" ", "").replace("-", "").replace("+", "")

    # Buscar en la rifa activa
    raffle = (
        db.query(Raffle)
        .filter(Raffle.status == "active")
        .order_by(Raffle.id.desc())
        .first()
    )
    if not raffle:
        raise HTTPException(status_code=404, detail="No hay una rifa activa actualmente")

    # Intentar coincidencia exacta o formateada con número de boleto o teléfono
    tickets = (
        db.query(Ticket)
        .filter(
            Ticket.raffle_id == raffle.id,
            or_(
                Ticket.ticket_number == term,
                Ticket.ticket_number == term.zfill(len(str(raffle.total_numbers - 1))),
                Ticket.customer_phone.ilike(f"%{clean_phone}%"),
                Ticket.customer_phone.ilike(f"%{term}%"),
            ),
        )
        .all()
    )

    if not tickets:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró ningún boleto asociado a '{query}'. Verifica el número o celular ingresado.",
        )

    return [format_ticket(t, raffle) for t in tickets]
