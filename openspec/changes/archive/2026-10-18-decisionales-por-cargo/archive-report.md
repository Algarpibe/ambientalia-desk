# Informe de archivo — `decisionales-por-cargo` (F1C-05, `cierra: no`)

**Qué parte de F1C-05 cubre y qué deja fuera:** cubre los Decisionales por cargo de la fila «C10 permisos por cargo»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:103`), construidos detrás de `DECISIONALES_POR_CARGO`, que nace
cerrado (`decision/f1c05-decisionales-por-cargo`). Deja fuera el propietario del registro, aplazado por la consecuencia 5 de
`decision/c10-permisos-cargo`: por eso `cierra: no`. Con el interruptor apagado no cambia nada en la aplicación.

## Qué quedó construido

- **Regla pura** `packages/shared/src/decisionales.ts` (nueva, exportada al final de `index.ts`): área de decisión con la
  tabla de mixtas (`rechazo_revision` → Servicio Técnico; `rechazo_comercial` y `rechazo_garantia` → Comercial, la segunda
  como excepción a la regla del origen); cargos por área, con el Especialista técnico sólo con el Coordinador vacante; el
  tipo se resuelve por id; la lista corta conserva su cargo; el administrador pasa; sin cargo, no. `cargos.ts` no se toca.
- **Interruptor** `DECISIONALES_POR_CARGO`, sólo con el literal `true` (`packages/zoho-sync/src/config.ts:124`; interfaz en
  `:66`, sin desplazar citas).
- **Servidor:** el `403` de Decisionales en `apps/desk/server/services/ticketService.ts:131`, detrás del `409` de estado,
  del `403` de área y del `403` de cargo, y antes de todo `422`; apagado no consulta nada. El contexto lo calcula
  `apps/desk/server/services/decisionales.ts:10-13` con `destinatariosDeCargoPermiso` (usuarios activos).
- **Ruta** `GET /api/permisos/decisionales` (`apps/desk/server/routes/permisosDecisionales.ts:16-17`), con sesión.
- **Cliente:** `TransitionPanel.tsx:55-57` filtra con `puedeEjecutarTransicionConDecisionales` y el contexto del servidor;
  si la ruta falla, contexto apagado.
- **`DEPLOY.md` §15** (`DEPLOY.md:754-774`): qué enciende, qué se rompe, no antes del 14/12/2026, asignar los cargos antes,
  y la línea para el fichero de ejemplo de entorno.

Las 14 Decisionales con su área de decisión, y quién las ejecuta encendido, están en la tabla de `proposal.md` §3 (medida
sobre `7ff08c8`, caso B para sus números de línea): 6 de Servicio Técnico, 7 de Comercial y `liberacion_sin_factura` con la
lista corta.

## Specs vivas

`openspec/specs/permissions/spec.md`: RQ-PM-28 a RQ-PM-31 añadidos **al final** (892 → 1.034 líneas, +142 −0), con un
script de un solo uso (`herramientas/fusiona-dpc.mjs`, fuera del repositorio) que quita el prefijo «Requirement: » y los
separadores `---` de la delta —la spec viva escribe `### RQ-PM-NN · …` sin separadores desde RQ-PM-23— y comprueba que
cada bloque vivo es idéntico al de la delta transformada. Ninguna capacidad nueva (R-2). Ningún bloque previo se mueve: el
barrido de citas a `permissions/spec.md` con línea mayor que 892 no encontró ninguna.

## Regla de mutación 4

`ticketService.ts` 3/3, `app.ts` 2/2, `testing/appHarness.ts` 2/2 y `TransitionPanel.tsx` 4/4 (inserciones = borrados):
ninguna línea de código se mueve. `config.ts` +2 −1 mueve sólo sus dos últimas líneas, que nadie citaba. `index.ts`,
`config.test.ts`, `client.ts`, `DEPLOY.md` y la spec viva sólo crecen al final.

## Intentos (registro de `gentle-ai sdd-attempt`)

| # | Unidad | Commits | Medida (`--no-renames`) |
|---|---|---|---|
| 1 | planificación 1 | `e4ed3c0` | 317 contra `7ff08c8` |
| 2 | planificación 2 | `3c691e0` | 172 |
| 3 | lote 1 | `015a874` | 270 |
| 4 | lote 2 | `0f7c19b` | 333 |
| 5 | verify | `b45195c`, `3c88d08` | 117 |
| 6 | archive | este commit y el de la reconciliación | revisable: la fusión (142) y este informe; el resto es la mudanza |

