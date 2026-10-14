# Diseño — El prefijo del código de servicio se deduce y lo impone el servidor (`prefijo-deducido-en-el-alta`, F1B-03, `cierra: si`)

Propuesta: `openspec/changes/prefijo-deducido-en-el-alta/proposal.md`. Delta de spec (manda; no editada):
`openspec/changes/prefijo-deducido-en-el-alta/specs/tickets-core/spec.md`. Decisión que construye:
`decision/prefijo-de-que-se-deduce` (`openspec/config.yaml:4707-4736`). Toda cita es a un fichero leído en este worktree
sobre `968bb53`. Una línea **en blanco** o **prevista** se nombra en prosa, nunca con forma de cita (regla de mutación 4,
quinto guion). Lo no comprobado lleva la palabra «hipótesis». Supera a propósito el tope de 800 palabras de la skill: el
encargo pide ocho apartados cerrados.

## 1. Enfoque técnico

Una sola función pura en `packages/shared/src/ticketCreate.ts`, `prefijoDeducido`, que reconoce las dos clasificaciones con
prefijo propio con los **mismos** predicados que enrutan el grafo (`packages/shared/src/flujos.ts:40-43`, `:116-118`) y el
tipo de servicio por literal exacto. El alta la llama en el sitio exacto donde hoy lee `b.prefijo`
(`apps/desk/server/services/ticketService.ts:82`) y construye siempre código y asunto (`:101-102`). El AAMMDD pasa a ser el
día civil de Bogotá **dentro** de `yymmdd`, sin tocar la firma de `buildCodigoServicio`. El cliente consume la misma función
para una vista previa de sólo lectura. **Todos los ficheros tocados conservan su número de líneas**: ninguna cita se desplaza.

