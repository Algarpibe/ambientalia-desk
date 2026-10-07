---
tanda: F1B-11
motivo: ""
capacidad: [tickets-core]
maestro: ["Anexo D nº 53"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Ampliación de contrato: hasta el 31/12 del año del vencimiento, registrada por Comercial y con traza

## Por qué

`decision/e086-ampliacion-contrato` (`openspec/config.yaml:4060-4080`) responde a E-086
(`docs/sdd/ENTRADA.md:1222-1228`): «Año natural del vencimiento. Ampliación hasta el 31/12 de ese año, porque el 1/1
cambia la lista de precios. La registra Comercial, con traza.»

Hoy un contrato no se puede modificar: las rutas son cuatro lecturas y un alta
(`apps/desk/server/routes/contratos.ts:24`, `apps/desk/server/routes/contratos.ts:28`,
`apps/desk/server/routes/contratos.ts:36`, `apps/desk/server/routes/contratos.ts:40`,
`apps/desk/server/routes/contratos.ts:65`), y la capa de datos lo declara (`apps/desk/server/db/contratos.ts:8`). Un
contrato vencido bloquea sus subOV en las tres puertas y no hay forma de alargarlo salvo en la base.

## Qué construyó ya F1B-11, y qué le falta

| Cambio | Qué cubrió | Dónde lo dice |
|---|---|---|
| `parche-iv11-orden-venta` (1 de 3) | Marca de fila que protege la orden de venta del sincronizador y aviso de discrepancia a Comercial | `openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/archive-report.md:9` |
| `asociacion-ov-ticket` (2 de 3) | Asociación OV ↔ ticket 1:N propia, tercera vía en las tres puertas, subOV de lote con cuarentena, liberación con motivo y saldo por lote | `openspec/changes/archive/2026-09-28-asociacion-ov-ticket/archive-report.md:9` |
| `registro-contrato` (3 de 3) | Registro de contrato, vigencia, prioridad `High` al nacer, guarda de contrato vencido en las tres puertas, informe trimestral con CSV y aviso de ritmo | `openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:15-23` |

Ese último informe dice que lo único que falta a la fila es la ampliación, y el plan lo recoge igual: la fila
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:91`, «L (resta S)») y su remanente
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:216`, «Sólo la ampliación del contrato»). La consecuencia 5
de la decisión lo confirma. **Por eso esta tanda lleva `cierra: si`: al archivarla con verify en verde, F1B-11 queda
terminada.**

Cerrar la fila **no cierra IV-11** (reducido, sin relleno retroactivo) ni las tareas de persona heredadas (más abajo).

## Qué cambia

1. **Regla pura en `packages/shared/src/contratos.ts`, añadida al final** (el fichero acaba hoy en
   `packages/shared/src/contratos.ts:242`; nada se desplaza):
   - `topeAmpliacion(fechaFin)`: el 31/12 del año natural de la fecha de vencimiento. La fecha es un día civil
     `YYYY-MM-DD` y el año son sus cuatro primeros dígitos; no se pasa por UTC.
   - `motivoNoAmpliable(contrato, nuevaFecha, hoy)`: el mensaje del rechazo, o `null`. Rechaza una fecha nueva inválida
     (con `fechaCalendario`, `packages/shared/src/contratos.ts:34`), una no posterior a la fecha de fin vigente, una
     posterior al tope, y un `hoy` posterior al tope. `hoy` es siempre el día en la zona de negocio
     (`packages/shared/src/contratos.ts:61`), nunca UTC.
   - Como el tope cae en el mismo año que el vencimiento, el año de la fecha original y el de la vigente **coinciden
     siempre**: ampliar varias veces no mueve el tope y no hay ambigüedad sobre qué fecha fija el año.
