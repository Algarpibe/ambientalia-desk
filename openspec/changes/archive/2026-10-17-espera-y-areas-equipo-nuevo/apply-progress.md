# Progreso del apply — `espera-y-areas-equipo-nuevo` (F1B-09, `cierra: no`)

Un intento, techo 800, partida `5b98440`.

## Rojo antes del verde

- `5b98440` (planificación): siete pruebas en rojo contra el registro de entonces — cinco de `estados.test.ts`, la de
  `Pendiente` de `esperaE226.test.ts` y la de `esperasContraRegistro.test.ts` (`esperasDelCodigo` no se exportaba). Las
  de `Verificación` y `Solicitud Soporte` en «Abiertos» ya pasaban: son de caracterización.
- Paso 2.1, sólo el dato (`estados.ts:101-105`): las siete pasan a verde y el caso (f) de `comentariosVigilados.test.ts`
  se pone ROJO («estados.ts:21 debe decir «12 estados — LO QUE DECLARA»»). Pasos 2.2-2.4: verde.

## Lo hecho

| Fichero | Qué | Líneas |
|---|---|---|
| `packages/shared/src/estados.ts` | `:101-105` el dato y su comentario; `:21`, `:28`, `:60`, `:88`, `:115` en sitio | 190 → 190 |
| `packages/shared/src/transitions.ts` | `:347-348`, docblock sin s2 | 397 → 397 |
| `apps/desk/server/reconciliacion/comprobaciones.ts` | `:154`, `export` | 434 → 434 |
| `packages/shared/src/sla.test.ts` | `:45`, `:49`, `:51`, la cita de `estados.ts:28` | 331 → 331 |
| `packages/shared/src/invariantesGrafo.test.ts` | `:215`, mensaje (E-226) | 329 → 329 |
| `apps/desk/server/permisos.test.ts`, `apps/desk/server/services/avisoArea.test.ts` | `:212` y `:43`, comentarios | 461 → 461 · 111 → 111 |

## Mutaciones (D4), todas restauradas

| # | Resultado |
|---|---|
| M0 control | 51 de 51 en verde |
| M1 comentario tras `Pendiente` | rojo SÓLO `esperasContraRegistro.test.ts`: el resto de la red no lo ve |
| M2 `Pendiente` `sin_clasificar` | rojo: 3 de `estados.test.ts` y la de `esperaE226.test.ts` |
| M3 `Verificación` `externa` | rojo: 4 de `estados.test.ts` y `esperaE226.test.ts` |
| M4 `Solicitud Soporte` `interna` | rojo: 5 de `estados.test.ts` y `esperaE226.test.ts` |
| M5 `liberacion` `Comercial` | rojo: `invariantesGrafo.test.ts`, corrección (b) |
| M6 `estados.ts:115` «ONCE» | rojo: `comentariosVigilados.test.ts` (f) |
| M7 `Pendiente` `interna` | rojo: 3 de `estados.test.ts` |

## Cierre del intento

Códigos en el árbol del commit: test 0 (286 ficheros, 4.792 pruebas, 11 omitidas), typecheck 0, lint 0 (165 avisos, los
de la partida). Build: `index-8KPDmeiY.js`, 416,67 kB.
