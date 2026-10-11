# Diseño: la migración de tickets abiertos, una sola ejecución

## Enfoque técnico

No se toca código de producto. El comportamiento ya existe (`apps/desk/server/db/migracionTicketsAbiertos.ts:63-95`) y este cambio lo **caracteriza**: una prueba de integración contra PostgreSQL real, el texto del rechazo fijado en la prueba de pg-mem, el procedimiento en `DEPLOY.md` y el requisito RQ-ZS-23. Como las pruebas nacen verdes, su rojo se demuestra por mutación (D-3). Todo lo que aquí se dice del comportamiento bajo mutación es **hipótesis** hasta ejecutarlo en el apply.

## Decisiones

### D-1 · Prueba de integración `apps/desk/server/db/migracionConcurrente.integration.test.ts` (nueva)

**Molde:** `packages/zoho-sync/src/db/liberacion.integration.test.ts:22-71`. Se salta sin `TEST_DATABASE_URL` (`:22-23`); en `beforeAll` (120 s, `:65`) un `Pool` administrador crea una base propia `migracion_it_<pid>_<ms>`, otro `Pool` con `options: '-c search_path=desk,public'` monta el esquema con `CREATE SCHEMA IF NOT EXISTS books`, `reorgToDesk` y `migrate` (`:62-64`); `afterAll` la borra con `DROP DATABASE IF EXISTS … WITH (FORCE)` (`:69`).

**Comprobado:** `vitest.config.ts:17-20` incluye `apps/**/*.test.ts`, que recoge `*.integration.test.ts`. `apps/desk/server` ya importa `@ambientalia/zoho-sync/db/migrate` (`apps/desk/server/analisis.test.ts:3`) y `packages/zoho-sync/package.json:2` exporta `./*`; `reorgToDesk` y `migrate` son exportados (`packages/zoho-sync/src/db/migrate.ts:126`, `:24`). **Ningún fichero de `apps/` importa hoy `pg` directamente** (búsqueda de `from 'pg'` en `apps/`: 0): será el primero. Es resoluble —`pg` y `@types/pg` son dependencias de la raíz (`package.json:37`, `:52`) y `apps/desk/tsconfig.server.json:12` incluye `server/**/*.ts`—, pero que `npm run typecheck` lo acepte es **hipótesis** hasta correrlo. El CI da `TEST_DATABASE_URL` (`.github/workflows/ci.yml:47`) sobre `postgres:17` (`.github/workflows/ci.yml:12`).

**Envoltorio (sin tocar el ejecutor).** `enTransaccion` abre su transacción con `connect` (`apps/desk/server/db/transaccion.ts:13-28`), así que a `migrarTicketsAbiertos` se le pasa un objeto que envuelve el `Pool` real:

```ts
type Ganchos = { antes?: (sql: string) => Promise<void> | void; despues?: (sql: string) => Promise<void> | void }
const envolver = (pool: Pool, g: Ganchos): Queryable => {
  const con = (q: (s: string, p?: unknown[]) => Promise<{ rows: any[] }>) => async (s: string, p?: unknown[]) => { await g.antes?.(s); const r = await q(s, p); await g.despues?.(s); return r }
  return { query: con((s, p) => pool.query(s, p)),
    connect: async () => { const c = await pool.connect(); return { query: con((s, p) => c.query(s, p)), release: () => c.release() } } } as unknown as Queryable
}
```

Los ganchos van en **las dos vías** (`query` y `connect`) a propósito: bajo la mutación M3 el ejecutor ya no llama a `connect`, y la prueba debe fallar con un mensaje, no colgarse.

| Opción | Coste | Decisión |
|---|---|---|
| Solape forzado con ganchos y sondeo de `pg_stat_activity` | Algo más de código de prueba | **Elegida:** determinista; medido por el orquestador con PostgreSQL 17.5 |
| Sólo carrera libre | Mínimo | Rechazada como única prueba: no puede exigir el rechazo (ver caso 2) |
| Espera fija (`setTimeout`) antes de soltar A | Mínimo | Rechazada: inestable en el CI y lenta |
| Punto de pausa dentro del ejecutor | Toca producto | Rechazada: fuera del alcance |

