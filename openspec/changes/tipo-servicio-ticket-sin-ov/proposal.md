---
tanda: F1B-03
motivo: ""
capacidad: [transitions-st, remisiones, permissions, tickets-core]
maestro: ["M1.2", "M1.9", "M4.4", "Anexo D nº 21", "Anexo D nº 43"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: tipo de servicio y ticket sin OV, guarda de remisión vigente y OVI de garantía (F1B-03, parte L)

Worktree `tipo-servicio-ticket-sin-ov`, partida `5f68822`. Todas las rutas y líneas se citan contra ese árbol y las ha verificado quien escribe; lo que no se pudo verificar lleva «hipótesis» delante. Exploración: `openspec/changes/tipo-servicio-ticket-sin-ov/exploration.md`.

**Revisada el 2026-10-03 (revisión de la planificación).** El supuesto S-1 —«vigente» exige remisión confirmada— queda **retirado**: contradecía la letra de Gerencia sin una decisión que lo respaldara. «Vigente» se construye a la letra: remisión de **entrada**, **creada** y **no anulada**, sea cual sea su estado de envío (§4.1). El resumen de lo que cambió está al final de `openspec/changes/tipo-servicio-ticket-sin-ov/design.md`.

## 0 · Por qué `cierra: no`, y por qué `toca_maestro: si`

**No cierra.** La fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:83` tiene dos partes: la L (tipo de servicio y ticket sin OV, guarda de remisión vigente, OVI de garantía) y la XS (supresión de los prefijos, E-094). Este cambio hace sólo la L. La XS va en un **segundo cambio con el mismo `tanda: F1B-03`** (R-4: un cambio, un solo `tanda:`; no es «contar en parte»), y espera la comprobación de Google Drive y n8n sobre los prefijos, cuyo dueño es Gerencia (`decision/cuarta-tanda-f1b03-parte-l`; `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:177`). Además, dentro de la propia parte L, el lote de la OVI queda condicionado a una respuesta de Gerencia (Q1, §6; E-157 de `docs/sdd/ENTRADA.md`): si no hay respuesta registrada al terminar el lote 2, el lote 3 **no entra en esta tanda**, este cambio se archiva sin él y lo dice en su `archive-report.md` (§10).

**Toca el maestro.** Al terminar, tres pasajes de la R08.4 quedan desactualizados: «La guarda está sin construir (F1B-03)» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`), «La de la OVI de garantía entra en uso con F1B-03» (`:1949`) y el Anexo H. Y uno ya lo está hoy: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3482` lista «crear la OVI de garantía, solo el Director Técnico» entre las «Excepciones construidas», cuando en el código la primitiva no tiene llamador (`packages/shared/src/cargos.ts:67-74`). Las correcciones se entregan como texto en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`; el `.docx` no se toca.

## 1 · Intención

Hoy «Habilitar Servicio» lleva un ticket a `Ingresado` sin comprobar que exista remisión de entrada: `executeTransition` no consulta remisiones (`apps/desk/server/services/ticketService.ts:114-223`; el fichero no importa `db/remisiones`). El maestro lo da por decidido y sin excepciones desde el 10/09, reafirmado el 24/09 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`). Este cambio construye esa guarda en el servidor, con su posición probada frente a la de F1B-15, y deja la OVI de garantía en un lote propio que sólo se construye cuando Gerencia diga qué es «crear la OVI» dentro de Desk.

Éxito: ningún ticket llega a `Ingresado` por la aplicación sin remisión de entrada vigente (creada y no anulada); el orden de guardas queda fijado por pruebas de posición; «vigente» tiene una sola definición, y una prueba **afirma** en qué se separa, a propósito, del recuento que mueve el estado `Remisión creada`.

## 2 · Decisiones de las que depende (respuesta textual; manda la respuesta, no las consecuencias)

| Clave | Dónde | Respuesta textual | Qué gobierna aquí · dónde la consecuencia va más allá |
|---|---|---|---|
| `decision/cuarta-tanda-f1b03-parte-l` | `openspec/config.yaml:3727-3747` | «sí, ejecútalo. la cuarta tanda es F1B-03 por su parte L; los prefijos van en un segundo cambio. Ejecútalo.» | Alcance y `cierra: no`. La consecuencia (4) —worktree propio, y detener el ciclo tras `tasks.md`, antes del apply— **no está en la respuesta**: es lectura del registro (el worktree lo manda la regla del ciclo 3). |
| `decision/ovi-garantia-autor` | `openspec/config.yaml:1543-1560` | «La OVI la crea Servicio Técnico, más concretamente el Director Técnico» | Dice **quién**. No dice **qué es crear una OVI dentro de Desk** (Q1). La consecuencia (3) es hipótesis del propio registro y está superada: el cargo existe (`packages/shared/src/cargos.ts:12-15`). |
| `decision/c10-permisos-cargo` | `openspec/config.yaml:1927-1946` | «…Restricciones ya decididas: Liberación sin factura → Director Comercial. Crear OVI de garantía → Director Técnico. Prioridad de los Top 5 → Director Comercial. …» y «La base sigue siendo el área, como hoy… El cargo sólo restringe» | El verbo es «crear». Restringir la **asociación** de una OVI a un ticket (opción A de Q1) es una interpretación, no la letra. |
| `decision/p44-escritura-zoho` | `openspec/config.yaml:1562-1582` | «Por ahora no queremos activar la escritura contra Zoho. En caso necesario nos tocará tener un "espejo de Zoho" en nuestra app que permita comparar y escribir nosotros a mano en Zoho hasta que estemos preparados para activar la escritura en Zoho (futuro).» | Desk no puede crear la OVI en Books. Es lo que hace necesaria Q1. |
| `decision/anexo-43-en-sitio` | `openspec/config.yaml:2408-2423` | «…cualquier visita a instalaciones del cliente se registra por la rama de soporte remoto (F1B-06), que no exige remisión… La regla de remisión obligatoria para habilitar un servicio técnico se mantiene sin excepciones. …» | Guarda sin condicional por servicio en sitio (cierra PF-2, `openspec/config.yaml:1292-1323`). La respuesta dice «un servicio técnico»: que alcance también a la clasificación «Equipo nuevo» es lectura (supuesto S-3). |
| `decision/p15-p59-rutas` | `openspec/config.yaml:2023-2039` | «Calibración directa: sí. Cuando la orden de venta ya cubre la calibración, el ticket salta diagnóstico, cotización y aprobación y pasa directamente al trabajo. Tres condiciones: (1) sólo con la orden de venta de calibración asignada; (2) si aparece una falla, sale a la ruta completa para cotizar; (3) pasa igualmente por el Control de calidad. Se construye preferentemente con el tipo de servicio de F1B-03, que ya oculta los pasos que no aplican; F1C-08 se queda con lo que F1B-03 no cubra.» | Dice «preferentemente». La consecuencia (1) —«lo que puede, lo hace F1B-03»— es más fuerte que la respuesta, y la premisa «que ya oculta los pasos» **es falsa para `tipo_servicio`** en el código (§3.1). Q2. |
| `decision/anexo-7-garantia-proveedor` | `openspec/config.yaml:2340-2355` | «…Al crear la OVI de garantía, el Director Técnico responde «¿Se reclama al fabricante?»… Entra en Fase 1 junto a la OVI de garantía (F1B-03), como tanda pequeña.» | Es F1B-13, otra fila. Aquí sólo obliga a no cerrarle el paso: depende de la respuesta a Q1. |
| `decision/titularidad-ov-equipo` | `openspec/config.yaml:1584-1603` | «Generalmente el titular del equipo es el que genera la orden de venta. Tenemos 1 solo caso donde el generador de la orden de venta no es el propietario del equipo es el mantenedor del equipo» | Contexto de IV-8. Sin trabajo aquí. |
| `p21-ingreso-sin-ov` (**no existe en `openspec/config.yaml`**) | `docs/sdd/Decisiones_Gerencia_2026-09-10.md:300-314` | «Se deja como está: OV opcional en «Nuevo ticket», obligatoria en `Habilitar Servicio`.» | Confirma lo construido (§3.1). |
| `habilitar-servicio-sin-remision` (**no existe en `openspec/config.yaml`**) | `docs/sdd/Decisiones_Gerencia_2026-09-10.md:353-377` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:386` | «Hoy sale de tres orígenes y uno —`Ticket creado`— lleva a `Ingresado` sin remisión de entrada. La guarda exigirá remisión de entrada vigente (no anulada) para los tres.» | La guarda. «Vigente» se define ahí como **no anulada** (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`), y en el maestro como «creada y no anulada» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`): **es la definición que se construye, a la letra** (§4.1). El estado de envío no aparece en ninguna de las dos frases y no entra en la guarda. Retirar el origen es consecuencia descrita, no mandato (Q3). |

