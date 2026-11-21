'use client';

import React, { useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(true);
  const [panelsDropdownOpen, setPanelsDropdownOpen] = useState(true);

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
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-[#12161F] border border-metallic rounded-lg text-white"
        aria-label="Abrir Menú"
      >
        {isOpen ? <X className="w-5 h-5 text-[#1EE868]" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop oscuro para móviles */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/70 z-30 transition-opacity"
        />
      )}

      {/* Sidebar a la izquierda */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:sticky top-0 left-0 h-screen w-72 bg-[#12161F] border-r border-metallic z-40 transition-transform duration-200 flex flex-col justify-between p-4 flex-shrink-0 select-none overflow-y-auto`}
      >
        <div className="space-y-5">
          {/* Cabecera / Marca Alejandro GM Encapsulada (Cero Degradados) */}
          <div className="p-3 bg-[#05070A] border border-metallic rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#12161F] border border-[#1EE868] flex items-center justify-center flex-shrink-0">
              <span className="font-brand-condensed text-xl font-black text-[#1EE868]">GM</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="font-brand-slab text-base font-black text-white">RIFAS</span>
                <span className="font-brand-condensed text-lg font-black text-[#1EE868]">
                  ALEJANDRO GM
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-[9px] uppercase tracking-wider text-[#C4CBD4] font-semibold">
                  Modo Oscuro Sólido
                </span>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="space-y-2">
            <button
              onClick={onOpenCreateRaffle}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1EE868] hover:bg-[#1EE868]/90 text-[#05070A] font-black text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Nueva Rifa</span>
            </button>

            <button
              onClick={onOpenRates}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#1E2430] hover:bg-[#1E2430]/80 text-[#C4CBD4] hover:text-white border border-metallic rounded-lg text-xs font-semibold transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00D4FF]" />
                <span>Configurar Tasas</span>
              </div>
              <span className="text-[10px] text-[#00D4FF] font-bold">Editar</span>
            </button>
          </div>

          {/* Desplegable en forma de lista de Paneles a la Izquierda */}
          <div className="space-y-1">
            <button
              onClick={() => setPanelsDropdownOpen(!panelsDropdownOpen)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold text-[#6E7785] uppercase tracking-wider hover:text-white transition-colors"
            >
              <span>Paneles del Sistema</span>
              {panelsDropdownOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {panelsDropdownOpen && (
              <div className="space-y-1 pt-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        if (window.innerWidth < 768) setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors text-left ${
                        isActive
                          ? 'bg-[#1E2430] text-[#1EE868] border-l-4 border-[#1EE868]'
                          : 'text-[#C4CBD4] hover:text-white hover:bg-[#1E2430]/60'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-[#1EE868]' : 'text-[#6E7785]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumen de Tasas Vigentes (Exactas según solicitud) */}
          <div className="p-3 bg-[#05070A] border border-metallic rounded-lg space-y-2 text-[11px]">
            <span className="text-[10px] font-bold text-[#6E7785] uppercase tracking-wider block">
              Tasas de Conversión Activas:
            </span>
            <div className="space-y-1 text-[#C4CBD4]">
              <div className="flex justify-between">
                <span>Bs a Pesos:</span>
                <span className="text-[#00D4FF] font-bold font-mono">
                  Bs * {rates.rate_bs_to_cop}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bs a Dólares:</span>
                <span className="text-[#1EE868] font-bold font-mono">
                  Bs / {rates.rate_bs_to_usd}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pesos a Dólares:</span>
                <span className="text-white font-bold font-mono">
                  COP / {rates.rate_cop_to_usd}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de Barra Lateral Encapsulado */}
        <div className="p-1.5 bg-[#05070A] border border-metallic rounded-lg">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
