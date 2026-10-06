# Verify · `ficha-garantia-proveedor` (F1B-13, `cierra: no`)

**VEREDICTO: PASS WITH WARNINGS** — 0 CRITICAL, 3 WARNING, 7 SUGGESTION. Escenarios: 77 en 8 requisitos; 71 CUBIERTOS por prueba en ejecución, 3 por mutación o lectura, 3 PARCIALES, 0 SIN PRUEBA.
Mutaciones propias: 99 aplicadas, 83 rojas, 16 supervivientes (7 equivalentes, 9 reales; ninguna de gravedad CRITICAL).
Verificador independiente; partida `77fb526`, HEAD `a4bb24d` (rama `ficha-garantia-proveedor`). No me fié de `apply-progress.md`: todo lo de abajo lo leí o lo ejecuté yo.

## 1. Comandos (ejecutados por mí, en el worktree)

| Comando | Salida |
|---|---|
| `npm test` | **0** — 240 ficheros pasan, 2 saltados (integración con BD real); 3.734 pruebas pasan, 7 saltadas (237 s). sha256 de la salida `d4c92b8b…a2e09` |
| `npm run typecheck` | **0** |
| `npm run lint` | **0** — 0 errores, 165 avisos; ninguno en los diez ficheros nuevos o tocados (los pasé aparte con `eslint`: sin salida) |
| `npm run build` | **0** — última línea «built in 3.52s». sha256 de la salida `70be8286…5a` |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** — 6.362 comprobadas, línea base 0, cabeceras R-1 inválidas 0; 13 abreviadas rotas informativas, ninguna en ficheros del cambio |

Tras las 99 mutaciones, `git status --short` estaba vacío: las 99 restauraciones se comprobaron byte a byte (`restaurado=true` en cada una).

## 2. Cumplimiento (requisito · escenario · prueba · resultado)

Pruebas: `R` = `apps/desk/server/routes/garantiaProveedor.test.ts` (37), `D` = `apps/desk/server/db/garantiaProveedor.test.ts`, `S` = `apps/desk/server/services/avisoReclamacionProveedor.test.ts`, `H` = `packages/shared/src/garantiaProveedor.test.ts`, `M` = `packages/zoho-sync/src/db/migrate.test.ts`, `C` = `packages/shared/src/cargos.test.ts`. Todas verdes en mi ejecución completa.

**RQ-TC-44 (18 escenarios)**
| Escenario | Prueba (fichero · it) | Resultado |
|---|---|---|
| «sí» abre la ficha | R «un «sí» abre la ficha en abierta con 201 y origen manual»; D «ida y vuelta de un «sí»…» | PARCIAL: `respondidaPor` (quién) no se asserta en la ruta (W-1) |
| «no» guarda motivo | R «un «no» con motivo da 201 y no abre ficha»; R «la lectura: …» (ya no pendiente) | CUBIERTO |
| «no» sin motivo / fuera de lista | R «un «no» sin motivo y con motivo fuera de lista dan 422» | CUBIERTO (no asserta «no se escribe nada», S-7) |
| «sí» sin fabricante / sólo espacios | R «un «sí» sin fabricante o con fabricante de sólo espacios da 422»; H it.each | CUBIERTO |
| segunda respuesta (S-10) | R «una segunda respuesta da 409 y la guardada sigue siendo la primera» | CUBIERTO |
| carrera 23505 | R «la carrera de dos respuestas da un 201 y un 409»; D «una segunda respuesta… ReclamacionYaRespondidaError» | CUBIERTO |
| no es OVI / no existe y `abc` / liberada / sin cargo | R «una asociación OV- ordinaria da 422, una inexistente y un id no numérico 404, una liberada 409 y sin cargo 403» | CUBIERTO |
| POS G1<G2, G2<G3, G2<G6, G3<G4, G4<G5, G5<G6 | R POS-RS-1, -2, -6, -3, -4, -5 | CUBIERTO |
| POS G3<G5 | sin prueba propia: sale por transitividad de POS-RS-3 y POS-RS-4 (no hay orden que viole G3<G5 y cumpla las dos) | CUBIERTO por transitividad |
| liberada y respondida, distinguibles por el texto | R POS-RS-7 | CUBIERTO |