Hallazgo de método: dos decisiones de las que depende esta tanda **no están en el fichero que la sesión carga** (`decisiones_de_gerencia`), sólo en el documento del 10/09 y en la R01.1. No se corrige aquí. La de `habilitar-servicio-sin-remision` queda en la bandeja como **E-159** de `docs/sdd/ENTRADA.md`; la de `p21-ingreso-sin-ov` se anota aquí y no tiene entrada propia.

## 3 · Los tres componentes de la fila, sin los prefijos

### 3.1 · Tipo de servicio y ticket sin OV — **ya construido; este cambio no escribe código aquí**

- El desplegable que «oculta los pasos innecesarios» es, según el maestro, el de **Clasificaciones** (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1178`, `:1207`), y ya enruta tres flujos: `flujoDelTicket` (`packages/shared/src/flujos.ts:56-61`) y el estado de nacimiento (`packages/shared/src/flujos.ts:138-140`). El campo es obligatorio en servidor (`apps/desk/server/services/ticketService.ts:83-88`) y en cliente (`apps/desk/src/components/CreateTicket.tsx:419`).
- `tipo_servicio` es la «segunda dimensión» (`:1208` del maestro): siete valores (`packages/shared/src/ticketCreate.ts:4`), obligatorio en el alta (misma guarda de obligatorios y `apps/desk/src/components/CreateTicket.tsx:415`), y **no influye en ningún flujo**. Que lo haga es exactamente Q2.
- Ticket sin OV: la orden sólo se resuelve si llega (`apps/desk/server/services/ticketService.ts:37-44`) y se exige en la transición por `cfOrdenVenta` obligatorio (`packages/shared/src/transitions.ts:86`, usado en `packages/shared/src/transitions.ts:189`). Probado en `apps/desk/server/tickets.test.ts:357` y `apps/desk/server/services/ticketService.test.ts:705`. El maestro lo marca `[CONSTRUIDO]` (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1210-1212`).

**Qué construye este cambio:** nada de código. El `archive-report.md` lo declarará como contenido de la fila ya cubierto por tandas anteriores.

### 3.2 · Guarda de remisión vigente — **sin construir; es el núcleo (lotes 1 y 2)**

- Hoy: ninguna guarda. Lo que existe alrededor: la guarda de alta validada de F1B-15 (`exigirAltaValidada`, `apps/desk/server/services/ticketService.ts:258-264`) y varias nociones de remisión «viva» (§4.1).
- Construye: un predicado puro en `packages/shared`, una consulta única en `apps/desk/server/db/remisiones.ts`, la guarda `exigirRemisionVigente` en `ticketService.ts`, sus pruebas de posición, el espejo de comodidad y el aviso no bloqueante de «remisión sin confirmar» en `apps/desk/src/components/TransitionPanel.tsx`, y los requisitos RQ-TS-33 y RQ-RE-20.

### 3.3 · OVI de garantía — **sin construir; lote 3, condicionado a Q1**

- Hoy: `puedeCrearOVIGarantia` existe sin llamador (`packages/shared/src/cargos.ts:67-74`; dato en `packages/shared/src/cargos.ts:33`), una prueba lo fija (`packages/shared/src/cargos.test.ts:117`) y RQ-PM-20 prohíbe construir el acto fuera de F1B-03 (`openspec/specs/permissions/spec.md:411-418`). El número `OVI-` se clasifica como orden ordinaria (`packages/shared/src/subOV.ts:10`, `packages/shared/src/subOV.ts:24`) y el buscador no la distingue (`packages/zoho-sync/src/books/repo.ts:145-177`). No hay en el código ningún acto de crear una OVI.
- Construye: depende de Q1. Con la opción A, la restricción por cargo en las tres puertas que asocian una orden a un ticket (alta `apps/desk/server/services/ticketService.ts:37-44`; transición, línea 148 del mismo fichero; remisión `apps/desk/server/routes/remision.ts:218-244`).

