# Informe de verificación — `busqueda-cliente-y-codigo` (F1F-03, `cierra: no`)

Verificado en el worktree `busqueda-cliente-y-codigo` sobre `6b303b8` (planificación `2e5839a` + `f73be04`; base `e99f361`).
Strict TDD activo. Los `.tsx` están fuera de la red por F0-00: no se propone `jsdom` ni `@testing-library`.

## Veredicto: PASS WITH WARNINGS

| Severidad | Cuenta |
|---|---|
| CRITICAL | 0 |
| WARNING | 1 |
| SUGGESTION | 3 |

## 1. Escenarios de RQ-VT-17 → prueba

Corrida pedida (seis ficheros): **6 ficheros, 58 de 58 en verde**. Suite completa: 284 ficheros y 4.787 pruebas en verde.

| Escenario del delta (`specs/vistas-tablero/spec.md`) | Prueba (fichero · título) | Resultado |
|---|---|---|
| código de servicio por una parte (`:230`) | `packages/zoho-sync/src/db/busquedaClienteCodigo.test.ts` · «el código se encuentra por una parte, sin distinguir mayúsculas» | verde |
| cliente por cuenta de Desk y por Books (`:235`) | mismo fichero · «se encuentra por la cuenta de Desk y por el cliente de Books» (+ «una parte del medio del nombre basta») | verde |
| provisional también se encuentra (`:240`) | mismo fichero · «el cliente provisional no enlazado se encuentra por su razón social»; y `apps/desk/server/db/busquedaClienteConfrontacion.test.ts` · «sale en la búsqueda y trae su razón social como nombre del cliente» (`accountName`, `clienteProvisional`) | verde |
| provisional enlazado no se encuentra (`:245`) | `busquedaClienteCodigo.test.ts` · «un provisional ya enlazado no se encuentra por su razón social vieja» | verde |
| el contacto no se busca (`:250`) | mismo fichero · «el contacto no se busca» | verde |
| cerrado por cliente no sale entre activos (`:255`) | mismo fichero · «un cerrado que casa por cliente no sale entre los activos, y el recuento de cerrados lo cuenta» (activos, cerrados, `countClosedTickets`=1 y `getAllTickets`) | verde |
| número exacto sin cambio (`:261`) | mismo fichero · «el número sigue exacto y la vía del cliente suma, no sustituye» | verde |
| normalización enfrentada a `searchClients` y `normalizarNombreCliente` (`:266`) | `busquedaClienteConfrontacion.test.ts` · siete pruebas por caso de la tabla D3, «searchClients no recorta los extremos…» y «las divergencias con normalizarNombreCliente son exactamente las tres declaradas» | verde |
| mutaciones de las vías nuevas (`:272`) | M3, M4, M5 y M7 de `apply-progress.md`; M4 reproducida aquí (§3) | cubierto; sólo M4 reproducida para las vías nuevas |
| VERIFICACIÓN DE PERSONA: la caja dice lo que busca (`:277`) | tarea de persona P-2 (`tasks.md:34-37`); lectura del `.tsx` | declarada; archivar no la da por hecha |

Los 22 escenarios de RQ-VT-11 siguen cubiertos por las pruebas previas (`busquedaTickets.test.ts` de `zoho-sync` y `shared`,
`busquedaConfrontacion.test.ts`, `busquedaTicketsHuecos.test.ts`), todas verdes tras el cambio.

## 2. Delta de RQ-VT-11 contra el bloque vivo

Comparado `openspec/specs/vistas-tablero/spec.md:484-664` (181 líneas) con el bloque MODIFIED del delta (`spec.md:5-185`, 181 líneas),
sin CR: **mismas 181 líneas y mismos 22 `#### Scenario`**. `diff` muestra exactamente cuatro diferencias, todas en sitio:

1. Título (primera línea del bloque): «…por número de ticket, serial, cliente y código de servicio».
2. «Un `q` de sólo dígitos…» (línea 29 del bloque vivo; delta `:33`): añade «y además por cliente y código (`RQ-VT-17`)».
3. «Estructura de la condición» (línea 31 del bloque vivo; delta `:35`): «número, serial, cliente y código se unen con `OR`».
4. Límite declarado «No se busca por asunto…» (línea 59 del bloque vivo; delta `:63`): sustituido por la referencia a `decision/e198-busqueda-cliente-y-codigo`.

