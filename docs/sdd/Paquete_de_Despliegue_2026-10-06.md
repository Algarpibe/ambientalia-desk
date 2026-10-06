# Paquete de despliegue — 2026-10-06 (adenda: copia semanal de Drive)

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada.** La publicación es una
acción manual: el CI no despliega, sólo verifica (`DEPLOY.md:270-271`).

**Esta adenda es INCREMENTAL y NO sustituye al paquete del 2026-10-05 (b)**
(`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md`, medido sobre `36dc352`, que no se toca). Lo **complementa** con lo que
entró en `main` después, en el rango **`36dc352..cdfd0b0`**. Quien publique `cdfd0b0` necesita los dos: las condiciones
de parada, la copia de la base, el esquema, el procedimiento y las tareas de persona de aquél siguen en pie y aquí no
se repiten ni se han vuelto a leer. Cada dato lleva la ruta y la línea leídas en `cdfd0b0`.

## 0 · Medición del rango

| Dato | Valor |
|---|---|
| Cabeza medida | `cdfd0b0`, fusión `--no-ff` de la rama `respaldo-semanal-drive` (cabeza `22bce3d`) |
| Rango | `36dc352..cdfd0b0`, **14 commits** (`git rev-list --count`) |
| `git diff --shortstat 36dc352 cdfd0b0` | 34 files changed, 3374 insertions(+), 29 deletions(-) |
| Código (`-- apps packages`) | **21 ficheros, +1.489/−3**; sin pruebas: **10 ficheros, +539/−1** |
| Cliente (`-- apps/desk/src`) | **sin cambios** |
| Esquema (`packages/zoho-sync/src/db/schema.sql`) | **sin cambios**: esta adenda no añade ninguna sentencia |
| `Dockerfile`, `package.json`, `package-lock.json` | **sin cambios**: ninguna dependencia nueva |
| Fuera de `apps/`, `packages/`, `docs/` y `openspec/` | sólo `DEPLOY.md` (+52 líneas, apartado 13, `DEPLOY.md:418-468`) |

## 1 · Qué pieza entra

**La copia semanal de la carpeta de Drive (`respaldo-semanal-drive`, F1F-02, `cierra: no`).** Una vez por semana la App
copia la carpeta de documentación de servicio al mismo almacenamiento S3 del respaldo nocturno, cifrada con la misma
clave, sin pasar por el disco del servidor, sólo lo nuevo o cambiado y con retención de 12 meses por código
(`DEPLOY.md:420-424`). Está **adelantada con el interruptor cerrado** (`decision/f1f02-copia-semanal-drive-adelantada`,
`openspec/config.yaml:3865`).

**Publicar `cdfd0b0` con el interruptor ausente no cambia nada observable.** Con `RESPALDO_DRIVE_HABILITADO` distinto de
`true` exacto, la App no programa la pasada (`apps/desk/server/index.ts:113`), no pide token a Google y no lista,
descarga ni sube nada (`apps/desk/server/respaldo/copiaDrive.ts:102`). Encenderla exige reiniciar la App, porque la
configuración se lee al arrancar (`apps/desk/server/index.ts:112`).

El resto del rango es documental: el paquete del 05/10 (b), el recálculo de la R01.4, la reconciliación y el registro de
la decisión que adelanta esta copia.

## 2 · Variables de entorno — las cinco `RESPALDO_DRIVE_*`, todas apagadas al publicar

Todas son del servicio **App**. Ninguna está en el fichero de ejemplo de entorno: añadir sus líneas es tarea de persona
(§3, paso 4). No hay variables nuevas para el destino: se reutilizan `RESPALDO_S3_*`, `RESPALDO_CLAVE_CIFRADO` y
`RESPALDO_AVISO_EMAIL` del respaldo nocturno (`DEPLOY.md:439-440`).

| Variable | Valor al publicar | Dónde se lee | Documentada en |
|---|---|---|---|
| `RESPALDO_DRIVE_HABILITADO` | **Ausente** (apagado). `=== 'true'`. Se enciende tras las tareas de §3 | `apps/desk/server/respaldo/configDrive.ts:31` | `DEPLOY.md:426-430` |
| `RESPALDO_DRIVE_CREDENCIAL` | Vacía; JSON de la cuenta de servicio en base64, **sólo en el gestor de secretos** | `apps/desk/server/respaldo/configDrive.ts:34` | `DEPLOY.md:434` |
| `RESPALDO_DRIVE_CARPETA_ID` | Vacía; el id de la carpeta raíz | `apps/desk/server/respaldo/configDrive.ts:35` | `DEPLOY.md:435` |
| `RESPALDO_DRIVE_DIA` | Ausente; por defecto `0` (domingo) | `apps/desk/server/respaldo/configDrive.ts:32` | `DEPLOY.md:436` |
| `RESPALDO_DRIVE_HORA` | Ausente; por defecto `5` (hora del contenedor) | `apps/desk/server/respaldo/configDrive.ts:33` | `DEPLOY.md:437` |

