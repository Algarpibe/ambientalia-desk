# Informe de archivo — `hojas-vida` (F1B-02)

| Dato | Valor |
|---|---|
| Tanda | F1B-02 — fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:157` |
| Cabecera R-1 | `cierra: si` · `toca_maestro: si` · `capacidad: [hojas-vida]` · `maestro: ["ítem 9", "P8"]` (`proposal.md:1-9`) |
| Base | `acf2701`; `main` (`1b45cb2`) fusionado en la rama por `afa0add` antes de archivar |
| Archivado | 2026-09-23, en `openspec/changes/archive/2026-09-23-hojas-vida/` |
| Verify | PASS WITH WARNINGS · 0 CRITICAL, sobre `749eeff`. Al cierre, `verify-report.md` lleva 4 WARNING y 2 SUGGESTION: el cuarto aviso lo añadió `4a9ebb9`, después del verify |

Este informe registra el estado **al cierre**. `apply-progress.md` y `verify-report.md` son
instantáneas intermedias: donde discrepen de lo que sigue, manda lo que sigue.

## 1 · Qué se fusionó en las specs vivas

- **`hojas-vida`, capacidad nueva.** `openspec/specs/hojas-vida/spec.md`, 183 líneas: 8 requisitos
  (RQ-HV-01..08) y 8 escenarios automáticos. Las dos comprobaciones de persona de RQ-HV-07 no cuentan
  como escenarios (sección 4). Ya estaba declarada en `openspec/config.yaml:149-151` (R-2).
- **Ninguna spec existente modificada.** No hay fusión: el delta se copió entero, y `rules.archive`
  (a) —avisar ante deltas destructivos, `openspec/config.yaml:1845`— no aplica.
- **Lectura de comprobación**, hecha por el orquestador sobre el índice: los seis artefactos movidos
  tienen el mismo blob que en `00005fa` (git los marca `R100`), la spec viva es el mismo blob que el
  delta (`780e363`), y `diff -r --strip-trailing-cr` entre una instantánea de `00005fa` y la carpeta
  archivada da salida 0. Sin `--strip-trailing-cr` difiere cada línea: la copia de trabajo está en
  CRLF (`core.autocrlf`), el contenido versionado no.

## 2 · Contra la fila del plan

La fila `:157` pide: alta por Comercial al conocer el serial; fecha de adquisición, fecha de factura,
fin de garantía y código interno del cliente como identificador secundario; botón de enlace a Drive
(fase 0, P8).

| Pieza de la fila | Entregado | Dónde |
|---|---|---|
| Fecha de adquisición, de factura de compra, fin de garantía | sí, validadas en servidor antes de escribir | RQ-HV-03; `apps/desk/server/routes/equipos.ts:128-131` (`esFechaIso`) |
| Código interno como identificador secundario | sí | RQ-HV-06; `apps/desk/server/db/equipos.ts:69`, `:180` |
| Enlace a Drive (P8, fase 0) | sí, **sólo `https://`**, vía `urlSegura` | RQ-HV-04; `routes/equipos.ts:181-186`; `decision/p8-p54-drive` (`openspec/config.yaml:1607`) |
| Mantenedor (sexto campo, no está en la fila) | sí, validado contra Books | RQ-HV-05; `routes/equipos.ts:147-155`; `decision/titularidad-mantenedor` (`openspec/config.yaml:1667`) |
| Alta por Comercial al conocer el serial | leída como **flujo**, no como permiso | El alta ya existía; F1B-02 la amplía (RQ-HV-02, RQ-HV-08). Restringir por área quién escribe está fuera (`proposal.md:64`). La propuesta registra el riesgo: leída como permiso, `cierra` pasaría a `no` (`proposal.md:102`) |

## 3 · Hechos de estado final que las instantáneas no recogen