Ninguno pasó de la válvula de 720; nada sin trackear en ninguno.

## Códigos, paquete y migración

- Cada intento de código cerró con `npx vitest run`, `npm run typecheck`, `npx eslint .` (0 errores, los 165 avisos de
  partida) y el detector de citas en 0, en una sola cadena; los del cierre van en el informe de la tanda.
- Paquete: `index-a-eCb2uc.js` 419.482 bytes → `index-BOdjeBia.js` 420.931, **+1.449**.
- Migración: ninguna. Escrituras en datos de producción: ninguna.

## Mutaciones

22 ejecutadas, todas restauradas: 20 rojas y 2 que sobreviven por diseño. **M7c** (la guarda nueva delante del `403` de
cargo de la lista corta) es equivalente: la regla nueva no reclama la lista corta, así que los dos `403` nunca coinciden;
lo fija M6a+M7c, roja. **M6a en el servidor** sobrevive porque el `403` de cargo, más estricto, va antes; la caza la prueba
pura. El verify reprodujo M2 y M5a y confirmó la equivalencia de M7c. Detalle en `apply-progress.md`.

## Avisos del verify y su destino

- W1, forma de `apply-progress.md`: no usa la plantilla «TDD Cycle Evidence», pero registra el rojo y el verde de cada tarea
  por lote. Sin destino.
- W2, cita de la llamada de la ruta: corregida en su línea (`b45195c`).
- S1, una consulta por transición con el interruptor encendido, también en las no Decisionales: aceptable, RQ-PM-28 sólo
  exige cero apagado. Sin destino.
- S2, números de línea de `proposal.md` medidos sobre `7ff08c8`: caso B, se citan aquí con su revisión.
- S3, el rango de `422` de `proposal.md:41`: corregido en su línea (`b45195c`).
- Además, cuatro citas del propio `verify-report.md` caían en línea vacía y bloquearon el detector al commitearlo: se
  repararon (`3c88d08`).
- El `verify-report.md` no empezaba por el sobre `gentle-ai.verify-result/v1` y `gentle-ai sdd-status` dejaba el archivo
  bloqueado; se añadió en el intento de archivo, con las huellas de las salidas de test y typecheck del lote 2 sobre `0f7c19b`.

## Tareas de persona — archivar no las da por hechas

| Tarea | Dueño | Destino |
|---|---|---|
| Asignar `cargo_permiso` a Director Técnico, Especialista técnico, Director Comercial y Coordinadora Comercial antes de encender | Administrador de la aplicación | Antes de encender |
| Añadir la línea de `DECISIONALES_POR_CARGO` al fichero de ejemplo de entorno (`DEPLOY.md` §15) | Persona con acceso al fichero | Con el despliegue |
| Encender el interruptor, no antes del 14/12/2026 | Persona con acceso a producción, por orden de Gerencia | Enero |
| Actualizar M1.9 del maestro al encender | Supervisión → Gerencia | Expediente siguiente |
| Revisar los supuestos S-1 a S-6 (`proposal.md` §9) | Gerencia, lista semanal | Una semana |
| Pruebas en la app | — | Apagado no hay nada que ver; encendido, a la lista acumulada |

## Texto para Supervisión

1. **F1C-05 sigue en curso** (`cierra: no`): Decisionales por cargo construidos y archivados detrás de
   `DECISIONALES_POR_CARGO`, apagado; queda el propietario del registro.
2. **Despliegue:** variable nueva `DECISIONALES_POR_CARGO`, que debe quedar **ausente** al publicar; su línea para el fichero
   de ejemplo está en `DEPLOY.md` §15. Sin migración.
3. **`rechazo_garantia`** queda en Comercial como excepción expresa a la regla del origen: su origen es de Compras
   (`R08.4.md:4537`) y Compras no tiene Director ni Coordinador.
4. **Maestro:** M1.9 (`R08.4.md:4526`) dice que el cargo sólo restringe «algunas transiciones»; al encender, las 13
   Decisionales sin lista corta pasan a ser de Director o Coordinador. No cambia nada hasta entonces (`toca_maestro: no`).
