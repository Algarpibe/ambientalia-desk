---
tanda: F1B-07
motivo: ""
capacidad: [vistas-tablero]
maestro: []
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: la tarjeta de «Remisión creada» muestra el tiempo en el estado, en días hábiles

## Intención

`decision/f1b07-tiempo-en-tarjeta-y-cierre-11-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`) responde E-192 de `docs/sdd/ENTRADA.md`: cada tarjeta de la lista de «Remisión creada» muestra el tiempo que el ticket lleva en ese estado, en **días hábiles**. La misma decisión fija que este cambio, archivado, declara el cierre de la fila F1B-07 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:87`). **Maestro.** Pasaje: ninguno; la decisión lo registra así (`maestro_pasaje: "ninguno"`). `toca_maestro: no`: buscar «tiempo transcurrido», «lista de «Remisión creada»» y «días hábiles en ese estado» en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md` da 0 apariciones, así que el cambio no contradice ningún pasaje. Que el maestro no describa la lista en absoluto es **hipótesis** acotada a esas tres búsquedas.

## Problema

La lista ya se ordena por la entrada al estado, pero no enseña cuánto lleva cada ticket: `listaRemisionCreada` devuelve sólo el instante `enEstadoDesde` (`apps/desk/server/db/listaRemisionCreada.ts:16`) y ninguna de las tres pantallas lo pinta. RQ-VT-10 dejó la condición escrita: si la pantalla enseña el tiempo, lo trae calculado el servidor con el calendario de cierres y el cliente no lo calcula (`openspec/specs/vistas-tablero/spec.md:400-402`). Quien mira la lista sabe quién va primero, no cuántos días lleva.

## Alcance

### Dentro

1. **El servidor calcula el número.** Cada elemento de `GET /api/remision-creada` (`apps/desk/server/routes/prioridad.ts:92-93`) gana `diasHabilesEnEstado: number | null`. `listaRemisionCreada` (`apps/desk/server/db/listaRemisionCreada.ts:13`) recibe un segundo parámetro `ahora: Date = new Date()` —molde: `apps/desk/server/services/alarmasSla.ts:141`— y lee los cierres con `listarCierres` (`apps/desk/server/db/calendarioCierres.ts:31`), como ya hacen la alarma (`apps/desk/server/db/sla.ts:46`) y los indicadores (`apps/desk/server/indicadores.ts:88`). Sin migración ni columna.
2. **El cálculo es una función pura de `packages/shared`**, en un fichero nuevo `packages/shared/src/tiempoEnEstado.ts`: toma el instante de entrada, `ahora` y los cierres, reduce los dos instantes a día civil con `diaEnZona` (`packages/shared/src/fechasDerivadas.ts:63`) y llama a `diasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:196`). Sin instante legible devuelve `null`. No se escribe ningún cálculo de días hábiles nuevo: RQ-CL-11 lo prohíbe (`packages/shared/src/calendarioLaboral.ts:6-7`).
3. **El texto es otra función pura del mismo fichero**, `textoTiempoEnEstado`: número → texto (T2), `null` → «Sin fecha de entrada» (T3), campo ausente → nada que pintar (T5). Se exporta añadiendo una línea al final de `packages/shared/src/index.ts` (hoy termina en `packages/shared/src/index.ts:41`).
4. **El tipo.** `Ticket` gana `diasHabilesEnEstado?: number | null`, en sitio, en la línea de las marcas de vista calculadas por el servidor (`packages/shared/src/types.ts:37`).
5. **La pantalla sólo pinta.** Un componente nuevo `apps/desk/src/components/DistintivoTiempoEnEstado.tsx` —molde: `apps/desk/src/components/DistintivoGarantia.tsx:5`— llama a `textoTiempoEnEstado` y pinta en gris. Se engancha en sitio, sin añadir líneas, junto al distintivo de garantía: `apps/desk/src/components/TicketCard.tsx:103`, `apps/desk/src/components/TicketList.tsx:29` y `apps/desk/src/components/TicketTable.tsx:34` (T7).
6. **Pruebas.** (a) de las dos funciones puras, en `packages/shared/src/tiempoEnEstado.test.ts`; (b) de la función del servidor con `ahora` fijo y cierres sembrados, y de la ruta, al final de `apps/desk/server/listaRemisionCreada.test.ts`; (c) que el listado de activos y «Mis tickets» **no** traen el campo.
7. **Delta de especificación.** Un requisito **nuevo** al final de `vistas-tablero` (RQ-VT-16, tras RQ-VT-15, `openspec/specs/vistas-tablero/spec.md:810`), con escenarios automatizados del servidor y escenarios manuales de la pantalla. RQ-VT-10 (`openspec/specs/vistas-tablero/spec.md:376`) **no** se modifica: su frase condicional ya lo ampara, y crecerla desplazaría RQ-VT-11 a RQ-VT-15.

