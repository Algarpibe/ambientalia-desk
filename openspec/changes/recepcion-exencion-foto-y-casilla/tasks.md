# Tareas: «Falta un accesorio» exenta de foto, y dos casillas con traza que sustituyen la foto de accesorios o de embalaje

Cambio `recepcion-exencion-foto-y-casilla` (F1B-04, `cierra: no`). Orden de `strict_tdd`: rojo, verde, mutaciones, cierre. Cada casilla se marca sólo con su resultado anotado en `apply-progress.md`. Las pruebas PF, PI, PO, PA, PT, PE, PW, PS, PM, RF y las mutaciones M1a…M7 son las de `openspec/changes/recepcion-exencion-foto-y-casilla/design.md` (D7, D8); no se reabren sus decisiones. Los `.tsx` no tienen pruebas (F0-00): su tarea es de implementación sola, apoyada en la función pura de `recepcionForm.ts`.

## Review Workload Forecast

Líneas estimadas (inserciones + borrados) según D8: lote 1 (esquema, `shared`, servidor y sus pruebas) unas **350**, con su `apply-progress.md` parcial (~70) unas **420**; lote 2 (`recepcionForm`, `client.ts`, `CrearRemision.tsx`) unas **135**; texto del maestro ~15 y resto de `apply-progress.md` ~60. Total ~**630** frente a 800 (válvula 720).

Riesgo: medio-bajo. Punto de partición: si la medida al cerrar el lote 1 (tarea 4.2) pasa de **600**, el lote 2 (fase 5) va en un segundo intento (el lote 1 es desplegable solo). Decision needed before apply: No.

## Lote 1 · 1. Rojo (D7)

- [x] 1.1 `packages/zoho-sync/src/db/migrate.test.ts`, en sitio (D1): índices desde el final +6 (líneas 796, 798, 839, 840, 879, 880, 882 y los ordinales de 794, 837, 877), recuento de `ALTER` 59 a 64, calificadas 33 a 38, e identidad `public.catalogo_novedades` en la línea 385. Con `schema.sql` intacto, anotar el rojo.
- [x] 1.2 `packages/zoho-sync/src/db/novedadesSiembra.test.ts`, al final: PS-8…PS-11. Correr `npx vitest run packages/zoho-sync/src/db/novedadesSiembra.test.ts`, anotar el rojo literal (columna inexistente) y si pg-mem acepta el `ADD COLUMN … NOT NULL DEFAULT false` (pregunta abierta 1 de D).
- [x] 1.3 `packages/shared/src/recepcion.test.ts`, al final: PF-1…PF-4, PI-7, PI-8, PO-1. `packages/shared/src/mantenimientoNovedades.test.ts`, al final: PM-1. Correr ambos y anotar el rojo de cada caso (PM-1 puede nacer verde: caracteriza, su rojo es una mutación).
- [x] 1.4 `apps/desk/server/recepcion.test.ts`, al final: PA-4…PA-6 (posición), PT-1…PT-3, PE-5…PE-8, PW-1. Correr y anotar el rojo caso a caso; PT-3 y PW-1 caracterizan y pueden nacer verdes.

## Lote 1 · 2. Verde (D1…D4)

- [x] 2.1 D1: añadir al final de `packages/zoho-sync/src/db/schema.sql` las seis sentencias calificadas (sin `;` en comentarios). PS-8…PS-11 y `migrate.test.ts` en verde; anotar si pg-mem aceptó la columna.
- [x] 2.2 D2: `packages/shared/src/recepcion.ts` en sitio (líneas 8, 18, 124, 139, 141), `apps/desk/server/db/novedades.ts` (líneas 13 y 21). PF-1…PF-4 en verde.
- [x] 2.3 D3/D4: `packages/shared/src/recepcion.ts` líneas 45, 57, 60, 70-73, 77, 102 (paso 7), 109, 110, y al final `CuerpoRecepcion`, `ETIQUETA_CASILLA`, `ERR_SIN_ACCESORIOS_CON_INCLUYE`; `packages/shared/src/types.ts:735`. PI-7, PI-8, PO-1 en verde.
- [x] 2.4 D3: `apps/desk/server/db/remisiones.ts` (líneas 25, 40, 45, 47-48, 50), `apps/desk/server/services/recepcion.ts:17`, `apps/desk/server/routes/remision.ts:250`. PA-4…PA-6, PT-1…PT-3, PE-5…PE-8, PW-1 en verde; PM-1 sin editar `mantenimientoNovedades.ts`.
- [x] 2.5 `npm run typecheck`; anotar si `ETIQUETA_CASILLA` y `ERR_SIN_ACCESORIOS_CON_INCLUYE` (declaradas al final y usadas antes) pasan typecheck y lint, y si algún `toEqual` exacto se rompió.

