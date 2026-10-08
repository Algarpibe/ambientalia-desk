# Archive · `prioridad-tres-niveles` (F1B-07, `cierra: no`)

**Fecha:** 2026-10-08 · **Rama:** `prioridad-tres-niveles` · **Partida:** `6344b4a` · **Informe escrito por el orquestador**, con cifras
medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-07 cubre, en una línea:** los tres niveles de prioridad (alta con contrato vigente, la del Top 5 que se
fija a mano, media el resto; sin «baja») y el ajuste por ticket también por el Director Técnico. **Deja fuera la valoración del
cliente**, que la misma respuesta deja entre corchetes y sin definir; por eso declara `cierra: no` y F1B-07 sigue en curso.

## Qué decisión construye

`decision/p3b-prioridad-tres-niveles` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), de 2026-10-06. Se construyen los
puntos 1 y 3 de la respuesta. El punto 2 es pendiente, no decisión: no se construyó ninguna regla sobre la valoración.

## Qué quedó construido

- **Lista asignable `High` y `Medium`** (`packages/shared/src/prioridad.ts:13`), impuesta en el `PUT` del cliente, en el `POST` del
  ajuste y en la transición. `Low` deja de ofrecerse; los valores ya guardados no se reescriben (RQ-TC-56).
- **Al nacer:** `High` con contrato vigente, la del Top 5 si el cliente lo es, la más alta de las dos, y `Medium` para el resto
  (`packages/shared/src/prioridad.ts:117`, `apps/desk/server/services/ticketService.ts:106`). La prioridad pedida en el alta ya no interviene.
- **Ajuste de un ticket:** Director Comercial con su área, Director Técnico por cargo, o administrador
  (`puedeAjustarPrioridadTicket`, consumido en `apps/desk/server/routes/prioridad.ts:71`). Escalera `404` < `403` < `422`; se
  levantó el límite «sólo Top 5». La prioridad del cliente sigue siendo sólo del Director Comercial.
- **Transición:** una prioridad pedida fuera de la lista, distinta de la actual, da `422` (`packages/shared/src/prioridad.ts:120`,
  sumada al `422` agregado de `apps/desk/server/services/ticketService.ts:134`). Supuesto S-K.
- **El ajuste manual protege sólo la prioridad** (`apps/desk/server/db/prioridadCliente.ts:93`): pone `prioridad_en_app_at` y no
  escribe `managed_by_app`, `source` ni `modified_time`. Corregido tras el verify, el 2026-10-08; véase «Lo que cambió después del
  verify».
- Sin esquema, sin variables, sin relleno, sin tocar `packages/zoho-sync/src/db/repo.ts`.

Rama contra `6344b4a`, antes de este archivo (`2f3f3d2`): 35 ficheros, +3.290/−146. Código sin pruebas: 11 ficheros, +64/−44.

## Intentos

| # | Unidad | Commits | git | registro |
|---|---|---|---|---|
| — | Planificación (fuera de intento) | `742e365` | 1.926 | — |
| 1 | L1 lista, nacimiento, vigencia | `8574689`, `605b9ab` | 372 | 372 |
| 2 | L2 predicado, ajuste, transición, sincronizador | `e1a4e42`, `aed4aa4` | 384 | 384 |
| 3 | L3 cliente y cierre documental | `bded7e6`, `922eeca`, `14ebc2e` | 320 | 320 |
| 4 | Verify (PASS con avisos) | `e47a3a0` | 253 | 253 |
| 5 | Remediación de W1, W2 y W3 | `f08bed2` | 84 | 84 |
| 6 | Corrección del ajuste manual | `a220757` | 137 | 137 |
| 7 | Delta de `zoho-sync` | `2f3f3d2` | 172 | 172 |

Las cifras de los intentos 1 a 5 son las del registro y del traspaso; las de 6 y 7 las midió quien escribe.

## Lo que cambió después del verify

El veredicto de `verify-report.md` es sobre `e47a3a0`. Después hubo tres cosas, y ninguna pasó por un verify entero:

1. **Remediación (`f08bed2`), sólo pruebas y documentos.** El agente quedó detenido en su cierre. El orquestador repitió sus cinco
   mutaciones una a una y dieron los recuentos que declara su tabla: 2, 3, 14, 1 y 3 pruebas en rojo.