### Fuera

- El orden de la lista: `ordenarPorEntrada` (`packages/shared/src/listaPorEntrada.ts:10`) no se toca.
- Las alarmas de plazo y de SLA, sus umbrales (`packages/shared/src/sla.ts:34`) y sus avisos; el campo en cualquier otra ruta, y la cabecera del detalle del ticket.
- Pruebas de `.tsx`: excluidas por decisión de Gerencia (F0-00). No se propone `jsdom` ni `@testing-library`. E-194 no bloquea: donde volvería a verse es la aceptación con servicios reales.

## Capacidades

- **Nuevas:** ninguna.
- **Modificadas:** `vistas-tablero` — requisito nuevo RQ-VT-16: la lista de «Remisión creada» trae, por ticket, los días hábiles en el estado calculados por el servidor, y tarjeta, lista y tabla los pintan con texto fijo y color neutro. `calendario-laboral` no cambia: se consume RQ-CL-08 tal cual.

## Enfoque y reglas

- **Enfoque.** Una lectura fija más (los cierres) por petición, sea cual sea el número de tickets: la prueba de «sin N+1» (`apps/desk/server/listaRemisionCreada.test.ts:118`) compara 3 contra 6 tickets y debe seguir verde; el comentario «Dos lecturas fijas» (`apps/desk/server/db/listaRemisionCreada.ts:9`) se corrige en sitio. La ruta llama a la función sin `ahora`; las pruebas del número llaman a la función con `ahora` fijo, y la de ruta fija sólo la presencia y el tipo del campo. Cómo inyectar «hoy» también por HTTP queda para el diseño.
- **Regla invariable 13, y regla de mutación 3 por escrito.** El cliente no decide nada: ni bloquea, ni rellena, ni avisa. Sólo pinta.

| Lo que se ve en la pantalla | Quién lo decide | Línea que lo impone hoy, o dónde irá |
|---|---|---|
| El número de días hábiles | Servidor | Se añade en `apps/desk/server/db/listaRemisionCreada.ts:16`, que hoy ya compone cada elemento; la cuenta es `packages/shared/src/calendarioLaboral.ts:196` |
| Qué día es hábil (festivos y cierres) | Servidor | `packages/shared/src/calendarioLaboral.ts:139`, con los cierres de `apps/desk/server/db/calendarioCierres.ts:31` |
| El texto, y si hay algo que pintar | Función pura de `shared`, probada | `packages/shared/src/tiempoEnEstado.ts` (nuevo); el `.tsx` no ramifica por el valor |
| El orden de la lista | Servidor | `apps/desk/server/db/listaRemisionCreada.ts:16`; el cliente la enseña tal cual (`apps/desk/src/api/client.ts:806`) |

