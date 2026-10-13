# Diseño — La comparación de los nueve indicadores lee la exportación de Zoho (`comparacion-exportacion-zoho`, F1F-05, `cierra: no`)

Propuesta: `openspec/changes/comparacion-exportacion-zoho/proposal.md`. Delta de spec (manda; no editada):
`openspec/changes/comparacion-exportacion-zoho/specs/kpis/spec.md`. Toda cita es a un fichero leído en este worktree sobre
`62181fc`. Los ficheros nuevos se nombran sin línea y una línea **prevista** se nombra en prosa, nunca con forma de cita. Lo no
comprobado está en el apartado 14 con la palabra «hipótesis». Supera a propósito el tope de 800 palabras de la skill: el encargo
pide trece decisiones cerradas.

## 1. Enfoque técnico

Tres piezas puras y una puerta. El **lector** convierte el texto en filas de doce columnas; el **cruce** empareja filas y tickets
del periodo y devuelve, para los que cruzan, el mismo `TicketParaIndicadores` con `camposZoho` sustituido por las diez celdas de su
fila; la **ruta** encadena lo que ya existe (`leerEntradasIndicadores`, `tablaIndicadores`, `parDeIndicador`,
`compararIndicadores`) sin tocarlo. El valor de Zoho sigue saliendo de la única línea que lo fija
(`packages/shared/src/indicadores.ts:223`): no hay segunda lectura de celdas ni segunda comparación. Nada se guarda.

## 2. Decisiones de arquitectura

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| DD-1 | Ruta `POST /api/indicadores/comparacion`, campo multipart `file`, periodo en la query (`desde`, `hasta`), en fichero propio `apps/desk/server/routes/indicadoresComparacion.ts` | Añadirla a `apps/desk/server/routes/indicadores.ts` | RQ-KP-14 exige que el `GET` no lea ficheros: en fichero propio, sus pruebas no comparten módulo con multer |
| DD-2 | Lector y cruce viven en el **servidor** (`apps/desk/server/comparacion/`), no en `packages/shared` como apuntaba la propuesta (§7) | `packages/shared` | La regla 13 admite los dos sitios y el cliente no lee el fichero (RQ-KP-28). En el servidor el lector **reutiliza** el lector de registros de la encuesta; desde `shared` no puede importarlo y habría un segundo lector de CSV (molde H5) |
| DD-3 | Un solo lector de registros: `leerRegistros` se **exporta en sitio** (`apps/desk/server/encuesta/analizarRespuestas.ts:54` gana la palabra `export`); `decodificarFichero` (`apps/desk/server/encuesta/analizarRespuestas.ts:27`) ya se exporta | Extraerlo a un módulo común; escribir un segundo | Extraer borra 27 líneas del analizador y obliga al barrido de citas; un segundo son dos implementaciones de la misma noción. Exportar no mueve líneas ni cambia la carga de la encuesta: sus pruebas quedan intactas y son la prueba de ello |
| DD-4 | Separador **fijo coma**; no se usa `elegirSeparador` (`apps/desk/server/encuesta/analizarRespuestas.ts:42`) | Detectar `,` o `;` | S-I declara coma. Un fichero reescrito con `;` da el `400` que nombra las doce columnas, que es el aviso correcto: no se sube tal cual |
| DD-5 | La normalización de cabeceras es **la de `valorDeZoho`**: al final de `packages/shared/src/indicadores.ts`, tras la línea 262, se añade `export const normalizarNombreZoho = normalizar` | Normalizador propio en el lector | `normalizar` es privada (`packages/shared/src/indicadores.ts:92`); RQ-KP-23 pide «como `valorDeZoho`». Una sola definición; el fichero no mueve ninguna línea |
| DD-6 | Camino único: el cruce devuelve `{ ...ticket, camposZoho: fila.campos }` y la ruta llama `tablaIndicadores({ ...entradas, tickets: cruzados })` (`apps/desk/server/indicadores.ts:94`) | Sustituir `valorZoho` en cada par tras calcular; un parámetro nuevo en `calcularIndicadores` | `valorDeZoho(columna, [t.camposZoho])` ya es el único lector. `indicadores.ts` y `indicadoresComparacion.ts` no cambian de comportamiento; el 55, el 47 y los otros ocho no se tocan |
| DD-7 | Los tickets del periodo ausentes del fichero **no entran en los pares**: sólo se listan en «sólo en Desk» | Darles bolsa vacía y pasarlos por la comparación | Con bolsa vacía sumarían en `sinComparar` y se mezclarían con los que cruzan sin valor. Excluidos, vale por columna `comparados + sinComparar = cruzados`, que se prueba. En ningún caso se usa `custom_fields` (S-L) |
| DD-8 | «Valor ilegible»: celda con texto tras recortar y `valorDeZoho(columna, [{ [nombre]: celda }])` devuelve `null` | Repetir en el lector la expresión de entero | La regla de aceptación sigue en un solo sitio (`packages/shared/src/indicadores.ts:116-117`) |
| DD-9 | «En Desk fuera del periodo»: `SELECT id, number FROM tickets WHERE id IN ($1,…)` sobre los «ID» que no cruzaron, en bloques de 5.000, en `apps/desk/server/db/ticketsPorId.ts` | `WHERE id = ANY($1)`; modificar `leerEntradasIndicadores` | pg-mem no ejecuta `= ANY` con arrays ligados (`apps/desk/server/db/eliminarTicket.ts:65`); el molde es `apps/desk/server/db/encuestaRespuestas.ts:37`. `leerEntradasIndicadores` no se toca |
| DD-10 | El periodo se valida con `validarPeriodo({ desde, hasta })`, pasando **sólo** esas dos claves | Pasar `req.query` entero | `validarPeriodo` también rechaza `formato` (`apps/desk/server/indicadores.ts:36`), que esta ruta no tiene |
| DD-11 | Los tipos de la respuesta viven en `packages/shared/src/indicadoresExportacion.ts` (sólo tipos) | Tipos en el servidor y copia en el cliente | El cliente no puede importar del servidor; una sola forma para los dos |
| DD-12 | `DEPLOY.md`: **sección nueva al final** del fichero y un puntero **en sitio** en el §9 (`DEPLOY.md:269`) | Añadir al final del §9, como proponía el encargo | 130 citas del repositorio (contadas con las de los cambios archivados) apuntan a líneas de `DEPLOY.md` de la 310 en adelante; insertar en el §9 las desfasa todas. El precedente es la sección final de la carga de la encuesta (`DEPLOY.md:595`) |
| DD-13 | El cliente no comprueba el tamaño: muestra el mensaje del `413` | Avisar antes de subir comparando `file.size` | El límite vive en el servidor (`apps/desk/server/util/subida.ts:6`); copiarlo al cliente es reescribir una regla |
| DD-14 | Éxito `200` | `201` | No se crea nada |

