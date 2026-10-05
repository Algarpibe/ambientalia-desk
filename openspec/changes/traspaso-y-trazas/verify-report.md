```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:a18c3df1368c1ab46b643e164d2d3e317e5ccd898517dd9c33b8131c0a998d73
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 8/8
scenarios: 30/30
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:9e844e7b9f2782da5dae8df5bde3ab4ef67bb3a24eaa0d7b4462e0ebf90a9ac9
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:e3b218e9ea199ec9236670d6a2b066e52b25e3755ec4f82fd2a440e31dfd7f5b
```

## Informe de verificación

**Cambio**: traspaso-y-trazas (F1B-05 sin la mitad de visibilidad, `cierra: no`)
**Versión**: N/A (deltas `trazas` y `derivacion-avisos`: 8 requisitos y 30 escenarios, contados con `grep`: 7 + 1 requisitos y 26 + 4 escenarios)
**Modo**: Strict TDD
**Revisión verificada**: `9858ca29be74d78a8d5ff2adc7493256d405f58c` en el worktree `C:\dev\Desk_2_R1.023-worktrees\traspaso-y-trazas` (base de la rama `9cfd37d`; commits `540f31c`, `4d88bd8`, `9858ca2`). `evidence_revision` = sha256 de «sha de HEAD, hash de la salida de test, hash de la salida de build», una por línea.

## Veredicto

**PASS WITH WARNINGS.** Cero CRITICAL, cinco WARNING, cuatro SUGGESTION. De los treinta escenarios, 28 están observados por una prueba que pasó y 2 de forma parcial (W-1 y W-2, ambos de `derivacion-avisos`: la unión de varias áreas y la llegada automática de un área nueva). Reproduje cuatro mutaciones del apply, más una quinta de contraste: las cuatro caen donde el apply dice y la quinta **sobrevive** (hallazgo W-1). El árbol queda limpio salvo este informe.

### Completitud
| Métrica | Valor |
|---|---|
| Tareas totales (casillas) | 63 |
| Tareas completas | 63 |
| Tareas incompletas | 0 |

`openspec/changes/traspaso-y-trazas/tasks.md`: 63 casillas `[x]`, 0 `[ ]`. Las siete filas de «Tareas de PERSONA — fuera del recuento» (`openspec/changes/traspaso-y-trazas/tasks.md:243-259`) son una tabla sin casillas y declaran que archivar no las da por hechas (regla del ciclo 1). Ninguna describe trabajo que una tanda pueda hacer en el repositorio: son decisiones de Gerencia, la comprobación en la aplicación y el despliegue. Las casillas 1.33 y 2.28 quedaron «a falta del detector de citas»; lo corrí yo sobre `HEAD` (ver abajo) y las respalda.

### Ejecución (códigos de salida REALES, medidos en este worktree)
| Orden | Exit | Resultado |
|---|---|---|
| `npm test` | **0** | 215 ficheros pasan, 2 saltados; 3345 pruebas pasan, 7 saltadas; 161 s. Los 2 saltados son `packages/zoho-sync/src/db/migrate.integration.test.ts` y `packages/zoho-sync/src/db/liberacion.integration.test.ts` (piden `TEST_DATABASE_URL`) |
| `npm run typecheck` | **0** | `tsc -b` y `tsc -p apps/desk/tsconfig.server.json --noEmit` limpios |
| `npm run lint` | **0** | 0 errores, 165 avisos (el mismo tope que la base: no suben) |
| `npm run build` | **0** | build del cliente |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 5720 citas comprobadas, 0 en línea base, 0 cabeceras R-1 inválidas; **16** abreviadas rotas informativas contra 13 en la base `9cfd37d`: las tres nuevas son las de W-3 |

**Cobertura**: no disponible (el proyecto no la configura).

