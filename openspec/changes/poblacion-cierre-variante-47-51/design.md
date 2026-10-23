# Diseño: población por cierre y variante de Zoho del 47 y del 51

Tanda F1F-05 (`cierra: no`). Entradas: `proposal.md` (S-1 a S-11, ocho mutaciones) y `specs/kpis/spec.md` (SP-5, RQ-KP-11, -13,
-22, -25 modificados; RQ-KP-34 a -39 nuevos). Todas las líneas citadas se leyeron en el árbol del worktree sobre `7e01ffc2`.

## Enfoque técnico

Tres piezas, en el orden de la regla invariable 13: (1) una función pura nueva en `packages/shared` decide el día de cierre de
un ticket; (2) `calcularIndicadores` recibe ese día por un campo opcional del ticket y calcula con él la `formulaZoho` del 47 y
del 51; (3) `leerEntradasIndicadores` cambia el corte de creación a cierre sin añadir consultas. El GET y el POST heredan la
población porque los dos leen por la misma función. **Regla de colocación (mutación 4):** en los dos `indicadores.ts`, muy
citados, todo cambio es EN SU MISMA LÍNEA o va AL FINAL del fichero; ninguna línea existente se desplaza.

## Flujo de datos

    SQL 1: tickets WHERE status_type='Closed' ──► candidatos (sin anulados) + closed_time por id
    SQL 2: transiciones de esos tickets ───────► historial (sin marcador) + marcador aparte
                         │
                         ▼
    diaDeCierreDelTicket(pasos + marcador, closed_time)  [shared, S-1]
                         │
    poblacionPorCierre: corte inclusivo del periodo (S-4) ─► tickets con `diaDeCierre`; poda historial, vistos y clasificaciones
    SQL 3: encuesta (filtrada por vistos) · SQL 4: listarCierres
                         │
    GET: recortarPorFlujo ─► tablaIndicadores ─► calcularIndicadores (47/51 contra t.diaDeCierre)
    POST: cruceDeLaPeticion (conserva `...t`, cruzarExportacion.ts:27) ─► tablaIndicadores

## Decisiones

### D1 · Función pura del día de cierre, en un fichero NUEVO

| Opción | Contrapartida | Decisión |
|---|---|---|
| Fichero nuevo `packages/shared/src/diaDeCierre.ts`, exportado con una línea AL FINAL de `index.ts` (hoy acaba en `:52`; la línea nueva es la 53) | Un fichero más | **Elegida**: `index.ts` está citado por línea en una veintena de artefactos archivados (`index.ts:6`, `:17`, `:29`, `:35`, `:37`…); añadir la línea 53 no mueve ninguna |
| Añadirla a `cierreEnCifras.ts` | Cerca de lo que reutiliza | Rechazada: `cierreEnCifras.ts:45`, `:50`, `:51`, `:55` están citados; habría que ir al final igualmente y el fichero no importa el catálogo |

Firma: `diaDeCierreDelTicket(pasos: readonly { transitionId: unknown; performedAt: string; values: unknown }[], closedTime: string | null): DiaCivil | null`.
Orden S-1: (a) el mayor `performedAt` entre los pasos que NO son el marcador (`esPasoDeMigracion`, `cierreEnCifras.ts:19-21`) y
cuyo id está en `TRANSICIONES_A_FINALIZADO`; (b) si no hay, `cierreQueCuenta(closedTime, cierrePuestoPorMigracion(marcador.values))`
(`cierreEnCifras.ts:29-33`, `:24-26`), con el ÚLTIMO marcador de la lista; (c) `null`. El día sale de `diaEnZona`
(`packages/shared/src/fechasDerivadas.ts:63`), nunca de un desplazamiento escrito a mano.

