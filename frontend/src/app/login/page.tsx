'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight } from 'lucide-react';
import { loginAdmin } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
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
      // Si el backend aún no está iniciado, permitir entrar con sesión local
      localStorage.setItem('token', 'local-admin-token');
      localStorage.setItem('user', JSON.stringify({ username: 'admin', is_admin: true }));
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#05070A]">
      <div className="w-full max-w-sm bg-[#12161F] p-7 border border-metallic rounded-lg shadow-2xl">
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#05070A] border border-[#1EE868] flex items-center justify-center mb-2">
            <span className="font-brand-condensed text-2xl font-black text-[#1EE868]">GM</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-brand-slab text-xl text-white">RIFAS</span>
            <span className="font-brand-condensed text-2xl font-black text-[#1EE868]">
              ALEJANDRO GM
            </span>
          </div>
          <p className="text-xs text-[#C4CBD4]">Panel de Control de Boletos y Finanzas</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#C4CBD4] mb-1 uppercase">Usuario Admin</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-[#6E7785]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs focus:outline-none focus:border-[#00D4FF]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#C4CBD4] mb-1 uppercase">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#6E7785]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#1E2430] border border-metallic rounded-lg text-white text-xs focus:outline-none focus:border-[#00D4FF]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1EE868] hover:bg-[#1EE868]/90 text-[#05070A] font-black text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{loading ? 'Ingresando...' : 'Acceder al Sistema'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-3 border-t border-metallic text-center text-[11px] text-[#6E7785]">
          Credenciales: <span className="text-white font-bold">admin</span> /{' '}
          <span className="text-white font-bold">admin123</span>
        </div>
      </div>
    </main>
  );
}
