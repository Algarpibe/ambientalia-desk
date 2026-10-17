# Archive · `medicion-garantias-por-marca` (F1B-13, `cierra: no`)

**Fecha:** 2026-10-17 · **Rama:** `medicion-garantias-por-marca` · **Partida:** `ea9cb82` · **Informe escrito por el orquestador**,
con cifras medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-13 cubre, en una línea:** las dos mediciones que `decision/anexo-7-garantia-proveedor` pide —el valor
recuperado frente al reclamado por marca y las piezas con fallas repetidas—, calculadas en `shared`, servidas por un `GET` con sesión y
pintadas en una vista de sólo lectura; **deja fuera** el valor reclamado tomado del costo de la OVI (sigue a mano), el envío físico por
remisión sin ticket (depende de F1B-16) y la carga de las fallas repetidas en la taxonomía ISO 14224 (`decision/anexo-56-taxonomia`,
otra fila), así que la fila NO se cierra.

## Qué decisión construye

`decision/anexo-7-garantia-proveedor` (Gerencia, 2026-09-24; `openspec/config.yaml` → `decisiones_de_gerencia`): «Se miden el valor
recuperado frente al reclamado por marca y las piezas con fallas repetidas, que alimentan la taxonomía ISO 14224». Pasaje del maestro:
Anexo D nº 7. Sobre la ficha que construyó `ficha-garantia-proveedor` (archivada el 2026-10-06).

## Qué quedó construido

- Regla pura `medirGarantias` en `packages/shared/src/medicionGarantias.ts`, exportada con una línea al final de
  `packages/shared/src/index.ts`. Sólo fichas «sí» (`:54`); lo reclamado suma en cualquier estado y lo recuperado sólo en las resueltas
  (`:69-76`), así que **una rechazada cuenta como reclamada con 0 recuperado y una abierta o enviada no cuenta como recuperada**; las
  fichas sin valor reclamado se cuentan aparte (`:69`); cociente `null` si lo reclamado no es mayor que 0 (`:80`). Fallas repetidas
  con `UMBRAL_FALLA_REPETIDA = 2` (`:10`) sobre fabricante y referencia normalizados (`claveMedicion`, `:13-15`).
- Lectura `fichasReclamadas` al final de `apps/desk/server/db/garantiaProveedor.ts` (`WHERE reclama = true ORDER BY id`) y ruta
  `GET /api/medicion-garantia-proveedor` en `apps/desk/server/routes/garantiaProveedor.ts`, con `requireAuth` como única guarda: el
  mismo permiso que la lectura de la ficha. Devuelve el resultado de `shared` sin recalcular.
- Cliente: `apps/desk/src/components/MedicionGarantias.tsx` (sólo pinta: sin sumas, filtros, órdenes ni divisiones; sin umbrales ni
  colores) y el botón «Garantías» en el menú de usuario de `apps/desk/src/components/Header.tsx`, junto al de Equipos, con el modal en
  un portal. `apps/desk/src/api/client.ts` gana `getMedicionGarantias`.
- **Sin migración** (lee la tabla `public.garantia_proveedor` que ya existe), sin interruptor y sin variables de entorno.
  **Cambia el bundle del cliente:** el build de la rama da `assets/index-BNJMbWTa.js`, frente a `index-t1QFmlpr.js` de `main`.

## Specs fusionadas (fusión por script, comprobada bloque a bloque)

| Spec | Requisitos | Cómo | Comprobación |
|---|---|---|---|
| `tickets-core` (3.915 → 4.130) | RQ-TC-65, -66, -67 y -68 | ADDED, añadidos al final tras RQ-TC-64 | `diff` del bloque de la delta con la cola de la spec viva: idénticos; 25 escenarios en los dos |

Antes de fusionar, el orquestador corrigió en la delta los títulos `### RQ-TC-6x` a `### Requirement: RQ-TC-6x`, que es la forma de
la spec viva. No hay capacidad nueva (R-2 no aplica). La fusión sólo añade al final: no desplaza ninguna cita a la spec viva.