**Qué se rompe si el interruptor se pone mal** (`DEPLOY.md:426-430`): encendido sin la credencial, la carpeta, el destino
o la clave, cada pasada falla y manda un correo que nombra la variable que falta
(`apps/desk/server/respaldo/configDrive.ts:47-55`); apagado por descuido, no hay copia de Drive y nadie recibe aviso.

## 3 · Tareas de persona — ninguna sesión las hace

Dueños: Gerencia (el proveedor) y la persona con acceso al despliegue. Están escritas en `DEPLOY.md:462-468` y en
`openspec/changes/archive/2026-10-06-respaldo-semanal-drive/archive-report.md:60-69`. Van **después** del encendido del
respaldo nocturno (`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:670`), porque comparten proveedor, destino y clave.

| Paso | Quién | Qué |
|---|---|---|
| 1 | Gerencia | Elegir el proveedor (`p55c-proveedor-copia`), que cuesta dinero. Es el mismo del respaldo nocturno |
| 2 | La persona con acceso al despliegue | Crear la cuenta de servicio de Google con **lectura** de la carpeta y guardar su credencial en el gestor de secretos; nunca en un chat, una captura o un prompt |
| 3 | La persona con acceso al despliegue | El almacenamiento tiene que ser **versionado**, con **bloqueo de borrado de 12 meses** y con la regla de ciclo de vida `AbortIncompleteMultipartUpload` |
| 4 | La persona que publica | Añadir al fichero de ejemplo de entorno las seis líneas de `DEPLOY.md:443-448` |
| 5 | La persona con acceso a producción | `RESPALDO_DRIVE_HABILITADO=true` y reiniciar la App |
| 6 | La persona responsable del respaldo | La prueba mensual de restauración incluye recuperar un documento de la carpeta (`DEPLOY.md:456-460`) |

## 4 · Hipótesis de esta adenda

1. **Sin verificar hasta elegir proveedor:** que el bloqueo de borrado exija `Content-MD5` en cada parte, el límite de
   exportación de Drive y que el proveedor elegido admita versionado, bloqueo y multiparte como S3
   (`openspec/changes/archive/2026-10-06-respaldo-semanal-drive/archive-report.md:58`).
2. Ninguna pasada real se ha ejecutado: las pruebas usan dobles de Drive y de S3. La primera copia real es la del paso 5.
3. Límite conocido de la prueba «sin disco», sin efecto en lo que se publica: `docs/sdd/ENTRADA.md`, E-235.

## 5 · Añadido por `ovi-garantia-por-cargo` (F1B-03, parte OVI) — condición previa de persona

**Antes de publicar el commit que traiga este cambio, hay que asignar los cargos de permiso** (respuesta de Gerencia del 06/10,
`decision/e157-ovi-garantia-por-cargo`, punto 4). Asociar una orden `OVI-` a un ticket lo hace sólo quien tiene el cargo Director Técnico,
o un administrador (`packages/shared/src/cargos.ts:71-74`). **Si se publica sin cargos asignados, sólo un administrador podrá asociar
una OVI** en el alta, en «Habilitar Servicio», en la orden adicional de las aprobaciones y en la remisión de entrada; los demás verán un
`403`. No hay variable de entorno ni interruptor: la guarda está activa desde que se publica.

| # | Quién | Qué | Cómo se comprueba |
|---|---|---|---|
| 1 | Gerencia | Decir qué persona lleva el cargo Director Técnico | — |
| 2 | Un administrador | Asignarle el cargo en la pantalla de usuarios, antes de publicar | Esa persona asocia una OVI a un ticket de prueba y no ve el `403` |

Lo que NO cambia al publicar: un ticket que ya tiene su OVI (venido de Zoho o creado en la aplicación) la conserva y puede seguir su
flujo; reconfirmarla no pide el cargo. Y un ticket con tipo de servicio «Garantía» deja de admitir una orden que no sea OVI cuando la
orden entra; los que ya la tienen asociada no se tocan.
