# Informe de archivo — recepcion-rotulacion-foto-entrada (F1B-04)

**Tanda:** F1B-04 · **cierra:** no · **Fecha:** 2026-10-03 · **Rama:** `recepcion-rotulacion-foto-entrada`,
nacida de `main` en `f55b7d9`. La rama no se ha fusionado ni empujado: la fusión la autoriza el usuario.

## Qué parte de la fila cubre

**Cubre** la confirmación «Rotulado y guardado», la lista de tipos de novedad que sustituye a la observación
libre y la foto siempre obligatoria en la remisión de entrada. **Deja fuera** los accesorios desde el catálogo
de artículos (E-100, sin clave de decisión), la mitad de salida de E-123 y la pantalla para mantener la lista de
novedades. Por eso lleva `cierra: no`: la fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84`
sigue en curso.

## Commits y medidas

Las medidas son `git diff --shortstat --no-renames` entre commits, y coinciden con el registro de intentos.

| Fase | Commit | Medida |
|---|---|---|
| Planificación | `c873467` | 1.653 líneas, artefactos del cambio |
| Lote 1 · esquema, catálogo y ruta de lectura | `da9c740` | 389 (357 insertadas, 32 borradas) |
| Lote 2 · alta: novedades y rotulado | `231f7e3` | 708 (680, 28) |
| Lote 3 · categoría de foto y puertas de envío | `e24d490` | 443 (401, 42) |
| Lote 4a · cliente | `8f8506f`, `1b289f3` | 382 (326, 56) |
| Lote 4b · cierre documental | `5385d81` | 193 (187, 6) |
| Verify | `4649306` | 221, el informe |
| Remediación del verify | `4c778b0` | 67, sólo pruebas |
| Archive, parte revisable | este commit | fusión en la spec viva: 563 (499, 64), más este informe |

El lote 2 quedó a 12 líneas de la válvula de 720 con una estimación de 441. `8f8506f` es un arreglo de una
línea: el lote 3 se asentó con `npm run typecheck` en código de salida 2 por un doble de prueba, y se corrigió
dentro del intento del lote 4a.

`apps/desk/server/routes/remision.ts` conserva sus 397 líneas, así que ninguna cita a ese fichero se desplaza.
`apps/desk/server/remisiones.test.ts`, `apps/desk/server/fotoNovedad.test.ts`,
`apps/desk/server/remisionWebhook.ts` y `apps/desk/src/lib/envioRemision.ts` no tienen diferencias respecto a
`f55b7d9`.

## Qué se fusionó en la spec viva

En `openspec/specs/remisiones/spec.md`: cinco requisitos sustituidos enteros (RQ-RE-08, RQ-RE-13, RQ-RE-17,
RQ-RE-18 y RQ-RE-19) y siete añadidos tras RQ-RE-20 (RQ-RE-21 a RQ-RE-27). La fusión se hizo con un script y
cada uno de los doce bloques se comparó con el de la delta: son idénticos. La capacidad `remisiones` ya existía.

## Pruebas y comprobaciones al cierre

Ejecutadas en el worktree sobre el árbol de este commit, mirando el código de salida de cada una: `npm test`
(182 ficheros y 2.761 pruebas en verde; 1 fichero y 2 pruebas omitidas), `npm run typecheck`, `npm run lint`
(165 avisos, 0 errores) y el detector de citas.

## Mutaciones reproducidas

| Mutación | Quién la reprodujo |
|---|---|
| Posición: la guarda de recepción del alta por encima del serial | apply y orquestador |
| Posición: la guarda de recepción por debajo del `409` de remisión pendiente | apply y verify |
| Posición: la puerta de envío por encima de «anulada» y por debajo de reclamar el envío | apply y verify |
| Posición: el orden interno rotulado, fotos mínimas, foto por novedad | apply y remediación |
| Posición: la categoría de la foto por encima del `415` | apply y orquestador |
| Fichero vigilado `schema.sql`: quitar `public.` al `CREATE` | apply y orquestador |
| Fichero vigilado `schema.sql`: quitar `public.` a una `ALTER`; añadir un `UPDATE` de relleno | apply y verify |
| Fichero vigilado `schema.sql`: borrar una fila de la siembra | apply y orquestador |
| Dato: apagar la marca de texto obligatorio de «Otro»; desactivar una fila | apply y verify |
| Legado: `novedades` escrito como JSON nulo en vez de `NULL` de SQL | apply y verify |
| Payload hacia n8n con una clave nueva | apply |
| Cliente: cuatro mutaciones de `apps/desk/src/lib/recepcionForm.ts` | apply |

Todas se revirtieron y el árbol quedó limpio tras cada una.

## Hallazgos del verify y qué se hizo

| Hallazgo | Qué se hizo |
|---|---|
| W1 · la remisión de origen histórico sólo se cumplía por lectura | Cerrado en `4c778b0`, con prueba por la ruta de envío |
| W2 · el esquema nuevo sólo se probó contra la base en memoria de las pruebas | Queda como condición de publicación: la comprobación de lectura de `DEPLOY.md` |
| W3 · la foto obligatoria sólo se impone al formulario nuevo | Declarado, no corregido: omitir el campo de novedades entra por la vía anterior (E-081, IV-12, E-169) |
| W4 · tamaño de la fusión | Medida antes de aplicar: 563, más este informe, bajo 800 |
| S1 · el texto de «Otro» no tiene tope propio de longitud | Se queda; lo acota el límite del cuerpo de la petición |
| S2 · el `422` de clave desconocida devuelve la clave recibida | Se queda |
| S3 · el orden interno del envío sólo se probaba en la función compartida | Cerrado en `4c778b0`, con pruebas por la ruta |
| S4, S5 · citas ya desfasadas antes de la tanda | Ajenas; no se tocan |

## Supuestos aplicados

- La lista de novedades es dato, en la tabla `public.catalogo_novedades`, y no una constante del código. No
  tiene pantalla: hoy se edita por SQL y una novedad se retira desactivándola, no borrándola.
- «Completar la recepción» es enviar la remisión. El rotulado se exige en el alta y otra vez en el envío.
- «Sin novedad» excluye a las demás.
- La categoría de la foto no viaja a n8n.
- La ruta que sirve la lista responde en camelCase, como el resto de la API.

Una duda no se trató como supuesto: se construyó una foto por CADA novedad marcada, a la letra del maestro, y la
pregunta está en la bandeja (E-163).

## Entradas en la bandeja

E-163 a E-167 son preguntas para Gerencia: foto por cada novedad o basta una, quién edita la lista y dónde,
«Falta un accesorio» y su foto, equipo sin accesorios o sin embalaje, y el momento del rotulado. E-168 es el
hallazgo de que la mitad de entrada de E-123 no tiene clave de decisión en `openspec/config.yaml`. E-169 es el
tercer punto de IV-12: la guarda nueva del alta corre antes de «Orden de venta no encontrada». E-170 recoge las
tareas de persona.

## Tareas de persona — archivar no las da por hechas

1. Servicio Técnico confirma la lista de diez novedades antes de publicarla.
2. Quien administra n8n comprueba que la etiqueta física lleva el código del ticket.
3. La comprobación del formulario en la aplicación: el `.tsx` no tiene pruebas, por decisión de Gerencia.

## Para el paquete de despliegue

Hay cambio de esquema: una tabla nueva sembrada y seis columnas nuevas, todas aditivas y sin relleno. Tras
desplegar se ejecuta la comprobación de lectura de `DEPLOY.md`: diez filas en el catálogo y las seis columnas.
Si faltara una columna de `public.remisiones`, fallaría toda alta de remisión. F1B-04 entra con E-170 como
condición previa.

## Pendiente al fusionar

- `docs/sdd/ENTRADA.md` y `docs/sdd/F0-01_Correcciones_para_el_maestro.md` reciben texto al final también en la
  rama de F1C-11: conflicto previsible, que se resuelve conservando las dos partes. Las dos ramas numeran su
  corrección del maestro como 21, así que una se renumera.
- `CLAUDE.md` dice que IV-12 son dos puntos; con E-169 son tres. Lo corrige la supervisión.