## 4 · La guarda de remisión en «Habilitar Servicio»

### 4.1 · Qué es «vigente» — varias implementaciones de nociones vecinas (molde H5)

| Implementación | Dónde | `anulada_at IS NULL` | `estado` | `tipo` |
|---|---|---|---|---|
| filtro `vigentes` del botón de remisión (cliente) | `apps/desk/src/lib/botonRemision.ts:33` | sí | cualquiera | `entrada` |
| «confirmada» del botón de remisión (cliente) | `apps/desk/src/lib/botonRemision.ts:39` | (sobre las de la línea 33) | `ok` u `ok_con_avisos` | (sobre las de la línea 33) |
| `remisionPendienteDe` | `apps/desk/server/db/remisiones.ts:67-73` | sí | sólo `pendiente` | no filtra |
| `listRemisionesByTicket` («Remisiones VIGENTES de un ticket») | `apps/desk/server/db/remisiones.ts:76-79` | sí | cualquiera | no filtra |
| recuento de `sincronizarEstadoPorRemision` | `apps/desk/server/db/estadoPorRemision.ts:43-47` | sí | `ok` u `ok_con_avisos` | no filtra |
| consulta del recuento de producción | `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` | sí | cualquiera | `entrada` |

**Definición (a la letra de Gerencia; no es un supuesto): una remisión de entrada vigente es una fila de `public.remisiones` del ticket con `tipo = 'entrada'` y `anulada_at IS NULL`.** «Creada» es que la fila exista; «no anulada», que `anulada_at` sea nulo. **El estado de envío (`pendiente`, `error`, `ok`, `ok_con_avisos`) NO entra en el predicado de bloqueo.** Fuentes, leídas: «La guarda exigirá remisión de entrada vigente (no anulada) para los tres» (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`, §7.3 en `docs/sdd/Decisiones_Gerencia_2026-09-10.md:353-377`) y «remisión de entrada vigente (creada y no anulada)» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`). Es, letra por letra, el filtro que el cliente ya llama `vigentes` (`apps/desk/src/lib/botonRemision.ts:33`) y el que usa la consulta del recuento de producción.

**S-1, retirado en la revisión de la planificación del 2026-10-03.** La primera versión de esta propuesta exigía además `estado` `ok` u `ok_con_avisos`. Se retira por dos razones: contradecía la letra **sin una decisión que lo respaldara**, y ataba «Habilitar Servicio» a que n8n responda (una remisión creada cuyo envío queda `pendiente` o en `error` habría dejado a Comercial sin poder habilitar). Por tanto **una remisión de entrada no anulada en estado `pendiente` o `error` HABILITA**. Lo que antes era bloqueo pasa a ser un **aviso no bloqueante** del cliente —«remisión sin confirmar»— cuando el ticket tiene remisión de entrada vigente y ninguna de las vigentes está confirmada (§5).

**CONSECUENCIA DECLARADA — no es un defecto: la guarda y el estado `Remisión creada` dicen cosas distintas, a propósito.** El estado `Remisión creada` se deriva **sólo de remisiones confirmadas**: RQ-TS-03 lo dispara con «al menos una remisión confirmada y vigente» (`openspec/specs/transitions-st/spec.md:98`, `openspec/specs/transitions-st/spec.md:101-103`) y el recuento cuenta `anulada_at IS NULL AND (estado = 'ok' OR estado = 'ok_con_avisos')` (`apps/desk/server/db/estadoPorRemision.ts:43-47`; su porqué, en el comentario de `apps/desk/server/db/estadoPorRemision.ts:23-25`). Con la definición a la letra, un ticket puede seguir en `Ticket creado` con una remisión de entrada `pendiente` y **aun así habilitarse desde ahí**, sin pasar por `Remisión creada`. Son dos preguntas distintas: el estado dice «existe el documento de la remisión»; la guarda dice «la remisión se creó y no se anuló». Este cambio no toca RQ-TS-03 ni el recuento.

**Una sola fuente de «vigente», y una prueba que AFIRMA la divergencia con el recuento.** El predicado puro vive en `packages/shared` y lo consumen el servidor (la guarda) y el cliente (el botón). `estadoPorRemision.ts` no se reescribe (fichero citado; su recuento mueve el estado del ticket). Una prueba recorre la tabla de casos y fija, fila a fila, el veredicto de las dos: coinciden en `ok`, `ok_con_avisos`, anulada, histórica y vigente tras anulada; **divergen a propósito en `estado`** —con una remisión de entrada `pendiente` o en `error` la guarda habilita y el recuento no pasa el ticket a `Remisión creada`— y **siguen divergiendo en `tipo`** —el recuento no lo filtra; hoy no se puede dar, porque `createRemision` escribe siempre `'entrada'` (`apps/desk/server/db/remisiones.ts:44-53`), y llegará con la remisión de salida (F1B-17)—. Si alguien alinea una con otra sin una decisión, la prueba se pone roja. Las históricas, que se importan con estado `ok` (`apps/desk/server/db/remisionesHistoricas.ts:140`), cuentan por las dos (S-5).

### 4.2 · Escalón, código y posición

- **Escalón B** (estado del sujeto: al ticket le falta un documento previo), igual que RQ-TS-32 (`openspec/specs/transitions-st/spec.md:1416`). No es C: no valida nada que el usuario haya enviado en el cuerpo. No es D: no hay conflicto de unicidad.
- **HTTP 422**, con `{ error }` y mensaje accionable, igual que su vecina `exigirAltaValidada`. Alternativa descartada: 409, como `exigirVerificacion`; se prefiere 422 para que las dos precondiciones de «Habilitar Servicio» contesten con la misma forma y el cliente las trate igual.
- **Posición exacta:** `exigirAltaValidada` está **definida en `apps/desk/server/services/ticketService.ts:258-264`** (su comentario ocupa 252-257; el «251» de un encargo anterior es una línea vacía) y **llamada en la línea 131**, la última sentencia de esa línea. La guarda nueva se llama **inmediatamente después, en la misma línea 131**, y antes de `valoresConFechasDerivadas` (línea 132). La función se define **al final del fichero**, tras la 264. Ninguna línea se desplaza.

Orden resultante en `executeTransition`, con la nueva en negrita:

| # | Guarda | Línea | HTTP | Escalón |
|---|---|---|---|---|
| 1-2 | transición desconocida · ticket no existe | 122-125 | 400 · 404 | A |
| 3 | fuera de flujo (`exigirMismoFlujo`) | 125 | 409 | B |
| 4 | estado fuera del `from` | 126-128 | 409 | B |
| 5 | área | 129-131 | 403 | B |
| 6 | cargo (`cargoQueFaltaParaTransicion`) | 131 | 403 | B |
| 7 | prioridad (`cambiaPrioridadSinPermiso`) | 131 | 403 | B |
| 8 | verificación (`exigirVerificacion`) | 131 | 409 | B |
| 9 | alta validada (`exigirAltaValidada`) | 131 | 422 | B |
| **10** | **remisión vigente (`exigirRemisionVigente`)** | **131** | **422** | **B** |
| 11 | obligatorios, fechas derivadas, cuarentena, certificado | 132-134 | 422 | C |
| 12-13 | persona derivada · contrato vencido | 138-147 | 422 | C |
| 14 | OV ya asociada a otro ticket | 148-152 | 409 | D |

**Justificación por el orden total.** B precede a C y a D, luego la guarda va antes de la 132. Dentro de B el orden total no dice nada; se elige ir **detrás** de los permisos (quien no puede ejecutar la transición no debe enterarse del estado del ticket: 403 antes que 422, mismo criterio que RQ-TS-32) y **detrás** de `exigirAltaValidada` por tres razones: no reordena ninguna guarda existente; RQ-TS-32 y sus pruebas quedan intactas; y el orden de los dos mensajes es el de quién puede resolverlos: enlazar el cliente lo hace el propio Comercial que pulsa, la remisión la hace Servicio Técnico.

Sólo `habilitar_servicio` la calcula; en las demás transiciones sale sin consultar nada. Se aplica a sus tres orígenes (`packages/shared/src/transitions.ts:178`).

### 4.3 · Pruebas de posición previstas (regla de mutación 1)

| Par | Escenario que activa las dos | Respuesta esperada | Movimiento que debe ponerla roja |
|---|---|---|---|
| P1 · área (5) / remisión | Ticket sin remisión; usuario de Servicio Técnico, sin área Comercial | 403 de permiso | Llamar a la guarda antes del `if` de área |
| P2 · alta validada (9) / remisión | Cliente provisional (o equipo pendiente) **y** sin remisión; Comercial | 422 con el mensaje de alta pendiente | Intercambiar las dos llamadas de la línea 131 |
| P3 · remisión / obligatorios (11) | Sin remisión; Comercial; `values` vacío | 422 con `error` de remisión y `errors` ausente | Mover la guarda detrás de la línea 134 |
| P4 · remisión / cuarentena (11) | Sin remisión; orden de venta en cuarentena | 422 de remisión, no el de cuarentena | Idem |
| P5 · remisión / OV ya asociada (14) | Sin remisión; orden ya asociada a otro ticket | 422 de remisión, no 409 | Mover la guarda detrás de la línea 152 |
| P6 · estado (4) / remisión | Ticket en `Ingresado` sin remisión | 409 «no aplica desde el estado» | Llamar a la guarda antes de la comprobación del `from` |
| P7 · flujo (3) / remisión | Ticket de soporte remoto sin remisión | 409 de flujo | Llamar a la guarda antes de `exigirMismoFlujo` |

Sin escenario posible, y se dice: **cargo** (6), porque `habilitar_servicio` no tiene excepción de cargo (`packages/shared/src/cargos.ts:32`); **verificación** (8), porque sólo la calcula `liberacion`; **prioridad** (7), hipótesis: la transición no lleva campo de prioridad (`packages/shared/src/transitions.ts:189`) y el diseño comprueba si aun así se puede activar.

Además: los tres orígenes sin remisión (422) y con ella (200); sin remisión, sólo anulada(s) o `tipo` distinto de entrada **no** habilitan; `pendiente` y `error` no anuladas **sí** habilitan (200), igual que una segunda vigente tras una anulada; y «sin consultas extra» (otra transición no lee `remisiones`), con el mismo espía que usa F1B-15. **Regla de mutación 2:** el predicado se prueba ensuciando los datos (filas de `remisiones`), no el predicado; y una mutación que **reintroduce** el filtro de estado debe poner roja la prueba de «`pendiente` habilita».

## 5 · Regla 13, decisión a decisión

| Decisión del cliente | Dónde | Línea del servidor que la impone |
|---|---|---|
| Ofrecer sólo las transiciones que el usuario puede ejecutar | `apps/desk/src/components/TransitionPanel.tsx:56-58` | Área y cargo en `executeTransition`, `apps/desk/server/services/ticketService.ts:129-131`. Espejo ya probado (IV-3 cerrado). Sin cambios. |
| Desactivar «Habilitar Servicio» con alta pendiente | líneas 70, 130 y 137 de ese `.tsx` | `exigirAltaValidada`, `apps/desk/server/services/ticketService.ts:258-264`. Sin cambios. |
| **Nuevo:** desactivar «Habilitar Servicio» y mostrar el motivo cuando no hay remisión de entrada vigente (creada y no anulada) | mismas líneas 70, 130 y 137, con el predicado de `shared` sobre la prop `remisiones` (`apps/desk/src/components/TransitionPanel.tsx:50`) | **`exigirRemisionVigente`**, nueva, llamada en la línea 131 de `ticketService.ts`. La imposición queda probada por §4.3: el espejo es comodidad legítima (punto 3 de la regla). |
| **Nuevo:** avisar, **sin bloquear**, de «remisión sin confirmar» cuando el ticket tiene remisión de entrada vigente y ninguna de las vigentes está confirmada | línea 137 de ese `.tsx`, con la lógica en `apps/desk/src/lib/` | **Ninguna, y se dice así: es PRESENTACIÓN.** El servidor habilita igual con la remisión `pendiente` o en `error`; el aviso no decide ni impide nada, sólo informa de que el documento puede no existir todavía. No es un espejo y no necesita imposición. |
| Qué remisiones mira el botón «Crear remisión» (`vigentes`: no anulada y de entrada) | `apps/desk/src/lib/botonRemision.ts:33` | Pasa a **consumir** el predicado compartido en el lote 2 (es la misma condición, letra por letra): punto 1 de la regla. Sin cambio de comportamiento. |
| No ofrecer «Crear remisión» con una ya confirmada | `apps/desk/src/lib/botonRemision.ts:39` | **Sin imposición, y ya era así** (el servidor sólo rechaza con una `pendiente`, `apps/desk/server/routes/remision.ts:174-183`): presentación mientras la pantalla refresca. Su noción de «confirmada» pasa a un segundo predicado compartido, el mismo que alimenta el aviso; **no** es «vigente» y no entra en ninguna guarda. La línea 34 (la `pendiente` que reetiqueta el botón) se queda como está. |
| OV opcional en «Nuevo ticket» | `apps/desk/src/components/CreateTicket.tsx:118-127` | `apps/desk/server/services/ticketService.ts:37-44`. Sin cambios. |
| Tipo de servicio y clasificación obligatorios | `apps/desk/src/components/CreateTicket.tsx:415`, `apps/desk/src/components/CreateTicket.tsx:419` | `apps/desk/server/services/ticketService.ts:83-88`. Sin cambios. |
| **Lote 3 (si Q1 = A):** no ofrecer u ocultar una `OVI-` a quien no puede asociarla | buscadores de orden de venta del alta, la transición y la remisión | Guarda nueva en las **tres** puertas. Sin ella en el servidor, el cliente sería la guarda. |

