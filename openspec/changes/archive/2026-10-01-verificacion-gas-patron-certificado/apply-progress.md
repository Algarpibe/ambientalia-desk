# Apply progress — `verificacion-gas-patron-certificado` (F1A-03)

## Lote 1 · Dato — 2026-10-01, sobre `b85cdcc`

**Hecho:** 0.1-0.7 y 1.1-1.18 (25 casillas). Línea base: 165 ficheros / 2.206 pruebas, lint 165 avisos.
Cierre: 166 ficheros / 2.283 pruebas (+77), typecheck limpio, lint 165 avisos, 0 errores, ninguno nuevo.

**Ficheros:** `gasPatron.ts` (nuevo, 56) y su prueba (110); `index.ts` +1; `types.ts` 1/1; `schema.sql` +32
(622 → 654, −0); `migrate.ts` 1/1; `migrate.test.ts` 132/12; `db/equipos.ts` 20/9 (409 → 420: ayudante al
final); `routes/equipos.ts` 5/5 (211); `db/equipos.test.ts` +60; `equipos.test.ts` +171; `equipoNuevo.test.ts`
+58; `registro.test.ts` 1/1; `config.yaml` 3/3 en `:313-315`.

**R-2:** `gases-patron` declarada DENTRO de `capabilities` (`config.yaml:313-314`), sin desplazar líneas.
`npm run reconcile`: 21 declaradas, 0 huérfanas. Discriminación: con la spec copiada a `openspec/specs/` y la
declaración comentada, 20 declaradas y 1 huérfana (`gases-patron`). Informe devuelto a HEAD.

**Rojo natural:** 1.2 `Failed to load url ./gasPatron`; 1.6 `[10, 24, 3]` ≠ `[10, 26, 3]`, 41 ≠ 43 `ALTER`,
120 ≠ 126 sentencias; 1.12 `{ compuesto: null }` ≠ `'NOₓ'` (HV14-3) y `'SO₂'` (HV14-2); 1.16 `'20 declaradas'`.

**Nacen verdes (declarados):** EN12-2; `creates[36]` de `migrate.test.ts:537` y `:545`; HV13-1, HV13-2, HV13-3, HV14-4, HV14-7;
HV15-7 y HV15-8 (equipo preparado por SQL tras ver el rojo). Se discriminan con m-7g, m-8, m-9d.

**Hipótesis 1.6:** confirmada. pg-mem admite `CREATE UNIQUE INDEX IF NOT EXISTS`, `bigserial` y
`ON CONFLICT (cilindro) DO NOTHING`; sin plan B. HV13-3 se prueba con pg-mem y `createManagedTicket`
(`equipoNuevo.test.ts` usaba un rastreador sin base): el «201» se afirma como «resuelve sin `HttpError`».

**Mutaciones (ejecutor):** m-3a, m-3b, m-4, m-4b, m-7a..h, m-8, m-8b, m-9a..d: todas ROJO y revertidas.
**Reproducidas por el orquestador:** m-4 (GP01-4), m-3b (GP03-1, GP03-4), m-4b (GP01-3), m-7a (clasificación
de tablas), m-7b y m-7c (`ALTER` calificadas/sin calificar), m-9a (HV15-5 ×2, HV15-6), m-8 (herencia, 6 rojas).

**«Vigente»:** `patronVigente` recibe `hoy: DiaCivil`; la prueba del borde usa `hoyEnZona` de `contratos.ts`
(`2026-10-02T03:00:00Z` → `2026-10-01`, vence ese día: cuenta). No se reimplementa el día civil.

**Barrido regla 4:** todas las ediciones en sitio o al final; ninguna cita se desplaza. Caso B anclado
(`db/equipos.ts:142-152` en `a3a8f03`), caso A vigentes (`migrate.ts:70-73`, `:63-80`, `:73`). Matiz B: el
paquete del 10-01 `:230` dice «las dos últimas» de `PUBLIC_TABLES`; es registro fechado, no se edita.

**Medida:** 733 de código, pruebas, casillas y `config.yaml` + este fichero. Supera la válvula de 720 (las
pruebas salieron ~480 frente a ~335 estimadas), queda bajo el techo de 800: se declara y no se parte.

## Lote 2 · Guardas — 2026-10-01, sobre `f6f1b5b`

**Hecho:** 2.1-2.13 (13 casillas). Cierre: 167 ficheros pasan + 1 omitido / 2.344 pruebas pasan + 2 omitidas
(Lote 1: 2.283), typecheck limpio, lint 165 avisos, 0 errores, ninguno nuevo.

