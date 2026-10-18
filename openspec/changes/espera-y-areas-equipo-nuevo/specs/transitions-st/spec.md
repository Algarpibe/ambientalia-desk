# Delta para transitions-st

## MODIFIED Requirements

### RQ-TS-17 · Los dos estados de entrega pasan a espera externa

`Por Entregar` y `Por Entregar / Sin facturar` **SHALL** estar clasificados `'externa'` en
`CLASIFICACION_EN_ESPERA` (`packages/shared/src/estados.ts:59-106`), y sus dos entradas **SHALL**
vivir físicamente dentro del bloque `externa` del registro, no en el de `ninguna`: la lista **SHALL**
seguir agrupada por clase y no por orden alfabético, porque se lee para comprobar la clasificación
(`estados.ts:56-57`).

`ESTADOS_EN_ESPERA` **SHALL** tener **once** entradas tras la reclasificación: `externa` pasa de tres
a **cinco** (`En Espera de Repuestos`, `Servicio externo`, `Notificación cliente`, `Por Entregar`,
`Por Entregar / Sin facturar`) e `interna` se queda en **seis**. El array que fije la prueba **SHALL**
comprobarse contra la salida real de `ESTADOS.filter(...)` (`estados.ts:120`), nunca al revés: mover
las dos entradas cambia su POSICIÓN dentro de `ESTADOS_EN_ESPERA`, y un `toEqual` escrito de memoria
fijaría el orden equivocado. Desde E-226 son **doce**, con `Pendiente` la última (`RQ-TS-39`).

Es fundamento nuevo, no la modificación de un requisito existente: `transitions-st` no declaraba antes
un requisito formal sobre la composición de `CLASIFICACION_EN_ESPERA`; sólo la mencionaba en prosa
(`RQ-TS-15`, §3.2, §3.7).

#### Scenario: los dos estados de entrega entran en el bloque `externa`
- GIVEN el registro `CLASIFICACION_EN_ESPERA` tras esta tanda
- WHEN se inspeccionan las entradas `'Por Entregar'` y `'Por Entregar / Sin facturar'`
- THEN las dos valen `'externa'` y están dentro del bloque rotulado `externa`, no del bloque `ninguna`

#### Scenario: `ESTADOS_EN_ESPERA` pasa de nueve a once, con el orden fijado contra el filtro
- GIVEN el registro reclasificado
- WHEN se calcula `ESTADOS_EN_ESPERA` (`ESTADOS.filter(...)`, `estados.ts:120`)
- THEN el resultado tiene **once** entradas, en el orden que produce el filtro sobre el registro
  agrupado por clase — no en el orden que tenía la lista de nueve con las dos añadidas al final
  (doce desde E-226, `RQ-TS-39`)

### RQ-TS-25 · `Pendiente` pasa a ser estado sólo de soporte remoto

`Pendiente` **SHALL** figurar en `ESTADOS_SOLO_SOPORTE_REMOTO` y **SHALL NOT** figurar en
`ESTADOS_SERVICIO`, que **SHALL** tener exactamente **20** estados (supuesto S-1; antes 21). `ESTADOS`
**SHALL** seguir en **23**, porque `soporte_pendiente` y `continuacion_soporte` usan `Pendiente`; su clase
en `CLASIFICACION_EN_ESPERA` la fija `RQ-TS-39` (`externa` desde E-226; era `sin_clasificar`).
`FASE_POR_ESTADO` **SHALL NOT** contener `Pendiente` y el reparto de fases **SHALL** pasar de 4·12·5 a
4·11·5. `ESTADOS_SIN_SALIDA` y la columna de tablero `pendiente` **SHALL** quedar sin
cambio. Ninguna lista del reloj del SLA **SHALL** contener `Pendiente` (supuesto S-4: si el diseño encuentra
una, se quita en esta tanda).

#### Scenario: los registros dicen 20 / 23 y `Pendiente` es sólo de soporte remoto
- GIVEN el registro de estados tras el cambio
- WHEN se leen `ESTADOS_SERVICIO`, `ESTADOS` y `ESTADOS_SOLO_SOPORTE_REMOTO`
- THEN `ESTADOS_SERVICIO` tiene 20 sin `Pendiente`, `ESTADOS` tiene 23 y `ESTADOS_SOLO_SOPORTE_REMOTO` incluye `Pendiente`

#### Scenario: el bucle de soporte remoto no se ve afectado
- GIVEN un ticket `Soporte remoto` en `En Proceso`
- WHEN ejecuta `Soporte pendiente` y `Continuación soporte`
- THEN pasa por `Pendiente` y vuelve a `En Proceso`, con `200` las dos veces

#### Scenario: mutación sobre el registro vigilado — `Pendiente` fuera de la lista sólo-SR
- GIVEN `Pendiente` quitado de `ESTADOS_SOLO_SOPORTE_REMOTO` y fuera del catálogo de servicio
- WHEN corre `invariantesGrafo.test.ts`
- THEN falla el invariante 1 (regla de mutación 2)

