---
tanda: F1B-09
motivo: ""
capacidad: [transitions-soporte-remoto]
maestro: ["M1.5", "Anexo B.1", "Anexo D nº 71"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `areas-soporte-remoto`

Construye la consecuencia (3) de `decision/e090-areas-soporte-remoto` (Gerencia, 2026-10-25; `openspec/config.yaml:5365-5382` en `094196b9`): la spec se
corrige en un cambio con ficha de F1B-09 (`openspec/config.yaml:5378` en `094196b9`). Fila: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:89`.
Sin exploración previa. **No cambia comportamiento:** corrige la razón que la spec, un comentario y tres pruebas dan del área, y dos citas.

*Sobre la cabecera.* `cierra: no`: a F1B-09 le faltan el repaso al cerrar la épica 1B y E-223 a E-230
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:215`). `toca_maestro: si`: al terminar siguen diciendo «abierto» M1.5
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1765`), el Anexo B.1
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4542`) y el Anexo D nº 71
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5565-5569`). Por eso el `maestro_pasaje: "ninguno"` de la
decisión (`openspec/config.yaml:5380` en `094196b9`) no casa con el maestro: es hallazgo para Supervisión (P-2), no se corrige en esta rama.

## 1 · Intención

La spec viva da el área de las cuatro de trabajo como «supuesto reversible S-1», «*Hipótesis*, no cerrada» y pendiente de «P.3»
(`openspec/specs/transitions-soporte-remoto/spec.md:82-84` en `094196b9`); lo repiten el §0 (`openspec/specs/transitions-soporte-remoto/spec.md:21-22` en `094196b9`)
y el título del §2 (`openspec/specs/transitions-soporte-remoto/spec.md:76` en `094196b9`). Gerencia lo decidió: son de Servicio Técnico
(`openspec/config.yaml:5372` en `094196b9`). Al terminar, ningún artefacto vivo llama supuesto a lo decidido, y el área de cada transición es la de hoy.

## 2 · Lo que hay hoy (medido)

- El catálogo ya lo cumple: las cuatro de trabajo llevan `area: 'Servicio Técnico'` (`packages/shared/src/transitions.ts:389-395`); la
  quinta, `anulacion_soporte`, es `Comercial` (`packages/shared/src/transitions.ts:396`) por `decision/f1c01-area-anulado`
  (`openspec/config.yaml:5012` en `094196b9`) y RQ-SR-13 (`openspec/specs/transitions-soporte-remoto/spec.md:357`).
- Lo impone el servidor: `executeTransition` (`apps/desk/server/services/ticketService.ts:114`) toma la transición del catálogo compartido
  (`apps/desk/server/services/ticketService.ts:122`) y responde `403` si `canExecuteTransition` (`packages/shared/src/permissions.ts:4-7`)
  no admite su `area` (`apps/desk/server/services/ticketService.ts:129-130`).
- La razón de supuesto vive en cinco líneas de código y pruebas: el comentario del catálogo (`packages/shared/src/transitions.ts:384-385` en `094196b9`),
  el nombre de la prueba (d) (`packages/shared/src/transitionsSoporteRemoto.test.ts:34` en `094196b9`), el mensaje de aserción de «corrección (b)»
  (`packages/shared/src/invariantesGrafo.test.ts:257` en `094196b9`) y dos comentarios de la matriz SR (`apps/desk/server/permisos.test.ts:301` en `094196b9`,
  `apps/desk/server/permisos.test.ts:323` en `094196b9`). Los demás «S-1» de `apps/` y `packages/` son de otros cambios (barrido de esta fase).
- Dos citas de `openspec/config.yaml` a la spec. `openspec/config.yaml:5375` en `094196b9` señala la línea 83 como el sitio donde dice
  «*Hipótesis*, no cerrada»: al fusionar deja de decirlo; caso B, se ancla en `094196b9`. `openspec/config.yaml:4195` en `094196b9` da las
  líneas 108-109 como «requisitos que hoy lo prohíben»: decían `MUST NOT` (`openspec/changes/archive/2026-10-08-columna-propia-dos-estados/exploration.md:35`)
  y hoy exigen la columna propia (`openspec/specs/transitions-soporte-remoto/spec.md:108-109`). Caso B que ya existía: se ancla en `3ec3703e`,
  donde nació (revisión medida por el orquestador con `git`; hipótesis en esta fase, que no ejecuta `git`).

## 3 · Alcance y enfoque

**Dentro** — todo en sitio: ninguna línea de ningún fichero se desplaza.
1. Delta MODIFIED de RQ-SR-02 sobre su bloque vivo (`openspec/specs/transitions-soporte-remoto/spec.md:78-94`), con las mismas 17 líneas:
   área `Servicio Técnico` por decisión de Gerencia (`decision/e090-areas-soporte-remoto`), no por equivalencia; S-1 cerrado; fuera «Se
   confirma en P.3»; los dos escenarios (`403` a Comercial, `200` a Servicio Técnico), idénticos; se conserva la frase de la Anulación.
2. Fuera de bloques de requisito: el título del §2 y el §0, que sigue diciendo que `ÁREA_RESPONSABLE` está vacía —es cierto— y añade que
   el área la decidió Gerencia el 2026-10-25 (S-F). Se aplican al archivar, con el mismo script que fusiona RQ-SR-02.
3. Las cinco líneas de código y pruebas medidas arriba: sólo la razón del área (S-1 → la decisión); nada más de esas líneas (S-A, S-C).
4. Las dos citas de `openspec/config.yaml` medidas arriba, ancladas. `config.yaml` tiene cambios de Supervisión sin commitear en `main`: el commit
   va en la rama y el **orquestador** —no un agente— repite la edición en el fichero de trabajo de `main` por hunks, comprobando que el
   status y el sha256 del `git diff` de Supervisión quedan iguales salvo esos dos hunks.

**Fuera:** el maestro (P-1); `docs/sdd/ENTRADA.md` (E-090, `docs/sdd/ENTRADA.md:1253` en `094196b9`); los artefactos archivados de `blueprint-soporte-remoto`
y los registros fechados, como `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:109`; S-B y S-C; catálogo, servidor, cliente, esquema y datos.
**Qué parte de la fila cubre, en una línea:** la corrección de la spec que pide E-090; deja fuera el repaso de la épica 1B y E-223 a E-230.

**Enfoque.** El delta lleva el bloque MODIFIED completo y una sección con las dos ediciones fuera de requisitos, texto viejo y nuevo, para
que el script las aplique sin interpretar (lo concreta `sdd-spec`). **Casilla de regla 13 (mutación 3):** el cambio no toca `apps/desk/src`:
no hay decisión del cliente que enumerar. La única en juego —quién ejecuta las cuatro— la impone el servidor
(`apps/desk/server/services/ticketService.ts:129-130`) con el `area` del catálogo compartido.

## 4 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `transitions-soporte-remoto` — MODIFIED en sitio de RQ-SR-02, más el §0 y el título del §2.

## 5 · Supuestos reversibles

Se llaman S-A… para no confundirlos con el S-1 de `blueprint-soporte-remoto`, que este cambio cierra. `execution_mode: auto` (`openspec/config.yaml:25-30` en `094196b9`):
sin ronda de preguntas; ninguno cambia el alcance, cuesta dinero, toca producción ni contradice una decisión. Van a la lista semanal de F1B-09.

| # | Supuesto | Por qué | Alternativa |
|---|---|---|---|
| S-A | Además del comentario y de la prueba (d), se corrigen las otras tres líneas medidas en «Lo que hay hoy» (sólo su «S-1») | Las cinco dan la misma razón, ya falsa | Sólo comentario y prueba (d) |
| S-B | No se toca `openspec/specs/transitions-soporte-remoto/spec.md:326` («confirmación del área (P.3)») | Está en «Fuera de alcance» de F1B-06: es la foto de lo que esa tanda dejó fuera, igual que la línea 322, ya desfasada | Reescribirla en sitio |
| S-C | Se quedan «4×3» y «(4 permitidos, 8 prohibidos)» (`apps/desk/server/permisos.test.ts:300-301` en `094196b9`) | Cabecera histórica de F1B-06; la cuenta viva la fija `apps/desk/server/permisos.test.ts:328-333` | Ponerlas al día |
| S-D | La cita de `openspec/config.yaml:4195` en `094196b9` se ancla como caso B | Afirma lo que las líneas decían al escribirse | Caso C: anclar y añadir que lo cerró `columna-propia-dos-estados` |
| S-E | El título de RQ-SR-02 cambia y el script casa el bloque por el ID `RQ-SR-02` | «Por equivalencia» deja de ser cierto | Conservar el título |
| S-F | El §0 conserva la frase de la hoja vacía y añade la fecha de la decisión | Sigue siendo cierta del `.xlsx` y explica por qué hubo supuesto | Sustituirla |
| S-G | En la misma línea `openspec/config.yaml:4195` en `094196b9` se ancla también en `3ec3703e` la cita hermana a `transitions-equipo-nuevo` | Es el mismo caso B: `openspec/specs/transitions-equipo-nuevo/spec.md:264-267` en `3ec3703e` decía «**MUST NOT** ganar columna propia para `Verificación`» y hoy exige la columna; misma línea física, ningún hunk de más en `main` | Dejarla sin ancla y anotarla |
| S-H | (Añadido en el apply.) Las citas de dos paquetes de despliegue fechados al comentario del catálogo se anclan en su revisión de escritura (`c2b28880` y `f5255d2b`), en sitio | Afirman «por equivalencia, no por decisión» y la edición (a) vuelve falsa la línea citada: caso B de la regla de mutación 4, que se repara nombrando la revisión | Dejarlas sin ancla y anotarlas |

## 6 · Barrido de citas (regla de mutación 4)

`git grep -noE` sobre el patrón de citas completas a esta spec da 13: dos en `openspec/config.yaml` (medidas arriba) y once en `openspec/changes/archive/`,
ninguna a una línea que este cambio reescribe. La que lo parece, `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/apply-progress.md:89`,
no cita la spec viva sino el delta de su propio cambio, cuya línea 83 es una nota «Previously» sobre `marcar_pendiente`
(`openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/specs/transitions-soporte-remoto/spec.md:83`): no es caso A, B ni C
aquí, no se toca, y el detector excluye el archivo (`apps/desk/server/citas/cli.ts:49`). El apply repite el barrido en todo el repositorio,
archivo incluido, leyendo qué afirma cada frase, con el segundo pase de abreviadas en los ficheros que ya citan la spec.

## 7 · Disciplina que se verifica

- `strict_tdd` sin código nuevo: la prueba de que la spec se impone es una mutación con control. **M0**: la suite pertinente, verde sin
  tocar nada. **M1**: `area` de `asignacion_soporte` → `'Comercial'`; se esperan rojas (hipótesis: las mide el apply) la (d)
  (`packages/shared/src/transitionsSoporteRemoto.test.ts:36-38`), «corrección (b)» (`packages/shared/src/invariantesGrafo.test.ts:254-260`),
  la matriz SR (`apps/desk/server/permisos.test.ts:304-326`) y P1, P2 y P8 (`apps/desk/server/flujoSoporteRemoto.test.ts:31`,
  `apps/desk/server/flujoSoporteRemoto.test.ts:39`, `apps/desk/server/flujoSoporteRemoto.test.ts:100`). **M2**: lo mismo con
  `ejecutar_soporte`, con P4 (`apps/desk/server/flujoSoporteRemoto.test.ts:62`) en vez de P1 y sin P8. Se restaura, vuelve a verde y se registra.
- Para el apply: la comparación con `canExecuteTransition` (`apps/desk/server/permisos.test.ts:321-322`) lee el mismo catálogo que el
  servidor y no distingue la mutación; la roja es la de «a mano» (`apps/desk/server/permisos.test.ts:324`). La cuenta de `apps/desk/server/permisos.test.ts:328-333` sigue verde (hipótesis).
- Cinco códigos por intento, todos 0: `npm run typecheck`; `npm run lint -- --max-warnings 165`; `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`;
  `npm test` solo y en serie, log entero en el scratchpad y cargador conectado; `npm run build`. Bundle esperado sin cambio (`index-BFrlA0VZ.js`):
  al cliente sólo llega un comentario JSDoc de `packages/shared/src/transitions.ts`, que la minificación quita (hipótesis hasta medirlo). Sin migración.

## 8 · Estimación por intento

Medida: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear. Techo 800, válvula 720.

| Intento | Contenido | Estimado |
|---|---|---|
| i1 · planificación | propuesta (~150), delta (~45), diseño (~100), tareas (~70) | ~365 |
| i2 · apply | ocho líneas reescritas en sitio (16 en el diff) + `apply-progress.md` | ~160 |
| i3 · verify | `verify-report.md` (precedente 358) y casillas de `tasks.md` | ~320 |
| i4 · archive | Regla del archivo: la mudanza (≈ 2 × carpeta) puede pasar de 800; la parte revisable —fusión (≤40) + `archive-report.md` (~130)— no, y se mide antes de aplicar; `git show --numstat` del commit de archivo | ~1.900 |

## 9 · Riesgos y marcha atrás

| Riesgo | Prob. | Mitigación |
|---|---|---|
| El delta o una edición en sitio desplaza líneas | Baja | `git diff --numstat` con inserciones = borrados en cada fichero |
| Un ancla mal escrita | Baja | El detector lee la cita en su revisión (`apps/desk/server/citas/cosecha.ts:62`) |
| La edición en `main` pisa cambios de Supervisión, o un commit suyo desplaza las citas a `config.yaml` de este cambio | Media | Hunks del orquestador con status y sha256 comprobados; barrido al fusionar |
| El script de fusión no casa RQ-SR-02 por el título nuevo | Baja | S-E; la fusión se mide en worktree antes de aplicar |
| `npm test` intermitente por carga o alimentación | Media | En serie, con log entero y cargador conectado |

**Marcha atrás:** revertir los commits de la rama o su fusión. Sin datos, esquema, interruptor ni comportamiento que deshacer.

## 10 · Tareas de persona — fuera del recuento

No son tareas del `tasks.md` (regla del ciclo 1). **Archivar este cambio no las da por hechas.**

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Poner al día M1.5 y el Anexo B.1 y cerrar el Anexo D nº 71 (citas en la cabecera): las cuatro son de Servicio Técnico por decisión del 2026-10-25 | Gerencia | Próxima revisión del maestro, por el expediente R08.x que lleva Supervisión | Esta sección y el `archive-report.md` |
| P-2 | El `maestro_pasaje: "ninguno"` de la decisión (`openspec/config.yaml:5380` en `094196b9`) no casa con esos tres pasajes | Supervisión | La ficha de la decisión | Esta sección y el `archive-report.md` |

## 11 · Criterios de éxito

- [ ] RQ-SR-02 vivo da el área por `decision/e090-areas-soporte-remoto`, sin «supuesto reversible», «*Hipótesis*» ni «P.3»; escenarios y Anulación, intactos.
- [ ] Spec, código, pruebas y `config.yaml` conservan su número de líneas; ningún `area` del catálogo cambia.
- [ ] Las cinco líneas dan la decisión como razón; las dos citas, ancladas; en `main`, el diff de Supervisión intacto salvo dos hunks.
- [ ] M0 verde; M1 y M2 rojas con sus listas registradas; verde otra vez al restaurar. Barrido de citas hecho y registrado.
- [ ] Los cinco códigos salen 0 en cada intento; bundle igual. El `archive-report.md` dice qué parte de F1B-09 cubre y lleva P-1 y P-2.
