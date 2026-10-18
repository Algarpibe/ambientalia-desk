---
tanda: F1C-01
motivo: ""
capacidad: [transitions-st, transitions-equipo-nuevo, transitions-soporte-remoto, tickets-core]
maestro: ["M1.10", "Anexo D nº 32", "Anexo D nº 31"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `anulado-con-motivo`

## 1. Qué fila atiende

F1C-01 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:99`): el estado `Anulado` con motivo. Respaldo:
`decision/c2-anulado` (los cinco motivos, el histórico se marca y no se reescribe, las tres métricas excluyen),
`decision/c3-salida-esperas` (desde las dos esperas externas, Comercial), `decision/e223-anulacion-tres-flujos` (los
tres flujos) y `decision/f1c01-area-anulado` (Comercial en todos, registrada en `200a9b5`). `cierra: si`: la fila es
el estado, el motivo y las métricas. El marcado del histórico es tarea de persona (consecuencia 3 de c2) y queda
declarado aparte, como en la regla del ciclo 1. `toca_maestro: si`: el maestro dice 20 estados, 31 transiciones y
35 pasos, y al terminar el código dirá 21, 32 y 40 (movimiento previsto por decisión, `openspec/config.yaml:1376-1381`).

## 2. Medición (antes de proponer), sobre `200a9b5`

**Motivos.** La lista está en el maestro (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2139-2144`)
y en `decision/c2-anulado`. En el código no existe: no hay ninguna aparición de «sin solución técnica», «repuesto no
disponible» ni «caducidad de espera» en `packages/` ni en `apps/`. El informe de salida, que según la decisión usa la
misma lista, tampoco está construido. «Creado por error» y «duplicado» no son motivos: van al borrado (`R08.4.md:2145`).

**Orígenes.** En servicio, el maestro fija las dos esperas externas, que decide Comercial (c3), y remite a «los estados
donde hoy se usa Rechazo» (`R08.4.md:2146`). Son tres: `Notificación Comercial`, `Notificación cliente` y
`Rev./Diagnostico` (`packages/shared/src/transitions.ts:234`, `:236`, `:238`). `Solicitado` y `En espera de SKU
inventario` no se anulan (c3). En los otros dos flujos no hay origen decidido: ver §4, S-2 y S-3.

**Quién.** Comercial, en los tres flujos (`decision/f1c01-area-anulado`). El cargo sigue la regla general de
`decision/c10-permisos-cargo` (`openspec/config.yaml:1927`): `Anulado` no está en su lista corta de excepciones
(`packages/shared/src/cargos.ts:27-35`), así que basta el área.

**Cerrado.** Hoy sólo `Finalizado` es cerrado: lo decide `CLOSED_STATUSES` en `apps/desk/server/transitionExec.ts:5`,
leído en `:39`, y todas las vistas leen `status_type`. Sin tocar esa línea, `Anulado` sería un estado abierto.

**Las tres métricas** (`R08.4.md:2130-2136`) salen de una sola condición, `computeAnalisis`
(`packages/shared/src/analisis.ts:59`): servicios finalizados (`:60`), tiempo promedio de servicio (`:62-65`, `:82`) y
cumplimiento OTD (`:66`, `:83`). Cuentan todo ticket con `statusType === 'Closed'` y `finalizadoAt` en el periodo, sea
cual sea su estado. Un anulado desde la aplicación quedaría fuera **por accidente**, porque la aplicación no escribe
`closed_time` (`packages/zoho-sync/src/db/repo.ts:298`). Un ticket con `fecha_finalizacion_st` o `closed_time` sí
contaría. La exclusión tiene que ser explícita.

