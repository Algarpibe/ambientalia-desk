# Tasks: Búsqueda por número de ticket y por serial en el listado

Cambio `busqueda-ticket-serial` · `tanda: F1B-08` · `cierra: no`. Dos lotes = dos intentos del registro (techo 800, válvula 720). Donde diseño y spec difieren, manda el diseño (`design.md`): subconsulta `IN (SELECT …)` en vez de `LEFT JOIN` (H-1, planes B y C) y mutación de posición = quitar los paréntesis exteriores (MP-1).
Reglas de todas las casillas: pruebas en ficheros NUEVOS, sin `as any` (lint en 165 avisos sin holgura); `strict_tdd` (rojo, ejecutarlo, anotar el fallo literal en `apply-progress.md`, luego verde); las líneas citadas del diseño se REMIDEN antes de editar; ficheros muy citados con CERO líneas netas (se editan en su sitio, importaciones unidas con `;`).

## Review Workload Forecast

| Lote | Líneas estimadas | Riesgo frente a 800 |
|---|---|---|
| 1 · Núcleo | ≈ 523 (producción 89 + pruebas 210×1,8=378 + casillas y `apply-progress.md` ≈ 56) | Bajo (válvula 720). Si H-1 cae al plan C, volver a medir antes de seguir |
| 2 · Puertas y cliente | ≈ 458 (producción 124 + pruebas 150×1,8=270 + casillas y `apply-progress.md` ≈ 64) | Bajo (válvula 720) |

Cada lote se mide al cerrar: `git diff --shortstat --no-renames` contra su commit de partida más `wc -l` de lo nuevo sin trackear. Binarios, si los hubiera, fuera del tope y anotados aparte.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

(La guía de 400 líneas de la plantilla no aplica: el presupuesto del proyecto es 800 por intento y cada lote cabe. Sin decisión previa: `ask-on-risk` no se dispara bajo la válvula. Dos intentos secuenciales, nunca en paralelo.)

### Unidades de trabajo

| Unidad | Meta | Prueba focal | Harness real | Frontera de reversión |
|---|---|---|---|---|
| Lote 1 | Normalizador compartido, SQL, `repo.ts`, `searchEquipos`, confrontación; árbol verde sin el lote 2 | `npx vitest run packages/zoho-sync/src/db/busquedaTickets.test.ts packages/shared/src/busquedaTickets.test.ts apps/desk/server/db/busquedaConfrontacion.test.ts` | pg-mem de las pruebas (sin servidor) | Revertir el commit del lote 1; el parámetro `busqueda` es opcional, nadie lo exige |
| Lote 2 | Middleware, rutas, `ticketsConCliente`, URL, `App.tsx`, caja | `npx vitest run apps/desk/server/busquedaTickets.test.ts apps/desk/src/lib/busquedaTickets.test.ts` | Arnés HTTP `appHarness` (`adminCookie`/`userCookie`); la caja `.tsx`, por persona | Revertir el commit del lote 2 deja `q` sin emisor y el listado como hoy |

---

# LOTE 1 · NÚCLEO (intento 1)

## 1A · Fase de partida

- [x] 1.1 Anotar el commit de partida (`git rev-parse HEAD`) en `apply-progress.md`; abrir el intento 1 en el registro; `wc -l` de `packages/zoho-sync/src/db/repo.ts`, `apps/desk/server/db/equipos.ts` y `packages/shared/src/index.ts` ANTES de editar.
- [x] 1.2 Línea base: correr `npm test`, `npm run typecheck`, `npm run lint` y anotar el CÓDIGO DE SALIDA de cada uno (`${PIPESTATUS[0]}` si se canaliza) y los 165 avisos. Remedir las líneas del diseño §5 lote 1 (`repo.ts` 129, 142-143, 151-152, 157-158, 166-167, 172-173, 177-178, 186-187; `equipos.ts` 6 y 60; `index.ts` 31).

## 1B · Rojos (nada de producción todavía)

