# Diseño de Base de Datos — Rifas Alejandro GM

> Motor: **SQLite** (file-based `rifas.db` en desarrollo, configurable vía `DATABASE_URL`)  
> ORM: **SQLAlchemy 2.x** con `declarative_base`

---

## Tablas

### `users`
Almacena las cuentas de administrador del sistema.

| Columna         | Tipo           | Restricciones                   | Descripción                       |
|-----------------|----------------|---------------------------------|-----------------------------------|
| `id`            | INTEGER        | PK, autoincrement, index        | Identificador único               |
| `username`      | VARCHAR(50)    | NOT NULL, UNIQUE, index         | Nombre de usuario                 |
| `password_hash` | VARCHAR(255)   | NOT NULL                        | Hash bcrypt de la contraseña      |
| `is_admin`      | BOOLEAN        | DEFAULT TRUE                    | Rol de administrador              |
| `created_at`    | DATETIME       | DEFAULT utcnow()                | Fecha de creación (UTC)           |

---

### `exchange_rates`
Tasas de cambio entre monedas (una sola fila activa).

| Columna          | Tipo    | Restricciones  | Descripción                                    |
|------------------|---------|----------------|------------------------------------------------|
| `id`             | INTEGER | PK             | Identificador único                            |
| `rate_bs_to_cop` | FLOAT   | NOT NULL       | Bs × Tasa = Pesos COP                         |
| `rate_bs_to_usd` | FLOAT   | NOT NULL       | Bs ÷ Tasa = Dólares USD                       |
| `rate_cop_to_usd`| FLOAT   | NOT NULL       | COP ÷ Tasa = Dólares USD                     |
| `cop_per_usd`    | FLOAT   | NOT NULL       | Pesos colombianos por 1 USD (alias)           |
| `bs_per_usd`     | FLOAT   | NOT NULL       | Bolívares por 1 USD (alias)                   |
| `updated_at`     | DATETIME|                | Última actualización (onupdate UTC)           |

---

### `raffles`
Rifas creadas en el sistema. Cada rifa tiene sus propios boletos.

| Columna                   | Tipo         | Restricciones       | Descripción                                            |
|---------------------------|--------------|---------------------|--------------------------------------------------------|
| `id`                      | INTEGER      | PK, autoincrement   | Identificador único                                   |
| `title`                   | VARCHAR(120) | NOT NULL            | Título del sorteo                                     |
| `description`             | TEXT         | NULLABLE            | Descripción y premios                                 |
| `total_numbers`           | INTEGER      | NOT NULL, DEFAULT 100| Total de números/boletos                             |
| `scheme`                  | VARCHAR(50)  | DEFAULT 'standard_100'| Esquema: `standard_100`, `triples_333`, `pairs_500` |
| `ticket_price_usd`        | FLOAT        | NOT NULL            | Precio del boleto en USD                              |
| `total_investment_usd`    | FLOAT        | NOT NULL            | Inversión total del organizador en USD               |
| `min_abono_juego_especial`| FLOAT        | NOT NULL            | Abono mínimo para participar en juegos especiales    |
| `special_games_json`      | TEXT         | NULLABLE            | JSON: lista de juegos especiales (ver abajo)         |
| `status`                  | VARCHAR(20)  | DEFAULT 'active'    | Estado: `active`, `completed`, `archived`            |
| `created_at`              | DATETIME     | DEFAULT utcnow()    | Fecha de creación (UTC)                              |

**Formato de `special_games_json`:**
```json
[
  {
    "id": 1,
    "name": "Sorteo Anticipado 1 - Tanque Lleno",
    "min_amount": 3.0,
    "draw_date": "2026-12-15",
    "drawDate": "2026-12-15"
  }
]
```

**Esquemas de boletos (`scheme`):**
- `standard_100`: 100 boletos (00–99), 1 número por boleto
- `triples_333`: 333 boletos (001–333), 3 números por boleto (cubre 001–999 sin el 000)
- `pairs_500`: 500 boletos (000–499), 2 números por boleto (matriz 50×10, cubre 000–999)

