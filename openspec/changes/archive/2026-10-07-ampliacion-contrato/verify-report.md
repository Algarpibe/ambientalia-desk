# Verify — ampliacion-contrato (F1B-11, `cierra: si`)

Verificador independiente, 2026-10-07. Rama `ampliacion-contrato`, cabeza `dd248aa` (nació de `351c046`), worktree aislado. Strict TDD activo; preflight auto · hybrid · 800 líneas. No se llamó a `gentle-ai sdd-attempt` ni se commiteó. Al terminar, `git status --short` está limpio salvo este informe.

## Veredicto: PASS WITH WARNINGS

**0 CRITICAL · 3 WARNING · 6 SUGGESTION.** Los cuatro códigos de salida y el build dan 0. De **97 mutaciones propias**: **84 rojas, 6 supervivientes equivalentes y 7 supervivientes con prueba que falta** (ninguna de estas siete esconde un defecto vivo: el código es correcto hoy; lo que falta es la prueba que lo fije).

## 1 · Ejecución (cada código lo corrí y lo miré)

| Comando | Salida | Resultado |
|---|---|---|
| `npm test` | **0** | 254 ficheros pasan y 2 saltados (256); **4.060 pruebas pasan, 7 saltadas (4.067)**; 178 s |
| `npm run typecheck` | **0** | `tsc -b` y `tsc -p apps/desk/tsconfig.server.json --noEmit` sin errores |
| `npm run lint` | **0** | **165 problemas: 0 errores, 165 avisos** (los esperados) |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 6.563 comprobadas; 0 bloqueantes; línea base 0 informadas, 0 caducadas; 0 cabeceras R-1 inválidas; **13 abreviadas rotas informativas** (no bloquean) |
| `npm run build` | **0** | cliente compilado (criterio 12 lo pide) |
| Las seis pruebas afectadas, a mano | 0 | 6 ficheros, 318 pruebas verdes antes de mutar |

Ficheros vedados (punto 5): `git diff 351c046 dd248aa --stat` no toca `apps/desk/server/services/ticketService.ts`, `apps/desk/server/routes/remision.ts`, `docs/sdd/ENTRADA.md`, `openspec/config.yaml` ni el plan R01.4, y tampoco `apps/desk/server/remisiones.test.ts` ni `apps/desk/server/ordenVentaUnTicket.test.ts` (RQ-TC-55: sus aserciones no cambian). En `packages/zoho-sync/src/db/schema.sql`: CREATE calificado `public.` en `packages/zoho-sync/src/db/schema.sql:773`, índice en `packages/zoho-sync/src/db/schema.sql:782`, ninguna ALTER nueva, sentencias sólo al final; la única edición en medio es un comentario de una línea (el hunk `@@ -559 +559`), que no desplaza nada.

## 2 · Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W-1 · El motivo largo no se prueba hasta la base.** El escenario «El motivo se guarda recortado, sin límite de longitud» (RQ-TC-54) sólo se prueba en la función pura (`packages/shared/src/contratos.test.ts:344`, 5.000 caracteres, `S15` roja). Dos mutaciones sobreviven: **D18** (`apps/desk/server/db/contratos.ts:139`, truncar el motivo a 200 al insertar) y **Q17** (`packages/zoho-sync/src/db/schema.sql:778`, `motivo varchar(100)`). Verifiqué que **pg-mem sí impone la longitud de `varchar`** (el `INSERT` de 10 caracteres en `varchar(5)` falla), así que una sola prueba lo cierra. **Prueba que falta:** `POST /api/contratos/:id/ampliar` con motivo `  Prórroga  ` + texto de varios miles de caracteres, y comprobar que `contrato_ampliaciones.motivo` es el texto recortado completo (en `apps/desk/server/routes/contratosAmpliar.test.ts`, junto a `apps/desk/server/routes/contratosAmpliar.test.ts:89`).
- **W-2 · «Sólo se leen `fechaFin` y `motivo`» está probado a medias.** `apps/desk/server/routes/contratosAmpliar.test.ts:89` manda `ampliadoPor`, `ampliado_por` y `ampliadoAt` extra, pero no un `hoy` ni un `contratoId`. Sobreviven **R21** (`apps/desk/server/routes/contratos.ts:80`, `req.body?.hoy ?? hoy()`: el cuerpo dictaría el plazo) y **R23** (`apps/desk/server/routes/contratos.ts:83`, `contratoId` del cuerpo: escribiría en otro contrato). El código de hoy es correcto; falta la prueba. **Prueba que falta:** `POST` con `{ ...OK, hoy: '2000-01-01', contratoId: <otro> }` sobre un contrato con plazo cerrado y otro abierto; esperar que se ignoren.
- **W-3 · Citas de caso B sin revisión.** Siete líneas de paquetes fechados citan `ContratoFicha.tsx` en líneas que **se movieron** (+65 líneas por dentro): `docs/sdd/Paquete_de_Despliegue_2026-09-29.md:455`, `docs/sdd/Paquete_de_Despliegue_2026-09-29.md:487`, `docs/sdd/Paquete_de_Despliegue_2026-09-29.md:722`, `docs/sdd/Paquete_de_Despliegue_2026-09-30.md:633`, `docs/sdd/Paquete_de_Despliegue_2026-09-30.md:1121`, `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:854` y `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1544` (las siete juntas citan las líneas 5, 10, 41, 47, 58 y 66 de la ficha; `apply-progress.md` contó seis). Hoy la línea 5 es un `import`, la 10 es el cabecero del comentario y la 41 es la función `dato`: ya no dicen lo que la frase afirma. El detector no las marca (la línea existe y no está vacía; las abreviadas no bloquean). No se tocan (me lo pidieron); la regla de mutación 4 pide para el caso B **nombrar la revisión** en la cita, y `apply-progress.md` las declara «no se editan». Además, `openspec/config.yaml:4073` cita `apps/desk/server/db/contratos.ts:8` con «hoy un contrato no se puede modificar», y esa línea ahora dice lo contrario: es el caso C que `tasks.md` asigna al archivo (el fichero está vedado en esta rama).