### Cumplimiento de Strict TDD
`apply-progress.md` no trae la tabla «TDD Cycle Evidence» de la plantilla; trae el equivalente del proyecto: una tabla de rojos observados por tarea con el mensaje literal (lote 1) y otra con el orden explicado (lote 2). Los ficheros de prueba que cita existen y **pasan hoy** (corrida completa, exit 0). Triangulación: los escenarios con varios casos tienen varios `it` (`apps/desk/server/db/traspaso.test.ts` 20 pruebas, `apps/desk/server/escritoresTransiciones.test.ts` 8, `apps/desk/server/remisionRestaurada.test.ts` 6). Auditoría de aserciones: ninguna tautología ni aserción sin contraste; la única que llama la atención es la de W-1. Ver W-5 por la forma de la evidencia.

### Matriz de cumplimiento de la especificación
Rutas, todas bajo la raíz del worktree. RT = `apps/desk/server/remisionRestaurada.test.ts` (ruta real y pg-mem); RD = `apps/desk/server/db/remisionRestaurada.test.ts`; OA = `packages/zoho-sync/src/db/ovAsociaciones.test.ts`; ET = `apps/desk/server/db/eliminarTicket.test.ts`; EW = `apps/desk/server/escritoresTransiciones.test.ts`; TP = `apps/desk/server/db/traspaso.test.ts`; HT = `apps/desk/server/db/historial.test.ts`. Los números tras los dos puntos son líneas de esos ficheros. COMPLIANT = una prueba que pasó observa la aserción del escenario; PARCIAL = la prueba observa una parte y la otra sólo se lee.

**RQ-TZ-14 · restaurar deja rastro (6 escenarios: 6 COMPLIANT)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Anular y restaurar deja los dos hechos | RT:51 (cuatro columnas por la ruta real, con dos administradores) y RD:168 (el historial con esas columnas enseña «Remisión restaurada» y «Remisión anulada») | COMPLIANT (en dos pruebas encadenadas, no en una sola) |
| La anulación se guarda antes de vaciarla | RT:51 y RT:68 (`anulacion_previa_por` = «Admin») | COMPLIANT. Ver W-4: la mutación de posición es equivalente |
| Sin nombre en la sesión, respaldo | RT:68 (base envuelta para que la sesión llegue sin nombre; `restaurada_por` = `TRANSITION_ACTOR`) | COMPLIANT |
| Anulada, restaurada y anulada de nuevo | RT:93 (columnas) y RD:152 (los tres hechos y la creación, en orden) | COMPLIANT |
| Un segundo ciclo pisa el primero | RT:107 | COMPLIANT |
| Remisión nunca restaurada | RD:128, RD:180 (los títulos de la anulación vigente no cambian) | COMPLIANT |

**RQ-TZ-15 · liberar al borrar nombra al actor (2 escenarios: 2 COMPLIANT)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Dos vigentes y una ya liberada | OA:182 y ET:212 (la liberada conserva «Carla» y su instante) | COMPLIANT |
| Ticket sin vigentes | OA:200 (resuelve sin error y no toca la liberada de otro ticket); ET:228 (el simulacro no escribe) | COMPLIANT |

**RQ-TZ-16 · el barrido de escritores (4 escenarios: 4 COMPLIANT)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Los cuatro escritores de hoy pasan | EW:55 (inventario exacto 3 + 1) | COMPLIANT |
| Escritor sintético sin actor | EW:61 (copia del real con la columna renombrada; nombra el fichero) y mutación M-2 sobre el fichero vigilado | COMPLIANT |
| El barrido no encuentra nada | EW:82 | COMPLIANT |
| Procedimiento `.sql` sin actor | EW:93 (inventario exacto uno) y EW:99 (copia ensuciada) | COMPLIANT |

**RQ-TZ-17 · excepciones declaradas (1 escenario: 1 COMPLIANT)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Un ajuste de prioridad no aparece en el historial | TP:160 (eventos idénticos antes y después de sembrar `prioridad_ajustes`) y TP:169 (cuatro ficheros no nombran las tres tablas) | COMPLIANT, con el límite declarado en la propia prueba (mira cuatro ficheros, no lo que importan) |

