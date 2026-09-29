# apply-progress — `blueprint-soporte-remoto` · Lote 1 (`shared`) · Strict TDD

Base `47db1bc` (docs sobre `66ab783`). Línea base antes de tocar: `npm test` 156 ficheros · 1848 tests (+2 omitidos), `packages/shared` 24 · 394.
Tareas 1.1–1.25 hechas; A.1 y 0.3 previas. Lote 2 y 3 sin empezar.

## Evidencia TDD (rojo capturado antes del verde)
| Bloque | Fichero de prueba | Rojo (por qué) | Verde |
|---|---|---|---|
| A · Estado (1.1-1.4) | `estados.test.ts` | 5 rojos: `ESTADOS` 22≠23; `sin_clasificar` sin el tercero; `Solicitud Soporte` `undefined`; `ESTADOS[último]` = `Verificación`; `ESTADOS_SOLO_SOPORTE_REMOTO is not iterable` | 15/15; `tsc -b` limpio |
| B · Catálogo (1.6-1.11) | `transitionsSoporteRemoto.test.ts` (nuevo, 6 casos), `reentrancia.test.ts` (+2), `invariantesGrafo.test.ts` | 9 rojos (`undefined.map`, `Target cannot be null`, ciclo = 3 por caer en `TRANSITIONS`); `invariantesGrafo` NO cargó (`TRANSITIONS_SOPORTE_REMOTO is not iterable` al evaluar el `UNION`): 3 ficheros rojos | catálogo verde; queda 1 rojo esperado (`flujoDeTransicion('soporte_pendiente')`) hasta el bloque C |
| C · Flujos (1.16-1.20) | `flujos.test.ts` (+22 casos con `it.each`), `invariantesGrafo.test.ts` (+2) | 29 rojos: 3 invertidos/deliberados (`:42-45` `servicio`≠`soporte-remoto`; «tres entradas»; `Object.keys`), el resto `esClasificacionSoporteRemoto`/`estadoInicialDelAlta`/`modalidadDelAlta`/`MODALIDADES` no existen, y `SR en Solicitud Soporte` ve `[]` | 81/81 en los tres ficheros; 111/111 en los cinco del comando enfocado |

**Nacen VERDES (declarado):** `sinSalida = ['Finalizado']` (unión, en sitio); `marcar_pendiente` resuelve a servicio; SR en `Rev./Diagnostico` y `Ticket creado` ve las de `TRANSITIONS`;
`columnForStatus('Solicitud Soporte') = 'otros'` (S-10, `columns.ts:38`, `:45-46`); los EN heredados (`flujos.test.ts:34-36`, `:47-49`); y el invariante «sin transición de entrada = `Remisión creada`, `OV asignada`, `Ticket creado`, `Solicitud Soporte`» (la hipótesis se confirmó en el primer intento, sin ajuste).

## Mutaciones (todas revertidas; `cmp` con la copia verde = idénticas)
| # | Mutación | Rojo |
|---|---|---|
| 1.5 (M9) | `ESTADOS_SOLO_SOPORTE_REMOTO = []` | `estados.test.ts` ×2 (`ESTADOS_SERVICIO` 21/orden; lista) y `tsc` `fasesBlueprint.ts:68` TS1360 |
| 1.12 | `anular_soporte` `Solicitud Soporte → Finalizado` | 12: 1.6(a)(b)(c)(d)(f)(e), reentrancia, unión 44, y los 4 de `invariantes del catálogo` |
| 1.13 | borrar `ejecutar_soporte` | 10, incl. 1.6(f); `3 · sin salida` NO se pone rojo (confirma la spec) |
| 1.14 | `soporte_pendiente` → id `marcar_pendiente` | 6, incl. 1.6(e) (ids únicos, 43≠44) y unión 44 |
| 1.15 (M7) | `from: ['Solicitud soporte']` | 9: 1.6(a)(b), unión `1`, `3` y `4`, `ESTADOS_SOLO…`, pares y S-5 |
| 1.21 (M11) | quitar la condición de estado en `flujos.ts:57` | 3: inversión `:42-45`, SR en `Rev./Diagnostico` y en `Ticket creado` ven `[]` |
| 1.22 (M10) | `estadoInicialDelAlta` siempre `Ticket creado` | 3: nacimiento SR, nacimiento=enrutado, invariante de entrada |
| 1.23 (H5) | comparar con el literal `'Soporte remoto'` | 2: «soporte remoto» normalizado (nacimiento y enrutado divergen) |
| 1.24 | `modalidadDelAlta` normaliza a minúsculas | 1: fila `SR con "Remoto" → error` |

