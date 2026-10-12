---
tanda: F1B-04
motivo: ""
capacidad: [remisiones]
maestro: []
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: «Falta un accesorio» queda exenta de foto, y una casilla con traza sustituye la foto de accesorios o de embalaje

## Intención

`decision/f1b04-remanente-confirmacion-12-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`) confirma `decision/accesorios-desde-el-catalogo` y autoriza construir lo que de ella queda sin construir en la fila F1B-04 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84`). La segunda decisión **no está versionada** en este árbol: se cita por clave y su texto no es verificable desde el repositorio; lo verificable es la confirmación. Párrafo «Detalles», literal: «una foto por novedad, salvo «Falta un accesorio», que queda exenta. Una casilla «llegó sin accesorios / sin embalaje» sustituye esa foto, con traza. El rotulado se confirma después de enviar si la etiqueta sale en el envío: comprobarlo en n8n.» Y: «Un accesorio que no esté en la lista se anota como novedad y lo añade el Director Técnico; nada de texto libre.» Responde E-165 y E-166 de `docs/sdd/ENTRADA.md`.

**Maestro.** `maestro: []`: ningún pasaje justifica el cambio (la decisión registra `maestro_pasaje: "ninguno"`). `toca_maestro: si`: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1241` dice que el registro es «siempre obligatorio» con «al menos equipo, accesorios y embalaje, más la foto de cada novedad marcada», y tras este cambio esa frase tiene dos excepciones que no recoge.

**`cierra: no`.** De la fila quedan fuera E-167 (mover el rotulado, que espera una comprobación de persona en n8n) y el recuento de modelos sin accesorios (de persona, contra producción).

## Problema — medido sobre `daea6d6`

- **E-165 no cumple.** La única exención de foto por novedad es la marca `excluyeDemas` (`packages/shared/src/recepcion.ts:140-142`), y «Falta un accesorio» está sembrada sin ella (`packages/zoho-sync/src/db/schema.sql:695`). Esa marca no sirve para esto: además impide marcar otras novedades (`packages/shared/src/recepcion.ts:92-95`). La regla vigente es el punto 3 de RQ-RE-26 (`openspec/specs/remisiones/spec.md:1104-1107`). Lo que falta no se puede fotografiar, y hoy el técnico sube cualquier foto para poder enviar.
- **E-166 no cumple: no existe.** Las tres categorías mínimas (`packages/shared/src/recepcion.ts:26`) se exigen sin excepción (`packages/shared/src/recepcion.ts:139`); `RemisionRecepcion` sólo lleva `hayNovedad`, `novedades` y `rotuladoAt` (`packages/shared/src/recepcion.ts:124`), y no hay columnas. Los «sin embalaje» del repositorio son observaciones de remisiones históricas (`apps/desk/server/db/remisionesHistoricasSeed.ts:44-49`), no una casilla.
- **Dónde se impone.** En un solo punto: la sexta puerta de `POST /api/remisiones/:id/enviar` (`apps/desk/server/routes/remision.ts:289-293`). El alta no valida fotos; valida novedades, texto y rotulado (`apps/desk/server/routes/remision.ts:158`, vía `apps/desk/server/services/recepcion.ts:13-19`).
- **Lo que ya cumple y no se toca.** E-163 y E-164. Y el ítem libre de accesorios no existe: el servidor rechaza lo que no está en la lista (`apps/desk/server/routes/remision.ts:194-197`).

## Alcance

### Dentro

