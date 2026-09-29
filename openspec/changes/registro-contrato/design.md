# Diseño: registro de contrato, prioridad por contrato e informe trimestral

Cambio 3 de 3 de F1B-11 (`cierra: no`). Entrada: `proposal.md` de esta carpeta (S-1 a S-10) y los deltas de
`specs/` (`tickets-core`, `transitions-st`, `remisiones`, `zoho-sync`), escritos en paralelo. Todas las líneas se
leyeron contra el árbol de `77b498c` el 2026-09-28; lo que no se pudo ejecutar va marcado **«hipótesis»**.

## Enfoque técnico

Una tabla nueva `public.contratos` (al final de `schema.sql`) y **un módulo puro nuevo** en `packages/shared`
(`contratos.ts`) que es la única fuente de vigencia, prioridad al nacer, trimestres, estado de subOV, % ejecutado,
regla de ritmo y celda CSV. El servidor la consume en las tres puertas, en el alta y en el informe; el cliente
sólo pinta y exporta (regla 13). Todo el código nuevo vive en **ficheros nuevos**; en los ficheros muy citados
sólo hay ediciones **en sitio** (mismo número de líneas) o **al final**. Ningún fichero muy citado gana líneas a
mitad (§8).

## 1 · Modelo de datos

**Cliente.** `public.clients` es una vista sobre `books.contacts` con `id` = `contact_id text`
(`packages/zoho-sync/src/db/schema.sql:169-173`, `:150`); `tickets.client_id` es `text` (`schema.sql:185`). El
contrato guarda `client_id text`, sin FK (réplica sin garantía de orden, mismo caso que `schema.sql:461-462`).

Al final de `schema.sql` (hoy termina en `:554`), con comentario **sin punto y coma** (`schema.sql:520-521`):

```sql
CREATE TABLE IF NOT EXISTS public.contratos (
  id bigserial PRIMARY KEY,
  client_id text NOT NULL,             -- clients.id (contact_id de Books), sin FK
  lote text NOT NULL,                  -- OV-AAAA-NNN(N)
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  creado_por text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ritmo_avisado_trimestre integer,     -- marca anti-ruido del aviso de ritmo (S-14)
  CONSTRAINT contratos_fin_no_antes_de_inicio CHECK (fecha_fin >= fecha_inicio)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contratos_lote ON public.contratos (lote);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos (client_id);
```

`contratos` se añade al final de la línea `packages/zoho-sync/src/db/migrate.ts:73` (`PUBLIC_TABLES`), en sitio.
Consultas sin calificar, como `ov_asociaciones`. Nunca hay `DELETE` ni `UPDATE` de datos del contrato en este
cambio (S-13); el único `UPDATE` es el de la marca de ritmo.

**Fechas leídas.** node-postgres devuelve un `date` como `Date` y pg-mem como `string`
(`apps/desk/server/db/calendarioCierres.ts:11-16`; para node-postgres es **hipótesis** de segunda mano). Se reusa
`comoDiaCivil` exportándolo **en sitio** (`calendarioCierres.ts:18`, `function` → `export function`).

| Decisión | Alternativa rechazada | Por qué |
|---|---|---|
| Índice único por `lote` | Unicidad sólo en la ruta | Una carrera de dos altas pasaría; el `23505` se traduce a `409` |
| `CHECK (fecha_fin >= fecha_inicio)` además del `422` de la ruta | Sólo la ruta | Defensa en la base. **Hipótesis:** que pg-mem imponga `CHECK`; el RED del lote 1 lo ejecuta en las dos direcciones (regla de mutación 2: quitar el `CHECK` de `schema.sql` debe poner rojo). Si pg-mem no discrimina, se declara y la guarda queda probada sólo en la ruta |
| Marca de ritmo en la fila del contrato | Tabla aparte de avisos enviados | Mismo patrón de marca en la fila que `ov_zoho_avisada` (`schema.sql:525`) |

## 2 · Dominio puro: `packages/shared/src/contratos.ts` (nuevo)

Exportado con una línea **al final** de `packages/shared/src/index.ts` (hoy termina en `:23`).

