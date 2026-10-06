# Tareas — respaldo-semanal-drive (F1F-02, `cierra: no`)

Strict TDD en toda tarea de comportamiento: la prueba va primero, en rojo, con su salida literal anotada en
`apply-progress`; después el código. Particion fijada en `design.md` §«Partición en dos intentos». Un intento por
worktree y sin rebasar con el intento abierto (regla del ciclo 3). Rutas bajo `apps/desk/server/respaldo/`.

## Intento 1 · (a) acceso a Drive, listado e incremental (≈ 483 líneas)

### Lote 1 · configuración
- [x] 1.1 RED→GREEN `configDrive.ts`: cargador (`=== 'true'`, `DIA` 0-6 por defecto 0, `HORA` 0-23 por defecto 5, `CARPETA_ID` `^[\w-]+$`, credencial base64 con `client_email` y `private_key`), `faltantesDrive` (reusa `config.ts:45-57` sin `DATABASE_URL`). Escenarios: Configuración incompleta, Interruptor apagado.
- [x] 1.2 RED→GREEN `tocaHoy(dia, fecha)` puro, `getDay()` local, tabla de casos.

### Lote 2 · acceso a Drive
- [x] 2.1 RED→GREEN `driveAuth.ts`: JWT RS256 verificable con `generateKeyPairSync`, token con caché y renovación a < 5 min; apagado no pide token.
- [x] 2.2 RED→GREEN `driveApi.ts`: `files.get` de la raíz, listado recursivo paginado con conjunto de visitadas, sin seguir accesos directos. Escenario: Fuera de la carpeta raíz.
- [x] 2.3 RED→GREEN `driveApi.ts`: descarga `alt=media` y exportación como flujo (Docs/Sheets/Slides/Drawings); otros nativos y `403 exportSizeLimitExceeded` se omiten y se anotan.

### Lote 3 · incremental
- [x] 3.1 RED→GREEN `incremental.ts`: tipos del índice, `huella` (`md5Checksum` o `modifiedTime`), `planificar`, `aplicarCopia`. Escenarios: Primera pasada, Pasada incremental.
- [x] 3.2 RED→GREEN `marcarDesaparecidos` sólo con listado completo; el reaparecido pierde la marca. Escenario: Listado incompleto.

### Cierre del intento 1
- [x] 4.1 `npm test`, `npm run typecheck`, `npx eslint .` (techo 165 avisos, 0 errores) y detector de citas: anotar los CUATRO códigos de salida.
- [x] 4.2 Medir: `git diff --shortstat --no-renames <base>` + `wc -l` de lo nuevo sin trackear; registrar eso en el ledger.

## Intento 2 · (b) subida, retención, cableado y DEPLOY.md (≈ 653 sin aviso · ≈ 716 con él)

### Lote 5 · retención y cifrado
- [ ] 5.1 RED→GREEN `retencion.ts`: `aRetirar`/`quitarRetirados`, 12 meses de calendario UTC. Escenarios: Retención de versión superada, Documento desaparecido.
- [ ] 5.2 Propiedad «nunca la última versión de un documento vivo» (Escenario: Última copia) y su mutación (retirar la última o ignorar `desaparecidoEn`) reproducida en rojo y restaurada.
- [ ] 5.3 RED→GREEN `cifrado.ts`: `descifrarBuffer` AL FINAL del fichero, mismas constantes, sin desplazar `cifrado.ts:12`.

### Lote 6 · subida multiparte e índice
- [ ] 6.1 RED→GREEN `multiparte.ts`: troceador de 8 MiB, Create/UploadPart (MD5 y SHA-256 por parte)/Complete, `200` con `<Error>` como fallo, Abort de mejor esfuerzo, `versionId`; 12 MiB = 2 partes.
- [ ] 6.2 RED→GREEN `multiparte.ts`: `DELETE ?versionId=` y `GET`; `403` devuelve fallo sin lanzar. Escenario: Borrado que falla.
- [ ] 6.3 RED→GREEN `indiceDrive.ts`: `404` = índice vacío (primera pasada); cualquier otro fallo o descifrado/JSON roto = aviso sin copiar ni borrar. Escenario: Índice ilegible.