1. **Exención de foto por marca del catálogo.** Columna nueva `exenta_de_foto boolean NOT NULL DEFAULT false` en `public.catalogo_novedades`, del mismo molde que `excluye_demas` (`packages/zoho-sync/src/db/schema.sql:687`); «Falta un accesorio» la lleva en `true`. `NovedadCatalogo` gana `exentaDeFoto` y la lectura la trae (`apps/desk/server/db/novedades.ts:13`). La regla vive en `fotosQueFaltan` y **nunca** compara por clave ni por etiqueta. Como hoy, la marca se lee del catálogo por clave aunque la fila esté inactiva.
2. **Dos casillas con traza.** «Llegó sin accesorios» y «Llegó sin embalaje» (S1). Cuatro columnas `NULL`-ables en `public.remisiones`, sin relleno: `sin_accesorios_at`, `sin_accesorios_por`, `sin_embalaje_at`, `sin_embalaje_por` (S2), del molde de `rotulado_at` y `rotulado_por` (`packages/zoho-sync/src/db/schema.sql:704-705`). `RemisionRecepcion` gana las dos marcas y `fotosQueFaltan` deja de pedir la categoría cuya casilla está marcada. La foto del equipo se exige siempre.
3. **El alta recibe y guarda las casillas** sólo en el formulario nuevo (`novedades` presente): hora del servidor y usuario de la sesión, como el rotulado (`apps/desk/server/routes/remision.ts:250`, `apps/desk/server/db/remisiones.ts:47-50`). Cada casilla añade su frase a `observaciones` (S3).
4. **Incompatibilidad** entre «Llegó sin accesorios» y accesorios marcados en «Incluye» (S4), impuesta por el servidor.
5. **El formulario consume la regla.** `apps/desk/src/lib/recepcionForm.ts` pasa las casillas a las mismas funciones compartidas (`apps/desk/src/lib/recepcionForm.ts:54-63`, `apps/desk/src/lib/recepcionForm.ts:77-87`) y entrega al `.tsx` la lista de selectores de foto que hay que pintar. Hoy esa lista la decide el propio `.tsx` (`apps/desk/src/components/CrearRemision.tsx:307`), fuera de la red de pruebas: pasa a una función pura con prueba.
6. **Delta de especificación** de `remisiones` y **texto de corrección para el maestro** sobre su línea 1241 (texto para Gerencia, nunca el `.docx`). El fichero de destino lo fija `sdd-tasks`.

### Fuera

- **E-167**, mover el rotulado: no autorizado por la decisión.
- **El recuento de modelos sin accesorios:** de persona, contra producción.
- **El flujo de n8n y el payload** (`apps/desk/server/remisionWebhook.ts:45`, `apps/desk/server/remisionWebhook.ts:64`): no se toca ninguno. **Condición de parada:** si el diseño concluyera que hace falta un campo nuevo hacia n8n, se para y se consulta.
- **«Accesorio fuera de lista»** (`packages/zoho-sync/src/db/schema.sql:768`): se queda como está (S6).
- **Reordenar las guardas del alta** (desvío IV-12) y relleno de remisiones ya creadas.
- **Pruebas de `.tsx`:** excluidas por decisión de Gerencia (F0-00). No se propone `jsdom` ni `@testing-library`.

## Capacidades

- **Nuevas:** ninguna (R-2 no aplica).
- **Modificadas:** `remisiones`. RQ-RE-26 (`openspec/specs/remisiones/spec.md:1093`) cambia en sus puntos 2 y 3: la foto mínima de accesorios o de embalaje no se exige con su casilla marcada, y la novedad con `exenta_de_foto` no exige foto. Dos requisitos **nuevos al final**, tras RQ-RE-36 (`openspec/specs/remisiones/spec.md:1776`): la marca del catálogo y su siembra, y las casillas con su traza. La frase «como toda novedad marcada, exige su foto» de RQ-RE-34 (`openspec/specs/remisiones/spec.md:1649-1650`) deja de ser general; si se retoca, lo decide `sdd-spec`.

## Enfoque y reglas

- **La marca llega a la fila que ya existe en producción.** La siembra usa `ON CONFLICT (clave) DO NOTHING` (`packages/zoho-sync/src/db/schema.sql:690-699`), así que retocar el `INSERT` no alcanza a una base desplegada. Vía propuesta, con precedente en `packages/zoho-sync/src/db/schema.sql:320`: tras el `ALTER`, un `UPDATE public.catalogo_novedades` idempotente, cuyo `WHERE` lo deja sin efecto desde la segunda pasada. Nombrar la clave en esa sentencia es siembra de **dato**, no lógica: el código sigue decidiendo por la marca. Consecuencia que se declara: el `UPDATE` corre en cada arranque, así que quitar la marca por SQL no persiste; es coherente con S5. **Punto a mirar en el despliegue.**
- **`strict_tdd`.** Las pruebas de la regla compartida, del alta, de `/enviar`, de la migración y de `recepcionForm` nacen rojas antes del producto. El `.tsx` no admite rojo previo: verificación manual.
- **Regla invariable 13, y regla de mutación 3 por escrito.** Es criterio de aceptación: cada fila tiene que tener su línea del servidor al cerrar.