| Función | Regla |
|---|---|
| `hoyEnZona(ahora = new Date())` | `diaEnZona(ahora)` de `fechasDerivadas.ts:63-73`, zona `America/Bogota` (`ZONA_NEGOCIO`, `fechasDerivadas.ts:13`). **S-11** |
| `fechaCalendario(v)` | `YYYY-MM-DD` de un día real, o `null` (reusa `diaEnZona`, que rechaza `2026-02-30`, `fechasDerivadas.ts:69`) |
| `LOTE_OV` | `/^OV-\d{4}-\d{3,4}$/`, el mismo que `apps/desk/server/routes/ovAsociaciones.ts:21` en `285ecf4`; desde el lote 3 esa ruta y el alta deciden con `esLote` (sobre `clasificarOV`), enfrentado a `LOTE_OV` por prueba |
| `estadoContrato(c, hoy)` | `no_iniciado` si `hoy < inicio`; `vencido` si `fin < hoy`; si no, `vigente` (extremos incluidos, S-4/S-5). Comparación de cadenas `YYYY-MM-DD` |
| `motivoVencido(numero, contrato, hoy)` | Sólo si `clasificarOV(numero)` es `subov` (`subOV.ts:32-36`) y el contrato del lote está `vencido`: texto con lote, contrato y fin |
| `prioridadAlNacer(pedida, conContratoVigente)` | `'High'` si hay contrato vigente; si no, **exactamente** lo de hoy: `pedida ? String(pedida) : null` (`ticketService.ts:106` en `9288779`) |
| `trimestresDelContrato(inicio, fin)` | Trimestre k empieza en `inicio + 3(k-1)` meses, **calculado siempre desde el inicio** y con el día recortado al fin de mes (31-ene → 30-abr → 31-jul); termina el día antes del siguiente o en `fin`. **S-12** |
| `diasEntre(a, b)` | Aritmética `Date.UTC` sobre días civiles, como `calendarioLaboral.ts:10`, `:54-57` |
| `estadoSubOV(ticketStatus \| null)` | `libre` (sin asociación vigente) / `en_curso` / `ejecutada` (`status = 'Finalizado'`, S-6) |
| `porcentaje(n, creadas)` | `Math.round(100·n/creadas)`, 0 si no hay creadas (mismo redondeo que `books/subOV.ts:47`) |
| `ritmoInsuficiente(...)` | S-8 con `transcurridos = diasEntre(inicio, hoy) + 1` y `restantes = diasEntre(hoy, fin)`. **S-19** |
| `celdaCSV(v)` | Antepone `'` si empieza por `=`, `+`, `-`, `@`, TAB o CR; entrecomilla si hay `"`, `,`, CR o LF. **S-17** |

## 3 · Prioridad al nacer

Camino único de alta, verificado: `routes/tickets.ts:125` → `createManagedTicket` (`ticketService.ts:21`) →
`crearTicketConEquipo` (`:103`; `equipoNuevo.ts:80`) → `createTicket` (`equipoNuevo.ts:90`;
`packages/zoho-sync/src/db/repo.ts:412`). No hay otro llamador de `createTicket` fuera de pruebas. Los tickets que
llegan de Zoho no pasan por aquí y conservan la prioridad de Zoho (fuera de alcance).

Edición **en sitio** de `ticketService.ts:106`, sobre el cliente ya resuelto (`:89`):
`ordenVenta, fechaOrdenVenta, priority: prioridadAlNacer(b.prioridad, await hayContratoVigente(db, clientId!)),`.
No es una guarda (no rechaza nada); corre después de todas. `equipoNuevo.ts` no se toca.

## 4 · Guarda de contrato vencido en las tres puertas (escalón C, antes de D)

