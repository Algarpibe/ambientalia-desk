# Progreso del apply — `creacion-manual-49` (F1F-05, `cierra: no`)

Lote L1, intento 3, en el worktree `C:\dev\Desk_2_R1.023-worktrees\creacion-manual-49`. Base `186c2fe4`; commit del código
`002480fc`. `strict_tdd`: rojo visto y anotado antes del verde.

## L1.1 · Línea base

`indicadoresSeptiembre.test.ts` e `indicadoresComparacionSeptiembre.test.ts` en `186c2fe4` (sobre `f0df7ebf`, que sólo añade
`.md`): 2 ficheros, 33 pruebas, todas en verde.

## L1.2 y L1.3 · Rojo

Ediciones en su sitio, sin insertar ni borrar líneas, con la siembra todavía en `t.creado`:

- `apps/desk/server/testing/septiembre2026.ts:11`: `fechaCreacionTicket: string | null` tras `creado`; `:19`, la clave en
  `CLAVES_DEL_FIXTURE` tras `'creado'`.
- Trece tickets: `fechaCreacionTicket` = `creado` en nueve; `'2026-05-20'` en 940, `'2026-05-21'` en 941, `null` en 957 y 972.
- `'49'`: 940 de 15 a 6 (`:28`), 941 de 15 a 5 (`:30`), 972 de 2 a `null` (`:40`); 957 ya era `null`.
- Comentarios `:6` y `:52` reescritos en su misma línea (D1).
- `apps/desk/server/routes/indicadoresSeptiembre.test.ts:43` y
  `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts:23`: el 49 de 9 a 8.

## L1.4 · Rojo observado (11 de 33), igual que D3

- RQ-KP-38, indicador 49: `['sep-03: Gerencia 6, Desk 15', 'sep-04: Gerencia 5, Desk 15']` en vez de `[]`. Los otros siete
  indicadores, en verde.
- RQ-KP-42: `ticketsVariante` da `{ comparados: 13, coincidentes: 11, porcentaje: 84.6 }`; el 49 da 8 comparados, 6
  coincidentes y 75 %; las ocho mutaciones por celda dan 10 coincidentes en vez de 12.
- La prueba de claves sigue en verde.

Causa: Desk calcula el 49 desde `fecha_creacion_ticket`, sembrado aún con `creado` (07/05), y Gerencia lo mide desde el campo
manual (20/05 y 21/05).

## L1.5 · Verde

`apps/desk/server/testing/septiembre2026.ts:60`: el 9.º valor pasa de `t.creado` a `t.fechaCreacionTicket`. El 5.º
(`${t.creado}T17:00:00Z`, `created_time`) no cambia. Resultado: 33 de 33. La prueba del 998
(`apps/desk/server/routes/indicadoresSeptiembre.test.ts:36`) mira `creado` y sigue igual (S-5).

## L1.6 · Mutación M1

Se vuelve a poner `t.creado` en el 9.º valor de `:60`. Rojo, 11 de 33, el mismo que en L1.4: el 49 de 940 y 941 cae.

El 972 no lo caza, porque Gerencia da `null` y esa celda no se compara. Se restauró con copia: `cmp` es idéntico y vuelve el
verde.

## L1.7 · Mutación M2

Se quita `'fechaCreacionTicket'` de `:19`. Cae la prueba de claves
(`apps/desk/server/routes/indicadoresSeptiembre.test.ts:55-63`) con `expected [ 'fechaCreacionTicket' ] to deeply equal []`.
Se corta en el primer ticket porque el bucle se detiene en el primer `expect`. Restaurada con `cmp` idéntico; tras las dos
mutaciones, 33 de 33.

## L1.8 · Colocación

- `wc -l`, igual que en `186c2fe4`: fixture 63, `indicadoresSeptiembre.test.ts` 64 e `indicadoresComparacionSeptiembre.test.ts`
  109.
- `git diff -U0 186c2fe4 -- apps`: ningún hunk con distinto número de líneas a cada lado. 23 inserciones y 23 borrados en tres
  ficheros.
- `git diff --stat 186c2fe4 -- packages apps/desk/src`: vacío (D4).
- `openspec/specs/kpis/spec.md:1776` cita `septiembre2026.ts:55-63`, y sigue cayendo en `sembrarSeptiembre` (`:55`) y en su
  llave de cierre (`:63`).

## L1.9 · Cadena (sobre `002480fc`, en serie y en primer plano)

| Paso | Resultado |
|---|---|
| `npm run typecheck` | 0 |
| `npm run lint` | 0 (0 errores, 165 avisos) |
| Detector de citas `--sha HEAD` | 0. Comprobadas 7.519; 13 abreviadas rotas, informativas |
| `npm test` (log `npmtest-213649.log`) | 0. 317 ficheros y 5.520 pruebas en verde, 389 s |

## Medida

Código: 23 líneas medidas con `git diff --shortstat --no-renames`. A eso se suman este informe y las casillas de `tasks.md`, y
la medida final va en el registro del intento.
