# F0-00 · Recomendaciones técnicas sobre las diez preguntas de la auditoría — R02

**Fecha:** 08/09/2026 · **Revisión técnica:** Claude Code sobre el commit `a3a8f03`
**Estado:** Propuesta de respuesta — PENDIENTE de decisión de Gerencia. Ninguna de las diez preguntas ha sido respondida todavía.
**Sustituye a:** `docs/sdd/F0-00_Recomendaciones_R01.md` (R01, 08/09/2026)
**Origen:** §9 de `docs/sdd/F0-00_Baseline_as-built.md`

| Madurez de la recomendación | Preguntas |
|---|---|
| **Recomendación firme** — no le falta ningún dato al agente | 2, 3, 4, 5, 8, 10 |
| **Recomendación incompleta** — falta un dato para poder recomendar del todo | 1 (falta clasificar `Pendiente`), 6 (falta saber quién lee la hoja), 7 (falta confirmar la semántica), 9 (falta verificar contra producción) |

**Qué cambia respecto de la R01:** se retira la hipótesis del §7, que estaba escrita como hecho y el código desmiente; se completa la clasificación de estados del §1, que era arbitraria; el registro de estados pasa de F1A a F0-04; el §9 sube de optimización a posible defecto de replicación; y se incorpora un hallazgo nuevo que reencuadra C4.

---

## Regla de método (nueva, aplica a todas las tandas)

**Toda afirmación sobre el comportamiento del código se marca como verificada, con ruta y línea, o se marca como hipótesis.**

La conjetura del §7 de la R01 apuntaba a algo real, pero iba escrita como un hecho. Eso es lo que la hizo cara: se convirtió en una pregunta al equipo construida sobre una lectura falsa, y estuvo a punto de entrar como insumo de diseño de C4. La distinción no es formalismo — es lo que permite que una revisión encuentre el error en minutos en vez de descubrirlo en la tanda.

En este documento, cada afirmación técnica lleva su referencia o la etiqueta **[hipótesis]**.

---

## Hallazgo nuevo · La clase de defecto reentrante son NUEVE casos, no dos

Salió de la revisión del §7 y se ejecutó ya, porque decidir el alcance de C4 sin este dato era diseñar a ciegas.

**Definición de la clase:** campos de fecha escritos por transiciones que están sobre un camino reentrante del grafo. Al volver a pasar, el `UPDATE` plano de `writeTransition` (`packages/zoho-sync/src/db/repo.ts:274`) pisa el valor anterior sin ninguna guarda.

**Método:** descomposición del grafo de las 34 transiciones en componentes fuertemente conexos (Tarjan) y cruce con los campos `cfDate`/`cfOrdenVenta` de cada transición cuyo origen y destino caen en el mismo componente. Reproducible; entra en F0-04 como prueba.

### Tres componentes cíclicos

| Comp. | Estados | Qué es |
|---|---|---|
| **C1** | `Por Facturar` ⇄ `Por Entregar / Sin facturar` | El ciclo de facturación. Es el que C4 nombra hoy |
| **C2** | `Continuación del proceso`, `En Espera de Repuestos`, `En Proceso`, `En espera de SKU inventario`, `Notificación Comercial`, `Notificación cliente`, `Pendiente`, `Servicio externo`, `Solicitado` (9 estados) | El núcleo de diagnóstico, cotización, repuestos y servicio externo. **Es el componente grande y nadie lo había mirado** |
| **C3** | `Notificado` ⇄ `Rev./Diagnostico` | El bucle de devolución a corrección. No escribe ninguna fecha, luego no aporta casos |

### Las nueve transiciones reentrantes que escriben fecha

