# Verify · `cierre-f1b08-con-lo-construido` (F1B-08, `cierra: si`)

**Fecha:** 2026-10-17 · **Rama:** `cierre-f1b08-con-lo-construido` · **Verificado sobre:** `54887b0` (partida `6b2f7c1`) ·
**Informe escrito por el orquestador**, con cifras medidas por él.

## Veredicto: PASS — 0 críticos, 0 avisos, 1 sugerencia

## Qué se comprobó

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Cabecera de siete campos en `proposal.md`, con `tanda: F1B-08`, `cierra: si` y `maestro` no vacío | Cumple |
| 2 | Cada cita `ruta:línea` de `proposal.md` contrastada con el fichero de la partida, leyendo qué afirma la frase y los dos extremos de cada rango | 24 de 24 aciertan |
| 3 | Las tres abreviadas del plan (`:153`, `:214`, `:268`), leídas en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md` | Aciertan: búsqueda como ampliación, remanente de paridad, pregunta 4 |
| 4 | Medida 1) de la propuesta: ¿queda contenido de la fila sin construir fuera de `decision/f1b08-cierre-sin-capturas`? | No. Las cuatro decisiones de respaldo están construidas o superadas (propuesta, «Las cuatro decisiones de respaldo, contrastadas») |
| 5 | `git diff --stat 6b2f7c1 54887b0`: sólo ficheros bajo `openspec/changes/cierre-f1b08-con-lo-construido/` | Cumple: 2 ficheros, 146 líneas |
| 6 | Sin código de producción, sin `openspec/specs/`, sin ficheros de Supervisión | Cumple |

## Códigos sobre `54887b0`

| Comando | Salida |
|---|---|
| `npm test` | 0 · 4.764 pasan, 11 omitidas |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 · 0 errores, 165 avisos |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 · 7.201 comprobadas, 13 abreviadas rotas informativas, todas en ficheros ajenos a este cambio |

## Lo que el archive tiene que ver en rojo

Con la carpeta fuera de `archive/`, F1B-08 sigue «en curso» y `apps/desk/server/reconciliacion/registro.test.ts:218-220`
está en verde. Al moverla a `openspec/changes/archive/` con `cierra: si`, el barrido la cuenta «por archivo» y esa prueba
tiene que ponerse roja; si no se pone roja, la prueba no distingue y hay que parar.

## Sugerencia

- S-3 de la propuesta: `openspec/specs/reconciliacion/spec.md:347` dice «seis» en curso con la lista del 01/10. No se
  corrige aquí (sin spec delta), pero la próxima tanda que toque `reconciliacion` debería alinearla con la prueba.
