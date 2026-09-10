# Design: Reasignar desvíos huérfanos tras el cierre de F1A

## Nota de retrofit

La reasignación de destinos (los cuatro/cinco desvíos vivos, `CLAUDE.md` y `openspec/config.yaml`) ya
está commiteada en `56ff441` (base `607e26a`, rama `main`) y verificada contra disco: `CLAUDE.md:188-208`
y `openspec/config.yaml:413-433` (entrada IV-4) ya muestran los destinos nuevos y la cita corregida
`remision.ts:218-226`. Este `design.md` cubre sólo los dos matices de contenido que **no** estaban
resueltos: citas caducas en specs vivas, y un comentario cruzado entre dos pruebas.

**Hallazgo de método**: el bloque `CLAUDE.md` inyectado al inicio de esta conversación (snapshot de
contexto) muestra la tabla **anterior** a `56ff441` (destinos "F1A" y cita "`:189-197`"). Leído
directamente de disco, `CLAUDE.md:115-134` ya está actualizado. Es exactamente la advertencia que el
propio fichero hace en su último párrafo: *"este fichero... pueden estar caducos... compruébese contra
el código"* — aplicada aquí a un snapshot de contexto, no sólo a la memoria de un agente.

## Technical Approach

Documentación pura, cero cambio de comportamiento. Dos matices, tratados por separado porque tienen
detectores y riesgos distintos:

1. **Citas caducas**: `apps/desk/server/routes/remision.ts` movió su bloque de captura de orden de
   venta 29 líneas hacia abajo cuando F1B-01 insertó la guarda del serial delante. Seis citas en dos
   specs vivas siguen apuntando a los números de línea de antes del movimiento.
2. **Comentario cruzado**: dos pruebas en `ticketService.test.ts` fijan el mismo escenario (falta el
   equipo *y* la OV ya está usada) con títulos y expectativas de código HTTP literalmente opuestos, y
   ninguna de las dos remite a la otra.

## Architecture Decisions

### Decision: Alcance de la corrección de citas — sólo specs vivas

**Choice**: corregir únicamente las seis ubicaciones verificadas contra disco (tabla de la sección
siguiente); no tocar `openspec/changes/F0-01/proposal.md:120` ni `F0-04/proposal.md:194`.

**Alternatives considered**: reescribir también las citas de los dos proposals archivados, por
consistencia global del repositorio.

**Rationale**: un proposal archivado es fotografía histórica de lo que era cierto cuando se escribió
(verificado: `F0-01/proposal.md:120` y `F0-04/proposal.md:194` citan la numeración vieja porque en esa
fecha era la correcta). Editarlo con la numeración de hoy falsificaría el registro histórico. Sólo las
specs vivas —las que un agente lee y da por ciertas en cada sesión— necesitan la cita corriente.

### Decision: El comentario cruzado se redacta como referencia, no como resolución

**Choice**: una línea de comentario en cada `it(...)` (`:176` y `:295`) que señale el número de línea de
la prueba opuesta, sin declarar cuál de los dos criterios de precedencia es el correcto.

**Alternatives considered**: resolver ahora la inversión de precedencia (unificar el orden 409/422).

**Rationale**: la propia tabla de riesgos del proposal (`proposal.md:81`) ya identifica el peligro de
que el comentario se lea como resolución, y la unificación de precedencia es explícitamente F1B-10,
fuera de alcance de este cambio.

### Decision: El hueco de `remisiones/spec.md` §5.1 se deja como pregunta abierta, no se cierra aquí

**Choice**: no ampliar por cuenta propia las seis ubicaciones dadas para incluir el encabezado
`§5.1` (`remisiones/spec.md:349`, que sigue diciendo *"destino F1A"*) ni la frase "retirar, no añadir
puerta" que el hallazgo de abajo muestra que falta ahí.

**Alternatives considered**: añadir esa frase y corregir el encabezado dentro de esta misma tanda,
puesto que la edición ya toca ese párrafo para las citas de `:356/:361/:362`.

**Rationale**: las seis ubicaciones fueron enumeradas explícitamente por quien encargó este diseño
("no explores"); ampliar el alcance sin una decisión explícita arriesga scope creep en un retrofit
que se definió como cerrado. Se deja documentado como hallazgo verificado para que `sdd-tasks` decida.

## Data Flow

    F1B-01 (código, ya commiteado)
    apps/desk/server/routes/remision.ts
    bloque OV: :189-197 ──(+29 líneas, guarda de serial insertada delante)──▶ :218-226
                                                                                 │
                    ┌────────────────────────────────────────────────────────────┘
                    │  seis citas en specs vivas quedaron apuntando al número viejo
                    ▼
    openspec/specs/remisiones/spec.md      (:34, :356, :361, :362, :438)
    openspec/specs/transitions-st/spec.md  (:484)
                    │
                    └──▶ esta tanda actualiza los seis números, sin tocar el texto que los rodea