## Lote 1 · 3. Mutaciones (D7, reglas de mutación 1 y 2)

Una a una. Copia previa de los ficheros en un directorio temporal **fuera del repositorio** (sin `git checkout --`). Tras cada una: correr las pruebas afectadas, anotar prueba a prueba, restaurar desde la copia y comprobar con `git diff`.

- [x] 3.1 M1a (regla 1): mover el paso (7) de `validarRecepcion` al principio. Esperado rojo: PI-7. Restaurar.
- [x] 3.2 M1b (regla 1): llevar la condición de S4 a la guarda del checklist, tras el `409`. Esperado rojo: PA-5. Restaurar.
- [x] 3.3 M2a (regla 2): escribir en `schema.sql` un `ALTER TABLE catalogo_novedades …` SIN calificar. Esperado rojo: `migrate.test.ts:332` y `:345`, y PS-10. Restaurar.
- [x] 3.4 M2b (regla 2): quitar el `UPDATE` de siembra (rojo PS-8 y PS-9); quitarle `AND exenta_de_foto = false` (rojo PS-10). Restaurar.
- [x] 3.5 M2c (regla 2): un `ALTER` de casilla sobre `remisiones` sin `public.`. Esperado rojo: `migrate.test.ts:345` y PS-11. Restaurar.
- [x] 3.6 M4: quitar de la línea 139 la condición de accesorios (rojo PF-3, PE-7), la de embalaje (PF-3, PE-8) e intercambiarlas (PF-3). M5: eximir también `equipo` (PF-3, PE-8). Restaurar tras cada una.
- [x] 3.7 M6: quitar `exentaDeFoto` de la línea 141 (rojo PF-1, PE-5); leer la exención por `excluyeDemas` (PF-1). M7: `...r` en el payload (PW-1). Restaurar.

## Lote 1 · 4. Cierre del lote

- [x] 4.1 Regla de mutación 3 en `apply-progress.md`: tabla «decisión del cliente → línea del servidor que la impone» de D5, comprobada línea a línea contra el código final; M3 (quitar la línea del servidor de cada fila, con la prueba de su fila en rojo); constatar la fila sin guarda (fotos descartadas del plan, RF-2) como comodidad.
- [x] 4.2 Medida intermedia: `git diff --shortstat --no-renames daea6d6` más `wc -l` de lo nuevo sin trackear. Anotar la cifra; **si pasa de 600, parar aquí y abrir el lote 2 en otro intento**.
- [x] 4.3 Regla de mutación 4: barrido `grep -rnoE "(remision|schema|migrate\.test|recepcion|types|remisiones|novedades)\.(ts|sql):[0-9]+(-[0-9]+)?"` fuera de `archive/`, cada resultado leído contra el fichero con caso A, B o C; segundo pase de abreviadas (`:NNN`) en los ficheros que citan el módulo. Comprobar que la línea 102 de `recepcion.ts` ya no está vacía y las 139 a 142 siguen diciendo lo que las citas afirman.
- [ ] 4.4 Los cuatro códigos de salida, MIRADOS uno a uno y anotados: `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165`, y tras el commit del orquestador `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` (código 0).

## Lote 2 · 5. Cliente (D5, D9)

