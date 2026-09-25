# Diseño: blueprint de equipo nuevo y enrutado por clasificación (F1B-06, primer cambio)

Base `e8640d7`. Entradas fijas: `proposal.md` y los cuatro specs de `specs/`. Toda cita a código es
contra `e8640d7`. Regla de método: lo que no lleva ruta y línea lleva «hipótesis».

## 1 · Enfoque técnico

Tres piezas, todas en `packages/shared` salvo la imposición:

1. **Catálogo** `TRANSITIONS_EQUIPO_NUEVO` al **final** de `transitions.ts` (tras `:334`). Tiene que vivir
   ahí porque reutiliza los ayudantes privados `comment()` (`:73-74`) y `derivacion()` (`:97-98`).
2. **Registro de flujos** en un fichero **nuevo**, `packages/shared/src/flujos.ts`: clasificación +
   estado → flujo → catálogo. Fichero nuevo y no final de `transitions.ts` porque necesita importar
   `CLASIFICACIONES` (`ticketCreate.ts:5`), y un `import` nuevo arriba de `transitions.ts` desplazaría
   sus 334 líneas (267 citas según la propuesta).
3. **Imposición en el servidor**: guarda 3 en `executeTransition`, filtro de flujo en avisos y en el SLA.
   El cliente sólo consume el registro (regla 13, punto 1) y es espejo probado (punto 3).

Principio de inserción (regla de mutación 4): **todo lo nuevo va al final del fichero o en línea**;
ningún fichero muy citado gana ni pierde líneas antes de su final. Resultado medido en §7.

## 2 · Decisiones

### D1 · Catálogo separado, ids propios, `Verificación` dentro del registro de estados

| Opción | Coste | Decisión |
|---|---|---|
| Fundir en `TRANSITIONS` | `transitionsForStatus`, `areasSiguientes` y `destinatarioDelEscalado` mezclarían grafos por nombre de estado (`Ingresado`, `En Proceso`, `Notificado`, `Finalizado`) | Rechazada (RQ-EN-01) |
| Catálogo aparte al final de `transitions.ts` | Los guardianes no lo ven solos: se extienden (D5) | **Elegida** |

Entradas (todas `area: 'Servicio Técnico'` por s2, `fields: [comment()]` + derivación por el mismo
`map` de `:295-298`; ninguna fuente da otros campos, M1.4 `R08.2.md:1491-1514` sólo trae estados):

| id | name | from → to |
|---|---|---|
| `ingreso_equipo_nuevo` | Ingreso equipo nuevo | Ingresado → En Proceso |
| `producto_no_conforme` | Producto no conforme | En Proceso → Notificado |
| `analisis_y_acciones` | Análisis y acciones | Notificado → Ingresado |
| `verificacion` | Verificación | En Proceso → Verificación |
| `liberacion` | Liberación | En Proceso → Finalizado |

*Hipótesis:* F1A-03 añadirá `Verificación` al `from` de `liberacion` (dos orígenes, `R08.2.md:1518`).

**`Verificación` en el registro de estados, EN LÍNEA** (RQ-EN-07 lo exige en `CLASIFICACION_EN_ESPERA`,
`estados.ts:59-106`): la línea `:105` pasa a `'Pendiente': 'sin_clasificar', 'Verificación':
'sin_clasificar',` y el encabezado `:101` se reescribe en su sitio («sin clasificar (2)»). `:111`
(«Los 21 estados») se reescribe en su sitio. Cero líneas desplazadas.

Consecuencia que la propuesta no midió: `ESTADOS` pasa de 21 a **22** y el tipo `Estado` gana
`'Verificación'`. Eso rompe en compilación `FASE_POR_ESTADO … satisfies Record<Estado, FaseId>`
(`fasesBlueprint.ts:68`) y metería `Verificación` en el mapa del Blueprint de **servicio**
(`mapaBlueprint.test.ts:17`, `scripts/generar-mapa-blueprint.ts:31`). Solución, **al final de
`estados.ts`** (tras `:173`):

