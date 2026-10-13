# Diseño: el rotulado se confirma después de enviar, con traza y sin bloquear, y se avisa si la etiqueta no se generó

## Enfoque técnico
Medido sobre `a947b48`. Tres piezas: (1) se **retiran** las dos guardas del rotulado (alta y envío) sustituyendo cada línea por un comentario de una línea, sin mover ninguna otra; (2) una **acción nueva** del servidor escribe la traza una sola vez con un `UPDATE` condicional, y un booleano calculado por una función pura de `packages/shared` viaja en toda remisión que pasa por `toRemision`; (3) el callback, tras guardar el resultado y avanzar el ticket, llama a un **servicio de aviso aislado** que nunca lanza. **Flujo:** alta (sin rotulado) → `/enviar` (`reclamarEnvio` escribe `enviado_por_id`) → n8n → callback (`setResultadoRemision` → `sincronizarEstadoPorRemision` → `avisarEtiquetaNoGenerada`) → lectura con `pendienteRotular` → `POST /api/remisiones/:id/rotulado` → lectura con la traza. Todo fichero citado se edita **en sitio** (misma línea física) o **al final**. Lo que aquí se dice de tipos, lint, pg-mem y mutaciones es **hipótesis** hasta ejecutarlo en el apply. Alcance y supuestos G1, G2 y S1 a S12: los de `proposal.md`, sin reabrir.

**Nombres finales.** Ruta `POST /api/remisiones/:id/rotulado`; campo `pendienteRotular`; módulo nuevo `packages/shared/src/rotulado.ts` con `pendienteDeRotular`, `puedeConfirmarRotulado` y `etiquetaNoGenerada`; `confirmarRotulado` en `apps/desk/server/db/remisiones.ts`; servicio `apps/desk/server/services/avisoEtiquetaNoGenerada.ts` con `avisarEtiquetaNoGenerada` y `textoAvisoSinEtiqueta`; cliente `apps/desk/src/lib/rotuladoVista.ts` (`vistaRotulado`), `apps/desk/src/components/ConfirmarRotulado.tsx` y `confirmarRotulado` en `apps/desk/src/api/client.ts`.

## Decisiones
### D1 · Quitar el rotulado del alta y del envío sin reordenar — `packages/shared/src/recepcion.ts`, cinco líneas en sitio
| Línea | Queda |
|---|---|
| `packages/shared/src/recepcion.ts:65` | `// ERR_SIN_ROTULADO RETIRADO (rotulado-tras-enviar): el alta ya no exige el rotulado; se confirma tras el envío (RQ-RE-40).` |
| `packages/shared/src/recepcion.ts:72` | Misma frase, con el paso (6) reescrito: «(6) RETIRADO: el rotulado ya no se valida aquí, se confirma tras el envío (RQ-RE-40)»; el (7) **conserva su número** |
| `packages/shared/src/recepcion.ts:101` | `  // paso (6) RETIRADO (rotulado-tras-enviar): cuerpo.rotulado se ignora; la confirmación va tras el envío (RQ-RE-24, RQ-RE-40).` |
| `packages/shared/src/recepcion.ts:148` | Misma frase, con «(a) RETIRADO: el rotulado no impide enviar (RQ-RE-26)»; (b) y (c) **conservan su letra** |
| `packages/shared/src/recepcion.ts:155` | `  // paso (a) RETIRADO (rotulado-tras-enviar): rem.rotuladoAt no se lee aquí; el rotulado se confirma después (RQ-RE-40).` |

| Opción | Contrapartida | Decisión |
|---|---|---|
| Comentario de una línea en el sitio de cada guarda, y números y letras de paso intactos | Queda un «(6) retirado» y un «(a) retirado» en los comentarios de orden | **Elegida**: el fichero conserva sus 206 líneas y toda cita a «paso (7)» sigue cierta |
| Borrar las líneas y renumerar los pasos | −3 líneas desde la 65; falsea «paso (7)» en `CLAUDE.md:349`, `openspec/config.yaml:1206`, `openspec/specs/remisiones/spec.md:1959` y `docs/sdd/TRASPASO_2026-10-08.md:650` | Rechazada |
| Reutilizar la constante de la línea 65 como texto de la acción nueva | El texto «Confirma que…» es un imperativo de formulario, no un motivo de la acción | Rechazada: la constante sin uso rompería lint, se retira dejando la línea |

`RemisionRecepcion` (`packages/shared/src/recepcion.ts:124`) y `CuerpoRecepcion` (`packages/shared/src/recepcion.ts:187`) **no cambian**: `rotuladoAt` y `rotulado` siguen en el tipo y dejan de leerse, así un cliente antiguo que mande `rotulado: true` sigue compilando y pasando. IV-12 no gana ni pierde punto: no se mueve ninguna guarda.

