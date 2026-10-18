# Diseño — `orden-motivos-anulacion` (F1C-01, `cierra: no`)

Enfoque: una función pura en `shared` decide el ORDEN de los motivos según el estado de origen; el panel la consume
editando dos líneas existentes. El servidor no cambia. Mediciones sobre el árbol del worktree (base `8f629b5`).

## D1 · `motivosAnulacionOrdenados`, al final de `packages/shared/src/anulacion.ts`

`export function motivosAnulacionOrdenados(estado: string): string[]`, añadida DETRÁS de `esAnulado` (`anulacion.ts:57-59`),
que es hoy la última línea del fichero: no se mueve ninguna línea citada (`anulacion.ts:1-59` intacto, regla de mutación 4).

- Constante de módulo, no exportada: `ESPERAS_EXTERNAS = new Set(['En Espera de Repuestos', 'Servicio externo'])`, con
  los dos nombres escritos. NO se usa la clase `externa` de `estados.ts`: la llevan también `Notificación cliente`
  (`packages/shared/src/estados.ts:65`), que es origen de anulación, y otros estados; las dos esperas están en `:61-62`.
- Constante `MOTIVOS_PRIMERO_EN_ESPERA = ['Repuesto no disponible', 'Sin solución técnica']` (SA-2, en el orden en que
  los nombra Gerencia, `openspec/config.yaml:5036`).
- Fuera de las esperas: `[...MOTIVOS_ANULACION]`, una COPIA, para que quien la reciba no pueda mutar la lista base.
- Dentro: `[...MOTIVOS_PRIMERO_EN_ESPERA, ...MOTIVOS_ANULACION.filter((m) => !MOTIVOS_PRIMERO_EN_ESPERA.includes(m))]`.
  Resultado: «Repuesto no disponible», «Sin solución técnica», «El cliente no aprueba…», «Caducidad de espera…», «Otro».
- «Otro» queda el último **por construcción**: es el último de `MOTIVOS_ANULACION` (`anulacion.ts:27`), no está entre
  los primeros, y `filter` conserva el orden relativo (SA-3).
- Ciclo de imports: el módulo sólo importa TIPOS de `transitions.ts` (`anulacion.ts:1`, razón en `:15-16`). La función
  no necesita ningún import nuevo: trabaja con cadenas y con `MOTIVOS_ANULACION`, que es del propio módulo.

## D2 · Exportación: nada que añadir

`packages/shared/src/index.ts:35` ya hace `export * from './anulacion'`; la función nueva sale por `@ambientalia/shared`.

## D3 · Consumo en `apps/desk/src/components/TransitionPanel.tsx` sin insertar líneas

- **Import:** se añaden `motivosAnulacionOrdenados, CLAVE_MOTIVO_ANULACION` a la lista de la primera sentencia de
  `:8` (la que ya importa `puedeEjecutarTransicion`… de `@ambientalia/shared`). Se elige `:8` y no `:2` porque `:8` es
  donde las tandas recientes añaden lo suyo y `:2` mezcla tipos; las citas archivadas de las dos líneas nombran sólo lo
  que ya importaban, y añadir nombres no las vuelve falsas.
- **Mapeo:** la línea `:163`, `f={f}`, pasa a
  `f={f.key === CLAVE_MOTIVO_ANULACION ? { ...f, options: motivosAnulacionOrdenados(status) } : f}`.
- `status` es el estado del ticket: prop de `:40`, la misma que filtra las transiciones en `:56`. Es el ORIGEN de la
  anulación, que es lo que la función necesita.
- `key={f.key}` (`:162`) no cambia. `bloqueado` (`:174`) y `onElegirOrdenVenta` (`:177`) siguen leyendo el `f` original;
  el desplegable pinta `f.options` en `:260` y su `value` es controlado, así que reordenar no altera lo elegido.
- Ninguna cita del repositorio apunta a `:163`; `:160` (citada en varios archivos) no se toca.