**RQ-TZ-18 · línea de traspaso compuesta al leer (7 escenarios: 7 COMPLIANT)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Con persona derivada | TP:22 (objeto completo) y TP:131 (nombre resuelto por el historial, además de la transición) | COMPLIANT |
| Sin persona, destino por área | TP:31 (contra `areasSiguientes` y `areasAAvisar`, llamadas en la prueba) | COMPLIANT (con W-1 sobre la unión de varias áreas) |
| Clave `derivado_a` vacía | TP:46 | COMPLIANT. Ver S-1: usa blancos, no la cadena vacía literal |
| Id que no resuelve | TP:51 | COMPLIANT |
| La persona no cambia | TP:55 | COMPLIANT |
| Estado terminal y sin persona | TP:65 | COMPLIANT |
| Abrir el historial no escribe | TP:146 (espía: ningún INSERT, UPDATE ni DELETE, y la tabla `avisos` idéntica) | COMPLIANT |

**RQ-TZ-19 · creación y marcador no son traspasos (4 escenarios: 4 COMPLIANT)**
| Escenario | Prueba | Resultado |
|---|---|---|
| La creación no genera traspaso | TP:86 | COMPLIANT |
| Marcador de identidad (destino vacío) | TP:90 | COMPLIANT |
| Marcador con destino | TP:94 y TP:139 (por el historial); mutación M-3 | COMPLIANT |
| Transición normal con destino nulo | TP:100 | COMPLIANT |

**RQ-TZ-06 modificado (2 escenarios: 2 COMPLIANT)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Zoho y app conviven | HT:15 y HT:189, actualizadas para esperar el traspaso encima de su transición | COMPLIANT |
| Remisión anulada y restaurada sigue en la historia | RD:168 | COMPLIANT |

**RQ-AV-18 · el destino y el aviso salen de la misma derivación (4 escenarios: 2 COMPLIANT, 2 PARCIAL)**
| Escenario | Prueba | Resultado |
|---|---|---|
| El destino por área coincide con la base del aviso | TP:31 compara contra `areasSiguientes` y `areasAAvisar` para «Ingresado», que tiene **una** sola área; TP:40 se titula «varias áreas se unen con coma» y afirma sólo «Comercial» | **PARCIAL**: ver W-1 |
| Un ticket `Equipo nuevo` usa su catálogo | TP:70 (`Verificación`: vacío con `TRANSITIONS`, «Servicio Técnico» con el de equipo nuevo) | COMPLIANT |
| Una área nueva en el catálogo llega sola | Ninguna prueba lo ejercita; se apoya en que `apps/desk/server/db/traspaso.ts:33` llama a la función compartida y en la mutación de lista fija del apply | **PARCIAL**: ver W-2 |
| Componer la línea no crea avisos | TP:146 (tabla `avisos` idéntica antes y después) | COMPLIANT |

**Total**: 30 escenarios. 28 COMPLIANT, 2 PARCIAL, 0 FAILING, 0 sin prueba. 8 requisitos, los 8 con al menos un escenario observado.

