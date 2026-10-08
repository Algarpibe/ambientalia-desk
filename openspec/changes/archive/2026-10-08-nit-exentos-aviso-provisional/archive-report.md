# Archive · `nit-exentos-aviso-provisional` (F1B-19, `cierra: si`)

**Fecha:** 2026-10-08 · **Rama:** `nit-exentos-aviso-provisional` · **Partida:** `ba643d9` · **Informe escrito por el orquestador**, con cifras
medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-19 cubre, en una línea:** las dos piezas que pide —los NIT genéricos exentos del `409` de NIT en Books
(E-154) y el aviso a Comercial de un provisional cuyo NIT ya está en Books (E-155)—, construidas y probadas. **Deja fuera** sólo lo que no
es construible por una tanda: los demás NIT de la lista, que decide contabilidad. Por eso declara `cierra: si`.

## Qué decisiones construye

- `decision/e154-nit-genericos-exentos`: «Exentos el NIT de consumidor final (222222222222) y los genéricos que confirme contabilidad
  sobre la lista de NIT repetidos en Books.»
- `decision/e155-aviso-provisional-en-books`: «Sí, el aviso a Comercial, sin bloquear.»

Las dos en `openspec/config.yaml` → `decisiones_de_gerencia_adenda`; la fila la abre `decision/f1b19-nit-exentos-y-aviso-provisional`.

## Qué quedó construido

- **La lista de exentos es una tabla sembrada, `public.nit_exentos`** (`packages/zoho-sync/src/db/schema.sql:801`), con UNA fila: el
  NIT `222222222222` (`packages/zoho-sync/src/db/schema.sql:807`). Tabla y no constante porque la decisión pide «un dato mantenible», y
  porque contabilidad la ampliará sin despliegue. Una sola fuente: no hay copia de la lista en `packages/shared`. Un exento se retira con
  `activo = false`, nunca borrando: la siembra reinsertaría la fila.
- **Cómo casa:** `esNitExento` (`packages/shared/src/nitExentos.ts:12`) llama a `nitCoincide`, la misma función con la que el alta
  compara contra Books. Hay una sola implementación de «mismo NIT» en el repositorio; no hubo dos que enfrentar.
- **Dónde se aplica:** dentro de `apps/desk/server/services/ticketService.ts:96`. Con NIT exento el alta no consulta Books. La exención
  vive en el escalón D y no salta ninguna guarda anterior; el fichero conserva sus 277 líneas.
- **El aviso:** `apps/desk/server/services/avisoProvisionalEnBooks.ts`. Por cada pareja de provisional sin enlazar y contacto de Books
  con el mismo NIT, un aviso de bandeja a Comercial, una sola vez. La marca es una fila de `public.provisional_books_avisados`
  (`packages/zoho-sync/src/db/schema.sql:812`), escrita en la misma transacción que los avisos. Sin destinatarios no se marca y la pasada
  siguiente reintenta. Un NIT exento en cualquiera de los dos lados no avisa. Al enlazar el provisional deja de avisar.
- **Dónde corre:** `pasadaProvisionalesEnBooks`, en la cadena periódica de `apps/desk/server/index.ts:88`, entre la pasada de
  reclamaciones y la de ritmo de contrato, en cada intervalo. Nunca lanza: un fallo no impide la sincronización.
- **Despliegue:** apartado nuevo al final de `DEPLOY.md` (desde su línea 630). Sin variables de entorno ni interruptor.
- **No se tocó `apps/desk/src`.** El cliente no toma ninguna decisión sobre el NIT: lo envía recortado y enseña los candidatos que trae
  el `409`. La tabla de la regla 13 queda en una fila: ninguna.

## Respuestas a lo que pidió el encargo

- **Dos provisionales distintos con el mismo NIT exento: se permite** (supuesto S-2). La fuente no lo dice; hoy nada impide dos
  provisionales con el mismo NIT, exento o no, y este cambio no añade esa unicidad. Lo fija una prueba.
- **Comportamiento conocido, fijado con prueba:** un NIT exento tecleado como base más dígito de verificación **sin guion** no se
  reconoce como exento. Es el contrato de `nitCoincide`, que no se tocó.
- **Guardián de tablas:** 10, 34 y 3, 47 en total (`packages/zoho-sync/src/db/migrate.test.ts:282-286`). Las dos tablas van calificadas
  y al final de `schema.sql`, que pasa de 796 a 818 líneas sin mover ninguna.

## Intentos

| # | Unidad | Commit | git | registro |
|---|---|---|---|---|
| — | Planificación (fuera de intento) | `38798d9` | 900 | — |
| 1 | Apply, lote 1 · exentos | `3432e88` | 381 | 381 |
| 2 | Apply, lote 2 · aviso sin cablear | `fb57468` | 552 | 552 |
| 3 | Apply, lote 3 · pasada y despliegue | `596856e` | 143 | 143 |
| 4 | Verify (PASS con avisos) | `2473028` | 126 | 126 |
| 5 | Remediación de supervivientes | `44b9381` | 97 | 97 |
| 6 | Archivo | el commit de este informe | 2.704 (parte revisable: 358) | se lee al asentar |

