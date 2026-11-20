# Diseño — `pasada-en-seco-sin-fecha-zoho` (F1F-01, `cierra: no`)

Entrada: `openspec/changes/pasada-en-seco-sin-fecha-zoho/proposal.md` y su delta de `zoho-sync` (RQ-ZS-68..71; 11 escenarios ROJO y 4 de
CARACTERIZACIÓN). Partida `d2a735a4`: toda cita a una línea que esta tanda edita lleva «en `d2a735a4`»; las líneas nuevas se nombran, no se
citan. **Corrección obligada a D-1** (§2, S-8): la fila simulada no se arma en `packages/shared/src/marcadorMigracion.ts`, porque nombrar allí
el id del marcador pone roja RQ-TZ-28.

## 1. Enfoque y flujo de datos

Una regla pura en `shared` cuenta, por regla, los migrables cuyo marcador cambia el estado y no tendría fecha de Zoho. Decide `entradaDelMarcador`
(`packages/shared/src/marcadorMigracion.ts:42-52`), la única noción (`packages/shared/src/marcadorMigracion.ts:10-11`), sobre la historia leída
por la MISMA función que `conFechaDeZoho`, sacada al final de `apps/desk/server/db/sla.ts`.

```
migrarTicketsAbiertos ─► prepararInforme(q, corte, aplicar, ahora) ─► leerPlanes ─► planes ─┬─► resumen, cierres, avisos (como hoy)
                                                                                            └─► ids de aMigrar ─► etapasDeZohoPorTicket(q, ids)
   sinFechaDeZohoDeMigracion(planes, Map, ahora) ─► por plan `migrar`: filaDelMarcadorDeMigracion ─► entradaDelMarcador
entradasActuales ─► conFechaDeZoho ─► etapasDeZohoPorTicket        (la misma lectura, no una copia)
```

**Seco:** `q` es `db`, sin `BEGIN` ni escritura. **Con `aplicar`:** `q` es el cliente de `enTransaccion`, y `prepararInforme` corre antes de la
negativa (`apps/desk/server/db/migracionTicketsAbiertos.ts:70`) y del bucle (`apps/desk/server/db/migracionTicketsAbiertos.ts:71-91`): la lectura
precede al primer marcador, también con negativa. `ahora` ya está definido en `apps/desk/server/db/migracionTicketsAbiertos.ts:66`.

## 2. Decisiones

| # | Decisión | Descartado | Por qué |
|---|---|---|---|
| D-1 (corregida) | La regla pura, al final de `marcadorMigracion.ts`, con la firma del encargo; la fila del marcador la arma `filaDelMarcadorDeMigracion`, al final de `packages/shared/src/migracionTickets.ts`, junto a la definición del id (`packages/shared/src/migracionTickets.ts:14`) | Importar el id en `packages/shared/src/marcadorMigracion.ts:3` en `d2a735a4`, como decía D-1 | P13 (`apps/desk/server/migracionMarcadorLectores.test.ts:252-268`) exige que sólo cuatro ficheros de producción lo nombren (D-12, `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:36`; lo declara también `packages/shared/src/marcadorMigracion.ts:8`): un quinto la pone roja. `migracionTickets.ts` ya es de los cuatro, y no importa nada del módulo: sin ciclo |
| D-3 | `etapasDeZohoPorTicket(db, ids: readonly string[])`, tipo de vuelta inferido, `[...ids]` al consultar | Exportar `conFechaDeZoho`; módulo nuevo | `params` es `unknown[]` (`packages/zoho-sync/src/db/migrate.ts:6`) y no admite un `readonly`; `apps/desk/server/db/sla.ts:2` no se toca |
| D-6 | El bucle no se refactoriza; P4 enfrenta la fila simulada con la escrita | Usar el ayudante en el bucle | Más de 60 citas al bucle (S-4) |
| D-10 | La guarda de `DEPLOY.md` normaliza `\r\n` antes de acotar la viñeta | Buscar `\n\n` a secas | El árbol está en CRLF (las 1.196 líneas acaban en retorno de carro); `.gitattributes:29` sólo fija el índice |

D-2, D-4, D-5, D-7, D-8 y D-9: como la propuesta, §4.

