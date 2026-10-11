# Diseño: la tarjeta de «Remisión creada» muestra el tiempo en el estado, en días hábiles

## Enfoque técnico
El número lo calcula el **servidor** con una función pura nueva de `packages/shared`, que no cuenta nada por sí misma: reduce dos instantes a día civil con `diaEnZona` (`packages/shared/src/fechasDerivadas.ts:63`) y delega en `diasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:196`). La pantalla sólo pinta el texto que devuelve otra función pura del mismo fichero. **Flujo:** `ticket_transitions` (`entradasActuales`) y `calendario_cierres` (`listarCierres`) → `listaRemisionCreada(db, ahora)` compone `diasHabilesEnEstado` → `GET /api/remision-creada` → `fetchRemisionCreada` → tarjeta, lista y tabla → `textoTiempoEnEstado` → distintivo gris. Sin esquema, sin ruta nueva, sin entrada nueva por HTTP. Todo fichero existente se edita **en sitio o al final**: ninguna línea existente cambia de número. Lo que aquí se dice de tipos, lint y mutaciones es **hipótesis** hasta ejecutarlo en el apply. Alcance y supuestos T1 a T7: los de `proposal.md`, sin reabrir.

## Decisiones
### D-1 · `packages/shared/src/tiempoEnEstado.ts` (nuevo) y su exportación
```ts
/** Días hábiles que un ticket lleva en su estado: los POSTERIORES al día de entrada y hasta hoy inclusive (T1). `null` sin entrada legible (T3). */
export function diasHabilesEnEstado(desde: Date | string | null | undefined, ahora: Date, cierres: ReadonlySet<DiaCivil>): number | null {
  const entrada = diaEnZona(desde), hoy = diaEnZona(ahora)
  return entrada === null || hoy === null ? null : diasHabilesEntre(entrada, hoy, cierres)
}
/** El texto del distintivo (T2, T3). Campo AUSENTE (`undefined`) → `null`: nada que pintar (T5). */
export function textoTiempoEnEstado(dias: number | null | undefined): string | null {
  if (dias === undefined) return null
  if (dias === null) return 'Sin fecha de entrada'
  return dias < 1 ? 'Menos de 1 día hábil' : dias === 1 ? '1 día hábil' : `${dias} días hábiles`
}
```
Importa `diaEnZona` de `./fechasDerivadas` y `diasHabilesEntre` y el tipo `DiaCivil` de `./calendarioLaboral`. **Por qué `diaEnZona`:** ya es la zona fija `ZONA_NEGOCIO` (`packages/shared/src/fechasDerivadas.ts:13`), la misma con la que `horasHabilesEntre` toma el día (`packages/shared/src/calendarioLaboral.ts:176`, `packages/shared/src/calendarioLaboral.ts:178`), y ya devuelve `null` con `undefined`, `null`, texto ilegible y `Date` inválido (`packages/shared/src/fechasDerivadas.ts:64-72`). **Rechazadas:** `toISOString().slice(0, 10)` o los getters UTC —las pruebas corren con `TZ = 'UTC'` (`vitest.config.ts:7`), así que pasaría casi todo y contaría mal entre las 19:00 y la medianoche de Bogotá; es la mutación M3—, y un bucle propio de días, que sería un segundo cálculo y lo prohíbe RQ-CL-11 (`packages/shared/src/calendarioLaboral.ts:6-7`). `ahora` anterior a la entrada da `0` (el bucle de `diasHabilesEntre` no entra): se fija con prueba, no es un error. `dias < 1` y no `=== 0`, para que un negativo imposible no dé «-1 días hábiles». **Exportación:** línea 42 nueva al final, `export * from './tiempoEnEstado'` (`packages/shared/src/index.ts:41` es hoy la última). Ninguno de los dos nombres existe hoy en `apps/` ni en `packages/` (búsqueda con 0 resultados): `export *` no colisiona.
### D-2 · `apps/desk/server/db/listaRemisionCreada.ts` (17 líneas; las conserva: seis ediciones en sitio)
- Línea 3: añade `diasHabilesEnEstado` a la importación de `@ambientalia/shared`. Línea 5: añade al final `; import { listarCierres } from './calendarioCierres'`.
- Línea 9: «Dos lecturas fijas» pasa a «Lecturas fijas» y la frase nombra también los cierres del calendario (el recuento ya era inexacto: `marcasDeGarantia` lee aparte).
- Línea 13: `export async function listaRemisionCreada(db: Queryable, ahora: Date = new Date()): Promise<Array<Ticket & { enEstadoDesde: string | null }>> {` — molde: `apps/desk/server/services/alarmasSla.ts:141`. El tipo de retorno no cambia: el campo ya está en `Ticket` (D-3).
- Línea 15: añade al final `; const cierres = new Set(await listarCierres(db))`, la misma lectura y la misma forma que la alarma (`apps/desk/server/db/sla.ts:46`). `listarCierres` (`apps/desk/server/db/calendarioCierres.ts:31`) es **una** consulta y va fuera del `map`; incondicional, también con la lista vacía, para que el número de consultas no dependa de los datos.
- Línea 16: el objeto compuesto gana `diasHabilesEnEstado: diasHabilesEnEstado(entradas.get(String(row.id)), ahora, cierres)`. Se pasa el `Date` de `entradasActuales` (`apps/desk/server/db/sla.ts:78`), no el texto ISO: el mismo instante que `enEstadoDesde`, sin volver a interpretarlo.

