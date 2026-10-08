# Progreso del apply: `mapa-blueprint-tres-flujos` (F1B-09, `cierra: no`)

Lotes 1, 2 y 3 aplicados en el worktree, sin commits. Base: `HEAD` = `e026903` (planificación), nacida de `a26ed48`.
Strict TDD: todo rojo se vio antes de escribir producción, salvo P3, que nace verde por diseño.

## Lote 1 · motor

- L1.1: partida en verde. `npm test` salida 0 (259 ficheros, 4231 pruebas); `npm run typecheck` salida 0; `npm run lint` salida 0 (0 errores, 165 avisos de antes).
- L1.2: la variable de la llamada de servicio es `mapa` (`scripts/generar-mapa-blueprint.ts` línea 28), como suponía D10.
- P3 (nació verde): sin opcionales, cuatro claves; con los tres valores por defecto escritos, salida idéntica. Sin código de producción nuevo.
- Rojo P1: `expected [Function] to not throw an error but 'Error: mapaBlueprint: el estado "Uno"…' was thrown` (lanza la guarda D-1).
- Rojo P2: `expected [ 'blueprint-completo.md', …(3) ] to include 'blueprint-prueba.md'`. P2 usa la entrada de servicio con fases, así que el rojo es el de clave y título por defecto, no el de la guarda.
- Verde en `packages/shared/src/mapaBlueprint.ts`: opcionales en líneas 32 a 34, `FUENTES_POR_DEFECTO` en la línea 39, plantilla `cabeceraGenerado` en la línea 62, guarda condicionada en la línea 230.
- L1.4: la importación tardía de la prueba la aceptan `vitest` y `eslint` (`npx eslint` sobre el fichero, salida 0). No se aplicó la alternativa del diseño §5.
- L1.10 a L1.12: las pruebas de las líneas 65 y 168 pasan sin editar; `git diff -U0` de `packages/shared/src/mapaBlueprint.test.ts` tiene un solo hunk de añadido (`@@ -188,0 +189,… @@`) y ninguna línea borrada; `docs/artefactos` y `packages/shared/src/cifrasAncladas.test.ts` sin cambios.
- Cierre del lote 1: `npm test` salida 0, `npm run typecheck` salida 0, `npm run lint` salida 0.

## Lote 2 · registro, guion, ficheros generados

- Esqueleto de `packages/shared/src/mapaPorFlujo.ts` (cuatro firmas que lanzan «no implementado») y línea de exportación en `packages/shared/src/index.ts` línea 40.
- Rojos con el esqueleto: P4, P5, P5b, P5c y P9 `→ no implementado`; P6, P7 y P8 (×3) `→ no implementado`; P10 `→ expected [Function] to throw error matching /blueprint-x\.md/ but got 'no implementado'`.
- Con el código implementado y antes de generar: P6 `→ expected [ …(2) ] to deeply equal []` (faltan los dos ficheros nuevos); P7 `→ expected [ …(3) ] to deeply equal [ Array(1) ]`, porque la lista lleva además los dos ficheros que faltan, de modo que P7 sólo pasa a verde tras generar; P8 servicio `→ servicio: blueprint-equipo-nuevo.md: falta en disco: expected false to be true`; P8 equipo-nuevo y soporte-remoto `→ expected [ …(2) ] to include '<fichero>: difiere'`.
- Verde: `estadosDelCatalogo`, `COMPLEMENTO_POR_FLUJO` (línea 25), `entradaMapaDelFlujo` (línea 63), `mapasPorFlujo` (línea 74), `ficherosDelMapa` (línea 85, `throw` de colisión en la línea 91) en `packages/shared/src/mapaPorFlujo.ts`.
- Guion: líneas 1 a 35 de `scripts/generar-mapa-blueprint.ts` intactas (`git diff -U0 a26ed48`: primer hunk en la línea 37). Importación tardía en la línea 41; `eslint` salida 0 y `tsx` lo ejecuta, así que no se aplicó la alternativa del diseño §4. El contraste de la llamada de servicio lanza antes de escribir.
- Generado con `npm run generar-mapa-blueprint` (salida 0): `docs/artefactos/blueprint-equipo-nuevo.md` (5 estados, 7 aristas) y `docs/artefactos/blueprint-soporte-remoto.md` (4 y 4), con leyenda de las tres áreas y sin `(sin botón)` ni `·espera·`. Los cuatro de servicio, sin diff.
- Desviación de P6: el orden de sus dos aserciones es «desfases» primero y «seis ficheros» después (`packages/shared/src/mapaBlueprint.test.ts` líneas 371 a 376, con el comentario en la 373). Con el orden del diseño, la mutación (e) segunda pasada caía por «hay siete ficheros» y no decía «falta en disco».
- Punto de control tras el lote 2: diff 265 + ficheros nuevos 158 = 423, por debajo de 620. Se hizo el lote 3.

### Mutaciones

