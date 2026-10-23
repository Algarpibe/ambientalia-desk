# Apply-progress — `poblacion-cierre-variante-47-51` (F1F-05, `cierra: no`)

## Lote L1 · shared (intento 3 del registro) — base `afe2a1eb`

Modo: strict TDD. Todo en el worktree de la rama `poblacion-cierre-variante-47-51`. Los ficheros de `packages/shared/src` van en CRLF, como el resto del árbol.

### L1.1 · Línea base (antes de tocar nada)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | salida 0 |
| `npm run lint` | salida 0, **0 errores y 165 avisos** (los esperados) |
| `npm test` | salida 0: 313 ficheros pasan y 3 saltados (316); 5430 pruebas pasan y 11 saltadas (5441); 569 s |

### Rojos vistos (antes del verde)

| Tarea | Prueba | Salida | Causa |
|---|---|---|---|
| L1.2 / L1.3 | `packages/shared/src/diaDeCierre.test.ts` (nuevo, 11 pruebas) | `Failed to load url ./diaDeCierre ... Does the file exist?`; «Test Files 1 failed», «no tests» | El símbolo (`diaDeCierreDelTicket`, `TRANSICIONES_A_FINALIZADO`) no existe: rojo por fichero inexistente |
| L1.5 | `packages/shared/src/indicadores.test.ts`: 3 pruebas en su línea (motivo → `falta el hito: cierre del ticket`) y 9 nuevas al final | «Tests 12 failed \| 107 passed (119)». Las 12: «la fórmula de Zoho: el 47 sin cierre es sin dato…», «con entrada y salida presentes», «el 51 calculado sin cierre del ticket…», «el 47 es cierre − remisión de entrada…», «el 47 no usa la salida…», «el 51 es cierre − finalización ST…», «el 51 no usa la entrega…», «natural con signo: cierre anterior…», «orden_invertido no se duplica…», «“sin dato” del 47 nombra el hito…», «“sin dato” del 51 nombra el hito…», «sin el campo diaDeCierre (undefined) equivale a null» | El cálculo de hoy devuelve el motivo viejo (`hora del último cambio de estado, pendiente de decisión`) y nunca un valor para la variante |

Ediciones en su línea de L1.5 en `indicadores.test.ts`: `:75`, `:306` y `:401` cambian sólo el título; el literal del motivo cambia en `:77`, `:307` y `:332` (`:401` usa la constante de `:332`).

### Verdes

- L1.4: `packages/shared/src/diaDeCierre.ts` (nuevo) + línea 53 de `packages/shared/src/index.ts` (al final). `diaDeCierre.test.ts`: 11 de 11.
- L1.6: `packages/shared/src/indicadores.ts` en sitio (`:41`, `:88`, `:238`, `:241`) y `contraCierre` al final. `indicadores.test.ts` + `diaDeCierre.test.ts`: 130 de 130 pruebas. `npm run typecheck` salida 0.
- Colocación (mutación 4), comprobada con `git diff -U0`: `indicadores.ts` solo trae hunks `-41 +41`, `-88 +88`, `-238 +238`, `-241 +241` y `+265,13` tras la última línea; `index.ts` solo `+53` tras la última; `indicadores.test.ts` edita sus líneas en sitio y añade el bloque nuevo al final. Ninguna línea existente se desplazó.

### Mutaciones (sha256 del fichero mutado, antes y después de revertir: coinciden)

| # | Fichero | Qué se cambió | Prueba que cayó | sha256 antes → después de revertir |
|---|---|---|---|---|
| M4 (L1.7) | `diaDeCierre.ts` | el cierre de la migración pasa a `null` (se ignora el marcador) | «el cierre de la migración no cuenta: ni el marcador ni ese closed_time»; «con varios marcadores manda el ÚLTIMO de la lista» | `cefdef93…e973` → `cefdef93…e973` |
| M8 (L1.8, regla 1) | `diaDeCierre.ts` | `closed_time` se evalúa ANTES que la transición | «la transición a “Finalizado” manda sobre closed_time (regla de mutación 1: la transición manda)» | `cefdef93…e973` → `cefdef93…e973` |
| M5 (L1.9) | `indicadores.ts` | en `:238` el cierre pasa a ser la remisión de salida y en `:241` la entrega | caen 9, entre ellas «el 47 no usa la salida…» y «el 51 no usa la entrega…» | `4b51e748…42c6` → `4b51e748…42c6` |
| G1 (L1.10, regla 2) | `transitions.ts` (línea 262) | `to` de `facturar` pasa de `Finalizado` a `Por Facturar` | «son exactamente las cinco de D1» (guardián); también «la transición a “Finalizado” manda…» y «el día es el de Bogotá…», que usan `facturar` | `4b157dde…6c87` → `4b157dde…6c87` |

