# Diseño: alta del equipo nuevo desde el ticket (F1B-14, cambio 1, `cierra: no`)

Medido contra el árbol de `ea23634` el 2026-09-24. Lo que no lleva ruta:línea lleva «hipótesis».

## Enfoque técnico

La rama «Equipo nuevo» sin `equipoId` se resuelve en un módulo nuevo, `apps/desk/server/services/equipoNuevo.ts`.
`createManagedTicket` sólo gana tres puntos de llamada, **editados en su sitio**: desplazamiento neto cero
desde la línea 26 (§6). Se separan validar y escribir. Las guardas A corren arriba; la validación C de los
campos, justo antes del `409` (D). El equipo y el ticket se escriben en UNA transacción, después de todas las guardas.

## Decisiones

| Tema | Elegida | Rechazada | Por qué |
|---|---|---|---|
| Atomicidad | `enTransaccion<T>` genérico en `apps/desk/server/db/transaccion.ts`, mismo molde que `eliminarTicket.ts:175-189` y `repo.ts:299-314`. Dentro: `createEquipo(q)` + `createTicket(q, input, { transaccionAbierta: true })` | (ii) pasar a `createTicket` un envoltorio sin `connect` | (ii) depende de un pato implícito (`repo.ts:404`). El flag es explícito. **Hipótesis (pg, no medido aquí):** un `PoolClient` de `pg` tiene `connect` y rechaza el segundo `connect()`, así que pasarle el cliente de la transacción rompería en producción y quizá no en pg-mem |
| Cambio en `repo.ts` | Firma de `:380` con 3.er parámetro `opts: { transaccionAbierta?: boolean } = {}`; condición de `:404` con `opts.transaccionAbierta \|\|` delante. Las dos líneas se editan en su sitio | Extraer `run` a una función exportada | Cero desplazamiento en `repo.ts`: RQ-TC-06 cita `:380-417` y `:403-415` |
| Validación de los 6 campos | `export` en su sitio de `camposHojaDeVida` (`routes/equipos.ts:144`) y llamarla desde el servicio | Moverla a un módulo de servicio | Moverla cuesta ≈150 líneas de diff y mueve `:144-189`, que está citado. La regla 13 no aplica: las dos partes son servidor y no se duplica nada. **Deuda anotada:** moverla en `edicion-comercial-equipo`, que reescribe ese fichero |
| Reutilizar por serial | `getEquipoBySerial`, **añadida al FINAL** de `db/equipos.ts` (sin desplazamiento) | Insertarla tras `getEquipo` (`:77-80`) | Esa posición desplaza `createEquipo :119` y lo que sigue |
| Cliente | Bloque en línea dentro de `CreateTicket.tsx` | Reutilizar o exportar `EquipoForm` (`EquiposAdmin.tsx:95`) | `EquipoForm` es un modal con envío propio (`createEquipo`, `:176`) y selector de cliente: no sirve de subformulario sin extraerlo, y la propuesta lo deja fuera |

## 1 · Subtabla de precedencia de la rama «Equipo nuevo» sin `equipoId`

Los números de línea son los de hoy y **siguen iguales tras el cambio** (§6).

