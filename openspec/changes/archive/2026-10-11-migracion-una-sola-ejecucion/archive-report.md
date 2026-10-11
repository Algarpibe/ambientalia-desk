# Archive · `migracion-una-sola-ejecucion` (F1F-01, `cierra: no`)

**Fecha:** 2026-10-11 · **Rama:** `migracion-una-sola-ejecucion` · **Partida:** `7afba67` · **Informe escrito por el orquestador**, con
cifras medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué parte de la fila F1F-01 cubre, en una línea:** la confirmación, por medición y con prueba, de que una segunda ejecución
simultánea de la migración se rechaza sin escribir, y el procedimiento escrito en `DEPLOY.md` de quién la ejecuta y en qué orden.
**Deja fuera** nombrar al suplente, la respuesta a E-208 (quién lanza la última sincronización completa), el cotejo de la hoja de
Google y la ejecución en producción, que son tareas de persona. Por eso declara `cierra: no` y F1F-01 sigue en curso.

## Qué decisión construye

`decision/quien-ejecuta-la-migracion-confirmada-11-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`, commit `7afba67`),
que confirma `decision/quien-ejecuta-la-migracion` del 06/10. Esta última la tiene Supervisión en el árbol sin versionar.

## Medición previa, antes de construir

Hecha por el orquestador con PostgreSQL 17.5 real (binario embebido, fuera del repositorio) y dos conexiones reales, llamando a
`migrarTicketsAbiertos` con `aplicar: true`. **No se midió la ruta HTTP.**

- **Solape forzado:** la segunda ejecución quedó esperando un bloqueo de fila; al confirmar la primera, la segunda fue rechazada con
  el mensaje de `apps/desk/server/db/migracionTicketsAbiertos.ts:90`. Un marcador por ticket, los tres tickets gobernados.
- **Carrera libre, 30 rondas sobre 4 tickets:** 30 de 30 dieron una confirmada y una rechazada; ningún ticket con un número de
  marcadores distinto de 1.
- **Limitación de aquella medición:** ese Postgres se inicializó en WIN1252 y `migrate` omitió dos `ALTER TABLE` de `tickets` ajenos
  a lo medido. Las ejecuciones posteriores de la prueba usaron un servidor en UTF8, sin sentencias omitidas.

**Conclusión: ya se rechaza.** Por la decisión, no se construyó bloqueo: se dejó la prueba que lo fija.

## Qué quedó construido

- **Prueba de integración nueva**, `apps/desk/server/db/migracionConcurrente.integration.test.ts` (243 líneas, cuatro casos): solape
  forzado, carrera libre de 10 rondas con aserción tolerante, ejecución posterior y pasada en seco con otra ejecución en curso. Se
  salta sin `TEST_DATABASE_URL`; en el CI corre (`.github/workflows/ci.yml:45-47`).
- **Texto del rechazo fijado en pg-mem:** `apps/desk/server/db/migracionTicketsAbiertos.test.ts:174`, dentro de la línea.
- **Procedimiento en `DEPLOY.md`**, §14 (`DEPLOY.md:663-693`), y un puntero dentro de `DEPLOY.md:356`. Dice quién abre el interruptor y
  lanza la ejecución (Gerencia; suplente POR NOMBRAR) y el orden: copia previa, abrir el interruptor, una sola ejecución, comprobar y
  volver a cerrarlo.
- **RQ-ZS-23** en `openspec/specs/zoho-sync/spec.md:1368`.
- **Ningún fichero de producto cambia:** ni el ejecutor, ni la ruta, ni el interruptor, ni el esquema. No hay permiso nuevo.

## Hallazgo declarado y NO construido

**La ejecución rechazada no recibe por HTTP un rechazo claro.** Es lectura de código, no medido: el rechazo es un `Error` genérico y
el manejador central responde `500` con «Error interno» a todo lo que no sea un error conocido (`apps/desk/server/app.ts:90-92`); el
mensaje en español sólo queda en el registro del servidor. No se cambió porque el encargo era dejar la prueba y no construir más. El
procedimiento de `DEPLOY.md` lo dice y explica cómo comprobar que no se escribió nada. Sube a Gerencia como pregunta.

## Intentos

Medida = `git diff --shortstat --no-renames` contra el inicio de cada intento más `wc -l` de lo nuevo sin trackear. En los tres
primeros el registro anotó lo mismo que git.

