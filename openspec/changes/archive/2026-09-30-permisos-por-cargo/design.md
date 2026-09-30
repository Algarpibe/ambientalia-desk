# Diseño: permisos por cargo (F1C-05 mínima)

F1C-05, `cierra: no`. Entrada: `proposal.md` (S-1…S-8) y `exploration.md`. La spec se escribe en paralelo y este
diseño no depende de ella. Líneas leídas contra el árbol de `e591454` el 2026-09-30; lo no ejecutado va marcado
**«hipótesis»**. No se ha corrido la suite. Supera el tope de 800 palabras de la fase porque la instrucción del
orquestador exige once apartados con ruta y línea.

## Enfoque técnico

La regla es pura y vive en un fichero NUEVO, `packages/shared/src/cargos.ts`: lista cerrada, tabla de excepciones
como dato y funciones que COMPONEN el área (`canExecuteTransition`, `permissions.ts:4-7`, intacta) con la
restricción de cargo. El cargo de permiso es una columna nueva, `public.users.cargo_permiso`, separada del
`users.cargo` de firma (`schema.sql:115`). El servidor la lee en la sesión y la impone en `ticketService.ts:131`.
En los ficheros muy citados sólo hay ediciones **en sitio** o **al final**; la única inserción es `auth/routes.ts`
(§10).

## Decisiones

| # | Decisión | Rechazado | Por qué |
|---|---|---|---|
| D-1 | Fichero nuevo `cargos.ts` que importa `canExecuteTransition` y lo compone | 4.º parámetro en `canExecuteTransition`; campo `cargo?` en `Transition` | La firma tiene seis llamadores (`exploration.md` §2) y `transitions.ts` 413 líneas con cita; el fichero nuevo no desplaza nada |
| D-2 | Excepción de transición por **id** (`liberacion_sin_factura`, `transitions.ts:246`) | Por nombre o por estado destino | El id es la clave de `transicionPorId` (`ticketService.ts:122`); una prueba exige que toda clave exista en un catálogo |
| D-3 | Admin pasa siempre | Exigir cargo también al admin | Coherente con `permissions.ts:5`; es además la salida operativa mientras nadie tenga cargo (§6) |
| D-4 | **Sin `CHECK`** en base (S-3) | `CHECK (cargo_permiso IN (…))` | Sería una segunda copia de la lista y cada cargo nuevo exigiría migración; el valor fuera de lista se lee como `null` (falla cerrado, D-5) |
| D-5 | Fallo cerrado en la LECTURA: `rowToPublicUser` devuelve `null` si `!esCargo(row.cargo_permiso)` | Confiar en la base | Un valor escrito a mano en producción no puede conceder nada |
| D-6 | Primitivas (b) y (c) sólo con la mitad de cargo (+ admin) | Inventar el área de un acto que no existe | El área la pone el acto cuando F1B-03/F1B-07 lo construyan; su docstring lo dice |
| D-7 | S-7 en sitio: `transitions.ts:52` pasa a `cargo: import('./cargos').Cargo` | `import` en la línea 1 | `transitions.ts` no tiene ninguna importación; una línea nueva desplazaría todo el fichero |

## 1 · Módulo `packages/shared/src/cargos.ts` (nuevo)

```ts
export const CARGOS = ['Director Técnico', 'Coordinador Técnico', 'Técnico', 'Técnico de campo',
  'Director Comercial', 'Coordinador Comercial', 'Asistente Comercial'] as const   // config.yaml:2589
export type Cargo = (typeof CARGOS)[number]
export function esCargo(x: unknown): x is Cargo            // igualdad exacta, sin plegar

export const EXCEPCIONES_POR_CARGO: {
  readonly transiciones: Readonly<Record<string, Cargo>>    // { liberacion_sin_factura: 'Director Comercial' }
  readonly crearOVIGarantia: Cargo                          // 'Director Técnico'  (config.yaml:1543-1558)
  readonly fijarPrioridadTop5: Cargo                        // 'Director Comercial' (config.yaml:1949-1962)
}

export interface SujetoDePermiso { areas: string[]; isAdmin: boolean; cargoPermiso?: Cargo | null }
/** El cargo que exige la transición y el sujeto no tiene; null si no hay excepción, si lo tiene o si es admin. */
export function cargoQueFaltaParaTransicion(transitionId: string, s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>): Cargo | null
/** Compuesta: área (canExecuteTransition, intacta) Y, si hay excepción, cargo. Nunca amplía. */
export function puedeEjecutarTransicion(s: SujetoDePermiso, t: { id: string; area: string }): boolean
export function puedeCrearOVIGarantia(s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>): boolean   // sin llamador (F1B-03)
export function puedeFijarPrioridadTop5(s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>): boolean // sin llamador (F1B-07)
/** Valida el cuerpo HTTP: null o '' → null; cadena recortada de la lista → Cargo; otra cosa → error. */
export function cargoPermisoDelCuerpo(v: unknown): { ok: true; cargo: Cargo | null } | { ok: false; error: string }
```

