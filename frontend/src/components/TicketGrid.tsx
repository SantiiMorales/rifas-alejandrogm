'use client';

import React, { useState, useMemo } from 'react';
import { Search, SearchX, Calendar, Award, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { ExchangeRate, Raffle, Ticket } from '@/lib/types';
import { formatDrawDate } from '@/lib/ticketSchemes';
import TicketDetailModal from './TicketDetailModal';
import CustomSelect, { CustomSelectOption } from './CustomSelect';

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
  const [ticketOpenedFromUrl, setTicketOpenedFromUrl] = useState(false);

  const dateOptions: CustomSelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        label: 'Todas las fechas',
        icon: <Calendar className="w-3.5 h-3.5 text-[#0369A1]" />,
      },
      {
        value: 'today',
        label: 'Apartadas hoy',
        icon: <Clock className="w-3.5 h-3.5 text-[#059669]" />,
      },
      {
        value: 'last_3_days',
        label: 'Últimos 3 días',
        icon: <Clock className="w-3.5 h-3.5 text-[#0369A1]" />,
      },
      {
        value: 'last_week',
        label: 'Última semana',
        icon: <Calendar className="w-3.5 h-3.5 text-[#64748B]" />,
      },
      {
        value: 'older_than_week',
        label: 'Apartadas hace más de 1 semana',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
        badge: '⚠️ Urgente',
      },
    ],
    []
  );

  const gameOptions: CustomSelectOption[] = useMemo(() => {
    const list: CustomSelectOption[] = [
      {
        value: 'all',
        label: 'Ver todos los boletos',
        icon: <Award className="w-3.5 h-3.5 text-[#854D0E]" />,
      },
      {
        value: 'any',
        label: 'Cualquier juego especial',
        subtitle: 'Boletos con algún juego desbloqueado',
        icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
        badge: 'Cualquiera',
      },
    ];

    if (raffle.special_games && raffle.special_games.length > 0) {
      raffle.special_games.forEach((g) => {
        const parts = [`≥ $${g.min_amount} USD`];
        if (g.drawDate) {
          parts.push(formatDrawDate(g.drawDate));
        }
        list.push({
          value: g.name,
          label: g.name,
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-600" />,
          badge: parts.join(' · '),
        });
      });
    }

    return list;
  }, [raffle.special_games]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && tickets.length > 0 && !ticketOpenedFromUrl) {
      const params = new URLSearchParams(window.location.search);
      const ticketParam = params.get('ticket') || params.get('q');
      if (ticketParam) {
        const found = tickets.find((t) => t.ticket_number === ticketParam.trim());
        if (found) {
          setSelectedTicket(found);
          setIsModalOpen(true);
          setTicketOpenedFromUrl(true);
        }
      }
    }
  }, [tickets, ticketOpenedFromUrl]);

  const openTicketDetail = (t: Ticket) => {
    setSelectedTicket(t);
    setIsModalOpen(true);
  };

  const handleTicketUpdate = (updated: Ticket) => {
    setSelectedTicket(updated);
    onTicketUpdated(updated);
  };

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      if (term) {
        const matchesNum = t.ticket_number.toLowerCase().includes(term);
        const matchesNumbers = t.numbers && t.numbers.some((num) => num.toLowerCase().includes(term));
        const matchesName = t.customer_name?.toLowerCase().includes(term);
        const matchesPhone = t.customer_phone?.toLowerCase().includes(term);
        if (!matchesNum && !matchesNumbers && !matchesName && !matchesPhone) return false;
      }

      if (dateFilter !== 'all') {
        if (!t.reserved_at) return false;
        const reservedTime = new Date(t.reserved_at).getTime();
        const diffMs = now - reservedTime;

        if (dateFilter === 'today' && diffMs > oneDay) return false;
        if (dateFilter === 'last_3_days' && diffMs > 3 * oneDay) return false;
        if (dateFilter === 'last_week' && diffMs > sevenDays) return false;
        if (dateFilter === 'older_than_week' && diffMs <= sevenDays) return false;
      }

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
    <div className="space-y-4 animate-fade-in-up">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-[#FFFFFF] p-3.5 sm:p-4 border border-[#DCE4EE] rounded-lg shadow-subtle space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número (07), cliente o teléfono..."
              autoComplete="off"
              spellCheck={false}
              aria-label="Buscar boletos por número, cliente o teléfono"
              className="w-full pl-10 pr-11 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-md text-xs text-[#64748B] hover:text-[#0B1526] hover:bg-[#DCE4EE] transition-colors"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros de Estado */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F4F7FA] p-1 border border-[#DCE4EE] rounded-lg w-full lg:w-auto">
            {[
              { id: 'all', label: 'Todos', count: tickets.length, activeClass: 'text-[#0B1526]' },
              {
                id: 'available',
                label: 'Disponibles',
                count: tickets.filter((t) => t.status === 'available').length,
                activeClass: 'text-[#059669]',
              },
              {
                id: 'reserved',
                label: 'Apartados',
                count: tickets.filter((t) => t.status === 'reserved').length,
                activeClass: 'text-[#0369A1]',
              },
              {
                id: 'paid',
                label: 'Pagados',
                count: tickets.filter((t) => t.status === 'paid').length,
                activeClass: 'text-[#059669]',
              },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  aria-pressed={active}
                  className={`min-h-[40px] flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-1 ${
                    active
                      ? `bg-[#FFFFFF] ${tab.activeClass} border border-[#CBD5E1] shadow-subtle`
                      : 'text-[#475569] hover:text-[#0B1526] hover:bg-[#FFFFFF] border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 bg-[#EAF0F6] rounded-md text-[#475569]">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila Secundaria */}
        <div className="p-2.5 sm:px-3 sm:py-2 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Filtro Fecha con CustomSelect */}
            <CustomSelect
              value={dateFilter}
              onChange={setDateFilter}
              options={dateOptions}
              icon={<Calendar className="w-3.5 h-3.5 text-[#0369A1] flex-shrink-0" />}
              label="Apartados:"
              variant="default"
              className="w-full sm:w-auto"
            />

            {/* Filtro por Juegos Especiales Múltiples con CustomSelect */}
            <CustomSelect
              value={gameFilter}
              onChange={setGameFilter}
              options={gameOptions}
              icon={<Award className="w-3.5 h-3.5 text-[#854D0E] flex-shrink-0" />}
              label="Juegos Especiales:"
              variant="amber"
              className="w-full sm:w-auto"
            />
          </div>

          <div
            aria-live="polite"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg text-xs text-[#64748B] shadow-subtle ml-auto"
          >
            <span>Mostrando</span>
            <span className="font-mono tabular-nums font-bold text-[#0B1526]">{filteredTickets.length}</span>
            <span>de</span>
            <span className="font-mono tabular-nums font-bold text-[#475569]">{tickets.length}</span>
          </div>
        </div>
      </div>

      {/* Matriz de Boletos */}
      {filteredTickets.length === 0 ? (
        <div className="p-10 text-center bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle animate-fade-in-up">
          <SearchX className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
          <p className="text-xs text-[#475569]">No se encontraron boletos con los filtros seleccionados.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setDateFilter('all');
              setGameFilter('all');
            }}
            className="mt-2 min-h-[44px] px-4 py-2 bg-[#EAF0F6] text-xs text-[#0369A1] font-semibold rounded-lg hover:bg-[#DCE4EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div
          className={
            raffle.scheme === 'pairs_500' || raffle.total_numbers === 500
              ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 sm:gap-2'
              : raffle.scheme === 'triples_333' || raffle.total_numbers === 333
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2'
              : 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2'
          }
        >
          {filteredTickets.map((ticket) => {
            const isAvailable = ticket.status === 'available';
            const isPaid = ticket.status === 'paid';
            const isReserved = ticket.status === 'reserved';
            const isPairs = raffle.scheme === 'pairs_500' || raffle.total_numbers === 500;
            const isTriples = raffle.scheme === 'triples_333' || raffle.total_numbers === 333;

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => openTicketDetail(ticket)}
                aria-label={`Boleto ${ticket.ticket_number}, ${isPaid ? 'pagado' : isReserved ? 'apartado' : 'disponible'}${ticket.customer_name ? `, ${ticket.customer_name}` : ''}`}
                className={`relative p-1.5 sm:p-2 rounded-lg text-center border transition-all duration-150 flex flex-col items-center justify-between min-h-[72px] sm:min-h-[76px] shadow-subtle min-w-0 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F7FA] ${
                  isPaid
                    ? 'bg-[#ECFDF5] border-2 border-[#059669] hover:border-[#047857]'
                    : isReserved
                    ? 'bg-[#FFFFFF] border-2 border-[#0EA5E9] hover:border-[#0284C7]'
                    : 'bg-[#FFFFFF] border border-[#DCE4EE] hover:border-[#0369A1]/40 hover:bg-[#F8FAFC]'
                }`}
              >
                {/* Badge Juegos Especiales Múltiples */}
                {ticket.qualified_games && ticket.qualified_games.length > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 px-1 py-0.2 bg-[#FEF08A] text-[#854D0E] border border-[#FDE047] font-bold text-[9px] rounded-md shadow-subtle font-mono tabular-nums"
                    title={`Desbloqueó: ${ticket.qualified_games.join(', ')}`}
                  >
                    ★{ticket.qualified_games.length}
                  </span>
                )}

                {/* Números del Boleto según esquema */}
                {isPairs && ticket.numbers && ticket.numbers.length === 2 ? (
                  <div className="w-full min-w-0">
                    <span className="text-[9px] text-[#64748B] block font-semibold uppercase leading-none mb-0.5 truncate">
                      Boleto #{ticket.ticket_number}
                    </span>
                    <div className="flex items-center justify-center gap-1 font-mono tabular-nums font-bold leading-tight">
                      <span className={`text-xs sm:text-sm ${isPaid ? 'text-[#059669]' : isReserved ? 'text-[#0369A1]' : 'text-[#0B1526]'}`}>
                        {ticket.numbers[0]}
                      </span>
                      <span className="text-[#94A3B8] text-[10px]">/</span>
                      <span className={`text-xs sm:text-sm ${isPaid ? 'text-[#059669]' : isReserved ? 'text-[#0369A1]' : 'text-[#0B1526]'}`}>
                        {ticket.numbers[1]}
                      </span>
                    </div>
                  </div>
                ) : isTriples && ticket.numbers && ticket.numbers.length === 3 ? (
                  <div className="w-full min-w-0">
                    <span className="text-[9px] text-[#64748B] block font-semibold uppercase leading-none mb-0.5 truncate">
                      Boleto #{ticket.ticket_number}
                    </span>
                    <div className="flex items-center justify-center gap-0.5 sm:gap-1 font-mono tabular-nums font-bold text-[11px] sm:text-xs leading-tight">
                      <span className={isPaid ? 'text-[#059669]' : isReserved ? 'text-[#0369A1]' : 'text-[#0B1526]'}>
                        {ticket.numbers[0]}
                      </span>
                      <span className="text-[#CBD5E1]">·</span>
                      <span className={isPaid ? 'text-[#059669]' : isReserved ? 'text-[#0369A1]' : 'text-[#0B1526]'}>
                        {ticket.numbers[1]}
                      </span>
                      <span className="text-[#CBD5E1]">·</span>
                      <span className={isPaid ? 'text-[#059669]' : isReserved ? 'text-[#0369A1]' : 'text-[#0B1526]'}>
                        {ticket.numbers[2]}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span
                    className={`font-mono tabular-nums text-lg sm:text-xl font-bold leading-none ${
                      isPaid ? 'text-[#059669]' : isReserved ? 'text-[#0369A1]' : 'text-[#0B1526]'
                    }`}
                  >
                    {ticket.ticket_number}
                  </span>
                )}

                {/* Información de Estado */}
                <div className="w-full mt-1 min-w-0">
                  {isAvailable ? (
                    <span className="text-[10px] text-[#64748B] block uppercase font-semibold truncate">Libre</span>
                  ) : isPaid ? (
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-[#065F46] block truncate">
                        {ticket.customer_name?.split(' ')[0] || 'Pagado'}
                      </span>
                      <span className="font-mono tabular-nums text-[8px] text-[#059669] block font-bold">100%</span>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-[#0369A1] block truncate">
                        {ticket.customer_name?.split(' ')[0] || 'Apartado'}
                      </span>
                      <span className="font-mono tabular-nums text-[8px] text-[#0369A1] block font-bold truncate">
                        ${ticket.total_paid_usd}
                      </span>
                    </div>
                  )}
                </div>

                {isReserved && (
                  <div className="w-full h-1 bg-[#EAF0F6] rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#0EA5E9] rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${ticket.percent_paid}%` }}
                    />
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