- [x] 1.3 Crear `packages/zoho-sync/src/db/busquedaTickets.test.ts` con SÓLO la prueba que despeja H-1: ticket enlazado a un equipo se encuentra por el serial del equipo, con `getActiveTickets(db, '', filtro)` en pg-mem.
- [x] 1.4 EJECUTARLA (`npx vitest run packages/zoho-sync/src/db/busquedaTickets.test.ts`): debe ponerse ROJA (módulo inexistente). Anotar el fallo literal.
- [x] 1.5 **Despejar H-1 antes de construir encima.** Mínimo: `sqlBusquedaTickets` con la subconsulta `t.equipo_id IN (SELECT id FROM equipos WHERE LOWER(serial) LIKE $n)` y cablear SÓLO `getActiveTickets`; correr la prueba. Si pg-mem la rechaza: plan B (`LEFT JOIN equipos e` + `LOWER(e.serial) LIKE`, campo `join` en el fragmento); si también falla, plan C (consulta previa de ids, `sqlBusquedaTickets` asíncrono con `db`). Anotar en `apply-progress.md` cuál plan quedó y el mensaje literal de cada fallo; con plan C, remedir el lote (§10) y revisar `apps/desk/server/misTickets.test.ts:121` (cuenta consultas).
- [x] 1.6 Crear `packages/shared/src/busquedaTickets.test.ts`: tabla del diseño §3 caso a caso (`undefined`, lista/objeto → `Búsqueda inválida`, `''`/`'   '`, >64 recortado, `'864'`, `' #864 '`, `'0864'`, `'# 864'`, `'86a'`, `'12345678901'`, `'22052 '`, `'85HHP'`; `patronSerial('')` = `'%%'`). EJECUTAR: ROJO (módulo no existe). Anotar fallo literal.
- [x] 1.7 Completar `busquedaTickets.test.ts` (zoho-sync): número exacto («864» sí, «86» no); dígitos que no caben en `integer` no rompen; últimos dígitos, centro y serial guardado en mayúsculas; serial corregido del equipo (nuevo y viejo, criterio 3); **posición** (un cerrado y un activo que casan, uno por `t.serial` y otro por el equipo: activos sólo el activo; cerrados y `countClosedTickets`, sólo el cerrado); recuento y página 2 filtrados (criterio 5); `getAllTickets` con filtro (rama `where`); sin filtro (`undefined` y `null`) **[nace verde: CARACTERIZACIÓN]**. EJECUTAR: todas ROJAS salvo la de sin filtro. Anotar fallos literales.
- [x] 1.8 Crear `apps/desk/server/db/busquedaConfrontacion.test.ts` (molde H5): por caso, equipo activo con serial `S` sin otro campo casable + ticket SIN equipo con `serial = S` y número alto; veredicto A = `searchEquipos(db, q)`, veredicto B = `getActiveTickets(db, '', leerBusquedaTickets(q).filtro)`; exigir A = B **y** el valor esperado. Casos: últimos dígitos, centro, mayúsculas/minúsculas en los dos sentidos, espacios a los lados, `%`, `_`, sin coincidencia, vacío. EJECUTAR: **sólo «espacios» nace ROJO; el resto nace verde (CARACTERIZACIÓN de `searchEquipos`)**; no disfrazarlo.

## 1C · Verde

- [x] 1.9 Crear `packages/shared/src/busquedaTickets.ts` (`BUSQUEDA_MAX = 64`, `patronSerial`, `BusquedaTickets`, `LecturaBusqueda`, `leerBusquedaTickets`) y añadir `export * from './busquedaTickets'` como ÚLTIMA línea de `packages/shared/src/index.ts`. Correr 1.6: verde.
- [x] 1.10 Completar `packages/zoho-sync/src/db/busquedaTickets.ts` (`sqlBusquedaTickets(f, desde)` → `{ and, where, params }`; con y sin número; paréntesis exteriores; sin filtro `'', '', []`) con el plan que dejó 1.5.
- [x] 1.11 `packages/zoho-sync/src/db/repo.ts`, EN SU SITIO: importaciones unidas con `;` en la 129; parámetro `busqueda?: BusquedaTickets | null` en las firmas de 142, 157, 172, 177; `const b = sqlBusquedaTickets(...)` unido a las líneas 143, 158, 173, 178; `${b.and}` en 151/166/173, `${b.where}` en 186, `...b.params` en 152/167/187. Ninguna línea nueva.
- [x] 1.12 `apps/desk/server/db/equipos.ts`, EN SU SITIO: `patronSerial` en la importación de la línea 6 y `const like = patronSerial(q)` en la 60. Correr 1.7 y 1.8: todo verde (incluido «espacios»).
- [x] 1.13 Correr `npx vitest run apps/desk/server/db/equipos.test.ts` (líneas 25-27, 64, 68, 77, 83, 467, 486, 503 siguen verdes sin tocarlas).

