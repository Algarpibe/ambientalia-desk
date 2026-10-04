# Informe de archivo — propagar-top5-lista-remision-creada (F1B-07)

**Tanda:** F1B-07 · **cierra:** no · **Fecha:** 2026-10-04 · **Rama:** `propagar-top5-lista-remision-creada`, nacida de
`main` en `2a74fdc`. Lleva dentro la rama de F1B-03 (fusión `989bd4e`, hecha sin intento abierto), que ya está en `main`.
La fusión de esta rama a `main` la hace el orquestador cuando el analista la dé por verificada.

## Qué parte de la fila cubre

**Cubre**, del contenido ampliado de F1B-07, los puntos (3) y (4) de `decision/cola-del-taller-los-tres-cabos`: propagar
el Top 5 a los tickets abiertos con traza y revertirlo al desmarcar, sin tocar los ajustes manuales; y la lista de
«Remisión creada» ordenada por la entrada al estado. **Deja fuera** la pregunta 3.b de
`docs/sdd/Preguntas_Gerencia_2026-09-29.md` (calificación del cliente sin contrato ni Top 5 y quién ajusta a mano fuera
de los Top 5), que mantiene la fila abierta. Por eso lleva `cierra: no`.

## Commits y medidas

Las medidas son `git diff --shortstat --no-renames` entre commits, y coinciden con el registro de intentos.

| Fase | Commit | Medida |
|---|---|---|
| Planificación | `27379a0` | artefactos del cambio, fuera de intento |
| L1 · marca por fila de la prioridad | `081e78e` | 248 |
| L2a · propagación y reversión | `9c4498f` más `98e97f6` | 578 |
| L2a-bis y L2b · atomicidad, lecturas y traza al nacer | `74aadd5` | 455 |
| L3 · lista de «Remisión creada» y cierre documental | `021f363` más `49582af` | 480 |
| Casillas fuera del recuento | `65a7595` | 12, fuera de intento |
| Verify y prueba del escenario que faltaba | `a29efe8` | 296 |
| Sobre del informe de verify | `f593515` | 16 |
| Archive, parte revisable | este commit | 764 (742 insertadas, 22 borradas) |
| Archive, mudanza de la carpeta | el commit siguiente | sólo renombrados, sin carga de revisión |

## Qué cambió

- **Sincronizador:** una marca por fila, `prioridad_en_app_at`; con ella puesta `upsertTicket` no sobrescribe la prioridad.
- **Propagación:** fijar o cambiar el Top 5 de un cliente cambia la prioridad de sus tickets abiertos, con una fila de
  traza por ticket (origen `top5`); desmarcarlo los devuelve a la calculada (origen `top5_revertido`). Todo en una
  transacción. Un ticket con ajuste manual no se toca.
- **Alta bajo Top 5:** el ticket guarda como base la prioridad pedida, para poder volver a ella.
- **Lista de «Remisión creada»:** ruta propia, ordenada en el servidor por la última entrada al estado, la misma que
  mide la alarma de SLA; sin entrada registrada, al final. Vista nueva en el tablero.
- **Esquema:** tres sentencias al final de `schema.sql`, sin relleno.
- La propagación no toca `modified_time`, `managed_by_app`, las transiciones ni el SLA.

## Pruebas, mutaciones y verificación

- Suite al archivar: 3.102 pruebas pasan y 2 omitidas. Typecheck limpio. Lint: 165 avisos y 0 errores. Detector de
  citas con salida 0. Los cuatro códigos vistos por el orquestador antes de asentar cada intento.
- Mutaciones: las de cada lote constan en `apply-progress.md`. En el verify el verificador reprodujo siete y el
  orquestador tres más; todas caen. La de posición del orden de la lista tiene un mutante equivalente, declarado.
- Veredicto del verify: **PASS con avisos**, sin hallazgos críticos, 11 requisitos y 118 escenarios.
  - **W-1, abierto:** la atomicidad se prueba por secuencia y no por efecto sobre filas, porque `pg-mem` no revierte.
    Donde volvería a verse es la aceptación con servicios reales.
  - **W-2, cerrado:** la diferencia de 37 pruebas frente al dato de partida es la tanda F1B-03 apilada.
  - **W-3, cerrado en este commit:** la fila IV-11 de `CLAUDE.md` dice ya que la misma zona protege la prioridad.
  - **S-1 del verify:** va a la bandeja como E-194. **S-3:** remediado con una prueba al final de su fichero.

