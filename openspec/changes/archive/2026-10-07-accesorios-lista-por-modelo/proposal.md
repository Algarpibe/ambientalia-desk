---
tanda: F1B-04
motivo: ""
capacidad: [remisiones]
maestro: ["M1.2", "M2.1"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Accesorios de la remisión de entrada: la lista del modelo, con nombre oficial y SKU, y sin texto libre

## Por qué

`decision/e232-accesorios-lista-por-modelo` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`) responde a los
cinco puntos de E-232: «Sí a los cinco. Los accesorios salen de la lista por modelo que ya existe en el catálogo de
modelos, con nombre oficial y número de parte cuando lo haya. Contar antes del corte los modelos sin categoría de
accesorios. Nada de texto libre: un accesorio fuera de lista es novedad y lo añade el Director Técnico.»

El maestro vigente lo sitúa en M1.2
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1236-1237`) y en la fila F1B-04
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4130-4132`). La fila del plan es
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84`.

## Estado de partida, verificado contra el código

| Qué | Dónde | Estado |
|---|---|---|
| La lista por modelo existe y la remisión ya la usa | `apps/desk/server/db/checklistRemision.ts:31-43`; tabla en `packages/zoho-sync/src/db/schema.sql:392-402` | Construido. **No se duplica** |
| El alta de remisión rechaza lo que no esté en la lista (`422`) | `apps/desk/server/routes/remision.ts:194-197` | Construido |
| El formulario enseña sólo el nombre | `apps/desk/src/components/CrearRemision.tsx:261-266`; el servidor sirve nombres en `apps/desk/server/routes/remision.ts:68` | Falta el SKU |
| El catálogo admite un accesorio escrito a mano, sin artículo de Books | `apps/desk/server/routes/catalogo.ts:229-233`; pantalla en `apps/desk/src/components/CatalogoEquipos.tsx:1015-1020`, que además lo propone por defecto (`apps/desk/src/components/CatalogoEquipos.tsx:561`) | **Abierto** |
| Un artículo sin `item_id` puede pasar a clase `accesorio` por `PATCH` | `apps/desk/server/routes/catalogo.ts:288-300`: valida que la clase exista (`:291-295`) y nada más; la pantalla no ofrece ese cambio (`apps/desk/src/components/CatalogoEquipos.tsx:671-673`), así que sólo se llega por la API | **Abierto** |
| Copiar accesorios a otros modelos arrastra los de texto libre | `apps/desk/server/db/catalogoArticulos.ts:179` copia `itemId ?? null`; ruta en `apps/desk/server/routes/catalogo.ts:251-266` | **Abierto — tercera vía, hallada al verificar** (S-9) |
| Sólo el super administrador escribe la lista | `apps/desk/server/routes/catalogo.ts:213`; la pantalla del catálogo sólo se enseña al administrador (`apps/desk/src/components/Configuracion.tsx:130`) | El Director Técnico no tiene vía |

## Qué cambia

1. **Nombre oficial y SKU en el formulario.** `GET /api/remisiones/nueva` añade un campo **aditivo** con el detalle de
   cada ítem (nombre y SKU, o sólo nombre). `incluye: string[]` no cambia de forma ni de contenido
   (`packages/shared/src/types.ts:759`), ni lo que viaja a n8n (`apps/desk/server/remisionWebhook.ts:46`), ni cómo valida
   el alta. El formulario pinta el SKU junto al nombre cuando lo hay.
2. **Cierre del texto libre en el catálogo**, con la regla en `packages/shared` (fichero nuevo) e impuesta en el
   servidor: un artículo de clase `accesorio` exige artículo de Books. Se cierran el alta a mano
   (`apps/desk/server/routes/catalogo.ts:229-233`), el cambio de clase por `PATCH` de un artículo sin `item_id` y la copia
   a otros modelos de accesorios sin `item_id` (S-9). Las demás clases siguen admitiendo texto libre.