### Mutaciones reproducidas por mí
Todas sobre una copia de seguridad en el directorio temporal de la sesión, restaurada después; `git status --short` vacío tras cada tanda y al final.
| # | Lote | Mutación | Resultado |
|---|---|---|---|
| M-1 | 1 | Quitar del SET de `restaurarRemision` las dos asignaciones de copia (`apps/desk/server/db/remisiones.ts:152`) | Rojo, 4 pruebas de RT: `expected null to be 'Admin'` (RT:51, RT:68, RT:93) y `expected null to be 'Beto'` (RT:107) |
| M-2 | 1, fichero vigilado | En el `.sql` real `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`, renombrar `performed_by` en la línea 46 | Rojo, 1 de 8 de EW: «el inventario es exactamente uno, y nombra `performed_by`» |
| M-3 | 2 | Quitar la exclusión del marcador (`apps/desk/server/db/traspaso.ts:26`) | Rojo, 2: TP:94 (`expected [ { eventName: 'AppTraspaso', …(4) } ] to deeply equal []`) y TP:139 (`expected [ Array(3) ] to deeply equal [ 'AppTransition', 'AppTransition' ]`) |
| M-4 | 2, posición | Emisión transición y luego traspaso, en vez de traspaso y luego transición (`apps/desk/server/db/historial.ts:142-144`) | Rojo, 4: HT:15, HT:189, TP:123 (misma hora, D-13) y TP:131 |
| M-5 | 2, contraste | Cambiar el `join` de las áreas por tomar sólo la primera, en `apps/desk/server/db/traspaso.ts:33` | **VERDE, 20/20: la mutación sobrevive.** Es W-1 |

### Restricciones y reglas del proyecto — comprobadas, no supuestas
| Punto | Evidencia | Resultado |
|---|---|---|
| Ningún `.tsx` tocado | `git diff --stat 9cfd37d HEAD` filtrado por `*.tsx`: vacío | OK |
| `ALTER` calificadas y al final | `packages/zoho-sync/src/db/schema.sql:719-724`: dos comentarios y cuatro `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS`, tras la última sentencia previa; el fichero pasa de 718 a 724 líneas y la diff sólo añade | OK |
| Regla invariable 13 / mutación 3 | Casilla en `openspec/changes/traspaso-y-trazas/apply-progress.md` (sección «2.26 (a)»): cuatro decisiones del cliente, cada una con su línea. Las comprobé: `apps/desk/server/services/ticketService.ts:138-142` (persona existente y activa), `packages/shared/src/transitions.ts:189` (casilla opcional), `apps/desk/server/transitionExec.test.ts:101` (la prueba del checkbox ausente), `apps/desk/server/routes/remision.ts:329` y `apps/desk/server/routes/remision.ts:341` (anular y restaurar tras `requireAdmin`) | OK |
| Sin decisiones de cliente nuevas | El diff no toca `apps/desk/src`; `HistoryEvent` no cambia | OK |
| Sin variable de entorno ni flag nuevos | La diff de `apps/` y `packages/` no añade `process.env` (el respaldo `TRANSITION_ACTOR` ya existía en `apps/desk/server/transitionActor.ts:3`) | OK |
| Desplazamiento de líneas | `wc -l` hoy: `historial.ts` 162, `remisiones.ts` 240, `routes/remision.ts` 397, `routes/tickets.ts` 223, `eliminarTicket.ts` 189, `ovAsociaciones.ts` 184, `migrate.test.ts` 765, `registro.test.ts` 248; las líneas añadidas se editaron en sitio salvo en `schema.sql`. Desplazamiento cero | OK |

