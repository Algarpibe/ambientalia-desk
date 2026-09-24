# Diseño: RQ-RC-07 declara cinco reglas de lectura, con la (e)

**Base `b5676a5` · cambio `rq-rc-07-regla-e` · talla XS**

## Enfoque técnico

Sólo se tocan dos ficheros: la delta spec de `reconciliacion` (`RQ-RC-07`, cinco reglas) y
`apps/desk/server/reconciliacion/registro.test.ts:47-63`. El registro (`openspec/config.yaml:2826-2859`)
ya trae `a`-`e` y es la fuente; la prueba y la spec se alinean con él. **Delta neta de líneas en
`registro.test.ts`: 0.**

## Decisiones

| # | Decisión | Alternativa rechazada | Porqué |
|---|---|---|---|
| D1 | `:49` exige `['a','b','c','d','e']`; título de `:47` pasa de «CUATRO» a «CINCO»; título de `:48` nombra `a`-`e` | Dejar el título | Un título que dice cuatro sobre una lista de cinco es una afirmación falsa en un fichero que sí se lee |
| D2 | M3 (`:60`) acota el lookahead: `/^ {4}- id: d$[\s\S]*?(?=^ {4}- id: \|^ {2}[a-z_]+:)/m`. Expectativas: `not.toEqual(['a','b','c','d','e'])` y `toEqual(['a','b','c','e'])` | Borrar hasta `trazabilidad:` y esperar `['a','b','c']` | Hoy la regex llega a `config.yaml:2860` y borra (d) **y** (e): el control pasa, pero por la razón equivocada — no discrimina «falta la (d)» de «faltan la (d) y todo lo siguiente». Regla de mutación 2: se ensucia una COPIA del fichero vigilado con exactamente el desvío que se quiere cazar, y sólo ese |
| D3 | La alternativa `^ {2}[a-z_]+:` se conserva en el lookahead | Sólo `^ {4}- id: ` | Si algún día (d) vuelve a ser la última regla, la regex sin esa alternativa llegaría al final del fichero |
| D4 | **NO** se añade el control de texto «No existe «cuenta en parte»» | Añadir `expect(texto).toContain(...)` en `:52-57` | Es barato, pero suma ≥1 línea y desplaza citas externas a este fichero (`registro.test.ts:96`, `:101`, `:108` en `openspec/changes/archive/2026-09-20-F0-05/verify-report.md:171` y `archive/2026-09-22-generador-mapa-blueprint/apply-progress.md:131`, `:373`), lo que obliga al barrido de la regla de mutación 4. Lo que protege —que el id `e` sea la regla de «un solo `tanda:`»— es un riesgo bajo: el texto es decisión de Gerencia y sólo cambia con otra decisión. Queda como seguimiento opcional |

**Nota de remediación (post-verify, sin renumerar D4).** El `verify` marcó `fail` con 2 CRITICAL:
los dos escenarios de texto de (d) y (e) —«un cierre por dictamen se distingue de uno por
trabajo» y «un cambio... lleva un único `tanda:`»— no tenían ningún test que los cubriera, y la
regla de este skill para spec scenarios es incondicional (sin excepción de verificación manual
declarada en `config.yaml`). D4 seguía siendo la decisión correcta para su alternativa original
—insertar el control DENTRO del `describe` de `:47-63`, entre `:52` y `:57`, sí desplaza `:96`,
`:101` y `:108`—, así que el CRITICAL no lo cierra revirtiendo D4: se añade un `describe` **nuevo,
al final del fichero** (después de la línea 123, que es exactamente lo que D4 quería evitar). Esa
posición dejó las líneas 1-123 byte a byte iguales — confirmado con `git diff` y con la lectura
directa de `:96`/`:101`/`:108` tras el cambio — así que las citas externas ancladas siguen
apuntando a lo mismo que apuntaban. El control de texto que D4 dejó como «seguimiento opcional»
queda hecho, sin el coste que D4 quería evitar.

## Flujo de datos

    config.yaml (real) ──readFileSync──→ idsDeReglasDeLectura ──→ ['a'..'e']      (:49)
    config.yaml (copia) ──replace M3───→ idsDeReglasDeLectura ──→ ['a','b','c','e'] (:62)

## Ficheros

| Fichero | Acción | Qué |
|---|---|---|
| `apps/desk/server/reconciliacion/registro.test.ts` | Modificar | `:47`, `:48`, `:49`, `:60`, `:61`, `:62`; misma cuenta de líneas |
| `openspec/changes/rq-rc-07-regla-e/specs/reconciliacion/spec.md` | Crear | Delta `MODIFIED RQ-RC-07` (fase spec) |

**No se tocan:** `openspec/config.yaml`, `apps/desk/server/reconciliacion/comprobaciones.ts`, el núcleo,
`idsDeReglasDeLectura` (`:24-39`, ya lee cualquier número de ids). Nada fuera de estos dos ficheros.

## Estrategia de prueba (strict TDD)

Comando: `npx vitest run apps/desk/server/reconciliacion/registro.test.ts`.

1. **Estado de partida.** `:49` está ROJA (espera cuatro, hay cinco). M3 está VERDE, y en falso: espera
   `['a','b','c']` porque la regex borra (d) y (e).
2. **Paso de `:49`.** Se cambia la expectativa a cinco → verde. No es un rojo nuevo: el rojo ya existía
   en main desde `be78ef9`; este paso sólo lo apaga.
3. **Rojo real de M3.** Se cambia SÓLO la expectativa de `:62` a `['a','b','c','e']` (y `:61` a la lista de
   cinco), con la regex SIN acotar → **rojo** (`expected ['a','b','c'] to equal ['a','b','c','e']`). Se
   registra la salida.
4. **Verde.** Se acota la regex (D2) → verde. `npm test` completo en verde.
5. **Mutación de posición del lookahead** (regla de mutación 1 aplicada a la regex): quitar la alternativa
   `^ {4}- id: ` vuelve a dar rojo en `:62`. Es el mismo experimento del paso 3 en sentido inverso; se
   anota, no se añade prueba.

## Matriz de amenazas

N/A — sin enrutado, shell, subprocesos, automatización VCS/PR, clasificación de ejecutables ni integración
de procesos.

## Migración

No requiere migración.

## Preguntas abiertas

- Ninguna bloqueante.
