# Diseño: copia semanal de la carpeta de Drive (F1F-02, `cierra: no`)

## Enfoque técnico

Una pasada semanal recorre la carpeta raíz de Drive con una cuenta de servicio de sólo lectura, compara el listado con
un **índice cifrado** guardado en el propio almacenamiento, descarga (o exporta) sólo lo nuevo o cambiado como flujo,
lo cifra con el **mismo** `cifrador` de la nocturna (`apps/desk/server/respaldo/cifrado.ts:23-37`, formato `DESKR1` de
`cifrado.ts:12`) y lo sube por **subida multiparte S3**, una parte en memoria cada vez, sin tocar el disco. Al final
aplica la retención de 12 meses sobre el índice, escribe el índice y, si hubo algún fallo u omisión, avisa con el mismo
`avisarFallo` (`apps/desk/server/respaldo/dependencias.ts:56-67`). Nunca lanza. Todo lo que toca la red se inyecta
(`fetchImpl`), como en `dependencias.ts:79-87`. La lógica de decisión (incremental, desaparecidos, retención, día de la
semana, `drive_url` fuera) son **funciones puras** sobre el índice y el listado.

## Decisiones de arquitectura

| Tema | Opciones | Decisión y razón |
|---|---|---|
| Subida sin disco | (1) `PUT` en memoria para pequeños + multiparte para grandes; (2) **sólo multiparte** | **(2).** Una sola vía: S3 admite una subida multiparte de una sola parte de cualquier tamaño (la última parte puede ser < 5 MiB). Cuesta tres peticiones por fichero en vez de una, irrelevante en una pasada semanal. Partes fijas de **8 MiB**. Memoria máxima ≈ una parte + un trozo entrante (≤ 64 KiB) + la copia que haga `fetch` del cuerpo: **~16-24 MiB**, un fichero cada vez. El índice se sube por la misma vía |
| Firma de las partes | `UNSIGNED-PAYLOAD` como la nocturna (`dependencias.ts:73`) o hash real | **Hash real.** La parte ya está en memoria: `hashCuerpo` = SHA-256 de la parte y `Content-MD5` por parte. Hipótesis: el bloqueo de borrado exige `Content-MD5` (o checksum) también en `UploadPart`; mandando los dos se cubre. `firmarPeticion` (`apps/desk/server/respaldo/firmaS3.ts:30-44`) ya firma `uploadId`/`partNumber`/`uploads` como consulta canónica (`firmaS3.ts:37`) |
| Cierre multiparte | — | `CompleteMultipartUpload` con XML de `PartNumber`+`ETag`; se trata como fallo un `200` cuyo cuerpo traiga `<Error>` (hipótesis: comportamiento documentado de S3). Se guarda `x-amz-version-id`. En cualquier fallo, `AbortMultipartUpload` de mejor esfuerzo |
| Criterio incremental | `md5Checksum` / `modifiedTime` | **Huella = `md5Checksum` si existe; si no, `modifiedTime`.** El MD5 es del contenido: no recopia por mover o renombrar y detecta un cambio aunque el cliente conserve la fecha (hipótesis). Los nativos de Google no traen MD5 ni `size`: para ellos sólo cabe la fecha. Una huella distinta de la última versión del índice = copiar |
| Nativos de Google | exportar / avisar y omitir | **Exportar** Docs→`.docx`, Sheets→`.xlsx`, Slides→`.pptx` (se pueden volver a subir a Drive; PDF no es editable), Drawings→`.pdf`. Otros nativos (Forms, Sites, Maps…) y accesos directos: **se omiten y se avisan**. Hipótesis: `files.export` limita a ~10 MB; un `403 exportSizeLimitExceeded` se omite y se avisa, sin tumbar la pasada |
| Acceso a Drive | SDK de Google / propio | **Propio**, por el mismo motivo que `firmaS3.ts:6-8`: JWT RS256 con `node:crypto` (`createSign`) → token OAuth (`drive.readonly`, renovado si le quedan < 5 min) → Drive v3 `files.get` de la raíz, `files.list` recursivo (`'<id>' in parents and trashed=false`, `supportsAllDrives`, `includeItemsFromAllDrives`, `pageSize=1000`, paginación), y `alt=media` / `export` como flujo (`Readable.fromWeb`). Carpetas visitadas en un conjunto: no hay ciclos. Los accesos directos no se siguen (podrían salir de la carpeta) |
| Índice | tabla en `schema.sql` / objeto en el almacenamiento | **Objeto cifrado `drive/indice.json.enc`**, leído y escrito entero en memoria. No toca `schema.sql`. Su historia la guarda el versionado que el bloqueo de borrado exige (hipótesis por proveedor) |
| Índice ausente o ilegible | copia completa / abortar | **`404` = primera pasada** (índice vacío, copia completa). **Cualquier otro fallo** (red, descifrado, JSON) = **aviso y se aborta sin copiar nada**. Copiar a ciegas duplicaría todo y, peor, escribiría un índice que **olvida** las versiones viejas: nunca se retirarían y se perdería el mapa nombre→objeto que la restauración necesita |
| Claves de objeto | — | `drive/archivos/<fileId>/<AAAA-MM-DDTHH-MM-SSZ>.enc`. El nombre del documento **no** va en la clave (iría sin cifrar en el almacenamiento); va en el índice. «La versión a una fecha» = la de mayor `copiadaEn` ≤ fecha; sin índice, listando el prefijo del `fileId` en orden |
| Desaparecidos | marcar con listado parcial / sólo completo | **Sólo con listado completo.** Si `files.get` de la raíz o cualquier página falla, se aborta **antes** de marcar desaparecidos: un listado parcial marcaría como borrados documentos vivos y, a los 12 meses, la retención los borraría. Un documento que reaparece pierde la marca |
| Retención | ciclo de vida del proveedor / **código** | **Código, guiado por el índice** (cerrado en la propuesta). Se retira una versión si `superadaEn` + 12 meses ≤ ahora, o todas las de un documento si `desaparecidoEn` + 12 meses ≤ ahora. **La última versión de un documento vivo no tiene `superadaEn` ni el documento `desaparecidoEn` por construcción**, así que no es candidata nunca; la prueba lo fija como propiedad. 12 meses de calendario, UTC |
| `DELETE` y bloqueo | — | Se borra **con `?versionId=`** (sin él, en un almacenamiento versionado sólo se crea un marcador y no se libera nada). Como `superadaEn` ≥ fecha de subida, en operación normal el plazo de la aplicación vence **después** que el del bloqueo, y el `DELETE` pasa. Si el almacenamiento tiene un bloqueo más largo o hay desfase de reloj, responde `403`: la versión **se queda en el índice**, se avisa y se reintenta la semana siguiente. Eso está bien: es justo la propiedad de `p55b` (`openspec/config.yaml:2621`), que ni un servidor comprometido borre antes de plazo. Un `DELETE` fallido no tumba la pasada |
| Programación | `scheduleWeeklyAt` nuevo / reusar | **Reusar `scheduleDailyAt`** (`packages/zoho-sync/src/booksHub/schedule.ts:10`) sin tocarlo, con `tocaHoy(dia, fecha)` puro dentro de la tarea. Usa `getDay()` local porque `msUntilNextRun` programa en hora local (`schedule.ts:4`) |
| Configuración | ampliar `config.ts` / fichero nuevo | **`configDrive.ts` nuevo.** No toca `AppConfig` ni desplaza `config.ts:28-57`. Reutiliza `cargarConfigRespaldo` y `faltantes` (`config.ts:45-57`), filtrando `DATABASE_URL` (`config.ts:55`), que la copia de Drive no usa |
| Una pasada a la vez | compartir la guarda de la nocturna / propia | **Propia** (`enCurso` como `respaldo.ts:41`, `:79-85`): `pg_dump` y Drive no compiten por el mismo recurso |
| Aviso de `drive_url` fuera | en (b) / diferir | **En (b), como último lote y con corte medido** (ver partición). Puro: extrae el id de la URL (`/folders/`, `/file/d/`, `/document/d/`…, `?id=`) y lo busca entre las carpetas y ficheros vistos. Lectura de `drive_url` (`apps/desk/server/db/equipos.ts:104`, `:115`) con un `SELECT` de sólo lectura inyectado. URL no reconocida = se lista aparte |

