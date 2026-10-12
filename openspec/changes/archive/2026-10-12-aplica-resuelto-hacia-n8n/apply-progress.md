# apply-progress: aplica-resuelto-hacia-n8n (F1B-04, `cierra: no`)

Lote único. Partida `0ab69de`. 21 de 22 tareas hechas; queda 5.1 (cuarto código: detector de citas, tras el commit del orquestador). Las citas desplazadas las repara el orquestador.

## Rojo → verde por grupo
| Grupo | Comando | Rojo visto ANTES del código |
|---|---|---|
| 1.1 AP-1…AP-10 | `npx vitest run packages/shared/src/recepcion.test.ts` | 10 fallos: `TypeError: (0 , aplicaDeRemision) is not a function` (59 pasan, 10 fallan) |
| 1.2 BP-1…BP-3 | `npx vitest run apps/desk/server/remisionWebhook.test.ts` | BP-2 `expected [ 'remisionId', 'ticketNumero', …(8) ] to include 'aplica'`; BP-3 `expected undefined to be true`. BP-1 **nació verde** (caracteriza); su rojo lo da M4a/M4b |
| 1.3 las tres de once claves | `npx vitest run apps/desk/server/recepcion.test.ts apps/desk/server/accesoriosRemision.test.ts` | `expected [ 'cliente', 'equipo', 'fecha', …(7) ] to deeply equal [ 'aplica', 'cliente', 'equipo', …(8) ]` (3 pruebas: la de `recepcion.test.ts:424`, PW-1 y `accesoriosRemision.test.ts:191`) |
| 1.4 PA-A1…PA-A3 | mismo comando | PA-A1 el mismo mensaje de once claves; PA-A3 `expected undefined to be false`. PA-A2 **nació verde** (caracteriza); su rojo lo da M4a |
Verde tras 2.1 y 2.2: los cinco ficheros (`recepcion.test.ts` de shared, `remisionWebhook.test.ts`, `recepcion.test.ts`, `accesoriosRemision.test.ts`, `fotoNovedad.test.ts`): 170 pruebas, 0 fallos. `apps/desk/server/fotoNovedad.test.ts:137-156` sigue verde sin tocarla.

## Mutaciones (copia en el directorio temporal de la sesión; restaurada tras cada una; `diff` limpio al final)
| Mutación | Pruebas que se pusieron ROJAS | Restaurada |
|---|---|---|
| M1 sin sumando de «Incluye» | AP-3 · `accesoriosRemision.test.ts` «(4) el payload a n8n lleva once claves…» | sí |
| M2 sin `hayNovedad` | AP-2 · `recepcion.test.ts` «el payload a n8n NO cambia…» (la de la línea 424) | sí |
| M3a sin `sinAccesoriosAt` | AP-4 · BP-3 | sí |
| M3b sin `sinEmbalajeAt` | AP-5 | sí |
| M3c sin las dos | AP-4 · AP-5 · BP-3 · PW-1 | sí |
| M4a legado → `false` | AP-7 · AP-8 · BP-1 · PA-A2 | sí |
| M4b-null (`aplica` siempre) | BP-1 · PA-A2 | sí |
| M4b-undefined (`aplica ?? undefined`) | BP-1 (PA-A2 no: `JSON.stringify` descarta `undefined`; por eso BP-1 mira claves) | sí |
| M5 sin recorte de vacíos (`v.trim() !== ''` fuera) | AP-6 | sí |
| M6 manda sólo `hayNovedad` | AP-3 · AP-4 · AP-5 · BP-3 · PW-1 · `accesoriosRemision.test.ts` (4) | sí |
| M7 legado sólo si `novedades === null` | AP-8 · BP-1 | sí |
| M8 `hayNovedad !== false` | AP-9 | sí |
Todas rojas donde el diseño lo esperaba; no hizo falta prueba extra. M1 y M3c añaden BP-3/PW-1 o (4) más de lo previsto: sólo suman. El `git diff` de `recepcion.ts` y `remisionWebhook.ts` no trae restos.

