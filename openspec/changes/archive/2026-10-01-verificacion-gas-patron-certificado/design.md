# Diseño: guarda de Verificación por gas patrón y certificado de fábrica en «Liberación» (F1A-03)

F1A-03, `cierra: si`. Entradas: `proposal.md` (manda), `exploration.md` y el delta `specs/transitions-equipo-nuevo/spec.md`.
Líneas medidas en `f5255d2` el 2026-10-01; lo no ejecutado es **«hipótesis»**; no se ha corrido la suite. Supera las 800
palabras de la fase por los once apartados con ruta y línea del encargo (como `archive/2026-10-01-prioridad-top5-cliente`).

## Enfoque técnico

La regla vive en `shared`, en un fichero NUEVO (`packages/shared/src/gasPatron.ts`): lista cerrada de compuestos con
comparación canónica, vigencia, veredicto de la liberación, exigencia del certificado y saneado de `values`. El servidor
la consume en `executeTransition` con **una** lectura de base (equipo + gases) sólo para `liberacion`, editando en sitio
`ticketService.ts:131`, `:132`, `:134` y `:155`, con las funciones al final del fichero (molde `exigirMismoFlujo`,
`:225-234`). Esquema aditivo al final de `schema.sql`. Herencia del compuesto dentro de `createEquipo`, que es la única
puerta de alta de la app. PDF en tabla propia y ruta propia. Ninguna inserción en fichero muy citado salvo al final.

## Decisiones

| # | Decisión | Rechazado | Por qué |
|---|---|---|---|
| D-1 | Fichero nuevo `gasPatron.ts`, exportado al final de `packages/shared/src/index.ts` (línea 27 nueva) | Meterlo en `transitions.ts` o `hojaDeVida.ts` | `transitions.ts` no importa valores (D-2 de F1B-07) y tiene 504 líneas con cita |
| D-2 | Comparación por **clave canónica** (`NFKC` + mayúsculas + sin espacios) en los dos lados, en JS | `JOIN … ON g.compuesto = e.compuesto` en SQL | El `JOIN` por texto falla en silencio hacia abierto con «SO2» frente a «SO₂» (molde H5). `NFKC` pliega `₂`→`2` y `ₓ`→`x` |
| D-3 | La guarda bloquea si `t.id === 'liberacion'`, el origen **no** es `Verificación`, el equipo tiene compuesto y hay patrón vigente | Condición «origen = `En Proceso`» | Equivalentes sobre los orígenes válidos (`transitions.ts:359`); con «≠ Verificación» la prueba de posición contra el `409` de estado (`:126-128`) es observable por el mensaje (§3) |
| D-4 | Clave del campo `certificado_fabrica` (la de la propuesta y el delta), etiqueta «Número del certificado de fábrica», `required: false`, `target: 'customField'` | `cfText('…')` (clave = etiqueta) | El delta fija la clave; la obligatoriedad es contextual (RQ-EN-10) |
| D-5 | Clave del motivo `motivo_sin_verificacion`, la escribe sólo el servidor (la del cuerpo se descarta) | Que la teclee el usuario | s3: hecho derivado. Un valor forjado no puede sobrevivir |
| D-6 | Etiquetas legibles de las dos claves en `ticketFuentes.ts:83`, en sitio | Dejar «Certificado fabrica» | `etiquetaCampo` (`:82-85`) sólo cambia `_` por espacio; la interfaz va en español con tildes |
| D-7 | El alta **nunca** toma el compuesto del cuerpo: `createEquipo` lo hereda del modelo salvo que el llamador del servidor lo pase explícito | Aceptar `b.compuesto` en `POST /api/equipos` | Un compuesto tecleado al alta es la vía corta para esquivar la guarda; s9 |
| D-8 | Corregir el compuesto por `PATCH /api/equipos/:id` sólo **administrador** (403, escalón B) | Cualquier sesión; un cargo Director Técnico | Vaciarlo desactiva la guarda. Un cargo sería una cuarta excepción no dada (`decision/c10-permisos-cargo`). Supuesto reversible d-1 |
| D-9 | PDF en tabla nueva `public.certificados_fabrica`, ruta nueva, vinculado a la fila de `liberacion` | Reutilizar `resolution_attachments` (`schema.sql:232-242`) | Otro concepto y otra lista blanca (`tickets.ts:19`, `:56`); mezclarlos es H5 |
| D-10 | Sin `CHECK` de lista en ninguna columna `compuesto` | `CHECK (compuesto IN …)` | pg-mem (`schema.sql:358`) y segunda copia de la lista |
| D-11 | `vence` se normaliza con `fechaSolo` (`packages/zoho-sync/src/books/repo.ts:94-101`) antes del predicado | `diaEnZona(Date)` | pg entrega `date` como medianoche **local**; con `diaEnZona` el día rodaría (lo explica `:89-92`) |