## Flujo de datos

    scheduleDailyAt(hora) ─→ tocaHoy(dia)? ─→ copiador.lanzar()
      interruptor → en curso → faltantes            (orden fijado por prueba de posición)
      leerIndice (404 ⇒ vacío; otro fallo ⇒ aviso y fin)
      Drive: token → files.get(raíz) → files.list recursivo (completo o fin)
      planificar(índice, listado) ─→ por cada documento a copiar, de uno en uno:
          Drive alt=media|export ─→ cifrador(DESKR1) ─→ troceador 8 MiB ─→ UploadPart(MD5+SHA256)
          Complete ⇒ aplicarCopia(índice)   |   fallo ⇒ Abort + anotar, seguir
      marcarDesaparecidos ─→ aRetirar(índice, ahora) ─→ DELETE ?versionId (403 ⇒ anotar, seguir)
      escribirIndice (multiparte, cifrado) ─→ aviso único si hubo fallos, omisiones o drive_url fuera

`pipeline(flujoDrive, cifrador(clave), async (fuente) => { for await … })`: el sumidero espera cada `UploadPart` antes de
pedir más, así que la contrapresión limita la memoria a una parte.

## Restauración con `descifrarCli.ts` — comprobado

S3 concatena las partes en orden, así que el objeto es byte a byte la salida del `cifrador`: `MAGIA` · IV · cifrado ·
etiqueta. `descifrarFichero` (`cifrado.ts:40-52`) lee exactamente eso y no mira el contenido, de modo que
`descifrarCli.ts` (`apps/desk/server/respaldo/descifrarCli.ts:19`) restaura también estas copias y el índice. Sólo su
texto de uso dice `.dump` (`descifrarCli.ts:15`); no se toca, y `DEPLOY.md` lo explica.

