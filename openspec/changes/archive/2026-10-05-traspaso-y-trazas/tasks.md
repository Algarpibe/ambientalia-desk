# Tareas — Traspaso leído como línea y trazas que faltan

Cambio `traspaso-y-trazas` (`tanda: F1B-05`, `cierra: no`, sin la mitad de visibilidad). **Donde la spec y el diseño
discrepan, manda el diseño.** Dos lotes, como `design.md` §8. Cada lote es un intento del registro `gentle-ai sdd-attempt`
(techo 800, objetivo 720), con sus rojos, su código, sus mutaciones y su cierre, y deja el árbol en verde por sí solo.
Orden: lote 1, lote 2. **Rojo antes que verde:** ninguna tarea de producción precede a la de su prueba. Regla de edición
de todo el cambio: en los ficheros citados se edita **EN SITIO, sin añadir ni quitar líneas** (lo nuevo va a ficheros
nuevos o se une con `;`). Las mutaciones las ejecuta el apply: aplicar, anotar el mensaje literal del rojo y revertir.
Los resultados, medidas y códigos de salida se anotan en `apply-progress.md`.

## Review Workload Forecast

| Lote | Contenido | Producción | Pruebas | Documental y casillas | Estimado | Riesgo frente a 800 |
|---|---|---|---|---|---|---|
| 1 | Cabecera del registro, esquema, restauración con rastro, liberación con actor, barrido de escritores | ~125 | ~322 | ~60 (`apply-progress.md`, casillas) | ~510 | Bajo |
| 2 | Línea de traspaso, RQ-TZ-17, pruebas existentes, corrección 26, bandeja, casilla de la regla 3 | ~65 | ~265 | ~145 (documentos ~85, `apply-progress.md` y casillas ~60) | ~475 | Bajo |

Total ~985 líneas en dos intentos. Hipótesis: son estimaciones (`design.md` §8) y una línea modificada cuenta dos. Si la
medida de un lote pasa de 720, **se para y se consulta**; no se aprieta.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High

*Motivo de «High» y de «No»:* cada lote supera 400 líneas, pero la unidad no es el PR sino el intento del registro en su
worktree (`C:\dev\Desk_2_R1.023-worktrees\traspaso-y-trazas`), fusionado a `main` al cerrar (regla del ciclo 3). Los
supuestos S-1…S-6 de la propuesta son razonables y reversibles y no cambian el alcance de la fila.

### Unidades de trabajo

| Unidad | Meta | Prueba enfocada | Harness real | Frontera de reversión |
|---|---|---|---|---|
| 1 | RQ-TZ-14, RQ-TZ-15, RQ-TZ-16 y cabecera | `npx vitest run apps/desk/server/reconciliacion/registro.test.ts apps/desk/server/remisionRestaurada.test.ts apps/desk/server/db/remisionRestaurada.test.ts apps/desk/server/db/eliminarTicket.test.ts apps/desk/server/escritoresTransiciones.test.ts packages/zoho-sync/src/db/ovAsociaciones.test.ts packages/zoho-sync/src/db/migrate.test.ts` | pg-mem con el arnés de rutas; sin servicios reales | `git revert` del lote; las cuatro columnas quedan anulables y sin uso |
| 2 | RQ-TZ-17, RQ-TZ-18, RQ-TZ-19, RQ-AV-18 y bloque documental | `npx vitest run apps/desk/server/db/traspaso.test.ts apps/desk/server/db/historial.test.ts apps/desk/server/tickets.test.ts apps/desk/server/migracionMarcadorLectores.test.ts` | pg-mem con espía de SQL; sin servicios reales | `git revert`; el traspaso no deja datos escritos |

---

# LOTE 1 — Trazas, barrido de escritores y cabecera (≈ 510)

