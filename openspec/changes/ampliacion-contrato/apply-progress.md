# Apply-progress — ampliacion-contrato (F1B-11, `cierra: si`)

## Lote 1 · regla pura en `shared` (tareas 1.1 a 1.10 hechas; 1.11 a 1.16 son del orquestador)

Partida: `6d42654`. `wc -l` de partida: `packages/shared/src/contratos.ts` 242, `packages/shared/src/contratos.test.ts` 236.
Final: 298 y 367. Sólo se añadió al final (+56 y +131); `git diff -U0` muestra dos hunks de pura adición, ninguna línea previa movida.

**Rojo → verde (strict TDD).** Se escribió primero todo el bloque de pruebas (1.2 a 1.7) y se corrió: `35 failed | 111 passed`
(`TypeError: ... is not a function`, funciones inexistentes). Después el código (1.8): `146 passed`. Con la prueba de TZ de M10, `147 passed`.
Pruebas añadidas: 36 (111 → 147).

| Tarea | Rojo visto | Verde |
|---|---|---|
| 1.2 `topeAmpliacion` (4 bordes) | fallo de función inexistente | verde |
| 1.3 `motivoNoAmpliable` (tabla, reloj 03:00Z/05:00Z) | idem | verde |
| 1.4 pares de posición + par no activable comentado | idem | verde |
| 1.5 `cabeAmpliacion` + propiedad contra `motivoNoAmpliable` | idem | verde |
| 1.6 `ampliacionDelCuerpo` (motivo recortado, 5.000 caracteres) | idem | verde |
| 1.7 `fechaFinOriginal` (primera fila) | idem | verde |

**Mutaciones (1.9), cada una restaurada.** Todas ponen rojo salvo la nota de M10b.
M4a `plazoCerrado` primero: 3 rojas. M4b motivo antes que la fecha: 6. M9a tope `-12-30`: 10. M9b tope 01/01 siguiente: 11.
M10a año de `hoy`: 1. M11 `<=`→`<`: 5. M12 `>`→`>=` tope: 5. M13 `>`→`>=` plazo: 2. M19 `cabeAmpliacion` siempre `true`: 1. M17 original desde la última fila: 1.
**M10b** (`new Date(fechaFin).getFullYear()`) **sobrevivió**: `vitest.config.ts` fija `TZ=UTC` y en UTC es equivalente. Se añadió una prueba que
cambia `process.env.TZ` a `America/Bogota` y restaura; con ella M10b da 1 roja.

**Líneas reales** (leídas del fichero editado, `packages/shared/src/contratos.ts`): `motivoNoAmpliable` en `:264`, `cabeAmpliacion` en `:275`,
`ampliacionDelCuerpo` en `:283`, `fechaFinOriginal` en `:296`, `MENSAJES_AMPLIACION` en `:247`, `topeAmpliacion` en `:259`.

**Desviaciones del diseño:** ninguna en firmas, mensajes u orden. Dos menores: (1) el segundo `import` de `@ambientalia/shared` va en el bloque
final del fichero de pruebas (para no tocar la línea 2); (2) prueba extra de zona horaria (arriba), no listada en las tareas.
Comprobado: `npx eslint` sobre los dos ficheros sin avisos.

## Lote 2 · esquema, `PUBLIC_TABLES`, guardianes y capa de datos (tareas 2.1 a 2.11 hechas; 2.12 a 2.17 son del orquestador)

Partida: `695ed23`. `wc -l` de partida y final: `schema.sql` 768 → 782 (+14, todo al final salvo la línea 559 en sitio); `migrate.ts` 131 → 131;
`migrate.test.ts` 819 → 858 (+39, sólo el bloque nuevo al final); `db/contratos.ts` 115 → 158 (+43 al final; líneas 2, 3 y 8 en sitio); `db/contratos.test.ts` 163 → 244 (+81 al final; las líneas 5 y 9 ganan nombres de importación en sitio).
Ninguna inserción en medio de `migrate.test.ts`: los hunks por encima de la línea 819 son todos de una línea (o cinco líneas sustituidas por cinco en 282-286).

**Rojo → verde (strict TDD).** Primero 2.2 (bloque nuevo), 2.3 (guardianes en sitio) y 2.4 (pruebas de datos): `14 failed | 71 passed`
(4 del bloque nuevo, 3 guardianes en sitio, 7 de la capa de datos con funciones inexistentes). Después `schema.sql`, `migrate.ts` y `db/contratos.ts`: `85 passed`
(un ajuste de la prueba: pg-mem devuelve `contrato_id` como número, no cadena). El guardián de clasificación sólo se pone rojo por mutación (con la tabla aún sin crear nada la contradice).

