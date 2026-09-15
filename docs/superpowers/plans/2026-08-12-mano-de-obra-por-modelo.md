# Mano de obra por modelo — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que la ficha técnica de un modelo tenga una tercera lista, «Mano de obra», donde se eligen códigos de Zoho Books artículo a artículo y se copian a otros modelos, igual que los accesorios.

**Architecture:** el subsistema ya está parametrizado por `clase`, y el esquema **no tiene `CHECK` sobre esa columna a propósito** (`schema.sql:383`), así que no hay migración SQL ni cambios en el repo. Tres tareas: (1) un predicado nuevo en shared que sustituye a dos literales negados que hoy expresan la misma regla en polaridades opuestas; (2) la clase nueva y el 422 del servidor apoyado en ese predicado; (3) el cableado de la ficha, donde la sección se pinta sola desde el bucle `CLASES_ARTICULO.map(...)`. Spec: `docs/superpowers/specs/2026-08-12-mano-de-obra-por-modelo-design.md`.

**Tech Stack:** TypeScript ESM, vitest + pg-mem + supertest (server), React 19 + Tailwind (apps/desk, sin harness de componentes).

**Regla del proyecto:** tras ver pasar cada test nuevo, mutar la implementación para comprobar que el test muerde, y deshacer la mutación. Verificaciones siempre desde la raíz y en secuencia (nunca lint, test y build a la vez).

**Orden de las tareas:** la 1 debe ir antes que la 2 porque la ruta importa el predicado. La 2 antes que la 3 porque `ETIQUETA_CLASE` es un `Record<ClaseArticulo, string>` y no compila hasta que la clase existe.

---

### Task 1: el predicado `admiteCategorias` en shared

Hoy la regla «esta clase se asigna por categorías de Books» vive duplicada y en polaridades opuestas: `clase !== 'accesorio'` en la interfaz y `clase === 'accesorio'` en el 422 del servidor. Con una tercera clase, ambos literales dan la respuesta equivocada: la mano de obra heredaría el desplegable de categorías sin que nadie lo haya decidido. Esta tarea crea la única definición de la regla, **antes** de añadir la clase.

**Files:**
- Modify: `packages/shared/src/articulos.ts` (función nueva al final del fichero)
- Test: `packages/shared/src/articulos.test.ts` (describe nuevo al final)

- [ ] **Step 1: escribir el test que falla**

En `packages/shared/src/articulos.test.ts`, cambiar la primera línea de import por:

```ts
import { clasePropuesta, admiteCategorias } from './articulos'
```

y añadir al final del fichero, después del último `})`:

```ts
describe('admiteCategorias', () => {
  // La categoría trae BLOQUES: decenas de artículos de una serie entera. Sirve para consumibles y
  // repuestos, donde la lista es la misma para toda la serie.
  it('los consumibles y repuestos se derivan de categorías', () => {
    expect(admiteCategorias('consumible_repuesto')).toBe(true)
  })

  // Accesorios y mano de obra se eligen PIEZA a pieza: de una categoría de serie la mayoría no aplica
  // a la variante concreta, y acababa desactivándose uno a uno.
  it('los accesorios y la mano de obra se eligen artículo a artículo', () => {
    expect(admiteCategorias('accesorio')).toBe(false)
    expect(admiteCategorias('mano_obra')).toBe(false)
  })
})
```

⚠️ `'mano_obra'` todavía no existe en `ClaseArticulo`: el fichero **no compila** hasta la Task 2. Es deliberado —el test se escribe antes que el código— y vitest lo ejecuta igualmente porque esbuild no comprueba tipos. El `npm run typecheck` no se corre hasta la Task 3.

- [ ] **Step 2: verlo fallar**

Run: `npm test -- packages/shared/src/articulos.test.ts`
Expected: FAIL — `admiteCategorias is not a function`.

- [ ] **Step 3: implementación mínima**