**Barrido de citas (regla de mutación 4), hecho sobre el worktree sin excluir el archivo.** Citas que afirman algo que deja de ser cierto:

| Cita | Qué afirma | Caso | ¿La toca esta rama? |
|---|---|---|---|
| `docs/sdd/ENTRADA.md:1828` → línea 101 | El formulario pide confirmar antes de crear (es E-167) | C: lo cierra este cambio | No (fichero vedado): al informe |
| `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:255` y `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:210` → línea 101 | El rotulado se exige en el alta | B: paquete fechado | Puede; no se renumera, se deja como registro |
| `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:863` y `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:585` → rangos 97-101 y 151-162 | Alta y envío con rotulado | B | Ídem |
| `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/verify-report.md:148` (línea 101) y `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/verify-report.md:147` (línea 151) | La guarda existe y está verificada | B: archivo | No se toca el archivo |
| `openspec/changes/rotulado-tras-enviar/proposal.md` (líneas 65, 70-72, 101, 147-149, 151-162, 155) | Medición previa | B: declara `a947b48` en su encabezado | No se edita |

Siguen **ciertas** (caso A, nada que hacer): toda cita a la línea 102 (paso 7), a la 154 (legado), a la 63, a la 139-142, y `docs/sdd/ENTRADA.md:1808` (rango 151-162: foto por novedad). Las de `openspec/specs/remisiones/spec.md` las sustituye el delta al archivar.

### D2 · El alta deja de escribir el rotulado; la traza de las casillas es la del alta (G2)
- `apps/desk/server/routes/remision.ts:250`, en sitio: en el objeto `recepcion`, `rotuladoPor: req.user?.name ?? null` pasa a `por: req.user?.name ?? null`. El valor es el mismo usuario de la sesión; cambia el nombre porque ya no es «quien rotuló».
- `apps/desk/server/db/remisiones.ts:40`: `rotuladoPor` → `por`. `apps/desk/server/db/remisiones.ts:45`: el comentario pasa a «un solo instante para las casillas: hora y usuario del ALTA (G2)». `apps/desk/server/db/remisiones.ts:47` y `apps/desk/server/db/remisiones.ts:48`: salen `rotulado_at, rotulado_por` del `INSERT` y los marcadores pasan de `$1…$21` a `$1…$19`. `apps/desk/server/db/remisiones.ts:50`: salen los dos parámetros y las casillas leen `input.recepcion.por`. Las dos columnas quedan `NULL` por omisión.
- Rechazado dejar las columnas en el `INSERT` con `NULL` explícito: la mutación «el alta vuelve a escribir la traza» sería un cambio de un carácter invisible en revisión.
- **Prueba que cambia:** PT-1b (`apps/desk/server/recepcion.test.ts:570` y `apps/desk/server/recepcion.test.ts:578`): la línea 578 deja de comparar con `rotuladoAt` y afirma `r.body.rotuladoAt` y `r.body.rotuladoPor` en `null`; el título dice «un solo instante para las dos casillas».
- `apps/desk/server/routes/remision.ts:288`, en sitio: el comentario «formulario nuevo: rotulado, mínimas, novedades» pasa a «mínimas, novedades». Citas a `apps/desk/server/routes/remision.ts` barridas: las de la línea 250 hablan de `hayNovedad` (`openspec/config.yaml:2946`) y siguen ciertas; nadie cita la 288.

### D3 · La acción de confirmar (RQ-RE-40) — handler AL FINAL de `registerRemisionRoutes`
Se registra tras `apps/desk/server/routes/remision.ts:396`: sólo se desplaza la llave de cierre de la función, que nadie cita. Rechazado un fichero de rutas nuevo: el grupo tiene su criterio de acceso por ruta en un solo sitio y partirlo obligaría a tocar `app.ts`. Imports en sitio (`apps/desk/server/routes/remision.ts:4` gana `puedeConfirmarRotulado`; `apps/desk/server/routes/remision.ts:9` gana `confirmarRotulado`). No hay conflicto con `:id`: es `POST` y lleva sufijo propio.

| Orden | Escalón | Guarda | Código | Texto |
|---|---|---|---|---|
| 0 | — | `requireAuth` | `401` | «No autenticado» / «Sesión inválida o expirada» (`apps/desk/server/auth/middleware.ts:17`, `apps/desk/server/auth/middleware.ts:19`) |
| 1 | A | `getRemision` devuelve `null` | `404` | «Remisión no encontrada» |
| 2 | B | `!puedeConfirmarRotulado(req.user)` | `403` | «Confirmar el rotulado requiere el área Servicio Técnico» |
| 3 | B | `rem.anuladaAt` | `409` | «Esta remisión fue anulada: no admite confirmar el rotulado» |
| 4 | B | `!rem.novedades` | `422` | «Esta remisión es anterior al registro de recepción y no lleva confirmación de rotulado» |
| 5 | B | estado distinto de `ok` y de `ok_con_avisos` | `422` | «El rotulado se confirma después de enviar: esta remisión todavía no se envió con éxito» |
| 6 | D | `rem.rotuladoAt`, o el `UPDATE` no devuelve fila | `409` | «El rotulado de esta remisión ya estaba confirmado» |

