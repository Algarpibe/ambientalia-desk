---
tanda: F1B-13
motivo: ""
capacidad: [tickets-core, permissions, derivacion-avisos]
maestro: ["M4.4", "Anexo D nº 7"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `ficha-garantia-proveedor`

Construye `decision/anexo-7-garantia-proveedor` (`openspec/config.yaml:2340`), desbloqueada por
`decision/e157-ovi-garantia-por-cargo` (`openspec/config.yaml:3954`); fila del plan
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93`; bandeja: E-034 (`docs/sdd/ENTRADA.md:544`). Lo
leído en el código está en `exploration.md` de esta carpeta, sobre el worktree `ficha-garantia-proveedor`.

*Sobre la cabecera.* `maestro`: el pasaje leído es
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2660-2668`, bajo el encabezado M4.4
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2597`); el maestro lo empareja con
«nº 7» en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5143-5145` (que esa tabla
sea la del Anexo D es hipótesis). `cierra: no`: quedan fuera tres partes del contenido de la fila (§2).
`toca_maestro: si`: el maestro dice «al crear la OVI» y «valor reclamado tomado del costo de la OVI», y ninguna
de las dos cosas queda así (§11). Sin capacidad nueva: la ficha vive en `tickets-core`, como el registro de
contrato (RQ-TC-21).

## 1 · Intención

Hoy la reclamación de una garantía al fabricante no existe en la aplicación: no hay tabla, ruta ni pantalla
(`exploration.md` §5). Una OVI se asocia a un ticket y nadie registra si se reclamó, a quién, por cuánto ni qué
se recuperó. Al terminar: el Director Técnico responde «¿Se reclama al fabricante?» sobre cada OVI asociada; un
«sí» abre una ficha que sigue su curso aparte del ticket (abierta → enviada al fabricante → resuelta), un «no»
guarda su motivo; y una reclamación sin resolver a los 60 días le llega como aviso.

## 2 · Alcance

**Dentro**

1. Reglas puras en `packages/shared`: los tres motivos del «no», los tres estados y sus pasos, los tres
   resultados, y qué exige cada paso.
2. Tabla `public.garantia_proveedor`, calificada, al final de `schema.sql`, en `PUBLIC_TABLES`.
3. Cuatro rutas: responder la pregunta sobre una asociación OVI vigente, editar los datos de la ficha, avanzar su
   estado y leer por ticket.
4. Panel en el detalle del ticket, junto a `PanelOvAsociaciones`: la pregunta, la ficha y la marca «pendiente de
   respuesta».
5. Aviso de 60 días al cargo de permiso Director Técnico, con respaldo al área Servicio Técnico, en la pasada
   periódica.

**Fuera — y por eso `cierra: no`**

- **(a) El valor reclamado tomado automáticamente del costo de la OVI.** Las líneas de las órdenes no están en
  la base `desk` (`exploration.md` §4), y saber si `books.sales_orders.raw` trae el costo exige datos de
  producción (P-1).
- **(b) Las dos mediciones**: recuperado frente a reclamado por marca, y piezas con fallas repetidas con su
  enlace a la taxonomía ISO 14224
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2666`). La tabla guarda los datos
  que harán falta; el cálculo y su pantalla no se construyen.
- **(c) El envío físico de la pieza por remisión sin ticket**
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2667`): depende de F1B-16, que el
  plan tiene «condicionada» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96`).
- Las cuatro puertas de entrada de una orden (`ticketService.ts`, `remision.ts`), IV-12, el sincronizador y
  `transitions.ts`: no se tocan.
- Relleno retroactivo: las OVI ya asociadas no se responden solas (S-11).
- Correo: el aviso es sólo de bandeja.

## 3 · Enfoque

**Un acto propio sobre la asociación (S-1).** La pregunta no se cuelga de las cuatro puertas por las que entra
una orden: se responde después, con una ruta propia sobre `ov_asociaciones.id`. La asociación nunca se borra
(`packages/zoho-sync/src/db/ovAsociaciones.ts:105-108`), así que su `id` es una referencia estable.

- **`packages/shared`**, módulo nuevo y puro (nombre de trabajo `garantiaProveedor.ts`): `MOTIVOS_NO_RECLAMA`,
  `ESTADOS_RECLAMACION`, `RESULTADOS_RECLAMACION`, `siguienteEstado`, validadores del cuerpo de cada acto que
  devuelven motivo o `null`, y `DIAS_AVISO_RECLAMACION = 60`. El permiso NO se reescribe: se consume
  `puedeCrearOVIGarantia` (`packages/shared/src/cargos.ts:71-74`) y «es OVI» se consume de `esOVI`
  (`packages/shared/src/subOV.ts:63-67`).
- **Tabla** `public.garantia_proveedor`: una fila por asociación respondida, con índice único por
  `asociacion_id` (S-3). Guarda la respuesta (sí o no, motivo, quién, cuándo), copia `ticket_id` y el número de
  la OVI (S-8) y, si es «sí», los datos de la ficha (§5). Sin `CHECK` de listas: las impone el servidor desde
  `shared`, como `cargo_permiso` (`packages/zoho-sync/src/db/schema.sql:601`). El diseño fija las columnas.
- **Servidor**: capa de datos y un fichero de rutas nuevo, registrado en la línea que ya registra las de
  asociaciones (`apps/desk/server/app.ts:61`, reescrita en sitio). Molde: la escalera de
  `apps/desk/server/routes/ovAsociaciones.ts:45`.
- **Aviso**: servicio nuevo con el patrón de `marcarYAvisarRitmo`
  (`apps/desk/server/services/avisoRitmoContrato.ts:25-37`): la marca anti-ruido es una columna de la ficha, y
  el `UPDATE … RETURNING` que la pone va en la misma transacción que los avisos. Destinatarios por
  `cargo_permiso` con una consulta nueva, porque `destinatariosDeCargo` filtra el cargo de firma
  (`apps/desk/server/db/avisos.ts:109`); si nadie lleva el cargo, `destinatariosDeArea` con «Servicio Técnico»
  (`apps/desk/server/db/avisos.ts:74`). Se engancha en la cadena de `apps/desk/server/index.ts:88`, una
  evaluación por día civil y sin lanzar.
- **Cliente**: un panel hermano de `PanelOvAsociaciones`, montado reescribiendo
  `apps/desk/src/components/TicketDetailView.tsx:320` y su importación de la línea 15 del mismo fichero: cero
  líneas insertadas en un fichero citado.

## 4 · Guardas nuevas

| # | Acto | Guarda | HTTP | Escalón | Posición probada contra |
|---|---|---|---|---|---|
| G1 | Responder | La asociación no existe | 404 | A | G2: id inexistente y sin cargo → `404` |
| G2 | Responder | Sin el cargo Director Técnico ni administrador | 403 | B | G3: asociación liberada y sin cargo → `403`; G6: ya respondida y sin cargo → `403` |
| G3 | Responder | La asociación está liberada | 409 | B | G4: liberada y que no es OVI → `409` |
| G4 | Responder | La orden de la asociación no es OVI | 422 | C | G5: no es OVI y cuerpo inválido → el `422` de «no es OVI» |
| G5 | Responder | Respuesta ausente, motivo fuera de la lista, o fabricante vacío en un «sí» | 422 | C | G6: ya respondida y cuerpo inválido → `422` |
| G6 | Responder | La asociación ya tiene respuesta | 409 | D | G2 y G5 (arriba) |
| G7 | Avanzar | La ficha no existe (una respuesta «no» no es ficha) | 404 | A | G8: inexistente y sin cargo → `404` |
| G8 | Avanzar | Sin cargo | 403 | B | G9: sin cargo y paso no permitido → `403` |
| G9 | Avanzar | El paso no aplica desde el estado actual | 409 | B | G10: paso no permitido y contenido inválido → `409` |
| G10 | Avanzar | Contenido del paso: resultado fuera de la lista, valor recuperado inválido | 422 | C | G9 (arriba) |
| G11 | Editar | La ficha no existe | 404 | A | G12: inexistente y sin cargo → `404` |
| G12 | Editar | Sin cargo | 403 | B | G13: ficha resuelta y sin cargo → `403` |
| G13 | Editar | La ficha está resuelta y ya no se edita | 409 | B | G14: resuelta y contenido inválido → `409` |
| G14 | Editar | Contenido: fabricante vacío, valor reclamado no numérico o negativo | 422 | C | G13 (arriba) |

Leer no tiene guarda propia: cualquier sesión (S-2), como las lecturas de asociaciones
(`apps/desk/server/routes/ovAsociaciones.ts:26`).

*Por qué G4 es C y no A.* La asociación existe y quien actúa tiene permiso; lo que no vale es la clase de su
número, la misma razón por la que la cuarentena es C (`packages/shared/src/subOV.ts:18-20`). G6 es D: pregunta por
otra fila, y la respalda el índice único (la carrera se traduce de `23505` a `409`, como
`packages/zoho-sync/src/db/ovAsociaciones.ts:75`).

**Un par más, y los que no son observables.** G3 frente a G6 comparten código: liberada y ya respondida da el
`409` de liberada, distinguible sólo por el texto, y se prueba por el texto. G1 frente a G3–G6 no es observable:
sin fila no hay nada más que juzgar. Lo mismo G7 frente a G9–G10 y G11 frente a G13–G14.

## 5 · Datos de la ficha

«Fuente» es la línea 2664 del maestro R08.4, salvo donde se indica; la decisión dice lo mismo
(`openspec/config.yaml:2345`).

| Dato | Qué dice la fuente | De dónde sale el valor | Respaldo |
|---|---|---|---|
| Respuesta (sí / no) | Línea 2663: el Director Técnico responde | La teclea quien responde | lo dice la fuente; el momento, supuesto S-1 |
| Motivo del «no» | Línea 2663: lista cerrada de tres | Lista de `shared`; obligatorio en un «no» | lo dice la fuente |
| Quién y cuándo respondió | No lo nombra | La sesión y el reloj del servidor | supuesto S-2 (traza mínima) |
| Ticket de origen | «ticket … de origen» | `ticket_id` de la asociación, copiado | lo dice la fuente |
| OVI de origen | «OVI de origen» | `numero` de la asociación, copiado y congelado | lo dice la fuente; que se copie, supuesto S-8 |
| Fabricante | «fabricante» | Texto; el panel propone la marca del ticket (`packages/zoho-sync/src/db/schema.sql:28`) | lo dice la fuente; el origen, supuesto S-5 |
| Pieza: referencia | «pieza (referencia y serial)» | Texto libre | lo dice la fuente; la forma, supuesto S-5 |
| Pieza: serial | «pieza (referencia y serial)» | Texto libre | lo dice la fuente; la forma, supuesto S-5 |
| RMA | «número de caso del fabricante (RMA)» | Texto, vacío al abrir | lo dice la fuente; vacío al abrir, supuesto S-5 |
| Valor reclamado | «valor reclamado (tomado del costo de la OVI)» | Captura manual, en pesos | **supuesto S-4**: la fuente dice otra cosa y queda fuera (a) |
| Origen del valor reclamado | No lo nombra | Constante `manual` | supuesto S-4 |
| Estado | «abierta → enviada al fabricante → resuelta» | Lista de `shared`; nace «abierta» | lo dice la fuente; sólo hacia delante, supuesto S-6 |
| Resultado | «resuelta: reposición, nota crédito o rechazada» | Lista de `shared`; obligatorio al resolver | lo dice la fuente |
| Valor recuperado | «valor recuperado» | Captura manual al resolver; `0` si «rechazada» | lo dice la fuente; cuándo, supuesto S-6 |
| Fechas de apertura, envío y resolución | No las nombra; la línea 2665 presupone la de apertura | Reloj del servidor en cada paso | supuesto S-7 |
| Marca del aviso de 60 días | No la nombra | La pasada, en la transacción del aviso | supuesto S-12 |

## 6 · Supuestos anotados

Todos reversibles. S-1 a S-9 los fijó el orquestador; S-10 a S-12 los añade esta propuesta al leer el código.

| # | Supuesto | Por qué es razonable | Cómo se revierte |
|---|---|---|---|
| S-1 | La pregunta es un acto propio sobre la asociación, no un campo de las cuatro puertas. Una OVI asociada queda «pendiente de respuesta» hasta que se responde | Las puertas no comparten cuerpo ni transacción; así no se tocan `ticketService.ts`, `remision.ts` ni IV-12. Quien asocia y quien responde es el mismo cargo | Exigir la respuesta dentro de cada puerta: cambio propio sobre las cuatro, con sus pruebas de posición |
| S-2 | Responder, editar y avanzar: `puedeCrearOVIGarantia`. Leer: cualquier sesión | La fuente nombra al Director Técnico; leer no decide nada | Otro predicado en las tres rutas |
| S-3 | Una ficha por asociación OVI ↔ ticket, con una pieza | La fuente nombra la pieza en singular | Tabla hija de piezas; la ficha no cambia |
| S-4 | Valor reclamado manual, con su origen `manual`, en pesos | El costo de la línea no está en `desk` (`exploration.md` §4). Que la moneda base de Books sea el peso es hipótesis | Cuando P-1 confirme el dato: origen `ovi` y relleno automático; las fichas manuales conservan su origen |
| S-5 | Fabricante: texto, con la marca del ticket propuesta y editable. Referencia y serial de la pieza: texto libre. RMA vacío al abrir | No hay catálogo de fabricantes ni de piezas; el RMA lo da el fabricante después | Enlazar con el catálogo de marcas o de artículos |
| S-6 | Estados sólo hacia delante. Abrir exige fabricante. «Enviada» no exige nada más (la fuente no pide RMA). «Resuelta» exige resultado y valor recuperado (`0` si «rechazada»). Una ficha resuelta no se edita | La fuente dibuja una flecha y no nombra retrocesos ni requisitos por paso: se toma el mínimo | Añadir requisitos por paso en `shared`, o un acto de reapertura |
| S-7 | El aviso cuenta 60 días NATURALES desde la apertura, mientras la ficha no esté resuelta. 60 va como constante con nombre | Gerencia lo propuso entre corchetes (`openspec/config.yaml:2350`); el fabricante no sigue el calendario laboral de Ambientalia | Cambiar la constante, o contar con el calendario laboral de F1B-12 |
| S-8 | Liberar la asociación no cierra ni borra la ficha, que conserva el número de la OVI | La reclamación «sigue su curso aparte» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2662`) | Cerrar la ficha al liberar, dentro de la transacción de liberar |
| S-9 | Sin interruptor | No hay escritor externo: el aviso sólo crea filas de bandeja (`apps/desk/server/db/avisos.ts:8`) | Añadir el flag, cerrado por defecto, si algún día sale correo |
| S-10 | La respuesta no se cambia: una segunda respuesta da `409` | Es el lado simple; la fuente no nombra rectificación | Un acto de rectificación con motivo, reservado al mismo cargo |
| S-11 | Las OVI asociadas antes de este cambio salen «pendiente de respuesta», sin relleno. Una asociación liberada sin respuesta no sale pendiente | No se inventan respuestas; cuántas son es dato de producción | Un barrido que las marque «anterior al cambio» |
| S-12 | Un solo aviso por ficha | La fuente dice «se avisa»; repetirlo es ruido | Marca por periodo, como el aviso de ritmo |

