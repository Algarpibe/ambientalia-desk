# Diseño: prioridad del cliente y Top 5 (F1B-07, parte decidida)

F1B-07, `cierra: no`. Entradas: `proposal.md` (S-1…S-9) y `exploration.md`. La spec se escribe en paralelo y este
diseño no depende de ella. Líneas leídas contra el árbol de `6055c4d` el 2026-09-30; lo no ejecutado va marcado
**«hipótesis»**. No se ha corrido la suite. Supera el tope de 800 palabras de la fase porque el encargo exige once
apartados con ruta y línea (mismo caso que `archive/2026-09-30-permisos-por-cargo/design.md:5-6`).

## Enfoque técnico

La regla vive en `shared`, en un fichero NUEVO (`packages/shared/src/prioridad.ts`): lista blanca, orden, «la más
alta», lectura a prueba de fallos de la fila del cliente, validación de los dos cuerpos HTTP y el predicado de la
guarda del técnico. `prioridadAlNacer` (`contratos.ts:66-69`) se edita **en sitio** para consumirla. Dos tablas nuevas
calificadas AL FINAL de `schema.sql`, un módulo de datos nuevo, un fichero de rutas nuevo y dos ediciones de una
sola línea en `ticketService.ts` (`:106`, `:131`). Ninguna inserción en fichero muy citado salvo al final.

## Decisiones

| # | Decisión | Rechazado | Por qué |
|---|---|---|---|
| D-1 | Fichero nuevo `prioridad.ts`; `prioridadAlNacer` se queda en `contratos.ts:66-69` y gana el tercer parámetro **obligatorio** `top5: string \| null` | Mover `prioridadAlNacer` a `prioridad.ts`; parámetro con valor por defecto | Moverla rompe las 7 citas vivas de `contratos.ts:65-68` (§10). Obligatorio: `tsc` caza al llamador que lo olvide; el coste son `contratos.test.ts:77`, `:79` en sitio |
| D-2 | La lista `High \| Medium \| Low` se escribe en `prioridad.ts` y una prueba la iguala a `transitions.ts:84` | Importarla en `transitions.ts` | `transitions.ts` no importa valores (D-7 de F1C-05); una línea nueva desplazaría 433 citas. Dos copias vigiladas por prueba no son H5 |
| D-3 | S-2 se aplica editando el **helper** `priority()` (`transitions.ts:84`, `required: true` → `false`) | Editar `:193` y `:195` | El helper sólo tiene esos dos llamadores (medido); editarlo cambia una línea, no dos, y el campo sigue existiendo para quien sí puede fijarla |
| D-4 | Guarda del técnico al final de la línea `:131`, detrás del 403 de cargo | Retirar `priority()` de las dos transiciones | Retirarlo haría que `buildTransitionPlan` ignorase `values.priority` en silencio: ni el admin podría cambiarla ahí ni el técnico sabría por qué no cambia |
| D-5 | Rutas en fichero nuevo `apps/desk/server/routes/prioridad.ts` | `directory.ts:25` | `directory.ts` es sólo lectura del directorio; precedente `routes/contratos.ts` (lectura + escritura en su propio fichero) |
| D-6 | Sin `CHECK` de lista sobre `cliente_prioridad.prioridad`; la lectura falla cerrado (`prioridadTop5` devuelve `null` si no es asignable) | `CHECK (prioridad IN (…))` | Mismo motivo que D-4/D-5 de F1C-05: segunda copia de la lista |
| D-7 | `CHECK (motivo <> '')` en `prioridad_ajustes` | Sólo el 422 | Defensa en la base, precedente `contratos_fin_no_antes_de_inicio` (`schema.sql:570`) |
| D-8 | La guarda sólo actúa si la transición declara un campo `target: 'priority'` | Actuar en toda transición | En las demás `buildTransitionPlan` ya ignora la clave; un 403 ahí sería ruido |
| D-9 | Ajuste idéntico a la prioridad actual → 422 | Aceptarlo como no-op | Una traza sin cambio no dice nada; reversible |