## 3. D1 — Lector: `apps/desk/server/comparacion/leerExportacion.ts` (nuevo, puro)

Importa sólo `leerRegistros` de `../encuesta/analizarRespuestas` y, de `@ambientalia/shared`, `valorDeZoho`, `NOMBRES_ZOHO`,
`normalizarNombreZoho` y tipos. Sin base, red ni disco.

```ts
export const COLUMNA_ID = 'ID', COLUMNA_NUMERO = 'ID de la solicitud'
/** Las diez cabeceras de la muestra, con su columna de indicador. El guardián las enfrenta a `NOMBRES_ZOHO`. */
export const COLUMNAS_INDICADOR: ReadonlyArray<{ nombre: string; columna: ColumnaIndicador }>
export const ERRORES_EXPORTACION = { vacio: 'El fichero está vacío', sinFilas: 'El fichero no trae ninguna fila de datos',
  binario: 'El fichero no es un CSV legible: expórtelo de Zoho Desk en CSV y súbalo tal cual',
  faltan: (c: readonly string[]) => `El fichero no trae las columnas necesarias: ${c.join(', ')}`,
  repetida: (c: string) => `La columna «${c}» aparece más de una vez en el fichero` }
export const MOTIVOS_EXPORTACION = { idVacio: 'la columna «ID» está vacía', idRepetido: 'la columna «ID» repite la de una fila anterior',
  idNoDigitos: 'la columna «ID» no es sólo dígitos; si el fichero pasó por una hoja de cálculo, expórtelo de nuevo' } as const
export interface FilaExportacion { fila: number; id: string; numero: number | null; campos: Record<string, string> }
export type LecturaExportacion = { ok: false; error: string }
  | { ok: true; leidas: number; filas: FilaExportacion[]; rechazadas: FilaRechazadaExportacion[]; ilegibles: ValorIlegible[] }
export function leerExportacion(contenido: string): LecturaExportacion
```