## 3. Código exacto por edición

**Regla:** ninguna línea se inserta, borra ni mueve en medio: o se edita la misma línea física, o se añade tras la última. Los seis ficheros
editados están en CRLF: tras editar, `file <f>` debe decir «with CRLF line terminators» (si dice «CRLF, LF»: `perl -i -pe 's/(?<!\r)\n/\r\n/' <f>`).
Los comentarios nuevos de producción no llevan citas `ruta:línea`, ni el nombre de la constante del id ni su valor entre comillas (P13), ni la
sentencia de alta en `ticket_transitions` (inventario exacto de `apps/desk/server/escritoresTransiciones.test.ts:55`).

**3.1 `packages/shared/src/migracionTickets.ts`, tras la línea 142** (una línea en blanco y):

```ts
/**
 * pasada-en-seco-sin-fecha-zoho (F1F-01), RQ-ZS-69 · la fila del marcador que escribiría `migrarTicketsAbiertos` para un plan `migrar`, reducida
 * a lo que lee `entradaDelMarcador`. Vive aquí, junto al id, porque RQ-TZ-28 no deja nombrarlo fuera de sus cuatro ficheros. El bucle NO la usa
 * (S-4): una prueba enfrenta las dos filas. Va al final del fichero para no desplazar ninguna línea citada.
 */
export function filaDelMarcadorDeMigracion(t: TicketParaMigrar, eq: Equivalencia, instante: Date) {
  const cierre = cierreDeMigracion(eq, t.closedTime ?? null, instante)
  return {
    transition_id: ID_TRANSICION_MIGRACION, from_status: t.status, to_status: eq.destino === t.status ? null : eq.destino,
    values: { regla: eq.regla, ...(cierre && { closed_time_destino: cierre.closedTime, cierre_origen: cierre.origen }) },
  }
}
```

**3.2 `packages/shared/src/marcadorMigracion.ts`.** `packages/shared/src/marcadorMigracion.ts:3` en `d2a735a4`, en sitio, queda:
`import type { HistorialTransition, HistoryDetail } from './types'; import { filaDelMarcadorDeMigracion, type PlanTicket, type ReglaEquivalencia } from './migracionTickets'`.
Nada más cambia en las líneas 1 a 103. Tras la 103 (una línea en blanco y):

```ts
/**
 * pasada-en-seco-sin-fecha-zoho (F1F-01), RQ-ZS-68 y RQ-ZS-69 · cuántos tickets a migrar dejaría S-11 sin fecha de Zoho, y cuáles, por regla.
 * Existe para que la pregunta `s11-migrados-sin-fecha-de-zoho` se decida con el número delante: un marcador que cambia el estado sin fecha deja
 * en `null` la secuencia entera del reloj (S-11, `resolverMarcador`, más arriba). Decide `entradaDelMarcador`, la ÚNICA noción de «entrada con
 * fecha de Zoho»; no hay una segunda (p. ej. `closedTime` nulo; molde H5). Medir no es corregir: `resolverMarcador` no se toca. Una regla que
 * cambia el estado figura aunque todos tengan fecha (`tickets: 0`); identidad y «Pendiente» de soporte no figuran. Va al final del fichero.
 */
export interface SinFechaDeZoho { tickets: number; porRegla: { regla: ReglaEquivalencia; tickets: number; numeros: number[] }[] }
export function sinFechaDeZohoDeMigracion(
  planes: readonly PlanTicket[], etapasPorTicket: ReadonlyMap<string, readonly HistorialTransition[]>, instante: Date,
): SinFechaDeZoho {
  const r: SinFechaDeZoho = { tickets: 0, porRegla: [] }
  for (const { ticket: t, accion, equivalencia: eq } of planes) {
    if (accion !== 'migrar' || !eq) continue
    const e = entradaDelMarcador(filaDelMarcadorDeMigracion(t, eq, instante), etapasPorTicket.get(t.id) ?? [])
    if (e === null || e.tipo === 'ninguna') continue
    let g = r.porRegla.find((x) => x.regla === eq.regla)
    if (!g) { g = { regla: eq.regla, tickets: 0, numeros: [] }; r.porRegla.push(g) }
    if (e.desde === null) { g.tickets++; g.numeros.push(t.number); r.tickets++ }
  }
  return r
}
```

