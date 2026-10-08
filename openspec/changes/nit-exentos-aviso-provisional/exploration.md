# Exploración: `nit-exentos-aviso-provisional` (F1B-19)

Partida: `ba643d9`. La exploración la hizo el agente de exploración; el orquestador contrastó contra el código los datos marcados
con «(contrastado)». Lo que no se verificó lleva la palabra «hipótesis».

## Estado actual

- El `409` de P-B sale de una sola línea, `apps/desk/server/services/ticketService.ts:96` (contrastado): tras las guardas de
  contenido (cuarentena, contrato vencido, garantía sólo con OVI) llama a `ticketConOrdenVenta` y después a
  `primerConflictoUnicidad({ nitEnBooks: prov ? await clientesBooksPorNit(db, prov.nit) : [], ovEnUso: enUso })`; si el conflicto
  es de NIT lanza `errorNitEnBooks`. `prov` viene de `exigirClienteProvisional`, en `apps/desk/server/services/ticketService.ts:28`.
- `clientesBooksPorNit` (`apps/desk/server/db/clientesProvisionales.ts:69-75`, contrastado) lee `SELECT id, name, nit FROM clients`
  y decide en JS con `nitCoincide`. Es su único llamador.
- `errorNitEnBooks` está en `apps/desk/server/services/altaManual.ts:158-161`; su comentario dice que no se inventa una lista de
  exentos porque es decisión de Gerencia (E-154).
- Hoy no existe lista de exentos ni aviso de provisional contra Books.

## Hallazgos

1. **Una sola implementación de «mismo NIT».** `normalizarNit` y `nitCoincide` viven en `packages/shared/src/altaManual.ts:32-35`
   y `packages/shared/src/altaManual.ts:46-53` (contrastado). Los demás sitios con `nit` no comparan igualdad: son búsquedas por
   subcadena (`packages/zoho-sync/src/books/repo.ts:122`, `apps/desk/server/db/clientesProvisionales.ts:37`), mapeos de columna
   (`packages/zoho-sync/src/booksHub/mappers.ts:28`, `packages/zoho-sync/src/db/mappers.ts:74`) o presentación. No hay dos
   implementaciones que enfrentar.
2. **Precedentes de lista como dato.** `catalogo_novedades` es una tabla sembrada con `INSERT … ON CONFLICT (clave) DO NOTHING`
   al final de `packages/zoho-sync/src/db/schema.sql` (líneas 682 a 699 según el agente), nació sin pantalla y se «retira» con
   `activo = false` porque la siembra reinsertaría una fila borrada. El otro molde es la constante en `packages/shared`
   (`EXCEPCIONES_POR_CARGO`, `packages/shared/src/cargos.ts:27`).
   - Constante: sin esquema ni guardianes, pero ampliar la lista exige código y despliegue, y la consecuencia (4) de
     `decision/e154-nit-genericos-exentos` pide «un dato mantenible y no una constante».
   - Tabla sembrada: `CREATE TABLE` calificado al final del esquema, alta en `PUBLIC_TABLES`
     (`packages/zoho-sync/src/db/migrate.ts:70-73`, dentro de la línea 73) y el recuento del guardián
     (`packages/zoho-sync/src/db/migrate.test.ts:282-286`, contrastado: hoy 10, 32 y 3 tablas, 45 en total).
3. **Pruebas del `409` de P-B:** `apps/desk/server/services/altaManual.test.ts:322-383`, con `instalarArnes()` y `POST /api/tickets`
   sobre pg-mem; el ayudante `conNit` está en la línea 323 de ese fichero. La posición del NIT frente a la última guarda de
   contenido la fija `apps/desk/server/services/altaManual.test.ts:367` (contrastado: serial distinto + NIT en Books da el `422` del
   serial). Las funciones puras se prueban en `packages/shared/src/altaManual.test.ts:30-83`. Una orden de venta ya usada junto a un
   provisional no es alcanzable: `apps/desk/server/services/altaManual.ts:116` la corta antes con `422`.
4. **Dos provisionales con el mismo NIT: hoy nada lo impide.** La tabla no tiene unicidad ni índice sobre `nit`
   (`packages/zoho-sync/src/db/schema.sql:658-673`, contrastado) y la guarda del alta sólo mira Books.
