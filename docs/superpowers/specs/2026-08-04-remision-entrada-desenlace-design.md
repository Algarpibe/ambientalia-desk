# Diseño — Desenlace de la remisión de entrada: `ok_con_avisos`, workflow de errores y resultado en pantalla

**Fecha:** 2026-08-04
**Estado:** Aprobado para planificación
**Contexto:** El subsistema de remisiones de entrada funciona end-to-end, pero **el callback siempre dice `ok`**.
La causa no es que nadie recoja los avisos: es que el nodo `Callback Desk (ok)` cuelga del final de **una** de las
siete ramas paralelas de entrada (`Mueve PDF Entrada`), con `estado: 'ok'` escrito a mano en el `jsonBody`. Se
dispara cuando termina la cadena del PDF, sin esperar a las otras seis y sin mirar si alguna falló. Además,
`BBDD remisiones_entrada` y `Mueve foto Entrada` son hoy **fatales**: si caen, la ejecución aborta, el callback no
llega nunca y la remisión se queda en `pendiente` para siempre, en silencio.
**Flujo:** `Remisiones_ST_3.13_Desk` (`BpLlnPAfjpHaoeKA`), 63 nodos, activo.
⚠️ `Remisiones_ST_3.13` (`2OJl7Y75KykNNHyT`) es **producción y no se toca**. Verificar el id antes de cada escritura.
**Depende de:** remisiones en Postgres (`remisiones`, `remision_fotos`), credenciales `Remisión Desk → n8n`
(`PXE0OpsjfgwCMMuW`) y `Callback n8n → Desk` (`XI4FybGmVyzxjt4O`). Memoria `remisiones-n8n-integracion`.

## Decisiones (confirmadas)

1. **Qué es aviso y qué es error.** Aviso: el correo al técnico, el mensaje de Telegram AGPB y la etiqueta `.dymo`.
   Error: el documento/PDF, la hoja de cálculo y el registro fotográfico. Criterio: *si no queda rastro documental,
   es error*.
2. **El colector decide.** Ninguna rama posterior al reparto es fatal; un `Code` final clasifica y hace **una sola**
   llamada al callback. Coste aceptado: la ejecución de n8n queda "verde" aunque el documento falle, así que **la
   señal de fallo deja de ser el rojo del panel de n8n y pasa a ser el estado en Desk**.
3. **Alcance:** n8n + backend + resultado en el formulario. El panel de remisiones del ticket queda fuera.
4. **Workflow de errores:** genérico y pequeño (`Error Trigger` → Telegram), reutilizable por todos los flujos. No
   marca la remisión: solo avisa a una persona.

## La frontera: antes y después del reparto

El colector solo puede garantizar un callback para lo que ocurre **después** de que exista la carpeta de Drive. Si
falla algo antes (`Webhook Remisión`, `Validar payload`, `Remision-Entrada-Salida`, `Code Parsing Datos Agente IA`,
`If Entrada`, `Merge Entrada`, `Verifica Incluye Entrada`, `Copia archivo base Entrada`, `Crea carpeta Entrada`) no
hay siete ramas que recolectar, hay cero. **Esos nodos siguen siendo fatales**: la ejecución muere en rojo y quien
avisa es el workflow de errores.

Eso deja un hueco declarado: un fallo pre-reparto deja la remisión en `pendiente`. Se cubre desde la app (sondeo con
caducidad y botón de reintentar), no metiendo más nodos en n8n.

De `Crea carpeta Entrada` hacia abajo, **todo pasa a `onError: continueRegularOutput`**. Es lo que hace determinista
al colector: toda rama viva llega siempre a su final, con o sin error dentro. Los `retryOnFail` (3 × 5000 ms) que ya
existen se conservan: reintentar sigue siendo lo primero que debe pasar.

## Arquitectura n8n (63 → 65 nodos)

```
Crea carpeta Entrada ──┬─> Correo Remisión Entrada ─────────────────────────> [0]
                       ├─> Code JS .dymo → Sube el .dymo → Mueve dymo ──────> [1]
                       ├─> Mensaje Remisión Entrada AGPB ───────────────────> [2]
                       ├─> Doc Remisión Entrada ─┬─> Mueve Gdoc Entrada ────> [3]
                       │                         └─> Convertir PDF Entada → PDF a bin Entrada
                       │                              → Sube PDF Entrada → Mueve PDF Entrada ──> [4]
                       ├─> BBDD remisiones_entrada ─────────────────────────> [5]
                       └─> Merge Fotos Entrada → Code fotos Entrada → If Hay foto Entrada
                                   ├─(true)─> Sube foto Entrada → Mueve foto Entrada ─────────> [6]
                                   └─(false)──────────────────────────────────────────────────> [6]

              [0..6] → Merge Colector Entrada (append, numberInputs 7)
                          → Code Resumen Entrada → Callback Desk
```

