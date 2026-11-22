# Rifas Alejandro GM - Plataforma Web de Gestión de Boletos y Sorteos

Plataforma web integral para la administración, venta y control financiero de sorteos y rifas para un solo operador. Construida con arquitectura Monorepo moderna, soporte multidivisa en tiempo real (USD, COP, BS), punto de equilibrio financiero, esquemas de boletos de hasta 1,000 números, generación de comprobantes PNG en alta resolución y portal público de consulta.

---

## 🚀 Arquitectura y Tecnologías

- **Monorepo:**
  - `/backend`: API de alto rendimiento con **FastAPI**, **SQLAlchemy**, **Pydantic v2**, autenticación JWT y base de datos SQLite en memoria con inicialización de datos semilla.
  - `/frontend`: Aplicación web moderna construida con **Next.js (App Router)**, **React 18**, **Tailwind CSS**, **Lucide Icons** y **html-to-image**.
- **Sistema de Diseño e Identidad Visual (Modo Claro Fintech Premium):**
  - **Fondo Base (Canvas):** `#F4F7FA` (Gris acero ultra claro).
  - **Superficies / Cards / Modales:** `#FFFFFF` con bordes `#DCE4EE` y sombras sutiles pizarra.
  - **Superficie Secundaria:** `#EAF0F6`.
  - **Tinta Principal:** `#0B1526` (Azul marino profundo).
  - **Colores de Acento:** Azul Primario `#0369A1`, Acento Eléctrico `#0EA5E9` y Verde Esmeralda de Confianza/Ganancia `#059669`.
  - **Tipografía:** `Outfit` (display / títulos), `Plus Jakarta Sans` (interfaz y cuerpo) y `JetBrains Mono` con `tabular-nums` para finanzas y boletos.

---

## ⚡ Inicio Rápido

### 1. Iniciar el Backend (FastAPI)
```powershell
# En la raíz del proyecto
python -m pip install -r backend/requirements.txt
python backend/run.py
```
> El backend se iniciará en `http://localhost:8000` con documentación Swagger interactiva en `http://localhost:8000/docs`.
> Inicializa automáticamente datos semilla en memoria (rifa activa, boletos apartados, pagos multimoneda y tasas de cambio oficiales).

### 2. Iniciar el Frontend (Next.js)
```powershell
cd frontend
npm install
npm run dev
```
> El frontend se iniciará en `http://localhost:3000`.

---

## 🔐 Credenciales del Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`

---

## 📋 Módulos y Funcionalidades Principales

### 1. Tablero de Boletos (`/admin`)
- **Matriz visual interactiva con soporte para múltiples esquemas:**
  - `standard_100`: 100 boletos (`00` al `99`).
  - `triples_333`: 333 boletos con 3 números por boleto (`001` a `999`).
  - `pairs_500`: 500 boletos con 2 números por boleto en matriz 50 filas $\times$ 10 columnas.
- **Estados visuales:**
  - **Verde Esmeralda (`#ECFDF5` / `#059669`):** Pagado al 100%.
  - **Blanco con borde Cian (`#0EA5E9`):** Apartado con abono parcial.
  - **Blanco / Acero (`#FFFFFF` / `#DCE4EE`):** Disponible para venta.
  - **Insignia Dorada (`★`):** Boletos que desbloquearon Juegos Especiales Anticipados.
- **Filtros avanzados:** Búsqueda en tiempo real (número, cliente o teléfono), filtro por estado, filtro por antigüedad de apartado y filtro por juego especial desbloqueado.
- **Apertura directa por URL:** Soporte para `?ticket=<numero>` para abrir automáticamente el modal del boleto.

### 2. Compartir Boleto en Tiempo Real (PNG Retina + Enlace)
- Generación de comprobante digital en alta definición mediante `html-to-image` (`pixelRatio: 2`, fondo `#FFFFFF`).
- Exclusión automática de botones de acción y controles interactivos (`data-share-ignore="true"`).
- **Móvil:** Abre el menú nativo `navigator.share` adjuntando el archivo PNG y el texto con el enlace directo.
- **Escritorio:** Descarga inmediata del PNG, copia del mensaje al portapapeles y apertura de WhatsApp Web con el enlace prellenado.

### 3. Dashboard Financiero y Control de ROI (`/admin/finances`)
- **Tarjetas Multidivisa:** Recaudación separada en USD directos, Pesos (COP) y Bolívares (BS), junto con el Total Consolidado en USD.
- **Barra de Punto de Equilibrio (ROI):**
  - Pista de progreso bicolor: Azul `#0369A1` (recuperando costos) y Verde Esmeralda `#059669` (ganancia neta pura).
  - Marcador visual vertical con pin triangular y etiqueta clamped contra los bordes de la pantalla.
  - Lectura ejecutiva dinámica: boletos restantes para recuperar inversión o ganancia neta activa.
- **Gráfico de Recaudación por Período y Monedas:**
  - 4 modos de filtrado: `Todas (USD)`, `USD Directos`, `COP (Pesos)` y `BS (Bolívares)`.
  - Altura determinista en píxeles (`PLOT_HEIGHT_PX = 220`) alineada 1:1 con las líneas guía y el eje Y.
  - Barras apiladas multimoneda con `flexGrow` sin colapso.
  - Línea base discreta de 4px para días con valor `$0`.
  - Tooltip único flotante renderizado con **Portal a `document.body`** (`z-[9999]`), con centrado exacto y flecha indicadora dinámica que rastrea la barra activa.
  - Fechas en español sin desfases horarios locales ni de UTC.

### 4. Ventas del Día (`/admin/sales`)
- Selector de fecha con histórico completo de cobros.
- Resumen de transacciones del día desglosado en USD, COP y BS.
- Tabla detallada con hora, boleto, titular, teléfono, monto original, equivalente USD y notas del abono.

### 5. Portal Público de Clientes (`/consultar`)
- Acceso público sin autenticación para compradores.
- Consulta rápida por número de boleto o número de celular.
- Vista del certificado digital del boleto con sello de seguridad, abonos registrados y sorteos anticipados desbloqueados.

### 6. Módulo de Tasas de Conversión
- Modal accesible desde la barra lateral para configurar las tasas directas del operador:
  1. $\text{Bs} \times \text{Tasa} = \text{Pesos}$
  2. $\text{Bs} / \text{Tasa} = \text{Dólares}$
  3. $\text{Pesos} / \text{Tasa} = \text{Dólares}$

---

## 🧪 Pruebas y Validación de Calidad

### Regla Obligatoria
- **NO ejecutar `npm run build`** (el proyecto se valida mediante chequeos estáticos).

### Frontend (TypeScript + ESLint)
```powershell
Set-Location frontend; npx tsc --noEmit; npx eslint src
```
*(Debe reportar 0 errores y 0 advertencias).*

### Backend (Python Test Suite)
```powershell
python backend/tests/verify_api.py
```