| Aspecto | Regla |
|---|---|
| Orden de los errores de fichero | BOM inicial fuera (molde `apps/desk/server/encuesta/analizarRespuestas.ts:152`); sólo blancos → `vacio`; contiene `U+0000` → `binario`; faltan columnas → `faltan` con **todas** las que faltan, en el orden «ID», «ID de la solicitud» y las diez; exigida repetida → `repetida`; sin registros de datos → `sinFilas` |
| Cabecera | el primer registro no vacío; por **nombre normalizado** con `normalizarNombreZoho`, igualdad exacta: «Tiempo del servicio» no casa con «Tiempo de servicio» |
| Filas | la cabecera es la fila 1; `fila` es el ordinal del registro, no la línea física. Un registro con todos los campos vacíos no cuenta. `leidas = filas.length + rechazadas.length` |
| «ID» | recortado; vacío → `idVacio`; no `^\d+$` → `idNoDigitos`; ya visto → `idRepetido` (vale la primera, S-M). `rechazadas` lleva `{ fila, columna: 'ID', motivo }`; ningún motivo interpola la celda |
| «ID de la solicitud» | `^\d+$` recortado → número; cualquier otra cosa → `null`. **No** rechaza la fila |
| `campos` | exactamente diez claves, los nombres de `COLUMNAS_INDICADOR`, con la celda cruda; en ese orden, así que «Tiempo de servicio» precede a «Tiempo total servicio» |
| Ilegibles (DD-8) | por celda de indicador, `{ fila, columna: nombre }`; la fila se conserva. Sólo de filas no rechazadas |
| Privacidad | las 47 columnas restantes no salen de la función: ni en `filas`, ni en motivos, ni en errores |

**Guardián de las dos listas** (molde H5, regla de mutación 2): cada nombre de `COLUMNAS_INDICADOR` lo acepta `valorDeZoho` para
su columna (`valorDeZoho(columna, [{ [nombre]: '1' }])` no es `null`) y las nueve columnas de `NOMBRES_ZOHO`
(`packages/shared/src/indicadores.ts:65-75`) quedan cubiertas. Se ensucia `NOMBRES_ZOHO` (renombrar una entrada) y la lista.

**Contrato de `leerRegistros`** en la prueba del lector: coma dentro de comillas, comilla doblada, salto de línea dentro de
comillas y CRLF. Si el analizador de la encuesta se sustituye, esta prueba avisa.

## 4. D2 — Cruce: `apps/desk/server/comparacion/cruzarExportacion.ts` (nuevo, puro)

```ts
export function cruzarExportacion(filas: readonly FilaExportacion[], delPeriodo: readonly TicketParaIndicadores[]): {
  cruzados: TicketParaIndicadores[]      // el ticket de Desk con camposZoho = fila.campos (DD-6), en el orden de `delPeriodo`
  soloEnDesk: TicketRef[]                // del periodo y ausentes del fichero; `numero` es tickets.number
  sinCruzar: FilaExportacion[]           // filas válidas cuyo ID no está entre los del periodo
  numeroDistinto: NumeroDistinto[]       // el id cruza y fila.numero !== ticket.numero (también si fila.numero es null)
}
export function repartirSinCruzar(sinCruzar: readonly FilaExportacion[], existentes: ReadonlyMap<string, number>):
  { soloEnFichero: TicketRef[]; fueraDelPeriodo: TicketRef[] }   // `numero` es el del fichero
```

La clave es `fila.id === ticket.id`, igualdad de texto; el número nunca cruza (RQ-KP-24). `sinCruzar` se reparte con el mapa de
`ticketsPorId`: si el «ID» existe en Desk es «fuera del periodo», si no «sólo en el fichero» (S-N). Sin `desde` ni `hasta` salen
todos los tickets (`apps/desk/server/indicadores.ts:70`), así que «fuera del periodo» queda vacío por construcción.

`apps/desk/server/db/ticketsPorId.ts` (nuevo): `numerosDeTickets(db, ids, trozo = 5000): Promise<Map<string, number>>`. Con
`ids` vacío no emite nada. **Número de consultas de la ruta:** las cuatro de `leerEntradasIndicadores`
(`apps/desk/server/indicadores.ts:56`) más una por bloque de 5.000 «ID» sin cruzar: cinco con la muestra, cuatro si todo cruza.
No depende del número de tickets de Desk y lo acota el límite de subida.

## 5. D3 — Ruta: `apps/desk/server/routes/indicadoresComparacion.ts` (nuevo)

```ts
export const MENSAJE_SIN_EXPORTACION = 'Falta el fichero de la exportación de Zoho'
export function registerIndicadoresComparacionRoutes(app: Express, deps: { db: Queryable }): void
//  app.post('/api/indicadores/comparacion', requireAuth(db), requireAdmin, crearSubida().single('file'), asyncHandler(…))
```

