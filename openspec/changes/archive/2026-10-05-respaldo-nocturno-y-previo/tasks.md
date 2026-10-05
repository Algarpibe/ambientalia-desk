# Tareas — respaldo-nocturno-y-previo (F1F-02, `cierra: no`)

## Lote 1 · piezas puras
- [x] 1.1 Firma SigV4 (`apps/desk/server/respaldo/firmaS3.ts`), probada contra el vector público de AWS.
- [x] 1.2 Cifrado AES-256-GCM en flujo (`apps/desk/server/respaldo/cifrado.ts`): ida y vuelta, clave mala, datos alterados.

## Lote 2 · configuración y orquestación (intento 2; el lote se partió por la válvula de 720)
- [x] 2.1 Variables en su propio cargador, `apps/desk/server/respaldo/config.ts` (no en `AppConfig`, cuyo cargador está citado por línea); `RESPALDO_HABILITADO` nace cerrado.
- [x] 2.2 `respaldo.ts`: clase por fecha, configuración incompleta, éxito, fallo con aviso, temporal siempre borrado, una copia a la vez.
- [x] 2.2b `dependencias.ts`: `pg_dump`, `PUT` firmado con `Content-MD5` y aviso por el webhook de n8n.

## Lote 3 · cableado (intento 3)
- [x] 2.3 `POST /api/admin/respaldo`: 401, 403 de rol, 403 de interruptor, 409 en curso, 202.
- [x] 2.4 Copia nocturna en `apps/desk/server/index.ts` con `scheduleDailyAt`.
- [x] 2.6 `descifrarCli.ts` para la prueba de restauración (la clave llega por entorno).
- [x] 2.5 `Dockerfile` con `postgresql-client`; `DEPLOY.md` con las variables, sus dos frases y las líneas del fichero de ejemplo.

## Tareas de persona — archivar no las da por hechas
Dueño: la persona con acceso a producción y Gerencia (proveedor). Destino: `archive-report.md` y el paquete de
despliegue. Elegir proveedor; crear el almacenamiento con bloqueo de borrado y reglas por prefijo; guardar credenciales
y clave; encender; primera copia y primera prueba de restauración.
