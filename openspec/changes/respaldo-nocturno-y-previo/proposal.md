---
tanda: F1F-02
motivo: ""
capacidad: [zoho-sync]
maestro: ["Anexo D nº 55"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Respaldo: la copia nocturna y la previa a cada cambio (adelanto de F1F-02)

## Por qué

`decision/p55-backup` (`openspec/config.yaml:2253`) adelanta **ya** la copia nocturna y la previa a cada cambio, «sin
esperar a diciembre; el resto de la tanda F1F-02 sigue en su fecha». `decision/p55b-destino-copia` (`:2616`) fija el
destino: almacenamiento de objetos de un proveedor distinto de Google y de Hostinger, con credenciales propias y bloqueo
de borrado durante la retención. El proveedor sigue entre corchetes, y elegirlo cuesta dinero: lo decide el usuario.

## Qué cambia

- Un módulo de respaldo en `apps/desk/server/respaldo/`: `pg_dump` en formato `custom` de la base `desk`, **cifrado en
  el servidor** (AES-256-GCM) antes de salir, y subido a un destino **S3 compatible** configurado sólo con variables de
  entorno. La firma de las peticiones (SigV4) es propia: añadir el SDK de AWS reescribiría `package-lock.json`.
- Interruptor `RESPALDO_HABILITADO`, que **nace cerrado** (`=== 'true'`): apagado no se vuelca ni se sube nada.
- **Copia nocturna** desde la App, con el programador diario que ya usa el worker (`scheduleDailyAt`).
- **Copia previa a cada cambio** por una ruta de administrador, `POST /api/admin/respaldo`, que se lanza antes de publicar.
- Si una copia falla, **aviso por correo** al responsable por el canal de avisos de n8n que ya existe.
- Retención 7 diarias, 4 semanales y 12 mensuales por **prefijo**: la copia nocturna del día 1 va a `mensual/`, la del
  domingo a `semanal/` y el resto a `diaria/`; la previa, a `previa/`. Borrar lo caducado lo hacen las reglas de ciclo de
  vida del almacenamiento, que configura la persona junto con el bloqueo de borrado.
- `Dockerfile`: instala `postgresql-client` con un `RUN` propio al final del fichero, detrás del `CMD`, para no mover
  las líneas citadas; dentro de la línea del `npm ci` rompía el guardián de `apps/desk/server/citas/guardianes.test.ts`. `DEPLOY.md` documenta las variables.

## Diseño

- `firmaS3.ts` (pura): firma SigV4 de una petición; probada contra el vector público de AWS.
- `cifrado.ts` (pura): flujo de cifrado AES-256-GCM con cabecera propia (magia, IV) y la etiqueta al final.
- `respaldo.ts`: orquesta volcar → cifrar a un fichero temporal → MD5 (el bloqueo de borrado exige `Content-MD5`) →
  `PUT` firmado → borrar el temporal. Las dependencias (volcado, subida, aviso, reloj) se inyectan. Nunca lanza: devuelve
  el resultado y, si falla, avisa.
- Dónde corre: en la App, porque es el único proceso con la base `desk`; el worker `hub-sync` apunta al hub
  (`DEPLOY.md`, §7). Los ficheros del servidor —fotos, adjuntos, firmas— viven en la base como texto
  (`packages/zoho-sync/src/db/schema.sql:293-294`) y el servidor no escribe en disco, así que el volcado los incluye.

## Qué no cambia

La copia semanal de Drive, la prueba de restauración mensual automatizada y el resto de F1F-02, que siguen en su fecha.

## Supuestos (regla de ejecución, reversibles)

- S-1 · Capacidad `zoho-sync` (RQ-ZS-20): evita tocar la lista `capabilities`, muy citada.
- S-2 · La previa se lanza a mano por la ruta antes de cada publicación; engancharla al arranque retrasaría cada
  despliegue y dependería de los tiempos de EasyPanel, que no se ven desde el repositorio.
- S-3 · Cifrado propio además del del proveedor: «guardados cifrados» no depende así del proveedor que se elija.

## Hipótesis (dependen del servidor de producción; no se han podido comprobar)

- H-1 · La versión de `pg_dump` que trae `postgresql-client` en `node:22-alpine` es igual o mayor que la del servidor
  Postgres de producción; si no, `pg_dump` se niega a volcar. Docker no estaba disponible en la sesión para medirlo.
- H-2 · La hora del programador es la del contenedor (`setHours` local), que en EasyPanel suele ser UTC.
- H-3 · El disco del contenedor admite un temporal del tamaño del volcado comprimido.

## Tareas de persona

Elegir el proveedor; crear el almacenamiento con bloqueo de borrado durante la retención y las reglas de ciclo de vida
por prefijo; guardar las credenciales y la clave de cifrado en el gestor de secretos (la clave, además, fuera de él);
encender el interruptor; lanzar la primera copia y hacer la primera prueba de restauración. **Ninguna copia se lanza
contra producción desde una sesión.**