Ninguno contradice una decisión de `openspec/config.yaml` leída para esta propuesta (las dos claves citadas).
Queda una discrepancia interna de la propia decisión, que no bloquea: su consecuencia (2) habla de «cuatro
estados internos» (`openspec/config.yaml:2348`) y la respuesta textual enumera tres (`openspec/config.yaml:2345`).
Se construyen tres, que es lo que dicen la respuesta y el maestro.

## 7 · Cliente — regla invariable 13

El panel toma seis decisiones. Las líneas del servidor no existen todavía: el diseño nombra la ruta y el cierre
del lote 2 escribe la línea, decisión a decisión (regla de mutación 3).

| # | Decisión del cliente | Regla que consume | La impone |
|---|---|---|---|
| 1 | Enseña la pregunta y los botones sólo a quien tiene el cargo | `puedeCrearOVIGarantia`, de `shared` | G2, G8, G12 |
| 2 | Ofrece la pregunta sólo en asociaciones OVI vigentes | `esOVI`, de `shared` | G3, G4 |
| 3 | Lista de motivos del «no» | lista de `shared` | G5 |
| 4 | Ofrece sólo el paso siguiente del estado | `siguienteEstado`, de `shared` | G9 |
| 5 | Propone la marca del ticket como fabricante | ninguna: es relleno | nada que imponer; el servidor sólo exige que no esté vacío (G5, G14) |
| 6 | Pinta «pendiente de respuesta» | ninguna: lo lee de la respuesta del servidor | no decide nada |