| Paso | Dónde | Condición | Respuesta |
|---|---|---|---|
| 1 | `requireAuth` (`apps/desk/server/auth/middleware.ts:17`, `apps/desk/server/auth/middleware.ts:19`) | sin cookie o sesión inválida | `401` |
| 2 | `requireAdmin` (`apps/desk/server/auth/middleware.ts:27`) | sin `isAdmin` | `403` |
| 3 | multer, vía el manejador central (`apps/desk/server/app.ts:84-89`) | fichero mayor que `LIMITE_SUBIDA_BYTES`; campo con otro nombre | `413` con el límite; `400` |
| 4 | manejador | `validarPeriodo({ desde, hasta })` no `ok` | `400` `{ error }` |
| 5 | manejador | `!req.file` | `400` `{ error: MENSAJE_SIN_EXPORTACION }` |
| 6 | manejador | `leerExportacion(decodificarFichero(req.file.buffer))` no `ok` | `400` `{ error }` |
| 7 | manejador | `leerEntradasIndicadores` → `cruzarExportacion` → `numerosDeTickets` → `repartirSinCruzar` → `tablaIndicadores` → `parDeIndicador` → `compararIndicadores` | `200` con la forma del apartado 6 |

Los pasos 4 a 6 no tocan la base: la primera consulta de tickets es del paso 7. Molde del orden de los middlewares:
`apps/desk/server/routes/encuestaRespuestas.ts:19`. Del cuerpo sólo se lee el fichero. El manejador no llama a `console` ni al
registro; un fallo inesperado cae en el manejador central, que registra el error y responde «Error interno»
(`apps/desk/server/app.ts:90`), y ningún error de las piezas nuevas lleva celdas.

**Registro, sin insertar líneas:** `apps/desk/server/app.ts:22` gana al final
`; import { registerIndicadoresComparacionRoutes } from './routes/indicadoresComparacion'` y `apps/desk/server/app.ts:61` gana al
final `; registerIndicadoresComparacionRoutes(app, { db })`. Sin interruptor: no enciende ningún escritor; `.env.example` no cambia.

## 6. D4 — Forma exacta de la respuesta: `packages/shared/src/indicadoresExportacion.ts` (nuevo, sólo tipos)

```ts
export interface TicketRef { id: string; numero: number | null }
export interface FilaRechazadaExportacion { fila: number; columna: string; motivo: string }
export interface ValorIlegible { fila: number; columna: string }
export interface NumeroDistinto { id: string; numeroFichero: number | null; numeroDesk: number }
export interface ComparacionExportacion {
  periodo: { desde: DiaCivil | null; hasta: DiaCivil | null }
  fichero: { leidas: number; rechazadas: FilaRechazadaExportacion[] }
  cruce: {
    cruzados: number
    soloEnFichero: { total: number; tickets: TicketRef[] }; fueraDelPeriodo: { total: number; tickets: TicketRef[] }
    soloEnDesk: { total: number; tickets: TicketRef[] }; numeroDistinto: { total: number; tickets: NumeroDistinto[] }
    valoresIlegibles: { total: number; porColumna: Record<string, number>; valores: ValorIlegible[] }
  }
  comparacion: ResumenComparacion   // la del GET (`packages/shared/src/indicadoresComparacion.ts:40-47`): sin veredicto
}
```

Se reexporta añadiendo `export * from './indicadoresExportacion'` **al final** de `packages/shared/src/index.ts`. Listas siempre
presentes, vacías si es el caso, y completas (S-Q). Invariantes que la prueba de la ruta afirma:
`fichero.leidas = rechazadas.length + cruzados + soloEnFichero.total + fueraDelPeriodo.total`; tickets del periodo
`= cruzados + soloEnDesk.total`; por columna, `comparados + sinComparar = cruzados` (DD-7). No hay lista de tickets con sus
indicadores: eso es del `GET`.

## 7. D5 — Cliente y tabla de la regla 13