2. **Traza en tabla nueva `public.contrato_ampliaciones`**, con `CREATE` calificado y su índice por contrato, al final de
   `packages/zoho-sync/src/db/schema.sql` (la última sentencia es hoy `packages/zoho-sync/src/db/schema.sql:768`):
   `id`, `contrato_id`, `fecha_anterior date NOT NULL`, `fecha_nueva date NOT NULL`, `motivo text` (anulable, sin
   `CHECK`), `ampliado_por text NOT NULL`, `ampliado_at timestamptz NOT NULL DEFAULT now()`. Sin clave foránea y sin
   `DELETE`, como `public.reasignaciones` (`packages/zoho-sync/src/db/schema.sql:756-765`). No hay `ALTER`.
3. **Una transacción, dos sentencias** (`apps/desk/server/db/transaccion.ts:13`): el `UPDATE` de `fecha_fin`
   **condicionado a la fecha leída**, y el `INSERT` de la traza. `fecha_fin` (`packages/zoho-sync/src/db/schema.sql:566`)
   pasa a ser la fecha **vigente**. La fecha original no se pierde: es la `fecha_anterior` de la primera fila de traza.
4. **Ruta `POST /api/contratos/:id/ampliar`**, dentro de la función existente y tras su última ruta
   (`apps/desk/server/routes/contratos.ts:65-70`), con cuerpo `{ fechaFin, motivo }`. `ampliado_por` es el usuario de la
   sesión. `hoy` es inyectable en las dependencias de la ruta (por defecto `hoyEnZona()`); hoy sólo reciben la base
   (`apps/desk/server/routes/contratos.ts:21`, `apps/desk/server/app.ts:61`).
5. **Lectura.** `GET /api/contratos/:id` (`apps/desk/server/routes/contratos.ts:33`) añade `ampliaciones` (quién, cuándo,
   fecha anterior, fecha nueva, motivo) y `fechaFinOriginal`. Campos aditivos: `contrato`, `estado` y `saldo` no cambian.
6. **Cliente.** `apps/desk/src/components/ContratoFicha.tsx` enseña la traza y la fecha original, y ofrece «Ampliar» a
   Comercial y administradores. Hoy la ficha no conoce al usuario (`apps/desk/src/components/ContratoFicha.tsx:15`); lo
   tomará del mismo contexto que el panel (`apps/desk/src/components/ContratosPanel.tsx:20`,
   `apps/desk/src/components/ContratosPanel.tsx:24`).

## Qué NO cambia

- **Las tres puertas no se tocan.** Leen la fecha de fin vigente (consecuencia 4 de la decisión): el alta
  (`apps/desk/server/services/ticketService.ts:96`), las transiciones
  (`apps/desk/server/services/ticketService.ts:147`) y la remisión (`apps/desk/server/routes/remision.ts:220`).
  `ticketService.ts` no se edita y `remision.ts` no se reordena: **IV-12 ni se amplía ni se corrige.**
- El informe trimestral y el aviso de ritmo no se tocan: calculan desde `fechaFin`, que ya es la vigente.
- `public.contratos` no gana columnas. Su `CHECK` (`packages/zoho-sync/src/db/schema.sql:570`) se sigue cumpliendo: la
  fecha nueva es posterior a la vigente, que ya era igual o posterior al inicio.

## Fuera de alcance

- **Editar o borrar un contrato** (lote o cliente mal tecleados): es E-088 (`docs/sdd/ENTRADA.md:1238`), abierta.
- **Acortar** o **corregir** una fecha de fin (S-3). **Notificar** la ampliación (S-5).
- **`docs/sdd/ENTRADA.md` no se toca en esta rama**: tiene cambios de Supervisión sin commitear en `main`. Las entradas
  las abre y las actualiza Supervisión; E-086 sigue figurando «nueva» (`docs/sdd/ENTRADA.md:1227`) aunque está decidida.
- Relleno retroactivo de IV-11 y cargos por persona: no son de esta fila.

## Capacidades