**Corrección C-8 y supuesto S-9 (2026-09-30, prevalecen sobre el bloque de arriba):** las tres primitivas se llaman `puedeLiberarSinFactura`, `puedeCrearOVIGarantia` y `puedeFijarPrioridadTop5`, reciben el `SujetoDePermiso` completo y exigen área Y cargo (el admin pasa). S-9, reversible: el área de los dos actos sin llamador es Servicio Técnico (OVI de garantía) y Comercial (Top 5); lo fijan F1B-03 y F1B-07.

`packages/shared/src/index.ts`: `export * from './cargos'` **al final** (línea 26 nueva). Sin ciclo en tiempo de
ejecución: `types.ts` y `transitions.ts` importan sólo el TIPO.

## 2 · Migración

Al final de `packages/zoho-sync/src/db/schema.sql` (hoy termina en `:596`), tras un comentario ASCII sin tildes como
los vecinos (`:574-596`): `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cargo_permiso text;` — calificada
(topología de dos esquemas), aditiva, sin `CHECK` (D-4), sin relleno.

Guardián `packages/zoho-sync/src/db/migrate.test.ts`, **en sitio**: título `:374` y cifras `:376-377` pasan de 40 a
**41** ALTER y de 19 a **20** calificadas («15 de public»); `:378` (21 sin calificar) y el conjunto de `:385` no
cambian, porque `public.users` ya está. No se añade docstring: una línea nueva desplazaría `migrate.test.ts:409-411`,
que cita `CLAUDE.md`.

## 3 · Datos de usuario (todo en sitio)

| Punto | Cambio |
|---|---|
| `packages/shared/src/types.ts:1` | `; import type { Cargo } from './cargos'` tras la importación existente |
| `types.ts:220-222` (`UserPublic`, `:211-223`) | el comentario `:220` se reescribe para distinguir firma y permiso; `:222` gana `; cargoPermiso?: Cargo \| null`. Campo TS: **`cargoPermiso`** (S-2) |
| `apps/desk/server/auth/users.ts:4` | importa además `esCargo` |
| `users.ts:14` (`USER_SELECT`) | añade `u.cargo_permiso` |
| `users.ts:30` (`rowToPublicUser`, `:19-32`) | `cargoPermiso: esCargo(row.cargo_permiso) ? row.cargo_permiso : null` (D-5) |
| `users.ts:36`, `:40-42` (`createUser`) | entrada `cargoPermiso?: Cargo \| null`; columna y `$9` en el `INSERT` |
| `users.ts:86`, `:98` (`updateUser`) | tipo del parche; tras `:98`, en la misma línea con `;`, la asignación de `cargo_permiso` |
| `apps/desk/server/auth/sessions.ts:17` (`getSessionUser`, `:15-25`) | añade `u.cargo_permiso`. Sin esto la guarda nunca ve un cargo: es el detector (h) de §9 |
| `apps/desk/server/testing/appHarness.ts:91`, `:93` | `userCookie(areas, cargoPermiso?)`, en sitio |

`listPersonas` (`users.ts:74-81`) no cambia: la derivación sigue en `users.cargo`.

## 4 · Rutas

`apps/desk/server/auth/routes.ts`, las dos ya con `requireAdmin` (`:55`, `:74`):

- `POST /api/users`: tras el 422 de rol (`:65`) y antes de `createUser` (`:70`), `cargoPermisoDelCuerpo(req.body.cargoPermiso)`;
  si `!ok` → `422 { error }`. Ausente o `null` → sin cargo (S-4).
- `PATCH /api/users/:id`: si `req.body.cargoPermiso !== undefined`, misma validación, **antes de `updateUser` (`:104`)**.
  El 422 de contraseña posterior a la escritura (`:105-107`) es previo y no se toca.
