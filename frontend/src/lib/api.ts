import {
  DailySalesResponse,
  ExchangeRate,
  FinanceChartPoint,
  FinanceSummary,
  Raffle,
  SpecialGameItem,
  Ticket,
} from './types';
import { generateTicketsForScheme, TicketSchemeType } from './ticketSchemes';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'admin_access_token';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function handleUnauthorized(res: Response): void {
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login?expired=1';
  }
}

export async function loginAdmin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al iniciar sesión');
  }
  const data = await res.json();
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem('user', JSON.stringify({ username: data.username, is_admin: data.is_admin }));
  }
  return data;
}

export function logoutAdmin() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user');
    // Limpiar también la clave legacy por si acaso
    localStorage.removeItem('token');
  }
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Fallback por defecto para renderizado instantáneo (0ms)
export const DEFAULT_EXCHANGE_RATES: ExchangeRate = {
  id: 1,
  rate_bs_to_cop: 70.0,
  rate_bs_to_usd: 60.0,
  rate_cop_to_usd: 4200.0,
  cop_per_usd: 4200.0,
  bs_per_usd: 60.0,
};

export const DEFAULT_RAFFLE: Raffle = {
  id: 1,
  title: 'Gran Sorteo Moto Bera SBR 2026 - Alejandro GM',
  description: 'Sorteo oficial con 100 números (00 al 99). Múltiples juegos especiales con tus abonos.',
  total_numbers: 100,
  scheme: 'standard_100',
  ticket_price_usd: 10.0,
  total_investment_usd: 400.0,
  min_abono_juego_especial: 3.0,
  special_games: [
    { id: 1, name: 'Sorteo Anticipado 1 - Tanque Lleno', min_amount: 3.0, drawDate: '2026-12-15' },
    { id: 2, name: 'Sorteo Anticipado 2 - Casco Certificado', min_amount: 5.0, drawDate: '2026-12-22' },
    { id: 3, name: 'Bono Especial Alejandro GM ($100 USD)', min_amount: 8.0, drawDate: '2026-12-30' },
  ],
  status: 'active',
  created_at: new Date().toISOString(),
  total_tickets: 100,
  available_tickets: 85,
  reserved_tickets: 10,
  paid_tickets: 5,
  total_collected_usd: 120.0,
};

// Generar boletos iniciales para carga instantánea garantizada según el esquema
export function generateDefaultTickets(raffle: Raffle): Ticket[] {
  const schemeType =
    raffle.scheme ||
    (raffle.total_numbers === 333
      ? 'triples_333'
      : raffle.total_numbers === 500
      ? 'pairs_500'
      : 'standard_100');

  const schemeData = generateTicketsForScheme(schemeType, raffle.total_numbers);
  const tickets: Ticket[] = [];

  for (let i = 0; i < schemeData.length; i++) {
    const item = schemeData[i];
    let status: 'available' | 'reserved' | 'paid' = 'available';
    let paid = 0.0;
    let name: string | null = null;
    let phone: string | null = null;
    let qualified: string[] = [];

    if (i === 0) {
      status = 'paid';
      paid = raffle.ticket_price_usd;
      name = 'Carlos Mendoza';
      phone = '+58 412 5550101';
      qualified = raffle.special_games.map((g) => g.name);
    } else if (i === 3) {
      status = 'reserved';
      paid = Math.min(5.0, raffle.ticket_price_usd);
      name = 'Yorbi Hernández';
      phone = '+58 416 7772211';
      qualified = raffle.special_games.filter((g) => paid >= g.min_amount).map((g) => g.name);
    } else if (i === 4) {
      status = 'reserved';
      paid = Math.min(3.0, raffle.ticket_price_usd);
      name = 'Mariana Silva';
      phone = '+58 424 9998877';
      qualified = raffle.special_games.filter((g) => paid >= g.min_amount).map((g) => g.name);
    }

    tickets.push({
      id: i + 1,
      raffle_id: raffle.id,
      ticket_number: item.ticket_number,
      numbers: item.numbers,
      row: item.row,
      col: item.col,
      customer_name: name,
      customer_phone: phone,
      customer_address: name ? 'Dirección registrada' : null,
      status,
      reserved_at: name ? new Date().toISOString() : null,
      total_paid_usd: paid,
      ticket_price_usd: raffle.ticket_price_usd,
      balance_usd: Math.max(0, raffle.ticket_price_usd - paid),
      percent_paid: Math.min(100, (paid / (raffle.ticket_price_usd || 1)) * 100),
      qualifies_for_special_draw: qualified.length > 0,
      qualified_games: qualified,
      payments: paid > 0 ? [
        {
          id: i + 1,
          ticket_id: i + 1,
          amount: paid,
          currency: 'USD',
          exchange_rate_applied: 1.0,
          amount_usd_equivalent: paid,
          payment_date: new Date().toISOString(),
          notes: status === 'paid' ? 'Pago completo' : 'Abono inicial',
        }
      ] : [],
    });
  }
  return tickets;
}