- **Nueva:** ninguna. `openspec/config.yaml → capabilities` no se toca (R-2 no aplica).
- **Modificada — `tickets-core`:** RQ-TC-21 (`openspec/specs/tickets-core/spec.md:716`) deja de decir que la ampliación
  queda fuera (línea 731 de esa spec) y que no hay escritura posterior; y entran requisitos nuevos a continuación de
  RQ-TC-52 (`openspec/specs/tickets-core/spec.md:2911`): regla del tope, ruta con su escalera, traza y lectura, y el
  efecto sobre las tres puertas.
- RQ-TC-25, `transitions-st`, `remisiones`, `zoho-sync` y `derivacion-avisos` **no cambian de requisito**: su texto ya
  habla de «la fecha de fin» y sigue siendo cierto. Si la fase de spec encuentra una frase que la ampliación vuelva
  falsa, se declara ahí (hipótesis: no la hay).

## Guardas de la ruta y su escalón (F1B-10: A existencia < B permiso < C contenido < D unicidad)

| Escalón | Guarda | Respuesta |
|---|---|---|
| A | El contrato no existe, o el id no es numérico | `404`, como `apps/desk/server/routes/contratos.ts:31-32` |
| B | Sin área Comercial ni administrador: mismo predicado del alta, consumido de `shared` (`apps/desk/server/routes/contratos.ts:43`) | `403` |
| C | Lo que devuelva `motivoNoAmpliable`; y motivo vacío (S-1) | `422` |
| D | La fecha de fin cambió entre la lectura y el `UPDATE` condicionado (carrera de dos ampliaciones) | `409` |

**Pruebas de posición por pares, con las dos guardas activas a la vez** (regla de mutación 1): A frente a B (usuario sin
permiso sobre un contrato inexistente → `404`), B frente a C (sin permiso y con cuerpo inválido → `403`), C frente a D
(contenido inválido con la fecha cambiada por debajo → `422`). El orden interno de los motivos de C también se fija por
prueba: fecha inválida, no posterior, pasa del tope, plazo cerrado; el orden exacto lo decide la spec.

**Bordes obligatorios de la regla:** vencimiento el 31/12 (el tope es el propio día: no cabe ampliación); vencimiento el
01/01 (tope, el 31/12 de ese mismo año); ampliación pedida para el 01/01 del año siguiente (rechazada); y un instante
que en UTC ya es 01/01 pero en la zona de negocio sigue siendo 31/12 (todavía se puede ampliar).

## Efecto que hay que probar, sin tocar las puertas

Un contrato vencido y después ampliado deja de dar «contrato vencido» en el alta, en las transiciones y en la remisión
hasta la fecha nueva; pasada la fecha nueva, vuelve a bloquear. Las pruebas **amplían con el escritor real**, no con un
`UPDATE` a mano, y son deterministas respecto de la fecha real: fijan sólo `Date`, porque las puertas toman el día del
reloj (`apps/desk/server/db/contratos.ts:84`, `apps/desk/server/db/contratos.ts:91`).

## Regla 13 — decisión del cliente → guarda del servidor que la impone

| Decisión que toma el cliente | Servidor |
|---|---|
| «Ampliar» sólo se enseña a Comercial y administradores | Guarda B de la ruta nueva en `apps/desk/server/routes/contratos.ts` — **hoy no existe**; línea a fijar en `tasks.md` |
| El formulario propone como máximo el 31/12 del año del vencimiento | `motivoNoAmpliable`, guarda C de la ruta nueva; la función se consume de `shared`, no se reescribe |
| No ofrece «Ampliar» si ya pasó el tope | La misma guarda C (`hoy` posterior al tope); el cliente no tiene reloj de negocio fiable |
| Pide motivo | Guarda C de motivo vacío (S-1) |
| Tras un `409`, recarga la ficha | Guarda D: el `UPDATE` condicionado en `apps/desk/server/db/contratos.ts` |
| Pinta la traza y la fecha original | No decide: las dos llegan de `GET /api/contratos/:id` |

Las guardas sin línea las construye esta tanda; la tabla se cierra en `tasks.md` con su línea real. El formulario
enseña tal cual el mensaje del servidor. Los `.tsx` quedan fuera de la red de pruebas por decisión de Gerencia (F0-00).