**RQ-TC-45 (6)**
| Escenario | Prueba | Resultado |
|---|---|---|
| tabla calificada, guardián cuenta 29/42 | M «son 42 tablas…» y «toda tabla del esquema está clasificada…» | CUBIERTO |
| sentencia sin calificar se rechaza (mutación 2) | M «toda tabla del esquema está clasificada…» + mis F-1 y F-2 | CUBIERTO por mutación (rojo visto) |
| tres listas con tres valores | H «cada lista tiene tres valores y cada clave tiene etiqueta» | CUBIERTO |
| valor manual con origen | D «ida y vuelta de un «sí»…» (800000, `manual`); R «un «sí» abre…» | CUBIERTO |
| valor no automático | D «valor reclamado vacío no se calcula…» (el título dice «sin origen», el código guarda `manual`: S-3) | CUBIERTO |
| RMA vacío al abrir | D ida y vuelta (`rma: null`); R «camino feliz» | CUBIERTO |

**RQ-TC-46 (11)** — R «abierta → enviada sin más datos, y enviada → resuelta…»; R ««rechazada» sin valor guarda 0 y con valor distinto de 0 da 422» (el `0` explícito lo cubre H «rechazada acepta ausente y 0…»); R ««reposición» y «nota crédito» sin valor, no numérico o negativo dan 422» (resultado ausente o fuera de lista: H «resultado fuera de la lista o ausente es error» + mi C-RT-22 roja); R «saltar, retroceder y avanzar una resuelta dan 409»; R «una ficha inexistente, un id no numérico y una respuesta «no» dan 404»; R «sin cargo, avanzar y editar dan 403»; POS-AV-1, -2, -3. **CUBIERTO (11/11).**

**RQ-TC-47 (9)** — R «editar el RMA de una «enviada» no cambia el estado ni las fechas»; R «editar con fabricante vacío, valor -1 o «abc» da 422; una ficha resuelta da 409; el estado del cuerpo se ignora» (cubre 3 escenarios); R 404 (la misma «una ficha inexistente…»); R «sin cargo…»; POS-ED-1, -2, -3. **CUBIERTO (9/9).**

**RQ-TC-48 (7)** — R «sin cargo: 403 en las tres escrituras y 200 en la lectura»; R «sin sesión las cuatro rutas dan 401»; R «la lectura: OVI vigente sin respuesta pendiente, «no» no, OV- nunca, liberada sin respuesta fuera» (cubre 3); R «una OVI anterior al cambio sale pendiente sin fila»; R «liberar la asociación… deja la ficha intacta, editable y avanzable». **CUBIERTO (7/7).**

**RQ-TC-49 (3)** — R «el servidor rechaza con 403 lo que el panel ocultaría y con 409 el paso que no ofrecería» (cubre 2). «`pendiente` no es dato del cliente»: por lectura, `PanelGarantiaProveedor.tsx:158,163,166,179` sólo consumen `o.pendiente` y `db/garantiaProveedor.ts:151` lo calcula. **CUBIERTO (2 por prueba, 1 por lectura).**

**RQ-PM-26 (7)** — R «el Director Técnico con sólo el área Comercial y el administrador sin cargo pasan; el Director Comercial no» (el administrador sólo se prueba en responder, mismo predicado: parte de S-1); R «sin cargo: 403…»; R «sin sesión…»; R «sin cargo, avanzar y editar dan 403»; H «un sujeto ausente no puede» y «coincide con puedeCrearOVIGarantia para los ocho cargos»; C «PM20-2» (un solo predicado; la ruta no contiene el literal del cargo). **CUBIERTO (7/7).**

