# Diseño: «Rechazo» desde Notificación cliente, sólo Comercial (F1C-10)

Medido el 2026-10-01 en el worktree `rechazo-solo-comercial` (partida `0070ef1`). Tanda XS: un dato de
catálogo y sus guardianes. Sin arquitectura nueva.

## Enfoque técnico

El área vive en el catálogo compartido y el servidor la lee de ahí (`apps/desk/server/services/ticketService.ts:129-130`),
así que cambiar una cadena en `packages/shared/src/transitions.ts:236` basta para la imposición. Todo lo demás
es mover guardianes y cifras **en sitio**, añadir pruebas **al final** de sus ficheros y regenerar el mapa.
Ninguna línea citada se desplaza.

## Decisiones

| Decisión | Alternativa rechazada | Por qué |
|---|---|---|
| D-1 · Editar en sitio `transitions.ts:236`: sólo `area: 'Comercial / Servicio Técnico'` → `area: 'Comercial'` | Mover `rechazo_cliente` junto a las de Comercial, o una excepción por cargo | Mover desplaza `:238-261` y sus citas. La excepción por cargo (`EXCEPCIONES_POR_CARGO`) restringe por cargo, no por área: E-114 cambia el área |
| D-2 · Invariante 5: `invariantesGrafo.test.ts:103` se sustituye por **un comentario de una línea** dentro del literal: `      // rechazo_cliente: 'Comercial' desde F1C-10 (E-114); ya no es compartida.` | Borrar la línea | Borrarla mueve `:104-…`; hay citas a `:120`, `:137`, `:160`, `:172`, `:177`, `:213` en specs y docs. Un comentario dentro de un literal de objeto es TS válido y `toEqual` no lo ve: comprobado por lectura de `:96-105` |
| D-3 · Ajustar también, en sitio, `:85` («ocho» → «siete»), `:88` (el ejemplo pasa a `rechazo_comercial`, «siguen siendo siete») y `:91` (título «las siete compartidas») | Dejar el comentario de `:87-89` con `rechazo_cliente` | Tras el cambio `rechazo_cliente` ya no es compartida: el ejemplo describiría un caso que no existe. `:91` sigue siendo la línea del `it` (citada en `transitions-st/spec.md:271`, `:1385`; `permissions/spec.md:529`) |
| D-4 · Pruebas nuevas al final de `permisos.test.ts` (tras `:384`) y de `avisoArea.test.ts` (tras `:97`) | Añadir casos dentro de los `describe` existentes | No desplaza ninguna cita (`permisos.test.ts:24-89` está citado en specs y `config.yaml`) |
| D-5 · El 403 se escribe **a mano** | Fiarse de la matriz HTTP `permisos.test.ts:41-67` | Esa matriz deriva el esperado de `puedeEjecutarTransicion` (`:64`): con `:236` revertido sigue verde. Sólo una prueba con el resultado escrito discrimina |
| D-6 · S-1 se fija con prueba: `areasAAvisar('Notificación cliente', ['Comercial'])` = `['Compras']` | No probar el aviso | Hoy no hay prueba de ese estado; el efecto sobre la campana es el único cambio visible fuera del botón |

## Flujo

    transitions.ts:236 (area) ──→ canExecuteTransition (permissions.ts:4-7) ──→ ticketService.ts:129-130 (403)
           │                 └──→ puedeEjecutarTransicion ──→ TransitionPanel.tsx:56-58 (botón)
           ├──→ areasSiguientes (transitions.ts:327-334) ──→ avisoArea.ts:16 (campana)
           └──→ mapaBlueprint.ts:78-80 ──→ docs/artefactos/blueprint-*.md (generador)

## Guardianes y cifras (antes → después)

| Ruta:línea | Antes | Después |
|---|---|---|
| `packages/shared/src/transitions.ts:236` | `Comercial / Servicio Técnico` | `Comercial` |
| `apps/desk/server/permisos.test.ts:26-27` (comentario) | 93, 54 prohibidos y 39 permitidos | 93, 55 / 38 |
| `permisos.test.ts:72-73` (comentario) | 23×2 + 8×1 = 54; 39 | 24×2 + 7×1 = 55; 38 (mismos cortes de línea) |
| `permisos.test.ts:77`, `:80-81` | 54 / 39 | 55 / 38 |
| `permisos.test.ts:338` (comentario) | 93 = 54/39 | 93 = 55/38 |
| `permisos.test.ts:349`, `:352-353` | 55 / 38 | 56 / 37 |
| `permisos.test.ts:341-347`, `:356-369` | 1 diferencia; 744 | sin cambio |
| `packages/shared/src/invariantesGrafo.test.ts:85`, `:88`, `:91`, `:103` | ocho; ejemplo `rechazo_cliente`; entrada C/ST | siete; ejemplo `rechazo_comercial`; comentario |
| `areasSiguientes('Notificación cliente')` vía `avisoArea.ts:16` | Comercial, Compras, Servicio Técnico | Comercial, Compras (prueba nueva) |
| `docs/artefactos/blueprint-completo.md:54`, `blueprint-fase-2-diagnostico.md:44`, `blueprint-fase-3-cierre.md:22` | `[C][ST]` | `[C]` |