| Fichero | Qué |
|---|---|
| `apps/desk/src/lib/comparacionExportacion.ts` (nuevo, con prueba) | `urlComparacion(periodo)`: `desde` y `hasta` **tal como se escriben**, omitidos si están vacíos; `ACEPTA_EXPORTACION = '.csv'`; `puedeComparar(hayFichero, enviando)`; `mensajeDeError(estado, cuerpo)`: el `error` del servidor tal cual y, sin él, `HTTP nnn`; `vistaComparacion(r)`: filas ya listas para pintar (recuentos, una fila por columna con `NOMBRES_ZOHO[c][0]`, `—` si `porcentaje` es `null`), sin sumar ni dividir |
| `apps/desk/src/api/client.ts` | **al final**: `compararConExportacion(file, periodo)`, molde `apps/desk/src/api/client.ts:761-766` (`FormData`, campo `file`, sin cabecera `Content-Type`) |
| `apps/desk/src/components/ComparacionExportacion.tsx` (nuevo) | selector de fichero, dos `input type="date"`, botón «Comparar» y pintado de `vistaComparacion`; listas en `details`; tonos neutros, sin color por resultado |
| `apps/desk/src/components/Analisis.tsx` | la importación se añade **en sitio** a `apps/desk/src/components/Analisis.tsx:6`; una línea insertada tras `apps/desk/src/components/Analisis.tsx:90` monta el panel si `mostrarDescargaIndicadores(user)`. El enlace de `apps/desk/src/components/Analisis.tsx:83` no se mueve |

Los `.tsx` quedan fuera de la red de pruebas por decisión de Gerencia: todo lo decidible está en el `.ts`.

| # | Decisión del cliente | Tipo | Punto del servidor que la impone |
|---|---|---|---|
| C1 | Monta el panel sólo a administradores (reutiliza `mostrarDescargaIndicadores`, `apps/desk/src/lib/indicadoresUrl.ts:16`) | bloquea | `apps/desk/server/auth/middleware.ts:27`, paso 2 de la ruta nueva |
| C2 | Deshabilita «Comparar» sin fichero o mientras envía | bloquea | paso 5 de la ruta nueva (`400`, `MENSAJE_SIN_EXPORTACION`). El doble envío no necesita imposición: la ruta no escribe |
| C3 | Limita el selector a `.csv` | rellena | paso 6: `binario` y `faltan` del lector |
| C4 | Muestra el mensaje del `413` | avisa | `apps/desk/server/app.ts:86` |
| C5 | Ofrece selector de fecha y envía el periodo sin validarlo | rellena | paso 4: `apps/desk/server/indicadores.ts:26` |
| C6 | Pinta recuentos, porcentajes y listas sin color, meta ni veredicto | — | la respuesta no trae ninguno: `packages/shared/src/indicadoresComparacion.ts:40-47` |
| C7 | Muestra el `error` del servidor tal cual | — | no decide |

Las líneas de los pasos 4 a 6 se rellenan con la línea real en `tasks.md` al cerrar el lote 3 (regla de mutación 3).

## 8. D6 — Fixture sintético: `apps/desk/server/testing/exportacionZoho.ts` (nuevo, auxiliar de prueba)

- `CABECERA_MUESTRA`: las 59 cabeceras de `docs/analisis-tickets/Tickets.csv:1`, como constante. Un guardián lee **sólo la primera línea** de la muestra y exige que sea `CABECERA_MUESTRA.join(',')` tras quitar el BOM: si la muestra cambia de cabecera, se entera.
- `filaMuestra(sobre)`: una fila de 59 campos **inventados**. Por omisión, «Nombre del Contact» y «Contact Name» valen «Centinela Prueba», «Correo electrónico» y «Correo Encargado» valen «centinela@ejemplo.invalid», y «Descripción» lleva una coma, una comilla doblada y un salto de línea. `sobre` fija las celdas que interesan a cada prueba.
- `csvMuestra(filas, { quitar?, renombrar? })`: `Buffer` con BOM, coma y CRLF. `quitar` y `renombrar` ensucian la cabecera.
- Ninguna fila real ni dato de contacto se copia de la muestra; del fichero sólo se lee la línea 1.

## 9. D7 — Pruebas (strict TDD: rojo antes que verde; vitest en node, pg-mem)

| Lote | Fichero de prueba | Rojo primero |
|---|---|---|
| L1 | `apps/desk/server/comparacion/leerExportacion.test.ts` | los siete escenarios de RQ-KP-23, los de lectura de RQ-KP-24 (clave vacía, notación científica, repetida) y «una fila rechazada no cita la celda» de RQ-KP-27; errores `vacio`, `binario`, `repetida`, `sinFilas`; los dos guardianes; contrato de `leerRegistros`; pureza por importaciones (molde `apps/desk/server/encuesta/analizarRespuestas.test.ts:263-279`) |
| L2 | `apps/desk/server/comparacion/cruzarExportacion.test.ts`, `apps/desk/server/db/ticketsPorId.test.ts` | cruce por «ID»; mismo número con otro «ID»; número distinto y número `null`; los cuatro escenarios de RQ-KP-25; `camposZoho` del cruzado es la bolsa de la fila y **no** conserva ninguna clave sincronizada; bloques con `trozo = 2`; lista vacía sin sentencias |
| L3 | `apps/desk/server/routes/indicadoresComparacion.test.ts` | los doce escenarios de RQ-KP-26, los tres de RQ-KP-27, los nuevos de RQ-KP-14, -17 y -18, las pruebas de posición y los invariantes del apartado 6 |
| L4 | `apps/desk/src/lib/comparacionExportacion.test.ts` | los tres escenarios de RQ-KP-28: periodo mal escrito enviado tal cual; la vista repite los números de la respuesta; un `400` se muestra con su mensaje |

