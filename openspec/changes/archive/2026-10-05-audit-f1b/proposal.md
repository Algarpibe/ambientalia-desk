---
tanda: F1B-09
motivo: ""
capacidad: []
maestro: ["M11.6"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — Auditoría de blueprint de la épica 1B (`audit-F1B`)

**Qué.** La lectura del código del flujo que pide M11.6
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3521`), extendida por
primera vez a los tres flujos: servicio técnico, equipo nuevo y soporte remoto. Fila
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:89`. El resultado es
`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md`, sobre el commit `0d1a40b`.

**Qué audita.** Los tres catálogos de forma mecánica (estados sin salida, inalcanzables, ciclos,
anulación, guardas que el servidor no impone, registro contra catálogos, áreas sin decidir); el estado
de los cuatro hallazgos de la R04 y de los cinco de F1A-05; y lo que construyó la épica 1B: estado por
tanda, lo construido y no cableado, el orden de precedencia de las guardas, los cuatro incumplimientos
vivos y la coherencia de los lectores comunes con los tres flujos.

**Es de lectura.** No corrige código de producción, pruebas de dominio ni specs, y **no toca
`openspec/specs/`**. Supuesto aplicado por el orquestador, reversible: al ser documental, el cambio no
lleva deltas, diseño ni tareas, y el ciclo se reduce a propuesta, documento e informe de archivo. Cada
hallazgo accionable va a `docs/sdd/ENTRADA.md` con dueño propuesto: E-222 a E-230.

**Lo único que cambia fuera de la documentación.** La prueba que cuenta las tandas «en curso» leyendo
las cabeceras reales (`apps/desk/server/reconciliacion/registro.test.ts:218-220`): con esta propuesta
pasan de diez a once y entra F1B-09. Se edita en sitio, sin añadir líneas.

**Por qué `cierra: no`.** Respuesta textual de Gerencia en `decision/orden-tres-tandas-04-10`
(`openspec/config.yaml:3792-3800`): «Las tres siguientes, en este orden: F1F-01, F1B-05 sin visibilidad
y F1B-09 con cierra: no. No fusiones ninguna de las tres hasta que el analista la verifique.» La
consecuencia registrada lo explica: la épica 1B sigue abierta y la auditoría se repasa al cerrarla.

**Por qué `toca_maestro: si`.** El pasaje de M11.6 dice que F1B-09 está «sin empezar»; con esta tanda
deja de ser cierto. La corrección se entrega como texto para el expediente (E-230); el `.docx` no se
edita desde el repositorio.

**Límites declarados (§8 del documento).** El árbol auditado incluye F1F-01 y F1B-05, sin fusionar a
`main`; no se ejecutó nada contra la aplicación desplegada ni se revisó el cliente `.tsx` con pruebas.

**Resultado, en una línea.** Los tres grafos están sanos como grafos; tres de los cuatro hallazgos de
la R04 siguen abiertos y son de la épica 1C; los cuatro incumplimientos vivos siguen vivos; y hay nueve
hallazgos nuevos, ninguno de severidad alta, tres de ellos de lectores que asumen el flujo de servicio.

## Fuera del recuento — tareas de personas

Archivar este cambio **no las da por hechas**: su dueño está fuera del repositorio.

| Tarea | Dueño | Destino | Dónde queda escrita |
|---|---|---|---|
| Verificar la tanda antes de fusionarla a `main` | El analista | Condición de fusión | `decision/orden-tres-tandas-04-10` |
| Decidir el destino de E-222, E-227 y E-228, que quedan sin destino asignado | Gerencia | Fila del §5 o punto abierto | `docs/sdd/ENTRADA.md` |
| Responder E-223 (alcance de la anulación) y E-226 (clase de espera y áreas) | Gerencia y Servicio Técnico | `decisiones_de_gerencia` | `docs/sdd/ENTRADA.md` |
| Llevar la corrección de M11.6 al maestro | Gerencia | Expediente del maestro | E-230 |
| Repasar la auditoría sobre `main` al cerrar la épica 1B | La sesión que cierre la épica | Cierre de F1B-09 | §8 del documento |
