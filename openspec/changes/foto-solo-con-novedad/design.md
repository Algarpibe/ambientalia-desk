# Diseño: la foto se exige sólo cuando el equipo llega con novedad (F1B-04, `cierra: no`)

Entradas fijas: `proposal.md` (obs. 1057) y `specs/remisiones/spec.md` (delta, obs. 1058). Todas las
líneas se midieron en disco sobre `a0a2935`. Las líneas «después» son las que dejará este diseño.

## Enfoque técnico

Un dato nuevo (`public.remisiones.hay_novedad`), un predicado puro en `packages/shared` y **una sola
guarda de servidor**, en `/enviar`, entre «ya enviada» y `reclamarEnvio`. El alta sólo lee y persiste
el campo, sin guardas nuevas (IV-12). El payload de n8n no cambia. El cliente consume el mismo
predicado. Todas las ediciones en ficheros muy citados se hacen **en línea o al final**, para desplazar
lo mínimo.

## Decisiones

| # | Decisión | Alternativa rechazada | Razón |
|---|---|---|---|
| D1 | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS hay_novedad boolean`, con un comentario de una línea sin `;`, **añadida al FINAL** de `schema.sql` (después de `:506`) | Junto a las otras `ALTER` de remisiones (`:316-317`) | Insertar en `:318` desplaza `:319`, `:376-386`, `:390-391` y `:448`, que están citadas en DEPLOY.md, en `zoho-sync/spec.md` y en `migrate.test.ts:213,219,307`. Al final no se desplaza nada. `migrate` parte el fichero por `;` (`schema.sql:258`) |
| D2 | Guardián: en `migrate.test.ts:369-380` el recuento pasa de 36 a **37** y de 18 a **19** calificadas («14 de public»). **Edición en línea, sin líneas nuevas.** El conjunto de identidades de `:380` no cambia, porque `public.remisiones` ya está | Añadir comentario con líneas nuevas | `CLAUDE.md:203` cita `migrate.test.ts:404-406`, y cualquier línea nueva antes de ella la rompe |
| D3 | El alta lee `hayNovedad` **dentro de la llamada a `createRemision`**, en línea en `routes/remision.ts:246`: `hayNovedad: typeof b.hayNovedad === 'boolean' ? b.hayNovedad : null` | Leerlo arriba o validarlo | Cero guardas y cero líneas nuevas. `:127`, `:155`, `:177`, `:197` y `:220` (IV-12) quedan intactas porque todas están por encima de `:242`. Cualquier valor que no sea booleano se guarda como `null` sin rechazar la petición (RQ-RE-17) |
| D4 | `db/remisiones.ts` en línea: `:25` (`toRemision`, `hayNovedad: typeof r.hay_novedad === 'boolean' ? r.hay_novedad : null`), `:40` (`personaContacto: string \| null; hayNovedad: boolean \| null`), `:47-48` (columna y `$13`) y `:50` (valor). **Desplazamiento 0** | Un campo por línea en la interfaz | `:48` tiene cuatro citas en `remisiones/spec.md` y `:170-182` está citada en la delta y en la propuesta. Si eslint rechaza el `;`, el campo va en una línea nueva `:41` y se remiden `:48` y `:170-182` (+1) |
| D5 | Predicado `faltaFotoPorNovedad(hayNovedad: boolean \| null \| undefined, numFotos: number): boolean` → `hayNovedad === true && numFotos < 1`, **al final** de `packages/shared/src/remision.ts` (después de `:102`). Ya lo exporta `index.ts:14` (`export * from './remision'`), así que `index.ts` no se toca | Un fichero nuevo | Es el mismo módulo que `VENTANA_REENVIO_SEGUNDOS` y `urlSegura`. Al final no desplaza nada |
| D6 | `Remision` (`types.ts:713-733`) gana `hayNovedad: boolean \| null` justo antes del `}` de `:733`, con dos líneas de JSDoc (+3) | Hacerlo opcional | No hay ninguna cita a `types.ts` entre `:733` y el final. Los dos fixtures que construyen `Remision` usan `as Remision` (`botonRemision.test.ts:7`, `remisionWebhook.test.ts:10`) y no se rompen |
| D7 | Guarda en `/enviar`, **5 líneas insertadas entre `:282` y `:283`** (quedan en `:283-287`). Cuenta las fotos con la función **existente** `listFotos(db, id)` (`db/remisiones.ts:202-211`, sólo metadatos, ya importada en `routes/remision.ts:9`). Mensaje del 422: «El equipo llegó con novedad y la remisión no tiene fotos: sube al menos una antes de enviarla.» El import de `:4` crece en línea | Crear `contarFotos`, o poner la guarda después de reclamar | No escribe nada. Va antes de reclamar porque un 422 posterior dejaría `enviado_at` puesto y bloquearía la remisión 120 s. Encaja en A<B<C<D |
| D8 | El payload no cambia. `buildRemisionPayload` arma campo a campo (`remisionWebhook.ts:40-65`) y no hace *spread* de `Remision`, así que `hayNovedad` no puede colarse solo. El flujo de n8n de producción (`Remisiones_ST_3.13`) y `_Desk` no se tocan | Añadirlo como campo aditivo | Lo exige la delta (RQ-RE-17) |
| D9 | Cliente: `client.ts` gana `hayNovedad?: boolean` al final de `CrearRemisionPayload` (después de `:533`). `CrearRemision.tsx` recibe: import del predicado, estado `useState<boolean \| null>(null)`, una comprobación en `submit()` (sin contestar → `setErr`; Sí y 0 fotos → `setErr`), la pregunta Sí/No antes de «Registro fotográfico», `hayNovedad` en `:75` y la condición de «Continuar sin fotos» (`:328`), que suma `&& !faltaFotoPorNovedad(hayNovedad, envio.fotosSubidas)`. «Enviar esa» (`:314`) no cambia: el 422 le llega en el panel de desenlace (s7) | `required` nativo del HTML | Con `setErr` el mensaje sale en español y se controla, sigue el patrón del formulario y el consumo del predicado queda a la vista (regla 13.1). No hay ninguna cita a `client.ts` por encima de `:533` |
| D10 | Pruebas de ruta en un fichero **nuevo**, `apps/desk/server/fotoNovedad.test.ts`, con `testing/appHarness`. Las del predicado se añaden al final de `packages/shared/src/remision.test.ts` | Ampliar `remisiones.test.ts` | Ese fichero está muy citado (`:631`, `:868`, `:957`, `:1061`). Uno nuevo no desplaza nada |

## Flujo de datos

    Formulario ──hayNovedad──► POST /api/remisiones ──:246──► createRemision ──► public.remisiones.hay_novedad
    Formulario ──fotos──► POST /:id/fotos ──► public.remision_fotos
    POST /:id/enviar: 404 (:272) → anulada (:275) → ya enviada (:280) → [NUEVA :283-287 faltaFotoPorNovedad + listFotos → 422]
                      → reclamarEnvio (:291-293 después) → sin ticket (:296 después) → payload (sin cambios) → n8n

## Regla de mutación 3: cada decisión del cliente frente a la línea del servidor

| Decisión del cliente | Línea del servidor | Caso |
|---|---|---|
| No deja crear sin contestar la pregunta | **Ninguna** | Regla 13.2, declarada en RQ-RE-19 y en (s5): la guarda está sólo en el cliente. Enviar `false` y no contestar son elusiones equivalentes |
| No deja crear con «Sí» y 0 fotos | `routes/remision.ts:285` (después), en `/enviar` | Espejo legítimo (13.3), probado por `fotoNovedad.test.ts`. El cliente es MÁS estricto: bloquea al crear, y el servidor bloquea al enviar |
| Oculta «Continuar sin fotos» si quedaría en 0 | La misma `:285` | Espejo legítimo, igual que la fila anterior |
| Manda `hayNovedad` sólo como booleano | `routes/remision.ts:246` normaliza a `true`/`false`/`null` | El servidor no confía en el cliente |

## Estrategia de pruebas (strict TDD, en rojo antes que en verde)

| Prueba | Fichero | Qué fija |
|---|---|---|
| P1 predicado: `true`/0 → `true`, `true`/1 → `false`, `false`/0 y `null`/0 → `false` | `remision.test.ts` (al final) | RQ-RE-18 |
| P2 el alta persiste `true`, `false` y `null` (ausente y `'true'` en texto) y responde 201 | nuevo | RQ-RE-17 |
| P3 novedad sin fotos: 422, `fetch` sin llamar y `enviado_at IS NULL` en la base | nuevo | RQ-RE-08 orden 4 |
| P4 **C<D**: el 422 de P3, luego subir una foto y reenviar de inmediato → 200 (con webhook configurado y `fetch` simulado) | nuevo | Demuestra que no reclamó |
| P5 **B<C**: anulada con novedad y 0 fotos → 409 de anulada; `estado='ok'` con novedad y 0 fotos → 409 de ya enviada | nuevo | Orden |
| P6 `false`/`null` con 0 fotos → 200 | nuevo | No es retroactiva |
| P7 payload con novedad y 1 foto: el cuerpo no tiene la clave `hayNovedad` | nuevo | RQ-RE-17 |
| P8 guardián 37/19 | `migrate.test.ts` | Mutación 2 |

**Mutaciones que tienen que ponerse en rojo:**

- **M1**: guarda movida después de `reclamarEnvio` → P4 da 409 y P3 ve `enviado_at` puesto.
- **M2**: guarda movida antes de «anulada» → P5 (anulada) en rojo.
- **M3**: guarda movida antes de «ya enviada» → P5 (`ok`) en rojo.
- **M4**: predicado cambiado a `hayNovedad !== false` → P1 y P6 (`null`) en rojo.
- **M5** (fichero vigilado): en `schema.sql`, `ALTER TABLE remisiones …` sin calificar → rojo en `migrate.test.ts:345-352`. Si se borra la `ALTER`, P8 y P2 en rojo.
- **M6**: el alta con `b.hayNovedad ?? null` → P2 (`'true'` en texto) en rojo.
- **M7**: `hayNovedad` añadido al payload → P7 en rojo.
- **M8**: `toRemision` sin el campo → P2 en rojo.

## Barrido de citas (regla de mutación 4): qué desplaza este diseño

**Desplazan 0:** `schema.sql`, `db/remisiones.ts`, `remisionWebhook.ts`, `shared/remision.ts`, `index.ts`, `migrate.test.ts`, `remisiones.test.ts` y `client.ts`.

**`routes/remision.ts`: +5 desde la línea 283.** Se re-apuntan (Caso A):

- `trazas/spec.md`: la 377 pasa de `:363` a `:368`, la 380 de `:358-362` a `:363-367` y la 382 de `:325` a `:330`.
- `remisiones/spec.md`: la 31 pasa de `:353-363` a `:358-368`, la 35 de `:275-288` a `:275-293`, la 203 de `:307` a `:312`, la 206 de `:309` a `:314`, la 235 de `:344-346` a `:349-351`, la 270 de `:363` a `:368`, la 295 de `:318` a `:323` y la 496 de `:354-356` a `:359-361`. A eso se suma un segundo pase por las abreviadas.
- `F0-01_Correcciones…md`: las líneas 546, 548 y 550.

Se clasifican leyendo la frase, por ser registros fechados y probablemente Caso B: `F0-00_Baseline…md:173` y `:468`, y el plan del 2026-08-07, línea 31. La delta y la propuesta están ancladas a `a0a2935`. **Al fusionar**, la tabla de RQ-RE-08 pasa a ser presente y hay que re-apuntar sus filas: la 5 a `:291-293`, la 6 a `:296` y la 4 a `:283-287`.

**`CrearRemision.tsx`: desplazamiento inevitable.** El estado tiene que declararse antes del `return` de `:153` (reglas de los hooks). Quedan +1 desde `:3`, +2 desde `:52` y ≈+5 desde `:93`, y el bloque de la pregunta suma ≈+13 desde `:266`. Se remide la línea 220 de `CLAUDE.md`, que dice que el cliente «hoy» recorta «en esa misma línea» `:195`: ese «hoy» se re-apunta a la línea real. Hay que clasificar `ENTRADA.md:1173` (`:264`) y `Paquete_de_Despliegue_2026-09-10.md:70` (`:195`).

**`types.ts`: +3 desde `:733`.** No tiene ninguna cita afectada.

## Desacuerdos con la delta (no materiales; se sigue la delta)

1. La delta dice que `reclamarEnvio` es «el único `UPDATE` que fija `enviado_at`». `liberarEnvio` (`db/remisiones.ts:185-187`) también lo escribe, aunque a `NULL`. Si «fija» se lee como «sella con `now()`», la frase es cierta. No cambia nada del diseño.
2. Las abreviadas `:286-288` y `:291` de la delta dejan de ser ciertas tras el apply. Se re-apuntan al cerrar, como se indica arriba.

## Tamaño (medida `--no-renames` más lo nuevo sin trackear)

| Fichero | Líneas |
|---|---|
| `schema.sql` +3 · `migrate.test.ts` ±8 · `db/remisiones.ts` ±8 · `routes/remision.ts` +7/−2 | ~28 |
| `shared/remision.ts` +14 · `remision.test.ts` +30 · `types.ts` +3 | ~47 |
| `fotoNovedad.test.ts` (nuevo) | ~180 |
| `client.ts` +5 · `CrearRemision.tsx` ~+22/−3 | ~30 |
| Barrido de citas (≈14 líneas modificadas) | ~30 |
| **Código y barrido** | **~315** |
| `apply-progress` más las marcas de `tasks.md` | ~220 |
| **Lote de apply** | **~535 → UN lote** (el `.tsx` no hace falta separarlo) |

Si el intento incluye verify (~230), la suma es ~765: se queda en el límite, así que se recomienda aplicar sin verify.

## Matriz de amenazas

N/A. El cambio no toca enrutado de shell, subprocesos, automatización de VCS/PR ni clasificación de ejecutables.

## Migración y despliegue

La columna es aditiva y `NULL`-able, y la crea `migrate` al arrancar. Las filas existentes quedan en `NULL`, que significa «sin declarar» y no exige foto. No hay backfill ni flag. Para volver atrás se revierte el commit.

## Preguntas abiertas

Ninguna que bloquee. Las cuatro de la propuesta siguen con su supuesto.