**Nodos nuevos (2):** `Merge Colector Entrada` (`n8n-nodes-base.merge`, modo append, 7 entradas) y
`Code Resumen Entrada` (`n8n-nodes-base.code`).

**Conexión que se quita (1):** `Mueve PDF Entrada → Callback Desk (ok)`.

**Conexión que se añade y que es fácil olvidar:** la salida `false` de `If Hay foto Entrada` va también a la entrada
`[6]`. Sin ella, una remisión **sin fotos** deja esa entrada del `Merge` muda. Además le da al resumen el dato
"aquí no había fotos", que de otro modo no se distingue de un fallo.

`Mensaje Remisión Entrada GANG` sigue **desactivado y fuera del colector**, como hoy.

`Callback Desk (ok)` se renombra a `Callback Desk`: el `(ok)` deja de ser cierto. Antes de renombrar, comprobar con
`n8n_get_workflow` que ninguna expresión del flujo mencione el nombre viejo — es un nodo terminal, así que se espera
que no, pero esa comprobación es barata y la lección de la sesión anterior fue exactamente esa.

## `Code Resumen Entrada`: cómo clasifica

Interroga **cada nodo falible por su nombre**, no solo los finales de rama. Si se interrogaran solo los finales, un
fallo en `Doc Remisión Entrada` se reportaría como "falló el PDF": con `continueRegularOutput` el error se arrastra
por la cadena y el terminal falla *por consecuencia*. Con la tabla completa se nombra el primer paso que cayó, que es
el que hay que mirar. La barrera del `Merge` es lo que hace seguras estas referencias: sin ella, n8n no garantiza el
orden entre ramas paralelas y `$('Correo Remisión Entrada')` podría lanzar por no haberse ejecutado *todavía*.

| Paso (nodo n8n) | Etiqueta para el técnico | Clase |
|---|---|---|
| `Doc Remisión Entrada`, `Mueve Gdoc Entrada` | el documento de la remisión | crítico |
| `Convertir PDF Entada`, `PDF a bin Entrada`, `Sube PDF Entrada`, `Mueve PDF Entrada` | el PDF de la remisión | crítico |
| `BBDD remisiones_entrada` | el registro en la hoja de cálculo | crítico |
| `Code fotos Entrada`, `Sube foto Entrada`, `Mueve foto Entrada` | el registro fotográfico | crítico |
| `Correo Remisión Entrada` | el correo al técnico | aviso |
| `Code JS .dymo`, `Sube el .dymo`, `Mueve dymo Entrada` | la etiqueta .dymo | aviso |
| `Mensaje Remisión Entrada AGPB` | el aviso de Telegram | aviso |

Las etiquetas van **en español y ya redactadas para enseñárselas al técnico**: la pantalla no debe traducir nombres
de nodos de n8n.

Un paso cuenta como caído si no se ejecutó o si su item trae `error`. Única excepción: cuando `Code fotos Entrada`
reporta `NO_IMAGES_FOUND`, que `Sube foto Entrada` y `Mueve foto Entrada` no se ejecuten es lo correcto y cuenta como
*no aplica*.

```js
// Forma; la API exacta (isExecuted, forma del item de error) se confirma contra get_node
// y la skill n8n-code-javascript al implementar.
const PASOS = [
  { nodo: 'Doc Remisión Entrada',          etiqueta: 'el documento de la remisión', critico: true },
  // … resto de la tabla, en orden de cadena …
  { nodo: 'Mensaje Remisión Entrada AGPB', etiqueta: 'el aviso de Telegram',        critico: false },
]

// `all(n)` selecciona la SALIDA n del nodo: 0 = "hay fotos", 1 = "no hay". Preguntárselo al propio If
// evita depender del centinela interno de `Code fotos Entrada` (hoy `NO_IMAGES_FOUND`).
const sinFotos = $('If Hay foto Entrada').all(0).length === 0
const OPCIONALES_SIN_FOTOS = new Set(['Sube foto Entrada', 'Mueve foto Entrada'])

const caidos = []
for (const p of PASOS) {
  if (sinFotos && OPCIONALES_SIN_FOTOS.has(p.nodo)) continue   // no aplica, no es fallo
  let motivo = null
  try {
    const items = $(p.nodo).all()
    if (!items.length) motivo = 'sin resultado'
    else if (items[0].json?.error) motivo = String(items[0].json.error)
  } catch { motivo = 'no se ejecutó' }
  if (motivo) caidos.push({ ...p, motivo })
}

const fallos = caidos.filter((c) => c.critico)
const avisos = caidos.filter((c) => !c.critico)
const estado = fallos.length ? 'error' : avisos.length ? 'ok_con_avisos' : 'ok'
```

