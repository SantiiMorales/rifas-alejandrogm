from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# --- Special Games ---
class SpecialGameItem(BaseModel):
    id: Optional[int] = 1
    name: str = Field(..., min_length=1)
    min_amount: Optional[float] = Field(default=3.0, ge=0)
    minAmount: Optional[float] = None
    min_payment: Optional[float] = None
    draw_date: Optional[str] = None
    drawDate: Optional[str] = None

    def get_min_amount(self) -> float:
        if self.min_amount is not None:
            return float(self.min_amount)
        if self.minAmount is not None:
            return float(self.minAmount)
        if self.min_payment is not None:
            return float(self.min_payment)
        return 3.0

    def get_draw_date(self) -> Optional[str]:
        d = self.draw_date or self.drawDate
        return d.strip() if d and d.strip() else None


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
    raffle_id: Optional[int] = None
    ticket_number: Optional[str] = None
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
    numbers: List[str] = []
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
    title: str = Field(..., min_length=2)
    description: Optional[str] = None
    total_numbers: Optional[int] = Field(default=None, ge=10, le=10000)
    total_tickets: Optional[int] = Field(default=None, ge=10, le=10000)
    scheme: Optional[str] = "standard_100"
    ticket_price_usd: Optional[float] = Field(default=None, gt=0)
    ticket_price: Optional[float] = Field(default=None, gt=0)
    total_investment_usd: Optional[float] = Field(default=None, ge=0)
    total_investment: Optional[float] = Field(default=None, ge=0)
    investment: Optional[float] = Field(default=None, ge=0)
    min_abono_juego_especial: Optional[float] = Field(default=None, ge=0)
    min_payment: Optional[float] = Field(default=None, ge=0)
    special_games: Optional[List[SpecialGameItem]] = None

    def get_total_numbers(self) -> int:
        return self.total_numbers or self.total_tickets or 100

    def get_ticket_price(self) -> float:
        return self.ticket_price_usd or self.ticket_price or 10.0

    def get_total_investment(self) -> float:
        if self.total_investment_usd is not None:
            return self.total_investment_usd
        if self.total_investment is not None:
            return self.total_investment
        if self.investment is not None:
            return self.investment
        return 400.0

    def get_min_abono(self) -> float:
        return self.min_abono_juego_especial or self.min_payment or 3.0


class RaffleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    total_numbers: int
    scheme: Optional[str] = "standard_100"
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
    cop_amount: Optional[float] = 0.0
    bs_amount: Optional[float] = 0.0
    count_usd: Optional[int] = 0
    count_cop: Optional[int] = 0
    count_bs: Optional[int] = 0
    count_total: Optional[int] = 0


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