## Interfaces

```ts
interface ConfigDrive { habilitado: boolean; dia: number; hora: number; credencial: string; carpetaId: string }
interface ArchivoDrive { id: string; nombre: string; ruta: string; mimeType: string; huella: string; exportarComo?: string }
interface VersionCopiada { clave: string; versionId?: string; copiadaEn: string; huella: string; superadaEn?: string }
interface EntradaIndice { nombre: string; ruta: string; mimeType: string; desaparecidoEn?: string; versiones: VersionCopiada[] }
interface IndiceDrive { formato: 1; actualizado: string; documentos: Record<string /* fileId */, EntradaIndice> }
```

Puras: `huella`, `planificar`, `aplicarCopia`, `marcarDesaparecidos`, `aRetirar`, `quitarRetirados`, `tocaHoy`,
`driveUrlsFuera`. Inyectadas: `fetchImpl`, `ahora`, `avisar`, `equiposConDrive`.

**Variables nuevas** (valores sólo en el gestor de secretos): `RESPALDO_DRIVE_HABILITADO` (`=== 'true'`),
`RESPALDO_DRIVE_CREDENCIAL` (JSON de la cuenta de servicio en base64; se valida que traiga `client_email` y
`private_key`), `RESPALDO_DRIVE_CARPETA_ID` (`^[\w-]+$`, se interpola en la `q`), `RESPALDO_DRIVE_DIA` (0-6, por defecto
0) y `RESPALDO_DRIVE_HORA` (0-23, por defecto 5, después de la nocturna). Reutiliza `RESPALDO_S3_*`,
`RESPALDO_CLAVE_CIFRADO` y `RESPALDO_AVISO_EMAIL`. El aviso nunca incluye la credencial ni el token: sólo estado HTTP y
300 caracteres del cuerpo, como `dependencias.ts:76`.

