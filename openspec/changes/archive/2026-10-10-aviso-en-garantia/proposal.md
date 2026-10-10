---
tanda: F1B-18
motivo: ""
capacidad: [tickets-core, vistas-tablero]
maestro: ["M1.3", "R08.4.md:1611-1614"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: aviso «En garantía» y «Garantía sin dato»

## Intención

El fin de garantía de cada equipo ya existe (`desk.equipos.fin_garantia`, `packages/zoho-sync/src/db/schema.sql:468`, construido
en F1B-02) y lo edita Comercial, pero no llega a ninguna pantalla del ticket: ni la búsqueda de equipos
(`apps/desk/server/db/equipos.ts:70-78`), ni el detalle, ni las listas lo llevan (exploración, hallazgos 3-4). Quien atiende un
ticket no sabe si el equipo está en garantía, y en Notificado —donde se decide si la reparación sale como «Reporte por garantía»
o se cotiza— decide sin ese dato.

**Alcance, literal:** fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:98` («Aviso «En garantía» calculado, y
«Garantía sin dato»», talla S); E-105 (`docs/sdd/ENTRADA.md:1397`); maestro
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1611-1614`. La cuenta de margen de §F.4
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:242-244`) le da 1 día y «ENTRA».

**Respaldo:** `openspec/config.yaml` → `decision/f1b18-entra-ya-confirmada-10-10` (`openspec/config.yaml:4513-4535`): «Autorizo
construir F1B-18 en su worktree con ciclo SDD completo, parando antes de fusionar». Supera, sin borrarlos, el «F1B-18 fuera» de
`openspec/config.yaml:3622` y el «fuera hasta que el margen real lo permita» de la fila `:98`.

**`cierra: si`:** E-105 pide cinco piezas —(1) distintivo calculado por «fecha de creación ≤ fin de garantía», (2) aviso al
elegir el equipo, (3) cabecera, (4) lista y tablero, (5) sugerencia en Notificado sin obligar— más «Garantía sin dato». Las
construye todas. **`toca_maestro: si`:** el pasaje `R08.4.md:1611` pasa de `[DECIDIDO]` a construido, y `R08.4.md:1628` dice
«Su fila del plan está por confirmar (§3.4)», que deja de ser cierto. No se edita el maestro (lo recoge el expediente R08.5).

## Alcance

### Dentro

- Predicado puro nuevo en `packages/shared` (propuesto `packages/shared/src/garantia.ts`, reexportado por el índice):
  `estadoGarantia(creadoEn, finGarantia)` → `'en_garantia' | 'sin_dato' | 'vencida'`. Compara días de `America/Bogota` con
  `diaEnZona` (`packages/shared/src/fechasDerivadas.ts:63`).
- Servidor: marca `garantia` calculada por lote en consulta aparte (molde `esperandoAprobacionCliente`,
  `apps/desk/server/db/colaTaller.ts:20-25`) y adjunta en los tres productores de listas —`colaDelTaller`, cerrados de
  `GET /api/tickets` y `listaRemisionCreada`— y en `GET /api/tickets/:id`. `finGarantia` entra en `EquipoLite`/`searchEquipos`.
- Cliente (`.tsx`): aviso al elegir equipo en `CreateTicket`, distintivo en cabecera del ticket, tarjeta del tablero, lista y
  tabla; en Notificado, `TransitionPanel` destaca «Reporte por garantía» (`packages/shared/src/transitions.ts:218`) como
  sugerencia.
- Deltas de spec: un requisito nuevo en `tickets-core` (marca y predicado; siguiente libre tras RQ-TC-57, hipótesis) y otro en
  `vistas-tablero` (pintado en tablero y lista; tras RQ-VT-13, hipótesis). Sin capacidad nueva (R-2 no aplica).
- `apps/desk/server/reconciliacion/registro.test.ts:218-220`: «ONCE» → «DOCE», con `'F1B-18'` entre `'F1B-13'` y `'F1C-05'`
  (orden: hipótesis de la exploración, se comprueba al ejecutar). Se edita en el lote 1; al archivar con `cierra: si`, F1B-18 sale
  de «en curso» y la prueba se vuelve a ajustar en el mismo commit de archivo. **Nota:** la prueba se pone roja en cuanto este
  `proposal.md` existe con `tanda: F1B-18`; es esperable, no un defecto, y no se arregla fuera del apply.

### Fuera de alcance

- Columna, migración o histórico: la marca se calcula al leer. Ni `packages/zoho-sync/src/db/repo.ts` ni `schema.sql` ni
  `migrate.test.ts` se tocan.
- Grafo de transiciones: `transitions.ts`, `estados.ts`, `columns.ts` y `ticketService.ts` no cambian.
- Aviso al dar de alta un **equipo nuevo** desde el ticket (S5).
- Enlace desde «Garantía sin dato» a la hoja de vida, y permisos nuevos (S6).
- Filtros o vistas del tablero por garantía; correos o avisos de bandeja.
- Garantía del proveedor (F1B-13, `PanelGarantiaProveedor.tsx`) y OVI de garantía: nociones distintas, no se mezclan.
- Verificar que el fin de garantía registrado sea correcto (tarea de Comercial).
- Pruebas de `.tsx`: excluidas por decisión de Gerencia (F0-00); no se propone `jsdom`.
- `docs/sdd/ENTRADA.md`, `openspec/config.yaml` y el maestro: no se editan en la rama.

## Capacidades

**Nuevas:** ninguna.

**Modificadas:**
- `tickets-core`: el ticket con equipo lleva una marca de garantía calculada por el servidor con un predicado único; el aviso al
  elegir equipo y la sugerencia en Notificado.
- `vistas-tablero`: tarjeta, lista y tabla pintan «En garantía» y «Garantía sin dato».

## Enfoque (A de la exploración)

1. **Una sola fórmula** en `packages/shared`. Día de creación = `diaEnZona(createdAt)`; fin = la `YYYY-MM-DD` real de la hoja de vida (`design.md`, D1); si el
   equipo no tiene fin legible → `sin_dato`; si día de creación ≤ fin (comparación de cadenas `YYYY-MM-DD`) → `en_garantia`; si
   no → `vencida`. Pruebas con instantes frontera: creado a las 20:00 −05:00 del día del fin (ya es el día siguiente en UTC) →
   `en_garantia`; creado a las 00:30 −05:00 del día siguiente → `vencida`; fin `null`, vacío o inválido → `sin_dato`.
2. **El servidor decide la marca.** Una consulta por lote `SELECT id, fin_garantia FROM equipos WHERE id = ANY($1)` (sin N+1,
   nunca lanza; si falla, la marca queda sin calcular y la lista se sirve igual), y el predicado de `shared` aplicado a
   `created_time` de cada ticket. Ticket sin `equipo_id` → sin marca. `fin_garantia` se lee como `date` sin pasar por un `Date`
   en zona del proceso (riesgo de `fechaSolo`, exploración 3.1.2).
3. **El cliente pinta** lo que el servidor manda. Sólo el aviso de `CreateTicket` calcula, con el mismo predicado, el instante
   actual y el `finGarantia` que devuelve el servidor en `EquipoLite`; es informativo.
4. **La sugerencia es presentación:** en Notificado y con marca `en_garantia`, el botón «Reporte por garantía» se destaca y una
   línea de texto lo explica; las otras dos salidas siguen visibles y habilitadas.

## Supuestos reversibles

| # | Supuesto | Por qué |
|---|---|---|
| S1 | Textos «En garantía» y «Garantía sin dato», literales de E-105. Garantía **vencida: sin distintivo** | E-105 sólo define esos dos; un tercer texto sería inventar formato |
| S2 | Verde para «En garantía», gris neutro para «Garantía sin dato»; **no ámbar** | El alcance no fija color; el tablero ya usa ámbar para la espera y se confundirían |
| S3 | Ticket sin equipo: ningún distintivo | No hay hoja de vida que completar; «Garantía sin dato» pide a Comercial algo imposible |
| S4 | Tickets cerrados llevan el distintivo igual | La marca depende de la fecha de creación, no del estado; E-105 dice «lista» sin excluir cerrados |
| S5 | Alta de equipo nuevo desde el ticket: sin aviso | La fecha la teclea el usuario y no hay contrapartida probada en servidor antes de crear (regla 13, punto 2). El ticket creado sí lleva la marca del servidor después |
| S6 | «Garantía sin dato» no enlaza; su título dice que Comercial lo completa en la hoja de vida | Comercial ya puede editar `finGarantia` (`packages/shared/src/equipoComercial.ts:14`, `:31`); no hace falta permiso nuevo |
| S7 | La sugerencia en Notificado no tiene guarda en servidor | No impone nada: E-105 dice «sin obligar» |
| S8 | Editar `finGarantia` cambia la marca de todos los tickets de ese equipo, también los antiguos | Se calcula al leer, sin columna; congelarla exigiría migración y no la pide el alcance |
| S9 | «Fecha de creación» = `tickets.created_time`, también para los tickets venidos de Zoho | Es el único instante de creación que guarda el ticket (`schema.sql:218`) |

## E-237 — efecto indirecto sobre dinero

«Reporte por garantía» no se cobra al cliente. La tanda **sólo sugiere**: no oculta, no bloquea ni preselecciona ninguna salida,
y no cambia permisos. Aun así, un fin de garantía mal registrado en la hoja de vida, o un desfase de zona de un día, induciría una
sugerencia errónea hacia una salida gratuita (o la omitiría). Mitigación técnica: predicado único probado en la frontera de
medianoche de Bogotá. El riesgo de dato de origen no lo cubre la tanda: **se sube a Gerencia en el informe** como supuesto con
plazo (regla de las preguntas, E-237), junto con S1, S2 y S8.

## Regla invariable 13 / regla de mutación 3

| Decisión del cliente | Tipo | Línea del servidor que la impone |
|---|---|---|
| Distintivo en tarjeta, lista, tabla y cabecera | avisa | La calcula el servidor (nueva, junto a `apps/desk/server/db/colaTaller.ts:24`, en `GET /api/tickets` y `GET /api/tickets/:id`); el cliente no calcula, sólo pinta el campo. Línea exacta: la fija `sdd-design` |
| Aviso al elegir equipo en `CreateTicket` | avisa | Ninguna, a propósito: no bloquea ni rellena, y el ticket creado recibe la marca del servidor. Usa el predicado de `shared` (punto 1 de la regla), con `finGarantia` servido por `searchEquipos` |
| Destacar «Reporte por garantía» en Notificado | avisa | Ninguna: no impone (S7). Lee la marca del servidor en `TicketDetail`. Las tres salidas siguen sujetas a `canExecuteTransition` como hoy |
| No pintar nada sin equipo o con garantía vencida | — | El servidor devuelve la marca vacía o `vencida`; el cliente no decide |

Ninguna decisión del cliente bloquea ni rellena.

## Ficheros muy citados

- **No se tocan:** `packages/shared/src/transitions.ts`, `packages/zoho-sync/src/db/repo.ts`, `packages/zoho-sync/src/db/schema.sql`,
  `migrate.test.ts`, `ticketService.ts`, `remision.ts`, `estados.ts`.
- **`packages/shared/src/types.ts`** (unas 50 citas `types.ts:NNN` en el repositorio, la mayoría históricas): campos opcionales
  `garantia` en `Ticket` y `finGarantia` en `EquipoLite`. Se intenta **en sitio**; si un campo exige línea nueva, se pone al final
  de su interfaz y se barre la regla de mutación 4 sobre `types.ts` al cierre.
- **`apps/desk/server/db/equipos.ts`**: `fin_garantia` entra en el `SELECT` de `:70-78` y en `toLite` (`:39-44`) en sitio.
- **`apps/desk/server/db/colaTaller.ts`, `apps/desk/server/routes/tickets.ts`, `apps/desk/server/db/listaRemisionCreada.ts`**: en
  sitio donde se pueda; código nuevo en un fichero nuevo del servidor (propuesto `apps/desk/server/db/garantiaTickets.ts`).
- **`.tsx`** (`CreateTicket`, `TicketDetailView`, `TicketCard`, `TicketList`, `TicketTable`, `TransitionPanel`): citados en specs y
  `CLAUDE.md`; barrido de citas al cierre de cada lote.

## Estimación de líneas (no medida)

| Pieza | Líneas |
|---|---|
| Predicado `shared` + índice + pruebas | ~30 + ~70 |
| Servidor: consulta por lote, adjuntar en 4 puntos, `EquipoLite` + pruebas | ~60 + ~150 |
| Cliente: chip, 5 `.tsx` | ~90 |
| `registro.test.ts` | ~2 |
| Deltas de spec (fase spec) | ~120 |
| `apply-progress.md` y casillas | ~80 |

Apply ≈ **480**, hasta ~600 con margen: cabe en un intento bajo la válvula de 720. Si al medir se acerca, se parte en dos lotes:
**1** `shared` + servidor + `registro.test.ts`; **2** cliente.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Desfase de un día por zona (instante contra `date`) | Media | `diaEnZona` en los dos lados; pruebas frontera que fallan bajo `TZ=UTC` si se usa `slice(0,10)` |
| `fin_garantia` leído como `Date` local en el servidor | Media | Prueba que fija `YYYY-MM-DD` exacto; mutación: sustituir por `toISOString().slice(0,10)` debe poner rojo |
| Cuatro puntos `.tsx` sin red de pruebas | Media | Lógica en `shared`/servidor; verificación paso a paso en la app |
| Consulta extra por listado | Baja | Una sola por lote, nunca lanza |
| `registro.test.ts` rojo entre propuesta y lote 1 | Alta (esperado) | Se corrige en el lote 1; no se fusiona en rojo |
| Citas desfasadas en `types.ts` y `.tsx` | Media | Edición en sitio y barrido de la regla 4 al cierre |

## Reversión

Revertir los commits del apply: desaparecen la marca, el campo de `EquipoLite` y el pintado. No hay columna, migración ni dato
escrito; nada que limpiar en base. `registro.test.ts` vuelve a «ONCE» al retirar la propuesta.

## Criterios de aceptación

1. Un ticket creado el día del fin de garantía (hora de Bogotá, cualquier hora) es «En garantía»; el día siguiente, no.
2. Un ticket con equipo sin fin de garantía muestra «Garantía sin dato»; uno sin equipo o vencido no muestra nada.
3. La marca llega en las tres listas y en el detalle, calculada por el servidor; `searchEquipos` devuelve `finGarantia`.
4. Al elegir un equipo en garantía en `CreateTicket` se ve el aviso; no bloquea ni rellena nada.
5. En Notificado con marca «En garantía», «Reporte por garantía» aparece destacado y las otras dos salidas siguen disponibles.
6. Mutaciones: invertir `<=` por `<`, comparar por `slice(0,10)` del instante, o quitar el adjunto de un productor ponen rojo.
7. `git diff --stat` no contiene `repo.ts`, `schema.sql` ni `transitions.ts`.
8. `npm test`, `npm run typecheck` y `npm run lint` en verde; medida de cada intento bajo 720; barrido de la regla 4 hecho.

## Tareas de personas — fuera del recuento

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Corregir S1-S9 si no se aceptan (plazo de una semana, E-237) | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| Confirmar que el fin de garantía de las hojas de vida está bien registrado | Comercial | Hoja de vida del equipo |
| Recoger en el expediente R08.5 que `R08.4.md:1611-1614` está construido y corregir `:1628` | Supervisión | Expediente R08.5 |
| Verificación visual paso a paso en la app | Persona que verifica | Parte de la tanda |