### SUGGESTION
- **SG-1 · `ampliacionDelCuerpo` devuelve la fecha sin normalizar si se muta (S19).** `packages/shared/src/contratos.ts:289` usa `fechaCalendario(cuerpo.fechaFin)!`; con `cuerpo.fechaFin as string` nada se pone rojo. Prueba que falta: una fecha con espacios (`' 2026-09-30 '`) debe devolver `fechaFin: '2026-09-30'`. Efecto real hoy: ninguno visible (PostgreSQL tolera el espacio), por eso es sugerencia.
- **SG-2 · El lector no prueba el motivo nulo (D13).** `apps/desk/server/db/contratos.ts:154` mapea `null` a `null`; con `String(f.motivo ?? '')` pasa todo. `apps/desk/server/db/contratos.test.ts:209` comprueba el nulo guardado en la base, no el que sirve `ampliacionesDelContrato`. La ficha pinta `a.motivo ?? '—'`, así que un `''` cambiaría lo que se ve. Hoy la ruta no deja crear un motivo nulo.
- **SG-3 · El tipo de las columnas de fecha no se fija (Q18).** `fecha_anterior text NOT NULL` (`packages/zoho-sync/src/db/schema.sql:776`) sobrevive. Prueba que falta: insertar `'no-es-fecha'` en `fecha_anterior` y ver el rechazo, en el mismo bloque que `packages/zoho-sync/src/db/migrate.test.ts:844`.
- **SG-4 · «Ningún flujo borra una ampliación» no tiene prueba automática.** Lo comprobé a mano: `git grep` de `DELETE` sobre `contrato_ampliaciones` en `apps` y `packages` no da ninguna sentencia, sólo comentarios (`apps/desk/server/db/contratos.ts:8` y `apps/desk/server/db/contratos.ts:119`). Q12 (añadir un `DELETE` al esquema) sí se pone roja, pero por el recuento de sentencias, no por una prueba de «no hay DELETE».
- **SG-5 · Tabla de la regla 13.** Las seis filas dicen lo que afirman (punto 4, abajo). La fila 1 junta tres condiciones en `apps/desk/src/components/ContratoFicha.tsx:27` (sesión, permiso, `cabeAmpliacion`); separarlas haría la tabla más fácil de revisar. Sin decisiones del cliente sin listar.
- **SG-6 · Afirmaciones del §13 del paquete sin ruta:línea.** «Quien amplía es el de la sesión, nunca el del cuerpo» y «No hay `DELETE` ni `UPDATE` sobre la tabla» no llevan cita; la primera es `apps/desk/server/routes/contratos.ts:83`. Además, la cita a `apps/desk/src/components/ContratoFicha.tsx:118` para «enseña el error del servidor tal cual» apunta a la declaración de `AmpliarContrato`, no a `apps/desk/src/components/ContratoFicha.tsx:130` (el `setError`).

## 3 · Tabla 1 — cobertura de la spec (RQ-TC-53, 54 y 55)

Líneas leídas de los ficheros de prueba de la rama. «Parcial» = el escenario se prueba por trozos o sólo en un nivel.

