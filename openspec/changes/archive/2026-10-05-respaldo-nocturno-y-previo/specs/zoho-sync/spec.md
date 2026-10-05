# Delta para `zoho-sync`

## ADDED Requirements

### RQ-ZS-20 · Respaldo: copia nocturna y previa a cada cambio, cifrada, a un destino S3 compatible

La App **SHALL** volcar la base `desk` con `pg_dump` (formato `custom`), cifrar el volcado en el servidor con
AES-256-GCM y subirlo a un almacenamiento de objetos S3 compatible configurado sólo con variables de entorno
(`decision/p55-backup`, `decision/p55b-destino-copia`). Nada se vuelca ni se sube mientras `RESPALDO_HABILITADO` no
valga exactamente `true`.

**Dos disparos.** Una copia nocturna a la hora `RESPALDO_HORA` (por defecto, las 3) y una copia previa a cada cambio,
que un administrador lanza con `POST /api/admin/respaldo`. La ruta **MUST** responder `403` sin volcar nada con el
interruptor apagado, y `409` si ya hay una copia en curso.

**Retención por prefijo.** La copia nocturna del día 1 del mes **SHALL** ir a `mensual/`, la del domingo a `semanal/`
y el resto a `diaria/`; la previa, a `previa/`. Borrar lo caducado no lo hace la aplicación: lo hacen las reglas de
ciclo de vida del almacenamiento, con el bloqueo de borrado durante la retención.

**Fallo con aviso.** Si una copia falla, la App **MUST** mandar un correo al responsable (`RESPALDO_AVISO_EMAIL`) por el
canal de avisos, y no lanzar: un respaldo que falla no tumba la aplicación. El temporal del volcado **MUST** borrarse
siempre, también al fallar.

#### Scenario: Interruptor apagado
- GIVEN `RESPALDO_HABILITADO` ausente
- WHEN toca la copia nocturna o un administrador llama a la ruta
- THEN no se ejecuta `pg_dump` ni se sube nada; la ruta responde `403`

#### Scenario: Copia correcta
- GIVEN el interruptor encendido y el destino configurado
- WHEN corre la copia nocturna de un martes
- THEN se sube un objeto cifrado bajo `diaria/` con `Content-MD5`, firmado con SigV4, y el temporal se borra

#### Scenario: Copia que falla
- GIVEN el interruptor encendido y una subida que responde con error
- WHEN corre la copia
- THEN se manda un aviso al responsable con el motivo, el temporal se borra y no se lanza ninguna excepción

#### Scenario: Configuración incompleta
- GIVEN el interruptor encendido y falta el destino, las credenciales o la clave de cifrado
- WHEN toca una copia
- THEN no se vuelca nada y se avisa al responsable de qué variable falta
