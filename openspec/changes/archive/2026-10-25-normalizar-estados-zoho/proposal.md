---
tanda: F1F-01
motivo: ""
capacidad: [zoho-sync, tickets-core]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: normalizar los estados de Zoho al sincronizar y al leer

## Intención

- **Problema.** El ticket #1004 está en «Notificación Comercial», pero el tablero lo pone en «Otros» y no tiene botones. Zoho guarda
  el estado como `Notificación  Comercial` (dos espacios) y la aplicación compara el texto exacto.
- **Causa en el código.** La sincronización copia el valor tal cual (`packages/zoho-sync/src/db/mappers.ts:47` en `f5465799`). El tablero busca la
  columna por clave exacta y cae en `'otros'` (`packages/shared/src/columns.ts:45-47`). Los botones salen de `t.from.includes(ticket.status)`,
  que da una lista vacía (`packages/shared/src/flujos.ts:69-71`). El servidor responde `409` (`apps/desk/server/services/ticketService.ts:126-127`).
- **Por qué ahora.** La migración de abiertos del 12/12 compara por igualdad (`packages/shared/src/migracionTickets.ts:37`). Un solo
  estado con espacios de más da `negativa` (`apps/desk/server/db/migracionTicketsAbiertos.ts:57`) y la migración no escribe nada (`:70`).
- **Decisión que se ejecuta.** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` → `decision/e249-normalizar-al-leer`:
  «E-249: opción A, normalizar al leer y al sincronizar en la misma función de packages/shared, sin escribir datos; #1004 debe quedar bien en cuanto se despliegue.»
- **Origen.** Resuelve la consecuencia (3)(a) de `decision/estados-zoho-espacios`. Esa decisión existe sólo en la copia de trabajo SIN
  COMMITEAR de `openspec/config.yaml` en `main` (`decisiones_de_gerencia_panel`): no se puede verificar desde esta rama. Texto citado
  de esa copia: «Corrección. El ticket #1004 está en «Notificación Comercial» y el tablero lo muestra en «Otros» en vez de en su
  columna. Causa comprobada en Zoho: el estado se llama allí «Notificación Comercial», con dos espacios, y la aplicación compara el
  texto exacto. Consecuencias: cae en «Otros» y no tiene botones de transición. Arreglo: normalizar los espacios de los estados al
  sincronizar desde Zoho (colapsar espacios repetidos y recortar extremos), y una prueba que compruebe que todos los estados de Zoho
  casan con los del blueprint. Revisar si otros estados de Zoho tienen el mismo defecto. Antes del 12/12, porque la migración traerá
  todos los abiertos.» Su entrada, `docs/sdd/ENTRADA.md` → E-249, también está sólo en esa copia.
- **Maestro.** Ninguno: la decisión registra `maestro_pasaje: "ninguno"`.

## Alcance

### Dentro
1. **Una regla en un módulo nuevo de `packages/shared`** (nombre sugerido `normalizarEstado`): recorta los extremos y colapsa los
   espacios internos repetidos. No toca mayúsculas ni tildes. La sincronización la usa en `packages/zoho-sync/src/db/mappers.ts:47`, en la misma línea.
2. **Al leer, sin escribir datos.** Toda lectura de `tickets.status`, TS o SQL, pasa por la regla o se demuestra que no le afecta. En
   SQL la normalización va DENTRO de la consulta: la columna no se reescribe nunca.
3. **Aceptación con el caso de #1004.** Un ticket sembrado en `Notificación  Comercial` cae en su columna y no en «Otros», tiene sus
   botones, la transición se ejecuta y cuenta donde cuenta su gemelo de un solo espacio (esperas, alarmas, indicadores).
4. **Catálogo.** Todo estado de Zoho conocido, normalizado, está en el registro (`packages/shared/src/estados.ts:59-106`, 26 nombres),
   y la regla deja intactos los 26. Fuente: `docs/analisis-tickets/Tickets.csv` (exportación del 08/09, columna «Estado»), con
   `Notificación  Comercial` en las líneas 13 y 21 (`docs/analisis-tickets/Tickets.csv:13`). Que tenga 10 valores distintos es hipótesis del inventario.
5. **Respuesta medida a la (3)(b)**, sin construir nada: ver «La (3)(b), medida».

### Fuera
- Escribir o reparar filas guardadas; igualar mayúsculas o tildes; la configuración de Zoho Desk.
- Los `.tsx` del cliente más allá de lo que arreglan los datos del servidor (pruebas de interfaz excluidas, CLAUDE.md «Pruebas de interfaz»).
- E-090 y el soporte remoto (cambio aparte de F1B-09). El resto de F1F-01: migración de abiertos y fecha de corte.

## Capacidades

- **Nuevas:** ninguna. **Modificadas:** `zoho-sync`, requisito nuevo RQ-ZS-24 (la regla, sus dos formas, dónde se aplica, que no reescribe la
  columna; tablero, transiciones y alarmas son escenarios suyos), y `tickets-core`, RQ-TC-40: la igualdad exacta es sobre el estado ya normalizado.

## Enfoque

- **La regla y sus dos formas (S-1, S-2).** JS: `estado.replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ')`. SQL, generada por el mismo
  módulo: `regexp_replace(btrim(<col>), ' {2,}', ' ', 'g')`. No se reutiliza `normalizar` (`packages/shared/src/flujos.ts:32-34`): pasa a minúsculas y usa `\s+`.
