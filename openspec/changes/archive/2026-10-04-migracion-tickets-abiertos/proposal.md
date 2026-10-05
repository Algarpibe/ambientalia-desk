---
tanda: F1F-01
motivo: ""
capacidad: [zoho-sync, tickets-core]
maestro: ["M1.3"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — Herramienta de migración de los tickets abiertos de Zoho Desk (F1F-01)

## Intención

La fila F1F-01 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:125`) pide pasar los tickets abiertos de
Zoho «a su estado equivalente» antes del corte (`openspec/config.yaml:2166`). Este cambio construye la
**herramienta** que lo hace, con pasada en seco e informe. **No la ejecuta**: lo que toque datos de producción
no lo ejecuta ninguna sesión (`openspec/config.yaml:3810-3811`).

**Por qué `cierra: no`.** Quedan fuera el cotejo de la hoja de Google y la ejecución, que es de una persona.
**Por qué `toca_maestro: no`.** El maestro ya trae las reglas que se construyen
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1412-1415`); si las respuestas a las
preguntas de abajo las cambian, va por el expediente.

## Qué es «migrar» aquí, medido

- Los tickets de Zoho **ya son filas** de `desk.tickets`: la sincronización corre en `apps/desk/server/index.ts:85-93`,
  cada 180000 ms por defecto (`packages/zoho-sync/src/config.ts:88`), y copia el estado tal cual
  (`packages/zoho-sync/src/db/mappers.ts:47`).
- Los 23 estados de la aplicación son los nombres del blueprint (`packages/shared/src/estados.ts:59-106`,
  `packages/shared/src/estados.ts:112`). No se mueven datos entre sistemas: se **normaliza el estado** y se **marca
  la fila** como gobernada por la aplicación.
- La única frontera por fila es `managed_by_app`: con `true`, `upsertTicket` sale sin escribir
  (`packages/zoho-sync/src/db/repo.ts:71`). No existe interruptor que pare la sincronización de tickets.
- No hay copia de pruebas donde ensayar (`openspec/config.yaml:1693-1695`): la pasada en seco es la única red
  además de la copia de la base.

## Alcance

**Dentro**

1. **Núcleo puro en `packages/shared`** (fichero nuevo): tabla estado de Zoho → estado de la aplicación y plan
   por ticket. Consume `ESTADOS`; no lo duplica (regla invariable 13). Reglas: identidad para los 23;
   «Entregado» → «Finalizado» y «Pendiente» de servicio técnico → «En Proceso»
   (`docs/sdd/ENTRADA.md:1349`, `docs/sdd/ENTRADA.md:1385`); «Pendiente» de soporte remoto se conserva; cualquier
   otro estado es **sin equivalencia**.
2. **Ejecutor idempotente** en un fichero nuevo bajo `apps/desk/server/db/`. Por ticket: fila marcador en
   `ticket_transitions` (`packages/zoho-sync/src/db/schema.sql:57-61`) **antes** del `UPDATE`, en la misma
   transacción, con el molde de `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:45-53`. El marcador guarda
   el estado, el `status_type` y el `managed_by_app` previos. **No usa `applyTransition`**
   (`packages/zoho-sync/src/db/repo.ts:322`): no es una transición del blueprint y no debe pasar por sus guardas.
3. **Endpoint de superadministrador** añadido al final de `apps/desk/server/routes/admin.ts`, sin mover líneas
   existentes. **La pasada en seco es el valor por defecto**: sólo escribe con `aplicar=true` explícito. Esto
   **invierte** a los endpoints actuales, donde lo opcional es `dryRun` (`apps/desk/server/routes/admin.ts:84`,
   `apps/desk/server/routes/admin.ts:177`).
4. **Negativa total**: si algún ticket abierto tiene un estado sin equivalencia, `aplicar=true` no escribe
   **nada** y devuelve cuáles son.
5. **Fecha de corte como parámetro obligatorio**, nunca fija en el código: el plan A puede moverla al
   01/02/2027 (`openspec/config.yaml:3613`).
