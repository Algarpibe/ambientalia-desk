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
   `estados.test.ts:71` en `44ce003` («5 + 6 + 9 + 1 = 21…») se reescribió a «…2 = 22…» porque quedaba dentro del
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

---

# LOTE 2 — servidor, guardianes y `.tsx` (Fases 6-14 de `tasks.md`)

Versión completa antes de condensar: Engram obs. #1070 (topic `sdd/blueprint-equipo-nuevo/apply-progress`). Medido antes de condensar: 929 líneas reales (427 de código y pruebas, 385 de informe, 116 de casillas).

**Fase:** `sdd-apply`, LOTE 2 · **Base:** `0ca870b` (cierre del Lote 1) · **Modo:** Strict TDD ·
**Alcance:** `apps/desk/server` (guarda 3, avisos, SLA), `apps/desk/src` (`.tsx`, fuera de la red de
pruebas por F0-00), guardianes extendidos de `packages/shared`, comentarios de previsión y el barrido
de citas de la Fase 14 sobre los dos lotes.

## LOTE 2 — Estado de las tareas

Las 58 casillas de las Fases 6-14 (`tasks.md:198-390`) están marcadas `[x]`, salvo **13.7** (commit del
Lote 2) y **14.8** (`citas/cli.ts --sha HEAD`), reservadas al orquestador según el propio encargo.

### Fase 6 · Guarda 3 en `executeTransition`

- [x] 6.1 RED — `apps/desk/server/flujoEquipoNuevo.test.ts` (fichero nuevo), P1-P6. RED confirmado:
  P1 (`400` en vez de `200`), P2 (`422` en vez de `409` — el payload no llevaba los campos
  obligatorios de `ingreso_a_servicio`, así que antes de la guarda 3 el flujo caía en el `422` de
  contenido; igual de rojo, motivo distinto), P3 (`400` en vez de `409`), P6 (`400` en vez de `403`).
  P4 y P5 nacieron verdes (controles positivos: no dependen de la guarda nueva).
- [x] 6.2-6.5 GREEN — `ticketService.ts:6` (import `transicionPorId, fueraDeFlujo, catalogoDelTicket`),
  `:122` (`transicionPorId`), `:125` (segunda sentencia en la MISMA línea:
  `exigirMismoFlujo(t, current.row)`).
- [x] 6.4, desviación declarada del diseño (instrucción explícita del orquestador en el encargo): la
  guarda 3 NO quedó inline en `:125` como decía `design.md` D3 literalmente — se extrajo como función
  nombrada `exigirMismoFlujo(t, row)` al FINAL del fichero (tras el cierre de `executeTransition`,
  `:224-232`), y `:125` sólo la LLAMA en su misma línea. Cero líneas desplazadas igual: `:125` sigue
  conteniendo el `404`, y el resto del fichero (`:126` en adelante) no se movió ni un carácter de línea.
- [x] 6.6 Verde confirmado: 6/6 en `flujoEquipoNuevo.test.ts`.
- [x] 6.7 **M1** (posición) — mover la llamada DESPUÉS del bloque de estado (`:126-128`). RED
  confirmado: sólo P3 falla (`expected 'La transición "Ingreso equipo nuevo" …' not to contain 'no
  aplica desde el estado'` — el mensaje pasa a ser el de estado). P1, P2, P4, P5, P6 siguen verdes.
  Revertido.
- [x] 6.8 **M2** — quitar la llamada de `:125`. RED confirmado: P2 (`422`→ahora `422` seguía siendo el
  resultado de antes, pero el punto es que P3 SÍ cambia) y P3 fallan (P2: `expected 422 to be 409`,
  P3: mensaje de estado en vez de flujo). Revertido.

### Fase 7 · Avisos por área desde el catálogo del flujo

- [x] 7.1 RED — `avisoArea.test.ts`, catálogo SINTÉTICO (`CATALOGO_SINTETICO`, una transición desde
  `Notificado` a área `Compras`, deliberadamente distinta de las áreas de servicio desde ese estado).
  RED confirmado: `expected [ 'Servicio Técnico' ] to deeply equal [ 'Compras' ]` (el tercer parámetro
  se ignoraba).