| Comp. | Transición | Camino | Campo | Obligatorio |
|---|---|---|---|---|
| C2 | `llegada_repuestos` | `En Espera de Repuestos` → `En Proceso` | Fecha Recepción de repuestos | **Sí** |
| C2 | `aprobacion_y_repuestos` | `Notificación cliente` → `En Espera de Repuestos` | Fecha Orden de Compra | **Sí** |
| C2 | `aprobacion_y_repuestos` | " | Fecha Orden De Venta | **Sí** |
| C2 | `aprobacion` | `Notificación cliente` → `En Proceso` | Fecha Orden de Compra Final | No |
| C2 | `aprobacion` | " | Fecha Orden de Venta Final | No |
| C2 | `notif_cliente_comercial` | `Notificación Comercial` → `Notificación cliente` | Fecha de Cotización | **Sí** |
| C2 | `notif_cliente_sku` | `En espera de SKU inventario` → `Notificación cliente` | Fecha de Cotización | **Sí** |
| C2 | `solicitud_sku` | `Notificación Comercial` → `En espera de SKU inventario` | Fecha solicitud SKU | **Sí** |
| C2 | `cal_sensores_proceso` | `En Proceso` → `Servicio externo` | Fecha Salida Servicio externo | **Sí** |
| C2 | `retorno_servicio_externo` | `Servicio externo` → `En Proceso` | Fecha Entrada de servicio externo | **Sí** |
| C1 | `entrega_sin_factura` | `Por Entregar / Sin facturar` → `Por Facturar` | Fecha Remisión de Salida | **Sí** |

Ocho de los diez campos son obligatorios (`cfDate` tiene `required = true` por defecto, `packages/shared/src/transitions.ts:74`). En un campo obligatorio la segunda pasada no *puede* pisar el valor: **lo pisa siempre**.

**Los dos peores no son los que conocíamos.** `notif_cliente_comercial` y `notif_cliente_sku` escriben ambos «Fecha de Cotización» y ambos aterrizan en `Notificación cliente`. Una recotización borra la fecha de la primera cotización — que es exactamente el indicador de la columna 57 del Anexo G.6.

### Lo que salva el caso, y reencuadra C4

`ticket_transitions.values` es `jsonb` y guarda **todos** los valores de cada transición ejecutada (`packages/zoho-sync/src/db/schema.sql:57-61`, escritura en `packages/zoho-sync/src/db/repo.ts:283-286`).

Luego **no se pierde ningún dato**. Lo que ocurre es más preciso y más útil de enunciar así:

> Las columnas del ticket guardan **el último valor**. El historial guarda **todos los valores**.

De ahí salen dos consecuencias que cambian el diseño:

1. **C4 no es principalmente un problema de guardas.** Poner una guarda en cada uno de los diez campos es la solución cara y además discutible: en varios casos el segundo valor *es* el correcto (una segunda entrada a servicio externo tiene su propia fecha de entrada). La decisión de diseño de F1C-02 es **qué significa cada campo**: «primera vez», «última vez» o «todas las veces».
2. **Los indicadores de §G.6 no se pueden calcular desde las columnas.** Cualquier KPI que atraviese un camino reentrante —permanencia, cotización, orden de compra, orden de venta, servicio externo— tiene que calcularse sobre `ticket_transitions.values`, no sobre `tickets.*`. Esto afecta a la spec `kpis` y a F1A-04, y explica por qué el hallazgo b.2 de la auditoría (los 11 indicadores sin fórmula) no se resuelve añadiendo columnas.

**Va a F0-04** como comprobación mecánica permanente: enumerar los ciclos del grafo y listar los campos de fecha reentrantes. Si una tanda futura añade una transición que crea un ciclo nuevo, la prueba lo dice.

---

## 1 · Filtro «Tickets en espera» del tablero

**Recomendación: defecto de mecanismo y definición de negocio incompleta; se separan, y se clasifican los 21 estados, no cinco.**

El mecanismo es defecto sin discusión: `apps/desk/src/lib/boardView.ts:35` clasifica con `/espera/i` sobre el nombre del estado. No es una regla, es una coincidencia ortográfica. Se corrige derivando la vista de una lista explícita en `packages/shared`.

La definición de negocio es **«el ticket no avanza porque esperamos a alguien»**. La R01 aplicaba ese criterio a cinco estados e incluía `Notificación cliente` mientras dejaba fuera a `Notificación a Compras` y `Notificación Comercial`, que tienen exactamente la misma forma. Corregido: se clasifican los 21.

### Clasificación completa

**Espera externa (3)** — la pelota está fuera de Ambientalia:

| Estado | A quién se espera |
|---|---|
| `En Espera de Repuestos` | Proveedor |
| `Servicio externo` | Laboratorio externo |
| `Notificación cliente` | Cliente (aprobación / OC) |

**Espera interna (5)** — el ticket no avanza, pero el balón es nuestro:

| Estado | A quién se espera |
|---|---|
| `Notificación a Compras` | Compras |
| `Notificación Comercial` | Comercial |
| `En espera de SKU inventario` | Comercial |
| `Solicitado` | Almacén |
| `Liberación Comercial` | Comercial (liberar para entrega) |