## 1 · Dominio en `shared`

`packages/shared/src/prioridad.ts` (nuevo), exportado **al final** de `packages/shared/src/index.ts` (línea 26 nueva):

```ts
export const PRIORIDADES_ASIGNABLES = ['High', 'Medium', 'Low'] as const       // = transitions.ts:84 (prueba)
export type PrioridadAsignable = (typeof PRIORIDADES_ASIGNABLES)[number]
export function esPrioridadAsignable(x: unknown): x is PrioridadAsignable        // igualdad exacta
const RANGO: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 }  // S-3: Urgent se compara, no se ofrece
export function prioridadMasAlta(a: string | null, b: string | null): string | null // desconocida = rango 0; empate → a
export function prioridadTop5(f: { top5: boolean; prioridad: unknown } | null): PrioridadAsignable | null
export function prioridadClienteDelCuerpo(v: unknown): { ok: true; top5: boolean; prioridad: PrioridadAsignable | null } | { ok: false; errors: string[] }
export function ajusteDelCuerpo(v: unknown, actual: string | null): { ok: true; prioridad: PrioridadAsignable; motivo: string } | { ok: false; errors: string[] }
export const MENSAJE_PRIORIDAD_BLOQUEADA = 'La prioridad del ticket la fija el Director Comercial: tu cargo no puede cambiarla en esta etapa'
export function cambiaPrioridadSinPermiso(t: Pick<Transition, 'fields'>, valores: unknown, actual: string | null, s: SujetoDePermiso): boolean
```

`cambiaPrioridadSinPermiso` es verdadero sólo si `t` tiene campo `target: 'priority'` (D-8), `valores.priority` viene
no vacío, difiere de `actual` y `!puedeFijarPrioridadTop5(s)` (se CONSUME de `cargos.ts:80-83`; el admin pasa ahí).

`contratos.ts`, en sitio: `:10` gana `; import { prioridadMasAlta } from './prioridad'` en la misma línea; `:65`
(comentario) se reescribe; `:66-69` pasa a cuatro líneas:

```ts
export function prioridadAlNacer(pedida: unknown, conContratoVigente: boolean, top5: string | null): string | null {
  const delCliente = prioridadMasAlta(conContratoVigente ? 'High' : null, top5)
  return delCliente ?? (pedida ? String(pedida) : null)
}
```

| Contrato vigente | Top 5 (`top5`) | Resultado | Nota |
|---|---|---|---|
| no | `null` | la pedida, sin lista blanca | exactamente hoy (`:68`) |
| sí | `null` | `High` | RQ-TC-24 intacto |
| no | `Medium` | `Medium` | la pedida se ignora: la fija el Director Comercial |
| sí | `Low` / `Medium` / `High` | `High` | «manda la más alta» (`config.yaml:2456`). Con la lista de hoy siempre gana `High`; la prueba cubre los tres |

## 2 · Esquema

Al final de `packages/zoho-sync/src/db/schema.sql` (hoy 601 líneas, última sentencia `:601`), tras comentario ASCII
sin tildes como `:598-600`:

```sql
CREATE TABLE IF NOT EXISTS public.cliente_prioridad (
  client_id text PRIMARY KEY,               -- clients.id (contact_id de Books), sin FK como public.contratos
  top5 boolean NOT NULL DEFAULT false,
  prioridad text,                           -- lista blanca en shared (D-6)
  actualizado_por text NOT NULL,
  actualizado_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.prioridad_ajustes (
  id bigserial PRIMARY KEY,
  ticket_id text NOT NULL,                  -- sin FK, mismo caso que public.ov_asociaciones (:531-532)
  de text, a text NOT NULL,
  motivo text NOT NULL CONSTRAINT prioridad_ajustes_motivo CHECK (motivo <> ''),
  ajustado_por text NOT NULL,
  ajustado_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prioridad_ajustes_ticket ON public.prioridad_ajustes (ticket_id);
```

