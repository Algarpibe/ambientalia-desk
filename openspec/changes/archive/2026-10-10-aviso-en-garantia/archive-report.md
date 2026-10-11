# Archive · `aviso-en-garantia` (F1B-18, `cierra: si`)

**Fecha:** 2026-10-10 · **Rama:** `aviso-en-garantia` · **Partida:** `fc06f7b` · **Informe escrito por el orquestador**, con
cifras medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-18 cubre, en una línea:** las cinco piezas de E-105 —el distintivo «En garantía» calculado, en el
aviso al elegir el equipo en el alta, en la cabecera del ticket, en la lista y el tablero; la sugerencia de «Reporte por
garantía» en Notificado sin obligar; y «Garantía sin dato» cuando el equipo no tiene fin de garantía—, construidas y probadas
donde la red de pruebas llega. **Deja fuera** el aviso en el alta de un equipo NUEVO desde el ticket (supuesto S5 de la
propuesta: usaría una fecha tecleada sin contrapartida en el servidor), que E-105 no nombra porque habla de «elegir el
equipo». Por eso declara `cierra: si`.

## Qué decisión construye

- `decision/f1b18-entra-ya-confirmada-10-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`, commit `fc06f7b`):
  «Autorizo construir F1B-18 en su worktree con ciclo SDD completo, parando antes de fusionar». Confirma la «Opción 3» de
  `decision/reserva-con-el-margen-nuevo`, que Supervisión tiene sin versionar.
- El contenido es el de E-105 (`docs/sdd/ENTRADA.md:1396-1400`) y el del maestro
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1611-1614`).

## Qué quedó construido

- **Una sola fórmula**, `estadoGarantia`, en `packages/shared/src/garantia.ts:16-22`: el día de creación del ticket en
  `America/Bogota` (`diaEnZona`) contra el fin de garantía, que sólo vale si es una `YYYY-MM-DD` real. Devuelve
  `en_garantia`, `sin_dato` o `vencida`; `null` si la creación no se puede leer. `sugerenciaPorGarantia`
  (`packages/shared/src/garantia.ts:25`) devuelve `reporte_por_garantia` sólo en Notificado y con `en_garantia`.
- **El servidor calcula la marca por lote**, en una lectura de `equipos` por lista y ninguna si no hay equipos
  (`apps/desk/server/db/garantiaTickets.ts`). Si la lectura falla, deja un aviso en el registro y sirve la lista sin marca.
  La adjunta en la cola del taller (`apps/desk/server/db/colaTaller.ts:23-24`), en cerrados
  (`apps/desk/server/routes/tickets.ts:110`), en el detalle (`apps/desk/server/routes/tickets.ts:143-144`) y en «Remisión
  creada» (`apps/desk/server/db/listaRemisionCreada.ts:15-16`). La búsqueda de equipos trae `finGarantia`
  (`apps/desk/server/db/equipos.ts:42`, `apps/desk/server/db/equipos.ts:66`).
- **El cliente sólo pinta** la marca del servidor: `apps/desk/src/components/DistintivoGarantia.tsx` sobre
  `apps/desk/src/lib/distintivoGarantia.ts`, en la tarjeta (`apps/desk/src/components/TicketCard.tsx:103`), la lista
  (`apps/desk/src/components/TicketList.tsx:29`), la tabla (`apps/desk/src/components/TicketTable.tsx:34`) y la cabecera
  (`apps/desk/src/components/TicketDetailView.tsx:183`). El aviso del alta (`apps/desk/src/components/CreateTicket.tsx:345`)
  usa la fórmula de `shared` con el instante actual. En Notificado, `apps/desk/src/components/TransitionPanel.tsx:54`
  destaca «Reporte por garantía» sin quitar, deshabilitar, reordenar ni preseleccionar ninguna otra salida.
- **Sin migración ni columna nueva.** No se tocan `repo.ts`, `schema.sql`, `transitions.ts`, `estados.ts`,
  `ticketService.ts` ni `remision.ts`.

## Intentos

Medida = `git diff --shortstat --no-renames` contra el inicio de cada intento más `wc -l` de lo nuevo sin trackear. En los
cinco primeros el registro anotó lo mismo que git.

| Intento | Qué | Medida | Commit |
|---|---|---|---|
| 1 | Exploración, propuesta, especificación y diseño | 693 | `3e02164` |
| 2 | Tareas | 120 | `fdd9592` |
| 3 | Lote 1: `shared`, servidor y `registro.test.ts` | 571 | `df149e1` |
| 4 | Lote 2: cliente | 180 | `b3ae4d2` |
| 5 | Verify | 87 | `c2edd16` |
| 6 | Archivo | este commit | — |

**El intento 1 se partió.** La planificación entera medía 813, por encima del techo de 800: `tasks.md` (120) pasó al intento
2 antes de asentar el 1.

**El intento 4 lo terminó el orquestador.** El agente de apply del lote 2 escribió el código y se colgó sin dejar constancia.
El rojo de 4.1 se reprodujo **después**, retirando el módulo, y está declarado así en `apply-progress.md`; es la WARNING W-1
del verify.

## Fusión de los deltas

Por script (`fusiona.mjs`), sólo ADDED, añadidos al final de cada spec viva, que ya terminaba en su último requisito: no
desplaza ninguna línea existente. Antes de fusionar, los encabezados de la delta de `vistas-tablero` se alinearon al estilo
de la spec viva (`### Requirement: RQ-VT-NN`).

