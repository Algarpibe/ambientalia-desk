# Exploración: tipo-servicio-ticket-sin-ov (F1B-03 parte L, `tanda: F1B-03`, `cierra: no`)

Volcado del informe del agente explorador (no tenía herramienta de escritura). Las citas se han
verificado al volcar contra el worktree `tipo-servicio-ticket-sin-ov`, partida `5f68822`, y se han
escrito con ruta completa desde la raíz. Lo corregido está en «Correcciones al volcar», al final.

## 1. Qué dice el plan de F1B-03

- Fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:83`: «Tipo de servicio y ticket sin OV, guarda de remisión vigente, OVI de garantía · + supresión de prefijos (E-094)», L + XS, «antes del 14/12», decisión `decision/ovi-garantia-autor`.
- Ampliación de prefijos: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:177` (XS, fuera de este cambio; gate de persona: comprobar Drive y n8n, `:272`, `:302`). Talla 5,0 en `:210`.
- R01.4 §H, fila 4, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:309`: riesgo = prueba de posición contra la guarda de F1B-15 (regla de mutación 1). En `:306`, F1B-03 «relaja el invariante 3» (predicción del plan, no mandato). En `:355`, F1B-13 (ficha de garantía con proveedor) va «junto a» F1B-03 pero es OTRA fila.
- Origen de los tres componentes, en la R01.1: fila entera en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:158`; gates en `:385`, `:386`, `:397`; fila del anexo en `:500`. (a) «desplegable inicial de tipo de servicio (`Clasificaciones`) que oculta pasos»; (b) OV opcional al crear y obligatoria en Habilitar Servicio (`decision/p21-ingreso-sin-ov`, «confirma lo construido»); (c) guarda «Habilitar Servicio exige remisión de entrada vigente en los tres orígenes» (`decision/habilitar-servicio-sin-remision`, §7.3 de `docs/sdd/Decisiones_Gerencia_2026-09-10.md:353-377`) y OVI de garantía a nombre del cliente real (§7.4, `docs/sdd/Decisiones_Gerencia_2026-09-10.md:379-401`). La fila de la R01.1 ya preveía partirla en dos cambios «si no cabe en tres días».
- Las claves `p21-ingreso-sin-ov` y `habilitar-servicio-sin-remision` NO existen como `clave:` en `openspec/config.yaml`; viven en la tabla §4.5 de la R01.1 y en `docs/sdd/Decisiones_Gerencia_2026-09-10.md:300-415`.

## 2. Decisiones de las que depende (literal)

