# Diseño: la aplicación resuelve «Aplica: Sí/No» y lo manda a n8n como un dato ya decidido

## Enfoque técnico
Una función pura nueva en `packages/shared`, `aplicaDeRemision`, decide «Aplica» desde lo **guardado** en la remisión; `buildRemisionPayload` la llama y añade la clave `aplica` sólo cuando el resultado es booleano. **Flujo:** `getRemision` (`apps/desk/server/routes/remision.ts:275`) → `buildRemisionPayload` (`apps/desk/server/routes/remision.ts:308`, único llamador, sirve al envío y al reenvío) → `aplicaDeRemision` → `JSON.stringify` (`apps/desk/server/remisionWebhook.ts:86`) → n8n. No hay guarda nueva, ni SQL, ni lectura del catálogo al enviar. Todo fichero citado se edita **en sitio** (misma línea física) o **al final**. Lo que aquí se dice de tipos, lint, ayudas de prueba y mutaciones es **hipótesis** hasta ejecutarlo en el apply. Alcance y supuestos S1 a S7: los de `proposal.md`, sin reabrir.

## Decisiones
### D1 · La regla: `aplicaDeRemision`, AL FINAL de `packages/shared/src/recepcion.ts`
Tras la última línea de hoy (`packages/shared/src/recepcion.ts:194`), unas doce líneas:
```ts
/** Lo mínimo de una remisión GUARDADA para resolver «Aplica» (RQ-RE-39). `novedades` NULL o AUSENTE = legado. */
export interface RemisionAplica {
  incluye?: readonly unknown[] | null; hayNovedad?: boolean | null; novedades?: readonly NovedadMarcada[] | null
  sinAccesoriosAt?: string | null; sinEmbalajeAt?: string | null
}
/** «Aplica: Sí» = hay accesorios, o una novedad real, o una casilla marcada. `null` = legado: no se calcula y el payload omite la clave. */
export function aplicaDeRemision(rem: RemisionAplica): boolean | null {
  if (!rem.novedades) return null
  const hayAccesorios = (rem.incluye ?? []).some((v) => typeof v === 'string' && v.trim() !== '')
  return hayAccesorios || rem.hayNovedad === true || Boolean(rem.sinAccesoriosAt) || Boolean(rem.sinEmbalajeAt)
}
```
| Opción | Contrapartida | Decisión |
|---|---|---|
| Al final de `packages/shared/src/recepcion.ts` | El fichero crece, sólo por el final | **Elegida**: ahí viven ya el criterio de legado (`packages/shared/src/recepcion.ts:137`, `packages/shared/src/recepcion.ts:154`), `NovedadMarcada` y la derivación de `hayNovedad` (`packages/shared/src/recepcion.ts:109`); `packages/shared/src/index.ts:29` ya lo reexporta entero, así que `index.ts` **no se edita** |
| Módulo nuevo `packages/shared/src/aplica.ts` | Una línea más en `index.ts` y el criterio de legado escrito en un segundo fichero (molde H5) | Rechazada |
| Reutilizar el tipo `RemisionRecepcion` (`packages/shared/src/recepcion.ts:124`) | Obliga a `novedades` presente y no trae `incluye`; habría que editar una línea citada | Rechazada: tipo propio, todo opcional |

- **Legado** con el mismo criterio que la línea 137: `!rem.novedades` cubre `NULL` y propiedad ausente (el dato de `apps/desk/server/remisionWebhook.test.ts:6-10` no la trae). Una lista vacía cuenta como formulario nuevo, igual que allí.
- **Decide por lo guardado, no por el catálogo:** `hayNovedad` ya salió de la marca `excluyeDemas` al guardar; la función no nombra ninguna clave ni etiqueta. `hayNovedad` `null` en formulario nuevo no suma (`=== true`).
- `Remision` (`packages/shared/src/types.ts:722`, `packages/shared/src/types.ts:735`) es asignable a `RemisionAplica` sin conversión (hipótesis: lo dice `npm run typecheck`).

