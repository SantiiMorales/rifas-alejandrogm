'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, TrendingUp, Calendar, Award } from 'lucide-react';
import { ExchangeRate, FinanceChartPoint } from '@/lib/types';

interface FinanceChartsProps {
  data: FinanceChartPoint[];
  period: 'day' | 'week';
  onPeriodChange: (p: 'day' | 'week') => void;
  rates?: ExchangeRate;
}

type CurrencyFilterMode = 'ALL' | 'USD' | 'COP' | 'BS';

interface ActiveTooltipState {
  index: number;
  item: FinanceChartPoint;
  anchorX: number;
  anchorY: number;
  anchorBottom: number;
}

// Altura fija determinista en píxeles para el área de trazado del gráfico
const PLOT_HEIGHT_PX = 220;

const SPANISH_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SPANISH_DAYS_FULL = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// Helper seguro para parsear fechas sin desfase UTC, asegurando concordancia exacta día-número
function parseDateDisplay(rawLabel: string) {
  const trimmed = rawLabel.trim();

  // Si es un período semanal tipo "Sem 1", "Sem 2"
  if (/^sem\s*\d+/i.test(trimmed) && !/\d{1,2}\/\d{1,2}/.test(trimmed)) {
    return {
      desktopLine1: trimmed,
      desktopLine2: '',
      mobileText: trimmed,
      badgeText: trimmed,
      tooltipTitle: trimmed.replace(/^sem\s*/i, 'Semana '),
    };
  }

  let dayNum: number | null = null;
  let monthNum: number = 11; // default noviembre
  let yearNum: number = 2026;

  // Formato ISO: "2026-11-19"
  const isoMatch = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    yearNum = parseInt(isoMatch[1], 10);
    monthNum = parseInt(isoMatch[2], 10);
    dayNum = parseInt(isoMatch[3], 10);
  } else {
    // Formato con barra: "19/11" o "19/11/2026"
    const slashMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (slashMatch) {
      dayNum = parseInt(slashMatch[1], 10);
      monthNum = parseInt(slashMatch[2], 10);
      if (slashMatch[3]) yearNum = parseInt(slashMatch[3], 10);
    } else {
      // Número de día suelto: "19"
      const numMatch = trimmed.match(/\b(\d{1,2})\b/);
      if (numMatch) {
        dayNum = parseInt(numMatch[1], 10);
      }
    }
  }

  if (dayNum !== null && !isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
    // new Date(year, monthIndex, day) en hora local evita cualquier desplazamiento por UTC
    const localDate = new Date(yearNum, monthNum - 1, dayNum);
    const dayOfWeek = localDate.getDay(); // 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie, 6 = Sáb
    const dayShort = SPANISH_DAYS[dayOfWeek];
    const dayFull = SPANISH_DAYS_FULL[dayOfWeek];
    const monthShort = MONTH_NAMES[monthNum - 1].slice(0, 3);
    const monthFull = MONTH_NAMES[monthNum - 1];

    const isHoy = /hoy/i.test(trimmed);
    const hoySuffix = isHoy ? ' (Hoy)' : '';

    return {
      desktopLine1: `${dayShort}${hoySuffix}`,
      desktopLine2: `${dayNum} ${monthShort}`,
      mobileText: `${dayShort} ${dayNum}`,
      badgeText: `${dayShort} ${dayNum} ${monthShort}${hoySuffix}`,
      tooltipTitle: `${dayFull}, ${dayNum} de ${monthFull}${hoySuffix}`,
    };
  }

  // Fallback si no tiene número de día
  return {
    desktopLine1: trimmed,
    desktopLine2: '',
    mobileText: trimmed,
    badgeText: trimmed,
    tooltipTitle: trimmed,
  };
}

