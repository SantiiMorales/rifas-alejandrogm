'use client';

import React from 'react';
import { Target, CheckCircle, AlertCircle, ArrowUpRight, ShieldCheck, DollarSign } from 'lucide-react';
import { FinanceSummary, Raffle } from '@/lib/types';

interface InvestmentTrackerProps {
  summary: FinanceSummary;
  raffle?: Raffle | null;
}

export default function InvestmentTracker({ summary, raffle }: InvestmentTrackerProps) {
  const inversionTotal = Number(summary.total_investment_usd) || 0;
  const recaudadoActual = Number(summary.total_equivalent_usd) || 0;
  const ticketPrice = Number(raffle?.ticket_price_usd) || 10;
  const totalNumbers = Number(raffle?.total_numbers) || 100;

  // Recaudación máxima teórica al vender el 100% de los boletos
  const computedMax = totalNumbers * ticketPrice;
  const recaudacionMaxima = computedMax > 0 ? computedMax : Math.max(inversionTotal * 1.5, 1000);

  // Porcentajes calculados con precisión milimétrica
  const breakEvenPct =
    recaudacionMaxima > 0
      ? Math.min(100, Math.max(0, (inversionTotal / recaudacionMaxima) * 100))
      : 0;

  const currentPct =
    recaudacionMaxima > 0
      ? Math.min(100, Math.max(0, (recaudadoActual / recaudacionMaxima) * 100))
      : 0;

  const pendingToBreakEven = Math.max(0, inversionTotal - recaudadoActual);
  const profit = Math.max(0, recaudadoActual - inversionTotal);
  const isBreakEven = inversionTotal > 0 ? recaudadoActual >= inversionTotal : true;
  const missingTickets =
    pendingToBreakEven > 0 ? Math.ceil(pendingToBreakEven / Math.max(ticketPrice, 1)) : 0;

  // Anchos exactos de las dos zonas de progreso
  const zone1Width = Math.min(currentPct, breakEvenPct);
  const zone2Width = currentPct > breakEvenPct ? currentPct - breakEvenPct : 0;

  // Posicionamiento inteligente del tooltip/etiqueta del marcador para evitar desbordamiento en móviles (360px)
  let markerLabelPositionClass = '-translate-x-1/2';
  if (breakEvenPct < 18) {
    markerLabelPositionClass = 'translate-x-0';
  } else if (breakEvenPct > 82) {
    markerLabelPositionClass = '-translate-x-full';
  }

  return (
    <div className="bg-[#FFFFFF] p-4 sm:p-5 border border-[#DCE4EE] rounded-lg shadow-subtle space-y-4 sm:space-y-5 animate-fade-in-up">
      {/* Encabezado Encapsulado */}
      <div className="p-3 sm:p-4 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-lg bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] flex items-center justify-center flex-shrink-0 shadow-subtle">
            <Target className="w-5 h-5 text-[#0369A1]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-display font-bold text-[#0B1526] uppercase tracking-wider">
                Control de Inversión y Break-Even (ROI)
              </h3>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFFFFF] border border-[#CBD5E1] text-[#475569]">
                Fintech
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-0.5">
              Seguimiento financiero en tiempo real: punto de recuperación y umbral de ganancia neta
            </p>
          </div>
        </div>

        <div>
          {isBreakEven ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] rounded-lg text-xs font-black uppercase shadow-subtle transition-all duration-200">
              <CheckCircle className="w-4 h-4 text-[#059669] flex-shrink-0" />
              <span>Inversión Recuperada · Ganancia Activa</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] rounded-lg text-xs font-black uppercase shadow-subtle transition-all duration-200">
              <AlertCircle className="w-4 h-4 text-[#0369A1] flex-shrink-0" />
              <span>Recuperando Inversión</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Métricas Sólidas Encapsuladas con micro-interacciones hover */}
      <div className="p-2.5 sm:p-3.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Inversión Total */}
        <div className="group p-3 sm:p-3.5 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/30 transition-all duration-200 ease-out min-w-0">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">
              Inversión Total
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0369A1] transition-colors flex-shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-1.5 truncate">
            <span className="text-lg sm:text-2xl font-mono tabular-nums font-bold text-[#0B1526]">
              ${inversionTotal.toLocaleString('es-ES')}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">USD</span>
          </div>
          <p className="text-[10px] text-[#64748B] mt-1 truncate">
            Costo del premio + gastos
          </p>
        </div>

        {/* Total Recaudado */}
        <div className="group p-3 sm:p-3.5 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/30 transition-all duration-200 ease-out min-w-0">
          <div className="flex items-center justify-between text-[#0369A1]">
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">
              Total Recaudado
            </span>
            <DollarSign className="w-3.5 h-3.5 text-[#0369A1] group-hover:scale-110 transition-transform flex-shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-1.5 truncate">
            <span className="text-lg sm:text-2xl font-mono tabular-nums font-bold text-[#0369A1]">
              ${recaudadoActual.toLocaleString('es-ES')}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">USD</span>
          </div>
          <p className="text-[10px] text-[#0369A1] font-medium mt-1 truncate">
            {currentPct.toFixed(1)}% de meta máxima (${recaudacionMaxima.toLocaleString('es-ES')})
          </p>
        </div>

        {/* Falta Para Inversión */}
        <div className="group p-3 sm:p-3.5 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/30 transition-all duration-200 ease-out min-w-0">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">
              Falta Para Inversión
            </span>
            <AlertCircle
              className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                pendingToBreakEven > 0 ? 'text-[#B45309]' : 'text-[#64748B]'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1 mt-1.5 truncate">
            <span
              className={`text-lg sm:text-2xl font-mono tabular-nums font-bold ${
                pendingToBreakEven > 0 ? 'text-[#B45309]' : 'text-[#64748B]'
              }`}
            >
              ${pendingToBreakEven.toLocaleString('es-ES')}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">USD</span>
          </div>
          <p className="text-[10px] text-[#64748B] mt-1 truncate">
            {pendingToBreakEven > 0
              ? `≈ ${missingTickets} boletos a $${ticketPrice}`
              : 'Umbral 100% cubierto'}
          </p>
        </div>

        {/* Profit Neto Generado */}
        <div className="group p-3 sm:p-3.5 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#059669]/40 transition-all duration-200 ease-out min-w-0">
          <div className="flex items-center justify-between text-[#059669]">
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">
              Ganancia Neta Pura
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#059669] group-hover:scale-110 transition-transform flex-shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-1.5 truncate">
            <span
              className={`text-lg sm:text-2xl font-mono tabular-nums font-bold ${
                profit > 0 ? 'text-[#059669]' : 'text-[#64748B]'
              }`}
            >
              +{profit > 0 ? `$${profit.toLocaleString('es-ES')}` : '$0'}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">USD</span>
          </div>
          <p className="text-[10px] text-[#059669] font-medium mt-1 truncate">
            {profit > 0 ? 'Excedente directo de la rifa' : 'Aún en fase de costo'}
          </p>
        </div>
      </div>

      {/* Barra Gráfica de Meta de Inversión y Punto de Equilibrio (ROI) */}
      <div className="p-3.5 sm:p-4 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg space-y-3">
        {/* Lectura ejecutiva superior y Badge dinámico */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0B1526] uppercase tracking-wide text-xs">
              Progreso hacia el Punto de Equilibrio:
            </span>
            <span className="font-mono tabular-nums font-bold text-[#0369A1] text-sm">
              {currentPct.toFixed(1)}%
            </span>
          </div>

          <div>
            {isBreakEven ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-bold text-[11px] shadow-subtle">
                <CheckCircle className="w-3.5 h-3.5 text-[#059669]" />
                Inversión recuperada · +${profit.toLocaleString('es-ES')} USD de ganancia neta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] font-bold text-[11px] shadow-subtle">
                <AlertCircle className="w-3.5 h-3.5 text-[#0369A1]" />
                Faltan ${pendingToBreakEven.toLocaleString('es-ES')} ({missingTickets} boletos) para recuperar inversión
              </span>
            )}
          </div>
        </div>

        {/* Pista de la barra con marcador vertical y dos zonas de color */}
        <div className="relative pt-6 pb-2">
          {/* Marcador Visual del Umbral de Inversión (Línea nítida + pin + etiqueta clamped) */}
          {inversionTotal > 0 && breakEvenPct > 0 && (
            <div
              className="absolute top-0 bottom-2 z-20 pointer-events-none"
              style={{ left: `${breakEvenPct}%` }}
            >
              {/* Etiqueta flotante clamped */}
              <div
                className={`absolute -top-1 whitespace-nowrap text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded bg-[#0B1526] text-white shadow-modal flex items-center gap-1 ${markerLabelPositionClass}`}
              >
                <span>Meta Inversión:</span>
                <span className="text-[#38BDF8]">${inversionTotal.toLocaleString('es-ES')} USD</span>
              </div>

              {/* Pin / Triángulo indicador superior */}
              <div className="absolute top-4 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#0B1526]" />

              {/* Línea vertical nítida divisoria */}
              <div className="w-[2px] h-full bg-[#0B1526] -translate-x-1/2 opacity-90 shadow-sm" />
            </div>
          )}

          {/* Track contenedor de la barra */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Number(currentPct.toFixed(1))}
            aria-label="Progreso de recaudación hacia el punto de equilibrio"
            className="relative w-full h-4 sm:h-5 bg-[#EAF0F6] rounded-full overflow-hidden border border-[#DCE4EE] shadow-inner"
          >
            {/* Zona 1: Azul primario #0369A1 (0% hasta el punto de inversión) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#0369A1] transition-all duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${zone1Width}%` }}
              title={`Recuperando inversión: $${Math.min(recaudadoActual, inversionTotal).toLocaleString('es-ES')} USD`}
            />

            {/* Zona 2: Verde esmeralda #059669 (desde el punto de inversión en adelante = Ganancia Neta Pura) */}
            {zone2Width > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-[#059669] transition-all duration-500 ease-out motion-reduce:transition-none"
                style={{
                  left: `${breakEvenPct}%`,
                  width: `${zone2Width}%`,
                }}
                title={`Ganancia neta pura: +$${profit.toLocaleString('es-ES')} USD`}
              />
            )}
          </div>
        </div>

        {/* Leyenda compacta inferior con hitos clave en font-mono tabular-nums */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono tabular-nums text-[#64748B] border-t border-[#DCE4EE]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#CBD5E1]" />
            <span>$0 USD</span>
          </div>

          {inversionTotal > 0 && (
            <div className="flex items-center gap-1.5 text-[#0B1526] font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0369A1]" />
              <span>
                Inversión: ${inversionTotal.toLocaleString('es-ES')} USD ({breakEvenPct.toFixed(1)}%)
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[#059669] font-bold">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#059669]" />
            <span>
              Meta Máxima: ${recaudacionMaxima.toLocaleString('es-ES')} USD (100%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
