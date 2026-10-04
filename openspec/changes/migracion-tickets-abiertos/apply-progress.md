# Progreso de aplicación — `migracion-tickets-abiertos` (F1F-01)

Modo: strict TDD, `auto · hybrid · ask-on-risk · 800`. Los lotes 2 y 3 fusionan aquí.

## Lote 1 — deltas alineados y núcleo puro

Partida del lote: `18dc1f93ef488ceb09791b38c895b14ac1230e39` (`git rev-parse HEAD` en el worktree
`migracion-tickets-abiertos`; intento abierto con el token indicado por el orquestador).

### Tareas hechas

1.1 a 1.20, salvo lo que se anota abajo en «Pendiente del orquestador» (el `cli.ts` de citas y la medida final con
sus códigos). 1.17: `git diff` de `packages/shared/src/index.ts` da una inserción y cero borrados; el núcleo quedó sin
mutaciones (comparado byte a byte con la copia previa a las mutaciones).

### 1.1 — ediciones a los deltas (el diseño manda), una línea cada una

- a. `tickets-core` RQ-TC-40: «Pendiente» y «Entregado» se deciden antes que la identidad; la regla 1 excluye a «Pendiente».
- b. RQ-TC-40: los cuatro nombres de regla y `statusTypeDestino` (`null` = no se cambia).
- c. RQ-TC-40 regla 3: `statusTypeDestino = 'Open'` (D-10); quitada la «Hipótesis» sobre el `status_type` de un `Pendiente`.
- d. RQ-TC-41: `planDeTicket(t, corte)` + `resumenDeMigracion` + `esperaRemisionDeEntrada`; la vigencia es del ejecutor;
  `corte` ausente o sin forma de fecha es `400` de la ruta; el núcleo lanza `RangeError` si el `Date` es inválido
  (**supuesto reversible no escrito en el diseño**).
- e. RQ-TC-41: precedencia fija ya-gobernado → tras-el-corte → sin-equivalencia → migrar; el bloqueo se limita a los que se migrarían.
- f. RQ-TC-41: `pendientes` por ticket, `yaGobernados` en dos recuentos, `sinEquivalencia` agrupado, `porEstado` con
  `cambiaEstado`; escenario «Totales…» reescrito (más escenarios de precedencia y de `esperaRemisionDeEntrada`).
- g. `zoho-sync` RQ-ZS-17: fuera `modified_time = now()`; `updated_at` sí; `source` intacto; `status_type` sólo si D-10;
  escenario «`modified_time` y `source` intactos».
- h. RQ-ZS-17 marcador: `to_status` `NULL` en identidad (D-6), claves de `"values"`, `area`, `performed_by`,
  `transition_name`; escenario «el marcador de identidad no mueve `entradasActuales`».
- i. RQ-ZS-17 `aplicar`: ausente o `false` seco, `true` aplica, otro valor `400` (D-12); escenario reescrito.
- j. RQ-ZS-17 `corte`: instante ISO con desfase, fecha pelada `400` (D-11); escenario nuevo.
- k. RQ-ZS-17 negativa: `409` con informe completo, en seco `200` con `negativa` rellena (D-13); informe con `negativa`,
  `aplicar`, `aplicado`, `numeracion`, `avisos`; escenario de `numeracion.arrastra` a un lado y otro de 10000.
- l. RQ-ZS-17 transacción: en seco no hay transacción (D-2); al aplicar la lectura va dentro (D-1); `UPDATE … WHERE
  managed_by_app = false RETURNING id` y se deshace todo si no devuelve fila (D-3); escenario nuevo.
- m. RQ-ZS-18: `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`, prefijo `-- REV `, una sentencia por regla que cambia el
  estado más una de identidad (restaura sólo `managed_by_app`), filtro por `"values"->>'status_type_previo'`; el
  hueco del diseño §8 queda declarado.
- n. RQ-ZS-17: el informe va también al log; «en `avisos`» de D-7 se lee como el campo del informe (**hipótesis**).
- o. Esta lista, y las referencias cruzadas del diseño: `openspec/changes/migracion-tickets-abiertos/design.md:47` (D-15)
  dice «§8» para los lotes y los lotes son el §9 (`openspec/changes/migracion-tickets-abiertos/design.md:197`); la
  tabla de pruebas y mutaciones es el §8 (`openspec/changes/migracion-tickets-abiertos/design.md:171`). No encontré
  ningún «§7» mal citado en el diseño: los «solapamientos del §7» de `tasks.md` apuntan bien al orden de guardas
  (`openspec/changes/migracion-tickets-abiertos/design.md:157`).

### Rojo (1.6)

`npx vitest run packages/shared/src/migracionTickets.test.ts` con la prueba escrita y sin módulo:

    Error: Cannot find module './migracionTickets' imported from '…/packages/shared/src/migracionTickets.test.ts'
     Test Files  1 failed (1)
          Tests  no tests

Verde (1.11): `Test Files 1 passed (1)`, `Tests 30 passed (30)`.

### Tabla de mutaciones (reproducibles; el fichero se restauró tras cada una)

Todas sobre `packages/shared/src/migracionTickets.ts`; se corre `npx vitest run packages/shared/src/migracionTickets.test.ts`.

