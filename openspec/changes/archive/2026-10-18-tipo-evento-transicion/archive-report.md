# Informe de archivo — `tipo-evento-transicion` (F1C-04, `cierra: si`)

**Qué parte de F1C-04 cubre y qué deja fuera:** cubre la fila entera, «C5 tipo de evento en cada transición»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:102`): las 47 transiciones (33 de servicio, 7 de equipo nuevo,
5 de soporte remoto y los 2 pasos del servidor) llevan un solo tipo de una lista cerrada, y el historial lo expone derivado
del catálogo. Deja fuera, como tareas de persona, el texto del maestro y la lista semanal de supuestos (la validación de Gerencia
llegó el 18/10, `decision/f1c04-tabla-tipos-validada`). El análisis de M7.3 y los Decisionales de F1C-05 son filas propias.

## Qué quedó construido

- **Lista cerrada:** `TIPOS_EVENTO` = Operativo, Decisional, Compras / Logístico, Administrativo, y el tipo `TipoEvento`
  (`packages/shared/src/tipoEvento.ts`, nuevo, exportado al final de `packages/shared/src/index.ts`).
- **Campo obligatorio:** `interface Transition` declara `tipoEvento` en la línea de `area`
  (`packages/shared/src/transitions.ts:60`). Las 45 entradas de los tres catálogos lo llevan en su propia línea, y los dos
  pasos del servidor (`transitions.ts:150-151`) lo llevan comprobado con `satisfies Omit<Transition, 'fields'>`. Una
  transición sin tipo o con uno fuera de la lista no compila (M1, M2).
- **Resolutor:** `tipoEventoDeTransicion(id)` resuelve en los tres catálogos y en los dos pasos, y devuelve `null` para la
  creación, los marcadores de migración, los ids retirados y la ausencia de id (RQ-TS-45).
- **Historial:** cada evento de transición de `getHistorialTicket` lleva `tipoEvento`, derivado de `transition_id`
  (`apps/desk/server/db/historial.ts:51`) y nunca de `values` ni del cuerpo; la creación no lleva el campo. `HistoryEvent`
  lo declara opcional (`packages/shared/src/types.ts:611`). RQ-TZ-21.
- **No se guarda en la traza:** sin columna y sin migración. Las filas anteriores quedan clasificadas igual que las nuevas
  (`R08.4.md:1665`, `:3026`).
- **Sin interfaz:** ningún fichero de `apps/desk/src` cambia; en la aplicación no se ve nada.

**Recuento de la tabla:** servicio Operativo 9 · Decisional 9 · Compras / Logístico 11 · Administrativo 4; las 47,
16 · 14 · 13 · 4, con las cinco correcciones de `decision/f1c04-tabla-tipos-validada`. Nueve conflictos en los que la lista del 01/10 se impone a la hoja del 16/02 (S-3).

## Specs vivas

Fusión por script, comparando bloque a bloque, y cada bloque vivo idéntico al de la delta:

- `openspec/specs/transitions-st/spec.md`: RQ-TS-44 y RQ-TS-45 añadidos al final. §3.5 (C5) sustituido en su sitio por la
  entrada CERRADA, **a igual longitud (7 → 7)**. La delta original la alargaba a 18 líneas y habría desplazado todas las
  citas posteriores de la spec; se reescribió en el intento de archivo.
- `openspec/specs/trazas/spec.md`: RQ-TZ-21 añadido al final.
- Medida de la fusión, antes del commit: `transitions-st` +122 −6, `trazas` +46 −0. Ninguna capacidad nueva (R-2).

**Regla de mutación 4.** `transitions.ts` 47/47, `historial.ts` 2/2 y `types.ts` 1/1 (inserciones = borrados) e `index.ts`
sólo crece al final: no se mueve ninguna línea de código. Se barrieron las citas a las líneas cuyo contenido cambió
(`transitions.ts:55-62`, `:60`, `:150-151`, `historial.ts:3`, `:51`, `types.ts:611`). Todas siguen siendo ciertas (caso A)
salvo tres:
- `docs/sdd/F0-00_Baseline_as-built.md:71` es un baseline fechado (caso B) y no se toca.
- `openspec/specs/transitions-equipo-nuevo/spec.md:24-26` y `openspec/specs/transitions-soporte-remoto/spec.md:38-40` siguen
  enumerando los campos de `Transition` sin `tipoEvento`. Son capacidades fuera de la cabecera, así que van en el texto para
  Supervisión (W2 del verify).

Las tres citas del propio cambio al §3.5 viejo llevan ahora `en f64ea71` en su línea. El barrido de citas a las specs vivas
sólo encontró esas tres.

## Intentos (registro de `gentle-ai sdd-attempt`)

| # | Unidad | Commits | Medida (`--no-renames`) |
|---|---|---|---|
| 1 | planificación 1 | `9b82c14`, `81c4ba5` | 411 contra `f64ea71` (el diagnóstico asentado dice 391: es un error de transcripción; la cifra buena es esta) |
| 2 | planificación 2 | `67670be` | 271 |
| 3 | lote 1 | `b3d10cd` | 263 |
| 4 | lote 2 | `01edc33` | 101 |
| 5 | verify | `532ea90`, `dcb4bb7` | 166 |
| 6 | archive | este commit y el de la reconciliación | revisable: la fusión (174) y este informe; el resto es la mudanza |

## Códigos y bundle

- Códigos del cierre: los de la cadena del commit de archivo, en el informe de la tanda (test, typecheck, lint con los 165
  avisos de partida, detector). `tsc -p packages/shared/tsconfig.json` mantiene sus dos errores previos ajenos
  (`fasesBlueprint.test.ts:33`, `reasignacion.test.ts:60`) y ninguno nuevo.
- Bundle: `index-*.js` pasa de 418.292 bytes (`index-C7NdRWwC.js`, `f64ea71`) a 419.433 (`index-CtuL2ALD.js`): +1.141,
  por las cadenas de tipo en los catálogos que viajan al cliente. El lote 2 no lo cambia.
- Migración: ninguna.

## Avisos del verify y su destino

- W1, forma de `apply-progress.md`: el rojo de cada verde está, por tablas de lote. Sin destino.
- W2, specs hermanas sin `tipoEvento` en la enumeración: va al texto para Supervisión.
- W3, «sin tipo no compila» lo prueba `npm run typecheck`, no una prueba persistente. Sin destino: la mutación M1 lo
  reproduce, y `packages/shared` no tiene comprobación de tipos en la suite.
- S1, cifra de la tarea 1.4: aclarada en sitio (`dcb4bb7`). S2, encabezado del §3.5: lo casa el script de fusión por
  `### 3.5`. S3 a S5: sin efecto.

