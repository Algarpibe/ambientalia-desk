# Paquete de despliegue — 2026-09-10

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo
escribe un agente que tiene prohibido tocar código, ejecutar despliegues o commitear. La publicación
es una acción manual: el CI **no despliega** (`.github/workflows/ci.yml` no contiene ningún paso de
despliegue; verificado de disco, `grep -n "deploy|Deploy|easypanel"` → 0 líneas).

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | `eb98a59` (`origin/main` ya está ahí) |
| Base que hoy corre en producción | `e8c5e90` (2026-09-09 15:38) |
| Commits del rango | **35** (`git log --oneline e8c5e90..HEAD` → 35 líneas) |
| De ellos, tocan `apps/` o `packages/` | **14** |
| De esos 14, cambian comportamiento | **8** |
| Ficheros de código tocados | 25, +890/−122 (`git diff --stat e8c5e90..HEAD -- apps/ packages/`) |

---

## 1 · Resumen para quien publica

> **✅ PUBLICADO el 2026-09-10.** Verificado sin sesión: el `index-BWdNBrL-.js` que sirve producción es byte a byte el build de `ae5aaf4` (mismo sha256); `Vista no reconocida` presente e `INGRESADO` ausente lo datan en ≥ `48d7545`, tras el cual bajo `apps/` y `packages/` sólo hay comentarios, y cliente y servidor salen de una sola imagen (`Dockerfile`) → **producción ≡ `ae5aaf4`**.
>
> **«Sin desplegar» se cuenta ahora desde `ae5aaf4`, no desde `e8c5e90`**: commits con efecto en ejecución en `git log ae5aaf4..HEAD -- apps/ packages/`, mirados uno a uno. La tabla de arriba queda como registro del rango publicado; la reversión sigue en §6.

**Qué se publica.** Ocho cambios con efecto visible. El resto —seis commits de código— son pruebas y
comentarios (§2.2), y veintiuno son documentación fuera de `apps/` y `packages/`.

**Lo único que puede sorprender al equipo.** La vista **«Tickets en espera»** deja de reconocer 2
estados y pasa a reconocer 9. El día que se publique, tickets que nadie ha tocado **desaparecen de
«Tickets abiertos» y aparecen en «Tickets en espera»**. Medido contra el Zoho Desk real (consulta a
la API el 2026-09-10, **muestra de los 100 tickets más recientes, no la población entera**): de los
21 tickets activos de la muestra, **7 están en `Notificación cliente`** — **un tercio de los activos
de la muestra se muda de columna de listado**. Si nadie avisa, el equipo lo va a leer como que se han
perdido tickets.

**Las dos acciones de persona.**

1. **Enviar el aviso a Comercial** (§8) **antes o el mismo día** de publicar. No es cortesía: hay un
   campo obligatorio que bloquea una etapa del flujo, y quien no sepa que existe se va a quedar
   parado sin saber por qué.
2. **Correr las 5+1 comprobaciones manuales de QA** (§5.2). Vienen del archivado de
   `vista-todos-y-estados-en-espera` con dueño declarado —«QA / quien despliegue»— y **archivar no
   las dio por hechas**.

**Lo que este paquete NO trae, y conviene saberlo antes de leer el resto:** el campo obligatorio
«Fecha de aviso al cliente» **no entra con estos commits: ya está fuera**. Entró con `e8c5e90`, la
propia base desplegada, y **Comercial confirmó por observación directa el 2026-09-10 que la app se lo
pide hoy**. Ver §7.1. Como no viaja en esta publicación, **no es un riesgo de publicar**: los riesgos
de publicar son los otros dos, los siete estados que se mudan de listado (§7.2) y el serial
obligatorio de F1B-01 (V6).

**Y trae un efecto de segundo orden que nadie había medido:** ese mismo campo es el que abre el
**bodegaje de salida**, uno de los tres KPIs de M1.10, y los tickets anteriores al 2026-09-09 no lo
tienen. Ver §7.5 — el indicador arranca con un corte y **la cuenta está sin medir**.

---

## 2 · Inventario de cambios

### 2.1 · Los ocho con efecto visible

