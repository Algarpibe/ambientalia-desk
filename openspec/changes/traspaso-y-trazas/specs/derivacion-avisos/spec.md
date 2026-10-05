# Delta para `derivacion-avisos`

## ADDED Requirements

### RQ-AV-18 · El destino de un traspaso y el del aviso salen de la misma derivación

El área que el historial enseña como destino de un traspaso sin persona derivada (`trazas`, RQ-TZ-18) **SHALL** salir de
`areasSiguientes` sobre el estado de llegada (`packages/shared/src/transitions.ts:327-334`), la misma función base que
usa `areasAAvisar` (`apps/desk/server/services/avisoArea.ts:15-17`), y **MUST NOT** salir de una segunda tabla de áreas
(regla invariable 13).

- **SHALL** calcularse sobre el catálogo del flujo aplicable del ticket, como el aviso (RQ-AV-04, tercera viñeta).
- Al leer, la línea **MUST NOT** restar las áreas de quien actuó: el historial guarda el nombre del actor, no sus áreas,
  y la línea cuenta a quién le toca, no a quién se avisa (hipótesis; ver riesgos de la fase).
- Componer la línea **MUST NOT** crear avisos ni cambiar a quién se avisa: RQ-AV-05 y RQ-AV-06 no cambian.
- Con persona derivada, el destino es la persona (RQ-TZ-18) y el aviso a la persona derivada sigue como hoy.

#### Scenario: El destino por área coincide con la base del aviso
- GIVEN una transición de Servicio Técnico que deja el ticket en un estado cuyas áreas siguientes son Comercial y Compras
- WHEN se compone la línea de traspaso sin persona derivada
- THEN el destino enseña esas mismas áreas que `areasSiguientes` devuelve para ese estado

#### Scenario: Un ticket `Equipo nuevo` usa su propio catálogo
- GIVEN un ticket de la clasificación `Equipo nuevo` y una transición de su catálogo
- WHEN se compone la línea de traspaso por área
- THEN el área sale del catálogo de `Equipo nuevo`, no de `TRANSITIONS`

#### Scenario: Una área nueva en el catálogo llega sola a la línea
- GIVEN una transición añadida al catálogo cuya área de salida cambia `areasSiguientes` de un estado
- WHEN se compone la línea para ese estado
- THEN el destino refleja el cambio sin tocar el compositor del historial

#### Scenario: Componer la línea no crea avisos
- GIVEN una transición ya ejecutada con sus avisos escritos
- WHEN se abre el historial
- THEN no se inserta ningún aviso ni cambia ninguno existente