**Sin espera (12):** `Ingresado`, `Rev./Diagnostico`, `Notificado`, `En Proceso`, `Continuación del proceso`, `Por Facturar`, `Por Entregar`, `Por Entregar / Sin facturar`, `Finalizado`, `OV asignada`, `Ticket creado`, `Remisión creada`.

**Sin clasificar (1):** `Pendiente`. Por el grafo parece una pausa interna del técnico —tiene dos salidas, ambas de Servicio Técnico (`transitions.ts:230,244`)—, pero eso lo confirma Servicio Técnico, no el código.

3 + 5 + 12 + 1 = 21. ✔

### Por qué la vista y el reloj del SLA usan la lista de forma distinta

**Que el reloj del SLA corra durante `Notificación a Compras` no es un defecto: es lo correcto, y esto tiene que quedar escrito en la spec.**

El SLA es una promesa al cliente. El reloj se detiene cuando Ambientalia no puede actuar, no cuando Ambientalia no ha actuado. `Notificación a Compras` es un traspaso interno: si parara el reloj, Ambientalia escondería sus propias demoras de su propio indicador — que es exactamente el vicio que C9 corrige.

Por eso la taxonomía tiene dos valores y no un booleano:

- **La vista «Tickets en espera» muestra las ocho** (externas + internas). El técnico necesita ver todo lo que no avanza.
- **C7 detiene el reloj SÓLO en las tres externas.**

Si esto no se escribe explícito en la spec, F1C-06 acabará parando el reloj en las internas, porque «espera» suena a una sola cosa.

Una sola lista, definida una vez, resuelve la vista del tablero, C7 y —más adelante— la traducción de estados del portal (C8).

### Dónde vive: el registro de estados va a F0-04

Hoy **no existe ningún registro de estados**: los 21 se derivan de los strings `from`/`to` de las 34 transiciones, y sólo tres tienen constante (`transitions.ts:142-144`). Añadir un atributo `espera` exige crear una tabla que no existe.

F0-04 necesita esa misma tabla para su invariante «ninguna transición apunta a un estado inexistente». **Se crea en F0-04 y F1A la consume.** Al revés, F1A la inventa y F0-04 la vuelve a inventar.

**Condición innegociable:** el registro se declara explícitamente **y** una prueba comprueba que el conjunto derivado de los `from`/`to` es idéntico al declarado. Sin esa prueba habríamos cambiado una regex frágil por una lista frágil, que es peor porque parece rigurosa.

---

## 2 · Corrección factual del maestro (M1.9.1)

**Recomendación: sí, se corrige de diez a ocho.** Pendiente de decisión de Gerencia.

El recuento en código es exhaustivo y reproducible (`packages/shared/src/transitions.ts:178-255`); el de febrero era a mano. Cuando el código y el documento discrepan sobre un hecho contable, gana el código.

Se corrige M1.9.1 en la próxima revisión del maestro y **se anota en el Anexo I** indicando que procede de la auditoría F0-00, no de una opinión de revisión, para que dentro de tres meses nadie tenga que volver a contarlas. La cifra se fija además en la prueba de invariantes del grafo de F0-04, para que no vuelva a derivar.

La spec `permissions` de F0-02 y la matriz cargo × transición de F1C-05 se escriben ya sobre ocho.

---

## 3 · ¿Entra la interfaz en la red de pruebas?

**Recomendación: no en la Fase 1, y se escribe como decisión explícita, no como olvido.** Pendiente de decisión de Gerencia.

Instalar `jsdom` + `@testing-library` y cubrir 39 ficheros y 6.329 líneas son semanas que no acercan el 31/12. Y el riesgo real no es «la interfaz sin pruebas»: es **lógica de dominio viviendo en `.tsx` sin pruebas**. Son cosas distintas y sólo la segunda es grave.

El repositorio ya tiene el patrón correcto y no lo había nombrado: la lógica pura vive en `apps/desk/src/lib/*.ts` y **esos ficheros sí los cubre vitest hoy** (`boardView.test.ts`, `valoresTransicion.test.ts`). Lo que falta no es infraestructura, es una regla.

### Regla invariable 13 (nueva)

> La lógica de dominio vive en `.ts`; los `.tsx` son presentación.
> Un `.tsx` que decide algo **sin contrapartida en el servidor** es defecto de ubicación, y se corrige bajando la función a `lib/` con su prueba.
> Un espejo cliente de una regla que el servidor impone **y que está probada en el servidor** es comodidad y se queda.

