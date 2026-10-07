# Progreso de apply — accesorios-lista-por-modelo (F1B-04, cierra: no)

## Lote 1a · módulo de reglas en `shared` (hecho; commit, detector y asiento los hace el orquestador)

Commit de partida: `0e8ea70`. `wc -l packages/shared/src/index.ts`: 38 antes, 39 después (una línea nueva al final; ninguna anterior se movió, `git diff` lo confirma).

### Rojo (1a.2 a 1a.4)
- `npx vitest run packages/shared/src/accesoriosLista.test.ts` con la prueba escrita y sin módulo: `Failed to load url ./accesoriosLista ... Does the file exist?`, `Test Files 1 failed`, `Tests no tests`. Rojo por la razón prevista (módulo inexistente).

### Verde (1a.5, 1a.6)
- Tras crear `packages/shared/src/accesoriosLista.ts` y la exportación: `Test Files 1 passed (1)`, `Tests 56 passed (56)`.

### Mutaciones (1a.7 a 1a.9), cada una restaurada y comprobada con `cmp` contra la copia previa
| Mutación | Resultado |
|---|---|
| M3: quitar `if (actual.clase === CLASE_ACCESORIO) return null` de `motivoCambioAAccesorio` | ROJO: 1 falla, «la fila que YA es accesorio da null aunque no tenga itemId» |
| M9a: quitar `vistos.has(a.nombre)` (sin dedupe) en `detalleDeAccesorios` | ROJO: 1 falla, «deduplica por nombre exacto y gana la primera aparición» |
| M9b: SKU tomado de otro campo (`codigo`) | ROJO: 3 fallas (SKU en el orden de entrada, dedupe con SKU, duplicado de otra clase) |
| `puedeAnadirAccesorios` siempre `true` | ROJO: 4 fallas (técnico sin el cargo, sin cargo alguno, DT de otra área, sujeto ausente) |

Nota: el primer intento de M3 no se aplicó (el patrón no casaba por el CRLF del fichero) y por eso no dio rojo; se repitió con `\r\n` y sí. Ninguna mutación sobrevivió.

### Cierre (1a.10, 1a.11)
- `npm test`: exit 0, 249 ficheros pasan y 2 saltados, 3924 pruebas pasan y 7 saltadas.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, 165 problemas (0 errores, 165 avisos).
- Medida: `git diff --shortstat --no-renames 0e8ea70` = 1 fichero, 1 inserción; más `wc -l` de lo nuevo sin trackear: `accesoriosLista.ts` 80, `accesoriosLista.test.ts` 132. Total de código del lote: 213 (válvula 720).
- Barrido de citas (1a.12): todas las citas `shared/src/index.ts:N` del repositorio fuera de este cambio apuntan a líneas 3 a 38; sólo se añadió la 39 al final, así que ninguna se desplazó y la 38 sigue siendo `export * from './reasignacion'`.

### Desviaciones respecto al diseño
- Ninguna en las firmas de D1. Detalle de implementación: `CLASES_TEXTO_LIBRE` se calcula con `CLASES_ARTICULO.filter`; `sku` vacío o ausente sale `null` con `a.sku || null`.
- «Sujeto ausente» en la matriz de `puedeAnadirAccesorios`: `puedeMantenerNovedades(undefined)` lanza `TypeError` (no devuelve `false`); la prueba fija que `puedeAnadirAccesorios` se comporta igual (no abre el permiso), sin añadir una guarda que el diseño no pide.
