---
tanda: F1B-04
motivo: ""
capacidad: [remisiones]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: la aplicación resuelve «Aplica: Sí/No» y lo manda a n8n como un dato ya decidido

## Intención

`decision/aplica-si-no-remision-12-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`) define por primera vez qué significa «Sí» en el encabezado «OBSERVACIONES O NOVEDADES // Aplica: Sí/No» del formato F-ST-010: «Aplica Si significa que hay accesorios o una novedad real; Sin novedad no cuenta». `decision/aplica-opcion-a-esta-semana-12-10`, que la precisa, manda construirlo ahora como siguiente cambio de F1B-04: la aplicación manda el dato, la línea de n8n la cambia Alfonso a mano con el texto exacto que deje la tanda, y ese texto tiene que ser compatible hacia atrás.

**`cierra: no`.** La fila F1B-04 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84`, estado «en curso»; su resto en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:211`) sigue con dos cosas abiertas que este cambio no toca: E-167, el momento del rotulado, que figura **ABIERTA** en `docs/sdd/ENTRADA.md:1827-1830`, y el recuento de modelos sin accesorios, de persona y contra producción. **Qué falta exactamente para cerrarla:** que Gerencia decida E-167 (y, si la casilla se mueve, construirlo) y que Servicio Técnico haga ese recuento.