**Ficheros:** `gasPatron.ts` +43 (parte 2); `transitions.ts` 1/1 en `:360` (397); `ticketService.ts` 23/7 (234 → 250: seis
ediciones en sitio, `:5`, `:6`, `:131`, `:132`, `:133`, `:134`, `:155`, y dos funciones al final); `db/gasesPatron.ts` (nuevo, una
consulta); `appHarness.ts` 2/2 (`:5`, `:74`); `ticketFuentes.ts` 2/2 (`:13`, `:83`); `invariantesGrafo.test.ts` 21/3 (305);
`gasPatron.test.ts` +82; `historial.test.ts` +28; `guardaGasPatron.test.ts` (nuevo, 36 pruebas).

**RED con rojo natural:** 2.1 «veredictoLiberacion is not a function» (17 rojas); 2.2 `['comment','derivado_a']` ≠ el esperado y
campo ausente (3 rojas); 2.4 «Certificado fabrica» en vez de la etiqueta; 2.3 17 rojas (EN08-1, EN08-9, GP03-4, EN09-1/2/3/5/5b/6/7,
EN10-1..5, EN10-8, m-11). Regresión 2.10 con `appHarness.ts:74` revertido: `transicionesEjecucion` («las seis salen de su
origen») y `flujoEquipoNuevo` P7 rojas por el `422`; con el arreglo, verdes.

**Nacen verdes (declarados):** EN08-2..8, EN09-4, EN10-6, EN10-7, EN10-9, EN01-5 y EN01-6 (con el número, hoy `200`), EN11-1,
EN12-1, GP04-3, GP05-1. Se discriminan con m-1, m-5d, m-6, m-11 y m-12.

**Mutaciones (todas ROJO y revertidas, `git diff` limpio):** m-1a (EN08-8), m-1b (EN08-9, EN09-6), m-1c (EN08-7, EN08-8), m-2
(EN09-1 y cuatro más), m-3c (GP03-4), m-4 (GP01-4 y «SO2»), m-5a (recorte), m-5b (EN10-4), m-5c (EN10-5), m-5d (EN10-6), m-5e
(EN10-6 e `invariantesGrafo`), m-5f (EN10-9), m-6 (EN09-5b), m-11 (recuento), m-12 (GP05-1). **m-1b salió VERDE al primer intento**:
`erroresCertificado` devolvía `[]` con veredicto que bloquea, así que 409 y 422 nunca coincidían y la posición era inobservable.
Corregido (`gasPatron.ts:83`: un veredicto que bloquea también exige el certificado) y probado aparte; ahora ROJO.

**Desviaciones declaradas (reversibles):**
1. **pg-mem no admite `custom_fields || $n::jsonb`** (`repo.ts:307-308`): `invalid input syntax for type json` con cualquier
   `customField` no promovido. Antes de este cambio ninguna prueba ejecutaba uno. En producción (Postgres) sí funciona. Como el
   número es de ESA liberación (RQ-EN-10: «en `values` de `ticket_transitions`») y `tickets.custom_fields` lo pisa el sync, se
   hizo `delete plan.customFields[CLAVE_CERTIFICADO_FABRICA]` en `ticketService.ts:133`, con prueba que fija que no se duplica.
   Revertir = quitar esa sentencia; las pruebas con 200 pasarían a depender de pg-mem, que no puede.
2. `ticketFuentes.ts:83` usa `Object.hasOwn(ETIQUETA_CLAVE_PROPIA, clave)`: una clave `constructor` en `values` habría roto el
   historial con el `?? ` del diseño. Prueba nueva en `historial.test.ts`.
3. `veredictoLiberacion` bloqueado no lleva `exigeCertificado` (tipo del diseño); el 422 lo deriva `erroresCertificado`.

**Hipótesis:** pg-mem acepta `LEFT JOIN gases_patron g ON g.compuesto IS NOT NULL` (CONFIRMADA, sin plan B, una consulta);
`current.row.equipo_id` es `string | null | undefined` (`rows.ts:50`) y `tsc` no se queja. **C-8 (2.12):** nada recorre
`custom_fields` hacia Zoho (`admin.ts`, `backfill.ts`, `TicketProperties.tsx:16` sólo lo leen o lo indexan para el cliente) y
`TransitionPanel.tsx:22-30` bloquea por `customFields` del ticket: sin la escritura (desviación 1) el campo nunca queda bloqueado.

**Barrido regla 4:** ediciones en sitio o al final; `wc -l` 397 / 95 / 178 sin cambio, `ticketService.ts` 250 por el final. 45
citas a `ticketService.ts` caen en líneas tocadas (`:5`, `:6`, `:131-134`, `:155`), leídas una a una: las vivas siguen ciertas (la
línea conserva lo que afirman); las de `Paquete_de_Despliegue_*` y `F0-00` son caso B (fechadas, no se tocan);
`Brecha_Maestro_R08.2:143` ya era vieja antes (la puerta 2 está en `:150`), no es de este lote. `transitions.ts:360`,
`invariantesGrafo.test.ts:213-216`, `appHarness.ts:74`, `ticketFuentes.ts:82-85` sin citas rotas. Forma corta de specs: no se editó ninguna.

