# Informe de verificación: `comparacion-exportacion-zoho` (F1F-05, `cierra: no`)

Verificación independiente, modo Strict TDD, artefactos hybrid. Árbol: worktree `comparacion-exportacion-zoho`, HEAD `4c3cab8`
(nacido de `main` en `62181fc`). Todo lo de abajo lo ejecuté yo; no copié cifras del `apply-progress.md`. Ninguna mutación quedó en el
árbol: `git status --short` salió vacío antes de escribir este informe.

> **Nota del orquestador al commitear.** Varias líneas que este informe cita de los ficheros nuevos no coinciden con la numeración del
> árbol (algunas salen al doble). El orquestador corrigió contra el fichero las que bloqueaban el detector de citas; las citas abreviadas
> que quedan no se han comprobado una a una y valen como orientación, no como referencia. Los hallazgos no se han tocado.

**Veredicto: PASS WITH WARNINGS.** 0 CRITICAL · 4 WARNING · 6 SUGGESTION.

## 1. Códigos de salida (cada uno con `echo $?` inmediato, salida a fichero)

| Orden | Código | Resultado |
|---|---|---|
| `npm test` | **0** | `Test Files 276 passed, 3 skipped (279)`; `Tests 4660 passed, 11 skipped (4671)` |
| `npm run typecheck` | **0** | sin errores |
| `npm run lint` | **0** | `165 problems (0 errors, 165 warnings)` |
| `npm run build` | **0** | construye |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | detector de citas sin bloqueos |

Coinciden con lo declarado (4660 + 11 omitidas; 165 avisos, 0 errores). Cobertura: no hay herramienta configurada; no medida.

## 2. Tareas y cabecera

- `tasks.md`: 61 casillas `[x]`, 0 sin marcar. Las tareas de persona (P-1 a P-4) están fuera del recuento, con dueño, desbloqueo y
  destino, y dicen que archivar no las da por hechas. Ninguna describe trabajo que una tanda pueda hacer en el repositorio (regla del
  ciclo 1 cumplida). Lo marcado existe en el código: lector, cruce y consulta, ruta, cliente, `DEPLOY.md`.
- `proposal.md`: cabecera de siete campos, `tanda: F1F-05`, `motivo: ""`, `capacidad: [kpis]`, `cierra: no`, `toca_maestro: no`,
  `origen_cabecera: declarada`. `cierra: no` es coherente con la fila
  `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:129` (F1F-05 «en curso»; el juicio del 95 % y la medición real desde el 16/11
  son de persona, P-2). `apply-progress.md` trae la tabla de ciclo TDD por tarea.

## 3. Cumplimiento de la spec (3 requisitos modificados, 6 añadidos, 44 escenarios)

Todos los escenarios tienen prueba que pasó en la suite completa. «Discrimina» = la mutación del THEN la puso en rojo (sección 4).

