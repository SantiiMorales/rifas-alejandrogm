# Reglas y Guías del Proyecto: Rifas Alejandro GM

## 1. Visión General del Proyecto
**Rifas Alejandro GM** es una plataforma web moderna de alto rendimiento para la gestión integral de boletos, recaudación multidivisa y administración de sorteos para un solo operador.

### Estructura del Monorepo
- `/backend`: API construida con **FastAPI**, **SQLAlchemy**, **JWT** y base de datos SQLite (en memoria con datos semilla para desarrollo ágil y endpoints RESTful bajo `/api`).
- `/frontend`: Aplicación web construida con **Next.js (App Router)**, **React**, **Tailwind CSS** y **Lucide Icons**.

---

## 2. Sistema de Diseño e Identidad Visual (Modo Claro Fintech Premium)
**Estética:** Limpia, confiable, moderna y con estilo fintech/automotriz premium.

### Paleta Oficial de Colores Sólidos en Modo Claro
- **Fondo Base (Canvas):** `#F4F7FA` (Gris acero ultra claro; evita blanco puro como fondo de página).
- **Superficies / Cards / Modales:** `#FFFFFF` con bordes nítidos color acero suave `#DCE4EE` y sombras muy sutiles pizarra (`rgba(11, 21, 38, 0.06)`).
- **Superficies Secundarias / Hover Suave / Inputs:** `#EAF0F6`.
- **Tinta Principal y Anclas de Alto Contraste (Títulos, precios, textos fuertes):** `#0B1526` (Azul marino profundo, núcleo del logo).
- **Texto Secundario / Descripciones:** `#475569`.
- **Texto Terciario / Metadatos:** `#64748B`.
- **Color Primario (CTAs principales, enlaces activos, acciones prioritarias):** `#0369A1` | Hover: `#075985` | Texto sobre primario: `#FFFFFF`.
- **Acento Eléctrico (Focus rings, micro-detalles, líneas activas):** `#0EA5E9`.
- **Color Secundario / Confianza y Estados Positivos (Badges, pagados, disponibles, garantías):** `#059669` | Hover: `#047857` | Superficie tintada: `#ECFDF5` con borde `#A7F3D0` y texto `#065F46`.
- **Acento Juegos Especiales:** `#FEFCE8` con borde `#FEF08A` y texto `#854D0E`.

### Tipografía y Números
- **Fuentes:** `Outfit` (display / títulos principales), `Plus Jakarta Sans` (cuerpo de texto e interfaz) y `JetBrains Mono` con `tabular-nums` para boletos, montos y finanzas.
- Cero dependencias bloqueantes de CDN externos (fuentes del sistema nativas para carga inmediata).

### Reglas de Aplicación UI/UX
1. **Regla 60-30-10:** 60% neutros fríos metálicos (`#F4F7FA` / `#FFFFFF`), 30% estructura y contraste en marino/pizarra (`#0B1526` / `#475569` / `#DCE4EE`), y máximo 10% de acentos (`#0369A1` y `#059669`).
2. **Jerarquía de Botones:** Solo el CTA principal de cada vista lleva fondo `#0369A1` o `#0B1526`. Los botones secundarios llevan `#FFFFFF`, borde `#CBD5E1` y texto `#0B1526` con hover `#EAF0F6`.
3. **Contraste WCAG AA:** Todos los textos cumplen contraste mínimo 4.5:1. Cero textos verdes o cianes neón sobre blanco.
4. **Micro-interacciones y Feedback Táctil:**
   - Botones y tabs con `active:scale-[0.98]` y `focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2`.
   - Tarjetas KPI con hover suave `hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/30 transition-all duration-200 ease-out`.
   - Modales con apertura animada suave (`animate-scale-in`).
   - Accesibilidad estricta con `@media (prefers-reduced-motion: reduce)`.

---

## 3. Disposición y Navegación
- **Navegación Lateral a la Izquierda (`/components/Sidebar.tsx`):**
  - Tablero de Boletos (`/admin`)
  - Finanzas & ROI (`/admin/finances`)
  - Ventas del Día (`/admin/sales`)
  - Portal Público de Clientes (`/consultar`)
  - Botones de acción directa: "Crear Nueva Rifa Oficial" y "Configurar Tasas".
- **Responsive:** Sidebar replegable en móviles con backdrop y botón flotante de acceso táctil `>= 44px`.

---

## 4. Fórmulas de Tasas de Conversión
El panel de tasas permite fijar tasas directas y customizables (división para moneda extranjera a USD):
1. **Bolívares a Pesos:** `Cantidad de Bs * Tasa de conversión = Pesos`
2. **Bolívares a Dólares:** `Cantidad de Bs / Tasa de conversión = Dólares`
3. **Pesos a Dólares:** `Cantidad de pesos / Tasa de conversión = Dólares`

---

## 5. Esquemas de Boletos Soportados (`src/lib/ticketSchemes.ts`)
1. **`standard_100` (100 boletos):**
   - 1 número por boleto (`00` a `99`).
2. **`triples_333` (333 boletos, 1,000 números: 001–999):**
   - 3 números por boleto: $N_1 = i$ (`001` a `333`), $N_2 = i + 333$ (`334` a `666`), $N_3 = 1000 - i$ (`999` a `667`). El número `000` queda excluido.