Guardián, todo **en sitio**: `migrate.ts:73` añade `'cliente_prioridad', 'prioridad_ajustes'` al final de
`PUBLIC_TABLES`; `migrate.test.ts:282-286` pasa de 35 a **37** y de 22 a **24**. Los ALTER (`:374-378`) no cambian.
**Choque con RQ-PM-13:** `migrate.test.ts:519-524` y el escenario de `permissions/spec.md:260-263` exigen que el ALTER
de `cargo_permiso` sea la ÚLTIMA sentencia. Se reescribe en sitio (`:519-522`: buscar la sentencia de `cargo_permiso`,
calificada y sin `CHECK`, en vez de tomar la última) y la spec de `permissions` debe MODIFICAR ese escenario; lo
contrario (insertar antes de `:598`) desplazaría citas. Pruebas nuevas **al final** de `migrate.test.ts`: las dos
tablas existen tras `migrate`, el `CHECK` del motivo rechaza `''`, y un upsert repetido deja una fila.

## 3 · Datos y rutas

`apps/desk/server/db/prioridadCliente.ts` (nuevo; consultas sin calificar, como `db/contratos.ts:6-8`):
`filaPrioridadCliente`, `prioridadTop5DelCliente` (delega en `prioridadTop5`), `listarTop5` (join con `clients`),
`fijarPrioridadCliente` (upsert `ON CONFLICT (client_id) DO UPDATE`; que pg-mem lo admita es **hipótesis**, plan B:
`UPDATE` y, si 0 filas, `INSERT`, dentro de `enTransaccion`), `ticketParaAjuste` (`id, client_id, priority`),
`ajustesDelTicket` y `ajustarPrioridad`, que en `enTransaccion` (`db/transaccion.ts:13`) hace
`UPDATE tickets SET priority=$2, managed_by_app=true, source='app', modified_time=now(), updated_at=now()` (S-6, como
`repo.ts:298`) e `INSERT` en `prioridad_ajustes`. **No** escribe `ticket_transitions` (SLA, `sla.ts:88-98`) y no toca
`upsertTicket` ni `TICKET_COLS` (IV-11).

`apps/desk/server/routes/prioridad.ts` (nuevo), registrado en sitio en `app.ts:22` (import) y `app.ts:61`:

| Ruta | Quién | Escalera (F1B-10) |
|---|---|---|
| `GET /api/top5` | cualquier sesión | — |
| `GET /api/clients/:id/prioridad` | cualquier sesión | A 404 cliente (`getClient`) |
| `PUT /api/clients/:id/prioridad` | `puedeFijarPrioridadTop5(req.user)` | A 404 cliente < B 403 < C 422 (`prioridadClienteDelCuerpo`: `top5` booleano; si `true`, prioridad asignable; si `false`, se guarda `null`, S-9) |
| `GET /api/tickets/:id/prioridad` | cualquier sesión | A 404 ticket; devuelve prioridad, `top5` del cliente y ajustes |
| `POST /api/tickets/:id/prioridad` | ídem PUT | A 404 ticket < B₁ 409 cliente no Top 5 o ticket sin `client_id` (S-8) < B₂ 403 < C 422 (`ajusteDelCuerpo`: asignable, motivo recortado no vacío, distinta de la actual; todos en `errors[]`) |

B₁ antes que B₂ sigue el precedente «estado antes que permiso» (`ticketService.test.ts:137-141`). No filtra nada:
`GET /api/top5` es público para la sesión. No hay escalón D. `req.user` ya trae `cargoPermiso` (F1C-05).

## 4 · Alta

