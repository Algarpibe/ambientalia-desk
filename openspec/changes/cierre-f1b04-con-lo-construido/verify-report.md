# Verify · `cierre-f1b04-con-lo-construido` (F1B-04, `cierra: si`)

**Fecha:** 2026-11-03 · **Rama:** `cierre-f1b04-con-lo-construido` · **Verificado sobre:** `44ab58ab` (partida `9134c04c`) ·
**Informe escrito por el orquestador**, con cifras medidas por él. El contraste pieza a pieza lo hizo antes, por su cuenta, un
agente de lectura sobre `9134c04c`, y el orquestador leyó una a una las líneas que cita la propuesta.

## Veredicto: PASS — 0 críticos, 0 avisos, 2 sugerencias

## Qué se comprobó

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Cabecera de siete campos en `proposal.md`, con `tanda: F1B-04`, `cierra: si`, `origen_cabecera: declarada` y `maestro` no vacío | Cumple. `maestro` lleva «ítems 4, 10», que está en la fuente de la fila en la R01.1, así que el barrido no la marcará «sin verificar» (`apps/desk/server/reconciliacion/comprobaciones.ts:238` en `9134c04c`) |
| 2 | Cada cita `ruta:línea` de `proposal.md`, leída en su ancla, con lo que afirma la frase y los dos extremos de cada rango | 84 de 84 aciertan, sobre 61 destinos distintos. Una se corrigió antes del commit de planificación: `openspec/config.yaml:2929` en `9134c04c` pasó a `:2925`, la respuesta que dice que la etiqueta lleva el código del ticket |
| 3 | ¿Queda alguna pieza de la fila sin construir y archivar? | No. Cada pieza tiene su requisito vivo (tabla de abajo); lo que queda es de persona, fuera del repositorio o fuera de la fila por su fuente |
| 4 | `git diff --name-only 9134c04c 44ab58ab`: sólo ficheros bajo `openspec/changes/cierre-f1b04-con-lo-construido/` | Cumple: `proposal.md` y `tasks.md`, 207 líneas |
| 5 | Sin código de producción, sin `openspec/specs/`, sin ficheros de Supervisión, sin delta de specs | Cumple |

## Las piezas, en las specs vivas

| Pieza | Requisitos |
|---|---|
| Rotulación | `openspec/specs/remisiones/spec.md:1012` en `9134c04c` (RQ-RE-24), `openspec/specs/remisiones/spec.md:2036` en `9134c04c` (RQ-RE-40) y `openspec/specs/remisiones/spec.md:2116` en `9134c04c` (RQ-RE-41) |
| Lista de novedades en lugar del texto libre | `openspec/specs/remisiones/spec.md:852` en `9134c04c` (RQ-RE-21), `openspec/specs/remisiones/spec.md:920` en `9134c04c` (RQ-RE-23) y `openspec/specs/remisiones/spec.md:1383` en `9134c04c` (RQ-RE-29, la mantiene el Director Técnico) |
| Foto obligatoria en la remisión de entrada | `openspec/specs/remisiones/spec.md:1042` en `9134c04c` (RQ-RE-25), `openspec/specs/remisiones/spec.md:1093` en `9134c04c` (RQ-RE-26) y `openspec/specs/remisiones/spec.md:1209` en `9134c04c` (RQ-RE-27, la vía de legado de W3) |
| Accesorios desde el catálogo | `openspec/specs/remisiones/spec.md:1505` en `9134c04c` (RQ-RE-32), `openspec/specs/remisiones/spec.md:1559` en `9134c04c` (RQ-RE-33), `openspec/specs/remisiones/spec.md:1674` en `9134c04c` (RQ-RE-34) y `openspec/specs/remisiones/spec.md:1717` en `9134c04c` (RQ-RE-35) |
| E-165 y E-166 | `openspec/specs/remisiones/spec.md:1853` en `9134c04c` (RQ-RE-37) y `openspec/specs/remisiones/spec.md:1887` en `9134c04c` (RQ-RE-38) |
| «Aplica» hacia n8n | `openspec/specs/remisiones/spec.md:1945` en `9134c04c` (RQ-RE-39) |
| Aviso si la etiqueta no se genera | `openspec/specs/derivacion-avisos/spec.md:1081` en `9134c04c` (RQ-AV-22) |

## Códigos sobre el árbol de este informe

| Comando | Salida |
|---|---|
| `npm test` | 0 · 5.836 pasan, 26 omitidas (450 s) |
| `npm run typecheck` | 0 |
| `npm run lint -- --max-warnings 165` | 0 · 0 errores, 165 avisos |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha <commit>` | 0 · 16 abreviadas rotas informativas, todas en ficheros ajenos a este cambio |

## Lo que el archivo tiene que ver en rojo

Con la carpeta fuera de `archive/`, F1B-04 sigue «en curso» y `apps/desk/server/reconciliacion/registro.test.ts:218-220` está
en verde. Al moverla a `openspec/changes/archive/` con `cierra: si`, el barrido la cuenta «por archivo» y esa prueba tiene que
ponerse roja. Si no se pone roja, la prueba no distingue y hay que parar.

## Sugerencias

- **S-4 de la propuesta.** `openspec/specs/reconciliacion/spec.md:347` en `9134c04c` da seis «en curso» con la lista del 01/10 y
  nombra F1B-04; tras el archivo lo nombrará sin estarlo. No se corrige aquí, porque el cambio va sin delta de specs. La
  próxima tanda que toque `reconciliacion` debería alinearla con la prueba.
- **Para Supervisión.** La nota 7 del plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:358`) dice que E-100 «no
  tiene clave `decision/…`». Desde el 06/10 la tiene: `decision/e232-accesorios-lista-por-modelo`
  (`openspec/config.yaml:4021` en `9134c04c`).
