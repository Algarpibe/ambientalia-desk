# Informe de archivo — `respaldo-nocturno-y-previo`

**Tanda:** F1F-02 · **`cierra: no`** · **Fecha:** 2026-10-05 · **Rama:** `respaldo-nocturno-y-previo`, nacida de `main` en `5a436c2`. Sin fusionar al escribir este informe.

**Cobertura de la fila (R-1):** F1F-02 cubre aquí el adelanto que `decision/p55-backup` pide «ya»: la copia nocturna y la previa a cada cambio, cifradas y subidas a un destino S3 compatible, con interruptor cerrado y aviso por correo si fallan. Deja fuera lo que la decisión deja en su fecha —la copia semanal de la carpeta de Drive, la prueba de restauración mensual y su anotación en el parte— y todo lo que depende del servidor de producción o cuesta dinero, que son tareas de persona. Por eso no cierra la fila.

## Qué se entregó

- `apps/desk/server/respaldo/firmaS3.ts` — firma SigV4 propia; sin el SDK de AWS, que reescribiría `package-lock.json`.
- `apps/desk/server/respaldo/cifrado.ts` — AES-256-GCM en flujo; formato `DESKR1` · IV · cifrado · etiqueta.
- `apps/desk/server/respaldo/config.ts` — variables `RESPALDO_*`; `RESPALDO_HABILITADO` nace cerrado (`:31`). Cargador propio, no en `AppConfig`, cuyo cargador está citado por línea.
- `apps/desk/server/respaldo/respaldo.ts` — `crearRespaldador` (`:40`): volcar → cifrar a temporal → MD5 → subir → borrar el temporal; una copia a la vez; nunca lanza y avisa si falla. Retención por prefijo en `claseDe` (`:29-33`).
- `apps/desk/server/respaldo/dependencias.ts` — `pg_dump`, el aviso por el webhook de n8n (`avisarFallo`, `:28`) y el `PUT` firmado con `Content-MD5` (`subirObjeto`, `:42`).
- `apps/desk/server/respaldo/descifrarCli.ts` — la herramienta de la prueba de restauración; la clave llega por entorno.
- `apps/desk/server/routes/respaldo.ts:20-27` — `POST /api/admin/respaldo`: sesión → administrador → interruptor (`403`) → en curso (`409`) → `202`.
- `apps/desk/server/index.ts:95-99` y `:102-104` — la copia nocturna con `scheduleDailyAt`, sólo con el interruptor encendido, y un respaldador por proceso.
- `Dockerfile:31-34` — `RUN apk add --no-cache postgresql-client` al final, detrás del `CMD`.
- `DEPLOY.md`, apartado 12 — las variables, las dos frases del interruptor, las líneas del fichero de ejemplo, la retención por prefijo, cómo lanzar la previa y cómo restaurar.
- RQ-ZS-20, fusionado al final de `openspec/specs/zoho-sync/spec.md` (`:1117`), bloque idéntico al delta (`fusiona.mjs`).
- Dos pruebas existentes cambian, y las dos por consecuencia directa del cambio: `apps/desk/server/reconciliacion/registro.test.ts` pasa de once a doce tandas en curso (entra F1F-02), y `apps/desk/server/superficieSaliente.test.ts` pasa de seis a ocho salidas declaradas (el `PUT` al almacenamiento y el `POST` del aviso).

Ninguna línea citada se desplazó: los cambios a `app.ts`, `index.ts` (hasta la `:93`), `appHarness.ts` y el `Dockerfile` (hasta la `:29`) son en sitio o posteriores a la última línea citada.

## Verificación

