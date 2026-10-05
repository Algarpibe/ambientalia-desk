# Paquete de despliegue — 2026-10-05 (incremental)

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo escribe un
agente que no despliega ni commitea. La publicación es una acción manual: el CI **no despliega**, sólo verifica
(`DEPLOY.md:270-271`).

**Este paquete es INCREMENTAL y NO sustituye al del 2026-10-04 (b)**
(`docs/sdd/Paquete_de_Despliegue_2026-10-04b.md`, medido sobre `f619d04`, que no se toca). Lo **complementa** con
lo que entró en `main` después, en el rango **`f619d04..64a3797`**. Quien publique `64a3797` necesita los dos: las
condiciones de parada, la copia de la base, el procedimiento y las tareas de persona de aquél siguen en pie y aquí
no se repiten ni se han vuelto a leer; aquí sólo va lo nuevo. Cada dato lleva la ruta y la línea leídas en `64a3797`.

## 0 · Medición del rango

| Dato | Valor |
|---|---|
| Cabeza medida | `64a3797` (`git rev-parse --short origin/main` en este clon da el mismo valor; no se ha hecho `fetch`) |
| Rango | `f619d04..64a3797`, **26 commits** (`git rev-list --count`) |
| `git diff --shortstat f619d04 64a3797` | 64 files changed, 8321 insertions(+), 50 deletions(-) |
| Código (`-- apps packages`) | **30 ficheros, +1.960/−40**; sin pruebas ni `testing/`: **13 ficheros, +333/−17** |
| Cliente (`-- apps/desk/src`) | **sin cambios**: ningún `.tsx` ni `.ts` del cliente en el rango |
| Esquema | `packages/zoho-sync/src/db/schema.sql`, **+6 líneas** al final (cuatro sentencias y dos comentarios) |
| Fuera de `apps/`, `packages/`, `docs/` y `openspec/` | sólo `DEPLOY.md` (+35 líneas, apartado 10) |

## 1 · Qué piezas entran

### 1.1 · Prueba de integración de E-206 y `DB_SCHEMA` documentada (`07cf400`, `f0cc676`; fuera del plan)

- **Sólo pruebas y documentación; no cambia el comportamiento de producción.** La prueba
  `packages/zoho-sync/src/db/liberacion.integration.test.ts` enfrenta la mezcla `jsonb` de la liberación con un
  PostgreSQL real. Sólo corre si existe `TEST_DATABASE_URL`
  (`packages/zoho-sync/src/db/liberacion.integration.test.ts:22-23`); el CI la define
  (`.github/workflows/ci.yml:47`). Sin esa variable se salta: es una variable de pruebas, **no de despliegue**.
- **`DEPLOY.md` gana el apartado 10** (`DEPLOY.md:310-343`): qué decide `DB_SCHEMA`, qué se rompe si se pone mal y
  que su valor en producción es hipótesis. La variable **no es nueva**: ya se leía; lo nuevo es que está escrita.
  El apartado trae tres líneas para añadir a mano al fichero de ejemplo de entorno (`DEPLOY.md:335-343`).

### 1.2 · F1F-01 · herramienta de migración de tickets abiertos (`cierra: no`)

- **Una ruta nueva, inerte hasta que alguien la llame:** `POST /api/admin/migrar-tickets-abiertos`
  (`apps/desk/server/routes/admin.ts:222`). Exige sesión y administrador: `requireSuperAdmin` es en ese fichero un
  alias de `requireAdmin` (`apps/desk/server/routes/admin.ts:17`), que responde `403` si el usuario no es
  administrador (`apps/desk/server/auth/middleware.ts:26-27`).
- **En seco por defecto.** Sólo escribe con `aplicar=true` (`apps/desk/server/routes/admin.ts:226-227`). `corte` es
  obligatorio, un instante ISO con desfase; si falta o es una fecha imposible responde `400`
  (`apps/desk/server/routes/admin.ts:224-225`). Con estados sin equivalencia y `aplicar=true` responde `409` con el
  informe y no escribe (`apps/desk/server/routes/admin.ts:231`,
  `apps/desk/server/db/migracionTicketsAbiertos.ts:70`).
