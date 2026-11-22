import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth import get_current_admin
from ..database import get_db
from ..models import Payment, Raffle, Ticket
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
                SpecialGameItem(
                    id=g.get("id", i + 1),
                    name=g["name"],
                    min_amount=float(g["min_amount"]),
                    draw_date=g.get("draw_date") or g.get("drawDate"),
                    drawDate=g.get("drawDate") or g.get("draw_date"),
                )
                for i, g in enumerate(raw_games)
            ]
        except Exception:
            special_games_list = []

    return RaffleResponse(
        id=raffle.id,
        title=raffle.title,
        description=raffle.description,
        total_numbers=raffle.total_numbers,
        scheme=raffle.scheme or "standard_100",
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
        raffle = db.query(Raffle).order_by(Raffle.id.desc()).first()

    if not raffle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay ninguna rifa activa en este momento",
        )
    return enrich_raffle_response(raffle, db)


@router.get("/{raffle_id}", response_model=RaffleResponse)
def get_raffle_by_id(raffle_id: int, db: Session = Depends(get_db)):
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    if not raffle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rifa no encontrada",
        )
    return enrich_raffle_response(raffle, db)


@router.put("/{raffle_id}/activate", response_model=RaffleResponse)
def activate_raffle(
    raffle_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    if not raffle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rifa no encontrada",
        )
    db.query(Raffle).filter(Raffle.status == "active").update({"status": "completed"})
    raffle.status = "active"
    db.commit()
    db.refresh(raffle)
    return enrich_raffle_response(raffle, db)


@router.get("", response_model=List[RaffleResponse])
def list_raffles(db: Session = Depends(get_db)):
    raffles = db.query(Raffle).order_by(Raffle.id.desc()).all()
    return [enrich_raffle_response(r, db) for r in raffles]


@router.post("", response_model=RaffleResponse, status_code=status.HTTP_201_CREATED)
def create_raffle(
    payload: RaffleCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    try:
        # Eliminación atómica de rifas anteriores en orden de dependencias FK
        old_raffles = db.query(Raffle).all()
        for old in old_raffles:
            old_ticket_ids = [t.id for t in db.query(Ticket.id).filter(Ticket.raffle_id == old.id).all()]
            if old_ticket_ids:
                db.query(Payment).filter(Payment.ticket_id.in_(old_ticket_ids)).delete(synchronize_session=False)
            db.query(Ticket).filter(Ticket.raffle_id == old.id).delete(synchronize_session=False)
        db.query(Raffle).delete(synchronize_session=False)
        db.flush()
        db.expire_all()

        total_numbers = payload.get_total_numbers()
        ticket_price_usd = payload.get_ticket_price()
        total_investment_usd = payload.get_total_investment()
        min_abono = payload.get_min_abono()
        scheme = payload.scheme or (
            "triples_333" if total_numbers == 333 else "pairs_500" if total_numbers == 500 else "standard_100"
        )

        special_games_json = "[]"
        if payload.special_games and len(payload.special_games) > 0:
            games_list = []
            for i, g in enumerate(payload.special_games):
                games_list.append({
                    "id": g.id if g.id is not None else i + 1,
                    "name": g.name.strip(),
                    "min_amount": g.get_min_amount(),
                    "draw_date": g.get_draw_date(),
                    "drawDate": g.get_draw_date(),
                })
            special_games_json = json.dumps(games_list)
        else:
            special_games_json = json.dumps([
                {"id": 1, "name": "Sorteo Anticipado 1", "min_amount": 3.0, "draw_date": None, "drawDate": None},
                {"id": 2, "name": "Sorteo Anticipado 2", "min_amount": 5.0, "draw_date": None, "drawDate": None},
                {"id": 3, "name": "Sorteo Especial Fin de Semana", "min_amount": 8.0, "draw_date": None, "drawDate": None},
            ])

        new_raffle = Raffle(
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description and payload.description.strip() else None,
            total_numbers=total_numbers,
            scheme=scheme,
            ticket_price_usd=ticket_price_usd,
            total_investment_usd=total_investment_usd,
            min_abono_juego_especial=min_abono,
            special_games_json=special_games_json,
            status="active",
        )
        db.add(new_raffle)
        db.flush()

        tickets_to_create = []
        if scheme == "triples_333" or total_numbers == 333:
            for i in range(1, 334):
                n1 = str(i).zfill(3)
                n2 = str(i + 333).zfill(3)
                n3 = str(1000 - i).zfill(3)
                ticket_number = str(i).zfill(3)
                tickets_to_create.append(
                    Ticket(
                        raffle_id=new_raffle.id,
                        ticket_number=ticket_number,
                        numbers_json=json.dumps([n1, n2, n3]),
                        status="available",
                        total_paid_usd=0.0,
                    )
                )
        elif scheme == "pairs_500" or total_numbers == 500:
            for row in range(50):
                for col in range(10):
                    p1_val = row * 10 + col
                    p2_val = 500 + ((p1_val + 12) % 500)
                    p1 = str(p1_val).zfill(3)
                    p2 = str(p2_val).zfill(3)
                    ticket_number = str(p1_val).zfill(3)
                    tickets_to_create.append(
                        Ticket(
                            raffle_id=new_raffle.id,
                            ticket_number=ticket_number,
                            numbers_json=json.dumps([p1, p2]),
                            status="available",
                            total_paid_usd=0.0,
                        )
                    )
        else:
            padding = len(str(total_numbers - 1))
            for i in range(total_numbers):
                num_str = str(i).zfill(padding)
                tickets_to_create.append(
                    Ticket(
                        raffle_id=new_raffle.id,
                        ticket_number=num_str,
                        numbers_json=json.dumps([num_str]),
                        status="available",
                        total_paid_usd=0.0,
                    )
                )

        db.bulk_save_objects(tickets_to_create)
        db.commit()
    except Exception:
        db.rollback()
        raise

    # Re-fetch para evitar identity map stale después del bulk insert
    fresh_raffle = db.query(Raffle).filter(Raffle.id == new_raffle.id).first()
    return enrich_raffle_response(fresh_raffle, db)