## Medida por intento (`git diff --shortstat --no-renames` contra la partida de cada uno; todo trackeado)

| # | Unidad | Commit | Líneas |
|---|---|---|---|
| 1 | Propuesta | `1a55c3a` | 130 |
| 2 | Spec delta y diseño | `bb036a7` | 381 |
| 3 | Tareas | `1ec76ce` | 94 |
| 4 | Apply, lote 1 (`shared`) | `6276080` | 366 |
| 5 | Apply, lote 2 (servidor y cliente) y cierre | `39de1d7`, `fbc9da3` | 387 |
| 6 | Verify | `399ef4f` | 93 |

Ninguno superó la válvula de 720. La parte revisable del archive —la fusión (+215) y este informe— se midió antes de mudar la carpeta
y queda bajo 800 (regla del archivo).

## Pruebas, mutaciones y regla 13

- Rojo previo en los dos lotes (`apply-progress.md`). Suite: 4.739 pruebas en verde; `typecheck`, `lint` (0 errores, 165 avisos de
  base) y `build` en 0; detector de citas en 0.
- Mutaciones M-1a a M-8, todas rojas (tabla en `apply-progress.md`). Reproducidas además por el orquestador M-7 (sin `requireAuth`
  → «sin cookie da 401») y M-1b (sin `WHERE reclama = true` → «fichasReclamadas no devuelve el «no» sembrado»), y por el verify
  M-2, M-3, M-5 y M-8. Regla 1: la ruta tiene una sola guarda, sin par que ordenar. Regla 2: no aplica, ninguna guarda lee un fichero
  de datos. Regla 3: tabla C-1 a C-8 en `apply-progress.md`, rehecha por el verify contra el código.
- Verify: **PASS**, 0 críticos, 0 avisos, 2 sugerencias (la ausencia de ventana se cumple por construcción y no por una prueba; la
  prueba del 401 no demuestra por sí sola que no se consulten las fichas).

## Citas (regla de mutación 4)

El botón y el `lazy` de `Header.tsx` desplazan sus líneas. Cinco citas archivadas a `Header.tsx` (`:146` en
`archive/2026-09-30-permisos-por-cargo/apply-progress.md:122` y `verify-report.md:106`; `:90` en
`archive/2026-10-03-continuidad-indicadores/design.md:235`, `exploration.md:61` y `proposal.md:162`) afirmaban algo cierto antes del
cambio: caso B, ancladas en `ea9cb82`, sin renumerar. Las citas del propio diseño a líneas previas se anclan igual o se reapuntan
(caso A, `design.md:69`). `routes/garantiaProveedor.ts`, `db/garantiaProveedor.ts` e `index.ts` sólo crecen al final o editan en sitio.

## Supuestos reversibles — plazo de corrección: una semana desde que se publique

S-1 «por marca» es por el `fabricante` de la ficha, recortado y sin mayúsculas, sin plegar acentos · S-2 falla repetida: misma
referencia del mismo fabricante en 2 o más fichas «sí», cualquier estado, sin ventana · S-3 importes en pesos, sin conversión
(hipótesis heredada) · S-4 la vista la lee todo usuario con sesión · S-5 sin umbrales ni colores · S-6 cociente sólo con reclamado
mayor que 0 · D-5 la etiqueta del grupo es el fabricante de la ficha de menor `id` · D-7 el acceso es un botón del menú de usuario.
Cómo se revierte cada uno: `proposal.md` §6 y `design.md`.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño |
|---|---|---|
| P-1 | Verificar la vista en la aplicación tras desplegar | Quien despliega, con Gerencia |
| P-2 | Revisar S-1 a S-6, D-5 y D-7 en la lista semanal (E-237) | Gerencia |
| P-3 | Cargar las fallas repetidas en la taxonomía ISO 14224 | Gerencia sitúa la fila (`decision/anexo-56-taxonomia`) |