Nota sobre G1: el guardián «cada id del conjunto tiene to === “Finalizado” en TODOS los catálogos» no cae con esta mutación, porque el conjunto se deriva del catálogo y `facturar` simplemente deja de estar en él; la que cae es la que fija las cinco exactas. Las dos pruebas se complementan: una vigila el conjunto contra el catálogo, la otra el catálogo contra el conjunto.

### Hallazgos y supuestos

- Los números de línea de `tasks.md` y `design.md` para `indicadores.ts` (`:41`, `:88`, `:238`, `:241`) y `index.ts` (`:52` / línea nueva `:53`) coinciden con el árbol. `tasks.md` L1.4 dice «la línea 54 de index.ts» y a la vez «la línea nueva es la 53»: es la 53 (el fichero tenía 52).
- Supuesto reversible: `contraCierre` toma el hito de partida como argumento (`Fecha Remisión Entrada` / `Fecha Finalización ST`) y el parámetro `formula` de `natural` queda sin uso por quien lo llamaba (el 57, 58 y 59 nunca lo pasaron); no se retira para no tocar más líneas.
- Supuesto reversible: el guardián dice «las cinco de D1» con la lista literal; si un catálogo gana una transición a «Finalizado», esa prueba cae y obliga a decidirlo.

### Cierre de lote (L1.c)

Cadena X.c ejecutada sobre el commit `a45035ec` (código del lote). El segundo commit del lote sólo toca `apply-progress.md` y `tasks.md`, así que la cadena no se repite sobre él.

| Paso | Resultado |
|---|---|
| `npm run typecheck` | salida 0 |
| `npm run lint` | salida 0, 0 errores y **165 avisos** (sin cambio) |
| detector de citas (`cli.ts --sha HEAD`) | salida 0: 7551 comprobadas, 14 abreviadas rotas informativas (no bloquean), 0 cabeceras R-1 inválidas |
| `npm test` | salida 0: 314 ficheros pasan y 3 saltados (317); 5452 pruebas pasan y 11 saltadas (5463); 594 s |

Respecto de la línea base: +1 fichero (`diaDeCierre.test.ts`) y +22 pruebas (11 del día de cierre y 11 de la variante en `indicadores.test.ts`).

Medida del lote (base `afe2a1eb`): `git diff --shortstat --no-renames` más los ficheros sin trackear (0). Cifra final en el informe del lote; techo 800, válvula 720, estimación ~480.

## Lote L2 · servidor (intento 4 del registro) — base `33f5ef91`

Modo: strict TDD. Todo en el worktree de la rama. Los ficheros bajo `apps/desk/server` van en CRLF; los artefactos de `openspec/changes` en LF.

- Commit del orquestador dentro del intento: `cecd82de` reescribió `design.md:34` como cita completa `packages/shared/src/index.ts:52` en `afe2a1eb` (las abreviadas rotas del detector vuelven a 13, 7552 comprobadas). No se tocó.
- L2.1 línea base (hecha por el orquestador sobre `33f5ef91`, L1 aplicado): typecheck 0, lint 0 errores y 165 avisos, detector 0, `npm test` 0 con 314 ficheros pasan y 3 saltados (317) y 5452 pruebas pasan y 11 saltadas (5463).

### L2.2 · Datos en verde (D6), en su línea