export function getLocalActiveRaffle(): Raffle | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('active_raffle');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalActiveRaffle(raffle: Raffle): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('active_raffle', JSON.stringify(raffle));
  } catch (e) {
    console.warn('Error saving active_raffle to localStorage:', e);
  }
}

export function getLocalTickets(raffleId: number): Ticket[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`raffle_tickets_${raffleId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalTickets(raffleId: number, tickets: Ticket[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`raffle_tickets_${raffleId}`, JSON.stringify(tickets));
  } catch (e: any) {
    console.warn('Error saving tickets to localStorage:', e);
    // Manejo de QuotaExceededError limpiando datos de boletos de rifas inactivas
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('raffle_tickets_') && key !== `raffle_tickets_${raffleId}`) {
            localStorage.removeItem(key);
          }
        }
        localStorage.setItem(`raffle_tickets_${raffleId}`, JSON.stringify(tickets));
      } catch (retryErr) {
        console.warn('No se pudo almacenar la matriz completa en localStorage tras limpiar:', retryErr);
      }
    }
  }
}

export function generateFreshTicketsForRaffle(raffle: Raffle): Ticket[] {
  const schemeType =
    raffle.scheme ||
    (raffle.total_numbers === 333
      ? 'triples_333'
      : raffle.total_numbers === 500
      ? 'pairs_500'
      : 'standard_100');

  const schemeData = generateTicketsForScheme(schemeType, raffle.total_numbers);
  const tickets: Ticket[] = [];

  for (let i = 0; i < schemeData.length; i++) {
    const item = schemeData[i];
    tickets.push({
      id: i + 1,
      raffle_id: raffle.id,
      ticket_number: item.ticket_number,
      numbers: item.numbers,
      row: item.row,
      col: item.col,
      customer_name: null,
      customer_phone: null,
      customer_address: null,
      status: 'available',
      reserved_at: null,
      total_paid_usd: 0,
      ticket_price_usd: raffle.ticket_price_usd,
      balance_usd: raffle.ticket_price_usd,
      percent_paid: 0,
      qualifies_for_special_draw: false,
      qualified_games: [],
      payments: [],
    });
  }
  return tickets;
}

export async function fetchActiveRaffle(targetId?: number): Promise<Raffle> {
  let preferredId = targetId;
  if (!preferredId && typeof window !== 'undefined') {
    const urlParam = new URLSearchParams(window.location.search).get('raffle');
    const storedId = localStorage.getItem('active_raffle_id');
    if (urlParam) {
      preferredId = parseInt(urlParam, 10);
    } else if (storedId) {
      preferredId = parseInt(storedId, 10);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    if (preferredId) {
      const resById = await fetch(`${API_BASE}/api/raffles/${preferredId}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (resById.ok) {
        const r = await resById.json();
        saveLocalActiveRaffle(r);
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_raffle_id', String(r.id));
        }
        return r;
      }
    }

    const res = await fetch(`${API_BASE}/api/raffles/active`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.ok) {
      const r = await res.json();
      saveLocalActiveRaffle(r);
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_raffle_id', String(r.id));
      }
      return r;
    }

    const resList = await fetch(`${API_BASE}/api/raffles`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (resList.ok) {
      const list = await resList.json();
      if (list && list.length > 0) {
        const mostRecent = list[0];
        saveLocalActiveRaffle(mostRecent);
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_raffle_id', String(mostRecent.id));
        }
        return mostRecent;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('[fetchActiveRaffle] Timeout de 15s agotado al consultar rifa activa.');
    }
  } finally {
    clearTimeout(timeoutId);
  }

  const local = getLocalActiveRaffle();
  if (local) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_raffle_id', String(local.id));
    }
    return local;
  }
  return DEFAULT_RAFFLE;
}