## Las tres pruebas cambiadas a propósito (diez → once claves)
| Prueba | Antes | Después |
|---|---|---|
| `apps/desk/server/recepcion.test.ts:424` (título en :419) | diez claves | las diez más `aplica`, y `cuerpo.aplica` es `true` (por `hayNovedad`) en la misma línea |
| `apps/desk/server/recepcion.test.ts:727` (PW-1, título en :721) | diez claves | once; `aplica` `true` sólo por las casillas |
| `apps/desk/server/accesoriosRemision.test.ts:191` (título en :184) | diez claves | once; `aplica` `true` sólo por «Incluye» |
Los títulos lo dicen («a propósito: RQ-RE-39»). Cero líneas añadidas o quitadas en esas tres: se editaron en sitio.

## Regla invariable 13 / regla de mutación 3
- Decisiones nuevas del cliente React: **ninguna**. `git diff --stat 0ab69de -- apps/desk/src` sale vacío. La búsqueda de «Aplica» como palabra en `apps/desk/src` sigue en 6 apariciones (el verbo, en comentarios).
- n8n **consume** el dato resuelto; su rama de respaldo es la regla vieja por compatibilidad, no una segunda copia de la nueva.
- Reglas de mutación 1 y 2: no aplican.

## Códigos de salida (mirados uno a uno)
| Orden | Resultado |
|---|---|
| `npm test` | 0 · 267 ficheros pasan, 3 omitidos (270) · 4468 pruebas pasan, 11 omitidas (4479) |
| `npm run typecheck` | 0 |
| `npx eslint . --max-warnings 165` | 0 · 165 avisos, 0 errores (no sube) |
| detector de citas | **no corrido** (necesita el commit del orquestador) |

## Barrido de citas (regla de mutación 4)
- `remisionWebhook.ts`: 108 líneas antes y después. `git diff -U0` toca sólo las líneas 2, 11, 29, 39 y 46 (5 + 5). Ninguna cita se movió.
- `recepcion.ts`: 194 → 206; el diff sólo añade 12 líneas al final, 0 borradas.
- Citas cuya afirmación deja de ser cierta, SIN editar: `docs/sdd/TRASPASO_2026-10-08.md:817` (45-46, «sólo viajan `observaciones` e `incluye`»); `openspec/changes/aplica-resuelto-hacia-n8n/proposal.md:23` (45-46, igual; caso B); `openspec/specs/remisiones/spec.md:1522` y `openspec/changes/archive/2026-10-07-accesorios-lista-por-modelo/specs/remisiones/spec.md:29` (46, «conservar sus claves y valores»). El resto de las citas a la 46 (spec :1818, archivo de accesorios `spec.md:325`, `proposal.md:41` y `:93`, `design.md:112`) siguen siendo ciertas: la 46 sigue siendo `incluye` del payload.

## Hipótesis del diseño resueltas
- `conN8n` (`recepcion.test.ts`) **no admite respuestas distintas por llamada**: devuelve siempre 202. Para PA-A3 no usé la alternativa de `buildRemisionPayload` dos veces: escribí un ayudante local `conRespuestas([403, 202])` en el describe nuevo, y el reenvío real pasa por la ruta HTTP.
- El lint aceptó el import mixto de la línea 2 y el *spread* condicional de la 46 (0 errores, 165 avisos).
- `Remision` es asignable a `RemisionAplica` sin conversión (`npm run typecheck` = 0).

## Desvíos respecto al diseño
1. **Código actual del nodo n8n:** no existe copia verbatim en el repositorio. El entregable lo presenta como RECONSTRUCCIÓN de lo descrito por el analista (hipótesis, marcada) y añade un paso de copia propia antes de pegar, que es la vuelta atrás fiable.
2. Final de línea: los ficheros son LF en el índice; lo añadido va en LF.
3. PA-A3 usa ayudante local (ver arriba).

## Medida
`git diff --shortstat --no-renames 0ab69de`: 7 ficheros, 147 inserciones, 33 borrados (180, con `tasks.md` 21+21) + `wc -l` de lo nuevo: entregable 74 + este fichero 68 = **322**, bajo la válvula de 720. Binarios: ninguno.

## Corrección del orquestador al contrastar

El entregable traía en su punto 4 una reconstrucción del código del nodo. Se sustituyó por el código que el analista copió del nodo el 2026-10-12 (cuatro líneas, dato de segunda mano), que es el que traía el encargo. El documento queda en 73 líneas y la medida del lote en 321.
