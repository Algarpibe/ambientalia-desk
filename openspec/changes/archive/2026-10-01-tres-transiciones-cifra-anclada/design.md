# Diseño: tres transiciones menos y la cifra anclada a 31 (F1C-09)

Medido el 2026-10-01 sobre el worktree `tres-transiciones-cifra-anclada`. Toda línea citada es del árbol de
partida; lo que no se ha podido comprobar lleva «hipótesis».

## Enfoque técnico

Cambio de DATOS en el núcleo de dominio, sin tocar el motor: `packages/shared` pierde tres entradas de
`TRANSICIONES_BASE`, `diagnostico_complementario` cambia de origen y `Pendiente` pasa al registro de soporte
remoto. Todo se hace **sustituyendo líneas en su sitio**, nunca insertando ni borrando, en los tres ficheros
más citados (`transitions.ts`, `estados.ts`, `fasesBlueprint.ts`). Los guardianes cambian en el mismo commit;
el mapa se regenera; la cifra anclada gana un guardián que hoy no tiene; la migración de datos queda escrita,
probada en pg-mem y sin ejecutar.

## Decisiones

| # | Opción elegida | Descartada | Por qué |
|---|---|---|---|
| D1 | Cada entrada retirada (2 líneas) se sustituye por **2 líneas de comentario no vacías** que dicen qué se retiró y por qué (E-103/E-106/E-140) | Borrar las líneas | Borrar corre −2/−4/−6 todo lo que hay por debajo de `transitions.ts:206`, incluidas las citas `:244`, `:252-258`, `:366-368`, `:386`, `:393-396`. Una línea vacía tampoco vale: el detector de citas da por rota una cita que cae en línea vacía (`detector.ts`, rama de extremo vacío). Precedente: `transitions.ts:366-368` |
| D2 | `Pendiente` entra en `ESTADOS_SOLO_SOPORTE_REMOTO` **en la misma línea** `estados.ts:182`, como `['Solicitud Soporte', 'Pendiente']`, en ese orden | Sacarlo de `CLASIFICACION_EN_ESPERA` o añadir una línea | `ESTADOS` sigue en 23 porque soporte remoto lo usa (`transitions.ts:393-396`). El orden lo impone `invariantesGrafo.test.ts:235-236`: la diferencia se calcula por inserción en el `Set` recorriendo el catálogo SR (`:389-396`), y `Pendiente` aparece después de `Solicitud Soporte` |
| D3 | `fasesBlueprint.ts:57` se sustituye por un comentario de una línea; `:29`, `:35`, `:39-40` se reescriben en su sitio | Borrar `:57` | La guarda `satisfies Record<EstadoServicio, FaseId>` (`:68`) rechaza la clave sobrante en cuanto `EstadoServicio` excluye `Pendiente`: los dos ficheros cambian juntos. Sustituir conserva `:58-68` |
| D4 | El mapa se regenera con `npm run generar-mapa-blueprint` (`package.json:25`, `tsx scripts/generar-mapa-blueprint.ts`) y se commitea | Editar los `.md` a mano | La anti-desfase (`mapaBlueprint.test.ts:168-177`) compara byte a byte. Los alias se asignan por posición en `ESTADOS_SERVICIO` (`mapaBlueprint.ts:72`) y `Pendiente` es el último (`e21`, `docs/artefactos/blueprint-completo.md:31`): **ningún otro alias se desplaza**, el diff sólo quita líneas de `e21` y mueve una arista a `e15 --> e16` |
| D5 | Nuevo guardián `packages/shared/src/cifrasAncladas.test.ts`: lee `openspec/config.yaml` (mismo molde de ruta que `mapaBlueprint.test.ts:156`) y exige `transiciones` = `TRANSITIONS.length`, `estados` = `ESTADOS_SERVICIO.length` y `pasos_del_mapa` = aristas del diagrama completo | Confiar en `npm run reconcile` | La comprobación 5 sólo lee código para `esperas`; las demás se imprimen «sin lectura de código» (`comprobaciones.ts:343-347`) y no es bloqueante (`:358`). Hoy **ensuciar `maestro: "34"` no pone nada en rojo**: el detector no existe (regla de mutación 2). Supuesto S-6: reversible, no toca la spec `reconciliacion` ni RQ-RC-04 |
| D6 | La migración añade una fila por ticket con `transition_id = 'migracion_f1c09_pendiente'` y `performed_by = 'Migración F1C-09'` | Reescribir el historial; usar una id del catálogo | El escritor real (`repo.ts:314-318`) graba `transition_id`, `transition_name`, extremos, `area`, `performed_by` (el actor) y `values`. Los pasos sin botón ya usan ids fuera de `TRANSITIONS` (`transitions.ts:150-151`). El marcador hace la fila identificable para la reversión |
| D7 | La migración **no toca `status_type` ni `managed_by_app`** | Fijar `status_type='Open'` | El grupo 1 llegó a Pendiente por `writeTransition`, que fija `status_type` con `CLOSED_STATUSES` (`transitionExec.ts:39`): ya es `Open`. No tocarlo hace la reversión exacta |
| D8 | El fixture de la prueba SQL se **deriva de `schema.sql`** (`:20-43`, `:57-61`) calificando las tablas con `desk.` | Escribir DDL a mano en la prueba | pg-mem no ejecuta `SET SCHEMA` (`migrate.ts:124`), así que `migrate()` deja las tablas en `public`. Derivar el DDL hace que una columna mal escrita en el script dé rojo |
| D9 | P5 (`flujoSoporteRemoto.test.ts:73-80`), `flujos.test.ts:186-196` y `transitionsSoporteRemoto.test.ts:61-66` pasan a `diagnostico_complementario`; se añade un caso: las tres ids retiradas → **400 «Transición desconocida»** | Borrar esos casos | `diagnostico_complementario` sale ahora de `En Proceso`, el mismo origen; la guarda de flujo sigue siendo la única que dispara. El 400 lo impone `ticketService.ts:122-123` vía `transicionPorId` (`flujos.ts:74-79`), que busca en los tres catálogos |

