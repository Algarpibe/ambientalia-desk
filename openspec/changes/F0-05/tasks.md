# Tasks: F0-05 · Mecanismo de reconciliación y bandeja de entrada

## Review Workload Forecast

Presupuesto efectivo del proyecto: **800 líneas** (`openspec/config.yaml:22-30`), que gana sobre el
default de 400 de la skill. El corte R1/R2 es por **dependencia** (design.md §1: R2 mide lo que R1
escribe), no por presupuesto — pero cada rebanada se mide por separado y ninguna se acerca al techo.

### R1 «el contrato»

| Campo | Valor |
|---|---|
| Líneas estimadas | ~450-540 (`cabecera.ts` + tests + wiring + 13 cabeceras + `CLAUDE.md`) |
| Riesgo contra 800 | Medium |
| PRs encadenados | Yes — primero de dos intentos del mismo cambio |
| Estrategia de cadena | stacked-to-main (commit directo, sin rama de PR) |
| Decisión antes de aplicar | No — ya resuelta por Gerencia, obs. #743/#744 |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

### R2 «el barrido»

| Campo | Valor |
|---|---|
| Líneas estimadas | ~300-380 (`reconciliacion/*` + tests + `config.yaml` + `package.json`) |
| Riesgo contra 800 | Low |
| PRs encadenados | Yes — segundo de dos intentos, depende de que R1 exista |
| Estrategia de cadena | stacked-to-main |
| Decisión antes de aplicar | No — ya resuelta, obs. #743/#744 |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low
```

### Suggested Work Units

| Unit | Goal | Focused test | Runtime harness | Rollback boundary |
|---|---|---|---|---|
| R1 | Comprobación de forma R-1 + 13 cabeceras + cierre F0-04 | `npm test -- apps/desk/server/citas` | `pre-push` real sobre un repo git de prueba (hook end-to-end) | revertir `cabecera.ts`, el wiring de `cli.ts`/`informe.ts` y las líneas de cabecera; R2 no ha empezado |
| R2 | 6 comprobaciones + guardas + `reconcile` | `npm test -- apps/desk/server/reconciliacion` | `npm run reconcile` sobre el árbol real | revertir `reconciliacion/`, `package.json` y las líneas de `config.yaml`; R1 queda intacto |

---

## Hallazgos del orquestador — recogidos, no resueltos

> **CAMBIO DE ÁRBOL DE PARTIDA, 2026-09-18: `995adbc` → `5cfd056`.** Gerencia commiteó las ediciones
> ajenas (`docs: regla de no mencionar reuniones, decisiones de Gerencia del 17 y 18/09 y tabla 4.5 sin
> sesiones`, 3 ficheros, +99/-28). Eso **cierra H-a y H-b** y mueve las citas de los TRES ficheros que
> tocó. Los demás ficheros citados son idénticos byte a byte entre las dos revisiones
> (`git diff --name-only 995adbc 5cfd056` da sólo esos tres), así que las citas a `cli.ts`,
> `detector.ts`, `cosecha.ts`, `guardianes.test.ts` y el runbook **se quedan ancladas en `995adbc`**:
> siguen siendo verificables y no se renumeran. El desplazamiento **NO es uniforme** —es el patrón que
> la regla de mutación 4 describe— y por eso se aplica ancla a ancla, nunca con una resta:
>
> | Ancla | `995adbc` | `5cfd056` | Δ |
> |---|---|---|---|
> | `CLAUDE.md` · `## Reconciliación y bandeja de entrada` | 411 | **419** | +8 |
> | `CLAUDE.md` · «Y la bandeja NO ES FUENTE» | 455-457 | **463-465** | +8 |
> | `config.yaml` · `capabilities:` | 104 | **104** | 0 |
> | `config.yaml` · `incumplimientos_vivos:` | 307 | **337** | +30 |
> | `config.yaml` · «respuesta TEXTUAL» | 1234-1236 | **1264-1266** | +30 |
> | `config.yaml` · `reglas_de_lectura:` | 1267 | **1330** | +63 |
> | `config.yaml` · ids `a` / `b` / `c` | 1268 / 1273 / 1278 | **1331 / 1336 / 1341** | +63 |
> | `plan:360`, `plan:459` | 360, 459 | **360, 459** | 0 (28/28, sin desplazamiento neto) |

