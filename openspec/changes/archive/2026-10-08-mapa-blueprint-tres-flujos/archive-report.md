# Archive · `mapa-blueprint-tres-flujos` (F1B-09, `cierra: no`)

**Fecha:** 2026-10-08 · **Rama:** `mapa-blueprint-tres-flujos` · **Partida:** `a26ed48` · **Informe escrito por el orquestador**, con cifras
medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-09 cubre, en una línea:** el mapa generado del blueprint y su prueba contra el desfase pasan a cubrir los
tres flujos (servicio, equipo nuevo y soporte remoto), que es el hallazgo E-222 de la auditoría. **Deja fuera** el resto de hallazgos
de esa auditoría (E-223 a E-230) y el cierre de la fila, que la propia decisión mantiene abierta; por eso declara `cierra: no`.

## Qué decisión construye

`decision/e222-mapa-equipo-nuevo-soporte-remoto` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), de 2026-10-06: «Ahora, en
F1B-09.» Su consecuencia (5) fija que F1B-09 sigue con `cierra: no` mientras la épica 1B esté abierta.

## Qué quedó construido

- **Motor** (`packages/shared/src/mapaBlueprint.ts`): `EntradaMapa` gana tres campos opcionales (`nombreFlujo`, `nombreFicheroCompleto`,
  `fuentes`); sin ellos la salida es la de servicio de siempre. La cabecera de «generado» es una sola plantilla. La guarda de fase
  corre sólo si el flujo declara fases (`packages/shared/src/mapaBlueprint.ts:230`).
- **Registro por flujo** (`packages/shared/src/mapaPorFlujo.ts`, nuevo y puro): construye la entrada del motor para cada clave de
  `CATALOGO_POR_FLUJO` (`packages/shared/src/mapaPorFlujo.ts:78`). Los estados de equipo nuevo y soporte remoto se derivan de su
  catálogo (`packages/shared/src/mapaPorFlujo.ts:58-60`); servicio conserva su lista para no cambiar sus cuatro ficheros. Un cuarto
  flujo sin complemento rompe `tsc` (`packages/shared/src/mapaPorFlujo.ts:25`) y, en ejecución, lanza.
- **Guion** (`scripts/generar-mapa-blueprint.ts`): escribe lo que devuelve el registro. Sus líneas 1 a 35 no cambian; la llamada de
  servicio que contienen queda como contraste y el guion se detiene antes de escribir si difiere del registro.
- **Dos mapas nuevos**, generados por el guion: `docs/artefactos/blueprint-equipo-nuevo.md` (5 estados, 7 aristas) y
  `docs/artefactos/blueprint-soporte-remoto.md` (4 y 4). Los cuatro de servicio son idénticos a los de `a26ed48`.
- **Prueba contra el desfase** de los tres flujos, al final de `packages/shared/src/mapaBlueprint.test.ts`: compara lo generado con lo
  commiteado y es exhaustiva en los dos sentidos (falta, difiere, sobra).
- Lo único escrito a mano de los dos flujos nuevos es su nombre, el nombre de su fichero y la frase de fuentes de la cabecera
  (`packages/shared/src/mapaPorFlujo.ts:38-40` y `packages/shared/src/mapaPorFlujo.ts:47-49`). Ninguna lista de transiciones ni de estados.
- Sin esquema, sin variables, sin relleno, sin tocar `apps/`.

Rama contra `a26ed48`, antes de este archivo (`71af685`): 18 ficheros, +1.838/−31. Código sin pruebas: 5 ficheros, +146/−20.

## Intentos

| # | Unidad | Commits | git | registro |
|---|---|---|---|---|
| — | Planificación (fuera de intento) | `e026903` | 1.081 | — |
| 1 | Apply, lotes 1 a 3 | `c58fa88` | 749 | 749 |
| 2 | Verify (PASS con avisos) | `d16e445` | 160 | 160 |
| 3 | Remediación de supervivientes | `71af685` | 51 | 51 |

**El intento 1 pasó la válvula de 720 y quedó bajo el techo de 800.** De las 749 líneas, 154 son las 77 casillas marcadas de
`tasks.md`. El punto de control tras el lote 2 medía 423.

## Verify y mutaciones

- El verify formal (`d16e445`) es **posterior al último cambio de producción** (`c58fa88`). Después sólo se añadieron pruebas.
- **Mutaciones del orquestador sobre `c58fa88`: 12, todas en rojo.** Entre ellas, una del catálogo de cada flujo sin regenerar (6, 4 y 4
  pruebas en rojo) y una del fichero vigilado de cada flujo (5, 4 y 4).
- **Mutaciones del verify: 22, con 5 supervivientes.** Tres se cerraron con prueba en `71af685` y se comprobó que ahora caen: la
  guarda condicionada a la tabla y no a las fases (1 roja), la rama «sobra en disco» anulada (3) y las fuentes ignoradas en la vista
  por fase (1). Dos quedan declarados sin prueba: mover la guarda al final sólo cambia qué error sale primero, y el guion queda fuera
  de `vitest`.
- **Ruido conocido:** un desfase en un flujo tira también dos pruebas de los flujos sanos. No es falta de discriminación.
- Las 15 mutaciones del apply las ejecutó el agente; el orquestador no las repitió una a una, hizo las suyas.

## Fusión del delta