## Ficheros

| Fichero | Acción | Qué |
|---|---|---|
| `apps/desk/server/respaldo/configDrive.ts` | Crear | Cargador, `faltantesDrive`, `tocaHoy` |
| `apps/desk/server/respaldo/driveAuth.ts` | Crear | JWT RS256 y token con caché |
| `apps/desk/server/respaldo/driveApi.ts` | Crear | Raíz, listado recursivo, descarga/exportación como flujo, tabla de exportación |
| `apps/desk/server/respaldo/incremental.ts` | Crear | Tipos del índice, huella, `planificar`, `aplicarCopia`, `marcarDesaparecidos` |
| `apps/desk/server/respaldo/retencion.ts` | Crear | `aRetirar`, `quitarRetirados` |
| `apps/desk/server/respaldo/multiparte.ts` | Crear | Troceador, Create/UploadPart/Complete/Abort, `DELETE ?versionId`, `GET` |
| `apps/desk/server/respaldo/indiceDrive.ts` | Crear | Leer/escribir el índice cifrado |
| `apps/desk/server/respaldo/copiaDrive.ts` | Crear | `crearCopiadorDrive`, dependencias reales, `driveUrlsFuera` |
| `apps/desk/server/respaldo/sinDisco.test.ts` | Crear | Prueba fija sin disco y guardián estático |
| `apps/desk/server/respaldo/cifrado.ts` | Modificar (al final) | `descifrarBuffer` para el índice en memoria; mismas constantes de formato, no se duplican. No desplaza `cifrado.ts:12` |
| `apps/desk/server/index.ts` | Modificar | Imports en la línea 15 (sin desplazar) y bloque **al final del fichero**, tras `:106-109`: nada citado se mueve |
| `DEPLOY.md` | Modificar | §13 nuevo al final (tras `:416`): las dos frases del interruptor, variables, líneas para `.env.example`, bloqueo y regla `AbortIncompleteMultipartUpload`, restauración |

## Estrategia de pruebas (strict_tdd)

| Capa | Qué | Cómo |
|---|---|---|
| Unidad pura | incremental, desaparecidos sólo con listado completo, retención (propiedad: nunca la última de un vivo), `tocaHoy`, `driveUrlsFuera` | Tablas de casos |
| Unidad red | JWT verificable con `generateKeyPairSync`; paginación y recursión; export y omisiones; multiparte con 12 MiB = 2 partes, MD5/SHA por parte, `200` con `<Error>`, Abort | `fetchImpl` doble que registra peticiones |
| Orquestador | apagado: ni Drive ni subida ni aviso; orden interruptor → en curso → faltantes (**regla de mutación 1**: moverlas pone rojo); índice `404`/ilegible; `DELETE 403` no tumba; nunca lanza | Dependencias dobles |
| Restauración | objeto multiparte reensamblado → `descifrarFichero` devuelve el original | Ida y vuelta |

**Prueba fija sin disco.** `vi.mock('node:fs')` y `vi.mock('node:fs/promises')` sobre el original, sustituyendo
`createWriteStream`, `writeFile(Sync)`, `appendFile`, `open(Sync)`, `mkdtemp(Sync)` por espías que lanzan; espía en
`tmpdir` de `node:os`. Una pasada completa con un documento de 12 MiB y otro nativo: debe terminar `hecho` y con cero
llamadas. Además, `escriturasEnDisco(fuente)` rechaza `node:fs`, `'fs'`, `createWriteStream`, `writeFile`, `tmpdir`,
`mkdtemp` en los fuentes de los ocho módulos nuevos (excepto el `.test.ts`). **Regla de mutación 2:** el guardián se
prueba con un fixture sintético que contiene `createWriteStream(` y debe marcarlo. **Mutación literal** que pone en
rojo las dos: en el bucle de subida de `multiparte.ts`, `createWriteStream(path.join(os.tmpdir(), 'parte')).write(parte)`.

