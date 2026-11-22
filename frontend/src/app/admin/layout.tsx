'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rates, setRates] = useState<ExchangeRate>(DEFAULT_EXCHANGE_RATES);
  const [activeRaffle, setActiveRaffle] = useState<Raffle>(DEFAULT_RAFFLE);
  const [isCreateRaffleOpen, setIsCreateRaffleOpen] = useState(false);
  const [isRatesOpen, setIsRatesOpen] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      const token = getAdminToken();
      if (!token) {
        router.replace('/login');
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
          router.replace('/login');
        }
      } catch {
        // Red caída: si hay token válido en localStorage lo mantenemos; sin token → login
        if (token) {
          setIsAuthenticated(true);
          setAuthChecked(true);
        } else {
          router.replace('/login');
        }
      }
    };

    validateAuth();
  }, [router]);

  const handleRaffleCreated = (newRaffle: Raffle) => {
    setActiveRaffle(newRaffle);
  };

  const handleRatesUpdated = (updated: ExchangeRate) => {
    setRates(updated);
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="min-h-dvh bg-[#F4F7FA] flex items-center justify-center">
        <div className="text-center space-y-3">
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

      <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pt-16 md:pt-6">
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