## 1 · Dominio en `packages/shared/src/gasPatron.ts` (nuevo)

```ts
export const COMPUESTOS = ['SO₂', 'NOₓ', 'CO', 'O₃', 'H₂S', 'TRS', 'NH₃'] as const        // s4
export type Compuesto = (typeof COMPUESTOS)[number]
export function compuestoCanonico(v: unknown): Compuesto | null                          // clave D-2; null si vacío o fuera de lista
export function compuestoDelCuerpo(v: unknown): { ok: true; valor: Compuesto | null } | { ok: false; error: string } // ''/null → null
export interface GasPatronLeido { compuesto: string | null; disponible: boolean | null; vence: DiaCivil | null }
export function patronVigente(g: GasPatronLeido, hoy: DiaCivil): boolean                // disponible === true && vence !== null && vence >= hoy
export const CLAVE_CERTIFICADO_FABRICA = 'certificado_fabrica'
export const CLAVE_MOTIVO_SIN_VERIFICACION = 'motivo_sin_verificacion'
export const ETIQUETA_CLAVE_PROPIA: Record<string, string>                               // las dos claves → «Número del certificado de fábrica», «Liberado sin Verificación»
export type VeredictoLiberacion = { bloquea: true; mensaje: string } | { bloquea: false; motivo: string | null; exigeCertificado: boolean }
export function veredictoLiberacion(c: { origen: string; compuestoEquipo: string | null; gases: readonly GasPatronLeido[]; hoy: DiaCivil }): VeredictoLiberacion
export function erroresCertificado(v: VeredictoLiberacion | null, values: Record<string, unknown>): string[]
export function recortarCertificado(recibidos: unknown): unknown                         // recorta values.certificado_fabrica si es texto
export function valoresConMotivo(values: Record<string, unknown>, v: VeredictoLiberacion | null): Record<string, unknown>
```

`veredictoLiberacion`: `familia = compuestoEquipo?.trim()` no vacío (s1, aunque no resuelva a la lista: RQ-EN-09, «no
reconocido»); `exigeCertificado = origen === 'Verificación' || familia` (s2, los tres casos); `bloquea` si
`origen !== 'Verificación' && familia && gases.some(g => compuestoCanonico(g.compuesto) === compuestoCanonico(compuestoEquipo) && patronVigente(g, hoy))`
(un compuesto no reconocido da `null` y no casa con nada). Motivo, sólo si `origen !== 'Verificación' && familia && !bloquea`:
`Sin gas patrón vigente de ${compuestoCanonico(x) ?? x.trim()}`. `valoresConMotivo` **borra** la clave del cuerpo y la
pone sólo si hay motivo. «Hoy» lo da el servidor con `hoyEnZona()` (`packages/shared/src/contratos.ts:61-63`, día en
`ZONA_NEGOCIO`, `fechasDerivadas.ts:13`): el mismo que ya usan contrato vencido y F1B-12; el predicado lo recibe como
parámetro y no lee el reloj.

## 2 · Esquema — al final de `packages/zoho-sync/src/db/schema.sql` (hoy 622 líneas, última sentencia `:622`)

```sql
-- verificacion-gas-patron-certificado (F1A-03): compuesto que mide el equipo y el que trae por defecto su
-- modelo del catalogo. Lista cerrada en packages/shared/src/gasPatron.ts, sin CHECK de lista (pg-mem).
-- Sin relleno en el esquema: lo hace el script de siembra de docs/sdd. equipos SIN CALIFICAR porque es de
-- DESK_TABLES (migrate.ts:63-64), catalogo_modelos CALIFICADA. AL FINAL para no desplazar citas
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS compuesto text;
ALTER TABLE public.catalogo_modelos ADD COLUMN IF NOT EXISTS compuesto text;
-- Gases patron: una fila por cilindro, alta directa del Director Tecnico (sin pantalla). Vigente =
-- disponible y vence no anterior a hoy en Bogota, lo decide shared y no la base. CALIFICADA (public)
CREATE TABLE IF NOT EXISTS public.gases_patron (
  id bigserial PRIMARY KEY,
  cilindro text NOT NULL,
  compuesto text NOT NULL,
  disponible boolean NOT NULL DEFAULT true,
  vence date NOT NULL,
  registrado_por text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gases_patron_cilindro ON public.gases_patron (cilindro);
-- PDF del certificado de fabrica de una liberacion (opcional). Base64 como resolution_attachments.
-- transicion_id es ticket_transitions.id de la liberacion, sin FK como public.ov_asociaciones
CREATE TABLE IF NOT EXISTS public.certificados_fabrica (
  id text PRIMARY KEY,
  ticket_id text NOT NULL,
  transicion_id bigint NOT NULL,
  filename text,
  content_b64 text NOT NULL,
  size integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);
CREATE INDEX IF NOT EXISTS idx_certificados_fabrica_ticket ON public.certificados_fabrica (ticket_id);
```

