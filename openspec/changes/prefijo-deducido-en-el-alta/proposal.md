---
tanda: F1B-03
motivo: ""
capacidad: [tickets-core]
maestro: ["M1.1", "nº 37"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `prefijo-deducido-en-el-alta`

Construye `decision/prefijo-de-que-se-deduce` (Gerencia, 2026-10-14; `openspec/config.yaml:4707-4736`). Segundo
cambio de la fila F1B-03 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:83`, ampliación `:177`, nota
`:309`). Leído en el worktree sobre `968bb53`. Modo de ejecución `auto` (`openspec/config.yaml:26`): no hay ronda de
preguntas; las dudas con supuesto razonable van a §7.

*Sobre la cabecera.* `maestro`: el pasaje de procedencia es M1.1 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1143`
abre M1.1, `:1177` abre M1.2), y su cierre nombra el punto nº 37 (`:1176`). `toca_maestro: si`: el maestro dice que
los cinco prefijos «dejan de existir en el alta» y que el prefijo «no se genera automáticamente» (`:1170`); la
decisión del 14/10 dice lo contrario —se conserva y se deduce—. `cierra: si`: la fila tiene cinco contenidos; tipo de
servicio, ticket sin OV y guarda de remisión vigente los cubrió `tipo-servicio-ticket-sin-ov`
(`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:5`), la OVI de garantía
`ovi-garantia-por-cargo` (`openspec/changes/archive/2026-10-06-ovi-garantia-por-cargo/archive-report.md:6-8`), y lo
único que esos informes dejan fuera son los prefijos y E-158; E-158 se cerró sin construir nada
(`openspec/config.yaml:4352`), y E-184 es punto abierto «si Gerencia lo pide» (`docs/sdd/ENTRADA.md:1919`), no
contenido de la fila.

## 1 · Intención

Hoy el prefijo del código de servicio se ELIGE en un desplegable (`apps/desk/src/components/CreateTicket.tsx:46`,
`:423-425`), el servidor lo exige en el cuerpo (`apps/desk/server/services/ticketService.ts:82`, `:87`) y, peor,
acepta el `codigoServicio` y el `subject` del cuerpo tal cual (`:101-102`), que el cliente manda siempre
(`CreateTicket.tsx:232`) y que la persona puede teclear libremente (`:434`, `:436`). O sea: ni siquiera validar el
prefijo impide guardar un código con otro. Drive nombra carpetas e informes con el prefijo (decisión, consecuencia
5), así que un prefijo mal elegido es una carpeta en el sitio equivocado.

Al terminar: el servidor DEDUCE el prefijo de la clasificación y del tipo de servicio, CONSTRUYE el código y el
asunto, e ignora lo que el cuerpo diga de los tres. «Protocolo» es un tipo de servicio. Los tickets existentes no se
tocan.

## 2 · Alcance

**Dentro**

1. `packages/shared/src/ticketCreate.ts`: función pura `prefijoDeducido(clasificacion, tipoServicio)` con la tabla de
   la decisión; sustituye a `defaultPrefijoFor` (`:46-49`), que se retira.
2. «Protocolo» en `TIPOS_SERVICIO` (`:4`), tras «Reparación» y antes de los comodines.
3. El alta (`ticketService.ts`) deduce el prefijo y construye código y asunto siempre; `prefijo`, `codigoServicio` y
   `subject` del cuerpo se IGNORAN; `prefijo` sale de la lista del `422` de obligatorios.
4. El segmento AAMMDD del código sale del día civil en `America/Bogota`, no del reloj del servidor (S-4).
5. Cliente: desaparece el desplegable de prefijo; código y asunto pasan a vista previa de sólo lectura calculada con
   la misma función de `shared`; `pickOv` deja de leer el prefijo de la oportunidad de CRM; `prefijo`, `subject` y
   `codigoServicio` salen de `CreateTicketPayload` (`packages/shared/src/types.ts:322`, `:325-326`).