Medida de cada intento: `git diff --shortstat --no-renames` contra el commit anterior, más lo nuevo sin trackear. Sin binarios. El apply
se partió en tres lotes **antes de escribir**, porque la estimación del aviso entero rozaba la válvula de 720.

## Fusión de los deltas

Por script (`fusiona.mjs`), casando por identificador: tres bloques, los tres idénticos al delta tras fusionar. RQ-TC-30 se sustituye en
sitio con las mismas 50 líneas; RQ-TC-57 y RQ-AV-21 se añaden al final. `openspec/specs/tickets-core/spec.md` pasa de 3.370 a 3.476
líneas y `openspec/specs/derivacion-avisos/spec.md` de 956 a 1.079: ninguna cita por línea a esas dos specs se desplaza. No se crea
capacidad nueva, así que `openspec/config.yaml` → `capabilities` no cambia.

## Verificación

- **Cuatro códigos sobre `44b9381`:** `npm test` 0 (4.327 pasan, 7 saltadas), `npm run typecheck` 0, `npm run lint` 0 (0 errores, 165
  avisos), detector de citas 0.
- **Mutaciones:** las del apply (M1 a M7, N1 a N11), 31 del verify y 10 del orquestador, todas restauradas. Del verify sobrevivieron
  nueve: tres equivalentes; cuatro cerradas con prueba en el intento 5 (cada una en rojo con su mutación), que añadió además la del enlace tras un aviso; y dos sin prueba, declaradas
  abajo. De las del orquestador sobrevivió una —invertir los argumentos de `nitCoincide` en el aviso—, cerrada con prueba en el lote 2.
- **El verify formal es sobre `596856e`.** Después sólo cambiaron pruebas y un escenario del delta; ningún fichero de producción.
- **El guardián de la reconciliación** (`apps/desk/server/reconciliacion/registro.test.ts:218-220`) pasó a doce tandas en curso en el
  lote 1 y vuelve a once en este commit: archivada, F1B-19 cuenta como cerrada por archivo.

## Declarado

1. **Dos mutaciones del verify siguen sin prueba.** La cadena de `apps/desk/server/index.ts` se prueba como texto —orden e import—, no
   ejecutándola: si la pasada se sustituyera por una función que lanza, ninguna prueba lo vería.
2. **«El aviso no bloquea ningún alta ni transición» se sostiene por estructura:** el servicio no tiene entrada desde ninguna ruta. No
   hay prueba que lo afirme.
3. **Cada pasada lee todos los contactos de Books mientras haya un provisional sin enlazar y no exento.** Cuántos contactos hay: sin
   dato en el repositorio. **Hipótesis:** el coste es asumible.
4. **Ráfaga al publicar (S-4):** la primera pasada avisa una vez cada pareja que ya exista. Sin dato de cuántas hay.
5. **La carrera entre dos pasadas reales contra PostgreSQL no se probó:** se prueba por estructura (la marca duplicada devuelve el
   código `23505` y no avisa), porque pg-mem serializa las promesas.
6. **`exploration.md` lo escribió el orquestador** a partir del informe del agente de exploración, cuya salida no llegó a guardarse.
7. **Las tablas de cabecera de las dos specs vivas no se tocaron:** ya contaban menos requisitos de los que hay antes de este cambio.

## Citas

Ninguna línea citada se movió, así que el barrido fue de comprobación. Textos que dejan de ser ciertos en ficheros que la rama no toca,
para Supervisión:

- La consecuencia (1) de `decision/e154-nit-genericos-exentos`, que dice que hoy no existe ninguna lista y cita una línea de
  `apps/desk/server/services/altaManual.ts` cuyo comentario se reescribió; y `tanda_que_abre` de esa decisión y de
  `decision/e155-aviso-provisional-en-books`, que siguen diciendo «SIN DESTINO».
- Las entradas E-154 y E-155 de `docs/sdd/ENTRADA.md`.
- Citas de cambios archivados al recuento de tablas de `packages/zoho-sync/src/db/migrate.test.ts`: son registros fechados (caso B).

## Tareas de personas — fuera del recuento

Archivar no las da por hechas.

| Qué | Dueño | Destino |
|---|---|---|
| Decidir qué NIT repetidos en Books son genéricos y entran en la lista | Contabilidad | `openspec/config.yaml` → `decisiones_de_gerencia`; la fila se añade por SQL, como explica `DEPLOY.md` |
| Ejecutar la consulta de sólo lectura de `proposal.md` (NIT repetidos en `books.contacts`) y entregar el resultado a contabilidad. **Ninguna sesión la ejecutó** | Persona con acceso a producción | `docs/sdd/ENTRADA.md` → E-154 |
| Responder a S-1 a S-6 de `proposal.md`; S-4 (la ráfaga) conviene antes de publicar | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| Poner al día los textos del apartado «Citas» | Supervisión | Los propios ficheros, en `main` |
| Comprobación de lectura tras desplegar | Persona con acceso a producción | `DEPLOY.md`, apartado de F1B-19 |
