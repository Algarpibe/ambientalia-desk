# Exploración — detector-citas-extremos

Fase `sdd-explore`, 2026-09-15, sobre `9de5d17`. Engram: `sdd/detector-citas-extremos/explore` (obs. 598),
medición de partida en obs. 597. Preflight leído de `openspec/config.yaml:25-30` en `9de5d17`:
interactive · hybrid · ask-on-risk · 800 · strict_tdd.

**Todas las citas a código de este documento van ancladas a `9de5d17`**, porque la tanda va a mover
líneas de `detector.ts` y `cosecha.ts`. Los ejemplos de citas rotas del repositorio se nombran en prosa,
sin forma de cita (regla de mutación 4).

## Alcance

Abierto por Gerencia el 2026-09-15 (Engram obs. 596). Los dos defectos que el cierre de IV-10 dejó vivos
(`openspec/config.yaml:855` en `9de5d17`, `hallazgos_que_siguen_vivos`):

1. `rotura()` no comprueba que el extremo FINAL caiga en línea vacía.
2. Una abreviada detrás de una cita anclada se atribuye a su fichero, pero se lee contra el sha local.

Fuera de alcance: la cita del test de `transitionExec` a `rows.ts` anotada en el triaje, y cualquier
barrido semántico de `openspec/specs`.

## Hechos de partida — medidos, no heredados

Medido con `tsx apps/desk/server/citas/cli.ts --sha HEAD` y con copias parcheadas del detector en el
scratchpad; el repositorio no se tocó.

| Hecho del analista | Medido | Veredicto |
|---|---|---|
| La línea base está vacía | `lineaBase.jsonl`: 0 líneas | cierto |
| 1689 comprobadas y 16 abreviadas rotas | 1689 · 16 · 0 bloqueantes | cierto |
| El final vacío da 0, así que imponerlo no bloquea ningún push | comprobadas sigue en 1689 y abreviadas rotas en 16, **pero ambiguas baja de 139 a 136 y aparecen 3 bloqueantes** | **falso para las ambiguas** |

Los tres bloqueantes nuevos son citas ambiguas cuya única candidata válida termina en línea vacía
(RQ-CV-03: una ambigua bloquea sólo si está rota en TODAS). Comprobado contra `HEAD`, uno a uno:

- la línea 197 de apps/desk/server/admin.test.ts cita directory.ts del 62 al 67; la candidata de
  routes tiene la 67 vacía y la de db tiene 64 líneas;
- la línea 189 del Paquete_de_Despliegue_2026-09-10 cita vistas-tablero/spec.md del 35 al 40; la 40 está
  vacía en la spec canónica y en las dos copias archivadas;
- la línea 544 de la spec de tickets-core cita migrate.ts del 70 al 74; la de db tiene la 74 vacía, y las
  de booksHub y crmHub tienen 16 y 15 líneas.

Defecto 2, con la abreviada heredando el ancla de la última completa válida de su línea: abreviadas
rotas 16→10, comprobadas 1689→1694, no legibles 0→1. Salen de rotas las de las líneas 13 (dos), 16, 18 y
104 del plan de hardening-fase-b, todas tras una completa anclada a 1d030d5, y la de la línea 254 del
plan de mano-de-obra-por-modelo, tras una anclada a db3b807. La que pasa a «no legible» NO es por
herencia: en la línea 167 de Puntos_para_Gerencia_2026-09-11 la abreviada dice «128 en
habilitar_servicio», y `REVISION_RE` toma el nombre de la función como ancla propia. Hoy el detector
ignora esa ancla; honrarla la convierte en un fallo de ancla.

Con los dos parches juntos: 1694 comprobadas, 10 rotas, 136 ambiguas, 1 no legible y los mismos 3
bloqueantes.

## Dónde vive cada rama

| Pieza | Ubicación |
|---|---|
| `rotura()`, sin la cuarta rama | `apps/desk/server/citas/detector.ts:109-115` en `9de5d17` |
| Llamada para abreviada | `apps/desk/server/citas/detector.ts:200` en `9de5d17` |
| Llamada para completa (cada candidata) | `apps/desk/server/citas/detector.ts:267` en `9de5d17` |
| Primera pasada, abreviada leída en el sha local | `apps/desk/server/citas/detector.ts:174-176` en `9de5d17` |
| Segunda pasada, abreviada leída en el sha local | `apps/desk/server/citas/detector.ts:195` en `9de5d17` |
| Rama defensiva `noLegibles` de la abreviada | `apps/desk/server/citas/detector.ts:196-198` en `9de5d17` |
| `arbolDeLectura`, que sólo usa la completa | `apps/desk/server/citas/detector.ts:124-126` en `9de5d17` |
| Revisión inexistente bloquea (completa) | `apps/desk/server/citas/detector.ts:208-210` en `9de5d17` |
| Semántica documentada de `anclasSinResolver` y `noLegibles` | `apps/desk/server/citas/detector.ts:43-48` en `9de5d17` |
| Invariante de conservación | `apps/desk/server/citas/detector.ts:53-56` en `9de5d17` |
| Atribución confinada a la línea física | `apps/desk/server/citas/cosecha.ts:106` en `9de5d17` |
| Completa: ancla y último fichero válido | `apps/desk/server/citas/cosecha.ts:113-131` en `9de5d17` |
| Abreviada: ancla propia ya rellenada | `apps/desk/server/citas/cosecha.ts:133-144` en `9de5d17` |
| Mención pelada que cambia el fichero de atribución | `apps/desk/server/citas/cosecha.ts:147-155` en `9de5d17` |

