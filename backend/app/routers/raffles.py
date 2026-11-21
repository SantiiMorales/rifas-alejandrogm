import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Raffle, Ticket, User
from ..schemas import RaffleCreate, RaffleResponse, SpecialGameItem

router = APIRouter(prefix="/api/raffles", tags=["raffles"])


def enrich_raffle_response(raffle: Raffle, db: Session) -> RaffleResponse:
    tickets = db.query(Ticket).filter(Ticket.raffle_id == raffle.id).all()
    total_tickets = len(tickets)
    available = sum(1 for t in tickets if t.status == "available")
    reserved = sum(1 for t in tickets if t.status == "reserved")
    paid = sum(1 for t in tickets if t.status == "paid")
    total_collected_usd = sum(t.total_paid_usd for t in tickets)

    special_games_list = []
    if raffle.special_games_json:
        try:
            raw_games = json.loads(raffle.special_games_json)
            special_games_list = [
                SpecialGameItem(id=g.get("id", i + 1), name=g["name"], min_amount=float(g["min_amount"]))
                for i, g in enumerate(raw_games)
            ]
        except Exception:
            special_games_list = []

    return RaffleResponse(
        id=raffle.id,
        title=raffle.title,
        description=raffle.description,
        total_numbers=raffle.total_numbers,
        ticket_price_usd=raffle.ticket_price_usd,
        total_investment_usd=raffle.total_investment_usd,
        min_abono_juego_especial=raffle.min_abono_juego_especial,
        special_games=special_games_list,
        status=raffle.status,
        created_at=raffle.created_at,
        total_tickets=total_tickets,
        available_tickets=available,
        reserved_tickets=reserved,
        paid_tickets=paid,
        total_collected_usd=round(total_collected_usd, 2),
    )


@router.get("/active", response_model=RaffleResponse)
def get_active_raffle(db: Session = Depends(get_db)):
    raffle = (
        db.query(Raffle)
        .filter(Raffle.status == "active")
        .order_by(Raffle.id.desc())
        .first()
    )
    if not raffle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay ninguna rifa activa en este momento",
        )
    return enrich_raffle_response(raffle, db)


@router.get("", response_model=List[RaffleResponse])
def list_raffles(db: Session = Depends(get_db)):
    raffles = db.query(Raffle).order_by(Raffle.id.desc()).all()
    return [enrich_raffle_response(r, db) for r in raffles]


@router.post("", response_model=RaffleResponse, status_code=status.HTTP_201_CREATED)
def create_raffle(
    payload: RaffleCreate,
    db: Session = Depends(get_db),
):
    db.query(Raffle).filter(Raffle.status == "active").update({"status": "completed"})

    special_games_json = "[]"
    if payload.special_games:
        special_games_json = json.dumps([g.dict() for g in payload.special_games])
    else:
        # Default games
        special_games_json = json.dumps([
            {"id": 1, "name": "Sorteo Anticipado 1", "min_amount": 3.0},
            {"id": 2, "name": "Sorteo Anticipado 2", "min_amount": 5.0},
            {"id": 3, "name": "Sorteo Especial Fin de Semana", "min_amount": 8.0},
        ])

    new_raffle = Raffle(
        title=payload.title,
        description=payload.description,
        total_numbers=payload.total_numbers,
        ticket_price_usd=payload.ticket_price_usd,
        total_investment_usd=payload.total_investment_usd,
        min_abono_juego_especial=payload.min_abono_juego_especial or 5.0,
        special_games_json=special_games_json,
        status="active",
    )
    db.add(new_raffle)
    db.commit()
    db.refresh(new_raffle)

    padding = len(str(payload.total_numbers - 1))
    tickets_to_create = []
    for i in range(payload.total_numbers):
        num_str = str(i).zfill(padding)
        tickets_to_create.append(
            Ticket(
                raffle_id=new_raffle.id,
                ticket_number=num_str,
                status="available",
                total_paid_usd=0.0,
            )
        )
    db.bulk_save_objects(tickets_to_create)
    db.commit()

    return enrich_raffle_response(new_raffle, db)
