# Diseño: parche IV-11 — la OV elegida en la aplicación no la pisa el sincronizador

## Enfoque técnico

Una marca por fila (`ov_elegida_en_app_at`) que ponen los tres escritores de la aplicación. `upsertTicket` detecta la marca con su lectura previa, omite las dos columnas del `SET` y DEVUELVE un descriptor de discrepancia. `createSync` lo entrega a una devolución opcional que sólo cablea la aplicación; un servicio de la aplicación hace la deduplicación y crea el aviso **en una sola transacción**. Objetivo de desplazamiento: **cero líneas** en `repo.ts`, `remision.ts` y `sync.ts` (edición en su sitio y código nuevo al final del fichero, precedente `sync.ts:328-332`).

## Decisiones

| # | Tema | Elección | Descartado y por qué |
|---|---|---|---|
| D1 | Marca y anti-ruido | `ov_elegida_en_app_at timestamptz` y `ov_zoho_avisada text`, nullable, FUERA de `TICKET_COLS` (`repo.ts:44-54`). Dos `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS` sin calificar, al final de `schema.sql` (tras `:509`), sin punto y coma en el comentario (`:445-447`) | Calificar con `desk.`: lo rompe en pruebas (`schema.sql:441-443`) |
| D2 | Protección en `upsertTicket` | Ampliar la lectura previa de `:58` (`managed_by_app, ov_elegida_en_app_at, orden_venta, ov_zoho_avisada`) y filtrar en JS las dos columnas de `updates` (`:62`) si hay marca. El salto de `:59` se conserva y va PRIMERO | `CASE`/`COALESCE` en `DO UPDATE`: pg-mem ya obliga a la lectura previa (`:57`) y es terreno no medido |
| D3 | Detección | Hay discrepancia si: marca no nula, Zoho no vacío tras `trim` (S-2), Zoho ≠ valor de la app y Zoho ≠ `ov_zoho_avisada`. `upsertTicket` pasa a devolver `DiscrepanciaOV \| null`; el salto de `:59` devuelve `null` | Escribir `ov_zoho_avisada` en el paquete: separaría la marca anti-ruido del aviso en dos transacciones |
| D4 | Atomicidad | Servicio `avisarDiscrepanciaOV(db, d)`: `BEGIN`; `UPDATE tickets SET ov_zoho_avisada=$2 WHERE id=$1 AND ov_elegida_en_app_at IS NOT NULL AND COALESCE(orden_venta,'')<>$2 AND COALESCE(ov_zoho_avisada,'')<>$2 RETURNING number, orden_venta`; 0 filas → nada; si no, `crearAviso` por destinatario; `COMMIT`. Error → `ROLLBACK`, log, nunca lanza. Patrón de `repo.ts:299-314` | Aviso fuera de transacción (`ticketService.ts:157-164`): aquí sí se puede atar, porque `avisos` y `tickets` están en la misma base y el servicio es de la app |
| D5 | Cableado | `interface Deps extends AvisoOVDeps` en `sync.ts:9` (en su sitio), campo `alDiscrepanciaOV?` definido al final; `:62` lo desestructura; `:119` invoca `.catch(() => {})` sobre la devolución. Sólo `apps/desk/server/index.ts:20` la pasa; `apps/hub-sync/src/hub-sync.ts:21` no | Emitir desde el paquete: ata `avisos` a la sincronización |
| D6 | Escritores | Alta: `repo.ts:385-387`, columna nueva y parámetro `$18` = fecha si `ordenVenta` no vacío. Transición: `repo.ts:274`, `sets.push('ov_elegida_en_app_at=now()')` sólo si `col === 'orden_venta'` y valor no vacío. Remisión: `remision.ts:236`, `ov_elegida_en_app_at = now()` en el mismo `SET` (sólo escribe si el `WHERE` de `:237` casa) | Marcar siempre: protegería un vacío y bloquearía a Zoho |
| D7 | Aviso | Área `Comercial`, `destinatariosDeArea(q, 'Comercial', '')` (`avisos.ts:74-93`, incluye administradores), `ticketId` del ticket, `enviado_at` NULL. Texto: «Zoho trae la orden de venta {Z} para el ticket #{N}, pero la aplicación tiene {A}. Se conserva la de la aplicación: revise cuál es la correcta.» Clave de deduplicación: (ticket, valor Zoho) vía `ov_zoho_avisada` | Tabla de deduplicación aparte: una columna basta |

**Supuestos nuevos (reversibles):** S-4 `ov_zoho_avisada` no se limpia cuando Zoho converge; A→B→A→B avisa una sola vez. S-5 sin destinatarios, la marca anti-ruido se escribe igual. S-6 la lectura previa usa columnas explícitas; `hubBootstrap` corre `migrate` antes del sync (`apps/hub-sync/src/hubSync.ts:13`).

