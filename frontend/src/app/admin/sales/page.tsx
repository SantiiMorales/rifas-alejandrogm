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
    <div className="space-y-5">
      {/* Banner Principal Sólido Cero Degradados */}
      <div className="bg-[#12161F] p-5 border border-metallic rounded-lg space-y-4">
        {/* Encabezado con selector de fecha integrado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#00D4FF] text-black text-[10px] font-black uppercase">
                Panel Contable
              </span>
              <span className="text-xs text-[#6E7785]">Auditoría de Pagos</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide mt-1">
              Ventas y Abonos del Día
            </h1>
            <p className="text-xs text-[#C4CBD4] mt-0.5">
              Registro cronológico de transacciones por fecha seleccionada
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[#1E2430] border border-metallic rounded-lg px-3 py-1.5 transition-colors focus-within:border-[#00D4FF]">
              <Calendar className="w-4 h-4 text-[#00D4FF] flex-shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => {
                setRefreshing(true);
                loadSales(selectedDate);
              }}
              disabled={refreshing}
              className="p-2 bg-[#1E2430] hover:bg-[#1E2430]/70 text-[#C4CBD4] hover:text-white border border-metallic rounded-lg transition-colors flex items-center justify-center"
              title="Refrescar ventas"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contenedor Encapsulado de Métricas del Día */}
        <div className="p-2.5 sm:p-3 bg-[#05070A] border border-metallic rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#12161F] border border-metallic rounded-lg flex items-center gap-3">
            <div className="p-2 bg-[#1E2430] rounded-lg border border-metallic flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-[#6E7785] uppercase block font-semibold">
                Transacciones
              </span>
              <span className="text-lg font-black text-white block">
                {data.total_sales_count}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#12161F] border border-metallic rounded-lg flex items-center gap-3">
            <div className="p-2 bg-[#1E2430] rounded-lg border border-[#1EE868]/30 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-[#1EE868]" />
            </div>
            <div>
              <span className="text-[10px] text-[#1EE868] uppercase block font-semibold">
                USD Directo
              </span>
              <span className="text-lg font-black text-[#1EE868] block">
                ${data.total_usd.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#12161F] border border-metallic rounded-lg flex items-center gap-3">
            <div className="p-2 bg-[#1E2430] rounded-lg border border-[#00D4FF]/30 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 text-[#00D4FF]" />
            </div>
            <div>
              <span className="text-[10px] text-[#00D4FF] uppercase block font-semibold">
                COP en Pesos
              </span>
              <span className="text-lg font-black text-[#00D4FF] block">
                ${data.total_cop.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#12161F] border border-metallic rounded-lg flex items-center gap-3">
            <div className="p-2 bg-[#1E2430] rounded-lg border border-[#0077E6]/30 flex items-center justify-center flex-shrink-0">
              <Coins className="w-4 h-4 text-[#0077E6]" />
            </div>
            <div>
              <span className="text-[10px] text-[#0077E6] uppercase block font-semibold">
                BS en Bolívares
              </span>
              <span className="text-lg font-black text-white block">
                Bs. {data.total_bs.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Sólida de Registros */}
      <div className="bg-[#12161F] border border-metallic rounded-lg overflow-hidden">
        <div className="p-3.5 bg-[#1E2430] border-b border-metallic flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-[#00D4FF]" />
            Transacciones del {selectedDate}
          </h2>
          <span className="text-[11px] text-[#6E7785] px-2 py-0.5 bg-[#05070A] border border-metallic rounded-md">
            {data.sales.length} registros
          </span>
        </div>

        {data.sales.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6E7785]">
            No hay ventas registradas el {selectedDate}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#05070A] text-[#6E7785] uppercase text-[10px] border-b border-metallic">
                <tr>
                  <th className="py-2.5 px-3">Hora</th>
                  <th className="py-2.5 px-3">Boleto</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Celular</th>
                  <th className="py-2.5 px-3">Monto</th>
                  <th className="py-2.5 px-3">USD Equiv.</th>
                  <th className="py-2.5 px-3">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-metallic text-[#C4CBD4]">
                {data.sales.map((sale) => (
                  <tr key={sale.payment_id} className="hover:bg-[#1E2430] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#6E7785]">
                      {formatTime(sale.payment_date)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#00D4FF] font-brand-condensed text-base">
                      #{sale.ticket_number}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {sale.customer_name}
                    </td>
                    <td className="py-2.5 px-3 text-[#00D4FF] font-mono">
                      {sale.customer_phone}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {sale.amount.toLocaleString()} {sale.currency}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#1EE868]">
                      ${sale.amount_usd.toFixed(2)} USD
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#6E7785]">
                      {sale.notes || '—'}
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