`ticketService.ts:106`, en sitio: `priority: prioridadAlNacer(b.prioridad, await hayContratoVigente(db, clientId!), await prioridadTop5DelCliente(db, clientId!)),`.
Import en sitio al final de `:5`. Cliente del TICKET, no el de la OV (fila viva `:41`; RQ-TC-24 `tickets-core/spec.md:866`).
586 líneas con cita: cero desplazadas.

## 5 · Guarda del técnico

`transitions.ts:84`, en sitio (D-3). `ticketService.ts:131`, en sitio: antes del comentario final se añade
`if (cambiaPrioridadSinPermiso(t, b.values, current.row.priority ?? null, user)) throw new HttpError(403, { error: MENSAJE_PRIORIDAD_BLOQUEADA });`
e import en sitio en `:6`. Orden resultante: 400 `:123` · 404/409 flujo `:125` · 409 estado `:126-128` · 403 área
`:129-130` · 403 cargo `:131` · **403 prioridad `:131`** · 422 `:132-134`. El orden entre las dos 403 de `:131` es
**inobservable**: la única excepción de cargo (`liberacion_sin_factura`) no tiene campo de prioridad; se deja escrito.
Tipo de `current.row.priority`: **hipótesis** `string | null`.

Pruebas de posición (fichero nuevo `apps/desk/server/services/guardaPrioridad.test.ts`):
- área gana: `ticketService.test.ts:96-101` YA lo fija (COMERCIAL sin cargo, `priority: 'High'` ≠ `null`, mensaje de área); se añade una gemela explícita.
- estado gana: técnico con `priority` sobre ticket en `Ingresado` → 409.
- guarda gana al 422: técnico con `{ priority: 'Low' }` sin `Días de entrega` → 403 con `MENSAJE_PRIORIDAD_BLOQUEADA`.
- pasan: sin `priority`; igual a la actual; admin; Servicio Técnico + Comercial + Director Comercial.

| Prueba existente | Efecto | Ajuste (misma intención) |
|---|---|---|
| `tickets.test.ts:52` | **Ninguno**: siembra `priority` por SQL (`:45`) y lee `GET` | no se toca (corrige la propuesta) |
| `transitionExec.test.ts:136-138` | Ninguno: el campo sigue existiendo y va a `plan.priority` | no se toca; al final, «sin prioridad no da error» |
| `contratoErrores.test.ts:68` | Ninguno: sólo `ADMIN` (`:72`, `:82`) | comentario `:64` en sitio («único obligatorio: Días de entrega») |
| `ticketService.test.ts:74` | `:109` deja de listar `Prioridad`; `:120` (SERVICIO, `High` ≠ `null`) pasaría a 403 | `:104-105`, `:109` en sitio → `habilitar_servicio` desde `STATUS_TICKET_CREADO` con `{}`, que tiene dos obligatorios (`transitionExec.test.ts:27`): conserva «TODOS en una lista». `:120` → `{ 'Días de entrega': 5 }`. Comentario `:70-71` en sitio |
| `valoresDeTransicion.test.ts:157` | Ninguno: `ADMIN` | no se toca |
| `permisos.test.ts:41-66` | Ninguno: `valoresValidos` salta lo no obligatorio (`appHarness.ts:74`) | no se toca; es además detector (mutación d, §9) |

## 6 · Sin nadie con cargo

| Qué | Desde el despliegue hasta P.1 de F1C-05 y P.1 de esta tanda | Después |
|---|---|---|
| Prioridad Top 5 al nacer | Lista vacía: `top5 = null` para todos → idéntica a hoy | la del cliente, o `High` si además hay contrato |
| Mantener la lista | Sólo el admin; el Director Comercial recibe 403 hasta tener `cargo_permiso` y área Comercial (S-4) | el Director Comercial |
| Ajuste por ticket | 409 en todo ticket (nadie es Top 5) | 403/422/200 según la escalera |

