# Informe de verificación: aplica-resuelto-hacia-n8n (F1B-04, `cierra: no`)

Verificador independiente. Worktree `aplica-resuelto-hacia-n8n`, HEAD `8dd2330`, partida del cambio `b9d5e71`. Todo se comprobó ejecutando; nada se tomó del `apply-progress.md`.

**Veredicto: PASS con avisos.** CRITICAL 0 · WARNING 2 · SUGGESTION 3.

## Códigos de salida (mirados uno a uno, sobre `8dd2330`)

| Orden | Código | Resultado |
|---|---|---|
| `npm test` | 0 | 267 ficheros pasan, 3 omitidos (270); 4468 pruebas pasan, 11 omitidas (4479) |
| `npm run typecheck` | 0 | sin errores |
| `npx eslint . --max-warnings 165` | 0 | 165 avisos, 0 errores (no sube) |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | 13 abreviadas rotas (informativas, no bloquean); las listadas son de `permissions.ts` y `transitions.ts`, ajenas al cambio |
| `npm run build` | 0 | compilado (`dist/assets/index-BDDzwgxI.js`) |

## Escenarios contra pruebas (leídas, no sólo localizadas)

| Escenario | Prueba | Veredicto |
|---|---|---|
| A-SIN | `packages/shared/src/recepcion.test.ts:425` (AP-1), `apps/desk/server/recepcion.test.ts:747` (PA-A1: once claves y `aplica` false) | Cumple |
| A-REAL | `packages/shared/src/recepcion.test.ts:428` (AP-2), `apps/desk/server/recepcion.test.ts:424` (`aplica` true por `hayNovedad`) | Cumple |
| A-ACC | `packages/shared/src/recepcion.test.ts:431` (AP-3), `apps/desk/server/accesoriosRemision.test.ts:191` | Cumple |
| A-CASACC | `packages/shared/src/recepcion.test.ts:434` (AP-4), `apps/desk/server/remisionWebhook.test.ts:107` (BP-3), `apps/desk/server/recepcion.test.ts:727` | Cumple |
| A-CASEMB | `packages/shared/src/recepcion.test.ts:437` (AP-5); PW-1 ejerce las dos casillas juntas | Cumple (unitaria) |
| A-BLANCO | `packages/shared/src/recepcion.test.ts:440` (AP-6, cadenas vacías y de espacios) | Cumple |
| A-LEGADO | `packages/shared/src/recepcion.test.ts:443` y `:446` (AP-7, AP-8), `apps/desk/server/remisionWebhook.test.ts:96` (BP-1), `apps/desk/server/recepcion.test.ts:755` (PA-A2, diez claves) | Cumple; ver S-1 |
| A-REENVIO | `apps/desk/server/recepcion.test.ts:764` (PA-A3: 403 y luego 202, mismo `aplica`) | Cumple en parte; ver W-1 |
| A-ONCE | `apps/desk/server/recepcion.test.ts:747`, `:424`, `:727`, `apps/desk/server/accesoriosRemision.test.ts:191`, `apps/desk/server/remisionWebhook.test.ts:101` | Cumple |
| A-NOGUARDA | `apps/desk/server/recepcion.test.ts:129-132` y `:144-155` (`hay_novedad` en SQL, sin tocar) y las claves exactas de PA-A1 (sin `hayNovedad`) | Cumple |
| RQ-RE-17 modificado (payload sólo gana `aplica`) | `apps/desk/server/recepcion.test.ts:424` (claves exactas, sin categoría ni novedades) | Cumple |
| RQ-RE-38 modificado (casillas no ganan claves) | `apps/desk/server/recepcion.test.ts:727` (claves exactas y regex negativa sobre las casillas) | Cumple |

## Mutaciones reproducidas por mí (4 ficheros de prueba; restauradas con `git checkout`)

| Mutación | Pruebas en ROJO | Resultado |
|---|---|---|
| M1 quitar los sumandos de las casillas | AP-4, AP-5, BP-3, PW-1 | Detectada |
| M2 legado manda `aplica: false` en vez de omitir | BP-1, PA-A2 | Detectada |
| M3 quitar el recorte de vacíos | AP-6 | Detectada |
| M4 devolver sólo `hayNovedad` | AP-3, AP-4, AP-5, BP-3, PW-1, `accesoriosRemision.test.ts:191` | Detectada |
| M5 legado sólo si `novedades === null` | AP-8, BP-1 | Detectada |
| M6 quitar el sumando `hayNovedad` | AP-2, `recepcion.test.ts:424` | Detectada |

