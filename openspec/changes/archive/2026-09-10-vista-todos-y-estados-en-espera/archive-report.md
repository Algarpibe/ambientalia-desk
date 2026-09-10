# Archive Report — vista-todos-y-estados-en-espera (Tanda A · F1B-08)

**Archivado**: 2026-09-10. **HEAD de trabajo**: `41311bd`. **Modo**: hybrid (openspec filesystem +
Engram). Observaciones leídas para este cierre: proposal `#430`, spec `#432`, design `#433`, tasks
`#434`, verify-report `#447` — todas recuperadas con `mem_get_observation`, ninguna citada de segunda
mano.

## Qué entregó la tanda

- Capacidad **nueva** `vistas-tablero`: 6 requisitos (RQ-VT-01..06), 13 escenarios, cubre
  `FUNCTIONAL_VIEWS`, `viewLabel`, `applyBoardView` (`apps/desk/src/lib/boardView.ts`).
- Delta **MODIFIED** de `transitions-st`: `RQ-TS-15`, §3.2, §3.6 (IV-1 pasa a CERRADO), §3.7 — el
  conteo de `en_espera` sube de 8 a 9 (`Remisión creada` reclasificada a `interna`, P21 §7.1).
- Cierra IV-1, IV-5 e IV-7; abre IV-9 (los tres supervivientes de la regex `/espera/i` fuera de
  `boardView.ts`). **Estos cierres ya estaban hechos en disco al empezar este archivado** — commit
  `3b7d89c` (verificado en esta sesión, ver «Trabajo ya hecho antes de este archivado» más abajo).

## Las cuatro cifras (reconfirmadas en esta sesión de archivado, no copiadas del verify-report)

| Comando | Resultado |
|---|---|
| `npm test` | **1009 passed / 2 skipped** (1011 total) — idéntico al baseline y a lo que fijó `verify-report` |
| `npm run typecheck` | exit 0, limpio |
| `npm run lint` | **0 errores / 158 avisos** — trinquete respetado |
| `npm run build` | limpio, `dist/` generado |

El archivado es documental (dos ficheros de spec editados, ninguno de código de producción); estas
cifras no debían moverse y no se movieron.

## Task Completion Gate

`tasks.md`: **42/42** `[x]`, sin ninguna casilla `- [ ]` (barrido con `grep -n '- \[ \]'`, cero
resultados). Las 2 tareas de «Fuera de `sdd-apply` → destino `sdd-archive`» (reanclar
`permissions/spec.md`, cerrar IV-1/IV-5/IV-7 y abrir IV-9) están marcadas `[x]` **HECHO**, con nota de
que las ejecutó el orquestador en el commit `3b7d89c`, base `484c952`. Verificado de disco en esta
sesión (ver más abajo): son ciertas.

## Native Review Receipt Gate

RDD está **APAGADO** para este repositorio (memoria del proyecto, `tandas-bajo-ciclo-sdd`). No hay
`reviewGate` que leer: no se ejecutó ningún código de revisión para este candidato. Archivado procede
bajo política ordinaria del repositorio.

## Trabajo ya hecho antes de este archivado — verificado, no asumido

El `verify-report` (obs. `#447`) y las tareas «Fuera de `sdd-apply`» de `tasks.md` afirman que el
orquestador ya ejecutó, en el commit `3b7d89c`, dos piezas que normalmente le tocarían a este
archivado: reanclar `openspec/specs/permissions/spec.md` y cerrar IV-1/IV-5/IV-7 abriendo IV-9 en
`openspec/config.yaml` y `CLAUDE.md`. Verificado de disco en esta sesión, no heredado del encargo:

- `openspec/specs/permissions/spec.md` §4.4 (líneas 267-284): cita `boardView.ts:38-56` (el rango
  real de `applyBoardView` hoy — confirmado por `grep -n "^export function applyBoardView\|^}"`) y
  registra por escrito que IV-1 se cerró en `boardView.ts` pero **se trasladó** a
  `ClienteDetalle.tsx:18`, `:22` y `TicketDetailView.tsx:245` (IV-9). Las tres líneas se comprobaron
  de disco en esta sesión y coinciden exactamente con lo que el fichero afirma.
