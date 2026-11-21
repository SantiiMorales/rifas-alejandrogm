'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Award,
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
  // Inicialización instantánea con fallback para que la matriz SIEMPRE cargue de inmediato (0ms)
  const [raffle, setRaffle] = useState<Raffle>(DEFAULT_RAFFLE);
  const [tickets, setTickets] = useState<Ticket[]>(() => generateDefaultTickets(DEFAULT_RAFFLE));
  const [rates, setRates] = useState<ExchangeRate>(DEFAULT_EXCHANGE_RATES);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [r, ratesData] = await Promise.all([
        fetchActiveRaffle(),
        fetchExchangeRates(),
      ]);
      setRaffle(r);
      setRates(ratesData);

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
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    fetchActiveRaffle().then((r) => setRaffle(r)).catch(() => {});
  };

  return (
    <div className="space-y-5">
      {/* Banner de Rifa Activa Sólido (Cero Degradados) */}
      <div className="bg-[#12161F] p-5 border border-metallic rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#1EE868] text-black text-[10px] font-black uppercase">
                Rifa en Curso
              </span>
              <span className="text-xs text-[#6E7785]">ID #{raffle.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {raffle.title}
            </h1>
            {raffle.description && (
              <p className="text-xs text-[#C4CBD4] mt-0.5 max-w-2xl">{raffle.description}</p>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2430] hover:bg-[#1E2430]/70 text-[#C4CBD4] hover:text-white border border-metallic rounded-lg text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>

        {/* Indicadores Sólidos Encapsulados */}
        <div className="mt-4 p-2.5 sm:p-3 bg-[#05070A] border border-metallic rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#12161F] border border-metallic rounded-lg flex items-center gap-3">
            <div className="p-2 bg-[#1E2430] rounded-lg border border-metallic flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4 text-[#C4CBD4]" />
            </div>
            <div>
              <span className="text-[10px] text-[#6E7785] uppercase block font-semibold">Total</span>
              <span className="text-lg font-black text-white block">{raffle.total_numbers}</span>
            </div>
          </div>

          <div className="p-3 bg-[#12161F] border border-metallic rounded-lg flex items-center gap-3">
            <div className="p-2 bg-[#1E2430] rounded-lg border border-metallic flex items-center justify-center flex-shrink-0">
              <TicketIcon className="w-4 h-4 text-[#6E7785]" />
            </div>
            <div>
              <span className="text-[10px] text-[#6E7785] uppercase block font-semibold">Disponibles</span>
              <span className="text-lg font-black text-white block">{raffle.available_tickets}</span>
            </div>
          </div>

          <div className="p-3 bg-[#12161F] border border-metallic rounded-lg flex items-center gap-3">
            <div className="p-2 bg-[#1E2430] rounded-lg border border-[#00D4FF]/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[#00D4FF]" />
            </div>
            <div>
              <span className="text-[10px] text-[#00D4FF] uppercase block font-semibold">Apartados</span>
              <span className="text-lg font-black text-[#00D4FF] block">{raffle.reserved_tickets}</span>
            </div>
          </div>

          <div className="p-3 bg-[#12161F] border border-metallic rounded-lg flex items-center gap-3">
            <div className="p-2 bg-[#1E2430] rounded-lg border border-[#1EE868]/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#1EE868]" />
            </div>
            <div>
              <span className="text-[10px] text-[#1EE868] uppercase block font-semibold">Pagados 100%</span>
              <span className="text-lg font-black text-[#1EE868] block">{raffle.paid_tickets}</span>
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