- **H-a** (→ R1.0.1, R1.4.4) · **CERRADO por `5cfd056`** — caso C de la regla de mutación 4. Lo que
  afirmaba era cierto de su momento y se conserva: ediciones ajenas sin commitear sobre `995adbc`,
  `CLAUDE.md` +8 líneas (sección «Regla de redacción»), `openspec/config.yaml` **+63** líneas —no +33,
  la mano ajena siguió editando después de escribirse esta ficha—, plan 360-390 reescrito (28/28),
  **13** ficheros sin trackear en `docs/sdd/` más la carpeta `openspec/changes/F0-05/`. Su riesgo —la
  regla del ciclo 2, una segunda mano imputando sus líneas al ledger de R1— **ya no aplica**: el dueño
  las commiteó antes del `acquire` y el árbol trackeado queda limpio.
- **H-b** (→ «Punto abierto» abajo) · **CERRADO por `5cfd056`** — caso C, y exactamente como esta
  ficha predijo. Decía: `plan:360` en `995adbc` sólo dice «se guarda en Engram», y si la edición se
  commitea sería caso C. Se commiteó. `plan:360` en `5cfd056` dice hoy «se escribe en
  `openspec/config.yaml` → `decisiones_de_gerencia` con su respuesta textual, se guarda en Engram
  (`decision/<clave>`)»: las dos autoridades ya no se contradicen, config.yaml es dónde se escribe y
  Engram la copia. Ver «Punto abierto» abajo, conservado con lo que lo cerró.
- **H-c** (→ R1.4.2) · **SIGUE VIVO.** `CLAUDE.md:411` en `995adbc` —hoy **`:419` en `5cfd056`**— es el
  ENCABEZADO de sección, no la frase que se le atribuye. Nueve usos: `design.md` §0, §10, §10.2;
  `proposal.md` líneas 138, 206, 552, 775 (sin ancla); `specs/citas-verificables/spec.md:28`;
  `specs/reconciliacion/spec.md:281`.

---

## R1 · Fase 0 — Precondición y arranque del intento

- [x] R1.0.1 H-a: confirmar que las ediciones ajenas están commiteadas por su dueño o fuera del árbol
      de R1. Si no, **parar y preguntar**; no lo decide esta tanda. → **CUMPLIDA el 2026-09-18**:
      Gerencia las commiteó en `5cfd056` (3 ficheros, +99/-28) y `git status` no deja ningún fichero
      trackeado modificado. El árbol de partida de R1 es **`5cfd056`**, no `995adbc`.
- [x] R1.0.2 `sdd-attempt acquire` sobre `main` para iniciar el intento de R1 (el ledger mide desde
      aquí; cumplida R1.0.1). Commit de partida: **`5cfd056`**.

## R1 · Fase 1 — Núcleo `cabecera.ts` (RED→GREEN) — RQ-CV-19

- [x] R1.1.1 RED: sin bloque `---` inicial ⇒ espera invalidez, recibe `[]`.
- [x] R1.1.2 RED: `fuera-del-plan` + `motivo: ""` ⇒ espera `campo: 'motivo'`.
- [x] R1.1.3 RED: falta `origen_cabecera` ⇒ espera `campo: 'origen_cabecera'`.
- [x] R1.1.4 RED: dominio cerrado (`cierra: quizá`, `origen_cabecera: heredada`) ⇒ espera el campo y su
      dominio.
- [x] R1.1.5 RED, control del otro signo: `tanda: F9-99` con forma válida ⇒ espera `[]` (pasa aunque el
      contenido sea discutible).
- [x] R1.1.6 GREEN: crear `apps/desk/server/citas/cabecera.ts` — parser propio de 7 claves, sin
      dependencia YAML (D3), con las frases «código INERTE» y «NADA de producción lo importa» que ya
      exige `guardianes.test.ts:66-75` en `995adbc` (no se modifica ese guardián: nace conforme).
      Tipos `CabeceraR1` / `CabeceraInvalida` / `ResultadoCabeceras` de `design.md` §5.

