# Tasks — `foto-solo-con-novedad` (F1B-04, cambio 1, `cierra: no`)

**Fase:** `sdd-tasks` · **Árbol:** `a0a2935` (limpio) · **Entradas:** `proposal.md`, `design.md`,
`specs/remisiones/spec.md` de esta misma carpeta. Verificado contra HEAD (spot-check, no re-verificación
íntegra de `design.md`): `routes/remision.ts` (1-15, 238-302), `db/remisiones.ts` (1-55, 195-211),
`types.ts` (708-735), `schema.sql` (495-507), `remision.ts` (85-102), `index.ts:14`,
`remision.test.ts` (1-2), `remisiones.test.ts` (1-15), `migrate.ts` (58-81), `migrate.test.ts`
(340-388), `remisionWebhook.ts` (1-70), `envioRemision.ts` (40-59), `remisionesHistoricas.ts`
(148-161), `CrearRemision.tsx` (1-100, 140-339), `CLAUDE.md` (213-226) — todas las líneas citadas por
`design.md` que se comprobaron coinciden byte a byte con el árbol de hoy. `apps/desk/src/api/client.ts`
es la ruta real del fichero que `design.md` llama `client.ts` (`CrearRemisionPayload:518`,
`crearRemision:536`).

## Review Workload Forecast

### Estimación (código + pruebas, midiendo `--no-renames` + nuevo sin trackear — regla del ciclo 2 de `CLAUDE.md`)

| Bloque | Líneas |
|---|---|
| `schema.sql` +3 · `migrate.test.ts` ±8 (D2) + corrección menor #2, edición en línea sin líneas nuevas | ~11 |
| `db/remisiones.ts` ±0 netas (D4, en línea) · `routes/remision.ts` +5 (D7) + 0 netas (D3, en línea) | ~5 |
| `shared/remision.ts` +14 · `remision.test.ts` +30 · `types.ts` +3 | ~47 |
| `fotoNovedad.test.ts` (nuevo, único fichero nuevo — P2 a P7) | ~180 |
| `api/client.ts` +1 · `CrearRemision.tsx` ~+22/−3 (D9) | ~25 |
| Barrido de citas (`routes/remision.ts` re-apuntado en `trazas/spec.md`, `remisiones/spec.md`, `F0-01_Correcciones…md`; `CrearRemision.tsx` en `CLAUDE.md:220`, `F0-00_Baseline…md:137`, plan `2026-08-04…md:486`, `ENTRADA.md:1173`, `Paquete_de_Despliegue…md:70`) | ~35 |
| **Subtotal código y barrido** | **~305-320** |
| `apply-progress.md` + marcas `[x]` de este `tasks.md` | ~200-260 (precedente: 76-272) |
| **Total `sdd-apply`, un solo lote** | **~505-580** |

### Informes, como sumandos del presupuesto de 800 por intento del ledger (`openspec/config.yaml:22-30`)

| Informe | Precedente / estimado |
|---|---|
| `verify-report.md` — **intento APARTE**, por instrucción del orquestador | ~206-358 (`proposal.md` estima ~230) |
| `archive-report.md` — fusión del delta por ID (RQ-RE-17..19 ADDED, RQ-RE-08 MODIFIED) **SE MIDE, no se estima** (regla del ciclo 2) | `proposal.md` anticipa que el archive por sí solo supera 800 (carpeta ×2 ≈1.800-2.000 + fusión + informe ~130) y necesitará techo aprobado, como `detector-citas-extremos` (techo 5.000) |

**Riesgo por intento:** el lote único (~505-580) se queda bajo 800 SIN `verify-report`. Si `sdd-verify`
corriera en el MISMO intento que el apply, la suma (~735-860, con el punto medio de `verify-report` en
230) rozaría o pasaría el techo — coincide con lo que ya midió `proposal.md` (~765 «en el límite»). Por
eso este `tasks.md` asume `sdd-verify` como intento aparte, tal como resolvió el orquestador en el
encargo de esta fase, y el `sdd-archive` necesitará techo aprobado antes de ejecutarse.