**Pruebas de posición** (regla de mutación 1, dos guardas activas a la vez). Espía: `Queryable` propio pasado a `appWith`
(`apps/desk/server/testing/appHarness.ts:46`), molde `apps/desk/server/routes/encuestaRespuestas.test.ts:34-38`; «consulta de
tickets» es toda sentencia que case `/\btickets\b|ticket_transitions/i`.

| Par | Caso | Esperado |
|---|---|---|
| 401 ↔ resto | sin cookie: fichero válido; campo «intruso»; periodo invertido; fichero sobre el límite | `401` |
| 403 ↔ resto | usuario sin administrador: los mismos cuatro y cabecera incompleta | `403` |
| 413 ↔ 400 periodo | administrador, periodo invertido y fichero sobre el límite | `413` |
| 400 periodo ↔ 400 fichero | administrador, periodo invertido: sin fichero; con fichero sin «ID» | el error del periodo |
| 400 sin fichero ↔ cabecera | administrador, periodo válido, sin fichero | `MENSAJE_SIN_EXPORTACION` |
| 400 cabecera ↔ consultas | administrador, fichero sin dos columnas | nombra las dos |

En **todos**, ninguna consulta de tickets. Los casos «sobre el límite» con `401` y `403` no pueden ir por supertest: el servidor
contesta sin leer el cuerpo, cierra el socket y supertest da `ECONNRESET`
(`apps/desk/server/routes/encuestaRespuestas.test.ts:44-60`). Se añade **al final** de `apps/desk/server/testing/appHarness.ts`
un auxiliar `estadoDePostGrande(app, ruta, cookie, bytes)` sobre `node:http`, usado sólo por la prueba nueva; la de la encuesta
no se toca.

**Sólo lectura:** toda sentencia de una carga válida es `SELECT`, la de sesión incluida (molde `apps/desk/server/routes/indicadores.test.ts:19-20`); las de datos son cinco, o cuatro si todo cruza. **Sin disco:** las piezas nuevas no importan `node:fs` y multer es en memoria (`apps/desk/server/util/subida.ts:10-11`). **El `GET` no cambia:** sus pruebas no se editan y siguen verdes; se añade un `GET` tras un `POST` con cuatro consultas.

**Centinela de privacidad:** se espían `console.log`, `info`, `warn`, `error` y `debug`, y los mismos niveles del registro, que en pruebas está en silencio (`apps/desk/server/util/logger.ts:6`); se sube un fichero con las celdas centinela y un valor ilegible «xyz», y ni el JSON serializado ni los argumentos espiados contienen «Centinela Prueba», «centinela@ejemplo.invalid» ni «xyz». Se repite con un `Queryable` que falla en la lectura de tickets: `500` «Error interno» y lo registrado no trae celdas.

**Camino único:** una celda «2.5» en «Tiempo de orden de Venta» de un ticket cuyo 59 vale 3 queda en `sinComparar` e ilegible: leerla con `Number` la daría comparada. «Cumple» con espacios alrededor coincide por el recorte de `valorDeZoho`.

## 10. D8 — Mutaciones que el verify reproducirá