### D2 · El payload — `apps/desk/server/remisionWebhook.ts`, cinco líneas EN SITIO, cero desplazadas
| Línea | Queda así |
|---|---|
| 2 | `import { aplicaDeRemision, type Remision, type ClientLite, type EquipoFull, type UserPublic } from '@ambientalia/shared'` (import mixto: precedente `apps/desk/server/analisis.ts:2`) |
| 11 | `incluye: string[]; aplica?: boolean` |
| 29 | `enumerando los que falten. \`aplica\` (RQ-RE-39) es opcional: va ya resuelto y en legado la clave se OMITE.` |
| 39 | `const { remision: r, cliente: c, equipo: e, usuario: u } = input; const aplica = aplicaDeRemision(r)` |
| 46 | `incluye: r.incluye, ...(aplica === null ? {} : { aplica }),` |

La omisión es por *spread* condicional: en legado el objeto **no tiene la clave** (ni `undefined`, ni `null`, ni `false`).

**Barrido** (`grep -rnoE "remisionWebhook\.ts:[0-9]+(-[0-9]+)?"` sobre el worktree, con `archive/`): 42 resultados.
| Alternativa | Citas que se mueven |
|---|---|
| **Elegida: en sitio** | **Ninguna.** Cambia lo que DICEN dos líneas: la 46 (`openspec/specs/remisiones/spec.md:1522` y `openspec/specs/remisiones/spec.md:1818` la citan como «`incluye` del payload»: sigue siéndolo; la frase «conservar sus claves» de la primera la corrige el delta de spec) y el rango 45-46 de la propuesta de este cambio y de `docs/sdd/TRASPASO_2026-10-08.md:817` («sólo viajan `observaciones` e `incluye`»): **caso B**, medido sobre `b9d5e71`, no se renumera |
| Línea propia `aplica` tras la 46 | +1 desde la 47: en vivo, `openspec/config.yaml:4470` (línea 47), `openspec/specs/remisiones/spec.md:56` y `openspec/specs/remisiones/spec.md:731` (57 y 50-56), `openspec/specs/remisiones/spec.md:211` (96-98), `openspec/specs/remisiones/spec.md:746` (31-66 y 72-73), `docs/sdd/F0-00_Baseline_as-built.md:471` (31-66 y 75-108), `openspec/changes/F0-04/proposal.md:176` (84), más el final de los rangos 31-65, 31-66 y 40-65. Rechazada |

### D3 · Regla invariable 13 y regla de mutación 3
- **Decisiones del cliente React por este cambio: ninguna.** Verificado: la búsqueda de «Aplica» como palabra en `apps/desk/src` da seis apariciones, todas el verbo en comentarios (`apps/desk/src/components/CatalogoEquipos.tsx:541` y otras cuatro del mismo fichero; `apps/desk/src/lib/valoresTransicion.ts:40`); ninguna calcula ni muestra el encabezado. No hay fila que casar con el servidor.
- **n8n consume, no recalcula.** Con `aplica` booleano el nodo sólo lo traduce a «Sí» o «No». Su rama de respaldo no es una segunda implementación de la regla nueva: es la regla **vieja** (sólo «Incluye»), conservada por compatibilidad hacia atrás (S6), y sólo corre cuando la aplicación no manda el dato, que es exactamente el caso de legado (S4).
- Reglas de mutación 1 y 2: no aplican (ni guarda nueva ni fichero de datos vigilado).

