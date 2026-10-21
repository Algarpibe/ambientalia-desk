# Diseño — `salidas-esperas` (F1C-03, `cierra: si`)

Base: el commit de propuesta y deltas de la rama `salidas-esperas`. Requisitos: RQ-TS-56 (modificado), RQ-TS-60..64, RQ-PM-42..45,
RQ-AV-25..27 (`specs/*/spec.md`). Ningún fichero muy citado desplaza líneas: lo nuevo va en ficheros nuevos, al final de los
existentes o dentro de una línea que ya existe (regla de mutación 4). Matriz de amenazas: **N/A** (sin shell, subprocesos, VCS ni
clasificación de ejecutables). **Sin migración** (D7). Supuestos nuevos: S-12..S-22 (D8), reversibles, a la lista semanal.

## D1 · Dónde va cada pieza, sin desplazar citas

| Pieza | Sitio | Cómo |
|---|---|---|
| `cobro_diagnostico_espera` y `sin_pieza_en_almacen` | `packages/shared/src/transitions.ts:262` | tras `falla_calibracion` y antes del comentario final, que gana «F1C-03 (RQ-TS-60)». `area: 'Comercial'`/`'Servicio Técnico'`, `tipoEvento: 'Decisional'`/`'Compras / Logístico'`, `fields: [comment()]`. Ninguna entra en `DERIVACION_POR_DEFECTO` (`:274-282`): heredan |
| `areasSiguientes` | `transitions.ts:330` | la condición gana `\|\| t.id === 'cobro_diagnostico_espera'` (literal: `transitions.ts` no importa el módulo nuevo). Sin esto, entrar en `Servicio externo` avisaría a Comercial aun con el interruptor apagado (`avisoArea.ts:16`, `reasignacion.ts:26`) — S-22 |
| Campo `salidasEsperas` | `packages/zoho-sync/src/config.ts:66` y lectura en `:125` | `; salidasEsperas: boolean` dentro de la llave de `:66`; `salidasEsperas: env.SALIDAS_ESPERAS === 'true',` al final de `:125`. `appHarness.ts:46` y `:49` lo aceptan y lo ponen `false` |
| Regla pura del ejecutor e interruptor | `packages/shared/src/salidasEsperas.ts` (nuevo) | D2 |
| Registro de plazos y textos de la alarma | `packages/shared/src/plazosEsperas.ts` (nuevo) | D4 |
| Exportación | `packages/shared/src/index.ts` | una línea nueva al FINAL (`:52`): `export * from './salidasEsperas'; export * from './plazosEsperas'` |
| Propiedad RQ-TS-56 | `controlCalidad.ts:121-122` y import en `:7` | tercer parámetro `salidasEsperas = false` en `:121`; el filtro de `:122` gana `&& visibleConSalidasEsperas(t.id, salidasEsperas)` |
| Comentario de c3 | `estados.ts:154`, `:158` | en sitio: `:154` «Esperamos a nuestro almacén: la pieza se entrega o, si no hay, vuelve a En Espera de Repuestos (c3)»; `:158` «Esperamos un trámite nuestro: que Comercial dé de alta el SKU (c3)». Mismo número de líneas |
| Cifras vigiladas en comentario | `estados.ts:142` «Hay DIEZ» → «Hay NUEVE»; `:145` «da SEIS,» → «da CINCO,»; `ticketService.ts:238` «49» → «51» | las vigila `comentariosVigilados.test.ts:36-37`, `:51` |

## D2 · Regla pura (`packages/shared/src/salidasEsperas.ts`)

```ts
export const ID_COBRO_DIAGNOSTICO = 'cobro_diagnostico_espera', ID_SIN_PIEZA = 'sin_pieza_en_almacen'
export const IDS_SALIDAS_NUEVAS: ReadonlySet<string>                 // las dos; dependen del interruptor
export const ORIGENES_ANULACION_EN_ESPERA: ReadonlySet<string>       // 'En Espera de Repuestos', 'Servicio externo'
export const CLAVE_MOTIVO_RESPALDO = 'Motivo del respaldo'
export const CAMPO_MOTIVO_RESPALDO: TransitionField                  // text, required, label = clave; NO va en el catálogo
export interface ContextoSalidasEsperas { activo: boolean; coordinadorTecnicoVacante: boolean }
export const SALIDAS_ESPERAS_APAGADO: ContextoSalidasEsperas
export type EjecutorSalida = { via: 'persona_a_cargo' } | { via: 'respaldo' } | { via: 'denegado'; mensaje: string }
export function esSalidaDeEspera(transitionId: string, origen: string): boolean   // anulacion desde ER/SE, o una de las dos
export function motivoQuitadaPorSalidasEsperas(transitionId: string, activo: boolean): string | null
export function visibleConSalidasEsperas(transitionId: string, activo: boolean): boolean   // (… === null)
export function ejecutorDeSalida(t: Pick<Transition, 'id' | 'name' | 'area'>, tk: { status: string; derivadoA: string | null },
  s: SujetoDePermiso & { id?: string | null }, ctx: ContextoSalidasEsperas): EjecutorSalida | null
export function erroresMotivoRespaldo(v: EjecutorSalida | null, values: Record<string, unknown>): string[]
export function puedeEjecutarConSalidasEsperas(s, t, tk, dec: ContextoDecisionales, sal: ContextoSalidasEsperas): boolean
```

