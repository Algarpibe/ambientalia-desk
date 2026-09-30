# Diseño: alarmas de SLA en horas hábiles

F1B-08, `cierra: no`. Entrada: `proposal.md` (S-1..S-12), S-13 de la instrucción de la fase, la corrección del
orquestador a S-4 (prevalece sobre la propuesta; S-4 y S-13 revisados otra vez el 2026-09-29: D-5 y D-6) y los tres deltas de `specs/`. Líneas leídas contra el árbol de
`4796aad` el 2026-09-29; lo no ejecutado va marcado **«hipótesis»**. No se ha corrido la suite.

## Enfoque técnico

La regla es pura y vive en `packages/shared/src/sla.ts`: umbral hábil (`SLA_HORAS_POR_ESTADO`) y qué hacer al
vencer (`ALARMAS_SLA`: cargo, condición de orden de venta, marca de tablero). El servidor mide la entrada al estado,
decide, marca y avisa en una pasada encadenada en `apps/desk/server/index.ts:88`. El tablero recibe un booleano
calculado por el servidor y `TicketCard.tsx` sólo lo pinta (regla 13). En los ficheros muy citados sólo hay
ediciones **en sitio** o **al final** (§9).

## Decisiones

**D-1 · Dominio en `shared`.**

| Pieza | Decisión | Rechazado | Por qué |
|---|---|---|---|
| `SLA_HORAS_POR_ESTADO` (`sla.ts:32-35`) | Se queda, en sitio, con `{ 'Notificado': 9, 'Remisión creada': 27, 'Notificación cliente': 36 }` en horas **hábiles** (4 líneas → 4) | Renombrar o fundir en una tabla nueva | 21 citas `sla.ts:32` fuera del archivo (4 en `openspec/config.yaml`, 2 specs, `bodegaje.ts:27`) la nombran como «la declaración del SLA»; siguen apuntando a ella |
| `ALARMAS_SLA` (nuevo, al final de `sla.ts`) | `Partial<Record<Estado, { cargo; areaRespaldo; soloSinOrdenVenta; marcaTablero }>>`, las tres con `cargo: 'Coordinador Comercial'` y `areaRespaldo: 'Comercial'` (tipo `(typeof AREAS)[number]`, `transitions.ts:310`); sólo `Remisión creada` con `soloSinOrdenVenta` y sólo `Notificación cliente` con `marcaTablero` | Derivar el cargo del grafo; área de respaldo como constante del servicio | S-8 y RQ-TS-16 del delta: cargo y respaldo son dato, y el invariante los prueba en `shared` |
| `venceSlaEn` (`sla.ts:39-44`) | **Se retira.** Sus 6 líneas pasan a un comentario de retirada de 6 líneas | Reescribirla con `sumarHorasHabiles` | Nadie necesita la fecha de vencimiento (D-2); dejarla daría una fecha de reloj falsa |
| `slaVencido` (`sla.ts:52-55`) | Firma `(estado, desde, ahora, cierres)`; cuerpo `Math.round(horasHabilesEntre(desde, ahora, cierres) * HORA_EN_MS) > horas * HORA_EN_MS`. `HORA_EN_MS` (`:37`) se reutiliza | Comparar el `number` de horas tal cual | Estricta como hoy; el redondeo a milisegundo quita el error de coma flotante de sumar tramos fraccionarios (`calendarioLaboral.ts:185`) en el borde exacto |
| `destinatarioDelEscalado` (`sla.ts:88-109`) | **Se conserva sin tocar**, degradada a comprobación de coherencia | Retirarla | Mantiene vivos los guardianes de ambigüedad de `sla.test.ts:165-209`, y convierte S-3 en hecho probado |
| Importación | `horasHabilesEntre` y `DiaCivil` se añaden **en la línea 2** tras `;` (precedente `index.ts:15`) | Línea nueva | Desplazaría las 87 citas `sla.ts:NN` (los dos homónimos) |