| Spec viva | Requisitos | Líneas |
|---|---|---|
| `openspec/specs/tickets-core/spec.md` | RQ-TC-58, RQ-TC-59, RQ-TC-60 | 3.476 → 3.617 |
| `openspec/specs/vistas-tablero/spec.md` | RQ-VT-14, RQ-VT-15 | 748 → 849 |

El script compara cada bloque fusionado con el de la delta: los cinco son idénticos. **Parte revisable medida antes de
aplicar:** 242 líneas de fusión más este informe, por debajo de 800.

## Verificación

- **Verify:** PASS CON AVISOS, 0 CRITICAL, 2 WARNING y 2 SUGGESTION (`verify-report.md`). W-1 es el rojo reproducido a
  posteriori. W-2 pedía anotar aquí la medida y el detector del lote 2: medida 180, detector 0 sobre `b3ae4d2`.
- **Mutaciones**, todas restauradas:
  - M1 a M10 (lote 1), todas rojas; M9b, el N+1 en la cola, sólo después de añadir una prueba propia.
  - M11 y M12 (lote 2), rojas.
  - El verify reprodujo dos: `<=` → `<` y quitar la marca de la cola.
  - Las mutaciones sobre `.tsx` no las caza la red: fuera por decisión de Gerencia (F0-00).
- **Regla de mutación 3:** ninguna decisión del cliente bloquea ni rellena. Las tres —distintivo, aviso del alta y destacado
  en Notificado— avisan; la tabla con su línea de servidor está en `apply-progress.md`.
- **Códigos al cerrar este intento:** se re-ejecutan con el commit de archivo y se anotan en el informe al usuario.

## Declarado

- **E-237, dinero indirecto.** «Reporte por garantía» no se cobra. La tanda sólo SUGIERE esa salida: la decisión sigue
  siendo de quien decide en Notificado. Un fin de garantía mal registrado en la hoja de vida induciría una sugerencia errónea.
  El dato lo mantiene Comercial y esta tanda no lo comprueba. Sube a Gerencia.
- **Supuestos reversibles**, en la propuesta:
  - S1 textos literales de E-105; la garantía vencida no pinta nada.
  - S2 verde y gris, nunca ámbar.
  - S3 sin equipo, sin distintivo.
  - S4 los cerrados también lo llevan.
  - S5 fuera el alta de equipo nuevo.
  - S6 sin enlace a la hoja de vida.
  - S7 la sugerencia no tiene guarda de servidor.
  - S8 editar el fin de garantía cambia la marca de todos los tickets de ese equipo, también los antiguos.
  - S9 la fecha de creación es `tickets.created_time`, también para los tickets venidos de Zoho.
- **`toca_maestro: si`.** El pasaje de `R08.4.md:1611-1614` está marcado `[DECIDIDO]` y queda construido; además,
  `R08.4.md:1628` dice que su fila «está por confirmar». Lo corrige la R08.5, no esta rama.
- **Lo que esta rama NO toca y hay que hacer en `main` al fusionar:**
  - `docs/sdd/RECONCILIACION.md`: F1B-18 pasa a cerrada por archivo.
  - La fila F1B-18 de la R01.4: «antes del corte», cerrada.
  - El traspaso a Supervisión.
  - `registro.test.ts` vuelve en este mismo commit a las once «en curso» de `fdd9592`.

## Citas

Los ficheros muy citados se editaron dentro de línea, sin cambiar su número de líneas: `types.ts`, `equipos.ts`,
`colaTaller.ts`, `routes/tickets.ts`, `listaRemisionCreada.ts` y los seis `.tsx`. `packages/shared/src/index.ts` ganó una
línea al final. Ninguna cita existente se desplaza.

Citas reparadas en la rama:
- Dos abreviadas de la exploración se escribieron completas y una se ancló en `fdd9592` (caso B).
- Un rango del informe de verify se corrigió a `packages/shared/src/garantia.ts:16-22`.

Abreviadas rotas del detector: 13, las mismas que `main`.

## Tareas de personas — fuera del recuento

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Verificación manual en la aplicación tras publicar (cabecera, tablero, lista, alta, Notificado) | Alfonso | `tasks.md`, «Verificación manual en la aplicación» |
| Corregir, en la semana de plazo, los supuestos S1-S9 | Gerencia | `proposal.md`, «Supuestos reversibles» |
| Completar el fin de garantía de los equipos que salgan «Garantía sin dato» | Comercial | hoja de vida del equipo |

Archivar no las da por hechas.
