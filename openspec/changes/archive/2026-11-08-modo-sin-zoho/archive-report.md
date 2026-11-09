# Informe de archivo — `modo-sin-zoho` (1G-04, `cierra: si`)

**Archivado:** 2026-11-08, en el worktree `modo-sin-zoho` (rama del mismo nombre, partida `e3360dc4`). **Veredicto de verify:** PASS con avisos
(`verify-report.md`: 36 de 36 escenarios, 16 mutaciones reproducidas, 0 CRITICAL, 4 WARNING, 5 SUGGESTION). **Fusión:** RQ-ZS-40 a RQ-ZS-47, sólo
ADDED, al **final** de `openspec/specs/zoho-sync/spec.md`, por script y con identidad bloque a bloque; ninguna línea viva se mueve.

**R-1, en una línea:** cubre el interruptor `MODO_SIN_ZOHO_DESK` que corta en la puerta (`zohoFetch`, antes del token) toda salida a Zoho Desk de la
App y del worker, con registro de cortes y rechazos, `GET` de superadministrador, barrido del repositorio y `DEPLOY.md` §24; deja fuera la semana en
producción (P-3, de persona), los flujos de n8n (S-c) y la baja de las credenciales de Desk (S-g, paso 5 del corte).

## 1 · Qué queda construido
| Pieza | Dónde | Requisito |
|---|---|---|
| Campo `modoSinZohoDesk`, sólo con el literal `'true'` | `packages/zoho-sync/src/config.ts:66`, `:125` | RQ-ZS-40 |
| Corte en la puerta, antes de `getAccessToken`, que cuenta y después lanza `ErrorModoSinZohoDesk` | `packages/zoho-sync/src/zohoClient.ts:29`; `packages/zoho-sync/src/modoSinZoho.ts:109-122` | RQ-ZS-41 |
| Registro en memoria: cortes por recurso y llamador, rechazos por ruta, una línea de log por origen nuevo | `packages/zoho-sync/src/modoSinZoho.ts:96-146`; `apps/desk/server/index.ts:20`; `apps/hub-sync/src/hub-sync.ts:20` | RQ-ZS-42 |
| `GET /api/admin/modo-sin-zoho-desk` | `apps/desk/server/routes/modoSinZohoDesk.ts:51-55` | RQ-ZS-43 |
| Temporizador con las seis evaluaciones y sin Desk; arranque sin sincronizar | `apps/desk/server/cicloPeriodico.ts:28-40`; `apps/desk/server/index.ts:61`, `:72`, `:78`, `:88` | RQ-ZS-44.1-2 |
| Aperturas desde lo local, `404` sin datos | `apps/desk/server/routes/tickets.ts:132`, `:136`, `:149`, `:169`, `:226-229` | RQ-ZS-44.3 |
| `503` tras sesión y rol, antes del interruptor propio y de validar | `apps/desk/server/routes/admin.ts:43`, `:53`, `:196`, `:207`; `apps/desk/server/routes/rellenoConversaciones.ts:36`; `apps/desk/server/routes/rellenoAdjuntos.ts:43`; `apps/desk/server/routes/verificacionCompletitud.ts:37`; `apps/desk/server/routes/tickets.ts:196` | RQ-ZS-44.4 |
| Adjunto sin copia: `503` y log sin nombre ni ruta | `apps/desk/server/routes/attachment.ts:22`, `:39-42` | RQ-ZS-44.5 |
| Manejador central: el error tipado da `503` | `apps/desk/server/app.ts:79` | RQ-ZS-44.6 |
| Worker sin la pasada de Desk; Books y CRM como hoy | `apps/hub-sync/src/hubSync.ts:15`, `:21`, `:22`, `:90` | RQ-ZS-45 |
| Barrido del repositorio con lista cerrada | `apps/desk/server/testing/barridoZohoDesk.ts:39-61`, `:69` | RQ-ZS-46 |
| `DEPLOY.md` §24 | `DEPLOY.md:1030-1066` | RQ-ZS-47 |

`apps/desk/src` no cambia (regla 13: el cliente no decide nada; detalle en `verify-report.md` §6). El inventario completo de las llamadas a
`zohoFetch` y qué les pasa con el modo abierto está en `verify-report.md` §5: ninguna queda sin destino, y una llamada nueva queda cortada y
registrada por la puerta sin tocar el interruptor.