Archivos nuevos: `apps/desk/server/db/remisionRestaurada.ts`, `apps/desk/server/testing/escritoresTransiciones.ts`,
`apps/desk/server/escritoresTransiciones.test.ts`, `apps/desk/server/remisionRestaurada.test.ts`,
`apps/desk/server/db/remisionRestaurada.test.ts`. En sitio: `registro.test.ts`, `schema.sql` (sólo al final),
`migrate.test.ts`, `remisiones.ts`, `routes/remision.ts`, `historial.ts`, `ovAsociaciones.ts`, `eliminarTicket.ts`,
`routes/tickets.ts`, y las pruebas `eliminarTicket.test.ts` y `ovAsociaciones.test.ts`.

**Preparación**
- [x] 1.1 Anotar `git rev-parse HEAD` como partida del lote 1 y comprobar que el intento está abierto en este worktree.
  Medir `wc -l` de los ficheros en sitio (`remisiones.ts`, `routes/remision.ts`, `historial.ts`, `ovAsociaciones.ts`,
  `eliminarTicket.ts`, `routes/tickets.ts`, `schema.sql`, `migrate.test.ts`) para comprobar al cierre que no se movió ninguna línea.
- [x] 1.2 Leer los moldes: `apps/desk/server/db/remisiones.ts:146-153` (`anularRemision`, `restaurarRemision`),
  `apps/desk/server/routes/remision.ts:341-346`, `apps/desk/server/db/historial.ts:108-120` y `:149-155`,
  `packages/zoho-sync/src/db/ovAsociaciones.ts:104-138`, `apps/desk/server/db/eliminarTicket.ts:99-103` y `:154`,
  `apps/desk/server/routes/tickets.ts:88-92`, `packages/zoho-sync/src/db/migrate.test.ts:346-350` y `:376-378`,
  `apps/desk/server/db/migracionTicketsAbiertos.test.ts:68` (molde del espía), y cómo `registro.test.ts` resuelve la raíz.

**Cabecera del registro (roja desde que existe `proposal.md`)**
- [x] 1.3 Rojo, editando en sitio `apps/desk/server/reconciliacion/registro.test.ts:218`: «NUEVE» → «DIEZ», y en la lista de
  `:220` añadir `'F1B-05'` entre `'F1B-04'` y `'F1B-07'`. **EJECUTAR** el fichero: debe estar rojo hasta que la cabecera del
  proposal cuente; anotar el mensaje literal. Si ya está verde, anotarlo y no seguir sin entender por qué.

**Rojo — esquema (RQ-TZ-14, columnas)**
- [x] 1.4 Rojo en `packages/zoho-sync/src/db/migrate.test.ts:376-377`: recuentos 55 → 59 y 29 → 33 (sin calificar sigue 26).
  **EJECUTAR**: debe caer por el recuento.

**Rojo — restauración con rastro (RQ-TZ-14)**
- [x] 1.5 `apps/desk/server/remisionRestaurada.test.ts` (nuevo, con el arnés de rutas): anular y restaurar por la ruta deja las
  cuatro columnas (`anulacion_previa_por` = quien anuló, `restaurada_por` = quien restauró) y vacía `anulada_at` y `anulada_por`.
- [x] 1.6 En el mismo fichero: sin nombre en la sesión se escribe `TRANSITION_ACTOR` y no `NULL`; restaurar una remisión
  vigente responde `200` y no escribe nada (`restaurada_at` sigue `NULL`).
- [x] 1.7 En el mismo fichero: anulada, restaurada y anulada de nuevo conserva el rastro de la restauración y la anulación
  vigente es la nueva; un segundo ciclo pisa el primero (S-2); tras restaurar, el listado y el panel vuelven a enseñar la remisión.
- [x] 1.8 `apps/desk/server/db/remisionRestaurada.test.ts` (nuevo): `eventosRestauracion` con `restaurada_at` nulo → `[]`;
  restaurada → dos eventos (`'RemisionAnulada'` y `'RemisionRestaurada'`) con persona e instante; sin `anulacion_previa_at`
  → sólo la restauración; el historial completo muestra los tres hechos en orden cronológico; los títulos de
  `apps/desk/server/db/historial.test.ts:97-98` no cambian; abrir el historial dos veces no escribe (espía).