Cada `INSERT` de tickets de las pruebas de lectura lleva ahora `status_type = 'Closed'` y `closed_time` igual a la creación, en la misma línea. Los números de `tasks.md` coinciden con el árbol salvo `indicadores.test.ts`, donde `:61` es el título y la sentencia a cambiar (`UPDATE … created_time = NULL`) es la `:63`, y `migracionMarcadorLectores.test.ts:55` es la línea de `leerEntradasIndicadores` (se antepone ahí `UPDATE tickets SET status_type = 'Closed'`).
Con el código de hoy, vitest dirigido a `indicadores.test.ts`, `routes/indicadores.test.ts`, `routes/indicadoresComparacion.test.ts` y `migracionMarcadorLectores.test.ts`: 4 ficheros y 151 pruebas, todo en verde (los datos nuevos no cambian nada mientras el corte siga siendo por creación).

### Rojos vistos (antes del verde)

| Tarea | Prueba | Salida | Causa |
|---|---|---|---|
| L2.3 | `poblacionPorCierre.test.ts` (nuevo, 17 pruebas): 15 rojas, 2 verdes (caracterización) | `Tests 16 failed \| 45 passed` junto con L2.4; p. ej. «cierre en el periodo, creación fuera»: `expected [] to deeply equal [ 'agosto' ]`; «con 20 cerrados…»: `expected [] to have a length of 20 but got +0`; «El flujo se compone»: `expected [] to deeply equal [ 'en' ]` | El corte de hoy es por la fecha de CREACIÓN y no filtra por `status_type`: los cerrados con creación fuera del periodo no entran. Verdes ya de salida y a propósito: «el marcador sale en la MISMA consulta» y «sólo lectura» (caracterizan lo que ya se cumple y lo que L2 no debe romper) |
| L2.4 | `indicadores.test.ts`: «la cuarta consulta lleva el mismo WHERE y mismos parámetros…» (`:161` `length` 2 → 0) | `expected 2 to be +0` | Hoy hay dos parámetros de ventana (`created_time`); la aserción roja que el diseño nombra. `:63` (`closed_time = NULL` además de `created_time`) es caracterización: verde antes y después |

### Verde (L2.5)

`apps/desk/server/indicadores.ts` según la tabla de D4, en sitio: `:2`, `:53-54`, `:59`, `:60`, `:64`, `:65`, `:68`, `:69`, `:70`, `:73`, `:77`, `:78`, `:81`, `:84`; `poblacionPorCierre` al final (poda `historial`, `vistos` y `clasificaciones` de lo que no entra, como exige `indicadores.test.ts:219-226`). `:81` conserva el salto del marcador (ahora lo guarda en `marcadores` antes de saltar). `typecheck` 0.
Colocación (mutación 4), con `git diff -U0` sobre `indicadores.ts`: solo hunks `-2 +2`, `-53,2 +53,2`, `-59,2 +59,2`, `-64,2 +64,2`, `-68,3 +68,3`, `-73 +73`, `-77,2 +77,2`, `-81 +81`, `-84 +84` y `+118,17` tras la última línea. Ninguna línea existente se desplazó. Sólo lectura: ninguna escritura nueva (S-2); la prueba «sólo lectura» lo fija.
Vitest dirigido (`poblacionPorCierre`, `indicadores`, `routes/indicadores`, `routes/indicadoresComparacion`, `migracionMarcadorLectores`, `cierreMigracionEnCifras`): 6 ficheros y 174 pruebas en verde. Además `routes/encuestaRespuestas.test.ts`, `comparacionExportacion.test.ts` e `indicadoresUrl.test.ts` (los otros consumidores): 3 ficheros y 84 pruebas en verde.

### L2.6 · el POST hereda la población

Dos pruebas al final de `routes/indicadoresComparacion.test.ts` (RQ-KP-35): un «ID» de Desk abierto, anulado o cerrado fuera del periodo cae en `fueraDelPeriodo` con el cuarto cubo en su nombre (S-8); y «El flujo se compone en el POST».
**Nacieron verdes** (se escribieron con D4 aplicado: el POST hereda la lectura, D5). Comprobación de que la primera sí discrimina: contra `indicadores.ts` de `HEAD` (lectura vieja, restaurada después con el mismo sha256 `24d317a1…f1673f`) cae con `expected 3 to be 1` (cruzaban los tres: abierto, anulado y cerrado fuera). La segunda (flujo) es verde también con la lectura vieja, porque el flujo ya se componía; su discriminante es la mutación M6 (abajo).

