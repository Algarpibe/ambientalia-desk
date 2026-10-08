---
tanda: F1B-07
motivo: ""
capacidad: [tickets-core, transitions-st, permissions, zoho-sync]
maestro: ["M1.9.1"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — Prioridad en tres niveles y ajuste por ticket del Director Técnico

Ampliación de F1B-07 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:87`). Exploración: `exploration.md` de
esta carpeta. Base: `6344b4a`. Citas leídas contra el worktree el 2026-10-07.

*Sobre la cabecera:* las tres capacidades existen en `openspec/specs/`. `zoho-sync` **no** entra: se añade una prueba y
ningún requisito suyo cambia. `toca_maestro: si` porque el maestro vigente dice otra cosa en tres sitios
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1982`, `:1986-1987` y `:1990`) y la decisión
lleva la revisión del maestro pendiente. **`cierra: no`: ver §12.**

## 1 · Intención

Gerencia, `decision/p3b-prioridad-tres-niveles` (`openspec/config.yaml:4132`), respuesta textual (`openspec/config.yaml:4139`):

> «1) Tres niveles: alta con contrato, Top 5 los que fijo yo, media el resto; sin «baja» por ahora. 2) [Lo que sea la
> valoración del portal; en Zoho CRM no hay ninguna utilizable.] 3) La prioridad del cliente, el Director Comercial; el
> ajuste puntual de un ticket, también el Director Técnico.»

Lo que hoy ocurre, y no coincide:

- `Low` era asignable (`packages/shared/src/prioridad.ts:13` en `6344b4a`; `packages/shared/src/transitions.ts:84` en `6344b4a`).
- Sin contrato ni Top 5, el ticket nace con la prioridad pedida en el cuerpo o sin ninguna
  (`packages/shared/src/contratos.ts:66-69` en `6344b4a`): no existía «media el resto».
- El Director Técnico no podía ajustar (`packages/shared/src/prioridad.ts:79` en `6344b4a`; `apps/desk/server/routes/prioridad.ts:71` en `6344b4a`).
- El ajuste por ticket sólo se admitía en clientes Top 5 (`apps/desk/server/routes/prioridad.ts:67-69` en `6344b4a`).

## 2 · Alcance

### Dentro

1. **Lista asignable `High` y `Medium`**, en `shared` y a la par en las opciones del campo `priority` de las
   transiciones. La prueba que las mantiene iguales ya existe (`packages/shared/src/prioridad.test.ts:8`, `:17`).
2. **Regla al nacer**, en `shared`: la del Top 5 fijada a mano; `High` con contrato vigente; `Medium` el resto; con las
   dos, la más alta. **La prioridad pedida en el cuerpo del alta deja de intervenir.** Se reutilizan `prioridadAlNacer`,
   `hayContratoVigente` (`apps/desk/server/db/contratos.ts:79-81`) y `estadoContrato`
   (`packages/shared/src/contratos.ts:41-45`); nada nuevo para la vigencia.
3. **Quién.** Prioridad del **cliente**: sólo Director Comercial, sin cambio (`apps/desk/server/routes/prioridad.ts:40`).
   Ajuste de un **ticket** —ruta `POST` y guarda de transición—: Director Comercial o Director Técnico, por cargo, impuesto
   en el servidor en el escalón B. Predicado nuevo en `packages/shared/src/cargos.ts`.
4. **Se levanta el límite «sólo Top 5»** del ajuste por ticket: desaparece B1.
5. **Sincronizador: una prueba, ningún código.**
6. **Cliente:** consumir la lista de `shared` y reflejar el permiso y el límite nuevos (§6).

### Fuera

- Toda regla que dependa de una «valoración» del cliente: el punto 2 de la respuesta es pendiente, no decisión.
- Un rango propio para Top 5 (enfoque B de la exploración, descartado).
- Esquema, relleno de datos y `packages/zoho-sync/src/db/repo.ts`.
- ~~Migrar el ajuste manual de `managed_by_app` a la marca por fila~~ — **hecho el 2026-10-08, tras el verify** (§5, S-J; `design.md` D8), sin tocar `repo.ts`.
- La columna `Low` del tablero por prioridad y el rango de `Low` y `Urgent` al ordenar
  (`packages/shared/src/prioridad.ts:22-23`): siguen leyendo lo que ya existe.
