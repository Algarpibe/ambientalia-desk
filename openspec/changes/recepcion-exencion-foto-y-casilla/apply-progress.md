# Apply-progress · recepcion-exencion-foto-y-casilla (F1B-04, `cierra: no`) · Lote 1 (tareas 1.1 a 4.3; 4.4 a medias)

Modo: Strict TDD. Base `39ca37b`, sin commitear. Lote 2 (5.x, cliente) NO empezado.

## Rojos vistos antes del producto
| Tareas | Rojo literal |
|---|---|
| 1.1 | `migrate.test.ts`, 4 rojas: «expected 59 to be 64» y tres de posición (`l[l.length - 16/13/11]` leían otra sentencia) |
| 1.2 | PS-8 «column "exenta_de_foto" does not exist», PS-9 «Column "exenta_de_foto" not found», PS-10 «expected [] to have a length of 2», PS-11 «sin_accesorios_at existe: expected [] to have a length of 1» |
| 1.3 | PF-1 a PF-4, PI-7, PI-8, PI-8b, PO-1, PO-1b rojas (9); PM-1 nació VERDE (caracteriza) |
| 1.4 | 15 rojas: PL-1, PA-5, PA-6, PT-1, PT-1b, PT-2, PT-3, PE-5, PE-5b, PE-6, PE-6b, PE-7, PE-8, PE-8b, PW-1. Nacieron verdes (caracterizan): PA-4, PT-1c, PT-3b, PE-8c |
Pruebas añadidas fuera de D7 (justificadas por la spec): PL-1 (la lectura sirve la marca), PT-1b/1c, PT-3b, PE-5b, PE-6b, PE-8b/8c, PI-8b, PO-1b.

## Verde y preguntas abiertas del diseño
- **pg-mem y `ADD COLUMN … NOT NULL DEFAULT false`**: la acepta, pero en filas ya existentes `UPDATE … WHERE … AND exenta_de_foto = false` NO casa (probado: 0 filas; `NOT f`, `<> true` tampoco; `IS NOT TRUE` y `COALESCE(f,false)=false` sí).
- `ETIQUETA_CASILLA` y `ERR_SIN_ACCESORIOS_CON_INCLUYE` declaradas al final y usadas antes: typecheck y lint pasan.
- Ningún `toEqual` exacto se rompió por la forma de la remisión o del catálogo.
- `information_schema.columns.is_nullable` de pg-mem dice `NO` para toda columna: PS-11 prueba la NULL-abilidad insertando una fila sin ellas.

## Desviaciones del diseño
1. **D1**: el `UPDATE` lleva `AND exenta_de_foto IS NOT TRUE` en vez de `= false` (motivo: pg-mem, arriba). Mismo efecto en Postgres (columna `NOT NULL`). PS-10 y M2b lo fijan con el texto nuevo.
2. **D3/S3**: el apply escribió las frases CON punto final porque así las nombraba el delta; el orquestador lo corrigió el 2026-10-12 en el cierre del lote, porque daba «.;» en el texto que llega al documento del cliente. Hoy van SIN punto, como decía el diseño: `Rayón o daño estético; Llegó sin accesorios; Llegó sin embalaje`. Se corrigieron a la vez el código (`packages/shared/src/recepcion.ts:60`), las pruebas PO-1, PO-1b, PT-1, PT-2 y PW-1, y el delta (RQ-RE-38).
3. **D1 (ajuste extra)**: `migrate.test.ts:652` (cuenta de sentencias tras `prioridad_ajustes`, `… + 1` → `… + 1 + 6`) no estaba en el diseño y se rompió con el `schema.sql`. Corregida en sitio.
4. Sin otras: ninguna línea insertada por el medio de un fichero citado; ver «Citas».