Confirmado (S-4): no hay lista del reloj del SLA con `Pendiente`; sólo lo nombra el comentario
`packages/shared/src/sla.ts:15`. R08.4.md:1626 no exige código en esta tanda.

## Texto de sustitución en `transitions.ts` (línea a línea, sin cambio de recuento)

| Línea | Hoy | Después |
|---|---|---|
| `:67` | «en las 35 etapas» | «en las 32 etapas» |
| `:167` | «Transiciones 2–35» | «Transiciones 2–32 … F1C-09 retiró tres» |
| `:206-207` | entrada `marcar_pendiente` | 2 comentarios: retirada por F1C-09 (E-103/E-140), `Pendiente` sólo en soporte remoto; relleno para no desplazar citas |
| `:230-231` | entrada `servicio_externo_pendiente` | 2 comentarios: retirada (E-106/E-140); «Servicio externo» queda como ida y vuelta (`cal_sensores_*`, `retorno_servicio_externo`) |
| `:232-233` | entrada `servicio_externo_notificado` | 2 comentarios: retirada por la misma razón; Notificado conserva tres salidas |
| `:244` | `from: ['Pendiente']` | `from: ['En Proceso']` (E-119) |
| `:269` | «las otras 32» | «las otras 28» |
| `:272` | «en 35 declaraciones» | «en 31 declaraciones» |
| `:289-290` | «las 34 entradas … la 35.ª» | «las 31 entradas … la 32.ª» |
| `:293` | «las 34 copias» | «las 31 copias» |
| `:386` | «`marcar_pendiente` (`:206`)» | caso C: «`marcar_pendiente` (`:206`, retirada por F1C-09)»; `:206` sigue nombrándola |

Los comentarios nuevos **no llevan citas `ruta:línea`**: así no amplían la superficie del barrido. `:3-4` de
`estados.ts` («Hasta F0-04 … 34 transiciones») y `:368` de `transitions.ts` («217 citas») son caso B: se quedan.

`estados.ts`: `:102-104` se reescriben (3 líneas: Pendiente sólo en soporte remoto; su clase sigue sin decidir),
`:182` según D2, `:187` «los 21 de siempre» → «20 desde F1C-09». `mapaBlueprint.ts:63` `e21` → `e20`; `:139`
21/38 → 20/35. `reentrancia.ts:141` «21 nodos» → 20.

## Guardianes y cifras que cambian (mismo commit que el código)

