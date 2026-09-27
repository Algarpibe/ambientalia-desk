# Diseño: las dos salidas de `Verificación` (F1A-03)

## Enfoque técnico

Cambio de DATOS en `TRANSITIONS_EQUIPO_NUEVO` (`packages/shared/src/transitions.ts:350-361`) más
guardianes. Ni el servidor ni el cliente cambian: los dos leen el mismo catálogo a través de
`flujos.ts`. `estados.ts` **no se toca** (`Verificación` ya está registrado, `estados.ts:105`, `:182`).

## Decisiones

| # | Opción elegida | Rechazada | Por qué |
|---|---|---|---|
| D1 · E1 | Editar **en su sitio** `transitions.ts:359`: `from: ['En Proceso', 'Verificación']` | Entrada nueva `liberacion_verificacion` | Una transición con dos orígenes (s1; precedente `:178`). Sin línea nueva. La unión pasa a 40 y no a 41; `transicionPorId`/`flujoDeTransicion` (`flujos.ts:74-88`) no cambian |
| D2 · E2 | `{ id: 'rechazo_verificacion', name: 'Rechazo de verificación', from: ['Verificación'], to: 'Notificado', area: 'Servicio Técnico', fields: [comment(), derivacion()] }` **al final** del array, tras `:360` (+2 líneas) | Insertarla junto a `verificacion` (`:357`) | Al final no desplaza ninguna línea citada del fichero (regla de mutación 4). `derivacion()` sin `porDefecto`: el guardián de escalado ambiguo (`sla.test.ts:201-209`) sigue verde |
| D3 · comentario | Reescribir `:343-345` en **tres** líneas (las salidas existen, con su decisión) y `:347` «las cinco» → «las seis», mismo número de líneas | Borrar el bloque | Mantiene `:350` estable |
| D4 · enrutado | Sin cambio en `flujos.ts` | — | `Verificación` ya está en `ESTADOS_DEL_CATALOGO_EQUIPO_NUEVO` (`flujos.ts:46-48`, como `to`), así que un ticket `Equipo nuevo` en `Verificación` ya consulta el catálogo EN (`:56-61`). Hoy `transicionesDelTicket` (`:69-71`) le devuelve `[]`; después, `liberacion` y `rechazo_verificacion` |
| D5 · barridos | Los barridos EN de ejecución y de área P6 recorren **todos** los `from`, no `t.from[0]` | Caso manual suelto | Es el molde del barrido de servicio (`transicionesEjecucion.test.ts:283-285`, 36 ejecuciones por `habilitar_servicio`). Cubre `Liberación` desde `Verificación` y cualquier origen futuro |

## Flujo de datos

    Ticket(Equipo nuevo, Verificación)
      └─ flujoDelTicket → 'equipo-nuevo' → transicionesDelTicket → [liberacion, rechazo_verificacion]
    POST /transition → executeTransition: flujo :125 → origen :126-128 → área :129-131 → plan :133
      └─ aviso de área: areasAAvisar(t.to, áreas actor, catálogo EN)  (ticketService.ts:196)

**Avisos.** `areasSiguientes('Verificación', EN)` pasa de `[]` a `['Servicio Técnico']`. Pero
`verificacion` exige `Servicio Técnico` (`:357`) y `areasAAvisar` resta las áreas del actor
(`avisoArea.ts:16`), así que **ningún actor autorizado genera aviso nuevo**. Tras `rechazo_verificacion`,
`areasSiguientes('Notificado', EN)` sigue siendo `['Servicio Técnico']`. Se fija con una prueba unitaria.

## Regla 13 — decisiones del cliente

| Decisión en cliente | Línea que la impone en el servidor |
|---|---|
| Qué transiciones ofrece en `Verificación` (`TransitionPanel.tsx:56`, `transicionesDelTicket`) | Flujo `ticketService.ts:125`; origen `:126-128` |
| Filtro por área (`TransitionPanel.tsx:57`) | `:129-131`; probado por la matriz de `permisos.test.ts` (6×3) |
| Campos del formulario (`t.fields`) | `buildTransitionPlan`, `:133-134`; derivado `:138-142` |

Cero decisiones nuevas; cero ediciones en `apps/desk/src`.

## Cambios por fichero