- `CLAUDE.md` (raíz del repo) ya trae la tabla de «Incumplimientos vivos» reducida a **cuatro** filas
  (sin IV-1/IV-5/IV-7, con IV-9 nueva) y los párrafos de cierre de IV-3/IV-6, con el aviso explícito
  de que la copia inyectada al arrancar la sesión puede estar caducada frente al fichero en disco.

No se ha vuelto a tocar ninguno de los dos ficheros en este archivado porque ya estaban correctos; se
deja constancia aquí para que la traza de qué se hizo dónde no dependa de memoria de sesión.

## Barrido de citas en los dos ficheros fusionados

**47 citas de línea barridas** (25 en el delta de `transitions-st`, 22 en el delta de
`vistas-tablero`), contando toda ocurrencia con patrón `fichero:línea[-línea]`, incluidas las
repetidas, las de doc del maestro/decisiones y las explícitamente históricas («Previamente:», «Qué
era»). **19 estaban caducas, imprecisas o afirmaban un mecanismo que el código no usa; las 19 se
reanclaron o reescribieron al fusionar** (12 en `transitions-st`, 7 en `vistas-tablero`). Las 8 que
señalaba el orquestador están cubiertas — 7 dentro de estos dos ficheros, y la octava
(`boardView.ts:34-52` → `:38-56`, `applyBoardView`) vive en `permissions/spec.md`, ya reanclada por el
commit `3b7d89c` y reverificada aquí. El barrido añadió **12 caducidades/imprecisiones nuevas** que el
verify-report no había señalado.

### Las 8 que señalaba el orquestador

| Cita en la spec | Estado señalado | Real verificado | Reanclada en |
|---|---|---|---|
| `estados.ts:158-162` (`enEsperaDe`) | caduca | `:163-167` | `vistas-tablero` RQ-VT-04 (nota D3) |
| `boardView.ts:44` (filtro `espera`) | caduca | `:48` | `vistas-tablero` RQ-VT-05 |
| `boardView.ts:6-15` (`FUNCTIONAL_VIEWS`) | caduca | `:7-16` | `vistas-tablero` RQ-VT-03 |
| `estados.test.ts:176-185` (derivación da seis) | caduca | `:157-169` | `transitions-st` §3.2 |
| `estados.ts:111` (`ESTADOS_EN_ESPERA`) | caduca | `:114` | `vistas-tablero` RQ-VT-04, `transitions-st` §3.6 |
| `estados.ts:79` (`'Notificado': 'ninguna'`) | caduca | `:83` | `transitions-st` RQ-TS-15 y §3.7 |
| `boardView.ts:34-52` (`applyBoardView`) | caduca | `:38-56` | `permissions/spec.md:270` — **ya reanclada por `3b7d89c` antes de esta sesión**, reverificada |
| dos imprecisas en `transitions-st` §3.2 | imprecisas | ver siguiente tabla | `transitions-st` §3.2 |

### Las 3 imprecisiones de §3.2 (el orquestador señaló 2; el barrido completo encontró una tercera)

| Cita | Apuntaba a | Real (el párrafo vecino) |
|---|---|---|
| `estados.ts:120-124` | comentario de cabecera equivocado por ~3 líneas | `:123-127` («EL DISCRIMINADOR, literal... ocurre FUERA de la aplicación») |
| `estados.ts:132-136` | comentario equivocado por ~4-9 líneas | `:136-141` («SALIDA ÚNICA NO ES PROXY... no intenta derivarlos») |
| `estados.ts:126-130` — **no señalada por el verify-report** | comentario equivocado por ~3 líneas | `:129-134` («POR QUÉ Liberación Comercial y Remisión creada NO ENTRAN...») |

Las tres comparten causa: la inserción del bloque `'Remisión creada': 'interna'` (4 líneas nuevas,
`estados.ts:75-78`) desplazó todo el comentario de `ESTADOS_SIN_SALIDA` hacia abajo de forma uniforme.