```ts
export const ESTADOS_SOLO_EQUIPO_NUEVO = ['Verificación'] as const satisfies readonly Estado[]
export type EstadoServicio = Exclude<Estado, (typeof ESTADOS_SOLO_EQUIPO_NUEVO)[number]>
export const ESTADOS_SERVICIO: EstadoServicio[] = /* ESTADOS menos los de arriba, mismo orden */
```

`fasesBlueprint.ts:11` y `:68` pasan a `EstadoServicio` (en línea); `fasesBlueprint.test.ts:14`,
`mapaBlueprint.test.ts:17`/`:113` y `scripts/generar-mapa-blueprint.ts:18`/`:31` pasan a
`ESTADOS_SERVICIO` (en línea). El orden se conserva, así que los alias `e01…e21` y los cuatro `.md` de
`docs/artefactos/` salen **idénticos**: el anti-desfase RQ-MB-06 sigue verde sin regenerar.

**El generador NO incluye el grafo nuevo**: es el mapa de servicio y el de los tres flujos es F1B-09
(`plan:166`, fuera en la propuesta). Si `Verificación` se colara en `ESTADOS_SERVICIO`, el anti-desfase
se pone rojo (M12).

### D2 · Registro de flujos y normalización (`flujos.ts`, nuevo)

```ts
export type Flujo = 'servicio' | 'equipo-nuevo'
export const CATALOGO_POR_FLUJO: Record<Flujo, readonly Transition[]>
export function esClasificacionEquipoNuevo(c: string | null | undefined): boolean
export function flujoDelTicket(t: { classification?: string | null; status: string }): Flujo
export function catalogoDelTicket(t): readonly Transition[]
export function transicionesDelTicket(t): Transition[]            // catálogo ∩ from incluye status
export function transicionPorId(id: string): Transition | undefined // busca en TODOS los catálogos
export function flujoDeTransicion(id: string): Flujo | undefined
export function fueraDeFlujo(t: Transition, ticket): string | null // mensaje del 409, o null
```

- **Normalización:** `trim`, espacios internos colapsados y minúsculas, comparado por **igualdad** con
  la forma normalizada de la constante `'Equipo nuevo'` tipada como `(typeof CLASIFICACIONES)[number]`
  (así un cambio del literal en `ticketCreate.ts:5` rompe `tsc`). Zoho escribe «Equipo Nuevo»
  (`R08.2.md:1518`; `Decisiones_Gerencia_2026-09-10.md:23`). Igualdad y no `includes`: «Equipo nuevo
  usado» no es equipo nuevo.
- **Regla de heredados (s5, RQ-EN-04):** `equipo-nuevo` sólo si la clasificación normaliza a equipo
  nuevo **y** `status` está en los estados **derivados** de los `from`/`to` del catálogo (los 5). En
  otro caso, `servicio`. Así `Ticket creado` sigue en servicio y `habilitar_servicio` (`transitions.ts:178`)
  lo lleva a `Ingresado`, donde pasa a su grafo (RQ-EN-03).
- `transitionById` (`transitions.ts:305-307`) **no se toca**: sigue siendo del catálogo de servicio y
  lo usan cinco ficheros de prueba con ids de servicio (`bodegaje.test.ts`, `reentrancia.test.ts`,
  `transitions.test.ts`, `transitionExec.test.ts`, `valoresTransicion.test.ts`).

### D3 · Guarda 3 en `executeTransition`: en línea en `:125`

| Opción | Citas a `ticketService.ts` desplazadas | Decisión |
|---|---|---|
| Línea nueva entre `:125` y `:126` | Todas las que apuntan a `:126` en adelante: ~35 vivas (p. ej. `CLAUDE.md:348`, `:363`, `openspec/config.yaml:474`, `:579`, `:1129`, specs `transitions-st`, `derivacion-avisos`, `remisiones`, `trazas`, `contratoErrores.test.ts:21`, `ordenVentaUnTicket.test.ts:20`, `valoresTransicion.ts:13`, `fechasDerivadas.ts:106`) — y **las propias evidencias del delta** `transitions-st` RQ-TS-06 (`:126-128`, `:129-131`, `:134`, `:138-142`, `:148-152`) serían falsas al nacer | Rechazada |
| Fundir `:124`+`:125` y usar `:125` | 0 desplazadas, pero `:125` dejaría de ser el `404` que citan RQ-TS-06 fila 2, `contratoErrores.test.ts:18` y `derivacion-avisos` (`:123-125`) | Rechazada |
| **Segunda sentencia en `:125`**, tras el `404` | **0 desplazadas**; `:125` sigue conteniendo el `404` | **Elegida** |

