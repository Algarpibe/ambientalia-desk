# Diseño — `tipo-evento-transicion` (F1C-04)

Lee `proposal.md` (tabla de §3, supuestos S-1 a S-8, mutaciones M1-M5) y las deltas de `transitions-st` (RQ-TS-44,
RQ-TS-45, §3.5 MODIFIED) y de `trazas` (RQ-TZ-21), que son el contrato. Las líneas citadas son de `81c4ba5`.
Sin matriz de amenazas: no hay enrutado, shell, subprocesos ni automatización de VCS.

## D1 · `packages/shared/src/tipoEvento.ts` (nuevo)

```ts
import { transicionPorId } from './flujos'
import { TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA } from './transitions'
export const TIPOS_EVENTO = ['Operativo', 'Decisional', 'Compras / Logístico', 'Administrativo'] as const
export type TipoEvento = (typeof TIPOS_EVENTO)[number]
export function tipoEventoDeTransicion(transitionId: string | null | undefined): TipoEvento | null {
  if (!transitionId) return null
  const paso = [TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA].find((p) => p.id === transitionId)
  return transicionPorId(transitionId)?.tipoEvento ?? paso?.tipoEvento ?? null
}
```

- Molde de la tupla: `MODALIDADES` (`packages/shared/src/flujos.ts:143-144`). La búsqueda en catálogos es `transicionPorId`
  (`flujos.ts:74-80`), que ya recorre `CATALOGO_POR_FLUJO` (`flujos.ts:19-22`): no se escribe un segundo recorrido.
- **Sin ciclo en ejecución.** `flujos.ts` importa `ticketCreate.ts` y `transitions.ts` (`flujos.ts:6-7`); `transitions.ts`
  importa en valor sólo `anulacion` y `facturar` (`transitions.ts:74`), y los dos importan de `transitions.ts` sólo tipos
  (`packages/shared/src/anulacion.ts:1`, `packages/shared/src/facturar.ts:1`). Nadie importa `tipoEvento.ts` salvo el
  barril, el historial y su prueba; `transitions.ts` sólo lo nombra en posición de tipo (D2), que se borra al compilar.
  El ciclo `flujos.ts` ↔ `ticketCreate.ts` ya existe (`packages/shared/src/ticketCreate.ts:6`) y no se toca.
- **Nada se evalúa al cargar** salvo el literal de la tupla: el resolutor lee los catálogos al llamarse, nunca en el
  cuerpo del módulo (sin `Map` precalculado), así que ningún orden de carga puede dar una zona muerta.
- El fichero **no** contiene el texto `transitionById(` ni `transitionsForStatus(`: el guardián (e) busca esos dos
  llamadores en todo fuente que no sea prueba (`packages/shared/src/comentariosVigilados.test.ts:84-90`).
- **Barril:** `export * from './tipoEvento'` como línea nueva **al final** de `packages/shared/src/index.ts`, detrás de
  `:46`. Añadir al final no desplaza ninguna línea; todas las demás exportaciones siguen la misma forma.

Rechazado: el resolutor en `flujos.ts` (crecería un fichero citado y sumaría lógica de tipo al registro de flujos) o en
`transitions.ts` (necesitaría importar `flujos.ts` en valor y cerraría un ciclo real).

## D2 · `transitions.ts` sin insertar ni borrar una sola línea

| Sitio | Cambio, en su misma línea |
|---|---|
| `packages/shared/src/transitions.ts:60` | `area: string; tipoEvento: import('./tipoEvento').TipoEvento` y un comentario final corto que diga que va en esa línea para no desplazar citas |
| 45 entradas | `tipoEvento: '…',` justo detrás de `area: '…',` en la línea donde está el `area` de cada una |
| `transitions.ts:150-151` | `tipoEvento: 'Compras / Logístico'` tras `area`, y el literal cerrado con `satisfies Omit<Transition, 'fields'>` |

