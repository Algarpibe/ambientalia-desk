# Informe de verificación: `mapa-blueprint-tres-flujos` (F1B-09, `cierra: no`)

**Veredicto: PASS WITH WARNINGS.** 0 CRITICAL, 10 avisos, 4 sugerencias.
Verificado sobre `c58fa88` (planificación `e026903`, base `a26ed48`), sólo en el worktree
`C:\dev\Desk_2_R1.023-worktrees\mapa-blueprint-tres-flujos`. Strict TDD activo; los rojos de apply se leen en
`openspec/changes/mapa-blueprint-tres-flujos/apply-progress.md` y NO se re-ejecutaron (cada prueba se juzga aquí por mutación).

## 1 · Comandos (código de salida leído por separado)

| Comando | Salida | Resultado |
|---|---|---|
| `npm test` | 0 | 259 ficheros pasan, 2 omitidos; 4245 pruebas pasan, 7 omitidas |
| `npm run typecheck` | 0 | sin errores |
| `npm run lint` | 0 | 0 errores, 165 avisos (no medí la línea base de `a26ed48`) |
| `npm run build` | 0 | |
| `npm run generar-mapa-blueprint` | 0 | «escritos 6 ficheros»; `git diff --stat` vacío |

Tras generar en un árbol con CRLF, `git status --short` marca 3 ficheros `M` sin diff de contenido (aviso de Git
«LF will be replaced by CRLF»); ver W9. Árbol dejado limpio con `git checkout -- docs/artefactos`. Ningún commit ni stash.

## 2 · Restricciones de la tanda (comprobadas)

