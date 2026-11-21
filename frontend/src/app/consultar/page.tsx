'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  ShieldCheck,
  Award,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Ticket } from '@/lib/types';
import { queryPublicTicket } from '@/lib/api';

function TicketSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    setTickets(null);

    try {
      const results = await queryPublicTicket(searchTerm.trim());
      setTickets(results);
    } catch (err: any) {
      setError(
        err.message ||
          'No se encontró ningún boleto registrado con ese número o celular. Verifica los datos.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
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
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Caja de Búsqueda Sólida */}
      <div className="bg-[#12161F] p-5 border border-metallic rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-xs font-bold text-[#C4CBD4] uppercase tracking-wider">
            Ingresa tu Número de Boleto o Teléfono Celular
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#6E7785]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: 07 o 04125550101"
                className="w-full pl-9 pr-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs font-semibold placeholder-[#6E7785] focus:outline-none focus:border-[#00D4FF]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#1EE868] text-[#05070A] font-black text-xs uppercase tracking-wider rounded-lg hover:bg-[#1EE868]/90 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Consultando...' : 'Consultar'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#6E7785]">
            Escribe tu número de ticket (ej: 03) o el teléfono celular registrado.
          </p>
        </form>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 text-center font-medium">
          {error}
        </div>
      )}

      {/* Resultados de Boletos Oficiales */}
      {tickets && tickets.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-xs text-[#00D4FF] font-bold uppercase tracking-widest">
              Comprobante Oficial Encontrado
            </span>
            <h2 className="text-lg font-black text-white">
              Boletos Asociados ({tickets.length})
            </h2>
          </div>

          {tickets.map((t) => {
            const isPaid = t.status === 'paid';
            return (
              <div
                key={t.id}
                className="bg-[#12161F] border border-metallic rounded-lg overflow-hidden"
              >
                {/* Cabecera Sólida */}
                <div className="p-4 bg-[#1E2430] border-b border-metallic flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#05070A] border-2 border-[#1EE868] flex flex-col items-center justify-center">
                      <span className="text-[8px] text-[#6E7785] font-black uppercase">Boleto</span>
                      <span className="font-brand-condensed text-xl font-black text-[#1EE868] leading-none">
                        #{t.ticket_number}
                      </span>
                    </div>

                    <div>
                      <span className="font-brand-slab text-xs text-[#C4CBD4] tracking-wider block">
                        RIFAS ALEJANDRO GM
                      </span>
                      <h3 className="text-base font-black text-white">Boleto #{t.ticket_number}</h3>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${
                      isPaid ? 'bg-[#1EE868] text-black' : 'bg-[#00D4FF] text-black'
                    }`}
                  >
                    {isPaid ? 'Pagado Total' : 'Apartado (Con Abonos)'}
                  </span>
                </div>

                {/* Múltiples Juegos Especiales Desbloqueados */}
                {t.qualified_games && t.qualified_games.length > 0 && (
                  <div className="px-4 py-2 bg-[#05070A] border-b border-metallic flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-amber-400 font-bold text-[11px] uppercase mr-1">
                      ⭐ Desbloqueado:
                    </span>
                    {t.qualified_games.map((g, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-amber-400 text-black font-black text-[10px]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Datos del Comprador */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-[#05070A] border border-metallic rounded-lg text-xs">
                    <div>
                      <span className="text-[10px] text-[#6E7785] uppercase block font-semibold">Titular</span>
                      <span className="font-bold text-white block truncate">{t.customer_name || 'Sin nombre'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6E7785] uppercase block font-semibold">Celular</span>
                      <span className="font-bold text-[#00D4FF] block">{t.customer_phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6E7785] uppercase block font-semibold">Dirección</span>
                      <span className="text-[#C4CBD4] block truncate">{t.customer_address || '—'}</span>
                    </div>
                  </div>

                  {/* Estado Financiero */}
                  <div className="p-3 bg-[#05070A] border border-metallic rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#C4CBD4]">Progreso:</span>
                      <span className="font-bold text-white">{t.percent_paid}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#1E2430] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isPaid ? 'bg-[#1EE868]' : 'bg-[#00D4FF]'}`}
                        style={{ width: `${t.percent_paid}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-2 bg-[#12161F] rounded-lg border border-metallic">
                        <span className="text-[10px] text-[#6E7785] block font-medium">Precio</span>
                        <span className="font-bold text-white">${t.ticket_price_usd} USD</span>
                      </div>
                      <div className="p-2 bg-[#12161F] rounded-lg border border-metallic">
                        <span className="text-[10px] text-[#6E7785] block font-medium">Abonado</span>
                        <span className="font-bold text-[#1EE868]">${t.total_paid_usd} USD</span>
                      </div>
                      <div className="p-2 bg-[#12161F] rounded-lg border border-metallic">
                        <span className="text-[10px] text-[#6E7785] block font-medium">Saldo</span>
                        <span className={`font-bold ${t.balance_usd > 0 ? 'text-amber-400' : 'text-[#6E7785]'}`}>
                          ${t.balance_usd} USD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Historial de Abonos */}
                  <div>
                    <span className="text-xs font-bold text-[#C4CBD4] uppercase block mb-1.5">
                      Comprobantes de Pago Registrados ({t.payments.length})
                    </span>
                    {t.payments.length === 0 ? (
                      <p className="text-xs text-[#6E7785]">No hay pagos registrados para este boleto.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {t.payments.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="p-2 bg-[#05070A] border border-metallic rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-white">
                                {p.amount.toLocaleString()} {p.currency}
                              </span>
                              {p.currency !== 'USD' && (
                                <span className="text-[#00D4FF] ml-1.5">
                                  (≈ ${p.amount_usd_equivalent.toFixed(2)} USD)
                                </span>
                              )}
                              {p.notes && <p className="text-[10px] text-[#6E7785]">{p.notes}</p>}
                            </div>
                            <span className="text-[#6E7785] text-[10px]">{formatDate(p.payment_date)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 bg-[#05070A] border border-metallic rounded-lg flex items-center justify-center gap-2 text-xs text-[#00D4FF]">
                    <ShieldCheck className="w-4 h-4 text-[#00D4FF]" />
                    <span className="font-bold uppercase tracking-wider text-[10px]">
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
    <main className="min-h-screen bg-[#05070A] text-white py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-[#12161F] p-4 border border-metallic rounded-lg flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2430] hover:bg-[#1E2430]/70 text-[#C4CBD4] hover:text-white border border-metallic rounded-lg text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Inicio</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#05070A] border border-[#1EE868] flex items-center justify-center flex-shrink-0">
              <span className="font-brand-condensed text-base font-black text-[#1EE868]">GM</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-brand-slab text-base text-white">RIFAS</span>
              <span className="font-brand-condensed text-lg font-black text-[#1EE868]">
                ALEJANDRO GM
              </span>
            </div>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2430] hover:bg-[#1E2430]/70 text-[#1EE868] border border-metallic rounded-lg text-xs font-bold transition-colors"
          >
            <span>Panel Admin</span>
          </Link>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">
            Consulta Oficial de Boletos
          </h1>
          <p className="text-xs text-[#C4CBD4]">
            Seguridad y Transparencia en tus sorteos y abonos
          </p>
        </div>

        <React.Suspense fallback={<div className="text-center text-xs text-[#6E7785]">Cargando...</div>}>
          <TicketSearchContent />
        </React.Suspense>
      </div>
    </main>
  );
}