- IV-12 y los `.tsx` de color.

## 3 · Capacidades

**Nuevas:** ninguna.

**Modificadas:**

| Capacidad | Requisito | Qué cambia |
|---|---|---|
| `tickets-core` | RQ-TC-24, `openspec/specs/tickets-core/spec.md:856` | Cae «la que hoy resulte del cuerpo, o ninguna» (`:864-865`): sin contrato ni Top 5 nace `Medium`, y el cuerpo no interviene nunca |
| `tickets-core` | RQ-TC-29, `openspec/specs/tickets-core/spec.md:1165` | Cae el `409` de cliente no Top 5 (`:1169-1170`); el permiso pasa al predicado nuevo; la lista de `:1172` pierde `Low` |
| `tickets-core` | RQ-TC-27 y los que enumeren la lista | La prioridad de un Top 5 se elige entre `High` y `Medium` |
| `transitions-st` | RQ-TS-20, `openspec/specs/transitions-st/spec.md:833` | Las opciones de `:837` pasan a `High` y `Medium` |
| `transitions-st` | RQ-TS-21, `openspec/specs/transitions-st/spec.md:863` | El predicado de `:866-867` pasa al nuevo; cae la consecuencia de `:871-872` (el Director Técnico sí cambia ahí la prioridad) |
| `permissions` | RQ-PM-20, `openspec/specs/permissions/spec.md:474` | Tercera primitiva de cargo, con llamador |
| `permissions` | RQ-PM-23, `openspec/specs/permissions/spec.md:517` | Deja de ser «un solo predicado» (`:519-521`): dos actos del cliente con el de hoy, el ajuste por ticket con el nuevo |

## 4 · Enfoque por pieza

| Pieza | Enfoque |
|---|---|
| Lista | Edición en sitio de `packages/shared/src/prioridad.ts:13` y de `packages/shared/src/transitions.ts:84` |
| Regla al nacer | En `prioridadAlNacer` (`packages/shared/src/contratos.ts:66-69`). El alta la llama en `apps/desk/server/services/ticketService.ts:106`, edición **en sitio** |
| Predicado | Nuevo, **al final** de `packages/shared/src/cargos.ts` (hoy acaba en `:98`), sin añadir clave a `EXCEPCIONES_POR_CARGO` (`:27-35`) para no desplazar `packages/shared/src/cargos.ts:80-83`, que se cita desde la decisión y desde `permissions` |
| Guarda de transición | El cambio va **dentro** de `cambiaPrioridadSinPermiso` (`packages/shared/src/prioridad.ts:85`): `apps/desk/server/services/ticketService.ts:131` no se toca. El mensaje de `packages/shared/src/prioridad.ts:55` se corrige en sitio |
| Ruta `POST` | Escalera nueva: A `404` (`apps/desk/server/routes/prioridad.ts:66`) < B `403` (`:71`) < C `422` (`:73-74`). Se retiran `:67-69` y se corrige el comentario de `:47-49` |
| Cliente | §6 |

**Interacción que la exploración no cubre, y que el diseño debe resolver antes de `tasks`.** `prioridadAlNacer` tiene
tres llamadores, no uno: el alta, `baseAlNacer` (`packages/shared/src/prioridadPropagada.ts:36-38`) y la reversión del
Top 5 (`packages/shared/src/prioridadPropagada.ts:47`), que le pasa como primer argumento **la base del ticket**, no una
prioridad pedida. Si la función pasa a ignorar ese argumento, desmarcar un cliente devolvería a `Medium` un ticket que
antes del Top 5 tenía `Low` o `Urgent`, y hoy la spec dice que vuelve a `Low` (`openspec/specs/tickets-core/spec.md:968`).
Supuesto S-I (§5): la reversión sigue devolviendo la base; lo que cambia es sólo el nacimiento. Cómo se separan las dos
lecturas sin escribir una segunda fórmula es del diseño.

## 5 · Supuestos para Gerencia

Todos razonables y reversibles. Se aplican, y se anotan en el parte.