## Tareas de persona — archivar no las da por hechas

| Tarea | Dueño | Destino |
|---|---|---|
| Revisar los supuestos S-3 a S-7 (`proposal.md` §9); S-1 y S-2 decididos y S-8 retirado el 18/10 por `decision/f1c04-tabla-tipos-validada` | Gerencia, por la lista semanal | Una semana de plazo |
| Actualizar M1.3 (`R08.4.md:1656`) y M1.8 (`R08.4.md:1932`) | Supervisión → Gerencia | Expediente de la revisión siguiente |
| Pruebas en la app | — | No hay nada visible: el tipo sólo viaja en la respuesta del historial |

## Texto para Supervisión

1. **Maestro:** M1.3 (`R08.4.md:1656`) y M1.8 (`R08.4.md:1932`) dicen que las transiciones no llevan tipo de evento.
   Desde esta tanda lo llevan las 47, de cuatro tipos, y el historial lo expone. M7.3 (`:3026`) pasa de «se vuelve
   calculable cuando se aplique» a «calculable». Tabla validada por Gerencia el 18/10 (`:1664`; `decision/f1c04-tabla-tipos-validada`).
2. **`decision/c5-tipo-evento`:** su consecuencia 1 dice «las 34 transiciones» (`openspec/config.yaml:1874`). Hoy son 45
   más 2 pasos; es cifra de su fecha.
3. **Specs hermanas:** `transitions-equipo-nuevo` (`:24-26`) y `transitions-soporte-remoto` (`:38-40`) enumeran los campos
   de `Transition` sin `tipoEvento`. Que lo recoja el próximo cambio que toque cada capacidad.
4. **Bandeja:** F1C-04 cerrada por archivo; tabla validada el 18/10 (S-1 y S-2 decididos, S-8 retirado el 18/10: la validación de Gerencia es `decision/f1c04-tabla-tipos-validada`); S-3 a S-7 van a la
   lista semanal.
