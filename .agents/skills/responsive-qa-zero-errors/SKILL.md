---
name: responsive-qa-zero-errors
description: Estándar estricto de ingeniería frontend para garantizar interfaces 100% responsive (de 320px a 1440px+) y cero errores de compilación, TypeScript, hidratación, consola o layout. Actívala en auditorías responsive, QA visual y corrección de bugs de UI.
---

# Responsive & Zero-Error QA Skill

## 1. Matriz de Viewports Obligatorios
Toda pantalla y componente debe funcionar sin romperse ni recortarse en estos 5 puntos:
- **Móvil pequeño:** `360px` (y tolerar `320px` sin scroll horizontal).
- **Móvil estándar:** `390px` (iPhone / Android moderno).
- **Tablet:** `768px`.
- **Laptop compacta:** `1024px`.
- **Escritorio:** `1440px+` (con contenedores centrados `max-w-*` para evitar líneas de texto interminables).

## 2. Leyes Anti-Desbordamiento (Zero Horizontal Scroll)
- **Regla de oro:** `document.documentElement.scrollWidth <= window.innerWidth` en TODOS los viewports.
- **Nunca parches con `overflow-x: hidden` en `body` sin arreglar el culpable.** Primero elimina la causa raíz (anchos fijos, textos sin quiebre, paddings excesivos, grids rígidos). Si necesitas protección extra para efectos visuales decorativos, usa `overflow-x: clip` en la sección específica (no rompe `position: sticky`).
- **Hijos Flex/Grid seguros:** Aplica `min-w-0` en contenedores hijos dentro de flex/grid que tengan texto largo, emails, códigos o URLs, combinados con `break-words` o `truncate`.
- **Anchos fluidos:** Prohibido usar anchos fijos (`w-[480px]`) sin un techo fluido (`w-full max-w-[480px]`).
- **Altura de viewport real:** Usa `min-h-dvh` / `max-h-[90dvh]` en lugar de `100vh` para evitar que la barra de direcciones móvil tape botones o corte pantallas.
- **Imágenes y SVGs:** Siempre `max-w-full h-auto` o contenedor con `aspect-*` y `object-cover`/`object-contain` para evitar distorsión y saltos de layout (CLS).

## 3. Reglas por Tipo de Componente
- **Navbar / Header:** En `< 768px` debe colapsar limpiamente a un menú móvil (drawer o panel desplegable) con cierre por botón, tecla `Escape` y clic fuera. El logo y el botón de menú nunca deben aplastarse ni saltar a dos líneas rotas.
- **Botones y objetivos táctiles:** Mínimo `44x44px` de área clickeable en móvil. Grupos de botones en fila deben usar `flex-wrap` o apilarse (`flex-col sm:flex-row w-full sm:w-auto`).
- **Formularios e Inputs:** En móvil, los `<input>`, `<select>` y `<textarea>` deben tener al menos `16px` (`text-base`) para evitar el auto-zoom forzado de Safari en iOS.
- **Modales y Drawers:** Deben usar `w-[calc(100%-2rem)] max-w-lg`, altura máxima `max-h-[90dvh]` y scroll interno (`overflow-y-auto`) para que el botón de cerrar y el CTA siempre sean accesibles en pantallas cortas.
- **Tablas y Grillas densas:** Las tablas deben vivir dentro de un contenedor `overflow-x-auto` o transformarse en cards apiladas en móvil. Las grillas de cards deben usar columnas progresivas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) o `auto-fit` con `minmax(min(100%, 260px), 1fr)`.
- **Tipografía fluida:** Los títulos hero deben escalar proporcionalmente (ej. `text-3xl sm:text-4xl lg:text-5xl` o `clamp()`) para no desbordar palabras largas en `360px`.

## 4. Puerta de Cero Errores (Obligatoria antes de responder)
No puedes dar una tarea por terminada hasta verificar y resolver:
1. **Compilación y tipos:** Ejecutar el comando de typecheck, lint y build de producción del proyecto (ej. `npm run lint`, `npx tsc --noEmit`, `npm run build`). Cero errores.
2. **Consola limpia:** Cero errores de React/framework (`hydration mismatch`, `missing key prop`, `invalid DOM nesting`, hooks condicionales, estados indefinidos).
3. **Interacciones seguras:** Revisar handlers `onClick`/`onSubmit`, estados vacíos, imágenes sin `alt` o rutas rotas, y evitar cualquier `try/catch` vacío o `@ts-ignore` / `as any` usado solo para esconder fallos.