# Apply-progress: nit-exentos-aviso-provisional (F1B-19) — lote 1 · exentos

Estado: lote 1 CERRADO en casillas 1.1 a 3.3 (14/14). Quedan las 3.4 y 3.5 (las cierra el orquestador), el lote 2 y el lote 3.
Modo: strict TDD. Rojo anotado antes del verde; ninguna línea existente se movió.

## Qué se hizo
- `schema.sql`: once líneas al final (796 a 807) con el SQL exacto del diseño §1; la única fila sembrada es `222222222222`.
- `migrate.ts:73`: `'nit_exentos'` en `PUBLIC_TABLES`, dentro de línea.
- `packages/shared/src/nitExentos.ts` (nuevo, `esNitExento` sobre `nitCoincide`) y su export en `packages/shared/src/index.ts:28`, dentro de línea.
- `apps/desk/server/db/nitExentos.ts` (nuevo, `nitExentosActivos`).
- `ticketService.ts:6`, `:18` y `:96` dentro de línea; comentario de `altaManual.ts:155-156` reescrito sin mover líneas.
- Pruebas: `nitExentos.test.ts`, `nitExentosEsquema.test.ts` (nuevos), `describe` nuevo al final de `altaManual.test.ts`, y `migrate.test.ts` editado en sitio.

## Rojo → verde (pruebas impulsoras)
| Prueba | Rojo (motivo) | Verde |
|---|---|---|
| `nitExentos.test.ts` entero | módulo `./nitExentos` inexistente | sí |
| `nitExentosEsquema.test.ts` (4) | tabla y siembra inexistentes | sí |
| `altaManual.test.ts`: `201` sin formato y tres formatos, dos provisionales (S-2) | `409` (no había exención) | sí |
| `altaManual.test.ts`: fila inactiva, lista vacía | `relation public.nit_exentos does not exist` | sí |
| `altaManual.test.ts`: lectura con NIT exento / no exento | la lista no se leía | sí |
| `migrate.test.ts`: recuento 46 y las siete aserciones por distancia | 45 tablas; distancias al final | sí |
| `altaManual.test.ts`: posición (serial, A, C), `409` no exento, base más dígito sin guion, lectura sin cliente manual | nacen VERDES (guardas), como dice el diseño | verde |

## Mutaciones (todas restauradas; `git diff` sin restos)
| Id | Qué se mutó | Prueba que se puso roja | Restaurada |
|---|---|---|---|
| M1 | quitar `!esNitExento(…)` de `ticketService.ts:96` | las cuatro `201` con formato, S-2 y las dos de lectura | sí |
| M2 | exención antes de `validarContenidoAltaManual` (`ticketService.ts:91`) | posición «serial distinto» y posición «clientId», y las dos de lectura | sí |
| M3 | quitar `WHERE activo = true` | «fila inactiva: vuelve el 409» | sí |
| M4 | borrar la siembra de `schema.sql` | las `201`, lectura, las cuatro de `nitExentosEsquema.test.ts` y las de distancia de `migrate.test.ts` | sí |
| M5 | quitar `public.` del `CREATE` | «toda tabla del esquema está clasificada» y la de orden relativo de `nitExentosEsquema.test.ts` | sí |
| M6 | `some` por `every` | «con la lista vacía nadie es exento», «fila inactiva» y «lista vacía» | sí |
| M7 | quitar `'nit_exentos'` de `PUBLIC_TABLES` | «toda tabla del esquema está clasificada» y «son 46 tablas» | sí |
Ninguna sobrevivió. Nota de alcance de M2: la guarda de A (`exento sin correo`) no se mueve con esa mutación; la prueba de posición de A es una guarda.

## Desviaciones del diseño
1. Hallazgo nuevo (el diseño §4 trae dos, esto es un tercero): `migrate.test.ts:652` fija el número TOTAL de sentencias tras `idx_prioridad_ajustes`; se editó en sitio (`+ 2` y la frase de `nit_exentos`). El lote 2 tendrá que sumar `+ 1` ahí.
2. Los números de línea del diseño §4 coincidían con el fichero real (`:282-286`, `:794-882`); sin ajuste.
3. La prueba de posición de C usa `clientId` (como pide el diseño); la de la orden de venta ya asociada no es alcanzable con provisional (C `422` gana): ya la fija la prueba existente `un provisional con orden de venta ya usada`.
4. El arnés da error si se llama dos veces a `adminCookie()` en una prueba: el `describe` nuevo la pide una vez en su `beforeEach`.

## Medida y comprobaciones (lote 1)
`wc -l`: `ticketService.ts` 277, `altaManual.ts` 161, `migrate.ts` 131, `migrate.test.ts` 911, `packages/shared/src/index.ts` 40, `schema.sql` 807.
`npm run typecheck` código 0; `npm run lint` código 0 (0 errores, 165 avisos previos). `npm test`: 4291 pasan, 1 falla, 7 omitidas.
La que falla es `registro.test.ts` («en curso» son ONCE): da DOCE porque el proposal de esta tanda, ya commiteado, cuenta como en curso. No es de este lote.

