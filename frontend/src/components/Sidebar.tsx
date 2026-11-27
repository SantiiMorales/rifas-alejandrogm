'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Ticket,
  TrendingUp,
  DollarSign,
  PlusCircle,
  Search,
  LogOut,
  Sliders,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { ExchangeRate } from '@/lib/types';
import { logoutAdmin } from '@/lib/api';

interface SidebarProps {
  rates: ExchangeRate;
  onOpenCreateRaffle: () => void;
  onOpenRates: () => void;
}

export default function Sidebar({
  rates,
  onOpenCreateRaffle,
  onOpenRates,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [panelsDropdownOpen, setPanelsDropdownOpen] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = () => {
    logoutAdmin();
    router.push('/login');
  };

  const navItems = [
    { label: 'Tablero de Boletos', href: '/admin', icon: Ticket },
    { label: 'Finanzas & ROI', href: '/admin/finances', icon: TrendingUp },
    { label: 'Ventas del Día', href: '/admin/sales', icon: DollarSign },
    { label: 'Portal Público (Clientes)', href: '/consultar', icon: Search },
  ];

  return (
    <>
      {/* Botón flotante para abrir/cerrar menú en móviles */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-3 left-3 z-50 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg text-[#0B1526] shadow-subtle hover:bg-[#EAF0F6] active:bg-[#DCE4EE] transition-colors"
        aria-label={isOpen ? 'Cerrar Menú' : 'Abrir Menú'}
      >
        {isOpen ? <X className="w-5 h-5 text-[#0369A1]" /> : <Menu className="w-5 h-5 text-[#0B1526]" />}
      </button>

      {/* Backdrop para móviles con cierre al clic */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-[#0B1526]/40 backdrop-blur-sm z-30 animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar a la izquierda */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:sticky top-0 left-0 h-dvh w-72 max-w-[85vw] bg-[#FFFFFF] border-r border-[#DCE4EE] z-40 transition-transform duration-300 ease-out will-change-transform flex flex-col justify-between p-4 flex-shrink-0 select-none overflow-y-auto shadow-subtle`}
      >
        <div className="space-y-5">
          {/* Cabecera / Marca Alejandro GM Encapsulada */}
          <div className="p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0B1526] border border-[#CBD5E1] shadow-subtle flex items-center justify-center flex-shrink-0">
              <span className="font-display text-xl font-extrabold text-[#0EA5E9]">GM</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1 leading-none truncate">
                <span className="font-display text-base font-bold text-[#0B1526] tracking-tight">RIFAS</span>
                <span className="font-display text-lg font-black text-[#0369A1] tracking-tight">
                  ALEJANDRO GM
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                <span className="text-[9px] uppercase tracking-wider text-[#64748B] font-semibold truncate">
                  Sistema Oficial
                </span>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="space-y-2">
            <button
              onClick={() => {
                onOpenCreateRaffle();
                if (window.innerWidth < 768) setIsOpen(false);
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0369A1] hover:bg-[#075985] text-white font-semibold text-xs uppercase tracking-wider rounded-lg shadow-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
            >
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              <span>Crear Nueva Rifa</span>
            </button>

            <button
              onClick={() => {
                onOpenRates();
                if (window.innerWidth < 768) setIsOpen(false);
              }}
              className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 bg-[#FFFFFF] hover:bg-[#EAF0F6] text-[#0B1526] border border-[#CBD5E1] rounded-lg text-xs font-semibold shadow-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0369A1] flex-shrink-0" />
                <span>Configurar Tasas</span>
              </div>
              <span className="text-[10px] text-[#0369A1] font-bold">Editar</span>
            </button>
          </div>

          {/* Desplegable en forma de lista de Paneles a la Izquierda */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setPanelsDropdownOpen(!panelsDropdownOpen)}
              aria-expanded={panelsDropdownOpen}
              className="w-full min-h-[36px] flex items-center justify-between px-2 py-1.5 text-xs font-bold text-[#64748B] uppercase tracking-wider hover:text-[#0B1526] rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
            >
              <span>Paneles del Sistema</span>
              {panelsDropdownOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {panelsDropdownOpen && (
              <div className="space-y-1 pt-1 animate-fade-in-up">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        router.push(item.href);
                        if (window.innerWidth < 768) setIsOpen(false);
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left border-l-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2 ${
                        isActive
                          ? 'bg-[#E0F2FE] text-[#0369A1] border-[#0369A1]'
                          : 'text-[#475569] border-transparent hover:text-[#0B1526] hover:bg-[#EAF0F6]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-[#0369A1]' : 'text-[#64748B]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumen de Tasas Vigentes */}
          <div className="p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg space-y-2 text-[11px]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Tasas de Conversión Activas:
            </span>
            <div className="space-y-1.5 text-[#475569]">
              <div className="flex justify-between items-center gap-2">
                <span className="truncate">Bs a Pesos:</span>
                <span className="text-[#0369A1] font-semibold font-mono tabular-nums whitespace-nowrap">
                  Bs * {rates.rate_bs_to_cop}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="truncate">Bs a Dólares:</span>
                <span className="text-[#059669] font-semibold font-mono tabular-nums whitespace-nowrap">
                  Bs / {rates.rate_bs_to_usd}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="truncate">Pesos a Dólares:</span>
                <span className="text-[#0B1526] font-semibold font-mono tabular-nums whitespace-nowrap">
                  COP / {rates.rate_cop_to_usd}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de Barra Lateral Encapsulado */}
        <div className="p-1.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg mt-4">
          <button
            onClick={handleLogout}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
