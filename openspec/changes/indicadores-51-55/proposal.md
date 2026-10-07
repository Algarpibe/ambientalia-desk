---
tanda: F1F-05
motivo: ""
capacidad: [kpis]
maestro: ["Anexo G.6", "Anexo G.6b"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: los indicadores 51 y 55 dejan de salir «sin dato» (`indicadores-51-55`)

Exploración contrastada: `openspec/changes/indicadores-51-55/exploration.md`. Toda cita de esta
propuesta se comprobó contra el árbol de `42a4828`; lo no comprobado lleva la palabra «hipótesis».
`R08.4.md` es `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`.

## 1. Intención

La tabla de los nueve indicadores (`continuidad-indicadores`, archivado) entrega siete calculados y dos
«sin dato»: el 51, tiempo de recogida, y el 55, satisfacción (`packages/shared/src/indicadores.ts:88`,
`packages/shared/src/indicadores.ts:89`). Gerencia ya decidió con qué se calculan
(`openspec/config.yaml:4092`): «51: la transición de entrega. 55: las respuestas cargadas de la
encuesta. Comparación: con la exportación de Zoho.»

Éxito: un administrador descarga la tabla y el 51 trae un número en todo ticket entregado desde la
aplicación; y, cargado el fichero de respuestas de la encuesta, el 55 trae la calificación de cada
ticket que la tenga.

**Qué parte de la fila cubre:** el cálculo del 51 y el almacén, la carga y el cálculo del 55. **Qué
deja fuera:** la comparación con la exportación de Zoho, que es la tercera parte de la misma decisión
(§14).

## 2. Alcance

### Dentro

1. **51 derivado del historial**, en el módulo puro `packages/shared/src/indicadores.ts`: día civil de
   Bogotá de la transición de entrega menos `Fecha Finalización ST`, en días naturales con signo. Las
   transiciones de entrega son `entrega_al_cliente` y `entrega_sin_factura`
   (`packages/shared/src/transitions.ts:248-251`), declaradas en una constante del módulo con un
   guardián que la enfrenta al catálogo. Con dos entregas vale la última por `performed_at` y sale la
   marca de reentrante. Un ticket sin fila de entrega da «sin dato — falta el hito: transición de
   entrega». Se retira la entrada opcional `horaActualizacionEstado`
   (`packages/shared/src/indicadores.ts:46`). La variante «fórmula de Zoho» del 51 sigue «sin dato».
2. **55 desde respuestas cargadas:**
   - Tabla `public.encuesta_respuestas`, calificada: `id`, `ticket_id`, `calificacion`, `respondida_at`,
     `huella` única, `cargado_por`, `cargado_at`; índice por `ticket_id`. Admite varias respuestas por
     ticket; vale la última por `respondida_at` y, a igualdad, por `id`.
   - **Analizador del fichero aislado** en un módulo propio y puro: entra el contenido, salen filas
     leídas y filas rechazadas con su motivo. No conoce la base.
   - **Cargador** `POST` sólo para administradores, multipart en memoria con `crearSubida()`
     (`apps/desk/server/util/subida.ts:10-11`), en un fichero de ruta nuevo. Escalera 401 < 403 < 400 <
     carga. Respuesta `{ leidas, insertadas, duplicadas, rechazadas: [{ fila, motivo }] }`. Idempotente
     por huella: cargar dos veces el mismo fichero no inserta nada la segunda.
   - `leerEntradasIndicadores` (`apps/desk/server/indicadores.ts:56-86`) suma una **cuarta consulta de
     lectura** y pasa la última calificación al cálculo. El `GET /api/indicadores` sigue siendo sólo
     lectura.
3. **Delta de `kpis`** (§3).

### Fuera — cualquiera de estas cosas es motivo de parada si el diseño la necesitara

La comparación con la exportación de Zoho y su cargador · pantalla de carga en el cliente (ningún cambio
en `apps/desk/src`) · columna `canal` y la encuesta en tableta · encuesta automática por correo ·
relleno de datos de producción · cambios al sincronizador · `packages/shared/src/transitions.ts`,
`packages/shared/src/bodegaje.ts`, `apps/desk/server/services/ticketService.ts` y
`apps/desk/server/routes/remision.ts` · corregir la reentrancia (punto 66, `R08.4.md:2961`), IV-11 o
IV-12.

## 3. Capacidades

### Nuevas
- Ninguna. R-2 no aplica: `kpis` ya está declarada (`openspec/config.yaml:240`) y tiene spec viva.

### Modificadas
- `kpis` — delta sobre `openspec/specs/kpis/spec.md`:

| Requisito | Qué cambia |
|---|---|
| RQ-KP-02 | La tabla de hitos gana la fila del 51: marca de la transición de entrega y `Fecha Finalización ST` |
| RQ-KP-09 | Deja de ser «sin dato — falta el hito». Cae la prohibición de `openspec/specs/kpis/spec.md:257` y la entrada opcional del 51 |
| RQ-KP-10 | Reentrante en el 51: dos o más filas de entrega |
| RQ-KP-11 | La variante de Zoho del 51 sigue «sin dato»; la del 55 es igual a la letra |
| RQ-KP-14 | Cuatro consultas constantes en vez de tres (escenario de `openspec/specs/kpis/spec.md:395`) |
| RQ-KP-18 | «Sin migración, sin escritor» (`openspec/specs/kpis/spec.md:509`) se acota: el `GET` no escribe; el único escritor es la carga de la encuesta, sobre su tabla |
| Tabla de supuestos | SP-8 (`openspec/specs/kpis/spec.md:34`) se retira; entran S-A a S-H |

| Requisito nuevo | Contenido |
|---|---|
| RQ-KP-19 | Almacén de respuestas: tabla, huella única, varias por ticket, cuál vale |
| RQ-KP-20 | Analizador del fichero: formato supuesto, columnas por nombre, motivos de rechazo por fila |
| RQ-KP-21 | Ruta de carga: permiso, escalera, forma de la respuesta, idempotencia |
| RQ-KP-22 | El 55 en la lectura: última respuesta del ticket; sin respuesta, «sin dato» |

## 4. Supuestos aplicados — razonables y reversibles

Modo `auto` (`openspec/config.yaml:25-30`): se aplican, se anotan aquí y se sigue. Ninguno cambia el
alcance de la fila, cuesta dinero, toca datos de producción ni contradice una decisión registrada.

| # | Supuesto | Por qué | Cómo se revierte |
|---|---|---|---|
| S-A | Con dos entregas, vale **la última** por `performed_at` | La decisión dice «vale la que tenga el ticket» (`openspec/config.yaml:4099`) y no cubre el caso de dos. Es la regla de reentrancia vigente (S-5 de la spec) | Una línea del módulo y su prueba |
| S-B | Motivos del 51 y su orden: primero «falta el hito: transición de entrega»; con entrega y sin finalización, «falta el hito: finalización del servicio». Sin fila de entrega **no** se usa `Fecha Remisión de Salida` como sustituto | Es el orden que el cálculo ya tiene (`packages/shared/src/indicadores.ts:230-231`); la decisión nombra la transición, no la fecha de la remisión | Ídem |
| S-C | Tabla con huella única y varias respuestas por ticket; vale la última | Un cliente puede contestar dos veces; la huella hace la carga repetible | Cambiar la consulta de lectura |
| S-D | El fichero identifica el ticket por su **número** (`packages/zoho-sync/src/db/schema.sql:22`) | Es el identificador que una persona puede escribir. Que el formulario lo recoja es **hipótesis** | Sustituir el analizador |
| S-E | El fichero es un **CSV de exportación de Google Forms**: separador `,` o `;`, BOM tolerado, columnas reconocidas por nombre normalizado con sinónimos, marca de tiempo leída en `America/Bogota` | Es lo que nombra la decisión (`openspec/config.yaml:2858`). **El formato no está en el repositorio y no hay muestra** (`openspec/config.yaml:4102-4103`) | Sustituir sólo el analizador cuando llegue la muestra (P-1) |
| S-F | Carga por `POST` multipart de administrador, **sin interruptor** y sin pantalla | Sólo añade filas a una tabla propia y es idempotente; no enciende ningún escritor sobre datos existentes | Retirar el registro de la ruta |
| S-G | **Sin columna `canal`** | Es un recorte frente a «cada calificación guarda su canal» (`R08.4.md:2969`); el propio maestro difiere la versión integrada a después del corte (`R08.4.md:2970`), y hasta entonces hay un solo formulario | `ALTER TABLE` calificado, con tanda propia |
| S-H | El `GET` sigue siendo sólo lectura, con cuatro consultas | RQ-KP-14 exige número constante; la cuarta trae la última respuesta de cada ticket del periodo | — |

**Lo que NO es supuesto:** que el 51 sea la transición de entrega y el 55 las respuestas cargadas es
letra de la decisión. Que un ticket movido sólo en Zoho siga «sin dato» también
(`openspec/config.yaml:4100`).

## 5. Tareas de persona — fuera del recuento

Archivar el cambio **no las da por hechas** (regla del ciclo 1). Ninguna describe trabajo que una tanda
pueda hacer en este repositorio.

| # | Qué | Dueño | Qué desbloquea | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Entregar una muestra real de la exportación del formulario de la encuesta | Comercial, que es quien la envía (`openspec/config.yaml:2858`) | Confirmar o sustituir el analizador (S-D, S-E) | `docs/sdd/ENTRADA.md`, entrada nueva en el cierre |
| P-2 | La carga real de las respuestas de enero | Un administrador de la aplicación | Que el 55 tenga datos del periodo posterior al corte | Ídem |
| P-3 | Desplegar: la tabla nueva nace vacía, sin relleno | Quien administra el despliegue | Que la ruta de carga exista en producción | Ídem y `DEPLOY.md` |

## 6. Enfoque

- **51.** Una constante con los dos identificadores de entrega y una función que, como
  `hitoMarcaIngreso` (`packages/shared/src/indicadores.ts:123-128`), saca del historial la última fila de
  entrega, su día en Bogotá y cuántas hay. El hito entra en `hitos` del 51 con fuente `transicion`. La
  lectura ya trae `transition_id` y `performed_at` (`apps/desk/server/indicadores.ts:76`): no hay
  consulta nueva para el 51.
- **55, dominio.** `calificacionSatisfaccion` (`packages/shared/src/indicadores.ts:48`) se conserva como
  entrada del cálculo; ahora la aporta la lectura. El módulo puro sigue sin base, red ni ficheros.
- **55, almacén.** `CREATE TABLE IF NOT EXISTS public.encuesta_respuestas` **al final** de
  `packages/zoho-sync/src/db/schema.sql` (tras `:782`), y el nombre añadido en la línea 73 de
  `packages/zoho-sync/src/db/migrate.ts`, sin insertar líneas en ninguno de los dos. Capa de datos en un
  fichero nuevo bajo `apps/desk/server/db/`.
- **55, analizador.** Módulo puro bajo `apps/desk/server/encuesta/`. Es la única pieza que conoce el
  formato.
- **55, ruta.** Fichero nuevo bajo `apps/desk/server/routes/`, registrado en `apps/desk/server/app.ts:61`.
  Sesión y administrador van **delante** del analizador de multipart
  (`apps/desk/server/auth/middleware.ts:14-23`, `apps/desk/server/auth/middleware.ts:26-29`), para que
  un usuario sin permiso no llegue a subir el fichero. `400`: falta el fichero, o la cabecera no trae
  las columnas necesarias. Una fila mala **no** es `400`: va a `rechazadas` y las demás se cargan. El
  `413` por tamaño ya lo da el manejador central (`apps/desk/server/app.ts:84`).

### Regla 13 — casilla marcada

**Decisiones del cliente en esta tanda: ninguna.** No se toca `apps/desk/src`; no hay pantalla, botón
ni enlace nuevo. Todo lo que decide —quién carga, qué fila se rechaza, cuál respuesta vale— lo decide
el servidor, y la línea de cada guarda se cita al construirla.

## 7. Lotes y estimación

Pruebas ×1,8 sobre el código; cada lote por debajo de 800, medido antes de cerrar cada intento con
`git diff --shortstat --no-renames` contra el commit de partida más las líneas de lo nuevo sin trackear.
Cada intento en este worktree (regla del ciclo 3).

| Lote | Contenido | Estimado |
|---|---|---|
| L1 | El 51: constante de entregas y guardián, hito, motivos, reentrante, retirada de la entrada opcional | ~310 |
| L2 | El 55: tabla, recuento del guardián de esquema, analizador y capa de datos | ~540 |
| L3 | Ruta de carga, registro, cuarta consulta y cableado del 55 en la lectura | ~500 |
| Cierre documental | Barrido de citas (regla de mutación 4), `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `DEPLOY.md`, corrección para el maestro | aparte |
| `verify` y `archive` | Intentos propios; el informe que cada fase genera es sumando obligatorio | aparte |

En el cierre, las citas de `openspec/config.yaml:4096-4107` a `indicadores.ts`, a la ruta y a la spec
describen el estado anterior a esta tanda: son **caso B** y se anclan a la revisión `42a4828`; no se
renumeran.

### Mutaciones que la tanda tiene que reproducir

- **De posición (regla 1):** en la carga, mover el administrador detrás del analizador de multipart, y
  la sesión detrás del administrador; mover el `400` de «falta el fichero» detrás de la primera
  escritura. Con usuario sin rol, la prueba comprueba que no se ejecutó ninguna sentencia sobre la tabla.
- **Del fichero vigilado (regla 2):** escribir en `schema.sql` la tabla **sin calificar** y comprobar
  que el guardián de `packages/zoho-sync/src/db/migrate.test.ts` se pone rojo; quitar el nombre de
  `PUBLIC_TABLES` y comprobar lo mismo.
- **De la constante de entregas:** quitar un identificador, y poner uno que no exista en el catálogo.
- **De la huella:** quitar la restricción única; quitar un campo de lo que entra en la huella.
- **De la última respuesta:** tomar la primera en vez de la última; ignorar el desempate por `id`.
- **Del hito ausente:** hacer que el 51 caiga en `Fecha Remisión de Salida` cuando no hay fila de
  entrega; tomar la primera entrega en vez de la última; invertir el signo.
- **Regla 3:** no aplica, no hay decisiones de cliente.

## 8. Áreas afectadas

| Área | Impacto | Qué cambia |
|---|---|---|
| `packages/shared/src/indicadores.ts` (+ prueba) | Modificado | 51 del historial; se retira `horaActualizacionEstado` |
| `packages/zoho-sync/src/db/schema.sql` | Modificado, sólo al final | Tabla `public.encuesta_respuestas` e índice |
| `packages/zoho-sync/src/db/migrate.ts`, `migrate.test.ts` | Modificado | `PUBLIC_TABLES`; recuento 44 → 45 y 31 → 32 (`packages/zoho-sync/src/db/migrate.test.ts:282-287`) |
| `apps/desk/server/encuesta/` (+ prueba) | Nuevo | Analizador del fichero |
| `apps/desk/server/db/` (+ prueba) | Nuevo | Insertar respuestas y leer la última por ticket |
| `apps/desk/server/routes/` (+ prueba) | Nuevo | Ruta de carga |
| `apps/desk/server/indicadores.ts` (+ pruebas) | Modificado | Cuarta consulta; las pruebas que fijan tres pasan a cuatro (`apps/desk/server/indicadores.test.ts:53-60`, `apps/desk/server/routes/indicadores.test.ts:186-192`) |
| `apps/desk/server/app.ts` | Modificado | Registro de la ruta en `:61`, sin insertar líneas |
| `openspec/specs/kpis/spec.md` | Modificado al archivar | Delta de §3 |
| `apps/desk/src` | **Sin cambios** | — |

## 9. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El formato real del fichero no es el supuesto (S-D, S-E) | Alta | Analizador aislado; P-1; se sustituye sin tocar almacén, ruta ni cálculo |
| El formulario no recoge el número de ticket | Media (hipótesis) | Pregunta a la bandeja (§13); las filas sin ticket reconocible se rechazan con motivo, no se pierden en silencio |
| Muchos tickets con el 51 «sin dato» por haberse movido sólo en Zoho | Alta hasta el corte | Límite declarado por la decisión (`openspec/config.yaml:4100`); el motivo lo dice en cada fila |
| Desfase de citas a `indicadores.ts` | Media | Barrido del cierre; `schema.sql` y `migrate.ts` no se desplazan |
| La tanda se lee como fila cerrada | Baja | `cierra: no` y §14 |

## 10. Reversión

Revertir el commit de fusión retira la ruta de carga, el cálculo del 51 y la cuarta consulta; el 51 y
el 55 vuelven a «sin dato». La tabla `public.encuesta_respuestas` queda en la base, inerte: nada más la
lee ni la escribe. Borrarla, si se quisiera, es una acción sobre datos de producción y la decide una
persona; no la hace la reversión.

## 11. Dependencias

- `continuidad-indicadores`, archivado: módulo, lectura y ruta sobre los que se construye.
- P-1 no bloquea construir; bloquea dar por bueno el analizador.

## 12. Criterios de éxito

- [ ] Un ticket con fila de entrega y finalización da el 51 en días naturales con signo, con el hito de
      entrega y su fuente; con dos entregas vale la última y `reentrante` es `true`.
- [ ] Un ticket sin fila de entrega da «sin dato — falta el hito: transición de entrega», aunque tenga
      `Fecha Remisión de Salida`.
- [ ] La constante de entregas no puede nombrar una transición que el catálogo no tenga.
- [ ] `horaActualizacionEstado` no existe en el código.
- [ ] La carga responde 401 sin sesión, 403 sin rol de administrador y 400 sin fichero, en ese orden, y
      en los tres casos la tabla no se toca.
- [ ] Cargar dos veces el mismo fichero deja las mismas filas, y la segunda respuesta da `insertadas: 0`.
- [ ] Con dos respuestas de un ticket, el 55 es la última por `respondida_at` y luego por `id`; sin
      respuestas, «sin dato».
- [ ] El `GET /api/indicadores` ejecuta cuatro consultas, todas de lectura, con uno o con veinte tickets.
- [ ] Las mutaciones de §7 se reproducen y cada una se pone roja.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde; cada lote por debajo de 800 medido.

## 13. Ronda de preguntas de la propuesta

El modo es `auto`: no se paró a preguntar. Las preguntas no se escriben ahora en la bandeja; van a
`docs/sdd/ENTRADA.md` en el cierre, con el primer número libre de ese momento (en este árbol la última
entrada es la E-235, `docs/sdd/ENTRADA.md:2193`).

1. **S-D:** ¿el formulario de la encuesta recoge el número de ticket, u otro dato con el que asociar
   cada respuesta a su servicio?
2. **S-E:** ¿la exportación es el CSV de Google Forms tal cual, y con qué columnas? (La responde la
   muestra de P-1.)
3. **S-G:** ¿se acepta cargar las respuestas sin canal hasta que la tableta esté integrada, o el canal
   tiene que guardarse desde la primera carga?

## 14. Por qué `cierra: no`

La decisión tiene tres partes y esta tanda construye dos. Falta la comparación con la exportación de
Zoho (`openspec/config.yaml:4104-4106`), sin la cual no puede hacerse la comprobación del 95 % que la
fila exige (`R08.4.md:2957`). La cierra un cambio posterior con `tanda: F1F-05`.

## 15. Lo que el maestro necesita

`toca_maestro: si`. El G.6 define el 51 como «Hora de actualización del estado − Fecha Finalización ST»
(`R08.4.md:6299`); en Desk 2.0 pasa a ser el día de la transición de entrega menos la finalización, y
debería decirlo, junto con su límite para los tickets movidos sólo en Zoho. El pasaje de la encuesta
(`R08.4.md:2963`) debería recoger que la carga existe y que no guarda canal todavía. Va como texto a
`docs/sdd/F0-01_Correcciones_para_el_maestro.md`, no al `.docx`.