## Matriz de amenazas

N/A — sin enrutado, shell, subprocesos, automatización de VCS/PR ni clasificación de ejecutables. Secretos: ver
Interfaces.

## Partición en dos intentos (×1,8 con pruebas; válvula 720)

| Intento | Fichero | Código | Con pruebas |
|---|---|---|---|
| (a) | `configDrive.ts` | 40 | 72 |
| (a) | `driveAuth.ts` | 40 | 72 |
| (a) | `driveApi.ts` | 85 | 153 |
| (a) | `incremental.ts` | 70 | 126 |
| (a) | apply-progress | — | 60 |
| **(a)** | **total** | | **≈ 483** |
| (b) | `retencion.ts` (pura) | 35 | 63 |
| (b) | `cifrado.ts` (+`descifrarBuffer`) | 12 | 22 |
| (b) | `multiparte.ts` | 85 | 153 |
| (b) | `indiceDrive.ts` | 30 | 54 |
| (b) | `copiaDrive.ts` | 110 | 198 |
| (b) | `sinDisco.test.ts` | — | 50 |
| (b) | `index.ts` + `DEPLOY.md` §13 | 8 + 45 | 53 |
| (b) | apply-progress | — | 60 |
| (b) | aviso `drive_url` (último lote) | 35 | 63 |
| **(b)** | **total** | | **≈ 653 sin el aviso · ≈ 716 con él** |

La retención va en (b), como fija el encargo de la tanda («(b) subida en streaming, retención, cableado del
programador, DEPLOY.md»); la primera redacción la adelantaba a (a) por ser pura. **Corte del último lote:** antes de
empezar el aviso de `drive_url` se mide; si el intento ya pasa de **640**, se difiere como punto anotado en
`docs/sdd/ENTRADA.md`, sin dueño inventado, y el escenario SHOULD de la spec queda sin construir y declarado.

## Supuestos (reversibles)

- **S-1** Cuenta de servicio dedicada, compartida como lectora sobre la carpeta (o miembro de la unidad compartida).
- **S-2** Una sola carpeta raíz (`p55b`, singular); lo de fuera sólo se avisa.
- **S-3** Formatos Office para nativos; límite de exportación ~10 MB (hipótesis).
- **S-4** Almacenamiento versionado y con bloqueo de borrado de 12 meses; `Content-MD5` por parte (hipótesis).
- **S-5** Domingo a las 5, hora del contenedor; 12 meses de calendario en UTC.
- **S-6** Sin reintentos dentro de la pasada: lo que falla se reintenta la semana siguiente.
- **S-7** Sin ruta manual de lanzamiento: la primera pasada es la del primer día programado tras encender.

## Riesgos

- Índice perdido o corrupto: la pasada se detiene y necesita a una persona (restaurar una versión anterior del índice).
- Fallo al escribir el índice tras subir: objetos huérfanos, retenidos 12 meses y recopiados la semana siguiente.
- Compatibilidad de R2/B2 con versionado, bloqueo y multiparte (hipótesis): se comprueba al elegir proveedor (p55c).
- Cuotas o `429` de Drive en carpetas grandes: se avisa y se reintenta; sin medición del tamaño real de la carpeta.

## Despliegue

Nace cerrado; sin migración. Encender espera a `p55c` (`openspec/config.yaml:3872`). Tareas de persona: credencial,
bloqueo, regla `AbortIncompleteMultipartUpload` y prueba mensual (`openspec/config.yaml:3878-3880`).

## Preguntas abiertas

Ninguna bloqueante.