Añadir al final de `packages/shared/src/articulos.ts`:

```ts
/**
 * ¿Esta clase se asigna por categorías de Zoho Books, o artículo a artículo?
 *
 * La categoría trae **bloques**: una de serie arrastra decenas de artículos, y eso solo compensa en
 * consumibles y repuestos, donde la lista es la misma para toda la serie. En accesorios se probó y se
 * retiró —la mayoría no aplicaba a la variante concreta y acababa desactivándose uno a uno—, y la mano
 * de obra nace ya con esa lección aprendida.
 *
 * Vive aquí, y no como un literal en cada sitio, porque la consultan DOS capas: la pantalla, para
 * mostrar el desplegable, y el servidor, para rechazar con 422 lo que llegue por la API a mano. Cuando
 * eran dos literales negados, cada clase nueva heredaba el desplegable sin que nadie lo decidiera.
 */
export function admiteCategorias(clase: ClaseArticulo): boolean {
  return clase === 'consumible_repuesto'
}
```

- [ ] **Step 4: verlo pasar**

Run: `npm test -- packages/shared/src/articulos.test.ts`
Expected: PASS (6 tests: los 4 de `clasePropuesta` + los 2 nuevos).

- [ ] **Step 5: mutar para comprobar que el test muerde**

Cambiar el cuerpo a `return clase !== 'accesorio'` (la regla vieja, la que este cambio viene a corregir). Correr el test → debe FALLAR en el caso de `'mano_obra'`. Deshacer y correr otra vez → verde. Si la mutación sobrevive, el test no cubre lo que importa: parar y arreglarlo.

- [ ] **Step 6: commit**

```bash
git add packages/shared/src/articulos.ts packages/shared/src/articulos.test.ts
git commit -m "refactor(shared): admiteCategorias sustituye a dos literales negados

La regla «esta clase se asigna por categorías» estaba escrita dos
veces y en polaridades opuestas: clase !== 'accesorio' en la pantalla
y clase === 'accesorio' en el 422. Con una clase nueva las dos dan la
respuesta equivocada, y la heredaría sin que nadie lo decidiera.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: la clase `mano_obra` y el 422 genérico

**Files:**
- Modify: `packages/shared/src/types.ts:208-219` (doc y constante)
- Modify: `apps/desk/server/routes/catalogo.ts:14` (import) y `:164-172` (el 422)
- Test: `apps/desk/server/app.test.ts:1595` en `db3b807` (una aserción más en el test que ya cubre esta puerta)

- [ ] **Step 1: escribir la aserción que falla**

⚠️ **Corrección sobre el spec:** el spec afirma que no existe test del 422 de «accesorio por categoría». **Es falso**: está cubierto en `app.test.ts:1595`, dentro del test «asigna categorías de consumibles y repuestos, y deriva de ellas la lista», no como `it` propio. Por eso aquí no se añade un test nuevo —sería duplicar el montaje— sino una aserción a la que ya existe.

En `apps/desk/server/app.test.ts`, reemplazar las líneas 1593-1596:

```ts
    // La vía de bloque queda solo para consumibles y repuestos: los accesorios se eligen artículo a
    // artículo, y la puerta se cierra en el SERVIDOR, no solo escondiendo el desplegable.
    expect((await asignar('accesorio', 'Opcional AP Series')).status).toBe(422)
    expect((await asignar('consumible_repuesto', 'C&R AP Series')).status).toBe(201)
```

por:

```ts
    // La vía de bloque queda solo para consumibles y repuestos: accesorios y mano de obra se eligen
    // artículo a artículo, y la puerta se cierra en el SERVIDOR, no solo escondiendo el desplegable.
    expect((await asignar('accesorio', 'Opcional AP Series')).status).toBe(422)
    expect((await asignar('mano_obra', 'Opcional AP Series')).status).toBe(422)
    expect((await asignar('consumible_repuesto', 'C&R AP Series')).status).toBe(201)