**Caso 1 · solape forzado** (plazo 60 s). Tres tickets insertados como en `apps/desk/server/db/migracionTicketsAbiertos.test.ts:20-26`: estado «Entregado», `managed_by_app = false`, `created_time` anterior al corte. Secuencia:

    A (actor «Actor A»): BEGIN · lee · INSERT marcador · UPDATE tickets ──[gancho `despues`: avisa y se detiene]
    B (actor «Actor B»): BEGIN · lee · INSERT marcador · [gancho `antes`: avisa] UPDATE tickets ──(espera el bloqueo de fila)
    prueba: sondea `SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'` cada 50 ms, máximo 10 s
    prueba: suelta A (en `finally`, pase lo que pase) → A: COMMIT · B: 0 filas → `throw` → ROLLBACK

Toda espera es acotada y falla con texto propio («ninguna sesión quedó esperando un bloqueo»). La promesa de B se convierte a resultado nada más lanzarla, para que su rechazo no quede sin manejar. **Aserciones:** A cumple con `aplicado: true` y `migrables: 3`; B se rechaza con «pasó a estar gobernado» (`apps/desk/server/db/migracionTicketsAbiertos.ts:90`); exactamente un marcador por ticket con `transition_id = ID_TRANSICION_MIGRACION` (`packages/shared/src/migracionTickets.ts:14`); el `ejecutado_por` de los `values` (`apps/desk/server/db/migracionTicketsAbiertos.ts:75`) es «Actor A» en todos y «Actor B» en ninguno; los tres tickets con `managed_by_app = true`.

**Caso 2 · carrera libre, 10 rondas** (plazo 120 s). Cada ronda inserta 4 tickets nuevos (ids y números propios, por debajo de `APP_TICKET_NUMBER_BASE`, `packages/zoho-sync/src/db/migrate.ts:43`) y lanza dos ejecuciones con `Promise.allSettled` sobre el `Pool` sin envolver. **Aserción tolerante:** vale «una cumple y la otra se rechaza con el texto de la línea 90» o «las dos cumplen, una con `migrables: 4` y la otra con `migrables: 0`»; cualquier otro rechazo es rojo. **Siempre:** un marcador por ticket de la ronda, todos con el mismo `ejecutado_por`, los cuatro gobernados. *Por qué no puede exigir el rechazo:* la lectura es una sola sentencia (`apps/desk/server/db/migracionTicketsAbiertos.ts:32-34`); si la segunda la lanza después del `COMMIT` de la primera, ve los tickets ya gobernados, no elige ninguno y termina sin escribir. Eso es una ejecución **posterior**, legítima, no una simultánea. No hay interbloqueo posible: las dos recorren los tickets en el mismo orden (`ORDER BY number`, línea 33 del ejecutor).

**Caso 3 · ejecución posterior** (plazo 30 s). Tickets propios, una ejecución confirmada y después otra con actor distinto: no se rechaza, devuelve `migrables: 0`, no añade marcadores y ninguno lleva al segundo actor. El informe sale con `aplicado: true` aunque no escriba (`apps/desk/server/db/migracionTicketsAbiertos.ts:92`): se fija tal cual, es el comportamiento de hoy. Los tres casos comparten base; cada uno filtra sus aserciones por sus propios ids.

### D-2 · El texto del rechazo en pg-mem

`apps/desk/server/db/migracionTicketsAbiertos.test.ts:174` pasa de `rejects.toThrow()` a `rejects.toThrow('pasó a estar gobernado')`, dentro de la línea. El fichero conserva sus 187 líneas. Alternativa rechazada: una prueba nueva al final (duplica `apps/desk/server/db/migracionTicketsAbiertos.test.ts:168-177` sin cobertura añadida).

### D-3 · Mutaciones (se ejecutan en el apply; se restaura siempre; se anota prueba a prueba)