| | Supuesto | Qué cambia si la respuesta es otra |
|---|---|---|
| **S-A** | **«Top 5» es la marca de cliente; el valor que impone lo elige el Director Comercial entre `High` y `Medium`. Top 5 y «alta» no tienen orden propio entre sí: empatan por rango y desempata la habilitación** (`packages/shared/src/prioridad.ts:101-109`) | Si Top 5 va por encima de «alta» (o por debajo), hace falta un rango nuevo: cambia el orden de la cola, el tablero por prioridad y qué significa `High` en un Top 5. Es otra tanda |
| S-B | «Media el resto» = el servidor pone `Medium` al nacer; la pedida en el alta deja de intervenir | Si la pedida debe seguir valiendo dentro de la lista, vuelve a `prioridadAlNacer` como último respaldo y el campo vuelve al formulario |
| S-C | No se reescribe ningún ticket existente | Hace falta un relleno: dato de producción, decisión de persona (§8) |
| S-D | Se levanta el límite «sólo Top 5» del ajuste | Se repone B1 (`409`) en la ruta, con sus pruebas de posición |
| S-E | La excepción del Director Técnico alcanza el ajuste por ticket (ruta y transición), no el `PUT` del cliente | Si alcanza al cliente, `apps/desk/server/routes/prioridad.ts:40` pasa al predicado nuevo |
| S-F | El Director Técnico ajusta por cargo, sin exigirle área; al Director Comercial se le sigue exigiendo la suya | Se añade el área al predicado |
| S-G | El Director Técnico ajusta cualquier ticket | Se añade una guarda de estado o de área del ticket, escalón B |
| S-H | Levantado el límite, un ticket sin cliente también se puede ajustar | Se repone el `409` de ticket sin cliente |
| S-I | *(nuevo, de esta propuesta)* Desmarcar un Top 5 sigue devolviendo cada ticket a **su base**, como hoy; un ticket que nace desde ahora bajo Top 5 tiene base `Medium` | Si «la calculada» debe ser siempre la de tres niveles, la reversión sube a `Medium` los `Low` y baja los `Urgent`: toca tickets existentes |
| S-J | *(nuevo, de esta propuesta; **cambiado el 2026-10-08**)* El ajuste manual protege SÓLO la prioridad con la marca `prioridad_en_app_at` (`apps/desk/server/db/prioridadCliente.ts:93`) y no escribe `managed_by_app`, `source` ni `modified_time`. Hasta `f08bed2` el supuesto era el contrario: seguía marcando `managed_by_app`, como fijaba RQ-TC-29 (`openspec/specs/tickets-core/spec.md:1174` en `6344b4a`) | Se vuelve a `managed_by_app`, que congela la fila entera frente a Zoho. Los ajustados antes del despliegue siguen congelados: liberarlos es un relleno |

## 6 · Regla invariable 13, decisión a decisión (regla de mutación 3)

| # | Decisión que toma el cliente | Dónde | Línea del servidor que la impone |
|---|---|---|---|
| 1 | Qué prioridades ofrece al fijar un Top 5 | `apps/desk/src/components/Top5Panel.tsx:87`, `:123` | `422` de `apps/desk/server/routes/prioridad.ts:42-43`, sobre la lista de `shared` |
| 2 | Qué prioridades ofrece al ajustar un ticket | `apps/desk/src/components/PanelPrioridad.tsx:67` | `422` de `apps/desk/server/routes/prioridad.ts:73-74` |
| 3 | A quién enseña «Ajustar» | `apps/desk/src/components/PanelPrioridad.tsx:27` (cae `data.top5 &&`; predicado nuevo) | `403` de `apps/desk/server/routes/prioridad.ts:71`, con el predicado nuevo |
| 4 | A quién enseña el campo de prioridad en una transición | `apps/desk/src/components/TransitionPanel.tsx:160` (predicado nuevo) | `403` de `apps/desk/server/services/ticketService.ts:131`, vía `packages/shared/src/prioridad.ts:81-86` |
| 5 | Ofrecer una prioridad en el alta | `apps/desk/src/components/CreateTicket.tsx:426-429` en `6344b4a`, lista escrita a mano; se enviaba en `:231` | `apps/desk/server/services/ticketService.ts:106`: el servidor deja de leerla. El desplegable se retira |
| 6 | A quién enseña los controles del Top 5 | `apps/desk/src/components/Top5Panel.tsx:20` | `403` de `apps/desk/server/routes/prioridad.ts:40`. Sin cambio |

