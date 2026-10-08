# Paquete de despliegue — 2026-10-08 (adenda: fusión de `indicadores-51-55` y traspaso)

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada.** La publicación es una
acción manual: el CI no despliega, sólo verifica.

**Esta adenda es INCREMENTAL y NO sustituye al paquete del 2026-10-06**
(`docs/sdd/Paquete_de_Despliegue_2026-10-06.md`, que desde hoy **no se edita más**). Lo complementa con la medición del
rango que entró en `main` al fusionar `indicadores-51-55` y con el traspaso de esa tanda. El detalle de qué entra, el
despliegue y las tareas de persona P-1 a P-3 están en el apartado 14 de aquel paquete y aquí no se repiten.

## 0 · Medición del rango

| Dato | Valor |
|---|---|
| Cabeza medida | `2f208ce`, fusión `--no-ff` de la rama `indicadores-51-55` (cabeza `6217d40`) sobre `a13362d` |
| Rango | `42a4828..2f208ce`, **11 commits** (`git rev-list --count`): 9 de la rama, la reparación documental `a13362d` y la fusión |
| `git diff --shortstat 42a4828 2f208ce` | 35 files changed, 4598 insertions(+), 112 deletions(-) |
| Código (`-- apps packages`) | **18 ficheros, +1.419/−64**; sin pruebas: **10 ficheros, +358/−24** |
| Cliente (`-- apps/desk/src`) | **sin cambios** |
| Esquema (`packages/zoho-sync/src/db/schema.sql`) | **+14 líneas**: la tabla nueva `public.encuesta_respuestas`, que nace vacía |
| `Dockerfile`, `package.json`, `package-lock.json`, `.env.example` | **sin cambios**: ninguna dependencia ni variable nueva |
| `DEPLOY.md` | +45/−5 |
| Comprobaciones sobre `2f208ce` antes del push | 4.187 pruebas en verde (7 saltadas), `typecheck` 0, `lint` 0 errores y 165 avisos, detector de citas 0 bloqueantes |
| CI de `2f208ce` | verde |

`a13362d` es documental: deja escrito en `CLAUDE.md` y en `openspec/config.yaml` que los dos desvíos que apuntaban a
F1B-11 quedan **sin destino asignado** desde el 2026-10-07, porque F1B-11 se cerró con `ampliacion-contrato` sin
resolverlos. No cambia nada de lo que se publica.

## 1 · Traspaso de `indicadores-51-55` — para Gerencia y para Supervisión

`indicadores-51-55` lleva `tanda: F1F-05` y `cierra: no`: la fila F1F-05 **sigue en curso** y no suma al avance
(`docs/sdd/RECONCILIACION.md`, regenerada sobre `2f208ce`).

### 1.1 · El indicador 55 está construido sobre un formato SUPUESTO y NO validado

El analizador del fichero de respuestas de la encuesta lee un formato que nadie ha visto: no hay muestra real. Lo
declara su propia cabecera (`apps/desk/server/encuesta/analizarRespuestas.ts:1-2`: «TODO el formato que lee es
SUPUESTO»). Son supuestos, entre otros, que el fichero trae el número de ticket, qué columnas tiene y que la fecha viene
con el día primero.

**Consecuencia:** el 55 no se puede dar por bueno todavía. Las pruebas en verde demuestran que el analizador lee el
formato que se le supuso, no que ese formato sea el de la exportación real.

**Qué hace falta, y es tarea de persona:** que Comercial entregue **un fichero real de respuestas** (P-1 del apartado
14 del paquete del 06/10). Con él se confirma el analizador o se sustituye; ese módulo es lo único que cambiaría, la
tabla y la huella de cada respuesta no. Hasta entonces no se carga ninguna respuesta en producción (P-2 depende de P-1).

### 1.2 · Hallazgo — `instanteDeJornada` devuelve un día de menos para las horas 0 a 4

`instanteDeJornada` (`packages/shared/src/calendarioLaboral.ts:155`) devuelve un instante 24 horas anterior al debido
cuando la hora pedida está entre 0 y 4. Medido en la tanda, con el día `2027-01-12`: hora 0 →
`2027-01-11T05:00:00.000Z` (lo correcto sería `2027-01-12T05:00:00.000Z`); hora 8 → `2027-01-12T13:00:00.000Z`, correcta.

- **Causa:** hipótesis, a partir de la lectura de `packages/shared/src/calendarioLaboral.ts:155-167`: la hora deseada
  se trata como UTC, al formatearla en la zona de negocio cae en el día anterior, y la diferencia que se aplica no
  contempla el cambio de día.
- **A quién afecta hoy:** hipótesis: a nadie, porque sus llamadores piden las 08:00 y las 17:00. No se ha barrido cada
  llamador en esta adenda.
- **Qué hizo la tanda:** no la corrige. El analizador la esquiva midiendo el desplazamiento del día a mediodía
  (`apps/desk/server/encuesta/analizarRespuestas.ts:146`) y aplicándolo a cualquier hora.
