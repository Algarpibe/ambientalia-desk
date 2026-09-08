# Prompt de arranque — F0-00 · Auditoría del as-built con Gentle-AI

**Uso:** abrir Claude Code CLI en la raíz de `C:\dev\Desk_2_R1.023` con Gentle-AI y Engram activos, y pegar el bloque de abajo íntegro como primer mensaje. Es la sesión cero del plan R01.1 (`docs/sdd/`): no escribe código, produce el punto de partida.

**Antes de pegarlo, comprobar:** que `gentle-ai` está instalado para Claude Code (`gentle-ai install` → Claude Code) y que `engram` responde (`engram doctor` o `mem_doctor`). Si el documento maestro sólo existe como `.docx`, tener `pandoc` disponible o convertirlo a mano antes (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md`).

**Duración esperada:** una sesión larga o dos. Si se corta, cerrar con `mem_session_summary` y retomar con «Continúa la tanda F0-00 desde donde quedó; recupera contexto con mem_context».

---

```
Tanda: F0-00-auditoria-as-built
Fase: F0 · Cimientos SDD (plan R01.1, docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md)
Tipo: exploración y auditoría. En esta tanda NO se escribe ni se modifica código,
ni se crea openspec/ todavía. Se produce conocimiento, no cambios.

Trabaja con SDD (fase explore) y con Engram. Español en todo lo que produzcas;
nombres técnicos y rutas tal como están en el repo.

== 0. Orientación (antes de leer nada del código) ==
1. mem_current_project. Si el proyecto Engram no existe, créalo como "desk-2-0".
2. mem_context y mem_search "baseline" / "decision". Si vuelven vacíos es normal:
   esta es la primera sesión con memoria.
3. mem_session_start con objetivo: "F0-00 auditoría del as-built".

== 1. Qué es este proyecto (léelo en este orden, no lo deduzcas del código) ==
a) docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md — el plan completo.
   Lee entero §0, §1, §2 (sobre todo §2.3 capacidades y §2.4 punto de partida),
   la Fase 0 de §3, y §4.4 (reglas invariables) y §4.7 (mapa documental).
b) docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md
   (si sólo existe el .docx, dímelo antes de seguir; no intentes leer el .docx
   a ciegas). Lee §1.8 (decisiones), M1.3 (as-built del flujo), M11
   (arquitectura), Anexo G (diccionario de campos) y Anexo H (as-built vs plan).
c) docs/blueprint-servicio-tecnico.md, docs/modelo-autorizacion.md,
   docs/migracion-zoho-roadmap.md.
d) README.md, DEPLOY.md, package.json (workspaces y scripts), vitest.config.ts.
e) debt.md — sólo las cabeceras y la sección "ESTADO ACTUAL"; el detalle lo
   usarás en el frente (f).

Después de esto, antes de explorar código, escribe en Engram una observación
tipo "context" con topic_key "baseline/mapa-del-proyecto": qué es Desk 2.0,
el monorepo (apps/desk, apps/hub-sync, packages/shared, packages/zoho-sync),
para qué sirve cada carpeta de docs/ según §4.7, y la regla de que
docs/superpowers/ es histórico congelado.

== 2. Exploración por frentes (sdd-explore, un sub-agente por frente) ==
Cada frente devuelve: inventario, hallazgos con ruta:línea, contraste con lo que
el documento maestro dice, y un veredicto CONSERVAR / REFACTORIZAR / REHACER con
justificación de una o dos frases. Sin proponer soluciones todavía.

(a) Motor de flujo — packages/shared/src/transitions.ts,
    packages/shared/src/permissions.ts, apps/desk/server/transitionExec.ts,
    apps/desk/server/db/estadoPorRemision.ts,
    apps/desk/server/services/ticketService.ts, services/avisoArea.ts.
    Confirmar: 34 transiciones con botón, 21 estados, 2 pasos sin botón,
    Finalizado único terminal, 4 esperas sin salida, y los seis hallazgos de la
    R04 (M1.3.4, M1.3.5, M1.10, M11.7 M-2). Confirmar que ninguna regla de flujo
    vive fuera de esos ficheros (buscar en apps/desk/src).