El segundo párrafo es el que cierra el hueco. Sin él, la regla ampara un espejo de una guarda que nadie ha comprobado, que es peor que no tener regla.

### El caso concreto: `TransitionPanel.tsx:57`

**Verificado:** el servidor es la guarda real. `apps/desk/server/services/ticketService.ts:89` aplica `canExecuteTransition(user.areas, user.isAdmin, t.area)` antes de ejecutar cualquier transición, y devuelve error si no pasa. La comprobación del cliente es una **comodidad** —no enseñar botones que no se pueden pulsar—, nunca la guarda.

Aplicando la regla 13: `TransitionPanel.tsx:57` **se queda en cuanto F0-04 pruebe la matriz área × transición completa, y no antes**. Hasta ese momento es un espejo sin comprobar.

Lo que F0-04 tiene que demostrar de forma exhaustiva es esa matriz —**las 34 transiciones, en el servidor**—, y eso se puede hacer hoy sin instalar nada.

**Se revisa en F2**, cuando llegue la app móvil/tablet (ítem 18) y la interfaz pase a ser la superficie principal del técnico. Ahí un arnés de componentes se paga solo; hoy no. La exclusión se escribe como comentario de decisión en `vitest.config.ts`, para que se lea como elección.

---

## 4 · Puertas de calidad del CI

**Recomendación: sí a las dos, con criterio de trinquete —nunca peor que hoy—, no de aspiración.** Pendiente de decisión de Gerencia.

Un umbral por encima del estado actual falla el primer día y acaba desactivado; un umbral clavado en el estado actual no se puede empeorar y no molesta a nadie.

- **Lint:** `--max-warnings 158` desde ya (`.github/workflows/ci.yml:27` hoy corre `eslint .` sin techo). Congela, no exige. El número baja de forma oportunista cuando una tanda toca esos ficheros. Pedir cero significa arreglar 157 `any` que nadie ha echado de menos en tres meses.
- **Cobertura:** instalar `@vitest/coverage-v8`, medir y publicar en CI. Umbral **sólo** sobre `packages/shared` y `apps/desk/server` —el motor—, fijado en lo medido menos un margen pequeño. La interfaz queda excluida por la decisión 3, y la exclusión se escribe en la configuración.
- **Tercera puerta, que vale más que las dos anteriores:** las pruebas de invariantes del grafo. Que el conjunto de estados declarado siga siendo igual al derivado, que `Finalizado` siga siendo el único terminal, que ninguna transición apunte a un estado inexistente, que las transiciones compartidas por dos áreas sigan siendo ocho, y —nuevo— **que la lista de campos de fecha reentrantes no crezca sin que alguien lo declare**. Eso atrapa las regresiones de verdad; un porcentaje de cobertura no.

**Añadido a F0-04:** partir `apps/desk/server/app.test.ts` (3.010 líneas, 36,4 s de los 40,4 s de la suite). Con el ciclo focalizado del motor en 792 ms, `strict_tdd` es cómodo; con la suite entera en 40 s, se acaba saltando.

---

## 5 · ¿Es «catálogo de equipos» una capacidad propia?

**Recomendación: sí. `catalogo-equipos` entra como capacidad #15 en §2.3 del plan, y no se absorbe en `hojas-vida`.** Pendiente de decisión de Gerencia.

Son entidades distintas y confundirlas costaría caro. El **catálogo** es el modelo: tipo, marca, modelo, ficha técnica, artículos por modelo, mano de obra por modelo. La **hoja de vida** es el ejemplar concreto: serial, cliente, historial, garantía. Uno describe qué es un EDM 180; la otra, qué le ha pasado al 18A19042.

El argumento decisivo no es taxonómico: **el checklist de F1D-01 se parametriza por marca-modelo**, y ésa es exactamente la entidad `modelo` del catálogo. Si el catálogo no es capacidad, la spec de `diagnostico-checklist` no tiene dónde anclar su referencia, y F1D-01 acabaría inventando un maestro de modelos paralelo al que ya está en producción con 26 tipos, 6 marcas, 35 modelos y 354 equipos. Lo mismo vale para F1D-06, que lee artículos por modelo para enseñar sólo los repuestos de la etapa.

