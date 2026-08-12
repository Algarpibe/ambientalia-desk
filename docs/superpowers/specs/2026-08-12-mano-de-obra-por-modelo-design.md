# Mano de obra por modelo — diseño

**Fecha:** 2026-08-12
**Estado:** aprobado por el usuario, pendiente de plan de implementación
**Continúa:** `2026-08-10-articulos-por-modelo-design.md` (accesorios, consumibles y repuestos, ya en producción).

## El problema

La ficha técnica de un modelo dice hoy qué **cosas** lleva el equipo (accesorios, consumibles y
repuestos), pero no qué **trabajo** se le hace. El código de mano de obra que corresponde a cada modelo
—el que se factura— vive fuera de la aplicación. El usuario lo quiere en la misma ficha, elegido de
Zoho Books artículo a artículo, y copiable a otros modelos igual que los accesorios.

## El hallazgo: casi todo está construido

`clase` es un discriminador parametrizado de punta a punta, y el esquema **no tiene `CHECK` sobre esa
columna a propósito** (`schema.sql:383`: «la lista blanca vive en shared y la valida el servidor […]
Un CHECK obligaría a migrar la BD para añadir una clase»). Consecuencias:

- **Sin migración SQL.** La tabla `catalogo_articulos` acepta la clase nueva tal cual.
- **Sin cambios en rutas ni en el repo.** Todo va parametrizado por `clase` y validado contra
  `CLASES_ARTICULO` (`routes/catalogo.ts:21`).
- **La sección se pinta sola.** El render de la ficha es un bucle `CLASES_ARTICULO.map(...)`
  (`CatalogoEquipos.tsx:914`).
- **Copiar a otros modelos sale gratis.** `copiarArticulos(db, origen, destinos, clase)` ya recibe la
  clase, y sus tests confirman que copia solo la pedida.

## Decisiones tomadas

Del usuario, en la sesión del 2026-08-12:

| Decisión | Elegida | Descartada |
|---|---|---|
| Cardinalidad | **Una lista**, como accesorios: varios códigos por modelo, ordenables arrastrando | Uno solo por modelo (409 al segundo): exige código nuevo y crea un callejón si un modelo necesita dos tarifas |
| Cómo se eligen | **Artículo a artículo desde Books**, como los accesorios | Por categorías de Books, como los consumibles |

## Qué cambia

### 1. La clase nueva

`'mano_obra'` entra en `CLASES_ARTICULO` (`packages/shared/src/types.ts:218`), con su doc explicando
qué es y por qué queda fuera del checklist «Incluye».

### 2. Un predicado en lugar de dos literales negados

La regla «esta clase admite categorías» vive hoy duplicada y en polaridades opuestas:

- `CatalogoEquipos.tsx:935` → `{clase !== 'accesorio' && (…selector de categorías…)}`
- `routes/catalogo.ts:169` → `if (clase === 'accesorio') { 422 }`

Con una tercera clase, esos dos literales se rompen: mano de obra heredaría el selector de categorías
sin que nadie lo decida. Se sustituyen por un predicado en `packages/shared/src/articulos.ts`, junto a
`clasePropuesta`:

```ts
export function admiteCategorias(clase: ClaseArticulo): boolean
```

Devuelve `true` solo para `consumible_repuesto`. Lo consultan la UI (para mostrar el selector) y el
servidor (para el 422). Es la única definición de la regla.

Esto es lógica, no cableado: va con TDD y test propio en shared.

### 3. El 422 pasa a ser genérico

El mensaje de hoy nombra los accesorios (`'Los accesorios se añaden artículo a artículo, no por
categoría.'`). Pasa a redactarse desde la clase, para que sirva a las dos que no admiten categorías.

**Corrección (2026-08-12, al escribir el plan):** una versión anterior de este spec decía que no
existía ningún test de este 422. Es **falso**: está cubierto en `app.test.ts:1595`, dentro del test
«asigna categorías de consumibles y repuestos…», no como `it` propio — por eso no apareció en la
búsqueda inicial. El plan añade una aserción a ese test para la clase nueva, en vez de duplicar el
montaje con un test aparte.

### 4. Textos de la ficha

- `ETIQUETA_CLASE` → `'Mano de obra'`; `ETIQUETA_CLASE_PLURAL` → `'Mano de obra'` (no tiene plural
  distinto). TypeScript obliga a rellenar ambos mapas: son `Record<ClaseArticulo, string>`.
- El párrafo introductorio de la sección se reescribe para nombrar las tres listas y decir que la mano
  de obra, como los accesorios, se elige artículo a artículo.
- La sección aparece **la última**, por el orden del array `CLASES_ARTICULO`.

## Lo que NO se toca

**El checklist «Incluye» de la remisión.** Filtra `a.clase === 'accesorio'` en un único punto
(`checklistRemision.ts:40`), así que la mano de obra queda fuera automáticamente. Es lo correcto:
«Incluye» es lo que **acompaña** al equipo cuando entra, no lo que se le factura. Tampoco se toca la
lista blanca del servidor que valida los ítems al crear la remisión (`routes/remision.ts:162`), que
se alimenta de la misma función.

Tampoco: esquema SQL, `db/catalogoArticulos.ts`, `routes/catalogo.ts` salvo el 422, ni el cliente API.

## Errores

Nada nuevo. El alta con `itemId` inexistente ya da 422 «Artículo no encontrado en Zoho Books»; el
nombre repetido en la misma clase, 409; y el mismo código de mano de obra **sí puede** estar en dos
modelos distintos (la unicidad es por `(modelo_id, clase, nombre)`).

## Verificación

Suite completa, typecheck, lint (158 warnings exactos) y build, en secuencia. Prueba manual del
usuario al desplegar:

1. Abrir la ficha de un modelo → aparece la sección «Mano de obra», vacía, en ámbar («sin definir»).
2. Añadir un código desde el buscador de Books → queda listado con su SKU.
3. Copiarlo a otros modelos → el reparto se informa como en accesorios.
4. Crear una remisión de entrada de un equipo de ese modelo → «Incluye» **no** lista la mano de obra.
5. Comprobar que la sección de mano de obra no ofrece desplegable de categorías.
