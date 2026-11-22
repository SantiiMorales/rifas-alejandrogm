'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight } from 'lucide-react';
import { loginAdmin } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginAdmin(username.trim(), password);
      router.push('/admin');
    } catch (err: any) {
      setError('Usuario o contraseña incorrectos. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-3 sm:p-4 bg-[#F4F7FA]">
      <div className="w-full max-w-sm bg-[#FFFFFF] p-5 sm:p-7 border border-[#DCE4EE] rounded-lg shadow-card">
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#0B1526] border border-[#CBD5E1] shadow-subtle flex items-center justify-center mb-2">
            <span className="font-display text-2xl font-extrabold text-[#0EA5E9]">GM</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-display text-xl font-bold text-[#0B1526] tracking-tight">RIFAS</span>
            <span className="font-display text-2xl font-black text-[#0369A1] tracking-tight">
              ALEJANDRO GM
            </span>
          </div>
          <p className="text-xs text-[#475569]">Panel de Control de Boletos y Finanzas</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#475569] mb-1 uppercase text-[11px] tracking-wider">
              Usuario Admin
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs font-medium focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#475569] mb-1 uppercase text-[11px] tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#64748B]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 sm:py-2 min-h-[44px] bg-[#EAF0F6] border border-[#DCE4EE] rounded-lg text-[#0B1526] text-base sm:text-xs font-medium focus:outline-none focus:border-[#0EA5E9] focus:bg-[#FFFFFF] transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] py-2.5 bg-[#0369A1] hover:bg-[#075985] text-white font-semibold text-xs uppercase tracking-wider rounded-lg shadow-subtle transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{loading ? 'Ingresando...' : 'Acceder al Sistema'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </main>
  );
}