Trampas del troceo (`migrate.ts:20`, por `;` a ciegas): ningún `;` en comentarios; los comentarios viajan **dentro** de
la sentencia siguiente, así que **no** pueden contener `modalidad` ni `ov_elegida_en_app_at` (`migrate.test.ts:438`,
`:458` cuentan sentencias por palabra), y el del PDF no puede decir «compuesto» (prueba nueva de recuento, §10 m-7d).

`migrate.ts:73`, en sitio: `'gases_patron', 'certificados_fabrica'` al final de `PUBLIC_TABLES`. Recuentos que fija hoy
`migrate.test.ts` y cómo cambian, todo **en sitio**:

| Prueba | Hoy | Tras el cambio |
|---|---|---|
| `:282-286` listas / clasificadas / `CREATE TABLE` | `[10, 24, 3]` · 37 · 37 · 37 | `[10, 26, 3]` · 39 · 39 · 39 (título de `:282` en sitio) |
| `:374-378` `ALTER` total / calificadas / sin calificar | 41 · 20 · 21 | 43 · 21 · 22 (título de `:374` en sitio) |
| `:382-385` conjuntos | `tickets, equipos, contacts` · 6 identidades | sin cambio: `equipos` y `public.catalogo_modelos` ya están |
| `:519-524` `cargo_permiso` en posición 116 | 116 | sin cambio: nada se inserta delante |
| `:537-546` «`prioridad_ajustes` es la última» (`:545`) | último `CREATE` | **rojo** si no se toca: `:545` pasa en sitio a `creates[36]` y el título de `:537` a «es la 37.ª (nada insertado delante)» |

`:332-339` y `:345-352` no cambian de texto: comprueban las dos `ALTER` nuevas (la de `equipos` sin calificar es
correcta porque `equipos` está en `DESK_TABLES`, `migrate.ts:63-64`; la de `catalogo_modelos`, calificada, porque está
en `PUBLIC_TABLES`, `:72`). Pruebas nuevas **al final** de `migrate.test.ts`: las tres sentencias que mencionan
`compuesto` son exactamente las dos `ALTER` y el `CREATE` de `gases_patron` (sin relleno); orden tras
`prioridad_ajustes`; el índice único rechaza un cilindro repetido y `ON CONFLICT (cilindro) DO NOTHING` deja una fila;
`certificados_fabrica` existe y su índice no queda partido.

## 3 · Servidor — `apps/desk/server/services/ticketService.ts` (234 líneas)

Fichero nuevo `apps/desk/server/db/gasesPatron.ts`: `leerContextoGas(db, equipoId)` hace **una** consulta (sin
calificar, como `db/contratos.ts`; la resuelve el `search_path`):

```sql
SELECT e.compuesto AS compuesto_equipo, g.compuesto, g.disponible, g.vence
  FROM equipos e LEFT JOIN gases_patron g ON g.compuesto IS NOT NULL WHERE e.id = $1
```

Devuelve `{ compuestoEquipo, gases }` con `vence` pasado por `fechaSolo` (D-11). Sin equipo en el ticket o equipo
borrado: cero filas → `compuestoEquipo: null` (s6). Que pg-mem acepte un `ON` que no cita `e` es **hipótesis**; plan B:
dos consultas de coste fijo (equipo; `SELECT … FROM gases_patron`). En ningún caso N+1.

Ediciones **en sitio** (ninguna línea nueva antes de `:234`):
- `:5` gana al final `; import { leerContextoGas } from '../db/gasesPatron'`; `:6` gana `hoyEnZona, veredictoLiberacion,
  erroresCertificado, recortarCertificado, valoresConMotivo, type VeredictoLiberacion` en su lista.
- `:131`, antes del comentario final: `const gas = await veredictoDeLiberacion(db, t, current.row); exigirVerificacion(gas)`.
- `:132`: `valoresConFechasDerivadas(db, current, t, recortarCertificado(b.values))` — el número llega recortado al plan,
  al `422` y a la traza (RQ-EN-10).
