# Reconciliación

**Commit medido:** `0e4049f` · **Fecha del commit:** 2026-09-20
**Árbol de trabajo:** CON CAMBIOS SIN COMMITEAR

La fecha es la del commit medido, no la del reloj: dos pasadas sobre un árbol quieto producen
este fichero IDÉNTICO, y su `git diff` es la lista de desvíos nuevos desde la pasada anterior.

---

## 1 · Capacidades declaradas frente a specs en disco

  18 declaradas
  9 ficheros
  0 huérfanas

## 2 · Numerador del avance — dos cifras, nunca una suma

  6 derivables de cabecera ...................... F0-01, F0-02, F0-03, F0-05, F1A-08, F1B-10
  0 declarados por commit ....................... —
  denominador 52 tandas del apartado 5 del plan
  3 marcadas sin verificar

Hallazgos (informativos, no bloquean):
  - `F0-02` — sin verificar: su `maestro:` no cita ninguna fuente de su fila del apartado 5 (M1.3, M1.9, Anexo G)
  - `F0-05` — sin verificar: su `maestro:` no cita ninguna fuente de su fila del apartado 5 (Brecha 17/09 · E-001 · `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md`)
  - `F1B-10` — sin verificar: su `maestro:` no cita ninguna fuente de su fila del apartado 5 (transitions-st §3.8 (a) y (b), tickets-core §4.1; entrada 5.a de F0-01)
  - `cierres_declarados_por_commit` — sin declarar en config.yaml: el barrido no lo inventa

## 3 · Cambios fuera del plan, con su motivo

  5 fuera del plan
  0 sin motivo

## 4 · Incumplimientos vivos, gates y claves de decisión

  12 entradas
  5 vivos
  7 cerrados
  0 defectos de registro

Hallazgos (informativos, no bloquean):
  - `IV-2` — incumplimiento vivo, declarado por el campo `estado`: VIVO
  - `IV-8` — incumplimiento vivo, declarado por el campo `estado`: VIVO
  - `IV-9` — incumplimiento vivo, declarado por el campo `estado`: VIVO
  - `IV-11` — incumplimiento vivo, declarado por el campo `estado`: VIVO
  - `IV-12` — incumplimiento vivo, declarado por el campo `estado`: VIVO

## 5 · Cifras ancladas — leídas del código, no del registro

  esperas ....................................... código 11 · maestro 4
  pasos_del_mapa ................................ maestro 38 · sin lectura de código
  transiciones .................................. maestro 34 · sin lectura de código
  estados ....................................... maestro 21 · sin lectura de código

## 6 · Ficheros de docs/sdd sin trackear

  1 sin trackear

Hallazgos (informativos, no bloquean):
  - `docs/sdd/RECONCILIACION.md` — en disco y fuera del índice

---

Ninguna comprobación bloqueante trae hallazgos: el comando sale con código 0.

Este barrido NO arregla ningún desvío: los hace visibles. Corregirlos es trabajo aparte,
y de quien decida el alcance.
