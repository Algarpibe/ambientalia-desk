# Tareas — `busqueda-cliente-y-codigo` (F1F-03, `cierra: no`)

Un intento de aplicación con techo 800 (válvula 720). Se asienta sólo si sus códigos salen 0. Ninguna línea insertada en
un fichero existente (diseño D2).

## Lote 1 · Búsqueda por código y cliente (diseño D1, D3, D5)

- [ ] 1.1 **Rojo.** `packages/zoho-sync/src/db/busquedaClienteCodigo.test.ts` (nuevo) con los escenarios de RQ-VT-17:
  código, cuenta de Desk, cliente de Books, provisional no enlazado y enlazado, contacto fuera, número sin cambio, y la
  de posición (activos, cerrados y recuento). Verlos en rojo los que piden la vía nueva, y en verde los de «no sale».
- [ ] 1.2 **Rojo.** `apps/desk/server/db/busquedaClienteConfrontacion.test.ts` (nuevo): la tabla de D3 contra
  `searchClients` y `normalizarNombreCliente`, y el provisional por `ticketsConCliente`.
- [ ] 1.3 **Verde.** `packages/zoho-sync/src/db/busquedaTickets.ts:21` con las cinco vías; comentarios en sitio (`:4`,
  `:9-11`); `packages/shared/src/busquedaTickets.ts:1-3`, `:11-13`, `:24-26` en sitio.
- [ ] 1.4 **Mutaciones** de D5, cada una en rojo y restaurada; anotar qué prueba cae.

## Lote 2 · La caja (diseño D4)

- [ ] 2.1 `apps/desk/src/components/BuscadorTickets.tsx:6-8`, `:21-22` en sitio: «Buscar por número, serial, cliente o
  código». Sin prueba automatizada (F0-00).
- [ ] 2.2 **Cierre del intento.** test, typecheck, lint (165 avisos como máximo), commit y detector `--sha HEAD` en una
  cadena; `wc -l` igual en los tres ficheros existentes; medida `git diff --shortstat --no-renames` contra el commit de
  partida; build para medir el bundle.

## Cierre del cambio

- [ ] 3.1 Regla de mutación 4: `wc -l` igual en los ficheros tocados, así que ninguna cita se desplaza.
- [ ] 3.2 `verify-report.md` contra spec, diseño y tareas.
- [ ] 3.3 Archive: fusión del delta por script (RQ-VT-11 en sitio, mismo número de líneas; RQ-VT-17 al final),
  `archive-report.md`; parte revisable medida ANTES; `git show --numstat` sólo del cambio; `RECONCILIACION.md` en la rama.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Revisar S-1 a S-4 en la lista semanal de supuestos | Gerencia | `proposal.md` §4 · `decision/supuestos-semanales-aceptacion` |
| P-2 | Verificación de persona de la caja tras el despliegue (RQ-VT-17, último escenario) | quien despliegue | `openspec/specs/vistas-tablero/spec.md`, RQ-VT-17 |