**Cambio visible desde el primer minuto, independiente de P.1:** en `Escalado a Revisión` y `Devolución a corrección`
el técnico deja de ver el campo Prioridad (§8) y ya no es obligatorio; por API recibe 403 si manda una distinta. El
admin lo sigue viendo, opcional. Consecuencia que va al paquete de despliegue: los tickets que nacen sin prioridad y
no son Top 5 ni de contrato **se quedan sin prioridad** al escalar, y en «Modo de prioridad» caen al grupo «Otra
prioridad» (`apps/desk/src/board.ts:35` lo declara y `:45` le reparte todo lo que no es `High`, `Urgent`, `Medium` ni
`Low`; la cita anterior a `board.ts:41` era la lectura `const p = t.priority`, corrección C-6 de `tasks.md`), cosa que
hoy el escalado corregía. Con el orden de §12, además, van al final de «Mis tickets».

**Por qué queda el hueco (2026-10-01): es consecuencia de la pregunta 3.b.3, pendiente.** Quién ajusta a mano la
prioridad fuera de los Top 5 está preguntado a Gerencia (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:87`). El maestro
lo atribuye a «superadministrador o Director Técnico» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1709`, dentro del modelo
de prioridad de `:1696-1710`), pero no es respuesta de Gerencia, y `decision/c10-permisos-cargo` cierra la lista de
excepciones por cargo en tres (`openspec/config.yaml:1932-1934`, «lo que no está en la lista no cambia»). Construir
aquí una excepción para el Director Técnico sería una cuarta excepción no dada: no se construye. Con la respuesta, el
hueco se cierra con un predicado más en `cargos.ts` (área Servicio Técnico Y el cargo que diga Gerencia) consumido
por la misma guarda de §5; hasta entonces, sólo el admin fija la prioridad de esos tickets.

## 7 · S-1: herencia al nacer

`top5-manual` (`config.yaml:1954`) dice «sus tickets la heredan». El diseño la aplica al crear
(`ticketService.ts:106`) y la persiste en `tickets.priority`; los tickets abiertos antes de marcar al cliente no
cambian solos (S-1), ni los ya creados al desmarcarlo (S-9). **Riesgo:** leído al pie de la letra, «todos» incluye los
abiertos, y Gerencia puede ver un cliente Top 5 con tickets viejos en `Low`. Mitigación: ajuste por ticket con motivo
y punto abierto con dueño Gerencia, sin destino. La alternativa derivada al leer (H1 de la exploración) exige tocar
cada lectura del tablero y se descarta en la propuesta. Una propagación posterior sería aditiva (un `UPDATE` más una
traza por ticket).

## 8 · Cliente (regla 13 / mutación 3)

Fuera de la red de pruebas (F0-00); no se propone `jsdom`. `ClienteDetalle.tsx` es la ficha de contacto/empresa de
**Zoho** (`desk.contacts/accounts`), no el cliente de Books, y no sirve. El Top 5 encaja en **Configuración**, junto a
«Contratos por lote» (`Configuracion.tsx:127`, `:165`, sección nueva en `:33`, import en `:2`, todo en sitio):
componente nuevo `Top5Panel.tsx`, buscador de Books (`searchClients`, `client.ts:186`). En la ficha del ticket,
`PanelPrioridad.tsx` nuevo junto a `MarcaContrato` (`TicketDetailView.tsx:320`, import `:15`, en sitio).

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| `Top5Panel` enseña los controles de edición sólo si `puedeFijarPrioridadTop5(user)` | 403 de `PUT /api/clients/:id/prioridad` (línea exacta en `routes/prioridad.ts`, se escribe en el cierre) |
| El `<select>` ofrece `PRIORIDADES_ASIGNABLES` | 422 de `prioridadClienteDelCuerpo` |
| `PanelPrioridad` enseña «Ajustar» sólo si el cliente es Top 5 y `puedeFijarPrioridadTop5(user)` | 409 y 403 de `POST /api/tickets/:id/prioridad` |
| No valida motivo ni igualdad: manda y enseña el `errors[]` | 422 de `ajusteDelCuerpo` |
| `TransitionPanel.tsx:160`, en sitio: filtra los campos `target: 'priority'` si `!puedeFijarPrioridadTop5(user)`; import en `:8` | 403 de `ticketService.ts:131` → comodidad probada |
| El asterisco de Prioridad desaparece (`TransitionPanel.tsx:209` lee `required`) | `packages/shared/src/transitions.ts:84`, fuente única |

