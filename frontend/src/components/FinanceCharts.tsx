'use client';

import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { FinanceChartPoint } from '@/lib/types';

interface FinanceChartsProps {
  data: FinanceChartPoint[];
  period: 'day' | 'week';
  onPeriodChange: (p: 'day' | 'week') => void;
}

export default function FinanceCharts({
  data,
  period,
  onPeriodChange,
}: FinanceChartsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const validData = data && data.length > 0 ? data : [];
  const maxVal = Math.max(...validData.map((d) => Number(d.total_usd) || 0), 10);

  return (
    <div className="bg-[#12161F] p-5 border border-metallic rounded-lg space-y-4">
      {/* Selector Cero Degradados Encapsulado */}
      <div className="p-3 bg-[#05070A] border border-metallic rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#1E2430] text-[#1EE868] border border-metallic flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-[#1EE868]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Gráfico de Recaudación por Monedas
            </h3>
            <p className="text-xs text-[#C4CBD4]">
              Desglose en USD, COP y BS convertidos según el periodo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#12161F] p-1 rounded-lg border border-metallic">
          <button
            onClick={() => onPeriodChange('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              period === 'day' ? 'bg-[#1E2430] text-[#1EE868] border border-[#1EE868]' : 'text-[#C4CBD4] hover:text-white'
            }`}
          >
            Últimos 7 Días
          </button>
          <button
            onClick={() => onPeriodChange('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              period === 'week' ? 'bg-[#1E2430] text-[#00D4FF] border border-[#00D4FF]' : 'text-[#C4CBD4] hover:text-white'
            }`}
          >
            Últimas 6 Semanas
          </button>
        </div>
      </div>

      {/* Leyenda Sólida Encapsulada */}
      <div className="p-2.5 sm:px-3 sm:py-2 bg-[#05070A] border border-metallic rounded-lg flex flex-wrap items-center gap-3.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-[#1EE868] flex-shrink-0" />
          <span className="text-[#C4CBD4] font-medium">Dólares Directos (USD)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-[#00D4FF] flex-shrink-0" />
          <span className="text-[#C4CBD4] font-medium">Pesos (COP en USD)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-[#0077E6] flex-shrink-0" />
          <span className="text-[#C4CBD4] font-medium">Bolívares (BS en USD)</span>
        </div>
      </div>

      {/* Barras Sólidas Cero Degradados Encapsuladas */}
      <div className="p-3 sm:p-4 bg-[#05070A] border border-metallic rounded-lg">
        {validData.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6E7785]">
            No hay registros de recaudación en este período.
          </div>
        ) : (
          <div className="h-64 flex items-end gap-3 sm:gap-5 pt-8 pb-2 px-2 sm:px-4">
            {validData.map((item, idx) => {
              const total = Number(item.total_usd) || 0;
              const usd = Number(item.usd) || 0;
              const cop = Number(item.cop_in_usd) || 0;
              const bs = Number(item.bs_in_usd) || 0;

              // Altura porcentual calculada de la barra con altura mínima garantizada
              const barHeightPercent = Math.min(Math.max((total / maxVal) * 100, 10), 100);
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer select-none"
                >
                  {/* Tooltip flotante */}
                  {isHovered && (
                    <div className="absolute -top-16 z-30 p-2.5 bg-[#12161F] border border-metallic rounded-lg text-[11px] text-white whitespace-nowrap min-w-[130px] pointer-events-none shadow-2xl">
                      <div className="font-bold text-[#00D4FF]">{item.date_label}</div>
                      <div className="font-black text-white">Total: ${total} USD</div>
                      <div className="text-[10px] text-[#C4CBD4] mt-0.5">
                        USD: ${usd} · COP: ${cop} · BS: ${bs}
                      </div>
                    </div>
                  )}

                  {/* Valor monetario total sobre la barra */}
                  <span className="text-[10px] font-black text-[#1EE868] mb-1.5 opacity-90 group-hover:opacity-100">
                    ${total}
                  </span>

                  {/* Columna visible con altura explícita */}
                  <div
                    style={{ height: `${barHeightPercent}%` }}
                    className="w-full max-w-[42px] min-h-[20px] bg-[#12161F] rounded-t-lg overflow-hidden flex flex-col-reverse border-t-2 border-x border-metallic shadow-md transition-all group-hover:brightness-110"
                  >
                    <div
                      style={{ flex: usd > 0 ? usd : 0.0001 }}
                      className="w-full bg-[#1EE868]"
                      title={`USD Directo: $${usd}`}
                    />
                    <div
                      style={{ flex: cop > 0 ? cop : 0.0001 }}
                      className="w-full bg-[#00D4FF]"
                      title={`Pesos COP: $${cop}`}
                    />
                    <div
                      style={{ flex: bs > 0 ? bs : 0.0001 }}
                      className="w-full bg-[#0077E6]"
                      title={`Bolívares BS: $${bs}`}
                    />
                  </div>

                  {/* Etiqueta del período */}
                  <span className="mt-2 text-[10px] font-bold text-[#6E7785] group-hover:text-white truncate">
                    {item.date_label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