Pruebas nuevas: `describe('F1C-10 · rechazo_cliente sólo Comercial')` en `permisos.test.ts` — usuario `['Servicio Técnico']`
→ `403` en `rechazo_cliente` desde `Notificación cliente`; `['Comercial']` → `200`; `['Servicio Técnico']` → `200` en
`rechazo_comercial` y `rechazo_revision` desde su `from[0]`. Números de ticket en `96000+` (libres: se usan 80000, 90000,
92000, 93000, 94000). En `avisoArea.test.ts`: `areasSiguientes('Notificación cliente').sort()` = `['Comercial','Compras']`
y `areasAAvisar('Notificación cliente', ['Comercial'])` = `['Compras']`.

Mapa: `npm run generar-mapa-blueprint` (`package.json:25`); `git diff --stat docs/artefactos` debe dar exactamente tres
líneas cambiadas en tres ficheros; `blueprint-fase-1-entrada.md` sin cambio.

## Regla 13 (casilla)

| Decisión del cliente | Línea del servidor que la impone | Prueba |
|---|---|---|
| Ocultar «Rechazo» en Notificación cliente a quien no es Comercial (`apps/desk/src/components/TransitionPanel.tsx:56-58`, `puedeEjecutarTransicion`) | `ticketService.ts:129-130` (área) y `:131` (cargo) | `permisos.test.ts:41-67` + el `403` nuevo escrito a mano |

El cliente consume `@ambientalia/shared` (punto 1) y la imposición queda probada (punto 3). Ningún `.tsx` cambia.

## Plan strict TDD y mutaciones

1. **Rojo**: cifras (`:80-81`, `:352-353`), invariante 5 con siete, las pruebas nuevas. Correr y anotar el rojo.
2. **Verde**: editar `:236`; regenerar el mapa.
3. **Mutaciones** (a mano, anotadas en `apply-progress.md`, revertidas):

| Mutación | Debe dar rojo en |
|---|---|
| M-1 · devolver `:236` a `Comercial / Servicio Técnico` | `:80-81`, `:352-353`, invariante 5, `403` nuevo, `areasSiguientes`/`areasAAvisar` nuevos, anti-desfase (`mapaBlueprint.test.ts:154-…`) |
| M-2 · poner `Comercial` en `:234` o en `:238` | invariante 5, cifras, el `200` de Servicio Técnico en esa «Rechazo» |
| M-3 · regla 2: escribir `[C][ST]` a mano en cada una de las tres aristas de los `.md` | anti-desfase, una vez por fichero |
| M-4 · restaurar la entrada de `rechazo_cliente` en el literal de `:103` | invariante 5 |

Regla de mutación 1 (posición): **no aplica**; no se añade ni se mueve ninguna guarda del motor.

## Barrido de citas al cierre (regla de mutación 4)

- Completas: `grep -rnoE "(transitions|invariantesGrafo\.test|permisos\.test|avisoArea\.test)\.ts:[0-9]+(-[0-9]+)?"` y
  `blueprint-(completo|fase-[123]-[a-z]+)\.md:[0-9]+`, fuera de `openspec/changes/archive/**`.
- Abreviadas (`:NNN`) en los ficheros que ya citan esos módulos, y la forma corta de specs (`RQ-TS-07`, `RQ-PM-03`, «ocho
  compartidas», `54/39`).
- Casos: **A** las que afirman el presente («ocho», 54/39 en specs vivas) se corrigen vía delta; **B** las fechadas
  (`transitions-st/spec.md:1545`, `archive/**`, `docs/sdd/Estado_As-Built_2026-09-09.md`) no se tocan; **C** ninguna
  esperada. Como no se mueve ninguna línea, se espera cero desfases por número; lo que hay que leer es lo que **afirman**.

## Estimación (medida `git diff --shortstat --no-renames` + nuevos sin trackear; hipótesis)

| Intento | Contenido | Líneas |
|---|---|---|
| apply | `transitions.ts` 2, `invariantesGrafo.test.ts` 8, `permisos.test.ts` ~22 + ~35, `avisoArea.test.ts` ~15, mapa 6, `tasks.md` ~20, `apply-progress.md` ~100 | ~210 |
| verify | `verify-report.md` | ~250 |
| archive | revisable: fusión de 2 deltas (~120) + `archive-report.md` (~120); la mudanza de carpeta (×2) no cuenta (regla del archivo, `CLAUDE.md:682-689`) | ~240 revisables |

## Amenazas y migración

Matriz de amenazas: N/A — sin enrutado, shell, subprocesos, automatización VCS ni clasificación de ejecutables.
Sin migración: las trazas históricas conservan su `area` (`ticketService.ts:155`). Vuelta atrás: revertir el commit.

## Preguntas abiertas

Ninguna bloqueante.