Por script (`fusiona.mjs`, fuera del repositorio), con comprobación de identidad: **7 bloques, 6 `MODIFIED` y 1 `ADDED`**, idénticos al
delta. La spec viva pasa de 184 a 335 líneas.

| Bloque | Qué cambia |
|---|---|
| RQ-MB-01 | La CLI escribe lo que da el registro; la llamada heredada es contraste |
| RQ-MB-03 | De cuatro a seis ficheros; los de servicio, byte a byte |
| RQ-MB-04 | La guarda de fase rige sólo con fases declaradas |
| RQ-MB-05 | Leyenda en el diagrama completo de cada flujo |
| RQ-MB-06 | La prueba cubre todos los flujos y es exhaustiva sobre las claves del catálogo |
| RQ-MB-07 | Redacción: «de servicio» |
| RQ-MB-08 (nuevo, desde `openspec/specs/mapa-blueprint/spec.md:277`) | Un mapa por flujo desde `CATALOGO_POR_FLUJO`, estados derivados |

- La tabla de cabecera de la spec viva se puso al día en sitio (tres líneas, mismo recuento): nombra los seis ficheros, la tanda que
  la extiende y la dependencia de `packages/shared/src/flujos.ts`. No va en el delta porque el script sólo sustituye bloques.
- No hay capacidad nueva: `mapa-blueprint` ya estaba en `capabilities` (R-2).

## Citas (regla de mutación 4)

- **Ficheros de código:** el guion no cambia antes de su línea 36 y la prueba sólo crece por el final, así que ninguna cita por línea a
  ellos se desplaza. `packages/shared/src/estados.ts`, `docs/artefactos/NOTA.md` y la auditoría de F1B-09 se editaron en sitio, a cero
  líneas netas.
- **Spec viva:** crece desde dentro del bloque de RQ-MB-01, que empieza en la línea 21 y no se mueve. La única cita por línea desde fuera del archivo, la de `docs/sdd/ENTRADA.md` a la línea 21, sigue
  apuntando a la cabecera de RQ-MB-01. Barrido hecho ANTES de fusionar, con `ENTRADA.md` y `config.yaml` incluidos.
- **Tres citas de cambios archivados quedan sin tocar** (`generador-mapa-blueprint`, `tres-transiciones-cifra-anclada` y
  `rechazo-solo-comercial`): apuntan a rangos de la spec que esta fusión desplaza o reescribe. Describen el estado de su fecha y no se
  leyeron una a una; piden el mismo barrido propio que las 24 de la tanda anterior.
- **Para Supervisión, sin tocar a propósito:** `openspec/config.yaml` (en la ficha de la decisión) y `docs/sdd/ENTRADA.md` (E-222) citan
  líneas del guion y de la prueba afirmando que el guion «sólo pasa el catálogo de servicio». Las líneas existen y dicen lo mismo que
  antes, pero la frase ya no describe lo que el guion escribe: les corresponde el ancla `a26ed48`. La rama no toca esos ficheros.

## Avisos que quedan

- **Fin de línea:** en Windows el guion escribe LF sobre un árbol en CRLF; tras regenerar, `git status` marca ficheros sin diferencia de
  contenido. Es anterior a este cambio. La prueba lo tolera.
- **Escenarios con evidencia sólo estructural:** que el motor no importa `permissions.ts` y que la CLI delega (el guion no entra en
  `vitest`).
- **El nombre de cada flujo queda escrito en dos sitios** (`packages/shared/src/mapaPorFlujo.ts` y la tabla privada de
  `packages/shared/src/flujos.ts:127-131`). Unificarlos exige exportar esa tabla; quedó fuera.

## Medida de este archivo (regla del archivo)

Parte con carga de revisión, medida con `git diff --shortstat --no-renames` antes de mover la carpeta: fusión del delta más la tabla de
cabecera 243 (197 + 46), y este informe. La mudanza de la carpeta no tiene carga de revisión.

**Total medido antes de mover: 371** (243 en la spec viva más las 128 líneas de este informe), bajo 800.

## Consecuencia en el avance

Ninguna en el numerador: `cierra: no`. F1B-09 sigue en curso.

## Hallazgos de la auditoría de F1B-09 tras este cambio

| | Estado |
|---|---|
| E-222 | Resuelto por este cambio. La bandeja sigue marcándolo abierto: lo actualiza Supervisión |
| E-225 | Decidido (`decision/e225-columna-propia-dos-estados`): cambio propio con `tanda: F1B-08`. No va aquí (R-4) |
| E-223, E-224, E-226, E-227, E-228, E-230 | Abiertos, sin decisión registrada en `openspec/config.yaml` |
| E-229 | Corregido como trabajo documental directo, según la bandeja |

## Tareas de personas — archivar NO las da por hechas

| | Quién | Qué |
|---|---|---|
| T-P1 | Supervisión | Marcar E-222 y anclar a `a26ed48` las citas sin ancla de `openspec/config.yaml` y `docs/sdd/ENTRADA.md` al guion y a la prueba |
| T-P2 a T-P4 | Gerencia y Supervisión | Las de `tasks.md`, «Tareas de personas»: la corrección de M11.6 en el maestro y las dos specs que aún remiten el mapa a F1B-09 |
| T-P5 | Analista | Mirar cómo se dibujan los dos diagramas nuevos; nadie los ha renderizado |
