```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:460777cd1dd1d07fc058a2fc11c8743e59b48cc3c1ad725bbd1a7ada26b4297a
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 3/3
scenarios: 27/27
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:feb4ccd6351e06ef53e477b55fc33cccc99b5f51fffbf19a7559612f8bddcfa6
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:55e9257ec2ff2194a3d420e3ee9532b16c12ee8202624ac3c0729d5a346d004b
```

# Informe de verify: recepcion-exencion-foto-y-casilla (F1B-04, `cierra: no`)

Verificador independiente, 2026-10-12. Worktree `recepcion-exencion-foto-y-casilla`, HEAD `3112270`, partida `daea6d6`. Preflight: auto · hybrid · 800 · strict_tdd. `apply-progress.md` no se tomó como prueba: cada afirmación usada se contrastó con el código y con ejecuciones propias.

## Veredicto: PASS CON AVISOS

0 CRITICAL · 3 WARNING · 3 SUGGESTION. El producto cumple RQ-RE-26 (modificado), RQ-RE-37 y RQ-RE-38; los avisos son de texto de la spec y de medida.

## Códigos de salida (cada uno visto por separado)

| Comando | Salida | Cifras |
|---|---|---|
| `npm test` | **0** | 267 ficheros pasan (+3 saltados), 4452 pruebas pasan (+11 saltadas) |
| `npm run typecheck` | **0** | sin errores |
| `npx eslint . --max-warnings 165` | **0** | 165 warnings (el tope), 0 errores |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | sin citas rotas nuevas |
| `npm run build` | **0** | `index-BDDzwgxI.js` 411,62 kB |

## 1. Matriz escenario → prueba (27 escenarios, 3 requisitos; todas pasan en el `npm test` de arriba)

RQ-RE-26: los escenarios previos al cambio (rotulado, mínimas, orden interno, anulada/ya enviada, 422 sin reclamar, retirada, sin categoría) siguen cubiertos por sus pruebas anteriores, en verde. Los nuevos:

| Escenario | Prueba (`apps/desk/server/recepcion.test.ts` salvo indicación) |
|---|---|
| Una novedad exenta no exige foto | `PE-5 · sólo «Falta un accesorio», con las tres mínimas y sin su foto → 200` |
| Exenta y no exenta a la vez | `PE-5b · exenta y no exenta a la vez, sin foto de ninguna → 422 que nombra sólo la no exenta…` |
| La exención sigue a la marca | `PE-6 · la exención sigue a la marca, no a la clave…`; `PE-6b` (retirada sigue exenta); `PF-1`, `PF-2` en `packages/shared/src/recepcion.test.ts` |
| Una casilla exime sólo su categoría | `PE-7`, `PE-8`; `PF-3 · cada casilla quita sólo la categoría de su foto; equipo falta siempre` |
| Con las dos casillas, sólo `equipo` | `PE-8b · con las dos casillas y sin ninguna foto el 422 nombra sólo equipo…` |
| Remisión anterior al cambio sigue exigiendo las tres | `PE-8c · una remisión creada antes del cambio (casillas NULL) sigue exigiendo las tres` |
| RQ-RE-37 base ya sembrada, migrada dos veces | `PS-8` y `PS-9` en `packages/zoho-sync/src/db/novedadesSiembra.test.ts` |
| RQ-RE-37 el fichero vigilado discrimina | `PS-10 · exactamente dos sentencias nombran exenta_de_foto, las dos calificadas…` y los guardianes de `packages/zoho-sync/src/db/migrate.test.ts` (64 ALTER, 38 calificadas) |
| RQ-RE-37 nueva nace sin exención, mantenimiento no la toca | `PM-1` (dos pruebas) en `packages/shared/src/mantenimientoNovedades.test.ts` |
| RQ-RE-37 la lectura sirve la marca | `PL-1 · exentaDeFoto viaja en cada novedad…` |
| RQ-RE-38 cada casilla con su traza | `PT-1`, `PT-1c` |
| RQ-RE-38 hora y persona del servidor | `PT-2` |
| RQ-RE-38 frase en observaciones | `PT-1b`; `PO-1`, `PO-1b` (shared) |
| RQ-RE-38 sin accesorios + accesorios → 422; con `sinEmbalaje` se acepta | `PI-7`, `PI-8` (shared); `PA-5`, `PA-6`; `«Llegó sin embalaje» con «Incluye» marcado no se rechaza por S4…` |
| RQ-RE-38 legado ignora las casillas | `PT-3`, `PT-3b` |
| RQ-RE-38 casilla de accesorios y falta embalaje | `PE-7` |
| RQ-RE-38 el payload conserva sus claves | `PW-1 · con las dos casillas el payload a n8n conserva sus diez claves…` |