| # | Qué ve el usuario | En qué pantalla | Ruta:línea que lo produce |
|---|---|---|---|
| V1 | **«Tickets en espera» pasa de 2 estados a 9.** Siete estados se mudan de «Tickets abiertos» a «Tickets en espera»: `Servicio externo`, `Notificación cliente`, `Notificación a Compras`, `Notificación Comercial`, `Solicitado`, `Liberación Comercial` y `Remisión creada`. Ningún ticket desaparece: cambia de lista | Menú lateral → «Tickets abiertos» y «Tickets en espera» | `boardView.ts:39` (`(ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')`, antes `/espera/i`), alimentando `:47` (abiertos) y `:48` (espera). El registro que consume: `estados.ts:114` en `eb98a59` —la revisión que publica este paquete, cabecera «Se publica hasta»—, nueve entradas = 3 `externa` (`:61-65`) + 6 `interna` (`:68-78`). Hoy ese registro es `:120` y son **once** = 5 `externa` (`:61-73`) + 6 `interna` (`:76-86`), tras `4359b28` |
| V2 | **`Remisión creada` es el séptimo de esa mudanza.** Antes estaba clasificado como «ninguna» | Igual que V1 | `estados.ts:78` en `eb98a59` (`'Remisión creada': 'interna'`; hoy `:86`). Antes vivía en el bloque `ninguna` |
| V3 | **«Todos los Tickets» por fin trae todos.** Antes ocultaba los cerrados. Ahora trae activos primero y cerrados después, sin intercalar, con paginador al pie que dice «Página X de Y · N cerrados» | Menú lateral → «Todos los Tickets» | `boardView.ts:53` (`case 'todos': return tickets`, sin filtro). La composición de la petición en `App.tsx:60-72`; la concatenación «activos primero» en `App.tsx:74`; el paginador en `App.tsx:134-142` y su rótulo en `Pagination.tsx:6` |
| V4 | **Los cerrados caen en la columna «Otros».** Consecuencia directa de V3 en modo tablero: `Finalizado` no tiene columna propia | Tablero (modo kanban por estado), columna «Otros» al final | `columns.ts:34` (`{ id: 'otros', label: 'Otros', statuses: [] }`) + `columns.ts:45-46` (`columnForStatus` devuelve `FALLBACK_COLUMN_ID`, `:38`). La columna se oculta si queda vacía: `KanbanBoard.tsx:17` |
| V5 | **Las tarjetas del tablero vuelven a tener color.** Hasta hoy todas pintaban gris neutro. Ocho estados recuperan su color (rojo `Ingresado`; azul `En Proceso` y `Por Entregar`; ámbar `Notificación Comercial`, `Notificación cliente`, `Por Facturar`, `Por Entregar / Sin facturar`, `En Espera de Repuestos`). Y `En Espera de Repuestos` deja de leerse truncado como `En Espera de Repues...` | Tablero, chip de estado de cada tarjeta | `TicketCard.tsx:14-22` (mapa reclavado a los nombres reales; antes usaba claves en mayúsculas de `mockData.ts` que nunca casaban). El chip pinta ahora `ticket.status` verbatim: `TicketCard.tsx:83`. El respaldo neutro sigue en `:26` |
| V6 | **La remisión ya no se puede emitir sin número de serie.** El servidor responde 422 «Falta el serial del equipo: el ticket no tiene equipo del catálogo ni serial propio». El formulario avisa antes de pulsar, con un cartel ámbar que dice qué hacer («Captúralo en Habilitar Servicio, o enlaza el equipo desde el catálogo») | Ficha del ticket → «Crear remisión» | Servidor: `routes/remision.ts:152-156` (resuelve el equipo, recorta, 422). Cliente: `CrearRemision.tsx:195` (la condición recorta con `.trim()`, así que un serial de sólo espacios ya no pasa) y el texto en `:196-201`. **Sólo afecta a tickets venidos de Zoho que aún no han pasado por «Habilitar Servicio»**: los nacidos en la app siempre traen serial |
| V7 | **Elegir el equipo rellena el cliente y abre sus órdenes de venta.** Antes el cliente se buscaba por nombre y podía no casar; ahora se resuelve por identidad, y con el cliente puesto el buscador de órdenes de venta ofrece solas las activas y libres de ese cliente | Alta de ticket → campo «Equipo» | `CreateTicket.tsx:139` (`pickEquipo`), `:148` (rama por `e.clientId`), `:157` (`getClient` por id). El campo que lo hace posible: `types.ts` `EquipoLite.clientId`, servido desde `equipos.ts:41` / `:58` / `:75`. Endpoint nuevo `GET /api/clients/:id` en `routes/directory.ts:25`, cliente en `api/client.ts:194` |
| V8 | **Alta de ticket: dos mensajes nuevos de error.** (a) Si el equipo elegido es de un cliente y el ticket se está creando para otro, 422 que **nombra a los dos clientes con sus dos ids**: «El equipo 18A20070 es de «X» (cli-A) y el ticket se está creando para «Y» (cli-B). Corrige el cliente o el equipo.» (b) Si el cuerpo no trae cliente pero el equipo sí, el equipo lo rellena solo | Alta de ticket, al guardar | Rama (i) que rellena: `ticketService.ts:65-68`. Rama (ii) que rechaza: `ticketService.ts:69-82`, con el mensaje en `:82`. Va después del 409 de la orden de venta (`:48`) y antes de los obligatorios (`:88`) |

**Un cambio que sí está en el código y cuyo efecto visible es NINGUNO.** Una clave de vista
desconocida ya no hereda en silencio el cuerpo de «Todos»: devuelve lista vacía (`boardView.ts:54`
→ `:59`) con el rótulo «Vista no reconocida» (`boardView.ts:26`). **Es inalcanzable desde la
interfaz**: el menú lateral sólo ofrece las vistas que están en el catálogo
(`Sidebar.tsx:117-122`, que mapea por `FUNCTIONAL_BY_LABEL` y desactiva el resto). Se anota para que
nadie lo busque en la verificación.

