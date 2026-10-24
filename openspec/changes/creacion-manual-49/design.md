# Diseño: la creación del 49 en el fixture de septiembre es el campo manual

Tanda F1F-05 (`cierra: no`). Entradas: `proposal.md` (S-1 a S-5) y `specs/kpis/spec.md` (MODIFIED RQ-KP-38 y RQ-KP-42).
Decisión: `decision/f1f05-creacion-del-49-campo-manual` (`openspec/config.yaml:5321-5344`). Las líneas citadas se leyeron en el
worktree sobre `186c2fe4`; las que el apply cambia de contenido llevan el ancla «en `186c2fe4`».

## Enfoque técnico

Sólo datos de prueba. La aplicación ya calcula la variante del 49 desde el campo manual: la columna
`fecha_creacion_ticket` (`packages/zoho-sync/src/db/rows.ts:103`) entra en el hito «Fecha creación ticket»
(`apps/desk/server/indicadores.ts:13`, leída en `apps/desk/server/indicadores.ts:72`) y la fórmula cuenta lunes a viernes
hasta la revisión, o da sin dato si falta (`packages/shared/src/indicadores.ts:190-193`). Lo que está mal es el fixture: siembra
la misma fecha en `created_time` y en `fecha_creacion_ticket` (`apps/desk/server/testing/septiembre2026.ts:60` en `186c2fe4`).
Se separan las dos fechas y se corrigen las celdas del 49 de Gerencia con la referencia regenerada.

**Regla de colocación (mutación 4).** `septiembre2026.ts`, las dos pruebas y la spec viva se editan EN SU LÍNEA: no se
inserta ni se borra ninguna línea, así que ningún número de línea citado cambia.

## Flujo de datos

    TICKETS_SEPTIEMBRE[i].creado ──────────────► created_time ($5)          (población, prueba del 998)
    TICKETS_SEPTIEMBRE[i].fechaCreacionTicket ─► fecha_creacion_ticket ($8) ─► hito «Fecha creación ticket» ─► formulaZoho del 49
    TICKETS_SEPTIEMBRE[i].gerencia['49'] ──────► celda de Gerencia (RQ-KP-38 directa; RQ-KP-42 vía CSV en memoria)

## Decisiones

### D1 · Forma y sitio del campo

`fechaCreacionTicket: string | null`, inmediatamente detrás de `creado` en las tres listas. Ediciones, todas en sitio:

| Línea de `apps/desk/server/testing/septiembre2026.ts` | Cambio |
|---|---|
| `:11` | `creado: string; fechaCreacionTicket: string \| null; cerrado: string` |
| `:19` | `'fechaCreacionTicket'` detrás de `'creado'` en `CLAVES_DEL_FIXTURE` |
| primera línea de cada ticket (`:23`, `:25`, … `:47`) | `fechaCreacionTicket: …` detrás de `creado: …`; igual a `creado` en nueve; `'2026-05-20'` en 940 (`:27`), `'2026-05-21'` en 941 (`:29`), `null` en 957 (`:31`) y en 972 (`:39`) |
| `:28`, `:30`, `:40` | `'49'`: 15 → 6 (940), 15 → 5 (941), 2 → `null` (972). 957 (`:32`) ya es `null` |
| `:6` | al final de la línea: `fechaCreacionTicket` es el campo manual «Fecha creación ticket», no `creado`; `null` si viene vacío (`decision/f1f05-creacion-del-49-campo-manual`) |
| `:52` | «`fecha_creacion_ticket` = creación» pasa a «`fecha_creacion_ticket` = `fechaCreacionTicket` (el campo manual)»; `:53` no cambia |
| `:60` | el 9.º valor pasa de `t.creado` a `t.fechaCreacionTicket`; el 5.º (`${t.creado}T17:00:00Z`) se queda |

`:58` (lista de columnas del `INSERT`) no cambia: la columna ya está. Los comentarios `:3-8` siguen siendo seis líneas.

| Opción | Decisión |
|---|---|
| `string \| null` explícito en los trece | **Elegida**: es la forma de todas las fechas opcionales del tipo (`:12-13`); la clave existe en los trece y la prueba de claves la ve |
| Clave opcional, omitida en 957 y 972 | Rechazada: `undefined` llegaría como parámetro del `INSERT` (terreno sin probar, hipótesis) y una ausencia no se revisa campo a campo |
| Derivar de `creado` con un mapa de excepciones | Rechazada: segunda fuente del mismo dato; la referencia trae el campo ticket a ticket |
| Cambiar `creado` por la fecha manual | Rechazada: `creado` es `created_time`, que la referencia no trae; 957 y 972 se quedarían sin creación |
| Respaldo a `created_time` en `packages/shared` si el manual falta | Rechazada: la decisión dice que la aplicación está bien y que el campo vacío es revisión futura, fuera de F1F-05 |

### D2 · Pruebas: dos cifras en su línea

`apps/desk/server/routes/indicadoresSeptiembre.test.ts:43`: `['49', '49', '49', 9]` → `8`.
`apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts:23`: `['49', 9]` → `['49', 8]`. Ninguna prueba nueva: la
aceptación existente ya discrimina (D3). La del 998 (`apps/desk/server/routes/indicadoresSeptiembre.test.ts:36-39`) mira
`creado` y no cambia (S-5).