| Ruta:línea | Antes → después |
|---|---|
| `packages/shared/src/invariantesGrafo.test.ts:45`, `:50-53` | 34 / 21 → 31 / 20 |
| `invariantesGrafo.test.ts:117` | «las 34 de TRANSITIONS» → 31 |
| `invariantesGrafo.test.ts:172-174` | 44 (34+6+4) → 41 (31+6+4) |
| `invariantesGrafo.test.ts:237` | `['Solicitud Soporte']` → `['Solicitud Soporte', 'Pendiente']` |
| `invariantesGrafo.test.ts:16-18` | citas ya desfasadas antes de esta tanda (`:288-291`, `:293-300`, `:286`) → caso A: `:295-298`, `:301-307`, `:292-293` |
| `packages/shared/src/estados.test.ts:225-228` | 21 → 20; el filtro excluye también `Pendiente` |
| `estados.test.ts:232-233` | `['Solicitud Soporte']` → `['Solicitud Soporte', 'Pendiente']` (no estaba en `exploration.md` §3) |
| `packages/shared/src/mapaBlueprint.test.ts:46`, `:52` | 38 aristas → 35 |
| `mapaBlueprint.test.ts:65-70` | D-1 quita `'Continuación del proceso'` en lugar de `Pendiente` |
| `mapaBlueprint.test.ts:111` | «21 estados» → 20 |
| `packages/shared/src/fasesBlueprint.test.ts:8`, `:17`, `:20` | 4·12·5 → 4·11·5 |
| `fasesBlueprint.test.ts:28-30` | se invierte: `'Pendiente' in FASE_POR_ESTADO` es `false` |
| `packages/shared/src/reentrancia.test.ts:29`, `:31`, `:54`, `:57` | C2 de nueve a ocho estados; `:83-84` (nueve casos) y el invariante 6 **no cambian**: `diagnostico_complementario` no escribe fecha |
| `packages/shared/src/prioridad.test.ts:92`, `:104-105` | quitar las tres claves; `diagnostico_complementario` se queda |
| `prioridad.test.ts:118-119` | 34 → 31 (`:82` es caso B: «medidos ANTES») |
| `packages/shared/src/cargos.test.ts:112`, `:204-205` | 34 → 31; 1.850 → 1.700 |
| `packages/shared/src/fechasDerivadas.test.ts:82` | «31 restantes» → 28 |
| `packages/shared/src/transitionsSoporteRemoto.test.ts:57-58` | 34+6+4 = 44 → 31+6+4 = 41 |
| `transitionsSoporteRemoto.test.ts:61-63` | D9 |
| `packages/shared/src/flujos.test.ts:189`, `:192-193` | D9 |
| `apps/desk/server/permisos.test.ts:26-27`, `:43`, `:72-81`, `:85-90`, `:338` | 102 = 60/42 → 93 = 54/39 (23×2 + 8×1 = 54) |
| `permisos.test.ts:349-353`, `:371` | 102 = 61/41 → 93 = 55/38 (no estaba en §3) |
| `permisos.test.ts:368` | 816 → 744 |
| `apps/desk/server/cargoPermiso.test.ts:250`, `:266` | 102 (34×3) → 93 (31×3) (`:266` no estaba en §3) |
| `apps/desk/server/transicionesEjecucion.test.ts:165`, `:175-176` | cada caso retirado → una línea de comentario (D1 aplicado a la prueba) |
| `transicionesEjecucion.test.ts:182` | `desde: ['En Proceso']` |
| `transicionesEjecucion.test.ts:106-108`, `:117`, `:132-133`, `:188`, `:238`, `:250`, `:283-285` | 34/36 → 31/33 (`:128-130` es caso B) |
| `apps/desk/server/flujoSoporteRemoto.test.ts:73-76`, `:112` | D9; 44 → 41 |
| `docs/artefactos/blueprint-*.md` | regenerados (D4) |
| `openspec/config.yaml:1360-1370` | `pasos_del_mapa` 38 → 35, `codigo` y `divergencia` actualizados (la de la R08.2 caduca); `transiciones` 34 → 31 |
| `openspec/config.yaml:1371-1375` | `estados` 21 → 20, `codigo` → `ESTADOS_SERVICIO` (S-1) |
| `openspec/config.yaml:1344-1345`, `:1355-1359` | caso B en la narración fechada; se añade una frase: desde F1C-09, `Pendiente` es de soporte remoto |
| `openspec/config.yaml:110` | «34 transiciones y 21 estados» → 31 y 20 |