### Regla de mutación 4 — barrido de citas hecho por mí
Con `git grep -noE` de la forma completa de cada fichero, sin `openspec/changes/archive/` ni este cambio, y leyendo qué afirma cada frase:
- **`historial.ts`** (15 citas): cambió el texto de las líneas 3, 120, 137, 142-144 y 151. Sólo se cita la 137: `apps/desk/server/migracionMarcadorLectores.test.ts:62` dice que lo enseñan como «Transición», y esa línea sigue siendo la consulta de `ticket_transitions`; caso A, cierta. Las citas de `openspec/specs/trazas/spec.md` a la unión (línea 157 de `historial.ts`), a `nombresDerivados` (141), y a los rangos 126-131 y 131-161 leen hoy lo que afirman. La de `openspec/specs/trazas/spec.md:471` en `5e449da` (rango 66-121 de `historial.ts`) dice «tres eventos de remisión»: sigue siendo la función entera (`eventosRemision`), pero **hoy emite hasta cinco**; la frase la sustituye el requisito RQ-TZ-06 modificado al fusionar el delta (ver S-3).
- **`routes/remision.ts`** (8 citas a las líneas 333 a 344): la única cuyo texto cambió es la 344, citada por la bandeja E-219 (`docs/sdd/ENTRADA.md:2103`) y dice «restaurar»: cierta. Las demás apuntan a líneas intactas.
- **`routes/tickets.ts`**: la línea 91 cambió de texto y sólo la cita E-219 (`docs/sdd/ENTRADA.md:2103`): cierta.
- **`eliminarTicket.ts`**: las cuatro citas a la línea 154 (paquetes de despliegue fechados de 29/09, 30/09 y 01/10) hablaban de la llamada sin actor: **caso B**, no se renumeran; correcto no tocarlas. Las demás (96-98, 116, 166, 175-189) apuntan a líneas no editadas.
- **`ovAsociaciones.ts`**: ninguna cita a la línea 132 o posteriores. **`migrate.test.ts`**: una sola, en el paquete de despliegue fechado del 04/10 (b), a las líneas 374-376, que decía 55/29 y hoy dice 59/33: caso B. **`registro.test.ts`**: sin citas.
- **Forma abreviada:** el segundo pase sobre `openspec/specs/trazas/spec.md` no encuentra una que apunte a líneas editadas. Las tres abreviadas nuevas que cazó el detector son las de W-3.
- **Maestro:** comprobé contra `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md` las líneas 2029-2033 (registro del traspaso), 2035 (reasignación con motivo), 2037 (restricción por propietario), 2060-2062 (fila «Línea de traspaso en el historial, aviso personal y reasignación con motivo», «Propuesto R08.4», recomendación «sin empezar») y 2085 (actor de respaldo): dicen lo que las frases afirman.

