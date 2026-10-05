# Tareas — respaldo-nocturno-y-previo (F1F-02, `cierra: no`)

## Lote 1 · piezas puras
- [x] 1.1 Firma SigV4 (`apps/desk/server/respaldo/firmaS3.ts`), probada contra el vector público de AWS.
- [x] 1.2 Cifrado AES-256-GCM en flujo (`apps/desk/server/respaldo/cifrado.ts`): ida y vuelta, clave mala, datos alterados.

## Lote 2 · orquestación y cableado
- [ ] 2.1 Variables en `packages/zoho-sync/src/config.ts`; `RESPALDO_HABILITADO` nace cerrado.
- [ ] 2.2 `respaldo.ts`: clase por fecha, configuración incompleta, éxito, fallo con aviso, temporal siempre borrado.
- [ ] 2.3 `POST /api/admin/respaldo`: 401, 403 de rol, 403 de interruptor, 409 en curso, 202.
- [ ] 2.4 Copia nocturna en `apps/desk/server/index.ts` con `scheduleDailyAt`.
- [ ] 2.5 `Dockerfile` con `postgresql-client`; `DEPLOY.md` con las variables, sus dos frases y las líneas del fichero de ejemplo.

## Tareas de persona — archivar no las da por hechas
Dueño: la persona con acceso a producción y Gerencia (proveedor). Destino: `archive-report.md` y el paquete de
despliegue. Elegir proveedor; crear el almacenamiento con bloqueo de borrado y reglas por prefijo; guardar credenciales
y clave; encender; primera copia y primera prueba de restauración.
