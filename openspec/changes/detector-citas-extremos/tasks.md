# Tasks: el detector comprueba el extremo FINAL y lee la abreviada en su ancla

Fuentes: proposal.md (§2 tres respuestas de Gerencia, §5 las cinco reparaciones, §6 rojo y mutaciones,
§7 orden de commits, §9 cierre, §16 criterios), specs/citas-verificables/spec.md (RQ-CV-06, RQ-CV-08),
design.md (D1-D8, §5 motivos exactos, §6 D4, §8 mutaciones, §11 dónde vive cada prueba, §12 talla).
Ninguna cita a estos tres artefactos de la propia tanda lleva línea: se referencian por ID (DCE-Pn,
DCE-Mn, Dn, §n, Fase n). Toda cita a código o a otra spec/documento del repositorio lleva ruta completa
y va anclada a `d2a89e9` en la misma línea física, comprobada por los dos extremos antes de escribirla.

## Review Workload Forecast

**Previsión por fichero (design §12, ya ajustada por H6), frente al presupuesto de sesión de 800:**

| Fichero | Cambio | Líneas (hipótesis) |
|---|---|---|
| apps/desk/server/citas/detector.ts | Cuarta rama de `rotura()`; clave con `arbolDeLectura` en las dos pasadas; ramas 2 y 3 de D2; ayudante único del motivo con el sufijo de extremo (H6) | 17-29 |
| apps/desk/server/citas/cosecha.ts | `anclaVigente`, sus tres reinicios, comparación de mismo fichero, precedencia `propia ?? anclaVigente`, comentario del contrato del campo | 10-18 |
| apps/desk/server/citas/detector.test.ts | DCE-P1 a DCE-P7 y los dos asertos endurecidos (H6) | 120-170 |
| apps/desk/server/citas/cosecha.test.ts | Filas de herencia del ancla (D4) | 25-35 |
| apps/desk/server/citas/hook.test.ts | DCE-P8 | 35-50 |
| apps/desk/server/citas/informe.test.ts | Aserto endurecido con el extremo (H6) | 1-2 |
| apps/desk/server/admin.test.ts, apps/desk/server/routes/directory.ts, docs/sdd/Paquete_de_Despliegue_2026-09-10.md, openspec/specs/tickets-core/spec.md | Las cinco reparaciones del §5 de la propuesta, una línea cada una (tickets-core lleva dos) | 10 |
| docs/sdd/Triaje_Linea_Base_Citas_2026-09-15.md | Anotación de la corrección de B3 (reparación nº 4) | 2-4 |
| apply-progress.md | Nuevo, sin trackear — ceguera 1 del ledger (regla del ciclo 2 de CLAUDE.md): cuenta por `wc -l`, no por el ledger | 60-150 |
| CLAUDE.md, openspec/config.yaml | Cierre: barrido regla 4, retirar 2 hallazgos (caso C), añadir hallazgo `REVISION_RE` | 20-70 |
| informe.ts, git.ts, cli.ts, resolucion.ts, reposDePrueba.ts | Sin cambios (confirmado leyendo, design §2) | 0 |

**Total de los commits 1-4 (lo que produce el intento de `sdd-apply`): ~300-538 líneas, hipótesis.**
No incluye `verify-report.md`, `archive-report.md` ni la fusión del delta en `openspec/specs/`: esos
los producen las fases `sdd-verify`/`sdd-archive`, cada una su propio intento, no el de `sdd-apply`
de esta tanda (bloque (iii) de la propuesta §8, cuyo riesgo medio es de esas fases, no de ésta).

**Commit de partida del intento:** el "commit de planificación" (tarea 0.1), que todavía no existe —
se nombra así porque es el commit que incluye este `tasks.md`. La medida real, por CLAUDE.md (regla
del ciclo 2): `git diff --shortstat` contra ese commit **más** `wc -l` de `git ls-files --others
--exclude-standard` (lo nuevo sin trackear, principalmente `apply-progress.md`).

