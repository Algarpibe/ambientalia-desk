---
tanda: F1A-03
motivo: ""
capacidad: [transitions-equipo-nuevo, hojas-vida, gases-patron]
maestro: ["M1.4", "C12", "nº 38"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: guarda de Verificación por gas patrón y certificado de fábrica en «Liberación» (F1A-03, segunda parte)

Base `f5255d2`. Exploración en `openspec/changes/verificacion-gas-patron-certificado/exploration.md` (Engram #1218).
Modo `auto` (producción, `CLAUDE.md` «Regla de ejecución»): no hay ronda de preguntas; los supuestos s1…s12 son la
superficie revisable y ninguno es PARADA (se razona en «Supuestos»).

## ¿Cierra la fila? — `cierra: si`

| Fuente | Qué pide | Estado tras este cambio |
|---|---|---|
| Fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:142` | Salidas aprobada/rechazada de `Verificación` + «la GUARDA de obligatoriedad por familia» | Salidas: hechas (E1/E2). Guarda: este cambio |
| Catálogo `R01.1.md:491` | F1A-03 · `transitions-equipo-nuevo` · P38 · talla S | Misma capacidad, modificada aquí |
| `R01.2.md:60` | Gate P38 desbloqueado: «la Verificación es obligatoria por tipo de equipo» | Este cambio |
| `openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:9-18` | Construyó E1+E2; dejó fuera E3+E4 (→ E-082) y E5 (→ E-083); por eso `cierra: no` | E3+E4+E5: este cambio |
| `docs/sdd/ENTRADA.md:1312`, `:1316` | E-082 y E-083 cerradas por Gerencia el 28/09 | Base de este cambio |

El propio informe dice lo que faltaba para `cierra: si`: construir E-082/E-083 cuando Gerencia decidiera
(`archive-report.md:122`). Ya están decididas. **Lo que no entra y no impide cerrar:** la siembra en producción es
tarea de persona (`openspec/config.yaml:2897`) y archivar no la da por hecha; la edición del compuesto desde la ficha
de la hoja de vida y el compuesto en el catálogo de modelos como pantalla son de F1B-02 y F1D-01, que la decisión
nombra como herederas del dato (`tanda_que_abre`, `:2902`). Si `sdd-spec` encontrara otra exigencia de la fila sin
destino, `cierra` pasa a `no` y se dice en el `archive-report`.

## Base (literal de disco)

- `decision/p38-verificacion-calidad` (`openspec/config.yaml:1967`): obligatoria «para analizadores de gases y
  convertidores, y no para el resto» (`:1972`); «sólo la exige cuando disponemos del gas patrón» y la lista «se
  mantiene como dato que se puede cambiar» (`:1973`); la guarda «es condicional a un dato que no existe» (`:1980`).
- `decision/f1a03-familia-y-gas-patron` (`:2887`): compuesto en cada equipo, heredado del modelo al darlo de alta;
  tabla de gases patrón con «compuesto, disponibilidad y fecha de vencimiento del certificado del cilindro», que
  mantiene el Director Técnico por alta directa; «si no existe, se libera y queda registrado el motivo»; script de
  siembra de Claude Code, ejecución de Alfonso (`:2892`). Excepción acotada: 24 tickets del lote AP-370 de 2024
  (`:2898`).
- `decision/f1a03-certificado-liberacion` (`:2904`): número del certificado de calibración de fábrica, texto
  obligatorio, PDF opcional; «se aplica tanto si el equipo pasó por Verificación como si se liberó sin ella por falta
  de patrón vigente»; no retroactiva (`:2909`).
- Maestro: M1.4, C12 y nº 38 en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1520`; la
  regla observada por familia en `:1521-1548`.

## Intención

Hoy un analizador de gases puede salir de `En Proceso` a `Finalizado` por `liberacion` sin pasar por Verificación
(`packages/shared/src/transitions.ts:359`, origen `['En Proceso', 'Verificación']`), y ninguna liberación pide
certificado (campos sólo `comment()` y `derivacion()`, `:360`). La regla que Calidad sigue a mano pasa a imponerla el
servidor, condicionada a un dato mantenible y no a una constante.

## Alcance

**Dentro**
1. **Compuesto en el equipo.** Columna `compuesto` en `equipos` (esquema `desk`; `ALTER` sin calificar, como las de
   `packages/zoho-sync/src/db/schema.sql:208` y `:470`, porque `equipos` está en `DESK_TABLES`,
   `packages/zoho-sync/src/db/migrate.ts:63-64`) y en `public.catalogo_modelos` (`schema.sql:339-348`, calificada).
   Herencia del modelo al dar de alta (`createEquipo`, `apps/desk/server/db/equipos.ts:119-131`) cuando el alta no
   trae compuesto; corrección por `updateEquipo` (`:133`) con lista blanca.
2. **Lista cerrada de compuestos y predicado de vigencia en `packages/shared`** (s4, s5): una sola fuente que
   consumen guarda, alta y siembra.
3. **Tabla `public.gases_patron`** (compuesto, disponible, vencimiento, más traza de alta), calificada y añadida a
   `PUBLIC_TABLES` (`migrate.ts:70-73`). Sin pantalla (s7).
4. **Guarda E3/E4 en el SERVIDOR** (regla 13), escalón **B**, `409`: `liberacion` desde `En Proceso` de un equipo con
   compuesto y patrón vigente de ese compuesto → «debe pasar por Verificación». Edición en sitio sobre
   `apps/desk/server/services/ticketService.ts:131` (tras el `409` de estado `:126-128` y los `403` de área y cargo
   `:129-131`, antes de los valores y el `422` de `:132-134`), con la función al final del fichero como
   `exigirMismoFlujo` (`:225-234`), para no desplazar citas.
5. **Motivo registrado** cuando la guarda deja pasar a un equipo de familia sin patrón vigente (s3): el servidor lo
   añade a los `values` que `applyTransition` guarda íntegros en `ticket_transitions`
   (`packages/zoho-sync/src/db/repo.ts:314-318`).
6. **Certificado de fábrica (E5):** campo de texto `certificado_fabrica` en `liberacion`, opcional en el catálogo y
   exigido por el servidor en escalón **C** (`422`, junto a los de `:134`) según s2. Un `required` genérico no sirve:
   `buildTransitionPlan` decide sin contexto del ticket (`apps/desk/server/transitionExec.ts:76-77`).
7. **PDF opcional** del certificado: subida propia con lista blanca `application/pdf` y el límite común
   (`apps/desk/server/util/subida.ts:6`, `:10`); hoy la única subida de ticket sólo admite imágenes
   (`apps/desk/server/routes/tickets.ts:56`). Almacén exacto: `design`.
8. **Guardianes que cambian:** `invariantesGrafo.test.ts:213-216` fija «exactamente comentario y derivación» en las
   seis de Equipo nuevo y pasa a admitir el campo nuevo sólo en `liberacion`. El invariante «`Finalizado` único sin
   salida» (`packages/shared/src/invariantesGrafo.test.ts:62-65` y `:177`) no se toca: ningún origen ni destino cambia.
9. **UI** (fuera de la red de pruebas, F0-00): el campo del certificado sale del catálogo; adjuntar el PDF; mensajes
   del `409`. Regla de mutación 3 por escrito en el cierre: cada decisión del cliente con su línea de servidor.
10. **Script de siembra** en `docs/sdd/` (idempotente, calificado; ver «Siembra»).

**Fuera**
- Pantalla de mantenimiento de gases patrón (s7) y edición del compuesto desde la ficha de la hoja de vida (F1B-02).
- Certificado propio de Ambientalia y sus tres firmas: módulo de informes, 2027 (`config.yaml:2914`).
- Marcar o corregir liberaciones anteriores (no retroactiva, `:2913`).
- Columna propia de `Verificación` en el tablero (F1B-09) y el área de `Liberación`.
- `remision.ts` (IV-12) y el sincronizador (IV-11): no se tocan.

## Tabla de gases vacía — el riesgo «0 destinatarios»

Supuesto s3, lectura literal de `:2892`: sin patrón vigente «se libera y queda registrado el motivo», así que **no
bloquea**. Lo que hace la guarda, exactamente, en `liberacion` desde `En Proceso`:

| Equipo del ticket | Patrón vigente de su compuesto | Resultado |
|---|---|---|
| sin equipo, o equipo sin compuesto | — | pasa; sin motivo; sin certificado (s6) |
| con compuesto | existe | `409` (escalón B) |
| con compuesto | no existe (tabla vacía incluida) | pasa; motivo registrado; certificado exigido (s2) |

Hasta la siembra ningún equipo tiene compuesto: la guarda **no alcanza a nadie** y sólo se nota el certificado en la
liberación desde `Verificación`. Tras sembrar compuestos pero no gases, todos los de familia pasan con motivo. Sólo
con las dos siembras la guarda bloquea. Va en la nota de despliegue.

## Tickets que ya estén en `Verificación` el día del despliegue

Supuesto s12: **no se eximen**. «No es retroactiva» (`:2909`) habla de los ya liberados; un ticket en `Verificación`
se libera después del despliegue y desde ese momento su `Liberación` exige el número. **Cambio visible** para la nota
del paquete, junto a: (a) los equipos de familia en `En Proceso` con patrón vigente ya no se liberan directamente.
Cuántos hay es dato de producción (P.3).

## Supuestos reversibles (modo `auto`)

- **s1 · Familia = compuesto no nulo.** «Analizadores de gases y convertidores» (`:1972`) son justo los equipos a los
  que la siembra da compuesto (`:2892`). No se añade marca de familia aparte.
- **s2 · Certificado — se sigue el literal, no el de la exploración.** La exploración proponía «sólo equipos de
  familia». `:2909` dice «La transición «Liberación» desde Verificación exige…» y lo extiende a la liberación «sin
  ella por falta de patrón vigente». Lectura elegida: se exige en **toda** `liberacion` desde `Verificación` (sea cual
  sea el equipo) **y** en la `liberacion` desde `En Proceso` de un equipo con compuesto (que, con la guarda, sólo
  pasa sin patrón vigente). No se exige a un equipo sin compuesto que sale de `En Proceso`: no es ninguno de los dos
  casos. No es PARADA: es el texto de la decisión, no lo amplía ni lo contradice.
- **s3 · Tabla vacía no bloquea; el motivo lo escribe el servidor**, no el usuario («Sin gas patrón vigente de
  <compuesto>»), porque es un hecho derivado y no un juicio.
- **s4 · Lista cerrada de compuestos en `packages/shared`** (SO₂, NOₓ, CO, O₃, H₂S, TRS, NH₃, grafía canónica única),
  para que «SO2» y «SO₂» no sean dos nociones (molde H5). La disponibilidad sigue en la tabla, como exige `:2896`; un
  compuesto nuevo sí exige tocar la lista. No contradice la decisión, que habla de disponibilidad.
- **s5 · Vigente = `disponible` y vencimiento ≥ hoy** (fecha local de Bogotá; hipótesis a fijar en `design`).
- **s6 · Sin equipo, o equipo sin compuesto → la guarda no actúa.** Incluye equipos sin `modelo_id`, que la herencia
  no alcanza (hipótesis: proporción sin medir).
- **s7 · Sin pantalla de gases**: alta directa (`:2892`, «al principio por alta directa»).
- **s8 · El certificado vive en la transición** (`values` de `ticket_transitions`), no en la hoja de vida: es el de
  esa liberación.
- **s9 · Herencia sólo en el alta y en la siembra**; la ficha de hoja de vida (F1B-02) heredará el dato.
- **s10 · PDF**: subida propia, sólo `application/pdf`; sin PDF la liberación pasa.
- **s11 · Ámbito**: `liberacion` es el id del flujo Equipo nuevo (`transitions.ts:359`); la de servicio es
  `liberacion_sin_factura` (`:246`) y no se toca.
- **s12 · Tickets en `Verificación` al desplegar**: sin exención (arriba).

## Siembra en producción

Claude Code prepara `docs/sdd/F1A-03_Siembra_compuestos_y_gases_patron.sql`: idempotente (`IF NOT EXISTS`,
`ON CONFLICT`/`WHERE compuesto IS NULL`), toda tabla de `public` calificada, en una transacción. Tres bloques:
compuesto por modelo (APSA-370 SO₂, APNA-370 NOₓ, APMA-370 CO, APOA-370 O₃, convertidores), herencia a los equipos
existentes por `modelo_id`, y excepciones del lote 2024 más gases actuales **con los datos que entregue el Director
Técnico** (el repositorio no los tiene: qué compuesto mide cada serial del lote y qué cilindros hay). Sin esos datos
el bloque queda vacío y el script no inventa valores. Ningún secreto en el script.

## Capacidades

- **Nueva `gases-patron`**: tabla, vigencia y lista de compuestos. **R-2:** el MISMO cambio debe añadirla a
  `openspec/config.yaml → capabilities` (lo hace `sdd-spec` o `apply`, no esta fase).
- **Modificada `transitions-equipo-nuevo`**: guarda de familia (escalón B), certificado en `liberacion`, motivo; y
  retira de «Fuera de alcance» E3/E4 y E5 (`openspec/specs/transitions-equipo-nuevo/spec.md:266-269`).
- **Modificada `hojas-vida`**: el equipo tiene compuesto, heredado del modelo al alta.

## Enfoque por lotes (detalle en `tasks`)

Medida: `git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin trackear. Techo 800, válvula 720.

| Lote | Contenido | Estimación (incl. casillas y apply-progress) |
|---|---|---|
| 1 · Dato | lista y vigencia en `shared`, columnas, `public.gases_patron`, herencia y corrección | ~550 |
| 2 · Guardas | `409` de familia con prueba de posición, motivo, certificado `422`, invariante `:213-216` | ~600 |
| 3 · UI y siembra | campo y PDF, mensajes, script SQL, regla 13 por escrito, barrido de la regla 4 | ~450 |

**Prueba de posición (regla de mutación 1):** activar a la vez el `403` de área y el `409` de familia (gana el `403`)
y el `409` de familia con el `422` del certificado o de obligatorios (gana el `409`); mover la guarda delante del
`403` o detrás de `:134` pone la suite en rojo. Mutación 2 sobre el dato: sembrar en la prueba un gas vencido y otro
no disponible y comprobar que la guarda no los cuenta. Verify y archive, intentos aparte.

## Tareas de persona (regla del ciclo 1, fuera del recuento)

Archivar no las da por hechas.
- **P.1 · Director Técnico**: entregar el compuesto de cada serial del lote AP-370 de 2024 (24 tickets, `:2898`) y la
  lista de cilindros vigentes. Destino: el script de siembra.
- **P.2 · Alfonso**: ejecutar la siembra en producción tras desplegar (`:2892`). Dato de producción.
- **P.3 · Alfonso**: contar antes de desplegar los tickets en `Verificación` y los de familia en `En Proceso`.
  Destino: nota del paquete.
- **P.4 · Verificación en la app** tras desplegar. Destino: parte de la tanda.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| La guarda no se nota hasta la siembra (0 destinatarios) | Alta | Escrito arriba y en la nota de despliegue; P.2 |
| s2 leído al revés por Calidad | Media | Supuesto visible; se corrige en una condición |
| Desplazar citas de `ticketService.ts`, `transitions.ts`, `schema.sql` | Media | Edición en sitio; barrido de la regla 4 al cerrar |
| Equipos sin `modelo_id` quedan fuera de la guarda | Media | s6 visible; los corrige F1B-02 o la siembra |

## Rollback

Revertir los commits del lote. Columnas y tabla son aditivas y sólo las lee este código; quitar la guarda y el campo
devuelve `liberacion` a su comportamiento de hoy. La siembra no se revierte: deja datos inertes sin la guarda.

## Criterios de éxito

- [ ] Equipo con compuesto y patrón vigente: `liberacion` desde `En Proceso` → `409`; desde `Verificación` → pasa.
- [ ] Sin patrón vigente (tabla vacía, vencido o no disponible) → pasa y `values` guarda el motivo.
- [ ] `liberacion` desde `Verificación` sin número → `422`; con número → `200`; sin PDF → `200`.
- [ ] Mover la guarda de familia de escalón pone la suite en rojo.
- [ ] `Finalizado` sigue siendo el único estado sin salida.

## Cierre esperado

- Línea del `archive-report`: «Cubre de F1A-03 la guarda de Verificación por familia y gas patrón vigente (E3/E4), el
  certificado de fábrica en Liberación (E5), el compuesto del equipo heredado del modelo y la tabla de gases patrón;
  con E1/E2 de `salidas-verificacion`, la fila queda entera. Deja fuera la siembra (tarea de persona) y la edición
  del compuesto desde la hoja de vida (F1B-02).»
- `toca_maestro: si`: `R08.2.md:1492` aún dice «La rama aún no está implementada», `:1520` mantiene abierto lo que ya
  está decidido y `:1548` da la regla «como observada, no como norma». El texto ya está entregado en
  `docs/sdd/R08.4_Expediente_de_cambios.md:66-67` (1.1 y 1.2); el archive sólo añade, si falta, que la guarda queda
  construida. Sin tocar el `.docx`.