| Requisito | Escenario | Prueba que lo cubre | ¿Discrimina? |
|---|---|---|---|
| RQ-KP-14 | Diez / veinte tickets, cuatro consultas | `indicadores.test.ts` (existente, sin tocar) | sí (preexistente) |
| RQ-KP-14 | El GET no cambia por existir la ruta | `indicadoresComparacion.test.ts:243` | sí: antes/después, 4 consultas, sin el 99 del fichero |
| RQ-KP-17 | Sin valores / con valores / el GET no usa el fichero | pruebas previas del `GET` + `:243` | sí |
| RQ-KP-18 | Una petición no deja rastro; sin tablero; carga RQ-KP-21 | pruebas previas (`encuestaRespuestas.test.ts`) | sí (preexistentes) |
| RQ-KP-18 | La carga de la exportación no es escritura | `…Comparacion.test.ts:132` («todo es lectura») | sí: M8 y T3b (UPDATE) rojas |
| RQ-KP-23 | Cabecera completa (59 col., BOM, CRLF) | `leerExportacion.test.ts:23` + lectura real de `Tickets.csv` | sí (con W1) |
| RQ-KP-23 | Falta una / dos columnas / renombrada | `leerExportacion.test.ts:38,43,48` (+ ruta `:220`) | sí: R1, R2 |
| RQ-KP-23 | Dos espacios en la promesa | `leerExportacion.test.ts:53` | sí: R19, S4 |
| RQ-KP-23 | Valor no numérico (fichero vigilado) | `leerExportacion.test.ts:64` | sí: R8, R22 |
| RQ-KP-23 | Celdas con comas y saltos | `leerExportacion.test.ts:32` | sí: R17 |
| RQ-KP-24 | Cruce por ID; mismo número otro ID | `cruzarExportacion.test.ts` (clave) | sí: C1, C2 |
| RQ-KP-24 | Clave vacía / científica / repetido | `leerExportacion.test.ts:111,118,124` + ruta `:99` | sí: R3, R4, R5b, R10b |
| RQ-KP-24 | Número distinto | `cruzarExportacion.test.ts`, ruta `:80` | sí: C3, C4 |
| RQ-KP-25 | Sólo en fichero / sólo en Desk / fuera del periodo / los dos | `cruzarExportacion.test.ts`, ruta `:80` | sí: C5, C6, C7, M11 |
| RQ-KP-26 | 401 / 403 / posición de guardas | ruta `:149-185` | sí: M1, M2, M3, F1 |
| RQ-KP-26 | Periodo inválido con fichero malo; sin fichero; cabecera incompleta | ruta `:206-227` | sí: M4, M5, M6 |
| RQ-KP-26 | Fichero sobre el límite | ruta `:187,194` | sí: F1 (frontera) |
| RQ-KP-26 | Tolerancia y sin veredicto | ruta `:108` | sí con S2; tolerancia 2 sólo cae en `shared` (S4) |
| RQ-KP-26 | Camino único del valor | ruta `:119,126` | sí: M10, R22 |
| RQ-KP-26 | Todo es lectura; una fila mala no tumba | ruta `:132,99` | sí: M8, M9 |
| RQ-KP-27 | Centinela; fila rechazada no cita celda; contacto no sale | ruta `:267,277,289`; lector `:152,160` | sí: R10b, R10c, R11, M9 |
| RQ-KP-28 | Cliente no valida; pinta lo devuelto; error tal cual | `lib/comparacionExportacion.test.ts` | parcial: K6, K6c, K6d sobreviven (W3) |

Sin escenario sin prueba. Un hueco de semántica en W2.

## 4. Mutaciones reproducidas por mí (editar, correr la prueba enfocada, ver rojo, revertir)

**63 mutaciones aplicadas · 56 rojas · 1 equivalente · 6 supervivientes reales.** (Cuatro intentos mal formados —dos sin coincidencia
de texto y dos que reescribían el mismo texto— no cuentan.)

- **Posición (regla 1), ruta:** multer antes de `requireAdmin` (M1), antes de `requireAuth` (M2); `requireAdmin` antes de `requireAuth`
  (M3); «sin fichero» antes del periodo (M4); consulta antes del lector (M5); periodo después del lector (M6): **todas rojas**.
- **Fichero vigilado (regla 2), lector:** quitar la comprobación de columnas (R1), nombrar sólo la primera (R2), aceptar clave vacía (R3),
  no-dígitos (R4), repetida (R5b), motivo que interpola la celda (R10b), ilegible que cita la celda (R10c), ilegible que rechaza la fila (R9b),
  ilegible que no cuenta (R8), NUL / separador / normalización / columna repetida / sin filas (R16-R20), fila física (R12), sin trim del ID
  (R13), número sin filtro de dígitos (R14): **rojas**.