| Lo que el formulario decide | Línea del servidor que lo impone hoy, o dónde irá |
|---|---|
| No pide foto de una novedad exenta | `apps/desk/server/routes/remision.ts:289-293`; la marca se leerá en `packages/shared/src/recepcion.ts:140-142` |
| No pide foto de accesorios o de embalaje con su casilla marcada | La misma puerta; la exención irá en `packages/shared/src/recepcion.ts:139` |
| Bloquea «Crear» mientras falte algo | Espejo de `apps/desk/server/routes/remision.ts:158` y de la sexta puerta; mismas funciones compartidas |
| Bloquea «Incluye» con «Llegó sin accesorios» marcada | **Hoy no existe.** La añade este cambio (S4); sin ella, el cliente sería la guarda |
| Quién marcó la casilla y cuándo | No viaja desde el navegador: lo escribe el alta, como `apps/desk/server/routes/remision.ts:250` |

- **Reglas de mutación 1 y 2.** Mutaciones previstas (resultado: hipótesis hasta el `apply`): quitar el `UPDATE` de siembra del fichero vigilado y ver rojo; intercambiar las dos casillas; eximir también la foto del equipo; leer la exención por `excluyeDemas`; mover la guarda de S4 respecto de sus vecinas.
- **Regla de mutación 4.** `apps/desk/server/routes/remision.ts`, `packages/zoho-sync/src/db/schema.sql` y `packages/shared/src/recepcion.ts` son ficheros citados: fuera de `openspec/changes/archive/` hay 16 citas con número de línea a un fichero de nombre `recepcion.ts`, en 5 ficheros (el recuento no separa el de `shared` del de `services`). Se edita en sitio, dentro de líneas que ya existen, o al final del fichero. Si alguno tiene que crecer por el medio, se dice y se barre al cierre.

## Qué verá el técnico

Junto a «Foto de los accesorios» y «Foto del embalaje» (`apps/desk/src/components/CrearRemision.tsx:304-306`), una casilla por categoría. Al marcarla, ese selector de foto deja de pedirse; con «Llegó sin accesorios», la lista «Incluye» queda sin marcar y bloqueada. Al marcar «Falta un accesorio» no aparece selector de foto para esa novedad; las demás novedades siguen pidiendo la suya. El documento de la remisión lleva la frase de cada casilla en las observaciones.

## Supuestos reversibles

Regla de las preguntas a Gerencia (E-237): Gerencia tiene **una semana, hasta el 2026-10-19**, para corregirlos; lo no corregido queda aceptado con esa fecha.

| Nº | Supuesto | Por qué |
|---|---|---|
| S1 | Son **dos** casillas independientes; cada una sustituye sólo la foto mínima de **su** categoría, y la del equipo se exige siempre | La decisión las nombra juntas, pero un equipo puede llegar con embalaje y sin accesorios |
| S2 | La traza se toma en el **alta**, con la hora del servidor y el usuario de la sesión; cuatro columnas | Es el patrón del rotulado; no se inventa otro |
| S3 | Cada casilla marcada añade su frase a `observaciones` («Llegó sin accesorios» / «Llegó sin embalaje») | Es el único canal hacia el documento sin tocar el contrato con n8n |
| S4 | «Llegó sin accesorios» es incompatible con marcar accesorios en «Incluye»: el servidor lo rechaza. Se prefiere cambiar la condición de una guarda existente a añadir una nueva; **dónde, lo decide el diseño** | Las dos afirmaciones se contradicen. No se reordenan guardas (IV-12) |
| S5 | `exenta_de_foto` **no** es editable desde la pantalla de mantenimiento, igual que `excluye_demas` (`apps/desk/server/db/novedades.ts:38`, `packages/shared/src/mantenimientoNovedades.ts:22`); una novedad nueva nace sin exención (`packages/shared/src/mantenimientoNovedades.ts:49`) | La decisión exime una sola novedad, por nombre |
| S6 | «Accesorio fuera de lista» conserva su texto obligatorio y su foto | Sin el texto, el Director Técnico no sabría qué accesorio añadir. Si «nada de texto libre» la alcanza, lo decide Gerencia |
| S7 | Las remisiones de legado (`novedades` `NULL`) y las ya creadas no cambian | Las columnas nacen `NULL` y la regla de legado no se toca |

