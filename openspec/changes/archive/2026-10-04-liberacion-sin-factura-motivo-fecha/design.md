# Diseño — motivo de lista cerrada y fecha prevista en «Liberación sin factura»

`tanda: F1C-05` · `cierra: no`. Entradas leídas enteras: `proposal.md` y `exploration.md` de esta carpeta, y
`decision/anexo-33-checkbox` (`openspec/config.yaml:2373-2388`, respuesta textual en la línea 2378). Todas las
citas de este documento se leyeron contra el worktree el 2026-10-04. Los números de línea de ficheros o líneas
que todavía no existen se escriben en prosa, sin forma de cita.

Nota de tamaño: el contrato de fase pide menos de 800 palabras; el encargo pide doce puntos con detalle línea a
línea. Manda el encargo y el documento es más largo a propósito.

## 1 · Enfoque técnico

La casilla sale del catálogo y entran tres campos declarados en la misma línea. Lo que el catálogo no puede
exigir (lista cerrada, fecha real, texto condicional) lo impone una función pura nueva de `packages/shared`,
cableada en la sentencia del `422` agregado. Motivo y fecha van a columnas propias fuera de `TICKET_COLS`; el
texto, al `jsonb` y a la traza. **Ningún fichero existente cambia su número de líneas**, salvo `schema.sql`,
`index.ts`, `F0-01_Correcciones_para_el_maestro.md` y tres ficheros de prueba, que sólo crecen por el final.

## 2 · Los lectores de `fields`, leídos uno a uno

| Lector | Qué mira | Reacción a los tres campos nuevos |
|---|---|---|
| `packages/shared/src/sla.ts:100` | `f.key === CLAVE_DERIVACION` | Ninguna |
| `packages/shared/src/prioridad.ts:82` | `f.target === 'priority'` | Ninguna, **a condición** de que el `select` nuevo sea `target: 'customField'` y su clave no sea `priority`. Así tampoco lo oculta el filtro de `apps/desk/src/components/TransitionPanel.tsx:160` |
| `packages/shared/src/bodegaje.ts:235` | `kind === 'date'` y etiqueta igual a un operando | Ninguna: la etiqueta nueva no es operando |
| `packages/shared/src/fechasDerivadas.ts:85-87`, `:92-94`, `:121-122` | etiqueta dentro de `FUENTE_DE_FECHA` (`:16-20`) | Ninguna: no se filtra ni se deriva; lo tecleado llega intacto al plan |
| `packages/shared/src/reentrancia.ts:93-100` | todo `kind === 'date'`, por `label` | **Sí cambia**: la transición es interna al ciclo C1, así que la tabla pasa de nueve a **diez** casos y los campos de diez a **once**, nueve obligatorios (`reentrancia.ts:103-105`). La fecha nueva queda delante de «Fecha Remisión de Salida» por orden de declaración (`reentrancia.ts:218-225`) |
| `apps/desk/server/testing/appHarness.ts:74-78` | obligatorios por `kind` | `select` → primera opción; `date` → `2026-01-15`; el texto, opcional, no se envía. Las matrices de permisos y de ejecución siguen dando `200` |
| `apps/desk/server/db/ticketFuentes.ts:83` | la clave como etiqueta del historial | Las tres claves son legibles tal cual |

No leído: `apps/desk/src/lib/valoresTransicion.ts` (sólo su línea 48 por búsqueda). **Hipótesis**: no reacciona,
porque trabaja sobre las etiquetas de las fechas derivadas.

## 3 · `packages/shared/src/transitions.ts`: sólo la línea 247

Texto exacto de la línea nueva (sustituye a `transitions.ts:247`; el fichero sigue en 397 líneas):

```ts
    fields: [comment(), { key: 'Motivo de liberación sin factura', label: 'Motivo', kind: 'select', required: true, target: 'customField', options: ['Fecha de corte de facturación del cliente', 'Servicio incluido en contrato con facturación periódica', 'Autorización excepcional de Dirección Comercial'] }, cfDate('Fecha prevista de facturación'), cfText('Texto de la autorización', false)] },
```