**3.3 `apps/desk/server/db/sla.ts`.** Las cuatro primeras líneas sustituyen a `apps/desk/server/db/sla.ts:135-138` en `d2a735a4` (a igual número de
líneas); la quinta, a `apps/desk/server/db/sla.ts:142` en `d2a735a4`:

```ts
  // La historia de Zoho se lee en UN solo sitio, `etapasDeZohoPorTicket` (al final de este fichero): la usa también el informe de
  // la migración para contar, con esta misma lectura y `entradaDelMarcador`, los marcadores que S-11 dejaría sin fecha (RQ-ZS-69,
  // pasada-en-seco-sin-fecha-zoho). No se copia aquí. Una consulta para todos los `ids`; sin marcadores no se llega hasta aquí.
  const etapas = await etapasDeZohoPorTicket(db, ids)
    const e = entradaDelMarcador({ ...f, values: json(f.values) }, etapas.get(String(f.ticket_id)) ?? [])
```

Tras la 146 (una línea en blanco y lo de abajo). Da lo mismo que hoy: `etapasDesdeHistoria([])` es `[]` (`packages/shared/src/etapasDesdeHistoria.ts:86`).

```ts
/**
 * pasada-en-seco-sin-fecha-zoho (F1F-01), RQ-ZS-69 · LA lectura de la historia de Zoho por ticket: los `TicketUpdated` de `ids` en UNA consulta
 * (lista `IN`), cada ticket por `etapasDesdeHistoria`. Sale de `conFechaDeZoho` sin copiarse; el informe de la migración no tiene consulta propia.
 * Con `ids` vacío no consulta; un ticket sin historia no figura (el llamador pone `[]`). Va al final para no desplazar ninguna línea citada.
 */
export async function etapasDeZohoPorTicket(db: Queryable, ids: readonly string[]) {
  const etapas = new Map<string, ReturnType<typeof etapasDesdeHistoria>>()
  if (ids.length === 0) return etapas
  const m = ids.map((_, i) => `$${i + 1}`).join(', ')
  const h = await db.query(`SELECT ticket_id, raw FROM ticket_history WHERE event_name = 'TicketUpdated' AND ticket_id IN (${m})`, [...ids])
  const crudo = new Map<string, unknown[]>()
  for (const r of h.rows as Array<{ ticket_id: string; raw: unknown }>) crudo.set(String(r.ticket_id), [...(crudo.get(String(r.ticket_id)) ?? []), json(r.raw)])
  for (const [id, eventos] of crudo) etapas.set(id, etapasDesdeHistoria(eventos))
  return etapas
}
```

**3.4 `apps/desk/server/db/migracionTicketsAbiertos.ts`**, siete líneas en sitio:

| Línea | Operación | Texto |
|---|---|---|
| `apps/desk/server/db/migracionTicketsAbiertos.ts:5` en `d2a735a4` | añadir tras la última coma | ` sinFechaDeZohoDeMigracion, type SinFechaDeZoho,` |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:8` en `d2a735a4` | añadir al final | `; import { etapasDeZohoPorTicket } from './sla'` |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:25` en `d2a735a4` | añadir al final | `; sinFechaDeZoho: SinFechaDeZoho` |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:41` en `d2a735a4` | `aplicar: boolean)` pasa a | `aplicar: boolean, ahora: Date)` |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:58` en `d2a735a4` | añadir tras `cierresDeMigracion(planes),` | ` sinFechaDeZoho: sinFechaDeZohoDeMigracion(planes, await etapasDeZohoPorTicket(q, aMigrar.map((p) => p.ticket.id)), ahora),` |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:67` en `d2a735a4` | `opts.corte, false)` pasa a | `opts.corte, false, ahora)` |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:69` en `d2a735a4` | `opts.corte, true)` pasa a | `opts.corte, true, ahora)` |

