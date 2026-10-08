# Diseño: NIT genéricos exentos y aviso de provisional ya en Books (F1B-19)

Concreta D-1 a D-11 de la propuesta; ninguna se reabre y las once son implementables. Dos piezas, dos lotes. Todo fichero
citado se edita DENTRO de línea; `schema.sql` y los ficheros de prueba crecen sólo por el final. Lo que este diseño añade a la
propuesta son dos hallazgos de lectura (§4) y la forma exacta de cada edición.

## §1 · Esquema — al final de `packages/zoho-sync/src/db/schema.sql` (hoy 796 líneas)
Lote 1, once líneas nuevas (de la 797 a la 807 del fichero resultante):
```sql
-- nit-exentos-aviso-provisional (F1B-19, decision e154): NIT genericos que NO bloquean el alta manual aunque esten en Books
-- Es DATO mantenible, sin pantalla: se edita por SQL. nit va como base normalizada, solo digitos y sin digito de verificacion
-- Un exento se RETIRA con activo = false y nunca borrando la fila, porque la siembra de abajo la volveria a insertar
-- Sin CHECK de formato, el servidor normaliza los dos lados al comparar. AL FINAL para no desplazar citas. CALIFICADA public.
CREATE TABLE IF NOT EXISTS public.nit_exentos (
  nit text PRIMARY KEY,
  motivo text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.nit_exentos (nit, motivo) VALUES ('222222222222', 'Consumidor final') ON CONFLICT (nit) DO NOTHING;
```
Lote 2, once líneas más (de la 808 a la 818):
```sql
-- nit-exentos-aviso-provisional (F1B-19, decision e155): marca anti-duplicado del aviso a Comercial de un provisional cuyo NIT ya esta en Books
-- Una fila por pareja (provisional, contacto de Books). La clave primaria es la unicidad EN LA BASE, molde de public.alarmas_avisadas
-- Se escribe SOLO si hubo destinatarios: sin ellos no hay fila y la pasada siguiente reintenta. Sin FK, como public.ov_asociaciones
-- Nunca hay UPDATE ni DELETE. Nace vacia, sin relleno. AL FINAL para no desplazar citas. CALIFICADA public.
CREATE TABLE IF NOT EXISTS public.provisional_books_avisados (
  provisional_id text NOT NULL,
  contacto_id text NOT NULL,
  avisado_at timestamptz NOT NULL DEFAULT now(),
  avisos_creados integer NOT NULL,
  PRIMARY KEY (provisional_id, contacto_id)
);
```
- **Sin `CHECK` de sólo dígitos, y es decisión, no aplazamiento.** El esquema no tiene ningún `CHECK` con expresión regular:
  los cinco que hay comparan valores (`packages/zoho-sync/src/db/schema.sql:570`, `packages/zoho-sync/src/db/schema.sql:618`),
  y una búsqueda de operadores de expresión regular en `packages/` y `apps/` da cero. Que pg-mem lo admita sigue siendo
  **hipótesis**, y no hace falta resolverla: una fila mal escrita es inerte, porque la guarda del vacío de
  `packages/shared/src/altaManual.ts:49` impide que un valor sin dígitos case, y con puntos o guion casa igual (§2).
- **Sin índices.** Las dos claves primarias bastan: la lista tiene unas pocas filas y la marca se consulta por
  `provisional_id`, primera columna de su clave. Los comentarios van sin acentos y sin punto y coma, como los vecinos.

## §2 · Firmas del lote 1
`packages/shared/src/nitExentos.ts` (nuevo), exportado dentro de `packages/shared/src/index.ts:28`
(`export * from './altaManual'; export * from './nitExentos'`, idioma de `packages/shared/src/index.ts:23`):
```ts
/** ¿Es `nit` uno de los exentos? Misma noción de «mismo NIT» que el alta: `nitCoincide`. Lista vacía o NIT sin dígitos: nunca. */
export function esNitExento(nit: unknown, exentos: readonly string[]): boolean { return exentos.some((exento) => nitCoincide(nit, exento)) }
```
`apps/desk/server/db/nitExentos.ts` (nuevo; fichero propio por tabla, molde `apps/desk/server/db/novedades.ts:11`):
```ts
export async function nitExentosActivos(db: Queryable): Promise<string[]>  // SELECT nit FROM public.nit_exentos WHERE activo = true ORDER BY nit
```