Ayudantes de servidor en `apps/desk/server/db/contratos.ts` (nuevo): `motivoContratoVencido(db, numero, hoy?)` y
`erroresContratoVencido(db, numeros, hoy?)` leen el contrato del lote y **delegan la decisión** en
`motivoVencido` de `shared` (la vigencia no se reescribe en SQL: se lee la fila y decide TS). **Escalón: C, no B — decidido y justificado el 2026-09-28 (lote 2), a pregunta de la supervisión**, que planteaba B porque «vencido» es un estado. Lo es, pero **del contrato, no del sujeto de la operación**: F1B-10 define B como «estado y permiso **del sujeto** — ¿puede esta operación ocurrir sobre **este sujeto** ahora?» (`openspec/specs/transitions-st/spec.md:835`, estado de origen y área del usuario), y el sujeto es el ticket, que no cambia por el contrato. El contrato llega a la petición **a través de un valor aportado**, la subOV, y C es «¿es válido y coherente lo que la petición aporta como contenido?» (`:836`). El precedente es exacto y ya está decidido: la persona derivada **que existe pero está dada de baja** —también un estado de la entidad referida— es **C** (`:198`, fila 8; `:843-844`). Y el criterio de fondo de F1B-10 (`:846-847`) empuja al mismo sitio: el usuario lo arregla **cambiando el valor** (otra OV), que es lo propio de C. Clasificarlo B obligaría además a evaluarlo antes que los faltantes, el cliente, los obligatorios, la persona y los ítems —es decir, a leer la OV antes de validar el resto— y a reordenar la remisión, contra IV-12 y contra la edición en sitio. Dentro de C va el **último**, tras la cuarentena (excluyentes para un mismo número, `subOV.ts:32-41`); lo fijan las pruebas de posición del lote 2 frente a cada vecina y frente a D.

| Puerta | Edición en sitio | Orden resultante |
|---|---|---|
| Alta, `ticketService.ts:96` | Tras la cuarentena: `const vencido = await motivoContratoVencido(db, ordenVenta); if (vencido) throw new HttpError(422, { error: vencido });` y después el `ticketConOrdenVenta` de hoy | `:88` faltantes, `:90` cliente, `:91` equipo nuevo, `:96` cuarentena → vencido → `409` (D) |
| Transición, `ticketService.ts:143-147` | El comentario de cinco líneas se reescribe en cuatro, y `:147` pasa a `const errVencido = await erroresContratoVencido(db, [plan.columns.orden_venta, plan.ovAdicional]); if (errVencido.length) throw new HttpError(422, { errors: errVencido })` | `:134` obligatorios/fecha/cuarentena → `:138-142` persona → `:147` vencido → `:148-152` D. **No va en `:134`** como decía la propuesta: el delta de `transitions-st` (RQ-TS-06, fila 9) la exige detrás de la persona derivada. **S-22** |
| Remisión, `remision.ts:220` | Tras el `return` del bloque A/C actual: `const vencido = await motivoContratoVencido(db, ov.number); if (vencido) { res.status(422).json({ error: vencido }); return }`; el comentario final pasa al final de la línea | `:220` A y cuarentena → vencido → `:230` D. IV-12 intacto: `:177` (409 pendiente) sigue ganando |

Imports en sitio: `ticketService.ts:6` gana `prioridadAlNacer`; `ticketService.ts:5` y `remision.ts:5` ganan una
segunda sentencia `import … from '../db/contratos'` en la misma línea (precedente: `remision.ts:5`).

**Pruebas de posición (regla de mutación 1).**
- **Vencido + 409 de unicidad**, a la vez, en alta, `habilitar_servicio`, `aprobacion_y_repuestos` y remisión →
  `422` de vencido. Mover la guarda detrás de `ticketConOrdenVenta` debe poner rojo en cada una.
- **Vecinas que ganan al vencido:** faltantes (alta), persona derivada (transición), ítems fuera del checklist y
  remisión pendiente (remisión). Mover el vencido antes de ellas debe poner rojo.
- **Cuarentena + vencido: la mutación de posición es inobservable, y se dice.** Para un mismo número los dos
  estados son excluyentes (`clasificarOV` devuelve un solo tipo, `subOV.ts:32-41`) y ninguna transición trae
  `Orden de Venta` y `OV adicional` a la vez (`transitions.ts:189`, `:199`, `:203`). La prueba que se escribe
  (`OV-2026-170-X9` con contrato vencido en `OV-2026-170` → mensaje de cuarentena) discrimina otra mutación: la
  que sacara el lote por prefijo en vez de por `clasificarOV`.

## 5 · Ticket de contrato (derivado) y rutas

