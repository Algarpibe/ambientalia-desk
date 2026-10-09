# Preguntas para Gerencia — 2026-10-09

Una sola lista con todo lo que Gerencia tiene pendiente tras las nueve tandas construidas entre el 06/10 y el 08/10,
**ordenada por lo que frena**. Medido sobre `473665b`. Sustituye, como lista viva, a
`docs/sdd/Preguntas_Gerencia_2026-10-06.md`, cuyas dieciséis preguntas quedaron respondidas o registradas como
pendientes el mismo 06/10 (`openspec/config.yaml:3885-3888`); lo que de ellas sigue abierto está aquí.

**Cómo está ordenada.**

- **A · Sujeta el despliegue** (1 a 3): sin respuesta no se publica.
- **B · Supuestos de cada tanda** (4 a 27): la construcción aplicó un criterio por defecto, reversible, y lo que se
  pide es confirmarlo o corregirlo. **Ninguno impide publicar.** Dentro de cada tanda, primero el que más cambia lo
  que ve una persona.
- **C · Pendientes de antes** (28 a 32): lo que ya estaba abierto y sigue igual.

**Cómo leer cada pregunta.** Lleva su identificador tal como está en el informe de su cambio, la pregunta en una
frase, las opciones y qué cambia con cada una. «Hoy» es lo que hace el código de `473665b`, que todavía no está en
producción. Los supuestos se leyeron en el `archive-report.md` de cada cambio, con su línea; lo que dice el código se
leyó en el código.

**Dónde se registra cada respuesta.** En `openspec/config.yaml` → `decisiones_de_gerencia`, con la respuesta textual:
la bandeja no es fuente. Este documento **no propone nombres de clave ni destinos nuevos**.

## Resumen

| # | Id | Pregunta | Tanda | Qué frena |
|---|---|---|---|---|
| 1 | E-158 | ¿Un ticket de «Equipo nuevo» lleva remisión de entrada? | F1B-03 | **El despliegue** |
| 2 | S-4 (F1B-19) | ¿Se acepta que el primer día Comercial reciba de golpe los avisos de provisionales ya existentes? | F1B-19 | **El despliegue**, sólo si ya hay provisionales |
| 3 | — | ¿Quién lleva cada cargo, y quién los asigna el día del corte? | F1C-05, F1B-03, F1B-13 | **El despliegue** |
| 4 | consecuencia 7 de E-157 | ¿Una OVI sólo puede ir en tickets de garantía? | F1B-03 | Nada |
| 5 | S-5 (OVI) | ¿En un ticket de garantía se puede cobrar aparte un repuesto no cubierto? | F1B-03 | Nada |
| 6 | S-10 (ficha) | ¿La respuesta a «¿Se reclama al fabricante?» se puede cambiar? | F1B-13 | Nada |
| 7 | S-4 (ficha) | ¿El valor reclamado se escribe a mano? | F1B-13 | El cierre de F1B-13 |
| 8 | S-7 (ficha) | ¿El aviso es a los 60 días naturales? | F1B-13 | Nada |
| 9 | S-2, S-3 y S-6 (reasignación) | ¿Quién puede reasignar un ticket, y a quién? | F1B-05 | Nada; contradice al maestro |
| 10 | S-4 (accesorios) | ¿Qué se hace con un accesorio real que no es artículo de Books? | F1B-04 | Nada |
| 11 | S-1 (accesorios) | ¿El SKU de Books es el número de parte? | F1B-04 | El cierre de F1B-04 |
| 12 | S-1 (ampliación) | ¿El motivo de ampliar un contrato es obligatorio? | F1B-11 | Nada |
| 13 | S-2 (ampliación) | ¿Se puede ampliar un contrato más de una vez? | F1B-11 | Nada |
| 14 | S-4 (ampliación) | ¿Al ampliar se reevalúa el aviso de ritmo? | F1B-11 | Nada |
| 15 | S-D y S-E (indicador 55) | ¿Cómo es de verdad el fichero de la encuesta? | F1F-05 | La primera carga real |
| 16 | S-G (indicador 55) | ¿Se acepta cargar sin el canal de cada respuesta? | F1F-05 | Nada |
| 17 | S-A (prioridad) | ¿Top 5 va por encima de «alta», por debajo o empatan? | F1B-07 | Nada |
| 18 | S-C (prioridad) | ¿Se reescribe la prioridad de los tickets que ya existen? | F1B-07 | Nada; toca datos de producción |
| 19 | S-K (prioridad) | ¿Se rechaza una prioridad «baja» o «urgente» pedida en una transición? | F1B-07 | Nada |
| 20 | S-J (prioridad) | ¿El ajuste a mano protege sólo la prioridad? ¿Y los ajustados antes? | F1B-07 | Nada; toca datos de producción |
| 21 | S-1 a S-3 (columnas) | ¿Dónde van las dos columnas nuevas, con qué rótulo, y se ven vacías? | F1B-08 | Nada |
| 22 | S-1 (NIT) | ¿Basta mantener la lista de NIT exentos por SQL? | F1B-19 | Nada |
| 23 | S-2 (NIT) | ¿Se impide un segundo provisional con el mismo NIT? | F1B-19 | Nada |
| 24 | S-3 (NIT) | ¿Vale el texto del aviso, sin enlazar a un ticket? | F1B-19 | Nada |
| 25 | S-5 (NIT) | ¿El aviso a los pocos minutos, o una vez al día? | F1B-19 | Nada |
| 26 | S-6 (NIT) | ¿Un NIT genérico no avisa aunque sólo lo sea uno de los dos lados? | F1B-19 | Nada |
| 27 | — | La lista de contabilidad: ¿qué NIT repetidos de Books son genéricos? | F1B-19 | Nada |
| 28 | E-094 | ¿Depende algo de Drive o de n8n de los prefijos del ticket? | F1B-03 | El cierre de F1B-03 |
| 29 | P-4 (prioridad) | ¿Qué es la «valoración del portal» y cómo llega a Desk? | F1B-07 | El cierre de F1B-07 |
| 30 | `p4-vistas-equivalentes-zoho` | Las vistas de Zoho que cada persona echa en falta, antes del 16/10 | F1B-08 | El cierre de F1B-08 |
| 31 | — | El desvío del cliente de la orden frente al del equipo, sin destino desde el 07/10 | sin fila | Nada |
| 32 | — | El desvío de la orden que el sincronizador desasocia, sin destino desde el 07/10 | sin fila | Nada |