`apps/desk/src/api/client.ts`: funciones nuevas al final.

## 9 · Mutaciones planificadas

| # | Se rompe a propósito | Debe ponerse rojo |
|---|---|---|
| a | Guarda de prioridad antes de `:129` | `ticketService.test.ts:96-101` y la gemela (mensaje de área) |
| b | Guarda detrás de `:134` | «guarda gana al 422» (403 esperado, llega 422) |
| c | Guarda antes de `:126` | «estado gana» (409) |
| d | `required: true` de vuelta en `:84` | `permisos.test.ts:64-65` (Servicio Técnico recibe 403 en escalado) y «sin prioridad pasa» |
| e | Quitar el tercer argumento de `:106` (con `null`) | alta de cliente Top 5 sin contrato |
| f | `prioridadMasAlta` devuelve `b` | tabla de verdad, fila contrato + `Low` |
| g | Ensuciar `schema.sql`: `CREATE TABLE IF NOT EXISTS cliente_prioridad` sin calificar | `migrate.test.ts:266-275` y `:286` |
| h | Ensuciar `schema.sql`: quitar el `CHECK` del motivo | prueba nueva «motivo vacío rechazado» |
| i | Ajuste sin `managed_by_app=true` | prueba «tras ajustar, `managed_by_app` es true» |
| j | Ajuste escribe en `ticket_transitions` | prueba «el ajuste no deja fila de transición» |
| k | 403 del ajuste antes del 409 (B₂ < B₁) | ticket de cliente no Top 5 + usuario sin cargo → 409 |
| l | 422 del ajuste antes del 403 | sin cargo y sin motivo → 403 |
| m | 404 del `PUT` detrás del 403 | cliente inexistente + sin cargo → 404 |
| n | `'Alta'` en `PRIORIDADES_ASIGNABLES` | igualdad con `transitions.ts:84` |
| u, v, w, x, y | «Mis tickets» (§12) | ver §12 |

## 10 · Ficheros muy citados y barrido del cierre

- Todo en sitio o al final: `ticketService.ts` (`:5`, `:6`, `:106`, `:131`), `transitions.ts:84`, `contratos.ts:10`,
  `:65-69`, `cargos.ts:78` («HOY NO LA LLAMA NADIE» deja de ser cierto; en sitio), `schema.sql` (final), `migrate.ts:73`,
  `migrate.test.ts` (`:282-286`, `:519-522`, final), `index.ts` (final), `app.ts:22`, `:61`, `TransitionPanel.tsx:8`,
  `:160`, `TicketDetailView.tsx:15`, `:320`, `Configuracion.tsx:2`, `:33`, `:127`, `:165`, `client.ts` (final).
- Sin desplazamiento, **pero cambia lo que dicen** las líneas: el barrido lee qué afirma cada cita. Medido hoy fuera
  del archivo: `transitions.ts:83-84`, `:193` (5), `contratos.ts:65-68` (7), `ticketService.ts:106` y `:131` (12),
  `migrate.ts:70` (4), `cargos.ts` (0). Las de `docs/sdd/Paquete_de_Despliegue_*` y `Preguntas_Gerencia_2026-09-29.md`
  son caso B; `tickets-core/spec.md:860`, `:863` y `permissions/spec.md:402`, `:483` son de la spec de esta tanda.
  Más el pase de abreviadas en los ficheros que citan esos módulos.

## 11 · Estimación y fuera de alcance

