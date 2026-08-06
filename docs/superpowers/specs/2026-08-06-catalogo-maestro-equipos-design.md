# Catálogo maestro de equipos — diseño

**Fecha:** 2026-08-06
**Estado:** aprobado por el usuario, pendiente de plan de implementación
**Fase:** 1 de un proyecto mayor (ver «Fuera de alcance»)

## El problema

Hoy no hay catálogo. Las listas de marcas, modelos y tipos que ofrece el formulario de equipos se **derivan del propio inventario**: `equipoFacets` hace `SELECT DISTINCT marca, modelo, tipo FROM equipos`. La consecuencia es que la tabla `equipos` es a la vez el dato y su propia referencia, así que un equipo mal registrado —`EDM 180 C` en vez de `EDM180C`— pasa a ser una opción oficial para todos los siguientes, y la suciedad se realimenta.

La opción «Otro…» del formulario es la puerta por la que eso entra, y no hay ninguna forma de corregirlo sin SQL.

Encima de eso, la deducción del tipo de equipo a partir del modelo (commit `c2dbb5f`) funciona hoy por **estadística sobre el inventario**: si un modelo figura con dos tipos, la app no puede decidir y tiene que preguntar. Con un maestro deja de ser una inferencia y pasa a ser un dato.

## Decisiones tomadas

Todas del usuario, en la sesión del 2026-08-06:

| Decisión | Elegida | Descartadas |
|---|---|---|
| Alcance de la fase 1 | Solo el catálogo maestro | Catálogo + accesorios; ficha técnica primero; desbloquear Books primero |
| ¿Catálogo cerrado? | Cerrado, con atajo para administrador | Cerrado del todo; abierto como hoy; abierto con revisión |
| Migración de lo sucio | Sembrar todo + bandeja de conflictos, sin tocar `equipos` | Fusión automática; siembra en bruto; diagnóstico previo |
| Quién administra | Solo super administrador (`isAdmin`) | Un área por rol; cualquiera con sesión |

Decisión de diseño derivada, no consultada: **el tipo es un atributo del modelo**, no una combinación que se elija cada vez. Un APSA-370 *es* un analizador de SO2. Los tipos siguen siendo maestro propio —se administran en un sitio— pero cada modelo apunta a uno solo, de modo que el caso ambiguo desaparece por construcción en vez de tener que contemplarse.

## Modelo de datos

```sql
CREATE TABLE IF NOT EXISTS catalogo_tipos (
  id text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalogo_marcas (
  id text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalogo_modelos (
  id text PRIMARY KEY,
  marca_id text NOT NULL,
  nombre text NOT NULL,
  tipo_id text,
  revisar boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (marca_id, nombre)
);

ALTER TABLE equipos ADD COLUMN IF NOT EXISTS modelo_id text;
```

Ids con prefijo, como el resto del proyecto (`eq-`, `app-`): `ctip-`, `cmar-`, `cmod-` + `randomUUID()`.

`tipo_id` admite NULL a propósito: un modelo cuyos equipos no declaran tipo entra sin él y marcado para revisar. Sin FK declaradas — el esquema no las usa en ninguna otra tabla y pg-mem las trata de forma desigual; la integridad se sostiene en los repos, que son los únicos que escriben.

Las unicidades se declaran **y** se comprueban en el repo antes de insertar: así el conflicto sale como un 409 con un mensaje entendible en vez de como un error del driver.

## El enlace con `equipos`

Las columnas de texto `equipos.marca`, `equipos.modelo` y `equipos.tipo` **se conservan**. Las leen la búsqueda de equipos, la creación de tickets (que las copia a la fila del ticket), la hoja de vida y `perfilChecklist`. Sustituirlas por el `modelo_id` sería un refactor de otro tamaño, sin beneficio propio y con riesgo repartido por media aplicación.

Lo que cambia es **quién las escribe**. Al crear o editar un equipo se elige del catálogo, y el servidor rellena los tres textos a partir del modelo elegido. No pueden divergir del catálogo porque ningún otro camino los toca.

`modelo_id` es obligatorio al crear y al editar un equipo. Un equipo sin modelo del catálogo es exactamente el problema que esta fase viene a cerrar, y la edición es el momento natural para arreglarlo. Los que hoy no tienen marca o modelo quedarán con `modelo_id` NULL tras la siembra, y la bandeja los cuenta para que se vean.

## Siembra del catálogo

