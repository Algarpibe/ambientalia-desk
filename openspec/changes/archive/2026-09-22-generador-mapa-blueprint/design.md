# Diseño — `generador-mapa-blueprint` (F1A-06)

**Fase:** `sdd-design` · **Árbol:** worktree `f1a-06-r1`, base `main` en `125ae3e`. **Toda cita
`ruta:línea` de este documento se lee contra `125ae3e`.** En cuanto el `apply` mueva líneas, este
documento pasa a ser **caso B** de la regla de mutación 4 (`CLAUDE.md`).

Entradas: `proposal.md` (P-1 a P-4), `specs/mapa-blueprint/spec.md` (RQ-MB-01..06),
`specs/transitions-st/spec.md` (delta de `RQ-TS-03`). Las cuatro decisiones de producto del prompt de
lanzamiento —capacidad propia, entregable de consulta, fronteras repetidas, leyenda por área— entran
como **dadas**; este documento no las reabre. Idioma: **español**, por convención del repositorio
(`CLAUDE.md`, cabecera) y por coherencia con el `proposal.md` y las specs de este mismo cambio.

---

## 1 · Enfoque técnico

Tres piezas y una dirección de dependencia única, sin ciclos:

```
   estados.ts ──┐
                ├──► fasesBlueprint.ts ──┐
transitions.ts ─┘   (TABLA DE DATOS)     │
     │                                   ▼
     └────────────────────────► mapaBlueprint.ts  ──► Record<fichero, contenido>
        TRANSITIONS                (FUNCIÓN PURA)              │
        + las 2 sin botón                                      │
                                                               ├─► scripts/generar-mapa-blueprint.ts
                                                               │      (writeFileSync · única I/O)
                                                               │            ▼
                                                               │     docs/artefactos/blueprint-*.md
                                                               │            ▲
                                                               └─► mapaBlueprint.test.ts ──diff──┘
                                                                     (lee disco: la prueba, NO el módulo)
```

La función pura **no toca disco ni proceso** (RQ-MB-01). Quien lee disco es la **prueba**, para
diffear contra lo commiteado, y la **CLI**, para escribirlo. Esa separación es lo que hace que
RQ-MB-06 sea un diff de cadenas y no un test de integración.

## 2 · Decisiones de arquitectura

### D-1 · Dónde vive la tabla estado → fase: módulo de datos propio

| Opción | Coste | Decisión |
|---|---|---|
| Dentro de `mapaBlueprint.ts` | La tabla no se puede sustituir por una sintética → el escenario «un estado sin fase bloquea la generación» (RQ-MB-04) **no se puede escribir** | ✗ |
| Anexada a `estados.ts` | Citación segura (append en EOF no desplaza), pero mete en el dominio una partición que **ningún consumidor de la app usa**, e invita a filtrar el tablero por fase | ✗ |
| **`packages/shared/src/fasesBlueprint.ts`** | Un fichero nuevo más | ✓ |

**Razón.** La tabla se declara con `satisfies Record<Estado, FaseId>`. `Estado` es
`keyof typeof CLASIFICACION_EN_ESPERA` (`estados.ts:109`), así que una clave que falta **y** una que
sobra son las dos error de `tsc` — la guarda de compilación que pide P-3, en las dos direcciones, y
está en la **declaración**, que es donde un estado nuevo aparece. Separarla del generador es lo que
permite inyectar una tabla incompleta en la prueba y ejercitar la guarda de **ejecución**.

> **Las dos guardas hacen falta, y no son la misma.** `tsc` caza el caso honesto (alguien añade un
> estado a `CLASIFICACION_EN_ESPERA` y no le pone fase). El `throw` del generador caza el caso con
> `as` o con tabla inyectada, y es el único de los dos que una **prueba** puede poner en rojo.
> `sdd-tasks` debe emitir tarea para cada una; escribir sólo una deja RQ-MB-04 a medias.

