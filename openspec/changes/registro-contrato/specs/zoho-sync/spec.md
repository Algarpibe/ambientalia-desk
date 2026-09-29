# Delta for `zoho-sync`

Cambio `registro-contrato` (F1B-11, cambio 3 de 3, `cierra: no`). Se añade el informe trimestral por
contrato como **tabla exportable**, junto al saldo por lote (`RQ-ZS-14`), que queda **sin cambios**.

## ADDED Requirements

### Requirement: RQ-ZS-15 · Informe trimestral por contrato: estado de cada subOV, % ejecutado y servicios

El sistema **SHALL** calcular en el servidor, para un contrato (`tickets-core` RQ-TC-21), una tabla de
informe que el cliente **SHALL** poder exportar a CSV con el patrón existente
(`apps/desk/src/components/RemisionesPage.tsx:107-115`); la versión con formato para el cliente queda
fuera. Leerlo **SHALL** estar abierto a cualquier usuario con sesión (supuesto reversible, como las
lecturas de `routes/ovAsociaciones.ts:13-14`).

**Estado de cada subOV.** Las «creadas» del contrato **SHALL** ser las mismas que cuenta el saldo del lote
(`packages/zoho-sync/src/books/subOV.ts:36-40`: subOV canónicas del lote, sin borrador ni anulada;
las literales `draft`/`void` son hipótesis pendiente de P.4). Cada subOV creada **SHALL** estar en
exactamente uno de tres estados:

- **libre**: sin asociación vigente (`tickets-core` RQ-TC-17);
- **en curso**: con asociación vigente a un ticket cuyo `status` **no** es `Finalizado`;
- **ejecutada**: con asociación vigente a un ticket en `status = 'Finalizado'` (supuesto S-6: el único
  estado sin salida del motor, `apps/desk/server/transitionExec.ts:5`).

Las subOV en cuarentena **MUST NOT** contarse (`tickets-core` RQ-TC-18).

**Trimestres del contrato.** El trimestre 1 **SHALL** empezar en la fecha de inicio del contrato y cada
trimestre siguiente **SHALL** empezar tres meses después del anterior; **no son trimestres naturales**
(`decision/anexo-53-contratos`, `openspec/config.yaml:2465`). El último trimestre **SHALL** terminar en la
fecha de fin. La tabla **SHALL** incluir cada trimestre ya iniciado hoy, hasta el que contiene a hoy o, si
el contrato ya venció, hasta el último.

**Por cada trimestre**, la tabla **SHALL** dar:

1. **% ejecutado** = ejecutadas / creadas, **acumulado al cierre del trimestre** (supuesto S-7):
   ejecutadas cuyo ticket llegó a `Finalizado` en o antes del último día del trimestre. Sin subOV creadas,
   el porcentaje es 0. La fecha de llegada a `Finalizado` sale de `ticket_transitions.performed_at` con
   `to_status = 'Finalizado'` (`packages/zoho-sync/src/db/schema.sql:57-60`).
2. **Servicios del trimestre**: los tickets asociados al contrato que llegaron a `Finalizado` dentro del
   trimestre, cada uno con **equipo, serial, tipo de servicio y fecha** de finalización.
3. **SubOV libres** hoy.
4. **Días hasta el vencimiento** = fecha de fin menos hoy, en días; **negativo** si el contrato ya venció
   (supuesto del diseño de esta spec, reversible).

**Hueco declarado, no inventado.** El maestro pide además el «informe» de cada servicio. Del informe sólo
existe `fecha_revision_informe` (`schema.sql:32`); el documento no está en los datos y la capacidad
`informes` no tiene spec (`openspec/config.yaml:230-234`). La tabla **SHALL** llevar una columna «informe»
que diga explícitamente que **no disponible** en lugar de dejarla vacía o inventar un valor.

**Distinto de `consumido` (RQ-ZS-14).** Este requisito **MUST NOT** cambiar `saldoPorLote`
(`packages/zoho-sync/src/books/subOV.ts:34-49`): el `consumido` de `RQ-ZS-14` cuenta asociaciones
vigentes, de modo que una subOV **en curso** está consumida y **no** ejecutada. El % ejecutado y el
`consumido` **SHALL** poder valer cosas distintas a la vez sobre el mismo lote (el maestro,
`R08.2.md:2182`, dice «consumidas / creadas»; Gerencia lo definió como ejecutadas / creadas,
`openspec/config.yaml:2457`).