### Bandeja y correcciones
- **E-219, E-220 y E-221** están al final de `docs/sdd/ENTRADA.md` (tras E-218, que era la última), cada una con `Dueño: Gerencia`, «Qué desbloquea» y `Destino: punto abierto con dueño (R-3)`; E-220 añade «si se aprueba, fila del §5». R-3 cumplida. El hallazgo del apply sobre `packages/zoho-sync/src/db/migrate.test.ts` no va a la bandeja y se justifica (ya resuelto, sin destino que decidir).
- **Corrección 26** al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`: cita `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2060-2062`, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2029-2033` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2085` con el nombre completo; las tres dicen lo que se afirma. Sin menciones a reuniones.

### Coherencia con el diseño (D-n) y la propuesta
| Decisión | Cumplida | Evidencia |
|---|---|---|
| D-1 cuatro columnas, anulables, `anulada_*` conserva su significado | Sí | `packages/zoho-sync/src/db/schema.sql:721-724`; los lectores de `anulada_at` no cambian |
| D-2 un solo UPDATE con la copia antes del vaciado y `AND anulada_at IS NOT NULL` | Sí | `apps/desk/server/db/remisiones.ts:152`; pg-mem lo acepta (sin el respaldo de dos sentencias) |
| D-3 `quien: string`, respaldo en la ruta | Sí | `apps/desk/server/routes/remision.ts:344` |
| D-4 `anularRemision` no se toca | Sí | `apps/desk/server/db/remisiones.ts:146-148` intacta |
| D-5 derivador aparte, bloque de la anulación vigente intacto | Sí | `apps/desk/server/db/remisionRestaurada.ts`, `apps/desk/server/db/historial.ts:120` |
| D-6 y D-7 actor sin valor por defecto | Sí | `packages/zoho-sync/src/db/ovAsociaciones.ts:132`; `apps/desk/server/db/eliminarTicket.ts:102` (la unión de simulacro, o borrado real con `actor: string`); el typecheck lo impone |
| D-8 y D-9 barrido en `apps/desk/server`, inventario exacto, cero es rojo | Sí | `apps/desk/server/escritoresTransiciones.test.ts` |
| D-10 a D-12 módulo en `apps/desk/server/db`, `areasSiguientes` llamada directa, clasificación actual | Sí | `apps/desk/server/db/traspaso.ts:33`; ver S-2 sobre la clasificación |
| D-13 emisión traspaso y luego transición | Sí | `apps/desk/server/db/historial.ts:142-144`; M-4 |
| D-14 exclusiones en orden: creación, marcador por identificador, destino | Sí | `apps/desk/server/db/traspaso.ts:25-26` |
| D-15 a D-18 `HistoryEvent` sin cambios, etiquetas «De» y «A», `conversacion.ts` y casilla sin tocar | Sí | TP:78; `git diff --stat` sin `conversacion.ts` |

**Desvíos que el apply declaró.** (1) Una segunda prueba de `packages/zoho-sync/src/db/migrate.test.ts` (la de la línea 648, con la cuenta en la 652) que el diseño no preveía: editada en sitio, sin mover líneas; no rompe ninguna especificación; desvío de diseño menor, resuelto y ya recogido como lección. (2) La mutación de posición dentro del SET es **equivalente** (pg-mem y PostgreSQL evalúan el lado derecho sobre la fila vieja); correcto anotarlo como tal y no forzar una prueba. Ver W-4.

**Criterios de aceptación de la propuesta.** Del 1 al 9 cumplidos y observados (6 a 9 por TP; 4 por EW; 3 por OA y ET; 2 por RT:68; 1 por RT más RD). El 10: `apps/desk/server/reconciliacion/registro.test.ts:218-220` cuenta DIEZ y los tres comandos pasan. El 11: el barrido no deja ninguna cita rota en los ficheros tocados salvo las tres informativas de W-3, que están en un fichero del propio cambio y no bloquean.

### Huecos buscados
- **Restauración doble o concurrente:** la segunda llamada no escribe nada porque el WHERE pide `anulada_at IS NOT NULL` (RT:80 lo fija para la vigente). En PostgreSQL con READ COMMITTED, la segunda sentencia espera el candado de la fila, reevalúa el WHERE sobre la fila ya vaciada y no la toca (hipótesis por la semántica documentada del motor; **no hay prueba concurrente**, ni la admite pg-mem: S-4).
- **Anulada, restaurada, anulada, restaurada:** el historial muestra la creación, la anulación del ciclo 2 y su restauración. Los dos hechos del ciclo 1 **dejan de aparecer** después de la segunda restauración. Es coherente con S-2 y está declarado en E-221, pero es una regresión de lo que el panel enseñaba justo antes (W-5, nota).
- **`liberada_por` con actor de respaldo:** la ruta (`apps/desk/server/routes/tickets.ts:91`) cae a `TRANSITION_ACTOR` si la sesión no trae nombre; va tras `requireSuperAdmin`, así que en la práctica siempre hay usuario. Se escribe un nombre más, indistinguible de una persona: E-219.
- **Línea de traspaso con casos raros** (ejecutado con `tsx` en un fichero temporal ya borrado): `values` nulo, un arreglo o un número dan destino por área; `performed_by` nulo da origen «App»; `to_status` fuera del catálogo da **ninguna línea**; `derivado_a` numérico u objeto salen como texto, igual que el campo de la transición. Un `values` que sea el **texto** `null` lanza un error de lectura de propiedad de nulo; ocurre sólo en pg-mem y ya lanzaba antes en `nombresDerivados` y en `camposDiligenciados` (no es nuevo).
- **Orden estable con la misma hora:** `porFechaDesc` (`apps/desk/server/db/ticketFuentes.ts`) devuelve 0 con instantes iguales y `Array.prototype.sort` es estable, así que el orden de emisión se conserva; M-4 y TP:123 lo fijan.
- **Otros lectores:** el historial sólo lo consume `apps/desk/server/routes/tickets.ts:169` y `apps/desk/server/routes/tickets.ts:178`. `apps/desk/server/db/conversacion.ts:140`, la hoja de vida (`apps/desk/server/db/equipos.ts:275`), indicadores (`apps/desk/server/indicadores.ts:76`), SLA (`apps/desk/server/db/sla.ts:88`) y `apps/desk/server/db/primerDerivado.ts:26` hacen consultas propias a `ticket_transitions`; no pasan por `getHistorialTicket` y no cambian de comportamiento. No se añade ninguna fila a esa tabla.

### Hallazgos

**CRITICAL (0)**: ninguno.

**WARNING (5)**
- **W-1 · La unión de varias áreas del destino no está probada, y el título de la prueba afirma lo contrario.** `apps/desk/server/db/traspaso.test.ts:40` se titula «varias áreas se unen con coma» pero usa `OV asignada`, que da **una** sola área (Comercial); TP:31 usa `Ingresado`, también una. Reproducción: en `apps/desk/server/db/traspaso.ts:33` sustituir el `join` por tomar sólo la primera área; las 20 pruebas siguen verdes (M-5). El escenario del delta (Comercial y Compras) no se observa. Hay estados con varias áreas en el catálogo de servicio, p. ej. `En Espera de Repuestos` (Comercial, Compras) y `Notificación Comercial` (tres), medidos con `tsx`. Remedio: un caso con `to_status: 'En Espera de Repuestos'` que espere `Comercial, Compras`, y renombrar TP:40.
- **W-2 · «Una área nueva llega sola a la línea» no tiene prueba propia.** Sólo se sostiene por la lectura de `apps/desk/server/db/traspaso.ts:33` y por la mutación de lista fija del apply, que cae por el catálogo de equipo nuevo. Aceptable bajo la regla 13, pero el escenario queda «cubierto por lectura» más que observado.
- **W-3 · Tres abreviadas rotas informativas nuevas en `openspec/changes/traspaso-y-trazas/apply-progress.md`, línea 92** (confirmadas; son las únicas nuevas: la diferencia del detector contra `9cfd37d` es exactamente esas tres). Los rangos 2060-2062, 2029-2033 y 2085 están escritos en forma abreviada detrás de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, así que el detector los lee contra ese fichero (1.394 líneas) y los da por fuera de rango. No bloquean. Redacción propuesta: en esa línea, sustituir las tres formas abreviadas por las citas completas `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2060-2062`, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2029-2033` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2085`. No edité `apply-progress.md`: es del apply.
- **W-4 · La posición de la copia dentro del SET no está probada, ni puede estarlo en pg-mem.** El apply lo declara (mutación equivalente) y lo acepto como no defecto, pero el escenario «La posición importa» del delta es de hecho una propiedad de PostgreSQL (el lado derecho se evalúa sobre la fila vieja), no de este código. Sólo una prueba contra PostgreSQL real la observaría; las dos pruebas de integración del paquete están saltadas aquí por falta de `TEST_DATABASE_URL` y no cubren la restauración. Sin acción obligatoria.
- **W-5 · La evidencia de TDD del apply no sigue la plantilla del módulo** (no hay tabla con columnas RED, GREEN, TRIANGULATE y SAFETY NET). Hay rojos literales por tarea, el orden explicado y las medidas, que es lo que el proyecto viene archivando; se anota por transparencia. Nota aparte: la pérdida de los hechos del ciclo 1 al restaurar por segunda vez es un compromiso declarado (S-2, E-221) y no un defecto; se deja aquí para quien decida la tabla de eventos de remisión.

**SUGGESTION (4)**
- **S-1** TP:46 prueba la clave vacía con blancos, no con la cadena vacía literal que nombra el escenario; ambos caen en la misma rama (`apps/desk/server/db/traspaso.ts:29`, que recorta), así que es fidelidad al texto del escenario.
- **S-2** La línea de traspaso toma la clasificación **actual** del ticket (D-12, declarado): si un ticket cambia de Servicio a Equipo nuevo, el destino por área de sus traspasos pasados se recalcula con el otro catálogo. Mismo límite que ya tiene «Cliente» en la creación.
- **S-3** `openspec/specs/trazas/spec.md:471` en `5e449da` dirá «tres eventos de remisión» hasta que se fusione el delta; al archivar conviene comprobar que la fusión reescribe esa celda (hoy se emiten hasta cinco).
- **S-4** Añadir en CI (donde sí hay `TEST_DATABASE_URL`) una prueba de integración de `restaurarRemision`: restauración doble y orden de la copia contra PostgreSQL real, que es lo único que cierra W-4 y el hueco de concurrencia.

### Abierto, y archivar no lo cierra
Todo esto es de personas o de otro cambio, y está escrito en `docs/sdd/ENTRADA.md` y en `openspec/changes/traspaso-y-trazas/tasks.md:243-259`:
1. **E-089 (visibilidad por área), Gerencia.** Sin respuesta; es lo que mantiene `cierra: no` en F1B-05.
2. **E-220 (protocolo de traspaso), Gerencia.** Reasignación con motivo, aviso personal adicional y restricción por propietario siguen sin aprobar ni construir.
3. **E-219 (actor que no es una persona), Gerencia.** `restaurada_por` y `liberada_por` pueden llevar el respaldo `TRANSITION_ACTOR` y se leen como una persona.
4. **E-221 (excepciones de traza y límite de S-2 y S-3), Gerencia.** Decide la tabla de eventos de remisión y el relleno retroactivo de restauraciones y liberaciones anteriores (toca datos de producción).
5. **Corrección 26 al maestro**, texto en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`: la pega Gerencia en el `.docx`.
6. **Despliegue y comprobación de las cuatro columnas** de `public.remisiones` por una persona con acceso a producción; sin relleno, las restauraciones anteriores siguen sin rastro (S-3).
7. **Comprobación visual del panel de historia** por el analista (el panel no se ha leído: los `.tsx` están fuera de la red de pruebas por decisión de Gerencia). Cubre también el ruido de S-4 de la propuesta (línea «Comercial → Comercial»).
8. **Fusión de la rama a `main`, `settle` del intento y archivo**: del orquestador y del analista, no casillas de este cambio.
9. **W-1 y W-3** son reparables en el mismo cambio antes de archivar si el orquestador lo decide; ninguno bloquea.