- **Qué haría al aplicar:** marca cada ticket abierto de Zoho como gobernado por la aplicación
  (`apps/desk/server/db/migracionTicketsAbiertos.ts:86-87`) y deja una fila marcador con el identificador
  `migracion_f1f01_abiertos` (`packages/shared/src/migracionTickets.ts:14`).
- **El procedimiento es `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`** (95 líneas): requisitos, forma de la
  llamada, lecturas de antes y de después y la reversión, comentada. **No se despliega y no se ha ejecutado**
  (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:3-4`).

> **EJECUTAR LA MIGRACIÓN ES TAREA DE PERSONA Y NO FORMA PARTE DE PUBLICAR.** Publicar `64a3797` sólo deja la ruta
> disponible. La pasada con `aplicar=true` toca datos de producción, necesita copia previa, sincronización reciente,
> la aplicación en reposo y la fecha de corte que fije Gerencia (§5.1), y no la ejecuta ninguna sesión.

> **Condición añadida el 2026-10-05 (E-231): encender `MIGRACION_TICKETS_HABILITADA` sólo el día del corte y apagarla
> después.** La rama `interruptor-migracion-tickets` —pendiente de verificación del analista y **todavía no fusionada**,
> así que no está en `64a3797`— añade esa variable, que nace cerrada: sin ella la ruta responde `403` a `aplicar=true` y
> sólo deja la pasada en seco (`DEPLOY.md`, apartado 11). Si se publica `64a3797` **sin** esa rama, la ruta no tiene
> interruptor y cualquier administrador puede aplicar (E-231): la condición de §5.1 entonces se cumple sólo por disciplina.

### 1.3 · F1B-05 · traspaso y trazas (`cierra: no`)

- **Cuatro columnas nuevas en `public.remisiones`** (§2), que aplica la migración al arrancar la App.
- **Restaurar una remisión deja rastro.** `restaurarRemision` guarda quién y cuándo restaura y copia la anulación
  que deshace, en una sola sentencia (`apps/desk/server/db/remisiones.ts:151-152`); la ruta le pasa el nombre del
  usuario (`apps/desk/server/routes/remision.ts:341-344`).
- **El historial del ticket enseña dos cosas nuevas**, compuestas al leer y sin escribir nada:
  la **línea de traspaso** «Traspaso: origen → destino» antes de cada transición con destino resoluble
  (`apps/desk/server/db/traspaso.ts:43`, `apps/desk/server/db/historial.ts:143`), y, en una remisión restaurada,
  la anulación previa y la restauración (`apps/desk/server/db/remisionRestaurada.ts:20-23`,
  `apps/desk/server/db/historial.ts:120`). La creación del ticket y el marcador de F1F-01 no generan línea de
  traspaso (`apps/desk/server/db/traspaso.ts:25-26`).
- **Borrar un ticket anota quién liberó sus órdenes de venta** (`packages/zoho-sync/src/db/ovAsociaciones.ts:134`,
  llamado desde `apps/desk/server/routes/tickets.ts:91`). La columna `liberada_por` ya existía
  (`packages/zoho-sync/src/db/schema.sql:549`): no es esquema nuevo.
- **Sin relleno:** las restauraciones y liberaciones anteriores a este despliegue no ganan rastro
  (`packages/zoho-sync/src/db/schema.sql:719`).

### 1.4 · F1B-09 · auditoría de blueprint (`cierra: no`)

Sólo documentos: `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` y las entradas E-222 a E-230 de
`docs/sdd/ENTRADA.md`. El único fichero de `apps/` que toca es una prueba
(`apps/desk/server/reconciliacion/registro.test.ts`, +2/−2 en el rango). **No hay nada que desplegar ni que
comprobar en la aplicación por esta pieza.**

## 2 · Esquema

Cuatro sentencias nuevas, al final del fichero (`packages/zoho-sync/src/db/schema.sql:721-724`; las dos líneas
anteriores son comentarios):

```sql
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS restaurada_at timestamptz;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS restaurada_por text;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS anulacion_previa_at timestamptz;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS anulacion_previa_por text;
```

- **Idempotentes:** las cuatro llevan `ADD COLUMN IF NOT EXISTS`; repetir el arranque no cambia nada.
- **Aditivas:** columnas anulables, sin `DEFAULT`, sin `NOT NULL` y sin relleno. No reescriben filas.
- **Calificadas:** `public.remisiones`, como exige la regla de los dos esquemas.
- **Dónde se aplican:** en la base `desk`, al arrancar la App (`apps/desk/server/index.ts:27`). El worker
  `apps/hub-sync` no llama a `migrate` en su arranque: en `apps/hub-sync/src/hub-sync.ts` sólo aparece
  `reorgToDesk` (`apps/hub-sync/src/hub-sync.ts:47`).
- **Si se omiten** (App nueva contra un esquema sin ellas): el historial pide las cuatro columnas por nombre
  (`apps/desk/server/db/historial.ts:151`) y restaurar las escribe (`apps/desk/server/db/remisiones.ts:152`), así
  que las dos operaciones fallarían. No hay que ejecutarlas a mano: basta con que la App arranque.
- F1F-01 y F1B-09 no traen sentencias de esquema. El `.sql` de F1F-01 es un procedimiento, no una migración.

## 3 · Variables de entorno

**Ninguna nueva.** El fichero de ejemplo de entorno no cambia en el rango (`git diff --name-only f619d04 64a3797`
sólo devuelve `DEPLOY.md` fuera de `apps/`, `packages/`, `docs/` y `openspec/`), y el único `process.env` añadido
en el código es `TEST_DATABASE_URL`, en una prueba (§1.1). Ningún interruptor de escritor nuevo: la migración de
F1F-01 se gobierna con el parámetro `aplicar` de cada llamada, no con una variable.

**Corrección del 2026-10-05 (E-231), válida sólo si se publica también la rama `interruptor-migracion-tickets`:** esa rama
añade **una** variable nueva, `MIGRACION_TICKETS_HABILITADA`, que nace cerrada. **No se pone al publicar**: se enciende el
día del corte y se apaga después (§5.1). La línea para el fichero de ejemplo de entorno está en `DEPLOY.md`, apartado 11.

Pendiente de persona, heredado: añadir al fichero de ejemplo las tres líneas de `DB_SCHEMA`
(`DEPLOY.md:335-343`) y comprobar su valor en los dos servicios (`DEPLOY.md:331-333`).

## 4 · Comprobaciones después de publicar, y cómo volver atrás

Publicar es lo que ya describe el paquete del 04/10 (b) en su §4, con `64a3797` como commit. **Sólo hay que
redesplegar la App por este incremento** — *hipótesis razonada:* lo único de `packages/zoho-sync` que cambia fuera
de pruebas es `schema.sql` y `ovAsociaciones.ts`, cuyo único llamador de producción está en la App
(`apps/desk/server/db/eliminarTicket.ts`); no se ha comprobado qué empaqueta la imagen del worker.

### 4.1 · El esquema (solo lectura, base `desk`)

```sql
SELECT column_name, data_type, is_nullable FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'remisiones'
   AND column_name IN ('restaurada_at', 'restaurada_por', 'anulacion_previa_at', 'anulacion_previa_por');
```

Deben salir **cuatro filas**, todas anulables. Menos de cuatro: la App no arrancó con el código nuevo.

### 4.2 · Línea de traspaso en el historial

1. Entrar en `ambientalia-desk.ambientalia.cloud` y abrir un ticket gestionado en la aplicación que tenga al menos
   una transición hecha desde ella.
2. Abrir su historial. Antes de cada transición debe aparecer una línea «Traspaso: *quien la hizo* → *destino*»,
   donde el destino es la persona a la que se derivó o, si no hubo derivación, el área o las áreas que siguen.
3. La creación del ticket no lleva línea de traspaso.
4. El panel pinta el título de cada evento tal cual llega (`apps/desk/src/components/HistoriaPanel.tsx:40`), y el
   cliente no cambió: si la línea no aparece, el fallo está en el servidor.

### 4.3 · Anular y restaurar una remisión (administrador)

Hacerlo sobre una remisión de prueba o con el visto bueno de Servicio Técnico: es un dato real.

1. En la pantalla de Remisiones, **Anular** una remisión
   (`apps/desk/src/components/RemisionesPage.tsx:322`; pide confirmación).
2. Con «Ver anuladas», pulsar **Restaurar** (`apps/desk/src/components/RemisionesPage.tsx:318`).
3. Abrir el historial del ticket de esa remisión: deben verse «Remisión anulada», con «Anulada por», y después
   «Remisión restaurada», con «Restaurada por» y el nombre de quien lo hizo.
4. Lectura de control, sólo `SELECT`:
   `SELECT id, restaurada_at, restaurada_por, anulacion_previa_at, anulacion_previa_por, anulada_at FROM public.remisiones WHERE restaurada_at IS NOT NULL;`
   — la fila debe tener las cuatro columnas rellenas y `anulada_at` vacío.
5. Sólo se guarda el **último** ciclo de anular y restaurar (E-221): repetirlo sobrescribe las cuatro columnas.

### 4.4 · Pasada en seco de la migración (administrador; no escribe)

1. Con sesión de administrador, llamar a la ruta **sin** `aplicar`, con un `corte` con desfase, como indica el
   procedimiento (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:27-28`).
