# Delta for vistas-tablero

Contexto: `openspec/specs/vistas-tablero/spec.md`. `RQ-VT-04` (`spec.md:111-128`) cita el predicado
**en `boardView.ts:39`**, con la expresión literal
`(ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')`. La Pieza 2 de
`por-entregar-es-espera` extrae ese `.includes()` a un módulo propio de `apps/desk/src/lib` y lo hace
consumir también desde `ClienteDetalle.tsx:18` — el segundo sitio que CLASIFICA, distinto de los dos
que PINTAN (`ClienteDetalle.tsx:22`, `TicketDetailView.tsx:245`). El requisito no cambia de fondo
—clasificar por el registro, no por regex—; cambian su ubicación y sus consumidores, que pasan de uno
a dos, y se fija por escrito el límite que Gerencia decidió en Q1: el predicado **MUST NOT** alcanzar
a quien pinta.

**Hereda, no reabre.** `spec.md:119-125` ya razonó, al archivar F1B-08, por qué el requisito consume
`.includes()` sobre `ESTADOS_EN_ESPERA` y no `enEsperaDe(estado)` — devolver la CLASE en vez de un
booleano obligaría al cliente a reescribir el criterio «externa o interna», «el mismo defecto IV-1
movido un metro». Esta tanda no reabre esa decisión.

## MODIFIED Requirements

### Requirement: RQ-VT-04 · «Espera» y «Abiertos» clasifican por el registro de dominio, no por el nombre del estado

`applyBoardView` **SHALL** clasificar un ticket como «en espera» consultando el registro de dominio
`ESTADOS_EN_ESPERA` (`packages/shared/src/estados.ts:114`) a través de un predicado compartido, en un
módulo propio de `apps/desk/src/lib` (forma propuesta en `proposal.md §3`: `enEspera.ts`,
`esEstadoEnEspera(status?: string | null): boolean`; la confirma `sdd-design`) — hoy inline en
`boardView.ts:39` como `(ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')` —, y
**MUST NOT** usar ninguna expresión regular sobre `status`. Es la regla invariable 13, punto 1: la
clasificación existe en `packages/shared` y el cliente la consume.

El predicado compartido **SHALL** tener EXACTAMENTE **dos** consumidores, los dos que CLASIFICAN:
`boardView.ts:39` (vistas `espera` y `abiertos`, `:47-48`) y `ClienteDetalle.tsx:18` (sub-vista de
espera de la ficha de cliente, consumida en `:96` y en la sub-vista de `:98`). El requisito
**MUST NOT** extenderse a quien PINTA: `ClienteDetalle.tsx:22` (dentro de `badgeClass`) y
`TicketDetailView.tsx:245` (`/espera|hold/i` en el `className`) deciden color, no clasificación, y
**SHALL** conservar su propia expresión regular — decisión de Gerencia, Q1: `Por Entregar` no es un
atasco (el equipo está listo, falta que el cliente venga) y el propio tablero ya lo pinta azul
(`TicketCard.tsx:21`). `ClienteDetalle.tsx` **SHALL** llevar un comentario junto a `:18`/`:22` que
declare deliberada la divergencia entre las dos líneas y su porqué: sin él, el siguiente lector las
unifica y reintroduce el ámbar que Q1 rechazó.

**Se hereda la decisión D3 de `design.md`, no se reabre.** `enEsperaDe(estado)`
(`packages/shared/src/estados.ts:163-167`) devuelve la CLASE (`externa | interna | ninguna |
sin_clasificar`), no un booleano, y consumirla obligaría al cliente a reescribir el criterio «externa
o interna» que `estados.ts` ya posee — el mismo defecto IV-1 movido un metro. Esta tanda sólo traslada
el `.includes()` ya existente a un módulo propio y le añade el segundo consumidor que ya clasificaba
con su propia regex; no cambia el criterio.

(Previously: el predicado vivía inline en `boardView.ts:39`, con **un** consumidor. `ClienteDetalle.tsx:18`
implementaba su propia copia con `/espera/i`, acertando 2 de los 9 estados vigentes antes de esta
tanda.)

#### Scenario: los seis estados que se escapaban aparecen bajo «espera» y no bajo «abiertos»
- GIVEN tickets abiertos en cada uno de los seis estados que la regex vieja no reconocía
  (`Servicio externo`, `Notificación cliente`, `Notificación a Compras`, `Notificación Comercial`,
  `Solicitado`, `Liberación Comercial`)
- WHEN se filtra por `espera` y por `abiertos`
- THEN los seis aparecen en `espera` y ninguno aparece en `abiertos`

#### Scenario: mutación — el fichero vigilado, no una copia (evidencia histórica de la implementación)
- GIVEN que, durante la implementación, se revirtió temporalmente `boardView.ts:39` a `/espera/i`, con
  el registro de `estados.ts` ya existente
