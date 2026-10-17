# Tareas: medición de garantías con el proveedor por marca

`tanda: F1B-13` · `cierra: no` · `strict_tdd`: cada tarea de código empieza por la prueba en ROJO y luego verde y refactor.
Referencias: D-n y M-n = `design.md`; RQ-TC-65 a 68 = `specs/tickets-core/spec.md`; C-n = tabla de regla 13 (`design.md` §5).
Runner: `npx vitest run <fichero>`; suite: `npm test`. Criterio rector: ninguna línea citada se desplaza (`design.md` §8).

## Review Workload Forecast

| Lote | Ficheros | Ingenua | Estimada (×1,8) |
|---|---|---|---|
| 1 · shared | `medicionGarantias.ts` (75), `medicionGarantias.test.ts` (140), `index.ts` (1) | 216 | ~390 |
| 2 · servidor y cliente | `db/garantiaProveedor.ts` (7), `routes/garantiaProveedor.ts` (5), `routes/medicionGarantias.test.ts` (95), `api/client.ts` (6), `MedicionGarantias.tsx` (125), `Header.tsx` (16) | 254 | ~460 |
| **Total apply** | | ≈ 470 | **~850** |

Cada lote queda bajo la válvula de 720 por intento; el total (850) la supera, por eso son DOS intentos de apply, cada uno
en su worktree y con su medida (`git diff --shortstat --no-renames <partida>` + `wc -l` de lo nuevo sin trackear, tope 800).
Verify y archive abren intento propio (el informe que cada uno genera es sumando). Lote 2 empieza sobre el commit del lote 1.
**Decision needed before apply: No.** Orden: 1 → 2 → Cierre, secuencial (el 2 importa el export del 1); un solo escritor.

---

## Lote 1 · `packages/shared` (RQ-TC-65, RQ-TC-66; D-1, D-5, D-6, D-9)

- [ ] 1.1 **Rojo.** Crear `packages/shared/src/medicionGarantias.test.ts` con todos los escenarios de RQ-TC-65 y RQ-TC-66:
  suma de cuatro estados (1000/250), rechazada (cociente 0), abierta/enviada sin recuperado, «no» fuera (M-1a), sin valor
  reclamado aparte (M-4), agrupación `Acme`/`  ACME ` con etiqueta determinista (M-6), `Müller`≠`Muller`, cociente `null`
  con reclamado 0 (M-8), entrada vacía sin error, umbral 1 ficha vs 2 (M-5), referencia vacía, otro fabricante, ficha «no»,
  orden determinista aunque se permute la entrada, `enviada` con recuperado 999 sintético que no suma (M-2) y
  `resultados` con las tres claves (M-3). Ver el rojo: `npx vitest run packages/shared/src/medicionGarantias.test.ts`
  (falla por ausencia del módulo).
- [ ] 1.2 **Verde.** Crear `packages/shared/src/medicionGarantias.ts` según `design.md` §3: `UMBRAL_FALLA_REPETIDA`,
  `claveMedicion`, interfaces y `medirGarantias` (filtro `reclama`, sumas, cociente con guarda de 0, fallas repetidas, orden).
