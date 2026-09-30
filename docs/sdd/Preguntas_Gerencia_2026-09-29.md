# Preguntas para Gerencia que bloquean tandas

**Fecha:** 2026-09-29 · **Propósito:** reunir en un solo documento las decisiones de Gerencia sin las cuales cuatro filas del plan (F1B-05, F1B-07, F1B-08 y F1B-11) no pueden construirse ni cerrarse, y las demás preguntas abiertas que bloquean filas.

Fuentes leídas en disco: `docs/sdd/ENTRADA.md`, `openspec/config.yaml` (`decisiones_de_gerencia`), el catálogo del plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` §5, que la R01.3 hereda según `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:212`), el orden por semanas de la R01.2 y el maestro citable `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md` (abreviado `R08.2.md`). Un ítem del §3.2 del maestro está marcado `[EN REVISIÓN — R08]` (`R08.2.md:2948-2949`): se cita como procedencia, no como alcance acordado.

| # | Pregunta | Fila | Estado en disco |
|---|---|---|---|
| 1 | Año y tope de la ampliación de contrato | F1B-11 | Abierta (E-086) |
| 2 | Qué estados ve cada área | F1B-05 | Abierta, y el código decidió lo contrario del maestro |
| 3 | De dónde sale la calificación del cliente y cuántos niveles | F1B-07 | Abierta. La lista Top 5 y quién la mantiene **ya está respondida** |
| 4 | Qué significa «vistas equivalentes a Zoho» | F1B-08 | Abierta. La política de escritura **ya está respondida** |

---

## 1 · E-086 — Año y tope de la ampliación de contrato (F1B-11)

**Qué decide.** En «ampliación del contrato» dentro del mismo año (`decision/vigencia-contrato`, respuesta en `openspec/config.yaml:1610-1612`): qué año cuenta y hasta qué fecha puede llevarse la nueva fecha de fin. Hoy «año natural» es una interpretación de la supervisión, no algo dicho (`openspec/config.yaml:1614-1616`). La respuesta también fija cuándo una subOV libre de un contrato vencido deja de poder consumirse del todo (`docs/sdd/ENTRADA.md:1224`).

**A quién corresponde.** Gerencia (`docs/sdd/ENTRADA.md:1228`).

**Qué desbloquea.** La ampliación del contrato, que es lo único que le falta a F1B-11 para cerrarse: sus tres cambios están archivados y el tercero la dejó fuera a propósito (`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:15-23`). Mientras no haya respuesta rige la regla estricta: la guarda de contrato vencido impide asociar cualquier subOV de su lote (`packages/shared/src/contratos.ts:51-58`).

**Opciones y su consecuencia** (las tres lecturas que nombra `docs/sdd/ENTRADA.md:1223`):

| Lectura del «año» | Consecuencia |
|---|---|
| Año natural del vencimiento | Un contrato que vence dentro del año puede ampliarse, como tope, hasta el 31/12 de ese año. Es la lectura que hoy se da por supuesta (`openspec/config.yaml:1615-1616`) |
| Año de la fecha de inicio | Un contrato que empieza a mitad de año y vence al año siguiente quedaría sin ampliación posible, porque su fin ya cae fuera del año de inicio |
| Año de la fecha de fin | Coincide con la primera si «natural» se refiere al año del vencimiento; difiere si se refiere al año en que se pide la ampliación |

Y aparte del año: **cuál es el tope de la nueva fecha de fin** (¿el 31/12 de ese año, u otra fecha?). La respuesta textual no lo fija (`docs/sdd/ENTRADA.md:1223`). El registro de contrato ya avisa a Comercial para «proponer la ampliación» cuando el ritmo no alcanza (`openspec/config.yaml:2457`), así que el aviso existe y la acción que propone todavía no.

**Referencia.** `docs/sdd/ENTRADA.md:1222-1228` · `openspec/config.yaml:1605-1626` (`decision/vigencia-contrato`) · `openspec/config.yaml:2453` (`decision/anexo-53-contratos`, «ampliable dentro del mismo año»).

---

## 2 · F1B-05 — Qué estados ve cada área

**Qué decide.** Si la visibilidad de tickets y estados se segmenta por área y, si se segmenta, qué estados ve cada una. Hay dos textos que dicen cosas opuestas:

- El maestro lo da por decidido: «Cada usuario ve solo los estados y transiciones de su rol» (`R08.2.md:1693`, M1.9.1 `[DECIDIDO]`). La fila del plan lo recoge como «permisos y vistas por rol (área)» con gate «Ninguno» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:160`); su procedencia es el ítem 5 del §3.2 (`R08.2.md:2988-2989`), que está en revisión.
- El código decidió lo contrario, por escrito y razonado: «Todo el staff con sesión puede ver y editar todos los tickets […] No hay propiedad por-ticket ni segmentación por área en la visibilidad. Es deliberado» (`docs/modelo-autorizacion.md:14`, desarrollado en `:29`), y el tablero lo repite (`apps/desk/src/lib/boardView.ts:33-36`). Las **transiciones** sí se filtran por área (`apps/desk/src/components/TransitionPanel.tsx:56-58`, con `packages/shared/src/permissions.ts:4`). La spec viva lo deja como «Punto a resolver por Gerencia, no por una tanda» (`openspec/specs/permissions/spec.md:253-265` en `53dd0ed`).

