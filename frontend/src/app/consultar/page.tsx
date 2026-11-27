'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  ShieldCheck,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Ticket } from '@/lib/types';
import { queryPublicTicket } from '@/lib/api';

function TicketSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('ticket') || searchParams.get('q') || '';
  const raffleParam = searchParams.get('raffle');
  const initialRaffleId = raffleParam ? parseInt(raffleParam, 10) : undefined;

  const [query, setQuery] = useState(initialQuery);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeSearch = useCallback(async (searchTerm: string, rId?: number) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    setTickets(null);

    try {
      const results = await queryPublicTicket(searchTerm.trim(), rId || initialRaffleId);
      setTickets(results);
    } catch (err: any) {
      setError(
        err.message ||
          'No se encontró ningún boleto registrado con ese número o celular. Verifica los datos.'
      );
    } finally {
      setLoading(false);
    }
  }, [initialRaffleId]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery, initialRaffleId);
    }
  }, [initialQuery, initialRaffleId, executeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, initialRaffleId);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-5">
      {/* Caja de Búsqueda */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 border border-[#DCE4EE] rounded-lg shadow-subtle">
        <form onSubmit={handleSubmit} className="space-y-3" aria-busy={loading}>
          <label
            htmlFor="public-ticket-query"
            className="block text-xs font-semibold text-[#475569] uppercase tracking-wider"
          >
            Ingresa tu Número de Boleto o Teléfono Celular
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                id="public-ticket-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: 07 o 04125550101"
                autoComplete="off"
                spellCheck={false}
                className="w-full pl-10 pr-3 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs font-medium focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#0EA5E9]/25 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] px-5 py-2.5 bg-[#0369A1] hover:bg-[#075985] active:scale-[0.99] text-white font-semibold text-xs uppercase tracking-wider rounded-lg shadow-subtle transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
              ) : (
                <Search className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{loading ? 'Consultando...' : 'Consultar'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Escribe tu número de ticket (ej: 03) o el teléfono celular registrado.
          </p>
        </form>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 text-center font-medium animate-shake">
          {error}
        </div>
      )}

      {!tickets && !loading && !error && (
        <div className="bg-[#FFFFFF] p-6 border border-[#DCE4EE] rounded-lg shadow-subtle text-center space-y-2 animate-fade-in">
          <ShieldCheck className="w-8 h-8 text-[#059669] mx-auto" />
          <p className="text-xs font-bold text-[#0B1526] uppercase tracking-wider">
            Consulta 100% Segura
          </p>
          <p className="text-[11px] text-[#475569] max-w-sm mx-auto leading-relaxed">
            Ingresa tu número de boleto o celular para ver el comprobante oficial con tus abonos y
            sorteos anticipados desbloqueados.
          </p>
        </div>
      )}

      {/* Resultados de Boletos Oficiales */}
      {tickets && tickets.length > 0 && (
        <div className="space-y-4" aria-live="polite">
          <div className="text-center animate-fade-in">
            <span className="text-xs text-[#0369A1] font-semibold uppercase tracking-wider">
              Comprobante Oficial Encontrado
            </span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#0B1526]">
              Boletos Asociados ({tickets.length})
            </h2>
          </div>

          {tickets.map((t, ticketIndex) => {
            const isPaid = t.status === 'paid';
            return (
              <div
                key={t.id}
                style={{ animationDelay: `${Math.min(ticketIndex, 6) * 45}ms` }}
                className="bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle overflow-hidden animate-fade-in-up"
              >
                {/* Cabecera */}
                <div className="p-3.5 sm:p-4 bg-[#F4F7FA] border-b border-[#DCE4EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#FFFFFF] border-2 border-[#0369A1] shadow-subtle flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-[#64748B] font-semibold uppercase">Boleto</span>
                      <span className="font-mono tabular-nums text-xl font-bold text-[#0369A1] leading-none">
                        #{t.ticket_number}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="font-display text-xs text-[#475569] font-semibold tracking-wider block truncate">
                        RIFAS ALEJANDRO GM
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-base font-bold text-[#0B1526] truncate">Boleto #{t.ticket_number}</h3>
                        {t.numbers && t.numbers.length > 1 && (
                          <div className="flex items-center gap-1 font-mono tabular-nums">
                            {t.numbers.map((n, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#0369A1] text-[#0369A1] font-bold text-[11px] shadow-subtle"
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`self-start sm:self-auto px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${
                      isPaid
                        ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
                        : 'bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1]'
                    }`}
                  >
                    {isPaid ? 'Pagado Total' : 'Apartado (Con Abonos)'}
                  </span>
                </div>

                {/* Múltiples Juegos Especiales Desbloqueados */}
                {t.qualified_games && t.qualified_games.length > 0 && (
                  <div className="px-4 py-2 bg-[#FEFCE8] border-b border-[#FEF08A] flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[#854D0E] font-semibold text-[11px] uppercase mr-1">
                      ⭐ Desbloqueado:
                    </span>
                    {t.qualified_games.map((g, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#FEF08A] border border-[#FDE047] text-[#854D0E] font-bold text-[10px]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Datos del Comprador */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg text-xs">
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#64748B] uppercase block font-semibold truncate">Titular</span>
                      <span className="font-bold text-[#0B1526] block truncate">{t.customer_name || 'Sin nombre'}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#64748B] uppercase block font-semibold truncate">Celular</span>
                      <span className="font-mono tabular-nums font-semibold text-[#0369A1] block truncate">{t.customer_phone || 'N/A'}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#64748B] uppercase block font-semibold truncate">Dirección</span>
                      <span className="text-[#475569] block truncate">{t.customer_address || '—'}</span>
                    </div>
                  </div>

                  {/* Estado Financiero */}
                  <div className="p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#475569] font-medium">Progreso:</span>
                      <span className="font-mono tabular-nums font-bold text-[#0B1526]">{t.percent_paid}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EAF0F6] rounded-full overflow-hidden border border-[#DCE4EE]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isPaid ? 'bg-[#059669]' : 'bg-[#0EA5E9]'}`}
                        style={{ width: `${t.percent_paid}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-2 bg-[#FFFFFF] rounded-lg border border-[#DCE4EE] shadow-subtle min-w-0">
                        <span className="text-[10px] text-[#64748B] block font-medium truncate">Precio</span>
                        <span className="font-mono tabular-nums font-bold text-[#0B1526] block truncate">${t.ticket_price_usd} USD</span>
                      </div>
                      <div className="p-2 bg-[#FFFFFF] rounded-lg border border-[#DCE4EE] shadow-subtle min-w-0">
                        <span className="text-[10px] text-[#64748B] block font-medium truncate">Abonado</span>
                        <span className="font-mono tabular-nums font-bold text-[#059669] block truncate">${t.total_paid_usd} USD</span>
                      </div>
                      <div className="p-2 bg-[#FFFFFF] rounded-lg border border-[#DCE4EE] shadow-subtle min-w-0">
                        <span className="text-[10px] text-[#64748B] block font-medium truncate">Saldo</span>
                        <span className={`font-mono tabular-nums font-bold block truncate ${t.balance_usd > 0 ? 'text-[#B45309]' : 'text-[#64748B]'}`}>
                          ${t.balance_usd} USD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Historial de Abonos */}
                  <div>
                    <span className="text-xs font-semibold text-[#475569] uppercase block mb-1.5">
                      Comprobantes de Pago Registrados ({t.payments.length})
                    </span>
                    {t.payments.length === 0 ? (
                      <p className="text-xs text-[#64748B]">No hay pagos registrados para este boleto.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {t.payments.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="p-2 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                          >
                            <div>
                              <span className="font-mono tabular-nums font-bold text-[#0B1526]">
                                {p.amount.toLocaleString()} {p.currency}
                              </span>
                              {p.currency !== 'USD' && (
                                <span className="font-mono tabular-nums text-[#0369A1] ml-1.5 font-semibold">
                                  (≈ ${p.amount_usd_equivalent.toFixed(2)} USD)
                                </span>
                              )}
                              {p.notes && <p className="text-[10px] text-[#64748B]">{p.notes}</p>}
                            </div>
                            <span className="font-mono tabular-nums text-[#64748B] text-[10px]">{formatDate(p.payment_date)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg flex items-center justify-center gap-2 text-xs text-[#065F46]">
                    <ShieldCheck className="w-4 h-4 text-[#059669] flex-shrink-0" />
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-center">
                      Comprobante Oficial Verificado • Rifas Alejandro GM
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ConsultarPage() {
  return (
    <main className="min-h-dvh bg-[#F4F7FA] text-[#0B1526] py-4 sm:py-6 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
        <div className="bg-[#FFFFFF] p-3 sm:p-4 border border-[#DCE4EE] rounded-lg shadow-subtle flex items-center justify-between gap-2">
          <Link
            href="/"
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 bg-[#FFFFFF] hover:bg-[#EAF0F6] text-[#0B1526] border border-[#CBD5E1] rounded-lg text-xs font-semibold shadow-subtle transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Inicio</span>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0B1526] border border-[#CBD5E1] shadow-subtle flex items-center justify-center flex-shrink-0">
              <span className="font-display text-base font-extrabold text-[#0EA5E9]">GM</span>
            </div>
            <div className="flex items-baseline gap-1 truncate">
              <span className="font-display text-sm sm:text-base font-bold text-[#0B1526] tracking-tight">RIFAS</span>
              <span className="font-display text-base sm:text-lg font-black text-[#0369A1] tracking-tight truncate">
                ALEJANDRO GM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span className="text-[10px] font-semibold text-[#059669] uppercase tracking-wider hidden sm:block">Verificado</span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="font-display text-xl sm:text-2xl font-black text-[#0B1526] uppercase tracking-tight">
            Consulta Oficial de Boletos
          </h1>
          <p className="text-xs text-[#475569]">
            Seguridad y Transparencia en tus sorteos y abonos
          </p>
        </div>

        <React.Suspense fallback={<div className="text-center text-xs text-[#64748B]">Cargando...</div>}>
          <TicketSearchContent />
        </React.Suspense>
      </div>
    </main>
  );
}