### L2.7 · las tres sha256

Corridas tras L2.2 con el código de hoy y otra vez tras L2.5: **recalculado, bytes iguales** en las tres; ningún hash cambió y ningún `it` se borró ni se saltó. Siguen siendo tres: `routes/indicadores.test.ts:263` (`0975f415…992cf`), `:271` (`c83ef69a…ba88be2`) y `routes/indicadoresComparacion.test.ts:326` (`862d1958…10623a7`). Misma población (cierre = creación en los datos) y el 47 y el 51 de esos fixtures siguen sin hitos, como preveía D6. Se registra en `decision/e224b-poblacion-indicadores`, que nombra el commit del lote.

### Mutaciones (sha256 del fichero antes de mutar y tras revertir: coinciden)

| # | Fichero | Qué se cambió | Pruebas que cayeron | sha256 antes → después |
|---|---|---|---|---|
| M1 (L2.8) | `indicadores.ts` | `poblacionPorCierre` corta por `diaEnZona(t.creadoEn)` | 12 de `poblacionPorCierre.test.ts`, entre ellas «cierre en el periodo, creación fuera (mutación: cortar por creación)» y «los bordes del periodo» | `24d317a1…f1673f` → `24d317a1…f1673f` |
| M2 (L2.9) | `indicadores.ts` | quitado el `continue` de `esAnulado` (`:68`) | «un anulado no entra (mutación: dejar entrar anulados)», «sin periodo (S-4)…» y «respuestas de tickets fuera de la población…» | `24d317a1…f1673f` → `24d317a1…f1673f` |
| M3 (L2.10) | `indicadores.ts` | comentado el `filtros.push` de `:59` | «un abierto no entra (mutación: dejar entrar abiertos)», «sin periodo (S-4)…» y «respuestas de tickets fuera de la población…» | `24d317a1…f1673f` → `24d317a1…f1673f` |
| M4 (L2.11) | `indicadores.ts` | `poblacionPorCierre` ignora el marcador (`undefined`) | «migrado con la fecha de Zoho (mutación: la fecha de la migración)» y «el marcador no es un paso del cálculo…» | `24d317a1…f1673f` → `24d317a1…f1673f` |
| M6 GET (L2.12) | `indicadores.ts` | `recortarPorFlujo` devuelve siempre `e` | «El flujo se compone (mutación: dejar de componerlo)» (GET, RQ-KP-35) | `24d317a1…f1673f` → `24d317a1…f1673f` |
| M6 POST (L2.12) | `routes/indicadoresComparacion.ts` | `fl.flujo` → `null` en `:34` | «El flujo se compone en el POST (mutación: dejar de componerlo)» y siete del bloque RQ-KP-32 | `85ea3bc8…55b` → `85ea3bc8…55b` |

### Hallazgos y supuestos

- `tasks.md` L2.2 cita `indicadores.test.ts:61`/`:63` y `migracionMarcadorLectores.test.ts:55`; las líneas concretas a editar eran `:63` y `:55` (arriba). Sin consecuencias.
- Supuesto reversible: `fueraDelPeriodo` envuelve la expresión de hoy en `Boolean(…)` para tipar el retorno como booleano; la lógica es la misma de `:70`.
- Supuesto reversible: los ids de la fila del fichero en las pruebas del POST son numéricos (`901`…), porque el lector de la exportación rechaza ids no numéricos.
- `sed -i` de Git Bash quitó los CRLF de `indicadores.test.ts` en un paso; se restauraron antes de commitear (el diff trae solo las líneas editadas).

### Cierre de lote (L2.c)

La cadena X.c, sin `npm test` (lo corre el orquestador, solo y en primer plano, sobre el HEAD final), y la medida: ver el informe del lote. Estimación ~530, techo 800, válvula 720.