`cfDate` y `cfText` ya existen (`transitions.ts:75-78`): no hay `import` ni helper nuevo. La fecha es obligatoria
por omisión de `cfDate`.

## 4 · La guarda — `packages/shared/src/liberacionSinFactura.ts` (fichero nuevo)

```ts
export const CLAVE_MOTIVO_LIBERACION = 'Motivo de liberación sin factura'
export const CLAVE_FECHA_PREVISTA_FACTURACION = 'Fecha prevista de facturación'
export const CLAVE_TEXTO_AUTORIZACION = 'Texto de la autorización'
export const MOTIVO_QUE_EXIGE_TEXTO = 'Autorización excepcional de Dirección Comercial'

export function erroresLiberacionSinFactura(t: Pick<Transition, 'fields'>, valores: unknown): string[]
export function textoAutorizacionAGuardar(t: Pick<Transition, 'fields'>, valores: unknown): string | null | undefined
export function seVuelveAPedirEnCadaLiberacion(clave: string): boolean
```

- **Se activa por el campo, no por el id**: busca en `t.fields` el de clave `CLAVE_MOTIVO_LIBERACION`; si la
  transición no lo declara devuelve `[]`. Por eso es inerte en el lote 1 y se prueba con una transición sintética.
- **Fuente única de la lista**: las `options` de ese mismo campo. El módulo no repite la lista; sólo nombra el
  motivo que exige texto, y una prueba ata esa constante a las opciones del catálogo.
- **Presencia no es suya**: un valor vacío (`undefined`, `null`, `''`, el mismo criterio de
  `apps/desk/server/transitionExec.ts:44`) no produce error aquí; lo produce `transitionExec.ts:77`.
- **Mensajes exactos**, en este orden:
  1. `El motivo debe ser uno de: <opciones unidas con « · »>` (igualdad exacta de cadena).
  2. `Fecha inválida en el campo: Fecha prevista de facturación` (forma de `fechasDerivadas.ts:130`); exige
     cadena `AAAA-MM-DD` y día real.
  3. `Falta el texto de la autorización: es obligatorio con el motivo «Autorización excepcional de Dirección Comercial»`
     (texto ausente, no cadena, o vacío tras recortar).
- `textoAutorizacionAGuardar`: `undefined` si la transición no declara el campo; el texto recortado si lo hay;
  `null` si no. `seVuelveAPedirEnCadaLiberacion`: pertenencia a las tres claves.
- **Escalón C** (contenido), dentro del `422` agregado, el último de la lista de errores.
- **`esFechaCalendarioReal`**: se antepone `export` en `packages/shared/src/fechasDerivadas.ts:37`. Cero líneas
  nuevas; sale al exterior por `packages/shared/src/index.ts:17`. El módulo nuevo se exporta en una línea 32
  nueva de `index.ts`, al final.

## 5 · Cambios fichero a fichero

