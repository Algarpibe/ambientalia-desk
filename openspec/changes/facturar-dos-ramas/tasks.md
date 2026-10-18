# Tareas — `facturar-dos-ramas` (F1C-02)

`strict_tdd`: cada tarea de código empieza por su prueba en rojo, vista y anotada en `apply-progress.md` con la salida.
Las referencias D* son de `design.md`. Las cifras se leen del rojo, no se estiman (D8).

## Lote 1 — las dos ramas y «Facturar» (intento 3)

- [x] 1.1 ROJO: `packages/shared/src/facturar.test.ts` — claves, `erroresFacturar` (número de espacios, fecha imposible,
      ausencias que deja a la presencia, transición sin la clave), `seRegistraEnCadaFactura` (D3, D7).
- [x] 1.2 VERDE: `packages/shared/src/facturar.ts` y su exportación en `packages/shared/src/index.ts`.
- [x] 1.3 ROJO: catálogo (RQ-TS-42, escenario 1) en `invariantesGrafo.test.ts`, al final: `entrega_sin_factura` a
      `Pendiente de facturar`; `facturar` con sus campos, área y destino; clase `ninguna` y fase `cierre`.
- [x] 1.4 ROJO: invariantes de las ramas (RQ-TS-43, D4): sin ciclo en los estados de cierre, salidas de `Pendiente de
      facturar` = `[facturar]`, y los dos catálogos sucios en memoria fallan.
- [x] 1.5 VERDE: `estados.ts`, `columns.ts`, `fasesBlueprint.ts`, `transitions.ts:248` y `:262` (D1, D2), en sus líneas.
- [x] 1.6 Vigilantes en rojo y corregidos en su línea (D8): cifras ancladas 33/22/41 (`cifrasAncladas.test.ts` y
      `openspec/config.yaml` → `cifras_ancladas` y `capabilities`), `invariantesGrafo`, `estados`, `migracionTickets`,
      `prioridad`, `mapaBlueprint` (+ regenerar artefactos), `permisos`, `cargos`, `transicionesEjecucion`, `columns`.
- [x] 1.7 Reentrancia (D5): `reentrancia.ts:79` a comentario en su sitio; `reentrancia.test.ts`, `bodegaje.test.ts:113`,
      `invariantesGrafo.test.ts:138` y las pruebas que recorrían el ciclo. Medido al aplicar: ninguna lo recorría; `liberacionSinFactura.test.ts`
      ya ponía el ticket en `Por Facturar` por el arnés, y no hubo que tocarla (S1 del verify).
- [x] 1.8 ROJO: HTTP de «Facturar» (RQ-TS-42, escenarios 2-5) en `apps/desk/server/facturar.test.ts`: `200` con
      `fecha_factura`, número en `custom_fields` y en la traza, `Closed`; `422` por caso; `403` de Servicio Técnico;
      orden `409` < `403` < `422` y presencia antes que contenido.
- [x] 1.9 VERDE: `erroresFacturar` en el `422` de `ticketService.ts:134`, en su línea.
- [x] 1.10 Cliente (D7): `TransitionPanel.tsx:33` con `seRegistraEnCadaFactura`; `TicketCard.tsx:20` con el color.
- [x] 1.11 Mutaciones del lote (D9, filas 1, 2, 3, 5 y 6) reproducidas y anotadas.
- [x] 1.12 Regla de mutación 4 sobre `estados.ts`, `transitions.ts` y `reentrancia.ts`: barrido de citas y lectura de
      cada una; detector en 0.

## Lote 2 — la alarma (intento 4)

- [x] 2.1 ROJO: `facturacionVencida` en `facturar.test.ts` (S-4: el mismo día no, el siguiente sí, sin fecha no).
- [x] 2.2 VERDE: la regla en `facturar.ts`.
- [x] 2.3 ROJO: migración — `migrate.test.ts` cuenta la `ALTER` nueva; `repo.test.ts` exige que
      `facturacion_avisada_para` no esté en `TICKET_COLS`.
- [x] 2.4 VERDE: la `ALTER` al final de `schema.sql`.
- [x] 2.5 ROJO: `apps/desk/server/services/avisoFacturacionVencida.test.ts` — los ocho escenarios de RQ-AV-23.
- [x] 2.6 VERDE: `db/facturacionVencida.ts` y `services/avisoFacturacionVencida.ts` (D6).
- [x] 2.7 Pasada: `index.ts:15` y `:88`, en sus líneas.
- [x] 2.8 Mutaciones del lote (D9, fila 4) reproducidas y anotadas.

## Cierre

- [x] 3.1 verify (intento 5).
- [ ] 3.2 archive con la regla del archivo (intento 6): fusión por script, `archive-report.md`, `registro.test.ts` a
      ocho en curso con F1C-02 por archivo, `RECONCILIACION.md` regenerado en la rama, cuatro códigos y
      `git show --numstat` del commit de archivo.

## Fuera del recuento (no son tareas de esta tanda; archivar no las da por hechas)

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Las pruebas en la app | Gerencia, en la ronda final | lista de pruebas pendientes | informe de la tanda |
| Publicar en producción (EasyPanel) y aplicar la migración al arrancar | persona que despliega | despliegue | informe de la tanda |
| Pegar en el maestro las cifras 33 / 22 / 41 | Gerencia | expediente del maestro (P-3) | texto para Supervisión del informe |