1. **Pruebas.** Según `verify-report.md`, sobre `749eeff`: 132 ficheros (+1 saltado), 1257 pruebas
   (+2 saltadas). **Al cierre**, sobre `afa0add`: `npm test` sale con 0, con 133 ficheros (+1 saltado) y
   **1269** pruebas (+2 saltadas). Las +12 las trae `main`: `git diff 749eeff afa0add -- '*.test.ts'`
   añade 13 `it(` y quita 1. Salen de `packages/zoho-sync/src/sync.historyPending.test.ts` y
   `apps/hub-sync/src/hubSync.test.ts` (fusión #3, `3385281`), y el quitado es el `it` del guardián
   de ALTER, que pasó de «son 35» a «son 36». El verify-report no se reescribe: es un artefacto fechado.
2. **Fusión de `main` (`afa0add`, sin objetivo).** Tres conflictos, los tres resueltos conservando
   ambos lados. `packages/zoho-sync/src/db/schema.sql` junta `history_synced_at` y las seis columnas
   de `equipos`, con 36 `ALTER TABLE`. El guardián `packages/zoho-sync/src/db/migrate.test.ts` pasa a
   36 ALTER, 18 calificadas y 18 sin calificar, con el mismo conjunto de tablas. El tercero es
   `docs/sdd/ENTRADA.md`. Sobre `afa0add`: `npm run lint -- --max-warnings 165` sale con 0 (165
   avisos) y `npm run typecheck` también.
3. **Correcciones sin objetivo posteriores al verify**, en orden:
   - `b0c6b41`: `git mv` de la spec a la ruta del delta;
   - `4a9ebb9`: sobre `verify-result/v1`;
   - `0c23a34`: prefijo `### Requirement:` en los 8 encabezados, porque `sdd-status` contaba 0;
   - `afa0add`: la fusión;
   - `cb30fa1`: 5 citas bloqueantes del detector;
   - `0bf44c1`: E-032;
   - `00005fa`: barrido de la regla de mutación 4.
4. **Contradicción registrada.** `tasks.md:92-95` (tarea 7.1) afirma que los documentos fechados y los
   propios `proposal.md`, `spec.md` y `design.md` de la tanda «son caso B, anclados a su commit de
   origen; no se renumeran». **No llevaban ancla.** El detector bloqueó 5 (`cb30fa1`), y el barrido de
   `00005fa` contó 110 citas a `db/equipos.ts` y `routes/equipos.ts`, de las que 30 estaban rotas en
   silencio, 18 de ellas en los artefactos de este cambio. Leída frase a frase, la mayoría era caso A,
   no B. El detalle, cita por cita, está en el mensaje de `00005fa`.
5. **IV-8 sigue VIVO** (`openspec/config.yaml:804-808`), con destino F1B-11 escrito (`:835`). F1B-02
   **pone el campo** `mantenedor_id` en la hoja de vida; **no cierra IV-8**. La guarda del mantenedor
   sobre la orden de venta es F1B-11 (`proposal.md:45`).
6. **Anexo H del maestro** (`rules.archive`, `openspec/config.yaml:1846`). El maestro no se edita desde
   el repositorio. `docs/sdd/F0-01_Correcciones_para_el_maestro.md` tiene la entrada 18 para F1B-02
   (`:970`), pero trata la etiqueta de «Código interno» en M3.1, no el Anexo H. **No existe ninguna
   entrada que lleve los seis campos al Anexo H: queda PENDIENTE, dueño Gerencia.** Este archive no
   la escribe.

## 4 · Comprobaciones de persona — ARCHIVAR ESTE CAMBIO NO LAS DA POR HECHAS

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| **Persona-1 · RQ-HV-07**: hoja de vida con los seis campos vacíos; marcador de vacío en cada uno, sin error | Comercial/Gerencia, en staging | `openspec/specs/hojas-vida/spec.md`, «Comprobaciones de persona de RQ-HV-07» |
| **Persona-2 · RQ-HV-07**: hoja de vida con los seis campos poblados; el enlace de Drive abre en pestaña nueva | Comercial/Gerencia, en staging | ídem |
| **RQ-HV-08**: el alta y la edición piden los seis campos | Comercial/Gerencia, en staging | `tasks.md`, tarea 6.3 |
| Carga retroactiva de los campos en el parque ya sembrado (hipótesis: tamaño no remedido) | Comercial / Gerencia | `proposal.md:128` |
| Apuntar el mantenedor del caso conocido | Comercial | `proposal.md:129`; `openspec/config.yaml:1687-1688` |

Las tres primeras son sobre el DOM de `.tsx`, fuera de la red de pruebas por decisión de Gerencia
F0-00 (`vitest.config.ts:16`, `:17`). Lo automatizable de RQ-HV-07 —que `/historial` entregue los
seis campos— lo cubre `apps/desk/server/equipos.test.ts:343`.

## 5 · Detector de citas y E-032

Sobre `00005fa`, antes de este archive: el detector sale con 0 y comprueba 2034 citas. **Tras el
archive dará verde sobre esta carpeta, y ese verde no prueba nada**: `apps/desk/server/citas/cli.ts:49`
excluye `openspec/changes/archive/` (RQ-CV-07, `:46`). Es **E-032** (`docs/sdd/ENTRADA.md`, «## E-032»),
sin destino y con dueño Gerencia. Las citas de esta carpeta se comprobaron **antes** del `git mv`: en
`cb30fa1` y en `00005fa`. Esa comprobación la hizo una lectura, no el detector.

**Cierre (R-1):** F1B-02 cubre la fila `:157` —las tres fechas, el código interno como identificador secundario y el enlace a Drive (sólo `https://`), más el mantenedor como sexto campo por `decision/titularidad-mantenedor`— y sostiene `cierra: si` leyendo «alta por Comercial» como flujo y no como permiso (`proposal.md:102`); deja fuera, sin darlas por hechas, las comprobaciones de persona (Persona-1 y Persona-2 de RQ-HV-07, RQ-HV-08 en staging, carga retroactiva del parque y el mantenedor del caso conocido), la guarda del mantenedor (IV-8 → F1B-11) y la entrada del Anexo H en F0-01, pendiente de Gerencia.