**RQ-AV-19 (16)** — S it.each «día 59/60/61»; S «una ficha «enviada» a 75 días avisa»; S «una ficha resuelta no avisa, ni una respuesta «no»»; S «días naturales: …sábado…»; S «un solo aviso por ficha…»; S «si crearAviso falla…» y «sin fallo: BEGIN, SELECT, UPDATE, INSERT, COMMIT»; S «dos pasadas concurrentes»; S «destinatariosDeCargoPermiso filtra por cargo_permiso…»; S «con alguien en el cargo… NO también al área»; S «respaldo: si nadie lleva el cargo…» (**PARCIAL: un solo usuario de área, «a cada destinatario» sin probar, W-2**); S «sin nadie ni en el cargo ni en el área…» (D-11); S «la pasada no lanza…» y «con la base caída…»; S «dos pasadas el mismo día evalúan una sola vez»; S «texto: …sólo de bandeja» (`enviado_at` NULL); S «index.ts: …ANTES de sync.syncRecent()». **CUBIERTO 15, PARCIAL 1.**

### Regla 13 con MIS líneas (cliente `PG` = `apps/desk/src/components/PanelGarantiaProveedor.tsx`, servidor `RT` = `apps/desk/server/routes/garantiaProveedor.ts`)

Leí el panel entero contra las rutas. Coincide con la tabla de `apply-progress.md:170-185`; ninguna decisión del cliente queda sin línea de servidor.
| # | Decisión del cliente | Línea cliente | Línea servidor que la impone |
|---|---|---|---|
| 1 | Enseña pregunta, edición, paso y resolver sólo a quien `puedeGestionarReclamacion` | `PG:176` (consumido de `shared`), `:166`, `:122`, `:129`, `:141` | responder `RT:43` (G2), editar `RT:71` (G12), avanzar `RT:92` (G8) |
| 2 | Pregunta sólo en filas `pendiente` | `PG:166` | `RT:45` (G3), `RT:47-49` (G4), `RT:55` y `:59` (G6) |
| 3 | Tres opciones del «no» de `MOTIVOS_NO_RECLAMA` | `PG:94` | `RT:51-52` → `packages/shared/src/garantiaProveedor.ts:146` |
| 4 | Ofrece sólo `siguienteEstado` | `PG:111,125,126` | `RT:94-95` (G9) |
| 5 | Fabricante propuesto = marca | `PG:84` | relleno; el servidor sólo exige no vacío `RT:52`, `RT:77` (`shared:132`) |
| 6 | Pinta «Pendiente de respuesta» | `PG:158,163,179` | no decide; lo calcula `apps/desk/server/db/garantiaProveedor.ts:151` |
| 7 | Oculta editar en ficha resuelta | `PG:122` | `RT:74` (G13) y el SQL `apps/desk/server/db/garantiaProveedor.ts:117` (carrera, `RT:80`) |
| 8 | «rechazada» no pide valor recuperado | `PG:146-147` | `RT:97-98` → `shared:175-179` (G10) |
| 9 | No pinta el panel sin OVI | `PG:178` | no decide; lista vacía de `apps/desk/server/db/garantiaProveedor.ts:143` |
| 10 | Campo numérico vacío viaja `null`, no numérico viaja texto sin validar | `PG:27` | `RT:52`, `RT:77`, `RT:98` rechazan con 422 y `PG:40` enseña el texto |

Límite ya declarado, que no es hallazgo: liberar una orden no recarga el panel hasta reabrir el ticket (`apply-progress.md:194`).

## 3. Guardas (líneas reales de `apps/desk/server/routes/garantiaProveedor.ts`) y su prueba de posición

