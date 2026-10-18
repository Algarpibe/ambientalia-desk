# Tareas — `espera-y-areas-equipo-nuevo` (F1B-09, `cierra: no`)

Un intento de aplicación con techo 800 (válvula 720). Se asienta sólo si sus códigos salen 0. Ninguna línea insertada en
`estados.ts` ni en `transitions.ts` (diseño D1, D2).

## Lote 1 · Pruebas en rojo (diseño D3)

- [x] 1.1 **Rojo.** `packages/shared/src/estados.test.ts` en sitio: 6 `externa`, 11 `ninguna`, `sin_clasificar` vacío, las
  doce, `Solicitud Soporte` `ninguna`.
- [x] 1.2 **Rojo.** `apps/desk/src/lib/esperaE226.test.ts` (nuevo): `Pendiente` en «Espera».
- [x] 1.3 **Rojo.** `apps/desk/server/reconciliacion/esperasContraRegistro.test.ts` (nuevo).
- [x] 1.4 `packages/shared/src/comentariosVigilados.test.ts`, caso (f), al final del fichero.

## Lote 2 · Verde (diseño D1, D2)

- [x] 2.1 `estados.ts:101-105` con el dato; ver en rojo el caso (f) con los comentarios sin tocar.
- [x] 2.2 `estados.ts:21`, `:28`, `:60`, `:88`, `:115` en sitio; `sla.test.ts:45`, `:49`, `:51` en sitio.
- [x] 2.3 `comprobaciones.ts:154` a `export`, en sitio.
- [x] 2.4 `transitions.ts:347-348`; `invariantesGrafo.test.ts:215`, `permisos.test.ts:212`, `avisoArea.test.ts:43` en sitio.
- [x] 2.5 **Mutaciones** M0-M7 de D4, cada una restaurada; anotar qué prueba cae.
- [x] 2.6 **Cierre del intento.** test, typecheck, lint (165 avisos como máximo), commit y detector `--sha HEAD`; `wc -l`
  igual en los ficheros existentes; medida `git diff --shortstat --no-renames` contra el commit de partida; build para el
  bundle.

## Cierre del cambio

- [x] 3.1 Regla de mutación 4: `wc -l` igual en los ficheros tocados; barrido de citas a `estados.ts` y `transitions.ts`.
- [x] 3.2 `verify-report.md` contra spec, diseño y tareas.
- [x] 3.3 Archive: fusión de los deltas por script; en sitio, sin bloque RQ, `transitions-st` §3.7 (`:1188`, `:1191`,
  `:1209-1211`) y `transitions-equipo-nuevo` `:109`; `archive-report.md`; parte revisable medida ANTES; `git show
  --numstat` sólo del cambio; `RECONCILIACION.md` en la rama.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Revisar S-1 a S-5 en la lista semanal de supuestos | Gerencia | `proposal.md` §4 · `decision/supuestos-semanales-aceptacion` |
| P-2 | Actualizar IV-9 en `CLAUDE.md` y `cifras_ancladas.esperas` en `openspec/config.yaml` | Supervisión | informe de la tanda |
