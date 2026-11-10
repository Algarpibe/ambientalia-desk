---
tanda: fuera-del-plan
motivo: "Construye decision/calificaciones-y-borrados-de-zoho, precisada por decision/calificaciones-junto-con-que («va sola»): las calificaciones de satisfacción rompen el cuadre de conversaciones y en 51 tickets nunca se marca lo que Zoho ya no tiene"
capacidad: [zoho-sync]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `calificaciones-cuadre-conversaciones`

Construye `decision/calificaciones-y-borrados-de-zoho` (Gerencia, 08/11/2026; `openspec/config.yaml:6301`), con su respuesta textual en
`openspec/config.yaml:6308`, precisada por `decision/calificaciones-junto-con-que` (`openspec/config.yaml:6453`, «va sola», `:6460`), y lleva la
excepción de `decision/restos-del-historico-de-conversaciones` (`openspec/config.yaml:6349`): la medición de peticiones a Zoho por pasada se hace
al relanzar sobre los 51 y su resultado cierra E-254 (d) (`openspec/config.yaml:6358`). Límite de Gerencia: «No toca datos de producción más
allá de marcar como borrado lo que Zoho ya no tiene».

*Sobre la cabecera.* `tanda: fuera-del-plan` con su motivo: consecuencia (3) de la decisión (`openspec/config.yaml:6314`) y `tanda_que_abre`
(`openspec/config.yaml:6469`). `cierra: no`: no hay fila que cerrar (precedente
`openspec/changes/archive/2026-10-06-sync-tickets-por-modificacion/proposal.md:1-9`); el barrido de avance excluye `fuera-del-plan`
(`apps/desk/server/reconciliacion/comprobaciones.ts:215`). `maestro: []`: `maestro_pasaje: "ninguno"` en las dos decisiones
(`openspec/config.yaml:6321`, `:6467`). `toca_maestro: no`: el maestro no describe el cuadre (búsqueda de `threadCount`, `commentCount`,
`ausente_en_zoho` y «relleno de conversaciones» en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`: 0).
R-2 no aplica: `zoho-sync` ya está en `openspec/config.yaml:137`.

*Nombres cortos:* `conversaciones.ts` es `packages/zoho-sync/src/conversaciones.ts`; `server/rellenoConversaciones.ts` y
`routes/rellenoConversaciones.ts`, los de `apps/desk/server/`; `src/sync.ts`, `packages/zoho-sync/src/sync.ts`; `db/…`, los de
`packages/zoho-sync/src/db/`; `zoho-sync/spec.md`, `openspec/specs/zoho-sync/spec.md`.

## 1 · Intención

Que una calificación de satisfacción deje de impedir el cuadre, para que en los tickets que la tienen se marque —ocultar, no borrar— lo que Zoho
ya no tiene, igual que en los demás; relanzar la pasada sobre los 51 de E-266 con su resumen guardado donde sobreviva a un redespliegue; y que
ese resumen dé la medida de peticiones que cierra E-254 (d).

## 2 · Lo que hay hoy (medido en `79546497`)

- **El criterio.** `completa = lista.error === null && esperado !== null && recibidos.size === esperado` (`conversaciones.ts:120`), con
  `recibidos` el `Set` de ids de la lista (`conversaciones.ts:119`) y `esperado` = `commentCount` + `threadCount` (`conversaciones.ts:50-57`).
  Docblock en `conversaciones.ts:104-108`. Sin `completa` no se marca nada (`conversaciones.ts:122-127`).
- **El defecto** (medido por el analista con el conector en el #238 y el #319, `docs/sdd/ENTRADA.md:2410`): `threadCount` no cuenta los hilos
  de canal `FEEDBACK` y la lista sí los devuelve, así que `recibidos.size > esperado` y esos tickets nunca quedan completos. Son 51
  (`docs/sdd/ENTRADA.md:2412`, única copia: el estado del relleno se perdió con el redespliegue del 03/11).
- **Las tres vías** llaman a `guardarYReflejar`: relleno (`server/rellenoConversaciones.ts:104`), pasada periódica (`conversaciones.ts:163`) y
  sync del ticket (`src/sync.ts:189`, dentro de `syncConversations`, `src/sync.ts:183-191`, con los recuentos de `tickets.raw`, `src/sync.ts:188`).
- **Una cuarta comparación:** la verificación del relleno cuenta las filas `source='zoho'` sin marca (`visibles`,
  `server/rellenoConversaciones.ts:75-78`) contra `esperado` (`server/rellenoConversaciones.ts:109`). Sin descontar las calificaciones, los 51
  seguirían «descuadrados» aunque el marcado ya funcionara.
- **Desmarcado solo:** volver a guardar una fila pone `ausente_en_zoho_at=NULL` (`db/repo.ts:103`, en `upsertConversation`, `db/repo.ts:97-106`).
- **Dónde se lee el canal:** el objeto entero de Zoho va a `conversations.raw` (`db/mappers.ts:94-106`, `raw` en `db/mappers.ts:104`); la tabla,
  en `db/schema.sql:45-49` (esquema `desk`).
- **El resumen** vive en memoria (`server/rellenoConversaciones.ts:53`) y sólo va al logger (`server/rellenoConversaciones.ts:47-48`, llamado en
  `server/rellenoConversaciones.ts:135`). Ya lleva `peticiones` y `vistos429` (`server/rellenoConversaciones.ts:25`) e `inicio`/`fin`
  (`server/rellenoConversaciones.ts:120`, `:134`). `peticiones` cuenta detalle y páginas (`server/rellenoConversaciones.ts:64-70`); las lecturas
  de contacto y cuenta de `syncTicket(id, detalle)` (`server/rellenoConversaciones.ts:100`) van por el `Sync` compartido
  (`src/sync.ts:90`, `:100`, con caché por proceso en `src/sync.ts:87` y `:97`) y no se cuentan.
- **La ruta:** `requireAuth`, `requireSuperAdmin`, `guardaModoSinZoho(modo, esRecuento)`, `interruptorRelleno(habilitado)` y el manejador
  (`routes/rellenoConversaciones.ts:36`); el `403` nombra la variable (`routes/rellenoConversaciones.ts:15-23`); el `400` de `desde`/`limite` va en
  el manejador (`routes/rellenoConversaciones.ts:38`); `limite=0` sólo cuenta (`routes/rellenoConversaciones.ts:39`) y queda libre del modo sin
  Zoho (`apps/desk/server/routes/modoSinZohoDesk.ts:45`). La lista sólo se acota por `desde` y `limite`
  (`server/rellenoConversaciones.ts:56-62`, `:141-146`): no hay forma de recorrer exactamente 51 tickets.

## 3 · Alcance

**Dentro.**
1. **Criterio compartido** (S-1, S-2, S-3) en `conversaciones.ts`, que usan las tres vías sin tocar `src/sync.ts`, y la verificación del relleno.
2. **Resumen guardado** de cada pasada en una tabla de `public` (S-5), leído por el `GET`, con la medida de peticiones y su límite (S-6).
3. **Parámetro `numeros`** en `POST /api/admin/relleno-conversaciones` para relanzar sobre los 51 (S-7, S-10).
4. **`DEPLOY.md` §25** al final: `numeros`, el resumen guardado y cómo leerlo (S-8).

**Fuera.** Arreglar E-257 si no desaparece (`openspec/config.yaml:6460`: queda como entrada propia con su medición); E-267 (#1017, tarea de
persona); la comparación por ids de 1G-03, que ya saca estos 51 de la prueba del corte
(`openspec/changes/archive/2026-11-07-verificacion-completitud/archive-report.md:147-148`); `apps/desk/src` (regla 13: el cliente no decide nada
nuevo); reordenar guardas existentes; `src/sync.ts`; en la rama, `.env.example` y los seis de Supervisión.

**Spec:** MODIFIED RQ-ZS-26 (`zoho-sync/spec.md:1705`, el criterio de `zoho-sync/spec.md:1710-1711`) y RQ-ZS-28 (`zoho-sync/spec.md:1822`,
la verificación de `zoho-sync/spec.md:1830-1831`); ADDED desde RQ-ZS-48 al final (el último vivo es RQ-ZS-47, `zoho-sync/spec.md:2549`) para el
resumen, `numeros` y la §25 (S-9).

## 4 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `zoho-sync` — cuadre con calificaciones, resumen guardado del relleno y relance por números.

## 5 · Supuestos

S-1 a S-8 los fija el encargo del orquestador; S-9 a S-11, esta propuesta. Todos reversibles.

| Id | Supuesto | Cómo se deshace |
|---|---|---|
| S-1 | **Descontar las calificaciones de lo recibido.** Completa = sin error ∧ recuento presente ∧ ids únicos recibidos que NO son calificación = `commentCount` + `threadCount`. Para MARCAR se usa el conjunto de TODOS los ids recibidos, calificaciones incluidas: una calificación que viene nunca se marca. **Rechazado «recibido ≥ contado»** porque no pasa la prueba (b): Zoho cuenta 3 (2 comentarios + 1 hilo); la lista trae 2 reales + 1 calificación = 3, y falta una real. Con ≥, 3 ≥ 3 da completa y se marcaría la real que Zoho sí tiene; con S-1 cuentan 2 ≠ 3 y no se marca nada. **El criterio de hoy también la marcaría** (3 = 3): S-1 es más prudente que el actual, no sólo que la alternativa | «Sumar a lo esperado las calificaciones recibidas», que es la misma aritmética |
| S-2 | **Hipótesis:** una calificación se reconoce por `raw.channel === 'FEEDBACK'` en el objeto de la lista. El repositorio no tiene ningún fixture con ese campo en una conversación (búsqueda de `FEEDBACK` en `packages/` y `apps/`: 0; `channel` sólo en tickets, `db/mappers.ts:48`). Se comprueba con P-1. **Falla seguro:** si el campo o el valor no fueran ésos, la calificación contaría como hoy y el ticket seguiría sin marcarse; nunca se marca de más. El relance lo mide por sí mismo | Cambiar el predicado |
| S-3 | Un solo predicado exportado desde `conversaciones.ts`, que acepta el objeto o el `jsonb` como texto (molde `conversaciones.ts:47-53`, porque pg-mem lo entrega como texto); lo usan el cuadre y `visibles`, para que las cuatro comparaciones digan lo mismo | — |
| S-4 | Una calificación guardada que, con la lista completa, ya no viene, se marca como cualquier fila de Zoho; se desmarca sola si reaparece (`db/repo.ts:103`) | Excluir las calificaciones del marcado |
| S-5 | Tabla nueva **`public.relleno_conversaciones_pasadas`** (nombre propuesto; el diseño la afina), en `public` por ser registro operativo propio de la App y no reflejo de Zoho; `CREATE TABLE IF NOT EXISTS public.…` AL FINAL de `db/schema.sql` (hoy acaba en `db/schema.sql:852`). Una fila por pasada, escrita al lanzar y completada al terminar, para que un redespliegue a mitad deje rastro; `limite=0` no escribe. El `GET` devuelve el estado en memoria y además la última pasada guardada. Un fallo al guardar no tumba la pasada. Lo que guarda es lo de hoy: números de ticket y recuentos, nunca datos de cliente (`server/rellenoConversaciones.ts:28`) | Volver a sólo el log (`server/rellenoConversaciones.ts:47-48`) |
| S-6 | El resumen guardado lleva `peticiones`, `vistos429`, `inicio` y `fin`. **Límite declarado:** las lecturas de contacto y cuenta del `Sync` compartido no se cuentan, a lo sumo 3 por ticket y menos por la caché. El diseño puede proponer contarlas sin tocar `src/sync.ts`; si no, queda escrito. El resultado del relance cierra E-254 (d) | Contarlas |
| S-7 | `numeros`: lista de números de ticket separados por comas, combinable con `limite=0` (cuenta sin Zoho ni escritura) y con `limite`. Su `400` es escalón C, en el manejador, detrás del `503` del modo y del `403` del interruptor, como el de `desde`/`limite`. **`numeros` y `desde` a la vez: `400`**, por ambiguo. Se guarda en el resumen como `desde` y `limite` | Intersecar en vez de rechazar |
| S-8 | Sin interruptor nuevo: todo queda tras `RELLENO_CONVERSACIONES_HABILITADO` y `MARCAR_CONVERSACIONES_AUSENTES`, que ya existen; sin líneas para `.env.example`. `DEPLOY.md` §25 nueva al final, sin mover §21 (`DEPLOY.md:882`) a §24 (`DEPLOY.md:1030`) | — |
| S-9 | Spec: MODIFIED de RQ-ZS-26 y RQ-ZS-28 en sitio y con el MISMO número de líneas, porque `zoho-sync/spec.md:2314` cita `zoho-sync/spec.md:1982` (RQ-ZS-31, posterior); si no cabe, se repara esa cita al fusionar. Lo nuevo, ADDED desde RQ-ZS-48 | ADDED con precedencia (molde S-m de 1G-04) |
| S-10 | Un número de `numeros` que no está en `desk.tickets` no se recorre y se nombra en la respuesta del recuento y en el resumen; un `app-` se salta como hoy | Rechazar con `400` |
| S-11 | Relanzar es relanzar la pasada tal como es (RQ-ZS-28): refresca el detalle del ticket y guarda su lista de conversaciones, como el 03/11. Se lee dentro de «volver a lanzar la pasada» (`openspec/config.yaml:6308`); lo único nuevo en producción son las marcas de los 51, la fila del resumen y una tabla vacía | — |

## 6 · Ronda de preguntas

No se hace: el preflight es `auto` (`openspec/config.yaml:26`) y ninguna duda da causa de parada de la «Regla de ejecución» (no cambia alcance,
no cuesta dinero, no toca más datos de producción que los que la decisión autoriza, S-11). Las que habría hecho van a la lista semanal de
supuestos (`decision/preguntas-de-detalle-sin-llegar`): (1) si una calificación que el cliente retira en Zoho debe dejar de verse (S-4) o
conservarse como registro; (2) si el resumen guardado debe verlo alguien además del superadministrador; (3) si los tickets que sigan sin
cuadrar tras el relance por otra causa van a entrada propia, como E-257, o se reintentan en esta tanda.

## 7 · Criterios de aceptación

- **CA-1 (a)** Ticket con calificación y lista completa: se marca lo ausente, **en las tres vías** (relleno, pasada periódica y
  `syncConversations`), no sólo en `guardarYReflejar`.
- **CA-2 (b)** Calificación presente y una conversación real ausente de la lista con el tamaño cuadrando: no se marca nada, en las tres vías.
- **CA-3** Una calificación recibida nunca se marca; una guardada que ya no viene, con lista completa, sí (S-4); al reaparecer, se desmarca.
- **CA-4** La verificación del relleno da «completo» al ticket con calificación y lista completa, con el mismo predicado (S-3).
- **CA-5** Sin calificaciones, todo como hoy: las pruebas existentes de las tres vías y del relleno, intactas.
- **CA-6** El predicado acepta objeto y texto; canal distinto, ausente o `raw` nulo no es calificación.
- **CA-7** Resumen: fila al lanzar y al terminar; una instancia nueva sobre la misma base (redespliegue simulado) la devuelve por el `GET`; un
  fallo al escribir no corta la pasada; `limite=0` no escribe; sin datos de cliente (fixtures con marcadores).
- **CA-8** `numeros`: recorre sólo esos, en orden ascendente; con `limite=0` los cuenta sin Zoho; nombra los que no existen (S-10); vacío,
  mal formado o junto a `desde`, `400`. Posición probada: `401`, `403` de rol, `503` del modo, `403` del interruptor y `400`, en ese orden.
- **CA-9** `CREATE TABLE` calificado `public.` y el guardián de `packages/zoho-sync/src/db/migrate.test.ts` en rojo si se ensucia el `.sql`.
- **CA-10** §25 y su prueba; guardas del árbol en sitio (§9); `npm test`, typecheck y `npm run lint -- --max-warnings 165`.

## 8 · Tareas de persona (no son tareas de esta tanda; archivar no las da por hechas)

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Comprobar S-2 con la consulta de abajo, mejor antes de desplegar. Esperado (`docs/sdd/ENTRADA.md:2410`): las filas de canal `FEEDBACK` suman 1 en el #238 y 2 en el #319. Si sale otra cosa, el predicado se corrige antes de desplegar | Alfonso | informe de cierre |
| P-2 | Desplegar la rama. Con `MODO_SIN_ZOHO_DESK` cerrado (abierto, el lanzamiento da `503`), `RELLENO_CONVERSACIONES_HABILITADO=true` y `MARCAR_CONVERSACIONES_AUSENTES=true` comprobado (los dos se leen al arrancar: abrir y cerrar piden redesplegar, `apps/desk/server/app.ts:50`, `:57`): `POST …?numeros=<los 51 de docs/sdd/ENTRADA.md:2412>&limite=0` debe contar 51; después el `POST` sin `limite`; `GET` hasta `terminado`; cerrar el interruptor del relleno. Esperado: 51 «completos» o su lista; anotar `peticiones`, `vistos429`, `inicio` y `fin` | Alfonso | `DEPLOY.md` §25 |
| P-3 | Medir E-257 al cerrar, con la segunda consulta (**supuesto del orquestador** que mide E-257). La cierra: **0 filas** entre los archivados, salvo los que la pasada clasifique «no está en Zoho» o «sin recuento». Si no da 0, queda como entrada propia con su medición, sin ampliar la tanda (`openspec/config.yaml:6460`). Ojo: un ticket `managed_by_app` no refresca su `raw` (`db/repo.ts:71`) y puede salir por recuento viejo | Alfonso; lo cierra Supervisión | informe de cierre |

```sql
-- P-1 · sólo lectura
BEGIN READ ONLY;
SELECT t.number, c.kind, c.raw->>'channel' AS canal,
       coalesce(c.raw->'source'->>'type', c.raw->>'source') AS fuente, count(*) AS n
FROM desk.tickets t JOIN desk.conversations c ON c.ticket_id = t.id
WHERE t.number IN (238, 319) AND c.source = 'zoho'
GROUP BY 1, 2, 3, 4 ORDER BY 1, 3;
ROLLBACK;
\q
```

```sql
-- P-3 · sólo lectura · archivados cuyo visible sin calificaciones no casa con el recuento de tickets.raw
BEGIN READ ONLY;
WITH arch AS (
  SELECT id, number, managed_by_app,
         CASE WHEN raw->>'commentCount' ~ '^[0-9]+$' AND raw->>'threadCount' ~ '^[0-9]+$'
              THEN (raw->>'commentCount')::int + (raw->>'threadCount')::int END AS zoho_cuenta
  FROM desk.tickets WHERE raw->>'isArchived' = 'true'
), vis AS (
  SELECT ticket_id, count(*) AS visibles FROM desk.conversations
  WHERE source = 'zoho' AND ausente_en_zoho_at IS NULL AND coalesce(raw->>'channel', '') <> 'FEEDBACK'
  GROUP BY ticket_id
)
SELECT a.number, a.managed_by_app, a.zoho_cuenta, coalesce(v.visibles, 0) AS visibles
FROM arch a LEFT JOIN vis v ON v.ticket_id = a.id
WHERE a.zoho_cuenta IS DISTINCT FROM coalesce(v.visibles, 0)
ORDER BY a.number;
ROLLBACK;
\q
```

## 9 · Riesgos

- **S-2 es hipótesis** hasta P-1. Falla seguro: nunca marca de más.
- **Ficheros muy citados** (regla de mutación 4): `conversaciones.ts:50-57`, `conversaciones.ts:104-108`, `conversaciones.ts:120`, `:163`;
  `server/rellenoConversaciones.ts:75-78`, `:104`, `:135`; citados también en `docs/sdd/ENTRADA.md` y `docs/sdd/Paquete_de_Despliegue_*`.
  Se edita en la misma línea sin cambiar el número de líneas de lo citado (el docblock, `conversaciones.ts:119-120`, `visibles` y la
  importación de `server/rellenoConversaciones.ts:4`); lo nuevo, AL FINAL de cada fichero; las pruebas, en ficheros nuevos; barrido al cierre
  de cada lote.
- **Guardas que cuentan el árbol.** Tabla nueva: `PUBLIC_TABLES` crece en sitio (`db/migrate.ts:73`, la última línea de la lista); los recuentos
  de `packages/zoho-sync/src/db/migrate.test.ts:282-286` (47 → 48, 34 → 35) y las posiciones contadas desde el final
  (`packages/zoho-sync/src/db/migrate.test.ts:796`, `:798`, `:839`, `:840`, `:879`, `:880`, `:882`) se corrigen en sitio. La §25 rompe
  `apps/desk/server/deployModoSinZoho.test.ts:24-25` («la §24 como última») y `:66`; se corrige en una línea, molde
  `apps/desk/server/deployVerificacionCompletitud.test.ts:20`. **No se rompe** `apps/desk/server/reconciliacion/registro.test.ts:218-220`:
  `fuera-del-plan` no entra en «en curso» (`apps/desk/server/reconciliacion/comprobaciones.ts:215`).
- **Un `registrar` asíncrono escapa del `try` de `server/rellenoConversaciones.ts:135`**: la escritura lleva su propio `catch`, o un fallo de la
  base sería un rechazo sin manejar.
- **Hipótesis:** `db/schema.sql` también corre en `zoho-hub` (lo sugiere `db/schema.sql:846`, «En desk-db queda sin usar»); la tabla nacería
  vacía allí, sin efecto.
- **El `GET` de hoy no es asíncrono** (`routes/rellenoConversaciones.ts:46-48`); leer la base lo cambia. Debe seguir sin lanzar la pasada.

## 10 · Notas para Supervisión (lo que sólo Supervisión escribe en los seis ficheros)

- **Citas que pasan a caso B:** `openspec/config.yaml:6310` y `docs/sdd/ENTRADA.md:2414` dicen que el criterio de `conversaciones.ts:120` es
  `recibidos.size === esperado`; al fusionar deja de serlo. Son ciertas de su fecha: se anclan en `79546497`, no se renumeran.
- **E-266** se cierra con P-2 (51 completos o su lista); **E-254 (d)**, con las `peticiones` de P-2 y su límite (S-6); **E-257**, con P-3.
- `calificaciones-junto-con-que` dice «sólo la corrección … y el relance» (`openspec/config.yaml:6460`); la medición de peticiones va dentro del
  resumen del relance (S-6), así que no se lee como ampliación.

## 11 · Vuelta atrás

Revertir el commit retira el criterio, `numeros`, la escritura del resumen y la §25. La tabla queda vacía e inocua (`IF NOT EXISTS`, sin `DROP`).
Las marcas ya puestas en producción se deshacen solas si Zoho vuelve a devolver la fila (`db/repo.ts:103`); cerrar
`MARCAR_CONVERSACIONES_AUSENTES` detiene marcas nuevas. Quitar marcas a mano es dato de producción: lo decide Gerencia.

## 12 · Método y cierre

Worktree propio desde `79546497`; `strict_tdd`, cada lote empieza en rojo; vitest, pg-mem y supertest con `zohoFetch` falso. **Mutaciones:**
quitar el descuento (vuelve el defecto, CA-1 en rojo); cambiar a ≥ (CA-2 en rojo); marcar con los ids sin calificaciones (CA-3 en rojo); que
`visibles` no use el predicado (CA-4 en rojo). **Posición** (regla 1): el `400` de `numeros` frente al `403` del interruptor y al `503` del
modo; el cálculo de `completa` frente a `if (!marcar)` (`conversaciones.ts:121`). **Fichero vigilado** (regla 2): un `CREATE TABLE` sin
calificar en `db/schema.sql` pone rojo el guardián. Cada intento ≤ 800 con `git diff --shortstat --no-renames` más `wc -l` de lo no trackeado.

| Lote | Contenido | Estimado | ×1,8 |
|---|---|---|---|
| L1 | predicado y criterio en `conversaciones.ts`; `visibles`; pruebas (a), (b) y (c) en las tres vías y la verificación | 220 | 396 |
| L2 | tabla, `PUBLIC_TABLES` y `migrate.test.ts` en sitio; escritura y lectura del resumen; `GET`; pruebas | 210 | 378 |
| L3 | `numeros` en ruta, recuento, pasada y resumen; pruebas con posición | 130 | 234 |
| L4 | `DEPLOY.md` §25, su prueba y `deployModoSinZoho.test.ts:24-25`, `:66` | 90 | 162 |
| | **Código y pruebas** | **650** | **1.170** |

Aparte, los artefactos: spec ≈120, diseño ≈130, tareas ≈90, `verify-report.md` ≈300 (sumando obligatorio) y `archive-report.md` ≈150 más la
mudanza.
