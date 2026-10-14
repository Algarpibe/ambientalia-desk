# Tareas — La comparación de los nueve indicadores lee la exportación de Zoho (`comparacion-exportacion-zoho`, F1F-05, `cierra: no`)

Propuesta: `proposal.md`. Delta: `specs/kpis/spec.md` (RQ-KP-14, -17, -18 modificados; RQ-KP-23 a -28 nuevos). Diseño canónico: `design.md` (D1 lector, D2 cruce, D3 ruta, D4 forma, D5 cliente, D6 fixture, D7 pruebas, D8 mutaciones M1 a M21, D9 lotes, D10 ediciones). El diseño manda sobre la propuesta.

**Reglas de todos los lotes.** Cada lote es un intento de `gentle-ai sdd-attempt` en el worktree `C:\dev\Desk_2_R1.023-worktrees\comparacion-exportacion-zoho`, techo 800, válvula 720. No hay PR: la rama se fusiona a `main` tras la verificación. Strict TDD: la prueba ROJA va antes que el código y el rojo se VE (se corre y se mira el fallo). Los textos de error se comparan contra las constantes (`ERRORES_EXPORTACION`, `MOTIVOS_EXPORTACION`, `MENSAJE_SIN_EXPORTACION`), no contra literales. Ningún fichero muy citado gana líneas por dentro: lo nuevo va al final, en sitio o en ficheros nuevos (excepción declarada en D10: una línea en `Analisis.tsx`). Una línea prevista se nombra en prosa, nunca con forma de cita. Esta rama NO toca `docs/sdd/ENTRADA.md`, `openspec/config.yaml` ni `CLAUDE.md`.

## Review Workload Forecast

| Lote | Contenido | Primera cuenta | Estimado (x 1,8) | 800-line budget risk |
|------|-----------|----------------|------------------|----------------------|
| L1 | Lector, tipos, fixture | 314 | ~565 | Low |
| L2 | Cruce y consulta por ID | 208 | ~375 | Low |
| L3 | Ruta, registro, auxiliar de harness | 312 | ~560 | Low |
| L4 | Cliente, lib, `DEPLOY.md` | 293 | ~530 | Low |
| **Total** | | | **~2.030** | |

La medida cuenta también `tasks.md` y `apply-progress.md`; el lote mayor (~565) queda a ~235 del techo. `verify` y `archive` van en intentos propios y aparte.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium (L1, L3 y L4 pasan de 400; el presupuesto del proyecto es de 800 por intento, no 400)
800-line budget risk: Low (ningún lote pasa de ~565; ninguno se acerca a la válvula de 720)

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| L1 | Lector puro de la exportación (~565) | commit L1 | `npx vitest run apps/desk/server/comparacion/leerExportacion.test.ts apps/desk/server/encuesta` | N/A: función pura sin I/O; la cubre la prueba unitaria | Revertir el commit: sin lector; `export` de `leerRegistros` y 2 líneas de `shared` desaparecen |
| L2 | Cruce y `numerosDeTickets` (~375) | commit L2 | `npx vitest run apps/desk/server/comparacion/cruzarExportacion.test.ts apps/desk/server/db/ticketsPorId.test.ts` | pg-mem real con `migrate(db)` en `ticketsPorId.test.ts` | Revertir el commit (ficheros nuevos) |
| L3 | `POST /api/indicadores/comparacion` (~560) | commit L3 | `npx vitest run apps/desk/server/routes/indicadoresComparacion.test.ts apps/desk/server/routes/indicadores.test.ts` | `appHarness` con supertest sobre pg-mem y espía de `Queryable` | Revertir el commit: sin ruta; el `GET` sigue igual |
| L4 | Cliente y despliegue (~530) | commit L4 | `npx vitest run apps/desk/src/lib/comparacionExportacion.test.ts` | N/A: los `.tsx` están fuera de la red de pruebas (F0-00); lo decidible está en el `.ts` | Revertir el commit: sin panel; la ruta sigue |

Dependencias: L2 de L1 (tipos); L3 de L1 y L2; L4 de L1 (tipos). Orden: L1 → L2 → L3 → L4 → cierre.

---

## Lote 1 · Lector de la exportación