- `:134`: `erroresCertificado(gas, values)` entra en la condición y **al final** del array `errors`.
- `:155`: el último argumento de `applyTransition` pasa a `valoresConMotivo(values, gas)`.
- Al final del fichero, con comentario de por qué: `async function veredictoDeLiberacion(db, t, row)` (devuelve `null` si
  `t.id !== 'liberacion'` → **cero consultas** en las otras 43 transiciones) y `function exigirVerificacion(v)`
  (`409 { error: v.mensaje }` si `v?.bloquea`).

El motivo llega a `ticket_transitions.values` por `repo.ts:317` (`JSON.stringify(values)`) y el historial lo pinta sin
tocar nada más: `camposDiligenciados` (`apps/desk/server/db/ticketFuentes.ts:95-106`) enseña toda clave no vacía salvo
`comment`; con D-6 sale «Liberado sin Verificación: Sin gas patrón vigente de SO₂».

**Escalera de `executeTransition` para `liberacion`** (`transitions-st` §3.8, `openspec/specs/transitions-st/spec.md:1106-1111`):

| # | Antes | Escalón | Después |
|---|---|---|---|
| 1 | `:123` 400 transición desconocida | A | igual |
| 2 | `:125` 404 ticket · 409 flujo (`exigirMismoFlujo`) | A · B | igual |
| 3 | `:126-128` 409 estado de origen | B | igual |
| 4 | `:129-130` 403 área · `:131` 403 cargo · 403 prioridad | B | igual |
| 5 | — | B | **`:131` 409 «debe pasar por Verificación»** (sólo `liberacion`) |
| 6 | `:132-134` 422 fechas, obligatorios del plan (`transitionExec.ts:76-77`), cuarentena | C | igual + **422 del certificado, último del array** |
| 7 | `:138-142` 422 persona derivada · `:147` 422 contrato vencido | C | igual (inertes en `liberacion`) |
| 8 | `:148-152` 409 OV ya usada | D | igual (inerte en `liberacion`) |

Relación con `transitionExec.ts:76-77`: el campo es `required: false`, así que `plan.errors` nunca lo nombra; la
exigencia es la del paso 6 y viaja en el MISMO `errors[]`, con todos los demás de C. En `liberacion` hoy ningún campo es
obligatorio, de modo que el único `422` que puede coincidir con el `409` del paso 5 es el del certificado. Los `403` de
cargo y prioridad son inobservables en `liberacion` (no es excepción de cargo ni lleva prioridad): se deja escrito.

Pruebas de posición (fichero nuevo `apps/desk/server/services/guardaGasPatron.test.ts`, regla de mutación 1):
- **área gana**: sólo `Comercial`, equipo `SO₂` con patrón vigente, `En Proceso` → 403 de área.
- **estado gana**: ticket `Equipo nuevo` en `Ingresado` con el mismo equipo → 409 con «no aplica desde el estado» (D-3).
- **guarda gana al 422**: `En Proceso`, patrón vigente, sin número → 409 de Verificación, no 422.
- **certificado tras B**: `Comercial` en `Verificación` sin número → 403, no 422.

## 4 · Catálogo de transiciones

`transitions.ts` no importa valores (D-1), así que la clave se escribe como literal en `:360`, en sitio:
`fields: [comment(), { key: 'certificado_fabrica', label: 'Número del certificado de fábrica', kind: 'text', required: false, target: 'customField' }, derivacion()] },`
y una prueba de `gasPatron.test.ts` iguala esa clave a `CLAVE_CERTIFICADO_FABRICA` (dos copias vigiladas, no H5). `:359`
no cambia: ni origen ni destino, así que `invariantesGrafo.test.ts:62-66` y `:177-181` quedan intactas, y también
`:200-211` (pares).

| Guardián | Efecto | Ajuste |
|---|---|---|
| `invariantesGrafo.test.ts:213-218` «exactamente comentario y derivación» | rojo | en sitio: `:213` título y `:216` esperado `t.id === 'liberacion' ? ['comment', 'certificado_fabrica', 'derivado_a'] : ['comment', 'derivado_a']`. Prueba nueva al final: el campo es `text`, `required: false` |
| `permisos.test.ts:219-270` matriz 6×3 y admin | ninguno: siembra en `t.from[0]` = `En Proceso`, sin equipo (s6) | no se toca |
| `transicionesEjecucion.test.ts:328-…` recorre **todos** los `from` | `liberacion` desde `Verificación` → 422 | `apps/desk/server/testing/appHarness.ts:74`, en sitio: `if (!f.required && f.key !== 'certificado_fabrica') continue` |
| `flujoEquipoNuevo.test.ts:115-134` P7 | 422 por lo mismo | lo arregla el mismo `:74` |
| `flujoEquipoNuevo.test.ts:94-111` P6 | ninguno: 403 (B) gana | no se toca |
| Matriz de obligatorios (`prioridad.test.ts:121`, `transitionExec.test.ts:27`) | ninguno: sólo `TRANSITIONS` | no se toca |

