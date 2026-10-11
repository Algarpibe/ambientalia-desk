# Tareas: la ejecución rechazada de la migración responde `409` con mensaje claro

Cambio `rechazo-migracion-409` (F1F-01, `cierra: no`). Un solo lote de apply. Orden estricto de `strict_tdd`: rojo, verde, integración, mutaciones, documentación, reglas, cierre. Cada casilla se marca sólo con su resultado anotado en `apply-progress.md`. Las líneas son las del diseño (`openspec/changes/rechazo-migracion-409/design.md`).

## Review Workload Forecast

Líneas estimadas (inserciones + borrados): `migracionTicketsAbiertos.ts` 13, `routes/admin.ts` 17, la prueba de ruta ~62, la integración 4 y `DEPLOY.md` 8: unas **104**, más el informe del apply (se suma, no es extra).

Riesgo: bajo frente a 400 y frente a 800 (válvula 720). Partir: **no**. Un solo lote. La fusión del delta en `openspec/specs/zoho-sync/spec.md` es del archive y se mide allí, no se estima.

## 1. Rojo (D-3)

- [x] 1.1 Al final de `apps/desk/server/migracionTicketsAbiertosRuta.test.ts` (tras la línea 196, sin importaciones nuevas) escribir `mensajeRechazo`, `esUpdate`, `conGancho`, `adelantar` y `lanzar`, y los cinco casos del D-3 (rechazo, otro error, posición del interruptor, posición de la negativa, registro).
- [x] 1.2 Ejecutar `npx vitest run apps/desk/server/migracionTicketsAbiertosRuta.test.ts` **antes de tocar producto** y anotar el rojo real: caso 1 (esperado `500` y `{ error: 'Error interno' }`) y caso 5 (esperado `warn` sin llamadas y `error` con una), con el mensaje de fallo literal. Anotar también que los casos 2, 3 y 4 nacen verdes (caracterizan lo que no debe cambiar) y que su rojo se demuestra por mutación en la tarea 4.

## 2. Verde (D-1, D-2)

- [x] 2.1 D-1: en `apps/desk/server/db/migracionTicketsAbiertos.ts:90` lanzar `new MigracionAdelantadaError(t.number)` en sitio; tras la línea 95, una línea en blanco y la clase exportada, con el mismo texto de mensaje.
- [x] 2.2 D-2: en `apps/desk/server/routes/admin.ts` la línea 1 (importar `ErrorRequestHandler`), la 234 (importar `MigracionAdelantadaError`) y la 232 (`}), rechazoDeMigracionAdelantada)`) en sitio; tras la línea 255, el manejador `const` con `instanceof`, `logger.warn` y el cuerpo `{ error, motivo: 'otra-ejecucion' }`.
- [x] 2.3 Completar **dentro de la línea** el comentario de `apps/desk/server/routes/admin.ts:219` para que nombre también el `409` de la ejecución adelantada; sin añadir ni quitar líneas.
- [x] 2.4 Ejecutar la prueba de ruta: los cinco casos en verde. Ejecutar `npm run typecheck` (hipótesis del diseño); si los tipos rechazan la cadena, aplicar la alternativa escrita (`}), rechazoDeMigracionAdelantada as unknown as RequestHandler)` en la línea 232) y anotarlo.

## 3. Integración (D-4)

- [x] 3.1 En `apps/desk/server/db/migracionConcurrente.integration.test.ts`, línea 6 (importar `MigracionAdelantadaError`) y línea 162 (`expect(rb.error).toBeInstanceOf(MigracionAdelantadaError)` antes de la aserción del texto), en sitio; el fichero conserva 243 líneas.
- [x] 3.2 Ejecutarla con `TEST_DATABASE_URL` (PostgreSQL 17 real local que facilita el orquestador) y anotar el resultado; ejecutarla sin la variable y anotar que se salta.

## 4. Mutaciones (D-5, regla de mutación 1)

Una a una. Se parte de una copia del fichero tras la tarea 2, hecha en un directorio temporal **fuera del repositorio** (hay cambios sin commitear: no se usa `git checkout --`). Tras cada mutación: `npx vitest run apps/desk/server/migracionTicketsAbiertosRuta.test.ts`, anotar prueba a prueba qué se puso rojo, restaurar desde la copia y comprobar con `git diff` que el fichero vuelve a ser el del paso 2.