**Ficheros:** `apps/desk/server/encuesta/analizarRespuestas.ts` (línea 54 en sitio: `export`); `packages/shared/src/indicadores.ts` (al final); `packages/shared/src/indicadoresExportacion.ts` y `packages/shared/src/index.ts` (al final); `apps/desk/server/testing/exportacionZoho.ts`, `apps/desk/server/comparacion/leerExportacion.ts` y su prueba (nuevos).

- [x] 1.1 Anotar el commit de partida, abrir el intento y anotar `wc -l` de `analizarRespuestas.ts`, `packages/shared/src/indicadores.ts` (262) y `packages/shared/src/index.ts`.
- [x] 1.2 `packages/shared/src/indicadoresExportacion.ts` (nuevo, sólo tipos, D4) y `export * from './indicadoresExportacion'` al final de `index.ts`. Sin rojo previo: son tipos; los exige el rojo de 1.4.
- [x] 1.3 Fixture `apps/desk/server/testing/exportacionZoho.ts` (D6): `CABECERA_MUESTRA` (59), `filaMuestra(sobre)` con celdas centinela, `csvMuestra(filas, { quitar?, renombrar? })`. Ninguna fila real se copia.
- [x] 1.4 **Rojo** `apps/desk/server/comparacion/leerExportacion.test.ts`, cabecera y errores: los siete escenarios de RQ-KP-23 (completa, falta una, faltan dos, renombrada, dos espacios, valor no numérico, comas y saltos); errores `vacio`, `binario`, `repetida`, `sinFilas`; orden de los errores de fichero (D1).
- [x] 1.5 **Rojo** en la misma prueba, filas: clave vacía, notación científica y repetida de RQ-KP-24 (lectura) y «una fila rechazada no cita la celda» de RQ-KP-27; «ID de la solicitud» no numérico da `numero: null` sin rechazar; `campos` trae exactamente diez claves y ninguna de contacto.
- [x] 1.6 **Rojo** en la misma prueba, guardianes y contrato: las diez cabeceras de `COLUMNAS_INDICADOR` las acepta `valorDeZoho` y cubren `NOMBRES_ZOHO`; la primera línea de `docs/analisis-tickets/Tickets.csv` es `CABECERA_MUESTRA` (hipótesis 1 del diseño); contrato de `leerRegistros` (coma entre comillas, comilla doblada, salto interno, CRLF); pureza por importaciones (molde `analizarRespuestas.test.ts:263-279`).
- [x] 1.7 **Ver el rojo:** `npx vitest run apps/desk/server/comparacion/leerExportacion.test.ts`; mirar cada fallo (no un error de sintaxis).
- [x] 1.8 **Verde** `analizarRespuestas.ts`, línea 54 en sitio (`export function leerRegistros`) y `packages/shared/src/indicadores.ts` al final (`export const normalizarNombreZoho = normalizar`). Confirmar que el primero no cambia de tamaño y el segundo crece 2 líneas.
- [x] 1.9 **Verde** `apps/desk/server/comparacion/leerExportacion.ts` (D1): constantes, `COLUMNAS_INDICADOR`, `leerExportacion` con separador fijo coma, ilegibles por `valorDeZoho` (DD-8) y sólo las doce columnas.
- [x] 1.10 **Ver el verde:** el comando de 1.7 más `npx vitest run apps/desk/server/encuesta` (la encuesta queda intacta).
- [x] 1.11 **Mutaciones M7, M8, M9, M10, M12 y M20** (mutar, ver rojo, revertir, anotar en `apply-progress.md`): M7 `idRepetido` antes que `idNoDigitos` y `faltan` después de `sinFilas`; M8 fixture sin una, sin dos y con una columna renombrada; M9 fixture con «ID» vacío, científico y repetido; M10 «abc» y «2.5» en una columna de tiempo; M12 renombrar una entrada de `NOMBRES_ZOHO`, de `COLUMNAS_INDICADOR` y de `CABECERA_MUESTRA`; M20 expresión propia de ilegibles que acepte decimales.
- [x] 1.12 Cierre, códigos 1 a 3: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores), los tres con código MIRADO.
- [x] 1.13 Medir: `git diff --shortstat --no-renames` contra el commit de 1.1 más `wc -l` de lo nuevo sin trackear; registrar. Si pasa de 720, parar y partir.
- [x] 1.14 Barrido de citas (regla de mutación 4) de `analizarRespuestas\.ts`, `indicadores\.ts`, `index\.ts`: `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` sobre todo el repositorio, CADA resultado leído contra el fichero; segundo pase de las abreviadas.
- [x] 1.15 Commit del lote 1; después `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con código 0 MIRADO; asentar el intento.

---

## Lote 2 · Cruce y consulta por ID

**Ficheros:** `apps/desk/server/comparacion/cruzarExportacion.ts`, `apps/desk/server/db/ticketsPorId.ts` y sus dos pruebas (todos nuevos). Sólo se leen: `apps/desk/server/indicadores.ts`, `apps/desk/server/db/encuestaRespuestas.ts:37`.

- [ ] 2.1 Anotar el commit de partida y abrir el intento.
- [ ] 2.2 **Rojo** `apps/desk/server/comparacion/cruzarExportacion.test.ts`: cruce por «ID» y «mismo número, otro ID» (RQ-KP-24); número distinto, también con número `null`; los cuatro escenarios de RQ-KP-25 (sólo en el fichero, sólo en Desk, fuera del periodo, los dos sentidos); el cruzado lleva `camposZoho = fila.campos` y NO conserva ninguna clave sincronizada; orden de `delPeriodo`.
- [ ] 2.3 **Rojo** `apps/desk/server/db/ticketsPorId.test.ts` (pg-mem, `migrate(db)`): devuelve `Map<id, number>`; con `trozo = 2` parte en bloques; lista vacía sin sentencias; hipótesis 5 (`IN ($1,…)` sobre la clave de texto).
- [ ] 2.4 **Ver el rojo:** `npx vitest run apps/desk/server/comparacion/cruzarExportacion.test.ts apps/desk/server/db/ticketsPorId.test.ts`.
- [ ] 2.5 **Verde** `cruzarExportacion.ts` (D2): `cruzarExportacion` y `repartirSinCruzar`; clave por igualdad de texto, sin `custom_fields`.
- [ ] 2.6 **Verde** `apps/desk/server/db/ticketsPorId.ts`: `numerosDeTickets(db, ids, trozo = 5000)` con `IN ($1,…)`. Si falla la hipótesis 5, aplicar el respaldo del molde de `encuestaRespuestas.ts` y anotarlo.
- [ ] 2.7 **Ver el verde:** el comando de 2.4.
- [ ] 2.8 **Mutaciones M11, M13, M14, M15** (mutar, ver rojo, revertir, anotar): M11 fixture con otro «ID de la solicitud» en una fila que cruza; M13 cruzar por número (y, aparte, aceptar clave no numérica en el lector); M14 vaciar `soloEnDesk`/`soloEnFichero` y fundir «fuera del periodo» con «sólo en el fichero»; M15 `{ ...t.camposZoho, ...fila.campos }`.
- [ ] 2.9 Cierre, códigos 1 a 3: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores), código MIRADO.
- [ ] 2.10 Medir (`git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear); si pasa de 720, parar y partir.
- [ ] 2.11 Barrido de citas: el lote sólo añade ficheros nuevos; comprobar con `git diff --name-only` que ningún fichero existente cambió y anotarlo.
- [ ] 2.12 Commit del lote 2; `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con código 0 MIRADO; asentar el intento.

---

## Lote 3 · Ruta de comparación

**Ficheros:** `apps/desk/server/routes/indicadoresComparacion.ts` y su prueba (nuevos); `apps/desk/server/app.ts` (líneas 22 y 61 en sitio); `apps/desk/server/testing/appHarness.ts` (auxiliar al final).

- [ ] 3.1 Anotar el commit de partida, abrir el intento y anotar `wc -l` de `app.ts` y `appHarness.ts`. Leer los moldes `encuestaRespuestas.ts:19` (orden de middlewares) y `encuestaRespuestas.test.ts:34-60` (espía y `ECONNRESET`).
- [ ] 3.2 Auxiliar `estadoDePostGrande(app, ruta, cookie, bytes)` sobre `node:http` **al final** de `apps/desk/server/testing/appHarness.ts`; sin rojo propio: lo ejercita el rojo de 3.4.
- [ ] 3.3 **Rojo** `apps/desk/server/routes/indicadoresComparacion.test.ts`, cuerpo: `200` con la forma de D4; una fila mala no tumba la carga; comparación con tolerancia y sin veredicto; camino único (celda «2.5» queda ilegible y `sinComparar`; «Cumple» con espacios compara); invariantes `leidas = rechazadas + cruzados + soloEnFichero + fueraDelPeriodo`, `periodo = cruzados + soloEnDesk`, `comparados + sinComparar = cruzados` por columna; todo `SELECT` y sin `node:fs`; cinco consultas de datos (cuatro si todo cruza).
- [ ] 3.4 **Rojo, pruebas de POSICIÓN** (regla de mutación 1, dos guardas a la vez) con el espía como `Queryable`: los seis pares de la tabla de D7 (401 ↔ resto, 403 ↔ resto, 413 ↔ 400 periodo, 400 periodo ↔ 400 fichero, 400 sin fichero ↔ cabecera, 400 cabecera ↔ consultas); en todos, ninguna consulta de tickets (`/\btickets\b|ticket_transitions/i`). Los «sobre el límite» de `401` y `403` van por `estadoDePostGrande` (hipótesis 3).
- [ ] 3.5 **Rojo** en la misma prueba: escenarios nuevos de RQ-KP-14 («El GET no cambia…»: un `GET` tras un `POST` con cuatro consultas), RQ-KP-17 («El GET no usa el fichero»), RQ-KP-18 («La carga de la exportación no es una excepción de escritura»); centinela de privacidad de RQ-KP-27 (espiar `console.*` y el registro; hipótesis 6) y su repetición con `Queryable` que falla en la lectura (`500` «Error interno» sin celdas); las claves de la respuesta no incluyen contacto.
- [ ] 3.6 **Ver el rojo:** `npx vitest run apps/desk/server/routes/indicadoresComparacion.test.ts`; mirar cada fallo.
- [ ] 3.7 **Verde** `apps/desk/server/routes/indicadoresComparacion.ts` (D3): orden exacto `requireAuth(db)` → `requireAdmin` → `crearSubida().single('file')` → manejador con `validarPeriodo({ desde, hasta })` (DD-10), `!req.file`, `leerExportacion(decodificarFichero(...))`, `leerEntradasIndicadores`, `cruzarExportacion`, `numerosDeTickets`, `repartirSinCruzar`, `tablaIndicadores`, `parDeIndicador`, `compararIndicadores`; sin `console` ni escritura.
- [ ] 3.8 **Verde** `apps/desk/server/app.ts`, en sitio: la línea 22 gana el `import` y la 61 gana `; registerIndicadoresComparacionRoutes(app, { db })`. Confirmar que el fichero no cambia de tamaño. Sin interruptor: `.env.example` no cambia.
- [ ] 3.9 **Ver el verde:** el comando de 3.6 más `npx vitest run apps/desk/server/routes apps/desk/server/indicadores.test.ts` (el `GET` no se edita y sigue verde). Anotar hipótesis 3, 4 y 6.
- [ ] 3.10 **Anotar las líneas reales** (leídas del fichero ya editado) en `apply-progress.md`: `requireAuth`, `requireAdmin`, `single('file')`, `validarPeriodo`, `!req.file` y el resultado de `leerExportacion` en la ruta nueva; alimentan 5.4 (pasos 4 a 6 de D5).
- [ ] 3.11 **Mutaciones M1 a M6, M16 a M19** (mutar, ver rojo, revertir, anotar): M1 multer delante de `requireAdmin`; M2 delante de `requireAuth`; M3 `requireAdmin` delante de `requireAuth`; M4 `!req.file` delante de `validarPeriodo`; M5 `leerExportacion` delante de `validarPeriodo`; M6 `leerEntradasIndicadores` delante de `leerExportacion`; M16 pasar a la comparación los ausentes del fichero; M17 devolver una columna de contacto o interpolar la celda en un motivo; M18 una sentencia de escritura; M19 leer la celda con `Number` o comparar a mano.
- [ ] 3.12 Comprobar `wc -l`: `app.ts` igual que en 3.1; `appHarness.ts` sólo crece al final.
- [ ] 3.13 Cierre, códigos 1 a 3: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores), código MIRADO.
- [ ] 3.14 Medir (`git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear); si pasa de 720, parar y partir (ruta / pruebas de posición).
- [ ] 3.15 Barrido de citas de `app\.ts` (las citas vivas a las líneas 86 y 90 no se mueven) y `appHarness\.ts`, con segundo pase de las abreviadas.
- [ ] 3.16 Commit del lote 3; `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con código 0 MIRADO; asentar el intento.

---

## Lote 4 · Cliente y despliegue

**Ficheros:** `apps/desk/src/lib/comparacionExportacion.ts` y su prueba (nuevos); `apps/desk/src/api/client.ts` (al final); `apps/desk/src/components/ComparacionExportacion.tsx` (nuevo); `apps/desk/src/components/Analisis.tsx` (línea 6 en sitio y una línea tras la 90); `DEPLOY.md` (línea 269 en sitio y sección nueva al final).

- [ ] 4.1 Anotar el commit de partida, abrir el intento y anotar `wc -l` de `client.ts`, `Analisis.tsx` y `DEPLOY.md` (720).
- [ ] 4.2 **Rojo** `apps/desk/src/lib/comparacionExportacion.test.ts`: periodo mal escrito enviado tal cual y `desde`/`hasta` omitidos si están vacíos; `puedeComparar`; `mensajeDeError` (el `error` del servidor tal cual; sin él, `HTTP nnn`; un `400` de columnas no se sustituye); `vistaComparacion` repite los números sin sumar ni dividir, `—` si `porcentaje` es `null`, sin color, meta ni veredicto.
- [ ] 4.3 **Ver el rojo:** `npx vitest run apps/desk/src/lib/comparacionExportacion.test.ts`. Nota: `vitest.config.ts:17-20` incluye `apps/**/*.test.ts`; el `.ts` entra, los `.tsx` no.
- [ ] 4.4 **Verde** `apps/desk/src/lib/comparacionExportacion.ts` (D5): `urlComparacion`, `ACEPTA_EXPORTACION`, `puedeComparar`, `mensajeDeError`, `vistaComparacion`.
- [ ] 4.5 **Verde** `apps/desk/src/api/client.ts`, al final: `compararConExportacion(file, periodo)` (molde `client.ts:761-766`: `FormData`, campo `file`, sin `Content-Type`).
- [ ] 4.6 `apps/desk/src/components/ComparacionExportacion.tsx` (nuevo; sin prueba por decisión F0-00): selector `.csv`, dos `input type="date"`, botón «Comparar», listas en `details`, tonos neutros. Y `Analisis.tsx`: importación en la línea 6 y una línea tras la 90 que monta el panel si `mostrarDescargaIndicadores(user)`.
- [ ] 4.7 `DEPLOY.md` (documentación directa, sin rojo previo, decisión del 2026-09-10): puntero **en sitio** en la línea 269 del §9 y sección nueva **al final** (ruta `POST /api/indicadores/comparacion`, sólo administradores, límite 10 MB, no guarda nada, sin variable ni tabla ni migración, `.env.example` sin cambios, qué se ve si el fichero no trae las doce columnas). Sin menciones a reuniones. Confirmar que el §9 no gana líneas.
- [ ] 4.8 **Ver el verde:** el comando de 4.3; después `npm run typecheck` (cubre los `.tsx`).
- [ ] 4.9 **Tabla de la regla 13 (M21):** para C1 a C7 de D5, escribir en `apply-progress.md` la línea REAL del servidor (con las anotadas en 3.10) y comprobar, decisión a decisión, que la línea dice lo que la fila afirma. Mutar cada línea de la tabla (mover o quitar la guarda) y ver que alguna prueba de L3 se queja; si ninguna, la fila es una hipótesis y se anota así.
- [ ] 4.10 Cierre, códigos 1 a 3: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores), `npm run build`, los cuatro con código MIRADO.
- [ ] 4.11 Medir (`git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear); si pasa de 720, parar y partir (cliente / `DEPLOY.md`).
- [ ] 4.12 Barrido de citas de `client\.ts`, `Analisis\.tsx` y `DEPLOY\.md`: las posteriores a la línea 90 de `Analisis.tsx` (`docs/sdd/ENTRADA.md:1284` cita la 95) se leen contra lo que afirman; si quedan desfasadas, se listan para Supervisión (esta rama no toca `ENTRADA.md`). Segundo pase de las abreviadas.
- [ ] 4.13 Commit del lote 4; `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con código 0 MIRADO; asentar el intento.

---

## Cierre de apply

- [ ] 5.1 `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores) y `npm run build` sobre `HEAD` de la rama, cada código de salida MIRADO.
- [ ] 5.2 `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`, código 0 MIRADO.
- [ ] 5.3 Barrido de citas completo (regla de mutación 4) por cada fichero tocado en sitio: `git diff --name-only <partida de la rama>..HEAD`, `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` incluyendo `apps/`, `packages/` y `openspec/changes/archive/`; CADA resultado contra el fichero y contra lo que la frase afirma; segundo pase de las abreviadas. Resultado por fichero en `apply-progress.md`.
- [ ] 5.4 Rellenar en `apply-progress.md` la tabla de la regla 13 con la línea real del servidor de cada decisión C1 a C7 (pasos 4 a 6 incluidos).
- [ ] 5.5 Comprobar con `git diff --stat <partida>..HEAD` que NO tienen diff: `docs/sdd/ENTRADA.md`, `openspec/config.yaml`, `CLAUDE.md`, `.env.example`, `packages/shared/src/indicadoresComparacion.ts`, `apps/desk/server/indicadores.ts` y `apps/desk/server/routes/indicadores.ts`.