- **Códigos contrastados con las vecinas:** `404` como `apps/desk/server/routes/remision.ts:276`; `403` de área como `apps/desk/server/routes/ovAsociaciones.ts:47`, con el mismo orden A < permiso < estado; `409` de anulada como `apps/desk/server/routes/remision.ts:280`; `422` de precondición del recurso como `apps/desk/server/routes/remision.ts:302`. **No chocan con la convención: el delta no necesita corrección de códigos.** Matiz anotado: «sin envío con éxito» es un estado y las vecinas usan `409` para estados (`apps/desk/server/routes/remision.ts:285`); se mantiene el `422` de la spec porque distingue por código «todavía no» de «ya está», y las pruebas de posición afirman **código y texto**.
- **Permiso (regla 13):** `puedeConfirmarRotulado(s: { areas: string[]; isAdmin: boolean })` en `packages/shared/src/rotulado.ts`, que devuelve `canExecuteTransition(s.areas, s.isAdmin, 'Servicio Técnico')` (`packages/shared/src/permissions.ts:4`). La decisión la impone el handler; el cliente consume el mismo predicado.
- **Unicidad sin carrera:** `confirmarRotulado(db, id, quien): Promise<Remision | null>`, al final de `apps/desk/server/db/remisiones.ts`: `UPDATE remisiones SET rotulado_at = now(), rotulado_por = $2 WHERE id = $1 AND rotulado_at IS NULL RETURNING *`. Sin fila → el mismo `409` (molde `apps/desk/server/routes/ovAsociaciones.ts:54`). El cuerpo de la petición no se lee. Responde `200` con la remisión y sus fotos.
- **Pruebas de posición**, fichero nuevo `apps/desk/server/rotulado.test.ts`, una por par vecino y con las dos guardas activas: `R40-d1` (0,1) · `R40-d2` (1,2) · `R40-d3` (2,3) · `R40-d4` (3,4) · `R40-d5` (4,5) · `R40-d6` (5,6).

### D4 · «Pendiente de rotular» (RQ-RE-41)
- `pendienteDeRotular(rem: { novedades: unknown; estado: string; anuladaAt: string | null; rotuladoAt: string | null }): boolean` en `packages/shared/src/rotulado.ts`: verdadero si y sólo si `novedades` no es nulo, el estado es `ok` u `ok_con_avisos`, no hay `anuladaAt` y no hay `rotuladoAt`. `packages/shared/src/index.ts` gana una línea al final (hoy exporta `recepcion` en `packages/shared/src/index.ts:29`).
- **Dónde se calcula:** en `toRemision`, la única fábrica de `Remision`, así el campo sale en las dos lecturas, en el `201` del alta y en el `200` de la acción. En sitio: `apps/desk/server/db/remisiones.ts:12` pasa a `const m: Omit<Remision, 'pendienteRotular'> = {` y `apps/desk/server/db/remisiones.ts:26` a `}; return { ...m, pendienteRotular: pendienteDeRotular(m) }`. Rechazado calcularlo en la ruta: son dos lecturas más dos respuestas y una se olvidaría.
- **Tipo:** `packages/shared/src/types.ts:735` gana `; pendienteRotular: boolean` (obligatorio). `enviado_por_id` y `aviso_sin_etiqueta_at` **no** entran en `Remision`: son internos y el payload a n8n no los ve.
- **Molde H5, cerrado con prueba:** la marca y las guardas 3 a 6 son dos expresiones de la misma noción. `R41-c` (nueva, no está en el delta) las enfrenta: por cada fila de la tabla de RQ-RE-41, `pendienteRotular` es verdadero si y sólo si la acción responde `200` a un usuario autorizado.

### D5 · `enviado_por_id` (RQ-RE-42)
- `apps/desk/server/db/remisiones.ts:170`: la firma gana un cuarto parámetro opcional, `enviadoPorId: string | null = null`; `apps/desk/server/db/remisiones.ts:174` añade `, enviado_por_id = $4` al mismo `SET` y `apps/desk/server/db/remisiones.ts:179` añade el parámetro. `apps/desk/server/routes/remision.ts:297` llama `reclamarEnvio(db, id, undefined, req.user!.id)`. Quien pierde la reclamación no escribe porque el `WHERE` no casa; la puerta de contenido corta antes.
- **Si el disparo no sale** (`apps/desk/server/routes/remision.ts:318`): `apps/desk/server/db/remisiones.ts:186` pasa a `SET enviado_at = NULL, enviado_por_id = NULL`. Se conserva **sólo si el envío queda reclamado**: quien no llegó a enviar no es «quien envió», y un aviso dirigido a esa persona sería falso. Consecuencia aceptada: si llega tarde el callback de un intento anterior, el aviso va sólo al cargo (S4). Lo fija `R42-d` (nueva, no está en el delta).
- Rechazado restaurar el valor anterior: pide una columna más para un caso que S4 ya resuelve.

