# Apply-progress — `indicadores-51-55` (F1F-05, `cierra: no`)

## Lote 1 · El 51 en `packages/shared` — casillas 1.1 a 1.20 hechas; 1.21 a 1.23 (commit, detector de citas, asentar) las hace el orquestador

Commit de partida del intento: `4773b23`. Worktree `C:\dev\Desk_2_R1.023-worktrees\indicadores-51-55`. Modo: Strict TDD (vitest).

### Tamaños (`wc -l`, casillas 1.1 y 1.17)

| Fichero | Antes | Después | Qué cambió |
|---|---|---|---|
| `packages/shared/src/indicadores.ts` | 251 | 262 | ediciones en sitio hasta la línea 251; **+11 al final** (`TRANSICIONES_DE_ENTREGA` en la 254, `hitoEntrega` en la 257) |
| `apps/desk/server/indicadores.ts` | 93 | 93 | sólo el comentario de la línea 90 |
| `packages/shared/src/indicadores.test.ts` | 330 | 427 | imports en sitio (líneas 1, 3 y 6), líneas 76, 100-114 y 306-315 en sitio, bloque nuevo al final |
| `apps/desk/server/indicadores.test.ts` | 96 | 107 | bloque de integración al final (+11) |

### 1.2 · Revisión sin edición de la reentrancia: **sin cambios**

- `packages/shared/src/reentrancia.ts:78-83`: `INDICADORES_G6` no trae el 51 y **no se le añade** (dato externo de G.8).
- Guardián K14 (`packages/shared/src/indicadores.test.ts:146-151` antes de la edición, hoy en las líneas 145-150): recorre `INDICADORES_G6`; no exige nada del 51.
- `packages/shared/src/indicadoresComparacion.test.ts:95` (C8), `:128` y `:149` (C15) y `packages/shared/src/indicadoresComparacion.ts:12` construyen los pares con datos sintéticos o enumeran las nueve columnas: ninguno supone que el 51 nunca es comparable (hipótesis 7 del diseño, confirmada por lectura). Nada que editar.

### Pruebas añadidas y rojo previo observado (casillas 1.3 a 1.10)

Corrida del rojo: `npx vitest run packages/shared/src/indicadores.test.ts apps/desk/server/indicadores.test.ts` antes de tocar `indicadores.ts`: **19 rojas de 127**, todas por el motivo esperado (ninguna por sintaxis).

| Prueba (fichero `packages/shared/src/indicadores.test.ts` salvo la última) | Rojo observado |
|---|---|
| Guardián (a): cada id de `TRANSICIONES_DE_ENTREGA` existe | `TypeError: Cannot read properties of undefined (reading 'length')` (la constante no existía) |
| Guardián (b): igualdad de conjuntos con `transicionesQueEscriben` | `TypeError: TRANSICIONES_DE_ENTREGA is not iterable` |
| 51: una `entrega_al_cliente` (3), `entrega_sin_factura` (2), dos entregas (7), filas desordenadas (7), entrega anterior (−2 y `orden_invertido`), borde de Bogotá (3) — seis casos | `expected 'falta el hito: hora del último cambio…' to be 3 / 2 / 7 / −2` |
| Hito de entrega después de la finalización y misma clave que el motivo | `expected [ 'Fecha Finalización ST' ] to deeply equal [ 'Fecha Finalización ST', … ]` |
| Sin fila de entrega aun con `Fecha Remisión de Salida` | `expected 'falta el hito: hora del último…' to be 'falta el hito: transición de entrega'` |
| Con entrega y sin finalización | `… to be 'falta el hito: finalización del servicio'` |
| Sin entrega ni finalización manda el primer motivo (par de posición, regla de mutación 1) | `… to be 'falta el hito: transición de entrega'` |
| Reentrante: mismo id dos veces; `entrega_sin_factura` + `entrega_al_cliente` | `TypeError: Cannot read properties of undefined (reading 'escrituras')` |
| Reentrante con una fila: `false`; sin historial: `null` | **verde de nacimiento** (con la implementación vieja ya daba `false` y `null`: el 51 no tenía hitos de entrega que contar). Su valor es de regresión, no de guía |
| Variante del 51 calculado: `formulaZoho` con el texto de `MOTIVO_H1` | `expected { tipo: 'sin_dato', … } to deeply equal { tipo: 'valor', valor: 3 }` (el valor aún no se calculaba) |
| Variante del 55 `Excelente` → `formulaZoho` igual a la letra | `expected { tipo: 'sin_dato', … } to deeply equal { tipo: 'valor', valor: 'Excelente' }` |
| 55 sin calificación y con `Good` de Zoho → `valorZoho` `Good` | **verde de nacimiento** (cubierto ya por R5; se repite porque RQ-KP-09 lo exige como escenario propio) |
| `horaActualizacionEstado` ya no existe (dos ficheros) | `expected '// Los nueve indicadores…' not to contain` el literal, y la misma aserción sobre `apps/desk/server/indicadores.ts` |
| `apps/desk/server/indicadores.test.ts`, integración con pg-mem y `migrate(db)` | `expected { tipo: 'sin_dato', … } to deeply equal { tipo: 'valor', valor: 3 }` |

