# Tareas — `areas-soporte-remoto` (F1B-09, `cierra: no`)

`strict_tdd` sin código nuevo: el comportamiento ya existe (`packages/shared/src/transitions.ts:389-395`), así que no hay rojo previo
posible; la evidencia es **mutación con control** (`design.md` D5). Cada lista de rojas se anota en `apply-progress.md` como
`fichero › prueba`, con la aserción que cae.
**Colocación (regla de mutación 4, `design.md` D1):** toda edición es una sustitución de subcadena en su MISMA línea física; ninguna línea
se inserta, se borra ni se mueve. Se comprueba con `git diff --numstat <partida>` (inserciones = borrados) y `wc -l` igual.
**Cierre `Lx.c` (lo hace el orquestador), en serie y en primer plano:** commit; `npm run typecheck` = 0;
`npm run lint -- --max-warnings 165` = 0, con la cifra de avisos contra 165; `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`
= 0; `npm test` solo, con el log entero en el scratchpad y el cargador conectado, = 0; `npm run build` = 0 con el nombre del bundle; medida
`git diff --shortstat --no-renames <partida>` + `wc -l` de lo nuevo sin trackear, ≤ 720; `settle`.

## Lote L1 · apply (intento 2)

Conjunto de ejecución (`design.md` D5): `npx vitest run packages/shared/src/transitionsSoporteRemoto.test.ts packages/shared/src/invariantesGrafo.test.ts apps/desk/server/permisos.test.ts apps/desk/server/flujoSoporteRemoto.test.ts apps/desk/server/services/avisoArea.test.ts`.

- [ ] L1.1 **M0:** el conjunto, en verde sin mutar nada; anotar ficheros y pruebas que pasan.
- [ ] L1.2 **M1** (antes de editar): `area` de `asignacion_soporte` (`packages/shared/src/transitions.ts:389`) → `'Comercial'`; correr el
  conjunto y anotar las rojas; restaurar; sha256 de `git diff -- packages/shared/src/transitions.ts` igual que antes de mutar (vacío).
- [ ] L1.3 **M2:** lo mismo con `ejecutar_soporte` (`packages/shared/src/transitions.ts:391`); anotar, restaurar y comprobar el sha256.
- [ ] L1.4 Ediciones (a)–(e) de `design.md` D3, cada una como sustitución de subcadena en su línea: `packages/shared/src/transitions.ts`,
  `packages/shared/src/transitionsSoporteRemoto.test.ts`, `packages/shared/src/invariantesGrafo.test.ts` (1/1 cada uno) y
  `apps/desk/server/permisos.test.ts` (2/2). Ningún `area` cambia.
- [ ] L1.5 **M1 otra vez**, tras las ediciones: las rojas enseñan el título nuevo de (b) y el mensaje nuevo de (c); restaurar (el sha256 del
  diff de `transitions.ts` vuelve a ser el del hunk de (a)); el conjunto, en verde.
- [ ] L1.6 (orquestador) Ediciones (f) y (g) de `design.md` D3 en `openspec/config.yaml` de la rama: 2/2, mismo `wc -l`.
- [ ] L1.7 (orquestador) La misma edición en el fichero de trabajo de `main` (`design.md` D4): `git status --porcelain` y `git diff --cached`
  iguales antes y después; `git diff --no-index --numstat <copia previa> openspec/config.yaml` = `2 2`; sha256 del `git diff` de antes, del de
  después y de los dos hunks, en `apply-progress.md`. El índice de `main` no se toca.
- [ ] L1.8 **Barrido de citas** (`design.md` D8), archivo incluido, clasificando A/B/C cada cita que toque una línea reescrita; más el segundo
  pase de abreviadas. Resultado en `apply-progress.md`.
- [ ] L1.9 **Casilla de la regla 13** (`design.md` D7) en `apply-progress.md`: `git diff --stat <partida> -- apps/desk/src` vacío y la línea del
  servidor que impone el área, leída al cerrar.
- [ ] L1.c Cierre del lote: los cinco códigos en 0, bundle comparado con `index-BFrlA0VZ.js`, medida y `apply-progress.md` completo.

## Verify y archive (un intento cada uno)

- [ ] V.1 `sdd-verify`: contrastar el diff de la rama contra la delta (RQ-SR-02 y las dos ediciones fuera de bloques), el diseño y estas
  tareas; reproducir M1 y M2 con su control M0; repetir los cinco códigos y el barrido; `verify-report.md`.
- [ ] A.1 `sdd-archive` (techo 2 × carpeta + 800): medir ANTES la parte revisable (fusión + `archive-report.md`) ≤ 800; fusionar con el script
  de `design.md` D2 tras su ensayo; bloques vivos idénticos a la delta; `git show --numstat` del commit de archivo con sólo este cambio;
  barrido de citas y los cinco códigos en 0.

## Tareas de persona — fuera del recuento

Regla del ciclo 1: no son trabajo de este repositorio. **Archivar NO las da por hechas.** El detalle está en `proposal.md` §10.

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Poner al día M1.5 y el Anexo B.1 del maestro y cerrar el Anexo D nº 71 (las cuatro son de Servicio Técnico por decisión del 2026-10-25) | Gerencia | Próxima revisión del maestro, por el expediente R08.x | `proposal.md` §10 y `archive-report.md` |
| P-2 | El `maestro_pasaje: "ninguno"` de `decision/e090-areas-soporte-remoto` no casa con esos tres pasajes | Supervisión | La ficha de la decisión | `proposal.md` §10 y `archive-report.md` |

## Review Workload Forecast

| Intento | Ingenua | Con informes | Tareas |
|---|---|---|---|
| i1 · planificación | — | propuesta, delta, diseño y tareas (~390) | — |
| i2 · apply | 8 líneas reescritas (16 en el diff) | ~170 con `apply-progress.md` | 9 + cierre |
| i3 · verify | — | `verify-report.md` ~250 | 1 |
| i4 · archive | fusión 16 en el diff | mudanza 2 × carpeta + `archive-report.md` ~150 | 1 |

Decision needed before apply: No — un intento por fase, todos bajo 720
Chained PRs recommended: No (una rama; se fusiona a `main` al cerrar, por decisión del analista)
Chain strategy: n/a
400-line budget risk: Low