**Reconocer «a Finalizado» (S-7).** `TRANSICIONES_A_FINALIZADO` es un `Set` derivado UNA vez de `CATALOGO_POR_FLUJO`
(`packages/shared/src/flujos.ts:19-22`, el «único punto que enumera todos los catálogos», `:18`) filtrando `to === 'Finalizado'`
(literal tipado con `satisfies Estado`, `estados.ts:109`). Hoy son cinco: `facturado_cierre` (`transitions.ts:242`),
`entrega_al_cliente` (`:250`), `facturar` (`:262`), `liberacion` (`:359`) y `ejecutar_soporte` (`:391`). No se usa
`transicionPorId` (`flujos.ts:74-80`) porque devuelve la PRIMERA coincidencia entre catálogos.

| Opción | Contrapartida | Decisión |
|---|---|---|
| Catálogo compartido | Una transición retirada del catálogo dejaría de reconocerse (cae a `closed_time`) | **Elegida**: fuente única (regla 13) y la sentencia de `apps/desk/server/indicadores.ts:76` no cambia (RQ-KP-36) |
| `ticket_transitions.to_status` (`schema.sql:59`; lo escribe `writeTransition` con `plan.status`, `repo.ts:315-317`) | Más simple y robusto ante ids retirados | Rechazada: exige otra columna en `:76` y un campo nuevo en `PasoDelHistorial` (`bodegaje.ts`, también citado); además el marcador de la migración lleva `to_status = 'Finalizado'` (`cierreMigracionEnCifras.test.ts:33`) y habría que excluirlo igual |

Un guardián (regla de mutación 2) enfrenta el `Set` al catálogo: cada id del conjunto tiene `to === 'Finalizado'` en TODOS los
catálogos donde aparece.

### D2 · Cómo llega el cierre a `calcularIndicadores`

Campo OPCIONAL `diaDeCierre?: DiaCivil | null` en `TicketParaIndicadores`, añadido **en la misma línea 41** de
`packages/shared/src/indicadores.ts` (`camposZoho: Record<string, unknown>; diaDeCierre?: …`). Opcional para no tocar los
constructores existentes (`tk()` de `packages/shared/src/indicadores.test.ts:14-16`, el `push` de `apps/desk/server/indicadores.ts:73`).

| Opción | Decisión |
|---|---|
| Campo del ticket | **Elegida**: viaja con el ticket por `recortarPorFlujo` (`server/indicadores.ts:114-117`) y por el cruce del POST, que hace `{ ...t }` (`cruzarExportacion.ts:27`) |
| Opción en `OpcionesIndicadores` (como `calificacionSatisfaccion`, `:48`) | Rechazada: obligaría a otro `Map` en `EntradasIndicadores` (`server/indicadores.ts:40-44`) y a tocar `tablaIndicadores` |

`MOTIVO_H1` (`:88`) deja de usarse; una constante muerta rompería `lint`. **La línea 88 pasa a ser**
`const MOTIVO_CIERRE = 'falta el hito: cierre del ticket'`. Los «sin dato» de la variante nombran el hito: «remisión de
entrada» y «finalización del servicio» salen de `NOMBRE_HITO` (`:78-84`); el del cierre, de `MOTIVO_CIERRE` (RQ-KP-37). Si
faltan los dos, manda el hito de partida (mismo orden que `naturales`, `:140`). El cierre NO entra en `hitos`: la letra no
cambia y el guardián K14 enfrenta `HITOS_POR_COLUMNA` (`:52-62`) a `INDICADORES_G6`.

### D3 · La variante del 47 y del 51, en sus mismas líneas

Función `contraCierre(calculo, desde, h, cierre): Calculo` AL FINAL del fichero (precedente: `hitoEntrega`, definida en `:257`
y usada en `:133`). Devuelve `{ ...calculo, formulaZoho }` con `diasNaturalesEntre(inicio, cierre)` (`:95`), con signo y sin
tope (S-11). Si es negativa añade `orden_invertido` a `marcas` sin duplicarla (supuesto reversible: `marcas` es una sola
lista; hoy `orden_invertido` no se serializa, `apps/desk/server/routes/indicadores.ts:11`, y la comparación no lee `marcas`).

- `:238` → `armar('47', 'dias_naturales', (h) => contraCierre(naturales('Fecha Remisión Entrada', 'Fecha Remisión de Salida', h), 'Fecha Remisión Entrada', h, t.diaDeCierre ?? null)),`
- `:241` → `armar('51', 'dias_naturales', (h) => contraCierre(v51(h), 'Fecha Finalización ST', h, t.diaDeCierre ?? null)),`