### D-2 · La derivación de `estadoPorRemision.ts`: lectura directa de `.from`/`.to`, sin auxiliar

| Opción | Coste | Decisión |
|---|---|---|
| Constante derivada nueva en `transitions.ts` | **Inserta líneas** → desplaza `:171-263`, `:178`, `:295-298`, `:310`, `:313-315` y con ellas ~180 citas vivas en ~41 ficheros | ✗ |
| Función auxiliar en un módulo nuevo | Un nivel más para una unión de dos elementos; y esconde la derivación justo donde la spec pide verla | ✗ |
| **Leer `.from`/`.to` en el punto de uso** | Una línea larga en `:41` | ✓ |

**Razón.** El escenario de `RQ-TS-03` dice, textual, que «las dos leen `.from`/`.to` de las
constantes». Un auxiliar lo volvería indirecto sin ganar nada: la guarda es la **unión de los dos
`from`** y el destino es el `.to` del paso elegido — dos expresiones, no una abstracción.

**Y un defecto latente que la derivación cierra de paso:** hoy la condición `confirmadas > 0` se
escribe **dos veces** (`estadoPorRemision.ts:49` elige el destino, `:56` elige la constante) sin nada
que fije su acuerdo. Al derivar el destino del paso, el par pasa a ser estructural: no hay dos
ternarios que puedan divergir.

### D-3 · La salida es `Record<nombreFichero, contenido>`, no cuatro funciones

Una sola llamada devuelve el mapa completo. La CLI itera y escribe; la prueba itera y diffea; y
«exactamente cuatro ficheros» (RQ-MB-03) se fija con una aserción sobre `Object.keys(...)` en vez de
contando llamadas.

### D-4 · `conBoton` se deriva de la lista de origen, nunca se declara

El generador recibe `TRANSITIONS` y las dos sin botón **en parámetros distintos**. `TRANSITIONS` es,
por definición del fichero, lo que la interfaz ofrece como botón (`transitions.ts:147-148`). Un campo
`conBoton: true` escrito a mano en 34 entradas sería la cuarta copia que esta tanda existe para matar.

### D-5 · Determinismo, o la prueba anti-desfase es inútil

La salida **no puede** contener fecha, sha, ruta absoluta ni nada dependiente de la máquina: un
`Date.now()` en la cabecera pone RQ-MB-06 en rojo en cada ejecución y acaba desactivada. Órdenes
fijos: nodos en orden de `ESTADOS` (`estados.ts:112`, que es el orden de declaración de
`CLASIFICACION_EN_ESPERA`), aristas en orden del array `TRANSITIONS` y después las dos sin botón. Los
alias Mermaid se numeran por posición en `ESTADOS` (`e01`..`e21`), no por hash del nombre.

### D-6 · Mermaid: alias obligatorios y marca de área en la etiqueta

`stateDiagram-v2` no admite identificadores con espacios, tildes, `.` ni `/`, y seis de los 21 estados
los llevan (`Rev./Diagnostico`, `Por Entregar / Sin facturar`…). De ahí `state "Nombre" as eNN`. Y el
área **no** puede ir por `classDef`: en `stateDiagram-v2` las clases se aplican a **estados**, y el
área es propiedad de la **arista**. Por eso la marca de área va en la etiqueta del paso
(`e08 --> e05 : Habilitar Servicio [C]`), con `areasForTransition` (`transitions.ts:313-315`)
descomponiendo las compuestas en dos marcas — que es exactamente lo que pide el escenario de RQ-MB-05.

---

## 3 · Contratos

