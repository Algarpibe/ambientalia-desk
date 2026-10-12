# Delta de `remisiones` · recepcion-exencion-foto-y-casilla (F1B-04, `cierra: no`)

## MODIFIED Requirements

### Requirement: RQ-RE-26 · Una remisión del formulario nuevo no se envía sin rotulado, sin las tres fotos mínimas y sin la foto de cada novedad

Para una remisión con `novedades` no nulo (RQ-RE-27), la sexta puerta de `POST /:id/enviar` (RQ-RE-08)
**SHALL** responder `422` —sin reclamar el envío, sin disparar a n8n y sin escribir nada— en cuanto falte alguna
de estas tres cosas, evaluadas **en este orden**:

1. **Rotulado:** `rotulado_at` es `NULL`.
2. **Fotos mínimas:** no hay al menos una foto de cada categoría `equipo`, `accesorios` y `embalaje`. El registro
   fotográfico es siempre obligatorio, haya o no novedad (E-123, `docs/sdd/ENTRADA.md:1515`; maestro,
   `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1241`), con dos excepciones por
   casilla (RQ-RE-38): la foto de `accesorios` **MUST NOT** exigirse si la remisión lleva «Llegó sin accesorios»
   (`sin_accesorios_at` no nulo), ni la de `embalaje` si lleva «Llegó sin embalaje» (`sin_embalaje_at` no nulo).
   Las casillas son independientes y la foto de `equipo` **SHALL** exigirse **siempre**. El `422` **SHALL**
   nombrar las categorías que faltan.
3. **Foto de cada novedad:** alguna novedad marcada, sin `excluye_demas` y sin `exenta_de_foto` (RQ-RE-37), no
   tiene al menos una foto con `categoria = 'novedad'` y `novedad` igual a su clave. Cada novedad marcada y no
   exenta exige la suya: una foto no sirve para dos novedades. La novedad con `excluye_demas` y la que lleva
   `exenta_de_foto` **MUST NOT** exigir foto; la exención se decide **siempre por la marca**, nunca por la clave
   ni por la etiqueta. El `422` **SHALL** nombrar las novedades que faltan.

Una foto cuenta sólo para su propia categoría: una foto de `equipo` **MUST NOT** contar para `accesorios` ni
para ninguna novedad, y una foto sin categoría **MUST NOT** contar para ninguna. Las marcas de cada novedad
marcada **SHALL** leerse del catálogo por su `clave` aunque la fila esté hoy inactiva: retirar una novedad
(`activo = false`) afecta a las altas nuevas y **MUST NOT** relajar la exigencia de una remisión que ya la marcó.

**Posición.** La puerta **SHALL** ir detrás de «anulada» y «ya enviada» (`routes/remision.ts:279-286`, escalón B)
y **antes** de `reclamarEnvio` (`:297`, escalón D). Corregir y reenviar de inmediato **SHALL** tener éxito, porque
la reclamación nunca se tomó; un `422` posterior a la reclamación dejaría `enviado_at` fijado y bloquearía el
reintento durante `VENTANA_REENVIO_SEGUNDOS`.

#### Scenario: Sin rotulado, no se envía
- GIVEN una remisión del formulario nuevo con las fotos completas y `rotulado_at` en `NULL`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, no dispara a n8n y `enviado_at` sigue `NULL`

#### Scenario: Faltan fotos mínimas y el 422 nombra las categorías
- GIVEN una remisión del formulario nuevo, rotulada, con sólo una foto de `equipo`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, nombra `accesorios` y `embalaje`, no dispara y `enviado_at` sigue `NULL`

#### Scenario: Sin novedad con las tres fotos mínimas se envía
- GIVEN una remisión del formulario nuevo con sólo la novedad que excluye a las demás, rotulada, con una foto de cada categoría mínima
- WHEN se llama `POST /:id/enviar`
- THEN responde `200`

#### Scenario: Cada novedad marcada exige su foto
- GIVEN una remisión rotulada, con las tres categorías mínimas, y dos novedades marcadas con foto sólo de una
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` y nombra la novedad que falta
- AND subir la foto de la segunda y reintentar de inmediato responde `200`

#### Scenario: Una foto de otra categoría no sustituye a la de la novedad
- GIVEN una remisión con una novedad marcada y varias fotos de `equipo`, `accesorios` y `embalaje`, pero ninguna con `categoria = 'novedad'`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`

