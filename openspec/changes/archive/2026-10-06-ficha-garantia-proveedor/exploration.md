# Exploración — `ficha-garantia-proveedor`

Volcado de la exploración guardada en Engram (`sdd/ficha-garantia-proveedor/explore`), que era un resumen sin
líneas. Todo lo que sigue se volvió a leer en el worktree `ficha-garantia-proveedor` el 2026-10-06; cada línea
citada se leyó en ese árbol. Lo que no se pudo comprobar lleva la palabra «hipótesis». Escalones del orden total
(F1B-10): **A** existencia < **B** estado y permiso < **C** contenido < **D** unicidad.

## 1 · Qué dicen las fuentes

- **Fila del plan.** `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93`: F1B-13, «Ficha de garantía con
  el proveedor (reclamación al fabricante vinculada a ticket y OVI)», talla S, estado «pendiente», respaldo
  `decision/anexo-7-garantia-proveedor`.
- **Decisión.** `openspec/config.yaml:2340` (clave), respuesta textual en `openspec/config.yaml:2345`. Sus
  consecuencias dicen que no es rama del blueprint y no toca `transitions.ts` (`openspec/config.yaml:2348`) y que
  los 60 días van entre corchetes y se toman como valor propuesto (`openspec/config.yaml:2350`).
- **Decisión que la desbloquea.** `openspec/config.yaml:3954` (clave `decision/e157-ovi-garantia-por-cargo`),
  respuesta en `openspec/config.yaml:3965`: el acto dentro de Desk es ASOCIAR la OVI, basta el cargo. Su
  consecuencia (8) dice que desbloquea F1B-13 (`openspec/config.yaml:3986`).
- **Maestro.** El pasaje es
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2660-2668`, que cuelga del encabezado
  «M4.4 Cotización, recotización y facturación diferida»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2597`; el siguiente encabezado,
  M4.5, es la línea que sigue al pasaje). El propio maestro asocia la decisión a «M4.4 · nº 7»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5143-5145`); que esa tabla sea la del
  Anexo D es hipótesis, no se remontó su encabezado.
- **Bandeja.** `docs/sdd/ENTRADA.md:544` (E-034, cerrada, destino la decisión de arriba).

Lo que el pasaje del maestro dice, línea a línea (todas del mismo fichero R08.4.md):

| Línea | Qué afirma |
|---|---|
| 2662 | Ficha propia vinculada al ticket y a la OVI, no rama del blueprint; el ticket se cierra y la reclamación sigue aparte |
| 2663 | «Al crear la OVI de garantía, el Director Técnico responde "¿Se reclama al fabricante?"»; sí abre la ficha; no elige motivo de una lista cerrada de tres |
| 2664 | Datos de la ficha: fabricante, pieza (referencia y serial), ticket y OVI de origen, RMA, valor reclamado (tomado del costo de la OVI), estado (abierta → enviada al fabricante → resuelta: reposición, nota crédito o rechazada) y valor recuperado |
| 2665 | Más de 60 días abierta: aviso al Director Técnico |
| 2666 | Dos mediciones: recuperado frente a reclamado por marca, y piezas con fallas repetidas (taxonomía ISO 14224) |
| 2667 | El envío físico usa la remisión sin ticket |
| 2668 | Entra en Fase 1 como tanda pequeña; «sin empezar a 01/10» |

Además, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1232` afirma que «las líneas de
una OVI conservan el costo de referencia aunque el precio sea 0». Es una afirmación del maestro sobre Books; contra
los datos de la base `desk` no se ha comprobado (§4).

**Una discrepancia entre la decisión y su propia consecuencia.** La respuesta textual enumera tres estados y tres
resultados (`openspec/config.yaml:2345`); la consecuencia (2), escrita por la supervisión, habla de «su propio
ciclo de cuatro estados internos» (`openspec/config.yaml:2348`). La fuente es la respuesta textual y el maestro, que
coinciden; el «cuatro» no se sabe de dónde sale (hipótesis: cuenta «rechazada» aparte). Se anota como riesgo.

## 2 · De qué cuelga la ficha: la asociación OV ↔ ticket

- La tabla es `public.ov_asociaciones` (`packages/zoho-sync/src/db/schema.sql:539-551`): `id bigserial`,
  `ticket_id`, `numero` congelado al asociar, `salesorder_id` que puede ser nulo, y las tres columnas de liberación.
  Dos índices únicos parciales imponen una sola asociación VIGENTE por orden
  (`packages/zoho-sync/src/db/schema.sql:552-553`).
