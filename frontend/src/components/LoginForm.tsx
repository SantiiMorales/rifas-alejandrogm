'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  Ticket,
  User,
} from 'lucide-react';
import { loginAdmin } from '@/lib/api';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setError('Tu sesión expiró, inicia sesión nuevamente.');
    }
  }, [searchParams]);

  const clearError = () => {
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginAdmin(username.trim(), password);
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message || 'Usuario o contraseña incorrectos. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-3 sm:p-4 bg-[#F4F7FA]">
      <div className="w-full max-w-sm bg-[#FFFFFF] p-5 sm:p-7 border border-[#DCE4EE] rounded-lg shadow-card animate-scale-in">
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#0B1526] border border-[#CBD5E1] shadow-subtle flex items-center justify-center mb-2">
            <span className="font-display text-2xl font-extrabold text-[#0EA5E9]">GM</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-display text-xl font-bold text-[#0B1526] tracking-tight">RIFAS</span>
            <span className="font-display text-2xl font-black text-[#0369A1] tracking-tight">
              ALEJANDRO GM
            </span>
          </div>
          <p className="text-xs text-[#475569]">Panel de Control de Boletos y Finanzas</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 text-center font-medium animate-shake"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 text-xs" aria-busy={loading}>
          <div>
            <label
              htmlFor="admin-username"
              className="block font-semibold text-[#475569] mb-1 uppercase text-[11px] tracking-wider"
            >
              Usuario Admin
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError();
                }}
                autoComplete="username"
                aria-invalid={Boolean(error)}
                className="w-full pl-10 pr-3 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs font-medium focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#0EA5E9]/25 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block font-semibold text-[#475569] mb-1 uppercase text-[11px] tracking-wider"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                className="w-full pl-10 pr-12 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs font-medium focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#0EA5E9]/25 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-md text-[#64748B] hover:text-[#0B1526] hover:bg-[#DCE4EE] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] py-2.5 bg-[#0369A1] hover:bg-[#075985] active:scale-[0.99] text-white font-semibold text-xs uppercase tracking-wider rounded-lg shadow-subtle transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              <>
                <span>Acceder al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#DCE4EE] flex flex-col items-center gap-2 text-[11px]">
          <Link
            href="/consultar"
            className="inline-flex items-center justify-center gap-1.5 text-[#0369A1] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2 rounded"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Consultar boleto como cliente</span>
          </Link>
          <span className="inline-flex items-center justify-center gap-1.5 text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Acceso exclusivo del administrador</span>
          </span>
        </div>
      </div>
    </main>
  );
}
