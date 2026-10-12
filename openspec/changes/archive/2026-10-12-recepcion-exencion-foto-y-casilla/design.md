# Diseño: «Falta un accesorio» exenta de foto, y dos casillas con traza que sustituyen la foto de accesorios o de embalaje

## Enfoque técnico
La regla vive entera en `packages/shared/src/recepcion.ts` y se decide por **marcas**, nunca por clave ni etiqueta: `fotosQueFaltan` deja de pedir la foto de la novedad con `exentaDeFoto` y la de la categoría cuya casilla está marcada; `validarRecepcion` gana un séptimo paso (S4) y entrega las casillas ya normalizadas. El servidor no gana **ninguna guarda nueva**: las dos puertas que ya existen (`apps/desk/server/routes/remision.ts:158` en el alta y `apps/desk/server/routes/remision.ts:289` en `/enviar`) reciben más datos y su texto no cambia. **Flujo:** cuerpo del alta → `resolverRecepcion` → `validarRecepcion` (S4, casillas, `observaciones`) → `createRemision` (hora del servidor, usuario de la sesión) → `public.remisiones` → `getRemision` → `motivoNoEnviable` → `fotosQueFaltan`. El formulario pregunta a esa misma `fotosQueFaltan`, con cero fotos, qué selectores pintar. Todo fichero citado se edita **en sitio** (misma línea física) o **al final**; la única excepción es el `.tsx` (D9). Lo que aquí se dice de tipos, lint, pg-mem y mutaciones es **hipótesis** hasta ejecutarlo en el apply. Alcance y supuestos S1 a S7: los de `proposal.md`, sin reabrir.

## Decisiones
### D1 · Marca `exenta_de_foto` y columnas de traza — `packages/zoho-sync/src/db/schema.sql`, AL FINAL
Diez líneas tras la última de hoy (`packages/zoho-sync/src/db/schema.sql:818`); seis sentencias, todas calificadas, ningún punto y coma dentro de un comentario (`packages/zoho-sync/src/db/migrate.ts:20` parte por ese carácter):
```sql
-- recepcion-exencion-foto-y-casilla (F1B-04): novedad que NO exige foto porque lo que falta no se puede fotografiar. Molde de excluye_demas
-- El UPDATE es siembra de DATO: su WHERE lo deja sin efecto desde la segunda pasada. Quitar la marca por SQL no persiste (S5)
-- No es editable desde la pantalla de mantenimiento. AL FINAL para no desplazar citas. CALIFICADAS public.
ALTER TABLE public.catalogo_novedades ADD COLUMN IF NOT EXISTS exenta_de_foto boolean NOT NULL DEFAULT false;
UPDATE public.catalogo_novedades SET exenta_de_foto = true WHERE clave = 'falta_accesorio' AND exenta_de_foto = false;
-- Casillas de la recepcion con traza: quien y cuando marco que el equipo llego sin accesorios o sin embalaje. NULL-ables y SIN relleno
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS sin_accesorios_at timestamptz;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS sin_accesorios_por text;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS sin_embalaje_at timestamptz;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS sin_embalaje_por text;
```
| Opción | Contrapartida | Decisión |
|---|---|---|
| `ALTER` + `UPDATE` al final, sin tocar la siembra | El `UPDATE` corre en cada arranque (precedente: `packages/zoho-sync/src/db/schema.sql:320`) | **Elegida**: una sola vía sirve a la base nueva y a la desplegada |
| Además, retocar el `INSERT` de `packages/zoho-sync/src/db/schema.sql:695` | En esa línea la columna aún no existe (el `CREATE` de la `:682` no la trae); habría que tocar también la `:688`, y serían dos siembras de la misma marca (molde H5) | Rechazada: la `:695` no se toca |
| Columna en el `CREATE TABLE` | No llega a producción (`IF NOT EXISTS`) | Rechazada |

