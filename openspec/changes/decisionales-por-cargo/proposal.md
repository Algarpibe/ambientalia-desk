---
tanda: F1C-05
motivo: ""
capacidad: [permissions]
maestro: ["M1.9", "Anexo D nº 39"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `decisionales-por-cargo`

## 1. Qué fila atiende

F1C-05, «C10 permisos por cargo» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:103`). La fila dice que los
Decisionales van «después» del corte; `decision/f1c05-decisionales-por-cargo` (18/10) manda construirlos ahora **detrás de
un interruptor que nace apagado** y que no se enciende antes del 14/12. **`cierra: no`:** el propietario del registro sigue
aplazado (consecuencia 5 de `decision/c10-permisos-cargo`, `openspec/config.yaml:1942`). **`toca_maestro: no`:** con el
interruptor apagado nada cambia, y el texto del maestro se actualiza cuando se encienda (tarea de persona, §10).

## 2. La letra que manda

- `decision/c10-permisos-cargo` (`openspec/config.yaml:1927-1947`): «las transiciones que F1C-04 clasifique como
  Decisionales sólo las ejecuta el Director o el Coordinador del área correspondiente; las demás, cualquiera del área»
  (`:1935`), y la lista corta ya decidida, con «Liberación sin factura → Director Comercial» (`:1934`).
- `decision/f1c04-tabla-tipos-validada`: 14 Decisionales.
- `decision/f1c05-decisionales-por-cargo` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`): con el Coordinador
  Técnico vacante, Director Técnico y Especialista técnico; en Comercial, Director y Coordinadora; mixtas por el área del
  estado de origen, con `rechazo_garantia` en Comercial como excepción (Compras no tiene Director ni Coordinador,
  `packages/shared/src/cargos.ts:12-15`); el interruptor nace cerrado.

## 3. Medición, sobre `7ff08c8`

**Cómo se impone hoy el cargo.**
- La lista corta es dato: `EXCEPCIONES_POR_CARGO` (`packages/shared/src/cargos.ts:27-35`), con una sola transición,
  `liberacion_sin_factura → Director Comercial` (`:32`).
- `cargoQueFaltaParaTransicion` (`cargos.ts:45-53`) devuelve el cargo exigido y no tenido; el administrador pasa (`:49`) y un
  cargo fuera de la lista cuenta como «sin cargo» (`cargoEfectivo`, `:40-42`).
- El servidor lo impone en `executeTransition`: `409` de estado (`apps/desk/server/services/ticketService.ts:126-128`),
  `403` de área (`:129-130`) y `403` de cargo en la línea siguiente (`:131`), antes de la prioridad, la OVI, la verificación y
  todo `422` (el primero, el de derivación, en `:141`). RQ-PM-18 fija ese orden (`openspec/specs/permissions/spec.md:434-462`).
- El cargo viaja en la sesión: `USER_SELECT` lee `cargo_permiso` (`apps/desk/server/auth/users.ts:14-16`) y `rowToPublicUser`
  lo deja en `cargoPermiso` (`:30`); `GET /api/auth/me` devuelve `req.user` tal cual (`apps/desk/server/auth/routes.ts:36`).
- El cliente filtra los botones con la misma compuesta: `puedeEjecutarTransicion(user, t)`
  (`apps/desk/src/components/TransitionPanel.tsx:56-58`; `cargos.ts:56-58`). Es comodidad probada (RQ-PM-17).

**Administrador y usuario sin cargo.** El administrador pasa el área (`packages/shared/src/permissions.ts:5`) y las
excepciones de cargo (`cargos.ts:49`; RQ-PM-19). Un usuario sin cargo no ejecuta ninguna excepción (RQ-PM-22,
`openspec/specs/permissions/spec.md:531-539`: «estricto mientras nadie tenga cargo», sin respaldo al área).

**Las 14 Decisionales** (`tipoEvento: 'Decisional'`, contadas desde `CATALOGO_POR_FLUJO`; ningún paso del servidor lo es):