Sin escenario sin prueba. **`.tsx`:** `CrearRemision.tsx` no decide nada propio. Los selectores salen de `vista.selectores` (`:306-309`), el cuerpo y el bloqueo de «Incluye» de `vista.cuerpo.incluye` (`:263`) y el motivo de `vista.motivo`; todo viene de `apps/desk/src/lib/recepcionForm.ts`, que llama a `validarRecepcion` (`:63`, `:93`) y a `fotosQueFaltan` (`:105`) de shared. RF-1…RF-4 cubren la función pura. Los dos `useState` de casillas (`:60`) son estado de UI, no decisión.

## 2. Regla 13 / mutación 3 — decisión del cliente → línea del servidor (leída)

Confirmo la tabla de `apply-progress.md`, con las líneas leídas en HEAD:

| Decisión del cliente | Línea del servidor |
|---|---|
| Selector de accesorios/embalaje desaparece con su casilla | `routes/remision.ts:289` (`motivoNoEnviable` con `listNovedades`) → `packages/shared/src/recepcion.ts:139`; la casilla sale de la columna escrita en `db/remisiones.ts:50` y mapeada en `toRemision` (`:25`) |
| Novedad exenta sin selector | `routes/remision.ts:289` + `recepcion.ts:141` (marca leída del catálogo, no de la clave) |
| «Incluye» vaciado y bloqueado; «Crear» bloqueado por la incompatibilidad | paso 7: `packages/shared/src/recepcion.ts:102`, ejecutado por la guarda `routes/remision.ts:158` (`resolverRecepcion` recibe el cuerpo entero, `services/recepcion.ts:16-17`) |
| Casillas sólo en el formulario nuevo | `routes/remision.ts:250` (`rec ? {…} : null`): el legado nunca las escribe (PT-3) |
| Descartar fotos del plan de la categoría con casilla | sin guarda, a propósito: `categoriaDeFoto` no mira casillas y una foto de más no falsea nada (RF-2). Comodidad |
| «Crear» bloqueado mientras falte foto | espejo de `:289`; en el alta no se puede imponer (las fotos se suben después). Espejo legítimo: la imposición está probada en `/enviar` (PE-5…PE-8c) |

## 3. Mutaciones (reglas 1 y 2) — ejecutadas por mí, restauradas, `git status` limpio

Tras cada una corrí `packages/shared/src/recepcion.test.ts`, `apps/desk/server/recepcion.test.ts` y `apps/desk/src/lib/recepcionForm.test.ts`.

| Mutación | Pruebas rojas |
|---|---|
| (a) quitar `exentaDeFoto` de `recepcion.ts:141` | 9: `PE-5`, `PE-5b`, `PE-6`, `PE-6b`, `PF-1`, `PF-2`, `PF-4`, `RF-1 la novedad exenta no pide selector…`, `RF-3 la novedad exenta marcada sin foto no impide crear` |
| (b) quitar la condición de `sinEmbalajeAt` de `:139` | 9: `PE-8`, `PE-8b`, `PW-1`, `PF-3`, `PF-4`, `RF-1 cada casilla quita sólo su categoría…`, `RF-3` (dos), `RF-4` |

**Posición (regla 1):** `PI-7` fija el paso 7 de `validarRecepcion` tras los pasos 1-6. La precedencia en el alta: `PA-4` (serial, escalón A, gana a S4), `PA-5` (S4 gana al `409` de remisión pendiente) y `PA-6` (S4 gana al ítem fuera del checklist, `:197`). Existen las tres y activan las dos guardas a la vez.

## 4. Esquema (regla 2)

`packages/zoho-sync/src/db/schema.sql:819-828`: seis sentencias nuevas (cinco `ALTER ... public.` y un `UPDATE public.catalogo_novedades`), todas calificadas con `public.` y al final del fichero; ningún comentario SQL nuevo lleva `;`. El `UPDATE` usa `IS NOT TRUE` en vez de `= false` (desviación D1 documentada: pg-mem no casa `= false`; en Postgres equivale, la columna es `NOT NULL`).

## 5. Contrato con n8n e IV-12

- `git diff daea6d6 -- apps/desk/server/remisionWebhook.ts`: **vacío**. `PW-1` prueba que las diez claves del payload no cambian con las dos casillas.
- `routes/remision.ts`: diff de **una línea** (`:250`, sólo añade `sinAccesorios`/`sinEmbalaje` al objeto `recepcion`). Sin guardas nuevas ni reordenadas: `:127`, `:155`, `:158`, `:177`, `:197`, `:220`, `:232` conservan número y contenido.
- S4 vive dentro de la guarda existente `:158` (escalón C), así que hereda **el punto (3) de IV-12** (C antes que A: corre antes de «Orden de venta no encontrada», `:220`). No agrava (1), (2) ni (4); frente al serial (`:155`, A, antes) y al `409` (`:177`, D, después) cumple su sitio, fijado por PA-4/PA-5.

