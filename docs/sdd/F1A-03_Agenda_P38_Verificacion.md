# Punto de agenda · Anexo D nº 38 — las dos salidas de `Verificación`

> **Para la sesión del viernes 11/09/2026.** Una página. El punto es de **Gustavo / Calidad**
> (`R08.1.md:4005`) y hoy bloquea una tanda del plan, así que conviene cerrarlo en esa sesión.
>
> **Las citas de línea al plan (`plan:NNN` y `…ClaudeCode_R01.1.md:NNN`) de este documento se leen contra el plan en `a5da6b8` (539 líneas), NO contra el de hoy** (caso B/C de la regla de mutación 4 de `CLAUDE.md`): el plan creció a 598 líneas el 2026-09-17 al sincronizarse con el libro R01.3, y renumerarlas volvería falsas las frases que citan texto ya corregido. Lo que sigue no propone una respuesta: expone la que el maestro dejó a medias y las dos que se
> derivan de ella. Quien decide es Calidad, con Servicio Técnico.

---

## En una frase

En el flujo de **equipo nuevo**, el estado `Verificación` —el control de calidad— **no tiene ninguna
transición de salida**. Un equipo enviado a verificación no puede volver al flujo, ni aprobado ni
rechazado. Hay que definir esas dos salidas antes de que el flujo se construya.

## Por qué se decide ahora y no cuando se construya

Porque **construirlo bien cuesta lo mismo que construirlo mal, y corregirlo después no.** La rama de
equipo nuevo no está implementada (`R08.1.md:1445`), así que hoy la corrección es escribir dos filas
en una tabla. Después de F1B-06 sería cambiar una máquina de estados con tickets vivos dentro.

Y hay un segundo consumidor esperando: la corrección **C6** —introducir una etapa de QA antes de la
liberación en servicio técnico— quiere **modelarse sobre esta**, en lugar de diseñarla de cero
(`:2592`, `acta:149`). Mientras `Verificación` no tenga salidas, C6 no tiene modelo que copiar.

---

## Lo que hay que decidir

### 1 · La pregunta previa, que puede cambiar las otras dos

`R08.1.md:1468` la deja escrita y **sin contestar**:

> «Pendiente de validar con Servicio Técnico cuál es el comportamiento real de esta etapa antes de
> definir sus salidas: **puede ser que el retorno exista en la práctica y no esté modelado, o que la
> etapa se use como registro y no como paso del flujo.**»

Son dos cosas muy distintas:

- Si `Verificación` es **un paso del flujo**, necesita las dos salidas y la decisión sigue abajo.
- Si se usa **como registro** —se anota que se verificó, pero el equipo nunca «se va» allí—, entonces
  no es un estado del grafo y el arreglo es otro: un campo, no dos transiciones.

**Quien contesta esto es Servicio Técnico**, y conviene contestarlo primero.

### 2 · La salida «aprobada»: ¿a dónde vuelve?

El maestro propone la corrección pero **deja el destino sin elegir** (`:1470`):

> «definir las dos salidas que la etapa necesita —aprobada, **que devuelve a `En Proceso` o pasa a
> `Finalizado`**, y rechazada, que debería entroncar con el bucle de producto no conforme»

Las dos opciones no son equivalentes:

| Opción | Qué significa | Consecuencia |
|---|---|---|
| `Verificación → En Proceso` | La verificación es un control **intermedio**: se aprueba y el equipo sigue trabajándose | El equipo pasa por `Liberación` después. Hay una etapa más antes de terminar |
| `Verificación → Finalizado` | La verificación es el **último** control: aprobar es terminar | Se salta `Liberación`, que hoy es la que cierra el flujo |

### 3 · La salida «rechazada»: confirmar el destino

Aquí el maestro sí se moja: «debería entroncar con **el bucle de producto no conforme**». En el mapeo
del 03/02 ese bucle es `En Proceso → Producto no conforme → Notificado → Análisis y acciones →
Ingresado`. Sólo hay que **confirmar** que rechazar en `Verificación` entra por `Notificado`, que es
donde empieza ese bucle.

---

## Qué desbloquea

| Se desbloquea | Cómo |
|---|---|
| **F1A-03** | Es la tanda que declara estas dos salidas. Hoy está parada: se ejecutó, no escribió código y devolvió el punto |
| **F1B-06** | Implementa los blueprints de equipo nuevo y soporte remoto, y **hereda C12** (`plan:155`). Sin la decisión, construiría el flujo con el mismo agujero que tiene hoy |
| **C6** (QA antes de la liberación) | `acta:149` la declara «condicionada a C12». Es la que quiere usar `Verificación` como modelo |

---

## Nota de método, para que el punto no se pierda otra vez

Este punto llegó a la convocatoria del 03/09 clasificado bajo «**Cierran sin discusión — las ejecuta
desarrollo**» (`acta:136`, `:139`), y de ahí pasó al plan como «Gate: **Ninguno**» (`plan:140`). El
Anexo D del maestro lo tenía —y lo tiene— asignado a **Gustavo / Calidad** como punto **abierto**
(`:4002-4005`).

No es un error de nadie en particular: es un dato que se perdió en un salto de documento. Queda
anotado como entrada 2 de `docs/sdd/F0-01_Correcciones_para_el_plan.md` para que el plan lo recupere.

---

## Referencias, por si hacen falta en la mesa

| Dónde | Qué hay |
|---|---|
| `R08.1.md:1444-1470` | M1.4, el flujo de equipo nuevo completo: cinco transiciones, cinco estados |
| `R08.1.md:1466-1470` | «Verificación no tiene salida», el estado en la R08 y la corrección C12 |
| `R08.1.md:4002-4005` | Anexo D nº 38, con el propietario |
| `R08.1.md:2592` | La conexión con C6 |
| `docs/analisis-tickets/DF-equipo-nuevo-030226.xlsx` | La hoja de mapeo original del 03/02 |
