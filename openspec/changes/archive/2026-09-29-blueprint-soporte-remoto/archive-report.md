# Informe de archivo: `blueprint-soporte-remoto`

**Fecha de cierre:** 2026-09-29 · **Carpeta:** `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/`
**Escrito por el orquestador** con cifras re-ejecutadas por él al archivar; el subagente de archivo sólo hizo la fusión y el `git mv`.

```yaml
tanda: F1B-06
cierra: si
capacidad: [transitions-soporte-remoto, transitions-equipo-nuevo, tickets-core]
toca_maestro: si
origen_cabecera: declarada
```

## Cobertura de la fila (R-1)

**F1B-06, cambio 2 de 2, `cierra: si`. Cubre el blueprint de soporte remoto (M1.5: cuatro transiciones sobre cuatro
estados, tercer flujo, nacimiento en `Solicitud Soporte`) y el campo «Modalidad» que `decision/anexo-43-en-sitio`
añadió a esta fila; el blueprint de equipo nuevo lo hizo el cambio 1 (`2026-09-25-blueprint-equipo-nuevo`), y «hereda
C12» no pide trabajo aquí. No deja fuera nada de la fila.**

Por qué `si`: la fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:161`) pide «Blueprints de **equipo
nuevo** y **soporte remoto** (M1.4, M1.5) implementados en `transitions.ts` con la misma convención; hereda C12». Con
este cambio están las dos ramas; su gate (flujos comercial y posible-cliente) lo resolvió Gerencia dejándolos en Zoho
CRM. Lo que queda pendiente son tres tareas de **persona** (abajo), no contenido de la fila: archivar no las da por
hechas. Quedan fuera a propósito, porque son de otras filas o de otro año: la rama de servicio en sitio (2027 T2), la
guarda de remisión (F1B-03) y la columna propia de `Solicitud Soporte` en el tablero (F1B-09).

## Veredicto del verify

**PASS WITH WARNINGS** (`verify-report.md`): 16 requisitos y 56 escenarios CUMPLE; 0 CRITICAL, 2 WARNING, 5 SUGGESTION.

### W1 · S-6 bloquea el DESPLIEGUE, no el archive

Los tickets `Soporte remoto` heredados que estén en `En Proceso`, `Pendiente` o `Finalizado` pasan a su flujo el día que
se despliegue (enrutado de `flujoDelTicket`, `packages/shared/src/flujos.ts:57`): un SR en `Pendiente` deja de ver las
salidas de servicio y sólo le queda «Continuación soporte». Es **cambio visible**, no sólo riesgo. El paquete de
despliegue del 2026-09-29 es un registro fechado (`ae5aaf4..3f9d23b`) y no se edita: **el SIGUIENTE paquete tiene que
llevar S-6**, con el recuento de P.1 o, si no lo hay, «sin medir», junto con la columna nueva `tickets.modalidad`
(`packages/zoho-sync/src/db/schema.sql:576`, `ALTER` aditiva y nullable, sin relleno). Escrito también en `tasks.md` 3.11.

### W2 · S-1: el área de las cuatro transiciones está pendiente de P.3

Las cuatro son de `Servicio Técnico` por supuesto, no por decisión (`packages/shared/src/transitions.ts:389`): la hoja
`docs/analisis-tickets/DF-soporte-remoto-030226.xlsx` trae el área vacía y M1.5 no la dice. La pregunta está en la
bandeja como **E-090** (`docs/sdd/ENTRADA.md`, commit `d3cb3cb`). Si la respuesta cambia alguna, es un dato por
transición y la matriz de `apps/desk/server/permisos.test.ts:306`.

## Lo que se construyó, por lote

| Lote | Commit | Qué | Ledger | CI |
|---|---|---|---|---|
| 1 · `shared` | `8fb8efd` | `Solicitud Soporte`, catálogo de cuatro, registro de tres flujos, `estadoInicialDelAlta`, `modalidadDelAlta` | 554 | 36612294562 |
| 2 · Servidor y BD | `93e8b15` | columna `modalidad`, nacimiento en `Solicitud Soporte`, guarda 422 de modalidad en el escalón C, sólo lectura | 692 | 36617156034 |
| 3 · Cliente y cierre | `30b2019` | selector y lectura de Modalidad, regla 13, barrido de la regla 4, texto para R08.3 (§13) | 139 | 36619491771 |
| verify | `b17ea86` | `verify-report.md` | 258 | 36621777362 |

El detalle de cada lote está en `apply-progress.md`; la tabla de la regla 13, decisión a decisión, en su adenda del lote 3.

## Cifras re-ejecutadas al archivar (árbol con la fusión, antes del commit)

| Comprobación | Resultado |
|---|---|
| `npm test` | **158 ficheros (157 + 1 omitido) · 1938 tests (+2 omitidos)**, verde. Una primera pasada dio 1 rojo en `apps/desk/server/auth/routes.test.ts` por *timeout* de 5000 ms bajo carga (5411 ms); aislado pasa 14/14 y la segunda pasada completa sale verde. Ajeno al cambio: el archive sólo toca `.md` |
| `npm run typecheck` | limpio |
| `npx eslint . --max-warnings 165` | 165 avisos, 0 errores |
| `npm run build` | verde |

## Fusión de los deltas en `openspec/specs/` (por ID de requisito, con el título vivo)

| Spec | Qué | `git diff --numstat` |
|---|---|---|
| `tickets-core` | cuerpos de RQ-TC-05, RQ-TC-06, RQ-TC-07 y RQ-TC-10 sustituidos por los del delta; encabezados vivos intactos (`### RQ-TC-05 · …`, sin «Requirement:»). §4.3 reescrita como **CERRADA** (F1B-06), con el texto anterior bajo «Previously» | 96 / 22 |
| `transitions-equipo-nuevo` | cuerpo de RQ-EN-04 (tres flujos); encabezado vivo intacto | 34 / 9 |
| `transitions-soporte-remoto` | spec nueva, íntegra desde el delta; «Fuera de alcance de este delta» pasa a «Fuera de alcance» | 317 / 0 |

