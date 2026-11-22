'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      router.push('/admin');
    }
  }, [router]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-3 sm:p-4 bg-[#F4F7FA]">
      <div className="w-full max-w-xl text-center space-y-5 sm:space-y-6">
        {/* Emblema GM Autoridad */}
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0B1526] border-2 border-[#CBD5E1] shadow-card flex items-center justify-center">
          <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#0EA5E9]">GM</span>
        </div>

        {/* Título y Marca */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-display text-2xl sm:text-4xl font-extrabold text-[#0B1526] tracking-tight">RIFAS</span>
            <span className="font-display text-3xl sm:text-5xl font-black text-[#0369A1] tracking-tight">
              ALEJANDRO GM
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider text-[#059669] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#059669] flex-shrink-0" />
            <span className="truncate">Seguridad y Transparencia Garantizada</span>
          </div>
        </div>

        {/* Tarjetas de Selección Rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
          <button
            onClick={() => router.push('/consultar')}
            className="bg-[#FFFFFF] p-5 sm:p-6 border border-[#DCE4EE] hover:border-[#0369A1] rounded-xl text-left flex flex-col justify-between transition-all shadow-subtle hover:shadow-elevated min-h-[140px]"
          >
            <div>
              <div className="p-2.5 w-fit rounded-lg bg-[#E0F2FE] text-[#0369A1] mb-3">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#0B1526]">Consultar Mi Boleto</h3>
              <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                Ingresa con tu número o celular para ver tus boletos y abonos oficiales.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-[#0369A1] font-semibold">
              <span>Ir al portal público</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => router.push('/admin')}
            className="bg-[#FFFFFF] p-5 sm:p-6 border border-[#DCE4EE] hover:border-[#0B1526] rounded-xl text-left flex flex-col justify-between transition-all shadow-subtle hover:shadow-elevated min-h-[140px]"
          >
            <div>
              <div className="p-2.5 w-fit rounded-lg bg-[#EAF0F6] text-[#0B1526] mb-3">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#0B1526]">Panel de Administración</h3>
              <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                Acceso para control de boletos, abonos y finanzas.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-[#0B1526] font-semibold">
              <span>Acceder al Tablero</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
