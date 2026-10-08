# Apply-progress — `indicadores-51-55` (F1F-05, `cierra: no`)

## Lote 1 · El 51 en `packages/shared` — casillas 1.1 a 1.20 hechas; 1.21 a 1.23 (commit, detector de citas, asentar) las hace el orquestador

Commit de partida del intento: `4773b23`. Worktree `C:\dev\Desk_2_R1.023-worktrees\indicadores-51-55`. Modo: Strict TDD (vitest).

### Tamaños (`wc -l`, casillas 1.1 y 1.17)

| Fichero | Antes | Después | Qué cambió |
|---|---|---|---|
| `packages/shared/src/indicadores.ts` | 251 | 262 | ediciones en sitio hasta la línea 251; **+11 al final** (`TRANSICIONES_DE_ENTREGA` en la 254, `hitoEntrega` en la 257) |
| `apps/desk/server/indicadores.ts` | 93 | 93 | sólo el comentario de la línea 90 |
| `packages/shared/src/indicadores.test.ts` | 330 | 427 | imports en sitio (líneas 1, 3 y 6), líneas 76, 100-114 y 306-315 en sitio, bloque nuevo al final |
| `apps/desk/server/indicadores.test.ts` | 96 | 107 | bloque de integración al final (+11) |

### 1.2 · Revisión sin edición de la reentrancia: **sin cambios**

- `packages/shared/src/reentrancia.ts:78-83`: `INDICADORES_G6` no trae el 51 y **no se le añade** (dato externo de G.8).
- Guardián K14 (`packages/shared/src/indicadores.test.ts:146-151`; **corregido en el lote 4:** el lote 1 escribió aquí «hoy en las líneas 145-150», que era falso, porque el bloque no se movió y sigue en esas mismas líneas 146-151): recorre `INDICADORES_G6`; no exige nada del 51.
- `packages/shared/src/indicadoresComparacion.test.ts:95` (C8), `:128` y `:149` (C15) y `packages/shared/src/indicadoresComparacion.ts:12` construyen los pares con datos sintéticos o enumeran las nueve columnas: ninguno supone que el 51 nunca es comparable (hipótesis 7 del diseño, confirmada por lectura). Nada que editar.

### Pruebas añadidas y rojo previo observado (casillas 1.3 a 1.10)

Corrida del rojo: `npx vitest run packages/shared/src/indicadores.test.ts apps/desk/server/indicadores.test.ts` antes de tocar `indicadores.ts`: **19 rojas de 127**, todas por el motivo esperado (ninguna por sintaxis).

| Prueba (fichero `packages/shared/src/indicadores.test.ts` salvo la última) | Rojo observado |
|---|---|
| Guardián (a): cada id de `TRANSICIONES_DE_ENTREGA` existe | `TypeError: Cannot read properties of undefined (reading 'length')` (la constante no existía) |
| Guardián (b): igualdad de conjuntos con `transicionesQueEscriben` | `TypeError: TRANSICIONES_DE_ENTREGA is not iterable` |
| 51: una `entrega_al_cliente` (3), `entrega_sin_factura` (2), dos entregas (7), filas desordenadas (7), entrega anterior (−2 y `orden_invertido`), borde de Bogotá (3) — seis casos | `expected 'falta el hito: hora del último cambio…' to be 3 / 2 / 7 / −2` |
| Hito de entrega después de la finalización y misma clave que el motivo | `expected [ 'Fecha Finalización ST' ] to deeply equal [ 'Fecha Finalización ST', … ]` |
| Sin fila de entrega aun con `Fecha Remisión de Salida` | `expected 'falta el hito: hora del último…' to be 'falta el hito: transición de entrega'` |
| Con entrega y sin finalización | `… to be 'falta el hito: finalización del servicio'` |
| Sin entrega ni finalización manda el primer motivo (par de posición, regla de mutación 1) | `… to be 'falta el hito: transición de entrega'` |
| Reentrante: mismo id dos veces; `entrega_sin_factura` + `entrega_al_cliente` | `TypeError: Cannot read properties of undefined (reading 'escrituras')` |
| Reentrante con una fila: `false`; sin historial: `null` | **verde de nacimiento** (con la implementación vieja ya daba `false` y `null`: el 51 no tenía hitos de entrega que contar). Su valor es de regresión, no de guía |
| Variante del 51 calculado: `formulaZoho` con el texto de `MOTIVO_H1` | `expected { tipo: 'sin_dato', … } to deeply equal { tipo: 'valor', valor: 3 }` (el valor aún no se calculaba) |
| Variante del 55 `Excelente` → `formulaZoho` igual a la letra | `expected { tipo: 'sin_dato', … } to deeply equal { tipo: 'valor', valor: 'Excelente' }` |
| 55 sin calificación y con `Good` de Zoho → `valorZoho` `Good` | **verde de nacimiento** (cubierto ya por R5; se repite porque RQ-KP-09 lo exige como escenario propio) |
| `horaActualizacionEstado` ya no existe (dos ficheros) | `expected '// Los nueve indicadores…' not to contain` el literal, y la misma aserción sobre `apps/desk/server/indicadores.ts` |
| `apps/desk/server/indicadores.test.ts`, integración con pg-mem y `migrate(db)` | `expected { tipo: 'sin_dato', … } to deeply equal { tipo: 'valor', valor: 3 }` |

Después del verde de `indicadores.ts` quedaron rojas, **por contrato**, cuatro pruebas viejas de las líneas 103-113 (K13, las dos con la entrada opcional y «con la hora y sin finalización»): se editaron **en sitio y después** (casilla 1.11), junto con la línea 76 y el bloque 306-315. Resultado final de los dos ficheros: **126 pruebas, todas verdes**.

### Verde (casillas 1.12 a 1.15)

- `packages/shared/src/indicadores.ts`: ediciones en sitio de la cabecera (línea 2), `:45-48`, `:86` (`MARCA_ENTREGA`), `:133` (el hito se engancha en la misma línea que el del 49), `:228-232` (el cierre `v51`; **la línea `const fin = resolverHito(…)` de la 228 original desaparece** —queda sin uso— y el cierre ocupa las líneas 228 a 232), `:241` y `:246`. `MOTIVO_H1` y `v55` no cambian. `:134` (citada por `apps/desk/server/migracionMarcadorLectores.test.ts:58` y `docs/sdd/ENTRADA.md:2078`) no se movió ni cambió.
- Al final: `TRANSICIONES_DE_ENTREGA` (línea 254) y `hitoEntrega` (línea 257). El fichero crece **+11 líneas, todas al final**.
- `apps/desk/server/indicadores.ts:90` en `6fcf7e9`: el comentario ya no nombra la entrada; sigue en 93 líneas (afirmación del lote 1; el lote 3 añadió tres líneas y hoy ese comentario es la línea 93).
- **Hipótesis 6 del diseño, resuelta:** `hitoEntrega` se usa en `hitosDe` (línea 133) y se declara más abajo (línea 257); `npm run lint` da 165 avisos y 0 errores. El respaldo (declararla en la 128) **no** hizo falta.
- **Decisión de edición:** el comentario de la línea 90 de `apps/desk/server/indicadores.ts` dice ahora «El 51 sale del historial; el 55 queda sin dato mientras la lectura no aporte la calificación (RQ-KP-22)». Es cierto hasta el lote 3 y lo reescribe ese lote al añadir la cuarta consulta.

### Mutaciones (casilla 1.16): todas rojas, restauradas

Cada una se aplicó sobre el fichero, se corrió `npx vitest run packages/shared/src/indicadores.test.ts apps/desk/server/indicadores.test.ts` y se restauró el original desde copia en memoria (`git status` posterior sólo muestra los ficheros del lote; `packages/shared/src/transitions.ts` sin diff).

| Mutación | Rojas | La caza |
|---|---|---|
| M5 permutar las dos comprobaciones de ausencia de `v51` | 1 | «sin entrega ni finalización manda el primer motivo» |
| M12a renombrar `entrega_al_cliente` en `transitions.ts` | 2 | guardián (a) y guardián (b) |
| M12b dar `Fecha Remisión de Salida` a `diagnostico_complementario` | 1 | guardián (b) |
| M13a quitar `entrega_sin_factura` de la constante | 3 | guardián (b); «una entrega_sin_factura»; «entrega_sin_factura y entrega_al_cliente» |
| M13b añadir un id inventado | 2 | guardián (a) y (b) |
| M19 `hitoEntrega` toma la primera entrega | 4 | «dos entregas», «filas desordenadas» y las dos de reentrante |
| M20 caer en `Fecha Remisión de Salida` sin fila de entrega | 1 | «con finalización y Fecha Remisión de Salida pero sin fila de entrega» |
| M21 invertir el signo | 12 | los seis casos del 51, los del bloque editado, la variante y la integración (entre ellas «una entrega» y «entrega anterior») |
| M22 día en UTC (`slice(0, 10)`) | 2 | el borde `2027-01-09T03:00:00Z` (dos veces: bloque nuevo y bloque editado) |

