# Artículos por modelo — accesorios, consumibles y repuestos (diseño)

**Fecha:** 2026-08-10 · **Estado:** propuesta, pendiente del visto bueno del usuario

## Qué se construye

Una lista de **artículos por modelo** con tres clases —**accesorio**, **consumible**, **repuesto**— que se
administra desde la app, sin SQL. Los artículos se **eligen** del catálogo real de Zoho Books
(`books.items`, ya replicada en `desk-db`: 1428 filas), no se teclean.

**Un solo mecanismo con un discriminador de clase**, no tres pantallas gemelas. Accesorio, consumible y
repuesto tienen la misma forma —una lista de artículos colgando de un modelo—; lo que cambia es para qué
sirve cada una: el accesorio se verifica al recibir y devolver el equipo, el consumible se repone, el
repuesto se cambia. Tres tablas y tres pantallas se desincronizarían solas.

## Lo que ya está decidido (no se re-abre)

1. **`category_name` de Books es filtro y sugerencia, NUNCA asociación automática.** Medido: solo 9 de los
   35 modelos del catálogo casan con una categoría, porque Books agrupa por FAMILIA (`EDM 180`, `AP Series`,
   `LAQUAtwin`) y el catálogo nombra el MODELO (`EDM180C`, `AP 370 TRS`, `LAQUAtwin-PH-11`). Proponer la
   asociación automáticamente cubriría una cuarta parte y el resto sería adivinar qué repuesto entra en qué
   equipo.
2. **La clase se elige al añadir**, con un valor propuesto desde el prefijo de la categoría:
   `Opcional …` → **accesorio**; `C&R …` → **consumible**, cambiable a **repuesto** de un clic. Books no
   separa consumible de repuesto (los junta bajo `C&R`), así que esa distinción la aporta el humano.
3. **Modelo de datos mixto:** artículos enlazados a Books **y** ítems de texto libre. Buena parte de los 109
   ítems del checklist actual («Manuales», «Caja de transporte», «Pletinas (par)», «Repuestos reemplazados»)
   **no son artículos vendibles y no tienen SKU**. Obligar a enlazarlo todo forzaría a inventar artículos.
4. **Granularidad: por marca-modelo y SIN herencia en runtime.** Un modelo sin lista propia no hereda del
   perfil ni de la marca: se queda sin artículos hasta que alguien se los dé de alta.
5. **«Cero filas» siempre significa «modelo sin lista definida todavía»**, nunca «este modelo no lleva
   accesorios». El mensaje empuja a completarlo; no existe estado centinela.

## Modelo de datos

```sql
CREATE TABLE IF NOT EXISTS catalogo_articulos (
  id text PRIMARY KEY,
  modelo_id text NOT NULL,
  clase text NOT NULL,                  -- accesorio | consumible | repuesto
  item_id text,                         -- books.items.item_id; NULL si es un ítem de texto libre
  sku text,                             -- denormalizado del artículo
  nombre text NOT NULL,                 -- denormalizado, o el texto libre
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogo_articulos_unico ON catalogo_articulos (modelo_id, clase, nombre);
CREATE INDEX IF NOT EXISTS idx_catalogo_articulos_modelo ON catalogo_articulos (modelo_id);
```

**Por qué `nombre` es obligatorio y está denormalizado:** la lista se lee sin join contra `books.items` y
**sobrevive** si el artículo se retira de Books o si la replicación se cae. Mismo criterio que `equipos.marca`
/ `equipos.modelo`, que también guardan el texto además del `modelo_id`.

**Por qué `item_id` es nullable:** es lo que distingue un artículo real de un ítem de texto libre. No hace
falta ninguna bandera aparte.

**Por qué el UNIQUE va sobre `(modelo_id, clase, nombre)` y no sobre `item_id`:** `item_id` es NULL en los de
texto libre, y en SQL dos NULL no colisionan, así que no impediría duplicar «Manuales» diez veces. El nombre
sí está siempre. Efecto lateral querido: el mismo artículo puede estar en dos clases del mismo modelo
(un filtro puede ser consumible en un equipo y accesorio en otro), pero no dos veces en la misma.