- **Destino:** **sin destino asignado**, a propósito. Corresponde a Supervisión abrirle entrada en la bandeja y a
  Gerencia situarlo; la redacción propuesta está en el apartado 14 del paquete del 06/10.

### 1.3 · Lo demás que queda abierto

Las tres preguntas (S-D, S-E y S-G), los otros dos hallazgos y la nota sobre las citas de `openspec/config.yaml` que
son caso B siguen como las dejó el apartado 14 del paquete del 06/10: redactadas para la bandeja, sin número, y sin
abrir por esta sesión.

## 2 · Añadido por `prioridad-tres-niveles` (F1B-07, `cierra: no`)

Cambio `prioridad-tres-niveles`, tres lotes (L1 `8574689`, L2 `e1a4e42`, L3 con este apartado), base `6344b4a`. Respuesta de Gerencia que lo
motiva: `decision/p3b-prioridad-tres-niveles` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`). **Nada de este apartado está ejecutado
contra producción.**

### 2.1 · Qué entra y qué no

**Entra.** La lista asignable pasa a `High` y `Medium` (`Low` deja de ofrecerse y da `422`); un ticket nuevo sin contrato vigente ni Top 5 nace
`Medium` y la prioridad que pida el cuerpo del alta ya no interviene; el Director Técnico ajusta la prioridad de un ticket (ruta `POST` y
transición) por cargo, sin exigirle área; se levanta el límite «sólo clientes Top 5» del ajuste por ticket, y un ticket sin cliente también se ajusta;
el servidor rechaza con `422` una prioridad fuera de la lista pedida en una transición (S-K); el formulario del alta ya no ofrece prioridad.

**No entra.** Esquema, variables de entorno, relleno de datos, ni una línea de `packages/zoho-sync/src/db/repo.ts`. Ninguna regla que dependa de la
«valoración del cliente». Un rango propio para el Top 5. La columna `Low` del tablero por prioridad. La migración del ajuste manual a la marca por fila.
**Sin esquema, sin variables, sin relleno: desplegar es sólo reemplazar el código, y revertirlo es un `git revert` por lote.**

### 2.2 · Efectos al desplegar

- **Un Top 5 guardado con `Low` deja de imponer** hasta que el Director Comercial lo vuelva a guardar con `High` o `Medium`: `prioridadTop5`
  falla cerrado ante un valor fuera de la lista (`packages/shared/src/prioridad.ts:34-36`). Sus tickets abiertos conservan el `Low` que recibieron.
- **Los tickets que ya tienen `Low`, `Urgent`, otro valor o ninguno no se tocan.** Se ordenan con el rango que ya tenían.
- **El mensaje automático «Ticket creado…» muestra el valor crudo `Medium`**, sin traducir: lo compone `apps/desk/server/db/conversacion.ts:44`
  con `String(prio)`. Es presentación, y no se cambia en este cambio.
- **`GET /api/top5` sigue listando a un cliente Top 5 guardado con `Low`**, aunque ya no imponga nada: la ruta (`apps/desk/server/routes/prioridad.ts:23-25`)
  devuelve `listarTop5`, cuya consulta filtra sólo por `top5 = true` (`apps/desk/server/db/prioridadCliente.ts:46-50`). Son dos lecturas de «es Top 5» que divergen
  para ese dato; va a la bandeja como hallazgo (apartado 2.5).
- **El ajuste manual protege sólo la prioridad** (`apps/desk/server/db/prioridadCliente.ts:93`): pone la marca `prioridad_en_app_at` y el sincronizador sigue escribiendo el resto de la fila
  (`packages/zoho-sync/src/db/repo.ts:78`). Ya no marca `managed_by_app` (S-J). Sin relleno: los tickets ajustados ANTES de este despliegue conservan `managed_by_app` y siguen congelados frente a Zoho.

### 2.3 · Consulta de sólo lectura — NO EJECUTADA

**Estado: NO EJECUTADA.** No se puede medir desde el repositorio cuántos tickets o Top 5 hay. La corre una persona con acceso a la base de producción
(P-1) y devuelve el resultado. Son tres `SELECT`; no escriben nada.

```sql
-- 1 · Tickets por prioridad
SELECT COALESCE(priority, '(sin prioridad)') AS prioridad,
       COUNT(*) AS tickets,
       COUNT(*) FILTER (WHERE status_type IS DISTINCT FROM 'Closed') AS abiertos,
       COUNT(*) FILTER (WHERE prioridad_en_app_at IS NOT NULL) AS con_marca_de_prioridad,
       COUNT(*) FILTER (WHERE managed_by_app) AS gestionados_por_la_app
  FROM desk.tickets GROUP BY priority ORDER BY tickets DESC;