---

## A · Lo que sujeta el despliegue

### 1 · E-158 — ¿un ticket de «Equipo nuevo» lleva remisión de entrada?

- **Pregunta.** Desde que se publique, no se podrá habilitar un servicio sin una remisión de entrada, sin
  excepciones. Los tickets de «Equipo nuevo» pasan por ese mismo paso: ¿en la práctica llevan remisión de entrada?
- **Estado.** Registrada como **pendiente, no como decisión** (`openspec/config.yaml:3889-3891`). Respuesta del 06/10
  (`openspec/config.yaml:3897`): «[Pendiente de confirmar con Servicio Técnico.] Si equipo nuevo no lleva remisión de
  entrada: excepción por clasificación «Equipo nuevo», construida antes de publicar.»
- **Opciones y qué cambia.**
  - **«Sí la lleva».** Se publica el código tal como está.
  - **«No la lleva».** Hay que construir una excepción antes de publicar: el commit preparado deja de servir y hace
    falta un cambio nuevo y otro paquete de despliegue.
- **Qué arrastra.** Todo lo construido desde el 03/10 va en el mismo código y no se puede publicar por partes
  (`docs/sdd/Paquete_de_Despliegue_2026-10-09.md`, §7). Entre ello, los indicadores, que tienen que estar en
  producción antes del viernes 13/11 para medir desde el 16/11.