**Ajuste obligado en `packages/zoho-sync/src/db/migrate.test.ts`, todo en sitio.** Seis sentencias nuevas al final desplazan **+6** cada índice contado desde el final: línea 796, `10 → 16`; línea 798, `9 → 15` y `8 → 14`; línea 839, `7 → 13`; línea 840, `6 → 12`; líneas 879 y 882, `5 → 11`; línea 880, `4 → 10`; y los ordinales de los títulos de las líneas 794, 837 y 877. El recuento de `ALTER` (`packages/zoho-sync/src/db/migrate.test.ts:374-378`) pasa de 59 a **64**, calificadas de 33 a **38** (33 de `public` + 5 de `books`), sin calificar 26 intactas; y el conjunto de identidades calificadas de la línea 385 gana `public.catalogo_novedades`. `packages/zoho-sync/src/db/nitExentosEsquema.test.ts:51` ancla por orden relativo y no cambia. La prueba 6 de `packages/zoho-sync/src/db/novedadesSiembra.test.ts:94-97` no casa con las columnas nuevas (hipótesis: se confirma en rojo/verde).

### D2 · Tipo compartido y `fotosQueFaltan` — `packages/shared/src/recepcion.ts`, en sitio
- Línea 18: `exigeTexto: boolean; exentaDeFoto?: boolean`. **Opcional** a propósito: ausente equivale a no exenta, igual que hoy se lee `excluyeDemas !== true` (`packages/shared/src/recepcion.ts:141`). Rechazado hacerla obligatoria: obligaría a tocar el literal de `packages/shared/src/mantenimientoNovedades.ts:49` y tres catálogos de prueba, y la garantía de «nace sin exención» la da ya el `DEFAULT false` de la columna.
- Línea 124: `RemisionRecepcion` gana `sinAccesoriosAt?: string | null; sinEmbalajeAt?: string | null` (opcionales: los llamadores de hoy siguen compilando).
- Línea 139: `categorias: CATEGORIAS_FOTO_MINIMAS.filter((c) => !(c === 'accesorios' && rem.sinAccesoriosAt) && !(c === 'embalaje' && rem.sinEmbalajeAt) && !fotos.some((f) => f.categoria === c)),` — `equipo` no tiene excepción (S1).
- Línea 141: la lectura de la marca pasa a `((m) => m?.excluyeDemas !== true && m?.exentaDeFoto !== true)(catalogo.find((c) => c.clave === n.clave))`. Sigue leyendo por clave aunque la fila esté inactiva (RQ-RE-26).
- Línea 8 (cabecera): se añade `exentaDeFoto` a la lista de marcas. **Líneas que se mueven: ninguna**; el fichero conserva sus 183 y crece sólo por el final (D3).
- `apps/desk/server/db/novedades.ts:13` añade `exenta_de_foto` al `SELECT` y `apps/desk/server/db/novedades.ts:21` añade `exentaDeFoto: f.exenta_de_foto === true` en la misma línea.

### D3 · Casillas: cuerpo, columnas, escritura y `observaciones`
- **Cuerpo:** `sinAccesorios` y `sinEmbalaje`, booleanos opcionales; sólo `=== true` marca (nace cerrado, como `rotulado`). `apps/desk/src/api/client.ts:535` los añade en sitio.
- **`validarRecepcion`** (`packages/shared/src/recepcion.ts:77`, en sitio): el tipo del cuerpo pasa a `CuerpoRecepcion`, exportado al final del fichero con las claves de hoy más `sinAccesorios?`, `sinEmbalaje?` e `incluye?`, todas `unknown`. `RecepcionValidada` gana en la línea 45 `sinAccesorios: boolean; sinEmbalaje: boolean`, que el literal de la línea 109 rellena.
- **`observaciones` (S3):** `componerObservaciones` gana en la línea 57 un cuarto parámetro opcional `casillas?: { sinAccesorios?: boolean; sinEmbalaje?: boolean }`; la línea 60 añade las frases como elementos de la misma lista, tras las novedades y en orden fijo (accesorios, embalaje), y la línea 110 se lo pasa. Resultado: `Rayón o daño estético; Llegó sin accesorios; Llegó sin embalaje`. Las frases salen de `ETIQUETA_CASILLA = { sinAccesorios: 'Llegó sin accesorios', sinEmbalaje: 'Llegó sin embalaje' }`, exportada al final del fichero y reutilizada como rótulo de la casilla. **Desvío declarado de S3:** sin punto final dentro de la lista, porque el separador es `; ` (`packages/shared/src/recepcion.ts:52`); si el delta de `remisiones` dijera otra cosa, manda la spec.
- **Tipo de la remisión:** `packages/shared/src/types.ts:735` gana `sinAccesoriosAt`, `sinAccesoriosPor`, `sinEmbalajeAt`, `sinEmbalajePor` (`string | null`, obligatorios). Como `Remision` ya se pasa tal cual a `motivoNoEnviable`, `/enviar` no necesita edición.
- **Escritura** (`apps/desk/server/db/remisiones.ts`, en sitio): línea 40, `recepcion` gana `sinAccesorios: boolean; sinEmbalaje: boolean`; línea 45, `; const ahora = input.recepcion ? new Date() : null` (un solo instante para rotulado y casillas); líneas 47-48, cuatro columnas y `$18` a `$21`; línea 50, `ahora` para el rotulado y, por casilla, `input.recepcion?.sinAccesorios ? ahora : null` y `input.recepcion?.sinAccesorios ? input.recepcion.rotuladoPor : null` (ídem embalaje). El «quién» es el mismo usuario de la sesión que ya viaja en `rotuladoPor`: una sola resolución, un solo valor. Línea 25: `toRemision` lee las cuatro con `isoOrNull` y `?? null`.
- **Ruta:** `apps/desk/server/routes/remision.ts:250`, en sitio: el objeto `recepcion` añade `sinAccesorios: rec.sinAccesorios, sinEmbalaje: rec.sinEmbalaje`. Legado (`rec` nulo): `recepcion: null`, cuatro columnas `NULL` (S7).

