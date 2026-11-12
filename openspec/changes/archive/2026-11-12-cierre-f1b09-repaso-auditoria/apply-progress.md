# Apply · `cierre-f1b09-repaso-auditoria` (F1B-09, `cierra: si`)

**Fecha:** 2026-11-12 · **Partida del intento:** `4594beb0` · **Escrito por el orquestador**, con cifras medidas por él.

## Qué se hizo

- **El repaso**, `docs/sdd/F1B-09_Repaso_auditoria_2026-11.md`, nuevo: las cifras, el contraste apartado por apartado, lo que la
  auditoría declaró no haber hecho y la lista de discrepancias, con la lista para Supervisión y el texto nuevo para M11.6.
- **La cifra de transiciones**, medida con el guion de `design.md` (D2) sobre `87510cbf` y sobre `0d1a40b` exportado con
  `git archive`: 40 + 7 + 5 = **52** hoy y 31 + 6 + 4 = 41 el 05/10. Las once nuevas son de la épica 1C, atribuidas por el primer
  commit que introduce cada id (`git log -S`).
- **Dieciséis discrepancias**, todas con destino «bandeja»; ninguna cae en F1B-16, F1B-17 ni F1B-20, y ninguna queda sin destino.
  No hubo que parar por una pregunta de alcance.
- **Forma de las citas:** las 148 del repaso, leídas con un guion propio en su ancla (fichero, rango y extremos no vacíos): 0
  rotas tras corregir una (un rango de `apps/desk/server/services/ticketService.ts` que empezaba en una línea vacía).

## `strict_tdd`

El lote es documental: el repaso no tiene prueba que escribir antes, y no se fabrica una (`design.md`, D5). La única pieza con
código, la de `apps/desk/server/reconciliacion/registro.test.ts`, ve su rojo en el intento de archivo, cuando la carpeta pasa a
`archive/` (`design.md`, D4).

## Medidas del guion, por flujo

| Flujo | Hoy | `0d1a40b` |
|---|---|---|
| Servicio técnico | 40 transiciones, 23 estados, sin salida `Finalizado` y `Anulado`, 29 con algún obligatorio | 31, 20, sólo `Finalizado`, 21 |
| Equipo nuevo | 7, 6, ídem, 1 (la anulación) | 6, 5, sólo `Finalizado`, 0 |
| Soporte remoto | 5, 5, ídem, 1 (la anulación) | 4, 4, sólo `Finalizado`, 0 |
| Unión | 52, ids únicos; 26 estados, iguales a `ESTADOS` | 41; 23 |

## Códigos

Se corren en la cadena de cierre del intento, con el commit; sus cifras van al registro del intento.
