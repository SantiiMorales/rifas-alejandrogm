'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import CreateRaffleModal from '@/components/CreateRaffleModal';
import ExchangeRatesModal from '@/components/ExchangeRatesModal';
import { ExchangeRate, Raffle } from '@/lib/types';
import {
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_RAFFLE,
  fetchActiveRaffle,
  fetchExchangeRates,
  getAdminToken,
  logoutAdmin,
} from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login' || pathname?.startsWith('/admin/login');

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rates, setRates] = useState<ExchangeRate>(DEFAULT_EXCHANGE_RATES);
  const [activeRaffle, setActiveRaffle] = useState<Raffle>(DEFAULT_RAFFLE);
  const [isCreateRaffleOpen, setIsCreateRaffleOpen] = useState(false);
  const [isRatesOpen, setIsRatesOpen] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    const validateAuth = async () => {
      const token = getAdminToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (res.ok) {
          setIsAuthenticated(true);
          setAuthChecked(true);
          Promise.all([
            fetchActiveRaffle().catch(() => DEFAULT_RAFFLE),
            fetchExchangeRates().catch(() => DEFAULT_EXCHANGE_RATES),
          ]).then(([rData, rateData]) => {
            if (rData) setActiveRaffle(rData);
            if (rateData) setRates(rateData);
          });
        } else {
          logoutAdmin();
          router.replace('/admin/login');
        }
      } catch {
        // Red caída: si hay token en localStorage lo mantenemos; sin token → login
        if (token) {
          setIsAuthenticated(true);
          setAuthChecked(true);
        } else {
          router.replace('/admin/login');
        }
      }
    };

    validateAuth();
  }, [router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleRaffleCreated = (newRaffle: Raffle) => {
    setActiveRaffle(newRaffle);
  };

  const handleRatesUpdated = (updated: ExchangeRate) => {
    setRates(updated);
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="min-h-dvh bg-[#F4F7FA] flex items-center justify-center animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#0B1526] border border-[#CBD5E1] shadow-subtle flex items-center justify-center mx-auto mb-1">
            <span className="font-display text-xl font-extrabold text-[#0EA5E9]">GM</span>
          </div>
          <div className="w-8 h-8 border-2 border-[#0369A1] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#64748B] font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F4F7FA] text-[#0B1526] flex flex-col md:flex-row">
      <Sidebar
        rates={rates}
        onOpenCreateRaffle={() => setIsCreateRaffleOpen(true)}
        onOpenRates={() => setIsRatesOpen(true)}
      />

      <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pt-16 md:pt-6 space-y-4">
        {/* Header discreto del panel con botón de Cerrar Sesión */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE4EE]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span className="text-xs font-semibold text-[#475569]">Administrador conectado</span>
          </div>
          <button
            onClick={() => {
              logoutAdmin();
              router.replace('/admin/login');
            }}
            className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-red-50 text-[#64748B] hover:text-red-600 border border-[#DCE4EE] hover:border-red-200 rounded-lg text-xs font-semibold shadow-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {children}
      </main>

      <CreateRaffleModal
        isOpen={isCreateRaffleOpen}
        onClose={() => setIsCreateRaffleOpen(false)}
        onRaffleCreated={handleRaffleCreated}
        currentRaffle={activeRaffle}
      />

      <ExchangeRatesModal
        isOpen={isRatesOpen}
        onClose={() => setIsRatesOpen(false)}
        rates={rates}
        onRatesUpdated={handleRatesUpdated}
      />
    </div>
  );
}