| Intento | Qué | Medida | Commit |
|---|---|---|---|
| 1 | Propuesta, especificación, diseño y tareas | 385 | `3731e92` |
| 2 | Apply, lote único | 349 | `1ba5498`, `4f233dc` |
| 3 | Verify | 88 | `52d204a` |
| 4 | Archivo | este commit | — |

## Fusión del delta

Por script (`fusiona.mjs`), sólo ADDED, añadido al final de la spec viva: no desplaza ninguna línea existente.
`openspec/specs/zoho-sync/spec.md` pasa de 1.366 a 1.419 líneas (53 inserciones). El bloque fusionado es idéntico al del delta,
comprobado con `diff`. **Parte revisable medida antes de aplicar:** 53 líneas de fusión más este informe, por debajo de 800.

## Verificación

- **Verify:** PASS CON AVISOS, 0 CRITICAL, 2 WARNING y 4 SUGGESTION (`verify-report.md`).
  - W1: el orden marcador/`UPDATE` sólo lo fija pg-mem; la integración no lo cubre. Es de RQ-ZS-17, no de este cambio. Queda así.
  - W2: una cita del paso 4 del procedimiento no respaldaba su frase. **Corregida** en `52d204a` (`DEPLOY.md:684`).
- **Mutaciones**, todas restauradas, fichero de producto con diff vacío:
  - M1, sin el `throw` de la línea 90: rojos el solape y la carrera de la integración y la prueba de pg-mem de la línea 168.
  - M2, sin `AND managed_by_app = false`: los mismos tres. Reproducida por el orquestador.
  - M3, sin la transacción: rojos el solape, la carrera y la pasada en seco de la integración, y tres pruebas de pg-mem. Reproducida
    por el orquestador. En la carrera libre el rojo depende del azar; el solape forzado lo da siempre.
  - Dos del verify: `=== 0` por `> 1`, las mismas tres que M1; marcador y `UPDATE` invertidos, sólo la prueba de orden de pg-mem (W1).
- **`strict_tdd`, con la salvedad declarada:** son pruebas de caracterización y nacieron verdes; su rojo es el de las mutaciones.
- **Regla de mutación 1:** no aplica, no se añadió ninguna guarda. **Regla de mutación 3:** el cliente no toma ninguna decisión;
  `apps/desk/src` no llama a la ruta.
- **Códigos al cerrar este intento:** se re-ejecutan con el commit de archivo y se anotan en el informe al usuario.

## Qué está probado, y dónde

- **Sólo con PostgreSQL real** (en el CI; en local, con un servidor desechable): que la segunda ejecución espera el bloqueo de fila,
  que su `ROLLBACK` no deja ningún marcador y la carrera libre. En local, con ese servidor, la suite entera pasó sin nada saltado:
  269 ficheros y 4.398 pruebas.
- **Con pg-mem:** el texto del rechazo, el `ROLLBACK` y la ausencia de `COMMIT`, por el espía de SQL.
- **Sin probar:** la respuesta HTTP de la ejecución rechazada; un aislamiento distinto del de por defecto; la reversión por SQL; la
  ejecución en producción.

## Supuestos reversibles

En la propuesta, S1 a S7: no se construye bloqueo (S1); el procedimiento va al final de `DEPLOY.md` (S2); «lanzar» es la llamada a la
ruta, porque no hay botón (S3); el `500` se documenta y no se cambia (S4); el mensaje se fija en la prueba existente (S5); la
integración fuerza el solape (S6); la copia previa es la de EasyPanel (S7).

## Citas

Ningún fichero existente cambia de número de líneas salvo por el final: `DEPLOY.md` (661 → 693), la spec viva (1.366 → 1.419). La
prueba de pg-mem conserva 187. Ninguna cita existente se desplaza. Abreviadas rotas del detector: 13, las mismas que `main`.

## Lo que esta rama NO toca y hay que hacer en `main` al fusionar

- `docs/sdd/RECONCILIACION.md`: regenerarlo; F1F-01 sigue en curso.
- El traspaso a Supervisión, con la pregunta del `409` para la bandeja (`docs/sdd/ENTRADA.md` no se toca desde esta rama).

## Tareas de personas — fuera del recuento

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Nombrar al suplente | Gerencia | `DEPLOY.md:665` |
| Responder E-208: quién lanza la última sincronización completa | Gerencia | `docs/sdd/ENTRADA.md:2047` |
| Decidir si la ejecución rechazada debe recibir un `409` con mensaje claro | Gerencia | este informe, «Hallazgo» |
| Ejecución del 12/12 en producción | Gerencia o su suplente | `DEPLOY.md:663-693` |

Archivar no las da por hechas.
