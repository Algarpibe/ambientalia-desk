---
tanda: fuera-del-plan
motivo: "Ajuste de la comprobación 2 del barrido ordenado por Gerencia como cambio pequeño propio (decision/avance-cuenta-lo-planificado, decision/orden-ejecucion-encargo-01-10 punto 4 y (a), decision/escenario-a-festivos-plan-a-01-10 punto 4). No es fila del §5 ni contenido de F0-06, que son dos comprobaciones nuevas y no el ajuste de una existente (docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:300)."
capacidad: [reconciliacion]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: el barrido cuenta sólo lo archivado y lee el §5 de la R01.4

`cierra: no` porque no hay fila que cerrar: `fuera-del-plan` no está en el denominador.
`maestro: []`: es regla de método, no de producto (`openspec/config.yaml:3347`, «ninguno»).

## Intención

El numerador del avance subió el 01/10 por un plan commiteado, no por trabajo. Hoy la comprobación 2:

- cuenta todo `proposal.md` con `cierra: si`, archivado o no (`apps/desk/server/reconciliacion/comprobaciones.ts:122-128` en `840a353`, `:203-206`);
- lee el §5 de la R01.1 (`apps/desk/server/reconciliacion/comprobaciones.ts:46` en `840a353`) y sólo reconoce `F0`/`F1x` sin negrita (`:133`): imprime 52 tandas frente a las 78 de la R01.4 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:143`);
- lee `cierres_declarados_por_commit` como lista plana (`apps/desk/server/reconciliacion/comprobaciones.ts:208` en `840a353`), que no existe, y lo dice (`docs/sdd/RECONCILIACION.md:29`).

Éxito: el barrido publica las cifras de la R01.4 §B (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:48-50`) sin que nadie las cuente a mano.

## Alcance

**Dentro**

1. Numerador **por archivo**: sólo `openspec/changes/archive/**/proposal.md` con cabecera válida y `cierra: si`.
2. Numerador **por commit declarado**: bloques `- id:` con `commit:` y `prueba:` en `cierres_declarados_por_commit`; una entrada sin alguno de los dos es **defecto de registro**, no cierre (molde de RQ-RC-08).
3. Cifra **«en curso»**, aparte: tandas con un cambio fuera de `archive/` o archivado con `cierra: no`, que no estén en ninguna de las dos poblaciones de cerradas.
4. Hallazgo si una tanda está en las dos poblaciones (deben ser disjuntas). Nunca se suman.
5. Denominador desde la R01.4 §C, **acotado a esa sección**, con IDs `F0-`, `F1[A-F]-`, `1G-`, `1H-` y `F[2-5]-`, con o sin negrita.
6. Registrar en `openspec/config.yaml` (al final, sin desplazar citas) F0-01, F0-02 y F0-03:

| Tanda | Commit | Prueba |
|---|---|---|
| F0-01 | `3d44e1e` «inicializar contexto SDD, CLAUDE.md y el maestro citable» | `docs/sdd/Estado_As-Built_2026-09-09.md:20` |
| F0-02 | `fa445ac` (siete specs completas; `749d205` añade dos entradas después) | `openspec/changes/F0-03/proposal.md:21` · `docs/sdd/Estado_As-Built_2026-09-09.md:21` |
| F0-03 | `3aaa0f1` «cerrar F0-03 con la carga en Engram y la convención de topic_key» | `docs/sdd/Estado_As-Built_2026-09-09.md:22` |

7. Delta de `reconciliacion` y `docs/sdd/RECONCILIACION.md` regenerado.

**Fuera**

- Las seis declaradas por commit en la R01.4 (F0-00, F1A-01, F1A-02, F1A-04, F1A-05, F1B-01): Gerencia no lo ordenó. Ver «Decisión pendiente».
- Archivar F0-01..03 o moverlas de carpeta.
- Comprobar mecánicamente el verify PASS: el archivo lo presupone.
- F0-06, ponderar por talla, el desglose por ventana.

## Decisión sobre F2-01..03 y F4-01