**Hipótesis pg-mem (2.8): confirmada.** `fecha_fin = $3` con texto `YYYY-MM-DD` funciona sin `::date`: el caso de carrera lanza el error y el normal escribe. No hizo falta el respaldo.

**Mutaciones (2.9), cada una restaurada (`cmp` de los tres ficheros contra la copia).** M5 quitar `public.` del `CREATE` de `schema.sql`: 2 rojas (clasificación, posición del bloque nuevo).
M6 mover el `CREATE` antes de la siembra de accesorios: 2 rojas (bloque nuevo y el guardián de las líneas 794-798 de `migrate.test.ts`). M7a sin `NOT NULL` en `fecha_anterior`: 1 roja. M7b sin `NOT NULL` en `ampliado_por`: 1 roja.
M8 fuera de `PUBLIC_TABLES`: 3 rojas (clasificación, recuento, contiene). M15 sin `AND fecha_fin = $3`: 1 roja (carrera). M16a sin `INSERT`: 5 rojas. M16b `INSERT` antes del `UPDATE`: 3 rojas (carrera, estructura). M17 `ORDER BY id DESC`: 2 rojas.
Ningún superviviente.

**Líneas reales** (leídas de `apps/desk/server/db/contratos.ts` ya editado): el `UPDATE` condicionado en `:133` y `throw new ContratoCambiadoError` en `:136` (alimentan la fila 5 de la regla 13). `ampliarContrato` abre en `:130` y `ampliacionesDelContrato` en `:146`.

**Desviaciones del diseño:** ninguna en SQL, firmas ni orden. Menores: (1) el comentario nuevo de `schema.sql` ocupa 14 líneas, no 16; (2) en `contratos.test.ts` el import de `@ambientalia/shared` va en la línea 5 tras `;` para no insertar líneas; (3) aviso de eslint heredado en `migrate.ts:6` (`any`), no es de este lote.

## Lote 3 · ruta y lectura ampliada (tareas 3.1 a 3.10 hechas; 3.11 a 3.16 son del orquestador)

Partida: `e75ed5c`. `wc -l` de `apps/desk/server/routes/contratos.ts`: 71 → 91 (+20, sólo la ruta nueva tras el informe; las líneas 5, 9, 21-22 y 33 en sitio, mismo número).
Fichero nuevo `apps/desk/server/routes/contratosAmpliar.test.ts`: 209 líneas (sin trackear). Hunks: `-5`, `-9`, `-21,2`, `-33` y `+71,20`. `routes/contratos.test.ts` NO se tocó y sigue verde (la ficha usa `toMatchObject`; el espía no se rompe).

**Rojo → verde (strict TDD).** Primero el fichero de pruebas completo (21 casos): `18 failed | 3 passed` (la ruta no existía; los 3 verdes son coincidencias de 401/404). Después el código: `21 passed`.
Dos ajustes de la prueba, no del código: pg-mem devuelve `fecha_fin` como `Date` en SQL directo (se lee con `contratoPorId`) y el título de la matriz.

**Mutaciones (3.8), cada una restaurada (`cmp` contra la copia; `git diff --stat` igual antes y después).**
M1 el `403` antes del `404`: 2 rojas (A↔B e id no numérico). M2 el cuerpo antes del permiso: 1 roja (B↔C). M3 escribir antes de validar: 3 rojas (C↔D, fecha antes que motivo, bordes de año).
Mperm sin permiso: 5 rojas. M14 `hoy` por defecto con `new Date().toISOString()`: 1 roja. M18 `ampliadoPor` del cuerpo: 1 roja. M20 sin `ampliaciones` o sin `fechaFinOriginal` en la ficha: 2 rojas cada una.
Una primera M3 mal escrita (validaba ANTES de escribir) no era mutación y dio verde: se rehízo y quedó roja. Ningún superviviente.

**Líneas reales** (`apps/desk/server/routes/contratos.ts` ya editado): `404` paso 1 en `:78`, `403` paso 2 en `:79`, `422` paso 3 en `:81` (guarda; la llamada a `ampliacionDelCuerpo` en `:80`),
`409` paso 4 en `:87` (el `catch` de `ContratoCambiadoError`; el `ampliarContrato` en `:83`); la ficha en `:33`. La ruta abre en `:74` (comentario en `:72-73`).
`DELETE` sobre `contrato_ampliaciones`: ninguna sentencia; sólo dos comentarios que dicen «sin DELETE» (`db/contratos.ts:8` y `:119`).