Medida: `git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin trackear.

| Lote | Contenido | Código | Pruebas | apply-progress | Total |
|---|---|---|---|---|---|
| 1 · Dominio, esquema, datos del cliente, alta | `prioridad.ts`, `contratos.ts`, `schema.sql`, `migrate.*`, `db/prioridadCliente.ts` (cliente), rutas GET/PUT, `:106` | ~200 | ~330 | ~60 | ~590 |
| 2 · Ajuste, guarda y «Mis tickets» | `db` y ruta del ajuste, `transitions.ts:84`, `:131`, fixtures; §12 (`ordenarPorUrgencia`, `esDeMisTickets`, `GET /api/mis-tickets`, `boardView.ts:1`, `:45`) | ~125 | ~385 | ~60 | ~570 |
| 3 · Interfaz y cierre | `Top5Panel`, `PanelPrioridad`, `TransitionPanel`, `Configuracion`, `client.ts`, `App.tsx` (§12), tabla de §8 con líneas | ~280 | 0 | ~60 | ~340 |

Re-estimado el 2026-10-01: §12 suma ~160 al lote 2 y ~10 al 3; el lote 1 no cambia. Manda la tabla de `tasks.md`.
Verify y archive son intentos aparte; el archive supera 800 por el `git mv`.

**Fuera**, con fuente: calificación de clientes sin contrato ni Top 5, niveles y ajuste fuera de Top 5
(`Preguntas_Gerencia_2026-09-29.md:69-89`; el ajuste, `:87`, y su consecuencia en §6); el desempate por fecha promesa
de «Mis tickets» (`R08.2.md:1711`, sin definir; E-093); ordenar por prioridad las demás vistas; propagación a abiertos
(S-1); tope de la lista (S-7); tickets sin `client_id` (409); sincronizador, `upsertTicket`, `TICKET_COLS` (IV-11) y
`remision.ts` (IV-12); mostrar los ajustes en el Historial.

## 12 · «Mis tickets» ordenado en el servidor (añadido el 2026-10-01)

Corrección de lectura: el orden está decidido (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1711`, M1.9.1, y `:781`, §1.8, decisión del
14/08); el desempate por fecha promesa no (S-10, E-093). Hoy: el servidor sirve los activos por `created_time`
descendente (`packages/zoho-sync/src/db/repo.ts:151`) y «Mis tickets» es un filtro de vista en el cliente
(`apps/desk/src/lib/boardView.ts:44-46`), sin orden.

**Dominio** (`prioridad.ts`, parte 3, AL FINAL, lote 2):

```ts
export function ordenarPorUrgencia<T extends { priority: string | null }>(xs: readonly T[]): T[]
  // copia + sort estable por RANGO descendente; lo que no está en RANGO (null, '', 'Alta') vale 0 y va al final
export function esDeMisTickets(t: Pick<Ticket, 'statusType' | 'derivado'>, userId: string): boolean
  // t.statusType !== 'Closed' && t.derivado?.id === userId — el MISMO predicado que hoy está en boardView.ts:45
```

Reutiliza `RANGO` del lote 1 (`Urgent 4 > High 3 > Medium 2 > Low 1`); `Array.prototype.sort` es estable desde
ES2019, así que dentro de un rango se conserva el orden de entrada, que es el de `repo.ts:151`.

**Servidor** (`routes/prioridad.ts`, AL FINAL, lote 2): `GET /api/mis-tickets`, con sesión. Reproduce la forma de
`GET /api/tickets` (`apps/desk/server/routes/tickets.ts:114-115`: `getActiveTickets` + `rowToTicket` +
`esperandoAprobacionCliente`), filtra con `esDeMisTickets(t, req.user!.id)` y ordena con `ordenarPorUrgencia`. Ruta
propia y no `?scope=mios`: meter la rama en el manejador de `tickets.ts:104-116` desplazaría todas las líneas
siguientes de un fichero citado, y una ruta `/api/tickets/mios` la capturaría antes `/api/tickets/:id`
(`tickets.ts:128`, registrada en `app.ts:52`, antes que las de esta tanda en `:61`). El listado general no se toca: su
orden sigue siendo el de hoy (RQ-VT-09, escenario propio).