| Escenario | Prueba (fichero:línea del it) |
|---|---|
| 53 · Vencimiento 31/12 no admite ampliación | packages/shared/src/contratos.test.ts:282 |
| 53 · Vencimiento 01/01 tiene tope el 31/12 | packages/shared/src/contratos.test.ts:286 y packages/shared/src/contratos.test.ts:361 (zona del proceso) |
| 53 · 01/01 del año siguiente se rechaza | packages/shared/src/contratos.test.ts:269 |
| 53 · Instante UTC 01/01 que en zona de negocio es 31/12 | packages/shared/src/contratos.test.ts:290; ruta con reloj real: apps/desk/server/routes/contratosAmpliar.test.ts:174; puertas: apps/desk/server/ampliacionContratoPuertas.test.ts:130 |
| 53 · Sólo alarga | packages/shared/src/contratos.test.ts:265 |
| 53 · Varias veces, el tope no se mueve | **Parcial:** encadenadas en la base apps/desk/server/db/contratos.test.ts:189 y la ficha tras dos ampliaciones apps/desk/server/routes/contratosAmpliar.test.ts:191; no hay una prueba que pida la 2.ª a 31/12 y la 3.ª a 01/01 del año siguiente sobre el mismo contrato ya ampliado (cada mitad sí está: packages/shared/src/contratos.test.ts:269) |
| 53 · Plazo vencido no se amplía | packages/shared/src/contratos.test.ts:274; ruta: apps/desk/server/routes/contratosAmpliar.test.ts:163 |
| 53 · Fecha que no es un día real | packages/shared/src/contratos.test.ts:262 (cuatro variantes) |
| 53 · Orden de los motivos fijado | packages/shared/src/contratos.test.ts:302, packages/shared/src/contratos.test.ts:303 y packages/shared/src/contratos.test.ts:304 (pares con las dos activas); packages/shared/src/contratos.test.ts:307 (motivo vacío). El par «no posterior ↔ pasa del tope» **no es activable** y el código lo declara (S8 equivalente) |
| 53 · No iniciado o vencido también se amplía | packages/shared/src/contratos.test.ts:278 |
| 54 · Comercial amplía y queda la traza | apps/desk/server/routes/contratosAmpliar.test.ts:51; apps/desk/server/db/contratos.test.ts:176 |
| 54 · Administrador sin Comercial | apps/desk/server/routes/contratosAmpliar.test.ts:63 (el administrador recibe todas las áreas en `apps/desk/server/auth/users.ts:27`; por eso R5 es equivalente) |
| 54 · 403 sin escribir nada | apps/desk/server/routes/contratosAmpliar.test.ts:70 (matriz con 401, 403 y 200) y apps/desk/server/routes/contratosAmpliar.test.ts:82 |
| 54 · El 404 gana al 403 | apps/desk/server/routes/contratosAmpliar.test.ts:98, apps/desk/server/routes/contratosAmpliar.test.ts:104 y apps/desk/server/routes/contratosAmpliar.test.ts:108 (id no numérico) |
| 54 · El 403 gana al 422 | apps/desk/server/routes/contratosAmpliar.test.ts:116 (y el 422 del Comercial con el mismo cuerpo: apps/desk/server/routes/contratosAmpliar.test.ts:132, apps/desk/server/routes/contratosAmpliar.test.ts:143) |
| 54 · El 422 gana al 409 | apps/desk/server/routes/contratosAmpliar.test.ts:132; con cuerpo válido, 409: apps/desk/server/routes/contratosAmpliar.test.ts:150 |
| 54 · Dos simultáneas, la segunda 409 | apps/desk/server/routes/contratosAmpliar.test.ts:150 y apps/desk/server/db/contratos.test.ts:199 |
| 54 · Motivo vacío o de espacios, 422 | packages/shared/src/contratos.test.ts:339 (cinco variantes) y la ruta apps/desk/server/routes/contratosAmpliar.test.ts:132 |
| 54 · Motivo recortado, sin límite | **Parcial (W-1):** sólo la función pura, packages/shared/src/contratos.test.ts:344; **SIN PRUEBA** hasta la base |
| 54 · Quién amplía es la sesión | apps/desk/server/routes/contratosAmpliar.test.ts:89 (**parcial, W-2:** sin `hoy` ni `contratoId` extra) |
| 54 · Lo que falla no deja a medias | apps/desk/server/db/contratos.test.ts:199, apps/desk/server/db/contratos.test.ts:227 y apps/desk/server/db/contratos.test.ts:236 (estructura BEGIN/UPDATE/INSERT/COMMIT y ROLLBACK). **Parcial y declarado:** sin pool no hay transacción real (límite en el §13.2 del paquete); no hay prueba con el `INSERT` fallando |
| 54 · La ficha enseña la traza y la original | apps/desk/server/routes/contratosAmpliar.test.ts:191 |
| 54 · Sin ampliaciones, original = fin, y 401 sin sesión | apps/desk/server/routes/contratosAmpliar.test.ts:183 y apps/desk/server/routes/contratosAmpliar.test.ts:205 |
| 54 · Ningún flujo borra una ampliación | **SIN PRUEBA automática (SG-4);** comprobado a mano con `git grep` |
| 55 · Deja pasar la subOV en el alta | apps/desk/server/ampliacionContratoPuertas.test.ts:114 (describe.each, puerta alta de ticket) |
| 55 · Deja pasar en la transición | apps/desk/server/ampliacionContratoPuertas.test.ts:114 (puerta transición habilitar_servicio) |
| 55 · Deja pasar en la remisión | apps/desk/server/ampliacionContratoPuertas.test.ts:114 (puerta remisión de entrada) |
| 55 · Pasada la fecha nueva, vuelven a bloquear | apps/desk/server/ampliacionContratoPuertas.test.ts:139 (las tres; el mensaje nombra la fecha nueva) |
| 55 · El día de la fecha nueva aún no bloquea | apps/desk/server/ampliacionContratoPuertas.test.ts:122 y apps/desk/server/ampliacionContratoPuertas.test.ts:130 |
| 55 · Las pruebas existentes no cambian | `remisiones.test.ts` y `ordenVentaUnTicket.test.ts` no están en el diff; la suite entera pasa |
| 21 (modificado) · sólo una frase | sin escenario nuevo; `apps/desk/server/routes/contratos.test.ts` pasa sin cambios |