## Para los lotes 2 y 3
Lote 2: tabla `provisional_books_avisados`, lecturas y servicio sin cablear; renumerar de nuevo las siete aserciones y `:652` (`+ 1`); cifras `[10, 34, 3]` y `47`.
Lote 3: pasada, `index.ts:15` y `:88`, `DEPLOY.md`, casos k y l. Decidir quién actualiza `registro.test.ts` («ONCE» a «DOCE») y la cita `altaManual.ts:156` de `openspec/config.yaml:4216`.

## Lote 2 — aviso sin cablear, inerte (casillas 4.1 a 6.2; la 6.3 y la 6.4 las cierra el orquestador)
Modo: strict TDD. `schema.sql` 807 a 818 (sólo por el final); `migrate.ts`, `migrate.test.ts` conservan 131 y 911 líneas (finales CRLF intactos).
Nuevos: `db/provisionalEnBooks.ts` (29), `services/avisoProvisionalEnBooks.ts` (100), su prueba (a a j más cuatro casos de apoyo). Sin `pasadaProvisionalesEnBooks`, sin tocar `index.ts` ni `DEPLOY.md`.

### Rojo → verde
| Prueba | Rojo (motivo) | Verde |
|---|---|---|
| `avisoProvisionalEnBooks.test.ts` entero | módulo `./avisoProvisionalEnBooks` inexistente | sí |
| `nitExentosEsquema.test.ts` (4 nuevas) | tabla inexistente; el `CREATE` no existe | sí |
| `migrate.test.ts`: recuento `47` y `[10, 34, 3]`; `:652` (+1); las siete aserciones por distancia | 5 rojas (recuento, `:652`, `reasignaciones`, `contrato_ampliaciones`, `encuesta_respuestas`) | sí |
Rojo medido: 9 pruebas rojas y 1 fichero sin cargar. Verde: 3 ficheros, 92 pasan.

### Mutaciones (todas restauradas; `git status` sin restos)
| Id | Qué se mutó | Prueba roja | Restaurada |
|---|---|---|---|
| N1 | quitar el `INSERT` de la marca | (a), (b), (c), (f), las tres (h), (i) dos seguidas y concurrentes, (j) | sí |
| N2 interior | quitar `destinatarios.length === 0` de `marcarYAvisarPareja` | (i) «destinatarios vacíos → false, sin marca» | sí |
| N2 exterior | `if (false)` en la guarda de `avisarProvisionalesEnBooks` | (f) «sin destinatarios … UN solo warn» | sí |
| N3 | quitar `enlazado_a IS NULL` | (d) «provisional ya enlazado no avisa» | sí |
| N5 (regla 1) | marca detrás de los avisos | las tres (h), (i) dos seguidas y concurrentes | sí |
| N6 | `crearAviso(db, …)` en vez de `q` | (h) sin fallo y (h) falla un aviso | sí |
| N7 provisional | no descartar provisionales exentos | (e) «sólo el provisional» y (g) «sólo provisionales exentos» | sí |
| N7 contacto | no descartar contactos exentos | (e) «sólo el contacto» | sí |
| N8 | quitar la consulta previa de marcas | (b), (c), (g) «parejas ya avisadas» | sí |
| N9 sin provisionales | quitar su salida corta | (g) «sin provisionales: UNA consulta» | sí |
| N9 todos exentos | quitar su salida corta | (g) «sólo provisionales exentos: dos consultas» | sí |
| N9 sin parejas | quitar `parejas.length === 0` | NINGUNA: SOBREVIVE (ver abajo) | sí |
| N10 PK | cambiar `PRIMARY KEY` por otra cosa | 18 rojas (todo el servicio y las cuatro de esquema) | sí |
| N10 `public.` | quitar `public.` del `CREATE` | guardián «toda tabla … clasificada» y la de `CREATE` calificado | sí |
**N9 sin parejas sobrevive y es EQUIVALENTE:** `parejasYaAvisadas` (`provisionalEnBooks.ts`) ya sale sin consultar con ids vacíos, así que la salida del servicio es redundante con esa. Se añadió la prueba «sin ninguna pareja: tres consultas y NINGUNA a la tabla de marcas»; quitar las DOS guardas a la vez la pone roja. N4 y N11 son del lote 3.

### Desviaciones
1. Cuatro pruebas de apoyo no pedidas por el diseño §7: el texto exacto, el orden por provisional y contacto con nombre nulo (`name ?? id`), la salida sin parejas y las marcas previas. Son baratas y cubren N9 y N8.
2. `contactosDeBooks` aplica `name ?? id` en la lectura (el diseño lo decía para el texto); `ContactoConNit.name` queda `string`, como la firma del §5.
3. El `describe` de `migrate.test.ts:864` ya decía «ya no cierra el esquema»: sin cambio. Se reescribieron los títulos de `:794`, `:837`, `:877` y la cabecera de `:861`.

