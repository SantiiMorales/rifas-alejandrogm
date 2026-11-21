'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/admin');
    }
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#05070A]">
      <div className="w-full max-w-xl text-center space-y-6">
        {/* Emblema GM Sólido (Cero Degradados) */}
        <div className="mx-auto w-16 h-16 rounded-xl bg-[#12161F] border-2 border-[#1EE868] flex items-center justify-center">
          <span className="font-brand-condensed text-3xl font-black text-[#1EE868]">GM</span>
        </div>

        {/* Título y Marca */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="font-brand-slab text-3xl sm:text-4xl text-white">RIFAS</span>
            <span className="font-brand-condensed text-4xl sm:text-5xl font-black text-[#1EE868]">
              ALEJANDRO GM
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest text-[#00D4FF] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#00D4FF]" />
            <span>Seguridad y Transparencia Garantizada</span>
          </div>
        </div>

        {/* Tarjetas de Selección Rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button
            onClick={() => router.push('/consultar')}
            className="bg-[#12161F] p-6 border border-metallic hover:border-[#00D4FF] rounded-xl text-left flex flex-col justify-between transition-colors"
          >
            <div>
              <div className="p-2.5 w-fit rounded-lg bg-[#1E2430] text-[#00D4FF] mb-3">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Consultar Mi Boleto</h3>
              <p className="text-xs text-[#C4CBD4] mt-1">
                Ingresa con tu número o celular para ver tus boletos y abonos oficiales.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-[#00D4FF] font-bold">
              <span>Ir al portal público</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => router.push('/admin')}
            className="bg-[#12161F] p-6 border border-metallic hover:border-[#1EE868] rounded-xl text-left flex flex-col justify-between transition-colors"
          >
            <div>
              <div className="p-2.5 w-fit rounded-lg bg-[#1E2430] text-[#1EE868] mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Panel de Administración</h3>
              <p className="text-xs text-[#C4CBD4] mt-1">
                Acceso para control de boletos, abonos y finanzas.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-[#1EE868] font-bold">
              <span>Acceder al Tablero</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
