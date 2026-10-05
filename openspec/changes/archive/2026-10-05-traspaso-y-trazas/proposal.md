---
tanda: F1B-05
motivo: ""
capacidad: [trazas, derivacion-avisos]
maestro: ["M1.9.1", "M1.9.2", "M1.10", "M11.4"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — Traspaso leído como línea y trazas que faltan (F1B-05, sin la mitad de visibilidad)

## Intención

La fila F1B-05 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:85`) reúne roles, traspaso, casilla
comercial y trazas. Gerencia ordenó construirla **sin la mitad de visibilidad**
(`openspec/config.yaml:3800`, `openspec/config.yaml:3804`), que espera a E-089 (`docs/sdd/ENTRADA.md:1246`).
Este cambio hace dos cosas: cierra los huecos de traza que el código tiene hoy y enseña cada traspaso como una
línea propia del historial, sin escribir nada nuevo para ello.

**Por qué `cierra: no`.** Falta la visibilidad por área (`docs/sdd/ENTRADA.md:1251`) y falta la parte del
protocolo de traspaso que el maestro marca como propuesta sin aprobar
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2022`).

**Por qué `toca_maestro: si`.** El maestro da la línea de traspaso por «Propuesto R08.4» y la fila por «sin empezar»
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2060-2062`). Al terminar, esa
situación queda desactualizada. Se entrega como texto la corrección 26 de
`docs/sdd/F0-01_Correcciones_para_el_maestro.md` (la última es la 25,
`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1351`); el `.docx` no se toca.

## Lo que hay hoy, medido

- **Restaurar una remisión borra su anulación sin dejar rastro.** `restaurarRemision` pone a `NULL` las dos
  columnas (`apps/desk/server/db/remisiones.ts:151-153`) y no recibe a nadie; la ruta tiene al usuario pero no lo
  pasa (`apps/desk/server/routes/remision.ts:344`). El historial deriva «Remisión anulada» de esas columnas
  (`apps/desk/server/db/historial.ts:110-119`), así que tras restaurar desaparecen **los dos** hechos: la
  anulación y la restauración. Sólo queda fila de transición si el ticket sigue dentro de la fase temprana
  (`apps/desk/server/db/estadoPorRemision.ts:41`, `apps/desk/server/db/estadoPorRemision.ts:52`).
- **La liberación por borrado de ticket no dice quién.** `liberarAsociacionesDeTicket` no escribe `liberada_por`
  (`packages/zoho-sync/src/db/ovAsociaciones.ts:132-138`), aunque la columna existe
  (`packages/zoho-sync/src/db/schema.sql:549`) y la liberación individual sí la rellena
  (`packages/zoho-sync/src/db/ovAsociaciones.ts:106`). `eliminarTicket` no recibe actor
  (`apps/desk/server/db/eliminarTicket.ts:99-103`); la ruta sólo lo manda al log
  (`apps/desk/server/routes/tickets.ts:88-92`). Las asociaciones sobreviven al borrado: su tabla no está entre las
  que se borran (`apps/desk/server/db/eliminarTicket.ts:45-56`).
- **`performed_by` no es obligatoria en la tabla** (`packages/zoho-sync/src/db/schema.sql:59`). Los cuatro
  escritores de producción la incluyen: `packages/zoho-sync/src/db/repo.ts:255`,
  `packages/zoho-sync/src/db/repo.ts:315`, `packages/zoho-sync/src/db/repo.ts:429` y
  `apps/desk/server/db/migracionTicketsAbiertos.ts:79`. Ninguna prueba vigila que un quinto escritor lo haga.
- **La casilla «Cumple condiciones comerciales» ya está construida y es opcional por decisión**
  (`packages/shared/src/transitions.ts:189`, con su motivo escrito: `packages/shared/src/transitions.ts:183-185`;
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1828`). Lo fija
  `apps/desk/server/transitionExec.test.ts:101-111`. No hay nada que construir.
- **El traspaso está guardado pero no se lee como traspaso.** Cada transición guarda quién la ejecutó y a quién
  deriva (`packages/zoho-sync/src/db/repo.ts:315`, `packages/shared/src/transitions.ts:94`); el historial lo
  enseña como un campo más de la transición (`apps/desk/server/db/historial.ts:137`). El maestro pide lo contrario:
  origen, destino, fecha y hora en una línea
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2029-2033`,
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3490`).

