'use client';

import React, { useState } from 'react';
import { X, Sparkles, DollarSign, Target, Award, Hash, Plus, Trash2 } from 'lucide-react';
import { createRaffle } from '@/lib/api';
import { Raffle, SpecialGameItem } from '@/lib/types';

interface CreateRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRaffleCreated: (newRaffle: Raffle) => void;
}

export default function CreateRaffleModal({
  isOpen,
  onClose,
  onRaffleCreated,
}: CreateRaffleModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalNumbers, setTotalNumbers] = useState(100);
  const [ticketPrice, setTicketPrice] = useState(10);
  const [totalInvestment, setTotalInvestment] = useState(400);

  // Múltiples juegos especiales
  const [specialGames, setSpecialGames] = useState<SpecialGameItem[]>([
    { id: 1, name: 'Sorteo Anticipado 1 - Tanque Lleno', min_amount: 3 },
    { id: 2, name: 'Sorteo Anticipado 2 - Casco Certificado', min_amount: 5 },
    { id: 3, name: 'Bono Especial Alejandro GM ($100 USD)', min_amount: 8 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const totalPotencial = totalNumbers * ticketPrice;
  const breakEvenTickets = Math.ceil(totalInvestment / (ticketPrice || 1));
  const maxProfit = Math.max(0, totalPotencial - totalInvestment);

  const handleAddGame = () => {
    const nextId = specialGames.length > 0 ? Math.max(...specialGames.map((g) => g.id)) + 1 : 1;
    setSpecialGames([
      ...specialGames,
      { id: nextId, name: `Sorteo Anticipado #${nextId}`, min_amount: 5 },
    ]);
  };

  const handleRemoveGame = (id: number) => {
    setSpecialGames(specialGames.filter((g) => g.id !== id));
  };

  const handleUpdateGame = (id: number, field: 'name' | 'min_amount', val: any) => {
    setSpecialGames(
      specialGames.map((g) => (g.id === id ? { ...g, [field]: val } : g))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor ingresa un título para la rifa');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const created = await createRaffle({
        title: title.trim(),
        description: description.trim(),
        total_numbers: Number(totalNumbers),
        ticket_price_usd: Number(ticketPrice),
        total_investment_usd: Number(totalInvestment),
        special_games: specialGames,
      });
      onRaffleCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear la rifa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#12161F] border border-metallic rounded-lg p-6 shadow-2xl">
        {/* Encabezado Encapsulado Cero Degradados */}
        <div className="flex items-center justify-between p-3 bg-[#05070A] border border-metallic rounded-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#1E2430] text-[#1EE868] border border-metallic">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Crear Nueva Rifa Oficial
              </h2>
              <p className="text-[11px] text-[#C4CBD4]">
                Configura boletos, inversión y múltiples juegos especiales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6E7785] hover:text-white hover:bg-[#1E2430] border border-transparent hover:border-metallic transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Título de la Rifa */}
          <div>
            <label className="block font-bold text-[#C4CBD4] mb-1 uppercase tracking-wider">
              Título del Sorteo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Gran Rifa Moto Bera SBR 2026"
              className="w-full px-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white text-sm focus:outline-none focus:border-[#1EE868]"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block font-bold text-[#C4CBD4] mb-1 uppercase tracking-wider">
              Descripción y Premios
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="1er Premio Moto 0km. 2do Premio $100 USD..."
              rows={2}
              className="w-full px-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs focus:outline-none focus:border-[#1EE868] resize-none"
            />
          </div>

          {/* Grid de Configuración Numérica */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#C4CBD4] mb-1 uppercase">
                Total Boletos
              </label>
              <select
                value={totalNumbers}
                onChange={(e) => setTotalNumbers(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white font-bold focus:outline-none"
              >
                <option value={100}>100 (00 - 99)</option>
                <option value={500}>500 (000 - 499)</option>
                <option value={1000}>1.000 (000 - 999)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#C4CBD4] mb-1 uppercase">
                Precio Boleto (USD)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-[#1EE868] font-bold text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#C4CBD4] mb-1 uppercase">
                Inversión Total (USD)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={totalInvestment}
                onChange={(e) => setTotalInvestment(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white font-bold text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          {/* MÚLTIPLES JUEGOS ESPECIALES */}
          <div className="p-3.5 bg-[#05070A] border border-metallic rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-400 uppercase tracking-wider block">
                  Juegos Especiales Múltiples ({specialGames.length})
                </span>
                <p className="text-[11px] text-[#6E7785]">
                  Define los diferentes sorteos anticipados y el abono mínimo requerido para cada uno
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddGame}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2430] hover:bg-[#1E2430]/80 text-[#00D4FF] border border-metallic rounded-lg font-bold text-[11px] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Juego</span>
              </button>
            </div>

            <div className="space-y-2">
              {specialGames.map((game, index) => (
                <div
                  key={game.id}
                  className="flex items-center gap-2 p-2 bg-[#12161F] border border-metallic rounded-lg"
                >
                  <span className="text-[11px] font-bold text-amber-400 px-2 py-0.5 bg-[#05070A] rounded-md border border-metallic">
                    #{index + 1}
                  </span>
                  <input
                    type="text"
                    value={game.name}
                    onChange={(e) => handleUpdateGame(game.id, 'name', e.target.value)}
                    placeholder="Nombre del juego especial"
                    className="flex-1 px-2.5 py-1.5 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs"
                    required
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#C4CBD4]">Abono ≥ $</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={game.min_amount}
                      onChange={(e) =>
                        handleUpdateGame(game.id, 'min_amount', Number(e.target.value))
                      }
                      className="w-16 px-2 py-1.5 bg-[#1E2430] border border-metallic rounded-lg text-[#1EE868] font-bold text-xs"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGame(game.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar juego especial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen Financiero Sólido */}
          <div className="p-3 bg-[#1E2430] border border-metallic rounded-lg text-[11px] space-y-1 text-[#C4CBD4]">
            <div className="flex justify-between">
              <span>Recaudación Máxima:</span>
              <span className="text-[#1EE868] font-bold">${totalPotencial.toLocaleString()} USD</span>
            </div>
            <div className="flex justify-between">
              <span>Punto de Equilibrio:</span>
              <span className="text-[#00D4FF] font-bold">{breakEvenTickets} boletos</span>
            </div>
            <div className="flex justify-between">
              <span>Ganancia Neta Máxima:</span>
              <span className="text-white font-bold">${maxProfit.toLocaleString()} USD</span>
            </div>
          </div>

          {/* Botones Encapsulados Cero Degradados */}
          <div className="flex items-center justify-end gap-2.5 p-2.5 bg-[#05070A] border border-metallic rounded-lg">
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
              {loading ? 'Creando...' : 'Lanzar Rifa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
