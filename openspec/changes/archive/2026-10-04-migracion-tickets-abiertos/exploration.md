# Exploración — migracion-tickets-abiertos (F1F-01)

Copia literal de la observación 1377 de Engram (tema sdd/migracion-tickets-abiertos/explore, proyecto
ambientalia-desk, creada el 2026-10-04 17:37:36). El explorador no pudo escribir ficheros; el texto de abajo
es el suyo, sin retocar. Sus referencias a líneas van sin forma de cita: las citas comprobadas contra el árbol
están en la propuesta de esta misma carpeta.

---

**What**: Exploration of F1F-01 (migracion-tickets-abiertos). Key findings: (1) Zoho tickets are ALREADY rows in desk.tickets (synced by apps/desk/server/index.ts:85-93 syncRecent every 180000 ms, config.ts:88) with Zoho status strings copied verbatim (mappers.ts:47); app states ARE the Zoho blueprint names (estados.ts:59-105, 23 states). So 'migrating' = normalising status rules (Entregado->Finalizado + status_type Closed, service Pendiente->En Proceso per E-097/E-103/R08.4:1415) + marking managed_by_app=true so upsertTicket (repo.ts:71) stops overwriting + marker row in ticket_transitions, NOT moving data between systems. (2) No flag exists to stop ticket sync; managed_by_app is the only per-row frontier. (3) Precedents: docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql (hand-run SQL + pg-mem guardian migracionPendienteF1C09.test.ts), admin endpoints with ?dryRun=true (apps/desk/server/routes/admin.ts:83,104,129,139,177), inert CLI apps/desk/server/reconciliacion/cli.ts guarded by citas/guardianes.test.ts:84-95. (4) Google sheet 'averiguacion' (who fills it) has NO record of being done; no code reads Google Sheets; historical import = 149 rows (2025-01-29..2026-07-24, export 2026-08-04) in remisiones with origen='historico' (remisionesHistoricas.ts:156). (5) Highest RQ: zoho-sync RQ-ZS-16, tickets-core RQ-TC-39. Recommendation: pure planner in packages/shared + executor with dryRun default true exposed via superadmin admin endpoint (or inert CLI alt), idempotent, marker rows; ~300 prod + ~380 test lines.
**Why**: SDD explore phase for tanda F1F-01.
**Where**: packages/zoho-sync/src/db/repo.ts, packages/shared/src/estados.ts, openspec/config.yaml decision/fecha-corte (2161), decision/p14b-hoja-google (2600), docs/sdd/ENTRADA.md E-097 (1348).
**Learned**: managed_by_app is NOT 'born in app' (RQ-TC-01; prefix app- is); migrated Zoho-id tickets in OV asignada still need a vigente remision for habilitar_servicio (ticketService.ts:273-277).