- **Se normaliza en los puntos de paso, no en cada consumidor.** `columnForStatus`, `enEsperaDe`, `transicionesDelTicket` y demás no
  cambian: reciben el valor ya normalizado.
  1. Sincronización: `packages/zoho-sync/src/db/mappers.ts:47`.
  2. Lectores de la fila: `packages/zoho-sync/src/db/repo.ts:119-122` (`getTicketRow`), `:138-140` (`mapTicketRowWithRefs`) y `:192-216` (`getTicketWithRefs`).
     Así la guarda y las reglas de cargo leen el MISMO valor: si sólo normalizara la guarda, `ejecutorDeSalida` recibiría el crudo y no aplicaría su regla (`packages/shared/src/salidasEsperas.ts:49`, `:62`).
  3. Paso al navegador: `rowToTicket` (`packages/zoho-sync/src/db/mappers.ts:200`).
  4. SQL que filtra, compara o selecciona `status` fuera del punto 2; p. ej. `apps/desk/server/db/esperasVencidas.ts:30`, `:37`, `:42` y `apps/desk/server/db/directory.ts:23`.
  5. Historia de Zoho (`packages/shared/src/etapasDesdeHistoria.ts:115-116`): el reloj compara su último paso con el estado del ticket
     (`apps/desk/server/db/relojSla.ts:58`) y, si sólo se normaliza un lado, devuelve `null`.
- **El diseño hace la tabla completa** «lectura → cómo se normaliza → prueba», a partir del inventario de exploración (58 lecturas,
  material de segunda mano que el diseño vuelve a medir).
- **Disciplina de líneas.** `columns.ts`, `estados.ts`, `transitions.ts`, `ticketService.ts`, `mappers.ts`, `repo.ts` y `flujos.ts` se
  editan en sitio, sin insertar ni borrar líneas cuando se pueda. Lo nuevo va en un módulo nuevo o al final del fichero.

## La (3)(b), medida: ninguna escritura hacia Zoho manda el nombre del estado

- `apps/desk/server/superficieSaliente.test.ts:44-67` fija el conjunto exacto de las doce salidas no-GET, cada una etiquetada.
- La única escritura a Zoho Desk es `/sendReply` con `channel`, `contentType`, `content`, `fromEmailAddress` y `to`
  (`apps/desk/server/routes/tickets.ts:203-209`); RQ-ZS-03 lo recoge (`openspec/specs/zoho-sync/spec.md:237`).
- n8n: los avisos mandan `id`, `email`, `nombre`, `asunto`, `texto` y `url` (`apps/desk/server/avisosWebhook.ts:60-67`); la remisión,
  ningún campo de estado (`apps/desk/server/remisionWebhook.ts:5-24`). `apps/desk/server/db/equipos.ts:303`: «Desk no escribe sus transiciones en Zoho».
- El `texto` de un aviso puede nombrar un estado como texto legible (`apps/desk/server/services/alarmasSla.ts:69`,
  `packages/shared/src/plazosEsperas.ts:50`). Va a una persona, no a Zoho, y que salga normalizado es lo correcto.

