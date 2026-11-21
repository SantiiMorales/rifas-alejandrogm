'use client';

import React from 'react';
import { Target, CheckCircle, AlertCircle } from 'lucide-react';
import { FinanceSummary } from '@/lib/types';

interface InvestmentTrackerProps {
  summary: FinanceSummary;
}

export default function InvestmentTracker({ summary }: InvestmentTrackerProps) {
  const {
    total_investment_usd,
    total_equivalent_usd,
    pending_to_break_even_usd,
    profit_usd,
    break_even_reached,
    progress_investment_percent,
  } = summary;

  return (
    <div className="bg-[#12161F] p-5 border border-metallic rounded-lg space-y-4">
      {/* Encabezado Cero Degradados Encapsulado */}
      <div className="p-3 bg-[#05070A] border border-metallic rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#1E2430] text-[#00D4FF] border border-metallic flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Control de Inversión y Break-Even (ROI)
            </h3>
            <p className="text-xs text-[#C4CBD4]">
              Seguimiento financiero en tiempo real de costos y ganancia neta
            </p>
          </div>
        </div>

        <div>
          {break_even_reached ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1EE868] text-black rounded-lg text-xs font-black uppercase">
              <CheckCircle className="w-4 h-4" />
              <span>Inversión Cubierta (Zona de Ganancia)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00D4FF] text-black rounded-lg text-xs font-black uppercase">
              <AlertCircle className="w-4 h-4" />
              <span>Recuperando Inversión</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Métricas Sólidas Encapsuladas */}
      <div className="p-2.5 sm:p-3 bg-[#05070A] border border-metallic rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 bg-[#12161F] border border-metallic rounded-lg">
          <span className="text-[10px] text-[#6E7785] font-bold uppercase block">
            Inversión Total
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-white">${total_investment_usd.toLocaleString()}</span>
            <span className="text-xs font-normal text-[#6E7785]">USD</span>
          </div>
        </div>

        <div className="p-3 bg-[#12161F] border border-metallic rounded-lg">
          <span className="text-[10px] text-[#6E7785] font-bold uppercase block">
            Total Recaudado
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-[#00D4FF]">${total_equivalent_usd.toLocaleString()}</span>
            <span className="text-xs font-normal text-[#6E7785]">USD</span>
          </div>
        </div>

        <div className="p-3 bg-[#12161F] border border-metallic rounded-lg">
          <span className="text-[10px] text-[#6E7785] font-bold uppercase block">
            Falta Para Inversión
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-black ${pending_to_break_even_usd > 0 ? 'text-amber-400' : 'text-[#6E7785]'}`}>
              ${pending_to_break_even_usd.toLocaleString()}
            </span>
            <span className="text-xs font-normal text-[#6E7785]">USD</span>
          </div>
        </div>

        <div className="p-3 bg-[#12161F] border border-metallic rounded-lg">
          <span className="text-[10px] text-[#6E7785] font-bold uppercase block">
            Profit Neto Generado
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-black ${profit_usd > 0 ? 'text-[#1EE868]' : 'text-[#6E7785]'}`}>
              +${profit_usd.toLocaleString()}
            </span>
            <span className="text-xs font-normal text-[#6E7785]">USD</span>
          </div>
        </div>
      </div>

      {/* Barra de Progreso Sólida Encapsulada */}
      <div className="p-3 bg-[#05070A] border border-metallic rounded-lg space-y-2 text-xs">
        <div className="flex justify-between text-[#C4CBD4]">
          <span className="font-medium">Progreso hacia el Punto de Equilibrio:</span>
          <span className="font-bold text-white">{progress_investment_percent}%</span>
        </div>
        <div className="w-full h-3 bg-[#12161F] rounded-full overflow-hidden border border-metallic">
          <div
            className={`h-full rounded-full transition-all duration-300 ${break_even_reached ? 'bg-[#1EE868]' : 'bg-[#00D4FF]'}`}
            style={{ width: `${progress_investment_percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
