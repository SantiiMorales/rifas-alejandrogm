'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
} from 'lucide-react';
import { toBlob } from 'html-to-image';
import { ExchangeRate, Raffle, Ticket } from '@/lib/types';
import { addTicketPayment, releaseTicket, reserveTicket } from '@/lib/api';
import { formatDrawDate } from '@/lib/ticketSchemes';

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
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const ticketCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setFeedbackMessage('');
      setCustName('');
      setCustPhone('');
      setCustAddress('');
      setInitPayment('');
      setAbonoAmount('');
      setAbonoNotes('');
    }
  }, [isOpen, ticket]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ticket) return null;

  const isAvailable = ticket.status === 'available';
  const isPaid = ticket.status === 'paid';
  const isReserved = ticket.status === 'reserved';

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
        raffle_id: raffle.id,
        ticket_number: ticket.ticket_number,
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

  const handleShareTicket = async () => {
    if (!ticket || !ticketCardRef.current || sharing) return;

    setSharing(true);
    setError('');
    setFeedbackMessage('');

    try {
      // 1. Esperar a que las fuentes del documento estén listas
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready;
      }

      const node = ticketCardRef.current;
      const filter = (el: HTMLElement | Node) => !(el instanceof HTMLElement && el.dataset?.shareIgnore === 'true');

      const options = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#FFFFFF',
        filter,
        style: {
          maxHeight: 'none',
          overflowY: 'visible',
          height: 'auto',
        },
      };

      // 2. Prevenir el bug de Safari iOS con calentamiento previo
      const isSafariOrIOS =
        typeof navigator !== 'undefined' &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
          /^((?!chrome|android).)*safari/i.test(navigator.userAgent));

      if (isSafariOrIOS) {
        try {
          await toBlob(node, options);
        } catch {
          // Calentamiento previo para Safari/iOS
        }
      }

      // Captura definitiva de alta nitidez
      const blob = await toBlob(node, options);
      if (!blob) {
        throw new Error('No se pudo generar la imagen del boleto.');
      }

      // 3. Crear archivo PNG
      let file: File;
      try {
        file = new File([blob], `boleto-${ticket.ticket_number}.png`, {
          type: 'image/png',
        });
      } catch {
        file = Object.assign(blob, {
          name: `boleto-${ticket.ticket_number}.png`,
          lastModified: Date.now(),
        }) as File;
      }

      // 4. Construir link y shareText conciso
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const ticketUrl = `${origin}/consultar?raffle=${raffle.id}&ticket=${encodeURIComponent(ticket.ticket_number)}`;
      const statusText = isPaid
        ? 'PAGADO TOTAL (100%)'
        : `ABONADO $${ticket.total_paid_usd} USD (Saldo restante: $${ticket.balance_usd} USD)`;

      const numbersLabel =
        ticket.numbers && ticket.numbers.length > 1
          ? ` (${ticket.numbers.join(' · ')})`
          : '';

      const shareText = `🎫 *RIFAS ALEJANDRO GM* 🎫\nBoleto Oficial: *#${ticket.ticket_number}*${numbersLabel}\nCliente: ${ticket.customer_name || 'Titular'}\nEstado: ${statusText}\n\nVerifica tu comprobante oficial aquí:\n${ticketUrl}`;

      // 5. Respaldo silencioso para iOS: copiar texto al portapapeles
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareText);
        }
      } catch {
        // Silencioso en caso de bloqueo de portapapeles
      }

      // 6. Intentar menú nativo de compartir (celular)
      let sharedNatively = false;
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Boleto #${ticket.ticket_number}`,
              text: shareText,
            });
            sharedNatively = true;
          }
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            // El usuario canceló la acción nativa de compartir
            return;
          }
          console.warn('Fallo en navigator.share, procediendo con fallback:', shareErr);
        }
      }

      // 7. Fallback para escritorio o navegadores sin soporte de files en navigator.share
      if (!sharedNatively) {
        // A) Descarga automática del PNG
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = `boleto-${ticket.ticket_number}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

        // B) Copiar shareText al portapapeles
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareText);
          }
        } catch (clipErr) {
          console.warn('Error al copiar al portapapeles:', clipErr);
        }

        // C) Abrir WhatsApp con mensaje prellenado
        const cleanPhone = ticket.customer_phone ? ticket.customer_phone.replace(/\D/g, '') : '';
        const waUrl = cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText)}`
          : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

        window.open(waUrl, '_blank', 'noopener,noreferrer');

        // D) Toast feedback
        setFeedbackMessage('¡Imagen descargada y mensaje copiado! Adjunta el PNG en WhatsApp.');
        setTimeout(() => setFeedbackMessage(''), 4500);
      }
    } catch (err: any) {
      console.error('Error al compartir boleto:', err);
      setError(err?.message || 'Error al generar la imagen del boleto para compartir');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B1526]/50 backdrop-blur-sm">
      <div
        ref={ticketCardRef}
        className="relative w-[calc(100%-1rem)] sm:w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg p-4 sm:p-6 shadow-modal animate-scale-in"
      >
        {/* Cabecera Encapsulada */}
        <div className="flex items-start justify-between p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-[74px] px-2 h-12 sm:h-14 rounded-lg bg-[#FFFFFF] border-2 border-[#0369A1] shadow-subtle flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-[#64748B] font-semibold uppercase">Boleto</span>
              <span className="font-mono tabular-nums text-lg sm:text-xl font-bold text-[#0369A1] leading-none tracking-tight">
                #{ticket.ticket_number}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base sm:text-lg font-bold text-[#0B1526] truncate">Ticket #{ticket.ticket_number}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                    isPaid
                      ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
                      : isReserved
                      ? 'bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1]'
                      : 'bg-[#EAF0F6] border border-[#DCE4EE] text-[#475569]'
                  }`}
                >
                  {isPaid ? 'Pagado Total' : isReserved ? 'Apartado' : 'Disponible'}
                </span>
              </div>

              {/* Píldoras de números asignados en esquemas múltiples */}
              {ticket.numbers && ticket.numbers.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-[#475569] font-bold uppercase tracking-wider">
                    Números:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 font-mono tabular-nums">
                    {ticket.numbers.map((num, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#EAF0F6] border border-[#CBD5E1] text-[#0B1526] font-bold text-xs shadow-subtle"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Múltiples Juegos Especiales Desbloqueados con Fecha */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {ticket.qualified_games && ticket.qualified_games.length > 0 ? (
                  ticket.qualified_games.map((gameName, idx) => {
                    const matchedGame = raffle.special_games?.find((g) => g.name === gameName);
                    const formattedDate = matchedGame?.drawDate ? formatDrawDate(matchedGame.drawDate) : '';
                    return (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#FEF08A] border border-[#FDE047] text-[#854D0E] text-[10px] font-bold uppercase flex items-center gap-1 shadow-subtle truncate"
                      >
                        <Award className="w-3 h-3 text-[#854D0E] flex-shrink-0" />
                        <span className="truncate">
                          {gameName}
                          {formattedDate ? ` · ${formattedDate.toUpperCase()}` : ''}
                        </span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[10px] text-[#64748B]">
                    Sin juegos especiales desbloqueados aún (Abono requerido)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {!isAvailable && (
              <button
                type="button"
                onClick={handleShareTicket}
                disabled={sharing}
                data-share-ignore="true"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg bg-[#FFFFFF] border border-[#DCE4EE] text-[#475569] hover:text-[#0369A1] hover:bg-[#EAF0F6] shadow-subtle transition-colors disabled:opacity-50"
                title="Compartir comprobante WhatsApp"
                aria-label="Compartir comprobante"
              >
                {sharing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0369A1]" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              data-share-ignore="true"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-[#64748B] hover:text-[#0B1526] hover:bg-[#EAF0F6] transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div
            data-share-ignore="true"
            className="mt-3 p-2.5 bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] rounded-lg text-xs text-center font-semibold"
          >
            {feedbackMessage}
          </div>
        )}

        {error && (
          <div
            data-share-ignore="true"
            className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium"
          >
            {error}
          </div>
        )}

        {/* CASO 1: BOLETO DISPONIBLE -> APARTAR */}
        {isAvailable ? (
          <form onSubmit={handleReserve} className="mt-4 space-y-3 text-xs">
            <div className="p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg">
              <span className="text-xs text-[#059669] font-semibold uppercase block">
                Boleto Disponible para Apartar
              </span>
              <p className="text-[#475569] text-[11px] mt-0.5">
                Ingresa los datos del comprador y fija el abono inicial que el cliente entregue.
              </p>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block font-semibold text-[#475569] mb-1">Nombre Completo *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => {
                      setCustName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Ej: Juan Pérez"
                    className="w-full pl-10 pr-3 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs font-medium focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Teléfono / WhatsApp *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => {
                      setCustPhone(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Ej: +58 412 1234567"
                    className="w-full pl-10 pr-3 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs font-medium focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] transition-colors font-mono tabular-nums"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Dirección (Opcional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    value={custAddress}
                    onChange={(e) => {
                      setCustAddress(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Ciudad / Sector"
                    className="w-full pl-10 pr-3 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs font-medium focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>
              </div>

              {/* Abono Inicial */}
              <div className="p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg space-y-2">
                <label className="block font-semibold text-[#475569] text-[11px] uppercase tracking-wider">
                  Abono Inicial (El Admin fija el monto y moneda)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={initPayment}
                    onChange={(e) => {
                      setInitPayment(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Monto"
                    className="sm:col-span-2 px-3 py-2 min-h-[44px] bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg text-[#059669] font-mono tabular-nums font-bold text-base sm:text-xs focus:outline-none focus:border-[#0EA5E9] shadow-subtle"
                  />
                  <select
                    value={initCurrency}
                    onChange={(e) => setInitCurrency(e.target.value as any)}
                    className="py-2 px-3 min-h-[44px] bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg text-[#0B1526] font-bold text-base sm:text-xs focus:outline-none shadow-subtle cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="COP">COP (Pesos)</option>
                    <option value="BS">BS (Bs.)</option>
                  </select>
                </div>
                {parsedInit > 0 && initCurrency !== 'USD' && (
                  <div className="mt-1 text-[11px] text-[#0369A1] font-semibold">
                    Equivalente estimado: <span className="font-mono tabular-nums font-bold">${initEquivUsd.toFixed(2)} USD</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 p-2 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 bg-[#FFFFFF] hover:bg-[#EAF0F6] text-[#0B1526] text-xs font-semibold rounded-lg border border-[#CBD5E1] shadow-subtle transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="min-h-[44px] px-5 py-2 bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-subtle transition-all disabled:opacity-50"
              >
                {loading ? 'Apartando...' : 'Apartar Boleto'}
              </button>
            </div>
          </form>
        ) : (
          /* CASO 2: BOLETO APARTADO O PAGADO */
          <div className="mt-4 space-y-4 text-xs">
            {/* Información del Cliente */}
            <div className="p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="min-w-0">
                <span className="text-[10px] text-[#64748B] uppercase block font-semibold truncate">Cliente</span>
                <span className="text-xs font-bold text-[#0B1526] block truncate">{ticket.customer_name}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#64748B] uppercase block font-semibold truncate">Celular</span>
                <span className="font-mono tabular-nums text-xs font-semibold text-[#0369A1] block truncate">{ticket.customer_phone}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#64748B] uppercase block font-semibold truncate">Dirección</span>
                <span className="text-xs text-[#475569] block truncate">{ticket.customer_address || '—'}</span>
              </div>
            </div>

            {/* Progreso y Finanzas Sólidas */}
            <div className="p-3.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#475569] font-medium">Progreso del Boleto:</span>
                <span className="font-mono tabular-nums font-bold text-[#0B1526]">{ticket.percent_paid}%</span>
              </div>

              <div className="w-full h-3 bg-[#EAF0F6] rounded-full overflow-hidden border border-[#DCE4EE]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isPaid ? 'bg-[#059669]' : 'bg-[#0EA5E9]'}`}
                  style={{ width: `${ticket.percent_paid}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 bg-[#FFFFFF] rounded-lg border border-[#DCE4EE] shadow-subtle min-w-0">
                  <span className="text-[10px] text-[#64748B] block font-medium truncate">Total</span>
                  <span className="font-mono tabular-nums text-xs font-bold text-[#0B1526] block truncate">${ticket.ticket_price_usd} USD</span>
                </div>
                <div className="p-2 bg-[#FFFFFF] rounded-lg border border-[#DCE4EE] shadow-subtle min-w-0">
                  <span className="text-[10px] text-[#64748B] block font-medium truncate">Abonado</span>
                  <span className="font-mono tabular-nums text-xs font-bold text-[#059669] block truncate">${ticket.total_paid_usd} USD</span>
                </div>
                <div className="p-2 bg-[#FFFFFF] rounded-lg border border-[#DCE4EE] shadow-subtle min-w-0">
                  <span className="text-[10px] text-[#64748B] block font-medium truncate">Saldo</span>
                  <span className={`font-mono tabular-nums text-xs font-bold block truncate ${ticket.balance_usd > 0 ? 'text-[#B45309]' : 'text-[#64748B]'}`}>
                    ${ticket.balance_usd} USD
                  </span>
                </div>
              </div>
            </div>

            {/* FORMULARIO DE NUEVO ABONO (Solo si falta saldo) */}
            {!isPaid && (
              <form
                onSubmit={handleAddPayment}
                data-share-ignore="true"
                className="p-3 bg-[#FFFFFF] border-2 border-[#0EA5E9] rounded-lg space-y-2.5 shadow-subtle"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-[#0B1526] uppercase text-[11px]">
                    Registrar Abono (El Admin fija el monto)
                  </span>
                  <button
                    type="button"
                    onClick={handlePayFullBalance}
                    className="font-mono tabular-nums text-[11px] text-[#059669] font-bold hover:underline self-start sm:self-auto"
                  >
                    Liquidar 100% (${ticket.balance_usd} USD)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={abonoAmount}
                    onChange={(e) => {
                      setAbonoAmount(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Monto"
                    className="sm:col-span-2 px-3 py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#059669] font-mono tabular-nums font-bold text-base sm:text-xs focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF]"
                    required
                  />
                  <select
                    value={abonoCurrency}
                    onChange={(e) => setAbonoCurrency(e.target.value as any)}
                    className="py-2 px-3 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] font-bold text-base sm:text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="COP">COP (Pesos)</option>
                    <option value="BS">BS (Bs.)</option>
                  </select>
                </div>

                {parsedAbono > 0 && abonoCurrency !== 'USD' && (
                  <div className="text-[11px] text-[#0369A1] font-semibold">
                    Equivalente en USD: <span className="font-mono tabular-nums font-bold">${abonoEquivUsd.toFixed(2)} USD</span>
                  </div>
                )}

                <input
                  type="text"
                  value={abonoNotes}
                  onChange={(e) => {
                    setAbonoNotes(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Nota opcional del pago..."
                  className="w-full px-3 py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs focus:bg-[#FFFFFF] focus:outline-none focus:border-[#0EA5E9]"
                />

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-[44px] px-5 py-2 bg-[#0369A1] text-white font-semibold rounded-lg hover:bg-[#075985] shadow-subtle transition-colors flex items-center justify-center"
                  >
                    {loading ? 'Guardando...' : 'Confirmar Abono'}
                  </button>
                </div>
              </form>
            )}

            {/* HISTORIAL DE ABONOS */}
            <div>
              <span className="text-[11px] font-semibold text-[#475569] uppercase block mb-1.5">
                Historial de Pagos ({ticket.payments.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {ticket.payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-2 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                  >
                    <div>
                      <span className="font-mono tabular-nums font-bold text-[#0B1526]">
                        {p.amount.toLocaleString()} {p.currency}
                      </span>
                      {p.currency !== 'USD' && (
                        <span className="font-mono tabular-nums text-[#0369A1] ml-1.5 font-semibold">
                          (≈ ${p.amount_usd_equivalent.toFixed(2)} USD)
                        </span>
                      )}
                      {p.notes && <span className="text-[#64748B] block text-[10px]">{p.notes}</span>}
                    </div>
                    <span className="font-mono tabular-nums text-[#64748B] text-[10px]">{formatDate(p.payment_date)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              data-share-ignore="true"
              className="flex items-center justify-between p-2 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg gap-2"
            >
              <button
                type="button"
                onClick={handleRelease}
                disabled={loading}
                className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-semibold border border-transparent hover:border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Liberar Boleto</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 bg-[#FFFFFF] hover:bg-[#EAF0F6] text-[#0B1526] text-xs font-semibold rounded-lg border border-[#CBD5E1] shadow-subtle transition-all"
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