**3.5** `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56` en `d2a735a4`: la lista gana `'sinFechaDeZoho'` entre `'sinEquivalencia'` y
`'sinRemisionVigente'` (orden de `sort()`: E < F < R). **3.6** `DEPLOY.md:673` en `d2a735a4`: tras «se consulta a Gerencia.» y antes del retorno
de carro (Edit, o `perl -i -pe 's/(Gerencia\.)(\r?)$/$1 <frase>$2/ if $. == 673'`), esta frase, que empieza por un espacio y no lleva números de
línea (una abreviada se atribuiría al fichero citado antes en la misma línea):

```text
 El informe trae también `sinFechaDeZoho`: cuántos tickets a migrar quedarían sin fecha de Zoho por el supuesto S-11 de `marcador-migracion-lectores`, y cuáles, por regla; no impide aplicar, y es el dato que Gerencia necesita para la pregunta `s11-migrados-sin-fecha-de-zoho` (vale el de la pasada en seco inmediatamente anterior a aplicar).
```

## 4. Pruebas (strict_tdd), en tres ficheros NUEVOS (D-9)

**(a) `packages/shared/src/sinFechaDeZohoDeMigracion.test.ts`.** Planes con `planDeTicket` (corte `2026-12-01T05:00:00Z`), etapas con el ayudante de
`packages/shared/src/marcadorMigracion.test.ts:7-9`. U1 filtro `migrar`: ya gobernado, tras el corte y sin equivalencia dan `{ tickets: 0, porRegla: [] }`.
U2 «Pendiente» de servicio: sin entrada a «Pendiente» cuenta con su número; con ella figura a cero; la etapa de OTRO ticket no le vale. U3 identidad y
«Pendiente» de `Soporte remoto` (`packages/shared/src/flujos.ts:113`): `porRegla: []`. U4 «Entregado» sin `closedTime` cuenta y con él no, y coincide con
`cierresDeMigracion(planes).conFechaDeMigracion`. U5 orden de primera aparición y suma. U6 `filaDelMarcadorDeMigracion`: `to_status` nulo en identidad y
soporte, destino en las otras dos, `esPasoDeMigracion` la reconoce, sólo «Entregado» lleva `cierre_origen`. U7 sin planes, `{ tickets: 0, porRegla: [] }`.

**(b) `apps/desk/server/db/migracionSinFechaDeZoho.test.ts`.** Copia `CORTE`, `ANTES` y `tk` (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:17-26`),
el espía con `verbos` y `escrituras` (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:34-44`) y `nHistoria` con `cambioDeZoho`
(`apps/desk/server/migracionMarcadorLectores.test.ts:100-108`); `json` de `./ticketFuentes`. `fixture()`: t4100 «Entregado»; t4200 con `closed`; t4300
«Pendiente» `Reparación` con un cambio «Pendiente» → «Ingresado» (sale, no entra); t4400 igual con «Ingresado» → «Pendiente» el 2026-10-20T14:00Z;
t4500 «En Proceso»; t4600 «Pendiente» `Soporte remoto`; t4700 `Reparación` `managed`; t4800 `Reparación` creado el 2026-12-02. `ESPERADO`: propuesta, §4.

| Id | `it(...)` | Aserción |
|---|---|---|
| P1 | `P1 · en seco: dos sin fecha por regla, con sus números; ni BEGIN ni escrituras y UNA lectura de ticket_history` | `toEqual(ESPERADO)`; sin `BEGIN`; `escrituras` vacío; una sola sentencia con `FROM ticket_history` |
| P2 | `P2 · «entregado-a-finalizado» coincide con cierres.conFechaDeMigracion y da sus números (H5)` | `tickets` = `cierres.conFechaDeMigracion` = 1; `numeros` `[4100]` |
| P3 | `P3 · con aplicar=true, el mismo campo que en seco y la lectura de ticket_history antes del primer marcador` | seco sobre `db` y luego espía con `aplicar`: campos iguales, `aplicado`; índice de `FROM ticket_history` > -1 y menor que el del primer alta en `ticket_transitions` |
| P4 | `P4 · la predicción en seco es la realidad tras aplicar` | marcadores escritos + `etapasDeZohoPorTicket` + `entradaDelMarcador`: los de `desde` nulo = `porRegla.flatMap(numeros)`, ordenados |
| P5 | `P5 · con negativa y aplicar=true trae el campo, aplicado false y ninguna escritura` | fixture + t4900 «Estado raro»: `ESPERADO`, `negativa` no nula, sin escrituras |
| P6 | `P6 · sin migrables: { tickets: 0, porRegla: [] } y ninguna lectura de ticket_history` | sólo t4700 y t4800 |
| P7 | `P7 · una regla con todos fechados figura con tickets 0 y numeros vacíos` | sólo t4200 y t4400: las dos reglas a cero |
| C1 | `caracterización · el resto del informe no cambia: cierres, negativa, aplicado y avisos` | `cierres` `{1, 1}`, `negativa` nula, `aplicado` falso, `avisos` = sólo el de `apps/desk/server/db/migracionTicketsAbiertos.ts:53` |
| C2 | `caracterización · entradasActuales tras aplicar: con fecha entra, sin fecha e identidad no; sin marcadores no lee ticket_history` | t4300, t4400 y t4500 en «En Proceso»: sólo t4400, con su fecha; `['Pendiente']` sobre t4700 y t4800: sin `ticket_history` |

