# Informe de verify: tiempo-en-tarjeta-remision-creada (F1B-07, `cierra: si`)

Verificador independiente, 2026-10-11. Worktree `tiempo-en-tarjeta-remision-creada`, HEAD `cec8ad1`, partida `34e5e85` (`git diff 34e5e85 HEAD --stat`: 15 ficheros, +647 −14). El `apply-progress.md` no se tomó como prueba: cada afirmación se contrastó con el código. Preflight: auto · hybrid · 800 · strict_tdd.

## Veredicto: PASS CON AVISOS

0 CRITICAL · 3 WARNING · 3 SUGGESTION. El producto cumple RQ-VT-16; los avisos son de alcance y de documentación, no de código.

## Códigos de salida (cada uno visto por separado)

| Comando | Salida | Cifras |
|---|---|---|
| `npm test` (sin `TEST_DATABASE_URL`) | `0` | 267 ficheros pasan y 3 saltados; 4.408 pruebas pasan y 11 saltadas (integración con PostgreSQL real, ajena al cambio) |
| `npm run typecheck` | `0` | sin errores |
| `npx eslint . --max-warnings 165` | `0` | 0 errores, 165 avisos (margen 0, igual que la base) |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | `0` | 7.170 comprobadas, 13 abreviadas rotas informativas; ninguna es de este cambio |

## 1. Escenario → prueba (rutas leídas)

| Escenario de RQ-VT-16 | Prueba |
|---|---|
| El día de entrada no cuenta | `packages/shared/src/tiempoEnEstado.test.ts:15` (T-1) |
| Entre semana (2) | `tiempoEnEstado.test.ts:19` (T-2) |
| Fin de semana (1) | `tiempoEnEstado.test.ts:23` (T-3) |
| Festivo (1, no 2) | `tiempoEnEstado.test.ts:27` (T-4) |
| Cierre sembrado (2, no 3) | `tiempoEnEstado.test.ts:31` (T-5, con y sin cierre); por la base: `apps/desk/server/listaRemisionCreada.test.ts:158` (RC-13) |
| Día en zona de negocio | `tiempoEnEstado.test.ts:36` (T-6, ambos lados); `listaRemisionCreada.test.ts:166` (RC-14) |
| Sin fecha de entrada | `listaRemisionCreada.test.ts:172` (RC-15: campo presente, null, al final); texto en `tiempoEnEstado.test.ts:51` (T-8) |
| La lista trae el campo a todos | `listaRemisionCreada.test.ts:181` (RC-16, por la ruta) |
| Los demás listados no lo traen | `listaRemisionCreada.test.ts:192` (RC-17: `/api/tickets` y `/api/mis-tickets`) |
| El orden no cambia, sin N+1 | `listaRemisionCreada.test.ts:39-83` (RC-1 a RC-6) y `:118` (RC-11), intactas: el diff del fichero sólo añade |
| Textos exactos y ausente | `tiempoEnEstado.test.ts:51` (T-8: 0, 1, 2, 3, null, undefined) |
| Los dos relojes | `tiempoEnEstado.test.ts:61` (T-9), ver punto 7 |
| Una sola lectura de cierres (diseño) | `listaRemisionCreada.test.ts:205` (RC-18: `[1, 1]` con 3 y con 6) |
| Manual: distintivo gris; tarjeta, lista y tabla | **NO verificable por máquina** (`.tsx` fuera de la red por decisión de Gerencia, F0-00). Los verifica una persona tras el despliegue; archivar no los da por hechos |

## 2. y 3. Tasks y diseño contra código

- `tasks.md`: 27 casillas marcadas, 0 abiertas; todas describen algo presente en el diff (commits `73123f4` feat, `ece713c` y `cec8ad1` documentales).
- Firmas: `diasHabilesEnEstado(desde, ahora, cierres)` y `textoTiempoEnEstado(dias)` en `packages/shared/src/tiempoEnEstado.ts:5,11`, exportadas en `packages/shared/src/index.ts:42`. `listaRemisionCreada(db, ahora = new Date())` en `apps/desk/server/db/listaRemisionCreada.ts:13`; la ruta lo llama sin segundo argumento (`apps/desk/server/routes/prioridad.ts:93`).
- Una sola lectura de cierres: `listaRemisionCreada.ts:15` (`listarCierres` una vez, fuera del `map`), fijada por RC-18.
- Sin orden ni SLA tocados: el diff no incluye `listaPorEntrada.ts`, `sla.ts` ni `calendarioLaboral.ts`; `ordenarPorEntrada` sigue leyendo sólo `enEstadoDesde`.
- Ningún cálculo de días hábiles en `apps/desk/src`: el `grep` de `diasHabiles|esDiaHabil|calendarioLaboral` da sólo los tres usos (`TicketCard.tsx:103`, `TicketList.tsx:29`, `TicketTable.tsx:34`), que pasan `ticket.diasHabilesEnEstado`.