- `ejecutorDeSalida`: `null` si `!ctx.activo` o `!esSalidaDeEspera(t.id, tk.status)` (fuera de su alcance no opina). Si no, en
  orden: (a) `s.id` igual a `tk.derivadoA` y `canExecuteTransition(s.areas, s.isAdmin, t.area)` → `persona_a_cargo`; (b) `s.isAdmin`
  o `cargoPermiso` en `cargosDecisionales(areaDeDecision(t)!, ctx.coordinadorTecnicoVacante)` (`decisionales.ts:21-32`, reutilizada,
  sin copia) → `respaldo`; (c) `denegado`, «"<nombre>" desde «<origen>» la ejecuta la persona a cargo del ticket o, con motivo, el
  Director o el Coordinador del área». Una prueba fija que `areaDeDecision` no es `null` para las tres.
- **«Activo» no se consulta (S-12):** quien ejecuta ya está activo, porque la sesión lo exige (`apps/desk/server/auth/sessions.ts:21`);
  y si el derivado está inactivo o es de otra área, nadie puede ser él. Por eso S-2 sale sola: derivado nulo, inactivo o ajeno =
  nadie cumple (a) y sólo pasa (b). Cero consultas sobre el derivado en la guarda.
- `erroresMotivoRespaldo` (escalón C): `respaldo` con la clave ausente o en blanco tras `trim()` → «"Motivo del respaldo" es
  obligatorio: no eres la persona a cargo del ticket»; `persona_a_cargo` con texto no vacío → «"Motivo del respaldo" sólo lo da el
  respaldo: eres la persona a cargo del ticket» (RQ-PM-44: se acepta sólo en el caso (b) y no se descarta en silencio, S-14);
  `null` o `denegado` → `[]`.
- `puedeEjecutarConSalidasEsperas` es la **excepción explícita** a Decisionales por cargo (molde `IDS_FIRMA_CC`, `decisionales.ts:46`):
  si `ejecutorDeSalida` da veredicto, `puedeEjecutarTransicion(s, t) && v.via !== 'denegado'`; si no,
  `puedeEjecutarTransicionConDecisionales(s, t, dec)` intacta. No se mete en `cargosQueFaltanParaDecisional`: la excepción depende
  del ORIGEN (`anulacion` desde `Rev./Diagnostico` sigue siendo Decisional por cargo) y esa función no lo recibe.
- **«Motivo del respaldo» NO entra en el catálogo.** Rechazado como campo opcional para todos: lo vería la persona a cargo, movería
  los campos de `anulacion` (contra la caracterización de RQ-TS-60) y `buildTransitionPlan` lo escribiría en `tickets.custom_fields`.
  Fuera del catálogo llega a la traza sin más: `valoresEfectivos` conserva las claves ajenas (`fechasDerivadas.ts:115-117`),
  `buildTransitionPlan` sólo recorre `t.fields` (`apps/desk/server/transitionExec.ts:42`) y `writeTransition` guarda `values` entero
  (`packages/zoho-sync/src/db/repo.ts:317`). No hace falta `delete` como en `ticketService.ts:133` (S-13).
- Interruptor: **función hermana**, no ampliar `motivoQuitadaPorInterruptor` (`controlCalidad.ts:103-107`), que recibe UN `activo`
  (`CONTROL_CALIDAD_LIBERACION`) y lo llaman `ticketService.ts:286` y `TransitionPanel.tsx:57`: meter un segundo interruptor
  obligaría a cambiar las dos llamadas. Texto: «Las salidas de las esperas están apagadas (SALIDAS_ESPERAS)». Sin ciclo:
  `salidasEsperas.ts` importa `decisionales`, `cargos`, `permissions` y tipos; nadie de ellos la importa (`tsc -b` lo confirma).