| # | Transición | Origen → destino | `area` del catálogo | Área de la decisión | Quién la ejecuta con el interruptor encendido |
|---|---|---|---|---|---|
| 1 | `escalado_a_revision` (`transitions.ts:192`) | Rev./Diagnostico → Notificado | Servicio Técnico | Servicio Técnico | Director Técnico, Coordinador Técnico; Especialista técnico si el Coordinador está vacante |
| 2 | `devolucion_a_correccion` (`:194`) | Notificado → Rev./Diagnostico | Servicio Técnico | Servicio Técnico | ídem |
| 3 | `aprobacion` (`:202`) | Notificación cliente → En Proceso | Comercial | Comercial | Director Comercial, Coordinador Comercial |
| 4 | `rechazo_garantia` (`:214`) | Notificación a Compras → Notificación Comercial | Comercial / Compras | **Comercial (excepción)** | Director Comercial, Coordinador Comercial |
| 5 | `rechazo_comercial` (`:234`) | Notificación Comercial → Por Facturar | Comercial / Servicio Técnico | Comercial (origen, `R08.4.md:4531`) | Director Comercial, Coordinador Comercial |
| 6 | `rechazo_cliente` (`:236`) | Notificación cliente → Por Facturar | Comercial | Comercial | Director Comercial, Coordinador Comercial |
| 7 | `rechazo_revision` (`:238`) | Rev./Diagnostico → Por Facturar | Comercial / Servicio Técnico | Servicio Técnico (origen, `R08.4.md:4534`) | como la 1 |
| 8 | `liberacion_sin_factura` (`:246`) | Por Facturar → Por Entregar / Sin facturar | Comercial | — | **Director Comercial** (lista corta, más estricta; no cambia) |
| 9 | `anulacion` (`:262`) | cinco esperas y notificaciones → Anulado | Comercial | Comercial | Director Comercial, Coordinador Comercial |
| 10 | `producto_no_conforme` (`:353`) | En Proceso → Notificado | Servicio Técnico | Servicio Técnico | como la 1 |
| 11 | `liberacion` (`:359`) | En Proceso, Verificación → Finalizado | Servicio Técnico | Servicio Técnico | como la 1 |
| 12 | `rechazo_verificacion` (`:361`) | Verificación → Notificado | Servicio Técnico | Servicio Técnico | como la 1 |
| 13 | `anulacion_equipo_nuevo` (`:362`) | Ingresado, En Proceso, Notificado, Verificación → Anulado | Comercial | Comercial | Director Comercial, Coordinador Comercial |
| 14 | `anulacion_soporte` (`:396`) | En Proceso, Pendiente → Anulado | Comercial | Comercial | Director Comercial, Coordinador Comercial |

Seis técnicas, siete comerciales con la regla nueva y una de la lista corta. El cargo **no amplía**: el área de la transición
se sigue exigiendo antes (`canExecuteTransition`), así que en las mixtas la regla nueva sólo estrecha.

**Interruptores.** Nacen cerrados con `=== 'true'` en `loadConfig` (`packages/zoho-sync/src/config.ts:123`, el último,
`MIGRACION_TICKETS_HABILITADA`, E-231), con su prueba de literales (`packages/zoho-sync/src/config.test.ts:32-36`) y una
sección de `DEPLOY.md` con «qué enciende» y «qué se rompe si se pone mal» (`DEPLOY.md:345-361`). `.env.example` **queda
fuera del alcance de lectura de toda sesión** (`DEPLOY.md:335-336`): la línea que hay que añadirle va escrita en `DEPLOY.md`,
como en el precedente (`DEPLOY.md:358-361`). Hoy el cliente **no conoce ningún interruptor**: no hay ruta que los exponga.

**Coordinador Técnico vacante.** Ya existe la consulta de usuarios activos por cargo de permiso,
`destinatariosDeCargoPermiso` (`apps/desk/server/db/avisos.ts:121-127`); se reutiliza (regla 13, punto 1).

## 4. Qué se construye

1. **Regla pura** (`packages/shared/src/decisionales.ts`, nuevo; `cargos.ts` no se toca): quién ejecuta una Decisional. Área
   de la decisión = la de la tabla de mixtas (`rechazo_revision` → Servicio Técnico; `rechazo_comercial` y
   `rechazo_garantia` → Comercial) o, si no está, el `area` del catálogo cuando es Comercial o Servicio Técnico. Servicio
   Técnico: Director Técnico y Coordinador Técnico, más Especialista técnico **mientras ningún usuario activo lleve el cargo
   Coordinador Técnico**. Comercial: Director Comercial y Coordinador Comercial. Las de la lista corta conservan la suya. El
   administrador pasa. Apagado, la regla no restringe nada.
2. **Servidor:** el `403` nuevo, escalón B, en la misma línea del `403` de cargo de hoy (`ticketService.ts:131`), detrás de
   él, **sólo con el interruptor encendido**; apagado no lanza ni una consulta más.
3. **Interruptor `DECISIONALES_POR_CARGO`**, `=== 'true'`, en `AppConfig`, con su sección de `DEPLOY.md` (qué enciende, qué
   se rompe, no antes del 14/12, asignar los cargos antes de encender) y la línea para `.env.example`.
4. **Cliente:** `GET /api/permisos/decisionales` devuelve `{ activo, coordinadorTecnicoVacante }`; `TransitionPanel` filtra
   con la misma regla compartida y ese contexto. Si la llamada falla, el panel se queda en «apagado» y el servidor decide.

