# Delta for `derivacion-avisos`

Cambio `registro-contrato` (F1B-11, cambio 3 de 3, `cierra: no`). Nueva clase de aviso: el ritmo de un
contrato. Sigue el molde de `RQ-AV-13` (aviso de discrepancia de OV): bandeja, un destinatario por
persona, anti-ruido.

## ADDED Requirements

### Requirement: RQ-AV-14 · Aviso de ritmo de contrato a Comercial, una vez por contrato y trimestre

El sistema **SHALL** crear un aviso al área Comercial cuando un contrato vigente (`tickets-core` RQ-TC-22)
no vaya a consumir todas sus subOV antes de su fecha de fin al ritmo actual (supuesto S-8). La regla,
evaluada una sola vez por contrato y trimestre del contrato (`zoho-sync` RQ-ZS-15):

- **Desde** el fin del primer trimestre del contrato (antes, no hay ritmo que medir).
- Con `creadas > 0` (las de `RQ-ZS-15`) y contrato vigente hoy.
- **Proyección** = `ejecutadas + (ejecutadas / díasTranscurridos) × díasRestantes`, con `díasTranscurridos`
  = hoy menos inicio y `díasRestantes` = fin menos hoy; si `proyección < creadas`, hay aviso. «Ejecutadas»
  son las de `RQ-ZS-15` (ticket en `Finalizado`), no las consumidas de `RQ-ZS-14`.
- Un contrato ya vencido **MUST NOT** generar aviso (hipótesis, reversible: la ampliación es de E-086 y
  fuera de este cambio; sin ella, avisar tras el vencimiento sólo hace ruido).

El aviso **SHALL** entregarse vía `crearAviso` (`apps/desk/server/db/avisos.ts:8-18`) a cada destinatario
de `destinatariosDeArea(db, 'Comercial', actorId)` (`:74-93`), uno por destinatario y por contrato. El
texto **SHALL** nombrar el lote, el cliente, las ejecutadas y las creadas, y la fecha de fin.

**Regla anti-ruido:** el sistema **MUST NOT** crear un segundo aviso para el mismo contrato y el mismo
trimestre, aunque se evalúe muchas veces y aunque la proyección cambie dentro del trimestre. El trimestre
siguiente **SHALL** poder generar un aviso nuevo si la regla vuelve a cumplirse.

El aviso **SHALL** ser sólo de bandeja (como `RQ-AV-13`, supuesto S-3 de ese requisito): **MUST NOT**
disparar el canal de correo (`RQ-AV-09`), y `enviado_at` **SHALL** quedar `NULL`. El momento de la
evaluación —la pasada periódica del servidor (`apps/desk/server/index.ts:85`) o al leer— lo fija el
diseño (S-8); el aviso **SHALL** originarse únicamente desde el proceso `ambientalia-desk`, no desde
`apps/hub-sync`.

#### Scenario: Ritmo insuficiente genera un aviso a Comercial

- GIVEN un contrato de 10 subOV creadas, 3 ejecutadas, con 90 días transcurridos y 90 restantes
  (proyección 6 < 10), ya pasado el fin de su primer trimestre
- WHEN se evalúa el ritmo
- THEN se crea un aviso a cada destinatario de área Comercial, con el lote, el cliente, 3 ejecutadas, 10
  creadas y la fecha de fin

#### Scenario: Una segunda evaluación en el mismo trimestre no repite el aviso

- GIVEN el aviso del escenario anterior ya creado
- WHEN se evalúa otra vez el mismo contrato en el mismo trimestre, aunque ahora haya 4 ejecutadas
- THEN no se crea ningún aviso

#### Scenario: El trimestre siguiente puede avisar de nuevo

- GIVEN el aviso ya creado en el trimestre 2 y la regla que sigue cumpliéndose en el trimestre 3
- WHEN se evalúa el contrato en el trimestre 3
- THEN se crea un aviso nuevo

#### Scenario: Ritmo suficiente no avisa

- GIVEN un contrato de 10 subOV creadas y 6 ejecutadas, con 90 días transcurridos y 90 restantes
  (proyección 12 ≥ 10)
- WHEN se evalúa el ritmo
- THEN no se crea ningún aviso

#### Scenario: Antes del fin del primer trimestre no se evalúa

- GIVEN un contrato con 0 ejecutadas, dentro de su primer trimestre
- WHEN se evalúa el ritmo
- THEN no se crea ningún aviso

#### Scenario: Sin subOV creadas o con el contrato vencido no hay aviso

- GIVEN un contrato con 0 creadas, y otro con fin anterior a hoy y ritmo insuficiente
- WHEN se evalúa cada uno
- THEN no se crea ningún aviso para ninguno

#### Scenario: El aviso no dispara correo

- GIVEN cualquier aviso de ritmo
- WHEN se crea
- THEN `enviado_at` queda `NULL` y no se invoca el canal de correo de `RQ-AV-09`

## Fuera de alcance de este delta

- Proponer o ejecutar la ampliación del contrato: E-086, fuera de este cambio.
- Aviso por correo (`RQ-AV-09`) y aviso al cliente.
- Cargos de destinatario (F1C-05): el destinatario es el área Comercial, por la vía de
  `destinatariosDeArea`, con los administradores que ésa ya incluye.
