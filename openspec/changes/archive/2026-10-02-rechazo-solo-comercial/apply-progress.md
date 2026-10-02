# Apply-progress: rechazo-solo-comercial (F1C-10)

Un lote, fases 1 a 6 (salvo 6.3, que es posterior al archive). Modo strict TDD. Partida `06d1fa1`.

## Evidencia del ciclo TDD

| Tareas | ROJO (natural, antes de tocar `transitions.ts:236`) | VERDE | REFACTOR |
|---|---|---|---|
| 1.1 cifras 55/38 | `permisos.test.ts` matriz de área: «expected length 55 but got 54» | 2.1 | n/a |
| 1.2 compuesta 56/37 | «expected length 56 but got 55» | 2.1 | n/a |
| 1.3 invariante 5 (siete) | «expected {…(8)} to deeply equal {…(7)}» | 2.1 | n/a |
| 1.4 403 a mano | Servicio Técnico en `rechazo_cliente`: «expected 200 to be 403» | 2.1 | n/a |
| 1.5 Comercial/admin | `200` verde ya hoy (anotado, no forzado); rojo sólo la traza: `area` guardaba `Comercial / Servicio Técnico` | 2.1 | n/a |
| 1.6, 1.8 | Verdes desde el principio, por diseño (guardianes de M-2 y del 744) | sin cambio | n/a |
| 1.7 catálogo | `rechazo_cliente` área `Comercial / Servicio Técnico` ≠ `Comercial` | 2.1 | n/a |
| 1.9 avisos | `areasSiguientes` incluía Servicio Técnico; `areasAAvisar` daba `['Compras','Servicio Técnico']` | 2.1 | n/a |

RED 1.10: 8 pruebas rojas en 3 ficheros (1.1, 1.2, 1.3, 1.4, 1.5-traza, 1.7, 1.9 ×2); anti-desfase aún verde.
GREEN 2.1: una cadena en `transitions.ts:236`; los tres ficheros pasan (75/75). El anti-desfase (`packages/shared/src/mapaBlueprint.test.ts`,
no `apps/desk/server/`) se puso rojo natural, y `npm run generar-mapa-blueprint` lo devolvió a verde: el diff del mapa son
exactamente tres líneas en tres ficheros (`blueprint-completo.md:54`, `-fase-2-diagnostico.md:44`, `-fase-3-cierre.md:22`,
`[C][ST]` → `[C]`); `blueprint-fase-1-entrada.md` sin cambio de contenido (sólo aviso LF/CRLF del generador).

## Work Unit Evidence

Prueba focal: `npx vitest run` de los cuatro ficheros, 90 verdes. Arnés real: `403`/`200` escritos a mano contra el servidor de prueba (describe F1C-10). Vuelta atrás: revertir el commit.

## Mutaciones (reproducidas y revertidas; `git diff` de `transitions.ts` vuelve a una línea)

| Mut. | Rojo observado |
|---|---|
| M-1 devolver `:236` | 9 rojos: matriz 55/38, compuesta 56/37, invariante 5, catálogo a mano, `403`, traza, `areasSiguientes`, `areasAAvisar`, anti-desfase |
| M-2a `Comercial` en `:234` | 6 rojos: cifras (2), invariante 5, catálogo a mano, `200` de Servicio Técnico (1.6), anti-desfase |
| M-2b `Comercial` en `:238` | los mismos 6 |
| M-3 `[C][ST]` a mano en cada `.md` | anti-desfase rojo en cada uno de los 3 ficheros; regenerado, diff idéntico a 2.3 |
| M-4 restaurar la entrada en el literal `:103` | rojo en invariante 5 |

Escenarios 2.5 (por lectura): `ticketService.ts:155` guarda el área vigente al ejecutar, así que las trazas históricas la conservan; invariante 6 y pruebas de 31 entradas verdes.

## Regla 13 (casilla)
Decisión del cliente: ocultar «Rechazo» en Notificación cliente a quien no es Comercial (`TransitionPanel.tsx:56-58`). Línea del servidor que la impone:
`ticketService.ts:129-130` (área) y `:131` (cargo); probada por `permisos.test.ts:41-67` y el `403` nuevo a mano. Ningún `.tsx` cambia.

## Barrido de citas (regla de mutación 4)

Ninguna línea se movió (todos los hunks de `-U0` tienen el mismo número de líneas antes y después; lo nuevo va al final). Barrido completo
(`transitions|invariantesGrafo.test|permisos.test|avisoArea.test .ts:NNN`, 372 citas fuera de `archive/**`): las 25 que tocan rangos editados se leyeron una a
una: histórico/fechado (caso B, ancladas a `fd253aa` o paquetes fechados, no se tocan) o presente y aún cierto (`permisos.test.ts:26-27`, `:24-27`;
`invariantesGrafo.test.ts:91-106` sigue siendo el emparejamiento). Abreviadas y forma corta («ocho compartidas», `54/39`): las vivas se corrigen por delta en el archive;
`transitions-st/spec.md:63` en `4984c3b` y `:1630` se editaron en sitio (6.1, 6.2), `:1545` y `Estado_As-Built_2026-09-09.md:40` son caso B. Casos C: ninguno.
Detector `cli.ts --sha HEAD` en `9aed944`: salida 0, 0 bloqueantes, línea base 0, cabeceras R-1 inválidas 0, 10 abreviadas rotas informativas ajenas.

## Cierre
`npm test` 2423 verdes (antes 2415), 1 rojo previo e idéntico en la partida: `registro.test.ts` «en curso son exactamente SEIS» (cuenta F1C-10 mientras
su carpeta está en `changes/`; se resuelve al archivar, no es de esta tanda). Typecheck verde. Lint 165 avisos antes y después. Build verde.
Medida (`git diff --shortstat --no-renames 06d1fa1` sin este fichero): 9 ficheros, 143 inserciones, 52 borrados (195); este fichero 57 nuevas sin trackear.
Pendiente: 6.3 (tras el archive); tarea de persona (verificación en la app) fuera del recuento.