**Recomendación: UN solo intento de `sdd-apply` que cubra los commits 1 a 4.** Razón: incluso en su
extremo superior (538) el total queda muy por debajo del presupuesto de 800 de este proyecto
(`openspec/config.yaml:29`, preflight de la sesión), y los commits 2+3 ya viajan juntos en un solo push
(D8 del diseño) — partirlos en dos intentos no reduciría el riesgo real, sólo añadiría un `settle`
extra. Separar el commit 4 en un segundo intento (opción "1-3 y 4") se descarta: su propio bloque es
pequeño (20-70) y depende de que el detector de la tanda ya esté implementado y probado, así que no
gana autonomía por ir aparte. Si la medición real al cerrar el commit 3 (tarea 3.8) se acerca al 70 %
de 800 (560), se para y se pregunta antes de seguir con el commit 4 en el mismo intento.

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium
```

**Nota sobre el campo de 400 líneas (heredado del formato genérico del skill):** el bloque 2+3
(pruebas + implementación, ~280-468 en un solo push) puede superar 400 en su extremo alto, de ahí
`Medium`. El presupuesto que rige de verdad esta sesión es el de `openspec/config.yaml` (800 líneas
por intento), donde el riesgo es **Bajo**: por eso no se pide partir el trabajo ni decidir estrategia
de cadena. Con `delivery_strategy: ask-on-risk`, esto se señala y no bloquea.

### Suggested Work Units

| Unit | Goal | Likely intento | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------------|-----------------------|------------------|--------------------|
| 1 | Commits 1-4 completos: reparaciones, rojo, implementación, cierre | Intento único de `sdd-apply` | `npx vitest run apps/desk/server/citas/detector.test.ts apps/desk/server/citas/cosecha.test.ts apps/desk/server/citas/hook.test.ts apps/desk/server/citas/informe.test.ts` | `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` sobre el árbol final: 0 bloqueantes | `git revert` de los commits 2 y 3 devuelve el detector de hoy (§15 de la propuesta); el commit 1 (reparaciones) no se revierte, es válido con cualquiera de los dos detectores |

---

## Fase 0 — Planificación (commit 0)

- [x] 0.1 Confirmar en `git log`/`git status` que `proposal.md`, el delta de `specs/citas-verificables/spec.md` y `design.md` de este cambio ya están en el árbol; commitear este `tasks.md` **antes** de que el intento de `sdd-apply` adquiera (regla del ciclo 1 y 2 de CLAUDE.md). Este commit es el "commit de planificación": punto de partida de toda medición de `changed_lines` de esta tanda.

## Fase 1 — Las cinco reparaciones (commit 1, antes o junto al 3; verde con el detector de HOY)

Las tres primeras son caso A de la regla de mutación 4 (la frase sigue siendo cierta del árbol de hoy,
y la cuarta rama las bloquearía si no se reparan antes). Las nº 4 y 5 las añadió Gerencia el
2026-09-15: mismo origen que la nº 1, invisibles para el detector.

- [x] 1.1 **Reparación nº 1.** En `apps/desk/server/admin.test.ts`, el comentario que hoy dice "calcada de" directory.ts del 62 al 67 —escrito aquí en prosa a propósito, porque en forma de cita bloquearía tras la tanda— (línea 197 del fichero, sólo el comentario, ninguna línea ejecutable) pasa a citar `` `apps/desk/server/routes/directory.ts:74-79` en `d2a89e9` `` — las rutas `/api/contacts/:id` y `/api/accounts/:id` por identidad, con `requireAuth`, que es a lo que el comentario se refiere (evidencia: el comentario gemelo de `` `apps/desk/server/routes/directory.ts:19-24` en `d2a89e9` `` ya precisa "contactos/cuentas de Zoho"). El rango viejo (62-67) apuntaba en realidad a `/api/activities`.
- [x] 1.2 **Reparación nº 2.** En `docs/sdd/Paquete_de_Despliegue_2026-09-10.md`, fila 5 de la tabla de QA (columna "Dónde queda anotada"), el texto pasa de citar el nombre corto y el rango 35-40 a `` `openspec/specs/vistas-tablero/spec.md:35-39` en `d2a89e9` `` — ruta completa (quita la ambigüedad con las copias archivadas) y sin la línea 40, que está vacía.
- [x] 1.3 **Reparación nº 3.** En `openspec/specs/tickets-core/spec.md`, la fila de `public` de la tabla de `ALTER TABLE` sin calificar pasa de citar el nombre corto y el rango 70-74 a `` `packages/zoho-sync/src/db/migrate.ts:70-73` en `d2a89e9` `` — ruta completa y sin la línea 74, que está vacía (`PUBLIC_TABLES` ocupa exactamente esas cuatro líneas).
- [x] 1.4 **Reparación nº 4, y anotación en el triaje.** En `openspec/specs/tickets-core/spec.md`, RQ-TC-14 (el requisito de `GET /api/clients/:id`) pasa de citar `apps/desk/server/routes/directory.ts` con el rango 61-66 a `` `apps/desk/server/routes/directory.ts:74-79` en `d2a89e9` `` — el rango 61-66 es `/api/activities`, no la resolución por identidad con 404 que la frase describe; 74-79 son las rutas de contactos y cuentas por id, las dos con `requireAuth`. Además, en `docs/sdd/Triaje_Linea_Base_Citas_2026-09-15.md`, en el párrafo del hallazgo "El detector no comprueba el extremo final vacío" (el que registra que B3 reparó esta misma cita de tickets-core/spec.md línea 328 llevando el rango de 62-67 a 61-66), añadir una nota: esa reparación de B3 fue ella misma incorrecta — conservó la anchura pero apuntó a `/api/activities`; el rango correcto, resuelto por `detector-citas-extremos`, es 74-79, reparado en el commit 1 de esta tanda.
- [x] 1.5 **Reparación nº 5.** En `apps/desk/server/routes/directory.ts`, el comentario de cabecera de la ruta de clientes por identidad, que hoy dice "calcada de" la abreviada del 62 al 67 y "(contactos/cuentas de Zoho)", pasa a citar la abreviada del 74 al 79 (las dos, en prosa aquí: en forma abreviada quedarían huérfanas en este documento y ensuciarían el informe). Sigue siendo una abreviada huérfana (no hay fichero antes en su misma línea física): el detector no la ve ni con la tanda hecha (H2 del diseño); la vigilancia sigue siendo lectura humana.
- [x] 1.6 Control: ejecutar el detector de HOY (antes de tocar `detector.ts`/`cosecha.ts`) con `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` sobre el árbol tras 1.1-1.5. Confirmar 0 bloqueantes. Sin esto, la cuarta rama del commit 3 bloquearía el push por las tres primeras reparaciones (R-1 de la propuesta).
- [x] 1.7 `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 158` en verde (sólo cambian comentarios y documentos: el CI no debería moverse). Medición real: `git diff --shortstat` contra el commit de planificación (tarea 0.1) más `wc -l` de lo nuevo sin trackear; registrar la cifra en `apply-progress.md`. Push propio del commit 1.

## Fase 2 — El rojo (commit 2, RED; viaja con el commit 3 en el mismo push)

Cada tarea indica fichero, `describe`, fixture y el rojo esperado. Donde el diseño ya fija el literal
exacto, se usa tal cual; donde no, se deriva del código de hoy y se marca como hipótesis del mensaje
exacto de vitest (el valor esperado/recibido si no la cadena literal completa).

- [x] 2.1 **DCE-P1** — nuevo `it` en `apps/desk/server/citas/detector.test.ts`, describe `detectar · RQ-CV-08 comprobación mecánica básica`. Fixture: `origen.md` cita un rango 1-3 de `citado.md`; `citado.md` = tres líneas, la 1 con contenido y la 3 vacía. Esperado tras la tanda: `bloquea` `true`, motivo exacto `extremo final en línea vacía (línea 3 de citado.md)`. Rojo hoy (hipótesis del mensaje, cierta en la forma): `bloquea` sale `false` y `comprobadas` 1 → `expected false to be true`.
- [x] 2.2 **DCE-P2** — nuevo `it` en el describe `detectar · RQ-CV-03: una ambigua bloquea sólo si está rota en TODAS sus candidatas (M15)`. Dos sub-casos: (a) token ambiguo con rango 1-3, `a/comun.md` de tres líneas con la 3 vacía y `b/comun.md` de una sola línea (rota por "extremo final fuera de rango") → tras la tanda bloquea con motivo exacto `ambigua, rota en sus 2 candidatas (línea 3 de comun.md)`; rojo hoy: se salta, `saltadas.ambiguas` 1 → `expected false to be true`. (b) misma cita con `b/comun.md` válido (≥3 líneas) → `saltadas.ambiguas` 1, no bloquea (RQ-CV-03): este sub-caso **nace verde**, sirve de control del otro signo.
- [x] 2.3 **DCE-P3** — en el describe de DCE-P1: (a) endurecer `` `apps/desk/server/citas/detector.test.ts:38` en `d2a89e9` `` de `expect.stringContaining('final')` a igualdad con `extremo final fuera de rango (línea 9 de citado.md)`; (b) endurecer `` `apps/desk/server/citas/detector.test.ts:50` en `d2a89e9` `` de `expect.stringContaining('inicial')` a igualdad con `extremo inicial en línea vacía (línea 1 de citado.md)`; (c) nuevo `it`: rango con los DOS extremos en línea vacía (p. ej. `citado.md` de tres líneas, la 1 y la 3 vacías) → motivo exacto `extremo inicial en línea vacía (línea 1 de citado.md)`, nombrando el inicial. Las tres partes **nacen verdes** (el código de hoy ya añade el sufijo "(línea N de fichero)" y ya prioriza el inicial): sirven de control fijo para las mutaciones DCE-M1 y DCE-M2.
- [x] 2.4 **DCE-P4** — nuevo describe `detectar · RQ-CV-06: la abreviada se lee en su ancla, propia o heredada`, en `detector.test.ts`. Tres partes, las tres rojas hoy: (i) completa anclada a `rev1` válida + abreviada a la línea 3 en la misma línea física, con `citado.md` LOCAL vacía en la 3 y `citado.md` en `rev1` con contenido en la 3 → tras la tanda, `comprobadas` incluye la abreviada (se lee en `rev1`); hoy se lee en LOCAL → `abreviadasRotas` 1 (rojo: `expected [...] to have a length of 0` o equivalente). Confirmar además que `repo.arbol('rev1')` se llama una sola vez (contador, discrimina DCE-M11). (ii) el signo contrario: LOCAL con contenido en la 3, `rev1` con la 3 vacía → tras la tanda, `abreviadasRotas[0].motivo` es exactamente `abreviada rota (atribuida a citado.md en rev1): extremo inicial en línea vacía (línea 3 de citado.md)`; hoy sale comprobada (se lee en LOCAL, que es válido) → rojo. (iii) b.2: la misma línea física con una SEGUNDA completa válida del mismo fichero, sin ancla, entre la anclada y la abreviada (p. ej. `` `citado.md` `` sin `` en `rev`... `` ) → tras la tanda, `abreviadasRotas[0].motivo` es exactamente `abreviada rota (atribuida a citado.md): extremo inicial en línea vacía (línea 3 de citado.md)`, sin revisión en el motivo; hoy la abreviada ya sale rota (se lee en LOCAL, que es la 3 vacía) pero con el motivo viejo, sin extremo → rojo por el literal de H6, no por el booleano. DCE-M7 sigue declarada sobre esta parte (iii).
- [x] 2.5 **DCE-P5** — en el describe de DCE-P4: completa anclada a `rev1` con la línea rota, abreviada con ANCLA PROPIA a `rev2` donde la misma línea es válida → tras la tanda, `comprobadas` incluye la abreviada (la propia gana sobre la heredada). Rojo hoy: se lee en LOCAL → `abreviadasRotas` 1.
- [x] 2.6 **DCE-P6** — en el describe de DCE-P4, dos sub-casos: (a) "otro fichero": completa anclada a `rev1`, mención pelada de un fichero DISTINTO (ausente en `rev1`), luego la abreviada, con `citado.md` LOCAL válido en la línea citada → la abreviada se lee en LOCAL y sale comprobada; este sub-caso **nace verde** (hoy también se lee en LOCAL) y confirma DCE-M3. (b) "mismo fichero" (b.1): la mención pelada resuelve al MISMO fichero que la completa, con `citado.md` LOCAL vacío en la línea citada y con contenido en `rev1` → tras la tanda, la abreviada hereda `rev1` y sale comprobada; rojo hoy (se lee en LOCAL, vacío) → `abreviadasRotas` 1.
- [x] 2.7 **DCE-P7** — en el describe de DCE-P4, dos sub-escenarios, cada uno con su propia llamada a `detectar`: (i) abreviada con ancla propia a una revisión que no existe en el repo (p. ej. `inventada`), con `citado.md` LOCAL válido en la línea citada → tras la tanda, `abreviadasRotas[0].motivo` exacto `abreviada rota (atribuida a citado.md en inventada): revisión inexistente`, `bloquea` `false`, `saltadas.noLegibles` 0; hoy el ancla se ignora y se lee LOCAL (válido) → `abreviadasRotas` 0, rojo: `expected [] to have a length of 1 but got 0`. (ii) abreviada con ancla propia a `rev1` (existente) que NO tiene el fichero atribuido, con `citado.md` LOCAL válido → tras la tanda, motivo exacto `abreviada rota (atribuida a citado.md en rev1): fichero inexistente en la revisión`; mismo rojo hoy por el mismo motivo (se lee LOCAL, válido).
- [x] 2.8 **Filas de cosecha (D4)** — nuevo describe `cosechar · herencia del ancla en la misma línea física (RQ-CV-06, b)`, en `apps/desk/server/citas/cosecha.test.ts`, comprobando el campo `ancla` de la `CitaAbreviada` cosechada (no el resultado del detector) para cada rama de la tabla D4 del diseño §6: (a) completa que resuelve con ancla → `ancla` de la abreviada siguiente es esa ancla; (b) completa que resuelve SIN ancla (b.2) → `ancla` `undefined`; (c) completa que NO resuelve (corte 1) → atribución nula y `ancla` `undefined`; (d) mención que resuelve a OTRO fichero → `ancla` `undefined` (corta); (e) mención que resuelve al MISMO fichero (b.1) → `ancla` sin cambio, conserva la de la completa anterior; (f) abreviada tras barra de celda (corte 2) → atribución nula sólo para ella, sin afectar al estado siguiente; (g) abreviada con ancla PROPIA → su campo `ancla` es la propia, y la vigente para la SIGUIENTE abreviada no cambia (la propia no se propaga). Todas nuevas, todas rojas hoy (el campo `anclaVigente` no existe): discrimina DCE-M3, DCE-M4, DCE-M7, DCE-M9 y DCE-M10.
- [x] 2.9 **DCE-P8** — nuevo `it` en `apps/desk/server/citas/hook.test.ts`, dentro o junto al describe del invariante de conservación (`` `apps/desk/server/citas/hook.test.ts:164-209` en `d2a89e9` ``). Fixture con git real: una línea por camino nuevo — abreviada heredada válida, heredada rota por contenido, fallo de ancla (revisión que no pela), fallo de ancla (fichero ausente en revisión real), ancla propia que gana sobre la heredada rota, huérfana con ancla propia falsa, completa con el final vacío. Afirma TRES cosas, como el invariante de hoy: (1) `cosechadas` igual a una constante contada a mano en el fixture; (2) la suma de comprobadas + saltadas + fueraDelRepositorio + noSonCitas + abreviadasRotas.length + bloqueantes.length + informadas es igual a esa constante; (3) el desglose EXACTO por sumando con `toEqual`. Rojo hoy: la abreviada heredada válida sale rota (se lee en LOCAL) — el desglose falla aunque la suma sola no lo vería (D5, es lo que distingue a DCE-M5).
- [x] 2.10 **H6, aserto existente #1** — endurecer `` `apps/desk/server/citas/detector.test.ts:123` en `d2a89e9` `` de `motivo: 'abreviada rota (atribuida a citado.md)'` a `motivo: 'abreviada rota (atribuida a citado.md): extremo inicial en línea vacía (línea 3 de citado.md)'`. Rojo literal: `toMatchObject` falla porque el motivo recibido hoy es el valor viejo, sin el extremo.
- [x] 2.11 **H6, aserto existente #2** — endurecer `` `apps/desk/server/citas/detector.test.ts:321` en `d2a89e9` `` de `motivo: 'abreviada rota (atribuida a .dockerignore)'` a `motivo: 'abreviada rota (atribuida a .dockerignore): extremo inicial fuera de rango (línea 9 de .dockerignore)'`. Mismo rojo literal.
- [x] 2.12 **H6, aserto existente #3 (endurecido, no sólo cambiado)** — `` `apps/desk/server/citas/informe.test.ts:43` en `d2a89e9` `` usa `toContain` con el prefijo `'doc.md, línea 1: ' + abreviada(9) + ' — abreviada rota (atribuida a a.md)'`, que seguiría verde sin discriminar H6 porque el literal nuevo empieza igual. Endurecer a `'doc.md, línea 1: ' + abreviada(9) + ' — abreviada rota (atribuida a a.md): extremo inicial fuera de rango (línea 9 de a.md)'`. Rojo tras endurecer: falta el sufijo del extremo en el texto de hoy.
- [x] 2.13 Confirmar con `npx vitest run apps/desk/server/citas` que cada tarea 2.1-2.12 da el rojo descrito (2.3 y 2.6a nacen verdes, sirven de control) y que `npm run typecheck` sale en verde — las pruebas sólo usan API ya existente, incluido el campo `ancla` de `CitaAbreviada`.

## Fase 3 — Implementación (commit 3, GREEN; mismo push que el commit 2)

- [x] 3.1 `apps/desk/server/citas/cosecha.ts`: nueva variable de estado por línea física `anclaVigente`, junto a `ultimoFicheroValido`/`ultimoFicheroValidoFin` (`` `apps/desk/server/citas/cosecha.ts:104-107` en `d2a89e9` ``). Reinicio en las ramas de D4: completa que resuelve con ancla → toma su ancla (`` `apps/desk/server/citas/cosecha.ts:124-126` en `d2a89e9` ``, DCE-M7 si se invierte); completa que resuelve sin ancla → `undefined` (b.2); completa que no resuelve → `undefined` (`` `apps/desk/server/citas/cosecha.ts:127-129` en `d2a89e9` ``, corte 1, DCE-M10 si no se reinicia); mención a otro fichero → `undefined` (`` `apps/desk/server/citas/cosecha.ts:150-153` en `d2a89e9` ``, DCE-M3 si no se reinicia); mención al mismo fichero → sin cambio (b.1). En la rama de la abreviada (`` `apps/desk/server/citas/cosecha.ts:134-136` en `d2a89e9` ``): `ancla = propia ?? anclaVigente` (DCE-M4 si se invierte el orden); `anclaVigente` NO cambia tras una abreviada, con o sin ancla propia (DCE-M9 si se hace cambiar). Comentario del contrato del campo (D1): "`ancla` es la revisión en la que se leería la abreviada — la propia o, si no la lleva, la vigente en su posición".
- [x] 3.2 `apps/desk/server/citas/detector.ts`: cuarta rama de `rotura()` (`` `apps/desk/server/citas/detector.ts:109-115` en `d2a89e9` ``), DESPUÉS de la tercera (`lineaVacia(lineasFichero[c.hasta - 1])` sobre el extremo final, motivo `extremo final en línea vacía`). Posición exacta: después de la comprobación del inicial vacío, nunca antes (DCE-M1 si se mueve antes de la tercera; DCE-M2 si antes de la segunda).
- [x] 3.3 `apps/desk/server/citas/detector.ts`, rama de la abreviada (`` `apps/desk/server/citas/detector.ts:187-203` en `d2a89e9` ``): la clave de lectura usa `arbolDeLectura(c, arbolLocal)` (`` `apps/desk/server/citas/detector.ts:124-126` en `d2a89e9` ``, el mismo ayudante que ya usa la completa en `` `apps/desk/server/citas/detector.ts:248` en `d2a89e9` ``) en vez de siempre `arbolLocal`. Orden de las ramas, cada una con su `continue` (D2): (1) `atribuidoA` nulo → huérfana; (2) con ancla y `arbolCacheado(ancla)` nulo → `abreviadasRotas`, "revisión inexistente" (DCE-M8 si se invierte con la 3); (3) contenido ausente en el lote, con ancla → `abreviadasRotas`, "fichero inexistente en la revisión"; (4) contenido ausente, sin ancla → `saltadas.noLegibles`, como hoy; (5) `rotura()` no nula → `abreviadasRotas` (DCE-M5 si se manda a `noLegibles` o a `candidatosDeBloqueo`); (6) resto → `comprobadas`. La primera pasada reúne las claves objeto con la misma `arbolDeLectura`: sin ancla, clave local; con ancla que pela, `<rev>:<atribuidoA>`; con ancla que no pela, ninguna clave.
- [x] 3.4 `apps/desk/server/citas/detector.ts`: un solo ayudante que compone "abreviada rota (atribuida a `<fichero>`" + " en `<rev>`" si hay ancla + "): " + el motivo — el de `rotura()` con su sufijo "(línea N de fichero)" en la rotura por contenido, o el fallo de ancla ("revisión inexistente" / "fichero inexistente en la revisión") sin extremo. Lo usan las tres ramas que escriben motivo de abreviada.
- [x] 3.5 `npm test` en verde con TODOS los rojos de la Fase 2 pasando (incluidas 2.3 y 2.6a, que ya lo estaban); `npm run typecheck`; `npm run lint -- --max-warnings 158`, como el CI (`.github/workflows/ci.yml`).
- [x] 3.6 `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` sobre el árbol tras 3.1-3.4: 0 bloqueantes; la abreviada de la línea 167 de `docs/sdd/Puntos_para_Gerencia_2026-09-11.md` (habilitar_servicio) aparece en abreviadas rotas con el literal de revisión inexistente (criterio 7 de la propuesta).
- [x] 3.7 Ejecutar las mutaciones de la Fase 4 (DCE-M1 a DCE-M11 y las tres primeras de DCE-M6) SOBRE este árbol verde, antes del push — ver Fase 4.
- [x] 3.8 Medición real: `git diff --shortstat` contra el commit de planificación (tarea 0.1) más `wc -l` de lo nuevo sin trackear (principalmente `apply-progress.md`); registrar en `apply-progress.md`. Si se acerca a 560 (70 % de 800), parar y preguntar antes de seguir con el commit 4 en el mismo intento (ver Review Workload Forecast). Push conjunto de los commits 2 y 3.

## Fase 4 — Las mutaciones (regla de mutación 1 y 2 del proyecto; tras el verde del commit 3, antes del push 2+3)

Procedimiento D6 para cada una: (1) copiar el fichero a la carpeta temporal de la sesión, fuera del
repositorio; (2) aplicar la mutación; (3) `npx vitest run apps/desk/server/citas` y comprobar que se
pone roja la prueba nombrada, no basta con que algo se ponga rojo; (4) restaurar desde la copia; `cmp`
entre copia y fichero; `git diff --exit-code` sobre el fichero.

- [x] 4.1 **DCE-M1** — `apps/desk/server/citas/detector.ts`: mover la cuarta rama de `rotura()` a ANTES de la tercera. Debe ponerse roja DCE-P3, sub-caso "dos extremos vacíos" (pasaría a nombrar el final).
- [x] 4.2 **DCE-M2** — mover la cuarta rama a ANTES de la segunda (variante: antes de la primera). Debe ponerse rojo el aserto endurecido de DCE-P3 (los de las tareas 2.3a y 2.3b); la variante (antes de la primera) pone rojo `apps/desk/server/citas/informe.test.ts:44` en `d2a89e9`, que ya compara el motivo entero.
- [x] 4.3 **DCE-M3** — `apps/desk/server/citas/cosecha.ts`: quitar el reinicio de `anclaVigente` en la rama de mención a otro fichero. Debe ponerse rojo DCE-P6, sub-caso "otro fichero" (hereda `rev1` en vez de leer en LOCAL) y la fila correspondiente de cosecha (2.8d).
- [x] 4.4 **DCE-M4** — `apps/desk/server/citas/cosecha.ts`: invertir la precedencia a `anclaVigente ?? propia`. Debe ponerse rojo DCE-P5 y la fila de cosecha 2.8g.
- [x] 4.5 **DCE-M5** — `apps/desk/server/citas/detector.ts`: mandar el fallo de ancla a `saltadas.noLegibles` (otra toma: a `candidatosDeBloqueo`, que bloquearía). Debe ponerse rojo DCE-P7 (las dos sub-partes) y el desglose exacto de DCE-P8 (mueve una unidad de sumando sin cambiar la suma total).
- [x] 4.6 **DCE-M7** — `apps/desk/server/citas/cosecha.ts`: que una completa válida SIN ancla conserve `anclaVigente` en vez de vaciarla. Debe ponerse rojo DCE-P4 (iii) — b.2 — y la fila de cosecha 2.8b.
- [x] 4.7 **DCE-M8** — `apps/desk/server/citas/detector.ts`: comprobar "revisión inexistente" DESPUÉS de "contenido ausente" (invertir el orden 2/3 de D2; otra toma: comprobarlo antes de la rama huérfana, orden 1). Debe ponerse rojo el literal de DCE-P7 (i) y el desglose de DCE-P8.
- [x] 4.8 **DCE-M9** — `apps/desk/server/citas/cosecha.ts`: que el ancla propia de una abreviada pase a ser la `anclaVigente` para la siguiente. Debe ponerse roja la fila de cosecha 2.8g (la vigente cambiaría tras la abreviada con ancla propia).
- [x] 4.9 **DCE-M10** — `apps/desk/server/citas/cosecha.ts`: que el corte 1 (completa que no resuelve) NO reinicie `anclaVigente`. Debe ponerse roja la fila de cosecha 2.8c.
- [x] 4.10 **DCE-M11** — `apps/desk/server/citas/detector.ts`: que la abreviada pregunte a `repo.arbol()` sin la caché `arbolCacheado` (`` `apps/desk/server/citas/detector.ts:154-158` en `d2a89e9` ``). Debe ponerse rojo el contador de llamadas de DCE-P4 (i).
- [x] 4.11 **DCE-M6, sub-mutaciones 1-3 (regla de mutación 2, fichero vigilado real)** — para cada una: copia de respaldo fuera del repositorio; devolver SÓLO la línea reparada de esa reparación a su texto de `d2a89e9` (a mano, no con `git show` del fichero entero — la spec de tickets-core lleva dos reparaciones y se revertirían juntas); `T=$(git stash create)` (Git Bash) o `$T = git stash create` (PowerShell) — si `T` sale vacío, la mutación no se aplicó, parar; `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha $T` (o `npx --no tsx` en PowerShell); restaurar; `cmp`; `git diff --exit-code`. Esperado ROJO en las tres, salida 1, cada una en "Bloqueantes" con su cita cruda: (1) admin.test.ts con el rango viejo → motivo que empieza por "ambigua, rota en sus" — literal medido por el diseño: "ambigua, rota en sus 2 candidatas (línea 67 de directory.ts)"; (2) Paquete de Despliegue con el rango viejo → "ambigua, rota en sus 3 candidatas (línea 40 de vistas-tablero/spec.md)"; (3) tickets-core/spec.md línea 544 con el rango viejo → "ambigua, rota en sus 3 candidatas (línea 70 de migrate.ts)". `sdd-apply` vuelve a registrar los tres literales exactos con el detector real (son medidos de segunda mano por el diseño).
- [x] 4.12 **DCE-M6, sub-mutaciones 4-5 — verde medido, no rojo esperado (decisión de Gerencia, 2026-09-15)** — mismo procedimiento sobre las reparaciones nº 4 (tickets-core/spec.md línea 328) y nº 5 (comentario de directory.ts línea 20). Ninguna de las dos se promete roja: la nº 4 cita la ruta completa y única del 61 al 66, con los dos extremos con contenido (error de referente, no de sintaxis); la nº 5 es una abreviada huérfana, y una huérfana no se comprueba. Ejecutar igual, registrar el verde medido como hueco H2 del diseño (lectura humana, no aserción automatizada).
- [x] 4.13 Control previo antes del push: `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit 3 (post-restauración de todas las mutaciones) da 0 bloqueantes.