| # | Regla | Mutación | La caza |
|---|---|---|---|
| M1 | 1 | multer delante de `requireAdmin` | 403 ↔ límite y 403 ↔ «intruso» |
| M2 | 1 | multer delante de `requireAuth` | 401 ↔ límite y 401 ↔ «intruso» |
| M3 | 1 | `requireAdmin` delante de `requireAuth` | 401 ↔ resto (daría `403`) |
| M4 | 1 | `!req.file` delante de `validarPeriodo` | 400 periodo ↔ sin fichero |
| M5 | 1 | `leerExportacion` delante de `validarPeriodo` | 400 periodo ↔ fichero sin «ID» |
| M6 | 1 | `leerEntradasIndicadores` delante de `leerExportacion` | 400 cabecera ↔ consultas |
| M7 | 1 | lector: `idRepetido` antes que `idNoDigitos`; `faltan` después de `sinFilas` | orden de motivos y de errores |
| M8 | 2 | fixture sin una columna; sin dos; renombrada | `faltan` nombra una, dos, la renombrada |
| M9 | 2 | fixture con «ID» vacío, en notación científica, repetido | los tres motivos; las demás filas se comparan |
| M10 | 2 | fixture con «abc» y «2.5» en una columna de tiempo | dos ilegibles, filas conservadas |
| M11 | 2 | fixture con otro «ID de la solicitud» en una fila que cruza | `numeroDistinto` y el par se compara |
| M12 | 2 | `NOMBRES_ZOHO` o `COLUMNAS_INDICADOR` con una entrada cambiada; `CABECERA_MUESTRA` con una cabecera cambiada | los guardianes |
| M13 | — | cruzar por número; aceptar clave no numérica | «mismo número, otro ID»; notación científica |
| M14 | — | vaciar `soloEnDesk` o `soloEnFichero`; fundir «fuera del periodo» con «sólo en el fichero» | RQ-KP-25 e invariantes |
| M15 | — | completar la bolsa con `custom_fields` (`{ ...t.camposZoho, ...fila.campos }`) | «no conserva ninguna clave sincronizada» |
| M16 | — | pasar a la comparación los ausentes del fichero | `comparados + sinComparar = cruzados` |
| M17 | — | devolver una columna de contacto, o interpolar la celda en un motivo | centinela |
| M18 | — | una sentencia de escritura en la ruta | «todo es lectura» |
| M19 | — | leer la celda con `Number` en vez de `valorDeZoho`; comparar a mano | «camino único» y tolerancia de un día |
| M20 | — | detector de ilegibles con expresión propia que acepte decimales | M10 |
| M21 | 3 | la tabla del apartado 7, línea a línea | cierre del lote 4 |

## 11. D9 — Lotes de `apply` (techo 800, válvula 720; cada cifra ya lleva el ×1,8)