Ninguna fila queda sin línea de servidor. La 5 es hoy una lista reescrita en el cliente (punto 1 de la regla): al
retirar el campo desaparece. Las filas 3 y 4 se cierran con prueba de servidor antes que el cliente (`strict_tdd`).

## 7 · Pruebas

**Nuevas:**

- **Borde de vigencia**, en la zona de la aplicación (`packages/shared/src/fechasDerivadas.ts:13`): el día del
  vencimiento el ticket nace `High`; el siguiente, `Medium`; un instante que ya es el día siguiente en UTC y sigue siendo
  el del vencimiento en la zona da `High` (`packages/shared/src/contratos.ts:61-63`); y con un contrato ampliado, el día
  siguiente al fin **original** sigue dando `High`.
- **Regla al nacer:** sin contrato ni Top 5 nace `Medium` aunque el cuerpo pida `High`, `Low` o nada; Top 5 `Medium` con
  contrato da `High`.
- **Predicado:** matriz de los ocho cargos, «sin cargo» y administrador, con y sin área.
- **Posición en la ruta, dos guardas a la vez** (regla de mutación 1): A<B (ticket inexistente y sin cargo: `404`) y B<C
  (Coordinador y sin motivo: `403`). Sustituyen a las de B1 (`apps/desk/server/prioridadTop5.test.ts:282`, `:287`).
- **Posición en la transición:** se conservan las tres de `apps/desk/server/services/guardaPrioridad.test.ts:122`
  (área, `422` y estado) y se añade el Director Técnico que sí pasa.
- **Sincronizador:** ticket venido de Zoho, de un cliente **que no es Top 5**, ajustado por el Director Técnico; la
  siguiente pasada de `upsertTicket` con otra prioridad no la pisa, con un ticket de control que sí se pisa. Lo sostiene
  la guarda de `packages/zoho-sync/src/db/repo.ts:71`, no la marca de `:76-78`. Es la gemela de
  `apps/desk/server/prioridadTop5.test.ts:320`, que hoy sólo cubre un cliente Top 5.

**Se invierten:** `apps/desk/server/prioridadTop5.test.ts:260` y `:269` (de `409` a `200`); las que afirman `Low` en
`packages/shared/src/prioridad.test.ts:115`.

**Mutaciones que deben ponerse rojas:** mover la guarda de permiso detrás del contenido; quitar el Director Técnico del
predicado; devolver `Low` a una sola de las dos listas; hacer que la pedida vuelva a intervenir; comparar la vigencia
con `<=` en vez de `<`.

## 8 · Dato de producción

**Nada se escribe al desplegar: ni esquema, ni relleno.**

- Los tickets que hoy tengan `Low`, `Urgent`, otro valor o ninguna prioridad **no se tocan**. Hipótesis: ningún código
  rompe al leerlos; se ordenan con su rango o con 0 (`packages/shared/src/prioridad.ts:22-23`).
- Un cliente Top 5 guardado con `Low` **deja de imponer** hasta que el Director Comercial lo vuelva a guardar con `High`
  o `Medium`: `prioridadTop5` falla cerrado ante un valor fuera de la lista (`packages/shared/src/prioridad.ts:34-36`).
  Sus tickets abiertos conservan el `Low` que recibieron. Va al paquete de despliegue.
- No se puede medir desde el repositorio cuántos hay. Consulta de **sólo lectura, no ejecutada**, para una persona con
  acceso a la base:

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

Nombres confirmados contra el esquema: `priority` y `status_type` (`packages/zoho-sync/src/db/schema.sql:23`),
`managed_by_app` (`packages/zoho-sync/src/db/schema.sql:41`), `prioridad_en_app_at`
(`packages/zoho-sync/src/db/schema.sql:710`); `client_id`, `top5`, `prioridad`, `actualizado_por` y `actualizado_at`
(`packages/zoho-sync/src/db/schema.sql:606-611`). La tabla `tickets` se crea sin calificar
(`packages/zoho-sync/src/db/schema.sql:20`) y vive en `desk`. El literal `'Closed'` es el que usa la propagación
(`apps/desk/server/db/prioridadCliente.ts:110`).

## 9 · Ficheros muy citados (regla de mutación 4)