## Mutaciones (todas restauradas; `git diff --stat` idéntico a la base tras cada una)
| Mut. | Rotura | Rojas |
|---|---|---|
| M1a | línea 102 de `shared/recepcion.ts` movida al principio de `validarRecepcion` | PI-7 |
| M1b | S4 fuera de `validarRecepcion` y puesto en `routes/remision.ts` tras el 409, antes del checklist | PA-5 (+PI-7, por quitar el paso 7) |
| M2a | `ALTER TABLE catalogo_novedades` sin `public.` (`schema.sql:822`) | `migrate.test.ts`: «las ALTER sin calificar son exactamente las de DESK_TABLES», «toda ALTER TABLE apunta a una tabla clasificada», «son 64 ALTER…»; PS-10 |
| M2b | quitar el `UPDATE` (`:823`) · quitarle la guarda `AND … IS NOT TRUE` | PS-8, PS-9, PS-10 (+5 de posición y 4 de ruta) · PS-10 |
| M2c | `ALTER remisiones … sin_embalaje_at` sin `public.` | `migrate.test.ts` (las tres de arriba); PS-11 |
| M4a/b/c | `recepcion.ts:139`: sin condición de accesorios · sin la de embalaje · intercambiadas | PF-3, PF-4, PE-7, PE-8b, PW-1 · PF-3, PF-4, PE-8, PE-8b, PW-1 · PF-3, PF-4, PE-7, PE-8 |
| M5 | equipo eximido si hay alguna casilla | PF-3, PF-4, PE-8b |
| M6a/b | quitar `exentaDeFoto` de `:141` · leer la exención por `excluyeDemas` | PF-1, PF-2, PF-4, PE-5, PE-5b, PE-6, PE-6b (las dos igual) |
| M7 | `...r` en `buildRemisionPayload` | PW-1 y «el payload a n8n NO cambia…» |
Ninguna mutación quedó sin detector: no hizo falta prueba extra.

## Regla de mutación 3 (D5, parte servidor) y M3
| Decisión del cliente | Línea del servidor | M3: quitarla → rojo |
|---|---|---|
| Sin selector de novedad exenta | `routes/remision.ts:289` (catálogo a `motivoNoEnviable`) + `recepcion.ts:141` | catálogo `[]` → PE-5, PE-5b, PE-6, PE-6b, PE-2 |
| Sin selector con su casilla | `recepcion.ts:139`; la columna, `routes/remision.ts:250` | `false` en `:250` → PT-1, PT-1b, PT-2, PE-7, PE-8, PE-8b |
| Vacía y bloquea «Incluye» | `recepcion.ts:102` (paso 7), vía la guarda `:158` | quitar el paso → PA-5, PA-6, PI-7 |
| Quién y cuándo | `db/remisiones.ts:50` | `por` a `null` → PT-1, PT-1b, PT-2; hora `new Date(0)` → PT-1b, PT-2 |
| Casillas sólo en el formulario nuevo | `services/recepcion.ts:16` / `routes/remision.ts:250` (legado → `null`) | el legado escribe casillas → PT-3 |
| Bloquea «Crear» | espejo de `:158` y de la sexta puerta | RF-3 (lote 2) |
| Descarta fotos del plan | ninguna, a propósito (RF-2): comodidad, no guarda | — |

## Cierre
Códigos (sin commitear, árbol de trabajo): `npm test` **exit 0**, 267 ficheros pasan (+3 saltados), 4443 pruebas pasan (+11 saltadas); `npm run typecheck` **exit 0**; `npx eslint . --max-warnings 165` **exit 0**, 165 warnings, 0 errores; `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` **exit 0**, pero compara el commit `39ca37b` (HEAD), no el árbol: falta repetirlo tras el commit del orquestador (4.4 sigue abierta).
Medida (4.2): `git diff --shortstat --no-renames 39ca37b` = 13 ficheros, 511 inserciones + 59 borrados = **570**, y sin trackear (este fichero) **56** → suma **626**. De ellas, 38 son las 19 casillas de `tasks.md` y 56 este informe: código y pruebas solos, **532**. La suma supera 600 sólo con el papeleo; el lote 2 (~135) va en otro intento.

## Citas (regla de mutación 4)
Ninguna línea se movió: `routes/remision.ts` 397=397, `db/remisiones.ts` 240, `db/novedades.ts` 42, `services/recepcion.ts` 19, `types.ts` 810, `migrate.test.ts` 911 iguales; `schema.sql` 818→828 y `shared/recepcion.ts` 183→194 sólo crecen por el final. De 762 citas, 29 caen en líneas editadas; todas siguen diciendo lo mismo (caso A), o son de paquetes de despliegue fechados (caso B). La línea 102 de `shared/recepcion.ts` ya no está vacía. A reapuntar: ninguna.

