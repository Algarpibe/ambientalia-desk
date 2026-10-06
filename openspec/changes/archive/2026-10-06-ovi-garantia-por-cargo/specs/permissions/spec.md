# Delta para permissions — asociar una orden OVI exige el cargo Director Técnico (F1B-03, `cierra: no`)

Construye `decision/e157-ovi-garantia-por-cargo`. Numeración comprobada: el último requisito vivo es RQ-PM-23; los nuevos
son RQ-PM-24 y RQ-PM-25. Sólo se modifica RQ-PM-20. RQ-PM-21 **no se modifica**: no queda contradicho, porque en las
cuatro entradas la guarda nueva AÑADE una condición a algo que hoy se permite y en ninguna concede lo que el área niega
(en las transiciones el `403` de área sigue delante). Supuestos S-1…S-10: los de `proposal.md` §6, aceptados.

Marcas bajo `strict_tdd`: **ROJO** = nace rojo; **CARACTERIZACIÓN** = nace verde y fija lo que hoy nada fija.

## MODIFIED Requirements

### RQ-PM-20 · Primitivas del cargo: OVI de garantía y Top 5, las dos con llamador

`shared` SHALL exportar `puedeCrearOVIGarantia` (Director Técnico o admin) y `puedeFijarPrioridadTop5` (Director
Comercial o admin). `puedeFijarPrioridadTop5` **tiene llamadores** desde F1B-07: las rutas de prioridad del cliente y
de ajuste por ticket (`tickets-core` RQ-TC-27 y RQ-TC-29) y la guarda de las transiciones (`transitions-st` RQ-TS-21).
`puedeCrearOVIGarantia` **tiene llamadores** desde F1B-03: la guarda de cargo de las cuatro entradas de una orden (RQ-PM-24; `tickets-core` RQ-TC-42, `transitions-st` RQ-TS-36, `remisiones` RQ-RE-30).
`puedeCrearOVIGarantia` **no exige área** (SUPUESTO S-4 en lo que toca al administrador): basta el cargo Director Técnico o ser administrador.
La prueba de las primitivas SHALL decir que las dos tienen llamador. El acto que se construye es **asociar** una orden OVI a un ticket, no crear la OVI en Books.
(Previously: `puedeCrearOVIGarantia` «sigue sin llamador», con el área Servicio Técnico dentro del predicado, y «Este
cambio MUST NOT construir el acto de la OVI de garantía».)

#### Scenario: por cargo y admin
- GIVEN cada uno de los ocho cargos, «sin cargo» y admin
- WHEN se evalúan las dos primitivas
- THEN sólo Director Técnico (y admin) pasa la primera y sólo Director Comercial (y admin) la segunda

#### Scenario: las dos primitivas tienen llamador
- GIVEN el código de `apps/` y `packages/`, sin pruebas
- WHEN se buscan llamadores de las dos primitivas
- THEN cada una tiene al menos uno en el servidor

## ADDED Requirements

### RQ-PM-24 · Asociar una orden OVI es un acto sin área: basta el cargo Director Técnico

Asociar una orden cuyo número es OVI (el número, **tras recortar y sin distinguir mayúsculas, EMPIEZA por `OVI-`**; no
se exige la sintaxis completa, así que `OVI-26-1` también lo es; SUPUESTO S-6) a un ticket **SHALL** exigir el cargo Director Técnico o ser administrador, **entre por donde entre**:
alta, «Habilitar Servicio», la «OV adicional» de `aprobacion` y de `aprobacion_y_repuestos`, y la remisión de entrada. El
acto **MUST NOT** exigir un área: un Director Técnico sin el área Servicio Técnico pasa. El administrador pasa sin tener
cargo (SUPUESTO S-4, como en RQ-PM-19). Quien no pasa recibe `403` en el escalón **B** del orden total (existencia <
estado y permiso < contenido < unicidad). La regla vive en `packages/shared` y la impone el servidor (regla invariable
13): el cliente no decide nada sobre órdenes OVI y no se toca. La noción «es OVI» (prefijo de OVI, distinta de la
sintaxis de subOV) vive en `packages/shared/src/subOV.ts`, junto a ella, y **MUST NOT** escribirse por segunda vez (molde H5). Si el sujeto no llega al
servicio, se trata como «sin cargo» (SUPUESTO S-10, falla cerrado).

