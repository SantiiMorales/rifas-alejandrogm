from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..auth import get_current_admin
from ..database import get_db
from ..models import ExchangeRate, Payment, Raffle, Ticket
from ..schemas import (
    DailySalesResponse,
    DailySaleItem,
    ExchangeRateResponse,
    ExchangeRateUpdate,
    FinanceChartDataPoint,
    FinanceSummaryResponse,
)

router = APIRouter(prefix="/api/finances", tags=["finances"])


@router.get("/summary", response_model=FinanceSummaryResponse)
def get_finance_summary(db: Session = Depends(get_db)):
    raffle = (
        db.query(Raffle)
        .filter(Raffle.status == "active")
        .order_by(Raffle.id.desc())
        .first()
    )
    investment = raffle.total_investment_usd if raffle else 0.0

    rates = db.query(ExchangeRate).first()
    if not rates:
        rates = ExchangeRate(
            rate_bs_to_cop=70.0,
            rate_bs_to_usd=60.0,
            rate_cop_to_usd=4200.0,
            cop_per_usd=4200.0,
            bs_per_usd=60.0,
        )
        db.add(rates)
        db.commit()
        db.refresh(rates)

    payments_query = db.query(Payment)
    if raffle:
        payments_query = payments_query.join(Ticket).filter(Ticket.raffle_id == raffle.id)

    payments = payments_query.all()

    usd_direct = sum(p.amount for p in payments if p.currency == "USD")
    cop_direct = sum(p.amount for p in payments if p.currency == "COP")
    bs_direct = sum(p.amount for p in payments if p.currency == "BS")
    total_equiv_usd = sum(p.amount_usd_equivalent for p in payments)

    pending_break_even = max(0.0, investment - total_equiv_usd)
    profit = max(0.0, total_equiv_usd - investment)
    break_even = total_equiv_usd >= investment if investment > 0 else True
    progress = min(100.0, (total_equiv_usd / investment) * 100) if investment > 0 else 100.0

    return FinanceSummaryResponse(
        total_collected_usd=round(usd_direct, 2),
        total_collected_cop=round(cop_direct, 2),
        total_collected_bs=round(bs_direct, 2),
        total_equivalent_usd=round(total_equiv_usd, 2),
        total_investment_usd=round(investment, 2),
        pending_to_break_even_usd=round(pending_break_even, 2),
        profit_usd=round(profit, 2),
        break_even_reached=break_even,
        progress_investment_percent=round(progress, 1),
        rates=ExchangeRateResponse.from_orm(rates),
    )