## Migración — `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`

Cabecera según `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:1-27`. Sin metacomandos de psql.
Grupo 1 = `status = 'Pendiente' AND managed_by_app AND lower(btrim(coalesce(classification,''))) <> 'soporte remoto'`
(hipótesis: no usa `regexp_replace` para no depender de pg-mem; se diferencia de `flujos.ts:32-34` sólo en los
espacios internos repetidos, y el paso 1 lista las clasificaciones distintas para verlo).

```sql
-- 1 · ANTES de desplegar, sólo lectura: tres grupos y clasificaciones vistas.
SELECT CASE WHEN lower(btrim(coalesce(classification,''))) = 'soporte remoto' THEN '3 soporte remoto: no se toca'
            WHEN managed_by_app THEN '1 servicio, gobierna la app: se mueve'
            ELSE '2 servicio, gobierna Zoho: no se mueve (P-1)' END AS grupo, count(*) AS tickets
  FROM desk.tickets WHERE status = 'Pendiente' GROUP BY 1 ORDER BY 1;
SELECT number FROM desk.tickets WHERE status = 'Pendiente' AND NOT managed_by_app
   AND lower(btrim(coalesce(classification,''))) <> 'soporte remoto' ORDER BY number;
-- 2 · TRAS desplegar.
BEGIN;
INSERT INTO desk.ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by, values, comment_id)
SELECT id, 'migracion_f1c09_pendiente', 'Traslado de Pendiente a En Proceso (F1C-09)', 'Pendiente', 'En Proceso',
       'Servicio Técnico', 'Migración F1C-09', '{"decision":"E-140"}'::jsonb, NULL
  FROM desk.tickets WHERE <grupo 1>;
UPDATE desk.tickets SET status = 'En Proceso', modified_time = now(), updated_at = now() WHERE <grupo 1>;
-- recuento posterior: el grupo 1 sale a 0
COMMIT;
-- REVERSIÓN (comentada, prefijo «-- REV »): devuelve a Pendiente los tickets con fila marcador sin
-- transición posterior (id mayor) y borra las filas marcador, en una transacción.
```

El INSERT va **antes** del UPDATE porque los dos filtran por `status = 'Pendiente'`. Idempotente: una segunda
pasada no encuentra filas. Ninguna fila existente de `ticket_transitions` se modifica.

**Prueba** `packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts` (pg-mem, `newDb().public.none`):
fixture de D8 + cinco tickets (servicio app en Pendiente con una traza previa; servicio app con `classification`
NULL; servicio Zoho; SR en Pendiente; control en En Proceso). Casos: (a) desenlace por grupo, una fila marcador
por ticket movido y la traza previa intacta; (b) segunda ejecución sin cambios; (c) reversión (quitando el
prefijo `-- REV `) restaura el estado; (d) estático: toda tabla tras `FROM|INTO|UPDATE|JOIN` va calificada.
Hipótesis: pg-mem acepta `BEGIN`/`COMMIT`, `CASE` y `GROUP BY 1`; si no, la prueba ejecuta por sentencias y
comprueba la transacción por lectura estática (decisión del apply, anotada).

## Plan strict TDD

1. **Rojo**: todas las aserciones nuevas de la tabla anterior, el caso 400 de D9 y `cifrasAncladas.test.ts`. Se
   corre la suite y se anota qué da rojo antes de tocar `transitions.ts`.
2. **Verde**: `transitions.ts` + `estados.ts` + `fasesBlueprint.ts` + comentarios; regenerar el mapa;
   `config.yaml`. `npm test`, `npm run typecheck`, `npm run lint`.
3. **Mutaciones** (cada una se revierte y se anota en `apply-progress.md`):

