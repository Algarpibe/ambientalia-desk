# Exploración · `mensaje-422-cliente-duplicado`

Base: `main` @ `0a2c4ff`. Modo `strict_tdd` · `hybrid` · `ask-on-risk` · presupuesto 400 líneas.
Persistido también en Engram: `sdd/mensaje-422-cliente-duplicado/explore` (obs. 381).

> **Nota de procedencia.** La fase corrió como sub-agente `sdd-explore` y devolvió `partial`: su
> toolset no incluía escritura, así que este fichero espejo lo escribe el orquestador. Las diez citas
> de línea del informe se comprobaron una a una contra el árbol en `0a2c4ff` antes de transcribirlas.

## 1 · Estado actual

La guarda equipo↔cliente vive en `apps/desk/server/services/ticketService.ts:65-77`, dentro de
`createManagedTicket` (`:20-99`), entre el `409` de OV duplicada (`:45-49`) y el bloque de obligatorios
(`:78-86`):

- **Rama (i)**, `:65-68` — si ni el cuerpo ni la OV trajeron `clientId` y el equipo sí,
  `clientId = equipo.clientId`. Corre **antes** de `missing.push('cliente')` (`:82`), y esa es la razón
  de que la guarda esté donde está.
- **Rama (ii)**, `:69-77` — si los dos existen y difieren: `logger.warn` (`:74`) y
  `throw new HttpError(422, …)` (`:76`), con `nombreEquipo = equipo.clienteNombre ?? equipo.clientId`
  (`:75`).

**El defecto.** El mensaje nombra sólo al cliente del equipo; al destino lo llama «otro cliente» sin
identificarlo, y no lleva ningún id. Los ids existen, pero sólo en el `logger.warn` de `:74`, que vive
en el servidor y no delante de quien podría reportarlo. `getClient(db, clientId!)`, que resolvería el
nombre del destino, corre **después**, en `:87` — su resultado no está en ámbito en `:76`.

**El falso positivo que esto hace indistinguible.** El `design.md` de la tanda anterior
(`openspec/changes/archive/2026-09-09-cerrar-hallazgos-revision-f1b-01/design.md:75-79`) ya lo nombró
como la señal a vigilar: `books.contacts` arrastra filas duplicadas; `searchClients` filtra por
`contact_type` y `getClient` **no**, a propósito y documentado
(`packages/zoho-sync/src/books/repo.ts:111-116`). Si la misma empresa real existe como dos filas, el
equipo apunta a una y el cuerpo/OV a la otra: **mismo nombre, dos ids**. El mensaje dice entonces «es
de ACME y se está creando para otro cliente» cuando el otro también es ACME. Describe como
discrepancia lo que es un duplicado, y quien lo recibe no puede distinguir los dos casos.

## 2 · Superficie afectada

| Ruta | Qué aporta |
|---|---|
| `apps/desk/server/services/ticketService.ts:69-77` | Único punto de cambio candidato |
| `apps/desk/server/services/ticketService.test.ts:361-398`, `:406-414` | Pruebas vivas de la guarda |
| `…/ticketService.test.ts:369` | `expect(r.body.error).toContain('cli-A')` — hoy pasa porque `equipoConCliente('eq-1','cli-A')` (`:363`) no pasa `clienteNombre` y cae al respaldo `equipo.clientId` de `:75`. Es decir: el mensaje ya enseña **un** id, pero nunca el del destino |
| `…/ticketService.test.ts:238-243` (`equipoConCliente`), `:246-248` (`cliente`) | `cliente(id)` inserta **siempre** el mismo nombre literal (`'Gecelca S.A. E.S.P.'`) sea cual sea el id: `cliente('cli-A')` + `cliente('cli-B')` reproduce el escenario de nombres duplicados **sin tocar el helper** |
| `apps/desk/server/db/equipos.ts:38-43` (`toLite`), `:75-78` (`getEquipo`) | `equipo.clienteNombre` y `equipo.clientId` ya están en mano, sin coste |
| `packages/shared/src/types.ts:329-348` (`EquipoLite`) | `clienteNombre?` y `clientId?` son opcionales |
| `packages/zoho-sync/src/books/repo.ts:74-80` (`clientToLite`), `:129-132` (`getClient`) | `name` es obligatorio; `getClient` devuelve `null` si no hay fila |
| `apps/desk/server/util/httpError.ts:1-5`, `apps/desk/server/app.ts:78` | `res.status(err.status).json(err.body)` — el cuerpo viaja literal |
| `apps/desk/src/api/client.ts:286-294` → `apps/desk/src/components/CreateTicket.tsx:180-197` → `:344` | La cadena que lo pinta: `createTicket` extrae `body.error`, `submit` hace `setError(err.message)`, `:344` lo renderiza literal. **Es el punto de verificación en la app.** |

