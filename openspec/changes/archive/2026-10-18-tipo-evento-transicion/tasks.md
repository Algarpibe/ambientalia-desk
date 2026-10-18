# Tareas — `tipo-evento-transicion` (F1C-04)

`strict_tdd`: cada tarea de código empieza por su prueba en rojo, vista y anotada en `apply-progress.md` con la salida.
Las referencias D* son de `design.md`; RQ-* de las deltas. Las cifras se leen del rojo, no se estiman. Las mutaciones se
hacen sobre una copia en el directorio temporal de la sesión y se restauran copiándola; nunca `git checkout` ni `git stash` (D6).

## Lote 1 — packages/shared: el tipo cerrado en los catálogos (intento 3)

- [x] 1.1 Línea base (D6): `npm run typecheck` en verde; `npx tsc -p packages/shared/tsconfig.json --noEmit` con los dos
      errores ajenos (`fasesBlueprint.test.ts:33`, `reasignacion.test.ts:60`), vueltos a medir; `wc -l` de `transitions.ts`.
- [x] 1.2 ROJO: `packages/shared/src/tipoEvento.test.ts` (D3) — tabla de 47 filas escrita a mano, recuentos 21/14/9/3,
      barrido, un ejemplo por tipo y RQ-TS-45 (`null`, `undefined`, `''`). Rojo por módulo inexistente.
- [x] 1.3 `packages/shared/src/tipoEvento.ts` (D1), `export * from './tipoEvento'` al final de `packages/shared/src/index.ts`
      y `tipoEvento` obligatorio en `transitions.ts:60` (tipo en línea, comentario final corto). ROJO por valores
      (`undefined`) y `tsc` con un error por entrada sin tipo y por literal de D4: es M1 natural; anotar el número.
- [x] 1.4 VERDE: los 47 valores en su línea (`transitions.ts:150-151` con `satisfies Omit<Transition, 'fields'>`, 32 líneas de servicio con 33 entradas,
      7 de equipo nuevo, 5 de soporte remoto) y los seis literales de D4 (`mapaBlueprint.test.ts:200`, `:294`; `sla.test.ts:9`;
      `avisoArea.test.ts:48`; `transitionExec.test.ts:294`, `:303`). Los dos `tsc` vuelven a la línea base.
- [x] 1.5 Guarda de D2: `wc -l` de `transitions.ts` idéntico; `git diff --numstat -- packages/shared/src/transitions.ts` = `47 47`;
      anclas de `comentariosVigilados.test.ts` (`transitions.ts:348`, `:300`) intactas y su prueba en verde.
- [x] 1.6 Mutaciones (D6): M1 (quitar `tipoEvento` de `aprobacion`, `transitions.ts:202`, y de `:150`) y M2 (`'Logístico'`) rojas
      por `npm run typecheck` y `npx tsc -p packages/shared/tsconfig.json --noEmit` (línea base más uno; confirma la hipótesis de
      que el primero ve `transitions.ts`); M2b (`'Logístico' as never`) con `tsc` verde y `npx vitest run packages/shared/src/tipoEvento.test.ts`
      rojo; M3 (`aprobacion` a Operativo) rojo en esa misma prueba. Cada fichero restaurado y comprobado con `git diff --numstat`.
- [x] 1.7 Paquete del cliente (D9): `npm run build` antes (base `index-C7NdRWwC.js`, 418.292 bytes) y después; anotar la diferencia.
- [x] 1.8 Los cuatro códigos en una cadena: `npx vitest run`, `npm run typecheck`, `npx eslint .` (base 0 errores / 165 avisos) y,
      tras el commit, `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` en 0.
- [x] 1.9 `apply-progress.md` del lote 1 (rojos con salida, mutaciones, medida del intento) y commit.

## Lote 2 — servidor: el historial expone el tipo (intento 4)

- [x] 2.1 ROJO: `apps/desk/server/db/historialTipoEvento.test.ts` (D5; molde `eventoReasignacion.test.ts:35-49`) — los cinco
      escenarios de RQ-TZ-21; el de «la fila anterior se clasifica igual» compara las dos filas **y** exige Decisional. El de la
      creación nace verde y se valida con M6.
- [x] 2.2 VERDE: `HistoryEvent` con `tipoEvento?: … | null` en `types.ts:611`; `tipoEventoDeTransicion` en `historial.ts:3` y
      `tipoEvento` en `historial.ts:51`, derivado de `transition_id` y nunca de `values`. `eventoCreacion` y `historial.ts:143` sin cambio.
- [x] 2.3 Mutaciones: M4 (`json(fila.values)?.tipoEvento` antes), M5 (devolver `null` o resolver por `transition_name`) y M6
      (`eventoCreacion` con `tipoEvento: null`), cada una roja en `npx vitest run apps/desk/server/db/historialTipoEvento.test.ts`.
- [x] 2.4 Los cuatro códigos en una cadena (vitest, typecheck, eslint, detector tras el commit); `apply-progress.md` y commit.

## Cierre

- [x] 3.1 Verify (intento 5): criterios de éxito de la propuesta contra el código, M1-M6 reproducidas por el verificador.
- [x] 3.2 Archive (intento 6, regla del archivo): fusión por script comparando bloque a bloque —RQ-TS-44, RQ-TS-45 y RQ-TZ-21
      ADDED al final; §3.5 de `transitions-st` MODIFIED en su sitio—, medida antes de aplicar (≤ 800); `registro.test.ts` de nueve a ocho
      en curso con F1C-04 en «cerradas por archivo»; `archive-report.md` (una línea de cobertura de la fila y el texto para Supervisión
      de `transitions-soporte-remoto` y `transitions-equipo-nuevo`, D8); barrido de la regla de mutación 4 de D8 con su segundo pase;
      `RECONCILIACION.md` regenerado en la rama; `git show --numstat` del commit de archivo con sólo el cambio archivado.

## Tareas de persona (no cuentan; regla del ciclo 1)

Archivar no las da por hechas.

| Tarea | Dueño | Destino | Dónde queda escrita |
|---|---|---|---|
| Validar la tabla de 47 tipos | Gerencia | Antes de la parte de Decisionales de F1C-05 | `proposal.md` §10 y el parte del corte |
| Actualizar M1.3 (`R08.4.md:1656`) y M1.8 (`R08.4.md:1932`) | Supervisión → Gerencia | Expediente de la revisión siguiente del maestro | `archive-report.md` |
| Pruebas en la app: nada visible (sólo API), sin entrada en la lista acumulada | Gerencia | Al final, con el resto | `proposal.md` §4.5 |
| Lista semanal de supuestos S-1 a S-8 | Supervisión | Publicación semanal, con plazo de una semana | `proposal.md` §9 |

## Review Workload Forecast

| Lote | Bruto | ×1,8 | Riesgo frente a 400 |
|---|---|---|---|
| 1 (intento 3) | ~312 | ~560 | Alto: supera 400, bajo la válvula de 720 |
| 2 (intento 4) | ~106 | ~190 | Bajo |

Chained PRs recommended: No. Decision needed before apply: No. Entrega: una rama fusionada a `main` por el orquestador tras una parada humana, sin PR.
