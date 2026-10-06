# Informe de archivo — `lista-novedades-mantenible`

**Tanda:** F1B-04 · **`cierra: no`** · **Fecha:** 2026-10-05 · **Rama:** `lista-novedades-mantenible`, nacida de `main` en `5a436c2`. Sin fusionar al escribir este informe.

**Cobertura de la fila (R-1):** F1B-04 cubre aquí la pantalla para mantener la lista de novedades de entrada, que `recepcion-rotulacion-foto-entrada` dejó fuera: el Director Técnico la cambia desde Configuración, como pide `decision/f1b04-desplegables`, y el servidor lo impone. Deja fuera los accesorios desde el catálogo de artículos (E-100), que siguen sin clave de decisión (`decision/orden-tres-tandas-03-10`, consecuencia 2), y la mitad de salida de E-123. Por eso no cierra la fila.

## Qué se entregó

- `packages/shared/src/mantenimientoNovedades.ts` — `puedeMantenerNovedades` (área Servicio Técnico y cargo Director Técnico; el admin pasa), `altaNovedadDelCuerpo` y `cambioNovedadDelCuerpo`. Va en un fichero propio y no en `EXCEPCIONES_POR_CARGO` de `cargos.ts`, citado línea a línea; exportado al final de `packages/shared/src/index.ts`.
- `apps/desk/server/db/novedades.ts` — `crearNovedad` y `actualizarNovedad`, añadidas al final. No hay borrado.
- `apps/desk/server/routes/novedades.ts:26-48` — `GET /api/novedades-remision/todas`, `POST /api/novedades-remision` y `PATCH /api/novedades-remision/:clave`, con el orden de F1B-10: existencia (404) → permiso (403) → contenido (422) → unicidad (409). Sin `DELETE`.
- `apps/desk/src/components/NovedadesPanel.tsx` y su entrada en `apps/desk/src/components/Configuracion.tsx` (cuatro líneas editadas en sitio); tres funciones nuevas al final de `apps/desk/src/api/client.ts`.
- RQ-RE-29, fusionado al final de `openspec/specs/remisiones/spec.md` (`:1346`), bloque idéntico al delta (`fusiona.mjs`).
- La tabla de la regla 13, decisión a decisión, está en el `tasks.md` de este cambio.

Ninguna línea citada se desplazó: los cambios en ficheros citados son en sitio (`Configuracion.tsx`, la importación de `routes/novedades.ts`) o posteriores a la última línea citada.

## Verificación

- **Pruebas:** 26 de la regla compartida (`packages/shared/src/mantenimientoNovedades.test.ts`) y 18 de las rutas (`apps/desk/server/novedadesMantenimiento.test.ts`); suite completa con 3.399 pasadas y 7 omitidas; typecheck y build del cliente sin errores; lint sin avisos en lo nuevo; detector de citas con 0 bloqueantes.
- **Mutaciones**, reproducidas y restauradas, todas en rojo: 8 en la regla compartida (sin área, sin pase de administrador, alta exclusiva permitida, retirar «Sin novedad», la etiqueta propia choca, sin recortar al comparar, clave de una letra, unicidad antes que contenido) y 6 en el servidor (permiso antes que existencia en el `PATCH`, permiso detrás del contenido en el `POST`, unicidad como 422, lista entera sin permiso, `UPDATE` que no escribe). «Sin recortar al comparar» sobrevivió al principio: `etiquetaValida` ya recortaba lo que llega, y faltaba la prueba de una etiqueta guardada con espacios por SQL; se añadió y la mutación pasó a rojo.
- **El `.tsx` no tiene red de pruebas** (F0-00): su comportamiento se verifica en la aplicación. La tabla de la regla 13 nombra la línea del servidor que impone cada decisión del cliente.

## Intentos y medida

| Intento | Commit | Líneas (registro = `git diff --shortstat --no-renames`) |
|---|---|---|
| 1 · artefactos y regla compartida | `a3f9ef4` | 277 |
| 2 · escritura y rutas | `3e22fc2` | 174 |
| 3 · pantalla y tabla de la regla 13 | `d342bbc` | 131 |
| 4 · archivo | el de este informe | medida en el asiento |

La tanda se partió en tres intentos antes de empezar: la estimación con pruebas ×1,8 daba ~980, por encima de la válvula de 720.

## Supuestos que siguen abiertos

- S-1 · El área del acto es Servicio Técnico. S-2 · El administrador también puede. S-3 · La marca «excluye a las demás» no se edita desde la pantalla. Los tres, reversibles; los decide Gerencia si no los quiere.

## Tareas de personas — archivar no las da por hechas

| Tarea | Dueño | Dónde queda escrita |
|---|---|---|
| Verificar en la aplicación, con un usuario Director Técnico de Servicio Técnico, que la entrada de Configuración da de alta, cambia y retira, y que el formulario de la remisión de entrada deja de ofrecer lo retirado | La persona que verifica la aplicación | Este informe |
| Asignar el cargo de permiso «Director Técnico» a quien vaya a mantener la lista, si aún no lo tiene | Administrador de usuarios | Este informe |
