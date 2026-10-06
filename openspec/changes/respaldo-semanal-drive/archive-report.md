# Informe de archivo — `respaldo-semanal-drive`

**Tanda:** F1F-02 · **`cierra: no`** · **Fecha:** 2026-10-06 · **Rama:** `respaldo-semanal-drive`, nacida de `main` en `a6e29d8` (el commit que registra `decision/f1f02-copia-semanal-drive-adelantada`, `openspec/config.yaml:3865`). Sin fusionar al escribir este informe. Informe escrito por el orquestador, con cifras medidas.

**Cobertura de la fila (R-1):** F1F-02 cubre aquí la copia semanal de la carpeta de documentación de servicio de Drive que `decision/p55b-destino-copia` (`openspec/config.yaml:2621`) añade a la fila: de Drive al almacenamiento sin pasar por el disco del servidor, cifrada con el esquema de la nocturna, incremental, con retención de 12 meses por código y con el interruptor cerrado. Deja fuera la prueba mensual de restauración y todo lo que depende de producción o cuesta dinero (proveedor, credencial, bloqueo de borrado, encender), que son tareas de persona. Por eso no cierra la fila.

## Qué se entregó

- `apps/desk/server/respaldo/configDrive.ts`: cargador propio. `RESPALDO_DRIVE_HABILITADO` nace cerrado (`:31`).
- `driveAuth.ts`: JWT RS256 de cuenta de servicio con `node:crypto`, sin SDK. `driveApi.ts`: listado recursivo y paginado que **lanza** si falla, en vez de devolver uno parcial; descarga o exportación como flujo (Docs, Sheets y Slides a Office; Drawings a PDF).
- `incremental.ts`: el índice y la huella (`md5Checksum`, o `modifiedTime` en los nativos). Los desaparecidos se marcan sólo con listado completo (`:37`).
- `retencion.ts`: 12 meses de calendario en UTC. La última versión de un documento vivo no es candidata nunca, por una guarda explícita (`:22`, `:24`).
- `multiparte.ts`: subida multiparte en memoria, partes de 8 MiB con `Content-MD5` y SHA-256 real. Un `200` con `<Error>` cuenta como fallo; Abort de mejor esfuerzo; `DELETE ?versionId=`. `indiceDrive.ts`: índice cifrado en `drive/indice.json.enc`; sólo un `404` equivale a primera pasada. `cifrado.ts`: `descifrarBuffer`, añadido al final.
- `copiaDrive.ts`: el orquestador. Guardas en orden interruptor → en curso (`:102-103`) → faltantes. Un documento que falla no corta la pasada; sin `versionId` no se borra (`:84`); un solo aviso por pasada y nunca lanza.
- `sinDisco.test.ts`: prueba con `fs`, `fs/promises` y `tmpdir` sustituidos por espías que lanzan, y guardián estático `escriturasEnDisco` (`:28`) probado con un fixture sintético.
- `apps/desk/server/index.ts`: dos imports al final de la línea 15 y un bloque de 9 líneas tras la 109. Apagado no programa nada.
- `DEPLOY.md` §13 (`:418-468`): las dos frases del interruptor, las variables, las líneas para `.env.example` que añade el usuario, el bloqueo, `AbortIncompleteMultipartUpload` y cómo restaurar con `descifrarCli.ts`.
- `apps/desk/server/superficieSaliente.test.ts`: etiqueta el `POST` del token de Google y el `POST`/`PUT`/`DELETE` de `multiparte.ts`, como pide su propio mecanismo.
- Spec: RQ-ZS-21 fusionado por script **al final** de `openspec/specs/zoho-sync/spec.md` (`@@ -1154,0 +1155,119 @@`), bloque idéntico al delta (comprobado con `diff`). RQ-ZS-20 no cambia.

## Intentos y medida

Cada cifra es la del registro (`gentle-ai sdd-attempt status`) y coincide con `git diff --shortstat --no-renames` contra la base del intento, sin nada sin trackear al cerrar.

| Intento | Commit | Líneas |
|---|---|---|
| 0 · planificación | `522da9f` | 469 |
| 1 · (a) Drive, listado, incremental | `288ae0d` | 658 |
| 2 · (b1) retención, multiparte, índice | `9289c49` | 497 |
| 3 · (b2) orquestador, sin disco, cableado, `DEPLOY.md` | `3394e54` | 576 |
| 4 · verify | `f3b1525`, `6f9159c` | 97 |
| 5 · archivo | el de este informe | medida en el asiento |