-- 2 · Clientes por marca y prioridad
SELECT top5, COALESCE(prioridad, '(null)') AS prioridad, COUNT(*) AS clientes
  FROM public.cliente_prioridad GROUP BY top5, prioridad ORDER BY top5 DESC, clientes DESC;
-- 3 · Los Top 5 que dejan de imponer
SELECT client_id, prioridad, actualizado_por, actualizado_at
  FROM public.cliente_prioridad
 WHERE top5 = true AND (prioridad IS NULL OR prioridad NOT IN ('High', 'Medium'));
```

*Nombres de columna confirmados contra `packages/zoho-sync/src/db/schema.sql`:* `priority` y `status_type` (`packages/zoho-sync/src/db/schema.sql:23`),
`managed_by_app` (`packages/zoho-sync/src/db/schema.sql:41`), `prioridad_en_app_at` (`packages/zoho-sync/src/db/schema.sql:710`); `client_id`, `top5`, `prioridad`,
`actualizado_por` y `actualizado_at` (`packages/zoho-sync/src/db/schema.sql:606-611`). La tabla `tickets` se crea sin calificar (`packages/zoho-sync/src/db/schema.sql:20`)
y vive en `desk`, por eso la consulta la califica; `cliente_prioridad` está en `public` (`packages/zoho-sync/src/db/schema.sql:606`). El literal `'Closed'` es el que usa la
propagación (`apps/desk/server/db/prioridadCliente.ts:110`). **Hipótesis:** la consulta no se ha corrido, ni siquiera contra una copia; si una columna no existiera en
producción, la consulta fallaría sin escribir nada.

### 2.4 · Supuestos para Gerencia — S-A a S-K

Todos son razonables y reversibles; se aplicaron y se anotan aquí. Ninguno está decidido. La columna de la derecha dice qué cambia si la respuesta es otra.

| | Supuesto aplicado | Qué cambia si la respuesta es otra |
|---|---|---|
| **S-A** | **La fuente no dice cómo se ordenan «Top 5» y «alta» entre sí.** Se supone que «Top 5» es la marca del cliente y que el valor que impone lo elige el Director Comercial entre `High` y `Medium`; **Top 5 y «alta» empatan por rango y desempata la habilitación** (`packages/shared/src/prioridad.ts:101-109`). Un cliente que es las dos cosas: manda la más alta de las dos | Si Top 5 va por encima (o por debajo) de «alta», hace falta un rango nuevo: cambia el orden de la cola, el tablero por prioridad y qué significa `High` en un Top 5. Es otra tanda |
| S-B | «Media el resto»: el servidor pone `Medium` al nacer y la pedida en el alta deja de intervenir | Si la pedida debe seguir valiendo dentro de la lista, vuelve a la fórmula como último respaldo y el campo vuelve al formulario |
| S-C | No se reescribe ningún ticket existente | Hace falta un relleno: dato de producción, decisión de persona |
| S-D | Se levanta el límite «sólo Top 5» del ajuste por ticket | Se repone el `409` en la ruta, con sus pruebas de posición |
| S-E | La excepción del Director Técnico alcanza el ajuste por ticket (ruta y transición), no el `PUT` del cliente | Si alcanza al cliente, la ruta del `PUT` pasa al predicado nuevo |
| S-F | El Director Técnico ajusta por cargo, sin exigirle área; al Director Comercial se le sigue exigiendo la suya | Se añade el área al predicado |
| S-G | El Director Técnico ajusta cualquier ticket | Se añade una guarda de estado o de área del ticket |
| S-H | Levantado el límite, un ticket sin cliente también se puede ajustar | Se repone el `409` de ticket sin cliente |
| S-I | Desmarcar un Top 5 sigue devolviendo cada ticket a **su base**, como hoy; un ticket que nace desde ahora bajo Top 5 tiene base `Medium` | Si «la calculada» debe ser siempre la de tres niveles, la reversión sube a `Medium` los `Low` y baja los `Urgent`: toca tickets existentes |
| **S-J** | **El ajuste manual protege SÓLO la prioridad**, con la marca por fila `prioridad_en_app_at` (`packages/zoho-sync/src/db/repo.ts:78`): un ticket venido de Zoho al que se le ajusta la prioridad sigue recibiendo de Zoho el estado y todo lo demás. No marca `managed_by_app`, ni `source`, ni `modified_time`; el que ya era de la aplicación lo sigue siendo. Corregido el 2026-10-08 por orden del analista: hasta entonces marcaba `managed_by_app` y congelaba la fila entera. Efecto lateral: el ajuste ya no marca el ticket como no leído | Si el ajuste debe congelar el ticket entero, se vuelve a `managed_by_app`. Los tickets ajustados antes del despliegue siguen congelados: liberarlos es un relleno, dato de producción |
| S-K | Una prioridad pedida en una transición, no vacía, distinta de la actual y fuera de la lista, se rechaza con `422` (el servidor no validaba el valor). Reenviar la actual, aunque sea una `Low` heredada, pasa | Se retira la validación: la lista vuelve a depender sólo de lo que ofrezca el formulario, y quien tenga permiso puede escribir `Low` o `Urgent` con un cuerpo hecho a mano |

### 2.5 · Entradas propuestas para la bandeja — SIN número

Las numera Supervisión. **No se ha tocado `docs/sdd/ENTRADA.md`.**

- *pregunta* — ¿Top 5 y «alta» tienen un orden entre sí, o empatan (S-A)?
- *pregunta* — Al desmarcar un Top 5, ¿el ticket vuelve a lo que tenía (S-I) o a la prioridad de tres niveles?
- *pregunta* — Un ticket venido de Zoho al que se le ajusta la prioridad a mano conserva esa prioridad y sigue recibiendo de Zoho todo lo demás (S-J). ¿Se confirma?
  Y los ajustados antes del despliegue, que siguen congelados enteros (`managed_by_app`): ¿se liberan con un relleno o se dejan?
- *pregunta* — ¿El Director Técnico ajusta cualquier ticket, también los que no tienen cliente (S-G, S-H)?
- *pregunta* — Una prioridad pedida en una transición fuera de la lista se rechaza con `422` (S-K). ¿Se mantiene?
- *hallazgo* — `GET /api/top5` sigue listando a un cliente Top 5 guardado con `Low`, aunque ya no imponga nada: dos lecturas de «es Top 5» que divergen para ese
  dato. **Sin destino asignado**, a propósito.
- *hallazgo* — La columna `Low` del tablero por prioridad sigue existiendo para los tickets que ya la tienen. **Sin destino asignado.**

### 2.6 · Tareas de persona — fuera del recuento

Regla del ciclo 1: no son casillas, no las marca ninguna tanda. **Archivar el cambio NO las da por hechas.**

| | Qué | Dueño | Destino |
|---|---|---|---|
| P-1 | Ejecutar en producción la consulta de sólo lectura del apartado 2.3 y devolver el resultado | Persona con acceso a la base de producción | Este apartado |
| P-2 | Volver a guardar con `High` o `Medium` cada Top 5 que la consulta 3 devuelva | Director Comercial | Este apartado |
| P-3 | Responder a S-A … S-K y a las preguntas del apartado 2.5 | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| P-4 | Definir qué es la «valoración del cliente» y cómo llega a Desk | Gerencia | Punto abierto de F1B-07 |
| P-5 | Pegar en el maestro las correcciones de la entrada 34 | Gerencia | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| P-6 | Comprobar en la aplicación, tras desplegar: un alta sin contrato nace media; el Director Técnico ajusta un ticket de un cliente que no es Top 5; un técnico no puede | Comercial y Servicio Técnico | Este apartado |

### 2.7 · Por qué esto NO cierra F1B-07

La fila pide la prioridad automática completa, y falta el nivel que depende de la **valoración del cliente**: el punto 2 de la respuesta de Gerencia va entre
corchetes, no hay dato utilizable en Zoho CRM y «la valoración del portal» no está definida (P-4). Aquí no se inventa ni el dato ni su formato: se deja fuera.
El cambio lleva `cierra: no` y no cuenta en el numerador del avance.

## 3 · Traspaso de `prioridad-tres-niveles` tras la fusión — para Gerencia y para Supervisión

Añadido el 2026-10-08, después de fusionar la tanda en `ce4498c` (CI verde). El apartado 2 lo escribió la rama y sigue valiendo;
aquí va lo que cambió después y lo que se pide a cada uno. F1B-07 **sigue en curso** (`cierra: no`).

### 3.1 · El verify formal es anterior al último cambio de producción

El `verify-report.md` del cambio da su veredicto sobre `e47a3a0`. Después cambió una sentencia de producción, en `a220757` (la del
ajuste manual, apartado 3.3). **No se repitió el verify entero.** Lo que sí se comprobó tras ese cambio, por el orquestador y por el
analista: los cuatro códigos en 0 sobre la rama y sobre `main` fusionado (4.231 pruebas pasan, 7 saltadas), seis mutaciones nuevas
sobre esa sentencia en rojo, y las cinco de la remediación repetidas con los mismos recuentos. Quien lea el informe de verify tiene
que leer también su adenda del 2026-10-08.

### 3.2 · Supuestos que esperan respuesta de Gerencia

| | Qué se supuso | Qué se pregunta |
|---|---|---|
| **S-A** | La fuente no dice cómo se ordenan «Top 5» y «alta» entre sí. Se supuso que empatan por rango y que desempata la habilitación (`packages/shared/src/prioridad.ts:101-109`) | ¿Top 5 va por encima de «alta», por debajo, o empatan? |
| **S-C** | No se reescribe ningún ticket existente. Los que ya tienen `Low`, `Urgent` u otro valor lo conservan; un Top 5 guardado con `Low` deja de imponer hasta que se vuelva a guardar | ¿Se dejan así o se rellenan? Un relleno es dato de producción |
| **S-K** | Una prioridad pedida en una transición, distinta de la actual y fuera de la lista, se rechaza con `422` (`packages/shared/src/prioridad.ts:120`). Antes el servidor no validaba el valor | ¿Se mantiene la validación? |
| **S-J** | **Cambiado tras el verify.** El ajuste manual protege sólo la prioridad: el ticket venido de Zoho sigue recibiendo de Zoho el estado y todo lo demás (`apps/desk/server/db/prioridadCliente.ts:93`, `packages/zoho-sync/src/db/repo.ts:78`). Efecto lateral: el ajuste ya no marca el ticket como no leído | ¿Se confirma? Y la pregunta del apartado 3.3 |

### 3.3 · Tarea de persona — los tickets ajustados ANTES del despliegue

Hasta este despliegue el ajuste manual ponía `managed_by_app`, que hace que el sincronizador no escriba **nada** de la fila
(`packages/zoho-sync/src/db/repo.ts:71`). **No hay relleno:** los tickets ajustados antes siguen así, congelados enteros frente a
Zoho. Como entonces el ajuste sólo se admitía en clientes Top 5, son tickets de esos clientes. Hipótesis: son pocos; no se puede
medir desde el repositorio.

**Consulta de sólo lectura — NO EJECUTADA.** La corre una persona con acceso a la base de producción. Un `SELECT`; no escribe nada.

```sql
-- Tickets venidos de Zoho, con al menos un ajuste manual de prioridad, que hoy no reciben nada de Zoho
SELECT t.id, t.number, t.status, t.priority, t.source,
       t.prioridad_en_app_at,
       MIN(a.ajustado_at) AS primer_ajuste,
       COUNT(*)           AS ajustes_manuales,
       EXISTS (SELECT 1 FROM desk.ticket_transitions x WHERE x.ticket_id = t.id) AS con_transiciones_en_la_app
  FROM desk.tickets t
  JOIN public.prioridad_ajustes a ON a.ticket_id = t.id
 WHERE a.origen IS NULL
   AND t.managed_by_app = true
   AND t.id NOT LIKE 'app-%'
 GROUP BY t.id, t.number, t.status, t.priority, t.source, t.prioridad_en_app_at
 ORDER BY primer_ajuste;
