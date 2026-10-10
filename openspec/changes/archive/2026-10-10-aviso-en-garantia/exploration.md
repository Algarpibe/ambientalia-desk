# Exploración · aviso-en-garantia (F1B-18, talla S)

Medido el 2026-10-10 en el worktree `aviso-en-garantia` (base `fc06f7b`). Rutas relativas al worktree. Lo no leído va como «hipótesis».

## 1. Resumen

El dato ya existe, pero no llega a las pantallas que lo necesitan: `desk.equipos.fin_garantia` (tipo `date`) está en la hoja de vida y lo edita Comercial, pero ni la búsqueda de equipos (`EquipoLite`), ni el detalle del ticket, ni las listas lo llevan. El ticket guarda `equipo_id` y `created_time` (`timestamptz`). Hace falta (1) un predicado compartido en `packages/shared` que compare el DÍA de creación en `America/Bogota` con el `date` de fin de garantía, (2) que el servidor lo calcule y lo adjunte al detalle, a las listas y a la búsqueda de equipos, y (3) cuatro puntos de pintado en `.tsx` (sin red de pruebas por decisión de Gerencia). «Reporte por garantía» ya existe (`reporte_por_garantia`, Notificado → Notificación a Compras): la sugerencia es sólo presentación. Hay precedente exacto del patrón (marca calculada en servidor y pintada en cliente): `esperandoAprobacionCliente` (RQ-VT-07).

## 2. Alcance leído de disco

- Plan: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:98` (F1B-18, talla S, «reserva 1 — fuera hasta que el margen real lo permita»; superada por la decisión de abajo). §F.4 `:231-246` es cuenta de margen: con F1B-18 (1 d) «+1,1 a +1,7 → ENTRA».
- E-105: `docs/sdd/ENTRADA.md:1396-1400` (texto literal de Gerencia: distintivo calculado; fecha de creación ≤ fin de garantía; aviso al elegir equipo, en cabecera, lista y tablero; sugerencia en Notificado sin obligar; «Garantía sin dato» para que Comercial lo complete).
- Decisión: `openspec/config.yaml:4513-4532` (`decision/f1b18-entra-ya-confirmada-10-10`): «Autorizo construir F1B-18 en su worktree con ciclo SDD completo, parando antes de fusionar». Supera el «F1B-18 fuera» de `decision/escenario-a-festivos-plan-a-01-10` (`:3604`, consecuencia (2) en `:3622`). La cuenta oficial no se mueve.
- Maestro R08.4 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`): `:1611-1614` (`[DECIDIDO 30/09/2026]`, mismo texto que E-105); `:1477` («Se sugiere si el equipo está "En garantía"»); `:2452` («Alimenta el aviso "En garantía" (M1.3); sin dato, "Garantía sin dato"»); `:2510`; `:4550` («No es un estado. "Reporte por garantía"… la aplicación la sugiere sin obligar»); `:1628` (lista de lo que va antes del corte; dice que su fila está por confirmar, y `config.yaml:3630-3631` ordena corregirlo en la R08.5: «En garantía» y SKU van a reserva).

## 3. Hallazgos

### 3.1 Campo fin de garantía
1. Columna: `packages/zoho-sync/src/db/schema.sql:468` `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS fin_garantia date;` (sin calificar: `equipos` es de `desk`, igual que las 11 de `DESK_TABLES`).
2. Tipos: `EquipoInput.finGarantia?: string | null` (`apps/desk/server/db/equipos.ts:101`); `toFull` lo devuelve con `fechaSolo(r.fin_garantia)` (`:114`) → `YYYY-MM-DD`. `fechaSolo` usa getters LOCALES de `Date` (`packages/zoho-sync/src/books/repo.ts:94-100`) y su comentario avisa de que el fallo no se ve bajo `TZ=UTC`, que es lo que fuerza vitest.
3. El ticket guarda `equipo_id` (`schema.sql:206`; `TicketDetail.equipoId`, `packages/shared/src/types.ts:131`; copiado en `packages/zoho-sync/src/db/mappers.ts:96`). NINGUNA consulta de tickets une `equipos`: detalle `packages/zoho-sync/src/db/repo.ts:192-203`, listas `:142-190` (`SELECT t.*` más accounts/agents/clients/contacts/users/ticket_reads). El comentario de `apps/desk/server/routes/equipos.ts:26-29` explica por qué el detalle no une `equipos` (coste).
4. `searchEquipos` NO selecciona `fin_garantia`: `SELECT id,serial,marca,modelo,tipo,cliente_nombre,client_id,codigo_interno` (`apps/desk/server/db/equipos.ts:70-78`); `toLite` (`:39-44`) y `EquipoLite` (`types.ts:342`) tampoco lo tienen. `getEquipoFull` sí (`SELECT_EQUIPO_FULL`, `equipos.ts:163-167`), servido por `GET /api/equipos/:id` con `requireAuth` (`routes/equipos.ts:34-38`): hoy el dato lo ve cualquier sesión de la app. Hipótesis: el cliente final no tiene sesión (no leí `docs/modelo-autorizacion.md`, citado en `types.ts:23`).

