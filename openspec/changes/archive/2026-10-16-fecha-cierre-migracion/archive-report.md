# Informe de archivo — `fecha-cierre-migracion` (F1F-01, `cierra: no`)

Archivado el 2026-10-16 en la rama `fecha-cierre-migracion` (worktree hermano, regla del ciclo 3), sin fusionar a `main`.
Escrito por el orquestador con cifras medidas, no por el agente de archivo.

## Qué parte de la fila cubre

Construye el contenido que `decision/migracion-e207-e212` (E-207) abre en F1F-01: «Entregado» pasa a «Finalizado» y queda
cerrado con la fecha de cierre de Zoho o, si no la tiene, con la de la migración, marcada como tal. **F1F-01 no termina:**
quedan el suplente del 12/12 (`DEPLOY.md:693`) y la pasada en seco en producción (E-211), las dos de personas (P-1 y P-2).

## Qué quedó construido

- **`packages/shared/src/migracionTickets.ts`** (regla 13, la regla vive en `shared`): `cierreDeMigracion(eq, closedTimeZoho,
  instante)` devuelve `null` si la regla no cierra, la fecha de Zoho con `origen: 'zoho'` si la hay y, si no, el instante con
  `origen: 'migracion'`; `cierresDeMigracion(planes)` cuenta las dos ramas. Las dos van al final del fichero; el campo
  `closedTime?` entra en la misma línea 48. Ninguna línea citada se movió.
- **`apps/desk/server/db/migracionTicketsAbiertos.ts`:** lee `closed_time`, escribe `closed_time` en el `UPDATE` sólo para la
  regla que cierra, y deja en el `values` del marcador `closed_time_previo`, `closed_time_destino` y `cierre_origen`. El instante
  es uno por ejecución (`opts.ahora ?? new Date()`). El informe, en seco y al aplicar, trae `cierres: { conFechaDeZoho,
  conFechaDeMigracion }`. Diez líneas editadas en sitio, 106 → 106.
- **`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`:** la reversión de `entregado-a-finalizado` restaura `closed_time` desde
  `closed_time_previo` (línea 76); las líneas 14 y 65 se corrigen en sitio. 95 → 95.
- **Sin esquema nuevo ni migración de datos:** la marca vive en el marcador que ya existía. Sin `ALTER`, sin variable de entorno,
  sin cambio en `DEPLOY.md`. Sin cambio de cliente: el bundle sigue siendo `index-t1QFmlpr.js`.

## Fusión del delta (por script, bloque a bloque)

| Spec | Bloque | Operación | Resultado |
|---|---|---|---|
| `tickets-core` (3.843 → 3.915) | RQ-TC-40 | sustituido conservando la cabecera viva | idéntico al delta; los 11 escenarios vivos más uno nuevo |
| `tickets-core` | RQ-TC-64 | añadido al final | idéntico al delta; 5 escenarios |
| `zoho-sync` (1.450 → 1.519) | RQ-ZS-17 | sustituido conservando la cabecera viva | idéntico al delta; los 24 escenarios vivos más 5 |
| `zoho-sync` | RQ-ZS-18 | sustituido conservando la cabecera viva | idéntico al delta; 10 escenarios (el de «no toca `closed_time`» pasa a cuatro) |

El delta de `tickets-core` que entregó la fase de spec había perdido dos escenarios vivos de RQ-TC-40; se repusieron
literalmente antes del commit de planificación, y los títulos se contrastaron por `diff` con la spec viva. No hay capacidad
nueva (R-2). El título de RQ-ZS-18 («los tres valores previos») se conserva porque es la clave de fusión; queda inexacto.

**Regla 4.** Las primeras 2.095 líneas de `tickets-core` y las primeras 811 de `zoho-sync` conservan su número. Las 21 citas
por línea a partir de ahí se revisaron una por una: siete ya llevaban ancla; once se anclaron en `164d322` y tres de
`rechazo-migracion-409` en `a1fb802`, porque en `164d322` ya no decían lo que afirman (`37ba0b4`, commit propio). En `main`
(`CLAUDE.md`, `ENTRADA.md`, `config.yaml`, `DEPLOY.md` y los ficheros de Supervisión) no hay ninguna.

## Registro de intentos

| Intento | Contenido | Líneas registradas |
|---|---|---|
| 1 | propuesta | 117 |
| 2 | spec delta y diseño | 691 |
| 3 | tareas | 98 |
| 4 | apply (lotes 1 a 3) | 302 |
| 5 | verify | 75 |
| 6 | este archivo | abierto con techo 2.832 (2 × 1.016 + 800) |