```

- `origen IS NULL` es lo que significa «ajuste manual» (`packages/shared/src/prioridadPropagada.ts:24-26`); `'app-%'` es el prefijo
  de los tickets nacidos en la aplicación (`packages/shared/src/transitions.ts:124`), que nunca vienen de Zoho.
- **La columna `con_transiciones_en_la_app` decide la lectura.** Si es verdadera, el ticket ya estaba gobernado por la aplicación
  por sus transiciones y el ajuste no le cambió nada. Si es falsa, lo único que lo congeló fue el ajuste: ésos son los afectados.
- Nombres de tabla y columna tomados de `packages/zoho-sync/src/db/schema.sql:613` (`public.prioridad_ajustes`) y
  `packages/zoho-sync/src/db/schema.sql:710` (`prioridad_en_app_at`). **Hipótesis:** la consulta no se ha corrido, ni contra una copia.

| | Qué | Dueño | Destino |
|---|---|---|---|
| P-7 | Ejecutar la consulta de arriba y devolver el resultado | Persona con acceso a la base de producción | Este apartado |
| P-8 | Decidir, con ese resultado, si los afectados se liberan (volver a `managed_by_app = false` y poner la marca de prioridad) o se dejan como están | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |

### 3.4 · Para Supervisión

- Las dos citas de `docs/sdd/ENTRADA.md` (línea 2148) que la fusión desplazaba quedaron ancladas a `6344b4a` en `0de13ac`. La línea
  base del detector sigue en 0.
- **24 citas de cambios archivados ya estaban rotas antes de esta tanda** y no se tocaron. La lista, por cambio, está en el
  `archive-report.md` de `openspec/changes/archive/2026-10-08-prioridad-tres-niveles/`. Piden un barrido propio, cita a cita.
- Los títulos de RQ-TC-29, RQ-TS-21 y RQ-PM-23 se corrigieron en las specs vivas en el mismo commit que este apartado: decían lo
  anterior a la tanda y su cuerpo ya decía lo construido.
- Las entradas de bandeja del apartado 2.5 siguen sin número. La tercera cambia de sentido: ya no pregunta si se mantiene el
  congelado entero, sino si se confirma S-J y qué se hace con los ya ajustados (apartado 3.3).

## 4 · Añadido por `mapa-blueprint-tres-flujos` (F1B-09, `cierra: no`)

### 4.1 · Qué entra

- **Motor** (`packages/shared/src/mapaBlueprint.ts`): tres campos opcionales en `EntradaMapa` (nombre del flujo, nombre del
  fichero completo y fuentes), la cabecera de «generado» como plantilla y la guarda D-1 sólo cuando el flujo declara fases.
- **Registro por flujo** (`packages/shared/src/mapaPorFlujo.ts`, fichero nuevo, exportado desde `packages/shared/src/index.ts`):
  construye la entrada de cada clave de `CATALOGO_POR_FLUJO`. Los estados de equipo nuevo y soporte remoto se derivan del catálogo.
- **Guion** (`scripts/generar-mapa-blueprint.ts`): escribe los seis ficheros desde ese registro.
- **Dos mapas generados nuevos:** `docs/artefactos/blueprint-equipo-nuevo.md` y `docs/artefactos/blueprint-soporte-remoto.md`. Los cuatro
  de servicio no cambian ni un byte.
- **Pruebas** (al final de `packages/shared/src/mapaBlueprint.test.ts`): anti-desfase exhaustivo sobre las claves de `CATALOGO_POR_FLUJO`.

### 4.2 · Qué NO hay

**Ni esquema, ni variables de entorno, ni relleno de datos.** Es una herramienta de documentación que escribe Markdown en
`docs/artefactos/`. No toca el servidor, el cliente, la base de datos ni el despliegue.

### 4.3 · Lo que queda para Supervisión y Gerencia

| | Qué | Dueño | Destino |
|---|---|---|---|
| T-P1 | Marcar E-222 como resuelta y anclar al guion y a la prueba las citas sin ancla de `openspec/config.yaml` y `docs/sdd/ENTRADA.md` | Supervisión | `docs/sdd/ENTRADA.md` y `openspec/config.yaml`, en `main` |
| T-P2 | Añadir a la corrección de M11.6 (E-230) que el mapa generado cubre los tres flujos | Gerencia | Expediente del maestro |

Archivar el cambio no da por hechas estas dos tareas.

### 4.4 · Traspaso tras la fusión — para Supervisión

Añadido el 2026-10-08, después de fusionar la tanda en `60b171f`. F1B-09 **sigue en curso** (`cierra: no`).

- **Marcar E-222.** El mapa generado cubre ya los tres flujos; la entrada de `docs/sdd/ENTRADA.md` sigue diciendo **ABIERTA**. Es T-P1
  del apartado 4.3 y no la marca esta tanda: el fichero es de Supervisión.
- **Citas antiguas sin anclar a `packages/shared/src/mapaBlueprint.ts`, que se suman a E-183.** Son siete ubicaciones en cuatro cambios
  archivados, todas escritas contra el fichero de su fecha y sin revisión en la cita. La fusión insertó líneas en ese fichero desde la
  línea 30 (25 añadidas y 14 quitadas, medido entre `a26ed48` y `60b171f`), así que hoy apuntan entre cinco y diez líneas más arriba de
  lo que nombran. No se tocaron: son registros fechados (caso B de la regla de mutación 4) y piden el mismo barrido cita a cita que E-183.

  | Cambio archivado | Fichero y línea de la cita | Rango que cita |
  |---|---|---|
  | `2026-09-22-generador-mapa-blueprint` | `verify-report.md`, línea 114 | líneas 108 a 122 |
  | `2026-09-25-blueprint-equipo-nuevo` | `apply-progress.md`, línea 483 | línea 139 |
  | `2026-10-01-tres-transiciones-cifra-anclada` | `design.md`, línea 22 | línea 72 |
  | `2026-10-01-tres-transiciones-cifra-anclada` | `design.md`, línea 52, y `tasks.md`, línea 53 | línea 63 |
  | `2026-10-02-rechazo-solo-comercial` | `design.md`, línea 29, y `exploration.md`, línea 66 | líneas 78 a 80 |

  El detector no las bloquea: la línea existe y no está vacía. Que diga lo que la frase afirma es lectura humana.
- **Nadie ha renderizado los dos diagramas nuevos.** `docs/artefactos/blueprint-equipo-nuevo.md` y `docs/artefactos/blueprint-soporte-remoto.md`
  están probados como texto —contenido, orden y desfase contra el catálogo—, no como dibujo. **Tarea de persona:** abrirlos una vez en un
  visor de Mermaid y comprobar que se pintan. No es una casilla de ninguna tanda.

## 5 · Añadido por `columna-propia-dos-estados` (F1B-08, `cierra: no`)

### 5.1 · Qué entra

- `Verificación` y `Solicitud Soporte` tienen columna propia en el tablero y dejan de caer en `Otros`
  (`packages/shared/src/columns.ts:15`, `packages/shared/src/columns.ts:20`). `Solicitud Soporte` va junto a `Ticket creado`;
  `Verificación`, tras `En Proceso`. Ningún otro estado cambia de columna: lo fija una prueba sobre los 23 estados del registro.
- El tablero oculta las columnas vacías por defecto (`apps/desk/src/boardSettings.ts:10`): las dos nuevas sólo se ven vacías si la
  persona desactivó esa preferencia.
- El color de la tarjeta de esos dos estados no cambia: sigue siendo el de respaldo.

### 5.2 · Qué NO hay

**Ni esquema, ni variables de entorno, ni relleno de datos.** Son dos entradas en una lista de `packages/shared` que el cliente ya
consumía; no se tocó ningún fichero de `apps/desk/src` ni del servidor.

### 5.3 · Lo que queda para personas

| | Qué | Dueño | Destino |
|---|---|---|---|
| C-P1 | Comprobación visual: un ticket en `Verificación` y otro en `Solicitud Soporte` aparecen en su columna, y `Otros` deja de enseñarlos | Persona con acceso a la aplicación desplegada | Este apartado |
| C-P2 | S-1: ¿la posición de las dos columnas es la buena? S-2: ¿la etiqueta es el nombre del estado? S-3: ¿es aceptable verlas vacías cuando no se ocultan las vacías? | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| C-P3 | Poner al día tres textos que dejan de ser ciertos sin que su línea se mueva: la consecuencia (1) de `decision/e225-columna-propia-dos-estados` («dos pruebas que hoy afirman lo contrario», «dos requisitos que hoy lo prohíben»), la entrada E-225 de la bandeja y el hallazgo B-4 de la auditoría de F1B-09 | Supervisión | Los propios ficheros, en `main` |

Archivar el cambio no da por hechas estas tres tareas. F1B-08 **sigue en curso**: queda la paridad de vistas, con plazo 2026-10-16.

### 5.4 · Traspaso tras la fusión — para Gerencia y para Supervisión

Añadido el 2026-10-08, después de fusionar la tanda en `ae2e522`. F1B-08 **sigue en curso** (`cierra: no`): queda la paridad de vistas.

**Para Gerencia — tres supuestos aplicados, los tres reversibles.** La decisión `decision/e225-columna-propia-dos-estados` pide la
columna y no dice cómo; la tanda eligió y lo anotó. Lo que se responda va a `openspec/config.yaml` → `decisiones_de_gerencia`.

| | Supuesto aplicado | Pregunta | Qué cuesta cambiarlo |
|---|---|---|---|
| S-1 | `Solicitud Soporte` va junto a `Ticket creado`; `Verificación`, tras `En Proceso` | ¿Es esa la posición, o van en otro sitio? | Mover una entrada de la lista de `packages/shared/src/columns.ts` y la prueba de orden |
| S-2 | La cabecera de cada columna lleva el nombre del estado | ¿Se quiere otro rótulo? | Un texto y su prueba |
| S-3 | Si la persona desactiva «ocultar columnas vacías», las dos columnas nuevas se ven vacías, como las demás | ¿Es aceptable verlas vacías? | Tocar `apps/desk/src`, que está fuera de la red de pruebas |

**Para Supervisión — tres textos que dejan de ser ciertos.** Ninguna de sus líneas se movió, así que el detector no los señala; los tres
están en ficheros que la tanda no toca.

- La consecuencia (1) de `decision/e225-columna-propia-dos-estados`, en `openspec/config.yaml`: habla de «dos pruebas que hoy afirman
  lo contrario» y de «dos requisitos que hoy lo prohíben». Las dos pruebas están invertidas y los dos requisitos (RQ-EN-07 y RQ-SR-03),
  reescritos. Además dice que es «estimación, no medida»: la medida existe, 109 líneas de apply.
- La entrada E-225 de `docs/sdd/ENTRADA.md`, que sigue **ABIERTA** y dice que los dos estados caen en «Otros».
- El hallazgo B-4 de `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md`, que afirma lo mismo. Su segunda mitad —`Pendiente` conserva
  columna sin ser ya estado de servicio— **sigue siendo cierta**: la tanda no la tocó.

Son registros fechados: lo que toca es anotar qué los cerró y en qué commit, no reescribirlos (casos B y C de la regla de mutación 4).

**Tarea de persona, tras publicar.** Con `ae2e522` desplegado, abrir el tablero y comprobar que un ticket en `Verificación` y otro en
`Solicitud Soporte` aparecen cada uno en su columna, en la posición de S-1, y que `Otros` deja de enseñarlos. El CI verifica y no
despliega: hasta que alguien publique, la aplicación en producción no enseña el cambio. No es una casilla de ninguna tanda.

## 6 · Añadido por `nit-exentos-aviso-provisional` (F1B-19, `cierra: si`)

Añadido el 2026-10-08, después de fusionar la tanda en `509b905`. Es la última tanda de la cadena autorizada el 2026-10-06
(`decision/f1b19-nit-exentos-y-aviso-provisional`: «al final de la cadena»).

### 6.1 · Qué entra

- **NIT genéricos exentos.** El alta manual de un cliente provisional ya no se detiene con `409` si su NIT está en la lista de exentos
  (`apps/desk/server/services/ticketService.ts:96`). La lista es la tabla `public.nit_exentos`, con UNA fila: `222222222222`, el de
  consumidor final. Cualquier otro NIT que esté en Books sigue deteniendo el alta, como antes.
- **Aviso de provisional ya en Books.** Cuando un contacto de Books comparte NIT con un cliente provisional sin enlazar, Comercial recibe
  un aviso de bandeja, una sola vez por pareja (`apps/desk/server/services/avisoProvisionalEnBooks.ts`). No bloquea nada. Un NIT exento
  no avisa. Al enlazar el provisional deja de avisar.

### 6.2 · Qué SÍ hay esta vez: esquema

**Dos tablas nuevas y una fila sembrada**, que `migrate` crea al arrancar: `public.nit_exentos` y `public.provisional_books_avisados`.
**Sin variables de entorno, sin interruptor y sin relleno de datos.** Las dos piezas quedan activas al publicar. La comprobación de
lectura tras desplegar está al final de `DEPLOY.md`, en el apartado de F1B-19: hay que hacerla, porque si falta `public.nit_exentos`
toda alta con cliente manual falla.

### 6.3 · Para Gerencia — seis supuestos aplicados, reversibles

Lo que se responda va a `openspec/config.yaml` → `decisiones_de_gerencia`. **S-4 conviene responderla antes de publicar.**

| | Supuesto aplicado | Pregunta |
|---|---|---|
| S-1 | La lista de exentos se mantiene por SQL, sin pantalla | ¿Basta así, o contabilidad necesita pantalla? |
| S-2 | Dos provisionales distintos con el mismo NIT exento se permiten; hoy nada impide dos con el mismo NIT, exento o no | ¿Debe impedirse un segundo provisional con el mismo NIT? |
| S-3 | Texto del aviso: nombra la razón social y el NIT del provisional y el contacto de Books, y dice que conviene enlazarlos. Sin ticket asociado | ¿Se quiere otro texto, o asociarlo a un ticket? |
| S-4 | **Ráfaga al publicar:** la primera pasada avisa una vez cada pareja que ya exista. No hay corte | ¿Se acepta, o se prefiere silenciar las parejas anteriores al despliegue? |
| S-5 | El aviso se evalúa en cada intervalo de sincronización, no una vez al día | ¿Es aceptable que llegue a los pocos minutos? |
| S-6 | Basta que el NIT sea exento en uno de los dos lados de la pareja para no avisar | ¿De acuerdo? |

### 6.4 · Para Supervisión — textos que dejan de ser ciertos

Están en ficheros que la tanda no toca. Son registros fechados: se anota qué los cerró, no se reescriben.

- `decision/e154-nit-genericos-exentos`, en `openspec/config.yaml`: su consecuencia (1) dice que hoy no existe ninguna lista, y su
  `tanda_que_abre` sigue diciendo «SIN DESTINO». Lo mismo el `tanda_que_abre` de `decision/e155-aviso-provisional-en-books`.
- Las entradas E-154 y E-155 de `docs/sdd/ENTRADA.md`.
- La fila F1B-19 del §C del plan sigue diciendo «pendiente»: `RECONCILIACION.md` la cuenta ya como cerrada por archivo.

### 6.5 · Tareas de personas

No son casillas de ninguna tanda, y archivar no las da por hechas.

| | Qué | Dueño |
|---|---|---|
| N-P1 | Ejecutar la consulta de sólo lectura que lista los NIT repetidos en Books y entregar el resultado a contabilidad. Está escrita al final de `openspec/changes/archive/2026-10-08-nit-exentos-aviso-provisional/proposal.md`. **Ninguna sesión la ha ejecutado** | Persona con acceso a producción |
| N-P2 | Decidir qué NIT de esa lista son genéricos. Cada uno se añade por SQL, como explica `DEPLOY.md`; hasta entonces la lista tiene sólo el de consumidor final | Contabilidad |
| N-P3 | Comprobación de lectura tras desplegar: las dos tablas existen y la fila sembrada está activa | Persona con acceso a producción |

### 6.6 · Lo que queda declarado

El detalle está en el `archive-report.md` del cambio. Lo que conviene saber antes de publicar: un NIT exento tecleado como base más
dígito de verificación sin guion no se reconoce como exento; mientras haya un provisional sin enlazar y no exento, cada pasada lee todos
los contactos de Books (cuántos hay: sin dato en el repositorio); y la cadena periódica de `apps/desk/server/index.ts` se prueba como
texto, no ejecutándola.

### 6.7 · Estado de `main` al cerrar la cadena

Medido por `npm run reconcile` sobre `509b905`: **17** tandas cerradas por archivo, **9** por commit declarado y **11** en curso, sobre
**78**. F1B-19 es la que entra hoy en las cerradas por archivo. Con `509b905`: `npm test` 0 (4.327 pasan, 7 saltadas), typecheck 0,
lint 0 (165 avisos) y detector de citas 0. El CI verifica y no despliega: nada de lo de este paquete está en producción hasta que
alguien publique.