Ninguna otra diferencia. La fusión (3.3) puede ser en sitio sin desplazar líneas.

## 3. Evidencia de TDD estricto: mutaciones reproducidas

Ficheros corridos: `busquedaClienteCodigo.test.ts` y `busquedaTickets.test.ts` (23 pruebas). Restauración con `git checkout -- <fichero>`;
`git status --short` limpio tras cada una.

| Id | Mutación sobre `packages/zoho-sync/src/db/busquedaTickets.ts:21-22` | Resultado |
|---|---|---|
| M0 | control, sin cambio | 23 de 23 en verde |
| M1 | quitar los paréntesis exteriores de `const predicado` | **ROJO, 3 fallos:** `busquedaClienteCodigo.test.ts` «un cerrado que casa por cliente no sale entre los activos…»; `busquedaTickets.test.ts` «un cerrado que casa nunca entra en activos…» y «con un texto de dígitos, la rama del número tampoco se escapa…» |
| M4 | quitar `enlazado_a IS NULL AND ` del provisional | **ROJO, 1 fallo:** `busquedaClienteCodigo.test.ts` «un provisional ya enlazado no se encuentra por su razón social vieja» |
| M0 posterior | tras restaurar | 23 de 23 en verde |

Coincide con `apply-progress.md` (M1 en la prueba de posición; M4 en la del provisional enlazado). M2, M3, M5, M6 y M7 no se
reprodujeron; se aceptan como declarados. Las «11 en rojo antes del verde» no son reproducibles a posteriori sin deshacer el
código: **hipótesis**, apoyada en que M7 (quitar la vía del provisional) deja en rojo las pruebas de provisional.

## 4. Líneas de los ficheros existentes (diseño D2)

`wc -l` sin CR, `e99f361` y `6b303b8`: `packages/zoho-sync/src/db/busquedaTickets.ts` 24 y 24;
`packages/shared/src/busquedaTickets.ts` 37 y 37; `apps/desk/src/components/BuscadorTickets.tsx` 27 y 27.
Ninguna cita por línea se desplaza.

## 5. Regla invariable 13 (diseño D4), línea a línea

| Línea citada | Lo que afirma | Lo que dice el código |
|---|---|---|
| `packages/zoho-sync/src/db/busquedaTickets.ts:21-22` | el servidor decide los campos | `:21` es el `serial` con las cinco vías; `:22` el predicado con paréntesis: confirmado |
| `apps/desk/src/components/BuscadorTickets.tsx:12` | el cliente envía el texto tal cual | `useEffect` con `onBuscar(texto)`: sin recortar, sin minúsculas, sin quitar `#`: confirmado |
| `apps/desk/server/util/busquedaTickets.ts:9` | el servidor lee `q` con la pieza compartida | `leerBusquedaTickets(req.query.q)`: confirmado |
| `packages/shared/src/busquedaTickets.ts:33` | tope de 64 tras recortar | `if (texto.length > BUSQUEDA_MAX) return { ok: false, … }`: confirmado |
| `apps/desk/server/util/busquedaTickets.ts:10` | el error es `422` | `res.status(422).json(…)`: confirmado |

El cambio en el cliente (`BuscadorTickets.tsx`, 5 líneas sustituidas) sólo toca comentario, `placeholder`, `aria-label` y el ancho
(`w-56` a `w-72`, `:23`): ninguna decisión nueva. El `maxLength` sigue en `:20` con imposición probada por el `422`.

## 6. El SQL (`packages/zoho-sync/src/db/busquedaTickets.ts:21-22`)

- Las cuatro vías nuevas (código, cuenta de Desk, cliente de Books, provisional) van dentro de `serial`, que entra en el
  paréntesis único de `:22` (con número o sin él): confirmado, y M1 lo prueba por mutación.
- Tres son subconsultas `IN (SELECT …)`; el código es `LOWER(t.codigo_servicio) LIKE`. **Ningún `JOIN`**; el recuento
  `packages/zoho-sync/src/db/repo.ts:173` (sin `JOIN`) usa el mismo fragmento.
- `public.clientes_provisionales` está calificada; `accounts` y `clients` sin esquema, como `repo.ts:146-147` (`search_path`).
- Mismo marcador de parámetro en las cinco vías; `params` no cambia (`:23`). Misma condición `enlazado_a IS NULL` que
  `apps/desk/server/db/clientesProvisionales.ts:53`.

