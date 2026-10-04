---
tanda: F1C-05
motivo: ""
capacidad: [transitions-st, permissions, trazas]
maestro: ["Anexo D nº 33", "M1.3.5"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — motivo de lista cerrada y fecha prevista en «Liberación sin factura»

Parte de **paridad** de F1C-05 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:103`), partida
por E-102 (`docs/sdd/ENTRADA.md:1378-1382`). `cierra: no`: la fila conserva, para después del corte,
Decisionales y propietario del registro. Exploración releída: `exploration.md`, en esta carpeta.

## 1 · La letra que manda

`openspec/config.yaml:2373-2388`, `decision/anexo-33-checkbox`, `respuesta_textual` (línea 2378), entera:

> «Deja de ser un checkbox. La transición «Liberación sin factura», que sólo ejecuta el Director Comercial,
> exige dos campos obligatorios en su lugar: (1) Motivo, de una lista cerrada: fecha de corte de facturación
> del cliente · servicio incluido en contrato con facturación periódica · autorización excepcional de
> Dirección Comercial, con texto obligatorio; y (2) Fecha prevista de facturación. Si esa fecha pasa y el
> ticket sigue en «Pendiente de facturar», el sistema avisa al Director Comercial. Las liberaciones
> registradas antes del arreglo del 09/09 conservan su casilla tal como se guardó y se marcan según el
> criterio ya decidido para el histórico (c2); no se reescriben.»

El maestro vigente la recoge en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5127-5129`
(«M1.3.5 · nº 33»). Lo que se construye, a la letra:

| Letra | Construcción |
|---|---|
| «Deja de ser un checkbox» | La casilla sale de la transición; no convive con los campos nuevos |
| «dos campos obligatorios en su lugar» | `Motivo` (`select`, obligatorio) y `Fecha prevista de facturación` (`date`, obligatoria) |
| «de una lista cerrada», tres motivos | Exactamente tres opciones, con el texto de la decisión |
| «con texto obligatorio» | Un tercer campo de texto, exigido sólo con el tercer motivo (supuesto S-1) |
| «que sólo ejecuta el Director Comercial» | Ya construido: RQ-PM-17 (`openspec/specs/permissions/spec.md:389`) |
| «el sistema avisa…», «Pendiente de facturar» | **Fuera**: F1C-02, después del corte (E-102) |
| «se marcan… no se reescriben» | **Fuera**: `p64-historico-c1`; este cambio no toca filas viejas |

## 2 · Intención

Hoy la liberación sin factura sólo deja constancia de que alguien marcó una casilla
(`packages/shared/src/transitions.ts:247`). No dice por qué se liberó ni cuándo se va a facturar, que es lo
que Zoho pide y lo que la alarma de F1C-02 necesitará leer. Y la pieza que falta en el servidor no es
cosmética: un `select` no tiene hoy ninguna comprobación de sus opciones
(`apps/desk/server/transitionExec.ts:76-77` sólo mira presencia), así que sin guarda nueva el desplegable
sería la única guarda de la lista cerrada.

## 3 · Alcance

**Dentro**

1. Catálogo: la línea 247 de `transitions.ts` pasa a declarar motivo, fecha y texto de la autorización.
2. Guarda de servidor, en `packages/shared`: lista cerrada, fecha de calendario real, texto condicional.
3. Dos columnas nuevas en `tickets` (motivo y fecha), fuera de `TICKET_COLS`; el texto, a `custom_fields`
   y a la traza (`ticket_transitions.values`, que guarda todos los valores:
   `packages/zoho-sync/src/db/repo.ts:314-318`).
4. Cliente: que una segunda liberación no herede bloqueados los valores de la primera; y que la ficha
   enseñe motivo y fecha.
5. Pruebas: bloque C1 reescrito, prueba sintética de casilla obligatoria, posición, reentrancia, guardianes.
6. Deltas de spec y texto de corrección para el maestro.

**Fuera**

- La alarma por fecha vencida y el estado «Pendiente de facturar» (F1C-02).
- El marcado del histórico de liberaciones con casilla (`p64-historico-c1`).
- Decisionales y propietario del registro (resto de F1C-05).
- Exigir que la fecha sea futura (la letra no lo dice; pregunta E-nueva-1).
- Borrar la columna `liberacion_sin_facturar` o su entrada en `PROMOTED_COLUMNS`
  (`packages/zoho-sync/src/db/rows.ts:130`): es histórico y la sigue escribiendo el sincronizador
  (`packages/zoho-sync/src/db/repo.ts:53`).
- Corregir IV-12 o cualquier otra guarda de `executeTransition`.

## 4 · Capacidades

**Nuevas:** ninguna (no hay alta en `capabilities`, regla R-2).

**Modificadas**

| Capacidad | Qué cambia | Dónde |
|---|---|---|
| `transitions-st` | Requisito nuevo (siguiente libre: **RQ-TS-35**, el más alto hoy es el 33): los tres campos, la lista literal y la guarda | — |
| `transitions-st` | RQ-TS-06: fila nueva en la tabla de guardas, escalón C, en la sentencia del `422` agregado | `openspec/specs/transitions-st/spec.md:210-221` en `ce4fead` |
| `transitions-st` | RQ-TS-08: el `checkbox` obligatorio queda sin caso vivo en el catálogo (el motor lo sigue soportando); tercera validación de contenido | `:327-329`, `:311-318` |
| `transitions-st` | RQ-TS-09: el mapa pasa de 40 a 42 entradas y «ninguna cae al cajón» deja de ser cierto para el texto | `:352-361` |
| `transitions-st` | Invariante 6 y §3.3: de diez a once campos de fecha reentrantes | `:64`, `:981` |
| `transitions-st` | §3.1: la cita de la casilla pasa a histórica (caso B) y se añade qué la sustituye | `:909-937` |
| `permissions` | RQ-PM-18: escenario nuevo, el `403` de cargo gana al `422` de la guarda nueva | `openspec/specs/permissions/spec.md:410-429` en `ce4fead` |
| `trazas` | Dos menciones a «los diez campos» | `openspec/specs/trazas/spec.md:91`, `:494` |

## 5 · Enfoque

**Catálogo — una línea, cero desplazamiento.** Se reescribe sólo la línea 247, con los tres campos como
objetos en línea (el `key` es la clave de almacenamiento; el `label`, lo que ve la persona). Sin `import`
nuevo ni helper nuevo: `transitions.ts` conserva su número de líneas. Confirmado leyendo el fichero: la
declaración ocupa `transitions.ts:246-247` y la 248 abre `entrega_sin_factura`.

| Campo | `kind` | `required` | Etiqueta |
|---|---|---|---|
| Motivo | `select` | sí | «Motivo» |
| Fecha | `date` | sí | «Fecha prevista de facturación» |
| Texto | `text` | no en catálogo; lo exige el servidor con el tercer motivo | supuesto S-2 |

Opciones, en este orden (el arnés usa la primera, `apps/desk/server/testing/appHarness.ts:78`, así que la
tercera no puede ir delante): «Fecha de corte de facturación del cliente» · «Servicio incluido en contrato
con facturación periódica» · «Autorización excepcional de Dirección Comercial».

**Guarda — módulo nuevo `packages/shared/src/liberacionSinFactura.ts`**, exportado al final de `index.ts`.
Función pura que recibe la transición y los valores y devuelve errores; lee las opciones **del propio campo
del catálogo** (una sola fuente). Tres comprobaciones: (a) el motivo es una de las tres opciones, por
igualdad exacta; (b) la fecha es un día real, reutilizando `esFechaCalendarioReal`
(`packages/shared/src/fechasDerivadas.ts:37`, que se exporta sin añadir línea); (c) con el tercer motivo,
el texto existe **tras recortar espacios**. Molde: `erroresCertificado`
(`packages/shared/src/gasPatron.ts:82-86`).

**Cableado.** En la misma sentencia del `422` agregado, `apps/desk/server/services/ticketService.ts:134`,
detrás de `errCertificado`. Cero líneas nuevas en ese fichero.

**Persistencia.** Dos `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS` **sin calificar** al final de
`packages/zoho-sync/src/db/schema.sql` (`tickets` es de `DESK_TABLES`; el guardián
`packages/zoho-sync/src/db/migrate.test.ts:345-352` exige que vaya sin calificar): `liberacion_motivo text`
y `fecha_prevista_facturacion date`. Dos entradas al **final** de `PROMOTED_COLUMNS` (para no mover
`rows.ts:125` ni `:130`) y dos campos opcionales en `TicketRow`, en una línea existente. Fuera de
`TICKET_COLS`, como `fecha_aviso_cliente` (`packages/zoho-sync/src/db/repo.test.ts:279-288`). El texto no
está en `PROMOTED_COLUMNS` y cae a `custom_fields` (`transitionExec.ts:90-92`).

**Cliente** (`.tsx`, sin pruebas por decisión de Gerencia). `yaLoTraeElTicket`
(`apps/desk/src/components/TransitionPanel.tsx:32-36`) deja de aplicar a los campos de esta transición, con
una constante exportada del módulo nuevo y editando la línea 33 en su sitio. `TicketProperties.tsx` gana
motivo y fecha junto a la casilla histórica (`apps/desk/src/components/TicketProperties.tsx:88`).

## 6 · Regla 13, decisión a decisión

| # | Lo que decide el cliente | Línea del servidor que lo impone |
|---|---|---|
| 1 | Motivo obligatorio (asterisco, `TransitionPanel.tsx:209`) | `transitionExec.ts:77`, traducido a `422` en `ticketService.ts:134` |
| 2 | Fecha obligatoria | la misma |
| 3 | El motivo sólo puede ser uno de tres (desplegable, `TransitionPanel.tsx:257-261`) | **NUEVA**: guarda de lista cerrada, `ticketService.ts:134`. Hoy no existe: sin ella el desplegable es la guarda |
| 4 | La fecha es una fecha (`input type="date"`, `TransitionPanel.tsx:254`) | **NUEVA**: misma guarda. Hoy el servidor sólo recorta (`transitionExec.ts:33`) |
| 5 | Texto exigido con el tercer motivo | **NUEVA**: misma guarda. El cliente **no decide nada**: el campo se pinta siempre, sin asterisco, y el `422` nombra lo que falta |
| 6 | El botón sólo lo ve quien puede (`TransitionPanel.tsx:56-58`) | `ticketService.ts:129-131`, ya probado (RQ-PM-17, RQ-PM-18) |
| 7 | No bloquear ni prellenar en una segunda liberación | No necesita contrapartida: el servidor lee sólo el cuerpo (`transitionExec.ts:43`) y exige los obligatorios en cada ejecución (`:77`) |

Las filas 3, 4 y 5 son espejo legítimo sólo cuando las pruebas de la guarda estén en verde contra el
servidor (punto 3 de la regla).

## 7 · Posición de la guarda y mutaciones

Escalón C. Vecinas: delante, el `403` de área (`ticketService.ts:129-130`) y el de cargo (`:131`), escalón
B; detrás, el `422` de persona derivada (`:138-142`). **El `409` de orden de venta (`:148-152`) no se puede
activar a la vez que esta guarda**: `liberacion_sin_factura` no declara ningún campo de orden de venta, así
que ese par no admite prueba de posición y se dice aquí en vez de fingirla.

Pruebas de posición, cada una con **dos guardas activas** y comparando el mensaje (regla de mutación 1). El
cuerpo lleva los obligatorios presentes y un motivo fuera de lista, para que salte la guarda nueva y no la
de presencia, que es lo que ya cubre P4 (`apps/desk/server/cargoPermiso.test.ts:236-246`):

| Prueba | Guardas activas | Gana |
|---|---|---|
| PL-1 | `403` de cargo + motivo fuera de lista | `403` de cargo; control con administrador: `422` de la lista |
| PL-2 | `409` de estado + motivo fuera de lista | `409` |
| PL-3 | motivo fuera de lista + persona derivada inexistente | el `422` de la lista, sin el mensaje de la persona |
| PL-4 | falta la fecha + motivo fuera de lista | un solo `422`, presencia delante de contenido |

**Regla de mutación 2, sobre el fichero vigilado.** Se escribe en `schema.sql` la sentencia que debe
rechazarse —la misma `ALTER` calificada como `public.tickets`— y se comprueba el rojo de
`migrate.test.ts:332-339`; luego el recuento pasa de 50 / 27 / 23 a 52 / 27 / 25 (`migrate.test.ts:374-386`).
Segunda mutación: meter una de las dos columnas en `TICKET_COLS` (`repo.ts:44-54`) tiene que poner roja la
guarda nueva de `repo.test.ts`.

**Mutaciones de la guarda:** quitar cada una de las tres comprobaciones; aceptar un texto de sólo espacios;
exigir el texto con cualquier motivo. Cada una debe dar rojo.

## 8 · Pruebas que cambian a propósito

- `apps/desk/server/transicionesEjecucion.test.ts:41-103`: C1 se reescribe a motivo, fecha y texto. Para no
  dejar sin prueba `transitionExec.ts:76` se añade en `transitionExec.test.ts` una prueba **sintética** de
  casilla obligatoria (ausente, en `false`, marcada), porque el catálogo deja de tener un caso vivo.
- Reentrancia, cinco pruebas en tres ficheros (el campo de fecha entra en el ciclo C1 por
  `packages/shared/src/reentrancia.ts:93-100`): `packages/shared/src/reentrancia.test.ts:43-52`, `:83-85` y
  `:92-100`; `packages/shared/src/invariantesGrafo.test.ts:137-150` (la fecha nueva va delante de «Fecha
  Remisión de Salida»); `packages/shared/src/bodegaje.test.ts:113`.
- `packages/shared/src/prioridad.test.ts:106`: el literal de obligatorios. Es un literal «medido antes», así
  que el diseño decide si se edita la entrada o se declara la excepción aparte.
- `packages/zoho-sync/src/db/mappers.test.ts:119` sólo si `TicketRow` lo exige (por eso los campos van
  opcionales).

**No cambia el mapa del blueprint:** `scripts/generar-mapa-blueprint.ts:15` y `:29` pasan `TRANSITIONS`
entero y el script no lee `fields`; el grafo (estados, origen, destino, área) queda idéntico.

## 9 · Citas a la línea 247 que habrá que releer al cerrar

| Cita | Qué afirma | Caso |
|---|---|---|
| `apps/desk/server/transitionExec.ts:73` | la casilla «es el único que hay» | **A**: falso tras el cambio; se reescribe el comentario en su sitio, sin mover líneas |
| `apps/desk/server/transicionesEjecucion.test.ts:13` | «el único que existe» | **B**: el bloque se reescribe; la narración de C1 se ancla a `2a74fdc` |
| `debt.md:652` | «el único `required` de las 34 etapas» | **B**: se nombra la revisión |
| `openspec/specs/transitions-st/spec.md:918` en `ce4fead` | «el único caso vivo era» | **B/C**: revisión, más qué lo sustituyó |
| `openspec/specs/permissions/spec.md:518` en `ce4fead`, `openspec/specs/transitions-equipo-nuevo/spec.md:118` y `:516` | citan la línea 246 (id y área) | **A**: siguen ciertas, sin cambio |
| `docs/sdd/F0-00_Baseline_as-built.md` (ocho líneas) y `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:743` | documentos fechados | **B**: no se renumeran |

Queda además el segundo pase de formas abreviadas, que ese barrido no caza, y el barrido de `rows.ts`,
`schema.sql` y `ticketService.ts`.

## 10 · Supuestos (razonables y reversibles)

- **S-1** — «con texto obligatorio» aplica sólo al tercer motivo: la coma cuelga del último elemento de la
  lista. Reversible cambiando una condición.
- **S-2** — Etiqueta del campo de texto: «Texto de la autorización». La decisión no la nombra.
- **S-3** — Las opciones se escriben con mayúscula inicial; el resto, letra por letra.
- **S-4** — Motivo y fecha en columnas propias y no en el `jsonb`: E-102 pide que la fecha registrada desde
  el corte sirva a la alarma de F1C-02. Columnas anulables y sin relleno; revertir es dejar de escribirlas.
- **S-5** — La ficha del ticket enseña motivo y fecha.
- **S-6** — La transición **deja de escribir** `liberacion_sin_facturar`. Es lo que dice «deja de ser un
  checkbox»; su consecuencia va en E-nueva-3.

## 11 · Preguntas para la bandeja

- **E-nueva-1** — ¿La fecha prevista de facturación debe ser futura? La letra no lo pide y se construye sin
  exigirlo. Con fecha pasada, la alarma de F1C-02 saltaría nada más liberar.
- **E-nueva-2** — ¿«Con texto obligatorio» es sólo para la autorización excepcional (S-1), o para los tres?
- **E-nueva-3** — Las liberaciones nuevas no marcan la casilla. Quien cuente liberaciones por
  `liberacion_sin_facturar` o por la casilla en la traza
  (`docs/sdd/Consultas_Recuentos_2026-09-25.sql:122-124`) verá vacío en las posteriores al despliegue. ¿Se
  cuenta desde ahora por el motivo?
- **E-nueva-4** — Los tickets que el día del despliegue estén en `Por Entregar / Sin facturar`, liberados
  con casilla, no tienen motivo ni fecha. ¿Se les pide al construir F1C-02, o quedan fuera de la alarma?

## 12 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Segunda liberación con valores viejos bloqueados | Alta sin el arreglo | Fila 7 de §6; paso de comprobación en la aplicación |
| La tabla de reentrancia crece y alguien lo lee como defecto | Media | Es un hecho del grafo: la fecha se pisa en la columna y la traza guarda todas (`reentrancia.ts:16-24`); se anota en el delta |
| Desplazar citas en `transitions.ts`, `rows.ts` o `ticketService.ts` | Media | Edición en su sitio o al final; barrido de la regla de mutación 4 al cerrar |
| Nadie con cargo Director Comercial en producción | Preexistente | Comprobación de persona en el paquete de despliegue |
| Otros lectores de `fields` (`sla.ts`, `prioridad.ts`, `bodegaje.ts`, `fechasDerivadas.ts`) reaccionan a los campos nuevos | Baja, *hipótesis* | El diseño los lee uno a uno antes de fijar las claves |

## 13 · Reversión

Revertir el commit devuelve la casilla obligatoria. Las columnas quedan, anulables e inertes. **Liberaciones
ya hechas con la casilla:** no se tocan, ni antes ni después. **Liberaciones hechas con los campos nuevos:**
conservan motivo, fecha y texto en la traza y en sus columnas; tras revertir, su casilla seguiría vacía, y
eso habría que decirlo en el parte.

## 14 · Corrección para el maestro (`toca_maestro: si`)

Se entrega como texto en `docs/sdd/F0-01_Correcciones_para_el_maestro.md` al aplicar; el `.docx` no se toca.
El maestro describe como construido el estado anterior en la línea 1842 de la R08.4.md («El único caso
afectado era «Liberación del ticket sin facturar»»). Texto propuesto, a continuación de ese párrafo:

> «[CONSTRUIDO] Desde `liberacion-sin-factura-motivo-fecha` la transición «Liberación sin factura» ya no
> lleva casilla: exige Motivo, de una lista cerrada de tres, y Fecha prevista de facturación; con el motivo
> «Autorización excepcional de Dirección Comercial» exige además el texto de la autorización. El servidor
> rechaza un motivo fuera de la lista. La alarma por fecha vencida sigue pendiente (F1C-02).»

## 15 · Estimación por lote

Fórmula: producción + pruebas × 1,8 + casillas de `tasks.md`, contra la válvula de 720 (techo 800).

| Lote | Contenido | Prod. | Pruebas | × 1,8 | Casillas | Total |
|---|---|---|---|---|---|---|
| 1 · sin cambio de comportamiento | columnas, `PROMOTED_COLUMNS`, `TicketRow`, guardianes de `migrate` y `repo`, exportar la fecha real, módulo de la guarda con sus pruebas, prueba sintética de casilla | 60 | 142 | 256 | 10 | **≈ 326** |
| 2 · el cambio | línea 247, cableado, C1 reescrito, PL-1 a PL-4, reentrancia, `prioridad.test.ts`, cliente, comentario de `transitionExec.ts` | 15 | 239 | 430 | 12 | **≈ 457** |

Suma ≈ 783: **no cabe en un intento; van dos**, y la suite queda verde al final de cada uno. Los artefactos
SDD de esta carpeta y los informes de `verify` y `archive` son sumandos aparte y se miden, no se estiman.

## 16 · Lo que añade al paquete de despliegue

- **Esquema `desk`:** `tickets.liberacion_motivo text` y `tickets.fecha_prevista_facturacion date`, anulables,
  sin relleno, al final de `schema.sql` (hoy acaba en la línea 707; previstas, las líneas 710 y 711).
- **Comprobaciones de persona:** (1) que alguien tenga el cargo Director Comercial; (2) liberar un ticket en
  `Por Facturar` y ver los tres campos y ninguna casilla; (3) tercer motivo sin texto: la aplicación lo
  rechaza y nombra lo que falta; (4) entregar, volver a `Por Facturar` y liberar otra vez: motivo y fecha
  salen vacíos y editables; (5) la ficha enseña motivo y fecha.

## 17 · Criterios de aceptación

1. `liberacion_sin_factura` declara motivo (`select`, obligatorio, tres opciones con el texto de §5), fecha
   (`date`, obligatoria) y texto; no declara ninguna casilla.
2. `transitions.ts` tiene el mismo número de líneas que en `2a74fdc` y sólo difiere la 247.
3. Sin motivo o sin fecha: `422` con «Falta el campo obligatorio» y el ticket sigue en `Por Facturar`.
4. Motivo fuera de la lista: `422`, sin cambio de estado, aunque el resto sea válido.
5. Fecha que no es un día real (30 de febrero): `422`.
6. Tercer motivo sin texto, o con sólo espacios: `422`; con texto: `200`.
7. Primer o segundo motivo sin texto: `200`.
8. Con `200`: `liberacion_motivo` y `fecha_prevista_facturacion` escritas, el texto en `custom_fields`, los
   tres en `ticket_transitions.values`, y `liberacion_sin_facturar` sin tocar.
9. PL-1 a PL-4 en verde, y cada una en rojo al mover la guarda.
10. Las dos columnas no están en `TICKET_COLS`; el recuento de `ALTER` es 52 / 27 / 25; la mutación del
    fichero vigilado da rojo.
11. La casilla obligatoria sigue probada por la prueba sintética.
12. La tabla de reentrancia declara diez casos y once campos, nueve obligatorios.
13. `npm test`, `npm run typecheck` y `npm run lint` en verde; barrido de citas sin roturas nuevas.
14. Regla 13: las siete filas de §6 comprobadas contra las líneas finales en el `verify`.