5. **Aviso: firmas y moldes.**
   - `crearAviso(db, { userId, ticketId, texto })` (`apps/desk/server/db/avisos.ts:8-18`) y `destinatariosDeArea(db, area, actorId)`
     (`apps/desk/server/db/avisos.ts:74-93`).
   - Marca y aviso en `enTransaccion`: `apps/desk/server/services/avisoRitmoContrato.ts:25-37` (contrastado).
   - Destinatarios antes de la marca, y sin destinatarios no se marca: `apps/desk/server/services/avisoReclamacionProveedor.ts:26-40`
     (contrastado).
   - Marca por clave compuesta: `marcarYAvisarAlarma` (`apps/desk/server/services/alarmasSla.ts:37-49`, contrastado) inserta sin
     `ON CONFLICT` en `public.alarmas_avisadas` y captura el código `23505`; su cabecera explica que `ON CONFLICT … RETURNING`
     difiere entre pg-mem y PostgreSQL.
   - Cómo prueban: anti-ruido (`apps/desk/server/services/avisoRitmoContrato.test.ts:71-78`), transacción por estructura con un
     rastreador de llamadas (`apps/desk/server/services/avisoRitmoContrato.test.ts:127-138`), y que la pasada no lanza
     (`apps/desk/server/services/avisoRitmoContrato.test.ts:140-153`).
   - Dos pruebas leen `apps/desk/server/index.ts` como texto: `apps/desk/server/services/avisoRitmoContrato.test.ts:185-195` exige
     `pasadaRitmoContratos(pool).then(() => sync.syncRecent())` adyacentes, y
     `apps/desk/server/services/avisoReclamacionProveedor.test.ts:251-259` exige `pasadaReclamaciones(pool)` antes. Una pasada nueva
     cabe entre las dos, dentro de `apps/desk/server/index.ts:88`, y su import dentro de la línea 15.
6. **La vista `clients`** sale de `books.contacts` (`packages/zoho-sync/src/db/schema.sql:169-173`), tabla replicada desde el hub
   que `apps/desk` no escribe. El intervalo de la pasada es `config.syncIntervalMs`, 180000 ms por defecto
   (`packages/zoho-sync/src/config.ts:88`). **Cuántos contactos hay: sin dato en el repositorio.** Para no leerlos en cada pasada
   conviene leer primero los provisionales sin enlazar y salir si no hay ninguno.
7. **Specs vivas.** `openspec/specs/tickets-core/spec.md`: RQ-TC-30 (`openspec/specs/tickets-core/spec.md:1577`, contrastado) fija
   el `409` y dice que ningún NIT genérico queda exento; el último identificador usado es RQ-TC-56
   (`openspec/specs/tickets-core/spec.md:3309`, contrastado). `openspec/specs/derivacion-avisos/spec.md`: el último es RQ-AV-20
   (`openspec/specs/derivacion-avisos/spec.md:901`, contrastado). Las dos capacidades ya están en `openspec/config.yaml` →
   `capabilities`.
8. **Regla 13: no hace falta tocar `apps/desk/src`.** El cliente no decide nada sobre el NIT: lo envía sin tocar
   (`apps/desk/src/lib/altaManualEstado.ts:30`) y sólo enseña los candidatos que trae el `409`
   (`apps/desk/src/api/client.ts:781-784`).
9. **Ficheros muy citados.** `ticketService.ts` tiene del orden de mil citas por línea en el repositorio (estimación del agente, no
   cuenta exacta): la edición va dentro de la línea 96, sin añadir ni quitar líneas. Las tablas nuevas van al final de `schema.sql`
   (796 líneas hoy, contrastado).

## Riesgos

1. **Ráfaga al desplegar:** toda pareja que ya exista avisará una vez en la primera pasada. Sin dato de cuántas hay.
2. **Cómo casa la exención con el dígito de verificación:** la exención debe mirar los dos lados de la pareja en el aviso.
3. **`nitCoincide` no debe cambiar:** su contrato está probado y lo consume el `409`.
4. **Sin destinatarios, reintento en cada pasada:** un aviso de registro cada intervalo mientras dure.
5. **Presupuesto:** dos piezas con esquema, guardianes y pruebas; conviene partir el apply en dos intentos.

## Preguntas abiertas

- ¿Se acepta la ráfaga única de avisos de parejas ya existentes, o se pide un corte?
- ¿Se acepta mantener la lista por SQL, sin pantalla, en esta tanda?
- Texto del aviso y ticket asociado: propuesta, sin ticket, con razón social, NIT y nombre del contacto.
