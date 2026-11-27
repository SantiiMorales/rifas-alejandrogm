'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
} from 'lucide-react';
import TicketGrid from '@/components/TicketGrid';
import { ExchangeRate, Raffle, Ticket } from '@/lib/types';
import {
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_RAFFLE,
  generateDefaultTickets,
  fetchActiveRaffle,
  fetchExchangeRates,
  fetchTickets,
} from '@/lib/api';

export default function AdminDashboardPage() {
  const [raffle, setRaffle] = useState<Raffle>(DEFAULT_RAFFLE);
  const [tickets, setTickets] = useState<Ticket[]>(() => generateDefaultTickets(DEFAULT_RAFFLE));
  const [rates, setRates] = useState<ExchangeRate>(DEFAULT_EXCHANGE_RATES);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      let savedId: number | undefined = undefined;
      if (typeof window !== 'undefined') {
        const urlParam = new URLSearchParams(window.location.search).get('raffle');
        const storedId = localStorage.getItem('active_raffle_id');
        if (urlParam) {
          savedId = parseInt(urlParam, 10);
        } else if (storedId) {
          savedId = parseInt(storedId, 10);
        }
      }

      const [r, ratesData] = await Promise.all([
        fetchActiveRaffle(savedId),
        fetchExchangeRates(),
      ]);
      setRaffle(r);
      setRates(ratesData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_raffle_id', String(r.id));
      }

      const tList = await fetchTickets({ raffleId: r.id });
      if (tList && tList.length > 0) {
        setTickets(tList);
      }
    } catch (err) {
      console.warn('Conexión backend en segundo plano:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRaffleCreatedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Raffle>;
      const newRaffle = customEvent.detail;
      if (newRaffle) {
        setRaffle(newRaffle);
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_raffle_id', String(newRaffle.id));
        }
        fetchTickets({ raffleId: newRaffle.id }).then((tList) => {
          if (tList && tList.length > 0) {
            setTickets(tList);
          }
        });
      }
    };

    window.addEventListener('raffle-created', handleRaffleCreatedEvent);
    return () => {
      window.removeEventListener('raffle-created', handleRaffleCreatedEvent);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    fetchActiveRaffle(raffle.id).then((r) => setRaffle(r)).catch(() => {});
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in-up">
      {/* Banner de Rifa Activa */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 border border-[#DCE4EE] rounded-lg shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[10px] font-semibold uppercase tracking-wider">
                Rifa en Curso
              </span>
              <span className="font-mono tabular-nums text-xs text-[#64748B]">ID #{raffle.id}</span>
            </div>
            <h1 className="font-display text-lg sm:text-2xl font-black text-[#0B1526] mt-1 tracking-tight truncate">
              {raffle.title}
            </h1>
            {raffle.description && (
              <p className="text-xs text-[#475569] mt-0.5 max-w-2xl leading-relaxed">{raffle.description}</p>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-h-[44px] sm:min-h-0 self-start sm:self-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-[#FFFFFF] hover:bg-[#EAF0F6] active:scale-[0.98] text-[#0B1526] border border-[#CBD5E1] rounded-lg text-xs font-semibold shadow-subtle transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#0369A1]' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>

        {/* Indicadores Sólidos Encapsulados */}
        <div className="mt-4 p-2.5 sm:p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="group p-2.5 sm:p-3 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle flex items-center gap-2.5 sm:gap-3 min-w-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out">
            <div className="p-2 bg-[#EAF0F6] rounded-lg border border-[#DCE4EE] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4 text-[#475569]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#64748B] uppercase block font-semibold truncate">Total</span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#0B1526] block truncate">{raffle.total_numbers}</span>
            </div>
          </div>

          <div className="group p-2.5 sm:p-3 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle flex items-center gap-2.5 sm:gap-3 min-w-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out">
            <div className="p-2 bg-[#ECFDF5] rounded-lg border border-[#A7F3D0] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <TicketIcon className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#059669] uppercase block font-semibold truncate">Disponibles</span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#059669] block truncate">{raffle.available_tickets}</span>
            </div>
          </div>

          <div className="group p-2.5 sm:p-3 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle flex items-center gap-2.5 sm:gap-3 min-w-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out">
            <div className="p-2 bg-[#E0F2FE] rounded-lg border border-[#BAE6FD] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4 text-[#0369A1]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#0369A1] uppercase block font-semibold truncate">Apartados</span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#0369A1] block truncate">{raffle.reserved_tickets}</span>
            </div>
          </div>

          <div className="group p-2.5 sm:p-3 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle flex items-center gap-2.5 sm:gap-3 min-w-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out">
            <div className="p-2 bg-[#ECFDF5] rounded-lg border border-[#A7F3D0] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#059669] uppercase block font-semibold truncate">Pagados 100%</span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#059669] block truncate">{raffle.paid_tickets}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matriz de Boletos */}
      <TicketGrid
        raffle={raffle}
        tickets={tickets}
        rates={rates}
        onRefresh={handleRefresh}
        onTicketUpdated={handleTicketUpdated}
      />
    </div>
  );
}