### D4 · La incompatibilidad de S4 es el paso (7) de `validarRecepcion` — sin guarda nueva y sin reordenar
| Opción | Contrapartida | Decisión |
|---|---|---|
| (i) Dentro de la guarda de recepción (`apps/desk/server/routes/remision.ts:158`), como paso interno de `validarRecepcion` | El paso lee `incluye`, que es del checklist; hereda el punto (3) de IV-12 (C antes de la A de la orden de venta), que ya está registrado | **Elegida** |
| (ii) Dentro de la guarda del checklist (`apps/desk/server/routes/remision.ts:194-197`) | Corre **después** del `409` de remisión pendiente (`apps/desk/server/routes/remision.ts:177`): un escalón C tras un D, o sea un punto **nuevo** de IV-12; pide un segundo mensaje y una condición de legado (`rec` no nulo) dentro de una guarda que hoy no sabe de recepción | Rechazada |
| (iii) Guarda nueva en la ruta | Es exactamente lo que S4 pide evitar | Rechazada |

**Dónde:** en la línea 102 de `packages/shared/src/recepcion.ts`, hoy vacía, así que no desplaza nada: `if (cuerpo.sinAccesorios === true && Array.isArray(cuerpo.incluye) && cuerpo.incluye.length > 0) return { ok: false, error: ERR_SIN_ACCESORIOS_CON_INCLUYE }`, con el texto «Llegó sin accesorios» no admite accesorios marcados en «Incluye»: desmarca la casilla o la lista. Las líneas 70-73 del comentario declaran el paso (7). `apps/desk/server/services/recepcion.ts:17` cambia sólo su conversión de tipo a `CuerpoRecepcion`: el cuerpo entero ya llega (`apps/desk/server/routes/remision.ts:158` pasa `b`). **Por qué es su sitio:** es validez de contenido (escalón C) y la `:158` es la posición C ya fijada entre el serial (A) y el `409` (D) por `apps/desk/server/recepcion.test.ts:245-271`. Va **último** entre los pasos internos para no alterar ningún par ya probado. Se lee `incluye` con el mismo criterio que la ruta (`apps/desk/server/routes/remision.ts:195`): lo que no es lista cuenta como vacío. No aplica en legado (`apps/desk/server/services/recepcion.ts:16`).

| Coinciden | El usuario ve | Lo fija |
|---|---|---|
| Sin serial + S4 | «Falta el serial…» (A) | PA-4 |
| Novedades inválidas, «Otro» sin texto o sin rotulado + S4 | El de los pasos (2) a (6) | PI-7 (shared) |
| S4 + remisión pendiente sin `permitirSegunda` | `422` de S4, no `409` (C antes que D) | PA-5 |
| S4 + ítem fuera del checklist | El de S4 (`:158` antes que `:197`, los dos C) | PA-6 |
| S4 + orden de venta inexistente | El de S4 (C antes que A: IV-12 punto 3, heredado, no nuevo) | Sin prueba nueva; se anota |

