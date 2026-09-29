# Informe de archivo: `registro-contrato`

**Fecha de cierre:** 2026-09-29 · **Carpeta:** `openspec/changes/archive/2026-09-29-registro-contrato/`

```yaml
tanda: F1B-11
cierra: no
capacidad: [tickets-core, transitions-st, remisiones, zoho-sync, derivacion-avisos]
toca_maestro: si
origen_cabecera: declarada
```

## Cobertura de la fila (R-1)

**F1B-11, cambio 3 de 3, `cierra: no`. Cubre el registro de contrato (cliente, lote, inicio y fin), su vigencia por
fecha, la prioridad `High` al nacer impuesta por el servidor, la guarda de contrato vencido en las tres puertas, el
informe trimestral por contrato con su CSV y el aviso de ritmo a Comercial; deja fuera la ampliación del contrato
(E-086, `docs/sdd/ENTRADA.md:1222`, dueña Gerencia) y el Top 5 con «manda la prioridad más alta» (F1B-07,
`proposal.md:51-54`).**

Con este cambio están hechos los tres de F1B-11 —`parche-iv11-orden-venta` (`0338be6`), `asociacion-ov-ticket`
(`b27f91b`) y éste—, y la fila **sigue sin cerrarse**: lo único que falta es la ampliación, que no se puede construir
hasta que Gerencia responda E-086 (P.5).

## Veredicto del verify

`verify-report.md:172`: **PASS WITH WARNINGS**, 12/12 requisitos, 74/74 escenarios (**73 PASS y 1 PARTIAL**),
0 críticos, 5 avisos.

- **El PARTIAL es el escenario 67** («El informe se exporta como tabla», `verify-report.md:113`): el texto CSV y
  los datos están probados en node; el botón, el BOM y el `Blob` de `ContratoFicha.tsx` no, porque los `.tsx`
  quedan **fuera de la red de pruebas por decisión de Gerencia F0-00** (`vitest.config.ts:16-20`). Es un hueco
  declarado, no una carencia; lo cubre la verificación manual P.6.

| Aviso | Estado al archivar |
|---|---|
| **W1** · citas a `ticketService.ts` desfasadas en `transitions-st` (previa al cambio) | **Corregida en este archivo, y ampliada**: ver «Citas a `ticketService.ts`» abajo |
| **W2** · atomicidad del aviso de ritmo probada por estructura (pg-mem no revierte `ROLLBACK`) | Abierta; la comprueba Postgres en P.6 |
| **W3** · escenario 67 PARTIAL | Abierta por decisión (F0-00); P.6 |
| **W4** · hipótesis: `index.ts:85` registra el intervalo y la pasada de ritmo corre en producción | Abierta; P.6 |
| **W5** · el prefiltro de la marca en `avisarRitmoContratos` no lo detecta ninguna prueba | Superviviente declarado (optimización, no comportamiento) |

## Cifras re-ejecutadas por el orquestador

Sobre `df28b37`, antes de la fusión, el 2026-09-29:

| Comando | Resultado |
|---|---|
| `npm test` | 155 ficheros pasan y 1 omitido (156); **1.848 pruebas pasan** y 2 omitidas (1.850). Salida 0 |
| `npm run typecheck` | limpio. Salida 0 |
| `npm run lint` | 0 errores, 165 avisos (el techo de siempre). Salida 0 |
| `npm run build` | compila. Salida 0 |

Coinciden con las del verify (`verify-report.md:172`) y con el lote 6 del ledger.

## Fusión de los deltas

Por ID de requisito contra el encabezado `### RQ-` de las specs vivas. En las MODIFIED se conserva el título vivo;
las ADDED entran al final de la sección de requisitos, antes de «Comportamiento actual, a corregir». Los apartados
«Fuera de alcance de este delta» no se fusionan. Cuerpos comprobados **verbatim** contra el delta, bloque a bloque.

| Spec viva | Requisitos | Operación | Encabezado hoy |
|---|---|---|---|
| `transitions-st` | RQ-TS-06, RQ-TS-14, RQ-TS-18 | MODIFIED | `:181`, `:414`, `:476` |
| `tickets-core` | RQ-TC-08 | MODIFIED | `:302` |
| `tickets-core` | RQ-TC-21 a RQ-TC-25 | ADDED | `:638`, `:706`, `:735`, `:778`, `:828` |
| `remisiones` | RQ-RE-16 | MODIFIED | `:360` |
| `zoho-sync` | RQ-ZS-15 | ADDED | `:378` |
| `derivacion-avisos` | RQ-AV-14 | ADDED | `:325` |

Sin capacidad nueva (R-2 no aplica). La fila 9 de RQ-TS-06 decía «línea nueva, entre `:142` y `:148`, fijada por el
diseño»; tras el apply la guarda existe y se reancla a `ticketService.ts:147` (caso A).

**Arreglo documental que el delta dejó al archivo** (su «Fuera de alcance»): la guarda de contrato vencido entra en la
fila C de la tabla canónica de escalones de `transitions-st` §3.8 y en sus dos tablas de puertas (`:96` en el alta,
`:147` en `habilitar_servicio`), cada una con su «Previously».

## Citas a `ticketService.ts` en `transitions-st/spec.md`

Releídas **todas**, completas y abreviadas, contra `apps/desk/server/services/ticketService.ts` de hoy (234 líneas).

