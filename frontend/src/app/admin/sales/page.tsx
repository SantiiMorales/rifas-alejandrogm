'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Receipt, DollarSign, Wallet, Coins } from 'lucide-react';
import { DailySalesResponse } from '@/lib/types';
import { DEFAULT_DAILY_SALES, fetchDailySales } from '@/lib/api';

export default function DailySalesPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [data, setData] = useState<DailySalesResponse>(DEFAULT_DAILY_SALES);
  const [refreshing, setRefreshing] = useState(false);

  const loadSales = async (date: string) => {
    try {
      const resp = await fetchDailySales(date);
      if (resp) {
        setData(resp);
      }
    } catch (err) {
      console.warn('Error cargando ventas del día:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSales(selectedDate);
  }, [selectedDate]);

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in-up">
      {/* Banner Principal */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 border border-[#DCE4EE] rounded-lg shadow-subtle space-y-4">
        {/* Encabezado con selector de fecha integrado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] text-[10px] font-semibold uppercase tracking-wider">
                Panel Contable
              </span>
              <span className="text-xs text-[#64748B]">Auditoría de Pagos</span>
            </div>
            <h1 className="font-display text-lg sm:text-2xl font-black text-[#0B1526] uppercase tracking-tight mt-1 truncate">
              Ventas y Abonos del Día
            </h1>
            <p className="text-xs text-[#475569] mt-0.5">
              Registro cronológico de transacciones por fecha seleccionada
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg px-3 py-2 sm:py-1.5 min-h-[44px] transition-all focus-within:border-[#0EA5E9] focus-within:bg-[#FFFFFF] focus-within:ring-2 focus-within:ring-[#0EA5E9] focus-within:ring-offset-1">
              <Calendar className="w-4 h-4 text-[#0369A1] flex-shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Seleccionar fecha de las ventas"
                className="bg-transparent text-[#0B1526] text-base sm:text-xs font-semibold focus:outline-none cursor-pointer w-full font-mono tabular-nums"
              />
            </div>

            <button
              onClick={() => {
                setRefreshing(true);
                loadSales(selectedDate);
              }}
              disabled={refreshing}
              className="min-h-[44px] min-w-[44px] p-2 bg-[#FFFFFF] hover:bg-[#EAF0F6] active:scale-[0.98] text-[#475569] hover:text-[#0B1526] border border-[#CBD5E1] rounded-lg shadow-subtle transition-all duration-150 flex items-center justify-center flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
              title="Refrescar ventas"
              aria-label="Refrescar ventas"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0369A1]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contenedor Encapsulado de Métricas del Día con micro-interacciones */}
        <div className="p-2.5 sm:p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Transacciones */}
          <div className="group p-2.5 sm:p-3 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/30 transition-all duration-200 ease-out flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-[#EAF0F6] rounded-lg border border-[#DCE4EE] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4 text-[#475569]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#64748B] uppercase block font-semibold truncate">
                Transacciones
              </span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#0B1526] block truncate">
                {data.total_sales_count}
              </span>
            </div>
          </div>

          {/* USD Directo */}
          <div className="group p-2.5 sm:p-3 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#059669]/40 transition-all duration-200 ease-out flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-[#ECFDF5] rounded-lg border border-[#A7F3D0] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#059669] uppercase block font-semibold truncate">
                USD Directo
              </span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#059669] block truncate">
                ${data.total_usd.toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {/* COP en Pesos */}
          <div className="group p-2.5 sm:p-3 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/40 transition-all duration-200 ease-out flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-[#E0F2FE] rounded-lg border border-[#BAE6FD] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4 text-[#0369A1]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#0369A1] uppercase block font-semibold truncate">
                COP en Pesos
              </span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#0369A1] block truncate">
                ${data.total_cop.toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {/* BS en Bolívares */}
          <div className="group p-2.5 sm:p-3 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle hover:-translate-y-0.5 hover:shadow-md hover:border-[#0284C7]/40 transition-all duration-200 ease-out flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-[#E0F2FE] rounded-lg border border-[#BAE6FD] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Coins className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#0284C7] uppercase block font-semibold truncate">
                BS en Bolívares
              </span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#0B1526] block truncate">
                Bs. {data.total_bs.toLocaleString('es-ES')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle overflow-hidden">
        <div className="p-3.5 bg-[#F4F7FA] border-b border-[#DCE4EE] flex items-center justify-between">
          <h2 className="font-display text-xs font-bold text-[#0B1526] uppercase flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-[#0369A1]" />
            <span>Detalle de Cobros Registrados ({data.sales.length})</span>
          </h2>
        </div>

        {data.sales.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B] animate-fade-in">
            <Receipt className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
            <p>No se registraron cobros ni ventas para esta fecha.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#DCE4EE] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 whitespace-nowrap">Hora</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Boleto</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Cliente</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Teléfono</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Monto Pagado</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Equivalente USD</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Detalle / Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4EE]">
                {data.sales.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#F4F7FA] transition-colors duration-150"
                  >
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[#475569]">
                      {formatTime(item.payment_date)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-[#EAF0F6] border border-[#CBD5E1] text-[#0B1526]">
                        #{item.ticket_number}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#0B1526]">
                      {item.customer_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[#475569]">
                      {item.customer_phone || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-[#0B1526]">
                      {item.currency === 'BS' ? 'Bs. ' : '$'}
                      {item.amount.toLocaleString('es-ES')} {item.currency}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-[#059669]">
                      ${item.amount_usd.toLocaleString('es-ES')} USD
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B] italic max-w-[200px] truncate">
                      {item.notes || 'Abono registrado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
