# Archive · `cierre-f1b08-con-lo-construido` (F1B-08, `cierra: si`)

**Fecha:** 2026-10-17 · **Rama:** `cierre-f1b08-con-lo-construido` · **Partida:** `6b2f7c1` · **Informe escrito por el
orquestador**, con cifras medidas por él; no lo generó el agente de archivo.

**Qué cubrió la fila F1B-08 y qué pasó a F1F-03, en una línea:** cubrió el tablero (vista «todos», esperas, columnas de
`Verificación` y `Solicitud Soporte`), las tres alarmas en horas hábiles y la búsqueda por número de ticket y serial; la
paridad de vistas con Zoho Desk se cierra con lo construido y lo que falte pasa a F1F-03, que cada persona anota y se
corrige antes del 09/12 (`decision/f1b08-cierre-sin-capturas`).

## Qué decisión registra

`decision/f1b08-cierre-sin-capturas` (Gerencia, 2026-10-17; `openspec/config.yaml` → `decisiones_de_gerencia_adenda`)
dejó F1B-08 terminada en contenido pero sin registrar en el avance. Este cambio es la vía «por archivo» de las dos que esa
decisión nombró: no amplía RQ-RC-10 ni añade nada a `cierres_declarados_por_commit`.

## Qué quedó hecho

- Medida de la fila, de los cinco cambios archivados con `tanda: F1B-08` (todos `cierra: no`) y de sus cuatro decisiones
  de respaldo: `proposal.md`, secciones «Qué cubrió cada cambio archivado» y «Las cuatro decisiones de respaldo».
- Rojo visto antes de corregir: con la carpeta en `archive/`, `apps/desk/server/reconciliacion/registro.test.ts` dio
  1 fallo de 23, la prueba 11f/05g, y la única diferencia era `"F1B-08"` en «en curso». Corregida en sitio (líneas 218 y
  220, el fichero sigue en 248 líneas): 23 de 23.
- `docs/sdd/RECONCILIACION.md` regenerado sobre el commit de archivo: F1B-08 pasa a «cerradas por archivo».
- **Sin código de producción, sin `openspec/specs/`, sin migración, sin cambio de bundle.**

## Intentos del registro

| Intento | Commit | Medida (`git diff --shortstat --no-renames`) | Registro |
|---|---|---|---|
| Planificación | `54887b0` | 146 (+146) | 146 |
| Verify | `2f611c5` | 43 (+40 −3) | 43 |
| Archive | este commit y el de la reconciliación | se mide al cerrar el intento | — |

## Supuestos reversibles — plazo de corrección: una semana desde que se publique

S-1 `maestro:` lleva los pasajes de la fila en la R01.1 (los ítems 17 y 22 valen como procedencia) · S-2
`capacidad: [reconciliacion]` · S-3 no se corrige `openspec/specs/reconciliacion/spec.md:347`, que dice «seis» en curso con
la lista del 01/10. Cómo se revierte cada uno: `proposal.md`, «Supuestos reversibles».

## Para Supervisión — no se editan en la rama

- **E-198** (`docs/sdd/ENTRADA.md:1988`) dice que su respuesta desbloquea «un cambio posterior dentro de F1B-08»: con la
  fila cerrada ese destino deja de existir y hay que situarlo (regla de `CLAUDE.md`: un destino es una promesa).
- La fila del plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:88`) sigue diciendo «en curso».
- `decision/f1b08-cierre-sin-capturas` lleva en `tanda_que_abre` «pendiente: vía de registro del cierre de F1B-08», que
  este cambio resuelve.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño |
|---|---|---|
| P-1 | Anotar en F1F-03 cada vista, columna o filtro de Zoho Desk que falte; corregirlo antes del 09/12 | Cada persona que usa Zoho Desk |
| P-2 | Situar el destino de E-198 | Gerencia, por Supervisión |
| P-3 | Revisar S-1 a S-3 en la lista semanal (E-237) | Gerencia |
