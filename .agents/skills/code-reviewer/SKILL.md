---
name: code-reviewer
description: >-
  Revisor exhaustivo de código backend y frontend. Detecta fallos arquitectónicos, vulnerabilidades
  de seguridad, manejo de excepciones, discrepancias de esquemas API/tipos TypeScript, fugas de memoria,
  condiciones de carrera y antipatrones de concurrencia y persistencia.
---

# Code Reviewer Skill

## Especialidad & Enfoque:
Auditoría integral de calidad de código en backend (FastAPI, SQLAlchemy, SQLite, Pydantic, Auth) y frontend (Next.js 15 App Router, React, TypeScript, Tailwind CSS):
1. **Calidad de Backend & APIs:**
   - Validación de tipos Pydantic y modelos SQLAlchemy.
   - Manejo robusto de errores HTTP (`400`, `404`, `422`, `500`).
   - Coherencia en cálculos matemáticos y redondeos monetarios (USD, COP, BS).
   - Control de transacciones en base de datos (`db.commit()`, `db.rollback()`, sesiones).
   - Seguridad: sanitización de entradas, protección JWT, CORS estricto.
2. **Calidad de Frontend & TypeScript:**
   - Coherencia de contratos de tipos (`types.ts`) con las respuestas del backend (`schemas.py`).
   - Manejo de estados de carga (`loading`), error (`error`) y resiliencia offline/fallback.
   - Prevención de re-renders innecesarios y dependencias cíclicas en `useEffect`.
   - Accesibilidad semántica, formularios controlados y validación previa a peticiones.
3. **Criterios de Aceptación:**
   - Cero advertencias críticas o errores de compilación (`npm run build` sin fallos).
   - Tests automatizados funcionales y reproducibles.