### D6 · El aviso (RQ-AV-22)
- **Condición**, pura, en `packages/shared/src/rotulado.ts`: `etiquetaNoGenerada(estado: string, resultado: unknown): boolean` — estado `ok` u `ok_con_avisos` **y** `dymoId` ausente, `null`, cadena vacía o de sólo espacios, o `resultado` que no es objeto. No lee `avisos`. En shared y no en el servicio porque es una regla sobre `RemisionResultado` (`packages/shared/src/types.ts:641`) que el cliente podrá consumir sin reescribirla.
- **Servicio** `avisarEtiquetaNoGenerada(db, remisionId, estado, resultado): Promise<boolean>`, molde `apps/desk/server/services/avisoReclamacionProveedor.ts:26-44`. Pasos: (1) si `etiquetaNoGenerada` es falso, `false`; (2) lee de la remisión `ticket_id`, `fecha`, `serial` y `enviado_por_id`, y el número del ticket; (3) en `enTransaccion`: destinatarios = quien envió si está activo (`SELECT id FROM users WHERE id = $1 AND active = true`) más `destinatariosDeCargoPermiso(q, 'Director Técnico')` (`apps/desk/server/db/avisos.ts:121-127`); si nadie lleva el cargo, más `destinatariosDeArea(q, 'Servicio Técnico', '')`; plegados por `id` en un `Map`; (4) sin destinatarios: `logger.warn` y `false`, sin marcar; (5) `UPDATE remisiones SET aviso_sin_etiqueta_at = now() WHERE id = $1 AND aviso_sin_etiqueta_at IS NULL RETURNING id`; sin fila, `false`; (6) un `crearAviso` por destinatario con el `ticket_id` de la remisión.
- **Aislamiento:** todo el cuerpo va en `try`/`catch` con `logger.error` y devuelve `false` (molde `apps/desk/server/services/avisoReclamacionProveedor.ts:72-80`): la función **nunca lanza**. Se llama en `apps/desk/server/routes/remision.ts:374`, en sitio y **después** de `sincronizarEstadoPorRemision`, para que ni un aviso lento retrase el avance del ticket; las citas a esa línea siguen ciertas porque el avance sigue siendo su primera sentencia. El import va en sitio en `apps/desk/server/routes/remision.ts:16`.
- **Sólo bandeja (S9), comprobado:** `crearAviso` es un `INSERT` y nada más (`apps/desk/server/db/avisos.ts:8-18`); el correo lo dispara cada llamador y sólo hay tres (`apps/desk/server/services/alarmasSla.ts:131`, `apps/desk/server/services/avisoReasignacion.ts:39`, `apps/desk/server/services/ticketService.ts:217`). No existe pasada que reenvíe los `enviado_at` nulos.
- **Texto** (`textoAvisoSinEtiqueta`, en el servicio):
  - Con ticket: «Ticket #1234: la remisión de entrada se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo (serial ABC123) sigue sin etiqueta para rotular: hay que generarla a mano.»
  - Sin ticket (o ticket no hallado): empieza por «La remisión de entrada del 2026-10-12 se generó, pero…».
  - Sin serial: «El equipo (sin serial registrado) sigue sin etiqueta…».
  - Si `resultado.avisos` trae entradas con `paso` de texto, se añade « Lo que informó n8n: {paso} — {mensaje}; {paso}.» (cada entrada tal cual, `mensaje` sólo si viene, unidas por `; `). Sin entradas, la frase no aparece.
- **Dato para las pruebas:** `destinatariosDeArea` incluye a todo administrador activo (`apps/desk/server/db/avisos.ts:89`): `AV22-k` necesita desactivar al administrador, y `AV22-h` afirma «nadie del área» porque el cargo existe.