## Supuestos (regla de ejecución, reversibles)

- **S-1 · El motivo es obligatorio**, impuesto por el servidor con `422`. **La fuente no lo exige**: ni E-086 ni la
  decisión lo nombran; se pide por coherencia con liberar y reasignar. Si es «no»: se quita la guarda; la columna ya es
  anulable y no hay `CHECK`.
- **S-2 · Se puede ampliar más de una vez**, mientras cada fecha nueva sea posterior a la vigente y no pase del tope. Si
  es «no»: una guarda C más («ya ampliado»), que lee la traza.
- **S-3 · Una ampliación sólo alarga.** Si se quiere acortar o corregir: es otra operación, con su propia regla.
- **S-4 · La ampliación no reinicia la marca del aviso de ritmo.** Matiz hallado al leer el código: la marca sólo sube
  (`apps/desk/server/services/avisoRitmoContrato.ts:28`), y el último trimestre acaba en la fecha de fin
  (`packages/shared/src/contratos.ts:94`), así que una ampliación corta **alarga el trimestre ya avisado** en vez de
  abrir otro: en ese tramo no habrá aviso nuevo. Si es «no»: la ampliación pone la marca a nulo en la misma transacción.
- **S-5 · No se genera aviso al ampliar.** Si es «no»: un aviso a Comercial en la misma transacción.
- **S-6 · La traza la lee cualquier usuario con sesión**, como la ficha. Si es «no»: se filtra el campo por área.
- **S-7 · Un contrato aún no iniciado también se puede ampliar**: la regla no mira la fecha de inicio. Si es «no»: una
  guarda C más.
- **S-8 · Sin ampliaciones, `fechaFinOriginal` es igual a la fecha de fin.** Nunca es nulo.
- **S-9 · El motivo se guarda recortado y sin límite de longitud.**
- **S-10 · El plazo se cierra por el día de negocio, no por la hora**: el 31/12 entero se puede ampliar.

## Ronda de preguntas (modo `auto`: no se formuló; quedan para Gerencia)

1. ¿El motivo de la ampliación es obligatorio? (S-1)
2. ¿Se puede ampliar el mismo contrato más de una vez? (S-2)
3. Tras ampliar, ¿debe volver a evaluarse el aviso de ritmo del trimestre ya avisado? (S-4)

## Tareas de persona — fuera del recuento; archivar no las da por hechas

Heredadas de `registro-contrato` (`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:110-120`):

| Tarea | Dueño | Estado |
|---|---|---|
| P.1 · consulta de formato de subOV en producción | Alfonso | **Abierta** |
| P.4 · literales de borrador y anulada en Books | Alfonso | **Abierta** |
| P.5 · responder E-086 | Gerencia | Respondida: `decision/e086-ampliacion-contrato` |
| P.6 · verificar en la aplicación prioridad, bloqueo, informe, CSV y pasada de ritmo | Comercial | **Abierta** |
| P.7 · dar de alta los contratos vigentes | Comercial | **Abierta** |

Nuevas de esta tanda:

| Tarea | Dueño | Dónde queda escrita |
|---|---|---|
| P.8 · tras desplegar, ampliar un contrato real y comprobar traza, desbloqueo y rechazo fuera del tope | Comercial | Paquete de despliegue e informe de archivo |
| P.9 · pegar en el maestro la corrección | Gerencia | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| P.10 · actualizar el estado de E-086 y abrir las entradas que salgan de esta tanda | Supervisión | `docs/sdd/ENTRADA.md` |
| P.11 · responder las tres preguntas de la ronda | Gerencia | Informe de archivo |

**Cerrar F1B-11 no da por hecha ninguna de ellas.**