## 6. Citas (regla de mutación 4)

Barrido `grep -rnoE` fuera de `archive/` sobre `recepcionForm.ts` y `CrearRemision.tsx`: ninguna cita en código, `CLAUDE.md` ni `ENTRADA.md` apunta a líneas desplazadas (`CrearRemision.tsx` sólo mueve lo posterior a la 310, +2; de `recepcionForm.ts` sólo cita con línea este cambio). Los `Paquete_de_Despliegue_*` que citan las líneas 61, 261 y 264 de `apps/desk/src/components/CrearRemision.tsx` son paquetes fechados: caso B, sin tocar. `schema.sql` y `shared/recepcion.ts` sólo crecen por el final; `recepcion.ts:102` ya no está vacía. `design.md` cita `recepcion.ts:77/137/139/141/154` y hoy dicen lo que afirma. `proposal.md:36` y `:72` (`recepcionForm.ts:54-63`, `:77-87`, `CrearRemision.tsx:304-307`) son caso B: medidas sobre `daea6d6` (`proposal.md:21`).

## 7. Cabecera R-1, tareas y medida

- Cabecera de `proposal.md`: siete campos; `tanda: F1B-04`, `cierra: no`, `toca_maestro: si` (hay `correccion-maestro.md`, 26 líneas). Coherente: cubre la exención de «Falta un accesorio» y las dos casillas con traza; deja fuera E-167 (mover el rotulado, espera a n8n) y el recuento de modelos sin accesorios (de persona), declarados en `proposal.md:19` y en la tabla de personas de `tasks.md`.
- Tareas: **27 de 27** marcadas, 0 pendientes. `apply-progress.md` dice que la 5.7 quedó sin hacer, pero `correccion-maestro.md` existe con el texto pedido: no hay casilla en falso.
- Medida: `git diff --shortstat --no-renames daea6d6` = 22 ficheros, 1277 + 61 = **1338** (nada nuevo sin trackear). Sólo `apps packages`: 16 ficheros, 593 + 61 = **654**.

## Problemas

**CRITICAL:** ninguno.

**WARNING**
1. `specs/remisiones/spec.md:166-167` escribe la frase como «Llegó sin embalaje.» con el punto dentro de las comillas; el código (`packages/shared/src/recepcion.ts:194`, `ETIQUETA_CASILLA`) y el escenario de `:192` la escriben SIN punto, y `apply-progress.md` dice que el delta ya se corrigió. Arreglar antes de fusionar el delta en `openspec/specs/remisiones/spec.md`.
2. La medida acumulada de la tanda es 1338 frente al techo de 800: incluye propuesta, spec, diseño, tareas y los dos lotes. No puedo verificar el reparto por intento (el registro es del orquestador); código y pruebas solos son 654 y caben. Este informe suma ~110 más.
3. `design.md:125` anuncia «+7 desde la línea 311» en `CrearRemision.tsx`; lo real es +2 (desviación 2 de `apply-progress.md`). Diseño desactualizado, sin efecto en el código.

**SUGGESTION**
1. `exentaDeFoto?` es opcional en `NovedadCatalogo` (`packages/shared/src/recepcion.ts:18`): un catálogo sin la clave se lee como no exenta (lado seguro), pero el compilador no cazaría un productor del catálogo que lo olvide.
2. La posición de la guarda `:158` frente a `:197` sólo la fija `PA-6`; mantenerla como prueba de posición nombrada al archivar.
3. El `archive-report.md` debe llevar la línea «cubre / deja fuera» que sostiene `cierra: no` (R-1).
4. Strict TDD: `apply-progress.md` no trae la tabla «TDD Cycle Evidence» de la skill sino su tabla «Rojos vistos antes del producto» (rojo literal por tarea, convención del proyecto); el verde y las mutaciones se re-ejecutaron aquí, así que no queda hueco de evidencia.

## Tareas de persona (fuera del recuento)

Siguen pendientes y archivar no las da por hechas: versionar la decisión de Gerencia, pegar la corrección del maestro (línea 1241), comprobar E-167 en n8n, recontar modelos sin accesorios, verificar `exenta_de_foto` en el primer despliegue y la pantalla en producción, y los supuestos S1 a S7 (plazo 2026-10-19).

