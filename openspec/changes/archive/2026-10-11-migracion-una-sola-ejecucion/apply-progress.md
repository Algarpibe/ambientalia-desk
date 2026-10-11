# Apply-progress: migracion-una-sola-ejecucion (F1F-01) · lote único, intento 2

Partida `3731e92`. Sin commit. Código de producto sin tocar (`git diff --stat -- apps/desk/server/db/migracionTicketsAbiertos.ts` vacío tras cada mutación y al final).

## Tareas
1 hecha · 2 hecha · 3.1 a 3.5 hechas · 4 hecha · 5 hecha · 6 hecha · **7 sin marcar**: códigos de salida y medida hechos, falta el detector de citas, que corre el orquestador tras el commit.

## Evidencia TDD (strict_tdd, con la salvedad declarada)
Pruebas de **caracterización**: nacen verdes, no hay rojo previo. Su rojo es el de las mutaciones M1-M3 (abajo).
- Tarea 1: `import { Pool } from 'pg'` bajo `apps/desk/server/db/`, `npm run typecheck` → exit 0. La hipótesis del diseño (`design.md:116`) se cumple; no hizo falta `createPoolFromUrl`.
- Tarea 2: línea 174 con `rejects.toThrow('pasó a estar gobernado')`; `wc -l` = 187; 13/13 verdes.
- Tarea 3: primera pasada con un fallo de MI aserción (`yaGobernados` es un objeto `{deZoho, nacidosEnLaApp}`, no un número); corregida a `migrables: 0`. Después, 4/4.
- Ajuste tras M3: si un caso falla a mitad, las ejecuciones lanzadas seguían escribiendo en segundo plano y contaminaban el caso siguiente; se añadió `quietas()` en los `finally` de los casos 1 y 4. No cambia lo que se afirma.

## Mutaciones (resultado REAL; restaurado con `git checkout --` tras cada una, diff vacío)
| | pg-mem (`migracionTicketsAbiertos.test.ts`, 13) | Integración caso 1 solape | caso 2 carrera | caso 3 posterior | caso 4 en seco |
|---|---|---|---|---|---|
| **M1** sin `throw` (l.90) | ROJA sólo la de la l.168: «promise resolved … instead of rejecting» | ROJO: «expected true to be false» (B cumple) | ROJO ronda 0: «expected [4,4] to deeply equal [0,4]» | verde | verde |
| **M2** sin `AND managed_by_app = false` (l.87) | ROJA sólo la de la l.168, mismo mensaje | ROJO: «expected true to be false» | ROJO ronda 0: «[4,4] vs [0,4]» | verde | verde |
| **M3** sin `enTransaccion` (l.68) | ROJAS 3: «marcador y UPDATE por ticket, dentro de una transacción» (sin `BEGIN`), la de la l.168 y «fallo forzado en el segundo UPDATE» («expected 'UPDATE' to be 'ROLLBACK'») | ROJO por sondeo agotado, 10 s: «ninguna sesión quedó esperando un bloqueo» (no se cuelga) | ROJO, pero **depende de la carrera**: cayó en la ronda 0 y, en otra pasada, en la 1 («expected [Array(5)] to deeply equal [c1_0…]»: marcadores duplicados) | verde | ROJO: «expected {…} to match object {aplicar:false,…}» (el UPDATE de A se autoconfirma y la seca ve 2 migrables, no 3) |
Contra `design.md:54-58`: se cumple todo. Diferencias: M1/M2 cayeron en el caso 2 desde la ronda 0 (la hipótesis decía «sólo las que solapen»); M3 en el caso 2 fue rojo las dos veces pero por azar de la carrera; el caso 4 cae con M3 (no estaba en la tabla). **Ninguna mutación quedó sin cazar.**

## Las pasadas de la integración (`TEST_DATABASE_URL`=PostgreSQL 17.5 local; sin mutar)
Primera tanda (antes de `quietas()`): pasadas 1-5, cada una `4 passed (4)`, exit 0, 5,3-5,8 s. Tanda final con el fichero definitivo: pasadas 1-6, cada una `4 passed (4)`, exit 0. Sin la variable: `4 skipped`, exit 0. Bases `migracion_it_*` sobrantes: 0.

## Sólo con PostgreSQL real
Que B **espere** un bloqueo de fila (`pg_stat_activity.wait_event_type = 'Lock'`), que el `ROLLBACK` deje 0 marcadores de la perdedora, y la carrera libre. pg-mem sólo fija el texto, el `ROLLBACK` y la ausencia de `COMMIT` por el espía.

## Regla de mutación 3 (regla 13): decisiones del cliente
| Decisión | Línea del servidor |
|---|---|
| Ninguna: `apps/desk/src` no llama a la ruta (0 ficheros) | n/a — el rechazo lo impone el servidor (`migracionTicketsAbiertos.ts:84-90`) |
`grep migrar-tickets-abiertos apps/desk` → `routes/admin.ts:222`, `migracionTicketsAbiertosRuta.test.ts:10` y `:15`, abiertos y comprobados.

## Regla de mutación 4
`DEPLOY.md`: línea 356 cambia de texto sin cambiar de número; 33 inserciones y 1 borrado; `@@ -356` y `@@ -661,0 +662,32`; las líneas 357 y 661 siguen siendo las mismas que en `HEAD`. Citas `DEPLOY.md:345-361`, `350-353`, `358-361`, `359-360` (9 fuera de este cambio): intactas. Citas `migracionTicketsAbiertos.test.ts:NNN` (archivadas, todas en cambios cerrados): el fichero conserva 187 líneas, ninguna se desplaza; la 174 sigue siendo la aserción del rechazo. Forma abreviada: sin ocurrencias nuevas. Citas de mi prueba comprobadas: `ts:90`, `:92`, `test.ts:13-15`, `liberacion.integration.test.ts:22-71`.

## Códigos de salida y medida
`npm test` exit 0 (266 ficheros pasan, 3 saltados; 4387 pruebas pasan, 11 saltadas) · `npm run typecheck` exit 0 · `npm run lint -- --max-warnings 165` exit 0 (165 avisos, 0 errores, ninguno mío).
Medida: `git diff --shortstat --no-renames 3731e92` = 2 ficheros, +34 −2 (= 36); `wc -l` sin trackear: prueba de integración 243. Total ≈ **279**, más este informe y las casillas de `tasks.md`. Techo 800.

## Contraste del orquestador, tras el commit `1ba5498`
- Tarea 7 cerrada: detector `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` → exit 0 (13 abreviadas informativas, las mismas que `main`; 0 cabeceras inválidas).
- Reproducido por el orquestador contra PostgreSQL 17.5 real: integración sin mutar 4/4; **M2** → rojos el caso 1 («expected true to be false»), el caso 2 («[4, 4]» frente a «[0, 4]») y la prueba de pg-mem de la línea 168; **M3** → rojos los casos 1, 2 y 4. Fichero restaurado, diff vacío.
- Suite entera CON `TEST_DATABASE_URL` (nada saltado): `npm test` exit 0, 269 ficheros y 4398 pruebas; `npm run typecheck` exit 0; `npm run lint -- --max-warnings 165` exit 0 (165 avisos).
- Un ajuste en `DEPLOY.md:665`: se quitó «hasta entonces nadie más lanza la ejecución», que la respuesta de Gerencia no dice.
