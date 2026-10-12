# Delta de `remisiones` · aplica-resuelto-hacia-n8n (F1B-04, `cierra: no`)

Medido sobre `b9d5e71`. Las líneas citadas son de `openspec/specs/remisiones/spec.md` en esa revisión.

## ADDED Requirements

### Requirement: RQ-RE-39 · «Aplica» se resuelve en la aplicación y viaja a n8n como un dato ya decidido

«Aplica: Sí/No» del encabezado «OBSERVACIONES O NOVEDADES» del formato F-ST-010 **SHALL** significar que la
remisión trae accesorios o una novedad real; «Sin novedad» por sí sola **MUST NOT** contar
(`decision/aplica-si-no-remision-12-10`).

`packages/shared` **SHALL** exportar una función pura que, desde lo guardado de la remisión, devuelva `true`,
`false` o «no calculable». Es **`true`** si se cumple **alguna** de estas tres:

1. `incluye` trae algún elemento no vacío tras recortar espacios; un elemento vacío o sólo de espacios
   **MUST NOT** contar como accesorio.
2. `hayNovedad` guardado es `true`. Ya viene decidido por la marca `excluyeDemas` al guardar
   (`packages/shared/src/recepcion.ts:109`); la función **MUST NOT** comparar claves ni etiquetas de novedades.
3. Hay traza de «Llegó sin accesorios» o de «Llegó sin embalaje» (`sinAccesoriosAt` o `sinEmbalajeAt` no nulos,
   RQ-RE-38). Las casillas se validan aparte de `hayNovedad` (`packages/shared/src/recepcion.ts:102`), por eso se
   suman aquí.

Si ninguna se cumple, es `false`. Es **«no calculable»** cuando `novedades` es `NULL` **o la propiedad está
ausente** (remisión de legado, `packages/shared/src/recepcion.ts:137`): su dato no pasó por el catálogo.

- `buildRemisionPayload` (`apps/desk/server/remisionWebhook.ts:31-65`) **SHALL** añadir a su cuerpo la clave
  `aplica`, booleana, con ese resultado. Con «no calculable» **SHALL** omitir la clave: **MUST NOT** mandar `null`
  ni `false`.
- El servidor **SHALL** mandar `aplica` ya resuelto y n8n **MUST NOT** recalcularlo (regla invariable 13). El
  cálculo usa sólo lo **guardado** en la remisión, no el catálogo de hoy: un reenvío (RQ-RE-08) **SHALL** mandar el
  mismo valor que el primer envío.
- El cuerpo de una remisión del formulario nuevo **SHALL** tener exactamente once claves de primer nivel (las
  diez de antes más `aplica`) y el de una de legado, diez.
- Este requisito **MUST NOT** cambiar `hay_novedad`, ni nada de lo que se guarda, ni requerir migración, ni
  tocar `apps/desk/src`: el técnico no ve ni marca nada distinto.

#### Scenario: «Sin novedad» sola no aplica
- GIVEN una remisión del formulario nuevo con sólo la novedad que excluye a las demás, `incluye` vacío y sin casillas
- WHEN se calcula «Aplica»
- THEN el resultado es `false`

#### Scenario: Una novedad real sin accesorios aplica
- GIVEN una remisión del formulario nuevo con una novedad real, `incluye` vacío y sin casillas
- WHEN se calcula «Aplica»
- THEN el resultado es `true`

#### Scenario: «Sin novedad» con accesorios aplica
- GIVEN una remisión del formulario nuevo con sólo «Sin novedad» y un accesorio en `incluye`
- WHEN se calcula «Aplica»
- THEN el resultado es `true`

#### Scenario: «Llegó sin accesorios» aplica
- GIVEN una remisión del formulario nuevo con sólo «Sin novedad», `incluye` vacío y `sinAccesoriosAt` no nulo
- WHEN se calcula «Aplica»
- THEN el resultado es `true`

#### Scenario: «Llegó sin embalaje» aplica
- GIVEN una remisión del formulario nuevo con sólo «Sin novedad», `incluye` vacío y `sinEmbalajeAt` no nulo
- WHEN se calcula «Aplica»
- THEN el resultado es `true`

#### Scenario: Un «Incluye» de cadenas vacías o espacios no cuenta
- GIVEN una remisión del formulario nuevo con sólo «Sin novedad» y `incluye` igual a `['', '   ']`
- WHEN se calcula «Aplica»
- THEN el resultado es `false`

