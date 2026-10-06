# Informe de archivo — `sync-tickets-por-modificacion`

**Tanda:** `fuera-del-plan` · **`cierra: no`** · **Fecha:** 2026-10-06 · **Rama:** `sync-tickets-por-modificacion`, nacida de `main` en `9822bd7`. Sin fusionar al escribir este informe. Informe escrito por el orquestador, con cifras medidas.

**Cobertura (R-1):** el cambio no realiza contenido de ninguna fila del §5 del plan, y por eso lleva `fuera-del-plan` con motivo: la réplica perdía los cierres y cambios de estado hechos en Zoho. Cubre el incremental de tickets (`syncRecent`). Deja fuera el relleno de lo ya perdido, que es una operación sobre producción, y los tickets nº 689, 880, 881 y 882, cuyo desfase esta causa no explica.

## Qué se entregó

- `packages/zoho-sync/src/sync.ts`: `syncRecent` conserva sus cinco líneas (`:173-177`) y delega en `sincronizarModificados`, añadida al final del fichero (`:360-434`). `git diff 9822bd7 -U0` da dos hunks, `@@ -174,3 +174,3 @@` y `@@ -358,0 +359,76 @@`: ninguna línea existente se movió.
  - Marca de agua: `max(modified_time)` de los tickets de origen Zoho, sin los nacidos en la app ni las filas con `managed_by_app` (`sync.ts:381`), menos un solape de 15 minutos (`:368`).
  - `/tickets/search` con `modifiedTimeRange` sirve sólo de índice de identificadores (`:396`); cada ticket se relee por detalle (`:415`) y se persiste por `persistTicket`, igual que `syncTicket`.
  - Sin marca, o si la búsqueda responde no-OK o lanza, el ciclo ejecuta la página 1 por `-recentThread` como antes; en el segundo caso con un `console.error` que nombra la búsqueda y el estado (`:404-407`).
  - Ante `429`, `≥ 500` o fallo de red al leer un detalle se corta la pasada (`:418`, `:424`); el orden ascendente propio (`:410`) hace que lo persistido sea un prefijo.
- `packages/zoho-sync/src/sync.modificados.test.ts`: 15 pruebas nuevas, con `zohoFetch` enrutado por ruta y pg-mem. Las pruebas existentes de `syncRecent` no se tocaron y siguen en verde: sus filas no tienen `modified_time`, así que la marca es nula.
- `DEPLOY.md`: dos líneas al final sobre el permiso de búsqueda del token y el aviso del log.
- `docs/sdd/ENTRADA.md:2048`: la cita a `sync.ts:173-177` queda anclada a `9822bd7` y dice qué la superó (caso C de la regla de mutación 4).
- Spec: RQ-ZS-22 fusionado por script **al final** de `openspec/specs/zoho-sync/spec.md` (`@@ -1273,0 +1274,93 @@`), bloque idéntico al delta según la comprobación del propio script. Sólo ADDED; ningún requisito vivo cambia.

## Intentos y medida

Cada cifra es `git diff --shortstat --no-renames` contra el commit de partida del intento, sin nada sin trackear ni binarios al cerrar.

| Intento | Commits | Líneas |
|---|---|---|
| 0 · planificación (propuesta, spec, diseño, tareas) | `ed113f9` | 404 |
| 1 · apply, lotes 1-5 | `718d25a`, `8443dd3` | 425 |
| 2 · verify, más la corrección de W-1 en el diseño | `5eb59be`, `c60116a` | 109 |
| 3 · archivo, parte revisable (fusión de RQ-ZS-22 + este informe) | el de este intento | medida en el asiento |
| 4 · archivo, mudanza de la carpeta a `archive/` (renombrados, sin carga de revisión) | el de la mudanza | medida en el asiento |

El archivo va en dos intentos, por la regla del archivo de `CLAUDE.md` (E-150): lo revisable dentro del techo de 800 y la mudanza aparte.

## Comprobaciones