### Las 12 caducidades/imprecisiones adicionales encontradas por el barrido completo, no señaladas por el verify-report

| # | Dónde | Qué afirmaba | Qué se corrigió |
|---|---|---|---|
| 1 | `vistas-tablero` RQ-VT-02, escenario «clave desconocida no promete un rótulo poblado» | citaba `boardView.test.ts:56` con la aserción vieja `toBe('Todos los Tickets')`, en presente | real `:90`; hoy afirma `toBe('Vista no reconocida')`, en verde — reescrito a pasado |
| 2 | `vistas-tablero` RQ-VT-04, requisito | «`applyBoardView` SHALL clasificar... con `enEsperaDe(estado)`» | el código nunca llama a `enEsperaDe`; consume `ESTADOS_EN_ESPERA` con `.includes()` (decisión D3) — el WARNING que el encargo pedía reparar aquí |
| 3 | `vistas-tablero` RQ-VT-04, escenario de mutación | «revertir `boardView.ts:35` a `/espera/i`»; citaba el tripwire viejo como si fuera comparable hoy | reanclado a `:39`; el tripwire viejo **ya no existe** (se retiró al cerrar IV-1) — reescrito a evidencia histórica, no repetible tal cual |
| 4 | `transitions-st` §3.2, requisito | `estados.ts:140-149` (declaración de `ESTADOS_SIN_SALIDA`) | real `:145-154` |
| 5 | `transitions-st` §3.6, «Cómo se cerró» | repetía la misma afirmación errónea que #2: «`boardView.ts:35` consume `enEsperaDe`» | reescrito: consume `ESTADOS_EN_ESPERA` vía `.includes()` en `:39`, con la misma nota D3 |
| 6 | `transitions-st` §3.6, «Cómo se cerró» | citaba `estados.test.ts:113-121` en presente, como tripwire vivo | reescrito a pasado: «se retiró»; «ya no existe en el árbol» |
| 7 | `transitions-st` §3.6, escenario | mismo error que #2/#5 en el `WHEN` («`boardView.ts:35` consume `enEsperaDe`») | reescrito igual que #5, reanclado a `:39` |
| 8 | `transitions-st` §3.6, «F0-04 dejó el registro» | `estados.ts:111` | real `:114` |

(Los 4 restantes de los 12 son las 3 imprecisiones de §3.2 más la duplicación de `estados.ts:79` en
RQ-TS-15 y §3.7 — ya contadas arriba en la tabla de los 8 y en la de 3 imprecisiones; se listan aquí
sólo una vez para no inflar el recuento.)

### Citas verificadas y confirmadas exactas, sin cambio

`repo.ts:145-148` (`countClosedTickets`), `tickets.ts:106` (`pageSize=50`), `tickets.test.ts:84`,
`estados.ts:26-33` y `:28` (regla vista/reloj), `sla.test.ts:50-54` (×3 ocurrencias, ya actualizada a
«nueve»/`estados.ts:83` por el commit `3b7d89c`, ver nota abajo), `transitions.ts:178`,
`boardView.test.ts:11`, `:20` (fixture y aserciones ya corregidas), `estados.ts:61`, `TicketCard.tsx:2`
y `:14-23`, `mockData.ts:1-2` y las 8 líneas de valores simulados, `vitest.config.ts:16-20`. Las citas
al maestro (`R08.1.md:1570`) y a `Decisiones_Gerencia_2026-09-10.md:331-337` son contenido heredado sin
cambios de esta tanda; no se reverificaron línea a línea contra esos documentos en esta sesión (regla
de método: quedarían como hipótesis si se afirmara más).

### Hallazgo fuera de alcance de la fusión, no corregido

`apps/desk/src/lib/boardView.test.ts:50` (comentario dentro del propio código de pruebas) sigue
citando `boardView.ts:44` para el filtro de la rama `espera`; la línea real hoy es `:48`. Es un
comentario en código de producción/pruebas, fuera del alcance de este archivado documental («NO
toques código de producción»). Se deja anotado para quien toque ese fichero a continuación.