---

# Lote 2 · cliente (tareas 5.1 a 5.6) · base `cc8ca6f`, sin commitear

Modo: Strict TDD. Ficheros: `apps/desk/src/lib/recepcionForm.ts`, `recepcionForm.test.ts`, `apps/desk/src/api/client.ts`, `apps/desk/src/components/CrearRemision.tsx`. Servidor, shared, esquema y `remisionWebhook.ts` intactos.

## Rojo (5.1), antes del producto
`npx vitest run apps/desk/src/lib/recepcionForm.test.ts`: 8 rojas de 32. La existente de la línea 115 (el `cuerpo` sin las tres claves nuevas: «expected { …(3) } to deeply equal { …(6) }»); RF-1 x3 («selectoresDeFoto is not a function»); RF-2 («expected [ 'e', 'a', 'm' ] to deeply equal [ 'e', 'm' ]»); RF-3 x2 («Faltan fotos obligatorias: de los acc…» to be null); RF-4 («expected undefined to deeply equal []»). Nacieron VERDES, porque caracterizan lo que ya hace shared: RF-3 «novedad exenta sin foto» y RF-3 «Llegó sin accesorios con accesorios en Incluye» (su rojo son las mutaciones M-d1).

## Verde (5.2, 5.3)
- `recepcionForm.ts`: `motivoNoCreable` toma `CuerpoRecepcion` y evalúa la remisión con la traza de las casillas (`marcaCasillas`, sólo las marcadas, para no cambiar la forma de `remision` sin casillas); `vistaDelFormulario` gana el sexto parámetro `casillas` (por defecto todo apagado), quita del plan las fotos de la categoría con casilla (RF-2), pone `sinAccesorios`, `sinEmbalaje` e `incluye` en `cuerpo` (vacío si `sinAccesorios`, D5) y devuelve `selectores`; `selectoresDeFoto` al final = `fotosQueFaltan` con cero fotos. 32 de 32 verdes.
- `client.ts:535`: `sinAccesorios?`, `sinEmbalaje?` en `CrearRemisionPayload`, en sitio.
- `CrearRemision.tsx`: dos estados en la línea 60 (misma línea); la línea 78 ya no calcula `incluye` (viene en `vista.cuerpo`; misma cuenta de líneas); línea 116 con el sexto argumento; línea 263 marca desde `vista.cuerpo.incluye` y se bloquea con la casilla; dos casillas con `ETIQUETA_CASILLA` antes de los selectores; los selectores salen de `vista.selectores` (el `.tsx` deja de leer `excluyeDemas`).

## Desviaciones del diseño
1. `recepcionForm.ts` NO se editó sólo en sitio como decía D9: `marcaCasillas` (+4 líneas desde la 48) y los cambios de `vistaDelFormulario` desplazan lo de debajo (`motivoNoCreable` 54→58, `puedeContinuarSinPendientes` 66→70, `vistaDelFormulario` 77→82). Barrido abajo: sólo `proposal.md:36` cita ese fichero con línea.
2. `CrearRemision.tsx`: la inserción es de **+2** desde la línea 311 (no +7): el bloque 304-310 (7 líneas) pasa a 9; 311 pasa a 313. Nada cambia de sitio antes de la 304.
3. Las casillas se pintan siempre, también con la remisión creada (deshabilitadas por `congelado`).
4. 5.7 (texto para el maestro, sección del `archive-report.md`) NO se hizo: es de la fase archive; queda sin marcar.

