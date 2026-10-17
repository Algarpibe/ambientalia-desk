# Archive · `rechazo-migracion-409` (F1F-01, `cierra: no`)

**Fecha:** 2026-10-11 · **Rama:** `rechazo-migracion-409` · **Partida:** `c168a8f` · **Informe escrito por el orquestador**, con cifras
medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué parte de la fila F1F-01 cubre, en una línea:** la respuesta de la ruta de la migración a la ejecución a la que otra se
adelantó, que pasa del `500` genérico a un `409` con mensaje claro. **Deja fuera** lo mismo que el cambio anterior: nombrar al
suplente, la respuesta a E-208, el cotejo de la hoja de Google y la ejecución en producción, que son tareas de persona. Por eso
declara `cierra: no` y F1F-01 sigue en curso.

## Qué decisión construye

`decision/migracion-rechazada-responde-409-11-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`, commit `c168a8f`):
«…decido como Gerencia que la ejecucion rechazada reciba un 409 con mensaje claro en vez del 500…».

## Qué quedó construido

- **Error con tipo propio:** `MigracionAdelantadaError` (`apps/desk/server/db/migracionTicketsAbiertos.ts:101-106`), declarado al
  final del fichero. La línea que rechaza lo lanza en sitio (`apps/desk/server/db/migracionTicketsAbiertos.ts:90`), con el mismo
  texto interno de siempre.
- **Manejador de error propio de la ruta:** `rechazoDeMigracionAdelantada` (`apps/desk/server/routes/admin.ts:262-266`), último
  eslabón de la cadena de la ruta (`apps/desk/server/routes/admin.ts:232`). Si el error es de ese tipo —por `instanceof`, nunca
  por el texto— anota un aviso en el registro y responde `409`; cualquier otro lo pasa al manejador central, que sigue dando `500`.
- **Cuerpo del `409`:** `{ error, motivo: 'otra-ejecucion' }`. **Mensaje exacto**, con N el número del ticket: «Otra ejecución de la
  migración está en curso o acaba de confirmarse (o el ticket N cambió en la aplicación mientras ésta escribía). Esta ejecución no
  escribió nada. Compruébalo con una pasada en seco —la misma llamada sin `aplicar`— antes de volver a lanzarla.»
- **Cómo se distingue del `409` de la negativa** (`apps/desk/server/routes/admin.ts:231`, sin tocar): el de la negativa trae el
  informe completo, con `negativa` rellena y `aplicado: false`, y no trae `error` ni `motivo`; el nuevo trae `error` y
  `motivo: 'otra-ejecucion'`, y no trae informe. No pueden coincidir: la negativa se decide antes del primer `INSERT`
  (`apps/desk/server/db/migracionTicketsAbiertos.ts:70`) y el rechazo sólo salta al escribir.
- **`DEPLOY.md:688-691`**, en sitio: describe el `409` y cómo distinguirlo. **RQ-ZS-23 modificado** en
  `openspec/specs/zoho-sync/spec.md:1368` en `164d322`, con cuatro escenarios nuevos.
- **Lo que NO cambia:** el `INSERT`, el `UPDATE` y su `WHERE`, la transacción, el interruptor, el manejador central
  (`apps/desk/server/app.ts`) y el `409` de la negativa. No hay esquema, variables ni permiso nuevo.

## Intentos

Medida = `git diff --shortstat --no-renames` contra el inicio de cada intento más `wc -l` de lo nuevo sin trackear. En los tres
primeros el registro anotó lo mismo que git.

| Intento | Qué | Medida | Commit |
|---|---|---|---|
| 1 | Propuesta, especificación, diseño y tareas | 405 | `a1fb802` |
| 2 | Apply, lote único | 221 | `fc908eb`, `525d413` |
| 3 | Verify y su remediación (caso 6) | 103 | `5a28c3a` |
| 4 | Archivo | este commit | — |

## Fusión del delta

Por script (`fusiona.mjs`), un bloque MODIFIED que sustituye entero a RQ-ZS-23. Es el último requisito de la spec, así que crecer
no desplaza ninguna otra línea: `openspec/specs/zoho-sync/spec.md` pasa de 1.419 a 1.450 líneas (37 inserciones y 6 borrados). El
bloque vivo es idéntico al del delta, comprobado con `diff`; y el delta se contrastó antes con `diff` contra el bloque anterior:
conserva los cuatro escenarios de entonces palabra por palabra. **Parte revisable medida antes de aplicar:** 43 líneas de fusión
más este informe, por debajo de 800.

## Verificación

