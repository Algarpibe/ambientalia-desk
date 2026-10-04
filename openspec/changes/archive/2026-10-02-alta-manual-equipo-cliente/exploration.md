# Exploración: alta manual de equipo y cliente desconocidos (F1B-15)

Medido el 2026-10-02 en el worktree `alta-manual-equipo-cliente`, rama del mismo nombre, partiendo de `132d25f`.
CodeGraph: el worktree no tiene `.codegraph/` propio y este agente no tiene shell para inicializarlo; se usó el
índice de `C:\dev\Desk_2_R1.023` (mismo commit, sin cambios) sólo para localizar símbolos, y toda línea citada
se leyó en el worktree.

## 1. Fuentes del alcance

| Fuente | Qué fija |
|---|---|
| `docs/sdd/ENTRADA.md:1555` (E-129, literal) | Equipo: serial ×2, marca, modelo del catálogo o «no catalogado» con texto, tipo; si el serial existe se ofrece el existente. Cliente provisional: razón social, NIT, contacto, teléfono, correo. Ambos «pendiente de validar». Comercial enlaza el cliente con Books (o lo crea allí) y completa los datos comerciales. Sin «Habilitar Servicio» mientras siga pendiente. Traza de quién y por qué |
| `openspec/config.yaml:3526` (`decision/orden-ejecucion-encargo-01-10`, b) y `:3534-3535` | Fila nueva F1B-15; **F1B-14 sigue cerrada** |
| `openspec/config.yaml:3469` (`decision/trabajo-del-01-10-antes-del-corte-sin-fila`) | Antes del corte sólo paridad, con fila y talla. Su punto (2) mandaba E-129 a F1B-14; lo precisa la decisión anterior |
| `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:95`, `:154`, `:308` | Fila F1B-15, talla M, antes del 14/12. §H: «añade una guarda a "Habilitar Servicio", la misma transición en la que F1B-03 añadirá la de remisión vigente; hacerla antes … deja a F1B-03 la prueba de posición entre ambas». **Comprobado**: F1B-03 lleva «guarda de remisión vigente» en su fila (`:83`) |
| Maestro `…R08.4.md:2529-2535` (M3.4) | El mismo texto de E-129, `[DECIDIDO 01/10/2026 — R08.4]`, con `[ABIERTO]` en `:2535`: qué cargos pueden hacer el alta y si los cinco datos son el mínimo |
| Maestro `…R08.4.md:5626-5629` (Anexo D nº 83) | El mismo punto abierto, dueño Gerencia, «va antes del corte» |
| Maestro `…R08.4.md:4151-4153` | Recomendaba F1B-04; **superado** por `decision/orden-ejecucion-encargo-01-10` (b) |

## 2. Qué significa «equipo y cliente desconocidos»

- **Equipo desconocido** = serial que no está en `equipos`. Hoy sólo «Equipo nuevo» admite alta en el ticket
  (`apps/desk/server/services/ticketService.ts:24-25`); el resto exige `equipoId` registrado (`:24`, `:27`).
  El alta de F1B-14 exige modelo **del catálogo** (`apps/desk/server/services/equipoNuevo.ts:38-44`) y fecha de
  factura (`:40`), y reutiliza el equipo si el serial existe (`:46-47`). No hay doble tecleo del serial.
- **Cliente desconocido** = no está en los contactos de Books. Hoy el alta exige cliente (`ticketService.ts:84`) y
  que exista (`:89-90`), y no hay ningún camino para crear uno.
- **OCR no existe**: `grep -rn ocr apps/ -i` da 3 aciertos, todos en pruebas o utillaje
  (`apps/desk/server/citas/guardianes.test.ts`, `apps/desk/server/testing/reposDePrueba.ts`). El «por qué no se
  pudo usar el OCR ni el autocompletado» sólo puede ser un motivo escrito.

## 3. Dónde vive hoy un cliente y quién puede crearlo

- `public.clients` es una **vista** sobre `books.contacts` (`packages/zoho-sync/src/db/schema.sql:169-173`);
  `RQ-ZS-09` lo exige (`openspec/specs/zoho-sync/spec.md:246-254` en `05ef26e`).