Rojos deliberados en `packages/shared/src/sla.test.ts`, los cuatro reescritos **en sitio**: `:33` (la tabla),
`:51-55` (exclusión → independencia: al menos un estado con alarma fuera de `ESTADOS_EN_ESPERA` y al menos uno de
`ESTADOS_EN_ESPERA` sin alarma), `:57-81` (reloj → borde hábil) y `:188-191` (todo estado con alarma tiene cargo
no vacío y, si el grafo propone cargo, coincide con el declarado). `:2` cambia la importación. El resto de
escenarios de RQ-TS-15 y los invariantes de `ALARMAS_SLA` (mismas claves que `SLA_HORAS_POR_ESTADO`; cargo vacío
en una tabla sintética detectado por `estadosConAlarmaSinCargo`; `areaRespaldo` dentro de `AREAS`) van **al final** del fichero.

**D-2 · `sumarHorasHabiles` no se construye.** Vencer es «horas hábiles transcurridas > umbral», y eso ya lo
da `horasHabilesEntre` (`calendarioLaboral.ts:174-190`). Ni el aviso ni el tablero enseñan una hora de
vencimiento. Si una tanda futura la pide, va en `calendarioLaboral.ts` (`decision/calendario-habil`).

**D-3 · Consulta de candidatos: `ticketsConSlaVencido` se reescribe sin N+1.**
`apps/desk/server/db/sla.ts` conserva `export async function ticketsConSlaVencido(` en la **línea 40** (citada por
dos specs vivas) y queda en ≥64 líneas sin vacías en las líneas citadas (`:2`, `:28`, `:48`, `:49`, `:58`).
Nueva firma `(db, ahora, cierres)`; devuelve `{ id, number, estado, desde, horas, alarma }`. Consultas fijas:

1. `tickets` con `status IN (…)` de `ALARMAS_SLA` (marcadores generados, como hoy `:44-45`), con `orden_venta` y
   `salesorder_id`.
2. `ticket_transitions WHERE to_status IN (…) AND ticket_id IN (SELECT id FROM tickets WHERE status IN (…))`; la
   última entrada al estado **actual** se elige en TS por `(performed_at, id)` máximos (agregación en TS como
   `informeContrato.ts:14`, `:34`). Helper `entradasActuales`, al final del fichero, reutilizado por D-8.
3. Sólo si hay candidatos de `Remisión creada`: `ov_asociaciones WHERE liberada_at IS NULL AND ticket_id IN (…)`.

**El filtro de flujo `:49` SE CONSERVA (S-9 revisado por el orquestador tras este diseño: quitarlo chocaba con
RQ-EN-06 vivo).** `apps/desk/server/db/sla.test.ts:141-145` sigue verde, sin invertir. La prueba de `:118-133` (una sola consulta al
historial) sigue verde y ahora vigila el N+1.

**«Sin orden de venta» — no hay predicado reutilizable.** `ticketConOrdenVenta`
(`packages/zoho-sync/src/db/repo.ts:362-379`) contesta la pregunta inversa —«dada una OV, qué ticket la usa»— y
necesita el número o el id; no existe ninguna función «¿este ticket tiene OV?» (búsqueda de `ov_asociaciones`,
`orden_venta`, `salesorder_id` en `*.ts`). Se escribe `tieneOrdenVenta(fila, asociacionVigente)` en `db/sla.ts`
con **la misma definición de tres vías**: `COALESCE(orden_venta,'') <> ''` (`repo.ts:370`), `salesorder_id` no
nulo ni vacío (`:369`) y asociación con `liberada_at IS NULL` (`:371`). Es el molde de H5, así que lleva **una
prueba que las enfrenta**: para cada vía, y para una asociación liberada, `ticketConOrdenVenta` encuentra el
ticket ⇔ `tieneOrdenVenta` dice que tiene OV. Esto **choca con la letra de RQ-TS-19** («SHALL reutilizar
`ticketConOrdenVenta`»), que no es implementable: ver riesgos.