| Lote | Ficheros | Primera cuenta | × 1,8 |
|---|---|---|---|
| L1 · Lector | `analizarRespuestas.ts` (1 en sitio); `packages/shared/src/indicadores.ts` (2 al final); `indicadoresExportacion.ts` (25); `index.ts` (1); `leerExportacion.ts` (85); `testing/exportacionZoho.ts` (40); su prueba (160) | 314 | **~565** |
| L2 · Cruce | `cruzarExportacion.ts` (50); `db/ticketsPorId.ts` (18); sus dos pruebas (140) | 208 | **~375** |
| L3 · Ruta | `routes/indicadoresComparacion.ts` (40); `app.ts` (2 en sitio); `appHarness.ts` (20 al final); su prueba (250) | 312 | **~560** |
| L4 · Cliente y despliegue | `lib/comparacionExportacion.ts` (55) y su prueba (80); `client.ts` (10 al final); `ComparacionExportacion.tsx` (110); `Analisis.tsx` (2); `DEPLOY.md` (35 al final, 1 en sitio) | 293 | **~530** |
| Cierre documental | barrido de citas, `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, tabla de la regla 13 | — | aparte |

El lote 1 de la propuesta se parte en dos (lector y cruce): junto pasaba de 900. Dependencias: L2 de L1 por tipos; L3 de L1 y L2;
L4 de L1 por tipos. Cada intento se cierra midiendo `git diff --shortstat --no-renames` contra el commit de partida más las
líneas de lo nuevo sin trackear; el que llegue a 720 se parte.

## 12. D10 — Dónde cae cada edición (regla de mutación 4)

| Fichero | Dónde | Citas que se desplazan |
|---|---|---|
| `packages/shared/src/indicadores.ts` | al final, tras la línea 262 | ninguna |
| `packages/shared/src/indicadoresComparacion.ts` | **no se toca** | — |
| `apps/desk/server/indicadores.ts`, `apps/desk/server/routes/indicadores.ts` | **no se tocan**; el comentario de `apps/desk/server/routes/indicadores.ts:52` sigue siendo cierto del `GET` | — |
| `apps/desk/server/app.ts` | líneas 22 y 61, en sitio | ninguna: las citas vivas a `apps/desk/server/app.ts:86` y `apps/desk/server/app.ts:90` no se mueven |
| `apps/desk/server/encuesta/analizarRespuestas.ts` | línea 54, en sitio | ninguna |
| `apps/desk/server/testing/appHarness.ts`, `apps/desk/src/api/client.ts`, `packages/shared/src/index.ts` | al final | ninguna |
| `apps/desk/src/components/Analisis.tsx` | línea 6 en sitio; una línea tras la 90 | las posteriores a la 90: `docs/sdd/ENTRADA.md:1284` cita la línea 95 de ese fichero y se revisa en el cierre, leyendo qué afirma |
| `DEPLOY.md` | línea 269 en sitio; sección nueva tras `DEPLOY.md:720` | ninguna |

El barrido del cierre repite el `grep` por cada fichero de la tabla, con segundo pase para las abreviadas.

## 13. Flujo, amenazas, migración y preguntas abiertas

    administrador ──POST /api/indicadores/comparacion?desde&hasta──→ sesión → administrador → multer → periodo → fichero
        decodificarFichero → leerExportacion ── filas (ID, número, diez celdas) + rechazadas + ilegibles
        leerEntradasIndicadores (4 SELECT) → cruzarExportacion ── cruzados (camposZoho = fila) · sólo en Desk · sin cruzar
        numerosDeTickets (SELECT por ID) → repartirSinCruzar ── sólo en el fichero · en Desk fuera del periodo
        tablaIndicadores(cruzados) → parDeIndicador → compararIndicadores ──→ { periodo, fichero, cruce, comparacion }

**Matriz de amenazas:** no aplica: sin comandos de shell, subprocesos, automatización de control de versiones ni clasificación
de ejecutables. La ruta HTTP nueva se cubre con la escalera del apartado 5. **Migración:** ninguna; sin tabla, sin variables.
Reversión: la de la propuesta (§11).

**Preguntas abiertas y desviaciones** (ninguna bloquea; la spec no se edita):

- [ ] **Hueco de la spec en el 54.** `valorDeZoho` acepta cualquier texto en las columnas textuales (`packages/shared/src/indicadores.ts:116`) y la comparación descarta el que no sea «Cumple» o «No cumple» (`packages/shared/src/indicadoresComparacion.ts:63`): una celda «Sí» no es «valor ilegible» según RQ-KP-23 y tampoco se compara; queda en `sinComparar` sin listarse. Se sigue la spec y se anota para Gerencia.
- [ ] **50 y 53 distintos en una fila:** `valorDeZoho` toma la primera celda usable, «Tiempo de servicio». La spec no pide contarlo y no se cuenta.
- [ ] Añadidos que la spec no enumera a la letra y caben en «fichero ilegible»: los errores `binario`, `repetida` y `sinFilas`, y que un «ID de la solicitud» no numérico dé `numero: null` sin rechazar la fila.
- [ ] El número de consultas no es estrictamente constante (DD-9): una por bloque de 5.000 «ID» sin cruzar.
- [ ] Desviaciones de la propuesta, no de la spec: lector y cruce en el servidor (DD-2), cuatro lotes en vez de tres y `DEPLOY.md` al final en vez de dentro del §9 (DD-12).

## 14. Hipótesis — lo que no se pudo comprobar

1. **Hipótesis:** `docs/analisis-tickets/Tickets.csv` está versionado y llega a la integración continua; de eso depende el guardián de la cabecera. Existe en el worktree; no se pudo ejecutar git.
2. Los recuentos de la muestra (640 filas, sin saltos de línea dentro de campos, 50 igual a 53) son de **segunda mano**: aquí sólo se leyó la primera línea, para no traer datos de contacto. La cabecera de 59 columnas sí está comprobada.
3. **Hipótesis:** el corte de conexión de supertest con cuerpos de más de 10 MB se repite en esta ruta para `401` y `403`; con administrador no, porque multer consume el cuerpo (así pasa en `apps/desk/server/routes/encuestaRespuestas.test.ts:231-237`).
4. **Hipótesis:** un fichero de cero bytes llega como `req.file` de tamaño 0 y da `vacio`; si llegara ausente daría el `400` de falta de fichero. La prueba sólo afirma el `400`.
5. **Hipótesis:** pg-mem ejecuta `id IN ($1,…)` sobre la clave de texto de `tickets`; el precedente visto es sobre `number`.
6. **Hipótesis:** espiar los métodos del registro en silencio captura lo que el manejador central le pasa. Respaldo: sustituir el módulo del registro con `vi.mock`.
7. **Hipótesis:** el factor ×1,8 sobre la primera cuenta; es la experiencia del proyecto, no una medida de esta tanda.
8. Que «ID de la solicitud» sea `tickets.number` sigue siendo la hipótesis de la propuesta (§4, a): no es clave.
9. Las citas vivas a los ficheros del apartado 12 se barrieron fuera de `openspec/changes/` y de los paquetes de despliegue fechados; el barrido completo es del cierre.