**Vista** (`boardView.ts`, en sitio, lote 2, con prueba porque es `.ts`): `:1` pasa a
`import { esDeMisTickets, type Ticket } from '@ambientalia/shared'` y `:45` a
`? tickets.filter((t) => esDeMisTickets(t, userId))`. Mismo número de líneas; una sola implementación del predicado
(H5). `filter` conserva el orden, así que aplicada a la lista del servidor no la reordena.

**Cliente** (lote 3, `.tsx` fuera de la red): `client.ts` gana `fetchMisTickets()` al final; `App.tsx` usa esa lista
cuando la vista es `mios` en vez de `tickets` (`App.tsx:75`, `:78`; punto exacto, **hipótesis** hasta leerlo entero
en el lote 3). Regla 13: el cliente no ordena; la decisión «qué orden» la impone `routes/prioridad.ts` (línea real al
cierre). En «Modo de prioridad» las columnas ya agrupan por prioridad (`board.ts:38-45`) y el orden de §12 sólo se ve
dentro de cada columna de estado.

**Pruebas y mutaciones.** `prioridad.test.ts` (al final): los cinco rangos en orden, desconocidos al final, estable,
no muta la entrada; `esDeMisTickets` (cerrado, de otro, sin derivar → `false`). `apps/desk/server/misTickets.test.ts`
(nuevo, pg-mem + supertest): los seis escenarios de RQ-VT-09. `boardView.test.ts` (al final): `mios` conserva el orden
de entrada. Mutaciones: **(u)** `ordenarPorUrgencia` devuelve la copia sin ordenar → rojo en «de más a menos urgente»;
**(v)** `Urgent` por debajo de `High` en `RANGO` → rojo en el primer escenario (y en «`Urgent` gana a `High`» del lote
1); **(w)** quitar el filtro de la ruta → rojo en «sólo los suyos»; **(x)** desempate invertido (ordenar por
`created_time` ascendente dentro del rango) → rojo en «el orden de hoy»; **(y)** la ruta ordena también el listado
general (`ORDER BY` en `repo.ts:151`) → rojo en «el listado general no cambia».

## Estrategia de pruebas

| Capa | Qué | Dónde |
|---|---|---|
| Pura | lista, orden, más alta, tabla de verdad, validadores, `cambiaPrioridadSinPermiso` | `packages/shared/src/prioridad.test.ts` (nuevo), final de `contratos.test.ts` |
| Esquema | recuento, `CHECK`, upsert | `migrate.test.ts` |
| Servidor | alta Top 5, rutas y escaleras, transacción del ajuste, guarda y posiciones; orden de «Mis tickets» | `apps/desk/server/prioridadTop5.test.ts`, `services/guardaPrioridad.test.ts` y `misTickets.test.ts` (nuevos) |
| Vista (`.ts`) | `mios` consume el predicado compartido y no reordena | final de `apps/desk/src/lib/boardView.test.ts` |
| Interfaz | — | excluida (F0-00) |

`strict_tdd`: cada prueba nace roja. Sin `any` nuevos (techo de ESLint).

## Threat Matrix

N/A — sin enrutado de procesos, shell, subprocesos, automatización de VCS/PR ni clasificación de ejecutables.

## Migración / despliegue

Dos tablas aditivas, vacías. P.1 (marcar la lista) depende de P.1 de F1C-05. El cambio visible de §6 va al paquete.
Reversible: revertir los commits; las tablas quedan sin lector.

## Preguntas abiertas

Ninguna bloquea. Para la spec: MODIFICAR el escenario de RQ-PM-13 (`permissions/spec.md:260-263`) y el texto «hoy no
las llama nadie» de RQ-PM-20 (`:359-362`).
