# Informe de archivo: `permisos-por-cargo`

**Fecha de cierre:** 2026-09-30 · **Carpeta:** `openspec/changes/archive/2026-09-30-permisos-por-cargo/` ·
**Redactado por el orquestador** con cifras re-ejecutadas en esta sesión; lo que no se re-ejecutó se marca.

```yaml
tanda: F1C-05
cierra: no
capacidad: [permissions]
maestro: ["M1.9.1", "Anexo D nº 39"]
toca_maestro: si
origen_cabecera: declarada
```

## Cobertura de la fila (R-1)

**F1C-05, `cierra: no`: cubre el nivel CARGO de C10 —siete cargos en lista cerrada, columna de cargo de permiso
separada de la firma, Liberación sin factura exigida al Director Comercial en el servidor y dos primitivas probadas
sin llamador (OVI de garantía, Top 5)— y deja fuera la regla de las transiciones Decisionales, que depende de
F1C-04, y el nivel de propietario del registro, que `decision/c10-permisos-cargo` aplaza sin destino
(`openspec/config.yaml:1936`, `:1942`).** El plan promete tres niveles en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:178`; esta
tanda construye dos. El numerador del avance no se mueve.

## Commits de la tanda

| Paso | Commit | CI | Líneas (`git diff --shortstat --no-renames`) | Ledger |
|---|---|---|---|---|
| Planificación | `38eed82` | 36717853100 verde | fuera del ledger | — |
| Lote 1 · `shared` | `db5630f` | 36721344431 verde | 432+ / 21− = 453 | 453 |
| Lote 2 · servidor | `d201fe4` | 36727144885 verde | 417+ / 52− = 469 | 469 |
| Lote 3 · cliente y cierre | `e71fd3f` | 36735364886 verde | 138+ / 29− = 167 | 167 |
| Verify | `53dd0ed` | 36736997030 verde | 162+ / 0− = 162 | 162 |
| Archive | este commit | ver parte | 1.666+ / 1.370− = 3.036 (commit, con el barrido de citas) | a medir en el settle |

Techo del archive aprobado por el usuario: **3.500**. Cuenta previa: `git mv` 2 × 1.356 = 2.712, fusión **medida en un
worktree antes del acquire** 186+ / 8− = 194, informe y casillas ~130 → ~3.036. Real en el commit: 3.036 (1.666+ / 1.370−), barrido de citas incluido.

## Cifras re-ejecutadas por el orquestador

- `npm test` sobre el árbol del lote 3: 161 ficheros pasan (1 omitido), 2.044 pruebas pasan (2 omitidas).
- `npm run typecheck` limpio; `npm run lint` 165 avisos, 0 errores (techo 165, cero nuevos en los tres lotes);
  `npm run build` verde.
- Hoy, antes del archive: `npx vitest run` de `packages/shared/src/cargos.test.ts`,
  `apps/desk/server/cargoPermiso.test.ts` y `apps/desk/server/permisos.test.ts`: 3 ficheros, 75 pruebas en verde.
- Detector de citas (`npx tsx apps/desk/server/citas/cli.ts --sha HEAD`) sobre `db5630f`, `d201fe4`, `e71fd3f` y
  `53dd0ed`: exit 0, 11 abreviadas rotas preexistentes. En `e71fd3f` bloqueó primero una cita sin extensión de
  `apply-progress.md`, reparada antes del push.
- Mutaciones reproducidas por el orquestador (todas revertidas y comprobadas con `cmp`):

| Lote | Mutación | Rojo observado |
|---|---|---|
| 1 | octavo cargo `'Gerente comercial'` en `CARGOS` | guardián contra `config.yaml:2589`, lista de siete, `esCargo`, `cargoPermisoDelCuerpo`, barrido |
| 1 | `'Tecnico de campo'` mal escrito | guardián y lista de siete |
| 1 | ensuciar `openspec/config.yaml:2589` | sólo el guardián |
| 1 | `&&` → `\|\|` en `puedeEjecutarTransicion` | compuesta, `puedeLiberarSinFactura`, «vacío = sin cargo» |
| 1 | sin área en `puedeCrearOVIGarantia` | barrido «sólo restringe» (1.850 casos) y la primitiva |
| 1 | `'Director técnico'` en `transitions.ts:276` | `npm run typecheck`, `TS2820` |
| 2 | 403 de cargo antes del 403 de área | P1 |
| 2 | 403 de cargo antes de los 409 | P1, P2, P3 |
| 2 | 403 de cargo detrás del 422 | P4 |
| 2 | `cargo_permiso` fuera del SELECT de sesión | S8, S10 y «surte efecto en la siguiente petición» |

## Veredicto del verify

`verify-report.md`: **pass_with_warnings** sobre `e71fd3f`; 12/12 requisitos (RQ-PM-03 modificado, RQ-PM-12..22
añadidos) y 21/21 escenarios PASS; 0 críticos. Su mutación de comprobación (vaciar
`EXCEPCIONES_POR_CARGO.transiciones`) puso 23 pruebas en rojo. Los seis criterios de éxito de `proposal.md`
quedan marcados.

- **W1 · declarado y vigente.** La matriz HTTP de `apps/desk/server/permisos.test.ts:43-66` calcula su `esperado`
  con la misma compuesta que prueba (`:64`), así que frente al cargo es tautológica. Lo detectan S21
  (`apps/desk/server/cargoPermiso.test.ts:250`, que compara contra el área sola) y el 61/41 de `permisos.test.ts:349`.
  RQ-PM-03 sigue teniendo detector; no es esa matriz.
- **W2 y W3 · no aplican a la tanda.** El verificador no vio que el detector corrió sobre cada commit ni que el
  orquestador reprodujo diez mutaciones; está escrito en la nota final de `verify-report.md` y en la tabla de arriba.

## Supuestos cerrados en la tanda

- **S-1 (aceptado por el usuario):** mientras nadie tenga cargo, sólo el administrador ejecuta la Liberación sin
  factura. No hay respaldo al área, a diferencia de las alarmas de SLA.
- **S-9 (aceptado):** área de los dos actos sin llamador: Servicio Técnico (OVI de garantía) y Comercial (Top 5).
- **S-10 (aceptado):** los dos 409 de `apps/desk/server/services/ticketService.ts:125-128` ganan al 403 de cargo
  (`:131`), que gana al 422; orden de F1B-10.

## Fusión en la spec viva

`openspec/specs/permissions/spec.md`, casada por ID: RQ-PM-03 sustituido conservando su título vivo, con la cita del
403 reapuntada a `ticketService.ts:129-130` (caso A: el delta arrastraba la de `ad1875b`); RQ-PM-12..22 en una
sección nueva «3 bis · Cargo de permiso»; la fila «Cargo» de §4 pasa a «distinguido desde este cambio» sin borrar lo
que decía; los fuera de alcance del delta se suman a §6. Comprobado: RQ-PM-01..22 aparecen una vez cada uno.

## Nota para el paquete de despliegue

1. Columna nueva `public.users.cargo_permiso`, aditiva, sin relleno y sin `CHECK`; la crea `migrate` al arrancar.
2. **CAMBIO VISIBLE (S-1):** desde el despliegue, un Comercial que no sea administrador **no puede hacer la
   Liberación sin factura** hasta que se le asigne el cargo. Deja de ver el botón y la API responde 403 nombrando
   «Director Comercial».
3. **P.1 el MISMO DÍA del despliegue**, por un administrador de la aplicación desde la consola de usuarios. La
   asignación surte efecto **en la siguiente petición, sin volver a entrar** (`apps/desk/server/auth/middleware.ts:18`
   relee el usuario en cada petición; lo fija la prueba «surte efecto…» de `cargoPermiso.test.ts`). Con la pantalla
   ya abierta puede hacer falta recargar para ver el botón (hipótesis, P.2).
4. OVI de garantía y Top 5 no tienen llamador hasta F1B-03 y F1B-07: nada observable cambia.
5. Rollback: revertir los commits; la columna es aditiva y sólo la lee este código.

## Tareas de persona — fuera del recuento (regla del ciclo 1; archivar NO las da por hechas)

| Tarea | Dueño | Destino | Dónde queda escrita |
|---|---|---|---|
| P.1 · asignar `cargo_permiso` a cada usuario real, empezando por el Director Comercial, el mismo día del despliegue, y aceptar por escrito el intervalo sólo-admin | Gerencia o administración | paquete de despliegue de la tanda | `tasks.md` (nota de despliegue y P.1), este informe |
| P.2 · verificar en la app tras desplegar (botón oculto sin cargo, visible con él sin volver a entrar, admin siempre) | Comercial, con quien decida Gerencia | verificación en la app | `tasks.md` |
| P.3 · decidir qué pasa con los dos «cargo» (firma frente a permiso), molde H5 | Gerencia (propuesto) | **sin destino asignado**, a propósito | `docs/sdd/ENTRADA.md` → E-092 |

## Registro

- Expediente R08.3: texto en §15 de `docs/sdd/R08.3_Expediente_de_cambios.md` (`toca_maestro: si`).
- Barrido de citas de la regla de mutación 4: tabla por fichero y caso en `apply-progress.md` (lote 3); cinco citas
  preexistentes a `ticketService.ts:115-122` y `:104-122`, ya desfasadas en `e591454`, quedan declaradas y sin reparar.
- `openspec/config.yaml` y `CLAUDE.md` no se tocan; `npm run reconcile` no lo ejecuta el archive.