- **Con ella, de sólo lectura y ejecutables hoy:** los dos recuentos de tickets que quedarían bloqueados
  (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`,
  `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`).

### 2 · S-4 de F1B-19 — la ráfaga de avisos de clientes provisionales

- **Pregunta.** La aplicación avisará a Comercial cada vez que un cliente provisional comparta NIT con un contacto de
  Books. El primer día avisaría, de una vez, de todas las coincidencias que ya existan: ¿se acepta, o se prefiere que
  el aviso empiece sólo con las nuevas?
- **Fuente.** `openspec/changes/archive/2026-10-08-nit-exentos-aviso-provisional/archive-report.md:88` y la tabla de
  supuestos de `openspec/changes/archive/2026-10-08-nit-exentos-aviso-provisional/proposal.md:110`.
- **Opciones y qué cambia.**
  - **«Se acepta la ráfaga» (lo construido).** El primer día hay un aviso por cada coincidencia ya existente, para
    cada persona de Comercial que recibe avisos **y para cada administrador**; después, sólo las nuevas.
  - **«Un corte».** Las coincidencias anteriores al despliegue quedan calladas para siempre y nadie las verá por
    esta vía. **Sólo se puede elegir antes de publicar**, y exige código nuevo.
- **Lo que puede hacerla innecesaria.** La tabla de clientes provisionales la crea este mismo despliegue
  (`packages/zoho-sync/src/db/schema.sql:658`). Si producción no ha usado nunca el alta manual, no hay provisionales y
  **no puede haber ráfaga**. Se comprueba con una lectura antes de publicar
  (`docs/sdd/Paquete_de_Despliegue_2026-10-09.md`, §0 e). Si la lectura sale vacía, esta pregunta pasa al bloque B.
- **Además, para saberlo:** para buscar coincidencias la aplicación lee todos los contactos de Books en cada pasada,
  cada tres minutos, mientras haya algún provisional sin enlazar
  (`apps/desk/server/db/provisionalEnBooks.ts:19`). Su coste con el volumen real no está medido.

### 3 · Los cargos — quién lleva cada uno y quién los asigna el día del corte

- **Qué se pide.** No es una decisión nueva: es una lista. Los cargos no se pueden asignar antes de publicar, porque
  el campo llega con el propio despliegue; hay que tener **escrito antes** quién es el Director Comercial, quién el
  Director Técnico y quién el Especialista técnico, y qué administrador los asigna en los primeros minutos.
- **Qué pasa mientras un cargo no esté asignado.** Sólo un administrador puede: hacer una «Liberación sin factura» y
  fijar el Top 5 (Director Comercial); **asociar una orden OVI a un ticket**, responder la ficha de garantía, ajustar
  la prioridad de un ticket desde Servicio Técnico y mantener las listas de novedades y de accesorios (Director
  Técnico) (`packages/shared/src/cargos.ts:32-34`, `packages/shared/src/cargos.ts:101`).
- **Lo que más pesa.** Un ticket de «Garantía» sólo admite una orden OVI, y la OVI sólo la asocia el Director
  Técnico: sin el cargo asignado, ningún ticket de garantía recibe orden
  (`openspec/changes/archive/2026-10-06-ovi-garantia-por-cargo/archive-report.md:82`).
- **Opciones.** Aceptar por escrito ese intervalo de minutos, o pedir que el corte se haga con el administrador
  presente para cubrirlo.

---

## B · Supuestos de cada tanda — para confirmar o corregir

### OVI de garantía (F1B-03, `ovi-garantia-por-cargo`)

**4 · Consecuencia 7 de `decision/e157-ovi-garantia-por-cargo` — ¿una OVI sólo puede ir en tickets de garantía?**
(`openspec/changes/archive/2026-10-06-ovi-garantia-por-cargo/archive-report.md:83`; dueño que nombra el informe: el
Director Técnico.)

- **Hoy.** Un ticket de garantía sólo admite OVI, pero lo contrario no se impone: una OVI se puede asociar a un
  ticket que no es de garantía, si quien la asocia tiene el cargo (`packages/shared/src/ordenOVI.ts:61-64`).
- **«Sí, sólo en garantía».** Hace falta una guarda más en las cuatro entradas de una orden: un ticket de otro tipo
  rechazaría la OVI.
- **«No, puede ir en otros».** Queda como está.

**5 · S-5 — ¿en un ticket de garantía se puede cobrar aparte un repuesto no cubierto, con una orden normal?**
(`openspec/changes/archive/2026-10-06-ovi-garantia-por-cargo/archive-report.md:74-75`,
`openspec/changes/archive/2026-10-06-ovi-garantia-por-cargo/proposal.md:156`.)

- **Hoy.** No: la regla alcanza también a la «OV adicional» de las aprobaciones. Un ticket de garantía rechaza
  cualquier orden de cobro, también la adicional.
- **«Sí se puede cobrar aparte».** La regla se limita a la orden de entrada y la adicional vuelve a admitir una orden
  normal.
- **«No».** Queda como está: lo no cubierto se cobraría en otro ticket.

Van juntas: las dos definen qué relación hay entre «garantía» y «OVI».

### Ficha de garantía con el proveedor (F1B-13, `ficha-garantia-proveedor`)

Fuente de los tres: `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:34-37`.

**6 · S-10 — ¿la respuesta a «¿Se reclama al fabricante?» se puede cambiar una vez dada?**

- **Hoy.** No: una segunda respuesta se rechaza (`apps/desk/server/routes/garantiaProveedor.ts:55`). Si se respondió
  «no» por error, no hay forma de abrir la ficha desde la aplicación.
- **«Que se pueda rectificar».** Hace falta un acto de rectificación con motivo, que hoy no existe.
- **«Que no se cambie».** Queda como está. Conviene avisar al Director Técnico antes del primer día, porque todas las
  OVI ya asociadas aparecerán pendientes de respuesta.

**7 · S-4 — ¿el valor reclamado se escribe a mano?**

- **Hoy.** Sí, es opcional y lo teclea quien responde; se entiende en pesos, aunque la aplicación no guarda la
  moneda (`packages/zoho-sync/src/db/schema.sql:740-741`).
- **«Que salga del costo de la OVI».** Depende de una comprobación previa que nadie ha hecho: si las líneas de una OVI
  traen costo en Books y en qué moneda
  (`openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:92`). Con ese dato, es trabajo que
  le falta a la fila.
- **«A mano».** Queda como está, y esa parte de la fila se da por hecha.

**8 · S-7 — ¿el aviso de reclamación sin resolver es a los 60 días naturales?**
(`openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:93`.)

- **Hoy.** 60 días naturales contados desde la respuesta «sí» —no desde el envío al fabricante—; avisa el día 61, una
  sola vez por ficha (`packages/shared/src/garantiaProveedor.ts:39`).
- **«Días hábiles», u otro plazo.** Se cambia una constante o se cuenta con el calendario laboral.
- **«Desde el envío».** Se cambia la fecha de partida.

### Reasignación con motivo (F1B-05, `reasignacion-con-motivo`)

**9 · S-2, S-3 y S-6 — ¿quién puede reasignar un ticket, y a quién?**
(`openspec/changes/archive/2026-10-06-reasignacion-con-motivo/archive-report.md:49-52`.)

- **Hoy (construido).** Reasigna un administrador, o cualquier persona que sea del área de alguna transición que
  salga del estado en que está el ticket (`packages/shared/src/reasignacion.ts:26`). El cargo no cuenta, y tampoco
  ser la persona a cargo. En un estado sin salida («Finalizado»), sólo un administrador. El destino puede ser
  cualquier persona activa, de cualquier área (`apps/desk/server/routes/reasignacion.ts:34-35`).
- **Lo que dice el maestro.** «Reasignación entre técnicos de la misma área… La pueden hacer la persona a cargo y el
  Director o el Coordinador del área»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2035`).