### 3.2 Fecha de creación
5. `tickets.created_time timestamptz` (`schema.sql:218`). Sale como `Ticket.createdAt` ISO (`mappers.ts:62`; campo en `types.ts:31`) y en el detalle.
6. Ayudas: `diaEnZona(valor)` convierte un instante o un `YYYY-MM-DD` al día civil de `ZONA_NEGOCIO='America/Bogota'` (`packages/shared/src/fechasDerivadas.ts:13`, `:63-72`; rechaza fecha-hora sin desplazamiento) y es apto para navegador (`:9`). `instanteDeJornada` (`calendarioLaboral.ts:155`) es de hora, no sirve aquí.
7. RIESGO de tipos: comparar instante contra día. Un ticket creado el 15/03 a las 20:00 en Bogotá es el 16/03 01:00Z; con `slice(0,10)` o un `::date` en sesión UTC saldría el 16 y marcaría «en garantía» una garantía vencida el 15. Hay que comparar `diaEnZona(createdAt) <= finGarantia` como cadenas de día (el orden léxico es el cronológico). Las pruebas bajo `TZ=UTC` no cazan el fallo: probar con instantes frontera (p. ej. `2026-03-16T02:00:00Z` = 15/03 21:00 Bogotá).

### 3.3 Elección del equipo al crear el ticket
8. `apps/desk/src/components/CreateTicket.tsx:141` llama `searchEquipos(equipoQuery, clientId)`; `pickEquipo` fija `equipo` (`:178-179`); la ficha elegida se pinta en `:340-345` (marca modelo · tipo · serie · dueño): ahí iría el aviso (a). Con «Equipo nuevo», `finGarantia` se teclea en `:60` y `:389` (`type=date`) y el servidor lo registra en `apps/desk/server/services/equipoNuevo.ts:54`.
9. Precedente de aviso ámbar en el mismo formulario: `border-amber-400` (`:329`), «aviso ámbar» (`:206`).

### 3.4 Cabecera, lista, tablero
10. Cabecera: `TicketDetailView.tsx:170-190`, fila de chips (número, propietario, hora, botón «Hoja de vida del equipo» condicionado a `ticket?.equipoId`, `:179`). Recibe `TicketDetail` de `GET /api/tickets/:id` (`routes/tickets.ts:128-145`), que ya añade campos de servidor fuera del mapeador (`escaladoARevisionAt`, `primerDerivado`, `:143`): sitio natural para la marca.
11. Tres productores de `Ticket[]`: `colaDelTaller` (`apps/desk/server/db/colaTaller.ts:22-25`; sirve `GET /api/tickets` activos/all, `routes/tickets.ts:118-119`, y `GET /api/mis-tickets`, `routes/prioridad.ts:83-86`); cerrados con `rowToTicket` directo (`routes/tickets.ts:109`); y `listaRemisionCreada` (`db/listaRemisionCreada.ts:13-17`). Consumidores: `TicketCard.tsx` (tablero, `KanbanBoard.tsx:27`), `TicketList.tsx`, `TicketTable.tsx` (`App.tsx:129,132`). Hipótesis: `boardView.ts` filtra por estado y no necesita tocarse (no lo leí entero).
12. Precedente: `Ticket.esperandoAprobacionCliente` (`types.ts:37`), calculado por conjunto en `colaTaller.ts:24` (`ticketsEsperandoAprobacionCliente`, `db/alarmasAvisadas.ts:14`, nunca lanza) y pintado en `TicketCard.tsx:92-97`.

### 3.5 Notificado y «Reporte por garantía»
13. Existe: `{ id: 'reporte_por_garantia', name: 'Reporte por garantía', from: ['Notificado'], to: 'Notificación a Compras', area: 'Servicio Técnico', fields: [comment(), cfDate('Fecha Revisión Informe')] }` (`packages/shared/src/transitions.ts:218-219`). Notificado conserva tres salidas: `devolucion_a_correccion` (`:194`), `reporte_por_garantia`, `escalado_a_comercial` (`:220`), según `:232-233`. No hay que tocar el grafo.
14. `TransitionPanel.tsx` pinta los botones con `transitions.map` (`:128`). Precedente de avisar sin bloquear: texto ámbar de 11px junto a «Habilitar Servicio» (`:137`, `motivoBloqueo`/`avisoSinConfirmar`), y consulta el equipo con `fetchEquipo(equipoId)` sólo cuando hace falta (`:70`). Recibe `equipoId` (`TicketDetailView.tsx:335`).