## 4 · Tabla 2 — los 13 criterios de aceptación

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | `topeAmpliacion`, cuatro bordes, sin UTC | **Cumple** | packages/shared/src/contratos.test.ts:246 y packages/shared/src/contratos.test.ts:360; S1, S2, S3, S3b rojas |
| 2 | `motivoNoAmpliable`, cuatro casos y orden | **Cumple** | packages/shared/src/contratos.test.ts:257 y packages/shared/src/contratos.test.ts:299; S4-S7, S9, S13 rojas |
| 3 | Tabla creada, calificada, al final, en `PUBLIC_TABLES` | **Cumple** | packages/zoho-sync/src/db/migrate.test.ts:831, packages/zoho-sync/src/db/migrate.test.ts:837, packages/zoho-sync/src/db/migrate.test.ts:844, packages/zoho-sync/src/db/migrate.test.ts:855; Q1-Q16 y Mg1 rojas |
| 4 | Fecha vigente y fila de traza | **Cumple** | apps/desk/server/db/contratos.test.ts:176; D1-D8 rojas |
| 5 | 404, 403, 422, 409 con prueba por par | **Cumple** | R1, R2, R3 rojas; pares apps/desk/server/routes/contratosAmpliar.test.ts:98, apps/desk/server/routes/contratosAmpliar.test.ts:116, apps/desk/server/routes/contratosAmpliar.test.ts:123 y apps/desk/server/routes/contratosAmpliar.test.ts:132 |
| 6 | Dos ampliaciones encadenadas; original estable | **Cumple** | apps/desk/server/db/contratos.test.ts:189; apps/desk/server/routes/contratosAmpliar.test.ts:191 (ver «parcial» de la tabla 1) |
| 7 | Las tres puertas, sin editar `ticketService.ts` ni reordenar `remision.ts` | **Cumple** | apps/desk/server/ampliacionContratoPuertas.test.ts:114 y apps/desk/server/ampliacionContratoPuertas.test.ts:139; diff vacío sobre ambos ficheros; D8, S21, S22 y R26 rojas |
| 8 | `GET` sirve `ampliaciones` y `fechaFinOriginal`; el resto igual | **Cumple** | apps/desk/server/routes/contratosAmpliar.test.ts:183 y apps/desk/server/routes/contratosAmpliar.test.ts:191; R10-R13 y R24 rojas |
| 9 | apps/desk/server/remisiones.test.ts:988 y las existentes en verde sin cambios | **Cumple** | los dos ficheros fuera del diff; suite verde |
| 10 | Detector con cero bloqueantes y barrido hecho | **Cumple, con W-3** | detector exit 0, 0 bloqueantes; barrido documentado en `apply-progress.md` pero con citas de caso B sin revisión |
| 11 | `tasks.md` cierra la tabla de la regla 13 | **Cumple** | seis filas con línea real, verificadas (sección 6) |
| 12 | `npm test`, typecheck, lint, build con salida 0 | **Cumple** | cuatro 0 y build 0 (sección 1) |
| 13 | El informe de archivo declara F1B-11 cerrada | **No evaluable hoy** | es del `archive-report.md`, que aún no existe; no es incumplimiento del verify |

## 5 · Tabla 3 — mutaciones propias (97): 84 rojas, 6 equivalentes, 7 con prueba que falta

Método: edité el fichero de producción, corrí `npx vitest run` sobre los seis ficheros afectados (318 pruebas verdes de base) y restauré con `git checkout` tras CADA una; el árbol quedó limpio. Columnas: id · línea mutada · qué cambié · pruebas rojas (de 318). `R` = `apps/desk/server/routes/contratos.ts`, `S` = `packages/shared/src/contratos.ts`, `D` = `apps/desk/server/db/contratos.ts`, `Q` = `packages/zoho-sync/src/db/schema.sql`. M1-M20 del diseño van marcadas.

**(a) Posición de las guardas de `R` (74-90)**