Nota sobre el orden de la tabla: los pasos se recorren en orden de cadena, de modo que en `fallos`/`avisos` el
primer elemento de cada rama es la causa raíz y los siguientes son su consecuencia. La pantalla puede enseñar solo
el primero por rama sin perder información útil.

## Contrato del callback

`Code Resumen Entrada` produce el cuerpo; `Callback Desk` lo manda a
`POST /api/remisiones/{remisionId}/callback` con la cabecera `X-Remision-Callback` (sin cambios en autenticación).

```jsonc
{
  "estado": "ok_con_avisos",              // ok | ok_con_avisos | error
  "resultado": {
    "carpetaId":  "1AbC…",
    "carpetaUrl": "https://drive.google.com/drive/folders/1AbC…",
    "docId":      "1XyZ…",
    "pdfId":      "1QrS…",
    "fotos":   { "recibidas": 3, "subidas": 3 },   // recibidas = items de Code fotos Entrada; subidas = de Mueve foto Entrada
    "avisos":  [ { "paso": "el correo al técnico", "mensaje": "Invalid recipient" } ],
    "fallos":  [],
    "ejecucionId": "1234"
  }
}
```

`ejecucionId` (`$execution.id`) se guarda para poder abrir la ejecución en n8n cuando alguien reporte un problema.

## Cambios en el backend (`apps/desk/server/routes/remision.ts`)

**Uno — `GET /api/remisiones/:id`** con `requireAuth`, que devuelve la `Remision` con sus fotos (mismo objeto que
produce hoy `GET /api/remisiones?ticketId=` por elemento). Es lo que sondea el formulario.
Se registra **después** de `/api/remisiones/nueva`; si se registrara antes, `:id` capturaría `nueva`.

**Dos — cerrojo en `POST /:id/enviar`.** Solo se permite enviar cuando el estado es `pendiente` o `error`; con `ok`
u `ok_con_avisos` responde **409**. Sin esto, el botón de reintentar que se añade abajo permitiría generar un
segundo documento y una segunda carpeta en Drive para el mismo equipo. No estaba en el encargo, pero el reintento
convierte ese fallo en probable, no teórico.

**Tres — al reenviar, `estado` vuelve a `pendiente` y `resultado` a `null`** (antes de disparar el webhook). Sin
esto, el sondeo leería el `error` de la vez anterior y daría por fracasado un envío que acaba de empezar.

El callback en sí **no cambia**: ya valida los tres estados y ya persiste `resultado`. **No hay migración de
esquema**: `remisiones.estado`, `remisiones.resultado` (jsonb) y `remisiones.resuelto_at` ya existen y
`setResultadoRemision` ya los escribe.

## Cambios en la UI (`apps/desk/src/components/CrearRemision.tsx`)

Hoy `submit()` hace `enviarRemision(rem.id)` y llama a `onCreada()`, que cierra el modal de inmediato — el técnico
se va antes de que exista el desenlace. En su lugar, el modal pasa a una vista de resultado que consulta
`GET /api/remisiones/:id` **cada 2 s hasta 60 s**:

| Estado | Lo que ve el técnico |
|---|---|
| `pendiente` | "Generando la remisión…" con indicador de espera |
| `ok` | "Remisión creada" + enlace a la carpeta de Drive (`resultado.carpetaUrl`) |
| `ok_con_avisos` | "Remisión creada, con avisos" + las etiquetas de `resultado.avisos` |
| `error` | "No se pudo generar la remisión" + las etiquetas de `resultado.fallos` + **Reintentar** |
| pasan 60 s | "n8n no ha respondido todavía. La remisión está guardada." + **Reintentar** |

El caso del sondeo agotado es justo el hueco pre-reparto: el técnico lo ve y puede reintentar, en vez de irse
creyendo que todo fue bien. **Cerrar el panel siempre está permitido**: el estado ya está guardado en Postgres y no
depende de que la pantalla siga abierta. El sondeo se cancela al desmontar el componente.

Sin harness de componentes React en el repo, esto se verifica con `typecheck` + `lint` + `build` y con la prueba
real en el navegador.

## Workflow de errores — `Errores_Ambientalia` (nuevo)

