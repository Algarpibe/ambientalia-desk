# Blueprint de Servicio Técnico — Ambientalia (referencia para creación de tickets y transiciones)

Fuente: "Diccionario de Campos Tickets" + "DF-servicio-técnico-160226" (Blueprint Zoho Desk).
Este documento guía la futura **fase de creación de tickets y transiciones de estado** en la app.
Las transiciones deben respetar este flujo, su **área responsable**, sus **campos obligatorios**
y las **fechas** que cada una registra.

---

## 1. Convención del Asunto (nombre del ticket)

`Tipo de servicio + Nombre del cliente + Tipo de equipo + Prefijo_NúmeroSerie_Modelo_AAMMDD`

Ej.: `Servicio Técnico Gecelca S.A. E.S.P. Monitor de partículas MT_18A20070_EDM180C_260130`

**Prefijos** (parte del Código Servicio):
- **MT** — Mantenimiento / servicio técnico (mantenimiento, reparación o diagnóstico)
- **CG** — Calibración (normalmente Grimm)
- **HV** — Equipo nuevo (cualquier marca) / Revisión + Hoja de Vida
- **SR** — Soporte remoto (cualquier marca)
- **PRO** — Protocolos de servicio (Grimm/Horiba)

## 2. Campos que disparan/condicionan el flujo

- **Clasificaciones** (col 11): "Equipo para servicio de mantenimiento" | "Equipo nuevo" | "Soporte remoto".
  **Activa los distintos flujos de trabajo.**
- **Tipo de Servicio** (col 27): Calibración | Diagnóstico | Garantía | Mantenimiento | No aplica | Otro.
- **Prioridad** (col 9): High | Medium | Low (hoy poco usada; se conectaría con la app de calificación de clientes, asignada por Comercial al crear).
- **Código Servicio** (col 32): `Tiposervicio_NumeroSerie_Modelo_aammdd` (MT/CG/HV…).

## 3. Estados (fases)

Tablero actual (`shared/columns.ts`) cubre 12. El Blueprint usa además estados **transitorios**
no presentes hoy como columnas — a tener en cuenta:
`OV asignada`, `Solicitado`, `Servicio externo`, `En espera de SKU inventario`,
`Notificación a Compras`, `Continuación del proceso`, y `Finalizado` (cerrado).

Categorías Zoho: cada estado pertenece a **ABIERTO** o **EN ESPERA** (afecta col 13
"Hora de reapertura": se actualiza al pasar de EN ESPERA → ABIERTO).

### 3.1 La fase temprana, donde la app ya no sigue a Zoho (2026-08-06)

Las tres primeras fases dejaron de coincidir con el Blueprint de Zoho. Los literales viven en
`shared/transitions.ts` (`STATUS_OV_ASIGNADA`, `STATUS_TICKET_CREADO`, `STATUS_REMISION_CREADA`),
no sueltos en cada sitio.

```
   ticket creado en Zoho            ticket creado en Desk
            │                                │
            ▼                                ▼
     ┌──────────────┐                 ┌──────────────┐
     │ OV asignada  │                 │Ticket creado │      ← la MISMA fase, dos nombres
     └──────┬───────┘                 └──────┬───────┘
            │                                │
            │                    n8n confirma la remisión
            │                                ▼
            │                         ┌──────────────┐
            │                         │Remisión creada│
            │                         └──────┬───────┘
            │        Habilitar Servicio      │        (aplica desde las tres)
            └────────────────┬───────────────┘
                             ▼
                       ┌───────────┐
                       │ Ingresado │
                       └───────────┘
```

- **`OV asignada`** — el nombre de Zoho. Se conserva porque los tickets siguen llegando por el sync
  con ese estado: renombrarlo en la base los dejaría sin columna en el tablero (caerían en "Otros")
  y sin transición aplicable. **No se migra nada.**
- **`Ticket creado`** — el nombre propio de la app. Lo pone `createTicket`, y solo lo tienen los
  tickets nacidos en Desk (id con prefijo `app-`).
- **`Remisión creada`** — **fase nueva**, no existe en Zoho. Antes, un ticket con remisión y otro sin
  ella estaban en el mismo sitio de la máquina de estados.

**A `Remisión creada` NO se llega por un botón.** La escribe el servidor solo, desde
`sincronizarEstadoPorRemision` (`server/db/estadoPorRemision.ts`), y por eso no está en `TRANSITIONS`:
- **Avanza** cuando el callback de n8n trae `ok` u `ok_con_avisos`, es decir cuando el documento
  existe de verdad en Drive. Un desenlace en `error` no mueve nada.
- **Retrocede** al anular la última remisión vigente confirmada, y vuelve a avanzar al restaurarla.
- **No toca** un ticket que ya pasó de esta fase: si alguien lo habilitó a `Ingresado`, anular una
  remisión no puede tirar de él hacia atrás.
- **No toca** un ticket de Zoho, que se queda en `OV asignada`. Moverlo lo marcaría `managed_by_app`
  —lo hace `writeTransition`— y lo sacaría del sync sin que nadie lo haya pedido.