- [x] 1.9 **EJECUTAR** los dos ficheros y anotar el fallo literal de cada rojo (las columnas y el derivador no existen).

**Rojo — liberación con actor (RQ-TZ-15)**
- [x] 1.10 `packages/zoho-sync/src/db/ovAsociaciones.test.ts`: llamada a `liberarAsociacionesDeTicket` con el cuarto argumento
  (actor); dos vigentes quedan con `liberada_por`; la ya liberada conserva el suyo y su instante; sin vigentes no falla ni actualiza.
  Actualizar la llamada existente de `:109` con actor; casos nuevos al final.
- [x] 1.11 `apps/desk/server/db/eliminarTicket.test.ts`: las **siete** llamadas no simulacro ganan `{ actor }`; las siete de
  simulacro pasan `{ dryRun: true }`; caso nuevo al final: borrar con dos asociaciones vigentes y una liberada por otra
  persona deja `liberada_por` = actor; el simulacro no escribe. **EJECUTAR** los dos ficheros y anotar el fallo literal.

**Rojo — barrido de escritores (RQ-TZ-16)**
- [x] 1.12 `apps/desk/server/escritoresTransiciones.test.ts` (nuevo): inventario exacto `fichero → número` (`repo.ts` 3,
  `migracionTicketsAbiertos.ts` 1) y todos nombran `performed_by`; árbol vacío → rojo (cero escritores no es éxito).
- [x] 1.13 En el mismo fichero, fixtures sintéticos del extractor: sin `performed_by` → rojo nombrando el fichero; sin lista
  de columnas → infractor; calificado con esquema y repartido en varias líneas → se encuentra y pasa si nombra la columna.
- [x] 1.14 En el mismo fichero, caso aparte de `docs/sdd/*.sql` (no cuenta entre los cuatro): inventario exacto (uno,
  `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:46`); fixture `.sql` sin `performed_by` → rojo. La descripción del
  barrido dice qué comprueba y qué no (S-6: la columna se nombra, no que el valor llegue relleno; no ve un nombre de tabla
  interpolado). Verificar la hipótesis de la raíz del repositorio contra `registro.test.ts`. **EJECUTAR**: falla porque el extractor no existe.

**Verde**
- [x] 1.15 `packages/zoho-sync/src/db/schema.sql`: añadir al final, tras la línea 718, comentario y las cuatro
  `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS` (`restaurada_at`, `restaurada_por`, `anulacion_previa_at`,
  `anulacion_previa_por`), todas calificadas. **EJECUTAR** `migrate.test.ts`: verde con los recuentos de 1.4.
- [x] 1.16 `apps/desk/server/db/remisiones.ts:151-152`: `restaurarRemision(db, id, quien: string)` y el `UPDATE` único de
  `design.md` §5 (copia antes del vaciado en el `SET`, `WHERE id = $1 AND anulada_at IS NOT NULL`), en sitio.
- [x] 1.17 `apps/desk/server/routes/remision.ts:344`: pasa `req.user?.name ?? TRANSITION_ACTOR` (misma expresión de `:346`), en sitio.
- [x] 1.18 Crear `apps/desk/server/db/remisionRestaurada.ts` con `eventosRestauracion(fila)`: la anulación previa reutiliza
  `eventName: 'RemisionAnulada'` y el título «Remisión anulada»; la restauración es `'RemisionRestaurada'` / «Remisión restaurada»,
  `details` `[['Restaurada por', …]]`. Puro, sin consultas.
- [x] 1.19 `apps/desk/server/db/historial.ts`: unir el `import` con `;` a una línea existente, añadir las cuatro columnas a la
  consulta de `:151` y concatenar `eventosRestauracion` en el `return` de `:120`; el bloque de `:110-119` queda intacto.
  Si pg-mem rechaza la copia columna a columna de D-2, plan B: dos sentencias con `enTransaccion`, copia primero; anotarlo.