| Fichero | Acción |
|---|---|
| `packages/shared/src/transitions.ts` | `:359` en su sitio; +2 líneas tras `:360`; `:343-345`, `:347` en su sitio |
| `packages/shared/src/invariantesGrafo.test.ts` | `:172-174` 39→40; `:177-180` → `['Finalizado']`; `:200-208` seis pares y «las salidas de `Verificación` son exactamente `liberacion`, `rechazo_verificacion`»; `:211` «seis» |
| `packages/shared/src/reentrancia.test.ts` | `:191-194` → `['Ingresado','En Proceso','Notificado','Verificación']` (orden de aparición, `reentrancia.ts:108-117`); `:198` sigue `[]` |
| `apps/desk/server/permisos.test.ts` | `:243-248` 15/10/5 → 18/12/6; títulos «6×3» en su sitio |
| `apps/desk/server/transicionesEjecucion.test.ts` | `CASOS_EQUIPO_NUEVO` +1 fila y `liberacion.desde` dos orígenes; barrido por todos los `from`; `:358` 5→7 |
| `apps/desk/server/flujoEquipoNuevo.test.ts` | P6 por todos los `from` (7 × 403); P7 nueva al final: ticket en `Verificación` → `liberacion` 200/`Finalizado`, `rechazo_verificacion` 200/`Notificado` |
| `apps/desk/server/services/avisoArea.test.ts` | +1 caso al final: `areasAAvisar('Verificación', ['Servicio Técnico'], EN)` = `[]` y `areasSiguientes` = `['Servicio Técnico']` |

Las pruebas nuevas van **al final del fichero** (o de su último `describe`) y las expectativas se
editan en su sitio, para no desplazar líneas citadas. Donde una fila de lista añada línea (pares de
`:200-208`, `CASOS_EQUIPO_NUEVO`), lo desplazado entra en el barrido de cierre.

## Estrategia de pruebas (strict TDD)

**Rojo primero**, antes de tocar `transitions.ts`: los cambios de expectativa de arriba, más P7 y el
caso de avisos. Todos rojos contra el catálogo actual; verdes tras D1+D2.

**Mutaciones (regla 2: se ensucia el fichero vigilado, `transitions.ts`):**

| Mutación | Debe ponerse rojo |
|---|---|
| M1 · quitar `'Verificación'` de `liberacion.from` | pares RQ-EN-01, salidas de `Verificación`, espejo `CASOS`, recuento 7, P7 |
| M2 · borrar E2 | recuento 40, pares, reentrancia, matriz 18, P7 |
| M3 · M1+M2 | además invariante 3 |
| M4 · área de E2 → `Comercial` | corrección (b) `:213`, matriz |

⚠️ El invariante 3 **sólo** caza M3: con una sola salida quitada `Verificación` sigue teniendo salida.
El criterio de éxito «rojo si se quita cualquiera» lo sostienen los pares y P7, no el invariante.
Regla 1 (posición): N/A, no se añade ni se mueve ninguna guarda.

## Matriz de amenazas

N/A — sin enrutado de procesos, shell, subprocesos, VCS ni clasificación de ejecutables. (El
«enrutado» de flujos es de dominio y está cubierto arriba.)

## Migración / despliegue

Sin migración. Cierre: barrido `grep -rnoE "transitions\.ts:[0-9]+(-[0-9]+)?"` y el de los seis
ficheros de prueba. Medido hoy, citan las zonas que cambian `proposal.md` (el rango `:350-361` pasa a
`:350-363`) y `docs/sdd/ENTRADA.md:1197` (`transitions.ts:359` no se mueve, pero cambia lo que dice: leer la frase). Hipótesis: las cuatro citas a `transicionesEjecucion.test.ts:312` (maestro,
`F0-01`, triaje) son de otra revisión (caso B); el barrido lo comprueba.

## Tamaño

Código ~12 líneas cambiadas; pruebas ~90; spec delta ~80; diseño ~110; tareas ~70; apply-progress ~80.
**~450, un solo lote ≤800.** Aparte, verify-report (~350) y archive (se mide).

## Preguntas abiertas

- [ ] Hipótesis: un ticket en `Verificación` cuya clasificación deje de ser «Equipo nuevo» cae en
      `servicio` y queda sin salida (`flujos.ts:56-61`). Preexistente, fuera de alcance.
- [ ] s1-s3 siguen siendo supuestos (preguntas 1-3 de la propuesta).