- `users.cargo` de firma (`:68`, `:90`) sigue libre y separado.
- Inserción: **+2 líneas** en el alta y **+2** en la edición (§10).

## 5 · Guarda en `ticketService.ts`

Firma `:118`, en sitio: `user: { areas; isAdmin; cargoPermiso?: Cargo | null; name?; id? }`. Importación `:6`, en
sitio: `cargoQueFaltaParaTransicion` y `type Cargo`. El único llamador pasa `req.user!` (`routes/tickets.ts:193`),
que ya es un `UserPublic` con el campo.

**Edición EN SITIO, cero líneas insertadas.** `:129-130` (403 de área) no cambian, y `ticketService.ts:130` —que cita
`permisos.test.ts:30`— sigue siendo el `throw` del 403 de área. La línea `:131`, hoy `}`, pasa a:

```ts
  } const cargoFalta = cargoQueFaltaParaTransicion(t.id, user); if (cargoFalta) throw new HttpError(403, { error: `«${t.name}» sólo la ejecuta el cargo ${cargoFalta}` }) // Escalón B (F1C-05): tras el área, antes de todo 422
```

Varias sentencias por línea tienen precedente en el mismo fichero (`:5`, `:125`, `:134`, `:147`) y
`eslint.config.js:17-33` no activa reglas de estilo. *Plan B, si `apply` lo rechaza:* 403 de área en una línea
(`:129`), de cargo en `:130`, comentario en `:131`; mismo número de líneas, pero hay que reapuntar
`permisos.test.ts:30` (`ticketService.ts:130` → `:129`) y `openspec/specs/permissions/spec.md:301`
(`:129-130`). Orden resultante (F1B-10): 400 `:123` · 404 y 409 de flujo `:125` · 409 de estado `:126-128` · 403
de área `:129-130` · **403 de cargo `:131`** · 422 `:132-134`.

## 6 · «Nadie tiene cargo»

Tras migrar, `cargo_permiso` es `NULL` para todos. Con S-1 (estricto):

| Restricción | Desde el despliegue hasta la asignación | Después |
|---|---|---|
| (a) `liberacion_sin_factura` | Sólo los administradores la ejecutan (`permissions.ts:5`). Un Comercial no admin deja de ver el botón (`TransitionPanel.tsx:57`, §8) y, si llama a la API, recibe 403 que nombra «Director Comercial» | Quien tenga `Director Comercial` y área Comercial la ejecuta. La sesión relee la fila en cada petición (`sessions.ts:15-24`): no hace falta volver a entrar. Que el botón aparezca sin recargar la página: **hipótesis** negativa, el cliente carga `/api/auth/me` (`auth/routes.ts:36`) al montar |
| (b) crear OVI de garantía | Nada observable: sin llamador hasta F1B-03 | Misma regla cuando F1B-03 la consuma |
| (c) prioridad Top 5 | Nada observable: sin llamador hasta F1B-07 | Misma regla cuando F1B-07 la consuma |

**Por qué distinto del «0 destinatarios» de las alarmas.** `destinatariosDe` (`alarmasSla.ts:73-77`) cae al área
de respaldo y avisa con `logger.warn` (`:112-115`). Ahí fallar abierto es lo seguro: el coste de avisar de más es
ruido, y el de avisar a nadie es un SLA vencido que nadie ve. En un permiso el signo se invierte: caer al área
equivale a que la restricción no exista hasta la primera asignación, y entonces muerde de golpe a todos los
demás Comerciales a la vez. Además obligaría a la guarda a consultar la base («¿alguien activo tiene el cargo?»),
cosa que hoy no hace. Existe una salida operativa, el admin, y por eso el hueco es tolerable.

**Corrección a la propuesta:** «asignar ANTES de desplegar» no es posible, porque la columna nace con el
despliegue. El hueco es inevitable y dura **desde la migración hasta que un administrador asigne el cargo en la
consola**; se acota asignándolo justo tras desplegar. **Precondición del paquete de despliegue:** decir quién
asigna `Director Comercial` a quién y aceptar por escrito ese intervalo (P.1, dato de producción, fuera del
recuento).

**Reversibilidad:** (1) vaciar `EXCEPCIONES_POR_CARGO.transiciones` devuelve exactamente la matriz de área (la
prueba de «un caso distinto» se pondrá roja a propósito); (2) revertir los commits deja una columna aditiva que
nadie lee; (3) `UPDATE public.users SET cargo_permiso = NULL` retira asignaciones sin tocar código.

