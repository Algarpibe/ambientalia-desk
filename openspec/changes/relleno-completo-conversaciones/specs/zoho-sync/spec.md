# Delta para zoho-sync — relleno completo y verificado de conversaciones, lanzado por una persona (1G-01, `cierra: si`)

Construye `decision/adelanto-09-11-empezar-1g` (Gerencia, 02/11/2026) con los supuestos S-1 a S-15 de `proposal.md`. Numeración
comprobada contra `openspec/specs/zoho-sync/spec.md`: el último requisito vivo es RQ-ZS-27; los nuevos son RQ-ZS-28 y RQ-ZS-29.
Las rutas `/api/admin/relleno-conversaciones` (POST y GET) las adopta el diseño.

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: ningún bloque MODIFIED, ninguna línea viva se mueve.

## ADDED Requirements

### RQ-ZS-28 · La pasada recorre los ids de Desk, verifica cada ticket contra el detalle fresco y resume sin datos de cliente

La pasada **SHALL** recorrer los ids de `desk.tickets` salvo los que empiezan por `app-`, en orden ascendente de `tickets.number`
y sin distinguir archivados (son ids; la lista `/tickets` de Zoho no se usa) (S-4). `desde=<número>` **SHALL** omitir los números
menores y `limite=N` **SHALL** acotar cuántos tickets se recorren. Por ticket **SHALL** pedirse un detalle fresco (S-5). Si responde
`404`, o `isDeleted` o `isTrashed` vienen a true, el ticket **SHALL** clasificarse «no está en Zoho» y **MUST NOT** escribirse ni
marcarse nada (S-6). En otro caso el detalle **SHALL** persistirse por la vía de hoy, de modo que una fila `managed_by_app` conserva
su fila (S-7); se **SHALL** leer, guardar y, sólo con `MARCAR_CONVERSACIONES_AUSENTES` encendido, marcar la lista entera de
conversaciones (S-8). La verificación **SHALL** hacerse **después** de guardar y marcar: los ids únicos con `source = 'zoho'` y
`ausente_en_zoho_at` nulo se comparan con `commentCount` + `threadCount` del detalle fresco, **nunca** con `tickets.raw` (S-5, S-9).
Clases: **completo** (igual), **descuadrado** (distinto), **sin recuento** (falta alguno de los dos), **con error** (lectura fallida),
**no está en Zoho**. El resumen **SHALL** llevar recuentos por clase, los **números** de ticket de las clases no completas, el motivo
del primer fallo, las peticiones hechas, los `429` vistos y dónde se cortó; **MUST NOT** contener asunto, contacto, empresa ni
contenido (S-10).

#### Scenario: orden, filtro `app-` y archivados incluidos
- GIVEN `desk.tickets` con los números 30, 10 y 20, el 20 con `raw->>'isArchived'` true, y un ticket `app-…`
- WHEN se ejecuta la pasada con un `zohoFetch` falso
- THEN se pide el detalle de 10, 20 y 30 en ese orden, ninguna petición nombra el id `app-…` ni la lista `/tickets`

#### Scenario: `desde` y `limite` acotan el recorrido
- GIVEN cinco tickets con números 1 a 5
- WHEN se ejecuta con `desde=3` y `limite=2`
- THEN sólo se piden los detalles de 3 y 4

#### Scenario: un ticket que cuadra sale completo
- GIVEN un detalle fresco con `commentCount` "7" y `threadCount` "1", y 8 conversaciones distintas en Zoho
- WHEN se ejecuta la pasada
- THEN quedan 8 filas `source = 'zoho'` sin marca y el ticket sale «completo»

#### Scenario: un recuento que no cuadra sale descuadrado
- GIVEN un detalle con recuentos que suman 8 y Zoho devuelve 7 conversaciones
- WHEN se ejecuta la pasada
- THEN el ticket sale «descuadrado» y su número figura en el resumen

#### Scenario: falta un recuento
- GIVEN un detalle sin `threadCount`
- WHEN se ejecuta la pasada
- THEN el ticket sale «sin recuento», nunca «completo» ni «descuadrado»

#### Scenario: lectura fallida
- GIVEN una página de conversaciones que responde `500`
- WHEN se ejecuta la pasada con dos tickets más
- THEN ese ticket sale «con error», el resumen guarda ese motivo como primer fallo y la pasada sigue con los demás

#### Scenario: el ticket ya no está en Zoho
- GIVEN un ticket cuyo detalle responde `404`, y otro con `isTrashed` true
- WHEN se ejecuta la pasada
- THEN ambos salen «no está en Zoho», no se escribe ninguna fila de `tickets` ni de `conversations` y no se marca nada

#### Scenario: un `managed_by_app` se juzga por el detalle fresco
- GIVEN una fila `managed_by_app` con `raw` de recuentos viejos (3) y un detalle fresco con recuentos que suman 8, con 8 conversaciones en Zoho
- WHEN se ejecuta la pasada
- THEN el ticket sale «completo», y su fila de `tickets` conserva los valores de la app

