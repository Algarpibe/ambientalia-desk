---
tanda: F1B-14
motivo: ""
capacidad: [tickets-core, hojas-vida]
maestro: ["M1.4"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: alta del equipo nuevo desde el ticket

Primer cambio de F1B-14 «Alta y edición del equipo» (talla S–M). Exploración de toda la fila:
`exploration.md` de esta carpeta.

## Intención

Hoy un equipo que la empresa nunca ha registrado no puede tener ticket sin darlo de alta antes en otra
pantalla: `createManagedTicket` exige siempre un equipo ya registrado (`apps/desk/server/services/ticketService.ts:22-25`).
Gerencia decidió que, con la clasificación «Equipo nuevo», el alta registre el equipo en el mismo paso
(`openspec/config.yaml:2758-2773`).

**Maestro.** M1.4 es el flujo de la rama equipo nuevo, que «aún no está implementada en la aplicación»
(R08.2.md:1491-1492). La decisión la asigna a ese pasaje (`openspec/config.yaml:2771`). El prefijo HV,
«revisión y creación de hoja de vida» (R08.2.md:1092, M1.1), es un apoyo, no la fuente. Se mantiene M1.4.

## Encuadre: dos cambios bajo una sola fila

- R-4: cada cambio lleva un único `tanda:`, no se reparte. Los dos llevan `F1B-14`.
- (1) **este**, `cierra: no`. (2) `edicion-comercial-equipo`, `cierra: si`: restricción por área del
  PATCH en tres campos, registro de cambios, botón «Editar» en la hoja de vida.
- Motivo: la estimación conjunta es de 670 a más de 1.000 líneas (`exploration.md`), por encima del techo de 800.
- **F1B-14 es un supuesto de nomenclatura**: el siguiente ID libre tras F1B-13. La fila queda escrita en
  el §G del plan R01.3. El contenido lo decide Gerencia.

## Alcance

**Dentro**
- Una rama en `createManagedTicket` para `clasificaciones === 'Equipo nuevo'` sin `equipoId`. Acepta los datos del equipo en el cuerpo:
  - obligatorios: serial, `modeloId` del catálogo y `fechaFacturaCompra` (la de compra, **no** `tickets.fecha_factura`);
  - opcionales: adquisición, fin de garantía, código interno, Drive y mantenedor, con la validación de F1B-02 (`routes/equipos.ts:144-189`).
- Un helper nuevo `getEquipoBySerial`, de coincidencia exacta tras normalizar (trim y minúsculas). Si el serial ya existe, se usa ese equipo y no se crea otro.
- El ticket queda enlazado al equipo, sea creado o reutilizado.
- Mantenimiento y Soporte remoto no cambian.
- Rama condicional en `CreateTicket.tsx`, sin pruebas por F0-00.
- Delta de `tickets-core` (RQ-TC-05 gana la subtabla de la rama) y de `hojas-vida` (alta desde el ticket).

**Fuera**
- El segundo cambio: restricción por área, registro de cambios y botón «Editar».
- El grafo propio de «Equipo nuevo» (F1B-06, `tickets-core` §4.3).
- Cualquier restricción de área en el alta.
- Añadir `UNIQUE` a `equipos.serial`.
- Extraer `EquipoForm` a un fichero propio.

## Capacidades

- Nuevas: ninguna. R-2 no se activa.
- Modificadas: `tickets-core` (orden de las guardas del alta) y `hojas-vida` (el equipo nace desde el ticket).

## Supuestos aplicados (modo producción, todos reversibles)

- **(a1)** La restricción por área de `edicion-datos-comerciales-equipo` se aplica a CAMBIAR los datos, no al alta. Extenderla al alta contradiría RQ-TC-05, porque el alta no filtra por área (`tickets-core/spec.md:619`).
- **(a2)** Si el serial ya existe, el servidor reutiliza el equipo sin avisar y el cliente lo enseña en la vista previa.
- **(a3)** El serial se normaliza con trim y minúsculas.
- **(a4)** El cliente del equipo nuevo es el cliente ya resuelto del ticket, del cuerpo o de la OV (`ticketService.ts:27-42`).
- **(b2)** El equipo se crea SÓLO tras pasar todas las guardas, y en la MISMA transacción que el INSERT del ticket. Así no quedan equipos huérfanos.
  - Se conserva A<B<C<D: faltar un dato obligatorio es escalón A, como «Falta el equipo»; que un dato sea inválido es escalón C.
  - El orden exacto de la rama lo fija `design.md`.
- **(b3)** El registro de cambios del segundo cambio audita los seis campos que nombra la decisión, ni uno más ni uno menos.

## Enfoque

1. Separar la resolución del equipo en dos pasos: primero se valida y después se escribe.
2. Crear o reutilizar el equipo después del `409` de la OV (`ticketService.ts:94-98`).
3. Hacerlo dentro de la transacción de `createTicket`, que se declara atómica (`packages/zoho-sync/src/db/repo.ts:374`). Cómo se comparte esa transacción entre paquetes lo decide el diseño.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| `equipos.serial` no es `UNIQUE`: dos altas simultáneas pueden duplicar el equipo | Baja | Se declara aquí y queda fuera de alcance |
| La transacción compartida entre `apps/desk` y `zoho-sync` complica el diseño | Media | Se resuelve en `design.md` |
| Citas de RQ-TC-05 ya desfasadas: la tabla de `spec.md:117-125` dice `:65-83`, cuando hoy la guarda está en `:59-77` | Alta | Se reparan en el delta (regla de mutación 4) |
| El `.tsx` queda sin red de pruebas | — | Comprobación de persona en la app |

## Plan de vuelta atrás

Revertir el commit. No hay migración. Los equipos creados son filas válidas de Registro de equipos.

## Criterios de aceptación (strict TDD, en rojo antes que en verde)

1. «Equipo nuevo» sin `equipoId` y con datos válidos: `201`, un equipo nuevo con `clientId` igual al del ticket y el ticket enlazado a él.
2. Serial existente, aunque cambien los espacios o las mayúsculas: `201`, no se crea otro equipo y el ticket queda enlazado al equipo existente.
3. Falta el serial, el modelo o `fechaFacturaCompra`: `422`, y no se escribe nada.
4. Fecha o Drive inválidos: `422` con el mensaje de F1B-02.
5. Una guarda posterior falla, por ejemplo el `409` de la OV: no queda ningún equipo creado.
6. Mantenimiento o Soporte remoto sin `equipoId`: `422 'Falta el equipo'`, igual que hoy.
7. Hay prueba de posición: mover la creación antes de las guardas pone la suite en rojo.