| id | línea | mutación | rojas |
|---|---|---|---|
| R1 (M1) | R:77-79 | 404 después del 403 (par A↔B intercambiado) | 2 |
| T0 | R:78 | 404 anulado (`if (false)`) | 3 |
| R2 (M2) | R:79-81 | 422 antes del 403 (par B↔C) | 1 |
| R3 (M3) | R:81-83 | escribir antes de validar, con el 422 después (par C↔D) | 3 |
| R20 | R:76 | sin la regex del id numérico | 1 |
| R5b | R:79 | 403 anulado | 5 |
| R19 | R:79 | 403 devuelve 401 | 4 |
| R17 | R:87 | 409 anulado (sin `catch` del error de carrera) | 1 |
| R18 | R:87 | el 409 sale como 422 | 1 |
| R15 | R:74 | sin `requireAuth` en el POST | 28 |

**(b) Fichero vigilado `Q` ensuciado**

| id | línea | mutación | rojas |
|---|---|---|---|
| Q1 | Q:773 | `CREATE` sin `public.` | 2 |
| Q10 | Q:782 | índice sin `public.` | 1 |
| Q2 | Q:776 | `fecha_anterior` sin `NOT NULL` | 1 |
| Q3 | Q:779 | `ampliado_por` sin `NOT NULL` | 1 |
| Q4 | Q:775 | `contrato_id` sin `NOT NULL` | 1 |
| Q5 | Q:777 | `fecha_nueva` sin `NOT NULL` | 1 |
| Q14 | Q:778 | `motivo` con `NOT NULL` | 2 |
| Q15 | Q:780 | `ampliado_at` sin `NOT NULL DEFAULT now()` | 2 |
| Q11 | Q:775 | clave foránea a `public.contratos` | 1 |
| Q6 (M6) | Q:766 | siembra de accesorios movida DESPUÉS del bloque nuevo | 2 |
| Q6b | Q:766 | `CREATE` nuevo movido ANTES de la siembra | 2 |
| Q7 | Q:783 | `ALTER TABLE public.contrato_ampliaciones` añadida al final | 4 |
| Q8 | Q:783 | `CREATE TABLE` sin calificar al final | 5 |
| Q9 | Q:783 | `ALTER TABLE` sin calificar al final | 6 |
| Q12 | Q:783 | `DELETE FROM public.contrato_ampliaciones` al final | 3 |
| Q13 | Q:556 | tabla extra insertada en MEDIO del esquema | 5 |
| Q16 | Q:782 | índice retirado | 1 |
| Mg1 (M8) | packages/zoho-sync/src/db/migrate.ts:73 | `contrato_ampliaciones` fuera de `PUBLIC_TABLES` | 3 |
| **Q17** | Q:778 | `motivo varchar(100)` | **0 · PRUEBA QUE FALTA (W-1)** |
| **Q18** | Q:776 | `fecha_anterior text` en vez de `date` | **0 · PRUEBA QUE FALTA (SG-3)** |

**(c) Bordes de la regla en `S` (243-298)**

| id | línea | mutación | rojas |
|---|---|---|---|
| S1 (M9) | S:260 | tope `-12-30` | 14 |
| S2 (M9) | S:260 | tope = 01/01 del año siguiente | 13 |
| S3 (M10) | S:260 | año con `new Date(fechaFin).getFullYear()` | 1 (la de zona del proceso) |
| S3b (M10) | S:260 | año de `hoy` en vez del del vencimiento | 9 |
| S4 (M11) | S:267 | `<=` por `<` en «posterior a la vigente» | 5 |
| S5 (M12) | S:269 | `>` por `>=` en «pasa del tope» | 8 |
| S6 (M13) | S:270 | `>` por `>=` en «plazo cerrado» | 4 |
| S6b | S:270 | `>` por `<` en «plazo cerrado» | 33 |
| S7 (M4) | S:266 | `plazoCerrado` el primero | 3 |
| S9 | S:269 | `plazoCerrado` antes de `pasaDelTope` | 1 |
| S13 (M4) | S:285 | motivo vacío evaluado antes que la fecha | 7 |
| S11a | S:277 | `cabeAmpliacion`: `fechaFin <= tope` | 1 |
| S11b | S:277 | `cabeAmpliacion`: `hoy < tope` | 2 |
| S12 (M19) | S:277 | `cabeAmpliacion` siempre `true` | 1 |
| S24 | S:268 | tope calculado con el año de la fecha pedida | 6 |
| S25 | S:276 | tope de `cabeAmpliacion` con el año de `hoy` | 1 |
| S14 | S:287 | motivo sin `.trim()` | 4 |
| S14b | S:288 | motivo vacío no se rechaza | 6 |
| S15 | S:287 | motivo truncado a 500 | 1 |
| S26 | S:287 | motivo pasado a minúsculas | 1 |
| S16 (M17) | S:297 | `fechaFinOriginal` desde la última fila | 3 |
| S16b | S:297 | sin la vigente como respaldo | 2 |
| S20 | S:284 | cuerpo que no es objeto sin protección | 2 |
| S21 | S:43 | `estadoContrato`: vencido con `<=` (el día de fin cuenta) | 14 |
| S22 | S:57 | mensaje de vencido con la fecha de inicio, no la de fin | 7 |
| **S8** | S:267-269 | `noPosterior` y `pasaDelTope` permutadas | **0 · EQUIVALENTE:** una fecha no puede ser a la vez `<=` la vigente y `>` el tope (la vigente es `<=` tope, mismo año); el código lo declara |
| **S10** | S:266-267 | `fecha` y `noPosterior` permutadas (con guarda de nulo) | **0 · EQUIVALENTE:** con `nueva === null` la comparación no puede disparar; el resultado es el mismo en los dos órdenes |
| **S19** | S:289 | `fechaFin` devuelta cruda en vez de normalizada | **0 · PRUEBA QUE FALTA (SG-1)** |