- [x] 4.1 M1: quitar el manejador de la cadena (línea 232). Esperado: casos 1 y 5 en `500`.
- [x] 4.2 M2, **mutación de POSICIÓN** (regla de mutación 1): poner el manejador delante del principal. Esperado: casos 1 y 5 en `500`.
- [x] 4.3 M3: sin `instanceof` (caza cualquier error). Esperado: caso 2 con `409`.
- [x] 4.4 M4: no llamar a `next(err)` con los demás errores. Esperado: caso 2 sin respuesta (agota el plazo).
- [x] 4.5 M5: devolver la línea 90 a `new Error`. Esperado: casos 1 y 5; y la integración, sólo con `TEST_DATABASE_URL`.
- [x] 4.6 M6: otro estado en vez de `409`. Esperado: caso 1.
- [x] 4.7 M7: quitar el parámetro `next` (aridad 3). Esperado: casos 1 y 5 en `500`. Anotar que los casos 3 y 4 no los pone rojos ninguna mutación (un manejador de error no corre en el flujo normal): fijan los dos escenarios de la especificación.

## 5. Documentación (D-6)

- [x] 5.1 Reescribir `DEPLOY.md:688-691` en sitio con el texto del D-6 (la línea 687 queda idéntica; se retiran «Lectura de código, no medido por HTTP» y la pregunta abierta). Comprobar con `wc -l DEPLOY.md` que conserva 693 líneas.

## 6. Reglas de mutación 3 y 4

- [x] 6.1 Regla de mutación 3: dejar escrito en `apply-progress.md` que el cliente no toma decisiones nuevas, comprobado con `grep -rn "migrar-tickets-abiertos" apps/desk/src` (sin resultados); el `409` lo impone `apps/desk/server/routes/admin.ts:232`.
- [x] 6.2 Regla de mutación 4: `git diff --numstat` y `wc -l` por fichero; esperado `migracionTicketsAbiertos.ts` 106, `routes/admin.ts` 266, la prueba de ruta ~258, la integración 243 y `DEPLOY.md` 693; ninguno cambia de número de línea salvo por el final.
- [x] 6.3 Barrido del D-8 **comprobado, no afirmado**: `grep -rnoE "(migracionTicketsAbiertos|routes/admin)\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio y lectura de cada resultado contra el fichero, más un segundo pase de abreviadas y de «línea 90» en prosa. Anotar cita a cita si sigue siendo cierta (la tabla del D-8 es la hipótesis).

## 7. Cierre

- [x] 7.1 `npm test` y `npm run typecheck` en verde.
- [x] 7.2 `npm run lint -- --max-warnings 165` en verde (margen 0: un aviso nuevo lo rompe; hipótesis de `no-use-before-define` y de `_req` a confirmar).
- [x] 7.3 Medida del intento: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear; registrar esa cifra (techo 800, válvula 720).
- [x] 7.4 Tras el commit del orquestador, ejecutar el detector de citas y anotar el resultado.

## Mapa tarea → escenario de RQ-ZS-23 o decisión

| Tarea | Escenario o decisión |
|---|---|
| 1.1, 1.2 | «La ejecución rechazada responde 409 con su cuerpo» y «Otro error cualquiera sigue dando 500» (casos 1, 2, 5; D-3) |
| 1.1, 4.7 | «Con el interruptor apagado se ve el 403» y «Con negativa se ve el 409 del informe» (casos 3 y 4; D-3) |
| 2.1 | D-1; «Solape, una confirma y la otra se rechaza» (tipo propio, mismo texto) |
| 2.2, 2.3, 2.4 | D-2 y enfoque técnico |
| 3.1, 3.2 | D-4; «Solape…» y «Un marcador por ticket» sobre PostgreSQL real |
| 4.1 a 4.7 | D-5 (M1 a M7) y regla de mutación 1 |
| 5.1 | D-6 |
| 6.1 a 6.3 | D-8 (reglas 13, mutación 3 y 4) |
| 7.1 a 7.4 | Criterios de éxito de la propuesta |
| (archive) | D-7: fusión del delta de `specs/zoho-sync/spec.md`; «Una ejecución posterior…» y «La pasada en seco…» no cambian |

## Tareas de personas — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1).

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Nombrar al suplente | Gerencia | `DEPLOY.md:665` |
| Responder E-208: quién lanza la última sincronización completa | Gerencia | `docs/sdd/ENTRADA.md:2047` |
| Cotejo de la hoja de Google | Gerencia | `DEPLOY.md:693` |
| Ejecución del 12/12 en producción | Gerencia o su suplente | `DEPLOY.md:663-693` |
