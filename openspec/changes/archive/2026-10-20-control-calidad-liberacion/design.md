# Diseño — `control-calidad-liberacion` (F1C-07, `cierra: no`)

Base: `e8eaea2`. Requisitos: RQ-TS-46..51, RQ-PM-32..37, RQ-TZ-22..24, RQ-AV-24 (`specs/*/spec.md`). Ningún fichero muy citado
desplaza líneas: lo nuevo va en ficheros nuevos, al final de los existentes o dentro de una línea que ya existe (regla de
mutación 4); única excepción, `config.ts:125-126` (dos `}` que nadie cita). Matriz de amenazas: N/A (sin shell, subprocesos ni VCS).

## D1 · Estado, fase, columna y mapa

| Pieza | Decisión | Dónde (misma línea) |
|---|---|---|
| Registro | `'Control de calidad': 'ninguna'` **antes de** `'Anulado'` | `packages/shared/src/estados.ts:99` |
| Fase | `diagnostico`, junto a `'En Proceso'` (4 · 12 · 7) | `packages/shared/src/fasesBlueprint.ts:55` |
| Columna | `{ id: 'control_calidad', label: 'Control de calidad', … }` tras `comercial`, antes de `por_facturar` | `packages/shared/src/columns.ts:30` |
| Transiciones | tres objetos tras `facturar` y antes del comentario final | `packages/shared/src/transitions.ts:262` |

*Por qué diagnóstico:* la fase 3 es «Cierre administrativo y entrega» (`fasesBlueprint.ts:25`) y QA es trabajo técnico; así
el ciclo `Control de calidad ⇄ En Proceso` queda dentro de una fase y la frontera 2→3 pasa a ser la aprobación, como hoy lo es
`finalizacion_servicio`. *Por qué antes de `Anulado`:* los alias del mapa salen de la posición en `ESTADOS`
(`mapaBlueprint.ts:82`); ahí sólo se renumera `Anulado` (hipótesis: ≈ 40 líneas en `docs/artefactos/`, se mide al
regenerar); en `:92`/`:94` se renumerarían siete o cinco estados, y detrás de `Anulado` rompería `anulacion.test.ts:139`.
Campos y claves en un módulo de datos nuevo, `packages/shared/src/camposControlCalidad.ts` (los tres ids, `IDS_FIRMA_CC`,
`ESTADO_CONTROL_CALIDAD`, las tres etiquetas del checklist, `CLAVE_GAS_CC`, `CLAVE_MOTIVO_FIRMA_ADMIN`,
`CLAVE_MOTIVO_RECHAZO_CC`, `CLAVES_SOLO_TRAZA_CC`, `camposAprobacionCC()`, `camposRechazoCC()`), importado en
`transitions.ts:74` como `camposAnulacion`; no importa `transitions` ni `tipoEvento`, así que no crea ciclos. El envío repite
los campos de `:223` (los indicadores leen «Fecha Finalización ST», `indicadores.ts:172`, `:229`) y una prueba exige que
coincidan (molde H5). El mapa se regenera con `scripts/generar-mapa-blueprint.ts` (`:57`; anti-desfase en `mapaBlueprint.test.ts:154-177`).

## D2 · Regla pura `packages/shared/src/controlCalidad.ts` (nuevo; `export *` al final de `index.ts`)