#### Scenario: la verificación mira lo guardado y visible, tras marcar
- GIVEN `MARCAR_CONVERSACIONES_AUSENTES` encendido, un hilo guardado antes y que Zoho ya no devuelve, y recuentos que suman lo que Zoho devuelve hoy
- WHEN se ejecuta la pasada
- THEN el hilo queda marcado y el ticket sale «completo»; con el interruptor apagado el mismo ticket sale «descuadrado»

#### Scenario: el resumen no lleva datos de cliente
- GIVEN tickets con asunto, contacto y empresa conocidos y uno descuadrado
- WHEN se serializa el resumen
- THEN contiene el número del descuadrado y ninguno de esos textos

### RQ-ZS-29 · Los `429` se reintentan y, agotados, cortan la pasada; el lanzamiento es de una persona, tras un interruptor cerrado por defecto

En el detalle y en cada página de conversaciones, un `429` **SHALL** reintentar la misma petición tras una pausa de 2.000 ms, hasta 3
veces; agotados, la pasada entera **SHALL** cortarse y el resumen **SHALL** decir en qué ticket (`desde` para reanudar) (S-11). Cualquier
otro fallo **SHALL** contarse y la pasada seguir. El interruptor `RELLENO_CONVERSACIONES_HABILITADO` **SHALL** leerse con
`=== 'true'`: cualquier otro valor, o su ausencia, lo deja cerrado (S-1). `POST /api/admin/relleno-conversaciones` **SHALL** lanzar la
pasada en segundo plano y responder sin esperarla, sólo a superadministrador. Con el interruptor cerrado **SHALL** responder `403` que
nombra la variable, **antes** de validar parámetros. `GET` **SHALL** devolver sólo el estado y **MUST NOT** lanzar nunca. Un `POST` con
la pasada en marcha **SHALL** devolver el estado y **MUST NOT** lanzar otra (S-2). Con `limite=0` el `POST` **SHALL** limitarse a contar
los ids que se recorrerían y los `app-` saltados, sin llamar a Zoho ni escribir, y **SHALL** funcionar con el interruptor cerrado (S-3).

#### Scenario: un `429` se reintenta y la pasada sigue
- GIVEN un detalle que responde `429` dos veces y luego `200`
- WHEN se ejecuta la pasada
- THEN la misma petición se repite con pausas de 2.000 ms, el ticket se procesa y el resumen cuenta dos `429` vistos

#### Scenario: `429` agotado en una página corta la pasada
- GIVEN tres tickets, y una página de conversaciones del segundo que responde `429` siempre
- WHEN se ejecuta la pasada
- THEN tras 3 reintentos no se pide nada del tercero y el resumen dice que se cortó en el segundo, con su número para `desde`

#### Scenario: otro fallo no corta
- GIVEN el detalle del primer ticket responde `500` y el del segundo `200`
- WHEN se ejecuta la pasada
- THEN el primero sale «con error», el segundo se procesa y el motivo del primer fallo queda en el resumen

#### Scenario: el interruptor sólo abre con `'true'`
- GIVEN `RELLENO_CONVERSACIONES_HABILITADO` con `TRUE`, `1`, `yes`, vacío o ausente
- WHEN se lee la configuración
- THEN queda cerrado; sólo `true` exacto lo abre

#### Scenario: interruptor cerrado, `403` antes de validar
- GIVEN el interruptor cerrado y un superadministrador
- WHEN hace `POST` con `limite=abc`
- THEN responde `403` cuyo texto nombra `RELLENO_CONVERSACIONES_HABILITADO`, y no `400`; no se llama a Zoho

#### Scenario: sólo superadministrador
- GIVEN el interruptor abierto y un usuario que no es superadministrador
- WHEN hace `POST` o `GET`
- THEN recibe `403` y no se lanza nada

#### Scenario: `POST` lanza en segundo plano y `GET` nunca lanza
- GIVEN el interruptor abierto y ninguna pasada en marcha
- WHEN se hace `GET`, y después `POST`
- THEN el `GET` devuelve estado «sin pasada» y no llama a Zoho; el `POST` responde sin esperar y la pasada arranca

#### Scenario: un `POST` con la pasada en marcha no lanza otra
- GIVEN una pasada en marcha
- WHEN se hace otro `POST`
- THEN devuelve el estado de la pasada en marcha y no se inicia una segunda

#### Scenario: `limite=0` sólo cuenta
- GIVEN el interruptor cerrado, 5 tickets de Zoho y 1 `app-…`
- WHEN un superadministrador hace `POST` con `limite=0`
- THEN responde 5 por recorrer y 1 saltado, con cero peticiones a Zoho y cero filas escritas o marcadas
