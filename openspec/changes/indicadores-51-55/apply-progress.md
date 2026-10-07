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
- Guardián K14 (`packages/shared/src/indicadores.test.ts:146-151` antes de la edición, hoy en las líneas 145-150): recorre `INDICADORES_G6`; no exige nada del 51.
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
- `apps/desk/server/indicadores.ts:90`: el comentario ya no nombra la entrada; sigue en 93 líneas.
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
- Fichero de pruebas de `packages/shared`: las líneas posteriores a la 114 suben una (el bloque 100-114 pasa de 15 a 14 líneas) y las posteriores a la 315, cuatro más (el del 47 pasa de 10 a 7). **No hay ninguna cita viva a esas líneas**: las del archivo son de la prueba de rutas, que no se tocó, o caen en tramos que no se movieron.
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