2. **Corrección del ajuste manual (`a220757`), una sentencia de producción.** Hasta `f08bed2` el ajuste ponía `managed_by_app`, que
   hace que el sincronizador no escriba nada de la fila (`packages/zoho-sync/src/db/repo.ts:71`); al levantar el límite «sólo Top 5»
   eso alcanzaba a cualquier ticket ajustado. El origen era un supuesto de tanda (S-6 de `prioridad-top5-cliente`), no una decisión
   registrada. Ahora protege sólo `priority`, con la marca que ya lee `packages/zoho-sync/src/db/repo.ts:78`. Seis mutaciones en rojo
   (tabla de `apply-progress.md`, «Corrección del ajuste manual»).
3. **Delta de `zoho-sync` (`2f3f3d2`).** RQ-ZS-01 decía que el ajuste «SHALL seguir marcando `managed_by_app`»; se corrige con un
   bloque `MODIFIED` de las mismas 165 líneas.

**`modified_time` se quitó del ajuste, y hay que saberlo.** La marca de agua del sincronizador es el máximo de `modified_time` de las
filas con `managed_by_app` falso (`packages/zoho-sync/src/sync.ts:381`). Un ajuste que dejara la fila sin `managed_by_app` y con
`modified_time` puesto al reloj local adelantaría esa marca. Consecuencia: el ajuste ya no marca el ticket como no leído
(`packages/zoho-sync/src/db/repo.ts:139`), tampoco en los tickets que ya eran de la aplicación.

**Un superviviente encontrado al contrastar, y cerrado:** quitar sólo la salida «sin base» de `cambioPorTop5`
(`packages/shared/src/prioridadPropagada.ts:46`) no ponía nada en rojo. Sin esa salida, desmarcar a un cliente con contrato vigente
subiría a `High` tickets que nunca tuvieron traza del Top 5. Lo fija una aserción en `packages/shared/src/prioridadPropagada.test.ts:67`.

## Fusión de los deltas

Por script (`fusiona.mjs`, fuera del repositorio), bloque a bloque, con comprobación de identidad: **15 bloques, 14 `MODIFIED` y
1 `ADDED`**, todos idénticos al delta. El traspaso anunciaba 12 y 1: eran 13 y 1 antes del delta de `zoho-sync`.

| Capacidad | Bloques | Líneas antes → después | git (+/−) |
|---|---|---|---|
| `permissions` | RQ-PM-20, RQ-PM-21, RQ-PM-23 | 853 → 892 | 59 / 20 |
| `tickets-core` | RQ-TC-24, 27, 28, 29, 35, 36, 37, 38 y RQ-TC-56 (nuevo, al final, desde `openspec/specs/tickets-core/spec.md:3309`) | 3.207 → 3.370 | 263 / 100 |
| `transitions-st` | RQ-TS-20, RQ-TS-21 | 2.531 → 2.573 | 57 / 15 |
| `zoho-sync` | RQ-ZS-01 | 1.366 → 1.366 | 5 / 5 |

- **Tres títulos quedan desfasados respecto de su cuerpo**, porque el script exige la cabecera idéntica para casar el bloque:
  RQ-TC-29 («…de un cliente Top 5…», `openspec/specs/tickets-core/spec.md:1205` en `ce4498c`), RQ-TS-21 («…sólo admin o
  `puedeFijarPrioridadTop5`…», `openspec/specs/transitions-st/spec.md:885` en `ce4498c`) y RQ-PM-23 («Un solo predicado…»,
  `openspec/specs/permissions/spec.md:543` en `ce4498c`). El cuerpo de cada uno dice lo construido. Los títulos se corrigieron después, en `main` (caso C).
- No hay capacidad nueva: `zoho-sync` ya estaba en `capabilities` (R-2). La cabecera de la propuesta gana esa cuarta capacidad.

## Citas (regla de mutación 4)

La fusión desplaza `permissions` desde su línea 474, `tickets-core` desde la 856 y `transitions-st` desde la 833; `zoho-sync` no se
mueve. Barrido de citas completas a esas specs con línea igual o posterior, formas cortas incluidas: **96**.

- **51 ya llevaban ancla** de revisión. No se tocan.
- **19 ancladas a `6344b4a`** (caso B: afirman el estado anterior a la fusión, y la línea citada lo dice en esa revisión). Once son
  de los artefactos de este cambio. Ocho están fuera, y van en un commit aparte: dos en
  `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` y seis en seis cambios archivados, una en cada uno (`prioridad-top5-cliente`,
  `ficha-garantia-proveedor`, `ovi-garantia-por-cargo`, `reasignacion-con-motivo`, `ampliacion-contrato` e `indicadores-51-55`).
  Cada una se leyó contra la línea antes de anclarla.