## 2. Decisiones de arquitectura

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| DD-1 | `prefijoDeducido(clasificacion: string \| null \| undefined, tipoServicio: string \| null \| undefined): (typeof PREFIJOS)[number]` en `packages/shared/src/ticketCreate.ts`, **en el sitio** de `defaultPrefijoFor` (`:46-49`), que se retira | Ponerla en `flujos.ts`, que ya tiene `normalizar` | La spec fija el fichero y el rango (RQ-TC-03, RQ-TC-61). `flujos.ts` es un registro de flujos; el código de servicio vive en `ticketCreate.ts` con `PREFIJOS` (`:1`) |
| DD-2 | Importa `esClasificacionEquipoNuevo` y `esClasificacionSoporteRemoto` de `./flujos`; **no** reescribe `normalizar` (`flujos.ts:32-34`, privada) | Exportar `normalizar`; comparar con un literal propio | Dos implementaciones de la misma noción es el molde H5. Con los predicados, prefijo y grafo no pueden divergir, igual que `estadoInicialDelAlta` (`flujos.ts:138-140`) |
| DD-3 | El ciclo `ticketCreate → flujos → ticketCreate` se **acepta** | Romperlo moviendo `CLASIFICACIONES` | `flujos.ts:6` importa `CLASIFICACIONES` sólo para tipos (`:29`, `:113`), así que esbuild la elide; y aunque no la elidiera, ninguno de los dos módulos lee del otro al cargar (sólo al llamar). Hipótesis que la suite confirma en el lote 1: `flujos.test.ts` e `invariantesGrafo.test.ts` cargan los dos |
| DD-4 | Las dos importaciones van en la línea 6 de `ticketCreate.ts`, hoy **en blanco**: `import { diaEnZona } from './fechasDerivadas'; import { esClasificacionEquipoNuevo, esClasificacionSoporteRemoto } from './flujos'` | Insertarlas al principio | Insertar una línea desplaza `:12-14`, `:16-18`, `:26-37`, `:38-44` y `:46-49`, que la spec viva y la delta citan (60 citas `ticketCreate.ts:N` en 25 ficheros). Precedente de dos `import` en una línea: `ticketService.ts:2`. No hay `import/first` en `eslint.config.js:19-32` |
| DD-5 | Los literales de tipo se anclan a la lista: al **final** del fichero, `const TIPO_CALIBRACION: (typeof TIPOS_SERVICIO)[number] = 'Calibración'` y `const TIPO_PROTOCOLO: … = 'Protocolo'`, leídos sólo al llamar | Literales sueltos en la función | Si «Protocolo» sale de `TIPOS_SERVICIO`, rompe `tsc`, no una prueba lejana. Mismo molde que `flujos.ts:29` y `:113`; declarar tras el uso es el patrón de `flujos.ts:108-110` |
| DD-6 | AAMMDD = `diaEnZona(d)` (`packages/shared/src/fechasDerivadas.ts:63`, con `ZONA_NEGOCIO`, `:13`) **dentro de `yymmdd`** (`ticketCreate.ts:7-10`); `buildCodigoServicio` no cambia de firma | Parámetro nuevo `zona`; calcular el día en el servidor y pasarlo como texto | Sólo hay dos llamadores (`ticketService.ts:101`, `CreateTicket.tsx:157`) y los dos quieren Bogotá. Cierra `debt.md:769-771` (M-8). Precedente RQ-TC-58 / `hoyEnZona` |
| DD-7 | `parseCodigoFromPotential` (`ticketCreate.ts:20-24`) se retira y sus **cinco** líneas se sustituyen por un comentario de cinco líneas que dice qué hubo, por qué se fue y en qué revisión está (`968bb53`) | Borrar las cinco líneas y barrer citas | Borrarlas desplaza `extractServiceCode` y `prefijoDeducido`, que la delta cita con los números de hoy. Precedente: los comentarios «al FINAL del fichero para no desplazar las citas» de `ticketService.ts:226-229` |
| DD-8 | El alta **ignora** `prefijo`, `codigoServicio` y `subject` del cuerpo; ninguna guarda nueva | `422` si llegan | S-1/S-2 de la propuesta; RQ-TC-62. La deducción es total: no hay rechazo que añadir |
| DD-9 | `CreateTicketPayload` (`packages/shared/src/types.ts:316`) pierde los tres campos **en sitio**: `:322-323` pasan a `ordenVenta` y `prioridad`, `:324-326` a un comentario de tres líneas | Borrar las tres líneas | Mismo recuento; y con los campos fuera del tipo, volver a mandarlos desde el cliente es error de `tsc` por propiedad sobrante del literal (`CreateTicket.tsx:226-239`). Hipótesis a confirmar por mutación en el lote 3 |
| DD-10 | Pruebas nuevas del alta en fichero **nuevo**, `apps/desk/server/services/prefijoDeducidoAlta.test.ts`; en `ticketService.test.ts` sólo se reescriben en sitio las aserciones que nombran «prefijo» | Añadirlas a `ticketService.test.ts` | Ese fichero está citado por línea (`services/ticketService.test.ts:273` en la spec viva); añadir en medio lo desplaza |
| DD-11 | El día del alta en las pruebas de servidor se fija con `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime`, y el código guardado se lee con `SELECT codigo_servicio, subject FROM tickets` | Leer de `rowToTicketDetail` | El detalle no expone `codigo_servicio` (`packages/zoho-sync/src/db/mappers.ts:199` sólo da `title`); sólo se falsifica `Date` para no tocar los temporizadores de pg-mem |

## 3. Cambios línea a línea — `packages/shared`

**`packages/shared/src/ticketCreate.ts`** (recuento: 49 líneas hoy; quedan 49 + 3 añadidas al final = 52; ninguna existente se mueve).

| Línea(s) | Hoy | Después |
|---|---|---|
| `:2-3` | comentario de «Reparación» | mismo comentario, dos líneas, que añade «Protocolo» (de él se deduce `PRO`, RQ-TC-61) |
| `:4` | siete tipos | ocho: `…'Reparación', 'Protocolo', 'No aplica', 'Otro'` |
| la línea 6 (en blanco) | — | las dos importaciones de DD-4 |
| `:8-9` | getters locales | `const dia = diaEnZona(d) ?? ''` y `return dia.slice(2).replace(/-/g, '')`; una fecha inválida da segmento vacío, que `:13` ya filtra |
| `:20-24` | `parseCodigoFromPotential` | comentario de cinco líneas (DD-7) |
| `:46-49` | `defaultPrefijoFor` | doc de una línea; firma de DD-1; cuerpo de una línea: `esClasificacionEquipoNuevo(c) ? 'HV' : esClasificacionSoporteRemoto(c) ? 'SR' : t === TIPO_CALIBRACION ? 'CG' : t === TIPO_PROTOCOLO ? 'PRO' : 'MT'`; `}` |
| al final | — | comentario de una línea y las dos constantes de DD-5 |