### 2.2 · Los seis commits de código sin efecto visible

Comprobado uno a uno con `git show --stat <sha> -- apps/ packages/`.

| Commit | Qué toca | Por qué no se ve |
|---|---|---|
| `43821b8` | `packages/shared/src/bodegaje.test.ts` (+55) | Sólo pruebas |
| `97d7755` | `apps/desk/server/services/ticketService.test.ts` (+24) | Sólo pruebas |
| `0a2c4ff` | `packages/zoho-sync/src/db/migrate.test.ts` (+4/−2) | Sólo pruebas |
| `0163ba8` | `apps/desk/src/lib/boardView.ts` (1 línea) | `void _key;` dentro de una función inalcanzable en tiempo de ejecución. Callar un aviso de ESLint, nada más |
| `3b7d89c` | `packages/shared/src/estados.test.ts`, `sla.test.ts` (4 líneas) | Comentarios y el nombre de un `it()`. Las aserciones no cambian |
| `eb98a59` | `apps/desk/src/lib/boardView.test.ts` (1 línea) | Un número de línea mal citado dentro de un comentario |

**Y una parte del código de producción que tampoco se ve.** `9ed5635` añadió `nombresAmbiguos()`
(`migrate.ts:92`) y `altersAmbiguas()` (`migrate.ts:102`). Son funciones puras **sin ningún llamador
en tiempo de ejecución**: sólo las usan sus propias pruebas. No cambian la migración ni el arranque.

---

## 3 · La migración: es lo de menos

**Resumen: el `.sql` cambia 26 líneas y ninguna hace nada nuevo.**

El único commit del rango que toca `packages/zoho-sync/src/db/schema.sql` es `607e26a`, y su diff
completo es **calificación de esquema**: 13 sentencias `ALTER TABLE X` → `ALTER TABLE public.X`.
Ninguna sentencia nueva, ninguna con semántica distinta. Las 13 líneas están hoy en `schema.sql:112,
115, 116, 143, 145, 291, 306, 309, 310, 313, 316, 317, 374` (verificadas con
`grep -n "ALTER TABLE"`).

Por qué eso no cambia nada en la base: la aplicación conecta con `search_path=desk,public`
(`packages/zoho-sync/src/db/pool.ts:5`) y esas tablas viven en `public`, así que **ya aterrizaban
ahí** sin calificar. Mismo destino, ahora explícito. Es el cierre del incumplimiento IV-6.

**Idempotencia.** Doce de las trece son `ADD COLUMN IF NOT EXISTS`. La decimotercera,
`schema.sql:306`, es `ALTER TABLE public.remisiones ALTER COLUMN ticket_id DROP NOT NULL;`, que
**no** lleva `IF NOT EXISTS`. No importa, por dos razones independientes:

1. `ALTER COLUMN ... DROP NOT NULL` **es idempotente en PostgreSQL**: quitar un `NOT NULL` ya quitado
   no falla.
2. **Ya se ejecutó antes de `e8c5e90`**: en el diff del rango aparece como línea *modificada*, no
   añadida.

> Corrección registrada: una versión previa de este encargo afirmaba que las 13 eran «todas
> `ADD COLUMN IF NOT EXISTS`». Es falso — la de `:306` no lo es. La conclusión (la migración es
> segura) sobrevive, pero por las dos razones de arriba, no por aquélla.

`DEPLOY.md:224` ya declara que `migrate` es idempotente y que cada deploy es seguro. Este paquete no
lo cambia.

---

## 4 · Procedimiento

**`DEPLOY.md` ya cubre el mecanismo. No se repite aquí.**

- **Cómo se publica:** `DEPLOY.md` §5 «Desplegar» (`:174-177`) — botón **Deploy** en EasyPanel, el
  server corre `migrate` en el arranque, y luego se abre el dominio.
- **Idempotencia de la migración:** `DEPLOY.md` §Notas (`:224`).
- **Orden con la replicación lógica:** `DEPLOY.md` §0 (`:50-51`) — el DDL va primero en el
  suscriptor (`desk`) y después en el hub. **No aplica a este paquete**: ninguna de las 13
  sentencias toca las cuatro tablas replicadas (`desk.activities`, `books.contacts`,
  `books.sales_orders`, `books.items`).

### Lo que estos 35 commits añaden y `DEPLOY.md` no cubre

1. **Variables de entorno: ninguna nueva.** Ningún commit del rango introduce un interruptor. Las
   cuatro del correo de avisos (`DEPLOY.md` §4.2) y las dos de escritores locales (§4.1) siguen
   exactamente igual.
2. **El worker `hub-sync` no necesita redeploy por este paquete.** Ningún commit del rango toca
   `apps/hub-sync/`. Redesplegarlo no rompe nada, pero no aporta.