## 7 · Regresión «el cargo sólo restringe»

- `apps/desk/server/permisos.test.ts:41-110`: la construcción no cambia (`t.from[0]`, `userCookie([area])` sin cargo).
  Sólo `:64`, en sitio: `esperado[t.id] = puedeEjecutarTransicion({ areas: [area], isAdmin: false, cargoPermiso: null }, t) ? 200 : 403`;
  `:5` importa además `puedeEjecutarTransicion`.
- `:77-81` (102 = 60/42, sólo área) **intacta**: es el suelo.
- Contra la tautología de `:64`, prueba pura **al final** del fichero: sobre `TRANSITIONS × AREAS`, la lista de casos
  donde la compuesta sin cargo difiere de `canExecuteTransition` es, escrita a mano,
  `[{ transicion: 'liberacion_sin_factura', area: 'Comercial' }]`. Con esto la compuesta da 102 = 61/41.
- Matriz con cargo, pura, al final: `AREAS × (CARGOS ∪ {null}) × TRANSITIONS` (816 casos). Ningún caso tiene la compuesta
  verdadera y el área falsa (nunca amplía); con `Director Comercial` la compuesta coincide con el área en los 102.
- HTTP en `apps/desk/server/cargoPermiso.test.ts` (nuevo): Comercial sin cargo → 403 que nombra Director Comercial;
  Comercial + Director Comercial → 200; Comercial + Director Técnico → 403; **Servicio Técnico + Director Comercial → 403 de área**;
  valor fuera de lista escrito por SQL (`'Gerente comercial'`) → 403.
- Matrices gemelas `:238` (Equipo nuevo) y `:321` (Soporte remoto): **no cambian**, porque la excepción no está en
  esos catálogos. Lo fija una prueba de `cargos.test.ts`: toda clave de `EXCEPCIONES_POR_CARGO.transiciones` existe
  en `TRANSITIONS` y en ningún otro catálogo; si mañana entra una en otro, esa prueba obliga a tocar su gemela.
- `transicionesEjecucion.test.ts:50` ejecuta la liberación con `adminCookie()`: no se ve afectada.

## 8 · Cliente (regla 13 / mutación 3)

Sin red de pruebas (F0-00, `vitest.config.ts:16-20`); no se propone `jsdom`.

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| `TransitionPanel.tsx:57`, en sitio: oculta la transición si `!puedeEjecutarTransicion(user, t)` (misma función de `shared`) | `ticketService.ts:129-130` (área) y `:131` (cargo), probadas por `permisos.test.ts:41-66` y `cargoPermiso.test.ts` → comodidad legítima |
| `UsersAdmin.tsx` (alta, junto a `:119`; edición, junto a `:170`): `<select>` con los siete `CARGOS` y «Sin cargo» | 422 de `cargoPermisoDelCuerpo` en `auth/routes.ts` (POST y PATCH, §4) |
| La consola sólo la usa un administrador | `requireAdmin` en `auth/routes.ts:55`, `:74` (`middleware.ts:26-29`) |
| El campo `cargo` de firma sigue siendo texto libre | Ninguna, y es correcto: no es autoridad |

`apps/desk/src/api/client.ts:107` y `:121`, en sitio: `cargoPermiso` en `NewUser` y en el parche. `UsersAdmin.tsx`
inserta líneas (dos `select`); no tiene citas con número fuera de este cambio.

## 9 · Mutaciones planificadas

| # | Se rompe a propósito | Debe ponerse rojo |
|---|---|---|
| a | Guarda de cargo antes de `:126` | «409 de estado gana al 403 de cargo»: Comercial sin cargo, ticket fuera de `Por Facturar` |
| b | Guarda de cargo antes de `:129` | «403 de área gana al de cargo»: Servicio Técnico sin cargo en `Por Facturar`; se compara el MENSAJE (`área: Comercial`) |
| c | Guarda de cargo detrás de `:134` | «403 de cargo gana al 422»: Comercial sin cargo, sin la casilla obligatoria (`transitions.ts:247`) |
| d | Guarda de cargo antes de `:125` | «409 de flujo gana»: el mismo ticket con clasificación `Equipo nuevo` |
| e | Ensuciar `schema.sql` con `ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo_permiso text` sin calificar | `migrate.test.ts:345-352` y el recuento `:374-386` |
| f | Clave `liberacion_sin_facturaX` en la tabla | «toda clave existe en TRANSITIONS» y «exactamente un caso difiere» |
| g | `'Director comercial'` en `CARGOS` | La lista literal de siete, escrita a mano en `cargos.test.ts` |
| h | Quitar `u.cargo_permiso` de `sessions.ts:17` | HTTP «Comercial + Director Comercial → 200» |
| i | Quitar la salida del admin en `cargoQueFaltaParaTransicion` | `permisos.test.ts:89-109` (el admin no tiene cargo) |
| j | `rowToPublicUser` sin `esCargo` | Unitaria: `'Gerente comercial'` en base → `cargoPermiso: null` |
| k | Validación del PATCH detrás de `updateUser` (`:104`) | «el 422 no escribe»: la fila conserva el valor anterior |
| l | `&&` → `\|\|` en la compuesta | Matriz pura «nunca amplía» |