Los `.tsx` están fuera de la red de pruebas por decisión de Gerencia: el panel no lleva rojo previo.

## 8 · Capacidades

**Nuevas:** ninguna.

**Modificadas:**

| Capacidad | Qué cambia |
|---|---|
| `tickets-core` | Requisitos nuevos desde RQ-TC-44: la respuesta y la ficha, sus datos, sus estados, las catorce guardas con su escalón, la lectura por ticket y lo que ocurre al liberar |
| `permissions` | Requisito nuevo desde RQ-PM-26: responder y gestionar la reclamación pide el mismo cargo que asociar la OVI; `puedeCrearOVIGarantia` gana llamadores (precisa RQ-PM-24, `openspec/specs/permissions/spec.md:635`) |
| `derivacion-avisos` | Requisito nuevo desde RQ-AV-19: aviso de 60 días, destinatarios por cargo de permiso con respaldo al área, marca en la misma transacción, pasada |

## 9 · Áreas afectadas y lotes

| Fichero | Impacto | Lote | Líneas estimadas |
|---|---|---|---|
| `packages/shared/src/garantiaProveedor.ts` + prueba + exportación | nuevo | 1 | 70 + 110 + 1 |
| `packages/zoho-sync/src/db/schema.sql` | añadido al final | 1 | 22 |
| `packages/zoho-sync/src/db/migrate.ts:73` | 1 línea reescrita en sitio | 1 | 2 |
| `packages/zoho-sync/src/db/migrate.test.ts` | recuento 28→29 y 41→42, y prueba de la tabla | 1 | 14 |
| Capa de datos de la ficha + prueba | nuevo | 1 | 90 + 80 |
| `apps/desk/server/routes/` rutas de la ficha | nuevo | 1 | 110 |
| `apps/desk/server/app.ts` | 1 línea reescrita | 1 | 4 |
| Prueba de servidor de las rutas (posiciones incluidas) | nuevo | 1 | 220 |
| `apps/desk/src/components/` panel nuevo | nuevo | 2 | 170 |
| `apps/desk/src/api/client.ts` | funciones nuevas | 2 | 40 |
| `apps/desk/src/components/TicketDetailView.tsx` | 2 líneas reescritas, 0 insertadas | 2 | 4 |
| `apps/desk/server/db/avisos.ts` + prueba | consulta por `cargo_permiso` | 2 | 15 + 30 |
| Servicio del aviso + prueba | nuevo | 2 | 70 + 150 |
| `apps/desk/server/index.ts` | 1 línea reescrita | 2 | 2 |