### D5 · Cliente — regla invariable 13 y regla de mutación 3
`apps/desk/src/lib/recepcionForm.ts`: nueva función pura **al final**, `selectoresDeFoto(catalogo, marcadas, casillas)`, que devuelve `fotosQueFaltan({ hayNovedad: null, novedades: [...marcadas], rotuladoAt: null, sinAccesoriosAt, sinEmbalajeAt }, [], catalogo)`: «qué selectores se pintan» es literalmente «qué fotos faltan con cero fotos», así que no se reescribe ninguna regla. `vistaDelFormulario` gana en la línea 78 un sexto parámetro `casillas = { sinAccesorios: false, sinEmbalaje: false, incluye: [] }`; la línea 82 quita del plan las fotos de la categoría con casilla; la línea 83 añade al cuerpo `sinAccesorios`, `sinEmbalaje` e `incluye` (vacío si `sinAccesorios`); las líneas 61 y 85 pasan las casillas a la remisión evaluada; la línea 86 devuelve `selectores`; la línea 2 importa `fotosQueFaltan` y la línea 56 usa `CuerpoRecepcion`. `apps/desk/src/components/CrearRemision.tsx` sólo pinta: dos estados en la línea 60, `vista.cuerpo.incluye` en la línea 78, el sexto argumento en la línea 116, `disabled={congelado || sinAccesorios}` y marcado desde `vista.cuerpo.incluye` en la línea 263, y las líneas 304-310 se sustituyen por los selectores de `vista.selectores` más las dos casillas.

| Lo que el formulario decide | Línea del servidor que lo impone | Prueba |
|---|---|---|
| No pinta selector de una novedad exenta | `apps/desk/server/routes/remision.ts:289-293`, con la marca leída en `packages/shared/src/recepcion.ts:141` | PE-5, PE-6 |
| No pinta el selector de accesorios o embalaje con su casilla | La misma puerta, con `packages/shared/src/recepcion.ts:139`; la columna la escribe `apps/desk/server/routes/remision.ts:250` | PE-7, PE-8 |
| Vacía y bloquea «Incluye» con «Llegó sin accesorios» | `apps/desk/server/routes/remision.ts:158`, paso (7) de `validarRecepcion` | PA-4 a PA-6 |
| Bloquea «Crear» mientras falte algo | Espejo de `apps/desk/server/routes/remision.ts:158` y de la sexta puerta, con las mismas funciones | RF-3 |
| Quién marcó la casilla y cuándo | No viaja: lo escribe el alta (`apps/desk/server/db/remisiones.ts:50`) | PT-2 |
| Las casillas sólo cuentan en el formulario nuevo | `apps/desk/server/services/recepcion.ts:16` | PT-3 |
| Descarta del plan las fotos de la categoría con casilla | **Ninguna, a propósito:** `categoriaDeFoto` no mira casillas; una foto de más no falsea nada. Es comodidad, no guarda | RF-2 |

### D6 · Lo que NO cambia
- **Payload a n8n:** `apps/desk/server/remisionWebhook.ts:40-65` enumera sus claves una a una, así que los campos nuevos de `Remision` no viajan; sólo cambia el valor de `observaciones` (`apps/desk/server/remisionWebhook.ts:45`). Lo fija PW-1. No hace falta campo nuevo: la condición de parada de la propuesta no se activa.
- **Legado:** `apps/desk/server/services/recepcion.ts:16` y `packages/shared/src/recepcion.ts:137` y `packages/shared/src/recepcion.ts:154` no se tocan.
- **`/enviar`:** sigue siendo una sola puerta (`apps/desk/server/routes/remision.ts:289-293`), sin editar: cambia lo que `rem` lleva dentro.
- **Mantenimiento (S5):** la marca no es editable porque `CambiosNovedad` (`packages/shared/src/mantenimientoNovedades.ts:22`) no la incluye, el mapa de columnas de `apps/desk/server/db/novedades.ts:38` está tipado por esas claves, y el alta no la escribe (`apps/desk/server/db/novedades.ts:31`, `packages/shared/src/mantenimientoNovedades.ts:49`). `packages/shared/src/mantenimientoNovedades.ts` **no se edita**: un `exentaDeFoto` en el cuerpo se ignora. Lo fija PM-1.

### D7 · Pruebas (`strict_tdd`: el rojo se anota antes del producto) y mutaciones — HIPÓTESIS
Todas se añaden **al final** de su fichero. Ediciones en sitio previstas en pruebas existentes: `apps/desk/src/lib/recepcionForm.test.ts:115` (el cuerpo gana tres claves) y los índices de D1.