### D7 · Esquema — `packages/zoho-sync/src/db/schema.sql`, cuatro líneas AL FINAL (hoy termina en `packages/zoho-sync/src/db/schema.sql:828`)
```sql
-- rotulado-tras-enviar (F1B-04, decision e167): quien envio la remision, por id de usuario y no por nombre (users.name no es unico), y la
-- marca anti-duplicado del aviso de etiqueta no generada. NULL-ables y SIN relleno. AL FINAL para no desplazar citas. CALIFICADAS public.
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS enviado_por_id text;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS aviso_sin_etiqueta_at timestamptz;
```
**Ajuste obligado en `packages/zoho-sync/src/db/migrate.test.ts`, todo en sitio** (dos sentencias más al final desplazan +2 cada índice contado desde el final): `packages/zoho-sync/src/db/migrate.test.ts:796`, `16 → 18`; `packages/zoho-sync/src/db/migrate.test.ts:798`, `15 → 17` y `14 → 16`; `packages/zoho-sync/src/db/migrate.test.ts:839`, `13 → 15`; `packages/zoho-sync/src/db/migrate.test.ts:840`, `12 → 14`; `packages/zoho-sync/src/db/migrate.test.ts:879` y `packages/zoho-sync/src/db/migrate.test.ts:882`, `11 → 13`; `packages/zoho-sync/src/db/migrate.test.ts:880`, `10 → 12`; los ordinales del título de `packages/zoho-sync/src/db/migrate.test.ts:794` y de los títulos de las otras dos pruebas (hipótesis: nombran el ordinal). El recuento (`packages/zoho-sync/src/db/migrate.test.ts:374`, `packages/zoho-sync/src/db/migrate.test.ts:376` y `packages/zoho-sync/src/db/migrate.test.ts:377`) pasa de 64 a **66**, calificadas de 38 a **40** (35 de `public` + 5 de `books`), sin calificar 26 intactas; el conjunto de identidades de `packages/zoho-sync/src/db/migrate.test.ts:385` no cambia.
`packages/zoho-sync/src/db/novedadesSiembra.test.ts:35` no cambia (las columnas del rotulado siguen existiendo). La expresión de `packages/zoho-sync/src/db/novedadesSiembra.test.ts:94` no casa con los dos nombres nuevos, así que el recuento de `packages/zoho-sync/src/db/novedadesSiembra.test.ts:97` sigue en seis (hipótesis: se confirma en verde).
**Regla de mutación 2:** prueba nueva `PS-12`, al final de `packages/zoho-sync/src/db/novedadesSiembra.test.ts`: las dos columnas existen y nacen `NULL` (por comportamiento, molde PS-11), y exactamente dos sentencias las nombran, cada una `^ALTER TABLE public\.remisiones ADD COLUMN IF NOT EXISTS (enviado_por_id text|aviso_sin_etiqueta_at timestamptz)$`. Se muta el **fichero vigilado**: quitar `public.` a una de las dos pone rojas `packages/zoho-sync/src/db/migrate.test.ts:332`, `packages/zoho-sync/src/db/migrate.test.ts:345`, el recuento y `PS-12` (`R42-c`).

### D8 · Comentarios falsos sobre `ok_con_avisos` (S12), en sitio y con las mismas líneas
- `packages/shared/src/types.ts:699-701`: la segunda y la tercera línea pasan a «…y `ok_con_avisos` cuando la remisión se generó pero falló un paso no crítico (un aviso, o la etiqueta .dymo, según leyó el analista en el flujo el 2026-10-12): cuenta como creada.»
- `apps/desk/server/db/remisiones.ts:129-130`: «…`ok_con_avisos` es un éxito: la remisión se generó pero falló un paso no crítico (un aviso, o la etiqueta .dymo, según leyó el analista en el flujo el 2026-10-12); por decisión de producto NO la invalida.»
- Mismo defecto en un texto de pantalla, `apps/desk/src/components/ResultadoRemision.tsx:152` («solo falló el aviso»): pasa a «El documento sí se generó; falló un paso que no lo invalida.» Añadido de este diseño, se declara en `risks`.

### D9 · Cliente — regla invariable 13 y regla de mutación 3
- **Formulario:** `apps/desk/src/lib/recepcionForm.ts:82` pierde el parámetro `rotulado`; `apps/desk/src/lib/recepcionForm.ts:90` deja de mandarlo; `apps/desk/src/lib/recepcionForm.ts:65` y `apps/desk/src/lib/recepcionForm.ts:94` pasan `rotuladoAt: null`; `apps/desk/src/lib/recepcionForm.ts:105` no cambia. `apps/desk/src/api/client.ts:534-535`: sale `rotulado?` del cuerpo. `apps/desk/src/components/CrearRemision.tsx:60` pierde el estado y `apps/desk/src/components/CrearRemision.tsx:116` el argumento. `apps/desk/src/components/CrearRemision.tsx:295-300` se sustituye por **seis líneas** (comentario de dos y un párrafo de cuatro): «El rotulado se confirma después de enviar, con la etiqueta DYMO ya impresa: lo pedirá la pantalla de resultado.» Así el `.tsx` no se desplaza y el técnico sabe adónde fue la casilla.
- **Confirmación:** componente nuevo `ConfirmarRotulado` (`rem`, `onConfirmado`), que sólo pinta lo que devuelve `vistaRotulado(rem, usuario)`; el usuario sale de `useAuth` como en `apps/desk/src/components/TransitionPanel.tsx:55`. Se monta en la línea 170 de `apps/desk/src/components/ResultadoRemision.tsx`, hoy vacía, y en la línea 71 de `apps/desk/src/components/PanelRemisiones.tsx`, hoy vacía; `apps/desk/src/components/PanelRemisiones.tsx:12` y `apps/desk/src/components/PanelRemisiones.tsx:130` pasan `onCambio` en sitio; el import, en `apps/desk/src/components/ResultadoRemision.tsx:4` y `apps/desk/src/components/PanelRemisiones.tsx:5`.
- **`vistaRotulado`** devuelve `{ tipo: 'nada' }`, `{ tipo: 'pendiente', puedeConfirmar }` o `{ tipo: 'confirmado', texto }`. Lee `rem.pendienteRotular` **sin recalcularlo**; `puedeConfirmar` es `puedeConfirmarRotulado(usuario)`; «confirmado» exige `novedades` y `rotuladoAt`. Textos: «Pendiente de rotular»; botón «Confirmar rotulado y guardado»; sin permiso, «Lo confirma Servicio Técnico»; hecho, «Rotulado y guardado: lo confirmó {persona} el {fecha y hora}». Un error de la acción se muestra tal cual y se relee la remisión.
- **¿Booleano del servidor o predicado compartido?** Predicado compartido. Un `puedeConfirmarRotulado` dentro de la remisión haría que el mismo documento dijera cosas distintas según quién lo lea y obligaría a pasar el usuario a `toRemision`. El espejo es legítimo (regla 13, punto 3) porque el `403` queda probado por `R40-b`, `R40-d2` y `R40-d3`.

