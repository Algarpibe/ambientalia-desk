# Informe de archivo — `edicion-comercial-equipo` (F1B-14, segundo cambio, `cierra: si`)

**Qué parte de la fila cubre y qué deja fuera, en una línea (R-1):** cubre la mitad «edición» de la fila
F1B-14 «Alta y edición del equipo» —guarda de área en el servidor sobre fecha de factura, fin de garantía
y mantenedor; registro de cambios de los seis campos visible en la hoja de vida; botón «Editar» en la hoja
de vida— y, con `alta-equipo-nuevo-en-ticket` (archivado el 2026-09-24, `cierra: no`), deja la fila
terminada; deja fuera, a propósito, restringir o auditar el ALTA (supuestos a1 y c5) y auditar campos
distintos de los seis (supuesto b3).

## Commits

| SHA | Fecha | Qué |
|---|---|---|
| `b580371` | 2026-09-25 07:37 | Ficha: `proposal.md`, delta de `hojas-vida`, `design.md`, `tasks.md`; entradas E-075 a E-077 en `docs/sdd/ENTRADA.md` |
| `f0304ec` | 2026-09-25 08:19 | Lote 1: `packages/shared/src/equipoComercial.ts`, `apps/desk/server/db/equiposCambios.ts`, tabla `public.equipos_cambios`, guarda del `PATCH`, lectura en `GET /api/equipos/:id/historial`, pruebas |
| `5d853fe` | 2026-09-25 08:48 | Lote 2: `EquiposAdmin.tsx` exporta `EquipoForm` y bloquea los tres campos en edición; botón «Editar» y sección «Cambios» en `HojaDeVida.tsx`; barrido de citas (regla de mutación 4) |
| `9f7b808` | 2026-09-25 08:51 | Anclaje a su revisión (caso B) de las 10 citas que el detector bloqueó tras el lote 2 |
| `acea83a` | 2026-09-25 09:14 | `verify-report.md` y casillas 13.4, 16.4 y 18.4 de `tasks.md` |
| (este) | 2026-09-25 | Archivo: fusión de la delta y traslado de la carpeta |

Base de partida: `0807a77`.

## Verificación

`verify-report.md`: **pass** — 0 CRITICAL, 0 WARNING, 3 SUGGESTION; 4 requisitos y 11 escenarios
automáticos cumplidos; `tasks.md` 65/65. `npm test` 1383 pasadas y 2 omitidas; `typecheck`, `lint`
(0 errores, 165 avisos, los mismos que en la base) y `build` con salida 0. Las tres sugerencias:

1. El `GIVEN` del segundo escenario de RQ-HV-11 dice «sin Comercial» y la prueba de
   `ticketService.test.ts` usa un actor administrador; la exención del alta es incondicional, así que el
   requisito queda demostrado igual. Es redacción, no hueco de cobertura.
2. `npm run build` avisa del ciclo de módulos `HojaDeVida.tsx` ↔ `EquiposAdmin.tsx`, ya aceptado en
   `design.md`.
3. La rama defensiva `else` de `isoLocal` en `equiposCambios.ts` no tiene cobertura de rama.

## Tamaño real frente al ledger

El ledger mide el árbol trackeado y no cuenta lo nuevo sin trackear; el archivo lo mide sin detección de
renombrado (`CLAUDE.md`, regla del ciclo 2).

| Fase | Ledger | Real | Diferencia |
|---|---|---|---|
| Apply lote 1 | 453 | 926 | 473 líneas de ficheros nuevos sin trackear (código y pruebas nuevos, y 195 de `apply-progress.md`) |
| Apply lote 2 | 350 | 350 | — (sin ficheros nuevos) |
| Verify | 7 | 234 | 227 del `verify-report.md` sin trackear |
| Archive | (lo registra el `settle`) | ver abajo | — |

Archive, medido contra `acea83a`: el traslado de la carpeta son 1476 líneas que, sin detección de
renombrado, cuentan como 1476 borradas y 1476 insertadas; la fusión de la delta suma 145 insertadas y
2 borradas en `openspec/specs/hojas-vida/spec.md`; y este informe es nuevo. La carga revisable real es la
fusión y este informe; el traslado es literal.

## Fusión de la delta

Por ID de requisito: RQ-HV-09, RQ-HV-10, RQ-HV-11 y RQ-HV-12 (todos ADDED), a continuación de RQ-HV-08 en
`openspec/specs/hojas-vida/spec.md`. Además se aplicó la sección de la delta «Nota de fusión — §2 «Fuera de
alcance» de la spec viva (no es un `Requirement`)»: el guion que decía que para escribir equipos «basta
`requireAuth`» se sustituyó por el que distingue el alta (sin filtro, RQ-HV-11) de la edición de los tres
campos restringidos (con guarda, RQ-HV-09). La nota no se copia a la spec viva.

## Barrido de citas (regla de mutación 4)

- El barrido del cambio se hizo en el lote 2 (fase 18 de `tasks.md`; tabla fila a fila en
  `apply-progress.md`) y el anclaje de revisión en `9f7b808`. El detector (`apps/desk/server/citas/cli.ts
  --sha HEAD`) salió con 0 en `9f7b808`.