**Tipo en línea y no `import type` en `:74`.** Hay molde en el propio fichero (`transitions.ts:52`) y en `types.ts`
(`packages/shared/src/types.ts:759`). Con `import type` delante del comentario final de `:74` funcionaría igual, pero esa
línea ya lleva dos importaciones y un comentario, y una importación con nombre en un programa con `verbatimModuleSyntax`
(`apps/desk/tsconfig.app.json:19`) y `noUnusedLocals` (`apps/desk/tsconfig.app.json:25`) es una pieza más que puede
romperse si alguien le quita el `type`. El tipo en línea no puede convertirse en importación de valor.

**`satisfies Omit<Transition, 'fields'>` en los dos pasos, sin conversión.** Comprueba el valor contra la lista, exige
`tipoEvento` y, por la comprobación de propiedades sobrantes, rechaza que alguien les añada `fields`: refuerza la
regla de que no son botón (`openspec/specs/transitions-st/spec.md:108-111`). Conserva el tipo inferido, así que
`PasoSinBoton[]` (`packages/shared/src/mapaBlueprint.ts:13-19`) los sigue aceptando sin tocar ese tipo. Rechazados:
anotación explícita `: Omit<…>` (cambia el tipo exportado sin necesidad) y `as` (es justo lo que M2 quiere cazar).

**Las 47 líneas.** El interface (`:60`), los dos pasos (`:150`, `:151`), 32 líneas de servicio (33 entradas: `:262`
lleva `anulacion` y `facturar`), 7 de equipo nuevo (`:362` lleva el final de `rechazo_verificacion` y `anulacion_equipo_nuevo`,
que es la entrada que se edita en ella) y 5 de soporte remoto (`:396`, `anulacion_soporte`). `TRANSITIONS` lo hereda por el
`...t` (`transitions.ts:295-298`).

**Guarda.** `wc -l packages/shared/src/transitions.ts` se mide antes de empezar y debe dar lo mismo al terminar, y
`git diff --numstat -- packages/shared/src/transitions.ts` debe dar `47 47`. Siguen en su sitio las dos anclas de texto:
la línea «Campos:» anterior a `export const TRANSITIONS_EQUIPO_NUEVO` (`transitions.ts:348`, guardián (d),
`comentariosVigilados.test.ts:54-65`) y la línea que precede a `export function transitionsForStatus` (`transitions.ts:300`,
guardián (e), `comentariosVigilados.test.ts:67-71`). Ninguna de las dos se edita.

## D3 · La prueba fijada: `packages/shared/src/tipoEvento.test.ts` (nueva)

Un fichero nuevo no desplaza citas. Contiene `TABLA: Record<string, TipoEvento>` con las **47 filas de RQ-TS-44 escritas
a mano**, una por línea, agrupadas por catálogo; **nunca** calculada desde el catálogo. Pruebas:

1. **Catálogo → tabla:** para cada transición de los tres catálogos y los dos pasos, `TABLA[t.id]` es `t.tipoEvento`.
2. **Tabla → resolutor:** para cada fila, `tipoEventoDeTransicion(id)` devuelve su tipo (todo id de la tabla resuelve).
3. **Cardinalidad:** 47 claves en la tabla y 47 ids distintos en catálogos más pasos.
4. **Recuentos, calculados desde el catálogo:** total 21 / 14 / 9 / 3; servicio 14 / 9 / 7 / 3; equipo nuevo
   Operativo 3 y Decisional 4; soporte remoto Operativo 4 y Decisional 1; pasos Compras / Logístico 2.