## Mapeo de citas verificado contra disco

| Ubicación de la cita | Cita vieja | Cita correcta (verificada) |
|---|---|---|
| `remisiones/spec.md:34` | `routes/remision.ts:189-197` | `routes/remision.ts:218-226` |
| `remisiones/spec.md:356` | `remision.ts:189-197`; UPDATE en `:192-196` | `remision.ts:218-226`; UPDATE en `:221-225` |
| `remisiones/spec.md:361` | `remision.ts:194` (WHERE … COALESCE) | `remision.ts:223` |
| `remisiones/spec.md:362` | `:185-187` ("en gris") | `:214-216` |
| `remisiones/spec.md:438` | `routes/remision.ts:189-197` | `routes/remision.ts:218-226` |
| `transitions-st/spec.md:484` | `apps/desk/server/routes/remision.ts:189-197` | `apps/desk/server/routes/remision.ts:218-226` |

**Corrección al mapeo recibido**: el encargo daba `:185-187` → `:206-215` para la cita "en gris". Verificado
contra `apps/desk/server/routes/remision.ts:205-217` (bloque de comentario completo) el desplazamiento es
uniforme de +29 líneas en todo el bloque, y la frase «la enseña en gris» está hoy en `:214-216`
(`—por eso el formulario la enseña en gris— y así dos remisiones simultáneas no pueden colar`, `:215`).
`:206-215` no corresponde a esa frase en el código actual; usar `:214-216` en `tasks.md`.

No se tocan: `openspec/changes/F0-01/proposal.md:120`, `openspec/changes/F0-04/proposal.md:194`
(archivados, registro histórico — citan la numeración vieja porque era correcta cuando se escribieron).

## File Changes

| File | Action | Description |
|------|--------|--------------|
| `openspec/specs/remisiones/spec.md` | Modify | Actualiza 5 citas (`:34,:356,:361,:362,:438`) a la numeración post-F1B-01. No toca prosa ni encabezados. |
| `openspec/specs/transitions-st/spec.md` | Modify | Actualiza 1 cita (`:484`) a la numeración post-F1B-01. |
| `apps/desk/server/services/ticketService.test.ts` | Modify | Comentario de una línea en `:176` y `:295`, cada uno remitiendo al número de la prueba opuesta. Cero cambio de código ejecutable. |

## Interfaces / Contracts

No aplica — no hay tipos, API ni contratos nuevos. El "contrato" de esta tanda es textual: cada cita
corregida debe seguir señalando la misma pieza de código que señalaba antes, sólo que en su línea
correcta.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Que el comentario añadido a `ticketService.test.ts:176`/`:295` no altera el resultado de la prueba | `npm test` antes y después; mismo recuento de pruebas en verde (Success Criteria del proposal) |
| Integration | No aplica | Cambio de documentación y comentarios; no hay ruta de integración afectada |
| E2E | No aplica | Sin cambio de comportamiento observable |

## Threat Matrix

N/A — no hay routing, shell, subprocess, automatización de VCS/PR, clasificación de fichero ejecutable
ni integración de proceso. Son ediciones de markdown y un comentario de una línea en un fichero de
prueba ya verde.

## Migration / Rollout

No se requiere migración. Rollback ya descrito en el proposal: `git revert` del commit de esta tanda
(`proposal.md:86-87`); no toca código de producción ni cambia el resultado de ningún test existente.

## Qué añade el ciclo SDD, y qué no

**Sé honesto: la respuesta es "poco", y hay que escribirlo con esas palabras.**

**Lo que el ciclo SÍ aporta, medido hoy.** Nueve citas caducas de `remision.ts:189-197` quedaron
repartidas por specs y config cuando F1B-01 movió el bloque, y hubo que cazarlas a mano una por una
—exactamente lo que un `sdd-archive` que funde deltas en vez de editar siete specs sueltas evitaría.
Es un beneficio concreto y medido, no una promesa. El segundo aporte es el router: `gentle-ai
sdd-status <change> --cwd <repo>` devuelve un campo `next:` determinista en vez de que el orquestador
decida de memoria qué fase toca — quita una fuente de error humano, no de razonamiento.