| Fichero | Casos nuevos |
|---|---|
| `packages/shared/src/recepcion.test.ts` | PF-1 novedad exenta sin foto no falta, la no exenta sí · PF-2 exenta e inactiva sigue exenta · PF-3 casilla de accesorios quita sólo `accesorios`; la de embalaje, sólo `embalaje`; `equipo` falta siempre · PF-4 `motivoNoEnviable` nombra sólo lo no eximido · PI-7 orden interno: pasos (2) a (6) ganan al (7) · PI-8 `sinAccesorios` con `incluye` vacío o no lista: válido; `sinEmbalaje` con `incluye`: válido · PO-1 frases y su orden en `observaciones` |
| `apps/desk/server/recepcion.test.ts` | PA-4, PA-5, PA-6 (posición, D4) · PT-1 alta con casillas guarda quién y cuándo · PT-2 `sinAccesoriosPor` y `sinAccesoriosAt` del cuerpo se ignoran · PT-3 legado con casillas: `201` y cuatro `NULL` · PE-5 a PE-8 `/enviar` con exenta y con cada casilla; sin foto del equipo, `422` · PW-1 claves del payload idénticas |
| `packages/zoho-sync/src/db/novedadesSiembra.test.ts` | PS-8 sólo `falta_accesorio` exenta, diez filas en `false` · PS-9 fila puesta a `false` + `migrate` otra vez → `true`, y las diez siguen igual · PS-10 exactamente dos sentencias nombran `exenta_de_foto`, con su texto calificado · PS-11 cuatro columnas `NULL`-ables, cuatro `ALTER` calificadas |
| `apps/desk/src/lib/recepcionForm.test.ts` | RF-1 `selectoresDeFoto` por casilla y por novedad exenta · RF-2 plan sin las fotos de la categoría con casilla · RF-3 `motivo` nulo con casilla y sin esa foto · RF-4 `cuerpo.incluye` vacío con `sinAccesorios` |
| `packages/shared/src/mantenimientoNovedades.test.ts` | PM-1 `exentaDeFoto` en el alta y en el cambio no produce cambio alguno |

| Mutación (se restaura siempre; resultado anotado en `apply-progress.md`) | Debe ponerse roja |
|---|---|
| **M1a** (regla 1) mover el paso (7) al principio de `validarRecepcion` | PI-7 |
| **M1b** (regla 1) llevar la condición de S4 a la guarda del checklist, tras el `409` | PA-5 |
| **M2a** (regla 2) `ALTER TABLE catalogo_novedades …` sin calificar en `schema.sql` | `packages/zoho-sync/src/db/migrate.test.ts:332` y `packages/zoho-sync/src/db/migrate.test.ts:345`; PS-10 |
| **M2b** (regla 2) quitar el `UPDATE` · quitarle `AND exenta_de_foto = false` | PS-8 y PS-9 · PS-10 |
| **M2c** (regla 2) un `ALTER public.remisiones` de casilla sin `public.` | `packages/zoho-sync/src/db/migrate.test.ts:345`; PS-11 |
| **M3** (regla 3) cada fila de la tabla de D5: quitar su línea del servidor | La prueba de su fila |
| **M4** quitar de la línea 139 la condición de accesorios · la de embalaje · intercambiarlas | PF-3, PE-7 · PF-3, PE-8 · PF-3 |
| **M5** eximir también `equipo` | PF-3, PE-8 |
| **M6** quitar `exentaDeFoto` de la línea 141 · leer la exención por `excluyeDemas` | PF-1, PE-5 · PF-1 |
| **M7** `...r` en el payload | PW-1 |

### D8 · Presupuesto (inserciones + borrados; una línea editada en sitio cuenta dos)
| Fichero | Líneas |
|---|---|
| `schema.sql` (+10) · `migrate.test.ts` (11 en sitio) · `novedadesSiembra.test.ts` (+45) | 77 |
| `packages/shared/src/recepcion.ts` (11 en sitio, +5) · `types.ts` (1 en sitio) · `recepcion.test.ts` (+85) · `mantenimientoNovedades.test.ts` (+12) | 126 |
| `db/novedades.ts` (2) · `db/remisiones.ts` (6) · `services/recepcion.ts` (2) · `routes/remision.ts` (1), todo en sitio | 22 |
| `apps/desk/server/recepcion.test.ts` (+125) | 125 |
| `recepcionForm.ts` (8 en sitio, +12) · `recepcionForm.test.ts` (1 en sitio, +60) · `client.ts` (1 en sitio) · `CrearRemision.tsx` (4 en sitio, −7, +14) | 135 |
| Texto de corrección para el maestro (~15) y `apply-progress.md` (~130, sumando obligatorio) | 145 |

