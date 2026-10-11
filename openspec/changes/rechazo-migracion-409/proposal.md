---
tanda: F1F-01
motivo: ""
capacidad: [zoho-sync]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: la ejecución rechazada de la migración responde `409` con mensaje claro

## Intención

`decision/migracion-rechazada-responde-409-11-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`) decide que la ejecución rechazada de la migración de tickets abiertos reciba un `409` con mensaje claro en vez del `500`. Es la respuesta a la pregunta que dejó abierta el cambio anterior, `migracion-una-sola-ejecucion` (`openspec/changes/archive/2026-10-11-migracion-una-sola-ejecucion/archive-report.md:44-47`). Sólo cambia la respuesta HTTP: no cambia qué se escribe, ni la transacción, ni el interruptor.

Pasaje del maestro: ninguno. El cambio sale de una decisión de Gerencia.

`cierra: no`: a F1F-01 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:125`) le quedan las mismas tareas de persona: nombrar al suplente, responder E-208 (`docs/sdd/ENTRADA.md:2047`), el cotejo de la hoja de Google y la ejecución en producción.

## Problema

Cuando `migrarTicketsAbiertos` se rechaza porque un ticket «pasó a estar gobernado entre la lectura y la escritura», lanza un `Error` genérico (`apps/desk/server/db/migracionTicketsAbiertos.ts:90`). `enTransaccion` deshace y lo relanza (`apps/desk/server/db/transaccion.ts:22-24`); `asyncHandler` lo pasa a `next` (`apps/desk/server/util/asyncHandler.ts:3`); el manejador central sólo traduce `HttpError`, `OvYaAsociadaError` (`apps/desk/server/app.ts:79`) y `MulterError` (`apps/desk/server/app.ts:84-89`), y a lo demás responde `500` con «Error interno» (`apps/desk/server/app.ts:90-92`). Quien ejecuta el día del corte lee un fallo donde lo que hay es otra ejecución que se le adelantó.

**Eso es lectura de código, no medido por HTTP.** Ninguna prueba de `apps/desk/server/migracionTicketsAbiertosRuta.test.ts` provoca el rechazo: su arnés (`apps/desk/server/migracionTicketsAbiertosRuta.test.ts:21-27`) apunta las sentencias pero no deja intervenir entre ellas. Este cambio lo mide con una prueba de ruta, que nace roja con ese `500`.

## Alcance

### Dentro

1. **Error con tipo propio.** `MigracionAdelantadaError`, clase exportada que lleva el número del ticket, declarada **al final** de `apps/desk/server/db/migracionTicketsAbiertos.ts` (tras la línea 95, la última). La línea 90 pasa a lanzarla, en sitio, con el **mismo texto** de mensaje que hoy: lo citan RQ-ZS-23 (`openspec/specs/zoho-sync/spec.md:1371-1372`) y dos pruebas (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:174`, `apps/desk/server/db/migracionConcurrente.integration.test.ts:25`). No cambia el `UPDATE`, ni la transacción, ni nada de lo que se escribe.
2. **La ruta lo traduce con un manejador de error propio**, declarado al final de `apps/desk/server/routes/admin.ts` (tras la línea 255) y enganchado en sitio como último eslabón de la cadena de `apps/desk/server/routes/admin.ts:222-232`: la línea 232 pasa de cerrar con `}))` a cerrar con el manejador detrás. Si el error es `MigracionAdelantadaError` responde `409`; cualquier otro lo pasa con `next(err)` y sigue dando el `500` central. La distinción es por `instanceof`, nunca por el texto. La importación se amplía dentro de `apps/desk/server/routes/admin.ts:234`. El manejador central (`apps/desk/server/app.ts:78-93`) no se toca.
3. **Cuerpo del `409` nuevo:** `{ error: <mensaje>, motivo: 'otra-ejecucion' }`. Mensaje exacto, con N = número del ticket: «Otra ejecución de la migración está en curso o acaba de confirmarse (o el ticket N cambió en la aplicación mientras ésta escribía). Esta ejecución no escribió nada. Compruébalo con una pasada en seco —la misma llamada sin `aplicar`— antes de volver a lanzarla.»
4. **Cómo se distinguen los dos `409` de la ruta.** El de la negativa (`apps/desk/server/routes/admin.ts:231`) trae el informe completo, con `negativa` rellena y `aplicado: false`, y sin clave `error`. El nuevo trae `error` y `motivo: 'otra-ejecucion'`, sin informe. No pueden coincidir: la negativa devuelve antes del primer `INSERT` (`apps/desk/server/db/migracionTicketsAbiertos.ts:70`) y el rechazo sólo salta al escribir (`apps/desk/server/db/migracionTicketsAbiertos.ts:84-90`).
5. **Pruebas.**
   - (a) De ruta sobre pg-mem, **al final** de `apps/desk/server/migracionTicketsAbiertosRuta.test.ts` (hoy 196 líneas), con un arnés que vuelve gobernado el ticket antes del `UPDATE` (molde: `apps/desk/server/db/migracionTicketsAbiertos.test.ts:168-177`): `409`, cuerpo exacto, y que otro error forzado (molde: `apps/desk/server/db/migracionTicketsAbiertos.test.ts:179-186`) sigue dando `500` «Error interno».
   - (b) De posición: con el interruptor apagado se ve su `403` (`apps/desk/server/routes/admin.ts:252`) y no el `409` nuevo; con una negativa se ve el `409` del informe y no el nuevo.
   - (c) En la integración con PostgreSQL real, dentro de `apps/desk/server/db/migracionConcurrente.integration.test.ts:162`, que el rechazo real es `instanceof MigracionAdelantadaError`.