- **`strict_tdd`.** Las pruebas de 6(a) nacen rojas porque el fichero no existe; las de 6(b), porque el campo no viaja. El rojo se anota en el `apply` antes del producto. El `.tsx` no admite rojo previo: verificación manual.
- **Regla de mutación 4.** Objetivo: ninguna línea existente cambia de número. `apps/desk/server/db/listaRemisionCreada.ts` se edita en sitio (sus líneas 13 y 16 las cita `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md`, paquete fechado, caso B); `TicketCard.tsx`, `TicketList.tsx`, `TicketTable.tsx` y `packages/shared/src/types.ts` cambian dentro de líneas que ya existen; `index.ts` y la prueba del servidor crecen por el final. Si en el `apply` alguna tiene que crecer, se dice y se barre.
- **Mutaciones previstas** (resultado: hipótesis hasta el `apply`): invertir `desde` y `hasta`; tomar el día en UTC y no en la zona de negocio; pasar un conjunto de cierres vacío; contar el día de entrada; devolver 0 donde va `null`; cambiar el texto del 0 o del 1.

## Supuestos reversibles de este cambio

Regla de las preguntas a Gerencia (E-237): Gerencia tiene hasta el **2026-10-18** para corregirlos; lo no corregido queda aceptado con esa fecha.

| Nº | Supuesto | Por qué |
|---|---|---|
| T1 | El día de entrada **no** cuenta: se cuentan los días hábiles posteriores al de entrada hasta hoy inclusive | Es la semántica `(desde, hasta]` de `diasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:193-194`); otra cuenta sería un segundo cálculo |
| T2 | Textos exactos: 0 → «Menos de 1 día hábil»; 1 → «1 día hábil»; n ≥ 2 → «n días hábiles» (p. ej. «3 días hábiles») | No se usa «hoy»: el 0 también sale si el ticket entró en fin de semana o festivo |
| T3 | Sin fecha de entrada el servidor manda `null` y la tarjeta dice «Sin fecha de entrada» | Es el ticket replicado de Zoho que el motor nunca movió; RQ-VT-10 lo deja al final, no lo omite |
| T4 | Color neutro (gris), nunca ámbar ni rojo | Informa, no alarma; el ámbar es de la espera |
| T5 | El distintivo sólo aparece en la vista de «Remisión creada» | El campo no viaja en las demás rutas; ausente, la función de texto no devuelve nada |
| T6 | El día civil se toma en `America/Bogota` | Es la zona fija del calendario laboral: `ZONA_NEGOCIO` (`packages/shared/src/fechasDerivadas.ts:13`), la que usa `horasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:176-178`) y la del día de hoy en `apps/desk/server/routes/indicadores.ts:48` |
| T7 | Se pinta en los tres modos de la vista: tarjeta, lista y tabla | La vista se enseña en cualquiera de ellos (`apps/desk/src/App.tsx:119-133`); pintarlo sólo en la tarjeta lo escondería en lista y tabla. Añadido por esta propuesta: no está en la letra de la decisión |

## Supuestos heredados de la fila — aplicados, NO cerrados por Gerencia

La decisión dice expresamente que **no** responde estas cinco entradas. Están aplicadas en el código por los cambios anteriores; este cambio las declara reversibles con el mismo plazo, **2026-10-18**. Archivar no las da por respondidas. E-190 y E-193 son del 2026-10-04 y `prioridad-tres-niveles` cambió después el nacimiento («la prioridad pedida en el alta ya no interviene», `openspec/changes/archive/2026-10-08-prioridad-tres-niveles/archive-report.md:19-20`): que su texto siga describiendo el código de hoy es **hipótesis**, no contrastada aquí.

| Entrada | Supuesto aplicado, según su texto en `docs/sdd/ENTRADA.md` |
|---|---|
| E-188 | Sobre la prioridad propagada a un ticket venido de Zoho manda la aplicación, y la marca se conserva tras desmarcar al cliente |
| E-189 | Una prioridad cambiada en una transición, sin motivo, no cuenta como ajuste manual |
| E-190 | Si el Top 5 es más bajo que la prioridad del ticket, el ticket baja, salvo contrato vigente |
| E-191 | La lista trae todos los tickets en el estado, con o sin orden de venta |
| E-193 | La base guardada al nacer bajo Top 5 es la prioridad pedida en el alta |

## Cierre de la fila F1B-07

