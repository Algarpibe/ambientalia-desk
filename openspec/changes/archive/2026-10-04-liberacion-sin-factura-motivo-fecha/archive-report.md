# Informe de archivo — liberacion-sin-factura-motivo-fecha (F1C-05)

**Tanda:** F1C-05 · **cierra:** no · **Fecha:** 2026-10-04 · **Rama:** `liberacion-sin-factura-motivo-fecha`, nacida de
`main` en `2a74fdc`. Lleva dentro la rama de F1B-07 (fusión `8c182fb`, hecha sin intento abierto), que a su vez lleva
la de F1B-03; las dos están ya en `main`. La fusión de esta rama a `main` la hace el orquestador cuando el analista la
dé por verificada.

## Qué parte de la fila cubre

**Cubre** la parte de paridad de F1C-05: la transición «Liberación sin factura» deja de pedir una casilla y pide
motivo, fecha prevista de facturación y, con la autorización excepcional, su texto. **Deja fuera** lo que la fila
conserva para después del corte: los Decisionales y el propietario del registro. La alarma por fecha vencida y el estado
«Pendiente de facturar» son de F1C-02. Por eso lleva `cierra: no`.

## Commits y medidas

Las medidas son `git diff --shortstat --no-renames` entre commits, y coinciden con el registro de intentos.

| Fase | Commit | Medida |
|---|---|---|
| Planificación | `ce4fead` | artefactos del cambio, fuera de intento |
| Apilado de F1B-07 | `8c182fb` | fusión, fuera de intento |
| Lote 1 · columnas, guarda sin cablear y guardianes | `0f3cafc` | 433 |
| Lote 2 · el cambio | `ffc3bea` más `7c43479` | 468 |
| Verify y pruebas de lo que faltaba | `d044c35` | 411 |
| Archive, parte revisable | este commit | la del registro |
| Archive, mudanza de la carpeta | el commit siguiente | sólo renombrados, sin carga de revisión |

## Qué cambió

- **Catálogo:** la transición declara tres campos (motivo de una lista cerrada de tres, fecha prevista y texto de la
  autorización) y ninguna casilla. Sólo cambia una línea del catálogo.
- **Servidor:** una guarda de contenido, pura y en `packages/shared`, rechaza con `422` un motivo fuera de la lista, una
  fecha que no sea un día real y el tercer motivo sin texto. Va detrás del `409` de estado y de los `403` de área y de
  cargo, y dentro del `422` la presencia va delante.
- **Datos:** dos columnas nuevas en `tickets`, `liberacion_motivo` y `fecha_prevista_facturacion`, anulables y sin
  relleno, que el sincronizador no escribe. El texto se guarda como campo libre y se escribe en cada liberación, con
  valor o vacío, para que una segunda no herede el de la primera. La traza guarda los tres valores de cada liberación.
- **Cliente:** el panel pide los tres campos de nuevo en cada liberación, sin prellenar; la ficha enseña motivo y fecha.
- **Reentrancia:** los campos de fecha que una segunda pasada reescribe pasan de diez a once.
- Las liberaciones anteriores conservan su casilla; las nuevas no la marcan.

## Pruebas, mutaciones y verificación

- Suite al archivar: 3.158 pruebas pasan y 2 omitidas. Typecheck limpio. Lint: 165 avisos y 0 errores. Detector de
  citas con salida 0. Los cuatro códigos vistos por el orquestador antes de asentar cada intento.
- Mutaciones reproducidas por el orquestador: en el lote 1, M5 (fichero vigilado), M6, las cinco de M9, M10 y una extra;
  en el lote 2, M1, M2 y M4 (posición), M7a, M7b, M8 y tres extra; en el verify, M3 con la receta del diseño y la del
  tipo de la columna de fecha. Todas caen.