## 1D · Mutaciones (una casilla cada una: aplicar, ver qué cae, anotar mensaje literal, REVERTIR)

- [x] 1.14 **MP-1 (posición):** en `zoho-sync/db/busquedaTickets.ts` quitar los paréntesis EXTERIORES del predicado → debe caer «posición» (cerrado que casa por su equipo aparece en activos). NO usar «poner el predicado antes del filtro de estado»: es mutante equivalente. Revertir.
- [x] 1.15 **MC-1:** quitar `OR t.equipo_id IN (…)` → cae «serial corregido del equipo». Revertir.
- [x] 1.16 **MC-2:** `leerBusquedaTickets` devuelve siempre `numero: null` → cae «864 encuentra el ticket 864». Revertir.
- [x] 1.17 **MC-3:** `patronSerial` sin el `%` inicial → caen «últimos dígitos» (unitaria y de repositorio). **La confrontación sigue VERDE a propósito** (las dos búsquedas cambian juntas, lo que demuestra que comparten la pieza); anotarlo con las pruebas que sí la cazan. Revertir.
- [x] 1.18 **MC-4 (M-4):** `equipos.ts` línea 60 vuelve a `` `%${q.toLowerCase()}%` `` → cae la confrontación, caso «espacios». Revertir.
- [x] 1.19 **MC-5:** `leerBusquedaTickets` arma `patron` sin `patronSerial` (`` `%${t}%` ``) → cae la confrontación con `q` en mayúsculas y la unitaria. Revertir.
- [x] 1.20 **MC-6:** quitar `LOWER(` de `t.serial` → cae «serial guardado en mayúsculas». Revertir.
- [x] 1.21 **MC-7:** `t.number = $d` → `t.number >= $d` → cae «86 no devuelve el 864». Revertir.
- [x] 1.22 **MC-8:** `repo.ts` línea 173, quitar `${b.and}` → cae `total` filtrado. Revertir.
- [x] 1.23 `git diff` sobre los cinco ficheros de producción del lote: comprobar que NO queda ninguna mutación en el árbol (predicado, `patronSerial`, `leerBusquedaTickets`, `equipos.ts:60`, `repo.ts:173` íntegros).

## 1E · Cierre del lote 1

- [x] 1.24 `git diff --numstat` de `packages/zoho-sync/src/db/repo.ts` y `apps/desk/server/db/equipos.ts`: inserciones = borrados en cada uno; `wc -l` antes y después idéntico. Si no cuadra, barrido completo de la regla de mutación 4 sobre ese fichero.
- [x] 1.25 Escribir en `apply-progress.md` la **regla 13 por escrito**, decisión a decisión (diseño §9, filas 2, 3 y 6 del lote 1: línea del servidor que impone cada una, remedida) y las mutaciones con su mensaje literal.
- [x] 1.26 Cierre: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores), anotando el CÓDIGO DE SALIDA de cada uno.
- [x] 1.27 Medida del intento: `git diff --shortstat --no-renames <commit de partida>` + `wc -l` de lo nuevo sin trackear; registrar ESA cifra (tope 800; si lo supera, el intento se parte).

**— FIN DEL LOTE 1. Cerrar el intento 1 (settle) antes de abrir el 2. —**

---

# LOTE 2 · PUERTAS Y CLIENTE (intento 2)

## 2A · Fase de partida

- [ ] 2.1 Anotar el commit de partida del lote 2; abrir el intento 2; `wc -l` de `routes/tickets.ts`, `routes/prioridad.ts`, `db/ticketsConCliente.ts`, `src/api/client.ts` y `src/App.tsx`; línea base de `npm test`/`typecheck`/`lint` con códigos de salida.
- [ ] 2.2 Remedir las líneas del diseño §5 lote 2 (`tickets.ts` 13, 35, 104, 108, 109, 114; `prioridad.ts` 7, 83, 85; `ticketsConCliente.ts` 6, 26-33; `client.ts` 1, 19-20, 25-26, 743-744; `App.tsx` 17, 58, 59, 63, 66, 69, 71, 107).