Efectos: los siete diseños de Superpowers de ese dominio encuentran su sitio en F0-02; `diagnostico-checklist` declara dependencia de `catalogo-equipos`; y F1D se abarata, porque el ancla de parametrización ya existe y está poblada. Le da dueño, además, al defecto activo de `getEquipo`, que no filtra por `active` (`apps/desk/server/db/equipos.ts:75-78` en `a5da6b8`) y hoy no tiene casa.

---

## 6 · P14 — doble escritura de las remisiones de entrada

**Recomendación: PostgreSQL es el origen del informe desde F1E-01. La hoja de Sheets sigue viva como espejo y se retira en F1F-02.** Pendiente de decisión de Gerencia; además falta un dato: falta un dato para fijar la fecha.

La dirección no está en duda: el acta del 27/08 dice que el aplicativo sustituye carpetas y archivos por captura en base de datos, y M11.1 quiere dejar de usar n8n y Excel. Postgres acaba siendo la fuente única.

Lo que no tiene sentido es romper ahora el flujo de n8n, que funciona y tiene siete ramas en paralelo. Así que: **F1E-01 lee de PostgreSQL, no de la hoja**; n8n sigue escribiendo la hoja hasta que el módulo de respaldo de F1F-02 la sustituya. Nada se rompe entre medias y la doble escritura deja de ser una ambigüedad para pasar a ser un espejo con fecha de caducidad.

**El dato que falta:** si Comercial o Dirección tienen una vista, un filtro o un informe montado encima de la hoja, retirarla tiene un coste que hay que planificar y que nadie ha contado. Si no la lee nadie más que n8n, se retira sin ceremonia.

**Pregunta para el viernes 11/09 — Gustavo:** ¿alguien consulta `Remision_Data/remisiones_entrada` en Google Sheets, aparte del propio flujo de n8n?

---

## 7 · `fecha_orden_compra_final` y `fecha_orden_venta_final`

**Se retira la hipótesis de la R01.** Pendiente de decisión de Gerencia; además falta un dato: falta confirmar la semántica.

La R01 proponía que eran «la pareja definitiva tras la recotización» y «el apaño manual de exactamente el problema que C4 arregla». **Las dos mitades eran incorrectas, y ambas se podían verificar sin preguntarle a nadie.**

### Lo que dice el código (verificado)

| Transición | Camino | Campos | Obligatorios |
|---|---|---|---|
| `aprobacion` (`transitions.ts:202-203`) | `Notificación cliente` → `En Proceso` — rama **sin repuestos** | Fecha Orden de Compra **Final**, Fecha Orden de Venta **Final** | No |
| `aprobacion_y_repuestos` (`transitions.ts:198-199`) | `Notificación cliente` → `En Espera de Repuestos` — rama **con repuestos** | Fecha Orden de Compra, Fecha Orden De Venta | Sí |

Salen del mismo estado. Y nada las condiciona a ser una segunda vuelta: `aprobacion` dispara igual en la primera aprobación. **La partición real es con repuestos / sin repuestos, no primera vuelta / recotización.**

C4, además, está en el ciclo de facturación (`Por Facturar` ⇄ `Por Entregar / Sin facturar`, componente C1). Los campos «Final» están en el componente C2. Sitios distintos.

Son, eso sí, campos reales del layout de Zoho Desk: `PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts:115-116`) mapea etiqueta de campo personalizado de Zoho a columna, y la app hace lo correcto al espejarlos. No están en el Anexo G porque la exportación de febrero (`docs/analisis-tickets/Tickets.csv`) no los contiene.

### Hipótesis de repuesto **[hipótesis, sin confirmar]**

Si se aprueba **sin** repuestos no habrá compra posterior, luego esa orden es la definitiva. «Final» significaría **«no se espera otra orden»**, no «tras recotizar». Si es así, el cableado es intencionado —el campo opcional en la rama que cierra, el obligatorio en la rama que sigue— y los campos se quedan tal cual.

Encaja con el nombre y con el cableado, pero **no está confirmado y no se usa como insumo de diseño hasta que lo esté.**

### Recomendación

No se retiran en F0-02. Se documentan en el Anexo G como campos del layout de Zoho con semántica pendiente de confirmar, se mantienen en el espejo —coste cero, ya se sincronizan— y su destino se decide en F1C-02 junto con los otros nueve campos reentrantes.