- Veredicto del verify: **PASS con avisos**, sin hallazgos críticos, 5 requisitos y 45 escenarios.
  - **W1, cerrado:** el lote 2 declaró que la prueba de posición PL-3 no existía porque la transición no deriva. Era
    falso: el catálogo añade la derivación a toda transición. El verify la escribió y corrigió las dos frases. El
    diagnóstico del asiento del lote 2 en el registro conserva la frase falsa; lo corrige el del verify.
  - **W2, abierto:** la mezcla de campos libres sólo se prueba a través de una emulación del arnés (E-206).
  - **W3, cerrado:** el tipo de la columna de fecha y «aplicar el esquema no toca filas» no tenían prueba; la tienen.
  - **La ficha:** el verify siguió el dato de extremo a extremo y confirmó que enseña motivo y fecha, con prueba propia.

## Regla invariable 13

Siete decisiones del cliente, enumeradas en `apply-progress.md` y releídas en el `verify-report.md`, cada una con la
línea del servidor que la impone. No prellenar al volver a liberar no necesita contrapartida: el servidor lee sólo lo
que llega y reescribe el texto. Ninguna decisión queda sólo en el cliente.

## Fusión de los deltas y barrido de citas

- Fusión por script, cinco bloques idénticos a los de los deltas: RQ-TS-35 añadido al final de `transitions-st`, y
  RQ-TS-06, RQ-TS-08, RQ-TS-09 y RQ-PM-18 sustituidos en su sitio. `transitions-st` pasa de 2.089 a 2.431 líneas;
  `permissions`, de 624 a 633.
- **Citas con la línea distinta tras la fusión: 124**, en 70 ficheros, sin excluir `archive/`.
  - **28 ancladas** al commit que escribió la frase, porque seguían ciertas justo antes de la fusión (caso B).
  - **13 ya llevaban ancla.** No se tocan.
  - **79 ya estaban rotas antes** de este cambio: la spec citada no decía ya lo que decía cuando se escribieron. No se
    tocan; se suman a las rotas de antes (E-183).
  - **4 sin forma anclable.** No se tocan.
- **Ediciones en sitio en specs vivas, cuatro, sin mover líneas:** el título de `transitions-st` §3.3 y dos frases de
  `trazas` pasan de diez a once campos reentrantes; y la frase de `transitions-st` que cita la casilla del catálogo
  queda anclada a `2a74fdc`. Las tareas hablaban de once ediciones, enumeradas en un informe que no está en el
  repositorio; el orquestador buscó por contenido y encontró ocho frases. Las otras cuatro son escenarios de requisitos
  fechados a la revisión de otro cambio (caso B) y no se editan.
- El arnés de pruebas ganó un bloque al final y cambió una línea en su sitio: no desplaza ninguna cita.

## Lo que este cambio añade al paquete de despliegue

- **Esquema**, lo aplica la migración al arrancar: `liberacion_motivo` y `fecha_prevista_facturacion` en `tickets`, sin
  calificar, al final de `schema.sql`. **Variables de entorno:** ninguna.
- **Aviso:** las liberaciones nuevas no marcan `liberacion_sin_facturar` (E-203).
- **Corrección del maestro:** la 25 de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (M1.3.5 y Anexo D nº 33).

## Pendiente de personas — archivar NO lo da por hecho

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Cinco comprobaciones en la aplicación tras el despliegue (los tres motivos, el texto obligatorio, la segunda liberación sin herencia, la ficha y el historial, y que exista el cargo Director Comercial) | Gerencia o quien opere la aplicación | `tasks.md` de este cambio, sección §P |
| Respuestas a los supuestos del cambio | Gerencia | E-201 a E-205 de `docs/sdd/ENTRADA.md` |
| Segunda liberación sin texto contra una base real | la sesión de supervisión | E-206 |
| Verificación de la rama y fusión a `main` | el analista y el orquestador | este informe |

## Incidencias de método

- El detector de citas salió con 1 tras el lote 2: el arnés había ganado líneas en medio y desplazó cuatro citas. El
  bloque se movió al final en `7c43479`, antes de asentar.
- El estado nativo no llega a «archive listo» con la revisión por recibos apagada; se archiva con el verify en PASS y
  asentado.

## Regla del archivo

El archive va en **dos intentos y dos commits**: la parte con carga de revisión (fusión de deltas, anclas, ediciones en
sitio, bandeja, corrección del maestro y este informe), bajo 800, y la mudanza de la carpeta, que sólo renombra. Los dos
commits contienen sólo este cambio.
