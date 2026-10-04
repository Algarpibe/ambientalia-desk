# Informe de archivo — busqueda-ticket-serial (F1B-08)

**Tanda:** F1B-08 · **cierra:** no · **Fecha:** 2026-10-04 · **Rama:** `busqueda-ticket-serial`, nacida de `main` en
`2a74fdc`. Lleva dentro las ramas de F1B-03 (fusión `47127ff`) y de F1B-07 (fusión `33f08a5`), apiladas sin intento
abierto; las dos están ya en `main`. La fusión de esta rama a `main` la hace el orquestador cuando el analista la dé
por verificada.

## Qué parte de la fila cubre

**Cubre**, del contenido de F1B-08, el punto (1) de `decision/trabajo-del-01-10-antes-del-corte-sin-fila`: la búsqueda
del listado por número de ticket y por serial, con el serial parcial y con la misma pieza que el autocompletado de la
recepción (E-133). **Deja fuera** la otra mitad de la fila, «vistas equivalentes a Zoho», que sigue sin contenido
decidido. Por eso lleva `cierra: no`.

## Commits y medidas

Las medidas son `git diff --shortstat --no-renames` entre commits, y coinciden con el registro de intentos.

| Fase | Commit | Medida |
|---|---|---|
| Planificación | `9bf0fbf` | artefactos del cambio, fuera de intento |
| Lote 1 · núcleo | `4bc8196` | 568 |
| Apilado de F1B-07 | `33f08a5` | fusión, fuera de intento |
| Lote 2 · puertas y cliente | `09f622c` más `33c27cc` | 491 |
| Verify, prueba de huecos y remediación de W1 y W2 | `69d94b6` más `a55326b` | 293 |
| Archive, parte revisable | este commit | la del registro |
| Archive, mudanza de la carpeta | el commit siguiente | sólo renombrados, sin carga de revisión |

## Qué cambió

- **Servidor:** `GET /api/tickets` (activos, cerrados y `scope=all`) y `GET /api/mis-tickets` aceptan `q`. El texto se
  recorta; si son dígitos, con o sin «#», busca el ticket de ese número exacto, y siempre busca el texto como trozo del
  serial, sin distinguir mayúsculas, en la copia del ticket y en el equipo enlazado. En cerrados, el total y las
  páginas cuentan lo filtrado. Más de 64 caracteres o un `q` repetido responden `422`; sin sesión, `401` antes.
- **Una sola pieza para el patrón del serial**, en `packages/shared`: la consumen la búsqueda de tickets y el
  autocompletado de la recepción, que pasa a recortar los espacios de los lados.
- **Cliente:** una caja de búsqueda en la cabecera del listado, que envía el texto tal cual tras una espera corta y
  vuelve a la primera página. No se enseña en «Remisión creada», y el texto se vacía al entrar en esa vista.
- **Sin esquema, sin índices y sin variables de entorno.**
- Los siete ficheros muy citados se editaron en su sitio, con inserciones iguales a borrados: no se desplazó ninguna
  línea.

## Pruebas, mutaciones y verificación

- Suite al archivar: 3.162 pruebas pasan y 2 omitidas. Typecheck limpio. Lint: 165 avisos y 0 errores. Detector de
  citas con salida 0. Los cuatro códigos vistos por el orquestador antes de asentar cada intento.
- Mutaciones reproducidas por el orquestador: en el lote 1, MP-1, MC-1 a MC-4, MC-6 a MC-8 y una extra; en el lote 2,
  MP-2 en las dos rutas, MC-9 y dos extra (el total de cerrados sin filtro y «Mis tickets» sin filtro). Todas caen.
  «Poner el predicado antes del filtro de estado» es un mutante equivalente, declarado en el diseño.
- Veredicto del verify: **PASS con avisos**, sin hallazgos críticos, 3 requisitos y 30 escenarios.
  - **W1, cerrado:** el supuesto S-7 no estaba en el delta. RQ-VT-13 lo dice ya, y la fusión lo lleva a la spec viva.
  - **W2, cerrado en código, sin prueba automática:** al volver de «Remisión creada» quedaba un texto de búsqueda que
    la caja no mostraba. El efecto de página vacía ahora el texto al entrar en esa vista. Es `.tsx`: queda para la
    comprobación de persona.
  - **W3, sin acción:** la rama no desciende de la cabeza de `main`; la diferencia de `openspec/config.yaml` es ajena.
  - **Mutante superviviente del verificador:** filtrar los equipos activos en la subconsulta no ponía nada rojo. Lo
    cierra la cuarta prueba de `apps/desk/server/busquedaTicketsHuecos.test.ts`.

## Regla invariable 13

Nueve decisiones del cliente, enumeradas en `apply-progress.md` y releídas en el `verify-report.md`, cada una con la
línea del servidor que la impone. El cliente no recorta, no normaliza y no filtra lo recibido; el `maxLength` de la caja
es comodidad con la imposición probada (`422`). Ninguna decisión queda sólo en el cliente.

## Fusión de los deltas y barrido de citas

- Fusión por script: tres bloques ADDED (RQ-VT-11, RQ-VT-12 y RQ-VT-13) al final de `vistas-tablero`, idénticos a los
  del delta. Sin bloques MODIFIED: no se desplaza ninguna cita a specs vivas.
- Citas a código: los ficheros editados no cambiaron de tamaño. El barrido del lote 2 clasificó las que afirmaban lo
  que cambió (caso B: las que decían que el listado no tenía búsqueda y que el autocompletado no recortaba; caso C: una
  del lote 1). Son registros fechados y no se editan.
- Una cita del propio delta a `tickets-core` quedó desplazada al apilar F1B-07 y se ancló a `2a74fdc` en `33c27cc`.

## Lo que este cambio añade al paquete de despliegue

- **Esquema y variables:** nada.
- **Dato a pedir a quien despliegue:** el recuento de `desk.tickets` y de `desk.equipos`, para confirmar la hipótesis
  de tamaño del `LIKE` sin índice.

## Pendiente de personas — archivar NO lo da por hecho

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Los cuatro escenarios manuales de RQ-VT-13 en la aplicación, más el paso por «Remisión creada» y el autocompletado de la recepción | QA o quien despliegue | `tasks.md` de este cambio, sección de personas |
| Recuento de tamaño en producción | quien despliegue | `tasks.md` y `design.md` §12 |
| Respuestas a los supuestos del cambio | Gerencia | E-195 a E-199 de `docs/sdd/ENTRADA.md` |
| Alcance del hallazgo de la gestión de equipos | quien decida el alcance | E-200 |
| Verificación de la rama y fusión a `main` | el analista y el orquestador | este informe |

## Incidencias de método

- El detector de citas salió con 1 dos veces antes de asentar, y las dos se repararon antes del asiento: tres citas
  tras el lote 2 (dos rutas incompletas y la del delta desplazada) y seis en el informe de verificación (rutas
  incompletas y una línea mal contada).
- El estado nativo no llega a «archive listo» con la revisión por recibos apagada; se archiva con el verify en PASS y
  asentado, como en F1B-03 y F1B-07.

## Regla del archivo

El archive va en **dos intentos y dos commits**: la parte con carga de revisión (fusión del delta, bandeja y este
informe), bajo 800, y la mudanza de la carpeta, que sólo renombra. Los dos commits contienen sólo este cambio.