| Campo | Valor |
|---|---|
| Líneas estimadas (`sdd-apply`, un solo lote) | ~505-580 |
| 400-line budget risk | **Medium** — el código+pruebas solo (~305-320) queda bajo 400, pero el lote completo con `apply-progress` (~505-580) ya lo supera; el riesgo real está en el techo de 800 del ledger, no en el lote en sí |
| Chained PRs recommended | **No** — el diseño (D1-D10) sostiene un solo lote: ningún `.tsx` necesita lote propio, y las Fases 1-7 son secuenciales dentro del mismo commit |
| Chain strategy | **stacked-to-main** — este repositorio commitea directo a `main` (sin ramas de PR) |
| Decision needed before apply | **No** — resuelto por el orquestador en el encargo de esta fase: un solo lote de apply si el diseño lo sostiene (lo sostiene), `sdd-verify` como intento aparte para no sumar `verify-report.md` al mismo techo de 800 |
| Delivery strategy | ask-on-risk |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 · Servidor + shared + cliente (Fases 1-9) | Columna `hay_novedad`, predicado compartido, sexta puerta en `/enviar`, formulario que exige contestar | Commit único | `npx vitest run packages/shared/src/remision.test.ts apps/desk/server/fotoNovedad.test.ts packages/zoho-sync/src/db/migrate.test.ts` | `npm test` contra pg-mem, sin credenciales Zoho; comprobación de persona en `ambientalia-desk.ambientalia.cloud` para el `.tsx` (F0-00, fuera de la red de pruebas) | `git revert`: columna aditiva y `NULL`-able, queda sin efecto (plan de vuelta atrás de `proposal.md`); sin `DROP` salvo pedido explícito de Gerencia |

`sdd-verify` no es un work unit de este lote: corre como intento SDD aparte sobre el commit ya cerrado,
por la razón de presupuesto explicada arriba.

---

## Fase 1 · Esquema `public.remisiones.hay_novedad` — RED → GREEN (D1, D2), mutación M5 (parte 1)

- [ ] 1.1 RED en `packages/zoho-sync/src/db/migrate.test.ts`: ampliar la prueba de `:369-380` (recuento)
  de `[36, 18 calificadas, 18 sin calificar]` a `[37, 19 calificadas ("14 de public"), 18 sin
  calificar]`; el conjunto de TABLAS sin calificar (`tickets`, `equipos`, `contacts`) no cambia; el
  conjunto de identidades calificadas gana `'public.remisiones'` — **ya está en la lista de `:380`**,
  así que esa aserción concreta no cambia, sólo el recuento total y el de calificadas. Nace roja: hoy
  son 36/18/18.
- [ ] 1.2 GREEN: en `packages/zoho-sync/src/db/schema.sql`, **al FINAL del fichero** (después de
  `:506-507`, tras la tabla `equipos_cambios`): `ALTER TABLE public.remisiones ADD COLUMN IF NOT
  EXISTS hay_novedad boolean` con un comentario de una línea explicando el propósito, sin `;` extra
  (D1: insertar junto a las `ALTER` de `:316-317` desplazaría `:319`, `:376-386`, `:390-391` y `:448`,
  citadas en `DEPLOY.md`, `zoho-sync/spec.md` y `migrate.test.ts:213,219,307`).
- [ ] 1.3 Confirmar verde. RQ: RQ-RE-17 (P8).
- [ ] 1.4 **Corrección menor #2 de la validación del diseño.** Editar EN LÍNEA (sin insertar líneas
  nuevas: `CLAUDE.md:220` cita `migrate.test.ts:404-406` y cualquier línea nueva antes la rompería) el
  comentario narrativo de `migrate.test.ts:364-367` para que, además de contar hasta F1B-02 (36 ALTER,
  18/18), narre la entrada de F1B-04: el recuento sube de 36 a **37** y el de calificadas de 18 a
  **19** ("14 de public"); el conjunto de tablas sin calificar no cambia porque `public.remisiones` ya
  estaba calificada antes de este cambio.