| Lote | Contenido | Estimado |
|---|---|---|
| 1 | Servidor de la ficha | **723** |
| 2 | Cliente y aviso | **481** |

**El lote 1 no cabe con holgura y se dice ahora.** 723 estimadas ya rozan la válvula de 720 antes de cualquier
desviación. Corte previsto, para que partir no se improvise: **1a** `shared`, esquema, guardián y capa de datos
(389) y **1b** rutas y su prueba de servidor (334). La fase de tareas decide si lo planifica partido de entrada;
la recomendación de esta propuesta es que sí. Cada intento se mide con `git diff --shortstat --no-renames` más
`wc -l` de lo nuevo sin trackear. Aparte, cada uno con su fase: deltas de las tres specs, `verify-report.md` y
`archive-report.md`.

Ficheros muy citados que se tocan: `schema.sql` (sólo se añade al final), `migrate.test.ts` (las líneas del
recuento se reescriben en sitio; la prueba nueva va al final) y `TicketDetailView.tsx` (en sitio). El barrido de
citas del cierre comprueba igual qué AFIRMA cada cita que apunte a las líneas reescritas.

## 10 · Despliegue

- `DEPLOY.md`: **sin variables nuevas**. Tabla nueva en `public`, creada por `migrate` al arrancar. Se añade una
  comprobación de lectura tras desplegar, con el molde de la de F1B-04 (`DEPLOY.md:234`): que
  `public.garantia_proveedor` existe, porque la migración es tolerante por sentencia (`DEPLOY.md:237-238`).