**D-4 · `public.alarmas_avisadas`.** Al final de `packages/zoho-sync/src/db/schema.sql` (hoy termina en `:576`),
comentario sin el carácter punto y coma (`migrate.ts:20` trocea por él):

```sql
-- alarmas-horas-habiles (F1B-08): marca anti-duplicado de las alarmas de SLA vencido. Una fila por
-- (ticket, estado, instante de entrada): reentrar es otra entrada y otra alarma. Se escribe SIEMPRE
-- que la alarma vence, haya o no destinatarios (avisos_creados puede ser 0). Sin FK a tickets, mismo
-- caso que public.ov_asociaciones. Nunca hay UPDATE ni DELETE
-- AL FINAL del fichero para no desplazar citas (regla de mutacion 4)
CREATE TABLE IF NOT EXISTS public.alarmas_avisadas (
  ticket_id text NOT NULL,
  estado text NOT NULL,
  entrada_at timestamptz NOT NULL,
  avisada_at timestamptz NOT NULL DEFAULT now(),
  avisos_creados integer NOT NULL,
  PRIMARY KEY (ticket_id, estado, entrada_at)
);
-- alarmas-horas-habiles (F1B-08, S-13 revisado): corte de la primera pasada. Una sola fila (id = 1),
-- escrita UNA vez con ON CONFLICT DO NOTHING: lo vencido antes del corte se marca sin avisar, y un
-- reinicio no lo mueve. Nunca hay UPDATE ni DELETE
CREATE TABLE IF NOT EXISTS public.alarmas_corte (
  id integer PRIMARY KEY,
  corte_at timestamptz NOT NULL
);
```

`alarmas_avisadas` y `alarmas_corte` se añaden al final de `migrate.ts:73` (`PUBLIC_TABLES`), en sitio. Cambian, en sitio,
`migrate.test.ts:282` (título: 35 tablas, 22 de la app), `:283` (`[10, 22, 3]`) y `:284-286` (`33` → `35`). Los
recuentos de `ALTER` (`:376-378`, 40/19/21) **no** cambian: no hay `ALTER`. `entrada_at` se escribe con el `Date`
leído en D-3 y se compara **en TS por `getTime()`**, nunca en SQL contra `performed_at`: **hipótesis** de que
`performed_at` guarda microsegundos y el `Date` de JS los trunca, así que una igualdad en SQL fallaría.

**D-5 · `destinatariosDeCargo(db, cargo)`**, al final de `apps/desk/server/db/avisos.ts` (hoy `:93`):
`SELECT id, email, name FROM users WHERE active = true AND lower(trim(cargo)) = lower(trim($1))`. Sin
administradores de oficio (a diferencia de `destinatariosDeArea`, `avisos.ts:74-93`): RQ-AV-15 pide
exactamente los usuarios con el cargo. **Hipótesis:** que pg-mem resuelva `lower(trim(...))`; si no, el filtro
se hace en TS. **Nadie con el cargo (S-4, segunda revisión 2026-09-29):** `users.cargo` es texto libre de firma de
la remisión (`auth/routes.ts:67-68`), así que vacío es un caso esperable y no puede dejar la entrada muda. El
servicio resuelve `destinatariosDeArea(db, alarma.areaRespaldo, '')` (sin actor; incluye administradores de
oficio, `avisos.ts:74-93`), marca con `avisos_creados` = los del área y emite **un**
`logger.warn({ cargo, estado, ticketId }, 'Alarma de SLA sin Coordinador Comercial: aviso al área Comercial')`
(el texto se arma con el cargo y el área de la alarma) sólo cuando la marca devolvió fila. Si el área tampoco da
nadie: marca con `avisos_creados = 0` y el mismo `warn`. Con alguien en el cargo, el área no se consulta.

**D-6 · Transacción, correo y tolerancia.** Nuevo `apps/desk/server/services/alarmasSla.ts`, molde de
`avisoRitmoContrato.ts:25-75`:

- `marcarYAvisarAlarma(db, v, destinatarios, texto)` dentro de `enTransaccion` (`db/transaccion.ts:13`). **Corregido
  el 2026-09-29, antes del lote 3:** la PRIMERA sentencia es el `INSERT` de la marca SIN `ON CONFLICT`, con
  `avisos_creados = destinatarios.length`; si entra, `crearAviso` por destinatario en la misma transacción; si lanza
  `23505` (la clave ya existe), la transacción se revierte y el caso es «ya avisado»: `null`, sin avisos y sin
  error hacia fuera. La unicidad la garantiza la PK. Se descartan las dos formas anteriores: `ON CONFLICT … DO
  NOTHING RETURNING` porque pg-mem y Postgres difieren (H1, comprobado en el lote 2), y el `SELECT` previo porque
  deja una ventana (dos evaluaciones leen «sin marca» y avisan las dos). pg-mem también devuelve `23505`.
- `avisarAlarmasVencidas(db, config, ahora)`: el corte (S-13) → `ticketsConSlaVencido(db, ahora, corte)`, que lee
  los cierres (lote 2) → marcas existentes en una consulta (prefiltro) → por vencido nuevo, `try/catch` propio
  (RQ-AV-17). Destinatarios resueltos antes de la transacción, memorizados por alarma dentro de la pasada.
- Correo **después** de todas las transacciones, en un solo lote: `dispararAvisos` (`avisosWebhook.ts:53`, nunca
  lanza) y `marcarEnviados` si `disparado`, envuelto en `try/catch`; si no, `logger.warn` y `enviado_at` queda
  `NULL` (molde `ticketService.ts:215-219`). `conCopia: true` (la copia es un correo, no una fila).
- `pasadaAlarmas(db, config, ahora = new Date())` **nunca lanza**. Sin memoria por día: las alarmas son horarias.
- **S-13 (revisado 2026-09-29): corte persistente, sin ráfaga.** Al empezar cada pasada:
  `INSERT INTO public.alarmas_corte (id, corte_at) VALUES (1, $ahora) ON CONFLICT (id) DO NOTHING` y
  `SELECT corte_at`: la primera pasada fija el corte y ningún reinicio lo mueve (un corte por arranque callaría lo
  vencido durante cada redespliegue). Por vencido nuevo, si `slaVencido(estado, desde, corte, cierres)` —ya estaba
  vencido en el corte— se marca con `avisos_creados = 0`, sin resolver destinatarios, sin aviso ni `warn`; la marca
  de tablero sale porque D-8 lee la marca. Una sola `logger.info` por pasada con el recuento de marcados en
  silencio, si hay alguno. Sin interruptor (S-13 de la propuesta): encender la ráfaga es P.3.
- Texto: `El ticket #N lleva más de H horas hábiles en «Estado» (entró el <fecha en ZONA_NEGOCIO>).`, más «y sigue
  sin orden de venta» o «esperando aprobación del cliente» según la alarma.

**D-7 · Cableado, en sitio.** `index.ts:15`: se añade `; import { pasadaAlarmas } from './services/alarmasSla'`.
`index.ts:88` pasa a
`let p: Promise<unknown> = pasadaAlarmas(pool, config).then(() => pasadaRitmoContratos(pool).then(() => sync.syncRecent()))`.
El anidamiento no es estético: el guardián vigente `avisoRitmoContrato.test.ts:194` exige la subcadena
`pasadaRitmoContratos(pool).then(() => sync.syncRecent())`, y la forma plana `….then(() => pasadaRitmoContratos(pool)).then(…)`
la rompe. Orden: alarmas → ritmo → sincronización, dentro del mismo guardia `syncing` (`:86-87`), así que no se
solapan. Alarmas antes de la sincronización porque un Zoho lento no debe retrasarlas y los tickets medibles
son los que movió la app. **Dependencia E-087:** mismo `setInterval`; adenda en el `archive-report`.

