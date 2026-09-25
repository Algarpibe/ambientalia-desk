---
tanda: F1B-04
motivo: ""
capacidad: [remisiones]
maestro: ["M2.1", "C.9"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: la foto se exige sólo cuando el equipo llega con novedad

Primer cambio de F1B-04 «Registro de entrada en recepción»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159`). Construye SÓLO el elemento «foto sólo
con novedad». Exploración: Engram `sdd/recepcion-unificada/explore` (obs. 1055). Líneas remedidas en disco
sobre `a0a2935`.

## Intención

Hoy la foto de la remisión de entrada es siempre opcional: el selector no es obligatorio
(`apps/desk/src/components/CrearRemision.tsx:267-276`), la subida es libre
(`apps/desk/server/routes/remision.ts:367-377`) y `/enviar` no mira las fotos (`:269-312`). No existe un
dato estructurado de «novedad»: sólo el texto libre `observaciones` (`CrearRemision.tsx:264`). Resultado:
un equipo que llega golpeado puede remisionarse sin evidencia, y nada distingue «llegó bien» de «no se
miró».

El maestro fija la regla: «La fotografía se exige sólo cuando hay novedad, no siempre»
(M2.1, `R08.2.md:1920-1923`, marcado `[AS-IS 27/08]`; repetido en el Anexo C.9, `R08.2.md:3894`). No está
en la tabla §3.2 `[EN REVISIÓN — R08]`: el ítem 4 de esa tabla (`R08.2.md:2982-2983`) es el elemento de los
desplegables, que queda fuera.

## Alcance

**Dentro**
1. Dato estructurado «¿El equipo llega con novedad?» en la remisión de entrada: columna nueva
   `hay_novedad boolean` en `public.remisiones`, aceptada en `POST /api/remisiones` como `hayNovedad`.
2. Guarda del servidor en `POST /api/remisiones/:id/enviar`: con novedad declarada y cero fotos, `422`
   con mensaje claro, y **sin** tomar la reclamación del envío.
3. Predicado compartido en `packages/shared` que consumen servidor y cliente (regla 13.1).
4. Formulario: pregunta Sí/No sin valor por defecto; con «Sí», no deja crear sin foto y no ofrece
   «Continuar sin fotos» si quedaría en cero.
5. Delta de la spec `remisiones`.

**Fuera** (por eso `cierra: no`)
- Elementos 1 y 2 de la fila (remisión con datos de cliente y equipo; accesorios por lista cerrada): ya
  construidos y probados (`routes/remision.ts:39-73`, `:191-197`; `remisiones.test.ts`,
  `checklistRemision.test.ts`).
- «Rotulación y almacenamiento»: pregunta abierta, `docs/sdd/ENTRADA.md` E-079.
- «Desplegables en las etapas críticas» y cualquier taxonomía de tipos de novedad: E-080.
- P59 y `decision/p15-p59-rutas` (`openspec/config.yaml:2023-2039`): «equipo sin novedad… sin exigencia de
  fotografía» (`R08.2.md:4223`) es la ruta por las etapas macro del checklist dinámico (F1D). Homónimo, no
  esta regla.
- El payload hacia n8n (`apps/desk/server/remisionWebhook.ts:5-24`) no se toca. El flujo de producción
  sigue intacto.
- El orden de guardas del ALTA (IV-12): no se añade ninguna guarda a `POST /api/remisiones`.
- Pruebas de interfaz (F0-00): no se propone `jsdom`.

## Capacidades

- Nuevas: ninguna. R-2 no se activa.
- Modificadas: `remisiones`. RQ-RE-08 («cinco puertas, en este orden», `openspec/specs/remisiones/spec.md:216-229`)
  pasa a seis. Requisito nuevo para la regla de la foto. RQ-RE-13 (`:305`), sólo si el diseño lo pide.

## Supuestos aplicados (modo producción, todos reversibles)

- **(s1) El vehículo es la remisión de entrada.** El maestro sitúa la regla en la inspección visual previa
  (M2.1), pero la secuencia de recepción la pone con el remisionado y el registro fotográfico (C.9,
  `R08.2.md:3893`), y hoy las fotos de recepción viajan en la remisión (`remisionWebhook.ts:18-23`).
- **(s2) Guarda en `/enviar`, no en el alta.** Las fotos se suben DESPUÉS de crear
  (`routes/remision.ts:256-258`). En el alta la guarda no podría contar fotos, y además tocaría IV-12.
- **(s3) Posición:** después de «ya enviada» (`:280-282`) y ANTES de `reclamarEnvio` (`:286`). Ese
  `UPDATE` escribe `enviado_at` (`apps/desk/server/db/remisiones.ts:170-182`). Un `422` posterior dejaría
  la remisión bloqueada durante toda la ventana de reenvío. Encaja en el orden A<B<C<D de F1B-10: 404 (A),
  anulada y ya enviada (B), novedad sin foto (C), reclamación (D).
- **(s4) Históricos:** `NULL` = «no declarado» → sin exigencia. La regla no es retroactiva. Los
  `origen='historico'` nacen en `ok` (`apps/desk/server/db/remisionesHistoricas.ts:156`) y ya se paran en
  `:280`. Sólo existen los orígenes `app` e `historico` (`packages/zoho-sync/src/db/schema.sql:313`): n8n no
  crea remisiones.
- **(s5) Tres valores:** `true`/`false` se guardan; cualquier otra cosa se guarda como `null`. **Regla 13,
  punto 2, declarado:** la obligación de CONTESTAR la pregunta vive sólo en el cliente. Exigirla en el
  servidor añadiría una guarda al alta (IV-12, sin destino). El servidor sí impone la consecuencia (la foto).
  Enviar `false` o no enviar nada son elusiones equivalentes: la novedad es una declaración humana.
- **(s6) Una foto basta.** No se exige una por componente.
- **(s7) Resto de la exigencia:** una pendiente con novedad y sin fotos, porque todas las subidas fallaron
  o por «Enviar esa» (`CrearRemision.tsx:314`), recibe el `422` en el panel de desenlace. `enviar` no
  lanza (`apps/desk/src/lib/envioRemision.ts:49-51`). Salidas: reintentar la subida en la misma pantalla, o
  que un administrador anule la remisión. No se construye edición de la novedad.

## Enfoque

1. Esquema: `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS hay_novedad boolean`, calificada.
2. `db/remisiones.ts` y `Remision` (`packages/shared/src/types.ts:713`). Las ediciones se hacen EN LÍNEA
   donde se pueda, porque ambos ficheros están muy citados.
3. Predicado compartido, añadido al FINAL de su módulo.
4. `routes/remision.ts`: se lee `hayNovedad` en la llamada a `createRemision` (`:242-255`, por debajo de
   `:220`, así que las citas de IV-12 no se mueven). Guarda en `/enviar` según (s3).
5. Cliente: `client.ts` (`CrearRemisionPayload`, `:518-534`) y `CrearRemision.tsx`. Es comodidad legítima
   (regla 13.3) porque el servidor la impone y la prueba.

## Estimación de tamaño (techo 800, medida `--no-renames` + nuevo sin trackear)

| Bloque | Líneas |
|---|---|
| Servidor: esquema, `db/remisiones.ts`, ruta | 25-40 |
| `packages/shared`: tipo + predicado | 20-30 |
| Pruebas: `remisiones.test.ts`, predicado, `envioRemision` si cambia | 150-210 |
| Cliente: `client.ts` + `CrearRemision.tsx` | 35-60 |
| **Código apply** | **230-340** |
| `apply-progress` + marcas de `tasks.md` | ~220 |
| **Lote de apply** | **~450-560: UN lote** |
| `verify-report` | ~230 |
| Archive: carpeta ×2 (~900 × 2) + fusión (se mide) + `archive-report` ~130 | ~1.950-2.100 |

El archive supera 800 y necesita un techo aprobado, como el precedente de `detector-citas-extremos`. Si el
intento de apply incluye verify: ~680-790, en el límite.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Guarda tras la reclamación → bloqueo de 120 s | Media si se hace mal | Prueba de posición (mutación 1): tras el `422`, subir una foto y reenviar enseguida da `200` |
| Pendiente atascada con novedad y sin fotos | Baja | (s7) y el bloqueo en el cliente |
| Declaración obligatoria sólo en el cliente | — | Declarada en (s5) |
| Citas desfasadas en `routes/remision.ts` y `db/remisiones.ts` | Alta | Barrido de la regla de mutación 4 al cerrar. La tabla de RQ-RE-08 ya trae abreviadas por remedir |
| `.tsx` fuera de la red de pruebas | — | Comprobaciones de persona |

## Plan de vuelta atrás

Revertir el commit. La columna es aditiva y `NULL`-able, así que queda sin efecto. Se retira con un `DROP`
explícito sólo si Gerencia lo pide.

## Criterios de aceptación (strict TDD, rojo antes que verde)

1. Novedad `true` y 0 fotos: `422`, sin disparo a n8n, `enviado_at` sigue `NULL`.
2. Novedad `true` y ≥1 foto: se envía.
3. Novedad `false` o `null` (histórico) y 0 fotos: se envía como hoy.
4. Posición: anulada + novedad sin foto → `409` de anulada. `ok` + novedad sin foto → `409` de ya enviada.
5. El alta persiste `hayNovedad` (`true`/`false`/`null`) y no cambia ninguna respuesta existente.
6. La columna está calificada (guardián de `migrate.test.ts`, mutación 2).

**Comprobaciones de persona** (fuera del recuento; dueño Servicio Técnico, en la app; archivar no las da
por hechas): pregunta Sí/No visible; con «Sí» y sin foto el formulario no deja crear; el mensaje del `422`
se entiende.

## Nota sobre `toca_maestro: no`

M2.1 y C.9 ya enuncian la regla, y nada de lo que dicen se vuelve falso. H.4 del Anexo H va por módulo
(`R08.2.md:4709-4721`) y no menciona fotos de recepción. Hipótesis a confirmar en el archive
(`openspec/config.yaml:2991`): no hay fila del Anexo H que actualizar.

## Ronda de preguntas de la propuesta (no bloqueante, modo `auto`)

Para Gerencia o Servicio Técnico. Cada una lleva el supuesto aplicado.
1. ¿Una sola foto basta, o hace falta una por componente con novedad? Supuesto: una (s6).
2. ¿La marca de novedad debe salir en el documento de Drive que ve el cliente? Supuesto: no en este
   cambio. Pedirlo exigiría ampliar el payload de n8n, de forma aditiva.
3. ¿Qué pasa si la novedad se declaró por error y no hay foto posible? Supuesto: un administrador anula y
   se rehace (s7).
4. ¿El servidor debe exigir que se conteste la pregunta? Supuesto: no hasta que se asigne IV-12 (s5).