| Cita (línea de la spec hoy) | Qué afirma | Caso | Reparación |
|---|---|---|---|
| `:145` (`:32`, `:1112`) | el actor es el usuario de la sesión | A | → `:153` (`const actor = user.name ?? TRANSITION_ACTOR`) |
| `:123-125` (`:33`, `:1112`) | permiso por área impuesto en servidor | A | → `:129-131` (`canExecuteTransition` y el `403`); `:123-125` son el `400` y el `404` |
| «línea nueva, entre `:142` y `:148`» (`:199`) | guarda de contrato vencido | A | → `:147` |
| `:115-122` (`:405`) | avisos después y fuera de la transacción | A | → `:157-164` |
| `:119-121` (`:407`) | una caída entre las dos escrituras pierde el aviso | A | → `:161-163` |
| `:151-152`, `:156-159` (`:409`) | deduplicación por persona | A | → `:193-194`, `:198-201` |
| `:123-125` abreviada (`:410`) | una sola llamada a n8n | A | → `:165-167` |
| `:167-177` (`:412`) | el correo no tumba la transición; `NULL` es la cola | A | → `:209-219` |
| `:45-49` y `:94` (`:758`) | el `409` del alta, movido detrás de la guarda de cliente | A | → `:96-100` y `:61-79` |
| `:22-60` y `:82-110` (`:923-924`) | la tabla ANTES de `orden-precedencia-guardas` | B | se nombra la revisión: `en 38bd062`, donde se escribió |
| `:162-185` (`:1085`) | el aviso por correo al cambiar de área ya existe | A | → `:187-219` |
| `:114-223`, `:123`, `:125`, `:126-128`, `:129-131`, `:134`, `:138-142`, `:147`, `:148-152`, `:132-134`, `:153`, `:24`, `:27`, `:39`, `:61-79`, `:88`, `:90`, `:96-100` | resto (RQ-TS-06, RQ-TS-08, RQ-TS-11, RQ-TS-12, RQ-TS-14, §3.4, §3.8) | A | correctas; sin cambio |

Caso C: ninguna. Catorce citas reparadas de caso A y dos ancladas de caso B.

## Barrido de citas del movimiento y de la fusión

- **Fusión.** `openspec/specs/hojas-vida/spec.md:185` y `:190` citaban la tabla canónica de escalones y la excepción
  A/C de `transitions-st` en `:832-837` y `:840-842`; la fusión y §3.8 las corrieron +55 → `:887-892` y `:895-897`
  (caso A). `derivacion-avisos/spec.md:67-70` (citada desde `openspec/config.yaml` y `ENTRADA.md`) queda por encima
  de la inserción y no se mueve. Ninguna otra cita `ruta:línea` del repositorio apunta a las cinco specs fusionadas
  fuera de los cambios archivados, que son registros fechados.
- **Movimiento.** Dos rutas a la carpeta vieja, reapuntadas a la archivada: `docs/sdd/ENTRADA.md:1232` (`design.md`
  §7) y `docs/sdd/R08.3_Expediente_de_cambios.md:661`.
- Detector de citas sobre el commit del archivo: se consigna en el parte del orquestador.

## Tareas de persona — fuera del recuento (regla del ciclo 1)

No las puede hacer una tanda en este repositorio. **Archivar NO las da por hechas.** Texto completo en `tasks.md:449-453`.

| Tarea | Dueño | Qué | Destino | Escrita en |
|---|---|---|---|---|
| P.1 | Alfonso | ejecutar `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (sólo lectura) en producción: cuántas OV caen en cuarentena el día uno | confirmar el clasificador de subOV | `tasks.md:449`, `proposal.md`, `openspec/config.yaml` → `adenda_iv11_asociacion_ov_ticket` |
| P.4 | Alfonso | consulta 5 del mismo `.sql`: literales de borrador y anulada en `books.sales_orders` | confirmar S-11 (`draft`/`void` siguen como hipótesis) | `tasks.md:450`, mismos sitios |
| P.5 | Gerencia | responder E-086: año y tope de la ampliación | desbloquea la ampliación y el cierre de F1B-11 | `tasks.md:451`, `docs/sdd/ENTRADA.md:1222`, `proposal.md:130` |
| P.6 | Comercial | tras desplegar, registrar un contrato real y comprobar en `ambientalia-desk.ambientalia.cloud`: `High` al nacer, subOV vencida rechazada, marca en la ficha, informe y CSV, pasada de ritmo | verificación en la app (cierra W2, W3, W4) | `tasks.md:452`, `proposal.md` |
| P.7 | Comercial | dar de alta los contratos vigentes hoy, sin relleno automático | sin ellos prioridad y bloqueo no actúan el día uno | `tasks.md:453`, `proposal.md` |

## Commits del cambio

| Tramo | Commits | CI |
|---|---|---|
| Lote 1 · modelo y vigencia | `9288779` | 36509267188 |
| Lote 2 · prioridad y guarda en las tres puertas | `285ecf4` | 36511197810 |
| Lote 3 · API y ticket de contrato | `d6ed24c` | 36561183451 |
| Lote 4 · informe trimestral | `5d93eb7` | 36563126477 |
| Lote 5 · ritmo y CSV | `e2bf85b`, `3034cef` | 36587401614, 36587501788 |
| Lote 6 · interfaz y cierre | `f00c127`, `bfee93f` | 36590913785 |
| Verify | `fed2588`, `df28b37` | 36592706434 |

Todos verdes según el ledger de `gentle-ai sdd-attempt` (intentos 1-7 de `registro-contrato`).
