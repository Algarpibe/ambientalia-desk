## ADDED Requirements

### RQ-TS-41 · Orden de presentación de los motivos de anulación

Fuente: `decision/f1c01-motivos-esperas` (consecuencias 1 y 2), que aclara `decision/c3-salida-esperas`
(`openspec/config.yaml:5030-5047`, `:1834`). Es presentación: la lista y su pertenencia son de RQ-TS-40.

**La función.** `motivosAnulacionOrdenados(estado)` en `packages/shared/src/anulacion.ts` **SHALL** ser una función pura
que devuelve los motivos en el orden en que se muestran, y **SHALL** añadirse al final del fichero. En `En Espera de
Repuestos` y `Servicio externo` **SHALL** devolver «Repuesto no disponible», «Sin solución técnica» **[SUPUESTO SA-2]**,
y después «El cliente no aprueba o se echa atrás» y «Caducidad de espera: el cliente no responde ni retira el equipo» en su
orden relativo de `MOTIVOS_ANULACION` **[SUPUESTO SA-3]**, con «Otro» el último. En cualquier otro estado **SHALL**
devolver exactamente el orden de `MOTIVOS_ANULACION` (`anulacion.ts:22-28`). **SHALL** devolver siempre el mismo conjunto
que `MOTIVOS_ANULACION`: **MUST NOT** añadir ni quitar un motivo. «Otro» **SHALL** ser siempre el último
(`anulacion.ts:21`).

**Los dos estados se nombran.** La función **MUST NOT** apoyarse en la clase `externa` de `estados.ts`: la llevan también
`Notificación cliente` (`packages/shared/src/estados.ts:65`), que es origen de anulación, y otros cuatro estados.

**El desplegable.** El desplegable de `apps/desk/src/components/TransitionPanel.tsx` (`:257-261`) **SHALL** consumir esa
función para el campo cuya clave es `CLAVE_MOTIVO_ANULACION` (`anulacion.ts:19`). Es presentación (regla invariable 13):
el servidor **MUST NOT** cambiar y sigue imponiendo la pertenencia con `erroresAnulacion` (`anulacion.ts:50`). **MUST NOT**
existir restricción de motivo por estado de origen.

#### Scenario: en las dos esperas, los dos primeros son «Repuesto no disponible» y «Sin solución técnica» — ROJO
- GIVEN el estado `En Espera de Repuestos` o `Servicio externo`
- WHEN se pide `motivosAnulacionOrdenados(estado)`
- THEN devuelve, en este orden, «Repuesto no disponible», «Sin solución técnica», «El cliente no aprueba o se echa atrás», «Caducidad de espera: el cliente no responde ni retira el equipo» y «Otro»; no reordenar lo pone en rojo (M1)

#### Scenario: en otro estado de anulación el orden es el de siempre — ROJO
- GIVEN `Notificación cliente` o `Rev./Diagnostico`
- WHEN se pide `motivosAnulacionOrdenados(estado)`
- THEN devuelve el orden de `MOTIVOS_ANULACION`; reordenar en estos estados lo pone en rojo (M2), y por eso la clase `externa` no vale

#### Scenario: en todo estado, el mismo conjunto que `MOTIVOS_ANULACION` — ROJO
- GIVEN cualquier estado, de las dos esperas o de otro
- WHEN se pide `motivosAnulacionOrdenados(estado)`
- THEN tiene los mismos cinco motivos que `MOTIVOS_ANULACION`, sin repetir; añadir o quitar uno lo pone en rojo (M3)

#### Scenario: «Otro» es siempre el último — ROJO
- GIVEN cualquier estado
- WHEN se pide `motivosAnulacionOrdenados(estado)`
- THEN el último elemento es «Otro»; sacarlo del último puesto lo pone en rojo (M4)

#### Scenario: desde una espera, un motivo que no es de los dos primeros sigue siendo válido en el servidor
- GIVEN un ticket en `Servicio externo` y un usuario de Comercial
- WHEN ejecuta `anulacion` con «El cliente no aprueba o se echa atrás», «Sin solución técnica», «Repuesto no disponible» o «Caducidad de espera: …»
- THEN responde `200`; ya lo prueba `apps/desk/server/anulacion.test.ts:59-62` (los cuatro motivos distintos de «Otro», desde `Servicio externo`), y desde `En Espera de Repuestos` lo prueba `:54-58` con un motivo. «Otro» con detalle se prueba sólo desde `Rev./Diagnostico` (`:63-67`) y desde una espera no tiene prueba propia: hipótesis, la pertenencia no mira el estado de origen (`anulacion.ts:50`)
