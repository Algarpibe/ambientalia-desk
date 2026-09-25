# Apply progress — `blueprint-equipo-nuevo` (F1B-06, primer cambio, `cierra: no`)

**Fase:** `sdd-apply`, LOTE 1 (Fases 1-5 de `tasks.md`) · **Base:** `44ce003` · **Modo:** Strict TDD ·
**Alcance:** `packages/shared` (estados.ts, transitions.ts catálogo, flujos.ts nuevo, guardianes de
fases/mapa) — servidor y `.tsx` quedan para el Lote 2, otro intento de ledger.

## LOTE 1 — Estado de las tareas

### Fase 1 · Registro de estados — `Verificación` en `CLASIFICACION_EN_ESPERA`

- [x] 1.1 RED en `estados.test.ts`: 21→22 estados, `sin_clasificar` `['Pendiente']`→`['Pendiente',
  'Verificación']`, `enEsperaDe('Verificación')`. Título de la prueba de la suma (`:71`) también
  actualizado (`5+6+9+1=21`→`5+6+9+2=22`), citado en el mismo rango D5 de la tarea.
- [x] 1.2 GREEN — `estados.ts:105` (hoy desplazada +4 por el bloque nuevo): añadida `'Verificación':
  'sin_clasificar',` tras `'Pendiente'`; encabezado del bloque reescrito a «sin clasificar (2)».
- [x] 1.3 GREEN — «Los 21 estados» → «Los 22 estados» en el doc-comment de `ESTADOS`.
- [x] 1.4 GREEN — al final de `estados.ts`: `ESTADOS_SOLO_EQUIPO_NUEVO`, `EstadoServicio`,
  `ESTADOS_SERVICIO`, literal de `design.md` §2 D1.
- [x] 1.5 Verde confirmado (12/12 en `estados.test.ts`).
- [x] 1.6 M11 — quitar `'Verificación'` del registro. RED confirmado en `tsc`
  (`estados.ts(182,43): TS2322 Type '"Verificación"' is not assignable...`). Revertido.

### Fase 2 · Catálogo `TRANSITIONS_EQUIPO_NUEVO` + invariantes de la unión

- [x] 2.1 RED en `invariantesGrafo.test.ts`: invariantes 1-3 en línea pasan a `ESTADOS_SERVICIO`;
  bloque nuevo al final, «invariantes de la unión de catálogos (F1B-06)» — 7 pruebas: derivados(unión)
  = ESTADOS(22); 39 entradas con ids únicos; sin salida = `['Finalizado','Verificación']`; ningún
  from/to fuera del registro; `ESTADOS_SOLO_EQUIPO_NUEVO` = derivados(EN) − derivados(servicio);
  RQ-EN-01 (los 5 pares exactos + ninguna sale de `Verificación`); corrección (b) (sólo `comment()` +
  `derivado_a`).
- [x] 2.2 GREEN — `TRANSITIONS_EQUIPO_NUEVO` al final de `transitions.ts` (tras el cierre de
  `areasSiguientes`), 5 entradas, área `Servicio Técnico` (s2), campos `[comment(), derivacion()]`.
- [x] 2.3 Verde confirmado (14/14 en `invariantesGrafo.test.ts`).
- [x] 2.4 M3 — `from: ['Revisión']` en `ingreso_equipo_nuevo`. RED en invariantes 1 y 4 de la unión (y
  en dos pruebas más: derivación de `ESTADOS_SOLO_EQUIPO_NUEVO` y RQ-EN-01 — 4 pruebas caídas en
  total, superconjunto de lo exigido). Revertido.
- [x] 2.5 M4 — sexta entrada sintética `from: ['Verificación']`. RED en «sin salida de la unión» y en
  RQ-EN-01 («ninguna sale de Verificación»). Revertido.
- [x] 2.6 M5 — id de `ingreso_equipo_nuevo` renombrado a `ingreso_a_servicio` (colisión). RED en «ids
  únicos en la unión» y en RQ-EN-01 (par distinto). Revertido.
