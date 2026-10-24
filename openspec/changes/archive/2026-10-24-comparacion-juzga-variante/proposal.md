---
tanda: F1F-05
motivo: ""
capacidad: [kpis]
maestro: ["Anexo G"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: la comparación juzga el 95 % con la variante de Zoho

## Intención

Gerencia decidió el 24/10 qué lectura juzga el 95 % de `decision/e009b-lista-indicadores` (`openspec/config.yaml:2650`):
`decision/f1f05-variante-juzga-el-95` (`openspec/config.yaml:5301-5319`; respuesta literal en `:5309`). Consecuencias
(`openspec/config.yaml:5311-5315`): el 95 % se juzga con la variante (`formula_zoho`), **por indicador y por ticket**; la
letra se publica como información, con sus diferencias explicadas por definición; cambio de código dentro de F1F-05, antes
del 16/11. La comprobación del maestro está en el Anexo G
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2957`; lista en `:2954`).

Hoy el código no lo cumple en tres puntos:

- La lectura por ticket sólo cuenta la letra: `if (contra === 'valor' && …)` (`packages/shared/src/indicadoresComparacion.ts:106` en `e1a92b59`),
  y `tickets` se cierra con ella (`packages/shared/src/indicadoresComparacion.ts:126` en `e1a92b59`). La variante sólo existe por indicador.
- La nota dice lo contrario de la decisión: «La letra de Gerencia no precisa cuál es «el 95 % de los tickets»…»
  (`packages/shared/src/indicadoresComparacion.ts:10` en `e1a92b59`), y la cabecera, que «el 95 % de la letra lo juzgan las personas» (`:2`).
- La pantalla no pinta la variante: una sola tabla con los recuentos de la letra (`apps/desk/src/lib/comparacionExportacion.ts:68-72` en `e1a92b59`;
  `apps/desk/src/components/ComparacionExportacion.tsx:50-59` en `e1a92b59`). El ensayo del 24/10 enseñó tickets 3/12 = 25 % con la letra; la
  variante, recalculada por el analista, da 13/13 (`openspec/config.yaml:5304-5306`).

`cierra: no`: F1F-05 sigue abierta por la encuesta (55) y la medición en paralelo del 16/11 al 14/12.

## Alcance

### Dentro

1. **Shared** (`packages/shared/src/indicadoresComparacion.ts`, regla invariable 13): la lectura por ticket se calcula para las
   DOS lecturas; `ResumenComparacion` gana `ticketsVariante` (S-1) y `tickets` sigue siendo la letra; `NOTA_PORCENTAJES` dice que
   el 95 % se juzga con la variante y que la letra es informativa. Sin umbral, semáforo ni veredicto.
2. **Cliente** (`apps/desk/src/lib/comparacionExportacion.ts`; el `.tsx` sólo pinta): la VARIANTE primero, rotulada como la que
   cuenta para el 95 %, por indicador y por ticket; la letra después, rotulada «informativa» (S-2, S-3, S-7).
3. **Las dos rutas** sin cambio de código: `GET /api/indicadores` (`apps/desk/server/routes/indicadores.ts:53`) y
   `POST /api/indicadores/comparacion` (`apps/desk/server/routes/indicadoresComparacion.ts:47`) ya llaman a `compararIndicadores`;
   lo que cambia en sus cuerpos está en S-6.
4. **Aceptación** con el fixture de septiembre por la ruta de comparación (S-4): variante 100 % por ticket (13/13) y por
   indicador en los ocho de tiempo.

### Fuera

- Umbral, semáforo, color o veredicto de aprobado (RQ-KP-18, `openspec/specs/kpis/spec.md:638`; maestro `R08.4.md:2956`).
- El CSV del `GET` (no lleva comparación, `apps/desk/server/routes/indicadores.ts:45-50`).
- La encuesta y los pares de la 55 de enero (`decision/f1f05-referencia-semanal-indicadores`, `openspec/config.yaml:5264`).
- Cambiar la letra o el cálculo de cualquier indicador, o de la variante.
- El `.tsx` más allá de pintar lo que la vista le da; sin pruebas de `.tsx` (F0-00).

## Capacidades

- Nuevas: ninguna.
- Modificadas: `kpis`.
  - **MODIFIED RQ-KP-16** (`openspec/specs/kpis/spec.md:560-612`): la viñeta de tickets (`:577-580`) pasa a pedir las dos
    lecturas por ticket y a decir que el 95 % se juzga con la variante; la última viñeta (`:582`) pasa a «la aplicación no decide
    el aprobado». **El bloque conserva su número de líneas** y todos sus escenarios (seis).
  - **ADDED** al final, tras RQ-KP-39 (`openspec/specs/kpis/spec.md:1634`): RQ-KP-40 (lectura por ticket de la variante y nota),
    RQ-KP-41 (la vista: variante primero, rótulos, «sin pares comparables» en la tabla de la variante) y RQ-KP-42 (aceptación de
    septiembre por la ruta de comparación).
  - RQ-KP-17, RQ-KP-18 y RQ-KP-28 (`openspec/specs/kpis/spec.md:1249`) siguen ciertos y no se tocan.

## Qué cambia en `GET /api/indicadores` (y en el `POST`)

| Parte del cuerpo | Cambio |
|---|---|
| `comparacion.ticketsVariante` | NUEVO, detrás de `tickets` y antes de `nota`, misma forma que `tickets` |
| `comparacion.nota` | Texto nuevo (variante juzga; letra informativa) |
| `comparacion.tickets`, `porColumna`, `mensaje`, `comparable`, `tolerancia` | Sin cambio |
| `periodo`, `flujo`, `tickets` del `GET`; `fichero`, `cruce` del `POST` | Sin cambio |
| CSV del `GET` | Sin cambio byte a byte (sha256 de `apps/desk/server/routes/indicadores.test.ts:271`) |

Con o sin `flujo` y periodo, la regla es la misma: el `POST` hereda el tipo por `comparacion: ResumenComparacion`
(`packages/shared/src/indicadoresExportacion.ts:27`).

## Supuestos (reversibles; a la lista semanal de Gerencia, regla E-237)

- **S-1 · Nombre.** `ResumenComparacion.ticketsVariante: { comparados, coincidentes, porcentaje }`, la misma forma que
  `tickets` (`packages/shared/src/indicadoresComparacion.ts:45`). Un ticket es comparado si tiene al menos un par comparable
  de la variante, y coincidente si TODOS ellos coinciden: el mismo criterio que hoy usa la letra.
- **S-2 · La 55 dice «sin pares comparables».** La premisa del encargo («que siga diciéndolo») es **falsa**: hoy ninguna fila
  lo dice. La frase sólo sale como `mensaje` global cuando no hay ningún par comparable
  (`packages/shared/src/indicadoresComparacion.ts:123`), y una fila con `comparados = 0` pinta «—»
  (`apps/desk/src/lib/comparacionExportacion.ts:48` en `e1a92b59`). Supuesto: en la tabla de la VARIANTE, un `porcentaje` `null` (indicador o
  tickets) se pinta con `MENSAJE_SIN_PARES` importado de `@ambientalia/shared` (`packages/shared/src/indicadoresComparacion.ts:9`);
  en la de la letra sigue «—» (`apps/desk/src/lib/comparacionExportacion.test.ts:93-98` en `e1a92b59`, intacta entonces; L2 reescribió sus líneas 95 y 98 para leer `tablas[1]` y la afirmación «—» sigue igual). Razón: Gerencia fijó que «la 55
  queda «sin pares comparables»» (`openspec/config.yaml:5271`, consecuencia en `:5290`).
- **S-3 · Rótulos.** Variante: «Variante de la fórmula de Zoho · cuenta para el 95 %»; letra: «Letra de la aplicación ·
  informativa». Sólo texto, sin color ni semáforo.
- **S-4 · Aceptación por el `POST`.** Es la ruta que usa Gerencia. El fixture se siembra con `sembrarSeptiembre`
  (`apps/desk/server/testing/septiembre2026.ts:55-63`), que no escribe `custom_fields` (`:58`), así que el `GET` no tendría
  valores de Zoho. La prueba genera EN MEMORIA un CSV desde `gerencia`, con las doce cabeceras de
  `apps/desk/server/comparacion/leerExportacion.ts:5-19` (las dos de 50·53 con la misma celda; la 55 vacía), periodo
  `2026-09-01` a `2026-09-30`. Nada a disco; el CSV de Gerencia no se copia (sin trackear, lleva clientes).
- **S-5 · Caracterizaciones sha256: cambian DOS, no tres** (corrige el brief). Cambian las de cuerpo JSON,
  `apps/desk/server/routes/indicadores.test.ts:263` y `apps/desk/server/routes/indicadoresComparacion.test.ts:326`; se recalculan
  en el commit que nombra `decision/f1f05-variante-juzga-el-95` (molde RQ-KP-39). La del CSV (`indicadores.test.ts:271`) **NO**
  cambia y queda como guardián de que el CSV no se tocó. La prueba C13 (`packages/shared/src/indicadoresComparacion.test.ts:136-141`),
  que exige «no precisa» en la nota, se actualiza por la misma decisión.
- **S-6 · Cuerpos.** Sólo cambian `comparacion.ticketsVariante` (nuevo) y `comparacion.nota` (texto); ver la tabla de arriba.
- **S-7 · Fila de tickets.** Como hoy en la letra (`apps/desk/src/components/ComparacionExportacion.tsx:57` en `e1a92b59`), la de la variante
  pinta comparados, coinciden y porcentaje; «Difieren» y «Sin comparar» por ticket quedan vacíos: el cliente no resta (regla 13).
  Si Gerencia los quiere, los añade el servidor.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Insertar líneas antes de `:90` en `indicadoresComparacion.ts` desfasa `openspec/specs/kpis/spec.md:1160` y `openspec/config.yaml:5290` (que cita `:9`) | Media | `ticketsVariante` en la misma línea `:45`; el resto dentro de `compararIndicadores`; barrido de la regla de mutación 4 al cerrar |
| MODIFIED de RQ-KP-16 desplaza las citas `spec.md:NNNN` posteriores | Alta | Mismo número de líneas; lo nuevo como ADDED al final |
| La frase por fila confunde «sin valor de Zoho» con «sin pares» | Baja | El `mensaje` global sigue distinguiendo los dos casos (`indicadoresComparacion.ts:123`); la fila dice algo literalmente cierto |
| Un lector externo del JSON (hipótesis: no hay ninguno fuera de la pantalla) | Baja | `tickets` no cambia; sólo se añade una clave |
| El `.tsx` queda sin red | Segura | Todo lo decidible en `lib/comparacionExportacion.ts`, probado |
| Plazo del 16/11 | Baja | Cambio pequeño; la medición semanal empieza ese día |

## Mutaciones previstas (cada una debe poner algo en rojo en apply)

1. La lectura por ticket vuelve a contar sólo la letra (`ticketsVariante` = `tickets`).
2. La variante cuenta como letra en la vista (la tabla de la variante lee `k.comparados` en vez de `k.variante.comparados`).
3. La vista pinta la letra primero, o la letra con el rótulo de la variante.
4. La nota sigue diciendo que el 95 % no está precisado.
5. Un valor del fixture alterado fuera de ±1 rompe el 100 % por ticket.
6. Intercambiar `tickets` y `ticketsVariante`: `tickets` deja de ser la letra.
7. Un ticket de la variante coincide si coincide ALGUNO de sus pares, no todos.
8. La tabla de la letra pinta «sin pares comparables», o la de la variante pinta «—».
9. Redefinir en el cliente la frase de `MENSAJE_SIN_PARES` con otro texto en vez de importarla.
10. Meter la comparación en el CSV del `GET`: sha256 `indicadores.test.ts:271` en rojo.

## Plan de intentos (tope 800 por intento, válvula 720; medida `git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin trackear)