```ts
// packages/shared/src/fasesBlueprint.ts
export type FaseId = 'entrada' | 'diagnostico' | 'cierre'
export interface Fase { id: FaseId; orden: 1 | 2 | 3; titulo: string; fuente: string }
export const FASES: readonly Fase[]                       // las tres de M1.3.1 (R08.2.md:1187-1191)
export const FASE_POR_ESTADO = { /* 21 claves */ } satisfies Record<Estado, FaseId>

// packages/shared/src/mapaBlueprint.ts
export interface PasoSinBoton { id: string; name: string; from: string[]; to: string; area: string }
export interface EntradaMapa {
  transiciones: Transition[]            // TRANSITIONS          → conBoton = true
  sinBoton: PasoSinBoton[]              // las dos constantes   → conBoton = false
  estados: readonly string[]            // ESTADOS
  sinSalida: readonly string[]          // ESTADOS_SIN_SALIDA   → marca `·espera·` de M1.3.7 (:1302)
  fases: readonly Fase[]
  fasePorEstado: Record<string, FaseId> // `string`, NO `Estado`: así la guarda de ejecución es testeable
}
/** Devuelve nombre de fichero → contenido Markdown. Cuatro entradas, siempre las mismas. */
export function generarMapaBlueprint(e: EntradaMapa): Record<string, string>
```

**Nota de tipos, medida.** Las dos constantes **no** son `Transition`: `Transition.fields` es
obligatorio (`transitions.ts:55-62`) y la spec exige que sigan sin `fields`. Por eso `PasoSinBoton` y
no `Transition`. En `estadoPorRemision.ts` el paso se pasa a `applyTransition` como **variable**, no
como literal fresco, así que el chequeo de propiedades sobrantes no aplica y `Transitionish`
(`packages/zoho-sync/src/db/repo.ts:294`) aguanta, tal como afirma la propuesta §5.6.

## 4 · `transitions.ts:150-151` — ANTES/DESPUÉS exacto

**Restricción dura (propuesta §5.6 y §10):** edición **en sitio**. Dos líneas entran, dos líneas
salen. Ni una insertada, ni una borrada, en ningún punto del fichero. `STATUS_TICKET_CREADO` (`:143`)
y `STATUS_REMISION_CREADA` (`:144`) ya están declaradas **encima**, así que no hay que mover nada.

**ANTES** (`125ae3e`, líneas 150 y 151):

```ts
export const TRANSICION_REMISION_CONFIRMADA = { id: 'remision_confirmada', name: 'Remisión creada', area: 'Servicio Técnico' }
export const TRANSICION_REMISION_RETIRADA = { id: 'remision_retirada', name: 'Remisión anulada', area: 'Servicio Técnico' }
```

**DESPUÉS** (mismas dos líneas, mismos números):

```ts
export const TRANSICION_REMISION_CONFIRMADA = { id: 'remision_confirmada', name: 'Remisión creada', from: [STATUS_TICKET_CREADO], to: STATUS_REMISION_CREADA, area: 'Servicio Técnico' }
export const TRANSICION_REMISION_RETIRADA = { id: 'remision_retirada', name: 'Remisión anulada', from: [STATUS_REMISION_CREADA], to: STATUS_TICKET_CREADO, area: 'Servicio Técnico' }
```

Orden de propiedades `id · name · from · to · area`, el mismo de `interface Transition`
(`transitions.ts:55-62`). No hay regla `max-len` en `eslint.config.js`, y `transitions.ts:178` ya mide ~166
caracteres: las nuevas (~185) no mueven el trinquete de 158 avisos de `ci.yml:41`.

El comentario de `:146-149` **no se toca**: sigue siendo cierto (no están en `TRANSITIONS`). Quien
explica el cambio es el bloque de `invariantesGrafo.test.ts:108-119` (§6).

## 5 · `estadoPorRemision.ts` — ANTES/DESPUÉS exacto, delta de líneas **cero**

El fichero tiene **20 citas en 7 ficheros** (propuesta §8) y la spec viva lo cita por línea
(`:41` la guarda, `:49` el destino, en `remisiones/spec.md:277` y en el delta de `RQ-TS-03`). Por eso
el cambio se hace **sin insertar ni borrar líneas**, igual que en `transitions.ts`.

