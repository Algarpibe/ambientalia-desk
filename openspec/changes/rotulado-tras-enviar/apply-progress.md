# Progreso de apply: rotulado-tras-enviar

## Lote 1a — retirada de las dos guardas, G2, S12, esquema, `enviado_por_id`

Partida `036a9e2`. Hechas 1a.1 a 1a.16 salvo lo que el orquestador cierra (commit, detector de citas). Sin tocar `apps/desk/src/components`, `openspec/specs/`, `CLAUDE.md`, `config.yaml` ni `ENTRADA.md`.

**Rojo literal (antes del producto), por grupo**
- `packages/shared/src/recepcion.test.ts` (`npx vitest run` sobre el fichero): 5 failed | 64 passed. «expected { ok: false, …(1) } to match object { ok: true }» (6), «'Confirma que el equipo quedó rotulado…' to be 'OK'» (PA-3), «'Falta confirmar que el equipo quedó r…' to match /Falta la foto de cada novedad marcada…/» y «…to match /Faltan fotos obligatorias/» (PE-3), «…to contain 'no admite accesorios marcados…'» (PI-7).
- `apps/desk/server/recepcion.test.ts`: 5 failed | 68 passed. «rotulado=false: expected 422 to be 201», «expected 'Admin' to be null», «expected 422 to be 200» (línea 370), «expected 'Falta confirmar que el equipo quedó r…' to match /Faltan fotos obligatorias/» (S3a), «expected '2026-10-13T00:03:24.329Z' to be null» (PT-1b).
- `apps/desk/src/lib/recepcionForm.test.ts`: 1 failed | 31 passed. «expected 'Confirma que el equipo quedó rotulado…' to be null» (línea 66). La 88 nace verde por construcción (pasa a un cuerpo con la lista vacía).
- `migrate.test.ts` (con el esquema ya ampliado, orden de trabajo: rojo = ajustes de D7 hechos antes que `schema.sql`): «ALTER TABLE en schema.sql: expected 64 to be 66» y tres «expected … to match /^CREATE TABLE IF NOT EXISTS public\.…/» (índices desplazados).
- `PS-12`: «1 failed | 11 passed» (columnas inexistentes), reconfirmado quitando las 4 líneas de `schema.sql`.
- `apps/desk/server/rotulado.test.ts` (R42-a, R42-b, R42-d): `column "enviado_por_id" does not exist` en las tres.

**Verde**: las mismas, tras `schema.sql` (+4 líneas, CRLF), `recepcion.ts` (5 líneas), `db/remisiones.ts`, `routes/remision.ts` y `types.ts`. R42-e (pg-mem con `enviado_por_id = $4` en `null`) nace verde.

**Mutaciones** (copia previa en el directorio temporal de la sesión; restauradas con `cmp`)
| Mutación | Prueba roja | Restaurada |
|---|---|---|
| M1 guarda del alta en `recepcion.ts:101` | `packages/shared/src/recepcion.test.ts` «6 · retirado…», PA-3 «sin ningún defecto pasa…», PI-7; `apps/desk/server/recepcion.test.ts` «rotulado que no es exactamente true (false, "true", 1) → 201…» | sí |
| M2 guarda del envío en `recepcion.ts:155` | PE-3, «motivoNoEnviable: formulario nuevo…», S3a, «rotulado_at anulado por SQL… → 200» (línea 370) y 21 más del envío | sí |
| M14a `ALTER` de `enviado_por_id` sin `public.` | PS-12; `migrate.test.ts:345` («las ALTER sin calificar son exactamente…»), `migrate.test.ts:332` («toda ALTER TABLE apunta a una tabla clasificada…») y el recuento («son 66 ALTER…») | sí |
| M14b `ALTER` de `aviso_sin_etiqueta_at` sin `public.` | las mismas cuatro | sí |
| M15 el alta vuelve a escribir `rotulado_at`/`rotulado_por` | PT-1b, «el cuerpo no decide…» (157-162) y «rotulado que no es exactamente true…» (86-94) | sí |
| M16a `reclamarEnvio` sin `enviado_por_id` | R42-a, R42-b | sí |
| M16b `liberarEnvio` sin limpiarlo | R42-d | sí |
(La primera versión de M15 insertaba la sentencia dentro de los argumentos de `db.query` y no ponía nada rojo: era una mutación mal puesta, no una prueba floja; se repuso detrás del `INSERT`.)

