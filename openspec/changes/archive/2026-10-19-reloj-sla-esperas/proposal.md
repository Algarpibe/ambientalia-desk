---
tanda: F1C-06
motivo: ""
capacidad: [tickets-core]
maestro: ["M1.6", "M1.7", "M1.10", "Anexo B.4"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `reloj-sla-esperas`

## 1. Qué fila atiende

F1C-06, «C7 + C9 esperas que paran el reloj del SLA» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:104`),
abierta por `decision/c7-reloj-sla`.

**`cierra: si`, y en qué se apoya.** La tabla de correcciones del maestro asigna «la parte técnica de C9, en F1A-04
(cerrada)» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4376`); lo que queda de la fila es
el reloj de C7. Esta tanda cubre: la lista propia del reloj, el cálculo de los dos tiempos y su presentación en el cuadro
de mando. Deja fuera lo que §4 enumera. El maestro dice además que C9 está «parcial» (`R08.4.md:2092`) y nombra F1C-06
para la fecha de aviso al cliente (`R08.4.md:2114`); las dos piezas ya están construidas en el árbol (§8, R-1).

**`toca_maestro: si`.** El maestro dice que C7 está decidida y se construye después del corte (`R08.4.md:1020`,
`:2972`, `:2986-2988`, `:6505`); al archivar, queda desactualizado (tarea de persona, §10).

## 2. La letra que manda

- `decision/c7-reloj-sla` (`openspec/config.yaml:1905-1925`; respuesta textual `:1909-1915`): el reloj se para en
  Notificación cliente, Por Entregar, Por Entregar / Sin facturar, En espera de repuestos y Servicio externo; corre en
  Notificación a Compras, Notificación Comercial, En espera de SKU, Solicitado, Liberación Comercial y Remisión creada. La
  lista es propia del reloj y no se deriva de la vista (`:1913`). Pendiente: el reloj corre (`:1914`). «El cuadro de mando
  enseña dos tiempos: el del SLA (sin pausas) y el total que esperó el cliente» (`:1915`).
- M1.6 (`R08.4.md:1766`), tabla de las tres brechas: la misma lista y los dos tiempos, tanda F1C-06 (`R08.4.md:1816-1818`).
- Anexo B.4 (`R08.4.md:4592`): lista propia del reloj (`:4594`), tabla estado → «Se para / Corre», y «A 01/10 […] Pendiente,
  Verificación y Solicitud Soporte sin clasificar como espera; el reloj corre en ellos» (`:4655`).
- M1.7 (`R08.4.md:1825`): una sola función de días hábiles para el reloj (`R08.4.md:1877`, también `:2751`); «La alarma y el
  reloj son independientes» (`R08.4.md:1878`).
- M1.10 (`R08.4.md:2081`): C7 y C9 juntas en F1C-06, pero la lista no se deriva de los bodegajes; Remisión creada corre
  (`R08.4.md:2116-2118`).
- Pendiente: en servicio técnico sale de la rama y de la lista del reloj (`R08.4.md:1626`); en soporte remoto se mantiene
  como soporte en pausa (`R08.4.md:1762`). No contradice c7: en ninguna lista de pausa.

**Nota sobre la consecuencia (4) de c7** (`openspec/config.yaml:1920`): atribuía los dos tiempos a `kpis`. Es lectura de
quien registró la decisión, no de la respuesta de Gerencia (`:1909-1915`), y el encargo del 19/10 los trae a F1C-06, como
el maestro (`R08.4.md:1818`). Se aplica el encargo y se anota aquí; `openspec/config.yaml` no se toca en esta tanda.

## 3. Medición, sobre `db73518`

- **No existe ningún reloj que acumule tiempo ni pausa.** Lo que se llama así son alarmas de permanencia en un estado:
  `SLA_HORAS_POR_ESTADO` (`packages/shared/src/sla.ts:32-35`) y `ALARMAS_SLA` (`:137-141`), medidas desde la última entrada
  (`apps/desk/server/db/sla.ts:40-63`, `entradasActuales` `:78-102`), sólo flujo `servicio` (`:48-49`). El encabezado del
  módulo las titula «EL RELOJ DEL SLA» (`packages/shared/src/sla.ts:5`).
- **`estados.ts` dice hoy lo contrario de c7** en dos comentarios: «El reloj para en los tres bodegajes de M1.10»
  (`packages/shared/src/estados.ts:26-30`) y «El reloj del SLA no la lee — para en los tres bodegajes» (`:117-118`).
  `Pendiente` es `externa` (`:103`): derivar la lista de la vista metería una pausa que c7 no da.