```ts
export interface UsuarioParaFirma { id: string; name: string; isAdmin: boolean; cargoPermiso: Cargo | null }
export interface FilaDeTraza { transitionId: string | null; performedBy: string | null; performedById: string | null }
export interface ContextoFirma { usuariosActivos: readonly UsuarioParaFirma[]; derivadoA: string | null; traza: readonly FilaDeTraza[] }
export type CausaSinFirma = 'no_habilitado' | 'intervino' | 'habilitado_libre'
export type VeredictoFirma = { puede: true; via: 'habilitado' | 'administrador' } | { puede: false; causa: CausaSinFirma; cargos: readonly Cargo[] }
export function esFirmaControlCalidad(transitionId: string): boolean
export function cargosHabilitados(usuarios: readonly UsuarioParaFirma[]): readonly Cargo[] // ['Coordinador Técnico'] o, vacante, ['Director Técnico','Especialista técnico']
export function intervino(p: Pick<UsuarioParaFirma, 'id' | 'name'>, ctx: Pick<ContextoFirma, 'derivadoA' | 'traza'>): boolean
export function quedaHabilitadoLibre(ctx: ContextoFirma): boolean
export function veredictoFirma(s: Pick<UsuarioParaFirma, 'id' | 'name' | 'isAdmin'>, ctx: ContextoFirma): VeredictoFirma
export function mensajeSinFirma(nombreTransicion: string, v: Extract<VeredictoFirma, { puede: false }>): string
export function exigeGasPatron(transitionId: string, compuestoEquipo: string | null, gases: readonly GasPatronLeido[], hoy: DiaCivil): boolean
export function erroresContenidoControlCalidad(e: { transitionId: string; values: Record<string, unknown>; via: 'habilitado' | 'administrador' | null; gasExigido: boolean }): string[]
export function prioridadTrasRechazo(transitionId: string, actual: string | null): 'High' | null // null fuera del rechazo o con 'Urgent' (S-10)
export function contarRetrabajos(traza: readonly { transitionId?: string | null }[]): number
export function motivoQuitadaPorInterruptor(transitionId: string, activo: boolean): string | null // visibleConControlCalidad = (… === null)
```

- `intervino`: `p.id === ctx.derivadoA`, o autor de una fila con `tipoEventoDeTransicion(transitionId) === 'Operativo'`
  (`tipoEvento.ts:11-15`; la de creación da `null`): por `performedById === p.id` si la fila tiene id; si no,
  `performedBy === p.name` exacto (S-5). Un homónimo de fila vieja bloquea, nunca habilita.
- `veredictoFirma`, en orden: (1) `s.id` entre los habilitados (por id contra `usuariosActivos`, no por el cargo de la
  sesión) → `intervino` ? `intervino` : `habilitado`; (2) `s.isAdmin` → `intervino` ? `intervino` : `quedaHabilitadoLibre` ?
  `habilitado_libre` : `administrador`; (3) `no_habilitado`.
- `erroresContenidoControlCalidad`, sólo en las dos de firma: gas sin marcar con `gasExigido`; motivo del administrador vacío
  tras `trim` con `via === 'administrador'` en la aprobación (en el rechazo vale el del rechazo, S-11); «Motivo del rechazo»
  de sólo espacios (el vacío ya lo da `transitionExec.ts:76-77`, y así no se duplica).
- **F1C-05:** `decisionales.ts:46` gana `|| IDS_FIRMA_CC.has(t.id)`: `cargosQueFaltanParaDecisional` da `null` en las de firma.

## D3 · Servidor

- **Interruptor:** `packages/zoho-sync/src/config.ts:66` gana `; controlCalidadLiberacion: boolean` antes del `}`; lectura en línea nueva tras `:124`, `env.CONTROL_CALIDAD_LIBERACION === 'true'`; `appHarness.ts:46`, `:49`.
- **Lecturas** (`apps/desk/server/services/controlCalidad.ts`, nuevo, molde `services/decisionales.ts`): `contextoFirma(db,
  ticketId)` = `SELECT id, name, is_admin, cargo_permiso FROM users WHERE active = true`, `SELECT derivado_a FROM tickets WHERE
  id = $1` y `SELECT transition_id, performed_by, performed_by_id FROM ticket_transitions WHERE ticket_id = $1`.
  `veredictoFirmaControlCalidad(db, t, ticketId, user)` y `erroresControlCalidad(db, t, row, values, v)` salen SIN consultar
  fuera de las dos de firma; el gas sólo se lee en la aprobación (`leerContextoGas`, `apps/desk/server/db/gasesPatron.ts:14`,
  con `hoyEnZona()`). `avisarSinFirmanteLibre(db, t, ticketId, numero, actorId)` sólo actúa en el envío y nunca lanza.
- **Guardas en `apps/desk/server/services/ticketService.ts`** (imports en `:6` y `:7`; envoltorios
  `exigirInterruptorControlCalidad(t, config)` y `exigirFirmaControlCalidad(t, v)` al FINAL del fichero, molde `:248-250`):

