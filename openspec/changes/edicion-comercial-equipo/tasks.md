# Tasks — `edicion-comercial-equipo` (F1B-14, cambio 2, `cierra: si`)

**Fase:** `sdd-tasks` · **Árbol:** `0807a77` (limpio) · **Entradas:** `proposal.md`, `design.md`,
`specs/hojas-vida/spec.md` de esta misma carpeta. Verificado contra HEAD: `routes/equipos.ts` (1-189),
`db/equipos.ts` (1-404), `types.ts` (539-554), `migrate.ts` (60-81), `migrate.test.ts` (270-298),
`schema.sql` (440-483, 483 líneas totales), `index.ts` (1-20), `permissions.ts:4`,
`testing/appHarness.ts` (1-96), `equipos.test.ts` (1-30, 360 líneas totales) — todas las líneas citadas
por `design.md` coinciden byte a byte con el árbol de hoy.

## Review Workload Forecast

### Estimación por lote (código + pruebas, contando lo nuevo sin trackear)

| Lote | Bloque | Líneas |
|---|---|---|
| 1 | `packages/shared/src/equipoComercial.ts` + `.test.ts` (D1) | 45 + 70 |
| 1 | `packages/shared/src/index.ts` (línea 21, al final) + `types.ts` (`CambioEquipo`, `CampoComercial`, campo `cambios`) | 1 + 12 |
| 1 | `routes/equipos.ts` (imports `:4-5` en su sitio, PATCH `:96+`, D7, D4 en `:39/:41`) | ≈25 |
| 1 | `db/equiposCambios.ts` + `.test.ts` (D3, D5) | 55 + 60 |
| 1 | `db/equipos.ts` (`:249` D4 en su sitio + re-exportación al final, D5) | 4 |
| 1 | `schema.sql` + `migrate.ts` + `migrate.test.ts` (D3, regla de mutación 2) | 10 + 2 + 8 |
| 1 | `equipos.test.ts` — RQ-HV-09..12, RQ-HV-11 vía ticket, mutaciones M1-M11 | ≈210 |
| 1 | **+ dos pruebas HTTP añadidas por el orquestador** (`cambios` en `/historial`; supervivencia tras `DELETE`) | ≈25-40 |
| 1 | **Subtotal lote 1** | **≈505-570** (diseño 480-530 + extras del orquestador) |
| 2 | `EquiposAdmin.tsx` (exportar `EquipoForm` en `:95`, bloqueo de los tres restringidos) | ≈20 |
| 2 | `HojaDeVida.tsx` (botón «Editar», sección «Cambios») | ≈60 |
| 2 | **Subtotal lote 2** | **≈70-90** |
| — | **Total `sdd-apply`** | **≈575-660** |

### Informes, como sumandos del presupuesto de 800 por intento del ledger (`openspec/config.yaml:22-30`)

| Informe | Precedente medido |
|---|---|
| `apply-progress.md` (uno por lote o uno acumulado, según cómo se secuencien los intentos) | 76-272 líneas (`alta-equipo-nuevo-en-ticket` 242, `orden-precedencia-guardas` 272, `hojas-vida` 76) |
| `verify-report.md` | 206-358 líneas |
| `archive-report.md` (la fusión del delta por ID de requisito **se mide**, no se estima — regla del ciclo 2 de `CLAUDE.md`) | 110-264 líneas de informe; 250-450 con la fusión, según `proposal.md` |

