# Ficha técnica del modelo — diseño

**Fecha:** 2026-08-07
**Estado:** aprobado por el usuario, pendiente de plan de implementación
**Fase:** 2 del catálogo de equipos. La fase 1 (catálogo maestro) está en producción — ver `2026-08-06-catalogo-maestro-equipos-design.md`.

## El problema

Un técnico con un equipo delante no tiene dónde mirar qué es ni cómo se repara. La información técnica del equipo —qué aspecto tiene, dónde está la placa del serial, su manual, sus instructivos— vive hoy repartida entre carpetas, correos y la cabeza de quien lleva años haciéndolo.

## El hallazgo que redujo el alcance a la mitad

La petición original pedía «fotos» por equipo. Al explorarlo aparecieron dos cosas que la cambian:

**Las fotos de estado ya existen.** Cada remisión de entrada lleva su registro fotográfico; esas fotos viven en `remision_fotos`, las sirve la aplicación por su proxy autenticado, y **ya salen en la hoja de vida del equipo** dentro de su remisión (`fotosPorRemision` → `adjuntosRemision` → `cronologia`). Documentar cómo llegó un equipo lleva meses funcionando. Construir un segundo sistema de fotos para eso sería duplicarlo.

**Lo que falta es lo invariante, y es del MODELO, no de la unidad.** «Así es un Grimm EDM180C y la placa está aquí» es igual para los 35 equipos de ese modelo. Su manual, también.

Consecuencia: todo lo nuevo cuelga de los **35 modelos**, no de los 354 equipos. El almacenamiento deja de ser un problema de diseño y pasa a ser un detalle.

## Decisiones tomadas

Todas del usuario, en la sesión del 2026-08-07:

| Decisión | Elegida | Descartadas |
|---|---|---|
| Uso de las fotos | Referencia (invariante) **y** estado — pero el estado ya existe vía remisiones | Solo identificar; solo documentar estado |
| ¿De qué es la foto de referencia? | **Del modelo**, la comparten todos sus equipos | De la unidad; de las dos; ninguna |
| Manuales y guías | **Enlace, y subida cuando haga falta** | Solo enlaces; solo subida |
| Dónde se consulta | Hoja de vida **y** ticket | Solo el catálogo; solo la hoja de vida |

## Modelo de datos

Una tabla nueva y una columna:

```sql
CREATE TABLE IF NOT EXISTS public.catalogo_documentos (
  id text PRIMARY KEY,
  modelo_id text NOT NULL,
  tipo text NOT NULL,
  nombre text NOT NULL,
  url text,
  content_b64 text,
  content_type text,
  size integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);
CREATE INDEX IF NOT EXISTS idx_catalogo_documentos_modelo ON catalogo_documentos (modelo_id);

ALTER TABLE catalogo_modelos ADD COLUMN IF NOT EXISTS sku text;
```

`tipo` admite `'foto'`, `'manual'`, `'instructivo'` y `'guia'`. Es una lista blanca en el código, no un `CHECK`: el esquema de este proyecto no usa ninguno y añadir un tipo nuevo no debería exigir una migración.

**Un documento es un enlace O un fichero, nunca las dos cosas ni ninguna.** Lo comprueba el repo y lo dice un comentario. No va como restricción del esquema porque pg-mem —el motor de los tests— trata los `CHECK` de forma desigual, y una restricción que solo existe en producción es peor que ninguna: da falsa seguridad en los tests.

⚠️ **La foto NO es una columna de `catalogo_modelos`.** Esa tabla la lee `leerCatalogo` cada vez que alguien abre el formulario de equipos; arrastrar 35 imágenes en base64 en cada carga sería un desastre silencioso, de los que solo se notan cuando la aplicación ya va lenta. La foto es una fila más de `catalogo_documentos` con `tipo='foto'`, y **el repo garantiza que haya como mucho una por modelo**: subir una nueva sustituye la anterior.

**El SKU sí es columna de `catalogo_modelos`**: es un dato pequeño, del modelo, y lo consultan las mismas pantallas que ya leen esa tabla.

⚠️ **El SKU no se valida contra nada.** Sin `books.items` en `desk-db` es una cadena que alguien teclea. Se incluye porque el usuario lo pidió y cuesta una columna, pero cuando llegue la sincronización con Books habrá que **reconciliar los que se hayan escrito a mano**. Queda anotado en `debt.md`.

## Cómo se sirven los documentos

- **Enlaces**: la pantalla los abre directamente. La aplicación no los descarga ni los comprueba.
- **Ficheros subidos**: los sirve la aplicación por su proxy autenticado, `GET /api/catalogo/modelos/:id/documentos/:docId/contenido`, igual que las fotos de remisión. Nada sale de la sesión.