- [ ] 1.5 **M5, parte 1 (regla de mutación 2 — mutar el FICHERO VIGILADO).** En `schema.sql`, escribir
  temporalmente la `ALTER TABLE` de `hay_novedad` **sin calificar** (`ALTER TABLE remisiones ADD COLUMN
  ...`). Confirmar que `migrate.test.ts` se pone rojo (el recuento de calificadas baja a 18, el de sin
  calificar sube a 19 y la tabla `remisiones` no está en el conjunto esperado de sin-calificar).
  Revertir.

## Fase 2 · Predicado compartido `faltaFotoPorNovedad` — RED → GREEN (D5)

- [ ] 2.1 RED al final de `packages/shared/src/remision.test.ts`: `faltaFotoPorNovedad(true, 0)` →
  `true`; `faltaFotoPorNovedad(true, 1)` → `false`; `faltaFotoPorNovedad(false, 0)` → `false`;
  `faltaFotoPorNovedad(null, 0)` → `false` (P1). Nace roja: la función no existe.
- [ ] 2.2 GREEN: al final de `packages/shared/src/remision.ts` (después de `:102`, tras `urlSegura`):
  `export function faltaFotoPorNovedad(hayNovedad: boolean | null | undefined, numFotos: number):
  boolean { return hayNovedad === true && numFotos < 1 }`. No toca `index.ts` (`:14` ya re-exporta todo
  el módulo con `export * from './remision'`).
- [ ] 2.3 Confirmar verde. RQ: RQ-RE-18.
- [ ] 2.4 M4 (parte 1, sólo con P1 — la parte con P6 se repite en la Fase 4 cuando esa prueba exista):
  cambiar el predicado a `hayNovedad !== false`. Confirmar rojo en P1 (el caso `false`/0 pasaría de
  `false` a `true`, y el caso `null`/0 también). Revertir.

## Fase 3 · Persistencia del alta — RED → GREEN (D3, D4, D6), mutaciones M6, M8, M5 (parte 2)

- [ ] 3.1 RED, fichero **nuevo** `apps/desk/server/fotoNovedad.test.ts` (con `testing/appHarness`,
  patrón de `remisiones.test.ts:1-5`): `POST /api/remisiones` con `hayNovedad: true` → `201` y
  `getRemision`/`GET` devuelve `hayNovedad: true`; con `hayNovedad: false` → `hayNovedad: false`; sin la
  clave `hayNovedad` en el cuerpo → `hayNovedad: null`; con `hayNovedad: 'true'` (cadena, no booleano)
  → `hayNovedad: null`, y en los cuatro casos responde `201` sin rechazar la petición (P2). Nace roja:
  la columna existe (Fase 1) pero nada la lee ni la persiste todavía.
- [ ] 3.2 GREEN — `packages/shared/src/types.ts`: en la interfaz `Remision` (`:713-733`), justo antes
  del `}` de `:733`, añadir con dos líneas de JSDoc: `hayNovedad: boolean | null` (+3 líneas, D6; sin
  citas afectadas por debajo de `:733`).
- [ ] 3.3 GREEN — `apps/desk/server/db/remisiones.ts` (D4, todo en línea, **0 líneas netas**):
  - `:11-27` (`toRemision`): en la línea `:25` (`anuladaAt: isoOrNull(r.anulada_at), anuladaPor:
    (r.anulada_por as string) ?? null,`), añadir a continuación, en la MISMA línea, `hayNovedad: typeof
    r.hay_novedad === 'boolean' ? r.hay_novedad : null,`.
  - `:29-41` (`CreateRemisionInput`): en la línea `:40` (`personaContacto: string | null`), añadir `;
    hayNovedad: boolean | null` en la MISMA línea.
  - `:46-48` (`INSERT`): en `:47` añadir la columna `, hay_novedad` al final de la lista; en `:48`
    añadir `, $13` al final de `VALUES (...)`.
  - `:49-50` (array de valores): en `:50` añadir `, input.hayNovedad` al final.
