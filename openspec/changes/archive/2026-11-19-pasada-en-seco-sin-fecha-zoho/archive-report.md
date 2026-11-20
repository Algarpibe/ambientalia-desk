# Informe de archivo — `pasada-en-seco-sin-fecha-zoho`

Cabecera R-1 (`openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/proposal.md:1-9`): `tanda: F1F-01`, `motivo: ""`,
`capacidad: [zoho-sync]`, `maestro: []`, `cierra: no`, `toca_maestro: no`, `origen_cabecera: declarada`.

**Qué cubre de F1F-01, en una línea:** que el informe de la migración de tickets abiertos traiga la cifra del supuesto S-11 (cuántos migrados quedarían
sin fecha de Zoho, por regla y con sus números) para la pregunta `s11-migrados-sin-fecha-de-zoho`; deja fuera la respuesta de Gerencia, la regla S-11, la
ejecución del 12/12 y el resto de la fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:125`), que sigue en curso.

Partida: `main` en `d2a735a4`. Rama `pasada-en-seco-sin-fecha-zoho`, worktree propio con su `.codegraph/`. Verify: PASS WITH WARNINGS, 0 CRITICAL
(`openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/verify-report.md:3`). Sólo servidor: el cliente no cambia.

## 1 · Qué se construyó

| Pieza | Dónde |
|---|---|
| Campo `sinFechaDeZoho: { tickets, porRegla: { regla, tickets, numeros }[] }` en `InformeMigracion`, en seco y con `aplicar`, también con negativa | `apps/desk/server/db/migracionTicketsAbiertos.ts:25`, `:58` |
| Regla pura `sinFechaDeZohoDeMigracion`: por cada plan `migrar`, decide `entradaDelMarcador` (la única noción) sobre la fila que escribiría el ejecutor | `packages/shared/src/marcadorMigracion.ts:112`, `:113` |
| Fila simulada `filaDelMarcadorDeMigracion`, junto al id del marcador (S-8: RQ-TZ-28 no deja nombrarlo fuera de sus cuatro ficheros) | `packages/shared/src/migracionTickets.ts:149` |
| Una sola lectura de la historia de Zoho: `etapasDeZohoPorTicket`, sacada de `conFechaDeZoho` sin copiarla; ésta la llama | `apps/desk/server/db/sla.ts:153`, `apps/desk/server/db/sla.ts:138` |
| `DEPLOY.md` §14 nombra el campo al final de la viñeta de la pasada en seco | `DEPLOY.md:673` |
| Pruebas nuevas: unitarias U1-U7, servidor P1-P7 y dos caracterizaciones, guarda P8a-P8c | `packages/shared/src/sinFechaDeZohoDeMigracion.test.ts:21`, `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:69`, `apps/desk/server/deployPasadaEnSecoSinFechaZoho.test.ts:31` |
| En sitio: la lista de claves del informe y el fixture de la reversión (que deriva ya tres tablas de `schema.sql`) | `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56`, `apps/desk/server/db/migracionTicketsF1F01.test.ts:34-35`, `:43` |
| Spec viva: RQ-ZS-68 a RQ-ZS-71, añadidos al final por script | `openspec/specs/zoho-sync/spec.md:3218`, `:3249`, `:3275`, `:3301` |

**Ninguna línea existente se movió:** todo hunk de `git diff -U0 d2a735a4` en ficheros existentes es de una línea en sitio o va al final, y los seis ficheros
CRLF lo siguen siendo. Sin tocar `apps/desk/src`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `.env.example` ni el esquema; ni interruptor ni
variable, porque el campo no enciende ningún escritor. `resolverMarcador` (S-11) no cambió.

**Salida sobre el fixture de P1** (corte `2026-12-01T05:00:00Z`; 4100 «Entregado» sin cierre, 4200 con cierre, 4300 «Pendiente» de servicio sin entrada a
«Pendiente» en Zoho, 4400 con ella, 4500 identidad, 4600 soporte remoto, 4700 ya gobernado, 4800 tras el corte):

```json
{"tickets":2,"porRegla":[{"regla":"entregado-a-finalizado","tickets":1,"numeros":[4100]},{"regla":"pendiente-servicio-a-en-proceso","tickets":1,"numeros":[4300]}]}
```

## 2 · «Entregado» → «Finalizado»: se cuenta aparte

No basta con remitir a `cierres.conFechaDeMigracion`. Hoy coinciden por construcción (`packages/shared/src/migracionTickets.ts:126-128`,
`packages/shared/src/marcadorMigracion.ts:49`, `packages/shared/src/cierreEnCifras.ts:39-41`, `packages/shared/src/migracionTickets.ts:137-139`), pero
`cierres` da sólo la cifra (`packages/shared/src/migracionTickets.ts:131`) y el encargo pide los números; y sería una segunda noción de «sin fecha de Zoho»
frente a la única (`packages/shared/src/marcadorMigracion.ts:10-11`). P2 y U4 las enfrentan y exigen que coincidan. El verify leyó la justificación línea a
línea y la da por correcta (`openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/verify-report.md:114`).

## 3 · Intentos del registro (medida = `git diff --shortstat --no-renames` del intento más lo nuevo sin trackear)

| Intento | Unidad | Commits | Medida = registro |
|---|---|---|---|
| i1 | propuesta y delta | `aed244c6` | 256 |
| i2 | diseño y tareas | `7f5ed851` | 323 |
| i3 | L1: código, pruebas, M1-M8, barrido | `2699c020`, `73b9cc30`, `21da9b73`, `706f63f5` | 543 |
| i4 | verify | `3e3f6d3b` | 162 |
| i5 | archivo | este commit | techo 2.500 (2 × 838 + 800, redondeado); parte revisable medida antes de aplicar: 104 de la fusión más este informe |

Ningún intento pasó de 800. Las cinco comprobaciones salieron con 0 sobre el commit final de cada uno: typecheck, `npm run lint -- --max-warnings 165`
(165 contra 165), detector de citas con `--sha HEAD`, `npm test` con log entero y build con `index-F1jDYjEU.js` (427,51 kB) sin cambio. Memoria libre al
arrancar `npm test`: partida 2.665 MB, i1 5.639, i2 7.563, i3 7.530, i4 14.885. Pruebas: 6.529 en la partida y 6.548 desde i3 (36 omitidas).
**Pasada fallida**, en la evidencia del `settle` de i3: sobre `21da9b73`, 8 rojas en `apps/desk/server/db/migracionTicketsF1F01.test.ts`, porque su fixture
de pg-mem no tenía `ticket_history`; se corrigió en sitio en `706f63f5`.

## 4 · Rojo, mutaciones y verify

**Rojo previo:** el apply vio rojas la lista de claves, U1-U7, P1-P7 y P8a-P8c antes del código, y verdes de nacimiento C1 y C2; el verify lo reprodujo
devolviendo a `d2a735a4` los cinco ficheros de producción: 18 rojas y 19 verdes, y el árbol limpio después.
**Mutaciones:** M1 (sin cálculo), M2 (`entradaDelMarcador` siempre con fecha), M3 (sin historia), M4 (sin el filtro `migrar`), M5 (`to_status` simulado siempre
el destino), M6 (POSICIÓN, el campo tras el bucle: sólo P3 y P5 rojas), M7 (ensuciar `DEPLOY.md`) y M8 (lectura vacía, roja también en las pruebas de
`conFechaDeZoho`): todas rojas y restauradas con `cmp`, `file` en CRLF y `git diff` vacío
(`openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/apply-progress.md:38`). El verify reprodujo M1, M3, M4, M6 y M7. **M7 destapó** que P8c no
discriminaba (trabajaba sobre una copia ya sin el nombre) y se corrigió con una precondición dentro del intento.
**Corrección del orquestador al diseño:** D-1 ponía la fila simulada en `packages/shared/src/marcadorMigracion.ts`, lo que nombraba el id en un quinto fichero y
ponía roja P13 (`apps/desk/server/migracionMarcadorLectores.test.ts:252`); el diseño la llevó a `packages/shared/src/migracionTickets.ts` (S-8).
**Avisos del verify:** W-1, el escenario de entorno de RQ-ZS-71 se comprueba con `git diff --exit-code`, no con una prueba; W-2, la tarea de verde corrió
pocos ficheros y lo cazó la suite entera (`openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/verify-report.md:131`).

## 5 · Barrido de citas (regla de mutación 4)

Ninguna cita se rompe por posición: no se movió ninguna línea. Las que caen en una línea editada (`DEPLOY.md:673`; en el ejecutor,
`apps/desk/server/db/migracionTicketsAbiertos.ts:5`, `:25`, `:58` y `:67`; `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56`;
`apps/desk/server/db/migracionTicketsF1F01.test.ts:43`) son todas caso A: siguen diciendo lo que la línea dice hoy
(`openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/apply-progress.md:55`, y su §8 para el fixture). Ningún caso B ni C. La fusión añade al
final de la spec viva: ninguna cita a ella se desplaza. Las referencias internas a la ruta previa del cambio quedan como están, que es lo que eran en su
revisión.

## 6 · Supuestos para la lista semanal (reversibles)

S-1 a S-7 (`openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/proposal.md:97-103`) y S-8 a S-10
(`openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/design.md:242-246`). Los que más conviene que lea Gerencia:
- **S-1**: el campo se llama `sinFechaDeZoho` y lista cada regla que cambia el estado aunque todos tengan fecha (`tickets: 0`).
- **S-5**: la cifra no impide aplicar ni añade aviso: es el dato para la pregunta, no una guarda.
- **S-7**: vale la pasada en seco inmediatamente anterior a aplicar, ya con Zoho en sólo lectura y tras la sincronización completa.
- **S-8**: la fila simulada vive con el id del marcador; el bucle de escritura no se tocó (S-4) y P4 enfrenta las dos filas.

## 7 · Tareas de persona — archivar NO las da por hechas

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Desplegar el servidor (sin migración, variables ni interruptor) antes de la migración del 12/12; el cliente no cambia | Alfonso | `openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/tasks.md:65` |
| Leer `sinFechaDeZoho` en la pasada en seco previa a aplicar y responder `s11-migrados-sin-fecha-de-zoho` | Gerencia | `openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/tasks.md:66` |
| Revisar S-1 a S-10 en la lista semanal | Gerencia | `openspec/changes/archive/2026-11-19-pasada-en-seco-sin-fecha-zoho/tasks.md:67` |

## 8 · Para Supervisión (la rama no toca sus ficheros)

- La pregunta `s11-migrados-sin-fecha-de-zoho` del apartado 06 dice que el número no está medido: desde el despliegue de esta rama, lo da la pasada en seco.
- Hallazgo ya resuelto en la rama, sin entrada en la bandeja: el fixture de la reversión fijaba las tablas que lee el ejecutor y se rompió al añadir una
  lectura (`apps/desk/server/db/migracionTicketsF1F01.test.ts:34-35`); conviene registrarlo junto a las demás guardas que fijan el árbol.