## D3 · Guardas en `apps/desk/server/services/ticketService.ts`

| Guarda | Escalón · código | Dónde, en la misma línea | Fija el par (regla de mutación 1) |
|---|---|---|---|
| Interruptor (las dos nuevas) | B · `409` | `:128`, `exigirInterruptorSalidasEsperas(t, config);` justo tras `exigirInterruptorControlCalidad(t, config);` | SE-0 estado < interruptor (`cobro` desde `Solicitado`, apagado → texto de estado); SE-1 interruptor < área |
| Ejecutor | B · `403` | `:131`, tras `if (cargoFalta) throw …;`: `const ejecutor = await veredictoEjecutorSalida(db, t, current.row, user, config); exigirEjecutorSalida(ejecutor);` | SE-2 área < ejecutor (mensaje de área); SE-2b ejecutor < Decisionales (DPC encendido, Comercial sin cargo ni derivado en `cobro` → mensaje del ejecutor, no `mensajeDecisional`) |
| Decisionales por cargo | B · `403` | `:131`, `config?.decisionalesPorCargo && !ejecutor ? … : null` | RQ-PM-43: persona a cargo sin cargo pasa con DPC encendido; `rechazo_comercial` sigue igual |
| Motivo del respaldo | C · `422` agregado | `:134`, `const errRespaldo = erroresMotivoRespaldo(ejecutor, values)` en el `if` y en `errors` | SE-3 ejecutor < `422`; SE-5 «un único 422» con `anulacion` sin «Motivo de anulación» y sin motivo del respaldo |

- Auxiliares al FINAL del fichero (molde `:285-311`): `exigirInterruptorSalidasEsperas` (`motivoQuitadaPorSalidasEsperas(t.id,
  config?.salidasEsperas === true)` → `409`); `veredictoEjecutorSalida`, que sale sin consultar nada si el interruptor está
  apagado o `!esSalidaDeEspera(t.id, row.status)`, y si no pide `contextoDecisionales(db, true)` (`services/decisionales.ts:10-13`)
  sólo para la vacante —también con DPC apagado, S-10— y llama a `ejecutorDeSalida` con `derivadoA: row.derivado_a ?? null`
  (`getTicketWithRefs` hace `SELECT t.*`, molde de F1C-08); `exigirEjecutorSalida` (`denegado` → `403` con su mensaje). Imports al
  final de `:6`.
- Pares SIN prueba posible, declarados: ejecutor frente a la lista corta (`cargoFalta`), a la firma de control de calidad y a la
  prioridad: conjuntos de transiciones disjuntos. Interruptor frente a `exigirInterruptorControlCalidad` y `exigirCalibracionDirecta`:
  disjuntos; una prueba fija `IDS_SALIDAS_NUEVAS ∩ (IDS_CALIBRACION_DIRECTA ∪ {envio_control_calidad, finalizacion_servicio}) = ∅`.
- Traza (D6 de la propuesta): `applyTransition` ya recibe `user.id` como `performed_by_id` (`ticketService.ts:155`, `repo.ts:317`).

## D4 · Alarma de caducidad

**(a) Entrada al estado.** `apps/desk/server/db/esperasVencidas.ts` (nuevo), `ticketsEnEspera(db)`: tres consultas FIJAS, molde de
`apps/desk/server/db/relojSla.ts:75-85` y de `db/sla.ts:87-91` (subconsulta no correlacionada, sin `GROUP BY`): `tickets` con `status`
en `ESTADOS_SIN_SALIDA` (filtrados a `flujoDelTicket(...) === 'servicio'`, molde `sla.ts:48-49`); sus `ticket_transitions`; y sus
`ticket_history` con `event_name = 'TicketUpdated'`. La entrada es el ÚLTIMO paso de `secuenciaDelReloj` (`relojSla.ts:36-59`,
exportada, reutilizada: funde app y Zoho con `etapasDesdeHistoria`, y devuelve `null` si el último estado no es el actual). Es el
mismo método de la medición (`openspec/config.yaml:5281-5284`). Sin secuencia, el ticket no se mide (S-16, molde `sla.ts:56`).
Rechazada `entradasActuales` (`sla.ts:78-102`): sólo lee `ticket_transitions` y la medición es 100 % de Zoho.

