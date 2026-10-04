---
tanda: F1B-08
motivo: ""
capacidad: [vistas-tablero]
maestro: ["M7.5"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — Búsqueda por número de ticket y por serial en el listado

Base: worktree `busqueda-ticket-serial`, nacido de `main` en `2a74fdc`. Exploración comprobada cita a cita en
`openspec/changes/busqueda-ticket-serial/exploration.md`.

## 1 · Intención

El listado de tickets no tiene caja de búsqueda y su endpoint sólo lee `scope` y `page`
(`apps/desk/server/routes/tickets.ts:104-116`). En Zoho Desk sí se busca por número y por serial, y Zoho deja
de estar disponible en el corte del 14/12: sin esto se pierde algo que hoy existe.

**La letra de Gerencia, que manda:**

- `openspec/config.yaml:3469` (`decision/trabajo-del-01-10-antes-del-corte-sin-fila`, `respuesta_textual`):
  «(1) la búsqueda por número de ticket y serial entra en F1B-08, antes del corte».
- `docs/sdd/ENTRADA.md:1579` (E-133): «El serial se filtra con búsqueda parcial (por ejemplo, los últimos
  dígitos), con la misma lógica que el autocompletado por serial de la recepción. En el listado de tickets, la
  búsqueda por número de ticket y por serial es paridad con Zoho Desk y debe estar antes del corte del 14/12; si
  ya existe, solo se confirma. En el cuadro de mando con indicadores entra con el resto de los filtros, en Fase 2.»

Comprobado en la letra: (a) serial PARCIAL, con el ejemplo de los últimos dígitos, es decir «contiene» y no
«empieza por»; (b) la MISMA lógica que el autocompletado de la recepción, que es `searchEquipos`
(`apps/desk/server/db/equipos.ts:59-74`); (c) paridad con Zoho en el listado; (d) «si ya existe, solo se
confirma»: medido, **no existe** (`docs/sdd/ENTRADA.md:1582` y exploración §1).

Maestro vigente: M7.5, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3061-3062`, y
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1152`. Ya recoge el pasaje: por eso
`toca_maestro: no`.

**Por qué `cierra: no`:** la otra mitad de F1B-08, «vistas equivalentes a Zoho», sigue sin contenido decidido
(`docs/sdd/Preguntas_Gerencia_2026-09-29.md:93`) y queda fuera.

## 2 · Alcance

### Dentro

1. Parámetro `q` en `GET /api/tickets` (activos, `scope=all`, cerrados paginados **y su recuento**) y en
   `GET /api/mis-tickets`. Filtra el servidor.
2. Un único normalizador en `packages/shared` (`.ts` probado) que consumen la búsqueda de tickets **y**
   `searchEquipos`.
3. Prueba que ENFRENTA las dos búsquedas sobre la misma tabla de casos (molde H5).
4. Caja de búsqueda en la cabecera del listado; el cliente sólo envía el texto.
5. Delta de `vistas-tablero`: requisitos nuevos, añadidos al final.

### Fuera

- Vistas equivalentes a Zoho (resto de F1B-08).
- Filtros del cuadro de mando (Fase 2, por la letra de E-133).
- Buscar por asunto, cliente o contacto: la letra dice número y serial.
- Índice nuevo, `pg_trgm`, cambios de esquema.
- Ampliar el DTO del listado con el serial.
- Relleno de `tickets.serial` en filas históricas (dato de producción).
- IV-9, IV-11, IV-12 y la guarda equipo↔cliente: no se tocan.

## 3 · Capacidades

### Nuevas
Ninguna.

### Modificadas
- `vistas-tablero`: **sólo se añade**. El último requisito es RQ-VT-09 (`openspec/specs/vistas-tablero/spec.md:299`)
  y el fichero termina en la línea 368; lo nuevo va detrás y no desplaza nada.
  - **RQ-VT-11** · El listado se busca en el servidor por número y por serial (activos, cerrados con su `total`,
    «Mis tickets»).
  - **RQ-VT-12** · La búsqueda por serial y el autocompletado de la recepción comparten una sola implementación
    del patrón, con prueba que las enfrenta.
  - **RQ-VT-13** · Caja de búsqueda del listado: verificación de persona (`.tsx` fuera de la red; no se propone `jsdom`).

Hipótesis: ningún requisito vivo fija cómo trata `searchEquipos` los espacios de `q`; `sdd-spec` lo comprueba
antes de dar por bueno el recorte del supuesto S-3.

## 4 · Enfoque

**Predicado, sin `CAST` ni `TRIM` en SQL (pg-mem):**

- Número: igualdad entera `t.number = $n`. Sólo si `q`, quitado un `#` inicial, es todo dígitos y cabe en `integer`.
- Serial: `LOWER(t.serial) LIKE $p OR LOWER(e.serial) LIKE $p`, con `e` el equipo enlazado por `t.equipo_id`.
- Los dos unidos por `OR`, y el conjunto entre paréntesis y con `AND` detrás del filtro de estado.
- `q` vacío o sólo espacios: sin filtro; el listado responde lo mismo que hoy.

**Corrección a la exploración, con evidencia.** Recomendaba buscar sólo en `tickets.serial`. El serial de un
equipo se puede editar (`apps/desk/server/db/equipos.ts:137`, `apps/desk/server/db/equipos.ts:150`) y nada
actualiza la copia del ticket, salvo el relleno puntual de `apps/desk/server/backfillSerial.ts:16`. Buscando
sólo en la copia, un ticket no aparecería por el serial CORREGIDO de su equipo, que es justo «el serial del
equipo» de la letra. Se busca en las dos columnas; el serial viejo sigue encontrando el ticket.

**Piezas:**

| Pieza | Dónde | Probada |
|---|---|---|
| `patronSerial(q)` (recorta, minúsculas, envuelve en `%`) y `leerBusquedaTickets(q)` → `{ numero, patron }` o error de longitud | `packages/shared/src/busquedaTickets.ts` (nuevo) | sí |
| Fragmento SQL parametrizado, con índice de parámetro de partida (`$2` en activos, `$4` en cerrados) | `packages/zoho-sync/src/db/busquedaTickets.ts` (nuevo) | sí, vía `repo.test.ts` |
| Middleware que valida `q` y deja el filtro en `res.locals` | `apps/desk/server/util/busquedaTickets.ts` (nuevo) | sí, vía `tickets.test.ts` |
| `searchEquipos` pasa a usar `patronSerial` | `apps/desk/server/db/equipos.ts:60`, en su sitio | sí, confrontación |
| Añadir `q` a la URL | `apps/desk/src/lib/busquedaTickets.ts` (nuevo) | sí |
| Caja con espera entre pulsaciones | `apps/desk/src/components/BuscadorTickets.tsx` (nuevo) | no: persona |

## 5 · Regla 13, decisión a decisión

Las líneas del servidor son las de HOY donde aterriza cada imposición; `sdd-apply` las vuelve a medir.

| # | Qué hace el cliente | Quién lo impone | Clase |
|---|---|---|---|
| 1 | Envía el texto tal cual | El servidor lo normaliza y filtra: middleware en `apps/desk/server/routes/tickets.ts:104`, consultas de `packages/zoho-sync/src/db/repo.ts:151`, `packages/zoho-sync/src/db/repo.ts:166` y `packages/zoho-sync/src/db/repo.ts:186` | consume |
| 2 | **No** filtra por `q` lo recibido | No hay decisión en cliente | — |
| 3 | No quita `#`, no pasa a minúsculas, no recorta | `leerBusquedaTickets`, sólo en servidor | consume |
| 4 | `maxLength` 64 en la caja | `422` del middleware | comodidad con imposición probada |
| 5 | Vuelve a la página 1 al cambiar `q` (`apps/desk/src/App.tsx:59`) | El `total` filtrado lo calcula el servidor (`apps/desk/server/routes/tickets.ts:109`); una página fuera de rango devuelve `items` vacío | comodidad |
| 6 | Pagina con el `total` que recibe (`apps/desk/src/App.tsx:134-142`) | `apps/desk/server/routes/tickets.ts:109-110` | consume |
| 7 | Filtro de vista sobre el resultado (`apps/desk/src/lib/boardView.ts:38-56`) | No es guarda: filtro de VISTA declarado (`apps/desk/src/lib/boardView.ts:33-37`). No cambia | vista |
| 8 | «Mis tickets» con `q` | `apps/desk/server/routes/prioridad.ts:85` filtra `esDeMisTickets` tras la búsqueda | consume |
| 9 | Espera entre pulsaciones | Sin regla de dominio | comodidad |

Ninguna decisión queda sólo en el cliente.

## 6 · Supuestos (razonables y reversibles) y preguntas para la bandeja

| # | Supuesto | Reversión |
|---|---|---|
| S-1 | El número coincide **exacto**: «864» y «#864» encuentran el 864; «86» no. La letra pide parcial sólo para el serial | Cambiar el predicado del número |
| S-2 | Serial sin distinguir mayúsculas, como el autocompletado | — |
| S-3 | `q` se recorta por los extremos. **Efecto colateral declarado:** al compartir `patronSerial`, el autocompletado de la recepción también recorta; hoy no lo hace (`apps/desk/server/db/equipos.ts:60`). Los espacios interiores se conservan | Quitar el recorte de `patronSerial` |
| S-4 | `%` y `_` no se escapan: es lo que hace hoy el autocompletado y «misma lógica» manda. No abre nada: todos ven todos los tickets | Escapar en `patronSerial` (afecta a las dos búsquedas a la vez) |
| S-5 | Un `q` de sólo dígitos busca en número **y** en serial | Predicado |
| S-6 | La búsqueda **respeta la vista activa**. La vista inicial es «Todos» (`apps/desk/src/App.tsx:57`), así que por defecto es global | Ignorar la vista cuando hay `q` |
| S-7 | Longitud máxima 64; más largo, `422` | Constante |
| S-8 | Sin mínimo de caracteres en servidor (el autocompletado tampoco lo impone) | Constante |

**Preguntas para la bandeja** (ninguna para la cadena; se construye con el supuesto):

- **E-nueva-1** · Con texto en la caja, ¿se busca dentro de la vista activa (S-6) o siempre en todos los tickets?
  Decide Gerencia; desbloquea cerrar S-6.
- **E-nueva-2** · ¿El número de ticket se busca exacto (S-1) o también parcial, como el serial? Hipótesis: en
  Zoho es exacto. Decide Gerencia.
- **E-nueva-3** · Los tickets de Zoho sin serial en su columna ni en el asunto no se encuentran por serial.
  ¿Hace falta un relleno? Es dato de producción: decide Gerencia y antes hay que medir cuántos son.
- **E-nueva-4** · ¿La paridad con Zoho en la búsqueda incluye asunto, cliente o contacto? La letra dice número
  y serial, y eso se construye. Pertenece a la pregunta abierta de «vistas equivalentes».

## 7 · Ficheros muy citados y regla de mutación 4

**Objetivo: cero líneas netas en los cinco.** Se edita en su sitio; las importaciones se unen con `;` a una línea
de importación existente (precedente: `apps/desk/server/routes/tickets.ts:5` y `apps/desk/server/routes/tickets.ts:9`).

| Fichero | Cómo se edita | Líneas con cita por debajo del punto, si no se pudiera evitar |
|---|---|---|
| `apps/desk/server/routes/tickets.ts` | Middleware en la línea 104; `q` en las líneas 108, 109 y 114 | **50** en 34 ficheros (citas a la línea 117 o posterior) |
| `packages/zoho-sync/src/db/repo.ts` | Firma, `WHERE`, `JOIN` y parámetros de las cuatro funciones, en sus líneas | **238** en 92 ficheros (línea 191 o posterior) |
| `apps/desk/src/App.tsx` | Estado unido a la línea 58; líneas 59, 63, 66, 69, 71 y 107 en su sitio | **32** en 15 ficheros (línea 60 o posterior) |
| `apps/desk/src/api/client.ts` | Las tres funciones de listado, en su sitio | **21** en 19 ficheros (línea 28 o posterior) |
| `apps/desk/server/db/equipos.ts` | Línea 60 en su sitio | 0 si se cumple; no medido en otro caso |

Medido con `grep` en modo recuento (cuenta LÍNEAS con cita, no ocurrencias; no ve la forma abreviada).
`apps/desk/server/routes/prioridad.ts:85` y `apps/desk/server/db/ticketsConCliente.ts:26-34` también se editan
en su sitio. El cierre comprueba `git diff --numstat` de los cinco: **inserciones = borrados**. Si alguno no
cuadra, barrido completo de la regla de mutación 4 sobre ese fichero antes de asentar.

## 8 · Qué queda sin prueba automática

- `BuscadorTickets.tsx` y el cableado de `App.tsx`: comprobación de persona en la aplicación.
- Toda la lógica sale a `.ts` probado: normalizar, extraer el número, el patrón, el fragmento SQL, la URL.
- La espera entre pulsaciones se queda en el `.tsx`: no decide nada de dominio.

## 9 · Estimación por lote

Pruebas × 1,8, más las casillas de `tasks.md` (2 líneas por casilla). Válvula 720, techo 800.

| Lote | Producción | Pruebas (base → ×1,8) | Casillas | Total |
|---|---|---|---|---|
| **1 · Núcleo**: normalizador compartido, fragmento SQL, `repo.ts`, `searchEquipos`, confrontación | 90 | 180 → 324 | 8 → 16 | **430** |
| **2 · Puertas y cliente**: middleware, `tickets.ts`, `prioridad.ts`, `ticketsConCliente.ts`, URL, `App.tsx`, caja | 130 | 140 → 252 | 12 → 24 | **406** |

En un solo lote serían 836: **no cabe, se parte en dos**. La exploración daba 230-330 sin el factor ni las casillas.
Antes de cerrar cada intento se ejecuta la medida real (`git diff --shortstat --no-renames` más `wc -l` de lo
nuevo sin trackear).

## 10 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Quinta noción de serial (H5) | Media | Un solo `patronSerial`; confrontación; mutación M-4 |
| El `OR` sin paréntesis cuela cerrados entre los activos | Media | Criterio 6 |
| El recuento de cerrados no aplica `q` y la paginación miente | Media | Criterio 5 |
| pg-mem no acepta el `JOIN` a `equipos` o el `LIKE` sobre él | Baja | Primera prueba en rojo del lote 1; si falla, se para y decide el diseño |
| Desplazar líneas citadas | Media | §7, con comprobación de `numstat` |
| `LIKE '%x%'` recorre la tabla entera | Baja | Hipótesis: miles de filas. El paquete de despliegue pide el recuento real |
| El recorte cambia el autocompletado de la recepción | Baja | S-3 declarado; las pruebas de `apps/desk/server/db/equipos.test.ts` siguen verdes |

## 11 · Reversión

Sin esquema, sin datos, sin variables de entorno: revertir es `git revert` del commit de fusión. Reversión
parcial: retirar la caja deja `q` sin emisor y el listado igual que hoy, porque `q` ausente no filtra.

## 12 · Qué añade al paquete de despliegue

- Nada de esquema, índices, variables ni migración.
- Servidor y cliente salen en el mismo artefacto: no hay orden entre ellos.
- Dato a pedir a quien despliegue: `SELECT count(*) FROM desk.tickets`, para confirmar la hipótesis de tamaño.
- Pasos de verificación en la aplicación (tarea de persona, fuera del recuento): buscar un número con y sin
  `#`; los últimos dígitos de un serial; un serial en minúsculas; un ticket cerrado de una página que no sea la
  primera; lo mismo en «Mis tickets»; borrar el texto y ver el listado completo.

## 13 · Dependencias

Ninguna externa. La regla del ciclo 3 ya se cumple: worktree propio.

## 14 · Criterios de aceptación

1. `GET /api/tickets?q=864` y `?q=%23864` devuelven el ticket 864; `?q=86` no lo devuelve por número.
2. `?q=` con los últimos dígitos de un serial devuelve el ticket; también con el texto en otra caja de letras y
   con espacios a los lados.
3. Un ticket cuyo equipo cambió de serial se encuentra por el serial nuevo y por el viejo.
4. `q` ausente, vacío o de espacios: misma respuesta que hoy, byte a byte, en activos, cerrados y «Mis tickets».
5. `scope=closed&q=…`: `total` es el recuento FILTRADO y la página 2 trae los siguientes. **Mutación:** quitar
   `q` del recuento pone rojo.
6. **Mutación de posición (regla 1):** un cerrado que casa por serial NO sale en activos, y un activo que casa
   NO sale en cerrados. Sacar el `OR` de sus paréntesis, o ponerlo antes del filtro de estado, pone rojo.
7. **Mutación de posición (regla 1), segunda:** sin sesión y con `q` de 65 caracteres responde `401`, no `422`;
   con sesión, `422`. Montar el middleware de búsqueda delante de `requireAuth` pone rojo.
8. `GET /api/mis-tickets?q=…` sólo devuelve los del usuario, en el orden de la cola del taller.
9. **Confrontación (H5):** la misma tabla de casos (últimos dígitos, centro, mayúsculas, espacios, `%`, `_`,
   vacío) da el mismo veredicto en `searchEquipos` y en la búsqueda de tickets. **Mutación M-4:** devolver
   `searchEquipos` a su patrón propio pone rojo.
10. Mutaciones del predicado, cada una con su rojo: «contiene» → «empieza por»; quitar `LOWER`; igualdad del
    número → `LIKE`.
11. Un `q` de dígitos que no cabe en `integer` no rompe la consulta: busca sólo por serial.
12. `git diff --numstat` de los cinco ficheros del §7: inserciones = borrados.
13. `npm test`, `npm run typecheck` y `npm run lint` en verde.
14. Persona, en la aplicación: los pasos del §12.

**Regla de mutación 2 (fichero vigilado): no aplica.** No se añade ningún guardián que lea un fichero de datos
ni se toca `schema.sql`. Si el diseño acabara añadiendo un índice, entra en el guardián existente de
`packages/zoho-sync/src/db/migrate.test.ts` y la mutación se haría ensuciando el `.sql`.