**A quién corresponde.** Gerencia (`openspec/specs/permissions/spec.md:265` en `53dd0ed`).

**Qué desbloquea.** La mitad de visibilidad de F1B-05 (S42 en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:125`). Sin respuesta, F1B-05 puede construir el resto de su contenido pero no cerrarse.

**Opciones y su consecuencia.**

| Opción | Consecuencia |
|---|---|
| **(a) Mantener lo construido:** todos ven todos los tickets; sólo se filtran las transiciones | F1B-05 no construye segmentación. La frase del maestro de `R08.2.md:1693` pasa a ser corrección para el expediente R08.x (el maestro no se edita desde el repositorio). Coherente con `decision/c10-permisos-cargo`: «La base sigue siendo el área, como hoy» (`openspec/config.yaml:1932`), que habla de ejecutar, no de ver |
| **(b) Vista por área, sin restricción:** cada área abre por defecto un filtro con «sus» estados, pero puede ver el resto | Es un filtro de vista en el cliente, como el que ya existe (`openspec/specs/permissions/spec.md:267-271` en `53dd0ed`), y no contradice `docs/modelo-autorizacion.md:14`. Exige la lista de estados por área, que hoy no existe en ningún fichero |
| **(c) Segmentación real en el servidor** | Revierte `docs/modelo-autorizacion.md:14`. Exige la misma lista de estados por área y, además, una guarda en el servidor (regla invariable 13). Es la lectura literal de `R08.2.md:1693` |

Para (b) y (c) hace falta **la matriz estado × área**. Una fuente posible, sin inventarla, es lo que Zoho Desk hace hoy: «Agentes, Roles y Perfiles, contra el modelo de permisos de Desk 2.0» está en la lista de lo que el inventario de configuración de Zoho **aún no ha revisado** (`docs/sdd/Inventario_ZohoDesk_Configuracion.md:107`).

**Referencia.** Sin clave en `openspec/config.yaml` ni entrada en `docs/sdd/ENTRADA.md`: la pregunta sólo está escrita en `openspec/specs/permissions/spec.md:253-265` en `53dd0ed`. Hasta que se registre, no consta en ningún fichero que la sesión cargue.

---

## 3 · F1B-07 — Calificación del cliente y Top 5

### 3.a · Ya respondido: la lista Top 5 y quién la mantiene

`decision/top5-manual` (`openspec/config.yaml:1949-1965`), textual: la prioridad automática sigue para todos; los Top 5 son la excepción, su prioridad se pone **sobre el cliente**, y «la pone el [Director Comercial], que también mantiene la lista de quiénes son Top 5» (`openspec/config.yaml:1954`). El cargo lo confirman `decision/c10-permisos-cargo` («Prioridad de los Top 5 → Director Comercial», `openspec/config.yaml:1934`) y `decision/c10b-gerente-director` (`openspec/config.yaml:2589`). El choque entre contrato y Top 5 también está resuelto: «manda la prioridad más alta de las dos» (`openspec/config.yaml:2456`). **No se vuelve a preguntar.**

### 3.b · Abierto: de dónde sale la calificación del cliente y cuántos niveles

**Qué decide.** Cómo se calcula la prioridad automática de los clientes **sin contrato y no Top 5**. La fila del plan dice «prioridad automática por calificación del cliente y contrato activo (High/Low, as-is R05)» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:162`), y en disco hay tres descripciones distintas, ninguna registrada como `decision/*`:

- Dos niveles, as-is R05: High para contratos y clientes con análisis favorable, Low para desfavorable (`R08.2.md:863`).
- Tres niveles, «modelo de prioridad acordado en la revisión [R08]» (`R08.2.md:1696-1710`): Alta = contrato; Media = sin contrato con buena calificación; Baja = sin contrato con calificación baja. Origen de la calificación: «Portal Ambientalia · Valoración de Clientes» (`R08.2.md:1705`, `:1708`).
- Tres niveles del diccionario de Zoho: High = análisis favorable o contrato; **Medium = estándar**; Low = análisis desfavorable, «asignarse desde la creación del ticket por Comercial» (`R08.2.md:4511`). El propio maestro dice que el modelo R08 cambia este criterio (`R08.2.md:1710`).

Lo que hay en el código: la parte de contrato ya está construida —`High` al nacer si el lote tiene contrato vigente (`packages/shared/src/contratos.ts:65-69`)—; el campo admite `High`, `Medium` y `Low` (`packages/shared/src/transitions.ts:84`); y no hay rastro de «Valoración de Clientes» ni de Top 5 en `packages/` ni `apps/` (búsqueda de `valoraci`, `top ?5` y `top5` en `*.ts`: 0 aciertos fuera de la calificación de **satisfacción** de `apps/desk/src/components/ClienteDetalle.tsx:45-46` y `:174`, que es otra cosa).

**A quién corresponde.** Gerencia, con Comercial como dueña del dato (hipótesis: el maestro atribuye a Comercial la definición de prioridades, `R08.2.md:1695`).

**Qué desbloquea.** La mitad automática de F1B-07 (S44 en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:127`): la prioridad del cliente sin contrato, y con ella el orden de «Mis tickets».

**Preguntas concretas y consecuencia de cada respuesta.**

1. **¿Se confirma el modelo de tres niveles de `R08.2.md:1700-1708`?** Si sí, `Medium` pasa a significar «buena calificación», no «estándar», y la fila del plan (High/Low) queda desfasada. Si se mantiene el as-is de dos niveles, `Medium` no lo asigna la regla.
2. **¿Qué es exactamente «Portal Ambientalia · Valoración de Clientes» y cómo llega el dato a Desk 2.0?** Si es un sistema con datos consultables, la tanda lo lee; si no, la calificación tiene que registrarse en la ficha del cliente y hay que decir quién la registra. Sin esta respuesta, construir la regla es inventar el dato.
3. **¿Quién ajusta a mano la prioridad fuera de los Top 5?** El maestro dice «sólo por superadministrador o Director Técnico» (`R08.2.md:1709`); `decision/top5-manual` sólo resuelve el ajuste de los Top 5 (Director Comercial, `openspec/config.yaml:1954`), y la lista corta de `c10` no incluye otro (`openspec/config.yaml:1934`).

**Referencia.** `openspec/config.yaml:2463` (consecuencia (3) de `decision/anexo-53-contratos`: F1B-07 «tiene que modelar la prioridad en el cliente») · `openspec/config.yaml:1949-1965` · sin entrada en `docs/sdd/ENTRADA.md` para la calificación.

---

## 4 · F1B-08 — Qué significa «vistas equivalentes a Zoho»

**Qué decide.** El contenido de la mitad de paridad de F1B-08: «vistas de listado y ficha equivalentes a las de Zoho Desk; conexión Zoho en solo lectura verificada en las tres entidades» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:163`). Su procedencia son los ítems 17 y 22 del §3.2 (`R08.2.md:3054-3055`, `:3084-3085`), en revisión (`R08.2.md:2948-2949`), así que no fijan alcance. Ni `docs/sdd/ENTRADA.md`, ni `decisiones_de_gerencia`, ni el plan enumeran qué vistas ni qué campos de ficha hay que igualar, ni cuáles son «las tres entidades» (hipótesis: tickets, contactos y cuentas).

**Lo que ya está respondido.** La política de escritura: `decision/p44-escritura-zoho`, «Por ahora no queremos activar la escritura contra Zoho» (`openspec/config.yaml:1566-1569`). La R01.2 da la paridad por «bloqueada porque la escritura contra Zoho no se activa» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:63`), pero unas vistas de listado y ficha son lectura: lo que las bloquea no es P44 sino que nadie ha dicho cuáles son. La mitad de tablero y la de alarma tampoco dependen de esta pregunta: el tablero está archivado (dos cambios `F1B-08`, `cierra: no`) y la alarma está decidida (`decision/escalado-remision-creada`, `decision/anexo-3-alerta`) y tiene su calendario hábil construido (F1B-12, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:222-227`).

**A quién corresponde.** Gerencia, con quien trabaja a diario en Zoho Desk (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:136`).

**Qué desbloquea.** El cierre de F1B-08, que después de la alarma sólo tiene esta mitad pendiente, y la afirmación de paridad que el corte del 14/12 exige (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:57`).

