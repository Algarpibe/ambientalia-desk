# Exploración — `alarmas-horas-habiles` (F1B-08, `cierra: no`)

Base `4796aad`. Hallazgos de `sdd-explore` (Engram `sdd/alarmas-horas-habiles/explore`), contrastados por el orquestador en los puntos
marcados «✔» con lectura directa. El agente no tenía escritura; este fichero lo escribe el orquestador.

## Qué piden las decisiones (leídas de disco)

| Alarma | Umbral | Destinatario | Fuente |
|---|---|---|---|
| `Notificado` | 1 día hábil = **9 h hábiles** (hoy 24 h de reloj) | ninguna decisión lo nombra: **hueco**; la derivación viva (`RQ-TS-16`) da `Coordinador Comercial` | `decision/anexo-3-alerta` (`openspec/config.yaml:2324-2338`) |
| `Remisión creada` sin orden de venta | 3 días hábiles = **27 h hábiles** (antes «72 h») | `Coordinador Comercial` | `decision/escalado-remision-creada` (`:1421`), precisada por `decision/escalado-destinatario-doble` (`:1492-1500`); umbral de `anexo-3-alerta` |
| `Notificación cliente` sin aprobación ni rechazo | 4 días hábiles = **36 h hábiles** | `Coordinador Comercial`, y el ticket se señala en el tablero «esperando aprobación del cliente» (marca de vista, no estado) | `decision/anexo-3-alerta` (`:2329`) |

Día hábil: L-V 8-17 h, sin festivos de Colombia; independiente del reloj del SLA de `c7`, que se para en `Notificación cliente`.

## Lo que ya existe

- ✔ `SLA_HORAS_POR_ESTADO` = `{ 'Notificado': 24 }` de reloj (`packages/shared/src/sla.ts:32-35`), fijado por `sla.test.ts:33`; el invariante
  `sla.test.ts:188-191` (y `RQ-TS-16`) exige destinatario derivado para todo estado con SLA. `destinatarioDelEscalado` (`sla.ts:92-109`) es de UN cargo.
- `ticketsConSlaVencido` (`apps/desk/server/db/sla.ts:40`) existe y **no la llama nadie**; filtra `flujoDelTicket === 'servicio'` (`:49`), lee la
  entrada al estado del último `to_status` de `ticket_transitions` (`:51-56`) y omite los tickets de Zoho sin foto (`:28-33`). Hoy no hay ningún aviso
  ni marca visual al vencer el SLA.
- ✔ `calendarioLaboral` (F1B-12) es puro: `horasHabilesEntre(desde, hasta, cierres)` (`packages/shared/src/calendarioLaboral.ts:174`); los cierres
  salen de `listarCierres(db)` (`apps/desk/server/db/calendarioCierres.ts:31`, tabla `public.calendario_cierres`), hoy sin consumidor. No existe
  `sumarHorasHabiles`; el diseño archivado de `calendario-laboral` lo asigna a F1B-08 dentro del mismo módulo, si hace falta.
- ✔ Pasada periódica: `apps/desk/server/index.ts:84-93`, un `setInterval` de `syncIntervalMs` (180 000 ms por defecto) que encadena
  `pasadaRitmoContratos(pool)` y la sincronización de Zoho. **E-087**: con la independencia de Zoho esa pasada desaparece.
- ✔ Anti-duplicado del ritmo: `contratos.ritmo_avisado_trimestre` (`schema.sql:569`), escrito con un `UPDATE … RETURNING` en la misma transacción que
  `crearAviso` (`apps/desk/server/services/avisoRitmoContrato.ts:26-36`); una vez por día civil. Las alarmas son horarias: la marca tiene que ir por
  (ticket, estado, instante de entrada).
- Avisos: `crearAviso` (`apps/desk/server/db/avisos.ts:8`), `destinatariosDeArea` (`:74`) por rol/área. **No hay resolución por cargo** aunque
  `users.cargo` existe (`schema.sql:115`). Correo: `dispararAvisos` (`apps/desk/server/avisosWebhook.ts:53`) nunca lanza.
- Tablero: el cliente no pinta SLA. `Remisión creada` ya es espera `interna` (`estados.ts:86`) y `Notificación cliente` `externa` (`:65`): la parte de
  clasificación de la fila del plan (`R01.1.md:163`) está hecha.
- Pregunta 4 de `docs/sdd/Preguntas_Gerencia_2026-09-29.md:93-111` («vistas equivalentes a Zoho») sigue abierta: por eso `cierra: no`.

## Riesgos que la propuesta tiene que resolver

Choque con `RQ-TS-16` y `sla.test.ts:33`/`:188-191`; destinatario de un solo cargo; dependencia de E-087; `Coordinador Comercial` como cargo real en
producción sin verificar; tickets de Zoho sin foto no se miden; `Notificado` cambia de 24 h de reloj a 9 hábiles.