## Regla invariable 13

Siete decisiones del cliente, enumeradas en el `verify-report.md` con la línea del servidor que impone cada una. La
lista es una vista: no concede ni quita permiso, y el cliente no reordena ni filtra lo que recibe.

## Fusión de los deltas y barrido de citas

- Fusión por script, bloque a bloque, con los once bloques vivos idénticos a los de los deltas. Seis ADDED al final
  de su spec (RQ-TC-35 a 39 y RQ-VT-10) y cinco MODIFIED sustituidos en su sitio (RQ-TC-24, RQ-TC-27, RQ-TC-29,
  RQ-VT-03 y RQ-ZS-01). `tickets-core` pasa de 1.644 a 1.994 líneas; `vistas-tablero`, de 368 a 482; `zoho-sync`, de
  723 a 810.
- **Citas desplazadas por los MODIFIED: 27**, en 16 ficheros. Método: para cada cita completa a una de las tres specs,
  sin excluir `archive/`, se compara la línea citada antes y después de la fusión, en los dos extremos.
  - **10 ancladas** al commit que escribió la frase, porque seguían ciertas justo antes de la fusión (caso B).
  - **3 ya llevaban ancla.** No se tocan.
  - **8 ya estaban rotas antes** de este cambio: la spec citada no dice hoy lo que decía cuando se escribieron. Están en
    los cambios archivados `vista-todos-y-estados-en-espera`, `por-entregar-es-espera` y `edicion-comercial-equipo`. No
    se tocan: se suman a las rotas de antes (E-183).
  - **5 sin forma anclable** (prosa sin comillas o con otra cita pegada), en la bandeja, `openspec/config.yaml` y tres
    cambios archivados. Apuntaban ya a una línea vacía antes de este cambio. No se tocan.
  - La suma da 26: una de las 27 es la misma cita repetida en su línea.
- Las citas a código clasificadas en `apply-progress.md` (6 A, 7 B y 4 C, más las de `Top5Panel.tsx`) no cambian: son
  registros fechados y los ficheros muy citados no cambiaron de tamaño.
- Una cita del paquete de despliegue del 2026-10-01 a un rango de `routes/prioridad.ts` ya no abarca la función entera
  (caso B, registro fechado; no se edita).

## Lo que este cambio añade al paquete de despliegue

- **Esquema**, lo aplica la migración al arrancar: `prioridad_en_app_at` en `tickets`; `origen` en
  `public.prioridad_ajustes`; y `a` deja de ser obligatoria en esa tabla. **Variables de entorno:** ninguna.
- **Condición:** los Top 5 marcados antes del despliegue no se propagan solos; se propagan al volver a guardarlos.
- **Corrección del maestro:** la 24 de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (M1.9.1).

## Pendiente de personas — archivar NO lo da por hecho

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Siete comprobaciones en la aplicación tras el despliegue (marcar, desmarcar, ajuste manual intacto, sincronizador, lista, alta bajo Top 5, no leídos) | Comercial | `tasks.md` de este cambio, sección de personas |
| Respuestas a los supuestos del cambio | Gerencia | E-188 a E-193 de `docs/sdd/ENTRADA.md` |
| Verificación de la rama y fusión a `main` | el analista y el orquestador | `tasks.md` de este cambio |

## Incidencias de método

- El primer asiento del verify dejó el estado en «remediar»: al informe le faltaba el sobre de resultado que el estado
  exige como primera línea. Se añadió en `f593515`, en un intento propio de 16 líneas.
- El estado nativo no llega a «archive listo» con la revisión por recibos apagada: se queda en «verify listo». Pasó
  igual con F1B-03 (comprobado sobre su commit previo al archivo). Se archiva con el verify en PASS y asentado.

## Regla del archivo

El archive va en **dos intentos y dos commits**. El primero es la parte con carga de revisión: fusión de deltas,
anclas, bandeja, corrección del maestro, nota de IV-11 y este informe, **764 líneas**, bajo 800. El segundo es sólo la
mudanza de la carpeta. Se partió porque, juntos, medían 6.142 líneas sin detección de renombrado y el techo pedido
para el intento era 6.000. Los dos commits contienen sólo este cambio.