- [ ] 5.1 Rojo: `apps/desk/src/lib/recepcionForm.test.ts`, línea 115 en sitio (el cuerpo gana tres claves) y al final RF-1…RF-4. Correr `npx vitest run apps/desk/src/lib/recepcionForm.test.ts` y anotar el rojo literal.
- [ ] 5.2 Verde: `apps/desk/src/lib/recepcionForm.ts` (líneas 2, 56, 61, 78, 82, 83, 85, 86 y `selectoresDeFoto` al final) y `apps/desk/src/api/client.ts:535`. RF-1…RF-4 en verde.
- [ ] 5.3 `apps/desk/src/components/CrearRemision.tsx` (líneas 60, 78, 116, 263 y 304-310; unas +7 desde la 311). Sin prueba (F0-00): sólo pinta lo que entrega `vistaDelFormulario`.
- [ ] 5.4 Mutaciones del cliente: quitar `fotosQueFaltan` de `selectoresDeFoto` o la bandera de `incluye` y ver rojo RF-1 y RF-4; restaurar.
- [ ] 5.5 Repetir 4.1 (fila de RF-3 en la tabla de D5), 4.3 (con `recepcionForm.ts`, `client.ts` y `CrearRemision.tsx`; caso B para las citas de `proposal.md` desde la 304) y los cuatro códigos de 4.4.
- [ ] 5.6 Medida final del intento: `git diff --shortstat --no-renames daea6d6` más `wc -l` de lo nuevo sin trackear (techo 800, válvula 720). Binarios aparte.
- [ ] 5.7 Escribir el texto de corrección para el maestro (línea 1241: registro «siempre obligatorio» con dos excepciones, RQ-RE-37 y RQ-RE-38) como sección del `archive-report.md` dentro de la carpeta del cambio. No se edita `docs/sdd/ENTRADA.md`, `openspec/config.yaml`, `CLAUDE.md`, el expediente del maestro ni `_to_delete/`.

## Mapa tarea → requisito o decisión

| Tarea | Requisito o decisión |
|---|---|
| 1.1, 1.2, 2.1 | RQ-RE-37 (marca, siembra, ciclo de migración), D1 |
| 1.3, 2.2, 2.3 | RQ-RE-26 puntos 2 y 3, RQ-RE-37, RQ-RE-38 (cálculo, observaciones, S4), D2, D4 |
| 1.4, 2.4 | RQ-RE-38 (traza, legado, payload), RQ-RE-26 (envío), D3, D6 |
| 3.1 a 3.7, 5.4 | D7 (M1a a M7), reglas de mutación 1 y 2 |
| 4.1, 4.3, 4.4, 5.5, 5.6 | D5, D9, criterios de éxito de la propuesta |
| 5.1 a 5.3, 5.7 | D5, D9, texto para el maestro |

## Tareas de persona — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1). Ninguna es trabajo que una tanda pueda hacer en este repositorio.

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Versionar `decision/accesorios-desde-el-catalogo` | Sesión de supervisión | Árbol del repositorio | `openspec/config.yaml` |
| Pegar en el maestro la corrección de su línea 1241 | Gerencia | Maestro `.docx` | Sección del `archive-report.md` de este cambio |
| Comprobar en n8n si la etiqueta sale en el envío (E-167) | Quien administra n8n | `Remisiones_ST_3.13_Desk` | `docs/sdd/ENTRADA.md` → E-167 |
| Contar los modelos sin accesorios en producción | Servicio Técnico | Base `desk` | `docs/sdd/ENTRADA.md` |
| Mirar en el primer despliegue que `exenta_de_foto` quede en `true` sólo en «Falta un accesorio» | Alfonso | Producción tras el arranque | Escenarios manuales del delta de `remisiones` |
| Desplegar y verificar la pantalla: casillas, novedad exenta y documento generado | Alfonso | `ambientalia-desk.ambientalia.cloud` | Escenarios manuales del delta de `remisiones` |
| Corregir, si procede, los supuestos S1 a S7 antes del 2026-10-19 | Gerencia | Lista semanal de supuestos (E-237) | Cada entrada de `docs/sdd/ENTRADA.md` |
