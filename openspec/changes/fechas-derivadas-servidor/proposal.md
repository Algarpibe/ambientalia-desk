---
tanda: F1A-07
motivo: ""
capacidad: [trazas, transitions-st]
maestro: ["M1.10"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `fechas-derivadas-servidor` (F1A-07 · IV-2)

**Fase:** `sdd-propose` · **Árbol:** `f1a-07-r1`, base `4976787`. **Toda cita `ruta:línea` se lee contra
`4976787`**; en cuanto el `apply` mueva líneas, este documento es caso B de la regla de mutación 4.
**Procedencia:** fila F1A-07, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:146` ·
`decision/iv2-fechas-derivadas`, opción (a), `docs/sdd/Decisiones_Gerencia_2026-09-10.md:225-279` ·
maestro M1.10, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1756-1757`,
con la regla de fondo «no admite excepciones» en `:1755`. Exploración: `exploration.md` de esta carpeta.
Ronda de preguntas cerrada: Engram obs. #835 (tres decisiones; no se reabren).
**`cierra: si`**: la fila deja a la tanda «recalcular o respetar», ya decidido (D-1), y el barrido de
consumidores, ya hecho (exploración §4); el hueco de la vía sin fuente tiene dueño (§4). **`toca_maestro`**: §6.

> **⚠️ Desviación del prompt de lanzamiento: `capacidad` añade `transitions-st`.** El prompt fijaba
> `[trazas]`. Hace falta delta en `transitions-st` porque RQ-TS-08 declara `buildTransitionPlan` «la
> única validación de campos» (`openspec/specs/transitions-st/spec.md:220-222`) y esta tanda valida una
> fecha fuera de él; y porque la tabla de guardas de RQ-TS-06 (`:156-164`) y la escalera de §3.8
> (`:712-717`) ganan una guarda de escalón C. RQ-TS-10 (`:261-277`) NO cambia: no dice «crudo».

---

## 1 · Intención

Hoy las tres fechas derivadas se calculan **sólo en el navegador** (`apps/desk/src/lib/valoresTransicion.ts:49-79`),
con la zona del proceso (`diaLocal`, `:30-36`). El servidor sólo exige que lleguen
(`apps/desk/server/transitionExec.ts:77`), las lleva a su columna tal cual (`:90-91`) y guarda en el
historial el `values` crudo (`packages/zoho-sync/src/db/repo.ts:285`). Bajo la regla invariable 13, punto
2, eso no es un espejo: es la guarda, y vive en el cliente.

No es cosmético: `Fecha Remisión Entrada` abre el bodegaje de entrada (`packages/shared/src/bodegaje.ts:59-65`),
y el KPI la lee del **historial** (`bodegaje.ts:186`), por regla escrita (`packages/shared/src/reentrancia.ts:24`).

**Resultado buscado:** el servidor impone las tres fechas cuando tiene fuente, en la columna **y** en el
historial; una sola fórmula, en `packages/shared`, con la zona fijada; el cliente la consume para prellenar.

## 2 · Decisiones

| # | Decisión | Origen |
|---|---|---|
| D-1 | **Recalcular siempre** cuando hay fuente: se ignora el navegador y lo que ya hubiera en la columna. El único escritor previo es el sync antes de `managed_by_app` (`packages/zoho-sync/src/db/repo.ts:59`, `:271`); en Desk el campo con valor sale bloqueado (`apps/desk/src/components/TransitionPanel.tsx:32-36`) | obs. #835.1 |
| D-2 | La derivación vive en `packages/shared` (regla 13, punto 1); el prellenado del cliente pasa a ser espejo legítimo porque la imposición queda probada (punto 3). `diaLocal` desaparece | obs. #835.2 |
| D-3 | **Sin fuente**, el servidor acepta lo tecleado si es una fecha `YYYY-MM-DD` real; si no, `422` de contenido. El `422` por falta de remisión NO se hace aquí (§4) | obs. #835.3 |

**Decisiones propias de esta propuesta — objetables al aprobarla:**

- **P-1 · El historial guarda el valor derivado, no el del navegador.** Es consecuencia de (a): si
  `ticket_transitions.values` conservara lo que mandó el navegador, el servidor no lo habría ignorado, y
  el KPI —que lee el historial, no la columna— seguiría expuesto. Cambia RQ-TZ-03
  (`openspec/specs/trazas/spec.md:70-83`), que hoy dice «sobre lo que llegó del cliente»; y RQ-TZ-11
  (`openspec/specs/trazas/spec.md:200-212`) pasa de «se proponen» a «las impone el servidor».
- **P-2 · Las tres etiquetas se descartan del `values` de una transición que no las declara.** Hoy una
  petición puede meter `Fecha Remisión Entrada` en cualquier transición y queda en el historial, donde
  `periodosDeBodegaje` la lee en cualquier paso (`bodegaje.ts:174`, `:186`). Ignorar el navegador para esos
  tres campos incluye ese canal. Sólo esas tres: el resto del `values` no se toca.
- **P-3 · `dia()` de `bodegaje.ts:129-133` consume la función nueva.** Hoy es otra noción de «día de un
  valor» (`toISOString`, día UTC). Así queda una sola en el paquete: una `YYYY-MM-DD` sigue igual y un
  instante pasa a leerse en Bogotá. *Hipótesis:* hoy ningún escritor deja instantes en campos de fecha
  (el `<input type="date">` manda `YYYY-MM-DD`, `TransitionPanel.tsx:254`), así que el cambio no mueve
  ningún bodegaje real.
- **P-4 · RETIRADA** (2026-09-21, tras el diseño). Proponía `process.env.TZ ??= 'UTC'` en `vitest.config.ts:7`;
  la demostración de zona vive ahora dentro de la suite y `vitest.config.ts` no se toca (§5).

## 3 · Enfoque

**3.1 · Módulo nuevo en `packages/shared`** (nombre a criterio del diseño, p. ej. `fechasDerivadas.ts`),
apto para navegador, sin dependencias de Node:

- La zona fijada, `'America/Bogota'` (precedente de servidor: `packages/zoho-sync/src/db/mappers.ts:164-176`).
- **Día en zona de un valor.** ⚠️ **La trampa que debe evitar, y el diseño la nombra:** una cadena
  solo-fecha `YYYY-MM-DD` es una fecha de calendario, **no un instante**: `new Date('2026-09-09')` es
  medianoche UTC, que en Bogotá es el día 8. Por eso: solo-fecha → paso directo, validado como fecha
  real; instante con desplazamiento → día en Bogotá vía `Intl.DateTimeFormat` (con `formatToParts`, sin
  depender del formato de un locale); fecha-hora **sin** desplazamiento → `null`, porque `Date.parse` la
  lee en la zona del proceso, que es justo lo que se quiere quitar.
- El mapa etiqueta → fuente de las tres fechas, y una función **pura** que las deriva de `createdAt`, las
  remisiones vigentes y el instante del último `escalado_a_revision`.
- Una función pura de **valores efectivos**: para cada una de las tres que la transición declara,
  derivada si hay fuente; si no, lo tecleado validado (error de contenido si no es fecha real); y las no
  declaradas, fuera (P-2).

**3.2 · Servidor**, en `executeTransition` (`apps/desk/server/services/ticketService.ts:112`), sólo si
los campos de la transición incluyen alguna de las tres (`packages/shared/src/transitions.ts:191`, `:219`, `:221`):

- Tras las guardas B (`:124-129`) y antes del plan (`:131`), leer las fuentes: `current.row.created_time`,
  `listRemisionesByTicket` (`apps/desk/server/db/remisiones.ts:76-79`) e `instanteUltimaTransicion(db, id,
  'escalado_a_revision')` (`apps/desk/server/db/fechasTicket.ts:22-35`), la misma llamada que ya hace el
  detalle (`apps/desk/server/routes/tickets.ts:142`). **La lectura no es guarda**: no contesta nada.
- Pasar los valores efectivos a `buildTransitionPlan` (`:131`) —el obligatorio de `transitionExec.ts:77`
  deja de depender del navegador— y a `applyTransition` (`:153`), con lo que la columna **y**
  `ticket_transitions.values` guardan el derivado (P-1).
- **La fecha inválida es escalón C** de §3.8: mismo `422 { errors }` que `:132`, detrás de los
  obligatorios (sub-orden «presencia antes que validez», `openspec/specs/transitions-st/spec.md:729-731`). Su posición
  frente a la guarda de derivación (`ticketService.ts:136-140`) la fija una prueba de posición (regla de
  mutación 1).
- **Ventaja:** `transitionExec.ts` (38 citas vivas en 14 ficheros) y `repo.ts` quedan sin tocar. El paso sin
  botón de las remisiones tampoco cambia: aplica con `values` vacío
  (`apps/desk/server/db/estadoPorRemision.ts:52-60`).
- **Restricción que el diseño DEBE resolver:** `ticketService.ts` tiene **125** citas vivas en 32
  ficheros. O el cambio se hace **en sitio**, sin mover líneas, o se presupuesta el barrido completo de la
  regla de mutación 4. Lo decide el diseño, midiendo. *(«Vivas»: medidas con `grep` el 2026-09-21, fuera
  de `openspec/changes/archive/` y de esta carpeta.)*

**3.3 · Cliente.** `valoresConocidos` consume la función compartida con la misma semántica que el
servidor: derivado si hay fuente; si no, lo de la columna; si no, vacío para teclear. Las pruebas que
fijan la regla vieja **se invierten**, y es lo esperado: `valoresTransicion.test.ts:33-40` y `:117-123`
(«lo que el ticket ya guarda gana») y `:100-104` (su premisa es «el día del navegador»).

**3.4 · La tercera noción, nombrada y fuera.** `convert` recorta con `slice(0, 10)` (`transitionExec.ts:33`).
Para las tres etiquetas es identidad —el valor efectivo ya llega `YYYY-MM-DD`—; unificarlo para las
demás fechas cambia todas las transiciones y no es IV-2.

## 4 · Huecos residuales — con dueño, para que nadie los dé por cerrados ni los registre como nuevos

- **`Fecha Remisión Entrada` tecleada cuando no hay remisión de entrada en Desk.** Dueño: **F1B-03**
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:158`: guarda «`Habilitar Servicio` exige
  remisión de entrada vigente» y recuento previo). **La línea de `cierra` del `archive-report.md` DEBE
  volver a nombrarlo con ese dueño.** No es un desvío vivo nuevo.
- **`Fecha Revisión Informe` tecleada en tickets escalados en Zoho**, que no tienen fila en Desk
  (`fechasTicket.ts:18-20`). Lo que se sabe: no tiene consumidor de KPI (`INDICADORES_G6`,
  `reentrancia.ts:78`, no la incluye; exploración §4). **Sin destino**, y no se le inventa.
- **E-021** (`yymmdd`, `packages/shared/src/ticketCreate.ts:7-10`; `docs/sdd/ENTRADA.md:279`): la
  función de día en zona sería su arreglo natural. Aquí sólo se anota.
- **E-022** (`docs/sdd/ENTRADA.md`, registrada al contrastar P-2): el mismo canal de P-2 existe para los
  **demás** operandos de bodegaje (`bodegaje.ts:58-80`). P-2 lo cierra sólo para las tres fechas de IV-2; el
  arreglo general cambia qué registra toda transición y no es de esta tanda. Sin destino.
- **E-023** (`docs/sdd/ENTRADA.md`, registrada al escribir la spec): las citas a `ticketService.ts` están
  caducas en masa (medida del analista: 76 de 124 sin ancla, 41 en specs vivas y `config.yaml`, y es un
  suelo). Esta tanda sólo reancla los tres bloques de `transitions-st` que reescribe su delta; el resto,
  reparación por bloques en `main` que decide Gerencia.

## 5 · Pruebas (`strict_tdd`) y la demostración de zona horaria

**Hecho verificado que cambia el criterio del prompt:** `vitest.config.ts:7` asigna `TZ = 'UTC'` y pisa
un `TZ` externo (sonda del orquestador, `exploration.md`, «Contraste», punto 1). «Verde con
`TZ=America/Bogota`» no se obtiene hoy con una variable de entorno.

- **P-4 · RETIRADA por el analista el 2026-09-21, tras el diseño.** `vitest.config.ts` **no se toca**.
  El diseño encontró el mecanismo dentro de la suite: `apps/desk/src/lib/remisionResultado.test.ts:15-16`
  ya corre un fichero en Bogotá con `vi.stubEnv('TZ', …)`, y se autocomprueba en `:23`. La demostración
  pasa a ser **permanente**: `describe.each` sobre `UTC` y `America/Bogota`, en cada `npm test` y en el CI.
- **Tres condiciones del analista**, porque el precedente fija UNA zona por fichero y aquí se cambia de zona
  ENTRE BLOQUES dentro del mismo proceso:
  1. **Cada bloque lleva su PROPIA autocomprobación**, antes de mirar nada: en Bogotá, el parseo ingenuo de
     una `YYYY-MM-DD` retrocede un día; en UTC, no. Un bloque que no demuestra que su zona está puesta no vale.
  2. **`vi.stubEnv` en el `beforeAll` de cada bloque y `vi.unstubAllEnvs()` en su `afterAll`**, para que
     ninguna zona se escape al bloque siguiente.
  3. **La fase roja queda escrita en `apply-progress`** con comando y salida: la prueba contra la
     implementación vieja, con el bloque UTC en **rojo** y el de Bogotá en verde **en falso**. Después de
     implementar, los dos en verde.
- **Alternativas descartadas:** `process.env.TZ ??= 'UTC'` en la configuración (tocaba un fichero con 37
  citas vivas en 15 ficheros, y un `TZ` puesto en la shell correría toda la suite en otra zona) y un script
  con `tsx` fuera de vitest (un segundo arnés que ni `npm test` ni el CI corren).
- **La demostración, literal:** el instante `2026-09-10T00:30:00Z` da `2026-09-09` en `Fecha creación
  ticket` y en `Fecha Revisión Informe`, en los dos bloques.

**Criterios mínimos de prueba** (el diseño los amplía):

1. Valor del navegador DISTINTO del derivado, en cada una de las tres → se guarda el derivado en la
   columna **y** en `ticket_transitions.values`.
2. `Fecha Remisión Entrada` = `fecha` de la remisión de entrada vigente más reciente, tal cual.
3. Con fuente, la transición pasa aunque el navegador **no** mande esos campos.
4. Sin fuente: lo tecleado válido pasa; lo inválido (incluido un día que no existe) da `422`.
5. Una de las tres enviada en una transición que no la declara no llega al historial (P-2).
6. `dia()` con un instante en la ventana 00:00–04:59 UTC da el día de Bogotá; una `YYYY-MM-DD` no cambia.
7. Una solo-fecha `YYYY-MM-DD` nunca se desplaza de día, en ninguna zona del proceso.

**Producción — `node:22-alpine`** (`Dockerfile:2` y `:10`):

- **Tarea del `apply`:** `docker run --rm node:22-alpine node -e "…"` con el instante de arriba, esperando
  `2026-09-09`. Si la máquina no tiene docker, se escribe «no ejecutable», nunca «verde».
- **Comprobación de persona** (regla del ciclo 1: fuera del recuento; archivar no la da por hecha).
  Dueño: quien tenga la consola de EasyPanel. Qué: en el contenedor real, el mismo `node -e`, más
  `Intl.DateTimeFormat().resolvedOptions().timeZone`, que responde además la hipótesis de E-021. Dónde
  queda escrito: en E-021 de `docs/sdd/ENTRADA.md` y en el `archive-report.md`.
- *Hipótesis:* las compilaciones oficiales de Node traen ICU completo con su propia base de zonas, así
  que no dependerían del `tzdata` de Alpine.

## 6 · Al cerrar — parte del alcance

- **Regla de mutación 3:** enumerar por escrito cada decisión del cliente sobre estas fechas —qué
  prellena, qué bloquea, qué deja teclear— y la línea del servidor que la impone.
- **Regla de mutación 4:** barrido de `valoresTransicion.ts` (3 citas vivas en 2 ficheros),
  `ticketService.ts` (125 en 32) y `bodegaje.ts` (14 en 8); `vitest.config.ts` ya no (P-4 retirada); `transitionExec.ts` sólo
  si se toca. Las fechadas son caso B. Ya hay candidatos medidos: la ficha IV-2 de `openspec/config.yaml`
  y el §3.4 de `trazas` citan el bloque de entrada del bodegaje con un rango desplazado una línea.
- **Anclas de los deltas al archivar** (indicación del analista, 2026-09-21): las citas de los bloques
  `MODIFIED` y `ADDED` se vuelven a comprobar contra el árbol de ESE momento, no contra `4976787`.
  `ticketService.ts:130` y `:132` no se mueven, pero cambian de contenido: toda cita que las nombre tiene
  que describir el contenido nuevo. Es lo que falló en F1B-10 (E-023, `docs/sdd/ENTRADA.md`).
- **IV-2 pasa a CERRADO a la vez** en `openspec/config.yaml:423-477` y en `CLAUDE.md:338` (su fila,
  que aún dice «PUNTO ABIERTO PARA GERENCIA. Ninguna tanda lo cubre», caducada desde el 17/09:
  `openspec/config.yaml:439`). El recuento «**Cinco** desvíos vivos» (`CLAUDE.md:308`, lista en `:324-325`) baja a
  cuatro, y ese párrafo **se actualiza, no se reescribe**: caso B aplicado al recuento, como ya hace él.
- **Maestro (`toca_maestro: si`).** M1.10 dice que hoy se derivan en el navegador y que el servidor
  «ignora lo que llegue del cliente para esos tres campos»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1756`); con la vía sin fuente eso
  deja de ser literalmente cierto. La corrección va como **entrada 16** de
  `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, en texto listo para pegar, con el precedente de las
  entradas 14 y 15 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:704`, `:790`). **No se edita el
  `.docx`** y la R08.3 no se toca.

