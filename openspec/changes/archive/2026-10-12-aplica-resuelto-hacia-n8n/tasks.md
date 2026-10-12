# Tareas: la aplicación resuelve «Aplica: Sí/No» y lo manda a n8n como un dato ya decidido

Cambio `aplica-resuelto-hacia-n8n` (F1B-04, `cierra: no`). Un solo lote de apply, orden de `strict_tdd`: rojo, verde, mutaciones, entregable, cierre. Cada casilla se marca sólo con su resultado anotado en `apply-progress.md`. Las pruebas AP-1…AP-10, BP-1…BP-3, PA-A1…PA-A3 y las mutaciones M1…M8 son las de `openspec/changes/aplica-resuelto-hacia-n8n/design.md` (D4, D5); no se reabren sus decisiones. Todo fichero citado se edita en sitio o al final.

## Review Workload Forecast

Líneas estimadas (inserciones + borrados, D7): ~331 (código y pruebas ~131, entregable ~90, `apply-progress.md` ~110); ×1,8 ≈ 596.
Chained PRs recommended: No. Un solo lote.
Riesgo frente al presupuesto de 800: bajo (válvula de 720 con 124 líneas de margen). Si la medida de 5.5 pasa de 720, parar y consultar.
Decision needed before apply: No.

## 1. Rojo (D4)

- [x] 1.1 `packages/shared/src/recepcion.test.ts`, al final: AP-1…AP-10 sobre `aplicaDeRemision`. Correr `npx vitest run packages/shared/src/recepcion.test.ts`. Rojo esperado: las diez fallan con `aplicaDeRemision is not a function` (la función no existe); anotarlo literal.
- [x] 1.2 `apps/desk/server/remisionWebhook.test.ts`, al final: BP-1…BP-3 (BP-1 por `Object.keys`). Rojo esperado: BP-2 `expected undefined to be false` y BP-3 `expected undefined to be true`; BP-1 caracteriza y puede nacer verde (su rojo es la mutación M4b).
- [x] 1.3 Las tres pruebas de diez claves, EN SITIO y a propósito, a once más `cuerpo.aplica` `true`: `apps/desk/server/recepcion.test.ts:424`, `apps/desk/server/recepcion.test.ts:727` (PW-1) y `apps/desk/server/accesoriosRemision.test.ts:191`. Decirlo en la propia prueba. Rojo esperado: la lista de claves del cuerpo tiene diez y se esperan once.
- [x] 1.4 `apps/desk/server/recepcion.test.ts`, al final: PA-A1…PA-A3. Rojo esperado: PA-A1 (diez claves, se esperan once) y PA-A3 (`aplica` ausente); PA-A2 caracteriza y nace verde. Si `conN8n` no admite respuestas distintas por llamada, PA-A3 llama dos veces a `buildRemisionPayload` sobre la misma remisión leída (D4).

## 2. Verde (D1, D2)

- [x] 2.1 `packages/shared/src/recepcion.ts`, AL FINAL (tras la línea 194): `RemisionAplica` y `aplicaDeRemision` tal como en D1. No se edita `packages/shared/src/index.ts`. AP-1…AP-10 en verde.
- [x] 2.2 `apps/desk/server/remisionWebhook.ts`, cinco ediciones EN SITIO (líneas 2, 11, 29, 39 y 46 de D2), sin añadir ni quitar líneas: comprobar con `git diff --stat` que son 5 inserciones y 5 borrados. BP-1…BP-3, las tres de once claves y PA-A1…PA-A3 en verde.
- [x] 2.3 `npm run typecheck` (anotar si `Remision` es asignable a `RemisionAplica` sin conversión) y `npx eslint . --max-warnings 165` (anotar si acepta el import mixto de la línea 2 y el *spread* condicional de la 46). Anotar si `apps/desk/server/fotoNovedad.test.ts:137-156` sigue verde sin tocarla.

## 3. Mutaciones (D5)

Una a una. Copia previa de los ficheros en un directorio temporal fuera del repositorio (sin `git checkout --`). Tras cada una: correr las pruebas afectadas, anotar en `apply-progress.md` el nombre de cada prueba que se puso roja, restaurar desde la copia y comprobar con `git diff`.

- [x] 3.1 M1: quitar el sumando de «Incluye». Esperado rojo: AP-3 y `apps/desk/server/accesoriosRemision.test.ts:191`.
- [x] 3.2 M2: quitar `hayNovedad`. Esperado rojo: AP-2 y `apps/desk/server/recepcion.test.ts:424`.
- [x] 3.3 M3a quitar `sinAccesoriosAt` (rojo AP-4); M3b quitar `sinEmbalajeAt` (rojo AP-5); M3c las dos (rojo AP-4, AP-5, BP-3 y PW-1).
- [x] 3.4 M4a: legado devuelve `false` en vez de `null` (rojo AP-7, AP-8, BP-1, PA-A2). M4b: el payload manda `aplica: null` o `undefined` en vez de omitir (rojo BP-1, y PA-A2 con `null`).
- [x] 3.5 M5: quitar el recorte de vacíos (`v !== ''` o `incluye.length > 0`). Esperado rojo: AP-6.
- [x] 3.6 M6: mandar `hayNovedad` en vez de la suma. Esperado rojo: AP-3, AP-4, AP-5, PW-1 y `apps/desk/server/accesoriosRemision.test.ts:191`.
- [x] 3.7 M7: legado sólo si `novedades === null` (la ausencia cuenta como formulario nuevo). Esperado rojo: AP-8 y BP-1.
- [x] 3.8 M8: `hayNovedad !== false` en vez de `=== true`. Esperado rojo: AP-9.