- WHEN corrieron dos detectores: el tripwire nuevo (importa `applyBoardView` y afirma sobre su salida)
  y el viejo, que entonces vivía en `packages/shared/src/estados.test.ts:113-121` y reimplementaba la
  regex localmente
- THEN el nuevo se puso rojo y el viejo se quedó verde. Esa discrepancia demostró que el viejo vigilaba
  una copia del código, no el código (ver capacidad `transitions-st`, requisito 3.6). El tripwire viejo
  **ya no existe**: se retiró al cerrar IV-1, y este escenario no es repetible tal cual hoy — queda
  como registro de la evidencia que cerró el hallazgo

#### Scenario: fixture corregido, prueba por la razón correcta
- GIVEN que el fixture de `boardView.test.ts:11` usaba `'En espera de repuesto'`, un estado que no
  existe en el registro (el real es `'En Espera de Repuestos'`, `estados.ts:61`)
- WHEN se corrige el fixture a la cadena real
- THEN `boardView.test.ts:20` y `:21` — hoy verdes por casualidad, porque la regex vieja también
  casaba con la cadena inventada — quedan verdes contra el registro real, no contra la coincidencia
  accidental

#### Scenario: los dos estados de entrega entran en «espera» y no en «abiertos»
- GIVEN un ticket abierto en `Por Entregar` y otro en `Por Entregar / Sin facturar`, los dos con
  `statusType` distinto de `'Closed'`
- WHEN se filtra por `espera` y por `abiertos`
- THEN los dos aparecen en `espera` y ninguno aparece en `abiertos`

#### Scenario: la ficha de cliente cuenta un `Por Entregar` bajo «espera»
- GIVEN un cliente con un ticket en `Por Entregar`
- WHEN se consulta la sub-vista «espera» de `ClienteDetalle.tsx:96` (`tickets.filter(esEspera)`, tras
  consumir el módulo compartido)
- THEN ese ticket aparece en esa sub-vista

#### Scenario: el límite se mantiene — el color no se mueve
- GIVEN un ticket en `Por Entregar`
- WHEN se evalúan `ClienteDetalle.tsx:22` (`badgeClass`) y `TicketDetailView.tsx:245`
- THEN los dos siguen devolviendo su clase de color por omisión — azul (`bg-blue-50 text-blue-600
  border-blue-200` y `bg-blue-500` respectivamente) — y no la de ámbar, porque ninguna de las dos
  expresiones regulares (`/espera/i`, `/espera|hold/i`) casa con `'Por Entregar'`

#### Scenario: el comentario que declara la divergencia deliberada existe
- GIVEN `ClienteDetalle.tsx:18` (clasifica, consume el módulo compartido) y `:22` (pinta, conserva
  `/espera/i`)
- WHEN se inspecciona el fichero
- THEN hay un comentario junto a esas líneas que declara la divergencia deliberada entre las dos y su
  porqué — verificable por lectura o por `grep`, no por `vitest`: el fichero es `.tsx` y queda fuera de
  la red de pruebas (`vitest.config.ts:16`, `:17-20`; F0-00, decisión que esta tanda no reabre)

### Requirement: RQ-VT-05 · Un ticket cerrado nunca aparece bajo «Espera»

La vista `espera` **MUST NOT** devolver ningún ticket con `statusType === 'Closed'`, aunque su
`status` esté en `ESTADOS_EN_ESPERA`.

#### Scenario: cerrado en un estado de espera no aparece en «espera» — hueco de detector cerrado
- GIVEN un ticket con `statusType: 'Closed'` y `status` en `ESTADOS_EN_ESPERA` (p. ej. `'Solicitado'`)
- WHEN se filtra por `espera`
- THEN el ticket no aparece
- (Antes de esta tanda, el fixture de `boardView.test.ts` no tenía ningún `Closed` en estado de
  espera, así que quitar el filtro de cerrados de la rama `espera` — `boardView.ts:48` — no lo
  detectaba nadie. Este escenario cierra ese hueco)

(Previously: el requisito no tenía escenario para los dos estados de entrega, porque no eran
`en_espera` hasta esta tanda.)

#### Scenario: los dos estados de entrega, cerrados, tampoco aparecen en «espera»
- GIVEN un ticket con `statusType: 'Closed'` y `status: 'Por Entregar'`, y otro con
  `statusType: 'Closed'` y `status: 'Por Entregar / Sin facturar'`
- WHEN se filtra por `espera`
- THEN ninguno de los dos aparece: el filtro de cerrados (`boardView.ts:48`) sigue aplicándose ANTES
  de comprobar la clasificación, también para los dos estados nuevos (regla de mutación 1 — M3 de
  `proposal.md §6` exige que quitar ese orden ponga esto en rojo)
