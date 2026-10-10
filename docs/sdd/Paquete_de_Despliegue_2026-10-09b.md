# Paquete de despliegue — 2026-10-09 (b), adenda al consolidado

Adenda corta a `docs/sdd/Paquete_de_Despliegue_2026-10-09.md`, que **no se edita**: es un registro fechado y sigue
siendo el documento que se lee para publicar. Esta adenda recoge **sólo** lo que cambian las tres respuestas de
Gerencia del 2026-10-09 a la parte A de `docs/sdd/Preguntas_Gerencia_2026-10-09.md`. Donde las dos digan cosas
distintas, vale esta adenda.

**Este documento no publica nada y ninguna sesión ejecuta sus consultas.** Las respuestas están registradas, con su
texto literal, en `openspec/config.yaml` → `decisiones_de_gerencia_adenda`:

| Pregunta | Clave | Qué cambia en el paquete |
|---|---|---|
| 1 · E-158 | `decision/e158-equipo-nuevo-lleva-remision` | §0 (c): se retira la confirmación; quedan los dos recuentos |
| 2 · S-4 de F1B-19 | `decision/s4-f1b19-resumen-de-provisionales-no-se-construye` | §0 (e): condición nueva, que sustituye a la anterior |
| 3 · cargos | `decision/cargos-se-asignan-tras-publicar-fuera-de-horario` | §0 (d): quién asigna y cuándo; falta la tabla |

El commit que se publica **no cambia**: el código sigue siendo el de `509b905`. Lo leído contra el código en esta
adenda se leyó en el árbol de `7b5edfd`; lo que no se pudo contrastar desde el repositorio lleva la palabra
**hipótesis**.

---

## 1 · E-158 resuelta — se retira de las condiciones de parada

Respuesta de Gerencia: «sí, el equipo nuevo lleva remisión de entrada; se publica sin excepción.»

- **Se retira el punto 1 de la condición (c)** del consolidado: ya no hay confirmación pendiente. Se publica el
  código tal cual, con la guarda de «Habilitar Servicio» para toda clasificación
  (`apps/desk/server/services/ticketService.ts:273-277`). No se construye ninguna excepción.
- **Se retira también la atadura de la condición (l):** la fecha de F1F-05 —en producción antes del viernes
  13/11/2026— ya no depende de E-158.