```ts
// :125
if (!current) throw new HttpError(404, { error: 'Ticket no encontrado' }); const otroFlujo = fueraDeFlujo(t, current.row); if (otroFlujo) throw new HttpError(409, { error: otroFlujo })
```

- `:122` pasa a `transicionPorId(...)`; `:6` cambia `transitionById` por `transicionPorId, fueraDeFlujo,
  catalogoDelTicket` (en línea). `current.row.classification` existe (`packages/zoho-sync/src/db/rows.ts:23`).
- Posición: primera del escalón B, tras las dos de A (`:123`, `:125`) y antes de estado (`:126-128`) y
  permiso (`:129-131`). Coincide con RQ-EN-05 y RQ-TS-06.
- Mensaje (nombra los dos flujos): `La transición "<name>" es del flujo de <equipo nuevo|servicio técnico>
  y este ticket sigue el flujo de <…>`.
- Coste declarado: `:125` queda larga (tres sentencias). `eslint.config.js` no tiene
  `max-statements-per-line` ni `max-len`; el techo de 165 avisos (`eslint.config.js:15`) no se toca.
- Citas cuyo **contenido** cambia sin desplazarse, a releer al cierre (caso A, siguen ciertas): `:125`
  (`contratoErrores.test.ts:18`; `openspec/specs/transitions-st/spec.md:33`, `:975`;
  `openspec/specs/derivacion-avisos/spec.md:212`), `:122` (`proposal.md:32`), `:6` (sólo archivadas,
  caso B, no se tocan), `:196` (ninguna).

### D4 · Filtro por flujo: servidor impone, cliente refleja

| Punto | Cambio (todo en línea) | Lado | Regla 13 |
|---|---|---|---|
| Ejecución | Guarda 3 (D3) | Servidor | Imposición |
| Panel | `TransitionPanel.tsx:2`, `:38`, `:40` (prop `clasificacion`), `:56` → `transicionesDelTicket`; `TicketDetailView.tsx:324` pasa `ticket.classification` | Cliente | Espejo legítimo (punto 3): lo impone `ticketService.ts:125`, probado. **No existe endpoint que liste transiciones**: el panel las calcula en el navegador (`TransitionPanel.tsx:56`), verificado — ninguna ruta de `apps/desk/server` llama a `transitionsForStatus` |
| Avisos por área | `transitions.ts:327`/`:329`: `areasSiguientes(estado, transiciones = TRANSITIONS)`; `avisoArea.ts:1`/`:15`/`:16`: tercer parámetro opcional; `ticketService.ts:196`: `catalogoDelTicket({ classification, status: t.to })` | Servidor | — |
| SLA de `Notificado` | `db/sla.ts:2` (import), `:45` (`SELECT … classification`), `:48` (tipo), `:49` (`if (flujoDelTicket(fila) !== 'servicio') continue;` antes del `const estado`) | Servidor | — |

- Verificado: `areasSiguientes` **no** aceptaba catálogo (`transitions.ts:327-334`); sólo
  `destinatarioDelEscalado` (`sla.ts:92-95`). `destinatarioDelEscalado` no cambia: los tickets de otro
  flujo ya no llegan a `db/sla.ts:58`.
- Avisos: el flujo se evalúa en el **estado de llegada** (`t.to`), que es el estado actual del ticket
  cuando se avisa (tras `applyTransition`, `:155`). Lectura literal de RQ-AV-04 + RQ-EN-04.
- SLA en JS y no en SQL: un `LOWER(TRIM(classification))` en la consulta sería una **segunda
  implementación** de la misma noción (molde H5 de `CLAUDE.md`). Se reutiliza `flujoDelTicket`; el
  coste es leer y descartar filas de equipo nuevo en `Notificado`, despreciable.
- Tabla de la regla de mutación 3 (decisiones del cliente → línea del servidor): ofrecer sólo el flujo
  del ticket → `ticketService.ts:125`; ofrecer sólo desde el estado → `:126-128`; filtrar por área →
  `:129-131`. Ninguna decisión nueva del cliente queda sin línea.

