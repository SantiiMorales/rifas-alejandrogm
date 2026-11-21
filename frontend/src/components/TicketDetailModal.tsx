'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Award,
  CheckCircle2,
  Clock,
  Share2,
  Trash2,
} from 'lucide-react';
import { ExchangeRate, Raffle, Ticket } from '@/lib/types';
import { addTicketPayment, releaseTicket, reserveTicket } from '@/lib/api';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  rates: ExchangeRate;
  raffle: Raffle;
  onTicketUpdated: (updated: Ticket) => void;
}

export default function TicketDetailModal({
  isOpen,
  onClose,
  ticket,
  rates,
  raffle,
  onTicketUpdated,
}: TicketDetailModalProps) {
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [initPayment, setInitPayment] = useState('');
  const [initCurrency, setInitCurrency] = useState<'USD' | 'COP' | 'BS'>('USD');

  const [abonoAmount, setAbonoAmount] = useState('');
  const [abonoCurrency, setAbonoCurrency] = useState<'USD' | 'COP' | 'BS'>('USD');
  const [abonoNotes, setAbonoNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !ticket) return null;

  const isAvailable = ticket.status === 'available';
  const isPaid = ticket.status === 'paid';
  const isReserved = ticket.status === 'reserved';

  // Conversión dinámica según las tasas customizables del usuario
  // BS→USD y COP→USD usan DIVISIÓN: cantidad / tasa = USD
  const parsedAbono = parseFloat(abonoAmount) || 0;
  let abonoEquivUsd = parsedAbono;
  if (abonoCurrency === 'COP') abonoEquivUsd = parsedAbono / (rates.rate_cop_to_usd || 4200);
  if (abonoCurrency === 'BS') abonoEquivUsd = parsedAbono / (rates.rate_bs_to_usd || 60);

  const parsedInit = parseFloat(initPayment) || 0;
  let initEquivUsd = parsedInit;
  if (initCurrency === 'COP') initEquivUsd = parsedInit / (rates.rate_cop_to_usd || 4200);
  if (initCurrency === 'BS') initEquivUsd = parsedInit / (rates.rate_bs_to_usd || 60);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      setError('Nombre y celular son obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const updated = await reserveTicket(ticket.id, {
        customer_name: custName.trim(),
        customer_phone: custPhone.trim(),
        customer_address: custAddress.trim() || undefined,
        initial_payment: parseFloat(initPayment) || 0,
        initial_currency: initCurrency,
        notes: 'Apartado desde el tablero',
      });
      onTicketUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al apartar');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAbono <= 0) {
      setError('Ingresa un monto válido para el abono');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const updated = await addTicketPayment(ticket.id, {
        amount: parsedAbono,
        currency: abonoCurrency,
        notes: abonoNotes.trim() || undefined,
      });
      onTicketUpdated(updated);
      setAbonoAmount('');
      setAbonoNotes('');
    } catch (err: any) {
      setError(err.message || 'Error al abonar');
    } finally {
      setLoading(false);
    }
  };

  const handlePayFullBalance = async () => {
    if (ticket.balance_usd <= 0) return;
    if (!confirm(`¿Confirmas liquidar el 100% restante ($${ticket.balance_usd} USD)?`)) return;
    setLoading(true);
    try {
      const updated = await addTicketPayment(ticket.id, {
        amount: ticket.balance_usd,
        currency: 'USD',
        notes: 'Liquidación total del boleto',
      });
      onTicketUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Error al liquidar');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!confirm('¿Seguro que deseas liberar este boleto? Se borrarán los datos del cliente.')) return;
    setLoading(true);
    try {
      const updated = await releaseTicket(ticket.id);
      onTicketUpdated(updated);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al liberar boleto');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/consultar?q=${ticket.ticket_number}`;
    const textMsg = `🎫 *Rifas Alejandro GM* 🎫\nBoleto Oficial: *#${ticket.ticket_number}*\nCliente: ${ticket.customer_name}\nEstado: ${isPaid ? 'PAGADO TOTAL' : `ABONADO $${ticket.total_paid_usd} USD`}\nConsulta en: ${link}`;
    navigator.clipboard.writeText(textMsg);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#12161F] border border-metallic rounded-lg p-5 sm:p-6 shadow-2xl">
        {/* Cabecera Encapsulada Sólida Cero Degradados */}
        <div className="flex items-start justify-between p-3 bg-[#05070A] border border-metallic rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-[#05070A] border-2 border-[#1EE868] flex flex-col items-center justify-center">
              <span className="text-[9px] text-[#6E7785] font-bold uppercase">Boleto</span>
              <span className="font-brand-condensed text-2xl font-black text-[#1EE868] leading-none">
                #{ticket.ticket_number}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Ticket #{ticket.ticket_number}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    isPaid
                      ? 'bg-[#1EE868] text-black'
                      : isReserved
                      ? 'bg-[#00D4FF] text-black'
                      : 'bg-[#1E2430] text-[#6E7785]'
                  }`}
                >
                  {isPaid ? 'Pagado Total' : isReserved ? 'Apartado' : 'Disponible'}
                </span>
              </div>

              {/* Múltiples Juegos Especiales Desbloqueados */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {ticket.qualified_games && ticket.qualified_games.length > 0 ? (
                  ticket.qualified_games.map((gameName, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <Award className="w-3 h-3 text-black" />
                      <span>{gameName}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[#6E7785]">
                    Sin juegos especiales desbloqueados aún (Abono requerido)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAvailable && (
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-[#1E2430] text-[#C4CBD4] hover:text-[#00D4FF] transition-colors"
                title="Copiar comprobante WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#6E7785] hover:text-white hover:bg-[#1E2430] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {copiedLink && (
          <div className="mt-3 p-2.5 bg-[#00D4FF] text-black rounded-lg text-xs text-center font-bold">
            ¡Comprobante copiado al portapapeles para WhatsApp!
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {/* CASO 1: BOLETO DISPONIBLE -> APARTAR */}
        {isAvailable ? (
          <form onSubmit={handleReserve} className="mt-4 space-y-3 text-xs">
            <div className="p-3 bg-[#05070A] border border-metallic rounded-lg">
              <span className="text-xs text-[#1EE868] font-bold uppercase block">
                Boleto Disponible para Apartar
              </span>
              <p className="text-[#C4CBD4] text-[11px] mt-0.5">
                Ingresa los datos del comprador y fija el abono inicial que el cliente entregue.
              </p>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block font-bold text-[#C4CBD4] mb-1">Nombre Completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-[#6E7785]" />
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full pl-9 pr-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs focus:outline-none focus:border-[#00D4FF]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#C4CBD4] mb-1">Teléfono / WhatsApp *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-[#6E7785]" />
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="Ej: +58 412 1234567"
                    className="w-full pl-9 pr-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs focus:outline-none focus:border-[#00D4FF]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#C4CBD4] mb-1">Dirección (Opcional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-[#6E7785]" />
                  <input
                    type="text"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="Ciudad / Sector"
                    className="w-full pl-9 pr-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Abono Inicial */}
              <div className="p-3 bg-[#05070A] border border-metallic rounded-lg space-y-2">
                <label className="block font-bold text-[#C4CBD4] text-[11px] uppercase tracking-wider">
                  Abono Inicial (El Admin fija el monto y moneda)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={initPayment}
                    onChange={(e) => setInitPayment(e.target.value)}
                    placeholder="Monto"
                    className="col-span-2 px-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-[#1EE868] font-bold text-xs focus:outline-none"
                  />
                  <select
                    value={initCurrency}
                    onChange={(e) => setInitCurrency(e.target.value as any)}
                    className="py-2 px-3 bg-[#1E2430] border border-metallic rounded-lg text-white font-bold text-xs focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="COP">COP (Pesos)</option>
                    <option value="BS">BS (Bs.)</option>
                  </select>
                </div>
                {parsedInit > 0 && initCurrency !== 'USD' && (
                  <div className="mt-1 text-[11px] text-[#00D4FF] font-semibold">
                    Equivalente estimado: <span className="font-bold">${initEquivUsd.toFixed(2)} USD</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 p-2 bg-[#05070A] border border-metallic rounded-lg">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#1E2430] hover:bg-[#2A3342] text-[#C4CBD4] hover:text-white text-xs font-semibold rounded-lg border border-metallic transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#1EE868] hover:bg-[#19C958] text-[#05070A] text-xs font-black uppercase tracking-wider rounded-lg border border-[#1EE868] transition-all disabled:opacity-50"
              >
                {loading ? 'Apartando...' : 'Apartar Boleto'}
              </button>
            </div>
          </form>
        ) : (
          /* CASO 2: BOLETO APARTADO O PAGADO */
          <div className="mt-4 space-y-4 text-xs">
            {/* Información del Cliente */}
            <div className="p-3 bg-[#05070A] border border-metallic rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-[#6E7785] uppercase block font-semibold">Cliente</span>
                <span className="text-xs font-bold text-white block truncate">{ticket.customer_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6E7785] uppercase block font-semibold">Celular</span>
                <span className="text-xs font-bold text-[#00D4FF] block">{ticket.customer_phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6E7785] uppercase block font-semibold">Dirección</span>
                <span className="text-xs text-[#C4CBD4] block truncate">{ticket.customer_address || '—'}</span>
              </div>
            </div>

            {/* Progreso y Finanzas Sólidas */}
            <div className="p-3.5 bg-[#1E2430] border border-metallic rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C4CBD4]">Progreso del Boleto:</span>
                <span className="font-bold text-white">{ticket.percent_paid}%</span>
              </div>

              <div className="w-full h-3 bg-[#05070A] rounded-full overflow-hidden border border-metallic">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isPaid ? 'bg-[#1EE868]' : 'bg-[#00D4FF]'}`}
                  style={{ width: `${ticket.percent_paid}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 bg-[#05070A] rounded-lg border border-metallic">
                  <span className="text-[10px] text-[#6E7785] block">Total</span>
                  <span className="text-xs font-bold text-white">${ticket.ticket_price_usd} USD</span>
                </div>
                <div className="p-2 bg-[#05070A] rounded-lg border border-metallic">
                  <span className="text-[10px] text-[#6E7785] block">Abonado</span>
                  <span className="text-xs font-bold text-[#1EE868]">${ticket.total_paid_usd} USD</span>
                </div>
                <div className="p-2 bg-[#05070A] rounded-lg border border-metallic">
                  <span className="text-[10px] text-[#6E7785] block">Saldo</span>
                  <span className={`text-xs font-bold ${ticket.balance_usd > 0 ? 'text-amber-400' : 'text-[#6E7785]'}`}>
                    ${ticket.balance_usd} USD
                  </span>
                </div>
              </div>
            </div>

            {/* FORMULARIO DE NUEVO ABONO (Solo si falta saldo) */}
            {!isPaid && (
              <form onSubmit={handleAddPayment} className="p-3 bg-[#05070A] border border-[#00D4FF] rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px]">
                    Registrar Abono (El Admin fija el monto)
                  </span>
                  <button
                    type="button"
                    onClick={handlePayFullBalance}
                    className="text-[11px] text-[#1EE868] font-bold hover:underline"
                  >
                    Liquidar 100% (${ticket.balance_usd} USD)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={abonoAmount}
                    onChange={(e) => setAbonoAmount(e.target.value)}
                    placeholder="Monto"
                    className="col-span-2 px-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-[#1EE868] font-bold text-xs focus:outline-none"
                    required
                  />
                  <select
                    value={abonoCurrency}
                    onChange={(e) => setAbonoCurrency(e.target.value as any)}
                    className="py-2 px-3 bg-[#1E2430] border border-metallic rounded-lg text-white font-bold text-xs focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="COP">COP (Pesos)</option>
                    <option value="BS">BS (Bs.)</option>
                  </select>
                </div>

                {parsedAbono > 0 && abonoCurrency !== 'USD' && (
                  <div className="text-[11px] text-[#00D4FF] font-semibold">
                    Equivalente en USD: <span className="font-bold">${abonoEquivUsd.toFixed(2)} USD</span>
                  </div>
                )}

                <input
                  type="text"
                  value={abonoNotes}
                  onChange={(e) => setAbonoNotes(e.target.value)}
                  placeholder="Nota opcional del pago..."
                  className="w-full px-3 py-1.5 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs"
                />

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-[#00D4FF] text-black font-black rounded-lg hover:bg-[#00D4FF]/90 transition-colors"
                  >
                    {loading ? 'Guardando...' : 'Confirmar Abono'}
                  </button>
                </div>
              </form>
            )}

            {/* HISTORIAL DE ABONOS */}
            <div>
              <span className="text-[11px] font-bold text-[#C4CBD4] uppercase block mb-1.5">
                Historial de Pagos ({ticket.payments.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {ticket.payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-2 bg-[#05070A] border border-metallic rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">
                        {p.amount.toLocaleString()} {p.currency}
                      </span>
                      {p.currency !== 'USD' && (
                        <span className="text-[#00D4FF] ml-1.5 font-semibold">
                          (≈ ${p.amount_usd_equivalent.toFixed(2)} USD)
                        </span>
                      )}
                      {p.notes && <span className="text-[#6E7785] block text-[10px]">{p.notes}</span>}
                    </div>
                    <span className="text-[#6E7785] text-[10px] font-mono">{formatDate(p.payment_date)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#05070A] border border-metallic rounded-lg">
              <button
                type="button"
                onClick={handleRelease}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Liberar Boleto</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-[#1E2430] hover:bg-[#2A3342] text-[#C4CBD4] hover:text-white text-xs font-semibold rounded-lg border border-metallic transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