**(c) `apps/desk/server/deployPasadaEnSecoSinFechaZoho.test.ts`**, molde `apps/desk/server/deployPoolConexionCortada.test.ts:22-36`. Pura
`faltasPasadaEnSeco(texto)`: normaliza `\r\n`; acota la §14 entre `## 14. ` y `## 15. ` (`DEPLOY.md:663`, `DEPLOY.md:754`) y, dentro, la viñeta desde
`- **Una pasada en seco**` (`DEPLOY.md:672`) hasta la primera línea en blanco; con espacios plegados exige `sinFechaDeZoho`, `s11-migrados-sin-fecha-de-zoho`
y `no impide aplicar`. P8a el real, sin faltas. P8b sin el nombre (`split/join` y `expect(sin).not.toBe(deploy)`): `['sinFechaDeZoho']`. P8c posición: sin
el nombre en la viñeta y con él al final del fichero, o delante de «Los cinco pasos» (`DEPLOY.md:675`, fuera de la viñeta): sigue la falta.

**Mapa.** RQ-ZS-68: fixture → P1, U1-U5; sin migrables → P6; a cero → P7; resto (CAR) → C1. RQ-ZS-69: coincide → P2; predicción → P4; «Pendiente» con
entrada → P1, U2; `conFechaDeZoho` igual (CAR) → C2, `apps/desk/server/migracionMarcadorLectores.test.ts:41-44` y `apps/desk/server/migracionMarcadorLectores.test.ts:113-122`.
RQ-ZS-70: seco → P1; `aplicar` → P3; negativa → P5; no cambian (CAR) → C1. RQ-ZS-71: nombra → P8a, P8c; sin nombre → P8b; S-11 y entorno (CAR) →
`packages/shared/src/marcadorMigracion.test.ts:86` y `git diff --exit-code d2a735a4 -- .env.example packages/zoho-sync/src/db/schema.sql`.
**Orden TDD:** primero la lista de claves y los tres ficheros; ROJAS `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56` en `d2a735a4`, U1-U7 (por
importación), P1-P7 y P8a-c; VERDES de nacimiento C1, C2 y las caracterizaciones existentes. Después el código, todo verde.

## 5. Mutaciones (CA-8), con el lote ya commiteado

Por cada una: `file <f>` y `cp <f> <scratchpad>/antes-Mn`; la orden; `npx vitest run <ficheros>` y ver el rojo; el `perl` inverso; `cmp` sin salida,
`file` igual que antes y `git diff --exit-code -- <f>`. Nunca `sed -i`. En línea nueva, `N` es la que dé `grep -n` (patrón único). Las rojas son «al menos».

