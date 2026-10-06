---
tanda: F1B-03
motivo: ""
capacidad: [permissions, tickets-core, transitions-st, remisiones]
maestro: ["M1.9", "M1.3.7", "Anexo D nº 7"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `ovi-garantia-por-cargo`

Construye `decision/e157-ovi-garantia-por-cargo` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), que
precisa `decision/ovi-garantia-autor`; bandeja: E-157 de `docs/sdd/ENTRADA.md`. El inventario línea a línea de las
guardas de hoy está en `exploration.md` de esta carpeta (§1), leído en el worktree sobre `215310d`.

*Sobre la cabecera:* los tres pasajes de `maestro` son los que nombra la propia decisión (`maestro_pasaje`); en la
R08.4.md se leyeron las líneas que los sostienen
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1941`, `:1949`, `:2661`), pero que
esas líneas pertenezcan a esos apartados es hipótesis: no se remontó cada encabezado. `cierra: no`: quedan los
prefijos (E-094). `toca_maestro: si`: el maestro dice «crear la OVI» y «la crea Servicio Técnico» (`:2661`); el
acto construido es ASOCIAR y basta el cargo.

## 1 · Intención

Hoy cualquier usuario con sesión puede asociar una orden `OVI-` a un ticket por cuatro entradas, y un ticket de
«Garantía» admite una orden de cobro normal. `puedeCrearOVIGarantia` existe, exige un área que la decisión retira
y no la llama nadie (`packages/shared/src/cargos.ts:68-74`). Al terminar: asociar una OVI exige el cargo Director
Técnico o ser administrador, entre por donde entre; un ticket de «Garantía» sólo admite órdenes `OVI-`; y
reconfirmar la orden que el ticket ya tiene no pide nada.

## 2 · Alcance

**Dentro**

1. `puedeCrearOVIGarantia` deja de exigir área: cargo Director Técnico o administrador.
2. Guarda de cargo (`403`, escalón B) en las cuatro entradas: alta, «Habilitar Servicio», «OV adicional» de
   `aprobacion` y `aprobacion_y_repuestos`, y remisión de entrada.
3. Guarda «Garantía exige OVI-» (`422`, escalón C) en las mismas cuatro entradas.
4. Reconocimiento de OVI por prefijo (`OVI-`) en `packages/shared/src/subOV.ts`, una sola implementación.
5. Una prueba de posición por cada par OBSERVABLE (§4) y la prueba explícita de reconfirmación.

**Fuera**

- «Una OVI sólo puede ir en tickets de garantía»: una OVI en un ticket que no es de garantía se admite con el cargo.
- Prefijos del número de ticket (E-094), la excepción de «Equipo nuevo» (E-158), F1B-13.
- Reordenar el alta de remisión (IV-12), `upsertTicket` y el sincronizador.
- `apps/desk/src` (§7). Validar contra Books el número tecleado en una transición (hallazgo, `exploration.md` §6).
- Relleno retroactivo: las OVI ya asociadas antes de este cambio no se revisan.

## 3 · Enfoque

La regla entera vive en `packages/shared`, en un módulo nuevo y puro (nombre de trabajo `ordenOVI.ts`):

- `esOVI(numero)` en `subOV.ts`: «prefijo de OVI» (recortado, sin distinguir mayúsculas, empieza por `OVI-`), no la
  sintaxis completa de `BASE` (decisión del orquestador, `design.md` D1).
- `ordenesQueEntran(recibidas, yaTiene)`: de las órdenes que llegan, las que el ticket NO tiene ya (§5).
- `motivoCargoOVI(entrantes, sujeto)` → texto o `null`; usa `puedeCrearOVIGarantia`.
- `motivoGarantiaSinOVI(tipoServicio, entrantes)` → texto o `null`.

El servidor sólo lee y lanza: un módulo nuevo en `apps/desk/server/services/` lee lo que el ticket ya tiene
(columnas y asociaciones vigentes) y traduce los motivos a `403` y `422`. En los dos ficheros muy citados se
insertan **cero líneas**: cada llamada se añade a una línea que ya es una cadena de guardas (§4). El alta gana un
quinto parámetro con el sujeto; si no llega, se trata como «sin cargo» (falla cerrado).

Textos propuestos (el diseño los fija): `403` «Asociar una orden OVI a un ticket sólo lo hace el cargo Director
Técnico»; `422` «El ticket es de tipo de servicio Garantía y sólo admite una orden OVI-: la orden {n} no lo es».

## 4 · Dónde va cada guarda nueva

La guarda de garantía es escalón **C**: la orden existe, el ticket existe y quien actúa tiene permiso; lo que no
vale es la combinación de dos datos del contenido (tipo de servicio y clase de orden). Es la misma clase que la
discrepancia equipo↔cliente, que `tickets-core` RQ-TC-05 ya clasifica C
(`openspec/specs/tickets-core/spec.md:137`). No es D (no pregunta por otro ticket) ni B (no mira el estado del
flujo ni a la persona).

| Entrada | Guarda | Línea donde se añade | Inmediatamente antes | Inmediatamente después |
|---|---|---|---|---|
| Alta | cargo (B) | final de `apps/desk/server/services/ticketService.ts:44` | «Orden de venta no encontrada», A (`:39`) | equipo↔cliente, C (`:65-78`) |
| Alta | garantía (C) | `ticketService.ts:96`, tras el vencido | contrato vencido, C (`:96`) | NIT y OV ya asociada, D (`:96`, `:99`) |
| Transiciones | cargo (B) | `ticketService.ts:131`, tras el `403` de prioridad | `403` de prioridad, B (`:131`) | verificación `409`, alta validada `422` y remisión vigente `422`, B (`:131`) |
| Transiciones | garantía (C) | dentro del `422` agregado de `ticketService.ts:134` | `403` y demás guardas B (`:131`) | persona derivada, C (`:141`) |
| Remisión | cargo (B) | `apps/desk/server/routes/remision.ts:220`, partiendo su `if` | «Orden de venta no encontrada», A (`:220`) | cuarentena, C (`:220`) |
| Remisión | garantía (C) | `remision.ts:220`, tras el vencido | contrato vencido, C (`:220`) | OV ya asociada, D (`:232`) |

«Habilitar Servicio» y las dos «OV adicional» comparten puerta (`executeTransition`): una sola inserción, y
pruebas por cada transición.

**Remisión — no se reordena nada.** El `if` de `remision.ts:220` reúne hoy existencia (A) y cuarentena (C). Se
PARTE en la misma línea física para intercalar el `403`: A → cargo → cuarentena → vencido → garantía. El orden
relativo de las guardas que ya existen no cambia. Lo que no se puede evitar sin reordenar: el número sólo se
conoce tras leer Books, así que el `403` nuevo corre DETRÁS de la fecha (`:127`, C), la recepción (`:158`, C), la
remisión pendiente (`:177`, D) y el checklist (`:197`, C). Es un **cuarto punto de IV-12** (B después de C y D),
del mismo molde que los tres registrados; se anota, no se corrige.

**Pares que fija cada prueba** (regla de mutación 1):

| Par | Entrada | Caso que activa las dos |
|---|---|---|
| A «Equipo no registrado» < cargo | Alta | equipo inexistente y OVI, sin cargo → `422` del equipo |
| A «OV no encontrada» < cargo | Alta | `ordenVenta: 'OVI-…'` tecleada y `salesOrderId` inexistente → `422` |
| cargo < C equipo↔cliente | Alta | OVI sin cargo y cliente que no es el del equipo → `403` |
| cargo < C obligatorios | Alta | OVI sin cargo y faltan obligatorios → `403` |
| C garantía < D OV ya asociada | Alta, transiciones, remisión | Garantía con una `OV-` ya usada por otro ticket → `422` |
| B estado `409` < cargo | Transiciones | OVI sin cargo desde un estado que no aplica → `409` |
| B área `403` < cargo | Transiciones | Servicio Técnico sin cargo en «Habilitar Servicio» con OVI → `403` de área |
| cargo < B remisión vigente `422` | «Habilitar Servicio» | OVI nueva sin cargo en un ticket sin remisión vigente → `403` |
| cargo < C obligatorios | `aprobacion_y_repuestos` | OVI adicional sin cargo y falta una fecha obligatoria → `403` |
| cargo < D OV ya asociada | Transiciones, remisión | OVI de otro ticket, sin cargo → `403` |
| cargo < C cuarentena | Remisión | OVI con sufijo, sin cargo → `403` |
| D remisión pendiente < cargo | Remisión | remisión pendiente y OVI sin cargo → `409` (caracterización del punto de IV-12) |
| C checklist < cargo | Remisión | ítem fuera del checklist y OVI sin cargo → `422` (caracterización) |

**Pares NO observables, y se dice para que nadie los dé por probados:** (1) cargo frente a garantía, en las cuatro
entradas: la primera salta con una OVI y la segunda con una que no lo es, y cada entrada trae una sola orden;
(2) «OV no encontrada» frente a cargo en la remisión: sin orden no hay número que juzgar; (3) el `403` nuevo
frente a los `403` de cargo y de prioridad de `:131`: ninguna transición con campo de orden los activa
(hipótesis para `liberacion_sin_factura`, cuyos campos no se leyeron).

## 5 · Cómo se decide «ya traía esa orden»

Una orden **entra** cuando su número, recortado, no coincide con ninguna que el ticket ya tenga: la columna
`orden_venta`, o una asociación vigente de `public.ov_asociaciones`. Las dos guardas nuevas miran sólo las que
entran.

| Entrada | Qué llega | Contra qué se compara |
|---|---|---|
| Alta | `salesOrderId` (se resuelve a número) y `ordenVenta` tecleada | nada: el ticket nace, toda orden entra. Se juzgan el número final Y el de la orden resuelta (`ticketService.ts:42`) |
| «Habilitar Servicio» | `values['Orden de Venta']`, sólo número | `orden_venta` y asociaciones vigentes |
| «OV adicional» | `values['OV adicional']`, sólo número | `orden_venta` y asociaciones vigentes |
| Remisión | `salesOrderId` (se resuelve a número) | `orden_venta`, `salesorder_id` y asociaciones vigentes |

Casos límite:

- **Ticket de Zoho que reconfirma su OVI**: no entra, no pide cargo. Es la prueba explícita, con un id sin
  `PREFIJO_TICKET_APP` (`packages/shared/src/transitions.ts:124`).
- **Ticket de Zoho al que se le CAMBIA la OVI por otra OVI**: entra, pide cargo.
- **Ticket de la aplicación que reconfirma su OVI**: no entra (S-3). El panel reenvía siempre la orden que el
  ticket ya trae (`apps/desk/src/components/TransitionPanel.tsx:76-80`); si pidiera cargo, un ticket de garantía
  cuya OVI asoció el Director Técnico no pasaría «Habilitar Servicio», que es de área Comercial.
- **OVI con sufijo** (`OVI-2026-001-01`, cuarentena): cuenta como OVI. Sin cargo, `403`; con cargo, el `422` de
  cuarentena de siempre.
- **Orden liberada**: deja de ser del ticket; volver a asociarla es entrar.
- **Remisión sobre un ticket que ya tiene OTRA orden**: el `UPDATE` no escribe (`remision.ts:241`), pero la orden
  recibida es distinta, así que las guardas actúan igual (falla cerrado; el formulario no manda orden en ese caso,
  `apps/desk/src/components/CrearRemision.tsx:224-225`).

## 6 · Supuestos reversibles

| # | Supuesto | Qué lo invertiría |
|---|---|---|
| S-1 | La guarda de garantía actúa cuando la orden ENTRA: no revisa tickets ya asociados | Que Gerencia pida sanear los tickets de garantía con orden de cobro: sería un barrido de datos, cambio propio |
| S-2 | Un ticket de «Garantía» sin ninguna orden se admite: puede nacer y remisionarse sin ella | Que Gerencia exija la OVI al nacer, o en «Habilitar Servicio» (donde la orden ya es obligatoria, `packages/shared/src/transitions.ts:189`) |
| S-3 | Reconfirmar la orden que el ticket ya tiene no es asociar, venga de Zoho o de la aplicación. No se ramifica por el prefijo del id | Que Gerencia quiera el cargo también al reconfirmar en tickets de la aplicación: se añade la rama por `PREFIJO_TICKET_APP`, y hay que resolver quién ejecuta entonces «Habilitar Servicio» |
| S-4 | El administrador pasa la guarda de cargo sin tener cargo, como en las otras excepciones (`openspec/specs/permissions/spec.md:440-443`) | Una decisión que quite al administrador de las excepciones por cargo |
| S-5 | La guarda de garantía alcanza también a la «OV adicional»: un ticket de garantía no admite una orden de cobro adicional | Que Gerencia admita cobrar aparte lo que la garantía no cubre: la guarda se limita a la orden de entrada |
| S-6 | `esOVI` recorta y reconoce el prefijo `OVI-` sin distinguir mayúsculas, con o sin sufijo. El número es texto libre en dos puertas, y un reconocimiento estricto se esquivaría con minúsculas | Que el diseño prefiera la sensibilidad a mayúsculas del resto del módulo (`packages/shared/src/subOV.ts:16`): la guarda de cargo quedaría esquivable hasta validar el número contra Books |
| S-7 | «Garantía» es el literal exacto de `TIPOS_SERVICIO` (`packages/shared/src/ticketCreate.ts:4`); otro valor de `tipo_servicio`, también uno parecido venido de Zoho, no activa la guarda | Una medición en producción que enseñe variantes del literal: se pliega la comparación |
| S-8 | En la remisión las guardas actúan aunque el `UPDATE` no vaya a escribir | Que se prefiera silencio cuando no hay escritura: se añade la condición de `orden_venta` vacía |
| S-9 | La guarda de garantía va tras cuarentena y vencido: ante dos defectos de contenido se ve antes el del número | Preferencia de Gerencia por el mensaje de garantía: se mueve dentro del escalón C, sin tocar B ni D |
| S-10 | En el alta, un sujeto ausente se trata como «sin cargo» | Nada razonable: es el lado seguro |

## 7 · Cliente

**No se toca `apps/desk/src`.** El cliente no decide nada sobre órdenes OVI: ni las filtra, ni las bloquea, ni
avisa (`exploration.md` §3). No hay espejo que justificar ni guarda de cliente que respaldar, así que no hay
tabla de la regla 13: la única comprobación es la del servidor, y es la que se prueba. Quien no tenga el cargo
verá la OVI en el buscador y recibirá el `403` con su texto (hipótesis: los tres formularios pintan el `error`
del servidor; el panel de transición tiene el estado para ello, `TransitionPanel.tsx:62`). Ocultar las OVI a
quien no tiene el cargo sería comodidad legítima una vez probada la imposición; queda como mejora posterior.

## 8 · Capacidades

**Nuevas:** ninguna.

**Modificadas** (delta en las cuatro):

| Capacidad | Requisito vivo | Qué cambia |
|---|---|---|
| `permissions` | RQ-PM-20 (`openspec/specs/permissions/spec.md:450-457`, escenario de `:469`) | Afirma lo contrario: «sigue sin llamador» y «MUST NOT construir el acto». Pasa a tener llamadores y a no llevar área |
| `permissions` | RQ-PM-21 (`:471-474`) | No se contradice (`exploration.md` §5); se precisa que la OVI es un acto sin área propia y que la guarda sólo añade condición |
| `permissions` | junto a RQ-PM-18 (`:410-415`) | Requisito nuevo: el acto «asociar una OVI», quién pasa y la reconfirmación |
| `tickets-core` | RQ-TC-05 (`openspec/specs/tickets-core/spec.md:126-140`) | La tabla de guardas del alta gana su primera fila B y una fila C |
| `transitions-st` | RQ-TS-06 (`openspec/specs/transitions-st/spec.md:202-222`) | La tabla gana una fila B y la garantía dentro de la fila 6; se añade junto a RQ-TS-14 (`:502`) la reconfirmación |
| `remisiones` | RQ-RE-16 (`openspec/specs/remisiones/spec.md:380-408`) | Las dos guardas dentro del bloque de la orden, y el cuarto punto de IV-12 escrito |

## 9 · Áreas afectadas

| Fichero | Impacto | Código | Pruebas |
|---|---|---|---|
| `packages/shared/src/cargos.ts` | modificado | 8 | — |
| `packages/shared/src/cargos.test.ts` | modificado (`:118-123`, `:185`, `:205`, `:226-229`) | — | 25 |
| `packages/shared/src/subOV.ts` + su prueba | modificado | 6 | 12 |
| `packages/shared/src/ordenOVI.ts` + su prueba, y la exportación | nuevo | 46 | 70 |
| `apps/desk/server/services/` módulo lector + prueba de servidor | nuevo | 35 | 260 |
| `apps/desk/server/services/ticketService.ts` | 6 líneas reescritas en sitio, 0 insertadas | 12 | — |
| `apps/desk/server/routes/tickets.ts` | 1 línea reescrita (`:125`) | 2 | — |
| `apps/desk/server/routes/remision.ts` | 3 líneas reescritas en sitio, 0 insertadas | 6 | — |
| **Suma** | | **115** | **367** |

Código y pruebas: 482 líneas; **× 1,8 = 868**, por encima de 720: **se parte**.

| Lote | Contenido | Estimado | × 1,8 |
|---|---|---|---|
| 1 | `shared`: predicado sin área, `esOVI`, módulo puro y sus pruebas | 167 | 301 |
| 2 | Alta y transiciones: módulo lector, `ticketService.ts`, `tickets.ts`, pruebas (~170) | 219 | 394 |
| 3 | Remisión: `remision.ts` y pruebas (~90) | 96 | 173 |

Los lotes 2 y 3 juntos dan 567 y caben en uno. La prueba «sin llamador» de `cargos.test.ts:226-229` cambia en el
lote 2, que es el que crea el primer llamador. Aparte, cada uno con su fase: deltas de las cuatro specs, ~270
(× 1,8 = 486); `verify-report.md` y `archive-report.md` son sumando propio de sus fases.

## 10 · Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Publicar sin cargos asignados: sólo el administrador asocia OVI | Alta si se olvida | Tarea de persona P-1, condición del paquete de despliegue |
| Tocar líneas de `ticketService.ts` y `remision.ts` | Media | Cero inserciones; el barrido de citas del cierre comprueba igual qué AFIRMA cada cita de `:44`, `:96`, `:131`, `:134` y `:220` |
| El comentario de `CLAUDE.md` sobre la cuarentena que «comparte el `if`» queda inexacto al partirlo | Segura | Se corrige en el cierre, con el alta del cuarto punto de IV-12 |
| Número tecleado no validado contra Books | Existente | S-6 cierra el esquive por mayúsculas; la cura de raíz queda fuera |
| Variantes de «Garantía» en tickets de Zoho | Baja (hipótesis, sin medir) | S-7; medición en producción |

## 11 · Marcha atrás

Revertir los commits del cambio. No hay migración ni dato nuevo: las guardas sólo rechazan, y las asociaciones
hechas mientras estuvo activo siguen siendo válidas. Vaciar `EXCEPCIONES_POR_CARGO.crearOVIGarantia` no basta
(es un cargo, no una lista): la marcha atrás es el `revert`.

## 12 · Tareas de persona — fuera del recuento

No son tareas del `tasks.md`. **Archivar este cambio no las da por hechas.**

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Asignar los cargos de permiso ANTES de publicar: sin ellos sólo pasa el administrador | Gerencia | paquete de despliegue | `decision/e157-ovi-garantia-por-cargo`, consecuencia (5); se repite en el `archive-report.md` |
| P-2 | Confirmar si una OVI sólo puede ir en tickets de garantía | Director Técnico | bandeja, como punto abierto con dueño | `decision/e157-ovi-garantia-por-cargo`, consecuencia (7) |
| P-3 | Recoger en el expediente del maestro que el acto es asociar y que basta el cargo | Gerencia | expediente R08.x | `maestro_revision: "pendiente"` de la decisión |

## 13 · Criterios de éxito

- [ ] Sin cargo y sin ser administrador, una OVI que entra recibe `403` en las cuatro entradas.
- [ ] Director Técnico sin área Servicio Técnico pasa; administrador sin cargo pasa.
- [ ] Reconfirmar la orden del ticket en «Habilitar Servicio» no pide cargo (ticket de Zoho y de la aplicación).
- [ ] Un ticket de «Garantía» rechaza con `422` una orden que no es OVI en las cuatro entradas, y nace sin orden.
- [ ] Cada par observable de §4 tiene una prueba que se pone roja al mover la guarda.
- [ ] `ticketService.ts` y `remision.ts` conservan su número de líneas.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde.