#### Scenario: el reloj del SLA no nombra `Pendiente`
- GIVEN la tabla de alarmas de `packages/shared/src/sla.ts`
- WHEN se inspeccionan sus claves
- THEN son exactamente `Notificado`, `Remisión creada` y `Notificación cliente`

### RQ-TS-26 · La cifra anclada del maestro dice 31 / 35 / 20 en el mismo commit que el código

`openspec/config.yaml` **SHALL** declarar en `cifras_ancladas` `transiciones` = 31, `pasos_del_mapa` = 35 y
`estados` = 20 de servicio, y **SHALL** cerrar la `divergencia` caducada de `pasos_del_mapa`. La descripción
de la capacidad `transitions-st` en `capabilities` **SHALL** decir «31 transiciones y 20 estados». Estos
valores **SHALL** coincidir con `TRANSITIONS.length`, con las aristas del diagrama completo y con
`ESTADOS_SERVICIO.length`, y **SHALL** cambiar en el mismo commit que el código.

#### Scenario: las tres cifras coinciden con el código
- GIVEN `cifras_ancladas` y el código tras el cambio
- WHEN se comparan
- THEN 31 = `TRANSITIONS.length`, 35 = aristas del diagrama completo y 20 = `ESTADOS_SERVICIO.length`

#### Scenario: la mención a `Pendiente` de `esperas` queda coherente
- GIVEN la entrada `esperas` de `cifras_ancladas`
- WHEN se lee su recuento de estados de servicio
- THEN no cuenta `Pendiente` entre los 20; el recuento de espera que lee el barrido es el del código (12 desde E-226,
  `RQ-TS-39`), y la prosa de esa entrada la actualiza Supervisión

## ADDED Requirements

### RQ-TS-39 · E-226: `Pendiente` es espera externa; `Verificación` y `Solicitud Soporte` no son espera

`CLASIFICACION_EN_ESPERA` (`packages/shared/src/estados.ts:59-106`) **SHALL** clasificar `Pendiente` como `'externa'`,
`Verificación` como `'ninguna'` y `Solicitud Soporte` como `'ninguna'` (`decision/e226-espera-y-areas-equipo-nuevo`,
17/10: «es espera lo que depende de alguien de fuera»; `Solicitud Soporte`, supuesto del analista). Ningún estado
**SHALL** quedar `sin_clasificar`, que **SHALL** seguir siendo valor válido del tipo `EnEspera` (`estados.ts:40`).
`ESTADOS_EN_ESPERA` **SHALL** tener **doce** entradas, las once de antes en su orden y `Pendiente` la última.

- Las tres entradas **SHALL** quedarse en las líneas que ocupaban (`estados.ts:101-105`), una por línea, con la
  excepción a la agrupación por clase escrita en su comentario: el fichero está muy citado y mudarlas desplazaría sus
  citas (regla de mutación 4). `estados.ts` **SHALL** conservar su número de líneas.
- La entrada `'Pendiente': 'externa',` **SHALL** ir sola en su línea y sin comentario detrás, porque la comprobación 5
  del barrido la cuenta leyendo el texto (`apps/desk/server/reconciliacion/comprobaciones.ts:162`). El recuento del
  barrido sobre el `estados.ts` real **SHALL** coincidir con `ESTADOS_EN_ESPERA.length`, y una prueba lo enfrenta.
- Los comentarios de `estados.ts` que dan la cifra de la vista (`:21`, `:28`, `:115`) **SHALL** decir doce, y una prueba
  los lee (regla de mutación 2).
- El cruce «salida única ∩ `en_espera`» (`estados.ts:145`, «da OCHO») **SHALL** quedar en ocho: se calcula sobre
  `ESTADOS_SERVICIO`, que no contiene `Pendiente` (`comentariosVigilados.test.ts:33-34`).
- El reloj del SLA **SHALL NOT** leer esta clasificación (§3.7): las alarmas no cambian.

#### Scenario: la vista enseña doce, con `Pendiente` la última
- GIVEN el registro tras E-226
- WHEN se calcula `ESTADOS_EN_ESPERA`
- THEN tiene doce entradas y la última es `Pendiente`

#### Scenario: `Verificación` y `Solicitud Soporte` no son espera
- GIVEN tickets en `Verificación` y en `Solicitud Soporte`
- WHEN se clasifican con `enEsperaDe` y con el predicado del tablero
- THEN su clase es `ninguna` y el tablero los enseña en «Abiertos», no en «Espera»

#### Scenario: el barrido cuenta lo mismo que el código (mutación)
- GIVEN un comentario añadido detrás de `'Pendiente': 'externa',`
- WHEN corre la prueba que enfrenta la comprobación 5 con `ESTADOS_EN_ESPERA`
- THEN se pone roja: el barrido cuenta once y el código doce

#### Scenario: el comentario de la cifra no envejece (mutación)
- GIVEN `estados.ts:115` diciendo «ONCE» con doce en el código
- WHEN corre `comentariosVigilados.test.ts`
- THEN se pone roja