**(b) Anti-duplicado: `public.alarmas_avisadas` sin migración.** PK `(ticket_id, estado, entrada_at)` (`schema.sql:582-589`). Se
reutiliza `marcarYAvisarAlarma` (`apps/desk/server/services/alarmasSla.ts:37-57`): el `INSERT` va primero en la transacción y la
clave duplicada devuelve `null`. **No interfiere con F1B-08:** sus lecturas filtran por estado —`alarmasSla.ts:92-93` compara la
terna completa y `db/alarmasAvisadas.ts:24` lee sólo estados con `marcaTablero`— y las claves de `SLA_HORAS_POR_ESTADO`
(`sla.ts:32-35`: `Notificado`, `Remisión creada`, `Notificación cliente`) son disjuntas de las cuatro esperas; `alarmas_corte` no se
toca (S-7: sin corte). Una prueba fija `ESTADOS_SIN_SALIDA ∩ claves(SLA_HORAS_POR_ESTADO) = ∅` y `∩ claves(ALARMAS_SLA) = ∅`: si
mañana una espera gana SLA, la prueba lo dice antes de que una alarma se trague a la otra. Rechazada la columna nueva: migración
y un `ALTER` más para lo mismo. La reentrada da otra `entrada_at` y otro aviso (RQ-AV-27).

**(c) Destinatarios** (dato en `plazosEsperas.ts`, `ALARMA_ESPERA`): externas → Director y Coordinador Comercial por
`destinatariosDeCargoPermiso` (`apps/desk/server/db/avisos.ts:121-127`) más el `derivado_a` si `getUserById` lo da activo y con área
Comercial (`canExecuteTransition`); `Solicitado` → Director y Coordinador Técnico; SKU → Director y Coordinador Comercial. Si nadie
lleva los cargos, el área (`destinatariosDeArea`, `avisos.ts:74`) de respaldo. Deduplicados por id. Lista vacía: no se marca, se
avisa en el log y se reintenta (S-18, molde `avisoFacturacionVencida.ts:33-36`).

**(d) Textos**, función pura `textoAvisoEspera(estado, numero, dias)`; la clase sale de `enEsperaDe` (`estados.ts:169`), que ya da
externa a ER/SE e interna a `Solicitado`/SKU (`estados.ts:61-62`, `:78-79`), sin redeclararla:
externa «El ticket #N lleva D días en «E» (plazo: P). Comercial decide su salida: cobrar el diagnóstico o anular.»;
`Solicitado` «… sin entregarse la pieza: se escala a Servicio Técnico.»; SKU «… : hay que crear el SKU.». Una prueba fija que los
textos internos no nombran `Anulado`, `Por Facturar`, «anular» ni «cobrar» (mutación 4).

**(e) Cableado.** `apps/desk/server/services/avisoSalidasEsperas.ts` (nuevo, molde `avisoFacturacionVencida.ts:53-81`):
`pasadaSalidasEsperas(db, config, hoy = hoyEnZona())` sale sin consumir el día si `config.salidasEsperas !== true`; si no, una
evaluación por día civil y proceso, nunca lanza; un fallo en un ticket no para a los demás. `apps/desk/server/index.ts:88`:
`.then(() => pasadaSalidasEsperas(pool, config))` tras `pasadaFacturacionVencida(pool)`; import al final de `:15`. Sólo bandeja,
sin correo (S-17).

**(f) Nunca ejecuta.** Prueba de comportamiento (dos pasadas sobre un vencido en cada espera: ningún `status` cambia y
`ticket_transitions` no gana filas) y prueba de fuente (molde `comentariosVigilados.test.ts:22`): los dos ficheros nuevos no
importan `ticketService`, `applyTransition` ni `writeTransition`, y no contienen `UPDATE tickets` ni `INSERT INTO ticket_transitions`.

**Registro de plazos** (`plazosEsperas.ts`): `MEDICION_PLAZOS_ESPERAS = { clave: 'medicion/p90-esperas-2026-10-21', fecha:
'2026-10-21' }`; `PLAZO_DIAS_ESPERA` ER 79, `Solicitado` 13, SE 31, SKU 20, literales; `diasEnEspera(desde, hoy) =
diasEntre(diaEnZona(desde)!, hoy)` (`contratos.ts:123`, `fechasDerivadas.ts`); `esperaVencida = dias >= plazo` (S-4). No importa
`sla.ts` (prueba de fuente, mutación 6).

## D5 · Cliente y regla 13