## 10 · Ficheros muy citados y barrido del cierre

- En sitio o al final, sin desplazamiento: `ticketService.ts` (549 líneas con cita), `transitions.ts` (413),
  `schema.sql` (247), `permisos.test.ts` (57), `types.ts`, `users.ts`, `sessions.ts`, `appHarness.ts`, `migrate.test.ts`,
  `index.ts`, `client.ts`, `TransitionPanel.tsx`. `permissions.ts` no se toca.
- Con inserción: `auth/routes.ts` (+4). Barrido `grep -rnoE "routes\.ts:[0-9]+(-[0-9]+)?"` y pase de abreviadas.
  Medido hoy fuera del archivo: `auth/routes.ts:129` en `e591454` (`docs/sdd/F0-00_Baseline_as-built.md:405`), y las líneas 121-124 (en `847965e`) y
  74-105 (en `e591454`) del mismo fichero (dos planes fechados del 2026-08-12). Los tres son caso B.
- El barrido cubre también las citas NUEVAS de este cambio (`:131`, `:374-377`, `:64`) y `permisos.test.ts:53`,
  que hoy cita `ticketService.ts:86` como el 409 de estado cuando éste está en `:126-128`. Se reapunta en sitio,
  caso A, porque la tanda ya edita ese fichero.

## 11 · Fuera de alcance y riesgo H5

- Transiciones Decisionales: F1C-04 (plan `:177`; `config.yaml:1939`).
- Propietario del registro: aplazado (`config.yaml:1936`, `:1942`); es el motivo de `cierra: no` (plan `:178`).
- Migrar alarmas (`alarmasSla.ts:73-77`, `db/avisos.ts:104-113`) y derivación (`apps/desk/src/lib/personas.ts:74-78`) al cargo nuevo.
- Motivo y Fecha prevista de la liberación: F1C-02 (`config.yaml:2388`).
- Construir la OVI de garantía (F1B-03) y el Top 5 (F1B-07).
- **H5:** conviven dos «cargo». `users.cargo` es texto libre (firma, alarmas, derivación, con normalización en
  `db/avisos.ts:108-111`) y `cargo_permiso` es una lista cerrada. Una persona puede recibir las alarmas del
  «Coordinador Comercial» por su firma y tener otro cargo de permiso. Ninguna de las dos está rota por separado y
  las reglas de mutación no lo detectan. Se registra **sin destino**: que lo asigne quien decida el alcance.

## Estrategia de pruebas

| Capa | Qué | Dónde |
|---|---|---|
| Pura | Lista, `esCargo`, tabla, compuesta, primitivas, `cargoPermisoDelCuerpo`, matrices | `packages/shared/src/cargos.test.ts` (nuevo) y el final de `permisos.test.ts` |
| Servidor | Sesión, rutas 422/403, guarda y posiciones a-d, fallo cerrado | `apps/desk/server/cargoPermiso.test.ts` (nuevo) |
| Esquema | Recuento del guardián | `migrate.test.ts:374-377` |
| Interfaz | — | Excluida (F0-00) |

Bajo `strict_tdd` cada prueba nace roja antes del código. Techo de avisos de ESLint 165 sin holgura
(`eslint.config.js:15`): el código nuevo no puede añadir ningún `any`.

## Threat Matrix

N/A — no toca enrutado de procesos, shell, subprocesos, automatización de VCS/PR ni clasificación de ejecutables.

## Migración / despliegue

Una columna aditiva (§2). Precondición y reversibilidad en §6.

## Preguntas abiertas

Ninguna bloquea. El plan B de §5 sólo aplica si `apply` rechaza la forma en sitio.