| Guarda | HTTP | Escalón | Línea | Par vecino → prueba con las dos activas (mutación mía que la puso roja) |
|---|---|---|---|---|
| G1 asociación existe | 404 | A | `:41` | G1<G2 → POS-RS-1 (P-1) |
| G2 cargo | 403 | B | `:43` | G2<G3 → POS-RS-2 (P-2); G2<G6 → POS-RS-6 |
| G3 liberada | 409 | B | `:45` | G3<G4 → POS-RS-3 (P-3); G3<G6 → POS-RS-7 (P-11) |
| G4 es OVI | 422 | C | `:47-49` | G4<G5 → POS-RS-4 (P-4) |
| G5 contenido | 422 | C | `:51-52` | G5<G6 → POS-RS-5 (P-12) |
| G6 ya respondida | 409 | D | `:55`, `:59` (23505) | índice único `schema.sql` (F-5 roja) |
| G11 ficha existe (un «no» no es ficha) | 404 | A | `:69` | G11<G12 → POS-ED-1 (P-5) |
| G12 cargo | 403 | B | `:71` | G12<G13 → POS-ED-2 (P-6) |
| G13 resuelta | 409 | B | `:74` (+ SQL `db:117`, carrera `:80`) | G13<G14 → POS-ED-3 (P-7) |
| G14 contenido | 422 | C | `:76-77` | — |
| G7 ficha existe | 404 | A | `:90` | G7<G8 → POS-AV-1 (P-8) |
| G8 cargo | 403 | B | `:92` | G8<G9 → POS-AV-2 (P-9) |
| G9 paso permitido | 409 | B | `:94-95` | G9<G10 → POS-AV-3 (P-10) |
| G10 contenido del paso | 422 | C | `:97-98` | — |

Los once pares vecinos tienen prueba de posición y las once swaps de bloque entero salieron rojas. Se corresponden con el orden A<B<C<D declarado en `design.md` §6 y en la spec. G3<G5 sale por transitividad (ver §2).

## 4. Mutaciones propias (99 aplicadas con `herramientas/mut.mjs`; fuentes en CRLF, así que los bloques de posición usan anclas de varias líneas con CRLF)

JSON en `scratchpad/verify-fgp/` (`m-pos.json`, `m-fv.json`, `m-cond-a.json`, `m-cond-b.json`, `m-extra.json`). **83 rojas, 16 supervivientes (7 equivalentes, 9 reales), 0 sin aplicar** (C-SH-9 no casó el ancla a la primera y se rehízo en `m-extra.json`).

**POSICIÓN (13, todas rojas).** Intercambié el bloque entero de: P-1 G2 antes de G1; P-2 G3 antes de G2; P-3 G4 antes de G3; P-4 G5 antes de G4; P-5 G12 antes de G11; P-6 G13 antes de G12; P-7 G14 antes de G13; P-8 G8 antes de G7; P-9 G9 antes de G8; P-10 G10 antes de G9 (2 rojas); P-11 consulta previa de G6 antes de G3 (2 rojas); P-12 G6 antes de G5; P-13 en el servicio, marca antes de buscar destinatarios (D-11: 3 rojas). Cada una cae en su POS-*.

**FICHERO VIGILADO (10, todas rojas).** F-1 `CREATE TABLE` sin `public.` (roja: guardián «toda tabla del esquema está clasificada»); F-2 `ALTER TABLE garantia_proveedor` sin calificar (4 rojas: el guardián de ALTER y los recuentos); F-3 `ALTER TABLE public.garantia_proveedor` calificada (2 rojas, sólo recuentos: es válida, el guardián correctamente no la rechaza por calificar); F-4 quitar de `PUBLIC_TABLES` (2 rojas: clasificación y «son 42 tablas»); F-5 sin índice único (3 rojas); F-6 `CHECK` coherencia neutralizado (1 roja: D «la base respalda la coherencia sí/no»); F-7 tabla `_bis` añadida (3 rojas); F-8 `;` dentro de un comentario del `CREATE` (17 rojas); F-9 `CHECK` de lista de motivos añadido (10 rojas); F-10 tabla en `desk.` (15 rojas).