- [x] 2.7 M11 confirmación cruzada — repetida la mutación de 1.6 con el invariante de la unión ya
  existiendo. RED simultáneo confirmado: `tsc` (mismo error TS2322) **y** el invariante 1 de la unión
  (`estados derivados de la unión son exactamente ESTADOS (22)` — recibido 21, esperado 22), más los
  invariantes 3 y 4 de la unión también en rojo (superconjunto). Revertido.

### Fase 3 · Registro de flujos `flujos.ts` (fichero nuevo)

- [x] 3.1 RED en `flujos.test.ts` (25 pruebas): normalización (M6), enrutado (RQ-EN-04, con
  triangulación en dos estados del catálogo), corrección (a) RQ-TC-10 (Soporte remoto siempre
  servicio), heredados (M7, s5), `transicionPorId`/`flujoDeTransicion` en los dos catálogos,
  `fueraDeFlujo` (null cuando pertenece, mensaje con los dos flujos cuando no — en los dos sentidos),
  RQ-EN-07 tablero (`columnForStatus('Verificación') === 'otros'`, con contraste de un estado con
  columna propia).
  **Desviación declarada, no resuelta en silencio:** la bullet de 3.1 «`areasSiguientes` con catálogo
  inyectado (verificar la firma nueva de `transitions.ts:327`, Fase 7)» depende de la firma
  `areasSiguientes(estado, transiciones = TRANSITIONS)` que la tarea 7.2 introduce en el **Lote 2**
  (Fase 7). Escribirla ahora habría exigido adelantar esa firma fuera de su fase, o fabricar una
  prueba contra una API que no existe todavía. Se deja fuera de `flujos.test.ts` y se añadirá en su
  lugar natural — la prueba de `avisoArea.ts`/`transitions.ts:327` de la Fase 7 — sin tocar el alcance
  del Lote 1. El resto de la bullet list de 3.1 (10 de 11 puntos) sí está cubierto.
- [x] 3.2 GREEN — `flujos.ts` (fichero nuevo): `Flujo`, `CATALOGO_POR_FLUJO`,
  `esClasificacionEquipoNuevo`, `flujoDelTicket`, `catalogoDelTicket`, `transicionesDelTicket`,
  `transicionPorId`, `flujoDeTransicion`, `fueraDeFlujo` — superficie exacta de `design.md` §2 D2.
- [x] 3.3 GREEN — `index.ts`: `export * from './flujos'` al final.
- [x] 3.4 Verde confirmado (25/25 en `flujos.test.ts`).
- [x] 3.5 M6 — igualdad estricta sin normalizar. RED en «Equipo Nuevo» (Zoho, mayúscula) — 7 pruebas
  caídas (superconjunto: toda prueba que depende de reconocer la clasificación). Revertido.
- [x] 3.6 M7 — quitada la condición de estado de `flujoDelTicket`. RED en las dos pruebas de heredados
  (M7, s5). Revertido.

### Fase 4 · `EstadoServicio`/`ESTADOS_SERVICIO` en fases y mapa

- [x] 4.1 Regresión natural confirmada SIN mutación aparte: `tsc` fallaba en `fasesBlueprint.ts:68`
  (`TS1360`, falta la clave `'Verificación'`) y `fasesBlueprint.test.ts:14` en rojo (21 claves ≠ 22 de
  `ESTADOS`) — heredado de la Fase 1, tal como predice la tarea.
- [x] 4.2 GREEN — `fasesBlueprint.ts:11` → `import type { EstadoServicio }`; `:68` →
  `satisfies Record<EstadoServicio, FaseId>`.
- [x] 4.3 Corrección (f) parte 1 — comentario de `:29` reescrito a `Record<EstadoServicio, FaseId>`.
- [x] 4.4 GREEN — `fasesBlueprint.test.ts`: import cambiado a `ESTADOS_SERVICIO` (se comprobó que
  `ESTADOS` ya no se usaba en el fichero tras el cambio de `:14` y se retiró del import, sin dejar
  import muerto); `:14` → `ESTADOS_SERVICIO`.