#### Scenario: Legado, la clave no está en el cuerpo
- GIVEN una remisión de legado (`novedades` `NULL`), con `hayNovedad` `true`, `false` o `null`, y otra sin la propiedad `novedades`
- WHEN se arma el payload a n8n
- THEN el cuerpo no tiene la clave `aplica` (ni como `null` ni como `false`) y tiene diez claves

#### Scenario: Un reenvío manda el mismo valor
- GIVEN una remisión del formulario nuevo ya enviada, y después cambiada la marca de una de sus novedades en el catálogo
- WHEN se reenvía y se arma el payload otra vez
- THEN `aplica` es idéntico al del primer envío

#### Scenario: El cuerpo del formulario nuevo tiene once claves
- GIVEN una remisión del formulario nuevo
- WHEN se arma el payload a n8n
- THEN tiene exactamente las diez claves de antes más `aplica`, y `aplica` es booleano

#### Scenario: Ni `hay_novedad` ni lo guardado cambian
- GIVEN una remisión del formulario nuevo
- WHEN se envía y se reenvía
- THEN `hay_novedad` y el resto de sus columnas quedan como estaban y el payload sigue sin la clave `hayNovedad`

#### Scenario (MANUAL, de persona) · El correo y el documento muestran «Aplica: Sí»
- GIVEN publicados a la vez la aplicación y el nodo «Verifica Incluye Entrada» cambiado en n8n
- WHEN se envía una remisión de prueba con una novedad real y sin accesorios
- THEN el correo y el documento generado muestran «Aplica: Sí» (**hipótesis** sobre el documento: la plantilla no se pudo leer)

#### Scenario (MANUAL, de persona) · Un solo lado publicado da el resultado de hoy
- GIVEN el nodo nuevo con la aplicación vieja, o la aplicación nueva con el nodo viejo
- WHEN se envía una remisión de prueba
- THEN el resultado es el de hoy, decidido sólo por «Incluye», sin error de validación del payload

## MODIFIED Requirements

### Requirement: RQ-RE-17 · La remisión de entrada declara si el equipo llega con novedad

El alta **SHALL** persistir en `public.remisiones.hay_novedad boolean` (columna calificada, aditiva y
`NULL`-able) si el equipo llega con novedad, de dos maneras según el origen del cuerpo:

- **Formulario nuevo** (`novedades` presente, RQ-RE-27): `hay_novedad` lo **deriva** el servidor de las
  novedades marcadas (RQ-RE-23) y el `hayNovedad` del cuerpo **SHALL** ignorarse. El servidor exige que la
  lista venga contestada —la lista vacía se rechaza—, de modo que «sin contestar» y «Sin novedad» dejan de
  confundirse.
- **Legado** (sin `novedades`): `hayNovedad` **SHALL** guardarse como `true` o `false` cuando el cuerpo trae
  exactamente eso, y como `null` en cualquier otro caso —ausente, `undefined` u otro tipo—, sin rechazar la
  petición por ese campo. La obligación de contestar no la impone el servidor en el legado.

Las remisiones **anteriores** a esta columna y las de `origen: 'historico'` **SHALL** leerse con
`hay_novedad = null` —«sin declarar»— y **MUST NOT** quedar sujetas a la guarda de RQ-RE-08 que exige foto por
novedad ni a las del formulario nuevo: la regla no es retroactiva.

El envío a n8n (`remisionWebhook.ts:5-24`) **MUST NOT** ganar ningún campo nuevo de la recepción: ni `hayNovedad`,
ni `novedades`, ni `novedadOtro`, ni `rotulado*`. La única clave que gana sobre las de esta tanda es `aplica` (RQ-RE-39), ya resuelta por el servidor. `observaciones` sigue viajando como hasta ahora; en el formulario
nuevo lleva el texto compuesto de RQ-RE-23.

#### Scenario: El alta de legado persiste el valor declarado
- GIVEN una remisión de entrada sin `novedades` y con `hayNovedad: true`
- WHEN se crea con `POST /api/remisiones`
- THEN la fila queda con `hay_novedad = true`

#### Scenario: En legado, cualquier valor que no sea true/false se guarda como no declarado
- GIVEN una remisión sin `novedades` y sin `hayNovedad` en el cuerpo, o con un valor que no es booleano
- WHEN se crea
- THEN la fila queda con `hay_novedad = null`, y la petición no se rechaza por ese campo

#### Scenario: En el formulario nuevo el hayNovedad del cuerpo no manda
- GIVEN una remisión con `novedades` de una novedad real y `hayNovedad: false`
- WHEN se crea
- THEN la fila queda con `hay_novedad = true`