**Desviaciones del diseño:** ninguna en escalera, mensajes ni éxito `200`. Menor: la ficha sirve las ampliaciones con una consulta más (`ampliacionesDelContrato`).
Comprobado por mí: `npx vitest run apps/desk/server/routes` exit 0 (264 pruebas); `npm run typecheck` exit 0.

## Lote 4 · efecto en las tres puertas (tareas 4.1 a 4.9 hechas; 4.10 a 4.15 son del orquestador)

Partida: `3a5a88b`. Fichero nuevo `apps/desk/server/ampliacionContratoPuertas.test.ts`: 147 líneas (sin trackear). Ningún fichero de producción ni prueba existente se tocó (`git diff --stat` de `services`, `routes` y `db`: vacío).
Fechas: vencimiento 2026-06-30, ampliación a 2026-09-30 (reloj en 2026-07-15, dentro del tope del año). Instantes: antes 2026-09-15T15:00Z, mismo día 2026-09-30T15:00Z, zona 2026-10-01T03:00Z (UTC ya es el 1 de octubre; Bogotá, las 22:00 del 30), siguiente 2026-10-01T15:00Z.

**Caracterización, no rojo previo (declarado).** Las 15 pruebas (5 por puerta) nacieron verdes: la ruta y las puertas ya existían. El rojo sale de MUTAR; la ampliación se hace siempre con la ruta real por HTTP y Comercial.

**Hipótesis.** (a) supertest y pg-mem NO se cuelgan con `toFake: ['Date']`: confirmada, sin respaldo. (b) el `now()` de pg-mem sigue al reloj falso: no se pudo falsear (sesión nueva con `createSession` tras cada salto, desde el principio, como decía el respaldo). (c) el alta de remisión no compara su `fecha` con hoy: la prueba usa la fecha del reloj falso; sin conflicto. Ningún respaldo `vi.mock` hizo falta.

**Mutaciones (cada una restaurada; `cmp` contra copia y `git status --short` final: sólo el fichero nuevo).**
| Mutación | Rojas |
|---|---|
| M1a `UPDATE` de `fecha_fin` sin cambiar la fecha (sólo traza), `db/contratos.ts` | 12: «antes», «mismo día», «zona» y «pasada» en las tres puertas |
| M1b `UPDATE` escribe `fecha_anterior` (fecha_nueva = anterior) | 12 (las mismas) |
| M2 `estadoContrato` con `<=` (bloquea el día de fin) | 6: «mismo día» y «zona» en las tres puertas |
| M3 `hoyEnZona` con el día UTC | 3: «zona» en las tres puertas |
| M4a sin guarda de vencido en el alta (`ticketService.ts:96`) | 2: control y «pasada» de la alta, sólo ésa |
| M4b sin guarda en la transición (`ticketService.ts:147`) | 2: control y «pasada» de la transición, sólo ésa |
| M4c sin guarda en la remisión (`remision.ts:220`) | 2: control y «pasada» de la remisión, sólo ésa |
Ningún superviviente. M1a y M1b caen igual porque la lectura es de la fecha vigente; la traza no cuenta para las puertas.

**Comprobado por mí:** tres corridas seguidas del fichero, exit 0, 0, 0; `npm run typecheck` exit 0; eslint del fichero exit 0; `remisiones.test.ts` y `ordenVentaUnTicket.test.ts` exit 0 sin tocarse.
Límite declarado: el «deja pasar» de la remisión exige 201 con fecha del día; si cambiara la forma de la respuesta de éxito la prueba pide `status < 300` y que el mensaje no diga «venció».

**Desviación de la tasks.md:** años 2026 y no 2031 (orden del encargo); un único `describe.each` de tres puertas con cinco pruebas cada una, no cuatro pruebas separadas.

## Lote 5 · cliente y cierre documental (tareas 5.2 a 5.12 hechas; 5.1 y 5.13 a 5.17 son del orquestador)