6. Se retira `parseCodigoFromPotential` (`ticketCreate.ts:20-24`), cuyo único consumidor es `CreateTicket.tsx:172`.
7. Corrección para el maestro en `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (M1.1 `:1170`, y el Anexo G col. 27
   con ocho tipos).

**Fuera**

- Migración o recálculo de códigos guardados (decisión, consecuencia 4).
- El campo «Código Servicio» de la transición «Ingreso a Servicio» (`packages/shared/src/transitions.ts:191`), que
  permite reescribir el código a mano después del alta: segunda vía de escritura, fuera de la decisión (§6, H-1).
- Validar `tipoServicio` o `clasificaciones` contra sus listas: hoy el alta no lo hace (`ticketService.ts:85-86`;
  `debt.md:768`) y añadirlo sería un rechazo nuevo.
- n8n y Drive: no se tocan.

## 3 · Capacidades

**Nuevas:** ninguna (`capabilities` no cambia).

**Modificadas — `tickets-core`:**

| Requisito | Cambio |
|---|---|
| Tabla de §0 (`openspec/specs/tickets-core/spec.md:33`) | MODIFICADO: prefijos deducidos de clasificación + tipo |
| RQ-TC-03 (`:73-92`) | MODIFICADO: fila `defaultPrefijoFor` → `prefijoDeducido`; el alta YA NO acepta `codigoServicio` ni `subject` del cuerpo (`:86-87`) |
| RQ-TC-05 (`:126-171`) | MODIFICADO: fila 5 sin «prefijo» (`:138`); se retira la viñeta de `:165` |
| §4.3 tipos de servicio (`:556-564`) | MODIFICADO: `TIPOS_SERVICIO` con «Protocolo» |
| M-1 y M-3 de la tabla de discrepancias (`:1463`, `:1465`) | MODIFICADOS: ocho valores; M-3 pasa a la decisión del 14/10 |
| RQ-TC-61 | AÑADIDO: tabla de deducción del prefijo (5 ramas) y su imposición en el servidor |
| RQ-TC-62 | AÑADIDO: el cuerpo no decide prefijo, código ni asunto; un cliente viejo crea igual |
| RQ-TC-63 | AÑADIDO: regla 13 del alta para el prefijo (vista previa = comodidad probada) |

`D-7` (`:1453`) habla de los obligatorios de entonces: caso B de la regla de mutación 4, no se renumera.

## 4 · Enfoque

- **Una sola deducción**, en `shared`, consumida por servidor (imposición) y cliente (vista previa). Las dos
  clasificaciones con prefijo propio se reconocen con los MISMOS predicados que enrutan el flujo
  (`esClasificacionEquipoNuevo`, `esClasificacionSoporteRemoto`, `packages/shared/src/flujos.ts:40-43`, `:116-118`):
  el prefijo y el grafo no pueden divergir (molde H5). Todo lo demás es la rama de mantenimiento, igual que en
  `estadoInicialDelAlta` (`flujos.ts:138-140`).
- **Ignorar, no rechazar.** La deducción es total sobre los obligatorios ya comprobados, así que no añade guarda ni
  `422`: la escalera A < B < C < D del alta (RQ-TC-05) queda intacta salvo que «prefijo» deja de figurar en la fila 5.
- **Edición en sitio de `ticketService.ts`** conservando el recuento de líneas cuando se pueda (fichero muy citado);
  si alguna línea se mueve, barrido de la regla de mutación 4 al cierre.

**Regla 13, decisión a decisión (cliente → línea del servidor que la impone):**

| Decisión del cliente | Imposición |
|---|---|
| Prefijo mostrado | `createManagedTicket`, hoy `ticketService.ts:82`/`:87`, pasa a deducirlo; probado por RQ-TC-61 |
| Código y asunto mostrados | `ticketService.ts:101-102`, construidos siempre; probado por RQ-TC-62 |
| Lista de tipos del desplegable | Ninguna: el servidor acepta cualquier texto no vacío (`:85`). Preexistente, fuera de alcance |

## 5 · Lo que enumera `TIPOS_SERVICIO` y si cambia

| Consumidor | ¿Cambia? |
|---|---|
| `CreateTicket.tsx:417` (desplegable) | No: «Protocolo» aparece solo |
| `packages/shared/src/ticketCreate.test.ts:14-19` (comodines al final) | No: sigue verde con «Protocolo» antes de «No aplica»; se añade aserción de presencia |
| `packages/shared/src/ordenOVI.ts:13`, `ordenOVI.test.ts:69-71` | No: sólo exigen que «Garantía» esté |
| `apps/desk/server/db/remisionesHistoricasSeed.ts:13-15` | No: comentario; el histórico no se fuerza a la lista |
| Remisión de entrada (`apps/desk/server/routes/remision.ts:65`, `:247`; `CrearRemision.tsx:215`) | No: hereda el texto del ticket, sólo lectura |
| Webhook a n8n (`apps/desk/server/remisionWebhook.ts:9`, `:44`) | No en código; n8n recibirá «Protocolo» como texto (hipótesis: lo trata como texto libre, el histórico ya trae valores fuera de la lista) |
| Análisis e indicadores (`apps/desk/server/analisis.ts:29`) | No: agrupan por el texto |

## 6 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| H-1 · «Ingreso a Servicio» reescribe el código con cualquier prefijo (`transitions.ts:191`) | Media | Fuera de alcance; se propone entrada en la bandeja para que Gerencia decida |
| Pestañas con el cliente viejo en caché | Alta | Se ignoran los tres campos: crean igual, con el prefijo deducido |
| Fecha del código desplazada un día tras las 19:00 si el servidor corre en UTC | Media | S-4: día civil en `America/Bogota` (`packages/shared/src/fechasDerivadas.ts:13`) |
| Oportunidades de CRM con otro prefijo | Baja | S-3: manda la deducción |

## 7 · Supuestos reversibles

| # | Supuesto | Cómo se revierte |
|---|---|---|
| S-1 | El cuerpo con `prefijo`/`codigoServicio`/`subject` se IGNORA, no se rechaza | Añadir un `422` de escalón C tras los obligatorios |
| S-2 | El asunto deja de ser editable: lo construye el servidor (el maestro lo quiere construido, `:1172`; RQ-TC-03 «no se teclean») | Volver a aceptar `subject` exigiendo que contenga el código impuesto |
| S-3 | El prefijo de la oportunidad de CRM deja de leerse, sin aviso | Recuperar `parseCodigoFromPotential` y avisar si discrepa |
| S-4 | AAMMDD = día civil en `America/Bogota` (precedente RQ-TC-58) | Pasar `new Date()` |
| S-5 | Clasificación desconocida o con otra caja → rama de mantenimiento (MT/CG/PRO), como el grafo | Rechazar con `422` las que no estén en `CLASIFICACIONES` |
| S-6 | Tipo de servicio por literal exacto («Calibración», «Protocolo»), como `ordenOVI.ts:13` | Plegar caja y tilde |
| S-7 | «Protocolo» va en la sexta posición, tras «Reparación» | Mover el literal |

## 8 · Plan de vuelta atrás

`git revert` de los commits del cambio: no hay migración ni dato nuevo. Los tickets creados entre medias conservan
su código, válido (los cinco prefijos siguen en `PREFIJOS`). Un ticket con «Protocolo» sigue legible.

## 9 · Estimación (×1,8 sobre la ingenua; techo 800, válvula 720)

| Lote | Ingenua | ×1,8 |
|---|---|---|
| 1 · `shared`: deducción, «Protocolo», tipos, pruebas | 85 | ~155 |
| 2 · Servidor: alta en sitio + 5 aserciones del `422` + pruebas nuevas | 150 | ~270 |
| 3 · Cliente + corrección del maestro | 45 | ~80 |

Total ~505: cabe en un intento de `apply`; si el lote 2 pasa de 400, partir tras él.

## 10 · Criterios de éxito

- [ ] Las cinco ramas de la tabla dan HV, SR, CG, PRO y MT en el código guardado.
- [ ] Un alta con `prefijo: 'CG'` y `codigoServicio: 'CG_…'` sobre «Equipo nuevo» guarda `HV_…`.
- [ ] El `422` de obligatorios ya no nombra «prefijo».
- [ ] Mutaciones: devolver el prefijo del cuerpo o el `codigoServicio` del cuerpo pone rojo al menos una prueba.
- [ ] Ningún código existente cambia; `npm test`, `npm run typecheck`, `npm run lint` en verde.