## 4. Transiciones (35) — origen → [transición] → destino · área · tipo · obligatorios · fechas

> "Fechas/cols" referencia números del diccionario de campos.

> Las filas 1 y 2 divergen de Zoho desde 2026-08-06 (ver §3.1), y 1b no existe allí.
>
> **La fila 2 pide menos que el Blueprint original, a propósito (2026-08-06).** Es la etapa donde se
> completa lo que la creación no capturó, no donde se rellena todo por adelantado:
> - **Entra `Serial`**, que es el dato que ata el ticket a su equipo. Un ticket nacido en la app
>   siempre lo trae (la creación exige equipo); uno venido de Zoho llega sin él.
> - **La Orden de Venta se BUSCA** contra Books, acotada al cliente y descartando las que ya usa otro
>   ticket. **`Fecha Orden De Venta` deja de teclearse**: la trae la OV elegida.
> - **Salen `Fecha de Cotización` y `Fecha Orden de Compra`.** En esta etapa la cotización y la
>   compra pueden no existir todavía, igual que la orden de venta. No se pierde el dato: la
>   cotización se captura en las transiciones 13 y 14 (Notificación cliente) y la orden de compra en
>   la 7 (Aprobación y S. Repuestos) — ver §5.
> - **Un campo que el ticket YA trae se enseña bloqueado y no se vuelve a pedir.** Vale para las 35
>   transiciones, no solo para ésta.

| # | Origen | Transición | Destino | Área | Tipo | Campos obligatorios | Fechas/cols |
|---|---|---|---|---|---|---|---|
| 1 | (Agregar Ticket) | Enviar | **Ticket creado** (en Zoho: OV asignada) | Comercial | Operativo manual | Orden de Venta | — |
| 1b | Ticket creado | **Remisión creada** (automática: callback de n8n `ok`/`ok_con_avisos`; la inversa al anular) | Remisión creada | Servicio Técnico | **Automática** — no hay botón | — | — |
| 2 | **OV asignada · Ticket creado · Remisión creada** | Habilitar Servicio | Ingresado | Comercial | Operativo manual | Comentario, Orden de Venta, **Serial**, Fecha OV (la trae la OV), Cumple condiciones comerciales (Sí/No) | 43 |
| 3 | Ingresado | Ingreso a Servicio | Rev./Diagnóstico | Servicio Técnico | Operativo manual | Código Servicio (valid.), Comentario, Fecha creación ticket (valid.), Fecha Remisión Entrada (oblig.) | 32,38,39 |
| 4 | Rev./Diagnóstico | Escalado a Revisión | Notificado | Servicio Técnico | Operativo manual | Prioridad, Comentario, Días de entrega | 9,52 |
| 5 | Notificado | Devolución a corrección | Rev./Diagnóstico | Servicio Técnico | Decisional | Comentario, Prioridad | 9 |
| 6 | En Espera de Repuestos | Llegada de repuestos | En Proceso | Comercial/Compras | Compras/Logístico | Comentario, Fecha Recepción de repuestos | 44 |
| 7 | Notificación cliente | Aprobación y S. Repuestos | En Espera de Repuestos | Comercial/Compras | Compras/Logístico | Comentario, Fecha Orden de Compra, Fecha Orden de Venta | 42,43 |
| 8 | En Proceso | Solicitud repuestos | Solicitado | Servicio Técnico | Operativo manual | Comentario (desc., código, cantidad) | — |
| 9 | Notificación cliente | Aprobación | En Proceso | Comercial | Operativo manual | Comentario, Adjuntar archivos, Fecha OC final, Fecha OV final | 42,43 |
| 10 | Solicitado | Entrega de Repuestos | En Proceso | Servicio Técnico | Compras/Logístico | Comentario | — |
| 11 | En Proceso | Marcar como pendiente | Pendiente | Servicio Técnico | Operativo manual | Comentario, Fecha de vencimiento | — |
| 12 | Notificación a Compras | Notificación por garantía | En Espera de Repuestos | Comercial/Compras | Operativo manual | Fecha Notificación por garantía | — |
| 13 | Notificación a Comercial | Notificación cliente | Notificación cliente | Comercial | Operativo Comercial | Comentario, Fecha de Cotización | 41 |
| 14 | En espera de SKU inventario | Notificación cliente | Notificación cliente | Comercial | Compras/Logístico | Comentario, Fecha de Cotización | 41 |
| 15 | Notificación a Compras | Rechazo de garantía | Notificación Comercial | Comercial/Compras | Compras/Logístico | Comentario | — |
| 16 | Notificación Comercial | Solicitud SKU | En espera de SKU inventario | Comercial/Compras | Operativo Comercial | Comentario, Fecha solicitud SKU | — |
| 17 | Notificado | Reporte por garantía | Notificación a Compras | Servicio Técnico | Operativo manual | Comentario, Fecha Revisión Informe | 40 |
| 18 | Notificado | Escalado a comercial | Notificación Comercial | Servicio Técnico | Operativo manual | Comentario, Días de entrega, Fecha Revisión Informe | 40,52 |
| 19 | En Proceso | finalización de servicio | Por Facturar | Servicio Técnico | Operativo manual | Comentario, Fecha Finalización ST, Equipo/partes listas?, Archivo trazabilidad Actualizado?, Documentación en Drive?, HV Actualizada?, Fecha de vencimiento, Adjuntar archivos | 45 |
| 20 | En Proceso | Calibración de sensores ext. | Servicio externo | Servicio Técnico | Operativo manual | Comentario, Fecha Salida Servicio externo | — |
| 21 | Rev./Diagnóstico | Calibración de sensores ext. | Servicio externo | Servicio Técnico | Operativo manual | Comentario, Fecha Salida Servicio externo | — |
| 22 | Servicio externo | Retorno de servicios externos | En Proceso | Servicio Técnico | Operativo manual | Comentario, Fecha Entrada servicio externo, Conformidad (valid.) | — |
| 23 | Pendiente | Servicio externo | Por Facturar | Servicio Técnico | Operativo manual | Comentario, Resolución, Adjuntar archivos | — |
| 24 | Notificado | Servicio externo | Por Facturar | Servicio Técnico | Operativo manual | Comentario, Resolución, Adjuntar archivos | — |
| 25 | Notificación Comercial | Rechazo | Por Facturar | Comercial/ST | Decisional | Comentario (oblig.) | — |
| 26 | Notificación cliente | Rechazo | Por Facturar | Comercial/ST | Decisional | Comentario (oblig.) | — |
| 27 | Rev./Diagnóstico | Rechazo | Por Facturar | Comercial/ST | Decisional | Comentario (oblig.) | — |
| 28 | Por Facturar | Facturado | Liberación comercial | Comercial | Operativo Comercial | Comentario, Fecha de Factura | 46 |
| 29 | Por Facturar | facturado y cierre de TK | Finalizado | Comercial | Operativo Comercial | Comentario, Fecha de Factura | 46 |
| 30 | Pendiente | Diagnóstico complementario | Continuación del proceso | Servicio Técnico | Operativo manual | Comentario (cond. "Requiere envío a fábrica o diagnóstico adicional" = True) | — |
| 31 | Por Facturar | Liberación sin factura | Por Entregar / Sin facturar | Comercial | Operativo Comercial | Comentario, Liberación del ticket sin facturar (checkbox) | — |
| 32 | Por Entregar / Sin facturar | Entrega al cliente sin factura | Por Facturar | Servicio Técnico | Operativo manual | Comentario, Liberación sin facturar (valid.), Fecha remisión de salida | — |
| 33 | Por Entregar | Entrega al cliente | Finalizado | Servicio Técnico | Operativo manual | Comentario, Fecha de Vencimiento, Fecha Remisión de Salida | — |
| 34 | Liberación comercial | Habilitado para entrega | Por Entregar | Comercial | Operativo Comercial | Comentario (oblig.) | — |
| 35 | Continuación del proceso | Notificación re cotización | Notificación Comercial | Comercial | Operativo manual | Comentario (oblig.) | — |