@router.get("/chart", response_model=List[FinanceChartDataPoint])
def get_finance_chart(
    period: str = Query("day", pattern="^(day|week)$"),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    data_points = []

    SPANISH_DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

    if period == "day":
        for d in range(6, -1, -1):
            day_start = (now - timedelta(days=d)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            label = f"{SPANISH_DAYS_SHORT[day_start.weekday()]} {day_start.strftime('%d/%m')}"

            payments = (
                db.query(Payment)
                .filter(Payment.payment_date >= day_start, Payment.payment_date < day_end)
                .all()
            )

            usd = sum(p.amount for p in payments if p.currency == "USD")
            cop_in_usd = sum(p.amount_usd_equivalent for p in payments if p.currency == "COP")
            bs_in_usd = sum(p.amount_usd_equivalent for p in payments if p.currency == "BS")
            total = sum(p.amount_usd_equivalent for p in payments)

            cop_amount = sum(p.amount for p in payments if p.currency == "COP")
            bs_amount = sum(p.amount for p in payments if p.currency == "BS")
            count_usd = sum(1 for p in payments if p.currency == "USD")
            count_cop = sum(1 for p in payments if p.currency == "COP")
            count_bs = sum(1 for p in payments if p.currency == "BS")
            count_total = len(payments)

            data_points.append(
                FinanceChartDataPoint(
                    date_label=label,
                    usd=round(usd, 2),
                    cop_in_usd=round(cop_in_usd, 2),
                    bs_in_usd=round(bs_in_usd, 2),
                    total_usd=round(total, 2),
                    cop_amount=round(cop_amount, 2),
                    bs_amount=round(bs_amount, 2),
                    count_usd=count_usd,
                    count_cop=count_cop,
                    count_bs=count_bs,
                    count_total=count_total,
                )
            )
    else:
        for w in range(5, -1, -1):
            week_start = (now - timedelta(weeks=w)).replace(hour=0, minute=0, second=0, microsecond=0)
            week_end = week_start + timedelta(weeks=1)
            label = f"Sem {week_start.strftime('%d/%m')}"

            payments = (
                db.query(Payment)
                .filter(Payment.payment_date >= week_start, Payment.payment_date < week_end)
                .all()
            )

            usd = sum(p.amount for p in payments if p.currency == "USD")
            cop_in_usd = sum(p.amount_usd_equivalent for p in payments if p.currency == "COP")
            bs_in_usd = sum(p.amount_usd_equivalent for p in payments if p.currency == "BS")
            total = sum(p.amount_usd_equivalent for p in payments)

            cop_amount = sum(p.amount for p in payments if p.currency == "COP")
            bs_amount = sum(p.amount for p in payments if p.currency == "BS")
            count_usd = sum(1 for p in payments if p.currency == "USD")
            count_cop = sum(1 for p in payments if p.currency == "COP")
            count_bs = sum(1 for p in payments if p.currency == "BS")
            count_total = len(payments)

            data_points.append(
                FinanceChartDataPoint(
                    date_label=label,
                    usd=round(usd, 2),
                    cop_in_usd=round(cop_in_usd, 2),
                    bs_in_usd=round(bs_in_usd, 2),
                    total_usd=round(total, 2),
                    cop_amount=round(cop_amount, 2),
                    bs_amount=round(bs_amount, 2),
                    count_usd=count_usd,
                    count_cop=count_cop,
                    count_bs=count_bs,
                    count_total=count_total,
                )
            )

    return data_points


@router.get("/daily-sales", response_model=DailySalesResponse)
def get_daily_sales(
    date_str: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")
    else:
        target_date = datetime.now(timezone.utc)

    day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    payments = (
        db.query(Payment, Ticket)
        .join(Ticket, Payment.ticket_id == Ticket.id)
        .filter(Payment.payment_date >= day_start, Payment.payment_date < day_end)
        .order_by(Payment.payment_date.desc())
        .all()
    )

    sales = []
    tot_usd = 0.0
    tot_cop = 0.0
    tot_bs = 0.0

    for payment, ticket in payments:
        if payment.currency == "USD":
            tot_usd += payment.amount
        elif payment.currency == "COP":
            tot_cop += payment.amount
        elif payment.currency == "BS":
            tot_bs += payment.amount

        sales.append(
            DailySaleItem(
                payment_id=payment.id,
                ticket_number=ticket.ticket_number,
                customer_name=ticket.customer_name or "Anónimo",
                customer_phone=ticket.customer_phone or "N/A",
                amount=payment.amount,
                currency=payment.currency,
                amount_usd=payment.amount_usd_equivalent,
                payment_date=payment.payment_date,
                notes=payment.notes,
            )
        )

    return DailySalesResponse(
        date=day_start.strftime("%Y-%m-%d"),
        total_usd=round(tot_usd, 2),
        total_cop=round(tot_cop, 2),
        total_bs=round(tot_bs, 2),
        total_sales_count=len(sales),
        sales=sales,
    )


@router.get("/rates", response_model=ExchangeRateResponse)
def get_exchange_rates(db: Session = Depends(get_db)):
    rates = db.query(ExchangeRate).first()
    if not rates:
        rates = ExchangeRate(
            rate_bs_to_cop=70.0,
            rate_bs_to_usd=60.0,
            rate_cop_to_usd=4200.0,
            cop_per_usd=4200.0,
            bs_per_usd=60.0,
        )
        db.add(rates)
        db.commit()
        db.refresh(rates)
    return rates


@router.put("/rates", response_model=ExchangeRateResponse)
def update_exchange_rates(
    payload: ExchangeRateUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    rates = db.query(ExchangeRate).first()
    if not rates:
        rates = ExchangeRate()
        db.add(rates)

    rates.rate_bs_to_cop = payload.rate_bs_to_cop
    rates.rate_bs_to_usd = payload.rate_bs_to_usd
    rates.rate_cop_to_usd = payload.rate_cop_to_usd

    # Valores directos de divisas por USD
    rates.cop_per_usd = payload.rate_cop_to_usd
    rates.bs_per_usd = payload.rate_bs_to_usd

    rates.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rates)
    return rates