- **Firma:** los dos ejemplos que publica AWS para SigV4 de S3 (GET con `Range`; PUT con `$` en la clave) dan la firma publicada. Contra un servidor HTTP local, `fetch` de Node manda `Content-Length` sin `chunked`, el cuerpo llega entero y el `host` es el firmado. **No se ha probado contra un almacenamiento real**: no hay proveedor elegido.
- **Pruebas:** 3.392 pasadas y 7 omitidas en el último lote; typecheck sin errores; lint sin avisos en `apps/desk/server/respaldo/`; detector de citas con 0 bloqueantes (las 13 abreviadas informativas ya estaban en `main`). En `DEPLOY.md`, `citas.mjs` da las mismas 8 rotas que en `5a436c2`: las cuatro citas nuevas están bien.
- **Mutaciones**, todas reproducidas y restauradas, todas en rojo: 6 en el lote 1 (ruta sin codificar, cabeceras sin ordenar, región fuera de la clave, sin etiqueta GCM, clave de cualquier longitud, sin comprobar la cabecera), 9 en el lote 2 (interruptor abierto por defecto, región no exigida, temporal sin borrar, domingo antes que día 1, sin guarda de en curso, sin interruptor en `lanzar`, fallo de `pg_dump` ignorado, sin `Content-MD5`, error de S3 aceptado) y 5 en el lote 3 (interruptor invertido, sin rol, sin guarda de en curso, en curso antes que el interruptor, ruta sin registrar).
- **Dos guardas del repositorio cazaron cosas en el camino**, y se dejan anotadas porque es justo para lo que existen: `superficieSaliente.test.ts` exigió declarar las dos salidas nuevas, y el guardián del `Dockerfile` (`apps/desk/server/citas/guardianes.test.ts`) dejó de ver el `npm ci` de la etapa 2 cuando el `apk add` se metió en su misma línea; por eso el `apk add` va en un `RUN` propio.
- **Sin cubrir por pruebas:** el `spawn` real de `pg_dump` (sólo sus argumentos) y la línea de `index.ts` que programa la copia nocturna; los dos dependen del entorno de producción.

## Intentos y medida

| Intento | Commit | Líneas (registro = `git diff --shortstat --no-renames`) |
|---|---|---|
| 1 · artefactos, firma y cifrado | `9dc3841`, `8a9e742` | 319 |
| 2 · configuración, orquestación y dependencias | `81862b3` | 433 |
| 3 · ruta, cableado, `Dockerfile` y `DEPLOY.md` | `bd87663` | 247 |
| 4 · archivo | el de este informe | medida en el asiento |

El lote 2 se partió en dos intentos antes de empezar: la estimación con pruebas ×1,8 daba ~730, por encima de la válvula de 720.

## Hipótesis y supuestos que siguen abiertos

- H-1 · La versión de `pg_dump` que trae `postgresql-client` en `node:22-alpine` es igual o mayor que la del servidor. Docker no estaba arrancado en la sesión para medirlo.
- H-2 · La hora del programador es la del contenedor, probablemente UTC.
- H-3 · El disco del contenedor admite un temporal del tamaño del volcado comprimido.
- S-2 · La copia previa se lanza a mano antes de cada publicación. Engancharla al arranque es posible, pero retrasaría cada despliegue; lo decide Gerencia si lo quiere automático.

## Tareas de personas — archivar no las da por hechas

| Tarea | Dueño | Dónde queda escrita |
|---|---|---|
| Elegir el proveedor (Backblaze B2, Cloudflare R2 o Amazon S3); cuesta dinero | El usuario / Gerencia (`decision/p55b-destino-copia`) | `DEPLOY.md` §12 |
| Crear el almacenamiento con bloqueo de borrado durante la retención y reglas de ciclo de vida por prefijo | La persona con acceso al proveedor | `DEPLOY.md` §12 |
| Guardar credenciales y clave de cifrado en el gestor de secretos, y la clave además fuera de él; añadir las líneas al fichero de ejemplo | La persona que publica | `DEPLOY.md` §12 |
| Comprobar la versión del servidor Postgres frente a la de `pg_dump` de la imagen | La persona con acceso a producción | `DEPLOY.md` §12 |
| Encender `RESPALDO_HABILITADO`, lanzar la primera copia y hacer la primera prueba de restauración en una base aparte | La persona con acceso a producción | `DEPLOY.md` §12 |