**Lo que el ciclo NO aporta, y también hay que decirlo.** El contenido salió igual de bien sin él.
Cinco tandas el 2026-09-09 (`ec0ed1f`, `6ea3ca8`+`5218d11`, `e8c5e90`, `43821b8`, `c45bcb1`, `607e26a`,
`56ff441`) produjeron trabajo verificado —evidencia ruta:línea, tabla de mutaciones, cuatro cifras— y
ninguna corrió el ciclo SDD. La especificidad vivía en el prompt de cada tanda, no en el ciclo: tabla de
mutaciones con detector propio por pieza, ruta y línea en toda afirmación, cifras salidas del comando
que las produjo, puntos de parada explícitos. Nada de eso lo suministra `sdd-design` ni ningún otro
agente de fase. Y hay una razón estructural: **los agentes de fase no tienen Bash.** `sdd-propose` no
pudo ejecutar `git show 56ff441` para este mismo cambio y tuvo que verificar contra el árbol de trabajo,
declarándolo hipótesis en su lugar. Medir, mutar, ejecutar pruebas y producir cifras ocurre fuera de las
fases, en el orquestador — el ciclo ordena el papeleo, no aporta el rigor.

**Y un tercer coste, que esta misma tanda demostró en vivo.** Los agentes de fase reciben el
`CLAUDE.md` del proyecto **inyectado como contexto de sesión**, y esa copia es una **instantánea del
arranque**: no refleja lo que se ha escrito después. Aquí los dos agentes se toparon con ella y
reaccionaron distinto. `sdd-design` desconfió, releyó de disco y lo dejó anotado —«el `CLAUDE.md`
inyectado está caduco; leído directo de disco ya está reasignado»—. `sdd-spec` la tomó por buena y
reportó como riesgo que «`CLAUDE.md` todavía dice F1A», que es **falso**: `56ff441` lo reasignó y el
disco lo confirma. Dos agentes, la misma entrada envenenada, un acierto y un error.

La lección no es que un agente fallara: es que **delegar una fase multiplica las copias del contexto**,
y cada copia envejece por su cuenta. La regla de método del proyecto —«este fichero PUEDE ESTAR CADUCO;
compruébalo contra el código»— no era retórica para humanos: aplica a cada sub-agente, y hay que
escribirla en el encargo porque el arnés no la garantiza.

Un cuarto dato del mismo signo, y va contra mí: **dos de los cinco mapeos de línea que le di al agente
de diseño estaban mal** (`:185-187`→`:206-215` cuando era `:214-216`, y `:176-179`→`:206-209` cuando era
`:205-208`). El agente verificó contra disco, cazó el primero y me corrigió; el segundo salió al
comprobarlo yo contra `607e26a~1`. En la tanda cuyo tema son las citas caducas, el orquestador produjo
dos. El ciclo no lo habría evitado; **verificar contra disco, sí**.

**Y un límite del router, visto al cerrar esta misma tanda.** Con `tasks.md` escrito, el router pasó a
`next: apply` y `apply: ready` con `tasks: 9/12 complete`. Pero las **tres pendientes son decisiones de
Gerencia** —nº 52, la vista «Todos», y aplicar la entrada 5 al plan—, y ninguna la puede ejecutar quien
corre el ciclo. El router enruta por «quedan tareas sin marcar», no por «quedan tareas accionables por
mí», así que puede señalar `apply` cuando lo que falta es que decida una persona. **Obedecer el campo
`next:` a ciegas habría llevado a una fase `apply` vacía, o peor, a inventarle trabajo.** El router
quita la duda de qué fase toca; no quita la de si esa fase tiene algo que hacer.

**Conclusión.** El ciclo aporta contabilidad y un router determinista, no rigor. El rigor sigue viniendo
del prompt de cada tanda; escribirlo en `design.md` y `tasks.md` es la manera de que sobreviva entre
fases, no un sustituto de tenerlo.

## Open Questions

- [x] **CERRADA durante esta misma tanda.** `remisiones/spec.md` §5.1 seguía con «destino F1A» y sin la
      frase «retirar, no añadir puerta». Se cerró: hoy dice **«destino REASIGNADO: punto abierto nº 52»**
      y lleva el enmarcado invertido completo, con la cita literal de `R08.1.md:2071-2079`. El Success
      Criteria del proposal queda cumplido por las **dos** specs, no sólo por `tickets-core`.
      *Y al cerrarla aparecieron tres apartados más igual de huérfanos que el barrido de `56ff441` no
      había visto:* `remisiones` §5.3 (variables de entorno → **sin tanda asignada**), `transitions-st`
      §3.4 (→ nº 52) y `transitions-st` §3.6 (→ **F1B-08**). Los cuatro reasignados en esta tanda.
      **Lección:** el barrido anterior tocó los dos registros (`CLAUDE.md`, `config.yaml`) y dos
      apartados de spec, y dio el trabajo por hecho. Los destinos también viven en las specs, y allí
      quedaban cuatro. Un barrido que no es exhaustivo es un barrido que hay que repetir.

- [ ] **De Gerencia, no de esta tanda.** Punto abierto **nº 52** (cardinalidad OV↔ticket) y la decisión
      de la vista «Todos». Ninguna de las dos tiene clave en la tabla de decisiones del plan
      (`plan:348-359`): redactadas como entradas 5.b y 5.c del fichero de correcciones.