Alcance: cada ejecución fue `npx vitest run packages/shared` (43 ficheros; partida 1218 pruebas en verde), no la suite completa. Las pruebas de `apps/` no se corrieron con las mutaciones. Todas restauradas y comprobadas (`git status`, `cmp` contra copia).

| Nº | Mutación | Cae (recuento real de la salida) |
|---|---|---|
| a1 | `TRANSITIONS.push(...)` sin regenerar | 21 fallos en 8 ficheros. Incluye P6, la prueba de la línea 168 de `packages/shared/src/mapaBlueprint.test.ts`, `cifrasAncladas` (2: «transiciones» y «pasos_del_mapa»), P7 y P8 equipo-nuevo y soporte-remoto (efecto lateral: servicio desfasado), y pruebas de invariantes de transitions |
| a2 | `to` de `producto_no_conforme` cambiado | 6 fallos en 2 ficheros: P5, P6, P7, P8 servicio, P8 soporte-remoto y una de invariantes de la unión de catálogos. P8 equipo-nuevo no cae (inyecta sobre el mismo catálogo mutado) |
| a3 | quitar `continuacion_soporte` | 16 fallos en 4 ficheros: P5, P6, P7, P8 servicio, P8 equipo-nuevo y 11 de invariantes y catálogo de soporte remoto |
| b1 | ensuciar `blueprint-completo.md` | 5: línea 168, P6, P7, P8 equipo-nuevo, P8 soporte-remoto |
| b2 | ensuciar `blueprint-fase-1-entrada.md` | 5, las mismas |
| b3 | ensuciar `blueprint-fase-2-diagnostico.md` | 5, las mismas |
| b4 | ensuciar `blueprint-fase-3-cierre.md` | 5, las mismas |
| b5 | ensuciar `blueprint-equipo-nuevo.md` | 4: P6, P7, P8 servicio, P8 soporte-remoto |
| b6 | ensuciar `blueprint-soporte-remoto.md` | 4: P6, P7, P8 servicio, P8 equipo-nuevo |
| b′ | `blueprint-sobra.md` en `docs/artefactos/` | 5: P6 (mensaje `blueprint-sobra.md: sobra en disco`, comprobado), P7, P8 ×3 |
| c | quitar la llamada a la guarda con fases | 1: la prueba de la línea 65 |
| d | guarda incondicional | 11: P1, P4, P5, P5c, P9, P10, P6, P7, P8 ×3 (más de las cuatro que decía el diseño) |
| e, 1.ª pasada | clave `cuarto` en `Flujo` y catálogo, sin complemento | `npm run typecheck` salida 2 con TS2741 en `packages/shared/src/flujos.ts` (127,7) y `packages/shared/src/mapaPorFlujo.ts` (25,7); 13 pruebas caen: P4, P5, P5c, P10, P6, P7, P8 ×4 (servicio, cuarto, equipo-nuevo, soporte-remoto) y 3 de `flujos` |
| e, 2.ª pasada | con complemento, sin regenerar | 10 caen; P6 dice `blueprint-cuarto.md: falta en disco` |
| f (equipo-nuevo) | lista de estados escrita en el registro | 1: sólo P9. P5 y P6 siguen verdes |
| f (soporte-remoto) | ídem | 1: sólo P9 |
| g | quitar el `throw` de colisión | 1: P10 |

Supervivientes: ninguno. P7 y P8 son sensibles a cualquier desfase de otro flujo (cae P8 de un flujo sano cuando otro está desfasado); no es un fallo, pero conviene saberlo al leer un rojo.

### Cierre del lote 2

- Regenerar con `npm run generar-mapa-blueprint` no deja diff de contenido (`git diff --stat -- docs/artefactos` sólo muestra `NOTA.md`).
- R4 y R5: `packages/shared/src/mapaBlueprint.test.ts`, un solo hunk de añadido; `scripts/generar-mapa-blueprint.ts`, primer hunk en la línea 37 y líneas 26, 28, 29, 31 y 35 intactas.
- Importación tardía, nada que aplicar: `packages/shared/src/mapaBlueprint.test.ts` líneas 256 a 260 y `scripts/generar-mapa-blueprint.ts` línea 41.

## Lote 3 · cierre documental, todo en sitio

- `docs/artefactos/NOTA.md`: cinco líneas por cinco (`git diff --numstat` 5 y 5); «seis ficheros», los dos nombres nuevos y `CATALOGO_POR_FLUJO`. El bloque fechado de las líneas 48 a 59 no se tocó.
- `packages/shared/src/estados.ts` líneas 176 a 180: cuatro líneas cambiadas de cinco (`numstat` 4 y 4); la línea 182 no se mueve.
- `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md`: seis líneas (30, 31, 33, 35, 249, 283) ancladas a `a26ed48` dentro de la línea, `numstat` 6 y 6, 358 líneas antes y después; la línea 310 no se movió. La de la línea 35 lleva «superado por `mapa-blueprint-tres-flujos`».
- `openspec/changes/mapa-blueprint-tres-flujos/proposal.md`: las ocho citas de `mapaBlueprint.ts` (líneas 107 a 111, 168 y 173) ancladas a `a26ed48`.
- `docs/sdd/Paquete_de_Despliegue_2026-10-08.md`: apartado 4 añadido al final (qué entra, que no hay esquema ni variables ni relleno, tareas de Supervisión y Gerencia); `git diff -U0` sin líneas borradas.
- `git diff --stat a26ed48 -- openspec/config.yaml docs/sdd/ENTRADA.md` vacío.