**`packages/shared/src/types.ts:322-326`**: DD-9, sin cambio de recuento.

**Consumidores de lo que se retira — lista cerrada** (`grep` de `defaultPrefijoFor|parseCodigoFromPotential` sobre `apps` y
`packages`): `defaultPrefijoFor` → `CreateTicket.tsx:3`, `:415`, `ticketCreate.test.ts:2`, `:4-12`. `parseCodigoFromPotential`
→ `CreateTicket.tsx:3`, `:172`, `ticketCreate.test.ts:2`, `:36-45`. Ningún guardián recorre las exportaciones de `shared`
(`packages/shared/src/index.ts:9` es un `export *`, sin lista); fuera del código sólo los nombran documentos (`debt.md`,
`docs/sdd`, `openspec`), que son históricos.

## 4. Cambios línea a línea — `apps/desk/server/services/ticketService.ts` (recuento: ±0)

| Línea | Hoy | Después |
|---|---|---|
| `:6` | importa `PREFIJOS` | importa `prefijoDeducido` en su lugar; misma línea |
| `:82` | `const prefijo = b.prefijo ? String(b.prefijo) : ''` | `const prefijo = prefijoDeducido(clasificaciones, tipoServicio) // RQ-TC-61; b.prefijo se ignora (RQ-TC-62)` |
| `:87` | `missing.push('prefijo')` si falta o no está en `PREFIJOS` | comentario de una línea: «prefijo» ya no es obligatorio, se deduce en la línea 82 |
| `:101` | `b.codigoServicio ? … : buildCodigoServicio(…)` | `buildCodigoServicio({ prefijo, serie: equipo.serial, modelo: equipo.modelo ?? '', fecha: new Date() })` siempre |
| `:102` | `b.subject ? … : buildSubject(…)` | `buildSubject({ … codigo: codigoServicio })` siempre |

La deducción queda en el escalón C, tras equipo↔cliente (`:61-79`) y antes de los obligatorios (`:83-88`); como no lanza, la
escalera A < B < C < D de RQ-TC-05 no cambia (§8, M-10).

**Barrido de la regla de mutación 4 al cierre.** No se mueve ninguna línea, pero cinco **cambian lo que dicen**, y la
regla obliga a leer qué afirma cada cita. Comandos:

    git grep -nE "ticketService\.ts:(6|82|87|101|102)\b|ticketService\.ts:[0-9]+-(8[2-9]|9[0-9]|10[0-2])\b"
    git grep -nE "ticketCreate\.ts:([2-9]|10|2[0-4]|4[6-9])\b|ticketCreate\.ts:[0-9]+-([2-9]|10|2[0-4]|4[6-9])\b"
    git grep -nE "types\.ts:3(1[6-9]|2[0-9])\b"
    git grep -nE "CreateTicket\.tsx:[0-9]+"

Y un segundo pase de la forma abreviada en los ficheros que ya citan estos módulos. Medido hoy: 53 citas a
`ticketService.ts:82|87|101|102` o rangos que las cubren, en 33 ficheros (casi todos archivados, caso B); `ticketCreate.ts`
en esas líneas: `openspec/config.yaml:4714`, `:4726`, `openspec/specs/tickets-core/spec.md:564`, `:1463`, `:2371`,
`docs/sdd/ENTRADA.md:296`, `docs/sdd/F0-00_Baseline_as-built.md:314`. Las que describen la línea **como era** son caso B y
se anclan a `968bb53`; `debt.md:765-771` (M-7, M-8) es caso C, cerrado por este cambio.