- `books.contacts` llega por **replicación lógica** desde `zoho-hub` (`DEPLOY.md:38-42`), y «la App escribe
  **sólo** en `desk`» (`DEPLOY.md:33-36`). Escribir en `books.contacts` desde la App rompería la réplica y
  sería escribir datos de Zoho.
- Lectores: `searchClients` (`packages/zoho-sync/src/books/repo.ts:117-127`), `getClient` (`:129-132`, 24
  llamadores según CodeGraph), y los `LEFT JOIN clients` del listado (`packages/zoho-sync/src/db/repo.ts:147`,
  `:162`, `:182`, `:202`). Rutas: `apps/desk/server/routes/directory.ts:15-17` y `:25-29`.
- **Hoy nadie puede crear un cliente en la App.** Sólo Zoho (Books/CRM) vía el hub.

## 4. ¿Choca con `p44-escritura-zoho` o con la titularidad?

- **p44** (`openspec/config.yaml:1566-1571`): «la aplicación NO escribe en Zoho». **No choca**: el cliente
  provisional vive en una tabla propia de la App, y el enlace con Books lo hace Comercial **a mano** (crea el
  contacto en Books si no existe; llega por el hub; lo enlaza). Es justo el «escribir nosotros a mano en Zoho»
  de la respuesta textual.
- **Titularidad** (`openspec/config.yaml:1784-1786`, mantenedor; `:2800`, campos reservados a Comercial): **no
  choca** si el alta manual NO acepta los tres campos restringidos (factura, fin de garantía, mantenedor) y los
  completa Comercial por el PATCH ya restringido de F1B-14 (`apps/desk/server/routes/equipos.ts:73`). La guarda
  equipo↔cliente (`ticketService.ts:61-79`) compara ids: si el equipo nace con el id provisional y el enlace
  reescribe equipo y tickets en la misma transacción, la guarda sigue coherente.

## 5. «Habilitar Servicio» y los flujos

- `habilitar_servicio` sale de `OV asignada`, `Ticket creado` y `Remisión creada`, área Comercial
  (`packages/shared/src/transitions.ts:178`). «Equipo nuevo» nace en `Ticket creado` (`packages/shared/src/flujos.ts:138-140`)
  y pasa por ella.
- **Soporte remoto NO pasa por ella**: nace en `Solicitud Soporte` (`flujos.ts:139`) y su catálogo no la
  contiene (`transitions.ts:388-397`). La guarda literal de E-129 no protege ese flujo (pregunta Q3).
- El escalón B de `executeTransition` está encadenado en una sola línea (`ticketService.ts:131`) para no
  desplazar citas.

## 6. Ficheros muy citados y esquemas

- `ticketService.ts` lo cita `CLAUDE.md` por línea (`:41`, `:45-79`, `:61-79`, `:132`, `:134`, `:150`): toda
  inserción antes de `:150` desfasa citas (regla de mutación 4).
- `schema.sql`: la tabla nueva va **calificada** (`public.`) y **al final**; `equipos` está en `DESK_TABLES`
  (`packages/zoho-sync/src/db/migrate.ts:63-64`), así que sus `ALTER` van sin calificar, como las de `:466-471`.
  La tabla nueva entra en `PUBLIC_TABLES` (`migrate.ts:70-73`).
- Hallazgo lateral, sin destino: `RQ-ZS-10` dice que `PUBLIC_TABLES` tiene 16 tablas
  (`openspec/specs/zoho-sync/spec.md:258-260` en `05ef26e`) y hoy la lista tiene 26 (`migrate.ts:70-73`). Hipótesis: es un
  recuento fechado (caso B). Se anota, no se toca.

## 7. Estimación

| Pieza | Código | Pruebas |
|---|---|---|
| Esquema (tabla, columnas de equipo, vista con `UNION ALL`) + `PUBLIC_TABLES` | ~45 | ~60 |
| Alta manual en el servidor (equipo + cliente provisional + traza) | ~150 | ~220 |
| Enlace del cliente y validación del equipo (Comercial) + guarda de «Habilitar Servicio» | ~130 | ~200 |
| Interfaz: modo manual en `CreateTicket.tsx` y validación en la hoja de vida | ~280 | — (`.tsx` fuera de la red, F0-00) |
| **Total de código y pruebas** | **~605** | **~480** → **~1.085** |

Más de 800: va en **tres lotes** (ver la propuesta).