5. **Barrido en ejecución:** todo `tipoEvento` está en `TIPOS_EVENTO`; y `TIPOS_EVENTO` es exactamente la tupla, en orden.
6. **Un ejemplo por tipo:** `habilitar_servicio`, `aprobacion`, `solicitud_sku`, `facturar`.
7. **RQ-TS-45:** `aprobacion`, `producto_no_conforme`, `ejecutar_soporte`, `remision_retirada` → Decisional, Decisional,
   Operativo, Compras / Logístico; `enviar`, `migracion_f1f01_abiertos`, `migracion_f1c09_pendiente`, `marcar_pendiente`
   → `null`; `null`, `undefined` y `''` → `null`, sin lanzar.

## D4 · Los literales `Transition` de las pruebas, cada uno en su línea

| Literal | Tipo de contexto | Arreglo en la misma línea |
|---|---|---|
| `packages/shared/src/mapaBlueprint.test.ts:200` | `EntradaMapa.transiciones` | `tipoEvento: 'Operativo',` tras `area` |
| `packages/shared/src/mapaBlueprint.test.ts:294` | retorno `Transition` | ídem |
| `packages/shared/src/sla.test.ts:9` (función `:8-11`) | retorno `Transition` | ídem |
| `apps/desk/server/services/avisoArea.test.ts:48` (bloque `:47-49`) | `Transition[]` | ídem |
| `apps/desk/server/transitionExec.test.ts:294` | ninguno (`const` suelto) | `tipoEvento: 'Operativo' as const,`, como el `'checkbox' as const` de esa línea |
| `apps/desk/server/transitionExec.test.ts:303` | ninguno | ídem |

No cambian: `apps/desk/server/transitionExec.test.ts:188-191` (va por `as unknown as` y compila), y
`mapaBlueprint.test.ts:81` y `:94`, que son `PasoSinBoton`, sin `tipoEvento`. El tipo elegido da igual para lo que
prueban; se pone Operativo en los seis. La lista definitiva la da `tsc` en el rojo de D6.

## D5 · El servidor: el historial expone el tipo

- `apps/desk/server/db/historial.ts:3`: `tipoEventoDeTransicion` se añade a la lista de valores importados de
  `@ambientalia/shared`, en esa misma línea.
- `apps/desk/server/db/historial.ts:51`: `eventName: 'AppTransition', tipoEvento: tipoEventoDeTransicion(typeof fila.transition_id === 'string' ? fila.transition_id : null),`.
  Comprobación de tipo en vez de `as string`: un `NULL` de la columna llega como `null` y da `null`. Sólo lee
  `transition_id`, que ya selecciona la consulta (`historial.ts:137`); nunca `fila.values` ni el cuerpo.
- `eventoCreacion` (`historial.ts:25-47`) **no** cambia: la creación no lleva el campo (RQ-TZ-21). Las líneas de
  traspaso (`historial.ts:143`) tampoco.
- `packages/shared/src/types.ts:611`: `HistoryEvent` gana `tipoEvento?: import('./tipoEvento').TipoEvento | null` en la
  misma línea, con el molde de `types.ts:759`; sin tocar la línea de importaciones `types.ts:1`.

**Pruebas existentes que comparan eventos del historial:** ninguna compara un evento de transición entero. Las de título o
`eventName` (`apps/desk/server/db/historial.test.ts:23-26`, `apps/desk/server/tickets.test.ts:118`) y
`apps/desk/server/migracionMarcadorLectores.test.ts:63-68` no miran el campo; `apps/desk/server/db/traspaso.test.ts:166` y
`apps/desk/server/db/remisionRestaurada.test.ts:96` comparan dos lecturas entre sí, y las dos llevan el mismo tipo. No se
adapta ninguna.

**Pruebas nuevas:** `apps/desk/server/db/historialTipoEvento.test.ts`, fichero nuevo con el molde de
`apps/desk/server/db/eventoReasignacion.test.ts:35-49` (pg-mem, `migrate` y filas insertadas a mano). Los cinco
escenarios de RQ-TZ-21. El de «la fila anterior se clasifica igual» compara las dos filas **y** exige Decisional: si sólo
comparara, nacería verde con las dos en `undefined`. «Abrir el historial no escribe» ya lo fijan
`eventoReasignacion.test.ts:84-93` y `traspaso.test.ts:151-154`.