## 5. Cliente — `apps/desk/src/components/CreateTicket.tsx` (recuento: ±0; `.tsx`, fuera de la red, F0-00)

| Línea(s) | Cambio |
|---|---|
| `:3` | fuera `PREFIJOS`, `parseCodigoFromPotential`, `defaultPrefijoFor`; entra `prefijoDeducido` |
| `:46` | `const prefijo = prefijoDeducido(clasificaciones, tipoServicio)` (las dos se declaran en `:44-45`) |
| `:83-84` | los estados `subjectOverride`/`codigoOverride` se van; dos líneas de comentario (RQ-TC-62) |
| `:154-156` | comentario reescrito: vista previa, el servidor construye (RQ-TC-63) |
| `:157`, `:161-162` | sin `codigoOverride`/`subjectOverride` (también fuera de las dependencias del `useMemo`) |
| `:172-173` | dos líneas de comentario: la oportunidad de CRM ya no fija el prefijo (S-3) |
| `:230`, `:232` | fuera `prefijo`, `subject` y `codigoServicio: codigo` del cuerpo |
| `:415` | `onChange` sólo `setTipoServicio` |
| `:423-425` | el `select` se sustituye por un `span` de tres líneas, «Prefijo: {prefijo} · lo deduce el sistema», mismo molde que `:426-428` |
| `:434`, `:436` | `readOnly`, sin `onChange`, con fondo `bg-slate-50` |

**Regla de mutación 3, decisión a decisión** (las que este cambio toca en el alta):

| Decisión del cliente | Tipo | Línea del servidor que la impone | Prueba `.ts` |
|---|---|---|---|
| Prefijo mostrado | rellena solo | `ticketService.ts:82` (pasa a deducir) | RQ-TC-61 en `ticketCreate.test.ts` y `prefijoDeducidoAlta.test.ts` |
| Código mostrado | rellena solo | `:101` (construye siempre) | RQ-TC-61 «el alta guarda el código…», RQ-TC-62 |
| Asunto mostrado | rellena solo | `:102` | RQ-TC-62 «el asunto del cuerpo se ignora» |
| Código y asunto no editables | bloquea | `:101-102` dejan de leer `b` | RQ-TC-62 |
| Ya no manda los tres campos | — | el alta los ignora si llegan (cliente viejo) | RQ-TC-62 «un cliente con los tres campos viejos crea igual» |
| Lista de tipos (con «Protocolo») | bloquea | **ninguna**: `:85` acepta cualquier texto no vacío | ninguna — carencia preexistente, fuera de alcance (`debt.md:765-768`), se declara |
| Lista de clasificaciones | bloquea | **ninguna**: `:86` | ídem |

Las dos últimas son guardas que viven sólo en el cliente; la regla 13, punto 2, se cumple **declarándolas**, no
cerrándolas: cerrarlas sería un `422` nuevo que la propuesta deja fuera.

## 6. «Protocolo» en `TIPOS_SERVICIO` — lista cerrada de quien la enumera o la lee

| Consumidor | ¿Cambia? |
|---|---|
| `packages/shared/src/ticketCreate.ts:4` | Sí: se añade |
| `apps/desk/src/components/CreateTicket.tsx:417` (desplegable) | No: aparece solo |
| `packages/shared/src/ticketCreate.test.ts:14-19` | Sí: aserción nueva de orden exacto de ocho; `:17-18` siguen valiendo |
| `packages/shared/src/ordenOVI.ts:13-14`, `ordenOVI.test.ts:69-71` | No: sólo exigen «Garantía» |
| `apps/desk/server/db/remisionesHistoricasSeed.ts:13-15` | No: comentario; el histórico no se fuerza a la lista |
| Remisión: `apps/desk/server/routes/remision.ts:65`, `:247`; `CrearRemision.tsx:215` | No: heredan el texto, sólo lectura |
| `apps/desk/server/remisionWebhook.ts:9`, `:44` | No en código; n8n NO se toca y recibe «Protocolo» como texto (hipótesis heredada de la propuesta §5) |
| `apps/desk/server/analisis.ts:29`, `packages/shared/src/analisis.ts` | No: agrupan por texto |
| `packages/shared/src/contratos.ts`, `apps/desk/server/services/guardasOVI.ts` | No: no enumeran la lista |