## Cierre (1.25)
- Enfocado (5 ficheros de `shared`): 5/5 · 111 tests. `npm test`: **157 ficheros · 1895 tests (+2 omitidos)**, 0 rojos (+1 fichero, +47 tests). Ningún rojo fuera de `shared`: `permisos`, `sla.test.ts:202` y `transicionesEjecucion` siguen verdes.
- `npm run typecheck` limpio; `npx eslint . --max-warnings 165` = 165 warnings, 0 errores (sin avisos en los ocho ficheros tocados).
- Recuentos: `estados.ts` **190 sin cambio** (`7 7`; ningún hunk con más `+` que `-`); `transitions.ts` 376→397 (`22 1`: `:366` + 21 al final); `flujos.ts` 106→163 (`63 6`: cinco líneas en sitio + 57 al final).
- Medida del lote: tracked `--no-renames HEAD -- packages/shared` (con el nuevo tras `add -N`) 412+ / 41−; sin trackear 0; `apply-progress.md` 49 (`wc -l`). Total `git diff --shortstat --no-renames HEAD` con los dos nuevos tras `add -N`: 487+ 66− = 553 (incluye 25 casillas de `tasks.md`) ≪ 800.
- Barrido de citas (regla 4): ninguna línea se desplazó. Releído lo que cambia de contenido: `estados.ts:105` (`proposal.md:109`, paquetes de despliegue) sigue cierto; `:101-105` (`fasesBlueprint.ts:40`) cierto; `:112` `ESTADOS` cierto;
  `flujos.ts:56-61` (paquetes de despliegue 09-27/09-29, `exploration.md:27`) cierto pero INCOMPLETO: `:57` ahora enruta también SR (caso A, sólo prosa de despliegue); `transitions.ts:365-376` y `invariantesGrafo.test.ts:163` sólo se citan en `design`/`tasks`.

## Desviaciones
1. **`invariantesGrafo.test.ts:6`** lleva TRES `import` en una línea (`; import …`) para no insertar líneas arriba (`:3`, `:5` y ~62 citas): estilo poco común, deliberado. `estados.test.ts:3` y `flujos.test.ts:3` igual (nombres añadidos en la misma línea).
2. **Retorno de `modalidadDelAlta`** `{ valor } | { error }` (hipótesis de 1.16 confirmada); `estadoInicialDelAlta` devuelve `string` (no el tipo `Estado`) para no atar `flujos.ts` a un import nuevo de `estados`.
3. `modalidadDelAlta('Equipo nuevo', null)` → error (`null` cuenta como valor enviado; `design` D5 sólo fija `=== undefined` como ausente): fila extra de la tabla, revisable.
4. 1.6(e) («`soporte_pendiente` resuelve a `soporte-remoto`») sólo se pone verde al llegar `flujos.ts` (bloque C), no en 1.11: dependencia de orden que la tarea no anticipaba.
5. `flujos.ts:21` y `:57` cambian en la MISMA línea (dos sentencias); `estados.ts:182` lleva dos sentencias con `;` y un comentario final.

## Work Unit Evidence
| Evidencia | Valor |
|---|---|
| Comando enfocado | `npx vitest run estados.test.ts transitionsSoporteRemoto.test.ts reentrancia.test.ts invariantesGrafo.test.ts flujos.test.ts` → 5 ficheros · 111 passed |
| Runtime | N/A: node puro (`vitest.config.ts:16`), sin frontera de red/BD en el lote 1 |
| Rollback | `git revert` del commit del lote 1 (8 ficheros de `shared`); ojo S-6: SR heredados en `En Proceso`/`Pendiente`/`Finalizado` cambian de flujo en vivo |

**Reproducido por el orquestador (regla de mutación 2, sobre el catálogo vigilado):** rojo previo con los tres ficheros de producción de `47db1bc` = 42 fallos y `invariantesGrafo.test.ts` sin cargar (91 de 111). M-A, transición a un estado sin salida y sin registrar (`En Proceso → 'Estado fantasma'`): 12 rojos (invariantes 1 y 4 de la unión, pares, (e)); el invariante 3 NO, porque recorre el registro. M-D, estado REGISTRADO sin salida (se retira `asignacion_soporte`): 19 rojos, entre ellos «3 · sin salida en la unión es exactamente Finalizado». M-B, id repetido entre catálogos (`soporte_pendiente` → `marcar_pendiente`): 7 rojos. M-C, id repetido dentro del catálogo: 5 rojos. Las cuatro revertidas con `cmp`.