- **Camino único:** ignorar el fichero (M10), completar «sólo en Desk» con lo sincronizado (M11), leer con Number (R22), cambiar la
  columna de «Tiempo de servicio» (R23), renombrar o quitar entradas de `COLUMNAS_INDICADOR` (R24, R25) y de `NOMBRES_ZOHO` (S3, S4): **rojas**.
  Tolerancia 0 (S2) roja; tolerancia 2 sólo cae en `shared` (6 rojas), no en la prueba de la ruta.
- **Sólo lectura:** UPDATE en la ruta (M8) y en `numerosDeTickets` (T3b): rojas. **Privacidad:** log de una fila (M9): roja.
- **Cruce C1-C7** (por número, aproximado, número distinto, reparto, `sinCruzar`): rojas. **Cliente** K1-K5, K6b, K6e, K7, K8: rojas.

**Equivalente (1).** R6: intercambiar `idRepetido` e `idNoDigitos`. Confirmado: `vistos` sólo guarda IDs de dígitos, así que uno no numérico
no puede estar repetido. La declaración del apply es correcta.

**Supervivientes reales (6), con la prueba que faltaría:**
1. **R15** · quitar la rama del BOM de `apps/desk/server/comparacion/leerExportacion.ts:51` deja la suite en verde. NO es equivalente: lo comprobé a mano, con BOM y primera
   cabecera entrecomillada el lector falla («no trae las columnas necesarias: ID»); sin comillas `normalizar` recorta el BOM y no se nota.
   `decodificarFichero` usa `ignoreBOM: true`, así que el BOM llega al lector en producción. Falta una prueba con BOM y cabecera entrecomillada.
2. **R21** · `celda.trim() !== ''` pasa a `celda !== ''` (`:131`): falta una celda de sólo espacios como «no ilegible».
3. **K6** · en `apps/desk/src/lib/comparacionExportacion.ts:76` la lista «Fuera del periodo» puede tomar sus líneas de `soloEnFichero`; la prueba no
   aserta las líneas de esa lista.
4. **K6c** · el recuento «Fuera del periodo» (`:135`) puede copiar `soloEnDesk.total`.
5. **K6d** · el `total` de la lista «Fuera del periodo» (`:149`) idem. K6, K6c y K6d comparten causa: el fixture no discrimina esa lista.
6. **T1b** · el trozo por defecto de `numerosDeTickets` (5000) no lo fija ninguna prueba; la partición sí, pasando `trozo` explícito.

## 5. Lo que el encargo prohíbe tocar (`git diff 62181fc HEAD`)

- Diff vacío: `packages/shared/src/indicadoresComparacion.ts`, `apps/desk/server/indicadores.ts`, `apps/desk/server/routes/indicadores.ts`,
  `packages/zoho-sync/` entero (incluido `schema.sql`), `docs/sdd/ENTRADA.md`, `openspec/config.yaml`, `CLAUDE.md`, `openspec/specs/`.
  Sobre `.env.example`: ningún fichero con `env` en la lista de nombres cambiados (el sandbox me impidió pasarlo como ruta a git diff).
- `packages/shared/src/indicadores.ts`: +2 líneas al final (`export const normalizarNombreZoho = normalizar` y su comentario); ninguna
  fórmula, ni el orden de los nueve, ni el 55, ni el 47. `shared/src/index.ts`: +1 línea al final.
- `analizarRespuestas.ts`: un solo cambio, `function leerRegistros` pasa a `export function leerRegistros`.
- `app.ts` y `Analisis.tsx`: mismo número de líneas (+1 import encadenado, +1 registro, +1 montaje dentro de líneas existentes).
- `DEPLOY.md`: una línea ampliada al final (`:269`) + 34 líneas nuevas al final. Sin migración, tabla ni variable.
- Nuevos: `comparacion/*`, `db/ticketsPorId*`, `routes/indicadoresComparacion*`, `testing/exportacionZoho.ts`,
  `shared/indicadoresExportacion.ts`, panel y `lib` del cliente; `testing/appHarness.ts` +24 (función nueva al final).

## 6. Regla invariable 13 / regla de mutación 3 (la enumeré yo)