**`ahora` por HTTP: no se inyecta.** `apps/desk/server/routes/prioridad.ts:92-93` no se edita: sigue llamando `listaRemisionCreada(db)`.

| Opción | Contrapartida | Decisión |
|---|---|---|
| Parámetro por defecto en la función; la ruta no lo pasa | El número exacto se prueba llamando a la función; la ruta sólo fija presencia, tipo y `null` | **Elegida** |
| `?hoy=` en la ruta | Dejaría al cliente decidir la fecha del cálculo: contradice la regla invariable 13 | Rechazada |
| `vi.setSystemTime` en la prueba de ruta | Relojes falsos con supertest y pg-mem: no medido en este repositorio | Rechazada; alternativa si el verify pidiera el número exacto por HTTP |
### D-3 · `packages/shared/src/types.ts:37`, en sitio
Se inserta `diasHabilesEnEstado?: number | null; ` tras `esperandoAprobacionCliente?: boolean; ` y antes de `garantia?:`; el comentario final de la línea pasa a `(RQ-VT-07, F1B-18, RQ-VT-16)`. Opcional **y** anulable a propósito: ausente = la ruta no lo calcula (T5); `null` = lo calculó y no hay entrada (T3).
### D-4 · `apps/desk/src/components/DistintivoTiempoEnEstado.tsx` (nuevo) y sus tres enganches
```tsx
/** Tiempo en el estado, en días hábiles (F1B-07, RQ-VT-16). Sólo pinta: el número viene del servidor y el texto de `shared`. Gris siempre (T4): informa, no alarma. */
export function DistintivoTiempoEnEstado({ dias }: { dias?: number | null }) {
  const texto = textoTiempoEnEstado(dias)
  if (!texto) return null
  return <span className="shrink-0 font-bold rounded border whitespace-nowrap text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 border-slate-300">{texto}</span>
}
```
Importa `textoTiempoEnEstado` de `@ambientalia/shared`. **Clases:** estructura y tamaño `sm` de `apps/desk/src/components/DistintivoGarantia.tsx:8-9`; el gris es el de «Garantía sin dato» (`apps/desk/src/lib/distintivoGarantia.ts:15`). Una sola clase de color, constante: el componente **no ramifica por el valor**; sin ámbar ni rojo. Sin `title` ni `tamano`: nadie los pide. **Enganches, todos dentro de líneas que ya existen.** Importación: se añade `; import { DistintivoTiempoEnEstado } from './DistintivoTiempoEnEstado'` al final de `apps/desk/src/components/TicketCard.tsx:4`, `apps/desk/src/components/TicketList.tsx:3` y `apps/desk/src/components/TicketTable.tsx:3`. Uso: en `apps/desk/src/components/TicketCard.tsx:103`, tras `<DistintivoGarantia estado={ticket.garantia} />`, va `<DistintivoTiempoEnEstado dias={ticket.diasHabilesEnEstado} />`; en `apps/desk/src/components/TicketList.tsx:29`, entre el distintivo de garantía y `<StatusBadge … />`, va `<DistintivoTiempoEnEstado dias={t.diasHabilesEnEstado} />`; en `apps/desk/src/components/TicketTable.tsx:34`, lo mismo tras el de garantía y un espacio, antes de `</td>`. En la tarjeta el `span` es hijo directo de un contenedor en columna (`apps/desk/src/components/TicketCard.tsx:32`), como ya lo es el de garantía: cómo se ve es verificación manual. `apps/desk/src/api/client.ts:806-808` no se toca: ya devuelve `Ticket[]` tal cual.
### D-5 · Regla invariable 13 y regla de mutación 3 — decisión del cliente → línea del servidor
El cliente **no bloquea, no rellena y no avisa** nada. **Regla de mutación 1:** no hay guarda nueva que reordenar; el único orden con efecto es `undefined` frente a `null` en el texto (M10). **Regla de mutación 2:** no aplica, ningún guardián lee un fichero de datos.