3. **El aviso a Comercial va antes o el mismo día que el Deploy** (§8). Es el único paso de este
   despliegue que no es técnico y el único que, si se salta, produce daño observable.
4. **Reservar diez minutos después del Deploy** para §5. La verificación V1/V3 no se puede posponer:
   es la que decide si hay que volver atrás.

---

## 5 · Verificación en producción

Sobre `https://ambientalia-desk.ambientalia.cloud/`, con sesión iniciada.

### 5.1 · Una comprobación por cambio del inventario

| # | Ruta de pantalla | Resultado esperado |
|---|---|---|
| V1 | Menú lateral → **«Tickets en espera»** | Aparecen tickets que ayer estaban en «Tickets abiertos». Busca al menos uno en `Notificación cliente`: en la muestra de producción había 7 |
| V1b | Menú lateral → **«Tickets abiertos»** | Los mismos tickets ya **no** están. La suma de «abiertos» + «espera» debe seguir siendo la de tickets activos: ninguno desaparece |
| V2 | «Tickets en espera» | Si hay algún ticket en `Remisión creada`, aparece aquí y no en «abiertos» |
| V3 | Menú lateral → **«Todos los Tickets»** | Salen también los cerrados (`Finalizado`), y al pie hay un paginador «Página 1 de N · *total* cerrados». Pulsar «Siguiente» cambia la página |
| V4 | «Todos los Tickets» en modo **tablero** | Los cerrados caen en la columna **«Otros»**, al final. Si está activado «ocultar columnas vacías» y no hay cerrados en la página, «Otros» no aparece |
| V5 | Tablero, cualquier vista | Los chips de estado tienen color, no gris. Ver además §5.2 filas 1-4 |
| V6 | Ficha de un ticket **venido de Zoho sin serial** → «Crear remisión» | Sale el cartel ámbar «Este ticket no tiene número de serie…». Si se fuerza el envío, el servidor responde 422 con «Falta el serial del equipo…» |
| V7 | **Nuevo ticket** → campo «Equipo» → elegir un equipo del catálogo | El cliente se rellena solo, y el buscador de órdenes de venta ofrece las de ese cliente sin escribir nada |
| V8 | **Nuevo ticket** → equipo de un cliente + cliente distinto a mano → Guardar | Error 422 que nombra a **los dos** clientes con sus dos identificadores |
| — | Campo obligatorio «Fecha de aviso al cliente» | ~~Comprobar si el campo ya aparece~~ — **HECHO el 2026-09-10: Comercial lo confirmó en la app, el campo se pide hoy.** No hay nada que verificar tras publicar: no viaja en esta publicación. Ver §7.1 |

### 5.2 · Las 5+1 comprobaciones manuales de QA — son éstas, no otras

Vienen del archivado de `vista-todos-y-estados-en-espera`. Su dueño es **QA / quien despliegue**, y
el archivado **no las dio por hechas** (regla del ciclo 1 de `CLAUDE.md`). Se reproducen literalmente
de `openspec/changes/archive/2026-09-10-vista-todos-y-estados-en-espera/tasks.md:331-337`.

| # | Comprobación | Dueño | Dónde queda anotada |
|---|---|---|---|
| 1 | `En Proceso` pinta azul (`#EBF8FF`/`#3182CE`), no `bg-slate-100` | QA / quien despliegue | `proposal.md` §3 Pieza 5, `design.md` §2·D5 — anotar resultado en el PR o en `docs/sdd/` |
| 2 | `Notificación cliente` pinta ámbar (`#FFF9E6`/`#D97706`) | QA / quien despliegue | ídem |
| 3 | `En Espera de Repuestos` se lee entero, sin `...` | QA / quien despliegue | ídem |
| 4 | Un estado sin entrada en el mapa (p. ej. `Finalizado`, visible en «Todos») conserva el chip neutro con nombre completo | QA / quien despliegue | ídem |
| 5 | En «Todos», los cerrados aparecen **después** de los activos, sin intercalar (RQ-VT-01, sin detector automático — tarea 4.5) | QA / quien despliegue | `vistas-tablero/spec.md:35-40` — anotar resultado |

**La sexta**, declarada en `archive-report.md:142-154` y `:176-178`: el escenario «**el rótulo declara
el total real de cerrados**» de RQ-VT-01 es también verificación manual, con el mismo dueño. Es el
`Página X de Y · N cerrados` de `Pagination.tsx:6`, alimentado por `App.tsx:138` desde el conteo del
servidor. `Pagination.tsx` y `App.tsx` son `.tsx`, fuera de la red de `vitest` por decisión de
Gerencia (F0-00), así que ninguna prueba lo cubre.

> **Nota de citas.** `archive-report.md:164` cita esa tabla como `tasks.md:309-321`. Verificado de
> disco: la tabla está hoy en `tasks.md:331-337`. La cita es caduca; el contenido, idéntico.

---

## 6 · Reversión: qué mirar en el primer minuto