```bash
# M1 quitar el cálculo (rojas P1 P2 P3 P4 P5 P7)
perl -i -pe 's/\QsinFechaDeZohoDeMigracion(planes, await etapasDeZohoPorTicket(q, aMigrar.map((p) => p.ticket.id)), ahora)\E/{ tickets: 0, porRegla: [] }/ if $. == 58' apps/desk/server/db/migracionTicketsAbiertos.ts
# M2 entradaDelMarcador siempre con fecha (rojas P1 P2 U2 U4 y el P1 de L1 de migracionMarcadorLectores)
perl -i -pe 's/de, estado, desde \}/de, estado, desde: desde ?? "M2" }/ if $. == 51' packages/shared/src/marcadorMigracion.ts
# M3 la regla ignora la historia: cuenta t4400 (rojas P1 P4 P5 P7 U2)
perl -i -pe 's/\QetapasPorTicket.get(t.id) ?? []\E/[]/ if $. == N' packages/shared/src/marcadorMigracion.ts
# M4 sin el filtro migrar: cuenta t4700 y t4800 (rojas P1 P5 P6 U1)
perl -i -pe 's/if \(accion !== \x27migrar\x27 \|\| !eq\) continue/if (!eq) continue/ if $. == N' packages/shared/src/marcadorMigracion.ts
# M5 to_status simulado siempre el destino: figuran identidad y soporte (rojas P1 P4 P5 U3 U6)
perl -i -pe 's/to_status: eq\.destino === t\.status \? null : eq\.destino/to_status: eq.destino/ if $. == N' packages/shared/src/migracionTickets.ts
# M6 POSICIÓN (regla de mutación 1): seco igual; con aplicar, el campo se calcula tras el bucle (rojas P3 por el espía y P5)
perl -i -pe 's/sinFechaDeZoho: sinFechaDeZohoDeMigracion\(/sinFechaDeZoho: aplicar ? { tickets: 0, porRegla: [] } : sinFechaDeZohoDeMigracion(/ if $. == 58' apps/desk/server/db/migracionTicketsAbiertos.ts
perl -i -pe 's/^(\s*)informe\.aplicado = true/$1informe.sinFechaDeZoho = sinFechaDeZohoDeMigracion(aMigrar, await etapasDeZohoPorTicket(q, aMigrar.map((p) => p.ticket.id)), ahora); informe.aplicado = true/ if $. == 92' apps/desk/server/db/migracionTicketsAbiertos.ts
# M7 ensuciar el FICHERO VIGILADO (regla de mutación 2): sin el nombre (rojas P8a, P8b y P8c)
perl -i -pe 's/sinFechaDeZoho/sinFecha/ if $. == 673' DEPLOY.md
# M8 la lectura devuelve el mapa vacío (rojas P1 P5 P7 C2 y el P1 de L1 de migracionMarcadorLectores: la lectura es una sola)
perl -i -pe 's/if \(ids\.length === 0\) return etapas/return etapas/ if $. == N' apps/desk/server/db/sla.ts
```

M6 deja el código sano: compila y da el mismo valor, sólo en otro sitio; P1, P2, P6 y P7 siguen verdes y la ve P3 (y P5, por la negativa). El
P1 de L1 es `apps/desk/server/migracionMarcadorLectores.test.ts:113-122`.

## 6. Regla 13 (regla de mutación 3), lote y presupuesto

El cliente no toma ninguna decisión sobre el campo: `git diff --stat d2a735a4 -- apps/desk/src` vacío; la regla vive en `shared` y la impone el
servidor. Tras `npm run build`, `apps/desk/dist/assets/` debe seguir con `index-F1jDYjEU.js` (hipótesis: el cliente no importa las funciones nuevas y
se eliminan del paquete); si cambia, se despliega también el cliente y el parte lo dice. **Un solo lote.** Bruto (añadidas + borradas):
`marcadorMigracion.ts` 28, `migracionTickets.ts` 14, `sla.ts` 26, ejecutor 14, lista de claves 2, `DEPLOY.md` 2, unitarias 65, servidor 115, guarda 40:
**~306**; × 1,8 = **~550**; con `apply-progress.md` (~100), **~650 < 800**. Medida: `git diff --shortstat --no-renames <commit de partida del intento>`
más `wc -l` de lo nuevo sin trackear.

## 7. Barrido de citas (regla de mutación 4), al cierre

Nada se desplaza: sólo pueden cambiar por CONTENIDO las citas a líneas editadas. Sobre el repositorio sin `node_modules`:
`grep -rnoE "<módulo>\.ts:[0-9]+(-[0-9]+)?"` para `migracionTicketsAbiertos`, `db/sla`, `marcadorMigracion`, `shared/src/migracionTickets` y
`migracionTicketsAbiertos\.test`, y `grep -rnoE "DEPLOY\.md:[0-9]+(-[0-9]+)?"`; abreviadas con ``grep -rnE "<módulo>\.ts.*`:[0-9]+"`` y lectura humana.
Previsto (medido hoy), todas caso A:

