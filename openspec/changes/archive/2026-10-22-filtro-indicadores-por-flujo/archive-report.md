# Informe de archivo — `filtro-indicadores-por-flujo` (F1F-05, `cierra: no`)

Archivado el 2026-10-22 en la rama `filtro-indicadores-por-flujo` (worktree hermano, base `8a068fe9`), **sin fusionar a `main`**: la tanda para
antes de fusionar. Lo escribe el orquestador con cifras medidas; `apply-progress.md` y `verify-report.md` son instantáneas de su momento.

**Fila F1F-05:** cubre la consecuencia 3 de `decision/e224-indicadores-como-zoho-y-por-flujo` (`openspec/config.yaml:4946`), filtro por flujo de
cada indicador en la descarga y en la comparación; deja fuera la población «como Zoho» (consecuencia 2, `openspec/config.yaml:4944-4945`, POR
CONFIRMAR), la encuesta y la medición en paralelo del 16/11. Por eso `cierra: no`.

## 1. Qué queda construido

- **Predicado** `flujoPorClasificacion` en `packages/shared` (sólo la clasificación; no depende del estado) y `FLUJOS`; `NOMBRE_FLUJO` exportado
  en su línea (D1, D2). S-1: `flujoDelTicket` no sirve para población porque un mismo ticket cambia de flujo con su estado.
- **`GET /api/indicadores`** (json y csv) con `flujo` opcional: `400` con «El parámetro «flujo» debe ser servicio, equipo-nuevo o
  soporte-remoto» detrás del periodo; la lectura trae `classification` en la MISMA consulta (cuatro); recorte puro después de leer.
- **`POST /api/indicadores/comparacion`** con `flujo` opcional: se cruza con todos los tickets del periodo y se reparte después; cubo
  `deOtroFlujo` que gana a «fuera del periodo» y a «sólo en el fichero»; con `flujo`, la clasificación de los «ID» sin cruzar sale de
  `ticketsConClasificacion` (`apps/desk/server/db/ticketsPorId.ts:24`) en lugar de `numerosDeTickets`, con el mismo número de sentencias.
- **Sin `flujo`, las dos respuestas son byte a byte las de antes**: tres caracterizaciones con `sha256` literal, escritas antes de producción y
  comprobadas dos veces contra el código de `8a068fe9` (apply L1a y verify).
- **Cliente:** selector de flujo junto a la descarga de «Análisis» que gobierna descarga y comparación; URL y opciones en `apps/desk/src/lib`
  con prueba; los `.tsx` sólo pintan.

## 2. Spec viva

Delta sólo ADDED fusionado por script al final de `openspec/specs/kpis/spec.md` (1.277 → 1.475 líneas; RQ-KP-29 empieza en
`openspec/specs/kpis/spec.md:1279` y RQ-KP-33 en `openspec/specs/kpis/spec.md:1434`): 5 requisitos y 27 escenarios. Un solo trozo de `git diff`, añadido
tras la línea 1.277: ninguna línea de la spec viva se desplaza. Comprobación: el bloque de la spec viva y el del delta son idénticos con `diff`
(197 líneas más la de separación). Sin MODIFIED y sin filas para la tabla «0 · Procedencia y método».

**Corrección hecha al archivar (W1 del verify):** antes de fusionar se corrigieron en el delta dos frases de RQ-KP-32 que el código no
sostenía tal cual: (1) «recortar antes llevaría un ticket de otro flujo a fuera del periodo» vale sólo con el reparto sin clasificación de
RQ-KP-25; con clasificación, recortar antes sólo cambia los «ID» consultados (lo fijan las aserciones sobre los parámetros de la sentencia);
(2) la clasificación de los «ID» sin cruzar no sale de `numerosDeTickets` con una columna más, sino de su gemela `ticketsConClasificacion`,
sólo con `flujo`. El comportamiento exigido no cambia. `design.md` (D6, D7) y `verify-report.md` se archivan como se escribieron.

## 3. Mudanza

`cp -R` de la carpeta a `openspec/changes/archive/2026-10-22-filtro-indicadores-por-flujo` y `diff -r` origen/destino **vacío (salida 0)**, seis
ficheros; después `git rm -r -f` del origen (llevaba la corrección W1 sin commitear, ya copiada y comprobada). Git lo registra como seis renombrados.
`reviewGate` ausente (RDD apagado): delivery bajo la política ordinaria del repositorio.

## 4. Registro de intentos (`gentle-ai sdd-attempt`), medida = `git diff --shortstat --no-renames` + sin trackear

| # | Unidad | Base → final | Líneas | Registro |
|---|---|---|---|---|
| 1 | propuesta + spec | `8a068fe9` → `e901fb99` | 426 | 426 |
| 2 | diseño + tareas | `e901fb99` → `9caba837` | 358 | 358 |
| 3 | apply L1a (shared, lectura, GET) | `9caba837` → `e123e9d0` | 505 | 505 |
| 4 | apply L1b (POST, cruce, forma) | `e123e9d0` → `a72ea5c1` | 499 | 499 |
| 5 | apply L2 (cliente, barrido, reconciliación) | `a72ea5c1` → `5d48d739` | 274 | 274 |
| 6 | verify | `5d48d739` → `2f3ba58c` | 245 | 245 |
| 7 | archive | `2f3ba58c` → este commit | 3.013 (revisable 315: fusión 198, informe 107, delta 10) | al asentar, con la reconciliación |