Endpoint propio, `POST /api/admin/seed-catalogo`, **idempotente y no destructivo**, siguiendo el precedente de `POST /api/admin/seed-remision-checklist`. No va dentro de `migrate()`: `migrate()` es tolerante por sentencia y se salta en silencio la que falle, de modo que un backfill escondido ahí puede no correr nunca sin que nadie se entere.

Qué hace, en orden:

1. Inserta cada `tipo` distinto no vacío de `equipos` en `catalogo_tipos`.
2. Inserta cada `marca` distinta no vacía en `catalogo_marcas`.
3. Inserta cada par (marca, modelo) distinto y no vacío en `catalogo_modelos`.
4. A cada modelo le asigna el tipo **más frecuente** entre sus equipos, ignorando los que no declaran tipo. **Empate: gana el primero por orden alfabético**, para que dos ejecuciones den lo mismo. Si el modelo tenía más de un tipo distinto, además queda con `revisar = true`. Si ninguno de sus equipos declara tipo, queda con `tipo_id` NULL y `revisar = true`.
5. Rellena `equipos.modelo_id` cruzando por coincidencia **exacta** de (marca, modelo). Lo que no case queda NULL; no se inventa nada.

Reejecutarlo no duplica ni pisa: las filas que ya existen se dejan como están, incluidas las correcciones que un administrador haya hecho a mano. Es la misma razón por la que la siembra del checklist es no destructiva.

## Bandeja de conflictos

No lleva tabla propia. Como la siembra no reescribe `equipos`, la evidencia sigue en los datos y el reparto real se recalcula con una consulta agrupada por (marca, modelo, tipo) con su conteo. Un conflicto se ve así:

> **Horiba APSA-370** figura con 2 tipos: Analizador de SO2 (7 equipos) · Calibrador Multigas (1 equipo)

Resolverlo es fijarle el tipo al modelo, lo que apaga `revisar` y **ofrece** corregir los equipos que discrepan, diciendo cuántos son. Corregirlos es una acción explícita del administrador, nunca un efecto colateral de guardar.

La bandeja muestra también, como segunda sección, el conteo de equipos con `modelo_id` NULL — los que no casaron con nada.

## API

Todas bajo la sesión existente. Las de escritura, además, tras `requireAdmin`.

| Método | Ruta | Quién | Qué |
|---|---|---|---|
| GET | `/api/catalogo` | sesión | Marcas, tipos y modelos **activos**, más el `incluir=<modeloId>` que pida quien edita. Sin ese parámetro, editar un equipo cuyo modelo se desactivó dejaría el campo en blanco y obligaría a cambiárselo para poder guardar. Es el mismo apaño que ya hace `withCurrent` en el formulario, resuelto en el servidor. |
| POST | `/api/catalogo/marcas` | admin | Alta. 409 si el nombre ya existe. |
| POST | `/api/catalogo/tipos` | admin | Alta. 409 si el nombre ya existe. |
| POST | `/api/catalogo/modelos` | admin | Alta con `marcaId`, `nombre`, `tipoId`. 409 si ya existe ese nombre en esa marca. |
| PATCH | `/api/catalogo/tipos/:id` | admin | Renombrar y activar/desactivar. |
| PATCH | `/api/catalogo/marcas/:id` | admin | Activar/desactivar. **Sin renombrar** (ver Riesgos). |
| PATCH | `/api/catalogo/modelos/:id` | admin | `{ tipoId?, activo?, corregirEquipos? }`. Fijar `tipoId` apaga `revisar` — un administrador que elige el tipo a conciencia es lo que resuelve la duda. **Sin renombrar** (ver Riesgos). |
| DELETE | `/api/catalogo/{marcas,tipos,modelos}/:id` | admin | Solo si no lo usa ningún equipo; si lo usa, 409 con el conteo. |
| GET | `/api/catalogo/conflictos` | admin | Modelos con `revisar`, su reparto real de tipos, y el conteo de equipos sin modelo. |
| POST | `/api/admin/seed-catalogo` | admin | La siembra. |

No hay endpoint aparte para resolver un conflicto: resolverlo **es** fijarle el tipo al modelo, así que es el mismo `PATCH`. Un camino menos que mantener, y una sola regla sobre cuándo se apaga `revisar`.