### Lote 7 · orquestador y sin disco
- [ ] 7.1 RED `copiaDrive.ts`: prueba de posición interruptor → en curso → faltantes; mutación (mover cada guarda) pone rojo, reproducida y restaurada (regla de mutación 1). Escenarios: Interruptor apagado, Pasada ya en curso, Configuración incompleta.
- [ ] 7.2 GREEN `crearCopiadorDrive`: `pipeline` Drive → cifrador → troceador → UploadPart, un documento cada vez; fallo = Abort y anotar; escribe el índice; aviso único; nunca lanza. Escenarios: Pasada que falla, Restauración (ida y vuelta con `descifrarFichero`).
- [ ] 7.3 `sinDisco.test.ts`: `vi.mock` de `node:fs`, `node:fs/promises` y `tmpdir` con espías que lanzan; pasada con 12 MiB y un nativo termina `hecho` con cero llamadas. Escenario: Sin escritura en disco.
- [ ] 7.4 Guardián estático `escriturasEnDisco(fuente)` probado con fixture sintético con `createWriteStream(` que debe marcar (regla de mutación 2).
- [ ] 7.5 Mutación literal: `createWriteStream(path.join(os.tmpdir(), 'parte')).write(parte)` en el bucle de subida de `multiparte.ts`; deben ponerse rojos 7.3 y 7.4; restaurar.

### Lote 8 · cableado y despliegue
- [ ] 8.1 `index.ts`: imports en la línea 15 sin desplazar; bloque AL FINAL, tras `main().catch` de `:106-109`, con `scheduleDailyAt` + `tocaHoy`, cargando por su cuenta la configuración de avisos.
- [ ] 8.2 `DEPLOY.md` §13 al final (tras `:416`): dos frases del interruptor (qué enciende, qué se rompe si se pone mal), variables, líneas para `.env.example` que añade el usuario, bloqueo de borrado y regla `AbortIncompleteMultipartUpload`, restauración con `descifrarCli.ts`.

### Lote 9 · aviso de `drive_url` fuera (último, CON CORTE)
- [ ] 9.0 Medir antes: `git diff --shortstat --no-renames <base-del-intento>` + `wc -l` de lo nuevo sin trackear. Si pasa de 640, NO se construye 9.1-9.2 y se anota en `docs/sdd/ENTRADA.md` como entrada nueva sin dueño inventado; el escenario SHOULD queda declarado sin construir.
- [ ] 9.1 RED→GREEN `driveUrlsFuera` puro (`/folders/`, `/file/d/`, `/document/d/`, `?id=`; no reconocida = aparte). Escenario: `drive_url` fuera de la raíz.
- [ ] 9.2 `copiaDrive.ts`: `SELECT` de sólo lectura inyectado sobre `drive_url` (`equipos.ts:104`, `:115`) y aviso sin copiar.

### Cierre del intento 2
- [ ] 10.1 `npm test`, `npm run typecheck`, `npx eslint .` (165 avisos, 0 errores) y detector de citas: anotar los CUATRO códigos de salida.
- [ ] 10.2 Medida real (`git diff --shortstat --no-renames <base>` + `wc -l` sin trackear; binarios aparte) y barrido de citas (regla de mutación 4) sobre `index.ts`, `cifrado.ts` y `DEPLOY.md`: cada resultado contra el fichero.

## Tareas de persona — archivar no las da por hechas
Archivar NO las da por hechas. Destino: `archive-report.md` y el paquete de despliegue.

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Elegir proveedor (`p55c`; cuesta dinero) | Gerencia | `openspec/config.yaml` (`p55c`) |
| Credencial de Drive en el gestor de secretos, nunca en un chat | Persona con acceso a producción | `DEPLOY.md` §13 |
| Bloqueo de borrado y regla `AbortIncompleteMultipartUpload` en el almacenamiento | Persona con acceso a producción | `DEPLOY.md` §13 |
| Añadir las líneas a `.env.example` | Usuario | `DEPLOY.md` §13 |
| Encender `RESPALDO_DRIVE_HABILITADO` | Persona con acceso a producción | Paquete de despliegue |
| Prueba mensual de restauración con un documento de la carpeta | Persona con acceso a producción | Parte de despliegue |

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | (a) ≈ 483 · (b) ≈ 653 sin aviso, ≈ 716 con él |
| Riesgo frente a 800 | Bajo (a) · Medio (b): válvula 720, corte del lote 9 en 640 |
| Chained PRs recommended | No |
| Suggested split | Una rama, dos intentos (a) → (b) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High (presupuesto del proyecto: 800 por intento, no 400)

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 (a) | Acceso a Drive, listado e incremental | Rama única | `npx vitest run apps/desk/server/respaldo/configDrive.test.ts apps/desk/server/respaldo/driveAuth.test.ts apps/desk/server/respaldo/driveApi.test.ts apps/desk/server/respaldo/incremental.test.ts` | N/A: módulos sin cablear, nada los invoca | Cuatro ficheros nuevos |
| 2 (b) | Subida, retención, cableado y DEPLOY.md | Rama única | `npx vitest run apps/desk/server/respaldo/` | Pasada con `fetchImpl` doble y 12 MiB (sinDisco.test.ts); real sólo tras `p55c` | `index.ts` (bloque final), `DEPLOY.md` §13 y ficheros nuevos; interruptor cerrado |