### D4 · Pruebas (`strict_tdd`: el rojo se anota antes del producto) — HIPÓTESIS
Lo nuevo va **al final** de cada fichero; las tres de diez claves se editan **en sitio**.
| Fichero | Casos |
|---|---|
| `packages/shared/src/recepcion.test.ts` | Tabla AP-1 a AP-10 sobre `aplicaDeRemision`: (1) «Sin novedad» sola, sin lista ni casillas → `false` · (2) novedad real sin accesorios → `true` · (3) accesorios con «Sin novedad» → `true` · (4) sólo `sinAccesoriosAt` → `true` · (5) sólo `sinEmbalajeAt` → `true` · (6) «Incluye» de `''` y `'  '` → `false` · (7) legado (`novedades` `null`) con `hayNovedad` `true` e «Incluye» lleno → `null` · (8) `novedades` ausente → `null` · (9) formulario nuevo con `hayNovedad` `null` y nada más → `false`, no `null` · (10) `incluye` ausente o `null` → `false`, sin lanzar |
| `apps/desk/server/remisionWebhook.test.ts` | BP-1 el dato de hoy (sin `novedades`) da un objeto cuyas `Object.keys` **no** incluyen `aplica` (se mira por claves, no por valor: caza `aplica: undefined`) · BP-2 con `novedades` y todo vacío, `aplica` es `false` estricto y la clave existe · BP-3 con una casilla, `true` |
| `apps/desk/server/recepcion.test.ts`, en sitio | Línea 424 (título en la 419): pasa a **once** claves, las diez más `aplica`, y en la misma línea `cuerpo.aplica` es `true` (por `hayNovedad`: `rayon_estetico`, «Incluye» vacío). Línea 727, PW-1 (título en la 721): once claves y `cuerpo.aplica` `true` (sólo por las casillas: «Sin novedad», «Incluye» vacío); su línea 729 sigue negando las claves de casilla |
| `apps/desk/server/accesoriosRemision.test.ts`, en sitio | Línea 191 (título en la 184): once claves y `aplica` `true` (sólo por «Incluye»: `Cable USB` con «Sin novedad») |
| `apps/desk/server/recepcion.test.ts`, al final | PA-A1 «Sin novedad» con las tres fotos y sin accesorios: once claves y `aplica` `false` · PA-A2 legado con una foto: diez claves, sin `aplica` ni `hayNovedad` · PA-A3 primer envío rechazado por n8n y reenvío: los dos cuerpos llevan el mismo `aplica` |

Las tres pruebas en sitio quedan repartidas a propósito: cada una sostiene **un** sumando por la ruta HTTP. `apps/desk/server/fotoNovedad.test.ts:137-156` sigue verde sin tocarla: envía legado (`apps/desk/server/fotoNovedad.test.ts:148`) y sólo niega `hayNovedad` (`apps/desk/server/fotoNovedad.test.ts:156`). PA-A3 depende de que la ayuda `conN8n` admita respuestas distintas por llamada (hipótesis); si no, se prueba con `buildRemisionPayload` llamada dos veces sobre la misma remisión leída.

### D5 · Mutaciones que el apply reproduce (se restaura siempre; resultado en `apply-progress.md`)
| Mutación | Debe ponerse roja |
|---|---|
| **M1** quitar el sumando de «Incluye» | AP-3 · `apps/desk/server/accesoriosRemision.test.ts:191` |
| **M2** quitar `hayNovedad` | AP-2 · `apps/desk/server/recepcion.test.ts:424` |
| **M3a** quitar `sinAccesoriosAt` · **M3b** quitar `sinEmbalajeAt` · **M3c** las dos | AP-4 · AP-5 · AP-4, AP-5, BP-3 y PW-1 |
| **M4a** legado devuelve `false` en vez de `null` · **M4b** el payload manda `aplica: null` o `undefined` en vez de omitir | AP-7, AP-8, BP-1, PA-A2 · BP-1 (y PA-A2 con `null`) |
| **M5** quitar el recorte de vacíos (`v !== ''`, o `incluye.length > 0`) | AP-6 |
| **M6** mandar `hayNovedad` en vez de la suma | AP-3, AP-4, AP-5, PW-1, `apps/desk/server/accesoriosRemision.test.ts:191` |
| **M7** legado sólo si `novedades === null` (la ausencia cuenta como formulario nuevo) | AP-8, BP-1 |
| **M8** `hayNovedad !== false` en vez de `=== true` | AP-9 |