| Decisión que se ve en la pantalla | La toma | Línea que la impone | Prueba |
|---|---|---|---|
| Qué número se enseña | Servidor | `apps/desk/server/db/listaRemisionCreada.ts:16` tras D-2; la cuenta, `packages/shared/src/calendarioLaboral.ts:196` | RC-13, RC-14 |
| Qué día es hábil | Servidor | `packages/shared/src/calendarioLaboral.ts:139`, con los cierres de `apps/desk/server/db/calendarioCierres.ts:31` | RC-13 |
| En qué vistas aparece (T5) | Servidor | el campo sólo lo compone `apps/desk/server/db/listaRemisionCreada.ts:16`; `apps/desk/server/routes/tickets.ts:114-115` y `apps/desk/server/routes/prioridad.ts:85` no lo componen | RC-17 |
| «Sin fecha de entrada» | Servidor | `null` explícito desde `apps/desk/server/db/listaRemisionCreada.ts:16` | RC-15 |
| El texto de cada número | Función pura de `shared` que el cliente ejecuta | `packages/shared/src/tiempoEnEstado.ts` (D-1). Es presentación, no dominio: el servidor no la impone ni hace falta | T-8 |
| El orden | Servidor | `apps/desk/server/db/listaRemisionCreada.ts:16` (`ordenarPorEntrada`, `packages/shared/src/listaPorEntrada.ts:10`) | RC-1 a RC-6, sin tocar |
| El color | Nadie: constante del `.tsx` | — | Manual |
### D-6 · Regla de mutación 4 — ninguna línea citada se desplaza
Barrido hecho en el worktree por nombre completo de fichero y número de línea, sin `node_modules`. **Segundo pase (abreviadas y prosa):** como ningún número cambia, una cita abreviada tampoco puede desfasarse. Lo que sí cambia es lo que **dicen** dos líneas de `apps/desk/server/db/listaRemisionCreada.ts`: la 9 (el recuento de lecturas, que sólo cita esta propuesta) y la 16 (gana un campo; las citas la describen como la que compone y ordena, y lo sigue siendo). `openspec/specs/vistas-tablero/spec.md:814` nombra los tres `.tsx` sin línea y habla del distintivo de garantía: no pasa a ser falso. **Si en el apply alguna línea tuviera que crecer, se dice y se barre antes de cerrar.**