**(d) Capa de datos `D` (116-158)**

| id | línea | mutación | rojas |
|---|---|---|---|
| D1 (M15) | D:133 | sin la condición de fecha en el `UPDATE` | 2 |
| D2 (M16) | D:138 | sin el `INSERT` de la traza | 9 |
| D3 (M16) | D:132 | `INSERT` antes del `UPDATE` | 4 |
| D12 | D:131 | sin `enTransaccion` | 2 |
| D11 | D:136 | sin el `throw` de carrera | 3 |
| D7 | D:133 | `SET fecha_fin` con la fecha anterior | 17 |
| D8 | D:133 | `SET fecha_fin = fecha_fin` (las puertas no se enteran) | 17 |
| D20 | D:133 | `WHERE id >= ...` (afecta a varios contratos) | 1 |
| D16 | D:141 | devuelve el contrato con la fecha vieja | 2 |
| D4 (M17) | D:148 | `ORDER BY id DESC` | 3 |
| D10 | D:148 | lector sin filtrar por contrato (`>=`) | 1 |
| D5 | D:139 | cruza `fecha_anterior` y `fecha_nueva` | 4 |
| D6 | D:139 | cruza `motivo` y `ampliado_por` | 8 |
| D22 | D:139 | `contrato_id` de la traza fijo | 1 |
| D9 | D:152 | el lector cruza las dos fechas | 3 |
| D21 | D:153 | fecha nueva sin `comoDiaCivil` | 3 |
| D23 | D:155 | `ampliadoPor` recortado a 3 caracteres | 2 |
| D14 | D:156 | `ampliadoAt` siempre `String(...)` | 1 |
| **D4b** | D:148 | `ORDER BY ampliado_at` | **0 · EQUIVALENTE:** `now()` es la hora de inicio de la transacción; el `UPDATE` condicionado serializa las ampliaciones sobre una misma fecha (la segunda ve la fecha cambiada y responde 409 sin insertar), así que el orden por hora es el del `id` |
| **D4c** | D:148 | sin `ORDER BY` | **0 · EQUIVALENTE en la práctica:** tabla sólo de inserciones; pg-mem y PostgreSQL devuelven el orden de inserción. No hay prueba posible bajo pg-mem |
| **D13** | D:154 | motivo nulo servido como cadena vacía | **0 · PRUEBA QUE FALTA (SG-2)** |
| **D18** | D:139 | motivo truncado a 200 al insertar | **0 · PRUEBA QUE FALTA (W-1)** |

**(e) La ficha (R:33) y (f) las tres puertas**

| id | línea | mutación | rojas |
|---|---|---|---|
| R10 | R:33 | `fechaFinOriginal` calculada sobre las filas invertidas (última fila) | 1 |
| R11 | R:33 | `fechaFinOriginal` = fecha vigente siempre | 1 |
| R12 | R:33 | sin `ampliaciones` en la lectura (M20) | 2 |
| R13 | R:33 | sin `fechaFinOriginal` en la lectura (M20) | 2 |
| R24 | R:33 | `ampliaciones` cortada a una fila | 1 |
| R7 | R:85 | la respuesta devuelve la vigente como original | 1 |
| R16 | R:84 | la respuesta sin la traza nueva | 2 |
| R27 | R:85 | la respuesta devuelve el contrato viejo | 1 |
| R26 | R:85 | el POST responde 201 en vez de 200 | 19 (incluye las tres puertas: usan la ruta real) |
| R4 (M18) | R:83 | `ampliadoPor` tomado del cuerpo | 1 |
| R25 | R:83 | motivo crudo del cuerpo (sin recortar) | 1 |
| R8 (M14) | R:22 | `hoy` por defecto en UTC | 1 |
| R9 | R:80 | ignora el `hoy` inyectado | 1 |
| **R5** | R:79 | `isAdmin` sustituido por `false` en el 403 | **0 · EQUIVALENTE:** el administrador recibe todas las áreas (`apps/desk/server/auth/users.ts:27`), así que `canExecuteTransition` lo deja pasar por Comercial igual |
| **R22** | R:83 | `fechaNueva` con respaldo en el cuerpo | **0 · EQUIVALENTE:** con `cuerpo.ok` la fecha siempre está definida; la rama de respaldo nunca corre |
| **R21** | R:80 | `hoy` tomado del cuerpo si viene | **0 · PRUEBA QUE FALTA (W-2)** |
| **R23** | R:83 | `contratoId` tomado del cuerpo si viene | **0 · PRUEBA QUE FALTA (W-2)** |