### D5 · Guardianes extendidos al registro

| Guardián | Hoy | Cambio |
|---|---|---|
| Invariantes 1-4 (`invariantesGrafo.test.ts:35-82`) | Sobre `TRANSITIONS` y `ESTADOS` | En línea: 1, 2 y 3 comparan con `ESTADOS_SERVICIO` (`:5`, `:41`, `:50-53`, `:64`); siguen siendo «34 sobre 21» y «Finalizado único». **Al final**: bloque de la unión — derivados(unión) = `ESTADOS` (22); ids únicos en la unión; 5 entradas; sin salida en la unión = `['Finalizado', 'Verificación']` con `Verificación` como excepción nombrada; ninguna `from` fuera del registro; `ESTADOS_SOLO_EQUIPO_NUEVO` = derivados(EN) − derivados(servicio) |
| `estados.test.ts:15-17`, `:66-67`, `:71` | 21, sólo `Pendiente` | En línea: 22 (21 + `Verificación`), `['Pendiente', 'Verificación']` |
| Reentrancia (`reentrancia.test.ts`) | Tres ciclos de servicio | Al final: `tablaDeReentrancia(TRANSITIONS_EQUIPO_NUEVO)` = un ciclo {Ingresado, En Proceso, Notificado}; `camposFechaReentrantes(EN)` = `[]` |
| Escalado (`sla.test.ts:170-176`) | Ningún ambiguo en `TRANSITIONS` | Al final: ningún ambiguo en ningún catálogo del registro |
| Ejecución (`transicionesEjecucion.test.ts:188-287`) | 34/36 | Al final: `CASOS_EQUIPO_NUEVO` escrita a mano, huérfanas en los dos sentidos, extremos contra el grafo, barrido HTTP de 5 con `classification = 'Equipo nuevo'` (sin clasificación los tickets existentes siguen en servicio, así el barrido de 34 no cambia) |
| Permisos (`permisos.test.ts:41-110`) | 34×3 = 102 | Al final: 5×3 = 15 casos, **10 prohibidos y 5 permitidos** escritos a mano; admin pasa las 5 |
| Mapa (RQ-MB-06) | `ESTADOS` | `ESTADOS_SERVICIO` (D1); artefactos sin regenerar |

**Las líneas que predicen «F1B-06 entra en TRANSITIONS»** (15 líneas con el literal, 17 con su
continuación, en 9 ficheros): se reescriben **en su sitio, con el mismo número de líneas**, o se
vuelven ciertas por la extensión de arriba.

| Línea | Tratamiento |
|---|---|
| `invariantesGrafo.test.ts:11-12`, `:73-74` | Reescribir: F1B-06 añade catálogos al registro de flujos; la red cubre la unión |
| `reentrancia.test.ts:16`, `:24`; `sla.test.ts:166`; `transicionesEjecucion.test.ts:193`; `permisos.test.ts:25` | Ciertas con la extensión; se retoca la frase para decir «cualquier catálogo del registro» |
| `transicionesEjecucion.test.ts:135-136` | Reescribir: «la transición 35» → «una transición nueva de cualquier catálogo» |
| `reentrancia.ts:5`, `:91`, `:142`; `sla.ts:83`; `bodegaje.ts:218`; `appHarness.ts:62` | Reescribir en su sitio: nombran «dos grafos» como previsión; pasan a «catálogos del registro de flujos (`flujos.ts`)» |

### D6 · Descartes

- No se añade columna de flujo ni migración: el flujo se deriva de `classification` + `status`
  (reversión = revertir commits, como dice la propuesta).
- `createManagedTicket` sigue comparando con el literal exacto (`ticketService.ts:24-25`): el alta
  escribe siempre el valor de `CLASIFICACIONES`. Fuera de alcance.

## 3 · Flujo de datos

    ticket{classification,status} ──→ flujoDelTicket ──→ CATALOGO_POR_FLUJO[flujo]
          │                                   │                    │
          │     POST /transition ──→ transicionPorId ──→ guarda 3 (:125) ──→ 409 si difiere
          │                                                        │
          │                          applyTransition ──→ areasAAvisar(t.to, áreas, catálogo de llegada)
          └── TransitionPanel (espejo) ── transicionesDelTicket
          └── ticketsConSlaVencido ── descarta flujo ≠ servicio