- [ ] 3.4 GREEN — `apps/desk/server/routes/remision.ts` (D3, **0 líneas netas**): en la línea `:246`
  (`creadoPor: req.user?.name ?? null,`, dentro de la llamada a `createRemision` de `:242-255`),
  añadir a continuación, en la MISMA línea, `hayNovedad: typeof b.hayNovedad === 'boolean' ?
  b.hayNovedad : null,`. No toca `:127`, `:155`, `:177`, `:197` ni `:220` (todas por encima de `:242`,
  IV-12 queda intacto).
- [ ] 3.5 Confirmar verde. RQ: RQ-RE-17.
- [ ] 3.6 M6: cambiar `:246` a `b.hayNovedad ?? null` (nullish coalescing en vez de comprobación de
  tipo). Confirmar rojo en el caso `'true'` (cadena) de P2 — con la mutación pasaría a persistirse tal
  cual en vez de normalizarse a `null`. Revertir.
- [ ] 3.7 M8: quitar `hayNovedad` de `toRemision` (`:25`). Confirmar rojo en P2 (la respuesta ya no
  refleja el valor persistido). Revertir.
- [ ] 3.8 **M5, parte 2** (regla de mutación 2, con P8 y P2 ya existentes): en `schema.sql`, borrar por
  completo la `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS hay_novedad` de la Fase 1.
  Confirmar rojo en `migrate.test.ts` (recuento vuelve a 36/18) Y en `fotoNovedad.test.ts` (la columna
  no existe: el `INSERT` de `createRemision` falla). Revertir.

## Fase 4 · Sexta puerta en `POST /:id/enviar` — RED → GREEN (D7), mutaciones M1, M2, M3, M4 (parte 2)

- [ ] 4.1 RED en `fotoNovedad.test.ts` — P3: remisión pendiente con `hay_novedad = true` y 0 fotos →
  `POST /:id/enviar` responde `422`; el `fetch`/disparo a n8n NO se llama (espía sobre
  `dispararRemision` o sobre el `fetch` global); `enviado_at` sigue `NULL` (consulta directa o
  `getRemision`). Nace roja: la guarda no existe.
- [ ] 4.2 RED — P4 (**C<D**): a partir del `422` de P3, subir una foto (`POST /:id/fotos`) y reintentar
  `POST /:id/enviar` de inmediato (webhook configurado en el arnés, `fetch` simulado con `200`) →
  responde `200`. Nace roja junto con P3 (la ruta aún no llega a este punto).
- [ ] 4.3 RED — P5 (**B<C**): remisión anulada con `hay_novedad = true` y 0 fotos → `409` de anulada
  (no `422`); remisión en `estado = 'ok'` con `hay_novedad = true` y 0 fotos → `409` de ya enviada (no
  `422`). Nace roja: sin la guarda, este escenario ya daba el `409` correcto por las guardas
  existentes, así que en rigor esta prueba fija el ORDEN futuro; se declara "nace roja" respecto a la
  guarda que se va a insertar, y se confirma que sigue en verde tras 4.4 (no debe cambiar de código de
  respuesta).
- [ ] 4.4 RED — P6: remisión con `hay_novedad` en `false` o `null`, 0 fotos → `200` sin otros
  bloqueos. Misma nota que P5: ya es verde hoy por ausencia de guarda; se escribe ahora para fijarla
  como CARACTERIZACIÓN que no debe romperse al insertar la guarda.
- [ ] 4.5 GREEN — `apps/desk/server/routes/remision.ts` (D7): en la línea `:4`
  (`import { perfilChecklist } from '@ambientalia/shared'`), ampliar en la MISMA línea a `import {
  perfilChecklist, faltaFotoPorNovedad } from '@ambientalia/shared'`. Insertar **5 líneas nuevas**
  entre la actual `:282` (cierre del bloque "ya enviada") y la actual `:283` (comentario de
  "Reclamación atómica"), de modo que la guarda nueva quede en las nuevas `:283-287`: leer `await
  listFotos(db, id)` (ya importada en `:9`) y, si `faltaFotoPorNovedad(rem.hayNovedad,
  fotos.length)`, responder `422` con el mensaje «El equipo llegó con novedad y la remisión no tiene
  fotos: sube al menos una antes de enviarla.» y `return`, sin escribir nada ni llamar a
  `reclamarEnvio`. El bloque de "Reclamación atómica" (antiguo `:283-288`) queda en `:288-293`.