`liberacion_sin_factura` (`transitions.ts:246-247`) no se toca (s11, RQ-EN-12).

## 5 · Herencia y corrección del compuesto

Vías de alta medidas (`grep -rn "createEquipo(\|INSERT INTO equipos" apps packages`): `POST /api/equipos`
(`routes/equipos.ts:63-69`) y el alta de Equipo nuevo (`services/equipoNuevo.ts:88`); las dos pasan por `createEquipo`.
`upsertEquipo` (`db/equipos.ts:29-37`) no tiene uso en producción (`:26-27`) y los `INSERT` directos son de pruebas. Por
eso la herencia vive en `createEquipo`, todo **en sitio** en `apps/desk/server/db/equipos.ts` (409 líneas):
- `:104` gana `; compuesto?: string | null` (en `EquipoInput`).
- `:120` gana `; const compuesto = input.compuesto !== undefined ? input.compuesto : await compuestoDelModelo(db, input.modeloId)`;
  `:122`, `:125` y `:128` ganan la columna, `$15` y el valor. `compuestoDelModelo` (al final, tras `:409`): `null` sin
  `modeloId`; si no, `SELECT compuesto FROM catalogo_modelos WHERE id=$1`, devuelto por `compuestoCanonico`.
- `:149` gana `; if (patch.compuesto !== undefined) add('compuesto', patch.compuesto)`.
- `:115` (`toFull`) y `:165` (`SELECT_EQUIPO_FULL`) ganan `compuesto`; `packages/shared/src/types.ts:375` gana `; compuesto?: string`.

`equipoNuevo.ts:49-58` y `routes/equipos.ts:63-69` **no** cambian: no pasan `compuesto` y heredan (D-7).

`PATCH /api/equipos/:id` (`routes/equipos.ts:73-122`), en sitio: `:97` antepone
`const rc = b.compuesto === undefined ? null : compuestoDelCuerpo(b.compuesto);`; tras el 403 comercial (`:107-110`),
en la línea de `:110`, el 403 «Sólo un administrador puede cambiar el compuesto del equipo» si `rc && !req.user!.isAdmin`
(B); en `:111`, tras el 422 de `camposResult`, el 422 de `rc.ok === false` (C); en `:112`, `if (rc?.ok) patch.compuesto = rc.valor`.
El cambio no entra en `equipos_cambios` (el registro es de los seis campos comerciales, `CampoComercial`,
`types.ts:551`): punto abierto para F1B-02. El compuesto del modelo no tiene ruta: sólo siembra (F1B-02/F1D-01).

## 6 · PDF opcional

Ruta nueva `apps/desk/server/routes/certificadoFabrica.ts`, registrada en sitio en `app.ts:22` (import) y `app.ts:61`
(después de `:52`, así le alcanza también el `requireAuth` de `tickets.ts:35`; se pone además explícito). Datos en
`apps/desk/server/db/certificadosFabrica.ts` (nuevo).

| Ruta | Escalera |
|---|---|
| `POST /api/tickets/:id/certificado-fabrica` (`crearSubida().single('file')`, `util/subida.ts:10-11`) | A 404 ticket · A 400 «Falta el archivo» · B 403 si `!canExecuteTransition(areas, isAdmin, 'Servicio Técnico')` · B 409 si el ticket no tiene fila `liberacion` en `ticket_transitions` · C 415 si `mimetype !== 'application/pdf'` **o** el contenido no empieza por `%PDF-` · 201 con `{ id, filename, size, transicionId }` (la última `liberacion`) |
| `GET /api/tickets/:id/certificado-fabrica` | lista de metadatos, sin contenido |
| `GET /api/tickets/:id/certificado-fabrica/:pdfId` | 404 · `Content-Type: application/pdf` FIJO (no el guardado) · `X-Content-Type-Options: nosniff` · `Content-Disposition: attachment` |
| `DELETE …/:pdfId` | sólo superadministrador, como `tickets.ts:67-69` |

