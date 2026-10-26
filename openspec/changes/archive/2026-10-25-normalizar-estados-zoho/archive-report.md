# Informe de archivo — `normalizar-estados-zoho` (F1F-01, `cierra: no`)

Archivado el 2026-10-25 en la rama `normalizar-estados-zoho` (worktree hermano, base `46c5199b`) y **sin fusionar a `main`**: la tanda
para antes de fusionar. Lo escribe el orquestador con cifras medidas. `apply-progress.md` y `verify-report.md` son instantáneas de su
momento; donde difieran, manda este informe.

**Fila F1F-01** («Migración de tickets abiertos y fecha de corte», `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:125`).
**Cubrió la normalización de los nombres de estado de Zoho que `decision/e249-normalizar-al-leer` asigna a F1F-01 (una regla en
`packages/shared`, aplicada al sincronizar y en toda lectura, sin escribir datos); dejó fuera el resto de la fila —la migración de
abiertos y la fecha de corte— y E-090 (soporte remoto, F1B-09).** Por eso sigue `cierra: no`. La decisión está en `openspec/config.yaml`
→ `decisiones_de_gerencia_adenda`, citada por clave.

## 1. Qué queda construido

`git diff --shortstat 46c5199b HEAD -- apps packages`: 33 ficheros, 841 inserciones y 51 borrados. De ellos, 4 ficheros (14 y 8) son los
dos cherry-picks fuera-del-plan de `apps/desk/server/citas/` (sección 7); lo propio de F1F-01 son **29 ficheros, 827 inserciones y 43
borrados**. Ninguna línea de `apps/desk/src` ni de `apps/desk/server/services/ticketService.ts` cambia (`git diff --stat f5465799 HEAD`
sobre las dos rutas, vacío).

**La regla:** `packages/shared/src/normalizarEstado.ts` (nuevo, 18 líneas) recorta los extremos y colapsa los espacios U+0020 repetidos, con
forma TS (`normalizarEstado`, `normalizarSiTexto`, `conEstadoNormalizado`) y forma SQL (`sqlEstadoNormalizado`, que sólo acepta
identificadores). Se exporta en `packages/shared/src/index.ts:54`, línea añadida al final.

**Dónde se aplica**, un punto por camino de lectura y siempre en sitio (misma línea física):

| Lote | Camino | Línea |
|---|---|---|
| L1 | Sincronización (lo que se guarda desde hoy) | `packages/zoho-sync/src/db/mappers.ts:47` |
| L1 | Listas, detalle y guarda de la transición | `packages/zoho-sync/src/db/repo.ts:139`, `:209` |
| L2 | Ficha de cliente | `apps/desk/server/db/directory.ts:26` |
| L2 | Análisis (y el reloj que consume sus filas) | `apps/desk/server/analisis.ts:20` |
| L2 | Indicadores | `apps/desk/server/indicadores.ts:66` |
| L2 | Reasignar | `apps/desk/server/db/reasignaciones.ts:18` |
| L2 | Informe de contrato | `apps/desk/server/db/informeContrato.ts:45` |
| L2 | Migración de abiertos | `apps/desk/server/db/migracionTicketsAbiertos.ts:36` |
| L2 | Estado por remisión | `apps/desk/server/db/estadoPorRemision.ts:40` |
| L2 | Reloj del SLA, los dos lados | `apps/desk/server/db/relojSla.ts:45`, `:58` |
| L3 | Alarmas SLA y su subconsulta de entradas (forma SQL en `SELECT` y `WHERE`) | `apps/desk/server/db/sla.ts:45`, `:89` |
| L3 | Marca «esperando aprobación del cliente» | `apps/desk/server/db/alarmasAvisadas.ts:21` |
| L3 | Esperas en curso | `apps/desk/server/db/esperasVencidas.ts:30`, `:37`, `:42` |

La columna `tickets.status` no se reescribe nunca: ninguna sentencia nueva la actualiza, y las dos escrituras que existían
(`apps/desk/server/db/migracionTicketsAbiertos.ts:85`, la migración planificada, y la marca `history_synced_status` de
`packages/zoho-sync/src/sync.ts:319`) no cambian.

**pg-mem:** `apps/desk/server/testing/pgMemEstado.ts` (nuevo, 38 líneas) imita `btrim(text)` y `regexp_replace` sólo para lo que emite el
módulo, y lanza «imitación fuera de alcance» con cualquier otra cosa. Se registra en sitio en el arnés y en cinco ficheros de prueba.
**PostgreSQL real:** `apps/desk/server/db/normalizarEstado.integration.test.ts` (nuevo) se salta sin `TEST_DATABASE_URL`; en CI corre
contra PostgreSQL 17. **Que PostgreSQL acepte la forma de las consultas sigue siendo hipótesis hasta esa pasada** (aviso 1 del verify).