Ninguna sobrevivió; no hizo falta añadir pruebas.

### Cierre (casillas 1.17 a 1.19)

- `grep -rn "horaActualizacionEstado" apps packages --include=*.ts --include=*.tsx`: **sin resultados** (código de salida 1 de `grep`).
- `npm test`: código de salida **0** — 254 ficheros pasan y 2 saltados; **4086 pruebas pasan, 7 saltadas** (4093).
- `npm run typecheck`: código de salida **0**.
- `npm run lint`: código de salida **0** — 165 avisos, 0 errores (no sube).
- Medida (casilla 1.19): ver la línea «Medida» al final de este apartado.

### Barrido de citas, regla de mutación 4 (casilla 1.20)

`grep -rnoE "indicadores\.(test\.)?ts:[0-9]+(-[0-9]+)?"` sobre todo el repositorio (`.ts`, `.tsx`, `.md`, `.yaml`, `.sql`, `.json`; sin `node_modules`): 50 resultados. El patrón mezcla `packages/shared/src/indicadores.ts`, `apps/desk/server/indicadores.ts` y las pruebas homónimas; cada uno se asignó a su fichero leyendo la frase.

- Líneas editadas en sitio de `packages/shared/src/indicadores.ts`: 2, 45-48, 86, 133, 228-232, 241 y 246. **Ninguna cita las nombra** (comprobado con un segundo patrón sobre esas líneas; el único resultado es `indicadores.test.ts:45` del `verify-report.md` archivado de `continuidad-indicadores`, que habla de una prueba de K8 y cae en un tramo del fichero de pruebas que no se movió).
- Citas vivas vigiladas: la línea 134 de `packages/shared/src/indicadores.ts` (`apps/desk/server/migracionMarcadorLectores.test.ts:58`, `docs/sdd/ENTRADA.md:2078`) sigue siendo `reentrante = …`; la línea 76 de `apps/desk/server/indicadores.ts` (`apps/desk/server/migracionMarcadorLectores.test.ts:54`) sigue siendo la consulta del historial. Las que citan las líneas 141, 57-64 y 125 del módulo (ENTRADA 2128, F1B-09) apuntan a líneas que no cambiaron.
- Fichero de pruebas de `packages/shared`: **corregido en el lote 4 con `git diff -U0 42a4828 HEAD`:** las líneas anteriores a la 308 no se mueven (las ediciones de 100-113 son de igual tamaño) y las posteriores a la 312 bajan tres (el bloque del 47 pasa de 5 a 2 líneas); lo que escribió el lote 1 («suben una» y «cuatro más») era inexacto. **No hay ninguna cita viva a esas líneas**: las del archivo son de la prueba de rutas, que no se tocó, o caen en tramos que no se movieron.
- Las citas de `openspec/config.yaml` (líneas 4096 y 4102) a las líneas 88-89 y 58 del módulo describen el estado de partida: **caso B**, se tratan en L4.
- Segundo pase de las abreviadas (sin nombre de fichero, con las líneas editadas) en `docs/`, `openspec/specs/` y `openspec/config.yaml`: sin resultados que hablen de estos ficheros.
- Resultado: **sin citas rotas por este lote**.

### Regla 13 · líneas reales de este lote (alimenta la tabla de `tasks.md`)

- Decisión «qué entrega cuenta para el 51» (fila 6): `TRANSICIONES_DE_ENTREGA` en `packages/shared/src/indicadores.ts:254` y `hitoEntrega` en `packages/shared/src/indicadores.ts:257`; el uso, en `packages/shared/src/indicadores.ts:133`.

**Medida (casilla 1.19):** `git diff --shortstat --no-renames 4773b23` = 5 ficheros, 171 inserciones y 52 borrados (223), más `wc -l` del fichero nuevo sin trackear `openspec/changes/indicadores-51-55/apply-progress.md` (~94, con esta línea) = **~317 líneas**, bajo el techo de 800 (y bajo los 720 de aviso). Sin binarios. El `git diff` ya incluye las 40 líneas de `tasks.md`.

---

## Lote 2a · Almacén, huella y capa de datos — casillas 2.1 a 2.17 hechas; 2.18 a 2.20 (commit, detector de citas, asentar) las hace el orquestador

Commit de partida del intento: `6fcf7e9` (cabeza de la rama con el lote 1 commiteado). Modo: Strict TDD (vitest). Sin `gentle-ai sdd-attempt`, sin commit, sin push.

### Tamaños (`wc -l`, casillas 2.1 y 2.14)