La letra sigue intacta: `naturales` (`:139-144`) y `v51` (`:228-232`). La variante del 51 no depende de la entrega.

### D4 · Población en el servidor: cuatro consultas, sólo lectura

Cambios de `apps/desk/server/indicadores.ts`, todos en su línea salvo la función nueva del final:

| Línea | Hoy | Pasa a |
|---|---|---|
| `:2` | importa `sumarDias` | quita `sumarDias` (queda sin uso) y añade `esAnulado`, `diaDeCierreDelTicket` |
| `:53-54` | «ensancha un día… sobre el día de creación» | misma prosa en dos líneas, sobre el día de cierre (RQ-KP-35) |
| `:59` | ventana `created_time >= $n` | `filtros.push("t.status_type = 'Closed'")` — literal constante, no dato del usuario |
| `:60` | ventana `created_time < $n` | `const fueraDelPeriodo = (dia: DiaCivil \| null) => …` — la MISMA expresión de hoy `:70` (S-4: sin día, fuera sólo con periodo) |
| `:64` | `SELECT … t.created_time …` | añade `t.closed_time` |
| `:65` | `const tickets…` | `const candidatos…; const clasificaciones…; const cerradoEn = new Map<string, string \| null>()` |
| `:68` | `const dia = diaEnZona(creadoEn)` | `if (esAnulado(String(r.status ?? ''))) continue` (`anulacion.ts:57`; precedente `cierreEnCifras.ts:53`) |
| `:69` | comentario | `cerradoEn.set(String(r.id), iso(r.closed_time))` |
| `:70` | corte por creación | comentario: el corte espera al historial (S-1) |
| `:73` | `tickets.push(` | `candidatos.push(` |
| `:77` | `new Set(tickets.map…)` | `new Set(candidatos.map…)` |
| `:78` | `const historial = …` | añade `; const marcadores = new Map<string, PasoDelHistorial>()` |
| `:81` | descarta el marcador | `if (!vistos.has(id)) continue; if (esPasoDeMigracion(r.transition_id)) { marcadores.set(id, {…}); continue }` — el salto SIGUE en `:81`, que es lo que afirma `migracionMarcadorLectores.test.ts:58` |
| `:84` | `}` | `} const tickets = poblacionPorCierre(candidatos, { historial, marcadores, cerradoEn, vistos, clasificaciones }, fueraDelPeriodo)` |
| EOF | — | `function poblacionPorCierre(…)`: fija `diaDeCierre` por ticket, corta y BORRA de `historial`, de `vistos` y de `clasificaciones` los que no entran. `clasificaciones` se llena en `:73` para TODO candidato, y `apps/desk/server/indicadores.test.ts:219-220` exige que sólo traiga los admitidos por el periodo |

`donde` (`:61`) pasa a ser ` WHERE t.status_type = 'Closed'` y `params` queda `[]`; las consultas del historial (`:76`) y de la
encuesta (`:85`) lo reutilizan sin cambio de texto, así que leen todos los cerrados y `vistos` podado filtra la encuesta en
`:87`. Siguen siendo cuatro: `:64`, `:76`, `:85` y `listarCierres` (`:88`). El historial que ven los indicadores sigue sin
marcador.

**La consulta de la encuesta es más amplia que la población, y se dice.** RQ-KP-22 del delta (`specs/kpis/spec.md:95`, «trae
las respuestas de esos tickets») y RQ-KP-14 vivo (`openspec/specs/kpis/spec.md:503-504`, «tickets del periodo») describen la
cuarta consulta sobre la población. Con D4, la sentencia de `:85` trae las respuestas de TODOS los cerrados (el día de cierre
sólo se conoce tras el historial) y el resultado se poda en memoria a la población con `vistos` en `:87`. Lo observable se
mantiene —sólo cuentan y sólo viajan las respuestas de esos tickets— y la spec no se toca. Lo mismo vale para el historial.