- No toca la replicación ni el hub: la tabla no es de `books`.
- Condición ya registrada: el cargo Director Técnico asignado antes de publicar (P-3).

## 11 · Corrección para el maestro

Entrada **29** de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (la última es la 28,
`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1428`), al cierre:

- Línea 2663 del maestro R08.4: «Al crear la OVI de garantía» pasa a «sobre cada OVI asociada a un ticket, como
  acto propio»; mientras no se responde, la OVI figura «pendiente de respuesta».
- Línea 2664: «valor reclamado (tomado del costo de la OVI)» pasa a captura manual por ahora, con el motivo.
- Línea 2668: «sin empezar a 01/10» pasa a construida la ficha y el aviso; faltan las dos mediciones, el valor
  automático y el envío físico.

## 12 · Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El lote 1 supera 720 | Alta | Corte 1a/1b ya definido (§9) |
| Publicar sin el cargo asignado: sólo el administrador responde y nadie recibe el aviso por cargo | Alta si se olvida | P-3; el aviso cae en el respaldo al área |
| Todas las OVI previas aparecen «pendiente de respuesta» el día de publicar | Segura; volumen sin medir | S-11; se dice en el paquete de despliegue |
| El aviso depende de la pasada de sincronización con Zoho | Existente | Es el punto abierto que el maestro ya anota para el aviso de ritmo (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2659`); no se agrava |
| «Cuatro estados» de la consecuencia (2) frente a los tres de la respuesta | Baja | Se construyen tres; se deja escrito para quien lea la decisión |
| El valor manual se queda para siempre | Media | Se guarda el origen del valor, y P-1 tiene dueño |

## 13 · Marcha atrás

Revertir los commits del cambio. La tabla `public.garantia_proveedor` se queda en la base sin que nadie la lea:
`migrate` no borra, y ninguna otra tabla la referencia. Las asociaciones, los tickets y las cuatro puertas no
cambian, así que no hay dato que restaurar. Los avisos ya creados permanecen en la bandeja como texto.

## 14 · Tareas de persona — fuera del recuento

No son tareas del `tasks.md`. **Archivar este cambio no las da por hechas.**

| # | Qué | Dueño | Qué desbloquea | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Comprobar en producción si las líneas de una OVI traen costo, dónde (el `raw` de `books.sales_orders`, o sólo el hub) y en qué moneda | Gerencia, con quien tenga acceso a la base | El valor reclamado automático, parte (a) | Esta sección y el `archive-report.md`; como punto abierto con dueño en `docs/sdd/ENTRADA.md` al cierre |
| P-2 | Confirmar los 60 días y si son naturales | Gerencia | Deja firme S-7 | `decision/anexo-7-garantia-proveedor`, consecuencia (4) |
| P-3 | Asignar el cargo Director Técnico antes de publicar | Gerencia | Que alguien más que el administrador responda | `decision/e157-ovi-garantia-por-cargo`, consecuencia (5): ya registrado |
| P-4 | Pegar en el maestro la corrección 29 | Gerencia | El maestro deja de decir «al crear» y «tomado del costo» | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |

## 15 · Criterios de éxito

- [ ] Con el cargo, un «sí» sobre una OVI vigente abre la ficha en «abierta»; un «no» guarda uno de los tres motivos.
- [ ] Sin el cargo y sin ser administrador, responder, editar y avanzar dan `403`; leer funciona con cualquier sesión.
- [ ] Una asociación que no es OVI, liberada o ya respondida no admite respuesta, cada una con su código.
- [ ] La ficha sólo avanza abierta → enviada → resuelta, y resolver exige resultado y valor recuperado.
- [ ] Liberar la asociación deja la ficha intacta.
- [ ] Cada par de §4 tiene una prueba que se pone roja al mover la guarda.
- [ ] Una ficha sin resolver a los 60 días avisa una sola vez, al cargo o al área de respaldo.
- [ ] El guardián de `migrate.test.ts` cuenta 29 y 42; `ticketService.ts` y `remision.ts` no cambian.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde.