## 5. Mapa de fechas → cuándo se registran (para reportería)

- **38 Fecha creación ticket** / **39 Fecha Remisión Entrada** → transición 3 (Ingreso a Servicio).
- **41 Fecha de Cotización** → transiciones 13/14 (Notificación cliente).
- **42 Fecha Orden de Compra** / **43 Fecha Orden de Venta** → transiciones 2, 7, 9.
- **40 Fecha Revisión Informe** → transiciones 17, 18.
- **44 Fecha Recepción de repuestos** → transición 6.
- **45 Fecha Finalización ST** → transición 19.
- **46 Fecha De Factura** → transiciones 28, 29.
- **52 Días de entrega** ("Tiempo promesa") → transiciones 4, 18.

## 6. Implicaciones para la implementación (cuando se aborde)

1. **Crear ticket** (Comercial): formulario con Asunto estandarizado (constructor por componentes
   + prefijo), Clasificaciones, Tipo de Servicio, contacto/empresa, Orden de Venta → crea en Zoho
   (`POST /tickets`). Requiere `ENABLE_WRITES=true`.
2. **Transiciones**: Zoho Desk usa la **API de Blueprint** (no un simple `updateTicket` de estado).
   El detalle de Zoho muestra "ESTADO ACTUAL → TRANSICIONES" (botones). Hay que:
   - Listar transiciones disponibles del ticket según su estado (Blueprint API).
   - Por cada transición, **exigir los campos obligatorios** de la tabla §4 antes de ejecutarla.
   - Ejecutar la transición (que a su vez escribe las fechas/campos correspondientes).
3. **Validaciones por área**: cada transición tiene un **área responsable**; a futuro podría
   restringirse por rol de usuario.
4. **Reportería** (deuda en `debt.md`): con las fechas pobladas se pueden calcular los indicadores
   del diccionario (tiempo de servicio, cumplimiento de promesa, tiempos de cotización/OC/OV, etc.).

> Verificar en Zoho qué endpoints de Blueprint expone la API/MCP antes de diseñar el motor de
> transiciones (los nombres de transición y los `transitionId` se obtienen de Zoho por ticket).
