# Paquete de despliegue — 2026-10-10 (c), adenda: dos correcciones a la adenda (b)

Adenda a los paquetes fechados anteriores, que **no se editan**. Corrige dos puntos de
`docs/sdd/Paquete_de_Despliegue_2026-10-10b.md`. **Donde esta adenda y la (b) digan cosas distintas, vale ésta.**

**De dónde sale cada dato.** Ninguna sesión de construcción entra en producción. Lo que aquí se dice de producción
es **dato aportado por Alfonso el 2026-10-10**; esta sesión no lo ha repetido. Lo que se dice del código se leyó en
el árbol de `add7233`, con ruta y línea.

---

## 1 · Alfonso SÍ tiene cargo de permiso y de texto libre

La adenda (b) dejó a Alfonso con «No consta» en los dos campos de cargo
(`docs/sdd/Paquete_de_Despliegue_2026-10-10b.md:70`) y entre lo que «este registro no dice»
(`docs/sdd/Paquete_de_Despliegue_2026-10-10b.md:79`). **Era una omisión del encargo, no del dato:** la consulta de
`public.users` del 10/10 mostró a Alfonso García del Pino Beneitez como administrador, sin rol, con:

| Campo | Valor |
|---|---|
| Rol | Sin rol; es administrador |
| Cargo de permiso | `Director Comercial` |
| Cargo de texto libre | «Director Comercial» |

Coincide con la tabla de Gerencia, que le asigna ese cargo (`openspec/config.yaml:4453`,
`decision/tabla-de-cargos-y-personas-10-10`). `Director Comercial` es un valor del catálogo de cargos de permiso
(`packages/shared/src/cargos.ts:14`). Lo que la (b) decía de las guardas sigue siendo cierto: como administrador,
Alfonso las pasa todas, con cargo o sin él.

De la tabla de la (b) siguen sin constar el rol y los valores exactos de Gustavo, Ángela y Johny, y el rol de José
Manuel.

## 2 · El worker NO se redesplegó el 10/10

La (b) decía que **no constaba** si el worker se había redesplegado
(`docs/sdd/Paquete_de_Despliegue_2026-10-10b.md:183-184`). **Ahora consta que no:** Alfonso declara que el 10/10
sólo desplegó el servicio `ambientalia-desk`.

**Consecuencia.** `afa4252` —que añade los pagos de clientes y sus aplicaciones a facturas al barrido de Books
(`packages/zoho-sync/src/booksHub/sync.ts:190-192`)— está en el código publicado de la App, pero **no está activo en
el worker**, que es el único proceso que programa el barrido (`apps/hub-sync/src/hub-sync.ts:68`). El barrido sigue
activo y borrando (`SWEEP_ENABLED=true`, `SWEEP_DRY_RUN=false`, `docs/sdd/Paquete_de_Despliegue_2026-10-10b.md:167-168`),
pero **todavía no alcanza a `books.customer_payments` ni a `books.customer_payment_invoices`**.

**Sigue sin constar con qué commit corre el worker.** Es la hipótesis 2 del consolidado
(`docs/sdd/Paquete_de_Despliegue_2026-10-09.md:1133`), sin medir.

### El redespliegue del worker, como paso aparte

Queda pendiente y sujeto a las dos condiciones del consolidado:

- **(h)** mirar `SWEEP_ENABLED` y `SWEEP_DRY_RUN` antes de redesplegar
  (`docs/sdd/Paquete_de_Despliegue_2026-10-09.md:228-241`);
- **(i)** justo después, el bloque 2 de §4.5 sobre `zoho-hub`; si falta una de las tres columnas de `tickets`, se
  revierte el worker (`docs/sdd/Paquete_de_Despliegue_2026-10-09.md:244-257`).

**Recomendación.** Antes de redesplegar, poner `SWEEP_DRY_RUN=true`: con cualquier valor distinto de `false` el
barrido no borra (`packages/zoho-sync/src/config.ts:119`). Tras el primer barrido, leer en el registro qué pagos
habría borrado, y sólo entonces volver a `false`. La razón es la de (h): **una reversión de código no recupera lo
borrado**. Poner `true` frena también el barrido de las demás tablas, que hoy borra a propósito porque lo pidió
otra aplicación que consume el hub (`docs/sdd/Paquete_de_Despliegue_2026-10-10b.md:175-176`); cuánto tiempo puede
estar frenado lo decide quien lo encendió.

## 3 · Lo que cambia en la (b)

| Dónde | Decía | Vale ahora |
|---|---|---|
| (b) §3.1, fila de Alfonso | Cargos: «No consta» | `Director Comercial` en los dos |
| (b) §3.1, «lo que este registro no dice» | Si Alfonso lleva `Director Comercial` | Lo lleva |
| (b) §5, último párrafo | No consta si el worker se redesplegó | No se redesplegó; el commit sigue sin constar |
| (b) §10 | El redespliegue del worker, sin resultado | Pendiente, con (h), (i) y `SWEEP_DRY_RUN=true` |

## 4 · Pendientes de persona

| Tarea | Dueño |
|---|---|
| Averiguar con qué commit corre el worker | Persona con acceso a producción |
| Redesplegar el worker con `SWEEP_DRY_RUN=true`, cumplir (h) e (i), leer el registro y decidir si vuelve a `false` | Alfonso |