- [x] 1.20 `packages/zoho-sync/src/db/ovAsociaciones.ts:132-137`: `liberarAsociacionesDeTicket(q, ticketId, motivo, actor: string)`
  y `liberada_por = $3` en la sentencia, en sitio.
- [x] 1.21 `apps/desk/server/db/eliminarTicket.ts`: `opts: { dryRun: true } | { dryRun?: false; actor: string }` sin valor por
  defecto, y la llamada de `:154` pasa el actor; `apps/desk/server/routes/tickets.ts:91` arma `opts` según
  `req.query.dryRun` con `req.user?.name ?? TRANSITION_ACTOR`, con el `import` de `TRANSITION_ACTOR` unido con `;` a `:17`.
- [x] 1.22 Crear `apps/desk/server/testing/escritoresTransiciones.ts` (`escritoresDeTransiciones`, `nombraActor`; patrón
  `INSERT INTO [esquema.]ticket_transitions` con o sin lista, en varias líneas) y, en `escritoresTransiciones.test.ts`, el
  barrido que lee `apps/` y `packages/` (`.ts` que no sean `*.test.ts` ni estén bajo `testing/`) más `docs/sdd/*.sql`.
- [x] 1.23 **EJECUTAR** los siete ficheros de la prueba enfocada: todo verde, incluida la cabecera de 1.3.

**Mutaciones (aplicar, anotar mensaje literal, REVERTIR)**
- [x] 1.24 **M1:** quitar del `SET` las dos asignaciones de copia. Debe caer «deja las cuatro columnas».
- [x] 1.25 **M2 (regla 1, posición):** poner el vaciado delante de la copia en el `SET`. Hipótesis: rojo sólo si pg-mem evalúa
  en secuencia; si queda verde se anota como mutación equivalente, no como prueba que falta.
- [x] 1.26 **M3:** quitar `AND anulada_at IS NOT NULL`. Debe caer «restaurar una vigente no escribe».
- [x] 1.27 **M4:** pasar `null` en vez del respaldo en la ruta. No compila (`npm run typecheck`); con `as never`, cae «sin nombre en la sesión».
- [x] 1.28 **M5:** quitar `liberada_por = $3`. Debe caer «dos vigentes quedan con `liberada_por`».
- [x] 1.29 **M6 (regla 2, fichero vigilado):** copiar un escritor real a un fixture sintético sin `performed_by`; el barrido lo
  señala. Aparte, ensuciar el `.sql` de `docs/sdd/` real quitando `performed_by` (en una copia): el caso de procedimientos cae.
- [x] 1.30 **M7 (regla 2):** quitar `public.` a una `ALTER` nueva de `schema.sql`. Debe caer el guardián de `ALTER` sin calificar
  (`packages/zoho-sync/src/db/migrate.test.ts:346-350`).
- [x] 1.31 `git diff` de los ficheros de producción y de pruebas: no queda ninguna mutación y los ficheros en sitio conservan su `wc -l`
  de 1.1 (salvo `schema.sql`, que sólo crece por el final).

**Cierre del lote 1**
- [x] 1.32 **Barrido de citas (regla de mutación 4), comprobación, no suposición:** `grep -rnoE` de
  `(remision|tickets|ovAsociaciones|remisiones|migrate\.test|eliminarTicket|historial)\.ts:[0-9]+(-[0-9]+)?` y de
  `schema\.sql:[0-9]+(-[0-9]+)?` sobre el repositorio, sin `openspec/changes/archive/` ni este cambio, y segundo pase de la
  forma abreviada (`:NN`) en los ficheros que ya citan cada módulo, `openspec/specs/trazas/spec.md` incluido. Comprobar CADA
  resultado contra el fichero y leer qué afirma la frase. Confirmar que el diseño acierta al afirmar cero desplazamientos
  (`design.md` §9); clasificar A, B o C las citas cuyo texto cambió (`restaurarRemision`, sentencia de liberación, llamada de
  `eliminarTicket.ts:154`, recuentos de `migrate.test.ts`). No editar documentos fechados. La lista va en `apply-progress.md`.