| Línea | ANTES | DESPUÉS |
|---|---|---|
| 10 | `  STATUS_REMISION_CREADA, STATUS_TICKET_CREADO,` | `  TRANSICION_REMISION_CONFIRMADA,` |
| 11 | `  TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA,` | `  TRANSICION_REMISION_RETIRADA,` |
| 41 | `  if (actual !== STATUS_TICKET_CREADO && actual !== STATUS_REMISION_CREADA) return` | `  if (![...TRANSICION_REMISION_CONFIRMADA.from, ...TRANSICION_REMISION_RETIRADA.from].some((s) => s === actual)) return` |
| 49 | `  const destino = confirmadas > 0 ? STATUS_REMISION_CREADA : STATUS_TICKET_CREADO` | `  const paso = confirmadas > 0 ? TRANSICION_REMISION_CONFIRMADA : TRANSICION_REMISION_RETIRADA` |
| 50 | `  if (destino === actual) return` | `  if (paso.to === actual) return` |
| 56 | `    confirmadas > 0 ? TRANSICION_REMISION_CONFIRMADA : TRANSICION_REMISION_RETIRADA,` | `    paso,` |
| 57 | `    { status: destino, statusType: 'Open', columns: {}, customFields: {} },` | `    { status: paso.to, statusType: 'Open', columns: {}, customFields: {} },` |

Las líneas 9 y 12 (`import {` y `} from '@ambientalia/shared'`) **no cambian**: el bloque sigue
midiendo cuatro líneas, sólo se redistribuye su contenido. Borrar la línea 10 habría desplazado
`:41` y `:49`, que es justo lo que las specs citan.

**Por qué `.some((s) => s === actual)` y no `.includes(actual)`:** `actual` es `string | undefined`
(`:40`) y `from` es `string[]`; `includes` no lo acepta y obligaría a añadir un `if (!actual) return`
— **una línea insertada**. `some` con comparación es equivalente, tipa sin queja y no mueve nada.

**Comportamiento: idéntico.** La unión `{Ticket creado} ∪ {Remisión creada}` es exactamente el par de
`:41`, y `paso.to` es exactamente el destino de `:49` para cada rama. Lo fija el criterio 6 de la
propuesta: `estadoPorRemision.test.ts` entero en verde **sin tocar una aserción**.

## 6 · Invariante 5b — inversión con presupuesto de líneas, y un hallazgo que la propuesta no traía

> **⚠️ `invariantesGrafo.test.ts` tiene 23 citas vivas fuera de `archive/`, y la propuesta §8 NO lo
> incluye en el barrido de la regla de mutación 4.** Medido con `grep -rnoE` en este árbol. **Cuatro**
> apuntan a `:137` —el `it` del invariante 6— y una de ellas es **`packages/shared/src/bodegaje.ts:13`,
> un comentario de código fuente**: la clase de cita que ni `tsc`, ni `eslint`, ni las pruebas ven.
> Cinco más apuntan a `:120` y una a `:125`.

**Mitigación, y es aritmética, no cuidado.** El bloque 5b ocupa hoy `:108-127` = **20 líneas**
(comentario `:108-119`, 12 líneas; prueba `:120-127`, 8 líneas). La reescritura **debe medir las
mismas 20**, repartidas igual. Así `:137` y todo lo de abajo no se mueve, `:120` sigue siendo el `it`
y `:125` sigue siendo la aserción de `TRANSITIONS.some`. Forma exacta de `:120-127`:

```ts
  it('5b · las dos sin botón declaran su par exacto y siguen fuera de TRANSITIONS', () => {
    for (const [t, from, to] of [[TRANSICION_REMISION_CONFIRMADA, STATUS_TICKET_CREADO, STATUS_REMISION_CREADA], [TRANSICION_REMISION_RETIRADA, STATUS_REMISION_CREADA, STATUS_TICKET_CREADO]] as const) {
      expect([t.from, t.to], `${t.id} ya no declara su par`).toEqual([[from], to])
      expect(t, `${t.id} ganó fields: ya es un botón`).not.toHaveProperty('fields')
      expect(t.area, `${t.id} dejó de ser de Servicio Técnico a secas`).toBe('Servicio Técnico')
      expect(TRANSITIONS.some((x) => x.id === t.id), `${t.id} se coló en TRANSITIONS`).toBe(false)
    }
  })
```

