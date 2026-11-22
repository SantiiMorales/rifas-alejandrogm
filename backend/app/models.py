from datetime import datetime, timezone
import json
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    # Tasas solicitadas por el usuario:
    # 1. Bolívares a Pesos: Cantidad de Bs * Tasa = Pesos
    rate_bs_to_cop = Column(Float, nullable=False, default=70.0)
    # 2. Bolívares a Dólares: Cantidad de Bs / Tasa = Dólares (ej: 60 Bs / 60 = 1 USD)
    rate_bs_to_usd = Column(Float, nullable=False, default=60.0)
    # 3. Pesos a Dólares: Cantidad de pesos / Tasa = Dólares (ej: 4200 COP / 4200 = 1 USD)
    rate_cop_to_usd = Column(Float, nullable=False, default=4200.0)

    # Campos auxiliares para visualización directa
    cop_per_usd = Column(Float, nullable=False, default=4200.0)
    bs_per_usd = Column(Float, nullable=False, default=60.0)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class Raffle(Base):
    __tablename__ = "raffles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    total_numbers = Column(Integer, nullable=False, default=100)
    scheme = Column(String(50), default="standard_100")
    ticket_price_usd = Column(Float, nullable=False, default=10.0)
    total_investment_usd = Column(Float, nullable=False, default=500.0)
    min_abono_juego_especial = Column(Float, nullable=False, default=5.0)
    # Múltiples juegos especiales en formato JSON:
    # [{"id": 1, "name": "Sorteo Anticipado 1", "min_amount": 3.0, "draw_date": "2026-12-15"}]
    special_games_json = Column(Text, nullable=True, default='[{"id": 1, "name": "Sorteo Anticipado 1", "min_amount": 3.0, "draw_date": "2026-12-15"}, {"id": 2, "name": "Sorteo Anticipado 2", "min_amount": 5.0, "draw_date": "2026-12-22"}, {"id": 3, "name": "Bono Especial Alejandro GM", "min_amount": 8.0, "draw_date": "2026-12-30"}]')
    status = Column(String(20), default="active")  # active, completed
    created_at = Column(DateTime, default=utcnow)

    tickets = relationship("Ticket", back_populates="raffle", cascade="all, delete-orphan")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    raffle_id = Column(Integer, ForeignKey("raffles.id"), nullable=False)
    ticket_number = Column(String(20), index=True, nullable=False)
    numbers_json = Column(Text, nullable=True)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(50), index=True, nullable=True)
    customer_address = Column(String(200), nullable=True)
    status = Column(String(20), default="available")  # available, reserved, paid
    reserved_at = Column(DateTime, nullable=True)
    total_paid_usd = Column(Float, default=0.0)

    raffle = relationship("Raffle", back_populates="tickets")
    payments = relationship("Payment", back_populates="ticket", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False)  # USD, COP, BS
    exchange_rate_applied = Column(Float, nullable=False, default=1.0)
    amount_usd_equivalent = Column(Float, nullable=False)
    payment_date = Column(DateTime, default=utcnow)
    notes = Column(String(255), nullable=True)

    ticket = relationship("Ticket", back_populates="payments")
