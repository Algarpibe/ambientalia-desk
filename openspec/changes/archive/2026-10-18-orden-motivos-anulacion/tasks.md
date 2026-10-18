# Tareas — `orden-motivos-anulacion` (F1C-01, `cierra: no`)

Cuatro intentos (propuesta §8), cada uno con techo 800, salvo el archive, que pide techo por la mudanza (regla del
archivo). Un intento sólo se asienta si test, typecheck, lint y el detector de citas salen 0. Rojo antes de cada verde
(`strict_tdd`).

## Intento 1 · Planificación

- [x] 1.1 `proposal.md` con la medición, la tabla de la regla 13, las mutaciones M1-M4 y los supuestos SA-1 a SA-4.
- [x] 1.2 Delta de `transitions-st`: ADDED `RQ-TS-41`, sin MODIFIED.
- [x] 1.3 `design.md` (D1-D6) y este `tasks.md`.

## Intento 2 · Aplicar (D1-D5)

- [x] 2.1 **Rojo.** `packages/shared/src/anulacion.test.ts`: import ampliado en sitio (`:4`) y un `describe` nuevo al
  final con las seis pruebas de D5. Correr la suite y comprobar que fallan por la función ausente.
- [x] 2.2 **Verde.** `motivosAnulacionOrdenados(estado)` al final de `packages/shared/src/anulacion.ts` (D1), con las
  dos esperas nombradas y sin importar valores de `transitions.ts`.
- [x] 2.3 **Mutaciones.** Reproducir M1-M4 de la propuesta §5 y la copia defensiva de D5 sobre la función, una a una;
  cada una pone la suite en rojo; anotar el nombre de la prueba que cae y restaurar.
- [x] 2.4 **Consumo.** `apps/desk/src/components/TransitionPanel.tsx`: los dos nombres en el import de `:8` y la
  sustitución de `f={f}` en `:163` (D3). El fichero sigue con 267 líneas.
- [x] 2.5 **Cierre del intento.** `npm test`, `npm run typecheck`, `npm run lint` y el detector de citas en 0;
  `apps/desk/server` sin cambios (`git diff --stat`); medida con `git diff --shortstat --no-renames` más lo nuevo sin
  trackear.

## Intento 3 · Verify

- [x] 3.1 `verify-report.md` contra `RQ-TS-41`, este `tasks.md` y la evidencia TDD del intento 2.

## Intento 4 · Archive

- [x] 4.1 Fusión del delta por script: `RQ-TS-41` al final de `openspec/specs/transitions-st/spec.md`, bloque idéntico
  al del delta (comparado con `diff`).
- [x] 4.2 Barrido de citas de D6 (regla de mutación 4) sobre `anulacion.ts`, `anulacion.test.ts` y la spec viva.
- [x] 4.3 `archive-report.md` con la tabla de la regla 13, la línea de lo que cubre de F1C-01 y lo que deja fuera, y la
  medida de la parte revisable (≤ 800, regla del archivo).
- [x] 4.4 Mudanza de la carpeta a `openspec/changes/archive/2026-10-18-orden-motivos-anulacion/`, `RECONCILIACION.md`
  regenerado en la rama, cuatro códigos en 0 y `git show --numstat` del commit de archivo (sólo este cambio).

## Fuera del recuento — de personas, archivar NO las da por hechas

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Revisar SA-1 a SA-4 en la lista semanal | Gerencia | `proposal.md` §6 |
| P-2 | Comprobar tras el despliegue que en las dos esperas el desplegable abre con «Repuesto no disponible» | quien despliegue | `archive-report.md` |