### 3.6 Regla 13 y precedentes
15. Molde `esEstadoEnEspera`: el criterio vive en `shared` (`ESTADOS_EN_ESPERA`) y `apps/desk/src/lib/enEspera.ts:15` sólo lo consume. Otro molde: `fechasDerivadas.ts` (fórmula única; el servidor impone, el cliente prellena). `packages/shared/src/index.ts` reexporta los módulos (hipótesis: añadir una línea al final).
16. Cálculo de garantía previo: ninguno. `grep -i garant` da sólo F1B-13 (reclamación al fabricante, `garantiaProveedor*`), OVI de garantía (`ordenOVI`, `guardasOVI`), bodegaje y campos de la hoja de vida. `HojaDeVida.tsx:213` pinta «Fin de garantía: {eq.finGarantia ?? '—'}». No confundir con «garantía de proveedor» (`PanelGarantiaProveedor.tsx`).
17. Regla 13 (mutación 3): la marca debe venir del servidor y el cliente sólo pintarla. La «sugerencia» no tiene guarda que imponer (no obliga), así que no hay contrapartida servidor que nombrar para ella; sí para la marca en sí.

### 3.7 Pruebas
18. `vitest.config.ts` incluye sólo `apps/**/*.test.ts` y `packages/**/*.test.ts` (CLAUDE.md): los `.tsx` quedan fuera, no se propone jsdom. Red probable: nueva `packages/shared/src/garantia.test.ts` (predicado puro, frontera de día, zona, sin dato, fecha inválida); pruebas de servidor junto a `apps/desk/server/tickets.test.ts` y `apps/desk/server/equipos.test.ts` (existen).
19. `apps/desk/server/reconciliacion/registro.test.ts:218-220` en `fdd9592`: la prueba `11f/05g` se titula «exactamente ONCE» y fija `['F0-04','F1B-03','F1B-04','F1B-07','F1B-08','F1B-09','F1B-13','F1C-05','F1F-01','F1F-02','F1F-05']`. Lee los proposals reales: `comprobaciones.ts:221-224` pone «en curso» toda tanda de un proposal no archivado (o archivado sin `cierra: si`) que no esté cerrada por commit. Al entrar `openspec/changes/aviso-en-garantia/proposal.md` con `tanda: F1B-18`, la lista pasa a DOCE con `F1B-18` entre `F1B-13` y `F1C-05` (hipótesis sobre el orden: no leí `ordenar`). Hay que editar `apps/desk/server/reconciliacion/registro.test.ts:218` (título) y `apps/desk/server/reconciliacion/registro.test.ts:220` (insertar `'F1B-18'`) en el mismo cambio, y volver a ajustarla al archivar con `cierra: si`. El denominador sigue en 78 (la fila ya está en el §C, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:98`).

### 3.8 Ficheros muy citados (regla de mutación 4)
20. Probable toque:
   - `packages/zoho-sync/src/db/repo.ts` (el más citado): sólo si se une `equipos` en las consultas. Evitable con consulta por lote aparte, como `ticketsEsperandoAprobacionCliente`. Recomendado: NO tocarlo.
   - `schema.sql` y `migrate.test.ts`: NO (no hay columna nueva).
   - `ticketService.ts`, `remision.ts`, `transitions.ts`, `estados.ts`, `columns.ts`: NO (no hay guarda ni transición nueva).
   - `packages/shared/src/types.ts` (`Ticket`, `TicketDetail`, `EquipoLite`): sí; añadir campos opcionales AL FINAL de cada interfaz para no desplazar líneas. Hipótesis: no medí cuánto se cita; barrido de citas al cerrar.
   - `apps/desk/server/db/equipos.ts`: añadir `fin_garantia` al SELECT (`:70`) y a `toLite` (`:39-44`), sin insertar líneas.
   - `apps/desk/server/db/colaTaller.ts`, `routes/tickets.ts`, `db/listaRemisionCreada.ts`: adjuntar la marca (en sitio).
   - Specs: deltas en `openspec/specs/tickets-core` y `openspec/specs/vistas-tablero` (ambas existen y E-105 las nombra); sin capacidad nueva (R-2).

### 3.9 Permisos
21. «Comercial» es el área Comercial: `puedeEditarCamposRestringidos(areas, isAdmin)` ≡ `canExecuteTransition(areas, isAdmin, 'Comercial')` (`packages/shared/src/equipoComercial.ts:31-33`). `finGarantia` está en `CAMPOS_COMERCIALES_RESTRINGIDOS` (`:14`); el servidor da 403 si lo cambia otro (`routes/equipos.ts:106-107`); la hoja de vida lo edita en `EquiposAdmin.tsx:128,262` (bloqueado a no-Comercial). Completar el dato ya es posible: no hay permiso nuevo ni cargo que tocar (`cargos.ts:14` no interviene).
22. El aviso es una vista visible para cualquier sesión (molde `listaRemisionCreada`: «Una vista: no concede permiso», `routes/prioridad.ts`).

## 4. Enfoques

**A (recomendado) · Predicado compartido y marca calculada por el servidor, sin tocar `repo.ts`.** `packages/shared/src/garantia.ts`: `estadoGarantia(createdAt, finGarantia)` → `'en_garantia' | 'sin_dato' | 'vencida'` apoyado en `diaEnZona`. El servidor resuelve por lote (`SELECT id, fin_garantia FROM equipos WHERE id = ANY($1)`, molde `ticketsEsperandoAprobacionCliente`) un campo `garantia` en `Ticket` (las tres listas y `GET /api/tickets/:id`) y `finGarantia` en `EquipoLite`. El cliente sólo pinta: chip en tarjeta/lista/tabla y cabecera, aviso en `CreateTicket`, sugerencia en `TransitionPanel` cuando el estado es Notificado. Pros: no toca el fichero más citado, sin migración, regla 13 limpia, predicado probado en node. Contras: una consulta más por listado y cuatro puntos `.tsx` sin red de pruebas.

**B · JOIN a `equipos` en `repo.ts` y mapeo en `rowToTicket`.** Una sola consulta, pero toca `repo.ts:142-203` (barrido masivo de citas), `routes/equipos.ts:26-29` ya lo desaconseja por coste, y el mapeador vive en el paquete de sincronización mientras la regla es de la app. No recomendada.

## 5. Riesgos

- **Dinero indirecto (E-237).** «Reporte por garantía» no se cobra al cliente. Un falso «En garantía» (p. ej. un día de desfase de zona, 3.2.7) empuja a sugerir una salida gratuita; un falso «sin garantía» pierde la sugerencia. Mitigación: predicado único probado en la frontera de medianoche de Bogotá; la sugerencia no obliga ni cambia permisos. El dato de origen (hoja de vida) es editable y no se verifica en esta tanda.
- **Equipo nuevo desde el ticket.** El aviso (a) con la fecha tecleada (`CreateTicket.tsx:389`) sería un cálculo de cliente sin contrapartida probada hasta crear el ticket (regla 13 punto 2). Declarar supuesto o dejar fuera.
- **`fechaSolo` y la zona del proceso** (3.1.2): fallo ya documentado; la prueba debe cubrirlo.
- **Citas desfasadas** al editar `types.ts`, `colaTaller.ts`, `routes/tickets.ts`: barrido de la regla 4 en el cierre (el detector no bloquea la forma abreviada).
- **`registro.test.ts:218-220`** se pone rojo al entrar la propuesta (3.7): es esperable, no un defecto.
- **Maestro:** `R08.4.md:1628` sigue diciendo «antes del corte» con fila por confirmar; lo corrige la R08.5, no esta tanda.
- **Color:** el tablero ya usa ámbar para «espera» (IV-1/IV-9); un chip ámbar nuevo puede confundirse.

## 6. Lo que el alcance NO dice (supuesto reversible o fuera)

1. Texto, color e icono de «En garantía» y «Garantía sin dato», y forma de la sugerencia. Supuesto: chip verde «En garantía», chip gris «Garantía sin dato», sugerencia como línea de texto junto a los botones y resaltado del botón «Reporte por garantía», sin deshabilitar nada.
2. Garantía vencida (fin anterior a la creación): E-105 sólo habla de dos estados. Supuesto: sin chip.
3. Tickets sin `equipo_id` (históricos de Zoho). Supuesto: sin chip; «Garantía sin dato» sólo con equipo registrado y sin fin.
4. Tickets cerrados: E-105 dice «lista y tablero». Supuesto: llevan el chip (el cálculo no depende del estado).
5. Alta de equipo nuevo desde el ticket. Supuesto: queda fuera del aviso (a).
6. Si «Garantía sin dato» enlaza a la hoja de vida o nombra a Comercial. Supuesto: texto «Comercial debe completarlo», sin enlace.
7. Que se calcula al leer (sin columna ni histórico): editar `finGarantia` cambia el aviso de todos los tickets del equipo. Supuesto.
8. «Fecha de creación» = `tickets.created_time` tal cual, también en los sincronizados de Zoho. Supuesto.
9. Verificación visual: sin pruebas `.tsx`; la hace la persona paso a paso en la app.

## 7. Siguiente

`sdd-propose` con el enfoque A. Cabecera R-1: `tanda: F1B-18`, `capacidad: [tickets-core, vistas-tablero]`, `maestro: ["M1.3", "R08.4.md:1611-1614"]`, `cierra: si`, `toca_maestro: si`, `origen_cabecera: declarada`. Incluir en las tareas la edición de `registro.test.ts:218-220`.