**Volver atrás = redesplegar `e8c5e90` desde EasyPanel** (`DEPLOY.md` §5). La base de datos **no hay
que tocarla**: la migración de este paquete no añade ni quita columnas (§3), así que la versión vieja
funciona sobre el esquema nuevo sin ningún paso extra.

### Señales que obligan a volver atrás

| Señal observable | Dónde se ve | Qué significa |
|---|---|---|
| El tablero se queda vacío o en blanco tras el Deploy | Cualquier vista | Fallo de arranque o del `dist/`. Revisar logs del servicio App |
| **«Todos los Tickets» no carga o tarda más de ~15 s** | Menú lateral → «Todos los Tickets» | Es la vista que ahora hace **dos peticiones en paralelo** (`App.tsx:66`), la única con perfil de carga nuevo. Si el resto de vistas van bien y ésta no, el problema está aquí |
| **La suma «abiertos» + «espera» ≠ tickets activos** | Contadores de las dos vistas | Un ticket se ha caído de las dos listas. No debería poder pasar (`boardView.ts:47` y `:48` son complementarios), pero es la comprobación que lo detecta en un vistazo |
| **No se puede crear ninguna remisión**, ni siquiera con serial | Ficha de ticket → «Crear remisión» | La guarda del serial (`remision.ts:154`) está rechazando lo que no debe |
| **No se puede crear ningún ticket**, con 422 de cliente | Alta de ticket → Guardar | La guarda equipo↔cliente (`ticketService.ts:69`) está disparando de más |
| Errores 500 al abrir la ficha de un cliente desde el alta | Alta de ticket → elegir equipo | El endpoint nuevo `GET /api/clients/:id` (`directory.ts:25`) |

### Señales que NO son motivo de reversión

- **Tickets que cambian de «Abiertos» a «En espera».** Es exactamente lo que este despliegue hace
  (V1). Si el aviso a Comercial salió, no habrá ni preguntas.
- **Tickets cerrados apareciendo en la columna «Otros».** También es lo esperado (V4).
- **Tickets en `Notificación  Comercial` que siguen en «Abiertos».** Ver §7.2: no es una regresión.

---

## 7 · Riesgos y lo que este despliegue NO arregla

### 7.1 · El campo obligatorio «Fecha de aviso al cliente» NO viene en este paquete

**Verificado de disco, y corrige el encargo de este documento.**

`packages/shared/src/transitions.ts` **no cambia en el rango**:
`git log --oneline e8c5e90..HEAD -- packages/shared/src/transitions.ts` devuelve **cero commits**. El
último commit que lo tocó es `e8c5e90` — la propia base que hoy corre en producción — y fue él quien
añadió el campo: `git show e8c5e90 -- packages/shared/src/transitions.ts` contiene la línea
`+ fields: [comment(), cfDate('Fecha de aviso al cliente')] },`. La columna que lo respalda entró en
el mismo commit (`schema.sql:448`, `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_aviso_cliente
date;`).

Estado hoy en disco:

- `transitions.ts:259-260` — la transición `habilitado_para_entrega` («Habilitado para entrega»,
  `Liberación Comercial` → `Por Entregar`, área **Comercial**) declara
  `fields: [comment(), cfDate('Fecha de aviso al cliente')]`.
- `transitions.ts:75` — `cfDate` nace con `required = true`, así que ese campo es **obligatorio**.
- `transitionExec.ts:77` — **el servidor lo impone**: `if (f.required && faltaObligatorio) {
  plan.errors.push(...) }`. No es una guarda de navegador (regla invariable 13 satisfecha: la
  imposición del servidor existe y está en el servidor).

**ZANJADO POR OBSERVACIÓN DIRECTA, no por deducción.** El 2026-09-10, Comercial abrió la app y
confirmó que **«Habilitado para entrega» pide hoy el campo**. Así que `e8c5e90` está desplegado y el
campo está vivo en producción. La comprobación que la última fila de §5.1 dejaba pendiente **ya está
hecha, y salió que sí**.

**LA MAGNITUD, que es donde este documento estuvo a punto de mentir.** `e8c5e90` es del
**2026-09-09** (`git log -1 --format=%ad --date=short e8c5e90`) y la punta de esta rama es del
**2026-09-10**: la ventana entera sin desplegar es de **1,1 días**. El aviso a Comercial llega tarde
**por un día**, no por semanas ni por meses. Un borrador anterior de esta corrección llegó a decir
«lleva bloqueándoles todo este tiempo» sin haber mirado una sola fecha; en un documento técnico eso
es un error, y en un correo a otra área es una alarma inventada. La cifra se cuenta, no se recuerda.

**Consecuencia para quien publica: ninguna.** El campo no viaja en esta publicación, así que **sale
de la lista de riesgos de publicar**. Lo que queda es una deuda de comunicación de un día, que el
aviso de §8 salda tal cual está redactado — su frase «Ya está activo, así que si estos días os ha
aparecido y no sabíais qué era, es esto» **es exactamente cierta** y no hay que tocarla.