- **Verify:** PASS CON AVISOS, 0 CRITICAL, 2 WARNING y 3 SUGGESTION (`verify-report.md`).
  - **W1, cerrado en `5a28c3a`.** Ninguna prueba cazaba que el manejador distinguiera por TEXTO en vez de por tipo. Se añadió el
    caso 6 (`apps/desk/server/migracionTicketsAbiertosRuta.test.ts:265-274`): un error genérico con el mismo texto del rechazo sigue
    dando `500`. Con la mutación por texto se pone rojo («expected 409 to be 500»); restaurado, verde.
  - **W2, para `main` al fusionar.** `docs/sdd/TRASPASO_2026-10-08.md` dice que `DEPLOY.md` describe el `500` «hasta que se
    fusione». Lo supera la sección final que se añada entonces; esta rama no toca ese fichero.
  - Sugerencias que quedan: el manejador no comprueba si la respuesta ya se envió (hoy inalcanzable: el error sólo puede llegar
    antes de responder); y los casos 3 y 4 fijan los escenarios del interruptor y de la negativa, no un orden que una mutación
    pueda romper, porque un manejador de error no corre en el flujo normal.
- **Rojo previo real (`strict_tdd`):** con el producto intacto, el caso 1 falló con «expected 500 to be 409» y el caso 5 con el
  aviso del registro sin llamadas. Los casos 2, 3 y 4 nacieron verdes.
- **Mutaciones**, todas restauradas desde una copia fuera del repositorio:
  - M1, quitar el manejador de la cadena: rojos los casos 1 y 5.
  - **M2, de posición (regla de mutación 1):** el manejador delante del principal deja de cazar; rojos 1 y 5. Reproducida por el
    orquestador y por el verify.
  - M3, cazar cualquier error: rojo el caso 2 («expected 409 to be 500»). Reproducida por el orquestador.
  - M4, no pasar los demás errores: rojo el caso 2 por plazo agotado.
  - M5, volver al `Error` genérico en el ejecutor: rojos 1 y 5, y el solape y la carrera de la integración.
  - M6, otro estado que no sea `409`: rojo el caso 1. M7, manejador de tres argumentos: rojos 1 y 5.
  - Del verify: cambiar el texto del mensaje, quitar `motivo` y quitar el aviso del registro, las tres rojas.
- **Regla de mutación 3:** el cliente no toma ninguna decisión; `apps/desk/src` no llama a la ruta.
- **Códigos al cerrar este intento:** se re-ejecutan con el commit de archivo y se anotan en el informe al usuario.

## Qué está probado, y dónde

- **Prueba de ruta, sobre pg-mem:** el estado `409`, el cuerpo con el mensaje entero, el `500` de cualquier otro error, el `403`
  del interruptor apagado, el `409` de la negativa y el aviso en el registro.
- **Sólo con PostgreSQL real:** que el rechazo de una ejecución solapada de verdad es de tipo `MigracionAdelantadaError`
  (`apps/desk/server/db/migracionConcurrente.integration.test.ts:162`) y que no deja nada escrito. En local, con un servidor
  desechable, la suite entera pasó sin nada saltado: 269 ficheros.
- **Sin probar:** el `409` extremo a extremo, con dos peticiones HTTP solapadas contra un servidor y un PostgreSQL reales; y el
  borrado de un ticket entre la lectura y la escritura, que el inciso del mensaje cubre por deducción del `WHERE`, no por prueba.

## Supuestos reversibles

En la propuesta, S1 a S7. De más peso: el inciso «o el ticket N cambió en la aplicación» (S1 y S6), porque el rechazo también se
da si una transición gobierna ese ticket mientras se migra (`packages/zoho-sync/src/db/repo.ts:298`) y decir sólo «otra ejecución»
afirmaría algo que puede no ser cierto; el manejador vive en la ruta y no en `apps/desk/server/app.ts` (S2); `motivo` como
discriminante estable (S3); y el rechazo va al registro como aviso, no como error (S5).

## Citas

Todo se editó en sitio o al final: ninguna línea existente cambia de número. El ejecutor crece de 95 a 106, la ruta de 255 a 266,
la prueba de ruta de 196 a 274; la integración conserva 243 y `DEPLOY.md`, 693. Las citas de los artefactos de este cambio al
bloque de la spec anterior a la fusión se anclaron en `a1fb802` (caso B). Abreviadas rotas del detector: 13, las mismas que `main`.

## Lo que esta rama NO toca y hay que hacer en `main` al fusionar

- `docs/sdd/RECONCILIACION.md`: regenerarlo; F1F-01 sigue en curso.
- Sección final del traspaso, que supere la frase del `500` (W2).
- Desplegar el servicio `ambientalia-desk` para que el `409` exista en producción antes de la ejecución del corte: sin migración ni
  variables. Es tarea de persona.

## Tareas de personas — fuera del recuento

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Nombrar al suplente | Gerencia | `DEPLOY.md:665` |
| Responder E-208: quién lanza la última sincronización completa | Gerencia | `docs/sdd/ENTRADA.md:2047` |
| Cotejo una a una de la hoja de Google | Persona con acceso a la hoja | `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/archive-report.md:5` |
| Desplegar `ambientalia-desk` con este cambio | Alfonso | este informe |
| Ejecución del 12/12 en producción | Gerencia o su suplente | `DEPLOY.md:663-693` |

Archivar no las da por hechas.