- [x] 1.33 **CIERRE LOTE 1:** `npm test`, `npm run typecheck`, `npm run lint` (margen de avisos 0: hoy 165, no puede subir;
  usar `--max-warnings 165`) y, tras el commit del lote, `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`;
  anotar el CÓDIGO DE SALIDA de cada uno. No se commitea antes de la orden del orquestador.
- [x] 1.34 Medida del intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear (ficheros binarios,
  si los hubiera, fuera del tope y anotados aparte); registrarla. Si pasa de 720, parar y consultar.

---

# LOTE 2 — Línea de traspaso, excepciones, pruebas existentes y bloque documental (≈ 475)

Archivos nuevos: `apps/desk/server/db/traspaso.ts`, `apps/desk/server/db/traspaso.test.ts`. En sitio:
`apps/desk/server/db/historial.ts`, `apps/desk/server/db/historial.test.ts`, `apps/desk/server/tickets.test.ts`. Al final:
`docs/sdd/F0-01_Correcciones_para_el_maestro.md`, `docs/sdd/ENTRADA.md`; `apply-progress.md`.

**Preparación**
- [x] 2.1 Anotar `git rev-parse HEAD` (partida del lote 2), comprobar el intento y medir `wc -l` de `historial.ts` y de los dos
  ficheros de documentos.
- [x] 2.2 Leer los moldes: `packages/shared/src/transitions.ts:327-334` (`areasSiguientes`), `packages/shared/src/flujos.ts:64-66`
  (`catalogoDelTicket`), `apps/desk/server/services/avisoArea.ts:15-17`, `apps/desk/server/db/ticketFuentes.ts:25-27`, `:105-125`,
  `:139-148` y `:165`, `apps/desk/server/db/historial.ts:136-144`, `packages/shared/src/migracionTickets.ts:14`,
  `apps/desk/server/migracionMarcadorLectores.test.ts:62-71`.
- [x] 2.3 Comprobar la hipótesis de `design.md` §7: que «Ingresado» tiene área siguiente en el catálogo de servicio, ejecutando
  `areasSiguientes` sobre el estado; anotar el resultado, porque decide cuáles de las pruebas existentes se ponen rojas.

**Rojo — traspaso (RQ-TZ-18, RQ-AV-18)**
- [x] 2.4 `apps/desk/server/db/traspaso.test.ts` (nuevo), con persona: transición de «Ana» con `derivado_a` = id de «Beto»
  → una línea `Traspaso: Ana → Beto` con `De`, `A`, `Por la etapa` y la hora de la transición.
- [x] 2.5 Sin persona, destino por área: igual a `areasSiguientes(to_status, catalogoDelTicket(...))` y a `areasAAvisar` con un
  actor sin áreas, **llamadas en la propia prueba**; clave `derivado_a` vacía → por área; id que no resuelve → crudo; persona
  igual al origen → hay línea (S-4); misma área que la siguiente → hay línea («Comercial → Comercial»).
- [x] 2.6 Estado terminal sin persona → `[]`; catálogo de `Equipo nuevo` usa el suyo y no `TRANSITIONS`; etiquetas «De» y «A», y
  nunca «Derivado a» (`apps/desk/server/db/historial.test.ts:173-174` filtra por esa etiqueta).
- [x] 2.7 Orden de emisión (D-13): con la misma hora el traspaso queda en el índice anterior al de su transición. Abrir el
  historial dos veces no emite `INSERT`, `UPDATE` ni `DELETE` (espía) ni crea avisos (RQ-AV-18).

**Rojo — exclusiones (RQ-TZ-19)**
- [x] 2.8 En el mismo fichero: la creación con derivación no produce línea; marcador con `to_status` nulo, ninguna; marcador con
  destino relleno y área siguiente, ninguna; otra transición con `to_status` nulo y persona derivada sí da línea (el criterio
  es el identificador `ID_TRANSICION_MIGRACION`, no el destino vacío).