## D6 · Orden TDD y mutaciones

**Línea base, antes de tocar nada:** `npm run typecheck` en verde; `npx tsc -p packages/shared/tsconfig.json --noEmit` con
exactamente los dos errores ajenos que midió la propuesta (`proposal.md` §7, segunda mano: se vuelven a medir aquí);
`wc -l` de `transitions.ts`.

**Lote 1.** (1) `tipoEvento.test.ts` → rojo, sin módulo. (2) `tipoEvento.ts`, la línea del barril y `:60` → la prueba se
pone roja por los valores (`undefined`) y los dos `tsc` dan un error por cada entrada sin tipo y por cada literal de D4:
es la primera mutación M1, natural; se anota el número de errores. (3) Los 47 valores y los seis literales → verde y
`tsc` vuelve a la línea base. **Lote 2.** (1) `historialTipoEvento.test.ts` → rojo (salvo el de la creación, que nace
verde y se valida con M6). (2) `types.ts:611` y `historial.ts:3`, `:51` → verde.

| # | Mutación | Comando que debe ponerse rojo |
|---|---|---|
| M1 | Quitar `tipoEvento` de `aprobacion` (`transitions.ts:202`) y, aparte, de `transitions.ts:150` | `npm run typecheck` y `npx tsc -p packages/shared/tsconfig.json --noEmit` (línea base más uno) |
| M2 | `tipoEvento: 'Logístico'` en una entrada | los mismos dos `tsc` |
| M2b | `'Logístico' as never` | `tsc` en verde y `npx vitest run packages/shared/src/tipoEvento.test.ts` en rojo (barrido) |
| M3 | `aprobacion` de Decisional a Operativo | `npx vitest run packages/shared/src/tipoEvento.test.ts` (tabla y ejemplo) |
| M4 | `historial.ts:51` lee antes `json(fila.values)?.tipoEvento` | `npx vitest run apps/desk/server/db/historialTipoEvento.test.ts` (escenario de `values` falso) |
| M5 | `historial.ts:51` devuelve `null`, o resuelve con `fila.transition_name` | el mismo, escenario de `aprobacion` |
| M6 | `eventoCreacion` con `tipoEvento: null` | el mismo, escenario de la creación |

Cada mutación se hace sobre una copia guardada en el directorio temporal de la sesión, se restaura copiándola y se
comprueba con `git diff --numstat` que el fichero vuelve a sus cifras. Nunca `git checkout` ni `git stash`: borrarían el
trabajo sin confirmar.

**¿`npm run typecheck` ve `transitions.ts`?** Sí, por lectura de configuración: el script es `tsc -b` más
`tsc -p apps/desk/tsconfig.server.json` (`package.json:23`); el segundo incluye `server/**/*.ts`
(`apps/desk/tsconfig.server.json:12`), el servidor importa `@ambientalia/shared` y el paquete exporta su fuente
(`packages/shared/package.json:2`), así que `transitions.ts` entra en el programa como fichero fuente y se comprueba; lo
mismo vale para el cliente, que lo alcanza desde `apps/desk/src/components/TransitionPanel.tsx:2`. Es una **hipótesis** hasta
que M1 lo confirme por ejecución. Lo que **no** ve son las pruebas de `packages/shared/src`, que sólo incluye
`packages/shared/tsconfig.json:1`: por eso los literales de `mapaBlueprint.test.ts`, `sla.test.ts` y la tabla de D3
exigen el segundo `tsc`.

## D7 · Lotes e intentos

Medida: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear; cada línea
editada cuenta dos veces.