## Lote L3 · aceptación y barrido (intento 5 del registro) — base `95f93c13`

Modo: strict TDD. Todo en el worktree de la rama. Los ficheros nuevos bajo `apps/desk/server` van en CRLF; los artefactos de `openspec/changes`, en LF.

- L3.1 línea base (hecha por el orquestador sobre `95f93c13`, L2 aplicado): typecheck 0, lint 0 errores y 165 avisos, detector 0 (7571 comprobadas, 13 abreviadas rotas), `npm test` 0 con 315 ficheros pasan y 3 saltados (318) y 5471 pruebas pasan y 11 saltadas (5482).

### Rojo visto (L3.2) y verde (L3.3)

| Tarea | Prueba | Salida | Causa |
|---|---|---|---|
| L3.2 | `routes/indicadoresSeptiembre.test.ts` (nuevo) | `Failed to load url ../testing/septiembre2026 ... Does the file exist?`; «Failed Suites 1», «no tests» | El fixture (`TICKETS_SEPTIEMBRE`, `sembrarSeptiembre`, listas de S-10) no existe: rojo por fichero inexistente |

Verde (L3.3): `apps/desk/server/testing/septiembre2026.ts` (nuevo, D7). Vitest dirigido: 1 fichero, **11 de 11** (trece tickets; el único creado en septiembre es el 998; ocho filas `it.each` por indicador; guardián de la lista cerrada de S-10).
Nació verde a la primera con el código de L1 y L2: las celdas con valor coinciden con `formulaZoho` en los ocho indicadores (recuentos 11, 9, 11, 12, 9, 9, 9, 9, afirmados en la prueba). El fixture se GENERÓ con un script desde el CSV (leído de `C:\dev\Desk_2_R1.023\docs\sdd\`, sin copiarlo) sobre la lista cerrada de S-10. Comprobado al generar: la 50 y la 53 de Gerencia coinciden en los trece, `cf_dias_de_entrega` es la columna 52, y las celdas con valor salen 47 → 11, 49 → 9, 50·53 → 11, 51 → 12, 54 → 9, 57, 58 y 59 → 9 (52 → 10, 53 → 11). Sin contacto, asunto, serial, `cf_codigo_servicio` ni tipo de servicio.

### Mutaciones (regla de mutación 2 en M7; sha256 antes y después de revertir: iguales)

| # | Fichero | Qué se cambió | Prueba que cayó | sha256 antes → después |
|---|---|---|---|---|
| M1 (L3.4) | `apps/desk/server/indicadores.ts` | `poblacionPorCierre` corta por `diaEnZona(t.creadoEn)` | 9 de 11: «septiembre por cierre son trece tickets (por creación salía uno)» y las 8 filas por indicador | `24d317a1…f1673f` → `24d317a1…f1673f` |
| M7-47 (L3.5) | `testing/septiembre2026.ts` | `sep-01` `gerencia['47']` 144 → 146 | «indicador 47: formulaZoho coincide con la celda de Gerencia…» (1 de 11) | `f3cc6d82…8a9c2f` → igual |
| M7-49 (L3.6) | ídem | `gerencia['49']` 11 → 13 | «indicador 49: …» (1 de 11) | ídem |
| M7-50·53 (L3.7) | ídem | `gerencia['50_53']` 6 → 8 | «indicador 50·53: …» (1 de 11) | ídem |
| M7-51 (L3.8) | ídem | `gerencia['51']` 51 → 53 | «indicador 51: …» (1 de 11) | ídem |
| M7-54 (L3.9) | ídem | `gerencia['54']` `No cumple` → `Cumple` | «indicador 54: …» (1 de 11) | ídem |
| M7-57 (L3.10) | ídem | `gerencia['57']` 1 → 3 | «indicador 57: …» (1 de 11) | ídem |
| M7-58 (L3.11) | ídem | `gerencia['58']` 6 → 8 | «indicador 58: …» (1 de 11) | ídem |
| M7-59 (L3.12) | ídem | `gerencia['59']` 6 → 8 | «indicador 59: …» (1 de 11) | ídem |

En cada M7 cae EXACTAMENTE la fila de su indicador y las otras 10 siguen verdes («1 failed | 10 passed (11)» las ocho veces; los nombres se leyeron en una segunda pasada). El fixture no está trackeado en ese momento, así que se revirtió desde una copia y se comprobó con `cmp` además del sha256.

### Barrido de la regla de mutación 4 (L3.13) contra `f0eb92c4`

(1) `git diff -U0 f0eb92c4 HEAD` sobre los dos ficheros: `apps/desk/server/indicadores.ts` sólo `-2`, `-53,2`, `-59,2`, `-64,2`, `-68,3`, `-73`, `-77,2`, `-81`, `-84` (todos con el mismo número de líneas nuevas) y `+118,17` tras la última; `packages/shared/src/indicadores.ts` sólo `-41`, `-88`, `-238`, `-241` y `+265,13` tras la última. **Ninguna línea se desplazó**: una cita a una línea no editada no puede haber cambiado.
(2) `git grep -nE "indicadores\.ts:[0-9]+"` sobre `HEAD`, sin excluir `archive/`: 231 líneas con la forma completa. Un script parte las citas por fichero (51 son de `routes/indicadores.ts`, `routes/indicadoresComparacion.ts` u otros, que esta rama no toca) y separa las que caen en una línea editada o cruzan un rango que la contiene. **153 caen en líneas no editadas** (siguen ciertas por construcción) y **61 en o sobre una línea editada** (server 42, shared 13, nombre sin ruta 6), leídas una a una contra su frase:

| Caso | n | Qué son | Acción |
|---|---|---|---|
| A · presente, sigue cierta | 21 | `migracionMarcadorLectores.test.ts:58` y las de `fecha-migracion-fuera-de-cifras` a `:81` (el salto del marcador sigue en `:81`); `:64` (la consulta de tickets: `filtro-indicadores-por-flujo`, `openspec/specs/kpis/spec.md:1359`); `:76-84`, `:64-74`, `:77`, `:51-55`; `design.md:61` y `specs/kpis/spec.md:255` de este cambio; `shared:33-42`; las dos de `calibracion-directa` que son de `shared:54`, no tocada | Ninguna. Conocida: **`openspec/specs/kpis/spec.md:1447`** cita `server/indicadores.ts:70` («el único corte es el periodo»), hoy un comentario; el corte vive en `:60` (`fueraDelPeriodo`) → **se reapunta a `:60` AL ARCHIVAR** (no se toca la spec viva) |
| B · fechada, cierta de su día | 32 | Las ancladas `en 42a4828` y `en 73bd52f` y las de `archive/` que describen un plan o un estado (`:56-86`, `:84`, `:51-55`, `:1-96`, `:70` de `filtro-indicadores-por-flujo`, `:88`, `:238`, `:241` de `indicadores-51-55`); `Paquete_de_Despliegue_2026-10-06.md:475`; las heredadas de `indicadores-51-55` (`apply-progress.md:406`, `verify-report.md:167`) | Sin tocar los registros archivados. **Reparadas aquí, en `proposal.md` de este cambio:** `:59-60`, `:67-70`, `:238`, `:241`, `:88` y `:69` pasan a «en `f0eb92c4`» (verificado: en ese árbol son la ventana de creación, el corte por creación, los `sinDato(MOTIVO_H1)` y el comentario «sin periodo salen todos»). **Para el orquestador en `main`:** `openspec/config.yaml:4096` (O-1) y `:5199-5200` (O-2) |
| C · superada por esta tanda | 7 | `docs/sdd/ENTRADA.md:2128` y `F1B-09_Auditoria_blueprint_audit-F1B.md:247` («la consulta filtra sólo por periodo», `:57-64`: ya no filtra por periodo en SQL sino por `status_type`; lo cierra RQ-KP-35); `Paquete_de_Despliegue_2026-10-04.md:643` y `…-04b.md:978` («carga todos los tickets»: ahora los cerrados no anulados); `design.md` de `comparacion-exportacion-zoho` (línea 90) («todos los tickets, fuera del periodo vacío por construcción»); `design.md` de `indicadores-51-55` (líneas 51-52) (`MOTIVO_H1` «se conserva» como motivo de la variante) | Anotadas sin editar: son de `docs/sdd` (Supervisión; `ENTRADA.md` está modificado en `main`) o de `archive/`. Las recoge el orquestador si quiere nombrar la superación |
| — | 1 | `tasks.md:84` de este cambio, que cita la cita (`server/indicadores.ts:70`) para decir que se reapunta | Ninguna |

(3) Pase de abreviadas: por script, las `:N` pegadas a una cita completa de los dos módulos que caen en línea editada (8 `:N` en 3 líneas): dos de `archive/indicadores-51-55` (B) y `proposal.md:26` de este cambio (reparada arriba). Las `:N` sueltas, sin nombre y sin cita completa en su línea (p. ej. la tabla D4 de `design.md`, cuya columna «Hoy» describe `f0eb92c4`), siguen siendo de lectura humana: el detector no las bloquea.
(4) Detector de `pre-push`: ver el cierre del lote.

### Tabla de la regla invariable 13 (L3.14, mutación 3)

`git diff --stat f0eb92c4 HEAD -- apps/desk/src` sale **vacío**: el cliente no toma ninguna decisión nueva. Las de esta tanda están todas en el servidor y en `shared`.

| # | Decisión | Dónde se toma | Línea que la impone |
|---|---|---|---|
| D1 | Qué población entra (cerrados, no anulados) | servidor | `apps/desk/server/indicadores.ts:59` (`status_type = 'Closed'`), `:68` (`esAnulado`) |
| D2 | Qué día es «el cierre» y el corte por periodo | servidor y `shared` | `packages/shared/src/diaDeCierre.ts:28`; `apps/desk/server/indicadores.ts:130` (corte) |
| D3 | El 47 y el 51 contra el cierre | `shared` | `packages/shared/src/indicadores.ts:238`, `:241`, `:270` |
| D4 | Cliente: nada nuevo (`Analisis.tsx` pinta lo que devuelve la ruta) | — | `git diff --stat … apps/desk/src` vacío |

### Cierre de lote (L3.c)

Cadena X.c sobre el HEAD final, sin `npm test` (lo corre el orquestador, solo y en primer plano). `npm run typecheck`: salida 0. `npm run lint`: salida 0, 0 errores y **165 avisos** (sin cambio). Detector de citas (`cli.ts --sha HEAD`): salida 0, 7593 comprobadas, **13** abreviadas rotas informativas (las mismas que en `main`), 0 cabeceras R-1 inválidas; la primera pasada dio 2 bloqueantes, ambos de este `apply-progress.md` (dos citas escritas con forma de ruta a ficheros que no existen con ese nombre), pasadas a prosa. Vitest dirigido (`indicadoresSeptiembre`, `indicadores`, `routes/indicadores`, `routes/indicadoresComparacion`, `poblacionPorCierre`, `migracionMarcadorLectores`, `shared/indicadores`, `diaDeCierre`): 8 ficheros y **311 pruebas** en verde.
Medida del lote (base `95f93c13`, `git diff --shortstat --no-renames` más lo nuevo sin trackear, que es 0): cifra exacta en el informe del lote; estimación ~405, techo 800, válvula 720.

### Hallazgos y supuestos

- Supuesto reversible: el fixture lleva `numero` además del `id` sintético (S-10 lo permite: «número»); y `estado` literal `Finalizado` en los trece (la exportación sólo trae cerrados).
- Supuesto reversible: la prueba de aceptación no lee el CSV (pasaría roja en el checkout principal, donde existe sin trackear); que el fixture no copia datos personales lo revisa verify a mano, campo a campo contra `CLAVES_DEL_FIXTURE`.
- Hallazgo: las 8 celdas coinciden dentro de ±1 sin ajustar nada de L1 ni de L2; no hizo falta tocar código de producción.
- Hallazgo: el barrido encontró 7 citas SUPERADAS (caso C) en `docs/sdd` y `archive/` que no se editan aquí (ver tabla); y las dos de `config.yaml` (O-1, O-2) son las únicas B que quedan para `main`.