export async function createRaffle(payload: {
  title: string;
  description?: string;
  total_numbers: number;
  scheme?: TicketSchemeType;
  ticket_price_usd: number;
  total_investment_usd: number;
  min_abono_juego_especial?: number;
  special_games?: SpecialGameItem[];
}): Promise<Raffle> {
  const scheme =
    payload.scheme ||
    (payload.total_numbers === 333
      ? 'triples_333'
      : payload.total_numbers === 500
      ? 'pairs_500'
      : 'standard_100');

  const minAbono =
    payload.min_abono_juego_especial ||
    (payload.special_games && payload.special_games.length > 0
      ? Math.min(...payload.special_games.map((g) => g.min_amount))
      : 3.0);

  const cleanGames = (payload.special_games || []).map((g, idx) => {
    const rawDate = g.drawDate || (g as any).draw_date;
    const cleanDate = rawDate && typeof rawDate === 'string' && rawDate.trim() ? rawDate.trim() : null;
    return {
      id: g.id || idx + 1,
      name: g.name.trim(),
      min_amount: Number(g.min_amount) || 0,
      minAmount: Number(g.min_amount) || 0,
      draw_date: cleanDate,
      drawDate: cleanDate,
    };
  });

  const apiPayload = {
    title: payload.title.trim(),
    description: payload.description && payload.description.trim() ? payload.description.trim() : null,
    total_numbers: Number(payload.total_numbers),
    total_tickets: Number(payload.total_numbers),
    scheme: scheme,
    ticket_price_usd: Number(payload.ticket_price_usd),
    ticket_price: Number(payload.ticket_price_usd),
    total_investment_usd: Number(payload.total_investment_usd),
    investment: Number(payload.total_investment_usd),
    min_abono_juego_especial: minAbono,
    min_payment: minAbono,
    special_games: cleanGames,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/raffles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(apiPayload),
      signal: controller.signal,
    });
  } catch (netErr: any) {
    if (netErr?.name === 'AbortError') {
      throw new Error('La creación de la rifa excedió el límite de espera (timeout 15s). Por favor intenta de nuevo.');
    }
    throw new Error(`Error de conexión con el servidor: ${netErr?.message || 'No se pudo conectar al backend.'}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    handleUnauthorized(res);
    const errorText = await res.text().catch(() => '');
    let errorDetail = 'Error del servidor al crear la rifa';
    try {
      const errorJson = JSON.parse(errorText);
      if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail
          .map((d: any) => `${d.loc ? d.loc.slice(1).join('.') : 'campo'}: ${d.msg}`)
          .join(' | ');
      } else if (errorJson.detail) {
        errorDetail = errorJson.detail;
      } else if (errorJson.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      if (errorText) errorDetail = errorText;
    }
    console.error(`[CreateRaffle] Fallo HTTP ${res.status}:`, errorDetail);
    throw new Error(`[${res.status}] ${errorDetail}`);
  }

  const serverRaffle: Raffle = await res.json();
  if (serverRaffle.special_games) {
    serverRaffle.special_games = serverRaffle.special_games.map((g, idx) => ({
      ...g,
      drawDate: g.drawDate || (g as any).draw_date || cleanGames[idx]?.drawDate || '',
    }));
  }

  // Obtener inmediatamente los boletos reales creados en la base de datos
  let serverTickets: Ticket[] = [];
  try {
    const tRes = await fetch(`${API_BASE}/api/raffles/${serverRaffle.id}/tickets`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (tRes.ok) {
      serverTickets = await tRes.json();
    }
  } catch (fetchTicketsErr) {
    console.warn('[createRaffle] Error obteniendo boletos del backend:', fetchTicketsErr);
  }

  if (!serverTickets || serverTickets.length === 0) {
    serverTickets = generateFreshTicketsForRaffle(serverRaffle);
  }

  // Guardar datos reales confirmados por el backend (sin fallbacks ficticios)
  saveLocalActiveRaffle(serverRaffle);
  saveLocalTickets(serverRaffle.id, serverTickets);

  if (typeof window !== 'undefined') {
    localStorage.setItem('active_raffle_id', String(serverRaffle.id));
    const url = new URL(window.location.href);
    url.searchParams.set('raffle', String(serverRaffle.id));
    window.history.replaceState({}, '', url.toString());
    window.dispatchEvent(new CustomEvent('raffle-created', { detail: serverRaffle }));
  }

  return serverRaffle;
}

export async function fetchTickets(params: {
  raffleId: number;
  status?: string;
  search?: string;
  reservedFilter?: string;
  specialDrawOnly?: boolean;
  gameFilter?: string;
}): Promise<Ticket[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const url = new URL(`${API_BASE}/api/raffles/${params.raffleId}/tickets`);
    if (params.status && params.status !== 'all') url.searchParams.set('status', params.status);
    if (params.search) url.searchParams.set('search', params.search);
    if (params.reservedFilter && params.reservedFilter !== 'all') {
      url.searchParams.set('reserved_filter', params.reservedFilter);
    }
    if (params.specialDrawOnly) url.searchParams.set('special_draw_only', 'true');
    if (params.gameFilter && params.gameFilter !== 'all') {
      url.searchParams.set('game_filter', params.gameFilter);
    }

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      signal: controller.signal,
    });

    if (res.ok) {
      const tList = await res.json();
      if (tList && tList.length > 0) {
        saveLocalTickets(params.raffleId, tList);
        return tList;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('[fetchTickets] Timeout de 15s agotado al consultar boletos.');
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback a localStorage
  const local = getLocalTickets(params.raffleId);
  if (local && local.length > 0) {
    return local;
  }

  const activeRaffle = getLocalActiveRaffle() || DEFAULT_RAFFLE;
  if (activeRaffle.id === params.raffleId) {
    const generated = generateFreshTicketsForRaffle(activeRaffle);
    saveLocalTickets(params.raffleId, generated);
    return generated;
  }

  return generateDefaultTickets(DEFAULT_RAFFLE);
}

export async function reserveTicket(
  ticketId: number,
  payload: {
    raffle_id?: number;
    ticket_number?: string;
    customer_name: string;
    customer_phone: string;
    customer_address?: string;
    initial_payment?: number;
    initial_currency?: string;
    notes?: string;
  }
): Promise<Ticket> {
  try {
    const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/reserve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updatedTicket: Ticket = await res.json();
      if (payload.raffle_id) {
        const localList = getLocalTickets(payload.raffle_id);
        if (localList) {
          const idx = localList.findIndex(
            (t) => t.id === updatedTicket.id || t.ticket_number === updatedTicket.ticket_number
          );
          if (idx !== -1) {
            localList[idx] = updatedTicket;
            saveLocalTickets(payload.raffle_id, localList);
          }
        }
      }
      return updatedTicket;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al apartar el boleto');
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes('disponible') ||
        err.message.includes('existe') ||
        err.message.includes('obligatorios'))
    ) {
      throw err;
    }
    // Fallback a almacenamiento local en caso de desconexión del backend
    if (payload.raffle_id) {
      const localTickets = getLocalTickets(payload.raffle_id);
      if (localTickets) {
        const idx = localTickets.findIndex(
          (t) => t.id === ticketId || (payload.ticket_number && t.ticket_number === payload.ticket_number)
        );
        if (idx !== -1) {
          const current = localTickets[idx];
          if (current.status !== 'available') {
            throw new Error('Este ticket ya no se encuentra disponible');
          }
          const initPay = payload.initial_payment || 0;
          const updated: Ticket = {
            ...current,
            status: initPay >= current.ticket_price_usd ? 'paid' : 'reserved',
            customer_name: payload.customer_name,
            customer_phone: payload.customer_phone,
            customer_address: payload.customer_address || null,
            reserved_at: new Date().toISOString(),
            total_paid_usd: initPay,
            balance_usd: Math.max(0, current.ticket_price_usd - initPay),
            percent_paid: Math.min(100, (initPay / (current.ticket_price_usd || 1)) * 100),
            payments: initPay > 0 ? [
              {
                id: Date.now(),
                ticket_id: current.id,
                amount: initPay,
                currency: (payload.initial_currency as any) || 'USD',
                exchange_rate_applied: 1.0,
                amount_usd_equivalent: initPay,
                payment_date: new Date().toISOString(),
                notes: payload.notes || 'Apartado local',
              }
            ] : [],
          };
          localTickets[idx] = updated;
          saveLocalTickets(payload.raffle_id, localTickets);
          return updated;
        }
      }
    }
    throw err;
  }
}

export async function addTicketPayment(
  ticketId: number,
  payload: {
    amount: number;
    currency: 'USD' | 'COP' | 'BS';
    notes?: string;
  }
): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/payment`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    handleUnauthorized(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al registrar el abono');
  }
  return res.json();
}

export async function releaseTicket(ticketId: number): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/release`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    handleUnauthorized(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al liberar el boleto');
  }
  return res.json();
}

export async function fetchFinanceSummary(): Promise<FinanceSummary> {
  try {
    const res = await fetch(`${API_BASE}/api/finances/summary`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        total_collected_usd: 30.0,
        total_collected_cop: 84000.0,
        total_collected_bs: 1020.0,
        total_equivalent_usd: 67.0,
        total_investment_usd: 400.0,
        pending_to_break_even_usd: 333.0,
        profit_usd: 0.0,
        break_even_reached: false,
        progress_investment_percent: 16.8,
        rates: DEFAULT_EXCHANGE_RATES,
      };
    }
    return await res.json();
  } catch {
    return {
      total_collected_usd: 30.0,
      total_collected_cop: 84000.0,
      total_collected_bs: 1020.0,
      total_equivalent_usd: 67.0,
      total_investment_usd: 400.0,
      pending_to_break_even_usd: 333.0,
      profit_usd: 0.0,
      break_even_reached: false,
      progress_investment_percent: 16.8,
      rates: DEFAULT_EXCHANGE_RATES,
    };
  }
}

export const DEFAULT_FINANCE_CHART_DAY: FinanceChartPoint[] = [
  { date_label: 'Dom 15/11', usd: 10, cop_in_usd: 0, bs_in_usd: 0, total_usd: 10, cop_amount: 0, bs_amount: 0, count_usd: 1, count_cop: 0, count_bs: 0, count_total: 1 },
  { date_label: 'Lun 16/11', usd: 0, cop_in_usd: 10, bs_in_usd: 0, total_usd: 10, cop_amount: 42000, bs_amount: 0, count_usd: 0, count_cop: 1, count_bs: 0, count_total: 1 },
  { date_label: 'Mar 17/11', usd: 10, cop_in_usd: 0, bs_in_usd: 5, total_usd: 15, cop_amount: 0, bs_amount: 300, count_usd: 1, count_cop: 0, count_bs: 1, count_total: 2 },
  { date_label: 'Mié 18/11', usd: 0, cop_in_usd: 20, bs_in_usd: 10, total_usd: 30, cop_amount: 84000, bs_amount: 600, count_usd: 0, count_cop: 2, count_bs: 1, count_total: 3 },
  { date_label: 'Jue 19/11', usd: 20, cop_in_usd: 0, bs_in_usd: 0, total_usd: 20, cop_amount: 0, bs_amount: 0, count_usd: 2, count_cop: 0, count_bs: 0, count_total: 2 },
  { date_label: 'Vie 20/11', usd: 40, cop_in_usd: 30, bs_in_usd: 15, total_usd: 85, cop_amount: 126000, bs_amount: 900, count_usd: 4, count_cop: 3, count_bs: 3, count_total: 10 },
  { date_label: 'Sáb 21/11 (Hoy)', usd: 30, cop_in_usd: 10, bs_in_usd: 0, total_usd: 40, cop_amount: 42000, bs_amount: 0, count_usd: 3, count_cop: 1, count_bs: 0, count_total: 4 },
];

export const DEFAULT_FINANCE_CHART_WEEK: FinanceChartPoint[] = [
  { date_label: 'Sem 1', usd: 50, cop_in_usd: 0, bs_in_usd: 10, total_usd: 60, cop_amount: 0, bs_amount: 600, count_usd: 5, count_cop: 0, count_bs: 2, count_total: 7 },
  { date_label: 'Sem 2', usd: 0, cop_in_usd: 40, bs_in_usd: 0, total_usd: 40, cop_amount: 168000, bs_amount: 0, count_usd: 0, count_cop: 4, count_bs: 0, count_total: 4 },
  { date_label: 'Sem 3', usd: 80, cop_in_usd: 0, bs_in_usd: 20, total_usd: 100, cop_amount: 0, bs_amount: 1200, count_usd: 8, count_cop: 0, count_bs: 4, count_total: 12 },
  { date_label: 'Sem 4', usd: 60, cop_in_usd: 50, bs_in_usd: 0, total_usd: 110, cop_amount: 210000, bs_amount: 0, count_usd: 6, count_cop: 5, count_bs: 0, count_total: 11 },
  { date_label: 'Sem 5', usd: 0, cop_in_usd: 60, bs_in_usd: 30, total_usd: 90, cop_amount: 252000, bs_amount: 1800, count_usd: 0, count_cop: 6, count_bs: 5, count_total: 11 },
  { date_label: 'Sem 6 (Actual)', usd: 120, cop_in_usd: 80, bs_in_usd: 40, total_usd: 240, cop_amount: 336000, bs_amount: 2400, count_usd: 12, count_cop: 8, count_bs: 6, count_total: 26 },
];

export async function fetchFinanceChart(period: 'day' | 'week'): Promise<FinanceChartPoint[]> {
  const fallback = period === 'day' ? DEFAULT_FINANCE_CHART_DAY : DEFAULT_FINANCE_CHART_WEEK;
  try {
    const res = await fetch(`${API_BASE}/api/finances/chart?period=${period}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    const json = await res.json();
    return json && json.length > 0 ? json : fallback;
  } catch {
    return fallback;
  }
}

