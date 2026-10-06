---
tanda: F1F-02
motivo: ""
capacidad: [zoho-sync]
maestro: ["Anexo D nº 55"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: copia semanal de la carpeta de Drive (F1F-02, interruptor cerrado)

## Intención

A F1F-02 le falta la copia semanal de Drive y la prueba mensual de restauración (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:225`). Gerencia autoriza adelantar sólo la copia, «construida con el interruptor cerrado; encenderla sigue esperando a p55c» (`openspec/config.yaml:3872`). Las condiciones son las de `decision/p55b-destino-copia` (`openspec/config.yaml:2621`): sólo la carpeta de documentación de servicio a la que enlaza Desk 2.0, al mismo destino de objetos, semanal, incremental, 12 meses de retención, de Drive al almacenamiento **sin pasar por el disco del servidor**, con bloqueo de borrado. Hoy un documento borrado o cifrado por error en esa carpeta no tiene copia fuera de Google.

## Alcance

### Dentro
- Lectura de la carpeta con una credencial de sólo lectura; listado recursivo e incremental por un criterio declarado.
- Subida en streaming, cifrada con el mismo esquema que la nocturna (`apps/desk/server/respaldo/cifrado.ts:12`, `DESKR1`, AES-256-GCM), sin escribir en disco.
- Índice de lo ya copiado y retención de 12 meses que nunca borra la última copia de un documento vivo.
- Interruptor propio que nace cerrado, programador semanal, aviso por correo si falla (nunca lanza), `DEPLOY.md` y líneas para `.env.example`.
- Requisito nuevo en el delta de `zoho-sync`, junto a RQ-ZS-20 (`openspec/specs/zoho-sync/spec.md:1117`).

### Fuera
- Encender el interruptor, elegir proveedor (`p55c-proveedor-copia`, cuesta dinero), crear la credencial de Drive, configurar el bloqueo de borrado y la prueba mensual de restauración.
- Cualquier copia contra producción o contra el Drive real desde una sesión.
- El resto del Drive de la empresa.

## Capacidades

- **Nuevas:** ninguna.
- **Modificadas:** `zoho-sync` — requisito nuevo (copia semanal de Drive), hermano de RQ-ZS-20, que no cambia.

## Enfoque (supuestos razonables y reversibles; el diseño los cierra)

1. **Credencial.** Hipótesis: cuenta de servicio con acceso de sólo lectura a la carpeta, en el gestor de secretos del despliegue. Nunca en un chat ni en el repositorio.
2. **Interruptor.** `RESPALDO_DRIVE_HABILITADO`, `=== 'true'`, con cargador propio como el de `apps/desk/server/respaldo/config.ts:31`. Reutiliza destino, credenciales S3, clave de cifrado y responsable de la nocturna (`config.ts:14-22`).
3. **Sin disco.** La nocturna escribe un temporal (`apps/desk/server/respaldo/respaldo.ts:56-65`) porque el `PUT` necesita `Content-MD5` —lo exige el bloqueo de borrado— y la longitud por delante (`apps/desk/server/respaldo/dependencias.ts:72-73`). Sin disco, la salida natural es la **subida multiparte S3** con MD5 por parte y memoria acotada a una parte.
4. **Incremental.** Por `modifiedTime` (más `md5Checksum` cuando exista). Los documentos nativos de Google no tienen `md5Checksum` ni `size` y hay que exportarlos. Hipótesis preferida para el estado: un índice cifrado en el propio almacenamiento, que evita tocar `schema.sql`.
5. **Retención.** El precedente nocturno no borra nada: delega en reglas de ciclo de vida por prefijo (`DEPLOY.md:401-404`). Aquí no basta, porque **borrar «lo de hace más de 12 meses» borraría la única copia de un documento que no cambia desde hace un año**. La retención afecta sólo a versiones superadas y a documentos borrados de Drive. **Se hace por código, guiada por el índice** (encargo de la tanda, 2026-10-06): a los 12 meses de quedar superada una versión, o de desaparecer el documento de Drive, la aplicación la borra; la última copia de un documento vivo no se borra nunca. El bloqueo de borrado lo configura la persona en el almacenamiento (retención por defecto de 12 meses), así que un servidor comprometido no puede borrar antes de tiempo. Se descarta delegarla en el versionado del proveedor: dependería de un proveedor que aún no está elegido.
6. **Programación.** Hipótesis: no existe programador semanal; hoy sólo `scheduleDailyAt` (`packages/zoho-sync/src/booksHub/schedule.ts:10`), cableado en `apps/desk/server/index.ts:96-99`.
7. **Prueba fija sin disco** con su mutación (introducir una escritura temporal la pone en rojo), bajo `strict_tdd`.

## Partición (antes de escribir)

Intento 0: planificación. Estimación ×1,8 con pruebas y válvula de 720 líneas por intento: **(a)** acceso a Drive, listado e incremental; **(b)** subida en streaming, retención, programador semanal y `DEPLOY.md`.

## Áreas afectadas

| Área | Impacto |
|---|---|
| `apps/desk/server/respaldo/` | Nuevos módulos de Drive, multiparte e índice |
| `apps/desk/server/index.ts` | Programación semanal con el interruptor |
| `DEPLOY.md` §12 | Interruptor, variables y retención |
| `openspec/changes/respaldo-semanal-drive/specs/zoho-sync/spec.md` | Delta |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| La retención borra la única copia de un documento vivo | Media | Retención limitada a versiones superadas y a documentos borrados; prueba fija |
| «La carpeta» no es una sola: cada equipo guarda su propio `driveUrl` (`apps/desk/server/db/equipos.ts:104`) | Media | Supuesto reversible, fiel al singular de `p55b` (`openspec/config.yaml:2621`): una carpeta raíz configurada por variable. Cada pasada avisa de los `drive_url` de equipos que no caen dentro de ella; no los copia. Si Gerencia quiere copiarlos también, es una ampliación de la misma fila |
| Compatibilidad multiparte y bloqueo de borrado según proveedor | Media | Sólo S3 estándar; se verifica al elegir proveedor (p55c) |
| Memoria con documentos grandes | Baja | Tamaño de parte acotado |

## Reversión

Con el interruptor cerrado no corre nada. Revertir el commit de fusión retira el código sin migración ni datos.

## Dependencias

`p55c-proveedor-copia` para encender; credencial de Drive; el webhook de avisos ya existente (`dependencias.ts:56-67`).

## Tareas de persona (fuera del recuento; archivar NO las da por hechas)

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Elegir y contratar proveedor | Gerencia | `p55c-proveedor-copia` | `openspec/config.yaml:2625` |
| Crear la credencial de lectura de Drive y guardarla en el gestor de secretos | Responsable del despliegue | Antes de encender | `DEPLOY.md` §12 |
| Configurar bloqueo de borrado y retención en el almacenamiento | Responsable del despliegue | Al encender | `DEPLOY.md` §12 |
| Prueba mensual de restauración con un documento de la carpeta | Responsable del respaldo | Resto de F1F-02 | `openspec/config.yaml:3879-3880` |

## Criterios de éxito

- [ ] Con el interruptor apagado no se lee Drive ni se sube nada.
- [ ] Una pasada copia sólo lo nuevo o cambiado, cifrado en `DESKR1`, sin tocar disco (prueba fija y mutación en rojo).
- [ ] La retención nunca elimina la última copia de un documento vivo.
- [ ] Un fallo avisa al responsable y no tumba la App.