## 2B · Rojos

- [ ] 2.3 Crear `apps/desk/src/lib/busquedaTickets.test.ts`: `conBusqueda` (`q === ''` devuelve la URL intacta; `?` o `&`; `encodeURIComponent`) y `aplazar` (temporizadores falsos: llama una vez pasados `ms`, cancelada no llama). EJECUTAR: ROJO (módulo no existe). Anotar fallo literal.
- [ ] 2.4 Crear `apps/desk/server/busquedaTickets.test.ts` (arnés de `tickets.test.ts:6`): criterios 1 y 2 por HTTP (`?q=864`, `?q=%23864`, `?q=86`, últimos dígitos, espacios y mayúsculas); `scope=closed&q=` con `total` filtrado, página 2 y `page=9` vacía; `mis-tickets?q=` sólo los del usuario y en el orden de RQ-VT-09; 65 caracteres con sesión → `422` y 64 → `200`; 80 espacios → `200` igual que sin `q`; `?q=a&q=b` → `422`; `%23` → `200` vacío; la búsqueda no segmenta visibilidad (dos áreas). EJECUTAR: ROJAS (la ruta ignora `q`).
- [ ] 2.5 En el mismo fichero, **posición (MP-2):** 65 caracteres SIN sesión → `401` en `/api/tickets` y en `/api/mis-tickets`; y `q` ausente, vacío y de espacios con cuerpo idéntico al de la misma petición sin `q` en activos, cerrados y «Mis tickets». **Nacen VERDES (CARACTERIZACIÓN)**; la 401 se vuelve guarda de posición. Anotar que nacen verdes.

## 2C · Verde

- [ ] 2.6 Crear `apps/desk/src/lib/busquedaTickets.ts` (`ESPERA_BUSQUEDA_MS = 300`, `conBusqueda`, `aplazar`). Correr 2.3: verde.
- [ ] 2.7 Crear `apps/desk/server/util/busquedaTickets.ts` (`leerBusqueda` con `res.locals.busqueda`, `422 { error }`; `busquedaDe(res)`).
- [ ] 2.8 `apps/desk/server/db/ticketsConCliente.ts`, EN SU SITIO: `type BusquedaTickets` en la importación (línea 6) y parámetro opcional que pasa a `repo` (26-27, 29-30, 32-33).
- [ ] 2.9 `apps/desk/server/routes/tickets.ts`, EN SU SITIO: importación unida en la 13; `leerBusqueda` en la 104 detrás de `requireAuth`; `busquedaDe(res)` último argumento en 108, 109 y 114 (items y total reciben el MISMO valor).
- [ ] 2.10 `apps/desk/server/routes/prioridad.ts`, EN SU SITIO: importación unida en la 7; `requireAuth(db), leerBusqueda,` en la 83; `getActiveTickets(db, yo, busquedaDe(res))` en la 85. Correr 2.4 y 2.5: verde.
- [ ] 2.11 `apps/desk/src/api/client.ts`, EN SU SITIO: importación unida en la 1; parámetro `q = ''` y `fetch(conBusqueda(<url de hoy>, q), …)` en 19-20, 25-26 y 743-744. No tocar `fetchTickets` (D11).
- [ ] 2.12 Crear `apps/desk/src/components/BuscadorTickets.tsx` (`type="search"`, `maxLength={BUSQUEDA_MAX}`, estado local, `useEffect(() => aplazar(() => onBuscar(texto), ESPERA_BUSQUEDA_MS), [texto, onBuscar])`; textos en español; sin lógica de dominio).
- [ ] 2.13 `apps/desk/src/App.tsx`, EN SU SITIO: importación unida en la 17; `; const [q, setQ] = useState('')` unido en la 58; `q` en las dependencias de 59 y 71 y como último argumento de 63, 66 y 69; `<BuscadorTickets onBuscar={setQ} />` delante de `<ViewModeMenu …/>` en la 107.

## 2D · Mutaciones