| Cambio | Qué cubre de la fila | Fuente |
|---|---|---|
| `prioridad-top5-cliente` | Prioridad del cliente Top 5, ajuste por ticket con traza y la cola del taller («Mis tickets» y tablero) | `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:9-17` |
| `propagar-top5-lista-remision-creada` | Propagar y revertir el Top 5 en los tickets abiertos; lista de «Remisión creada» ordenada | `openspec/changes/archive/2026-10-04-propagar-top5-lista-remision-creada/archive-report.md:9-13` |
| `prioridad-tres-niveles` | Tres niveles de prioridad y ajuste también por el Director Técnico | `openspec/changes/archive/2026-10-08-prioridad-tres-niveles/archive-report.md:6-8` |
| Éste | El tiempo en el estado, en días hábiles, en la lista | E-192 |

**Límite de verificabilidad.** Lo único que los tres informes dejan fuera es la valoración del cliente. El cierre da eso por resuelto apoyándose en `decision/prioridad-clientes-sin-contrato`, que está **sin versionar**: vive en el árbol de Supervisión. En este árbol su clave sólo aparece nombrada dentro de la decisión del 2026-10-11. Mientras no se versione, ese apoyo no se puede comprobar desde el repositorio, y el `cierra: si` descansa en la palabra de la decisión que lo cita.

## Áreas afectadas

**Nuevos:** `packages/shared/src/tiempoEnEstado.ts`, su prueba y `apps/desk/src/components/DistintivoTiempoEnEstado.tsx`. **Modificados:** `packages/shared/src/index.ts`, `packages/shared/src/types.ts`, `apps/desk/server/db/listaRemisionCreada.ts`, `apps/desk/server/listaRemisionCreada.test.ts`, y `TicketCard.tsx`, `TicketList.tsx` y `TicketTable.tsx` de `apps/desk/src/components`. **Al archivar:** `openspec/specs/vistas-tablero/spec.md`.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Dos relojes para la misma espera: la alarma mide 27 **horas** hábiles (`packages/shared/src/sla.ts:34`) y la tarjeta cuenta **días** civiles hábiles. Un ticket que entró un lunes a las 16:00 dice «3 días hábiles» el jueves a las 9:00 con 20 horas hábiles corridas, sin alarma. Es el molde de H5 | Cierta | Consecuencia directa de T1 y de la letra «días hábiles». Se escribe en el requisito y se fija con una prueba que enfrenta los dos relojes sobre ese caso, para que la diferencia quede declarada y no descubierta |
| El número queda viejo si la pantalla sigue abierta al cambiar el día | Media | Se recalcula en cada petición; la vista tiene botón de recarga (`apps/desk/src/App.tsx:102`) |
| El cierre de la fila no es comprobable desde el repositorio | Cierta | Declarado arriba como límite; lo levanta versionar la decisión |

## Vuelta atrás

Revertir el commit. No hay esquema ni dato: el campo deja de viajar y las tres pantallas dejan de pintarlo. El orden de la lista y las alarmas son idénticos antes y después.

## Criterios de éxito

- [ ] Las pruebas de las funciones puras y las del servidor se vieron rojas antes del producto y verdes después.
- [ ] Con `ahora` fijo, un festivo y un cierre sembrado descuentan cada uno un día; una entrada de madrugada UTC cuenta desde su día en Bogotá.
- [ ] Sin entrada, el campo es `null`; en activos y «Mis tickets» el campo no viaja.
- [ ] Las pruebas de orden y la de «sin N+1» siguen verdes sin tocarse.
- [ ] Cada mutación prevista tiene su resultado escrito, prueba a prueba.

## Tareas de personas — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1).

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Verificación manual en la aplicación tras desplegar: tarjeta, lista y tabla de «Remisión creada», y que las demás vistas no muestran el distintivo | Alfonso | Escenarios manuales de RQ-VT-16 |
| Corregir, si procede, los supuestos T1 a T7 antes del 2026-10-18, y responder E-188, E-189, E-190, E-191 y E-193 | Gerencia | Lista semanal de supuestos (E-237) y cada entrada de `docs/sdd/ENTRADA.md` |
| Versionar `decision/prioridad-clientes-sin-contrato` | Sesión de supervisión | `openspec/config.yaml` |