### D3 · Rojo primero, verde y mutaciones

| Paso | Qué se edita | Resultado esperado |
|---|---|---|
| Rojo | D1 salvo `:60`, `:6` y `:52`; D2 | RQ-KP-38, indicador 49 (`apps/desk/server/routes/indicadoresSeptiembre.test.ts:42-53`): 8 con valor, discrepancias `sep-03: Gerencia 6, Desk 15` y `sep-04: Gerencia 5, Desk 15`. RQ-KP-42: `ticketsVariante` `{ 13, 11, 84.6 }` en vez de 13/13 (`apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts:64-67`); 49 con 8 comparados y 6 coincidentes (`:69-72`); las ocho mutaciones por celda (`:80-87`) dan 10 coincidentes, no 12. El resto, verde (la de claves también, porque `:19` ya lleva la clave) |
| Verde | `:60` | Todo verde; luego `:6` y `:52`, sin efecto |
| M1 | `:60` vuelve a `t.creado` | Rojo en 940 y 941, igual que el paso rojo. El 972 NO lo caza: su celda de Gerencia es `null` y no se compara (filtro de `apps/desk/server/routes/indicadoresSeptiembre.test.ts:47`; celda vacía en el CSV de RQ-KP-42) |
| M2 (regla 2) | quitar `'fechaCreacionTicket'` de `:19` | Rojo en la prueba de claves (`apps/desk/server/routes/indicadoresSeptiembre.test.ts:55-63`) en los trece |

La cifra 84.6 coincide con el ensayo de producción del 24/10 (`openspec/config.yaml:5324-5325`). Aritmética de lunes a viernes
hasta el 28/05: del 07/05 salen 15, del 20/05 salen 6 y del 21/05 salen 5. La mutación 1 de la regla (posición) no aplica: no
hay guarda nueva.

### D4 · Regla invariable 13 y regla de mutación 3

No se toca `apps/desk/src` ni `packages/`: el cliente no gana ni pierde ninguna decisión, así que no hay tabla de decisiones
que enfrentar al servidor. La regla de dominio del 49 sigue en `packages/shared/src/indicadores.ts:54` y `:190-193`, sin cambio.

### D5 · Barrido de la regla de mutación 4

Ninguna línea se desplaza (D1, D2, S-2), así que se comprueba qué AFIRMA cada cita, no sólo dónde cae:

- **Vivas, caso A:** `openspec/specs/kpis/spec.md:1776` (cita `:55-63`, el sembrador) sigue cierta.
  `openspec/config.yaml:5335` nombra el fichero sin línea.
- **Archivadas, caso B (no se tocan):** en la carpeta archivada de `comparacion-juzga-variante`, el `design.md` (línea 111,
  ids sintéticos en la 60: sigue cierta), el `proposal.md` (línea 97: sembrador y lista de columnas), la spec delta (línea 199)
  y el `verify-report.md` (línea 61, `idDe`); en la de `poblacion-cierre-variante-47-51`, el `verify-report.md` (línea 75, los
  trece). Las que dicen «49 → 9» o describen la siembra de `t.creado` son ciertas de su fecha.
- **Pruebas citadas desde el archivo:** de `apps/desk/server/routes/indicadoresSeptiembre.test.ts`, las líneas 30, 36, 42 y 55;
  `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts` no tiene citas archivadas. Ninguna cambia de sitio.
- **De este cambio, al cerrar:** `openspec/changes/creacion-manual-49/proposal.md:26` describe la línea 60 del fixture como hoy
  (dos veces `t.creado`): tras el apply se ancla «en `186c2fe4`» en la misma línea. Sus demás citas al fixture
  (`openspec/changes/creacion-manual-49/proposal.md:38-41`) nombran lo que se edita y siguen ciertas.

Al cerrar se repite `grep -rnoE "septiembre2026\.ts:[0-9]+(-[0-9]+)?"` y un segundo pase por las abreviadas de los ficheros
que citan el módulo.

## Ficheros

| Fichero | Acción |
|---|---|
| `apps/desk/server/testing/septiembre2026.ts` | Modificar ~20 líneas en sitio (D1) |
| `apps/desk/server/routes/indicadoresSeptiembre.test.ts` | Modificar `:43` |
| `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts` | Modificar `:23` |
| `openspec/specs/kpis/spec.md` | En el archive: `:1612`, `:1781`, `:1793`, en sitio |

Estimación del apply: ~44 líneas de diff más su informe; un solo lote, lejos de 800.

## Matriz de amenazas

N/A: sin enrutado, shell, subprocesos, automatización de VCS/PR, clasificación de ejecutables ni integración de procesos.

## Migración / despliegue

Sin migración, datos ni código de producción. Nada que desplegar.

## Riesgos y preguntas abiertas

- Transcripción de las siete celdas: la referencia no está en el worktree; la fuente es la tabla del `proposal.md`, y los 49
  nuevos cuadran con la aritmética de D3.
- Sin preguntas abiertas.