`TransitionPanel.tsx:55` gana `const [salidas, setSalidas] = useState(SALIDAS_ESPERAS_APAGADO); useEffect(() => {
getContextoSalidasEsperas().then(setSalidas).catch(() => {}) }, [])`. `:57`: `puedeEjecutarTransicionConDecisionales(user, t,
decisionales)` pasa a `puedeEjecutarConSalidasEsperas(user, t, { status, derivadoA: derivadoActual?.id ?? null }, decisionales,
salidas)` y se añade `&& visibleConSalidasEsperas(t.id, salidas.activo)`. `:179`: si `ejecutorDeSalida(...)` da `respaldo`, un `<Field
f={CAMPO_MOTIVO_RESPALDO}>` más. Imports al final de `:3` y `:8`. `derivadoActual` ya llega (`TicketDetailView.tsx:338`).
**Interruptor al cliente:** ruta nueva `GET /api/permisos/salidas-esperas` (`routes/permisosSalidasEsperas.ts`, molde
`permisosControlCalidad.ts:12-18`) con `contextoSalidasEsperas(db, config.salidasEsperas === true)`, añadida al final de
`services/decisionales.ts` (misma vacante que la guarda); registro en las dos líneas que nombran
`registerPermisosControlCalidadRoutes` (`app.ts:22`, `:61`); `getContextoSalidasEsperas` al final de `apps/desk/src/api/client.ts`.

| Decisión que toma el cliente | Línea del servidor que la impone |
|---|---|
| Oculta las dos nuevas con el interruptor apagado | `ticketService.ts:128` (`409`, `exigirInterruptorSalidasEsperas`) |
| Oculta las tres salidas a quien no es persona a cargo ni respaldo | `:131` (`403`, `exigirEjecutorSalida`) |
| Ofrece `cobro` a la persona a cargo sin cargo con DPC encendido | `:131` (Decisionales sólo con `!ejecutor`) |
| Pide «Motivo del respaldo» al respaldo | `:134` (`422`, `errRespaldo`) |
| No lo pide a la persona a cargo | `:134` (`422` si llega con texto) |
| Vacante del Coordinador Técnico | `services/decisionales.ts:10-13`, la misma función en la ruta y en la guarda |
| Sin respuesta de la ruta, apagado | ninguna: degradación; puede mostrar `anulacion` desde ER/SE que el servidor encendido rechace (S-20) |

## D6 · Vigilantes y cifras (lista cerrada contra el grep de hoy; un rojo fuera de ella se anota como desviación)

| Fichero:línea | Hoy → nuevo |
|---|---|
| `invariantesGrafo.test.ts:50-53` · `:172-174` | 38 → 40 · unión 50 → 52 (40 + 7 + 5) |
| `invariantesGrafo.test.ts:381-391` | sin cambio (tercer parámetro por defecto `false`); bloque NUEVO al final: encendido 4 con `cobro_diagnostico_espera`, RQ-TS-63 y M5 |
| `mapaBlueprint.test.ts:52`, `:184` | 46 → 49 (`cobro` sale de dos estados) |
| `tipoEvento.test.ts:21` · `:43-47` · `:49-51` | +2 filas en la línea · 52 → 54, `[38,7,5,2]` → `[40,7,5,2]` · `[19,16,13,4]` → `[19,17,14,4]`, servicio `[12,11,11,4]` → `[12,12,12,4]` |
| `transitions.test.ts:123`, `:126` | 33 → 35 heredan (5 proponen) |
| `estados.test.ts:142-147` · `:177-179` | diez → nueve (`Solicitado` gana segunda salida) · seis → cinco |
| `cargos.test.ts:204-205` | 2.200 → 2.310 (5 × 11 × (40 + 2)) |
| `prioridad.test.ts:118-120` | 38 → 40; esperado gana `cobro_diagnostico_espera: []`, `sin_pieza_en_almacen: []` |
| `transitionsSoporteRemoto.test.ts:57-58` · `cifrasAncladas.test.ts:24`, `:58`, `:70` | 50 → 52 · `{ 40, 23, 49 }` |
| `apps/desk/server/permisos.test.ts:43-57`, `:72-81`, `:89-103` | 114 → 120 (73 prohibidos, 47 permitidos) |
| `permisos.test.ts:349-353` · `:356-368`, `:446`, `:458` | 114 → 120 (74 / 46) · 1.026 → 1.080 (40 × 3 × 9) |
| `cargoPermiso.test.ts:250-266` | 114 → 120; `diferencias` sin cambio |
| `transicionesEjecucion.test.ts:185`, `:188`, `:229-234`, `:250-266`, `:283-285` | +2 casos; 38 → 40; salidas de ER, SE y `Solicitado` con las nuevas; 44 → 47 ejecuciones |
| `flujoSoporteRemoto.test.ts:112` · `deployControlCalidad.test.ts:14`, `:17-20` | 50 → 52 · la §16 se acota hasta la §17 y deja de ser la última |
| `openspec/config.yaml:1361-1362`, `:1368` · `docs/artefactos/blueprint-*.md` | 46 → 49, 38 → 40 · `npm run generar-mapa-blueprint` |