## 5. Fuera de alcance

El propietario del registro (consecuencia 5 de c10). Encender el interruptor. Asignar `cargo_permiso` en producción. Cambiar
la lista corta, la OVI de garantía o el Top 5. Reordenar el resto de guardas de `executeTransition`.

## 6. Regla 13 — decisiones del cliente (regla de mutación 3)

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Ocultar una Decisional a quien no tiene el cargo (interruptor encendido) | El `403` nuevo en `ticketService.ts:131` (a fijar en el lote 2 y citar en el informe) |
| Saber si el interruptor está encendido | Lo dice el servidor: `GET /api/permisos/decisionales`, que lee el mismo `AppConfig` que la guarda |
| Saber si el Coordinador Técnico está vacante | La misma consulta que usa la guarda (`destinatariosDeCargoPermiso`) |
| Ocultar `liberacion_sin_factura` a quien no es Director Comercial | Sin cambio: `ticketService.ts:131` (RQ-PM-17) |

## 7. Mutaciones previstas

M1 interruptor encendido por defecto o con un valor distinto de `'true'`; M2 apagado, un Técnico rechazado en una
Decisional; M3 encendido, un Técnico pasa; M4 el Especialista pasa con un Coordinador Técnico activo, o es rechazado sin él;
M5 `rechazo_revision` tratada como Comercial, o `rechazo_garantia` como Compras; M6 `liberacion_sin_factura` pierde su
restricción más estricta; M7 posición del `403` nuevo delante del `409` de estado, delante del `403` de área y delante del
`403` de cargo existente (regla de mutación 1, orden de F1B-10); M8 delante del `422`.

## 8. Intentos (techo 800, válvula 720)

| # | Unidad | Estimación ×1,8 |
|---|---|---|
| 1 | planificación 1: esta propuesta y la delta de `permissions` | ~380 |
| 2 | planificación 2: diseño y tareas | ~300 |
| 3 | lote 1: regla pura, interruptor y sus pruebas | ~470 |
| 4 | lote 2: guarda del servidor, ruta, cliente, `DEPLOY.md` y pruebas | ~650 |
| 5 | verify | ~250 |
| 6 | archive (revisable: fusión de la delta e informe) | ~350 |

Si el lote 2 pasa de 720 al estimarlo en tareas, se parte en servidor y cliente-documentación.

## 9. Supuestos reversibles (para la lista semanal)

- **S-1** «Mientras esté vacante» se lee como «ningún usuario **activo** con `cargo_permiso` = Coordinador Técnico»: al
  nombrarlo, el Especialista deja de poder sin tocar código.
- **S-2** El administrador pasa las Decisionales, como pasa las demás excepciones (RQ-PM-19).
- **S-3** Un usuario sin cargo no ejecuta ninguna Decisional con el interruptor encendido, sin respaldo al área (como RQ-PM-22).
- **S-4** El Coordinador Técnico, si se nombra, ejecuta las Decisionales técnicas (regla de c10, «el Director o el Coordinador»).
- **S-5** El interruptor se llama `DECISIONALES_POR_CARGO` y vive en `AppConfig`.
- **S-6** Una Decisional futura de área mixta sin entrada en la tabla falla cerrada (sólo el administrador) y la prueba de la
  tabla se pone roja.

## 10. Tareas de persona (no se cuentan como tareas; regla del ciclo 1)

| Tarea | Dueño | Destino |
|---|---|---|
| Asignar `cargo_permiso` (Director Técnico, Especialista técnico, Director Comercial, Coordinador Comercial) antes de encender | Administrador de la aplicación | Antes de enero |
| Añadir la línea de `DECISIONALES_POR_CARGO` a `.env.example` | Persona con acceso al fichero | Con el despliegue |
| Encender el interruptor, no antes del 14/12 | Persona con acceso a producción, por orden de Gerencia | Enero |
| Actualizar M1.9 del maestro al encender | Supervisión → Gerencia | Expediente siguiente |
| Revisar S-1 a S-6 | Gerencia, lista semanal | Una semana |

## 11. Riesgos

- Encendido sin cargos asignados, sólo los administradores ejecutan Decisionales: lo dice `DEPLOY.md`.
- Una consulta más por transición con el interruptor encendido; ninguna apagado.
- `ticketService.ts:131` es muy citado: la guarda nueva entra en esa misma línea, sin desplazar ninguna.

## Plan de vuelta atrás

Apagar el interruptor (quitar la variable y redesplegar) devuelve el comportamiento de hoy sin tocar código ni datos.

## Criterios de éxito

Apagado, la suite de hoy sigue verde sin cambiar una prueba y las mutaciones M2 y M1 la ponen roja; encendido, la tabla del
§3 se cumple contra el servidor y M3 a M8 la ponen roja.