## 4. Entregable (D6)

- [x] 4.1 Escribir `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md` con el índice de D6 (ocho apartados), el código actual completo (dato del analista, hipótesis, marcado como tal) y el código nuevo completo; sin credenciales ni direcciones; sin mencionar reuniones. Comprobar a mano que el código nuevo, sin `aplica` o con un valor no booleano, hace letra por letra lo de hoy.

## 5. Cierre del lote

- [x] 5.1 Los cuatro códigos de salida, MIRADOS uno a uno y anotados: `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165` y `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` (código 0, tras el commit del orquestador).
- [x] 5.2 Regla de mutación 4: barrido `grep -rnoE "(remisionWebhook|recepcion|accesoriosRemision)(\.test)?\.ts:[0-9]+(-[0-9]+)?"` sin excluir `openspec/changes/archive`, cada resultado leído contra el fichero; comprobar que ninguna cita cambió de línea (ediciones en sitio, adiciones al final). Segundo pase de abreviadas (`:NNN`) en los ficheros que citan esos módulos.
- [x] 5.3 Regla de mutación 3 por escrito en `apply-progress.md`: decisiones que toma el cliente por este cambio, ninguna nueva (D3); repetir la búsqueda de «Aplica» como palabra en `apps/desk/src` y anotar que sigue en seis apariciones, todas el verbo en comentarios. Reglas de mutación 1 y 2: no aplican.
- [x] 5.4 Comprobar que no se tocaron `apps/desk/server/routes/remision.ts`, `packages/zoho-sync/src/db/schema.sql`, `apps/desk/src`, `packages/shared/src/index.ts` ni `packages/shared/src/types.ts` (`git diff --stat`).
- [x] 5.5 Medida del lote: `git diff --shortstat --no-renames <commit de partida>` más `wc -l` de lo nuevo sin trackear (techo 800, válvula 720). Binarios aparte.
- [x] 5.6 Escribir `apply-progress.md` (D7, ~110 líneas): rojos literales, verdes, resultado de M1…M8, hipótesis resueltas (tipos, lint, `conN8n`), medida.

## Trazabilidad escenario → prueba

| Escenario de `openspec/changes/aplica-resuelto-hacia-n8n/specs/remisiones/spec.md` | Tarea | Prueba |
|---|---|---|
| A-SIN «Sin novedad» sola | 1.1, 1.4 | AP-1, PA-A1 |
| A-REAL novedad real sin accesorios | 1.1, 1.3 | AP-2, `apps/desk/server/recepcion.test.ts:424` |
| A-ACC «Sin novedad» con accesorios | 1.1, 1.3 | AP-3, `apps/desk/server/accesoriosRemision.test.ts:191` |
| A-CASACC «Llegó sin accesorios» | 1.1, 1.2 | AP-4, BP-3, PW-1 |
| A-CASEMB «Llegó sin embalaje» | 1.1 | AP-5 |
| A-BLANCO «Incluye» de vacíos | 1.1 | AP-6 |
| A-LEGADO la clave no está | 1.1, 1.2, 1.4 | AP-7, AP-8, BP-1, PA-A2 |
| A-REENVIO mismo valor | 1.4 | PA-A3 |
| A-ONCE once claves | 1.2, 1.3, 1.4 | BP-2, las tres en sitio, PA-A1 |
| A-NOGUARDA ni `hay_novedad` ni lo guardado | 2.3, 5.4 | `apps/desk/server/fotoNovedad.test.ts:137-156` sin tocar y PA-A2 (niegan `hayNovedad`); lo guardado, por `git diff --stat` |

## Tareas de personas — FUERA DEL RECUENTO

Archivar este cambio **no las da por hechas** (regla del ciclo 1). Ninguna describe trabajo que una tanda pueda hacer en este repositorio: el flujo de n8n lo edita una persona, lo demás es producción, decisión o versionado de supervisión.

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Confirmar las tres hipótesis sobre n8n, cambiar a mano el nodo «Verifica Incluye Entrada» del flujo `Remisiones_ST_3.13_Desk` y publicar a la vez la aplicación y el flujo | Alfonso | `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md` |
| Remisión de prueba tras publicar: escenarios MANUALES M-1 (correo y documento muestran «Aplica: Sí») y M-2 (un solo lado publicado da el resultado de hoy) | Alfonso | Escenarios MANUALES del delta de `remisiones` |
| Corregir, si procede, los supuestos S1 a S7 antes del 2026-10-19; en especial S3 | Gerencia | Lista semanal de supuestos (E-237) |
| Decidir E-167 (momento del rotulado) y recontar los modelos sin accesorios en producción | Gerencia, con quien administra n8n · Servicio Técnico | `docs/sdd/ENTRADA.md` → E-167 · sección final «2026-10-12 (d)» de `docs/sdd/TRASPASO_2026-10-08.md` |
| Versionar lo suyo: entrada de bandeja, parte y, si Gerencia la quiere, la definición de «Aplica» en el maestro | Sesión de supervisión | `docs/sdd/ENTRADA.md` y el expediente del maestro |