| Fichero | Cambio | ¿Cambia el nº de líneas? |
|---|---|---|
| `packages/shared/src/transitions.ts` | línea 247 (§3) | No |
| `packages/shared/src/fechasDerivadas.ts` | `export` en la línea 37 | No |
| `packages/shared/src/index.ts` | línea 32 nueva | +1, al final |
| `packages/zoho-sync/src/db/rows.ts` | (a) línea 50: se añaden `liberacion_motivo?: string \| null; fecha_prevista_facturacion?: string \| null`; (b) línea 131: tras la entrada de `servicio_in_situ`, **en la misma línea**, las dos entradas `{ col: 'liberacion_motivo', label: 'Motivo de liberación sin factura', kind: 'text' }` y `{ col: 'fecha_prevista_facturacion', label: 'Fecha prevista de facturación', kind: 'date' }`; (c) línea 119: «el ÚNICO de esta lista que NO viene de Zoho» deja de ser cierto y pasa a «el PRIMERO…», en su sitio | No. Las citas que alcanzan la línea 131 o posteriores son tres con este documento, las tres al rango 85-132 (el array entero), y siguen ciertas |
| `packages/zoho-sync/src/db/repo.ts` | **Ninguno.** `TICKET_COLS` (`:44-54`) no se toca y `writeTransition` (`:298-311`) ya escribe cualquier columna del plan | No |
| `packages/zoho-sync/src/db/schema.sql` | cuatro líneas al final (hoy acaba en la 707): dos de comentario sin punto y coma (708 y 709) y `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS liberacion_motivo text;` (710), `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_prevista_facturacion date;` (711). Sin calificar | +4, al final |
| `apps/desk/server/services/ticketService.ts` | línea 6: tres símbolos más en el `import` existente. Línea 133: se añade al final `const txtLib = textoAutorizacionAGuardar(t, values); if (txtLib !== undefined) plan.customFields[CLAVE_TEXTO_AUTORIZACION] = txtLib`. Línea 134: `const errLiberacion = erroresLiberacionSinFactura(t, values)` tras `errCertificado`, `|| errLiberacion.length` en la condición y `...errLiberacion` al final del `errors` | No |
| `apps/desk/server/transitionExec.ts` | comentario de la línea 73, en su sitio: el catálogo ya no declara ninguna casilla obligatoria; la última fue la de la línea 247 de `transitions.ts` **en `2a74fdc`** (caso B) | No |
| `apps/desk/src/components/TransitionPanel.tsx` | §7 | No |
| `apps/desk/src/components/TicketProperties.tsx` | línea 76: se añade en la misma línea `['Fecha prevista de facturación', 'Fecha prevista de facturación']`. Línea 184: tras el `CheckField`, en la misma línea, `<Field label="Motivo de liberación sin factura" value={cf(detail, 'Motivo de liberación sin factura')} />`. La casilla histórica de la línea 88 se queda | No (184 citas a los dos `.tsx` en 79 ficheros: ninguna se desplaza) |

`migrate.test.ts`: los guardianes de `packages/zoho-sync/src/db/migrate.test.ts:332-339` y `:345-352` no cambian.
El recuento de `:374-378` pasa de 50 / 27 / 23 a **52 / 27 / 25**, editando título y cifras en su sitio; los
conjuntos de `:382-385` no cambian (`tickets` ya recibía doce `ALTER` sin calificar).

## 6 · Persistencia

| Dato | Destino | Por qué sobrevive a la sincronización |
|---|---|---|
| Motivo | columna `tickets.liberacion_motivo` + traza | fuera de `TICKET_COLS`: `upsertTicket` sólo escribe esa lista (`repo.ts:86-91`) |
| Fecha | columna `tickets.fecha_prevista_facturacion` + traza | igual |
| Texto | `tickets.custom_fields` + traza | sólo por la marca de fila: `writeTransition` pone `managed_by_app=true` (`repo.ts:298`) y `upsertTicket` se abstiene entera (`repo.ts:71`) |
| Los tres | `ticket_transitions.values` (`repo.ts:314-318`) | tabla de la aplicación |

`liberacion_sin_facturar`: deja de escribirse **sola**, porque ningún campo del catálogo lleva ya su etiqueta. La
columna (`schema.sql:39`), su entrada (`rows.ts:130`) y su sitio en `TICKET_COLS` (`repo.ts:53`) no se tocan.

Pruebas de que el sincronizador no pisa: (a) guarda estática, las dos columnas no están en `TICKET_COLS` y sí en
`PROMOTED_COLUMNS` con su etiqueta y tipo (molde `packages/zoho-sync/src/db/repo.test.ts:279-288`); (b) de
comportamiento, fila **no gestionada** con las dos columnas puestas, segunda pasada de `upsertTicket`, el asunto
cambia y las columnas no (molde `repo.test.ts:513-519`); (c) en el lote 2, tras liberar por HTTP, una pasada de
`upsertTicket` con `custom_fields` vacío no borra el texto.