Partida: `1b7c2a4`. Sin ficheros nuevos ni código de servidor. Los `.tsx` están fuera de la red de pruebas (F0-00): sin rojo previo, declarado; la comprobación es `npm run typecheck`, `npm run build` y la tabla de la regla 13.
Comprobado por mí: `npm run typecheck` exit 0; `npm run build` exit 0; `npx eslint` de `ContratoFicha.tsx`, `client.ts` y `ContratosPanel.tsx` exit 0.

**Cliente.** `client.ts`: `FichaContrato` gana los dos campos (en sitio, línea 680) y `ampliarContrato` va al final (línea 881). `ContratosPanel.tsx`: comentario de la línea 17 en sitio. `ContratoFicha.tsx` (88 → 153): `useAuth`, `puedeAmpliar`, «Vencimiento original» cuando difiere, sección «Ampliaciones» y el componente `AmpliarContrato` (fecha con `max`, motivo, error del servidor tal cual, recarga tras éxito o `409`).

**Decisiones del cliente (5.5).** Releído el código; el cliente toma seis decisiones y las seis tienen línea de servidor (tabla cerrada en `tasks.md`, 5.7):
1. Enseñar «Ampliar» sólo a Comercial o administrador (`apps/desk/src/components/ContratoFicha.tsx:27`) ← `403` en `apps/desk/server/routes/contratos.ts:79`.
2. `max` del campo de fecha (`apps/desk/src/components/ContratoFicha.tsx:141`) ← `pasaDelTope` en `packages/shared/src/contratos.ts:269`.
3. Ocultar «Ampliar» si no cabe (`apps/desk/src/components/ContratoFicha.tsx:27`, `cabeAmpliacion`) ← `plazoCerrado`/`pasaDelTope` en `packages/shared/src/contratos.ts:270`; espejo fijado por la propiedad de `packages/shared/src/contratos.test.ts:315`.
4. Etiqueta «Motivo» (`apps/desk/src/components/ContratoFicha.tsx:143`): no valida ni es `required` ← `422` en `packages/shared/src/contratos.ts:288`.
5. Recargar tras `409` (`apps/desk/src/components/ContratoFicha.tsx:131`) ← `UPDATE` condicionado en `apps/desk/server/db/contratos.ts:133`, `409` en `apps/desk/server/routes/contratos.ts:87`.
6. Pintar traza y original (`apps/desk/src/components/ContratoFicha.tsx:61`, `:71`): no decide; llegan de `apps/desk/server/routes/contratos.ts:33`.
Dos matices SIN guarda propia, declarados: (a) `puedeAmpliar` usa `hoyEnZona()` del navegador, y el servidor usa el suyo (`apps/desk/server/routes/contratos.ts:22`, `deps.hoy`): si difieren, el botón puede ofrecerse o esconderse un día de más y el servidor decide igual (comodidad, no guarda); (b) el condicional «Vencimiento original sólo si difiere» es presentación sobre un dato del servidor. Ninguna decisión sin línea.

**Documentos (sólo al final).** `DEPLOY.md` +33; paquete de despliegue §13 (+84; el último era el §12); corrección 32 (+41; la última era la 31). Citas al maestro releídas contra el `.md` R08.4: líneas 2655, 2656, 5561 a 5563 (nº 70), 5824 (nº 53) y 2658 (E-088). Hallazgo: el pendiente que cierra la ampliación es el nº 70 del Anexo D (línea 5561), y el nº 53 (línea 5824) dice «salvo la ampliación (nº 70)»; la corrección 32 toca los dos.

**Barrido (5.11).** Sólo `ContratoFicha.tsx` tiene inserciones en medio; `client.ts`, `DEPLOY.md`, la corrección y el paquete crecen al final, y `ContratosPanel.tsx` cambió una línea en sitio. Nueve citas completas a `ContratoFicha.tsx` en todo el repositorio: tres en el propio cambio (`design.md` reapuntada a la línea 21, caso A; `proposal.md` anclada a `351c046`, caso B; más la de `client.ts` de `design.md`, anclada también) y seis líneas de paquetes fechados, que no se editan (caso B). Las abreviadas de esas líneas: la 41 hoy es la 51, la 66 la 94, la 5 la 7, la 47 la 57, la 58 la 86 y la 10 la 12. Detalle completo en el informe del lote.
`wc -l` contra 5.1: `client.ts` 878 → 885, `DEPLOY.md` 560 → 593, corrección 1560 → 1601, paquete 357 → 441; sólo crecieron al final. `git diff --stat 351c046`: ni `docs/sdd/ENTRADA.md`, ni `openspec/config.yaml`, ni el plan R01.4 (5.12).