`contratoDelTicket(db, ticketId, hoy)`: asociaciones vigentes del ticket → `clasificarOV` → contrato del lote →
`estadoContrato === 'vigente'`. Se calcula al leer (S-3); no compara clientes (S-9).

Fichero nuevo `apps/desk/server/routes/contratos.ts`, `registerContratosRoutes(app, { db })`:

| Ruta | Quién | Escalera (F1B-10) |
|---|---|---|
| `GET /api/contratos` | sesión (`requireAuth`) | — |
| `POST /api/contratos` | Comercial o admin: `canExecuteTransition(areas, isAdmin, 'Comercial')` (patrón `ovAsociaciones.ts:47`) | B `403` < C `422` (campo ausente, `LOTE_OV`, `fechaCalendario`, fin < inicio, `getClient` nulo) < D `409` (lote registrado; también el `23505` de la carrera) |
| `GET /api/contratos/:id` | sesión | A `404` (id no numérico o inexistente, patrón `ovAsociaciones.ts:44`). Devuelve contrato, estado y `saldoPorLote` |
| `GET /api/contratos/:id/informe` | sesión | A `404` |
| `GET /api/tickets/:id/contrato` | sesión | `{ deContrato, contrato?, subOV? }` |

Lecturas abiertas a sesión por el delta (`tickets-core` RQ-TC-21, `zoho-sync` RQ-ZS-15). **S-16**.

**Registro en `app.ts` sin desplazar nada:** el import se añade al final de la línea `apps/desk/server/app.ts:22`
y la llamada al final de la línea `:61` (`registerOvAsociacionesRoutes(app, { db }); registerContratosRoutes(app,
{ db })`). Mejor que el precedente de «línea nueva tras `:61`»: cero líneas movidas.

## 6 · Informe trimestral

`apps/desk/server/db/informeContrato.ts` (nuevo), `informeContrato(db, contrato, hoy)`:

1. **Creadas:** `creadasDelLote(db, lote)`, función nueva **al final** de `packages/zoho-sync/src/books/subOV.ts`
   (tras `:49`), con el mismo `ESTADOS_FUERA_DEL_SALDO` (`:18`) y `clasificarOV`. `saldoPorLote` (`:34-49`) **no
   se toca** (el delta `zoho-sync` lo prohíbe); una prueba **enfrenta** `creadasDelLote(l).length` con
   `saldoPorLote(l).creadas` sobre un lote con cuarentena, `draft` y `void` (el molde de H5). **S-20**.
2. **Asociaciones vigentes** (`ov_asociaciones WHERE liberada_at IS NULL`), casadas por número o id como
   `subOV.ts:41-44`.
3. **Tickets:** `SELECT id, number, status, equipo, serial, tipo_servicio, fecha_revision_informe FROM tickets
   WHERE id IN (SELECT ticket_id FROM ov_asociaciones WHERE liberada_at IS NULL)` (subconsulta no correlacionada,
   la misma forma que ya usa la tercera vía).
4. **Fecha de ejecución:** filas de `ticket_transitions` con `to_status = 'Finalizado'` para esos tickets
   (`schema.sql:57-60`; se escriben en `repo.ts:315-317`); la primera, reducida a día con `diaEnZona`. Sin fila
   → ejecutada sin fecha (delta `zoho-sync`, fuera de los acumulados). Agregación en TS, no `GROUP BY`. **S-15**.
5. **Trimestres** iniciados hasta hoy (o todos si venció): % acumulado al cierre, servicios del trimestre (equipo,
   serial, tipo, fecha, `informe: 'No disponible en los datos'`), libres hoy y `diasEntre(hoy, fin)` (negativo si
   venció).

Forma: `{ contrato, estado, hoy, creadas, ejecutadas, enCurso, libres, porcentajeEjecutado, consumido, subOV[],
trimestres[], sinFecha[], huecos[] }`; los tipos viven en `shared/contratos.ts`.

