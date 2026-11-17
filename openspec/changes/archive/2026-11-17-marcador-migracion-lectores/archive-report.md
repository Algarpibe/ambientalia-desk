# Informe de archivo — `marcador-migracion-lectores`

Cabecera R-1 (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:1-9`): `tanda: F1F-01`, `motivo: ""`,
`capacidad: [trazas, hojas-vida, tickets-core]`, `maestro: []`, `cierra: no`, `toca_maestro: no`, `origen_cabecera: declarada`.

**Qué cubre de F1F-01, en una línea:** que la fila marcador de la migración (`packages/shared/src/migracionTickets.ts:14`) se conserve como rastro y no cuente ni
se enseñe como etapa (E-215, E-216, E-217 y dos hallazgos de reloj y esperas); deja fuera la ejecución de la migración del 12/12 y el resto de la fila
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:125`), que sigue en curso.

Decisiones: `decision/marcador-migracion-en-pantallas` (`openspec/config.yaml:6766-6782`) y `decision/h1-fechas-migrados` (`openspec/config.yaml:4863-4881`).
Partida: `main` en `e728808d`. Rama `marcador-migracion-lectores`, worktree propio con su `.codegraph/`. Verify: PASS WITH WARNINGS, 0 CRITICAL
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/verify-report.md:163`).

## 1 · Qué se construyó

| Pieza | Dónde |
|---|---|
| Módulo puro nuevo, única noción de «entrada con fecha de Zoho»: `entradaDelMarcador` y `resolverMarcador`; reconoce el marcador sólo con `esPasoDeMigracion` | `packages/shared/src/marcadorMigracion.ts:42`, `packages/shared/src/marcadorMigracion.ts:60` |
| Presentador en español del historial: título «Migración desde Zoho Desk», textos de las cuatro reglas y cinco etiquetas propias | `packages/shared/src/marcadorMigracion.ts:75`, `:78`, `:94` |
| Exportación, línea 57 nueva al final del índice | `packages/shared/src/index.ts:57` |
| `entradasActuales`: el marcador de identidad no da entrada; el que cambia el estado entra con la fecha de Zoho; sin fecha, sin entrada. Líneas 2, 88 y 93 en sitio y `conFechaDeZoho` al final | `apps/desk/server/db/sla.ts:88`, `apps/desk/server/db/sla.ts:132` |
| `secuenciaDelReloj` resuelve el marcador en su línea 40; líneas 3, 43, 45 y 77 en sitio | `apps/desk/server/db/relojSla.ts:40` |
| Esperas: el `SELECT` trae `transition_id` y `values` | `apps/desk/server/db/esperasVencidas.ts:36` |
| Historial: rama del marcador en la línea 143 y `eventoMigracion` al final, con `eventName: 'AppTransition'` | `apps/desk/server/db/historial.ts:143`, `apps/desk/server/db/historial.ts:165` |
| Conversación y hoja de vida lo ocultan (filtro `!esPasoDeMigracion`) | `apps/desk/server/db/conversacion.ts:143`, `apps/desk/server/db/equipos.ts:278` |
| Traspaso: `esPasoDeMigracion` en vez de la comparación propia (S-9) | `apps/desk/server/db/traspaso.ts:26` |
| Pruebas: R1 a R4 reescritas en sitio con el mismo número de líneas; P1-P9 y P10-P13 al final; unitarias del módulo | `apps/desk/server/migracionMarcadorLectores.test.ts:41`, `:112`, `:208`; `apps/desk/server/db/migracionTicketsAbiertos.test.ts:142`; `packages/shared/src/marcadorMigracion.test.ts:1` |
| Specs vivas: RQ-TZ-26 a RQ-TZ-28, RQ-HV-20 y RQ-TC-84 a RQ-TC-87, añadidos al final por script | `openspec/specs/trazas/spec.md:942`, `openspec/specs/hojas-vida/spec.md:571`, `openspec/specs/tickets-core/spec.md:4813` |

**Ninguna línea existente se movió** en ningún fichero: todo hunk de `git diff -U0 e728808d -- apps packages` es de igual longitud o va al final. Sin tocar:
`apps/desk/src`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, el esquema y las variables de entorno. Fuera de pruebas, el id del marcador sólo aparece en
cuatro ficheros (`packages/shared/src/migracionTickets.ts`, `packages/shared/src/cierreEnCifras.ts`, `apps/desk/server/db/cierresDeMigracion.ts` y
`apps/desk/server/db/migracionTicketsAbiertos.ts`), y lo vigila P13 (`apps/desk/server/migracionMarcadorLectores.test.ts:252`).

## 2 · Inventario de lectores (22 filas, medido sobre `e728808d`)

Tabla completa en `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:33-56`. Los 15 del analista coincidieron con `git grep`; el
16.º, `apps/desk/server/db/eliminarTicket.ts:53`, cuenta filas por nombre de tabla dinámico y el barrido por `FROM ticket_transitions` no lo caza (clase b: el
rastro se borra con el ticket, S-7). Clase (c), corregidos: historial, conversación, hoja de vida, `entradasActuales` y, por `secuenciaDelReloj`, el reloj de
Análisis y las esperas.

**Dos hallazgos fuera de la bandeja, ya corregidos:** el marcador de identidad, con `to_status` nulo, anulaba la secuencia
(`apps/desk/server/db/relojSla.ts:48` en `e728808d`), así que los 28 migrables de la pasada en seco (`openspec/config.yaml:5646`) habrían quedado sin reloj
al cerrarse y fuera de la alarma de esperas (`apps/desk/server/db/esperasVencidas.ts:56` en `e728808d`). **E-217 estaba latente:** ningún estado con
alarma (`packages/shared/src/sla.ts:137-141`) es destino de una regla que cambia el estado; se corrige igual, como manda `openspec/config.yaml:6777`.

## 3 · Intentos del registro (medida = `git diff --shortstat --no-renames` del intento más lo nuevo sin trackear)

| Intento | Unidad | Commits | Medida = registro |
|---|---|---|---|
| i1 | propuesta y deltas | `63c590a4`, `7319b380` | 392 |
| i2 | diseño y tareas | `6dcb85f2` | 369 |
| i3 | L1: núcleo, `sla.ts`, reloj y esperas, R1, R4, P1-P9, M1-M8 | `707fc260`, `eae6fb05` | 466 |
| i4 | L2: presentador, historial, conversación, hoja de vida, traspaso, R2, R3, P10-P13, M9-M14, barrido | `749d1bd3`, `2d7cc888` | 383 |
| i5 | verify | `7dcd0766`, `6b03f8be` | 169 (el diagnóstico de su `settle` dice 171 por un error de suma del orquestador) |
| i6 | archivo | este commit | techo 3.300 (2 × 1.132 + 800, redondeado); parte revisable medida antes: 182 de la fusión más este informe |

Ningún intento pasó de 800. Las cinco comprobaciones salieron con 0 sobre el commit final de cada uno: typecheck, `npm run lint -- --max-warnings 165` (165
contra 165), detector de citas, `npm test` con log entero (6.529 pasan y 36 omitidas desde i4) y build. Memoria libre al arrancar: i1 4.524 MB, i2 8.037,
i3 10.651, i4 9.798, i5 9.005. **Pasada fallida**, en la evidencia del `settle` de i1: sobre `63c590a4` el detector salió 1 porque el orquestador dio en los
encargos el rango de la decisión hasta la 6784 y el fichero acaba en la 6782; se reparó en `7319b380`. El bundle del cliente no cambió en ningún intento:
`index-F1jDYjEU.js`, 427,51 kB.

## 4 · Rojo, mutaciones y verify

**Rojo previo:** L1 vio 9 pruebas rojas antes del código y L2, 10; el verify reprodujo 15 rojas contra `e728808d` en un worktree temporal ya retirado.
**Mutaciones:** M1 a M14 (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:159-174`), todas rojas y restauradas con `file` en CRLF y
`git diff --numstat` vacío. El verify reprodujo M1, M3, M7, M9, M11, M12 y M14; las otras siete sólo las hizo el apply. **M7 destapó** que P6 no discriminaba
(pasaba por un hueco de la secuencia, no por S-11) y se corrigió dentro de L1. **M14** ensucia el fichero vigilado: sólo P13 se pone roja.