- **El cuadro de mando es Análisis** (supuesto S-4): `<Kpi label="Tiempo prom. servicio" …>`
  (`apps/desk/src/components/Analisis.tsx:98`; `null` se pinta «—», `:19`). Lo calcula `computeAnalisis`
  (`packages/shared/src/analisis.ts:17-95`): cerrados no anulados con fin en el periodo (`:59`), días NATURALES
  creación → fin (`:63`), media a un decimal (`:82`). Filas de `getAnalisisRows` (`apps/desk/server/analisis.ts:11-32`) con
  caché de 5 min (`:34-42`); ruta sólo para superadministrador (`apps/desk/server/routes/analisis.ts:11`). Tipos
  `Analisis` (`packages/shared/src/types.ts:566-580`) y `AnalisisRow` (`:581-592`).
- **Terminales:** `Finalizado` y `Anulado` sólo aparecen como destino en `packages/shared/src/transitions.ts` (p. ej.
  `:242`, `:359`, `:362`, `:396`); ninguna transición sale de ellos.
- **Calendario:** `horasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:174`), jornada de 9 h (`:14`).
- **Historia:** la de la app está en `ticket_transitions` (`apps/desk/server/db/sla.ts:88`); la de Zoho en `ticket_history`
  (`packages/zoho-sync/src/db/history.ts:15`), que `etapasDesdeHistoria` convierte en etapas
  (`packages/shared/src/etapasDesdeHistoria.ts:86-127`). Precedente de juntar las dos épocas: `apps/desk/server/db/equipos.ts:301-304`, `:317-325`.
- ⚠️ **La historia de Zoho se trae una vez:** el barrido sólo pide los tickets sin ninguna fila en `ticket_history`
  (`packages/zoho-sync/src/sync.ts:202-204`, `:218-224`); el otro llamador es la ruta del historial (`:69-70`). Una
  historia puede no llegar al estado actual del ticket.

## 4. Alcance

**Entra:**
1. `packages/shared/src/relojSla.ts` (nuevo): `ESTADOS_QUE_PARAN_EL_RELOJ`, declarada a mano con las cinco de c7;
   `Finalizado` y `Anulado` como terminales; y una función pura que, dada la secuencia de `{ estado, desde }`, un `hasta` y
   los cierres, devuelve `{ slaHoras, totalHoras }` en horas hábiles: el total suma los tramos no terminales; el SLA, el
   total menos los tramos en pausa; el último tramo abierto se cuenta hasta `hasta`. Una prueba impide que el fichero
   importe la clasificación de la vista.
2. Servidor: `getAnalisisRows` arma la secuencia de cada ticket (creación y estado inicial, transiciones de la app y etapas
   de Zoho, juntas y ordenadas) y añade `slaHoras` y `totalHoras` a `AnalisisRow`, `null` sin dato. `computeAnalisis`
   promedia sobre los mismos tickets que `tiempoPromedioDias`, con dato, en días de 9 h a un decimal, y cuenta cuántos
   entraron.
3. Cliente: dos `Kpi` más junto a `Analisis.tsx:98`. Sólo pinta.
4. `estados.ts:26-30` y `:117-118` reescritos en sitio, con el mismo número de líneas.

**No se toca:** las alarmas (`R08.4.md:1878`); el distintivo del tablero; la ficha de cliente; los indicadores y
`computeAnalisis` fuera de lo que añade este cambio (`kpis`, RQ-KP-18); el OTD global, que descontará las esperas de C7
pero es funcionalidad nueva (`R08.4.md:2572`, `:2948`); la fecha de aviso al cliente del bodegaje de salida y el hito
de ingreso a servicio, que ya existen (R-1). Sin migración, sin escritura, sin interruptor.

## 5. Capacidades

- Nuevas: ninguna (sin R-2).
- Modificada: `tickets-core`. Requisitos nuevos AL FINAL de la spec viva, desde RQ-TC-73 (hoy el último es RQ-TC-72,
  `openspec/specs/tickets-core/spec.md:4300`), sin MODIFIED a mitad para no desplazar citas.

## 6. Regla 13 — decisiones del cliente (regla de mutación 3)

| Decisión | Quién la toma | Línea del servidor que la impone |
|---|---|---|
| Qué estados paran el reloj | `packages/shared` (`relojSla.ts`, nuevo), consumido por el servidor | `getAnalisisRows` (a fijar en el lote 2 y citar en el informe) |
| Cuánto vale cada tiempo y si hay dato | El servidor (`computeAnalisis`) | La respuesta de `/api/analisis` (`apps/desk/server/routes/analisis.ts:14`) |
| Quién ve los dos tiempos | El servidor | `requireSuperAdmin` (`apps/desk/server/routes/analisis.ts:11`) |
| «—» cuando no hay dato | El cliente pinta un `null` del servidor | Comodidad: `Analisis.tsx:19` no decide, recibe el `null` |

El cliente no decide nada: pinta dos números del servidor.

## 7. Supuestos reversibles (para la lista semanal)