**CONDICIÓN (76: 60 rojas, 16 supervivientes).** Rojas (entre paréntesis, nº de pruebas que cayeron): C-SH-1 `puedeGestionarReclamacion` siempre true (11), -2 sujeto ausente puede (1), -3 motivo fuera de lista (2), -4 (6), -5 salto aceptado (4), -6 fabricante de espacios (4), -7 valor negativo (3), -8 «rechazada» con valor (2), -10 (2), -11 constante 60→90 (12), -12 (1), -14 cuarto motivo (2), -15 sólo administrador (24), -17 `>=` (3), -18 (1); C-DB-1 (4), -2 editar resuelta en SQL (1), -4 y -5 enviar y resolver sin `estado = $2` (1 y 1), -6 23505 sin traducir (2), -7 (2), -9 (2), -10 `Number()` (1), -11 (2), -12 (1), -14 (1), -16 un «sí» nace «enviada» (12), -17 origen no manual (2); C-RT-1 G2 libre (5), -2 G12 libre (3), -3 G8 libre (4), -4 y -5 un «no» tratado como ficha (2 y 2), -6 G9 (3), -7 G13 (1), -8 G3 (3), -9 G4 (2), -11 catch 23505 (1), -12 G6 previa y catch a la vez (2), -14 PUT sin `requireAuth` (6), -15 id no numérico pasa (2), -16 (5), -21 G14 (1), -22 G10 (2), -23 G5 (3), -24 (3); C-SV-1 respaldo al área aunque haya cargo (12), -2 (2), -4 (2), -5 (3), -6 (1), -7 (1), -8 (1), -9 sin destinatarios marca igual (1), -10 (1), -12 (6); C-AV-1 destinatarios por `users.cargo` (11), -2 incluye inactivos (2); C-IX-1 y C-IX-2 pasada fuera de la cadena y tras la sincronización (1 y 1).

**Supervivientes REALES (9): suite verde con la mutación puesta.**
| Mutación | Qué hace | Prueba que faltaría | Gravedad |
|---|---|---|---|
| C-RT-17 | `por: user.name` → `por: "anonimo"` (`RT:57`) | R: asertar `body.respondidaPor` igual al nombre de la sesión | WARNING (W-1) |
| C-SV-11 | `for (const dest of destinatarios.slice(0, 1))` (`avisoReclamacionProveedor.ts:39`) | S: dos usuarios en el cargo, dos en el área; un aviso por cada uno | WARNING (W-2) |
| C-RT-18 | texto del 409 de la carrera de avanzar (`RT:103`) | R: carrera simulada (estado cambia entre lectura y escritura) | WARNING (W-3) |
| C-RT-19 | quita el 409 de la carrera de editar (`RT:80`): respondería 200 con cuerpo `null` | ídem | WARNING (W-3) |
| C-RT-20 | quita el 409 de la carrera de avanzar (`RT:101-104`) | ídem | WARNING (W-3) |
| C-SV-3 | quita `AND estado <> 'resuelta'` del `UPDATE` de la marca (`:35`) | S: llamar a `marcarYAvisarReclamacion` con una ficha ya resuelta | SUGGESTION (S-2) |
| C-SH-13 | `validarDatosFicha` acepta RMA no texto (`shared:162`) | H: `rma: 5` es error | SUGGESTION (S-1) |
| C-SH-9 | `textoOpcional` acepta no texto (`shared:114`): referencia y serial | H: `piezaReferencia: 5` es error | SUGGESTION (S-1) |
| C-SH-16 | `numeroOpcional` acepta cadenas numéricas como valor | H: `"800"` es error (o decisión explícita de aceptarlo) | SUGGESTION (S-1) |

**Supervivientes EQUIVALENTES (7).** C-DB-3 y C-DB-13: quitar `reclama = true` de `editarFicha` y de `fichasSinResolverNiAvisar`: el `CHECK` de la tabla fuerza `estado IS NULL` en un «no», y `NULL <> 'resuelta'` no es verdadero, así que no entra nunca. C-DB-8: `pendiente` sin mirar `liberada`: el `continue` de la línea anterior ya descarta la liberada sin respuesta y una liberada con respuesta no es pendiente por `respuesta === null`. C-DB-15: la lectura sin `WHERE ticket_id`: las respuestas se casan por `asociacionId` con las asociaciones del ticket, el resultado es idéntico (sólo cambia el coste). C-RT-10: quitar la consulta previa de G6: el índice único más el `catch` (`RT:59`) dan el mismo 409 y el mismo texto; con la consulta y el `catch` quitados a la vez (C-RT-12) sí hay rojo. C-RT-13: la lectura sin `requireAuth`: `apps/desk/server/routes/tickets.ts:35` ya hace `app.use("/api/tickets", requireAuth(db))` y se registra antes (`app.ts:52` frente a `:61`); ojo, la equivalencia depende de ese orden de registro. C-IX-3: pasada de reclamaciones antes de las alarmas en `index.ts:88`: ninguna spec fija ese orden (sólo «antes de `sync.syncRecent()`», que sí está probado por C-IX-1 y C-IX-2).