| Fichero | Antes | Después | Qué cambió |
|---|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` | 782 | 796 | **+14 al final** (comentario de cuatro líneas, `CREATE TABLE` en la 787 e índice en la 796); ninguna línea existente se movió |
| `packages/zoho-sync/src/db/migrate.ts` | 131 | 131 | sólo la línea 73, en sitio (`PUBLIC_TABLES` gana `'encuesta_respuestas'`) |
| `packages/zoho-sync/src/db/migrate.test.ts` | 858 | 911 | **+53 al final** (bloque nuevo); guardianes editados en sitio (líneas 282-286, 652, 794, 796, 798, 822, 825, 837, 839 y 840) sin cambiar el número de líneas; las 799 y 841 intactas |
| `apps/desk/server/encuesta/respuesta.ts` | — | 22 | nuevo |
| `apps/desk/server/encuesta/respuesta.test.ts` | — | 47 | nuevo |
| `apps/desk/server/db/encuestaRespuestas.ts` | — | 73 | nuevo |
| `apps/desk/server/db/encuestaRespuestas.test.ts` | — | 148 | nuevo |

Terminadores: todo en CRLF (comprobado contando `\r\n` frente a `\n` con node en los siete ficheros).

### Pruebas añadidas y rojo previo observado (casillas 2.2 a 2.6)

Corrida del rojo: `npx vitest run packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/encuesta/respuesta.test.ts apps/desk/server/db/encuestaRespuestas.test.ts` con las pruebas escritas y los guardianes editados, antes de tocar `schema.sql`: **9 rojas de 64** en `migrate.test.ts` y **dos ficheros que no cargan** (los módulos no existían). Todas por el motivo esperado.

| Prueba | Rojo observado |
|---|---|
| Guardián de recuento (`son 45 tablas …`) | `expected [ 10, 31, 3 ] to deeply equal [ 10, 32, 3 ]` |
| Guardián de posición de F1A-03 (suma `… + 2 + 2`, línea 652) | la suma esperada pasa a tener dos sentencias más que el esquema |
| `reasignaciones` séptima y sexta por el final (794-798) | `expected 'CREATE UNIQUE INDEX IF NOT EXISTS idx…' to match /^CREATE TABLE IF NOT EXISTS public\.r…/` |
| `contrato_ampliaciones` cuarta y tercera por el final (837-840) | falla la posición (hoy es penúltima y última) |
| Bloque nuevo (5 pruebas: tabla existe y vacía; `CREATE` penúltimo e índice último con las siete columnas y sin `canal`; rechazos de nulos y de calificación vacía; `23505` y dos filas del mismo ticket; `PUBLIC_TABLES` la contiene) | la tabla no existe / la sentencia no está / el nombre no está en la lista |
| `respuesta.test.ts` (8) y `encuestaRespuestas.test.ts` (12) | `Failed to load url ./respuesta` y `./encuestaRespuestas` (los módulos no existían) |

**Guardián de clasificación** (`packages/zoho-sync/src/db/migrate.test.ts:266-275`): con las pruebas editadas pasaba (la tabla aún no estaba en el `.sql`). Se vio **rojo** en el orden del diseño: después de añadir el `CREATE` a `schema.sql` y **antes** de tocar `PUBLIC_TABLES` (4 rojas: clasificación, recuento, el bloque nuevo —con un bug de escritura mío en una expresión regular, ver «Incidencias»— y `PUBLIC_TABLES la contiene`). Al añadir el nombre a `migrate.ts:73`: 64 de 64 verdes.

Resultado verde de los tres ficheros: **84 pruebas pasan**, luego **85** al añadir la prueba de la red `ON CONFLICT` (abajo).

### Hipótesis de pg-mem (casilla 2.11)

1. **`ON CONFLICT (huella) DO NOTHING` sobre un `UNIQUE` que no es clave primaria: pg-mem lo acepta y lo cumple.** Prueba: `apps/desk/server/db/encuestaRespuestas.test.ts`, «la red de la base», un `INSERT` de dos filas con la misma huella deja **una** fila. Además, la mutación M8 (quitar `UNIQUE`) hace que pg-mem **rechace** el `ON CONFLICT (huella)` (11 rojas), lo que confirma que la cláusula depende de la restricción. Respaldo del diseño **no aplicado**.
2. **`INSERT … VALUES (…),(…)` de varias filas con parámetros: pg-mem lo acepta** (20 filas en un solo `INSERT`, 100 parámetros; y 5 filas en tres bloques con `trozo = 2`). Respaldo **no aplicado**.
3. **`IN ($1,…)` con marcadores en vez de `= ANY`: funciona** en las dos lecturas (tickets por número y huellas), con el molde de `sla.ts`. Sin tercer camino.

La prueba de la red es **verde de nacimiento** (pasaba con la implementación ya escrita): su valor es documentar las hipótesis 1 y 2, no guiar el código.

### Verde (casillas 2.7 a 2.10, 2.12)

- `schema.sql`: comentario sin punto y coma ni tildes, `CREATE TABLE IF NOT EXISTS public.encuesta_respuestas` (`packages/zoho-sync/src/db/schema.sql:787`, `UNIQUE` de `huella` en la 792) e índice (la 796), literales del diseño §4.
- `migrate.ts:73`: `'encuesta_respuestas'` detrás de `'contrato_ampliaciones'`; el fichero sigue en 131 líneas.
- `apps/desk/server/encuesta/respuesta.ts`: `FilaEncuesta`, `FilaRechazada` y `huellaRespuesta` (línea 18).
- `apps/desk/server/db/encuestaRespuestas.ts`: `MOTIVO_TICKET_INEXISTENTE`, `ResultadoCarga` y `cargarRespuestas` en `enTransaccion`, con `IN` por bloques, huellas presentes leídas antes e `insertadas` contada en memoria; `ON CONFLICT (huella) DO NOTHING` de red. Los pasos 2 y 3 (ticket inexistente y duplicada dentro del fichero) están en `apps/desk/server/db/encuestaRespuestas.ts:41-52`; el 4 (huellas presentes) en `:54-61`; el 5 (`INSERT`) desde `:63`.
- Con `filas` vacío no abre transacción ni toca la base (la prueba lo exige: sin sentencias).

### Mutaciones (casilla 2.13): todas rojas, restauradas

Cada una se aplicó con un script que sustituye un fragmento único del fichero, corre los tres ficheros de prueba y **restaura el original** desde copia en memoria antes de salir (la restauración se comprobó después: `git status` sólo muestra los ficheros del lote y la corrida completa da `npm test` en 0).

| Mutación | Rojas | La caza |
|---|---|---|
| M7 quitar `public.` del `CREATE` (fichero vigilado, regla 2) | 2 | guardián de clasificación (`toda tabla del esquema está clasificada…`) y el `CREATE` calificado del bloque nuevo |
| M8 quitar `UNIQUE` de `huella` | 11 | el `23505` del bloque nuevo y diez de la capa de datos (pg-mem rechaza el `ON CONFLICT (huella)` sin la restricción) |
| M9a-e quitar el `NOT NULL` de `ticket_id`, `calificacion`, `respondida_at`, `huella` y `cargado_por` (cinco mutaciones aparte) | 1 cada una | «la base rechaza … nulos» |
| M9f quitar el `CHECK` de `calificacion` | 1 | la misma prueba (el caso `calificacion` vacía) |
| M10 mover el bloque nuevo delante del de `contrato_ampliaciones` | 2 | posición de `contrato_ampliaciones` (cuarta y tercera por el final) y posición del bloque nuevo (penúltima y última). Las de `reasignaciones` (794-798) **no** se mueven con esa permutación (`reasignaciones` queda detrás de ambos): el diseño las nombraba de más |
| M11 quitar `'encuesta_respuestas'` de `PUBLIC_TABLES` | 3 | clasificación, recuento (`32`) y `PUBLIC_TABLES la contiene` |
| M14a quitar el ticket de la huella | 4 | «cada campo cuenta», la fórmula de la spec y las dos de 20 filas / `trozo = 2` (las huellas colisionan) |
| M14b quitar la calificación | 3 | «cada campo cuenta», «no pliega mayúsculas» y la fórmula |
| M14c quitar el instante | 2 | «cada campo cuenta» y la fórmula |
| M15 meter `cargadoPor` y la fila en la huella | 2 | «no admite en su firma lo que no es contenido» y la fórmula |
| M23 quitar el filtro de huellas ya presentes | 2 | la recarga (`insertadas` dejaría de ser 0) y la recarga por otra persona |
| M24 una consulta de ticket por fila | 2 | el recuento de sentencias con 20 filas y el de `trozo = 2` |

Supervivientes: **ninguno**. Dos precisiones: (a) la parte de M15 «la recarga con otro usuario» no se puede mutar en la capa de datos, porque la huella llega ya calculada en la fila y `cargarRespuestas` no la calcula; la caza M15 la hace la prueba de la firma, y la recarga por otra persona queda cubierta por M23; (b) para M9 se mutó cada `NOT NULL` por separado, porque una prueba que enumera los cinco rechazos no distingue cuál sostiene la mutación conjunta.

### Incidencias de escritura (sin efecto en el código final)

- Una expresión regular del bloque nuevo de `migrate.test.ts` (la que comprueba que cada columna está en el `CREATE`, dentro de una plantilla) se escribió con una sola barra invertida, que en una plantilla es el carácter de retroceso; la prueba salió roja por mi escritura, no por el esquema, y se corrigió antes del verde. No cambia el código final.

### Cierre (casillas 2.14 a 2.16)

- `npm test`: código de salida **0** — 256 ficheros pasan y 2 saltados; **4112 pruebas pasan, 7 saltadas** (4119); el lote 1 dejaba 4086, +26 de este lote (5 de `migrate.test.ts`, 8 de `respuesta.test.ts`, 13 de `encuestaRespuestas.test.ts`).
- `npm run typecheck`: código de salida **0**.
- `npm run lint`: código de salida **0** — 165 avisos, 0 errores (no sube).

### Barrido de citas, regla de mutación 4 (casilla 2.17)

Barrido de `schema.sql`, `migrate.ts` y `migrate.test.ts` con número de línea sobre todo el worktree (sin `node_modules`, `.git`, `.codegraph` ni `dist`): 1.061 resultados, filtrados por las líneas que tocó el lote.

- **Ninguna línea se desplazó:** `schema.sql` sólo creció al final (las 782 anteriores son idénticas), `migrate.ts` conserva sus 131 líneas y `migrate.test.ts` sólo creció al final. No hay cita viva a un tramo movido.
- **Cambia de contenido sin moverse:** la línea 73 de `migrate.ts` (las citas de `migrate.ts:70-73` de `openspec/specs/zoho-sync/spec.md:765`, `tickets-core/spec.md:1441`, `remisiones/spec.md:857` y `gases-patron/spec.md:56` apuntan a la lista de `PUBLIC_TABLES`, que sigue ahí: ciertas); y las líneas 282-286, 652, 794-798 y 837-840 de `migrate.test.ts` (las citas de `openspec/changes/archive/` a sus contadores y posiciones son de su momento: caso B/histórico, no se renumeran; `openspec/specs/gases-patron/spec.md:198` ya nombra su revisión `f5255d2`: caso B, no se reescribe).
- `DEPLOY.md:530` cita la 768 de `schema.sql` (la siembra de `catalogo_novedades`) y `DEPLOY.md:566` la 773 (el `CREATE` de `contrato_ampliaciones`): las dos líneas son las mismas.
- Las citas a la línea 782 de `schema.sql` (`archive-report.md` y `verify-report.md` de `ampliacion-contrato`) la describen como el índice de `contrato_ampliaciones`: sigue siéndolo; lo que cambia es que ya no es la última del fichero (afirmación histórica, no se toca).
- Segundo pase de las abreviadas (sin nombre de fichero) en los ficheros que ya citan estos módulos: ninguna habla de las líneas tocadas.
- Resultado: **sin citas rotas por este lote**. El detector `citas/cli.ts` lo corre el orquestador tras el commit (2.19).

### Regla 13 · líneas reales de este lote (alimenta la tabla de `tasks.md`)

- Fila 3 («qué fila se rechaza»), la parte de la base: `apps/desk/server/db/encuestaRespuestas.ts:41-52` (ticket inexistente y duplicada dentro del fichero) y la comprobación de huellas ya presentes en `apps/desk/server/db/encuestaRespuestas.ts:54-61`.
- Fila 4 («qué cuenta como duplicado»): `huellaRespuesta` en `apps/desk/server/encuesta/respuesta.ts:18` y la restricción `UNIQUE` de `huella` en `packages/zoho-sync/src/db/schema.sql:792`.

**Medida (casilla 2.16):** `git diff --shortstat --no-renames 6fcf7e9` = 5 ficheros, 200 inserciones y 32 borrados (232; ya incluye las 28 de `tasks.md` y las 101 de este apartado), más `wc -l` de los cuatro ficheros nuevos sin trackear (22 + 47 + 73 + 148 = 290) = **~522 líneas** (~526 con esta línea), bajo el techo de 800 y bajo los 720 de aviso. Sin binarios.

---

## Lote 2b · Analizador del fichero — casillas 3.1 a 3.15 hechas; 3.16 a 3.18 (commit, detector de citas, asentar) las hace el orquestador

Commit de partida del intento: `879d1d0` (cabeza de la rama con los lotes 1 y 2a commiteados). Modo: Strict TDD (vitest). Sin `gentle-ai sdd-attempt`, sin commit, sin push. Todo el formato es el SUPUESTO S-E; la cabecera del módulo lo dice.

### Tamaños (`wc -l`, casillas 3.1 y 3.12)

| Fichero | Antes | Después | Qué cambió |
|---|---|---|---|
| `packages/shared/src/calendarioLaboral.ts` | 204 | 204 | sólo la línea 155, en sitio (`export function instanteDeJornada`); el fichero conserva sus terminadores (LF) |
| `apps/desk/server/encuesta/analizarRespuestas.ts` | — | 183 | nuevo |
| `apps/desk/server/encuesta/analizarRespuestas.test.ts` | — | 276 | nuevo (37 pruebas) |

Terminadores: los dos ficheros nuevos en CRLF (comprobado contando `\r\n` frente a `\n`: 183/183 y 276/276). `calendarioLaboral.ts` y `tasks.md` están en LF en esta copia de trabajo y se dejaron como estaban (la edición no cambia el terminador).

### Pruebas añadidas y rojo previo observado (casillas 3.2 a 3.6)

Rojo previo: con la prueba escrita y **antes** de crear el módulo, `npx vitest run apps/desk/server/encuesta/analizarRespuestas.test.ts` dio `Failed to load url ./analizarRespuestas` (el módulo no existía; ningún test llegó a correr), el mismo tipo de rojo que el lote 2a. Las 37 pruebas se agrupan en: formato del texto (8), cabecera (7), filas y motivos (9), marca de tiempo (7), `decodificarFichero` (4) y pureza (2).

Primer verde: 41 de 45 en `apps/desk/server/encuesta` (4 rojas por una causa real, abajo, y por una prueba mal escrita mía: el encabezado de la prueba del BOM llevaba «GMT» y no se reconocía como marca; se reescribió con `"Marca; temporal"`, que además hace que el BOM sea **observable**: sin descartarlo, la comilla no abre y el separador de dentro parte la columna). Resultado final de los dos ficheros: **45 pruebas, todas verdes** (8 de `respuesta.test.ts` y 37 nuevas).

### Hallazgo: `instanteDeJornada` se equivoca un día entero con las horas 0 a 4

Visto en rojo por la prueba «fecha sin hora» (daba `2027-01-11T05:00Z` para el 12/01) y por la propiedad de `diaEnZona` (`2027-01-01 00:00` daba el 31/12). `packages/shared/src/calendarioLaboral.ts:155-166`: aproxima la hora deseada como UTC, la formatea en Bogotá y resta; para las horas 0 a 4 esa lectura cae el día anterior y la diferencia (`:164`) no contempla el cambio de día, así que el instante sale 24 h antes. Hoy nadie lo sufre porque sus llamadores usan 08:00 y 17:00. **Decisión (supuesto reversible):** no se toca la función (la tanda sólo la exporta); el analizador la usa para MEDIR el desplazamiento del día a mediodía (`instanteDeJornada(dia, 12)` menos el mediodía en UTC), donde no hay vuelta, y lo aplica a cualquier hora. Sigue siendo la misma noción de zona del dominio, sin desplazamiento escrito aparte. Queda anotado como hallazgo para quien decida el alcance (es un desvío de `calendarioLaboral.ts`, no de esta tanda).

### Hipótesis 5 (`TextDecoder` con `windows-1252`): resuelta, sin respaldo

La prueba «el TextDecoder del entorno conoce windows-1252» (`0x80, 0xf3` → `€ó`) pasa: el Node de esta máquina lo conoce. El respaldo `latin1` de `Buffer` **está escrito** en `decodificarFichero` (se usa si el constructor lanza) pero **no se ejercita**: no hay forma de probarlo sin simular un entorno sin ICU completo. Hipótesis (de despliegue): el Node del despliegue es el mismo; si no conociera la etiqueta, el respaldo cubre las letras con tilde pero no `€` ni las comillas tipográficas (0x80-0x9F).

### Verde (casillas 3.7 a 3.10)

- `calendarioLaboral.ts:155`: una palabra. El fichero sigue en 204 líneas.
- `analizarRespuestas.ts`: `MOTIVOS_FILA`, `ERRORES_CABECERA`, `AnalisisEncuesta`, `decodificarFichero`, el lector RFC 4180 (`leerRegistros`), el separador (`elegirSeparador`), las columnas (`COLUMNAS`, `candidatas`), el ticket (`leerTicket`), la marca (`leerMarca`) y `analizarRespuestasEncuesta`.
- Decisiones de lectura donde el diseño no decía: (a) la fila es el ordinal del registro **contando las líneas en blanco** (la primera de datos es la 2 si la cabecera es el primer registro), para que el número coincida con la posición en el fichero; las blancas no cuentan en `leidas`; (b) ticket `0` es «no reconocible» (entero positivo); (c) un sinónimo exacto gana a la coincidencia por palabra (una columna `Ticket` y otra `Comentario sobre la satisfacción` no son ambiguas); (d) se comprueban primero las que **faltan** y después la ambigüedad; (e) la validez de la fecha se comprueba por ida y vuelta de `Date.UTC` (el mes y el día desbordados cambian el mes), sin comprobar rangos aparte: dos comprobaciones redundantes se quitaron tras verse que su mutación sobrevivía.

### Mutaciones (casilla 3.11): todas rojas, restauradas

Cada una se aplicó con un script que sustituye un fragmento único, corre `analizarRespuestas.test.ts` y restaura el original (comprobado con `cmp`).

| Mutación | Rojas | La caza |
|---|---|---|
| M6 calificación antes que el ticket | 1 | «un motivo por fila, en el orden ticket, marca, calificación» |
| M6b (propia) calificación antes que la marca | 1 | la misma |
| M25 marca sin zona leída como UTC | 7 | «sin zona es hora de pared de Bogotá», «DD/MM/AAAA», sufijos, «fecha sin hora», la propiedad de `diaEnZona`, la huella y «columnas por nombre» |
| Mes primero en `DD/MM/AAAA` | 4 | «DD/MM/AAAA: el día va primero», sufijos, «fecha sin hora» y la propiedad |
| No tolerar el BOM | 1 | «el BOM se descarta antes de leer» |
| Contar la cabecera como fila 0 | 6 | «una fila mala… la 3», ticket, orden del motivo, marca ausente, fila corta y líneas en blanco |
| Empate de separadores a favor de `;` | 1 | «empate de separadores: gana la coma» |
| `p. m.` sin sumar 12 | 1 | «sufijos a. m. / p. m. / AM / PM» |
| Ticket `0` válido | 1 | «ticket: vacío, no numérico, …» |
| El sinónimo exacto deja de ganar a la palabra | 1 | «el sinónimo exacto gana a la palabra» |
| `leidas` cuenta las líneas en blanco | 1 | «una línea en blanco… no cuenta» |
| Signo de la zona escrita invertido | 1 | «con zona escrita se usa esa zona» |
| No colapsar los espacios de la calificación | 2 | «comillas…» y «la calificación se guarda recortada» |
| Aceptar fecha inexistente (quitar la ida y vuelta) | 1 | «ilegible: fecha inexistente…» (con la ida y vuelta quitada también falla «DD/MM/AAAA» por el mes 13) |

Supervivientes: **ninguno**. Dos mutaciones se declararon **equivalentes** y se eliminó el código redundante en vez de añadir pruebas: comparar el día (`getUTCDate`) y comprobar el rango del mes sobraban, porque el desborde de cualquiera de los dos cambia el mes tras `Date.UTC`.

### Cierre (casillas 3.13 y 3.14)

- `npm test`: código de salida **0** — 257 ficheros pasan y 2 saltados; **4149 pruebas pasan, 7 saltadas** (4156); el lote 2a dejaba 4112, +37 de este lote.
- `npm run typecheck`: código de salida **0**.
- `npm run lint`: código de salida **0** — 165 avisos, 0 errores (no sube).

### Barrido de citas, regla de mutación 4 (casilla 3.15)

`grep -rnoE "calendarioLaboral(\.test)?\.ts:[0-9]+(-[0-9]+)?"` sobre todo el worktree: 42 resultados. Sólo cambió **una palabra** de la línea 155 y ningún fichero ganó ni perdió líneas, así que no se desplaza ninguna cita. Ninguna cita nombra la línea 155 salvo `design.md:222` de este cambio (la instrucción de la edición, cierta). Las del tramo `:147-149` (`design.md:31`, `tasks.md:121` y `:135`) siguen siendo ciertas: ese tramo no se tocó. Las demás son de paquetes y cambios archivados que apuntan a otras líneas del fichero (13-14, 66, 108, 134-137, 139, 150, 174, 185, 196) que no cambiaron. Segundo pase de las abreviadas (menciones de `instanteDeJornada`): sin citas con número de línea fuera de las ya dichas. Resultado: **sin citas rotas por este lote**.

### Regla 13 · líneas reales de este lote (alimenta la tabla de `tasks.md`)

- Fila 3 («qué fila se rechaza»), la parte del analizador: el orden ticket, marca, calificación está en `apps/desk/server/encuesta/analizarRespuestas.ts:173-179`, fijado por pares de posición en `apps/desk/server/encuesta/analizarRespuestas.test.ts` («un motivo por fila, en el orden…»).

**Medida (casilla 3.14):** `git diff --shortstat --no-renames 879d1d0` = 3 ficheros, 91 inserciones y 16 borrados (107; ya incluye las 15 casillas de `tasks.md` y esta sección de `apply-progress.md`), más `wc -l` de los dos ficheros nuevos sin trackear (183 + 276 = 459) = **566 líneas**, bajo el techo de 800 y bajo los 720 de aviso. Sin binarios.

---

## Lote 3 · Ruta de carga y cuarta consulta de la lectura — casillas 4.1 a 4.17 hechas; 4.18 a 4.20 (commit, detector de citas, asentar) las hace el orquestador

Commit de partida del intento: `8abf407` (cabeza de la rama con los lotes 1, 2a y 2b commiteados). Modo: Strict TDD (vitest). Sin `gentle-ai sdd-attempt`, sin commit, sin push. Terminadores: los dos ficheros nuevos en CRLF y los editados conservan el CRLF que tenían (`file` los da con CRLF; el índice de git los normaliza a LF por `autocrlf`).

### Tamaños (`wc -l`, casillas 4.1 y 4.14)

| Fichero | Antes | Después | Qué cambió |
|---|---|---|---|
| `apps/desk/server/app.ts` | 96 | 96 | sólo las líneas 22 y 61, en sitio (`import` y registro de `registerEncuestaRespuestasRoutes`); **no se insertó ninguna línea** |
| `apps/desk/server/indicadores.ts` | 93 | 96 | **+3** (la cuarta consulta, líneas 85-87, tras la 84); la línea 76 no se movió; ediciones en sitio en las líneas 5, 43 y 51-55 (el comentario sigue ocupando 51-55) y, ya desplazadas, la 88 (`return`) y la 93 y 95 (comentario y opción) |
| `apps/desk/server/indicadores.test.ts` | 107 | 183 | ediciones en sitio (líneas 6, 53, 58 y 78) y bloque nuevo al final (+76) |
| `apps/desk/server/routes/indicadores.test.ts` | 193 | 241 | ediciones en sitio (líneas 13, 183, 186 y 190) y bloque nuevo al final (+48) |
| `apps/desk/server/routes/encuestaRespuestas.ts` | — | 28 | nuevo |
| `apps/desk/server/routes/encuestaRespuestas.test.ts` | — | 262 | nuevo (26 pruebas) |

No se tocó `apps/desk/src`, `ticketService.ts`, `remision.ts`, `transitions.ts` ni `bodegaje.ts` (`git status` sólo lista los seis ficheros de arriba más `tasks.md` y este documento).

### Pruebas añadidas y rojo previo observado (casillas 4.2 a 4.6)

Para ver el rojo POR COMPORTAMIENTO y no por «el módulo no carga», se creó antes un esqueleto de `apps/desk/server/routes/encuestaRespuestas.ts` (sólo `MENSAJE_SIN_FICHERO` y un registro vacío). Rojo: `npx vitest run apps/desk/server/routes/encuestaRespuestas.test.ts` dio **26 rojas de 26, todas `expected 404 to be …`** (la ruta no existía; el `/api` de respaldo de `app.ts` dice 404). Rojo de la lectura: `npx vitest run apps/desk/server/indicadores.test.ts apps/desk/server/routes/indicadores.test.ts` dio **8 rojas de 52**:

| Prueba | Rojo observado |
|---|---|
| Ruta: las 26 (cuerpo de la carga, escalera con espía, RQ-KP-18) | `expected 404 to be 200/401/403/400/413` |
| `indicadores.test.ts` · dos respuestas (Regular el 10, Excelente el 12) | `expected { tipo: 'sin_dato', … } to deeply equal { tipo: 'valor', valor: 'Excelente' }` |
| · se carga primero la más reciente (la reciente con el `id` menor) | la misma |
| · desempate por `id` (el 9 insertado antes que el 7, misma `respondida_at`) | la misma |
| · ticket de otro periodo (dentro del margen de un día y lejos) | `TypeError: Cannot read properties of undefined (reading 'keys')` (aún no había `calificaciones`) |
| · la cuarta consulta se acota por el periodo (mismo `JOIN`, mismos parámetros) | `expected [ …(3) ] to have a length of 4 but got 3` |
| · veinte tickets, algunos con respuestas: cuatro consultas, todas `SELECT` | `TypeError: … (reading 'size')` |
| `routes/indicadores.test.ts` · dos respuestas → el 55 vale `Excelente` | `expected { columna: '55', valor: null, … } to match object` |
| · veinte tickets: cuatro lecturas de datos, en JSON y en CSV | `expected [ …(3) ] to have a length of 4 but got 3` |

**Verdes de nacimiento** (con la implementación vieja ya pasaban; valor de regresión): sin respuesta → «falta el hito: satisfacción del cliente» (dos ficheros), el `GET` no escribe (filas antes y después iguales y toda sentencia `SELECT`) y el ticket fuera del periodo por la ruta. Después del verde quedaron rojas, **por contrato**, las que contaban tres: se editaron **en sitio y después** (casilla 4.10): `indicadores.test.ts:6`, `:53` («cuatro»), `:58` (`toHaveLength(4)`) y `:78` (el doble devuelve `[]` también a la consulta que nombra `encuesta_respuestas`); `routes/indicadores.test.ts:13` (la expresión `DATOS` gana `encuesta_respuestas`: la consulta nueva dice `JOIN tickets`, no `FROM tickets`), `:183` (`toBeGreaterThan(4)`), `:186` y `:190` (cuatro lecturas).

### Hipótesis (casillas 4.3, 4.5 y 4.11)

3. **Orden de filas empatadas en pg-mem: CONFIRMADA.** Con el `id` 9 insertado antes que el 7 y la misma `respondida_at`, pg-mem devuelve las empatadas en orden de inserción; quitar `e.id` del `ORDER BY` (M17) pone rojo el desempate. El respaldo del diseño **no hizo falta**.
4. **Fichero de cero bytes: llega como `req.file` con tamaño 0**, no como fichero ausente. Lo demuestra M4a: quitar la guarda `!req.file` sólo pone roja la prueba «sin fichero» y la de cero bytes sigue verde, así que ésta no pasa por esa rama. La respuesta es `400` con `{ error }` (la del analizador).
8. **Falla lo previsto, y el diseño no escribió respaldo:** con el fichero de más de 10 MB, el `401` y el `403` del servidor (que no lee el cuerpo) cierran el socket y **supertest da `ECONNRESET`** en vez de entregar la respuesta (dos pruebas rojas al primer verde). Se resolvió con un auxiliar de la prueba, `estadoSobreElLimite` (`apps/desk/server/routes/encuestaRespuestas.test.ts`), que hace el `POST` multipart con `node:http` y se queda con el estado de la respuesta, ignorando el error de socket que llega DESPUÉS de haberla recibido. Los ficheros pequeños y el `413` del administrador (que el servidor sí lee) pasan por supertest. Supuesto reversible, anotado: el 401/403 con fichero grande se prueba por `node:http`.

### Verde (casillas 4.7 a 4.9, 4.11)

- `apps/desk/server/routes/encuestaRespuestas.ts`: `requireAuth(db)` → `requireAdmin` → `subida.single('file')` → manejador, en una sola línea (la 19); el manejador comprueba `!req.file`, luego el analizador y luego `cargarRespuestas(db, a.filas, req.user!.name)`; `rechazadas` es la unión de las del analizador y las de la capa de datos, ordenada por `fila`; del cuerpo no se lee nada.
- `apps/desk/server/app.ts`: la línea 22 gana al final el `import` y la 61 gana `; registerEncuestaRespuestasRoutes(app, { db })`. Sigue en 96 líneas. Sin interruptor: `.env.example` no cambia.
- `apps/desk/server/indicadores.ts`: la cuarta consulta (líneas 85-87) con el mismo `JOIN` y `donde` que la del historial, `vistos.has` y `ORDER BY e.respondida_at, e.id`; `EntradasIndicadores` gana `calificaciones` y `tablaIndicadores` pasa `calificacionSatisfaccion: e.calificaciones.get(t.id) ?? null`. El comentario de la antigua línea 90 (hoy la 93) ya no dice que el 55 queda sin dato.
- Resultado: `npx vitest run apps/desk/server/routes apps/desk/server/indicadores.test.ts apps/desk/server/encuesta apps/desk/server/db` dio **51 ficheros y 822 pruebas, todas verdes**.

### Mutaciones (casilla 4.13): todas rojas salvo una declarada equivalente; restauradas

Cada una se aplicó con un script que sustituye un fragmento único, corre los tres ficheros de prueba y restaura el original desde copia en memoria antes de salir.

| Mutación | Rojas | La caza |
|---|---|---|
| M1 `subida.single` delante de `requireAdmin` | 2 | los pares «403 ↔ multer» (fichero en `intruso`) y «403 ↔ 413» |
| M2 `subida.single` delante de `requireAuth` | 4 | los pares «401 ↔ multer» y «401 ↔ 413», y los dos de 403 (multer también corre antes de la sesión) |
| M3 `requireAdmin` delante de `requireAuth` | 20 | todas las de 401 (daría `403`) y las de la carga (sin `req.user` ni administrador) |
| M4a quitar la guarda `!req.file` | 1 | «administrador sin fichero: 400 con MENSAJE_SIN_FICHERO» |
| M4b quitar la guarda `!a.ok` | 3 | cero bytes, cabecera irreconocible y «el fichero malo gana a la carga» |
| M16 `ORDER BY … DESC` (toma la primera) | 3 | «dos respuestas» y «se carga primero la más reciente», y la de la ruta |
| M17 quitar `e.id` del `ORDER BY` | 1 | «desempate por id» con inserción en orden inverso |
| M18a quitar `if (vistos.has(id))` | 1 | «la respuesta de un ticket de otro periodo» (el ticket `borde`, dentro del margen de un día, entra en `calificaciones`) |
| M18b quitar el `JOIN` con el periodo (y los parámetros) | 1 | «la cuarta consulta se acota por el periodo» (texto del `JOIN` y parámetros iguales a los del historial) |
| M26 `cargado_por` leído del cuerpo | 1 | «el actor sale de la sesión» |

- **M4c (cargar ANTES de comprobar `!req.file` o `!a.ok`): equivalente, no cazable por el espía.** Con un fichero ausente o rechazado no hay filas que cargar: `cargarRespuestas` con `filas` vacío no toca la base (`apps/desk/server/db/encuestaRespuestas.ts:32`), así que el orden entre la carga y esas dos guardas no deja rastro. Lo que sí protegen las pruebas son las guardas mismas (M4a y M4b) y que el fichero malo acabe en `400` y no en `500`. El diseño preveía que el espía viera la tabla; no la ve, porque no hay filas.
- **M18b: el `JOIN` solo no se distingue por la salida**, porque `vistos.has` recorta igual; por eso la prueba compara el texto de la consulta y los parámetros. Es una prueba de forma, declarada como tal: la propiedad que protege (no traer de la base respuestas de todo el histórico) no se puede observar con pg-mem.
- Supervivientes reales: **ninguno**.

### Cierre (casillas 4.14 a 4.16)

- `npm test`: código de salida **0**, 258 ficheros pasan y 2 saltados; **4187 pruebas pasan, 7 saltadas** (4194); el lote 2b dejaba 4149, +38 de este lote.
- `npm run typecheck`: código de salida **0** (la primera pasada dio 2 errores de tipo en la prueba nueva, porque `sinPeriodo` infiere `null`; corregidos con el tipo del parámetro).
- `npm run lint`: código de salida **0**, 165 avisos y 0 errores (no sube).
- `grep` de `DELETE FROM` o `UPDATE` sobre `encuesta_respuestas` en `apps/` y `packages/` fuera de pruebas: **sin resultados** (RQ-KP-18).

### Barrido de citas, regla de mutación 4 (casilla 4.17)

`grep -rnoE` de `server/indicadores.ts:NN`, `server/app.ts:NN`, `routes/indicadores.ts:NN`, `routes/indicadores.test.ts:NN` y `server/indicadores.test.ts:NN` sobre todo el worktree (sin `node_modules`, `.git`, `.codegraph` ni `dist`).

- **`apps/desk/server/app.ts`:** ninguna línea se movió (sigue en 96). Las citas a `:22` y `:61` (decenas, en `openspec/changes/archive/` y `docs/sdd/Paquete_de_Despliegue_*`) hablan de la línea de importación y de la de registro de rutas, que siguen siendo esas; las demás (`:38`, `:56`, `:57`, `:59`, `:73`, `:78`, `:79`, `:84-89`) caen antes o después sin moverse.
- **`apps/desk/server/indicadores.ts`:** la cita viva `apps/desk/server/migracionMarcadorLectores.test.ts:54` a la línea 76 sigue siendo la consulta del historial (**cierta**); las de las líneas 77 y 82 también. Se desplazan sólo las posteriores a la 84. Las citas a las líneas 90 y 92 del fichero, que hacen `openspec/changes/indicadores-51-55/exploration.md:25` y `:28`, `design.md:82` y `:293` y la del lote 1 (`apply-progress.md:49`), describen el estado de PARTIDA (la 90 era el comentario de `tablaIndicadores`, hoy la 93; la 92, su `return`, hoy la 95): **caso B** dentro del propio cambio. **Reparadas en el lote 4 anclándolas a la revisión** `42a4828` (`6fcf7e9` la del lote 1), sin renumerar. Las de `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:586` y `:643` y `…04b.md:864` y `:978`: el `:51-55` (el comentario de la función) y `:61`/`:69` siguen ciertas; **`:56-86` ya no cierra donde cierra la función** (hoy `:56-89`): son paquetes fechados, **caso B**: **anclados en el lote 4** (`:56-86` en `42a4828`), sin renumerar. Lo mismo la cita de `openspec/changes/archive/2026-10-03-continuidad-indicadores/verify-report.md` a la prueba de las «tres consultas», anclada a esa misma revisión.
- **Pruebas:** las citas a `routes/indicadores.test.ts:26`, `:39` y `:176` y a `indicadores.test.ts:53` (todas de `openspec/changes/archive/2026-10-03-continuidad-indicadores/`) son del archivo y de su momento (**caso B**); las líneas editadas en sitio no se movieron. `routes/indicadores.ts` no se tocó y sus citas (`:41`, `:41-54`, `:42`) siguen ciertas.
- Segundo pase de las abreviadas (sin nombre de fichero): sin citas con número de línea a las líneas desplazadas en los ficheros que ya citan estos módulos.
- Resultado: **sin citas rotas por este lote** más allá de los casos B dichos. El detector `citas/cli.ts` lo corre el orquestador tras el commit (4.19).

### Regla 13 · líneas reales de este lote (alimenta la tabla de `tasks.md`, casilla 4.12)

| # | Decisión | Dónde la impone el servidor (leído del fichero ya editado) |
|---|---|---|
| 1 | Quién puede cargar | `apps/desk/server/routes/encuestaRespuestas.ts:19` (`requireAuth(db)` y `requireAdmin`, en esa línea y en ese orden) |
| 2 | Qué fichero se rechaza entero | `apps/desk/server/routes/encuestaRespuestas.ts:20` (`!req.file`) y `:22` (analizador no `ok`; el análisis es la 21); el multer va en la misma línea 19, detrás de las dos guardas |
| 3 | Qué fila se rechaza | `apps/desk/server/encuesta/analizarRespuestas.ts:173-179` (ticket, marca, calificación) y, en la base, `apps/desk/server/db/encuestaRespuestas.ts:48` (ticket inexistente; pasos 2 y 3 en `:41-52`); la llamada, `apps/desk/server/routes/encuestaRespuestas.ts:24` |
| 4 | Qué cuenta como duplicado | `apps/desk/server/encuesta/respuesta.ts:18` (`huellaRespuesta`) y la restricción `UNIQUE` en `packages/zoho-sync/src/db/schema.sql:792` (más la lectura de huellas presentes en `apps/desk/server/db/encuestaRespuestas.ts:54-61`) |
| 5 | Cuál respuesta vale | `apps/desk/server/indicadores.ts:85` (la consulta ordenada por `respondida_at, id`) y `:87` (el bucle que se queda con la última de los tickets del periodo) |
| 6 | Qué entrega cuenta para el 51 | `packages/shared/src/indicadores.ts:254` (`TRANSICIONES_DE_ENTREGA`) y `:257` (`hitoEntrega`) |

Decisiones del cliente en esta tanda: ninguna (no se tocó `apps/desk/src`).

**Medida (casilla 4.16):** `git diff --shortstat --no-renames 8abf407` = 6 ficheros, 264 inserciones y 34 borrados (298; ya incluye las 17 casillas de `tasks.md` y esta sección), más `wc -l` de los dos ficheros nuevos sin trackear (28 + 262 = 290) = **~588 líneas** (~590 con esta línea), bajo el techo de 800 y bajo los 720 de aviso. Sin binarios. `tasks.md` está en LF en esta copia de trabajo y se dejó así; el resto de lo editado conserva su CRLF.

---

## Lote 4 · Cierre documental — casillas 5.1 a 5.11 hechas; 5.12 a 5.14 (commit, detector tras el commit, asentar) las hace el orquestador

Commit de partida del intento: `cf004c4`. Worktree `C:\dev\Desk_2_R1.023-worktrees\indicadores-51-55`. Documentación pura: ningún `.ts`, `.tsx` ni `.sql`. La ejecución se cortó una vez por un fallo de red y se reanudó revisando el diff: ninguna edición quedó a medias (las 53 sustituciones previas eran de una sola línea, con su ancla en la misma línea física).

### Cambios del orquestador aplicados

- **A.** Esta rama NO toca `docs/sdd/ENTRADA.md` ni `openspec/config.yaml`. Lo que iría allí está redactado, listo para pegar y sin número de entrada, en el apartado 14 de `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` («Añadido por `indicadores-51-55` (F1F-05, `cierra: no`)»): lo que entra y lo que no, el despliegue, tres preguntas (S-D, S-E, S-G), tres hallazgos, la nota de caso B sobre `openspec/config.yaml` y las tareas P-1 a P-3 con dueño. Las casillas 5.3 y 5.4 llevan la nota.
- **B.** Las cinco citas bloqueantes del detector, y el resto del barrido, abajo.
- **C.** El CLI `citas/cli.ts` sólo lee commits (`--sha`). Para ver el resultado SOBRE EL ÁRBOL DE TRABAJO se construyó un objeto de commit colgante con un índice temporal (`GIT_INDEX_FILE`, `git add -A`, `write-tree`, `commit-tree -p HEAD`) sin mover ninguna referencia ni el índice real: `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha <ese objeto>` salió con **código 0** (6.717 citas comprobadas, 0 bloqueantes). Antes de las ediciones, `--sha HEAD` salía con 1 y cinco bloqueantes. **La comprobación definitiva, tras el commit real (casilla 5.13), la hace el orquestador.**

### Tabla de la regla 13 (casilla 5.2): cerrada en `tasks.md`

Decisiones del cliente: ninguna (`apps/desk/src` sin diff). Las seis filas, con la línea leída hoy del fichero: 1 `apps/desk/server/routes/encuestaRespuestas.ts:19`; 2 `:20` y `:22` del mismo fichero; 3 `apps/desk/server/encuesta/analizarRespuestas.ts:173-179` y `apps/desk/server/db/encuestaRespuestas.ts:48`; 4 `apps/desk/server/encuesta/respuesta.ts:18` y `packages/zoho-sync/src/db/schema.sql:792`; 5 `apps/desk/server/indicadores.ts:85` y `:87`; 6 `packages/shared/src/indicadores.ts:254` y `:257`. Se comprobó que cada línea dice lo que la fila afirma (ruta con `requireAuth` y `requireAdmin` antes de `subida.single`; `!req.file`; `!a.ok`; los tres rechazos de fila en ese orden; la huella y su `UNIQUE`; la consulta `ORDER BY e.respondida_at, e.id` y el bucle; la constante y la función).

### Hallazgo medido: `instanteDeJornada` (hora 0, 2 y 4 frente a 8)

Script temporal fuera del repositorio (borrado), ejecutado con `node_modules/.bin/tsx`: importa `instanteDeJornada` de `packages/shared/src/calendarioLaboral` y la llama con el día `2027-01-12`. Resultado: hora 0 `2027-01-11T05:00:00.000Z`, hora 2 `2027-01-11T07:00:00.000Z`, hora 4 `2027-01-11T09:00:00.000Z`, hora 8 `2027-01-12T13:00:00.000Z`. Las horas 0, 2 y 4 salen un día entero antes (lo debido era el 12/01 a las 05:00, 07:00 y 09:00 UTC); la 8 es correcta. **Se reproduce**, y por eso va como hallazgo en el apartado 14 del paquete.

### Barrido de citas, regla de mutación 4 (casilla 5.7)

Método: `git diff -U0 42a4828 HEAD` por fichero para saber qué líneas cambiaron de contenido y cuáles se desplazaron; después un script sobre TODAS las citas a los seis módulos (rutas completas y abreviadas con nombre de fichero) clasificó cada una; las que caen en líneas cambiadas o desplazadas se leyeron con su frase. Líneas que cambiaron, en `apps/desk/server/indicadores.ts`: 5, 43, 52-53 y 85 (contenido) y desplazamiento de +3 desde la 86; `packages/shared/src/indicadores.ts`: 2, 45-47, 86, 133, 228-232, 241 y 246 (contenido; el resto sólo crece al final, sin desplazar); `packages/shared/src/indicadores.test.ts`: sin desplazamiento hasta la 312 y -3 después; `apps/desk/server/indicadores.test.ts` y `apps/desk/server/routes/indicadores.test.ts`: contenido en 6, 53, 58, 78 y 13, 183, 186, 190, y crecen al final; `packages/zoho-sync/src/db/migrate.test.ts`: contenido en 282-286, 652, 794-798, 822, 825, 837, 839-840 y crece al final.

| Cita | Dónde está | Caso | Qué se hizo |
|---|---|---|---|
| las cinco bloqueantes: `apps/desk/server/indicadores.ts` líneas 90 y 92 | `apply-progress.md` línea 49; `design.md` líneas 82 y 293; `exploration.md` líneas 25 y 28 | **B** (estado de partida: el comentario de `tablaIndicadores` y su `return`) | Ancladas en la misma línea física: `en 42a4828` (`en 6fcf7e9` la del lote 1). El detector deja de bloquear |
| 49 citas más a líneas cambiadas o desplazadas de los seis módulos | `design.md` (las tablas de «dónde cae cada edición» y las de D1, D5 y D7), `exploration.md` (líneas 23, 24, 27, 37, 71 y 72), `proposal.md` (líneas 44, 55 y 102), `tasks.md` (líneas 68, 153 y 158) | **B**: son instrucciones y descripciones de la propuesta y el diseño, escritas contra `42a4828` | 49 anclas `en 42a4828` insertadas tras la cita, en su línea (53 con las cuatro bloqueantes de los planos). Sin renumerar |
| `apps/desk/server/indicadores.ts:56-86` | `docs/sdd/Paquete_de_Despliegue_2026-10-04.md` línea 586; `…-04b.md` línea 864 | **B**: la función cerraba en la 86; hoy cierra en la 89 | Anclada `en 42a4828`. Las otras citas del mismo paquete (`:51-55`, `:61`, `:69`) siguen ciertas y no se tocan |
| `apps/desk/server/indicadores.test.ts:53` | `openspec/changes/archive/2026-10-03-continuidad-indicadores/verify-report.md` línea 120 | **B**: era la prueba de las «tres consultas»; hoy dice cuatro | Anclada `en 42a4828` |
| `apps/desk/server/indicadores.ts:76`, `:82`, `:26`, `:51-55`, `:57-64`, `:61`, `:69` | `apps/desk/server/migracionMarcadorLectores.test.ts`, `docs/sdd/F1B-09_…`, paquetes 04 y 04b, archivos de `migracion-tickets-abiertos`, `traspaso-y-trazas`, `reasignacion-con-motivo` | **A** (presente) | Líneas sin cambio ni desplazamiento (el cambio empieza en la 85): ciertas, sin tocar. El `:51-55` cambió el texto del comentario (tres a cuatro consultas) pero sigue siendo el comentario de la función |
| `packages/shared/src/indicadores.ts:125`, `:134`, `:141` | `apps/desk/server/migracionMarcadorLectores.test.ts`, `docs/sdd/F1B-09_…`, archivos | **A** | Líneas sin cambio: sin tocar |
| `packages/shared/src/indicadores.test.ts:45` | `verify-report.md` archivado de `continuidad-indicadores` | **A** | Sin cambio: sin tocar |
| `apps/desk/server/routes/indicadores.test.ts:26`, `:39`, `:176` y `routes/indicadores.ts:41`, `:42`, `:41-54` | archivos de `continuidad-indicadores` y paquetes 04 y 04b | **A** | Líneas sin cambio (`routes/indicadores.ts` no se tocó): sin tocar |
| `packages/shared/src/indicadores.test.ts:146-151` | `apply-progress.md` línea 19 (lote 1), `design.md`, `tasks.md` | **A**, con una **corrección de hecho** | El lote 1 escribió «hoy en las líneas 145-150» y era falso: el bloque no se movió. Corregida la frase en su línea. También se corrigió, en la línea 86, la descripción del desplazamiento del fichero de pruebas (medido: nada hasta la 308, -3 desde la 313) |
| `apply-progress.md` línea 356 (lote 3): tres abreviadas `:82`, `:90`, `:92` que el detector atribuía a otro fichero | el propio `apply-progress.md` | defecto de redacción | Reescrita en prosa («las líneas 77 y 82», «las líneas 90 y 92»), sin forma de cita. Las abreviadas rotas del detector bajan de 16 a 13; las 13 restantes son ajenas a este cambio |
| citas a `packages/zoho-sync/src/db/migrate.test.ts` en 282-286, 652, 794-798, 837 y 839-840 | unos 70 resultados en `openspec/changes/archive/` (de `calendario-laboral` a `ampliacion-contrato`) y `openspec/specs/gases-patron/spec.md:198` | **B/histórico** | NO se anclan una a una: cada cambio desde el 24/09 editó esos mismos contadores en sitio, y la revisión a la que habla cada archivo es la suya, no `42a4828`; anclarlas todas a `42a4828` afirmaría algo falso de las anteriores. La del spec vivo ya nombra su revisión `f5255d2`. **Queda declarado para que el orquestador decida si quiere un barrido masivo** |
| citas a esos módulos en `docs/sdd/ENTRADA.md` y `openspec/config.yaml` | ídem | fuera del alcance (cambio A) | No se tocan; las de `openspec/config.yaml` (4096, 4102, 4105 y 4107) van listadas como caso B en el apartado 14 del paquete |

Segundo pase (formas abreviadas, sin nombre de fichero) en los ficheros que ya citan estos módulos: ningún resultado que hable de las líneas desplazadas de `apps/desk/server/indicadores.ts` o de `packages/shared/src/indicadores.test.ts`; las abreviadas sobre `migrate.test.ts` son las históricas de arriba. **Ningún ejemplo de cita rota con forma de cita** en lo nuevo: las citas escritas hoy (DEPLOY.md, corrección 33, apartado 14 del paquete, tabla de la regla 13) se comprobaron una a una contra el fichero.

### Criterios de éxito de la propuesta §12 (casilla 5.9)

1. El 51 con entrega y finalización, con signo, hito y fuente; dos entregas valen la última y `reentrante` es `true`: `packages/shared/src/indicadores.test.ts` (bloque nuevo del 51) y la prueba de punta a punta de `apps/desk/server/indicadores.test.ts` («el 51 desde el historial, de punta a punta»).
2. Sin fila de entrega, «sin dato — falta el hito: transición de entrega», aunque haya `Fecha Remisión de Salida`: la prueba K13 de `packages/shared/src/indicadores.test.ts`.
3. La constante de entregas no nombra transiciones que el catálogo no tenga: guardián (a) y (b) de la constante, en el mismo fichero de pruebas.
4. `horaActualizacionEstado` no existe en el código: `grep` sobre `apps` y `packages` (`.ts` y `.tsx`) = 0 resultados, medido hoy.
5. 401, 403 y 400 en ese orden, sin tocar la tabla: `apps/desk/server/routes/encuestaRespuestas.test.ts` («la escalera y el orden de multer», pruebas de posición).
6. Cargar dos veces deja las mismas filas y `insertadas: 0`: «recarga del mismo fichero» de esa prueba y la de `apps/desk/server/db/encuestaRespuestas.test.ts`.
7. Con dos respuestas, gana la última por `respondida_at` y luego por `id`; sin respuestas, «sin dato»: «el 55 desde la encuesta» y «desempate por id» de `apps/desk/server/indicadores.test.ts`.
8. El `GET` ejecuta cuatro consultas, todas de lectura, con uno o con veinte tickets: la prueba renombrada «EXACTAMENTE cuatro consultas» y «el GET no escribe».
9. Las mutaciones M1 a M26 se reprodujeron y se pusieron rojas en los lotes 1, 2a, 2b y 3 (secciones «Mutaciones» de arriba; en el lote 3 una declarada equivalente); M27 no aplica (sin decisiones de cliente). **No se repitieron en este lote**, que no toca código: las repite el verify.
10. `npm test`, `npm run typecheck` y `npm run lint` en verde: ver el cierre.

### Alcance «Fuera» (casilla 5.8) y cierre (casillas 5.10 y 5.11)

`git diff --stat cf004c4`: 11 ficheros, **todos de documentación**: `DEPLOY.md`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, los tres `docs/sdd/Paquete_de_Despliegue_2026-10-0*.md`, el `verify-report.md` archivado de `continuidad-indicadores` y los cinco ficheros de este cambio (incluido `tasks.md`). No tienen diff: `apps/`, `packages/`, `.env.example`, `docs/sdd/ENTRADA.md`, `openspec/config.yaml` ni `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md`.

Códigos de salida MIRADOS: `npm test` **0** (258 ficheros pasan, 2 saltados; 4.187 pruebas pasan, 7 saltadas); `npm run typecheck` **0**; `npm run lint` **0** (165 avisos, 0 errores).

**Medida (casilla 5.11):** `git diff --shortstat --no-renames cf004c4` = 11 ficheros, 247 inserciones y 74 borrados (**321**, y ya incluye esta sección y las 53+ anclas, que son sustituciones de una línea), más `wc -l` de lo nuevo sin trackear: **0** ficheros. Total **~321 líneas**, bajo el techo de 800 y bajo los 720 de aviso. Sin binarios.

## Remediación del verify — W-1 a W-4 (sólo pruebas y documentación; sin código de producción)

Cabeza de partida `8406926`. No se toca `apps/desk/server/encuesta/analizarRespuestas.ts` (`git status --short` no lo muestra).

**Pruebas añadidas** (`apps/desk/server/encuesta/analizarRespuestas.test.ts`; sigue en 37 pruebas, se amplían dos existentes):
- **W-1**, en «un motivo por fila, en el orden ticket, marca, calificación»: la fila `,abc,Bien` (ticket no numérico y marca VACÍA) espera `ticketNoNumerico` y la fila `,,Bien` (sin ticket y marca vacía) espera `sinTicket`.
- **W-2**, en «ilegible…»: se añade `2027-01-12 24:00` a la lista, esperando `marcaIlegible`. Con el código actual sin mutar ya es verde (el código rechaza la hora 24: no es defecto de producción, era una prueba que faltaba).

**Mutaciones reproducidas** (cada una restaurada con `git checkout -- apps/desk/server/encuesta/analizarRespuestas.ts`):
- **W-1:** anteponer a la lectura del ticket una guarda «marca vacía → `sinMarca`». Con las pruebas de antes: 37 de 37 verdes (superviviente confirmada). Con las nuevas: **ROJA**, 1 fallo en «un motivo por fila…» (36 de 37).
- **W-2:** `hora > 23` pasa a `hora > 24`. **ROJA**: `2027-01-12 24:00: expected undefined to be 'la marca de tiempo no es una fecha le…'` en «ilegible…» (36 de 37).

**Cierres documentales:**
- **W-3:** las cuatro citas de `packages/shared/src/indicadores.test.ts` de `design.md:90` (`:100-126`, `:106-111`, `:112-114`, `:115-125`) se comprobaron con `git show 42a4828:…`: en `42a4828` son el describe «51 y 55: sin dato salvo entrada opcional» (`:100`), su `it.each` (`:106-111`), «con la hora y sin finalización» (`:112-114`) y las del 55 (`:115-125`). La frase habla del estado de partida (caso B): cada una lleva ahora «en `42a4828`» en la misma línea física.
- **W-4:** marcadas 1.21-1.23, 2.18-2.20, 3.16-3.18, 4.18-4.20 y 5.10-5.14 de `tasks.md` (commits `6fcf7e9`, `879d1d0`, `8abf407`, `cf004c4`, `e365c68` comprobados con `git log`). Nota junto a 4.19: el detector tras el commit del lote 3 salió con código 1 (cinco citas desplazadas) y el asiento se hizo sin mirarlo; lo corrigió el lote 4 (`e365c68`), cuyo detector sí sale con 0. El asiento de los lotes lo hace el orquestador; la casilla refleja lo que éste declaró.
- `verify-report.md` no se edita (foto de su momento).