Después del verde de `indicadores.ts` quedaron rojas, **por contrato**, cuatro pruebas viejas de las líneas 103-113 (K13, las dos con la entrada opcional y «con la hora y sin finalización»): se editaron **en sitio y después** (casilla 1.11), junto con la línea 76 y el bloque 306-315. Resultado final de los dos ficheros: **126 pruebas, todas verdes**.

### Verde (casillas 1.12 a 1.15)

- `packages/shared/src/indicadores.ts`: ediciones en sitio de la cabecera (línea 2), `:45-48`, `:86` (`MARCA_ENTREGA`), `:133` (el hito se engancha en la misma línea que el del 49), `:228-232` (el cierre `v51`; **la línea `const fin = resolverHito(…)` de la 228 original desaparece** —queda sin uso— y el cierre ocupa las líneas 228 a 232), `:241` y `:246`. `MOTIVO_H1` y `v55` no cambian. `:134` (citada por `apps/desk/server/migracionMarcadorLectores.test.ts:58` y `docs/sdd/ENTRADA.md:2078`) no se movió ni cambió.
- Al final: `TRANSICIONES_DE_ENTREGA` (línea 254) y `hitoEntrega` (línea 257). El fichero crece **+11 líneas, todas al final**.
- `apps/desk/server/indicadores.ts:90`: el comentario ya no nombra la entrada; sigue en 93 líneas.
- **Hipótesis 6 del diseño, resuelta:** `hitoEntrega` se usa en `hitosDe` (línea 133) y se declara más abajo (línea 257); `npm run lint` da 165 avisos y 0 errores. El respaldo (declararla en la 128) **no** hizo falta.
- **Decisión de edición:** el comentario de la línea 90 de `apps/desk/server/indicadores.ts` dice ahora «El 51 sale del historial; el 55 queda sin dato mientras la lectura no aporte la calificación (RQ-KP-22)». Es cierto hasta el lote 3 y lo reescribe ese lote al añadir la cuarta consulta.

### Mutaciones (casilla 1.16): todas rojas, restauradas

Cada una se aplicó sobre el fichero, se corrió `npx vitest run packages/shared/src/indicadores.test.ts apps/desk/server/indicadores.test.ts` y se restauró el original desde copia en memoria (`git status` posterior sólo muestra los ficheros del lote; `packages/shared/src/transitions.ts` sin diff).

| Mutación | Rojas | La caza |
|---|---|---|
| M5 permutar las dos comprobaciones de ausencia de `v51` | 1 | «sin entrega ni finalización manda el primer motivo» |
| M12a renombrar `entrega_al_cliente` en `transitions.ts` | 2 | guardián (a) y guardián (b) |
| M12b dar `Fecha Remisión de Salida` a `diagnostico_complementario` | 1 | guardián (b) |
| M13a quitar `entrega_sin_factura` de la constante | 3 | guardián (b); «una entrega_sin_factura»; «entrega_sin_factura y entrega_al_cliente» |
| M13b añadir un id inventado | 2 | guardián (a) y (b) |
| M19 `hitoEntrega` toma la primera entrega | 4 | «dos entregas», «filas desordenadas» y las dos de reentrante |
| M20 caer en `Fecha Remisión de Salida` sin fila de entrega | 1 | «con finalización y Fecha Remisión de Salida pero sin fila de entrega» |
| M21 invertir el signo | 12 | los seis casos del 51, los del bloque editado, la variante y la integración (entre ellas «una entrega» y «entrega anterior») |
| M22 día en UTC (`slice(0, 10)`) | 2 | el borde `2027-01-09T03:00:00Z` (dos veces: bloque nuevo y bloque editado) |