## §3 · Ediciones dentro de línea del lote 1
| Línea | Antes → después |
|---|---|
| `apps/desk/server/services/ticketService.ts:6` | `primerConflictoUnicidad, motivoAltaPendiente` → `primerConflictoUnicidad, esNitExento, motivoAltaPendiente` |
| `apps/desk/server/services/ticketService.ts:18` | `…from '../db/clientesProvisionales'; import { entrantesDeAlta` → `…from '../db/clientesProvisionales'; import { nitExentosActivos } from '../db/nitExentos'; import { entrantesDeAlta` |
| `apps/desk/server/services/ticketService.ts:96` | `nitEnBooks: prov ? await clientesBooksPorNit(db, prov.nit) : []` → `nitEnBooks: prov && !esNitExento(prov.nit, await nitExentosActivos(db)) ? await clientesBooksPorNit(db, prov.nit) : []` |
| `packages/zoho-sync/src/db/migrate.ts:73` | `'encuesta_respuestas']` → `'encuesta_respuestas', 'nit_exentos']` |

**Orden de evaluación de la línea 96:** `prov &&` corta antes de leer la lista, así que un alta sin cliente manual no consulta
`nit_exentos`; y con NIT exento la rama es `[]` sin consultar Books. Nada más cambia: `prov!.nit` sigue protegido por el
`conflicto?.tipo === 'nit'`. La exención vive en el escalón D y no puede saltar A, B ni C.

`apps/desk/server/services/altaManual.ts:154-157` conserva sus líneas; cambian el final de la 155 y la 156 entera:
```ts
 * español, como los demás `409`, y TODOS los candidatos `{ id, name }` para que el formulario deje elegir uno.
 * Un NIT de `public.nit_exentos` no llega aquí: el alta no consulta Books para él (decision/e154-nit-genericos-exentos).
```