6. **`DEPLOY.md` §14.** El párrafo «Qué ve quien lance una segunda ejecución…» (`DEPLOY.md:687-691`) se reescribe en sitio, en sus mismas cinco líneas: describe el `409`, cómo distinguirlo del de la negativa, y retira la pregunta abierta de `DEPLOY.md:691`, que ya está respondida.
7. **Delta de especificación.** RQ-ZS-23 MODIFIED (`openspec/specs/zoho-sync/spec.md:1368-1419`, último requisito de la spec: crecer no desplaza a nadie). La nota «Fuera de este requisito» (`openspec/specs/zoho-sync/spec.md:1391-1393`) pasa a ser requisito de la respuesta HTTP, con sus escenarios.

### Fuera

- Cualquier bloqueo explícito; cambiar qué se escribe, la transacción o el interruptor (`apps/desk/server/routes/admin.ts:250-255`).
- El manejador central para los demás errores, y el `409` de la negativa: quedan como están.
- Permiso nuevo: la ruta sigue pidiendo sólo administrador (`apps/desk/server/routes/admin.ts:222`).
- Nombrar al suplente y responder E-208: son de Gerencia.

## Capacidades

- **Nuevas:** ninguna.
- **Modificadas:** `zoho-sync` — RQ-ZS-23 gana la respuesta HTTP de la ejecución rechazada: `409` con `error` y `motivo: 'otra-ejecucion'`, distinguible del `409` de la negativa; cualquier otro fallo sigue respondiendo `500`. Lo demás del requisito no cambia. RQ-ZS-17 a RQ-ZS-19 no cambian.

## Enfoque

Express reconoce un manejador de error por su aridad de cuatro argumentos, también como eslabón de una ruta (el propio repositorio se apoya en esa aridad, `apps/desk/server/app.ts:76`). El error que `asyncHandler` entrega a `next` recorre los eslabones **posteriores** de la misma ruta antes de salir al manejador central: por eso el manejador va el último, y por eso moverlo delante lo deja sin efecto. Que la cadena de `app.post` lo acepte con los tipos de Express 5 (`package.json:33`, `package.json:49`) es **hipótesis** hasta pasar `npm run typecheck`; el comportamiento en ejecución lo fija la prueba de ruta.

## Reglas

- **Regla invariable 13:** la respuesta la impone el servidor y el cliente no participa. Buscar `migrar-tickets-abiertos` en `apps` sólo da `apps/desk/server/routes/admin.ts:222` y las líneas 10 y 15 de su prueba (`apps/desk/server/migracionTicketsAbiertosRuta.test.ts:10`): `apps/desk/src` no llama a la ruta.
- **`strict_tdd`, esta vez sin salvedad:** hay código de producto. La prueba de ruta nace roja con `500` «Error interno», y la aserción de `instanceof` nace roja porque la clase no existe. Ese rojo se anota en el `apply` antes de escribir el producto.
- **Regla de mutación 1:** el manejador es un eslabón de la cadena, así que se muta su **posición** —delante del manejador principal deja de cazar— y se prueba el orden frente al interruptor y frente a la negativa (5b).
- **Regla de mutación 4:** ningún fichero existente cambia de número de líneas salvo por el final: `migracionTicketsAbiertos.ts` (95), `routes/admin.ts` (255) y la prueba de ruta (196) crecen por abajo; `DEPLOY.md` conserva 693 y la integración 243. Barrido propio, por líneas con cita: 43 a `migracionTicketsAbiertos.ts` y 51 a `routes/admin.ts` (el orquestador contó 46 y 60 apariciones). Las dos citas que dejan de decir lo que afirmaban —`DEPLOY.md:687-691` y la nota de la spec— son las que este cambio reescribe.

