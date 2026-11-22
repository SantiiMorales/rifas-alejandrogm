'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Plus, Trash2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { createRaffle } from '@/lib/api';
import { Raffle, SpecialGameItem } from '@/lib/types';
import { TicketSchemeType } from '@/lib/ticketSchemes';
import DatePickerPopover from '@/components/DatePickerPopover';
import CustomSelect, { CustomSelectOption } from '@/components/CustomSelect';

interface CreateRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRaffleCreated: (newRaffle: Raffle) => void;
  currentRaffle?: Raffle | null;
}

const SCHEME_OPTIONS: CustomSelectOption[] = [
  {
    value: 'standard_100',
    label: '100 Boletos (00 - 99)',
    subtitle: '1 número por boleto · 100 números',
  },
  {
    value: 'triples_333',
    label: '333 Boletos — Triples (001 - 999)',
    subtitle: '3 núm/boleto · 999 números (000 excluido)',
  },
  {
    value: 'pairs_500',
    label: '500 Boletos — Pares (000 - 999)',
    subtitle: '2 núm/boleto · Matriz 50×10 (1.000 números)',
  },
];

export default function CreateRaffleModal({
  isOpen,
  onClose,
  onRaffleCreated,
  currentRaffle,
}: CreateRaffleModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheme, setScheme] = useState<TicketSchemeType>('standard_100');
  const [totalNumbers, setTotalNumbers] = useState(100);
  const [ticketPrice, setTicketPrice] = useState<number | ''>(10);
  const [totalInvestment, setTotalInvestment] = useState<number | ''>(400);

  // Múltiples juegos especiales con fecha opcional
  const [specialGames, setSpecialGames] = useState<SpecialGameItem[]>([
    { id: 1, name: 'Sorteo Anticipado 1 - Tanque Lleno', min_amount: 3, drawDate: '' },
    { id: 2, name: 'Sorteo Anticipado 2 - Casco Certificado', min_amount: 5, drawDate: '' },
    { id: 3, name: 'Bono Especial Alejandro GM ($100 USD)', min_amount: 8, drawDate: '' },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDestructiveModal, setShowDestructiveModal] = useState(false);
  const [destructiveConfirmed, setDestructiveConfirmed] = useState(false);
  // Payload pendiente de envío tras confirmar el modal destructivo
  const pendingPayloadRef = React.useRef<Parameters<typeof createRaffle>[0] | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Escuchar tecla Escape para cerrar modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const numericPrice = typeof ticketPrice === 'number' ? ticketPrice : 0;
  const numericInvestment = typeof totalInvestment === 'number' ? totalInvestment : 0;
  const totalPotencial = totalNumbers * numericPrice;
  const breakEvenTickets = Math.ceil(numericInvestment / (numericPrice || 1));
  const maxProfit = Math.max(0, totalPotencial - numericInvestment);

  const handleSchemeChange = (val: string) => {
    const chosen = val as TicketSchemeType;
    setScheme(chosen);
    if (chosen === 'triples_333') {
      setTotalNumbers(333);
    } else if (chosen === 'pairs_500') {
      setTotalNumbers(500);
    } else {
      setTotalNumbers(100);
    }
  };

  const handleAddGame = () => {
    const nextId = specialGames.length > 0 ? Math.max(...specialGames.map((g) => g.id)) + 1 : 1;
    setSpecialGames([
      ...specialGames,
      { id: nextId, name: `Sorteo Anticipado #${nextId}`, min_amount: 5, drawDate: '' },
    ]);
  };

  const handleRemoveGame = (id: number) => {
    setSpecialGames(specialGames.filter((g) => g.id !== id));
  };

  const handleUpdateGame = (id: number, field: 'name' | 'min_amount' | 'drawDate', val: any) => {
    setSpecialGames(
      specialGames.map((g) => (g.id === id ? { ...g, [field]: val } : g))
    );
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setScheme('standard_100');
    setTotalNumbers(100);
    setTicketPrice(10);
    setTotalInvestment(400);
    setSpecialGames([
      { id: 1, name: 'Sorteo Anticipado 1 - Tanque Lleno', min_amount: 3, drawDate: '' },
      { id: 2, name: 'Sorteo Anticipado 2 - Casco Certificado', min_amount: 5, drawDate: '' },
      { id: 3, name: 'Bono Especial Alejandro GM ($100 USD)', min_amount: 8, drawDate: '' },
    ]);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validación exhaustiva previa sin fallos silenciosos
    if (!title.trim()) {
      setError('Por favor ingresa un título para la rifa oficial.');
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      titleInputRef.current?.focus();
      return;
    }

    if (numericPrice <= 0) {
      setError('El precio del boleto debe ser un monto mayor a 0 USD.');
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (numericInvestment < 0) {
      setError('La inversión total no puede ser un monto negativo.');
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validar cada juego especial
    for (let i = 0; i < specialGames.length; i++) {
      const g = specialGames[i];
      if (!g.name.trim()) {
        setError(`El Juego Especial #${i + 1} requiere un nombre o descripción.`);
        modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!g.min_amount || Number(g.min_amount) <= 0) {
        setError(`El abono mínimo para el Juego Especial #${i + 1} debe ser mayor a 0 USD.`);
        modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      total_numbers: Number(totalNumbers),
      scheme,
      ticket_price_usd: numericPrice,
      total_investment_usd: numericInvestment,
      special_games: specialGames,
    };

    // Si ya hay una rifa activa con ID real (distinto del default), pedir confirmación destructiva
    const hasActiveRaffle = currentRaffle && currentRaffle.id > 0;
    if (hasActiveRaffle && !showDestructiveModal) {
      pendingPayloadRef.current = payload;
      setDestructiveConfirmed(false);
      setShowDestructiveModal(true);
      return;
    }

    await doCreateRaffle(payload);
  };

  const doCreateRaffle = async (payload: Parameters<typeof createRaffle>[0]) => {
    setIsCreating(true);
    setShowDestructiveModal(false);

    try {
      const created = await createRaffle(payload);
      setSuccessMsg('¡Rifa oficial creada con éxito!');
      onRaffleCreated(created);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('[CreateRaffle]', err);
      setError(err?.message || 'Error inesperado al crear la rifa oficial.');
      modalScrollRef.current?.scrollTo({ top: modalScrollRef.current.scrollHeight, behavior: 'smooth' });
    } finally {
      setIsCreating(false);
    }
  };

  // Modal de confirmación destructiva
  if (showDestructiveModal) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-[#0B1526]/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-red-200 rounded-lg shadow-modal animate-scale-in overflow-hidden">
          {/* Cabecera de peligro */}
          <div className="p-4 bg-[#FEF2F2] border-b border-red-200 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FEE2E2] flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-[#991B1B] uppercase tracking-wider">
                ¿Reemplazar la rifa actual?
              </h2>
              <p className="text-[11px] text-[#B91C1C] mt-0.5">Esta acción no se puede deshacer</p>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-4 sm:p-5 space-y-4">
            <p className="text-xs text-[#374151] leading-relaxed">
              Al crear esta nueva rifa, la rifa actual{' '}
              <strong className="text-[#0B1526]">«{currentRaffle?.title}»</strong> junto con{' '}
              <strong>TODOS sus boletos, clientes registrados, abonos e historial de ventas</strong>{' '}
              serán <span className="text-[#DC2626] font-bold">eliminados permanentemente</span>.
            </p>

            <label className="flex items-start gap-3 cursor-pointer p-3 bg-[#FEF2F2] border border-red-200 rounded-lg">
              <input
                type="checkbox"
                checked={destructiveConfirmed}
                onChange={(e) => setDestructiveConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#DC2626] flex-shrink-0 cursor-pointer"
              />
              <span className="text-xs text-[#7F1D1D] font-semibold leading-relaxed">
                Entiendo que la rifa actual y todos sus registros se borrarán definitivamente
              </span>
            </label>
          </div>

          {/* Pie de botones */}
          <div className="p-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowDestructiveModal(false)}
              className="min-h-[44px] px-4 py-2 bg-[#FFFFFF] hover:bg-[#EAF0F6] text-[#0B1526] text-xs font-semibold rounded-lg border border-[#CBD5E1] shadow-subtle transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!destructiveConfirmed || isCreating}
              onClick={() => pendingPayloadRef.current && doCreateRaffle(pendingPayloadRef.current)}
              className="min-h-[44px] px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-[#FCA5A5] disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-subtle transition-all flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <span>Sí, borrar anterior y lanzar rifa</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B1526]/50 backdrop-blur-sm">
      <div
        ref={modalScrollRef}
        className="relative w-[calc(100%-1rem)] sm:w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg p-4 sm:p-6 shadow-modal animate-scale-in"
      >
        {/* Encabezado Encapsulado */}
        <div className="flex items-center justify-between p-3 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-display font-bold text-[#0B1526] uppercase tracking-wider truncate">
                Crear Nueva Rifa Oficial
              </h2>
              <p className="text-[11px] text-[#475569] truncate">
                Configura boletos, inversión y múltiples juegos especiales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded-lg text-[#64748B] hover:text-[#0B1526] hover:bg-[#EAF0F6] transition-all flex-shrink-0 disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Confirmación / Toast */}
        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold flex items-center gap-2 animate-scale-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4 text-xs">
          {/* Título de la Rifa */}
          <div>
            <label className="block font-bold text-[#475569] mb-1 uppercase tracking-wider">
              Título del Sorteo *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Gran Rifa Moto Bera SBR 2026"
              className="w-full px-3 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-sm focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] transition-colors"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block font-bold text-[#475569] mb-1 uppercase tracking-wider">
              Descripción y Premios
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="1er Premio Moto 0km. 2do Premio $100 USD..."
              rows={2}
              className="w-full px-3 py-2.5 sm:py-2 min-h-[64px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] resize-none transition-colors"
            />
          </div>

          {/* Configuración Numérica (FIX 2: SEPARACIÓN EN 2 FILAS INDEPENDIENTES) */}
          <div className="space-y-3">
            {/* Fila 1 (Ancho Completo w-full): Únicamente TOTAL BOLETOS + su micro-tarjeta informativa */}
            <div className="w-full">
              <label className="block font-bold text-[#475569] mb-1 uppercase tracking-wider">
                Total Boletos
              </label>
              <CustomSelect
                value={scheme}
                onChange={handleSchemeChange}
                options={SCHEME_OPTIONS}
                className="w-full min-w-0 max-w-full"
              />

              {/* Micro-tarjeta informativa del esquema agrupado Triples */}
              {scheme === 'triples_333' && (
                <div className="mt-2 p-2.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg text-xs space-y-1.5 shadow-subtle">
                  <div className="flex items-center justify-between text-[#0369A1] font-semibold text-[11px]">
                    <span>Esquema Triples — 1.000 números</span>
                    <span className="font-mono tabular-nums text-[10px] bg-[#E0F2FE] px-2 py-0.5 rounded text-[#0369A1] border border-[#BAE6FD] font-bold">
                      000 Excluido · 999 Números Únicos
                    </span>
                  </div>
                  <div className="text-[#475569] text-[11px] flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span>3 números por boleto:</span>
                    <span className="font-mono tabular-nums font-bold text-[#0B1526] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#DCE4EE]">
                      Boleto #001: 001 · 334 · 999
                    </span>
                    <span className="text-[#94A3B8] font-bold">|</span>
                    <span className="font-mono tabular-nums font-bold text-[#0B1526] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#DCE4EE]">
                      Boleto #333: 333 · 666 · 667
                    </span>
                  </div>
                </div>
              )}

              {/* Micro-tarjeta informativa del esquema agrupado Pares */}
              {scheme === 'pairs_500' && (
                <div className="mt-2 p-2.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg text-xs space-y-1.5 shadow-subtle">
                  <div className="flex items-center justify-between text-[#0369A1] font-semibold text-[11px]">
                    <span>Esquema Pares — 1.000 números (Matriz 50×10)</span>
                    <span className="font-mono tabular-nums text-[10px] bg-[#E0F2FE] px-2 py-0.5 rounded text-[#0369A1] border border-[#BAE6FD] font-bold">
                      000 a 999 · 1.000 Números Únicos
                    </span>
                  </div>
                  <div className="text-[#475569] text-[11px] flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span>Matriz 50 filas × 10 cols (+10/fila):</span>
                    <span className="font-mono tabular-nums font-bold text-[#0B1526] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#DCE4EE]">
                      Boleto #000: 000 · 512
                    </span>
                    <span className="text-[#94A3B8] font-bold">|</span>
                    <span className="font-mono tabular-nums font-bold text-[#0B1526] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#DCE4EE]">
                      Boleto #499: 499 · 511
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Fila 2 (grid grid-cols-1 sm:grid-cols-2 gap-4): PRECIO BOLETO e INVERSIÓN TOTAL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="min-w-0">
                <label className="block font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Precio Boleto (USD)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={ticketPrice}
                  onChange={(e) =>
                    setTicketPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#059669] font-mono tabular-nums font-bold text-base sm:text-sm focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              <div className="min-w-0">
                <label className="block font-bold text-[#475569] mb-1 uppercase tracking-wider">
                  Inversión Total (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={totalInvestment}
                  onChange={(e) =>
                    setTotalInvestment(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] font-mono tabular-nums font-bold text-base sm:text-sm focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>
            </div>
          </div>

          {/* MÚLTIPLES JUEGOS ESPECIALES */}
          <div className="p-3.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-[#854D0E] uppercase tracking-wider block">
                  Juegos Especiales Múltiples ({specialGames.length})
                </span>
                <p className="text-[11px] text-[#64748B]">
                  Define los diferentes sorteos anticipados, su fecha y el abono mínimo requerido
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddGame}
                className="min-h-[40px] self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#EAF0F6] text-[#0369A1] border border-[#CBD5E1] rounded-lg font-bold text-[11px] shadow-subtle transition-colors"
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Agregar Juego</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {specialGames.map((game, index) => (
                <div
                  key={game.id}
                  className="p-3 bg-[#FFFFFF] border border-[#DCE4EE] rounded-lg shadow-subtle space-y-2"
                >
                  {/* Línea 1 (Principal): Badge + Input de descripción full width + Botón eliminar */}
                  <div className="flex items-center gap-2 w-full">
                    <span className="shrink-0 text-xs font-mono tabular-nums font-bold text-[#854D0E] px-2.5 py-1 bg-[#FEFCE8] rounded-md border border-[#FEF08A]">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={game.name}
                      onChange={(e) => handleUpdateGame(game.id, 'name', e.target.value)}
                      placeholder="Nombre o descripción del premio del sorteo anticipado"
                      className="flex-1 min-w-0 w-full bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-[#0B1526] placeholder:text-[#64748B] px-3 py-2 text-base sm:text-sm font-medium focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGame(game.id)}
                      className="shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar juego especial"
                      aria-label={`Eliminar juego especial #${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Línea 2 (Metadatos): Selector de Fecha + Abono Mínimo */}
                  <div className="flex flex-wrap items-center justify-between gap-2 w-full pt-0.5">
                    {/* Selector de Fecha Visual Popover */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#475569]">Fecha Sorteo:</span>
                      <DatePickerPopover
                        value={game.drawDate}
                        onChange={(d) => handleUpdateGame(game.id, 'drawDate', d)}
                        placeholder="Elegir fecha"
                      />
                    </div>

                    {/* Abono Mínimo */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[11px] font-semibold text-[#475569] whitespace-nowrap">
                        Abono ≥ $
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0.5"
                        value={game.min_amount}
                        onChange={(e) =>
                          handleUpdateGame(
                            game.id,
                            'min_amount',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="w-20 px-2.5 py-1.5 min-h-[38px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#059669] font-mono tabular-nums font-bold text-base sm:text-xs focus:bg-[#FFFFFF] focus:border-[#0EA5E9] focus:outline-none text-right"
                      />
                      <span className="text-[10px] text-[#64748B] font-mono font-bold">USD</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="p-3 bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[11px] space-y-1 text-[#475569]">
            <div className="flex justify-between">
              <span>Recaudación Máxima:</span>
              <span className="text-[#059669] font-mono tabular-nums font-bold">
                ${totalPotencial.toLocaleString()} USD
              </span>
            </div>
            <div className="flex justify-between">
              <span>Punto de Equilibrio:</span>
              <span className="text-[#0369A1] font-mono tabular-nums font-bold">
                {breakEvenTickets} boletos
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ganancia Neta Máxima:</span>
              <span className="text-[#0B1526] font-mono tabular-nums font-bold">
                ${maxProfit.toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* Mensaje de Error Visible Encima del Footer */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold flex items-center gap-2 animate-scale-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Botones Encapsulados (Footer) */}
          <div className="flex items-center justify-end gap-2.5 p-2.5 bg-[#F4F7FA] border border-[#DCE4EE] rounded-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="min-h-[44px] px-4 py-2 bg-[#FFFFFF] hover:bg-[#EAF0F6] text-[#0B1526] text-xs font-semibold rounded-lg border border-[#CBD5E1] shadow-subtle transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="min-h-[44px] px-5 py-2 bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-subtle transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <span>Lanzar Rifa</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
