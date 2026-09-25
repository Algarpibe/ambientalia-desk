# Delta for remisiones

Primer cambio de F1B-04 «Registro de entrada en recepción»
(`openspec/changes/foto-solo-con-novedad/proposal.md`). Añade el dato estructurado de novedad, la
sexta puerta de `/enviar`, el predicado compartido y la obligación de contestar en el formulario.
Base verificada `a0a2935`.

## ADDED Requirements

### Requirement: RQ-RE-17 · La remisión de entrada declara si el equipo llega con novedad

El alta **SHALL** aceptar `hayNovedad` en `POST /api/remisiones` y persistirlo en
`public.remisiones.hay_novedad boolean` (columna calificada, aditiva y `NULL`-able). El valor
**SHALL** guardarse como `true` o `false` cuando el cuerpo trae exactamente eso, y como `null` en
cualquier otro caso —ausente, `undefined` u otro tipo—, sin rechazar la petición por ese campo. La
obligación de CONTESTAR vive sólo en el cliente (RQ-RE-19); el servidor no exige el valor al crear,
sólo impone la consecuencia (RQ-RE-08).

Las remisiones **anteriores** a esta columna y las de `origen: 'historico'` **SHALL** leerse con
`hay_novedad = null` —«sin declarar»— y **MUST NOT** quedar sujetas a la guarda de RQ-RE-08: la regla
no es retroactiva.

El envío a n8n (`remisionWebhook.ts:5-24`) **MUST NOT** ganar ningún campo nuevo por este cambio:
`hayNovedad` no viaja en el payload.

#### Scenario: El alta persiste el valor declarado
- GIVEN una remisión de entrada con `hayNovedad: true`
- WHEN se crea con `POST /api/remisiones`
- THEN la fila queda con `hay_novedad = true`

#### Scenario: Cualquier valor que no sea true/false se guarda como no declarado
- GIVEN una remisión sin `hayNovedad` en el cuerpo, o con un valor que no es booleano
- WHEN se crea
- THEN la fila queda con `hay_novedad = null`, y la petición no se rechaza por ese campo

#### Scenario: El payload a n8n no cambia
- GIVEN una remisión con `hay_novedad = true` y al menos una foto
- WHEN se envía con `POST /:id/enviar`
- THEN el payload que construye `buildRemisionPayload` es el mismo que sin este cambio: no incluye
  `hayNovedad`

### Requirement: RQ-RE-18 · Predicado compartido de exigencia de foto

`packages/shared` **SHALL** exportar un predicado puro que, a partir de `hayNovedad` y el número de
fotos, decida si la remisión queda bloqueada por esta regla. El servidor (RQ-RE-08) y el formulario
(RQ-RE-19) **SHALL** consumir la MISMA función — regla invariable 13, punto 1: el cliente no
reescribe la regla del servidor.

#### Scenario: Con novedad y cero fotos, el predicado bloquea
- GIVEN `hayNovedad = true` y `fotos.length = 0`
- WHEN se evalúa el predicado
- THEN devuelve que la remisión está bloqueada

#### Scenario: Sin novedad, o con al menos una foto, el predicado no bloquea
- GIVEN `hayNovedad` en `false` o `null`, o `fotos.length >= 1` con `hayNovedad = true`
- WHEN se evalúa el predicado
- THEN devuelve que la remisión no está bloqueada

### Requirement: RQ-RE-19 · El formulario exige contestar, y no deja crear sin foto si hay novedad

`CrearRemision.tsx` **SHALL** presentar la pregunta «¿El equipo llega con novedad?» sin valor por
defecto. Con «Sí» seleccionado, el formulario **SHALL** impedir enviar el alta sin al menos una foto,
y **MUST NOT** ofrecer «Continuar sin fotos» cuando aceptarlo dejaría la remisión en cero fotos.
**Regla 13, punto 2, declarada:** esta obligación de contestar vive SÓLO en el cliente — exigirla en
el servidor añadiría una guarda al alta y activaría IV-12 (orden de guardas del alta, sin destino
asignado); el servidor sí impone la consecuencia, en RQ-RE-08.