## 3 · Enfoques

**1. Consulta extra de `getClient` sólo dentro de la rama (ii); mensaje con nombre + id de los dos
clientes.** *(recomendado)*
- A favor: no toca el orden de las guardas, así que respeta el no-objetivo de la precedencia 409/422 y
  la razón de ubicación que `design.md:40-45` protegió; el id resuelve la ambigüedad aunque el nombre
  coincida; `equipo.clienteNombre` ya está en mano; el coste extra cae **sólo en el camino de error**.
- En contra: una consulta más en ese camino; `getClient` puede devolver `null` —el `clientId` del
  cuerpo puede no existir en Books, porque «Cliente no encontrado» corre después, en `:88`—, así que
  necesita el mismo respaldo que ya usa el lado del equipo.
- Esfuerzo: bajo.

**2. Enseñar el id crudo del destino sin resolver su nombre.**
- A favor: coste cero, sin riesgo de `null`.
- En contra: asimetría de legibilidad —un lado con nombre, el otro con un id opaco de Books—. Mejora
  parcial. Esfuerzo: bajo.

**3. Mover la rama (ii) detrás del `getClient` de `:87` y reutilizar `cliente.name`.** *(descartado)*
- A favor: sin consulta adicional.
- En contra: obliga a separar (i) de (ii) —(i) tiene que seguir antes de `:82`—, y mover sólo (ii)
  **cambia precedencia real hoy no probada**: contra «Faltan campos obligatorios» (`:86`) y contra
  «Cliente no encontrado» (`:88`), ninguna cubierta por `ticketService.test.ts:315-348`. Es
  exactamente la decisión que esta tanda declara fuera de alcance. Esfuerzo: medio/alto.

## 4 · Recomendación

**Enfoque 1.** Cierra el problema real —nombres duplicados indistinguibles— sin reabrir la precedencia
de guardas. La forma exacta del mensaje (ids siempre visibles, o sólo cuando los nombres coinciden)
queda como punto abierto para `sdd-propose`; no se decide aquí.

## 5 · Riesgos y encuadre por las reglas del proyecto

- `getClient` puede devolver `null` en la rama (ii): hace falta un respaldo simétrico al
  `equipo.clienteNombre ?? equipo.clientId` de `:75`.
- Hoy **no existe** ninguna prueba del escenario de nombres duplicados.
- **Regla invariable 13.** La guarda es enteramente de servidor (`:65-77`) y no tiene espejo en
  `apps/desk/src`: el arreglo vive en la imposición, no en un espejo. Punto 2 de la regla, no punto 3.
- **Regla de secretos.** Los `clientId` son ids de contacto de Zoho Books, **no secretos**: ya viajan
  al navegador bajo sesión autenticada por `searchClients` (`books/repo.ts:117-127`) y por
  `EquipoLite.clientId` (`types.ts:345`). `design.md:115-120` ya lo había concluido para esta misma
  guarda: «no filtra nada nuevo».

## 6 · Hallazgo lateral, no explorado más allá

Dos citas caducas dentro del propio bloque que esta tanda va a tocar, ambas de `9ed5635`, ambas
desplazadas por la inserción de la guarda:
- `ticketService.ts:56` cita «`:54` (`if (!clientId) missing.push('cliente')`)»; hoy es `:82`.
- `ticketService.test.ts:250` cita «el bloque de obligatorios de `ticketService.ts:53-58`»; hoy es
  `:81-86`.

Se anotan aquí para que la propuesta decida si entran: son la regla de método aplicada al fichero que
esta tanda abre de todos modos.

## 7 · No-objetivos declarados

- No se propone que `getClient` filtre por `contact_type`: ese no-filtro es deliberado y documentado
  (`books/repo.ts:111-116`).
- No se propone desduplicar `books.contacts`.
- No se toca la precedencia 409/422 del alta: punto abierto (`openspec/specs/tickets-core/spec.md` §4.1).
- No se proponen pruebas `.tsx`: excluidas por decisión de Gerencia (F0-00, 2026-09-08).