Ninguna sobrevivió; no hizo falta añadir pruebas.

### Cierre (casillas 1.17 a 1.19)

- `grep -rn "horaActualizacionEstado" apps packages --include=*.ts --include=*.tsx`: **sin resultados** (código de salida 1 de `grep`).
- `npm test`: código de salida **0** — 254 ficheros pasan y 2 saltados; **4086 pruebas pasan, 7 saltadas** (4093).
- `npm run typecheck`: código de salida **0**.
- `npm run lint`: código de salida **0** — 165 avisos, 0 errores (no sube).
- Medida (casilla 1.19): ver la línea «Medida» al final de este apartado.

### Barrido de citas, regla de mutación 4 (casilla 1.20)

`grep -rnoE "indicadores\.(test\.)?ts:[0-9]+(-[0-9]+)?"` sobre todo el repositorio (`.ts`, `.tsx`, `.md`, `.yaml`, `.sql`, `.json`; sin `node_modules`): 50 resultados. El patrón mezcla `packages/shared/src/indicadores.ts`, `apps/desk/server/indicadores.ts` y las pruebas homónimas; cada uno se asignó a su fichero leyendo la frase.

- Líneas editadas en sitio de `packages/shared/src/indicadores.ts`: 2, 45-48, 86, 133, 228-232, 241 y 246. **Ninguna cita las nombra** (comprobado con un segundo patrón sobre esas líneas; el único resultado es `indicadores.test.ts:45` del `verify-report.md` archivado de `continuidad-indicadores`, que habla de una prueba de K8 y cae en un tramo del fichero de pruebas que no se movió).
- Citas vivas vigiladas: la línea 134 de `packages/shared/src/indicadores.ts` (`apps/desk/server/migracionMarcadorLectores.test.ts:58`, `docs/sdd/ENTRADA.md:2078`) sigue siendo `reentrante = …`; la línea 76 de `apps/desk/server/indicadores.ts` (`apps/desk/server/migracionMarcadorLectores.test.ts:54`) sigue siendo la consulta del historial. Las que citan las líneas 141, 57-64 y 125 del módulo (ENTRADA 2128, F1B-09) apuntan a líneas que no cambiaron.
- Fichero de pruebas de `packages/shared`: las líneas posteriores a la 114 suben una (el bloque 100-114 pasa de 15 a 14 líneas) y las posteriores a la 315, cuatro más (el del 47 pasa de 10 a 7). **No hay ninguna cita viva a esas líneas**: las del archivo son de la prueba de rutas, que no se tocó, o caen en tramos que no se movieron.
- Las citas de `openspec/config.yaml` (líneas 4096 y 4102) a las líneas 88-89 y 58 del módulo describen el estado de partida: **caso B**, se tratan en L4.
- Segundo pase de las abreviadas (sin nombre de fichero, con las líneas editadas) en `docs/`, `openspec/specs/` y `openspec/config.yaml`: sin resultados que hablen de estos ficheros.
- Resultado: **sin citas rotas por este lote**.

### Regla 13 · líneas reales de este lote (alimenta la tabla de `tasks.md`)

- Decisión «qué entrega cuenta para el 51» (fila 6): `TRANSICIONES_DE_ENTREGA` en `packages/shared/src/indicadores.ts:254` y `hitoEntrega` en `packages/shared/src/indicadores.ts:257`; el uso, en `packages/shared/src/indicadores.ts:133`.

**Medida (casilla 1.19):** `git diff --shortstat --no-renames 4773b23` = 5 ficheros, 171 inserciones y 52 borrados (223), más `wc -l` del fichero nuevo sin trackear `openspec/changes/indicadores-51-55/apply-progress.md` (~94, con esta línea) = **~317 líneas**, bajo el techo de 800 (y bajo los 720 de aviso). Sin binarios. El `git diff` ya incluye las 40 líneas de `tasks.md`.