**Maestro.** `maestro: []`: las dos decisiones registran `maestro_pasaje: "ninguno"`. `toca_maestro: no`: el maestro vigente no describe ese encabezado ni nombra el formato F-ST-010 (búsqueda de «F-ST-010» y de «Aplica: » en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`: cero resultados), así que ninguna frase suya queda falsa. La definición queda escrita en la decisión y, tras este cambio, en la especificación de `remisiones`. Si Gerencia quiere además recogerla en el maestro, es una adición y lo decide Gerencia.

## Problema — medido sobre `b9d5e71`

- **A n8n no le llega ningún dato de «hay novedad».** `buildRemisionPayload` (`apps/desk/server/remisionWebhook.ts:31-65`) arma el cuerpo campo a campo desde la remisión **guardada**; de la recepción sólo viajan `observaciones` e `incluye` (`apps/desk/server/remisionWebhook.ts:45-46`). Se llama en un único punto, `apps/desk/server/routes/remision.ts:308`, que sirve al envío y al reenvío, con la remisión leída de la base en `apps/desk/server/routes/remision.ts:275`.
- **El flujo decide «Aplica» sólo por «Incluye».** Cita de segunda mano, dato del analista, **hipótesis** para esta propuesta: el nodo «Verifica Incluye Entrada» del flujo `Remisiones_ST_3.13_Desk` devuelve «Sí» si la lista «Incluye» trae algún valor no vacío y «No» si no. Consecuencia: una remisión con novedad real y sin accesorios sale con «Aplica: No» y su texto de observaciones debajo.
- **`hayNovedad` no cuenta las casillas.** Se deriva en el alta como `marcadas.some((n) => !n.excluyeDemas)` (`packages/shared/src/recepcion.ts:109`): ya decidido por la marca del catálogo, pero sin «Llegó sin accesorios» ni «Llegó sin embalaje», que se validan aparte (`packages/shared/src/recepcion.ts:102`).
- **Todo lo que la regla necesita ya está en el tipo que recibe `buildRemisionPayload`.** `Remision` trae `incluye` (`packages/shared/src/types.ts:722`) y, en una misma línea, `hayNovedad`, `novedades`, `sinAccesoriosAt` y `sinEmbalajeAt` (`packages/shared/src/types.ts:735`); el lector de la base los rellena (`apps/desk/server/db/remisiones.ts:18`, `apps/desk/server/db/remisiones.ts:25`). No hay hueco de datos: no hace falta leer el catálogo al enviar, ni columna nueva.
- **Legado, confirmado.** El formulario nuevo se reconoce por `novedades` distinto de `NULL` (`packages/shared/src/recepcion.ts:137`, `packages/shared/src/recepcion.ts:154`). Una remisión de legado puede traer `hayNovedad` `true`, `false` o `null` según lo que mandara el cuerpo (`apps/desk/server/routes/remision.ts:250`), nunca casillas, y su dato no pasó por el catálogo.
- **Cuatro textos vigentes dicen que el payload no gana campos**, y este cambio los contradice a propósito: RQ-RE-38 (`openspec/specs/remisiones/spec.md:1906-1907` en `b9d5e71`, y su escenario en `openspec/specs/remisiones/spec.md:1940-1943` en `b9d5e71`), RQ-RE-36 (`openspec/specs/remisiones/spec.md:1825` en `b9d5e71`), RQ-RE-32 (`openspec/specs/remisiones/spec.md:1522-1523` en `b9d5e71`) y el escenario de RQ-RE-17 (`openspec/specs/remisiones/spec.md:541-545` en `b9d5e71`).
- **Tres pruebas fijan las diez claves exactas del payload:** `apps/desk/server/recepcion.test.ts:424`, `apps/desk/server/recepcion.test.ts:727` (PW-1, que empieza en `apps/desk/server/recepcion.test.ts:721`) y `apps/desk/server/accesoriosRemision.test.ts:191`. Las tres envían una remisión del formulario nuevo: pasarán a once claves. La guardia de `apps/desk/server/fotoNovedad.test.ts:137-156` sigue verde sin tocarla: envía una remisión de legado (`apps/desk/server/fotoNovedad.test.ts:148`) y sólo niega la clave `hayNovedad`.

## Alcance

### Dentro

1. **Regla compartida en `packages/shared`.** Una función pura que, desde lo guardado, devuelve `true`, `false` o «no calculable». Es `true` si «Incluye» trae algún accesorio (algún elemento no vacío tras recortar), **o** `hayNovedad` es `true`, **o** está marcada «Llegó sin accesorios» o «Llegó sin embalaje» (`sinAccesoriosAt`, `sinEmbalajeAt`). Decide por la **marca** `excluyeDemas`, ya aplicada al guardar `hayNovedad`; nunca compara claves ni etiquetas. Con pruebas, incluida «Sin novedad» sola sobre un modelo sin lista, que da `false`.
2. **Un campo booleano nuevo en el payload, `aplica`, ya resuelto.** El servidor lo calcula con esa función al armar el cuerpo. En legado (`novedades` `NULL`) **la clave se omite**: ni `null` ni `false`.
3. **Las tres pruebas de las diez claves se cambian a propósito** a once, diciéndolo en la propia prueba, y nace una que fija la omisión en legado.
4. **Entregable para Alfonso:** `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md`, para quien no programa: flujo y nodo, código actual completo, código nuevo completo para copiar y pegar, cómo comprobarlo con una remisión de prueba y cómo volver atrás. Sin credenciales ni direcciones. El código nuevo usa `aplica` sólo si llega y es booleano; si no, aplica la regla de hoy.
5. **Delta de especificación** de `remisiones`.

### Fuera

- **Editar n8n:** ninguna sesión lo hace (`decision/aplica-opcion-a-esta-semana-12-10`, punto 5).
- **La columna `hay_novedad`, su significado y todo lo guardado:** no cambian. Sin migración, sin relleno.
- **El cliente React:** no se toca. No hay decisión nueva en `apps/desk/src`; el técnico no ve ni marca nada distinto.
- **Reordenar las guardas del alta** (desvío IV-12): el cambio no añade guarda ni toca el alta. **E-167 y el recuento de modelos sin accesorios.**

## Capacidades

- **Nuevas:** ninguna (R-2 no aplica).
- **Modificadas:** `remisiones`. Un requisito **nuevo al final, RQ-RE-39** (el último es RQ-RE-38): qué significa «Aplica», quién lo calcula, el campo `aplica` del payload y su omisión en legado. **Modificado seguro:** RQ-RE-38, cuya frase «**MUST NOT** ganar ningún campo» pasa a admitir exactamente `aplica`; las casillas siguen sin viajar como claves propias. **A decidir por `sdd-spec`:** RQ-RE-36, RQ-RE-32 y el escenario de RQ-RE-17 hablan de «las mismas claves que antes del cambio» de su propia tanda; hay que retocarlos o remitirlos a RQ-RE-39 para que no afirmen hoy algo falso. RQ-RE-13 no cambia: sólo fija las claves de cada foto.

## Enfoque y reglas

- **`strict_tdd`.** Las pruebas de la regla y las del payload nacen rojas antes del producto.
- **Regla invariable 13.** La regla vive en `packages/shared` y la aplica el servidor; n8n **consume** el dato resuelto y no lo recalcula. La rama de respaldo del código de n8n no es una segunda implementación de la regla nueva: es la regla de hoy, conservada porque la decisión exige compatibilidad hacia atrás.
- **Regla de mutación 3, por escrito.** Decisiones que toma el cliente en `apps/desk/src` por este cambio: **ninguna nueva**. No hay fila que casar con el servidor. **Las reglas de mutación 1 y 2 no aplican** (no hay guarda nueva ni fichero de datos vigilado). Mutaciones previstas sobre la regla (resultado: hipótesis hasta el `apply`): quitar las casillas de la suma; quitar `hayNovedad`; quitar «Incluye»; mandar `aplica: false` en legado en vez de omitir la clave; contar como accesorio un elemento en blanco.
- **Regla de mutación 4.** `apps/desk/server/remisionWebhook.ts` y `packages/shared/src/recepcion.ts` son ficheros citados (la especificación cita la línea 46 del primero, `openspec/specs/remisiones/spec.md:1522` en `b9d5e71`). Se edita **en sitio**, dentro de líneas que ya existen, o al final del fichero; si algo crece por el medio, se dice y se barre al cierre. El comentario de contrato de `apps/desk/server/remisionWebhook.ts:27-29` se actualiza sin añadir líneas.
- **Presupuesto orientativo** (estimación ×1,8 incluida): planificación ≤ 450 líneas · `apply` ≤ 350, un solo lote · `verify` ≤ 200 · `archive`, parte revisable ≤ 300. Se mide antes de cerrar cada intento.

## Supuestos reversibles

Regla de las preguntas a Gerencia (E-237): Gerencia tiene **una semana, hasta el 2026-10-19**, para corregirlos; lo no corregido queda aceptado con esa fecha.

| Nº | Supuesto | Por qué |
|---|---|---|
| S1 | El campo se llama `aplica` y es booleano | Nombra lo que el documento imprime; n8n sólo lo traduce a «Sí» o «No» |
| S2 | Se manda el resultado ya resuelto, y no un «hay novedad» suelto para que n8n lo sume con «Incluye» | Regla invariable 13 y la sección final «2026-10-12 (d)» de `docs/sdd/TRASPASO_2026-10-08.md`: «n8n no decide nada». La decisión del mismo día (c) hablaba de «un dato explícito de hay novedad»; (d) la precisa |
| S3 | Las dos casillas cuentan como novedad real para «Aplica» | Lo pide el aviso «Ojo para la tanda» de la sección «2026-10-12 (c)» del traspaso. **No es texto literal de Gerencia**, que sólo dice «accesorios o una novedad real» |
| S4 | En legado la clave se omite y n8n aplica la regla de hoy | El dato de legado no pasó por el catálogo; así esas remisiones salen exactamente como salen hoy |
| S5 | El reenvío recalcula con lo guardado en la remisión, no con el catálogo de hoy | Es lo que hace el resto del cuerpo; cambiar después la marca de una novedad no reescribe una remisión ya creada |
| S6 | El código de n8n es compatible hacia atrás: sin `aplica`, o con un valor que no sea booleano, vale la regla de hoy | Lo exige la decisión; permite publicar cualquiera de los dos lados primero |
| S7 | Un elemento de «Incluye» vacío o sólo de espacios no cuenta como accesorio | Es lo que hace hoy el nodo, según el analista (hipótesis) |

**Hipótesis sobre n8n, todas de segunda mano.** Que el nodo «Remision-Entrada-Salida» reexpone el cuerpo entero del webhook y por tanto deja legible `aplica` sin tocar más nodos; que «Validar payload» no rechaza campos de más; y que el borrador leído por el analista coincide con lo publicado. El entregable las convierte en un paso de comprobación antes de pegar.

## Áreas afectadas

**Modificados:** `packages/shared/src/recepcion.ts` (o `packages/shared/src/remision.ts`: lo decide el diseño), `packages/shared/src/recepcion.test.ts`, `apps/desk/server/remisionWebhook.ts`, `apps/desk/server/remisionWebhook.test.ts`, `apps/desk/server/recepcion.test.ts`, `apps/desk/server/accesoriosRemision.test.ts`. **Nuevo:** `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md`. **Al archivar:** `openspec/specs/remisiones/spec.md`. **No se tocan:** `apps/desk/src`, `packages/zoho-sync/src/db/schema.sql`, `apps/desk/server/routes/remision.ts`.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Se publica un lado sin el otro | Media | Ninguno de los dos órdenes rompe nada: la aplicación sola manda un campo que nadie lee; el flujo solo no recibe el campo y usa la regla de hoy. Aun así, la decisión manda publicarlos a la vez |
| «Validar payload» rechaza el campo de más, o «Remision-Entrada-Salida» no lo reexpone con ese nombre | Baja | Hipótesis declarada; el entregable trae la comprobación con una remisión de prueba y la vuelta atrás. Si falla, se para y se consulta |
| La plantilla de Google Docs no se pudo leer, y el flujo no conserva ejecuciones: que el documento pinte «Aplica» como el correo es hipótesis, sin remisión real contra la que contrastar | Media | Verificación de persona tras publicar, sobre el documento de una remisión de prueba |
| Una remisión sin la propiedad `novedades` se toma por formulario nuevo: el dato de prueba de `apps/desk/server/remisionWebhook.test.ts:6-10` construye una `Remision` por conversión de tipo y no la trae | Media | La regla trata la ausencia igual que `NULL`, como ya hace `packages/shared/src/recepcion.ts:137`; prueba propia |

## Vuelta atrás

Revertir el commit: el payload vuelve a sus diez claves y, como el código de n8n es compatible hacia atrás, el flujo sigue funcionando con la regla de hoy sin tocarlo. Para deshacer sólo el lado de n8n, Alfonso pega el código anterior, que el entregable conserva completo. No hay datos que restaurar.

## Criterios de éxito

- [ ] «Sin novedad» sola, sin accesorios y sin casillas, da `aplica: false`; una novedad real sin accesorios da `true`; accesorios con «Sin novedad» da `true`; cada casilla sola, con «Sin novedad» y sin accesorios, da `true`.
- [ ] La regla no nombra ninguna clave ni etiqueta del catálogo, y cada mutación prevista tiene su resultado escrito.
- [ ] El payload de una remisión del formulario nuevo tiene once claves: las diez de siempre y `aplica`, booleano.
- [ ] El payload de una remisión de legado no tiene la clave `aplica`, ni la clave `hayNovedad`.
- [ ] El reenvío de una remisión ya creada manda el mismo `aplica` que su primer envío.
- [ ] Ninguna sentencia SQL nueva, ningún cambio en `apps/desk/src`.
- [ ] El entregable trae el código actual, el nuevo y la vuelta atrás completos, sin credenciales ni direcciones, y el código nuevo da el resultado de hoy cuando `aplica` no llega.

## Tareas de personas — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1).

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Cambiar a mano el nodo «Verifica Incluye Entrada» del flujo `Remisiones_ST_3.13_Desk`, confirmando antes las tres hipótesis sobre n8n; publicar la aplicación y el flujo a la vez, y comprobar con una remisión de prueba el correo y el documento generado | Alfonso | `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md` |
| Corregir, si procede, los supuestos S1 a S7 antes del 2026-10-19; en especial S3 | Gerencia | Lista semanal de supuestos (E-237) |
| Decidir E-167, el momento del rotulado, y recontar los modelos sin accesorios en producción | Gerencia, con quien administra n8n · Servicio Técnico | `docs/sdd/ENTRADA.md` → E-167 · sección final «2026-10-12 (d)» de `docs/sdd/TRASPASO_2026-10-08.md` |
| Versionar lo suyo: entrada de bandeja, parte y, si Gerencia la quiere en el maestro, la definición de «Aplica» | Sesión de supervisión | `docs/sdd/ENTRADA.md` y el expediente del maestro |