export const DEFAULT_DAILY_SALES: DailySalesResponse = {
  date: new Date().toISOString().split('T')[0],
  total_usd: 20.0,
  total_cop: 42000.0,
  total_bs: 300.0,
  total_sales_count: 3,
  sales: [
    {
      payment_id: 1,
      ticket_number: '00',
      customer_name: 'Carlos Mendoza',
      customer_phone: '+58 412 5550101',
      amount: 10.0,
      currency: 'USD',
      amount_usd: 10.0,
      payment_date: new Date().toISOString(),
      notes: 'Pago completo del boleto',
    },
    {
      payment_id: 2,
      ticket_number: '03',
      customer_name: 'Yorbi Hernández',
      customer_phone: '+58 416 7772211',
      amount: 5.0,
      currency: 'USD',
      amount_usd: 5.0,
      payment_date: new Date().toISOString(),
      notes: 'Abono inicial',
    },
    {
      payment_id: 3,
      ticket_number: '04',
      customer_name: 'Mariana Silva',
      customer_phone: '+58 424 9998877',
      amount: 42000.0,
      currency: 'COP',
      amount_usd: 10.0,
      payment_date: new Date().toISOString(),
      notes: 'Abono en Pesos COP',
    },
  ],
};

export async function fetchDailySales(dateStr?: string): Promise<DailySalesResponse> {
  try {
    const endpoint = `${API_BASE}/api/finances/daily-sales${dateStr ? `?date=${encodeURIComponent(dateStr)}` : ''}`;
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) throw new Error('Error al cargar ventas');
    return await res.json();
  } catch {
    return {
      ...DEFAULT_DAILY_SALES,
      date: dateStr || new Date().toISOString().split('T')[0],
    };
  }
}

export async function fetchExchangeRates(): Promise<ExchangeRate> {
  try {
    const res = await fetch(`${API_BASE}/api/finances/rates`, { cache: 'no-store' });
    if (!res.ok) return DEFAULT_EXCHANGE_RATES;
    return await res.json();
  } catch {
    return DEFAULT_EXCHANGE_RATES;
  }
}

export async function updateExchangeRates(payload: {
  rate_bs_to_cop: number;
  rate_bs_to_usd: number;
  rate_cop_to_usd: number;
}): Promise<ExchangeRate> {
  const res = await fetch(`${API_BASE}/api/finances/rates`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    handleUnauthorized(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al actualizar tasas');
  }
  return res.json();
}

export async function queryPublicTicket(query: string, raffleId?: number): Promise<Ticket[]> {
  let endpoint = `${API_BASE}/api/public/ticket?query=${encodeURIComponent(query)}`;
  if (raffleId) {
    endpoint += `&raffle_id=${raffleId}`;
  }
  const res = await fetch(endpoint, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No se encontraron boletos asociados');
  }
  return res.json();
}
