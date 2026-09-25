# Diseño: edición comercial del equipo, con restricción por área y registro de cambios

Base medida: `0807a77`. Entrada: `proposal.md` (Engram #1043). Las líneas citadas son de esa revisión.

## Enfoque técnico

La regla («qué campos están restringidos» y «quién puede cambiarlos») vive en `packages/shared` y la consumen
servidor y cliente (regla 13.1). El servidor la **impone** en el `PATCH` existente, comparando el cuerpo con lo
guardado (c1), y escribe `UPDATE` + filas de registro en una transacción (`enTransaccion`,
`apps/desk/server/db/transaccion.ts:13`). El registro se lee ampliando la respuesta de `GET /api/equipos/:id/historial`, sin ruta nueva. El
cliente bloquea los tres campos como comodidad probada (regla 13.3).

## Decisiones

| # | Decisión | Alternativa rechazada | Razón |
|---|---|---|---|
| D1 | Fichero nuevo `packages/shared/src/equipoComercial.ts`: `CAMPOS_COMERCIALES` (seis), `CAMPOS_COMERCIALES_RESTRINGIDOS` (tres), `ETIQUETA_CAMPO_COMERCIAL`, `puedeEditarCamposRestringidos(areas, isAdmin)` = `canExecuteTransition(areas, isAdmin, 'Comercial')` (`permissions.ts:4-7`), y la función pura `cambiosComerciales` | Constante duplicada en ruta y `.tsx`; helper de permiso nuevo en `permissions.ts` | Una fuente para las dos puntas. Consume la regla de área existente sin crear otra: `permissions` **no** se modifica y la cabecera sigue `[hojas-vida]` |
| D2 | `cambiosComerciales(guardado, entrante)`: omite la clave si `entrante[c] === undefined`; `nuevo = entrante[c] ? String(entrante[c]) : null` (la misma normalización previa de `camposHojaDeVida`, `routes/equipos.ts:148`, `:158`, `:177`, `:182`); `anterior = guardado[c] || null`. Cambia si `anterior !== nuevo` | Comparar por presencia de clave; normalizar fechas por `Date` | `EquipoForm` manda siempre los seis (`EquiposAdmin.tsx:170-174` en `0807a77`, `mantenedorId ?? ''` en `:173`). `toFull` da `undefined` para vacío (`db/equipos.ts:112-115`) y `fechaSolo` devuelve `AAAA-MM-DD` (`books/repo.ts:94-101`): la comparación de cadenas basta. Sin `trim`, igual que hoy `camposHojaDeVida` |
| D3 | Tabla `public.equipos_cambios`, al **final** de `schema.sql`; `'equipos_cambios'` se añade al final de la **misma** línea `migrate.ts:73` | Ruta `GET /api/equipos/:id/cambios`; tabla en `desk` | c3; añadir en la misma línea no desplaza `migrate.ts:80`, citada por `CLAUDE.md` |
| D4 | Lectura: se amplía `GET /api/equipos/:id/historial`. La ruta cambia `res.json(h)` por `res.json({ ...h, cambios: await listarCambiosEquipo(db, String(req.params.id)) })` en `routes/equipos.ts:41`, en la misma línea. El handler no tiene variable `id`: `:39` usa `String(req.params.id)` en línea. `getEquipoHistorial` pasa a devolver `Omit<EquipoHistorial, 'cambios'>` (`db/equipos.ts:249`, misma línea). `EquipoHistorial` gana `cambios: CambioEquipo[]` en una línea NUEVA dentro de `types.ts:542-546` | Endpoint propio | Una sola petición desde `HojaDeVida.tsx:147`, coherente con RQ-HV-02 («no hay endpoint nuevo») |
| D5 | Módulo nuevo `apps/desk/server/db/equiposCambios.ts` (importa sólo `enTransaccion`, sin ciclo): `registrarEdicion(db, equipoId, cambios, persona, escribir)` y `listarCambiosEquipo(db, equipoId)`. El `UPDATE` lo pasa la ruta como callback `escribir(q)`. `db/equipos.ts` **re-exporta** esas dos funciones con un `export { … } from './equiposCambios'` **al final del fichero** (después de `:403`), y la ruta las añade a su import de `:5`, en la misma línea | (a) funciones + `import` arriba en `db/equipos.ts`; (b) módulo nuevo con `import` arriba en `routes/equipos.ts` | Recuento del 2026-09-25 (ver «Barrido»): (a) desplaza **11** citas completas y **2** abreviadas de `db/equipos.ts`; (b) desplaza **14** completas de `routes/equipos.ts`, más sus abreviadas (todas las de `:6` en adelante). La elegida no desplaza **ninguna** por imports: sólo añade líneas al final de `db/equipos.ts`, donde no hay citas, y amplía líneas que ya existen. El coste es una re-exportación con un comentario que diga por qué está ahí |
| D6 | `camposHojaDeVida` **no se mueve** en este cambio | Moverlo a `services/` | Moverlo cuesta unas 160 líneas de ledger (77 borradas + unas 80 insertadas, regla del ciclo 2) sin cambiar el comportamiento, el 20 % del techo. No hay ciclo: `routes/equipos.ts` no importa `services/`. La cita `equipoNuevo.ts:64` se reapunta de todas formas. Queda como punto abierto **sin destino** en el `archive-report` |
| D7 | `camposHojaDeVida` devuelve `{ error, escalon: 'A' \| 'C' }`: `'A'` sólo en `:152` (mantenedor no encontrado). Cambio en su sitio, 0 líneas netas | Comparar el texto del error; separar la comprobación del mantenedor | Hace falta para cumplir A<B<C (D8). Los llamadores (`:61`, `equipoNuevo.ts:71-72`) sólo miran `'error' in` y siguen igual |
| D9 | RQ-HV-11: **no se toca** ninguna de las dos vías de alta. `POST /api/equipos` (`:48-71`) y `crearTicketConEquipo` (`services/equipoNuevo.ts:80-92`) no llaman a `registrarEdicion` ni aplican la guarda de área. Sólo el `PATCH` llama a `registrarEdicion` | Registrar el alta como «de null a valor» | Supuestos a1 y c5: el registro documenta cambios sobre un equipo YA existente. Dos pruebas lo fijan (ver «Pruebas») |
| D10 | Archivado. `sdd-archive` fusiona la delta **por ID de requisito**: RQ-HV-09, RQ-HV-10, RQ-HV-11 y RQ-HV-12, todos `ADDED`, como en los cambios anteriores. Para el §2 «Fuera de alcance» de la spec viva, aplica la sección de la delta titulada **«Nota de fusión — §2 «Fuera de alcance» de la spec viva»**, nombrada por su título. `tasks.md` la lleva como tarea del archive, no del apply | Que la aplique el apply; ignorarla | Esa sección no es un `Requirement`, así que la fusión por ID no la recoge. Si no se aplica, el §2 vivo seguiría afirmando «hoy basta `requireAuth`», que deja de ser cierto |

### D8 — Orden de guardas del `PATCH` (A<B<C<D, `transitions-st/spec.md:751-760`)

| Orden | Guarda | Escalón |
|---|---|---|
| 1 | `404` equipo; `:75` pasa a `const actual = await getEquipoFull(...)` | A |
| 2 | `422` cliente no encontrado (`:81`), modelo obligatorio (`:91`) o no encontrado (`:93`) | A |
| 3 | `camposHojaDeVida`: si `escalon === 'A'` → `422` «Mantenedor no encontrado» | A |
| 4 | **Nuevo `403`** si algún restringido cambia (`cambiosComerciales(actual, b)` filtrado) y `!puedeEditarCamposRestringidos(user.areas, user.isAdmin)` | B |
| 5 | Error `'C'` de `camposHojaDeVida` (fechas, Drive) → `422` | C |
| — | No hay unicidad en el `PATCH` | D |

**Por qué el paso 2 es A.** El escalón A pregunta «¿está presente y existe lo que la petición direcciona, o
aporta por identificador?» (`transitions-st/spec.md:757`). «Cliente no encontrado» y «Modelo no encontrado»
responden a la parte de EXISTENCIA de un identificador aportado tal cual, no resuelto antes. «El modelo es
obligatorio» (`:91`) responde a la parte de PRESENCIA: `modeloId` llega en el cuerpo, pero vacío. Por eso es A,
igual que «falta el equipo» (`:24` de esa misma tabla), y no C. La delta clasifica los mismos tres `422` como A:
en este punto spec y diseño coinciden.

El `403` se decide sobre el cuerpo normalizado **sin validar**: una fecha inválida en un campo restringido que envía
quien no es Comercial da `403` (B antes que C). Nada se escribe antes del paso 5.

**Alineación explícita con la delta corregida.** Por decisión del orquestador en el gate del diseño (2026-09-25):
- **D8** es el orden que rige: cliente, modelo y mantenedor inexistentes son escalón **A** (identificador aportado
  tal cual, `transitions-st/spec.md:757`), así que preceden al `403`. La primera versión de la delta, que ponía
  en C los `422` de cliente y modelo, ya está corregida y dice lo mismo que este diseño.
- **D2** es la normalización que rige: una clave ausente no se toca y no cuenta como cambio. La delta se alinea
  con D2.

Este diseño y la delta corregida afirman lo mismo en los dos puntos.

## Flujo de datos

    PATCH ─► 404/422(A) ─► camposHojaDeVida ─► A? 422 ─► cambiosComerciales(actual,b)∩restringidos
          ─► ¿sin permiso? 403 ─► C? 422 ─► registrarEdicion: enTransaccion{ escribir(q): UPDATE; active ─ INSERT×N }
    GET /historial ─► getEquipoHistorial + listarCambiosEquipo ─► { equipo, cronologia, cambios (más reciente primero) }
    POST /api/equipos, POST /api/tickets (equipo nuevo) ─► sin cambios: sin guarda de área y sin registro (D9)

## Contratos

```sql
CREATE TABLE IF NOT EXISTS public.equipos_cambios (
  id bigserial PRIMARY KEY, equipo_id text NOT NULL, campo text NOT NULL,
  valor_anterior text, valor_nuevo text, usuario_id text NOT NULL, usuario_nombre text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipos_cambios_equipo ON public.equipos_cambios (equipo_id);
```

Sin FK (c4: sobrevive a `deleteEquipo`; y `equipos` está en `desk`). Para el mantenedor se guarda el **id**, y
el nombre se resuelve al leer: `LEFT JOIN clients … AND c.campo = 'mantenedorId'`, con el nombre en
`anteriorTexto`/`nuevoTexto`. **Hipótesis:** pg-mem admite esa condición en el `ON`; si no, se hace una segunda
consulta en JS. Orden de lectura: `created_at DESC, id DESC`. `CambioEquipo { campo, anterior, nuevo,
anteriorTexto?, nuevoTexto?, usuarioNombre, fecha }` y `CampoComercial` van en `types.ts`, detrás de
`EquipoHistorial`, y `equipoComercial.ts` importa los tipos desde `./types`. En `types.ts` se añade **una línea
dentro de `EquipoHistorial`** (`:542-546`, el campo `cambios`) más el bloque nuevo detrás. Eso desplaza todo lo
que va de `:546` en adelante; medido el 2026-09-25, no hay citas vivas a `types.ts` a partir de `:546`.

## Regla de mutación 3: decisiones del cliente y dónde las impone el servidor

| Decisión del cliente | Qué la impone en el servidor |
|---|---|
| Bloquear los tres restringidos en edición si `!puedeEditarCamposRestringidos` | Paso 4 de D8 (el `403` nuevo) |
| No bloquear nada en el alta (`equipo === null`) | Ninguna, a propósito: el alta es libre (a1, `:48-71`) |
| Mandar los seis siempre | D2: compara contra lo guardado |
| Botón «Editar» visible para toda sesión | `requireAuth` en `:73` |
| Sección «Cambios» | `listarCambiosEquipo` |

## Pruebas (strict_tdd, vitest en entorno node)

| Capa | Qué se prueba | Mutación que la pone en rojo |
|---|---|---|
| Unitaria `equipoComercial.test.ts` | normalización (`''`, `null`, ausente, fecha igual); predicado con admin y áreas vacías | quitar `'' → null` (M9); quitar la vía de admin (M4) |
| HTTP `apps/desk/server/equipos.test.ts` (`userCookie`, `appHarness.ts:91`) | criterios 1-4 y 7 | guarda por presencia (M3); registrar los seis (M5) |
| Posición A<B (criterio 5 de la propuesta) | sin Comercial, `PATCH` a un id inexistente con `finGarantia` → `404`, no `403` | `403` antes del `404` |
| Escenario de la delta «El escalón B gana al 422 de contenido cuando compiten» | sin Comercial, `fechaFacturaCompra` con formato inválido y distinta de la guardada → `403`, y ni el equipo ni `equipos_cambios` cambian | `403` después del paso 5 (M2); el `403` sobre el cuerpo validado en vez del normalizado |
| Posición | P-AB: sin Comercial, `finGarantia` cambiada + `mantenedorId` inexistente → `422` mantenedor. P-BC: sin Comercial, `finGarantia` válida cambiada + Drive `http://` → `403`; el mismo cuerpo con Comercial → `422` | `403` antes del paso 3 (M1); `403` después del paso 5 (M2) |
| Atomicidad | `registrarEdicion` con `rastreadorDeVerbos('INSERT')` (`transaccion.test.ts:59`) y un `escribir` que lanza un `UPDATE` → `BEGIN, UPDATE, INSERT, ROLLBACK` | sin `enTransaccion` (M6); registrar antes de escribir (M10) |
| Lectura `db/equiposCambios.test.ts` | orden, nombre del mantenedor, sobrevive al borrado | `ASC` (M8) |
| RQ-HV-11 (HTTP) | (1) `POST /api/equipos` sin Comercial, con los tres restringidos → `201` y 0 filas en `equipos_cambios`. (2) `POST /api/tickets` con `clasificaciones = 'Equipo nuevo'` y datos comerciales completos, sin Comercial → `201`, equipo creado y 0 filas | que el alta llame a `registrarEdicion` o aplique la guarda (M11) |
| Guardián (regla 2) | `migrate.test.ts:282-286` pasa a 31 / 18 | `CREATE TABLE` sin calificar en `schema.sql`, o sin entrada en `PUBLIC_TABLES` (M7) |

## Cambios de ficheros y lotes

| Lote | Fichero | Acción | Líneas estimadas |
|---|---|---|---|
| 1 | `packages/shared/src/equipoComercial.ts` (+ `.test.ts`) | Crear | 45 + 70 |
| 1 | `packages/shared/src/index.ts` (al final), `types.ts` | Modificar | 1 + 12 |
| 1 | `apps/desk/server/routes/equipos.ts` | Modificar (`PATCH`, `:41`, D7) | unas 25 |
| 1 | `apps/desk/server/db/equiposCambios.ts` (+ `.test.ts`) | Crear | 55 + 60 |
| 1 | `apps/desk/server/db/equipos.ts` | Modificar (`:249` en su sitio; re-exportación al final) | 4 |
| 1 | `schema.sql`, `migrate.ts`, `migrate.test.ts` | Modificar | 10 + 2 + 8 |
| 1 | `apps/desk/server/equipos.test.ts` (+ RQ-HV-11 vía ticket, donde viva la prueba de `POST /api/tickets`) | Modificar | unas 210 |
| 2 | `EquiposAdmin.tsx` (exportar `EquipoForm` en `:95`, bloqueo) | Modificar | unas 20 |
| 2 | `HojaDeVida.tsx` («Editar», recarga, «Cambios») | Modificar | unas 60 |

Lote 1 ≈ 480-530; lote 2 ≈ 80. Total del apply ≈ 560-610, por encima de la propuesta (410-570) por las pruebas de RQ-HV-11 y el módulo nuevo. `HojaDeVida` importa
`EquipoForm` de `EquiposAdmin`, que a su vez importa `HojaDeVida` (`EquiposAdmin.tsx:6`): es un ciclo entre
componentes, se resuelve en el render y no hay regla `no-cycle` en eslint. Extraer el formulario costaría unas
390 líneas de ledger. El modal (`z-[80]`, `:199`) queda por encima de la hoja (`z-[75]`, `HojaDeVida.tsx:219`).

## Barrido de citas (regla de mutación 4, en el cierre)

Remedido el 2026-09-25 sobre `0807a77` con `grep -rnoE "db/equipos\.ts:[0-9]+(-[0-9]+)?"` y
`grep -rnoE "routes/equipos\.ts:[0-9]+(-[0-9]+)?"` (fuera de `archive/`). Se hizo además un pase de
abreviadas con `grep -n` sobre la spec viva `hojas-vida/spec.md` y sobre la versión ACTUAL de la delta
`specs/hojas-vida/spec.md` (166 líneas, leída del disco el 2026-09-25). Con D5:

- **`routes/equipos.ts`**: no se añade ningún import de fichero.
  - `:4` (`import { urlSegura } from '@ambientalia/shared'`) se amplía **en su sitio** con
    `cambiosComerciales`, `CAMPOS_COMERCIALES_RESTRINGIDOS` y `puedeEditarCamposRestringidos`. `:5` se amplía
    en su sitio con `registrarEdicion` y `listarCambiosEquipo`.
  - `packages/shared/src/index.ts` no re-exporta hoy `equipoComercial`. Se añade `export * from
    './equipoComercial'` como **línea 21, al final** (hoy acaba en `:20`). La única cita viva a ese fichero,
    `F1A-05_Auditoria_blueprint_audit-F1A.md:111` (`index.ts:6`), no se desplaza.
  - `:41`, `:75` y el cuerpo de `camposHojaDeVida` se editan en su sitio. El `PATCH` crece unas 15 líneas a
    partir de `:96`, así que se desplaza todo lo que va de `:97` en adelante.
  - **Hay que reapuntar** (todas apuntan a `:97` o más abajo):
    - `services/equipoNuevo.ts:64` (`:144-189`).
    - En la delta, `:18` (`routes/equipos.ts:135-137`), `:30` (`:147-155`), `:75` (`:99`), `:80` (`:105-110`) y
      `:116` (`:144-189`).
    - En la spec viva, la abreviada `:99` de `hojas-vida/spec.md:70`.
  - **Quedan igual** (todas apuntan por encima de `:97`), y se comprueban:
    - Spec viva: `:38`, `:54`, `:56`, `:113` (y la abreviada `:80-81`), `:181`.
    - `db/equipos.ts:394` (`:50`).
    - Delta: `:15` (`:73`), `:29` (`:79-83`, `:89-95`), `:33` (`:75`), `:82` (`:38-42`), `:111` (`:48-71`) y
      `:157` (`:48`, `:73`). La de `:157` es la cita del texto de la spec viva que la «Nota de fusión» sustituye.
  - **Caso B**: `config.yaml:2784` (`:73`) sigue apuntando a la línea correcta, pero lo que afirma («deja
    editar a cualquiera») deja de ser cierto. Se nombra `0807a77`.
- **`db/equipos.ts`**: no se desplaza nada; sólo cambia `:249` en su sitio y se añade la re-exportación al final.
  Se comprueban sin tocar 11 citas completas y 2 abreviadas:
  - Spec viva: `hojas-vida/spec.md:54` (`:119`, y la abreviada `:133`), `:127` (`:59-75`) y la abreviada
    `:129` (`:67-68`).
  - `types.ts:355`; `tickets-core/spec.md:105`, `:378` y `:605` (dos citas); `CreateTicket.tsx:205`;
    `remisiones.test.ts:880`.
  - Delta: `:16` (`:169-172`) y `:80` (`:158-160`).
- **Lote 2**:
  - `HojaDeVida.tsx` gana imports arriba (`useAuth`, `EquipoForm`), así que se remide la abreviada `:159-165` de
    `hojas-vida/spec.md:138`.
  - `EquiposAdmin.tsx:95` se edita en su sitio. Se remide `hojas-vida/spec.md:166`: la abreviada del payload,
    `:148`, ya es incorrecta en `0807a77` (el payload está en `:170-174`); se corrige como caso A.
- **Documentos fechados** (`Triaje…`, `F0-00…`, `Puntos…`, el plan R01.1, `ENTRADA`, `Parte_*`, `F1B-01…`,
  `Paquete_de_Despliegue…`) y la propuesta: caso B. Se comprueban uno a uno y no se renumeran.

## Matriz de amenazas

N/A: no hay enrutado, shell, subprocesos, automatización de VCS/PR, clasificación de ejecutables ni integración de
procesos.

## Migración y despliegue

Tabla aditiva (`IF NOT EXISTS`); `migrate` la crea al arrancar. No hay datos que migrar ni flags.

## Preguntas abiertas

Ninguna bloqueante. Supuestos anotados: D6 (sin mover); el `JOIN` condicional en pg-mem (hipótesis).

## Riesgos

- Lectura sin `FOR UPDATE`: dos `PATCH` a la vez pueden registrar un valor anterior ya desfasado. Riesgo aceptado.
- **Incoherencia que ya existía y NO se corrige aquí**: `services/equipoNuevo.ts:63` llama «Validación C» a la
  guarda que incluye el mantenedor inexistente, y `ticketService` la coloca al final del escalón C. En este
  `PATCH` esa misma guarda es escalón A (D8). La misma comprobación queda clasificada de dos maneras según la vía.
- **Presupuesto**: el lote 1 (unas 480-530) y el `verify-report` (precedentes de 206 a 358) en el mismo intento
  pueden pasar de 800. Hay que separar los intentos o pedir techo.
- La re-exportación de D5 existe sólo para no desplazar citas. Si alguien la «limpia» con un import arriba,
  desplaza 13 citas (en `db/equipos.ts`) o 14 más sus abreviadas (en `routes/equipos.ts`) sin que nada se ponga
  rojo.