- **Sigue en pie el punto 2 de la condición (c):** los dos recuentos de sólo lectura
  (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`,
  `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`). La respuesta no los nombra. Dicen cuántos
  tickets quedarán sin poder habilitarse hasta tener su remisión, y cuántos de ellos son de «Equipo nuevo»: con la
  respuesta de hoy ese número deja de decidir si se publica y pasa a decir **cuánto trabajo de remisiones espera a
  Servicio Técnico el primer día**.
- En las tablas de tareas del consolidado, la tarea 1 de §6.0 y la primera fila de §6.4 quedan **hechas**.

## 2 · Condición de parada nueva — la tabla de clientes provisionales

Respuesta de Gerencia, en dos partes: «al publicar, un único resumen a Comercial con las coincidencias de NIT que ya
existían; después, un aviso por cada coincidencia nueva, una sola vez.» Y, tras el contraste del analista: «de
acuerdo, no se construye el resumen. Registra mi respuesta literal y añade la condición de parada: antes de publicar
se comprueba si la tabla de clientes provisionales existe y tiene filas; si las tiene, se para y se construye el
resumen.»

**Por qué no se construye el resumen.** `public.clientes_provisionales` la crea este mismo despliegue
(`packages/zoho-sync/src/db/schema.sql:658`) y no existe en `ae5aaf4`. Si producción está en `ae5aaf4` —hipótesis 1
del consolidado—, la tabla nace vacía y no hay coincidencias anteriores que resumir. La condición de parada es lo
que comprueba esa hipótesis en el único punto en que importa.

**La condición sustituye a la de §0 (e) del consolidado**, que contaba sólo los provisionales sin enlazar y remitía
a una respuesta de Gerencia que ya está dada.

**La comprobación, antes de publicar.** En la base `desk`, de sólo lectura, en dos pasos: el segundo **sólo** se
ejecuta si el primero devuelve la tabla, porque contra una tabla que no existe da error.

```sql
BEGIN READ ONLY;

-- Paso 1. ¿Existe la tabla?
SELECT to_regclass('public.clientes_provisionales') AS tabla;
-- NULL  → no existe: condición CUMPLIDA, se publica. No ejecutar el paso 2.
-- Devuelve el nombre → existe: ejecutar el paso 2.

-- Paso 2. Sólo si el paso 1 devolvió la tabla. ¿Tiene filas?
SELECT count(*)                                    AS filas,
       count(*) FILTER (WHERE enlazado_a IS NULL)  AS sin_enlazar
  FROM public.clientes_provisionales;
-- filas = 0 → condición CUMPLIDA, se publica.
-- filas > 0 → PARAR. No se publica: se construye antes el resumen.

ROLLBACK;
```

| Resultado | Qué se hace |
|---|---|
| La tabla no existe | **Publicar.** |
| Existe y está vacía | **Publicar.** Además, producción no está en `ae5aaf4`: revisar con qué commit se parte (§4.3 del consolidado) antes de seguir |
| Existe y tiene filas | **PARAR.** Se construye el resumen antes de publicar: código nuevo, otro commit y otro paquete. `sin_enlazar` es sólo informativo: la condición de Gerencia dice «tiene filas», sin más filtro |

La consulta no se ha ejecutado contra PostgreSQL: que devuelva lo dicho con el rol con que se ejecute es
**hipótesis**, la misma que la número 10 del consolidado.

**Lo que no cambia.** Desde el día de la publicación, cada coincidencia nueva avisa **una sola vez**: ya está
construido así (`packages/zoho-sync/src/db/schema.sql:817`,
`apps/desk/server/services/avisoProvisionalEnBooks.ts:76`). El aviso es uno por coincidencia **y por
destinatario**: lo recibe cada persona con el área Comercial y cada administrador
(`apps/desk/server/services/avisoProvisionalEnBooks.ts:72`, `apps/desk/server/db/avisos.ts:89`).

En las tablas del consolidado, la tarea 3 de §6.0 se hace con la consulta de arriba para la tabla de provisionales
—la lectura de `public.prioridad_ajustes`, condición (f), no cambia— y la tarea 4 queda **hecha**.

## 3 · Procedimiento de cargos — en este orden

Respuesta de Gerencia: «Los cargos los asigno yo como administrador justo después de publicar y antes de abrir la
aplicación al equipo. Se publica fuera del horario de trabajo y aviso al equipo cuando estén asignados y
comprobados, en especial "Director Técnico" y "Especialista técnico".»

Los cargos no se pueden asignar antes: el campo lo crea este despliegue
(`packages/zoho-sync/src/db/schema.sql:601`) y la ruta que lo escribe llega en el mismo código
(`apps/desk/server/auth/routes.ts:99-100`).

1. **Publicar fuera del horario de trabajo.** Entran aquí las tareas 20, 21 y 24 de §6.0 del consolidado, con sus
   comprobaciones de §4.5: si la columna `cargo_permiso` no entró, nadie puede iniciar sesión
   (`apps/desk/server/auth/sessions.ts:17`).
2. **Gerencia asigna los cargos como administrador**, en la pantalla de usuarios, con la tabla de cargos y personas
   delante (§4). El texto se elige de la lista cerrada de ocho (`packages/shared/src/cargos.ts:12-15`); el servidor
   rechaza cualquier otro (`packages/shared/src/cargos.ts:97`).
3. **Comprobar «Director Técnico» y «Especialista técnico»** con una lectura, en la base `desk`:

   ```sql
   BEGIN READ ONLY;

   -- (a) Quién tiene cada cargo. Se compara, fila a fila, con la tabla de cargos y personas.
   SELECT cargo_permiso, name, active, is_admin
     FROM public.users
    WHERE cargo_permiso IS NOT NULL
    ORDER BY cargo_permiso, name;

   -- (b) Los dos que Gerencia nombra: cuántas personas ACTIVAS tiene cada uno.
   SELECT cargo_permiso, count(*) AS personas_activas
     FROM public.users
    WHERE active AND cargo_permiso IN ('Director Técnico', 'Especialista técnico')
    GROUP BY cargo_permiso;
   -- Deben salir las dos filas, con el número de personas que diga la tabla.

   -- (c) Ningún texto fuera de la lista (se leería como «sin cargo»). Debe devolver cero filas.
   SELECT name, cargo_permiso
     FROM public.users
    WHERE cargo_permiso IS NOT NULL
      AND cargo_permiso NOT IN ('Director Técnico', 'Coordinador Técnico', 'Técnico', 'Técnico de campo',
                                'Director Comercial', 'Coordinador Comercial', 'Asistente Comercial',
                                'Especialista técnico');

   ROLLBACK;
   ```

   El resultado contiene nombres de personas: se devuelve como «coincide con la tabla» o «no coincide, y en qué»,
   sin pegar la salida en ningún chat. La consulta no se ha ejecutado: **hipótesis**, como la número 10.

   Dos cosas que la lectura no dice y hay que saber:

   - **«Director Técnico» necesita además el área Servicio Técnico** para mantener la lista de novedades y añadir
     accesorios (`packages/shared/src/mantenimientoNovedades.ts:15-18`). El área viene del rol, no del cargo: se mira
     en la misma pantalla de usuarios.
   - **«Especialista técnico» no abre hoy ningún acto.** En el código sólo aparece en la lista cerrada
     (`packages/shared/src/cargos.ts:14`); ninguna operación lo exige. Comprobarlo es comprobar que quedó guardado
     con el texto exacto. Si Gerencia espera que ese cargo permita algo desde el primer día, **es una pregunta
     abierta, no un defecto de la asignación**.

4. **Sólo entonces, avisar al equipo.** Después de los cargos y antes del aviso va el Top 5 (tarea 23 de §6.0):
   fijarlo exige el cargo Director Comercial (`apps/desk/server/routes/prioridad.ts:40`).

**Mientras los cargos no estén asignados, estas operaciones quedan sólo para el administrador:**

| Cargo que exige | Operación | Dónde lo impone el servidor |
|---|---|---|
| Director Comercial | «Liberación sin factura» | `apps/desk/server/services/ticketService.ts:131`; regla en `packages/shared/src/cargos.ts:45-53` |
| Director Comercial, con área Comercial | Fijar la prioridad de un cliente y su Top 5 | `apps/desk/server/routes/prioridad.ts:40`; regla en `packages/shared/src/cargos.ts:80-83` |
| Director Comercial con área Comercial, o Director Técnico | Ajustar la prioridad de un ticket | `apps/desk/server/routes/prioridad.ts:71`; regla en `packages/shared/src/cargos.ts:104-107` |
| Director Técnico | Asociar una orden OVI: en el alta, en una transición y en la remisión de entrada | `apps/desk/server/services/ticketService.ts:44`, `apps/desk/server/services/ticketService.ts:131`, `apps/desk/server/routes/remision.ts:220`; regla en `packages/shared/src/cargos.ts:71-74` |
| Director Técnico | Responder y avanzar la ficha de reclamación al fabricante | `apps/desk/server/routes/garantiaProveedor.ts:43`; regla en `packages/shared/src/garantiaProveedor.ts:89-92` |
| Director Técnico, con área Servicio Técnico | Mantener la lista de novedades | `apps/desk/server/routes/novedades.ts:27`, `apps/desk/server/routes/novedades.ts:32`, `apps/desk/server/routes/novedades.ts:43` |
| Director Técnico, con área Servicio Técnico | Añadir accesorios a un modelo | `apps/desk/server/routes/accesoriosModelo.ts:25` |

Publicar fuera del horario de trabajo hace que el equipo no viva ese intervalo. El efecto mayor, si se abriera la
aplicación antes de tiempo: un ticket de «Garantía» sólo admite una orden OVI
(`packages/shared/src/ordenOVI.ts:61-64`), así que sin Director Técnico asignado ninguno recibe orden salvo por el
administrador.

## 4 · Tarea de persona pendiente — la tabla de cargos y personas

**No ha llegado, y no se ha inventado.** Dueño: Gerencia. Es una fila por persona con su nombre, su cargo de entre
los ocho de `packages/shared/src/cargos.ts:12-15` y su área. Sin ella, el paso 2 del procedimiento no tiene de dónde
leer y el paso 3 no tiene contra qué comparar. Es la tarea 5 de §6.0 del consolidado, y sigue siendo **previa a
publicar**: la respuesta de hoy dice quién asigna y cuándo, no quién lleva cada cargo.

## 5 · Cómo quedan las doce condiciones de parada

| Condición del consolidado | Tras las respuestas del 09/10 |
|---|---|
| (a) Copia comprobada de `desk` | Igual |
| (b) F1C-09: despliegue y migración en el mismo corte | Igual |
| (c) E-158 y los dos recuentos | **Reducida:** sólo los dos recuentos (§1) |
| (d) Los cargos | **Reducida:** falta sólo la tabla de cargos y personas (§4); el procedimiento es el de §3 |
| (e) La ráfaga de avisos de provisionales | **Sustituida** por la condición de §2 |
| (f) Tickets con prioridad ajustada antes | Igual |
| (g) Permiso de búsqueda de Zoho | Igual |
| (h) `SWEEP_ENABLED` y `SWEEP_DRY_RUN` | Igual |
| (i) Las tres columnas de `tickets` | Igual |
| (j) `public.nit_exentos` | Igual |
| (k) Los tres interruptores ausentes | Igual |
| (l) F1F-05 antes del viernes 13/11/2026 | Igual la fecha; **ya no depende de E-158** |

Siguen siendo doce. Ninguna respuesta de Gerencia queda pendiente para publicar: lo que falta es la tabla de §4 y
las comprobaciones de persona del consolidado.
