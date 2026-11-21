from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# --- Special Games ---
class SpecialGameItem(BaseModel):
    id: int
    name: str
    min_amount: float


# --- Exchange Rates ---
class ExchangeRateBase(BaseModel):
    # Fórmulas solicitadas:
    # 1. Bolívares a Pesos: Cantidad de Bs * Taza = Pesos
    rate_bs_to_cop: float = Field(70.0, gt=0, description="Cantidad de Bs * Tasa = Pesos")
    # 2. Bolívares a Dólares: Cantidad de Bs / Taza = Dólares
    rate_bs_to_usd: float = Field(60.0, gt=0, description="Cantidad de Bs / Tasa = Dólares")
    # 3. Pesos a Dólares: Cantidad de pesos / Taza = Dólares
    rate_cop_to_usd: float = Field(4200.0, gt=0, description="Cantidad de pesos / Tasa = Dólares")

    cop_per_usd: Optional[float] = 4200.0
    bs_per_usd: Optional[float] = 60.0


class ExchangeRateUpdate(ExchangeRateBase):
    pass


class ExchangeRateResponse(ExchangeRateBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Payments ---
class PaymentCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Monto del abono o pago")
    currency: str = Field("USD", description="Moneda: USD, COP o BS")
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    ticket_id: int
    amount: float
    currency: str
    exchange_rate_applied: float
    amount_usd_equivalent: float
    payment_date: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# --- Tickets ---
class TicketReserve(BaseModel):
    customer_name: str = Field(..., min_length=2)
    customer_phone: str = Field(..., min_length=4)
    customer_address: Optional[str] = None
    initial_payment: Optional[float] = Field(default=0.0, ge=0)
    initial_currency: Optional[str] = Field(default="USD")
    notes: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    raffle_id: int
    ticket_number: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    status: str
    reserved_at: Optional[datetime] = None
    total_paid_usd: float
    ticket_price_usd: float = 0.0
    balance_usd: float = 0.0
    percent_paid: float = 0.0
    qualifies_for_special_draw: bool = False
    qualified_games: List[str] = []
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True


# --- Raffles ---
class RaffleCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    total_numbers: int = Field(100, ge=10, le=10000)
    ticket_price_usd: float = Field(10.0, gt=0)
    total_investment_usd: float = Field(500.0, ge=0)
    min_abono_juego_especial: Optional[float] = Field(5.0, ge=0)
    special_games: Optional[List[SpecialGameItem]] = None


class RaffleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    total_numbers: int
    ticket_price_usd: float
    total_investment_usd: float
    min_abono_juego_especial: float
    special_games: List[SpecialGameItem] = []
    status: str
    created_at: datetime
    total_tickets: int = 0
    available_tickets: int = 0
    reserved_tickets: int = 0
    paid_tickets: int = 0
    total_collected_usd: float = 0.0

    class Config:
        from_attributes = True


# --- Finances & ROI ---
class FinanceSummaryResponse(BaseModel):
    total_collected_usd: float
    total_collected_cop: float
    total_collected_bs: float
    total_equivalent_usd: float
    total_investment_usd: float
    pending_to_break_even_usd: float
    profit_usd: float
    break_even_reached: bool
    progress_investment_percent: float
    rates: ExchangeRateResponse


class FinanceChartDataPoint(BaseModel):
    date_label: str
    usd: float
    cop_in_usd: float
    bs_in_usd: float
    total_usd: float


class DailySaleItem(BaseModel):
    payment_id: int
    ticket_number: str
    customer_name: str
    customer_phone: str
    amount: float
    currency: str
    amount_usd: float
    payment_date: datetime
    notes: Optional[str] = None


class DailySalesResponse(BaseModel):
    date: str
    total_usd: float
    total_cop: float
    total_bs: float
    total_sales_count: int
    sales: List[DailySaleItem]


# --- Auth ---
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    is_admin: bool
