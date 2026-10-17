# Diseño — `cifras-caducas-y-lectores-de-servicio`

Medido en `3187e42`. Las cifras salen de ejecutar el catálogo (`TRANSITIONS` 31, `TRANSITIONS_EQUIPO_NUEVO` 6,
`TRANSITIONS_SOPORTE_REMOTO` 4; doce estados de servicio con una sola salida; once `en_espera`; ocho en el cruce).

## D1 · Cifra que informa: se corrige y se vigila. Cifra que no informa: se quita

E-228 no denuncia cinco números, denuncia que **nada los vigila**. Corregirlos sin detector deja el mismo hueco para
la siguiente transición que se añada. Por eso cada cifra que dice algo del catálogo queda fijada por un guardián que
**lee el fichero vigilado** y lo compara con lo que el catálogo cuenta hoy (regla de mutación 2):

| Fichero y línea | Hoy dice | Pasa a decir | Vigilancia |
|---|---|---|---|
| `packages/shared/src/estados.ts:142` | «Hay DOCE» | sin cambio | el guardián exige la palabra del recuento real de estados con una sola salida |
| `packages/shared/src/estados.ts:145` | «da SEIS, con `Liberación Comercial` y `Remisión creada` dentro» | «da OCHO, con `Liberación Comercial`, `Remisión creada` y los dos `Por Entregar` dentro» | ídem, con el cruce contra `ESTADOS_EN_ESPERA` |
| `packages/shared/src/estados.ts:83` | «Entra por `facturado`/similar» | «Entra por `remision_confirmada`, sin botón (`transitions.ts:150`)» | el comentario debe nombrar el `id` de `TRANSICION_REMISION_CONFIRMADA` |
| `apps/desk/server/services/ticketService.ts:238` | «las otras 43 transiciones» | «las otras 40 transiciones» | la cifra debe ser la unión de los tres catálogos menos uno |
| `packages/shared/src/transitions.ts:348` | «Campos: sólo `comment()`» | nombra `derivacion()` y el certificado de fábrica de `liberacion` | todo campo de equipo nuevo distinto de comentario y derivación debe tener su transición nombrada en esa línea |
| `packages/shared/src/transitions.ts:67` | «las 32 etapas» | «todas las etapas» | ninguna: la cifra no informaba (supuesto S-1) |

Los números se escriben en palabras, en mayúscula, como ya hace el fichero; el guardián traduce el recuento con un
mapa pequeño y falla con un mensaje que dice qué número espera.

## D2 · Ninguna línea insertada en un fichero muy citado

`estados.ts`, `transitions.ts` (con más de doscientas citas), `ticketService.ts` y las specs vivas se editan
**sustituyendo texto en la misma línea física**. Las pruebas nuevas van en un fichero nuevo,
`packages/shared/src/comentariosVigilados.test.ts`. El delta de RQ-TZ-01 conserva las dieciocho líneas del bloque
vivo (`openspec/specs/trazas/spec.md:38-55`) y no lleva nota «Previously», que añadiría líneas al fusionar.
El texto anterior del punto de cobertura era: «La cobertura SHALL ser de las 34 transiciones, ejercitando todos los
`from` de cada una —36 ejecuciones, porque `habilitar_servicio` tiene tres—», con las citas `:105-117` y `:272-285`.

## D3 · E-227: anotar y vigilar, no retirar

`transitionsForStatus` y `transitionById` siguen exportadas para las pruebas. Se reescribe en sitio el comentario
de `packages/shared/src/transitions.ts:300` para que cubra las dos funciones: sólo conocen el catálogo de servicio,
no tienen llamador de producción, y el servidor resuelve por el registro de flujos. El guardián recorre `apps/`,
`packages/` y `scripts/` (`.ts` y `.tsx`), excluye las pruebas, `transitions.ts` e `index.ts`, y exige cero
ficheros con `transitionsForStatus(` o `transitionById(`. Molde: el de `packages/shared/src/cargos.test.ts:223-225`.

Las otras cuatro piezas de E-227 no se tocan: `periodosDeBodegaje` tiene un llamador interno
(`packages/shared/src/bodegaje.ts:209`) y, con `diasDeBodegaje`, destino F1C-06; `puedeCrearOVIGarantia` ya tiene
llamadores; `puedeLiberarSinFactura` queda anotada sin destino.

## D4 · Specs: delta sólo donde cambia un SHALL

- **RQ-TZ-01** cambia lo que la cobertura debe abarcar: delta `MODIFIED` (41 transiciones, 44 ejecuciones,
  citas `:365` y `:419` de `apps/desk/server/transicionesEjecucion.test.ts`).
- **Siete frases caso A sin SHALL** se editan en sitio en el apply: las cinco «→ `transitions-st`» de
  `remisiones`, `tickets-core`, `zoho-sync`, `derivacion-avisos` y `trazas:516` pasan a «las 31 transiciones de
  servicio» (es lo que `transitions-st` especifica), y las tres «34» del escenario de garantía estructural de
  `transitions-st` (`:1360`, `:1367`, `:1385`) pasan a «31». Comprobado que la afirmación sigue cierta en los tres
  catálogos: sólo `habilitar_servicio` declara `cfOrdenVenta` (`packages/shared/src/transitions.ts:189`) y ninguna
  transición lo combina con una fecha derivada.
- **Caso B, fuera:** tablas fechadas («Verificado en esta tanda»: `openspec/specs/tickets-core/spec.md:546`,
  `openspec/specs/transitions-st/spec.md:376`; `openspec/specs/derivacion-avisos/spec.md:227`; filas M-x y citas en `fd253aa`).

## D5 · Regla 13

No se toca `apps/desk/src`. El guardián de D3 lee ese directorio pero no lo modifica. La tabla no aplica.