**D-8 · Marca de tablero (RQ-VT-07).** Campo `esperandoAprobacionCliente?: boolean` en `Ticket`, añadido **en la
misma línea** `packages/shared/src/types.ts:37` (`read?: boolean; esperandoAprobacionCliente?: boolean`).
Se lee **por marca, no por cálculo**, como fija RQ-VT-07: `ticketsEsperandoAprobacionCliente(db)` (en el nuevo
`apps/desk/server/db/alarmasAvisadas.ts`) cruza `entradasActuales` de los estados con `marcaTablero` con sus
marcas, por `getTime()`; nunca lanza (ante error, `logger.warn` y conjunto vacío: la marca no puede tumbar el
tablero). `routes/tickets.ts:9` gana la importación tras `;`; `:115` pasa a una sola línea que añade
`esperandoAprobacionCliente: marcados.has(row.id)` a `rowToTicket`. El listado de cerrados (`:110`) no lo lleva.
`TicketCard.tsx`: bloque nuevo **tras `:96`** que pinta «Esperando aprobación del cliente» sólo si el campo es
`true`. Regla 13, decisión a decisión: el cliente no bloquea, no rellena ni calcula nada; el vencimiento y el
destinatario los decide `db/sla.ts` y la marca `db/alarmasAvisadas.ts`.

## 9 · Puntos de inserción medidos (hoy, `4796aad`)

Líneas por `Grep` de `^`; citas por `Grep -o "<patrón>:[0-9]+"` sobre todo el repositorio (archivo incluido).
Patrones cortos (`sla.ts`, `index.ts`, `avisos.ts`) mezclan homónimos: se dan tal cual.

| Fichero | Líneas | Citas | Edición | Desplaza |
|---|---|---|---|---|
| `packages/shared/src/sla.ts` | 109 | 87 (`sla\.ts`, ambos), 28 con `shared/src/` | En sitio `:2`, `:4-31`, `:32-35`, `:39-44`, `:46-55`, comentarios `:68-70`; `ALARMAS_SLA` al final | −0 |
| `packages/shared/src/sla.test.ts` | 210 | 56 (`sla\.test\.ts`, ambos) | En sitio `:2`, `:30-34`, `:51-55`, `:57-81`, `:129-130`, `:184-192`; pruebas nuevas al final | −0 |
| `apps/desk/server/db/sla.ts` | 63 | 24 (`db/sla\.ts`) | Reescritura con `:40` fija; crece por el final | 0 en `:1-40`; `:49` y `:58` cambian de contenido (caso B) |
| `apps/desk/server/db/sla.test.ts` | 146 | — | En sitio (firma, `escalarA`; `:141-145` sin tocar); nuevas al final | −0 |
| `apps/desk/server/db/avisos.ts` | 93 | 23 (`avisos\.ts`) | Al final | −0 |
| `apps/desk/server/index.ts` | 99 | 69 (`index\.ts`, homónimos); 29 a `:84-99` | En sitio `:15`, `:88` | −0 |
| `packages/zoho-sync/src/db/schema.sql` | 576 | 214; la más alta, `:576` | Al final | −0 |
| `packages/zoho-sync/src/db/migrate.ts` | 131 | 83 | En sitio `:73` | −0 |
| `packages/zoho-sync/src/db/migrate.test.ts` | 464 | 60 | En sitio `:282-286` | −0 |
| `packages/shared/src/types.ts` | 810 | 43 (hasta `:713`) | En sitio `:37` | −0 |
| `apps/desk/server/routes/tickets.ts` | 223 | 67 | En sitio `:9`, `:115` | −0 |
| `apps/desk/src/components/TicketCard.tsx` | 102 | 49; la más alta, `:83` | Inserción tras `:96` | +N sólo en `:97-102`, sin citas |

Ficheros nuevos: `apps/desk/server/services/alarmasSla.ts` (+ `.test.ts`), `apps/desk/server/db/alarmasAvisadas.ts`
(+ `.test.ts`).

## 10 · Mutaciones que prueban las guardas