- [x] 7.2 GREEN — `transitions.ts:327`: `areasSiguientes(estado, transiciones: readonly Transition[] =
  TRANSITIONS)` — **`readonly`, no `Transition[]` a secas** (desviación menor sobre el literal de
  `tasks.md`, exigida por `tsc`: `catalogoDelTicket` devuelve `readonly Transition[]` y un array de
  sólo lectura no es asignable a un parámetro mutable). `:329` recorre `transiciones`.
- [x] 7.3 GREEN — `avisoArea.ts:1` (import `type Transition`), `:15`/`:16` (`areasAAvisar` gana tercer
  parámetro opcional `catalogo?: readonly Transition[]`, mismo motivo `readonly`).
- [x] 7.4 GREEN — `ticketService.ts:196`: `catalogoDelTicket({ classification: current.row.classification,
  status: t.to })` como tercer argumento. Corrección (e) respetada: el catálogo se calcula con el
  ESTADO DE LLEGADA (`t.to`), no el de origen.
- [x] 7.5 Verde confirmado: 8/8 en `avisoArea.test.ts`; 6/6 en `flujoEquipoNuevo.test.ts` (sin
  regresión); 9/9 en `permissions.test.ts`.
- [x] 7.6 **M13 — confirmado NO detectable con datos reales**, tal como predice `tasks.md`. Quitado el
  tercer parámetro de `:196`: `flujoEquipoNuevo.test.ts` y `avisoArea.test.ts` (las 14 pruebas de
  datos reales) siguieron en VERDE — por s2 las cinco áreas EN son `Servicio Técnico` y coinciden con
  las salidas homónimas de servicio. Lo único que detecta la mutación es la prueba UNITARIA de `7.1`
  con el catálogo sintético (que se dejó en verde, sin mutar). Revertido.

### Fase 8 · SLA de `Notificado` excluye el flujo `equipo-nuevo`

- [x] 8.1 RED — `db/sla.test.ts`, ticket `classification: 'Equipo nuevo'`, `status: 'Notificado'`, >24h.
  RED confirmado: `ticketsConSlaVencido` lo incluía (`expected [ {...t10...} ] to deeply equal []`).
- [x] 8.2-8.5 GREEN — `db/sla.ts:2` (import `flujoDelTicket`), `:45` (`SELECT … classification`), `:48`
  (tipo de fila gana `classification: string | null`), `:49` (`if (flujoDelTicket(...) !== 'servicio')
  continue` antes de `const estado = fila.status as Estado`).
- [x] 8.6 Verde confirmado: 8/8 en `db/sla.test.ts`.
- [x] 8.7 **M8** — quitado el `continue`. RED confirmado: el ticket EN en `Notificado` >24h reaparece
  (mismo fallo exacto que el RED de `8.1`). Revertido.

### Fase 9 · Panel de transiciones filtra por flujo (`.tsx`, sin RED/GREEN automático)

- [x] 9.1 `TransitionPanel.tsx:2` — import cambiado de `transitionsForStatus` a `transicionesDelTicket`.
- [x] 9.2 `:38`/`:40` — prop `clasificacion: string | null` añadida a la firma, EN LÍNEA (`:38` gana el
  parámetro en la destructuración; `:40` combina `status: string; clasificacion: string | null` en la
  misma línea para no desplazar el resto del tipo literal).
- [x] 9.3 `:56` — `transicionesDelTicket({ classification: clasificacion, status }).filter(...)`.
- [x] 9.4 `TicketDetailView.tsx:324` — `clasificacion={ticket.classification ?? null}` añadido EN LÍNEA,
  junto a `status={ticket.status}` en la misma línea (el tipo de `TicketDetail.classification` es
  `string | undefined`, de ahí el `?? null`).
- [x] 9.5 `npm run typecheck` verde para los dos ficheros (dentro del de la Fase 13.2).
- [x] 9.6 **M14 — declarada NO detectable, sin ejecución de mutación real.** `.tsx` está fuera de
  `vitest.config.ts:17-20` (F0-00, sin `jsdom`) y no hay otro consumidor programático de
  `TransitionPanel`: mutarla no daría señal. Queda cubierta por la guarda 3 del servidor (Fase 6) y por
  la comprobación Persona-1 (tabla más abajo).