| Fichero | Cómo se evita desplazar |
|---|---|
| `apps/desk/server/services/ticketService.ts` | Sólo la línea 106, en sitio. `git diff --numstat` con inserciones = borrados |
| `packages/shared/src/cargos.ts` | Sólo se añade al final |
| `packages/shared/src/prioridad.ts`, `contratos.ts`, `transitions.ts` | En sitio; si el diseño necesita líneas nuevas, al final del fichero |
| `apps/desk/server/routes/prioridad.ts` | Retirar B1 quita tres líneas: o se compensa en sitio, o entra en el barrido |
| Specs vivas | No se tocan hasta el archivo |

**Citas que este cambio vuelve históricas (caso C).** La propia decisión cita como estado de hoy
`packages/shared/src/prioridad.ts:13`, `:79` y `apps/desk/server/routes/prioridad.ts:71`, `:69`
(`openspec/config.yaml:4143-4144`, `:4149-4153`). Al cierre se anclan a `6344b4a` con qué las cerró; no se renumeran.
Barrido de completas y abreviadas sobre cada fichero tocado, leyendo qué afirma cada frase.

## 10 · Riesgos

| # | Riesgo | Prob. | Mitigación |
|---|---|---|---|
| 1 | **Levantar el límite extendía a cualquier ticket un efecto que sólo alcanzaba a los Top 5:** el ajuste manual ponía `managed_by_app` (`apps/desk/server/db/prioridadCliente.ts:93` en `f08bed2`) y con ella el sincronizador dejaba de escribir la fila **entera** (`packages/zoho-sync/src/db/repo.ts:71`). Para la orden de venta Gerencia descartó esa salida «porque congela el ticket entero» (`openspec/config.yaml:1654`) | Media | **Cerrado el 2026-10-08** por la corrección de S-J: el ajuste protege sólo la prioridad. Queda para Gerencia confirmar S-J y decidir sobre los ya ajustados |
| 2 | La reversión del Top 5 cambia de resultado sin que nadie lo pida (§4) | Media | S-I; lo fija el diseño y lo prueban los escenarios de reversión existentes, que deben seguir verdes sin editarse |
| 3 | El recambio de pruebas es mayor que el código: `Low` y la lista aparecen 202 veces en 16 ficheros de prueba (medido con búsqueda el 2026-10-07). Muchas son valores guardados y no cambian; las que asignan `Low` o esperan la pedida, sí | Alta | §11: `tasks` mide L1 antes de abrirlo y lo parte si pasa de la válvula |
| 4 | S-A no es lo que Gerencia quiere | Media | Reversible; pregunta E-nueva-1 |
| 5 | Controlar el reloj en la prueba de borde a través del alta | Baja | `hayContratoVigente` admite `hoy` inyectado; hipótesis: el reloj falso de la suite sirve para el camino completo. Lo comprueba el diseño |

**Condiciones de parada: ninguna.** No cuesta dinero, no escribe datos de producción, no cambia el alcance de la fila y
ningún supuesto contradice una decisión registrada.

## 11 · Lotes

Un intento del registro por lote, en este worktree. Estimaciones, no medidas; válvula 720, techo 800. Una línea
modificada cuenta dos.

| Lote | Contenido | Estimación |
|---|---|---|
| L1 | Lista `High`/`Medium` en las dos fuentes y regla al nacer, con el recambio de pruebas que arrastran y las de borde de vigencia | ~450-600 |
| L2 | Predicado nuevo, escalera del `POST` sin B1, guarda de transición, pruebas de posición y prueba del sincronizador | ~300-380 |
| L3 | Cliente (`.tsx` sin prueba, por decisión de Gerencia) y cierre documental: anclas de §9, bandeja, texto para el maestro | ~120-160 |
| Verify | El informe que la fase genera es sumando propio: los precedentes miden hasta 358 líneas | ~300-360 |

Si `tasks` mide L1 por encima de 720, se parte en L1a (lista) y L1b (regla al nacer). Antes de cerrar cada intento se
ejecuta la medida: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear.
El archivo va en intento aparte, con la regla del archivo.

## 12 · Por qué NO cierra F1B-07

La fila pide la prioridad automática completa, y falta el nivel que depende de la **valoración del cliente**: el punto 2
de la respuesta va entre corchetes, no hay dato utilizable en Zoho CRM y «la valoración del portal» no está definida.
La propia decisión lo dice (`openspec/config.yaml:4155`). Aquí no se inventa ni el dato ni su formato: se deja fuera.
Esta tanda es trabajo de F1B-07 que no la termina; no cuenta en el numerador del avance.