| Mutación | pg-mem — HIPÓTESIS | Integración — HIPÓTESIS |
|---|---|---|
| **M1** quitar el `throw` (`apps/desk/server/db/migracionTicketsAbiertos.ts:90`) | Roja la prueba de la línea 168 (ya no rechaza) | Caso 1 rojo: B cumple y confirma sus marcadores (dos por ticket). Caso 2 rojo sólo en las rondas que solapen. Caso 3 verde |
| **M2** quitar `AND managed_by_app = false` (`apps/desk/server/db/migracionTicketsAbiertos.ts:87`) | Roja la de la línea 168: el `UPDATE` devuelve fila | Caso 1 rojo: tras el `COMMIT` de A, el `UPDATE` de B vuelve a evaluar `WHERE id = $1`, casa y B confirma. Caso 3 verde |
| **M3** sin `enTransaccion` (`apps/desk/server/db/migracionTicketsAbiertos.ts:68`) | Rojas las que exigen `BEGIN`/`COMMIT`/`ROLLBACK` (líneas 64, 168 y 179 del fichero de pg-mem) | Caso 1 rojo por el sondeo agotado: el `UPDATE` de A queda confirmado solo, B ya no lo elige y nadie espera un bloqueo. Caso 2: incierto. Caso 3 verde |

El caso 3 no caza ninguna de las tres y se dice: fija la frontera «posterior», no el rechazo. La integración sólo corre con `TEST_DATABASE_URL`; el orquestador dispone de un PostgreSQL 17 local. Si una hipótesis no se cumple, se anota el resultado real y no se retoca la prueba para forzarlo sin decirlo.

### D-4 · `DEPLOY.md`

**Sección nueva al final.** El fichero acaba en `DEPLOY.md:661` («Para volver atrás…»). Se añaden una línea en blanco y el título `## 14. Migración de tickets abiertos: quién la ejecuta y en qué orden (F1F-01)`, que sigue la numeración de `DEPLOY.md:363` y `DEPLOY.md:418`. Queda después de las secciones sin número de «Comprobación de lectura» (`DEPLOY.md:472-661`); es el precio de no desplazar líneas.

**Puntero, sin cambiar el número de líneas:** `DEPLOY.md:356` pasa de «redespliegue en cada cambio. La línea que hay que añadir…» a «redespliegue en cada cambio; quién lo hace y en qué orden, en la §14. La línea que hay que añadir al fichero de ejemplo de entorno, tal cual:».

**Contenido, en este orden:**

1. **Quién.** Gerencia abre el interruptor y lanza la ejecución. Suplente: **POR NOMBRAR** (literal).
2. **Requisitos previos.** Sesión de administrador (`apps/desk/server/routes/admin.ts:222`); la sincronización completa previa es **E-208, sin respuesta** (`docs/sdd/ENTRADA.md:2047`): se nombra como pendiente, sin decir quién la lanza; una pasada en seco —la misma llamada sin `aplicar`— con `negativa: null` y `numeracion.arrastra: false`.
3. **Los cinco pasos.** (1) Copia previa: el botón de copia de EasyPanel de `desk-db`, con el nombre de base `desk` (`docs/sdd/Paquete_de_Despliegue_2026-10-10b.md:224-225`). (2) Abrir el interruptor: `MIGRACION_TICKETS_HABILITADA=true` y redespliegue (`DEPLOY.md:355-356`). (3) **Una sola** ejecución: `POST /api/admin/migrar-tickets-abiertos?corte=<ISO con desfase>&aplicar=true` (`apps/desk/server/routes/admin.ts:222-232`), desde la consola del navegador con `fetch`, como la copia de `DEPLOY.md:406-407`. (4) Comprobar: el informe devuelto con `aplicado: true`, y después una pasada en seco **con el mismo `corte`** que dé `migrables: 0`. (5) Cerrar: quitar el valor y redesplegar.
4. **Qué ve quien lance una segunda ejecución a la vez.** No escribe nada. Por lectura de `apps/desk/server/app.ts:90-92` —**no medido por HTTP**— recibe `500` «Error interno»; el mensaje real sólo queda en el registro del servidor. No es un fallo de la migración: se comprueba con el paso 4. Con una negativa la respuesta es `409` con el informe y sin escribir (`apps/desk/server/routes/admin.ts:231`).
5. **Qué NO hace este procedimiento.** No lanza la sincronización previa, no revierte (RQ-ZS-18), no nombra al suplente y no sustituye al cotejo de la hoja de Google.