Los dos `STATUS_*` se añaden **a la línea 3** del import, que ya es una lista en una línea: sin
insertar línea, así que `:15` tampoco se mueve.

**Lo que 5b deja de afirmar y lo que gana.** Deja de afirmar «no tienen `from`/`to`» (falso tras P-2)
y pasa a afirmar el **par exacto**. Conserva las otras tres: fuera de `TRANSITIONS`, `Servicio
Técnico` a secas, y ahora sin `fields` — que es el discriminador real de «no es un botón», y es más
fuerte que el que había.

## 7 · Partición de fases — las 21, declaradas

Fuente: M1.3.1 (`R08.2.md:1187-1191`). Fases: **1 · Entrada y remisión** (`:1188`), **2 · Diagnóstico,
cotización y ejecución** (`:1190`), **3 · Cierre administrativo y entrega** (`:1191`).

| Fase | Estados |
|---|---|
| `entrada` (4) | `OV asignada` · `Ticket creado` · `Remisión creada` · `Ingresado` |
| `diagnostico` (12) | `Rev./Diagnostico` · `Notificado` · `Notificación a Compras` · `Notificación Comercial` · `Notificación cliente` · `En Proceso` · `Continuación del proceso` · `Pendiente` · los cuatro de `ESTADOS_SIN_SALIDA` (`estados.ts:151-160`) |
| `cierre` (5) | `Por Facturar` · `Liberación Comercial` · `Por Entregar` · `Por Entregar / Sin facturar` · `Finalizado` |

4 + 12 + 5 = **21**, que es `ESTADOS.length` fijado por el invariante 2
(`invariantesGrafo.test.ts:50-54`).

**Tres asignaciones que no son mecánicas y por eso van escritas:**
- **`Ingresado` cae en la fase 1**, no en la 2. La frase de la fase 1 lo **nombra** («convergen en
  Ingresado», `:1188`); la de la fase 2 arranca «de Rev./Diagnostico» (`:1190`). Consecuencia
  observable: `ingreso_a_servicio` es **transición de frontera 1→2** y sale repetida en las dos
  vistas. Es la asignación más discutible del cuadro → §11, pregunta abierta 1.
- **Los cuatro «estados de espera» que nombra `:1190` son exactamente `ESTADOS_SIN_SALIDA`**
  (`estados.ts:151-160`). Coincidencia verificada contra el fichero, no supuesta.
- **`Pendiente` cae en la fase 2.** No está en M1.3.1 (se añadió el 11/09) y `estados.ts:101-105` lo
  deja «sin clasificar» para `en_espera` — pero sus dos salidas son de Servicio Técnico
  (`servicio_externo_pendiente`, `diagnostico_complementario`), que viven enteras en la fase 2.

**Por qué el nodo fantasma no puede existir.** El invariante 1 (`invariantesGrafo.test.ts:35-42`) ya
afirma que los extremos de `TRANSITIONS` son **exactamente** `ESTADOS`; los dos extremos de las
constantes (`Ticket creado`, `Remisión creada`) están en `ESTADOS`, y 5b lo vuelve a fijar. Luego el
conjunto de nodos del mapa **es** `ESTADOS`, y una tabla completa sobre `ESTADOS` cubre el mapa
entero. El generador no necesita comprobar extremos: ya están comprobados.

**Vistas por fase.** Una vista incluye los estados de su fase más, para cada frontera, el extremo
ajeno, renderizado como nodo marcado `→fase N` / `←fase N` y con la arista anotada `[frontera]`. Sin
eso la arista quedaría colgando. No hay lista de fronteras: se derivan comparando
`fasePorEstado[from] !== fasePorEstado[to]` (RQ-MB-04).