## Mutaciones del cliente (todas restauradas; `cmp` con la copia previa y `git diff --stat` idénticos)
| Mut. | Rotura | Rojas |
|---|---|---|
| M-a | quitar `sinEmbalaje` del cuerpo | «vistaDelFormulario > une lista, marcadas por orden del catálogo, plan, cuerpo y motivo»; «RF-3 con la casilla y sin esa foto no hay motivo; sin la casilla sí»; «RF-4 el cuerpo lleva las casillas y vacía «Incluye» con «Llegó sin accesorios»» |
| M-b | `selectoresDeFoto` ignora la casilla de accesorios | «RF-1 cada casilla quita sólo su categoría; equipo nunca se quita» |
| M-c | `selectoresDeFoto` ignora `exentaDeFoto` | «RF-1 la novedad exenta no pide selector, la que excluye a las demás tampoco, la normal sí» |
| M-d1 | `motivoNoCreable` no pasa `incluye`/casillas a `validarRecepcion` | «RF-3 con la casilla y sin esa foto…»; «RF-3 «Llegó sin accesorios» con accesorios en «Incluye»: el motivo es el de validarRecepcion»; «RF-3 motivoNoCreable pasa las casillas a la remisión evaluada»; «RF-4…» |
| M-d2 | `motivoNoCreable` no pasa la traza de las casillas a la remisión evaluada | «RF-3 con la casilla y sin esa foto…»; «RF-3 motivoNoCreable pasa las casillas…»; «RF-4…» |
(Un primer intento de M-a, M-d1 y M-d2 no aplicó la rotura por los saltos de línea CRLF y daba verde; se repitió con el cambio comprobado.)

## Regla de mutación 3 (lote 2) · decisión del cliente → línea del servidor, leída contra el código final
| Decisión del cliente | Línea del servidor | Prueba |
|---|---|---|
| Casillas en el cuerpo del alta | las recibe `routes/remision.ts:158` (`resolverRecepcion`, cuerpo entero); la traza (quién y cuándo) la escribe el servidor en `db/remisiones.ts:50` | PT-1, PT-2 |
| Desaparece el selector de accesorios o de embalaje con su casilla | `/enviar`: `routes/remision.ts:289` (`motivoNoEnviable` → `fotosQueFaltan`, `shared/recepcion.ts:139`) | PE-7, PE-8 |
| Novedad exenta sin selector | la misma puerta `:289`, con la marca leída en `shared/recepcion.ts:141` | PE-5, PE-6 |
| Bloquea «Crear» con «Llegó sin accesorios» y accesorios marcados (y vacía/bloquea la lista) | paso (7) de `validarRecepcion` (`shared/recepcion.ts:102`), ejecutado en la guarda del alta `routes/remision.ts:158` | PA-5, PA-6, PI-7 |
| Bloquea «Crear» mientras falte foto | espejo de `:289` con las mismas funciones; en el alta no se puede imponer (las fotos se suben después) | RF-3 |
| Descarta del plan las fotos de la categoría con casilla | **Ninguna, a propósito**: `categoriaDeFoto` no mira casillas, una foto de más no falsea nada. Comodidad sin guarda | RF-2 |

## Citas (regla de mutación 4)
Barrido `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` fuera de `archive/`. **`client.ts`**: edición en sitio (línea 535), sin desplazamiento; sus citas caen muy antes. **`CrearRemision.tsx`**: sólo cambia de sitio lo posterior a la 310 (+2) y ninguna cita fuera de la carpeta del cambio apunta ahí (todas caen en líneas anteriores a la 304 y sin cambios, salvo `:263`, editada en sitio). `Paquete_de_Despliegue_2026-10-06.md` cita `:261` y `:264`: paquete fechado, caso B, no se toca. `proposal.md` (de este cambio) cita `CrearRemision.tsx:304-306` y `:307`: caso B (el bloque de ANTES, medido sobre `daea6d6`). **`recepcionForm.ts`**: `proposal.md:36` cita `:54-63` y `:77-87`: caso B (medidas sobre `daea6d6`). A reapuntar: ninguna.

## Cierre del lote 2 (base `cc8ca6f`, sin commitear)
`npm test` **exit 0**, 267 ficheros pasan (+3 saltados), 4452 pruebas pasan (+11 saltadas); `npm run typecheck` **exit 0**; `npx eslint . --max-warnings 165` **exit 0**, 165 warnings, 0 errores; `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` **exit 0** (compara el commit HEAD `cc8ca6f`, NO este árbol; repetir tras el commit del orquestador); `npm run build` **exit 0** (compila el `.tsx`).
Medida del lote: `git diff --shortstat --no-renames cc8ca6f` = 4 ficheros, 101 inserciones + 21 borrados = **122**, sin trackear 0; a eso se suman las ediciones de este informe y de `tasks.md`. Contra `daea6d6`: 21 ficheros, 1204 + 61 = **1265** (incluye artefactos y lote 1).
