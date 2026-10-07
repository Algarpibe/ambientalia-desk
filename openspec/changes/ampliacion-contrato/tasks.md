# Tareas — Ampliación de contrato: hasta el 31/12 del año del vencimiento, por Comercial y con traza (F1B-11, `cierra: si`)

Propuesta: `openspec/changes/ampliacion-contrato/proposal.md`. Diseño canónico: `openspec/changes/ampliacion-contrato/design.md`
(D1 shared, D2 esquema, D3 capa de datos, D4 ruta, D5 pruebas, D6 cliente y regla 13, D7 dónde cae cada edición, D8 lotes, D9 mutaciones M1 a M20; el diseño manda sobre la propuesta).
Requisitos: RQ-TC-53, RQ-TC-54 y RQ-TC-55 (nuevos) y RQ-TC-21 (modificado, una frase en sitio) del delta `specs/tickets-core/spec.md`. RQ-TC-25 no cambia de requisito.

**Reglas de todos los lotes.** Cada lote es un intento del registro (`gentle-ai sdd-attempt`) en el worktree `C:\dev\Desk_2_R1.023-worktrees\ampliacion-contrato`, techo 800, válvula 720.
Strict TDD: cada pieza va como pareja «prueba en rojo» → «implementación en verde», y el rojo se **ve** (se corre y se mira el fallo) antes de escribir el verde.
Las pruebas existentes que quedan rojas por contrato se editan **en sitio, después** del rojo de las nuevas, con el fichero y las líneas que se listan en cada lote.
Los textos de error se comparan contra `MENSAJES_AMPLIACION`, no contra literales.
**Esta rama no toca `docs/sdd/ENTRADA.md` ni `openspec/config.yaml`** (DD-10): lo que iría ahí se redacta en el paquete de despliegue (5.9) para que lo abra Supervisión.
Ningún fichero muy citado gana ni pierde líneas por dentro: todo se edita sobre la línea que ya existe, y lo nuevo va al final o en ficheros nuevos. La única excepción es `apps/desk/src/components/ContratoFicha.tsx` (sin citas vivas).
Una línea **prevista** se nombra en prosa («la línea 72 de ese fichero»), nunca con forma de cita; la forma de cita se escribe sólo cuando la línea ya existe y se leyó.
Cada lote se cierra, en este orden, con: `npm test`, `npm run typecheck` y `npm run lint` (165 avisos y 0 errores; no pueden subir de 165) con su código de salida MIRADO; la medida (`git diff --shortstat --no-renames` contra el commit de partida del intento más `wc -l` de lo nuevo sin trackear; binarios, si los hubiera, aparte); el barrido de citas de la regla de mutación 4; el commit; y **después del commit** `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` con código de salida 0 MIRADO (el cuarto código); y asentar el intento. **Si la medida pasa de 720, el lote se parte antes de asentar** (la salida prevista va en la cabecera de cada lote). Antes de editar en sitio un fichero, anotar su `wc -l`: debe ser igual al terminar (salvo lo que se añade al final, que se declara).
Al fijar cada guarda nueva, anotar en `openspec/changes/ampliacion-contrato/apply-progress.md` la **línea real** (ruta y línea, leída del fichero ya editado): alimenta la tabla de la regla 13 de más abajo.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1.295 (205 + 270 + 310 + 210 + 300), pruebas ya ×1,8; repartidas en cinco intentos; más verify ~360 y archive ~180 + fusión, cada uno en su intento |
| Budget risk | Low: ningún intento supera 800 ni la válvula de 720 (el mayor, el lote 3, ~310) |
| Chained PRs recommended | No: este proyecto no usa PR. Cada lote es un commit en la rama del worktree bajo un intento con techo 800, y el analista verifica la rama entera antes de fusionar a `main` de una vez |
| Suggested split | L1 → L2 → L3 → L4 → L5 (L2 depende de L1; L3 de L2; L4 de L3; L5 de L3); verify y archive aparte |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (no aplica: no hay cadena de PR) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Por qué «No» pese a `ask-on-risk`: el presupuesto del proyecto es de 800 líneas POR INTENTO, no por cambio ni por PR; 400 es la guía genérica de la skill y aquí no es el techo. Ningún lote pasa de ~310 (lejos de 720), el trabajo se entrega por lotes en una rama y **la fusión a `main` la autoriza el usuario** tras la verificación del analista: no hay decisión de cadena ni excepción de tamaño que tomar antes de aplicar. Si al medir un lote pasa de 720, se parte (L3 y L4 ya están separados a propósito: el 4 lleva dos hipótesis que no deben arrastrar a la ruta).

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| L1 | Regla pura en `shared` (~205) | commit L1 | `npx vitest run packages/shared/src/contratos.test.ts` | N/A: funciones puras sin I/O; las cubre la prueba unitaria | Revertir el commit (funciones nuevas al final, sin consumidores) |
| L2 | Esquema, `PUBLIC_TABLES`, guardianes y capa de datos (~270) | commit L2 | `npx vitest run packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/db/contratos.test.ts` | pg-mem real con `migrate(db)` | Revertir el commit; la tabla queda sin lector |
| L3 | Ruta `POST /api/contratos/:id/ampliar` y lectura ampliada (~310) | commit L3 | `npx vitest run apps/desk/server/routes/contratosAmpliar.test.ts apps/desk/server/routes/contratos.test.ts` | `appWith` y aplicación mínima local con `hoy` inyectado sobre pg-mem | Revertir el commit (quita la ruta y los campos aditivos de la ficha) |
| L4 | Efecto en las tres puertas (~210) | commit L4 | `npx vitest run apps/desk/server/ampliacionContratoPuertas.test.ts` | pg-mem + supertest con `Date` falso; escritor real | Revertir el commit (sólo un fichero de pruebas nuevo) |
| L5 | Cliente y cierre documental (~300) | commit L5 | `npm run build` (compilación; los `.tsx` no tienen pruebas) | N/A: los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00); se verifica en la aplicación (P.8) | Revertir el commit |

---

## Lote 1 · regla pura en `shared`

**Ficheros:** `packages/shared/src/contratos.ts` (al final; hoy acaba en la línea 242) y `packages/shared/src/contratos.test.ts` (al final). `packages/shared/src/index.ts` no cambia (ya exporta `./contratos`).
**Estimación:** 60 de código + 80 de pruebas × 1,8 = 144 → **~205**.
**Salida prevista si pasa de 720:** no aplica; es el lote más pequeño.
**Requisitos:** RQ-TC-53 (completo); RQ-TC-54 (`ampliacionDelCuerpo`, motivo vacío y `fechaFinOriginal`).