| Línea editada | Citas fuera de este cambio | Caso |
|---|---|---|
| `apps/desk/server/db/migracionTicketsAbiertos.ts:5` en `d2a735a4` | `openspec/changes/archive/2026-10-25-normalizar-estados-zoho/apply-progress.md:135`, `openspec/changes/archive/2026-10-25-normalizar-estados-zoho/apply-progress.md:288`, `openspec/changes/archive/2026-10-25-normalizar-estados-zoho/design.md:241` («importa `normalizarEstado`») | A |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:67` en `d2a735a4` | `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/verify-report.md:48` («pasa `db`, no `enTransaccion`»); rangos que la contienen en `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/verify-report.md:47` y `openspec/changes/archive/2026-10-11-migracion-una-sola-ejecucion/design.md:5` | A |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:25` en `d2a735a4` y `apps/desk/server/db/migracionTicketsAbiertos.ts:58` en `d2a735a4` | abreviadas en `openspec/changes/archive/2026-10-16-fecha-cierre-migracion/design.md:119` (dónde editó aquella tanda) | A |
| `apps/desk/server/db/sla.ts:135-138` en `d2a735a4`, `apps/desk/server/db/sla.ts:142` en `d2a735a4` | ninguna; de la 127 en adelante sólo `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/archive-report.md:21`, a la 132, que no cambia | A |
| `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56` en `d2a735a4` | `openspec/changes/archive/2026-10-11-rechazo-migracion-409/design.md:69` (sin claves `motivo` ni `error`), `openspec/changes/archive/2026-10-16-fecha-cierre-migracion/design.md:80` (ganó `'cierres'` en sitio) | A |
| `DEPLOY.md:673` en `d2a735a4` | `openspec/changes/archive/2026-10-16-fecha-cierre-migracion/design.md:59` (cita las líneas 22 y 24 del ejecutor, y lo sigue haciendo) | A |

`packages/shared/src/marcadorMigracion.ts:3` en `d2a735a4` y las líneas 8, 41 y 69 del ejecutor sólo las citan los artefactos de este cambio, anclados.
Una que describa el comportamiento previo es caso B: se le añade «en `d2a735a4`» en su misma línea física. No se editan `openspec/config.yaml` ni
`docs/sdd/ENTRADA.md`.

## 8. Supuestos

S-1..S-7: los de la propuesta, §6. Nuevos:

- **S-8** La fila simulada vive en `packages/shared/src/migracionTickets.ts`, no en `marcadorMigracion.ts` (D-1 corregida). *Lo deshace:* moverla y
  ampliar a cinco la lista de P13, que relaja RQ-TZ-28 y pide decisión.
- **S-9** `etapasDeZohoPorTicket` no pone en el mapa los tickets sin historia; los llamadores usan `?? []`. *Lo deshace:* rellenar cada id.
- **S-10** La regla pura recibe el `ahora` del informe para `cierreDeMigracion`; el origen «migracion» nunca fecha, así que el instante no cambia la
  cifra (uno inválido lanza `RangeError`, como el ejecutor). *Lo deshace:* el parámetro `instante`.

## 9. Matriz de amenazas y vuelta atrás

| Frontera | Aplica | Comportamiento |
|---|---|---|
| Enrutado, permisos, interruptor, shell, subprocesos, VCS y CI | N/A | la ruta y su permiso no cambian y el campo no enciende escritor; `perl` sólo en mutaciones a mano, con `cmp` |
| Ficheros leídos en pruebas | Sí, sólo pruebas | P8 lee `DEPLOY.md`; P13 ya lee el árbol y debe seguir verde |
| Datos de producción | Lectura | en seco sólo lee; con `aplicar`, una lectura más dentro de la transacción, sin bloqueo de fila nuevo (hipótesis; la integración real no cambia) |

Vuelta atrás: revertir la fusión y redesplegar el servidor; nada queda en la base. Ninguna pregunta bloquea: S-8 es la única desviación del encargo.