## Los tres WARNING del verify-report

### 1 · RQ-VT-04 cita un mecanismo que el código no usa

**Reparado al fusionar.** Ver ítem 2/5/7 del barrido arriba: el requisito ahora describe
`.includes()` sobre `ESTADOS_EN_ESPERA` (D3 de `design.md`), no `enEsperaDe`, en los tres sitios donde
la spec original lo afirmaba (RQ-VT-04 y las dos ocurrencias equivalentes en `transitions-st` §3.6).

### 2 · Escenario «el rótulo declara el total real de cerrados» sin detector y no declarado en `tasks.md`

**Decisión, no limbo.** Verificado de disco: `Pagination.tsx:6` pinta `Página {page} de {pages} ·
{total} cerrados` con el `total` que `App.tsx:138` pasa desde la respuesta del servidor
(`countClosedTickets`); ambos ficheros son `.tsx`, fuera de `vitest.config.ts:17-20` por decisión de
Gerencia (F0-00) — no hay `grep` de test que lo cubra (`grep -rn "Pagination" apps/desk/src
--include="*.test.ts"` → vacío). **Es la misma clase de excepción que RQ-VT-06** (verificación manual,
no carencia): no tiene detector automático posible bajo `strict_tdd`, y su ausencia en la tabla «Fuera
del recuento» de `tasks.md` (que sí declara el escenario hermano, fila 5, «sin entrelazar») era el
hueco real que el WARNING señalaba. `tasks.md` queda congelado tal cual se archivó (no se edita
retroactivamente el artefacto de `sdd-apply`); la declaración que faltaba queda hecha aquí y en el
propio `vistas-tablero/spec.md` (RQ-VT-01, nota bajo el escenario). **Dueño: QA / quien despliegue**,
mismo criterio que las otras 5 comprobaciones manuales — ver más abajo.

### 3 · 8 citas caducas + 2 imprecisas (verify-report) → reparadas en la fusión

Ver la sección de barrido arriba: las 8 señaladas están cubiertas, las 2 imprecisas resultaron ser 3,
y el barrido completo (por afirmación, no sólo por cita, según convención de `CLAUDE.md` y los
commits `ce0856c`/`4e0b542`) encontró 12 adicionales.

## Las 5 comprobaciones manuales — NO marcadas como hechas

`tasks.md:309-321` (congelado, no editado en este archivado). Su dueño está fuera del repositorio: las
verifica una persona sobre la app **ya desplegada**. Archivar **no las da por hechas** — regla del
ciclo 1 de `CLAUDE.md`. La tabla queda exactamente como `sdd-apply` la dejó:

| # | Comprobación | Dueño |
|---|---|---|
| 1 | `En Proceso` pinta azul, no `bg-slate-100` | QA / quien despliegue |
| 2 | `Notificación cliente` pinta ámbar | QA / quien despliegue |
| 3 | `En Espera de Repuestos` se lee entero, sin truncar | QA / quien despliegue |
| 4 | Estado sin entrada en el mapa conserva chip neutro con nombre completo | QA / quien despliegue |
| 5 | En «Todos», cerrados después de activos, sin intercalar | QA / quien despliegue |

A esta lista se suma, sin modificar `tasks.md`, la declaración explícita hecha en este archivado (ver
WARNING 2 arriba) de que el escenario «el rótulo declara el total real de cerrados» de RQ-VT-01 es
**también** verificación manual con el mismo dueño — quedaba sin declarar, ahora no.

## Dependencias salientes

### 1 · La media mina de P21 sobre `sla.test.ts`