## 5. Contraste con las fuentes: qué parte de la fila F1B-13 cubre el cambio

Fuentes leídas: `openspec/config.yaml:2340-2355` (`decision/anexo-7-garantia-proveedor`), maestro R08.4 `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2660-2668` (las líneas coinciden con las que cita `proposal.md`), fila del plan `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93` (talla S).

| Contenido de la decisión y del maestro | Estado | Dónde / por qué |
|---|---|---|
| Ficha propia vinculada a ticket y OVI, no rama del blueprint | CUBIERTO | tabla `public.garantia_proveedor`; `transitions.ts` y `ticketService.ts` sin cambios (`git diff --stat 77fb526 HEAD` vacío) |
| Pregunta «¿Se reclama al fabricante?»: sí abre ficha, no elige uno de tres motivos | CUBIERTO con desvío | se responde sobre cada OVI asociada como acto propio y no «al crear» la OVI (S-1); lo recoge la corrección 29, aún no escrita |
| La ficha registra fabricante, pieza (referencia y serial), ticket y OVI, RMA, estado, valor recuperado | CUBIERTO | columnas de `schema.sql` y `shared:43-64` |
| Valor reclamado «tomado del costo de la OVI» | FUERA (a) | captura manual con origen `manual` (S-4); depende de P-1 (datos de producción) |
| Estados abierta → enviada → resuelta (reposición, nota crédito, rechazada) | CUBIERTO con desvío | tres estados; la consecuencia (2) de la decisión habla de «cuatro estados internos» y su respuesta textual enumera tres |
| Aviso al Director Técnico a los 60 días | CUBIERTO | `avisoReclamacionProveedor.ts`, por `cargo_permiso` con respaldo al área; estricto (el 61 avisa) y días naturales (S-7, P-2 pendiente de Gerencia) |
| Medición del valor recuperado frente al reclamado por marca y piezas con fallas repetidas (ISO 14224) | FUERA (b) | los datos quedan guardados; ni cálculo ni pantalla |
| Envío físico por remisión sin ticket (motivo «envío al fabricante por garantía») | FUERA (c) | depende de F1B-16 (condicionada) |
| Depende de F1B-03 (OVI de garantía y cargo Director Técnico) | CUMPLIDA | reutiliza `puedeCrearOVIGarantia` y `esOVI` de `shared` |
| «Cierra el punto abierto nº 7» | NO CIERRA | `cierra: no` está sostenido por (a), (b) y (c): son tres partes del contenido que la tanda dejó fuera |

## 6. Las 34 casillas de `tasks.md`

34 marcadas `[x]`, 0 pendientes. Comprobé contra el código estas doce (todas se sostienen): 1a.3 (`shared/src/index.ts:37`, 1 inserción y 1 borrado); 1a.4 (PM20-2 editada en sitio, 2 líneas); 1a.5 (41→42, `[10, 29, 3]`); 1a.6 (`schema.sql` +27 al final, calificada, comentarios sin punto y coma: F-8 lo confirma); 1a.10 (mis F-1…F-10 reproducen las cuatro mutaciones del fichero vigilado); 1a.11 (`>` estricto y recorte: C-SH-17, C-SH-6 rojas); 1b.4 (las 13 posiciones existen, R líneas 291-366); 1b.6 (`app.ts` 0 netas); 1b.7 (`ticketService.ts` y `remision.ts` sin diferencias frente a `77fb526`); 2.3 (`destinatariosDeCargoPermiso` al final de `avisos.ts`, filtra `cargo_permiso`); 2.5 (`index.ts:88`); 2.7 y 2.8 (panel y montaje leídos; `TicketDetailView.tsx` 0 netas). Matiz: 1a.9 dice «las nueve funciones» y hay ocho (S-4).