## 7 · La re-liberación en el cliente

`yaLoTraeElTicket` (`TransitionPanel.tsx:32-36`) decide a la vez el prellenado (`:80`) y el bloqueo (`:174`).
Cambio mínimo, todo en su sitio:

- línea 33: `if (f.target !== 'customField' || f.kind === 'checkbox' || seVuelveAPedirEnCadaLiberacion(f.key)) return false`
- línea 8: el símbolo nuevo entra en el `import` existente de `@ambientalia/shared`;
- líneas 28-30: el comentario pasa de tres a cuatro clases excluidas, sin añadir líneas.

A `.ts` probado sale **el predicado entero** (`seVuelveAPedirEnCadaLiberacion`, en el módulo de §4). El `.tsx`
sólo lo consume. Una prueba del lote 2 lo ata al catálogo: las tres claves son exactamente las de los campos
`customField` de `liberacion_sin_factura`.

## 8 · Lotes definitivos

Fórmula: producción + pruebas nuevas × 1,8 + líneas tocadas en su sitio (cuentan dos: borrada e insertada) +
casillas + `apply-progress.md`. Techo 800, válvula 720. Son estimaciones; al cerrar cada intento se mide.

**Lote 1 — sin cambio de comportamiento**

| Fichero | Líneas |
|---|---|
| `schema.sql` (+4) · `index.ts` (+1) · `rows.ts` (3 en sitio = 6) · `fechasDerivadas.ts` (1 = 2) | 13 |
| `liberacionSinFactura.ts`, nuevo | 50 |
| `packages/shared/src/liberacionSinFactura.test.ts`, nuevo: 85 × 1,8 | 153 |
| `repo.test.ts`, al final: 24 × 1,8 | 43 |
| `apps/desk/server/transitionExec.test.ts`, al final: 34 × 1,8 | 61 |
| `migrate.test.ts` (4 en sitio) | 8 |
| casillas (10) + `apply-progress.md` (40) | 50 |
| **Total** | **≈ 378** |

**Lote 2 — el cambio**

| Fichero | Líneas |
|---|---|
| `transitions.ts` (2) · `ticketService.ts` (6) · `transitionExec.ts` (4) · `TransitionPanel.tsx` (10) · `TicketProperties.tsx` (4) · `debt.md` (2) | 28 |
| `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, al final | 30 |
| `apps/desk/server/liberacionSinFactura.test.ts`, nuevo: 150 × 1,8 | 270 |
| `packages/shared/src/liberacionSinFactura.test.ts`, al final: 22 × 1,8 | 40 |
| `transicionesEjecucion.test.ts` (≈ 40 en sitio) | 80 |
| `reentrancia.test.ts` (20) · `invariantesGrafo.test.ts` (8) · `bodegaje.test.ts` (8) · `prioridad.test.ts` (4) | 40 |
| casillas (12) + `apply-progress.md` (45) | 57 |
| **Total** | **≈ 545** |

Cada lote cierra con `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores). El lote 1 es verde
por sí solo porque ninguna transición declara todavía los campos: la guarda devuelve `[]` y las dos entradas
nuevas de `PROMOTED_COLUMNS` no casan con ninguna clave del catálogo.

## 9 · Plan de pruebas (`strict_tdd`)

**Lote 1**