#### Scenario: Una foto sin categoría no cuenta
- GIVEN una remisión del formulario nuevo con tres fotos sin categoría
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` por las fotos mínimas

#### Scenario: Una novedad retirada después sigue exigiendo su foto
- GIVEN una remisión que marcó una novedad, y esa novedad pasada después a `activo = false` en la tabla
- WHEN se llama `POST /:id/enviar` sin la foto de esa novedad
- THEN responde `422` por esa novedad

#### Scenario: El orden interno es rotulado, fotos mínimas, foto por novedad
- GIVEN una remisión sin rotulado, sin fotos mínimas y con una novedad sin foto
- WHEN se llama `POST /:id/enviar`
- THEN el `422` es el del rotulado
- AND con el rotulado hecho, el `422` es el de las fotos mínimas
- AND con las mínimas subidas, el `422` es el de la foto de la novedad; permutar cualquier par de las tres guardas pone la prueba en rojo

#### Scenario: La anulación y «ya enviada» ganan a la puerta de contenido
- GIVEN una remisión del formulario nuevo anulada, o en `ok`, sin rotulado y sin fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde el `409` de anulada o de ya enviada, no el `422`

#### Scenario: El 422 de contenido no reclama el envío
- GIVEN una remisión del formulario nuevo incompleta
- WHEN se llama `POST /:id/enviar`, se completa lo que faltaba y se reintenta de inmediato
- THEN el primer intento responde `422` con `enviado_at` en `NULL` y el segundo responde `200`

#### Scenario: Una novedad exenta no exige foto
- GIVEN una remisión rotulada, con las tres fotos mínimas, y sólo «Falta un accesorio» marcada, sin foto de esa novedad
- WHEN se llama `POST /:id/enviar`
- THEN responde `200`

#### Scenario: Exenta y no exenta a la vez, sólo falta la segunda
- GIVEN una remisión rotulada, con las tres fotos mínimas, con «Falta un accesorio» y otra novedad no exenta, sin foto de ninguna
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` y nombra sólo la no exenta
- AND subir la foto de la no exenta y reintentar de inmediato responde `200`

#### Scenario: La exención sigue a la marca, no a la clave
- GIVEN el catálogo con `exenta_de_foto = true` en otra clave y en `false` en `falta_accesorio`
- WHEN se evalúa lo que falta con cada una marcada y sin foto
- THEN la de la marca queda exenta y `falta_accesorio` exige su foto

#### Scenario: Una casilla exime sólo la foto de su categoría
- GIVEN una remisión rotulada con casilla de accesorios marcada, foto de `equipo`, sin fotos de `accesorios` ni de `embalaje`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` y nombra sólo `embalaje`
- AND con sólo la casilla de embalaje marcada, nombra sólo `accesorios`

#### Scenario: Con las dos casillas, sólo se exige la foto del equipo
- GIVEN una remisión rotulada con las dos casillas marcadas y sin ninguna foto
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` y nombra sólo `equipo`
- AND con una foto de `equipo` y el reintento inmediato responde `200`

#### Scenario: Una remisión creada antes del cambio sigue exigiendo las tres
- GIVEN una remisión del formulario nuevo con `sin_accesorios_at` y `sin_embalaje_at` en `NULL`
- WHEN se llama `POST /:id/enviar` sin fotos de `accesorios` ni de `embalaje`
- THEN responde `422` y las nombra

## ADDED Requirements

### Requirement: RQ-RE-37 · Una novedad del catálogo puede quedar exenta de foto por una marca

`public.catalogo_novedades` **SHALL** tener la columna `exenta_de_foto boolean NOT NULL DEFAULT false`, añadida
con `ALTER` calificado con esquema (`public.`), y `NovedadCatalogo` **SHALL** exponerla como `exentaDeFoto`.

- «Falta un accesorio» (`falta_accesorio`) **SHALL** quedar con `exenta_de_foto = true`, también en una base ya
  desplegada y sembrada antes del cambio, y las otras diez filas **SHALL** conservar `false`. Migrar dos veces
  **MUST NOT** duplicar ni cambiar nada más.
- La marca **MUST NOT** ser editable desde el mantenimiento (RQ-RE-29): ni la creación ni la edición la reciben,
  y una novedad nueva **SHALL** nacer con `exenta_de_foto = false`.
- La ruta de lectura del catálogo (RQ-RE-22) **SHALL** servirla como `exentaDeFoto` en cada novedad.
- Es la única columna que cambia en las filas ya sembradas: no contradice «las diez anteriores intactas»
  (RQ-RE-34, RQ-RE-36) en nada más.

#### Scenario: Base ya sembrada sin la columna, migrada dos veces
- GIVEN una base con las diez novedades sembradas y sin `exenta_de_foto`
- WHEN se migra dos veces
- THEN `falta_accesorio` tiene `exenta_de_foto = true`, las demás `false`, y el resto de sus columnas no cambian

#### Scenario: El fichero de esquema vigilado discrimina
- GIVEN `schema.sql` al que se le quita la sentencia que activa la marca, o al que se añade un `ALTER` sin `public.`
- WHEN corren las pruebas de migración
- THEN se ponen en rojo