| Lo que el cliente decide | Lo impone el servidor en | Prueba |
|---|---|---|
| Pinta «Pendiente de rotular» | `toRemision` (`apps/desk/server/db/remisiones.ts:26` tras el cambio) | `R41-a`, `R41-b` |
| Ofrece el botón sólo a quien puede | Guarda 2 del handler nuevo (línea: hipótesis hasta el apply) | `R40-b`, `R40-d2`, `R40-d3` |
| Ofrece el botón sólo si está pendiente | Guardas 3 a 6 del handler nuevo | `R40-c`, `R40-d4` a `R40-d6`, `R41-c` |
| Deja crear y enviar sin casilla | Las líneas 101 y 155 de `packages/shared/src/recepcion.ts`, ya sin guarda | Pruebas cambiadas de D10 |
| Da el rotulado por confirmado tras pulsar | El `200` de la acción, con la traza escrita por `confirmarRotulado` | `R40-a` |
| Quién confirmó y cuándo | No viaja: lo escribe el servidor | `R40-a` |
| La nota del formulario | **Ninguna, a propósito:** es texto, no una decisión | — |

### D10 · Plan de pruebas (`strict_tdd`: el rojo se anota antes del producto)
**Existentes que cambian a propósito, en sitio:**
| Prueba | Pasa a afirmar |
|---|---|
| `packages/shared/src/recepcion.test.ts:79-85` | «6 · retirado»: `rotulado` ausente, `false`, `'true'` y `1` dan `ok` |
| `packages/shared/src/recepcion.test.ts:99` | La constante `MSG6` se sustituye por un comentario (sin uso rompería lint) |
| `packages/shared/src/recepcion.test.ts:117`, `packages/shared/src/recepcion.test.ts:120`, `packages/shared/src/recepcion.test.ts:123`, `packages/shared/src/recepcion.test.ts:126` | Sólo el título: el rotulado ausente o falso ya no es un paso; el error esperado no cambia |
| `packages/shared/src/recepcion.test.ts:129-131` | Sin defectos pasa, y con `rotulado: false` también |
| `packages/shared/src/recepcion.test.ts:264` | Con `rotuladoAt` nulo y las mínimas, el motivo es el de la foto de la novedad |
| `packages/shared/src/recepcion.test.ts:272-273` (PE-3) | Mínimas antes que novedades; `rotuladoAt` nulo no interviene |
| `packages/shared/src/recepcion.test.ts:365` y `packages/shared/src/recepcion.test.ts:374` (PI-7) | Los pasos (1) a (5) ganan al (7); con `rotulado: false` responde el (7) |
| `apps/desk/server/recepcion.test.ts:65` y `apps/desk/server/recepcion.test.ts:73` | El caso «sin rotulado» se sustituye por «un elemento que no es texto» |
| `apps/desk/server/recepcion.test.ts:86-94` | `false`, `'true'` y `1` dan `201` (con `permitirSegunda`) y `rotulado_at` nulo |
| `apps/desk/server/recepcion.test.ts:144` y `apps/desk/server/recepcion.test.ts:157-162` | El alta deja `rotulado_por` y `rotulado_at` en `NULL`, en la fila y en el cuerpo |
| `apps/desk/server/recepcion.test.ts:273` | Sólo el título: el rotulado ya no es guarda |
| `apps/desk/server/recepcion.test.ts:370` y `apps/desk/server/recepcion.test.ts:375` | Con `rotulado_at` nulo y todas las fotos: `200` y dispara a n8n |
| `apps/desk/server/recepcion.test.ts:463` y `apps/desk/server/recepcion.test.ts:466-469` (S3a) | Con `rotulado_at` nulo gana el de mínimas; no aparece el de novedades |
| `apps/desk/server/recepcion.test.ts:570` y `apps/desk/server/recepcion.test.ts:578` (PT-1b) | D2 |
| `apps/desk/src/lib/recepcionForm.test.ts:65-66` | Sin rotulado: `null` |
| `apps/desk/src/lib/recepcionForm.test.ts:87-88` | El motivo del formulario que precede es el de la lista vacía |
| `apps/desk/src/lib/recepcionForm.test.ts:111`, `apps/desk/src/lib/recepcionForm.test.ts:119`, `apps/desk/src/lib/recepcionForm.test.ts:124`, `apps/desk/src/lib/recepcionForm.test.ts:127` | La llamada pierde el cuarto argumento |
| `apps/desk/src/lib/recepcionForm.test.ts:115` y `apps/desk/src/lib/recepcionForm.test.ts:129` | El cuerpo ya no lleva `rotulado`; la remisión lleva `rotuladoAt: null` |