La capacidad ya estaba declarada (`openspec/config.yaml:123`): R-2 se cumple sin tocar `capabilities`. No se tocaron
`openspec/config.yaml` ni `CLAUDE.md`. Las secciones «Fuera de alcance de este delta» de los otros dos deltas no se
copiaron. La fusión se había medido antes en un worktree (455 / 32); la real es 447 / 31.

## Barrido de la regla de mutación 4 (fusión y movimiento)

- **La fusión alarga dos specs**: `tickets-core` desplaza todo lo posterior a RQ-TC-05 (la §4.3 pasa de la línea 967 a
  la 1045) y `transitions-equipo-nuevo` lo posterior a RQ-EN-04. Barrido con `git grep` de
  `(tickets-core|transitions-equipo-nuevo)/spec\.md:[0-9]`: **0 citas vivas** a esas dos specs por número; todas las
  que hay están en `openspec/changes/archive/`, registros cerrados con su fecha (Caso B, no se tocan).
- **El movimiento**: las citas de esta carpeta planificaban contra `66ab783` (`tasks.md:7`, `design.md:3`) o registran
  cada lote contra su base (`apply-progress.md`): Caso B por ancla de documento. Fuera de la carpeta la nombraban por
  ruta E-090 (`docs/sdd/ENTRADA.md:1256`) y el expediente R08.3 (`:680`, `:696`): Caso A, reapuntadas al archivo en este commit.
- El detector del hook corre en el `push` de este commit.

## Tareas de persona — fuera del recuento (regla del ciclo 1)

Archivar **no** las da por hechas. Ninguna es trabajo que una tanda pueda hacer en este repositorio.

| # | Qué | Dueño | Destino | Dónde queda escrita |
|---|---|---|---|---|
| P.1 | Recuento de solo lectura de los SR por estado, **antes de desplegar** (consulta en `tasks.md`) | Alfonso | Decidir si S-6 es aceptable o hay que mover datos; entra en el siguiente paquete de despliegue | `tasks.md`, `proposal.md`, este informe (W1) |
| P.2 | Verificación en la app tras desplegar: selector sólo en SR y preseleccionado en «Remoto», nacimiento en `Solicitud Soporte`, sólo «Asignación» para Servicio Técnico, el bucle `Pendiente` ↔ `En Proceso`, «Ejecutar» sin más salidas, sin selector en otras clasificaciones, columna «Otros» | Alfonso / Servicio Técnico | Verificación en `ambientalia-desk.ambientalia.cloud` | `tasks.md`, `proposal.md` |
| P.3 | Área de las cuatro transiciones (S-1) | Gerencia / Servicio Técnico | `openspec/config.yaml` → `decisiones_de_gerencia` | **E-090** en `docs/sdd/ENTRADA.md`, `tasks.md`, este informe (W2) |

## Sugerencias del verify que quedan registradas y no se hacen aquí

`packages/zoho-sync/src/db/repo.test.ts:495` usa `/s+/` donde quería espacios (inocuo hoy); `ticketService.ts:91` y
`:96` juntan sentencias en una línea a propósito, para no desplazar citas; y el bloque heredado de RQ-TC-06 no tiene
prueba propia en este cambio. Detalle en `verify-report.md` §9.