#### Scenario: Lote de 10 subOV con 3 finalizadas y 2 en curso

- GIVEN un lote con 10 subOV creadas, 3 con ticket en `Finalizado`, 2 con ticket abierto y 5 sin asociación
- WHEN se consulta el informe del contrato y el saldo del lote
- THEN el informe da 3 ejecutadas, 2 en curso, 5 libres y 30 % ejecutado; el saldo (`RQ-ZS-14`) sigue
  dando 5 consumidas y 50 % `consumido`, sin cambios

#### Scenario: Una asociación liberada devuelve la subOV a libre

- GIVEN una subOV cuya única asociación fue liberada
- WHEN se calcula su estado
- THEN es libre, no en curso ni ejecutada

#### Scenario: Las subOV en cuarentena, borrador y anuladas no cuentan

- GIVEN un lote con una subOV en cuarentena, una anulada y una en borrador además de tres válidas
- WHEN se calcula el informe
- THEN «creadas» es 3 y ninguna de las tres excluidas aparece en los estados

#### Scenario: Los trimestres se cuentan desde el inicio del contrato

- GIVEN un contrato con inicio `2026-02-10` y fin `2027-02-09`
- WHEN se calculan sus trimestres
- THEN el trimestre 1 es `2026-02-10` a `2026-05-09`, el 2 empieza el `2026-05-10`, y el último termina el
  `2027-02-09`, no el 31 de diciembre ni al cierre de un trimestre natural

#### Scenario: El % ejecutado es acumulado al cierre del trimestre

- GIVEN un contrato de 10 subOV, 2 finalizadas en el trimestre 1 y 3 más en el trimestre 2
- WHEN se calcula el informe al final del trimestre 2
- THEN el trimestre 1 da 20 % y el trimestre 2 da 50 %, y los servicios del trimestre 2 son los 3 que
  llegaron a `Finalizado` dentro de él

#### Scenario: Cada servicio lleva equipo, serial, tipo de servicio, fecha, y el hueco del informe

- GIVEN un ticket que llegó a `Finalizado` dentro del trimestre
- WHEN se calcula el informe
- THEN su fila trae equipo, serial, tipo de servicio y fecha de finalización, y la columna «informe» dice
  que el documento no está disponible

#### Scenario: Sin subOV creadas, el informe sigue existiendo con 0 %

- GIVEN un contrato cuyo lote no tiene subOV en Books
- WHEN se consulta el informe
- THEN devuelve 0 % ejecutado, 0 libres y los días hasta el vencimiento, sin error

#### Scenario: Días hasta el vencimiento, con el contrato vigente y con el vencido

- GIVEN un contrato con fin `2026-12-31`
- WHEN se calcula con hoy = `2026-12-01` y con hoy = `2027-01-05`
- THEN da 30 días y `-5` días, respectivamente

#### Scenario: El informe se exporta como tabla

- GIVEN el informe de un contrato con dos trimestres
- WHEN se pide su exportación
- THEN se obtiene un CSV con una fila por trimestre y por servicio y las columnas anteriores, incluida la
  de «informe» con el hueco declarado

## Fuera de alcance de este delta

- `RQ-ZS-14` y su `consumido` no cambian.
- La versión con formato para enviar al cliente (portal) y el documento «informe» del servicio (F1E).
- Ampliación del contrato (E-086).
- Un ticket en `Finalizado` sin fila de `ticket_transitions` (por ejemplo, venido de Zoho): cuenta como
  ejecutada hoy pero no tiene fecha de finalización; queda fuera de los porcentajes acumulados y de los
  servicios de cualquier trimestre (hipótesis: coincide con `status_type = 'Closed'` de Zoho,
  `packages/zoho-sync/src/db/repo.ts:166`; sin verificar).
- Cargos y permisos por cargo (F1C-05).