| Prueba | Fichero | Nace |
|---|---|---|
| Guarda sobre transición sintética: motivo fuera de lista; fecha `2026-02-30`; tercer motivo sin texto, con sólo espacios y con texto; primer y segundo motivo sin texto; valores vacíos no dan error; transición sin el campo da `[]` | `packages/shared/src/liberacionSinFactura.test.ts` | ROJA: el módulo no existe |
| `textoAutorizacionAGuardar` y `seVuelveAPedirEnCadaLiberacion` | el mismo | ROJA |
| `esFechaCalendarioReal` importable | el mismo | ROJA: no está exportada (`fechasDerivadas.ts:37`) |
| Las dos columnas fuera de `TICKET_COLS` y dentro de `PROMOTED_COLUMNS` | `repo.test.ts`, al final | ROJA: `rows.ts:85-132` no las tiene |
| El sync no pisa las dos columnas (fila no gestionada) | `repo.test.ts`, al final | ROJA: la columna no existe en `schema.sql` |
| Recuento 52 / 27 / 25 | `migrate.test.ts:374-378` | ROJA hasta editar `schema.sql` |
| **SINTÉTICA de casilla obligatoria** (ausente, `false`, marcada), con una transición fabricada en la prueba | `transitionExec.test.ts`, al final | CARACTERIZACIÓN: verde al nacer; se valida mutando `transitionExec.ts:76` a `empty` |
| Enrutado sintético: las dos etiquetas van a columna (fecha recortada a día) y el texto a `customFields` | `transitionExec.test.ts`, al final | ROJA |

**Lote 2**

| Prueba | Fichero | Nace |
|---|---|---|
| El catálogo declara exactamente las tres opciones, en orden, escritas como literal en la prueba; `MOTIVO_QUE_EXIGE_TEXTO` es una de ellas; las tres claves son las de los campos `customField`; ninguna casilla | `packages/shared/src/liberacionSinFactura.test.ts` | ROJA: `transitions.ts:247` declara la casilla |
| Criterios 3 a 8 de la propuesta por HTTP; segunda liberación sin texto deja el texto en `null`; el sync no borra el texto | `apps/desk/server/liberacionSinFactura.test.ts`, nuevo | ROJAS: hoy el `422` nombra la casilla |
| PL-1, PL-3, PL-4 | el mismo | ROJAS (PL-1 por su control) |
| PL-2 | el mismo | CARACTERIZACIÓN: el `409` de `ticketService.ts:126-128` ya gana hoy |

**Se reescriben a propósito, sin cambiar el número de líneas de su fichero:**

- `apps/desk/server/transicionesEjecucion.test.ts:41-103` (bloque C1): mismas tres vías sobre los campos nuevos
  —motivo ausente, motivo vacío, motivo y fecha válidos con las dos columnas escritas—. El bloque conserva sus
  63 líneas: el fichero tiene 55 citas y 42 apuntan por debajo de la línea 103. La narración de `:8-40` se ancla
  a `2a74fdc` (caso B).
- `packages/shared/src/reentrancia.test.ts:43-52` (dos reentrantes en C1; la línea 51 pasa a afirmar que la
  liberación escribe la fecha y que es obligatoria), `:83-85` (diez casos) y `:87-100` (once campos, nueve
  obligatorios). `packages/shared/src/transitions.ts:258` cita el tramo 118-140 de ese fichero: no se desplaza.
- `packages/shared/src/invariantesGrafo.test.ts:137-150`: once; la entrada nueva comparte línea con «Fecha
  Remisión de Salida», delante.
- `packages/shared/src/bodegaje.test.ts:105-113`: «diez» pasa a once, longitud 11.
- `packages/shared/src/prioridad.test.ts:106`: **el literal no se toca** (es la foto de antes). La excepción se
  declara en el cálculo de `esperado` (`:120`) y en el título de `:118`.

## 10 · Mutaciones que el orquestador reproduce a mano