## Fase 5 — Cierre (commit 4)

- [x] 5.1 **Barrido de la regla de mutación 4** sobre `apps/desk/server/citas/detector.ts` y `apps/desk/server/citas/cosecha.ts`: `git grep` de citas completas ancladas a esos dos ficheros en todo el repositorio, y segundo pase de abreviadas en los ficheros que ya los citan (la forma abreviada no la caza el grep). Cada resultado se resuelve por caso A, B o C leyendo la frase contra el fichero (tabla de la regla de mutación 4 de CLAUDE.md), comprobando el principio y el final del rango por separado y que ninguno cae en línea vacía. Registrar el resultado del barrido (cuántas citas, cuántas siguen A/B/C) en `apply-progress.md`.
- [x] 5.2 **Retirar los dos hallazgos de `hallazgos_que_siguen_vivos`** en `openspec/config.yaml` (entrada que hoy dice "(1) El detector sólo comprueba que el extremo INICIAL... (2) Una abreviada que va detrás de una cita anclada se atribuye a su fichero pero se lee contra el sha local...") como **caso C**: se conservan con su contenido y se añade qué los cerró — `detector-citas-extremos`, con la fecha de cierre y una frase de qué cambió (cuarta rama de `rotura()`; lectura de la abreviada en su ancla, D2).
- [x] 5.3 **Retirar el párrafo de IV-10** en `CLAUDE.md` (el que dice "Lo que NO se cerró con IV-10, y sigue VIVO como pendiente de tanda SDD: (1)... (2)...") como **caso C**, con el mismo criterio que las entradas IV-1/IV-3/IV-5/IV-6/IV-7 ya cerradas del mismo fichero: se deja escrito que está cerrado, qué lo cerró y con qué fecha, para que ninguna tanda futura lo vuelva a anotar como vivo.
- [x] 5.4 **Añadir el hallazgo de `REVISION_RE`** a `hallazgos_que_siguen_vivos` de `openspec/config.yaml` (decisión (d) de la propuesta §2): el patrón de `` `apps/desk/server/citas/cosecha.ts:60` en `d2a89e9` `` acepta cualquier palabra como ancla; en una abreviada, una palabra que no es revisión pasa a "fallo de ancla" informativo (la de habilitar_servicio); en una completa ya bloqueaba. Sin destino asignado, fuera de alcance de esta tanda por decisión de Gerencia.
- [x] 5.5 Confirmar si alguna cifra del informe citada en documentos de la tanda cambió (hipótesis de la propuesta: `apps/desk/server/citas/informe.ts` no cambia, así que no debería hacer falta); actualizar si corresponde.
- [x] 5.6 `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` y el hook en verde tras el cierre: 0 bloqueantes, 0 caducadas, línea base en 0. `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 158`. Medición real (`git diff --shortstat` contra el commit de planificación + `wc -l` de lo nuevo sin trackear), registrada en `apply-progress.md`. Push propio del commit 4.