3. **Fuera de lista es novedad.** Se siembra una novedad nueva, `accesorio_fuera_de_lista`, con `exige_texto = true`,
   **al final** de `packages/zoho-sync/src/db/schema.sql` y con `ON CONFLICT (clave) DO NOTHING`, como las diez de
   `packages/zoho-sync/src/db/schema.sql:690-699`. El alta de remisión no gana ninguna guarda: la novedad se valida por
   las marcas del catálogo, por la vía que ya existe (`apps/desk/server/routes/remision.ts:158`).
4. **El Director Técnico añade a la lista del modelo.** Ruta nueva en **fichero nuevo**, con el permiso ya existente
   `puedeMantenerNovedades` (`packages/shared/src/mantenimientoNovedades.ts:15-18`). La clase la fija el servidor en
   `accesorio` y el artículo tiene que existir en Books; no acepta nombre del navegador. Pantalla propia en
   Configuración, al estilo de `NovedadesPanel` (`apps/desk/src/components/Configuracion.tsx:127`). El buscador de
   artículos (`apps/desk/server/routes/directory.ts:33-35`) y la lectura de la lista
   (`apps/desk/server/routes/catalogo.ts:153-157`) ya piden sólo sesión: se reutilizan.
5. **Consulta de sólo lectura** «modelos sin ningún accesorio activo», en `docs/sdd/`, junto a
   `docs/sdd/Consultas_Recuentos_2026-09-25.sql` (que ya lee esas tablas en `:77-84`). Cuenta manuales activos y
   derivados no ocultos. Ninguna sesión la ejecuta.

## Qué no cambia, y qué no se construye

- **No se toca el orden de guardas de `apps/desk/server/routes/remision.ts`.** IV-12 no se amplía ni se corrige. El
  fichero se edita en sitio, con el mismo número de líneas, sólo donde sirve el formulario (`:58`, `:68`).
- **No se construye la foto del accesorio.** Los documentos cuelgan del modelo, no del artículo
  (`packages/zoho-sync/src/db/schema.sql:359-361`), y la réplica de artículos no promueve imagen
  (`packages/zoho-sync/src/booksHub/mappers.ts:34-39`). No hay dónde guardarla.
- **No se confirma el «número de parte».** Se enseña el SKU (S-1).
- El Director Técnico **sólo añade**. Retirar, reordenar, copiar y borrar siguen siendo del super administrador.
- No se crea `openspec/specs/catalogo-equipos/spec.md`: la capacidad está declarada en `openspec/config.yaml` pero no
  tiene fichero, y los requisitos caben en `remisiones` (a continuación de RQ-RE-31,
  `openspec/specs/remisiones/spec.md:1441`), como hizo RQ-RE-29 (`openspec/specs/remisiones/spec.md:1346`). RQ-RE-03
  (`openspec/specs/remisiones/spec.md:78`) se amplía con el detalle.
- E-165 («Falta un accesorio» y su foto, `docs/sdd/ENTRADA.md:1817`) y E-166 (`docs/sdd/ENTRADA.md:1822`) siguen
  abiertas: son preguntas de Gerencia.

## Esta tanda NO cierra F1B-04

`cierra: no`. De la fila quedan, tras este cambio:

- la **mitad de salida de E-123** (fotos obligatorias en la remisión de salida), cuyo destino es una fila condicionada
  (`docs/sdd/ENTRADA.md:1693`);
- la **foto por accesorio** y la confirmación del **número de parte**, que esta tanda declara sin resolver;
- las preguntas abiertas E-163 a E-167.

Lo dejaron dicho los informes de archivo de `2026-10-03-recepcion-rotulacion-foto-entrada` y de
`2026-10-05-lista-novedades-mantenible` (sección de cobertura de la fila de cada uno).

## Compatibilidad — sin migración y sin escribir datos