## Pruebas y mutaciones (`strict_tdd`: rojo antes de verde)

- Unitarias de la regla; prueba del texto SQL; integración contra PostgreSQL real (`*.integration.test.ts`, `TEST_DATABASE_URL`,
  `.github/workflows/ci.yml:10-15`, `:47`) que compara JS y SQL sobre las mismas muestras. Aceptación y catálogo (alcance 3 y 4); en
  los caminos SQL (alarmas, esperas) la aceptación usa variantes con espacios de más de los estados que esas consultas filtran.

| # | Mutación | Se pone rojo |
|---|---|---|
| M1 | La sincronización deja de normalizar | Prueba del mapeador |
| M2 | Una lectura del tablero deja de normalizar | Aceptación: columna y botones |
| M3 | Deja de normalizar el lector que alimenta la guarda (`t.from.includes(current.row.status)`) | Aceptación: `409` en vez de `200` |
| M4 | Una consulta SQL deja de normalizar | Aceptación por el camino SQL |
| M5 | La regla deja de recortar los extremos | Unitaria y catálogo |
| M6 | La regla altera un estado del catálogo (p. ej. minúsculas) | Catálogo |
| M7 | Regla de mutación 2: copia del CSV con un estado ajeno al registro | Catálogo |

Al cerrar, regla de mutación 4 (barrido de citas) sobre cada fichero muy citado que se haya tocado.

## Regla 13: el cliente no decide nada nuevo

- El cliente consume el estado normalizado que manda `rowToTicket` (`packages/zoho-sync/src/db/mappers.ts:200`); columna, botones,
  espera, reasignar y botón de remisión siguen en `packages/shared`, y la guarda sigue en el servidor (`apps/desk/server/services/ticketService.ts:126`).
- Excepción que el diseño tiene que cubrir: `ClienteDetalle` no lee de `rowToTicket`. Su `esEstadoEnEspera(t.status)`
  (`apps/desk/src/components/ClienteDetalle.tsx:36`) recibe el valor de `apps/desk/server/db/directory.ts:26`.
- No está previsto tocar `apps/desk/src`; si el diseño lo toca, se aplica la regla de mutación 3.

## Supuestos reversibles

Modo `auto` (`openspec/config.yaml` → `session_preflight`): sin ronda de preguntas. Estos supuestos entran en la lista semanal de E-237.

- **S-1 · Sólo U+0020.** Así TS y SQL son demostrablemente la misma regla (`btrim` con un argumento recorta sólo espacios). Tabuladores,
  NBSP y otros blancos quedan como están: no hay ninguno en `Tickets.csv` (hipótesis del inventario; la prueba de catálogo lo comprueba).
- **S-2 · «UNA función» = una regla en un módulo.** La función TS y su forma SQL salen del mismo módulo y las fijan entre sí la prueba
  del texto SQL y la integración en CI (en local se salta).
- **S-3 · pg-mem 3.0.14 no tiene `btrim` ni `regexp_replace`** (su `index.js` no los contiene; sí `registerFunction`). El repositorio ya
  lo anota para `TRIM` (`apps/desk/server/db/remisionesHistoricas.ts:37-39`). Las pruebas los registran con `registerFunction`, como
  imitación válida sólo para los patrones que emite el módulo. El diseño decide dónde: arnés central o cada fichero.
- **S-4 · `ticket_transitions` nuevas llevan `from_status` normalizado**, porque la app escribe el valor que leyó
  (`apps/desk/server/services/ticketService.ts:155` → `packages/zoho-sync/src/db/repo.ts:315-317`). Las filas que ya existen no se reescriben.
- **S-5 · La migración de abiertos lee el estado normalizado:** un ticket con dos espacios deja de quedar «sin equivalencia». Lo que
  escriba el 12/12 (`apps/desk/server/db/migracionTicketsAbiertos.ts:74`, `:81`, `:85`) es su escritura planificada, no una reescritura
  por normalizar. Su `estado_previo` queda normalizado, y la reversión restaura ese valor, que para la app es el mismo estado.