### 7.2 · `Notificación  Comercial` con dos espacios: uno de los siete no se va a mover

Hallazgo **nuevo**, ajeno a estos 35 commits. Medición de la orquestación (Zoho Desk real, API,
2026-09-10, muestra de 100 tickets): en Zoho el estado real se llama `Notificación··Comercial`, con
**dos espacios**, verificado a nivel de bytes. El registro del código declara
`'Notificación Comercial'` con **uno** (`estados.ts:77`; `:69` cuando se midió, en `eb98a59`).

**Cara A — la vista de listados.** `boardView.ts:39` compara con `.includes()`, que es igualdad
exacta de cadena. Los tickets reales en ese estado **seguirán apareciendo en «Tickets abiertos»**.
**No es una regresión**: la regex vieja `/espera/i` tampoco los reconocía. Pero el aviso a Comercial
**no puede prometer ese estado**, y por eso §8 no lo nombra.

**Cara B — el tablero por estado, que es peor.** Verificado de disco:

- `columns.ts:29` declara la columna con **un** espacio:
  `{ id: 'notif_comercial', label: 'Notificación Comercial', statuses: ['Notificación Comercial'] }`.
- `columns.ts:40-42` construye `STATUS_TO_COLUMN` a partir de esos `statuses`, y `columnForStatus`
  (`:45-46`) devuelve `STATUS_TO_COLUMN[status] ?? FALLBACK_COLUMN_ID`, con `FALLBACK_COLUMN_ID =
  'otros'` (`:38`).
- `board.ts:9` es quien lo llama para agrupar el tablero.

**Consecuencia: un ticket con dos espacios no cae en la columna «Notificación Comercial» — cae en
«Otros»**, la columna de seguridad del final. No desaparece, pero está en el sitio donde nadie lo
busca, y su columna propia aparece vacía aunque haya tickets en ese estado. En la muestra medida era
**1 ticket de 100**.

**Recomendación antes de dar el estado por perdido:** contrastar el nombre exacto contra la **lista
de estados configurada en Zoho Desk** (Configuración → Estados del departamento). Si el estado de
Zoho es el que tiene el error tipográfico, se arregla ahí y los dos lados casan sin tocar código. Si
no, hay que decidir en qué lado se corrige. **No es tarea de este despliegue.**

### 7.3 · IV-9 — el predicado viejo sobrevive en tres sitios

El cambio V1 cerró el predicado por regex **en `boardView.ts`**, no en el resto de la aplicación.
Verificado de disco, siguen vivos:

- `apps/desk/src/components/ClienteDetalle.tsx:18` — `const esEspera = (t) => /espera/i.test(t.status)`
- `apps/desk/src/components/ClienteDetalle.tsx:22` — `if (/espera/i.test(t.status))` para el color del badge
- `apps/desk/src/components/TicketDetailView.tsx:245` — `/espera|hold/i`, una **tercera variante**, para el color de la etiqueta de estado

Contra los nueve `en_espera` de hoy aciertan **2** (`En Espera de Repuestos` y
`En espera de SKU inventario`), con **cero falsos positivos** entre los 12 restantes.

**Qué se ve.** En la ficha de un cliente y en la cabecera de un ticket, siete estados de espera se
pintan de **azul** («en curso») en vez de **ámbar** («en espera»). Es cosmético y **no es una
regresión de este despliegue**: se comportaba igual antes. Pero produce una incoherencia nueva —el
listado dirá «en espera» y la ficha lo pintará como en curso—, y conviene saberlo por si alguien lo
reporta. Los tres son `.tsx`, fuera de la red de pruebas por decisión de Gerencia (F0-00). IV-9 está
registrado **sin destino**, a propósito.

### 7.4 · `sla.test.ts` — no es asunto de quien publica

`packages/shared/src/sla.test.ts:41-53` se dejó verde a propósito («media mina que se pisa en la
tanda de la alarma de 72 h»). Sus cambios en el rango son **comentarios y el nombre de un `it()`**
(`git show 3b7d89c -- packages/shared/src/sla.test.ts`). **No hay nada que verificar ni que vigilar
en producción.** Se anota sólo para que nadie lo confunda con una prueba rota.

### 7.5 · El bodegaje de SALIDA arranca con un corte, y la cuenta está SIN MEDIR

**Es el efecto de segundo orden del campo de §7.1, y no lo había visto nadie.** No cambia nada de lo
que hay que publicar; cambia lo que se puede afirmar del indicador cuando alguien lo mire.

**El mecanismo, verificado de disco:**

- `packages/shared/src/bodegaje.ts:52` declara `CAMPO_AVISO_CLIENTE = 'Fecha de aviso al cliente'`.
- `bodegaje.ts:74-79` lo usa como el **`abre:` del bodegaje de salida**, que cierra con
  `'Fecha Remisión de Salida'`. Es uno de los tres bodegajes de M1.10 (corrección C9, punto abierto
  nº 41).