// Hook isomórfico para layout effect seguro en Next.js (SSR friendly)
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export default function FinanceCharts({
  data,
  period,
  onPeriodChange,
  rates,
}: FinanceChartsProps) {
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilterMode>('ALL');
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltipState | null>(null);
  const [mounted, setMounted] = useState(false);

  // Dimensiones medidas en tiempo real del tooltip
  const [tooltipDimensions, setTooltipDimensions] = useState<{ width: number; height: number }>({
    width: 250,
    height: 140,
  });
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Medir dimensiones reales del tooltip una vez renderizado en el DOM
  useIsomorphicLayoutEffect(() => {
    if (activeTooltip && tooltipRef.current) {
      const el = tooltipRef.current;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0 && (w !== tooltipDimensions.width || h !== tooltipDimensions.height)) {
        setTooltipDimensions({ width: w, height: h });
      }
    }
  }, [activeTooltip, tooltipDimensions.width, tooltipDimensions.height]);

  // Cerrar tooltip en scroll de ventana, resize o click exterior
  useEffect(() => {
    const handleDismiss = () => setActiveTooltip(null);
    window.addEventListener('scroll', handleDismiss, { passive: true });
    window.addEventListener('resize', handleDismiss, { passive: true });
    window.addEventListener('pointerdown', handleDismiss);
    return () => {
      window.removeEventListener('scroll', handleDismiss);
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('pointerdown', handleDismiss);
    };
  }, []);

  const copRate = rates?.rate_cop_to_usd || 4200.0;
  const bsRate = rates?.rate_bs_to_usd || 60.0;

  const validData = useMemo(() => (data && data.length > 0 ? data : []), [data]);

  // Formato compacto para números de ejes y cabeceras de barras
  const formatCompact = useCallback(
    (val: number, mode: CurrencyFilterMode = currencyFilter): string => {
      const prefix = mode === 'BS' ? 'Bs ' : '$';
      if (val >= 1_000_000) {
        return `${prefix}${(val / 1_000_000).toFixed(1)}M`;
      }
      if (val >= 10_000) {
        return `${prefix}${(val / 1_000).toFixed(0)}k`;
      }
      if (val >= 1_000) {
        return `${prefix}${(val / 1_000).toFixed(1)}k`;
      }
      return `${prefix}${val % 1 === 0 ? val : val.toFixed(1)}`;
    },
    [currencyFilter]
  );

  // Valor máximo según la moneda seleccionada para escalar honestamente el gráfico y eje Y
  const maxValInCurr = useMemo(() => {
    if (validData.length === 0) return 100;
    if (currencyFilter === 'ALL') {
      const max = Math.max(...validData.map((d) => Number(d.total_usd) || 0));
      return Math.max(max, 20);
    }
    if (currencyFilter === 'USD') {
      const max = Math.max(...validData.map((d) => Number(d.usd) || 0));
      return Math.max(max, 10);
    }
    if (currencyFilter === 'COP') {
      const max = Math.max(
        ...validData.map((d) =>
          d.cop_amount !== undefined ? d.cop_amount : (Number(d.cop_in_usd) || 0) * copRate
        )
      );
      return Math.max(max, 50000);
    }
    // BS
    const max = Math.max(
      ...validData.map((d) =>
        d.bs_amount !== undefined ? d.bs_amount : (Number(d.bs_in_usd) || 0) * bsRate
      )
    );
    return Math.max(max, 500);
  }, [validData, currencyFilter, copRate, bsRate]);

  // KPIs del Período recalculados exactamente según la moneda filtrada
  const periodKpis = useMemo(() => {
    if (currencyFilter === 'ALL') {
      const totalUsd = validData.reduce((acc, d) => acc + (Number(d.total_usd) || 0), 0);
      const avgUsd = validData.length > 0 ? totalUsd / validData.length : 0;
      let bestPoint: FinanceChartPoint | null = null;
      let bestVal = -1;
      validData.forEach((d) => {
        const v = Number(d.total_usd) || 0;
        if (v > bestVal) {
          bestVal = v;
          bestPoint = d;
        }
      });
      const bestLabel = bestPoint ? parseDateDisplay((bestPoint as FinanceChartPoint).date_label).badgeText : '';
      return {
        total: `$${totalUsd.toLocaleString('es-ES')} USD`,
        totalSub: period === 'day' ? 'Suma de los 7 días multimoneda' : 'Suma de las 6 semanas multimoneda',
        avg: `$${avgUsd.toFixed(1)} USD`,
        best: bestVal > 0 ? `$${bestVal.toLocaleString('es-ES')} USD` : '$0 USD',
        bestLabel: bestLabel || 'Sin recaudación',
      };
    }

    if (currencyFilter === 'USD') {
      const totalUsd = validData.reduce((acc, d) => acc + (Number(d.usd) || 0), 0);
      const avgUsd = validData.length > 0 ? totalUsd / validData.length : 0;
      let bestPoint: FinanceChartPoint | null = null;
      let bestVal = -1;
      validData.forEach((d) => {
        const v = Number(d.usd) || 0;
        if (v > bestVal) {
          bestVal = v;
          bestPoint = d;
        }
      });
      const bestLabel = bestPoint ? parseDateDisplay((bestPoint as FinanceChartPoint).date_label).badgeText : '';
      return {
        total: `$${totalUsd.toLocaleString('es-ES')} USD`,
        totalSub: period === 'day' ? 'Suma de los 7 días en USD' : 'Suma de las 6 semanas en USD',
        avg: `$${avgUsd.toFixed(1)} USD`,
        best: bestVal > 0 ? `$${bestVal.toLocaleString('es-ES')} USD` : '$0 USD',
        bestLabel: bestLabel || 'Sin pagos USD',
      };
    }

    if (currencyFilter === 'COP') {
      const totalCop = validData.reduce((acc, d) => {
        const cop = d.cop_amount !== undefined ? d.cop_amount : (Number(d.cop_in_usd) || 0) * copRate;
        return acc + cop;
      }, 0);
      const avgCop = validData.length > 0 ? totalCop / validData.length : 0;
      let bestPoint: FinanceChartPoint | null = null;
      let bestVal = -1;
      validData.forEach((d) => {
        const cop = d.cop_amount !== undefined ? d.cop_amount : (Number(d.cop_in_usd) || 0) * copRate;
        if (cop > bestVal) {
          bestVal = cop;
          bestPoint = d;
        }
      });
      const bestLabel = bestPoint ? parseDateDisplay((bestPoint as FinanceChartPoint).date_label).badgeText : '';
      const equivUsd = copRate > 0 ? (totalCop / copRate).toFixed(1) : '0';
      return {
        total: `$${Math.round(totalCop).toLocaleString('es-ES')} COP`,
        totalSub: `Suma de los ${period === 'day' ? '7 días' : '6 semanas'} · ≈ $${equivUsd} USD`,
        avg: `$${Math.round(avgCop).toLocaleString('es-ES')} COP`,
        best: bestVal > 0 ? `$${Math.round(bestVal).toLocaleString('es-ES')} COP` : '$0 COP',
        bestLabel: bestLabel || 'Sin pagos COP',
      };
    }

    // BS (Bolívares)
    const totalBs = validData.reduce((acc, d) => {
      const bs = d.bs_amount !== undefined ? d.bs_amount : (Number(d.bs_in_usd) || 0) * bsRate;
      return acc + bs;
    }, 0);
    const avgBs = validData.length > 0 ? totalBs / validData.length : 0;
    let bestPoint: FinanceChartPoint | null = null;
    let bestVal = -1;
    validData.forEach((d) => {
      const bs = d.bs_amount !== undefined ? d.bs_amount : (Number(d.bs_in_usd) || 0) * bsRate;
      if (bs > bestVal) {
        bestVal = bs;
        bestPoint = d;
      }
    });
    const bestLabel = bestPoint ? parseDateDisplay((bestPoint as FinanceChartPoint).date_label).badgeText : '';
    const equivUsd = bsRate > 0 ? (totalBs / bsRate).toFixed(1) : '0';
    return {
      total: `Bs. ${totalBs.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      totalSub: `Suma de los ${period === 'day' ? '7 días' : '6 semanas'} · ≈ $${equivUsd} USD`,
      avg: `Bs. ${avgBs.toFixed(1)}`,
      best: bestVal > 0 ? `Bs. ${bestVal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : 'Bs 0',
      bestLabel: bestLabel || 'Sin pagos BS',
    };
  }, [validData, currencyFilter, period, copRate, bsRate]);

  return (
    <div className="bg-[#FFFFFF] p-4 sm:p-5 border border-[#DCE4EE] rounded-lg shadow-subtle space-y-4 sm:space-y-5 animate-fade-in-up">
      {/* Encabezado con Selectores de Período y Moneda */}
      <div className="p-3 sm:p-4 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-lg bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] flex items-center justify-center flex-shrink-0 shadow-subtle">
            <BarChart3 className="w-5 h-5 text-[#0369A1]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-display font-bold text-[#0B1526] uppercase tracking-wider">
                Recaudación por Período y Monedas
              </h3>
            </div>
            <p className="text-xs text-[#475569] mt-0.5">
              Comparativa de ingresos multimoneda con filtrado real por divisa
            </p>
          </div>
        </div>

        {/* Controles Segmentados: Moneda y Período */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Segmented Control de Moneda: 4 opciones */}
          <div className="flex items-center bg-[#FFFFFF] p-1 rounded-lg border border-[#DCE4EE] shadow-subtle overflow-x-auto">
            <button
              onClick={() => setCurrencyFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 whitespace-nowrap active:scale-[0.98] ${
                currencyFilter === 'ALL'
                  ? 'bg-[#0369A1] text-white shadow-subtle'
                  : 'text-[#475569] hover:text-[#0B1526] hover:bg-[#EAF0F6]'
              }`}
            >
              Todas (USD)
            </button>
            <button
              onClick={() => setCurrencyFilter('USD')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 whitespace-nowrap active:scale-[0.98] ${
                currencyFilter === 'USD'
                  ? 'bg-[#059669] text-white shadow-subtle'
                  : 'text-[#475569] hover:text-[#0B1526] hover:bg-[#EAF0F6]'
              }`}
            >
              USD Directos
            </button>
            <button
              onClick={() => setCurrencyFilter('COP')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 whitespace-nowrap active:scale-[0.98] ${
                currencyFilter === 'COP'
                  ? 'bg-[#0369A1] text-white shadow-subtle'
                  : 'text-[#475569] hover:text-[#0B1526] hover:bg-[#EAF0F6]'
              }`}
            >
              COP (Pesos)
            </button>
            <button
              onClick={() => setCurrencyFilter('BS')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 whitespace-nowrap active:scale-[0.98] ${
                currencyFilter === 'BS'
                  ? 'bg-[#0EA5E9] text-white shadow-subtle'
                  : 'text-[#475569] hover:text-[#0B1526] hover:bg-[#EAF0F6]'
              }`}
            >
              BS (Bolívares)
            </button>
          </div>

          {/* Segmented Control de Período */}
          <div className="flex items-center bg-[#FFFFFF] p-1 rounded-lg border border-[#DCE4EE] shadow-subtle">
            <button
              onClick={() => onPeriodChange('day')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                period === 'day'
                  ? 'bg-[#EAF0F6] text-[#0369A1] border border-[#CBD5E1] shadow-subtle'
                  : 'text-[#475569] hover:text-[#0B1526]'
              }`}
            >
              Últimos 7 Días
            </button>
            <button
              onClick={() => onPeriodChange('week')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                period === 'week'
                  ? 'bg-[#EAF0F6] text-[#0369A1] border border-[#CBD5E1] shadow-subtle'
                  : 'text-[#475569] hover:text-[#0B1526]'
              }`}
            >
              Últimas 6 Semanas
            </button>
          </div>
        </div>
      </div>

      {/* 3 Tarjetas de Resumen Ejecutivo de Período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* TOTAL PERÍODO */}
        <div className="group p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/30 transition-all duration-200 ease-out">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Período</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#0369A1] group-hover:scale-110 transition-transform flex-shrink-0" />
          </div>
          <div className="mt-1 truncate">
            <span className="text-base sm:text-xl font-mono tabular-nums font-bold text-[#0B1526]">
              {periodKpis.total}
            </span>
          </div>
          <p className="text-[10px] text-[#475569] mt-0.5 truncate">
            {periodKpis.totalSub}
          </p>
        </div>

        {/* PROMEDIO DIARIO */}
        <div className="group p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/30 transition-all duration-200 ease-out">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Promedio Diario</span>
            <Calendar className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0369A1] transition-colors flex-shrink-0" />
          </div>
          <div className="mt-1 truncate">
            <span className="text-base sm:text-xl font-mono tabular-nums font-bold text-[#0369A1]">
              {periodKpis.avg}
            </span>
          </div>
          <p className="text-[10px] text-[#475569] mt-0.5 truncate">
            Rendimiento promedio por registro
          </p>
        </div>

        {/* MEJOR REGISTRO (con fecha en español sin desfase UTC) */}
        <div className="group p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#059669]/30 transition-all duration-200 ease-out">
          <div className="flex items-center justify-between text-[#059669]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Mejor Registro</span>
            <Award className="w-3.5 h-3.5 text-[#059669] group-hover:scale-110 transition-transform flex-shrink-0" />
          </div>
          <div className="mt-1 truncate">
            <span className="text-base sm:text-xl font-mono tabular-nums font-bold text-[#059669]">
              {periodKpis.best}
            </span>
          </div>
          <p className="text-[10px] text-[#059669] font-semibold mt-0.5 truncate">
            {periodKpis.bestLabel}
          </p>
        </div>
      </div>

      {/* Leyenda Dinámica según el modo seleccionado */}
      <div className="p-2.5 sm:px-3 sm:py-2 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3.5">
          {currencyFilter === 'ALL' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#059669] flex-shrink-0" />
                <span className="text-[#475569] font-medium">USD Directos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#0369A1] flex-shrink-0" />
                <span className="text-[#475569] font-medium">Pesos (COP en USD)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#0EA5E9] flex-shrink-0" />
                <span className="text-[#475569] font-medium">Bolívares (BS en USD)</span>
              </div>
            </>
          ) : currencyFilter === 'USD' ? (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#059669] flex-shrink-0" />
              <span className="text-[#059669] font-bold">Filtro Activo: Únicamente Pagos Directos en Dólares (USD)</span>
            </div>
          ) : currencyFilter === 'COP' ? (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#0369A1] flex-shrink-0" />
              <span className="text-[#0369A1] font-bold">Filtro Activo: Únicamente Pagos en Pesos Colombianos (COP)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#0EA5E9] flex-shrink-0" />
              <span className="text-[#0284C7] font-bold">Filtro Activo: Únicamente Pagos en Bolívares (BS)</span>
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono tabular-nums text-[#64748B]">
          {currencyFilter === 'COP'
            ? `Tasa: 1 USD = ${copRate.toLocaleString()} COP`
            : currencyFilter === 'BS'
            ? `Tasa: 1 USD = ${bsRate} BS`
            : `Tasas: 1 USD = ${copRate.toLocaleString()} COP · 1 USD = ${bsRate} BS`}
        </div>
      </div>

      {/* Canvas del Gráfico con Eje Y y Barras con Altura Exacta en Píxeles */}
      <div className="p-3 sm:p-5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg">
        {validData.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B] space-y-2">
            <BarChart3 className="w-8 h-8 text-[#CBD5E1] mx-auto" />
            <p className="font-semibold text-[#475569]">No hay registros de recaudación en este período.</p>
            <p className="text-[11px]">Las ventas y abonos se reflejarán automáticamente aquí.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Contenedor del gráfico con Eje Y a la izquierda alineado a PLOT_HEIGHT_PX */}
            <div className="flex items-stretch gap-2 sm:gap-3">
              {/* Eje Y de referencia compacta (con pt-7 para alinearse a la cima de PLOT_HEIGHT_PX) */}
              <div className="pt-7 flex-shrink-0 select-none">
                <div
                  className="flex flex-col justify-between items-end text-[10px] font-mono tabular-nums text-[#64748B] w-12 sm:w-16"
                  style={{ height: `${PLOT_HEIGHT_PX}px` }}
                >
                  <span className="truncate leading-none">{formatCompact(maxValInCurr, currencyFilter)}</span>
                  <span className="truncate leading-none">{formatCompact(maxValInCurr * 0.75, currencyFilter)}</span>
                  <span className="truncate leading-none">{formatCompact(maxValInCurr * 0.5, currencyFilter)}</span>
                  <span className="truncate leading-none">{formatCompact(maxValInCurr * 0.25, currencyFilter)}</span>
                  <span className="leading-none">{currencyFilter === 'BS' ? 'Bs 0' : '$0'}</span>
                </div>
              </div>

              {/* Área del gráfico con trazado en píxeles y fila inferior de fechas */}
              <div className="relative flex-1 overflow-x-auto">
                <div className="min-w-[280px]">
                  {/* Área de trazado con altura fija PLOT_HEIGHT_PX + margen superior de 28px para etiquetas */}
                  <div
                    className="relative pt-7"
                    style={{ height: `${PLOT_HEIGHT_PX + 28}px` }}
                  >
                    {/* Líneas horizontales de guía en el fondo exactamente sobre PLOT_HEIGHT_PX */}
                    <div
                      className="absolute inset-x-0 bottom-0 flex flex-col justify-between pointer-events-none z-0"
                      style={{ height: `${PLOT_HEIGHT_PX}px` }}
                    >
                      <div className="border-b border-[#DCE4EE] border-dashed w-full" />
                      <div className="border-b border-[#DCE4EE] border-dashed w-full" />
                      <div className="border-b border-[#DCE4EE] border-dashed w-full" />
                      <div className="border-b border-[#DCE4EE] border-dashed w-full" />
                      <div className="border-b border-[#CBD5E1] w-full" />
                    </div>

                    {/* Contenedor de columnas de barras alineadas a la base $0 */}
                    <div className="relative z-10 flex items-end gap-2 sm:gap-3 md:gap-4 px-1 sm:px-2 h-full">
                      {validData.map((item, idx) => {
                        const totalUsd = Number(item.total_usd) || 0;
                        const usdDirect = Number(item.usd) || 0;
                        const copInUsd = Number(item.cop_in_usd) || 0;
                        const bsInUsd = Number(item.bs_in_usd) || 0;
                        const copReal = item.cop_amount !== undefined ? item.cop_amount : copInUsd * copRate;
                        const bsReal = item.bs_amount !== undefined ? item.bs_amount : bsInUsd * bsRate;

                        // Monto real filtrado según el modo activo
                        let barVal = 0;
                        if (currencyFilter === 'ALL') {
                          barVal = totalUsd;
                        } else if (currencyFilter === 'USD') {
                          barVal = usdDirect;
                        } else if (currencyFilter === 'COP') {
                          barVal = copReal;
                        } else {
                          barVal = bsReal;
                        }

                        const isZero = barVal <= 0;
                        // Altura calculada en píxeles exactos proporcional a PLOT_HEIGHT_PX
                        const barHeightPx = isZero
                          ? 4
                          : Math.max(8, Math.round((barVal / (maxValInCurr || 1)) * PLOT_HEIGHT_PX));

                        const isHovered = activeTooltip?.index === idx;
                        const isAnotherHovered = activeTooltip !== null && !isHovered;

                        const displayValText = isZero
                          ? currencyFilter === 'BS'
                            ? 'Bs 0'
                            : '$0'
                          : formatCompact(barVal, currencyFilter);

                        return (
                          <div
                            key={idx}
                            onMouseEnter={(e) => {
                              const barAnchor = e.currentTarget.querySelector('.bar-anchor') as HTMLElement | null;
                              const targetEl = barAnchor || e.currentTarget;
                              const rect = targetEl.getBoundingClientRect();
                              setActiveTooltip({
                                index: idx,
                                item,
                                anchorX: rect.left + rect.width / 2,
                                anchorY: rect.top,
                                anchorBottom: rect.bottom,
                              });
                            }}
                            onMouseLeave={() => setActiveTooltip(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              const barAnchor = e.currentTarget.querySelector('.bar-anchor') as HTMLElement | null;
                              const targetEl = barAnchor || e.currentTarget;
                              const rect = targetEl.getBoundingClientRect();
                              setActiveTooltip({
                                index: idx,
                                item,
                                anchorX: rect.left + rect.width / 2,
                                anchorY: rect.top,
                                anchorBottom: rect.bottom,
                              });
                            }}
                            className={`relative flex-1 min-w-[28px] sm:min-w-[36px] h-full flex flex-col items-center justify-end group cursor-pointer select-none transition-all duration-200 ${
                              isAnotherHovered ? 'opacity-40' : 'opacity-100'
                            }`}
                          >
                            {/* Contenedor exacto de ancla (monto superior + barra visible) */}
                            <div className="bar-anchor w-full flex flex-col items-center justify-end">
                              {/* Valor monetario total sobre la barra (nunca colisiona gracias a pt-7) */}
                              <span
                                className={`text-[10px] font-mono tabular-nums font-bold mb-1.5 shrink-0 leading-none transition-all duration-200 truncate max-w-full text-center ${
                                  isHovered
                                    ? 'scale-105 text-[#0369A1]'
                                    : isZero
                                    ? 'text-[#94A3B8]'
                                    : 'text-[#0B1526] opacity-90'
                                }`}
                              >
                                {displayValText}
                              </span>

                              {/* Barra visible en píxeles exactos o línea base si es 0 */}
                              {isZero ? (
                                <div
                                  className="w-full max-w-[38px] bg-slate-200/80 rounded-full transition-all duration-300 ease-out"
                                  style={{ height: '4px' }}
                                />
                              ) : (
                                <div
                                  style={{ height: `${barHeightPx}px` }}
                                  className={`w-full max-w-[44px] rounded-t-md overflow-hidden flex flex-col-reverse border-t-2 border-x border-[#CBD5E1] shadow-subtle transition-all duration-300 ease-out ${
                                    isHovered
                                      ? 'border-[#0369A1] shadow-md scale-[1.03]'
                                      : 'hover:brightness-105'
                                  }`}
                                >
                                  {currencyFilter === 'ALL' ? (
                                    <>
                                      {/* Modo apilado: los segmentos usan flexGrow para llenar exactamente barHeightPx */}
                                      <div
                                        style={{ flexGrow: usdDirect > 0 ? usdDirect : 0 }}
                                        className={`w-full bg-[#059669] transition-all ${usdDirect > 0 ? 'min-h-[2px]' : 'h-0'}`}
                                      />
                                      <div
                                        style={{ flexGrow: copInUsd > 0 ? copInUsd : 0 }}
                                        className={`w-full bg-[#0369A1] transition-all ${copInUsd > 0 ? 'min-h-[2px]' : 'h-0'}`}
                                      />
                                      <div
                                        style={{ flexGrow: bsInUsd > 0 ? bsInUsd : 0 }}
                                        className={`w-full bg-[#0EA5E9] transition-all ${bsInUsd > 0 ? 'min-h-[2px]' : 'h-0'}`}
                                      />
                                    </>
                                  ) : currencyFilter === 'USD' ? (
                                    <div className="w-full h-full bg-[#059669] transition-all" />
                                  ) : currencyFilter === 'COP' ? (
                                    <div className="w-full h-full bg-[#0369A1] transition-all" />
                                  ) : (
                                    <div className="w-full h-full bg-[#0EA5E9] transition-all" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fila separada de fechas del eje X inmediatamente debajo de la línea base $0 */}
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4 px-1 sm:px-2 pt-2.5 pb-1 select-none">
                    {validData.map((item, idx) => {
                      const dateMeta = parseDateDisplay(item.date_label);
                      const isHovered = activeTooltip?.index === idx;

                      return (
                        <div
                          key={idx}
                          className="flex-1 min-w-[28px] sm:min-w-[36px] flex flex-col items-center justify-start text-center"
                        >
                          {/* Versión Desktop: 2 líneas compactas */}
                          <div className="hidden sm:flex flex-col items-center">
                            <span
                              className={`text-[10px] font-bold uppercase transition-colors ${
                                isHovered ? 'text-[#0369A1]' : 'text-[#475569]'
                              }`}
                            >
                              {dateMeta.desktopLine1}
                            </span>
                            {dateMeta.desktopLine2 && (
                              <span className="text-[9px] font-mono tabular-nums text-[#64748B]">
                                {dateMeta.desktopLine2}
                              </span>
                            )}
                          </div>

                          {/* Versión Móvil: texto compacto */}
                          <span
                            className={`sm:hidden text-[9px] font-bold truncate max-w-full ${
                              isHovered ? 'text-[#0369A1]' : 'text-[#64748B]'
                            }`}
                          >
                            {dateMeta.mobileText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOOLTIP ÚNICO FLOTANTE ANTI-RECORTE RENDERIZADO CON PORTAL */}
      {mounted &&
        activeTooltip &&
        typeof document !== 'undefined' &&
        createPortal(
          (() => {
            const { item, anchorX, anchorY, anchorBottom } = activeTooltip;
            const totalUsd = Number(item.total_usd) || 0;
            const usdDirect = Number(item.usd) || 0;
            const copInUsd = Number(item.cop_in_usd) || 0;
            const bsInUsd = Number(item.bs_in_usd) || 0;
            const copReal = item.cop_amount !== undefined ? item.cop_amount : copInUsd * copRate;
            const bsReal = item.bs_amount !== undefined ? item.bs_amount : bsInUsd * bsRate;
            const countUsd = item.count_usd ?? (usdDirect > 0 ? 1 : 0);
            const countCop = item.count_cop ?? (copInUsd > 0 ? 1 : 0);
            const countBs = item.count_bs ?? (bsInUsd > 0 ? 1 : 0);
            const countTotal = item.count_total ?? (countUsd + countCop + countBs);

            const dateMeta = parseDateDisplay(item.date_label);

            const tooltipWidth = tooltipDimensions.width || 250;
            const tooltipHeight = tooltipDimensions.height || 140;

            // Clamping horizontal seguro en píxeles exactos
            const rawLeft = anchorX - tooltipWidth / 2;
            const viewportW = typeof window !== 'undefined' ? window.innerWidth : 360;
            const maxLeft = viewportW - tooltipWidth - 12;
            const clampedLeft = Math.max(12, Math.min(rawLeft, maxLeft));

            // Posicionamiento vertical: si no cabe arriba (anchorY - tooltipHeight - 12 < 12), voltear abajo
            const isFlippedBelow = anchorY - tooltipHeight - 12 < 12;
            const topPos = isFlippedBelow ? anchorBottom + 12 : anchorY - tooltipHeight - 12;

            // Cálculo dinámico de la flecha: apunta siempre al centro de la barra (anchorX)
            const arrowLeft = Math.max(18, Math.min(anchorX - clampedLeft, tooltipWidth - 18));

            return (
              <div
                ref={tooltipRef}
                className="fixed z-[9999] pointer-events-none select-none"
                style={{
                  left: `${clampedLeft}px`,
                  top: `${topPos}px`,
                  width: `${tooltipWidth}px`,
                }}
              >
                {/* Div interno con estilos visuales y animación sutil sin colisionar con left/top */}
                <div className="relative p-3 bg-[#0B1526] border border-[#1E293B] rounded-lg text-white shadow-modal text-xs animate-scale-in">
                  {/* Flechita / Pin indicador alineado al centro exacto de la barra */}
                  <div
                    className={`absolute w-0 h-0 border-x-4 border-x-transparent -translate-x-1/2 ${
                      isFlippedBelow
                        ? '-top-1.5 border-b-4 border-b-[#0B1526]'
                        : '-bottom-1.5 border-t-4 border-t-[#0B1526]'
                    }`}
                    style={{ left: `${arrowLeft}px` }}
                  />

                  {/* Cabecera: Fecha completa en español */}
                  <div className="font-bold text-[#38BDF8] pb-1.5 border-b border-[#1E293B] flex items-center justify-between">
                    <span>{dateMeta.tooltipTitle}</span>
                    {countTotal > 0 && currencyFilter === 'ALL' && (
                      <span className="text-[10px] font-mono text-[#94A3B8]">
                        {countTotal} {countTotal === 1 ? 'pago' : 'pagos'}
                      </span>
                    )}
                  </div>

                  {/* Contenido según el modo activo */}
                  {currencyFilter === 'ALL' ? (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[#94A3B8] text-[11px]">Total consolidado:</span>
                        <span className="font-mono tabular-nums font-bold text-white text-sm">
                          ${totalUsd.toLocaleString('es-ES')} USD
                        </span>
                      </div>

                      {totalUsd === 0 ? (
                        <p className="text-[11px] text-[#94A3B8] italic pt-0.5">
                          Sin recaudación registrada
                        </p>
                      ) : (
                        <div className="space-y-1 pt-1 border-t border-[#1E293B] text-[10px] font-mono tabular-nums">
                          {usdDirect > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-[#34D399]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                                USD Directo:
                              </span>
                              <span className="text-white">${usdDirect.toLocaleString('es-ES')} USD</span>
                            </div>
                          )}
                          {copInUsd > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0369A1]" />
                                Pesos (COP):
                              </span>
                              <span className="text-white">
                                ${Math.round(copReal).toLocaleString('es-ES')} (${copInUsd} USD)
                              </span>
                            </div>
                          )}
                          {bsInUsd > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-[#7DD3FC]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                                Bolívares (BS):
                              </span>
                              <span className="text-white">
                                Bs. {bsReal.toLocaleString('es-ES')} (${bsInUsd} USD)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : currencyFilter === 'USD' ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[#94A3B8] text-[11px]">Pagos en USD:</span>
                        <span className="font-mono tabular-nums font-bold text-[#34D399] text-sm">
                          ${usdDirect.toLocaleString('es-ES')} USD
                        </span>
                      </div>
                      {usdDirect === 0 ? (
                        <p className="text-[11px] text-[#94A3B8] italic pt-0.5">Sin ingresos en USD</p>
                      ) : (
                        <div className="pt-1 border-t border-[#1E293B] flex items-center justify-between text-[10px] font-mono tabular-nums text-[#94A3B8]">
                          <span>Transacciones en USD:</span>
                          <span className="text-white font-bold">{countUsd > 0 ? countUsd : 1}</span>
                        </div>
                      )}
                    </div>
                  ) : currencyFilter === 'COP' ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[#94A3B8] text-[11px]">Pagos en COP:</span>
                        <span className="font-mono tabular-nums font-bold text-[#38BDF8] text-sm">
                          ${Math.round(copReal).toLocaleString('es-ES')} COP
                        </span>
                      </div>
                      {copReal === 0 ? (
                        <p className="text-[11px] text-[#94A3B8] italic pt-0.5">Sin ingresos en Pesos COP</p>
                      ) : (
                        <div className="space-y-0.5 pt-1 border-t border-[#1E293B] text-[10px] font-mono tabular-nums text-[#94A3B8]">
                          <div className="flex items-center justify-between">
                            <span>Equivalente en USD:</span>
                            <span className="text-white font-bold">≈ ${copInUsd.toLocaleString('es-ES')} USD</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Transacciones en COP:</span>
                            <span className="text-white font-bold">{countCop > 0 ? countCop : 1}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[#94A3B8] text-[11px]">Pagos en Bolívares:</span>
                        <span className="font-mono tabular-nums font-bold text-[#7DD3FC] text-sm">
                          Bs. {bsReal.toLocaleString('es-ES')}
                        </span>
                      </div>
                      {bsReal === 0 ? (
                        <p className="text-[11px] text-[#94A3B8] italic pt-0.5">Sin ingresos en Bolívares</p>
                      ) : (
                        <div className="space-y-0.5 pt-1 border-t border-[#1E293B] text-[10px] font-mono tabular-nums text-[#94A3B8]">
                          <div className="flex items-center justify-between">
                            <span>Equivalente en USD:</span>
                            <span className="text-white font-bold">≈ ${bsInUsd.toLocaleString('es-ES')} USD</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Transacciones en BS:</span>
                            <span className="text-white font-bold">{countBs > 0 ? countBs : 1}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })(),
          document.body
        )}
    </div>
  );
}