- **S-6 · `Tickets.csv` es la fuente de estados conocidos, y no está completa.** La lista completa vive en la configuración de Zoho
  Desk, que no se consulta. En producción la enumera la pasada en seco de la migración, que no ejecuta ninguna sesión.
- **S-7 · Sin índice de expresión.** `idx_tickets_status` (`packages/zoho-sync/src/db/schema.sql:73`) no sirve a la expresión; se acepta
  la lectura secuencial (hipótesis: volumen del orden de las 640 filas de la exportación). Si hace falta, irá en un cambio de DDL posterior.
- **S-8 · La primera sincronización tras desplegar lee una historia de más por ticket afectado** (`packages/zoho-sync/src/sync.ts:308`, `:319`): inocuo, no se corrige.
- **S-9 · El mensaje del `409` y las pantallas enseñan el nombre normalizado.** Es cosmético.

## Para Gerencia

Nada sube: ninguna duda cambia el alcance de la fila, cuesta dinero, toca datos de producción, contradice una decisión registrada o
se queda sin supuesto razonable.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Queda una lectura sin normalizar | Media | Tabla del diseño, M2 y M4, gemelo en la aceptación |
| La imitación de pg-mem diverge de PostgreSQL | Media | La integración en CI compara las dos formas |
| Clave de `alarmas_avisadas` con valor crudo previo (`apps/desk/server/services/alarmasSla.ts:46-47`): un aviso repetido una vez | Baja | Hipótesis: `Tickets.csv` no tiene estados con alarma distorsionados |
| Un estado de Zoho fuera de `Tickets.csv` con otro defecto, no de espacios | Baja | S-6: lo enseña la pasada en seco de la migración |

## Plan de vuelta atrás

Se revierte el commit de fusión. No se ha escrito ningún dato, así que no hay nada que reparar. Las filas sincronizadas entretanto
llevan el nombre del catálogo, y las transiciones con `from_status` normalizado: el código anterior trata bien las dos cosas.

## Dependencias

Ninguna externa; el despliegue lo hace el usuario a mano. `packages/zoho-sync` ya depende de `@ambientalia/shared` (`packages/zoho-sync/src/db/repo.ts:129`).

## Previsión de intentos (techo 800, válvula 720; previsto = bruto × 1,8)

| Intento | Contenido | Bruto | Previsto |
|---|---|---|---|
| 1 | Propuesta y delta de spec | 340 | 612 |
| 2 | Diseño y tareas | 370 | 666 |
| 3 · L1 | Módulo, unitarias, catálogo, la línea de sincronización, lectores y paso al navegador | 230 | 414 |
| 4 · L2 | Lecturas TS del servidor (`directory.ts`, historia de Zoho, resto) y sus pruebas | 190 | 342 |
| 5 · L3 | SQL en sitio, `registerFunction`, prueba del texto SQL e integración | 330 | 594 |
| 6 · L4 | Aceptación, registro de mutaciones y barrido de citas | 220 | 396 |
| 7 | Verify, con su `verify-report.md` | 320 | 576 |
| 8 | Archive: mudanza ≈ 2 × carpeta; revisable (fusión e informe) ≈ 360 | — | techo 2 × carpeta + 800 |

Cada lote se mide con `git diff --shortstat --no-renames` más lo nuevo sin trackear. Si la tabla del diseño lleva L3 por encima de 400
brutas, L3 se parte en dos antes de abrirlo.

## Criterios de éxito

- [ ] Aceptación con `Notificación  Comercial`: columna `notif_comercial` (`packages/shared/src/columns.ts:29`), botones (p. ej.
      `packages/shared/src/transitions.ts:210`), transición `200` y las mismas cifras que su gemelo.
- [ ] Catálogo en verde, con los 26 estados intactos. M1–M7 rojas al mutar y verdes al restaurar.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde; ninguna escritura nueva sobre `tickets.status`; barrido de citas limpio.

## Qué se podrá ver (Aún no construido)

Al desplegar, #1004 aparece en su columna «Notificación Comercial», con sus botones de transición, sin tocar la base de datos.

## Por qué `cierra: no`

F1F-01, «Migración de tickets abiertos y fecha de corte» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:125`), sigue
abierta. Este cambio cubre sólo la normalización de estados que `decision/e249-normalizar-al-leer` asigna a F1F-01.