## 8 · Ficheros

| Fichero | Acción | Qué es |
|---|---|---|
| `packages/shared/src/mapaBlueprint.ts` | Crear | Función pura grafo → cuatro Markdown |
| `packages/shared/src/fasesBlueprint.ts` | Crear | `FASES` + `FASE_POR_ESTADO` (D-1) |
| `packages/shared/src/mapaBlueprint.test.ts` | Crear | Pruebas puras **y** el diff anti-desfase |
| `packages/shared/src/index.ts` | Modificar | Dos `export *` **al final** (EOF: no desplaza las 17 de hoy) |
| `packages/shared/src/transitions.ts` | Modificar **en sitio** | `:150-151`, §4. Delta de líneas **0** |
| `packages/shared/src/invariantesGrafo.test.ts` | Modificar | `:3` y `:108-127`, §6. Delta de líneas **0** |
| `apps/desk/server/db/estadoPorRemision.ts` | Modificar | §5. Delta de líneas **0** |
| `scripts/generar-mapa-blueprint.ts` | Crear | CLI: importa, itera, `writeFileSync`. Nada más |
| `package.json` | Modificar | Script nuevo **como última entrada de `scripts`** (§10) |
| `docs/artefactos/blueprint-completo.md` | Crear (generado) | Los 38 pasos + leyenda de área |
| `docs/artefactos/blueprint-fase-1-entrada.md` | Crear (generado) | Vista fase 1 |
| `docs/artefactos/blueprint-fase-2-diagnostico.md` | Crear (generado) | Vista fase 2 |
| `docs/artefactos/blueprint-fase-3-cierre.md` | Crear (generado) | Vista fase 3 |
| `docs/artefactos/NOTA.md` · `F0-01_...maestro.md` · `config.yaml` | Modificar | Cierre documental, propuesta §8 |

`docs/` está en `globalIgnores` de `eslint.config.js:16`, así que los cuatro generados **no** entran
en `eslint . --max-warnings 158` (`ci.yml:41`). Sí entran en el ledger vía `wc -l`.

## 9 · Estrategia de pruebas (`strict_tdd` — rojo antes que verde, con comando y salida)

| Capa | Qué fija | Cómo |
|---|---|---|
| Unidad · pura | 38 aristas, 3 desde `habilitar_servicio`, 2 sin botón | Aserción sobre la salida (RQ-MB-02) |
| Unidad · pura | Cuatro ficheros, ni uno más | `Object.keys(generarMapaBlueprint(...))` (RQ-MB-03) |
| Unidad · pura | Guarda de **ejecución** de la tabla de fases | Inyectar `fasePorEstado` incompleto → `throw` (D-1) |
| Unidad · pura | Frontera en las dos vistas, anotada | Transición con `from`/`to` en fases distintas (RQ-MB-04) |
| Unidad · pura | Leyenda de área, compuestas con dos marcas | `areasForTransition` (RQ-MB-05) |
| Compilación | Tabla de fases completa | `satisfies Record<Estado, FaseId>` → `npm run typecheck` |
| Contrato | Invariante 5b invertido | §6 |
| Regresión | Paso sin botón sin cambio de conducta | `estadoPorRemision.test.ts` verde **sin tocar aserciones** |
| **Mutación (regla 2)** | **El fichero VIGILADO** | Editar a mano un `blueprint-*.md` commiteado ⇒ **rojo** (RQ-MB-06). Mutar sólo el generador **no** cuenta |

**Dónde vive la prueba y por qué.** En `packages/shared/src/mapaBlueprint.test.ts`, no en `scripts/`:
`vitest.config.ts:17-20` sólo incluye `apps/**/*.test.ts` y `packages/**/*.test.ts`, y una prueba en
`scripts/` **no se ejecutaría nunca, en silencio**. Lee los cuatro `.md` con
`new URL('../../../docs/artefactos/…', import.meta.url)` — tres niveles hasta la raíz. El `fs` está en
la **prueba**; el módulo sigue puro (RQ-MB-01).

