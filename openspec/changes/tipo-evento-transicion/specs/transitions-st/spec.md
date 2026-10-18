# Delta de `transitions-st` — `tipo-evento-transicion` (F1C-04)

## ADDED Requirements

### Requirement: RQ-TS-44 · Cada transición lleva un solo tipo de evento, de una lista cerrada

Fuente: `decision/c5-tipo-evento` (`openspec/config.yaml:1866-1882`) y maestro M1.3 y M1.8
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1658-1661`, `:1663`, `:1899-1909`).

Existe `TIPOS_EVENTO`, tupla cerrada de `packages/shared/src/tipoEvento.ts`, con exactamente `'Operativo'`, `'Decisional'`,
`'Compras / Logístico'` y `'Administrativo'` (grafía de M1.3 y M1.8). Cada transición de `TRANSITIONS`,
`TRANSITIONS_EQUIPO_NUEVO` y `TRANSITIONS_SOPORTE_REMOTO` (`packages/shared/src/flujos.ts:19-22`) y cada uno de los dos pasos
del servidor, `TRANSICION_REMISION_CONFIRMADA` y `TRANSICION_REMISION_RETIRADA` (`packages/shared/src/transitions.ts:150-151`),
**SHALL** llevar `tipoEvento` con **exactamente un** valor de esa lista. `interface Transition`
(`packages/shared/src/transitions.ts:55-62`) **SHALL** declararlo **obligatorio**: una transición sin tipo, o con uno fuera
de la lista, **SHALL NOT** compilar. Además, un barrido en ejecución **SHALL** comprobar que el tipo de cada una de las 47
pertenece a `TIPOS_EVENTO`, para cazar lo que una conversión forzada dejaría pasar.

**Tabla normativa** (47 filas: 33 de servicio, 7 de equipo nuevo, 5 de soporte remoto y 2 pasos del servidor). La prueba
fijada **SHALL** reproducirla fila a fila. Fuente: **L** = lista de actos del maestro (`R08.4.md:1658-1661`, `:1903-1908`);
**H** = hoja `DF-servicio-tecnico-160226.xlsx`, columna `TIPO_EVENTO`; **N** = Notion «Flujo equipo-nuevo» (03/02/2026);
**S** = supuesto reversible de la propuesta (S-1 anulaciones, S-2 trabajo de soporte remoto). Si L nombra el acto sin
ambigüedad, L gana sobre H (S-3); «L sobre H» marca los nueve conflictos.

*Servicio (33):*

| id | Tipo | Fuente | id | Tipo | Fuente |
|---|---|---|---|---|---|
| `habilitar_servicio` | Operativo | H | `cal_sensores_proceso` | Operativo | H |
| `ingreso_a_servicio` | Operativo | H + L | `cal_sensores_revision` | Operativo | H |
| `escalado_a_revision` | Decisional | L sobre H | `retorno_servicio_externo` | Compras / Logístico | L sobre H |
| `devolucion_a_correccion` | Decisional | H | `rechazo_comercial` | Decisional | H + L |
| `llegada_repuestos` | Compras / Logístico | H + L | `rechazo_cliente` | Decisional | H + L |
| `aprobacion_y_repuestos` | Compras / Logístico | H | `rechazo_revision` | Decisional | H + L |
| `solicitud_repuestos` | Compras / Logístico | L sobre H | `facturado` | Administrativo | L sobre H |
| `aprobacion` | Decisional | L sobre H | `facturado_cierre` | Administrativo | L sobre H |
| `entrega_repuestos` | Compras / Logístico | H + L | `diagnostico_complementario` | Operativo | H + L |
| `notif_por_garantia` | Operativo | H | `liberacion_sin_factura` | Decisional | L sobre H |
| `notif_cliente_comercial` | Operativo | H | `entrega_sin_factura` | Operativo | H |
| `notif_cliente_sku` | Compras / Logístico | H + L | `entrega_al_cliente` | Operativo | H |
| `rechazo_garantia` | Decisional | L sobre H | `habilitado_para_entrega` | Operativo | H |
| `solicitud_sku` | Compras / Logístico | L sobre H | `notif_recotizacion` | Operativo | H |
| `reporte_por_garantia` | Operativo | H | `anulacion` | Decisional | S-1 |
| `escalado_a_comercial` | Operativo | H | `facturar` | Administrativo | L |
| `finalizacion_servicio` | Operativo | H | | | |

*Equipo nuevo (7), soporte remoto (5) y pasos del servidor (2):*

| id | Tipo | Fuente | id | Tipo | Fuente |
|---|---|---|---|---|---|
| `ingreso_equipo_nuevo` | Operativo | N | `asignacion_soporte` | Operativo | S-2 |
| `analisis_y_acciones` | Operativo | N | `ejecutar_soporte` | Operativo | S-2 |
| `verificacion` | Operativo | N | `soporte_pendiente` | Operativo | S-2 |
| `producto_no_conforme` | Decisional | N | `continuacion_soporte` | Operativo | S-2 |
| `liberacion` | Decisional | N | `anulacion_soporte` | Decisional | S-1 |
| `rechazo_verificacion` | Decisional | L + N | `remision_confirmada` | Compras / Logístico | L |
| `anulacion_equipo_nuevo` | Decisional | S-1 | `remision_retirada` | Compras / Logístico | L |

**Recuentos.** Servicio: Operativo 14 · Decisional 9 · Compras / Logístico 7 · Administrativo 3 = 33. Total de las 47:
Operativo 21 · Decisional 14 · Compras / Logístico 9 · Administrativo 3.

**Nota — «Creación de informe» queda fuera.** No es una transición (ninguna lo es: `R08.4.md:1663`, `:1932`); sus tres actos
(Elaboración, Emisión, Validación) se aplican en F1E (`openspec/config.yaml:1872`, `:1876`). Este requisito no los toca ni
los comprueba.

**Nota — la validación de Gerencia.** M1.3 pide validar la tabla antes de aplicarla (`R08.4.md:1664`); la tanda la deja
construida e inerte (S-8 de la propuesta) y la validación es tarea de persona, no de este requisito.

#### Scenario: toda transición de todo catálogo tiene un tipo de la lista — ROJO
- GIVEN `TRANSITIONS`, `TRANSITIONS_EQUIPO_NUEVO`, `TRANSITIONS_SOPORTE_REMOTO` y los dos pasos del servidor
- WHEN un barrido en ejecución recorre las 47
- THEN cada una tiene un `tipoEvento` que está en `TIPOS_EVENTO`, y ninguna lo trae vacío o ajeno a la lista

#### Scenario: la tabla fijada coincide exactamente con la tabla normativa — ROJO
- GIVEN la tabla de este requisito
- WHEN la prueba compara cada id con el `tipoEvento` de su entrada
- THEN las 47 filas coinciden, el recuento es 21 / 14 / 9 / 3, y cambiar el tipo de una sola transición por otra categoría
  la pone en rojo (mutación)

#### Scenario: una transición sin tipo no compila — ROJO
- GIVEN una entrada de cualquier catálogo, o uno de los dos pasos, a la que se le quita `tipoEvento`, o a la que se le da
  un valor fuera de la lista
- WHEN se ejecuta `npm run typecheck` y `npx tsc -p packages/shared/tsconfig.json --noEmit`
- THEN falla la compilación, con los mismos dos errores previos ajenos y ninguno nuevo como línea base

#### Scenario: un ejemplo por cada tipo — ROJO
- GIVEN la tabla normativa
- WHEN se consultan `habilitar_servicio`, `aprobacion`, `solicitud_sku` y `facturar`
- THEN son, en ese orden, Operativo, Decisional, Compras / Logístico y Administrativo

### Requirement: RQ-TS-45 · `tipoEventoDeTransicion` resuelve el tipo por id en los tres catálogos y los dos pasos

`tipoEventoDeTransicion(transitionId: string | null | undefined): TipoEvento | null`, en
`packages/shared/src/tipoEvento.ts`, **SHALL** devolver el `tipoEvento` de la transición cuyo id esté en alguno de los tres
catálogos o sea uno de los dos pasos del servidor, y **SHALL** devolver `null` para cualquier otro valor: la fila de
creación (`enviar`), los marcadores de migración (`migracion_f1f01_abiertos`, `migracion_f1c09_pendiente`), los ids
retirados que la traza de sólo inserción conserva (p. ej. `marcar_pendiente`), y `null`, `undefined` o cadena vacía. **SHALL
NOT** lanzar ni inventar un tipo por defecto. Resuelve por catálogo sin ciclo de importación en tiempo de ejecución:
`transitions.ts` sólo importa el tipo.

#### Scenario: un id de servicio, de equipo nuevo, de soporte remoto o de paso del servidor se resuelve — ROJO
- GIVEN `aprobacion`, `producto_no_conforme`, `ejecutar_soporte` y `remision_retirada`
- WHEN se llama al resolutor con cada uno
- THEN devuelve Decisional, Decisional, Operativo y Compras / Logístico

#### Scenario: la fila de creación y los marcadores de migración no tienen tipo — ROJO
- GIVEN los ids `enviar`, `migracion_f1f01_abiertos` y `migracion_f1c09_pendiente`
- WHEN se llama al resolutor con cada uno
- THEN devuelve `null`

#### Scenario: un id retirado de los catálogos no tiene tipo — ROJO
- GIVEN `marcar_pendiente`, que ya no está en ningún catálogo pero sigue en trazas antiguas
- WHEN se llama al resolutor
- THEN devuelve `null`

#### Scenario: la ausencia de id no lanza — ROJO
- GIVEN `null`, `undefined` y la cadena vacía
- WHEN se llama al resolutor con cada uno
- THEN devuelve `null` y no lanza

## MODIFIED Requirements

### 3.5 · C5 — las transiciones no llevan tipo de evento · **CERRADO en `tipo-evento-transicion` (F1C-04)**

**Esta entrada ya no describe el comportamiento actual.** Los requisitos viven ahora en esta capacidad, RQ-TS-44 (cada
transición lleva un solo tipo de evento, de lista cerrada, con la tabla normativa de 47) y RQ-TS-45 (el resolutor por id), y
en `trazas` RQ-TZ-21 (el historial expone el tipo, derivado al leer); lo que queda aquí es el histórico del defecto y su
cierre, con el mismo patrón que §3.6.

**Qué era** (comportamiento a corregir, destino «sin tanda asignada» antes de esta tanda; maestro `:1439-1443`, punto
abierto nº 35). Las 34 transiciones llevaban `area` y `fields` y **no** llevaban tipo de evento (operativa / decisional /
logística): el `interface Transition` sólo declaraba `id`, `name`, `from`, `to`, `area`, `fields` (`transitions.ts:55-62`).
Sin ese atributo, el análisis de tiempos por tipo de evento de M7.3 no era calculable.

**Cómo se cerró.** `tipo-evento-transicion` (F1C-04, `decision/c5-tipo-evento`) añadió `tipoEvento` obligatorio a
`Transition` y se lo puso a las 47 (33 de servicio, 7 de equipo nuevo, 5 de soporte remoto y los 2 pasos del servidor), de la
lista cerrada `TIPOS_EVENTO`; el resolutor `tipoEventoDeTransicion` lo da por id y el historial lo expone derivado al leer,
sin columna ni migración. **Lo que sigue fuera:** el análisis de tiempos por tipo (M7.3), la restricción de Decisionales a
Director o Coordinador (F1C-05), el informe en tres actos (F1E) y la validación de la tabla por Gerencia, que es tarea de
persona.