| # | Decisión del cliente | Línea del servidor que la impone | Veredicto |
|---|---|---|---|
| 1 | Monta el panel sólo a administradores (`Analisis.tsx`) | 403 `auth/middleware.ts:27`; 401 `:17`, `:19` | espejo legítimo, probado (M1-M3) |
| 2 | Deshabilita «Comparar» sin fichero | 400 `routes/indicadoresComparacion.ts:29` | espejo probado |
| 3 | `accept=".csv"` | 400 del lector `…Comparacion.ts:30-31` | espejo probado (R1) |
| 4 | Envía el periodo sin validarlo, omite vacíos | 400 `…Comparacion.ts:27-28` | probado (M4, M6); K3 roja |
| 5 | Muestra el 413/400 del servidor tal cual | `app.ts:86`, `:88` | probado (K2, F1 rojas) |
| 6 | Deshabilita «Comparar» mientras envía | sin línea: no es guarda (la ruta sólo lee) | comodidad; el apply lo declara (C2b) |
| 7 | Etiqueta `NOMBRES_ZOHO[k.columna][0]`, formato `55,5 %`, «Sin periodo», «solicitud ilegible» | ninguna (presentación) | no es decisión de dominio |
| 8 | «Filas rechazadas» = largo de `rechazadas` (`lib:132`, `:147`) | `…Comparacion.ts:41` entrega la lista completa | única cifra derivada (W4) |

El cliente no lee el fichero, no cruza, no calcula porcentajes ni valida el periodo: `compararConExportacion` (`api/client.ts`) sólo hace
FormData y fetch. La tabla del `apply-progress.md` (C1-C8) coincide con la mía; C8 ya declara el punto 8; le falta el 7 (menor).

## 7. Privacidad (RQ-KP-27)

Ningún camino devuelve, registra ni guarda nombre o correo. El lector construye `campos` sólo con las diez columnas de indicador
(`apps/desk/server/comparacion/leerExportacion.ts:77-80`); los motivos son constantes sin celda (las constantes de motivos de ese mismo fichero; R10b y R10c en rojo); la ruta no escribe a consola ni a
disco (prueba de fuente `…Comparacion.test.ts:141`; M9 roja); el manejador central responde 500 «Error interno» y registra el error
(`app.ts:90`), el de Postgres y no filas; la prueba `:289` lo cubre con un fallo simulado y centinelas. Leí con el lector la muestra
real `docs/analisis-tickets/Tickets.csv`: 640 filas, 0 rechazadas, 0 ilegibles (coincide con `DEPLOY.md`). No hallé fuga.

## 8. Citas `ruta:línea`

Con un script y lectura humana comprobé las de `spec.md` (8), `design.md` (unas 45), `proposal.md` (unas 30) y la sección nueva de
`DEPLOY.md` (10): existen y, leídas una a una, DICEN lo que la frase afirma (las líneas 17, 19 y 27 de `apps/desk/server/auth/middleware.ts` = 401/401/403;
`indicadoresComparacion.ts:25` = orden de guardas; `:27-28`, `:29`, `:30-31` = periodo, sin fichero, lector; `subida.ts:6` = 10 MB;
`app.ts:86`/`:88` = 413/400; `indicadores.ts:26` = `validarPeriodo`; `indicadores.ts:109` = `valorDeZoho`). `design.md` cita
las líneas 83 y 90 de `Analisis.tsx` y las 22 y 61 de `app.ts` del servidor contra `62181fc`: hoy esas líneas llevan el añadido, pero ninguna se movió. No leí
`apply-progress.md` cita a cita.

## 9. Coherencia con el diseño

Sin desviaciones que rompan la spec. Ruta `POST /api/indicadores/comparacion`; lector puro (importa sólo `leerRegistros` y la lectura de
`valorDeZoho`, fijado por la prueba de pureza); un único cálculo (`compararIndicadores`); consultas: las cuatro de `leerEntradasIndicadores`
más una por bloque de «ID» sin cruzar; tolerancia 1 por defecto.

