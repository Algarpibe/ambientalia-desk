# Reconciliación

**Commit medido:** `fed9532` · **Fecha del commit:** 2026-10-04
**Árbol de trabajo:** limpio

La fecha es la del commit medido, no la del reloj: dos pasadas sobre un árbol quieto producen
este fichero IDÉNTICO, y su `git diff` es la lista de desvíos nuevos desde la pasada anterior.

---

## 1 · Capacidades declaradas frente a specs en disco

  21 declaradas
  17 ficheros
  0 huérfanas

## 2 · Numerador del avance (§C de la R01.4) — cifras separadas, nunca una suma

  14 cerradas por archivo ....................... F0-05, F1A-03, F1A-06, F1A-07, F1A-08, F1B-02, F1B-06, F1B-10, F1B-12, F1B-14, F1B-15, F1C-09, F1C-10, F1C-11
  9 cerradas por commit declarado ............... F0-00, F0-01, F0-02, F0-03, F1A-01, F1A-02, F1A-04, F1A-05, F1B-01
  8 en curso, aparte y sin sumar ................ F0-04, F1B-03, F1B-04, F1B-07, F1B-08, F1B-11, F1C-05, F1F-05
  denominador ................................... 78 tandas del §C de la R01.4
  6 cerradas sin fuente declarada en la R01.1 ... F1B-12, F1B-14, F1B-15, F1C-09, F1C-10, F1C-11
  5 marcadas sin verificar

Hallazgos (informativos, no bloquean):
  - `F0-02` — sin verificar: su `maestro:` no cita ninguna fuente de su fila de la R01.1 (M1.3, M1.9, Anexo G)
  - `F0-05` — sin verificar: su `maestro:` no cita ninguna fuente de su fila de la R01.1 (Brecha 17/09 · E-001 · `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md`)
  - `F1A-03` — sin verificar: su `maestro:` no cita ninguna fuente de su fila de la R01.1 (P38)
  - `F1A-06` — sin verificar: su `maestro:` no cita ninguna fuente de su fila de la R01.1 (Anexo F (R08.2), Decisiones 10/09 §9, entrada 4)
  - `F1B-10` — sin verificar: su `maestro:` no cita ninguna fuente de su fila de la R01.1 (transitions-st §3.8 (a) y (b), tickets-core §4.1; entrada 5.a de F0-01)

## 3 · Cambios fuera del plan, con su motivo

  7 fuera del plan
  0 sin motivo

## 4 · Incumplimientos vivos, gates y claves de decisión

  12 entradas
  4 vivos
  8 cerrados
  0 defectos de registro

Hallazgos (informativos, no bloquean):
  - `IV-8` — incumplimiento vivo, declarado por el campo `estado`: VIVO
  - `IV-9` — incumplimiento vivo, declarado por el campo `estado`: VIVO
  - `IV-11` — incumplimiento vivo, declarado por el campo `estado`: REDUCIDO  # detalle en adendas_incumplimientos_vivos → IV-11 → reduccion_2026_09_27, al final de este fichero; y en `adenda_iv11_asociacion_ov_ticket` (2026-09-28, última clave del fichero)
  - `IV-12` — incumplimiento vivo, declarado por el campo `estado`: VIVO

## 5 · Cifras ancladas — leídas del código, no del registro

  esperas ....................................... código 11 · maestro 4
  pasos_del_mapa ................................ maestro 35 · sin lectura de código
  transiciones .................................. maestro 31 · sin lectura de código
  estados ....................................... maestro 20 · sin lectura de código

## 6 · Ficheros de docs/sdd sin trackear

  0 sin trackear

---

Ninguna comprobación bloqueante trae hallazgos: el comando sale con código 0.

Este barrido NO arregla ningún desvío: los hace visibles. Corregirlos es trabajo aparte,
y de quien decida el alcance.