```

(Helpers reales del fichero, ya definidos en ese describe: `prepararModelo()` en la línea 1553, `adminCookie()` y `appWith()`, y el `asignar(clase, categoria)` local de la línea 1590. No hace falta ninguno nuevo.)

⚠️ **No correr el test todavía.** Con `'mano_obra'` aún fuera de `CLASES_ARTICULO`, la ruta devuelve 422 por «Clase de artículo desconocida» y la aserción **pasaría por el motivo equivocado**. El fallo real solo aparece cuando la clase existe: por eso el orden aquí es aserción → clase → ver fallar. Correr el test ahora daría un verde engañoso.

- [ ] **Step 2: añadir la clase**

En `packages/shared/src/types.ts`, reemplazar el bloque de doc y la constante (líneas 208-219) por:

```ts
/**
 * Para qué sirve un artículo dentro de un modelo.
 *
 * Consumible y repuesto van juntos, por decisión del usuario (2026-08-10) y porque Zoho Books tampoco
 * los separa — los agrupa bajo la categoría `C&R …`. Separarlos obligaba a clasificar a mano una
 * distinción que ni el catálogo de origen hace.
 *
 * El accesorio se verifica al recibir y devolver el equipo (es el checklist «Incluye» de la remisión);
 * el consumible/repuesto se repone o se cambia durante el servicio; la **mano de obra** no es una cosa
 * que viaje con el equipo sino el trabajo que se le hace, y por eso queda fuera de ese checklist
 * (`checklistRemision.ts` filtra accesorios).
 *
 * El orden de este array es el de las secciones en la ficha técnica.
 */
export const CLASES_ARTICULO = ['accesorio', 'consumible_repuesto', 'mano_obra'] as const
export type ClaseArticulo = (typeof CLASES_ARTICULO)[number]
```

- [ ] **Step 3: verlo fallar (ahora sí, por el motivo correcto)**

Run: `npm test -- apps/desk/server/app.test.ts`
Expected: FAIL — `expected 201 to be 422` en la aserción de `'mano_obra'`. La clase ya existe y es válida, pero la condición del 422 sigue mirando solo a `'accesorio'`, así que la categoría se asigna. Ese es exactamente el agujero que este cambio cierra.

- [ ] **Step 4: el 422 pasa a apoyarse en el predicado**

En `apps/desk/server/routes/catalogo.ts`, línea 14 aproximadamente, localizar el import de `@ambientalia/shared` y añadir `admiteCategorias` a lo que ya importa de ahí. Si `esClaseArticulo` viene de ese import, queda como:

```ts
import { esClaseArticulo, admiteCategorias } from '@ambientalia/shared'
```

⚠️ Comprobar de dónde sale `esClaseArticulo` antes de editar: si viene de otro módulo, añadir una línea de import aparte para `admiteCategorias` en vez de mezclarlos.

Después, reemplazar las líneas 164-172:

```ts
    // Los accesorios se eligen pieza a pieza, no por bloque: una categoría de serie trae decenas de
    // artículos y la mayoría no aplica a la variante concreta, así que se acababa desactivando uno a
    // uno. La puerta se cierra AQUÍ y no solo en la pantalla: esconder el desplegable dejaría la vía
    // abierta a cualquiera que llamase a la API a mano, y volvería a haber modelos con categorías de
    // accesorios que la interfaz ya no sabe gestionar.
    if (clase === 'accesorio') {
      res.status(422).json({ error: 'Los accesorios se añaden artículo a artículo, no por categoría.' })
      return
    }