Ninguna prueba del servidor fija `codigo_servicio` ni `subject` de un alta (`grep` de códigos `XX_…_` y de `.subject` en
`apps/desk/server/**/*.test.ts`): las que mandan `prefijo: 'CG'` con «Equipo nuevo» (`tickets.test.ts:350`, `:363`,
`remisiones.test.ts:831`) o con «Soporte remoto» (`flujoSoporteRemoto.test.ts:131`) seguirán en verde.

## 7. Pruebas que cambian y que nacen

- `ticketCreate.test.ts:24-25` **se pone roja sola** con DD-6: `new Date(2026, 5, 4)` es medianoche **local**, y con
  `process.env.TZ = 'UTC'` (`vitest.config.ts:7`) eso es el 3 de junio en Bogotá. Es el RED natural de S-4; se reescribe con
  un instante explícito (`2026-06-04T12:00:00-05:00`).
- `ticketCreate.test.ts:4-12` (`defaultPrefijoFor`) → `describe('prefijoDeducido')` con los escenarios de RQ-TC-61; `:36-45`
  (`parseCodigoFromPotential`) se borra en el lote 3. AAMMDD: `20:00-05:00` y `00:30-05:00` dan `261014`, en `TZ=UTC` y con
  `process.env.TZ = 'America/Bogota'` restaurado en `finally` (hipótesis: Node relee `TZ` en caliente; si no, basta `UTC`).
- `ticketService.test.ts`: `:278`, `:353`, `:367`, `:428` pierden «, prefijo»; `:281-286` se invierte en sitio (seis
  líneas): prefijo `'XXX'` → crea, código `MT_…`. `:252` conserva `prefijo: 'MT'` (cuerpo viejo, se ignora).
- `prefijoDeducidoAlta.test.ts` (nuevo): RQ-TC-61 del alta (cuatro ramas, `PRO_S1_M1_261014`, día de Bogotá), RQ-TC-62
  completo y las pruebas de posición de M-10.

## 8. Plan de mutaciones (reglas 1 y 3)

| # | Mutación | Debe ponerse roja |
|---|---|---|
| M-1..M-5 | Cambiar el prefijo de cada fila (HV, SR, CG, PRO, MT) | el escenario de esa fila en `ticketCreate.test.ts` y su alta en `prefijoDeducidoAlta.test.ts` |
| M-6 | Evaluar el tipo antes que la clasificación | «la clasificación gana al tipo» |
| M-7 | Sustituir los predicados por `=== 'Equipo nuevo'` | «mismos predicados que el grafo» (` Equipo   Nuevo `) |
| M-8 | Plegar caja/tilde del tipo | «literal exacto» (`calibracion` → `MT`) |
| M-9 | `yymmdd` con getters locales (o `new Date()` sin zona) | AAMMDD de las `20:00-05:00` en `ticketCreate.test.ts` y en el alta |
| M-10 | `:82` vuelve a leer `b.prefijo` | «el prefijo del cuerpo se ignora», «cliente viejo crea igual» |
| M-11 | `:101` vuelve a leer `b.codigoServicio` | «el código del cuerpo se ignora» |
| M-12 | `:102` vuelve a leer `b.subject` | «el asunto del cuerpo se ignora» |
| M-13 | `:87` vuelve a empujar «prefijo» si falta en el cuerpo | `422` exacto sin «prefijo»; `:281-286` |
| M-14 | Quitar «Protocolo» de `:4` | `tsc` (DD-5) y el orden exacto de ocho |
| M-15 | «Protocolo» tras los comodines | orden exacto y `ticketCreate.test.ts:18` |
| M-16 | Devolver `prefijo` al literal de `createTicket` en el cliente | `npm run typecheck` (DD-9) |