**CSV:** lo arma el cliente, patrón de `RemisionesPage.tsx:107-115` (BOM, `text/csv;charset=utf-8;`), una fila por
trimestre y por servicio. La celda usa `celdaCSV` de `shared`; `RemisionesPage.tsx:85-88` pasa a consumirla **en
sitio** (tres líneas de comentario y `const csvCampo = celdaCSV`), para que las dos exportaciones no diverjan.

## 7 · Aviso de ritmo

**Periódico, sin cron nuevo.** Evaluarlo al leer el informe no avisa a nadie si nadie lo abre, que es justo el caso
que el aviso cubre. Se engancha a la pasada existente de `apps/desk/server/index.ts:85-93`, **en sitio** en `:88`:
`let p: Promise<unknown> = pasadaRitmoContratos(pool).then(() => sync.syncRecent())` (import al final de `:15`).
Va **antes** de la sincronización para no depender de que ésta tenga éxito, y nunca lanza. **DEPENDENCIA declarada (2026-09-28):** no depende del éxito de la sincronización, pero **sí de que exista su pasada**: el único `setInterval` del proceso es el de la sincronización con Zoho (`index.ts:85-93`, incondicional, cada `syncIntervalMs`, `packages/zoho-sync/src/config.ts:88`). Hoy corre siempre; con la independencia de Zoho (enero de 2027) esa pasada se retira, y si se retira sin más el aviso de ritmo **deja de evaluarse en silencio** —nada falla ni se pone rojo—. Quien retire la sincronización tiene que darle al aviso otra pasada periódica: registrado en `docs/sdd/ENTRADA.md` (E-087), sin destino.

`apps/desk/server/services/avisoRitmoContrato.ts` (nuevo), patrón de `avisoDiscrepanciaOV.ts:24-46`:
- `pasadaRitmoContratos(db)`: como mucho una evaluación por día civil y proceso (variable de módulo).
- `avisarRitmoContratos(db, hoy)`: para cada contrato `vigente` en su trimestre `n ≥ 2` con
  `COALESCE(ritmo_avisado_trimestre, 0) < n` y `creadas > 0`: si `ritmoInsuficiente`, en **una transacción**
  `UPDATE contratos SET ritmo_avisado_trimestre = $2 WHERE id = $1 AND COALESCE(ritmo_avisado_trimestre,0) < $2
  RETURNING id` y, sólo si devolvió fila, `crearAviso` (`db/avisos.ts:8`, `ticket_id` NULL, `schema.sql:134`) para
  cada `destinatariosDeArea(q, 'Comercial', '')` (`db/avisos.ts:74`). Un fallo revierte la marca. **S-14**.
- `db/avisos.ts` no se toca.

## 8 · Plan de desfase de citas (regla de mutación 4)

Recuento de **líneas con cita** fuera de `openspec/changes/archive/`, medido hoy con Grep en modo recuento
(equivalente a `git grep -cE "<fichero>:[0-9]+"`). **Ninguna inserción a mitad de fichero.**

