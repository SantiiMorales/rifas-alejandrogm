'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import InvestmentTracker from '@/components/InvestmentTracker';
import FinanceCharts from '@/components/FinanceCharts';
import { FinanceChartPoint, FinanceSummary } from '@/lib/types';
import { DEFAULT_EXCHANGE_RATES, DEFAULT_FINANCE_CHART_DAY, fetchFinanceChart, fetchFinanceSummary } from '@/lib/api';

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
  const [chartData, setChartData] = useState<FinanceChartPoint[]>(DEFAULT_FINANCE_CHART_DAY);
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week'>('day');
  const [refreshing, setRefreshing] = useState(false);

  const loadFinances = async () => {
    try {
      const [sum, chart] = await Promise.all([
        fetchFinanceSummary(),
        fetchFinanceChart(chartPeriod),
      ]);
      setSummary(sum);
      setChartData(chart);
    } catch (err) {
      console.warn(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFinances();
  }, [chartPeriod]);

  return (
    <div className="space-y-5">
      {/* Encabezado Cero Degradados */}
      <div className="bg-[#12161F] p-5 border border-metallic rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#1EE868] text-black text-[10px] font-black uppercase">
              Finanzas
            </span>
            <span className="text-xs text-[#6E7785]">Rendimiento y ROI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide mt-1">
            Panel de Finanzas y Rentabilidad
          </h1>
          <p className="text-xs text-[#C4CBD4] mt-0.5">
            Ingresos multimoneda directos, punto de equilibrio y proyección
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadFinances();
          }}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2430] hover:bg-[#1E2430]/70 text-[#C4CBD4] hover:text-white border border-metallic rounded-lg text-xs font-bold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas Multimoneda Sólidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#12161F] p-4 border border-metallic rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#1EE868]">Dólares (USD)</span>
            <DollarSign className="w-4 h-4 text-[#1EE868]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">${summary.total_collected_usd.toLocaleString()}</span>
            <span className="text-xs text-[#6E7785] ml-1">USD</span>
          </div>
          <p className="text-[10px] text-[#C4CBD4] mt-1">Efectivo o directo en USD</p>
        </div>

        <div className="bg-[#12161F] p-4 border border-metallic rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#00D4FF]">Pesos (COP)</span>
            <span className="font-bold text-xs text-[#00D4FF]">COP$</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{summary.total_collected_cop.toLocaleString()}</span>
            <span className="text-xs text-[#6E7785] ml-1">COP</span>
          </div>
          <p className="text-[10px] text-[#00D4FF] mt-1">
            Fórmula: Pesos / {summary.rates.rate_cop_to_usd} = USD
          </p>
        </div>

        <div className="bg-[#12161F] p-4 border border-metallic rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#0077E6]">Bolívares (BS)</span>
            <span className="font-bold text-xs text-[#0077E6]">Bs.</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{summary.total_collected_bs.toLocaleString()}</span>
            <span className="text-xs text-[#6E7785] ml-1">BS</span>
          </div>
          <p className="text-[10px] text-[#C4CBD4] mt-1">
            Fórmula: Bs / {summary.rates.rate_bs_to_usd} = USD
          </p>
        </div>

        <div className="bg-[#1E2430] p-4 border border-[#1EE868] rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-white">Total Consolidado</span>
            <TrendingUp className="w-4 h-4 text-[#1EE868]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#1EE868]">
              ${summary.total_equivalent_usd.toLocaleString()}
            </span>
            <span className="text-xs text-white font-bold ml-1">USD</span>
          </div>
          <p className="text-[10px] text-[#C4CBD4] mt-1">Equivalente de todas las divisas</p>
        </div>
      </div>

      <InvestmentTracker summary={summary} />

      <FinanceCharts
        data={chartData}
        period={chartPeriod}
        onPeriodChange={(p) => setChartPeriod(p)}
      />
    </div>
  );
}