**Mutaciones previstas** (el resultado es hipótesis hasta el `apply`): quitar el manejador de la cadena; ponerlo delante del principal; que cace cualquier error, sin `instanceof`; que no llame a `next` con los demás; devolver la línea 90 a `new Error`.

## Supuestos reversibles

| Nº | Supuesto | Por qué |
|---|---|---|
| S1 | El mensaje lleva el inciso «o el ticket N cambió en la aplicación» | La condición también se da si una transición gobierna ese ticket entre la lectura y la escritura: `writeTransition` pone `managed_by_app=true` (`packages/zoho-sync/src/db/repo.ts:298`). Decir sólo «otra ejecución» afirmaría algo que puede no ser cierto |
| S2 | Manejador de error en la ruta y no en `apps/desk/server/app.ts` | La decisión excluye tocar el manejador central; el error sólo puede nacer en esta ruta |
| S3 | `motivo: 'otra-ejecucion'` como discriminante | Legible por máquina y estable aunque cambie la redacción. Nombra el caso frecuente, no el del inciso de S1 |
| S4 | Se conserva el texto del error interno | Lo citan RQ-ZS-23 y dos pruebas; va al registro, no a la respuesta |
| S5 | El rechazo se anota en el registro con nivel de aviso, no de error | No es un fallo del servidor; al no llegar al manejador central, sin esa línea no quedaría rastro |
| S6 | El inciso dice «cambió», no «se movió», para no excluir el borrado del ticket | La aplicación borra tickets (`apps/desk/server/db/eliminarTicket.ts:4`); que un borrado entre lectura y escritura dé también 0 filas es **hipótesis**, deducida del `WHERE` (`apps/desk/server/db/migracionTicketsAbiertos.ts:87`) y sin prueba. La instrucción del mensaje —pasada en seco— vale igual |
| S7 | Si el arnés de ruta no admite el gancho sin añadir líneas, va un arnés propio al final | `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:21-27` está citado por el encargo y sus vecinas por informes archivados |

## Áreas afectadas

| Área | Impacto | Qué cambia |
|---|---|---|
| `apps/desk/server/db/migracionTicketsAbiertos.ts` | Modificado | Línea 90 en sitio; clase al final |
| `apps/desk/server/routes/admin.ts` | Modificado | Líneas 232 y 234 en sitio; manejador al final |
| `apps/desk/server/migracionTicketsAbiertosRuta.test.ts` | Modificado | Pruebas nuevas al final |
| `apps/desk/server/db/migracionConcurrente.integration.test.ts` | Modificado | Una aserción dentro de la línea 162 |
| `DEPLOY.md` | Modificado | Cinco líneas reescritas en sitio |
| `openspec/specs/zoho-sync/spec.md` | Modificado al archivar | RQ-ZS-23 |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| «Esta ejecución no escribió nada» no se puede probar en pg-mem, que no revierte de verdad (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:13-15`) | Cierta | Lo sostiene la integración con PostgreSQL real, que ya exige que la rechazada no deje marcador; la prueba de ruta fija estado y cuerpo, no la reversión |
| Los tipos o el lint rechazan el manejador en la cadena o la clase declarada tras su uso | Baja | Hipótesis hasta `npm run typecheck` y `npm run lint`; si falla, se dice en el `apply`, no se mueve nada en silencio |
| El manejador se traga otros errores de la ruta | Baja | Prueba de «otro error → `500`» y las mutaciones tercera y cuarta |
| Quien lea `409` lo confunda con el de la negativa | Media | `motivo` y la presencia de `error` los separan; `DEPLOY.md` lo explica |

## Vuelta atrás

Revertir el commit. No hay esquema ni dato: la ejecución rechazada vuelve a responder `500` y lo escrito en la base es idéntico antes y después. El párrafo de `DEPLOY.md` y RQ-ZS-23 vuelven con el mismo revert.

## Criterios de éxito

- [ ] La prueba de ruta se vio roja con `500` antes del producto y verde con `409` y el cuerpo exacto después.
- [ ] Otro error en la misma ruta sigue dando `500` «Error interno».
- [ ] Las pruebas de posición frente al interruptor y a la negativa pasan, y las cinco mutaciones tienen su resultado escrito, prueba a prueba.
- [ ] La integración exige `instanceof MigracionAdelantadaError` y pasa en el CI.
- [ ] Ninguna línea existente cambia de número; `DEPLOY.md` sigue en 693.

## Tareas de personas — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1).

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Nombrar al suplente | Gerencia | `DEPLOY.md:665` |
| Responder E-208: quién lanza la última sincronización completa | Gerencia | `docs/sdd/ENTRADA.md:2047` |
| Cotejo de la hoja de Google | Gerencia | `DEPLOY.md:693` |
| Ejecución del 12/12 en producción | Gerencia o su suplente | `DEPLOY.md:663-693` |