Ninguna mutación quedó verde.

## La regla y el payload

- `packages/shared/src/recepcion.ts:203-206`: `aplicaDeRemision` decide por lo guardado (`incluye` recortado, `hayNovedad`, `sinAccesoriosAt`, `sinEmbalajeAt`). No compara claves ni etiquetas ni lee el catálogo.
- `!rem.novedades` trata igual NULL y ausente (devuelve `null`). `novedades` como array vacío (truthy) se calcula como formulario nuevo y da `false`; el servidor ya rechaza la lista vacía, así que no ocurre. Un `incluye` de cadenas vacías o no-cadenas no cuenta; `incluye` ausente o NULL da `false` sin lanzar (AP-10).
- `apps/desk/server/remisionWebhook.ts:46`: `...(aplica === null ? {} : { aplica })`. En legado la clave se OMITE (BP-1, PA-A2). El fichero conserva 108 líneas; `git diff --numstat` da 5 inserciones y 5 borrados, todo en sitio (líneas 2, 11, 29, 39 y 46). `packages/shared/src/recepcion.ts`: 12 inserciones, 0 borrados, todo al final.

## Lo que no debía tocarse

`git diff --stat b9d5e71` sobre `apps/desk/src`, `routes/remision.ts`, `schema.sql`, `types.ts`, `openspec/specs`, `CLAUDE.md`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y `docs/sdd/TRASPASO_2026-10-08.md`: vacío. El diff completo son 12 ficheros, los esperados.

## Regla invariable 13 y regla de mutación 3

Cero decisiones nuevas en el cliente (`apps/desk/src` sin diff). El servidor manda `aplica` resuelto; n8n lo consume. Su rama de respaldo (`tieneValor` sobre «Incluye») es la regla vieja tal cual, no una segunda copia de la nueva: no suma casillas ni novedad.

## Las tres pruebas de diez a once claves

Editadas en sitio (mismas líneas 424, 727 y 191) y cada una sostiene un sumando distinto: `hayNovedad` (`apps/desk/server/recepcion.test.ts:424`), las casillas sin «Incluye» (`apps/desk/server/recepcion.test.ts:727`), «Incluye» sin novedad ni casillas (`apps/desk/server/accesoriosRemision.test.ts:191`). Lo confirman M1, M4 y M6.

## Código de n8n ejecutado en node (con `$` simulado; extraído del propio entregable)

| Caso | Actual | Nuevo | Compatible |
|---|---|---|---|
| sin `aplica`, Incluye lleno | Sí | Sí | igual |
| sin `aplica`, Incluye vacío | No | No | igual |
| sin `aplica`, Incluye de cadenas vacías | No | No | igual |
| `aplica: true`, Incluye vacío | No | Sí | cambia a propósito |
| `aplica: false`, Incluye lleno | Sí | No | cambia a propósito (ver S-2) |
| `aplica: "false"` (cadena), Incluye vacío | No | No | igual (se ignora) |
| `aplica: "true"` (cadena), Incluye vacío | No | No | igual (se ignora; cae a la regla vieja) |
| `aplica: null`, Incluye lleno / vacío | Sí / No | Sí / No | igual |
| `Aplica: true` (mayúscula), vacío | No | Sí | cambia |
| `body.aplica: true`, vacío | No | Sí | cambia |
| sin `Incluye`, `aplica: true` | No | Sí | cambia |

Compatibilidad hacia atrás: sin `aplica` booleano el nuevo da lo mismo que el actual en todos los casos. La salida sólo cambia cuando llega un booleano.

## Entregable `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md` (73 líneas)

Lenguaje llano, pasos numerados. Trae flujo y nodo (apartado 2), comprobaciones previas con copia propia (3), código actual (4) y nuevo completo (5), prueba con tres remisiones (6), vuelta atrás (7) y orden de publicación (8). Sin credenciales, URL ni identificadores de webhook. Declara que el código actual es dato de segunda mano y manda compararlo antes de pegar.