### Fase 10 · Guardianes extendidos: reentrancia, escalado, ejecución, permisos

- [x] 10.1-10.2 — `reentrancia.test.ts`, dos pruebas nuevas sobre `TRANSITIONS_EQUIPO_NUEVO` (ciclo
  `Ingresado→En Proceso→Notificado`, cero campos de fecha reentrantes). **Verde de inmediato**:
  `tablaDeReentrancia`/`camposFechaReentrantes` ya eran genéricas (`tasks.md` `10.2`). 13/13 en verde.
- [x] 10.3-10.4 — `sla.test.ts` (shared), prueba nueva que recorre `CATALOGO_POR_FLUJO` sin escalado
  ambiguo. **Verde de inmediato**: las cinco entradas EN no declaran `porDefecto` de tipo `cargo`.
  16/16 en verde.
- [x] 10.5-10.6 — `transicionesEjecucion.test.ts`, bloque `CASOS_EQUIPO_NUEVO` (5 casos a mano),
  huérfanas en los dos sentidos, extremos contra el grafo EN, barrido HTTP de las 5 con
  `classification: 'Equipo nuevo'` sembrada en `t.from[0]` (corrección c). Verde de inmediato: 10/10.
- [x] 10.7-10.8 — `permisos.test.ts`, matriz 5×3 nueva (misma corrección c). Verde de inmediato: 20/20.
- [x] 10.9 **M9** — `liberacion` mutada a área `Comercial`. **Hallazgo declarado, no resuelto en
  silencio:** el total escrito a mano de LA MATRIZ NUEVA (`la matriz EN son 15 casos: 10/5`) **NO se
  puso rojo**, porque deriva `casos` dinámicamente de `t.area` (mismo patrón que el `la matriz son 102
  casos` preexistente de `permisos.test.ts`). El RED sí lo confirmaron DOS pruebas: `flujoEquipoNuevo.test.ts` P6
  (`liberacion debería responder 403 a Comercial: expected 200 to be 403` — expectativa literal, no
  derivada) y la prueba `corrección (b)` YA EXISTENTE en `invariantesGrafo.test.ts` desde el Lote 1
  (`liberacion no es de Servicio Técnico (s2): expected 'Comercial' to be 'Servicio Técnico'`). Revertido.
- [x] 10.10 **M10** — `transicionPorId` mutado en `flujos.ts` para buscar sólo en `TRANSITIONS`. RED
  confirmado en el barrido HTTP EN (`transicionesEjecucion.test.ts`): las 5 responden `400`
  («Transición desconocida») en vez de `200`. Revertido; `git diff` de `flujos.ts` queda limpio (0
  líneas) tras la reversión.

### Fase 11 · Comentarios de previsión, en su sitio

- [x] 11.1-11.4 — Reescritos EN SU SITIO, mismo número de líneas cada vez, en
  `invariantesGrafo.test.ts` (`:11-12`, `:73-74`), `reentrancia.test.ts` (`:16`, `:24-25`),
  `sla.test.ts` shared (`:165`), `transicionesEjecucion.test.ts` (`:193`, `:135-136`),
  `permisos.test.ts` (`:24-25`), `reentrancia.ts` (`:5-6`, `:91`, `:142`), `sla.ts` shared (`:83`),
  `bodegaje.ts` (`:218`), `appHarness.ts` (`:62`). Dos intentos iniciales insertaron +1 línea y se
  corrigieron antes de correr pruebas: ver desviación 4 más abajo.
- [x] 11.5 `npm test` completo tras la Fase 11: **143 ficheros, 1442 pruebas en verde, 2 omitidas**.

### Fase 12 · Corrección (f), parte 2

- [x] 12.1-12.2 — `permisos.test.ts:29-33` reescrito EN LÍNEA (mismo número de líneas, 5→5): «dos
  guardas por delante» → «TRES guardas por delante», nombrando las tres (404, 409 de flujo — guarda 3,
  Fase 6 —, 409 de estado); cita caducada `ticketService.ts:89` corregida a `ticketService.ts:130`
  (verificado con `grep -n "Tu rol no tiene permiso" ticketService.ts` → `130`).
- [x] 12.3 `npm test` en `permisos.test.ts`: 20/20 verde.