`toca_maestro: si`: el maestro vigente da el año y el tope por abiertos
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2655`), dice que la fila no se cierra
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2656`) y conserva el punto como pendiente
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5561`). La corrección se entrega como texto.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| El año se calcula pasando la fecha por `Date` y un vencimiento del 01/01 cae en el año anterior | Media | El año son los cuatro primeros dígitos; borde del 01/01 y mutación exigidos |
| `hoy` en UTC cierra el plazo cinco horas antes | Media | `hoy` inyectable; borde del instante que en UTC ya es 01/01 |
| Dos ampliaciones simultáneas: la segunda pisa a la primera y la traza miente sobre la fecha anterior | Media | `UPDATE` condicionado a la fecha leída y `409`; mutación que quita la condición |
| La atomicidad no se prueba de verdad: sin pool no se abre transacción (`apps/desk/server/db/transaccion.ts:15`) | Segura | Se prueba por estructura; mismo aviso W2 de `registro-contrato` (`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:39`); lo comprueba P.8 |
| El guardián de la D frente a C exige simular la carrera | Media | Doble de la base que cambia la fecha entre la lectura y la escritura; lo fija el diseño |
| Los guardianes de `migrate.test.ts` se ponen rojos al añadir la tabla | Segura | Se reajustan en sitio: recuento (`packages/zoho-sync/src/db/migrate.test.ts:282-286`), cola (`packages/zoho-sync/src/db/migrate.test.ts:652`) y últimas sentencias (`packages/zoho-sync/src/db/migrate.test.ts:794-798`) |
| Comentarios que quedan falsos: «no hay `UPDATE`» y «no hay edición» | Segura | Se reescriben en sitio, sin mover líneas: `apps/desk/server/db/contratos.ts:8`, `packages/zoho-sync/src/db/schema.sql:559`, `apps/desk/src/components/ContratosPanel.tsx:17` |
| S-4: una ampliación corta no vuelve a avisar del ritmo | Media | Declarado; pregunta 3 |
| Las pruebas de las puertas dependen del día real | Media | Fijar sólo `Date`; ninguna fecha relativa a hoy |
| Los `.tsx` no tienen pruebas | Segura | Tabla de la regla 13 y P.8 |

Ninguna de las seis decisiones de diseño recibidas ha resultado inviable al leer el código.

## Lotes de `apply` (techo 800, válvula 720; pruebas y `apply-progress` incluidos)

| Lote | Contenido y ficheros | Estimación |
|---|---|---|
| 1 · Regla | Las dos funciones al final de `packages/shared/src/contratos.ts`; casos al final de `packages/shared/src/contratos.test.ts`, con los cuatro bordes | **~260** |
| 2 · Esquema y datos | Tabla e índice al final de `schema.sql`; `PUBLIC_TABLES` en sitio (`packages/zoho-sync/src/db/migrate.ts:73`); guardianes de `migrate.test.ts` en sitio y bloque nuevo al final; escritor y lector al final de `apps/desk/server/db/contratos.ts`, con sus pruebas | **~480** |
| 3 · Ruta y puertas | Ruta nueva y lectura ampliada en `apps/desk/server/routes/contratos.ts`; pruebas de la escalera por pares; fichero nuevo de pruebas del efecto en las tres puertas | **~640** |
| 4 · Cliente y cierre documental | `ContratoFicha.tsx`; tipo en sitio (`apps/desk/src/api/client.ts:680`) y función al final de ese fichero; `ContratosPanel.tsx` en sitio; `DEPLOY.md`; paquete de despliegue nuevo en `docs/sdd/`; corrección al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`; fila de F1B-11 en el plan R01.4; tabla de la regla 13 en `tasks.md` | **~430** |
| Verify | `verify-report.md` (precedentes: 206 a 358) | **~360** |
| Archive | `archive-report.md` más la fusión del delta, que se mide antes de aplicar; la mudanza no cuenta para el techo | **~180 + fusión** |

