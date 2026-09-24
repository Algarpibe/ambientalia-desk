# Delta for Reconciliación

## MODIFIED Requirements

### Requirement: RQ-RC-07 · Regla (d) de `unidad_de_avance`: el numerador se publica con el motivo de su cambio

`openspec/config.yaml` **SHALL** declarar **CINCO** reglas de lectura en
`unidad_de_avance.reglas_de_lectura` (`openspec/config.yaml:1243` en `ce93480`), con ids `a`, `b`,
`c`, `d` y `e`, en ese orden. Las tres primeras —`openspec/config.yaml:1245` en `ce93480`,
`openspec/config.yaml:1250` en `ce93480` y `openspec/config.yaml:1255` en `ce93480`— **MUST NOT**
tocarse.

La regla **(d)** **SHALL** seguir publicando el numerador con el **motivo** de su cambio, `por
trabajo` o `por dictamen`.

**Por qué (d):** el 2026-09-17 el numerador pasó de 10 a 11 **sin que nadie escribiera código** —lo
movió un dictamen—. Es correcto, pero un lector que vea la serie sin más creerá que fue un día
productivo. El denominador ya va fechado por la regla (a); el numerador necesita lo simétrico.

La regla **(e)** **SHALL** declarar: «Un cambio lleva UN SOLO `tanda:`. No existe «cuenta en
parte»». Su origen es la decisión de Gerencia `decision/e001-por-entregar` (`openspec/config.yaml` →
`decisiones_de_gerencia` → `decision/e001-por-entregar`, 2026-09-24): `cierra:` dice si la fila
TERMINA; la (e) dice que el `tanda:` es ÚNICO y excluyente, y un `cierra: no` **MUST NOT** leerse
como «contar en parte».

(Previously: RQ-RC-07 sólo exigía la **cuarta** regla (d) y que las tres primeras no se tocaran;
ahora exige **CINCO** reglas (a-e), conserva (d) íntegra con su «Por qué» y su escenario, y añade el
origen y el alcance de (e).)

#### Scenario: un cierre por dictamen se distingue de uno por trabajo

- GIVEN un corte en el que el numerador sube por una decisión y no por una tanda
- WHEN se publica
- THEN lleva el motivo `por dictamen`, y la serie no se lee como productividad

#### Scenario: un cambio que realiza contenido de dos filas lleva un único `tanda:`

- GIVEN un cambio cuyo trabajo realiza contenido de dos filas del §5 del plan
- WHEN se declara su cabecera
- THEN lleva un único `tanda:` con el ID de UNA fila, o `fuera-del-plan` con motivo escrito — nunca
  las dos filas a la vez ni «cuenta en parte»

#### Scenario: el guardián discrimina la (e) sin arrastrar la (d)

- GIVEN una copia del registro a la que se le borra sólo la regla (d)
- WHEN la comprobación lee `reglas_de_lectura`
- THEN los ids que ve son `a`, `b`, `c` y `e` — la ausencia de (d) no borra ni desordena la (e)