`resolucion.ts` no interviene en ninguno de los dos defectos.

## Cobertura de pruebas hoy

**Defecto 1.** `apps/desk/server/citas/detector.test.ts:6` en `9de5d17` usa una línea sola (inicial y
final coinciden); `apps/desk/server/citas/detector.test.ts:29` en `9de5d17` fija final fuera de rango con
inicial bien; `apps/desk/server/citas/detector.test.ts:41` en `9de5d17` fija inicial vacío con final bien.
**Ninguna** prueba fija un rango con el inicial bien y el final vacío: es el espejo que falta, y hoy se
pondría roja (rojo genuino bajo strict_tdd). Ninguna prueba fija ambigua + final vacío.

**Defecto 2.** Cero pruebas en cualquiera de sus formas: ni abreviada con ancla propia, ni abreviada que
herede el ancla de una completa de su línea, ni fallo de ancla en abreviada. La prueba defensiva de
`noLegibles` sólo lee contra el sha local.

La prueba del invariante (`apps/desk/server/citas/hook.test.ts:164-165` en `9de5d17`) fija cifras sobre un
documento sintético sin rango de final vacío ni abreviada anclada: no debería moverse, pero tampoco cubre
los casos nuevos.

## El invariante de conservación y el defecto 2

La suma se conserva mientras cada caso nuevo caiga en exactamente un sumando: una abreviada anclada que
pasa de rota a comprobada se mueve entre sumandos. El problema es **en cuál cae un fallo de ancla** —la
revisión (propia o heredada) no pela a árbol, o el fichero atribuido no existe en ella—:

- **no puede bloquear**: `openspec/specs/citas-verificables/spec.md:215` en `9de5d17` dice que una
  abreviada «anclada o no» no bloquea (RQ-CV-06);
- `noLegibles` lo documenta como caso defensivo del sha local (submódulo): reusarlo ensancha su semántica.
  Es donde aterriza hoy si sólo se cambia la lectura;
- `anclasSinResolver` se define para un nombre que no resuelve ni local ni literalmente; la abreviada
  atribuida siempre resuelve localmente, así que tampoco encaja;
- `abreviadasRotas` encaja con la letra de RQ-CV-06 (informar en su propia cifra con motivo), a costa de
  mezclar rotura de contenido y de ancla, distinguibles sólo por el motivo;
- un contador nuevo es lo más preciso y lo que más toca `informe.ts`.

## La spec

RQ-CV-08 (`openspec/specs/citas-verificables/spec.md:349-353` en `9de5d17`) ya exige comprobar la línea
vacía y «ambos extremos por separado». Sus tres escenarios no ejercitan el final vacío: el código cumple
los escenarios y no el texto. RQ-CV-06 no dice nada sobre heredar el ancla de otra cita de la misma línea,
ni sobre qué pasa con una abreviada cuya ancla no existe (el bloqueo por revisión inexistente de
`openspec/specs/citas-verificables/spec.md:231` en `9de5d17` es sólo para la completa). RQ-CV-17 tampoco
lo declaraba como hueco: es terreno nuevo, no contradicción.

## Riesgos

- Imponer el defecto 1 sin decidir qué pasa con los 3 bloqueantes pone el hook en rojo contra el propio
  repositorio.
- Honrar sólo el ancla propia de la abreviada no arregla ninguna de las 6 reales y convierte en fallo de
  ancla la única ancla propia que hay, que es falsa.
- `detector.ts` y `cosecha.ts` están citados por línea en `CLAUDE.md`, `openspec/config.yaml` y los
  artefactos archivados de hook-citas-pre-push: el cierre exige el barrido de la regla de mutación 4,
  incluidas las abreviadas.
- Al cerrar hay que retirar los dos hallazgos de `hallazgos_que_siguen_vivos` y del párrafo de IV-10 de
  `CLAUDE.md`.

## Estado

Exploración completa. Antes de `sdd-propose` hace falta la ronda de preguntas de Gerencia (modo
interactive).