## Alcance

**Dentro — lote 1 · trazas y casilla**

1. Restaurar una remisión guarda quién y cuándo, y conserva quién y cuándo la había anulado. Columnas nuevas en
   `public.remisiones`, calificadas con esquema y **al final** de `packages/zoho-sync/src/db/schema.sql` (el
   precedente de añadir al final está escrito en `packages/zoho-sync/src/db/schema.sql:538`). Sin
   relleno de filas existentes.
2. El historial enseña «Remisión restaurada» y, con ella, la anulación que la precedió.
3. `liberarAsociacionesDeTicket` recibe y escribe el actor; `eliminarTicket` lo recibe de la ruta.
4. Prueba de barrido: todo `INSERT INTO ticket_transitions` de producción nombra `performed_by`. Sin `NOT NULL`
   y sin tocar filas.
5. Prueba de fijación de la casilla comercial sólo si al medir falta algo sobre lo ya fijado.

**Dentro — lote 2 · traspaso**

6. Línea de traspaso en el historial, **compuesta al leer** desde `ticket_transitions`: origen (`performed_by`),
   destino (la persona de `values.derivado_a`; si no hay, el área del estado de llegada), fecha y hora. Sin
   tabla, sin columna y sin escritura nuevas, como manda `openspec/specs/trazas/spec.md:149` en `540f31c`.
7. El destino por área sale del **mismo** cálculo que usa el aviso (`apps/desk/server/services/avisoArea.ts:15`),
   no de una segunda tabla de áreas (regla invariable 13, molde H5).
8. La fila de creación y el marcador de la migración (`packages/shared/src/migracionTickets.ts:14-16`) **no**
   producen línea de traspaso. El marcador se reconoce por su identificador, no por el destino vacío: dos de sus
   reglas sí llevan destino (`docs/sdd/ENTRADA.md:2092`).

**Fuera, con dueño (R-3)**

| Qué | Por qué queda fuera | Dueño |
|---|---|---|
| Visibilidad por área | E-089 sin respuesta | Gerencia |
| Reasignación con motivo sin cambiar de estado (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2035`) | Propuesta sin aprobar; roza «persona a cargo» | Gerencia |
| Restricción por propietario del registro (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2037`) | Aplazada por el propio maestro | Gerencia |
| Aviso personal adicional | El aviso a la persona derivada ya existe (`apps/desk/server/services/ticketService.ts:169-185`); hipótesis: el maestro no dice qué más pide | Gerencia |
| Cómo se identifica el actor que no es una persona | Ver «Punto abierto» | Gerencia |
| Etiquetas del marcador, hoja de vida y reloj de alarma (E-215, E-216, E-217) | Decisiones pendientes; este cambio no las resuelve ni las empeora | Gerencia |
| El relato de conversaciones (`apps/desk/server/db/conversacion.ts:140`) | Sólo se toca el historial | Sin destino |

**Excepciones de traza declaradas, no absorbidas.** Tienen registro propio y no entran en el historial del ticket:
ajustes de prioridad y Top 5 (`prioridad_ajustes`), asociaciones de orden de venta (`ov_asociaciones`) y cambios
del equipo (`equipos_cambios`). Sin registro por evento y fuera de este cambio: la resolución del ticket (guarda
sólo la última; hipótesis, no releída), los rellenos de datos, la sincronización de Zoho y el borrado de
administrador, que sigue sin fila y con dueño Gerencia (`openspec/config.yaml:2406`). Rellenar `liberada_por`
**no** es el registro de borrados que pide esa decisión.

## Capacidades

**Nuevas:** ninguna.

**Modificadas**

- `trazas`: RQ-TZ-06 gana la restauración entre los eventos de remisión; RQ-TZ-01 gana el barrido de escritores;
  requisitos nuevos desde **RQ-TZ-14** (restauración con rastro, liberación con actor, línea de traspaso derivada
  y sus exclusiones). §3.1 (`openspec/specs/trazas/spec.md:373` en `540f31c`) se actualiza: sigue a decidir.