### Fase 13 · Cierre de calidad e intento del Lote 2

- [x] 13.1 `npm test`: **143 ficheros pasados, 1 omitido por diseño (`migrate.integration.test.ts`) ·
  1442 pruebas en verde, 2 omitidas.**
- [x] 13.2 `npm run typecheck`: verde (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin
  salida).
- [x] 13.3 `npm run lint`: **0 errores, 165 warnings** — idéntico al techo preexistente de `design.md`
  D3 (`eslint.config.js:15`) y a la medida del Lote 1; **0 avisos nuevos**.
- [x] 13.4 `npm run build`: verde (`tsc -b && vite build`, 112 módulos, sin error).
- [x] 13.5 `git add -N apps/desk/server/flujoEquipoNuevo.test.ts` — único fichero nuevo del Lote 2. Los
  otros cuatro sin trackear (`docs/sdd/Evidencia_Transporte_Tarea_Programada_2026-09-18.txt`,
  `docs/sdd/Parte_2026-09-18.md`, `docs/sdd/Parte_2026-09-22.md`, `docs/sdd/Parte_2026-09-24.md`) son
  previos a este intento: no se añaden.
- [x] 13.6 Medida real — ver tabla abajo.

## Medida real (13.6) — `git diff --shortstat --no-renames 0ca870b`

Con `flujoEquipoNuevo.test.ts` ya indexado (`git add -N`) y **antes** de las ediciones finales de este
documento y de `tasks.md`:

```
19 files changed, 381 insertions(+), 48 deletions(-)
```

**429 líneas cambiadas** en código y pruebas (Fases 6-12) contra la estimación de `tasks.md` de **~480**
— 51 líneas por DEBAJO (10,6%), igual que en el Lote 1.

**⚠️ MEDIDA FINAL REAL, tras marcar las 58 casillas de `tasks.md` y cerrar este documento —
`git diff --shortstat --no-renames 0ca870b` con `flujoEquipoNuevo.test.ts` indexado (`-N`):**

```
20 files changed, 797 insertions(+), 106 deletions(-)
```

**903 líneas cambiadas — SUPERA el techo real del ledger de 800 por intento
(`openspec/config.yaml:22-30`) en 103 líneas.** Se declara aquí, no se resuelve en silencio. El
desglose exacto (`git diff --stat`):

| Componente | Líneas | Nota |
|---|---|---|
| Código y pruebas (Fases 6-12) | 429 | Por debajo de la estimación (~480) |
| `apply-progress.md` (esta sección) | 360 | Muy por encima de la estimación de `tasks.md` (~80) — la evidencia exigida por el hard gate de Strict TDD (tablas RED/GREEN/TRIANGULATE, Work Unit Evidence) y el barrido explícito de citas de la Fase 14 (pedido en detalle por el propio encargo de esta fase: «declara en apply-progress CADA hunk... No lo resuelvas en silencio») son los que inflan el documento |
| `tasks.md` (58 casillas `[x]`) | 116 | 58 × (1 borrado + 1 inserción), mismo patrón que el Lote 1 |
| **Total** | **903** | **800 + 103** |

Es la lección de la regla del ciclo 2 de `CLAUDE.md`: el informe que la fase genera es un sumando
obligatorio. **Queda para el orquestador decidir** si esto exige `gentle-ai sdd-attempt reset`
(reservado a un mantenedor) u otra vía.

## Ficheros tocados en el Lote 2

- **Nuevo:** `apps/desk/server/flujoEquipoNuevo.test.ts` (Fase 6).
- **Fases 6-8:** `apps/desk/server/services/ticketService.ts` (6 y 7), `services/avisoArea.ts` y
  `avisoArea.test.ts` (7), `packages/shared/src/transitions.ts` (7, `areasSiguientes`),
  `apps/desk/server/db/sla.ts` y `db/sla.test.ts` (8).
- **Fase 9:** `apps/desk/src/components/TransitionPanel.tsx`, `TicketDetailView.tsx`.
- **Fases 10-12:** `packages/shared/src/reentrancia.test.ts`, `sla.test.ts`,
  `apps/desk/server/transicionesEjecucion.test.ts` (10 y 11), `permisos.test.ts` (10, 11 y 12).
