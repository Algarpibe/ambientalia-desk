# Diseño — `codigo-servicio-bloqueado` (`fuera-del-plan`, `cierra: no`)

Cómo se construye `proposal.md` (S-1…S-8). Todo lo medido aquí lo está contra el árbol del worktree en esta fase. **Ninguna línea existente
se desplaza:** las ediciones a ficheros citados son en sitio, en la misma línea física; lo nuevo va en ficheros nuevos o al final.
**Matriz de amenazas:** N/A — sin enrutado, shell, subprocesos, automatización de VCS/PR ni integración de procesos.

## Decisiones

**D1 · Fichero nuevo `packages/shared/src/codigoServicio.ts`.** Exporta `CLAVE_CODIGO_SERVICIO = 'Código Servicio'`,
`CLAVE_CODIGO_SERVICIO_ANTERIOR = 'Código Servicio anterior'`, `MENSAJE_CODIGO_BLOQUEADO`, `puedeCambiarCodigoServicio(s)` (= `s.isAdmin`),
`cambiaCodigoSinPermiso`, `propuestaCodigoServicio` y `valoresConCodigoPrevio`. Se reexporta con `export * from './codigoServicio'` como
**línea 56 nueva al final** de `packages/shared/src/index.ts` (hoy acaba en `:55`). *Descartado:* añadir a `prioridad.ts` o `ticketCreate.ts`:
cualquier inserción desplaza `prioridad.ts:81-86` y `ticketCreate.ts:47-49`, citados.

**D2 · El predicado, por la clave del campo.** `cambiaCodigoSinPermiso(t: Pick<Transition,'fields'>, valores: unknown, actual: string | null, s: Pick<SujetoDePermiso,'isAdmin'>)`:
falso si ningún campo tiene `key === CLAVE_CODIGO_SERVICIO`; falso si `actual` recortado es vacío (primera vez, S-2); falso si el pedido es
`undefined`, `null` o `''` —la MISMA definición de vacío que `apps/desk/server/transitionExec.ts:44`, para que caiga en «Falta el campo obligatorio»
de `apps/desk/server/transitionExec.ts:77`—; si no, `String(pedido).trim() !== actual.trim() && !puedeCambiarCodigoServicio(s)`. Un pedido
de sólo espacios **no** es vacío en `:44` y se escribiría (`apps/desk/server/transitionExec.ts:34`), así que aquí cuenta como cambio y da `403`.
Se busca por `key` y no por id de transición porque `buildTransitionPlan` resuelve la columna por `f.key` (`apps/desk/server/transitionExec.ts:90-91`)
y los `values` llegan indexados por clave: cubre `ingreso_a_servicio` (`packages/shared/src/transitions.ts:191`) y `calibracion_directa`
(`packages/shared/src/transitions.ts:262`) y cualquier transición futura con el campo (S-7). *Descartado:* lista de ids (se olvida la tercera).

**D3 · La propuesta reutiliza `buildCodigoServicio`, ensanchando su fecha.** `propuestaCodigoServicio({ clasificacion, tipoServicio, serie, modelo, creadoEn })`
= `buildCodigoServicio({ prefijo: prefijoDeducido(clasificacion, tipoServicio), serie: serie ?? '', modelo: modelo ?? '', fecha: creadoEn })`.
Para eso, dos ediciones en sitio en `packages/shared/src/ticketCreate.ts`: `:7` `yymmdd(d: Date)` → `yymmdd(d: unknown)` y `:12` `fecha: Date` →
`fecha: Date | string | null`. `diaEnZona` (`packages/shared/src/fechasDerivadas.ts:63-73`) ya acepta `Date`, `YYYY-MM-DD` (directa) e ISO con
desplazamiento (día de Bogotá); lo ilegible da `''` y la parte se omite (`packages/shared/src/ticketCreate.ts:13`). El alta sigue pasando
`new Date()` (`apps/desk/server/services/ticketService.ts:101`): sin cambio de comportamiento. *Descartado:* fabricar un `Date` a mediodía
de Bogotá desde la `YYYY-MM-DD` (truco de zona escondido) o duplicar el formato (regla 13, punto 1).