2. Debe responder `200` con el informe y `aplicado: false`. Sin sesión, `401`; sin ser administrador, `403`; sin
   `corte`, `400`.
3. Leer `negativa` (debe ser nula) y `numeracion.arrastra` (debe ser falso;
   `apps/desk/server/db/migracionTicketsAbiertos.ts:52-54`). **Si alguno no lo es, no se aplica y se consulta.**
4. **No añadir `aplicar=true` como parte de esta comprobación.** En un `+hh:mm` el signo se escribe `%2B`
   (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:31`).

### 4.5 · Cómo volver atrás

- **Volver al código anterior = redesplegar `f619d04`** (o el commit que estuviera publicado). La base no hay que
  tocarla: las cuatro columnas son anulables y sin `DEFAULT`, y `f619d04` no nombra ninguna pieza nueva
  (`git grep -c "restaurada_at\|anulacion_previa\|migrar-tickets-abiertos\|migracion_f1f01" f619d04 -- apps packages`
  no devuelve nada). Las columnas se quedan, sin uso.
- **Lo que la reversión del código no deshace:** las restauraciones hechas con el código nuevo conservan su rastro en
  columnas que `f619d04` no lee; deja de verse en el historial, no se pierde.
- **Si alguien llegó a aplicar la migración**, volver al código anterior **no** la deshace: los tickets siguen
  marcados como gobernados por la aplicación. Su reversión es el bloque comentado del procedimiento
  (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:58-95`), que sólo se ha probado sobre pg-mem y no revierte los
  tickets que alguien movió después (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:63-65`).
- La reversión de todo lo anterior a `f619d04` está en el paquete del 04/10 (b), §4.5.

## 5 · Tareas de persona pendientes

Tomadas de los tres informes de archivo. Archivar no las dio por hechas.

### 5.1 · F1F-01 (`openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/archive-report.md:63-71`)

| Tarea | Dueño | Qué desbloquea |
|---|---|---|
| Copia de la base antes de aplicar | La persona con acceso a producción | Poder aplicar |
| Sincronización completa y reciente justo antes | La que Gerencia designe (E-208) | Que no se congele un dato viejo |
| Pasada en seco y lectura del informe | La persona con acceso a producción | Poder aplicar; si `arrastra` es verdadero, no aplicar y consultar |
| Encender `MIGRACION_TICKETS_HABILITADA=true` y redesplegar, **sólo el día del corte** (E-231; si la rama del interruptor está publicada) | La persona con acceso a producción | Que `aplicar=true` no responda `403` |
| Pasada con `aplicar=true`, con la aplicación en reposo y la fecha de corte que fije Gerencia | La persona con acceso a producción | La migración |
| **Apagar** `MIGRACION_TICKETS_HABILITADA` y redesplegar en cuanto termine la pasada (E-231) | La persona con acceso a producción | Que ningún administrador pueda volver a aplicar |
| Averiguación de la hoja de Google y cotejo una a una | Gerencia (E-218) | El cierre de F1F-01 |

Además, E-207 a E-212 son seis preguntas a Gerencia que condicionan la ejecución
(`openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/archive-report.md:61`).

### 5.2 · F1B-05 (`openspec/changes/archive/2026-10-05-traspaso-y-trazas/archive-report.md:62`)

- **Gerencia:** responder E-089 (de ella depende la mitad de visibilidad por área); aprobar o no el protocolo de
  traspaso (E-220); decidir cómo se identifica el actor que no es una persona (E-219); pegar la corrección 26 en
  el maestro; decidir si se rellenan las restauraciones y liberaciones anteriores.
- **Quien publica:** desplegar y comprobar las cuatro columnas (§4.1), y verificar en la aplicación la línea de
  traspaso y la restauración (§4.2 y §4.3). El informe no nombra dueño para estas dos; se propone aquí.

### 5.3 · F1B-09 (`openspec/changes/archive/2026-10-05-audit-f1b/archive-report.md:39`)

- Asignar destino a E-222 y E-228; decidir si la anulación alcanza a los dos flujos nuevos (E-223); responder
  E-090 — Gerencia.
- Actualizar M11.6 en el maestro (E-230) — Gerencia.
- Repasar la auditoría al cerrar la épica 1B — la sesión de construcción.
- Corregir las fichas caducas de `CLAUDE.md` y registrar `decision/mapa-blueprint-generado` (E-229): **hecho el
  2026-10-05 como trabajo documental directo, pendiente de commit y de revisión**; ver la adenda a E-229 al final
  de `docs/sdd/ENTRADA.md`.

## 6 · Lo que NO se pudo comprobar desde el repositorio

Todo lo de este apartado es **hipótesis**:

1. **Qué commit está hoy en producción.** Los paquetes anteriores fijaban `ae5aaf4` como base; no hay forma de
   leerlo desde aquí. Si producción sigue en `ae5aaf4`, este incremento no se puede publicar solo: va detrás de
   todo lo que cubre el paquete del 04/10 (b).
2. **Que `origin/main` en el servidor remoto sea `64a3797`** y que su CI esté en verde: se leyó la referencia local,
   sin `fetch`, y no se consultó el CI.
3. **El valor de `DB_SCHEMA`** en la App y en el worker (`DEPLOY.md:331-333`).
4. **El contenido del fichero de ejemplo de entorno:** no se leyó; sólo consta que no cambió en el rango.
5. **Que las cuatro sentencias corran sin error contra el PostgreSQL de producción:** las pruebas del rango usan
   pg-mem, salvo la de integración de §1.1, que no ejerce estas columnas.
6. **Que el panel pinte bien los eventos nuevos** (se dedujo leyendo el componente; se comprueba en §4.2 y §4.3)
   y **que el worker no necesite redespliegue** (§4; no se inspeccionó su imagen).
7. **La pasada en seco contra datos reales:** nunca se ha hecho; su primer informe es el de la persona.
8. Las condiciones de parada y los riesgos del paquete del 04/10 (b) no se han vuelto a leer contra `64a3797`.