**Opciones y su consecuencia.**

| Opción | Consecuencia |
|---|---|
| **(a) Que la defina la medida M3** («¿qué se usa de Zoho que no esté en Desk 2.0?», media hora con quien trabaja en Zoho, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:202`) | Cada vista o campo que se use es contenido de F1B-08; cada uno que no, alcance que se cierra (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:59`). Es tarea de persona, no tanda. El inventario de configuración no cubrió vistas (`docs/sdd/Inventario_ZohoDesk_Configuracion.md:6`, `:103-110`) |
| **(b) Dar la paridad por cumplida con lo construido** (tablero y vistas funcionales) | F1B-08 cierra al terminar la alarma. Si alguien usa hoy una vista de Zoho que Desk 2.0 no tiene, se descubre después del 14/12 (hipótesis: no medido) |
| **(c) Que Gerencia enumere directamente** las vistas de listado, los campos de la ficha y las tres entidades | Contenido cerrado sin medición; el riesgo es el mismo que (b) si la lista omite algo en uso |

**Referencia.** Sin clave en `openspec/config.yaml` ni entrada en `docs/sdd/ENTRADA.md`. El texto que usa la frase como justificación de destino está en `openspec/config.yaml:453-458` (IV-1) y `:819-824` (IV-7), ambos ya cerrados.

---

## Otras preguntas abiertas que bloquean filas

### 5 · E-079 — Rotulación y almacenamiento en la recepción (F1B-04)

**Qué decide.** Si la aplicación registra algo de la rotulación y el almacenamiento (una confirmación, una ubicación de catálogo, una etiqueta) o basta con el paso físico. **A quién corresponde.** Gerencia. **Qué desbloquea.** El cierre de F1B-04; hoy sólo está construida «foto sólo con novedad» (`cierra: no`). **Opciones.** No registrar nada: la fila se cierra con ese elemento declarado fuera. Registrar algo: hay que decir qué dato, porque ni el maestro ni el acta lo definen. **Referencia.** `docs/sdd/ENTRADA.md:1168-1173`.

### 6 · E-080 — Etapas críticas y listas que sustituyen al texto libre (F1B-04)

**Qué decide.** Qué etapas son «críticas» y, para cada una, qué lista de valores sustituye al texto libre. **A quién corresponde.** Gerencia. **Qué desbloquea.** El cierre de F1B-04. **Opciones.** Reducirlo a la observación de la recepción, que es el único texto libre de esa pantalla: recorta la fila. Dar la lista de etapas y valores: la fila se construye entera. **Referencia.** `docs/sdd/ENTRADA.md:1175-1180`.

### 7 · E-082 — Familia, compuesto y lista de gases patrón (F1A-03 y F1C-07)

**Qué decide.** De dónde sale la familia y el compuesto de cada equipo (catálogo de modelos, campo del equipo u otra fuente) y dónde vive la lista de gases patrón y quién la mantiene. **A quién corresponde.** Gerencia, con validación de Calidad. **Qué desbloquea.** La guarda de Verificación, que es lo que falta para cerrar F1A-03, y la misma regla en `Control de calidad` de F1C-07. Sembrar qué equipos la exigen toca datos de producción. **Referencia.** `docs/sdd/ENTRADA.md:1190-1195`.

### 8 · E-083 — Certificado en `Liberación` desde `Verificación` (F1A-03)

**Qué decide.** Si `Liberación` desde `Verificación` exige un certificado (adjunto, número o casilla) o se retira la mención del maestro (`R08.2.md:1520`). **A quién corresponde.** Gerencia (Calidad). **Qué desbloquea.** Si se exige, contenido de F1A-03; si no, un pasaje del expediente R08.3. **Referencia.** `docs/sdd/ENTRADA.md:1197-1202`.

### 9 · `p55c-proveedor-copia` — Proveedor del almacenamiento de las copias (F1F-02)

**Qué decide.** Cuál de los tres proveedores que la respuesta dejó entre corchetes —Backblaze B2, Cloudflare R2 o Amazon S3— recibe las copias. **A quién corresponde.** Gerencia; cuesta dinero. **Qué desbloquea.** La copia nocturna y la previa a cada cambio, que `decision/p55-backup` ordenó poner en marcha ya, y F1F-02. Sin destino no pueden arrancar. **Referencia.** `openspec/config.yaml:2625` (consecuencia (3) de `decision/p55b-destino-copia`); no tiene clave propia en `decisiones_de_gerencia`.