Sólo presentación, sin regla: el texto del motivo junto al botón, el atributo `title` y el aviso de «remisión sin confirmar». El cliente **no** recalcula «vigente»: consume el predicado de `packages/shared` (punto 1). Advertencia: la prop `remisiones` trae las no anuladas de cualquier estado y de cualquier tipo; el predicado filtra, y si la carga falla el botón queda activo, no hay aviso y decide el servidor.

Los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00): el espejo no lleva prueba automática ni rojo previo, y **no se propone** jsdom ni testing-library. Su comprobación es de persona (§8).

## 6 · Preguntas que sólo Gerencia puede contestar

Estado tras la revisión de la planificación del 2026-10-03: **Q1** abierta, bloquea el lote 3 (E-157) · **Q2** y **Q3** supuestos aplicados, revisados y mantenidos · **Q4** resuelta por la letra · **Q5** supuesto mantenido y **condición de publicación** (E-158). Los identificadores E-157, E-158 y E-159 son entradas de `docs/sdd/ENTRADA.md`.

### Bloquean un lote

**Q1 · ¿Qué es «crear la OVI de garantía» dentro de Desk?** — abierta, **E-157** (junto con las cinco preguntas de OVI de `design.md` §10).
- *Qué decide:* el contenido entero del lote 3. *A quién corresponde:* Gerencia, con el Director Técnico. *Qué desbloquea:* el lote 3 y, detrás, F1B-13 (la ficha de reclamación cuelga de ese acto).
- *Qué pasa si no hay respuesta registrada al terminar el lote 2:* el lote 3 **no entra en esta tanda** y los deltas borrador de `permissions` y `tickets-core` salen del cambio antes de archivar (§10).
- *Por qué hace falta:* las decisiones dicen quién la crea; Desk no escribe en Zoho (`decision/p44-escritura-zoho`) y hoy las OVI se crean en Books.
- **(A) Restricción al asociar.** Las OVI se siguen creando en Books; en Desk sólo el Director Técnico o un administrador puede asociar una orden `OVI-` a un ticket, en las tres puertas. Barato (lote 3 tal como está estimado) y coherente con p44. ⚠️ Dos consecuencias que hay que aceptar a sabiendas: `puedeCrearOVIGarantia` exige el **área Servicio Técnico** y «Habilitar Servicio» es de **área Comercial**, así que un Director Técnico sin área Comercial sólo podría asociarla en el alta o en la remisión de entrada, y Comercial no podría teclear una OVI en la transición; y mientras nadie tenga `cargo_permiso` asignado, sólo un administrador pasa (RQ-PM-22).
- **(B) Registro propio en Desk.** Un acto «crear OVI» con su tabla y su pregunta «¿se reclama al fabricante?». Cumple la letra de «crear», pero es alcance nuevo con migración: no cabe en este cambio; pediría cambio propio y talla.
- **(C) Escribir en Books.** Contradice `decision/p44-escritura-zoho`. No se propone.
- *Subpregunta ligada:* ¿un ticket con tipo de servicio «Garantía» debe llevar obligatoriamente una OVI, y una OVI sólo puede ir en tickets de garantía? Hoy no hay relación entre ambos datos.

**Q2 · ¿La calibración directa entra en esta parte L?** — supuesto aplicado (no entra), **revisado y mantenido** en la revisión de la planificación del 2026-10-03. No es una confirmación de Gerencia.
- *Qué decide:* si este cambio toca el grafo. *A quién corresponde:* Gerencia. *Qué desbloquea:* nada de los lotes 1 a 3; decide si hay un lote más o si queda para F1C-08.
- **(No, recomendado)** Queda en F1C-08, después del corte, y se anota en las dos filas del plan. La parte L no toca `transitions.ts`.
- **(Sí)** Hace falta una transición de escape («si aparece una falla, sale a la ruta completa»), que mueve las cifras ancladas 31 y 35 (`openspec/config.yaml:1360-1366`), regenera el mapa y obliga a que `tipo_servicio` enrute por primera vez. Es talla M–L por sí sola: cambio aparte, no un lote de éste.

### No bloquean la construcción

**Q3 · ¿Se retira el origen `Ticket creado` de «Habilitar Servicio»?** Supuesto aplicado (S-4): **no**; se conservan los tres orígenes y sólo se añade la guarda. **Revisado y mantenido** en la revisión de la planificación del 2026-10-03; no es una confirmación de Gerencia. *Si Gerencia dice sí:* se rompe a propósito el invariante 3 (`packages/shared/src/invariantesGrafo.test.ts:56-66` y `packages/shared/src/invariantesGrafo.test.ts:177-181`), los pasos del mapa pasan de 35 a 34, se regenera el mapa, se modifica RQ-TS-02 (`openspec/specs/transitions-st/spec.md:71-88`) y cambia el maestro: cambio aparte. **Nota corregida:** la primera versión decía que, con S-1, ese origen quedaba en la práctica sin uso. Con la definición a la letra **sí tiene uso**: un ticket de la aplicación cuya remisión de entrada está creada y aún sin confirmar (`pendiente`) o cuyo envío falló (`error`) sigue en `Ticket creado` —el servidor sólo lo pasa a `Remisión creada` con una confirmada, `apps/desk/server/db/estadoPorRemision.ts:43-47`— y se habilita desde ahí. Retirar el origen dejaría sin salida justo ese caso. Corresponde a Gerencia; desbloquea cerrar la predicción de `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:306`.