## R1 · Fase 2 — Las trece cabeceras (RQ-CV-20) + cierre 2b

- [x] R1.2.1 Cabecera en los ocho archivados, valores de `proposal.md §4.1` (sólo se añaden líneas).
- [x] R1.2.2 Cabecera en `F0-01`, `F0-02`, `F0-03`, valores de `proposal.md §4.2` (con los tres avisos
      ⚠️ de §4.3, sin resolverlos).
- [x] R1.2.3 Cabecera de `orden-precedencia-guardas/proposal.md` en `main` (proposal §5.1).
- [x] R1.2.4 La MISMA cabecera de `orden-precedencia-guardas/proposal.md`, en el worktree `f1b-10-r1`
      (proposal §5.1) — si entrara sólo en `main`, la fusión de la rama reintroduce el bloqueo.
      **HECHA el 2026-09-20**, commit `21b16ec` de la rama `f1b-10-r1`: +10/-0, bytes idénticos a la
      copia de `main`. No mueve la medición del intento: ese worktree no es su árbol.
- [x] R1.2.5 (2b) `F0-04/proposal.md`: cabecera con `cierra: no`, `origen_cabecera: derivada-17/09`;
      `Estado` deja de decir «pendiente de visto bueno»; las tres casillas de secretos se declaran
      aparte (ver «Fuera del recuento» abajo).
- [x] R1.2.6 M1 (mutación, regla de mutación 2, sin rojo literal): ensuciar **EN DISCO** una copia de
      trabajo de una de las trece cabeceras reales; el guardián sobre ese árbol debe marcarla inválida;
      restaurar el fichero y comprobar `git diff --quiet`.

## R1 · Fase 3 — Activación (ÚLTIMO paso de R1) — RQ-CV-10, RQ-CV-19

- [x] R1.3.1 RED: un `proposal.md` bajo `openspec/changes/archive/` sin cabecera debe salir en
      `invalidas`; hoy sale `[]` porque el alcance aún no existe.
- [x] R1.3.2 D2, casilla con prueba propia: el alcance de cabeceras **NO** reutiliza `EXCLUSIONES`
      (`cli.ts:48` en `995adbc`, `'openspec/changes/archive/',`). M2 (mutación, regla de mutación 2):
      unificar temporalmente el alcance con `EXCLUSIONES`; R1.3.1 debe dejar de detectarse; revertir
      con `git diff` y recomprobar.
- [x] R1.3.3 GREEN: enchufar `comprobarCabeceras()` en `ejecutar()` (`cli.ts:134-179` en `995adbc`),
      lista de alcance propia (rutas trackeadas, patrón `openspec/changes/**/proposal.md`, archive
      incluido).
- [x] R1.3.4 RED→GREEN: quinta cifra «cabeceras R-1 inválidas» en `informe.ts`, sin tocar el invariante
      de conservación de citas (D4, `detector.ts:53-56` en `995adbc`).
- [x] R1.3.5 M4, regla de mutación 1 (posición): con cita rota y cabecera inválida a la vez en el mismo
      push, mover el barrido de cabeceras detrás del bucle sin retorno temprano
      (`cli.ts:162-169` en `995adbc`) y comprobar que deja de nombrar las dos; revertir con `git diff`.
- [x] R1.3.6 `CLAUDE.md`: R-1 pasa a **siete** campos con `origen_cabecera`, dentro de la sección cuyo
      encabezado es `CLAUDE.md:419` en `5cfd056` (`:411` en `995adbc`; no se re-ancla el resto de la
      sección aquí).
- [x] R1.3.7 Guardián de binarios (`guardianes.test.ts:16-18` en `995adbc`): los ficheros nuevos,
      trackeados y sin NUL.

## R1 · Fase 4 — Cierre de R1: barrido de anclaje, comprobación de commit y medición

