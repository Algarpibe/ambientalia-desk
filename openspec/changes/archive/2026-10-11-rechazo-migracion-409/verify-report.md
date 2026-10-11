# Informe de verify: rechazo-migracion-409 (F1F-01, `cierra: no`)

Verificador independiente, 2026-10-11. Diff verificado: `git diff c168a8f HEAD` (apply `fc908eb` y `525d413`) en el worktree propio. Preflight: auto · hybrid · ask-on-risk · 800 · strict_tdd.

## Veredicto: PASS CON AVISOS

0 CRITICAL · 2 WARNING · 3 SUGGESTION. El producto cumple el encargo de Gerencia; los avisos son una mutación que ninguna prueba caza y una referencia viva que quedará obsoleta al fusionar.

## Códigos de salida (cada uno mirado por separado)

| Comando | Salida | Resultado |
|---|---|---|
| `npm test` (con `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:54330/testdb`) | `TEST_EXIT=0` | 269 ficheros, 4403 pruebas, todas verdes (la integración corre: 4 pruebas) |
| `npm run typecheck` | `TYPECHECK_EXIT=0` | sin errores |
| `npm run lint -- --max-warnings 165` | `LINT_EXIT=0` | 0 errores, 165 avisos (margen 0, igual que la base) |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | `CITAS_EXIT=0` | 7148 comprobadas; las abreviadas rotas listadas son anteriores (p. ej. `F0-00_Baseline_as-built.md:113`); ninguna es de este cambio |

Además: ruta + unidad (`migracionTicketsAbiertosRuta.test.ts`, `migracionTicketsAbiertos.test.ts`): 48/48. Integración con PostgreSQL 17.5 real: 4/4 con la variable; sin ella, 4 saltadas.

## Matriz escenario RQ-ZS-23 → prueba → resultado

| Escenario del delta | Prueba que lo cubre | Resultado |
|---|---|---|
| Solape: una confirma, la otra se rechaza sin dejar nada | `migracionConcurrente.integration.test.ts` (PG real; ahora exige `toBeInstanceOf(MigracionAdelantadaError)`, línea 162) | verde |
| Un marcador por ticket y de quién es | misma integración (PG real) | verde |
| Ejecución posterior no es rechazo y no escribe | `migracionTicketsAbiertos.test.ts:121-131` (y la variante «ya no había nada» de la integración) | verde |
| La pasada en seco no participa | `migracionTicketsAbiertos.test.ts` (sin `BEGIN`) e integración | verde |
| Rechazada responde 409 con su cuerpo | ruta, caso 1 (compara el texto ENTERO con `toEqual`) | verde |
| Otro error sigue dando 500 | ruta, caso 2 | verde |
| Interruptor apagado: 403, no este 409 | ruta, caso 3 | verde |
| Con negativa: 409 del informe, sin `error` ni `motivo` | ruta, caso 4 | verde |

## Producto, línea a línea (punto 2)

- `migracionTicketsAbiertos.ts`: la línea 90 pasa de `new Error(...)` a `new MigracionAdelantadaError(t.number)`; el `UPDATE` (84-89) no cambia. La clase va al final (:98-106) con el mismo texto de mensaje. Qué se escribe: idéntico.
- `routes/admin.ts`: importa `ErrorRequestHandler`, amplía la importación de `:234`, comentario de `:219` ampliado en sitio, `}))` pasa a `}), rechazoDeMigracionAdelantada)` en `:232`, y el manejador al final (:256-266). Transacción (`transaccion.ts:22-24`: ROLLBACK y relanza la misma instancia), interruptor (`:250-255`), `app.ts` (fuera del diff) y el `409` de la negativa (`:231`) intactos.
- Otros llamadores: el único es `admin.ts:228`. Nadie más captura el error ni lo lee por texto en código de producto.
- Doble respuesta: el manejador sólo actúa si el error llega antes del `res.json` del camino feliz; responde una vez o delega con `next(err)`. Sin guarda `res.headersSent` (S1), inalcanzable hoy.
- Zona muerta temporal: `rechazoDeMigracionAdelantada` es una `const` de `:260` usada en `:232` dentro de `registerAdminRoutes`, que se ejecuta después de evaluar el módulo; no hay acceso previo a la inicialización. Lo confirman typecheck, lint y las 35 pruebas de ruta.

## Mutaciones reproducidas (punto 3)

Restauradas desde una copia fuera del repositorio; `git status --short` vacío al final (antes de escribir este informe).

| Mutación | Resultado |
|---|---|
| (a) POSICIÓN: manejador delante de `asyncHandler` en la cadena | rojo: caso 1 (500) y caso 5 (el aviso no se registra). Orden probado |
| (b) distinguir por TEXTO: `err instanceof Error && /gobernado/.test(err.message)` | **verde (35/35): ninguna prueba la caza** (ver W1) |
| (c1) cambiar el texto del mensaje («escribió algo») | rojo: caso 1 |
| (c2) quitar `motivo` | rojo: caso 1 |
| (c3) quitar `logger.warn` | rojo: caso 5 |
| (c4) no llamar a `next(err)` con otros errores | rojo: caso 2 (agota el plazo) |

## Hallazgos

**CRITICAL:** ninguno.