- La fila nunca se borra: liberar es un `UPDATE` (`packages/zoho-sync/src/db/ovAsociaciones.ts:105-108`). Por eso
  un `id` de asociación es una referencia estable para la ficha, también después de liberar.
- Al eliminar un ticket nacido en la aplicación se liberan sus asociaciones, no se borran
  (`packages/zoho-sync/src/db/ovAsociaciones.ts:132`).
- Cinco orígenes escriben asociaciones (`packages/zoho-sync/src/db/ovAsociaciones.ts:12`): alta, «Habilitar
  Servicio», remisión y las dos aprobaciones. Entran por cuatro puertas que no comparten cuerpo ni transacción; el
  inventario línea a línea está en
  `openspec/changes/archive/2026-10-06-ovi-garantia-por-cargo/exploration.md:9` y siguientes, leído por aquella
  tanda. Colgar la pregunta «¿Se reclama al fabricante?» de esas cuatro puertas obligaría a tocar cuatro cuerpos
  distintos, dos de ellos en ficheros muy citados. **Recomendación de la exploración:** un acto propio sobre
  `ov_asociaciones.id`.
- «Es OVI» tiene una sola implementación: `esOVI` (`packages/shared/src/subOV.ts:63-67`), prefijo `OVI-` recortado
  y sin distinguir mayúsculas.
- La API de asociaciones ya sigue la escalera: `404` asociación inexistente (A,
  `apps/desk/server/routes/ovAsociaciones.ts:45`), `403` sin Comercial (B, `apps/desk/server/routes/ovAsociaciones.ts:47`),
  `409` ya liberada (B, `apps/desk/server/routes/ovAsociaciones.ts:48`), `422` motivo vacío (C,
  `apps/desk/server/routes/ovAsociaciones.ts:50-51`). Es el molde de las rutas nuevas. Sus rutas se registran en
  `apps/desk/server/app.ts:61`.

## 3 · Permiso: el cargo ya existe y ya viaja en la sesión

- `puedeCrearOVIGarantia` (`packages/shared/src/cargos.ts:71-74`): pasa el administrador o quien tenga el cargo
  `EXCEPCIONES_POR_CARGO.crearOVIGarantia`, que es «Director Técnico» (`packages/shared/src/cargos.ts:33`). No
  exige área.
- El servidor ya traduce ese predicado a `403` en el módulo de guardas de F1B-03
  (`apps/desk/server/services/guardasOVI.ts:15-18`).
- La sesión carga `cargo_permiso` (`apps/desk/server/auth/sessions.ts:17`) y el tipo público del usuario lo expone
  como `cargoPermiso` (`packages/shared/src/types.ts:222`); `/api/auth/me` lo devuelve
  (`apps/desk/server/cargoPermiso.test.ts:36`). El cliente puede consumir el mismo predicado.

## 4 · El costo de la OVI no está en la base `desk`

- En `desk` sólo llegan replicadas cuatro tablas: `desk.activities`, `books.contacts`, `books.sales_orders` y
  `books.items` (`DEPLOY.md:42`).
- `books.sales_orders` trae totales y un `raw jsonb`, sin líneas (`packages/zoho-sync/src/db/schema.sql:160-165`).
  `books.items` trae `purchase_rate` por artículo (`packages/zoho-sync/src/db/schema.sql:380-384`), que es el
  costo de catálogo, no el de la línea de una orden concreta.
- Las líneas de las órdenes viven en `books.salesorder_line_items`, que existe sólo en el esquema del hub
  (`packages/zoho-sync/src/booksHub/schema-books.sql:9-13`) y no está en `BOOKS_TABLES`
  (`packages/zoho-sync/src/db/migrate.ts:80`).
- Si `books.sales_orders.raw` incluye las líneas con su costo es **hipótesis**: sólo se puede comprobar con datos
  de producción. Por eso el valor reclamado automático queda fuera y es tarea de persona.

## 5 · Esquema y guardián

- Las tablas propias van calificadas `public.` y al FINAL de `schema.sql`, que hoy termina en
  `packages/zoho-sync/src/db/schema.sql:724`.
- La tabla nueva entra en `PUBLIC_TABLES` (`packages/zoho-sync/src/db/migrate.ts:70-73`), y el recuento del
  guardián pasa de 28 a 29 en `public` y de 41 a 42 en total
  (`packages/zoho-sync/src/db/migrate.test.ts:282-286`).
- Precedente de lista cerrada SIN `CHECK` en la base, con la lista en `shared`: la columna `cargo_permiso`
  (`packages/zoho-sync/src/db/schema.sql:601`).