| Lote | Contenido | Bruto | ×1,8 |
|---|---|---|---|
| 1 (intento 3) | `transitions.ts` 47 líneas (94), `tipoEvento.ts` ~35, `tipoEvento.test.ts` ~110, barril 1, seis literales (12), `apply-progress.md` ~60 | ~312 | ~560 |
| 2 (intento 4) | `historial.ts` 2 líneas (4), `types.ts` 1 (2), `historialTipoEvento.test.ts` ~70, `apply-progress.md` ~30 | ~106 | ~190 |

Los dos caben bajo la válvula de 720: no se parte ninguno. `types.ts` va en el lote 2 porque sin él `historial.ts:51`
no compila contra `HistoryEvent`.

## D8 · Barrido de la regla de mutación 4 en el cierre

```
grep -rnoE "(transitions|historial|types|flujos)\.ts:[0-9]+(-[0-9]+)?" --include=*.ts --include=*.tsx --include=*.md --include=*.yaml apps packages openspec docs CLAUDE.md
```

Más el segundo pase de abreviadas en los ficheros que citan esos módulos, que es lectura humana. **Ninguna posición se
mueve:** `transitions.ts`, `historial.ts` y `types.ts` sólo cambian líneas en su sitio (inserciones = borrados en
`--numstat`), `flujos.ts` no se toca e `index.ts` sólo crece al final. Lo que cambia es el **contenido** de 50 líneas, y
eso sólo afecta a las frases que enumeran la forma de `Transition`:

| Cita | Afirmación | Caso y tratamiento |
|---|---|---|
| `openspec/specs/transitions-st/spec.md:1137-1142` | «sólo declara `id`, `name`, `from`, `to`, `area`, `fields`» | **C**: la sustituye el §3.5 MODIFIED de la delta al archivar |
| `openspec/specs/transitions-soporte-remoto/spec.md:38-40`, `openspec/specs/transitions-equipo-nuevo/spec.md:24-26` | «la misma forma de `Transition`» con la lista de campos | **A** en lo normativo (siguen tipados `Transition` y `:55-62` sigue siendo el interface); la lista queda incompleta. Estas dos capacidades no están en la cabecera: no se editan aquí; se anotan en el `archive-report.md` y en el texto para Supervisión (la rama no toca `docs/sdd/ENTRADA.md`) |
| `docs/sdd/F0-00_Baseline_as-built.md:71`, `openspec/specs/transitions-st/spec.md:118`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md:505` | forma de su fecha | **B**: registros fechados, no se tocan |
| `packages/shared/src/estados.ts:83`, `packages/shared/src/mapaBlueprint.ts:11-12`, `packages/shared/src/invariantesGrafo.test.ts:111` | `:150-151` son los dos pasos sin `fields` | **A**: sigue siendo cierto, y `satisfies` lo impone |

## D9 · Ni migración, ni interfaz; el paquete del cliente sí crece

Sin migración ni columna (RQ-TZ-21). Ningún `.tsx` cambia y nada de `apps/desk/src` importa `tipoEvento.ts`. **Regla 13:**
el cliente no decide nada con el tipo (tabla de `proposal.md` §6). Pero el catálogo **sí** viaja al cliente:
`TransitionPanel.tsx:56` llama a `transicionesDelTicket`, que arrastra los tres catálogos. **Hipótesis de tamaño:** 45 ×
unos 24 bytes de `tipoEvento:"…",` minificado ≈ 1,1 KB sin comprimir, unos 0,2 KB con gzip; `tipoEvento.ts` y los dos
pasos no los referencia el cliente y deberían quedar fuera por el *tree-shaking*. El apply lo mide con `npm run build`
antes y después (tamaño de `dist/assets/index-*.js`). El nombre del paquete cambia, así que el cliente compilado deja de
coincidir con el que está en producción; el despliegue sigue siendo manual. Cada evento de transición del historial gana
además unos 25 bytes en la respuesta JSON.

## Preguntas abiertas

Ninguna bloquea. La validación de la tabla por Gerencia es tarea de persona (`proposal.md` §10).