```

por:

```ts
    // Hay clases que se eligen pieza a pieza: una categoría de serie trae decenas de artículos y la
    // mayoría no aplica a la variante concreta, así que se acababa desactivando uno a uno. La puerta
    // se cierra AQUÍ y no solo en la pantalla: esconder el desplegable dejaría la vía abierta a
    // cualquiera que llamase a la API a mano, y volvería a haber modelos con categorías que la
    // interfaz ya no sabe gestionar.
    if (!admiteCategorias(clase)) {
      res.status(422).json({ error: `${ETIQUETA_CLASE_PLURAL_SERVIDOR[clase]} se añaden artículo a artículo, no por categoría.` })
      return
    }
```

y añadir, justo encima de la función `registerCatalogoRoutes` en ese mismo fichero:

```ts
/** Cómo se nombra cada clase en los mensajes de error. La pantalla tiene sus propias etiquetas. */
const ETIQUETA_CLASE_PLURAL_SERVIDOR: Record<ClaseArticulo, string> = {
  accesorio: 'Los accesorios',
  consumible_repuesto: 'Los consumibles y repuestos',
  mano_obra: 'Los códigos de mano de obra',
}
```

Esto exige que `ClaseArticulo` esté importado como tipo en `catalogo.ts`. Si no lo está, añadir:

```ts
import type { ClaseArticulo } from '@ambientalia/shared'
```

- [ ] **Step 5: verlo pasar**

Run: `npm test -- apps/desk/server/app.test.ts`
Expected: PASS, todo el fichero en verde.

- [ ] **Step 6: mutar para comprobar que el test muerde**

Cambiar la condición a `if (clase === 'accesorio')` (la regla vieja). Correr el test → debe FALLAR en el caso `'mano_obra'`, que ahora recibiría un 201 en vez de un 422. Deshacer y correr otra vez → verde.

- [ ] **Step 7: commit**

```bash
git add packages/shared/src/types.ts apps/desk/server/routes/catalogo.ts apps/desk/server/app.test.ts
git commit -m "feat(desk): clase mano_obra y 422 por clase al asignar categorías

La ficha decía qué cosas lleva el equipo pero no qué trabajo se le
hace. La clase nueva no necesita migración: el esquema no tiene CHECK
sobre `clase` justo para esto. El 422 pasa a redactarse desde la
clase y a decidirse con admiteCategorias, y gana el test que nunca
tuvo.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: la sección en la ficha técnica

La sección se pinta sola —el render es `CLASES_ARTICULO.map(...)`—, así que aquí solo hay etiquetas, la condición del desplegable y el texto explicativo.

**Files:**
- Modify: `apps/desk/src/components/CatalogoEquipos.tsx:15-20` en `db3b807` (etiquetas), `:897-905` (texto de la sección), `:935` (condición del desplegable)

- [ ] **Step 1: las etiquetas**

En `apps/desk/src/components/CatalogoEquipos.tsx`, reemplazar los dos mapas de las líneas 13-19 por:

```tsx
const ETIQUETA_CLASE: Record<ClaseArticulo, string> = {
  accesorio: 'Accesorio', consumible_repuesto: 'Consumible o repuesto', mano_obra: 'Mano de obra',
}
const ETIQUETA_CLASE_PLURAL: Record<ClaseArticulo, string> = {
  accesorio: 'Accesorios', consumible_repuesto: 'Consumibles y repuestos', mano_obra: 'Mano de obra',
}
```

(«Mano de obra» es igual en singular y plural: no es un contable como «accesorios».)

- [ ] **Step 2: importar el predicado**

En el mismo fichero, localizar el import de `@ambientalia/shared` que ya trae `CLASES_ARTICULO` y añadirle `admiteCategorias`. Si `CLASES_ARTICULO` y `ClaseArticulo` vienen en líneas separadas (uno como valor y otro como `import type`), `admiteCategorias` va en la de valores.

- [ ] **Step 3: la condición del desplegable**

Reemplazar las líneas 931-935 (el comentario y la apertura del condicional):