- **Opciones y qué cambia.**
  - **«Como dice el maestro».** Se cambia la regla: sólo la persona a cargo, el Director o el Coordinador; y el
    destino, sólo de la misma área. Quien hoy puede y no tiene ese cargo dejaría de poder.
  - **«Como está construido».** Se corrige el maestro para que diga lo que hace la aplicación.
  - **Una mezcla** —por ejemplo, cualquiera del área pero destino sólo de la misma área—: se dice cuál.
- **Aviso.** El informe del cambio pide confirmar S-2, S-4, S-5, S-6 y S-8, y deja fuera S-3 —el cargo no
  interviene—, que es justo el punto en que se separa del maestro
  (`openspec/changes/archive/2026-10-06-reasignacion-con-motivo/archive-report.md:162`). Se sube aquí completo.
- **De menos peso, mismo informe:** destino igual a la persona actual se rechaza (S-4); reasignarse a uno mismo se
  permite y no avisa (S-5); el correo lleva copia y no se avisa a quien deja el ticket (S-7); eliminar un ticket borra
  sus reasignaciones (S-8). Si no se corrigen, quedan como están.

### Accesorios por modelo (F1B-04, `accesorios-lista-por-modelo`)

Fuente: `openspec/changes/archive/2026-10-07-accesorios-lista-por-modelo/archive-report.md:58-62`.