**Pregunta para el viernes — Gustavo y Comercial, con las dos lecturas sobre la mesa:** ¿«Final» significa «ya no se espera otra orden porque no hubo repuestos», o se crearon para otra cosa y acabaron cableados ahí? Y de paso: existe un tercer campo de la misma familia, `cf_fecha_de_actualizacion_de_ov` («Fecha de actualización de OV»), que tampoco está en el Anexo G.

---

## 8 · Rotación de secretos: dueño y fecha

**Recomendación: el dueño es Alfonso García del Pino, y el momento es F0-04, no F1F. Categoría: higiene programada.** Pendiente de decisión de Gerencia.

F1F es demasiado tarde: de aquí a F1F hay cuatro meses de ventana. Y F0-04 es el momento natural porque **monta el entorno de staging** (plan R01.1, fila F0-04: «staging sobre la VPS Hostinger con PostgreSQL»), que necesita sus propias credenciales de todas formas: ya se va a tocar la superficie de credenciales, se toca entera.

**Verificado, y por eso es higiene y no incendio:** `.env` nunca entró en el histórico de git —sólo `.env.example`— y `.gitignore:17-18` en `a5da6b8` lo cubre. No hay constancia de fuga.

El barrido `git log -S` sobre los valores se hace igualmente, como confirmación de que nada se incrustó en un fichero de código.

**Alcance, una o dos horas:** rotar `ZOHO_CLIENT_SECRET`, regenerar los tres refresh tokens (Desk, Books, CRM), cambiar la contraseña de `hub_reader`, y revocar los dos PAT de GitHub sustituyéndolos por tokens de alcance fino limitados a este repositorio.

Se registra además en el Anexo D, porque hoy no está en ninguna parte y por eso lleva meses sin dueño.

---

## 9 · Dos lectores independientes de Zoho Desk

**Recomendación sobre los dos lectores: se acepta hasta F1F. Sin cambios.** Pero se antepone una verificación de corrección que la R01 no contemplaba. Pendiente de decisión de Gerencia, y falta la verificación.

Los dos lectores funcionan y el coste es cuota de API. Refactorizar ahora a un lector único es trabajo que se tira: después de F1F, Zoho Desk queda en solo lectura y acaba apagándose. **Se resuelve por desaparición, no por refactorización.**

### Lo que sí va por delante, y no es rendimiento

`contacts` y `activities` son **dos de las cuatro tablas que ya se replican hub→desk** por replicación lógica (hallazgo c.7 de la auditoría). Y la app Desk además hace `upsertContact` sobre `contacts` (`packages/zoho-sync/src/db/repo.ts:19-21`) en su propio ciclo de tres minutos.

Eso no es cuota duplicada: son **dos escritores sobre una tabla que es destino de replicación lógica**. El riesgo preciso: un conflicto en una tabla suscriptora **detiene el proceso de aplicación y lo deja reintentando** — la replicación se para y nadie se entera, porque no hay error visible en la aplicación.

Los flags valen `true` por defecto (`packages/zoho-sync/src/config.ts:89-90`: `env.SYNC_CONTACTS !== 'false'`) y ni `.env.example` ni `DEPLOY.md` los fijan, luego están activos salvo que alguien los pusiera a mano en EasyPanel.

**Verificación contra producción, en este orden:**

1. Si `SYNC_CONTACTS` y `SYNC_ACTIVITIES` están sin fijar en el despliegue de Desk.
2. Si la suscripción tiene errores en `pg_stat_subscription`.

**Si se confirma, el arreglo son dos variables de entorno** (`SYNC_CONTACTS=false`, `SYNC_ACTIVITIES=false` en el despliegue de Desk), y **se documentan en `.env.example` y `DEPLOY.md`, que es donde debieron estar desde el principio.**

La medición de cuota en el panel de Zoho se mantiene, pero va detrás: si supera el 60 % del límite diario esta respuesta cambia, porque F1F-01 provocará un pico.

**Nota para la spec `zoho-sync` de F0-02:** dos lectores son dos definiciones de qué es un ticket. Hoy coinciden; la spec tiene que declarar explícitamente que el mapeo es uno solo y compartido, para que no diverjan sin que nadie lo note.

---

## 10 · P44 — política de escritura contra Zoho

**Recomendación: cero escritura contra Zoho en la Fase 1. La regla invariable 6 se mantiene sin excepción.** Pendiente de decisión de Gerencia.