`corregirEquipos` gobierna qué pasa con los equipos ya registrados que declaran otro tipo. Sin él, cambiar el tipo de un modelo solo rige para lo que se registre a partir de entonces y los viejos conservan el suyo; con él, se les reescribe el texto `equipos.tipo`. La respuesta devuelve siempre cuántos discrepan, se hayan corregido o no, para que el número quede a la vista y no haya que ir a buscarlo.

`GET /api/equipos/facets` **se retira**: su único consumidor es el formulario de equipos, que pasa a leer `/api/catalogo`. Con eso, `tiposPorModelo` y el aviso de modelo ambiguo introducidos en `c2dbb5f` dejan de tener sentido y se van con él — el tipo ya no se deduce por estadística, lo dice el modelo.

## Pantallas

**Configuración → Administración de datos → «Catálogo de equipos»**, junto a «Registro de equipos» y visible solo para super administrador. Tres listados —Modelos, Marcas, Tipos— con Modelos como principal, porque es donde vive el dato que importa. Mientras quede algún conflicto, la bandeja va arriba del todo.

**Formulario de equipo (`EquipoForm`)**: los desplegables se cierran y desaparece «Otro…». El de modelo se acota a la marca elegida, como ya hace. El tipo pasa a ser **de solo lectura**: lo determina el modelo y no hay nada que elegir. Si el modelo que hace falta no está, a un administrador se le ofrece darlo de alta sin salir del formulario; a quien no lo sea se le dice que lo pida a un administrador.

## Fuera de alcance, a propósito

SKU, fotos, manuales, sincronización con Zoho Books y gestión de accesorios. Cada uno depende de decisiones que hoy no se pueden tomar:

- **`books.items` no existe en `desk-db`.** Solo la crea `migrateBooks`, que corre el worker `apps/hub-sync` contra el hub. Hay que decidir cómo llega antes de poder atar ningún SKU.
- **`books.items` no trae modelo.** La marca vive dentro de `raw`; campo de modelo no hay ninguno. La asociación artículo↔modelo es algo que esta plataforma tiene que crear, no algo que Books pueda sincronizar.
- **Los binarios no tienen sitio decidido.** El precedente en la app es `resolution_attachments`, que guarda base64 en una columna `text`. Vale para una foto de resolución; para manuales en PDF de decenas de megas, no.

Ver `debt.md` para el detalle ya investigado de accesorios y de `books.items`.

## Riesgos y trampas

**Renombrar marcas y modelos queda fuera de la fase 1.** `perfilChecklist` decide el checklist «Incluye» de una remisión leyendo el **texto** de marca y modelo, con reglas de subcadena: `modelo.includes('edm180')`, `marca === 'horiba'`, `modelo.startsWith('ap')`. Renombrar un modelo cambiaría en silencio qué accesorios pide la remisión de todos sus equipos. Merece su propio diseño, con ese aviso delante y probablemente con una previsualización del efecto. Los tipos sí se pueden renombrar: `perfilChecklist` no los mira.

**Consecuencia asumida:** en esta fase, dos variantes de escritura del mismo modelo no se pueden fusionar. Lo que sí se puede es **desactivar** la mala, que la retira de las altas futuras sin tocar los equipos ya registrados. Contiene el problema sin reescribir el histórico. La fusión llega con el renombrado.

**Cerrar el catálogo puede frenar un alta el primer día.** Mitigado porque la siembra sale de los datos reales: todo lo que hoy existe seguirá estando. El riesgo queda en los modelos nuevos, que es justo donde queremos el control.

**`migrate()` se salta en silencio la sentencia que falle.** Por eso la siembra es un endpoint con test propio y no una sentencia del esquema.

## Verificación

- Repos con pg-mem, endpoints con supertest, en la línea del resto del proyecto.
- **La siembra lleva test propio y obligatorio.** Casos: modelo con dos tipos (gana el más frecuente y queda `revisar`), empate resuelto por orden alfabético, modelo cuyos equipos no declaran tipo, equipo sin marca o sin modelo, y **reejecución** (no duplica ni pisa correcciones manuales).
- Autorización probada en el endpoint, no en la pantalla: cada ruta de escritura con 401 sin sesión y 403 sin `isAdmin`.
- El 409 de nombre repetido y el 409 de borrado en uso, con su conteo.
- La UI no tiene harness de componentes (no hay jsdom): typecheck, lint, build y prueba manual del usuario.
- Línea base a respetar: 437 tests pasando / 2 saltados, lint 0 errores / 159 warnings. Se verifica **desde la raíz del repo**.
