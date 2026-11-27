'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  subtitle?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  icon?: React.ReactNode;
  label?: string;
  variant?: 'default' | 'amber';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  icon,
  label,
  variant = 'default',
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove?: boolean }>({
    top: 0,
    left: 0,
    width: 280,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = React.useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const padding = 8;
    const menuWidth = Math.max(rect.width, Math.min(320, window.innerWidth - padding * 2));
    const estimatedHeight = Math.min(options.length * 44 + 20, 320);

    let left = rect.left;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    let top = rect.bottom + 6;
    let placeAbove = false;
    if (rect.bottom + estimatedHeight > window.innerHeight - padding) {
      if (rect.top - estimatedHeight - 6 > padding) {
        top = rect.top - estimatedHeight - 6;
        placeAbove = true;
      }
    }

    setCoords({ top, left, width: menuWidth, placeAbove });
  }, [options.length]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      const idx = options.findIndex((o) => o.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
        }
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
  }, [isOpen, options, highlightedIndex, onChange, updatePosition]);

  const isAmber = variant === 'amber';

  return (
    <div className={`relative w-full min-w-0 max-w-full ${className}`}>
      {/* Botón Disparador Estilizado */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`w-full min-w-0 max-w-full overflow-hidden min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 border shadow-subtle transition-all select-none focus:outline-none ${
          isAmber
            ? 'bg-[#FEFCE8] border-[#FEF08A] text-[#854D0E] focus-visible:ring-2 focus-visible:ring-[#EAB308]'
            : 'bg-[#FFFFFF] border-[#DCE4EE] text-[#0B1526] hover:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="shrink-0">{icon}</span>}
          {label && (
            <span
              className={`shrink-0 font-semibold text-xs ${
                isAmber ? 'text-[#854D0E]' : 'text-[#475569]'
              }`}
            >
              {label}
            </span>
          )}
          <span className="block min-w-0 flex-1 truncate text-left font-bold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${isAmber ? 'text-[#854D0E]' : 'text-[#64748B]'}`}
        />
      </button>

      {/* Menú Flotante con Portal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={label || placeholder}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-[#FFFFFF] border border-[#DCE4EE] rounded-xl shadow-xl shadow-slate-900/10 p-1.5 max-h-[320px] overflow-y-auto select-none animate-scale-in"
          >
            <div className="space-y-0.5">
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] ${
                      isSelected
                        ? isAmber
                          ? 'bg-[#FEFCE8] text-[#854D0E] font-bold'
                          : 'bg-[#E0F2FE]/70 text-[#0369A1] font-bold'
                        : isHighlighted
                        ? 'bg-[#EAF0F6] text-[#0B1526]'
                        : 'text-[#0B1526] hover:bg-[#EAF0F6]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{opt.label}</span>
                        {opt.subtitle && (
                          <span className="block text-[10px] text-[#64748B] truncate font-normal">
                            {opt.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {opt.badge && (
                        <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected ? (
                        <Check
                          className={`w-4 h-4 flex-shrink-0 ${
                            isAmber ? 'text-[#854D0E]' : 'text-[#0369A1]'
                          }`}
                        />
                      ) : (
                        <span className="w-4 h-4 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