#### Scenario: Una novedad nueva nace sin exención y el mantenimiento no la toca
- GIVEN el mantenimiento de novedades
- WHEN se crea una novedad, o se edita una enviando `exentaDeFoto: true`
- THEN la creada queda con `exenta_de_foto = false` y la edición no cambia la marca

#### Scenario: La lectura sirve la marca
- GIVEN el catálogo sembrado
- WHEN se pide la lista de novedades
- THEN `falta_accesorio` trae `exentaDeFoto = true` y las demás `false`

### Requirement: RQ-RE-38 · «Llegó sin accesorios» y «Llegó sin embalaje» sustituyen su foto mínima, con traza

`public.remisiones` **SHALL** tener cuatro columnas `NULL`-ables, calificadas y sin relleno de lo histórico:
`sin_accesorios_at`, `sin_accesorios_por`, `sin_embalaje_at` y `sin_embalaje_por`.

- El alta con `novedades` presente (RQ-RE-27) **SHALL** aceptar dos marcas booleanas independientes,
  `sinAccesorios` y `sinEmbalaje`; cada una marcada con exactamente `true` **SHALL** guardar la hora del
  **servidor** y el usuario de la **sesión** en sus dos columnas. El cuerpo **MUST NOT** decidir ni la hora ni la
  persona (RQ-RE-24). Sin marcar, sus columnas **SHALL** quedar en `NULL`.
- Cada casilla marcada **SHALL** añadir su frase a `observaciones`: «Llegó sin accesorios.» y «Llegó sin
  embalaje.».
- «Llegó sin accesorios» con alguno de los accesorios marcados en «Incluye» **SHALL** responder `422` sin crear
  la remisión; «Llegó sin embalaje» no tiene esa incompatibilidad. Que el alta lo rechace es comportamiento del
  servidor, no del formulario, y **MUST NOT** alterar el orden relativo de las demás respuestas del alta.
- La remisión de legado (`novedades` `NULL`) **MUST NOT** admitirlas: se ignoran y quedan sus cuatro columnas
  en `NULL` y sus `observaciones` sin la frase. Una remisión creada antes del cambio queda con las cuatro
  columnas en `NULL`.
- El cálculo de lo que falta para enviar (RQ-RE-18) **SHALL** recibir las dos casillas y las marcas
  `exentaDeFoto` de las novedades, y servidor y formulario **SHALL** consumir esa misma función.
- El payload hacia n8n (RQ-RE-13) **MUST NOT** ganar ningún campo: las casillas llegan sólo como texto dentro de
  `observaciones`, y las claves de `buildRemisionPayload` no cambian.

#### Scenario: Cada casilla se guarda con su traza
- GIVEN un usuario autenticado y un alta con `sinEmbalaje: true`, y `sinAccesorios` ausente
- WHEN se crea la remisión
- THEN `sin_embalaje_at` cae entre el instante anterior y el posterior a la petición, `sin_embalaje_por` es ese usuario y las dos columnas de accesorios son `NULL`

#### Scenario: Hora y persona salen del servidor
- GIVEN un alta con `sinAccesorios: true`, `sinAccesoriosPor: 'Otra Persona'` y `sinAccesoriosAt: '2020-01-01T00:00:00Z'`
- WHEN se crea la remisión
- THEN la persona es la de la sesión y la hora la del servidor

#### Scenario: Cada casilla deja su frase en las observaciones
- GIVEN un alta con las dos casillas marcadas
- WHEN se crea la remisión
- THEN `observaciones` contiene «Llegó sin accesorios.» y «Llegó sin embalaje.», y con una sola, solo su frase

#### Scenario: Sin accesorios y con accesorios marcados, el alta se rechaza
- GIVEN un alta con `sinAccesorios: true` y un accesorio marcado en «Incluye»
- WHEN se crea la remisión
- THEN responde `422` y no se crea ninguna
- AND con `sinEmbalaje: true` y accesorios marcados el alta se acepta

#### Scenario: Un alta de legado ignora las casillas
- GIVEN un alta sin `novedades` y con `sinAccesorios: true`
- WHEN se crea la remisión
- THEN se crea como legado, con las cuatro columnas en `NULL` y `observaciones` sin la frase

#### Scenario: Casilla de accesorios marcada y falta la foto de embalaje
- GIVEN una remisión guardada con sólo la casilla de accesorios, rotulada, con foto de `equipo`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` por `embalaje`

#### Scenario: El payload conserva sus claves
- GIVEN una remisión con las dos casillas marcadas
- WHEN se arma el payload a n8n
- THEN tiene exactamente las mismas claves que antes del cambio y las frases sólo aparecen en el valor de `observaciones`