## Barrido de la regla de mutación 4

Todas las citas completas fuera de `openspec/changes/archive/`, contra el fichero final:

- `packages/shared/src/mapaBlueprint.test.ts` líneas 46, 65, 168 y 188: siguen siendo `it` del diagrama de 35 aristas, `it` de la guarda de ejecución, `it` de la comparación con disco y cierre del último bloque previo. Citadas desde `docs/sdd/ENTRADA.md` (2118), la auditoría (31 y 283) y `proposal.md` (18, 97, 98, 155, 156) y `exploration.md`: correctas.
- `scripts/generar-mapa-blueprint.ts` líneas 14 a 35 y 28 a 31: sin cambio (`transiciones` en la 29, `estados` en la 31); citadas desde `docs/sdd/ENTRADA.md` (2118), `openspec/config.yaml` (4172), la auditoría, `proposal.md` y `exploration.md`: correctas.
- `packages/shared/src/index.ts` línea 6, citada desde `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md` (111): la línea es `export * from './bodegaje'`, sin cambio.
- `packages/shared/src/estados.ts` líneas 176 a 180 y 182: el comentario sigue en 176 a 180 y la sentencia en 182, citadas desde la auditoría, `proposal.md`, `design.md` y cinco paquetes de despliegue: correctas.
- `docs/artefactos/NOTA.md` líneas 135 a 139 (`design.md`, `proposal.md`): el párrafo sigue ahí.
- `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` línea 310 (`CLAUDE.md` línea 346): sin mover.
- `packages/shared/src/mapaBlueprint.ts`: las ocho citas de `proposal.md` están ancladas a `a26ed48`; ninguna otra fuera de este cambio.
- No se corrió el detector de citas del hook; la forma abreviada (`:NN` sin fichero) no se barrió con grep, sólo se leyeron a mano los ficheros que ya citan estos módulos.

## Códigos de salida finales y medida

- `npm test`: salida 0 (259 ficheros pasan, 2 omitidos; 4245 pruebas pasan, 7 omitidas; 4231 + 14 nuevas).
- `npm run typecheck`: salida 0. `npm run lint`: salida 0 (0 errores, 165 avisos, los de antes).
- `npm run generar-mapa-blueprint`: salida 0, seis ficheros; `git diff --stat -- docs/artefactos` sin cambios en los seis (ver desviación de fin de línea).
- Medida, antes de este fichero: `git diff --shortstat --no-renames e026903` da 299 inserciones y 38 borrados (337) en 9 ficheros; `wc -l` de lo nuevo sin trackear: `mapaPorFlujo.ts` 98 + dos mapas 60 = 158; suma 495. Contra `a26ed48` el diff cuenta además la planificación (1.373 inserciones y 31 borrados en total), que no es de este intento.
- Medida final, con este fichero: diff 337 (299 + 38) más nuevos sin trackear 258 (`mapaPorFlujo.ts` 98, dos mapas 60, este fichero 100) = 595, bajo la válvula de 720 y el techo de 800. Las 77 casillas marcadas de `tasks.md` añaden 77 inserciones y 77 borrados al diff: con ellas la cifra sube a 749, sobre la válvula y bajo el techo.

## Desviaciones y lo que no se hizo

- El árbol de trabajo está en CRLF y el guion escribe LF: tras regenerar, `git status` marca los cuatro ficheros de servicio como modificados con `git diff` vacío (aviso LF a CRLF). Se reconvirtieron a CRLF con un script y `git update-index --refresh` los deja limpios. Ocurre por la diferencia de fin de línea, no por el contenido.
- Las mutaciones corrieron sobre `packages/shared`, no sobre la suite completa.
- Sin commits, sin `git stash`, sin tocar `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`, sin tocar el registro de intentos.
- No se miró el render de los dos mapas (T-P5 es del analista). `scripts/` no entra en `npm run typecheck`; el guion se comprobó con `eslint` y ejecutándolo con `tsx`.

## Qué cubrió F1B-09 y qué dejó fuera (para el `archive-report.md`)

Cubrió el mapa visual generado y vigilado de los tres flujos (servicio, equipo nuevo y soporte remoto) desde `CATALOGO_POR_FLUJO`, con anti-desfase exhaustivo; dejó fuera las fases de los flujos nuevos, las demás partes de la auditoría de F1B-09 y las tareas de personas T-P1 a T-P5.