**(f) Que el efecto de las puertas dependa de verdad de la ruta.** D8 (la ruta deja la fecha sin cambiar) pone rojas 17, y R26 (la ruta responde distinto) pone rojas 19, entre ellas las de las tres puertas, que amplían con la ruta real; S21 y S22 (la fecha que lee el bloqueo y el mensaje que la nombra) también. Las puertas no se mutaron en su propio código (ficheros vedados): el efecto sólo existe si la ruta escribe la fecha vigente.

## 6 · Regla 13 — la tabla de `tasks.md` contra el código real

Leí cada línea citada en el árbol de `dd248aa`. **Las seis filas dicen lo que afirman.**

| Fila | Cita y lo que dice la línea |
|---|---|
| 1 | apps/desk/src/components/ContratoFicha.tsx:27 es `puedeAmpliar` con `canExecuteTransition`; el servidor: apps/desk/server/routes/contratos.ts:79 (403) y apps/desk/server/routes/contratos.ts:78 (404, va antes) |
| 2 | apps/desk/src/components/ContratoFicha.tsx:141 es el `input type=date` con `max={topeAmpliacion(...)}`; el servidor: packages/shared/src/contratos.ts:269 (pasaDelTope), dentro de packages/shared/src/contratos.ts:264, llamada desde packages/shared/src/contratos.ts:285 y devuelta por apps/desk/server/routes/contratos.ts:81 |
| 3 | apps/desk/src/components/ContratoFicha.tsx:27 usa `cabeAmpliacion`; packages/shared/src/contratos.ts:270 (plazoCerrado), packages/shared/src/contratos.ts:269, y el espejo packages/shared/src/contratos.ts:275; la cita de la propiedad apunta al `describe` packages/shared/src/contratos.test.ts:315 (la propiedad en sí es el `it` de la línea 324 de ese fichero) |
| 4 | apps/desk/src/components/ContratoFicha.tsx:143 es la etiqueta «Motivo» sin `required`; servidor: packages/shared/src/contratos.ts:288 dentro de packages/shared/src/contratos.ts:283 |
| 5 | apps/desk/src/components/ContratoFicha.tsx:131 recarga con `HTTP 409`; servidor: apps/desk/server/db/contratos.ts:133, apps/desk/server/db/contratos.ts:136 y apps/desk/server/routes/contratos.ts:87 |
| 6 | apps/desk/src/components/ContratoFicha.tsx:61 y apps/desk/src/components/ContratoFicha.tsx:71 sólo pintan; llegan de apps/desk/server/routes/contratos.ts:33 con packages/shared/src/contratos.ts:296 |

**Decisiones del cliente que la tabla NO lista** (busqué en `apps/desk/src/components/ContratoFicha.tsx` y `apps/desk/src/api/client.ts`): ninguna que decida dominio. Sólo hay estado de interfaz (abrir o cerrar el formulario, `enviando`, deshabilitar botones) y la clasificación del error por el prefijo `HTTP 409` que pone `json()` en apps/desk/src/api/client.ts:9, que ya es la fila 5. `ampliarContrato` de apps/desk/src/api/client.ts:881 sólo manda `fechaFin` y `motivo` sin validar ni recortar. El cliente usa el reloj del navegador en `hoyEnZona()` (fila 3, comodidad: el servidor decide con el suyo, R8 y R9 rojas). Ver SG-5.

## 7 · Regla de mutación 4 — barrido de citas

Ediciones por fichero (`git diff -U0 351c046 dd248aa`): **sólo `apps/desk/src/components/ContratoFicha.tsx` tiene inserciones en medio** (de 88 a 153 líneas). Las demás crecen al final (`DEPLOY.md` de 560 a 593, `docs/sdd/F0-01_Correcciones_para_el_maestro.md` de 1.560 a 1.601, `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` de 357 a 441, `packages/shared/src/contratos.ts` de 242 a 298, `apps/desk/src/api/client.ts` de 878 a 885, `packages/zoho-sync/src/db/schema.sql` de 768 a 782) o cambian líneas en sitio sin variar el recuento (`apps/desk/server/db/contratos.ts` líneas 2 y 8, `apps/desk/server/routes/contratos.ts` líneas 5, 9, 21, 22 y 33, `packages/zoho-sync/src/db/migrate.ts` línea 73, `apps/desk/src/components/ContratosPanel.tsx` línea 17, y siete líneas de `packages/zoho-sync/src/db/migrate.test.ts` cuyas cifras cambian por diseño). Confirmado.