**Q4 · ¿«Vigente» exige que la remisión esté confirmada, o basta creada y no anulada?** **RESUELTA POR LA LETRA: basta creada y no anulada.** No es una respuesta nueva de Gerencia: es la aplicación de §7.3 (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`) y del maestro (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`), que ya lo decían. El supuesto S-1 se retira (§4.1). No queda pregunta abierta.

**Q5 · ¿La guarda alcanza a los tickets de «Equipo nuevo»?** Supuesto aplicado y mantenido (S-3): **sí**, «sin excepciones»: esos tickets nacen en `Ticket creado` y pasan por la misma transición. La respuesta textual habla de «un servicio técnico». **Pasa a ser CONDICIÓN DE PUBLICACIÓN:** pregunta abierta **E-158** en `docs/sdd/ENTRADA.md`, con dueño Gerencia. No bloquea construir ni fusionar a `main`; bloquea publicar, porque si un equipo nuevo no lleva remisión de entrada en la práctica, esos tickets quedarían bloqueados.

## 7 · Supuestos razonables y reversibles (regla de ejecución)

S-1 **RETIRADO** (revisión de la planificación, 2026-10-03): «vigente» ya no es un supuesto, es la letra —entrada, creada y no anulada, con cualquier estado de envío (§4.1)— · S-2 422, escalón B, tras `exigirAltaValidada` · S-3 tres orígenes y todas las clasificaciones que pasan por la transición (Q5; condición de publicación, E-158) · S-4 se conservan los tres `from` (Q3) · S-5 las remisiones históricas cuentan (son de entrada y no anuladas; que se importen con `ok` ya no es lo que las hace contar) · S-6 el cliente desactiva el botón con el predicado compartido, y el aviso de «sin confirmar» es presentación no bloqueante · S-7 `estadoPorRemision.ts` no se reescribe: una prueba afirma en qué coincide con la guarda y en qué diverge a propósito (`estado` y `tipo`) · S-8 la tabla de RQ-TS-06 no se amplía (no lista hoy cargo, prioridad, verificación ni alta validada, `openspec/specs/transitions-st/spec.md:202-260`); la posición se fija en RQ-TS-33, como hizo RQ-TS-32. Que la tabla esté incompleta se anota como hallazgo, sin corregir.

