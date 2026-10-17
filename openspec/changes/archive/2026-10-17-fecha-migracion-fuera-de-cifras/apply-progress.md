# Apply progress — `fecha-migracion-fuera-de-cifras` (F1F-01, `cierra: no`)

Un intento de aplicación, en el worktree `C:\dev\Desk_2_R1.023-worktrees\fecha-migracion-fuera-de-cifras`, partida `9c14a7f`.

## Tareas

| Tarea | Estado | Evidencia |
|---|---|---|
| 1.1 Rojo shared | [x] | `cierreEnCifras.test.ts`: falla al cargar (módulo inexistente) |
| 1.2 Verde shared | [x] | `packages/shared/src/cierreEnCifras.ts`; export al final de `index.ts`; 9 de 9 |
| 1.3 Tipos | [x] | `ContactDetail` y `AccountDetail` ganan `resolucionPromedioMs` en sus propias líneas (`types.ts` +2 −2) |
| 2.1 Rojo servidor | [x] | `apps/desk/server/cierreMigracionEnCifras.test.ts`: 6 de 6 rojas con `cierresPuestosPorMigracion` vacío |
| 2.2 Lectura | [x] | `apps/desk/server/db/cierresDeMigracion.ts` (nuevo) |
| 2.3 Lectores en sitio | [x] | `analisis.ts` +5 −5, `informeContrato.ts` +3 −3, `indicadores.ts` +2 −2, `directory.ts` +10 −5 (los +5 son `conResolucion` al final) |
| 2.4 Cliente | [x] | `ClienteDetalle.tsx` +4 −4: las seis líneas de la media son seis líneas que sólo formatean |
| 2.5 Regla de mutación 3 | [x] | tabla de abajo |
| 2.6 Cierre del intento | [x] | test, typecheck, lint, detector y build en 0 |

**Pruebas existentes ajustadas, y por qué:**
- `apps/desk/server/migracionMarcadorLectores.test.ts`: la caracterización «el marcador vuelve `reentrante` falso» se invierte en
  sitio (S-5): ahora el marcador no está en el historial y `reentrante` es «sin dato».
- `apps/desk/server/analisis.test.ts`: la prueba de caché contaba UNA consulta por lectura y ahora son dos (filas y marcadores);
  su intención —la caché no vuelve a consultar dentro del TTL— no cambia: 1→2, 1→2 y 2→4, en sitio.

## Regla de mutación 3 — decisiones del cliente, por escrito

| Decisión del `.tsx` | Antes (`73bd52f`) | Ahora | Línea del servidor que la impone |
|---|---|---|---|
| Qué tickets entran en la media de resolución | el `.tsx`: cerrados con las dos fechas | ninguna: el `.tsx` no filtra | `resolucionPromedioMs` (`packages/shared/src/cierreEnCifras.ts`) llamado por `conResolucion` al final de `apps/desk/server/db/directory.ts` |
| Excluir el cierre de la migración | no existía | ninguna en el `.tsx` | `cierreQueCuenta` dentro de `resolucionPromedioMs`, con `cierresPuestosPorMigracion` |
| Calcular la media | el `.tsx` (`reduce`) | ninguna | `resolucionPromedioMs` |
| «00:00» cuando no hay dato | el `.tsx`, sin cerrados | el `.tsx`, con `null`: presentación, no decide qué cuenta | — (formato) |

## Regla de mutación 1

No hay guardas de ruta nuevas ni movidas: el cambio es de lectura. No hay par de guardas que ordenar.

## Mutaciones (diseño §7), cada una vista en rojo y restaurada

| # | Mutación | Rojo |
|---|---|---|
| M-1 | `cierreQueCuenta` devuelve siempre `closedTime` | 6 (shared S-1, media, Análisis, ficha) |
| M-2 | `cierrePuestoPorMigracion` acepta también «zoho» | 3 (shared, lectura, Análisis) |
| M-3 | `llegadaQueCuenta` fecha el marcador por `performedAt` | 2 (shared S-3, informe de contrato) |
| M-4 | quitar el salto del marcador en `apps/desk/server/indicadores.ts:81` | 2 (`reentrante` en la prueba nueva y en `migracionMarcadorLectores.test.ts`) |
| M-5 | `cierre_origen` comparado sin mayúsculas | 1 (shared, igualdad exacta) |
| M-6 | la ficha promedia con todos los cerrados | 2 (las dos de la ficha) |

## Regla de mutación 4 — barrido

Sin líneas insertadas en los ficheros muy citados (`git diff --numstat`: inserciones = borrados en todos, salvo `directory.ts`,
que crece sólo al final, e `index.ts`, una línea final). Citas a líneas cuyo CONTENIDO cambió y cuya frase afirma lo de antes:
caso B, ancladas en `73bd52f` — `analisis.ts:26` y `ClienteDetalle.tsx:124-126` en `docs/sdd/TRASPASO_2026-10-08.md` y en tres
artefactos de `archive/2026-10-16-fecha-cierre-migracion/`; `informeContrato.ts:34` (y `:33-34`) en seis de
`archive/2026-10-04-migracion-tickets-abiertos/`; y las cuatro del §2 de este `proposal.md`. Las demás que el barrido cazó
siguen siendo ciertas (caso A) o apuntan a otro fichero del mismo nombre.

**Para Supervisión:** `docs/sdd/ENTRADA.md:2073` afirma que el informe de contrato toma el marcador como llegada a «Finalizado».
Desde este cambio es caso C (lo cierra RQ-TC-69). No se toca desde aquí: el fichero tiene cambios sin commitear de Supervisión.

## Hallazgos para la bandeja (no se corrigen)

La ficha de cliente rotula «Últimos 6 meses» sin filtrar por fecha, y «Tiempo de primera respuesta» y «Tiempo de respuesta» van
fijos a «00:00» (`apps/desk/src/components/ClienteDetalle.tsx:192-194`).
