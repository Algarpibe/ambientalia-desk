# Diseño — `espera-y-areas-equipo-nuevo` (F1B-09, `cierra: no`)

## D1 · Las tres entradas se quedan en sus líneas, una por línea

`packages/shared/src/estados.ts` es de los ficheros más citados del repositorio (la regla de mutación 4 nació en él).
Mudar `Pendiente` al bloque `externa` y las otras dos al bloque `ninguna`, como hizo `por-entregar-es-espera`, desplazaría
todas las citas de `:61-105`. Los cinco renglones de `:101-105` se reescriben en sitio:

| Línea | Antes | Después |
|---|---|---|
| `:101` | rótulo «sin clasificar (3)» | rótulo «decididas el 17/10 (E-226): una `externa` y dos `ninguna`, fuera de su bloque a propósito» |
| `:102-104` | tres líneas de comentario sobre `Pendiente` | `:102`, la decisión y por qué no se mudan; `:103-105`, las tres entradas |
| `:105` | las tres entradas en una línea | `'Solicitud Soporte': 'ninguna',` con su comentario |

`'Pendiente': 'externa',` va SOLA y sin comentario detrás: la comprobación 5 del barrido la cuenta con
`/^\s*'[^']+':\s*'(externa|interna)'\s*,?\s*$/` (`apps/desk/server/reconciliacion/comprobaciones.ts:162`). Con la entrada en
la línea de tres, o con un comentario detrás, el barrido diría 11 con 12 en el código: el molde de H5. Las dos `ninguna`
pueden llevar comentario, porque el barrido no las cuenta. El orden del registro no cambia, así que `Solicitud Soporte`
sigue siendo el último estado (`estados.test.ts:229`) y `ESTADOS_SERVICIO` conserva el suyo.

Los rótulos de bloque se ajustan en sitio: `:60` «externa (5, y `Pendiente` en :103)», `:88` «ninguna (9, y las dos de
:104-105)». Las cifras de la vista, en sitio: `:21` (12 estados), `:28` (las doce), `:115` (Las DOCE). `:145` («da OCHO»)
no cambia: el cruce se calcula sobre `ESTADOS_SERVICIO` (`comentariosVigilados.test.ts:33-34`), sin `Pendiente`.

## D2 · El docblock de equipo nuevo, en sitio

`packages/shared/src/transitions.ts:347-348` deja de nombrar el supuesto s2 y cita la decisión; la línea «Campos:» se
conserva, porque la vigila `comentariosVigilados.test.ts:54-65`. Mismo número de líneas. Ninguna `area:` cambia, así que
no se toca `permissions` ni la matriz de `apps/desk/server/permisos.test.ts:211-245`; su comentario `:212` («por s2») y el
de `apps/desk/server/services/avisoArea.test.ts:43` se ajustan en sitio, y el mensaje de
`packages/shared/src/invariantesGrafo.test.ts:215` pasa de «(s2)» a «(E-226)».

## D3 · Las pruebas

| Prueba | Qué fija | Rojo antes del verde |
|---|---|---|
| `packages/shared/src/estados.test.ts`, en sitio | conjuntos por clase (6/6/11/0), `sin_clasificar` vacío pero válido, las doce de la vista, `Solicitud Soporte` `ninguna` | sí: cinco pruebas, contra el registro de hoy |
| `apps/desk/src/lib/esperaE226.test.ts` (nuevo) | `Pendiente` en «Espera»; `Verificación` y `Solicitud Soporte` en «Abiertos» | sí la de `Pendiente`; las otras dos son de caracterización (ya pasan) |
| `apps/desk/server/reconciliacion/esperasContraRegistro.test.ts` (nuevo) | el lector de la comprobación 5 sobre el `estados.ts` real = `ESTADOS_EN_ESPERA.length` | sí: importa `esperasDelCodigo`, que hoy no se exporta |
| `packages/shared/src/comentariosVigilados.test.ts`, caso (f) al final | `estados.ts` dice «Las N que la vista», «N estados — LO QUE DECLARA» y «muestra las n»; `sla.test.ts` cita la misma frase | se ve rojo en el apply: primero el dato, luego los comentarios |

`esperasDelCodigo` (`comprobaciones.ts:154`) pasa a `export` en sitio; no cambia su cuerpo.

## D4 · Mutaciones

| # | Mutación | Debe caer |
|---|---|---|
| M0 | control: nada | todo verde |
| M1 | comentario detrás de `'Pendiente': 'externa',` | `esperasContraRegistro.test.ts` |
| M2 | `Pendiente` de vuelta a `sin_clasificar` | `estados.test.ts`, `esperaE226.test.ts` |
| M3 | `Verificación` a `externa` | `estados.test.ts`, `esperaE226.test.ts` |
| M4 | `Solicitud Soporte` a `interna` | `estados.test.ts`, `esperaE226.test.ts` |
| M5 | `liberacion` a `area: 'Comercial'` | `invariantesGrafo.test.ts:215` |
| M6 | `estados.ts:115` vuelve a «ONCE» | `comentariosVigilados.test.ts` (f) |
| M7 | `Pendiente` a `interna` | `estados.test.ts` (el conjunto `externa`) |

## D5 · Regla 13

No se toca `apps/desk/src` fuera de una prueba nueva. El cliente consume `ESTADOS_EN_ESPERA` de `packages/shared` por
`esEstadoEnEspera` (`apps/desk/src/lib/enEspera.ts:1`, `:15`): regla 13.1, consume y no reescribe. Las vistas son filtro
de presentación (`apps/desk/src/lib/boardView.ts:32-37`) y no tienen contrapartida que imponer en el servidor.

## D6 · Fuera de la rama

`CLAUDE.md` (IV-9: 2 aciertos y 9 fallos sobre 11) y `openspec/config.yaml` (`cifras_ancladas.esperas`: «ONCE: 5 externa
+ 6 interna») son de Supervisión y están modificados en la copia de trabajo de `main`: tocarlos en la rama impediría la
fusión. Las cifras remedidas se entregan como texto en el informe.
