---
tanda: fuera-del-plan
motivo: "Reasigna los desvíos que quedaron huérfanos (sin dueño ni destino) al cerrar la épica F1A"
capacidad: [remisiones, tickets-core]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: derivada-17/09
---

# Proposal: Reasignar desvíos huérfanos tras el cierre de F1A

## Intent

Al cerrar la épica F1A, sus cuatro desvíos vivos seguían con destino «F1A» en `CLAUDE.md` y
`openspec/config.yaml`. Un destino que nombra una épica cerrada no es un destino: el desvío queda sin
dueño mientras ambos ficheros siguen afirmando que lo tiene, y esa afirmación se carga en cada sesión y
en cada sub-agente como si fuera cierta. La reasignación en sí **ya está hecha** en el commit `56ff441`
(base `607e26a`, rama `main`). Este cambio SDD registra esa reasignación como propuesta y añade dos
matices de contenido que sí son trabajo nuevo (ver Scope).

## Scope

### In Scope
- Delta de spec en `remisiones` y `tickets-core`: declarar con esas palabras que el arreglo de IV-4
  puede ser **retirar** las dos puertas existentes (`ticketService.ts:45` y `:100`), no añadir una
  tercera — condicionado a cómo se resuelva el punto abierto nº 52 del maestro (verificado,
  `R08.1.md:2079`: «Ninguna de las tres encaja en un modelo de "una OV, un ticket", y las tres son
  habituales. Punto abierto nº 52.»).
- Comentario cruzado entre `apps/desk/server/services/ticketService.test.ts:176` y `:295` (verificado:
  títulos literalmente opuestos — «los obligatorios que faltan ganan a la orden de venta ya usada: 422,
  no 409» vs. «la orden de venta ya usada gana a los obligatorios que faltan: 409, no 422» — las dos en
  verde, ninguna apunta hoy a la otra).

### Out of Scope
- Corregir cualquiera de los cinco desvíos (IV-1, IV-2, IV-4, IV-5, IV-7): esto es registro, no arreglo.
- Resolver el punto abierto nº 52 o la decisión `decision/vista-todos-tablero` (IV-7): son decisiones de
  Gerencia, no de esta tanda.
- Escribir la fila de plan F1B-10 (precedencia única de guardas) o dimensionar el módulo de KPIs que
  necesita IV-2: huecos ya documentados en `docs/sdd/F0-01_Correcciones_para_el_plan.md` entrada 5,
  pendientes de tanda propia.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `remisiones`: añade el matiz "retirar, no añadir puerta" a la sección que cubre IV-4.
- `tickets-core`: mismo matiz — la cardinalidad OV↔ticket también la impone `ticketService.ts:45`.

## Approach

Documentación pura, sin cambio de comportamiento: (1) delta de spec en `remisiones` y `tickets-core`
citando `R08.1.md:2071-2079`; (2) un comentario de una línea en cada uno de `ticketService.test.ts:176`
y `:295` señalando el número de línea de la prueba opuesta.

## Los cinco desvíos, destino tras el barrido de `56ff441`

| ID | Ubicación | Destino nuevo | Evidencia |
|----|-----------|---------------|-----------|
| IV-1 | `boardView.ts:35` (regex de esperas) | **F1B-08** | `plan:157`, ítem 22 maestro. Matiz: el destino viejo mezclaba destino con dependencia; `ESTADOS_EN_ESPERA` existe desde F0-04 (`estados.ts:111`) y `boardView.ts` no lo importa |
| IV-7 (nuevo) | `boardView.ts:49-50` (vista `todos`) | **F1B-08, tras decisión de Gerencia** | Encontrado 2026-09-09 contra Zoho Desk producción: `statusType !== 'Closed'` oculta 726 cerrados; comparte cuerpo con `default` |
| IV-5 | `TicketCard.tsx:14-23` (mapa de colores muerto) | **F1B-08**, cosmético | Misma fila que IV-1/IV-7: la tarjeta es del listado |
| IV-2 | `valoresTransicion.ts` (fechas derivadas sólo en cliente) | **PUNTO ABIERTO PARA GERENCIA** | El destino viejo («F1A o F1C») era el aviso de que nadie había decidido. Las tres fechas son operandos de KPI: `Fecha Remisión Entrada` abre el bodegaje de entrada (`bodegaje.ts:60-66`) |
| IV-4 | `remision.ts:218-226` (tercera puerta sin comprobar) | **PUNTO ABIERTO Nº 52 DEL MAESTRO** | `R08.1.md:2079`; cerrarla a ciegas podría ser retirar las otras dos, no añadir la tercera |

Detalle completo con cita íntegra en `CLAUDE.md:115-150` y `openspec/config.yaml` bloque
`incumplimientos_vivos`.

## Proposal question round

No aplica: `execution_mode` de esta sesión es `auto`, y el contenido de este cambio ya está decidido y
commiteado (`56ff441`) — no hay ambigüedad de negocio que resolver aquí. Quedan dos decisiones abiertas
de Gerencia, ya identificadas y deliberadamente fuera de este cambio: el punto abierto nº 52 (IV-4) y
`decision/vista-todos-tablero` (IV-7).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/specs/remisiones/spec.md` | Modified | Añade alternativa "retirar puertas" para IV-4 |
| `openspec/specs/tickets-core/spec.md` | Modified | Mismo matiz, cardinalidad OV↔ticket |
| `apps/desk/server/services/ticketService.test.ts:176,295` | Modified | Comentario cruzado entre pruebas contradictorias |
| `CLAUDE.md`, `openspec/config.yaml` | None (ya hecho en `56ff441`) | Tabla de desvíos y `incumplimientos_vivos` ya reasignados |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| El comentario cruzado se lee como que la precedencia ya está unificada | Med | Frasear el comentario como referencia, no como resolución; la unificación es F1B-10 (fuera de alcance) |
| La spec se lee como decisión ya tomada sobre nº 52 antes de que Gerencia decida | Low | Redactar el delta en condicional ("si nº 52 se resuelve a favor de las variantes...") |

## Rollback Plan

`git revert` del commit de este cambio. No toca código de producción ni el resultado de ningún test
existente: sólo dos deltas de spec y dos comentarios de una línea.

## Dependencies

- `56ff441` debe estar en `main` (ya lo está).
- El cierre real de IV-4 depende de la decisión de Gerencia sobre el punto abierto nº 52.
- El cierre real de IV-1, IV-5, IV-7 depende de F1B-08; el de IV-2, de una decisión de Gerencia aparte.

## Success Criteria

- [ ] `openspec/specs/remisiones/spec.md` y `tickets-core/spec.md` declaran la alternativa "retirar",
      citando `R08.1.md:2079`.
- [ ] `ticketService.test.ts:176` y `:295` llevan comentario cruzado señalando la línea opuesta.
- [ ] `npm test` sigue en verde; ningún resultado de prueba cambia.