### D6 · Código nuevo del nodo «Verifica Incluye Entrada» y entregable
El código actual es dato del analista, de **segunda mano: hipótesis**, igual que el nombre con que llega el campo (el nodo anterior renombra `incluye` a `Incluye`; que reexponga el cuerpo entero es hipótesis). Por eso el código nuevo mira tres sitios y, si en ninguno hay un booleano, hace **letra por letra** lo de hoy:
```js
// «Aplica»: si la aplicación manda el dato ya resuelto (true o false), se usa tal cual.
// Si no llega, o no es true/false, vale la regla anterior: «Sí» sólo si «Incluye» trae algún valor.
const _e = $('Remision-Entrada-Salida').first().json;
const _candidatos = [_e.aplica, _e.Aplica, _e.body ? _e.body.aplica : undefined];
const _resuelto = _candidatos.find(v => typeof v === "boolean");
const _src = _e.Incluye;
const incluye = Array.isArray(_src) ? _src : [];
const tieneValor = incluye.some(v => v && v.toString().trim() !== "");
const aplica = typeof _resuelto === "boolean" ? _resuelto : tieneValor;
return [{ json: { resultado: aplica ? "Sí" : "No" } }];
```
La salida conserva su forma (`resultado`, «Sí» o «No»), así que los nodos que la consumen no cambian. **Índice de `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md`** (para quien no programa; sin credenciales ni direcciones): 1. Qué cambia y por qué, en tres frases · 2. Dónde: flujo `Remisiones_ST_3.13_Desk`, nodo «Verifica Incluye Entrada»; el flujo `Remisiones_ST_3.13` **no se toca** · 3. **Comprobación ANTES de pegar:** (a) el código que hay en el nodo coincide con el «código actual» de este documento, y si no coincide se para y se consulta; (b) en la salida de «Remision-Entrada-Salida» de una ejecución de prueba, mirar si junto a `Incluye` aparecen los demás campos del cuerpo en minúscula (`remisionId`, `observaciones`): si están, `aplica` llegará igual; si no, anotar dónde quedan y consultar; (c) «Validar payload» no rechaza campos de más · 4. Código actual completo (copia de seguridad) · 5. Código nuevo completo · 6. Prueba con una remisión de prueba: tres casos («Sin novedad» sin accesorios → «No»; novedad real sin accesorios → «Sí»; con accesorios → «Sí»), mirando el correo y el documento · 7. Vuelta atrás: pegar el código del punto 4 · 8. Orden de publicación: cualquiera de los dos lados primero no rompe nada; se publican a la vez.

### D7 · Presupuesto (inserciones + borrados; una línea editada en sitio cuenta dos)
| Fichero | Líneas |
|---|---|
| `packages/shared/src/recepcion.ts` (+12 al final) · `packages/shared/src/recepcion.test.ts` (+45) | 57 |
| `apps/desk/server/remisionWebhook.ts` (5 en sitio) · `apps/desk/server/remisionWebhook.test.ts` (+22) | 32 |
| `apps/desk/server/recepcion.test.ts` (4 en sitio, +30) · `apps/desk/server/accesoriosRemision.test.ts` (2 en sitio) | 42 |
| `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md` (+90, nuevo) · `apply-progress.md` (+110, sumando obligatorio) | 200 |

Total estimado: **~331**, dentro de las 350 del apply; ×1,8 = **~596**, bajo la válvula de 720 y el techo de 800. **Un solo lote**, sin partición. Se mide al cerrar con `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear.

### D8 · Lo que NO se toca
- `apps/desk/server/routes/remision.ts`: no es imprescindible. El llamador ya pasa la `Remision` entera (`apps/desk/server/routes/remision.ts:309`); no se añade ni se mueve guarda (IV-12 no gana punto).
- La columna `hay_novedad`, su significado y `packages/zoho-sync/src/db/schema.sql`: ni migración ni relleno; la regla lee lo que ya se guarda (`apps/desk/server/db/remisiones.ts:25`).
- `apps/desk/src`: nada (D3). `packages/shared/src/index.ts` y `packages/shared/src/types.ts`: nada (D1).
- El flujo de n8n: lo cambia una persona con el entregable; ninguna sesión lo edita.

## Matriz de amenazas, despliegue y preguntas abiertas
**Matriz de amenazas:** N/A — no hay shell, subprocesos, automatización de VCS ni ruta nueva; el webhook saliente ya existe y sólo gana una clave. **Despliegue:** sin migración. Vuelta atrás: revertir el commit; el flujo, compatible hacia atrás, sigue con la regla vieja.
- [ ] ¿Acepta `npm run lint` el import mixto de la línea 2 y el *spread* condicional de la 46? Hipótesis: sí (precedente citado en D2).
- [ ] ¿Admite `conN8n` un primer rechazo y un segundo `202` para PA-A3? Hipótesis; alternativa escrita en D4.
- [ ] El número RQ-RE-39 lo fija el delta de spec, que se escribe a la vez; si cambia, se corrigen los dos comentarios que lo nombran.
- [ ] Las tres hipótesis sobre n8n (nombre del campo, «Validar payload», borrador igual a lo publicado): no se resuelven aquí; son el punto 3 del entregable y tarea de persona.