- [x] R1.4.1 Barrido de anclaje (regla de mutación 4): tomar `git diff --name-only 5cfd056`
      de R1 — incluye `cli.ts`, `informe.ts`, `CLAUDE.md` y los 14 `proposal.md` tocados (13
      cabeceras nuevas más el ajuste de `F0-04`). Por cada fichero,
      `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` sobre el repositorio; cada resultado comprobado contra
      el fichero — qué **afirma** la frase, no sólo que la línea exista. Segundo pase para abreviadas
      (`` `:NNN` `` sin nombre de fichero) en los documentos que ya citan esos módulos.
      **Reparadas 3** (`docs/sdd/F0-01_Correcciones_para_el_plan.md:226`, `openspec/config.yaml:1157`,
      `openspec/specs/transitions-st/spec.md:12`, todas `F0-04/proposal.md:18→28` o `:20-26→30-36`).
      **Reparadas 4 más: las que esta misma tanda rompió** al insertar diez líneas de cabecera arriba
      de trece proposals. Es la regla de mutación 4 ocurriendo en vivo, y la caza el propio detector al
      comparar sus bloqueantes contra los de la base: 26 en la base, 12 aquí, con cinco entradas nuevas
      de las que tres eran roturas reales. Los cuatro se nombran **en prosa y sin forma de cita, a
      propósito**: escritos como cita, el detector los trataría como rotos (regla de mutación 4, quinto
      guion). Son las líneas 42 y 43 del fichero `spec.md` de `transitions-st` dentro de
      `openspec/changes/orden-precedencia-guardas/specs/`, que apuntaban a las líneas 120 y 194 de los
      proposals de F0-01 y F0-04 y hoy van a la 130 y la 204; y la línea 203 de
      `docs/sdd/R08.3_Expediente_de_cambios.md`, que apuntaba a la 419 del proposal archivado de
      `por-entregar-es-espera` y hoy va a la 429. **La de F0-04 el detector NO la cazaba**, porque la
      línea 194 de hoy tiene texto: pasaba **válida por casualidad**, el modo que
      `openspec/config.yaml:944-947` registra. La encontró comprobar qué afirma la frase, no que la
      línea exista.
- [x] R1.4.2 H-c: clasificar por A/B/C **y reparar** a la línea que dice lo afirmado las citas de
      la línea 411 de `CLAUDE.md` que hoy apuntan al encabezado y no a la frase —el número se nombra
      en prosa a propósito: escrito como cita, el detector lo trataría como roto, porque esa línea es
      hoy una línea vacía— p.ej. «la decisión vive en
      `config.yaml`» está en `CLAUDE.md:463-465` en `5cfd056` (`:455-457` en `995adbc`). Aplica a
      `proposal.md` líneas 138, 206,
      552, 775 y a `specs/citas-verificables/spec.md:28` / `specs/reconciliacion/spec.md:281`.
      **Excepción:** los tres usos de `design.md` (§0, §10, §10.2) se clasifican y se listan, pero
      **no se reparan** sin visto bueno de Gerencia — el diseño se queda como está.
