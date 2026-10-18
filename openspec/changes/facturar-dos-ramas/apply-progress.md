# Progreso del apply — `facturar-dos-ramas` (F1C-02)

`strict_tdd` activo. Cada fila dice la prueba, el rojo visto y el verde. Base del lote 1: `97d6f6e`.

## Lote 1 — las dos ramas y «Facturar» (intento 3)

| Tarea | Rojo visto | Verde |
|---|---|---|
| 1.1 / 1.2 `facturar.test.ts` (shared) | `Cannot find module './facturar'` | 9/9 tras `facturar.ts` y su `export` en `index.ts:35` |
| 1.3 / 1.4 `invariantesGrafo.test.ts`, bloque «las dos ramas de cierre» | 4 fallos: `expected 'Por Facturar' to be 'Pendiente de facturar'`; un componente con `Por Facturar`; salidas `[]` | 4/4 tras el catálogo (D1, D2) |
| 1.6 vigilantes | 46 fallos en 22 ficheros, todos de cifra o de catálogo (inventario en el registro del intento) | corregidos en su línea; `packages/shared` 1.474/1.474 |
| 1.7 reentrancia | C1, «diez casos», «once campos», cruce G.6 | 9 campos (7 obligatorios), 8 casos, 2 ciclos; la fila 47 de `INDICADORES_G6` pasa a comentario en `reentrancia.ts:79` |
| 1.8 / 1.9 `apps/desk/server/facturar.test.ts` | 4 fallos: número de espacios `200`; fecha imposible **`500`**; fecha mal formada `500`; orden del `422` | 13/13 tras `erroresFacturar` en `ticketService.ts:134` |
| 1.10 cliente | — (`.tsx` fuera de la red, F0-00) | `TransitionPanel.tsx:33` con `seRegistraEnCadaFactura` (probado en shared); color en `TicketCard.tsx:20` |

**Hallazgo del rojo de 1.8.** Antes de la guarda, una fecha imposible en «Fecha De Factura» no daba `422` sino **`500`**: `buildTransitionPlan` recorta la fecha (`transitionExec.ts:33`) y la base la rechaza al escribir. El mismo camino lo recorren `facturado` y `facturado_cierre`, que escriben el mismo campo y siguen sin guarda de contenido: queda anotado para la bandeja, fuera de esta tanda.

**Decisiones tomadas al aplicar.**

- `Pendiente de facturar` va **delante** de `Anulado` en `estados.ts:99`, para que `Anulado` siga siendo el último de `ESTADOS_SERVICIO` (`anulacion.test.ts:139`). Los alias `eNN` del mapa salen de ese orden; los artefactos se regeneraron después del cambio.
- `mapaBlueprint.test.ts:185` exigía que el diagrama no contuviera «Pendiente» (el estado de soporte remoto, F1C-09). «Pendiente de facturar» lo contiene. La prueba se afina en su línea: quita «Pendiente de facturar» antes de buscar, y sigue vigilando lo que vigilaba.
- `facturar.test.ts` de `packages/shared` no importa `zoho-sync` (ningún fichero de `shared` lo hace); la comprobación contra `PROMOTED_COLUMNS` vive en la prueba del servidor.
- **E-246** (`docs/sdd/ENTRADA.md:2200`), destino de Gerencia: «el próximo cambio que toque cada uno de esos ficheros corrige su cifra en sitio». Esta tanda toca `permisos.test.ts`, `transicionesEjecucion.test.ts`, `cargos.test.ts`, `bodegaje.test.ts` y `transitions.ts`: sus «31» de comentario y título pasan a 33 (y «las otras 26» de `transitions.ts:269` a 28), sin desplazar líneas. Quedan los de `valoresDeTransicion.ts:10`, `bodegaje.ts:28`, `sla.ts:14` y `sla.test.ts:22`, que esta tanda no toca.

## Mutaciones del lote 1 (D9), reproducidas a mano y restauradas desde copia

| # | Mutación | Rojo |
|---|---|---|
| M1 | sin `errFacturar` en el `422` | `facturar.test.ts` 4 de 13 |
| M2 | «Facturar» sale a `Por Facturar` | `invariantesGrafo.test.ts` 4 de 30 |
| M3 | `entrega_sin_factura` vuelve a `Por Facturar` | `invariantesGrafo.test.ts` 4 de 30 |
| M4 | «Facturar» compartida con Servicio Técnico | `facturar.test.ts` 3 de 13 |
| M5 | «Facturar» con excepción de cargo Director Comercial | `facturar.test.ts` 3 de 13 |
| M6 | la guarda de «Facturar» delante del `403` de área | `facturar.test.ts` 2 de 13 |
| M7 | el contenido de «Facturar» delante de la presencia en el `422` | `facturar.test.ts` 4 de 13 |

Además, el invariante de RQ-TS-43 lleva su propia mutación DENTRO de la prueba: ensucia el catálogo en memoria de dos
formas y exige que el detector se ponga rojo (regla de mutación 2).

## Regla de mutación 4 (lote 1)

Ningún fichero muy citado cambió de longitud: `estados.ts`, `transitions.ts`, `reentrancia.ts`, `columns.ts`,
`fasesBlueprint.ts`, `ticketService.ts`, `TicketCard.tsx` y `TransitionPanel.tsx` llevan inserciones = borrados.
`reentrancia.test.ts` quedó en +24/−24 (la prueba C1 se recompuso con el mismo número de líneas, porque
`reentrancia.test.ts:118-140` está citado). `invariantesGrafo.test.ts` sólo crece al final.

Citas a las líneas cuyo CONTENIDO cambió, leídas una a una:

- `ticketService.ts:134` (catorce citas): todas nombran el `422` agregado del escalón C, que sigue siendo esa línea. Caso A.
- `ticketService.ts:238` (`docs/sdd/ENTRADA.md:2148`, `F1B-09_Auditoria_blueprint_audit-F1B.md:304`): el comentario «en las
  otras N transiciones», que sigue en esa línea con N = 44. Las dos son hallazgos fechados que citan la cifra de entonces
  («las otras 43»): caso B, y la línea sigue apuntando al mismo comentario.
- `transitions.ts:248-249` (`F0-00_Baseline_as-built.md:69`, `por-entregar-es-espera` archivado): describen el ciclo tal
  como era. Son registros fechados del as-built: caso B. No se tocan desde esta rama.
- `transitions.ts:262` (`F0-01_Correcciones_para_el_maestro.md:138`, `:476`): citan un docblock que ya no estaba en esa
  línea antes de este cambio. Desfase previo, caso B; se anota.
- `estados.ts:99`, `:142-145`, `columns.ts:33`, `TicketCard.tsx:20`, `TransitionPanel.tsx:32-36`, `reentrancia.ts:78-83`:
  las frases que las citan siguen siendo ciertas de esas líneas. Caso A.