- `derivacion-avisos`: requisito nuevo **RQ-AV-18** — el destino del traspaso y el del aviso salen de la misma
  derivación y del mismo cálculo de área.

Nota para la fase de especificación: hipótesis, la capacidad `remisiones` puede describir la restauración; si su
requisito cambia, se añade a `capacidad`.

## Decisiones del cliente en esta zona (regla invariable 13, regla de mutación 3)

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Con quién abre «Derivado a» (`apps/desk/src/lib/personas.ts:58-82`, sobre `packages/shared/src/transitions.ts:274-282`) | **Ninguna.** Es una propuesta, no una guarda: el servidor sólo comprueba que la persona existe y está activa (`apps/desk/server/services/ticketService.ts:138-142`). Se declara y no se cambia |
| Qué personas ofrece el desplegable (`apps/desk/src/lib/personas.ts:18-30`) | `apps/desk/server/services/ticketService.ts:138-142` |
| La casilla comercial no es obligatoria | Catálogo compartido (`packages/shared/src/transitions.ts:189`), probado en `apps/desk/server/transitionExec.test.ts:101-111` |
| Anular y restaurar sólo para administradores | `apps/desk/server/routes/remision.ts:329`, `apps/desk/server/routes/remision.ts:341` |

Este cambio **no añade** decisiones de cliente y **no toca ningún `.tsx`**: la forma del evento no cambia
(`packages/shared/src/types.ts:611`) y `grep eventName apps/desk/src` da cero, así que el panel pinta los eventos
nuevos sin distinguirlos. Hipótesis: el panel no se ha leído; se comprueba en la aplicación.

## Supuestos aplicados (razonables y reversibles)

| ID | Supuesto | Cómo se revierte |
|---|---|---|
| S-1 | Del protocolo de traspaso se construye sólo la **presentación derivada**. No se aprueba el protocolo por construirla | Quitar el evento del compositor: no deja datos |
| S-2 | La restauración guarda el **último** ciclo anular→restaurar, en columnas. Un segundo ciclo pisa el primero | Tabla de eventos en otro cambio |
| S-3 | Sin relleno: las restauraciones anteriores siguen sin rastro | Decisión de persona; toca producción |
| S-4 | Hay línea de traspaso por cada transición de la aplicación con destino resoluble, aunque la persona no cambie | Filtrar en el compositor |
| S-5 | Un id de persona que no resuelve se enseña crudo, como ya hace el historial (`apps/desk/server/db/ticketFuentes.ts:105`) | — |
| S-6 | El barrido comprueba que la columna se **nombra**, no que el valor no sea nulo en ejecución | Añadir `NOT NULL` cuando Gerencia autorice tocar producción |

## Punto abierto — el actor que no es una persona

