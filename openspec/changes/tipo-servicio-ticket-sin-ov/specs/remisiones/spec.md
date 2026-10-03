# Delta para remisiones — noción única de «remisión de entrada vigente» (F1B-03, parte L, lote 1)

## ADDED Requirements

### RQ-RE-20 · «Remisión de entrada vigente» tiene una sola definición, y una prueba la enfrenta al recuento de `Remisión creada`

El repositorio **SHALL** tener **una** definición de «remisión de entrada vigente», y la guarda de `habilitar_servicio`
(`transitions-st` RQ-TS-33) y el cliente **SHALL** consumirla. Hoy hay tres nociones de la misma idea (molde H5, ninguna
rota por separado):

| Noción | Dónde | `anulada_at IS NULL` | `estado` | `tipo` |
|---|---|---|---|---|
| Pendiente de una remisión nueva | `apps/desk/server/db/remisiones.ts:67-73` | sí | sólo `pendiente` | no filtra |
| Remisiones del panel del ticket | `apps/desk/server/db/remisiones.ts:76-79` | sí | cualquiera | no filtra |
| Recuento que mueve `Remisión creada` | `apps/desk/server/db/estadoPorRemision.ts:43-47` | sí | `ok` u `ok_con_avisos` | no filtra |

**La definición (supuesto S-1, reversible; Q4):** `tipo = 'entrada'`, `anulada_at IS NULL` y `estado` `ok` u
`ok_con_avisos`. **SHALL** vivir como predicado puro en `packages/shared`. Las dos primeras nociones **MUST NOT**
cambiar de comportamiento: cumplen otro oficio (la unicidad de una remisión en curso, RQ-RE-06; el listado del panel), y
`estadoPorRemision.ts` **MUST NOT** reescribirse (su recuento mueve el estado del ticket).

**Una prueba SHALL enfrentar la guarda y el recuento** de `sincronizarEstadoPorRemision`, recorriendo la misma tabla de
filas: `pendiente`, `error`, `ok`, `ok_con_avisos`, anulada, histórica `ok`, y una segunda vigente tras una anulada. Para
todos los casos de `tipo = 'entrada'` las dos **SHALL** coincidir. La **única divergencia declarada** es `tipo`: el recuento
no lo filtra y la guarda sí; hoy no puede darse porque `createRemision` escribe siempre `'entrada'`
(`apps/desk/server/db/remisiones.ts:44-53`), y llegará con la remisión de salida (F1B-17). La prueba **SHALL** nombrarla.

#### Scenario: Guarda y recuento coinciden en todos los casos de entrada
- GIVEN un ticket con, por separado, una remisión `pendiente`, `error`, `ok`, `ok_con_avisos`, anulada, histórica `ok`, y otra vigente tras una anulada
- WHEN se evalúan la guarda de `habilitar_servicio` y el recuento de `sincronizarEstadoPorRemision`
- THEN cada caso de `tipo = 'entrada'` da el mismo veredicto (vigente o no) en las dos

#### Scenario: La divergencia por `tipo` está declarada
- GIVEN una fila no anulada, en `ok`, con `tipo` distinto de `entrada`, insertada a mano
- WHEN se evalúan la guarda y el recuento
- THEN la guarda no la cuenta, el recuento sí, y la prueba lo declara como única divergencia conocida

#### Scenario: Una remisión pendiente sigue bloqueando la creación de otra
- GIVEN un ticket con una remisión `pendiente` no anulada
- WHEN se evalúa la noción de pendiente (`remisionPendienteDe`)
- THEN sigue devolviéndola, y la guarda de «Habilitar Servicio» sigue diciendo que no hay una vigente

#### Scenario: El listado del panel no cambia
- GIVEN un ticket con remisiones de cualquier estado, algunas anuladas
- WHEN se lista con `listRemisionesByTicket`
- THEN devuelve las no anuladas de cualquier estado, como antes, y el cliente aplica el predicado compartido encima

#### Scenario: El cliente no redefine «vigente»
- GIVEN `apps/desk/src` y `packages/shared`
- WHEN se buscan condiciones sobre `estado`, `anulada_at` o `tipo` de una remisión para decidir el botón
- THEN la decisión sale del predicado compartido y no hay copia de la regla en el cliente

## Fuera de alcance — para el `archive-report`

- La fusión de este requisito **no** modifica RQ-RE-11 (el recuento sigue siendo la fuente del estado `Remisión creada`).
- **Lote 3 (condicionado a Q1):** si la OVI se restringe en la puerta de la remisión de entrada, entra en el mismo `if`
  de `apps/desk/server/routes/remision.ts:220`, sin mover las guardas vecinas (IV-12). Está en el borrador de `permissions`,
  no aquí.