| # | Guarda | Escalón | Respuesta | Dónde |
|---|---|---|---|---|
| 1 | Faltan datos del equipo nuevo: serie, `modeloId`, `fechaFacturaCompra` (se listan **todos**) | A | `422 'Faltan datos del equipo nuevo: …'` | `exigirEquipoNuevo`, llamada en `ticketService.ts:24` |
| 2 | El modelo no está en el catálogo (`getModelo`, `db/catalogo.ts:135`) | A | `422 'Modelo no encontrado'` | ídem |
| — | *Resolución, no guarda:* `getEquipoBySerial`. Si el serial existe, se toma ese equipo; si no, un equipo provisional (`id ''`, marca, modelo y tipo del catálogo, sin `clientId`) | — | — | ídem |
| 3 | La OV no existe en Books | A | sin cambios | `:35-37` |
| 4 | Discrepancia equipo↔cliente. Sólo salta si se reutilizó un equipo de otro cliente; con el provisional (`clientId` vacío) no entra ninguna rama | C | sin cambios | `:59-77` |
| 5 | Obligatorios del ticket | C | sin cambios | `:81-86` |
| 6 | El cliente no existe | C | sin cambios | `:87-88` |
| 7 | **Campos de la hoja de vida** (mantenedor, 3 fechas, Drive) con `camposHojaDeVida` | C | `422` con el mensaje de F1B-02 | **nueva, `:89`** |
| 8 | OV ya asociada a otro ticket | D | `409` | `:94-98` |
| — | Escritura en transacción: `createEquipo` (sólo si es provisional) y después `createTicket` | — | `201` | `:101`, `crearTicketConEquipo` |

- **Mantenimiento y Soporte remoto no cambian de orden.**
  - `:23` pasa a `if (!equipoId && b.clasificaciones !== 'Equipo nuevo') throw 'Falta el equipo'`: mismo mensaje, misma línea.
  - Con `equipoId`, gana siempre el camino registrado, aunque la clasificación sea «Equipo nuevo». En ese caso `equipoNuevo` se ignora.
- **Supuesto (c1):** el payload se valida **entero aunque el serial ya exista**. Que la petición sea válida no depende del estado del registro. Si el equipo se reutiliza, sus datos se descartan y no se escriben.
- **Supuesto (c2):** `camposHojaDeVida` se reutiliza como unidad en el escalón C.
  - Su «Mantenedor no encontrado» es existencia de una referencia **opcional**, no del sujeto, y conserva su orden interno de F1B-02 (`routes/equipos.ts:139-142`).
  - Partirla para subir esa comprobación a A la duplicaría. Queda declarado para que no se lea como un IV-12 oculto.
- **Tensión declarada:** la propuesta clasifica en A que falten datos del equipo (b2, como «Falta el equipo»), mientras que RQ-TC-05 clasifica en C que falten los obligatorios del ticket (fila 5). Se mantiene la clasificación de la propuesta: sin serie, modelo ni fecha no hay sujeto que registrar.

**Pruebas de POSICIÓN (regla de mutación 1).** Cada una activa dos guardas a la vez:

| P | Par activado | Espera | Mutación que la pone en rojo |
|---|---|---|---|
| P1 | Faltan datos del equipo nuevo + OV inexistente | 422 de datos | bajar `:24` por debajo de `:37` |
| P2 | Modelo inexistente + fecha inválida | 422 de modelo | validar los campos dentro de `exigirEquipoNuevo` |
| P3 | OV inexistente + Drive inválido | 422 de OV | subir la línea `:89` por encima de `:37` (el molde IV-12) |
| P4 | Serial reutilizado de otro cliente + fecha inválida | 422 equipo↔cliente | subir `:89` por encima de `:59` |
| P5 | Cliente inexistente + fecha inválida (vecina de arriba) | `'Cliente no encontrado'` | intercambiar `:87-88` con `:89` |
| P6 | Fecha inválida + OV ya usada (vecina de abajo) | 422, no 409 | bajar `:89` por debajo de `:94-98` |
| P7 | Equipo nuevo válido + OV ya usada | 409 y `COUNT(equipos)` sin cambios | crear el equipo antes de `:94` (criterio 7) |

## 2 · Atomicidad y su prueba

`crearTicketConEquipo(db, nuevo, clienteNombre, input)` hace esto:

- Si `!nuevo` o `nuevo.equipo.id` (registrado o reutilizado), llama a `createTicket(db, input)`, **idéntico a hoy**.
- Si no, `enTransaccion(db, q => { id = createEquipo(q, {…, clientId: input.clientId, clienteNombre}); return createTicket(q, {...input, equipoId: id}, { transaccionAbierta: true }) })`.