| Alternativa | Coste | Decisión |
|---|---|---|
| Pasar `status` a `Field` y ordenar dentro | toca la firma (`:194-203`), la llamada y la rama `select` (`:257-261`); obliga a insertar | rechazada |
| Ordenar en `camposAnulacion()` | imposible: una transición tiene varios orígenes (`anulacion`: cinco) y sus `options` son estáticas | rechazada |
| Sustituir el `f` en `:163` | una línea editada, sin inserciones | **elegida** |

## D4 · Servidor sin cambios

La pertenencia sigue en `erroresAnulacion` (`anulacion.ts:50`), sumada al `422` de
`apps/desk/server/services/ticketService.ts:134`. Las `options` del catálogo (`anulacion.ts:34`) conservan el orden
base, así que el arnés que toma la primera opción —`apps/desk/server/testing/appHarness.ts:78`, `f.options?.[0]`— sigue
cayendo en «El cliente no aprueba…» y el comentario de `anulacion.ts:21` sigue siendo cierto.

## D5 · Pruebas (strict TDD), en `packages/shared/src/anulacion.test.ts`

Un `describe('motivosAnulacionOrdenados')` NUEVO al final del fichero (hoy termina en `:186`). El import se amplía en
sitio, en `:4` (`…, esAnulado, motivosAnulacionOrdenados,`), sin insertar líneas. Todas en rojo antes de la función.

| Prueba | Mutación que la pone en rojo |
|---|---|
| En `En Espera de Repuestos` y `Servicio externo`, `toEqual([M3, M2, M1, M4, M5])` | **M1** (no reordenar en las esperas) |
| En `Notificación cliente`, `Rev./Diagnostico`, `Notificación Comercial`, `Ingresado` y `''`, `toEqual([...MOTIVOS_ANULACION])` | **M2** (reordenar en otro estado; `Notificación cliente` caza el uso de la clase `externa`) |
| Para cada estado de una lista explícita —las dos esperas y los de M2—, la copia ordenada es igual a `[...MOTIVOS_ANULACION].sort()` | **M3** (añadir o quitar un motivo) |
| Para la misma lista, el último es `MOTIVO_QUE_EXIGE_DETALLE` (`anulacion.ts:29`) | **M4** (sacar «Otro» del último puesto) |
| Mutar el array devuelto (fuera y dentro de las esperas) deja `MOTIVOS_ANULACION` igual a `[M1, M2, M3, M4, M5]` | devolver la lista base sin copiar |
| Las dos esperas están en el `from` de `anulacion` (`TRANSITIONS`) | una errata en el nombre de un estado |

El `.tsx` queda fuera de la red de pruebas (F0-00, `vitest.config.ts:16-20`): su consumo lo comprueban `typecheck`,
`lint` y la lectura del diff.

## D6 · Regla invariable 13 y barrido de citas

| Decisión del cliente | Línea del servidor |
|---|---|
| El orden del desplegable del motivo | **ninguna, presentación** (`openspec/config.yaml:5041`) |
| En qué estados se reordena | **ninguna, presentación**: no hay restricción por origen (`openspec/config.yaml:5040`) |
| Ofrecer sólo los cinco motivos | `anulacion.ts:50` vía `ticketService.ts:134`; probado desde `Servicio externo` en `apps/desk/server/anulacion.test.ts:80-86` |

**Barrido (regla de mutación 4), al cierre:** sólo ganan líneas `anulacion.ts` y `anulacion.test.ts` de `shared`, y
sólo al final; `TransitionPanel.tsx` conserva su número de líneas (267). Se corre
`grep -rnoE "anulacion(\.test)?\.ts:[0-9]+(-[0-9]+)?" . --exclude-dir=node_modules` y se comprueba cada resultado
contra SU fichero: el patrón casa también con `apps/desk/server/anulacion.test.ts` (el `verify-report.md` archivado de
`anulado-con-motivo` cita hasta `:188-191`, que no existen en el de `shared`). Ninguna cita debe apuntar más allá del
final viejo de `shared` (`anulacion.ts:59`, `anulacion.test.ts:186`) salvo las nuevas, comprobadas una a una.

Matriz de amenazas: N/A — sin rutas, shell, subprocesos, VCS ni integración de procesos. Sin migración ni datos.