## §4 · Guardián de tablas — DOS hallazgos que la propuesta no traía
**(a) El recuento**, `packages/zoho-sync/src/db/migrate.test.ts:282-286`: título «son 46 tablas: 10 de Desk, 33 de la app en
public (nit_exentos, F1B-19; encuesta_respuestas, F1F-05; …» y cifras `[10, 33, 3]` y `46` (tres veces) tras el lote 1; «son 47
tablas», «34 de la app en public (provisional_books_avisados y nit_exentos, F1B-19; …», `[10, 34, 3]` y `47` tras el lote 2.

**(b) Siete aserciones anclan por DISTANCIA AL FINAL del esquema y se rompen al añadir sentencias.** El lote 1 añade dos
(`CREATE` y siembra) y el lote 2 una. Se renumeran en sitio, con sus títulos y cabeceras:

| Línea | Hoy | Tras lote 1 | Tras lote 2 |
|---|---|---|---|
| `packages/zoho-sync/src/db/migrate.test.ts:796` | `l.length - 7` | `- 9` | `- 10` |
| `packages/zoho-sync/src/db/migrate.test.ts:798` | `- 6` y `- 5` | `- 8` y `- 7` | `- 9` y `- 8` |
| `packages/zoho-sync/src/db/migrate.test.ts:839` | `- 4` | `- 6` | `- 7` |
| `packages/zoho-sync/src/db/migrate.test.ts:840` | `- 3` | `- 5` | `- 6` |
| `packages/zoho-sync/src/db/migrate.test.ts:879` y `packages/zoho-sync/src/db/migrate.test.ts:882` | `- 2` | `- 4` | `- 5` |
| `packages/zoho-sync/src/db/migrate.test.ts:880` | `- 1` | `- 3` | `- 4` |

Textos que dejan de ser ciertos y se reescriben en la misma línea: los títulos de `packages/zoho-sync/src/db/migrate.test.ts:794`,
`packages/zoho-sync/src/db/migrate.test.ts:837` y `packages/zoho-sync/src/db/migrate.test.ts:877` («SÉPTIMA», «CUARTA»,
«PENÚLTIMA»), el `describe` de `packages/zoho-sync/src/db/migrate.test.ts:864` y la cabecera de
`packages/zoho-sync/src/db/migrate.test.ts:861` («cierran el esquema»). **Las pruebas NUEVAS no repiten el molde:** anclan por
orden RELATIVO (la sentencia va después de la de `idx_encuesta_respuestas_ticket`), para que la siguiente tabla no las toque.

## §5 · Firmas del lote 2
`apps/desk/server/db/provisionalEnBooks.ts` (nuevo), sólo lecturas:
```ts
export interface ProvisionalSinEnlazar { id: string; razonSocial: string; nit: string }
export interface ContactoConNit { id: string; name: string; nit: string | null }
export async function provisionalesSinEnlazar(db: Queryable): Promise<ProvisionalSinEnlazar[]>  // … FROM public.clientes_provisionales WHERE enlazado_a IS NULL ORDER BY id
export async function contactosDeBooks(db: Queryable): Promise<ContactoConNit[]>                // SELECT id, name, nit FROM clients
export async function parejasYaAvisadas(db: Queryable, provisionalIds: string[]): Promise<Set<string>> // claves `${provisionalId}|${contactoId}`, con IN ($1..$n)
```
`apps/desk/server/services/avisoProvisionalEnBooks.ts` (nuevo):
```ts
export interface ParejaProvisionalBooks { provisionalId: string; razonSocial: string; nit: string; contactoId: string; contactoNombre: string }
export function textoAvisoProvisionalEnBooks(p: ParejaProvisionalBooks): string
export async function parejasPorAvisar(db: Queryable): Promise<ParejaProvisionalBooks[]>
export async function marcarYAvisarPareja(db: Queryable, p: ParejaProvisionalBooks, destinatarios: ReadonlyArray<{ id: string }>, texto: string): Promise<boolean>
export async function avisarProvisionalesEnBooks(db: Queryable): Promise<number>
export async function pasadaProvisionalesEnBooks(db: Queryable): Promise<void>
```
Texto: `El cliente provisional «${razonSocial}» (NIT ${nit}) coincide por NIT con el contacto de Books «${contactoNombre}». Conviene enlazarlos.`
El NIT es el del provisional tal como se tecleó; `contactoNombre` es `name ?? id`, como `apps/desk/server/db/clientesProvisionales.ts:73`.

## §6 · Algoritmo de la pasada
`parejasPorAvisar`: (1) `provisionalesSinEnlazar`; si no hay, `[]` con UNA consulta. (2) `nitExentosActivos`; se descartan los
provisionales de NIT exento y, si no queda ninguno, `[]` SIN leer contactos (el consumidor final será el provisional más
frecuente). (3) `contactosDeBooks`. (4) parejas con `nitCoincide(provisional.nit, contacto.nit)`, descartando las de contacto
exento; ordenadas por `provisionalId` y luego `contactoId`. (5) si hay parejas, `parejasYaAvisadas` y se quitan las marcadas.

`avisarProvisionalesEnBooks`: (6) sin parejas, `0`; con ellas, `destinatariosDeArea(db, 'Comercial', '')` UNA vez; si no hay
nadie, UN `logger.warn` con el número de parejas y `0`, sin marcar. (7) por pareja, `marcarYAvisarPareja` dentro de su
`try/catch` (`logger.error` y sigue). `pasadaProvisionalesEnBooks` envuelve todo en `try/catch`, NUNCA lanza y corre en CADA
intervalo: no lleva el cerrojo diario de `apps/desk/server/services/avisoRitmoContrato.ts:61`.

`marcarYAvisarPareja`: con destinatarios vacíos devuelve `false` sin abrir transacción. Si no, `enTransaccion`: PRIMERO el
`INSERT` de la marca sin `ON CONFLICT`, DESPUÉS un `crearAviso(q, { userId, ticketId: null, texto })` por destinatario; `23505`
→ `false`, cualquier otro error sale (molde `apps/desk/server/services/alarmasSla.ts:43-56`).

**La consulta previa de marcas (5) y la captura de `23505` conviven, y cada una tiene oficio.** Sin la previa, cada pareja ya
avisada abriría una transacción fallida en cada intervalo, para siempre; la captura cubre sólo la carrera entre dos pasadas.
Mismo par que `apps/desk/server/services/alarmasSla.ts:90-94`. **Diferencia con ese molde:** allí los destinatarios se leen
dentro de la transacción (`apps/desk/server/services/avisoReclamacionProveedor.ts:28-33`); aquí fuera y una vez, porque son
los mismos para todas las parejas y así el `warn` es uno por pasada.

`apps/desk/server/index.ts:15` gana al final `; import { pasadaProvisionalesEnBooks } from './services/avisoProvisionalEnBooks'`.
`apps/desk/server/index.ts:88`: `.then(() => pasadaReclamaciones(pool)).then(() => pasadaRitmoContratos(pool)…` →
`.then(() => pasadaReclamaciones(pool)).then(() => pasadaProvisionalesEnBooks(pool)).then(() => pasadaRitmoContratos(pool)…`.
**Las pruebas de texto sobre ese fichero son TRES, no dos, y las tres siguen verdes** (expresiones leídas): la de
`apps/desk/server/services/avisoRitmoContrato.test.ts:194` exige `pasadaRitmoContratos(pool).then(() => sync.syncRecent())`
adyacentes, intacto; la de `apps/desk/server/services/avisoReclamacionProveedor.test.ts:258-259`, que la de reclamaciones vaya
antes; y la de `apps/desk/server/services/alarmasSla.test.ts:260-262`, posiciones crecientes de alarmas, ritmo y sincronización.

## §7 · Pruebas (rojo antes) y mutaciones por lote
**Lote 1.** Arneses ya existentes: `instalarArnes()` con `POST /api/tickets` (`apps/desk/server/services/altaManual.test.ts:22-23`)
y `freshDb()` con `schemaStatements()` (`packages/zoho-sync/src/db/novedadesSiembra.test.ts:10-19`).

| Fichero | Casos |
|---|---|
| `packages/shared/src/nitExentos.test.ts` (nuevo) | sin formato, con puntos, con espacios, con guion y dígito → `true`; otro NIT, lista vacía, NIT sin dígitos, valor que no es texto → `false`; fila de la lista escrita con puntos casa igual; base más dígito SIN guion → `false` |
| `packages/zoho-sync/src/db/nitExentosEsquema.test.ts` (nuevo) | tras `migrate`, una fila `222222222222` activa; migrar dos veces conserva `activo = false`; una sola sentencia de siembra, con `ON CONFLICT (nit) DO NOTHING`; el `CREATE` va calificado y después de `idx_encuesta_respuestas_ticket` |
| `apps/desk/server/services/altaManual.test.ts`, `describe` nuevo al final, con un contacto de Books de NIT `222222222222` | exento sin formato y `it.each` de tres formatos → `201`; otro NIT repetido en Books → `409` con candidatos; fila inactiva → `409`; lista vacía → `409`; base más dígito sin guion contra Books con guion → `409` (comportamiento conocido, riesgo 1 de la propuesta); **posición:** exento + serial distinto → `422` del serial, exento sin correo → `422` de A, exento + `clientId` → `422` de C; **lectura:** un alta sin cliente manual no consulta `nit_exentos`, y con exento no se lanza la consulta de contactos (base espía propia, molde `apps/desk/server/services/altaManual.test.ts:298-307`, que es local a su `describe`) |

Impulsoras (rojas antes): las `201`, las dos de «vuelve el `409`» (fallan por tabla inexistente) y las de lectura. Las tres
de posición nacen verdes: son guardas. **Mutaciones a ejecutar y restaurar:** M1 quitar `!esNitExento(…)` de la línea 96; M2
(regla 1) anteponer la exención saltando `validarContenidoAltaManual` → rojas las de posición; M3 quitar `WHERE activo = true`;
M4 (regla 2) borrar la siembra de `schema.sql`; M5 quitar `public.` del `CREATE` → guardián; M6 `some` por `every` → roja la
lista vacía; M7 quitar `'nit_exentos'` de `PUBLIC_TABLES`.

**Lote 2.** `apps/desk/server/services/avisoProvisionalEnBooks.test.ts` (nuevo): pg-mem con `migrate` por prueba
(`apps/desk/server/services/avisoRitmoContrato.test.ts:23`); destinatarios con rol de área Comercial y `recibe_avisos`
(`apps/desk/server/services/avisoRitmoContrato.test.ts:30-38`); contactos con `INSERT INTO books.contacts (contact_id,
contact_name, nit)` (`apps/desk/server/services/altaManual.test.ts:28`); provisionales por `INSERT` directo.

| # | Caso |
|---|---|
| a | una pareja, dos usuarios de Comercial → dos avisos de bandeja (`ticket_id` y `enviado_at` nulos), una marca con `avisos_creados = 2`; Servicio Técnico no recibe; el texto trae razón social, NIT y nombre |
| b | segunda pasada → `0`, ningún aviso nuevo y NINGUNA transacción abierta (cero `connect`) |
| c | un provisional × dos contactos → dos marcas, en orden de `contactoId` |
| d | provisional enlazado → no avisa |
| e | exento: los dos lados (siembra); sólo el contacto (`2222222222221` × `222222222222-1`); sólo el provisional (fila extra `900123456-7`, `9001234567` × `9001234567-9`) → `0` en los tres |
| f | sin destinatarios y dos parejas → `0`, sin marcas, UN solo `warn`; al aparecer un usuario, la pasada siguiente avisa las dos |
| g | salidas cortas con base contadora: sin provisionales, una consulta; sólo provisionales exentos, dos y ninguna a contactos |
| h | estructura con rastreador que anota verbo y tabla: `BEGIN`, marca, aviso, `COMMIT` por el cliente; si falla el aviso, `ROLLBACK` y nada por el pool; `23505` en la marca → `false` |
| i | `marcarYAvisarPareja` dos veces → `true` y `false`, un aviso; con destinatarios vacíos → `false` y sin marca; dos pasadas concurrentes → una marca |
| j | falla la marca de la primera pareja → la segunda se avisa igual |
| k | la pasada resuelve con la base caída y la sincronización encadenada corre; dos pasadas seguidas consultan las dos veces |
| l | `index.ts` como texto: el import, y `pasadaReclamaciones(pool)` < `pasadaProvisionalesEnBooks(pool)` < `pasadaRitmoContratos(pool)` < `sync.syncRecent()` |

`nitExentosEsquema.test.ts` crece por el final: la tabla existe y nace vacía, la pareja repetida da `23505`,
`avisos_creados` nulo se rechaza, y el `CREATE` va calificado y después de la siembra de `nit_exentos`. La atomicidad se
prueba por estructura (h) porque pg-mem no revierte (`apps/desk/server/db/transaccion.test.ts:25`).
**Mutaciones:** N1 quitar el `INSERT` de la marca → b; N2 quitar la guarda interior de destinatarios → i, y la exterior → f;
N3 quitar `enlazado_a IS NULL` → d; N4 quitar la pasada de `index.ts` → l; N5 (regla 1) mover la marca detrás de los avisos →
h e i; N6 crear el aviso con `db` en vez de `q` → h; N7 quitar cada lado de la exención → e; N8 quitar la consulta previa de
marcas → b; N9 quitar cada salida corta → g; N10 quitar la clave primaria o `public.` en `schema.sql` → esquema y guardián;
N11 quitar el `try/catch` por pareja → j, y el de la pasada → k.

## §8 · Reparto y medida (estimación; la medida real se ejecuta antes de cerrar cada intento)
| Lote 1 | Líneas | Lote 2 | Líneas |
|---|---|---|---|
| `schema.sql` | 11 | `schema.sql` | 11 |
| `migrate.ts`, `migrate.test.ts` (§4) | 34 | `migrate.ts`, `migrate.test.ts` (§4) | 34 |
| `nitExentos.ts` (shared), `index.ts`, su prueba | 51 | `db/provisionalEnBooks.ts` | 40 |
| `db/nitExentos.ts` | 14 | `services/avisoProvisionalEnBooks.ts` | 95 |
| `ticketService.ts`, `altaManual.ts` | 10 | `index.ts` | 4 |
| `altaManual.test.ts` | 75 | `avisoProvisionalEnBooks.test.ts` | 250 |
| `nitExentosEsquema.test.ts` | 50 | `nitExentosEsquema.test.ts`, `DEPLOY.md` | 60 |
| casillas y `apply-progress.md` | 90 | casillas y `apply-progress.md` | 100 |
| **Total** | **~335** (techo ~430) | **Total** | **~594** (techo ~690) |

Una línea editada en sitio cuenta dos. **Si el lote 2 supera 720, se corta por el cableado:** 2a deja la tabla, el guardián,
las lecturas y el servicio sin conectar —inerte—, con los casos a a j; 2b añade `pasadaProvisionalesEnBooks`,
`apps/desk/server/index.ts:88`, los casos k y l y `DEPLOY.md`. Cada parte lleva su prueba en su mismo intento.

## §9 · Regla invariable 13, documentación y cierre
**Ninguna decisión en el cliente; el hallazgo 8 de la exploración queda VERIFICADO, con un matiz.**
| Lo que hace `apps/desk/src` | Línea | Quién decide |
|---|---|---|
| Envía el NIT recortado (no «sin tocar»: `t(m.c.nit)`) | `apps/desk/src/lib/altaManualEstado.ts:30` | servidor, `apps/desk/server/services/ticketService.ts:96` |
| Enseña los candidatos del `409` | `apps/desk/src/api/client.ts:781-784` | servidor, `apps/desk/server/services/altaManual.ts:158-161` |
| Pinta el NIT y busca por subcadena | `apps/desk/src/components/AltaManual.tsx:153`, `apps/desk/src/components/ClientesPage.tsx:34` | presentación; no compara igualdad |

`normalizarNit` y `nitCoincide` no aparecen en `apps/desk/src` (búsqueda: cero). No se toca ese árbol.

**`DEPLOY.md` sí cambia (lote 2):** apartado nuevo al final, tras `DEPLOY.md:628`, con el molde de `DEPLOY.md:595-628`:
«Comprobación de lectura tras desplegar F1B-19». Sin variables de entorno ni interruptor (`.env.example` no cambia); dos
tablas que `migrate` crea al arrancar y UNA fila sembrada; consultas de sólo lectura para comprobarlo; cómo añadir y retirar un
exento por SQL (`activo = false`, nunca `DELETE`); qué se rompe si falta `nit_exentos` (toda alta con cliente manual falla,
porque la línea 96 la lee) o `provisional_books_avisados` (la pasada registra un error por intervalo y la sincronización
sigue); y el aviso de S-4: la primera pasada avisa una vez cada pareja que ya exista.

**Barrido de la regla de mutación 4, al cierre de cada lote:** `ticketService.ts`, `altaManual.ts`, `index.ts`, `migrate.ts`,
`migrate.test.ts`, `schema.sql` y `packages/shared/src/index.ts` conservan su número de líneas salvo `schema.sql`, que crece
por el final; cada cita se comprueba contra el fichero. Las de `migrate.test.ts` del §4 cambian de texto sin moverse.

## §10 · Amenazas, despliegue y preguntas abiertas
Matriz de amenazas: N/A (sin rutas, shell, subprocesos ni automatización de repositorio; la pasada es una promesa más de una
cadena que ya existe). Sin interruptor: las dos piezas quedan activas al publicar. Reversión: revertir los commits; las tablas
quedan inertes. Preguntas que bloqueen: ninguna. S-1 a S-6 siguen siendo de Gerencia, y S-4 conviene responderla antes de
desplegar. Los identificadores de requisito los fija `sdd-spec`; este diseño nombra las decisiones, no los requisitos.
