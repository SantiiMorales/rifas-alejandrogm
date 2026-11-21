# Rifas Alejandro GM - Sistema Web de Gestión de Boletos

Sistema integral para la administración, venta y control financiero de rifas para un solo operador, con arquitectura Monorepo moderna, soporte multidivisa en tiempo real (USD, COP, BS), punto de equilibrio y portal público de verificación de boletos.

---

## 🚀 Arquitectura y Tecnologías

- **Monorepo**:
  - `/backend`: FastAPI, SQLAlchemy, SQLite (modo en memoria con seed inicial), JWT Auth, Pydantic v2.
  - `/frontend`: Next.js 15 (App Router), React 18, Tailwind CSS, Lucide Icons.
- **Identidad Visual**:
  - **Dark Mode Obligatorio**: Fondo Negro Abismo (`#05070A`), Superficies Carbón Cepillado (`#12161F`), Interactivas Acero Oscuro (`#1E2430`).
  - **Acentos Neón**: Verde Neón Eléctrico (`#1EE868`), Cian Cibernético (`#00D4FF`), Azul Eléctrico (`#0077E6`).
  - **Tipografía**: Slab Serif pesada para "RIFAS" y Sans-Serif condensada robusta para "ALEJANDRO GM".

---

## ⚡ Inicio Rápido

### 1. Iniciar el Backend (FastAPI)
```powershell
# En la raíz del proyecto
python -m pip install -r backend/requirements.txt
python backend/run.py
```
> El backend iniciará en `http://localhost:8000` con documentación interactiva Swagger en `http://localhost:8000/docs`.
> Por defecto opera en memoria e inicializa automáticamente los datos semilla (rifa activa de 100 números, boletos apartados, pagos multimoneda y tasas de cambio).

### 2. Iniciar el Frontend (Next.js)
```powershell
cd frontend
npm run dev
```
> El frontend iniciará en `http://localhost:3000`.

---

## 🔐 Credenciales del Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`

---

## 📋 Funcionalidades Principales

1. **Tablero Principal de Boletos (`/admin`):**
   - Matriz visual interactiva con los números de la rifa en curso (100, 500 o 1,000 números).
   - Colores por estado:
     - **Verde Neón:** Pagado al 100%.
     - **Cian Cibernético:** Apartado con pago parcial (muestra monto abonado y barra de progreso).
     - **Gris Carbón:** Disponible para venta inmediata.
     - **Insignia Dorada (★):** Boletos que califican para Sorteos Especiales Anticipados.
   - Buscador en tiempo real por número de boleto, nombre del cliente o teléfono.
   - Filtros por estado y fecha de apartado (*apartadas hoy, últimos 3 días, última semana o más de 1 semana*).
   - Botón para **Crear Nueva Rifa** con proyección automática de break-even y ganancia.

2. **Ficha y Tarjeta de Boleto:**
   - Visualización individual con datos del titular (nombre, celular, dirección).
   - Registro de abonos personalizados donde el administrador fija el monto y la divisa (USD, COP, BS).
   - Botón de liquidación rápida del 100% restante.
   - Historial cronológico con fechas de cada abono y tasa aplicada.
   - Botón para copiar comprobante y enlace directo para enviar al cliente por WhatsApp.

3. **Panel de Finanzas y Retorno de Inversión (`/admin/finances`):**
   - Recaudación desglosada por moneda: Dólares directos (USD), Pesos (COP) y Bolívares (BS).
   - Total global equivalente en USD calculado en tiempo real.
   - **Termómetro de Inversión / Break-Even:**
     - Inversión total a recuperar vs Recaudado.
     - Monto faltante para alcanzar el punto de equilibrio.
     - Profit neto acumulado una vez superada la inversión.
   - **Gráfico de Barras Multimoneda:**
     - Filtro por periodo: últimos 7 días o últimas 6 semanas.

4. **Ventas del Día (`/admin/sales`):**
   - Selector de fecha con histórico de transacciones.
   - Resumen del día con totales en USD, COP y BS.
   - Tabla cronológica detallada con cliente, teléfono, boleto y método/nota.

5. **Portal Público de Consulta (`/consultar`):**
   - Diseñado para los compradores. No requiere autenticación.
   - Permite consultar por número de boleto o número de celular.
   - Muestra el certificado digital con sello de seguridad y transparencia, abonos registrados y participación en sorteos anticipados.

6. **Módulo de Tasas de Cambio:**
   - Configuración en un clic desde la barra superior de 1 USD a COP y 1 USD a BS con cálculo automático de tasas cruzadas.

---

## 🧪 Verificación y Pruebas Automatizadas
Para ejecutar la suite de pruebas del backend:
```powershell
python backend/tests/verify_api.py
```