| Regla | Mutación | Qué se pone rojo |
|---|---|---|
| 1 · posición | `crearAviso` antes del `INSERT` de la marca | Llamar dos veces a `marcarYAvisarAlarma` saltando el prefiltro: dos avisos en vez de uno |
| 1 · posición | `dispararAvisos` dentro de la transacción | Registro de eventos: el `fetch` falso debe ir detrás del `COMMIT` |
| 1 · posición | `logger.warn` antes del `INSERT` | Dos llamadas directas sin destinatarios: un solo `warn` |
| 1 · posición | Quitar el prefiltro de marcas | Segunda pasada: cero consultas a `users` (espía) |
| 1 · posición | Condición de OV antes o después del vencimiento | Nada, y se declara: es intersección, como `calendarioLaboral.ts:134-137` |
| 2 · vigilado | Quitar `PRIMARY KEY` de `schema.sql` | La prueba de doble marca de D-6 (dos inserciones, una fila) |
| 2 · vigilado | Quitar `public.` de la tabla en `schema.sql`, o `alarmas_avisadas` de `migrate.ts:73` | Guardián de `migrate.test.ts:266-275` |
| 2 · vigilado | Quitar `pasadaAlarmas(pool, config)` de `index.ts:88` | Guardián nuevo que lee `index.ts` (molde `avisoRitmoContrato.test.ts:185-195`); y el de ritmo sigue verde con la línea nueva |
| — | Una vía de OV distinta en `tieneOrdenVenta` | La prueba que la enfrenta a `ticketConOrdenVenta` |
| 1 · posición | Consultar el área ANTES del cargo, o sumar las dos listas | «Con alguien en el cargo, el área no recibe el aviso» |
| — | Corte = `ahora` de cada pasada (sin tabla) | «El corte no se mueve con un reinicio» |
| — | Comparar el vencimiento contra `ahora` en vez de contra el corte | «Lo vencido antes del corte se marca sin avisar» (el anterior avisaría) |
| 2 · vigilado | Quitar `ON CONFLICT (id) DO NOTHING` de la escritura del corte | Segunda pasada: el `INSERT` choca con la clave y la pasada registra error; la prueba del reinicio se pone roja |

La atomicidad marca+aviso se prueba **por estructura** (mismo cliente entre `BEGIN` y `COMMIT`), porque pg-mem no
honra el `ROLLBACK` (según `avisoRitmoContrato.ts:18`, cita de segunda mano: **hipótesis**).

## Seguridad

Sin superficie de red nueva: el correo sale por el webhook existente con su token; SQL parametrizado; el texto
sólo lleva número de ticket, estado y fecha; sin flag ni secreto nuevo.

## Threat Matrix

N/A — no hay enrutado, comandos de shell, subprocesos, automatización de VCS/PR ni clasificación de ejecutables:
la pasada es una promesa más dentro del `setInterval` existente del mismo proceso.

## Migración y despliegue

Tablas nuevas sin relleno. Nota de despliegue: `public.alarmas_avisadas` y `public.alarmas_corte`; `Notificado` de
24 h de reloj a 9 h hábiles; lo vencido antes de la primera pasada se marca sin avisar (S-13, P.3); sin Coordinador
Comercial, avisa al área Comercial (S-4, P.1). Rollback: revertir; las tablas sólo las lee este código. Un rollback
seguido de redespliegue NO vuelve a cortar: el corte ya está escrito (se borra a mano si Gerencia quiere otro).

## Preguntas abiertas y riesgos

- RQ-TS-19: letra corregida por el orquestador a «la misma definición de tres vías, enfrentada por prueba» (D-3).
- S-9 chocaba con **RQ-EN-06** vivo (`openspec/specs/transitions-equipo-nuevo/spec.md:226-241`): resuelto por
  el orquestador conservando el filtro de servicio. No hace falta delta de `transitions-equipo-nuevo`.


- Hipótesis de pg-mem (`ON CONFLICT … RETURNING` vacío, `lower(trim())`) y de microsegundos en `performed_at`.
  El tamaño de lo que S-13 marca en silencio no se conoce (sin acceso a producción); ya no es riesgo de ráfaga.