**Riesgo por intento:** lote 1 (505-570) + `verify-report.md` (206-358) en el MISMO intento = 711-928 —
pasa 800 en la mitad alta del rango y roza el techo incluso en la mitad baja. Lote 1 + su propio
`apply-progress.md` (76-272) ya puede rozar 800 por sí solo (581-842). Lote 2 (70-90) no arrastra riesgo.
**Recomendación: un intento de `sdd-apply` por lote** (lote 1, cierre, commit; lote 2 después, mismo
cambio — regla del ciclo 2, no PRs nuevos) **y `sdd-verify` como intento aparte** de cualquiera de los
dos. Si la medida real de lote 1 (`git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin
trackear) supera 750, pedir techo aprobado antes de seguir, como el precedente de
`detector-citas-extremos` (techo 5.000 aprobado).

| Campo | Valor |
|---|---|
| Líneas estimadas (`sdd-apply`, total) | ≈575-660 |
| 400-line budget risk | **High** — lote 1 solo (505-570) ya supera 400 |
| Chained PRs recommended | **Yes** — dos lotes ya mandatados por el diseño; cada uno cierra con `npm test`/`typecheck`/`lint` como punto de commit independiente |
| Chain strategy | **stacked-to-main** — este repositorio no usa ramas de PR (commits directos a `main`, ver el historial de `alta-equipo-nuevo-en-ticket`); lote 1 se commitea, luego lote 2 |
| Decision needed before apply | **Yes** (`ask-on-risk`) — el orquestador confirma antes de `sdd-apply`: (a) el orden de los dos lotes, y (b) si `sdd-verify` corre como intento propio para no juntar lote 1 + informes en el mismo techo de 800 |
| Delivery strategy | ask-on-risk |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 · Servidor + shared (Fases 1-13) | Guarda de área, registro de cambios, lectura ampliada, RQ-HV-09..12 (servidor) | Commit 1 | `npx vitest run packages/shared/src/equipoComercial.test.ts apps/desk/server/db/equiposCambios.test.ts apps/desk/server/equipos.test.ts packages/zoho-sync/src/db/migrate.test.ts` | `npm test` contra pg-mem, sin credenciales Zoho | `git revert`: tabla aditiva (`IF NOT EXISTS`), queda huérfana sin efecto (plan de vuelta atrás de `proposal.md`) |
| 2 · Cliente (Fases 14-16) | Botón «Editar», bloqueo de los tres restringidos, sección «Cambios» | Commit 2 (mismo cambio) | N/A — `.tsx` fuera de la red de pruebas (F0-00) | Comprobación de persona en `ambientalia-desk.ambientalia.cloud`: editar con y sin sesión Comercial | `git revert` del bloque JSX; no toca contratos de servidor |

---

## Fase 1 · `packages/shared/src/equipoComercial.ts` — RED → GREEN (D1, D2)

- [x] 1.1 RED en `packages/shared/src/equipoComercial.test.ts`: normalización de `cambiosComerciales`
  (`'' → null`, `null` sin cambio, clave ausente no cuenta, fecha igual no cambia);
  `puedeEditarCamposRestringidos` verdadero con área `Comercial` y con `isAdmin`, falso con áreas
  vacías o distintas. Nace roja: el módulo no existe.
- [x] 1.2 GREEN: crear `equipoComercial.ts` — `CAMPOS_COMERCIALES` (seis), `CAMPOS_COMERCIALES_RESTRINGIDOS`
  (tres), `ETIQUETA_CAMPO_COMERCIAL`, `puedeEditarCamposRestringidos(areas, isAdmin)` =
  `canExecuteTransition(areas, isAdmin, 'Comercial')` (`permissions.ts:4`), `cambiosComerciales(guardado,
  entrante)` (D2: omite ausentes, `nuevo = entrante[c] ? String(entrante[c]) : null`, `anterior =
  guardado[c] || null`, cambia si `anterior !== nuevo`).
- [x] 1.3 Confirmar verde. RQ: RQ-HV-09, RQ-HV-10.
- [x] 1.4 Añadir `export * from './equipoComercial'` como línea 21, al final de
  `packages/shared/src/index.ts` (hoy termina en `:20`, sin desplazar nada).

## Fase 2 · Mutaciones unitarias — M4, M9

- [x] 2.1 **M9**: en `cambiosComerciales`, quitar la normalización `'' → null`. Confirmar que
  `equipoComercial.test.ts` se pone rojo. Revertir (`git diff` limpio).
- [x] 2.2 **M4**: en `puedeEditarCamposRestringidos`, quitar la vía de `isAdmin`. Confirmar rojo.
  Revertir.

## Fase 3 · `camposHojaDeVida` distingue escalón A/C — RED → GREEN (D7)

- [x] 3.1 RED en `apps/desk/server/equipos.test.ts`: `camposHojaDeVida` devuelve `{ error, escalon: 'A'
  }` cuando el mantenedor no existe (`routes/equipos.ts:152`), y `{ error, escalon: 'C' }` para fecha o
  Drive inválidos. Nace roja: el campo `escalon` no existe.
- [x] 3.2 GREEN: en `routes/equipos.ts:144-189`, el `return { error: ... }` de `:152` (mantenedor no
  encontrado) gana `escalon: 'A'`; los demás `return { error: ... }` (fechas, Drive) ganan `escalon:
  'C'`. 0 líneas netas (D7).
- [x] 3.3 Confirmar verde. Confirmar que los llamadores existentes (`:61` mismo fichero,
  `services/equipoNuevo.ts:71-72`) siguen en verde sin cambios — sólo miran `'error' in`.

## Fase 4 · `apps/desk/server/db/equiposCambios.ts` — RED → GREEN (D3, D5)

- [x] 4.1 RED en `apps/desk/server/db/equiposCambios.test.ts`: `registrarEdicion` inserta una fila por
  cada campo de `cambios` con persona/fecha-hora/anterior/nuevo; `listarCambiosEquipo` devuelve
  `created_at DESC, id DESC` y resuelve el nombre del mantenedor (`LEFT JOIN clients … AND c.campo =
  'mantenedorId'`); las filas sobreviven a `deleteEquipo` (`db/equipos.ts:158-160`), llamado
  directamente tras insertar filas de prueba. Nace roja: el módulo no existe / la tabla no existe.
- [x] 4.2 GREEN: crear `equiposCambios.ts` — sólo importa `enTransaccion` (`db/transaccion.ts:13`), sin
  ciclo. `registrarEdicion(db, equipoId, cambios, persona, escribir)`: `enTransaccion(db, q => {
  escribir(q); INSERT × N filas })`. `listarCambiosEquipo(db, equipoId)`: `SELECT … ORDER BY created_at
  DESC, id DESC`.
- [x] 4.3 Confirmar verde. RQ: RQ-HV-10.
- [x] 4.4 En `db/equipos.ts`, tras `:403` (final del fichero), añadir `export { registrarEdicion,
  listarCambiosEquipo } from './equiposCambios'` con un comentario que explique por qué está ahí (D5:
  evita desplazar 11 citas completas + 2 abreviadas). En `routes/equipos.ts:5`, ampliar el import de
  `../db/equipos` en su sitio con `registrarEdicion, listarCambiosEquipo`.

## Fase 5 · Esquema `public.equipos_cambios` — RED → GREEN (D3, regla de mutación 2)

- [x] 5.1 RED en `packages/zoho-sync/src/db/migrate.test.ts`: ampliar el recuento de `:282-286` a `[10,
  18, 3]` / `31` tablas totales (hoy `[10, 17, 3]` / `30`); confirmar que `equipos_cambios` existe tras
  `migrate(db)`, con su índice. Nace roja: la tabla no existe y el recuento sigue en 30/17.
- [x] 5.2 GREEN: al final de `schema.sql`, `CREATE TABLE IF NOT EXISTS public.equipos_cambios (id
  bigserial PRIMARY KEY, equipo_id text NOT NULL, campo text NOT NULL, valor_anterior text, valor_nuevo
  text, usuario_id text NOT NULL, usuario_nombre text NOT NULL, created_at timestamptz NOT NULL
  DEFAULT now())` + `CREATE INDEX IF NOT EXISTS idx_equipos_cambios_equipo ON
  public.equipos_cambios (equipo_id)`. Sin FK (c4). Añadir `'equipos_cambios'` al final de la MISMA
  línea `migrate.ts:73` (`PUBLIC_TABLES`), sin desplazar `migrate.ts:80`.
- [x] 5.3 Confirmar verde.
- [x] 5.4 **M7** (regla de mutación 2 — mutar el FICHERO VIGILADO): en `schema.sql`, escribir la tabla
  sin calificar (`CREATE TABLE IF NOT EXISTS equipos_cambios (...)`). Confirmar rojo en
  `migrate.test.ts`. Revertir. Repetir quitando `'equipos_cambios'` de `PUBLIC_TABLES` (dejando la tabla
  calificada en el `.sql`). Confirmar rojo por el lado de clasificación. Revertir.

## Fase 6 · Atomicidad — RED → GREEN, mutaciones M6, M10

- [x] 6.1 RED en `equiposCambios.test.ts`, con `rastreadorDeVerbos` (`transaccion.test.ts:59`): camino
  feliz → `BEGIN, UPDATE, INSERT×N, COMMIT`; `escribir` que lanza tras el `UPDATE` → `BEGIN, UPDATE,
  ROLLBACK`, sin `INSERT` de registro ni `COMMIT`. Nace roja: `registrarEdicion` aún no envuelve nada en
  transacción propia verificable por el arnés (o ya lo hace desde 4.2 — si ya está verde, esta tarea
  pasa a ser la prueba que 4.1 no cubrió: dejarla explícita igual, por claridad del arnés).
- [x] 6.2 GREEN: confirmar (o ajustar) que `registrarEdicion` llama a `escribir(q)` ANTES de las
  `INSERT` del registro, todo dentro de `enTransaccion`.
- [x] 6.3 Confirmar verde. RQ: RQ-HV-10.
- [x] 6.4 **M6**: quitar `enTransaccion` de `registrarEdicion` (llamar `escribir` y las `INSERT` sueltas,
  sin `BEGIN`/`ROLLBACK`). Confirmar rojo en el escenario de fallo de 6.1. Revertir.
- [x] 6.5 **M10**: invertir el orden — insertar las filas de registro ANTES de llamar a `escribir(q)`.
  Confirmar rojo (la secuencia de verbos no coincide, o el escenario de fallo deja filas de registro
  huérfanas sin el `UPDATE`). Revertir.

## Fase 7 · `PATCH /api/equipos/:id` — RED → GREEN (D8, guarda de área, criterios 1-4 y 7)

- [x] 7.1 RED en `equipos.test.ts` (dentro de «Hoja de vida — F1B-02» o describe nuevo): (1) sin
  Comercial, los tres restringidos IGUALES a lo guardado + `driveUrl` distinto → `200`, sólo `driveUrl`
  escrito. (2) sin Comercial, `fechaFacturaCompra` distinta de la guardada → `403`, nada escrito, 0
  filas. (3) con `userCookie(['Comercial'])` o `adminCookie()`, cambia los tres → `200`, los tres
  escritos. (4) desactivar (`PATCH { active }` solo) sigue funcionando para cualquier sesión, sin
  registro. Nacen rojas: no hay guarda de área ni registro todavía.
- [x] 7.2 GREEN en `routes/equipos.ts`: `:4` amplía el import de `@ambientalia/shared` en su sitio con
  `cambiosComerciales, CAMPOS_COMERCIALES_RESTRINGIDOS, puedeEditarCamposRestringidos`. En el `PATCH`
  (a partir de `:96`), tras `camposHojaDeVida` y antes de escribir: calcular `cambiosComerciales(actual,
  b)` (donde `actual = getEquipoFull` ya resuelto en `:75`), filtrar por
  `CAMPOS_COMERCIALES_RESTRINGIDOS`; si alguno cambia y `!puedeEditarCamposRestringidos(user.areas,
  user.isAdmin)` → `403`, nada escrito. Si pasa, `updateEquipo` (o `active`) se ejecuta dentro de
  `registrarEdicion(db, id, cambiosComerciales(actual, b), persona, q => updateEquipo(q, id, patch))`
  cuando `Object.keys(patch).length`; `setEquipoActive` queda FUERA de `registrarEdicion` (no genera
  registro, criterio 7).
- [x] 7.3 Confirmar verde. RQ: RQ-HV-09, RQ-HV-10.

## Fase 8 · Precedencia A<B<C — RED → GREEN, mutaciones M1, M2, posición A<B

- [x] 8.1 RED — «El escalón A gana a la guarda de área»: sin Comercial, `mantenedorId` no resuelve +
  distinto del guardado → `422 'Mantenedor no encontrado'`, no `403`.
- [x] 8.2 RED — «El escalón B gana al 422 de contenido»: sin Comercial, `fechaFacturaCompra` con
  formato inválido y distinta de la guardada → `403`, no `422`.
- [x] 8.3 RED — «Posición A<B» (criterio 5 de `proposal.md`): sin Comercial, `PATCH` a un `id`
  inexistente con `finGarantia` → `404`, no `403`.
- [x] 8.4 GREEN: confirmar verde con el orden ya construido en la Fase 7 (paso 4 de D8 entre el escalón
  A de `camposHojaDeVida` y su escalón C) — si alguno de 8.1-8.3 sigue rojo, ajustar el orden de
  evaluación en `routes/equipos.ts`, no las condiciones.
- [x] 8.5 RED — P-AB: sin Comercial, `finGarantia` cambiada + `mantenedorId` inexistente → `422`
  mantenedor. **M1**: mover el `403` ANTES del paso 3 (escalón A de `camposHojaDeVida`). Confirmar rojo.
  Revertir.
- [x] 8.6 RED — P-BC: sin Comercial, `finGarantia` válida cambiada + Drive `http://` → `403`; el MISMO
  cuerpo con Comercial → `422`. **M2**: mover el `403` DESPUÉS del paso 5 (escalón C). Confirmar rojo en
  este escenario Y en el de 8.2. Revertir.
- [x] 8.7 Confirmar las siete pruebas de esta fase en verde a la vez (verificación cruzada, regla de
  mutación 1). RQ: RQ-HV-09.

## Fase 9 · Guarda por cambio real, no por presencia — mutaciones M3, M5

- [x] 9.1 RED en `equipos.test.ts` (criterio 4 de `proposal.md`): `PATCH` autorizado que cambia
  `codigoInterno` y `driveUrl` (dos de seis) deja EXACTAMENTE dos filas de registro; los otros cuatro no
  generan fila. `PATCH` con los seis IGUALES a lo guardado → `200`, cero filas.
- [x] 9.2 Confirmar verde (la implementación de las Fases 1, 4 y 7 ya debería cubrirlo — si no, ajustar
  el filtro de `cambiosComerciales` en `registrarEdicion` para cubrir los SEIS campos, no sólo los tres
  restringidos).
- [x] 9.3 **M3**: cambiar la condición del `403` (Fase 7.2) para disparar por PRESENCIA de la clave en
  el cuerpo en vez de por VALOR distinto de lo guardado. Confirmar rojo en el escenario 7.1(1) (sin
  Comercial, restringidos iguales + Drive distinto → hoy `200`, con la mutación pasaría a `403`).
  Revertir.
- [x] 9.4 **M5**: hacer que `registrarEdicion` registre los SEIS campos siempre, no sólo los que
  cambian. Confirmar rojo en 9.1 (el `PATCH` de dos campos dejaría seis filas). Revertir.

## Fase 10 · RQ-HV-11 — el alta no aplica guarda ni genera registro — RED → GREEN, mutación M11

- [x] 10.1 RED en `equipos.test.ts`: `POST /api/equipos` sin Comercial con los tres restringidos →
  `201`, sin `403`, 0 filas en `equipos_cambios`.
- [x] 10.2 RED en `ticketService.test.ts` (donde ya vive la prueba de «Equipo nuevo» de
  `alta-equipo-nuevo-en-ticket`): `POST /api/tickets` con `clasificaciones = 'Equipo nuevo'`, datos
  comerciales completos, sin Comercial → `201`, equipo creado, 0 filas en `equipos_cambios`.
- [x] 10.3 Confirmar verde (D9: ni `POST /api/equipos` `:48-71` ni `crearTicketConEquipo`,
  `services/equipoNuevo.ts:80-92`, llaman a `registrarEdicion` — no requiere cambio de producción si la
  Fase 7 sólo tocó el `PATCH`).
- [x] 10.4 **M11**: hacer que `POST /api/equipos` llame a `registrarEdicion` tras `createEquipo`.
  Confirmar rojo en 10.1 (aparecerían filas donde se esperan 0). Revertir.

## Fase 11 · Lectura — orden, mutación M8, y `GET /historial` amplía `cambios` (D4)

- [x] 11.1 **M8** sobre la prueba de orden de 4.1: cambiar `ORDER BY created_at DESC, id DESC` a `ASC`
  en `listarCambiosEquipo`. Confirmar rojo. Revertir.
- [x] 11.2 RED — prueba HTTP añadida por el orquestador (a): en `equipos.test.ts`, tras un `PATCH` que
  cambia un campo, `GET /api/equipos/:id/historial` devuelve `cambios` con esa fila. Nace roja: la
  clave `cambios` no existe en la respuesta.
- [x] 11.3 GREEN (D4): `types.ts` — dentro de `EquipoHistorial` (`:542-546`), añadir la línea `cambios:
  CambioEquipo[]`; detrás del cierre de la interfaz, añadir `CambioEquipo { campo, anterior, nuevo,
  anteriorTexto?, nuevoTexto?, usuarioNombre, fecha }` y `CampoComercial`. `db/equipos.ts:249`
  (`getEquipoHistorial`) pasa a devolver `Omit<EquipoHistorial, 'cambios'>`, en su sitio. `routes/
  equipos.ts:39` usa `String(req.params.id)` en línea (sin variable `id` nueva); `:41` cambia `res.json(h)`
  por `res.json({ ...h, cambios: await listarCambiosEquipo(db, String(req.params.id)) })`, en la MISMA
  línea.
- [x] 11.4 Confirmar verde. RQ: RQ-HV-10.
- [x] 11.5 Mutación de verificación de la prueba (a): quitar `cambios` del `res.json` de `:41`.
  Confirmar que 11.2 se pone roja. Revertir.

## Fase 12 · Prueba HTTP añadida por el orquestador (b) — supervivencia tras `DELETE`

- [x] 12.1 En `equipos.test.ts`: con un equipo que tiene filas de registro (vía un `PATCH` autorizado
  previo), `DELETE /api/equipos/:id` con `adminCookie()` → `200`; una consulta directa a
  `public.equipos_cambios WHERE equipo_id = $1` sigue devolviendo esas filas. Confirmar verde (c4: sin
  `ON DELETE CASCADE`, ya garantizado por el `CREATE TABLE` de la Fase 5 — no requiere cambio de
  producción).
- [x] 12.2 Mutación de verificación (regla de mutación 2, sobre el fichero vigilado): añadir
  temporalmente `REFERENCES public.equipos(id) ON DELETE CASCADE` a la columna `equipo_id` de
  `equipos_cambios` en `schema.sql`. Confirmar que 12.1 se pone rojo (las filas desaparecen). Revertir.
  RQ: RQ-HV-10.

## Fase 13 · Cierre lote 1

- [x] 13.1 `npm test` en verde; registrar recuento (pasadas/ficheros) en `apply-progress.md`.
- [x] 13.2 `npm run typecheck` en verde.
- [x] 13.3 `npm run lint` en verde; confirmar 0 warnings nuevos sobre la base preexistente (158 en el
  precedente más reciente de este árbol).
- [ ] 13.4 Commit del lote 1 — cierre del primer intento de `sdd-apply` (ver Review Workload Forecast).

## Fase 14 · Cliente — `EquiposAdmin.tsx` exporta `EquipoForm` (Enfoque punto 3)

- [ ] 14.1 En `EquiposAdmin.tsx:95`, anteponer `export` al componente `EquipoForm` — sin extraerlo a
  fichero nuevo (evita el diff de movimiento).
- [ ] 14.2 Bloquear en solo lectura los tres campos restringidos (`fechaFacturaCompra`, `finGarantia`,
  `mantenedorId`) cuando `!puedeEditarCamposRestringidos(areas, isAdmin)` (importado de
  `@ambientalia/shared`) — comodidad legítima bajo regla 13.3, impuesta en servidor por la Fase 7.

## Fase 15 · Cliente — `HojaDeVida.tsx` botón «Editar» + sección «Cambios»

- [ ] 15.1 Importar `EquipoForm` desde `EquiposAdmin.tsx` y el hook de sesión existente (`areas`,
  `isAdmin`).
- [ ] 15.2 Botón «Editar» que abre `EquipoForm` en modal (`z-[80]`, por encima de la hoja `z-[75]`,
  `HojaDeVida.tsx:219`); al guardar, recarga `GET /api/equipos/:id` y `/historial`.
- [ ] 15.3 Sección «Cambios»: lista `cambios` de la respuesta ampliada de `/historial` (Fase 11) —
  persona, fecha y hora, campo (vía `ETIQUETA_CAMPO_COMERCIAL`), anterior → nuevo.

## Fase 16 · Cierre lote 2

- [ ] 16.1 `npm test` en verde (no hay pruebas `.tsx`, F0-00; confirma que el servidor/shared no se
  rompió).
- [ ] 16.2 `npm run typecheck` en verde.
- [ ] 16.3 `npm run lint` en verde; 0 warnings nuevos.
- [ ] 16.4 Commit del lote 2.

## Fase 17 · Casilla de la regla de mutación 3 (`CLAUDE.md`) — tras el lote 2

- [ ] 17.1 Confirmar por escrito, decisión a decisión, cada una con la línea del servidor que la impone:

| Decisión del cliente | Impuesta en |
|---|---|
| Bloquear los tres restringidos en edición si `!puedeEditarCamposRestringidos` | Fase 7.2 (el `403` nuevo, paso 4 de D8) |
| No bloquear nada en el alta (`equipo === null`) | Ninguna, a propósito: el alta es libre (a1, `routes/equipos.ts:48-71`) |
| Mandar los seis campos siempre | D2, `cambiosComerciales` compara contra lo guardado |
| Botón «Editar» visible para toda sesión | `requireAuth` en `routes/equipos.ts:73` |
| Sección «Cambios» visible | `listarCambiosEquipo` (Fase 4, Fase 11) |

## Fase 18 · Cierre general — barrido de citas (regla de mutación 4, OBLIGATORIO)

- [ ] 18.1 `grep -rnoE "routes/equipos\.ts:[0-9]+(-[0-9]+)?"` y `grep -rnoE "db/equipos\.ts:[0-9]+(-[0-9]+)?"`
  sobre el repositorio (fuera de `archive/`). Comprobar CADA resultado contra el árbol final, los dos
  extremos de cada rango por separado, clasificando A (reapuntar), B (conservar con su revisión) o C
  (superado).
  - Reapuntar lo que `design.md` (§«Barrido de citas») ya identificó como desplazado desde `routes/
    equipos.ts:97` en adelante: `services/equipoNuevo.ts:64`; en la delta, `:18`, `:30`, `:75`, `:80`,
    `:116`; en la spec viva, la abreviada `:99` de `hojas-vida/spec.md:70`.
  - Comprobar sin tocar las citas que `design.md` predijo iguales (por encima de `:97`, o de
    `db/equipos.ts` sin desplazamiento salvo `:249` en su sitio).
  - Verificar el Caso B declarado en `design.md`: `config.yaml:2784` (`:73`) sigue apuntando a la línea
    correcta, pero «deja editar a cualquiera» deja de ser cierto — nombrar `0807a77`.
- [ ] 18.2 Segundo pase por la forma ABREVIADA (sin nombre de fichero) en los ficheros que ya citan estos
  módulos: `hojas-vida/spec.md`, `CLAUDE.md`, `openspec/config.yaml`. Incluye las abreviadas de
  `HojaDeVida.tsx:159-165` (imports nuevos) y `EquiposAdmin.tsx:148` (ya incorrecta en `0807a77`, caso A
  independiente de este cambio, según `design.md`).
- [ ] 18.3 Confirmar `types.ts`: sin citas vivas a partir de `:546` (verificado en `design.md` el
  2026-09-25); repetir la comprobación sobre el árbol final por si este mismo cambio introdujo una.
- [ ] 18.4 Tras el commit final del cierre: `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha
  HEAD`. Confirmar verde antes de pasar a `sdd-verify`.

## Comprobaciones de persona (regla del ciclo 1 — NO son casillas contables)

RQ-HV-12 sólo se puede comprobar en el DOM de `HojaDeVida.tsx`, fuera de la red de pruebas (F0-00). **No
se cuentan en el recuento de tareas y archivar este cambio NO las da por hechas.**

| # | Comprobación | Dueño | Dónde queda escrito |
|---|---|---|---|
| Persona-1 | Botón «Editar» abre el formulario | Comercial/Gerencia, staging | `specs/hojas-vida/spec.md` (RQ-HV-12, tras fusión) |
| Persona-2 | Sin área Comercial ni admin, los tres restringidos están en solo lectura | Comercial/Gerencia, staging | ídem |
| Persona-3 | La sección «Cambios» enseña las filas del equipo | Comercial/Gerencia, staging | ídem |

## No entra en `sdd-apply` — registrado, no ejecutado aquí

- Restringir el ALTA (`POST /api/equipos`, alta desde el ticket) — sigue sin filtro, a propósito
  (supuesto a1).
- Auditar `serial`, `clientId`, `modeloId` o `active` (supuesto b3).
- Restricción por cargo (`decision/c10-permisos-cargo`, fuera de su lista de excepciones).
- La guarda del mantenedor sobre la orden de venta (F1B-11, IV-8).
- **Va en `sdd-archive`, no aquí**: fusión de la delta por ID de requisito (RQ-HV-09..12) y aplicación de
  la sección «Nota de fusión — §2 "Fuera de alcance" de la spec viva» de la delta, por su título (D10).

## Riesgos de dependencia entre fases

- Fases 1-3 son independientes entre sí; la Fase 4 no depende de ellas (sólo de `enTransaccion`
  existente). La Fase 5 (esquema) es independiente de las Fases 1-4.
- Fase 7 depende de las Fases 1, 3, 4 y 5 (usa `cambiosComerciales`, `camposHojaDeVida` con `escalon`,
  `registrarEdicion`, y la tabla ya creada).
- Fases 8-12 dependen de la 7 en verde — mutar antes de tiempo no prueba nada (regla de mutación 1).
- Fase 14-16 (cliente) son independientes de las Fases 1-13 salvo por `puedeEditarCamposRestringidos` y
  `ETIQUETA_CAMPO_COMERCIAL` (Fase 1) y la forma de la respuesta de `/historial` (Fase 11): pueden
  empezar en paralelo si esas dos piezas se acuerdan primero.
- Fase 18 depende de TODAS las anteriores — es la única forma de saber si los desplazamientos reales
  coinciden con lo que predijo `design.md`.