- [ ] 1.1 Anotar el commit de partida (`git rev-parse HEAD`), abrir el intento y anotar `wc -l` de `packages/shared/src/contratos.ts` (242) y de `packages/shared/src/contratos.test.ts`.
- [ ] 1.2 **Rojo** `packages/shared/src/contratos.test.ts` (al final), `describe('topeAmpliacion')`: `it` por borde — fin `2026-12-31` (tope el propio día), fin `2026-01-01` (tope `2026-12-31`, no 2025), fin `2026-06-30`, y un año de otro siglo/lustro (`2031-06-30` → `2031-12-31`). El rojo inicial es el fallo de importación de la función inexistente. Fija RQ-TC-53 (los cuatro bordes y «sin pasar por UTC»).
- [ ] 1.3 **Rojo** en la misma prueba, `describe('motivoNoAmpliable')`: tabla de casos, cada rechazo contra `MENSAJES_AMPLIACION`: fecha inválida (`2026-02-30`, texto libre, `undefined`, no cadena) → `fecha`; la misma fecha y una anterior → `noPosterior`; `2027-01-01` sobre fin `2026-06-30` → `pasaDelTope` y `2026-12-31` → `null`; `hoy` posterior al tope con fecha que cabría → `plazoCerrado`; contrato no iniciado y contrato vencido ambos ampliables (S-7); fin `2026-12-31` pidiendo `2027-01-01` → `pasaDelTope` y `2026-12-31` → `noPosterior`. Bordes de reloj: `hoyEnZona(new Date('2027-01-01T03:00:00Z'))` (es `2026-12-31`) deja ampliar un contrato de 2026 y `new Date('2027-01-01T05:00:00Z')` da `plazoCerrado`. Fija RQ-TC-53 (todos los escenarios de la regla).
- [ ] 1.4 **Rojo, pruebas de POSICIÓN por pares** (regla de mutación 1), con las dos condiciones activas a la vez: inválida ↔ plazo cerrado → `fecha`; no posterior ↔ plazo cerrado → `noPosterior`; pasa del tope ↔ plazo cerrado → `pasaDelTope`; y en `ampliacionDelCuerpo` cada una de las cuatro ↔ motivo vacío → el mensaje de la fecha. Dejar escrito en un comentario el par **no activable** (no posterior ↔ pasa del tope: una fecha no puede ser a la vez `<=` la vigente y `>` el tope). Fija RQ-TC-53 («El orden de los motivos está fijado por prueba»).
- [ ] 1.5 **Rojo** en la misma prueba, `describe('cabeAmpliacion')`: verdadero si `fechaFin < tope` y `hoy <= tope`; falso con fin el 31/12 y falso con `hoy` pasado el tope; **propiedad** sobre una rejilla de fechas: si `cabeAmpliacion` es falso, `motivoNoAmpliable` no es `null` para ninguna fecha de la rejilla (enfrenta las dos implementaciones, DD-9, molde H5).
- [ ] 1.6 **Rojo** en la misma prueba, `describe('ampliacionDelCuerpo')`: cuerpo no objeto/ausente → error de la fecha; motivo ausente, vacío o de espacios con fecha válida → `motivo`; éxito devuelve `fechaFin` y `motivo` **recortado** sin truncar (texto de miles de caracteres); ignora campos extra del cuerpo. Fija RQ-TC-54 («motivo vacío», «recortado, sin límite»).
- [ ] 1.7 **Rojo** en la misma prueba, `describe('fechaFinOriginal')`: sin filas devuelve la vigente (nunca nulo, S-8); con dos filas devuelve la `fechaAnterior` de la **primera** (no de la última). Fija RQ-TC-54 («Sin ampliaciones…», «La ficha enseña la traza…»).
- [ ] 1.8 **Verde** `packages/shared/src/contratos.ts`, añadir al final con las firmas del diseño D1: `MENSAJES_AMPLIACION`, `topeAmpliacion` (`fechaFin.slice(0, 4)`, sin `Date`), `motivoNoAmpliable` (orden: fecha, noPosterior, pasaDelTope, plazoCerrado), `cabeAmpliacion`, `CuerpoAmpliacion`, `ampliacionDelCuerpo`, `AmpliacionContrato` y `fechaFinOriginal`. Sin importaciones nuevas (`DiaCivil` y `fechaCalendario` ya están). Ver el verde.
- [ ] 1.9 **Mutaciones M4, M9, M10, M11, M12, M13 y M19** (restaurando tras cada una): M4 `plazoCerrado` el primero y `motivo` antes que la fecha → ponen rojos los pares de 1.4; M9 tope `-12-30` y 01/01 del año siguiente → rojos bordes de 1.2 y 1.3; M10 tope con el año de `hoy` y año por `new Date(fechaFin).getFullYear()` → rojos borde 01/01 y contrato de otro año; M11 `<=` por `<` en «posterior a la vigente» → rojo caso fecha igual; M12 `>` por `>=` en «posterior al tope» → rojo ampliar exactamente al tope; M13 `>` por `>=` en «plazo cerrado» → rojo `hoy` igual al tope; M19 `cabeAmpliacion` siempre `true` → roja la propiedad de 1.5.
- [ ] 1.10 Comprobar `wc -l`: `packages/shared/src/contratos.ts` y `packages/shared/src/contratos.test.ts` sólo crecen al final (declarar cuántas líneas); ninguna línea anterior se movió.
- [ ] 1.11 **Cierre, códigos de salida 1 a 3:** correr `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [ ] 1.12 Medir: `git diff --shortstat --no-renames` contra el commit de 1.1 más `wc -l` de lo nuevo sin trackear (nada: los dos ficheros ya existían); registrar la cifra. Si pasa de 720, parar y partir.
- [ ] 1.13 **Barrido de citas, regla de mutación 4,** para `packages/shared/src/contratos.ts` y `packages/shared/src/contratos.test.ts`: `grep -rnoE "contratos\.(test\.)?ts:[0-9]+(-[0-9]+)?"` sobre todo el repositorio (incluidos `apps/` y `openspec/changes/archive/`), CADA resultado comprobado contra el fichero leyendo qué afirma la frase (sólo se añadió al final); segundo pase de las abreviadas en los ficheros que ya citan el módulo.
- [ ] 1.14 Commit del lote 1 (conventional commit, sin atribución de IA).
- [ ] 1.15 **Cierre, código de salida 4:** `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [ ] 1.16 Asentar el intento.

---

## Lote 2 · esquema, `PUBLIC_TABLES`, guardianes y capa de datos