**Hipótesis (sin medir):** pg-mem revierte un `ROLLBACK`. `auth/users.ts:147` lo da por imposible y ninguna prueba del repositorio lo ejercita. Por eso:

- **T0 (sonda, primera tarea):** en pg-mem, `BEGIN`, `INSERT` y `ROLLBACK` sobre `pool.connect()` deben dejar 0 filas.
- **Si T0 es verde:** se envuelve el pool para que el `INSERT INTO tickets` falle y se comprueba que `COUNT(equipos)` no cambia.
- **Si T0 es rojo:** se usa el rastreador de verbos de `salesRecords.test.ts:24-31` y se espera `BEGIN, INSERT equipos, INSERT tickets(throw), ROLLBACK`, sin `COMMIT`.
- **En los dos casos:** el cliente de la transacción lanza error si alguien llama a su `connect`. Así se prueba el flag.

Además, `repo`: con `transaccionAbierta: true`, `createTicket` no toca `connect`.

## 3 · `getEquipoBySerial`

```sql
SELECT id,serial,marca,modelo,tipo,cliente_nombre,client_id,modelo_id,codigo_interno FROM equipos
WHERE lower(trim(serial)) = lower(trim($1)) ORDER BY active DESC, created_at ASC, id ASC LIMIT 1
```

**Supuesto (a3′), determinista y reversible:** con duplicados, se toma el activo más antiguo; si no hay ningún activo, el inactivo más antiguo.

- **Hipótesis:** hay seriales duplicados en producción. `schema.sql:202` sólo tiene índice, sin `UNIQUE`.
- **Comprobación de persona:** `SELECT lower(trim(serial)), count(*) FROM equipos GROUP BY 1 HAVING count(*)>1`.
- La consulta no usa `idx_equipos_serial`, y con ~354 filas es irrelevante.
- Se guarda el serial recortado y **con su caja**, como en `routes/equipos.ts:50`.

## 4 · Cuerpo de la petición

`POST /api/tickets` acepta `equipoNuevo?: { serial, modeloId, fechaFacturaCompra, fechaAdquisicion?, finGarantia?, codigoInterno?, driveUrl?, mantenedorId? }` al lado de `equipoId?`.

- Se lee sólo si `clasificaciones === 'Equipo nuevo'` y no viene `equipoId`.
- Un `clientId` dentro de `equipoNuevo` se **ignora**: el equipo toma el cliente ya resuelto del ticket (a4).
- El tipo del cuerpo en `apps/desk/src/api/client.ts:286` gana el campo.

## 5 · Cliente (`CreateTicket.tsx`, sin red de pruebas por F0-00)

- Con «Equipo nuevo» y sin equipo elegido, aparece un bloque con:
  - serie;
  - marca y modelo del catálogo (`getCatalogo`);
  - fecha de factura de compra;
  - los cuatro campos opcionales;
  - el mantenedor, con `searchClients`.
- El buscador de equipos existentes se queda.
- `:183` exige «equipo o bloque completo».

**Decisiones del cliente → línea del servidor que las impone (regla de mutación 3):**

| Decisión del cliente | Impuesta en |
|---|---|
| Enseña el bloque sólo con «Equipo nuevo» | `ticketService.ts:23` (condición) |
| Marca `required` la serie, el modelo y la fecha | `exigirEquipoNuevo` (guarda 1) |
| Ofrece sólo modelos del catálogo | `getModelo` (guarda 2) |
| Usa inputs de tipo fecha y un campo Drive | `camposHojaDeVida` (`routes/equipos.ts:144-189`) |
| Avisa de que el serial ya está registrado y ofrece «usar ese equipo» | `getEquipoBySerial` (reutiliza aunque el cliente no avise) |
| No pide cliente del equipo | `crearTicketConEquipo` usa `input.clientId` |
| Calcula la vista previa de código y asunto con la serie y el modelo nuevos | Comodidad. El servidor acepta el valor recibido (`:99-100`), igual que hoy |