**10 · S-4 — ¿qué se hace con un accesorio real que no es artículo de Books?**

- **Hoy.** Ya no se puede añadir a la lista de un modelo por ninguna vía: todo accesorio nuevo tiene que ser un
  artículo de Books (`apps/desk/server/routes/catalogo.ts:220`). Los que ya estaban se conservan y se siguen pudiendo
  marcar en la remisión.
- **«Se dan de alta en Books».** Queda como está; es trabajo de quien mantiene Books.
- **«Se admite una excepción».** Vuelve a abrirse el alta de un accesorio sin artículo, y con ella el texto libre que
  la decisión quiso cerrar.

**11 · S-1 — ¿el SKU de Books es el «número de parte»?**

- **Hoy.** La remisión de entrada enseña el SKU del artículo junto a su nombre, como número de parte; si el artículo
  no tiene SKU, sólo el nombre.
- **«Sí».** Esa parte de la fila se da por hecha.
- **«No, es otro dato».** Hay que decir de qué campo de Books sale, o guardar uno propio: trabajo nuevo.

**De menos peso, mismo informe:** el Director Técnico sólo añade, no retira ni reordena (S-3); «Otro» y «Accesorio
fuera de lista» comparten un único texto por remisión (S-10); la copia entre modelos omite los accesorios sin
artículo (S-9). Y antes del corte hay que ejecutar la consulta de modelos sin ningún accesorio: un modelo con la
lista vacía deja al técnico sin casillas que marcar (`docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql`).

### Ampliación de contrato (F1B-11, `ampliacion-contrato`)

Fuente: `openspec/changes/archive/2026-10-07-ampliacion-contrato/archive-report.md:54-59`; las tres preguntas, en
`openspec/changes/archive/2026-10-07-ampliacion-contrato/archive-report.md:156`.

**12 · S-1 — ¿el motivo de ampliar es obligatorio?**

- **Hoy.** Sí; la decisión no lo pedía y se añadió por coherencia con liberar y reasignar
  (`packages/shared/src/contratos.ts:287-288`).
- **«Obligatorio».** Queda como está. **«Opcional».** Se retira esa comprobación; nada más cambia.

**13 · S-2 — ¿se puede ampliar un contrato más de una vez?**

- **Hoy.** Sí, las veces que haga falta, siempre hacia delante y sin pasar del 31/12 del año de su vencimiento.
- **«Una sola vez».** Se añade una comprobación; un contrato ya ampliado no se podría volver a ampliar.

**14 · S-4 — ¿al ampliar se vuelve a evaluar el aviso de ritmo?**

- **Hoy.** No: si el aviso de ritmo del último trimestre ya salió, una ampliación alarga ese trimestre y **no habrá
  aviso nuevo** en el tramo añadido.
- **«Que se reevalúe».** La ampliación reinicia la marca y el aviso puede volver a salir.

**Para saberlo, sin pregunta:** un contrato que vence el 31/12, o que venció en un año anterior, no se puede ampliar
(`packages/shared/src/contratos.ts:267-270`); y no hay aviso a nadie cuando se amplía (S-5).

### Indicador 55 (F1F-05, `indicadores-51-55`)

Fuente: `openspec/changes/archive/2026-10-07-indicadores-51-55/archive-report.md:45-52`; lo que se pide confirmar, en
`openspec/changes/archive/2026-10-07-indicadores-51-55/archive-report.md:144`.

**15 · S-D y S-E — ¿cómo es de verdad el fichero de respuestas de la encuesta?**

- **Hoy.** La carga está construida sobre un formato **supuesto y sin validar**: un CSV de Google Forms con tres
  columnas —número de ticket, marca de tiempo y calificación—, con fechas de día primero. No hay ninguna exportación
  real en el repositorio.
- **Lo que hace falta, y no es una opinión:** una **muestra real** de la exportación del formulario (tarea de
  Comercial, `openspec/changes/archive/2026-10-07-indicadores-51-55/archive-report.md:141`), sin datos de clientes en
  un chat.
- **Si la muestra coincide.** Se cargan las respuestas en enero, sin más trabajo.
- **Si no coincide.** Se sustituye la lectura del fichero; el resto no cambia. **Si el formulario no recoge el número
  de ticket, todas las filas se rechazarían** y habría que decidir con qué dato se asocia cada respuesta.
