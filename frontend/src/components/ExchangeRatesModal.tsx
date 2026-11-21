'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Check, ArrowRightLeft } from 'lucide-react';
import { ExchangeRate } from '@/lib/types';
import { updateExchangeRates } from '@/lib/api';

interface ExchangeRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: ExchangeRate;
  onRatesUpdated: (rates: ExchangeRate) => void;
}

export default function ExchangeRatesModal({
  isOpen,
  onClose,
  rates,
  onRatesUpdated,
}: ExchangeRatesModalProps) {
  // Fórmulas solicitadas:
  // 1. Bolívares a Pesos: Cantidad de Bs * Tasa = Pesos
  const [rateBsToCop, setRateBsToCop] = useState(rates.rate_bs_to_cop || 70.0);
  // 2. Bolívares a Dólares: Cantidad de Bs / Tasa = Dólares
  const [rateBsToUsd, setRateBsToUsd] = useState(rates.rate_bs_to_usd || 60.0);
  // 3. Pesos a Dólares: Cantidad de pesos / Tasa = Dólares
  const [rateCopToUsd, setRateCopToUsd] = useState(rates.rate_cop_to_usd || 4200.0);

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setRateBsToCop(rates.rate_bs_to_cop || 70.0);
    setRateBsToUsd(rates.rate_bs_to_usd || 60.0);
    setRateCopToUsd(rates.rate_cop_to_usd || 4200.0);
  }, [rates]);

  if (!isOpen) return null;

  // Cálculos de demostración interactiva en tiempo real
  const demoBs = 100;
  const demoCopFromBs = Math.round(demoBs * rateBsToCop);
  const demoUsdFromBs = (demoBs / (rateBsToUsd || 1)).toFixed(2);

  const demoCop = 42000;
  const demoUsdFromCop = (demoCop / (rateCopToUsd || 1)).toFixed(2);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updateExchangeRates({
        rate_bs_to_cop: Number(rateBsToCop),
        rate_bs_to_usd: Number(rateBsToUsd),
        rate_cop_to_usd: Number(rateCopToUsd),
      });
      onRatesUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      alert('Error al guardar las tasas de conversión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#12161F] border border-metallic rounded-lg p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Cabecera Encapsulada con rounded-lg */}
        <div className="p-3 bg-[#05070A] border border-metallic rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#1E2430] border border-metallic text-[#00D4FF] flex items-center justify-center flex-shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Panel de Tasas de Conversión
              </h2>
              <p className="text-[11px] text-[#C4CBD4]">
                Bs × Tasa = Pesos · Bs ÷ Tasa = USD · COP ÷ Tasa = USD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#6E7785] hover:text-white hover:bg-[#1E2430] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* FÓRMULA 1: Bolívares a Pesos */}
          <div className="p-3.5 bg-[#05070A] border border-metallic rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00D4FF]" />
                <span className="font-bold text-[#00D4FF] uppercase tracking-wider text-xs">
                  1. Bolívares a Pesos (COP)
                </span>
              </div>
              <span className="text-[10px] text-[#6E7785] font-mono px-2 py-0.5 bg-[#12161F] border border-metallic rounded-md">
                Cantidad Bs × Tasa = Pesos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
              <span className="text-[#C4CBD4] text-xs font-medium sm:col-span-2">
                Tasa multiplicadora:
              </span>
              <div className="sm:col-span-3">
                <div className="flex items-center bg-[#1E2430] border border-metallic rounded-lg px-3 py-1.5 focus-within:border-[#00D4FF] transition-colors">
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    value={rateBsToCop}
                    onChange={(e) => setRateBsToCop(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-bold text-sm focus:outline-none"
                    required
                  />
                  <span className="text-xs text-[#6E7785] font-mono ml-2 flex-shrink-0">COP/BS</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#C4CBD4] bg-[#12161F] p-2.5 rounded-lg border border-metallic flex items-center justify-between">
              <span className="font-medium">Ejemplo en vivo ({demoBs} Bs):</span>
              <span className="text-[#00D4FF] font-bold font-mono">
                {demoBs} Bs × {rateBsToCop} = {demoCopFromBs.toLocaleString()} Pesos
              </span>
            </div>
          </div>

          {/* FÓRMULA 2: Bolívares a Dólares */}
          <div className="p-3.5 bg-[#05070A] border border-metallic rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1EE868]" />
                <span className="font-bold text-[#1EE868] uppercase tracking-wider text-xs">
                  2. Bolívares a Dólares (USD)
                </span>
              </div>
              <span className="text-[10px] text-[#6E7785] font-mono px-2 py-0.5 bg-[#12161F] border border-metallic rounded-md">
                Cantidad Bs ÷ Tasa = Dólares
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
              <span className="text-[#C4CBD4] text-xs font-medium sm:col-span-2">
                Tasa divisora (Bs por USD):
              </span>
              <div className="sm:col-span-3">
                <div className="flex items-center bg-[#1E2430] border border-metallic rounded-lg px-3 py-1.5 focus-within:border-[#1EE868] transition-colors">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={rateBsToUsd}
                    onChange={(e) => setRateBsToUsd(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-bold text-sm focus:outline-none"
                    required
                  />
                  <span className="text-xs text-[#6E7785] font-mono ml-2 flex-shrink-0">BS/USD</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#C4CBD4] bg-[#12161F] p-2.5 rounded-lg border border-metallic flex items-center justify-between">
              <span className="font-medium">Ejemplo en vivo ({demoBs} Bs):</span>
              <span className="text-[#1EE868] font-bold font-mono">
                {demoBs} Bs ÷ {rateBsToUsd} = ${demoUsdFromBs} USD
              </span>
            </div>
          </div>

          {/* FÓRMULA 3: Pesos a Dólares */}
          <div className="p-3.5 bg-[#05070A] border border-metallic rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="font-bold text-white uppercase tracking-wider text-xs">
                  3. Pesos a Dólares (USD)
                </span>
              </div>
              <span className="text-[10px] text-[#6E7785] font-mono px-2 py-0.5 bg-[#12161F] border border-metallic rounded-md">
                Cantidad Pesos ÷ Tasa = Dólares
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
              <span className="text-[#C4CBD4] text-xs font-medium sm:col-span-2">
                Tasa divisora (COP por USD):
              </span>
              <div className="sm:col-span-3">
                <div className="flex items-center bg-[#1E2430] border border-metallic rounded-lg px-3 py-1.5 focus-within:border-white transition-colors">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={rateCopToUsd}
                    onChange={(e) => setRateCopToUsd(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-bold text-sm focus:outline-none"
                    required
                  />
                  <span className="text-xs text-[#6E7785] font-mono ml-2 flex-shrink-0">COP/USD</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#C4CBD4] bg-[#12161F] p-2.5 rounded-lg border border-metallic flex items-center justify-between">
              <span className="font-medium">Ejemplo en vivo ({demoCop.toLocaleString()} COP):</span>
              <span className="text-white font-bold font-mono">
                {demoCop.toLocaleString()} COP ÷ {rateCopToUsd} = ${demoUsdFromCop} USD
              </span>
            </div>
          </div>

          {/* Botones Cero Degradados Encapsulados */}
          <div className="p-2 bg-[#05070A] border border-metallic rounded-lg flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1E2430] hover:bg-[#1E2430]/70 text-[#C4CBD4] hover:text-white rounded-lg text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-[#1EE868] hover:bg-[#1EE868]/90 text-[#05070A] font-black text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Guardar Tasas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