| Dato existente | Qué pasa |
|---|---|
| Remisiones ya guardadas cuyo `incluye` contiene texto libre | Se siguen leyendo y reenviando tal cual: la lectura y el payload a n8n usan lo guardado (`apps/desk/server/remisionWebhook.ts:46`). Que ninguna lectura revalide contra el catálogo es **hipótesis** hasta que lo fije la prueba exigida abajo |
| Filas de `catalogo_articulos` de clase `accesorio` con `item_id NULL` | Se conservan. Siguen en la lista (`apps/desk/server/db/catalogoArticulos.ts:348-356`), el formulario las ofrece sin SKU y el alta las acepta. Se pueden desactivar, reactivar, reordenar y borrar. Lo que se cierra es **crear** otra |
| Lista por perfil (`remision_checklist`) de los tickets sin equipo | Intacta (`apps/desk/server/db/checklistRemision.ts:35-37`). Su detalle sale sin SKU |
| Las diez novedades sembradas | Intactas. La nueva es una fila más; una base ya desplegada la recibe en el arranque por la siembra, como recibió las diez |

**Prueba exigida:** una remisión guardada con un ítem que hoy no está en ninguna lista se lee y se envía sin error; una
fila `item_id NULL` de clase `accesorio` sigue apareciendo en el formulario y el alta la acepta; el perfil devuelve lo
de antes; y el payload a n8n conserva sus claves.

## Guardas nuevas y su escalón (F1B-10: A existencia < B permiso < C contenido < D unicidad)

| Puerta | Guarda nueva | Escalón | Prueba de posición frente a |
|---|---|---|---|
| `POST /api/catalogo/modelos/:id/articulos` | accesorio sin artículo de Books → `422` | C | tras «Modelo no encontrado» (A) y «Clase de artículo desconocida» (`apps/desk/server/routes/catalogo.ts:219`); **antes** de «El nombre es obligatorio»; antes del `409` |
| `PATCH /api/catalogo/articulos/:id` | pasar a `accesorio` un artículo sin `item_id` → `422` | C | tras «Clase de artículo desconocida»; antes de la escritura |
| Copia a otros modelos | los accesorios sin `item_id` no viajan y se cuentan como omitidos | C | caracterización: copiados y omitidos |
| Ruta nueva del Director Técnico | `404` modelo → `403` permiso → `422` falta el artículo o no está en Books → `409` repetido | A, B, C, D | cada par vecino, con las dos guardas activas a la vez (regla de mutación 1), como en `apps/desk/server/routes/novedades.ts:39-48` |

Regla de mutación 2: se ensucia `schema.sql` (quitar la fila nueva, quitar `ON CONFLICT`) y la suite se pone roja.

## Regla 13 — decisión del cliente → línea del servidor que la impone

| Decisión que toma el cliente | Servidor |
|---|---|
| Sólo se marcan accesorios de la lista; no hay campo para escribir uno | `apps/desk/server/routes/remision.ts:194-197` |
| Pinta nombre y SKU | No decide: los dos llegan del servidor (`apps/desk/server/routes/remision.ts:58`, `:68`) |
| El fuera de lista se marca como novedad, y exige texto | `apps/desk/server/routes/remision.ts:158`, con `packages/shared/src/recepcion.ts:97-99` |
| «Añadir a mano» deja de ofrecer la clase accesorio | Guarda nueva del `POST` del catálogo — **hoy no existe**; línea a fijar en `tasks.md` |
| La pantalla del Director Técnico se enseña sólo a quien puede | `403` de la ruta nueva — **hoy no existe**; línea a fijar en `tasks.md` |
| Esa pantalla sólo ofrece artículos de Books y no pide clase | Ruta nueva: artículo obligatorio y clase fijada — a fijar en `tasks.md` |
| No ofrece lo que ya está en la lista | `apps/desk/server/db/catalogoArticulos.ts:74`, que la ruta traduce a `409` |

Las tres filas sin línea son guardas que esta tanda construye; la tabla se cierra en `tasks.md` con su línea real. Los
`.tsx` quedan fuera de la red de pruebas (F0-00).