- **Mientras tanto.** El indicador 55 sale «sin dato» para todos los tickets.

**16 · S-G — ¿se acepta cargar las respuestas sin el canal por el que llegó cada una?**

- **Hoy.** Sí, no se guarda el canal. **«Hace falta el canal».** Se añade el dato; conviene decirlo antes de la
  primera carga, porque las respuestas ya cargadas no lo tendrían.

**Además, de la misma fila:** falta por construir la comparación con la exportación de Zoho, que es lo que la mantiene
abierta (`openspec/changes/archive/2026-10-07-indicadores-51-55/archive-report.md:6-8`).

### Prioridad en tres niveles (F1B-07, `prioridad-tres-niveles`)

Fuente: la tabla de supuestos de `openspec/changes/archive/2026-10-08-prioridad-tres-niveles/proposal.md:105-114` y
los cuatro de más peso que nombra
`openspec/changes/archive/2026-10-08-prioridad-tres-niveles/archive-report.md:139`.

**17 · S-A — ¿un cliente Top 5 va por encima de uno con contrato («alta»), por debajo, o empatan?**

- **Hoy.** Empatan: el Director Comercial elige para cada Top 5 entre alta y media, y entre dos tickets de igual
  prioridad manda la fecha de habilitación.
- **«Top 5 por encima» (o por debajo).** Hace falta un nivel nuevo: cambia el orden de la cola del taller y el
  tablero por prioridad. Es una tanda aparte.

**18 · S-C — ¿se cambia la prioridad de los tickets que ya existen?**

- **Hoy.** No se toca ninguno: los tres niveles valen para los tickets que nazcan desde el despliegue. Los que ya
  tengan «baja» o «urgente» la conservan.
- **«Que se recalculen».** Es un cambio sobre datos de producción: lo decide y lo ejecuta una persona, con copia
  previa.

**19 · S-K — ¿se rechaza una prioridad «baja» o «urgente» pedida al ejecutar una transición?**
(`openspec/changes/archive/2026-10-08-prioridad-tres-niveles/archive-report.md:25`.)

- **Hoy.** Sí: si en una transición se pide una prioridad distinta de la actual y fuera de alta y media, se rechaza.
  Antes el servidor escribía lo que llegase.
- **«Que no se valide».** Quien tenga permiso podría volver a escribir «baja» o «urgente» a mano.

**20 · S-J — ¿el ajuste a mano protege sólo la prioridad? ¿Y qué se hace con los ajustados antes?**

- **Hoy.** Un ajuste a mano hace que Zoho deje de pisar **sólo la prioridad** de ese ticket; el estado y lo demás
  siguen llegando de Zoho. Con el código anterior, el ajuste congelaba el ticket entero.
- **Primera parte.** «Sólo la prioridad» (como está) o «el ticket entero» (se vuelve a lo anterior).
- **Segunda parte, sólo si los hay.** Los tickets ajustados con el código anterior seguirían congelados: ¿se liberan
  o se dejan? Es un cambio sobre datos de producción. Si producción no ha usado nunca el ajuste, no hay ninguno; se
  comprueba con una lectura (`docs/sdd/Paquete_de_Despliegue_2026-10-09.md`, §0 f).

**De menos peso, misma tabla:** el servidor ignora la prioridad pedida en el alta (S-B); se puede ajustar cualquier
ticket, no sólo los de clientes Top 5 (S-D), también uno sin cliente (S-H); el Director Técnico ajusta tickets pero no
la prioridad de un cliente (S-E), sin que se le exija área (S-F) y en cualquier estado (S-G); desmarcar un Top 5
devuelve cada ticket a la prioridad que tenía (S-I).

### Columna propia para dos estados (F1B-08, `columna-propia-dos-estados`)

**21 · S-1, S-2 y S-3 — ¿dónde van las dos columnas nuevas, con qué rótulo, y se pueden ver vacías?**
(`openspec/changes/archive/2026-10-08-columna-propia-dos-estados/archive-report.md:80`; el texto de cada una, en
`openspec/changes/archive/2026-10-08-columna-propia-dos-estados/proposal.md:103-105`.)