**Volumen (hipótesis).** Sin periodo en SQL se leen todos los cerrados y sus transiciones: cientos a pocos miles de filas;
crecen las filas, no las consultas (RQ-KP-14). **Prefiltro rechazado:** una ventana sobre `closed_time` perdería los cierres de
la aplicación, que nunca lo escribe (`writeTransition` sólo pone estado y `status_type`, `packages/zoho-sync/src/db/repo.ts:298`;
`status_type` es `Closed` con destino Finalizado o Anulado, `apps/desk/server/transitionExec.ts:5`, `:39`), y una sobre
`modified_time` sólo acota por abajo y descansa en otra hipótesis.

### D5 · El POST hereda la población

`routes/indicadoresComparacion.ts:33` llama a `leerEntradasIndicadores` y `:34-36` cruza sobre `entradas.tickets`; el cruce
conserva el ticket entero (`cruzarExportacion.ts:27`). Un «ID» que existe en Desk y no está en la población cae en
`fueraDelPeriodo` (`cruzarExportacion.ts:37-41`), nombre intacto (S-8). Ninguna expectativa del POST cambia de valor: sólo
cambian, en su línea, los datos sembrados (D6).

### D6 · Las pruebas existentes: se ajustan los DATOS, en su línea; las sha256 se recalculan

Toda prueba que siembra tickets para estas lecturas los inserta SIN `status_type` (`schema.sql:23` no le da valor por
defecto) y quedaría vacía. Se edita cada `INSERT` en su misma línea añadiendo `status_type = 'Closed'` y
`closed_time = created_time`; con cierre igual a creación, todo periodo de las pruebas sigue diciendo lo mismo.

| Fichero | Líneas | Ajuste |
|---|---|---|
| `routes/indicadores.test.ts` | `:22`, `:77`, `:105`, `:114`, `:143`, `:154`, `:218`, `:227`, `:251` | `INSERT` con `status_type`/`closed_time` |
| `routes/indicadoresComparacion.test.ts` | `:37`, `:127`, `:315`, `:319` (el `UPDATE` mueve también `closed_time`), `:335` | ídem |
| `server/indicadores.test.ts` | `:14`, `:191` | ídem en los dos ayudantes |
| `server/indicadores.test.ts` | `:61`, `:63` | pasa a ser la prueba de S-4: `closed_time = NULL` además de `created_time` |
| `server/indicadores.test.ts` | `:216-220` | expectativa SIN cambio (`'viejo'` fuera de `clasificaciones`), pero sólo se cumple con la poda de `clasificaciones` de D4: no basta con los datos de `:191` |
| `server/indicadores.test.ts` | `:150`, `:161` | título «mismo WHERE y mismos parámetros»; `length` 2 → 0 (ya no hay ventana ligada) |
| `migracionMarcadorLectores.test.ts` | `:55` | antepone en la misma línea `UPDATE tickets SET status_type = 'Closed'` (el `beforeEach` de `:35` es `Open` y lo usan otros lectores) |
| `packages/shared/src/indicadores.test.ts` | `:75`, `:77`, `:306-307`, `:332`, `:401` | el motivo esperado pasa a `falta el hito: cierre del ticket`, con título en su línea (`decision/e224c-formulas-47-51-y-contraste`) |

`cierreMigracionEnCifras.test.ts:100-106` no cambia: su ticket es `Closed` y sin periodo entra (S-4).

**Las tres sha256** (`routes/indicadores.test.ts:263`, `:271`; `routes/indicadoresComparacion.test.ts:326`): tras ajustar los
datos se ejecutan; si fallan, el hash nuevo se copia a mano del «received» de vitest y el commit nombra
`decision/e224b-poblacion-indicadores`. **Previsión: los bytes NO cambian** —misma población; el 47 y el 51 de esos fixtures
no tienen hitos y su `formulaZoho` sin dato se serializa `null` igual que hoy (`routes/indicadores.ts:20`, `:34`)—. El delta
lo prevé (`specs/kpis/spec.md:325-326`): si el cuerpo no cambia byte a byte, el hash se conserva y el informe lo dice.