- [x] R1.4.3 Citas dentro de diagramas ASCII y bloques de código: comprobar con `REVISION_RE`
      (`cosecha.ts:63` en `995adbc`) y `NOMBRE_FICHERO` (`:67`) toda cita en los artefactos de este
      cambio y en el código nuevo de R1. `.githooks/pre-push:4` ya lleva ancla en `design.md §2`
      (reparada por obs. #754); no repetir esa reparación. Cualquier cita nueva sin ancla dentro de un
      bloque, se ancla en el momento. **Comprobado: el código nuevo de R1 (`cabecera.ts`, `cli.ts`,
      `informe.ts` y sus pruebas) no introduce ninguna cita `` `ruta:N` `` nueva.**
- [x] R1.4.4 H-a: verificar con `git diff --cached` que el commit de R1 lleva **sólo** sus propios
      trozos. Las ediciones ajenas ya NO son el riesgo (las cerró `5cfd056`); lo que se comprueba es
      que no se cuele nada nuevo que entre en el árbol durante el intento.
- [x] R1.4.5 Medir R1 en worktree aislado (`C:/dev/Desk_2_R1.023-worktrees/f0-05-r1`, sibling, nunca
      temporal): `git diff --shortstat --no-renames 5cfd056` **+** `wc -l` de lo nuevo sin
      trackear, sobre el diff propio de R1. Si supera 800, **parar y preguntar** antes de `settle`.
      **MEDIDO: 2.728 líneas (2.716 inserciones + 12 borrados), 28 ficheros — SUPERA el techo de 800.**
      **PARADO, sin commit, sin `settle`.** Desglose: 494 líneas son la implementación de R1 en sí
      (dentro del rango 450-540 estimado); **2.234 son los propios artefactos de F0-05**
      (`proposal.md` 918 + `design.md` 545 + `tasks.md` 312 + las dos delta specs 291+168), que
      llegaron **sin commitear** al `git status` de arranque de esta tanda (`?? openspec/changes/F0-05/`)
      y este `sdd-attempt` es el primero en tocar el árbol desde entonces. Decisión pendiente de
      Gerencia/orquestador: ver el informe de esta tanda.
- [x] R1.4.6 Con la medición dentro de presupuesto: escribir el `apply-progress` y `sdd-attempt
      settle` de R1. **HECHA el 2026-09-20**, tras el `reset` a `generation: 2` que rebasó el intento
      sobre `38c9c04`: R1 mide **738** líneas, **753** con este cierre, contra el techo de **800**. La
      evidencia, el desglose y lo que el detector sigue bloqueando van en el `apply-progress`.

---

## R2 · Fase 0 — Arranque del intento

- [ ] R2.0.1 `sdd-attempt acquire` sobre `main`, con el commit de cierre de R1 como commit de partida
      de R2.
- [ ] R2.0.2 **RE-ANCLAR LAS CITAS DE `config.yaml` AL COMMIT DE CIERRE DE R1, LEÍDAS DEL COMMIT Y NO
      DEL ÁRBOL.** Es una casilla, no un aviso. `R2.2.3` cita `:1330` / `:1331` / `:1336` / `:1341` y
      `R2.2.4` cita `:337`, todas en `5cfd056`: **ciertas contra `5cfd056` y potencialmente falsas
      contra el árbol que R1 deja**, porque R1 no toca `config.yaml` pero cualquier otra mano sí puede.
      Método obligatorio, el mismo que ya mordió dos veces hoy: `git show <cierre de R1>:openspec/config.yaml | grep -n`
      para cada ancla (`capabilities:`, `incumplimientos_vivos:`, `reglas_de_lectura:`, `- id: a|b|c`),
      **nunca** `sed -n` sobre el fichero del árbol. Comprobar los rangos por los **dos extremos**. Si
      alguna se movió, re-anclar antes de tocar nada; el desplazamiento **no es uniforme** y no se
      aplica con una resta (medido `995adbc`→`5cfd056`: 0, +30, +63 en el mismo fichero).

## R2 · Fase 1 — Núcleo de reconciliación (RED→GREEN) — RQ-RC-01 a RQ-RC-04

- [ ] R2.1.1 RED: dos llamadas sobre el mismo árbol sintético devuelven textos distintos
      (determinismo, RQ-RC-02).
- [ ] R2.1.2 RED: huérfana ⇒ espera código ≠0, recibe 0; `esperas 4/11` ⇒ espera 0 (RQ-RC-03).
- [ ] R2.1.3 RED: árbol sintético con `ESTADOS_EN_ESPERA` de once y `cifras_ancladas` diciendo otra
      cosa ⇒ espera 11, leído del código (RQ-RC-04).
- [ ] R2.1.4 GREEN: `comprobaciones.ts` (núcleo puro, tipos `Comprobacion`/`Arbol`/`Hallazgo` de
      `design.md` §5), `informe.ts` (render determinista, fecha del commit medido — D7, pregunta
      abierta para Gerencia si debiera ser la del reloj) y `cli.ts` (adaptador `spawnSync` propio, sin
      importar `citas/git.ts` — D6).

## R2 · Fase 2 — Guardas del autocertificado + regla (d) + `estado` en las 12 IV — RQ-RC-05 a RQ-RC-08

- [ ] R2.2.1 RED: entrada de `incumplimientos_vivos` sin `estado` ⇒ espera **defecto de registro**,
      recibe «vivo» (RQ-RC-08).
- [ ] R2.2.2 M3 (mutación): quitar la regla (d) de `unidad_de_avance` en una copia de `config.yaml`; el
      guardián debe pedir los cuatro ids `a,b,c,d` con las tres primeras intactas; revertir con `cmp`.
- [ ] R2.2.3 `openspec/config.yaml`: cuarta regla de lectura en `unidad_de_avance` (RQ-RC-07), dentro
      del bloque `reglas_de_lectura` (`:1330` en `5cfd056`), sin tocar `a` (`:1331`), `b` (`:1336`) ni
      `c` (`:1341`), todas en `5cfd056` (eran `:1267` / `:1268` / `:1273` / `:1278` en `995adbc`).
- [ ] R2.2.4 `openspec/config.yaml`: campo `estado` en las 12 entradas de `incumplimientos_vivos`
      (`:337` en `5cfd056` y siguientes; era `:307` en `995adbc`): `CERRADO` en IV-1,3,4,5,7,10; IV-6 pasa a `CERRADO`
      conservando su prosa en clave propia; `estado` nuevo (vivo) en IV-2,8,9,11,12.
- [ ] R2.2.5 Comprobación 2 + guarda (b): marcar `F0-02` «sin verificar» (su `maestro: [Anexo H]` no
      cruza con `plan:456`) — resultado esperado, no se corrige.
- [ ] R2.2.6 Extender el grafo de imports del guardián existente (`guardianes.test.ts:50-55` en
      `995adbc`) a `apps/desk/server/reconciliacion/`, con el control del otro signo de `:57-64`.

## R2 · Fase 3 — `npm run reconcile` + `capabilities` (RQ-RC-09) + cierre

- [ ] R2.3.1 `package.json`: script `reconcile` (sección `scripts`).
- [ ] R2.3.2 `openspec/config.yaml → capabilities`: añadir `reconciliacion` (`:104` en `5cfd056`, la
      única ancla que NO se movió) **en
      este mismo cambio** (RQ-RC-09) — la comprobación 1 debe salir con 0 huérfanas en su primera
      ejecución.
- [ ] R2.3.3 Ejecutar `npm run reconcile` sobre el árbol real y verificar las cifras de cierre:
      **18 capacidades · 9 specs (10 tras `sdd-archive`) · 0 huérfanas · 5 fuera del plan · 5 IV vivos
      · esperas 4/11 (divergencia legítima)**; numerador **4 derivables + 7 por commit = 11 de 52**.
      Los ficheros de `docs/sdd` sin trackear **NO** son una cifra fija: `RQ-RC-01` ancla 11 sólo
      contra `ce93480`; se espera el número que `git` mida en ese momento (otra mano sigue añadiendo
      ficheros ahí).
- [ ] R2.3.4 Guardián de binarios (`guardianes.test.ts:16-18`) sobre los ficheros nuevos de
      `reconciliacion/`.
- [ ] R2.3.5 Barrido de anclaje (regla de mutación 4) con `git diff --name-only <commit de cierre de
      R1>` de R2 — incluye `config.yaml`, `package.json`, `guardianes.test.ts` y los ficheros nuevos
      de `reconciliacion/`. Mismo método que R1.4.1: `grep -rnoE` por fichero, comprobación contra lo
      que afirma cada frase, y segundo pase de abreviadas.
- [ ] R2.3.6 Verificar con `git diff --cached` que el commit de R2 lleva sólo sus propios trozos.
- [ ] R2.3.7 Medir R2 en worktree aislado (`C:/dev/Desk_2_R1.023-worktrees/f0-05-r2`, sibling, nunca
      temporal): `git diff --shortstat --no-renames <commit de cierre de R1>` **+** `wc -l` de lo nuevo
      sin trackear. Si supera 800, **parar y preguntar** antes de `settle`.
- [ ] R2.3.8 Con la medición dentro de presupuesto: escribir el `apply-progress` y `sdd-attempt
      settle` de R2 sobre `main`.

---

## Fuera del recuento — rotación de secretos (regla del ciclo 1)

Dueño: **Gerencia**. Destino: `docs/runbooks/verificaciones-pendientes-F0.md:98-100` en `995adbc`.
**Archivar esta tanda NO las da por hechas.** Sin casilla — una tarea de una persona fuera del
repositorio no es una unidad de trabajo (regla del ciclo 1).

| Casilla | Dónde se ejecuta | ¿Trabajo de repositorio? |
|---|---|---|
| `ZOHO_CLIENT_SECRET` + los tres refresh tokens (atómica) | gestor de secretos del despliegue | No |
| Los tres passwords de BD | gestor de secretos del despliegue | No |
| `hub_reader`, con su `ALTER SUBSCRIPTION … CONNECTION` | PostgreSQL de producción | No |

## Punto abierto — CERRADO por `5cfd056` el 2026-09-18 (caso C)

**Se conserva con su revisión y con qué lo cerró**, como manda el caso C de la regla de mutación 4;
renumerarlo o borrarlo perdería por qué llegó a estar abierto.

*Lo que decía, y era cierto de `995adbc`:*
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:360` en `995adbc` dice que una decisión
cerrada «se guarda en Engram (`decision/<clave>`)»; `CLAUDE.md:411` en `995adbc` dice que vive en
`openspec/config.yaml → decisiones_de_gerencia`. Los dos son autoridad y no dicen lo mismo (H-b): hoy
la edición ajena sin commitear ya alinea el árbol de trabajo con la segunda lectura, pero eso no está
en ninguna revisión — si se commitea, sería caso C de la regla de mutación 4. Precedente:
`decision/tanda-por-contenido` está en la columna «Decisión» de `plan:459` en `995adbc` y no tiene fila
propia en §4.5. Se registra como punto abierto con dueño Gerencia, por la cláusula de cierre de R-3
(«si no cabe en ninguno... se queda como punto abierto CON DUEÑO»); no lo decide esta tanda.

*Qué lo cerró:* `5cfd056` commiteó esa edición, así que el caso C que esta ficha anticipaba se cumplió
literalmente. `plan:360` en `5cfd056` dice hoy: «Cuando una decisión se cierra, **se escribe en
`openspec/config.yaml` → `decisiones_de_gerencia` con su respuesta textual**, se guarda en Engram
(`decision/<clave>`) y la tanda pasa de "escrita" a "ejecutable"». Las dos autoridades ya no se
contradicen: `config.yaml` es **dónde se escribe**, Engram es **la copia**. No queda punto abierto y
Gerencia no tiene nada que decidir aquí. El precedente de `tanda-por-contenido` (en «Decisión» de
`plan:459`, sin fila propia en §4.5) sigue siendo cierto y no dependía de esta tensión.

## Precondiciones documentales — contadas

Contra el fichero hay **una aplicada** (proposal §8, por `ce93480`: fila F0-05 y denominador 51→52) y
**ninguna viva**. La segunda que el proposal menciona era hipotética (colgaba de la salida (3) para
F0-04, no elegida).

## Decisiones del §10 del diseño

No se escriben aquí como tareas. La lista, sus obs. de Engram y la marca «¿parece gate?» quedan como
están en `design.md` §10; las redacta Gerencia (`openspec/config.yaml:1264-1266` en `5cfd056`,
`:1234-1236` en `995adbc`, exige
respuesta textual, no un resumen).

## Desvíos de contrato declarados

1. `design.md` supera el techo de 800 palabras de su skill (5.791 palabras, obs. #753/#754); los ocho
   `design.md` archivados también lo superan (1.940 a 7.877). F0-05 queda a media tabla. Desvío
   deliberado y evidenciado: el origen es la banda de 450-650 líneas que fijó quien hizo el encargo,
   no el criterio del subagente. No se recorta.
2. Este `tasks.md` supera las 530 palabras que fija la línea 253 del `SKILL.md` de `sdd-tasks` —vive
   fuera del repositorio, así que se nombra en prosa y no como cita—; medido en los ocho `tasks.md`
   archivados: de 1.105 a 8.610 palabras, ocho de ocho por encima del techo. El origen es la
   instrucción del orquestador de este turno, no el criterio de este subagente.
