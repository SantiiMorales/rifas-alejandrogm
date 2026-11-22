---
name: data-viz-motion-ux
description: Estándar de visualización de datos financieros (dashboards, barras de ROI/punto de equilibrio, gráficos de barras multi-moneda) y micro-interacciones UI/UX profesionales estilo fintech con animaciones fluidas y accesibles.
---

# Data Visualization & Motion UX Skill

## 1. Estándar de Gráficos Financieros (Fintech Precision)
- **Cero ruido visual:** Usa líneas horizontales de grilla ultra sutiles (`#E2E8F0` con `strokeDasharray="3 3"`), oculta líneas de ejes innecesarias y deja aire alrededor de las barras.
- **Números siempre alineados:** Todos los KPIs, ejes, tooltips y leyendas monetarias deben usar `font-mono tabular-nums` y formateo real con `Intl.NumberFormat` (compacto en eje Y si el número es grande, ej. `42k` / `1.2M`, y exacto dentro del tooltip).
- **Tooltips personalizados (nunca el tooltip crudo por defecto):** Fondo blanco `#FFFFFF` o marino `#0B1526`, borde definido, sombra limpia, fecha completa en español, monto exacto formateado y desglose útil (ej. cantidad de pagos o boletos ese día).
- **Fechas seguras sin desfase horario:** Nunca hagas `new Date("YYYY-MM-DD")` directamente para mostrar días (en UTC-4/UTC-5 resta un día). Parsea `year, month - 1, day` en hora local y formatea en español (`es-ES` / `es-VE`).
- **Marcadores en barras de progreso (Break-even / Metas):** Toda marca vertical sobre una barra debe clamping su etiqueta para no salirse por los bordes en pantallas de `360px` (alinear a la izquierda si `< 15%`, centrado entre `15%–85%`, a la derecha si `> 85%`), y manejar los casos extremos (`meta = 0`, `recaudado = 0` o `meta >= máximo`).

## 2. Sistema de Animaciones y Micro-interacciones (`taste`)
- **Velocidad ejecutiva:** Hovers en `150ms–200ms`, cambios de estado/tabs en `220ms–260ms`, entradas de secciones/barras en `300ms–450ms` con curva suave `cubic-bezier(0.22, 1, 0.36, 1)`. Prohibido usar rebotes exagerados o animaciones lentas (`> 600ms`).
- **Solo propiedades GPU:** Anima únicamente `transform`, `opacity`, `background-color`, `border-color` y `box-shadow`. Nunca animes `width`/`height` si causa layout thrashing (excepto barras de progreso con `transition-all duration-500 ease-out` o `scaleX`).
- **Interacción tangible:**
  - Cards interactivas: `hover:-translate-y-0.5 hover:shadow-md hover:border-[#0369A1]/30 transition-all duration-200`.
  - Botones y controles segmentados: feedback táctil `active:scale-[0.98]`, foco visible con anillo `#0EA5E9`.
  - Gráficos interactivos: al pasar el cursor sobre una barra, resalta la barra activa y atenúa sutilmente las demás para guiar la vista.
- **Accesibilidad obligatoria:** Respeta siempre `prefers-reduced-motion` (`motion-reduce:transition-none motion-reduce:animate-none`).
- **Ligero por defecto:** Prefiere transiciones CSS/Tailwind + animaciones nativas de la librería de gráficos ya instalada; no instales librerías pesadas de animación innecesarias salvo que ya existan en `package.json`.