**W1 · WARNING · La distinción por tipo no está fijada por prueba.** El encargo exige distinguir por tipo y no por texto; el código lo hace bien (`instanceof`, `admin.ts:263`), pero la mutación (b) pasa en verde. El caso 2 lanza un `Error` con el texto «fallo forzado», que no contiene «gobernado». Falta un caso que lance un `Error` genérico CON el texto «pasó a estar gobernado…» y exija `500`. Hoy sólo lo sostiene la lectura del código, que es tanto como no tener prueba. WARNING y no CRITICAL porque el producto es correcto y el riesgo es una regresión futura. Reparación (no hecha): un caso más al final de la prueba de ruta.

**W2 · WARNING · Referencia viva que quedará falsa al fusionar.** `docs/sdd/TRASPASO_2026-10-08.md:403-405` dice «Hasta que se fusione, `DEPLOY.md:688-690` describe el `500`»: cierto hoy, falso tras la fusión. `openspec/config.yaml:4565-4566` («recibe hoy un `500`») es el registro histórico de la pregunta, correcto de su fecha, y el archivo archivado también. No se editan aquí; la supervisión ajusta el TRASPASO al fusionar. En los ficheros que este cambio debía actualizar (`DEPLOY.md`, el delta) no queda ninguna afirmación del `500` como respuesta del rechazo.

**S1 · SUGGESTION.** El manejador no comprueba `res.headersSent` antes de responder, a diferencia del central (`app.ts:91`). Inalcanzable hoy (la ruta responde sólo tras el `await`); sería defensivo.

**S2 · SUGGESTION.** El delta dice que la ejecución rechazada se rechaza «con el error de `migracionTicketsAbiertos.ts:90`» y cita el texto entre comillas; la línea 90 lanza, pero el texto vive ahora en `:103`. Se entiende; convendría precisar la cita.

**S3 · SUGGESTION.** Los casos 3 y 4 (posición frente al interruptor y la negativa) no los pone rojos ninguna mutación probada (un manejador de error no corre en el flujo normal): fijan los escenarios, no el orden. El propio `tasks.md` 4.7 lo declara.

## El mensaje (punto 4)

Texto exacto que devuelve la ruta para un ticket nº 4200 (cuerpo `{ error, motivo: 'otra-ejecucion' }`):

> Otra ejecución de la migración está en curso o acaba de confirmarse (o el ticket 4200 cambió en la aplicación mientras ésta escribía). Esta ejecución no escribió nada. Compruébalo con una pasada en seco —la misma llamada sin `aplicar`— antes de volver a lanzarla.

La prueba (caso 1) compara el texto ENTERO por `toEqual`. Dice las tres cosas del encargo: otra ejecución en curso o recién confirmada; esta no escribió nada; comprobar con una pasada en seco. El inciso «(o el ticket N cambió en la aplicación…)» se sostiene: `writeTransition` fija `managed_by_app=true` (`packages/zoho-sync/src/db/repo.ts:298`) y el `UPDATE` exige `managed_by_app = false` (`migracionTicketsAbiertos.ts:87`). El borrado (`eliminarTicket.ts:4`) daría también 0 filas por el mismo `WHERE`; es deducción sin prueba, y la propuesta (S6) ya la declara hipótesis. Es un inciso añadido al texto pedido, pero no inventa un hecho y no cambia el sentido.

## Líneas y citas (puntos 5 y 6)

`git diff --numstat c168a8f HEAD`: `DEPLOY.md` 4/4 (sigue en 693 líneas); integración 3/3; `migracionTicketsAbiertos.ts` 12/1 (todo al final salvo la línea 90 en sitio); prueba de ruta 67/0 (al final); `routes/admin.ts` 15/4 (líneas 1, 219, 232 y 234 en sitio; +11 al final). Con `-U0`: ningún hunk inserta ni borra líneas antes del final; ninguna línea existente cambió de número. `DEPLOY.md:688-691`: cada hecho comprobado (`admin.ts:231` es el `res.status` con el 409 de la negativa; `app.ts:90-92` es el 500 central; la decisión está en `openspec/config.yaml:4560`). Citas de los artefactos abiertas una a una (`app.ts:79/84-89/90-92`, `transaccion.ts:22-24`, `asyncHandler.ts:3`, `repo.ts:298`, `eliminarTicket.ts:4`, `admin.ts:222/231/250-255`, `migracionTicketsAbiertos.ts:70/84-90`): dicen lo que la frase afirma. Excepción: S2.

## Forma (punto 7)

Cabecera R-1 de siete campos presente; `tanda: F1F-01`; `cierra: no` correcto (no termina la fila: quedan las tareas de persona); `tasks.md` sin casillas pendientes (0 casillas abiertas) y con las tareas de persona fuera del recuento, en tabla; sin menciones a reuniones en los artefactos del cambio.

## Qué se probó y qué no (punto 9)

- **Sólo con PostgreSQL real:** el solape con dos conexiones (una confirma, otra rechazada), la ausencia de marcador y de fila modificada de la rechazada, y que el rechazo real es `instanceof MigracionAdelantadaError`. pg-mem no revierte de verdad.
- **Probado con pg-mem y HTTP simulado (supertest):** estado `409`, cuerpo y texto exactos, `500` para otros errores, posición frente al interruptor y la negativa, y el aviso en el registro. El adelantamiento se provoca con un gancho que gobierna el ticket antes del `UPDATE`.
- **No probado en absoluto:** el `409` extremo a extremo con servidor real, PostgreSQL real y dos peticiones HTTP solapadas; que un borrado del ticket entre lectura y escritura dé el mismo rechazo; el comportamiento en producción.

## Entorno

Sólo se añade este informe. No se tocó `C:\dev\Desk_2_R1.023`. Siguiente paso: `sdd-archive`; conviene resolver W1 antes o apuntarlo.