(b) Esquema de datos — migraciones y modelos en apps/desk/server/db y
    packages/zoho-sync. Contrastar tablas y columnas con el Anexo G (59 columnas
    de tickets) y con los diseños docs/superpowers/specs/2026-06-04-subsistema-a-*,
    -b-*, -e-*, 2026-06-05-subsistema-f-*, 2026-08-06-catalogo-maestro-equipos-*.
    Señalar columnas del Anexo G que no existen y columnas que existen sin estar
    en el Anexo G. Localizar quién escribe remisiones_entrada (punto abierto P14).
(c) Sincronización Zoho — packages/zoho-sync y apps/hub-sync. Qué entidades se
    leen (tickets, OV, contactos, artículos), cadencia, dónde está la regla de
    no cruzar las dos entradas (managed_by_app), si existe alguna escritura
    hacia Zoho (debe ser cero: regla 6 de §4.4).
(d) Interfaz — apps/desk/src. Listar pantallas/rutas, y para cada una decir si
    replica una vista de Zoho Desk (listado, ficha de ticket, transiciones,
    hoja de vida) o es prototipo. Identificar qué skills de .claude/skills y
    .agent/skills se usaron para construirla.
(e) Pruebas, build y calidad — ejecutar `npm run typecheck`, `npm run lint` y
    `npm test`. Reportar resultado exacto. Mapear los 96 ficheros de prueba a
    las capacidades de §2.3 y decir qué capacidad no tiene ninguna prueba
    (esperable: motor de transiciones extremo a extremo y permisos).
(f) Deuda — debt.md completo. Reclasificar cada punto en: CIERRA-EN-F1A,
    CIERRA-EN-F1C (con la Cx que corresponda), SE-ARRASTRA, OBSOLETO,
    NO-APLICA-AL-MVP. Detectar puntos de debt.md que el documento maestro no
    conoce y viceversa.
(g) Histórico de diseño — docs/superpowers/specs y plans. Sólo un índice: para
    cada diseño, una línea con fecha, tema y a qué capacidad de §2.3 mapea.
    Marcar los que describen algo que ya no coincide con el código.

Restricciones durante la exploración: no modificar ningún fichero; no ejecutar
nada que escriba en base de datos ni contra Zoho; si un comando de (e) requiere
variables de entorno o base de datos que no están, anótalo como hallazgo y
sigue.

== 3. Entregables de la tanda ==
1. docs/sdd/F0-00_Baseline_as-built.md con: resumen ejecutivo (media página),
   tabla de veredictos por frente, hallazgos por frente con ruta:línea,
   desvíos respecto al Anexo H del documento maestro (para llevar al Anexo D),
   la reclasificación de debt.md, el índice de docs/superpowers, y una sección
   final "Lo que cambia en el plan" con cualquier tanda de F0/F1 que a la luz
   de la auditoría deba partirse, adelantarse o replantearse.
2. Engram: una observación por frente con topic_key "baseline/<frente>"
   (baseline/motor-flujo, baseline/esquema-datos, baseline/zoho-sync,
   baseline/ui, baseline/pruebas, baseline/deuda, baseline/superpowers), y una
   observación "decision" por cada decisión cerrada de §1.8 del documento
   maestro que hayas verificado en código, con topic_key "decision/<clave>".
3. Al final, en el chat: la lista de preguntas que sólo yo puedo responder
   (máximo diez), y una propuesta de proposal.md para F0-01 (sdd-init,
   openspec/config.yaml, CLAUDE.md) que incorpore lo aprendido. No la ejecutes:
   la apruebo en la siguiente sesión.

== 4. Cierre ==
mem_session_summary con: objetivo, qué frentes quedaron cerrados, veredictos,
hallazgos que cambian el plan, y siguiente paso (F0-01). Si la sesión se corta
antes, guarda el summary parcial igualmente indicando qué frente quedó a medias.

Empieza por el paso 0 y confírmame en dos líneas qué encontraste en Engram
antes de pasar al paso 1.
```