Tamaño: `LIMITE_SUBIDA_BYTES` (`subida.ts:6`, 10 MB); el exceso lo rechaza multer antes del manejador y el manejador
central lo nombra con `LIMITE_SUBIDA_MB` (`app.ts:25`; código exacto **hipótesis** hasta leerlo en el lote 3). El PDF
no exime del número ni lo condiciona (RQ-EN-11). Va en el **último lote**.

## 7 · Cliente (regla 13, casilla de la mutación 3, por adelantado)

Fuera de la red de pruebas (F0-00); no se propone `jsdom`. El campo sale solo del catálogo (`TransitionPanel.tsx:209`
lee `required`: sin asterisco). Componente nuevo `CertificadoFabricaPdf.tsx` en el formulario de `liberacion`; tras el
200 de `executeTransition` (`TransitionPanel.tsx:111`, en sitio) sube el PDF si lo hay. `client.ts`: funciones al final.
Líneas exactas del `.tsx`: **hipótesis** hasta el lote 3.

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| No marca el certificado como obligatorio ni lo exige | 422 de `erroresCertificado` en `ticketService.ts:134` |
| Enseña el `409` de Verificación tal cual | `exigirVerificacion` (`ticketService.ts:131`) |
| No envía motivo; si lo enviara, se descarta | `valoresConMotivo` en `:155` |
| `accept="application/pdf"` | 415 de `routes/certificadoFabrica.ts` (línea real al cierre) |
| Sube el PDF sólo en `liberacion` y tras el 200 | 409 «sin liberación registrada» de la misma ruta |

## 8 · Script de siembra `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql`

Molde `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:1-40` (cabecera, comprobación, una transacción, comprobación dentro,
`COMMIT`). Todo calificado: `desk.equipos`, `desk.tickets`, `public.catalogo_modelos`, `public.gases_patron` (en psql el
`search_path` no es el de la app). Sin secretos.
1. **Comprobaciones previas** (`SELECT`): `to_regclass('public.gases_patron')`; las dos columnas en
   `information_schema.columns`; los modelos `APSA-370`, `APNA-370`, `APMA-370`, `APOA-370` con su marca (si no salen
   cuatro, no seguir).
2. **Recuentos para la nota (P.3)**, ejecutables ANTES de desplegar porque no leen columnas nuevas: tickets en
   `Verificación`; tickets `Equipo nuevo` en `En Proceso` cuyo equipo es de uno de esos cuatro modelos.
3. `BEGIN`. **Bloque A** — compuesto por modelo: `UPDATE public.catalogo_modelos … FROM (VALUES ('APSA-370','SO₂'),
   ('APNA-370','NOₓ'), ('APMA-370','CO'), ('APOA-370','O₃')) … WHERE compuesto IS NULL` (`config.yaml:2892`).
   Convertidores: `-- [P.1]`, comentado, sin valores.
4. **Bloque B** — herencia: `UPDATE desk.equipos e SET compuesto = m.compuesto, updated_at = now() FROM
   public.catalogo_modelos m WHERE e.modelo_id = m.id AND m.compuesto IS NOT NULL AND e.compuesto IS NULL`.
5. **Bloque C** — excepciones del lote AP-370 de 2024 (`:2898`, 24 tickets): un `SELECT` que lista serial y compuesto
   heredado de los equipos de esos tickets, y un `UPDATE … FROM (VALUES …)` **comentado** con `-- [P.1]` (serial →
   H₂S/TRS/NH₃). Va tras B porque corrige lo heredado; sin `IS NULL`, a propósito.
6. **Bloque D** — gases actuales: `INSERT INTO public.gases_patron (cilindro, compuesto, disponible, vence,
   registrado_por) VALUES … ON CONFLICT (cilindro) DO NOTHING`, **comentado** con `-- [P.1]`.
7. Comprobación dentro de la transacción (recuentos por compuesto) y `COMMIT` / `ROLLBACK`.

Idempotente: A y B por `IS NULL`, D por `ON CONFLICT`, C fija valores. Ningún valor que el repositorio no tenga.

## 9 · Ficheros muy citados (barrido de la regla 4 en el cierre)