#### Scenario: Director Técnico sin el área Servicio Técnico pasa — ROJO
- GIVEN un usuario con cargo `Director Técnico` y sólo el área `Comercial`
- WHEN asocia una orden `OVI-2026-001` por cualquiera de las cuatro entradas
- THEN la guarda de cargo no lo detiene

#### Scenario: administrador sin cargo pasa
- GIVEN un administrador sin `cargo_permiso`
- WHEN asocia una orden OVI por cualquiera de las cuatro entradas
- THEN la guarda de cargo no lo detiene

#### Scenario: sin cargo y sin ser administrador — ROJO
- GIVEN un usuario sin cargo, o con otro cargo, que no es administrador
- WHEN asocia una orden OVI por cualquiera de las cuatro entradas
- THEN responde `403` con el texto «La orden de venta {número} es una OVI: asociarla a un ticket sólo lo hace el cargo Director Técnico»

#### Scenario: minúsculas y espacios no esquivan la guarda (S-6) — ROJO
- GIVEN un usuario sin cargo y el número `  ovi-2026-001 ` tecleado en una transición
- WHEN lo asocia
- THEN responde `403`

#### Scenario: un número mal formado con prefijo OVI también pide el cargo — ROJO
- GIVEN un usuario sin cargo y el número `OVI-26-1` tecleado en una transición o en el alta
- WHEN lo asocia
- THEN responde `403`; y `OVIEDO-1` no pide el cargo

#### Scenario: una orden `OV-` no pide el cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y una orden `OV-2026-001`
- WHEN la asocia por cualquiera de las cuatro entradas
- THEN la guarda de cargo no actúa

### RQ-PM-25 · Reconfirmar la orden que el ticket ya tiene no es asociar

Una orden **entra** a un ticket cuando su número, recortado, no coincide con ninguna que el ticket ya tenga: la columna
`orden_venta`, `salesorder_id` o una asociación vigente de `public.ov_asociaciones`. La guarda de cargo (RQ-PM-24) y la
de garantía (`tickets-core` RQ-TC-43) **SHALL** juzgar sólo las órdenes que entran. Reconfirmar la orden que el ticket
ya tiene **MUST NOT** pedir el cargo, **en ningún ticket**, venga de Zoho o de la aplicación (SUPUESTO S-3: no se
ramifica por `PREFIJO_TICKET_APP`, `packages/shared/src/transitions.ts:124`). Cambiar la OVI del ticket por otra **sí**
entra y pide el cargo. Una orden liberada deja de ser del ticket: volver a asociarla es entrar.

#### Scenario: ticket venido de Zoho con OVI reconfirmada — ROJO
- GIVEN un ticket de id numérico (sin `PREFIJO_TICKET_APP`) cuya `orden_venta` ya es `OVI-2026-001`
- WHEN un usuario sin cargo que no es administrador, de área Comercial, la reconfirma en «Habilitar Servicio»
- THEN responde sin el `403` de cargo (la transición sigue su curso)

#### Scenario: ticket de la aplicación con OVI reconfirmada
- GIVEN un ticket con `PREFIJO_TICKET_APP` cuya OVI asoció un Director Técnico en el alta
- WHEN un usuario de área Comercial sin cargo reenvía esa misma orden en «Habilitar Servicio»
- THEN no se le pide el cargo

#### Scenario: cambiar una OVI por otra entra
- GIVEN un ticket de Zoho con `orden_venta` `OVI-2026-001`
- WHEN un usuario sin cargo envía `OVI-2026-002` como orden
- THEN responde `403` de cargo

#### Scenario: una orden liberada vuelve a entrar
- GIVEN una asociación liberada de `OVI-2026-001` en el ticket
- WHEN un usuario sin cargo la vuelve a enviar
- THEN responde `403` de cargo