3. **`pairs_500` (500 boletos, 1,000 números: 000–999):**
   - 2 números por boleto en matriz lógica de 50 filas $\times$ 10 columnas:
     $N_1 = \text{row} \times 10 + \text{col}$, $N_2 = N_1 + 500$.

---

## 6. Múltiples Juegos Especiales con Fecha de Sorteo
- Una rifa puede tener varios juegos especiales simultáneos (ej: *Sorteo Anticipado 1*, *Sorteo Anticipado 2*, *Bono Especial*).
- Cada juego especial tiene su nombre, abono mínimo en USD y campo opcional `drawDate` (`YYYY-MM-DD`).
- Helper `formatDrawDate` formatea las fechas en español corto sin desfase horario UTC (`15 dic` o `15 dic 2026`).
- Los boletos muestran badges interactivos con los juegos especiales desbloqueados según sus abonos acumulados.

---

## 7. Compartir Boleto en Tiempo Real (PNG Retina + Enlace Directo)
- **Captura:** `html-to-image` (`toBlob`) con `pixelRatio: 2`, fondo `#FFFFFF`, `cacheBust: true`.
- **Exclusión Limpia:** Elementos interactivos marcados con `data-share-ignore="true"` se omiten de la imagen.
- **Móvil:** `navigator.share` nativo con archivo PNG y mensaje prellenado con enlace.
- **Escritorio / Fallback:** Descarga automática del PNG, copia al portapapeles y redirección directa a WhatsApp (`https://wa.me/...`).
- **Enlace Directo:** Soporte para parámetro `?ticket=<numero>` en la URL para abrir automáticamente el modal del boleto correspondiente.

---

## 8. Dashboard Financiero, ROI y Gráficos Multimoneda

### Control de Inversión y Break-Even (`InvestmentTracker.tsx`)
- **Fórmulas:**
  - $\text{recaudacionMaxima} = \text{total\_numbers} \times \text{ticket\_price\_usd}$.
  - $\text{breakEvenPct} = (\text{inversionTotal} / \text{recaudacionMaxima}) \times 100$.
  - $\text{currentPct} = (\text{recaudadoActual} / \text{recaudacionMaxima}) \times 100$.
  - $\text{faltante} = \max(0, \text{inversionTotal} - \text{recaudadoActual})$.
  - $\text{gananciaNeta} = \max(0, \text{recaudadoActual} - \text{inversionTotal})$.
- **Pista de Progreso Bicolor:**
  - **Zona 1 (Azul `#0369A1`):** Recuperación de inversión (de 0% hasta `breakEvenPct`).
  - **Zona 2 (Verde Esmeralda `#059669`):** Ganancia neta pura por encima del umbral.
- **Marcador Visual Clamped:** Línea vertical en `breakEvenPct` con pin triangular y etiqueta `Meta Inversión · $X USD` adaptada a los bordes para nunca recortarse en móviles (`360px`).
- **Badge Dinámico:** Indica cuántos boletos faltan para recuperar la inversión o el monto de ganancia neta activa.

### Gráfico de Recaudación Multimoneda (`FinanceCharts.tsx`)
- **4 Modos de Filtrado:**
  1. `Todas (USD)`: Barras apiladas multimoneda (USD Directos, COP y BS en USD equivalente).
  2. `USD Directos`: Únicamente pagos en USD (`#059669`). Días sin USD bajan a `$0`.
  3. `COP (Pesos)`: Únicamente pagos en COP en pesos reales (`#0369A1`). Días sin COP bajan a `$0`.
  4. `BS (Bolívares)`: Únicamente pagos en Bolívares en Bs reales (`#0EA5E9`). Días sin BS bajan a `Bs 0`.
- **Altura Determinista en Píxeles (`PLOT_HEIGHT_PX = 220`):**
  - Área de trazado y líneas horizontales fijadas en `220px` compartiendo la base `$0`.
  - Margen superior `pt-7` reservado para que las etiquetas de monto nunca colisionen con las barras.
  - Barras con valor `$0` muestran una línea base discreta de `4px` (`bg-slate-200/80`).
  - Modo apilado utiliza `flexGrow` para llenar el 100% de la barra sin desbordamientos.
- **Fila de Fechas del Eje X Separada:** Ubicada inmediatamente debajo de la base `$0`, garantizando alineación vertical 1:1 con cada columna sin robar altura de trazado.
- **Tooltip Único Anti-Recorte con Portal (`createPortal` a `document.body`):**
  - Posicionamiento en píxeles exactos (`position: fixed`, `z-[9999]`, `pointer-events-none`) sin colisiones de `transform`.
  - Flecha indicadora dinámica que rastrea el centro exacto de la barra activa (`arrowLeft = anchorX - clampedLeft`), incluso cuando la tarjeta choca con los bordes de la pantalla.
  - Cero tooltips nativos duplicados. Auto-cierre en scroll, resize o click exterior.
- **Fechas en Español sin Desfase Horario:** Parseo local de fechas con `new Date(year, month - 1, day)` validando el día astronómico exacto.

---

## 9. Reglas Obligatorias de Compilación y Validación
- **REGLA ESTRICTA:** **NO ejecutar `npm run build`**.
- La validación del frontend se realiza exclusivamente con:
  ```powershell
  Set-Location frontend; npx tsc --noEmit; npx eslint src
  ```
  *(Debe terminar con 0 errores y 0 advertencias).*
- La validación del backend se realiza con:
  ```powershell
  python backend/tests/verify_api.py
  ```