- **S-1, posición. Hoy:** «Solicitud Soporte» va junto a «Ticket creado» y «Verificación» tras «En Proceso».
  **Otra posición:** se mueve; es una línea.
- **S-2, rótulo. Hoy:** la columna se llama como el estado. **Otro rótulo:** se cambia el texto.
- **S-3, vacías. Hoy:** como las demás columnas, se ocultan si están vacías, salvo que la persona desactive esa
  opción. **Que no se vean nunca vacías:** exige tocar la pantalla del tablero.

### NIT exentos y aviso de provisional (F1B-19, `nit-exentos-aviso-provisional`)

Fuente: `openspec/changes/archive/2026-10-08-nit-exentos-aviso-provisional/archive-report.md:113`; el texto de cada
una, en `openspec/changes/archive/2026-10-08-nit-exentos-aviso-provisional/proposal.md:107-112`. S-4 es la pregunta 2.

**22 · S-1 — ¿basta mantener la lista de NIT exentos por SQL, o contabilidad necesita una pantalla?**
**Hoy:** por SQL, lo hace una persona con acceso a la base. **Con pantalla:** trabajo nuevo.

**23 · S-2 — ¿se impide dar de alta un segundo cliente provisional con el mismo NIT?**
**Hoy:** no se impide, sea o no un NIT exento. **Que se impida:** se añade una comprobación al alta manual; con el
NIT de consumidor final habría un solo provisional para todos.

**24 · S-3 — ¿vale el texto del aviso, sin enlazarlo a un ticket?**
**Hoy:** «El cliente provisional «…» (NIT …) coincide por NIT con el contacto de Books «…». Conviene enlazarlos.»,
sin ticket (`apps/desk/server/services/avisoProvisionalEnBooks.ts:32`). **Otro texto o con enlace:** se cambia.

**25 · S-5 — ¿el aviso llega a los pocos minutos, o basta una vez al día?**
**Hoy:** en cada sincronización, cada tres minutos por defecto. **Una vez al día:** se añade un cierre diario; la
lectura de todos los contactos de Books pasaría de cada tres minutos a una vez al día.

**26 · S-6 — ¿un NIT genérico no avisa aunque sólo lo sea uno de los dos lados?**
**Hoy:** basta que el NIT del provisional o el del contacto de Books sea exento para no avisar. **Sólo si lo son los
dos:** se quita uno de los dos filtros.

**27 · La lista de contabilidad — ¿qué NIT repetidos de Books son genéricos?**
(`openspec/changes/archive/2026-10-08-nit-exentos-aviso-provisional/archive-report.md:111-112`.)

- **Hoy.** Sólo está exento el de consumidor final, `222222222222`; la respuesta del 06/10 añadía «los genéricos que
  confirme contabilidad sobre la lista de NIT repetidos en Books» (`openspec/config.yaml:4213`).
- **Qué se pide.** Que una persona con acceso a producción ejecute la consulta de NIT repetidos, de sólo lectura
  (`docs/sdd/Paquete_de_Despliegue_2026-10-09.md`, §4.5, bloque 4), y que contabilidad diga cuáles son genéricos.
- **Qué cambia.** Cada NIT confirmado se añade por SQL; mientras no esté, ese NIT sigue frenando el alta manual y
  avisando como cualquier otro. No bloquea nada.

---

## C · Pendientes de antes

### 28 · E-094 — ¿depende algo de Drive o de n8n de los prefijos del ticket?

- **Qué se pide.** No es una decisión, es una comprobación que Gerencia se reservó
  (`openspec/config.yaml:4114-4116`): «[Comprobación mía: etiquetas en n8n y copia de informes a Drive.]»
  (`openspec/config.yaml:4121`). La entrada es `docs/sdd/ENTRADA.md:1330`.
- **«Nada depende».** Se construye la supresión de los cinco prefijos en los tickets nuevos, que es lo que le falta a
  la fila F1B-03.
- **«Depende esto».** Se dice qué, y se decide antes cómo se adapta.
- **Sin respuesta.** F1B-03 no puede cerrarse aunque la OVI esté resuelta; el alta sigue pidiendo el prefijo.

### 29 · P-4 de la prioridad — ¿qué es la «valoración del portal» y cómo llega a Desk?