- [ ] 4.6 Confirmar P3, P4, P5, P6 en verde A LA VEZ (verificación cruzada, regla de mutación 1). RQ:
  RQ-RE-08 (orden 4).
- [ ] 4.7 **M1** (posición): mover la guarda nueva DESPUÉS del bloque de `reclamarEnvio`. Confirmar
  rojo: P4 pasa a dar `409` (reclamado ya) en vez de `200`, y en P3 `enviado_at` queda escrito en vez
  de `NULL`. Revertir.
- [ ] 4.8 **M2** (posición): mover la guarda nueva ANTES del bloque de "anulada" (`:275-277`).
  Confirmar rojo: el caso anulado de P5 pasa a dar `422` de novedad en vez de `409` de anulada.
  Revertir.
- [ ] 4.9 **M3** (posición): mover la guarda nueva ANTES del bloque de "ya enviada" (`:280-282`).
  Confirmar rojo: el caso `ok` de P5 pasa a dar `422` de novedad en vez de `409` de ya enviada.
  Revertir.
- [ ] 4.10 **M4, parte 2** (con P1 de la Fase 2 y P6 de esta fase ya existentes): repetir la mutación
  del predicado a `hayNovedad !== false` en `packages/shared/src/remision.ts`. Confirmar rojo en P1
  (`remision.test.ts`) Y en P6 (`fotoNovedad.test.ts`, el caso `null`/0 pasaría a bloquear con `422`).
  Confirmar las dos rojas A LA VEZ. Revertir.

## Fase 5 · El payload a n8n no cambia — RED → GREEN (D8), mutación M7

- [ ] 5.1 En `fotoNovedad.test.ts` — P7: remisión con `hay_novedad = true` y 1 foto; al llamar
  `POST /:id/enviar` (webhook configurado, `fetch` simulado y su cuerpo CAPTURADO), el JSON enviado NO
  tiene la clave `hayNovedad`. **Nace en VERDE**: D8 no exige ningún cambio de producción —
  `buildRemisionPayload` (`remisionWebhook.ts:31-66`) arma el cuerpo campo a campo, sin *spread* de
  `Remision`, así que `hayNovedad` no puede colarse sola. El valor de guardia de esta prueba se
  demuestra por mutación, no por un estado rojo inicial.
- [ ] 5.2 Confirmar verde sin tocar `remisionWebhook.ts`. RQ: RQ-RE-17 (payload sin cambios).
- [ ] 5.3 **M7**: añadir temporalmente `hayNovedad: r.hayNovedad` a `RemisionWebhookPayload` (`:5-24`) y
  al `return` de `buildRemisionPayload` (`:40-65`). Confirmar que P7 se pone ROJA (la clave aparece en
  el cuerpo capturado) — es lo que demuestra que la prueba vigila de verdad. Revertir.

## Fase 6 · Cliente — pregunta, bloqueo y payload (D9)

Sin RED/GREEN automático: `CrearRemision.tsx` es `.tsx` y queda fuera de la red de pruebas por decisión
de Gerencia (F0-00, `vitest.config.ts:16-20`). Verificado por `npm run typecheck` y comprobación de
persona (sección aparte, más abajo).

- [ ] 6.1 `apps/desk/src/api/client.ts`: añadir `hayNovedad?: boolean` al FINAL de la interfaz
  `CrearRemisionPayload` (después de `:533`). +1 línea, sin citas afectadas por encima de `:533`.
