import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Rifas Alejandro GM | Sistema Oficial de Boletos',
  description: 'Sistema de gestión y consulta de boletos de Rifas Alejandro GM. Modo Oscuro Sólido.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#05070A] text-[#FFFFFF] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