- **S-1** `Pendiente de facturar` (posterior a c7, sin fuente para el reloj) corre: espera un acto de Comercial.
- **S-2** Los dos tiempos se miden en horas hábiles y se enseñan en días de 9 h, para que el total sea ≥ el SLA y la
  diferencia sean exactamente las pausas.
- **S-3** «Tiempo prom. servicio» se conserva sin cambio, en días naturales; los dos nuevos no son comparables con él.
- **S-4** El cuadro de mando es Análisis, no la ficha de cliente ni el CSV de indicadores.
- **S-5** Si la historia no llega al estado actual del ticket, o no hay ninguna entrada, el ticket queda sin dato y no
  entra en las medias: nunca se inventa un tramo.
- **S-6** `Pendiente` corre, por c7 (`openspec/config.yaml:1914`) y B.4 (`R08.4.md:4655`). Que E-226 la haga espera
  externa es del tablero (`openspec/config.yaml:4951`, `:4958`), no del reloj.
- **S-7** El reloj arranca en la creación del ticket, como el tiempo de servicio de hoy (`packages/shared/src/analisis.ts:63`); el tiempo en
  Remisión creada cuenta porque c7 la hace correr.
- **S-8** El reloj se calcula para todos los flujos que entran en la media de Análisis, con la misma lista.
- **S-9** `cierra: si`: la parte de C9 que el maestro da por abierta ya está construida (R-1).

## 8. Riesgos

- **R-1 · `cierra: si` frente a C9 «parcial» — medido, el maestro va por detrás del código.** `R08.4.md:2114` pide que
  la fecha de aviso al cliente la escriba la transición que habilita la entrega: ya lo hace, obligatoria
  (`packages/shared/src/transitions.ts:259-260`, `habilitado_para_entrega` con `cfDate('Fecha de aviso al cliente')`), y
  la lee el bodegaje de salida (`packages/shared/src/bodegaje.ts:52`, `:75`). `R08.4.md:2092` da por abierto el hito de
  inicio del servicio y del diagnóstico: ya se ancla en la transición `Ingreso a Servicio` y no en la creación
  (`marcaIngresoAServicio`, `packages/shared/src/bodegaje.ts:225-227`). Supuesto S-9: `cierra: si`; si quien decide el
  alcance lee la fila de otro modo, la cabecera pasa a `cierra: no` sin cambiar nada más.
- **R-2 · Volumen.** Análisis pasa a leer `ticket_history` entero; lo amortigua la caché de 5 min
  (`apps/desk/server/analisis.ts:34-42`), pero la primera carga es más lenta. Una consulta fija más, sin N+1.
- **R-3 · Nombres de estado.** Hipótesis: los estados que trae Zoho se escriben igual que los de la app. Uno distinto
  cuenta como «corre». Lo vigila una prueba sobre la lista.
- **R-4 · Historia incompleta.** Hasta medir en producción no se sabe cuántos tickets tendrán dato (§10).
- **R-5 · Dos cosas llamadas «reloj».** `packages/shared/src/sla.ts:5` titula así las alarmas; el módulo nuevo lo dice en
  su cabecera para que nadie las confunda.

## 9. Intentos (techo 800)

| # | Unidad | Estimación |
|---|---|---|
| 1 | planificación 1: esta propuesta y la delta de `tickets-core` | ~330 |
| 2 | planificación 2: diseño y tareas | ~220 |
| 3 | lote 1: `relojSla.ts`, pruebas, `estados.ts` en sitio, exportación | ~450 |
| 4 | lote 2: servidor, `analisis.ts`, tipos, `Analisis.tsx` y pruebas | ~500 |
| 5 | verify (el informe que genera es sumando obligatorio) | ~150-360 |
| 6 | archive: techo 2 × carpeta + 800; revisable < 800 | — |

## 10. Tareas de persona (no se cuentan como tareas; regla del ciclo 1)

| Tarea | Dueño | Destino |
|---|---|---|
| Medir en producción, sólo lectura, cuántos tickets tienen historia que llega a su estado actual | Persona con acceso a producción | Antes del verify en la app |
| Actualizar el maestro: M1.6, Anexo B.4, `R08.4.md:1020` y `R08.4.md:2986-2988` | Supervisión → Gerencia | Expediente siguiente |
| Revisar S-1 a S-9 y R-1 | Gerencia, lista semanal | Una semana |

Archivar no las da por hechas.

## Plan de vuelta atrás

Revertir el commit de fusión: no hay migración, ni escritura, ni dato nuevo; Análisis vuelve a sus cinco cifras.

## Criterios de éxito

La suite de hoy sigue verde; las pruebas nuevas se ponen rojas si `relojSla.ts` importa la lista de la vista, si
`Pendiente` o `Pendiente de facturar` paran, si un tramo en pausa entra en el SLA, si un tramo terminal cuenta, o si un
ticket con historia incompleta recibe dato.