| Fichero editado | Edición | Citas que lo apuntan | ¿Hay que reapuntar? |
|---|---|---|---|
| `apps/desk/server/db/listaRemisionCreada.ts` | En sitio (3, 5, 9, 13, 15, 16) | Líneas 13 y 16: `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:866` y `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:925`. Líneas 5, 13, 14 y 15: sólo artefactos archivados de `2026-10-04-propagar-top5-lista-remision-creada` y `2026-10-10-aviso-en-garantia`. Vivas: ninguna fuera de este cambio | No. Caso B, ciertas de su fecha; y 13 sigue siendo la firma, 15 las entradas y las garantías, 16 la composición |
| `packages/shared/src/types.ts` | En sitio (37) | A la 37: `design.md` de `2026-09-29-alarmas-horas-habiles` y `tasks.md` de `2026-10-10-aviso-en-garantia` (archivados). Por debajo, vivas: `openspec/specs/tickets-core/spec.md:1466` (329 a 350), `openspec/specs/remisiones/spec.md:665` (492), `openspec/config.yaml:168`, `openspec/config.yaml:1066`, `openspec/config.yaml:2064` y `docs/sdd/ENTRADA.md:965` (224 y 239) | No: el fichero conserva sus líneas, y la 37 sigue siendo la de las marcas de vista calculadas por el servidor |
| `packages/shared/src/index.ts` | Al final (línea 42 nueva) | La más alta citada es la 39 (archivo `2026-10-08-mapa-blueprint-tres-flujos`) | No |
| `apps/desk/src/components/TicketCard.tsx` | En sitio (4, 103) | Vivas, todas por encima de la 103 y ninguna en la 4: líneas 2 y 14 a 23 desde `CLAUDE.md:347`, `CLAUDE.md:384`, `openspec/specs/vistas-tablero/spec.md:134`, `openspec/specs/vistas-tablero/spec.md:227`, `openspec/specs/vistas-tablero/spec.md:229`, `openspec/config.yaml:650`, `openspec/config.yaml:936` y `apps/desk/src/components/ClienteDetalle.tsx:29`. A la 103: sólo el archivo de `aviso-en-garantia` | No. La 103 sigue pintando la garantía |
| `apps/desk/src/components/TicketList.tsx`, `apps/desk/src/components/TicketTable.tsx` | En sitio (3 y 29; 3 y 34) | `docs/sdd/F0-00_Baseline_as-built.md:137`, `docs/sdd/F0-00_Baseline_as-built.md:141` y `docs/sdd/F0-00_Baseline_as-built.md:143` (líneas 10, 15, 35 y 43) y el archivo de `aviso-en-garantia` (29 y 34) | No |
| `apps/desk/server/listaRemisionCreada.test.ts` | En sitio (7) y al final (tras la 148) | Líneas 39 a 141, sólo desde el `verify-report.md` de `2026-10-04-propagar-top5-lista-remision-creada` | No |
### D-7 · Pruebas (`strict_tdd`: el rojo se anota antes del producto)
**`packages/shared/src/tiempoEnEstado.test.ts` (nuevo; nace rojo entero: el módulo no existe).** Instantes con desplazamiento explícito; `SIN = new Set<string>()`. T-9 enfrenta los dos relojes (molde H5): el mismo «3» convive con la alarma callada y con la alarma vencida, porque una mide horas (`packages/shared/src/sla.ts:34`, `packages/shared/src/sla.ts:52-55`) y el otro días civiles; nace rojo por el módulo y después caracteriza la divergencia declarada.

