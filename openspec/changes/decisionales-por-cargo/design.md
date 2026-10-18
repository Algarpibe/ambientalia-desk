# Diseño — `decisionales-por-cargo` (F1C-05, `cierra: no`)

Base: `7ff08c8`. Requisitos: RQ-PM-28 a RQ-PM-31 (`specs/permissions/spec.md`). Ningún fichero muy citado desplaza líneas:
lo nuevo va en ficheros nuevos, al final de los existentes o dentro de una línea que ya existe (regla de mutación 4).

## D1 · `packages/shared/src/decisionales.ts` (nuevo) — la regla pura

`cargos.ts` no se toca: sus líneas están citadas (`cargos.ts:12-15`, `:27-35`, `:45-53`, `:56-58`) y la regla nueva sólo
**consume** `EXCEPCIONES_POR_CARGO`, `esCargo` y `puedeEjecutarTransicion`. Importa además `tipoEventoDeTransicion`
(`tipoEvento.ts:11-15`): el tipo se resuelve **por id**, nunca del objeto que pasa quien llama, así que un objeto sin
`tipoEvento` no esquiva la regla. Sin ciclo: `tipoEvento → flujos → transitions` no importa `cargos`.

```ts
export type AreaDeDecision = 'Servicio Técnico' | 'Comercial'
export interface ContextoDecisionales { activo: boolean; coordinadorTecnicoVacante: boolean }
export const DECISIONALES_APAGADO: ContextoDecisionales            // { activo: false, coordinadorTecnicoVacante: false }, congelado
export const AREA_DE_DECISION_MIXTAS: Readonly<Record<string, AreaDeDecision>>
  // rechazo_revision → Servicio Técnico · rechazo_comercial → Comercial · rechazo_garantia → Comercial (excepción)
export function areaDeDecision(t: { id: string; area: string }): AreaDeDecision | null
export function cargosDecisionales(area: AreaDeDecision, coordinadorTecnicoVacante: boolean): readonly Cargo[]
export function cargosQueFaltanParaDecisional(t, s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>, ctx): readonly Cargo[] | null
export function puedeEjecutarTransicionConDecisionales(s: SujetoDePermiso, t, ctx): boolean
export function mensajeDecisional(nombreTransicion: string, cargos: readonly Cargo[]): string
```

`cargosQueFaltanParaDecisional`, en este orden: `!ctx.activo` → `null`; `s.isAdmin` → `null`; tipo distinto de
`Decisional` → `null`; id en `EXCEPCIONES_POR_CARGO.transiciones` → `null` (la lista corta la decide
`cargoQueFaltaParaTransicion`); área de decisión → cargos permitidos (sin área: `[]`, falla cerrada, S-6); cargo efectivo
(`esCargo`) en la lista → `null`; si no, la lista. `null` = no restringe; una lista (aunque vacía) = falta.

`puedeEjecutarTransicionConDecisionales` = `puedeEjecutarTransicion(s, t) && cargosQueFaltanParaDecisional(t, s, ctx) === null`:
área y lista corta primero, sin ampliar nada.

Mensaje: `La transición "<nombre>" es Decisional: sólo la ejecutan los cargos <A, B[, C]>`; con lista vacía,
`… es Decisional y no tiene área de decisión asignada`. `export * from './decisionales'` al final de
`packages/shared/src/index.ts`.

## D2 · El interruptor en `packages/zoho-sync/src/config.ts`

- Interfaz: la línea 66 (`}`) pasa a `  decisionalesPorCargo: boolean } // F1C-05 …`, en esa misma línea para no mover
  `:88` ni `:120-123`, que están citadas.
- `loadConfig`: `decisionalesPorCargo: env.DECISIONALES_POR_CARGO === 'true',   // default OFF (F1C-05)` como línea nueva
  después de `:123`; sólo se mueven las dos líneas finales, que nadie cita (barrido hecho al diseñar).
- Prueba: un `describe` nuevo al final de `config.test.ts`, con los mismos literales que el de E-231 (`:32-36`).

## D3 · El servidor

- `apps/desk/server/services/decisionales.ts` (nuevo): `contextoDecisionales(db, activo)`. Apagado devuelve
  `DECISIONALES_APAGADO` **sin consultar**; encendido, `coordinadorTecnicoVacante` =
  `(await destinatariosDeCargoPermiso(db, 'Coordinador Técnico')).length === 0` (`apps/desk/server/db/avisos.ts:121-127`,
  activos y por `cargo_permiso`).
- `ticketService.ts:131`: detrás de `if (cargoFalta) throw …;` y en la misma línea, `const faltanDecisional =
  config?.decisionalesPorCargo ? cargosQueFaltanParaDecisional(t, user, await contextoDecisionales(db, true)) : null; if
  (faltanDecisional) throw new HttpError(403, { error: mensajeDecisional(t.name, faltanDecisional) });`. Sin `config`
  (pruebas antiguas que llaman al servicio directo) es «apagado». Los imports se añaden a líneas de import existentes
  (`:6`, `:7`). Así el `403` nuevo queda tras el `409` de estado (`:126-128`), el `403` de área (`:129-130`) y el de cargo
  (`:131`), y antes de la prioridad, la OVI, la verificación y todo `422`.