| Mutación | Debe dar rojo |
|---|---|
| Reponer `marcar_pendiente` en `:206-207` | invariante 2, invariante 1, huérfanas de `transicionesEjecucion`, caso 400 |
| `diagnostico_complementario.from` vuelve a `Pendiente` | invariante 1, `CASOS` contra el grafo |
| Regla 2 · quitar `'Pendiente'` de `estados.ts:182` | `tsc` en `fasesBlueprint.ts:68`, invariante 1, `estados.test.ts` |
| Regla 2 · `config.yaml` con `maestro: "34"`, `"38"` o `"21"` | `cifrasAncladas.test.ts` (hoy no hay nadie) |
| Regla 2 · reponer `e15 --> e21 : Marcar como pendiente [ST]` en `blueprint-completo.md` | anti-desfase |
| Regla 2 · quitar `managed_by_app` del filtro del `.sql`; escribir `UPDATE tickets` sin calificar | casos (a) y (d) |
| Posición en el `.sql` · UPDATE antes del INSERT | caso (a): faltan filas marcador |

Regla de mutación 1 sobre guardas del servidor: **ninguna guarda cambia de sitio**. La posición flujo/estado
(`ticketService.ts:125-126`) la sigue fijando P6 (`flujoSoporteRemoto.test.ts:82-90`); P5 reapuntado sólo activa
la guarda de flujo, así que quitarla da 200 y rojo.

## Barrido de citas al cierre (regla de mutación 4)

Ficheros: `transitions.ts`, `estados.ts`, `fasesBlueprint.ts`, `mapaBlueprint.ts`, `reentrancia.ts`,
`invariantesGrafo.test.ts`, `transicionesEjecucion.test.ts`, `permisos.test.ts`. Como no se mueve ninguna línea,
se espera **cero desplazamientos**; lo que sí hay que leer es el **contenido** de las líneas sustituidas. Pase 1:
`grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` y quedarse con los rangos que tocan las líneas sustituidas
(`transitions.ts` `:67`, `:167`, `:206-207`, `:230-233`, `:244`, `:269`, `:272`, `:289-293`, `:386`; `estados.ts`
`:102-104`, `:182`, `:187`; `fasesBlueprint.ts` `:29`, `:35`, `:39-40`, `:57`). Pase 2: forma abreviada en los
ficheros que ya citan esos módulos (incluidos `openspec/specs/**`, `openspec/config.yaml`, `CLAUDE.md`). Cada
resultado se clasifica A (reapuntar), B (nombrar la revisión de partida) o C (conservar y decir que F1C-09 lo
cerró). Comentarios con «34» fuera de los guardianes (`exploration.md` §3, último párrafo): presente → A;
fechado → B. Citas rotas que no causa esta tanda, fuera de los ficheros que edita: se listan, no se corrigen.

## Lotes y líneas (techo 800, válvula 720; medida: `--shortstat --no-renames` + `wc -l` de lo nuevo)

| Lote | Contenido | Estimación |
|---|---|---|
| A · apply 1 | catálogo, registro, fases, comentarios de los tres ficheros; 15 ficheros de prueba; `cifrasAncladas.test.ts` (~35); mapa regenerado (~15); `config.yaml` (~45); `apply-progress.md` (~120) | ~480 |
| B · apply 2 | script SQL (~90), su prueba (~110), comentarios «34» de caso A (~25), barrido anotado y `apply-progress.md` (~70) | ~295 |

Si el lote A pasa de 720 al medir, se parte: guardianes de `packages/shared` por un lado y `apps/desk/server` +
`config.yaml` por otro — **nunca** el código sin sus guardianes.

## Matriz de amenazas

N/A: no hay enrutado, shell, subprocesos, automatización de VCS ni clasificación de ejecutables. El script SQL no
lo ejecuta ningún código de la aplicación.

## Despliegue

Recuento previo (sólo lectura) → desplegar → migración en el mismo corte → recuento posterior. Lo ejecuta una
persona (tareas fuera del recuento, regla del ciclo 1). Vuelta atrás: revertir el commit y el bloque REVERSIÓN.

## Preguntas abiertas

- [ ] Compatibilidad de pg-mem con el script (hipótesis; la resuelve el rojo del lote B).
- [ ] P-1 (Gerencia): destino de los tickets de servicio en `Pendiente` que gobierna Zoho. No cambia el código.
- [ ] `docs/artefactos/blueprintserviciotecnico.html:765`, `:770-771` siguen pintando las tres retiradas: no lo
  genera ni lo vigila nada; hipótesis de que queda fuera de la fila. Se anota en el `apply-progress` para su destino.