**Hipótesis sobre n8n.** Leído en sólo lectura el borrador del flujo `Remisiones_ST_3.13_Desk`: su validación no mira las fotos, con menos fotos no rechaza y copia `observaciones` literal al documento. Que el borrador coincida con lo publicado es **hipótesis**; S3 descansa en ella.

## Áreas afectadas

**Modificados:** `packages/zoho-sync/src/db/schema.sql`, `packages/zoho-sync/src/db/migrate.test.ts`, `packages/shared/src/recepcion.ts`, `apps/desk/server/db/novedades.ts`, `apps/desk/server/db/remisiones.ts`, `apps/desk/server/routes/remision.ts`, `apps/desk/src/lib/recepcionForm.ts`, `apps/desk/src/components/CrearRemision.tsx`, y sus pruebas. Si `apps/desk/server/services/recepcion.ts` cambia, lo decide el diseño. **Al archivar:** `openspec/specs/remisiones/spec.md`.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| La guarda de S4 agrava IV-12 o reabre el orden del alta | Media | No se reordena nada; condición dentro de una guarda existente si el diseño lo permite; prueba de posición contra sus vecinas |
| Añadir sentencias al final de `schema.sql` rompe la prueba que cuenta posiciones desde el final (`packages/zoho-sync/src/db/migrate.test.ts:794-798`) | Cierta | Sus índices se actualizan en sitio, en la misma tanda |
| Un `;` dentro de un comentario parte la sentencia: la migración divide el fichero por ese carácter (`packages/zoho-sync/src/db/migrate.ts:20`) | Baja | Comentarios sin ese carácter, como los vecinos |
| La marca no llega a la fila de producción | Baja | `UPDATE` idempotente, y prueba de migración sobre una base ya sembrada sin la columna |
| El documento de n8n no refleja la frase de S3 como se espera | Baja | Verificación manual tras desplegar; no bloquea el envío |
| Citas desplazadas en ficheros muy citados | Media | Edición en sitio o al final; barrido de la regla de mutación 4 al cierre |

## Vuelta atrás

Revertir el commit. Las cinco columnas son aditivas y pueden quedarse: sin el código, nadie las lee y la regla vuelve a ser la de antes. Una remisión creada con casilla y aún sin enviar volvería a pedir esa foto.

## Criterios de éxito

- [ ] Una remisión con «Falta un accesorio» marcada y sin foto de esa novedad se envía; con cualquier otra novedad sin foto, `/enviar` responde `422` y la nombra.
- [ ] Con «Llegó sin embalaje» marcada no se pide foto de embalaje y sí la de accesorios, y al revés; sin foto del equipo, `422` siempre.
- [ ] La remisión guarda quién y cuándo de cada casilla marcada; sin marcar, y en legado, las cuatro columnas quedan `NULL`.
- [ ] «Llegó sin accesorios» con accesorios en «Incluye» responde `422` desde el servidor, sin pasar por el formulario.
- [ ] Una base ya sembrada, migrada dos veces, deja `exenta_de_foto = true` sólo en «Falta un accesorio»; las otras diez filas no cambian.
- [ ] El payload hacia n8n conserva sus claves; sólo cambia el valor de `observaciones`.
- [ ] La tabla de la regla de mutación 3 tiene una línea del servidor en cada fila, y cada mutación prevista tiene su resultado escrito.
- [ ] Toda sentencia `ALTER` y `UPDATE` nueva va calificada con `public.`.

## Tareas de personas — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1).

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Verificación manual en la aplicación tras desplegar: las dos casillas, la novedad exenta y el documento generado | Alfonso | Escenarios manuales del delta de `remisiones` |
| Corregir, si procede, los supuestos S1 a S7 antes del 2026-10-19 | Gerencia | Lista semanal de supuestos (E-237) |
| Comprobar en n8n si la etiqueta sale en el envío (E-167) y recontar los modelos sin accesorios en producción | Quien administra n8n · Servicio Técnico | `docs/sdd/ENTRADA.md` → E-167 |
| Versionar `decision/accesorios-desde-el-catalogo` y pegar en el maestro la corrección de su línea 1241 | Sesión de supervisión · Gerencia | `openspec/config.yaml` y el expediente del maestro |
