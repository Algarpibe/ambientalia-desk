# Desk 2.0 — Plan de fases y tandas de desarrollo con Claude Code

**Revisión:** R01.1 · **Fecha:** 07/09/2026 · **Autor:** Gerencia (Alfonso García del Pino), con apoyo de Claude
**Base documental:** Documento Maestro R08.1 (§1.8, §1.9, M1.3, M2, M11, §3.2, §3.2.1, Anexos D y H) · Registro de decisiones del 03/09/2026 (Notion «Desk 2.0 03/09/2026») · Estructura de inspección física GRIMM EDM180 v1.8 y HORIBA AP370 v1.4 · Lectura del repositorio `C:\dev\Desk_2_R1.023` (HEAD `a3a8f03`) · Decisiones de Gerencia del 07/09/2026
**Estado:** Propuesta; los gates se deciden en la conversación de Cowork y en el panel (tabla §4.5)
**Cambios R01 → R01.1:** tanda de auditoría del as-built F0-00 antes de escribir specs · §2.4 nuevo con el punto de partida real del repositorio · §4.7 reescrito sobre la estructura documental existente en `docs/` · mapeo N1 → transiciones, N2/N3 → checkpoints incorporado en el principio 4 y en F1D-03
**Sincronizado con:** el libro de revisión Man on the Loop **R01.3** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_Revision_MoL_R01.3.xlsx`, 15/09/2026), versionado en `docs/sdd/` junto a este fichero. Sincronización hecha el **17/09/2026**. **El denominador de avance son 52 tandas hasta F1F** —F0 6 · F1A 9 · F1B 11 · F1C 8 · F1D 9 · F1E 5 · F1F 4—, 70 contando F2–F5. Es reproducible desde el repositorio: el libro es la fuente, este documento el destino, y las dos cifras salen de contar filas de la hoja «Tandas».
**El nombre del fichero sigue diciendo `R01.1` a propósito, y no se renombra:** el plan está citado por nombre **23 veces en 17 ficheros** y por línea (`plan:NNN`) **95 veces en 21 ficheros** (medido el 17/09/2026); renombrarlo las rompería todas de golpe. Lo que declara contra qué revisión está sincronizado es **esta cabecera**, no el nombre del fichero.

---

## 0. Qué resuelve este documento

El registro de decisiones del 27/08 frenó el desarrollo hasta consensuar el documento maestro y pidió, después, «trocear el proyecto por fases y prioridades». El registro de decisiones del 03/09 recoge el criterio de troceo (replicar primero el Desk 1.0), metió el módulo de informes en la Fase 1 y fijó la jerarquía del diagnóstico (fase → nivel macro → subnivel → ítem). Lo que faltaba era el paso siguiente: convertir eso en un plan que Claude Code pueda ejecutar tanda a tanda sin perder el hilo entre sesiones.

Este documento responde a dos preguntas:

1. **Cómo se estructuran las fases** de implementación, de mayor a menor prioridad, contrastadas con la meta del 31/12/2026.
2. **Cómo se le plantea a Claude Code cada tanda de trabajo**, con Spec-Driven Development (SDD) sobre el tooling ya instalado —Gentle-AI y Engram—, de modo que cada tanda nazca de una especificación trazable al documento maestro y termine con una verificación independiente.

Cuatro decisiones de Gerencia del 07/09 lo condicionan y no se vuelven a discutir aquí:

| Decisión | Implicación |
|---|---|
| La Fase 1 se construye **sobre el repositorio actual** del demostrador (monorepo `apps/desk` + `packages/shared`, as-built del commit a3a8f03) | No se rehace lo que ya funciona: las 34 transiciones, el motor y los permisos por área se conservan y se corrigen. La primera tanda es levantar las specs de lo que ya existe. |
| Se sigue **Spec-Driven Development** | Nada se programa sin una spec aprobada. La spec cita el apartado del documento maestro del que sale. |
| Tooling: **Gentle-AI + Engram**, ya instalados | El flujo SDD de Gentle-AI (`sdd-init → explore → propose → spec → design → tasks → apply → verify → archive`) es el ciclo de cada tanda; Engram guarda decisiones y contexto entre sesiones. |
| Criterio de MVP: **replicar el Desk 1.0** y, dentro de esa misma fase, **protocolizar el diagnóstico con checklist** | Resuelve el punto abierto nº 60 (§3.1 frente a «replicar el Desk 1.0»): el orden de la Fase 1 lo manda la paridad con el Desk 1.0; los criterios de §3.1 (fecha comprometida e integridad del dato) ordenan lo que viene después. |

---

## 1. Principios que ordenan el troceo

**1. Paridad primero, mejora después.** La Fase 1 termina cuando Servicio Técnico y Comercial pueden hacer en Desk 2.0 todo lo que hoy hacen en Zoho Desk, más el diagnóstico protocolizado y el informe derivado de él. Nada que no exista en el Desk 1.0 entra en la Fase 1 salvo esas dos excepciones decididas.

**2. Lo que repara va antes que lo que añade.** Las doce correcciones del blueprint (§3.2.1) se anteponen dentro de su prioridad, pero se separan en dos grupos con ritmos distintos: las que **recuperan reglas** que ya existían (C1, C11, C12) se ejecutan sin discusión; las que **cambian el proceso** (C2–C10) esperan la decisión de negocio y se ejecutan en cuanto llega.

**3. Una decisión pendiente es una puerta, no un bloqueo del plan.** Cada tanda declara qué decisiones necesita (los «gates»). Si la decisión no está, la tanda se aplaza y se adelanta otra que no la necesite. El plan no se detiene: se reordena. Las decisiones las toma Gerencia en la conversación de Cowork y en el panel, y se registran en Engram y en el Anexo C del documento maestro.

**4. El diagnóstico es configuración, no código.** La arquitectura híbrida del 27/08 —macro-fases como transiciones de estado, checklist parametrizado por marca-modelo dentro de cada macro— obliga a construir un **motor de checklists** y un **importador desde Excel**, no un flujo por equipo. El mapeo entre el catálogo de `docs/inspecciones` y el flujo queda fijado así: el **Nivel macro (N1)** alimenta las **transiciones internas** de la etapa de diagnóstico; el **Subnivel (N2)** y el **Ítem (N3)** son los **checkpoints** del checklist. Los catálogos GRIMM EDM180 (8 N1 · 27 N2 · 103 N3, v1.8) y HORIBA AP370 (v1.4) son el primer dato que se importa, no la primera pantalla que se programa. Una consecuencia a resolver en P45: el catálogo GRIMM tiene ocho N1 y el acuerdo del 27/08 hablaba de cuatro macro-fases (física, neumática, óptica, electrónica); si N1 es transición, el flujo interno del GRIMM tendrá ocho pasos, o bien las cuatro macro-fases son una agrupación de los N1 y las fases de Johny (ingreso, diagnóstico, mantenimiento, validación final) quedan un escalón por encima. Es una decisión de datos, no de código, pero hay que tomarla antes de F1D-03.

**5. El informe no se redacta: se deriva.** El módulo de informes de la Fase 1 lee el checklist del diagnóstico y lo convierte en informe de diagnóstico y de salida. Por eso se construye **después** del motor de checklists y no en paralelo.

**6. Cada tanda es una unidad verificable.** Una tanda toca una capacidad, cabe en uno a tres días de trabajo, sale en una rama y una PR, y se cierra con `sdd-verify` y con una revisión humana sobre el demostrador. Ninguna tanda queda «a medias» al terminar la sesión: si no se cierra, se documenta el estado en Engram y se retoma.

**7. El documento maestro sigue siendo la fuente.** Las specs no reemplazan al documento maestro; lo traducen. Cada spec cita su apartado (M1.3.4, C3, P31…) y cada archivo de spec archivado actualiza el Anexo H (as-built frente a plan). Cuando una spec descubre una contradicción con el documento, se abre un punto en el Anexo D antes de programar.

---

## 2. Encaje de Gentle-AI y Engram: veredicto y forma de uso

### 2.1 Veredicto

**Encaja, y mejor que una estructura propia.** Gentle-AI implementa SDD sobre la convención OpenSpec, que separa dos cosas que este proyecto necesita separar: **la verdad actual** (`openspec/specs/<capacidad>/spec.md`, lo que el sistema hace hoy) y **el cambio propuesto** (`openspec/changes/<id>/`, con `proposal.md`, `design.md`, `tasks.md` y los deltas de spec). Esa separación es exactamente la distinción as-built / plan que el documento maestro mantiene en el Anexo H, llevada al repositorio. Al archivar un cambio (`sdd-archive`), sus deltas se funden en las specs: el as-built se actualiza solo.

Engram cubre el otro hueco, el que hizo que el registro de decisiones del 27/08 tardara cinco revisiones en entrar al documento: la memoria entre sesiones. Cada sesión de Claude Code arranca con `mem_context` (qué se decidió, qué quedó a medias) y termina con `mem_session_summary`. Las decisiones de negocio se guardan con `topic_key` estable (`decision/c3-salida-esperas`), de modo que una tanda posterior las encuentre con `mem_search` sin releer los registros de decisiones.

Tres cautelas que conviene conocer antes de empezar:

- El soporte de `openspec/config.yaml` en Gentle-AI es **por prompt, no validado por código**: el fichero orienta a los agentes, no impone nada. Las reglas críticas (estados con nombre exacto, nada de texto libre obligatorio, Zoho solo lectura) se escriben además en el `CLAUDE.md` del repositorio, que Claude Code sí lee siempre.
- Gentle-AI delega cada fase SDD a un sub-agente con contexto aislado. Eso es bueno para la verificación (el verificador no ha visto el código nacer) y exige que la spec sea autosuficiente: el sub-agente de `sdd-apply` no tiene el documento maestro en memoria, tiene la spec.
- Engram es una base SQLite local (`~/.engram/engram.db`). Para que Gerencia y el equipo técnico compartan memoria hay que activar Git Sync o la nube de Engram; hasta entonces, la memoria es de la máquina en la que se desarrolla y el registro de decisiones oficial sigue siendo el Anexo C del documento maestro.

### 2.2 Cómo se mapea el proyecto sobre el tooling

| Concepto del plan | Artefacto en el repositorio | Herramienta |
|---|---|---|
| Fase | Carpeta lógica y etiqueta (`F1`, `F2`…) en el nombre de cada cambio; hito en Git | — |
| Épica (bloque dentro de una fase) | Prefijo del cambio (`F1B`, `F1D`…) | — |
| **Tanda** | **Un cambio OpenSpec:** `openspec/changes/F1B-03-autocompletado-serial/` con `proposal.md`, `specs/…/spec.md` (delta), `design.md`, `tasks.md` | Gentle-AI SDD |
| Capacidad del sistema | `openspec/specs/<capacidad>/spec.md` (verdad actual) | Gentle-AI SDD |
| Decisión de negocio | Observación Engram `decision/<tema>` + Anexo C del documento maestro | Engram |
| Contexto de sesión | `mem_session_start` / `mem_session_summary` | Engram |
| Reglas invariables | `CLAUDE.md` + `openspec/config.yaml → context` | Claude Code |
| Auditoría del blueprint (M11.6) | Cambio de tipo `audit-*` al cierre de cada épica, sin código, que produce un informe y puntos para el Anexo D | Gentle-AI (`sdd-explore` + `sdd-verify`) |

### 2.3 Capacidades (specs) que se declaran en la Fase 0

Las specs se organizan por capacidad, no por pantalla ni por tabla. Es la lista de partida; `sdd-init` y la exploración del código la afinarán.

| Capacidad | Qué cubre | Estado al arrancar |
|---|---|---|
| `tickets-core` | Ciclo de vida del ticket, identificación por serial, campos del diccionario (Anexo G), `Clasificaciones` como disparador de rama | As-built parcial |
| `transitions-st` | Las 34 transiciones y 21 estados del flujo de servicio técnico (`transitions.ts`, `transitionExec.ts`) | As-built completo |
| `transitions-equipo-nuevo` / `transitions-soporte-remoto` | Los flujos as-is de M1.4 y M1.5 | Sólo mapeo (hojas 03/02) |
| `remisiones` | Remisión de entrada/salida, pasos sin botón (`estadoPorRemision.ts`), accesorios | As-built parcial |
| `permissions` | Permisos por área (`permissions.ts`); después por cargo y propietario (C10) | As-built por área |
| `zoho-sync` | Lectura de tickets, OV y contactos desde Zoho a PostgreSQL; regla de no cruzar las dos entradas | As-built (cron cada 3 min) |
| `derivacion-avisos` | Derivación, cargos propuestos, correos por cambio de área | As-built |
| `trazas` | Fecha, hora y persona en toda transición; historial | As-built parcial (decidido R08 sin excepciones) |
| `hojas-vida` | Equipo, cliente, serial, modelo, cuatro campos comerciales, código interno, enlace a Drive (fase 0 de migración) | Nuevo |
| `diagnostico-checklist` | Catálogo (fase → macro → subnivel → ítem), captura por visita, validación por macro, encadenamiento No OK, criterio de falla, evidencia, repuesto asociado, formulario de falla nueva | Nuevo |
| `informes` | Informe de diagnóstico y de salida derivados del checklist; validación por dos personas; PDF por plantilla | Nuevo |
| `inventario-lectura` | Artículos y repuestos de Zoho Books filtrados por etapa del diagnóstico | Nuevo (solo lectura) |
| `kpis` | Timestamps, tres bodegajes, OTD; excluye Anulado | Fase 2 |

### 2.4 El punto de partida real: lo que el repositorio dice de sí mismo

Lectura del 07/09/2026 sobre `C:\dev\Desk_2_R1.023`. No es la auditoría (esa es F0-00); es lo que se ve sin abrir el código y que cambia el plan.

| Hallazgo | Dato | Qué implica |
|---|---|---|
| **No hay deriva desde la R04** | HEAD sigue en `a3a8f03`, el commit que leyó la auditoría del 21/08 | El as-built de la R08.1 (34 transiciones, 21 estados) describe el código actual. F0-02 parte de una base ya documentada |
| **Monorepo de cuatro paquetes** | `apps/desk` (web + API), `apps/hub-sync`, `packages/shared`, `packages/zoho-sync`; ~30.700 líneas TypeScript | Las capacidades de §2.3 se reparten en cuatro paquetes; `zoho-sync` es un paquete propio y no una carpeta de `desk` |
| **Ya hay pruebas** | `vitest` configurado; 96 ficheros de prueba, concentrados en `apps/desk/server/db` (20), `apps/desk/src/lib` (13), `packages/shared/src` (11) y `packages/zoho-sync` (~30) | `strict_tdd` de Gentle-AI se puede activar desde el día uno. F0-04 no crea la red de pruebas: la mide y la completa donde falta (motor de transiciones, permisos) |
| **Existe una metodología spec-first anterior** | `docs/superpowers/` con **52 diseños** y **60 planes** fechados entre el 02/06 y el 12/08/2026 (subsistemas A–I, zoho-hub, hoja de vida, remisiones, avisos, catálogo de equipos…) | Es el «diseño de lo construido». Las specs as-built de F0-02 no se escriben desde cero: se destilan de estos diseños, contrastados con el código. Gentle-AI/OpenSpec sustituye a Superpowers como flujo, pero hereda su archivo |
| **Deuda técnica documentada y extensa** | `debt.md` de ~78 KB con una auditoría interna del 19/06 y roadmap actualizado el 07/08; hallazgos por subsistema | La auditoría F0-00 no parte de cero: valida y reclasifica lo que `debt.md` ya sabe |
| **No hay `CLAUDE.md` ni `AGENTS.md`** | Sí hay skills sueltas en `.claude/skills/` (frontend-design) y `.agent/skills/` (design-md, react-components, shadcn-ui, stitch-loop, remotion, enhance-prompt) | F0-01 crea el `CLAUDE.md` y decide qué skills existentes se conservan junto a las que instale Gentle-AI, para que no compitan |
| **Documentación de referencia ya en el repo** | `docs/blueprint-servicio-tecnico.md`, `docs/modelo-autorizacion.md`, `docs/migracion-zoho-roadmap.md`, `docs/analisis-tickets/` (hojas DF de febrero y diccionario de campos), `docs/remisiones/`, `docs/zoho-hub/`, `DEPLOY.md`, `docs/runbooks/` | Los sub-agentes tienen fuente local para casi todo; lo que falta en formato legible por agente es el documento maestro (sólo `.docx`) |
| **Catálogos de inspección versionados** | `docs/inspecciones/Grimm/…_v1.8.xlsx` y `docs/inspecciones/Horiba/…_v1.4.xlsx`, con `Anteriores/` | El importador F1D-02 tiene ya su dato de prueba y su convención de versionado |

---

## 3. Fases

La numeración de ítems (1–28) y correcciones (C1–C12) es la del documento maestro R08.1; los `P nn` son los puntos abiertos del Anexo D. Las semanas son de calendario, contadas desde el lunes 07/09/2026 (S37) hasta el 31/12/2026 (S53): **16 semanas y media**.

### Fase 0 — Cimientos SDD · S37–S38 (1,5 semanas)

Objetivo: que la primera tanda funcional arranque sobre specs de lo que ya existe, no sobre memoria. Es la traducción del as-built a OpenSpec, precedida de una auditoría que fija el punto de partida.

| Tanda | Contenido | Resultado |
|---|---|---|
| **F0-00 Auditoría del as-built** | Tanda sin código. `sdd-explore` con un sub-agente por frente: (a) **motor de flujo** —confirmar 34 transiciones y 21 estados, que `transitions.ts` y `permissions.ts` siguen siendo el único sitio de cada regla, y los seis hallazgos de la R04; (b) **esquema de datos** frente a las 59 columnas del Anexo G y a los diseños de `docs/superpowers/specs` (subsistemas A, B, E, F); (c) **sincronización Zoho** (`packages/zoho-sync`, `apps/hub-sync`): qué entidades, cadencia, regla de no cruce; (d) **UI** (`apps/desk/src`): qué pantallas replican ya Zoho Desk y cuáles son prototipo; (e) **pruebas y build**: cobertura real de los 96 ficheros, `typecheck` y `lint` en verde o no; (f) **deuda**: reclasificar `debt.md` en «cierra en F1A/F1C», «se arrastra» y «obsoleto». Cada frente devuelve un veredicto **conservar / refactorizar / rehacer** con justificación. Contraste con el Anexo H; desvíos al Anexo D. Resultado a Engram como observaciones `baseline/*` | El proyecto arranca sobre un punto de partida verificado, no sobre la memoria de agosto. Si algún frente saliera en «rehacer», se decide antes de gastar una tanda funcional en él |
| F0-01 `sdd-init` y convención | `sdd-init` sobre el repo; `openspec/config.yaml` con contexto del proyecto, `strict_tdd: true` (vitest ya existe), reglas por fase; `CLAUDE.md` con las reglas invariables (§4.4) y el mapa documental de §4.7; decisión sobre qué skills de `.claude/skills` y `.agent/skills` se conservan | Repo preparado; Claude Code conoce las reglas sin que se le repitan |
| F0-02 Specs as-built | A partir del inventario de F0-00 y de los diseños de `docs/superpowers/specs`, redacción de las specs de `transitions-st`, `permissions`, `remisiones`, `zoho-sync`, `derivacion-avisos`, `trazas`, `tickets-core` **tal como están**, incluidos los hallazgos de la R04 marcados como «comportamiento actual, a corregir en Cx». Cada spec cita el diseño de Superpowers del que procede y el apartado del documento maestro | El Anexo H tiene su espejo en el repositorio; Superpowers queda archivado como histórico y OpenSpec pasa a ser la verdad |
| F0-03 Memoria del proyecto | Proyecto Engram; carga de las decisiones cerradas (§1.8 del documento maestro y decisiones del 03/09) como observaciones `decision/*` y del baseline de F0-00; convención de `topic_key`; evaluar Git Sync para compartir con el equipo | Cualquier sesión recupera el estado del proyecto con `mem_context` |
| F0-04 Base técnica | Completar las pruebas del motor de transiciones donde F0-00 detecte huecos (que cada transición parte y llega a los estados declarados; que `Finalizado` es el único terminal; permisos por área); ~~staging sobre la VPS Hostinger con PostgreSQL~~ **pieza RETIRADA por Gerencia el 21/09** (`decision/e013b-copia-pruebas`: no se monta copia de pruebas; se trabaja sobre la aplicación de verdad); CI que ejecuta `test`, `typecheck` y `lint` | Red de seguridad para tocar el motor en F1A |

Sin gates. Es trabajo de desarrollo puro y no depende de ninguna decisión pendiente. F0-00 va primero; F0-01 y F0-03 pueden correr en paralelo con ella; F0-02 y F0-04 dependen de su resultado.

### Fase 1 — Réplica del Desk 1.0 + diagnóstico protocolizado + informes · S38–S51

Es el MVP. Se divide en cinco épicas que **no son estrictamente secuenciales**: 1A y 1C son correcciones, 1B es paridad, 1D y 1E son las dos adiciones decididas. El orden de ejecución recomendado y sus dependencias están en §3.7.

#### Épica 1A — Correcciones y desvíos sin decisión pendiente · S37–S38 (1 semana)

| Tanda | Corrección | Fuente | Gate |
|---|---|---|---|
| F1A-01 | **C1** Cerrar la guarda del checkbox obligatorio (`buildTransitionPlan`, debt.md M-2) | M1.7 · M11.7 · P33 | Ninguno |
| F1A-02 | **C11** SLA de un día sobre `Notificado`, con correo redundante al cambiar de área y escalado al superior | M1.7 (R08.1.md:1570-1575) · P40 · Anexo H (:4561) | Ninguno |
| F1A-03 | **C12** Salidas aprobada/rechazada de `Verificación` en el flujo de equipo nuevo | M1.4 · P38 | Ninguno para la transición (as-is: Verificación —Liberación→ Finalizado, 71 usos observados). La GUARDA de obligatoriedad por familia espera a Gustavo/Calidad · Anexo D nº 38. Se hace antes de F1B-06, que la hereda |
| F1A-04 | **C9** (parte técnica) Los tres bodegajes de M1.10 (:1685-1702) calculados sobre ticket_transitions; reanclar los indicadores 48 y 49 en la marca de «Ingreso a Servicio»; añadir el campo «fecha de aviso al cliente» | M1.10 · P41 | La definición de los tres bodegajes ya está resuelta en la R08 |
| F1A-05 | Auditoría de blueprint tras las correcciones (`audit-F1A`) | M11.6 | Ninguno. NO regenera `docs/artefactos/` (no hay generador todavía); audita leyendo el código |
| F1A-06 | **Generador del mapa del blueprint.** Script que produce `docs/artefactos/blueprint-*.md` (Mermaid `stateDiagram-v2`) desde `transitions.ts`, `estados.ts` y `permissions.ts`: el diagrama completo más una vista por cada una de las tres fases de M1.3.1, con prueba anti-desfase en CI (el mismo patrón que `migrate.test.ts`). `docs/artefactos/blueprintserviciotecnico.html` queda como histórico congelado en `a3a8f03`. Antes del criterio de aceptación hay que cerrar el hueco entre los **38 pasos** que cita el maestro y los **36** que declara el código (34 con botón + 2 sin botón) | Anexo F (R08.2) · Decisiones 10/09 §9 · entrada 4 de `docs/sdd/F0-01_Correcciones_para_el_plan.md` | Ninguno (`decision/mapa-blueprint-generado`, 10/09). **Va antes de F1B-06**, para que los flujos nuevos nazcan con su diagrama |
| F1A-07 | **IV-2 · Fechas derivadas impuestas por el servidor.** `Fecha creación ticket`, `Fecha Remisión Entrada` y `Fecha Revisión Informe` se calculan en el servidor, que ignora lo que llegue del navegador para esos tres campos; hoy las deriva el cliente en `apps/desk/src/lib/valoresTransicion.ts` y el servidor sólo exige que lleguen (`apps/desk/server/transitionExec.ts:77`). La zona horaria se fija de forma explícita: `diaLocal` usa la del proceso, y en el VPS cinco horas de cada día cambiarían de fecha. Decide la tanda si recalcula siempre o respeta un valor ya escrito (semántica actual de `yaEsta`); antes, barrer qué otros KPI o campos consumen las tres fechas | M1.10 (R08.2) · Decisiones 10/09 §4 | Ninguno (`decision/iv2-fechas-derivadas`, 10/09). Con **P21** cerrado, IV-2 deja de ser opcional: es condición previa del bodegaje de entrada |
| F1A-08 | **IV-4 · Tercera puerta de la asociación OV ↔ ticket.** El alta de remisión escribía `salesorder_id` sin pasar por `ticketConOrdenVenta`; se valida ahí la misma regla que las otras dos puertas, «una OV → un solo ticket vigente» | Decisiones 10/09 §2 · M4.4 (R08.2) | Ninguno (`decision/n52-cardinalidad-ov` la desbloquea). ⚠️ **YA CONSTRUIDA** por el cambio `tercera-puerta-orden-venta`, archivado el 16/09 (`openspec/changes/archive/2026-09-17-tercera-puerta-orden-venta/`): la guarda vive hoy en `apps/desk/server/routes/remision.ts:230-234`, fijada por `RQ-RE-16`, y el ex-`it.fails` de `apps/desk/server/ordenVentaUnTicket.test.ts:161` corre en positivo. El libro R01.3 la mide al 15/09 y por eso la da por escrita |
| F1A-09 | **Barrido de citas tras la R08.2.** Regenerar `docs/Manifesto/…_R08.2.md` desde el `.docx` y actualizar las citas por línea en specs, registros de correcciones, documento de decisiones, `CLAUDE.md` y este plan: un cambio de revisión del maestro desplaza **todas** las citas a la vez | R08.2 §1.2 «Después de esta revisión» | Ninguno. La R08.2 la declara **tanda propia**, no efecto secundario de otra |

#### Épica 1B — Paridad funcional con el Desk 1.0 · S39–S44 (6 semanas)

Aquí se replica lo que el Desk 1.0 hace hoy, con la interfaz que replica la estructura de Zoho Desk (decisión 21/08, ítem 22) y los blueprints más controlados. Se ordena por dependencia: primero lo que alimenta el ticket, después lo que lo mueve, al final lo que lo mira.

| Tanda | Ítem(s) | Contenido | Gate |
|---|---|---|---|
| F1B-01 | 1 · 19 | Código único de ticket basado en serial; serial obligatorio en la remisión; **autocompletado por serial** (cliente, modelo, OV activas) desde la base propia y la lectura de Zoho | Ninguno (decidido 14/08 y 20/08) |
| F1B-02 | 9 | Hoja de vida del equipo: alta por Comercial al conocer el serial; fecha de adquisición, fecha de factura, fin de garantía y **código interno del cliente** como identificador secundario; botón de enlace a la carpeta de Drive (fase 0 de la migración, P8) | **P8/P54** sólo para el botón de Drive: confirmar que la «fase 0» (enlace, no migración) es la solución de arranque. Quién carga los cuatro campos |
| F1B-03 | 2 · 20 | Desplegable inicial de tipo de servicio (`Clasificaciones`) que oculta pasos; prefijos autogenerados y sólo documentales (P37 cerrado). **P21 confirma el modelo construido**: OV **opcional** al crear el ticket y **obligatoria** en `Habilitar Servicio` —«obligatoria para trabajar, no para recibir»—, así que deja de ser regla parametrizada. Se añade la guarda «**`Habilitar Servicio` exige remisión de entrada vigente en los tres orígenes**»: retirar el origen `Ticket creado` obliga a **relajar a propósito el invariante 3** (admitir estados cuya única salida la aplica el servidor), y el recuento de pasos resultante **se mide, no se supone**. Y la **OVI de garantía** a nombre del cliente real, que es cambio de práctica. Antes de cambiar nada, contar los tickets que llegaron a `Ingresado` sin remisión | `decision/p21-ingreso-sin-ov` **CERRADO 10/09** · pendiente `decision/ovi-garantia-autor`. **Pasa de talla M a L** por la guarda y la OVI, y se parte en dos cambios si no cabe en tres días |
| F1B-04 | 10 · 4 | Registro de entrada en recepción: remisión con datos de cliente y equipo, accesorios por lista cerrada (menú visual, ítem 21 queda como mejora), foto sólo con novedad, rotulación y almacenamiento —la «recepción unificada» del registro del 03/09—; sustitución del texto libre por desplegables en las etapas críticas | Ninguno |
| F1B-05 | 5 · 6 · 7 | Permisos y vistas por rol (área); traspaso formal entre agentes al cambiar de fase; checkbox «Cumple condiciones comerciales» en `Habilitar Servicio`; **trazas completas** (fecha, hora, persona) en toda etapa y transición, sin excepciones | Ninguno (R08 lo decide sin excepciones) |
| F1B-06 | — | Blueprints de **equipo nuevo** y **soporte remoto** (M1.4, M1.5) implementados en `transitions.ts` con la misma convención; hereda C12 | Alcance de los flujos **comercial** y **posible-cliente** (M1.11, M1.12) en Desk 2.0: se propone dejarlos en Zoho CRM durante 2026 y sincronizarlos en lectura. Confirmar |
| F1B-07 | 8 | Prioridad automática por calificación del cliente y contrato activo (High/Low, as-is R05); «Mis tickets» autoordenado; edición manual bloqueada para el técnico | Si los **Top 5** entran en la regla automática (Bloque 6 del documento de puntos del 03/09) |
| F1B-08 | 17 · 22 | Cierre de la paridad: vistas de listado y ficha equivalentes a las de Zoho Desk; conexión Zoho en solo lectura verificada en las tres entidades; **política de escritura** (P44): ninguna, salvo precarga de borrador de cotización si se decide. Recibe además el tablero: la vista «Todos» devuelve también los cerrados con `case 'todos'` separado de `default:`, **IV-1** (la regex de esperas sustituida por `ESTADOS_EN_ESPERA`) y `Remisión creada` reclasificada como espera con alarma de 72 h. **Pasa de talla M a L** | **P44** · `decision/escalado-remision-creada` (sin el cargo de Comercial que recibe el escalado, la alarma deja **roja** la guarda de C11). ⚠️ **PARCIAL a 15/09:** el tablero está construido y archivado el 10/09 —hoy `apps/desk/src/lib/boardView.ts:39` consume el predicado compartido, `:53` es `case 'todos': return tickets` y `packages/shared/src/estados.ts:86` da `Remisión creada` como espera interna—; **siguen pendientes** la alarma de 72 h (`packages/shared/src/sla.ts:32`, cuya única entrada hoy es `:34`) y la paridad de listado y ficha con Zoho |
| F1B-10 | — | Orden único de precedencia entre guardas en las dos puertas del motor (createManagedTicket y executeTransition), y en la del alta de remisión; unifica transitions-st §3.8 (a) y (b) y tickets-core §4.1 | Ninguno técnico; el orden se declara en la spec |
| F1B-11 | — | **Asociación OV ↔ ticket (1 : N) y subOV de lote.** Tabla de asociación **propia de la app** —ticket, OV, transición que asocia, fecha, hora y persona—: la FK no puede ir en `sales_orders` porque `books.sales_orders` es réplica del hub (`packages/zoho-sync/src/db/schema.sql:160`) y el sync la borraría. Una asociación se marca **liberada con motivo** y nunca se borra; índice único parcial para «una OV, un solo ticket vigente». `Aprobación` y `Aprobación y S. Repuestos` **añaden** OV sin sustituir la de entrada, la fecha de OC vive en cada asociación —lo que resuelve su reentrancia— y el bodegaje de entrada toma la de la OV asociada en `Habilitar Servicio`. **SubOV de lote (opción A):** formato `OV-AAAA-NNN-SS`, cuarentena de números no canónicos, saldo por lote (creadas / consumidas / libres), exclusión de OV anuladas o en borrador —el estado ya se sincroniza, `schema.sql:161`— y acción manual «liberar subOV» con traza hasta que exista C2. El `N° Ticket` de Books (`cf_n_ticket`) **sólo sugiere** en el desplegable | `decision/vigencia-contrato` (no bloquea el núcleo) · `decision/titularidad-ov-equipo` (**IV-8**). El núcleo es ejecutable: lo abren `decision/n52-cardinalidad-ov` y `decision/subov-lote-convencion`, las dos cerradas el 10/09. **Se parte en dos cambios** —asociación 1 : N y subOV de lote—; antes, barrer si ya existe alguna subOV con formato `_1` |
| F1B-09 | — | Auditoría de blueprint de los tres flujos (`audit-F1B`); extensión a equipo nuevo y soporte remoto como pide M11.6 | Ninguno. Hereda el generador de diagramas de `decision/mapa-blueprint-generado`, que se construye en F1A antes de F1B-06; la extensión de M11.6 deja de ser manual |

#### Épica 1C — Correcciones que cambian el proceso · se intercalan a medida que llegan las decisiones (S40–S48)

Estas tandas están **escritas** desde el principio (proposal y spec con las alternativas del documento maestro), pero se ejecutan sólo cuando la decisión queda escrita en `openspec/config.yaml` → `decisiones_de_gerencia`.

| Tanda | Corrección | Decisión necesaria (gate) | Alternativas ya documentadas |
|---|---|---|---|
| F1C-01 | **C2** Estado terminal `Anulado` con motivo tipificado; excluido de las tres métricas de servicios cumplidos | **P32** — y qué hacer con el histórico ya cerrado como Finalizado | M1.10, §3.2.1 |
| F1C-02 | **C4** Ciclo facturar ↔ entregar en dos ramas con `Pendiente de facturar`; conservar la primera fecha de remisión de salida | **P34/P6** — si `Facturado` pasa a ser estado | M1.3.5 (propuesta R08) |
| F1C-03 | **C3** Transición de escape de los cuatro estados de espera, con caducidad; conserva la vía de escape manual del 27/08, **con traza** | **P31** — a dónde va cada uno (Por Facturar cobrando diagnóstico, o Anulado) | M1.3.4 |
| F1C-04 | **C5** Atributo de tipo de evento en las 34 transiciones | **P35** — desambiguar «Creación de informe» (redactar / generar / emitir) | M1.8 |
| F1C-05 | **C10** Permisos por cargo y por propietario del registro (tres niveles) | **P39** — matriz de cargos por transición; `Liberación sin factura` exclusiva del **Director Comercial** (texto superado el 24/09: decía «gerente comercial»; Gerencia, panel, `decision/c10b-gerente-director` — son el mismo cargo, y el nombre formal es Director Comercial) | M1.9.1 |
| F1C-06 | **C7 + C9** Esperas que paran el reloj del SLA; los tres bodegajes como tiempo a descontar | Confirmación de qué estados paran el reloj | M1.10 «Los tres bodegajes» |
| F1C-07 | **C6** Etapa de QA/QC antes de la liberación, con retrabajo; base de las etapas de validación con firma | Diseño conjunto con las firmas de certificados (27/08); depende de C12 | M9.1 |
| F1C-08 | Rutas abreviadas: equipo sin novedades y calibración directa | **P15 / P59** | M1.6, M2.1 |

`C8` (traducción de los 21 estados a etapas del portal) se traslada a la Fase 3, junto con el área de cliente.

#### Épica 1D — Diagnóstico protocolizado con checklist dinámico · S42–S47 (6 semanas)

Es la primera de las dos adiciones al Desk 1.0. Se construye como motor + datos, siguiendo la arquitectura híbrida del 27/08 y la jerarquía del 03/09. Depende de F1B-04 (recepción) y de F1B-05 (trazas).

| Tanda | Contenido | Fuente | Gate |
|---|---|---|---|
| F1D-01 | **Modelo de datos del catálogo**: fase → nivel macro → subnivel → ítem; por ítem: qué se verifica, cómo, tipo de dato (booleano / numérico con unidades y límites), obligatoriedad, criterio de falla (Alerta / Cobrable / Bloqueante), evidencia fotográfica requerida, repuesto asociado, acción si No OK, ítems relacionados, comentario de falla para el informe. Versionado del catálogo por marca-modelo | M2.2, decisiones del 03/09 tema 3, Excel GRIMM v9 | Ninguno: la estructura está validada por Johny el 03/09 |
| F1D-02 | **Importador desde Excel** del catálogo (GRIMM EDM180 v9 y Horiba APxA-370), con validación de estructura y reporte de filas rechazadas; el catálogo se carga, no se teclea | M2.1 «alimentar los checklists desde plantillas en Excel» | Versión depurada del Excel por Johny y Gustavo (compromiso 11/09) — se puede importar la v9 y reimportar después |
| F1D-03 | **Niveles macro (N1) como transiciones internas**: transiciones dentro de `Rev./Diagnostico` declaradas en `transitions.ts` y **generadas desde el N1 del catálogo importado** (los ocho N1 del GRIMM, o su agrupación en las cuatro macro-fases del 27/08, según P45); N2 y N3 son los checkpoints de cada transición; el equipo sin novedades recorre igualmente las macros y deja constancia | M2.1 arquitectura híbrida, P59, `docs/inspecciones` | **P45**: fijar si la transición es cada N1 o la macro-fase que los agrupa, y que el juego sea común a todas las marcas (Johny) |
| F1D-04 | **Captura por visita y validación por macro**: el técnico valida el macro; si OK, subniveles e ítems se dan por conformes; si No OK, se despliega el detalle; registro OK / No OK por etapa obligatorio para transicionar; campos de valor con verificación de rango; foto sólo cuando hay novedad | Decisiones del 03/09 «flujo de validación por niveles», M2.3 | Ninguno |
| F1D-05 | **Encadenamiento No OK**: al fallar un ítem se activan los ítems relacionados (tabla plana origen → destino, como la hoja «Flujo No OK 2»); rama activa visible; acción sugerida | Excel v7/v9; tarea de Gerencia para el 11/09 | Ninguno para el motor; el contenido llega con el catálogo |
| F1D-06 | **Criterio de falla en acción**: Alerta registra e informa; Cobrable genera línea de cotización (repuesto + horas estimadas, ítem 12); Bloqueante impide liberar; el técnico ve **sólo los repuestos de la etapa** (lectura de Zoho Books por categoría) | M2.2, M2.3 R08, decisiones del 03/09 tema 4 | Ninguno |
| F1D-07 | **Formulario de falla nueva**: cuando la falla no está en el catálogo, formulario condicional con la misma estructura (qué, cómo, tipo de dato, parte); alimenta la base de conocimiento; decidir si es bloqueante o deja un aviso | Decisiones del 03/09 tema 5 | Definición de Gustavo (si bloquea o no) |
| F1D-08 | **Segundo equipo**: importar y recorrer un Horiba APxA-370 completo para demostrar que incorporar un equipo es configuración, no desarrollo | Decisiones del 03/09: los macros coinciden entre modelos Horiba | Catálogo Horiba depurado |
| F1D-09 | Auditoría (`audit-F1D`): coherencia entre macro-transiciones y catálogo; ítems sin criterio; ramas sin salida | M11.6 | — |

Queda **fuera** de la Fase 1, y se anota para la Fase 2 o posteriores: comentarios predefinidos (decidido 03/09: tras ~90 tickets), dictado por voz (aplazado 03/09), copiloto sobre la KBI (ítem 54), criterios analíticos de aprobación (P46/P12, M2.7 sin especificar).

#### Épica 1E — Módulo de informes · S46–S50 (4 semanas)

Segunda adición, decidida el 03/09. Depende de F1D-04 y F1D-06: el informe se deriva del checklist.

| Tanda | Contenido | Fuente | Gate |
|---|---|---|---|
| F1E-01 | **Modelo del informe**: tres bloques —estado inicial del equipo, diagnóstico, tabla de repuestos—; en Fase 1 con **campos abiertos** y comentarios editables; el comentario de falla del catálogo se vuelca automáticamente cuando el ítem sale No OK | Decisiones del 03/09 tema 6; M2.5 | **P14**: quién escribe `remisiones_entrada` (define de dónde salen los datos de cabecera) |
| F1E-02 | **Informe de diagnóstico**: generación por plantilla desde el ticket + checklist; nomenclatura de repuestos legible por vía del comentario, sin diccionario aparte | M2.5, decisiones del 03/09 | Ninguno |
| F1E-03 | **Informe de salida**: los puntos rojos pasan a verde si se corrigieron o quedan en rojo con **motivo tipificado** (cliente no aprueba · repuesto inexistente · sin solución); evidencia fotográfica; conclusión derivada | M2.5 «El informe de salida», decidido 27/08 | Ninguno |
| F1E-04 | **Validación antes de emitir**: etapa de revisión por dos personas ligada a roles; firma cargada automáticamente por etapa; el informe emitido es inmutable y queda en la hoja de vida | P10 (marcado como decidido en el documento de puntos del 03/09), M9.1 | Roles concretos que validan |
| F1E-05 | **Flujo de construcción del informe** documentado en el documento maestro (entregable 3 del 27/08) y reflejado en la spec `informes` | Compromiso de Gerencia | Es entregable documental, no de código: cierra el hueco más grande del documento maestro |

#### Épica 1F — Puesta en producción · S50–S53 (3–4 semanas, con margen)

| Tanda | Contenido | Gate |
|---|---|---|
| F1F-01 | Migración de los **tickets abiertos** de Zoho Desk al estado equivalente; regla de corte (fecha desde la que los tickets nacen en la app) | Fecha de corte |
| F1F-02 | **Respaldo y continuidad** (propuesta M12.8 del documento de puntos del 03/09): exportación periódica de PostgreSQL, adjuntos e informes; formato y periodicidad | **P55**: responsable y alcance |
| F1F-03 | Pruebas de aceptación con Servicio Técnico sobre dos o tres servicios reales (el piloto del Excel v9 recomendado); ajustes | — |
| F1F-04 | Formación breve del equipo; Zoho Desk pasa a solo lectura; auditoría final (`audit-F1`) y actualización del Anexo H | — |

### Fase 2 — Operación interna completa · 2027 · T1

Lo que el criterio de §3.1 (fecha comprometida e integridad del dato) manda a continuación, ya sobre datos limpios: dashboard operativo Kanban con WIP por etapa (13); KPIs de OTD, lead time total y de cotización, con los tres bodegajes y `Anulado` excluido (14, C9); descuento de repuesto usado sobre orden aprobada (15); comentarios predefinidos a partir del análisis de ~90 tickets (decisión 03/09); regla de liberación de mesa y cola de espera (30); solicitud automática de materiales al entrar en espera de repuesto (32); calendario de vencimientos de calibración (37); app móvil/tablet responsive con checklists, fotos y firma **sin offline** (18, offline a Fase 4); migración del histórico documental como herramienta independiente (P8) y convivencia con Drive (P54); ítem 25 (contenido formativo) corre en paralelo desde 2026 porque no es desarrollo.

### Fase 3 — Área de cliente nivel básico y seguridad · 2027 · T2

Etapa independiente, como decidió el 27/08: C8 (21 estados → etapas visibles), ítem 26 (hoja de vida reducida, seguimiento y aprobación de cotizaciones en un clic, piloto con contratos activos, ítem 29), identidad registrada (52) y los nueve puntos de seguridad del documento de puntos del 03/09 (ciclo de vida de usuarios del cliente, MFA, identificadores no enumerables en certificados públicos, integridad del firmware, filtro en la recuperación KBI/KBE, datos personales, respuesta a incidentes, sesiones, revisión previa a la apertura). Regla de apertura M8.6 más la revisión de seguridad.

### Fase 4 — Eficiencia, capacidad y conocimiento · 2027 · S2

Ítems 31–60 reordenados por la cadena de ejes: inventario transaccional (reserva soft/hard, punto de pedido), parámetro de carga del taller (35) y calendario de citas (36), dashboards por rol (41), análisis de cuellos de botella (43), reprogramación por demora en la OC (44), capa RAG con pgvector o la vía «LLM wiki» (53, P27), copiloto interno (54), KB Externa publicada (55), firmware (56), agendamiento (57, después del 35), offline con resolución de conflictos (50), QR/NFC en recepción (27, 28 y la exploración NFC de Gustavo).

### Fase 5 — Promesa, predicción y ecosistema · 2028

Ítems 61–76: CTP con capacidad finita, predicción de carga, agente conversacional del cliente, IoT, servicio premium, sustitución completa de Zoho Desk.

### 3.7 Calendario de la Fase 1 y contraste con el 31/12/2026

Cotejado con la hoja «Calendario» del libro R01.3 (15/09/2026). El lunes de cada semana va en la primera columna, que es lo que hace el cuadro reproducible.

| Semana | F0 + 1A | 1B | 1C (según decisiones) | 1D | 1E | 1F |
|---|---|---|---|---|---|---|
| S37 (07/09) | F0-00…F0-04 (ejecutadas) · F1A-01, -02, -04, -05 (cerradas 09/09) | F1B-01 (ejecutada 09/09, **adelantada**) | | | | |
| S38 (14/09) | F1A-03 · F1A-06 · F1A-07 · F1A-08 · F1A-09 | | | | | |
| S39 (21/09) | | F1B-02 | | | | |
| S40 (28/09) | | F1B-03 · F1B-04 | C2 si decidido | | | |
| S41 (05/10) | | F1B-05 · F1B-11 (propuesta) | C4 | | | |
| S42 (12/10) | | F1B-06 | | F1D-01 | | |
| S43 (19/10) | | F1B-07 | C3 | F1D-02 | | |
| S44 (26/10) | | F1B-08 (ampliada) · F1B-09 | C5 · C10 | F1D-03 | | |
| S45 (02/11) | | | | F1D-04 | | |
| S46 (09/11) | | | C7+C9 | F1D-05 · F1D-06 | F1E-01 | |
| S47 (16/11) | | | C6 | F1D-07 · F1D-08 · F1D-09 | F1E-02 | |
| S48 (23/11) | | | Rutas abreviadas | | F1E-03 | |
| S49 (30/11) | | | | | F1E-04 | |
| S50 (07/12) | | | | | F1E-05 | F1F-01 |
| S51 (14/12) | | | | | | F1F-02 · F1F-03 |
| S52 (21/12) | | | | | | F1F-03 · F1F-04 |
| S53 (28/12) | | | | | | Margen · meta 31/12 |

**F1B-10 no tiene semana**, y se dice a propósito: el libro lo registra igual («sigue sin semana, como en el plan .md»). Un hueco declarado no es un olvido; asignarle una de memoria sí sería el defecto.

**De dónde sale el adelanto, y en qué se gasta (lectura del libro, R01.2 del 10/09, vigente en la R01.3).** La Fase 0 entera, **cuatro de las cinco** tandas de F1A y F1B-01 se cerraron entre el 07 y el 09/09, y dejan **una semana de adelanto**. Esa semana no sobra: **la absorben las cuatro tandas nuevas de F1A** —F1A-06, -07, -08 y -09, todas sin gate— **y F1B-11**. O sea que el adelanto se consumió antes de existir en el papel, y el margen del 31/12 sigue sin holgura. Si hay que ganar otra semana, las dos piezas recortables son **F1B-06** (a un solo flujo) y **F1D-08** (Horiba, diferible a enero); **F1B-08 y F1B-11 se parten** si no caben en tres días.

**Lectura.** Cabe, pero sin holgura: el margen real son las dos últimas semanas de diciembre, que coinciden con vacaciones. Tres cosas lo protegen: (a) las tandas 1C no están en la ruta crítica —si una decisión se retrasa, la corrección entra en enero sin mover el MVP, salvo **C2**, que conviene cerrar antes de F1E porque el informe de salida necesita distinguir finalizado de anulado, y que además es **quien libera la subOV al anular** (F1B-11)—; (b) 1D y 1E pueden solaparse porque el modelo del informe (F1E-01) sólo necesita el modelo del catálogo (F1D-01); (c) F1B-06 (equipo nuevo y soporte remoto) es la tanda que se puede recortar a un solo flujo si hay que ganar una semana, porque el 90 % de los tickets son de servicio técnico.

Lo que **no** cabe antes del 31/12 y conviene dejarlo decidido por escrito: el área de cliente (ítem 26) —confirmando lo que el 27/08 ya apuntó—, la app móvil con offline, OCR/QR/NFC, los comentarios predefinidos y cualquier cosa del eje ② más allá de los timestamps.

---

## 4. Cómo se plantea cada tanda a Claude Code

### 4.1 Anatomía de una tanda

Una tanda es **un cambio OpenSpec** y cumple cinco condiciones: toca una capacidad (excepcionalmente dos, si una es sólo lectura); cabe en uno a tres días; se puede demostrar en el demostrador con una secuencia de clics que Servicio Técnico reconoce; tiene criterios de aceptación escritos en la spec **antes** de programar; y termina con `sdd-verify` en verde y una PR revisada. Si una tanda no cumple la segunda condición, se parte. Si no cumple la tercera, es infraestructura y se etiqueta `infra-*` para que no se confunda con funcionalidad.

Nomenclatura: `F<fase><épica>-<nn>-<slug>` (`F1B-01-serial-autocompletado`, `F1D-05-encadenamiento-no-ok`, `audit-F1B`, `infra-F0-ci`).

### 4.2 El ciclo de una tanda, paso a paso

| Paso | Quién | Qué ocurre | Herramienta |
|---|---|---|---|
| 0. Orientación | Claude Code | `mem_current_project` → `mem_context` → `mem_search` sobre el tema de la tanda. Recupera decisiones y lo que quedó a medias | Engram |
| 1. Arranque | Gerencia | Pega el **prompt de arranque** (§4.3) con el ID de la tanda, los apartados fuente y los gates | Claude Code |
| 2. Exploración | Sub-agente | `sdd-explore`: lee las specs actuales de la capacidad, el código implicado y los apartados citados del documento maestro (en `docs/maestro/`) | Gentle-AI |
| 3. Propuesta | Sub-agente → Gerencia | `sdd-propose` produce `proposal.md`: intención, alcance, fuera de alcance, gates, riesgos. **Gerencia aprueba o corrige antes de seguir.** Es el único punto donde se negocia el alcance | Gentle-AI |
| 4. Especificación | Sub-agente | `sdd-spec`: delta de spec con requisitos y escenarios en formato Dado / Cuando / Entonces, cada uno con su referencia (M1.3.4, C3…). Los nombres de estados y transiciones se escriben **exactamente** como en `transitions.ts` | Gentle-AI |
| 5. Diseño | Sub-agente | `sdd-design`: decisiones técnicas (tablas, migraciones, dónde vive cada regla), alternativas descartadas | Gentle-AI |
| 6. Tareas | Sub-agente | `sdd-tasks`: lista ordenada, cada tarea con su prueba; primero migraciones, luego motor, luego UI | Gentle-AI |
| 7. Implementación | Sub-agente | `sdd-apply` con TDD estricto si el repo lo permite; una rama por tanda | Gentle-AI |
| 8. Verificación | Sub-agente independiente | `sdd-verify` contrasta código contra spec, diseño y tareas; devuelve desviaciones | Gentle-AI |
| 9. Revisión humana | Gerencia (+ Servicio Técnico si toca su pantalla) | Demo en staging siguiendo los escenarios de la spec; comentarios en la PR | Git |
| 10. Cierre | Claude Code | `sdd-archive` funde el delta en `openspec/specs/`; `mem_save` de las decisiones y hallazgos con `topic_key`; `mem_session_summary`; nota para el Anexo H | Gentle-AI + Engram |

Regla de sesión: **una sesión de Claude Code, una tanda.** Si la tanda se alarga, se cierra la sesión con `mem_session_summary` y se retoma con `mem_context`; no se abre la siguiente tanda en la misma sesión para no mezclar contextos.

### 4.3 Plantilla del prompt de arranque

Es el texto que Gerencia pega al abrir la sesión. Está pensado para que el orquestador de Gentle-AI entre en SDD sin que haya que nombrar las fases.

```
Tanda: F1D-05-encadenamiento-no-ok
Fase/épica: Fase 1 · Épica 1D (Diagnóstico protocolizado)
Capacidad: diagnostico-checklist (spec actual en openspec/specs/diagnostico-checklist/spec.md)

Hazlo con SDD. Antes de proponer, recupera contexto con Engram (mem_context y
mem_search "encadenamiento no ok") y lee los apartados fuente.

Fuente (documento maestro R08.1, docs/Manifesto/…_R08.1.md): M2.1 «La arquitectura híbrida»,
M2.2, M2.3. Decisiones del 03/09/2026, tema 4 («Encadenamiento pendiente»). Datos de referencia:
docs/inspecciones/Grimm/Inspeccion_Fisica_GRIMM_EDM180_v1.8.xlsx, hoja «Flujo No OK 2»
(tabla plana origen → destino, un renglón por enlace). Mapeo: N1 → transición interna,
N2/N3 → checkpoints.

Objetivo: cuando un ítem del checklist sale No OK, el sistema activa los ítems
relacionados declarados en el catálogo, los muestra como «rama activa» y sugiere
la acción registrada. El contenido viene del catálogo importado en F1D-02; esta
tanda construye el motor, no el contenido.

Fuera de alcance: comentarios predefinidos (Fase 2), sugerencia por IA (Fase 4),
cambios en las macro-transiciones (F1D-03).

Gates: ninguno. Decisiones ya tomadas que aplican: validación por nivel macro
(decisiones del 03/09); el equipo sin novedades recorre las macros (P59, 27/08).

Criterios de aceptación mínimos (amplíalos en la spec):
- Dado un ítem con ítems relacionados, cuando se registra No OK, entonces los
  relacionados aparecen como pendientes en la misma visita, en el orden declarado.
- Dado un ítem sin relacionados, cuando sale No OK, entonces se muestra la acción
  por defecto según su criterio de falla (Alerta / Cobrable / Bloqueante).
- Un ítem activado por encadenamiento registra desde qué ítem se activó (traza).
- Nada de lo anterior modifica transitions.ts.

Reglas invariables: las de CLAUDE.md. Presenta la propuesta y espera mi aprobación
antes de la spec.
```

### 4.4 Reglas invariables para `CLAUDE.md` y `openspec/config.yaml → context`

Son las que ninguna spec puede contradecir. Se escriben una vez en la Fase 0 y se citan por número en las specs.

1. **Los estados y transiciones se declaran sólo en `packages/shared/src/transitions.ts`**; los permisos, sólo en `packages/shared/src/permissions.ts`. Ninguna regla de flujo vive en la interfaz.
2. **Nombres exactos.** Los estados se escriben como en el código (`Rev./Diagnostico`, `Por Entregar / Sin facturar`, `Notificación Comercial` sin artículo). Un nombre nuevo requiere una spec que lo introduzca.
3. **Toda transición registra fecha, hora y persona.** Sin excepciones (R08). Un cambio manual de estado («vía de escape») también, con motivo.
4. **Fin del texto libre en etapas críticas** (principio nº 4). Ningún campo de comentario puede ser obligatorio; lo obligatorio es un desplegable, una casilla o un valor.
5. **Un checkbox obligatorio sin marcar detiene la transición** (C1). El motor devuelve error, no `false`.
6. **Zoho es de solo lectura.** Ninguna tanda escribe en Zoho Desk, CRM o Books sin una decisión registrada sobre P44.
7. **Las dos entradas no se cruzan**: un ticket nacido en Zoho no se marca `managed_by_app` por una transición de la app (M1.3.2).
8. **El diagnóstico es configuración**: un equipo nuevo se incorpora importando su catálogo; si una tanda necesita código específico de una marca, la propuesta lo justifica.
9. **El cálculo es determinista; la IA recupera, no compromete** (principio nº 8). Ninguna fecha, carga o cifra de compromiso sale de un modelo de lenguaje.
10. **Cada spec cita su fuente** (apartado del documento maestro, registro de decisiones o punto abierto). Una spec sin fuente no se aprueba.
11. **El borrado de administrador no se usa para cerrar servicios** (P36); cerrar un servicio caído es `Anulado` (C2) o, mientras no exista, queda documentado en Engram.
12. **Idioma:** interfaz y specs en español; código y nombres técnicos en inglés como ya está en el repositorio.

### 4.5 Gates: decisiones que abren tandas

Cada fila dice **qué decide**, **a quién corresponde** y **qué desbloquea**. Cuando una decisión se cierra, se escribe en `openspec/config.yaml` → `decisiones_de_gerencia` con su respuesta textual, se guarda en Engram (`decision/<clave>`) y la tanda pasa de «escrita» a «ejecutable». La columna de estado NO es un calendario de encuentros: dice si está decidida y, si no lo está, a quién le toca.

>**LA TABLA QUEDA CERRADA ENTERA EL 2026-09-24, y conviene decirlo con una fecha porque no volverá a pasar.**
>Entre el 23 y el 24/09 Gerencia respondió **36** preguntas del panel, y con ellas **los 17 gates que seguían
>pendientes y el que estaba a medias** (`decision/top5-prioridad`). Ninguna fila de esta tabla espera ya una
>decisión. Lo que queda no son esperas: es trabajo, y tres **mediciones contra producción** que nadie ha hecho
>—el recuento de modelos (17/09), los modelos con inspección y artículos cargados (23/09) y el recuento de
>filas de «Liberación sin factura» anteriores al arreglo de C1 (24/09)—. Son tarea de persona, no tanda, y hoy
>son el cuello de botella real. Detalle de cada respuesta, con su texto literal y sus consecuencias, en
>`openspec/config.yaml` → `decisiones_de_gerencia`; traza de entrada en `docs/sdd/ENTRADA.md`; corte en
>`docs/sdd/Parte_2026-09-24.md`.
>
>**Segundo corte del mismo día, 24/09 13:38 UTC.** Gerencia responde **siete preguntas más**: los **cinco corchetes** que habían quedado sin elegir
>—`c10b-gerente-director`, `p14b-hoja-google`, `p55b-destino-copia`, `p64b-quien-ejecuta` y `e009b-lista-indicadores`— quedan **cerrados**, y las dos
>piezas de trabajo que ninguna tanda recogía reciben **fila propia decidida**: `barrido-comprobaciones-nuevas` (F0-06) y `calendario-habil`, las dos
>al final de esta tabla. **Ninguna de las dos filas está escrita en el §5**: esta supervisión no escribe alcance. El denominador pasará de **52** a
>**54** el día que se escriban, y el porcentaje bajará entonces por alcance, no por trabajo. Queda **un** corchete nuevo, el proveedor del
>almacenamiento de las copias (`p55c-proveedor-copia`).

| Clave Engram | Decisión | Tanda(s) que abre | Estado · a quién corresponde |
|---|---|---|---|
| `decision/n52-cardinalidad-ov` | **DECIDIDO 10/09.** La relación es `1 ticket : N OV`, sin tabla puente. La OV global por lote se elimina: Comercial subdivide en subórdenes (`OV-AAAA-NNN-SS`), una por ticket, al crear la OV | **IV-4 pasa de bloqueado a construible** (tercera puerta, `remision.ts:218-240`). ⚠️ La TITULARIDAD va aparte y sigue abierta: ahí queda IV-8 | cerrado 10/09 |
| `decision/vista-todos-tablero` | **DECIDIDO 10/09.** Opción (b): «Todos» pasa a devolver también los cerrados. Se descarta renombrarla a «Abiertos». Separar `case 'todos'` de `default:` no es opcional y va en la misma tanda | **F1B-08**, junto con IV-1 (`boardView.ts:35`), que no necesita decisión | cerrado 10/09 |
| `decision/p21-ingreso-sin-ov` | **DECIDIDO 10/09.** Se deja como está: OV **opcional** en «Nuevo ticket», **obligatoria** en `Habilitar Servicio`. «OV obligatoria para trabajar, no para recibir». Confirma lo construido, no lo cambia | F1B-03 (regla definitiva). Arrastra a **F1B-08** el trabajo de `Remisión creada` / `en_espera` (§7.1 de las decisiones). Y con esta salida **IV-2 deja de ser opcional** | cerrado 10/09 |
| `decision/habilitar-servicio-sin-remision` | **DECIDIDO 10/09, y sin destino hasta el 17/09** (§7.3 de `docs/sdd/Decisiones_Gerencia_2026-09-10.md:353-356`). La guarda exigirá **remisión de entrada vigente (no anulada)** para los tres orígenes de `Habilitar Servicio`, incluido `Ticket creado`, que hoy llega a `Ingresado` **sin remisión**. Medido el 17/09: el código sigue sin la guarda — las siete de `executeTransition` (`ticketService.ts:117`, `:119`, `:121`, `:124`, `:128`, `:135`, `:143`) no miran remisiones | **F1B-03.** Por procedencia y por capacidad: misma transición y mismo documento que `p21` (`:366` de este fichero, que ya rutea ahí «la regla definitiva»), y la guarda vive en `executeTransition`, capacidad `transitions-st`, que es suya por `:470`. ⚠️ **Construirla MODIFICA `RQ-TS-02`** (`openspec/specs/transitions-st/spec.md:78-79`), que hoy declara con **SHALL** que `habilitar_servicio` sale de las tres fases tempranas: **no es añadir un requisito, es cambiar uno vivo.** **Dos condicionantes que la propia §7.3 ya trae:** (a) **rompe el invariante 3** (`packages/shared/src/invariantesGrafo.test.ts:62`, «Finalizado es el único estado sin transición de salida»), porque `habilitar_servicio` es la única transición **con botón** que sale de `Ticket creado` (`transitions.ts:178`; la otra ocurrencia, `:164`, es una función auxiliar), y **relajarlo lo toca F1B-06**; (b) exige un **conteo previo** —cuántos tickets llegaron a `Ingresado` sin remisión— que **nadie ha hecho y necesita acceso a la base de producción**: es **tarea de persona**, va declarada aparte y **NO se cuenta como tarea** (regla del ciclo 1 de `CLAUDE.md`) | cerrado 10/09 · destino escrito 17/09 · construible en **S40** |
| `decision/subov-lote-convencion` | **DECIDIDO 10/09.** Opción A: convención `OV-AAAA-NNN-SS` —modifica el formato del 27/08—, cuarentena de números no canónicos, saldo por lote, **un ticket vigente por subOV** y anulación que libera. B y C quedan registradas como alternativas | **F1B-11** (subOV de lote) | cerrado 10/09 |
| `decision/iv2-fechas-derivadas` | **DECIDIDO 10/09.** Opción (a): el servidor calcula las tres fechas derivadas e **ignora** lo que llegue del navegador; la zona horaria se fija de forma explícita | **F1A-07** | cerrado 10/09 |
| `decision/mapa-blueprint-generado` | **DECIDIDO 10/09.** Sí, generado desde `transitions.ts` con prueba anti-desfase. El artefacto interactivo queda como **histórico congelado en `a3a8f03`** | **F1A-06** (lo construye) · **F1B-09** (lo hereda funcionando) | cerrado 10/09 |
| P38 · salida aprobada (Engram obs. #400) | **DECIDIDO 10/09 con datos de Zoho Desk.** `Verificación` —`Liberación`→ `Finalizado`, observada **71 veces en 181 tickets**. `Verificación` es paso del flujo, condicional por familia de equipo. Cierra **P38 en parte**: el resto va en la fila siguiente | **F1A-03** | cerrado 10/09 |
| `decision/p8-p54-drive` | **DECIDIDO 21/09.** Textual: «Por cuestiones de capacidad de almacenamiento en nuestro servidor vamos a seguir teniendo enlace a Drive». Decía: «Botón de enlace a Drive como fase 0; convivencia con Drive» | F1B-02 | **cerrado 21/09** (recogido 22/09). El enlace se queda y no hay versión que sustituya a Drive; F1B-02 (S39) queda ejecutable. El motivo es capacidad del servidor, así que se revisa el día que esa capacidad cambie. ⚠️ Quien responda `decision/p55-backup` tiene que decir si el respaldo alcanza a Drive |
| `decision/p45-macro-fases` | **DECIDIDO 23/09.** Textual: «Los N1 son propios de cada marca, no comunes a todas. El Grimm EDM180 conserva sus 8 N1 y el Horiba sus 10 N1 […] Las cuatro macro-fases del 27/08 quedan superadas, y se corrige el maestro» | F1D-03 | **cerrado 23/09** (recogido 24/09). Resuelve la contradicción del 17/09 al revés de lo que parecía: el maestro daba el nº 45 por resuelto DE MÁS, y se corrige. El motor es uno y los N1 entran como datos del catálogo de cada marca (Grimm v1.8: 8 N1; Horiba v1.4: 10 N1, válidos para los cuatro AP-370). Dos correcciones de catálogo son tarea de persona, no tanda |
| `decision/flujos-comercial-posible-cliente` | **DECIDIDO 21/09.** Textual: «Se quedan en Zoho CRM no se queda en Desk 2.0» | F1B-06 | **cerrado 21/09** (recogido 22/09). M1.11 y M1.12 quedan fuera de Desk 2.0 en 2026: F1B-06 construye **dos** ramas, no tres. La independencia comprometida es de Zoho **Desk**; CRM se queda. Arrastra el Anexo D nº 42 —de dónde sale «Preparación Cotizac.»—, que queda sin responder |
| `decision/top5-prioridad` | **DECIDIDO EN PARTE 21/09**, textual: «No automático, Hay que pensar en una forma de hacerlo manual». **COMPLETADO 23/09** (`decision/top5-manual`), textual: «La prioridad automática sigue para todos los clientes; los Top 5 son la excepción y su prioridad se pone a mano. Se pone **sobre el cliente, no sobre cada ticket**: se fija una vez y todos sus tickets la heredan […] La pone el Director Comercial, que también mantiene la lista de quiénes son Top 5. El técnico sigue sin poder editarla, como dice el plan: el bloqueo es para el técnico, no para ese cargo» | F1B-07 | **cerrado 23/09** (recogido 24/09). **La tabla de gates queda cerrada entera.** ⚠️ Desmiente la interpretación que esta supervisión dejó escrita el 22/09: el cálculo automático **sigue** para el resto de clientes, así que F1B-07 **no** cambia entera. La prioridad pasa a vivir en el **cliente**, no en el ticket — lo mismo que decide `decision/anexo-53-contratos` (24/09) para los contratos, y ahí se fija el desempate: manda la más alta de las dos. El plan no se contradice: «edición manual bloqueada para el técnico» (`:162`) sigue en pie. Medido el 22/09 y no cambiado: la noción de Top 5 **no existe** en el código |
| `decision/p38-verificacion-calidad` | **DECIDIDO 23/09, las TRES respuestas.** (1) Verificación obligatoria por TIPO de equipo, sea cual sea la marca: analizadores de gases y convertidores, y no el resto. (2) La guarda sólo la exige cuando hay gas patrón: el lote AP-370 de 2024 (#601–#622, #653–#654) no pasó porque son H2S, TRS y NH3 y no tenemos ese gas — «no fue un error, es el criterio». (3) La salida rechazada va a `Notificado` | F1A-03 · F1B-06 · F1C-07 | **cerrado 23/09** (recogido 24/09). Cierra ENTERO el Anexo D nº 38, «parcialmente resuelto» desde el 10/09. ⚠️ **F1A-03 sale de la espera**: era una de las dos vencidas de S38 y su gate era éste; pasa de espera a trabajo pendiente. La lista de gases patrón disponibles es un DATO mantenible que hoy no existe (`grep -rniE "gas.?patron" packages/ apps/ --include=*.ts` = 0). Respondido por Gerencia, validado por Calidad |
| `decision/escalado-remision-creada` | **DECIDIDO 17/09.** Textual: «Tanto el que tiene cargo de director comercial como el que tiene cargo de coordinador comercial deberían recibir el aviso cuando un ticket lleva más de 72 horas en remisión creada sin orden de venta.» Registrada en `openspec/config.yaml` → `decisiones_de_gerencia` | **F1B-08.** Desbloquea la alarma de 72 h, que sigue sin construir: `SLA_HORAS_POR_ESTADO` (`packages/shared/src/sla.ts:32-35`) tiene una sola entrada, `'Notificado': 24` | **cerrado 17/09.** ⚠️ **Tres consecuencias medidas el 18/09 contra `995adbc`, anotadas y NO decididas:** (a) el destinatario es **doble** y `destinatarioDelEscalado` (`sla.ts:92-109`) devuelve `ambiguo` con dos cargos, a propósito (`sla.ts:78-82`) — el tipo `DestinatarioEscalado` (`sla.ts:88-90`) lleva **un** cargo, no una lista; (b) `Director Comercial` **no existe** como cargo en el código (`grep -rn "Director Comercial" packages/ apps/ --include=*.ts` = 0); (c) dar entrada a `habilitar_servicio` en `DERIVACION_POR_DEFECTO` **cambia `RQ-AV-02`** (`openspec/specs/derivacion-avisos/spec.md:67-70`), que declara con SHALL **exactamente tres** entradas. **PRECISADO 17/09, recogido 21/09** (`decision/escalado-destinatario-doble`), textual: «En usuarios existe Nombre: Administrador, Cargo: Director Comercial, revisa. El aviso debe ir a cargo de coordinador comercial». El aviso va a **un** cargo, `Coordinador Comercial` (`transitions.ts:278`): (a) y (b) dejan de aplicar; (c) sigue en pie |
| `decision/ovi-garantia-autor` | **DECIDIDO 17/09.** Textual: «La OVI la crea Servicio Técnico, más concretamente el Director Técnico». Registrada en `openspec/config.yaml` → `decisiones_de_gerencia` | **F1B-03** | **cerrado 17/09** (recogido 21/09). Excepción de autor a «Comercial crea la OV», y por CARGO: cruza con `decision/c10-permisos-cargo`, pendiente |
| `decision/vigencia-contrato` | **DECIDIDO 17/09.** Textual: «En teoría no pero si el contrato se vence antes del final del año se puede hacer una ampliación del contrato para consumir los trabajos no ejecutados. Si ya pasamos al siguiente año no se podría consumir porque la lista de precios cambia.» | F1B-11 (no bloquea el núcleo) | **cerrado 17/09** (recogido 21/09). No es el «no» liso que habría abierto la opción B: la A del 10/09 no se reabre. El código no modela vencimiento ni ampliación |
| `decision/titularidad-ov-equipo` | **DECIDIDO 17/09.** Textual: «Generalmente el titular del equipo es el que genera la orden de venta. Tenemos 1 solo caso donde el generador de la orden de venta no es el propietario del equipo es el mantenedor del equipo» (**IV-8**, `apps/desk/server/services/ticketService.ts:39`) | F1B-11 | **cerrado 17/09** (recogido 21/09). Pueden ser de clientes distintos en el caso del mantenedor. **PRECISADO 21/09, recogido 22/09** (`decision/titularidad-mantenedor`), textual: «Opción 1 — el mantenedor se apunta en la hoja de vida del equipo y sólo él puede pagar órdenes de ese equipo; cualquier otra discrepancia se bloquea». **IV-8 pasa a tener destino: F1B-11.** El campo de la hoja de vida cae en el contenido de F1B-02 (S39), que hoy declara cuatro campos: destino **propuesto**, no escrito |
| `decision/p62-capa-as-built` | **DECIDIDO 24/09.** Los dos criterios, cada uno en su sitio: del cuerpo M1–M12 se retiran marcas [AS-BUILT], rutas y números de línea, y los pasajes as-built con una regla decidida se reescriben como regla de negocio; el Anexo H se mantiene pero **deja de redactarse a mano** y se genera desde `docs/sdd/RECONCILIACION.md` en cada R08.x | — (premisa de F0-02) | **cerrado 24/09.** Sin decidir desde el 03/09: **21 días**. Da a `npm run reconcile` un consumidor real y cierra el bucle de F0-05. ⚠️ Orden con **F1A-09** (barrido de citas tras la R08.2, VENCIDA de S38): hacerlo al revés barre citas que van a desaparecer. «Donde decía demostrador, se actualiza: la aplicación ya está en uso» |
| `decision/c2-anulado` | **DECIDIDO 23/09.** Cinco motivos de Anulado, los del informe de salida; «creado por error» y «duplicado» NO entran —eso se borra, no se anula, para no contaminar la cifra de abandonos—. Histórico: **se marca, no se reescribe** | F1C-01 (y protege F1E-03) | **cerrado 23/09** (recogido 24/09). Candidatos por la huella Rechazo→Finalizado, confirmados por una persona; siguen como `Finalizado` con marca «abandonado» y las tres métricas los excluyen, por la auditoría inmutable de M11.4. ⚠️ `Anulado` es estado nuevo: la cifra anclada de 21 estados se moverá por decisión, no por error. El recuento previo es **tarea de persona** contra producción |
| `decision/c4-dos-ramas` | **DECIDIDO 23/09.** `Facturado` es **atributo del ticket, no estado**: vive en `fecha_factura`, que ya existe. Dos ramas, sin ciclo facturar↔entregar. En la rama sin factura, `Pendiente de facturar` **sí** es estado —ahí vive el equipo entregado y no facturado y su antigüedad se mide— y de ahí se sale con `Facturar` directo a `Finalizado` | F1C-02 | **cerrado 23/09** (recogido 24/09). «Así no hay dos sitios que puedan decir cosas distintas» — el mismo razonamiento que el 21/09 sobre la orden de venta. El cobro se sigue en contabilidad, no en el ticket. De la antigüedad de `Pendiente de facturar` cuelga la alarma de fecha prevista del Anexo D nº 33 |
| `decision/c3-salida-esperas` | **DECIDIDO 23/09.** Las cuatro **no** se tratan igual. `En espera de repuestos` y `Servicio externo` (terceros): dos salidas, decide Comercial —Por Facturar cobrando el diagnóstico, o Anulado—. `Solicitado` (nuestro almacén): no se abandona, vuelve a `En espera de repuestos`. `En espera de SKU` (trámite nuestro): ni se abandona ni se anula, se avisa a Comercial | F1C-03 | **cerrado 23/09** (recogido 24/09). **La caducidad NUNCA ejecuta sola una salida**: en las externas la sugiere, en las internas escala. ⚠️ El plazo se fija con el percentil 90 del historial por estado: es una **medición contra producción que nadie ha hecho**; sin ella F1C-03 se construye con plazos inventados. Se conserva la vía de escape manual con traza del 27/08 |
| `decision/c5-tipo-evento` | **DECIDIDO 23/09.** **No bloquea.** Medido: ninguna transición de la aplicación es «Creación de informe» —sólo existe el campo «Fecha Revisión Informe» dentro de otras (`packages/shared/src/transitions.ts:218-221`)— y hoy el informe se hace fuera del flujo. La desambiguación se aplica en F1E: Elaboración → Operativo, Emisión → Administrativo, Validación → Decisional | F1C-04 | **cerrado 23/09** (recogido 24/09). La pregunta se planteó como bloqueante y la respuesta la desactiva con una medición, verificada el 24/09 sobre `3f30710`: **F1C-04 puede etiquetar las 34 transiciones ya**. «Operativo manual» y «Operativo digital» son la misma categoría desde el 17/02. M7.3 deja de depender de este gate |
| `decision/c10-permisos-cargo` | **DECIDIDO 23/09.** La base sigue siendo el **área**; el cargo **sólo restringe**, con una lista corta de excepciones —Liberación sin factura → Director Comercial; crear OVI de garantía → Director Técnico; prioridad de los Top 5 → Director Comercial—. Regla para el resto: lo que F1C-04 clasifique como **Decisional** sólo lo ejecuta el Director o el Coordinador del área | F1C-05 | **cerrado 23/09** (recogido 24/09), **con un fleco**. No hay matriz cargo × 34 transiciones que rellenar: eso separa una tanda S–M de una L. F1C-05 **pasa a depender de F1C-04** (S43). Siete cargos declarados y el código conoce **dos** (`transitions.ts:276-281`). El **propietario del registro se aplaza expresamente**, y el plan promete hoy «por cargo Y por propietario». ⚠️ ~~Parcial: si «Gerente comercial» y «Director Comercial» son el mismo cargo queda sin elegir~~ — **RESUELTO 24/09** (`decision/c10b-gerente-director`): **son el mismo cargo**, y el formal es **Director Comercial**. Siete cargos: Director Técnico, Coordinador Técnico, Técnico, Técnico de campo, Director Comercial, Coordinador Comercial y Asistente Comercial. La fila queda **cerrada entera, sin fleco**. Corregido el `:178` de este fichero. El código sigue conociendo dos cargos (`grep -rn "Director Comercial" packages/ apps/ --include=*.ts` = 0 el 24/09) |
| `decision/c7-reloj-sla` | **DECIDIDO 23/09.** El reloj se para **sólo cuando la demora no es de Ambientalia**. Para en 5: `Notificación cliente`, `Por Entregar`, `Por Entregar / Sin facturar`, `En espera de repuestos` y `Servicio externo`. Sigue corriendo en las 6 esperas internas. **La lista se declara propia del reloj y NO se deriva de la de la vista** | F1C-06 | **cerrado 23/09** (recogido 24/09). Hace exactamente lo que el código pedía: `estados.ts` avisaba de que `ESTADOS_EN_ESPERA` «es la lista de la VISTA y el reloj no la lee». Medido el 24/09: 21 claves, 5 `externa`, 6 `interna`, 9 `ninguna`, 1 `sin_clasificar` — los cardinales coinciden hoy, y como la decisión prohíbe derivarla hace falta una prueba que impida importarla. `Pendiente` sigue sin clasificar y el reloj **corre** mientras tanto |
| `decision/c6-qa-liberacion` | **DECIDIDO 23/09.** Estado **`Control de calidad`** entre `En Proceso` y `Por Facturar`. Aprobado → `Por Facturar`; rechazado → vuelve a `En Proceso` **con prioridad alta**, y el retrabajo se registra para medirlo. No se entrega el equipo sin foto del equipo embalado y checklist firmado | F1C-07 | **cerrado 23/09** (recogido 24/09). Firma el **Coordinador Técnico**, nunca el técnico que hizo el trabajo: el corchete de la respuesta lo resuelve `decision/roles-validacion-informe` (24/09) — «la revisión del Coordinador es la misma firma del Control de calidad, se hace en un solo paso». ⚠️ «Nadie valida lo que él mismo hizo» es guarda por **persona**, y `c10` construye cargo: hay que escribirla aparte. Hereda de P38 la regla del gas patrón |
| `decision/p15-p59-rutas` | **DECIDIDO 23/09, y partido.** **Equipo sin novedad: NO** se rehabilita la ruta abreviada —ya se decidió el 03/09: recorre las etapas macro—. **Calibración directa: SÍ**, cuando la OV ya cubre la calibración el ticket salta diagnóstico, cotización y aprobación, con tres condiciones: sólo con la OV de calibración asignada, si aparece falla sale a la ruta completa, y pasa igualmente por Control de calidad | F1C-08 · y F1B-03 | **cerrado 23/09** (recogido 24/09). **F1C-08 encoge**: lo que pueda lo hace F1B-03 (S40) con el tipo de servicio, que ya oculta pasos; F1C-08 se queda con el resto. ⚠️ Gerencia señala que **la decisión del 03/09 nunca llegó al plan** —21 días suelta—, que es el modo de fallo que F0-05 existe para cerrar; queda registrada aquí |
| `decision/falla-nueva-bloqueante` | **DECIDIDO 23/09.** Son **dos cosas**: rellenar el formulario es **obligatorio** siempre —corto: qué es, dónde está, gravedad y foto—; que **bloquee** depende de la gravedad que el técnico asigne (Alerta, Cobrable o Bloqueante), igual que las del catálogo. Toda falla nueva avisa al Director Técnico, que confirma la gravedad y decide si entra al catálogo | F1D-07 | **cerrado 23/09** (recogido 24/09). La pregunta era falsa dicotomía y Gerencia la deshace. Las tres gravedades ya existen para el catálogo: F1D-07 reutiliza el mecanismo y no estrena uno. Con `decision/anexo-56-taxonomia` (24/09), F1D-07 pasa de bloqueada por **dos** gates a ejecutable. Cierra el circuito con el Anexo D nº 9 por el otro extremo |
| `decision/p14-remisiones-entrada` | **DECIDIDO 23/09.** **De la aplicación.** `remisiones_entrada` era una pestaña de una hoja de Google —no la plataforma de hojas de vida—; sus **149** remisiones (29/01/2025–24/07/2026) se importaron **una sola vez** el 04/08 y desde entonces las remisiones de entrada se crean y viven en la aplicación. Ningún proceso vuelve a leer la hoja | F1E-01 | **cerrado 23/09** (recogido 24/09). Ninguna de las dos opciones de la pregunta era exacta: material de clase C para la R08.x. F1E-01 queda **sin dependencia externa**, que era el riesgo. Las remisiones históricas conservan como **texto libre** lo que traía el equipo, y los informes de esos tickets lo mostrarán sólo como texto — eso es una rama del generador de informes. ⚠️ ~~Parcial: si la hoja de Google se sigue usando queda sin elegir~~ — **RESUELTO 24/09** (`decision/p14b-hoja-google`): **se sigue usando** y se cierra el **14/12** con el corte. Mientras convivan, **manda la aplicación** y la hoja se corrige. Dos compromisos con fecha y **sin fila**: antes del **31/10**, averiguar quién la rellena y qué le da que la aplicación no; el **14/12**, cotejo una a una de las filas posteriores al 24/07/2026 contra las remisiones de la aplicación — eso es migración de remisiones, y F1F-01 habla hoy de tickets abiertos |
| `decision/roles-validacion-informe` | **DECIDIDO 24/09.** **Tres firmas**: Elaboró (el técnico), Revisó (Coordinador Técnico) y Aprobó (Director Técnico). Las dos validaciones antes de emitir son las del Coordinador y el Director. **Nadie valida un informe que él mismo elaboró.** Si falta uno, el otro revisa y aprueba en un paso y el informe queda marcado «validación única». El área Comercial no valida informes | F1E-04 | **cerrado 24/09.** Los cuatro casos escritos, no la regla general con sus excepciones por descubrir. **Resuelve además el corchete de `c6-qa-liberacion`**: la revisión del Coordinador ES la firma del Control de calidad y no se pide dos veces. ⚠️ Alcance nuevo pequeño: la **ausencia del Director Técnico se registra con fecha de inicio y fin**, y sólo mientras esté vigente puede aprobar el Coordinador — es una entidad que hoy no existe en ninguna tanda. Aprobado, el informe ya no se puede modificar (M11.4) |
| `decision/p44-escritura-zoho` | **DECIDIDO 17/09.** Textual: «Por ahora no queremos activar la escritura contra Zoho. En caso necesario nos tocará tener un "espejo de Zoho" en nuestra app que permita comparar y escribir nosotros a mano en Zoho hasta que estemos preparados para activar la escritura en Zoho (futuro).» | F1B-08 | **cerrado 17/09** (recogido 21/09). El «espejo» es alcance condicional sin fila (E-018) |
| `decision/p55-backup` | **DECIDIDO 24/09.** Responsable: **Alfonso (Gerencia)**. Copia automática **cada noche** y **una extra antes de cada cambio** que se suba; se conservan 7 diarias, 4 semanales y 12 mensuales; base completa y todos los archivos, cifrados **fuera** del servidor de Hostinger; restauración de prueba **mensual**, cuyo resultado se anota en el parte | F1F-02 | **cerrado 24/09**, **con adelanto inmediato**. ⚠️ Lo urgente no es la tanda: «la copia nocturna y la previa a cada cambio se ponen en marcha **ya**, sin esperar a diciembre». Es consecuencia directa de `decision/e013b-copia-pruebas` — sin copia de pruebas, cada cambio se prueba sobre la aplicación en uso y la copia previa es la única red. **Ese adelanto no tiene fila.** ⚠️ La advertencia que dejó escrita `decision/p8-p54-drive` sigue sin respuesta: el alcance enumera «todos los archivos», pero los documentos que viven en **Drive** no están en el servidor. Devuelto, con el destino de las copias, como `p55b-destino-copia` — **RESPONDIDO 24/09**: almacenamiento de objetos de un proveedor distinto de Google y de Hostinger, con credenciales propias no usadas para trabajar y **bloqueo de borrado durante la retención**; la carpeta de documentación de servicio de **Drive** se copia al mismo destino, semanal e incremental, retención 12 meses, **sin pasar por el disco del servidor**, y la prueba mensual incluye restaurar un documento suyo. ⚠️ El **proveedor** sigue entre corchetes y la copia nocturna hay que arrancarla **ya**: devuelto como `p55c-proveedor-copia` |
| `decision/fecha-corte` | **DECIDIDO 24/09.** Los tickets nacen en la aplicación desde el **lunes 14 de diciembre de 2026**. **Corte en seco**: desde ese día nadie crea ni edita en Zoho Desk y ningún ticket vive en los dos sistemas. El fin de semana anterior (12–13/12) los tickets abiertos pasan a la aplicación y Zoho queda en solo lectura. Se confirma el **miércoles 9 de diciembre**; si algo falta, pasa al **lunes 21**, última fecha posible | F1F-01 | **cerrado 24/09.** ⚠️ **Es la decisión más restrictiva del corte**: el calendario del §5 llega a S53 y el corte cae en **S51**. Todo lo situado en S52–S53 queda **después**. Margen real medido el 24/09 (S39): **once semanas**, no catorce. Cuatro condiciones de confirmación, y la que hoy no tiene tanda cerrada es **responder al cliente por correo sin pasar por Zoho**. La migración es un fin de semana y **no hay copia de pruebas donde ensayarla** (decisión del 21/09). El tope del 21/12 lo fija la renovación de licencias de Zoho |
| `decision/p64-historico-c1` | **DECIDIDO 24/09.** **Se marcan**; no se corrigen ni se excluyen, con el criterio de `c2`. Conservan sus valores en `ticket_transitions.values` con la marca «anterior al arreglo de C1 — sin afirmación registrada», cuentan en el recuento y quedan fuera sólo de los indicadores que dependen del motivo o de la fecha prevista. Las de tickets aún en `Pendiente de facturar` **se regularizan hacia adelante** | — (dato de producción, sin tanda) | **cerrado 24/09.** Tercera aplicación en dos días de la misma doctrina —marcar, no reescribir—: ya no es criterio por caso, es la regla del proyecto para todo histórico. «Regularizar hacia adelante» es la pieza nueva: el Director Comercial registra motivo y fecha prevista como **evento nuevo**, sin tocar la fila original. Claude Code prepara la consulta de **solo lectura**; ⚠️ ~~quién la ejecuta contra producción quedó entre corchetes~~ — **RESUELTO 24/09** (`decision/p64b-quien-ejecuta`): **lo ejecuta Alfonso**, las tres consultas juntas, el **viernes 25/09**. Plazos límite: 25/09 el recuento Rechazo → Finalizado (F1C-01 empieza el 28/09), 02/10 las liberaciones sin factura anteriores al arreglo de C1, 09/10 el catálogo de modelos. ⚠️ **Vence hoy** la parte de construcción: el fichero con las tres consultas de sólo lectura lo prepara Claude Code **antes** del viernes, y hoy no existe |
| `decision/calendario-habil` | **DECIDIDO 24/09.** El calendario laboral se construye **ahora y como pieza propia**, antes de cualquier alarma: jornada L-V de 8 a 17, tabla de festivos de Colombia generada por año —traslados a lunes y Semana Santa incluidos— más los cierres que registre Gerencia, y **una sola función compartida** de horas y días hábiles. «Ninguna otra tanda construye su propio cálculo» | **Fila nueva, talla S** (sin escribir en el §5) · precede a **F1B-08**, **F1C-06**, la fecha prevista del nº 33 y los indicadores de `e009b` | **cerrado 24/09.** ⚠️ Toca contenido de una tanda **cerrada**: `SLA_HORAS_POR_ESTADO` (`packages/shared/src/sla.ts:32-35`) tiene hoy `'Notificado': 24` en horas de reloj y pasa a **9 horas hábiles** (F1A-02, cerrada). Medido el 24/09 sobre `3f30710`: `grep -rniE "festivo|holiday" packages/ apps/ --include=*.ts` = **0**. DENOMINADOR: 52 → 53 el día que se escriba la fila. Cierra E-061 |
| `decision/barrido-comprobaciones-nuevas` | **DECIDIDO 24/09.** Fila nueva **F0-06**, «Vigilancias del repaso automático», talla S, en la cola de inmediato: tanda de método de Fase 0 que cuenta en el total y en el avance. Dos comprobaciones en `apps/desk/server/reconciliacion/cli.ts` — commits de `main` sin ficha, y decisiones sin llegar al maestro con su antigüedad, marcando desvío a partir de un mes | **F0-06, fila nueva** (sin escribir en el §5) · da mecanismo a **R-5** de `CLAUDE.md` y constructor a `anexo-61-incorporacion` | **cerrado 24/09.** Gerencia fija ella misma el denominador: **53** con F0-06, **54** con el calendario laboral. ⚠️ Compromiso **con fecha y sin tanda**: la primera R08.x que incorpora lo decidido se publica **antes del 17/10**, independientemente de F0-06. Medido hoy: **59** decisiones con `maestro_revision: pendiente`, y las 16 más antiguas vencen **el 17/10**. Cierra E-060 |

> **⚠️ Barrido de ruteo de `Decisiones_Gerencia_2026-09-10.md`, hecho el 2026-09-17 al registrar la §7.3.**
> El ruteo de ese documento se hizo **sección a sección**, y por eso se pierden secciones enteras sin que
> nada lo avise: `:366` de este fichero rutea la **§7.1** por su nombre, y la **§7.3** estuvo siete días sin destino. Medido
> contra este plan y `openspec/config.yaml`, las **tres seguían sin rutear** esa mañana, y a las tres las rutea la sincronización con el libro R01.3 de esa misma tarde. Se conservan las dos medidas, porque lo que enseña el hueco es **cuánto duró**, no que siga abierto:
>
> | Sección | Asunto | Estado medido el 17/09, **antes** de la sincronización con el libro R01.3 | Estado **después** |
> |---|---|---|---|
> | **§7.2** (`:336`) | La alarma `N = 3 días`, que va a `SLA_HORAS_POR_ESTADO` (`packages/shared/src/sla.ts:32`, cuya única entrada hoy es `:34`) | **sin clave y sin destino** — cero apariciones de su asunto en el plan y en `config.yaml`. La propia §7.2 avisa de que pondrá **roja** la guarda de C11 | **RUTEADA.** El libro la lleva como `decision/escalado-remision-creada` → **F1B-08**, con el mismo aviso sobre C11 |
> | **§7.4** (`:379`) | `Garantía → OVI`, que es un cambio de práctica | **sin clave y sin destino** — los aciertos de «garantía» del plan son F1B-02 (hoja de vida), otro asunto | **RUTEADA.** `decision/ovi-garantia-autor` → **F1B-03**, que además la lleva en su contenido |
> | **§7.5** (`:403`) | Segunda OV en `Aprobación`: **añade, nunca sustituye** | **sin clave propia.** El modelo `1 ticket : N OV` está en `decision/n52-cardinalidad-ov`, pero ni la regla ni su consecuencia —que `Fecha Orden de Compra` deje de pisarse— | **RUTEADA, sin clave propia.** La regla y su consecuencia entran en el contenido de **F1B-11**: «`Aprobación` y `Aprobación y S. Repuestos` añaden OV sin sustituir la de entrada, y la fecha de OC vive en cada asociación» |
>
> Y aparte de las secciones: **seis claves `decision/*` viven en `openspec/config.yaml` sin fila en esta
> tabla** — `as-is-antes-de-redisenar`, `f0-00-preflight-y-tooling`, `f0-03-punto-3`,
> `informes-en-fase-1`, `serial-obligatorio-en-remision` y `x-v2`. **Eran siete hasta el 17/09**:
> `subov-lote-convencion` —que es la **§8** entera— ya tiene fila propia, traída de la hoja «Gates» del
> libro R01.3 en esta misma sincronización.
>
> **A ninguna se le asigna destino aquí, y se dice a propósito**, por la misma razón que la llevan escrita
> IV-9 e IV-11 de `CLAUDE.md`: asignar una épica de memoria es lo que dejó cuatro desvíos huérfanos al
> cerrar F1A. Que lo asigne quien decida el alcance.

### 4.6 Cadencia semanal

**Lunes:** Gerencia revisa `mem_context`, elige las tandas de la semana según los gates abiertos, y abre la primera sesión con el prompt de arranque. **Martes a jueves:** una sesión por tanda; cada tanda cierra con PR, `sdd-verify` y `mem_session_summary`. **Viernes:** sesión con el equipo técnico —la del 11/09 es la primera—: demo de lo cerrado en staging siguiendo los escenarios de las specs, cierre de gates con decisión escrita, revisión de las tablas del diagnóstico. Tras la sesión, Gerencia guarda las decisiones en Engram y en el Anexo C, y actualiza el Anexo H con las specs archivadas. Al cierre de cada épica se corre la tanda `audit-*` (auditoría de blueprint con IA, M11.6) y sus hallazgos entran al Anexo D.

### 4.7 El mapa documental del repositorio

La documentación de soporte ya vive en `docs/` del repositorio `C:\dev\Desk_2_R1.023`; el plan no inventa otra estructura, la describe para que `CLAUDE.md` y `openspec/config.yaml → context` la citen tal cual. Lo único nuevo es la carpeta `openspec/` en la raíz y la versión Markdown del documento maestro.

| Ruta | Qué es | Estado | Cómo la usan los sub-agentes |
|---|---|---|---|
| `docs/Manifesto/` | **Documento maestro** (`…_R08.1.docx`, `Anteriores/` R01–R08) y la presentación al equipo técnico | R08.1 vigente | Fuente de toda spec. **F0-01 añade una exportación `…_R08.1.md`** (pandoc) junto al `.docx`, porque los agentes no leen Word con fiabilidad; se regenera con cada revisión |
| `docs/analisis-tickets/` | **Diagramas de flujo as-is** (hojas DF de febrero: servicio técnico 16/02, equipo nuevo y soporte remoto 03/02, comercial 05/02), diccionario de campos, `Tickets.xlsx`, tabla maestra del flujo de calibración GRIMM | En revisión por la R08.1 | Referencia para `transitions-*`, `tickets-core` (Anexo G) y para la auditoría F0-00 |
| `docs/inspecciones/Grimm/` · `docs/inspecciones/Horiba/` | **Catálogos de diagnóstico** (`Inspeccion_Fisica_GRIMM_EDM180_v1.8.xlsx`, `…HORIBA_AP370_v1.4.xlsx`, con `Anteriores/` y el documento de estructura) | En revisión por Servicio Técnico | Dato de entrada de F1D-02; **N1 → transiciones internas, N2/N3 → checkpoints** (F1D-03, F1D-04) |
| `docs/superpowers/specs/` · `docs/superpowers/plans/` | 52 diseños y 60 planes (02/06–12/08/2026) de la metodología anterior | **Histórico, congelado** | Materia prima de las specs as-built (F0-02); ninguna tanda nueva escribe aquí |
| `docs/sdd/` | Este plan (md, docx) y el libro de revisión Man on the Loop | Vivo | Gerencia lo actualiza por revisión; el `CLAUDE.md` lo cita como plan vigente |
| `docs/blueprint-servicio-tecnico.md` | Blueprint de referencia (convención de asunto, campos que disparan el flujo, prefijos) | Vigente | Fuente para `tickets-core` y `transitions-st` |
| `docs/modelo-autorizacion.md` | Modelo de permisos | Vigente | Fuente para `permissions` y C10 |
| `docs/migracion-zoho-roadmap.md` · `docs/zoho-hub/` | Hoja de ruta y spike de replicación lógica | Vigente | Fuente para `zoho-sync` y F1F-01 |
| `docs/remisiones/` | Datos y correlación de códigos internos ↔ equipos Zoho | Vigente | Fuente para `remisiones` y para el código interno del cliente (F1B-02) |
| `docs/artefactos/blueprintserviciotecnico.html` | Mapa de transiciones generado con IA (auditoría R04) | **Histórico, congelado en `a3a8f03`** (`decision/mapa-blueprint-generado`, 10/09; precedente `docs/superpowers/`) | Ninguna tanda lo regenera ni lo cita: **no tiene generador en el repositorio**. Se sustituye por la fila siguiente |
| `docs/artefactos/blueprint-*.md` | Mapa de transiciones **generado desde `transitions.ts`** por script: Mermaid `stateDiagram-v2`, el completo más una vista por cada una de las tres fases de M1.3.1 | **Por construir** — `decision/mapa-blueprint-generado` (10/09) | Lo construye una tanda de F1A, antes de F1B-06. Una prueba impide que quede desfasado; F1B-09 lo hereda funcionando |
| `docs/runbooks/` · `DEPLOY.md` | Operación y despliegue | Vigente | F0-04 y F1F |
| `debt.md` | Deuda técnica con auditoría interna del 19/06 y roadmap del 07/08 | Vigente | F0-00 la reclasifica; cada tanda que cierra un punto lo marca |
| **`openspec/`** (nuevo) | `config.yaml` · `specs/<capacidad>/spec.md` · `changes/<tanda>/` | Se crea en F0-01 | La verdad actual y los cambios propuestos (§2.2) |
| **`CLAUDE.md`** (nuevo) | Reglas invariables (§4.4) y este mapa | Se crea en F0-01 | Lo lee Claude Code en cada sesión |
| `.claude/skills/` · `.agent/skills/` | Skills existentes (frontend-design, design-md, react-components, shadcn-ui, stitch-loop, remotion, enhance-prompt) | Existentes | F0-01 decide cuáles se conservan junto a las de Gentle-AI |

Regla práctica: cuando un documento tenga versión (`_R08.1`, `_v1.8`), la spec cita la versión exacta; cuando el documento cambie de versión, la tanda que lo use la actualiza en su `proposal.md`. Así una spec nunca apunta a un catálogo que ya no es el vigente sin que se note.

---

## 5. Catálogo consolidado de tandas de la Fase 0 y la Fase 1

| ID | Nombre | Capacidad | Fuente | Gate | Tamaño | Semana |
|---|---|---|---|---|---|---|
| F0-00 | Auditoría del as-built (seis frentes, veredicto conservar/refactorizar/rehacer, baseline a Engram) | todas las as-built | Anexo H, `debt.md`, `docs/superpowers` | — | M | S37 |
| F0-01 | Init SDD, config, CLAUDE.md y export .md del documento maestro | — | §4.4, §4.7 | — | S | S37 |
| F0-02 | Specs as-built destiladas de F0-00 y de `docs/superpowers/specs` | todas las as-built | M1.3, M1.9, Anexo G | F0-00 | L | S38 |
| F0-03 | Proyecto Engram y carga de decisiones | — | §1.8, decisiones del 03/09 | — | S | S37 |
| F0-04 | Pruebas del motor, staging, CI | transitions-st | M11.5 | — | M | S38 |
| F0-05 | Mecanismo de reconciliación y bandeja de entrada (cabecera R-1, `npm run reconcile`, bandeja `ENTRADA.md`) | citas-verificables | Brecha 17/09 · E-001 · `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md` | — (`tanda-por-contenido`, 17/09) | S | S38 |
| F1A-01 | C1 guarda del checkbox | transitions-st | P33 | — | XS | S38 |
| F1A-02 | C11 SLA Notificado + escalado | transitions-st, derivacion-avisos | P40 | — | S | S38 |
| F1A-03 | C12 salidas de Verificación | transitions-equipo-nuevo | P38 | — | S | S38 |
| F1A-04 | C9 bodegajes contra Ingreso a Servicio + campo | trazas, kpis | P41 | — | S | S38 |
| F1A-05 | audit-F1A | — | M11.6 | — | S | S38 |
| F1A-06 | Generador del mapa del blueprint | transitions-st | Anexo F (R08.2), Decisiones 10/09 §9, entrada 4 | — (`mapa-blueprint-generado`, 10/09) | Por dimensionar (exploración corta; si da más que S se revisa la decisión) | S38 |
| F1A-07 | IV-2 · Fechas derivadas impuestas por el servidor | trazas | M1.10 (R08.2), Decisiones 10/09 §4 | — (`iv2-fechas-derivadas`, 10/09) | S (a confirmar) | S38 |
| F1A-08 | IV-4 · Tercera puerta de la asociación OV ↔ ticket | remisiones, tickets-core | Decisiones 10/09 §2, M4.4 (R08.2) | — (la desbloquea `n52-cardinalidad-ov`) | S | S38 |
| F1A-09 | Barrido de citas tras la R08.2 | — | R08.2 §1.2 | — | S | S38 |
| F1B-01 | Serial único + autocompletado | tickets-core, zoho-sync | ítems 1, 19 | — | M | S39 |
| F1B-02 | Hoja de vida y cuatro campos + enlace Drive | hojas-vida | ítem 9, P8 | p8-p54 | M | S39 |
| F1B-03 | Tipo de servicio y ticket sin OV (+ guarda de remisión vigente y OVI de garantía) | tickets-core, transitions-st | ítems 2, 20; P21 (cerrado), P37; M1.2 (R08.2); Decisiones 10/09 §7 | p21 cerrado 10/09 · pendiente `ovi-garantia-autor` | L | S40 |
| F1B-04 | Recepción unificada y fin del texto libre | remisiones, tickets-core | ítems 4, 10; decisiones del 03/09 | — | L | S40 |
| F1B-05 | Roles, traspaso, checkbox comercial, trazas | permissions, trazas | ítems 5, 6, 7 | — | M | S41 |
| F1B-06 | Blueprints equipo nuevo y soporte remoto | transitions-equipo-nuevo, transitions-soporte-remoto | M1.4, M1.5 | flujos comerciales | L | S42 |
| F1B-07 | Prioridad automática y Mis tickets | tickets-core | ítem 8 | top5 | S | S43 |
| F1B-08 | Paridad de vistas y política Zoho (+ tablero: «Todos», IV-1 y `Remisión creada` como espera) | tickets-core, zoho-sync | ítems 17, 22, P44; Decisiones 10/09 §3 y §7.1–7.2 | p44 · `escalado-remision-creada` | L | S44 · **PARCIAL** (tablero cerrado el 10/09; pendientes la alarma de 72 h y la paridad Zoho) |
| F1B-10 | Orden único de precedencia entre guardas | transitions-st, tickets-core | transitions-st §3.8 (a) y (b), tickets-core §4.1; entrada 5.a de F0-01 | — (ninguno técnico; el orden se declara en la spec) | M | Por asignar |
| F1B-11 | Asociación OV ↔ ticket (1 : N) y subOV de lote | tickets-core, zoho-sync | M4.4 (R08.2), P52 (cerrado), Decisiones 10/09 §2, §7.5 y §8 | `vigencia-contrato` (no bloquea el núcleo) · `titularidad-ov-equipo` (IV-8) | L | S41 (propuesta) |
| F1B-09 | audit-F1B | — | M11.6 | — | S | S44 |
| F1C-01…08 | C2, C4, C3, C5, C10, C7+C9, C6, rutas abreviadas | transitions-st, permissions, kpis | §3.2.1 | uno por tanda (§4.5) | S–M | S40–S48 |
| F1D-01 | Modelo de datos del catálogo | diagnostico-checklist | M2.2, decisiones del 03/09 | — | M | S42 |
| F1D-02 | Importador desde Excel | diagnostico-checklist | M2.1 | — | M | S43 |
| F1D-03 | Macro-fases como transiciones | transitions-st, diagnostico-checklist | M2.1, P59 | p45 | M | S44 |
| F1D-04 | Captura por visita y validación por macro | diagnostico-checklist | M2.3, decisiones del 03/09 | — | L | S45 |
| F1D-05 | Encadenamiento No OK | diagnostico-checklist | Excel v9 | — | M | S46 |
| F1D-06 | Criterio de falla y repuestos por etapa | diagnostico-checklist, inventario-lectura | M2.2, ítem 12 | — | M | S46 |
| F1D-07 | Formulario de falla nueva | diagnostico-checklist | decisiones del 03/09 tema 5 | falla-nueva | S | S47 |
| F1D-08 | Segundo equipo (Horiba) | diagnostico-checklist | decisiones del 03/09 | catálogo Horiba | S | S47 |
| F1D-09 | audit-F1D | — | M11.6 | — | S | S47 |
| F1E-01 | Modelo del informe | informes | decisiones del 03/09 tema 6 | p14 | M | S46 |
| F1E-02 | Informe de diagnóstico | informes | M2.5 | — | M | S47 |
| F1E-03 | Informe de salida con motivos tipificados | informes | M2.5 (27/08) | c2 recomendado | M | S48 |
| F1E-04 | Validación por dos personas y firma | informes, permissions | P10 | roles | M | S49 |
| F1E-05 | Flujo del informe en el documento maestro | — | entregable 3 | — | doc | S50 |
| F1F-01 | Migración de tickets abiertos y fecha de corte | zoho-sync, tickets-core | — | fecha-corte | M | S50 |
| F1F-02 | Respaldo y continuidad | — | M12.8 propuesto | p55 | M | S51 |
| F1F-03 | Aceptación con servicios reales | — | — | — | — | S51–S52 |
| F1F-04 | Formación, Zoho a solo lectura, audit-F1 | — | — | — | — | S53 |

Tamaños: XS < medio día · S un día · M dos o tres días · L cuatro o cinco días (una L se parte en dos cambios si al proponerla no cabe en tres días).

**Cómo se cuentan las 52 tandas, porque la tabla NO tiene 52 filas.** Son **45 filas** y **52 tandas**: la fila `F1C-01…08` colapsa **ocho** tandas en una sola, que es como está escrita desde la R01. El reparto es F0 **6** · F1A **9** · F1B **11** · F1C **8** · F1D **9** · F1E **5** · F1F **4**. Contar filas da 45 y contar tandas da 52; el denominador de avance es el segundo. La hoja «Tandas» del libro R01.3 lleva las 52 en filas separadas (`R2`–`R53`), más 18 de F2–F5 hasta 70. **El denominador se movió el 17/09/2026: de 51 a 52 tandas,** por la fila nueva `F0-05`. Se registra aquí y no en un anexo, como pide la regla (a) de `unidad_de_avance`: «51 tandas al corte de S37–S38, 52 al corte de S38». El movimiento es **por alcance nuevo, no por trabajo**, y la fila entró primero en la hoja «Tandas» del libro R01.3 (como `R53`) y después aquí, que es el orden que esta misma sección declara.

---

## 6. Riesgos y supuestos

| Riesgo | Efecto | Mitigación en el plan |
|---|---|---|
| Las decisiones de negocio se retrasan más de dos viernes | Las tandas 1C se acumulan y C2 contamina el informe de salida | 1C fuera de la ruta crítica; C2 con prioridad explícita para el 11/09 o el 18/09 |
| El catálogo depurado por Servicio Técnico llega tarde | F1D-02 importa una versión que luego cambia | El importador es reentrante: se reimporta con versionado del catálogo; el motor se prueba con la v9 |
| P45 no cierra (macro-fases comunes) | F1D-03 no puede declarar las transiciones | Se declaran las cuatro del 21/08 como configuración por defecto, parametrizables; cambiarlas después es dato, no código |
| Capacidad del equipo técnico para revisar (cuello de botella declarado el 03/09) | Specs sin validar por quien conoce el proceso | Las specs se escriben en Dado/Cuando/Entonces con vocabulario del taller; el viernes se revisan **demos**, no documentos |
| Gentle-AI/OpenSpec sin validación formal del config | Reglas que un sub-agente puede ignorar | Las reglas críticas viven también en `CLAUDE.md` y en pruebas automáticas (F0-04) |
| Engram local, no compartido | Decisiones que sólo ve una máquina | Anexo C como registro oficial; evaluar Git Sync de Engram en F0-03 |
| Margen de diciembre coincide con vacaciones | F1F sin holgura real | F1B-06 recortable a un flujo; F1D-08 (Horiba) diferible a enero sin afectar la paridad |

**Supuestos:** un desarrollador (Gerencia con Claude Code) a dedicación parcial alta; el equipo técnico dedica el viernes; la VPS de Hostinger sostiene staging y producción; el repositorio actual compila y tiene, o admite, un framework de pruebas.

---

## Anexo A — Plantilla de `proposal.md`

```
# <ID> · <nombre>

## Intención
Qué problema resuelve, en una frase que Servicio Técnico reconozca.

## Fuente
Apartados del documento maestro (Mx.y, Cn, Pnn), registros de decisiones y datos de referencia.

## Alcance
Lo que esta tanda entrega. Verbos concretos.

## Fuera de alcance
Lo que se parece y no entra, con la tanda a la que pertenece.

## Gates
Decisiones necesarias, con su clave Engram y estado (cerrada / pendiente / no aplica).

## Reglas invariables afectadas
Números de §4.4 que la tanda toca o debe respetar de forma explícita.

## Riesgos
Datos existentes que se migran, transiciones que cambian de nombre, KPIs que se recalculan.

## Cómo se demuestra
La secuencia de clics en staging que valida la tanda el viernes.
```

## Anexo B — Ejemplo de delta de spec (F1B-01, autocompletado por serial)

```
## ADDED Requirements

### Requisito: Serial como identificador primario
El ticket se identifica por el número de serie del equipo, asociado a cliente,
modelo y fecha. Fuente: §1.8 (14/08/2026), ítem 1.

#### Escenario: remisión sin serial
- DADO el formulario de remisión de entrada
- CUANDO se intenta guardar sin número de serie
- ENTONCES el sistema rechaza el guardado e indica el campo

#### Escenario: serial conocido
- DADO un serial que existe en hojas-vida
- CUANDO el usuario lo introduce en la remisión
- ENTONCES cliente, modelo y órdenes de venta activas se rellenan solos
- Y el usuario puede corregir cliente y modelo, y la corrección queda trazada

#### Escenario: serial desconocido
- DADO un serial que no existe en hojas-vida
- CUANDO el usuario lo introduce
- ENTONCES el sistema ofrece dar de alta la hoja de vida (F1B-02) sin abandonar la remisión
- Y no crea el ticket hasta que la hoja de vida exista

### Requisito: código interno del cliente como identificador secundario
Fuente: §1.8 (27/08/2026).
#### Escenario: búsqueda por código interno
- DADO un código interno registrado en la hoja de vida
- CUANDO se busca por él en recepción
- ENTONCES se obtiene el mismo equipo que por serial
```

## Anexo C — Ejemplo de `tasks.md` (F1A-01, C1)

```
1. [ ] Prueba: transición con checkbox obligatorio sin marcar → el motor lanza error y no cambia el estado
2. [ ] Prueba: transición con checkbox obligatorio marcado → transiciona
3. [ ] buildTransitionPlan: comprobar obligatoriedad antes de la rama del checkbox
4. [ ] Verificar sobre «Liberación del ticket sin facturar» en staging
5. [ ] Actualizar debt.md (M-2 cerrada) y la spec transitions-st (comportamiento corregido)
6. [ ] mem_save decision/c1-checkbox-obligatorio con fecha de cierre
```

---

*Relación con otros documentos: este plan no modifica el documento maestro; propone resolver P60 (criterio del MVP) y P62 (capa as-built → specs en el repositorio) y deja abiertos los gates de §4.5, que decide Gerencia. Vive en `docs/sdd/` del repositorio. La R02 incorporará las decisiones registradas.*