- **Estado.** La respuesta del 06/10 la dejó entre corchetes: «[Lo que sea la valoración del portal; en Zoho CRM no
  hay ninguna utilizable.]» (`openspec/config.yaml:4139`). No se construye ninguna regla con la valoración
  (`openspec/config.yaml:4145-4146`).
- **«Es este dato, y está aquí».** Se construye la regla que falta y F1B-07 puede cerrar.
- **«No se usa por ahora».** La fila se cierra con lo construido: tres niveles sin valoración.
- **Sin respuesta.** F1B-07 sigue abierta sin nada que construir
  (`openspec/changes/archive/2026-10-08-prioridad-tres-niveles/archive-report.md:140`).

### 30 · `decision/p4-vistas-equivalentes-zoho` — las vistas de Zoho, con plazo 16/10

- **Estado.** Decidido el 06/10 (`openspec/config.yaml:3940`): «Opción (a), por escrito: cada persona que usa Zoho
  Desk envía capturas de sus vistas semanales y lo que echa en falta, plazo 16/10. Sin respuestas ese día, se cierra
  con lo construido.»
- **Qué se pide.** Que las respuestas lleguen antes del **16/10**. Es tarea de las personas que usan Zoho Desk.
- **Con respuestas.** Lo que pidan se mide contra el corte antes de entrar: sólo lo que sea paridad, y con talla.
- **Sin respuestas ese día.** La mitad de paridad de F1B-08 se cierra con lo construido.
- **Cuidado.** Las capturas pueden traer datos de clientes: no se pegan en un chat ni se versionan sin revisar.

### 31 · El cliente de la orden frente al del equipo — sin destino desde el 07/10

- **Qué es.** Al crear un ticket, si la orden de venta es de un cliente y el equipo es de otro, la aplicación no lo
  contrasta ni avisa (`CLAUDE.md:346`). Gerencia decidió que eso sólo es válido cuando quien paga es el mantenedor
  del equipo, y lo situó en la fila F1B-11.
- **Por qué vuelve.** F1B-11 se cerró el 07/10 sin resolverlo. Desde ese día no tiene fila.
- **Qué se pide.** Decir dónde va: una fila nueva antes del corte, después del corte, o dejarlo registrado como
  desvío aceptado. **No se propone destino aquí.**

### 32 · La orden que el sincronizador desasocia — sin destino desde el 07/10

- **Qué es.** En tickets venidos de Zoho cuya orden se eligió en la aplicación **antes** de los cambios de F1B-11, el
  sincronizador puede seguir vaciando el número de la orden y dejar la fila diciendo dos cosas (`CLAUDE.md:348`).
  Las elegidas desde esos cambios ya están protegidas.
- **Por qué vuelve.** Lo que falta es marcar esas filas antiguas, que es un cambio sobre datos de producción y está
  pendiente de decisión. F1B-11 se cerró el 07/10 sin hacerlo.
- **Qué se pide.** Decir si se hace ese relleno y en qué fila. **No se propone destino aquí.**

---

## Lo que este documento no cubre

- **No es la bandeja entera.** Recoge lo que sujeta el despliegue, los supuestos de las nueve tandas y los pendientes
  nombrados. Siguen abiertas, sin analizar aquí, las preguntas de la recepción E-163 a E-167
  (`docs/sdd/ENTRADA.md:1807`), que el cambio de accesorios deja fuera, y las que condicionan la migración de tickets
  abiertos (E-207 a E-212 y E-218), que no son de este despliegue.
- **Los supuestos de formato del mapa del blueprint** (nombres de fichero, leyenda, orden de estados) y **los de la
  copia semanal de Drive** (día y hora, sin reintentos, sin lanzamiento manual) no se suben: no cambian lo que ve
  una persona ni tocan cliente, dinero, permisos o datos. Están en la propuesta y en el diseño de cada cambio.
- **Las líneas de `openspec/config.yaml` y de `CLAUDE.md` son las de `473665b`.** Los dos ficheros tienen en el árbol
  de trabajo bloques sin commitear que no son de esta sesión y que no se citan; si alguno responde ya a una de estas
  preguntas, vale lo que diga cuando esté versionado.
- **Las opciones de cada pregunta son las que traen las fuentes citadas.** Donde la fuente no las enumera, se han
  escrito las dos respuestas posibles, sin añadir alternativas.