No se cambia lo que se escribe (`apps/desk/server/routes/remision.ts:374`, `apps/desk/server/transitionActor.ts:3`,
`apps/desk/server/services/ticketService.ts:153`). **Tampoco se marca al leer:** el respaldo es un texto
configurable por entorno y se compararía por nombre, así que una persona que se llame igual quedaría marcada y un
valor antiguo distinto no. No hay supuesto limpio, y el maestro lo deja por decidir
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2083-2085`). Va a la bandeja como
E-219, dueño Gerencia; desbloquea distinguir persona de proceso en el historial.

## Enfoque

Enfoque A de la exploración: mínimo y derivado al leer. Dos lotes, uno por intento, cada uno bajo 800 líneas.

| Lote | Contenido | Estimación (hipótesis) |
|---|---|---|
| 1 | Trazas, barrido de escritores, casilla, cabecera del registro | 350-450 |
| 2 | Línea de traspaso, exclusiones, corrección 26, bandeja | 350-450 |

**Mutaciones que la tanda debe hacer**

- **Fichero vigilado (regla 2):** una copia sintética con un `INSERT INTO ticket_transitions` sin `performed_by`
  pone rojo el barrido; retocar el barrido no cuenta.
- **Posición (regla 1):** en la restauración, guardar la anulación previa **antes** de vaciarla; invertido, una
  prueba se pone roja.
- **Condición:** quitar la exclusión del marcador hace aparecer una línea de traspaso de más y una prueba lo caza.
- **Regla 4:** `schema.sql` crece sólo por el final. Ficheros muy citados que se tocan y se barren al cerrar:
  `apps/desk/server/db/historial.ts`, `apps/desk/server/db/remisiones.ts`,
  `apps/desk/server/routes/remision.ts`, `packages/zoho-sync/src/db/ovAsociaciones.ts`,
  `apps/desk/server/db/eliminarTicket.ts` y `openspec/specs/trazas/spec.md`. En todos se prefiere añadir al final
  o en sitio sin mover líneas.

## Tareas que no se deben olvidar

- `apps/desk/server/reconciliacion/registro.test.ts:218` cuenta NUEVE tandas en curso y las enumera
  (`apps/desk/server/reconciliacion/registro.test.ts:220`). Esta cabecera las lleva a **DIEZ**, con F1B-05. La
  prueba queda roja desde que existe este fichero: es la primera tarea del lote 1.
- `apps/desk/server/migracionMarcadorLectores.test.ts:62-71` sigue verde sin editarse.
- Bandeja: E-219 (actor no persona), E-220 (protocolo sin aprobar: reasignación, aviso personal, propietario) y
  E-221 (excepciones de traza y límite de S-2). Las tres con dueño Gerencia.
- Corrección 26 del maestro y línea de cobertura en el `archive-report.md` (R-1).

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| El panel pinta mal un evento nuevo | Baja | Verificación en la aplicación; no hay prueba de `.tsx` por decisión |
| Línea de traspaso por cada transición resulta ruido | Media | S-4, reversible en una línea |
| Columnas nuevas sin relleno se leen como «nunca se restauró» | Media | S-3 y E-221 lo dejan escrito |
| El barrido da confianza de más | Media | S-6: dice qué comprueba y qué no |

## Reversión

Revertir la rama. Las columnas nuevas son anulables y quedan sin uso; no se borra ni se rellena ningún dato. La
línea de traspaso no deja nada escrito.

## Tareas de personas (fuera del recuento, regla del ciclo 1 — archivar no las da por hechas)

| Tarea | Dueño | Qué desbloquea | Dónde queda escrito |
|---|---|---|---|
| Responder E-089 | Gerencia | Cerrar F1B-05 | `docs/sdd/ENTRADA.md` |
| Aprobar o no el protocolo de traspaso | Gerencia | Reasignación, propietario | E-220 |
| Decidir cómo se identifica el actor no persona | Gerencia | Marcarlo en el historial | E-219 |
| Pegar la corrección 26 en el maestro | Gerencia | Maestro al día | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| Comprobar el historial en la aplicación | Analista | Fusionar la rama | Parte del corte |

## Criterios de aceptación

1. Tras anular y restaurar, el historial enseña los dos hechos, cada uno con persona, fecha y hora.
2. Restaurar sin sesión con nombre no deja la columna vacía en silencio: la prueba fija qué se escribe.
3. Borrar un ticket con asociaciones vigentes las deja liberadas con `liberada_por` relleno.
4. El barrido encuentra los cuatro escritores de hoy y se pone rojo con uno sintético sin `performed_by`; recorre además los procedimientos `.sql` de `docs/sdd/` (hoy uno, `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:46`) y se pone rojo si uno inserta en `ticket_transitions` sin nombrarla.
5. La casilla comercial sigue opcional y ausente se escribe `false`.
6. Una transición con persona derivada produce una línea con origen, destino por nombre, fecha y hora.
7. Sin persona derivada, el destino es el área o áreas siguientes del estado de llegada, antes de restar las del actor (la base del aviso). Consecuencia declarada de S-4: si la fase siguiente es de la misma área que actuó, hay línea igualmente, aunque esa área no reciba aviso.
8. Ni la creación ni el marcador de la migración producen línea de traspaso.
9. Abrir el historial no escribe ninguna fila.
10. `registro.test.ts` cuenta DIEZ en curso y `npm test`, `npm run typecheck` y `npm run lint` pasan.
11. El barrido de citas de la regla de mutación 4 no deja ninguna rota en los ficheros tocados.