| Fichero | Citas | Ediciones | Tipo | Citas tras el punto de inserción | Citas a releer (contenido cambia, número no) |
|---|---|---|---|---|---|
| `apps/desk/server/services/ticketService.ts` | 151 | `:5`, `:6`, `:96`, `:106`, `:143-147` | EN SITIO | 0 | `:96` (`tickets-core` :306, :647; `config.yaml:1132`; `ordenVentaUnTicket.test.ts:19`); `:106` (proposal :26). `:143-147`: ninguna viva (las `:145` de `transitions-st` :32, :351, :1052 ya estaban caducas) |
| `apps/desk/server/routes/remision.ts` | 114 | `:5`, `:220` | EN SITIO | 0 | `:220` (`CLAUDE.md:349` ×2, `transitions-st` :914, `config.yaml:1204`, `remisiones.test.ts:1246`): sigue diciendo «Orden de venta no encontrada» |
| `packages/zoho-sync/src/db/schema.sql` | 115 | tabla e índices | AL FINAL (tras `:554`) | 0 | 0 |
| `packages/zoho-sync/src/db/migrate.ts` | 41 | `:73` | EN SITIO | 0 | `tickets-core` :794 (`:70-73`), sigue cierto |
| `apps/desk/server/app.ts` | 12 | `:22`, `:61` | EN SITIO | 0 | 0: todas ancladas en `1d030d5` o históricas anteriores al reparto de `app.ts` |
| `apps/desk/server/index.ts` | 10 | `:15`, `:88` | EN SITIO | 0 | `:85` (`zoho-sync` :48, :177; proposal :118) sigue siendo el `setInterval` |
| `packages/zoho-sync/src/books/subOV.ts` | 6 (mezcladas con `shared/src/subOV.ts`) | `creadasDelLote` | AL FINAL (tras `:49`) | 0 | 0 |
| `apps/desk/server/routes/ovAsociaciones.ts` | 6 | `:5`, `:21` | EN SITIO | 0 | `:21` (delta `tickets-core` :86): mismo formato, ahora importado |
| `apps/desk/server/db/calendarioCierres.ts` | — | `:18` | EN SITIO | 0 | 0 |
| `packages/shared/src/index.ts` | — | una línea | AL FINAL (tras `:23`) | 0 | 0 |
| `apps/desk/src/components/TicketDetailView.tsx` | 9 | `:15`, `:320` | EN SITIO | 0 | 0 (citan `:245`, `:208`, `:37`) |
| `apps/desk/src/components/Configuracion.tsx` | 6 | `:2`, `:33`, `:127`, `:165` | EN SITIO | 0 | 0 (citan `:118`, `:24`, `:25`) |
| `apps/desk/src/components/RemisionesPage.tsx` | 3 | `:2`, `:85-88` | EN SITIO | 0 | 0 (citan `:107`, `:119`, `:132`) |
| `apps/desk/src/api/client.ts` | — | funciones nuevas | AL FINAL | 0 | 0 |
| `db/repo.ts` (42), `transitions.ts`, `books/repo.ts`, `equipoNuevo.ts`, `db/avisos.ts` | — | **ninguna** | — | — | — |
| `openspec/config.yaml`, `CLAUDE.md` | — | **ninguna** (S-10, S-21) | — | — | — |

Reglas para `apply`: ningún import en línea nueva de cabecera en estos ficheros; toda edición conserva el número de
líneas y se comprueba con `git diff --stat` (una edición en sitio es `+n −n`). El cierre barre las citas de la
última columna.

## 9 · Regla 13, decisión a decisión (interfaz, `.tsx` fuera de la red por F0-00)

Pantallas: `ContratosPanel.tsx` (Configuración → «Contratos»: lista y alta), `ContratoFicha.tsx` (datos, saldo,
informe y botón CSV), `MarcaContrato.tsx` (en la ficha del ticket). Montaje en sitio: `Configuracion.tsx:2`
(import), `:33` (unión gana `'contratos'`), `:127` (segunda entrada del menú en la misma línea), `:165` (segunda
sentencia); `TicketDetailView.tsx:15` (import), `:320` (segundo componente en la misma línea).

| Decisión del cliente | Quién la impone en el servidor |
|---|---|
| Botón «Nuevo contrato» sólo para Comercial/admin | `POST /api/contratos`, `403` con `canExecuteTransition` (consumido) |
| Formato de lote, fechas reales, fin ≥ inicio | Misma ruta, `422` con `LOTE_OV`/`fechaCalendario` de `shared`; `CHECK` en la base |
| Un contrato por lote | `409` de la ruta e índice único |
| Marca «de contrato» en el ticket | `GET /api/tickets/:id/contrato` (`contratoDelTicket`) |
| Cifras, estados y trimestres del informe | `GET /api/contratos/:id/informe`; el cliente no calcula nada |
| Prioridad `High` | `ticketService.ts:106`; el formulario de alta no cambia |
| Neutralizar fórmulas en el CSV | **Ninguna, a propósito**: el fichero lo genera el navegador; la regla vive en `shared` y se prueba en node |

## 10 · Lotes de `apply` (≤ 800 líneas reales cada uno)

