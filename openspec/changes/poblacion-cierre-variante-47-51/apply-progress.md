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

Se completa al final del lote: ver abajo.