Ninguno pasa de la válvula de 720 salvo el archive, cuyo techo (3.506 = 2 × 1.353 de la carpeta + 800) cubre la mudanza; su parte revisable
(fusión de 198 líneas, corrección del delta e informe) queda por debajo de 800, medida antes de aplicar (regla del archivo).

## 5. Verify y salvedades de `npm test`

Verify **PASS CON AVISOS**: 0 CRITICAL, 1 WARNING (W1, corregido al archivar, §2), 2 SUGGESTION; 5/5 requisitos, 27/27 escenarios, 44/44
tareas; validado por `gentle-ai sdd-verify-validate`. Mutaciones M1-M12 reproducidas en apply (con variantes) y seis de ellas otra vez en verify,
siempre con el mismo `sha256` del fichero antes y después.

- **Salvedad del usuario (2026-10-22):** `npm test` sale 1 sin pruebas fallidas por `[vitest-worker]: Timeout calling "onTaskUpdate"`. Se asentó
  con tres condiciones en cada pasada: 0 fallidas; sólo ese error; ficheros ≥ 316 y pruebas que sólo suben. Se cumplieron en todas.
- **Causa aislada:** las pruebas de `apps/desk/server/citas` (10 ficheros, 129 pruebas, todas en verde) provocan el error por sí solas; sin ese
  directorio la suite sale 0 (306 ficheros, 5.312 pruebas). Es un fallo previo (también en `main` en `126b5ab0`). Por decisión del usuario, el sobre
  del verify lleva la suite partida (`npx vitest run --exclude "apps/desk/server/citas/**"`, salida 0) y el informe, las ocho pasadas.
- Códigos al cerrar el archivo: `npm test` 1 con 316 ficheros, 5.441 pruebas, 0 fallidas y 1 × `onTaskUpdate` (condiciones cumplidas); sin `citas`, 0 (306/5.312); typecheck 0; lint 0 (165 avisos); build 0.

## 6. Bundle

`dist/assets/index-eZJekTNg.js`, 426.466 B (antes `index-BpbCtGfB.js`, 426.074 B): cambia en L2 por el selector y la vista.

## 7. Supuestos reversibles — a la lista semanal, bajo F1F-05

S-1 flujo por clasificación · S-2 cubo «de otro flujo» que gana a «fuera del periodo» y a «sólo en el fichero» · S-3 «sólo en Desk» y «número
distinto» sólo del flujo pedido · S-4 `flujo` vacío, repetido u otra grafía → `400` · S-5 clave `flujo` en el JSON sólo con flujo · S-6 `400` de
periodo antes que el de flujo, y en el `POST` el de flujo antes de «falta el fichero» · S-7 el selector gobierna descarga y comparación; «Todos»
no envía parámetro · S-8 rótulos desde `NOMBRE_FLUJO` · S-9 en «de otro flujo», el número del fichero · S-10 CSV
`indicadores-<flujo>-<día>.csv` · S-11 `flujo` tras `periodo` y `deOtroFlujo` tras `fueraDelPeriodo` · S-12 rótulos «Todos», «Servicio
técnico», «Equipo nuevo», «Soporte remoto».

## 8. Tareas de persona — fuera del recuento (archivar no las da por hechas)

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Confirmar qué tickets cuenta Zoho (población por defecto) | Gerencia | `decision/e224-indicadores-como-zoho-y-por-flujo` |
| P-2 | Corregir o aceptar S-1…S-12 | Gerencia | lista semanal de supuestos |
| P-3 | Probar en la app la descarga y la comparación con cada flujo | quien administra la aplicación | lista acumulada de pruebas en la app |

## 9. Para la bandeja (fuera de esta tanda; la rama no toca `docs/sdd/ENTRADA.md`)

- Las pruebas de `apps/desk/server/citas` hacen salir `npm test` con 1 por el timeout de `onTaskUpdate` (S1 del verify).
- Comentarios con cifras caducas: `packages/shared/src/flujos.ts:45` dice «los 5» y `packages/shared/src/flujos.ts:121` «los 4»; los catálogos
  tienen hoy 6 y 5 estados (D2 del diseño).
- Caso C: `openspec/changes/archive/2026-10-08-mapa-blueprint-tres-flujos/archive-report.md:100` y
  `openspec/changes/archive/2026-10-08-mapa-blueprint-tres-flujos/design.md:212` dicen que exportar `NOMBRE_FLUJO` quedó fuera; esta tanda lo exporta.
- `DEPLOY.md` no se toca: el parámetro no es un interruptor ni una variable de entorno, y no hay migración.

## 10. Qué se verá en «Análisis» (sólo administradores; P-3)

Un desplegable «Todos / Servicio técnico / Equipo nuevo / Soporte remoto» antes de «Descargar indicadores (CSV)». Con un flujo, el CSV
trae sólo esos tickets y se llama `indicadores-<flujo>-<día>.csv`; la comparación con la exportación de Zoho cuenta sólo ese flujo, añade
« · Flujo: …» al periodo y un recuento y una lista «De otro flujo». Con «Todos», todo igual que antes. Los KPI de arriba no se filtran.

Engram leído: propuesta 1799, spec 1800, diseño 1802, tareas 1803, apply-progress 1806, verify 1810.