**Se reconocen.** El §C las incluye en sus 78 filas (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:143`) y §G publica «Sobre el proyecto (78 tandas)» (`:284`). Si el barrido excluye filas, decide alcance por su cuenta, en contra de su límite: hace visibles los desvíos, no los corrige (`apps/desk/server/reconciliacion/comprobaciones.ts:11-13` en `840a353`).

## Enfoque

- `RUTA_PLAN` pasa a la R01.4. Las filas se leen sólo entre `## C ·` y el `---` siguiente: §F.3 repite IDs en su primera columna (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:210-226`), y `Map.set` las pisaría. Hipótesis: el mismo defecto existe hoy con la R01.1 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:140` y `:481`) y no se nota porque gana la última tabla.
- **Guarda (b) de RQ-RC-06:** la R01.4 no tiene columna de fuentes del maestro. La columna 4 es la ventana (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:62`) y la 6 son claves `decision/*`. Supuesto reversible: la fuente se sigue leyendo de la R01.1 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:481`) sólo para las filas que existan allí. Las filas nuevas no tienen fuente, así que no se marcan (como `apps/desk/server/reconciliacion/comprobaciones.ts:214` en `840a353`).
- `cierres_declarados_por_commit` se lee con `entradasYaml` (`apps/desk/server/reconciliacion/comprobaciones.ts:85` en `840a353`), sin escribir un parser nuevo.
- `strict_tdd`: primero, en rojo, las pruebas de árbol sintético. Las de `apps/desk/server/reconciliacion/comprobaciones.test.ts:145-156` pasan sus proposals a `archive/`.

## Capacidades

- **Nuevas:** ninguna.
- **Modificadas:** `reconciliacion`.
  - RQ-RC-05: por archivo, por commit con commit y prueba, «en curso» y disjunción. Retira «F0-04 por commit», que la R01.4 da como en curso (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:50`).
  - RQ-RC-01: la fila 2 apunta al §5 de la R01.4.
  - RQ-RC-06(b): de dónde sale la fuente.

## Áreas afectadas

| Área | Impacto |
|---|---|
| `apps/desk/server/reconciliacion/comprobaciones.ts` | Modificado |
| `apps/desk/server/reconciliacion/comprobaciones.test.ts` | Modificado |
| `openspec/config.yaml` | Bloque nuevo al final |
| `openspec/specs/reconciliacion/spec.md` | Delta |
| `docs/sdd/RECONCILIACION.md` | Regenerado |

**Qué cambia en `RECONCILIACION.md`** (§2):

| Antes | Después |
|---|---|
| 12 derivables | 10 por archivo |
| 0 por commit | 3 por commit: F0-01, F0-02, F0-03 |
| — | 6 en curso: F0-04, F1B-04, F1B-07, F1B-08, F1B-11, F1C-05 |
| Denominador 52 | Denominador 78 (R01.4) |
| Hallazgo «sin declarar» | Desaparece |

Los «sin verificar» se vuelven a medir; no se estiman.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Regla de mutación 4 sobre `comprobaciones.ts` (citado en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:294` y en `openspec/config.yaml:3339`), `config.yaml` y la spec | Alta | Editar en sitio, sin insertar antes de líneas citadas, con la constante de `apps/desk/server/reconciliacion/comprobaciones.ts:46` en `840a353` en su misma línea. Barrido `grep -rnoE` al cierre. Las citas viejas son caso B y se anclan con su revisión |
| La R01.4 §G publica 9 por commit y el barrido publicará 3 | Segura | Se dice en el parte. Lo resuelve la decisión pendiente |
| Cambia el formato de la R01.4 §C | Baja | Prueba que muta el fichero vigilado (regla de mutación 2) |

## Estimación (techo 800 por intento)

| Intento | Líneas | Detalle |
|---|---|---|
| apply | ≈330 | código +70/−20, pruebas +160, `config.yaml` +30, informe ±20, `apply-progress` |
| verify-report | ≈250 | — |
| archive | ≈2× la carpeta (≈1.600) + fusión, que se mide, + archive-report ≈150 | Pasa de 800: **pide techo a Gerencia**, precedente en `openspec/config.yaml:3585` |

## Plan de vuelta atrás

Revertir el commit de fusión. El bloque de `config.yaml` es aditivo y el informe se regenera.

## Criterios de aceptación

- [ ] Un proposal `cierra: si` fuera de `archive/` no entra en «por archivo» (prueba roja antes).
- [ ] Una entrada por commit sin `commit:` o sin `prueba:` sale como defecto de registro y no cuenta.
- [ ] Una tanda en las dos poblaciones produce hallazgo.
- [ ] Denominador 78 sobre la R01.4, y una fila de §F.3 no altera la cuenta.
- [ ] `**F1A-10**`, `1G-01`, `1H-00` y `F4-01` se reconocen.
- [ ] `npm run reconcile` sobre el árbol real da 10 / 3 / 6 en curso / 78, con código 0.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde. Barrido de citas limpio.

## Decisión pendiente para Gerencia (no bloquea)

¿Se registran también las seis? Hay commits candidatos en el historial: F0-00 `0e8f581`, F1A-01 `ec0ed1f`, F1A-02 `6ea3ca8`/`5218d11`, F1A-04 `e8c5e90`, F1A-05 `43821b8`, F1B-01 `607e26a`/`9ed5635`. Pero F1A-04 figura como «Reubicada» a F1C (`docs/sdd/Estado_As-Built_2026-09-09.md:26`), y ninguna tiene prueba escrita. Supuesto aplicado: sólo F0-01..03, lo ordenado. Añadirlas después es aditivo.

## Ronda de preguntas de la propuesta

Modo `auto`: no se pregunta. Supuestos que hay que revisar:

1. F2/F4 dentro del denominador (78).
2. La fuente de RQ-RC-06(b) se sigue leyendo de la R01.1.
3. F0-04 pasa a «en curso».
4. F0-02 se cierra con `fa445ac`.