| Fichero | Líneas | Líneas con cita | Edición |
|---|---|---|---|
| `apps/desk/server/services/ticketService.ts` | 234 | 659 | en sitio `:5`, `:6`, `:131`, `:132`, `:134`, `:155`; funciones al final |
| `packages/shared/src/transitions.ts` | 397 | 504 (patrón `transitions\.ts:`) | en sitio `:360` |
| `packages/zoho-sync/src/db/schema.sql` | 622 | 313 | al final |
| `packages/zoho-sync/src/db/migrate.ts` | 131 | 117 | en sitio `:73` |
| `packages/zoho-sync/src/db/migrate.test.ts` | 568 | 87 | en sitio `:282-286`, `:374-378`, `:537`, `:545`; pruebas al final |
| `apps/desk/server/db/equipos.ts` | 409 | 74 (`db/equipos\.ts:`) | en sitio `:104`, `:115`, `:120`, `:122`, `:125`, `:128`, `:149`, `:165`; ayudante al final |
| `apps/desk/server/routes/equipos.ts` | 211 | 110 | en sitio `:4`, `:97`, `:110-112` |
| `packages/shared/src/invariantesGrafo.test.ts` | 287 | 89 | en sitio `:213`, `:216`; prueba al final |
| `apps/desk/server/db/ticketFuentes.ts` | 178 | 26 | en sitio `:83` y su import |
| `apps/desk/server/testing/appHarness.ts` | 95 | 14 | en sitio `:74` y su import |
| `packages/shared/src/types.ts` · `index.ts` · `app.ts` · `TransitionPanel.tsx` | — | — (`TransitionPanel.tsx:` 113) | en sitio `:375` · final · `:22`, `:61` · `:111` |

Recuentos de líneas (`grep -c`), no de ocurrencias. Sin desplazamiento, **pero cambia lo que dicen**: `ticketService.ts:131`, `:134` y la escalera de `transitions-st/spec.md:1109-1110`;
`invariantesGrafo.test.ts:213-216` (lo cita el propio delta); `migrate.test.ts:545`; `appHarness.ts:74`. Más el pase de
abreviadas en los ficheros que citan esos módulos.

## 10 · Mutaciones planificadas

| # | Se rompe a propósito | Debe ponerse rojo |
|---|---|---|
| m-1a | `exigirVerificacion` delante de `:129` | «área gana» |
| m-1b | `exigirVerificacion` detrás del `throw` de `:134` | «guarda gana al 422» |
| m-1c | la guarda delante de `:126` | «estado gana» (por mensaje) |
| m-2 | tabla vacía tratada como bloqueo | «tabla vacía pasa con motivo» |
| m-3a | `patronVigente` sin `disponible` | «no disponible no cuenta» |
| m-3b | `vence > hoy` en vez de `>=` | «vence hoy es vigente» (pura) |
| m-3c | `hoy` en UTC (`toISOString().slice(0, 10)`) | servidor con reloj fijo `2026-10-02T03:00Z` y `vence 2026-10-01` → debe dar 409 |
| m-4 | comparar `compuesto` en crudo | equipo `SO2` frente a gas `SO₂` → 409; y `so 2` |
| m-5a | sin recorte del número | «sólo espacios es 422» |
| m-5b/c/d | quitar la rama `Verificación` · quitar la rama compuesto · exigirlo siempre | «Verificación sin equipo, 422» · «En Proceso con compuesto sin patrón, 422» · «En Proceso sin compuesto, 200» |
| m-5e | `required: true` en `:360` | «sin compuesto, 200» e `invariantesGrafo.test.ts:216` |
| m-6 | `valoresConMotivo` conserva la clave del cuerpo | «el motivo lo impone el servidor» |
| m-7a | `CREATE TABLE IF NOT EXISTS gases_patron` sin calificar en `schema.sql` | `migrate.test.ts:266-275` y `:286` |
| m-7b | `ALTER TABLE public.equipos …` | `:332-339` |
| m-7c | `ALTER TABLE catalogo_modelos …` sin calificar | `:345-352` |
| m-7d | un `UPDATE equipos SET compuesto …` de relleno en `schema.sql` | recuento nuevo de sentencias con `compuesto` |
| m-7e | un `;` en el comentario del bloque nuevo | prueba nueva «ninguna sentencia partida» |
| m-7f | quitar el índice único de `cilindro` | «cilindro repetido rechazado» |
| m-8 | `createEquipo` sin herencia | alta por `POST /api/equipos` y por Equipo nuevo hereda `SO₂` |
| m-9a/b | 403 del `PATCH` quitado · lista blanca quitada | «no admin, 403» · «`XYZ`, 422» |
| m-10a/b | aceptar `image/png` · no mirar `%PDF-` | «PNG, 415» · «`application/pdf` con bytes PNG, 415» |
| m-11 | consultar el contexto en toda transición | recuento de consultas en una transición que no es `liberacion` |

## Estrategia de pruebas