## Supuestos (regla de ejecución, reversibles)

- **S-1 · El SKU hace de número de parte.** El maestro los usa como equivalentes
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1236`, «nombre y SKU»;
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2675`, «número de parte o SKU»), pero la
  decisión lo deja como hipótesis. Sin SKU se enseña sólo el nombre.
- **S-2 · El permiso del Director Técnico es `puedeMantenerNovedades`**: área Servicio Técnico y cargo Director
  Técnico; el administrador pasa.
- **S-3 · El Director Técnico sólo añade artículos de Books, y siempre de clase `accesorio`.**
- **S-4 · Un accesorio real que no sea artículo de Books ya no se puede añadir** («Manuales», «Pletinas»:
  `packages/zoho-sync/src/db/schema.sql:388`). Lectura literal de «nada de texto libre». Los que ya existen se quedan.
- **S-5 · La novedad lleva `exige_texto`**: el nombre del accesorio viaja en el texto de la novedad. Orden 65, tras
  «Falta un accesorio» (`packages/zoho-sync/src/db/schema.sql:695`), sin renumerar las demás.
- **S-6 · Legado y perfil intactos**, sin migración ni relleno.
- **S-7 · «Modelos sin categoría de accesorios» se lee como «sin ningún accesorio activo»**: la asignación por
  categoría está cerrada para accesorios (`apps/desk/server/routes/catalogo.ts:176-179`).
- **S-8 · El SKU no se guarda en la remisión**: es dato de presentación del formulario.
- **S-9 · La copia a otros modelos omite los accesorios sin `item_id`.** No estaba en el encargo: es la tercera vía por
  la que nace un accesorio de texto libre. Si no se quiere, se retira del lote 1 y queda declarada abierta.
- **S-10 · El texto es uno por remisión.** Si se marcan a la vez «Otro» y la novedad nueva, comparten el mismo texto
  (`packages/shared/src/recepcion.ts:97-99`, `:59-60`). No se cambia `validarRecepcion` en esta tanda.

## Ronda de preguntas (modo `auto`: no se formuló; quedan para Gerencia)

1. ¿El SKU de Books es el número de parte, o sale de otro campo? (S-1)
2. Los accesorios que no son artículo de Books, ¿se dan de alta en Books o se admite una excepción? (S-4)
3. ¿El Director Técnico también retira y reordena, o sólo añade? (S-3)
4. Marcadas «Otro» y «Accesorio fuera de lista» a la vez, ¿un texto o dos? (S-10)

## Tareas de persona — fuera del recuento; archivar no las da por hechas

| Tarea | Dueño | Destino y dónde queda escrita |
|---|---|---|
| Ejecutar en producción la consulta de modelos sin accesorios, antes del corte | Quien tenga acceso a la base de producción | Paquete de despliegue; `docs/sdd/ENTRADA.md` e informe de archivo |
| Completar la lista de los modelos que salgan vacíos | Director Técnico | Informe de archivo |
| Confirmar de qué campo de Books sale el número de parte | Gerencia | Punto abierto; `docs/sdd/ENTRADA.md` |
| Verificar en la aplicación el formulario y la pantalla nueva | Quien verifica la aplicación | Informe de archivo |
| Pegar en el maestro la corrección de M1.2 | Gerencia | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |

`toca_maestro: si`: M1.2 no dice que el fuera de lista es novedad ni quién lo añade, y la lista de novedades de
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1240` gana una. La corrección se entrega
como texto.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Desplazar citas en ficheros muy citados (`remision.ts`, `catalogo.ts`, `schema.sql`, `types.ts`, `CrearRemision.tsx`) | Media | Edición en sitio con el mismo número de líneas; lo nuevo, en módulos nuevos o al final. El campo nuevo de `RemisionNueva` (`packages/shared/src/types.ts:739`) no inserta líneas. Barrido de la regla de mutación 4 al cierre |
| La siembra pasa de diez a once y hay pruebas y documentos que dicen «diez» | Alta | Se actualizan en el mismo lote: `packages/zoho-sync/src/db/novedadesSiembra.test.ts:78-80`, `apps/desk/server/recepcion.test.ts:25`, `DEPLOY.md:241` |
| La novedad nueva exige su foto, como toda novedad marcada (`packages/shared/src/recepcion.ts:140-142`) | Segura | Es coherente: el accesorio está delante. Se declara |
| Modelos con la lista vacía: el técnico no puede marcar ni escribir nada | Media | La consulta de persona, antes del corte; el aviso del formulario (`apps/desk/src/components/CrearRemision.tsx:245-248`) se reescribe en sitio |
| S-4 deja sin vía a un accesorio que no existe en Books | Media | Supuesto declarado; pregunta 2 |
| Los `.tsx` no tienen pruebas | Segura | Tabla de la regla 13 y verificación en la aplicación |

## Lotes de `apply` (techo 800, válvula 720; cada estimación es la primera cuenta × 1,8, pruebas incluidas)

| Lote | Contenido y ficheros | Primera cuenta | × 1,8 |
|---|---|---|---|
| 1 · Regla y cierre del catálogo | `packages/shared/src/accesoriosLista.ts` y su prueba (nuevos); exportación al final de `packages/shared/src/index.ts`; `apps/desk/server/routes/catalogo.ts` en sitio; `apps/desk/server/db/catalogoArticulos.ts` en sitio y lectura por id al final; prueba nueva del servidor con posición y legado | 320 | **576** |
| 2 · SKU, novedad sembrada y compatibilidad | detalle del checklist (módulo nuevo o en sitio); `packages/shared/src/types.ts` y `apps/desk/server/routes/remision.ts` en sitio; fila al final de `schema.sql`; `novedadesSiembra.test.ts`, `recepcion.test.ts`, `DEPLOY.md`; pruebas de compatibilidad | 290 | **522** |
| 3 · Ruta del Director Técnico | fichero nuevo en `apps/desk/server/routes/`, su registro en sitio y su prueba | 225 | **405** |
| 4 · Cliente | panel nuevo en `apps/desk/src/components/`; `Configuracion.tsx`, `CrearRemision.tsx`, `CatalogoEquipos.tsx` en sitio; funciones al final de `apps/desk/src/api/client.ts` | 190 | **342** |
| 5 · Cierre documental | consulta `.sql`; `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, `docs/sdd/ENTRADA.md` y `openspec/config.yaml` al final; tabla de la regla 13 en `tasks.md` | 110 | **198** |
| Verify | `verify-report.md` (precedentes: 206 a 358) | — | **~360** |
| Archive | `archive-report.md` (~180) más la fusión del delta, que **se mide antes de aplicar**; la mudanza de carpeta no cuenta para el techo | — | **~180 + fusión** |

Los artefactos de planificación van en su propio intento y se parten si pasan de la válvula. Cada intento se cierra con
`git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear.

## Reversión

Todo es aditivo. Se revierte la rama; la fila sembrada se retira con `activo = false`, sin borrarla (la siembra la
reinsertaría). Los accesorios que el Director Técnico haya añadido son filas normales del catálogo y se quedan.

## Criterios de éxito

- [ ] El formulario enseña nombre y SKU; `incluye` y el payload a n8n no cambian (prueba).
- [ ] Las tres vías de alta de un accesorio sin artículo de Books responden `422` u omiten, con prueba de posición.
- [ ] La novedad nueva existe tras migrar, es idempotente y exige texto.
- [ ] El Director Técnico añade un artículo de Books a un modelo; sin permiso, `403`; orden A→B→C→D probado por pares.
- [ ] Las cuatro pruebas de compatibilidad, en verde.
- [ ] Ninguna cita desplazada: detector con 0 bloqueantes y barrido de la regla de mutación 4.
- [ ] `tasks.md` cierra la tabla de la regla 13 con la línea real de cada guarda nueva.