---

## Cobertura: escenario → tarea

| Requisito | Escenarios | Tarea |
|---|---|---|
| RQ-KP-14 | Diez y veinte tickets (existentes, sin editar) | 3.9 |
| | El GET no cambia por existir la ruta | 3.5 |
| RQ-KP-17 | Sin valores; con valores (existentes) | 3.9 |
| | El GET no usa el fichero | 3.5 |
| RQ-KP-18 | Una petición, sin tablero, la carga no abre (existentes) | 3.9 |
| | La carga de la exportación no es excepción | 3.5 |
| RQ-KP-23 | Cabecera completa; falta una; faltan dos; renombrada; dos espacios; no numérico; comas y saltos | 1.4 |
| RQ-KP-24 | Clave vacía; notación científica; ID repetido | 1.5 |
| | Cruce por ID; mismo número, otro ID; número distinto | 2.2 |
| RQ-KP-25 | Sólo en el fichero; sólo en Desk; fuera del periodo; los dos sentidos | 2.2 |
| RQ-KP-26 | Sin sesión; sin administrador; posición de las guardas; periodo inválido con fichero malo; sin fichero; cabecera incompleta; sobre el límite | 3.4 |
| | Tolerancia y sin veredicto; camino único; todo es lectura; una fila mala | 3.3 |
| RQ-KP-27 | Una fila rechazada no cita la celda | 1.5 |
| | Datos de contacto centinela; columna de contacto no sale | 3.5 |
| RQ-KP-28 | Cliente no valida; pinta lo devuelto; error del servidor tal cual | 4.2 |

Nota: la spec trae 11 escenarios de RQ-KP-26 (el diseño dice doce); los 11 están asignados. Escenarios sin asignar: ninguno.

---

## Tareas de persona — archivar no las da por hechas

Fuera del recuento y sin casillas: ninguna describe trabajo que una tanda pueda hacer en este repositorio (comprobado). Archivar el cambio NO las da por hechas.

| # | Tarea | Dueño | Qué desbloquea | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Exportar el fichero de Zoho Desk cada semana desde el 16/11 y subirlo, sin pasarlo por una hoja de cálculo | Quien administra la aplicación | Comparación con datos reales | Sección final de `DEPLOY.md`; entrada de bandeja del cierre |
| P-2 | Juzgar el 95 % y explicar por escrito cada diferencia mayor | Gerencia | Cerrar la fila F1F-05 | Ídem |
| P-3 | Desplegar antes del 13/11 | Quien administra el despliegue | Que la ruta exista en producción | `DEPLOY.md` |
| P-4 | Confirmar los supuestos S-I a S-Q y las preguntas abiertas de `design.md` §13 | Gerencia | Que dejen de ser supuestos reversibles | Lista semanal de supuestos; entradas del cierre |