**Bloque de cierre de `tasks.md` (lo hace el orquestador tras este verify).** HECHO: la tabla de la regla 13 (está en `apply-progress.md:170-185` y la rehíce con mis líneas en §2: coincide), el barrido de citas de los artefactos (§7: sin citas rotas) y la lista de mutaciones (la corrí, §4). FALTA: (1) la corrección 29 en `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (no está en el diff); (2) la nota en `DEPLOY.md` (sin variables nuevas, tabla nueva creada por `migrate`, comprobación de lectura, condición P-3 del cargo, OVI previas pendientes): no está en el diff; (3) el `archive-report.md` con la línea de qué parte de F1B-13 cubrió (§5 es la materia); (4) tareas de persona P-1 a P-4 fuera del recuento (archivar no las da por hechas); (5) escribir en `apply-progress.md` la medida del lote 2 (S-6).

## 7. Citas `ruta:línea` (regla de mutación 4)

Barrí todos los artefactos del cambio y los cinco ficheros de código con citas a `app.ts`, `index.ts`, `schema.sql`, `migrate.ts`, `migrate.test.ts`, `cargos.test.ts`, `TicketDetailView.tsx`, `avisos.ts` y `client.ts`, y leí cada línea en `77fb526` y en `HEAD` (`git show`): **ninguna cita rota**. Como las ediciones de esos ficheros son «en sitio» (0 líneas netas), las líneas no se desplazaron: `app.ts:22,61,79`, `index.ts:15,88`, `migrate.ts:20,29-35,73`, `migrate.test.ts:266,282-286,444`, `cargos.test.ts:226-228`, `TicketDetailView.tsx:15,320`, `avisos.ts:8,74,104-113`, `client.ts:660-670` dicen en HEAD lo que la frase afirma (las de contenido cambiado, `app.ts:22,61`, `index.ts:15,88`, `migrate.ts:73`, `migrate.test.ts:282-286`, `cargos.test.ts:226-228`, `TicketDetailView.tsx:15,320`, siguen siendo las líneas de la edición). Citas dentro del código nuevo: `index.ts:88`, `avisoRitmoContrato.ts:25-37`, `contratos.test.ts:12-13`, `db/transaccion.test.ts:25`: todas correctas. El detector del repositorio tampoco bloquea nada del cambio. Dos «citas» que mi barrido emparejó mal con `apps/desk/server/index.ts` (`index.ts:37` en `apply-progress.md:16`) son de `packages/shared/src/index.ts`, y esa línea 37 es la correcta.

## 8. Otros controles

`.only`/`.skip`/`it.todo`: ninguno nuevo (grep sobre los seis ficheros de prueba tocados). `process.env`: 0 líneas añadidas, ningún interruptor nuevo; `DEPLOY.md` y `.env.example` sin cambios (consistente). Tabla sin calificar: ninguna; las consultas de la capa de datos van sin calificar a propósito (molde de `contratos.ts`, `search_path=desk,public`). `ticketService.ts`, `remision.ts`, `ovAsociaciones.ts` y `transitions.ts` sin diferencias frente a `77fb526`. Medidas por lote (`git diff --shortstat --no-renames`, sin `openspec`): 1a 90 + 9; capa de datos 340 (commit aparte); 1b 78 + 15 más los dos ficheros nuevos de ruta; lote 2 61 + 11 más los ficheros nuevos; con `openspec` y nuevos, por commit: 514, 340, 587, 674, todos bajo 720 (la medida de `apply-progress.md` dice 411 y 587 para 1a y 1b; la del lote 2 no está escrita, S-6). Lectura de código, sin estilo: sin errores de lógica; `G4` y `G6` coinciden con el diseño; la carrera de avanzar relee el estado para dar el texto del 409 (desvío 2 declarado).

## 9. Hallazgos

**CRITICAL:** ninguno. No hay comportamiento de servidor sin ninguna prueba: los tres parciales y los supervivientes son detalles de un escenario cuyo comportamiento principal sí está probado.

**WARNING**
- **W-1** `apps/desk/server/routes/garantiaProveedor.ts:57` — `por: user.name` no tiene prueba que lo ejerza (C-RT-17 sobrevive). El escenario de RQ-TC-44 pide guardar «quién respondió». Falta asertar `respondidaPor` en la prueba de la ruta de «sí» (la capa de datos sólo prueba que copia el valor que le dan, `db/garantiaProveedor.test.ts:28`).
- **W-2** `apps/desk/server/services/avisoReclamacionProveedor.ts:39-41` — el aviso va «a cada destinatario» (RQ-AV-19, caída al área), pero todas las pruebas usan un solo usuario del cargo o del área (C-SV-11 sobrevive: avisar sólo al primero queda verde). Falta una prueba con dos destinatarios.
- **W-3** `apps/desk/server/routes/garantiaProveedor.ts:80` y `:101-104` — las ramas de carrera (`editarFicha` o `avanzarFicha` devuelven `null`) no tienen prueba de ruta (C-RT-18, -19 y -20 sobreviven; sin ellas la ruta contestaría 200 con cuerpo `null`). La condición en SQL sí está probada en la capa de datos. Falta simular el cambio de estado entre la lectura y la escritura.

**SUGGESTION**
- **S-1** `packages/shared/src/garantiaProveedor.ts:114,122,162` — validaciones que ninguna prueba ejerce: RMA o pieza que no son texto, y valor como cadena numérica (C-SH-13, -9 y -16). No son requisito de la spec; o se prueban o se quitan del código.
- **S-2** `avisoReclamacionProveedor.ts:35` — el `AND estado <> 'resuelta'` del `UPDATE` de la marca es sólo guarda de carrera y ninguna prueba lo ejerce (C-SV-3).
- **S-3** `apps/desk/server/db/garantiaProveedor.test.ts:51` — el título dice «queda null y sin origen» pero el código guarda `origen_valor_reclamado = 'manual'` con valor `null` (`db/garantiaProveedor.ts:99`) y la prueba no lo asserta. Cambiar el título o decidir si un valor vacío debe llevar origen.
- **S-4** `tasks.md` 1a.9 dice «las nueve funciones»: la capa de datos exporta ocho funciones más la clase de error.
- **S-5** Hipótesis, sin medir contra la zona de negocio: `PanelGarantiaProveedor.tsx:25` recorta el ISO UTC con `slice(0, 10)` para «Abierta el…», mientras el aviso usa `diaEnZona(respondidaAt)` (`avisoReclamacionProveedor.ts:56`); una respuesta dada de noche podría verse con un día de diferencia entre el panel y el aviso. Sólo presentación.
- **S-6** `apply-progress.md:191` no recoge la medida del lote 2 («ver el informe de entrega»); la mía es 674 con `openspec`, bajo 720. El orden de la pasada respecto a las alarmas (`index.ts:88`) lo cuenta un comentario (`avisoReclamacionProveedor.ts:69`) pero no una prueba (C-IX-3, no exigido por la spec).
- **S-7** Las pruebas de 403/422 de responder no asertan que no se escribió nada (RQ-TC-44 «no se escribe nada»); hoy lo protege el orden de las guardas, que sí está probado.

## 10. Fuera de este informe

Tareas de persona, que archivar no da por hechas: P-1 (¿traen costo las líneas de una OVI?), P-2 (confirmar los 60 días naturales), P-3 (asignar el cargo Director Técnico antes de publicar: sin él sólo el administrador responde y el aviso cae al área), P-4 (pegar la corrección 29 en el maestro). La integración con BD real (`*.integration.test.ts`, 2 ficheros saltados) no se ejecutó: no hay `psql` ni `DATABASE_URL` locales; `numeric` como texto (H-2) sólo lo cubre el falso `Queryable` de `db/garantiaProveedor.test.ts:77`.