**Sin CHECK sobre `clase`:** la lista blanca vive en `shared` y la valida el servidor, como ya se hace con
`TIPOS_DOCUMENTO`. Un CHECK en la BD obligaría a una migración para añadir una clase futura.

## Autorización

**Leer: cualquier sesión.** El técnico que prepara una remisión tiene que ver qué lleva el equipo.
**Escribir: solo super administrador**, igual que el resto del catálogo maestro y la ficha del modelo.

## Endpoints

| Método | Ruta | Quién |
|---|---|---|
| `GET` | `/api/catalogo/modelos/:id/articulos` | sesión |
| `POST` | `/api/catalogo/modelos/:id/articulos` | superadmin |
| `PATCH` | `/api/catalogo/articulos/:id` (clase, orden, activo) | superadmin |
| `DELETE` | `/api/catalogo/articulos/:id` | superadmin |

El buscador de artículos ya existe: `GET /api/articulos` (`searchArticulos`), construido para la validación
del SKU. Se reutiliza tal cual, con el filtro por categoría como parámetro opcional.

## Pantalla

Dentro del modal de **ficha del modelo** que ya existe (donde viven SKU, foto y documentos), una sección
nueva con las **tres listas**. Cada fila muestra `SKU · nombre`, o solo el nombre si es texto libre, con
botones para reordenar, desactivar y borrar. El alta ofrece dos caminos: buscar un artículo de Books, o
escribir un ítem libre.

**Desactivar, no borrar, es la vía normal**: retira el artículo de las listas futuras sin tocar las remisiones
ya emitidas.

## Fases

**Fase 1 (esta):** tabla, repos, endpoints, UI de gestión. **NO se toca la remisión.**

**Fase 2 (después, cuando las listas estén pobladas):** que el checklist «Incluye» de la remisión de entrada
lea de `catalogo_articulos` (clase `accesorio`) en vez de `remision_checklist`.

⚠️ **Por qué NO se hace todo de una vez.** Hoy `GET /api/remisiones/nueva` llama a `getChecklist(db, perfil)`
y devuelve los ítems de `remision_checklist`, indexada por PERFIL (6 perfiles, 109 ítems). Si el consumo
cambiara a la tabla nueva estando vacía, **todas las remisiones se quedarían sin checklist de golpe** y el
técnico no tendría qué verificar al recibir un equipo. Separar las fases hace que la migración sea observable:
se puebla, se compara con lo que hoy devuelve el perfil, y solo entonces se conmuta.

## Decisión que necesita el visto bueho del usuario

**¿Se siembran las listas por modelo a partir del checklist actual?**

Hay 35 modelos y ~20 ítems por perfil. A mano son del orden de **700 filas**. Una siembra idempotente podría
copiar a cada modelo los ítems del perfil que hoy le corresponde (vía `perfilChecklist(marca, modelo)`) como
**clase `accesorio`**, dejándolos editables.

**Sembrar no es heredar**, y por eso no contradice la decisión 4: la herencia sería una regla viva —un modelo
sin lista mira a su perfil cada vez—, mientras que la siembra copia una vez y a partir de ahí cada modelo va
por su cuenta. Es un punto de partida, no un vínculo.

- **A favor:** convierte el trabajo manual en revisión; y los 109 ítems actuales ya son la lista real que usa
  el servicio técnico, no una invención.
- **En contra:** siembra ítems de texto libre (sin `item_id`), que es justo lo que Books vendría a evitar.
  Habría que enlazarlos a artículos poco a poco.
- **Alternativa:** empezar en blanco y que cada modelo se rellene eligiendo de Books, aceptando el trabajo
  manual a cambio de datos limpios desde el primer día.

## Fuera de alcance

Consumo en la rama de SALIDA de remisiones (bloqueada por otra decisión). Cantidades por artículo, precios y
stock: Books ya los tiene y duplicarlos aquí abriría una divergencia sin dueño claro.
