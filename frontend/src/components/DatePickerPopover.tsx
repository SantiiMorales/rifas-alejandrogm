'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDrawDate } from '@/lib/ticketSchemes';

interface DatePickerPopoverProps {
  value?: string;
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
}

const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export default function DatePickerPopover({
  value,
  onChange,
  placeholder = 'Elegir fecha',
  className = '',
}: DatePickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove?: boolean }>({
    top: 0,
    left: 0,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parsear fecha seleccionada o usar fecha actual para navegación inicial
  const parseInitialDate = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  };

  const initial = parseInitialDate();
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizar mes/año cuando cambia el valor externo
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  // Actualizar coordenadas con clamping contra bordes de la ventana
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 300;
    const popoverHeight = 340;
    const padding = 8;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - padding) {
      left = window.innerWidth - popoverWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    let top = rect.bottom + 6;
    let placeAbove = false;
    if (rect.bottom + popoverHeight > window.innerHeight - padding) {
      if (rect.top - popoverHeight - 6 > padding) {
        top = rect.top - popoverHeight - 6;
        placeAbove = true;
      }
    }

    setCoords({ top, left, placeAbove });
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Cierre al hacer click fuera, scroll o Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const isoDate = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(isoDate);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Cálculo de la cuadrícula de días (Lunes = 0, Domingo = 6)
  const firstDayOfMonth = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Texto amigable formateado
  const formattedText = value ? formatDrawDate(value) : '';

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Botón Disparador */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`min-h-[38px] px-2.5 py-1.5 bg-[#FFFFFF] border ${
          value ? 'border-[#BAE6FD] text-[#0B1526]' : 'border-[#CBD5E1] text-[#475569]'
        } rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-1 transition-all flex items-center gap-2 shadow-subtle`}
        aria-label="Seleccionar fecha del sorteo"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-[#0369A1] flex-shrink-0" />
        <span className="truncate">{formattedText || placeholder}</span>
        {value ? (
          <span
            onClick={handleClear}
            aria-hidden="true"
            className="ml-1 p-0.5 rounded hover:bg-[#EAF0F6] text-[#64748B] hover:text-[#0B1526] transition-colors"
            title="Limpiar fecha"
          >
            <X className="w-3 h-3" />
          </span>
        ) : null}
      </button>

      {/* Calendario Desplegable con Portal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Selector de fecha del sorteo"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
            className="w-[300px] max-w-[calc(100vw-1rem)] bg-[#FFFFFF] border border-[#DCE4EE] rounded-xl shadow-xl shadow-slate-900/10 p-3 select-none animate-scale-in"
          >
            {/* Cabecera del Mes */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DCE4EE]">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="min-h-[32px] min-w-[32px] flex items-center justify-center p-1 rounded-lg text-[#475569] hover:text-[#0B1526] hover:bg-[#EAF0F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-bold text-[#0B1526] capitalize">
                {SPANISH_MONTHS[viewMonth]} {viewYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="min-h-[32px] min-w-[32px] flex items-center justify-center p-1 rounded-lg text-[#475569] hover:text-[#0B1526] hover:bg-[#EAF0F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="text-[10px] font-bold text-[#64748B] py-1">
                  {wd}
                </div>
              ))}
            </div>

            {/* Matriz de Días */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const monthStr = String(viewMonth + 1).padStart(2, '0');
                const dayStr = String(dayNum).padStart(2, '0');
                const cellIso = `${viewYear}-${monthStr}-${dayStr}`;

                const isSelected = value === cellIso;
                const isToday =
                  viewYear === todayYear && viewMonth === todayMonth && dayNum === todayDay;

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    aria-pressed={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={`${dayNum} de ${SPANISH_MONTHS[viewMonth]} de ${viewYear}`}
                    className={`h-9 w-9 mx-auto flex items-center justify-center rounded-lg text-xs font-mono tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] ${
                      isSelected
                        ? 'bg-[#0369A1] text-white font-bold shadow-sm'
                        : isToday
                        ? 'border border-[#0EA5E9] text-[#0369A1] font-bold hover:bg-[#EAF0F6]'
                        : 'text-[#0B1526] hover:bg-[#EAF0F6] font-medium'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Pie con botón de Hoy */}
            <div className="mt-2.5 pt-2 border-t border-[#DCE4EE] flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  const t = new Date();
                  const y = t.getFullYear();
                  const m = String(t.getMonth() + 1).padStart(2, '0');
                  const d = String(t.getDate()).padStart(2, '0');
                  onChange(`${y}-${m}-${d}`);
                  setIsOpen(false);
                }}
                className="text-[#0369A1] font-semibold hover:underline"
              >
                Hoy
              </button>
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-red-500 font-semibold hover:underline"
                >
                  Quitar fecha
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
