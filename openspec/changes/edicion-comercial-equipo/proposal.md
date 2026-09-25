---
tanda: F1B-14
motivo: ""
capacidad: [hojas-vida]
maestro: ["M3.1", "M11.4"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: edición de los datos comerciales del equipo, con restricción por área y registro de cambios

Segundo y último cambio de F1B-14 «Alta y edición del equipo». El primero (`alta-equipo-nuevo-en-ticket`,
`cierra: no`) está archivado en `openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket/`.
Exploración de toda la fila: Engram obs. 1033 (números de línea anteriores a `33d4107`; los de aquí están
remedidos en disco sobre `0807a77`).

## Intención

Hoy cualquier usuario con sesión cambia los seis campos comerciales del equipo: `PATCH /api/equipos/:id`
sólo lleva `requireAuth` (`apps/desk/server/routes/equipos.ts:73`) y escribe lo que llega
(`:96-99`). Tres de esos campos deciden si un servicio se cobra y quién puede pagarlo, y ningún cambio deja
rastro. Gerencia decidió (`openspec/config.yaml:2775-2790`, `decision/edicion-datos-comerciales-equipo`):

- Fecha de factura de compra, fin de garantía y mantenedor: sólo área Comercial y administradores, **impuesto
  en el servidor**.
- Adquisición, código interno y Drive: cualquier usuario con sesión.
- Todo cambio en los seis campos queda registrado (persona, fecha y hora, valor anterior y nuevo) y se ve en
  la hoja de vida, que gana su propio botón «Editar».

## Alcance

**Dentro**
1. Guarda de área en el `PATCH`, sólo para los tres campos restringidos. Un usuario sin área Comercial que
   intente **cambiar** uno de ellos recibe `403` y no se escribe nada del cuerpo.
2. Tabla nueva de registro de cambios, esquema calificado, escrita en la misma transacción que el `UPDATE`,
   una fila por campo que cambia de verdad.
3. Lectura de ese registro expuesta a la hoja de vida (ampliar `GET /api/equipos/:id/historial`,
   `routes/equipos.ts:38-42`, o ruta propia: lo decide el diseño).
4. Botón «Editar» en `apps/desk/src/components/HojaDeVida.tsx` con el mismo formulario que la lista
   (`EquipoForm`, `apps/desk/src/components/EquiposAdmin.tsx:95`), y los tres campos restringidos en solo
   lectura para quien no es Comercial ni administrador. Sección «Cambios» en la hoja de vida.
5. Delta de `hojas-vida`:
   - requisitos nuevos de permiso por campo y de registro de cambios;
   - **W2 del primer cambio** (`archive/2026-09-24-alta-equipo-nuevo-en-ticket/archive-report.md:128-134`):
     la vía de escritura de equipos desde `POST /api/tickets` (`apps/desk/server/services/equipoNuevo.ts:80-89`,
     que valida con `camposHojaDeVida` en `:69-71`) no figura en la spec;
   - retirar del §2 la línea «Permisos por área… hoy basta `requireAuth`… esta spec no lo cambia»
     (`openspec/specs/hojas-vida/spec.md:180-181`), que deja de ser cierta.

**Fuera**
- Restringir el alta (`POST /api/equipos` y alta desde el ticket). Ver supuesto (a1).
- Auditar `serial`, `clientId`, `modeloId` o `active`. Ver supuesto (b3).
- Restricción por cargo (`decision/c10-permisos-cargo`; esta decisión no entra en su lista de excepciones,
  `config.yaml:2782`).
- La guarda del mantenedor sobre la orden de venta (F1B-11, IV-8).
- Pruebas de interfaz (F0-00): no se propone `jsdom` ni `@testing-library`.

## Capacidades

- Nuevas: ninguna. R-2 no se activa.
- Modificadas: `hojas-vida`.
- `permissions` **no** se modifica si el servidor consume `canExecuteTransition(areas, isAdmin, 'Comercial')`
  (`packages/shared/src/permissions.ts:4-7`) o comprueba `areas.includes('Comercial')`: el administrador ya
  recibe las tres áreas (`apps/desk/server/auth/users.ts:27`). El diseño (D1) añade un helper en
  `packages/shared/src/equipoComercial.ts` que sólo **consume** `canExecuteTransition` sin cambiar su
  contrato ni ningún requisito de la spec `permissions`; por eso la cabecera se queda en `[hojas-vida]`.
  (Esta frase decía antes «si el diseño prefiere un helper nuevo, la cabecera gana `permissions`»; se
  precisa el 2026-09-25: lo que activaría `permissions` es cambiar `permissions.ts` o su spec, no consumirlo.)

## Supuestos aplicados (modo producción, todos reversibles)

- **(a1)** — ya aplicado por el orquestador. La restricción cubre CAMBIAR, no el alta: el alta no filtra por
  área (`tickets-core` RQ-TC-05). Tensión anotada: el maestro dice que los equipos nuevos los da de alta
  Comercial/Administrativa (R08.2.md:2053, M3.1).
- **(b3)** — ya aplicado por el orquestador. El registro audita sólo los seis campos.
- **(c1)** «Cambiar» se mide contra el valor guardado, tras normalizar (vacío = `null`, fechas `AAAA-MM-DD`).
  Motivo: `EquipoForm` manda SIEMPRE los seis campos (`EquiposAdmin.tsx:170-174`); si la guarda mirara sólo
  la presencia de la clave, un técnico no podría corregir el enlace de Drive sin recibir `403`.
- **(c2)** Orden de guardas del `PATCH`, conforme al orden total A<B<C<D (F1B-10): `404` (A) < `403` de área
  (B) < `422` de contenido (C). El orden exacto con la normalización lo fija `design.md`, con prueba de
  posición (regla de mutación 1).
- **(c3)** La tabla va en **`public`** (p. ej. `public.equipos_cambios`) aunque `equipos` esté en `desk`:
  `DESK_TABLES` son las del dominio Zoho Desk y lo propio de la aplicación va calificado en `public`
  (`packages/zoho-sync/src/db/migrate.ts:62-73`). Se añade a `PUBLIC_TABLES` en el mismo cambio.
- **(c4)** El registro es de solo inserción (M11.4, «tabla inmutable de auditoría», R08.2.md:2803) y
  **sobrevive** al borrado físico del equipo (`routes/equipos.ts:105-110`): sin `ON DELETE CASCADE`.
- **(c5)** El alta no genera filas de registro: registra cambios de un equipo existente. La persona se
  guarda por id de usuario y con su nombre en ese momento.
- **(c6)** Cabecera `maestro`: M3.1, no M3.2. La decisión cita «M3.2 (registro de equipos)»
  (`config.yaml:2788`), pero en la R08.2 M3.2 es «Taxonomía jerárquica ISO 14224» (`:2054`); los seis campos
  están en M3.1 «Estructura de datos» (`:2021-2053`). Hipótesis: errata del registro; no se corrige aquí.
  **Hipótesis, leída contra la R08.2:** ni M3.1 ni M3.3 («Funcionalidades de la hoja de vida», `:2076-2084`)
  hablan literalmente de editar los campos ni de registrar sus cambios. M3.1 es el que más se acerca: define
  los seis campos y quién los da de alta —Comercial/Administrativa, con cliente y fecha de factura
  (`:2053`)—, que es la clase restringida de esta decisión. M3.3 sólo trae una cronología de eventos del
  equipo (`:2078`), no de cambios de sus datos. El registro de cambios se apoya en M11.4. La errata M3.2 del
  campo `maestro_pasaje` de la decisión (`config.yaml:2788`) y de su fila en el expediente
  (`docs/sdd/R08.3_Expediente_de_cambios.md:611`) NO se corrige en `config.yaml` —es un campo de una
  decisión de Gerencia—: queda registrada como corrección pendiente para el expediente R08.3 en
  `docs/sdd/ENTRADA.md`.

## Pregunta para el diseño

`camposHojaDeVida` sigue exportada desde el módulo de ruta (`routes/equipos.ts:144`) y la importa un servicio
(`services/equipoNuevo.ts:6`): dependencia invertida que dejó el primer cambio. `design.md` decide si se
mueve (a `services/` o `db/`) en este cambio. Si se mueve, activa el barrido de la regla de mutación 4 sobre
`routes/equipos.ts` (citado por `hojas-vida/spec.md` y por `equipoNuevo.ts:64`).

## Enfoque

1. Servidor: calcular el `patch` normalizado (hoy `:96-98`), compararlo con `getEquipoFull`, aplicar la
   guarda de área a los campos restringidos que cambian, y escribir `UPDATE` + filas de registro en una
   transacción.
2. Esquema: `CREATE TABLE IF NOT EXISTS public.…` en `packages/zoho-sync/src/db/schema.sql`, cubierto por el
   guardián de `migrate.test.ts` (regla de mutación 2: ensuciar el `.sql` y ver el rojo).
3. Cliente: exportar `EquipoForm` en lugar de extraerlo a fichero (evita el diff de movimiento), usarlo desde
   `HojaDeVida.tsx`, y bloquear los tres campos según área. Es comodidad legítima (regla 13.3) sólo porque el
   servidor la impone y lo prueba.

## Estimación de tamaño (techo 800)

| Bloque | Líneas |
|---|---|
| Servidor: ruta, módulo de registro, esquema, tipos | 110-150 |
| Pruebas servidor (`equipos.test.ts`, `migrate.test.ts`) | 220-300 |
| `.tsx` (`HojaDeVida.tsx`, `EquiposAdmin.tsx`) | 80-120 |
| **Apply** | **410-570** |
| `verify-report.md` (precedentes 206-358) | 250-360 |
| `archive-report.md` (precedentes 110-264) + fusión del delta (se mide) | 250-450 |

- Apply solo cabe. Apply + verify en un mismo intento roza o pasa 800: si el objetivo del intento incluye
  verify, el `.tsx` va en un **segundo lote de apply**.
- El archive cuesta además el doble de la carpeta (`git mv` sin detección de renombrado, regla del ciclo 2):
  con ~1.000-1.200 líneas de artefactos, ~2.000-2.400. Supera 800 y necesita techo aprobado, como el
  precedente de `detector-citas-extremos`.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Guarda por presencia de clave en vez de por cambio bloquea a técnicos | Alta si se hace mal | Supuesto (c1) y escenario explícito |
| Tabla en esquema equivocado | Baja | Calificada + `PUBLIC_TABLES` + mutación del `.sql` |
| `.tsx` sin red de pruebas | — | Comprobaciones de persona (regla del ciclo 1) |
| Tensión (a1) con R08.2.md:2053 | Media | Anotada; Gerencia puede estrechar el alta después |
| Citas de `hojas-vida/spec.md` a `routes/equipos.ts` desfasadas por la edición | Alta | Barrido de la regla de mutación 4 en el cierre |

## Plan de vuelta atrás

Revertir el commit. La tabla nueva es aditiva (`IF NOT EXISTS`) y queda huérfana sin efecto; se retira con
un `DROP` explícito sólo si Gerencia lo pide, porque contiene auditoría.

## Criterios de aceptación (strict TDD, rojo antes que verde)

1. Usuario sin Comercial cambia fecha de factura, fin de garantía o mantenedor: `403`, nada escrito, cero
   filas de registro.
2. Mismo usuario reenvía los tres restringidos **sin cambiar** y cambia Drive: `200`, sólo Drive escrito.
3. Comercial y administrador cambian los tres: `200`.
4. Cada campo que cambia deja una fila (persona, fecha y hora, anterior, nuevo); los que no cambian, ninguna.
5. `404` < `403` < `422`, con prueba de posición.
6. La lectura de la hoja de vida devuelve el registro, más reciente primero.
7. Desactivar (`PATCH` con sólo `active`) sigue funcionando para cualquier sesión y no genera registro.
8. El guardián de esquema se pone rojo con la tabla sin calificar.

**Comprobaciones de persona** (fuera del recuento; dueño Comercial/Gerencia, en la app; archivar no las da
por hechas): botón «Editar» en la hoja de vida; campos restringidos en solo lectura sin Comercial; sección
«Cambios» visible.

## Nota sobre `toca_maestro: si`

Al terminar, el maestro R08.2 no recoge la restricción por área ni el registro de cambios del equipo (M3.1
`:2021-2053`, M11.4 `:2801-2806`). El texto ya está entregado en `docs/sdd/R08.3_Expediente_de_cambios.md:611`
(§11.4); este cambio no añade texto nuevo al expediente.