### D7 · Fixture de septiembre y aceptación

- **Fixture:** `apps/desk/server/testing/septiembre2026.ts` (nuevo; `testing/` ya aloja ayudantes, p. ej. `exportacionZoho.ts`).
  Exporta `TICKETS_SEPTIEMBRE` (13 objetos) y `sembrarSeptiembre(db)`. Ids sintéticos `sep-01`…`sep-13`, nunca de Zoho.
- **Campos (lista cerrada, S-10):** `numero`, `clasificacion`, `estado`, `creado`, `cerrado`, `remisionEntrada`,
  `remisionSalida`, `revisionInforme`, `cotizacion`, `ordenCompra` (de `cf_fecha_orden_de_compra`, no la `_final`),
  `ordenVenta` (de `cf_fecha_orden_de_venta`, no la de actualización), `recepcionRepuestos`, `finalizacionSt`, `diasEntrega`
  (`cf_dias_de_entrega`, = columna 52) y `gerencia` con `47`, `49`, `50_53`, `51`, `52`, `53`, `54`, `57`, `58`, `59`.
  **Fuera:** contacto, asunto, `cf_tipo_de_servicio`, `cf_codigo_servicio`, `cf_serial`, ingreso, factura, servicio externo,
  valoración y 55.
- **Siembra:** `created_time = creado + 'T17:00:00Z'` y `closed_time = cerrado + 'T17:00:00Z'` (mediodía de Bogotá),
  `status_type = 'Closed'`, `fecha_creacion_ticket = creado` (hito del 49), y cada fecha en su columna de `COLUMNA_DE_HITO`
  (`server/indicadores.ts:12-18`). Sin transiciones: el cierre sale por S-1 (b).
- **Comprobado a mano contra el CSV** (sólo leído en el checkout principal; no se copia): 47 de 932 = 144, de 939 = 119; 49 de
  932 = 11, de 973 = 12; 50·53 de 939 = 50, de 970 = 101; 51 de 979 = 10; 57 de 939 = −9; 58 de 970 = −118; 59 de 972 = −10;
  54 de 980 = `Cumple`. Todas exactas. En las 13 filas la 50 y la 53 de Gerencia coinciden. Recuentos de celdas con valor: 47
  → 11, 49 → 9, 50·53 → 11, 51 → 12, 54 → 9, 57 → 9, 58 → 9, 59 → 9. Creados en septiembre: sólo el 998.
- **Aceptación:** `apps/desk/server/routes/indicadoresSeptiembre.test.ts` (nuevo), con el arnés pg-mem (`instalarArnes`,
  `appWith`, `adminCookie`, `testing/appHarness.ts:34-39`), pide `GET /api/indicadores?desde=2026-09-01&hasta=2026-09-30`:
  (1) trece tickets; (2) en el fixture, el único creado en septiembre es el 998 (deja escrita la mutación 1); (3) un `it.each`
  POR INDICADOR que compara `formulaZoho` con la celda de Gerencia, ±1 en números e igualdad de texto en el 54, sólo donde la
  celda tiene valor, y afirma el recuento esperado de celdas comparadas; (4) toda clave del fixture está en la lista de S-10.
  Que el CSV no esté copiado lo revisa verify a mano: una prueba que buscara el fichero se pondría roja en el checkout principal,
  donde existe sin trackear.

### D8 · Mutaciones