- `bodegaje.ts:8-10` fija la regla, citando `reentrancia.ts:24`: **«Los KPIs de G.6 se calculan sobre
  `ticket_transitions.values`, no sobre `tickets.*`»**. Ese módulo no lee `tickets.*` a propósito.
- Lo escribe `repo.ts:282-286`, un `INSERT` en `ticket_transitions` con `values` serializado; la
  tabla está en `schema.sql:57-61` (`transition_id text`, `values jsonb`).

**La consecuencia.** Todo ticket que pasó por `habilitado_para_entrega` **antes del 2026-09-09** no
tiene esa clave en su `values`, porque el campo aún no existía. Su bodegaje de salida **nunca abre**.
El indicador sólo se puede calcular **hacia delante**, con un corte en la fecha de `e8c5e90`.

**LA CUENTA ESTÁ SIN MEDIR, Y SE DECLARA ASÍ A PROPÓSITO.** Hace falta consultar
`desk.ticket_transitions` y en local no hay `psql` ni `DATABASE_URL`. **No se estima a ojo**: esta
misma sesión acumuló varias cifras caducadas por citarlas de memoria, y una de ellas iba camino de un
correo a otra área.

**Cómo se mide cuando alguien tenga acceso.** Dos consultas, y **la unidad importa**:

```sql
-- Tickets afectados.
SELECT count(DISTINCT ticket_id) FROM desk.ticket_transitions
 WHERE transition_id = 'habilitado_para_entrega'
   AND values->>'Fecha de aviso al cliente' IS NULL;

-- Pasadas afectadas. En el grafo declarado debe dar EXACTAMENTE lo mismo que la
-- anterior; si difiere, ver la nota del detector más abajo.
SELECT count(*) FROM desk.ticket_transitions
 WHERE transition_id = 'habilitado_para_entrega'
   AND values->>'Fecha de aviso al cliente' IS NULL;
```

Notas de la consulta, verificadas contra el esquema y contra código que ya corre:

- `transition_id = 'habilitado_para_entrega'` es el id literal de `transitions.ts:259`.
- `values` **sin comillas funciona** en un `WHERE`, pese a ser palabra reservada: lo prueba
  `apps/desk/server/auth/users.ts:138`, que hace `WHERE values->>'derivado_a' = $1` en producción.
- **`->>' ... ' IS NULL` no es un compromiso: es el operador que toca, por dos razones
  independientes.**
  1. *Semántica.* La pregunta no es «¿falta la clave?» sino «¿abre el bodegaje?», y **una clave
     presente con valor `null` tampoco lo abre**. `->>` devuelve `NULL` en los dos casos y por tanto
     los cuenta los dos. El operador de existencia `?` daría **verdadero** para una clave con valor
     `null`, así que `NOT (values ? '...')` la dejaría fuera y **contaría DE MENOS**. Un borrador
     anterior de esta nota lo presentaba al revés, como si `?` fuera «más preciso»: es al contrario.
  2. *El motor.* **`?` no existe en `pg-mem`**: `NOT (values ? '...')` falla con
     `operator does not exist: jsonb ? text`. Una consulta escrita con `?` ni siquiera se podría
     probar en este repositorio. Esta razón no sale de un razonamiento: la da el motor.
- **La consulta SÍ corre en `pg-mem` y puede ir a la suite.** Sonda del 2026-09-10 contra el `pg-mem`
  del repositorio (3.0.14), con control `->> =` y datos sintéticos: `->> ... IS NULL` devuelve la
  clave ausente **y** la clave con `null`, e `IS NOT NULL` y `count(DISTINCT ticket_id)` también
  corren. La suite ya ejercita `->>` sobre `pg-mem`: `apps/desk/server/auth/users.test.ts:93`, contra
  `users.ts:138`. **Lo único que cambia al llevarla a una prueba es el prefijo `desk.`**: en la suite,
  `migrate()` deja las tablas en `public` —`reorgToDesk` no corre en tests porque `pg-mem` no soporta
  `SET SCHEMA`, `packages/zoho-sync/src/db/migrate.ts:122-125`—, así que la consulta literal falla con
  `schema not found: desk` y sin el prefijo da lo esperado. El operador va tal cual.
  *(Un borrador anterior decía «no se puede probar contra `pg-mem`», con la razón tomada del
  comentario de `apps/desk/server/db/primerDerivado.ts:20-21` en `bb94bb2`, sin ejecutar nada. Era
  falso, y la razón de ese comentario también: se corrige aparte, sólo el comentario.)*
- `desk.` va calificado a propósito: la tabla se crea sin calificar (`schema.sql:57`) y aterriza en
  `desk` por el `search_path=desk,public` de `pool.ts:5`.

**POR QUÉ VAN LAS DOS CONSULTAS SI DEBEN DAR LO MISMO: LA DIFERENCIA ES UN DETECTOR GRATIS.**