- Sobre `8443dd3`, repetidas por el verify sobre la misma rama: `npm test` salida 0 (237 ficheros pasados y 2 omitidos; 3.651 pruebas pasadas, 7 omitidas, 0 fallidas), `npm run typecheck` salida 0, `npm run lint -- --max-warnings 165` salida 0 (165 avisos, en el techo, ninguno nuevo), detector de citas salida 0.
- El orquestador volvió a ejecutar `sync.modificados.test.ts` y `sync.test.ts` tras el apply: 20 de 20.
- **Mutaciones** del apply (16 en rojo, una equivalente) y, por separado, del verify: quitar `managed_by_app = false` de la marca, quitar la caída, leer el detalle dentro del bucle de paginación (regla de mutación 1), solape a cero y ordenación anulada, todas en rojo y restauradas.
- Regla invariable 13: el cambio no toca `apps/desk/src`.
- Verify: **PASS con avisos**, 0 CRITICAL, 5 WARNING, 3 SUGGESTION (`verify-report.md`).

## Lo que queda abierto (del verify)

- **W-1 · Coste en régimen.** Corregido en `design.md:17`, no en el código. La ventana va de «marca − 15 min» a «ahora», y la marca es la última modificación de Zoho, no el reloj: con Zoho quieto, cada ciclo repite una búsqueda y relee al menos un ticket por detalle, en los dos procesos que llaman a `syncRecent`. Son como mínimo dos peticiones por ciclo donde antes había una. Que no comprometa la cuota de la API es **hipótesis**. La mejora conocida —no releer el detalle cuando el `modified_time` de la réplica ya coincide con el de la búsqueda— no está hecha.
- **W-2 · Tres escenarios con prueba parcial:** el tope de paginación no afirma el prefijo ni la marca siguiente; la fila gestionada por la app sólo la cubre la prueba de la guarda en `packages/zoho-sync/src/db/repo.test.ts:32`; las columnas promovidas se comprueban con `closed_time` y `serial`.
- **W-3 ·** Sin prueba de réplica con todas las filas inelegibles (sí de réplica vacía).
- **W-4 ·** `apply-progress.md` registra el rojo previo global (14 de 15), no por tarea.
- **W-5 ·** El lint queda en el techo exacto de 165 avisos.
- **S-1 ·** El comparador de `sync.ts:410` devuelve 0 si falta `modifiedTime` en un elemento de la búsqueda; sin prueba. **S-2 ·** Quitar la deduplicación explícita es un mutante equivalente. **S-3 ·** El escenario del cierre no se prueba literalmente con 100 tickets por delante.
- **Hipótesis sin verificar hasta desplegar:** que el token del worker tenga el permiso de búsqueda (`Desk.search.READ`); que `/tickets/search` con ese token devuelva `id` y `modifiedTime` por elemento; que la latencia del índice de búsqueda de Zoho sea inferior a 15 minutos. Si falta el permiso, el sistema queda como antes del cambio y lo dice en el log en cada ciclo.
- **Límite declarado:** 1.000 o más tickets modificados dentro de una misma franja de 15 minutos no progresan; el remedio es `backfillTickets`.
- **Fuera de alcance:** los tickets nº 689, 880, 881 y 882. Su `modifiedTime` en Zoho (2025-10-29, 2026-08-27, 2026-03-30 y 2026-03-30) es anterior a la fecha en que salieron de la ventana. Que sean filas con `managed_by_app` es **hipótesis**.

## Tareas de persona — archivar NO las da por hechas

| Tarea | Dueño | Cuándo |
|---|---|---|
| Ejecutar `backfillTickets` una vez. La marca de agua no recupera lo ya perdido: el máximo de la réplica ya pasó del 2026-10-02 | Responsable del despliegue | Tras desplegar |
| Revisar el log del primer ciclo. Si aparece `Zoho /tickets/search <estado>: el ciclo cae a la página 1 por -recentThread`, ampliar el permiso del token | Responsable del despliegue | Tras desplegar |
| Comprobar que el ticket nº 884 figura cerrado | Responsable del despliegue | Tras el relleno |
