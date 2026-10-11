---
tanda: F1F-01
motivo: ""
capacidad: [zoho-sync]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: la migración de tickets abiertos, una sola ejecución

## Intención

`decision/quien-ejecuta-la-migracion-confirmada-11-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`) confirma la respuesta del 06/10 y autoriza el remanente de F1F-01 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:125`). Esa respuesta pide dos cosas: que `DEPLOY.md` diga quién abre `MIGRACION_TICKETS_HABILITADA` y lanza la ejecución del 12/12, con su orden; y que la construcción confirme que una segunda ejecución simultánea se rechaza, y si no, que construya el bloqueo. La medición dice que ya se rechaza. Este cambio deja la prueba que lo fija y el procedimiento escrito. No construye bloqueo.

Pasaje del maestro: ninguno. El cambio sale de una decisión de Gerencia, no de un apartado del maestro.

`cierra: no`: a la fila le quedan tareas de persona —nombrar al suplente, responder E-208 (`docs/sdd/ENTRADA.md:2047`), el cotejo de la hoja de Google y la ejecución en producción (`openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/archive-report.md:5`).

## Medición previa

Hecha por el orquestador antes de construir. No se midió la ruta HTTP.

- **Con qué:** PostgreSQL 17.5 real (binario embebido, fuera del repositorio), dos conexiones reales de `pg`, esquema creado con
  `reorgToDesk` + `migrate` del propio repositorio, llamando a `migrarTicketsAbiertos`
  (`apps/desk/server/db/migracionTicketsAbiertos.ts:63-95`) con `aplicar: true`.
- **Escenario 1, solape forzado** (A se detiene tras su primer `UPDATE tickets` con el bloqueo de fila tomado; B arranca
  entonces): B quedó esperando un bloqueo (1 sesión con `wait_event_type = 'Lock'`); al soltar A, A terminó
  `aplicado: true, migrables: 3` y B fue rechazada con «El ticket 4100 pasó a estar gobernado entre la lectura y la escritura:
  se deshace la migración entera» (`apps/desk/server/db/migracionTicketsAbiertos.ts:90`); marcadores por ticket: 1, 1, 1; los
  3 tickets gobernados.
- **Escenario 2, carrera libre**, 30 rondas de dos ejecuciones lanzadas a la vez sobre 4 tickets: 30 de 30 dieron «una correcta
  (migrables = 4) + una rechazada»; tickets con un número de marcadores distinto de 1: 0.
- **Por qué ocurre:** la escritura va en una transacción (`apps/desk/server/db/transaccion.ts:13-28`) y el
  `UPDATE … WHERE id = $1 AND managed_by_app = false RETURNING id` (`apps/desk/server/db/migracionTicketsAbiertos.ts:84-89`)
  espera al bloqueo de fila de la otra transacción y, al confirmarse ésta, ya no casa: 0 filas, salta el `throw` de la línea 90
  y el `ROLLBACK` deshace también los marcadores que la perdedora había insertado.
- **Limitación declarada:** el Postgres embebido se inicializó con codificación WIN1252 y `migrate` omitió dos `ALTER TABLE` de
  `tickets` cuyo comentario lleva una flecha (columnas ajenas a esta medición). No afecta a lo medido, pero se dice.

**Conclusión:** ya se rechaza. Por la decisión, no se construye bloqueo: se deja la prueba que lo fija.

## Corrección al encargo: el `throw` SÍ tiene prueba

El encargo afirmaba que ninguna prueba cubre el `throw` de la línea 90. Comprobado contra el fichero, no es así: `apps/desk/server/db/migracionTicketsAbiertos.test.ts:168-177` ya vuelve gobernado un ticket entre la lectura y el `UPDATE` con el espía y exige rechazo, `ROLLBACK` al final y ningún `COMMIT`. Lo que no fija es el **mensaje**: la aserción de `apps/desk/server/db/migracionTicketsAbiertos.test.ts:174` es un `rejects.toThrow()` sin texto, y por eso buscar «pasó a estar gobernado» en `apps/desk/server` sólo devuelve la línea del ejecutor. El punto 2 del alcance se reduce en consecuencia (S5).

## Alcance

### Dentro

1. **Prueba de integración nueva**, `apps/desk/server/db/migracionConcurrente.integration.test.ts`: Postgres real y dos conexiones; se salta sin `TEST_DATABASE_URL` y crea y borra su propia base, mismo molde que `packages/zoho-sync/src/db/liberacion.integration.test.ts:22-23` y `:56-71`. En el CI corre (`.github/workflows/ci.yml:45-47`, sobre la imagen de `.github/workflows/ci.yml:12`). Fija: exactamente una ejecución aplica; la otra se rechaza con el mensaje de la línea 90; un solo marcador por ticket; ningún marcador de la perdedora. El solape se **fuerza** envolviendo la conexión desde la prueba, sin tocar el ejecutor.
2. **Mensaje fijado en pg-mem:** la aserción de `apps/desk/server/db/migracionTicketsAbiertos.test.ts:174` pasa a exigir el texto del rechazo. Es un cambio dentro de la línea: el fichero conserva sus 187 líneas. pg-mem no revierte de verdad (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:13-15`): que la perdedora no deja nada escrito sólo lo prueba (1).
3. **Procedimiento en `DEPLOY.md`**, en una sección nueva al final (tras `DEPLOY.md:661`), y un puntero dentro de línea en el §11 (`DEPLOY.md:345-361`) sin cambiar su número de líneas. Contenido: quién abre el interruptor y lanza la ejecución (Gerencia; suplente por nombrar); el orden literal —copia previa → abrir el interruptor → una sola ejecución → comprobar → volver a cerrarlo—; qué ve quien lance una segunda ejecución y cómo comprobar, con una pasada en seco, que no se escribió nada. La copia previa es el botón de copia de EasyPanel de `desk-db` con el nombre de base `desk` (`docs/sdd/Paquete_de_Despliegue_2026-10-10b.md:224-225`).
4. **Delta de especificación:** un requisito ADDED, `RQ-ZS-23`, al final de `openspec/specs/zoho-sync/spec.md` (el último hoy es `openspec/specs/zoho-sync/spec.md:1275`, RQ-ZS-22).