| Caso | Entrada → `ahora` (cierres) | Espera |
|---|---|---|
| T-1 · el día de entrada no cuenta | `2026-03-05T10:00:00-05:00` → `2026-03-05T16:00:00-05:00` | `0` |
| T-2 · entre semana | martes `2026-03-03` → jueves `2026-03-05`, mediodía de Bogotá | `2` |
| T-3 · fin de semana | viernes `2026-03-06` → lunes `2026-03-09` | `1` |
| T-4 · festivo | viernes `2026-03-20` → martes `2026-03-24` (el lunes 23 es festivo) | `1` |
| T-5 · cierre | lunes `2026-03-09` → jueves `2026-03-12`, con `2026-03-11` | `2`; con `SIN`, `3` |
| T-6 · zona, por el lado de la entrada y por el de hoy | `2026-03-10T02:00:00Z` → `2026-03-10T17:00:00Z`; y `2026-03-09T17:00:00Z` → `2026-03-11T02:00:00Z` | `1` y `1` |
| T-7 · sin entrada legible; y `ahora` anterior | `null`, `undefined`, `'no es fecha'`, `new Date(NaN)`; y entrada posterior a `ahora` | `null` las cuatro; `0` |
| T-8 · textos | `0`, `1`, `2`, `3`, `null`, `undefined` | «Menos de 1 día hábil», «1 día hábil», «2 días hábiles», «3 días hábiles», «Sin fecha de entrada», `null` |
| T-9 · **los dos relojes** | (a) lunes `2026-03-02T16:00:00-05:00` → jueves `2026-03-05T09:00:00-05:00`; (b) lunes `2026-03-02T08:00:00-05:00` → jueves `2026-03-05T08:01:00-05:00` | (a) distintivo `3`, `horasHabilesEntre` `20`, `slaVencido('Remisión creada', …)` `false`; (b) distintivo `3`, `slaVencido` `true` |

**`apps/desk/server/listaRemisionCreada.test.ts`.** Línea 7, en sitio: se añade `; import { listaRemisionCreada } from './db/listaRemisionCreada'`. Tras la línea 148, un `describe` nuevo, «el tiempo en el estado (RQ-VT-16)»; cierres sembrados con el `INSERT` de `apps/desk/server/db/sla.test.ts:233`. RC-1 a RC-12 no se tocan y RC-11 (`apps/desk/server/listaRemisionCreada.test.ts:118`) debe seguir verde. Cómo se siembra la derivación de RC-17 se toma de las pruebas existentes de «Mis tickets»: **hipótesis** hasta el apply. Capas: unitaria pura, servidor sobre pg-mem y ruta con supertest; sin E2E; los `.tsx`, verificación manual.

| Caso | Preparación | Aserción | Nace |
|---|---|---|---|
| RC-13 · festivo y cierre | cierre `2026-03-11`; `c` entra `2026-03-09T15:00:00Z`, `f` entra `2026-03-20T15:00:00Z`; `listaRemisionCreada(db, new Date('2026-03-24T17:00:00Z'))` | ids `['c', 'f']`; números `[9, 1]` (sin el cierre serían 10 y 1) | **Rojo: `undefined`** |
| RC-14 · zona | `z` entra `2026-03-10T02:00:00Z`; `ahora` `2026-03-10T17:00:00Z` | `1` | **Rojo** |
| RC-15 · sin entrada | `s` sin fila y `x` con ella; `ahora` fijo | `s` va el último, con `toBeNull()` estricto y la clave presente | **Rojo** |
| RC-16 · la ruta | `GET /api/remision-creada`: uno con entrada `2026-01-05T15:00:00Z` y orden de venta, y otro sin entrada ni orden | todos tienen la clave; el primero, entero ≥ 1; el segundo, `null` | **Rojo** |
| RC-17 · los demás listados | `GET /api/tickets` y `GET /api/mis-tickets` con la misma siembra y un ticket derivado al usuario | longitud > 0 en los dos y ningún elemento con la clave | Verde (caracteriza; su rojo es M6) |
| RC-18 · una sola lectura de cierres | espía de consultas (molde `apps/desk/server/db/sla.test.ts:244-247`) con 3 y con 6 tickets | las que nombran `calendario_cierres`: 1 y 1 | **Rojo: 0** |
### D-8 · Mutaciones del apply (se restaura siempre; resultado anotado prueba a prueba) — HIPÓTESIS
Las siete pedidas son M1 a M6 y M9; M7, M8 y M10 se añaden. T-9 no fija una guarda: enfrenta dos implementaciones, que es lo que ninguna regla de mutación caza.

