---
tanda: F1C-10
motivo: ""
capacidad: [transitions-st, permissions, mapa-blueprint]
maestro: ["M1.3", "M1.3.7", "M1.9.1", "R08.4.md:1523-1527", "R08.4.md:1616", "R08.4.md:1945"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: «Rechazo» desde Notificación cliente, sólo Comercial

Rutas y líneas completas en `exploration.md` (misma carpeta). Aquí sólo lo que decide.

## Intención

Ejecutar E-114 (`docs/sdd/ENTRADA.md:1460-1464`): la transición «Rechazo» que sale de Notificación
cliente la ejecuta sólo Comercial, que es quien recibe del cliente la respuesta a la cotización. El
maestro vigente ya lo dice (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1616`,
`:1945`, y la fila de M1.3 en `:1523-1527`); el código sigue en `Comercial / Servicio Técnico`
(`packages/shared/src/transitions.ts:236`). Orden fijado por `openspec/config.yaml:3615`.

## Alcance

1. **Catálogo**: `rechazo_cliente.area` pasa a `'Comercial'` en `transitions.ts:236`, edición en sitio
   (una cadena, ninguna línea movida). `rechazo_comercial` (`:234`) y `rechazo_revision` (`:238`) no
   cambian.
2. **Guardianes, en el mismo commit**: matriz de área 54/39 → **55/38** (`apps/desk/server/permisos.test.ts:77-81`
   y sus comentarios `:26-27`, `:72-75`, `:338`); compuesta sin cargo 55/38 → **56/37** (`:349-354`);
   invariante 5 de ocho a **siete** compartidas (`packages/shared/src/invariantesGrafo.test.ts:85-106`,
   la línea `:103` se sustituye por un comentario de una línea).
3. **Pruebas nuevas**: un usuario sólo de Servicio Técnico recibe `403` en `rechazo_cliente` desde
   Notificación cliente y uno de Comercial `200`; las otras dos «Rechazo» siguen admitiendo a Servicio
   Técnico; `areasSiguientes('Notificación cliente')` = Comercial y Compras. Van al final de sus
   ficheros.
4. **Mapa regenerado** (`npm run generar-mapa-blueprint`): tres aristas de `[C][ST]` a `[C]`
   (`docs/artefactos/blueprint-completo.md:54`, `blueprint-fase-2-diagnostico.md:44`,
   `blueprint-fase-3-cierre.md:22`).
5. **Specs**: deltas de `permissions` (RQ-PM-03) y `transitions-st` (RQ-TS-07, invariante 5, RQ-TS-23),
   añadidos al final para no desplazar citas.
6. **Barrido de citas** (regla de mutación 4) al cerrar, sobre los ficheros editados.

## Fuera de alcance

- Las otras dos «Rechazo»; la derivación de repuestos (F1C-11); el nivel «propietario del registro».
- `TransitionPanel.tsx`: ya consume `puedeEjecutarTransicion` (`:57`); regla 13 cumplida sin tocarlo.
- `docs/artefactos/blueprintserviciotecnico.html`: artefacto estático; F1C-09 tampoco lo tocó.
- Reescribir el `area` de las trazas históricas (`ticketService.ts:155` guarda el área vigente al ejecutar).
- Editar el maestro: ya está al día.

## Capacidades

- Nuevas: ninguna.
- Modificadas: `permissions` (55/38; 24 simples + 7 compartidas); `transitions-st` (siete compartidas:
  cinco C/Compras y dos C/ST; RQ-TS-23 deja de afirmar «ocho» en presente, con su revisión).
- `mapa-blueprint`: sin delta; sólo se regeneran sus artefactos.

## Enfoque

- **Rojo primero** (`strict_tdd`): cifras 55/38 y 56/37, invariante 5 con siete y las pruebas del punto 3
  antes de tocar `:236`.
- **Mutaciones**: devolver `:236` a `Comercial / Servicio Técnico` → rojo en la matriz, el invariante 5, el
  `403` nuevo, `areasSiguientes` y la anti-desfase; cambiar por error `:234` o `:238` → rojo en el
  invariante 5 y en las pruebas de las otras dos.

## Supuestos (modo producción)

| ID | Supuesto | Por qué |
|---|---|---|
| S-1 | Servicio Técnico deja de recibir el aviso por área al entrar un ticket en Notificación cliente | Se deriva del grafo (`avisoArea.ts:16`); sin salida para él, avisarle sería ruido. Reversible |
| S-2 | `cierra: si` | La fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:178`) es entera de repositorio: área, mapa y specs. No queda tarea de persona |

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Citas `transitions.ts:NNN` o `invariantesGrafo.test.ts:91-106` desfasadas | Baja | Ediciones en sitio; barrido completo y abreviado al cierre |
| Una spec sigue diciendo «ocho» o 54/39 en presente | Media | Barrido de `54/39`, `ocho compartidas`; las fechadas se dejan (caso B) |
| Un técnico que hoy rechaza desde Notificación cliente pierde el botón | Media | Es lo decidido; el administrador conserva el paso |

## Vuelta atrás

Revertir el commit: catálogo, pruebas, mapa y specs vuelven juntos. Sin datos que migrar.

## Criterios de aceptación

1. `rechazo_cliente.area === 'Comercial'`; `rechazo_comercial` y `rechazo_revision` siguen en `Comercial / Servicio Técnico`.
2. Servicio Técnico recibe `403` en `rechazo_cliente`; Comercial y administrador, `200`.
3. Matriz de área 93 = 55/38; compuesta sin cargo 93 = 56/37; barrido de cargo 744; única diferencia cargo/área intacta.
4. Invariante 5: siete compartidas, emparejadas por id.
5. Los cuatro `blueprint-*.md` coinciden con el generador; tres aristas con `[C]`.
6. `npm test`, `npm run typecheck`, `npm run lint` en verde; las dos mutaciones dan rojo.
7. Barrido de citas anotado en `apply-progress.md`.

## Estimación de líneas (techo 800 por intento; hipótesis)

| Intento | Contenido | Líneas |
|---|---|---|
| propose | `exploration.md` + `proposal.md` | ~230 |
| spec + design + tasks | 2 deltas (~110) + `design.md` (~100) + `tasks.md` (~70) | ~280 |
| apply | `transitions.ts` (2), pruebas (~50), 3 artefactos (~6), `apply-progress.md` (~100) | ~160 |
| verify | `verify-report.md` | ~250 |
| archive | fusión de 2 deltas + `archive-report.md`, revisable | ~220 |