6. **Informe** (igual en seco y al aplicar): por estado de origen y destino; sin equivalencia; ya gobernados por
   la aplicación; nacidos tras el corte; sin remisión de entrada vigente; y el número más alto que se marcaría.
7. **Reversión documentada** a partir del marcador, en un documento de procedimiento bajo `docs/sdd/`, con las
   sentencias calificadas por esquema, como `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:57-65`.

**Fuera, dicho llanamente**

- **El cotejo una a una de la hoja de Google** (`openspec/config.yaml:2605`). La propia decisión dice que no
  está en el contenido de F1F-01 (`openspec/config.yaml:2608`). No consta que la averiguación de quién la rellena
  se haya hecho, y su plazo era anterior al 04/10 (`openspec/config.yaml:3452-3453`). Ningún código lee hojas de
  Google: lo importado es un volcado único (`apps/desk/server/db/remisionesHistoricas.ts:156`).
- Cualquier interruptor que pare la sincronización. Ningún flag nuevo, ninguna tabla nueva, ningún cambio de esquema.
- F1B-16 y F1B-17. El cliente (`apps/desk/src`).
- Ejecutar la herramienta, en seco o no, contra producción.

## Capacidades

**Nuevas:** ninguna.

**Modificadas** (sólo requisitos añadidos; no se prevé modificar ninguno vivo):

- `tickets-core`: **RQ-TC-40** (tabla de equivalencias y estados sin equivalencia) y **RQ-TC-41** (plan por
  ticket: qué es «abierto», fecha de corte, lo que sólo se lista).
- `zoho-sync`: **RQ-ZS-17** (ejecutor: seco por defecto, negativa total, marcador antes del `UPDATE`,
  idempotencia, frontera `managed_by_app`) y **RQ-ZS-18** (reversión por marcador).

## Supuestos razonables y reversibles

| ID | Supuesto | Cómo se revierte |
|---|---|---|
| S-1 | La sincronización sigue corriendo; las filas migradas las protege `managed_by_app = true` | Añadir el interruptor en otro cambio; éste no lo impide |
| S-2 | «Entregado» → «Finalizado» pone además `status_type = 'Closed'` y no toca `closed_time` | Una línea del plan por ticket; el marcador guarda el valor previo |
| S-3 | «Pendiente» de servicio que gobierna Zoho → «En Proceso». Es el supuesto ya escrito en `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/proposal.md:116-121` | Quitar la regla de la tabla: pasa a «sin equivalencia» |
| S-4 | «Abierto» es `status_type` distinto de `Closed`, como la aplicación (`apps/desk/src/lib/boardView.ts:47`); `On Hold` cuenta | Cambiar el predicado del núcleo |
| S-5 | Los tickets creados en Zoho después de la fecha de corte sólo se **listan** | Ampliar el plan; hoy no se tocan |
| S-6 | Los abiertos en «OV asignada» o «Ticket creado» sin remisión de entrada vigente se **cuentan y listan**; quedarán bloqueados en «Habilitar Servicio» (`apps/desk/server/services/ticketService.ts:273-277`). No se crea remisión | Decisión de Gerencia; ver preguntas |
| S-7 | La sincronización completa y reciente antes de marcar es requisito de persona; el informe lo recuerda | Automatizarla en otro cambio |