**Partición ejecutada en tres intentos de construcción, no en dos.** (a) midió 658 frente a 483 estimadas (×1,36). Con esa razón, el (b) entero salía en torno a 890, por encima de la válvula de 720, así que se partió **antes de escribir** en (b1) = lotes 5-6 y (b2) = lotes 7-10. Ningún intento pasó de 720. El corte del aviso de `drive_url` midió 495 frente a 640 y se construyó.

## Comprobaciones

- Sobre `3394e54`: `npm test` 0 (233 ficheros; 3.520 pruebas y 7 saltadas; la línea base de la rama era 3.440), `npm run typecheck` 0, `npx eslint .` 0 (165 avisos, en el techo, ninguno nuevo) y detector de citas 0. Tras los commits documentales: detector 0 y pruebas de citas y reconciliación en verde.
- **Mutaciones reproducidas por el orquestador** con `herramientas/mut.mjs`, todas en rojo y restauradas (`git status` vacío):
  - **Incremental y configuración:** M-a1 (desaparecidos con listado parcial), M-a2 (planificar ignora la huella), M-a3 (interruptor abierto por defecto).
  - **Retención, multiparte e índice:** M-b1a (retención sin la guarda de la última de un vivo), M-b1b (Complete `200` con `<Error>` aceptado), M-b1c (índice ilegible tratado como primera pasada), M-b1d (`DELETE` sin `versionId`).
  - **Escritura en disco:** M-b2a, la literal del diseño (`createWriteStream(path.join(os.tmpdir(), 'parte')).write(parte)` en el bucle de subida), pone en rojo **las dos** pruebas, la de comportamiento y el guardián estático.
  - **Orquestador:** M-b2b (en curso antes que el interruptor; regla de mutación 1), M-b2c (listado parcial que no aborta), M-b2d (sin `versionId` se borra igual).
- Barrido de citas (regla de mutación 4): las citas de `index.ts:15` lo dan como la línea de imports a la que se añade con `;`, y lo sigue siendo. `DEPLOY.md:413-416` no se movió. `cifrado.ts` sólo crece al final. Sin dependencias nuevas.
- Verify: **PASS con avisos**, 0 CRITICAL, 16/16 escenarios (`verify-report.md`).

## Lo que queda abierto (del verify)

- **W1** · Una pasada con fallos sueltos devuelve `hecho: true` si el índice se escribió (`copiaDrive.ts:89`). El correo sí sale; el nombre del campo engaña.
- **W2** · Un `drive_url` que apunta a un nativo omitido *dentro* de la raíz (un Form, por ejemplo; `driveApi.ts:68-69`) se avisa como «fuera de la carpeta raíz» (`copiaDrive.ts:77`). El escenario se cumple; el texto confunde.
- **W3** · Partición en tres intentos: corregida en `tasks.md` y `design.md` en el commit del verify.
- **W4** · `superficieSaliente.test.ts` tocado fuera del diseño. Era necesario y está en verde.
- **S1** · El guardián estático es léxico; la prueba de comportamiento cubre lo que él no ve. **S2** · Si el índice no se escribe después de una retención, lista objetos ya borrados; el borrado es idempotente. **S3** · `idDeUrl` reconoce sólo las formas declaradas.
- **Hipótesis sin verificar hasta elegir proveedor (p55c):** que el bloqueo de borrado exija `Content-MD5` en cada `UploadPart`, el límite de unos 10 MB de exportación de Drive, y que R2 y B2 admitan versionado, bloqueo y multiparte como S3.

## Tareas de persona — archivar NO las da por hechas

Fuera del recuento de `tasks.md` y escritas en `DEPLOY.md` §13. Dueño: Gerencia (proveedor) y la persona con acceso al despliegue.

1. Elegir el proveedor (`p55c-proveedor-copia`), que cuesta dinero.
2. Crear la cuenta de servicio con lectura de la carpeta y guardar su credencial en el gestor de secretos, nunca en un chat.
3. Almacenamiento versionado, con bloqueo de borrado de 12 meses y la regla `AbortIncompleteMultipartUpload`.
4. Añadir las líneas de `.env.example`.
5. Encender.
6. La prueba mensual de restauración, que incluye recuperar un documento de la carpeta.