Las 51 apariciones de `rotulado: true` en los cuerpos de prueba no se tocan: el valor se ignora.

**Nuevas, al final de su fichero o en fichero nuevo:**
| Fichero | Casos |
|---|---|
| `packages/shared/src/rotulado.test.ts` (nuevo) | `R41-a` (las siete filas) · `PR-1` `puedeConfirmarRotulado` por área y administrador · `AV22-a` a `AV22-d` sobre `etiquetaNoGenerada` (formas de vacío, `dymoId` presente, `error`, independencia del texto del paso) |
| `apps/desk/server/rotulado.test.ts` (nuevo) | `R40-a`, `R40-b`, `R40-c` (repetida y dos simultáneas), `R40-d1` a `R40-d6`, `R40-e`, `R40-f`, `R41-b`, `R41-c`, `R42-a`, `R42-b`, `R42-d` |
| `packages/zoho-sync/src/db/novedadesSiembra.test.ts` | `PS-12` (`R42-c`) |
| `apps/desk/server/services/avisoEtiquetaNoGenerada.test.ts` (nuevo, por la ruta del callback) | `AV22-a` a `AV22-m`, y `AV22-t` con las cuatro variantes del texto |
| `apps/desk/src/lib/rotuladoVista.test.ts` (nuevo) | `RV-1` nada (legado, sin enviar, anulada) · `RV-2` pendiente con y sin permiso · `RV-3` confirmado con persona y hora · `RV-4` no recalcula: con `pendienteRotular` falso y datos que «parecen» pendientes, devuelve nada |

**Barrido obligatorio antes del lote del aviso:** hay once llamadas al callback en `apps/desk/server/remisiones.test.ts` (por ejemplo `apps/desk/server/remisiones.test.ts:383-384` y `apps/desk/server/remisiones.test.ts:408`) y mandan `ok` **sin** `resultado`: con G1 pasan a crear avisos. Las que cuenten filas de `avisos` cambian a propósito; se listan una a una en `apply-progress.md`.

### D11 · Mutaciones que el apply reproduce (se restaura siempre; resultado en `apply-progress.md`) — HIPÓTESIS
| Mutación | Debe ponerse roja |
|---|---|
| **M1** reponer la guarda del alta en la línea 101 | `packages/shared/src/recepcion.test.ts:79-85`, `apps/desk/server/recepcion.test.ts:86-94` |
| **M2** reponer la guarda del envío en la línea 155 | PE-3, S3a, `apps/desk/server/recepcion.test.ts:370` |
| **M3** quitar `requireAuth` de la acción | `R40-d1` |
| **M4** a **M8** intercambiar las guardas (1,2) · (2,3) · (3,4) · (4,5) · (5,6) | `R40-d2` · `R40-d3` · `R40-d4` · `R40-d5` · `R40-d6` |
| **M9** quitar `AND rotulado_at IS NULL` del `UPDATE` y la guarda 6 | `R40-c` |
| **M10** `pendienteDeRotular` sin mirar `anuladaAt` · sin mirar `novedades` · sin mirar el estado | `R41-a`, `R41-c` (las tres) |
| **M11** `etiquetaNoGenerada` acepta `error` · decide por el texto de `avisos[].paso` | `AV22-c` · `AV22-d` |
| **M12** quitar `AND aviso_sin_etiqueta_at IS NULL` | `AV22-e`, `AV22-f` |
| **M13** quitar el `try`/`catch` del servicio | `AV22-l` |
| **M14** (regla 2) una de las dos `ALTER` sin `public.` | `PS-12` y las tres de `packages/zoho-sync/src/db/migrate.test.ts` de D7 |
| **M15** el alta vuelve a escribir `rotulado_at` con `rotulado: true` | `apps/desk/server/recepcion.test.ts:157-162`, PT-1b |
| **M16** `reclamarEnvio` sin `enviado_por_id` · `liberarEnvio` sin limpiarlo | `R42-a` · `R42-d` |
| **M17** marcar antes de mirar destinatarios | `AV22-k` |
| **M18** (regla 3) `vistaRotulado` recalcula en vez de leer el campo | `RV-4` |