```tsx
                    {/* Los accesorios NO se asignan por categoría: una categoría de serie trae decenas
                        de artículos y la mayoría no aplica a la variante concreta, así que se acababa
                        desactivando uno a uno. Se eligen pieza a pieza con el buscador de abajo. El
                        servidor rechaza esa clase igualmente — esto no es la única defensa. */}
                    {clase !== 'accesorio' && (
```

por:

```tsx
                    {/* Accesorios y mano de obra NO se asignan por categoría: una categoría de serie
                        trae decenas de artículos y la mayoría no aplica a la variante concreta, así que
                        se acababa desactivando uno a uno. Se eligen pieza a pieza con el buscador de
                        abajo. El servidor rechaza esas clases igualmente — esto no es la única defensa. */}
                    {admiteCategorias(clase) && (
```

- [ ] **Step 4: el texto de la sección**

Reemplazar el encabezado y el párrafo de las líneas 897-905:

```tsx
            <section>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Accesorios, consumibles y repuestos</h4>
              <p className="text-[11px] text-slate-400 mb-2">
                Los <strong>accesorios</strong> se eligen artículo a artículo. Los <strong>consumibles y
                repuestos</strong> se derivan además de las categorías de Zoho Books que asignes: lo que se
                añada allí a una categoría aparecerá aquí solo, y un modelo de una serie lleva la categoría de
                la serie y, si la tiene, la suya propia. En las dos listas puedes añadir artículos sueltos de
                Books, para lo que viva en una categoría que no le toca a este modelo.
              </p>
```

por:

```tsx
            <section>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Artículos del modelo</h4>
              <p className="text-[11px] text-slate-400 mb-2">
                Los <strong>accesorios</strong> y la <strong>mano de obra</strong> se eligen artículo a
                artículo. Los <strong>consumibles y repuestos</strong> se derivan además de las categorías de
                Zoho Books que asignes: lo que se añada allí a una categoría aparecerá aquí solo, y un modelo
                de una serie lleva la categoría de la serie y, si la tiene, la suya propia. En las tres listas
                puedes añadir artículos sueltos de Books, para lo que viva en una categoría que no le toca a
                este modelo. La <strong>mano de obra</strong> es el trabajo que se le hace al equipo, no algo
                que venga con él: no sale en el checklist «Incluye» de la remisión.
              </p>
```

- [ ] **Step 5: verificación completa, en secuencia**

Run (desde la raíz, uno tras otro, nunca a la vez):

1. `npm test` — Expected: 692 passed | 2 skipped (los 689 de la línea base + 2 del predicado + 1 del 422).
2. `npm run typecheck` — Expected: limpio, exit 0. Aquí es donde se comprueba de verdad que los dos `Record<ClaseArticulo, string>` están completos.
3. `npm run lint` — Expected: **0 errores y 158 warnings EXACTOS**. Un warning de diferencia es regresión: parar y mirar.
4. `npm run build` — Expected: build de Vite sin errores.

- [ ] **Step 6: commit y push**

```bash
git add apps/desk/src/components/CatalogoEquipos.tsx docs/superpowers/plans/2026-08-12-mano-de-obra-por-modelo.md
git commit -m "feat(desk): la ficha del modelo lista también la mano de obra

Tercera sección de la ficha, para el código de Books que se factura al
trabajar ese modelo. Se elige artículo a artículo y se copia a otros
modelos como los accesorios; el desplegable de categorías ahora se
decide con admiteCategorias en vez de por el nombre de una clase.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 7: pedir la prueba manual al usuario (tras desplegar)**

1. Abrir la ficha de un modelo → aparece la sección «Mano de obra», vacía, con el aviso de «sin definir».
2. Añadir un código desde el buscador de Books → queda listado con su SKU.
3. «Copiar a otros modelos…» en esa sección → el reparto se informa como en accesorios.
4. Crear una remisión de entrada de un equipo de ese modelo → «Incluye» **no** lista la mano de obra.
5. La sección de mano de obra no ofrece desplegable «+ categoría de Books…»; la de consumibles sí.
