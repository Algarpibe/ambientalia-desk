---
tanda: fuera-del-plan
motivo: "Realinear RQ-RC-07 y su prueba con la regla (e) de unidad_de_avance, que entró por la decisión de Gerencia decision/e001-por-entregar del 24/09; main está roja desde be78ef9"
capacidad: [reconciliacion]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: RQ-RC-07 declara cinco reglas de lectura, con la (e)

**Base `b5676a5` (rama `main`) · cambio `rq-rc-07-regla-e` · talla XS**

## Intención

- `openspec/config.yaml:2849-2859` ya contiene la regla (e) —«Un cambio lleva UN SOLO `tanda:`»—, decisión de Gerencia `decision/e001-por-entregar` (`openspec/config.yaml:2496`).
- `RQ-RC-07` (`openspec/specs/reconciliacion/spec.md:225-240`) sigue diciendo que `unidad_de_avance` gana una **cuarta** regla, y `apps/desk/server/reconciliacion/registro.test.ts:49` exige `['a','b','c','d']`. La prueba falla y main está roja en CI desde `be78ef9`.
- Éxito: la spec y la prueba describen lo que el registro ya dice.

## Alcance

### Dentro
- Delta spec de `reconciliacion` que MODIFICA `RQ-RC-07`: **cinco** reglas (a-e), conserva la (d) y su porqué, y cita el origen de la (e) (`decision/e001-por-entregar`, 2026-09-24).
- `apps/desk/server/reconciliacion/registro.test.ts:47-64`: expectativa `['a','b','c','d','e']`; M3 acotada para borrar sólo la (d) y esperar `['a','b','c','e']`.

### Fuera
- `openspec/config.yaml`: la regla (e) ya está y es decisión de Gerencia.
- `apps/desk/server/reconciliacion/comprobaciones.ts` y el núcleo: `grep` de `reglas_de_lectura|unidad_de_avance` en `*.ts` sólo aparece en `registro.test.ts:23`, `:26` y `:47`; ningún código lee el número de reglas.
- Aplicar la regla (e) a `por-entregar-es-espera` (`openspec/config.yaml:2858-2859`): es otra sesión.

## Capacidades

### Nuevas
- Ninguna.

### Modificadas
- `reconciliacion`: `RQ-RC-07` pasa de «cuarta regla» a «cinco reglas (a-e)».

## Enfoque

Delta spec + ajuste de la prueba bajo `strict_tdd`: primero la prueba exige `['a','b','c','d','e']` (hoy ya pasaría contra el registro; el rojo real es el de M3, ver riesgos) y la mutación acotada; luego la spec.

## Áreas afectadas

| Área | Impacto | Descripción |
|---|---|---|
| `openspec/changes/rq-rc-07-regla-e/specs/reconciliacion/spec.md` | Nuevo | Delta de `RQ-RC-07` |
| `apps/desk/server/reconciliacion/registro.test.ts` | Modificado | Expectativa y M3 |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| M3 (`registro.test.ts:60`) borra con `/^ {4}- id: d$[\s\S]*?(?=^ {2}[a-z_]+:)/m`, que llega hasta `trazabilidad:` (`openspec/config.yaml:2860`): con (e) presente borra (d) **y** (e) | Alta (verificado) | Acotar la regex al siguiente `    - id:`; esperar `['a','b','c','e']` |
| Las cuatro citas de `RQ-RC-07` al registro, ancladas en `ce93480`, se renumeran por error | Media | Son caso B de la regla de mutación 4: se conservan con su revisión |
| El título del `describe` (`:47`, «CUATRO») queda desalineado | Baja | Se actualiza en la misma tanda |

## Rollback

`git revert` del commit: devuelve spec y prueba al estado de `b5676a5` (que ya está rojo; revertir no rompe nada nuevo).

## Dependencias

- Ninguna.

## Criterios de éxito

- [ ] `npm test` en verde, con `registro.test.ts` exigiendo `['a','b','c','d','e']`.
- [ ] M3 borra sólo la (d) y exige `['a','b','c','e']`.
- [ ] `RQ-RC-07` declara cinco reglas y cita `decision/e001-por-entregar`.
- [ ] CI de main vuelve a verde.
