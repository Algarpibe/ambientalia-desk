# Informe de archivo: parche-iv11-orden-venta (F1B-11)

**Fecha de cierre**: 2026-09-28
**Cambio**: `parche-iv11-orden-venta`
**Fila**: F1B-11, clasificada como **cierra: no** (`proposal.md:13`: cambio 1 de 3, secuenciales y uno por árbol)

## Alcance cubierto (R-1 reconciliación)

**Cubre el cambio 1 de 3 de F1B-11 —el parche de IV-11: marca de fila `ov_elegida_en_app_at` que protege `orden_venta`/`fecha_orden_venta` del sincronizador y aviso a Comercial por discrepancia (RQ-AV-13), `cierra: no`— y deja al cambio 2 la asociación OV↔ticket 1:N propia y la subOV de lote, y al cambio 3 el registro de contrato y prioridad, que es el que cierra la fila (`proposal.md:38-40`).**

Lo que construye, por requisito:

- **RQ-ZS-01 (modificado)** — `managed_by_app` sigue siendo la frontera de fila entera (`packages/zoho-sync/src/db/repo.ts:71`); la marca
  añade una frontera por columna para las dos columnas de la orden (`repo.ts:76-78`). La ponen los tres escritores de la app: el alta
  (`repo.ts:418`, `:422`), `writeTransition` en `habilitar_servicio` (`repo.ts:305`) y el `UPDATE` de la remisión de entrada
  (`apps/desk/server/routes/remision.ts:240`). El sincronizador la lee y nunca la escribe.
- **RQ-RE-16 (modificado)** — la remisión de entrada pone la marca en la misma sentencia que escribe la orden (`remision.ts:240`); la
  condición del `WHERE` (`remision.ts:241`) sigue sin cambios.
- **RQ-AV-13 (nuevo)** — aviso a Comercial cuando una fila marcada recibe de Zoho una orden distinta, con regla anti-ruido: un solo
  aviso por ticket mientras la discrepancia no cambie (`apps/desk/server/services/avisoDiscrepanciaOV.ts:30`, `repo.ts:79`).

**Dejó fuera** (`proposal.md:42`): el relleno de filas existentes (datos de producción, supuesto S-1), el espejo de Zoho y el
correo del aviso.

**IV-11 queda REDUCIDO, no cerrado**: protege las filas que un escritor marque desde ahora; las filas cuya orden se eligió en la
app antes de este cambio siguen expuestas hasta que un escritor vuelva a fijarla. Registro: fila de IV-11 en `CLAUDE.md` y
`openspec/config.yaml` → `adendas_incumplimientos_vivos` → IV-11 → `reduccion_2026_09_27`.

## Especificaciones sincronizadas

Fusión casando por ID de requisito; las dos MODIFIED conservan el título exacto del requisito vivo.

| Spec | Operación | Medida (`git diff --cached --numstat`) |
|---|---|---|
| `openspec/specs/zoho-sync/spec.md` | RQ-ZS-01 MODIFIED | +60 / −0 |
| `openspec/specs/remisiones/spec.md` | RQ-RE-16 MODIFIED | +20 / −10 |
| `openspec/specs/derivacion-avisos/spec.md` | RQ-AV-13 ADDED, al final del §3 | +55 / −0 |

La fusión coincide con la medida previa que hizo el orquestador sobre copias de las specs (55 + 30 + 60 = 145). Las secciones
«Fuera de alcance de este delta» no se fusionan.

**Barrido de la regla de mutación 4 tras la fusión**: la fusión inserta líneas en mitad de las tres specs, así que se barrieron
sus citas `…/spec.md:NNN` en todo el repositorio (salvo `openspec/changes/archive/`, excluido por RQ-CV-07). Se desplazaban
ocho: seis quedan ancladas «en `ca56c62`» (caso B: `Paquete_de_Despliegue_2026-09-27.md` ×4, `docs/sdd/ENTRADA.md:444` y
`openspec/config.yaml:2153`), y dos se dejan sin tocar porque están dentro de una cita textual de Gerencia
(`docs/sdd/ENTRADA.md:956` y `openspec/config.yaml:2149`, las dos «zoho-sync/spec.md:221»): anclarlas alteraría la cita.

## Verificación

Según `verify-report.md` de esta carpeta: **PASS**, 3/3 requisitos y 16/16 escenarios con prueba directa. Re-ejecutado en la
segunda pasada: 1474 tests pasan (2 omitidos, 146 ficheros), `typecheck` limpio, `lint` 165 warnings (0 nuevos), `build` correcto.

**Aviso no bloqueante del verify**: `apps/desk/server/ovDiscrepanciaSync.test.ts` no distingue la mutación que quita el filtro
anti-ruido de `avisoDiscrepanciaOV.ts:30`, porque `repo.ts:79` ya corta la segunda llamada al servicio con el mismo valor. La
prueba unitaria `avisoDiscrepanciaOV.test.ts:61-69` sí la distingue. Es defensa en profundidad, no un hueco funcional; se anota
porque `tasks.md` presenta la prueba de extremo a extremo como la del anti-ruido.

## Historia de fases y ledger

| Fase | Ledger | Git | Resultado | Commit |
|---|---|---|---|---|
| apply (lote 1) | 1178 | 1178 | passed; techo de 1250 aprobado por Gerencia el 2026-09-28 (`openspec/config.yaml` → `aprobaciones_de_techo_del_ledger`), tras un reset de mantenedor | `c289b30` |
| verify, intento 1 | 221 | 221 | failed: cobertura 13/16, tres escenarios ciertos por construcción sin prueba dedicada | `a13cb86` |
| verify, intento 2 (remediación) | 120 | 120 | passed: tres pruebas nuevas al final de sus ficheros, cada una probada por mutación; 16/16 | `6e471a8` |
| archive | — | — | este informe | — |

El intento 1 del verify también levantó como crítico que la aprobación del techo sólo existía en la conversación; quedó
resuelto al registrarla en `aprobaciones_de_techo_del_ledger`, al final de `openspec/config.yaml`, sin desplazar líneas citadas.

## Tareas de persona (regla del ciclo 1, fuera del recuento)

Tienen dueño fuera del repositorio, así que no cuentan como tareas del cambio. **Archivar este cambio NO las da por hechas.**
Quedan escritas en `tasks.md` de esta carpeta (sección de tareas de persona) y en `proposal.md:107-108`.

| Tarea | Dueño | Destino |
|---|---|---|
| P.1 · Ejecutar la consulta de subOV `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (sólo lectura) sobre producción y devolver la salida | **Alfonso** | alimenta el cambio 2 de F1B-11 |
| P.2 · Decidir si se rellena la marca en filas cuya orden ya se eligió en la app antes de este cambio (hoy: sin relleno, S-1) | Gerencia | cambio 2 de F1B-11 o una decisión propia |
| P.3 · Comprobar en la app, tras el despliegue, que aparece el aviso en la bandeja cuando Zoho trae otra orden | Comercial | verificación posterior al despliegue |

## Trazabilidad

- Artefactos de esta carpeta: `proposal.md`, `design.md`, `tasks.md` (36 tareas marcadas, 0 abiertas), `apply-progress.md`,
  `verify-report.md` y los tres deltas en `specs/`.
- Engram (modo hybrid): `sdd/parche-iv11-orden-venta/*`.
- Pruebas añadidas en la remediación: `packages/zoho-sync/src/db/repo.test.ts:429-438`,
  `packages/zoho-sync/src/db/migrate.test.ts:432-444`, `apps/hub-sync/src/hub-sync.guardian.test.ts:17-20`.