## 8 · De personas — NO son tareas de esta tanda; archivar no las da por hechas

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Ejecutar el recuento de tickets que llegaron a `Ingresado` sin remisión, contra producción. El maestro lo pide «antes de aplicarla» | Gerencia (la consulta nombra a quien la ejecuta) | **Condición de despliegue del lote 1**, no de construcción. Si Gerencia lee «aplicar» como «construir», bloquea el lote 1: se pregunta al entregar esta propuesta | `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`; resultado, al panel y a `docs/sdd/ENTRADA.md`. Hipótesis: no hay resultado registrado (no se encontró en `docs/sdd` ni en `openspec/config.yaml`). Con la definición a la letra, esa consulta mide **lo mismo** que la guarda (tipo `entrada` y `anulada_at IS NULL`, sin filtro de estado, `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:58-65`): su cifra ya no es una cota inferior |
| Contar los tickets hoy en `Ticket creado`, `OV asignada` o `Remisión creada` sin remisión de entrada vigente (creada y no anulada): quedarán bloqueados al publicar. La consulta del 25/09 no lo mide: cuenta el histórico de llegadas, no los que hoy esperan | Gerencia | Condición de publicación | La consulta la escribe el lote 2; el resultado, al paquete de despliegue de la fecha |
| Responder **Q5** (¿alcanza a «Equipo nuevo»?) | Gerencia | **Condición de publicación** | `docs/sdd/ENTRADA.md` → E-158; la respuesta, a `openspec/config.yaml` → `decisiones_de_gerencia` |
| Responder **Q1** y las cinco preguntas de OVI de `design.md` §10 | Gerencia, con el Director Técnico | Bloquea el lote 3; sin respuesta registrada al terminar el lote 2, el lote 3 no entra en esta tanda | `docs/sdd/ENTRADA.md` → E-157; la respuesta, a `openspec/config.yaml` |
| Registrar la decisión `habilitar-servicio-sin-remision` en `openspec/config.yaml` | Sesión de supervisión | Bandeja | `docs/sdd/ENTRADA.md` → E-159 |
| Asignar `cargo_permiso` «Director Técnico» en producción | Gerencia / administrador | Condición de despliegue del lote 3, si llega a construirse | `DEPLOY.md` y paquete de despliegue |
| Comprobar en la aplicación el botón desactivado con su motivo, y el aviso no bloqueante de «remisión sin confirmar» | Gerencia | Verificación en la app tras el lote 2 | `archive-report.md` |
| Comprobación de Drive y n8n sobre los prefijos | Gerencia | Segundo cambio de F1B-03 | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:177` |

Q2 y Q3 no están en esta tabla como pendientes de respuesta: son supuestos aplicados, revisados y mantenidos (§6). Q4 no está porque quedó resuelta por la letra.

## 9 · Lotes y estimación

Medida real de cada intento: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear. Techo 800, válvula 720. Regla: pruebas ≥ 1,8 × código; cuando la enumeración de pruebas da más, se toma la enumeración.

**Coste de las pruebas existentes (medido por búsqueda literal).** `habilitar_servicio` aparece 70 veces en 17 ficheros de prueba: 58 en 11 de `apps` y 12 en 6 de `packages`. **No todas se rompen:** las de `packages` no pasan por `executeTransition`; `transitionExec.test.ts` (6) prueba el plan puro; `misTickets.test.ts` y `prioridadTop5.test.ts` insertan filas a mano. Ejecutan la transición por el servidor, y necesitan remisión, unas 30 llamadas en 6 ficheros: `transiciones.test.ts` (12), `ticketService.test.ts` (unas 12, tres de ellas ayudantes), `ordenVentaUnTicket.test.ts` (2), `ovAsociaciones.test.ts` (1), `flujoEquipoNuevo.test.ts` (1) y el barrido de `transicionesEjecucion.test.ts` (un punto, tres ejecuciones). Hipótesis a medir en el apply: las suites que recorren el catálogo sin nombrar la transición (`permisos.test.ts`). **Ayudante compartido propuesto:** `conRemisionVigente(db, ticketId)`, un fichero de apoyo de pruebas de unas 15 líneas que inserta una remisión de entrada no anulada, en estado `ok` (el porqué del estado, en `design.md` §5); coste de una línea por prueba o por ayudante. Estimación: 15 + 30 + 7 de imports, con margen, **80**. **Las cifras de esta tabla son las de la propuesta; las medidas y vigentes son las de `design.md` §11** (lote 1 ≈ 376, lote 2 ≈ 241 tras la revisión de la planificación del 2026-10-03).

| Lote | Contenido | Código | Pruebas (×1,8) | Pruebas por enumeración | Otros | **Total** | vs 720 |
|---|---|---|---|---|---|---|---|
| **1 · Guarda en servidor** | predicado en `shared` (15), consulta en `db/remisiones.ts` (12), `exigirRemisionVigente` al final de `ticketService.ts` (12), línea 131 (2) | 41 | 74 | 180: predicado 25, consulta y enfrentamiento H5 45, tres orígenes y P1-P7 110 | fixtures existentes 80 · `tasks.md` 10 | **≈ 311** | cabe; margen 409 |
| **2 · Espejo cliente, aviso y cierre de la guarda** | `TransitionPanel.tsx` en sus líneas (10), sin pruebas de interfaz; aviso no bloqueante de «remisión sin confirmar»; `botonRemision.ts` consume los predicados compartidos; consulta de sólo lectura; casilla de la regla 13; barrido de citas | 10 | — | — | informe del barrido y correcciones 50 | **≈ 60 en la propuesta; ≈ 241 medido en `design.md` §11** | cabe |
| **3 · OVI (condicionado a Q1 = A; no entra en esta tanda sin respuesta registrada al terminar el lote 2)** | predicado `OVI-` y motivo en `shared` (20), guarda en alta, transición y remisión (35) | 55 | 99 | 200: tres puertas × cuatro sujetos, posición por puerta, inversión de la prueba «sin llamador» | `tasks.md` 10 | **≈ 265** | cabe; margen 455 |
| Verify | `verify-report.md` (precedentes: 358) | — | — | — | 300-360 | **≈ 360** | cabe, en intento propio |
| Archive | mudanza de la carpeta (no computa para el techo, regla del archivo) + fusión del delta + `archive-report.md` (110-264) | — | — | — | parte revisable: hipótesis 350-600 | **se mide antes de aplicar** | si supera 800 se para y se consulta |

Ningún lote se acerca a 720; no hace falta partir. Si las pruebas existentes afectadas resultan ser el doble de lo estimado, el lote 1 sube a ≈ 390. Los lotes 1 y 2 **no dependen de Q1**; el 3 sólo se abre con la respuesta registrada, y si no la hay al terminar el lote 2 no entra en esta tanda. Un intento por lote, en este worktree, uno a la vez (reglas del ciclo 2 y 3).

## 10 · Capacidades (contrato con `sdd-spec`)

**Nuevas:** ninguna (R-2 no aplica).

**Modificadas** — siguiente ID libre comprobado en cada spec:

| Spec | Requisito | Lote |
|---|---|---|
| `transitions-st` | **RQ-TS-33** (nuevo): «Habilitar Servicio» exige remisión de entrada vigente; escalón, código, posición y escenarios de §4.3. RQ-TS-02 **no** se modifica con S-4; RQ-TS-32 intacto | 1 |
| `remisiones` | **RQ-RE-20** (nuevo): definición única de «remisión de entrada vigente» (a la letra) y la prueba que afirma su divergencia declarada, en `estado` y en `tipo`, con el recuento de RQ-RE-11 | 1 |
| `permissions` | RQ-PM-20 **modificado** (`puedeCrearOVIGarantia` gana llamador) y **RQ-PM-24** (nuevo): asociar una OVI exige el cargo | 3 |
| `tickets-core` | **RQ-TC-35** (nuevo): la restricción de la OVI en la puerta del alta | 3 |

**Lote 3: sigue BLOQUEADO.** Si al terminar el lote 2 no hay una respuesta de Gerencia a Q1 **registrada** (E-157), o la respuesta no es (A), el lote 3 **no entra en esta tanda**: los deltas borrador `openspec/changes/tipo-servicio-ticket-sin-ov/specs/permissions/spec.md` y `openspec/changes/tipo-servicio-ticket-sin-ov/specs/tickets-core/spec.md` **salen del cambio antes de archivar** (no se fusionan en las specs vivas y no viajan al archivo como si fueran contrato), la cabecera de esta propuesta pasa a `capacidad: [transitions-st, remisiones]`, y el `archive-report.md` dice que la OVI de garantía no se construyó y queda para un cambio propio cuando haya respuesta.

## 11 · Áreas afectadas

| Área | Impacto | Descripción |
|---|---|---|
| `packages/shared/src/` (fichero nuevo o `remisiones`) | Nuevo | Predicado de remisión vigente y su mensaje |
| `apps/desk/server/db/remisiones.ts` | Modificado | Función nueva al final |
| `apps/desk/server/services/ticketService.ts` | Modificado | Llamada en la línea 131; función al final |
| `apps/desk/src/components/TransitionPanel.tsx` | Modificado | Espejo, en líneas existentes |
| Seis suites de `apps/desk/server` | Modificado | Fixture de remisión con el ayudante |
| `packages/shared/src/cargos.ts`, `cargos.test.ts`, `apps/desk/server/routes/remision.ts` | Modificado (lote 3) | Llamadores de la primitiva; comentario y prueba «sin llamador» |
| `docs/sdd/F0-01_Correcciones_para_el_maestro.md` | Modificado | Texto para los pasajes de §0 |

Sin migración ni tabla nueva en los lotes 1 a 3.

## 12 · Riesgos y desvíos vivos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Tickets en curso bloqueados al publicar (sin remisión de entrada, o con todas anuladas). Una `pendiente` o en `error` **ya no bloquea** | Media | Recuentos de §8 antes de publicar; mensaje que dice qué falta |
| Se habilita un ticket cuya remisión no llegó a producir documento (`pendiente` o `error`) | Media | Consecuencia declarada de la letra (§4.1), no defecto; el aviso no bloqueante del cliente lo hace visible |
| Alguien «arregla» la diferencia entre la guarda y el estado `Remisión creada` alineando una con otra | Media | La prueba de divergencia de RQ-RE-20 se pone roja |
| Equipo nuevo bloqueado si en la práctica no lleva remisión | Media | Q5 (E-158), condición de publicación |
| Suites rojas por la guarda más allá de las contadas | Media | Ayudante compartido; se mide al empezar el lote 1 |
| El orden de la línea 131 se altera en un cambio posterior | Baja | P1 a P7 |
| El recuento empieza a contar remisiones de salida cuando lleguen (F1B-17) | Media | La divergencia de `tipo` está afirmada en la misma prueba |
| El lote 3 se construye sobre una lectura de «crear» que Gerencia no hizo | Alta sin Q1 | El lote no se abre sin respuesta |

- **IV-12:** `apps/desk/server/routes/remision.ts` **no se reordena**. Si el lote 3 añade la guarda de la OVI en esa puerta, entra en el mismo `if` de la línea 220, sin mover las guardas de las líneas 127, 155, 177 y 197; queda por tanto detrás del 409 de remisión pendiente, que es el mismo molde ya registrado. Se anota en la ficha de IV-12; no se corrige.
- **IV-8:** el maestro pide que las OVI pasen a crearse a nombre del cliente real; mientras sigan a nombre de Ambientalia, una futura guarda de titularidad las rechazaría. Este cambio no toca la guarda equipo↔cliente.
- **IV-11:** el lote 3 no añade vías de escritura de la orden; sólo antepone un permiso a las tres existentes.
- **RQ-PM-22:** se mantiene estricto: sin cargos asignados, sólo el administrador asocia una OVI.

## 13 · Barrido de citas al cierre (regla de mutación 4)

Convención: **funciones nuevas al final del fichero, llamada en línea ya existente.** Con ella no se desplaza ninguna línea de `ticketService.ts`, `db/remisiones.ts` ni `cargos.ts`. Aun así se barre, porque una cita puede seguir existiendo y dejar de decir lo que afirma:

- `apps/desk/server/services/ticketService.ts`: toda cita a la línea 131 (cambia su contenido) y al final del fichero; pase aparte por las abreviadas en `CLAUDE.md`, `openspec/specs/transitions-st/spec.md` y `openspec/specs/tickets-core/spec.md`.
- `packages/shared/src/cargos.ts` y `cargos.test.ts` (lote 3): el comentario «HOY NO LA LLAMA NADIE» y el título de la prueba cambian **en sitio**, sin añadir líneas; RQ-PM-20 los cita.
- `apps/desk/server/routes/remision.ts` (lote 3): edición dentro de la línea 220; comprobar las citas de IV-11 e IV-12 en `CLAUDE.md` y `openspec/config.yaml`.
- `openspec/specs/transitions-st/spec.md` y las otras tres specs: la fusión del delta **inserta líneas**; se barren las citas a esos ficheros con número de línea (entre ellas las de `CLAUDE.md`), separando casos A, B y C.
- `apps/desk/server/db/estadoPorRemision.ts` no se toca.

Cada resultado se lee contra el fichero, principio y final del rango por separado; se informa de las abreviadas, que el detector no bloquea.

## 14 · Rollback

Lotes independientes y sin migración: revertir el commit de fusión del lote devuelve el comportamiento anterior. Para retirar sólo la guarda en caliente basta quitar su llamada de la línea 131; los datos no cambian. El lote 3 se revierte igual; ningún dato de Books ni de `ov_asociaciones` se altera.

## 15 · Criterios de aceptación

- [ ] `habilitar_servicio` responde 422 sin remisión de entrada vigente desde `OV asignada`, `Ticket creado` y `Remisión creada`, y 200 con ella; el ticket no cambia de estado en el rechazo.
- [ ] Sin remisión, con sólo remisiones anuladas o con una de `tipo` distinto de entrada, no habilita. Una remisión de entrada no anulada habilita **en cualquier estado de envío**: `pendiente`, `error`, `ok`, `ok_con_avisos` e histórica.
- [ ] El `422` de la guarda tiene **un solo** texto, y reintroducir el filtro de estado en el predicado pone roja la prueba de «`pendiente` habilita» (mutación ejecutada y anotada).
- [ ] P1 a P7 en verde, y cada una se pone roja con el movimiento que declara (mutación ejecutada y anotada).
- [ ] La prueba que enfrenta la guarda con el recuento de `estadoPorRemision.ts` existe y **afirma** sus dos divergencias declaradas, `estado` y `tipo`: un ticket en `Ticket creado` con una remisión de entrada `pendiente` se habilita y el recuento no lo pasa a `Remisión creada`.
- [ ] Ninguna otra transición consulta `remisiones`.
- [ ] El cliente consume los predicados de `packages/shared`; ninguna copia de la regla en `apps/desk/src`.
- [ ] El aviso de «remisión sin confirmar» aparece cuando hay remisión de entrada vigente y ninguna confirmada, y **no** desactiva el botón.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde; ninguna prueba existente se borra para pasar.
- [ ] Barrido de citas hecho y anotado; cada intento medido por debajo de 800.
- [ ] Lote 3, sólo si Q1 = A: las tres puertas rechazan una `OVI-` de quien no es Director Técnico ni administrador, con prueba de posición por puerta; `puedeCrearOVIGarantia` tiene llamador y RQ-PM-20 lo dice.
- [ ] El `archive-report.md` dice en una línea qué parte de la fila cubre y qué deja fuera (prefijos; y la OVI, si no se construyó).

## 16 · Fuera de alcance

Supresión de los prefijos (segundo cambio de F1B-03) · calibración directa y cualquier cambio en `transitions.ts`, las cifras ancladas o el mapa (Q2, Q3) · retirar el origen `Ticket creado` · ficha de reclamación al fabricante (F1B-13) · exclusión de las OVI en los indicadores · crear OVI en Books o registro propio de OVI (opciones B y C) · guarda de titularidad (IV-8, F1B-11) · reordenar el alta de remisión (IV-12) · reparar el histórico de tickets que llegaron a `Ingresado` sin remisión · remisión de salida (F1B-17) · pruebas de interfaz.