- [ ] 6.2 `apps/desk/src/components/CrearRemision.tsx`:
  - Import de `faltaFotoPorNovedad` desde `@ambientalia/shared`, junto al import existente de `:2`.
  - Nuevo estado `const [hayNovedad, setHayNovedad] = useState<boolean | null>(null)`, declarado antes
    del `return` de `:153` (regla de los hooks de React — obliga a que el bloque de estados de
    `:45-60` crezca, lo que desplaza el resto del fichero; es el "desplazamiento inevitable" que
    señala `design.md`).
  - En `submit()` (`:91` en adelante), antes de la comprobación de `pendiente` existente (`:98`): si
    `hayNovedad === null` → `setErr('Indica si el equipo llega con novedad.')` y `return`; si
    `hayNovedad === true` y `fotos.length === 0` → `setErr('El equipo llega con novedad: sube al
    menos una foto antes de crear la remisión.')` y `return`.
  - Pregunta «¿El equipo llega con novedad?» (Sí/No, sin valor preseleccionado) antes de la sección
    «Registro fotográfico» (antes de `:267` actual).
  - En la llamada a `crearRemision` dentro de `ejecutar()` (`:75`), añadir `hayNovedad: hayNovedad ??
    undefined`.
  - En la condición de «Continuar sin fotos» (`:328` actual: `creada && fotosPendientes > 0 &&
    !busy`), sumar `&& !faltaFotoPorNovedad(hayNovedad, envio.fotosSubidas)`.
- [ ] 6.3 `npm run typecheck` en verde para estos dos ficheros.

## Fase 7 · Casilla de la regla de mutación 3 (`CLAUDE.md`) — con corrección menor #3

- [ ] 7.1 Confirmar por escrito, decisión a decisión, cada una con la línea del servidor que la
  impone — **con la corrección de la validación del diseño**: la fila «no deja crear con Sí y 0 fotos»
  se declara **13.2**, no 13.3 como en la tabla de `design.md` («Regla de mutación 3»). Razón: el
  cliente bloquea el envío ENTERO dentro de `submit()` — antes incluso de llamar a `crear`, es decir
  antes de `POST /api/remisiones` — y ESE paso (el alta) no tiene ninguna guarda de servidor, a
  propósito (IV-12, `proposal.md` §Alcance «Fuera»: «no se añade ninguna guarda a `POST
  /api/remisiones`»). Lo que el servidor SÍ impone, y prueba (Fase 4), es la consecuencia en el paso
  `/enviar`, un endpoint y un momento distintos del que el cliente bloquea. No es el mismo hecho
  reflejado dos veces (espejo, 13.3): es una guarda de cliente sin contrapartida en ESE punto (13.2)
  cuya consecuencia sí queda impuesta más adelante, en otro punto, por el servidor:

  | Decisión del cliente | Línea del servidor | Caso |
  |---|---|---|
  | No deja crear/continuar sin contestar la pregunta | Ninguna | 13.2 — declarada en RQ-RE-19 y (s5): la guarda vive sólo en el cliente |
  | No deja crear/continuar con «Sí» y 0 fotos | La guarda de la Fase 4 en `/enviar` — **NO** en `POST /api/remisiones` (IV-12 no toca el alta) | **13.2, corregida frente a `design.md`** — guarda de cliente sin contrapartida en el paso de ALTA; la consecuencia SÍ la impone el servidor, más adelante, en `/enviar` |
  | Oculta «Continuar sin fotos» si quedaría en 0 | La misma guarda de `/enviar` | 13.2, misma razón |
  | Manda `hayNovedad` sólo como booleano | `routes/remision.ts:246` normaliza a `true`/`false`/`null` en el alta | 13.3 — espejo legítimo: MISMO endpoint y MISMO momento, el servidor no confía en el cliente y decide de nuevo |

- [ ] 7.2 Dejar constancia de esta corrección en `design.md` (nota junto a su tabla «Regla de mutación
  3»), sin reabrir sus Decisiones D1-D10.

## Fase 8 · Cierre de calidad del lote

- [ ] 8.1 `npm test` en verde; registrar el recuento (pasadas/ficheros) en `apply-progress.md`.
- [ ] 8.2 `npm run typecheck` en verde.
- [ ] 8.3 `npm run lint` en verde; confirmar 0 warnings nuevos sobre la base preexistente.
- [ ] 8.4 `npm run build` en verde.

