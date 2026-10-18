# Delta para tickets-core

## ADDED Requirements

### Requirement: RQ-TC-70 · Tiempo promedio de operación de la ficha de cliente: ventana de seis meses en el servidor y sin cifras inventadas

Fuente: `decision/f1b08-cierre-sin-capturas` (Gerencia, 2026-10-17; lo que falte o difiera de Zoho Desk se corrige en
F1F-03). La ficha rotula «Últimos 6 meses» y el servidor no filtraba por fecha; la primera respuesta y la respuesta iban
fijas a `00:00` sin cálculo detrás (propuesta §2).

**Ventana.** La media de resolución de la ficha (RQ-TC-69) **SHALL** contar sólo los tickets cuyo **cierre que cuenta**
cae en los últimos `MESES_VENTANA_RESOLUCION` meses (6) antes de `ahora` **[SUPUESTO S-1]**. El inicio de la ventana es
`ahora` menos seis meses de calendario en UTC, y un cierre en ese mismo instante **SHALL** contar **[SUPUESTO S-4]**. No
hay límite superior **[SUPUESTO S-5]**. El cierre puesto por la migración **MUST NOT** contar, tampoco dentro de la
ventana (RQ-TC-69).

**Dónde vive.** La ventana y su constante **SHALL** vivir en `packages/shared` (regla invariable 13); el servidor
**SHALL** aplicarla en el detalle de contacto y de cuenta y **SHALL** admitir un `ahora` inyectable, con el reloj como
valor por omisión. El `.tsx` **MUST NOT** filtrar, restar ni promediar: formatea la cifra y toma el rótulo de la misma
constante.

**Sin cifras inventadas.** «Tiempo de primera respuesta» y «Tiempo de respuesta» **SHALL** mostrar «Sin datos» mientras
no haya una definición escrita que las sostenga **[SUPUESTO S-2]**: el repositorio y el maestro no la tienen. Una media
de resolución `null` **SHALL** mostrarse como «Sin datos», no como `00:00` **[SUPUESTO S-3]**.

#### Scenario: un cierre de hace más de seis meses no entra en la media — ROJO
- GIVEN un ticket cerrado hace dos horas de resolución dentro de la ventana y otro de seis horas cerrado hace siete meses
- WHEN se calcula la media de resolución con ese `ahora`
- THEN la media es dos horas

#### Scenario: el límite inferior de la ventana cuenta — ROJO
- GIVEN un ticket cuyo cierre es exactamente `ahora` menos seis meses, y otro cerrado un milisegundo antes
- WHEN se calcula la media
- THEN entra el primero y no el segundo

#### Scenario: el cierre de la migración no cuenta aunque caiga dentro de la ventana — ROJO
- GIVEN un ticket normal dentro de la ventana y otro con cierre puesto por la migración también dentro de la ventana
- WHEN se calcula la media
- THEN la media es la del ticket normal sólo

#### Scenario: sin cierres en la ventana, null — ROJO
- GIVEN una cuenta cuyos tickets se cerraron todos hace más de seis meses
- WHEN se pide el detalle de la cuenta con ese `ahora`
- THEN `resolucionPromedioMs` es `null`

#### Scenario: el detalle de contacto y de cuenta aplica la ventana con el `ahora` que recibe — ROJO
- GIVEN una cuenta y un contacto con un ticket cerrado dentro de la ventana y otro fuera
- WHEN se piden sus detalles con un `ahora` fijo
- THEN los dos traen la media del ticket de dentro sólo

#### Scenario: la ventana es de seis meses y el rótulo la lee de la misma constante
- GIVEN `MESES_VENTANA_RESOLUCION` en `packages/shared`
- WHEN se lee
- THEN vale 6
- AND la ficha la consume para el rótulo (verificación de persona: el `.tsx` está fuera de la red de pruebas, F0-00)

#### Scenario: la ficha no inventa cifras (verificación de persona)
- GIVEN la ficha de un cliente en la aplicación desplegada
- WHEN se abre «Información general»
- THEN «Tiempo de primera respuesta» y «Tiempo de respuesta» dicen «Sin datos»
- AND «Tiempo de resolución» dice «Sin datos» si no hay cierres en los últimos seis meses