## 10. Hallazgos

### CRITICAL (0)
Ninguno: las cinco órdenes salen con código 0, no hay tarea sin hacer ni escenario sin prueba verde.

### WARNING (4)
- **W1 · BOM del lector sin prueba (R15).** La rama que quita el BOM (`apps/desk/server/comparacion/leerExportacion.ts:51`) hace falta en producción y su ausencia no
  rompe ninguna prueba. Falta un caso directo con BOM y primera cabecera entrecomillada.
- **W2 · Una celda de «Cumplimiento del tiempo  promesa» con texto distinto de «Cumple»/«No cumple» se pierde en silencio.** `valorDeZoho`
  la acepta (columna textual, `indicadores.ts:116`), así que el lector no la cuenta como «valor ilegible» (S-P, `apps/desk/server/comparacion/leerExportacion.ts:80`), pero
  `zohoUsable` la descarta (`indicadoresComparacion.ts:63`) y el par queda «sin comparar» sin listarse. La prueba `leerExportacion.test.ts:73`
  fija el «no ilegible» de un texto cualquiera. Roza la intención de RQ-KP-23 («no devolver sin valor en silencio»); sólo afecta a la
  columna 54. Decidir si se cuenta como ilegible o se acepta como supuesto.
- **W3 · Tres supervivientes del cliente (K6, K6c, K6d).** La vista «Fuera del periodo» (recuento, total y líneas) no la discrimina el fixture;
  es la lista que S-N pidió separar y el riesgo es pintar la equivocada.
- **W4 · «Filas rechazadas» (recuento y total de la lista) lo deriva el cliente** como largo de `rechazadas` (`apps/desk/src/lib/comparacionExportacion.ts:59`,
  la línea 74 de ese mismo fichero), contra «ninguna cifra que no sea copia de la respuesta» (RQ-KP-28). Es legítimo (la lista llega completa, S-Q) y el apply lo
  declara (C8), pero el servidor no manda `total` de rechazadas como sí hace con las otras listas: asimetría de la forma
  `ComparacionExportacion` (`indicadoresExportacion.ts:17`) que conviene cerrar o aceptar por escrito.

### SUGGESTION (6)
- **S1 · R21:** probar una celda de sólo espacios en una columna de indicador (no ilegible).
- **S2 · T1b:** fijar el trozo por defecto de `numerosDeTickets`.
- **S3 · Sesión inválida y frontera exacta:** el 401 por cookie inválida no tiene prueba en esta ruta (lo fija `permisos.test.ts`); un fichero
  de exactamente `LIMITE_SUBIDA_BYTES` no tiene prueba propia (límite -1 y +1 sí; F1 roja ante el desfase).
- **S4 · Tolerancia en la ruta:** sólo prueba diferencias de 1 y 3; añadir un par con diferencia 2 (hoy lo cubre `shared`).
- **S5 · `api/client.ts`:** los `import` de la adición van a mitad de fichero (`:894-896`); funciona por hoisting pero rompe el orden habitual.
- **S6 · `apply-progress.md`** no lista la decisión 7 de la sección 6 en su tabla de la regla 13 (presentación, menor).

## 11. Qué no ejecuté

Ningún despliegue ni prueba contra la base de producción (la ruta se probó con pg-mem); ninguna prueba de interfaz del `.tsx` (excluidas
por decisión de Gerencia, F0-00); cobertura no medida (sin herramienta); no medí líneas del intento ni toqué `gentle-ai sdd-attempt`; no
usé `gentle-ai sdd-verify-validate` (no lo ejecuté en esta sesión).

## 12. Próximo paso

PASS WITH WARNINGS: se puede archivar. Opcional antes de archivar: W1 y W3 son pruebas de pocas líneas; W2 y W4 son decisiones de alcance
(registrarlas como supuesto reversible si no se arreglan).