**El motivo obligatorio ya tiene molde:** «Liberación sin factura» (F1C-05). El campo se declara en el catálogo
(`transitions.ts:247`); la guarda pura está en `packages/shared/src/liberacionSinFactura.ts:23-37`, y el servidor la
suma al único `422` agregado del escalón C (`apps/desk/server/services/ticketService.ts:134`). Ese `422` corre después
del `403` de área (`:129-130`), que es el orden de F1B-10 (B < C). `buildTransitionPlan` sólo comprueba la presencia
(`transitionExec.ts:76-77`), no las opciones.

**Base de datos.** No hace falta migración. El motivo viaja en `values` y se guarda en `ticket_transitions.values`
(`repo.ts:314-318`) y en `tickets.custom_fields` (`repo.ts:307-310`). `tickets.status` es `text` sin CHECK
(`packages/zoho-sync/src/db/schema.sql:23`). La sincronización no pisa un ticket que la aplicación movió:
`writeTransition` pone `managed_by_app` y `upsertTicket` sale antes (`repo.ts:71`).

**Histórico.** `docs/sdd/Consultas_Recuentos_2026-09-25.sql:14-54` (bloque A) ya cuenta los candidatos Rechazo→Finalizado,
pero sólo da recuentos. El molde de consulta de sólo lectura para producción es un `.sql` en `docs/sdd/` con
`BEGIN TRANSACTION READ ONLY … ROLLBACK` que ejecuta una persona (`docs/sdd/Consultas_Recuentos_2026-09-25.sql:1-11`).

**Lo que cuenta o vigila estados** (detalle en `design.md` D7): `estados.test.ts`, `comentariosVigilados.test.ts`,
`invariantesGrafo.test.ts`, `transitionsSoporteRemoto.test.ts`, `cargos.test.ts`, `permisos.test.ts`,
`transicionesEjecucion.test.ts`, `mapaBlueprint.test.ts` y sus seis artefactos, `fasesBlueprint.ts`,
`cifrasAncladas.test.ts`, que lee `openspec/config.yaml → cifras_ancladas`, y `columns.test.ts`. La reconciliación no
se mueve: la comprobación 5 sólo cuenta esperas `externa`/`interna`
(`apps/desk/server/reconciliacion/comprobaciones.ts:154-165`).

**La cifra anclada de estados es 20, no 21:** `ESTADOS_SERVICIO` cuenta 20 desde F1C-09 (`openspec/config.yaml:1372-1373`).
Con `Anulado` pasa a 21.

## 3. Qué se construye

1. **Motivos** en `packages/shared/src/anulacion.ts` (nuevo), con los cinco de `R08.4.md:2139-2144`. «Otro» exige texto.
2. **Estado `Anulado`**, de clase `ninguna`, cerrado (`CLOSED_STATUSES`) y terminal.
3. **Tres transiciones a `Anulado`**, una por catálogo, de área `Comercial`, con motivo obligatorio de la lista impuesto
   en el servidor en el `422` del escalón C, detrás del `403` de área:
   - servicio, `anulacion`: desde `En Espera de Repuestos`, `Servicio externo`, `Rev./Diagnostico`, `Notificación
     Comercial` y `Notificación cliente`;
   - equipo nuevo, `anulacion_equipo_nuevo`: desde `Ingresado`, `En Proceso`, `Notificado` y `Verificación` (S-2);
   - soporte remoto, `anulacion_soporte`: desde `En Proceso` y `Pendiente` (S-3).
4. **Las tres métricas** de `computeAnalisis` excluyen los anulados (S-5 para la ficha de cliente).
5. **Histórico:** `docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql`, una consulta de sólo lectura que LISTA los
   candidatos por la huella Rechazo→Finalizado para que una persona los confirme. No escribe ninguna marca.
6. **Cifras ancladas** 31/20/35 → 32/21/40 en `openspec/config.yaml → cifras_ancladas` y en `cifrasAncladas.test.ts`, en
   el mismo commit que el código, como hizo F1C-09 (`ad1aaa0`).

## 4. Supuestos reversibles (para la lista semanal)