- En el código no existe nada de esta ficha: `garantia_proveedor` y «reclamación» no aparecen en `apps/` ni en
  `packages/` (barrido con `grep`, 2026-10-06; «fabricante» sólo sale en el subsistema de remisiones).

## 6 · Aviso de 60 días: qué hay y qué falta

- `destinatariosDeCargo` filtra por `users.cargo`, el texto libre de firma
  (`apps/desk/server/db/avisos.ts:104-113`; la consulta, `apps/desk/server/db/avisos.ts:109`). **No sirve** para
  avisar a quien tiene el cargo de PERMISO «Director Técnico»: hace falta una consulta nueva por `cargo_permiso`.
- Respaldo al área: `destinatariosDeArea` (`apps/desk/server/db/avisos.ts:74`), que incluye de oficio a los
  administradores activos. El patrón «cargo o, si nadie lo tiene, área de respaldo» ya existe
  (`apps/desk/server/services/alarmasSla.ts:73-77`).
- Marca anti-ruido y aviso en UNA transacción: `marcarYAvisarRitmo`
  (`apps/desk/server/services/avisoRitmoContrato.ts:25-37`), con un `UPDATE … RETURNING` que sólo toca la fila si
  no estaba avisada (`apps/desk/server/services/avisoRitmoContrato.ts:28`). `crearAviso` sólo inserta en la
  bandeja (`apps/desk/server/db/avisos.ts:8`).
- La pasada periódica encadena alarmas, ritmo de contratos y sincronización en
  `apps/desk/server/index.ts:88`; `pasadaRitmoContratos` evalúa como mucho una vez por día civil y nunca lanza
  (`apps/desk/server/services/avisoRitmoContrato.ts:67-75`). El aviso nuevo se engancha ahí, con la misma
  dependencia de la pasada de sincronización que el maestro ya tiene anotada como punto abierto para el aviso de
  ritmo (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2659`).
- La fuente no dice si los 60 días son naturales o hábiles
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2665`).

## 7 · El cliente

- `PanelOvAsociaciones` (`apps/desk/src/components/PanelOvAsociaciones.tsx:78`) lista las órdenes del ticket y
  enseña «Liberar» con el predicado compartido (`apps/desk/src/components/PanelOvAsociaciones.tsx:82`); su
  cabecera declara qué es comodidad y qué es guarda (`apps/desk/src/components/PanelOvAsociaciones.tsx:10-16`).
- Se monta en una sola línea del detalle del ticket (`apps/desk/src/components/TicketDetailView.tsx:320`), con su
  importación en `apps/desk/src/components/TicketDetailView.tsx:15`. Añadir un panel hermano se puede hacer
  reescribiendo esas dos líneas, sin insertar ninguna.
- El ticket guarda la marca del equipo en la columna `marca` (`packages/zoho-sync/src/db/schema.sql:28`): es de
  donde puede salir el fabricante preseleccionado.
- Los `.tsx` quedan fuera de la red de pruebas por decisión de Gerencia: el panel no admite rojo previo y su
  cobertura es la tabla de la regla 13 contra las líneas del servidor.

## 8 · Últimos identificadores de requisito

`tickets-core` llega a RQ-TC-43 (`openspec/specs/tickets-core/spec.md:2269` en `6344b4a`), `permissions` a RQ-PM-25
(`openspec/specs/permissions/spec.md:677` en `a64c6c8`) y `derivacion-avisos` a RQ-AV-18
(`openspec/specs/derivacion-avisos/spec.md:753`).

## 9 · Despliegue y maestro

- `DEPLOY.md` no nombra hoy `ov_asociaciones` ni `contratos` (barrido con `grep`, 2026-10-06). Su precedente para
  una tabla nueva es la comprobación de lectura de F1B-04 (`DEPLOY.md:234`), que existe porque la migración es
  tolerante por sentencia y un despliegue puede quedar verde con una tabla sin crear (`DEPLOY.md:237-238`).
- La última corrección entregada para el maestro es la 28
  (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1428`): la siguiente libre es la **29**.

## 10 · Hallazgos laterales (no se corrigen aquí)

- **Las OVI asociadas antes de este cambio** no tendrán respuesta: si la marca «pendiente de respuesta» se deriva
  al leer, saldrán todas como pendientes el día de publicar. Cuántas son es dato de producción.
- **La remisión sin ticket** (F1B-16) está «condicionada» en el plan
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96`): el envío físico de la pieza no tiene hoy dónde
  apoyarse.