## 2 · Intentos del registro (medida = `git diff --shortstat --no-renames` del intento más lo nuevo sin trackear)
| Intento | Unidad | Commits | Medida = registro |
|---|---|---|---|
| i1 | propuesta y delta | `6417fa9b` | 501 |
| i2 | diseño y tareas | `2a5602a7` | 438 |
| i3 | L1 puerta, error, registro y configuración | `1c386a5d` | 717 |
| i4 | L2 ciclo periódico y arranque | `a0660bb7` | 236 |
| i5 | L3 guarda, administración, manejador central y `GET` | `c5b6cd2d` | 514 |
| i6 | L4 aperturas, respuesta y adjunto | `7c081f63` | 266 |
| i7 | L5 worker | `0661230d` | 205 |
| i8 | L6 barrido | `46ceaa51`, `212733f7` | 644 |
| i9 | L7 `DEPLOY.md` §24 | `ebcb8850` | 163 |
| i10 | verify | `10d0b29d`, `5e8c9552` | 253 |
| i11 | archivo | este commit | 3300 (2.962 de mudanza, 1.481 × 2, + 258 de fusión + 4 de la guarda + 76 de este informe) |

En cada intento las cinco comprobaciones (typecheck, `npm run lint -- --max-warnings 165`, detector de citas, `npm test` a log y build) salieron en 0
sobre el commit del intento; en i8 e i10 la primera pasada dio el detector en 1 por citas de los artefactos (la palabra detrás de «en» leída como
revisión, y rutas abreviadas `P/`, `S/`, `H/`), corregidas en el mismo intento y con la pasada fallida en la evidencia. `npm test`: 6.199 pruebas al
empezar, 6.359 al cerrar el último lote (+160).

## 3 · Hipótesis y avisos que pasan a la semana del paso 4
- **H-1, confirmada en el formato:** bajo `tsx` el marco de pila es `at <función> (<ruta del .ts>:<línea>:<columna>)`; sigue siendo **hipótesis** la
  ruta del contenedor Linux (`Dockerfile:29`): si no lleva `apps/`, `packages/` o `scripts/`, el llamador sale `desconocido`, que no filtra datos.
- W-1 y W-2 de `verify-report.md`: el arranque de la App y el cableado del worker se fijan leyendo el texto de `index.ts` y `hub-sync.ts`, no
  ejecutándolos (lo aceptan D-4 y D-7).
- W-4: el `404` de una apertura sin datos locales no suma como rechazo (S-j).

## 4 · Supuestos para la lista semanal (`decision/preguntas-de-detalle-sin-llegar`)
S-j (contar o no los `404` de aperturas como rechazos), S-k y S-l (código `503` y textos que ve el técnico), S-n (aviso en pantalla) y S-p (si basta
que las evaluaciones corran o se quiere una pasada propia). Ninguno cambia el alcance de la fila.

## 5 · Tareas de persona (fuera del recuento; archivar NO las da por hechas)
| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Añadir a `.env.example` las dos líneas de la variable (texto en el informe de cierre de la tanda) | Alfonso | informe de cierre |
| P-2 | Desplegar con `MODO_SIN_ZOHO_DESK=false` en los DOS servicios, App y worker `zoho-hub-sync` | Alfonso | `DEPLOY.md` §24 |
| P-3 | La semana en modo sin Zoho (paso 4 del corte), con decisión de Gerencia: abrir en los dos, leer el `GET` y el log del worker, cerrar | Alfonso; decide Gerencia | `DEPLOY.md` §24 |

## 6 · Notas para Supervisión (la rama no toca los seis ficheros)
- `docs/sdd/ENTRADA.md:2059` («no existe interruptor para ello: la aplicación sincroniza siempre») deja de ser cierta con esta tanda.
- `openspec/specs/zoho-sync/spec.md:48`, `:266`, `:270` y `:753` citan posiciones de `apps/hub-sync/src/hubSync.ts` anteriores a `244c237c`
  (hoy Desk está en `:90-100` y Books en `:101-105`): desfase previo, no causado por esta tanda, que no mueve líneas.
- Maestro (`toca_maestro: si`): los pasajes que parten de que la pasada de alarmas y de ritmo de contratos se retira con 1G-04 quedan
  desactualizados: sigue corriendo y sólo salta Desk (`proposal.md` §9).
- Plan: «Se prueba en staging» contradice `decision/e013-staging-f0-04` (S-a); n8n queda fuera del interruptor (S-c, hipótesis).
- `apps/desk/server/reconciliacion/registro.test.ts:218` y `:220` vuelven a OCHO «en curso», con 1G-04 en «cerradas por archivo»: corregidas en sitio en este commit.