| Línea | Qué se añade, en la misma línea | Escalón |
|---|---|---|
| `:128` | `} exigirInterruptorControlCalidad(t, config)` — `409` con `motivoQuitadaPorInterruptor` | B, tras el estado, antes del área |
| `:131` | tras el comentario de Decisionales: `const firmaCC = await veredictoFirmaControlCalidad(db, t, id, user); exigirFirmaControlCalidad(t, firmaCC)` | B, `403`, antes de la prioridad |
| `:133` | `const prioCC = prioridadTrasRechazo(t.id, current.row.priority ?? null); if (prioCC) plan.priority = prioCC; for (const k of CLAVES_SOLO_TRAZA_CC) delete plan.customFields[k]` | — |
| `:134` | `const errCC = await erroresControlCalidad(db, t, current.row, values, firmaCC)` antes del `if`, con `errCC.length` y `...errCC` | C, `422` agregado |
| `:155` | `…, valoresConMotivo(values, gas), user.id ?? null); await avisarSinFirmanteLibre(db, t, id, Number(current.row.number), user.id ?? '')` | tras escribir |

  `High` llega por `writeTransition` (`repo.ts:300`); sin `priority()` en las de firma no aplican `prioridad.ts:82` ni `:121`.
  Las claves de QA no van a `tickets.custom_fields` (molde del certificado, `:133`): son del acto y viven en `values`.
- **Traza:** en `packages/zoho-sync/src/db/repo.ts`, `actorId: string | null = null` en la línea del último parámetro de
  `writeTransition` (`:283`) y de `applyTransition` (`:329`), pasado en `:333` y `:339`; columna en `:315`, `$10` en `:317`.
  Los demás llamadores quedan con `null`. Al final de `schema.sql`: `ALTER TABLE ticket_transitions ADD COLUMN IF NOT EXISTS
  performed_by_id text;`, sin calificar (`DESK_TABLES`, `migrate.ts:63-64`) y sin relleno.
- **Aviso:** `destinatariosAdministradores(db, actorId)` al final de `apps/desk/server/db/avisos.ts` (`SELECT id, email, name
  FROM users WHERE active = true AND is_admin = true`, sin el actor). Tras el envío se relee el contexto (ya con su fila) y,
  si `!quedaHabilitadoLibre`, `crearAviso` por destinatario, sólo bandeja (S-13), en `try/catch` con `logger.warn`.
- **Ruta:** `routes/permisosControlCalidad.ts` (nuevo): `GET /api/permisos/control-calidad`, `requireAuth(db)` → `{ activo:
  config.controlCalidadLiberacion === true }`; import y registro al final de `app.ts:22` y `:61`.

## D4 · Cliente (mínimo)

`client.ts`: `getContextoControlCalidad()` al final. `TransitionPanel.tsx:55`: estado `controlCalidad` (`false`) y un `useEffect`
que lo pide una vez (si falla, `false`); `:57`: `&& visibleConControlCalidad(t.id, controlCalidad)`; imports en `:3` y `:8`.

## D5 · Regla 13, decisión a decisión

| Decisión que toma el cliente | Línea del servidor que la impone |
|---|---|
| Oculta `envio_control_calidad` con `activo` falso | `ticketService.ts:128` (`409`, `motivoQuitadaPorInterruptor`) |
| Oculta `finalizacion_servicio` con `activo` verdadero | `ticketService.ts:128` (la misma función) |
| Sin respuesta de la ruta, `activo = false` | ninguna: degradación de comodidad; decide el `409` |
| Asterisco en las tres casillas y en «Motivo del rechazo» | `transitionExec.ts:76-77`; espacios: `ticketService.ts:134` |
| Casilla de gas y motivo del administrador sin asterisco | no decide: `ticketService.ts:134` los exige cuando tocan |
| Ofrece las de firma a todo Servicio Técnico (no filtra firmante) | no decide: `403` en `ticketService.ts:131` |
| No pide prioridad en el rechazo | `ticketService.ts:133` (`prioridadTrasRechazo`) |
| No hay motivo heredado que bloquear (no se guarda en el ticket) | `ticketService.ts:133` (borra `CLAVES_SOLO_TRAZA_CC`) |