**D4 · Guarda en el servidor: en sitio, en `apps/desk/server/services/ticketService.ts:131`, justo detrás del `403` de prioridad.** Se inserta en
esa línea, tras `throw new HttpError(403, { error: MENSAJE_PRIORIDAD_BLOQUEADA });` y antes de `const entran = …`:
`if (cambiaCodigoSinPermiso(t, b.values, current.row.codigo_servicio ?? null, user)) throw new HttpError(403, { error: MENSAJE_CODIGO_BLOQUEADO })`
con un comentario corto sin `;`. Los tres nombres se añaden al final de la lista de `:6`. Orden resultante: estado `409` (`:126-128`) <
interruptores y `exigirCalibracionDirecta` `409` (`:128`) < área `403` (`:129-130`) < cargo, ejecutor, Decisionales, firma, prioridad (`:131`) <
**código `403`** < OVI que entra, verificación, alta, remisión (`:131`) < agregado `422` de C (`:134`). Mensaje:
**«El código de servicio de este ticket ya está fijado: sólo un administrador puede cambiarlo»**. *Descartado:* función al final del fichero
(molde `exigirFirmaControlCalidad`): para un `if` síncrono basta la línea, como la prioridad.

**D5 · Vecinos no observables, dicho y vigilado.** Para las dos transiciones con el campo: ninguna lleva `priority`, ninguna es Decisional,
de salida de espera, de control de calidad, de liberación ni `habilitar_servicio`, y la única excepción de cargo es `liberacion_sin_factura`
(`packages/shared/src/cargos.ts:32`). Una prueba de catálogo fija que **ninguna transición lleva a la vez `priority` y `Código Servicio`**: si
alguien la crea, se pone roja y obliga a escribir la prueba de posición que hoy no cabe.

**D6 · Traza: el valor previo en `values`, sin tabla.** En sitio en `apps/desk/server/services/ticketService.ts:155`: `valoresConMotivo(values, gas)` →
`valoresConCodigoPrevio(valoresConMotivo(values, gas), t, current.row.codigo_servicio ?? null)`. La función **borra siempre** la clave
`CLAVE_CODIGO_SERVICIO_ANTERIOR` del cuerpo (hecho derivado, molde de `packages/shared/src/gasPatron.ts:96-99`) y la pone con el previo
**cuando la transición lleva el campo, el previo recortado no es vacío y el nuevo recortado es distinto**. Definido por el dato, no por el rol:
tras D4 sólo un administrador llega ahí, y si el permiso cambiara la traza seguiría siendo cierta. Llega a `ticket_transitions.values`
(`packages/zoho-sync/src/db/repo.ts:317`). **El historial no cambia:** `etiquetaCampo` (`apps/desk/server/db/ticketFuentes.ts:82-85`) sólo
cambia `_` por espacio y pone la mayúscula inicial, así que la clave con forma de etiqueta se enseña como «Código Servicio anterior», junto a
«Código Servicio» (`apps/desk/server/db/historial.ts:61`). *Descartado:* clave `codigo_servicio_anterior` (saldría «Codigo servicio anterior», sin
tilde, o exigiría tocar `ETIQUETA_CLAVE_PROPIA` en `packages/shared/src/gasPatron.ts:53-56`, insertando una línea); tabla propia (S-5).

**D7 · Cliente: tres ediciones en sitio en `apps/desk/src/components/TransitionPanel.tsx`, ningún dato nuevo.** El panel ya tiene `user`
con `isAdmin` (`:55`; `packages/shared/src/types.ts:215`), `clasificacion` (`:40`) y `delTicket`, que trae `Tipo de Servicio`, `Serial` y
`Modelo de equipo` (`packages/zoho-sync/src/db/rows.ts:87`, `:90-91`) y `Fecha creación ticket`, que `valoresConocidos` deriva del `createdAt`
del ticket en día de Bogotá (`apps/desk/src/lib/valoresTransicion.ts:42-53`, `packages/shared/src/fechasDerivadas.ts:79`). Así se calcula en el
cliente con la función compartida y **no** se toca el `GET` ni `TicketDetailView.tsx`.
- `:8`: añadir `CLAVE_CODIGO_SERVICIO, propuestaCodigoServicio, puedeCambiarCodigoServicio` a la importación de `@ambientalia/shared`.
- `:80`: tras `previos[f.key] = delTicket[f.key]` añadir `; else if (f.key === CLAVE_CODIGO_SERVICIO) previos[f.key] = propuestaCodigoServicio({ … })`.
  La cadena sigue con el `else if` de la derivación (`:87`); las dos ramas son excluyentes.