**Precisión sobre S-3, señalada y no resuelta en silencio.** Soporte remoto se reconoce con
`esClasificacionSoporteRemoto` (`packages/shared/src/flujos.ts:116-119`), que es igualdad normalizada, y **no**
con el `LIKE` del script de F1C-09 (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:17-19`), que es más
tolerante. Reescribir el `LIKE` en el núcleo sería una segunda implementación de la misma noción (regla 13,
molde H5). Reversión: cambiar el predicado. El informe lista las clasificaciones de los «Pendiente».

## Enfoque

Enfoque B de la exploración (`openspec/changes/migracion-tickets-abiertos/exploration.md`). Dos lotes, cada uno
bajo 720 líneas; las pruebas van estimadas a 1,8 veces la primera cuenta:

| Lote | Contenido | Producción | Pruebas | Total |
|---|---|---|---|---|
| 1 | Núcleo puro y sus pruebas | ~110 | ~235 | ~345 |
| 2 | Ejecutor, endpoint, procedimiento con reversión y sus pruebas | ~255 | ~340 | ~595 |

Hipótesis: las cifras son estimación, no medida. Suman ~940, por encima de 800: son dos intentos, no uno.

**Mutaciones que la tanda debe hacer.** Posición (regla de mutación 1): el marcador antes del `UPDATE`, y la
negativa antes de cualquier escritura. Regla de mutación 3: este cambio no añade ninguna decisión de cliente.
Regla de mutación 4: `admin.ts` sólo crece por el final; el barrido del cierre lo comprueba.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Estados de Zoho que sólo producción conoce | Alta | Negativa total y lista en el informe |
| Marcar congela la fila: lo editado en Zoho después no llega | Media | S-7, y ejecutar en el fin de semana del corte |
| Un número de Zoho por encima de 10000 arrastraría la numeración propia, que lee el máximo de las filas gobernadas (`packages/zoho-sync/src/db/migrate.ts:43`, `packages/zoho-sync/src/db/migrate.ts:47`, `packages/zoho-sync/src/db/repo.ts:245`) | Hipótesis: baja | El informe da el número más alto a marcar; la prueba `packages/zoho-sync/src/db/repo.test.ts:84` fija hoy lo contrario |
| pg-mem no reproduce PostgreSQL real | Media | La pasada en seco de la persona es la primera lectura real |

## Reversión

Del código: revertir la rama; no hay esquema ni flag. De los datos: por marcador, sólo donde el marcador siga
siendo la última transición del ticket, restaurando los tres valores previos. La copia previa de la base es
requisito de persona.

## Tareas de personas (fuera del recuento, regla del ciclo 1 — archivar no las da por hechas)

| Tarea | Dueño | Qué desbloquea | Dónde queda escrito |
|---|---|---|---|
| Copia de la base, sincronización completa y pasada en seco sobre producción | Quien administra el despliegue | Saber qué estados no tienen equivalencia | Procedimiento del lote 2 |
| Ejecutar con `aplicar=true` | Quien administra el despliegue, con la fecha que confirme Gerencia | El corte | Procedimiento del lote 2 |
| Averiguar quién rellena la hoja de Google y para qué | Gerencia | El cotejo, y F1B-16 y F1B-17 | `openspec/config.yaml` → `decision/p14b-hoja-google` |
| Cotejo una a una de la hoja de Google | Gerencia designa | Cerrar F1F-01 | La misma decisión |

## Preguntas para la bandeja

1. ¿«Entregado» → «Finalizado» cierra el ticket (`status_type`) y qué fecha de cierre lleva (`closed_time`)? (S-2)
2. ¿Quién lanza la última sincronización completa antes de marcar, y cuándo? (S-7)
3. ¿Qué se hace con los tickets que nazcan en Zoho después del corte? (S-5)
4. ¿Debe apagarse la sincronización de tickets en el corte? Hoy no hay con qué. (S-1)
5. Los estados sin equivalencia que enseñe la pasada en seco: ¿a qué estado va cada uno?
6. Los abiertos sin remisión de entrada vigente: ¿se les crea, o se quedan a la espera? (S-6)

Dueño de las seis: Gerencia. Desbloquean la ejecución, no la construcción.

## Criterios de éxito

- [ ] Sin `aplicar=true` no se escribe ninguna fila, y la prueba lo fija.
- [ ] Con un solo estado sin equivalencia, `aplicar=true` no escribe nada y lo nombra.
- [ ] Una segunda pasada no cambia nada.
- [ ] Marcador y `UPDATE` no se separan; mover uno pone roja una prueba.
- [ ] Tras aplicar, una pasada de la sincronización no altera una fila migrada.
- [ ] La reversión documentada deja las filas como estaban, probada sobre pg-mem.