## D6 · Pruebas (strict TDD: cada lote abre en rojo) y mutaciones

Nuevas: `packages/shared/src/controlCalidadCatalogo.test.ts` (RQ-TS-46, -50), `packages/shared/src/controlCalidad.test.ts`
(RQ-PM-33, -34 pura, -37 visibilidad, RQ-TZ-24, gas, prioridad) y `apps/desk/server/controlCalidad.test.ts` (HTTP con
`appWith({ controlCalidadLiberacion })`, `userCookie(areas, cargo)` y admin). Vigilantes del lote 1a, en su línea:
`cifrasAncladas.test.ts:24`, `estados.test.ts:16-17`, `:226`, `invariantesGrafo.test.ts:51-53`, `:173-174`, `tipoEvento.test.ts:12-31`,
`:44-55`, `decisionales.test.ts:17-23`, `transitions.test.ts:126`, `transitionsSoporteRemoto.test.ts:58`, `fasesBlueprint.test.ts:17-20`,
`columns.test.ts:9`, `:46-47`, `mapaBlueprint.test.ts:46-54`, `:182-184`, `prioridad.test.ts:118-120`, `migracionTickets.test.ts:25-28`,
`permisos.test.ts:77-81`, `:349-356`, `transicionesEjecucion.test.ts:185`, `:285`. Barridos HTTP (`permisos.test.ts:43-109`,
`transicionesEjecucion.test.ts:250-286`): en 2a el envío corre con app encendida; en 2b el esperado de las de firma sin cargo
es `403` y `valoresValidos` (`appHarness.ts:74`) rellena `CLAVE_MOTIVO_FIRMA_ADMIN` para que el administrador firme de respaldo.

| Id | Fichero | Mutación | Debe caer |
|---|---|---|---|
| M1 | `config.ts` | `=== 'true'` → `!== 'false'` | literales de RQ-PM-32 (`config.test.ts`) |
| M2 | `ticketService.ts` | `config?.controlCalidadLiberacion === true` → `true` | caracterización apagada; «apagado, el envío da 409» |
| M3-M4 | `controlCalidad.ts` | `intervino` sin `derivadoA` / sin traza | «quien intervino no firma» (shared y HTTP) |
| M5 | `controlCalidad.ts` | `=== 'Operativo'` → `!== null` | «Decisional, Compras / Logístico y Administrativo no son intervención» |
| M6 | `controlCalidad.ts` | vacante siempre verdadera | «con Coordinador activo, ni el Especialista ni el Director» |
| M7 | `controlCalidad.ts` | `Técnico` entre los habilitados | «vacante… no un Técnico»; «un Técnico no firma» |
| M8-M9 | `controlCalidad.ts` | admin sin mirar `quedaHabilitadoLibre` / sin error de motivo | «con un habilitado libre el administrador no firma» / «sin motivo, 422» |
| M10 | `services/controlCalidad.ts` | aviso a `destinatariosDeCargoPermiso('Director Técnico')` / sin llamada | «no va al Director Técnico» / «avisa a los administradores» |
| M11 | `ticketService.ts` / `controlCalidad.ts` | sin `prioCC` / `contarRetrabajos` cuenta todas | «el rechazo sube la prioridad» / «cuenta sólo los rechazos» |
| M12 | `transitions.ts` | aprobación `to: 'Por Entregar'` | RQ-TS-46, `transicionesEjecucion.test.ts`, «aprobado lleva a Por Facturar» |
| M13 | `controlCalidad.ts` | comparar siempre por nombre | «fila con id frente a fila sin id» |
| M14 | `decisionales.ts` | quitar la exclusión de `:46` | RQ-PM-35 («el 403 es el de firmante») |
| M15 | `controlCalidad.ts` | gas siempre / nunca exigido | «sin patrón vigente…» / «con patrón vigente se exige» |
| P1-P2 | `ticketService.ts` | el `409` del interruptor antes del de estado / tras el `403` de área | CC-1 / CC-2 |
| P3-P5 | `ticketService.ts` | firma antes del área / tras `valoresConFechasDerivadas`; `errCC` tras la persona derivada (`:138-142`) | CC-3 / CC-4, CC-5 / CC-6 |