- [ ] 1.3 **Verde.** Añadir UNA línea de export al final de `packages/shared/src/index.ts` (tras `:44`).
- [ ] 1.4 **Refactor.** Sin cambiar el comportamiento; volver a correr la prueba del 1.1 y `npm run typecheck`.
- [ ] 1.5 Comprobar con `git diff` que `index.ts` sólo gana la línea final y que `garantiaProveedor.ts` de shared no se toca.
- [ ] 1.6 **Cierre del lote 1.** `npm test`, `npm run typecheck`, `npm run lint` (sin errores; base de 165 avisos),
  `npm run build`, `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; cada código mirado por separado.
  Medida del intento (estimación ~390): `git diff --shortstat --no-renames <partida>` + `wc -l` de lo nuevo sin trackear.

## Lote 2 · Servidor y cliente (RQ-TC-67, RQ-TC-68; D-2, D-3, D-4, D-7, D-8)

- [ ] 2.1 **Rojo.** Crear `apps/desk/server/routes/medicionGarantias.test.ts` con el arnés pg-mem (`instalarArnes`, `appWith`;
  molde `routes/garantiaProveedor.test.ts:1-58`): sin cookie → `401` (M-7); usuario sin cargo ni admin recibe éxito; admin y
  no admin reciben el MISMO cuerpo (fija que no hay segundo permiso, regla 1); el cuerpo es igual a `medirGarantias` sobre
  las mismas fichas (varios estados, una «no», una sin valor); `fichasReclamadas` no devuelve el «no» sembrado (M-1b);
  el `GET` no escribe. Ver el rojo: `npx vitest run apps/desk/server/routes/medicionGarantias.test.ts`.
- [ ] 2.2 **Verde.** `fichasReclamadas(db)` al final de `apps/desk/server/db/garantiaProveedor.ts` (tras `:161`) con
  `${COLUMNAS}` y `filas`, `WHERE reclama = true ORDER BY id`.
- [ ] 2.3 **Verde.** Ruta `GET /api/medicion-garantia-proveedor` en `routes/garantiaProveedor.ts` justo antes del cierre (`:107`),
  sólo `requireAuth`, `res.json(medirGarantias(...))`; nombres nuevos añadidos EN SITIO a los `import` de `:3-6` y `:9-12`.
- [ ] 2.4 **Cliente (sin rojo previo: `.tsx` fuera de la red de pruebas, F0-00).** `getMedicionGarantias()` al final de
  `apps/desk/src/api/client.ts` (molde `:845`, `json<T>` de `:3`); crear `MedicionGarantias.tsx` (sólo pinta; «—» ante `null`;
  estado vacío en español; sin colores de alerta, escrituras, `reduce`, `filter`, `sort`, `toLowerCase` ni divisiones);
  en `Header.tsx` el `lazy`, el estado, el botón «Garantías» junto al de Equipos (`:143-145`) y el modal por `createPortal`.
  `App.tsx` NO se toca.
- [ ] 2.5 **Refactor** y verde: `npx vitest run apps/desk/server/routes/medicionGarantias.test.ts`, `npm run typecheck`.
- [ ] 2.6 **Regla de mutación 3.** En `apply-progress.md`, tabla C-1..C-8: cada decisión del `.tsx` frente a la línea de
  servidor o shared que la impone, leída línea a línea; comprobar por lectura que el `.tsx` no calcula (criterio de éxito 5).
- [ ] 2.7 **Cierre del lote 2.** Los cinco comandos de 1.6, cada código por separado. Medida del intento (estimación ~460):
  `git diff --shortstat --no-renames <partida>` + `wc -l` de lo nuevo sin trackear; si supera 720, se para y se parte.

## Cierre del cambio (regla de mutación 1, 3 y 4)

Cada mutación: reproducirla, ver la prueba concreta en rojo, restaurar, volver a verde y registrar el resultado en `apply-progress.md`.
- [ ] 3.1 **M-1a** quitar el `filter` de `reclama` en `medirGarantias` → rojo la prueba de la «no» en shared.
- [ ] 3.2 **M-1b** quitar `WHERE reclama = true` → rojo la prueba de servidor del «no» sembrado (con M-1a viva).
- [ ] 3.3 **M-2** contar abiertas/enviadas como recuperadas → rojo la `enviada` con recuperado 999.
- [ ] 3.4 **M-3** sumar el reclamado de las rechazadas a `recuperado` → rojo rechazada 500/0 (`recuperado = 0`, `resultados.rechazada = 1`).
- [ ] 3.5 **M-4** ficha sin valor como 0 sin incrementar `sinValorReclamado` → rojo `sinValorReclamado = 1`.
- [ ] 3.6 **M-5** `UMBRAL_FALLA_REPETIDA` 2 → 1 → rojo la referencia con UNA ficha.
- [ ] 3.7 **M-6** quitar `trim`/`toLowerCase` de `claveMedicion` → rojo `Acme`/` ACME ` en un grupo y una falla.
- [ ] 3.8 **M-7** quitar `requireAuth` de la ruta → rojo el `401` sin cookie.
- [ ] 3.9 **M-8** cociente sin la guarda de 0 → rojo `cociente: null` (no `NaN`).
- [ ] 3.10 **Regla 1:** una sola guarda en la ruta, no hay par que mover; queda fijado por la prueba de igualdad admin/no admin. Anotar.
- [ ] 3.11 **Regla 2: no aplica** (ninguna guarda nueva vigila un fichero de datos). Dejarlo dicho en `apply-progress.md`.
- [ ] 3.12 **Barrido, regla 4.** `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` sobre todo el repo (incluidos `archive/`, `docs/sdd/` y
  `openspec/config.yaml`) para `Header.tsx`, `routes/garantiaProveedor.ts`, `db/garantiaProveedor.ts` e `index.ts`; comprobar CADA
  resultado contra el fichero (qué AFIRMA la frase, ambos extremos de los rangos) y un segundo pase de la forma abreviada en los
  ficheros que citan el módulo. Documentos fechados (`docs/sdd/Paquete_de_Despliegue_*`): caso B, con revisión. Si algo cae
  detrás de una inserción, reparar según A/B/C, nunca con `sed`.
- [ ] 3.13 **Cierre final.** `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` y el detector de citas sobre
  `HEAD`, todos 0 y anotados; `git diff --stat` sin rutas fuera de las de `design.md` §7 (`App.tsx`, `app.ts`, `openspec/config.yaml`, `ENTRADA.md` intactos).

---

## Tareas de personas (regla del ciclo 1) — FUERA del recuento

No las marca ningún apply. **Archivar NO las da por hechas.**

| # | Qué | Dueño | Destino / qué desbloquea | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Verificar la vista en la aplicación tras desplegar (botón «Garantías», cifras, estado vacío) | Quien despliega, con Gerencia | Confirma el resultado visible; el CI no despliega | `Parte` del corte y `verify-report.md` (resultado visible pendiente) |
| P-2 | Revisar los supuestos S-1..S-6 y los de D-5 (etiqueta del grupo) y D-7 (botón en `UserMenu`) en la lista semanal | Gerencia (E-237, plazo de una semana) | Lo no corregido queda aceptado, con fecha | `proposal.md` §6, `design.md` §9 y la lista semanal por tanda |
| P-3 | Cargar las fallas repetidas en la taxonomía ISO 14224 | Gerencia sitúa la fila (`decision/anexo-56-taxonomia`) | Cierra el uso de las fallas repetidas; esta tanda sólo las muestra (`cierra: no`) | `specs/tickets-core/spec.md` (nota de fuera de alcance) |