El lote 3 es el más ajustado: si su medida pasa de la válvula, las pruebas de las tres puertas salen a un lote propio.
Cada intento se cierra con `git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear.

## Barrido de citas previsto (regla de mutación 4)

Todo lo nuevo va al final de su fichero o en sitio con el mismo número de líneas. Aun así, al cierre se barre, cita por
cita y contra el fichero, cada uno que se edite por dentro:

- `apps/desk/server/routes/contratos.ts` (importaciones, firma y lectura en sitio; ruta antes de la llave de cierre);
- `apps/desk/server/db/contratos.ts` y `packages/shared/src/contratos.ts` (importación y comentario en sitio);
- `packages/zoho-sync/src/db/schema.sql`, `packages/zoho-sync/src/db/migrate.ts` y
  `packages/zoho-sync/src/db/migrate.test.ts`;
- `apps/desk/src/components/ContratoFicha.tsx` (único con inserciones por dentro), `ContratosPanel.tsx` y
  `apps/desk/src/api/client.ts`;
- `DEPLOY.md` y el plan R01.4, que tiene citas a sus propias filas;
- `openspec/specs/tickets-core/spec.md`, en el archivo: modificar RQ-TC-21 puede desplazar todo lo que la sigue.

Segundo pase para las formas abreviadas en los ficheros que ya citan esos módulos, y detector con cero bloqueantes.

## Mutaciones que el verify deberá reproducir

**Posición (regla 1):** mover el `403` detrás del `422`; mover el `404` detrás del `403`; validar el contenido después
de escribir; cambiar el orden de los motivos dentro de `motivoNoAmpliable`.

**Fichero vigilado (regla 2), ensuciando `schema.sql`:** quitar `public.` del `CREATE`; mover el `CREATE` fuera del
final; quitar `NOT NULL` de `fecha_anterior`; y quitar la tabla de `PUBLIC_TABLES`. Cada una pone rojo un guardián.

**Condición:** tope calculado con el año de `hoy`; año obtenido por `Date`; `<=` por `<` en «posterior a la vigente» y
en «posterior al tope»; día en UTC en vez de zona de negocio; quitar la condición de fecha del `UPDATE`; quitar el
`INSERT` de la traza; tomar `fechaFinOriginal` de la última fila en vez de la primera; tomar `ampliado_por` del cuerpo.

## Reversión

Todo es aditivo. Se revierte la rama; la tabla nueva queda sin lector. **Las fechas ya ampliadas no se deshacen solas**:
con la traza se restauran a mano (`fecha_anterior` de la primera fila de cada contrato), y es dato de producción.

## Criterios de aceptación

1. `topeAmpliacion` devuelve el 31/12 del año del vencimiento en los cuatro bordes, sin pasar por UTC.
2. `motivoNoAmpliable` rechaza los cuatro casos, con el orden entre ellos fijado por prueba, y devuelve `null` si cabe.
3. La tabla existe tras migrar, calificada en `public`, al final del esquema y en `PUBLIC_TABLES`; guardianes en verde.
4. Ampliar escribe la fecha vigente y una fila de traza con quién, cuándo, fecha anterior, fecha nueva y motivo.
5. La ruta responde `404`, `403`, `422` y `409` en ese orden, con una prueba de posición por cada par vecino.
6. Dos ampliaciones encadenadas dentro del tope se aceptan; `fechaFinOriginal` sigue siendo la fecha del alta.
7. Un contrato vencido y ampliado deja pasar su subOV en el alta, en la transición y en la remisión; pasada la fecha
   nueva, las tres vuelven a rechazar. Sin editar `ticketService.ts` y sin reordenar `remision.ts`.
8. `GET /api/contratos/:id` sirve `ampliaciones` y `fechaFinOriginal`; `contrato`, `estado` y `saldo` no cambian.
9. `apps/desk/server/remisiones.test.ts:988` y las pruebas existentes de contratos, en verde sin cambios en sus casos.
10. Detector de citas con cero bloqueantes y barrido de la regla de mutación 4 hecho.
11. `tasks.md` cierra la tabla de la regla 13 con la línea real de cada guarda nueva.
12. `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` con salida 0.
13. El informe de archivo declara que F1B-11 queda cerrada y lista las tareas de persona que siguen abiertas.