En el grafo declarado, `count(DISTINCT ticket_id)` y `count(*)` **tienen que coincidir**. Verificado
sobre `transitions.ts`, con control de **34 cláusulas `from:`**:

| Paso | Evidencia |
|---|---|
| `habilitado_para_entrega` deja el ticket en `Por Entregar` | `transitions.ts:259` |
| `Por Entregar` tiene **una sola** salida, a `Finalizado` | `:250`, `entrega_al_cliente` |
| `Finalizado` **no tiene ninguna** salida: es terminal | cero cláusulas `from:` que lo nombren |
| A `Liberación Comercial` sólo se entra desde `Por Facturar` | `:240`, `facturado` |
| Ninguna de las **siete** entradas a `Por Facturar` viene de `Por Entregar` | `:222, :230, :232, :234, :236, :238, :248` — la `:248` sale de `Por Entregar / Sin facturar`, que es **otro estado** |

Así que un ticket **no puede volver a pasar** por `habilitado_para_entrega`. Las dos cifras son la
misma.

**Y precisamente por eso hay que correr las dos.** Si al ejecutarlas **difieren**, la lectura no es
«la traza está mal»: es que **la base tiene caminos que el grafo no declara**, escritos por Zoho
fuera del modelo de la aplicación. Eso sería un hallazgo por sí solo, más importante que el número
que se venía a buscar. Quien las corra debe mirar esa igualdad **antes** que el valor.

*(Un borrador anterior justificaba las dos consultas por «reentrancia del grafo». Es falso: en este
tramo no hay reentrancia, y la comprobación de arriba lo demuestra. La conclusión —incluir las dos—
era correcta con un motivo equivocado, que es la clase de error que se sostiene hasta que alguien la
revisa por el motivo.)*

**Destino: sin asignar.** Es un hallazgo, no una tanda. Quién lo arregla y cómo —backfill desde
`tickets.fecha_aviso_cliente`, declarar el corte en la definición del KPI, o asumirlo— **lo decide
quien vea el número**, y el número todavía no existe.

---

## 8 · Aviso a Comercial — listo para copiar

Español sin jerga. Enviar **antes o el mismo día** del Deploy.

```
Asunto: Dos cambios en el tablero de servicio técnico

Hola:

Esta semana el tablero cambia en dos cosas. La primera os afecta directamente.

1) Al pasar un equipo a "Por entregar" hay que poner una fecha nueva

Cuando uséis la acción "Habilitado para entrega" (la que saca el equipo de
"Liberación Comercial" y lo deja listo para entregar), el sistema pide un campo
que antes no existía: "Fecha de aviso al cliente". Es la fecha en la que
avisasteis al cliente de que su equipo ya está listo.

Es obligatorio. Si no lo rellenáis, el sistema NO os deja completar el paso y
el equipo se queda donde está. No hay forma de saltárselo.

Ya está activo, así que si estos días os ha aparecido y no sabíais qué era,
es esto. Con poner la fecha en la que avisasteis al cliente es suficiente.

2) Vais a ver tickets moverse de "Tickets abiertos" a "Tickets en espera"

A partir del despliegue de esta semana, la lista "Tickets en espera" reconoce
muchos más casos que antes: por ejemplo, un equipo en el que estamos esperando
respuesta del cliente, un servicio externo o una compra.

Eso significa que veréis tickets cambiar de lista de un día para otro sin que
nadie los haya tocado. No se ha perdido nada ni se ha cerrado nada: solo están
mejor clasificados. Si buscáis un ticket y no aparece en "Tickets abiertos",
está en "Tickets en espera".

Además, la lista "Todos los tickets" ahora sí trae todos, incluidos los ya
finalizados, con paginación al final.

Cualquier duda, decidnos.
```

---

## 9 · Nota de método

Este documento verificó **56 citas de disco** (comandos `git show`, `git log`, `git diff`, `grep -n`
y lectura directa de fichero sobre el árbol en `eb98a59`). Las mediciones de producción contra la
API de Zoho Desk (§1 y §7.2) las hizo la orquestación el 2026-09-10 sobre una **muestra de los 100
tickets más recientes**, no sobre la población entera; se citan como tales y su límite está escrito
donde se usan.

Tres afirmaciones heredadas se cayeron al comprobarlas y quedan corregidas arriba:

1. «Las 13 `ALTER TABLE` calificadas son todas `ADD COLUMN IF NOT EXISTS`» → **falso**, `schema.sql:306`
   es `ALTER COLUMN ... DROP NOT NULL` (§3).
2. «El campo obligatorio "Fecha de aviso al cliente" entra con este despliegue» → **falso**, entró con
   `e8c5e90`, la base (§7.1).
3. «Las cinco comprobaciones manuales están en `tasks.md:309-321`» → **caduco**, están en
   `tasks.md:331-337` (§5.2). La cita venía del propio `archive-report.md:164`, que es exactamente el
   fallo que la regla de método nombra: una cita de segunda mano es una hipótesis, aunque venga de un
   documento propio.
