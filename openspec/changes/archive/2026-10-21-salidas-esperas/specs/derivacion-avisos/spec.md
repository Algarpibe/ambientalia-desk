# Delta de `derivacion-avisos` — `salidas-esperas` (F1C-03, `cierra: si`)

Sólo ADDED. Molde: RQ-AV-23 (`avisoFacturacionVencida.ts`, F1C-02).
Fuente: `decision/c3-salida-esperas`, `medicion/p90-esperas-2026-10-21` (`openspec/config.yaml:5276-5328` en `24b86092`). Supuestos de la propuesta (reversibles): **S-4** días naturales, vence cuando lo transcurrido es ≥ plazo; **S-5** plazos provisionales; **S-6** destinatarios; **S-7** al encender, un aviso por cada vencido, sin corte.
La entrada al estado de los tickets de Zoho (`de_la_app: 0` en la medición) no sale de `ticket_transitions` sola; de dónde sale y dónde se guarda el anti-duplicado lo fija el diseño (hipótesis: fusión con `ticket_history`).

## ADDED Requirements

### Requirement: RQ-AV-25 · Registro de plazos de las esperas: 79 / 31 / 20 / 13 días naturales

`packages/shared` **SHALL** exportar un registro propio de plazos con `En Espera de Repuestos` = 79, `Servicio externo` = 31, `En espera de SKU inventario` = 20 y `Solicitado` = 13 días naturales, con la clave y la fecha de la medición (`medicion/p90-esperas-2026-10-21`, 21/10/2026). Sus claves **SHALL** ser exactamente `ESTADOS_SIN_SALIDA` (`packages/shared/src/estados.ts:151-160`). **MUST NOT** derivarse de `SLA_HORAS_POR_ESTADO` (`packages/shared/src/sla.ts:32-35`) ni declararse en él. Una función pura **SHALL** decidir el vencimiento: vence cuando los días naturales transcurridos desde la entrada son ≥ plazo (S-4), nunca antes. Los plazos son provisionales (S-5): se recalculan con una medición nueva con clave propia.

#### Scenario: valores, clave y fecha — ROJO
- GIVEN el registro
- WHEN se leen
- THEN 79 / 31 / 20 / 13 y la clave y fecha de la medición

#### Scenario: las claves son `ESTADOS_SIN_SALIDA` — ROJO
- GIVEN el registro y `ESTADOS_SIN_SALIDA`
- WHEN se comparan los conjuntos de claves
- THEN son iguales; quitar o añadir un estado en uno solo pone la prueba en rojo

#### Scenario: independiente del SLA — ROJO (mutación 6)
- GIVEN `SLA_HORAS_POR_ESTADO` con cualquier valor para esos estados
- WHEN se evalúa el registro
- THEN los plazos no cambian; derivarlos del SLA pone la prueba en rojo

#### Scenario: vence en el plazo, nunca antes — ROJO (mutación 2)
- GIVEN `Servicio externo` con plazo 31 y una entrada hace 30 días, otra hace 31 y otra hace 32
- WHEN se evalúa el vencimiento
- THEN falso, verdadero, verdadero

### Requirement: RQ-AV-26 · Alarma de caducidad: sugiere en las externas, escala en las internas, nunca ejecuta

Con `SALIDAS_ESPERAS` encendido, la pasada del servidor (`apps/desk/server/index.ts:88`) **SHALL** crear un aviso por cada ticket que lleve en una de las cuatro esperas el plazo de RQ-AV-25 o más, incluidos los venidos de Zoho. Externas (`En Espera de Repuestos`, `Servicio externo`): el aviso **SHALL** SUGERIR a Comercial las dos salidas (cobrar el diagnóstico o anular); destinatarios: el `derivado_a` si es de Comercial, más Director y Coordinador Comercial por `cargo_permiso` (`avisos.ts:121`), y el área Comercial (`avisos.ts:74`) de respaldo (S-6). Internas: el aviso **SHALL** ESCALAR al área responsable y **SHALL NOT** sugerir salida: `Solicitado` a Director y Coordinador de Servicio Técnico; `En espera de SKU inventario` a Director y Coordinador Comercial, con el texto «crear el SKU» (S-6). La alarma **SHALL NOT** ejecutar ninguna transición ni cambiar el estado del ticket: sólo crea avisos y su marca. Apagado el interruptor no corre y no crea avisos. Al encender, un aviso por cada ticket ya vencido (S-7).

#### Scenario: una externa vencida sugiere a Comercial — ROJO
- GIVEN el interruptor encendido y un ticket en `En Espera de Repuestos` con 79 días, `derivado_a` de Comercial
- WHEN corre la pasada
- THEN un aviso al `derivado_a` y a Director y Coordinador Comercial que sugiere cobrar el diagnóstico o anular

#### Scenario: una interna escala, no sugiere — ROJO (mutación 4)
- GIVEN un ticket en `Solicitado` con 13 días y otro en `En espera de SKU inventario` con 20
- WHEN corre la pasada
- THEN el primero avisa a Director y Coordinador de Servicio Técnico; el segundo, a Director y Coordinador Comercial con «crear el SKU»; ninguno sugiere `Anulado` ni `Por Facturar`

#### Scenario: antes del plazo no avisa — ROJO (mutación 2)
- GIVEN un ticket en `Servicio externo` con 30 días
- WHEN corre la pasada
- THEN no se crea aviso

#### Scenario: nunca ejecuta una transición — ROJO (mutación 1)
- GIVEN un ticket vencido en cada una de las cuatro esperas
- WHEN corre la pasada, dos veces
- THEN ningún ticket cambia de estado y `ticket_transitions` no gana ninguna fila

#### Scenario: un ticket de Zoho sin historial en la app también vence — ROJO
- GIVEN un ticket venido de Zoho cuya entrada sólo consta en `ticket_history`, con el plazo cumplido
- WHEN corre la pasada
- THEN se crea el aviso

#### Scenario: apagado no corre — ROJO
- GIVEN el interruptor sin `true` y un ticket vencido
- WHEN corre la pasada
- THEN no hay avisos ni marcas

### Requirement: RQ-AV-27 · Un solo aviso por (ticket, estado, entrada)

La alarma **SHALL** crear a lo sumo un aviso por vencimiento, identificado por (ticket, estado, entrada al estado), con anti-duplicado persistente (hipótesis de la propuesta: `public.alarmas_avisadas`, PK `ticket_id, estado, entrada_at`, `schema.sql:582-589`; el diseño lo confirma). Pasadas repetidas **SHALL NOT** duplicar. Un ticket que sale de la espera y vuelve a entrar **SHALL** generar un vencimiento nuevo, con su propia entrada.

#### Scenario: dos pasadas, un aviso — ROJO (mutación 3)
- GIVEN un ticket vencido
- WHEN corre la pasada dos veces
- THEN un solo conjunto de avisos

#### Scenario: la reentrada vuelve a avisar — ROJO
- GIVEN un ticket avisado que sale de `Solicitado` y vuelve a entrar y cumple otra vez el plazo
- WHEN corre la pasada
- THEN se crea un aviso nuevo, con otra entrada

#### Scenario: el fallo de un aviso no impide los demás — ROJO
- GIVEN dos tickets vencidos y un fallo al crear el aviso del primero
- WHEN corre la pasada
- THEN el segundo recibe su aviso y el primero se reintenta en la pasada siguiente