## 7. Los cuatro códigos (árbol commiteado)

| Orden | Código | Detalle |
|---|---|---|
| `npm test` | **0** | 284 ficheros pasan, 3 saltados; 4.787 pruebas pasan, 11 saltadas |
| `npm run typecheck` | **0** | sin errores |
| `npm run lint` | **0** | 165 avisos, 0 errores (tope 165) |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 7.245 comprobadas; 13 abreviadas rotas informativas, ninguna de este cambio |

## 8. Citas comprobadas (más de diez)

Todas dicen lo que la frase afirma: `repo.ts:144` (`COALESCE(a.name, cl.name)`), `repo.ts:173` (recuento sin `JOIN`),
`repo.ts:146-147` (`accounts` y `clients`), `schema.sql:169-173` (vista `public.clients`), `ticketsConCliente.ts:15-24`
(`conProvisionales`), `clientesProvisionales.ts:53` (`enlazado_a IS NULL`), `clientesProvisionales.ts:33-42`
(`searchProvisionales`), `books/repo.ts:117-127` (`searchClients`; `:118` es `like`, `:122` el `LIKE`),
`backfillClientId.ts:47-68` (`normalizarNombreCliente`), `mappers.ts:61-66` (`extractServiceCode`), `routes/prioridad.ts:85`
(Mis tickets), `packages/shared/src/busquedaTickets.ts:15-17` (`patronSerial`), `routes/directory.ts:16` (pasa `search` sin
recortar, vía `buscarClientes` y `searchClients`, `services/clientes.ts:35`).

## Hallazgos

### WARNING

- **W1 · `tasks.md:20-22` (2.2) marcada hecha sin evidencia en `apply-progress.md`.** La tarea exige la medida
  `git diff --shortstat --no-renames` contra `e99f361` más `wc -l` de lo nuevo sin trackear, y el build para medir el bundle
  (diseño D6). `apply-progress.md:1-38` no registra ninguna de las dos cifras (obligación de Gerencia del 2026-09-28,
  `CLAUDE.md`). Comprobación aquí: `git diff --stat e99f361 6b303b8` da 762 inserciones y 18 borrados en 11 ficheros, de los cuales
  536 líneas son artefactos de planificación llegados antes en `2e5839a` y `f73be04` (hipótesis: el código del intento queda muy por
  debajo de 800). No bloquea, pero el registro del intento debe llevar la cifra y el nombre del bundle antes de archivar.

### SUGGESTION

- **S1 · `packages/zoho-sync/src/books/repo.ts:120-122` frente a `packages/zoho-sync/src/db/busquedaTickets.ts:21`.** `searchClients`
  filtra por tipo de contacto cliente y la búsqueda de tickets no: un ticket cuyo `client_id` apunte a un contacto de Books que no
  sea cliente se encuentra por tickets y no por `searchClients`. La confrontación (`busquedaClienteConfrontacion.test.ts`, función
  `sembrar`) siembra sin tipo y no lo ve. La spec dice «criterio de nombre», así que no la contradice, pero la «misma regla» queda
  acotada al nombre: anotarlo en el `archive-report.md`.
- **S2 · `busquedaClienteConfrontacion.test.ts`, prueba «exactamente las tres declaradas».** Calcula la lista desde `CASOS` (el campo
  `casa` está escrito a mano), no desde el veredicto real; el veredicto real se comprueba caso a caso en las siete pruebas
  anteriores, así que el conjunto es consistente. Es una indirección, no un hueco.
- **S3 · M2, M3, M5, M6 y M7 sin reproducir.** Sólo se reprodujeron M0, M1 y M4. Las otras descansan en `apply-progress.md`
  (tabla de mutaciones); la lectura del código no las contradice.

## Estado de las tareas

`tasks.md`: 1.1 a 2.2 marcadas y coherentes con el código (cinco vías en `busquedaTickets.ts:21`; comentarios en sitio en `shared`;
caja en `BuscadorTickets.tsx:6-8,21-23`). 3.1 a 3.3 pendientes del cierre. P-1 y P-2 son tareas de personas fuera del recuento
(regla del ciclo 1); archivar no las da por hechas.
