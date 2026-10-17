# Tareas — `cifras-caducas-y-lectores-de-servicio` (F1B-09, `cierra: no`)

Un intento de aplicación con techo 800 (válvula 720). Cada intento se asienta sólo si sus códigos salen 0.
Toda edición en un fichero existente sustituye texto en la misma línea física (diseño D2): `wc -l` igual antes y después.

## Lote 1 · Guardianes y comentarios (diseño D1, D3)

- [x] 1.1 **Rojo.** `packages/shared/src/comentariosVigilados.test.ts` (nuevo) con cinco casos: DOCE y OCHO en
  `estados.ts:142`/`:145`; `remision_confirmada` en el comentario de `Remisión creada` (`estados.ts:83`); «otras 40»
  en `ticketService.ts:238`; el certificado de `liberacion` en `transitions.ts:348`; y el comentario de
  `transitions.ts:300` que anota los dos lectores, más cero llamadores de producción de `transitionsForStatus(` y
  `transitionById(`. Ver los cinco primeros en rojo y anotar el mensaje.
- [x] 1.2 **Rojo del guardián de llamadores por mutación** (regla de mutación 2): añadir temporalmente una llamada a
  `transitionById(` en un fichero de producción, verlo rojo, restaurar.
- [x] 1.3 **Verde.** Las cinco sustituciones en sitio de `design.md` D1 y la de D3 (`transitions.ts:300`) y la de
  `transitions.ts:67`.
- [x] 1.4 **Mutaciones del detector** (regla de mutación 2): devolver por un momento «SEIS», «43» y «sólo `comment()`»
  al fichero vigilado y ver cada caso en rojo; restaurar.

## Lote 2 · Specs y prueba de trazas en sitio (diseño D4)

- [x] 2.1 Siete frases caso A en sitio: `remisiones/spec.md:752`, `tickets-core/spec.md:1753`, `zoho-sync/spec.md:789`,
  `derivacion-avisos/spec.md:732`, `trazas/spec.md:516` → «las 31 transiciones de servicio»; `transitions-st/spec.md:1360`,
  `:1367`, `:1385` → «31».
- [x] 2.2 `apps/desk/server/transicionesEjecucion.test.ts:290`, `:292` y `:311`: «cinco» → «seis», en sitio.
- [x] 2.3 **Cierre del intento.** test, typecheck, lint (165 avisos como máximo), commit y detector `--sha HEAD` en una
  cadena; medida con `git diff --shortstat --no-renames` contra el commit de partida.

## Cierre del cambio

- [ ] 3.1 Regla de mutación 4: barrido de citas a cada fichero tocado; `wc -l` igual en todos los existentes.
- [x] 3.2 `verify-report.md` contra spec, diseño y tareas.
- [ ] 3.3 Archive: fusión del delta por script en `openspec/specs/trazas/spec.md` (bloque idéntico al delta, mismo número
  de líneas), `archive-report.md`; parte revisable medida ANTES; `git show --numstat` sólo del cambio;
  `RECONCILIACION.md` regenerada en la rama.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Pegar los textos para Supervisión (E-229 remanente, E-230, aviso de la fila F1B-03) | Supervisión | informe de cierre de la tanda |
| P-2 | Revisar el supuesto S-1 en la lista semanal (E-237) | Gerencia | `proposal.md` §5 |
| P-3 | Decidir E-223, E-224 y E-226 | Gerencia; Servicio Técnico para la clase de espera | `docs/sdd/ENTRADA.md` |

## Review Workload Forecast

Estimado: ~150 líneas de código y prueba (fichero nuevo ~110, sustituciones en sitio ~20) más ~25 de specs. ×1,8 = ~315.
400-line budget risk: Low. Chained PRs recommended: No. Decision needed before apply: No.
