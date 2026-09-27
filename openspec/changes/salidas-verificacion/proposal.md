---
tanda: F1A-03
motivo: ""
capacidad: [transitions-equipo-nuevo]
maestro: ["M1.4", "C12", "nº 38"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: las dos salidas de `Verificación` (equipo nuevo)

Fila F1A-03 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:142`; catálogo `:486`, talla S).
La frase «se hace antes de F1B-06» de `:142` está superada: F1B-06 fue primero y está archivada
(`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:21`).

## Intención

- Hoy `Verificación` no tiene salida: `liberacion` sólo sale de `En Proceso`
  (`packages/shared/src/transitions.ts:359`) y la excepción está declarada en `:343-345`. Un ticket
  que llegue ahí se queda varado; por eso F1B-06 **no se despliega sin F1A-03** (`archive-report.md:32`).
- El maestro trae la salida aprobada como as-is (`R08.2.md:1512-1514`, 71 usos, `:1518`) y la
  decisión `decision/p38-verificacion-calidad` fija la rechazada → `Notificado`
  (`openspec/config.yaml:1974`, consecuencia 5 en `:1981`).
- Éxito: con este cambio en `main`, `Verificación` tiene salida y el invariante lo impone.

## Alcance

**Dentro**
- **E1** · Salida aprobada `Verificación —Liberación→ Finalizado`.
- **E2** · Salida rechazada `Verificación → Notificado` (supuestos s1-s3).
- Guardianes: invariante 3 de la unión pasa a `sinSalida = ['Finalizado']`
  (`packages/shared/src/invariantesGrafo.test.ts:177-180`); pares del catálogo (`:200-208`) y recuento
  de la unión (`:171-174`, 39 → 40); ciclo de reentrancia (`packages/shared/src/reentrancia.test.ts:191-194`:
  el componente conexo pasa a incluir `Verificación`); matriz de permisos escrita a mano
  (`apps/desk/server/permisos.test.ts:209-250`, 5×3 → 6×3); barrido de ejecución
  (`apps/desk/server/transicionesEjecucion.test.ts:302-308`), con un caso de `Liberación` **desde
  `Verificación`**, que el barrido por `t.from[0]` no alcanzaría.
- Discrepancia de numeración: `openspec/specs/transitions-equipo-nuevo/spec.md:40` dice «invariante 1»
  y el código «invariante 3» (`transitions.ts:345`). Acierta el código: el 3 es «sin salida»
  (`openspec/specs/transitions-st/spec.md:62`). Se resuelve sola, porque el delta retira esa frase.

**Fuera** (a `docs/sdd/ENTRADA.md`, dueño Gerencia)
- **E3+E4** · Guarda de obligatoriedad por tipo y lista de gases patrón → **E-082**. La regla está
  decidida (`config.yaml:1972-1973`, consecuencia 4 en `:1980`) pero no se puede construir: depende
  del compuesto que mide cada analizador, que ningún campo registra (`equipos.tipo` es texto libre,
  `packages/zoho-sync/src/db/schema.sql:194`; `public.catalogo_tipos`, `:323-328`, no tiene marca de
  familia), y sembrarlo toca datos de producción.
- **E5** · Guarda de certificado en `Liberación` desde `Verificación` (`R08.2.md:1520`) → **E-083**:
  ninguna decisión la recoge.
- Área de `Liberación` y tickets heredados (preguntas de F1B-06, `proposal.md:122-124`): E1 no depende
  de ellas.

## Supuestos (reversibles, regla de ejecución)

| # | Supuesto |
|---|---|
| s1 | E1 **amplía** `liberacion.from` a `['En Proceso', 'Verificación']`: una transición, dos orígenes (`R08.2.md:1518`; hipótesis de `blueprint-equipo-nuevo/design.md:42`). Hay precedente de varios orígenes (`transitions.ts:178`). |
| s2 | E2: id `rechazo_verificacion`, nombre «Rechazo de verificación», área `Servicio Técnico`, igual que `verificacion` y `producto_no_conforme` (`transitions.ts:353`, `:357`). |
| s3 | E2 declara `comment()` y `derivacion()`, sin motivo obligatorio: los rechazos de servicio sólo declaran comentario (`transitions.ts:234-239`), el comentario nunca es obligatorio (`:65-74`) y el guardián fija esos dos campos en todo el catálogo (`invariantesGrafo.test.ts:211-214`). |

## Capacidades

- **Nuevas:** ninguna.
- **Modificada** `transitions-equipo-nuevo`: RQ-EN-01 pasa de 5 a 6 transiciones y retira el
  «MUST NOT» sobre `Verificación` (`spec.md:39-40`) y la nota de despliegue (`:193-198`).
  `transitions-st` no cambia: su invariante 3 afirma sobre `TRANSITIONS`, y la excepción la declaraba
  sólo `transitions-equipo-nuevo`.

## Enfoque

Cambio de datos en `TRANSITIONS_EQUIPO_NUEVO` (`transitions.ts:350-361`). Regla 13: el cliente no
decide nada nuevo. `executeTransition` impone el origen (`apps/desk/server/services/ticketService.ts:126-128`),
el flujo (`:125`) y el área (`:129-131`) con el mismo catálogo compartido.

**Consecuencia observable:** `areasSiguientes('Verificación')` (`transitions.ts:327-334`) deja de
devolver lista vacía y avisa a Servicio Técnico. Hipótesis: no hace falta delta en `derivacion-avisos`,
porque el requisito ya dice que se calcula sobre el catálogo. Lo comprueba spec.

## Tamaño

Hipótesis: código ~10 líneas y pruebas ~100. Con spec, diseño, tareas y apply-progress, ~450 en total.
Cabe en **un solo lote ≤800**. Aparte van el verify-report (~350) y el archive (se mide).

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Se libera un analizador sin Verificación, porque la guarda E3 no existe | Media | Igual que en Zoho hoy, donde la regla es costumbre (`R08.2.md:1548`). E-082 |
| Desfase de citas a `transitions.ts:350-361` y a los tests | Media | Barrido de la regla de mutación 4 al cierre |
| s1 equivocado (debían ser dos ids) | Baja | Se corrige en un dato |

## Despliegue

Con este cambio en `main` se levanta el bloqueo de `archive-report.md:32`: **`main` pasa a ser
desplegable respecto de F1B-06**. Hipótesis sin verificar: pueden bloquear por su cuenta otros cambios
posteriores a lo desplegado, que no se han barrido.

## Reversión

Revertir los commits: sin migración ni datos. `Verificación` vuelve a quedarse sin salida y, con ella,
el bloqueo de despliegue.

## Criterios de éxito

- [ ] `sinSalida` de la unión es exactamente `['Finalizado']`. La prueba se pone roja si se quita
      cualquiera de las dos salidas (mutación: retirar `Verificación` de `liberacion.from` / borrar E2).
- [ ] Ticket `Equipo nuevo` en `Verificación`: `liberacion` → `200` y `Finalizado`;
      `rechazo_verificacion` → `200` y `Notificado`; usuario sólo `Comercial` → `403`.
- [ ] E-082 y E-083 escritas en `docs/sdd/ENTRADA.md`.
- [ ] Barrido de citas: 0 rotas nuevas.

## `toca_maestro: si` — por qué

M1.4 declara «Seis transiciones» (`R08.2.md:1493`) y la rama «aún no implementada» (`:1492`); al
cerrar, la aplicación tiene siete. §11.2 del expediente (`docs/sdd/R08.3_Expediente_de_cambios.md:552`)
recoge la **decisión** del nº 38, pero no la fila nueva de la tabla. La guarda de certificado de
`:1520` no aparece en §11.2 (E-083).

## Proposal question round (modo `auto`: no se pregunta, queda para revisión)

1. ¿`Liberación` desde `Verificación` es la misma transición que desde `En Proceso` (s1), o una aparte?
2. ¿El rechazo de Verificación debe exigir un motivo escrito (s3)?
3. ¿Quién ejecuta el rechazo: Servicio Técnico o Calidad (s2)?