| # | Regla | Qué se cambia | Qué cae |
|---|---|---|---|
| M1 | 1 | En `ticketService.ts`, al principio de la línea 131 (antes de `const cargoFalta`), insertar `{ const e = erroresLiberacionSinFactura(t, b.values); if (e.length) throw new HttpError(422, { errors: e }) }` | PL-1: Comercial sin cargo oye el `422` en vez del `403` |
| M2 | 1 | Insertar ese mismo bloque antes de la línea 126 | PL-2: sale `422` en vez del `409` de estado |
| M3 | 1 | Quitar `errLiberacion` de la condición y del `errors` de la línea 134 y lanzarlo tras la línea 142: `if (errLiberacion.length) throw new HttpError(422, { errors: errLiberacion })` | PL-3: gana el mensaje de la persona. PL-4: el `422` ya no trae el error de la lista |
| M4 | 1 | En la línea 134, poner `...errLiberacion` delante de `...plan.errors` | PL-4: compara el array exacto, presencia delante |
| M5 | 2 | Añadir a `schema.sql` `ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS liberacion_motivo text;` | `migrate.test.ts:332-339` (`public.tickets` no está clasificada) y el recuento de calificadas |
| M6 | 2 | Meter `'liberacion_motivo'` en `TICKET_COLS` | las dos pruebas nuevas de `repo.test.ts` |
| M7 | 2 | En la línea 247, añadir una cuarta opción; después, quitar una | la prueba del literal de tres opciones |
| M8 | 2 | En la línea 247, cambiar una letra del tercer motivo | la prueba que ata `MOTIVO_QUE_EXIGE_TEXTO` a las opciones |
| M9 | — | En la guarda: quitar cada comprobación; aceptar texto de sólo espacios; exigir texto con cualquier motivo | una prueba del módulo por cada una |
| M10 | — | `transitionExec.ts:76`: dejar `empty` para la casilla | la sintética, vía `false` |

PL-1 a PL-4 llevan motivo y fecha presentes y el motivo `'Otro motivo'` (PL-4, sin fecha). El par con el `409` de
orden de venta (`ticketService.ts:148-152`) no admite prueba: la transición no declara orden de venta.

## 11 · Regla 13, decisión a decisión

| # | Decide el cliente | Lo impone el servidor |
|---|---|---|
| 1 | Motivo obligatorio (asterisco, `TransitionPanel.tsx:209`) | `transitionExec.ts:77`, `422` en `ticketService.ts:134` |
| 2 | Fecha obligatoria | igual |
| 3 | Sólo tres motivos (desplegable, `TransitionPanel.tsx:257-261`) | guarda nueva, `ticketService.ts:134` |
| 4 | La fecha es un día (`TransitionPanel.tsx:254`) | guarda nueva, misma línea |
| 5 | Texto con el tercer motivo | guarda nueva, misma línea. El cliente no decide: el campo se pinta siempre sin asterisco |
| 6 | Quién ve el botón (`TransitionPanel.tsx:56-58`) | `ticketService.ts:129-131` (RQ-PM-17, RQ-PM-18) |
| 7 | No prellenar ni bloquear al re-liberar | sin contrapartida necesaria: el servidor lee sólo el cuerpo (`transitionExec.ts:43`) y exige en cada ejecución |

Las filas 3 a 5 son espejo legítimo sólo con el lote 2 en verde.

## 12 · Corrección para el maestro (lote 2)