| # | Supuesto | Cómo se revierte |
|---|---|---|
| S-1 | Los cinco motivos son los mismos en los tres flujos (E-223 deja la adaptación al diseño) | Las `options` del campo de cada transición |
| S-2 | Equipo nuevo se anula desde sus cuatro estados no terminales: `Ingresado`, `En Proceso`, `Notificado` y `Verificación` | El `from` de `anulacion_equipo_nuevo` |
| S-3 | Soporte remoto se anula desde `En Proceso` y `Pendiente`; **no** desde `Solicitud Soporte`, que es el nacimiento sin actividad: lo que se cancela ahí se borra, no se anula (consecuencia 4 de c2, `anexo-36-aviso`), y la spec ya lo prohibía (S-5 de soporte remoto) | El `from` de `anulacion_soporte` |
| S-4 | `En Espera de Repuestos` y `Servicio externo` siguen en `ESTADOS_SIN_SALIDA`: les falta la salida comercial a `Por Facturar`, que es F1C-03; `Anulado` es su salida de emergencia | La lista de `estados.ts:151-160` |
| S-5 | La media de resolución de la ficha de cliente también excluye los anulados: un servicio anulado no se resolvió | La condición de `resolucionPromedioMs` |
| S-6 | El detalle de «Otro» es un campo de texto propio, obligatorio sólo con ese motivo | `erroresAnulacion` |
| S-7 | El anulado sigue contando como creado en Análisis: se creó | La condición de `creados` |
| S-8 | Anular no da el testigo: `areasSiguientes` ignora las transiciones a `Anulado`, así que no cambian los avisos por área, el traspaso ni quién puede reasignar (RQ-PM-27). Sin esto, Comercial recibiría un aviso y ganaría la reasignación en once estados de los tres flujos | La condición de `areasSiguientes` (`transitions.ts:330`) |
| S-9 | La anulación de servicio hereda la casilla «Derivado a», como todas las de servicio (`transitions.ts:297`); las de equipo nuevo y soporte remoto no la llevan | Excluirla en `TRANSICIONES_BASE` |
| S-10 | `rechazo_garantia` (`Notificación a Compras` → `Notificación Comercial`) no se anula: es un rechazo de garantía, no un abandono | Añadir `Notificación a Compras` al `from` de `anulacion` (`packages/shared/src/transitions.ts`) y `rechazo_garantia` a la lista de la consulta de candidatos (`docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql:28`) |

## 5. Partición (el cambio no cabe en un intento de 800)

| Intento | Contenido | Estimación |
|---|---|---|
| 1a | `proposal.md`, `design.md`, `tasks.md` | ~400 |
| 1b | deltas de las cuatro specs | ~550 |
| 2 | lote 1: motivos, estado, transiciones, guarda, cierre, vigilantes, mapa y cifras ancladas | ~600 |
| 3 | lote 2: las tres métricas y la consulta del histórico | ~250 |
| 4 · 5 | verify · archive | — |

## 6. Fuera de alcance

- **Marcar el histórico:** es dato de producción y tarea de persona (consecuencia 3 de c2). Los tickets marcados
  necesitarán dónde guardarse la marca, y eso será migración en otra tanda; hasta entonces no salen de las métricas.
- **La salida a `Por Facturar` de las dos esperas externas, y la caducidad:** F1C-03.
- **El borrado de administrador con «creado por error», «duplicado» y «prueba»:** `anexo-36-aviso`.
- **La tabla de indicadores por ticket** (`apps/desk/server/indicadores.ts:64-74`): no es ninguna de las tres métricas
  del maestro. Se anota para la bandeja: hoy el 54 da «Cumple» a cualquier ticket sin finalizar con promesa
  (`packages/shared/src/indicadores.ts:235-236`), anulado o no.
- **El informe de contrato** (`estadoSubOV`, `packages/shared/src/contratos.ts:140`): un anulado contaría como «en
  curso». Se anota para la bandeja.