Total estimado: **~630** contra la válvula de 720 y el techo de 800: cabe en un intento. Se mide al cerrar con `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear. **Si la medida intermedia pasa de 600 antes del cliente, se parte:** lote 1 = esquema, `shared`, servidor y sus pruebas; lote 2 = `recepcionForm`, `client.ts` y el `.tsx`. El lote 1 es desplegable solo: sin el formulario nadie manda las casillas.

### D9 · Regla de mutación 4 — barrido de citas
| Fichero citado | Estrategia | Desplazamiento |
|---|---|---|
| `apps/desk/server/routes/remision.ts` | Una línea en sitio (la 250) | Ninguno |
| `packages/zoho-sync/src/db/schema.sql` | Al final | Ninguno |
| `packages/zoho-sync/src/db/migrate.test.ts` | Once líneas en sitio | Ninguno |
| `packages/shared/src/recepcion.ts` | Once en sitio (una de ellas, la 102, hoy vacía) y exportaciones al final | Ninguno |
| `packages/shared/src/types.ts`, `apps/desk/server/db/remisiones.ts`, `apps/desk/server/db/novedades.ts`, `apps/desk/server/services/recepcion.ts`, `apps/desk/src/lib/recepcionForm.ts`, `apps/desk/src/api/client.ts` | En sitio; lo nuevo, al final | Ninguno |
| `apps/desk/src/components/CrearRemision.tsx` | **Inserción inevitable** | Unas **+7** desde la línea 311 de hoy. Barrido hecho: fuera de `archive/`, sólo `proposal.md` de este cambio cita de la 304 en adelante, y es caso B (medido sobre `daea6d6`) |

Ningún número cambia, pero cambia lo que **dicen** dos líneas: la 102 de `packages/shared/src/recepcion.ts` deja de estar vacía, y las 139 a 142 ganan condiciones (las citas las describen como la exigencia de mínimas y de foto por novedad, y lo siguen siendo). El cierre repite el barrido completo y el segundo pase de abreviadas; si alguna línea tuviera que crecer, se dice y se barre antes de cerrar. IV-12 no gana punto: `CLAUDE.md` no se edita.

## Matriz de amenazas, despliegue y preguntas abiertas
**Matriz de amenazas:** N/A — no hay shell, subprocesos, automatización de VCS ni integración de procesos; no se añade ni se mueve ninguna ruta. **Despliegue:** la migración es aditiva y corre en el arranque; mirar en el primero que `exenta_de_foto` quede en `true` sólo en «Falta un accesorio». Vuelta atrás: revertir el commit; las cinco columnas pueden quedarse.
- [ ] ¿Acepta pg-mem `ADD COLUMN … NOT NULL DEFAULT false` sobre una tabla que ya tiene once filas? Hipótesis: sí (precedente `packages/zoho-sync/src/db/schema.sql:313`). Si no, PS-8 nace roja por otra causa y se consulta antes de relajar la columna.
- [ ] ¿Pasan `npm run typecheck` y `npm run lint` con `ETIQUETA_CASILLA` y `ERR_SIN_ACCESORIOS_CON_INCLUYE` declaradas al final y usadas antes? Hipótesis: sí; si lint lo rechaza, los literales van en línea.
- [ ] ¿Usa `toEqual` exacto alguna prueba de ruta sobre la forma de la remisión o del catálogo? Hipótesis: no, salvo `apps/desk/src/lib/recepcionForm.test.ts:115`.
- [x] Las frases de S3 sin punto final: confirmado por el orquestador el 2026-10-12; el delta de `remisiones` se corrigió para decir lo mismo.
- [ ] «Llegó sin embalaje» junto con la novedad «Embalaje inadecuado o dañado» no se rechaza: fuera de alcance; si debe ser incompatible, es decisión de Gerencia.
