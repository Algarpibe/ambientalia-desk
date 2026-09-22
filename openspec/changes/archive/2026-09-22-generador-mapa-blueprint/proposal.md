---
tanda: F1A-06
motivo: ""
capacidad: [mapa-blueprint, transitions-st]
maestro: ["Anexo F (:4412-4413)", "M1.3.7 (:1301-1458)", "M1.3.1 (:1187-1191)", "M1.3.3 (:1198)", "C.11 (:3991-3993)"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `generador-mapa-blueprint` (F1A-06)

**Fase:** `sdd-propose` · **Árbol:** worktree `f1a-06-r1`, base `main` en `125ae3e`. **Toda cita
`ruta:línea` se lee contra `125ae3e`**; en cuanto el `apply` mueva líneas, este documento es caso B de
la regla de mutación 4. **Procedencia:** fila F1A-06,
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:145` · gate `decision/mapa-blueprint-generado`,
**cerrado el 10/09** (`:370` del mismo plan) · maestro **Anexo F**,
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:4412-4413`, y **C.11**
(`:3991-3993`). Exploración: Engram obs. **#874**.

> **⚠️ Desviación del prompt de lanzamiento: `capacidad` añade `mapa-blueprint`.** El prompt fijaba
> `[transitions-st]`. El contrato del artefacto —qué ficheros, en qué dialecto, con qué partición y con
> qué guarda contra el desfase— no es un requisito del motor de transiciones, y `transitions-st` ya son
> 999 líneas. `transitions-st` **sí** recibe delta, porque esta tanda **modifica dos requisitos vivos**
> suyos (§4). Si Gerencia prefiere todo dentro de `transitions-st`, es una decisión de forma que no
> cambia el trabajo: §13, pregunta 1.

---

## 1 · Intención

El mapa visual del flujo **no tiene generador**: lo produjo una conversación de agente en agosto y hoy
no hay forma de reproducirlo (`docs/artefactos/NOTA.md:32-46`). La consecuencia ya ocurrió: el
artefacto describe desde el 21/08 un flujo anterior a C1, C11 y C9, y por eso lleva incrustado un aviso
de caducidad (`NOTA.md:143-148`; era `:113-118` en `125ae3e`, reanclada tras Unidad C). El maestro lo dice en una línea que es el porqué entero de esta
tanda: **«se actualiza con cada auditoría» no era un mecanismo, era una promesa, y nadie la cumplió**
(`R08.2.md:4412`; el mismo diagnóstico en `:210`).

**Resultado buscado:** el mapa deja de ser un entregable que alguien mantiene y pasa a ser una
**proyección del código**, con una prueba que se pone roja si el fichero commiteado y el grafo dejan de
decir lo mismo. Quien lea el mapa lee el flujo vigente, o el CI está rojo — no hay tercera opción.

## 2 · Decisiones

### Heredadas — no se reabren

| # | Decisión | Origen |
|---|---|---|
| H-1 | Sí, generado desde el código, con prueba anti-desfase. El artefacto interactivo queda **histórico congelado en `a3a8f03`** | `decision/mapa-blueprint-generado`, 10/09 (`plan:370`; maestro `:4412`) |
| H-2 | Salida `docs/artefactos/blueprint-*.md`; **las fichas de hallazgos NO van en el mapa**, viven en los documentos de auditoría | maestro `:4412`, textual |
| H-3 | Diagrama completo **más una vista por cada una de las tres fases de M1.3.1** | `plan:145` |

### Propias de esta propuesta — objetables al aprobarla

- **P-1 · El recuento del maestro se cumple dibujando UNA FLECHA POR ORIGEN, no una por transición.**
  Es lo que cierra el hueco 38/36 (§3). El generador **no interpreta: recorre** — un `from` de tres
  elementos son tres aristas.
- **P-2 · Los dos pasos sin botón pasan a declarar `from`/`to` en `transitions.ts:150-151`, y
  `estadoPorRemision.ts` deriva de ahí su guarda y su destino.** Hoy el par vive **duplicado**: la
  declaración no lo tiene y el servidor lo reconstruye con literales (`estadoPorRemision.ts:41` la
  guarda, `:49` el destino). Que el generador lo escribiera a mano sería una **tercera** copia, y la
  que se desfasaría en silencio. **Coste declarado, no escondido:** invierte el invariante 5b
  (`packages/shared/src/invariantesGrafo.test.ts:120-127`, que hoy afirma
  `expect(t).not.toHaveProperty('from')`) y modifica **RQ-TS-03**
  (`openspec/specs/transitions-st/spec.md:108-112`). *Alternativa descartada:* hardcodear el par en el
  generador — más barato hoy, y el modo de fallo exacto que esta tanda existe para matar.
- **P-3 · La fase de un estado se declara como DATO; la de una transición se deriva.** El mapa
  estado → fase (los 21 estados, las tres fases de M1.3.1) es decisión de negocio, como
  `ESTADOS_SIN_SALIDA` (`packages/shared/src/estados.ts:151`). Una transición aparece en la vista de la
  fase de su `from` **y** en la de su `to`, anotada como frontera cuando difieren. Así **no hay lista de
  transiciones frontera escrita a mano** que pueda quedarse corta. Guarda: las claves del mapa de fases
  son exactamente `ESTADOS` (`estados.ts:112`), así que un estado nuevo no puede entrar en el grafo sin
  fase.
- **P-4 · La prueba anti-desfase es un diff contra el fichero commiteado, no el patrón de
  `migrate.test.ts`.** La fila del plan cita ese patrón, que existe porque `schema.sql` es **texto
  crudo** y hay que parsearlo. Aquí el dato ya es TS tipado: la prueba regenera desde el import real y
  compara con lo que hay en disco. Menos código y sin regex.

## 3 · El hueco 38 vs 36: cerrado, con la cuenta escrita

La fila del plan lo pone como precondición del criterio de aceptación (`plan:145`), y el maestro lo
deja «nombrado, no resuelto» en dos sitios: M1.3.3 (`:1198`, «Faltan dos y no se sabe cuáles.
Hipótesis: …») y Anexo F (`:4413`). **Ya estaba resuelto 103 líneas más abajo, en el propio maestro**:
M1.3.7 «Tabla completa: los 38 pasos [AS-BUILT]» (`:1301-1458`) lista `Habilitar Servicio` **tres
veces**, una por origen (`:1307-1322`), y explica la aritmética en `:1302`.

**Remedido contra el código en este árbol:** `TRANSICIONES_BASE` (`transitions.ts:171-263`) son 34
entradas y **sólo `habilitar_servicio` (`:178`) tiene más de un origen** (`from` de tres). Luego
33×1 + 1×3 = **36 caminos con botón**, más los **2** sin botón (`:150-151`) = **38**. Cuadra al dígito.
No es una hipótesis: es una tabla del maestro y un recuento sobre el fichero.

Lo que queda es **doc drift interno de la R08.2** —M1.3.3 y el Anexo F no citan a M1.3.7—, y se corrige
por texto (§8), no tocando el `.docx`.

## 4 · Capacidades — contrato con `sdd-spec`

### Capacidades nuevas
- `mapa-blueprint`: el contrato del mapa generado — qué ficheros produce, en qué dialecto, una arista
  por origen, la partición por fases y sus fronteras, la guarda anti-desfase y el procedimiento de
  regeneración. **R-2:** el mismo cambio añade `mapa-blueprint` a `openspec/config.yaml → capabilities`.

### Capacidades modificadas
- `transitions-st`: **RQ-TS-03** (`spec.md:91-112`) — los dos pasos sin botón pasan a declarar
  `from`/`to`; muere la frase «Lo que no está en el archivo de transiciones es el `from`/`to`»
  (`:112`). Y **RQ-TS-01**, tabla de los siete invariantes (`:56-66`): el invariante 5b cambia de
  «siguen sin `from`/`to`» a «los declaran, y valen exactamente este par».

**`remisiones` y `zoho-sync` NO reciben delta, a propósito.** `remisiones/spec.md:285-286` cede
explícitamente las dos constantes a `transitions-st`, y su **RQ-RE-11** (`:277`) afirma que el corte
está en `estadoPorRemision.ts:41` — sigue siendo cierto: cambia de qué se deriva la condición, no dónde
vive ni qué hace. Igual `zoho-sync/spec.md:79`. Las dos citas se **recomprueban** en el cierre (§8), no
se reescriben.

## 5 · Enfoque

**5.1 · Función pura en `packages/shared/src/` (nombre a criterio del diseño, p. ej. `mapaBlueprint.ts`).**
Recibe el grafo y devuelve **cadenas**: sin `fs`, sin `process`, testeable sin tocar disco.
Fuentes: `TRANSITIONS` (`transitions.ts:295-298`), `CLASIFICACION_EN_ESPERA`/`ESTADOS`
(`estados.ts:59-106`, `:112`), `ESTADOS_SIN_SALIDA` (`:151`) para la marca `·espera·` que usa M1.3.7
(`:1302`), y `areasForTransition` (`transitions.ts:313-315`) con `AREAS` (`:310`) para la leyenda.

> **Precisión sobre la fila del plan:** dice «desde `transitions.ts`, `estados.ts` y `permissions.ts`».
> `permissions.ts` son siete líneas y **una sola función**, `canExecuteTransition` (`:4-6`), que no
> tiene nada que aportar a un mapa sin usuario. El dato de área que el mapa necesita vive en
> `transitions.ts` (`area` de cada transición, más `:310` y `:313-315`). Se anota; no cambia el alcance.

**5.2 · CLI delgada en `scripts/generar-mapa-blueprint.ts`**, con `npm run` propio. `tsx` ya es
dependencia (`package.json:43`) y hay precedente exacto: `"reconcile": "tsx apps/desk/server/reconciliacion/cli.ts"`
(`package.json:20`). La CLI **sólo** escribe a disco lo que devuelve la función pura. **Queda sin
prueba propia, y se dice:** su lógica es `writeFileSync`, y lo que sí se prueba es el contenido.

**5.3 · Dónde vive la prueba — restricción medida, no preferencia.** `vitest.config.ts:17-20` incluye
**sólo** `apps/**/*.test.ts` y `packages/**/*.test.ts`. Una prueba en `scripts/` **no se ejecutaría
nunca, en silencio**. Por eso la función pura va en `packages/` y su prueba al lado.

**5.4 · La prueba anti-desfase «en CI» no toca el CI.** `.github/workflows/ci.yml:45` corre
`npm run test:coverage`, o sea la suite entera: una prueba de vitest **ya está en CI**. No hay fichero
de workflow que editar.

**5.5 · Formato.** Mermaid `stateDiagram-v2` en bloque cercado dentro del `.md`. **No hace falta
dependencia npm**: GitHub y VS Code lo renderizan de serie. Cuatro ficheros —el completo y las tres
fases—, nombres exactos a fijar por el diseño.

**5.6 · La unificación de P-2, línea a línea.** `transitions.ts:150-151` ganan `from` y `to` **en la
misma línea** (sin mover ninguna, §10). `estadoPorRemision.ts:41` pasa a comparar contra
`TRANSICION_REMISION_CONFIRMADA.from` y `…RETIRADA.from`, y `:49` a elegir entre sus `.to`. El tipo
aguanta: `applyTransition` recibe `Transitionish` (`packages/zoho-sync/src/db/repo.ts:294`), estructural.

## 6 · Fuera de alcance

- **Regenerar o retirar `blueprintserviciotecnico.html`.** Queda congelado en `a3a8f03` con su aviso
  (`NOTA.md:143-160`; era `:113-130` en `125ae3e`, reanclada tras Unidad C). Lo único que se hace es actualizar `NOTA.md` para decir que **ya hay generador**.
- Las fichas de hallazgos en el mapa (H-2, decisión del maestro) y cualquier leyenda interactiva.
- Los grafos nuevos de **F1B-06**: el generador se construye antes para que nazcan con diagrama
  (`plan:145`), no para dibujarlos ahora.
- Editar el `.docx` del maestro y la R08.3.
- Los `.tsx` (fuera de la red de pruebas por F0-00).

## 7 · Pruebas (`strict_tdd`)

La fase roja se registra con comando y salida. Criterios mínimos —el diseño los amplía:

1. **Anti-desfase:** regenerar desde el import real y comparar con los cuatro `.md` commiteados; una
   transición añadida a mano al grafo en la prueba cambia la salida.
2. **El recuento, fijado como aserción:** el diagrama completo tiene **38** aristas, de ellas **3** con
   origen `habilitar_servicio` y **2** marcadas sin botón.
3. **Mutación (regla 2 de `CLAUDE.md`): se ensucia el fichero VIGILADO.** Editar a mano un
   `blueprint-*.md` commiteado **debe** poner la prueba roja. Mutar el generador sólo demostraría que
   se ejecuta.
4. **Invariante 5b invertido:** las dos constantes declaran `from`/`to` con el par exacto, siguen
   siendo de `Servicio Técnico` a secas y siguen **fuera** de `TRANSITIONS`
   (`invariantesGrafo.test.ts:125` no cambia).
5. **Fases:** las claves del mapa estado → fase son exactamente `ESTADOS`; una transición cuyo `from` y
   `to` caen en fases distintas aparece en las **dos** vistas, anotada.
6. **Sin regresión en el paso sin botón:** `estadoPorRemision.test.ts` entero en verde sin tocar sus
   aserciones — la derivación de P-2 es refactor de fuente, no cambio de comportamiento.

## 8 · Al cerrar — parte del alcance

- **Regla de mutación 4, y aquí es cara.** `transitions.ts` tiene **~180 citas vivas en ~41 ficheros**
  (211 en 57 contando `openspec/changes/archive/`, medidas con `grep` el 2026-09-22 en este árbol).
  `estadoPorRemision.ts`, **20 en 7**. Barrido obligatorio, y con el ancla del árbol de cierre, no de
  `125ae3e`.
- **Regla de mutación 3: no aplica.** Esta tanda no toca `apps/desk/src`. Se declara para que conste
  que se miró.
- **Maestro (`toca_maestro: si`) — entrada 17** de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`
  (la última hoy es la 16, `:853-857`), en texto listo para pegar, con **dos** partes: (a) M1.3.3
  (`:1198`) y Anexo F (`:4413`) dicen «Faltan dos y no se sabe cuáles» — el hueco está cerrado por
  M1.3.7 y por el recuento de §3; (b) M1.3.3 (`:1198`) dice de los dos pasos «Lo que no tienen es
  `from` ni `to`» — tras P-2 es falso. La entrada **11** ya corrigió otra frase de ese mismo pasaje
  (`:488`): es el mismo párrafo, otra vez.
- **`docs/artefactos/NOTA.md`**: §3 («NO HAY GENERADOR») y §6 («Cómo actualizarlo hoy») pasan a
  describir el generador nuevo. El aviso de caducidad del `.html` **no se retira**: sigue siendo cierto.
- **`openspec/config.yaml`**: `mapa-blueprint` en `capabilities` (R-2).

## 9 · Áreas afectadas

| Área | Impacto | Qué cambia |
|---|---|---|
| `packages/shared/src/<módulo>.ts` + prueba | Nuevo | Función pura grafo → Mermaid, mapa de fases |
| `scripts/generar-mapa-blueprint.ts` + `package.json` | Nuevo | CLI de escritura y su `npm run` |
| `docs/artefactos/blueprint-*.md` | Nuevo (generado) | Cuatro ficheros: completo + tres fases |
| `packages/shared/src/transitions.ts:150-151` | Modificado **en sitio** | `from`/`to` en las dos constantes |
| `apps/desk/server/db/estadoPorRemision.ts` | Modificado | Guarda y destino derivados de la declaración |
| `packages/shared/src/invariantesGrafo.test.ts:108-127` | Modificado | Invariante 5b invertido |
| `openspec/specs/mapa-blueprint/` · delta `transitions-st` · `config.yaml` | Nuevo / delta | §4 |
| `docs/artefactos/NOTA.md` · `F0-01_Correcciones_para_el_maestro.md` | Modificado | §8 |

## 10 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Mover líneas de `transitions.ts` desfasa ~180 citas | **Alta** | Edición **en sitio** de `:150-151`, sin insertar ni borrar líneas; barrido de cierre igual (§8) |
| El invariante 5b se invierte y alguien lo lee como regresión | Media | El comentario de `:108-119` se reescribe explicando el porqué, y P-2 lo declara aquí |
| Un `.md` generado se edita a mano y nadie se entera | Media | Es exactamente la prueba 3 de §7; y cabecera «generado, no editar» en cada fichero |
| Renderizado Mermaid: 38 aristas en un diagrama ilegible | Media | Para eso están las tres vistas por fase (H-3); si el completo no se lee, sigue siendo la fuente exacta |
| El `apply` no cabe en 800 líneas | **Alta** | §11: dos intentos, o techo aprobado por Gerencia |

## 11 · Presupuesto (techo 800 por intento, `openspec/config.yaml:22-30`)

- **Código y pruebas:** módulo + prueba ~280–360; CLI ~40; `transitions.ts` 2 en sitio;
  `estadoPorRemision.ts` ~8; invariante 5b ~25.
- **Artefactos generados:** ~200–260 líneas de `.md` (no son riesgo de revisión — son salida de la
  función que sí se revisa —, pero **sí** cuentan en el ledger vía `wc -l` de lo nuevo sin trackear).
- **Specs y cierre documental:** spec nueva ~110–150, delta ~70, `config.yaml` ~4, `NOTA.md` ~20,
  entrada 17 ~50.
- **Total del apply: ~800–1.000.** *Hipótesis:* **no cabe en un intento.** Corte natural: (A) datos y
  motor —P-2, invariante, función pura y sus pruebas—; (B) artefactos generados, specs y cierre
  documental. El **`verify-report.md` es sumando aparte** (186–358 por precedentes) y va en intento
  propio. El `archive` necesita techo propio (regla del ciclo 2).
- **Presupuesto de revisión (400 líneas):** riesgo **alto**. `sdd-tasks` decide si van PR encadenados;
  el corte A/B ya sirve de troceo.

## 12 · Plan de vuelta atrás

Revertir los commits. No hay migración, ni esquema, ni dato escrito en base: la salida son cuatro `.md`
nuevos y el cambio de fuente de una guarda que **no cambia de comportamiento** (§7, criterio 6).
Revertir devuelve `transitions.ts:150-151` y `estadoPorRemision.ts` a su forma de hoy y borra los
artefactos; nada que reparar.

## 13 · Ronda de preguntas — abierta, no resuelta por el ejecutor

El preflight es `interactive` (`openspec/config.yaml:22-30`). El ejecutor de fase no tiene canal con el
usuario: van aquí, con el supuesto que se ha usado mientras tanto.

1. **¿Capacidad propia o dentro de `transitions-st`?** Supuesto: propia (`mapa-blueprint`), porque el
   contrato del artefacto no es un requisito del motor. Cambiarlo no cambia el trabajo.
2. **¿Quién abre el mapa y cada cuánto?** `NOTA.md:97-99` (era `:84-86` en `125ae3e`, reanclada tras Unidad C) deja abierto justo esto y lo manda a
   Gerencia. Supuesto: entregable de consulta, no de operación diaria — por eso basta `.md` en el
   repositorio, sin publicación ni enlace desde la aplicación.
3. **¿La vista por fase repite las transiciones frontera en las dos vistas, o se corta por una?**
   Supuesto: repetir y anotar (P-3), porque cortar obliga a elegir un lado y ninguna elección es
   derivable del grafo.
4. **¿El mapa completo debe llevar la leyenda por área que llevaba el `.html`?** Supuesto: sí, leyenda
   por área; fichas de hallazgos no (H-2, ya decidido por el maestro).

## 14 · Criterios de éxito

- [ ] `npm run <script>` regenera los cuatro `docs/artefactos/blueprint-*.md` y el árbol queda limpio.
- [ ] Los seis criterios de §7 en verde, con la fase roja registrada, incluida la **mutación del
      fichero vigilado** (criterio 3).
- [ ] El diagrama completo tiene **38** aristas y la cuenta está fijada por aserción, no por comentario.
- [ ] `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` en verde.
- [ ] `estadoPorRemision.test.ts` en verde **sin tocar sus aserciones**.
- [ ] Barrido de la regla de mutación 4 hecho por escrito sobre `transitions.ts` y `estadoPorRemision.ts`.
- [ ] `mapa-blueprint` en `capabilities`; `NOTA.md` §3 y §6 actualizadas; entrada 17 escrita.
- [ ] El `archive-report.md` dice en su línea de `cierra` qué parte de la fila F1A-06 cubrió — y que el
      hueco 38/36 quedó cerrado con la cuenta de §3.