Cada cifra coincidió con `git diff --shortstat --no-renames` contra el commit de partida del intento. **El intento 2 se partió:**
con las tareas dentro midió 789, sobre la válvula de 720; las tareas salieron al intento 3. No hay ficheros binarios.

## Medida de este archivo (regla del archivo)

Parte con carga de revisión, medida antes de aplicar en una copia de ensayo: fusión del delta, 177 (159 + 18), y este informe.
Bajo 800. Las 14 anclas (`37ba0b4`, +13 −13) van en commit propio. La mudanza de la carpeta no tiene carga de revisión.

## Mutaciones (reglas 1 y 2)

No se añade guarda nueva, así que la mutación de posición de la regla 1 no aplica; se mutó la precedencia y el filtro.
Reproducidas por el orquestador o por el verify, cada una restaurada con `cmp`:

- invertir la precedencia Zoho/migración: 7 pruebas en rojo;
- quitar el filtro «sólo la regla que cierra»: 5 en rojo;
- regla 2, ensuciando el fichero vigilado: quitar la restauración de `closed_time` de la línea 76 del `.sql` deja 4 en rojo, y
  moverla a la 81 deja 5.

## Cierre: los cinco códigos

Sobre `502d239` (punta antes del archivo): `npm test` 0 (4.711 pruebas pasan, 11 se omiten), `npm run typecheck` 0,
`npm run lint` 0 (165 avisos, la misma línea base), `npm run build` 0 (`index-t1QFmlpr.js`), detector `--sha HEAD` 0. Verify:
PASS WITH WARNINGS, 0 CRITICAL, 4 WARNING, 3 SUGGESTION. Una incidencia: la primera corrida del detector en el intento 5 salió
con 1 por una cita del propio informe de verify (cuatro números en una cita); se ancló en `11acceb` antes de asentar.

## Supuestos reversibles — plazo de corrección: una semana desde su publicación

S-1 la fecha de la migración es el instante de la ejecución con `aplicar=true`, uno para todos (alternativa: el `corte`) ·
S-2 la marca vive sólo en el marcador y no se ve en la interfaz · S-3 la fecha de Zoho se conserva tal cual · S-4 sólo la regla
que cierra toca `closed_time` · S-5 `closedTime` entra en `TicketParaMigrar` en la misma línea 48.

## Tareas de persona — fuera del recuento; archivar no las da por hechas

| Id | Qué | Dueño |
|---|---|---|
| P-1 | Pasada en seco en producción (E-211) y lectura de `cierres` antes de aplicar | superadministrador, con Gerencia |
| P-2 | Nombrar al suplente del 12/12 (`DEPLOY.md:693`) | Gerencia |
| P-3 | H-1: ¿se excluyen de Análisis (`apps/desk/server/analisis.ts:26`) y del «Tiempo promedio de operación» de la ficha de cliente (`apps/desk/src/components/ClienteDetalle.tsx:124-126`) los cierres con `cierre_origen: 'migracion'`? | Gerencia |

## Para Supervisión (ficheros que esta rama no toca)

- `openspec/config.yaml:4749` y `:4759` en `164d322` (`decision/migracion-e207-e212`) dicen que la migración no escribe
  `closed_time`: desde `6444b92` lo escribe. Caso C: conservar con su revisión y añadir qué lo cerró.
- La entrada de bandeja de H-1 (P-3) la registra Supervisión.

## Qué verá Alfonso tras la migración

En la pasada en seco, un recuento nuevo: cuántos «Entregado» cerrarán con la fecha de Zoho y cuántos con la de la migración. Tras
aplicar, cada «Entregado» aparece como «Finalizado» y cerrado, en la vista «cerrados» del tablero (`apps/desk/src/lib/boardView.ts:41`). Su fecha de cierre es la de
Zoho o, si no la había, el momento de la migración, igual para todos. Desde la interfaz no se distingue cuál de las dos lleva:
la marca sólo se lee en la base. Mientras Gerencia no responda a H-1, esos tickets entrarán en los finalizados de Análisis y en el
«Tiempo promedio de operación» del cliente con la fecha de la migración si no tienen «Fecha Finalización ST». Los indicadores de
F1F-05 no cambian: leen «Fecha Finalización ST», no `closed_time`.