- La fusión inserta líneas a partir del final de RQ-HV-08. La única cita externa a `hojas-vida/spec.md` con
  número de línea fuera de `archive/` es la de `docs/sdd/ENTRADA.md` a la línea 70, anterior a la
  inserción: no se desplaza.
- El detector se vuelve a pasar sobre el commit de archivo antes del push.

## Comprobaciones de persona de RQ-HV-12 — archivar NO las da por hechas

Son de `HojaDeVida.tsx`/`EquiposAdmin.tsx`, fuera de la red de pruebas por decisión F0-00
(`vitest.config.ts:16-20`), y no entran en el recuento de tareas (regla del ciclo 1).

| # | Comprobación | Dueño | Dónde queda escrito |
|---|---|---|---|
| Persona-1 | El botón «Editar» de la hoja de vida abre el formulario | Comercial/Gerencia, en la aplicación desplegada | `openspec/specs/hojas-vida/spec.md`, RQ-HV-12 |
| Persona-2 | Sin área Comercial ni administrador, los tres campos restringidos están en solo lectura al editar (no al dar de alta) | ídem | ídem |
| Persona-3 | La sección «Cambios» enseña las filas del registro del equipo | ídem | ídem |

## Decisiones y supuestos del ciclo

- **Diseño: dos FAIL y un PASS.** La primera validación encontró que la delta y el diseño ordenaban las
  guardas al revés. Se resolvió con la tabla canónica de `openspec/specs/transitions-st/spec.md:755-767`:
  los `422` de cliente, modelo y mantenedor inexistentes son escalón A y van antes del `403` de área
  (escalón B), que va antes de los `422` de formato (escalón C). La segunda falló sólo por citas del diseño
  a la versión anterior de la delta. La tercera, con un subagente nuevo, pasó sin bloqueantes.
- **Supuestos aplicados:** (a1) el alta no se restringe por área; (b3) el registro cubre sólo los seis
  campos; (c1) «cambiar» se mide contra el valor guardado, y una clave ausente no cuenta; (c3) la tabla es
  `public.equipos_cambios`, sin clave foránea en cascada, y sobrevive al borrado del equipo; (c5) el alta no
  genera filas; `camposHojaDeVida` no se mueve (D6).
- **Cabecera `maestro`: M3.1, como hipótesis.** Ni M3.1 «Estructura de datos» ni M3.3 «Funcionalidades de
  la hoja de vida» de la R08.2 hablan literalmente de editar ni de registrar cambios; M3.1 define los seis
  campos y quién los da de alta. La decisión registrada dice M3.2, que en la R08.2 es la taxonomía ISO
  14224: errata registrada como corrección pendiente para el expediente R08.3 en `docs/sdd/ENTRADA.md`,
  E-075. `openspec/config.yaml` no se toca desde una tanda.
- **Revertida una edición de `openspec/config.yaml`.** El lote 2 añadió la revisión a una cita de la
  consecuencia (3) de `decision/edicion-datos-comerciales-equipo`. Es un campo de una decisión de Gerencia:
  se revirtió y quedó anotado en E-075.
- **Desviación del lote 1.** El `404` del `PATCH` pasó a dos líneas y desplazó las citas posteriores de
  `apps/desk/server/routes/equipos.ts`; las recogió el barrido del lote 2.
- **Partición en lotes.** Lote 1 (servidor) y lote 2 (`.tsx`) en intentos de ledger separados, y verify en
  un tercero, para no juntar el lote 1 con el `verify-report` bajo el mismo techo de 800.

## Sin dueño en esta tanda

Ninguna se arregla aquí; las dos quedan en la bandeja con dueño propuesto.

1. **La etiqueta «Validación C» de `apps/desk/server/services/equipoNuevo.ts:63`.** El comentario llama así
   al bloque que reutiliza `camposHojaDeVida`, pero la parte del mantenedor («Mantenedor no encontrado») es
   una comprobación de existencia de un identificador aportado tal cual: escalón **A** según la tabla
   canónica. El `PATCH` de equipos ya la trata como A. → `docs/sdd/ENTRADA.md`, **E-076**. Dueño propuesto:
   quien decida el alcance de F1B-06 (rama de equipo nuevo del alta de ticket).
2. **La dependencia invertida de `camposHojaDeVida`.** Vive en la capa de rutas
   (`apps/desk/server/routes/equipos.ts:164-211`) y la importa un servicio
   (`apps/desk/server/services/equipoNuevo.ts:6`). No hay ciclo, pero un servicio depende de una ruta. El
   diseño decidió no moverla en esta tanda (D6). → `docs/sdd/ENTRADA.md`, **E-077**. Dueño propuesto: quien
   decida el alcance de una tanda de reorganización.

## Trazabilidad Engram

`sdd/edicion-comercial-equipo/proposal` obs. #1043 · `/spec` #1044 · `/design` #1045 · `/tasks` #1048 ·
`/apply-progress` #1049 · `/verify-report` #1050 · este informe: `sdd/edicion-comercial-equipo/archive-report`.