**Medida:** 594 = 566 inserciones + 28 borrados (`git diff --shortstat --no-renames HEAD` con los dos ficheros nuevos en `add -N`: 26 + 278; incluye `apply-progress` +47 y las 13 casillas +13 −13). Bajo la válvula de 720 y el techo de 800. Sin binarios.

## Lote 3 · PDF, interfaz, siembra y cierre — 2026-10-01, sobre `f644027`

**Hecho:** 3.1-3.15 (15 casillas). Cierre: 168 ficheros pasan + 1 omitido / 2.363 pruebas pasan + 2 omitidas (Lote 2: 2.344; +19),
typecheck limpio, lint 165 avisos y 0 errores (ninguno nuevo), `npm run build` verde.

**Ficheros:** `routes/certificadoFabrica.ts` (nuevo, 61), `db/certificadosFabrica.ts` (nuevo, 46) y su prueba `certificadoFabrica.test.ts`
(nuevo, 19 pruebas); `app.ts` 2/2 en `:22` y `:61` (96); `client.ts` +14 al final (757 → 771); `CertificadoFabricaPdf.tsx` (nuevo);
`TransitionPanel.tsx` 6/6 en `:3`, `:8`, `:62`, `:98`, `:111`, `:179` (267); siembra `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql` (nuevo, 103);
`R08.4_Expediente_de_cambios.md` +10 al final (§9, no se edita en sitio).

**3.1 (hipótesis del diseño §6, CONFIRMADA):** el exceso de tamaño lo mapea `app.ts:84-87`: `MulterError` `LIMIT_FILE_SIZE` → `413` con
«El archivo supera el límite de 10 MB». La prueba EN11-4 espera `413` y los MB que dice `LIMITE_SUBIDA_MB`.

**RED con rojo natural:** 16 de 18 rojas por el comodín `404` «Ruta de API no encontrada» (`app.ts:73`). **Nacieron verdes (declarado):** `401`
(`requireAuth`) y EN11-5 (hoy `422` por el certificado, lote 2). Los `404` de ticket se afirman por el cuerpo («Ticket no encontrado»), no por
el estado, para no confundirlos con el comodín. Prueba añadida tras la mutación: m-10a (bytes de PDF declarados `image/png`).

**Mutaciones (todas reproducidas, ROJO y revertidas, ruta idéntica a la copia):** m-10a (quitar la comprobación del `mimetype`: ROJO sólo
con la prueba añadida; la firma `%PDF-` sola no la cubre), m-10a2 (quitar mimetype y firma: ROJO en EN11-3 y m-10b), m-10b (quitar `%PDF-`: ROJO),
m-10c (quitar el `Content-Type` fijo: ROJO en las cabeceras), m-10e (subir sin liberación: ROJO ×2). **Posición (m-10d):** 415 delante del 403 (ROJO ×2),
415 delante del 409 (ROJO), 403 delante del 400 (ROJO), 403 delante del 404 (ROJO ×2), 409 delante del 403 (ROJO). Extras: `DELETE` sin
`requireSuperAdmin` (ROJO), `attachment` quitado (ROJO), lectura sin filtrar por ticket (ROJO).
**Sobrevive y se declara:** quitar `X-Content-Type-Options` de la ruta NO pone nada en rojo, porque `helmet` (`app.ts:37`) lo añade a todas las
respuestas: la línea de la ruta es defensa en profundidad. **m-10c, matiz:** el diseño decía «servir el `Content-Type` guardado»; la tabla
`certificados_fabrica` no guarda tipo (`schema.sql`, bloque del diseño §2), así que la mutación equivalente es quitar el fijo.

**Matriz de amenazas:** tipo falso → m-10a/b; HTML servido como PDF → cabeceras fijas + `attachment`; tamaño → EN11-4; subida por quien no libera → 403/409
de la escalera; contenido malicioso dentro del PDF → N/A declarado (sólo descarga, sin visor).

**Interfaz (3.6-3.8, sin RED por F0-00):** el campo de texto sale solo del catálogo (sin asterisco: `required: false`); `CertificadoFabricaPdf` es un
`<input type="file" accept="application/pdf">` que no valida; se monta sólo con `active.id === 'liberacion'`. Si la subida falla tras el `200`, el panel
dice que la liberación quedó registrada y que el PDF no se adjuntó (no se puede reintentar la transición: ya salió de su origen).
Todo en líneas existentes (`;` o la misma línea JSX) para no mover `TransitionPanel.tsx:56-57` ni `:209`.