| Mutación | Prueba que debe ponerse roja |
|---|---|
| **M1** contar el día de entrada (`diasHabilesEntre(sumarDias(entrada, -1), hoy, cierres)`) | T-1 (da 1), T-2, T-3; RC-13 |
| **M2** ignorar los cierres: `new Set()` en la línea 15 del servidor | RC-13 (10 en vez de 9); y en la función pura, T-5 |
| **M3** UTC en vez de la zona: en la entrada / en `ahora` | T-6, primera mitad, y RC-14 (dan 0) / T-6, segunda mitad (da 2) |
| **M4** `0` en vez de `null` sin fecha | T-7; RC-15; RC-16 |
| **M5** filtrar el campo fuera de la respuesta (quitarlo de la línea 16) | RC-13 a RC-16 |
| **M6** añadir el campo al listado de activos (`apps/desk/server/routes/tickets.ts:115`) y a «Mis tickets» (`apps/desk/server/routes/prioridad.ts:85`) | RC-17, cada mitad por separado |
| **M7** invertir `desde` y `hasta` | T-2 a T-5 (da 0) |
| **M8** leer los cierres dentro del `map` (N+1) | RC-18; RC-11 |
| **M9** cada texto: el del `0`, el del `1`, el plural y el de `null` (cuatro mutaciones) | T-8, una aserción por cada una |
| **M10** `== null` en vez de las dos comparaciones estrictas (el campo ausente pintaría «Sin fecha de entrada» en todas las vistas); y `dias <= 1` en la rama del `0` | T-8: la aserción de `undefined`; la del `1` |

## Estimación, matriz de amenazas, despliegue y preguntas abiertas
**Inserciones + borrados:** `packages/shared/src/tiempoEnEstado.ts`, ~16 nuevas · `packages/shared/src/tiempoEnEstado.test.ts`, ~80 nuevas · `packages/shared/src/index.ts`, 1 · `packages/shared/src/types.ts`, 1 + 1 · `apps/desk/server/db/listaRemisionCreada.ts`, 6 + 6 · `apps/desk/server/listaRemisionCreada.test.ts`, 1 + 1 en sitio y ~70 al final · `apps/desk/src/components/DistintivoTiempoEnEstado.tsx`, ~8 nuevas · los tres `.tsx`, 2 + 2 cada uno. Código y pruebas: unas **205**. Con el `apply-progress.md` que la fase escribe (sumando obligatorio, ~120): unas **325** contra la válvula de 720 y el techo de 800; **no se parte**. Se mide al cerrar con `git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear. La spec viva crece por el final al archivar (el delta tiene 88 líneas): se mide, no se estima.
**Matriz de amenazas:** N/A — no hay shell, subprocesos, automatización de VCS, clasificación de ejecutables ni integración de procesos; no se añade ni se mueve ninguna ruta, sólo gana un campo una respuesta. Sin migración ni interruptor: revertir el commit retira el campo y el distintivo.
- [ ] ¿Pasan `npm run typecheck` y `npm run lint` con las líneas largas de D-2 y D-4? Hipótesis: sí; el molde (`apps/desk/server/db/listaRemisionCreada.ts:15-16`) ya es así.
- [ ] ¿Devuelve pg-mem la fila de `calendario_cierres` en la forma que `comoDiaCivil` normaliza (`apps/desk/server/db/calendarioCierres.ts:18-23`) dentro de este arnés? Hipótesis: sí, como en `apps/desk/server/db/sla.test.ts:229-235`.
- [ ] ¿Cabe el distintivo en la fila densa de la lista y en la celda de estado de la tabla sin romper el ancho? Sólo se ve en la aplicación: verificación manual.