**Cobertura.** `packages/shared/src/**` está en `coverage.include` (`vitest.config.ts:52`) con suelo
de 92 % líneas / 78 % ramas (`:58-63`). Un `mapaBlueprint.ts` de ~300 líneas con ramas sin ejercitar
**baja el porcentaje global y rompe el CI**. `scripts/` **no** está en el `include`, así que la CLI no
pesa — otra razón para dejarla en tres líneas.

## 10 · Regla invariable 13, threat matrix y reglas de fase

- **Regla invariable 13 — NO APLICA, y se declara porque se miró.** Esta tanda no toca
  `apps/desk/src`: no hay decisión de cliente, ni espejo, ni guarda en el navegador. La generación es
  offline y su único consumidor es un `.md` de consulta. La regla de mutación 3 tampoco aplica, por lo
  mismo (propuesta §8 ya lo declara).
- **Threat matrix — N/A.** No hay enrutamiento, ni shell, ni subproceso, ni automatización de VCS/PR,
  ni clasificación de ficheros ejecutables, ni integración de procesos. La CLI escribe cuatro rutas
  **constantes** bajo `docs/artefactos/`: no compone rutas con entrada externa y no recibe argumentos.
- **`rules.design` de `openspec/config.yaml:1681-1683`:** decisiones documentadas con su razón, arriba.
  La segunda regla (todo `CREATE TABLE` califica esquema) **no aplica**: esta tanda no escribe SQL, no
  toca `schema.sql` ni ninguna migración.
- **`package.json`, con el daño medido.** El script nuevo va **como última entrada de `scripts`**
  (después de `"test:coverage"`, `:24`). Medido con `grep -rnoE 'package\.json:[0-9]+'`: esa posición
  rompe **sólo dos** citas vivas, las dos a `:57` (`openspec/config.yaml:60` y
  `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:221`), que se reparan en el cierre. Insertarlo
  tras `"reconcile"` (`:20`) rompería además `:24` y `:43`. `proposal.md:128` (→ `package.json:43`)
  queda como **caso B** del propio cambio.

## 11 · Preguntas abiertas — no las resuelve el ejecutor de fase

1. **¿`Ingresado` es final de la fase 1 o principio de la fase 2?** Supuesto usado: **fase 1**, porque
   M1.3.1 lo nombra en la frase de la fase 1 (`R08.2.md:1188`) y no en la de la fase 2 (`:1190`).
   Cambia **una** arista de sitio (`ingreso_a_servicio`: frontera 1→2 o interior de la fase 2). No
   bloquea: es una entrada de `FASE_POR_ESTADO` y una regeneración.
2. **¿`Pendiente` en la fase 2?** Supuesto: sí (derivado de sus dos salidas). No está en M1.3.1 porque
   nació después. Mismo coste de cambio: una entrada de la tabla.
3. **El corte A/B del `apply`.** La propuesta §11 estima ~800-1.000 líneas contra un techo de 800 y da
   por **hipótesis** que no cabe en un intento. Este diseño no la desmiente: la decide `sdd-tasks` con
   `delivery_strategy: ask-on-risk` (`openspec/config.yaml:28`). Corte natural confirmado: **(A)**
   `fasesBlueprint.ts` + P-2 + 5b + `estadoPorRemision.ts`; **(B)** generador, CLI, los cuatro `.md`,
   specs y cierre documental. A es autónomo y verificable sin B.

## 12 · Vuelta atrás

La de la propuesta §12, sin cambios: revertir los commits. No hay migración, ni esquema, ni dato
escrito en base. Los tres ficheros modificados vuelven a su forma de hoy con delta de líneas **cero**,
así que la reversión no desplaza ninguna cita.