- **2 quedan sin tocar, para Supervisión:** `docs/sdd/ENTRADA.md`, en su línea 2148, cita la 1672 de `tickets-core` y la 1343 de
  `transitions-st` («las 34 transiciones»). Eran correctas sobre `6344b4a` y la fusión las desplaza; les corresponde esa ancla. La
  rama no toca ese fichero.
- **24 ya estaban rotas antes de esta tanda, y no se tocan.** Todas en cambios archivados; apuntan a líneas que fusiones
  anteriores ya habían movido, así que anclarlas a `6344b4a` afirmaría algo falso. Por cambio: `generador-mapa-blueprint` 1,
  `alarmas-horas-habiles` 3, `registro-contrato` 3, `prioridad-top5-cliente` 10, `tres-transiciones-cifra-anclada` 1,
  `verificacion-gas-patron-certificado` 5 y `rechazo-solo-comercial` 1. Piden un barrido propio, cita a cita, con la revisión de
  cada una.
- **Formas abreviadas:** no las captura el barrido. Las de las líneas ancladas heredan el ancla de su cita completa. El detector
  las informa sin bloquear; su recuento sobre el commit de archivo va en el traspaso.
- **Pruebas:** la corrección del ajuste dejó `apps/desk/server/prioridadTop5.test.ts` sin desplazar antes de su línea 462; lo nuevo
  va al final. Las citas a TC29-11 de cambios archivados siguen apuntando a su línea, pero la prueba ya no afirma que el ajuste
  ponga `managed_by_app`: son caso C, superadas por este cambio, y no se tocan.

## Avisos del verify

- **W1, W2 y W3:** cerrados en `f08bed2` y contrastados (arriba).
- **W4, abierto a propósito:** `GET /api/top5` (`apps/desk/server/routes/prioridad.ts:23-25`) sigue listando a un Top 5 guardado con
  `Low`, que ya no impone nada. Sin destino; va como hallazgo en el paquete de despliegue.
- **S1:** aplicada en `design.md` §7.

## Medida de este archivo (regla del archivo)

Parte con carga de revisión, medida con `git diff --shortstat --no-renames` antes de mover la carpeta: fusión de los deltas 524
(384 + 140), anclas de las 19 citas 36 (18 + 18), y este informe. El total está en la línea final de este apartado, escrita después
de medir. La mudanza de la carpeta no tiene carga de revisión.

**Total medido antes de mover: 703** (560 en ficheros ya versionados, 402 + 158, más las 143 líneas de este informe), bajo 800.

## Consecuencia en el avance

Ninguna en el numerador: `cierra: no`. F1B-07 sigue en curso (regla de avance: sólo cuenta lo archivado con `cierra: si`).

## Tareas de personas — archivar NO las da por hechas

| | Quién | Qué | Dónde queda escrito |
|---|---|---|---|
| P-1 | Persona con acceso a producción | Correr la consulta de sólo lectura (tres `SELECT`), no ejecutada | `docs/sdd/Paquete_de_Despliegue_2026-10-08.md`, apartado 2.3 |
| P-2 | Director Comercial | Volver a guardar con `High` o `Medium` cada Top 5 que tuviera `Low` | el mismo paquete |
| P-3 | Gerencia | Responder a S-A … S-K. De más peso: el orden entre Top 5 y «alta» (S-A), qué se hace con los tickets que ya tienen otro valor (S-C), el ajuste que protege sólo la prioridad y los ya ajustados que siguen congelados (S-J), y el `422` nuevo de la transición (S-K) | el mismo paquete, apartado 2.4 |
| P-4 | Gerencia | Definir la valoración del cliente y cómo llega a Desk | punto abierto de F1B-07 |
| P-5 | Gerencia | Pegar en el maestro las correcciones de M1.9.1 | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| P-6 | Comercial y Servicio Técnico | Comprobar en la aplicación tras desplegar | `tasks.md`, «Tareas de personas» |
| — | Supervisión | Numerar las entradas de bandeja propuestas y anclar las dos citas de `docs/sdd/ENTRADA.md` | paquete, apartado 2.5; este informe, «Citas» |