### Fuera

- Permiso nuevo: la respuesta dice que basta un administrador; la ruta sigue como está (`apps/desk/server/routes/admin.ts:222`).
- El interruptor (`apps/desk/server/routes/admin.ts:250-255`), que nace cerrado y no se toca.
- Cualquier bloqueo explícito (advisory lock) y cualquier cambio en lo que se escribe en la base.
- Cambiar la respuesta HTTP de la ejecución rechazada (ver «Hallazgo»).
- Nombrar al suplente y responder E-208: son de Gerencia.

## Capacidades

- **Nuevas:** ninguna.
- **Modificadas:** `zoho-sync` — se añade RQ-ZS-23: de dos ejecuciones simultáneas con `aplicar=true`, a lo sumo una confirma; la otra se rechaza sin dejar marcador ni fila modificada. Una ejecución **posterior** a una ya confirmada no se rechaza: no encuentra nada que migrar y no escribe (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:121-131`). RQ-ZS-23 distingue los dos casos. RQ-ZS-17 a RQ-ZS-19 no cambian.

## Hallazgo que se declara y no se construye

**La ejecutora perdedora no recibe por HTTP un rechazo claro.** Es lectura de código, **no medido por HTTP**. El `throw` es un `Error` genérico; el manejador central sólo traduce `HttpError`, `OvYaAsociadaError` y `MulterError` (`apps/desk/server/app.ts:78-89`), y lo demás responde `500` con «Error interno» (`apps/desk/server/app.ts:90-92`). El mensaje en español sólo queda en el registro del servidor. No se arregla aquí: el encargo es dejar la prueba y no construir más. Sube a Gerencia como pregunta (¿debe recibir un `409` con mensaje claro?) y el procedimiento de `DEPLOY.md` lo dice tal cual.

## Reglas

- **Regla invariable 13:** el rechazo lo impone el servidor y el cliente no participa. La ruta no aparece en `apps/desk/src`: buscar `migrar-tickets-abiertos` en `apps/desk` sólo da `apps/desk/server/routes/admin.ts:222` y su fichero de pruebas.
- **`strict_tdd`, con salvedad declarada:** son pruebas de caracterización de un comportamiento que ya existe, así que nacen verdes. Su rojo se demuestra por mutación, y el resultado de cada una se anota en el `apply`: quitar el `throw` de la línea 90; quitar `AND managed_by_app = false` del `UPDATE`; quitar la transacción. Que las tres pongan roja la prueba de integración es **hipótesis** hasta ejecutarlas.
- **Regla de mutación 1:** no aplica, no se añade ninguna guarda.
- **Regla de mutación 4:** no se desplaza ninguna línea citada. Hay 285 apariciones de citas `DEPLOY.md:NNN` en 41 ficheros versionados (`git grep -oE`, medido por el orquestador), y por eso el procedimiento va al final y el puntero del §11 no añade líneas.

## Supuestos reversibles

| Nº | Supuesto | Por qué |
|---|---|---|
| S1 | No se construye bloqueo | La medición dice que ya se rechaza, y la decisión sólo lo pide en caso contrario |
| S2 | El procedimiento va al final de `DEPLOY.md`, no dentro del §11 | Insertar en medio desplazaría citas de todo lo que hay debajo |
| S3 | «Lanzar» es la llamada `POST /api/admin/migrar-tickets-abiertos?corte=…&aplicar=true` | No hay botón en la interfaz; la ruta es la única puerta (`apps/desk/server/routes/admin.ts:222`) |
| S4 | El `500` de la perdedora se documenta y no se cambia | Cambiarlo es construir más de lo encargado; queda como pregunta a Gerencia |
| S5 | El mensaje se fija en la prueba existente, no con una prueba nueva al final | La prueba que pedía el encargo ya existe; duplicarla no añade cobertura. Reversible: una prueba nueva al final tampoco desplaza líneas |
| S6 | La integración fuerza el solape en vez de confiar en la carrera libre | En carrera libre la segunda podría leer después del `COMMIT` de la primera y terminar sin escribir, que no es un rechazo: la prueba sería inestable |
| S7 | La copia previa del procedimiento es la de EasyPanel, no `POST /api/admin/respaldo` | El respaldo a S3 depende de un proveedor por elegir (`DEPLOY.md:413-416`) |

## Áreas afectadas

Los cuatro ficheros del alcance: la prueba de integración (nueva), una aserción de la prueba de pg-mem, `DEPLOY.md` y, al archivar, la especificación de `zoho-sync`. Ningún fichero de producto cambia: ni el ejecutor, ni la ruta, ni el esquema.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| La prueba de integración resulta inestable en el CI | Media | Solape forzado (S6), base propia por ejecución, plazos amplios |
| El rechazo depende del nivel de aislamiento por defecto de PostgreSQL | Baja | La prueba corre contra PostgreSQL real en el CI; si alguien cambia el aislamiento, se pone roja |
| Quien ejecute lea un `500` como fallo de la migración entera | Media | El procedimiento dice qué significa y cómo comprobarlo en seco; la pregunta del `409` sube a Gerencia |

## Vuelta atrás

Revertir el commit. No hay código de producto, ni esquema, ni dato: se retiran una prueba, el texto de una aserción, una sección de documentación y un requisito. El comportamiento de la migración es el mismo antes y después.

## Criterios de éxito

- [ ] La integración pasa en el CI y se salta en local sin `TEST_DATABASE_URL`.
- [ ] Las tres mutaciones se ejecutaron y su resultado, prueba a prueba, está escrito.
- [ ] `DEPLOY.md` nombra a quien ejecuta, el orden y qué ve la segunda ejecución; ninguna línea existente cambia de número.
- [ ] RQ-ZS-23 distingue la ejecución simultánea de la posterior.

## Tareas de personas — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1).

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Nombrar al suplente | Gerencia | `DEPLOY.md`, sección nueva, como «suplente por nombrar» |
| Responder E-208: quién lanza la última sincronización completa | Gerencia | `docs/sdd/ENTRADA.md:2047` |
| Decidir si la perdedora debe recibir un `409` con mensaje claro | Gerencia | Esta propuesta, «Hallazgo»; el orquestador la sube a la bandeja |
| Ejecución del 12/12 en producción | Gerencia o su suplente | `DEPLOY.md`, sección nueva |