El límite de subida se queda en **10 MB**, el mismo que ya aplican `multer` en resoluciones y remisiones. Un manual más grande se enlaza en vez de subirse — que es exactamente el caso que motivó admitir los dos caminos.

Pedir el contenido de un documento que es un enlace responde **404**: no hay fichero que servir, y devolver la URL por esa vía confundiría dos cosas distintas.

## Permisos

La misma frontera que el catálogo, y por la misma razón: **leer exige solo sesión, escribir exige super administrador**. Un técnico tiene que poder abrir el manual del equipo que está reparando; decidir qué documentos existen es administrar.

## API

| Método | Ruta | Quién | Qué |
|---|---|---|---|
| GET | `/api/catalogo/modelos/:id/ficha` | sesión | SKU, foto y documentos del modelo |
| GET | `/api/catalogo/modelos/:id/documentos/:docId/contenido` | sesión | El fichero subido. 404 si el documento es un enlace |
| POST | `/api/catalogo/modelos/:id/documentos` | admin | Alta. Enlace (JSON) o fichero (`multipart`, campo `archivo`) |
| DELETE | `/api/catalogo/modelos/:id/documentos/:docId` | admin | Baja |
| PATCH | `/api/catalogo/modelos/:id` | admin | Gana `sku` además de lo que ya acepta |

**`GET .../ficha` nunca devuelve `content_b64`.** Devuelve, por cada documento, su `id`, `tipo`, `nombre`, `url` y `contentType`, y **la foto aparte** de la lista de documentos aunque en la tabla sea una fila más — la pantalla la trata distinto y separarla ahí ahorra que cada consumidor la filtre por su cuenta.

La imagen se pinta con un `<img src="/api/catalogo/modelos/:id/documentos/:docId/contenido">`, que es el mismo camino que ya usan las fotos de remisión. Así el base64 solo viaja cuando se va a ver, y una ficha con diez documentos no arrastra diez ficheros.

El `DELETE` lleva el modelo en la ruta aunque el `id` del documento ya sea único: mantiene la simetría con las otras dos y deja la ruta legible sin tener que consultar la tabla para saber de quién cuelga.

La ficha se pide **aparte** del catálogo, nunca dentro de `GET /api/catalogo`: ese endpoint lo consume el formulario de equipos en cada carga y no debe engordar con datos que casi nunca se miran.

## Pantallas

**Editar** — Configuración → Catálogo de equipos, al abrir un modelo: el SKU, la foto (subir/sustituir) y la lista de documentos con alta por enlace o por fichero.

**Consultar en la hoja de vida** — un bloque de ficha técnica arriba, antes de la cronología. Convierte esa pantalla en el sitio único del equipo: qué es, qué le ha pasado y cómo se repara.

**Consultar en el ticket** — un bloque compacto en el panel de propiedades: la miniatura de la foto y los documentos como enlaces. **Sin pestaña nueva**; el detalle del ticket ya tiene bastantes, y el técnico ve el manual sin salir de donde trabaja.

Un modelo sin ficha no enseña un bloque vacío: no enseña nada.

## Verificación

- Repo y rutas con pg-mem y supertest, como el resto del proyecto.
- Casos con test propio, porque son los que se rompen en silencio: el **XOR** enlace/fichero (ni los dos ni ninguno), la **unicidad de la foto** por modelo (subir otra sustituye), el **404** al pedir el contenido de un enlace, y la **frontera de autorización** en cada ruta de escritura — 401 sin sesión, 403 sin `isAdmin`.
- ⚠️ Un test debe fijar que **`GET /api/catalogo` sigue sin devolver documentos ni base64**. Es la regresión más fácil de introducir y la más difícil de notar: todo seguiría funcionando, solo más lento cada día.
- La interfaz va sin harness de componentes (no hay jsdom): typecheck, lint, build y prueba manual del usuario.
- Línea base a respetar: **498 tests pasando / 2 saltados**, lint **0 errores / 158 warnings**. Se verifica desde la raíz del repo.

## Qué queda fuera

- **Validar el SKU contra `books.items`** y el listado de artículos de la gestión de accesorios. Sigue bloqueado: esa tabla solo la crea `migrateBooks` contra `zoho-hub-db`, y no existe en `desk-db`.
- **Fotos por unidad.** Descartado a propósito: el estado ya lo documentan las remisiones y la referencia es del modelo. Si algún día una unidad concreta necesitara la suya, sería una tabla aparte y una conversación aparte.
- **Versionado de documentos.** Sustituir un manual pisa el anterior. Nadie ha pedido conservar históricos y hacerlo multiplicaría el almacenamiento sin beneficio conocido.
