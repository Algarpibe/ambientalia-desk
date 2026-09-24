# Tasks — `alta-equipo-nuevo-en-ticket` (F1B-14, cambio 1, `cierra: no`)

**Fase:** `sdd-tasks` · **Árbol:** `ea23634` (limpio) · **Entradas:** `proposal.md`, `design.md`,
`specs/tickets-core/spec.md` de esta misma carpeta. Verificado contra HEAD: `ticketService.ts`
(1-109), `db/equipos.ts` (1-381), `routes/equipos.ts` (1-189), `repo.ts` (370-417), `eliminarTicket.ts`
(175-189), `salesRecords.test.ts` (1-33), `auth/users.ts:147` — todas las líneas de `design.md`
coinciden byte a byte con el árbol de hoy.

## Desviación del diseño (decisión del orquestador)

`design.md` §6 se contradice: declara «desplazamiento neto cero» y en la misma tabla mete una línea
nueva en `:89` Y comprime dos declaradores en un solo `const` en `:24` para compensarla — cero
desplazamiento sólo se sostiene comprimiendo. **Se prioriza LEGIBILIDAD**: `:24` se escribe como dos
`const` naturales, sin comprimir, aceptando el desplazamiento que produzca desde ahí hacia abajo en
`ticketService.ts`. Por eso la Fase 10.4 (barrido regla de mutación 4) es **OBLIGATORIA de cierre**, y
cubre los CUATRO ficheros citados por el delta — `ticketService.ts`, `repo.ts`, `db/equipos.ts`,
`routes/equipos.ts` — no sólo el primero como estimaba `design.md`.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas (`sdd-apply`) | ≈580-720 (base de `design.md` §7: 530-680, +≈40 por declarar `:24` sin comprimir y por extender el barrido de cierre a `repo.ts`/`db/equipos.ts`/`routes/equipos.ts`, que se confirma SIN desplazamiento propio — es verificación, no reparación) |
| Riesgo de presupuesto (techo 800) | **Medio** — margen de 80 a 220; el umbral propio de `design.md` («si pasa de 650, el `.tsx` va en un segundo lote») queda dentro del rango, no lo dispara con certeza |
| PRs/commits encadenados recomendados | **No**, por ahora — el pronóstico se queda bajo 800 incluso en el extremo alto |
| Corte sugerido | Uno solo. Contingencia: si la medida real en worktree aislado (`git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin trackear) supera 750 antes de la Fase 9, mover la Fase 9 (`CreateTicket.tsx`) a un commit/intento separado del MISMO cambio (regla del ciclo 2), no a un PR nuevo |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — no aplica corte hoy; se reabre sólo si la contingencia de arriba se dispara |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium
```

**No hace falta partir el `.tsx` en un segundo lote hoy.** Es una decisión sólo si la medida real en
worktree aislado dispara la contingencia de arriba; si ocurre, es una decisión de Gerencia
(`ask-on-risk`) antes de seguir con la Fase 9, no algo que esta fase resuelva por su cuenta.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 · Servidor (Fases 0-8, 10) | Rama «Equipo nuevo» completa, atómica, con P1-P7 y mutaciones | PR único | `npx vitest run apps/desk/server/services/ticketService.test.ts apps/desk/server/db/equipos.test.ts apps/desk/server/db/transaccion.test.ts packages/zoho-sync/src/db/repo.test.ts` | `npm test` contra el Postgres de pruebas (pg-mem), sin credenciales Zoho | `git revert`: sin migración, sin estado persistido; los equipos ya creados en producción antes del revert quedan como filas válidas de Registro de equipos (`proposal.md`, plan de vuelta atrás) |
| 2 · Cliente (Fase 9) | Bloque «Equipo nuevo» en `CreateTicket.tsx`, sin pruebas (F0-00) | Mismo PR salvo contingencia de arriba | N/A — `.tsx` fuera de la red de pruebas (F0-00) | Comprobación de persona en `ambientalia-desk.ambientalia.cloud`: alta con serial nuevo y con serial repetido | `git revert` del bloque JSX/estado; no toca contratos de servidor |

---

## Fase 0 · T0 — sonda de atomicidad (design.md §2, bloqueante, primera tarea)

- [ ] 0.1 Crear `apps/desk/server/db/transaccion.test.ts`. Sonda: mismo montaje que
  `ticketService.test.ts:35-39` (`newDb().adapters.createPg()`, `migrate(db)`); abrir
  `pool.connect()`, `BEGIN`, `INSERT INTO equipos (...)` mínimo, `ROLLBACK`, y comprobar
  `SELECT COUNT(*) FROM equipos` = 0 (fuera de esa conexión).
- [ ] 0.2 Ejecutar. Registrar el resultado (verde/rojo) en un comentario del fichero y en
  `apply-progress.md`: fija el plan de la Fase 1 — **Plan A** si T0 es verde, **Plan B** si es rojo.
- [ ] 0.3 Si T0 es **rojo** (pg-mem no revierte de verdad): escribir en el mismo fichero un arnés
  «rastreador de verbos», mismo molde que `salesRecords.test.ts:5-16` (envuelve `query`, registra el
  verbo SQL, opcionalmente falla en uno dado), para usarlo en las Fases 1 y 6 en vez de comprobar
  filas reales. Confirmado por lectura: `auth/users.ts:147` ya da el `ROLLBACK` de pg-mem por
  «imposible de probar», así que T0 puede salir rojo.

## Fase 1 · `db/transaccion.ts` — RED → GREEN

- [ ] 1.1 RED en `transaccion.test.ts`: `enTransaccion(db, fn)` hace `BEGIN` antes de `fn`, `COMMIT`
  tras `fn`; si `fn` lanza, `ROLLBACK` y re-lanza; el cliente se libera (`release`) siempre, con o sin
  error. Usa el arnés de 0.3 si T0 fue rojo. Nace roja: el módulo no existe.
- [ ] 1.2 GREEN: crear `apps/desk/server/db/transaccion.ts`, `enTransaccion<T>(db, fn)`, mismo molde
  que `eliminarTicket.ts:175-189` y el bloque try/catch de `repo.ts:403-415`.
- [ ] 1.3 Confirmar verde. RQ: `tickets-core` RQ-TC-16.

## Fase 2 · `repo.ts` — `opts.transaccionAbierta` — RED → GREEN

- [ ] 2.1 RED en `packages/zoho-sync/src/db/repo.test.ts` (junto a `describe('createTicket
  (Subsistema C)'`, `:188`): con `{ transaccionAbierta: true }` y un `Queryable` sin `connect`,
  `createTicket` no intenta abrir ni cerrar transacción propia — usa el `db` recibido tal cual. Nace
  roja: el 3.er parámetro no existe.
- [ ] 2.2 GREEN: editar `repo.ts:380` (firma, 3.er parámetro `opts: { transaccionAbierta?: boolean } =
  {}`) y `repo.ts:404` (condición, `opts.transaccionAbierta ||` delante de `typeof pool.connect !==
  'function'`). Las dos ediciones EN SU SITIO — confirmado sin desplazamiento contra HEAD.
- [ ] 2.3 Confirmar verde. RQ: `tickets-core` RQ-TC-16.

## Fase 3 · `getEquipoBySerial` + exportar `camposHojaDeVida` — RED → GREEN

- [ ] 3.1 RED en `apps/desk/server/db/equipos.test.ts`: dos equipos con el mismo serial normalizado
  (`"SN-1"` y `" Sn-1 "`), uno activo y otro no → devuelve el ACTIVO más antiguo; sólo inactivos →
  el inactivo más antiguo; serial inexistente → `null`. Nace roja: la función no existe.
- [ ] 3.2 GREEN: añadir `getEquipoBySerial` al FINAL de `apps/desk/server/db/equipos.ts` (tras la
  línea 381, sin desplazar nada existente), con el SQL de `design.md` §3 (`lower(trim(serial))`,
  `ORDER BY active DESC, created_at ASC, id ASC LIMIT 1`).
- [ ] 3.3 `routes/equipos.ts:144`: anteponer `export` a `async function camposHojaDeVida` — única
  edición de ese fichero antes de la Fase 9, misma línea, sin desplazamiento.
- [ ] 3.4 Confirmar verde. RQ: `tickets-core` RQ-TC-15.

## Fase 4 · `services/equipoNuevo.ts` — `exigirEquipoNuevo` — RED → GREEN (criterios 3-4)

- [ ] 4.1 RED, al final de `ticketService.test.ts` (tras `:497`): criterio 3 — `clasificaciones:
  'Equipo nuevo'`, sin `equipoId` ni `serial`/`modeloId`/`fechaFacturaCompra` → `422` listando TODOS
  los que faltan; criterio 4 — datos obligatorios completos y `driveUrl` inválido → `422` con el
  mensaje de `camposHojaDeVida` (F1B-02). Nacen rojas: la rama no existe.
- [ ] 4.2 GREEN: crear `apps/desk/server/services/equipoNuevo.ts` con `exigirEquipoNuevo(db, body)`:
  guarda 1 (serial/modeloId/fechaFacturaCompra, escalón A), guarda 2 (`getModelo`, `db/catalogo.ts:135`,
  escalón A), resolución por `getEquipoBySerial` o equipo provisional (`id ''`, marca/modelo/tipo del
  catálogo, sin `clientId`); y la validación C de los 4 campos opcionales reutilizando
  `camposHojaDeVida` (`routes/equipos.ts:144-189`) vía import.
- [ ] 4.3 Confirmar verde. RQ: `tickets-core` RQ-TC-04 (excepción), RQ-TC-15.

## Fase 5 · Integración en `ticketService.ts` — RED → GREEN (criterios 1, 2, 6)

- [ ] 5.1 RED: criterio 1 (alta válida crea un equipo nuevo con `clientId` del ticket), criterio 2
  (serial existente se reutiliza, `COUNT(equipos)` no cambia), criterio 6 (Mantenimiento/Soporte
  remoto sin `equipoId` sigue `422 'Falta el equipo'`, aunque `clasificaciones` sea otra cosa). Nacen
  rojas.
- [ ] 5.2 GREEN, ediciones EN SU SITIO salvo la desviación anotada arriba: `:2` retira `createTicket`
  del import de `repo`; `:18` (línea en blanco) pasa a ser el import de `./equipoNuevo`; `:23` amplía
  la condición a `if (!equipoId && b.clasificaciones !== 'Equipo nuevo') throw …`; `:24-25` resuelven
  `nuevo`/`equipo` con `exigirEquipoNuevo` cuando aplica o con `getEquipo` si no — **dos `const`
  separados, sin comprimir** (desviación); `:89` gana la llamada a la validación C de campos
  opcionales, el comentario del `409` se conserva reescrito debajo; `:101` llama a
  `crearTicketConEquipo` en vez de `createTicket`.
- [ ] 5.3 Confirmar verde. RQ: `tickets-core` RQ-TC-04, RQ-TC-05, RQ-TC-15. Escenario «Mantenimiento
  sin equipo sigue rechazándose».

## Fase 6 · Atomicidad — RED → GREEN (criterio 5, RQ-TC-16)

- [ ] 6.1 RED: escenario «una guarda posterior falla y no queda equipo creado» — datos de equipo
  nuevo válidos + OV ya asociada a otro ticket → `409` y `COUNT(equipos)` SIN cambios (o el arnés de
  0.3 si T0 fue rojo: secuencia `BEGIN, INSERT equipos, INSERT tickets(throw), ROLLBACK`, sin
  `COMMIT`). Nace roja.
- [ ] 6.2 GREEN, en `equipoNuevo.ts`: `crearTicketConEquipo(db, nuevo, clienteNombre, input)` — si el
  equipo está registrado o reutilizado, llama a `createTicket(db, input)` idéntico a hoy; si no,
  `enTransaccion(db, q => { id = createEquipo(q, {...}); return createTicket(q, {...input, equipoId:
  id}, { transaccionAbierta: true }) })`.
- [ ] 6.3 Confirmar verde. RQ: `tickets-core` RQ-TC-16.

## Fase 7 · Pruebas de POSICIÓN P1-P7 (regla de mutación 1, obligatorias)

Cada `P` activa DOS guardas a la vez. Escribir el `it`, confirmar verde con el orden ya correcto de la
Fase 5-6, aplicar la mutación exacta, confirmar que ESE `it` (y sólo el esperado) se pone rojo,
revertir con `git diff`, registrar en `apply-progress.md` (nombre del `it`, mutación, diff de
reversión). RQ: `tickets-core` RQ-TC-05 (subtabla de la rama), `design.md` §1.

- [ ] 7.1 **P1** — faltan datos del equipo nuevo + OV inexistente → `422` de datos. Mutación: bajar la
  guarda 1 (`:24`) por debajo de la guarda de OV (`:37`).
- [ ] 7.2 **P2** — modelo inexistente + fecha inválida → `422 'Modelo no encontrado'`. Mutación:
  validar los campos opcionales DENTRO de `exigirEquipoNuevo`, antes de resolver el modelo.
- [ ] 7.3 **P3** — OV inexistente + Drive inválido → `422` de OV. Mutación: subir la validación C
  (`:89`) por encima de la guarda de OV (`:37`) — el molde IV-12.
- [ ] 7.4 **P4** — serial reutilizado de otro cliente + fecha inválida → `422` equipo↔cliente.
  Mutación: subir `:89` por encima de `:59`.
- [ ] 7.5 **P5** — cliente inexistente + fecha inválida (vecina de arriba) → `422 'Cliente no
  encontrado'`. Mutación: intercambiar `:87-88` con `:89`.
- [ ] 7.6 **P6** — fecha inválida + OV ya usada (vecina de abajo) → `422`, no `409`. Mutación: bajar
  `:89` por debajo de `:94-98`.
- [ ] 7.7 **P7** — equipo nuevo válido + OV ya usada → `409` y `COUNT(equipos)` sin cambios (criterio
  7 de `proposal.md`). Mutación: crear el equipo ANTES de la guarda de `:94`.

## Fase 8 · Cierre de mutaciones — verificación cruzada

- [ ] 8.1 Confirmar que cada mutación de las Fases 0, 1 (implícita en 1.1) y 7 quedó revertida:
  `git diff --stat` vacío sobre archivos de producción tras cada reversión, antes de pasar a la
  siguiente.
- [ ] 8.2 Confirmar que ninguna mutación de la Fase 7 puso en rojo un `it` DISTINTO del nombrado — si
  lo hace, el par de guardas elegido no aísla lo que P-n afirma aislar; ajustar el escenario, no el
  código de producción.

## Fase 9 · Cliente — `CreateTicket.tsx` (sin red de pruebas, F0-00)

- [ ] 9.1 Añadir estado `equipoNuevo` (serial, `modeloId`, `fechaFacturaCompra` obligatorios;
  `fechaAdquisicion`, `finGarantia`, `codigoInterno`, `driveUrl`, `mantenedorId` opcionales, con
  `searchClients` para el mantenedor); mostrar el bloque sólo con `clasificaciones === 'Equipo nuevo'`
  y sin `equipo` elegido. El buscador de equipos existentes se queda como está.
- [ ] 9.2 Extender la guarda de `submit` (`:183`) para aceptar el bloque completo como alternativa a
  `equipo`, y mandar `equipoNuevo` en el payload de `createTicket` (`:184-191`) cuando aplica.
- [ ] 9.3 Añadir `equipoNuevo?: {...}` a `CreateTicketPayload`
  (`packages/shared/src/types.ts:316-327`), campo nuevo sin tocar los existentes; `client.ts:286`
  (`createTicket`) no cambia de código — ya reenvía el payload completo.
- [ ] 9.4 Comodidad de vista previa: código y asunto calculados con la serie/modelo nuevos
  (`buildCodigoServicio`/`buildSubject`, ya importados) — el servidor acepta el valor recibido
  (`ticketService.ts:99-100`), igual que hoy.

**Tabla de la regla de mutación 3** (`CLAUDE.md`) — toda decisión del cliente, con la línea del
servidor que la impone:

| Decisión del cliente | Impuesta en |
|---|---|
| Enseña el bloque sólo con «Equipo nuevo» | `ticketService.ts:23` (condición ampliada, Fase 5.2) |
| Marca obligatorios serie, modelo y fecha de compra | `exigirEquipoNuevo`, guarda 1 (Fase 4.2) |
| Ofrece sólo modelos del catálogo | `exigirEquipoNuevo`, guarda 2 vía `getModelo` (Fase 4.2) |
| Usa inputs de tipo fecha y un campo Drive | `camposHojaDeVida` (`routes/equipos.ts:144-189`, Fase 4.2) |
| Avisa de que el serial ya está registrado y ofrece «usar ese equipo» | `getEquipoBySerial` (Fase 3.2) — reutiliza aunque el cliente no avise |
| No pide cliente del equipo | `crearTicketConEquipo` usa `input.clientId` (Fase 6.2) |
| Calcula la vista previa de código y asunto | Comodidad; el servidor acepta el valor recibido, no lo deriva (a1) |

## Fase 10 · Cierre

- [ ] 10.1 `npm test` completo en verde; registrar el recuento total (pasadas/omitidas/ficheros) en
  `apply-progress.md`.
- [ ] 10.2 `npm run typecheck` en verde, sin salida.
- [ ] 10.3 `npm run lint -- --max-warnings 165` en verde; confirmar 0 warnings NUEVOS sobre la base
  preexistente (158 en el precedente más reciente de este árbol, `orden-precedencia-guardas`).
- [ ] 10.4 **Barrido de citas (regla de mutación 4), OBLIGATORIO — CUATRO ficheros.** Método:
  `grep -rnoE "ticketService\.ts:[0-9]+(-[0-9]+)?"`, y lo mismo acotado a `repo\.ts`, a
  `db/equipos\.ts` y a `routes/equipos\.ts`; segundo pase por la forma ABREVIADA (sin nombre de
  fichero) en los ficheros que ya citan estos módulos (`tickets-core/spec.md`,
  `ticketService.test.ts`, `CLAUDE.md`, `openspec/config.yaml`). Comprobar CADA cita contra lo que
  AFIRMA, no sólo que la línea exista; los dos extremos de cada rango por separado. Clasificar A
  (reapuntar), B (conservar con su revisión) o C (superado). **Las citas dentro de
  `openspec/changes/archive/` NO se reparan** (E-032).
  - `ticketService.ts`: es el único de los cuatro donde se espera desplazamiento real, desde `:24`
    hacia abajo, por la desviación de diseño de la Fase 5.2 — repárense las que rompa, empezando por
    las de este mismo delta (`spec.md:88-94`, `:113-115`).
  - `repo.ts`, `db/equipos.ts`, `routes/equipos.ts`: sin desplazamiento esperado (confirmado contra
    HEAD en las Fases 2.2, 3.2-3.3) — el barrido aquí es de VERIFICACIÓN, no se espera reparación.
- [ ] 10.5 `apply-progress.md`: T0 (resultado y plan usado), las 7 reversiones de P1-P7 con su diff,
  medida final `git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin trackear (regla del
  ciclo 2 — informe de fase incluido en la medida).

## No entra en `sdd-apply` — registrado, no ejecutado aquí

- El segundo cambio de F1B-14 (`edicion-comercial-equipo`): restricción por área del `PATCH`, registro
  de cambios, botón «Editar» (`proposal.md`, Encuadre).
- `UNIQUE` en `equipos.serial`: riesgo declarado y fuera de alcance (`proposal.md`, Riesgos).
- Medir duplicados de serial en producción: comprobación de persona (`design.md`, Migración/Abiertas).
- Fusión del delta de `tickets-core` en `openspec/specs/`: trabajo de `sdd-archive`.

## Riesgos de dependencia entre fases

- Fases 1-3 son independientes entre sí y pueden avanzar en paralelo; la Fase 4 depende de las tres.
- Fase 5 depende de la 4; Fase 6 depende de la 5 y de la 1 (usa `enTransaccion`); Fase 7 depende de que
  5 y 6 estén en verde — mutar antes de tiempo no prueba nada.
- Fase 9 (cliente) es independiente de las Fases 0-8 salvo por el tipo `CreateTicketPayload` (9.3):
  puede empezar en paralelo si ese campo se acuerda primero.
- Fase 10.4 depende de TODAS las anteriores — es la única forma de saber si la desviación de diseño
  (Fase 5.2) rompió alguna cita.