### Barrido de la regla de mutación 4
El diff de `migrate.ts` y `migrate.test.ts` son hunks de sustitución en la misma línea (`:73`, `:282-286`, `:652`, `:794-798`, `:837-840`, `:861`, `:877-882`); `schema.sql` solo añade `808-818`. No se movió ninguna línea. Ninguna cita `schema.sql:NNN` apunta a `797` o más. Citas ajenas cuyo TEXTO deja de ser cierto sin moverse, no tocadas (caso B, históricas): las de `migrate.test.ts:282-286` en `openspec/changes/archive/` («46 tablas»).

### Para el lote 3
`pasadaProvisionalesEnBooks`, `index.ts:15` y `:88`, `DEPLOY.md`, casos k y l, N4 y N11. Sigue pendiente quién actualiza `registro.test.ts` («ONCE» a «DOCE») y la cita `altaManual.ts:156` de `openspec/config.yaml`.

**Añadido por el orquestador al cerrar el lote 2.** Cuatro mutaciones propias sobre `avisoProvisionalEnBooks.ts`: clave de pareja distinta en el filtro, otra área destinataria y el `23505` relanzado, las tres en rojo; la cuarta, invertir los argumentos de `nitCoincide`, **sobrevivía**. La cierra la prueba «el provisional es el lado tecleado», al final de `avisoProvisionalEnBooks.test.ts`; repetida contra ella, en rojo. Todas restauradas.

## Lote 3 — pasada y despliegue (casillas 7.1 a 9.2; la 9.3 y la 9.4 las cierra el orquestador)
Modo: strict TDD. Rojo medido antes del verde: 4 pruebas rojas (las tres (k) y la (l)), a a j verdes. Verde: 26 pasan en el fichero; con las tres pruebas de texto vecinas (`avisoRitmoContrato.test.ts`, `avisoReclamacionProveedor.test.ts`, `alarmasSla.test.ts`), 4 ficheros y 82 pasan.
Tocados: `avisoProvisionalEnBooks.ts` 100 a 112 (pasada sin cerrojo diario, cabecera actualizada); `avisoProvisionalEnBooks.test.ts` 266 a 316 (caso k en tres pruebas, caso l); `index.ts` 118 a 118 (edición dentro de las líneas 15 y 88, CRLF intacto); `DEPLOY.md` 628 a 661 (apartado al final, CRLF intacto). Sin NIT real ni inventado: el ejemplo de alta lleva el marcador `<NIT que confirme contabilidad>`.

### Mutaciones (todas restauradas; contenido idéntico a la copia previa)
| Id | Qué se mutó | Prueba roja | Restaurada |
|---|---|---|---|
| N4 quitar | quitar `.then(() => pasadaProvisionalesEnBooks(pool))` de `index.ts` | (l) | sí |
| N4 posición (regla 1) | pasada DESPUÉS de `sync.syncRecent()` | (l) | sí |
| N11 por pareja | quitar el `try/catch` de `avisarProvisionalesEnBooks` | (j) | sí |
| N11 pasada | quitar el `try/catch` de `pasadaProvisionalesEnBooks` | (k) «con la base caída resuelve…» | sí |
Ninguna sobrevivió. Aviso: dos ediciones mías con `sed` salieron mal (una reescribió líneas sueltas, otra sólo cambió LF por CRLF); se restauraron desde copia y se rehicieron con `Edit`; no queda resto.

### Barrido de la regla de mutación 4
`index.ts` conserva 118 líneas y `DEPLOY.md` sólo crece por el final (desde su línea 629): ninguna cita a `index.ts:NN` ni a `DEPLOY.md:NN` se desplaza. Las citas `index.ts:88` (`alarmasSla.ts:140`, `avisoReclamacionProveedor.ts:69`, `avisoRitmoContrato.ts:64`, `avisoRitmoContrato.test.ts:15` y `:177`) siguen apuntando a la cadena del `setInterval`; su texto, que habla de «antes de la sincronización», sigue siendo cierto. Citas a `index.ts:15`: sólo las de esta tanda. Históricas que no se tocan (caso B): las de `docs/sdd/Paquete_de_Despliegue_*` a `index.ts:88`, que describen la cadena sin la pasada nueva.

### Códigos
`npm run typecheck` 0; `npm run lint` 0 (0 errores, 165 avisos previos); `npm test`: 262 ficheros pasan, 2 omitidos; 4322 pasan, 7 omitidas, 0 fallan (el `registro.test.ts` del lote 1 ya no falla). Detector de citas y medida del intento: del orquestador. `git diff --shortstat --no-renames` del árbol (sin contar nada de lotes previos commiteados): 4 ficheros, 96 inserciones, 6 borrados.

**Añadido por el orquestador al cerrar el lote 3.** Tres mutaciones propias, las tres en rojo y restauradas: la pasada nueva antes de la de reclamaciones en `index.ts`, la pasada sin esperar a la evaluación, y un cerrojo de una sola vez colado en la pasada.