- **Fase 11, sólo comentarios:** `invariantesGrafo.test.ts`, `reentrancia.ts`, `sla.ts`, `bodegaje.ts`
  (los cuatro en `packages/shared/src`), `apps/desk/server/testing/appHarness.ts`.
- **Documentos:** `tasks.md` (58 casillas `[x]`) y este `apply-progress.md`.

`packages/shared/src/flujos.ts` se mutó (M10) y se revirtió: `git diff` limpio, no figura.

## TDD Cycle Evidence

| Tarea | Fichero de prueba | Capa | Red de seguridad | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 6.1-6.8 | `flujoEquipoNuevo.test.ts` (nuevo) | Integración HTTP (appHarness/pg-mem) | N/A (nuevo) | ✅ 4/6 rojas (P1,P2,P3,P6); P4/P5 controles positivos | ✅ 6/6 | ✅ M1 (posición) y M2 (ausencia) confirmados por separado | ➖ No hace falta |
| 7.1-7.6 | `avisoArea.test.ts` | Unit | ✅ 5/5 (baseline) | ✅ Escrito, catálogo sintético | ✅ 8/8 | ✅ M13 confirmado NO detectable con datos reales, SÍ con catálogo sintético | ➖ No hace falta |
| 8.1-8.7 | `db/sla.test.ts` | Integración (pg-mem directo) | ✅ 7/7 (baseline) | ✅ Escrito | ✅ 8/8 | ✅ M8 confirmado | ➖ No hace falta |
| 9.1-9.6 | N/A (`.tsx`, F0-00) | — | — | — | `npm run typecheck` verde | ➖ M14 declarada, sin arnés que triangule | ➖ No hace falta |
| 10.1-10.10 | `reentrancia.test.ts`, `sla.test.ts` (shared), `transicionesEjecucion.test.ts`, `permisos.test.ts` | Unit + Integración HTTP | ✅ baseline de los 4 ficheros | ✅ 10.1/10.3 escritas; 10.5/10.7 escritas con corrección (c) | ✅ verde inmediato en 10.1-10.8 (capacidad ya implementada por Fases 6-7); M9/M10 mutados aparte | ✅ M9 (por P6 e invariantesGrafo, NO por la matriz nueva — declarado); M10 (por el barrido EN) | ➖ No hace falta |
| 11.1-11.5 | 9 ficheros, sólo comentarios | — | ✅ `npm test` 1442/1442 antes y después | N/A (edición de prosa) | ✅ `npm test` sigue verde | ➖ No aplica (cero cambio de comportamiento) | ➖ No hace falta |
| 12.1-12.3 | `permisos.test.ts` | — | ✅ 20/20 (baseline) | N/A (edición de comentario + cita) | ✅ 20/20 | ➖ No aplica | ➖ No hace falta |

### Test Summary

- **Total de pruebas nuevas escritas**: 6 (`flujoEquipoNuevo.test.ts`) + 2 (`avisoArea.test.ts`) + 1
  (`db/sla.test.ts`) + 2 (`reentrancia.test.ts`, catálogo EN) + 1 (`sla.test.ts` shared, ambigüedad de
  registro) + 3 (`transicionesEjecucion.test.ts`, bloque EN) + 5 (`permisos.test.ts`, matriz EN) =
  **20 pruebas nuevas**.
- **Total de pruebas pasando tras el Lote 2**: 143 ficheros, **1442 pruebas** en el repositorio
  completo (1422 del Lote 1 + 20 nuevas del Lote 2), 2 omitidas por diseño.
- **Capas y arnés**: Unit (reentrancia, sla shared, avisoArea); Integración HTTP con `appHarness.ts`
  (pg-mem, sin Zoho ni credenciales) en `flujoEquipoNuevo.test.ts`, `transicionesEjecucion.test.ts` y
  `permisos.test.ts`; `db/sla.test.ts` con su propia pg-mem y `migrate()` directo.

## Work Unit Evidence