**Corrección a la propuesta:** el cableado no está en `index.ts:81-90` (el `setInterval`), sino en la construcción, `index.ts:20`.

## Flujo

    remisión/alta/transición ──marca──> tickets.ov_elegida_en_app_at
    Zoho ──> persistTicket ──> upsertTicket ──(lectura previa)──> DiscrepanciaOV | null
                                     │ omite orden_venta/fecha_orden_venta si hay marca
                                     └──> alDiscrepanciaOV? ──> avisarDiscrepanciaOV
                                            [BEGIN · UPDATE…RETURNING · crearAviso×N · COMMIT]

## Ficheros

| Fichero | Acción | Desplazamiento |
|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` | 2 `ALTER` + comentario al final | 0 en citas |
| `packages/zoho-sync/src/db/repo.ts` | `:58`, `:59`, `:62`, `:67`, `:274`, `:385-387` en su sitio; tipo y ayudantes al final | 0 |
| `packages/zoho-sync/src/sync.ts` | `:9`, `:62`, `:119` en su sitio; interfaz al final | 0 |
| `apps/desk/server/routes/remision.ts` | `:236` y comentario `:226` en su sitio | 0 |
| `apps/desk/server/index.ts` | +1 importación, `:20` | +1 (barrer) |
| `apps/desk/server/services/avisoDiscrepanciaOV.ts` | Nuevo | — |

## Contrato

```ts
export interface DiscrepanciaOV { ticketId: string; numero: number | null; ovApp: string; ovZoho: string }
export interface AvisoOVDeps { alDiscrepanciaOV?: (d: DiscrepanciaOV) => Promise<unknown> }
```

## Pruebas (strict TDD, pg-mem vía `migrate`)

| Fichero | Casos |
|---|---|
| `repo.test.ts` (al final) | marca + OV distinta: las dos columnas intactas, `subject` cambia, devuelve descriptor; sin marca manda Zoho; `managed_by_app` + marca → `null`; Zoho vacío → `null`; Zoho = avisada → `null`; Zoho = app → `null`; alta y transición marcan sólo con OV no vacía; las dos columnas no están en `TICKET_COLS` |
| `sync.test.ts` | la devolución recibe el descriptor una vez; sin devolución no falla; si lanza, el ticket cuenta como persistido |
| `services/avisoDiscrepanciaOV.test.ts` | un aviso por destinatario; segunda llamada igual → 0; valor nuevo → otra tanda; fallo en `INSERT INTO avisos` → `ov_zoho_avisada` intacta y la siguiente llamada avisa |
| `remisiones.test.ts` | la remisión con OV marca; con OV ya puesta no marca |
| `migrate.test.ts:369-373` | 37→39 ALTER, sin calificar 18→20 (rojo previo) |
| `ovDiscrepanciaSync.test.ts` (nuevo) | extremo a extremo: remisión → pasada → 1 aviso → pasada igual → 0 → valor nuevo → 1 |

**Mutaciones:** (R1 posición) llevar el salto de `:59` detrás de la detección → rojo el caso `managed_by_app`. (R2 dato vigilado) meter `ov_elegida_en_app_at` en `TICKET_COLS` → rojo prueba de pertenencia y la de dos pasadas; escribir `ALTER TABLE desk.tickets …` en `schema.sql` → rojo el guardián. Además: quitar la marca del `UPDATE` de remisión; quitar el filtro de `updates`; quitar `<>$2` del anti-ruido; sacar `crearAviso` de la transacción; marcar siempre en `writeTransition`; quitar la comprobación de Zoho vacío. Cada una debe poner algo rojo.

## Regla 13

| Decisión en cliente | Línea del servidor |
|---|---|
| OV en gris en la remisión | `remision.ts:237` (`WHERE … COALESCE(orden_venta,'') = ''`) |
| Ninguna decisión nueva | — |

## Tamaño

Código ~130 + pruebas ~340 ≈ **470** (`--no-renames`, las ediciones en su sitio cuentan doble). **Un apply ≤ 800.**

## Barrido de cierre (regla de mutación 4)

Citas cuyo CONTENIDO cambia aunque la línea no se mueva: `repo.ts:58-59`, `:62`, `:67`, `:274`, `:385-387`; `remision.ts:226`, `:236-237`; `sync.ts:9`, `:62`, `:119`; `schema.sql` (final); `migrate.test.ts:369-373`; y todas las `apps/desk/server/index.ts:` (se desplazan +1).

## Matriz de amenazas

N/A — sin rutas, shell, subprocesos, VCS ni integración de procesos.

## Despliegue

Sin relleno de datos. `migrate` al arrancar, primero `desk`, después hub (`DEPLOY.md:50-51`). `tickets` no se replica (`DEPLOY.md:42`).

## Preguntas abiertas

Ninguna bloqueante.
