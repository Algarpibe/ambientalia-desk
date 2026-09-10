# Exploración · cerrar-hallazgos-revision-f1b-01

Cierre de los hallazgos de la revisión adversaria de F1B-01 (`git diff c45bcb1 607e26a`).
Baseline de partida: `main` en `56ff441`, `npm test` → 112 ficheros pasan + 1 omitido (113),
988 pruebas pasan + 2 omitidas (990), código de salida 0.

> **Nota de proceso.** El sub-agente `sdd-explore` corrió sin herramientas de escritura
> (`Write`/`Edit`/`Bash` no disponibles en su sesión), así que persistió su informe sólo en Engram
> (`sdd/cerrar-hallazgos-revision-f1b-01/explore`, obs. #365). Este fichero —la mitad OpenSpec que
> exige el modo `hybrid`— lo escribe el orquestador a partir de ese informe, más las verificaciones
> propias que se marcan abajo.

---

## H1 · La guarda equipo↔cliente vive sólo en el navegador — CONFIRMADO

**Qué pasa.** `apps/desk/server/services/ticketService.ts:24` trae el equipo con `getEquipo`, que
desde F1B-01 devuelve `clientId` (`apps/desk/server/db/equipos.ts:39`). `:27` toma `clientId` del
cuerpo de la petición. `:59` sólo comprueba que ese cliente exista en Books. `:67` escribe los dos
en el `INSERT`. **Entre `:24` y `:67` no hay ninguna comparación entre `equipo.clientId` y el
`clientId` del cuerpo.**

Mientras tanto el navegador sí decide por identidad: `apps/desk/src/components/CreateTicket.tsx:148-151`
fija `clientId` desde `e.clientId`, y `:118`/`:256` bloquean el campo. Es la regla invariable 13,
punto 2 de `CLAUDE.md`: una decisión sin contrapartida en el servidor, y una guarda en el cliente no
es una guarda.

**Superficie de entrada.** Una sola vía: `apps/desk/server/routes/tickets.ts:124-126`
(`POST /api/tickets` → `createManagedTicket`). El único middleware es `requireAuth(db)`
(`routes/tickets.ts:35`, un `app.use` para todo el prefijo): cualquier sesión válida, de cualquier
área, puede crear tickets. *Verificado por el orquestador.*

**`tickets.client_id` se escribe una sola vez**, en la creación
(`packages/zoho-sync/src/db/repo.ts:385,399`); ninguna transición ni el sync lo reescriben después.

**Severidad real: integridad de datos, no autorización.** `client_id` del ticket no autoriza ni
filtra nada — los listadores sólo lo usan en `LEFT JOIN` para resolver el nombre a mostrar. Esto
rebaja el hallazgo respecto de cómo lo planteó la revisión, y hay que decirlo en el commit.

**El caso que decide el diseño.** `apps/desk/server/backfillClientId.ts` enlazó el 96,6 % de los
~352 equipos de la carga inicial y deja explícitamente sin tocar el resto (~3,4 %, `client_id` NULL).
Ese resto vive hoy de la vía por nombre (`CreateTicket.tsx:163-176`) con su aviso ámbar (`:259-264`).
**Una guarda que exija coincidencia siempre lo bloquearía de raíz.** La guarda tiene que activarse
sólo cuando `equipo.clientId` no es nulo.

**Hueco de cobertura, confirmado.** En `apps/desk/server/services/ticketService.test.ts:215-317` el
helper `equipo()` nunca fija `client_id` (queda NULL) y `CAMPOS_OK` siempre manda `clientId: 'cli-1'`.
Ninguna prueba manda hoy un par que no case.

**Colateral, fuera de alcance de esta tanda.** `ticketService.ts:39` tampoco contrasta el `clientId`
del cuerpo contra `ov.clientId`: mismo patrón con la orden de venta en vez del equipo. Se anota, no
se corrige aquí.

### Alternativas de diseño

| | Qué hace | A favor | En contra |
|---|---|---|---|
| (a) **422 en discrepancia** | Rechaza cuando `equipo.clientId` y el del cuerpo existen y difieren | Error explícito, mismo patrón que el 409 de OV duplicada de la misma función (`ticketService.ts:45-49`) | Hay que comprobar que no rompe ninguna prueba viva |
| (b) **Imponer el del equipo** | Ignora el del cuerpo | Cómodo, nunca falla | Tapa errores de datos en silencio; el usuario cree haber elegido un cliente y sale otro |
| (c) **Rellenar si falta, rechazar si choca** | Si el cuerpo no manda `clientId` y el equipo lo tiene, se usa el del equipo; si los dos existen y difieren, 422; si el equipo lo tiene NULL, no se toca nada | Cumple la regla 13 sin sacrificar el 3,4 %, y hace el `clientId` del cuerpo redundante en el caso normal | Dos ramas en vez de una |

**Recomendación: (c).** Es (a) más el relleno por defecto, que es lo que evita que el 3,4 % pague la
factura y lo que hace que la identidad del equipo mande cuando existe.

---

## H2 · El guardián del esquema y `contacts` — MATIZADO: hueco real, sin bug vivo

`contacts` es la **única** colisión de nombre pelado entre las tres listas de
`packages/zoho-sync/src/db/migrate.ts:63-64,70-73,80`: está en `DESK_TABLES` y, calificada, en
`BOOKS_TABLES`.

El guardián de identidad completa (`migrate.test.ts:266-275,324-331`) sí los distingue, porque compara
la identidad calificada. El que no puede es el sub-test de `migrate.test.ts:337-343`, que filtra por
el nombre pelado: `ALTER TABLE contacts …` destinada a Books pasa como tabla de Desk.

**Matiz que rebaja la severidad, verificado por el orquestador.** `packages/zoho-sync/src/db/pool.ts:5`
fija `search_path=desk,public` — **`books` nunca está en el `search_path`**. Así que una `ALTER`
sin calificar no puede aterrizar en `books.contacts`: aterriza en `desk.contacts`. No hay bug vivo.

Lo que falta no es un arreglo, es **blindaje de intención**: hoy una `ALTER` escrita para Books
alteraría `desk.contacts` en silencio y el guardián diría que está bien. Eso es exactamente la clase
de error para la que existe la regla dura de `CLAUDE.md`, con una sentencia de otra clase.

---

## H3 · Precedencia 422/409 sin prueba — CONFIRMADO, y alcanzable

`apps/desk/server/routes/remision.ts:152-157` (422 del serial) corre antes de `:174-183` (409 de
remisión pendiente), y `:144-147` declara que es a propósito. Ninguna prueba lo fija: las del 409
usan `preparar()`, que siempre da serial; las del 422 (`ticketDeZohoSinSerial`,
`remisiones.test.ts:882-928`) nunca tienen remisión previa. Cero solapamiento.

**Discrepancia con el informe del explorador.** Dijo «inalcanzable por la API normal». No es exacto:
`packages/zoho-sync/src/db/repo.ts:47` incluye `serial` en `TICKET_COLS`, y `:62-65` lo reescribe en
cada pasada del sync. La guarda de `:56-58` sólo protege los tickets con `managed_by_app = true`, y
los venidos de Zoho tienen `false`. Así que la secuencia es: ticket de Zoho con serial → remisión
creada, en `pendiente` → una pasada del sync con el campo de serie vacío en Zoho lo deja en NULL →
el ticket tiene a la vez remisión pendiente y ningún serial. *Que el campo llegue vacío desde Zoho es
**hipótesis**: no hay acceso a esos datos desde aquí. Que el sync lo sobrescriba está verificado.*

Con la guarda donde está, ese usuario oye «falta el serial» y sabe qué hacer. Movida detrás, oye «ya
tienes una remisión sin desenlace», que es cierto y no es el problema.

---

## H4 · Aviso del formulario vs. guarda del servidor — CONFIRMADO, arreglo de una línea

`apps/desk/src/components/CrearRemision.tsx:195` decide con `!data.equipo.serial`. Un serial de sólo
espacios es *truthy* en JS, así que no dispara el aviso; el servidor sí recorta antes de decidir
(`apps/desk/server/routes/remision.ts:153`) y responde 422, caso que la propia F1B-01 fijó en prueba
(`apps/desk/server/remisiones.test.ts:906-913`).

Arreglo: `!(data.equipo.serial ?? '').trim()`.

**Sin prueba, y a propósito.** Es `.tsx`, fuera de la red de pruebas por decisión de Gerencia
(F0-00, `CLAUDE.md` y `openspec/config.yaml`). No se propone ampliarla.

---

## H5 · La regresión del nombre del cliente — verificada donde el código lo permite

**(a) La divergencia es estructural, no estadística.** `normalizarNombreCliente`
(`apps/desk/server/backfillClientId.ts:47-68`) pliega acentos, puntuación, formas societarias y
letras sueltas del final. `searchClients` (`packages/zoho-sync/src/books/repo.ts:117-127`) no pliega
nada: es `LOWER(...) LIKE '%q%'`. Dos grafías que el backfill casó pueden no encontrarse con el
`LIKE`. Eso no depende de los datos.

**(b) Segundo modo de fallo:** el `LIMIT 20` de `books/repo.ts:117,123`. Con un texto libre genérico
el cliente correcto puede quedar fuera de la página. Degrada al aviso, no a una atribución errónea.

**(c) Y lo que hace irrelevante la pregunta de frecuencia:** `GET /api/clients/:id` **no existe**
(`apps/desk/server/routes/directory.ts:15` sólo registra la búsqueda), pero `getClient(db, id)` sí
(`packages/zoho-sync/src/books/repo.ts:129`). Si el formulario resolviera el cliente por id, el
`LIKE` deja de participar y (a) y (b) desaparecen del camino.

> El explorador objetó que exponerlo «no ayuda al 3,4 %». Es cierto y es irrelevante para este
> hallazgo: la regresión sólo ocurre cuando `e.clientId` existe. El 3,4 % nunca entra en esa rama —
> cae en la vía por nombre de `CreateTicket.tsx:163-176`, que no cambia.

**Lo que no se puede verificar desde aquí, y por qué.** La frecuencia en producción. No hay `psql` en
el `PATH`, `DATABASE_URL` no está puesta, `data/` está vacío, y el MCP de Zoho Books responde a todas
las llamadas con el error de organización obligatoria incluso pasándole el `organization_id` que
devuelve `list_organizations`.

---

## Riesgos

1. **H1** — riesgo bajo de romper pruebas: hoy ninguna puebla el `client_id` del equipo.
2. **H3** — la prueba fija intención sobre un camino cuya alcanzabilidad tiene una mitad en hipótesis.
   Hay que decirlo en el commit y no vender más de lo que hay.
3. **H5** — cualquier cifra de impacto sigue siendo hipótesis mientras no haya acceso a la base.
4. **Proceso** — la fase `sdd-explore` corrió sin herramientas de escritura. Si vuelve a pasar en
   `sdd-design` o `sdd-tasks`, el artefacto OpenSpec se pierde otra vez.