### D12 · Partición en lotes (inserciones + borrados; una línea en sitio cuenta dos)
| Lote | Contenido | Estimado | ×1,8 |
|---|---|---|---|
| **1a** · retirada, G2, S12, esquema, quién envía | `recepcion.ts` (10) · `types.ts` comentarios (6) · `packages/shared/src/recepcion.test.ts` (42) · `db/remisiones.ts` (22) · `routes/remision.ts` (6) · `schema.sql`, `migrate.test.ts` y `PS-12` (42) · `apps/desk/server/recepcion.test.ts` (56) · `R42-a`, `R42-b`, `R42-d` (55) · `recepcionForm.test.ts` líneas 66 y 88 (8) · `apply-progress.md` (50) | 297 | **535** |
| **1b** · acción y marca | `rotulado.ts`, índice y su prueba (74) · `types.ts` línea 735 (2) · `db/remisiones.ts` (16) · `routes/remision.ts` (26) · `R40-*`, `R41-b`, `R41-c` (170) · `apply-progress.md` (45) | 333 | **599** |
| **2** · aviso | `etiquetaNoGenerada` y sus pruebas (28) · servicio (70) · pruebas `AV22-*` (210) · `routes/remision.ts` (4) · pruebas existentes del callback (reserva 20) · `apply-progress.md` (45) | 377 | **679** |
| **3** · cliente | `recepcionForm.ts` y su prueba (20) · `client.ts` (12) · `rotuladoVista.ts` y su prueba (80) · `ConfirmarRotulado.tsx` (45) · tres `.tsx` (28) · `apply-progress.md` (45) | 230 | **414** |

Ninguno pasa de la válvula de 720. El lote 1 de la propuesta se parte en dos porque junto estima 1.066. El lote 2 va justo: si la medida intermedia pasa de 600 antes de `AV22-g` a `AV22-k`, esos cinco pasan a un lote 2b. Cada lote es desplegable solo: tras el 1a nadie exige el rotulado y nada lo confirma todavía (la marca aparece con el 1b). Medida de cierre: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear.

### D13 · Migración, despliegue y vuelta atrás
Dos sentencias idempotentes y sin relleno, que corren en el arranque. Comprobar en producción: (1) `enviado_por_id` y `aviso_sin_etiqueta_at` existen en `public.remisiones` y están en `NULL` en todas las filas; (2) ninguna remisión anterior sale pendiente de rotular (todas las del formulario nuevo traen `rotulado_at`); (3) una remisión nueva se crea y se envía sin casilla, sale pendiente y se confirma una vez; (4) el ticket llega a «Remisión creada» sin confirmar; (5) el primer envío real con etiqueta **no** genera aviso (tarea de persona: es la comprobación de G1). **Vuelta atrás:** revertir el commit; las dos columnas se quedan sin uso. Efecto: una remisión creada con la versión nueva y aún sin enviar no tiene `rotulado_at`, y la versión anterior no la deja enviar: hay que crearla de nuevo. Las ya enviadas no se ven afectadas, y las confirmadas conservan su traza.

## Matriz de amenazas
N/A — no hay shell, subprocesos, automatización de VCS o de PR, clasificación de ejecutables ni integración de procesos. La ruta HTTP nueva queda cubierta por la tabla de guardas de D3 y sus pruebas de posición.

## Preguntas abiertas
- [ ] ¿Rompe `pendienteRotular` obligatorio algún literal de `Remision` en pruebas? Hipótesis: pocos; si `npm run typecheck` da más de cinco, el campo pasa a opcional y se anota.
- [ ] ¿Acepta pg-mem `enviado_por_id = $4` con el parámetro en `null` y `RETURNING *` en `confirmarRotulado`? Hipótesis: sí; si no, `RETURNING id` y relectura con `getRemision`.
- [ ] ¿Se puede simular en pg-mem las dos confirmaciones simultáneas de `R40-c`? Hipótesis: con `Promise.all` sobre la ruta basta para afirmar «exactamente una gana».
- [ ] ¿Cuántas de las once llamadas al callback de las pruebas existentes cuentan avisos? Se mide al abrir el lote 2.
- [ ] Los `422` posteriores a la reclamación (`apps/desk/server/routes/remision.ts:302`) dejan `enviado_por_id` escrito sin envío real: comportamiento heredado de `enviado_at`, inocuo para el aviso (no habrá callback), fuera de alcance.
