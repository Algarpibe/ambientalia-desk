# Exploración: «Rechazo» desde Notificación cliente sólo para Comercial (F1C-10)

Medido el 2026-10-01 sobre la rama `rechazo-solo-comercial` (worktree propio), partiendo de `0070ef1`.
CodeGraph no tiene índice en este worktree; la exploración se hizo con búsqueda de texto y lectura.

## 1 · Respaldo

| Fuente | Ruta:línea | Qué dice |
|---|---|---|
| Entrada literal de Gerencia | `docs/sdd/ENTRADA.md:1460-1464` (E-114) | «Rechazo» desde Notificación cliente pasa a ejecutarla sólo Comercial; no cambian origen, destino ni las otras dos «Rechazo»; actualizar M1.3 y el mapa del blueprint |
| Fila del plan | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:178` (§E), `:108` (§C), `:222`, `:307`, `:355` | F1C-10, talla XS; «junto con» se lee como consecutiva a F1C-09 (R-4) |
| Orden de ejecución | `openspec/config.yaml:3615` (`decision/escenario-a-festivos-plan-a-01-10`, punto 5) | barrido → F1C-09 → **F1C-10** → F1B-15, cada uno en su worktree |
| Maestro vigente | `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1616` (M1.3.7), `:1945` (M1.9.1), `:1523-1527` (tabla de M1.3), `:2598`, `:4532`, `:4554` | Ya dice «solo Comercial». La tabla de M1.3 ya trae la fila con `Comercial` y la nota «Solo Comercial desde el 01/10» |

No hay clave `decision/*` propia para E-114 en `openspec/config.yaml` (búsqueda de `E-114` y de
`rechazo` en el fichero: ningún acierto que la nombre). El respaldo operativo es E-114 + R08.4.md:1616,
que es lo que cita la propia fila del plan (`:178`).

## 2 · El catálogo

`packages/shared/src/transitions.ts`:

| Línea | id | from | to | area hoy | Cambia |
|---|---|---|---|---|---|
| `:234` | `rechazo_comercial` | `Notificación Comercial` | `Por Facturar` | `Comercial / Servicio Técnico` | **No** |
| `:236` | `rechazo_cliente` | `Notificación cliente` | `Por Facturar` | `Comercial / Servicio Técnico` | **Sí → `Comercial`** |
| `:238` | `rechazo_revision` | `Rev./Diagnostico` | `Por Facturar` | `Comercial / Servicio Técnico` | **No** |

Edición en sitio: se cambia una cadena de la línea `:236`; no se inserta ni se borra ninguna línea.

Salidas de `Notificación cliente` (`transitions.ts:198`, `:202`, `:236`): `aprobacion_y_repuestos`
(`Comercial / Compras`), `aprobacion` (`Comercial`), `rechazo_cliente`.

## 3 · Imposición en el servidor y regla 13

- Función de área: `packages/shared/src/permissions.ts:4-7` (`canExecuteTransition`), descompone con
  `areasForTransition` (`transitions.ts:313-315`). Áreas base: `transitions.ts:310`.
- Escalón B del motor: `apps/desk/server/services/ticketService.ts:129-130` (403 por área), seguido del
  403 por cargo en `:131`. El área se lee de `t.area` del catálogo: el cambio del catálogo basta, sin
  tocar el servidor.
- Traza: `ticketService.ts:155` guarda `area: t.area` en cada ejecución. Las filas históricas de
  `rechazo_cliente` conservan `Comercial / Servicio Técnico`: correcto, era el área vigente.
- Cliente: `apps/desk/src/components/TransitionPanel.tsx:57` consume `puedeEjecutarTransicion` de
  `@ambientalia/shared` (regla 13, punto 1: consume, no reescribe). La imposición está probada por la
  matriz contra el servidor (`apps/desk/server/permisos.test.ts:41-67`), así que el filtro sigue siendo
  comodidad legítima (punto 3). **Ningún `.tsx` cambia.**

## 4 · Guardianes y cifras que se mueven

| Guardián | Ruta:línea | Hoy | Tras F1C-10 |
|---|---|---|---|
| Matriz de área (función pura, total a mano) | `apps/desk/server/permisos.test.ts:77-81` (y comentario `:72-75`, `:26-27`) | 93 = 54 prohibidos / 39 permitidos (23 simples × 2 + 8 compartidas × 1) | 93 = **55 / 38** (24 × 2 + 7 × 1) |
| Matriz compuesta sin cargo | `permisos.test.ts:349-354` (comentario `:338`) | 93 = 55 / 38 | 93 = **56 / 37** |
| Matriz HTTP por área | `permisos.test.ts:41-67` | derivada | se deriva sola; prueba que un usuario de Servicio Técnico recibe `403` en `rechazo_cliente` |
| Única diferencia cargo/área | `permisos.test.ts:341-347`, `apps/desk/server/cargoPermiso.test.ts:250-266` | `liberacion_sin_factura` × Comercial | sin cambio |
| Barrido cargo × área × transición | `permisos.test.ts:356-369` | 744 | sin cambio |
| Invariante 5, compartidas por id | `packages/shared/src/invariantesGrafo.test.ts:85-106` | ocho, con `rechazo_cliente` en `:103` | **siete**; `:103` se sustituye por un comentario de una línea (sin desplazar) |
| `areasSiguientes('Notificación cliente')` | `transitions.ts:327-334`; uso en `apps/desk/server/services/avisoArea.ts:16` | Comercial, Compras, Servicio Técnico | **Comercial, Compras** — sin prueba hoy |
| Anti-desfase del mapa | `packages/shared/src/mapaBlueprint.test.ts:154-159` | verde | rojo hasta regenerar |

Las otras matrices (equipo nuevo `:243`, soporte remoto `:328`) no contienen `rechazo_cliente`.

## 5 · El mapa

`npm run generar-mapa-blueprint` (`package.json:25`). La marca de área sale de `areasForTransition`
(`packages/shared/src/mapaBlueprint.ts:78-80`). `e03` es `Notificación cliente`
(`docs/artefactos/blueprint-completo.md:13`). Aristas que pasan de `[C][ST]` a `[C]`:

- `docs/artefactos/blueprint-completo.md:54`
- `docs/artefactos/blueprint-fase-2-diagnostico.md:44`
- `docs/artefactos/blueprint-fase-3-cierre.md:22`

Las aristas de `e07` y `e13` conservan `[C][ST]`. `docs/artefactos/blueprintserviciotecnico.html:762` es
un artefacto estático hecho a mano: F1C-09 tampoco lo actualizó (sigue nombrando «Marcar como
pendiente»). Queda fuera.

## 6 · Specs afectadas

| Capacidad | Ruta:línea | Qué afirma hoy |
|---|---|---|
| `permissions` | `openspec/specs/permissions/spec.md:62-64`, `:89`, `:101-104` | 54/39, 23 simples + 8 compartidas |
| `transitions-st` | `openspec/specs/transitions-st/spec.md:63` (tabla de invariantes), `:269-275`, `:285` (RQ-TS-07) | ocho compartidas: cinco C/Compras y **tres** C/ST; 54/39 |
| `transitions-st` | `:1431-1437` (RQ-TS-23) y `:1627-1630` (escenario de F1C-09) | «se conserva sin cambio el emparejamiento de las ocho compartidas»: cierto de F1C-09, falso tras F1C-10 |
| `mapa-blueprint` | `openspec/specs/mapa-blueprint/spec.md:112-124` | genérico (leyenda por área); sin requisito que nombre la arista. **Sin delta** |
| `derivacion-avisos` | `openspec/specs/derivacion-avisos/spec.md:134` en `f55b7d9` (RQ-AV-04) | genérico; el requisito no cambia |

Citas fechadas que NO se tocan (caso B): `openspec/specs/transitions-st/spec.md:1545` en `4984c3b`, todo
`openspec/changes/archive/**`, `docs/sdd/Estado_As-Built_2026-09-09.md`.

## 7 · Maestro

Ya actualizado en la R08.4 (sección 1). No hay recuento de compartidas en el cuerpo del maestro
(`:1936` no da número; `:6905` es un registro de erratas de la R08.1). `toca_maestro: no`.