**Rojo — excepciones de traza (RQ-TZ-17, ~15 líneas)**
- [x] 2.9 En el mismo fichero: con un ajuste en `prioridad_ajustes` ningún evento del historial procede de él; y, leídos como
  texto, `historial.ts`, `ticketFuentes.ts`, `remisionRestaurada.ts` y `traspaso.ts` no nombran `prioridad_ajustes`,
  `ov_asociaciones` ni `equipos_cambios`. La descripción declara el límite: mira esos cuatro ficheros, no lo que importan.
- [x] 2.10 **EJECUTAR** el fichero y anotar el fallo literal (el módulo no existe).

**Pruebas existentes que se ponen rojas y se actualizan** (en sitio; el traspaso va ENCIMA de su transición)
- [x] 2.11 `apps/desk/server/db/historial.test.ts:23-26` (orden y títulos con «Transición: Habilitar Servicio»): añadir el título
  de traspaso donde el catálogo lo produzca.
- [x] 2.12 `apps/desk/server/db/historial.test.ts:69` (`eventos[0]`, lee los detalles de la transición «Diagnosticar»): buscar por título.
- [x] 2.13 `apps/desk/server/db/historial.test.ts:189` (`['Transición: Habilitar', 'Ana ha publicado un comentario']`): añadir el
  traspaso de «Habilitar» si la comprobación de 2.3 lo da.
- [x] 2.14 `apps/desk/server/tickets.test.ts:118` y `:133-136`: ídem. Si 2.3 muestra que «Ingresado» no tiene área siguiente,
  las que no cambian se anotan como verdes sin editar. `apps/desk/server/migracionMarcadorLectores.test.ts:62-71` sigue verde
  **sin editarse**. **EJECUTAR** los dos ficheros ANTES de tocarlos y anotar qué cae (el rojo es el que nombra el diseño).

**Verde**
- [x] 2.15 Crear `apps/desk/server/db/traspaso.ts` con `lineaTraspaso(fila, nombres, ticket)`: exclusiones en este orden
  (`esCreacion` → marcador por `transition_id` → destino), persona (`nombres.get(id) ?? id`) o `areasSiguientes(to_status,
  catalogoDelTicket({ classification, status: to_status }))` sin restar nada, evento `'AppTraspaso'` con `actor = performed_by ??
  'App'` y `HistoryEvent` sin cambios.
- [x] 2.16 `apps/desk/server/db/historial.ts`: unir el `import` con `;`, añadir `transition_id` al `SELECT` de la línea 137 y emitir
  `[traspaso, transición]` con el `flatMap` de `:142-144`, en sitio; `classification` sale de `datosTicket` (sin consulta nueva).
  `apps/desk/server/db/conversacion.ts` no se toca.
- [x] 2.17 **EJECUTAR** `traspaso.test.ts`, `historial.test.ts`, `tickets.test.ts` y `migracionMarcadorLectores.test.ts`: todo verde.

**Mutaciones (aplicar, anotar mensaje literal, REVERTIR)**
- [x] 2.18 **M1:** quitar la exclusión del marcador. Debe caer «marcador con destino».
- [x] 2.19 **M2 (regla 1, posición):** mover la exclusión del marcador detrás del cálculo del destino y devolver por destino vacío.
  Debe caer «marcador con destino».
- [x] 2.20 **M3 (regla 1, posición):** invertir el orden de emisión a `[transición, traspaso]`. Debe caer «misma hora».
- [x] 2.21 **M4:** sustituir `areasSiguientes` por una lista fija. Debe caer «catálogo de equipo nuevo».
- [x] 2.22 **M5 (regla 2):** añadir al compositor una consulta a `prioridad_ajustes`. Debe caer la prueba de RQ-TZ-17.
- [x] 2.23 `git diff` de `traspaso.ts`, `historial.ts` y pruebas: no queda ninguna mutación; `historial.ts` conserva su `wc -l` de 2.1.

