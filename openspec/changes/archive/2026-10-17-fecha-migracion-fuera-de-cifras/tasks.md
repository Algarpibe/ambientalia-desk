# Tareas — `fecha-migracion-fuera-de-cifras` (F1F-01, `cierra: no`)

Un intento de aplicación con techo 800 (válvula 720). Cada intento se asienta sólo si sus códigos salen 0.

## Lote 1 · `packages/shared` (RQ-TC-69; diseño §1)

- [x] 1.1 **Rojo.** `packages/shared/src/cierreEnCifras.test.ts` con las cinco funciones y las fronteras de S-1 y S-3.
- [x] 1.2 **Verde.** `packages/shared/src/cierreEnCifras.ts` y una línea de export al final de `index.ts`.
- [x] 1.3 `ContactDetail` y `AccountDetail` ganan `resolucionPromedioMs: number | null` en sus líneas (`types.ts:617`, `:618`).

## Lote 2 · Servidor y cliente (diseño §2-§3)

- [x] 2.1 **Rojo.** `apps/desk/server/cierreMigracionEnCifras.test.ts`: Análisis, detalle de cuenta y contacto, informe de
  contrato e indicadores; e invertir `migracionMarcadorLectores.test.ts:54-60` (S-5).
- [x] 2.2 **Verde.** `apps/desk/server/db/cierresDeMigracion.ts` (nuevo).
- [x] 2.3 **Verde.** `analisis.ts`, `directory.ts`, `informeContrato.ts` e `indicadores.ts` del servidor, en sitio (diseño §3).
- [x] 2.4 **Cliente (sin rojo previo: `.tsx` fuera de la red, F0-00).** `ClienteDetalle.tsx:123-128` sólo formatea.
- [x] 2.5 **Regla de mutación 3**, tabla en `apply-progress.md`.
- [x] 2.6 **Cierre del intento.** test, typecheck, lint (165 avisos como máximo), detector `--sha HEAD` y build, cada código por
  separado; medida con `git diff --shortstat --no-renames` contra el commit de partida.

## Cierre del cambio

- [x] 3.1 Mutaciones M-1 a M-6 de `design.md` §7, cada una vista en rojo y restaurada.
- [x] 3.2 Regla de mutación 4: barrido de citas a los ficheros tocados; ninguna línea insertada en los muy citados.
- [x] 3.3 `verify-report.md` contra spec, diseño y tareas.
- [x] 3.4 Archive: fusión del delta por script en `openspec/specs/tickets-core/spec.md`, `archive-report.md`; parte revisable
  medida ANTES; `git show --numstat` sólo del cambio.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño |
|---|---|---|
| P-1 | Tras la migración real, comprobar en Análisis que los «Entregado» sin fecha de Zoho no salen como finalizados del día de la migración | Quien despliega, con Gerencia |
| P-2 | Revisar S-1 a S-6 en la lista semanal (E-237) | Gerencia |
| P-3 | Decidir los dos hallazgos de la ficha de cliente (proposal §4) | Gerencia |
