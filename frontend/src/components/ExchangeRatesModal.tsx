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

  // Escuchar tecla Escape para cerrar modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setRateBsToCop(rates.rate_bs_to_cop || 70.0);
    setRateBsToUsd(rates.rate_bs_to_usd || 60.0);
    setRateCopToUsd(rates.rate_cop_to_usd || 4200.0);
  }, [rates]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B1526]/50 backdrop-blur-sm">
      <div className="relative w-[calc(100%-1rem)] sm:w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg p-4 sm:p-6 shadow-modal space-y-4 animate-scale-in">
        {/* Cabecera Encapsulada */}
        <div className="p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] flex items-center justify-center flex-shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-[#0369A1]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-display font-bold text-[#0B1526] uppercase tracking-wider truncate">
                Panel de Tasas de Conversión
              </h2>
              <p className="text-[11px] text-[#475569] truncate">
                Bs × Tasa = Pesos · Bs ÷ Tasa = USD · COP ÷ Tasa = USD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-[#64748B] hover:text-[#0B1526] hover:bg-[#EAF0F6] transition-colors flex-shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* FÓRMULA 1: Bolívares a Pesos */}
          <div className="p-3.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-0.5 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0369A1]" />
                <span className="font-bold text-[#0369A1] uppercase tracking-wider text-xs">
                  1. Bolívares a Pesos (COP)
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] font-mono tabular-nums px-2 py-0.5 bg-[#FFFFFF] border border-[#DCE4EE] rounded-md shadow-subtle">
                Cantidad Bs × Tasa = Pesos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
              <span className="text-[#475569] text-xs font-medium sm:col-span-2">
                Tasa multiplicadora:
              </span>
              <div className="sm:col-span-3">
                <div className="flex items-center bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg px-3 py-1.5 min-h-[44px] focus-within:border-[#0EA5E9] shadow-subtle transition-colors">
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    value={rateBsToCop}
                    onChange={(e) => setRateBsToCop(Number(e.target.value))}
                    className="w-full bg-transparent text-[#0B1526] font-mono tabular-nums font-bold text-base sm:text-sm focus:outline-none"
                    required
                  />
                  <span className="text-xs text-[#64748B] font-mono tabular-nums ml-2 flex-shrink-0">COP/BS</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#475569] bg-[#FFFFFF] p-2.5 rounded-lg border border-[#DCE4EE] shadow-subtle flex items-center justify-between gap-2 flex-wrap">
              <span className="font-medium">Ejemplo en vivo ({demoBs} Bs):</span>
              <span className="text-[#0369A1] font-bold font-mono tabular-nums">
                {demoBs} Bs × {rateBsToCop} = {demoCopFromBs.toLocaleString()} Pesos
              </span>
            </div>
          </div>

          {/* FÓRMULA 2: Bolívares a Dólares */}
          <div className="p-3.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-0.5 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <span className="font-bold text-[#059669] uppercase tracking-wider text-xs">
                  2. Bolívares a Dólares (USD)
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] font-mono tabular-nums px-2 py-0.5 bg-[#FFFFFF] border border-[#DCE4EE] rounded-md shadow-subtle">
                Cantidad Bs ÷ Tasa = Dólares
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
              <span className="text-[#475569] text-xs font-medium sm:col-span-2">
                Tasa divisora (Bs por USD):
              </span>
              <div className="sm:col-span-3">
                <div className="flex items-center bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg px-3 py-1.5 min-h-[44px] focus-within:border-[#059669] shadow-subtle transition-colors">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={rateBsToUsd}
                    onChange={(e) => setRateBsToUsd(Number(e.target.value))}
                    className="w-full bg-transparent text-[#0B1526] font-mono tabular-nums font-bold text-base sm:text-sm focus:outline-none"
                    required
                  />
                  <span className="text-xs text-[#64748B] font-mono tabular-nums ml-2 flex-shrink-0">BS/USD</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#475569] bg-[#FFFFFF] p-2.5 rounded-lg border border-[#DCE4EE] shadow-subtle flex items-center justify-between gap-2 flex-wrap">
              <span className="font-medium">Ejemplo en vivo ({demoBs} Bs):</span>
              <span className="text-[#059669] font-bold font-mono tabular-nums">
                {demoBs} Bs ÷ {rateBsToUsd} = ${demoUsdFromBs} USD
              </span>
            </div>
          </div>

          {/* FÓRMULA 3: Pesos a Dólares */}
          <div className="p-3.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-0.5 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0B1526]" />
                <span className="font-bold text-[#0B1526] uppercase tracking-wider text-xs">
                  3. Pesos a Dólares (USD)
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] font-mono tabular-nums px-2 py-0.5 bg-[#FFFFFF] border border-[#DCE4EE] rounded-md shadow-subtle">
                Cantidad Pesos ÷ Tasa = Dólares
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
              <span className="text-[#475569] text-xs font-medium sm:col-span-2">
                Tasa divisora (COP por USD):
              </span>
              <div className="sm:col-span-3">
                <div className="flex items-center bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg px-3 py-1.5 min-h-[44px] focus-within:border-[#0B1526] shadow-subtle transition-colors">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={rateCopToUsd}
                    onChange={(e) => setRateCopToUsd(Number(e.target.value))}
                    className="w-full bg-transparent text-[#0B1526] font-mono tabular-nums font-bold text-base sm:text-sm focus:outline-none"
                    required
                  />
                  <span className="text-xs text-[#64748B] font-mono tabular-nums ml-2 flex-shrink-0">COP/USD</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#475569] bg-[#FFFFFF] p-2.5 rounded-lg border border-[#DCE4EE] shadow-subtle flex items-center justify-between gap-2 flex-wrap">
              <span className="font-medium">Ejemplo en vivo ({demoCop.toLocaleString()} COP):</span>
              <span className="text-[#0B1526] font-bold font-mono tabular-nums">
                {demoCop.toLocaleString()} COP ÷ {rateCopToUsd} = ${demoUsdFromCop} USD
              </span>
            </div>
          </div>

          {/* Botones Encapsulados */}
          <div className="p-2 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 bg-[#FFFFFF] hover:bg-[#EAF0F6] text-[#0B1526] rounded-lg text-xs font-semibold border border-[#CBD5E1] shadow-subtle transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2 bg-[#0369A1] hover:bg-[#075985] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-subtle transition-colors"
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