## Remediación dentro del mismo intento (orquestador, 2026-10-05)

Hecha después de escribir este informe; lo de arriba describe `9858ca2` y no se reescribe.

- **W-1, cerrado con prueba.** La prueba que se titulaba «varias áreas se unen con coma» usaba un estado de una sola área; se retitula en sitio («una sola área…») y se añade, al final de `apps/desk/server/db/traspaso.test.ts`, la que faltaba: «En Espera de Repuestos» da más de un área y la línea las enseña todas, unidas con coma.
- **W-2, cerrado con prueba.** En el mismo bloque nuevo, un barrido de todos los estados de llegada del catálogo de servicio compara el destino de la línea con lo que devuelve `areasSiguientes`: un área añadida al catálogo llega a la línea sin tocar el compositor.
- **Mutación de contraste, ahora roja.** Tomar sólo la primera área en vez de unirlas —la que este informe dio VERDE con 20 de 20— deja en rojo las dos pruebas nuevas (2 fallidas, 20 pasadas); restaurado desde copia y `git diff` del módulo vacío.
- **W-3, reparado.** Las tres abreviadas de la línea 92 de `apply-progress.md` llevan ahora el nombre completo del maestro R08.4.
- **Siguen abiertos, y archivar no los cierra:** W-4 (la posición dentro del `SET` sólo la observaría PostgreSQL real), W-5 (forma de la evidencia de TDD) y las cuatro sugerencias. S-3 se atiende al fusionar el delta.
- Las pruebas nuevas se añadieron AL FINAL del fichero para no desplazar las líneas que este informe cita.
