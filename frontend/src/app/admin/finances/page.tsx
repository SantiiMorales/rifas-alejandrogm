'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, RefreshCw, Wallet, Coins } from 'lucide-react';
import InvestmentTracker from '@/components/InvestmentTracker';
import FinanceCharts from '@/components/FinanceCharts';
import { FinanceChartPoint, FinanceSummary, Raffle } from '@/lib/types';
import {
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_FINANCE_CHART_DAY,
  DEFAULT_RAFFLE,
  fetchActiveRaffle,
  fetchFinanceChart,
  fetchFinanceSummary,
} from '@/lib/api';

export default function FinancesPage() {
  const [summary, setSummary] = useState<FinanceSummary>({
    total_collected_usd: 30.0,
    total_collected_cop: 84000.0,
    total_collected_bs: 1020.0,
    total_equivalent_usd: 67.0,
    total_investment_usd: 400.0,
    pending_to_break_even_usd: 333.0,
    profit_usd: 0.0,
    break_even_reached: false,
    progress_investment_percent: 16.8,
    rates: DEFAULT_EXCHANGE_RATES,
  });
  const [raffle, setRaffle] = useState<Raffle>(DEFAULT_RAFFLE);
  const [chartData, setChartData] = useState<FinanceChartPoint[]>(DEFAULT_FINANCE_CHART_DAY);
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week'>('day');
  const [refreshing, setRefreshing] = useState(false);

  const loadFinances = useCallback(async () => {
    try {
      const [sum, chart, activeRaffle] = await Promise.all([
        fetchFinanceSummary(),
        fetchFinanceChart(chartPeriod),
        fetchActiveRaffle(),
      ]);
      setSummary(sum);
      setChartData(chart);
      if (activeRaffle) {
        setRaffle(activeRaffle);
      }
    } catch (err) {
      console.warn('Error cargando finanzas:', err);
    } finally {
      setRefreshing(false);
    }
  }, [chartPeriod]);

  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in-up">
      {/* Encabezado */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 border border-[#DCE4EE] rounded-lg shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[10px] font-bold uppercase tracking-wider">
              Finanzas
            </span>
            <span className="text-xs text-[#64748B]">Rendimiento y ROI</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-display font-bold text-[#0B1526] uppercase tracking-tight mt-1 truncate">
            Panel de Finanzas y Rentabilidad
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Ingresos multimoneda directos, punto de equilibrio y proyección financiera
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadFinances();
          }}
          disabled={refreshing}
          className="min-h-[44px] sm:min-h-0 self-start sm:self-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-[#FFFFFF] hover:bg-[#EAF0F6] active:scale-[0.98] text-[#0B1526] border border-[#CBD5E1] rounded-lg text-xs font-bold shadow-subtle transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#0369A1]' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas Multimoneda con micro-interacciones hover y elevación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* USD Directo */}
        <div className="group bg-[#FFFFFF] p-4 border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#059669]/40 transition-all duration-200 ease-out min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#059669]">Dólares (USD)</span>
            <div className="p-1.5 rounded-md bg-[#ECFDF5] text-[#059669] group-hover:scale-110 transition-transform flex-shrink-0">
              <DollarSign className="w-4 h-4 text-[#059669]" />
            </div>
          </div>
          <div className="mt-2 truncate">
            <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-[#0B1526]">
              ${summary.total_collected_usd.toLocaleString('es-ES')}
            </span>
            <span className="text-xs text-[#64748B] ml-1">USD</span>
          </div>
          <p className="text-[10px] text-[#475569] mt-1 truncate">Efectivo o transferencias en USD</p>
        </div>

        {/* Pesos COP */}
        <div className="group bg-[#FFFFFF] p-4 border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/40 transition-all duration-200 ease-out min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#0369A1]">Pesos (COP)</span>
            <div className="p-1.5 rounded-md bg-[#E0F2FE] text-[#0369A1] group-hover:scale-110 transition-transform flex-shrink-0">
              <Wallet className="w-4 h-4 text-[#0369A1]" />
            </div>
          </div>
          <div className="mt-2 truncate">
            <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-[#0B1526]">
              ${summary.total_collected_cop.toLocaleString('es-ES')}
            </span>
            <span className="text-xs text-[#64748B] ml-1">COP</span>
          </div>
          <p className="text-[10px] text-[#0369A1] mt-1 truncate">
            Fórmula: Pesos / <span className="font-mono tabular-nums font-semibold">{summary.rates.rate_cop_to_usd.toLocaleString()}</span> = USD
          </p>
        </div>

        {/* Bolívares BS */}
        <div className="group bg-[#FFFFFF] p-4 border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0284C7]/40 transition-all duration-200 ease-out min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#0284C7]">Bolívares (BS)</span>
            <div className="p-1.5 rounded-md bg-[#E0F2FE] text-[#0284C7] group-hover:scale-110 transition-transform flex-shrink-0">
              <Coins className="w-4 h-4 text-[#0284C7]" />
            </div>
          </div>
          <div className="mt-2 truncate">
            <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-[#0B1526]">
              Bs. {summary.total_collected_bs.toLocaleString('es-ES')}
            </span>
            <span className="text-xs text-[#64748B] ml-1">BS</span>
          </div>
          <p className="text-[10px] text-[#475569] mt-1 truncate">
            Fórmula: Bs / <span className="font-mono tabular-nums font-semibold">{summary.rates.rate_bs_to_usd}</span> = USD
          </p>
        </div>

        {/* Total Consolidado */}
        <div className="group bg-[#ECFDF5] p-4 border-2 border-[#059669] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-[#065F46]">Total Consolidado</span>
            <div className="p-1.5 rounded-md bg-[#D1FAE5] text-[#059669] group-hover:scale-110 transition-transform flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-[#059669]" />
            </div>
          </div>
          <div className="mt-2 truncate">
            <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-[#059669]">
              ${summary.total_equivalent_usd.toLocaleString('es-ES')}
            </span>
            <span className="text-xs text-[#065F46] font-bold ml-1">USD</span>
          </div>
          <p className="text-[10px] text-[#047857] font-medium mt-1 truncate">
            Equivalente de todas las divisas recaudadas
          </p>
        </div>
      </div>

      {/* Control de Inversión y Break-Even (ROI) */}
      <InvestmentTracker summary={summary} raffle={raffle} />

      {/* Gráfico de Recaudación Multimoneda */}
      <FinanceCharts
        data={chartData}
        period={chartPeriod}
        onPeriodChange={(p) => setChartPeriod(p)}
        rates={summary.rates}
      />
    </div>
  );
}