- [x] 4.5 GREEN — `mapaBlueprint.test.ts`: import y `:17`/`:113` → `ESTADOS_SERVICIO` (mismo criterio:
  `ESTADOS` sin otros usos en el fichero, retirado del import).
- [x] 4.6 GREEN — `scripts/generar-mapa-blueprint.ts:18`/`:31` → `ESTADOS_SERVICIO`.
- [x] 4.7 Verde confirmado: `tsc -b` limpio; `fasesBlueprint.test.ts` 5/5; `mapaBlueprint.test.ts`
  14/14 (incluye el anti-desfase RQ-MB-06 sin regenerar `docs/artefactos/`, como predice `design.md`).
- [x] 4.8 M12 — `ESTADOS_SERVICIO` mutado para incluir `Verificación` (`ESTADOS as EstadoServicio[]`,
  bypass del tipo). RED confirmado: NO en `tsc` (la mutación es un cast, no cambia el tipo declarado
  de `fasesBlueprint.ts`) sino en el runtime — anti-desfase RQ-MB-06 y 13/14 pruebas de
  `mapaBlueprint.test.ts` en rojo, con el mensaje exacto previsto por `design.md`: «el estado
  "Verificación" no tiene fase asignada en `FASE_POR_ESTADO`». Cubre la rama documentada como
  alternativa en `tasks.md` («o el anti-desfase RQ-MB-06 se pone rojo»). Revertido.

### Fase 5 · Cierre de calidad e intento del Lote 1

- [x] 5.1 `npm test`: **142 ficheros pasados, 1 omitido por diseño (`migrate.integration.test.ts`,
  requiere Postgres real) · 1422 pruebas en verde, 2 omitidas**.
- [x] 5.2 `npm run typecheck`: verde (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin
  salida).
- [x] 5.3 `npm run lint`: **0 errores, 165 warnings** — coincide exactamente con el techo preexistente
  citado en `design.md` D3 (`eslint.config.js:15`); **0 avisos nuevos** introducidos por este lote.
- [x] 5.4 `npm run build`: verde (`tsc -b && vite build`, 112 módulos, sin error).
- [x] 5.5 `git add -N` de los ficheros nuevos del Lote 1: `packages/shared/src/flujos.ts`,
  `packages/shared/src/flujos.test.ts` y `openspec/changes/blueprint-equipo-nuevo/apply-progress.md`
  (medida E-078). Ningún otro fichero nuevo sin trackear resultó de las Fases 1-4.
- [x] 5.6 Medida real — ver tabla abajo.
- [ ] 5.7 Commit del Lote 1 — **lo hace el orquestador**, fuera de este intento.

## Medida real (5.6) — `git diff --shortstat --no-renames 44ce003`

Medida en dos tiempos, porque marcar `[x]` en `tasks.md` (obligatorio, esta misma fase) ocurre
DESPUÉS de escribir el contenido de `apply-progress.md` — así que se remide al cierre para no dejar
una cifra obsoleta (regla de método: verificado contra el árbol, no de memoria).

Con los tres ficheros nuevos ya indexados (`git add -N`) y `tasks.md` con las 34 casillas del Lote 1
marcadas:

```
13 files changed, 618 insertions(+), 56 deletions(-)
```

**674 líneas cambiadas** (618 + 56) contra la estimación de `tasks.md` de **~615** — diferencia de 59
líneas (9,6%), explicada casi por completo por el propio `apply-progress.md` (documento largo,
estimado ~120, terminó más extenso con las tablas de evidencia) y por las 34 casillas de `tasks.md`
(cada una cuenta como 1 borrado + 1 inserción = 68 líneas). El código de producción y de prueba
(Fases 1-4) quedó por debajo de lo estimado. Bajo el techo real del ledger (800 por intento,
`openspec/config.yaml:22-30`), con **126 líneas de margen**. Ningún fichero fuera de
`packages/shared`, `scripts/` y `openspec/changes/blueprint-equipo-nuevo/` cambió.

## Ficheros tocados en el Lote 1

