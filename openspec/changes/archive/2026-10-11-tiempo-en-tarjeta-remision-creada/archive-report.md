# Archive · `tiempo-en-tarjeta-remision-creada` (F1B-07, `cierra: si`)

**Fecha:** 2026-10-11 · **Rama:** `tiempo-en-tarjeta-remision-creada` · **Partida:** `34e5e85` · **Informe escrito por el orquestador**, con cifras
medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué cubre la fila F1B-07 entera, en una línea:** `prioridad-top5-cliente` (prioridad del cliente Top 5, ajuste por ticket, cola del
taller y «Mis tickets»), `propagar-top5-lista-remision-creada` (propagación del Top 5 a los tickets abiertos y lista de «Remisión
creada» para Comercial), `prioridad-tres-niveles` (los tres niveles y el ajuste también por el Director Técnico) y éste (el tiempo en
el estado, en días hábiles, en esa lista) cubren los tres contenidos de la fila
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:87`); no queda construcción pendiente. Por eso declara `cierra: si`.

## Qué decisión construye

`decision/f1b07-tiempo-en-tarjeta-y-cierre-11-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`): responde E-192 —sí, la
tarjeta muestra el tiempo transcurrido en días hábiles— y fija que este cambio, archivado, declara el cierre de la fila.

## Límite del `cierra: si` — lo que NO se puede comprobar desde el repositorio

Lo único que sostenía el `cierra: no` de `prioridad-tres-niveles` era la valoración del cliente sin contrato ni Top 5
(`openspec/changes/archive/2026-10-08-prioridad-tres-niveles/archive-report.md:6-8`). Que eso no sea construcción pendiente lo dice
`decision/prioridad-clientes-sin-contrato` —no existe valoración legible del cliente y no hay nivel «baja» hasta después del corte—,
que a esta fecha está **sin versionar**: vive en el árbol de Supervisión. **Este cierre se apoya en la palabra de Gerencia sobre ese
punto, no en una prueba del repositorio** (W1 del verify). Queda verificable el día que ese bloque se versione.

## Qué se construyó

- **El servidor calcula el número.** Cada elemento de `GET /api/remision-creada` trae `diasHabilesEnEstado: number | null`
  (`apps/desk/server/db/listaRemisionCreada.ts:16`), con una sola lectura de cierres (`apps/desk/server/db/listaRemisionCreada.ts:15`)
  y `ahora` inyectable (`apps/desk/server/db/listaRemisionCreada.ts:13`). La ruta no se editó.
- **Dos funciones puras en `packages/shared/src/tiempoEnEstado.ts`:** `diasHabilesEnEstado` (día civil en la zona de negocio y
  `diasHabilesEntre`) y `textoTiempoEnEstado`. El listado de activos y «Mis tickets» no traen el campo.
- **La pantalla sólo pinta:** `apps/desk/src/components/DistintivoTiempoEnEstado.tsx`, gris, enganchado en tarjeta, lista y tabla
  junto al distintivo de garantía. Ningún cálculo de días hábiles en `apps/desk/src`.
- **Sin migración, sin columna y sin variables.** No se tocó el orden de la lista ni ninguna alarma.
- **Texto exacto en pantalla:** «Menos de 1 día hábil», «1 día hábil», «3 días hábiles» (y así con cualquier número), o «Sin fecha de
  entrada».

## Delta fusionado

`vistas-tablero`: **RQ-VT-16 ADDED**, añadido al final de `openspec/specs/vistas-tablero/spec.md` por script, bloque idéntico al
delta (86 líneas desde la 851; el fichero pasa de 849 a 936). RQ-VT-10 no se modificó. Ninguna capacidad nueva (R-2 no aplica).

## Medida por intento

| Intento | Qué | Medida (`git diff --shortstat --no-renames`) | Techo |
|---|---|---|---|
| 1 | Propuesta, especificación, diseño y tareas (`dc8c822`) | 404 | 800 |
| 2 | Apply (`73123f4`, `ece713c`, `cec8ad1`) | 311 | 800 |
| 3 | Verify (`4f09e13`, informe de 109 líneas) | 109 | 800 |
| 4 | Archive | parte revisable medida antes de aplicar: fusión del delta 87 + este informe + la fila del plan (1 y 1); la mudanza de la carpeta queda fuera del techo (regla del archivo) | 800 revisable |

Sin binarios y sin ficheros nuevos sin trackear al cerrar cada intento.

## Verificación

- **Verify: PASS con avisos** — 0 CRITICAL, 3 WARNING, 3 SUGGESTION (`verify-report.md` de este cambio).
- **Códigos, mirados uno a uno sobre `cec8ad1`:** `npm test` 0 (267 ficheros pasan y 3 se saltan; 4.408 pruebas pasan y 11 se
  saltan, las de integración sin `TEST_DATABASE_URL`), `npm run typecheck` 0, `eslint . --max-warnings 165` 0 (165 avisos, ninguno
  nuevo), detector de citas `--sha HEAD` 0.
- **Mutaciones:** M1 a M10 del apply (14 variantes) y A1 a A7 del verify, todas rojas y restauradas; el orquestador repitió tres
  (cierres vacíos, contar el día de entrada, campo ausente pintado). Ninguna sobrevive.
- **Regla de mutación 4:** los ficheros existentes se editaron en sitio o al final; ninguna línea citada se movió y no hubo citas
  que reapuntar.
- **Regla de mutación 3:** el cliente no bloquea, no rellena y no avisa; el dato lo produce
  `apps/desk/server/db/listaRemisionCreada.ts:16`.

## Qué quedó probado y qué no

- **Probado:** la cuenta `(desde, hasta]`, fines de semana, festivos, cierres sembrados, zona de negocio, `null` sin entrada, los
  textos exactos, el campo sólo en esta lista, una sola lectura de cierres, el orden intacto.
- **Sin probar:** cómo se ve en pantalla —gris, y que quepa en la fila de la lista y en la celda de la tabla—, porque los `.tsx`
  quedan fuera de la red de pruebas por decisión de Gerencia (W3); y el número exacto por HTTP, porque la ruta usa el reloj real.

## Supuestos reversibles — plazo hasta el 2026-10-18 (regla de las preguntas a Gerencia, E-237)

De este cambio:

| | Supuesto |
|---|---|
| T1 | El día de entrada no cuenta: días hábiles posteriores al de entrada y hasta hoy inclusive |
| T2 | 0 → «Menos de 1 día hábil»; 1 → «1 día hábil»; n → «n días hábiles». No se usa «hoy»: 0 también sale si entró en festivo o fin de semana |
| T3 | Sin fecha de entrada: «Sin fecha de entrada» |
| T4 | Gris, nunca ámbar ni rojo |
| T5 | Sólo en la vista de «Remisión creada» |
| T6 | El día civil se toma en la zona de negocio (Bogotá) |
| T7 | Se pinta en los tres modos de la vista —tarjeta, lista y tabla—, no sólo en la tarjeta. **Amplía la letra de la decisión**, que dice «la tarjeta» |

**Dos relojes, declarado (molde H5):** la alarma de «Remisión creada» mide 27 horas hábiles (`packages/shared/src/sla.ts:34`) y el
distintivo cuenta días civiles hábiles. Un ticket que entra un lunes a las 16:00 dice «3 días hábiles» el jueves a las 9:00 con 20
horas hábiles y sin alarma. Lo fija `packages/shared/src/tiempoEnEstado.test.ts:61-70`.

Heredados de la fila, **aplicados y NO respondidos por Gerencia** —archivar no los da por respondidos—: E-188, E-189, E-190, E-191 y
E-193 de `docs/sdd/ENTRADA.md`, con el mismo plazo. **E-193 describe hoy algo que ya no es cierto** (W2): dice que la base es la
prioridad pedida en el alta, y el alta pasa la constante por defecto (`apps/desk/server/services/ticketService.ts:106`,
`apps/desk/server/services/ticketService.ts:108`); la pregunta de fondo sigue abierta y el texto de la bandeja lo corrige quien la
mantiene. E-194 no bloquea: donde volvería a verse es la aceptación con servicios reales.

## Tareas de persona — fuera del recuento; archivar no las da por hechas

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Ver el distintivo en la aplicación, en tarjeta, lista y tabla, tras desplegar | Alfonso | `tasks.md` de este cambio |
| Corregir T1 a T7 y responder E-188 a E-191 y E-193 antes del 2026-10-18 | Gerencia | lista semanal de supuestos y `docs/sdd/ENTRADA.md` |
| Versionar `decision/prioridad-clientes-sin-contrato` y marcar E-192 como respondida | Supervisión | `openspec/config.yaml` y `docs/sdd/ENTRADA.md` |

## Despliegue

Sólo el servicio `ambientalia-desk`. Cambia el cliente: el `index-*.js` del build será otro. Sin migración ni variables.