## 7 · Fuera de alcance

- Los `.tsx` (fuera de la red de pruebas por F0-00; no se propone `jsdom` ni `@testing-library`).
- IV-9 y el color de las esperas; cualquier otra fecha derivada; la R08.3; E-021 (sólo se anota).
- El `422` por falta de remisión de entrada (F1B-03) y el recorte de `transitionExec.ts:33` (§3.4).

## 8 · Áreas afectadas

| Área | Impacto |
|---|---|
| `packages/shared/src/<módulo nuevo>.ts` + prueba + `index.ts` | Nuevo: zona, día en zona, derivación, valores efectivos |
| `packages/shared/src/bodegaje.ts` | `dia()` consume la función nueva (P-3) |
| `apps/desk/server/services/ticketService.ts` | Lectura de fuentes y valores efectivos en `executeTransition` |
| `apps/desk/src/lib/valoresTransicion.ts` + prueba | Consume la función compartida; se va `diaLocal` |
| `openspec/specs/trazas`, `openspec/specs/transitions-st` | Deltas: RQ-TZ-03, RQ-TZ-11; RQ-TS-06, RQ-TS-08 y §3.8 |
| `CLAUDE.md`, `openspec/config.yaml`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md` | Cierre de IV-2 y entrada 16 |

## 9 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Mover líneas de `ticketService.ts` desfasa hasta 125 citas | Alta | Edición en sitio o barrido presupuestado (§3.2) |
| El navegador no tenía la fuente que el servidor sí tiene: lo tecleado se descarta sin aviso | Baja | Es lo que decide (a); la respuesta devuelve el ticket con el valor impuesto |
| Un bloque de zona que no cambia de zona pasa en verde sin probar nada | Media | Autocomprobación propia en cada bloque de `describe.each` (§5, condición 1) |
| `Intl` con zona no funciona en Alpine | Baja | Tarea docker + comprobación de persona (§5) |
| Pruebas viejas que se invierten leídas como regresión | Media | §3.3 las nombra; la fase roja se escribe antes |

## 10 · Plan de vuelta atrás

Revertir los commits de la tanda. No hay migración ni cambio de esquema. Lo escrito mientras tanto son
fechas `YYYY-MM-DD` válidas —las derivadas— en columnas `date` (`packages/zoho-sync/src/db/schema.sql:32`)
y en el historial: revertir no deja nada que reparar.

## 11 · Presupuesto (techo 800 por intento)

- **Apply, código + pruebas:** ~420–520 (módulo y pruebas ~220, servidor y pruebas HTTP ~190, cliente
  ~50, `bodegaje` ~20). **Cierre documental:** ~75–135 (0–60 de barrido según §3.2).
  **Total del apply: ~500–650.**
- **`verify-report.md`, sumando obligatorio aparte:** 186–358 por precedentes. **Apply y verify no caben
  juntos en 800:** van en intentos distintos. El `archive` necesita techo propio (regla del ciclo 2).
- La fila tasa la tanda como «S (a confirmar)» (`plan:466`); *hipótesis:* esta estimación la acerca a M.

## 12 · Criterios de éxito

- [ ] Los siete criterios de prueba de §5, en verde, con su fase roja registrada.
- [ ] La demostración de zona dentro de la suite: contra la vieja, bloque UTC rojo y bloque Bogotá verde
      en falso; contra la nueva, los dos verdes; cada bloque con su autocomprobación, y la fase roja con salida.
- [ ] Tarea docker ejecutada o marcada «no ejecutable»; comprobación de persona declarada aparte.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde; `transitionExec.ts` y `repo.ts` sin diff.
- [ ] Reglas de mutación 3 y 4 hechas por escrito; IV-2 CERRADO en `config.yaml` y `CLAUDE.md` a la vez.
- [ ] Entrada 16 en `F0-01_Correcciones_para_el_maestro.md`.
- [ ] El `archive-report.md` nombra en su línea de `cierra` el hueco de `Fecha Remisión Entrada` → F1B-03.