| # | Edición exacta | Rojo (resultado medido) |
|---|---|---|
| M1 (regla 1, posición) | Insertar, **antes** de la línea `  if (estadoZoho === 'Pendiente') {`, la línea `  if (ESTADOS_DE_LA_APP.has(estadoZoho)) return { destino: estadoZoho as Estado, regla: 'identidad', statusTypeDestino: null }` | 5 caen, entre ellas ««Pendiente» de servicio va a «En Proceso» con status_type «Open»» |
| M2 (regla 1) | Intercambiar las dos ramas `else if (t.createdTime !== null && new Date(t.createdTime).getTime() > corte.getTime()) accion = 'tras-el-corte'` y `else if (equivalencia === null) accion = 'sin-equivalencia'` | 2 caen: «precedencia: tras el corte y sin equivalencia es «tras-el-corte»» y «un sin equivalencia gobernado o posterior al corte no bloquea…» |
| M3 (idempotencia) | `  if (t.managedByApp) accion = 'ya-gobernado'` → `  if (false) accion = 'ya-gobernado'` | 6 caen, entre ellas «precedencia: gobernado y sin equivalencia es «ya-gobernado»» |
| M4 | Sacar `r.masAltoAMarcar = r.masAltoAMarcar === null ? t.number : Math.max(r.masAltoAMarcar, t.number)` de la rama que migra y ponerlo como primera línea del cuerpo del `for` (sobre todos los planes) | 2 caen: «masAltoAMarcar es sólo sobre los que migran» y «masAltoAMarcar es null si nada migra». (Quitar la línea sin más también la deja roja: cae sólo la primera) |
| M5 | `getTime() > corte.getTime()` → `getTime() >= corte.getTime()` | 1 cae: «corte en el instante exacto: createdTime igual al corte se migra» |

Una primera versión de M1 (sólo anteponer la identidad para los no-«Pendiente») no rompía nada, como es de esperar: no
cambia ningún resultado. La que vale es la de la tabla.

### Regla 13 del lote (1.18)

La tabla de equivalencias y el plan viven en `packages/shared/src/migracionTickets.ts` y consumen `ESTADOS`
(`packages/shared/src/estados.ts:112`) y `esClasificacionSoporteRemoto` (`packages/shared/src/flujos.ts:116-119`); no
duplican la lista de nombres ni el predicado. El cliente (`apps/desk/src`) no participa: este lote no lo toca.

### Desviaciones del diseño y de las tareas

- **Ninguna de comportamiento.** `Equivalencia`, `TicketParaMigrar`, `PlanTicket` y las tres funciones siguen el §4 del diseño.
- `ResumenMigracion` (diseño §4 sólo lo nombra) se concretó con los campos del informe que salen del núcleo: `abiertos`,
  `migrables`, `porEstado`, `sinEquivalencia`, `yaGobernados`, `trasElCorte`, `pendientes`, `masAltoAMarcar`.
  `sinRemisionVigente`, `numeracion`, `negativa`, `avisos` y `aplicar/aplicado` son del ejecutor.
- Decisiones menores de ese resumen, **supuestos reversibles** y sin cambio de alcance: `porEstado` y `pendientes` cuentan
  sólo los que se migran; `equivalencia` se calcula siempre en `planDeTicket` (también para gobernados y posteriores al
  corte), y `accion` decide qué se hace con ella; `createdTime` con texto no interpretable se trata como no posterior al corte.
- `npm test` sale con código 1 **por una prueba ajena a este lote** (ver «Riesgos»).

### Para la bandeja

- `apps/desk/server/reconciliacion/registro.test.ts:220` fija «en curso» en exactamente OCHO tandas
  (`'F0-04'`, `'F1B-03'`, `'F1B-04'`, `'F1B-07'`, `'F1B-08'`, `'F1B-11'`, `'F1C-05'`, `'F1F-05'`). Al existir el
  `proposal.md` de este cambio (`tanda: F1F-01`, `cierra: no`) aparece una novena, `F1F-01`, y la prueba cae: fallaba
  ya en `18dc1f9` antes de tocar nada de producción. No se tocó (fuera de alcance); necesita decisión de quien lleve la
  reconciliación (¿actualizar la cifra a NUEVE al fusionar?).

### Medida y cierre (1.19, 1.20)

Ver el informe de retorno del apply: códigos de salida de `npm test` (1, por lo de arriba), `npm run typecheck` (0) y
`npm run lint -- --max-warnings 165` (0, 165 avisos). El detector de citas lo corre el orquestador tras su commit.

### Añadido por el orquestador al cerrar el lote 1

- La prueba `apps/desk/server/reconciliacion/registro.test.ts:218` contaba ocho tandas «en curso» sobre el árbol real; la cabecera de esta propuesta (`tanda: F1F-01`, `cierra: no`) añade la novena. Se actualizó la cifra y la lista (entra `F1F-01` entre `F1C-05` y `F1F-05`), igual que hicieron F1B-03 y F1F-05 al entrar. Cuenta en la medida del lote: 2 líneas insertadas y 2 borradas.
- Las cinco mutaciones (M1 a M5) las reprodujo el orquestador con `mut.mjs`: 5, 2, 6, 2 y 1 pruebas en rojo, y el fichero restaurado tras cada una.