**«`migrables: 0`» verificado:** `migrables` cuenta los planes con acción `migrar` (`packages/shared/src/migracionTickets.ts:103-104`), y un ticket gobernado pasa a `ya-gobernado` antes de cualquier otra regla (`packages/shared/src/migracionTickets.ts:64`). Tras una ejecución confirmada, la pasada en seco da 0 **con el mismo corte**; con un corte posterior podrían entrar tickets creados entre los dos, y por eso el procedimiento lo exige igual.

### D-5 · Delta de especificación

RQ-ZS-23 se fusiona **al final** de `openspec/specs/zoho-sync/spec.md`, detrás de RQ-ZS-22 (`openspec/specs/zoho-sync/spec.md:1275`), sin tocar nada anterior. No se crea capacidad: R-2 no aplica.

### D-6 · Reglas

- **Regla de mutación 3 (regla invariable 13).** Decisiones del cliente: **ninguna**. Buscar `migrar-tickets-abiertos` en `apps/desk` sólo da `apps/desk/server/routes/admin.ts:222` y `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:10` y `:15`; `apps/desk/src` no llama a la ruta. El rechazo lo impone el servidor (`apps/desk/server/db/migracionTicketsAbiertos.ts:84-90`).
- **Regla de mutación 1.** No aplica: no se añade ni se mueve ninguna guarda.
- **Regla de mutación 4.** Ningún fichero existente desplaza líneas: `apps/desk/server/db/migracionTicketsAbiertos.test.ts` conserva 187; `DEPLOY.md` y la especificación crecen **sólo por el final**. Comprobado por búsqueda en el worktree: las citas a `DEPLOY.md` dentro del §11 apuntan a las líneas 345, 350, 358 y 359, ninguna a la 356, que además no cambia lo que afirma; las citas a líneas del fichero de pg-mem (54, 55, 64, 68, 73, 91, 92, 96, 165, 168 y 174, en cambios archivados) siguen en su sitio. Nada que barrer; el apply lo vuelve a medir al cerrar.

## Cambios por fichero y estimación

| Fichero | Acción | Líneas (estimadas) |
|---|---|---|
| `apps/desk/server/db/migracionConcurrente.integration.test.ts` | Crear | ~160 |
| `apps/desk/server/db/migracionTicketsAbiertos.test.ts` | Modificar la línea 174 | 1 inserción + 1 borrado |
| `DEPLOY.md` | Modificar la línea 356; añadir la §14 al final | 1 + 1, y ~42 nuevas |
| `openspec/changes/migracion-una-sola-ejecucion/specs/zoho-sync/spec.md` | Crear (fase de especificación) | ~40 |
| `openspec/specs/zoho-sync/spec.md` | Añadir al final, al archivar | ~40 |

Apply: unas **206** líneas contra el techo de 800. No se parte.

## Estrategia de pruebas

| Capa | Qué | Cómo |
|---|---|---|
| Unitaria (pg-mem) | Texto del rechazo y `ROLLBACK` | Línea 174 con texto; espía de SQL ya existente |
| Integración | Solape forzado, carrera libre, ejecución posterior | PostgreSQL real, base propia, ganchos y sondeo |
| HTTP | El `500` de la perdedora | **Fuera:** se documenta como lectura de código, no se mide |

## Matriz de amenazas

N/A — no hay enrutado, shell, subprocesos, automatización de VCS ni integración de procesos: la prueba sólo abre conexiones `pg`.

**Migración y despliegue:** ninguna. No cambian ni el esquema ni el código que se despliega.

## Preguntas abiertas

- [ ] ¿Acepta `npm run typecheck` el primer `import { Pool } from 'pg'` bajo `apps/desk/server`? Hipótesis: sí. Se comprueba en la primera tarea del apply; si no, el `Pool` se crea con `createPoolFromUrl` (`packages/zoho-sync/src/db/pool.ts:9-11`), que no fija `search_path`, y habría que fijarlo por la URL.
- [ ] El rechazo descansa en el aislamiento por defecto de PostgreSQL (READ COMMITTED); la prueba lo fija, no lo configura.
- [ ] De Gerencia, no de esta tanda: nombrar al suplente, responder E-208 y decidir si la perdedora debe recibir un `409`.
