'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  Ticket,
  TrendingUp,
  DollarSign,
  PlusCircle,
  Search,
  LogOut,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { ExchangeRate } from '@/lib/types';
import { fetchExchangeRates, logoutAdmin, getStoredUser } from '@/lib/api';

interface NavbarProps {
  onOpenCreateRaffle?: () => void;
  onOpenRates?: () => void;
  rates?: ExchangeRate | null;
}

export default function Navbar({ onOpenCreateRaffle, onOpenRates, rates }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);

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
    { label: 'Portal Público', href: '/consultar', icon: Search, external: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#12161F]/90 backdrop-blur-md border-b border-metallic">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Marca Alejandro GM */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0077E6] via-[#00D4FF] to-[#1EE868] p-[2px] shadow-glow-green-sm flex-shrink-0">
              <div className="w-full h-full bg-[#05070A] rounded-[10px] flex items-center justify-center">
                <span className="font-brand-condensed text-xl font-bold tracking-tighter text-[#1EE868]">GM</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="font-brand-slab text-xl tracking-wider text-white">RIFAS</span>
                <span className="font-brand-condensed text-2xl tracking-wide brand-gradient-text font-black">
                  ALEJANDRO GM
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-[10px] uppercase tracking-widest text-[#C4CBD4] font-medium">
                  Seguridad y Transparencia
                </span>
              </div>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1E2430] text-[#1EE868] shadow-glow-green-sm border border-[#1EE868]/40'
                      : 'text-[#C4CBD4] hover:text-white hover:bg-[#1E2430]/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1EE868]' : 'text-[#6E7785]'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Divisas y Acciones Rápidas */}
          <div className="flex items-center gap-3">
            {/* Tasas de Cambio Pills */}
            {rates && (
              <button
                onClick={onOpenRates}
                className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-[#1E2430] hover:bg-[#1E2430]/80 border border-metallic rounded-lg text-xs transition-colors"
                title="Configurar Tasas de Cambio"
              >
                <div className="flex items-center gap-1.5 text-[#C4CBD4]">
                  <span className="text-[#6E7785]">1 USD:</span>
                  <span className="text-[#00D4FF] font-semibold">{rates.cop_per_usd.toLocaleString()} COP</span>
                </div>
                <div className="w-[1px] h-3 bg-[#6E7785]/40" />
                <div className="flex items-center gap-1.5 text-[#C4CBD4]">
                  <span className="text-[#1EE868] font-semibold">{rates.bs_per_usd.toLocaleString()} BS</span>
                </div>
                <Sliders className="w-3.5 h-3.5 text-[#6E7785] ml-0.5" />
              </button>
            )}

            {/* Botón Crear Rifa */}
            {onOpenCreateRaffle && (
              <button
                onClick={onOpenCreateRaffle}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#0077E6] to-[#00D4FF] hover:opacity-90 text-white font-medium text-xs sm:text-sm rounded-lg shadow-glow-cyan-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Rifa</span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-[#1E2430] hover:bg-red-500/20 text-[#6E7785] hover:text-red-400 border border-metallic transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