## 4 · Ficheros

| Fichero | Acción | Qué |
|---|---|---|
| `packages/shared/src/transitions.ts` | Modificar | Catálogo al final; `:327`, `:329` en línea |
| `packages/shared/src/estados.ts` | Modificar | `:101`, `:105`, `:111` en línea; `ESTADOS_SERVICIO` al final |
| `packages/shared/src/flujos.ts` | Crear | Registro de flujos (D2) |
| `packages/shared/src/flujos.test.ts` | Crear | Normalización, enrutado, heredados, `transicionPorId`, `fueraDeFlujo`, `areasSiguientes` con catálogo inyectado, `columnForStatus('Verificación') === 'otros'` |
| `packages/shared/src/index.ts` | Modificar | `export * from './flujos'` al final |
| `fasesBlueprint.ts`, `fasesBlueprint.test.ts`, `mapaBlueprint.test.ts`, `scripts/generar-mapa-blueprint.ts` | Modificar | En línea → `EstadoServicio`/`ESTADOS_SERVICIO` |
| `invariantesGrafo.test.ts`, `estados.test.ts`, `reentrancia.test.ts`, `sla.test.ts` | Modificar | D5 |
| `reentrancia.ts`, `sla.ts`, `bodegaje.ts` | Modificar | Sólo comentarios, en su sitio |
| `apps/desk/server/services/ticketService.ts` | Modificar | `:6`, `:122`, `:125`, `:196` en línea |
| `apps/desk/server/services/avisoArea.ts` | Modificar | `:1`, `:15`, `:16` en línea |
| `apps/desk/server/db/sla.ts` | Modificar | `:2`, `:45`, `:48`, `:49` en línea |
| `apps/desk/server/flujoEquipoNuevo.test.ts` | Crear | Guarda 3 (409, posición, 200), `habilitar_servicio` para equipo nuevo, heredado en `Rev./Diagnostico`, `403` a Comercial |
| `db/sla.test.ts`, `services/avisoArea.test.ts`, `transicionesEjecucion.test.ts`, `permisos.test.ts` | Modificar | Al final; comentarios en su sitio |
| `apps/desk/server/testing/appHarness.ts` | Modificar | `:62`, comentario |
| `apps/desk/src/components/TransitionPanel.tsx`, `TicketDetailView.tsx` | Modificar | En línea (D4) |

## 5 · Pruebas y mutaciones (strict_tdd: rojo antes de cada verde)

| # | Mutación deliberada | Debe ponerse rojo |
|---|---|---|
| M1 | Mover la guarda 3 detrás de `:126-128` | Prueba de posición: servicio en `Rev./Diagnostico` + `ingreso_equipo_nuevo` → mensaje de flujo, no «no aplica desde el estado» (regla de mutación 1) |
| M2 | Quitar la guarda 3 | Equipo nuevo en `Ingresado` + `ingreso_a_servicio` → esperado `409`, sale `200` |
| M3 | Ensuciar el catálogo: `from: ['Revisión']` (regla de mutación 2) | Invariantes 1 y 4 de la unión |
| M4 | Añadir una salida desde `Verificación` | «ninguna sale de Verificación» y sin-salida de la unión |
| M5 | Renombrar un id EN a `ingreso_a_servicio` | Ids únicos en la unión |
| M6 | Igualdad estricta en vez de normalizar | «Equipo Nuevo» (Zoho) → `equipo-nuevo` |
| M7 | Quitar la condición «estado en el catálogo» | Heredado en `Rev./Diagnostico` ve las de servicio, no `[]` |
| M8 | Quitar el filtro de `db/sla.ts:49` | Equipo nuevo en `Notificado` > 24 h no aparece |
| M9 | `liberacion` a `Comercial` | Total escrito a mano de la matriz EN (10/5) |
| M10 | `transicionPorId` sólo en `TRANSITIONS` | Barrido EN: `400` en vez de `200` |
| M11 | Quitar `Verificación` de `CLASIFICACION_EN_ESPERA` | `tsc` (`ESTADOS_SOLO_EQUIPO_NUEVO satisfies`) e invariante 1 de la unión |
| M12 | Dejar `Verificación` en `ESTADOS_SERVICIO` | `tsc` de `fasesBlueprint.ts:68` o anti-desfase RQ-MB-06 |
| M13 | Quitar el catálogo en `ticketService.ts:196` | **NO se pone rojo con datos reales, y se declara:** por s2 las cinco son `Servicio Técnico` y todas las salidas de servicio de los cuatro estados homónimos también, así que las áreas coinciden. Lo cubre la prueba unitaria de `areasAAvisar` con catálogo sintético; el cableado se comprueba leyendo, en el verify |
| M14 | Volver a `transitionsForStatus` en `TransitionPanel.tsx:56` | No detectable: `.tsx` fuera de la red (F0-00, `vitest.config.ts:17-20`). Lo cubre la guarda 3 (regla 13, punto 3) |