| Fichero | Acción |
|---|---|
| `packages/shared/src/estados.ts` | Modificado — Fase 1 |
| `packages/shared/src/estados.test.ts` | Modificado — Fase 1 |
| `packages/shared/src/transitions.ts` | Modificado — Fase 2 (catálogo al final) |
| `packages/shared/src/invariantesGrafo.test.ts` | Modificado — Fase 2 |
| `packages/shared/src/flujos.ts` | **Nuevo** — Fase 3 |
| `packages/shared/src/flujos.test.ts` | **Nuevo** — Fase 3 |
| `packages/shared/src/index.ts` | Modificado — Fase 3 |
| `packages/shared/src/fasesBlueprint.ts` | Modificado — Fase 4 |
| `packages/shared/src/fasesBlueprint.test.ts` | Modificado — Fase 4 |
| `packages/shared/src/mapaBlueprint.test.ts` | Modificado — Fase 4 |
| `scripts/generar-mapa-blueprint.ts` | Modificado — Fase 4 |
| `openspec/changes/blueprint-equipo-nuevo/apply-progress.md` | **Nuevo** — este documento |

Ningún fichero de `apps/desk/server` ni `.tsx` fue tocado: alcance del Lote 2 respetado.

## TDD Cycle Evidence

| Tarea | Fichero de prueba | Capa | Red de seguridad | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1-1.6 | `estados.test.ts` | Unit | ✅ 12/12 (baseline) | ✅ Escrito | ✅ 12/12 | ✅ 2 casos (Pendiente + Verificación) | ➖ No hace falta |
| 2.1-2.7 | `invariantesGrafo.test.ts` | Unit | ✅ 7/7 (baseline) | ✅ Escrito | ✅ 14/14 | ✅ 7 pruebas nuevas cubren invariantes 1/3/4/ids/derivación/RQ-EN-01/campos | ➖ No hace falta |
| 3.1-3.6 | `flujos.test.ts` (nuevo) | Unit | N/A (nuevo) | ✅ Escrito | ✅ 25/25 | ✅ 25 casos, múltiples por función | ➖ No hace falta |
| 4.1-4.8 | `fasesBlueprint.test.ts`, `mapaBlueprint.test.ts` | Unit | ✅ 5/5 + 14/14 (baseline) | ✅ Regresión natural de la Fase 1 (sin mutación aparte) | ✅ 5/5 + 14/14 | ➖ Cobertura ya existente (RQ-MB-04/06) | ➖ No hace falta |

### Test Summary

- **Total de pruebas nuevas escritas**: 25 (`flujos.test.ts`) + 7 (bloque de la unión en
  `invariantesGrafo.test.ts`) = **32 pruebas nuevas**.
- **Pruebas existentes modificadas** (mismo comportamiento, nuevo valor esperado): 2 en
  `estados.test.ts`, 3 en `invariantesGrafo.test.ts` (en línea), 2 en `fasesBlueprint.test.ts`, 3 en
  `mapaBlueprint.test.ts` = 10.
- **Total de pruebas pasando tras el Lote 1**: 70 en los 5 ficheros del lote (12+14+25+5+14);
  1422 en el repositorio completo.
- **Capas usadas**: Unit (70). Sin integración/E2E — dominio puro, sin `fs`/red/DB (Fase 1-4 son
  `packages/shared`).
- **Pruebas de aprobación** (refactor): ninguna — no hay tareas de refactor de comportamiento
  existente en el Lote 1, sólo extensión aditiva y cambio de tipo.
