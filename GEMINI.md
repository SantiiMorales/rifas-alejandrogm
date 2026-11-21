# Reglas y Guías del Proyecto: Rifas Alejandro GM

## 1. Visión General del Proyecto
**Rifas Alejandro GM** es una plataforma web para la gestión integral de boletos y administración de sorteos para un solo operador. 
Estructura de monorepo:
- `/backend`: API construida con FastAPI, SQLAlchemy, JWT y base de datos SQLite (en memoria con datos semilla para desarrollo ágil).
- `/frontend`: Aplicación web moderna construida con Next.js (App Router), React, Tailwind CSS y Lucide Icons.

---

## 2. Sistema de Diseño e Identidad Visual (Dark Mode Sólido - Cero Degradados)
**Regla estricta:** Cero degradados. Toda la interfaz utiliza colores sólidos de alto contraste.

### Paleta de Colores Sólidos
- **Fondo Principal (`bg-main`):** `#05070A` (Negro Abismo)
- **Superficie de Tarjetas y Barra Lateral (`bg-card`):** `#12161F` (Carbón Cepillado)
- **Superficie Interactiva / Hover (`bg-elevated`):** `#1E2430` (Acero Oscuro)
- **Acento Primario / Éxito (`accent-green`):** `#1EE868` (Verde Neón Eléctrico)
- **Acento Secundario / Info (`accent-cyan`):** `#00D4FF` (Cian Cibernético)
- **Acento Terciario (`accent-blue`):** `#0077E6` (Azul Eléctrico Profundo)
- **Acento Juegos Especiales:** `#EAB308` (Ámbar / Dorado)
- **Texto Principal (`text-primary`):** `#FFFFFF`
- **Texto Secundario (`text-secondary`):** `#C4CBD4` (Plata Cepillado)
- **Bordes y Deshabilitados (`text-muted`):** `#6E7785` (Gris Titanio)
- **Borde Metálico:** `rgba(196, 203, 212, 0.18)`

---

## 3. Disposición y Navegación
- **Navegación Lateral a la Izquierda:**
  - Los paneles del sistema se organizan a la izquierda en una barra lateral con desplegable en forma de lista:
    - Tablero de Boletos (`/admin`)
    - Finanzas & ROI (`/admin/finances`)
    - Ventas del Día (`/admin/sales`)
    - Portal Público (`/consultar`)
    - Botones de acción directa: "Crear Nueva Rifa" y "Configurar Tasas".

---

## 4. Fórmulas de Tasas de Conversión
El panel de tasas permite fijar tasas directas y customizables (división para moneda extranjera a USD):
1. **Bolívares a Pesos:** `Cantidad de Bs * Taza de conversión = Pesos`
2. **Bolívares a Dólares:** `Cantidad de Bs / Taza de conversión = Dólares`
3. **Pesos a Dólares:** `Cantidad de pesos / Taza de conversión = Dólares`

---

## 5. Múltiples Juegos Especiales
- Una rifa puede tener varios juegos especiales simultáneos (ej: *Sorteo Anticipado 1*, *Sorteo Anticipado 2*, *Bono Especial*).
- Cada juego especial tiene su propio nombre y abono mínimo en USD.
- Cada boleto muestra qué juegos especiales ha desbloqueado según sus abonos acumulados.
- En el tablero principal se puede filtrar por cualquier juego especial o por un sorteo específico.

---

## 6. Rendimiento y Carga Instantánea (0ms)
- Cero dependencias bloqueantes de CDN externos (fuentes del sistema nativas para carga inmediata).
- Inicialización con estado local de respaldo para que la matriz de 100 boletos siempre renderice al instante sin pantallas de carga infinitas.
