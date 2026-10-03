---
tanda: F1C-11
motivo: ""
capacidad: [derivacion-avisos, permissions]
maestro: ["M1.3", "M1.9.2", "Anexo D nº 76", "R08.4.md:1617-1620", "R08.4.md:2005"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: derivación de «Solicitud repuestos» al Director Técnico

Rutas y líneas completas en `exploration.md` (misma carpeta). Aquí sólo lo que decide.

## Intención

Hoy «Solicitud repuestos» y «Entrega de Repuestos» heredan al derivado vigente
(`packages/shared/src/transitions.ts:200-201`, `:204-205`): el ticket que pide piezas sigue a nombre del
técnico y quien las entrega no lo ve como suyo. Gerencia decidió que el encargado de inventario es el
Director Técnico y que la entrega devuelve el ticket al técnico (`openspec/config.yaml:3494`), y que se
construye ya, con el respaldo aplazado a 1E (`openspec/config.yaml:3614`). El maestro lo recoge en
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1617-1620`. Fila del plan:
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:109`; orden: `openspec/config.yaml:3756`.

## Alcance

1. **Derivación.** `DERIVACION_POR_DEFECTO` (`packages/shared/src/transitions.ts:274-282`) gana
   `solicitud_repuestos → { tipo: 'cargo', cargo: 'Director Técnico' }` y
   `entrega_repuestos → { tipo: 'primerDerivado' }`. Pasan de tres a cinco las que proponen y de 28 a 26
   las que heredan; el comentario del bloque (`:268-272`) se corrige en sitio.
2. **Cargo.** «Especialista técnico» entra como octavo en `CARGOS` (`packages/shared/src/cargos.ts:12-15`),
   al final de la lista y en la línea `:14`. Sin excepción de permiso, sin respaldo y sin registro de
   ausencias. El desplegable de la administración lo ofrece solo (`apps/desk/src/components/UsersAdmin.tsx:125`, `:185`).
3. **Guardianes y cifras, en el mismo commit**: las pruebas de §«Pruebas que se ponen rojas».
4. **Specs**: deltas de `derivacion-avisos` (RQ-AV-02) y `permissions` (RQ-PM-12 y los dos escenarios
   que dicen «siete cargos», `openspec/specs/permissions/spec.md:422`, `:462`).
5. **Maestro**: texto de corrección para M1.9.2 («Cinco proponen a otro») entregado en el expediente,
   no aplicado al `.docx`.
6. **Barrido de citas** al cierre (regla de mutación 4), ver «Estrategia de líneas».

## Fuera de alcance

- El respaldo al Especialista técnico y el registro de ausencias: esperan a 1E (`openspec/config.yaml:3614`).
- Imponer en el servidor el destinatario, y restringir quién ejecuta cada paso: es el nivel «propietario
  del registro» (`R08.4.md:1620`).
- Una operación de reasignar en sitio (S-3). Ningún `.tsx`. El mapa del blueprint: el generador no lee
  la derivación.
- Avisos: `avisoDerivacion` ya cubre el cambio de derivado (`apps/desk/server/services/ticketService.ts:169-185`).
- Datos de producción.

## Capacidades

- Nuevas: ninguna.
- Modificadas: `derivacion-avisos` (RQ-AV-02: cinco proponen, 26 heredan; tabla y escenarios);
  `permissions` (RQ-PM-12: ocho cargos, siete de `decision/c10b-gerente-director` más el de
  `decision/cargo-encargado-de-inventario`).
- `transitions-st`: sin delta previsto; su mención de `destinatarioDelEscalado`
  (`openspec/specs/transitions-st/spec.md:1324`) no fija la lista de estados. Lo confirma `sdd-spec`.

## Enfoque

Rojo primero (`strict_tdd`): se reescriben las pruebas a cinco entradas y ocho cargos, se ven fallar y
después se toca el dato. Pruebas nuevas: `derivacionInicial` alimentada con el `porDefecto` real de las
dos transiciones (`apps/desk/src/lib/personas.test.ts`), y en servidor, que ejecutar `solicitud_repuestos`
con un derivado distinto del Director Técnico responde `200` — fija por escrito que el servidor no impone.

### Estrategia de líneas (regla de mutación 4)

Medido: **595** citas `transitions.ts:NN` en 170 ficheros, **139** con inicio en `:300` o más, **41** en
`:274-299`, y **21** a `:276` o `:278`. Por eso: **cero líneas netas en `transitions.ts` y en `cargos.ts`**
(57 citas). Preferencia para el diseño: cada entrada nueva comparte línea con la que tiene su mismo
destino —`solicitud_repuestos` en `:276` junto a `escalado_a_revision`, `entrega_repuestos` en `:281`
junto a `aprobacion`—, de modo que toda línea citada sigue diciendo lo que decía. Al cierre se barren
**todas** las citas del fichero, **sin excluir `openspec/changes/archive/`**, más el pase de abreviadas,
leyendo qué afirma cada una: las que dicen «tres entradas» en presente son caso A y se corrigen; las
fechadas, caso B, se anclan a `f55b7d9`. El desfase previo `transitions.ts:267-276` se repara sólo en los
ficheros que la tanda ya edita (`derivacion-avisos/spec.md`, `sla.test.ts`, `sla.ts`).

### Regla 13, decisión a decisión

| Decisión del cliente | Línea del servidor | Veredicto |
|---|---|---|
| Rellena «Derivado a» con el titular del cargo o el primer derivado (`apps/desk/src/components/TransitionPanel.tsx:87-94`) | Ninguna la impone; `apps/desk/server/services/ticketService.ts:138-142` sólo valida persona activa | **Comodidad, no guarda** |
| Bloquea / avisa | Nada nuevo | — |

## Pruebas que se ponen rojas

`packages/shared/src/transitions.test.ts:79-93`; `packages/shared/src/sla.test.ts:117` y `:179-182`;
`packages/shared/src/cargos.test.ts:22-30`, `:57-62` y `:204-205` (1.700 → 1.870);
`apps/desk/server/permisos.test.ts:356-369` y `:446-460` (744 → 837);
`apps/desk/server/prioridadTop5.test.ts:150-157` y `:359-366` (nueve → diez).

## Mutaciones que la tanda reproduce

| # | Mutación | Debe poner rojo |
|---|---|---|
| M1 | Quitar la entrada `solicitud_repuestos` | mapa entero, lista de `sla.test.ts`, prueba de `personas` |
| M2 | Quitar `entrega_repuestos`, o cambiarla a `cargo` | mapa entero; la lista de `sla.test.ts` gana `Solicitado` |
| M3 | Cambiar el cargo de `solicitud_repuestos` a otro | mapa entero |
| M4 (posición) | Mover «Especialista técnico» dentro de `CARGOS` | prueba de orden |
| M5 (fichero vigilado, regla 2) | Alterar «Especialista técnico» en la `respuesta_textual` de `openspec/config.yaml:3494`, en sitio y revirtiendo | guardián de `cargos.test.ts` |
| M6 | Quitar el octavo de `CARGOS` | guardián y las cuatro cifras |

La regla de mutación 1 sobre guardas no aplica: no se añade ninguna guarda al servidor.

## Supuestos (modo producción)

| ID | Supuesto | Por qué es razonable y reversible |
|---|---|---|
| S-1 | «Deriva» = la propuesta por defecto existente: la casilla abre con el titular y quien ejecuta puede cambiarla; el servidor no impone | Es lo que hacen las tres ya construidas y el verbo del maestro (`R08.4.md:2005`). Imponer es añadir una guarda después, sin deshacer nada |
| S-2 | Se compara `users.cargo`, con plegado (`apps/desk/src/lib/personas.ts:37-38`) | Mismo mecanismo; cambiar a `cargo_permiso` es una línea. Riesgo: el texto en producción no es verificable desde aquí |
| S-3 | «Reasignación manual» = cambiar la casilla al ejecutar una transición | Ya existe; una operación nueva cambiaría el alcance de la fila |
| S-4 | «Al técnico que lo tenía» = `primerDerivado` | Lo iguala el maestro (`R08.4.md:1619`). Cambiarlo es otro `tipo` en la unión |
| S-5 | Sin titular activo, cae al heredado | Derivar no frena un ticket (`packages/shared/src/transitions.ts:96`) |
| S-6 | `destinatarioDelEscalado('En Proceso')` pasa a Director Técnico | Sin consumidor en producción (`packages/shared/src/sla.ts:26-29`); ningún estado con alarma afectado |
| S-7 | El octavo cargo va al final de la lista | Orden de llegada de las dos decisiones; moverlo es editar una línea |

**Pregunta para Gerencia** (va a `docs/sdd/ENTRADA.md` al cerrar): la derivación al Director Técnico,
¿se propone y el técnico puede cambiarla, o se impone?

## Tareas de persona (no cuentan como tareas; archivar no las da por hechas)

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Asignar «Especialista técnico» a Johny Luna en producción | Administrador de la aplicación | `docs/sdd/ENTRADA.md`, al cerrar |
| Confirmar que el `users.cargo` del Director Técnico dice «Director Técnico» en producción | Gerencia | `docs/sdd/ENTRADA.md`, al cerrar |

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Citas desfasadas o que pasan a afirmar algo falso («tres») | Media | Cero líneas netas; barrido completo con archivo, casos A/B/C |
| El cargo de firma no casa en producción y la propuesta no aparece, en silencio | Media | Cae al heredado (S-5); tarea de persona; verificación en la aplicación |
| El técnico original está de baja al entregar | Baja | `primerDerivado` inactivo cae al heredado (`apps/desk/src/lib/personas.ts:73`) |
| Una cifra a mano queda sin actualizar | Baja | Las cuatro están listadas; `npm test` las delata |

## Vuelta atrás

Revertir el commit: dato, pruebas y specs vuelven juntos. Sin migración. Si «Especialista técnico» ya se
asignó a alguien, antes hay que vaciar ese `cargo_permiso`: un valor fuera de la lista cuenta como «sin
cargo» (`packages/shared/src/cargos.ts:40-42`), así que no rompe nada pero queda huérfano.

## Criterios de aceptación

1. Al abrir «Solicitud repuestos», la casilla propone al usuario activo con cargo Director Técnico; al
   abrir «Entrega de Repuestos», al primer derivado del ticket; ambas siguen editables.
2. El mapa de propuestas tiene exactamente cinco entradas; 26 heredan.
3. `CARGOS` tiene ocho, en orden, y el guardián lee las dos decisiones.
4. El servidor acepta un derivado distinto del propuesto (`200`).
5. `npm test`, `npm run typecheck`, `npm run lint` en verde; M1 a M6 dan rojo.
6. `transitions.ts` y `cargos.ts` conservan su número de líneas; barrido anotado en `apply-progress.md`.

## Estimación de líneas (techo 800; válvula 720 por lote; hipótesis)

| Intento | Contenido | Líneas |
|---|---|---|
| propose | `exploration.md` + `proposal.md` | ~270 |
| spec + design + tasks | 2 deltas (~120) + `design.md` (~110) + `tasks.md` (~80) | ~310 |
| apply (un lote) | código ~35 (`transitions.ts` ~22, `cargos.ts` ~8, `sla.ts` ~5) + pruebas ~170 × 1,8 ≈ 305 + casillas de `tasks.md` ~60 + `apply-progress.md` ~100 + citas reparadas ~40 | ~540 |
| verify | `verify-report.md` | ~260 |
| archive | fusión de 2 deltas + `archive-report.md` (lo revisable) | ~240 |