## Barrido de citas (regla de mutación 4)

Barrido de `remisionWebhook` y `recepcion` con `.ts:N` sobre todo el repositorio, incluido `openspec/changes/archive`. Ninguna cita cambió de línea (el fichero conserva su longitud). Las que afirman algo que deja de ser cierto, sin editar:
- `openspec/changes/aplica-resuelto-hacia-n8n/proposal.md:23` (`remisionWebhook.ts:45-46`, «sólo viajan observaciones e incluye»): caso B, medido sobre `b9d5e71`. Hoy la línea 46 también manda `aplica`.
- `docs/sdd/TRASPASO_2026-10-08.md:817` (`remisionWebhook.ts:45-46`, ningún dato de «hay novedad»): cierto de `hayNovedad`, incompleto frente a `aplica`. Caso B.
- `openspec/specs/remisiones/spec.md:1522` y `:1818` (`remisionWebhook.ts:46`, «conservar claves y valores», «tal cual»): siguen ciertas, `incluye` sigue en esa línea. Caso A.
- `openspec/config.yaml:4470` (`remisionWebhook.ts:47`, cargo): línea 47 sin cambio; cierta.

## Cabecera R-1, `cierra: no` y qué falta para cerrar F1B-04

`openspec/changes/aplica-resuelto-hacia-n8n/proposal.md:1-9`: siete campos (`tanda: F1B-04`, `motivo`, `capacidad`, `maestro`, `cierra: no`, `toca_maestro: no`, `origen_cabecera: declarada`). Coherente: la fila F1B-04 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84` y `:211`) sigue en curso. Falta, en una línea: contenido y talla de lo que la fila deja fuera (foto por accesorio, SKU como número de parte, E-163 a E-167), la decisión de Gerencia de E-167 (`docs/sdd/ENTRADA.md:1827`, abierta) y la publicación a mano en n8n de este cambio.

## Tareas

22 de 22 marcadas (22 casillas marcadas, 0 sin marcar). Las cinco filas de personas de `tasks.md` están fuera del recuento y ninguna describe trabajo que una tanda pueda hacer en el repositorio.

## Hallazgos

1. **W-1 (WARNING) · A-REENVIO se cumple sólo en parte.** El escenario pide cambiar la marca de una novedad en el catálogo entre envíos; `apps/desk/server/recepcion.test.ts:764` sólo reintenta tras un 403 y no cambia el catálogo. La garantía hoy es estructural (`aplicaDeRemision` no recibe catálogo) y ninguna mutación la rompería. Cubrirlo: una prueba que cambie `excluye_demas` entre envíos.
2. **W-2 (WARNING) · Dos citas `:45-46` afirman algo desfasado** (`proposal.md:23` y `docs/sdd/TRASPASO_2026-10-08.md:817`, ambas caso B). El traspaso no se toca en este cambio; conviene nombrar la revisión `b9d5e71` en la propuesta o anotarlo en el parte.
3. **S-1 (SUGGESTION)** · A-LEGADO pide `hayNovedad` true, false y null; las pruebas ejercen true (AP-7). Sin riesgo (retorno temprano), pero no está probado por valor.
4. **S-2 (SUGGESTION) · `aplica: false` con «Incluye» lleno da «No» en el nodo nuevo.** Con la regla del servidor ese caso no puede darse (accesorios implica `true`); sólo ocurriría con un cliente distinto de la aplicación. Aceptable.
5. **S-3 (SUGGESTION)** · El nodo acepta `Aplica` en mayúscula y `body.aplica`: candidatos especulativos, inocuos (el entregable ya manda comprobar dónde llega el campo, apartado 3.3). Además `apply-progress.md` («Desvíos», punto 1) habla de RECONSTRUCCIÓN, ya corregido en su sección final.

## Tareas de personas — archivar no las da por hechas

Alfonso: confirmar hipótesis sobre n8n, cambiar a mano «Verifica Incluye Entrada» y publicar a la vez app y flujo, con la remisión de prueba (M-1 y M-2). Gerencia: corregir S1 a S7 antes del 2026-10-19 y decidir E-167. Sesión de supervisión: versionar bandeja y parte. Archivar el cambio no las da por hechas.