## 13 · Tareas de persona — fuera del recuento

Archivar este cambio **no las da por hechas**.

| | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Ejecutar la consulta del §8 y devolver el resultado | Persona con acceso a la base de producción | Paquete de despliegue | §8 de esta propuesta y la entrada de la bandeja |
| P-2 | Volver a guardar con `High` o `Medium` cada Top 5 que la consulta 3 devuelva | Director Comercial | Paquete de despliegue | Igual |
| P-3 | Responder a S-A … S-J (§5) y a las preguntas del §14 | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` | `docs/sdd/ENTRADA.md` |
| P-4 | Definir qué es la valoración del cliente y cómo llega a Desk | Gerencia | Punto abierto de F1B-07 | La decisión, consecuencia (3) |
| P-5 | Pegar en el maestro las correcciones de M1.9.1 que la tanda entrega como texto | Gerencia | Expediente del maestro | El texto entregado en el cierre |
| P-6 | Comprobar en la aplicación, tras desplegar: alta sin contrato nace media; el Director Técnico ajusta un ticket de un cliente que no es Top 5; un técnico no puede | Comercial y Servicio Técnico | Paquete de despliegue | Parte de la tanda |

## 14 · Preguntas para `docs/sdd/ENTRADA.md`

- **E-nueva-1** · ¿Top 5 y «alta» tienen un orden entre sí, o empatan (S-A)?
- **E-nueva-2** · Al desmarcar un Top 5, ¿el ticket vuelve a lo que tenía (S-I) o a la prioridad de tres niveles?
- **E-nueva-3** · Un ticket venido de Zoho al que se le ajusta la prioridad a mano conserva esa prioridad y sigue recibiendo
  de Zoho todo lo demás (S-J, corregido el 2026-10-08). ¿Se confirma, y qué se hace con los ajustados antes del despliegue?
- **E-nueva-4** · ¿El Director Técnico ajusta cualquier ticket, también los que no tienen cliente (S-G, S-H)?

## 15 · Reversión

- Código: `git revert` de cada lote, en orden inverso. Sin esquema que deshacer.
- Datos: los tickets nacidos `Medium` bajo esta regla se quedan `Medium`; cada ajuste del Director Técnico queda en
  `public.prioridad_ajustes` con su valor anterior (`packages/zoho-sync/src/db/schema.sql:613-620`) y se deshace con otro
  ajuste. Revertir el código vuelve a aceptar `Low`.

## 16 · Criterios de aceptación

1. La lista asignable y las opciones del campo `priority` son `High` y `Medium`, iguales; `Low` da `422` en el `PUT`
   del cliente y en el `POST` del ticket.
2. Sin contrato ni Top 5 el ticket nace `Medium`, pida lo que pida el cuerpo; con contrato vigente, `High`; con Top 5,
   la más alta de las dos.
3. El día del vencimiento nace `High` y el siguiente `Medium`, en la zona de la aplicación; con el contrato ampliado,
   sigue `High`.
4. El `PUT` del cliente sigue siendo sólo del Director Comercial y del administrador.
5. El `POST` del ticket lo aceptan Director Comercial, Director Técnico y administrador; el resto, `403`.
6. El `POST` sobre un ticket de un cliente que no es Top 5, o sin cliente, responde `200` con su traza.
7. El Director Técnico cambia la prioridad en las dos transiciones que la llevan; un técnico recibe `403`.
8. Las pruebas de posición activan dos guardas a la vez: A<B y B<C, en la ruta y en la transición.
9. Un ticket de Zoho ajustado en la aplicación conserva su prioridad tras `upsertTicket`; el de control no.
10. Los escenarios de propagación y reversión del Top 5 siguen verdes sin editar sus expectativas, salvo donde asignan `Low`.
11. El cliente no reescribe la lista ni ofrece prioridad en el alta; cada fila del §6 tiene su línea de servidor.
12. `ticketService.ts` cierra con cero líneas netas; el barrido de citas, sin roturas nuevas; las del §9, ancladas.
13. Cada lote cierra por debajo de 800 líneas medidas; `npm test`, `npm run typecheck` y `npm run lint` en verde.
14. Las mutaciones del §7 se ponen rojas.