- `:174`: `yaLoTraeElTicket(f, delTicket)` → `(yaLoTraeElTicket(f, delTicket) && !(f.key === CLAVE_CODIGO_SERVICIO && !!user && puedeCambiarCodigoServicio(user)))`.

**D8 · Casilla de la regla 13 (mutación 3), decisión a decisión.**

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Bloquear el código a quien no es administrador | `apps/desk/server/services/ticketService.ts:131`, `403` nuevo (D4): espejo legítimo, punto 3, probado por las pruebas de D9 |
| Desbloquearlo al administrador | La salida `puedeCambiarCodigoServicio` del MISMO predicado, en la misma línea |
| Prellenar la propuesta | **Comodidad, no bloquea nada:** editable; el servidor acepta cualquier primer código no vacío (S-3) |
| Asterisco de obligatorio | `apps/desk/server/transitionExec.ts:77` |

Los `.tsx` siguen fuera de la red de pruebas (F0-00); la lógica probada vive en `codigoServicio.ts`.

**D9 · Pruebas, rojo primero.** Dos ficheros nuevos; ningún fichero de pruebas existente se edita.
- `packages/shared/src/codigoServicio.test.ts`: tabla del predicado (sin campo; previo `null`/`''`/espacios; pedido `undefined`/`null`/`''`;
  mismo valor con espacios; distinto sin y con admin; sólo espacios con previo → `true`); las transiciones con el campo son exactamente
  `['ingreso_a_servicio','calibracion_directa']`; ninguna lleva `priority` y el código a la vez (D5); propuesta: prefijo por clasificación y
  tipo, ISO `…T03:00:00Z` → día anterior en Bogotá, `YYYY-MM-DD` directa, partes ausentes omitidas; `valoresConCodigoPrevio`: añade sólo con
  cambio y borra la clave inyectada.
- `apps/desk/server/codigoServicioBloqueado.test.ts`, con el arnés HTTP de `apps/desk/server/testing/appHarness.ts` (`instalarArnes`,
  `appWith({ controlCalidadLiberacion: true })` para el atajo, `adminCookie`, `userCookie`), molde `apps/desk/server/calibracionDirecta.test.ts:25-38`:
  **CB-1** técnico, código distinto, las dos transiciones → `403` con el mensaje, estado y columna intactos, 0 trazas (el rojo previo: hoy `200`);
  **CB-2** mismo valor con espacios → `200`; **CB-3** ticket sin código → `200` y columna fijada; **CB-4** admin → `200`, columna nueva, traza
  con previo y nuevo; **CB-5** clave `Código Servicio anterior` inyectada en un primer código → no llega a la traza; **CB-6** `''` con código →
  `422` «Falta el campo obligatorio: Código Servicio»; **CB-7** `CLAVE_CODIGO_SERVICIO` es la `label` de `codigo_servicio` en `PROMOTED_COLUMNS`
  (`packages/zoho-sync/src/db/rows.ts:86`) y `etiquetaCampo(CLAVE_CODIGO_SERVICIO_ANTERIOR)` la deja igual.
  **Posición (mutación 1), dos guardas a la vez:** **PB-1** usuario de Comercial con código distinto → `403` de área; **PB-2** técnico con
  código distinto y sin `Fecha Remisión Entrada` ni remisión → `403` nuevo, no `422`; **PB-3** `calibracion_directa` con tipo
  `Mantenimiento` y código distinto → `409` de `exigirCalibracionDirecta`; **PB-4** el atajo con el interruptor apagado → `409` de interruptor.

**D10 · Mutaciones.** Antes de cada una: copia del fichero al scratchpad y `file` (CRLF). Se muta con `perl -i -pe '… if $. == N'`, nunca `sed -i`;
se restaura copiando la copia, y se comprueba `sha256sum` igual y `file` con CRLF. Las rojas (fichero › nombre) van a `apply-progress.md`.
- **M0:** suite entera verde sin mutar.
- **M1 (posición), en `ticketService.ts`:** (a) quitar la guarda de `:131` y añadirla al final de `:134` → roja PB-2 (da `422`).
  (b) llevarla al final de `:128` → roja PB-1. (c) llevarla tras el `} ` inicial de `:128` → rojas PB-3 y PB-4.