- `apps/desk/server/routes/permisosDecisionales.ts` (nuevo): `GET /api/permisos/decisionales` con `requireAuth(db)` y
  `asyncHandler`, que responde `contextoDecisionales(db, config.decisionalesPorCargo)`. Se registra al final de la línea de
  registros de `app.ts:60`.
- `testing/appHarness.ts:46` y `:49`: `decisionalesPorCargo` en el tipo de `overrides` y `false` por defecto, en sus líneas.

## D4 · El cliente

- `apps/desk/src/api/client.ts`: `getContextoDecisionales()` al final del fichero.
- `TransitionPanel.tsx`: en la línea 55 (`const { user } = useAuth()`), el estado `decisionales` con
  `DECISIONALES_APAGADO` y un `useEffect` que lo pide una vez y se queda apagado si falla; en `:57`,
  `puedeEjecutarTransicionConDecisionales(user, t, decisionales)` en lugar de `puedeEjecutarTransicion(user, t)`; imports
  en `:3` y `:8`. Ninguna línea se mueve. El `.tsx` queda fuera de la red de pruebas por decisión de Gerencia (F0-00): el
  filtro es comodidad y la guarda es el `403` probado (regla 13, punto 3).

## D5 · `DEPLOY.md`

Sección nueva **al final**, `## 15. DECISIONALES_POR_CARGO …`: qué enciende (el `403` de las 13 Decisionales sin lista
corta para quien no tiene el cargo de su área, y el filtro de botones), qué se rompe si se pone mal (encendido sin cargos
asignados, sólo los administradores ejecutan Decisionales; encendido antes de tiempo, contra la decisión), **no antes del
14/12/2026**, asignar `cargo_permiso` antes, y las dos líneas para el fichero de ejemplo de entorno (que ninguna sesión lee,
`DEPLOY.md:335-336`).

## D6 · Pruebas y orden TDD

- `packages/shared/src/decisionales.test.ts` (nueva): la tabla de las 14 escrita a mano contra el barrido de
  `CATALOGO_POR_FLUJO`; cada escenario de RQ-PM-29. Rojo por módulo inexistente.
- `config.test.ts`: los literales de RQ-PM-28. Rojo por `undefined`.
- `apps/desk/server/decisionalesPorCargo.test.ts` (nueva), con `appWith({ decisionalesPorCargo })`, `userCookie` y
  `conRemisionVigente`: la caracterización con el interruptor apagado, los escenarios de RQ-PM-30 (incluidas las cuatro de
  posición, cada una con las dos guardas activas a la vez) y RQ-PM-31.

## D7 · Mutaciones (con `herramientas/mut.mjs`, restaurando y comprobando)

| Id | Fichero | Mutación | Debe caer |
|---|---|---|---|
| M1a | `config.ts` | `=== 'true'` → `!== 'false'` | `config.test.ts` |
| M1b | `config.ts` | `=== 'true'` → `.toLowerCase() === 'true'` | `config.test.ts` |
| M2 | `ticketService.ts` | `config?.decisionalesPorCargo ?` → `true ?` | caracterización apagada |
| M3 | `decisionales.ts` | `Técnico` en la lista técnica | Técnico encendido (shared y servidor) |
| M4a | `decisionales.ts` | vacante siempre `true` | Especialista con Coordinador activo |
| M4b | `decisionales.ts` | vacante siempre `false` | Especialista sin Coordinador |
| M5a | `decisionales.ts` | `rechazo_revision` → Comercial | mixtas |
| M5b | `decisionales.ts` | quitar `rechazo_garantia` de la tabla (cae al área `Comercial / Compras`, sin cargos) | mixtas |
| M6 | `decisionales.ts` | quitar la exclusión de la lista corta | `liberacion_sin_factura` con `Coordinador Comercial` |
| M7a-c | `ticketService.ts` | la guarda nueva delante del `409` de estado / del `403` de área / del `403` de cargo | posición |
| M8 | `ticketService.ts` | la guarda nueva detrás de `valoresConFechasDerivadas` | 403 antes que 422 |

## D8 · Lotes e intentos

| Intento | Lote | Contenido | Estimación ×1,8 |
|---|---|---|---|
| 3 | 1 | D1, D2 y sus pruebas, mutaciones M1, M3-M6 en shared | ~470 |
| 4 | 2 | D3, D4, D5, prueba del servidor, mutaciones M2, M3-M8 en servidor, paquete del cliente | ~580 |

## D9 · Barrido de la regla de mutación 4 en el cierre

`ticketService.ts`, `app.ts`, `appHarness.ts`, `TransitionPanel.tsx` y `config.test.ts`/`index.ts`/`client.ts`/`DEPLOY.md`
(final) no mueven líneas: se comprueba con `git diff --numstat` (inserciones = borrados en los primeros cuatro). En
`config.ts` se mueven sólo las dos últimas líneas; se barren las citas `config.ts:12[0-9]`.

## D10 · Ni migración ni datos

Sin columna nueva (`cargo_permiso` ya existe, RQ-PM-13) y sin escritura en datos. El paquete del cliente crece por la regla
compartida y la llamada nueva: se mide con `npm run build` antes y después.