**Pruebas existentes cambiadas a propósito (en sitio, mismo número de línea)**: `packages/shared/src/recepcion.test.ts` 79-84, 99, 117, 120, 123, 126, 129, 131, 264, 272-273, 365, 374; `apps/desk/server/recepcion.test.ts` 65, 73, 86, 89-91, 93, 144, 157-162, 273, 370, 375, 463, 468-469, 570, 578; `apps/desk/src/lib/recepcionForm.test.ts` 66, 88; `packages/zoho-sync/src/db/migrate.test.ts` 374 (título), 376, 377, 794, 796, 798, 837, 839, 840, 877, 879, 880, 882 y **652** (no estaba en D7). El antes y el después están en `git diff 036a9e2`.

**Hipótesis resueltas**
- pg-mem acepta `enviado_por_id = $4` con `null` (R42-e) y con un id (R42-a).
- `novedadesSiembra.test.ts:97` sigue en seis: la expresión de `:94` no casa con los nombres nuevos (verde sin tocarlo).
- `migrate.test.ts:652` cuenta sentencias de `schema.sql` (`.toBe(ultima + 1 + … + 6)`; 173 → 175): el diseño no lo había visto. Se subió `+ 2` en sitio, con el texto del mensaje.
- `migrate.test.ts:385` (conjunto de identidades) no cambia, como decía D7.

**Códigos de salida**: `npm test` 0 (268 ficheros pasan | 3 omitidos; 4473 pruebas pasan | 11 omitidas); `npm run typecheck` 0; `npx eslint . --max-warnings 165` 0 (165 avisos, 0 errores).

**Regla de mutación 4**: `wc -l` igual que en la partida salvo `schema.sql` (828 → 832, al final): `recepcion.ts` 206, `routes/remision.ts` 397, `db/remisiones.ts` 240, `types.ts` 810, `migrate.test.ts` 911. Ninguna línea existente cambió de número. Citas que dejan de ser ciertas, sin editar: `openspec/specs/remisiones/spec.md:170` (cita el texto de `db/remisiones.ts:129-131`, el comentario viejo; lo sustituye el delta al archivar); `DEPLOY.md:254` (el `INSERT` de `createRemision` ya no nombra `rotulado_at` ni `rotulado_por`, `apps/desk/server/db/remisiones.ts:47`); `docs/sdd/ENTRADA.md:1828` (línea 101 pedía confirmar antes de crear; E-167); `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:210` y `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:255` (ídem, caso B); rangos `recepcion.ts:97-101` y `:151-162` en `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:585` y `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:863` (caso B); en `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/` las citas a `recepcion.ts:101` (`verify-report.md:148`) y a `db/remisiones.ts:47-50` y `routes/remision.ts:250` (`design.md:193`, `design.md:244`, `design.md:246`, `verify-report.md:89`, `verify-report.md:101`, `verify-report.md:136`, `verify-report.md:158`): caso B, archivo. Las demás citas a esas líneas siguen ciertas (el `INSERT` conserva `'entrada'` y `'pendiente'` en la 48; la 250 conserva `hayNovedad`).

**Medida**: `git diff --shortstat --no-renames 036a9e2`: 10 ficheros, 97 inserciones, 76 borrados = 173; más `apps/desk/server/rotulado.test.ts` nuevo, 84 líneas; más este fichero. Con `tasks.md` (16+16) el diff queda en 11 ficheros, 113 inserciones y 92 borrados = 205; más 84 y 43 = **332** en total, muy bajo la válvula de 720.

**Desvíos del diseño**: (1) `migrate.test.ts:652` (arriba). (2) R42-e, prueba extra. (3) Nada más: `recepcion.ts` quedó en 206 líneas y el alta no reordena guardas (IV-12 intacto).
