---
name: frontend-design-skill
description: >-
  Especialista en diseño visual frontend, sistemas de diseño de alta gama, micro-interacciones,
  consistencia visual, ergonomía UI/UX en modo oscuro sólido (sin degradados), alineación milimétrica,
  border-radius uniforme y tipografía deportiva/automotriz para Rifas Alejandro GM.
---

# Frontend Design Skill

## Especialidad & Enfoque:
Auditoría y ejecución de diseño visual para interfaces web modernas, priorizando:
1. **Regla de Cero Degradados:**
   - Todo fondo, contenedor, tarjeta, botón e insignia debe emplear colores sólidos de alto contraste.
   - Prohibido `linear-gradient` o fondos degradados.
2. **Consistencia Geométrica y Border Radius:**
   - Uniformidad en curvas de esquinas (`rounded-lg` para contenedores/modales/paneles, `rounded` para botones/inputs, `rounded-full` para badges circulares).
   - Ningún contenedor o elemento interactivo debe quedar con esquinas rectas (`rounded-none`) salvo diseño intencional.
3. **Alineación y Centrado Milimétrico:**
   - Todos los pares icono + texto deben tener `flex items-center gap-*` con alineación vertical perfecta.
   - Textos de números, estados y montos centrados ópticamente.
4. **Ergonomía en Modo Oscuro Sólido:**
   - Paleta oficial: Fondo `#05070A`, Tarjetas `#12161F`, Hover `#1E2430`, Acento Verde `#1EE868`, Acento Cian `#00D4FF`, Oro/Ámbar `#EAB308`.
   - Contrastes WCAG AAA para legibilidad sin fatiga.
5. **Responsividad Móvil y Touch-First:**
   - Tablero de boletos navegable fluidamente en pantallas pequeñas.
   - Modales adaptados con scroll táctil sin desbordamientos horizontales.