- **Focalizado:** `npx vitest run apps/desk/server/flujoEquipoNuevo.test.ts apps/desk/server/db/sla.test.ts apps/desk/server/services/avisoArea.test.ts apps/desk/server/transicionesEjecucion.test.ts apps/desk/server/permisos.test.ts packages/shared/src/reentrancia.test.ts packages/shared/src/sla.test.ts` → 7 ficheros, **93/93 pruebas en verde** (6+8+8+10+20+13+16, preexistentes incluidas).
- **Arnés de runtime:** el `npm test` de 13.1. El `.tsx` queda a las comprobaciones de persona.
- **Reversión:** `git revert` del commit del Lote 2 deja `executeTransition`, `areasAAvisar`,
  `ticketsConSlaVencido` y `TransitionPanel` como en `0ca870b`; sin migración ni datos.

## Barrido de citas (Fase 14, regla de mutación 4) — sobre los dos lotes

Conclusiones, contrastadas contra `git diff --no-renames -U0 0ca870b` (hunk a hunk en la obs. #1070):

- **Ficheros de producción que cambian de número de líneas EN MEDIO: uno.** `apps/desk/server/db/sla.ts:48`
  gana **+1** (el tipo de fila con `classification`); `:49-63` se desplazan +1. Fuera de
  `openspec/changes/blueprint-equipo-nuevo/` no hay citas a `db/sla.ts` con línea.
- **`transitions.ts`** (`:327`/`:329`), **`ticketService.ts`** (`:6`, `:122`, `:125`, `:196`; `exigirMismoFlujo`
  añadida tras la `:223` original) y el resto de ficheros de producción y `.tsx` (sin citas externas a `TransitionPanel.tsx:56-58`): sustituciones en línea o
  añadidos al final. **`estados.ts`**: no tocado en el Lote 2. **0 citas desplazadas** en ellos, también en
  forma abreviada.
- **Pruebas que ganan +1 en cabecera** (import nuevo): `apps/desk/server/services/avisoArea.test.ts:2` y
  `packages/shared/src/sla.test.ts:5`; el resto de bloques de prueba nuevos van antes del cierre final del
  fichero. Citas externas a esos dos ficheros con línea, **no comprobadas contra su contenido en este
  intento** (hipótesis: desplazadas +1): `openspec/specs/derivacion-avisos/spec.md:119` y `:139`
  (`avisoArea.test.ts:28`, `:18`), `openspec/specs/transitions-st/spec.md:474`, `:733`, `:743`
  (`sla.test.ts:50-54`), `docs/sdd/Paquete_de_Despliegue_2026-09-10.md:321` (`sla.test.ts:41-53`, registro
  fechado, Caso B probable). Quedan para la Fase 14.8 / el orquestador.
- **Caso A releído y cierto:** `ticketService.ts:125` (`contratoErrores.test.ts:18`),
  `ticketService.ts:132`/`:134` (`CLAUDE.md:363`, `config.yaml:474`), `ticketService.ts:41`, `:61-79`, `:86`,
  `:89`, `:130`, `:150` (todas antes de la 114, o ya corregida en la Fase 12), `transitions.ts:327-334`
  (`derivacion-avisos/spec.md:110`).
- **Imprecisión PREEXISTENTE, no editada:** `ticketService.ts:123-125` en `transitions-st/spec.md:33`, `:975`
  y `derivacion-avisos/spec.md:212` cubre «transición desconocida» + «ticket existe», no el permiso
  (`:129-131`) ni la llamada a n8n (`:167-183`); `design.md` §D3 ya la señalaba. Es trabajo de fusión de
  delta, no de este lote.
- **«21 estados» (14.5, 32 ficheros fuera de `archive/`):** en `packages/shared/src` todas correctas
  (`estados.test.ts:15` 22; `fasesBlueprint.ts:29`, `fasesBlueprint.test.ts:17`, `mapaBlueprint.ts:139`,
  `mapaBlueprint.test.ts:111`, `invariantesGrafo.test.ts:50` 21 de servicio; `estados.ts:3` Caso B;
  `estados.ts:111` 22). `sla.ts:75` es prosa sin cifra verificable, se deja. Los 25 restantes son `docs/`,
  `openspec/specs/` y `openspec/config.yaml`, fuera de la autoridad de `sdd-apply`.
- **14.6/14.7 `openspec/config.yaml`, sólo lectura:** `:110` sigue cierto; `:1344`, `:1818`, `:1858`,
  `:1895`, `:1919`, `:2325`, `:2339` son `cifras_ancladas` de otros estados, independientes de F1B-06.
  Ninguna afectada.

## Riesgos / desviaciones frente a `design.md`/`tasks.md`

1. **Desviación explícita del orquestador sobre D3 (declarada, no silenciosa)**: la guarda 3 se
   implementó como función nombrada `exigirMismoFlujo` al final del fichero en vez de inline en `:125`,
   por instrucción directa del encargo de esta fase. Cero impacto en citas (confirmado, Fase 14.3).
2. **`readonly Transition[]` en vez de `Transition[]`** en `areasSiguientes`/`areasAAvisar` (Fases 7.2 y
   7.3): `tasks.md` no lo especificaba, pero `catalogoDelTicket` (Lote 1) devuelve `readonly Transition[]`
   y `tsc` lo exige. Sin impacto en el comportamiento, sólo en el tipo.
3. **M9 no lo detecta la matriz nueva de `permisos.test.ts`, contra lo que predecía `tasks.md`.**
   Declarado en detalle en la Fase 10.9 de arriba: el total 10/5 deriva dinámicamente de `t.area` y no
   distingue IDENTIDAD de área, sólo forma (simple/compartida). La mutación SÍ la cazan
   `flujoEquipoNuevo.test.ts` (P6, expectativa literal) y `invariantesGrafo.test.ts` (corrección b, ya
   existente desde el Lote 1) — la red global de pruebas detecta la mutación, aunque no por el fichero
   que `tasks.md` predijo. No se reforzó la matriz de `permisos.test.ts` para que también la cace, por
   presupuesto de tiempo del intento; queda anotado para quien retome este molde en otra tanda.
   Tampoco lo caza la matriz preexistente de servicio (102 casos), por el mismo motivo estructural —
   no es un defecto nuevo de este lote, es una propiedad ya presente del patrón que se copió.
4. **Fase 11, dos condensaciones de línea durante la escritura** (ver Fase 11 arriba): el primer intento
   de reescribir `reentrancia.test.ts:24-25` y, después, `permisos.test.ts:29-33` en la Fase 12,
   insertaron +1 línea cada vez. Se detectaron RELEYENDO el fichero (no confiando en el resultado del
   `Edit`) antes de correr ninguna prueba, y se corrigieron a la cuenta original. Documentado porque es
   exactamente el fallo que la regla de mutación 4 pide vigilar — «el que escribe la regla no está
   exento de ella» — y esta vez se cazó ANTES de comprometer el árbol.
5. **F1A-03 sigue pendiente** (riesgo heredado, repetido aquí): `Verificación` queda sin transición de
   salida en el catálogo EN hasta esa tanda siguiente. La condición de despliegue de `tasks.md`
   («este cambio NO se despliega sin F1A-03») sigue vigente sin cambios.

## Comprobaciones de persona (regla del ciclo 1 — NO son casillas contables)

Copiadas de `tasks.md` para que archivar este cambio no las dé por hechas. Ninguna de las tres se
ejecutó en este intento (no es tarea de `sdd-apply`, y `.tsx` está fuera de la red de pruebas).

| # | Comprobación | Dueño | Dónde queda escrito |
|---|---|---|---|
| Persona-1 | Un ticket `Equipo nuevo` en `Ingresado` sólo ve el botón «Ingreso equipo nuevo» en el panel | Servicio Técnico, en la app | `specs/transitions-equipo-nuevo/spec.md` (RQ-EN-06, tras fusión) |
| Persona-2 | Un ticket `Equipo nuevo` en `Verificación` aparece en la columna «Otros» del tablero, sin columna propia | Servicio Técnico, en la app | ídem (RQ-EN-07) |
| Persona-3 | El mensaje del `409` de la guarda 3 (Fase 6) se entiende sin explicación adicional (nombra los dos flujos) | Servicio Técnico, en la app | `specs/transitions-equipo-nuevo/spec.md` (RQ-EN-05, tras fusión) |

## Fase 14.8 — NO ejecutada en este intento

`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` corre tras el commit del Lote 2, según
`tasks.md`. Lo ejecuta el orquestador, fuera de este intento.
