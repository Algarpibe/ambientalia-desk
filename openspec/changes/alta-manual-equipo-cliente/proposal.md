---
tanda: F1B-15
motivo: ""
capacidad: [tickets-core, hojas-vida, transitions-st, zoho-sync]
maestro: ["M3.4", "nº 83"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: alta manual de equipo y cliente desconocidos

Detalle medido en `exploration.md` de esta carpeta.

## Intención

Hoy la recepción se bloquea con un cliente que no está en Books: el alta exige un cliente existente
(`apps/desk/server/services/ticketService.ts:84`, `:89-90`) y, salvo en «Equipo nuevo», un equipo ya
registrado (`:24`). Zoho Desk permite registrar cualquier equipo; sin esto se pierde paridad el 14/12.
Fuentes: E-129 (`docs/sdd/ENTRADA.md:1555`), `decision/orden-ejecucion-encargo-01-10` (b)
(`openspec/config.yaml:3526`) y el maestro (`…R08.4.md:2529-2535`).

## Alcance

**Dentro**
- **Alta manual del equipo** en cualquier clasificación: serial tecleado dos veces y comparado **en el
  servidor**; modelo del catálogo o «modelo no catalogado» con texto; tipo. Si el serial existe, se ofrece el
  existente (reutiliza `equipoNuevo.ts:46-47`). Sin los tres campos comerciales reservados.
- **Cliente provisional** en tabla propia `public.clientes_provisionales` (razón social, NIT, contacto,
  teléfono, correo), visible por la vista `public.clients` con `UNION ALL` y una columna `provisional` al final.
- **Marca «pendiente de validar»** en equipo y cliente, y **traza**: quién, cuándo y motivo escrito obligatorio.
- **Validación por Comercial (o administrador)**: enlazar el provisional con su contacto de Books, reescribiendo
  `client_id` de tickets y equipos en una transacción; y validar el equipo, con registro en `equipos_cambios`.
- **Guarda en «Habilitar Servicio»** (`packages/shared/src/transitions.ts:178`): 422 mientras el cliente siga
  provisional o el equipo pendiente. Predicado en `packages/shared`, impuesto en el servidor.
- Interfaz: modo manual en `CreateTicket.tsx`; aviso de pendiente y acción de validar en la hoja de vida.

**Fuera**
- Escribir en Zoho (`decision/p44-escritura-zoho`): el contacto lo crea Comercial a mano en Books.
- OCR: no existe en el código (`exploration.md` §2). F1B-14 no se toca ni se reabre.
- La guarda de remisión vigente de F1B-03 y la prueba de posición entre las dos (R01.4 §H, `:308`).
- Contratos y Top 5 sobre clientes provisionales.

## Enfoque

Lote 1, servidor del alta: esquema, cliente provisional, alta manual y traza. Lote 2: enlace, validación y
guarda. Lote 3: interfaz. Lógica nueva en módulos propios. En `ticketService.ts` sólo llamadas en líneas
existentes, como ya se hace en `:91`, `:96` y `:131`, para no desplazar citas.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Regla 13. El cliente decide tres cosas: el serial doble, ocultar los campos comerciales y desactivar «Habilitar» | El servidor impone las tres: comparación del serial, rechazo de los campos restringidos (`apps/desk/server/routes/equipos.ts:73`, misma regla) y la guarda nueva. Cada línea se nombra en `verify` |
| El cambio de vista toca a los 24 llamadores de `getClient` y a `RQ-ZS-09` | Columnas idénticas y `provisional` al final. Prueba de que un id de Books se resuelve igual |
| Regla de mutación 4 sobre `ticketService.ts`, `schema.sql` y `transitions.ts` | Sin insertar líneas antes de las citadas. Barrido de citas al cierre |
| Esquemas | `CREATE TABLE public.…` al final. Las `ALTER` de `equipos` sin calificar (`DESK_TABLES`). Entrada en `PUBLIC_TABLES` |
| Regla de mutación 1: la posición de la guarda | Prueba que active a la vez la guarda nueva y una vecina del escalón B |

## Ronda de preguntas (modo producción: supuestos aplicados y reversibles)

1. **Q1, nº 83: ¿quién hace el alta manual?** Supuesto: cualquier usuario que hoy puede crear tickets
   (`apps/desk/server/routes/tickets.ts:124`). Restringirlo después es estrechar la regla.
2. **Q2, nº 83: ¿los cinco datos son el mínimo?** Supuesto: sí, los cinco obligatorios.
3. **Q3: ¿hay guarda en soporte remoto?** Ese flujo no pasa por «Habilitar Servicio» (`packages/shared/src/flujos.ts:138-140`,
   `transitions.ts:388-397`). Supuesto: sólo la guarda literal; en soporte remoto la marca se ve, pero no bloquea.
4. **Q4: ¿hace falta un modelo del catálogo para validar el equipo?** Supuesto: no; el texto se conserva.

Ninguna cambia el alcance de la fila ni bloquea.

## Tareas de persona (fuera del recuento)

- Q1-Q4: las responde Gerencia y quedan en `openspec/config.yaml`.
- Comercial crea en Books los contactos que falten. Es operación, no tanda.

## Criterios de aceptación

1. El alta con cliente provisional y equipo manual crea un ticket en `Ticket creado` (o en `Solicitud Soporte` si es soporte remoto) con los dos marcados.
2. Un serial que no coincide con su confirmación da 422 sin escribir nada.
3. Un serial existente reutiliza el equipo y no crea otro.
4. Un alta manual con fecha de factura, fin de garantía o mantenedor da 422.
5. «Habilitar Servicio» con algo pendiente da 422. Tras el enlace y la validación, pasa.
6. El enlace reescribe `client_id` en tickets y equipos en una transacción. Un fallo no deja nada a medias.
7. Un usuario fuera de Comercial y no administrador recibe 403 al enlazar o validar.
8. Ninguna escritura sale hacia Zoho, y `npm test`, `typecheck` y `lint` pasan.

## Estimación por intento (techo 800)

| Intento | Contenido | Líneas |
|---|---|---|
| Artefactos de spec, diseño y tareas | — | ~450 |
| Lote 1 | servidor del alta | ~475 |
| Lote 2 | enlace, validación y guarda | ~330 |
| Lote 3 | interfaz | ~280 |
| Verify | informe | ~350 |

## Cabecera

`cierra: si`: el cambio cubre todo el contenido de E-129 y de `…R08.4.md:2529-2535`. Las preguntas Q1-Q4 son
decisiones de persona, no trabajo. `toca_maestro: si`: el Anexo D nº 83 y la aclaración sobre soporte remoto
deben llegar al expediente R08.5. `zoho-sync` entra por `RQ-ZS-09` (la vista).

## Reversión

`git revert` de los lotes. La tabla y las columnas nuevas son aditivas, y la vista vuelve a su definición de
`schema.sql:169-173`.
