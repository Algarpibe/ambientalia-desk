# Delta for vistas-tablero

Cambio `alarmas-horas-habiles` (F1B-08, `cierra: no`). Base `4796aad`. Numeración: el último ID vivo es `RQ-VT-06`.

## ADDED Requirements

### Requirement: RQ-VT-07 · «Esperando aprobación del cliente»: marca de vista calculada por el servidor

El listado de tickets que sirve el servidor **SHALL** traer un campo booleano (nombre y forma los fija el
diseño) que sea **verdadero** cuando el ticket está **hoy** en `Notificación cliente` y existe la marca de
alarma (`derivacion-avisos` RQ-AV-16) de `Notificación cliente` para su **entrada actual**
(supuesto S-12); en cualquier otro caso **SHALL** ser falso.

- Es una **marca de vista, no un estado**: el ticket **MUST NOT** cambiar de estado ni escribir en
  `ticket_transitions` por esta marca (`decision/anexo-3-alerta`, `openspec/config.yaml:2329`, consecuencia 4).
- Al **salir** del estado, el campo **SHALL** volver a falso; al **reentrar**, **SHALL** ser falso hasta que
  la nueva entrada venza y se marque.
- La marca se escribe al vencer aunque no haya nadie con el cargo (`derivacion-avisos` RQ-AV-15, S-4 revisado):
  la señal del tablero **MUST NOT** depender de que exista el destinatario.
- **Regla invariable 13:** el servidor **SHALL** decidir la marca; el cliente **MUST NOT** recalcular el
  vencimiento ni el calendario.
- Un estado distinto de `Notificación cliente` **MUST NOT** producir la marca aunque su alarma esté vencida
  (`Notificado`, `Remisión creada`).

#### Scenario: vencido en `Notificación cliente` con marca, el listado lo señala
- GIVEN un ticket en `Notificación cliente` con más de 36 h hábiles y la marca de su entrada actual
- WHEN se pide el listado de tickets
- THEN el ticket trae el campo en verdadero

#### Scenario: en `Notificación cliente` sin vencer, no
- GIVEN un ticket en `Notificación cliente` con 36 h hábiles exactas y sin marca
- WHEN se pide el listado
- THEN el campo es falso

#### Scenario: al salir del estado deja de traerla
- GIVEN el ticket anterior con marca, que ejecuta una transición y sale de `Notificación cliente`
- WHEN se pide el listado
- THEN el campo es falso, aunque la fila de marca siga existiendo

#### Scenario: al reentrar no hereda la marca de la entrada anterior
- GIVEN el mismo ticket, que vuelve a `Notificación cliente` y aún no vence
- WHEN se pide el listado
- THEN el campo es falso, porque la marca es de la entrada anterior

#### Scenario: otro estado vencido no produce la marca
- GIVEN un ticket vencido y marcado en `Notificado`
- WHEN se pide el listado
- THEN el campo es falso

#### Scenario: el cliente no decide
- GIVEN el listado con el campo en verdadero para un ticket
- WHEN el cliente lo consume
- THEN sólo lo pinta; no lee el calendario ni compara horas (verificación por lectura del `.tsx`)

### Requirement: RQ-VT-08 · La marca del tablero se pinta, y se verifica a mano (`.tsx` fuera de la red)

`TicketCard.tsx` **SHALL** pintar la marca de `RQ-VT-07` de forma visible y con texto en español
(«esperando aprobación del cliente»). Como el fichero es `.tsx`, queda **fuera de la red de pruebas** por
decisión de Gerencia (F0-00, `vitest.config.ts:16-20`): la prueba automatizada vive en el servidor
(`RQ-VT-07`), y este requisito **no admite escenario automatizado**. **No** se propone `jsdom` ni
`@testing-library`.

#### Scenario: manual — verificación por una persona
- GIVEN el tablero en `ambientalia-desk.ambientalia.cloud`, tras el despliegue, y un ticket vencido en `Notificación cliente`
- WHEN se inspecciona su tarjeta
- THEN muestra la marca «esperando aprobación del cliente» y un ticket no vencido no la muestra
- Verificación anotada con su resultado por una persona (tarea P.2 de la propuesta)

## Fuera de alcance de este delta

- **«Vistas equivalentes a Zoho»** (pregunta 4 de `docs/sdd/Preguntas_Gerencia_2026-09-29.md:93-111`): sigue abierta; por eso `cierra: no`.
- **Ninguna de `RQ-VT-01`..`RQ-VT-06` cambia:** la marca es un campo del ticket, no una vista funcional nueva ni un filtro.