- **Casos B/C que dejé sin tocar:** las siete líneas de paquetes fechados de W-3 (la ficha, líneas 5, 10, 41, 47, 58 y 66: caso B) y `openspec/config.yaml:4073` (caso C, lo cierra el archivo).
- **Citas a líneas editadas en sitio:** las que dependen de ellas (`apps/desk/server/db/contratos.ts` líneas 68-69, 79, 106-115, 26-41, 50-52, 30 y 36) no las movió ninguna inserción y siguen diciendo lo mismo; las de `apps/desk/server/routes/contratos.ts:33` en los paquetes fechados hablan de `hoyEnZona`, que sigue en esa línea. Las de `migrate.test.ts` a los bloques con cifras tocadas (282-286, 652, 785, 794-798) siguen señalando la prueba que dicen.
- **Muestra de citas NUEVAS (36 únicas en `DEPLOY.md`, el §13 del paquete y la corrección 32), cada una leída en el árbol de `dd248aa`:** dicen lo que la frase afirma. `DEPLOY.md` cita apps/desk/server/db/contratos.ts:138 (el `INSERT`), apps/desk/server/routes/contratos.ts:33 (la lectura de la traza) y packages/zoho-sync/src/db/schema.sql:773 (el `CREATE`). El paquete cita apps/desk/server/db/contratos.ts:133, apps/desk/server/db/transaccion.ts:15 (sin `connect` no hay transacción), apps/desk/server/services/avisoRitmoContrato.ts:28 (la marca sólo sube), packages/shared/src/contratos.ts:94 (el último trimestre acaba en la fecha de fin), las líneas 259, 264, 266, 267, 270, 275, 283 y 288 de ese mismo `contratos.ts` de `shared`, las líneas 28, 74, 78, 79, 81 y 87 de `apps/desk/server/routes/contratos.ts`, y las del plan R01.4 (la fila de F1B-11 y su remanente): todas correctas. La corrección 32 cita el maestro R08.4 con el texto vigente copiado tal cual (líneas 2655, 2656, 5561-5563 y 5824) y las de 2654 y 2658 (aviso de ritmo y E-088): correctas; el «punto nº 53» del Anexo D está dos líneas antes de la 5824.
- **Una cita imprecisa:** apps/desk/src/components/ContratoFicha.tsx:118 apunta a la declaración de `AmpliarContrato`, no al `setError` de la línea 130 (SG-6). No está rota.

## 8 · Documentos para Gerencia (§13 del paquete)

- **S-1 dice expresamente que la fuente no exige el motivo:** «**La fuente no lo exige**: ni E-086 ni la decisión lo nombran; se pide por coherencia con liberar y reasignar» (docs/sdd/Paquete_de_Despliegue_2026-10-06.md:395). Cumple.
- **Ninguna reunión mencionada:** barrí los tres textos nuevos (sólo las líneas añadidas) con `reuni[oó]n`, `encuentro`, `junta` y `sesión de`: cero coincidencias. Cumple.
- **Afirmaciones sobre el código sin ruta:línea:** hay dos (SG-6): «quien amplía es el de la sesión» y «no hay `DELETE` ni `UPDATE` sobre la tabla». Son ciertas (apps/desk/server/routes/contratos.ts:83 y mi `git grep`), pero no llevan cita. Lo demás la lleva o remite a la prueba por nombre.
- La atomicidad real queda declarada como hipótesis hasta P.8 (docs/sdd/Paquete_de_Despliegue_2026-10-06.md:406), coherente con lo que las pruebas pueden ver. Las tareas P.8 a P.11 son de verdad de personas (producción, maestro, bandeja, respuestas de Gerencia): la regla del ciclo 1 se respeta.

## 9 · Lo que este verify NO comprobó

- **Atomicidad real en PostgreSQL:** sin pool no hay transacción en pg-mem; probé la estructura (BEGIN, UPDATE, INSERT, COMMIT o ROLLBACK), no el revertido real. Es la tarea P.8.
- **La interfaz:** los `.tsx` están fuera de la red de pruebas por decisión de Gerencia. Leí `apps/desk/src/components/ContratoFicha.tsx` y compilé (build 0), pero no la ejecuté ni la vi en el navegador.
- **Datos reales y despliegue:** no consulté producción ni Books; no comprobé que `migrate` cree la tabla en la base real (sólo en pg-mem).
- **El criterio 13 y el archivo:** el `archive-report.md`, la fusión del delta en `openspec/specs/tickets-core/spec.md` y la medida de líneas del intento no existen todavía. Tampoco medí las líneas del lote 5 contra el techo de 800 (lo mide el orquestador).
- **Las puertas en su propio código:** no se mutaron (ficheros vedados); las probé por su comportamiento ante la ruta real.
- **Todas las citas del repositorio:** corrí el detector (exit 0) y leí a mano las 36 nuevas y las de los ficheros con ediciones en medio; las abreviadas del repositorio entero siguen siendo lectura humana (13 rotas informativas que no comparé una por una con el árbol base).
- **Mutaciones en el cliente:** sin red de pruebas, no hay mutación posible sobre `ContratoFicha.tsx` ni `ContratosPanel.tsx`.
- **Concurrencia real:** la carrera se simula con un doble que cuela una escritura (apps/desk/server/routes/contratosAmpliar.test.ts:150), no con dos conexiones.