**Barridos HTTP con las dos nuevas** (permisos ×2, `cargoPermiso`, `transicionesEjecucion`): app con `salidasEsperas: true` y el
ticket sembrado con `derivado_a` = el usuario de la sesión, en la línea del `INSERT` (molde `conRemisionVigente`): el área sigue
decidiendo el esperado y nadie manda motivo. `anulacion` sigue en la app apagada. Hipótesis sin cambio (lo confirma el lote 1a):
`reentrancia.test.ts` y `bodegaje.test.ts` (`sin_pieza` no tiene fecha y `cobro` sale del ciclo), `decisionales.test.ts`.

## D7 · Migración: no

`tickets.derivado_a` (`schema.sql:123`) y `public.alarmas_avisadas` existen; sin estado ni columna nuevos. Sólo la variable
`SALIDAS_ESPERAS`: `DEPLOY.md` §17 tras §16 (`:776`, con «**Qué enciende:**», «**Qué se rompe si se pone mal:**», «**Nace cerrado**»
y `> SALIDAS_ESPERAS=`), `.env.example` tras `:43` con sus dos frases, y `deploySalidasEsperas.test.ts` (molde
`deployControlCalidad.test.ts`). Vuelta atrás: el interruptor sin `true`.

## D8 · Supuestos nuevos, riesgos y lotes

- **S-12** Persona a cargo = `s.id === derivado_a` con el área; «activo» lo da la sesión (D2). **S-13** «Motivo del respaldo» fuera
  del catálogo, sólo en la traza. **S-14** La persona a cargo con motivo recibe `422`. **S-15** Apagado, la clave se trata como
  cualquier ajena y llega a la traza (hoy). **S-16** Entrada = último paso de `secuenciaDelReloj`; sin historia, no se mide.
  **S-17** Bandeja sin correo; una pasada por día civil. **S-18** Sin destinatarios no se marca. **S-19** El área de respaldo sólo
  sin cargos; el derivado de Comercial se suma en las externas. **S-20** Sin la ruta, el panel asume apagado. **S-21** Vacante del
  Coordinador Técnico por `contextoDecisionales`, también con DPC apagado. **S-22** `cobro` no cuenta en `areasSiguientes`.
- **R-7** `estados.ts:131-140` sigue describiendo «la única salida» y «un alta en otro sistema», desfasado con c3; fuera de D10, se
  anota en el `archive-report` para el expediente. **R-8** Una espera con SLA futuro compartiría tabla de marcas: lo vigila D4 (b).

| Intento | Contenido | Ingenua | × 1,8 |
|---|---|---|---|
| I3a | catálogo, `areasSiguientes`, interruptor (ids y visibilidad), `config.ts`, `appHarness`, `plazosEsperas.ts`, `controlCalidad.ts`, `estados.ts`, vigilantes de `shared`, `cifras_ancladas`, mapa, RQ-TS-56/60/62/63, RQ-AV-25 | 320 | 576 |
| I3b | `ejecutorDeSalida`, `erroresMotivoRespaldo`, compuesta y sus pruebas (RQ-PM-42/43 puras); `DEPLOY.md` §17, `.env.example`, vigilante de despliegue | 255 | 459 |
| I4 | guardas de `ticketService.ts`, ruta y contexto, `salidasEsperas.test.ts` HTTP (RQ-TS-61, -64, RQ-PM-42..45), barridos HTTP de D6, cliente | 325 | 585 |
| I5 | `esperasVencidas.ts`, `avisoSalidasEsperas.ts`, `index.ts`, sus pruebas (RQ-AV-26/27, disjunción, fuente), corrección del maestro (D13), barrido de citas | 335 | 603 |

Verify (I6) y archive (I7) como en la propuesta. Si un lote mide más de 600 antes de cerrar, sus pruebas de caracterización
salen a un intento propio.