#### Scenario: El payload a n8n sólo gana `aplica`
- GIVEN una remisión del formulario nuevo, con novedades, rotulado y fotos categorizadas
- WHEN se envía con `POST /:id/enviar`
- THEN el payload que construye `buildRemisionPayload` tiene las mismas claves que sin esta tanda más `aplica` (RQ-RE-39): no incluye `hayNovedad`, `novedades`, `novedadOtro`, `rotuladoPor`, `rotuladoAt` ni la categoría de las fotos
- AND `observaciones` lleva el texto compuesto

### Requirement: RQ-RE-38 · «Llegó sin accesorios» y «Llegó sin embalaje» sustituyen su foto mínima, con traza

`public.remisiones` **SHALL** tener cuatro columnas `NULL`-ables, calificadas y sin relleno de lo histórico:
`sin_accesorios_at`, `sin_accesorios_por`, `sin_embalaje_at` y `sin_embalaje_por`.

- El alta con `novedades` presente (RQ-RE-27) **SHALL** aceptar dos marcas booleanas independientes,
  `sinAccesorios` y `sinEmbalaje`; cada una marcada con exactamente `true` **SHALL** guardar la hora del
  **servidor** y el usuario de la **sesión** en sus dos columnas. El cuerpo **MUST NOT** decidir ni la hora ni la
  persona (RQ-RE-24). Sin marcar, sus columnas **SHALL** quedar en `NULL`.
- Cada casilla marcada **SHALL** añadir su frase a `observaciones`: «Llegó sin accesorios» y «Llegó sin
  embalaje».
- «Llegó sin accesorios» con alguno de los accesorios marcados en «Incluye» **SHALL** responder `422` sin crear
  la remisión; «Llegó sin embalaje» no tiene esa incompatibilidad. Que el alta lo rechace es comportamiento del
  servidor, no del formulario, y **MUST NOT** alterar el orden relativo de las demás respuestas del alta.
- La remisión de legado (`novedades` `NULL`) **MUST NOT** admitirlas: se ignoran y quedan sus cuatro columnas
  en `NULL` y sus `observaciones` sin la frase. Una remisión creada antes del cambio queda con las cuatro
  columnas en `NULL`.
- El cálculo de lo que falta para enviar (RQ-RE-18) **SHALL** recibir las dos casillas y las marcas
  `exentaDeFoto` de las novedades, y servidor y formulario **SHALL** consumir esa misma función.
- El payload hacia n8n (RQ-RE-13) **MUST NOT** ganar ninguna clave por las casillas: llegan como texto dentro de
  `observaciones` y, resumidas, dentro de `aplica` (RQ-RE-39), que es la única clave que gana sobre las de esta tanda; no viajan como claves propias.

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
- THEN `observaciones` contiene «Llegó sin accesorios» y «Llegó sin embalaje», y con una sola, solo su frase

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

#### Scenario: El payload no gana claves por las casillas
- GIVEN una remisión con las dos casillas marcadas
- WHEN se arma el payload a n8n
- THEN tiene las claves de antes más `aplica` (RQ-RE-39), sin `sinAccesorios` ni `sinEmbalaje`, y las frases sólo aparecen en el valor de `observaciones`

## Trazabilidad

- `decision/aplica-si-no-remision-12-10`: define «Aplica» (RQ-RE-39, párrafo inicial; escenarios «Sin novedad» sola, novedad real, accesorios).
- `decision/aplica-opcion-a-esta-semana-12-10`: la aplicación manda el dato y n8n lo consume (RQ-RE-39; los dos escenarios MANUALES).
- S1 (nombre y tipo): «once claves». S2 (resuelto, no suelto): «El reenvío manda el mismo valor» y la prohibición de recalcular en n8n.
- S3 (casillas cuentan): «Llegó sin accesorios» y «Llegó sin embalaje» aplica. S4 (legado omite): «Legado, la clave no está». S5 (lo guardado): «Un reenvío manda el mismo valor».
- S6 (compatibilidad hacia atrás): escenario MANUAL «Un solo lado publicado». S7 (en blanco no cuenta): «Un Incluye de cadenas vacías».
- No se tocan, y siguen ciertos: RQ-RE-13 (`openspec/specs/remisiones/spec.md:362-363`, sólo fija las claves de cada foto); RQ-RE-32 (`:1522-1523`, «conservar sus claves y valores, sin `incluyeDetalle` ni SKU» sigue cierto: no pierde ninguna y no gana esas dos); RQ-RE-36 (`:1825`, «conservar sus claves y valores» sigue cierto por la misma razón).