`Error Trigger` → `Telegram`. El mensaje lleva el nombre del flujo, el nodo que murió (`execution.lastNodeExecuted`),
el mensaje de error, el id de ejecución y la hora. Reutiliza la credencial de Telegram que ya usa el flujo: **sin
credenciales nuevas**.

El `Error Trigger` **no recibe datos de negocio** — solo `execution.{id,url,error,lastNodeExecuted}` y
`workflow.{id,name}` — así que no puede saber de qué remisión hablaba la ejecución sin ir a la API de n8n. Por eso
solo alerta: cerrar la remisión es trabajo del colector y, cuando el colector no llega a correr, del reintento desde
la app.

Se crea **sin tocar nada existente**. Asignarlo (Workflow Settings → Error Workflow) es **solo-UI**, el MCP no puede:
lo hace el usuario, primero **solo en `_Desk`**, dejando producción (`2OJl7Y75KykNNHyT`) al margen hasta verlo
funcionar.

## Pruebas

**Automáticas (vitest + pg-mem), en `apps/desk/server`:**
- `GET /api/remisiones/:id` devuelve la remisión con sus fotos; 404 si no existe; 401 sin sesión.
- `GET /api/remisiones/nueva` sigue funcionando tras registrar `/:id` (regresión del orden de rutas).
- `POST /:id/enviar` responde **409** con estado `ok` y con `ok_con_avisos`; procede con `pendiente` y con `error`.
- Al reenviar una remisión en `error`, el estado queda `pendiente` y `resultado` a `null` antes del disparo.
- El callback con `ok_con_avisos` persiste `estado` y el `resultado` completo (avisos incluidos).

**Manuales, sobre `_Desk` — cuatro ejecuciones reales.** Ninguna prueba automática cubre el `Merge` de 7 entradas, y
ahí está el riesgo real:
1. Remisión **con fotos** → debe llegar `ok`.
2. Remisión **sin fotos** → debe llegar `ok`. Es la que prueba el cable `false` de `If Hay foto Entrada`: si el
   `Merge` se cuelga, se cuelga aquí.
3. **Aviso forzado**: chat id inválido en `Mensaje Remisión Entrada AGPB` → debe llegar `ok_con_avisos` nombrando ese
   paso. Revertir después.
4. **Crítico forzado**: hoja inexistente en `BBDD remisiones_entrada` → debe llegar `error`. Revertir después.

Y tras cada escritura en n8n, `n8n_get_workflow` para **leer `connections` a mano**. `validate_workflow` es necesario
pero no suficiente: en la sesión anterior dio verde a un flujo que generaba PDFs con los campos en blanco.

## Secuencia de despliegue

1. **App primero** (backend + UI) → push a `main` → despliegue en EasyPanel. El endpoint de callback ya acepta los
   tres estados, así que la app queda lista antes de que n8n empiece a mandarlos.
2. **Flujo `_Desk`** (colector + `onError` + recableado) y ejecuciones 1 y 2.
3. **`Errores_Ambientalia`** y su asignación manual a `_Desk`.
4. Ejecuciones 3 y 4 (fallos forzados) y reversión.

No hay DDL, así que la regla "app antes que worker" de la replicación lógica no aplica aquí.

## Riesgos

- **El `Merge` de 7 entradas.** n8n resuelve solo las entradas que no van a recibir datos, pero eso es comportamiento
  del motor y no lo firma ninguna validación. Mitigación: la ejecución 2 (sin fotos) y la lectura manual de
  `connections`. Si se colgara, la salida es partirlo en dos `Merge` encadenados.
- **La ejecución de n8n queda verde cuando falla un crítico.** Consecuencia aceptada de la decisión 2: quien vigile
  el panel de n8n dejará de ver esos fallos. La señal pasa a ser el estado en Desk (y, más adelante, el panel de
  remisiones del ticket).
- **Referencias por nombre de nodo.** El colector depende de los nombres de 17 nodos: los 15 de la tabla de pasos,
  más `If Hay foto Entrada` (para saber si había fotos) y `Crea carpeta Entrada` (para el enlace a Drive).
  Renombrar cualquiera de ellos
  lo rompe en silencio, igual que las 127 expresiones que ya existen en el flujo. No se renombra ninguno salvo
  `Callback Desk (ok)`, que es terminal.

## Fuera de alcance

- El panel de remisiones en `TicketDetailView` (sigue en pendientes).
- La rama de **salida** del flujo, intacta.
- Cualquier cambio en `Remisiones_ST_3.13` (producción).
- Marcar la remisión desde el workflow de errores vía API de n8n (descartado: credencial nueva y un flujo más que
  puede fallar).
- Reactivar `Mensaje Remisión Entrada GANG`, que sigue desactivado a propósito.