| # | Edición que la reproduce | Debe ponerse rojo |
|---|---|---|
| 1 | En `poblacionPorCierre`, cortar por `diaEnZona(t.creadoEn)` | RQ-KP-35 «cierre en el periodo, creación fuera»; aceptación (13) |
| 2 | Quitar el `continue` de `esAnulado` (`:68`) | RQ-KP-35 «un anulado no entra» |
| 3 | No empujar el filtro de `:59` | RQ-KP-35 «un abierto no entra» (abierto con `closed_time` dentro) |
| 4 | En `diaDeCierreDelTicket`, pasar `null` como cierre de la migración | RQ-KP-34 «el cierre de la migración no cuenta»; RQ-KP-35 «migrado» |
| 5 | En `:238`/`:241`, pasar como cierre la remisión de salida / la entrega | RQ-KP-37 «el 47 no usa la salida», «el 51 no usa la entrega» |
| 6 | `recortarPorFlujo` (`:114-117`) devuelve siempre `e`; y `fl.flujo` → `null` en `indicadoresComparacion.ts:34` | RQ-KP-35 «el flujo se compone», GET y POST |
| 7 | (regla 2) Ensuciar el FIXTURE: una celda de Gerencia +2 por indicador, ocho ediciones sueltas | la fila de ese indicador del `it.each` |
| 8 | (regla 1) Evaluar `closed_time` ANTES que la transición | RQ-KP-34 «la transición manda», que activa las dos fuentes a la vez con días distintos |

### D9 · Lotes de apply (techo 720 medidas por intento, `apply-progress` incluido)

| Lote | Contenido | Estimación (×1,8) |
|---|---|---|
| L1 · shared | `diaDeCierre.ts` + su prueba + guardián; `index.ts:53` (línea nueva); `indicadores.ts` `:41`, `:88`, `:238`, `:241` + EOF; pruebas de RQ-KP-37 al final de `indicadores.test.ts` y sus líneas en sitio | ~215 → ~390, + progreso ~90 = **~480** |
| L2 · servidor | `server/indicadores.ts` (D4); prueba nueva `apps/desk/server/poblacionPorCierre.test.ts` (RQ-KP-35, -36); ajustes de D6; sha256 | ~245 → ~440, + ~90 = **~530** |
| L3 · aceptación | fixture + `indicadoresSeptiembre.test.ts` + barrido de citas | ~175 → ~315, + ~90 = **~405** |

## Cambios de ficheros

| Fichero | Acción |
|---|---|
| `packages/shared/src/diaDeCierre.ts` (+ `.test.ts`) | Crear |
| `packages/shared/src/index.ts` | Hoy acaba en `:52`; la línea nueva es la 53 |
| `packages/shared/src/indicadores.ts` | `:41`, `:88`, `:238`, `:241` en sitio; `contraCierre` al final |
| `apps/desk/server/indicadores.ts` | D4 en sitio; `poblacionPorCierre` al final |
| `apps/desk/server/testing/septiembre2026.ts`, `routes/indicadoresSeptiembre.test.ts`, `poblacionPorCierre.test.ts` | Crear |
| Pruebas de D6 | Datos en su línea |

No se toca `apps/desk/src`: el cliente no toma ninguna decisión nueva (regla de mutación 3, casilla marcada: cero decisiones).

## Barrido de citas (cierre de L3)

`:70` de `apps/desk/server/indicadores.ts` deja de ser el corte: `openspec/specs/kpis/spec.md:1447` lo cita (caso A, se reapunta
a `:60` en el archivo). `openspec/config.yaml:4096` cita `MOTIVO_H1` en `:88`, y `:5199-5200` citan `:59` y `:67` (caso B: se
nombra la revisión `7e01ffc2`). Quién edita `config.yaml` lo decide la fase de tareas. `DEPLOY.md:615` (`:85`) y
`migracionMarcadorLectores.test.ts:54`, `:58` (`:76`, `:81`, shared `:134`) siguen ciertas.

## Matriz de amenazas

N/A — sin enrutamiento, shell, subprocesos, automatización de VCS/PR, clasificación de ejecutables ni integración de procesos.

## Migración

Ninguna: sólo lectura, sin escritura en la base (S-2).

## Preguntas abiertas

1. **Resuelta por la letra del delta.** RQ-KP-39 (`specs/kpis/spec.md:325-326`) dice que «el hash se recalcula sobre el
   cuerpo nuevo; si el cuerpo no cambia byte a byte, el hash se conserva y el informe lo dice». La previsión de D6 (bytes
   iguales) cabe en ella: apply recalcula, y `apply-progress` y el informe de verify dejan escrito si el hash cambió.
2. `orden_invertido` de la variante comparte `marcas` con la letra (D3). Reversible; no sale en la respuesta.