`packages/shared/src/sla.test.ts:52` exige intersección vacía entre `SLA_HORAS_POR_ESTADO` y
`ESTADOS_EN_ESPERA`. **Estado real verificado en esta sesión, no el que describía el encargo de
archivado**: el fichero **ya fue tocado** por el commit `3b7d89c` (`git blame` confirma
`3b7d89c0 ... 2026-09-10 16:30:12`) para actualizar sólo comentarios y el nombre del `it(...)` de
«ocho»/`estados.ts:79` a «nueve»/`estados.ts:83` — **las aserciones (`toEqual([])`, líneas 52-53) no
cambiaron**, así que sigue siendo la misma prueba funcional, hoy verde porque `SLA_HORAS_POR_ESTADO`
(`sla.ts:32-35`) tiene una sola entrada, `'Notificado'`, clasificada `'ninguna'` (`estados.ts:83`).
Este archivado **no tocó `sla.test.ts`**, cumpliendo la restricción explícita del encargo; el hallazgo
de que ya estaba tocado por otro commit se deja registrado para que no se lea como trabajo de esta
sesión.

La tanda de la alarma de 72 h de P21 (`Decisiones_Gerencia_2026-09-10.md:331-337`) le pondrá reloj a
`'Remisión creada'` y **entonces** `sla.test.ts:52` se pondrá roja **sin que nada esté mal**:
`estados.ts:26-33` (regla escrita en `transitions-st` §3.7) exige que vista y reloj sean
**independientes**, no **disjuntas**, y la prueba afirma la segunda, más fuerte que la primera. Se
reformula **en esa tanda futura**, no aquí — `transitions-st` §3.7 ya deja escrito este riesgo (R-1) en
el spec fusionado. `Decisiones_Gerencia_2026-09-10.md:339-342` anticipa además un **segundo** rojo
distinto, el de la guarda de C11, ajeno a esta tanda.

### 2 · IV-9 — el predicado de esperas sobrevive en tres sitios `.tsx`, sin destino

Abierta por el commit `3b7d89c`. Verificado de disco en esta sesión:

- `apps/desk/src/components/ClienteDetalle.tsx:18` — `const esEspera = (t: TicketLite) =>
  /espera/i.test(t.status)`
- `apps/desk/src/components/ClienteDetalle.tsx:22` — `if (/espera/i.test(t.status)) return
  'bg-amber-50 ...'`
- `apps/desk/src/components/TicketDetailView.tsx:245` — `/espera|hold/i.test(ticket.status)`, tercera
  variante del predicado (no es copia de las otras dos)

Medido: 2 de los 9 estados de `ESTADOS_EN_ESPERA` reconocidos, cero falsos positivos entre los 12
restantes de los 21. Los tres ficheros son `.tsx`, fuera de la red de pruebas (F0-00). **Sin destino
asignado, a propósito** — ya registrado en `openspec/specs/permissions/spec.md` §4.4 y en
`openspec/config.yaml` (`incumplimientos_vivos`, IV-9) por el commit `3b7d89c`.

## Contradicciones entre fuentes — ninguna sin resolver

No se encontró ninguna afirmación del encargo de archivado que contradijera una fuente de rango
superior sin poder resolverse. Los dos casos donde el encargo describía un estado distinto del real
(sla.test.ts ya tocado por `3b7d89c`; las líneas exactas de las 8+2 citas, algunas con offset distinto
al anticipado) se resolvieron verificando de disco, que es la fuente de mayor rango para afirmaciones
sobre código, y se documentan arriba con su verificación.

## Riesgos que quedan abiertos, explícitos

- **R-1** (`sla.test.ts` vs. la alarma de 72 h de P21) — dependencia saliente 1, arriba.
- **IV-9** (predicado de esperas en tres `.tsx`) — dependencia saliente 2, arriba. Sin destino a
  propósito.
- **Hallazgo fuera de alcance** — `boardView.test.ts:50` cita `boardView.ts:44` (real `:48`) en un
  comentario de código de pruebas; no corregido en este archivado documental.
- Las 5 (+1) comprobaciones manuales de QA post-despliegue, sin marcar — regla del ciclo 1.

## Verificación mecánica del archivado

Ver la sección «Verificación mecánica» del resultado devuelto al orquestador para la salida verbatim
de `diff -r` de la copia de `vistas-tablero/spec.md` y del movimiento de la carpeta del cambio a
`openspec/changes/archive/2026-09-10-vista-todos-y-estados-en-espera/`.
