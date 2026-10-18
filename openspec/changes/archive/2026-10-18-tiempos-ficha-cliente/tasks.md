# Tareas — `tiempos-ficha-cliente` (F1F-03, `cierra: no`)

Un intento de aplicación con techo 800 (válvula 720). Se asienta sólo si sus códigos salen 0. Ninguna línea insertada en
un fichero existente salvo al final de `cierreEnCifras.ts` (diseño D1, D2, D3, D4).

## Lote 1 · La ventana en shared y en el servidor (diseño D1, D2, D4)

- [x] 1.1 **Rojo.** `packages/shared/src/ventanaResolucion.test.ts` (nuevo): fuera de la ventana, límite inferior, cierre
  de la migración dentro de la ventana, constante en 6. Verlos en rojo.
- [x] 1.2 **Rojo.** `apps/desk/server/fichaClienteVentana.test.ts` (nuevo): detalle de cuenta y de contacto con `ahora`
  fijo, un ticket dentro y otro fuera; cuenta sin cierres en la ventana da `null`. Verlos en rojo.
- [x] 1.3 **Verde.** `cierreEnCifras.ts` (D1) y `directory.ts` (D2); las seis llamadas existentes con `ahora` fijo, en
  sitio (D4).
- [x] 1.4 **Mutaciones** M0-M5 de D5, cada una en rojo y restaurada; anotar qué prueba cae.

## Lote 2 · La ficha (diseño D3)

- [x] 2.1 `apps/desk/src/components/ClienteDetalle.tsx:2`, `:75`, `:126`, `:192-194` en sitio. Sin prueba automatizada
  (F0-00).
- [x] 2.2 **Cierre del intento.** test, typecheck, lint (165 avisos como máximo), commit y detector `--sha HEAD` en una
  cadena; `wc -l` igual en los ficheros existentes salvo `cierreEnCifras.ts`; medida `git diff --shortstat --no-renames`
  contra el commit de partida; build para medir el bundle.

## Cierre del cambio

- [x] 3.1 Regla de mutación 4: barrido de citas de los ficheros tocados.
- [x] 3.2 `verify-report.md` contra spec, diseño y tareas.
- [x] 3.3 Archive: RQ-TC-70 al final de `openspec/specs/tickets-core/spec.md` por script, `archive-report.md`; parte
  revisable medida ANTES; `git show --numstat` sólo del cambio; `RECONCILIACION.md` en la rama.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Revisar S-1 a S-5 en la lista semanal de supuestos | Gerencia | `proposal.md` §4 · `decision/supuestos-semanales-aceptacion` |
| P-2 | Definir «primera respuesta» y «respuesta» si se quieren calcular (S-2) | Gerencia | `proposal.md` §4, S-2 |
| P-3 | Verificación de persona de la ficha tras el despliegue (RQ-TC-70, último escenario) | quien despliegue | `openspec/specs/tickets-core/spec.md`, RQ-TC-70 |
