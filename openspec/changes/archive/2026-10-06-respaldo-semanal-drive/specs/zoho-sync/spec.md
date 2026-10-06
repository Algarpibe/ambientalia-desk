# Delta para `zoho-sync`

## ADDED Requirements

### RQ-ZS-21 · Respaldo: copia semanal, incremental y cifrada de la carpeta de documentación de servicio de Drive

La App **SHALL** copiar una vez por semana la carpeta raíz de Google Drive configurada por variable de entorno (y sus
subcarpetas) al mismo almacenamiento de objetos S3 compatible de RQ-ZS-20, cifrada y sin pasar por el disco del
servidor (`decision/p55b-destino-copia`, `openspec/config.yaml:2621`; adelantada con el interruptor cerrado por
`decision/f1f02-copia-semanal-drive-adelantada`, `openspec/config.yaml:3865-3881`). RQ-ZS-20 no se modifica.

**Interruptor.** Nada se lista, descarga ni sube mientras `RESPALDO_DRIVE_HABILITADO` no valga exactamente `true`
(`=== 'true'`; ausente, vacío o cualquier otro valor equivale a apagado). Apagado, la App **MUST NOT** pedir token a
Google.

**Alcance.** La copia **MUST** alcanzar sólo la carpeta raíz configurada y sus subcarpetas: «la carpeta de documentación
de servicio a la que enlaza Desk 2.0», no el resto del Drive de la empresa. Se ejecuta una vez por semana.

**Sin disco.** Cada documento viaja de Drive al almacenamiento en flujo. La App **MUST NOT** escribir en el disco del
servidor, ni siquiera temporales, durante la copia.

**Cifrado.** Cada objeto **MUST** cifrarse con el mismo esquema y la misma clave que la copia nocturna (`DESKR1`,
AES-256-GCM, `apps/desk/server/respaldo/cifrado.ts:12`), de modo que la herramienta de restauración existente los
descifra sin cambios.

**Incremental.** La primera pasada **SHALL** copiar todo. Las siguientes **SHALL** subir sólo los documentos nuevos o
cambiados según el criterio de cambio que declare el diseño; un documento sin cambios **MUST NOT** volver a subirse.

**Retención de 12 meses, por la aplicación.** La App **SHALL** borrar una versión superada hace más de 12 meses y la copia
de un documento desaparecido de Drive hace más de 12 meses. La última copia de un documento vivo **MUST NEVER** borrarse,
por antigua que sea. El bloqueo de borrado durante la retención lo configura una persona en el almacenamiento y no lo
verifica este requisito. Si un borrado falla, la App **MUST** avisar y continuar la pasada.

**Fallo con aviso.** Si la pasada falla (credencial, listado, descarga, subida, configuración incompleta), la App **MUST**
mandar un correo al responsable (`RESPALDO_AVISO_EMAIL`) por el canal de avisos y no lanzar. **MUST** haber una sola
pasada a la vez.

**Equipos fuera de la raíz.** Cada pasada **SHOULD** avisar, sin copiarlos, de los `drive_url` de equipos que no caen
dentro de la carpeta raíz configurada. El diseño puede diferirlo.

**Fuera de este requisito.** La prueba mensual de restauración (incluye recuperar un documento de la carpeta) es tarea de
persona y este requisito no la exige.

#### Scenario: Interruptor apagado
- GIVEN `RESPALDO_DRIVE_HABILITADO` ausente o distinto de `true`
- WHEN toca la pasada semanal
- THEN no se pide token a Google, no se lista ni descarga nada y no se sube nada

#### Scenario: Primera pasada
- GIVEN el interruptor encendido, el destino configurado y una carpeta raíz con tres documentos, uno en una subcarpeta
- WHEN corre la primera pasada
- THEN se suben los tres documentos, cifrados en `DESKR1` con la clave de la nocturna

#### Scenario: Pasada incremental
- GIVEN una pasada previa y, desde entonces, un documento nuevo, uno cambiado y uno sin cambios
- WHEN corre la pasada siguiente
- THEN se suben el nuevo y el cambiado, y el que no cambió no se vuelve a subir

#### Scenario: Fuera de la carpeta raíz
- GIVEN documentos de Drive fuera de la carpeta raíz configurada
- WHEN corre la pasada
- THEN no se listan ni se copian

#### Scenario: Sin escritura en disco
- GIVEN una pasada que copia un documento
- WHEN se observan las escrituras al sistema de ficheros del servidor
- THEN no hay ninguna (ni temporales); y una prueba que introduzca una escritura temporal en el camino de copia se pone en rojo

#### Scenario: Restauración con la herramienta existente
- GIVEN un objeto subido por esta copia
- WHEN la herramienta de restauración existente lo descifra con la misma clave
- THEN recupera el contenido original del documento

#### Scenario: Retención de versión superada
- GIVEN un documento vivo con una versión superada hace más de 12 meses y otra superada hace menos
- WHEN corre la retención
- THEN se borra la primera, se conserva la segunda y se conserva la última copia

#### Scenario: Última copia de un documento vivo
- GIVEN un documento vivo que no cambia desde hace más de 12 meses
- WHEN corre la retención
- THEN su única copia no se borra

#### Scenario: Documento desaparecido de Drive
- GIVEN un documento que desapareció de Drive hace más de 12 meses
- WHEN corre la retención
- THEN se borran todas sus copias; si hace menos de 12 meses, se conservan

#### Scenario: Listado incompleto
- GIVEN un listado de Drive que falla a media pasada (la raíz o cualquier página)
- WHEN corre la pasada
- THEN ningún documento se marca como desaparecido de Drive y se avisa al responsable

#### Scenario: Índice ilegible
- GIVEN un índice de lo ya copiado que existe pero no se puede leer ni descifrar
- WHEN corre la pasada
- THEN no se copia ni se borra nada y se avisa al responsable; sólo un índice inexistente equivale a la primera pasada

#### Scenario: Borrado que falla
- GIVEN el almacenamiento rechaza un borrado por el bloqueo de retención
- WHEN corre la retención
- THEN se avisa al responsable y la pasada sigue con el resto

#### Scenario: Pasada que falla
- GIVEN el interruptor encendido y una descarga o subida que responde con error
- WHEN corre la pasada
- THEN se manda un aviso al responsable con el motivo y no se lanza ninguna excepción

#### Scenario: Pasada ya en curso
- GIVEN una pasada en curso
- WHEN se dispara otra
- THEN la segunda no arranca

#### Scenario: Configuración incompleta
- GIVEN el interruptor encendido y falta la credencial de Drive, la carpeta raíz, el destino o la clave de cifrado
- WHEN toca la pasada
- THEN no se copia nada y se avisa al responsable de qué variable falta

#### Scenario: `drive_url` fuera de la raíz
- GIVEN un equipo cuyo `drive_url` no cae dentro de la carpeta raíz
- WHEN corre la pasada
- THEN se avisa de ese `drive_url` y no se copia su contenido