## 6 · Matriz de amenazas

N/A — no hay enrutado de red, shell, subprocesos, automatización de VCS/PR ni clasificación de
ejecutables. El «enrutado» de este cambio es de dominio (clasificación → catálogo).

## 7 · Tamaño real y lotes (techo 800, medido con `git diff --shortstat --no-renames e8640d7` + `wc -l` de lo nuevo sin trackear)

| Lote | Contenido | Estimación (+/−) |
|---|---|---|
| 1 · dominio shared | `transitions.ts` ~47, `estados.ts` ~26, `flujos.ts` ~110, `flujos.test.ts` ~190, `index.ts` 1, fases/mapa/script ~20, `invariantesGrafo.test.ts` ~76, `estados.test.ts` ~25, `apply-progress.md` ~120 | **~615** |
| 2 · guardianes, servidor y cliente | `reentrancia.test.ts` ~29, `sla.test.ts` ~22, comentarios shared ~10, `ticketService.ts` 8, `avisoArea.ts` 6, `db/sla.ts` 8, `flujoEquipoNuevo.test.ts` ~120, `db/sla.test.ts` ~25, `avisoArea.test.ts` ~15, `transicionesEjecucion.test.ts` ~84, `permisos.test.ts` ~62, `appHarness.ts` 2, `.tsx` ~8, `apply-progress.md` ~80 | **~480** |

El `.tsx` cabe en el lote 2; no necesita lote propio. Aparte: `verify-report.md` ~350; archive ≈ 2×
la carpeta + fusión (se mide). Citas desplazadas previstas: **0** en `transitions.ts`, `estados.ts` y
`ticketService.ts`. El barrido del cierre (regla de mutación 4) relee además las citas cuyo contenido
cambia: `ticketService.ts:125`, `transitions.ts:327-334`, `estados.ts:101-105`/`:111`,
`TransitionPanel.tsx:56-58`, `db/sla.ts:40-45`, y las afirmaciones «21 estados» atadas a `ESTADOS`
(las que hablan del Blueprint de servicio siguen ciertas, caso A).

## 8 · Desacuerdo con la spec (se sigue la spec)

1. RQ-EN-01 llama a la ausencia de salida de `Verificación` «excepción del invariante 1 de
   `transitions-st`». La propiedad «sin salida» es el **invariante 3** (`invariantesGrafo.test.ts:62-66`;
   `openspec/specs/transitions-st/spec.md:62`); el 1 sobre la unión se cumple sin excepción. Se nombra
   la excepción en el 3 de la unión y el 1 de la unión queda exacto, como pide el escenario.
2. No es de la spec sino de la propuesta: «`Verificación`, registrado aparte del registro de servicio»
   contradice RQ-EN-07 (`CLASIFICACION_EN_ESPERA`). Manda la spec; `ESTADOS_SERVICIO` es lo que
   conserva «aparte» para el mapa y las fases. Y la propuesta decía que «21 estados» seguía cierto:
   sigue cierto del Blueprint de servicio, no de `ESTADOS`, que pasa a 22.

## 9 · Preguntas abiertas (no bloquean)

- Las tres de la propuesta (F1A-03, área de `Liberación`, heredados) siguen abiertas y son reversibles.