## 4. Mutaciones propias (distintas de M1 a M10)

Cada una restaurada con `git checkout -- <fichero>`.

| # | Cambio | Resultado |
|---|---|---|
| A1 | `dias < 1` pasa a `dias > 1` en `tiempoEnEstado.ts` | rojo: T-8 |
| A2 | `textoTiempoEnEstado` devuelve nada también para `0` | rojo: T-8 |
| A3 | `listaRemisionCreada` ignora `ahora` y usa `new Date()` | rojo: RC-13, RC-14, RC-15 |
| A4 | el campo vale `0` (`?? 0`) cuando no hay entrada | rojo: RC-15 y RC-16 |
| A5 | `ordenarPorEntrada` invierte `ia - ib` | rojo: 3 pruebas de `shared` y RC-1, RC-2, RC-3 (el orden sigue fijado) |
| A6 | cierres ignorados (`new Set<string>()`) | rojo: RC-13 y RC-18 |
| A7 | `diasHabilesEntre(...) + 1` (cuenta el día de entrada) | rojo: T-1 a T-6 |

Ninguna sobrevive. `git status -s` tras restaurar: sin cambios en código.

## 5. Regla de mutación 4

`wc -l` actual frente a `git show 34e5e85:<f> | wc -l`: `listaRemisionCreada.ts` 17/17, `TicketCard.tsx` 109/109, `TicketList.tsx` 37/37, `TicketTable.tsx` 51/51, `types.ts` 810/810 (edición en sitio, ninguna línea se mueve); `index.ts` 42/41 (+1 al final); `listaRemisionCreada.test.ts` 221/148 (+73 al final). Ningún insertado al principio ni al medio.
Citas `ruta:línea` de los artefactos: **unas 45 distintas leídas una a una** (todas las de código, `openspec/specs/vistas-tablero/spec.md:398-402` y `:810`, y la fila del plan `:87`); **0 fallan**. Sin leer, por heredadas de otras tandas y no afirmaciones de este cambio: `config.yaml:168`, `:2064` y las de `docs/sdd/*` (cobertura parcial, dicho).

## 6. Regla de mutación 3 y regla 13

El cliente no decide nada: `apps/desk/src/components/DistintivoTiempoEnEstado.tsx:3-7` llama a `textoTiempoEnEstado` y pinta; no calcula número ni fecha. Línea del servidor que produce el dato: `apps/desk/server/db/listaRemisionCreada.ts:16`, servida por `apps/desk/server/routes/prioridad.ts:92-93`. El texto es función de `shared` (`tiempoEnEstado.ts:11-15`), probada en T-8. El gris va fijo en la clase (`DistintivoTiempoEnEstado.tsx:7`): no hay rama de color.

## 7. Divergencia de los dos relojes

`tiempoEnEstado.test.ts:61-70` (T-9) los enfrenta sobre el caso del requisito: entrada lunes 2026-03-02 16:00 Bogotá, ahora jueves 09:00: distintivo `3`, `horasHabilesEntre` `20`, `slaVencido` de «Remisión creada» falso. Segundo caso: lunes 08:00 a jueves 08:01 da `3` días y `slaVencido` verdadero. La diferencia queda declarada y probada; la alarma sigue en horas hábiles (`packages/shared/src/sla.ts:34`).

## 8. Contraste de la fila F1B-07 (sostiene `cierra: si`)

Fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:87`): «Prioridad y Mis tickets · + propagar el Top 5 a los tickets abiertos · + lista de Remisión creada para Comercial».

| Punto de la fila | Cambio que lo cubre |
|---|---|
| Prioridad del cliente Top 5, ajuste por ticket, cola del taller, Mis tickets | `prioridad-top5-cliente` (archive-report, «Línea R-1») y `prioridad-tres-niveles` (tres niveles; ajuste también por el Director Técnico) |
| Propagar el Top 5 a los abiertos, con traza y reversión | `propagar-top5-lista-remision-creada` («Qué parte de la fila cubre») |
| Lista de Remisión creada para Comercial (contenido y orden) | `propagar-top5-lista-remision-creada` (RQ-VT-10) |
| Tiempo en la tarjeta de esa lista (E-192) | este cambio |

Construcción sin cubrir: los tres archive-report declaran dejar fuera la calificación del cliente sin contrato ni Top 5 (pregunta 3.b); `prioridad-tres-niveles` dice que la valoración queda «entre corchetes y sin definir». Fuera de eso no queda ningún punto de la fila sin cambio. **NO verificable desde el repositorio:** que esa valoración no sea construcción pendiente. La sostiene `decision/prioridad-clientes-sin-contrato`, que no está versionada (`openspec/config.yaml` → `decision/f1b07-tiempo-en-tarjeta-y-cierre-11-10`, consecuencia (3), lo admite). Hay que fiarse de la palabra de Gerencia.

## 9. E-190 y E-193 contra el código de hoy (`git show HEAD:docs/sdd/ENTRADA.md:1946,1961`)

- **E-190 sigue siendo cierta.** `cambioPorTop5` calcula `prioridadAlNacer(base ?? actual, contratoVigente, top5)` (`packages/shared/src/prioridadPropagada.ts:47`): con Top 5 `Medium` y ticket `High` sin contrato la fórmula da `Medium` (`prioridadMasAlta`, `packages/shared/src/prioridad.ts:26`) y el ticket baja; con contrato vigente sigue en `High` (`packages/shared/src/contratos.ts:66-69`). Los ajustes manuales quedan exentos (`prioridadPropagada.ts:41`).
- **E-193 está desfasada en su descripción.** Dice que la base es la prioridad PEDIDA en el alta. Hoy el alta no lee la pedida: `apps/desk/server/services/ticketService.ts:106` y `:108` pasan la constante `PRIORIDAD_POR_DEFECTO` (`Medium`, `packages/shared/src/prioridad.ts:117`), y `baseAlNacer` la devuelve sin contrato ni Top 5 (`prioridadPropagada.ts:36-38`). `prioridad-tres-niveles` lo cambió el 2026-10-08. La pregunta de fondo (base sin contrato) sigue abierta.

## Hallazgos

**CRITICAL:** ninguno.

**W1 · WARNING · El cierre de la fila descansa en una decisión no versionada.** Punto 8. El `archive-report` debe decir que el `cierra: si` se apoya en la palabra de Gerencia sobre la valoración del cliente, no en una prueba del repositorio.

**W2 · WARNING · E-193 describe hoy algo falso.** Punto 9. No es defecto del código: la bandeja la presenta como aplicada. Quien la responda o la archive debe corregir su «Qué». No se edita aquí.

**W3 · WARNING · Los dos escenarios manuales no tienen cobertura por máquina.** Gris y presencia en tarjeta, lista y tabla. Es decisión de Gerencia (F0-00); no se propone `jsdom`. El `archive-report` los lista como pendientes de una persona.

**S1 · SUGGESTION.** RC-16 (`listaRemisionCreada.test.ts:181`) usa el reloj real con entrada de 2026-01-05 y exige `>= 1`: no caduca, pero no fija el valor; lo fijan RC-13 a RC-15 con reloj inyectado.
**S2 · SUGGESTION.** Las pruebas de integración con PostgreSQL real no se corrieron (sin `TEST_DATABASE_URL`); el cambio no las toca.
**S3 · SUGGESTION.** `DistintivoTiempoEnEstado` no lleva `title`, `DistintivoGarantia` sí. Cosmético, sin requisito.

## Qué quedó probado y qué no

**Probado:** la cuenta `(desde, hasta]`, festivos, cierres sembrados, zona de negocio, `null` sin entrada, texto exacto, el campo sólo en la lista de Remisión creada, una sola lectura de cierres, reloj inyectable, orden intacto y la divergencia con la alarma. Siete mutaciones nuevas caen.
**No probado:** cómo se ve la pantalla (gris, presencia en los tres modos); la decisión `prioridad-clientes-sin-contrato`; la integración con PostgreSQL real; las citas heredadas de otras tandas.