---

### `tickets`
Boletos individuales pertenecientes a una rifa.

| Columna            | Tipo         | Restricciones              | Descripción                                       |
|--------------------|--------------|----------------------------|---------------------------------------------------|
| `id`               | INTEGER      | PK, autoincrement          | Identificador único                              |
| `raffle_id`        | INTEGER      | FK → raffles.id, NOT NULL  | Rifa a la que pertenece                          |
| `ticket_number`    | VARCHAR(20)  | NOT NULL, index            | Número del boleto (ej: "001", "47")              |
| `numbers_json`     | TEXT         | NULLABLE                   | JSON: lista de números asignados al boleto       |
| `customer_name`    | VARCHAR(100) | NULLABLE                   | Nombre del comprador                             |
| `customer_phone`   | VARCHAR(50)  | NULLABLE, index            | Teléfono del comprador                           |
| `customer_address` | VARCHAR(200) | NULLABLE                   | Dirección del comprador                          |
| `status`           | VARCHAR(20)  | DEFAULT 'available'        | Estado: `available`, `reserved`, `paid`          |
| `reserved_at`      | DATETIME     | NULLABLE                   | Fecha en que fue apartado (UTC)                  |
| `total_paid_usd`   | FLOAT        | DEFAULT 0.0                | Total acumulado pagado en equivalente USD        |

**Estado de boleto (`status`):**
- `available` → libre, sin asignar
- `reserved` → apartado, pago parcial registrado
- `paid` → pago completo (`total_paid_usd >= ticket_price_usd`)

---

### `payments`
Abonos o pagos individuales registrados para un boleto.

| Columna                 | Tipo         | Restricciones             | Descripción                                         |
|-------------------------|--------------|---------------------------|-----------------------------------------------------|
| `id`                    | INTEGER      | PK, autoincrement         | Identificador único                                |
| `ticket_id`             | INTEGER      | FK → tickets.id, NOT NULL | Boleto al que corresponde el pago                  |
| `amount`                | FLOAT        | NOT NULL                  | Monto en la moneda original                        |
| `currency`              | VARCHAR(10)  | NOT NULL                  | Moneda: `USD`, `COP`, `BS`                         |
| `exchange_rate_applied` | FLOAT        | NOT NULL, DEFAULT 1.0     | Tasa de cambio usada al momento del pago           |
| `amount_usd_equivalent` | FLOAT        | NOT NULL                  | Equivalente en USD al momento del pago             |
| `payment_date`          | DATETIME     | DEFAULT utcnow()          | Fecha/hora del pago (UTC)                          |
| `notes`                 | VARCHAR(255) | NULLABLE                  | Notas opcionales del administrador                 |

---

## Relaciones

```
users (n/a — sin relación directa)

exchange_rates (tabla singleton — 1 fila activa)

raffles ──< tickets ──< payments
   1              n           n
```

| Relación             | Tipo      | Cascade                    |
|----------------------|-----------|----------------------------|
| `Raffle → Ticket`    | 1 → N     | `all, delete-orphan`       |
| `Ticket → Payment`   | 1 → N     | `all, delete-orphan`       |

---

## Fórmulas de Conversión de Monedas

| Desde → Hasta | Fórmula                                |
|---------------|----------------------------------------|
| COP → USD     | `amount_cop / rate_cop_to_usd`        |
| BS → USD      | `amount_bs / rate_bs_to_usd`          |
| BS → COP      | `amount_bs * rate_bs_to_cop`          |

---

## Migraciones en SQLite

El sistema aplica migraciones en caliente durante el startup (`lifespan`):
- Agrega columna `scheme` a `raffles` si no existe
- Agrega columna `numbers_json` a `tickets` si no existe

---

## Seed Inicial

Al iniciar el servidor por primera vez (tabla `raffles` vacía):
1. Crea usuario `admin` con contraseña hasheada (bcrypt)
2. Crea registro de tasas de cambio por defecto
3. Crea rifa semilla con 100 boletos (8 con clientes demo, 92 disponibles)
