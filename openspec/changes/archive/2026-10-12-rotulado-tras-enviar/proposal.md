---
tanda: F1B-04
motivo: ""
capacidad: [remisiones, derivacion-avisos]
maestro: ["M1.2"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: el rotulado se confirma después de enviar, con traza y sin bloquear, y se avisa si la etiqueta no se generó

## Intención

`decision/e167-rotulado-tras-enviar-12-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`) cierra E-167: «Servicio Tecnico rotula con la etiqueta DYMO tras enviar. El rotulado se confirma despues del envio, con traza, sin bloquear transiciones; si la etiqueta no se genera se avisa a quien envio y al Director Tecnico.» Hoy el técnico confirma «Rotulado y guardado» antes de crear la remisión, es decir, antes de que exista la etiqueta con la que se rotula. Este cambio mueve la confirmación a después del envío, la deja como información y añade el aviso. Las dos columnas nuevas y los supuestos G1 y G2 los aprobó Gerencia en la conversación de construcción el 2026-10-12; no están versionados como clave.

**Maestro.** `maestro: ["M1.2"]`: el pasaje es `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1239`, dentro de M1.2 (que empieza en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1177`). `toca_maestro: si`: ese pasaje dice que la confirmación es «obligatoria para completar la recepción», y deja de serlo. El texto para Gerencia va en `correccion-maestro.md`.

**`cierra: no`, y por qué no es `si`.** Con E-167 construida, a la fila F1B-04 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84`) no le queda, según lo medido, nada que una tanda pueda construir: el informe de archivo anterior nombra sólo dos faltas, E-167 y el recuento de modelos sin accesorios (`openspec/changes/archive/2026-10-12-aplica-resuelto-hacia-n8n/archive-report.md:11-13`), y el recuento es de persona contra producción. Por la regla del ciclo 1 eso no sería una unidad de trabajo. Pero la consecuencia (3) de `decision/aplica-opcion-a-esta-semana-12-10` dice que, mientras ese recuento siga abierto, el `cierra` es «no». Declarar `si` contradiría una consecuencia registrada, así que no lo decide esta propuesta: **se devuelve como decisión de alcance.** Si Gerencia responde que el recuento no retiene la fila, basta cambiar esta cabecera. Quedan además dos puntos que `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:211` nombra sin contenido decidido: la foto por accesorio (el maestro la lleva a otro ítem, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1237`) y confirmar que el SKU es el número de parte (de persona). E-163 a E-166 figuran **ABIERTA** en `docs/sdd/ENTRADA.md:1807-1825` aunque `decision/f1b04-remanente-confirmacion-12-10` las responde y están construidas: actualizar esos encabezados es de la sesión de supervisión.

## Medición previa sobre `a947b48`

- **El rotulado bloquea en dos sitios y en ninguno más.** En el alta, el paso 6 de `validarRecepcion` (`packages/shared/src/recepcion.ts:101`, mensaje en `packages/shared/src/recepcion.ts:65`, orden declarado en `packages/shared/src/recepcion.ts:70-72`). En el envío, `motivoNoEnviable` (`packages/shared/src/recepcion.ts:155`, función en `packages/shared/src/recepcion.ts:151-162`, orden declarado en `packages/shared/src/recepcion.ts:147-149`), llamada desde `apps/desk/server/routes/remision.ts:289`. Una búsqueda de «rotulad» en `apps/` y `packages/` da 14 ficheros; ninguno es `packages/shared/src/transitions.ts`, ni está en `apps/desk/server/services/`, ni es `apps/desk/src/lib/boardView.ts`. Ninguna transición lo consulta. El ticket pasa a «Remisión creada» cuando el callback confirma (`apps/desk/server/routes/remision.ts:374`).
- **La traza sólo la escribe el alta.** `createRemision` fija un único instante (`apps/desk/server/db/remisiones.ts:45`) y con él `rotulado_at`, `rotulado_por` y las cuatro columnas de las casillas, que toman la persona de `rotuladoPor` (`apps/desk/server/db/remisiones.ts:50`); el nombre sale de la sesión (`apps/desk/server/routes/remision.ts:250`). Por eso hace falta G2.
- **El envío no guarda quién envía.** `reclamarEnvio` (`apps/desk/server/db/remisiones.ts:170-182`) no recibe usuario. Quien crea y quien envía pueden ser personas distintas: el botón «Enviar esa» manda una remisión previa (`apps/desk/src/components/CrearRemision.tsx:356`). `users.name` no es único (`packages/zoho-sync/src/db/schema.sql:85`), así que el nombre no sirve para dirigir un aviso.
- **El callback guarda el resultado sin leerlo** (`apps/desk/server/routes/remision.ts:355-376`, `apps/desk/server/db/remisiones.ts:132-139`) y no es idempotente: cada llegada sobrescribe (`apps/desk/server/remisiones.test.ts:408-417`). `dymoId` ya está en el tipo (`packages/shared/src/types.ts:641`).
- **Avisos.** Se dirigen por `user_id` (`apps/desk/server/db/avisos.ts:8-18`). El cargo se resuelve con `destinatariosDeCargoPermiso` (`apps/desk/server/db/avisos.ts:121-127`); «Director Técnico» es valor de `packages/shared/src/cargos.ts:13`. El molde de marca y aviso en una transacción, con respaldo al área, es `apps/desk/server/services/avisoReclamacionProveedor.ts:26-44`.
- **Formulario.** La casilla está en `apps/desk/src/components/CrearRemision.tsx:295-300`. `apps/desk/src/lib/recepcionForm.ts:65` y `apps/desk/src/lib/recepcionForm.ts:94` pasan un `rotuladoAt` fijo. Las remisiones de un ticket se pintan en `apps/desk/src/components/PanelRemisiones.tsx:12-101`, que hoy no enseña el rotulado.
- **Pruebas que cambian a propósito.** Orden del envío: `packages/shared/src/recepcion.test.ts:272` (PE-3) y `apps/desk/server/recepcion.test.ts:463` (S3a). Orden del alta: `packages/shared/src/recepcion.test.ts:93` (PA-3, pares con el paso 6 en `packages/shared/src/recepcion.test.ts:117-126`). Rechazo sin rotulado: `apps/desk/server/recepcion.test.ts:73`, `apps/desk/src/lib/recepcionForm.test.ts:65-66` y `apps/desk/src/lib/recepcionForm.test.ts:88`. Traza de las casillas atada al rotulado: `apps/desk/server/recepcion.test.ts:570` (PT-1b). Hay 51 apariciones literales de `rotulado: true` en cuatro ficheros de prueba (35, 7, 6 y 3): **no hace falta tocarlas**, porque el valor pasa a ignorarse.
- **Hallazgo.** La definición «falló algún aviso (correo o Telegram)» está dos veces: en `packages/shared/src/types.ts:699-701` y en `apps/desk/server/db/remisiones.ts:129-130`, y RQ-RE-05 cita la segunda (`openspec/specs/remisiones/spec.md:169-170`).
- **Datos del flujo de n8n: segunda mano, hipótesis.** Los leyó el analista el 2026-10-12, en sólo lectura, en el nodo «Code Resumen Entrada» del flujo `Remisiones_ST_3.13_Desk`; esta sesión no abrió n8n ni hay una ejecución real contra la que contrastar. La etiqueta es un paso no crítico; si falla y nada crítico falla, llega `estado: 'ok_con_avisos'` con `resultado.dymoId` en `null`; también llega `null` si la etiqueta se subió y no se pudo mover a la carpeta.

## Alcance

### Dentro

1. **El alta y el envío dejan de exigir el rotulado.** Se quita el paso 6 de `validarRecepcion` y el paso (a) de `motivoNoEnviable`, sin reordenar los demás. Un `rotulado: true` de un cliente antiguo se ignora: el alta ya no escribe `rotulado_at` ni `rotulado_por`.
2. **G2.** Las cuatro columnas de las casillas toman el usuario y la hora del alta, sin pasar por el rotulado.
3. **Acción nueva del servidor para confirmar el rotulado**, sobre una remisión de entrada del formulario nuevo, enviada con éxito (`ok` u `ok_con_avisos`) y no anulada. Escribe `rotulado_at` (reloj del servidor) y `rotulado_por` (sesión) una sola vez.
4. **«Pendiente de rotular», calculada por el servidor:** enviada con éxito, no anulada, del formulario nuevo y sin `rotulado_at`. Viaja como un campo de la remisión en las dos lecturas (`apps/desk/server/routes/remision.ts:97-102` y `apps/desk/server/routes/remision.ts:110-114`). No entra en ninguna guarda.
5. **Quién envía.** `enviado_por_id` se escribe en cada envío que gana la reclamación y se sobrescribe en un reenvío.
6. **Aviso «la etiqueta no se generó»** (G1), al llegar el callback: a quien envió y a quien lleve el cargo Director Técnico, una sola vez por remisión, con `aviso_sin_etiqueta_at` como marca. Un fallo del aviso no altera la respuesta del callback.
7. **Formulario.** La casilla sale del alta; la confirmación aparece tras el envío y en la tarjeta de la remisión. La lógica va en `apps/desk/src/lib`, con pruebas.
8. **Esquema.** Dos sentencias `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS …`, calificadas y al final de `packages/zoho-sync/src/db/schema.sql` (hoy termina en la línea 828): `enviado_por_id text` y `aviso_sin_etiqueta_at timestamptz`. Sin relleno.
9. **Comentarios que dicen algo falso**, corregidos en sitio y sin mover líneas: `packages/shared/src/types.ts:699-701` y, por ser la misma frase, `apps/desk/server/db/remisiones.ts:129-130`.
10. **Delta de especificación** de `remisiones` y de `derivacion-avisos`, y `correccion-maestro.md`.

### Fuera

- **n8n:** no se toca; el nodo de la etiqueta y su fecha se quedan como están (consecuencia 5 de la decisión).
- **Reordenar las guardas del alta** (desvío IV-12): se quita un paso, no se mueve ninguno.
- **Hacer idempotente el callback** en general; sólo el aviso lleva marca anti-duplicado.
- **Relleno o migración de datos**; el recuento de modelos sin accesorios; el correo del aviso.
- **Deshacer una confirmación** desde la aplicación.

## Capacidades

- **Nuevas:** ninguna (R-2 no aplica).
- **`remisiones`, modificados** (rangos en `openspec/specs/remisiones/spec.md` sobre `a947b48`):

| Requisito | Líneas | Qué cambia |
|---|---|---|
| RQ-RE-05 | 157-170 | La definición de `ok_con_avisos` admite la etiqueta |
| RQ-RE-08 | 218-270 | La puerta de contenido pasa a fotos mínimas y foto por novedad |
| RQ-RE-19 | 590-624 | El formulario no pide la casilla al crear; la confirmación va tras el envío |
| RQ-RE-23 | 920-1010 | Párrafo de posición y escenario «Las novedades corren antes que el rotulado» |
| RQ-RE-24 | 1012-1040 | Deja de ser obligatoria en el alta; persona y hora siguen saliendo del servidor |
| RQ-RE-26 | 1093-1207 | Se retira el punto 1 y los escenarios que lo fijan |
| RQ-RE-38 | 1887-1943 | La traza de las casillas ya no remite a la del rotulado (G2) |

- **`remisiones`, nuevos al final** (el último es RQ-RE-39, que empieza en la línea 1945): **RQ-RE-40**, confirmar el rotulado tras el envío, con el orden de sus guardas; **RQ-RE-41**, «pendiente de rotular» la calcula el servidor y no bloquea nada; **RQ-RE-42**, el envío guarda quién envía. A decidir por `sdd-spec`: si RQ-RE-27 (líneas 1209-1250) necesita retoque, y que los requisitos modificados conserven su número de líneas para no desplazar citas.
- **`derivacion-avisos`, nuevo al final: RQ-AV-22** (el último es RQ-AV-21, `openspec/specs/derivacion-avisos/spec.md:958`), con el molde de RQ-AV-19 (`openspec/specs/derivacion-avisos/spec.md:786-813`).

## Enfoque y reglas

- **`strict_tdd`.** Las pruebas nacen rojas. Las de orden se cambian a propósito y lo dicen en la propia prueba.
- **Regla invariable 13.** La marca y quién puede confirmar los decide el servidor; el predicado vive en `packages/shared` y el cliente lo consume.
- **Regla de mutación 1.** Las guardas de la acción nueva siguen el orden total: existencia (`404`) < estado y permiso (sin permiso, anulada, de legado, sin envío con éxito) < contenido < unicidad (ya confirmada). Cada par vecino tiene su prueba de posición. En el envío, la prueba de orden pasa a fijar mínimas antes que novedades.
- **Regla de mutación 2.** El guardián de `ALTER TABLE` (`packages/zoho-sync/src/db/migrate.test.ts:322`) vigila `schema.sql`: se comprueba ensuciando el fichero con una de las dos sentencias sin calificar.
- **Regla de mutación 3, por escrito.** La línea del servidor de las filas 1, 2 y 4 nace con este cambio: es hipótesis hasta el `apply`.

| Nº | Decisión del cliente | Quién la impone |
|---|---|---|
| 1 | Pinta «Pendiente de rotular» | El campo calculado por el servidor en las dos lecturas |
| 2 | Ofrece «Confirmar rotulado» sólo a quien puede y sólo si está pendiente | Las guardas de la acción nueva |
| 3 | Deja crear y enviar sin la casilla | El servidor ya no la exige: se retiran `packages/shared/src/recepcion.ts:101` y `packages/shared/src/recepcion.ts:155` |
| 4 | Da el rotulado por confirmado tras pulsar | La respuesta de la acción, con la traza escrita |

- **Regla de mutación 4.** `packages/shared/src/recepcion.ts`, `apps/desk/server/routes/remision.ts`, `apps/desk/server/db/remisiones.ts` y `packages/shared/src/types.ts` son ficheros muy citados: se edita en sitio o al final, y la ruta nueva se registra al final de `registerRemisionRoutes`. Lo que crezca por el medio se dice y se barre al cierre.
- **El aviso.** Marca y avisos en una transacción; destinatarios sin repetir; dentro de un `try` que sólo registra el fallo. Sólo de bandeja, como RQ-AV-19: sin interruptor nuevo.

## Qué verá el técnico

- **Antes de enviar:** el formulario ya no pregunta por el rotulado. Marca novedades, casillas y fotos, crea y envía.
- **Después de enviar:** cuando el envío termina bien, la pantalla de resultado dice que el equipo está pendiente de rotular y ofrece «Confirmar rotulado y guardado». Si cierra sin confirmar, la tarjeta de esa remisión en el ticket muestra «Pendiente de rotular» con el mismo botón, hasta que alguien confirme. Después muestra quién confirmó y cuándo.
- **Si la etiqueta no se generó:** quien envió y el Director Técnico reciben un aviso en la campana. El ticket avanza igual.

## El texto del aviso

> Ticket #1234: la remisión de entrada se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo (serial ABC123) sigue sin etiqueta para rotular: hay que generarla a mano. Lo que informó n8n: la etiqueta .dymo — no se pudo subir el archivo.

La última frase sólo aparece si `resultado.avisos` trae algo; se copia tal cual, sin seleccionar por el texto del paso. Sin ticket asociado, empieza por «La remisión de entrada del 2026-10-12».

## Supuestos reversibles

Regla de las preguntas a Gerencia (E-237): plazo de corrección, **2026-10-19**. G1 y G2 ya están aprobados.

| Nº | Supuesto | Por qué |
|---|---|---|
| G1 | «No se generó» = callback `ok` u `ok_con_avisos` con `resultado.dymoId` vacío, `null` o ausente (o sin `resultado`). **Aprobado** | No depende del texto de un paso del flujo |
| G2 | La traza de las casillas es el usuario y la hora del alta. **Aprobado** | El alta deja de escribir el rotulado |
| S1 | Confirma quien tiene el área Servicio Técnico, o un administrador | Es quien rotula. Ojo: crear y enviar sólo piden sesión (`apps/desk/server/routes/remision.ts:120`, `apps/desk/server/routes/remision.ts:273`) |
| S2 | La confirmación no se deshace desde la aplicación; repetirla responde `409` y no reescribe la traza | «Una sola vez», con traza |
| S3 | La marca se pinta en la tarjeta de la remisión del ticket y en la pantalla de resultado; no en el tablero ni en el listado general | Informa, no alarma |
| S4 | Remisión enviada antes de este cambio, sin `enviado_por_id`: el aviso va sólo al Director Técnico | No hay a quién más dirigirlo |
| S5 | Remisión creada antes del despliegue y enviada después: conserva su `rotulado_at` y queda como confirmada | Sin relleno ni migración |
| S6 | Reenvío o callback repetido tras un aviso ya dado: no se repite | Una marca por remisión |
| S7 | Si quien envió es además Director Técnico, recibe un solo aviso | Destinatarios sin repetir |
| S8 | Sin nadie con el cargo, respaldo al área Servicio Técnico; sin ningún destinatario, no se marca y se reintenta en el siguiente callback | Molde de RQ-AV-19 |
| S9 | El aviso es sólo de bandeja, sin correo | Molde de RQ-AV-19; evita un interruptor nuevo |
| S10 | Las remisiones de legado (`novedades` `NULL`) ni se marcan ni admiten la confirmación; el aviso sí les aplica | Nunca tuvieron rotulado |
| S11 | Una confirmación ya hecha no se borra si después llega un callback con `error` | La traza es de un hecho físico |
| S12 | Se corrige también el comentario de `apps/desk/server/db/remisiones.ts:129-130` | Es la misma frase falsa |

## Áreas afectadas

**Modificados:** `packages/shared/src/recepcion.ts`, `packages/shared/src/types.ts`, `apps/desk/server/routes/remision.ts`, `apps/desk/server/db/remisiones.ts`, `packages/zoho-sync/src/db/schema.sql`, `apps/desk/src/lib/recepcionForm.ts`, `apps/desk/src/lib/remisionResultado.ts`, `apps/desk/src/api/client.ts`, `apps/desk/src/components/CrearRemision.tsx`, `apps/desk/src/components/PanelRemisiones.tsx`, `apps/desk/src/components/ResultadoRemision.tsx`, y las pruebas `packages/shared/src/recepcion.test.ts`, `apps/desk/server/recepcion.test.ts`, `apps/desk/src/lib/recepcionForm.test.ts`. **Nuevos:** `apps/desk/server/services/avisoSinEtiqueta.ts` y sus pruebas; pruebas de la acción nueva. **Al archivar:** las dos especificaciones vivas. **No se tocan:** `apps/desk/server/remisionWebhook.ts`, las transiciones, n8n.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Los datos de n8n son de segunda mano: si `dymoId` llegara vacío en un envío bueno, el aviso saltaría siempre | Media | Tarea de persona: contrastar con una ejecución real antes de publicar. Vuelta atrás sin datos que restaurar |
| S1 es más estricto que crear y enviar: quien envía sin el área no podría confirmar | Media | Supuesto con plazo; cambiarlo es una línea del predicado |
| Nadie confirma y la marca se queda para siempre | Media | Es lo decidido: informa, no bloquea. Queda medible por consulta |
| El navegador con el formulario antiguo en caché sigue pidiendo la casilla | Baja | Inocuo: el servidor ignora el dato |
| Citas desplazadas en cuatro ficheros muy citados | Media | Edición en sitio y barrido al cierre |

## Migración y despliegue

Dos sentencias idempotentes, sin relleno. Al desplegar: (1) las dos columnas existen en `public.remisiones`; (2) ninguna remisión anterior aparece como pendiente de rotular; (3) una remisión nueva se crea y se envía sin casilla, aparece pendiente y se confirma una vez; (4) el ticket avanza a «Remisión creada» sin confirmar.

## Vuelta atrás

Revertir el commit. Las dos columnas se quedan, sin uso. **Efecto a conocer:** una remisión creada con la versión nueva y todavía sin enviar no tiene `rotulado_at`, y la versión anterior no la deja enviar; habría que crearla de nuevo. Las ya enviadas no se ven afectadas.

## Criterios de éxito

- [ ] Un alta sin `rotulado` responde `201`; con `rotulado: true`, también, y `rotulado_at` queda en `NULL`.
- [ ] Una remisión sin rotulado y con sus fotos se envía; la prueba de orden fija mínimas antes que novedades.
- [ ] Las casillas guardan usuario y hora del alta.
- [ ] La acción confirma una sola vez y cada par de guardas vecinas tiene prueba de posición; moverlas la pone en rojo.
- [ ] La marca vale verdadero sólo si enviada con éxito, no anulada, del formulario nuevo y sin `rotulado_at`.
- [ ] Ninguna transición ni guarda de transición lee el rotulado.
- [ ] El aviso salta con `dymoId` ausente, `null` y cadena vacía; no salta con `dymoId` presente ni con estado `error`; no se repite; un fallo suyo deja el callback en `200`.
- [ ] Sin `enviado_por_id`, el aviso va sólo al cargo; quien envía y lleva el cargo recibe uno.
- [ ] El guardián de `ALTER TABLE` se pone rojo con una de las dos sentencias sin calificar.

## Presupuesto

Estimación con ×1,8 incluido; techo por intento 800, válvula 720. Se mide antes de cerrar cada intento.

| Intento | Estimado | Nota |
|---|---|---|
| Planificación A: propuesta y especificación | ≤ 780 | El delta repite enteros siete requisitos, unas 430 líneas |
| Planificación B: diseño y tareas | ≤ 450 | Se parte en dos porque junta supera el techo |
| `apply`, lote 1: shared, servidor y esquema | ≤ 650 | Si la medida pasa de 720, el aviso se separa en un lote propio |
| `apply`, lote 2: cliente | ≤ 250 | |
| `verify` | ≤ 250 | Incluye su informe |
| `archive`, parte revisable | ≤ 500 | La mudanza de carpetas no cuenta |

## Tareas de personas — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1).

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Contrastar los datos de n8n con una ejecución real: qué llega en `dymoId` cuando la etiqueta sale y cuando no | Quien administra n8n | Esta propuesta, «Medición previa» |
| Verificar en la aplicación, tras desplegar, los cuatro puntos de «Migración y despliegue» | Servicio Técnico | Informe de archivo |
| Pegar la corrección del maestro | Gerencia | `openspec/changes/rotulado-tras-enviar/correccion-maestro.md` |
| Decidir si el recuento de modelos sin accesorios retiene la fila F1B-04, y hacer el recuento | Gerencia · Servicio Técnico, contra producción | `docs/sdd/TRASPASO_2026-10-08.md` |
| Marcar E-167 como cerrada y actualizar E-163 a E-166 | Sesión de supervisión | `docs/sdd/ENTRADA.md` |
| Corregir, si procede, S1 a S12 antes del 2026-10-19 | Gerencia | Lista semanal de supuestos (E-237) |