## Fase 9 · Barrido de citas (regla de mutación 4, OBLIGATORIO) — incluye corrección menor #1

- [ ] 9.1 `grep -rnoE "routes/remision\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio (fuera de
  `archive/`). Comprobar CADA resultado contra el árbol final, los dos extremos de cada rango por
  separado. Sólo desplaza lo posterior a `:282` (+5, por la Fase 4.5), Caso A:
  - `trazas/spec.md`: `:363`→`:368`, `:358-362`→`:363-367`, `:325`→`:330`.
  - `remisiones/spec.md`: `:353-363`→`:358-368`, `:275-288`→`:275-293`, `:307`→`:312`, `:309`→`:314`,
    `:344-346`→`:349-351`, `:363`→`:368`, `:318`→`:323`, `:354-356`→`:359-361`.
  - `F0-01_Correcciones_para_el_maestro.md`: líneas 546, 548 y 550.
  - Confirmar SIN desplazamiento lo que cae por encima de `:283` (incluida la línea `:246` de la Fase
    3.4, que crece en el sitio sin mover nada).
- [ ] 9.2 Clasificar como probable **Caso B** (registro fechado, se lee contra su revisión, NO se
  renumera a ciegas): `F0-00_Baseline_as-built.md:173` y `:468` (ya señalados por `design.md`).
- [ ] 9.3 **Corrección menor #1 de la validación del diseño** (hallazgo NO listado por `design.md`):
  clasificar además `docs/sdd/F0-00_Baseline_as-built.md:137` — dentro de «d.2 — Reparto
  réplica/prototipo», cita `CrearRemision.tsx:16`, un inventario fechado de qué pantallas eran réplica
  y cuáles prototipo — y `docs/superpowers/plans/2026-08-04-remision-entrada-desenlace.md:486` — cita
  `CrearRemision.tsx:1-5, 12-44, 49-51` dentro de un plan de tareas fechado. Los dos son registros de un
  momento anterior al desplazamiento que este diseño introduce en `CrearRemision.tsx` (Fase 6, D9:
  «desplazamiento inevitable»): **probable Caso B** — nombrar la revisión en la propia cita (p. ej.
  «cita válida en `a0a2935`, antes de F1B-04») en vez de renumerar a la línea de hoy.
- [ ] 9.4 **`CrearRemision.tsx`: desplazamiento inevitable.** Re-apuntar: +1 desde `:3`, +2 desde `:52`,
  ≈+5 desde `:93`, ≈+13 desde `:266` (bloque de la pregunta, Fase 6.2). Re-medir `CLAUDE.md:220`, que
  hoy dice que el cliente «hoy» recorta «en esa misma línea» `:195`: ese «hoy» se re-apunta a la línea
  real tras el desplazamiento. Clasificar `ENTRADA.md:1173` (cita `:264`) y
  `Paquete_de_Despliegue_2026-09-10.md:70` (cita `:195`).
- [ ] 9.5 Confirmar `types.ts`: sin citas vivas a partir de `:733` en el árbol final (la adición de la
  Fase 3.2 no desplaza nada citado, según `design.md`).
- [ ] 9.6 Segundo pase por la forma ABREVIADA (sin nombre de fichero) en los ficheros que ya citan
  `routes/remision.ts` y `CrearRemision.tsx`: `remisiones/spec.md`, `CLAUDE.md`, `openspec/config.yaml`.

## Comprobaciones de persona (regla del ciclo 1 — NO son casillas contables)

RQ-RE-19 sólo se puede comprobar en el DOM de `CrearRemision.tsx`, fuera de la red de pruebas (F0-00).
**No se cuentan en el recuento de tareas y archivar este cambio NO las da por hechas.**

| # | Comprobación | Dueño | Dónde queda escrito |
|---|---|---|---|
| Persona-1 | La pregunta «¿El equipo llega con novedad?» está visible al abrir el formulario, sin valor preseleccionado | Servicio Técnico, en la app | `specs/remisiones/spec.md` (RQ-RE-19, tras fusión) |
| Persona-2 | Con «Sí» y cero fotos, el formulario impide crear o continuar | Servicio Técnico, en la app | ídem |
| Persona-3 | El mensaje del `422` de la sexta puerta (RQ-RE-08) se entiende sin explicación adicional | Servicio Técnico, en la app | ídem |

## Fase 10 · Cierre del intento — ledger (E-078) y commit

- [ ] 10.1 **ANTES de devolver el apply** (medida propia del orquestador, E-078 de `docs/sdd/ENTRADA.md`):
  `git add -N apps/desk/server/fotoNovedad.test.ts` (único fichero nuevo del intento) y cualquier otro
  fichero nuevo sin trackear que resulte de las Fases 1-9, para que el ledger de `sdd-attempt` los
  cuente.
- [ ] 10.2 Medir `git diff --shortstat --no-renames a0a2935` con lo anterior ya indexado (`-N`).
  Registrar el número en `apply-progress.md` y contrastarlo contra la estimación de ~505-580 de este
  documento.
- [ ] 10.3 Commit del lote — reservado al orquestador.
- [ ] 10.4 Tras el commit: `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` — **diferido
  al orquestador**, igual que en el precedente `edicion-comercial-equipo` (el CLI sólo acepta `--sha
  <rev>` contra un árbol YA COMMITEADO; no hay modo de comprobar el working tree sin commitear).

## No entra en `sdd-apply` — registrado, no ejecutado aquí

- **Va en `sdd-archive`, no aquí**: fusión de la delta por ID de requisito — RQ-RE-17, RQ-RE-18,
  RQ-RE-19 como `ADDED`; RQ-RE-08 como `MODIFIED`, sustituyendo el bloque vigente ENTERO (cinco puertas
  → seis) en `openspec/specs/remisiones/spec.md`.
- Rotulación y almacenamiento — pregunta abierta, `docs/sdd/ENTRADA.md` E-079.
- Desplegables en las etapas críticas / taxonomía de tipos de novedad — E-080.
- El payload hacia n8n (`remisionWebhook.ts:5-24`) no se toca — flujo de producción intacto (D8).
- El orden de guardas del ALTA (IV-12) — no se añade ninguna guarda a `POST /api/remisiones`.
- Pruebas de interfaz (`jsdom`) — no se propone, por F0-00.
- Edición de la novedad tras el alta — no se construye (s7 de `proposal.md`): las salidas son
  reintentar la subida en el panel de desenlace, o que un administrador anule la remisión.

## Riesgos de dependencia entre fases

- Fase 1 (esquema) y Fase 2 (predicado) son independientes entre sí.
- Fase 3 depende de las Fases 1 y 2 (usa la columna y, para D6/D3, sólo el tipo — el predicado en sí no
  se usa hasta la Fase 4).
- Fase 4 depende de las Fases 1, 2 y 3 (lee `rem.hayNovedad`, ya persistido, y usa
  `faltaFotoPorNovedad` y `listFotos`, ya existente).
- Fase 5 depende de la Fase 3 (necesita una remisión con `hay_novedad = true` persistido) pero NO de la
  Fase 4 (el payload no pasa por la guarda nueva).
- Fase 6 (cliente) depende de la Fase 2 (`faltaFotoPorNovedad`) para la condición de «Continuar sin
  fotos», y de la Fase 3 (D3/D6) para que `hayNovedad` viaje y vuelva en las respuestas — puede
  empezarse en paralelo a las Fases 4-5 si esas dos piezas se acuerdan primero.
- Fase 7 depende de que la Fase 4 y la Fase 6 estén terminadas (necesita la línea final de la guarda y
  el comportamiento final del cliente para citarlos con exactitud).
- Fases 4.7-4.9 (mutaciones de posición) dependen de que 4.6 esté en verde — mutar antes de tiempo no
  prueba nada (regla de mutación 1).
- Fase 9 depende de TODAS las anteriores — es la única forma de saber si los desplazamientos reales
  coinciden con lo que predijo `design.md`, y de aplicar las dos correcciones menores (#1 y #2) que la
  validación encontró fuera de su barrido original.