Medida: `git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin trackear; una edición en sitio cuenta 2. El
cambio 2 estimó ~3.430 y midió 508/635/321/510/494/505: estas cifras siguen su proporción.

| Lote | Contenido | Código | Pruebas | Artefactos | Total | Depende | Rollback |
|---|---|---|---|---|---|---|---|
| 1 · Modelo y vigencia | `schema.sql`, `migrate.ts:73`, `calendarioCierres.ts:18`, `shared/contratos.ts` (vigencia, fechas, lote, `motivoVencido`, `prioridadAlNacer`, tipos), `index.ts`, `db/contratos.ts` (alta, lista, lectura, por lote, por cliente); RED pg-mem de índice y `CHECK` (mutación 2) | ~210 | ~320 | ~60 | ~590 | — | Revertir; la tabla vacía puede quedarse |
| 2 · Prioridad y guarda | `ticketService.ts` `:5`/`:6`/`:96`/`:106`/`:143-147`, `remision.ts:5`/`:220`, ayudantes de vencido; pruebas de prioridad y de las tres puertas con posición | ~60 | ~420 | ~60 | ~540 | 1 | Revertir: puertas y prioridad vuelven a hoy |
| 3 · API y ticket de contrato | `routes/contratos.ts` (lista, alta, ficha, marca del ticket), `contratoDelTicket`, `app.ts:22`/`:61`, `ovAsociaciones.ts:5`/`:21`; pruebas de rutas, escalera y amenazas | ~150 | ~330 | ~60 | ~540 | 1 | Revertir |
| 4 · Informe trimestral | trimestres, días, estados y % en `shared`; `creadasDelLote` al final de `books/subOV.ts`; `db/informeContrato.ts`; ruta del informe; pruebas (10/3/2 → 30 % y 50 %, acumulado, sin fecha, exclusiones, enfrentamiento con `saldoPorLote`) | ~200 | ~370 | ~60 | ~630 | 1, 3 | Revertir |
| 5 · Ritmo y CSV | `ritmoInsuficiente`, `celdaCSV`, `avisoRitmoContrato.ts`, `index.ts:15`/`:88`, `RemisionesPage.tsx:2`/`:85-88`; pruebas de ritmo, CSV (=, +, -, @, TAB, CR, comillas) y aviso (una vez por trimestre, trimestre 1 no, fallo sin lanzar) | ~125 | ~270 | ~60 | ~455 | 4 | Revertir; la columna de marca queda sin uso |
| 6 · Interfaz y cierre | `client.ts` (al final), tres `.tsx` nuevos, montajes en sitio; texto para el expediente R08.3 **al final** de `docs/sdd/R08.3_Expediente_de_cambios.md`; barrido de citas | ~480 | 0 | ~90 | ~570 | 3-5 | Revertir |

**Total ≈ 3.300** (la propuesta decía 2.300-2.700 en cuatro lotes: cuatro no caben bajo 800 con pruebas y
`apply-progress`). Una tanda por árbol (regla del ciclo 2): los lotes van en serie. Verify y archive, aparte.

## Estrategia de pruebas (strict_tdd)

| Capa | Qué | Cómo |
|---|---|---|
| Dominio | Vigencia en los extremos, trimestres (ejemplo del delta y recorte a fin de mes), días, %, ritmo, CSV | Tablas de casos en `shared`, con `hoy` inyectado |
| Datos | Índice único, `CHECK`, ida y vuelta de `date` | pg-mem; mutación 2 sobre `schema.sql` |
| Servicio | Prioridad, vencido en tres puertas, posiciones | pg-mem + `appHarness`, fixtures relativos a `hoyEnZona()`; mutación 1 |
| Rutas | 401/403/422/409/404, escalera, lecturas abiertas | `appHarness` |
| Aviso | Idempotencia por contrato y trimestre, rollback | pg-mem |

## Matriz de amenazas

Matriz de la skill (documentación ejecutable, selección de repositorio, commit, push, PR): **N/A** en todas sus
filas, porque no hay shell, subprocesos ni automatización de VCS. El cambio sí abre rutas HTTP; su matriz propia:

| Amenaza | Respuesta | RED |
|---|---|---|
| Rutas nuevas sin sesión | `requireAuth` en las cinco | `401` en cada una |
| Alta sin Comercial | `403` antes de validar contenido | `403` con cuerpo inválido; admin sin área pasa |
| Fechas malformadas o irreales, fin < inicio | `fechaCalendario` + `422`; `CHECK` | `2026-02-30`, `31/12/2026`, vacío, fin < inicio |
| Lote malformado o con forma de subOV; texto hostil | `LOTE_OV` + `422`; SQL siempre parametrizado | `OV-2026-170-01`, `OV-2026-170'; DROP TABLE contratos` → `422` |
| Cliente inexistente | `getClient` + `422` | id inventado |
| Carrera de dos altas del mismo lote | índice único; `23505` → `409` | inserción directa y luego la ruta |
| `:id` no numérico | `404` antes de consultar | `abc` |
| Inyección de fórmulas en el CSV | `celdaCSV` | celdas que empiezan por `=`, `+`, `-`, `@`, TAB, CR |
| Un fallo del aviso tumba la sincronización | nunca lanza; transacción | fallo forzado de `crearAviso` → marca revertida y sin excepción |
| Lectura de contratos por cualquier sesión | decisión del delta (S-16), no defecto | `200` con usuario sin Comercial |