**Colocación.** Ninguna línea se movió en ningún fichero existente: en los editados en sitio, inserciones igual a borrados; lo único que
crece son bloques añadidos al final de ficheros de prueba y la línea de `index.ts`.

## 2. Rojo, verde y mutaciones

- Cada lote vio sus rojos antes del verde, por la causa esperada (el lector devolvía el crudo), y los anotó con la aserción observada en
  `apply-progress.md`. La integración no pudo ponerse roja en local: se salta.
- **Mutaciones M1-M7 y M4b: todas rojas** por la prueba que el diseño esperaba y restauradas byte a byte (L4.1). Las repitieron, cada una
  por su cuenta: el orquestador M3 («expected 409 to be 200») y M4 (fila 21 y espía de escrituras); el verificador M1, M2 y M5.
- M5 no la caza el catálogo, como anticipaba el desvío 5 del diseño; la cazan la unitaria, `pgMemEstado.test.ts`, la sincronización y la
  aceptación (` Anulado` y reloj).

## 3. Spec viva

Fusión por script (`fusiona-nez.mjs`, en el directorio temporal de la sesión, no versionado), primero en seco y medida antes de aplicar:

- **RQ-TC-40 (MODIFIED)**, casado por identificador y sustituido en sitio en `openspec/specs/tickets-core/spec.md:2096-2202`: 107 líneas
  antes y después, 12 escenarios; sólo cambian las tres líneas del párrafo de igualdad exacta, `openspec/specs/tickets-core/spec.md:2128-2130`.
  Se conserva la cabecera viva («### RQ-TC-40 · …»; el delta la escribe con el prefijo «Requirement: »). La palabra «verbatim» ya no
  aparece en la spec. La spec sigue en 4.522 líneas.
- **RQ-ZS-24 (ADDED)** al final de `openspec/specs/zoho-sync/spec.md`, tras RQ-ZS-23: `openspec/specs/zoho-sync/spec.md:1521-1674`, 154
  líneas y 19 escenarios. La spec pasa de 1.519 a 1.674 líneas; ninguna línea viva se desplaza.
- Comprobado por script: cada bloque vivo es **idéntico** al del delta (sin el prefijo de la cabecera), con el mismo número de escenarios.
- `git diff --numstat` de la fusión: 3 y 3 en `tickets-core`, 155 y 0 en `zoho-sync` (**161**).

## 4. Antes de la mudanza

- `proposal.md:17` anclada en `f5465799` (la anclaba L4): describe la sincronización de antes del cambio.
- Cinco citas a `openspec/specs/tickets-core/spec.md:2129` que afirmaban «dice verbatim» —cierto hasta esta fusión, falso desde ella
  (caso B)— anclan su revisión: dos de `apply-progress.md` en `a003f614` y tres de `verify-report.md` en `06a6dff3`. Las de `design.md`
  quedan ancladas por su cabecera, que fija todo el documento en `f5465799`; la de `tasks.md` sólo manda revisarla.
- Las citas de `proposal.md` a las líneas cambiadas nombran dónde se aplica la regla y siguen siendo ciertas (caso A).
- Las rutas a la propia carpeta (`openspec/changes/` seguido del nombre del cambio) se reescriben a la de archivo en el mismo commit: 17 apariciones en 6 ficheros.
- Nada fuera de la carpeta nombra su ruta (búsqueda en `*.md`, `*.ts`, `*.yaml` y `*.json`).

## 5. Registro de intentos (`gentle-ai sdd-attempt`)

Medida de cada intento = `git diff --shortstat --no-renames` contra su commit de partida más `wc -l` de lo nuevo sin trackear (siempre 0
al asentar). Ningún binario.

| # | Trabajo | Medida | Resultado |
|---|---|---|---|
| 1 | Propuesta y delta de `zoho-sync` | 359 | passed |
| 2 | Diseño, tareas y delta de `tickets-core` | 550 | passed |
| 3 | Apply L1 (incluye las 8 del cherry-pick `793ca755`) | 497 | passed |
| 4 | Apply L2 (incluye las 14 del cherry-pick `db3fe0a6`) | 294 | passed |
| 5 | Apply L3 | 418 | passed |
| 6 | Apply L4 (mutaciones y barrido; 0 de código) | 104 | passed |
| 7 | Verify | 191 | passed |
| 8 · 9 | Archive (la mudanza cuenta doble) · corrección del lint tras el archivo (sección 6; 14 líneas de pruebas y 6 de este informe) | 3.201 · 20 | passed · passed |

El intento 8 se abrió con techo 4.200 (dos veces la carpeta más 800). Su parte revisable, medida antes de aplicar, es la fusión (161) más
este informe; el resto es la mudanza de la carpeta, que el registro cuenta dos veces por medir sin detección de renombrado.

## 6. Verify y ejecución

- **Verify: PASS con avisos**, por un verificador independiente sobre `06a6dff3`: 0 críticos, 2/2 requisitos y 31/31 escenarios (19 de
  RQ-ZS-24 y 12 de RQ-TC-40), la tabla 1-29 del diseño fila a fila; el sobre `gentle-ai.verify-result/v1` lo valida `sdd-verify-validate`.
  El orquestador comprobó sus hashes contra los logs y corrigió una cita del informe que acababa en línea vacía.
- **Avisos:** (1) la integración contra PostgreSQL real no se ha ejecutado (se salta en local); (2) A.2 debía casar RQ-TC-40 por
  identificador, y así se hizo; (3) tras desplegar, un ticket con el nombre crudo puede recibir su primer aviso de espera, como su gemelo.
- **Cadena del verify:** `npm test` 0 (322 ficheros y 5589 pruebas en verde; 4 ficheros y 26 pruebas saltados; log
  `npmtest-nez-verify-204147.log`), typecheck 0, lint 0 errores con 172 avisos, **pero la orden del CI, `npm run lint -- --max-warnings 165`, salía 1** (ver la línea siguiente), detector 0.
- **Corrección del lint, intento 9 (tras el archivo):** los 7 avisos de más eran `@typescript-eslint/no-explicit-any`, seis en `apps/desk/server/normalizarEstadosZoho.test.ts` y uno en `packages/zoho-sync/src/db/estadoNormalizado.test.ts`; se sustituyeron en sitio por tipos reales (dos `as any` sobraban y el resto pasó a `{ id: string; status: string }`), sin `eslint-disable` ni tocar la regla y sin desplazar líneas. `npm run lint -- --max-warnings 165` pasa de 1 (172 avisos) a 0 (**165 contra 165**, como main); con un `as any` repuesto vuelve a 1 (166). Cadena del intento 9: typecheck 0, detector 0 y `npm test` 0 en la segunda pasada (`npmtest-nez-i9b-220205.log`; la primera, `npmtest-nez-i9-215202.log`, salió 1 por un plazo de 5 s en `apps/desk/server/relojSla.test.ts`, fichero sin cambios, que en solitario pasa en 2 s).

## 7. Pendiente fuera de la rama (la rama no toca `openspec/config.yaml` ni `docs/sdd/`)

- **Dos cherry-picks fuera-del-plan de `main`**, que no son contenido de F1F-01 y se traen para que `npm test` no caiga en esta máquina:
  `793ca755` (de `029e46b5`, plazos de 60 s del hook de citas; `decision/excepcion-plazos-hook-citas`) y `db3fe0a6` (de `51e92f29`,
  `afterEach(cederAlBucle)` en `instalador.test.ts` y `cli.test.ts`; `decision/excepcion-ceder-bucle-instalador-cli`). Sus registros ya
  están en `main` (`88f653c9` y `4b86482a`) y no se traen. Al fusionar, el mismo contenido llega por las dos ramas (hipótesis: sin conflicto).
- **Hallazgo P-4** para la bandeja: el botón «Crear remisión» decide por estado sólo en el cliente (`apps/desk/src/lib/botonRemision.ts:31`;
  regla 13). Previo; este cambio no lo introduce.

## 8. Supuestos reversibles — a la lista semanal, bajo F1F-01

Los nueve de la propuesta (S-1 a S-9, sección «Supuestos reversibles» de `proposal.md`). Los que la construcción dejó medidos: **S-1**
(ningún valor de `Tickets.csv` trae tabulador ni NBSP: lo comprueba `apps/desk/server/estadosZohoCatalogo.test.ts`), **S-3** (pg-mem no
trae `btrim`: el error medido sin la imitación es «function btrim(text) does not exist»), **S-4** y **S-5** (el `from_status` nuevo y la
migración leen normalizado: aceptación L1 y L2). **S-7** (sin índice de expresión) sigue siendo hipótesis de volumen.

## 9. Tareas de persona — fuera del recuento (archivar no las da por hechas)

| # | Qué | Dueño |
|---|---|---|
| P-1 | Desplegar (sin migración ni DDL) | Usuario |
| P-2 | Comprobar el #1004 en la app, en su columna «Notificación Comercial» y con botones | Usuario |
| P-3 | Comparar la lista COMPLETA de estados de Zoho Desk con el registro (S-6) | Gerencia |
| P-4 | Registrar el hallazgo del botón «Crear remisión» en `docs/sdd/ENTRADA.md` | Supervisión |

Y una de CI, no de persona pero fuera de esta máquina: ver en verde `normalizarEstado.integration.test.ts` contra PostgreSQL 17.

## 10. Qué se verá en la aplicación

Al desplegar, #1004 aparece en su columna «Notificación Comercial», con sus botones de transición, sin tocar la base de datos. Los tickets
con espacios de más en el estado cuentan donde cuenta su gemelo: esperas, alarmas, indicadores, ficha de cliente y reasignación.
