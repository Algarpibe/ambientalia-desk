# Apply-progress: rechazo-migracion-409 (F1F-01, `cierra: no`)

Lote único, intento 2. Todo hecho salvo 7.4 (el detector lo corre el orquestador tras el commit).

## Tareas
1.1, 1.2, 2.1 a 2.4, 3.1, 3.2, 4.1 a 4.7, 5.1, 6.1 a 6.3, 7.1 a 7.3 hechas. 7.4 sin marcar.

## Ciclo TDD
**Rojo previo** (`npx vitest run apps/desk/server/migracionTicketsAbiertosRuta.test.ts`, producto intacto, salida 1, 2 fallos de 35):
- caso 1: `AssertionError: expected 500 to be 409 // Object.is equality` (`migracionTicketsAbiertosRuta.test.ts:221`).
- caso 5: `expected "noop" to be called 1 times, but got 0 times` (`:257`; `warn` sin llamadas).
- casos 2, 3 y 4 nacieron verdes, como decía el diseño (caracterizan lo que no debe cambiar).
**Verde:** D-1 (clase y `throw` tipado), D-2 (manejador y cadena), prueba de ruta 35/35. Salida 0.
**Typecheck** pasa con el manejador en la cadena: la alternativa `as unknown as RequestHandler` NO hizo falta. Un primer typecheck falló sólo porque yo había olvidado el cambio de la línea 1 (`ErrorRequestHandler`); corregido.

## Integración (D-4)
Con `TEST_DATABASE_URL` (PostgreSQL 17 local): 4/4 en verde, salida 0. Sin la variable: 4 saltadas, salida 0.

## Mutaciones (copias en `$TEMP/m409/`; tras cada una `diff -q` contra la copia: "restored")
| M | Qué | Rojo | NO rojo |
|---|---|---|---|
| M1 | quitar el manejador de la cadena | caso 1 (`expected 500 to be 409`), caso 5 (`warn` 0 llamadas) | 2, 3, 4 |
| M2 | POSICIÓN: manejador delante del principal | caso 1 (500 vs 409), caso 5 (0 llamadas) | 2, 3, 4 |
| M3 | sin `instanceof` | caso 2 (`expected 409 to be 500`) | 1, 3, 4, 5 |
| M4 | sin `next(err)` | caso 2: `Test timed out in 5000ms` (la prueba tarda 5,2 s; la corrida, 26 s) | 1, 3, 4, 5 |
| M5 | `new Error("x")` en el ejecutor | ruta: casos 1 y 5; integración (con variable): solape (`expected Error: x to be an instance of MigracionAdelantadaError`) y carrera libre (`expected 'x' to contain 'pasó a estar gobernado'`) | 2, 3, 4; las otras 2 de integración |
| M6 | `400` en vez de `409` | caso 1 (`expected 400 to be 409`) | 2, 3, 4, 5 |
| M7 | aridad 3 (sin `next`) | caso 1 (500 vs 409), caso 5 | 2, 3, 4 |
Ninguna se escapó. Los casos 3 y 4 no los pone rojos ninguna mutación, como avisaba el diseño: un manejador de error no corre en el flujo normal. No hizo falta añadir casos.

## Documentación (D-6)
`DEPLOY.md:688-691` reescritas con el texto del diseño; la 687 idéntica; `wc -l` = 693; `git diff --numstat` 4/4. La cita `apps/desk/server/app.ts:90-92` del texto sigue siendo cierta (`:90` registro del error, `:92` el 500 «Error interno»).

## Regla de mutación 3
`grep -rn "migrar-tickets-abiertos" apps/desk/src`: sin resultados (salida 1). El cliente no toma decisiones nuevas; el `409` lo impone el servidor en `apps/desk/server/routes/admin.ts:232` (último eslabón) y lo prueba el caso 1.

## Regla de mutación 4
`git diff --numstat --no-renames a1fb802` y `wc -l` finales:
- `migracionTicketsAbiertos.ts`: +12/-1, 106 líneas (esperado 106; crece por el final desde 95; la 90 en sitio).
- `routes/admin.ts`: +15/-4, 266 (esperado 266; por el final desde 255; en sitio 1, 219, 232, 234).
- prueba de ruta: +67/-0, **263** (el diseño decía ~258; el ayudante y los casos escritos tal cual salen en 67 líneas, no 62; crece por el final desde 196).
- integración: +2/-2, 243. `DEPLOY.md`: +4/-4, 693.
Ninguna línea existente cambió de número.
**Barrido D-8** (`grep -rnoE "(migracionTicketsAbiertos|routes/admin)\.ts:[0-9]+(-[0-9]+)?"`, cada resultado leído contra el árbol): las citas a líneas 1 a 89 y 91 a 255 de los dos ficheros apuntan a líneas que no se movieron; `admin.ts:231` (`DEPLOY.md:690`, la negativa) sigue en la 231; `admin.ts:250-255` intacta; `admin.ts:234` (verify archivado) sigue siendo la importación; `migracionTicketsAbiertos.ts:92` (`migracionConcurrente.integration.test.ts:204`) sigue siendo `informe.aplicado = true`. `migracionTicketsAbiertos.ts:90` (spec viva `:1371`, `:1399`; archivados) sigue lanzando ese error (A); matiz del diseño confirmado: el texto ya no está en la 90 sino en la clase (línea 97 en adelante). `:84-90` (spec `:1380`) sigue siendo `UPDATE` y comprobación. Segundo pase de «línea 90» en prosa: `migracionConcurrente.integration.test.ts:185` («el texto de la línea 90») ya no es literalmente cierto —la 90 lanza el tipo, el texto está en la clase—; **no se edita** (el encargo fija sólo las líneas 6 y 162); lo valora el verify. El resto de ocurrencias está en archivados (caso B, ciertas de su fecha). No se editó ningún fichero vivo fuera de los cinco. Abreviadas (`:NN` sin fichero): no se enumeraron una a una; las citas completas cercanas apuntan a líneas no movidas, por lo que el desplazamiento es nulo.

## Cierre
- `npm test` (con `TEST_DATABASE_URL`): salida **0**, 269 ficheros / 4403 pruebas, 245 s.
- `npm run typecheck`: salida **0**.
- `npm run lint -- --max-warnings 165`: salida **0** (165 avisos, 0 errores: sin avisos nuevos; margen 0).
- Medida: `git diff --shortstat --no-renames a1fb802`: 5 ficheros, 100 inserciones, 11 borrados = **111** líneas; sin ficheros nuevos sin trackear antes de este informe. Con este informe (~55 líneas): ~166 contra el techo de 800.

## Desviaciones
- La prueba de ruta crece 67 líneas, no ~62. Sin consecuencia.
- Comentario de `admin.ts:219`: ampliado dentro de la línea («y `409` también si otra ejecución se le adelantó (`rechazoDeMigracionAdelantada`, RQ-ZS-23)»).
- Python no está disponible en el equipo: las ediciones se hicieron con la herramienta de edición y `cat >>`. Los avisos «LF will be replaced by CRLF» son del `autocrlf` y no cambian el diff.
- Pendiente para el verify: el comentario de `migracionConcurrente.integration.test.ts:185` (arriba). 7.4 (detector) es del orquestador.