Pura (lista, canónica, vigencia, veredicto, certificado, motivo, recorte, igualdad de la clave con `:360`):
`packages/shared/src/gasPatron.test.ts` (nuevo). Esquema: `migrate.test.ts`. Servidor (guarda, motivo, certificado,
posiciones, consultas, herencia, `PATCH`, PDF): `services/guardaGasPatron.test.ts`, `routes/certificadoFabrica.test.ts`
(nuevos) y final de `db/equipos.test.ts`. Interfaz excluida (F0-00). `strict_tdd`: cada prueba nace roja; sin `any`.

## Threat Matrix

Sin enrutado de procesos, shell, subprocesos ni VCS: el resto de la matriz es N/A. Aplica a la subida del PDF:

| Amenaza | Comportamiento | Prueba roja |
|---|---|---|
| Tipo falso (`mimetype` mentido) | 415 si no empieza por `%PDF-` | m-10b |
| HTML/JS servido como PDF | `Content-Type` fijo, `nosniff`, `attachment` | GET comprueba cabeceras |
| Tamaño | multer corta a 10 MB antes del manejador | «más grande que el límite» |
| Subida por quien no libera | 403 fuera de Servicio Técnico; 409 sin liberación | m-10 y escalera |
| Contenido malicioso dentro del PDF | no se analiza: se sirve sólo como descarga, sin visor en la app | — (N/A declarado) |

## Migración / despliegue

Aditivo; sin relleno en el esquema. **Cambios visibles desde el despliegue:** toda `liberacion` desde `Verificación`
pide el número, también la de tickets que ya estaban ahí (s12); el formulario gana el campo y el PDF. **Tabla vacía =
0 destinatarios:** hasta la siembra ningún equipo tiene compuesto y la guarda no alcanza a nadie; con A+B y sin D, todo
equipo de esos modelos sale de `En Proceso` con motivo y número; sólo con D la guarda bloquea. **Orden:** desplegar →
P.3 (recuentos, ya antes) → siembra A, B, C con P.1 → D con P.1 → P.4. Revertir: los commits; las columnas y tablas
quedan sin lector.

**Lotes** (medida: `git diff --shortstat --no-renames` + `wc -l` de lo nuevo; techo 800):
1 · dato (`gasPatron.ts`, esquema, `migrate.*`, herencia, `PATCH`, tipos) ~510 · 2 · guardas (`:360`, `ticketService.ts`,
`db/gasesPatron.ts`, `appHarness.ts:74`, invariantes, `ticketFuentes.ts:83`) ~530 · 3 · PDF, `.tsx`, siembra, regla 13
por escrito, barrido ~580. Manda `tasks.md`.

## Contradicciones con la propuesta y preguntas abiertas

- **Nombre del script:** la propuesta dice `F1A-03_Siembra_compuestos_y_gases_patron.sql`; el encargo de esta fase,
  `Siembra_Compuestos_y_Gases_Patron_<fecha>.sql`. Se sigue el encargo, el más reciente.
- **Guardianes no listados en la propuesta (punto 8):** `migrate.test.ts:545` se pone rojo y se edita en sitio, y
  `appHarness.ts:74` debe rellenar el certificado o `transicionesEjecucion.test.ts` y `flujoEquipoNuevo.test.ts:115-134`
  pasan a 422.
- **«Desde En Proceso» (alcance 4) se implementa como «origen ≠ Verificación»** (D-3): mismo efecto, posición probable.
- **Quién corrige el compuesto:** la propuesta no lo dice; se elige administrador (D-8, supuesto reversible d-1). Si
  Gerencia quiere al Director Técnico, es una decisión de cargo nueva.
- **Traza del cambio de compuesto** en `equipos_cambios`: fuera (punto abierto para F1B-02). Ninguna bloquea.

## Decisiones de diseño aceptadas tras el verify (Gerencia, 01/10, `decision/archivo-f1a03-y-worktrees-01-10`)

Las tres desviaciones que el apply declaró y el verify (`15e7bce`) juzgó conformes con los specs pasan a ser
decisiones de diseño, y prevalecen sobre lo escrito arriba:

1. **El número del certificado vive sólo en la traza de la transición** (`ticket_transitions.values`, RQ-EN-10); no
   se copia a `tickets.custom_fields` (`apps/desk/server/services/ticketService.ts:133`).
2. **El PDF se sirve con tipo fijo** (`application/pdf`, `attachment`, `nosniff`;
   `apps/desk/server/routes/certificadoFabrica.ts:52-54`): la tabla no guarda el tipo declarado.
3. **Un veredicto que bloquea también exige el certificado** (`packages/shared/src/gasPatron.ts:83`): el 409 sale
   antes que el 422, así que no es observable, y permite que la prueba de posición active las dos guardas.