Cada prueba de posición activa las dos guardas a la vez (regla de mutación 1). **No observable, y se declara:** la firma frente
a la prioridad, la OVI y la verificación (las de firma no declaran `priority()` ni OV ni son `liberacion`): orden escrito, no probado.

## D7 · Lotes (estimación `--no-renames`, ingenua × 1,8; válvula 720)

| Intento | Lote | Contenido | Ingenua | × 1,8 |
|---|---|---|---|---|
| I3 | 1a | `camposControlCalidad.ts`; catálogo, estado, fase, columna; exclusión F1C-05; vigilantes; `cifras_ancladas` (sólo `openspec/config.yaml:1360-1383`); mapa regenerado; M12, M14 | 250 | 450 |
| I4 | 1b | `controlCalidad.ts` y su prueba; M3-M9, M11b, M13, M15 en shared | 340 | 612 |
| I5 | 2a | interruptor y su prueba; `performed_by_id` (esquema, `repo.ts`, pruebas); `:128`; barridos (envío); RQ-TS-47, CC-1, CC-2; M1, M2, P1, P2 | 200 | 360 |
| I6 | 2b | servicio de firma; `:131`, `:133` (claves), `:134`; barridos (firma); RQ-PM-34..36, RQ-TS-48, CC-3..6, RQ-TZ-23; P3-P5 | 380 | 684 |
| I7 | 2c | `prioCC`; aviso y `destinatariosAdministradores`; ruta; RQ-TS-49, RQ-AV-24, RQ-PM-37 (ruta); M10, M11a | 200 | 360 |
| I8 | 3 | `client.ts`, `TransitionPanel.tsx`, `DEPLOY.md` §16 (al final, tras `:754-774`) y su prueba; barrido de citas | 70 | 126 |

Sustituye I3-I5 de la propuesta (§13): con margen, lote 1 (1.008) y lote 2 (1.240) no cabían; verify y archive pasan a I9-I10.
Si 2b mide más de 720 antes de cerrar, RQ-TS-48 sale a un intento propio.

**Barrido de la regla de mutación 4 (I8):** en `estados.ts`, `transitions.ts`, `fasesBlueprint.ts`, `columns.ts`,
`decisionales.ts`, `ticketService.ts` (salvo el final), `repo.ts`, `app.ts`, `appHarness.ts` y `TransitionPanel.tsx`,
`git diff --numstat` da inserciones = borrados; `config.ts` mueve sólo `:125-126`. Caso A en su línea: `estados.ts:111`
(«24» → 26), `:187` («21» → 23), `fasesBlueprint.ts:29` («21» → 23). Se releen las citas a `ticketService.ts:128`, `:131`,
`:133-134`, `:155` y `repo.ts:315-317`, `:322-330`: su texto cambia aunque el número no.

## D8 · Supuestos y riesgos nuevos

- **S-14** `Control de calidad` es de la fase `diagnostico`; su columna va entre `Liberación Comercial` y `Por Facturar`.
- **S-15** Sin SLA propio y sin parar el reloj (`relojSla.ts:24` no lo lista); la tarjeta usa el color de respaldo (`TicketCard.tsx:26`; no se añade al mapa de `:14`).
- **S-16** En el envío tras un rechazo, «Fecha Finalización ST» se enseña bloqueada con la del primero (`TransitionPanel.tsx:32-36`) y el indicador marca `reentrante` (`indicadores.ts:134`).
- **S-17** Checklist, gas y motivos viven sólo en `values` de la traza; «Motivo de la firma del administrador» se ve para todos y sólo cuenta en la firma de respaldo.
- **S-18** Un fallo del aviso a administradores se registra y el envío responde `200` (los avisos de hoy lanzan tras escribir).
- **R-7** Los barridos HTTP suponen que toda transición pasa con valores mínimos: sin el ajuste de D6 quedan en rojo (visible). **R-8** Tres consultas más por firma y tras cada envío (hipótesis: volumen bajo); seis intentos de aplicar en vez de tres.