- [ ] 2.14 **MP-2 (posición):** en `routes/tickets.ts` quitar `leerBusqueda` de la 104 y dejar la 35 como `app.use('/api/tickets', leerBusqueda, requireAuth(db))`; y en `prioridad.ts` línea 83 intercambiar `requireAuth(db)` y `leerBusqueda` → cae «65 caracteres sin sesión: llega 422, se esperaba 401». Revertir.
- [ ] 2.15 **MC-9:** `leerBusquedaTickets` sin la comprobación de longitud → cae el `422` con sesión. Revertir.
- [ ] 2.16 `git diff` de producción: comprobar que NO queda ninguna mutación en el árbol (orden de `requireAuth`/`leerBusqueda`, comprobación de longitud).

## 2E · Cierre del lote 2

- [ ] 2.17 `git diff --numstat` de `routes/tickets.ts`, `routes/prioridad.ts`, `db/ticketsConCliente.ts`, `src/api/client.ts` y `src/App.tsx` (y de `repo.ts` y `equipos.ts`, por si se tocaron): inserciones = borrados; `wc -l` antes y después. Si alguno no cuadra, barrido completo de la regla de mutación 4 sobre ese fichero.
- [ ] 2.18 **Barrido de citas (regla de mutación 4):** `grep -rnoE "<fichero>\.tsx?:[0-9]+(-[0-9]+)?"` de los siete ficheros editados, SIN excluir `openspec/changes/archive/`; releer cada cita que AFIRMA lo que cambió en las líneas editadas y clasificar A (presente), B (histórico) o C (superado); sólo LISTAR en `apply-progress.md` (no editar specs vivas ni documentos fechados). Segundo pase para la forma abreviada en los ficheros que ya citan el módulo.
- [ ] 2.19 Escribir en `apply-progress.md` la **regla 13 completa** (las nueve filas del diseño §9, con la línea del servidor de cada una remedida tras el cambio).
- [ ] 2.20 Redactar en `apply-progress.md`, SIN número («a numerar por el orquestador»), las preguntas para la bandeja: las cuatro de la propuesta (S-6 vista activa; número exacto o parcial; relleno de `tickets.serial` en históricos, con medición previa; alcance de la paridad: asunto, cliente, contacto) y el hallazgo D12 (`listEquiposManage`, `equipos.ts:175`, tiene su propio patrón sin recortar; sin destino inventado).
- [ ] 2.21 Cierre: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores), con el CÓDIGO DE SALIDA de cada uno.
- [ ] 2.22 Medida del intento: `git diff --shortstat --no-renames <commit de partida del lote 2>` + `wc -l` de lo nuevo sin trackear; registrar ESA cifra (tope 800).

---

## Comprobaciones de PERSONA — FUERA del recuento (regla del ciclo 1)

Ninguna es casilla: no describen trabajo que una tanda pueda hacer en el repositorio (`.tsx` fuera de la red por F0-00; el dato está en producción). **Archivar este cambio NO las da por hechas.**

| Comprobación | Dueño | Destino | Dónde queda escrita |
|---|---|---|---|
| Los cuatro escenarios manuales de RQ-VT-13 en `ambientalia-desk.ambientalia.cloud`, tras el despliegue: (1) número con y sin `#`; (2) últimos dígitos y serial completo en minúsculas; (3) cerrado en página 2 con el total filtrado, y lo mismo en «Mis tickets»; (4) borrar el texto devuelve el listado completo y cambiar de página + escribir vuelve a la primera. Más: en la recepción, el autocompletado por serial responde igual | QA / quien despliegue | Tras el despliegue del paquete | Delta `specs/vistas-tablero/spec.md` (RQ-VT-13), `design.md` §12 y el paquete de despliegue |
| Recuento de tamaño: `SELECT count(*) FROM desk.tickets;` y `SELECT count(*) FROM desk.equipos;` (confirma la hipótesis de miles de filas del `LIKE` sin índice) | Quien despliegue (acceso a producción) | Antes o durante el despliegue | `design.md` §12 y `proposal.md` §12; el resultado, en el parte de despliegue |

---

## Notas para `sdd-apply`

- Diseño y spec difieren en dos puntos; manda el diseño: subconsulta (H-1 con planes B y C) y MP-1 como mutación de posición válida.
- El delta de spec no se edita en este cambio; las specs vivas no se tocan (sólo se lista el barrido 2.18).