Se añade al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` una sección «La de F1C-05, liberación sin
factura (N)» —el orquestador pone el número al fusionar; la última hoy es la 23—. Pasaje: línea 1842 de la
R08.4.md, que dice «El único caso afectado era «Liberación del ticket sin facturar»». Texto a pegar tras ese
párrafo:

> «[CONSTRUIDO] La transición «Liberación sin factura» ya no lleva casilla. Exige Motivo, de una lista cerrada
> de tres —fecha de corte de facturación del cliente, servicio incluido en contrato con facturación periódica,
> autorización excepcional de Dirección Comercial—, y Fecha prevista de facturación; con el tercer motivo exige
> además el texto de la autorización. El servidor rechaza un motivo fuera de la lista y una fecha que no sea un
> día real. Las liberaciones anteriores conservan su casilla. La alarma por fecha vencida sigue pendiente
> (F1C-02).»

## 13 · Lo que añade al paquete de despliegue

- **Esquema `desk`**, líneas 710 y 711 previstas de `schema.sql`: las dos `ALTER` de §5. Anulables, sin relleno.
- **Comprobaciones de persona**: (1) alguien tiene el cargo Director Comercial; (2) liberar un ticket en
  `Por Facturar`: tres campos, ninguna casilla; (3) tercer motivo sin texto: rechazo que nombra lo que falta;
  (4) entregar, volver a `Por Facturar` y liberar otra vez: motivo, fecha y texto vacíos y editables; (5) la
  ficha enseña motivo y fecha; (6) el historial del ticket enseña los tres valores de cada liberación.

## 14 · Decisiones

| # | Decisión | Alternativa descartada | Razón |
|---|---|---|---|
| D1 | Dos lotes, con el reparto de §8 | Un solo intento | ≈ 923 líneas: supera el techo |
| D2 | Clave del motivo `Motivo de liberación sin factura`, etiqueta «Motivo» | Clave `Motivo` | La clave es de TICKET (columna promovida y mapa de la ficha, `packages/zoho-sync/src/db/mappers.ts:222-232`): un «Motivo» a secas no dice de qué y chocaría con el motivo de cualquier otra etapa |
| D3 | Fecha y texto con `cfDate` y `cfText` (clave = etiqueta) | Objetos en línea | Los lectores de fechas comparan por `label`; con clave distinta, tabla de reentrancia y columna no nombrarían lo mismo |
| D4 | La guarda se activa por el campo | Por id de transición | Se prueba con catálogo sintético y el lote 1 queda inerte; molde de `prioridad.ts:82` |
| D5 | La lista sale de las `options` del campo | Constante con los tres motivos en el módulo | La línea 247 no puede importar; serían dos listas |
| D6 | Cableado en el `422` agregado, último del array | `throw` propio | Cero líneas nuevas y un solo `422` con todo lo que falta |
| D7 | El texto se escribe **siempre** en `custom_fields`: el de esta liberación o `null` | Escribirlo sólo si llega | El ciclo es reentrante: sin esto, una segunda liberación por otro motivo dejaría en el ticket la autorización de la primera. **Va un paso más allá de la propuesta**; compatible con su criterio 8 |
| D8 | Fecha estricta `AAAA-MM-DD` | Aceptar ISO con hora | `transitionExec.ts:33` recortaría sin validar; el navegador envía ese formato |
| D9 | Entradas de `PROMOTED_COLUMNS` en la línea 131 | Dos líneas nuevas | No mueve el cierre del array ni el rango 85-132 que lo cita |
| D10 | Pruebas HTTP nuevas en fichero propio; C1 reescrito en su sitio | Añadir PL a `cargoPermiso.test.ts` | No desplaza citas |
| D11 | `OBLIGATORIOS_ANTES` intacto, excepción en `esperado` | Editar la entrada | Es un registro fechado (caso B) |
| D12 | Predicado de re-liberación en `shared` | Lógica en el `.tsx` | Los `.tsx` no tienen pruebas |

## 15 · Flujo de datos

    navegador ──values──▶ executeTransition
                            ├─ B: 409 estado · 403 área · 403 cargo
                            ├─ C: buildTransitionPlan (presencia) + erroresLiberacionSinFactura ──▶ 422
                            ├─ C: persona derivada
                            └─ applyTransition ──▶ tickets.liberacion_motivo, .fecha_prevista_facturacion
                                                   tickets.custom_fields (texto o null)
                                                   ticket_transitions.values (los tres)

## 16 · Matriz de amenazas

N/A: no hay enrutado, comandos, subprocesos, automatización de VCS ni clasificación de ejecutables.

## 17 · Migración y reversión

Sin migración de datos. Las columnas nacen vacías y no se rellenan. Revertir el lote 2 devuelve la casilla; las
columnas quedan inertes.

## 18 · Preguntas abiertas

- Las cuatro de la propuesta (E-nueva-1 a E-nueva-4). Ninguna bloquea.
- D2 y D7 hay que contrastarlas con los deltas de spec escritos en paralelo: si la spec fija la clave `Motivo` o
  «el texto sólo si llega», se alinea antes de `sdd-tasks`.