## 6 · Desplazamiento y barrido de citas (regla de mutación 4)

**Ediciones en `ticketService.ts`:** todas en su sitio.

| Línea | Cambio |
|---|---|
| `:2` | Sale `createTicket` |
| `:18` | La línea en blanco pasa a ser el `import` de `./equipoNuevo` |
| `:23` | Se amplía la condición |
| `:24` | Se declaran `nuevo` y `equipo` con dos declaradores en un solo `const` |
| `:25` | Sin cambios |
| `:89` | Sale el comentario del `409`; entra la llamada C |
| `:90-93` | El comentario del `409` se reescribe en 4 líneas con el mismo contenido y la precisión «antes de la primera escritura, sea el equipo o el ticket» |
| `:101` | `crearTicketConEquipo` |

**Invariante de cierre:** `git diff -U0` sólo enseña trozos de tamaño igual (`-a,n +a,n`) en `ticketService.ts`, `repo.ts` y `routes/equipos.ts`. Las pruebas nuevas se AÑADEN al final de `ticketService.test.ts`.

**Barrido:** `grep -rnoE "ticketService\.ts:[0-9]+(-[0-9]+)?"`. Hoy son 322 en 83 ficheros. Fuera de `archive/` hay 141 que apuntan a `:20` o más. Sólo hay que leer las que tocan `:2`, `:18`, `:22-25`, `:89-93` y `:101-106`.

| Caso | Qué se hace | Dónde |
|---|---|---|
| A | Se reapunta | Las filas de RQ-TC-05 se reescriben en el delta de spec. Sus citas ya estaban desfasadas: `spec.md:122-124` dice `:65-83`, `:87-92` y `:93-94`, y hoy son `:59-77`, `:81-86` y `:87-88` |
| B | Se conserva con su revisión | Archivados y documentos fechados |

**Segundo pase:** la forma abreviada en `tickets-core/spec.md` y en `ticketService.test.ts`.

## 7 · Estimación contra 800 y amenazas

| Pieza | Líneas de diff |
|---|---|
| `equipoNuevo.ts` | ≈80 |
| `transaccion.ts` | ≈22 |
| `getEquipoBySerial` | ≈12 |
| `repo.ts`, `routes/equipos.ts`, `ticketService.ts` | ≈26 |
| Pruebas: T0, P1-P7, criterios 1-7 y `repo` | ≈260-330 |
| `client.ts` | ≈3 |
| `CreateTicket.tsx` | ≈120-160 |
| Barrido | ≈10-20 |
| **Total del apply** | **≈530-680** |

Los informes de verify y archive van en sus intentos. **Riesgo:** con el techo 800 queda poco margen. Si pasa de 650, el `.tsx` va en un segundo lote.

**Matriz de procesos:** N/A. No hay enrutado, shell, subproceso, VCS ni ejecutables.

**Amenazas de dominio:**

| Amenaza | Efecto | Mitigación |
|---|---|---|
| Carrera entre dos altas del mismo serial | Duplicado | Fuera de alcance, sin `UNIQUE` (propuesta) |
| Equipo huérfano | Fila de equipo sin ticket | P7 y T0 |
| Un serial ajeno reutilizado cuelga el ticket de otro cliente | Ticket enlazado a un equipo de otro cliente | Guarda equipo↔cliente, P4. El mantenedor es IV-8 y queda fuera |
| Asignación masiva de `equipoNuevo.clientId` | El equipo nace con el cliente que diga el cuerpo | Se ignora |
| Drive malicioso | Enlace peligroso en la hoja de vida | `urlSegura` |
| Permisos | Quién puede dar de alta | `requireAuth` como hoy (a1) |

## Migración / Abiertas

- No hay migración.
- **Abiertas:**
  - resultado de T0 (pg-mem y `ROLLBACK`);
  - medir los duplicados de serial en producción (persona).