**Siembra (3.9):** NO ejecutada (sin `psql`). Todo calificado (`desk.equipos`, `desk.tickets`, `public.catalogo_modelos`, `public.gases_patron`):
`grep -nE "^(UPDATE|INSERT|ALTER|FROM)"` + `JOIN` leído, ninguna sentencia sin calificar. Comprobación previa y `DO $$` que aborta si no hay cuatro modelos; recuentos P.3 antes
de desplegar; A (solo `IS NULL`) y B activos; convertidores, C (`UPDATE`, sin `IS NULL`) y D (`INSERT … ON CONFLICT`) comentados y marcados `-- [P.1]`, sin valores.

**3.10 · Casilla de la regla 13 (línea REAL leída al cerrar):**
| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| No marca el certificado obligatorio (sin asterisco, `TransitionPanel.tsx:209` lee `required`) | `erroresCertificado` → 422 en `ticketService.ts:134` (EN10-1..9); catálogo `transitions.ts:360` |
| Enseña el `409` de Verificación tal cual (`:180`, `error`) | `exigirVerificacion(gas)` en `ticketService.ts:131` (EN08-1, EN08-9) |
| No envía motivo; si lo enviara, se descarta | `valoresConMotivo` en `ticketService.ts:155` (EN09-5, m-6) |
| El campo del certificado no se bloquea ni se prellena desde el ticket (`yaLoTraeElTicket`, `:32-36`) | `delete plan.customFields[CLAVE_CERTIFICADO_FABRICA]` en `ticketService.ts:133`: el número no entra en `tickets.custom_fields` |
| `accept="application/pdf"` (`CertificadoFabricaPdf.tsx:14`) | 415 de `routes/certificadoFabrica.ts:38` (m-10a, m-10b) |
| Sube el PDF sólo en `liberacion` y tras el `200` (`TransitionPanel.tsx:111`, `:179`) | 409 «sin liberación registrada» `certificadoFabrica.ts:36-37` (m-10e); 403 `:33` |
| El botón de la transición sólo sale si `puedeEjecutarTransicion` (`:56-57`, ya existente) | 403 de área `ticketService.ts:129`, probado por `permisos.test.ts` (IV-3 cerrado) |
| El PDF opcional no condiciona la liberación | EN11-1 y EN11-5: `ticketService.ts` decide con o sin PDF |
Ninguna decisión queda sin línea de servidor: el cliente es comodidad legítima (regla 13, punto 3).

**Barrido regla 4 (3.11):** las seis ediciones de `TransitionPanel.tsx` y las dos de `app.ts` están en sitio; ningún fichero muy citado de los tres lotes cambió de longitud salvo
por el final (`git diff --numstat --no-renames b85cdcc`: `ticketService.ts` 234→250, `schema.sql` 622→654, `migrate.test.ts` 568→688, `db/equipos.ts` 409→420, `invariantesGrafo.test.ts` 287→305, `index.ts` 26→27, `client.ts` 757→771; el resto, misma longitud).
Citas a `app.ts:61` (Paquete 09-29, 09-30, 10-01): caso B, fechadas, la línea sigue montando esas rutas; `:73` y `:79`, intactas. `TransitionPanel.tsx:111` (design) sigue siendo la línea de `executeTransition`; `:56-57`, `:103`, `:160`, `:209`, `:253` no se tocaron.
`client.ts` sólo ganó líneas al final. Forma corta de las specs: no se editó ninguna.

**Para el `archive-report` (3.14):** (a) cobertura de `proposal.md` tal cual; (b) `cierra: si`: ninguna exigencia de la fila quedó sin destino; (c) el compuesto sin traza en `equipos_cambios` → F1B-02;
(d) correcciones del delta C-1 (sólo administrador corrige), C-5 (el alta ignora el compuesto del cuerpo) y C-6 (26 tablas en `public`, columna `vence`); **(e) desviaciones del diseño, ambas reversibles:** el número del certificado NO se copia a `tickets.custom_fields` (`ticketService.ts:133`; pg-mem no ejecuta `custom_fields || $n::jsonb`, `repo.ts:307-308`), y la tabla no guarda `content_type`
(el `Content-Type` es fijo); (f) P.1-P.4 sin resultado todavía (siguen en `tasks.md`; archivar no las da por hechas); (g) la nota de despliegue literal está al final de `tasks.md`.

**Medida:** 535 = 512 inserciones + 23 borrados, 11 ficheros: código 135 (`certificadoFabrica.ts` 61, `certificadosFabrica.ts` 46, `CertificadoFabricaPdf.tsx` 23, `app.ts` 2/2, `client.ts` +14, `TransitionPanel.tsx` 6/6), pruebas 170, siembra 103, `R08.4` +10, casillas 15/15, `apply-progress` +62 (`git diff --shortstat --no-renames HEAD` con los ficheros nuevos en `add -N`; incluye este `apply-progress`, las 15 casillas y la siembra). Sin binarios.