**Bloque documental** (después del verde; sin menciones a reuniones)
- [x] 2.24 `docs/sdd/ENTRADA.md`: añadir al final E-219 (actor que no es persona; límite: un respaldo no se distingue de una
  persona), E-220 (protocolo de traspaso sin aprobar: reasignación con motivo, aviso personal, propietario del registro) y E-221
  (excepciones de traza y límite de S-2). Las tres con dueño Gerencia, formato de E-210…E-218.
- [x] 2.25 `docs/sdd/F0-01_Correcciones_para_el_maestro.md`: añadir al final la corrección 26 (la línea de traspaso del
  maestro como «Propuesto R08.4» y la fila «sin empezar» quedan desactualizadas; cita `R08.4.md:2060-2062`, verificada), a
  continuación de la 25.
- [x] 2.26 En `apply-progress.md`: (a) casilla de la regla de mutación 3: el cambio no añade decisiones de cliente ni toca
  `apps/desk/src`, con la tabla decisión del cliente ↔ línea del servidor de `proposal.md`; (b) nota para el paquete de despliegue:
  cuatro columnas anulables en `public.remisiones` aplicadas por `migrate` al arrancar, sin variables ni flag ni relleno, comprobar
  las cuatro columnas tras el arranque (S-3); (c) línea única de cobertura para el `archive-report.md` (R-1): qué parte de F1B-05
  cubre (trazas y línea de traspaso) y qué deja fuera (visibilidad por área, protocolo sin aprobar), lo que sostiene `cierra: no`.

**Cierre del lote 2**
- [x] 2.27 **Barrido de citas (regla de mutación 4):** `grep -rnoE "historial\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio (sin
  `openspec/changes/archive/` ni este cambio) y segundo pase de la forma abreviada en los ficheros que ya citan el módulo;
  más el barrido de `ENTRADA.md` y `F0-01_Correcciones_para_el_maestro.md` por si algún texto añadido cita líneas. Comprobar
  CADA resultado contra el fichero, leyendo qué afirma la frase. Comprobar que el diseño acierta al afirmar cero
  desplazamientos. La lista va en `apply-progress.md`.
- [x] 2.28 **CIERRE LOTE 2:** `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165` (avisos: no suben de 165) y, tras
  el commit del lote, `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; anotar el CÓDIGO DE SALIDA de cada uno.
- [x] 2.29 Medida del intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; registrarla.
  Si pasa de 720, parar y consultar.

---

# Tareas de PERSONA — fuera del recuento

*Regla del ciclo 1: son decisiones o comprobaciones de personas, no trabajo que una tanda pueda hacer en este repositorio;
**archivar este cambio no las da por hechas**.*

| # | Tarea | Dueño | Qué desbloquea | Dónde queda escrita |
|---|---|---|---|---|
| 1 | Responder E-089 (visibilidad por área) | Gerencia | Cerrar F1B-05 | `docs/sdd/ENTRADA.md` |
| 2 | Aprobar o no el protocolo de traspaso (reasignación, aviso personal, propietario) | Gerencia | Reasignación y restricción por propietario | E-220 |
| 3 | Decidir cómo se identifica el actor que no es una persona | Gerencia | Marcarlo en el historial | E-219 |
| 4 | Pegar la corrección 26 en el maestro | Gerencia | Maestro al día | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| 5 | Comprobar el historial en la aplicación: el panel pinta bien los eventos nuevos (hipótesis no leída) y el ruido de S-4 | Analista | Fusionar la rama | Parte del corte |
| 6 | Desplegar y comprobar las cuatro columnas en `public.remisiones` | Persona con acceso a producción | Rastro de restauración en producción | Paquete de despliegue |
| 7 | Decidir si se rellenan las restauraciones y liberaciones anteriores (S-3) | Gerencia | Rastro retroactivo; toca datos de producción | E-221 |

La fusión de cada lote a `main` y el asiento del intento (`settle`) son del orquestador y del analista; no son casillas de
este cambio y archivar no los da por hechos.
