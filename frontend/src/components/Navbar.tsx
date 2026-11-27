'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Ticket,
  TrendingUp,
  DollarSign,
  PlusCircle,
  Search,
  LogOut,
  Sliders,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { ExchangeRate } from '@/lib/types';
import { logoutAdmin, getStoredUser } from '@/lib/api';

interface NavbarProps {
  onOpenCreateRaffle?: () => void;
  onOpenRates?: () => void;
  rates?: ExchangeRate | null;
}

export default function Navbar({ onOpenCreateRaffle, onOpenRates, rates }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    router.push('/login');
  };

  const navItems = [
    { label: 'Tablero de Boletos', href: '/admin', icon: Ticket },
    { label: 'Finanzas & ROI', href: '/admin/finances', icon: TrendingUp },
    { label: 'Ventas del Día', href: '/admin/sales', icon: DollarSign },
    { label: 'Portal Público', href: '/consultar', icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#DCE4EE] shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Marca Alejandro GM */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0B1526] border border-[#CBD5E1] shadow-card flex items-center justify-center flex-shrink-0">
              <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#0EA5E9]">GM</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1 sm:gap-1.5 leading-none">
                <span className="font-display text-base sm:text-xl font-bold tracking-tight text-[#0B1526]">RIFAS</span>
                <span className="font-display text-lg sm:text-2xl font-black tracking-tight text-[#0369A1] truncate">
                  ALEJANDRO GM
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#64748B] font-semibold truncate">
                  Seguridad y Transparencia
                </span>
              </div>
            </div>
          </div>

          {/* Navegación Principal en Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] shadow-subtle'
                      : 'text-[#475569] hover:text-[#0B1526] hover:bg-[#EAF0F6]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0369A1]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Divisas y Acciones Rápidas */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tasas de Cambio Pills */}
            {rates && (
              <button
                onClick={onOpenRates}
                className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 bg-[#F4F7FA] hover:bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-xs shadow-subtle transition-colors min-h-[40px]"
                title="Configurar Tasas de Cambio"
              >
                <div className="flex items-center gap-1.5 text-[#475569]">
                  <span className="text-[#64748B]">1 USD:</span>
                  <span className="text-[#0369A1] font-semibold font-mono tabular-nums">{rates.cop_per_usd.toLocaleString()} COP</span>
                </div>
                <div className="w-[1px] h-3 bg-[#CBD5E1]" />
                <div className="flex items-center gap-1.5 text-[#475569]">
                  <span className="text-[#059669] font-semibold font-mono tabular-nums">{rates.bs_per_usd.toLocaleString()} BS</span>
                </div>
                <Sliders className="w-3.5 h-3.5 text-[#64748B] ml-0.5" />
              </button>
            )}

            {/* Botón Crear Rifa */}
            {onOpenCreateRaffle && (
              <button
                onClick={onOpenCreateRaffle}
                className="min-h-[44px] flex items-center gap-2 px-3 sm:px-3.5 py-2 bg-[#0369A1] hover:bg-[#075985] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-subtle transition-all"
              >
                <PlusCircle className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Nueva Rifa</span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg bg-[#FFFFFF] hover:bg-red-50 text-[#64748B] hover:text-red-600 border border-[#DCE4EE] hover:border-red-200 shadow-subtle transition-colors"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Toggle Menú Móvil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Cerrar navegación móvil' : 'Abrir navegación móvil'}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg bg-[#FFFFFF] text-[#0B1526] border border-[#DCE4EE] shadow-subtle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#0369A1]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[#DCE4EE] space-y-1 animate-fade-in-up">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    setMobileMenuOpen(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all border-l-4 ${
                    isActive
                      ? 'bg-[#E0F2FE] text-[#0369A1] border-[#0369A1]'
                      : 'text-[#475569] border-transparent hover:text-[#0B1526] hover:bg-[#EAF0F6]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0369A1]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
