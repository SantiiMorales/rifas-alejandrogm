import { TicketSchemeType } from './ticketSchemes';

export interface SpecialGameItem {
  id: number;
  name: string;
  min_amount: number;
  drawDate?: string;
}

export interface ExchangeRate {
  id: number;
  // Fórmulas solicitadas por el usuario:
  // 1. Bolivares a Pesos: Cantidad de Bs * Taza = Pesos
  rate_bs_to_cop: number;
  // 2. Bolivares a Dolares: Cantidad de Bs * Taza = Dolares
  rate_bs_to_usd: number;
  // 3. Pesos a Dolares: Cantidad de pesos * Taza = Dolares
  rate_cop_to_usd: number;
  cop_per_usd: number;
  bs_per_usd: number;
  updated_at?: string;
}

export interface Payment {
  id: number;
  ticket_id: number;
  amount: number;
  currency: 'USD' | 'COP' | 'BS';
  exchange_rate_applied: number;
  amount_usd_equivalent: number;
  payment_date: string;
  notes?: string | null;
}

export interface Ticket {
  id: number;
  raffle_id: number;
  ticket_number: string;
  numbers?: string[];
  row?: number;
  col?: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  status: 'available' | 'reserved' | 'paid';
  reserved_at?: string | null;
  total_paid_usd: number;
  ticket_price_usd: number;
  balance_usd: number;
  percent_paid: number;
  qualifies_for_special_draw: boolean;
  qualified_games: string[];
  payments: Payment[];
}

export interface Raffle {
  id: number;
  title: string;
  description?: string | null;
  total_numbers: number;
  scheme?: TicketSchemeType;
  ticket_price_usd: number;
  total_investment_usd: number;
  min_abono_juego_especial: number;
  special_games: SpecialGameItem[];
  status: 'active' | 'completed';
  created_at: string;
  total_tickets: number;
  available_tickets: number;
  reserved_tickets: number;
  paid_tickets: number;
  total_collected_usd: number;
}

export interface FinanceSummary {
  total_collected_usd: number;
  total_collected_cop: number;
  total_collected_bs: number;
  total_equivalent_usd: number;
  total_investment_usd: number;
  pending_to_break_even_usd: number;
  profit_usd: number;
  break_even_reached: boolean;
  progress_investment_percent: number;
  rates: ExchangeRate;
}

export interface FinanceChartPoint {
  date_label: string;
  usd: number;
  cop_in_usd: number;
  bs_in_usd: number;
  total_usd: number;
  cop_amount?: number;
  bs_amount?: number;
  count_usd?: number;
  count_cop?: number;
  count_bs?: number;
  count_total?: number;
}

export interface DailySaleItem {
  payment_id: number;
  ticket_number: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  currency: 'USD' | 'COP' | 'BS';
  amount_usd: number;
  payment_date: string;
  notes?: string | null;
}

export interface DailySalesResponse {
  date: string;
  total_usd: number;
  total_cop: number;
  total_bs: number;
  total_sales_count: number;
  sales: DailySaleItem[];
}