**Correcciones del orquestador antes de cada commit:** S-4 de la propuesta apartaba el marcador sin la fecha de Zoho, contra `openspec/config.yaml:6777`, y
`apps/desk/server/db/traspaso.ts:26` quedaba fuera pese a ser la única otra comparación con el id (S-9); dos escenarios de la spec estaban como ROJO y ya
pasaban; las casillas 1.17 y 2.21 cerraban el intento antes de las mutaciones; una abreviada del informe de verify se atribuía a otro fichero.

## 5 · Barrido de citas (regla de mutación 4)

Ninguna cita se rompe por posición. De las **108** que caen en una línea editada fuera de este cambio, ninguna se editó: las de las specs vivas y de los
documentos son caso A; las de `openspec/config.yaml:6775` y `docs/sdd/ENTRADA.md:2094` son caso B ya fechadas; y 22 del archivo son caso B sin ancla, listadas
y sin editar (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/apply-progress.md:121`). El verify muestreó 10 y coincidieron (W-3).

## 6 · Supuestos para la lista semanal (reversibles)

S-1 a S-9 (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:121-139`) y S-10 a S-13
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:235-242`). Los que más conviene que lea Gerencia:
- **S-1**: el historial enseña el marcador como «Migración desde Zoho Desk», con estado en Zoho, estado en Desk, regla, corte y quién la ejecutó.
- **S-2 y S-3**: la conversación y la hoja de vida lo ocultan.
- **S-10**: «Finalizado» fecha con el cierre de Zoho (`llegadaQueCuenta`, la misma del informe de contrato); un cierre que puso la migración queda sin reloj.
- **S-11** (W-2 del verify): un «Pendiente» → «En Proceso» sin «Pendiente» en la historia de Zoho deja su secuencia entera sin dato.

## 7 · Tareas de persona — archivar NO las da por hechas

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Desplegar el servidor (sin migración ni variables) antes de la migración del 12/12; el cliente no cambia | Alfonso | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/tasks.md:107` |
| Revisar S-1 a S-13 en la lista semanal | Gerencia | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/tasks.md:107` |

## 8 · Para Supervisión (la rama no toca sus ficheros)

- **Traza de E-215, E-216 y E-217** (`docs/sdd/ENTRADA.md:2083-2096` y `openspec/config.yaml:6775`): qué línea cambia y cómo queda, en
  `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/apply-progress.md:146`. E-215 lo resuelven RQ-TZ-26 y RQ-TZ-27; E-216, RQ-HV-20; E-217,
  RQ-TC-84 a RQ-TC-86.
- **Los dos hallazgos del §2** no tienen entrada en la bandeja: se construyeron aquí y conviene registrarlos ya resueltos.
- **Estructura:** RQ-HV-20 queda al final de `openspec/specs/hojas-vida/spec.md`, detrás de su «## 2 · Fuera de alcance de esta spec», como ya pasa en
  `openspec/specs/tickets-core/spec.md` desde RQ-TC-69; insertarlo antes habría movido líneas.
