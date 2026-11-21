'use client';

import React, { useState, useMemo } from 'react';
import { Search, Calendar, Award } from 'lucide-react';
import { ExchangeRate, Raffle, Ticket } from '@/lib/types';
import TicketDetailModal from './TicketDetailModal';

interface TicketGridProps {
  raffle: Raffle;
  tickets: Ticket[];
  rates: ExchangeRate;
  onRefresh: () => void;
  onTicketUpdated: (updated: Ticket) => void;
}

export default function TicketGrid({
  raffle,
  tickets,
  rates,
  onRefresh,
  onTicketUpdated,
}: TicketGridProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'paid'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openTicketDetail = (t: Ticket) => {
    setSelectedTicket(t);
    setIsModalOpen(true);
  };

  const handleTicketUpdate = (updated: Ticket) => {
    setSelectedTicket(updated);
    onTicketUpdated(updated);
  };

  // Filtrado instantáneo en memoria
  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    return tickets.filter((t) => {
      // 1. Status
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // 2. Búsqueda por número, cliente o celular
      if (term) {
        const matchesNum = t.ticket_number.toLowerCase().includes(term);
        const matchesName = t.customer_name?.toLowerCase().includes(term);
        const matchesPhone = t.customer_phone?.toLowerCase().includes(term);
        if (!matchesNum && !matchesName && !matchesPhone) return false;
      }

      // 3. Fecha de apartado
      if (dateFilter !== 'all') {
        if (!t.reserved_at) return false;
        const reservedTime = new Date(t.reserved_at).getTime();
        const diffMs = now - reservedTime;

        if (dateFilter === 'today' && diffMs > oneDay) return false;
        if (dateFilter === 'last_3_days' && diffMs > 3 * oneDay) return false;
        if (dateFilter === 'last_week' && diffMs > sevenDays) return false;
        if (dateFilter === 'older_than_week' && diffMs <= sevenDays) return false;
      }

      // 4. Múltiples Juegos Especiales
      if (gameFilter !== 'all') {
        if (gameFilter === 'any') {
          if (!t.qualifies_for_special_draw && (!t.qualified_games || t.qualified_games.length === 0)) {
            return false;
          }
        } else {
          if (!t.qualified_games || !t.qualified_games.includes(gameFilter)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [tickets, search, statusFilter, dateFilter, gameFilter]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda Cero Degradados */}
      <div className="bg-[#12161F] p-4 border border-metallic rounded-lg space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7785]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número (07), cliente o teléfono..."
              className="w-full pl-10 pr-4 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs placeholder-[#6E7785] focus:outline-none focus:border-[#00D4FF]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-[#6E7785] hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Filtros de Estado Sólidos */}
          <div className="flex flex-wrap items-center gap-1 bg-[#05070A] p-1 border border-metallic rounded-lg">
            {[
              { id: 'all', label: 'Todos', count: tickets.length },
              {
                id: 'available',
                label: 'Disponibles',
                count: tickets.filter((t) => t.status === 'available').length,
                color: 'text-white',
              },
              {
                id: 'reserved',
                label: 'Apartados',
                count: tickets.filter((t) => t.status === 'reserved').length,
                color: 'text-[#00D4FF]',
              },
              {
                id: 'paid',
                label: 'Pagados',
                count: tickets.filter((t) => t.status === 'paid').length,
                color: 'text-[#1EE868]',
              },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#1E2430] text-[#1EE868] border border-[#1EE868]'
                      : 'text-[#C4CBD4] hover:text-white hover:bg-[#1E2430]/60'
                  }`}
                >
                  <span className={tab.color}>{tab.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#12161F] rounded-md text-[#6E7785]">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila Secundaria: Fecha de Apartado y Filtro por Juegos Especiales Múltiples */}
        <div className="p-2.5 sm:px-3 sm:py-2 bg-[#05070A] border border-metallic rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro Fecha */}
            <div className="flex items-center gap-2 bg-[#1E2430] border border-metallic rounded-lg px-2.5 py-1.5 transition-colors focus-within:border-[#00D4FF]">
              <Calendar className="w-3.5 h-3.5 text-[#00D4FF] flex-shrink-0" />
              <span className="text-[#C4CBD4] text-xs font-semibold whitespace-nowrap">Apartados:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#12161F] text-white">Todas las fechas</option>
                <option value="today" className="bg-[#12161F] text-white">Apartadas hoy</option>
                <option value="last_3_days" className="bg-[#12161F] text-white">Últimos 3 días</option>
                <option value="last_week" className="bg-[#12161F] text-white">Última semana</option>
                <option value="older_than_week" className="bg-[#12161F] text-white">Apartadas hace más de 1 semana ⚠️</option>
              </select>
            </div>

            {/* Filtro por Juegos Especiales Múltiples */}
            <div className="flex items-center gap-2 bg-[#1E2430] border border-metallic rounded-lg px-2.5 py-1.5 transition-colors focus-within:border-[#00D4FF]">
              <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-amber-400 text-xs font-semibold whitespace-nowrap">Juegos Especiales:</span>
              <select
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#12161F] text-white">Ver todos los boletos</option>
                <option value="any" className="bg-[#12161F] text-white">⭐ Cualquier juego especial desbloqueado</option>
                {raffle.special_games &&
                  raffle.special_games.map((g) => (
                    <option key={g.id} value={g.name} className="bg-[#12161F] text-white">
                      ★ {g.name} (≥ ${g.min_amount} USD)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#12161F] border border-metallic rounded-lg text-xs text-[#6E7785]">
            <span>Mostrando</span>
            <span className="font-bold text-white">{filteredTickets.length}</span>
            <span>de</span>
            <span className="font-bold text-[#C4CBD4]">{tickets.length}</span>
          </div>
        </div>
      </div>

      {/* Matriz de Boletos Sólida Cero Degradados */}
      {filteredTickets.length === 0 ? (
        <div className="p-10 text-center bg-[#12161F] border border-metallic rounded-lg">
          <p className="text-xs text-[#C4CBD4]">No se encontraron boletos con los filtros seleccionados.</p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setDateFilter('all');
              setGameFilter('all');
            }}
            className="mt-2 px-3 py-1 bg-[#1E2430] text-xs text-[#00D4FF] font-bold rounded-lg"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {filteredTickets.map((ticket) => {
            const isAvailable = ticket.status === 'available';
            const isPaid = ticket.status === 'paid';
            const isReserved = ticket.status === 'reserved';

            return (
              <button
                key={ticket.id}
                onClick={() => openTicketDetail(ticket)}
                className={`relative p-2 rounded-lg text-center border transition-colors flex flex-col items-center justify-between min-h-[74px] ${
                  isPaid
                    ? 'bg-[#12161F] border-[#1EE868]'
                    : isReserved
                    ? 'bg-[#12161F] border-[#00D4FF]'
                    : 'bg-[#0E121A] border-metallic hover:bg-[#1E2430]'
                }`}
              >
                {/* Badge Juegos Especiales Múltiples */}
                {ticket.qualified_games && ticket.qualified_games.length > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 px-1 py-0.2 bg-amber-400 text-black font-black text-[9px] rounded-md"
                    title={`Desbloqueó: ${ticket.qualified_games.join(', ')}`}
                  >
                    ★{ticket.qualified_games.length}
                  </span>
                )}

                {/* Número de Boleto */}
                <span
                  className={`font-brand-condensed text-xl font-black leading-none ${
                    isPaid ? 'text-[#1EE868]' : isReserved ? 'text-[#00D4FF]' : 'text-white'
                  }`}
                >
                  {ticket.ticket_number}
                </span>

                {/* Información de Estado */}
                <div className="w-full mt-1">
                  {isAvailable ? (
                    <span className="text-[10px] text-[#6E7785] block uppercase font-semibold">Libre</span>
                  ) : isPaid ? (
                    <div>
                      <span className="text-[9px] font-bold text-[#1EE868] block truncate">
                        {ticket.customer_name?.split(' ')[0] || 'Pagado'}
                      </span>
                      <span className="text-[8px] text-[#C4CBD4] block">100%</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[9px] font-bold text-[#00D4FF] block truncate">
                        {ticket.customer_name?.split(' ')[0] || 'Apartado'}
                      </span>
                      <span className="text-[8px] text-amber-300 block font-bold">
                        ${ticket.total_paid_usd}
                      </span>
                    </div>
                  )}
                </div>

                {isReserved && (
                  <div className="w-full h-1 bg-[#05070A] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#00D4FF] rounded-full" style={{ width: `${ticket.percent_paid}%` }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <TicketDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticket={selectedTicket}
        rates={rates}
        raffle={raffle}
        onTicketUpdated={handleTicketUpdate}
      />
    </div>
  );
}