## Migración / despliegue

`CREATE … IF NOT EXISTS`: la tabla nace vacía; sin filas, prioridad, puertas e informe se comportan como hoy. Sin
flag nuevo (no enciende ningún escritor externo). Alta de contratos vigentes: tarea de persona P.7.

## Supuestos nuevos (reversibles, modo `auto`)

- **S-11** «Hoy» = día civil en `America/Bogota` (`ZONA_NEGOCIO`), nunca la zona del proceso.
- **S-12** Trimestre k = `inicio + 3(k-1)` meses, desde el inicio y con recorte a fin de mes; el último acaba en `fin`.
- **S-13** Este cambio sólo crea contratos: sin edición ni baja (el delta excluye editar fechas y la ampliación es
  E-086). Corregir un contrato mal dado de alta queda a cargo de una persona hasta un cambio posterior.
- **S-14** Aviso de ritmo en la pasada periódica existente, una vez por día y proceso; anti-ruido en
  `contratos.ritmo_avisado_trimestre`.
- **S-15** Fecha de ejecución = primera llegada a `Finalizado` en `ticket_transitions`, en día de negocio.
- **S-16** Lecturas abiertas a cualquier sesión; escritura, Comercial o administración.
- **S-17** `celdaCSV` en `shared` amplía la regla de `RemisionesPage.tsx:86` con TAB y CR, y las dos pantallas la consumen.
- **S-18** `comoDiaCivil` se exporta en sitio desde `calendarioCierres.ts:18` y se reusa.
- **S-19** Ritmo: días transcurridos incluyen el de inicio; sólo contratos vigentes, desde el trimestre 2, con creadas > 0.
- **S-20** `creadasDelLote` nueva al final de `books/subOV.ts`; `saldoPorLote` intacto y enfrentado por prueba.
- **S-21** `CLAUDE.md` y `config.yaml` no se tocan (extensión de S-10): la consecuencia sobre IV-12 queda fijada
  en el delta de `remisiones`.
- **S-22** La guarda de la transición va en `ticketService.ts:147` (reescritura en sitio de `:143-147`), no en `:134`.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| pg-mem no impone `CHECK` (hipótesis) | RED en las dos direcciones en el lote 1; si no discrimina, se declara y la guarda queda en la ruta |
| La pasada periódica no corre en producción | **Hipótesis:** `index.ts:85` registra el `setInterval` siempre; P.6 lo comprueba en la app |
| Coste de la evaluación de ritmo | Una vez por día y proceso; **hipótesis:** decenas de contratos |
| Una remisión pendiente gana al vencido (`:177` antes de `:220`) | Declarado en el delta de `remisiones`; IV-12 no se reordena |
| Un técnico baja la prioridad después (`transitions.ts:193`, `:195`) | F1B-07 |
| El delta `tickets-core` dice «crear y editar» y este diseño sólo crea (S-13) | Lo alinea `sdd-tasks` o el verify; es un supuesto reversible |
| Un ticket `Finalizado` sin fila de transición (Zoho) | Ejecutada sin fecha, visible aparte en el informe |

## Preguntas abiertas

Ninguna bloquea. S-11 a S-22 son supuestos reversibles.