- `decision/cuarta-tanda-f1b03-parte-l` (`openspec/config.yaml:3727-3747`): «sí, ejecútalo. la cuarta tanda es F1B-03 por su parte L; los prefijos van en un segundo cambio. Ejecútalo.» Consecuencia (4): worktree propio, modo producción, el ciclo se detiene tras `tasks.md`, antes del apply.
- `decision/ovi-garantia-autor` (`openspec/config.yaml:1543-1560`): «La OVI la crea Servicio Técnico, más concretamente el Director Técnico». Gobierna la parte OVI. Consecuencia (3), hipótesis del propio registro: si F1B-03 va antes que F1C-05 tendrá que nombrar un cargo sin la matriz. Hoy el cargo ya existe: `packages/shared/src/cargos.ts:12-15`; `puedeCrearOVIGarantia` en `packages/shared/src/cargos.ts:71-74`, supuesto S-9 «área Servicio Técnico».
- `decision/anexo-43-en-sitio` (`openspec/config.yaml:2408-2423`): «…La regla de remisión obligatoria para habilitar un servicio técnico se mantiene sin excepciones. …» (resto: en sitio = 2027 T2, campo Modalidad en F1B-06, ya construido). Gobierna la guarda de remisión: sin condicional por servicio en sitio. Cierra PF-2 (`openspec/config.yaml:1292-1323`, `afecta_a` con F1B-03).
- `decision/p15-p59-rutas` (`openspec/config.yaml:2023-2039`, `tanda_que_abre: "F1C-08 · S48 · y F1B-03"`), sobre calibración directa: «Calibración directa: sí. Cuando la orden de venta ya cubre la calibración, el ticket salta diagnóstico, cotización y aprobación y pasa directamente al trabajo. Tres condiciones: (1) sólo con la orden de venta de calibración asignada; (2) si aparece una falla, sale a la ruta completa para cotizar; (3) pasa igualmente por el Control de calidad. Se construye preferentemente con el tipo de servicio de F1B-03, que ya oculta los pasos que no aplican; F1C-08 se queda con lo que F1B-03 no cubra.» Consecuencia (4): la salida «si aparece una falla» es una transición nueva en `transitions.ts`; la (1) anota «hay que anotarlo en las dos filas» y NO está anotado en la fila de F1B-03 ni en la de F1C-08 de la R01.4. Es el mayor riesgo de alcance: la afirmación «el tipo de servicio ya oculta pasos» es FALSA hoy para `tipo_servicio` (ver §4; sólo `classification` enruta).
- `decision/anexo-7-garantia-proveedor` (`openspec/config.yaml:2340-2355`): ficha de reclamación al fabricante, «tanda pequeña» propia (F1B-13), depende de la OVI de F1B-03; la pregunta «¿Se reclama al fabricante?» se hace al crear la OVI. Fuera de este cambio (hipótesis: sólo exige no cerrar el hueco).
- `decision/p44-escritura-zoho` (`openspec/config.yaml:1562-1582`): «Por ahora no queremos activar la escritura contra Zoho…». Condiciona la OVI: Desk no puede crear una OVI en Books.
- `decision/escalado-remision-creada` (`openspec/config.yaml:1421-1431`) y `decision/titularidad-ov-equipo` (`openspec/config.yaml:1584-1603`, IV-8): contexto, sin trabajo propio aquí. `decision/c10-permisos-cargo` (`openspec/config.yaml:1927-1946`): «Crear OVI de garantía → Director Técnico». `decision/equipo-nuevo-alta-en-ticket` (`openspec/config.yaml:2778-2793`).
- No hay `decision/*` sobre «invariante 3» fuera de §7.3 (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:358-367`).

## 3. Maestro R08.4

Todas las líneas de este apartado son de `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`.

- M1.2 «Ramificación por tipo de servicio»: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1177-1209`; Clasificaciones es el disparador (`:1207`) y Tipo de Servicio es una segunda dimensión (`:1208`, valores Calibración · Diagnóstico · Garantía · Mantenimiento · No aplica · Otro).
- Precondición comercial: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1210-1212` (OV obligatoria para trabajar, no para recibir; `[CONSTRUIDO]`).
- Guarda de remisión: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`: «exige siempre remisión de entrada vigente (creada y no anulada), en sus tres orígenes… No hay excepciones… La guarda está sin construir (F1B-03). Antes de aplicarla hay que contar cuántos tickets llegaron a Ingresado sin remisión… Si al construir la guarda se retira el origen Ticket creado… el recuento de pasos del mapa (M1.3.7) se mide de nuevo.» (condicional).
- OVI: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1231-1232`; permisos por cargo en `:921`, `:1941`, `:1949` («entra en uso con F1B-03») y `:3482`; ficha de reclamación en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2660-2668`; prefijos hasta `:1176`; fila del plan en `:3845`.
- §3.2 en revisión: no usado como alcance.

## 4. Código de hoy

**Tipo de servicio / clasificación (construido).** `packages/shared/src/ticketCreate.ts:4` (`TIPOS_SERVICIO`, 7 valores) y `packages/shared/src/ticketCreate.ts:5` (`CLASIFICACIONES`, 3). Columnas `classification` (`packages/zoho-sync/src/db/schema.sql:23`), `tipo_servicio` (`packages/zoho-sync/src/db/schema.sql:28`) y `modalidad` (`packages/zoho-sync/src/db/schema.sql:576`). Obligatorios del alta: cliente, tipo de servicio, clasificaciones, prefijo (`apps/desk/server/services/ticketService.ts:80-88`). La rama la decide sólo `classification` (`packages/shared/src/flujos.ts:56-61` y `packages/shared/src/flujos.ts:138-140`; RQ-TC-10, `openspec/specs/tickets-core/spec.md:554`); `tipo_servicio` NO influye en ningún flujo. Cliente: `apps/desk/src/components/CreateTicket.tsx:415` y `apps/desk/src/components/CreateTicket.tsx:419` (tipo de servicio y clasificación `required`); `apps/desk/src/components/CreateTicket.tsx:423` (prefijo: parte XS).

**Ticket sin OV (construido).** La OV es opcional en servidor (`apps/desk/server/services/ticketService.ts:37-44`, sólo si viene `salesOrderId`) y en cliente (`apps/desk/src/components/CreateTicket.tsx:118-127`, sin `required`). Pruebas: `apps/desk/server/tickets.test.ts:357`, `apps/desk/server/services/ticketService.test.ts:705`. La OV se exige en la transición por `cfOrdenVenta` con `required = true` (`packages/shared/src/transitions.ts:86`, uso en `packages/shared/src/transitions.ts:189`). Alarma de `Remisión creada` sin OV: RQ-TS-19.

**«Invariante 3».** `packages/shared/src/invariantesGrafo.test.ts:56-66` («Finalizado es el único estado sin transición de salida», sobre `TRANSITIONS`); réplica sobre la unión en `packages/shared/src/invariantesGrafo.test.ts:177-181`. Sólo se rompería si se retira `Ticket creado` del `from` de `habilitar_servicio` (`packages/shared/src/transitions.ts:178`, con los tres orígenes).

**«Habilitar Servicio» y guardas vecinas en orden de ejecución.** Todas en `executeTransition` (`apps/desk/server/services/ticketService.ts:114-223` en `a77ec68`):

| # | Guarda | Línea | HTTP | Escalón |
|---|---|---|---|---|
| 1 | transición desconocida | 122-123 | 400 | A |
| 2 | ticket no existe | 124-125 | 404 | A |
| 3 | fuera de flujo (`exigirMismoFlujo`, definida en 231-234) | 125 | 409 | B |
| 4 | estado no está en `from` | 126-128 | 409 | B |
| 5 | área | 129-131 | 403 | B |
| 6 | cargo (`cargoQueFaltaParaTransicion`) | 131 | 403 | B |
| 7 | prioridad | 131 | 403 | B |
| 8 | verificación (`exigirVerificacion`, definida en 248-250) | 131 | 409 | B |
| 9 | **`exigirAltaValidada`** (definida en 258-264, llamada en 131; predicado `motivoAltaPendiente`) | 131 | 422 | B (RQ-TS-32) |
| 10 | obligatorios, fechas derivadas, cuarentena, certificado | 132-134 | 422 | C |
| 11 | persona derivada | 138-142 | 422 | C |
| 12 | contrato vencido | 147 | 422 | C |
| 13 | OV ya asociada | 148-152 | 409 | D |

El predicado de la guarda 9 es `motivoAltaPendiente`, `packages/shared/src/altaManual.ts:74-79`. Las guardas 6 a 9 comparten la línea 131 y la 10 lanza en la 134 (código denso: citar por función, no sólo por línea). Alta (`createManagedTicket`, `apps/desk/server/services/ticketService.ts:21-111`): equipo `:24-27` (A), OV existe `:37-39` (A), equipo↔cliente `:61-79` (C), obligatorios `:83-88` (C), contenido y modalidad `:91` (C), cuarentena y vencido `:96` (C), NIT y OV `:96-100` (D).

**Remisiones.** Tabla `public.remisiones` (`packages/zoho-sync/src/db/schema.sql:271-287`; `anulada_at` en `packages/zoho-sync/src/db/schema.sql:316`; `tipo` por defecto 'entrada'; `estado` pendiente, ok, ok_con_avisos o error; `origen` app o historico; las históricas se importan con estado 'ok', `apps/desk/server/db/remisionesHistoricas.ts:140`). Hoy NO hay guarda de remisión en la transición (confirmado: `ticketService.ts` no importa `db/remisiones`). Definiciones existentes: `remisionPendienteDe` (`apps/desk/server/db/remisiones.ts:67-73`, pendiente y no anulada), `listRemisionesByTicket` (`apps/desk/server/db/remisiones.ts:76-79`, no anuladas, cualquier estado) y el recuento en línea de `apps/desk/server/db/estadoPorRemision.ts:43-48` (`anulada_at` NULL y estado ok u ok_con_avisos, SIN filtrar `tipo`; es lo que define el estado `Remisión creada`, RQ-TS-03, `openspec/specs/transitions-st/spec.md:101-103`). NO existe función exportada reutilizable «remisión vigente». Recuento de producción: `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` existe (usa tipo 'entrada' y `anulada_at` NULL, SIN filtro de estado); no se encontró resultado registrado (hipótesis: pendiente, tarea de persona). Un ticket de Zoho en `OV asignada` nunca pasa a `Remisión creada` (RQ-TS-02) pero la guarda lo cubre mirando la existencia.

**OVI / garantía.** No hay acto de crear OVI en el código. Existe: `puedeCrearOVIGarantia` (`packages/shared/src/cargos.ts:67-74`, «HOY NO LA LLAMA NADIE»), `EXCEPCIONES_POR_CARGO.crearOVIGarantia` (`packages/shared/src/cargos.ts:33`), RQ-PM-20 (`openspec/specs/permissions/spec.md:411-418`: «MUST NOT construir el acto… es de F1B-03»), prueba que fija «sin llamador» (`packages/shared/src/cargos.test.ts:117`; habrá que invertirla), `OVI-` reconocida como OV ordinaria (`packages/shared/src/subOV.ts:10` y `packages/shared/src/subOV.ts:24`; `openspec/specs/tickets-core/spec.md:486`). Las OVI de Books llegan al buscador como cualquier OV (`packages/zoho-sync/src/books/repo.ts:145-177`, sin discriminar `OVI-`). Cómo se comprueba un cargo en servidor: `executeTransition` recibe `user.cargoPermiso` (`apps/desk/server/services/ticketService.ts:118`, `apps/desk/server/routes/tickets.ts:193`); RQ-PM-22 (S-1): sin cargos asignados sólo el admin pasa.

**Cliente (regla 13, casilla de decisiones).** `apps/desk/src/components/TransitionPanel.tsx:56-58` filtra transiciones por `puedeEjecutarTransicion` (espejo probado, IV-3 cerrado); las líneas 70, 130 y 137 de ese fichero desactivan «Habilitar Servicio» con `motivoAltaPendiente` (espejo de `exigirAltaValidada`, `apps/desk/server/services/ticketService.ts:258-264`, que es la imposición). Ya recibe `remisiones` (`apps/desk/src/components/TransitionPanel.tsx:50`, vigentes no anuladas, con `estado`): el espejo de la guarda nueva puede consumir un predicado de `shared`. `CreateTicket.tsx`: la OV no bloquea el alta (el servidor, `apps/desk/server/services/ticketService.ts:37`, es la imposición). Decisión nueva a nombrar con su línea de servidor: «Habilitar Servicio» exige remisión (servidor: guarda nueva); «OVI sólo Director Técnico» (servidor: guarda nueva en las tres puertas).

**Tres puertas de asociar una OV** (si la OVI se restringe, hay que cubrirlas todas, lección IV-4): alta `apps/desk/server/services/ticketService.ts:37-44`; transición `apps/desk/server/services/ticketService.ts:148` (`plan.columns.orden_venta` u `ovAdicional`); remisión `apps/desk/server/routes/remision.ts:218-244` (fichero de IV-12, no debe moverse el orden).

**Tests que se romperán al aterrizar la guarda** (ejecutan `habilitar_servicio` sin remisión): 58 menciones en 11 ficheros de `apps` (`ticketService.test.ts` 25, `transiciones.test.ts` 12, `transitionExec.test.ts` 6, `flujoEquipoNuevo.test.ts` 3, `ordenVentaUnTicket.test.ts` 3, `transicionesEjecucion.test.ts` 3, `remisiones.test.ts` 2, otros 4) y 12 en 6 ficheros de `packages` (algunas sólo de grafo). Es el coste dominante de la guarda.

## 5. Specs vivas afectadas y siguiente ID libre

- `transitions-st`: RQ-TS-02 (SHALL salir de tres fases, `openspec/specs/transitions-st/spec.md:71-88`) y RQ-TS-06 (tabla de guardas, `openspec/specs/transitions-st/spec.md:202-260`) son las vecinas declaradas; RQ-TS-32 (`openspec/specs/transitions-st/spec.md:1416`) es la vecina directa. Siguiente: **RQ-TS-33**.
- `tickets-core`: RQ-TC-05 (`openspec/specs/tickets-core/spec.md:126`) sólo si la OVI restringe en el alta. Siguiente: **RQ-TC-35**.
- `remisiones`: nuevo predicado «vigente», o si se toca `remision.ts`. Siguiente: **RQ-RE-20** (el último es RQ-RE-19; RQ-RE-14 está al final del fichero).
- `permissions`: RQ-PM-20 se modifica (ya no «sin llamador»). Siguiente: **RQ-PM-24**.
- Si no se retira el origen: `mapa-blueprint`, `cifras_ancladas` y RQ-TS-26/27 no se tocan.

## 6. Ficheros muy citados

Cifras del explorador («líneas con cita», no citas; la mayoría de las archivadas llevan revisión: caso B). No se han remedido al volcar: son de segunda mano y valen como hipótesis de orden de magnitud.

- `ticketService.ts`: 766 líneas en 192 ficheros (vivas relevantes: spec de transitions-st 23, spec de tickets-core 22, derivacion-avisos 12, `CLAUDE.md` 7). Convención: funciones nuevas AL FINAL del fichero (como `exigirMismoFlujo`, `exigirAltaValidada`) y llamada en línea ya existente, para no desplazar nada.
- `transitions.ts`: al menos 78 en `openspec/specs`, 25 en `packages`, 7 en `apps`, 322 en `openspec/changes`, 11 en `openspec/config.yaml` (sin sumar `docs/`): sólo se toca si se retira el origen.
- `cargos.ts`: 44 líneas en 13 ficheros; `estadoPorRemision.ts`: 40 en 16; `remision.ts`, `flujos.ts` y `ticketCreate.ts`: 69 en `openspec/specs`. Barrido de la regla de mutación 4 obligatorio al cierre sobre `ticketService.ts`, `estadoPorRemision.ts` y `cargos.ts`.

## 7. Preguntas

**Sólo Gerencia (bloquean la propuesta):**

- **Q1 · ¿Qué es «crear la OVI de garantía» en Desk?** Desk no escribe en Zoho (p44) y las OVI se crean en Books. Opciones: (A) restricción: sólo Director Técnico o admin puede asociar a un ticket una orden `OVI-` (llama a `puedeCrearOVIGarantia`; las OVI siguen creándose en Books); (B) registro propio en Desk (nuevo, con migración y alcance mayor); (C) escribir en Books (contradice p44). Sin respuesta, (A) es una interpretación del explorador, no dicha.
- **Q2 · ¿La calibración directa (p15-p59) entra en esta parte L?** Lectura del explorador: NO (no está en la fila de F1B-03 de la R01.4; el texto dice «preferentemente» y F1C-08 es posterior al corte; exigiría transición nueva en `transitions.ts` y mover las cifras 31 y 35). Necesita confirmación y anotarla en las dos filas.

**Persona (no cuentan como tarea, regla del ciclo 1):** ejecutar el recuento de producción (la consulta del 25/09) antes de desplegar; comprobación de Drive y n8n (sólo prefijos, otro cambio); asignar `cargo_permiso` Director Técnico (RQ-PM-22).

**Supuestos razonables y reversibles (aplicar y anotar en la propuesta):** (S-1) «vigente» = `tipo='entrada'`, `anulada_at IS NULL` y `estado IN ('ok','ok_con_avisos')`, igual que el recuento de `estadoPorRemision.ts` (una `pendiente` o `error` no cuenta: no hay documento); (S-2) guarda 422, escalón B, tras `exigirAltaValidada` (misma transición; mensaje accionable primero para Comercial); (S-3) se aplica a los tres orígenes y a cualquier clasificación que pase por esa transición (también equipo nuevo, que nace en `Ticket creado`); (S-4) conservar los tres `from` (guarda sola, ver abajo); (S-5) las remisiones históricas `ok` cuentan; (S-6) el cliente sólo desactiva el botón con el predicado de `shared`.

**Riesgos:** producción (la guarda no repara el histórico; los tickets hoy en `Ticket creado` u `OV asignada` sin remisión quedan bloqueados hasta crear una; si n8n cae, una `pendiente` no habilita); IV-12 (no mover las guardas del alta de remisión; la OVI en esa puerta lo toca); IV-8 (una OVI a nombre de Ambientalia chocaría con la futura guarda de titularidad); IV-11 (OV y asociación en tres vías; no ampliar); 58 + 12 menciones en pruebas, con rojos al entrar la guarda; mantener RQ-PM-22 (hasta asignar cargos sólo el admin crea OVI).

## 8. Enfoques

| Enfoque | Pros | Contras | Esfuerzo |
|---|---|---|---|
| A. Sólo guarda de remisión, conservar los tres `from` (recomendado) | No toca grafo, mapa ni cifras; reversible; cumple la letra de §7.3 («los tres») | El `from` Ticket creado queda casi muerto; no «relaja» el invariante 3 como predice la R01.4 | M |
| B. Guarda + retirar `Ticket creado` del `from` | Sigue la consecuencia que §7.3 describe; borra una arista muerta | Rompe el invariante 3 (las dos pruebas de `invariantesGrafo.test.ts`), mueve `pasos_del_mapa` de 35 a 34 (`openspec/config.yaml:1360-1366`), regenera el mapa, toca `transitions.ts` y el maestro R08.4 | L |
| C. A + OVI restringida por cargo en las tres puertas (recomendado tras Q1) | Da llamador a `puedeCrearOVIGarantia`; coherente con p44 y c10 | Toca `remision.ts` (IV-12) y tres suites | M |
| D. OVI como registro propio | Cumple «crear» | Migración, alcance nuevo, sin decisión | L |

**Recomendación:** A + C, con Q1 resuelta; Q2 fuera. El reparto del conteo se mide, no se supone.

## 9. División en lotes (≤ ~400 líneas; pruebas ×1,8; techo 800, válvula 720)

1. **Lote 1 · guarda de remisión (~380):** predicado puro en `shared` (`motivoSinRemision`), función única `remisionesConfirmadasVigentes` en `db/remisiones.ts` reutilizada por `estadoPorRemision.ts`, `exigirRemisionVigente` al final de `ticketService.ts` más la llamada en la línea 131; actualizar los ~70 tests que habilitan; pruebas de posición (con alta pendiente a la vez, con área, con obligatorios ausentes: regla 1) y prueba que enfrenta las dos implementaciones de «vigente» (H5); RQ-TS-33 y modificación de RQ-TS-02/06.
2. **Lote 2 · espejo cliente + specs (~250):** `TransitionPanel.tsx` (sin pruebas de interfaz, decisión F0-00), casilla de la regla 13 escrita, barrido de citas.
3. **Lote 3 · OVI (~400, tras Q1):** `puedeCrearOVIGarantia` en alta, transición y remisión; invertir la prueba «sin llamador» de `cargos.test.ts`; RQ-PM-24, RQ-TC-35 y RQ-RE-20; barrido final y archive (parte con carga de revisión < 800, regla del archivo).

## Correcciones al volcar

1. Todas las citas pasaron de nombre de fichero pelado a ruta completa desde la raíz (el detector de `pre-push` resuelve por ruta); la tabla de guardas del §4 lleva los números sin forma de cita y el fichero nombrado encima.
2. `estadoPorRemision.ts` vive en `apps/desk/server/db/`, no junto a `ticketService.ts`; el informe no daba ruta.
3. Rangos de `openspec/config.yaml` corregidos por su final: PF-2 termina en la 1323 (decía 1319), `decision/titularidad-ov-equipo` en la 1603 (decía 1601) y `decision/c10-permisos-cargo` en la 1946 (decía 1944).
4. Tabla de guardas: el informe decía que «las 9 guardas B y la 10 están en la misma línea». Medido: sólo cargo, prioridad, verificación y alta validada (guardas 6 a 9) comparten la línea 131; el área ocupa 129-131 y el 422 de contenido se lanza en la 134.
5. `exigirAltaValidada`: la función ocupa 258-264 y su comentario de cabecera 252-257. Un encargo anterior decía 251-264; la 251 es una línea vacía.
6. `CreateTicket.tsx`: del selector de prefijo sólo se verificó la línea 423; el informe citaba 423-424.
7. §5: con el supuesto S-4 (se conservan los tres `from`) RQ-TS-02 NO se modifica, porque su SHALL sigue siendo cierto; sólo se modificaría al retirar el origen. Además, la tabla de RQ-TS-06 no lista hoy las guardas de cargo, prioridad, verificación ni alta validada: ya está incompleta frente al código.
8. Maestro: la frase «oculta los pasos innecesarios» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1178`) se refiere al desplegable de Clasificaciones, que ya enruta tres flujos; no a `tipo_servicio`.
9. Recuento de pruebas remedido con búsqueda literal: 70 menciones en 17 ficheros (58 en 11 de `apps`, 12 en 6 de `packages`). La búsqueda literal no caza las suites que recorren el catálogo entero sin nombrar la transición (hipótesis: `permisos.test.ts`); `transicionesEjecucion.test.ts` sí la nombra y la ejecuta desde sus tres orígenes.
10. `puedeCrearOVIGarantia` exige área Servicio Técnico y «Habilitar Servicio» es de área Comercial (`packages/shared/src/transitions.ts:178`): el informe no lo cruzaba, y condiciona la opción (A) de Q1.