**Regla 1, posición.** Mover la llamada a `prefijoDeducido` antes de cualquier guarda (p. ej. antes de `:24`) es un
**mutante equivalente**: pura, total, sin `throw`. Se ejecuta igual y se anota que sigue verde, que es el resultado esperado
y la prueba de que la posición no importa. La posición que sí hay que fijar es que **no existe guarda del prefijo** en
ningún escalón: M-17 inserta `if (b.prefijo && !PREFIJOS.includes(b.prefijo)) throw 422` en tres sitios —antes de
equipo↔cliente, entre obligatorios y cliente, y antes del `409`— y la caza una prueba que activa dos cosas a la vez:
(a) `prefijo: 'XX'` + equipo↔cliente discrepante → el `422` de equipo↔cliente; (b) `prefijo: 'XX'` + obligatorios que
faltan → el `422` exacto sin «prefijo»; (c) `prefijo: 'XX'` + OV ya asociada, resto válido → `409`.

## 9. Lotes de apply (×1,8 sobre la ingenua; techo 800, válvula 720; sin migración)

| Lote | Contenido | Ingenua | ×1,8 | Depende de |
|---|---|---|---|---|
| 1 · `shared` | DD-1..DD-6, `:2-4`, línea 6, `:8-9`, `:46-49`, final; `CreateTicket.tsx:3` y `:415` mínimos para que compile (`setPrefijo(prefijoDeducido(clasificaciones, e.target.value))`); pruebas de §7 de `ticketCreate.test.ts` | 130 | ~235 | — |
| 2 · Servidor | `ticketService.ts` (5 líneas), `ticketService.test.ts` en sitio, `prefijoDeducidoAlta.test.ts` | 175 | ~315 | 1 |
| 3 · Cliente y retiradas | §5 completo, DD-7, DD-9, `ticketCreate.test.ts:36-45`, corrección en `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (M1.1 `R08.4.md:1170`, Anexo G col. 27) | 85 | ~155 | 1, 2 |

Total ~705 más el `apply-progress.md` (~100): **no cabe holgado en un intento**. Dos intentos: A = lotes 1+2 (~550 +
informe), B = lote 3 (~155 + informe). Cada lote cierra con `npm test`, `npm run typecheck` y `npm run lint` en verde; el
techo de avisos de lint del CI no tiene holgura (`eslint.config.js:14-15`), así que ningún lote puede añadir uno.

## 10. Riesgos y supuestos heredados

| # | Supuesto / riesgo | Estado en el diseño |
|---|---|---|
| S-1 | Ignorar, no rechazar | DD-8 |
| S-2 | Asunto no editable | §5, `:436` `readOnly` |
| S-3 | La oportunidad de CRM no fija el prefijo | DD-7; `potentialName` se queda en el tipo, sin lector |
| S-4 | AAMMDD de Bogotá | DD-6; RED natural en `ticketCreate.test.ts:24` |
| S-5 | Clasificación desconocida → mantenimiento; caja y espacios plegados por `normalizar` (`flujos.ts:32-34`) | DD-2. **Divergencia preexistente**: la guarda 1 del alta compara con literal (`ticketService.ts:24-25`) y el cliente también (`CreateTicket.tsx:55`). Con `equipo nuevo` en minúsculas y equipo existente, el prefijo es `HV` y el flujo `equipo-nuevo` (`flujos.ts:57`), coherentes entre sí; la guarda 1 no se toca |
| S-6 | Tipo por literal exacto | DD-5 |
| S-7 | «Protocolo» sexto | §3, `:4` |
| R-1 | Ciclo de importación `ticketCreate ↔ flujos` | DD-3, hipótesis que confirma el lote 1 |
| R-2 | «Ingreso a Servicio» reescribe el código (`packages/shared/src/transitions.ts:191`) | Fuera de alcance (H-1 de la propuesta) |
| R-3 | Pestañas con el cliente viejo | RQ-TC-62: crean con el prefijo deducido |

## Threat Matrix

N/A — sin enrutado, shell, subprocesos, automatización de VCS/PR, clasificación de ejecutables ni integración de procesos.

## Migración

Ninguna: ni esquema ni datos. Los códigos guardados no se recalculan (consecuencia 4).
