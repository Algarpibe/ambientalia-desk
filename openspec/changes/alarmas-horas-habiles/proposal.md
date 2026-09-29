---
tanda: F1B-08
motivo: ""
capacidad: [transitions-st, derivacion-avisos, vistas-tablero]
maestro: ["Anexo D nº 3", "M1.7"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: alarmas de SLA en horas hábiles

Mitad de alarma de F1B-08. Base `4796aad`. Exploración en `openspec/changes/alarmas-horas-habiles/exploration.md`.

## Intención

- `decision/anexo-3-alerta` (`openspec/config.yaml:2329`) fija tres alarmas en horas HÁBILES: `Notificado` 9 h,
  `Remisión creada` 27 h, `Notificación cliente` 36 h. Hoy hay una sola entrada, de reloj:
  `SLA_HORAS_POR_ESTADO = { 'Notificado': 24 }` (`packages/shared/src/sla.ts:32-35`).
- Nada dispara hoy: `ticketsConSlaVencido` (`apps/desk/server/db/sla.ts:40`) no tiene llamador y ningún ticket vencido
  genera aviso ni marca.
- `decision/calendario-habil` (`openspec/config.yaml:2555`) prohíbe un cálculo propio: se usa `horasHabilesEntre`
  (`packages/shared/src/calendarioLaboral.ts:174`) con los cierres de `listarCierres`
  (`apps/desk/server/db/calendarioCierres.ts:31`), hoy sin consumidor.
- El maestro sigue diciendo «24 o 48 h» (`R08.2.md:3744`, `:4011`) y «SLA de 1 día» (`:1648`): de ahí `toca_maestro: si`.

## Alcance

**Dentro**
1. Tabla de alarmas en `packages/shared` (estado, horas hábiles, cargo) con las tres entradas; vencimiento hábil.
2. Pasada del servidor que detecta vencidos y avisa UNA vez por entrada al estado al cargo `Coordinador Comercial`
   (`decision/escalado-destinatario-doble`, `openspec/config.yaml:1499-1500`).
3. `Remisión creada` sólo avisa si el ticket no tiene orden de venta por ninguna vía
   (`decision/escalado-remision-creada`, `:1429-1431`).
4. `Notificación cliente` vencida marca el ticket en el tablero «esperando aprobación del cliente»: marca de vista,
   no estado (`:2329`, consecuencia (4) `:2334`).
5. Correo por el canal existente, sin tumbar nada si falla.

**Fuera**
- «Vistas equivalentes a Zoho» (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:93-111`, pregunta 4): por eso `cierra: no`.
- El reloj del SLA de `c7` (F1C-06), el tiempo promesa y la fecha prevista de facturación.
- Planificador propio independiente de Zoho (E-087, `docs/sdd/ENTRADA.md:1230-1236`).
- Relleno retroactivo de fotos de entrada para tickets replicados de Zoho.
- `DERIVACION_POR_DEFECTO` y `RQ-AV-02` (`openspec/specs/derivacion-avisos/spec.md:67-70`): no se tocan.

## Capacidades

**Nueva:** ninguna (R-2 no aplica; `openspec/config.yaml` no se toca).
**Modificadas:**
- `transitions-st`: `RQ-TS-15` (regla del SLA) pasa a horas hábiles con tres entradas; `RQ-TS-16` pasa de «destinatario
  derivado del grafo» a «cargo declarado en la alarma» (S-8); §3.10 deja de decir que no hay planificador.
- `derivacion-avisos`: nueva clase de aviso, alarma de SLA vencido, con resolución por cargo y anti-duplicado.
- `vistas-tablero`: marca «esperando aprobación del cliente» calculada en el servidor.

## Enfoque

- **Dominio puro** en `packages/shared/src/sla.ts`: tabla de alarmas y `vencida = horasHabilesEntre(entrada, ahora,
  cierres) > umbral`, estricto como `sla.ts:54`.
- **Servidor**: `pasadaAlarmas(pool)` encadenada en la pasada existente (`apps/desk/server/index.ts:88`); tabla de
  marcas `public.alarmas_avisadas`; `destinatariosDeCargo(db, cargo)` junto a `destinatariosDeArea`
  (`apps/desk/server/db/avisos.ts:74`); aviso con `crearAviso` (`:8`) en la misma transacción que la marca, molde de
  `marcarYAvisarRitmo` (`apps/desk/server/services/avisoRitmoContrato.ts:25-37`).
- **Tablero**: el listado de tickets trae un campo booleano calculado por el servidor; `TicketCard.tsx` sólo lo pinta.
- **Regla 13**: detectar, decidir destinatario, no duplicar y marcar lo hace el servidor; el cliente no decide nada.

## Supuestos reversibles (modo `auto`)

- **S-1 · Disparo.** Sin planificador propio: `pasadaAlarmas(pool)` se encadena en la pasada de
  `apps/desk/server/index.ts:84-93`, junto a `pasadaRitmoContratos` (`:88`). Cadencia efectiva `syncIntervalMs`
  (180 s por defecto). Misma dependencia que E-087: al retirar la sincronización con Zoho, las alarmas callarían sin
  que nada se ponga rojo. Al cerrar, adenda documental a E-087 como segundo dependiente. *Reversión:* mover la
  llamada a un planificador propio cuando exista.
- **S-2 · No duplicado.** Tabla nueva `public.alarmas_avisadas`, clave primaria (ticket, estado, instante de entrada),
  escrita con `INSERT … ON CONFLICT DO NOTHING RETURNING` en la MISMA transacción que `crearAviso`; sin fila devuelta,
  no se avisa. Reentrar en el estado es una entrada nueva y una alarma nueva. Esquema calificado, al final de
  `packages/zoho-sync/src/db/schema.sql`. Molde: `ritmo_avisado_trimestre` (`schema.sql:569`). *Reversión:* tabla nueva
  que sólo lee este código; se abandona sin migrar nada.
- **S-3 · Destinatario como dato.** El cargo va en la tabla de alarmas, no se deriva del grafo. `Notificado` →
  `Coordinador Comercial` es supuesto: ninguna decisión lo nombra, y coincide con la derivación viva de `RQ-TS-16`
  (`packages/shared/src/sla.ts:69-70`). *Reversión:* cambiar un literal de la tabla.
- **S-4 · Resolución por cargo, con respaldo por área (segunda revisión, 2026-09-29).** `destinatariosDeCargo(db,
  cargo)`: usuarios activos con ese `users.cargo` (`schema.sql:115`). Ese campo es texto libre que existe para FIRMAR la
  remisión (`apps/desk/server/auth/routes.ts:67-68`), no para repartir avisos; los cargos formales son de F1C-05. Un
  «Coord. Comercial» no casa, y con la primera revisión esa entrada quedaba marcada y no avisaba nunca. Por eso: si el
  cargo no encuentra a nadie, el aviso va al `areaRespaldo` de la alarma (`Comercial`) con `destinatariosDeArea`
  (`apps/desk/server/db/avisos.ts:74`) y un único `logger.warn` «sin Coordinador Comercial». La marca se escribe SIEMPRE al
  vencer; sólo si tampoco el área da nadie queda con cero avisos. P.1 se queda y deja de ser bloqueante.
- **S-5 · Correo.** El aviso entra en `public.avisos` y el correo sale por `dispararAvisos`
  (`apps/desk/server/avisosWebhook.ts:53`), que nunca lanza; un fallo deja `enviado_at` NULL, patrón existente.
- **S-6 · «Sin orden de venta».** Ni `orden_venta`, ni `salesorder_id`, ni asociación vigente en
  `public.ov_asociaciones` (`schema.sql:539`). El diseño busca el predicado existente y lo reutiliza; no se escribe otro.
- **S-7 · SLA hábil.** `SLA_HORAS_POR_ESTADO` pasa a horas hábiles con 9, 27 y 36. `sla.test.ts:33` cambia a
  propósito (rojo deliberado). `venceSlaEn`/`slaVencido` se retiran o se sustituyen por la comparación hábil, y
  `ticketsConSlaVencido` se reutiliza o se retira: lo decide el diseño.
- **S-8 · `RQ-TS-16` se modifica.** El invariante «todo estado con SLA tiene destinatario derivado»
  (`packages/shared/src/sla.test.ts:188-191`) pasa a «todo estado con alarma tiene cargo declarado».
- **S-9 · Sólo flujo de servicio (revisado por el orquestador).** Se CONSERVA el filtro `flujoDelTicket === 'servicio'`
  (`apps/desk/server/db/sla.ts:49`): quitarlo sólo añadía el `Notificado` de Equipo nuevo y chocaba con RQ-EN-06 vivo (MUST NOT).
- **S-10 · Tickets sin foto de entrada.** Los replicados de Zoho sin fila en `ticket_transitions` no se miden
  (`apps/desk/server/db/sla.ts:28-33`, `:56`). Se documenta, no se inventa origen.
- **S-11 · Vencido.** `horasHabilesEntre(entrada, ahora, cierres) > umbral`, estricto. `sumarHorasHabiles` sólo si el
  diseño lo necesita, y dentro de `calendarioLaboral.ts`.
- **S-13 · Sin ráfaga al desplegar (revisado 2026-09-29).** El correo enviado no se recupera: el valor por defecto
  es el que no hace daño. La primera pasada fija un corte persistente (`public.alarmas_corte`); lo que ya estaba vencido
  en el corte se marca SIN avisar (sale la marca del tablero, no el correo) y desde entonces avisa normal. Encender la
  ráfaga es decisión de Gerencia (P.3); no se crea interruptor: sólo tendría efecto en la primera pasada, así que la
  respuesta de P.3, si es «sí», se aplica en código antes de desplegar (y si entonces hiciera falta un interruptor, nace
  cerrado, `=== 'true'`, y va en `.env.example` y `DEPLOY.md` con sus dos frases).
- **S-12 · Marca del tablero en el servidor.** Campo del ticket en el listado, verdadero cuando existe marca de alarma
  de `Notificación cliente` para su entrada actual. Los `.tsx` están fuera de la red de pruebas (F0-00): no se propone
  `jsdom`; la prueba vive en el servidor.

## Tareas de persona (regla del ciclo 1, fuera del recuento)

Archivar no las da por hechas.
- **P.1 · Gerencia / administración** (no bloqueante): verificar en producción que al menos un usuario activo tiene
  `cargo = 'Coordinador Comercial'`. Sin él, las tres alarmas van al área Comercial con un `logger.warn`. Queda escrito
  en el `archive-report`.
- **P.3 · Gerencia** (no bloqueante): decidir si se enciende la ráfaga de lo vencido antes del despliegue (S-13). Por
  defecto, apagada.
- **P.2 · Gerencia**: tras desplegar, verificación en la app (ambientalia-desk.ambientalia.cloud): aviso en la campana
  del Coordinador Comercial y marca en el tablero de un ticket vencido en `Notificación cliente`.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Nadie tiene el cargo en producción (texto libre de firma) | Media | S-4: respaldo al área Comercial + `logger.warn`; P.1 |
| Retirar la sincronización de Zoho apaga las alarmas en silencio | Alta a 2027 | S-1; adenda a E-087 |
| Primera pasada tras desplegar: ráfaga de avisos por tickets ya vencidos | Media | S-13: corte persistente, lo anterior se marca sin avisar; P.3 |
| `Notificado` pasa de 24 h de reloj a 9 hábiles: avisa antes en días laborables y más tarde en fin de semana | Cierta | Nota de despliegue |
| Reintentos duplicados | Baja | S-2, marca y aviso en una transacción |

## Previsión de tamaño

Medida: `git diff --shortstat --no-renames` + nuevo sin trackear (regla del ciclo 2).

| Lote | Contenido | Estimación (incl. pruebas y apply-progress ~60) |
|---|---|---|
| 1 · `shared` | Tabla de alarmas, SLA hábil, puente de firma en `apps/desk/server/db/sla.ts:58` en `55eac92`, pruebas | ~370 |
| 2 · BD y consulta | `public.alarmas_avisadas`, `migrate.ts:73` y su prueba, `destinatariosDeCargo`, `tieneOrdenVenta`, `ticketsConSlaVencido` sin N+1 | ~475 |
| 3 · Servicio y cableado | `services/alarmasSla.ts`, `index.ts:15` y `:88` (primer lote con efecto vivo) | ~625 |
| 4 · Tablero y cierre | Campo del listado, `TicketCard.tsx`, regla 13 por escrito, barrido de la regla 4, texto para R08.3, nota de despliegue, adenda E-087 | ~375 |

*Tres lotes pasaron a cuatro en `sdd-tasks`: el de servidor y BD salía a ~1.100 líneas y se partió. Total ~1.845.*
*Con la revisión de S-4 y S-13 (2026-09-29): ~380, ~495, ~705 y ~375; total ~1.955 (detalle en `tasks.md`).*

Verify y archive son intentos aparte; el archive supera 800 por el `git mv`.

## Nota de despliegue (obligatoria)

Antes de desplegar hace falta un **paquete nuevo** que recoja: `tickets.modalidad` y S-6 de `blueprint-soporte-remoto`
con el recuento de su P.1 (o «sin medir»); y de esta tanda, las tablas `public.alarmas_avisadas` y `public.alarmas_corte`,
el cambio de `Notificado` de 24 h de reloj a 9 h hábiles, los avisos nuevos al Coordinador Comercial (o, sin él, al área
Comercial) y que lo vencido antes de la primera pasada se marca sin avisar (S-13).

## Rollback

Revertir los commits del lote. La tabla de marcas es nueva y sólo la lee este código; sin la llamada en `index.ts` no
hay avisos ni marca.

## Criterios de éxito

- [ ] Ticket en `Notificado` desde el lunes 8:00 → no vencido el lunes a las 23:00 (9 h hábiles exactas: fuera de
  jornada no cuenta), vencido el martes a las 8:00:00.001.
- [ ] Un festivo o un cierre de `public.calendario_cierres` entre medias no cuenta.
- [ ] `Remisión creada` con 28 h hábiles y OV por cualquier vía → sin aviso; sin OV → aviso.
- [ ] Dos pasadas seguidas → un solo aviso por destinatario; reentrar en el estado → aviso nuevo.
- [ ] Sin usuario con el cargo → aviso al área Comercial, marca y un `logger.warn` «sin Coordinador Comercial»; con él,
  el área no recibe nada.
- [ ] Vencido antes del corte de la primera pasada → marca sin aviso; vencido después → aviso.
- [ ] `Notificación cliente` vencida → el listado trae la marca; al salir del estado, deja de traerla.
- [ ] Un fallo del correo no rompe la pasada ni la sincronización.

## Cierre esperado

- `cierra: no`: queda la pregunta 4 («vistas equivalentes a Zoho»). El `archive-report` dice qué parte de la fila cubre.
- `toca_maestro: si`: texto para el expediente R08.3 (Anexo D nº 3 y M1.7), sin tocar el `.docx`.
- Barrido de citas de la regla de mutación 4 sobre los ficheros muy citados que se toquen.