**Depende de:** 1 (usa `MENSAJES_AMPLIACION` y `AmpliacionContrato`).
**Ficheros:** `packages/zoho-sync/src/db/schema.sql` (al final, y la línea 559 en sitio); `packages/zoho-sync/src/db/migrate.ts` (línea 73 en sitio); `packages/zoho-sync/src/db/migrate.test.ts` (guardianes en sitio y bloque nuevo al final); `apps/desk/server/db/contratos.ts` (líneas 2, 3 y 8 en sitio; resto al final); `apps/desk/server/db/contratos.test.ts` (al final).
**Estimación:** 81 de código (`schema.sql` 16, `migrate.ts` 2, `migrate.test.ts` en sitio 18, `db/contratos.ts` 45) + 105 de pruebas × 1,8 = 189 → **~270**.
**Salida prevista si pasa de 720:** no aplica; el margen es amplio.
**Requisitos:** RQ-TC-54 (traza, escritura condicionada, una transacción, sin `DELETE` ni clave foránea).

- [ ] 2.1 Anotar el commit de partida del intento y abrirlo. Anotar `wc -l` de `packages/zoho-sync/src/db/schema.sql` (768), `packages/zoho-sync/src/db/migrate.ts` (131), `packages/zoho-sync/src/db/migrate.test.ts`, `apps/desk/server/db/contratos.ts` (115) y `apps/desk/server/db/contratos.test.ts`. Leer `apps/desk/server/db/reasignaciones.test.ts:108-109` y `apps/desk/server/db/reasignaciones.ts:30-39` (moldes del doble de transacción y del `UPDATE` condicionado).
- [ ] 2.2 **Rojo** `packages/zoho-sync/src/db/migrate.test.ts`, bloque nuevo **al final** (tras la línea 819), molde de las líneas 785-819: la tabla `contrato_ampliaciones` existe en `public` y vacía; el `CREATE` calificado es la **penúltima** sentencia y el índice la **última**; dos sentencias la mencionan; la base rechaza `fecha_anterior`, `fecha_nueva`, `contrato_id` y `ampliado_por` nulos y acepta `motivo` nulo; `PUBLIC_TABLES` la contiene. Fija RQ-TC-54 («La traza no tiene `DELETE` ni FK»).
- [ ] 2.3 **Rojo, guardianes en sitio** (después de 2.2 y antes del `schema.sql`; deben quedar rojos): línea 282 (título «son 44 tablas: 10 de Desk, 31 de la app en public (contrato_ampliaciones, F1B-11; reasignaciones, F1B-05; …»), 283 (`toEqual([10, 31, 3])`), 284-286 (tres `toBe(44)`), 652 (suma `… + 3 + 2 + 1 + 2` y el mensaje gana «y las dos de public.contrato_ampliaciones (F1B-11, ampliacion-contrato)»), 794 (título: quinta, cuarta y tercera por el final; las dos últimas son las de `contrato_ampliaciones`), 796 (`l[l.length - 5]`), 798 (`l[l.length - 4]` y `l[l.length - 3]`), y 782 y 785 (sólo el texto: dejan de afirmar que cierran el esquema). **No se toca** la línea 799. Ver rojo.
- [ ] 2.4 **Rojo** `apps/desk/server/db/contratos.test.ts` (al final): `ampliarContrato` escribe la fecha vigente y una fila con los cinco datos (`contrato_id`, `fecha_anterior`, `fecha_nueva`, `motivo`, `ampliado_por`); dos ampliaciones encadenadas dejan dos filas en orden y `fechaFinOriginal` (de shared) sigue siendo la del alta; `fechaAnterior` desfasada lanza `ContratoCambiadoError`, la fecha no cambia y no hay fila; `motivo: null` se guarda como nulo; `ampliacionesDelContrato` devuelve de la más antigua a la más reciente con `ampliadoAt` en ISO; **estructura de la transacción** con el doble de `apps/desk/server/db/reasignaciones.test.ts:108-109`: `BEGIN`, `UPDATE`, `ROLLBACK` y **ningún** `INSERT` cuando el `UPDATE` no acierta fila; el texto del `UPDATE` empieza por `UPDATE contratos SET fecha_fin`. Fija RQ-TC-54 («Dos ampliaciones simultáneas», «Lo que falla no deja a medias fecha y traza»).
- [ ] 2.5 **Verde** `packages/zoho-sync/src/db/schema.sql`: añadir **al final** (tras la línea 768) el comentario (sin punto y coma, sin tildes, sin comentarios dentro del `CREATE`, sin nombrar `reasignaciones` ni `compuesto`), `CREATE TABLE IF NOT EXISTS public.contrato_ampliaciones (...)` y `CREATE INDEX IF NOT EXISTS idx_contrato_ampliaciones_contrato ON public.contrato_ampliaciones (contrato_id)` de D2; y en sitio la línea 559: «Sin DELETE. El unico UPDATE de datos es la ampliacion de fecha_fin (ampliacion-contrato)», misma línea y sin punto y coma.
- [ ] 2.6 **Verde** `packages/zoho-sync/src/db/migrate.ts` en sitio, línea 73: `PUBLIC_TABLES` gana `, 'contrato_ampliaciones'` detrás de `'reasignaciones'`. Confirmar que el fichero sigue en 131 líneas.
- [ ] 2.7 **Verde** `apps/desk/server/db/contratos.ts`: líneas 2 y 3 en sitio (importa `MENSAJES_AMPLIACION` y `type AmpliacionContrato`, y `enTransaccion` de `./transaccion`), línea 8 en sitio (comentario: «no hay `DELETE`. `UPDATE` sólo hay dos: la marca de ritmo y la ampliación de `fecha_fin` (al final), siempre con traza.»), y al final `ContratoCambiadoError`, la interfaz `Ampliar`, `ampliarContrato` (`UPDATE contratos SET fecha_fin = $2 WHERE id = $1 AND fecha_fin = $3 RETURNING ${COLUMNAS}`; 0 filas → `throw new ContratoCambiadoError`; luego el `INSERT`; devuelve el contrato) y `ampliacionesDelContrato` (`ORDER BY id`, fechas con `comoDiaCivil`). Ver el verde.
- [ ] 2.8 Comprobar la **hipótesis de pg-mem** (`fecha_fin = $3` con texto `YYYY-MM-DD` sin conversión): si falla, aplicar el respaldo del diseño (`$3::date` y `$2::date`) y anotar el resultado en `apply-progress.md`.
- [ ] 2.9 **Mutaciones M5, M6, M7, M8, M15, M16 y M17** (restaurando tras cada una): M5 sobre el fichero vigilado `schema.sql`, quitar `public.` del `CREATE` → rojos el guardián de clasificación y el bloque nuevo; M6 mover el `CREATE` antes de la siembra de accesorios → rojos la posición del bloque nuevo y `packages/zoho-sync/src/db/migrate.test.ts:798`; M7 quitar `NOT NULL` de `fecha_anterior` y, por separado, de `ampliado_por` → rojos los rechazos del bloque nuevo; M8 quitar `'contrato_ampliaciones'` de `PUBLIC_TABLES` → rojos clasificación y recuento; M15 quitar `AND fecha_fin = $3` → rojo `ContratoCambiadoError`; M16 quitar el `INSERT` y, por separado, invertirlo con el `UPDATE` → rojos fila de traza y estructura de la transacción; M17 `ORDER BY id DESC` → rojas las dos ampliaciones encadenadas.
- [ ] 2.10 Anotar en `apply-progress.md` las líneas reales leídas: el `UPDATE` condicionado y el `throw new ContratoCambiadoError` en `apps/desk/server/db/contratos.ts` (alimentan la fila 5 de la regla 13).
- [ ] 2.11 Comprobar `wc -l`: `migrate.ts` (131), `migrate.test.ts` (sólo crece el bloque final) y `db/contratos.ts`/`db/contratos.test.ts`/`schema.sql` (sólo crecen al final); declarar cuántas líneas.
- [ ] 2.12 **Cierre, códigos de salida 1 a 3:** `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [ ] 2.13 Medir: `git diff --shortstat --no-renames` contra el commit de 2.1 más `wc -l` de lo nuevo sin trackear; registrar la cifra. Si pasa de 720, parar y partir.
- [ ] 2.14 **Barrido de citas, regla de mutación 4,** `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` para `db/contratos.ts`, `db/contratos.test.ts`, `schema\.sql`, `migrate\.ts` y `migrate\.test\.ts` (incluidos `apps/` y `openspec/changes/archive/`); comprobar CADA resultado leyendo qué afirma la frase. Atención a lo que cambia de **contenido** sin moverse: `migrate.test.ts` líneas 282-286, 652 y 794-798 (la que cita `openspec/specs/gases-patron/spec.md:198` ya nombra su revisión, caso B: no se reescribe), `db/contratos.ts` línea 8 (citada por `openspec/config.yaml:4073` como estado de partida: caso C, se anota para el `archive-report.md`) y `DEPLOY.md:530` (cita la línea 768 por la siembra, sigue cierta). Segundo pase de las abreviadas.
- [ ] 2.15 Commit del lote 2.
- [ ] 2.16 **Cierre, código de salida 4:** `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [ ] 2.17 Asentar el intento.

---

## Lote 3 · ruta y lectura ampliada

**Depende de:** 2.
**Ficheros:** `apps/desk/server/routes/contratos.ts` (líneas 5, 9, 21, 22 y 33 en sitio; ruta nueva entre la línea 70 y la llave de cierre); `apps/desk/server/routes/contratosAmpliar.test.ts` (nuevo). `apps/desk/server/app.ts` no se toca (`hoy` es opcional).
**Estimación:** 38 de código + 150 de pruebas × 1,8 = 270 → **~310**.
**Salida prevista si pasa de 720:** no aplica.
**Requisitos:** RQ-TC-54 (ruta, escalera A < B < C < D, lectura) y RQ-TC-21 (`GET` aditivo).

- [ ] 3.1 Anotar el commit de partida del intento y abrirlo. Anotar `wc -l` de `apps/desk/server/routes/contratos.ts` (71). Leer `apps/desk/server/testing/appHarness.ts:34-40`, `apps/desk/server/testing/appHarness.ts:46`, `apps/desk/server/testing/appHarness.ts:86-95`, `apps/desk/server/routes/reasignacion.test.ts:221-230` (doble de carrera) y `apps/desk/server/routes/contratos.test.ts:24-31` (matriz por área).
- [ ] 3.2 **Rojo** `apps/desk/server/routes/contratosAmpliar.test.ts` (nuevo), éxito y permiso, con contratos de fechas fijas (por ejemplo fin `2031-06-30`) y `hoy` inyectado con una aplicación mínima local (`express()`, `express.json()`, `cookieParser()`, `registerContratosRoutes(app, { db, hoy })`): Comercial amplía → `200` con `{ contrato, ampliaciones, fechaFinOriginal }` y una fila de traza con persona de la sesión, fechas y motivo; administrador sin Comercial pasa; matriz por área (molde de `contratos.test.ts:24-31`); sin sesión `401`; `ampliadoPor` es el de la sesión aunque el cuerpo traiga otro nombre; el motivo se guarda recortado. Fija RQ-TC-54 (escenarios de éxito, administrador, sesión, motivo).
- [ ] 3.3 **Rojo, pruebas de POSICIÓN de la ruta** (regla de mutación 1), cada una con las **dos guardas activas a la vez**: A↔B Servicio Técnico sobre un id inexistente → `404`; A↔C Comercial, id inexistente y cuerpo vacío → `404`; id no numérico → `404` sin llegar a la base; B↔C Servicio Técnico, contrato real y cuerpo inválido → `403` sin fila; B↔D Servicio Técnico, cuerpo válido y doble de carrera → `403` y el doble no dispara; C↔D Comercial, motivo vacío y doble de carrera → `422`, el doble no dispara y la fecha queda intacta; D sola → `409` con `MENSAJES_AMPLIACION.carrera`, sin fila y con la fecha como la dejó la otra escritura. El doble de carrera es un `Queryable` **sin `connect`** que, antes de reenviar la sentencia que empieza por `UPDATE contratos SET fecha_fin`, escribe otra `fecha_fin` en la base real y cuenta los disparos. Fija RQ-TC-54 («El 404 gana al 403», «El 403 gana al 422», «El 422 gana al 409», «Dos ampliaciones simultáneas»).
- [ ] 3.4 **Rojo** lectura y valor por defecto en la misma prueba: `GET /api/contratos/:id` sirve `ampliaciones` y `fechaFinOriginal` (con dos ampliaciones encadenadas, la de la **primera** fila; sin ampliaciones, igual a la fecha de fin y nunca nulo) y conserva `contrato`, `estado` y `saldo`; sin sesión `401`. Una prueba más, por `appWith` y **sin** inyectar `hoy`, con el reloj en `2027-01-01T03:00:00Z`: un contrato que vence el `2026-06-30` se amplía al `2026-12-31` (`200`). Fija RQ-TC-54 («La ficha enseña la traza…», «Sin ampliaciones…») y RQ-TC-53 (instante UTC/zona de negocio).
- [ ] 3.5 **Verde** `apps/desk/server/routes/contratos.ts` en sitio: línea 5 (importa `MENSAJES_AMPLIACION, ampliacionDelCuerpo, fechaFinOriginal, type DiaCivil`), línea 9 (`ampliarContrato, ampliacionesDelContrato, ContratoCambiadoError`), línea 21 (`deps: { db: Queryable; hoy?: () => DiaCivil }`), línea 22 (`const { db } = deps; const hoy = deps.hoy ?? hoyEnZona`) y línea 33 (la ficha gana `ampliaciones` y `fechaFinOriginal`, misma línea). Confirmar que el fichero sigue en 71 líneas antes de la ruta.
- [ ] 3.6 **Verde** ruta nueva, insertada entre la línea 70 y la llave de cierre (empieza en la línea 72, tras una línea en blanco): `POST /api/contratos/:id/ampliar` con `requireAuth(db)`; paso 1 `404` (`MENSAJES_AMPLIACION.inexistente`), paso 2 `403` (`canExecuteTransition(user.areas, user.isAdmin, 'Comercial')`, antes de leer el cuerpo), paso 3 `422` (`ampliacionDelCuerpo(req.body, contrato, hoy())`), paso 4 `ampliarContrato` con `ampliadoPor: user.name` (del cuerpo sólo `fechaFin` y `motivo`) y `ContratoCambiadoError` → `409`, éxito `200`. Comentario propio de la ruta; el de cabecera no se amplía. Ver el verde.
- [ ] 3.7 Confirmar que las pruebas existentes de `apps/desk/server/routes/contratos.test.ts` (la de la ficha con `toMatchObject` en la línea 76 y la del espía en las líneas 80-84) siguen **verdes sin tocarse**; si el espía se rompiera, anotarlo en `apply-progress.md` y consultar (no se edita sin decisión).
- [ ] 3.8 **Mutaciones M1, M2, M3, M14, M18 y M20** (restaurando tras cada una): M1 permutar los pasos 1 y 2 → rojo el par A↔B; M2 permutar los pasos 2 y 3 → rojo el par B↔C; M3 escribir antes de validar (paso 4 antes del 3) → rojo C↔D (el doble dispara y la fecha cambia); M14 `deps.hoy ?? (() => new Date().toISOString().slice(0, 10))` → rojo la prueba del valor por defecto de 3.4; M18 `ampliadoPor` del cuerpo → rojo la prueba del actor de la sesión; M20 quitar `ampliaciones` o `fechaFinOriginal` de la lectura → rojo la prueba del `GET`.
- [ ] 3.9 Anotar en `apply-progress.md` las líneas reales leídas de `apps/desk/server/routes/contratos.ts`: el `404` (paso 1), el `403` (paso 2), el `422` (paso 3), el `409` (paso 4) y la línea de la ficha (alimentan la tabla de la regla 13).
- [ ] 3.10 Comprobar `wc -l`: `apps/desk/server/routes/contratos.ts` sólo crece por la ruta nueva (declarar cuántas líneas) y las cinco líneas en sitio mantienen su número; `grep` de que no existe ninguna sentencia `DELETE` sobre `contrato_ampliaciones` en el código de este cambio (RQ-TC-54, «Ningún flujo borra una ampliación»).
- [ ] 3.11 **Cierre, códigos de salida 1 a 3:** `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [ ] 3.12 Medir: `git diff --shortstat --no-renames` contra el commit de 3.1 más `wc -l` del fichero nuevo sin trackear; registrar la cifra. Si pasa de 720, parar y partir (las pruebas de la ruta no cambian de lote: lo que sobre sale de 3.4).
- [ ] 3.13 **Barrido de citas, regla de mutación 4,** `grep -rnoE "routes/contratos\.ts:[0-9]+(-[0-9]+)?"` (incluidos `apps/` y `openspec/changes/archive/`): `openspec/config.yaml:4072` (línea 43, intacta), `docs/sdd/ENTRADA.md:1239` (línea 24, intacta) y los paquetes de despliegue del 29/09 al 01/10 (casos B; la que apunta a la línea 33 cambió de **contenido** y no se reescribe). CADA resultado leído contra el fichero; segundo pase de las abreviadas.
- [ ] 3.14 Commit del lote 3.
- [ ] 3.15 **Cierre, código de salida 4:** `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [ ] 3.16 Asentar el intento.

---

## Lote 4 · efecto en las tres puertas

**Depende de:** 3.
**Ficheros:** `apps/desk/server/ampliacionContratoPuertas.test.ts` (nuevo). Sin código de producción.
**Estimación:** 115 de pruebas × 1,8 = 207 → **~210**.
**Salida prevista si pasa de 720:** no aplica.
**Hipótesis del lote, cada una con respaldo escrito:** (a) supertest no se cuelga con `vi.useFakeTimers({ toFake: ['Date'] })`; respaldo: `vi.mock('@ambientalia/shared', …)` sustituyendo sólo `hoyEnZona`. (b) el `now()` de pg-mem sigue al reloj falso; respaldo: usuario creado una vez y **sesión nueva tras cada salto de reloj** con `createSession` (se aplica desde el principio). (c) el alta de remisión no compara su `fecha` con hoy; la prueba usa una fecha coherente con el reloj falso.
**Sin rojo previo, declarado:** la ruta ya existe (lote 3), así que estas pruebas nacen verdes en el escenario completo; son de **caracterización del efecto** de RQ-TC-55 y su rojo se obtiene **mutando el escritor** (4.7), que es lo que prueba que discriminan. Cada paso del guion se escribe y se corre por separado (rechaza → amplía → deja pasar → vuelve a rechazar) para ver cada afirmación fallar al romper el escritor.
**Requisitos:** RQ-TC-55 (los seis escenarios), RQ-TC-25 sin cambios.

- [ ] 4.1 Anotar el commit de partida del intento y abrirlo. Leer los moldes: `apps/desk/server/services/ticketService.test.ts:985-995` (alta), `apps/desk/server/services/ticketService.test.ts:1049-1061` (transición con `habilitar_servicio`), `apps/desk/server/remisiones.test.ts:1294-1327` (remisión), `apps/desk/server/services/guardaGasPatron.test.ts:17` y `apps/desk/server/services/guardaGasPatron.test.ts:113` (reloj falso con pg-mem), `apps/desk/server/auth/sessions.ts:6` y `apps/desk/server/auth/sessions.ts:21` (caducidad de sesión).
- [ ] 4.2 Crear `apps/desk/server/ampliacionContratoPuertas.test.ts` con el andamiaje: `vi.useFakeTimers({ toFake: ['Date'] })`, `afterEach(() => { vi.useRealTimers() })`, base nueva por prueba con `migrate(db)`, usuario Comercial creado una vez y `createSession` nueva tras cada `vi.setSystemTime`, y los ayudantes mínimos copiados de los tres moldes (son locales a sus ficheros; no se tocan). Contrato del lote con fin `2031-06-30` dado de alta con `crearContrato`.
- [ ] 4.3 **Prueba de la puerta de alta** (`createManagedTicket`): reloj en `2031-07-15T15:00:00Z`; rechaza con «venció el 2031-06-30»; `POST /api/contratos/:id/ampliar` al `2031-09-30` por `appWith` → `200`; deja pasar la subOV; reloj en `2031-10-01T15:00:00Z`; vuelve a rechazar otra subOV del mismo lote con «venció el 2031-09-30». Fija RQ-TC-55 (alta y «Pasada la fecha nueva…»).
- [ ] 4.4 **Prueba de la puerta de transición** (`executeTransition` con `habilitar_servicio`), mismo guion de cinco pasos. Fija RQ-TC-55 (transición).
- [ ] 4.5 **Prueba de la puerta de remisión** (`POST /api/remisiones`), mismo guion, con fecha de la remisión coherente con el reloj falso. Fija RQ-TC-55 (remisión).
- [ ] 4.6 Añadir a la prueba de alta (o a una cuarta, si el tamaño lo pide) el escenario «El día de la fecha nueva todavía no bloquea»: reloj en `2031-09-30` → ninguna de las tres puertas lo da por vencido (RQ-TC-22, fecha de fin incluida). Si supertest se cuelga con el reloj falso, aplicar el respaldo (a) y anotarlo en `apply-progress.md`.
- [ ] 4.7 **Mutación del escritor** (restaurando tras cada una; fichero `apps/desk/server/db/contratos.ts`): quitar el `UPDATE` de `ampliarContrato` y, por separado, escribir `fecha_nueva = fecha_anterior` → deben ponerse rojos el «deja pasar» de las tres pruebas (el escritor real es lo que se mide, no un `UPDATE` a mano).
- [ ] 4.8 Confirmar que `apps/desk/server/remisiones.test.ts:988` y `apps/desk/server/ordenVentaUnTicket.test.ts` siguen verdes **sin cambiar sus aserciones**, y que `apps/desk/server/services/ticketService.ts` y `apps/desk/server/routes/remision.ts` no tienen diff en el lote (RQ-TC-55: las puertas no se tocan; IV-12 ni se amplía ni se corrige).
- [ ] 4.9 Anotar en `apply-progress.md` el resultado de las tres hipótesis (a, b y c) y cuál respaldo se usó, si alguno.
- [ ] 4.10 **Cierre, códigos de salida 1 a 3:** `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [ ] 4.11 Medir: `git diff --shortstat --no-renames` contra el commit de 4.1 más `wc -l` del fichero nuevo sin trackear; registrar la cifra. Si pasa de 720, parar y partir.
- [ ] 4.12 **Barrido de citas, regla de mutación 4:** fichero nuevo y sin código editado, así que basta comprobar con `git diff --stat` contra el commit de 4.1 que sólo hay un fichero añadido y ninguna cita nueva con forma de cita a línea prevista; segundo pase de las abreviadas no aplica.
- [ ] 4.13 Commit del lote 4.
- [ ] 4.14 **Cierre, código de salida 4:** `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [ ] 4.15 Asentar el intento.

---

## Lote 5 · cliente y cierre documental

**Depende de:** 3 (y de las líneas anotadas por 2.10 y 3.9). El lote 4 no es requisito del 5.
**Ficheros:** `apps/desk/src/api/client.ts` (línea 680 en sitio y función al final; hoy acaba en la línea 878); `apps/desk/src/components/ContratosPanel.tsx` (línea 17 en sitio); `apps/desk/src/components/ContratoFicha.tsx` (88 líneas, inserciones por dentro); sección nueva al final de `DEPLOY.md`; apartado nuevo al final de `docs/sdd/Paquete_de_Despliegue_2026-10-06.md`; corrección nueva al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`; la tabla de la regla 13 de este `tasks.md`. **No** se toca la fila F1B-11 del plan (ver «Después del archivo»).
**Estimación:** 300 brutas (`ContratoFicha.tsx` 80, `client.ts` 12, `ContratosPanel.tsx` 2, `DEPLOY.md` 25, paquete de despliegue 130, corrección al maestro 30, tabla de la regla 13 15; sin pruebas × 1,8) → **~300**.
**Salida prevista si pasa de 720:** no aplica; si el paquete de despliegue crece, se parte el cierre documental a un intento 5b.
**Sin rojo previo, declarado:** los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00; `vitest.config.ts:16`, `vitest.config.ts:17-20`); no se propone `jsdom` ni `@testing-library`. La comprobación es `npm run build` y la verificación en la aplicación (P.8). No hay lógica pura nueva: `cabeAmpliacion` y `topeAmpliacion` ya se probaron en el lote 1.
**Requisitos:** RQ-TC-54 y RQ-TC-53 (consumo desde el cliente; regla invariable 13).

- [ ] 5.1 Anotar el commit de partida del intento y abrirlo. Anotar `wc -l` de `apps/desk/src/api/client.ts` (878), `apps/desk/src/components/ContratoFicha.tsx` (88), `apps/desk/src/components/ContratosPanel.tsx`, `DEPLOY.md`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md` y `docs/sdd/Paquete_de_Despliegue_2026-10-06.md`: los tres documentos sólo crecen al final.
- [ ] 5.2 `apps/desk/src/api/client.ts`: línea 680 en sitio (`FichaContrato` gana `ampliaciones: import('@ambientalia/shared').AmpliacionContrato[]; fechaFinOriginal: string`) y, al final del fichero, `ampliarContrato(id, cuerpo): Promise<{ contrato; ampliaciones; fechaFinOriginal }>`, molde `apps/desk/src/api/client.ts:867-871`. Sin rojo previo.
- [ ] 5.3 `apps/desk/src/components/ContratosPanel.tsx` en sitio, línea 17: «No hay edición ni borrado. La fecha de fin se amplía desde la ficha (ampliacion-contrato).» Sin insertar líneas.
- [ ] 5.4 `apps/desk/src/components/ContratoFicha.tsx` (inserciones por dentro; la firma de la línea 15 no cambia): `const { user } = useAuth()` de `../auth/AuthContext` (como `ContratosPanel.tsx:3` y `ContratosPanel.tsx:20`); `puedeAmpliar = !!user && canExecuteTransition(user.areas, user.isAdmin, 'Comercial') && !!c && cabeAmpliacion(c, hoyEnZona())`; «Vigencia» sigue enseñando la vigente y gana «Fecha de fin original» cuando difiere; botón «Ampliar» y formulario con fecha (`max={topeAmpliacion(c.fechaFin)}`) y motivo, que **no valida** (envía y enseña el mensaje del servidor con `mensajeDelServidor`, `apps/desk/src/api/client.ts:660`); tras el éxito o un `409`, `ficha.reload()` e `informe.reload()`; sección «Ampliaciones» con quién, cuándo, fecha anterior, fecha nueva y motivo tal como llegan.
- [ ] 5.5 **Regla de mutación 3, por escrito:** releer el código ya escrito de los tres `.tsx`/`client.ts`, **enumerar** lo que el cliente bloquea, rellena o avisa y nombrar para cada decisión la línea del servidor que la impone, contra la tabla de seis filas de más abajo; si aparece una decisión que la tabla no tiene, se añade con su línea o se declara guarda. Escribir el resultado en `apply-progress.md`, sección «Decisiones del cliente».
- [ ] 5.6 Correr `npm run build` y mirar su código de salida (comprobación del cliente, en lugar de prueba; criterio de aceptación 12).
- [ ] 5.7 **Cerrar la tabla de la regla 13** de este `tasks.md`: sustituir cada «Prevista» por la ruta y la línea REAL, leída del fichero en el último commit de código (apoyándose en lo anotado por 2.10, 3.9 y 5.5), y comprobar que cada línea dice lo que la fila afirma. Las seis filas.
- [ ] 5.8 `DEPLOY.md`, sección nueva **al final**: «Comprobación de lectura tras desplegar F1B-11 (ampliación de contrato)», molde de las últimas secciones del fichero: tabla `public.contrato_ampliaciones` nueva, creada en el arranque, **sin interruptor ni variable** y `.env.example` sin cambios (dos frases); consulta de lectura de que la tabla existe y qué se rompe si falta; cómo se restaura una fecha ampliada (la `fecha_anterior` de la primera fila, a mano, es dato de producción); nunca `DELETE` sobre la tabla.
- [ ] 5.9 Añadir al final de `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` el apartado nuevo (el último hoy es el §12; el nuevo es el **§13**) «Añadido por `ampliacion-contrato` (F1B-11, `cierra: si`)»: qué entra (regla del tope, ruta con su escalera, traza, lectura ampliada, ficha), los supuestos S-1, S-2, S-4 y S-5 y los de la ronda de preguntas para Gerencia, los límites declarados (atomicidad sin probar de verdad por falta de pool, S-4 trimestre ya avisado, E-088 editar o borrar fuera de alcance, IV-11 sigue reducido, IV-12 intacto), las tareas de persona P.8 a P.11 **sin casillas**, y la **redacción de las entradas nuevas y del cambio de estado de E-086** para que las abra Supervisión (`docs/sdd/ENTRADA.md` no se toca). Leer antes el §12 para copiar su forma.
- [ ] 5.10 Añadir la corrección al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`: la última hoy es la **31** (línea 1524, «La de F1B-04, accesorios por modelo (31)»), así que la siguiente libre es la **32**; encabezado de capítulo «La de F1B-11, ampliación de contrato (32)», aviso de que cita la R08.4, «Dónde», «Texto actual», «Texto propuesto», «Lo que esta entrada NO pide». **Releer contra el `.md` las líneas 2655, 2656 y 5561** de `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md` antes de citarlas (año y tope abiertos; «la fila no se cierra»; punto pendiente). Declarar que cierra la fila F1B-11.
- [ ] 5.11 **Barrido de citas, regla de mutación 4,** por cada fichero editado en medio o en sitio: `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` sobre todo el repositorio, **incluyendo `apps/` y `openspec/changes/archive/`**, para `ContratoFicha\.tsx`, `ContratosPanel\.tsx`, `api/client\.ts`, `DEPLOY\.md` y `F0-01_Correcciones_para_el_maestro\.md`; CADA resultado comprobado contra el fichero y contra lo que **afirma** la frase (los rangos por los dos extremos); segundo pase de las abreviadas en los ficheros que ya citan esos módulos; verificar cada `ruta:línea` escrita en 5.7 a 5.10 contra su fichero; ningún ejemplo de cita rota con forma de cita. `wc -l` contra 5.1: los tres documentos sólo crecieron al final.
- [ ] 5.12 Comprobar con `git diff --stat` contra el commit de partida de la rama que `docs/sdd/ENTRADA.md`, `openspec/config.yaml` y el plan R01.4 siguen sin tocar.
- [ ] 5.13 **Cierre, códigos de salida 1 a 3:** `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO (más `npm run build` ya corrido en 5.6).
- [ ] 5.14 Medir: `git diff --shortstat --no-renames` contra el commit de 5.1 más `wc -l` de lo nuevo sin trackear; registrar la cifra. Si pasa de 720, partir según la cabecera.
- [ ] 5.15 Commit del lote 5.
- [ ] 5.16 **Cierre, código de salida 4:** `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [ ] 5.17 Asentar el intento.

---

## Tabla de la regla 13 — decisión del cliente → guarda del servidor

Se cierra en 5.7: cada «Prevista» se sustituye por la ruta y la línea real leída del fichero ya editado (no existe línea hoy; no se cita con forma de cita hasta entonces).

| # | Decisión del cliente | Servidor |
|---|---|---|
| 1 | «Ampliar» sólo se enseña a Comercial y administradores | **Prevista:** paso 2 (`403`) de la ruta nueva de `apps/desk/server/routes/contratos.ts`, con `canExecuteTransition` |
| 2 | El campo de fecha propone como máximo el 31/12 del año del vencimiento | **Prevista:** paso 3 (`422` `pasaDelTope`), con `motivoNoAmpliable` |
| 3 | No ofrece «Ampliar» si pasó el tope o no queda sitio (`cabeAmpliacion`) | **Prevista:** paso 3 (`422` `plazoCerrado` o `pasaDelTope`) |
| 4 | Pide motivo | **Prevista:** paso 3 (`422` `motivo`), con `ampliacionDelCuerpo` |
| 5 | Tras un `409`, recarga la ficha | **Prevista:** paso 4, el `UPDATE` condicionado de `ampliarContrato` en `apps/desk/server/db/contratos.ts` |
| 6 | Pinta la traza y la fecha original | No decide: llegan de `apps/desk/server/routes/contratos.ts:33` (misma línea, con los campos nuevos; releer en 5.7) |

---

## Verify — mutaciones que el verify deberá reproducir

No son casillas de apply: es la lista a reproducir por `sdd-verify` sobre el árbol final (cada una pone rojo lo que se indica; restaurar tras cada una). Las de apply (1.9, 2.9, 3.8, 4.7) son las propias de cada lote; el verify repite las 20.

- M1 Ruta: permutar los pasos 1 y 2 → par A↔B.
- M2 Ruta: permutar los pasos 2 y 3 → par B↔C.
- M3 Ruta: escribir antes de validar (paso 4 antes del 3) → par C↔D (el doble dispara y la fecha cambia).
- M4 `motivoNoAmpliable`: `plazoCerrado` el primero; `motivo` antes que la fecha → pares de orden de shared.
- M5 `schema.sql` (fichero vigilado): quitar `public.` del `CREATE` → guardián de clasificación y bloque nuevo.
- M6 `schema.sql`: mover el `CREATE` nuevo antes de la siembra de accesorios → posición del bloque nuevo y `packages/zoho-sync/src/db/migrate.test.ts:798`.
- M7 `schema.sql`: quitar `NOT NULL` de `fecha_anterior`; de `ampliado_por` → rechazos de la base del bloque nuevo.
- M8 Quitar `'contrato_ampliaciones'` de `PUBLIC_TABLES` → guardián de clasificación y recuento.
- M9 Tope ±1 día (`-12-30`; 01/01 del año siguiente) → bordes de `topeAmpliacion` y de `pasaDelTope`.
- M10 Tope con el año de `hoy`; año con `new Date(fechaFin).getFullYear()` → borde del 01/01 y contrato de otro año.
- M11 `<=` por `<` en «posterior a la vigente» → caso fecha igual → `noPosterior`.
- M12 `>` por `>=` en «posterior al tope» → ampliar exactamente al tope → `200`.
- M13 `>` por `>=` en «plazo cerrado» → `hoy` igual al tope todavía amplía (S-10).
- M14 Día en UTC: `deps.hoy ?? (() => new Date().toISOString().slice(0, 10))` → prueba del valor por defecto con el reloj en `2027-01-01T03:00:00Z`.
- M15 Quitar `AND fecha_fin = $3` del `UPDATE` → `409` de carrera y `ContratoCambiadoError` de la capa de datos.
- M16 Quitar el `INSERT` de la traza; invertirlo con el `UPDATE` → fila de traza; estructura de la transacción.
- M17 `fechaFinOriginal` desde la última fila; `ORDER BY id DESC` → dos ampliaciones encadenadas.
- M18 `ampliadoPor` tomado del cuerpo → prueba del actor de la sesión.
- M19 `cabeAmpliacion` siempre `true` → propiedad que la enfrenta a `motivoNoAmpliable`.
- M20 Quitar `ampliaciones` o `fechaFinOriginal` de la lectura → prueba del `GET`.

Más comprobaciones del verify: las pruebas existentes de las puertas (`apps/desk/server/remisiones.test.ts:988`) y de contratos en verde sin cambios en sus casos; `ticketService.ts` y `remision.ts` sin diff; ninguna sentencia `DELETE` sobre `contrato_ampliaciones`.

---

## En el archivo

No van en los lotes; los hace el `sdd-archive`, con la regla del archivo (la parte con carga de revisión, fusión del delta más `archive-report.md`, se mide antes de aplicar y no supera 800):

- Fusionar el delta de `tickets-core` por script comparando bloques: RQ-TC-53, RQ-TC-54 y RQ-TC-55 añadidos a continuación de RQ-TC-52, y RQ-TC-21 modificado en sitio; comprobar los códigos de salida antes de asentar. Barrer las citas a `openspec/specs/tickets-core/spec.md`: modificar RQ-TC-21 puede desplazar lo que la sigue.
- Escribir el `archive-report.md` con **una línea** sobre qué parte del contenido de la fila F1B-11 cubrió (sostiene `cierra: si`), la medición de cada intento, la anotación de caso C de `openspec/config.yaml:4073` (cita la línea 8 de `apps/desk/server/db/contratos.ts` como estado de partida), las tres preguntas para Gerencia (P.11), las entradas que Supervisión debe abrir y la lista de tareas de persona que siguen abiertas.
- Verificar con `git show --numstat` que el commit de archivo contiene sólo el cambio archivado.

## Después del archivo (fuera de los lotes)

- **Marcar cerrada la fila F1B-11 del plan** `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md` (la fila de `:91` y su remanente de `:216`), **igual que el precedente de F1B-05** (el commit que cerró esa fila tras su archivo): se hace **después** del `sdd-archive` y de la verificación, nunca en el lote 5, y respeta la regla de avance (sólo cuenta lo archivado con `cierra: si`). Barrido de citas de la regla de mutación 4 sobre el plan, que tiene citas a sus propias filas.

## Tareas de personas — fuera del recuento, archivar no las da por hechas

Sin casillas: son decisiones o comprobaciones de personas, no trabajo de una tanda en este repositorio. **Archivar este cambio no las da por hechas.** La tanda entrega lo que sí puede hacer en el repositorio (la sección de `DEPLOY.md`, 5.8; el apartado del paquete y la redacción de entradas para Supervisión, 5.9; el texto de la corrección, 5.10); lo de abajo sólo lo puede hacer quien tiene el acceso o la autoridad. Se comprobó que ninguna describe trabajo que una tanda pudiera hacer en el repositorio. P.5 (responder E-086) ya está respondida: `decision/e086-ampliacion-contrato`.

Heredadas de `registro-contrato` (`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:110-120`), siguen abiertas:

- **P.1** · Consulta de formato de subOV en producción. Dueño: Alfonso. Destino: resultado a Comercial y Supervisión. Queda escrito en: `openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md`.
- **P.4** · Literales de borrador y anulada en Books. Dueño: Alfonso. Destino: resultado a Supervisión. Queda escrito en: ese mismo informe.
- **P.6** · Verificar en la aplicación prioridad, bloqueo, informe, CSV y pasada de ritmo. Dueño: Comercial. Destino: tras el despliegue. Queda escrito en: ese mismo informe.
- **P.7** · Dar de alta los contratos vigentes. Dueño: Comercial. Destino: la pantalla de contratos. Queda escrito en: ese mismo informe.

Nuevas de esta tanda:

- **P.8** · Tras desplegar, ampliar un contrato real y comprobar traza, desbloqueo y rechazo fuera del tope; comprueba además la atomicidad real, que ninguna prueba cubre. Dueño: Comercial. Destino: tras el despliegue. Queda escrito en: `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` (§13) y el `archive-report.md`.
- **P.9** · Pegar en el maestro la corrección 32. Dueño: Gerencia. Destino: maestro (año y tope abiertos, fila que no se cierra, punto pendiente). Queda escrito en: `docs/sdd/F0-01_Correcciones_para_el_maestro.md`.
- **P.10** · Actualizar el estado de E-086 (sigue «nueva» aunque está decidida) y abrir las entradas que salgan de esta tanda. Dueño: Supervisión. Destino: `docs/sdd/ENTRADA.md`, que esta rama no toca por los cambios de Supervisión sin commitear en `main`. Queda escrito en: la redacción lista del §13 del paquete de despliegue.
- **P.11** · Responder las tres preguntas de la ronda: motivo obligatorio (S-1), ampliar más de una vez (S-2) y reevaluar el aviso de ritmo del trimestre ya avisado (S-4). Dueño: Gerencia. Destino: panel. Queda escrito en: el `archive-report.md` y el §13 del paquete de despliegue.
