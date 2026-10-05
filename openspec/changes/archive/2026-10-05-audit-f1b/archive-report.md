# Informe de archivo — `audit-f1b`

**Tanda:** F1B-09 · **`cierra: no`** · **Fecha:** 2026-10-05 · **Rama:** `audit-f1b`, apilada sobre `traspaso-y-trazas` en `0d1a40b`. Sin fusionar.

**Cobertura de la fila (R-1):** F1B-09 cubre aquí la auditoría de blueprint de los tres flujos —servicio técnico, equipo nuevo y soporte remoto— sobre el árbol de esta rama, con sus hallazgos en la bandeja; deja fuera el repaso al cerrar la épica 1B, que sigue abierta, y la extensión del mapa generado a los dos flujos nuevos (E-222). Por eso no cierra la fila, como fija `decision/orden-tres-tandas-04-10`.

## Qué se entregó

- `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` — el documento de auditoría: los tres grafos, los cuatro hallazgos de la R04 y los de F1A-05 con su estado de hoy, lo construido por la épica 1B, los incumplimientos vivos, los lectores comunes, las cifras y lo que la auditoría no hizo.
- Bandeja E-222 a E-230 al final de `docs/sdd/ENTRADA.md`, nueve hallazgos nuevos, ninguno de severidad alta. Siguiente entrada libre: E-231.
- `apps/desk/server/reconciliacion/registro.test.ts` pasa de diez a once tandas «en curso»: entra F1B-09.

Es de lectura: no cambia código de producción, ni pruebas de comportamiento, ni `openspec/specs/`. Por eso el ciclo se redujo a propuesta, documento e informe de archivo, sin deltas, diseño ni tareas (supuesto del orquestador, anotado en la propuesta; el precedente F1A-05 fue un documento directo).

## Resultado, en corto

- Los tres grafos están sanos como grafos: `Finalizado` es el único estado sin salida, ninguno es inalcanzable y todos los ciclos tienen salida.
- De la R04, la guarda que no bloquea sigue cerrada; las cuatro esperas con una sola salida, el ciclo reentrante y la anulación siguen abiertos, los tres con destino en la épica 1C.
- El mapa generado existe y no está desfasado, pero cubre sólo servicio técnico (E-222).
- Los cuatro incumplimientos vivos siguen vivos. Dos fichas de `CLAUDE.md` tienen detalles caducos (E-229): la búsqueda de «mantenedor» ya no da cero, y la expresión regular del color de `ClienteDetalle.tsx` ya no está en la línea que la ficha dice. No se corrigieron aquí: `CLAUDE.md` y `openspec/config.yaml` los edita la sesión que recoja la entrada.

## Intentos y medida

| Intento | Commit | Líneas |
|---|---|---|
| Auditoría, bandeja y propuesta | `7638056` | 467 |

Medida con `git diff --shortstat --no-renames` contra `0d1a40b` más lo nuevo sin trackear; coincide con el registro. Antes del asiento el orquestador ejecutó pruebas (3.347 pasadas y 7 omitidas), typecheck, lint (165 avisos, sin margen) y detector de citas, los cuatro en 0, y contrastó contra el árbol seis afirmaciones del documento.

## Abierto, y archivar no lo cierra

- El estado por tanda sale de las cabeceras de los cambios archivados, no de releer cada informe de archivo.
- El efecto del hallazgo de indicadores (E-224) está leído en la consulta, no ejecutado.
- «Ruta sin cliente» se buscó con una heurística; «cliente sin ruta» no se buscó.
- Nada se ejecutó contra la aplicación desplegada.

## Tareas de personas — archivar no las da por hechas

Asignar destino a E-222 y E-228; decidir si la anulación alcanza a los dos flujos nuevos (E-223); responder E-090; corregir las fichas caducas de `CLAUDE.md` y registrar `decision/mapa-blueprint-generado` en `openspec/config.yaml` (E-229); actualizar M11.6 en el maestro (E-230); repasar esta auditoría al cerrar la épica 1B.