- **M2 (condición), en `codigoServicio.ts`:** quitar `!puedeCambiarCodigoServicio(s)` → rojas la fila de admin y CB-4; quitar los `trim()` →
  rojas «mismo valor con espacios» y CB-2; quitar la salida del previo vacío → rojas su fila y CB-3. **M2b (fichero vigilado):** en
  `packages/shared/src/transitions.ts:262` cambiar `cfText('Código Servicio')` por `cfText('Codigo Servicio')` → rojas la lista de
  transiciones con el campo y CB-1 del atajo.
- **M3:** la tabla de D8.
- **M4 (barrido):** ninguna línea se desplaza; se comprueba con `git diff --numstat` (inserciones = borrados en `ticketService.ts`,
  `ticketCreate.ts`, `TransitionPanel.tsx`; `index.ts` `1 0`) y `wc -l`. Aun así, las líneas reescritas cambian lo que afirman:
  `git grep -noE "ticketService\.ts:[0-9]+(-[0-9]+)?"`, `git grep -noE "ticketCreate\.ts:[0-9]+(-[0-9]+)?"`,
  `git grep -noE "TransitionPanel\.tsx:[0-9]+(-[0-9]+)?"`; de cada resultado cuyo rango toque `ticketService.ts` 6, 131 o 155,
  `ticketCreate.ts` 7 o 12, o `TransitionPanel.tsx` 8, 80 o 174, se lee la frase y se clasifica A/B/C (hoy: 216 citas a esas líneas en 112
  ficheros, la mayoría en el archivo). Segundo pase de abreviadas en los ficheros que ya citan esos módulos:
  `git grep -nE "(^|[^0-9A-Za-z_./])(:6|:7|:8|:12|:80|:131|:155|:174)([^0-9]|$)" -- <ficheros del primer pase>`. Al cierre,
  `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`.

**D11 · Bundle, migración, interruptor.** El bundle **cambia** (TransitionPanel y el código compartido que consume): se anota el nombre nuevo.
Sin migración ni esquema: la memoria de «una vez» es el propio código no vacío (S-2). Sin interruptor: restringe y no enciende ningún
escritor (S-8; la regla de secretos pide interruptor a lo que enciende un escritor).

**D12 · Tamaño de i2 (apply), un solo lote.** Medida `git diff --shortstat --no-renames` más `wc -l` de lo nuevo: `codigoServicio.ts` ~50,
su prueba ~100, prueba del servidor ~190, ediciones en sitio 8 líneas (~16 contadas), `index.ts` +1, `apply-progress.md` ~120 → **~480**,
bajo 720. Si la medida real pasa de 720, se parte en lote 1 (shared + prueba) y lote 2 (servidor, cliente, prueba HTTP).

## Ficheros

| Fichero | Cambio |
|---|---|
| `packages/shared/src/codigoServicio.ts` · `codigoServicio.test.ts` | nuevos |
| `packages/shared/src/index.ts` | +1 línea al final |
| `packages/shared/src/ticketCreate.ts` | `:7`, `:12` en sitio |
| `apps/desk/server/services/ticketService.ts` | `:6`, `:131`, `:155` en sitio |
| `apps/desk/server/codigoServicioBloqueado.test.ts` | nuevo |
| `apps/desk/src/components/TransitionPanel.tsx` | `:8`, `:80`, `:174` en sitio |

## Riesgos y preguntas

- Un administrador puede fijar un código de sólo espacios o con espacios alrededor: se guarda sin recortar, fuera de alcance (proposal §3).
- *Hipótesis:* ninguna prueba existente ejecuta las dos transiciones como no administrador sobre un ticket con código (los ajustes vistos insertan
  tickets sin `codigo_servicio`); lo confirma M0 tras implementar.
- Observado, no se corrige: `yaLoTraeElTicket` bloquea también `Serial` y `Orden de Venta` sólo en el cliente; candidato a la bandeja (R-3).
- Sin preguntas que bloqueen.
