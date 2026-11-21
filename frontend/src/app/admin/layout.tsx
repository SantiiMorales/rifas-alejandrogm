'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import CreateRaffleModal from '@/components/CreateRaffleModal';
import ExchangeRatesModal from '@/components/ExchangeRatesModal';
import { ExchangeRate, Raffle } from '@/lib/types';
import {
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_RAFFLE,
  fetchActiveRaffle,
  fetchExchangeRates,
} from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<ExchangeRate>(DEFAULT_EXCHANGE_RATES);
  const [activeRaffle, setActiveRaffle] = useState<Raffle>(DEFAULT_RAFFLE);
  const [isCreateRaffleOpen, setIsCreateRaffleOpen] = useState(false);
  const [isRatesOpen, setIsRatesOpen] = useState(false);

  useEffect(() => {
    // Carga rápida en segundo plano sin bloquear la interfaz
    Promise.all([
      fetchActiveRaffle().catch(() => DEFAULT_RAFFLE),
      fetchExchangeRates().catch(() => DEFAULT_EXCHANGE_RATES),
    ]).then(([rData, rateData]) => {
      if (rData) setActiveRaffle(rData);
      if (rateData) setRates(rateData);
    });
  }, []);

  const handleRaffleCreated = (newRaffle: Raffle) => {
    setActiveRaffle(newRaffle);
    window.location.reload();
  };

  const handleRatesUpdated = (updated: ExchangeRate) => {
    setRates(updated);
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-white flex flex-col md:flex-row">
      {/* Paneles a la Izquierda en un Desplegable en forma de Lista */}
      <Sidebar
        rates={rates}
        onOpenCreateRaffle={() => setIsCreateRaffleOpen(true)}
        onOpenRates={() => setIsRatesOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Modales */}
      <CreateRaffleModal
        isOpen={isCreateRaffleOpen}
        onClose={() => setIsCreateRaffleOpen(false)}
        onRaffleCreated={handleRaffleCreated}
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