## Fase 6 — Verificación final

- [x] 6.1 `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 158` en verde sobre el árbol final. Confirmar los 13 criterios de aceptación de la propuesta (§16), uno a uno, con su evidencia. **Matizado el 2026-09-16:** `typecheck` y `lint` salen en 0 (158 avisos, el techo del CI); `npm test` da 1131 pasadas, 2 saltadas y **0 fallos**, pero el proceso sale en **1** por un error de infraestructura de vitest. El criterio 11 queda declarado en sus dos mitades en `apply-progress.md`, con las siete mediciones que prueban que ese 1 es ANTERIOR a la tanda.

---

## Tareas de PERSONA — ninguna (regla del ciclo 1)

Comprobado: ningún criterio de aceptación de esta tanda depende de una decisión o verificación fuera
del repositorio.

- La "verificación en la app" de la convención habitual (`docs/sdd/verificacion-en-la-app.md`) **no
  aplica**: el detector de citas es código de servidor inerte (regla invariable 13, design §2), sólo
  corre bajo el hook de `pre-push`; no tiene resultado visible en `ambientalia-desk.ambientalia.cloud`.
- La lectura de las reparaciones nº 4 y 5 de DCE-M6 (que el detector no ve, tarea 4.12) **no es tarea
  de persona**: es trabajo que la propia tanda ejecuta y registra dentro del `sdd-apply` (hueco H2,
  lectura humana DENTRO del ciclo de la tanda, no una comprobación externa pendiente de otro rol).
- No hay ninguna decisión de Gerencia pendiente: las tres rondas de preguntas (§2 de la propuesta, (a)
  a (d), b.1-b.3, H6, delta corregido, M6) ya están respondidas y llevadas al diseño y a este `tasks.md`.

Ninguna casilla se saca del recuento de esta tanda.