- `git diff -U0 a26ed48 -- scripts/generar-mapa-blueprint.ts`: primer hunk `@@ -37 +37,10 @@`; ninguno antes de la línea 36. OK.
- `git diff -U0 a26ed48 -- packages/shared/src/mapaBlueprint.test.ts`: un solo hunk `@@ -188,0 +189,206 @@`, sin borrados. OK.
- `git diff --stat a26ed48 -- docs/artefactos`: sólo `NOTA.md` (5+5), `blueprint-equipo-nuevo.md` (+32) y `blueprint-soporte-remoto.md` (+28). Los cuatro de servicio, idénticos. OK.
- `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y `packages/shared/src/cifrasAncladas.test.ts`: sin diff contra `a26ed48`. OK.
- `packages/shared/src/estados.ts`: `@@ -177,4 +177,4 @@` (cero líneas netas). `packages/shared/src/index.ts`: `@@ -39,0 +40 @@`.

## 3 · Matriz requisito → escenario → prueba

Leyenda: **E** = probado en ejecución; **Est** = sólo evidencia estructural (grep o `git diff`); **SIN** = sin prueba.
`T` = `packages/shared/src/mapaBlueprint.test.ts`; el número es la línea del `it` (`T:236` = línea 236).

| Req | Escenario | Prueba | Estado |
|---|---|---|---|
| RQ-MB-01 | no importa `permissions.ts` | ninguna; `grep permissions` sobre `mapaBlueprint.ts`, `mapaPorFlujo.ts` y el test: 0 | Est |
| RQ-MB-01 | la CLI delega todo | ninguna (`vitest.config.ts` no incluye `scripts/**`); contraste del guion probado a mano (M21); escritura del guion sin vigilar (M22) | Est |
| RQ-MB-01 | llamada de hoy compila y produce lo mismo | T:236 (P3) + `typecheck` 0 + `cifrasAncladas.test.ts` sin editar y verde | E |
| RQ-MB-03 | seis ficheros esperados | T:298 (P4), T:305 (P5), T:371 (P6, 6 ficheros) | E |
| RQ-MB-03 | cabecera avisa contra edición manual | T:35 (cuatro de servicio); los dos nuevos sólo por igualdad exacta en T:371 | E parcial |
| RQ-MB-03 | cuatro de servicio no cambian | T:168 + `git diff --stat a26ed48` vacío | E |
| RQ-MB-03 | sin opcionales, cuatro claves | T:236 (P3) | E |
| RQ-MB-03 | con nombre y fichero, título y clave pedidos | T:216 (P2) | E |
| RQ-MB-04 | frontera en las dos vistas | T:101 | E |
| RQ-MB-04 | estado sin fase bloquea | T:65 (M8 y M11 la ponen roja) | E |
| RQ-MB-04 | flujo sin fases: sólo el completo | T:197 (P1) | E |
| RQ-MB-04 | mutación: quitar la guarda | T:65 (M8: 1 roja) | E |
| RQ-MB-04 | mutación: guarda incondicional | P1 y otras (M11, sentido inverso: 12 rojas; la incondicional, del orquestador: 11) | E |
| RQ-MB-05 | leyenda de áreas y compartidas | T:116 | E |
| RQ-MB-05 | leyenda en los flujos nuevos | T:305 (P5, línea 318) | E |
| RQ-MB-05 | ningún fichero con hallazgos | T:124 recorre sólo los 4 de servicio; en los 2 nuevos, `grep -c hallazgo` = 0 a mano | E parcial / Est (W6) |
| RQ-MB-06 | `.md` editado a mano → rojo | T:371 (P6); M4, M5, M6 | E |
| RQ-MB-06 | transición nueva sin regenerar → rojo | T:383 (P8 ×3); M1, M2, M3 | E |
| RQ-MB-06 | mutación del catálogo de cada flujo | M1 (servicio), M2 (equipo-nuevo), M3 (soporte-remoto); P8 asevera el nombre inyectado (T:392) | E |
| RQ-MB-06 | ensuciar el fichero de cada flujo | M4, M5, M6 (propias) + del orquestador | E |
| RQ-MB-06 | registro exhaustivo | T:298 (P4) | E |
| RQ-MB-06 | cuarto flujo sin mapa → rojo | T:363 (P10: sin complemento) + T:378 (P7: «falta en disco»); no hay caso con cuarto flujo CON complemento y sin fichero | E indirecto |
| RQ-MB-07 | `Pendiente` sin fase, 4·11·5 | `packages/shared/src/fasesBlueprint.test.ts:17` y `:28` (preexistentes, verdes) | E |
| RQ-MB-07 | ficheros regenerados, sin ids retiradas | T:168, T:182; las tres ids no salen en ningún `.md` (los mapas no imprimen ids) | E parcial |
| RQ-MB-07 | D-1 con otro estado; sin `Pendiente` no falla | T:65 cubre el primer miembro; el segundo no tiene prueba | E parcial / SIN (W6) |
| RQ-MB-07 | mutación: `.md` sin regenerar | T:168, T:371 (M1, M4) | E |
| RQ-MB-08 | claves del registro | T:298 (P4) | E |
| RQ-MB-08 | estados derivados del catálogo | T:349 (P9), T:305 (P5, orden); M15, M16 | E |
| RQ-MB-08 | equipo nuevo 5/7; soporte remoto 4/4 | T:305 (P5) | E |
| RQ-MB-08 | sin `(sin botón)` ni `·espera·` | T:305 (línea 317) | E |
| RQ-MB-08 | servicio conserva su lista | T:342 (P5c) | E |
| RQ-MB-08 | clave nueva sin mapa → rojo | `typecheck` + P4/P10; M23: `tsc` salida 2 (TS2353) y 11 rojas | E |

## 4 · Origen de los mapas

- Catálogos: `packages/shared/src/mapaPorFlujo.ts:63` toma `CATALOGO_POR_FLUJO[flujo]` por defecto y `:70` lo vuelca en `transiciones: [...catalogo]`. `:78` recorre `Object.keys(catalogos)`, no una lista fija.
- Estados de los dos flujos nuevos: `packages/shared/src/mapaPorFlujo.ts:70` (`estados ?? estadosDelCatalogo(catalogo)`), con `estadosDelCatalogo` en `:58-59`. Servicio conserva `ESTADOS_SERVICIO` en `:27`, por diseño (S-F).
- Escrito a mano para los flujos nuevos: `nombreFlujo` (`:38`, `:47`), `nombreFicheroCompleto` (`:39`, `:48`), la frase `fuentes` (`:40`, `:49`) y los vacíos `sinBoton`/`sinSalida`/`fases`/`fasePorEstado` (`:34-37`, `:43-46`). Ninguna lista de transiciones ni de estados. Valoración: aceptable, es metadato. La frase `fuentes` nombra `TRANSITIONS_EQUIPO_NUEVO` y `TRANSITIONS_SOPORTE_REMOTO` como texto y nada la contrasta con los símbolos reales (S1).
- Guion y prueba consumen la misma construcción: `scripts/generar-mapa-blueprint.ts:43` y `packages/shared/src/mapaBlueprint.test.ts:372`.

## 5 · Mutaciones propias (22 aplicadas, todas restauradas; `git status --short` vacío tras cada una)

Línea base `npx vitest run packages/shared`: 1218 pruebas, 43 ficheros, verde. «Rojas» copiado de «Tests N failed».

| # | Mutación | Rojas | Pruebas que caen |
|---|---|---|---|
| M1 | catálogo servicio: área de `diagnostico_complementario` ST → Compras (`transitions.ts`) | 5 | T:168, P6, P7, P8 equipo-nuevo, P8 soporte-remoto |
| M2 | catálogo equipo-nuevo: área de `analisis_y_acciones` → Comercial | 5 | invariantes F1B-06 de `invariantesGrafo.test.ts`, P6, P7, P8 servicio, P8 soporte-remoto |
| M3 | catálogo soporte-remoto: `continuacion_soporte` termina en `Finalizado` | 8 | P6, P7, P8 ×2, `invariantesGrafo.test.ts`, `reentrancia.test.ts`, `transitionsSoporteRemoto.test.ts` (a) y (f) |
| M4 | fichero vigilado servicio: espacio tras `<!--` en `blueprint-fase-1-entrada.md` | 5 | T:168, P6, P7, P8 ×2 |
| M5 | fichero vigilado equipo-nuevo: «— Comercial» → «— Comerciales» | 4 | P6, P7, P8 servicio, P8 soporte-remoto |
| M6 | fichero vigilado soporte-remoto: sin salto de línea final | 4 | P6, P7, P8 equipo-nuevo, P8 servicio |
| M7 | guarda D-1 gobernada por `Object.keys(fasePorEstado).length > 0` en vez de `fases.length > 0` | 0 | **SUPERVIVIENTE** |
| M8 | guarda D-1 convertida en lambda no invocada (nunca) | 1 | T:65 |
| M9 | `cabeceraGenerado` ignora su parámetro `fuentes` | 6 | P2, P6, P7, P8 ×3 |
| M10 | `desfases` sin la rama «sobra en disco» (`if (false)`) | 0 | **SUPERVIVIENTE** |
| M11 | guarda D-1 en sentido inverso (`fases.length === 0`) | 12 | P1, T:65, P4, P5, P5c, P6, P7, P8 ×3, P9, P10 |
| M12 | guarda D-1 movida tras generar las vistas por fase (posición) | 0 | **SUPERVIVIENTE** (1218 verdes; un primer intento mal aplicado se descartó y se repitió con saltos CRLF) |
| M13 | mensaje del `throw` de complemento sin la clave del flujo | 1 | P10 |
| M14 | `throw` de complemento ausente eliminado | 1 | P10 |
| M15 | `estadosDelCatalogo` con destino antes que orígenes | 6 | P5, P6, P7, P8 ×3 |
| M16 | `estadosDelCatalogo` sin `Set` (duplicados) | 6 | P5, P6, P7, P8 ×3 |
| M17 | `mapasPorFlujo` ignora el catálogo recibido | 3 | P8 ×3 |
| M18 | `desfases` sin normalizar CRLF (árbol con CRLF tras `git checkout`) | 5 | P6, P7, P8 ×3 |
| M19 | `generarVistaFase` ignora `entrada.fuentes` (siempre la de servicio) | 0 | **SUPERVIVIENTE** |
| M21 | guion: `nombreFlujo` con valor «X» inyectado en el complemento de servicio y ejecución de `npm run generar-mapa-blueprint` | n/a | el guion lanza «blueprint-completo.md difiere entre la llamada de servicio y el registro por flujo», salida 1, sin escribir |
| M22 | guion: `const ficheros = mapa` (escribe sólo servicio) | 0 | **SUPERVIVIENTE**: imprime «escritos 4 ficheros»; ninguna prueba cae |
| M23 | clave de `COMPLEMENTO_POR_FLUJO` mal escrita (`soporte-remotox`) | 11 | `tsc` salida 2 (TS2353) + P4, P5, P5b, P5c, P6, P7, P8 ×3, P9, P10 |

M20 no llegó a aplicarse (el reemplazo multilínea no casó con CRLF); no la cuento.
Del orquestador (citadas, no repetidas): 12 mutaciones, todas rojas, recuentos en el encargo.

## 6 · Calidad de las pruebas

- Ninguna prueba nueva es tautológica en el sentido fuerte: P2, P3, P5, P5b, P5c, P9 y P10 caen por mutaciones concretas (M9, M11, M13 a M16, M23).
- P3 (T:236) nace verde por diseño (guarda de R3); su segunda mitad compara con los valores por defecto escritos y vale sólo como guarda de compatibilidad.
- P5c (T:344) exige identidad (`toBe(ESTADOS_SERVICIO)`): sobreespecificada; una copia de la lista sería equivalente y la rompería (S2).
- P8 (T:383) cae por la razón correcta cuando el registro ignora el catálogo (M17), pero el P8 del flujo desfasado queda verde (M1: P8 servicio; M5: P8 equipo-nuevo) y caen los de los flujos sanos. Es la observación conocida: P7 y P8 de flujos sanos caen siempre que cualquier fichero está desfasado (4-5 rojas por una sola causa). No es incorrecto, pero ensucia el diagnóstico (W7).

## 7 · Regla de mutación 4 (citas)

Barrido con `git grep` fuera de `openspec/changes/archive`:
- `packages/shared/src/mapaBlueprint.test.ts:46`, `:65`, `:168`, `:188` (auditoría F1B-09:283, ENTRADA:2118, proposal, design): 46, 65 y 168 son los `it` que afirman; 188 es el cierre del último bloque previo. OK.
- `scripts/generar-mapa-blueprint.ts:14-24`, `:26-35`, `:28-31`, `:29`, `:31` (ENTRADA:2118, config.yaml:4172, auditoría, proposal, design): líneas sin cambio; 29 es `transiciones`, 31 es `estados`. Siguen siendo literalmente ciertas (ver W10).
- `packages/shared/src/mapaBlueprint.ts` (sólo citada en `proposal.md` y `design.md`): contrastadas con `git show a26ed48:` las líneas 23-30, 32-37, 54, 61, 108, 122, 150, 157, 161, 209, 219 y 225; todas dicen lo que la frase afirma y llevan «en a26ed48».
- `packages/shared/src/estados.ts:176-180` y `:182` (auditoría, design, proposal, cinco paquetes): comentario en 176-180, declaración en 182. OK.
- `docs/artefactos/NOTA.md` `:32-46`, `:33-46`, `:34-46`, `:55-56`, `:135-139`: edición en sitio 5 por 5, sin desplazamiento.
- Auditoría F1B-09, línea 310: existe, es la fila de `clientId`; 358 líneas antes y después.
- `packages/shared/src/index.ts:6` sigue siendo la exportación de `bodegaje`; la nueva exportación está en la línea 40.
- Apartado 4 de `docs/sdd/Paquete_de_Despliegue_2026-10-08.md`: no escribe ninguna cita `fichero:NN`. OK.
- `apply-progress.md`: comprobadas una a una las líneas que cita (guion 28, 37, 41; motor 32-34, 39, 62, 230; `mapaPorFlujo.ts` 25, 63, 74, 85; test 256-260, 371-376): correctas, salvo que dice «throw de colisión en la línea 91» y el `throw` está en `packages/shared/src/mapaPorFlujo.ts:92` (la 91 es el `if`) (S3).

## 8 · `tasks.md`

Las casillas marcadas cuadran con lo comprobado: restricciones de §2, ficheros generados idénticos a su regeneración (L2.38), `NOTA.md` y `estados.ts` a cero líneas netas (L3.1, L3.2), la rama no toca `config.yaml` ni `ENTRADA.md` (L3.6). Sin marcar a propósito: L1.19, L2.47 y L3.14 (del orquestador). 77 de 80 marcadas.

## 9 · Avisos

- **W1** Superviviente M7: la guarda gobernada por `Object.keys(fasePorEstado).length > 0` en lugar de `fases.length > 0` (`packages/shared/src/mapaBlueprint.ts:230`) deja las 1218 verdes. Un flujo con fases declaradas y `fasePorEstado` vacío saltaría la guarda sin que ninguna prueba lo vea.
- **W2** Superviviente M12: mover la guarda tras las vistas por fase no rompe nada. Benigno (sólo cambia qué error sale primero), pero es orden no probado en el sentido de la regla de mutación 1.
- **W3** Superviviente M10: la rama «sobra en disco» de `desfases` (`packages/shared/src/mapaBlueprint.test.ts:287-289`) no la ejercita ninguna prueba permanente; sólo se probó a mano en apply (L2.32). El título de P6 (T:371) afirma «sin ficheros de más».
- **W4** Superviviente M19: la cabecera de las vistas por fase ignora `fuentes` sin que nada caiga. P2 sólo aserta las fuentes en el diagrama completo (T:228).
- **W5** Superviviente M22: el guion puede escribir sólo los cuatro de servicio sin que caiga ninguna prueba (por diseño: `vitest.config.ts` no incluye `scripts/**`). Sólo el contraste (M21) está comprobado, a mano.
- **W6** Escenarios sin prueba permanente: RQ-MB-01 (no importa `permissions.ts`; la CLI delega), RQ-MB-05 («ningún fichero con hallazgos» recorre 4 de 6, T:124), RQ-MB-07 («sin `Pendiente` no falla»; las tres ids retiradas no se buscan en los `.md`) y RQ-MB-06 («cuarto flujo» sólo indirecto, P10 y P7).
- **W7** Acoplamiento entre pruebas (§6): un solo desfase produce 4-5 rojas; el P8 del flujo desfasado queda verde.
- **W8** Medida: `git diff --shortstat --no-renames e026903 c58fa88` da 634 inserciones y 115 borrados = **749**, sobre la válvula de 720 y bajo el techo de 800. `apply-progress.md` lo declara; la cifra de 595 de su línea 89 no incluye las casillas de `tasks.md`.
- **W9** Fin de línea en Windows: tras `git checkout -- <fichero>` los `.md` quedan en CRLF; el guion escribe LF y `git status` marca `M` sin diff de contenido. La prueba lo tolera (M18 demuestra que la normalización está vigilada).
- **W10** `docs/sdd/ENTRADA.md:2118` y `openspec/config.yaml:4172` dicen que el generador recibe «sólo el catálogo de servicio»; las líneas citadas existen, pero la frase queda incompleta. Es la tarea T-P1 de Supervisión (apartado 4.3 del paquete), no de esta rama.

## 10 · Sugerencias

- **S1** Contrastar las cadenas `fuentes` de `packages/shared/src/mapaPorFlujo.ts:40` y `:49` con los símbolos reales de `transitions.ts`.
- **S2** Relajar P5c (T:344) a igualdad de contenido en lugar de identidad.
- **S3** Corregir en `apply-progress.md` la línea del `throw` de colisión (92, no 91).
- **S4** Para cerrar W1 y W4 bastan dos aserciones: un caso con `fases` no vacío y `fasePorEstado` vacío que lance, y `fuentes` en la vista por fase de P2.

## 11 · Lo que NO pude comprobar

- El renderizado de los dos diagramas Mermaid (T-P5, del analista).
- La línea base de avisos de `npm run lint` en `a26ed48` (165 hoy).
- El comportamiento con fin de línea Linux/CI (sólo Windows).
- El contraste del guion con el registro alterado en un flujo nuevo (sólo en servicio, M21).
- Que los rojos de apply fueran por la razón escrita: se leen en `apply-progress.md` y no se re-ejecutaron.
- El detector de citas del hook `pre-push`: no lo ejecuté; el barrido de §7 es manual.
- `C:\dev\Desk_2_R1.023` no se tocó.