- **Funciones puras creadas**: 8 (`esClasificacionEquipoNuevo`, `flujoDelTicket`, `catalogoDelTicket`,
  `transicionesDelTicket`, `transicionPorId`, `flujoDeTransicion`, `fueraDeFlujo`, `normalizar`
  interna).

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de prueba focalizado y resultado exacto | `npx vitest run packages/shared/src/flujos.test.ts packages/shared/src/invariantesGrafo.test.ts packages/shared/src/estados.test.ts packages/shared/src/fasesBlueprint.test.ts packages/shared/src/mapaBlueprint.test.ts` → 5 ficheros, **70/70 pruebas en verde** |
| Comando/escenario de arnés de runtime y resultado exacto | N/A — el Lote 1 es dominio puro en `packages/shared` (sin `fs`, sin red, sin base de datos); no hay frontera de runtime que cruzar. El arnés real (`appHarness.ts`, pg-mem) es del Lote 2 (Fase 6 en adelante) |
| Límite de reversión | `git revert` del commit del Lote 1: el catálogo `TRANSITIONS_EQUIPO_NUEVO`, `flujos.ts` y `ESTADOS_SERVICIO` son aditivos, sin migración ni datos; revertir deja `ESTADOS`/`TRANSITIONS`/`fasesBlueprint.ts`/`mapaBlueprint.ts` exactamente como en `44ce003`. No hay ningún cambio de servidor ni de cliente en este lote que revertir aparte |

## Riesgos / desviaciones frente a `design.md`/`tasks.md`

1. **Desviación declarada (no silenciosa)**: la prueba de `areasSiguientes` con catálogo inyectado
   (bullet de 3.1) se difiere a la Fase 7 (Lote 2), por la razón técnica ya explicada arriba (la firma
   nueva de `areasSiguientes` no existe hasta esa fase). No afecta a ningún criterio de aceptación del
   Lote 1: las 5 bullets restantes de 3.1 que sí dependían sólo de Fases 1-3 están cubiertas.
2. **Ninguna inserción resultó inviable.** Las tres inserciones «al final o en línea» que predicen
   `tasks.md`/`design.md` (catálogo tras `:334` de `transitions.ts`; bloque tras `:173` de
   `estados.ts`; `flujos.ts` como fichero nuevo) se cumplieron literalmente — no hizo falta desviarse
   de los puntos de inserción previstos ni medir desplazamiento de citas en este lote (el barrido
   completo de citas es la Fase 14, común a los dos lotes, fuera de este intento).
3. **Título de prueba actualizado por precisión, no citado literalmente en `tasks.md`**: el título de
   `estados.test.ts:71` («5 + 6 + 9 + 1 = 21…») se reescribió a «…2 = 22…» porque quedaba dentro del
   mismo rango D5 citado por la tarea 1.1 (`:71`) y su cuerpo depende de `ESTADOS.length` — dejar el
   título con el número viejo habría sido una afirmación falsa en el propio fichero de pruebas.
4. **Ningún guardián de servidor se rompió**: las pruebas de `apps/desk/server` (`avisoArea.test.ts`,
   `equipoNuevo.test.ts`, etc.) ya estaban en verde ANTES de este lote y siguen en verde después —
   ninguna depende de `ESTADOS`/`TRANSITIONS_EQUIPO_NUEVO` con el número viejo de estados. No hace
   falta ninguna dependencia hacia el Lote 2 por este motivo.
5. **F1A-03 sigue pendiente** (riesgo ya registrado en `proposal.md`/`tasks.md`): `Verificación` queda
   sin transición de salida hasta esa tanda. No se despliega este cambio a producción antes de F1A-03
   (repetido aquí, la condición vive completa en `tasks.md`, sección «Condición de despliegue»).

## Fase 14 (barrido de citas) — NO ejecutada en este intento

Es común a los dos lotes y corre tras el commit del Lote 2, según `tasks.md`. No se toca aquí.

### Corrección del orquestador al Lote 1 (2026-09-25)

El lote insertó `Verificación` en `packages/shared/src/estados.ts` con tres líneas nuevas (dos de comentario y la
entrada) detrás de `'Pendiente'`, contra el diseño, que la ponía EN LÍNEA en `:105`. Eso desplazaba +3 todo lo que
seguía, y 30 citas vivas a `estados.ts` de la línea 106 en adelante. No se declaró como desviación. El orquestador
la puso en la misma línea que `'Pendiente'`, con el comentario al final: `estados.ts` vuelve a cambiar sólo en
`:101`, `:105` y `:111` más lo añadido al final. `npm test` 1422 pasadas, `typecheck` 0, `lint` 0 errores y 165
avisos, re-ejecutados después de la corrección.