La auditoría confirma que hoy no existe ningún código de escritura hacia el CRM. Mantenerlo así no cuesta nada; construir la excepción cuesta una tanda y, sobre todo, **introduce un modo de fallo nuevo**: una escritura defectuosa contamina la fuente comercial de verdad, y toda la premisa de Desk 2.0 es que su dato está limpio. No merece la pena para ahorrar unos copiar-pegar.

Para el flujo de cotización de F1D-06: el diagnóstico genera las líneas de cotización **dentro de Desk 2.0**, y Comercial las lleva al CRM a mano o por exportación. En 2026 el volumen lo permite, y de paso deja a una persona en medio de un compromiso comercial, coherente con el principio de diseño nº 8 —el cálculo es determinista y la máquina no adquiere compromisos—.

**Se revisa en F2 con un disparador concreto**, no por calendario: cuando el número de cotizaciones por semana convierta el copiado manual en cuello de botella, **y** cuando el dato de Desk 2.0 lleve un trimestre demostrando estar limpio.

La única escritura existente —el reply de correo, ya gateado por `ENABLE_WRITES=false` (`apps/desk/server/routes/tickets.ts:203`, `DEPLOY.md:46`)— se queda como está: es una comunicación, no una escritura de datos.

---

## Lo que cambia en el plan

| Cambio | Dónde | Efecto |
|---|---|---|
| `catalogo-equipos` entra como capacidad #15 | §2.3 · F0-02 · F1D-01 · F1D-06 | Siete diseños de Superpowers encuentran destino; F1D se abarata |
| Regla invariable 13 (con el matiz del espejo probado) | §4.4 · `CLAUDE.md` (F0-01) | Cierra la pregunta 3 sin instalar arnés de React |
| Regla de método: verificado vs. hipótesis | §4.4 · `CLAUDE.md` (F0-01) | Evita que una conjetura entre como insumo de diseño |
| **Registro de estados con prueba de coherencia** | **F0-04** (era F1A) | F1A lo consume; sin la prueba, una lista frágil sustituye a una regex frágil |
| Atributo `espera: null \| 'interna' \| 'externa'` sobre los 21 estados | F0-04 (registro) · F1A (vista) · C7 · C8 | Una lista resuelve tablero, reloj de SLA y portal |
| C7 detiene el reloj **sólo** en las externas, explícito en la spec | F1C-06 | Sin esto, F1C-06 para el reloj en los traspasos internos |
| Matriz área × transición completa (34) en servidor | F0-04 | Alcance concreto; sustituye a «completar pruebas». Habilita `TransitionPanel.tsx:57` bajo la regla 13 |
| **Enumeración de ciclos y campos de fecha reentrantes** | **F0-04** (prueba) · **F1C-02** (diseño) | Nueve casos, no dos. C4 pasa de «poner guardas» a «definir la semántica de cada campo» |
| KPIs de §G.6 se calculan sobre `ticket_transitions.values` | Spec `kpis` · F1A-04 | Explica por qué b.2 no se resuelve añadiendo columnas |
| Trinquete de lint y cobertura + invariantes del grafo | F0-04 · `ci.yml` | Definición de «hecho» de F0-04 |
| Partir `app.test.ts` | F0-04 | `strict_tdd` viable en la práctica, no sólo en teoría |
| Rotación de secretos (higiene programada) | F0-04 (no F1F) + Anexo D | Deja de ser un frente sin dueño |
| M1.9.1: diez → ocho, fijado en prueba | Maestro + Anexo I + F0-04 | Corrección factual trazable y no repetible |
| Postgres origen del informe; Sheets se retira en F1F-02 | F1E-01 · F1F-02 | Cierra P14 salvo la fecha |
| Verificación de doble escritor sobre tabla suscriptora | F0-04 (antes que la cuota) · `.env.example` · `DEPLOY.md` | Posible parada silenciosa de la replicación |
| Los dos campos «Final» se documentan, no se retiran | Anexo G · F1C-02 | Semántica pendiente de Gustavo |

---

## Tres preguntas al equipo · viernes 11/09

1. **Gustavo** — ¿alguien consulta `Remision_Data/remisiones_entrada` en Google Sheets aparte del flujo de n8n?
2. **Gustavo y Comercial** — ¿«Fecha Orden de Compra/Venta Final» significa «ya no se espera otra orden porque no hubo repuestos», o se crearon para otra cosa? Y: ¿qué es `cf_fecha_de_actualizacion_de_ov`?
3. **Servicio Técnico** — ¿el estado `Pendiente` es una pausa interna del técnico, o se espera a alguien?