| Intento | Contenido | Estimación |
|---|---|---|
| I1 | Propuesta + spec delta (MODIFIED RQ-KP-16, ADDED RQ-KP-40 a -42) | ≤ 400 |
| I2 | Diseño + tareas | ≤ 450 |
| I3 | Apply: shared + cliente + `.tsx` + aceptación + dos sha256 + barrido de citas | ≤ 600 |
| I4 | Verify (el informe cuenta, ~350) | ≤ 450 |
| I5 | Archive: la mudanza fuera del techo; lo revisable (fusión + informe) ≤ 800, medido antes | — |

Si I3 pasa de 720 en la estimación de tareas, se parte en shared+aceptación y cliente.

## Plan de vuelta atrás

Revertir los commits de la tanda: la nota y la pantalla vuelven a la letra sola. Sin datos, sin migración, sin escritura.

## Dependencias

Ninguna técnica. La repetición del ensayo de septiembre en producción la hace Gerencia tras el despliegue.

## Criterios de éxito

- [ ] `ticketsVariante` en el `GET` y en el `POST`; `tickets` sin cambio; nota nueva.
- [ ] La pantalla pinta la variante primero, con su rótulo; la 55 de la variante dice «sin pares comparables».
- [ ] Septiembre por el `POST`: variante 13/13 = 100 % por ticket y 100 % en 47 (11), 49 (9), 50·53 (11), 51 (12), 54, 57, 58 y
      59 (9 cada uno).
- [ ] CSV del `GET` idéntico byte a byte; dos sha256 recalculadas citando la decisión; las diez mutaciones en rojo;
      `npm test`, `npm run typecheck` y `npm run lint` en verde.

## Ronda de preguntas (modo `auto`)

El preflight es `auto` (`openspec/config.yaml:22-30`) y ninguna duda cumple los criterios de parada: no cambia el alcance, no
cuesta dinero, no toca producción y todas tienen supuesto razonable. S-1 a S-7 van a la lista semanal.

## Tareas de persona — fuera del recuento

Archivar NO las da por hechas.

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Corregir, si procede, S-1 a S-7 | Gerencia | Lista semanal de supuestos (regla E-237) |
| Repetir la comparación de septiembre (01/09 a 30/09) y pasar el «Sólo en Desk» | Gerencia | `openspec/config.yaml:5309` |
| Probar en la aplicación la tabla de la variante | Gerencia / analista | Lista acumulada de pruebas en la app |