#### Comprobaciones de persona de RQ-RE-19 — NO son escenarios automáticos
> Los `.tsx` quedan fuera de la red de pruebas por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`).
> **Dueño:** Servicio Técnico, en la app. **ARCHIVAR ESTE CAMBIO NO LAS DA POR HECHAS.**

- **Persona-1.** GIVEN el formulario de alta · WHEN se abre · THEN la pregunta está visible y sin
  valor preseleccionado.
- **Persona-2.** GIVEN «Sí» seleccionado y cero fotos · WHEN se intenta crear o continuar · THEN el
  formulario lo impide.
- **Persona-3.** GIVEN un envío bloqueado por el `422` de RQ-RE-08 · WHEN el técnico lo lee · THEN el
  mensaje se entiende.

## MODIFIED Requirements

### Requirement: RQ-RE-08 · El cerrojo de reenvío tiene SEIS puertas, en este orden

`POST /:id/enviar` **SHALL** cortar en el orden observable siguiente:

| Orden | Guarda | Respuesta | Evidencia |
|---|---|---|---|
| 1 | La remisión no existe | `404` | `routes/remision.ts:272` |
| 2 | Está anulada | `409` | `:275-277` |
| 3 | Ya está cerrada (`ok` u `ok_con_avisos`) | `409` | `:280-282` |
| 4 | **Hay novedad declarada y cero fotos** | `422` | nuevo — posición exacta la fija `design.md` |
| 5 | Reclamación perdida | `409` | `:286-288` |
| 6 | Sin ticket asociado | `422` | `:291` |

La anulación **SHALL** cortar **antes** de mirar el estado del flujo, porque «generar un documento en
Drive de algo que se acaba de anular sería absurdo» (`:273-274`; probado en
`remisiones.test.ts:631`).

La guarda nueva (orden 4) **SHALL** ejecutarse **antes** de `reclamarEnvio` (orden 5) y **MUST NOT**
escribir nada ni reclamar el envío: `reclamarEnvio` es el único `UPDATE` que fija `enviado_at`
(`db/remisiones.ts:170-182`), y un `422` posterior a esa reclamación dejaría la remisión bloqueada
durante toda la ventana de reenvío (`VENTANA_REENVIO_SEGUNDOS`, 120 s). Encaja en el orden A<B<C<D de
F1B-10: existencia (404), estado y permiso (anulada, ya enviada), **contenido** (novedad sin foto),
unicidad (reclamación).

(Previously: cinco puertas; la sexta —novedad sin foto— es de este cambio, F1B-04.)

#### Scenario: Novedad sin fotos bloquea sin reclamar el envío
- GIVEN una remisión pendiente con `hay_novedad = true` y cero fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, no dispara a n8n, y `enviado_at` sigue `NULL`

#### Scenario: Reintento inmediato tras subir la foto tiene éxito
- GIVEN el `422` del escenario anterior
- WHEN se sube una foto y se reintenta `POST /:id/enviar` de inmediato
- THEN responde `200`, porque la reclamación nunca se había tomado

#### Scenario: La anulación gana a la guarda de novedad
- GIVEN una remisión anulada con `hay_novedad = true` y cero fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde `409` de anulada, no `422` de novedad

#### Scenario: Ya enviada gana a la guarda de novedad
- GIVEN una remisión en `ok` con `hay_novedad = true` y cero fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde `409` de ya enviada, no `422` de novedad

#### Scenario: Sin novedad o histórica, cero fotos, se envía como hoy
- GIVEN `hay_novedad` en `false` o `null`, y cero fotos
- WHEN se llama `POST /:id/enviar` sin otros bloqueos
- THEN responde `200`, igual que antes de este cambio
