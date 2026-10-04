# Informe de archivo — remision-creada-sin-salida (F1B-03)

**Tanda:** F1B-03 · **cierra:** no · **Fecha:** 2026-10-04 · **Rama:** `remision-creada-sin-salida`, nacida de
`main` en `2a74fdc`. La rama no se ha fusionado ni empujado: la fusión la autoriza el usuario.

## Qué parte de la fila cubre

**Cubre** el caso sin salida que dejó la parte L de F1B-03: un ticket en «Remisión creada» sin remisión de
entrada vigente recibía el `422` de la guarda de «Habilitar Servicio» y no tenía botón para crear la remisión que
se le pedía. Ahora el predicado compartido admite los tres orígenes de «Habilitar Servicio» y una prueba de
servidor fija que el alta de remisión responde `201` desde los tres. **Deja fuera** todo lo demás de la fila: el
acto de la orden de venta interna de garantía y los prefijos (esperan E-157 y E-094), y la guarda de estado en el
alta de remisión (E-184). Por eso lleva `cierra: no`.

## Commits y medidas

Las medidas son `git diff --shortstat --no-renames` entre commits, y coinciden con el registro de intentos.

| Fase | Commit | Medida |
|---|---|---|
| Planificación | `6186c98` | artefactos del cambio, fuera de intento |
| Lote único | `55a4cba` | 347 (290 insertadas, 57 borradas); el registro anotó 347 |
| Verify y remediación de W-1 | `3cf017e` | 121 (el informe, 111, y la prueba de la remisión anulada, 10); el registro anotó 121 |
| Ancla de una cita del informe | `af6dd0c` | 2, fuera de intento |
| Archive, parte revisable | este commit | la fusión de los deltas (200 líneas añadidas), este informe y cuatro entradas de la bandeja |

## Qué cambió

- `puedeCrearRemisionDeEntrada` admite «Remisión creada» además de «OV asignada» y «Ticket creado».
- `botonRemision` no ofrece el botón en «Remisión creada» mientras las remisiones no han cargado.
- Tres comentarios reescritos en su sitio. Ningún fichero de código cambia de número de líneas: el predicado sigue
  en 397, el botón en 43 y el panel en 267.
- No se tocó la guarda de «Habilitar Servicio», ni el alta de remisión, ni el catálogo de transiciones, ni
  ningún estado del blueprint.

## De dónde sale el ticket atascado

Por las rutas de la aplicación no se produce: anular la última remisión devuelve el ticket a «Ticket creado», y
un ticket venido de Zoho no entra en esa fase. Quedan tres orígenes, los tres hipótesis sin recuento en
producción: escrituras directas en la base, una petición caída entre la anulación y su sincronización (E-186), y
una remisión confirmada que no sea de entrada (E-187).

## Pruebas y mutaciones

- Suite: 2.991 pruebas pasan y 2 omitidas en 189 ficheros más 1 omitido (antes del cambio: 2.954 en 188).
  Typecheck limpio. Lint: 165 avisos y 0 errores. Los tres con código de salida 0, medidos por el orquestador.
- Rojo previo observado en siete pruebas; el resto del lote son pruebas de caracterización, declaradas como tales.
- Mutaciones reproducidas por el orquestador, todas caen: quitar cada uno de los tres estados del predicado;
  añadir a «Habilitar Servicio» un cuarto origen ficticio y uno real sin tocar el predicado; y las tres de la
  protección de carga. El verificador repitió dos.
- No hay mutación de posición, y es a propósito: con las remisiones sin cargar la lista de vigentes está vacía,
  así que ninguna guarda vecina puede activarse a la vez; mover la protección es un mutante equivalente.

## Verificación

Veredicto **PASS con avisos**: ningún hallazgo crítico. **W-1**, cerrado en `3cf017e`: faltaba recorrer por HTTP
el ticket con su única remisión de entrada anulada. **W-2**, abierto: las comprobaciones de persona.

## Regla invariable 13

El servidor acepta el alta desde los tres orígenes y lo fija una prueba. Que el botón NO se ofrezca fuera de
ellos no tiene contrapartida en el servidor: es un hueco anterior a este cambio, declarado y no corregido (E-184).

## Fusión de los deltas y barrido de citas

- Fusión por script, bloque a bloque: RQ-RE-28 al final de la spec viva de `remisiones` y RQ-TS-34 al final de la
  de `transitions-st`. Los dos bloques vivos son idénticos a los de los deltas. Sólo añadidos al final.
- **Citas desplazadas por este archivo: ninguna.** Método: para cada cita completa a una spec viva presente en
  `main`, sin excluir `archive/`, se compara la línea citada antes y después; al añadir sólo al final, ninguna se
  mueve.
- **Una cita queda superada (caso C), y no se edita porque es un registro fechado:** el paquete de despliegue del
  2026-10-04, en su línea 141, afirma que ese ticket se queda sin botón. Era cierto de `24a14eb`; lo cierra este
  cambio. El próximo paquete tiene que decirlo.
- Las 48 citas rotas de antes (E-183) no se tocan.

## Lo que este cambio añade al paquete de despliegue

- **Esquema:** nada. **Variables de entorno:** ninguna. **Servicio:** la aplicación; el worker no cambia.
- **Comportamiento:** el botón «Crear remisión» aparece en un ticket en «Remisión creada» sin remisión de entrada
  vigente. Retira el riesgo que el paquete del 04/10 anotaba para la guarda de F1B-03.
- **No cambia** la condición de parada de F1B-03: la guarda sigue esperando la respuesta a E-158 y los recuentos.

## Pendiente de personas — archivar NO lo da por hecho

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Ver en la aplicación que el botón aparece en un ticket atascado y no en uno sano ni durante la carga | quien verifica en la aplicación, tras el despliegue | `tasks.md` de este cambio, sección de personas |
| Recuento en producción de tickets en «Remisión creada» sin entrada vigente | quien administra el despliegue | E-185 de `docs/sdd/ENTRADA.md` |
| Decidir si el servidor impone el estado en el alta | Gerencia | E-184 de `docs/sdd/ENTRADA.md` |

## Incidencia de método

El intento de verify se asentó con el detector de citas saliendo con código 1 sobre `3cf017e`: se encadenó el
asiento sin mirar antes ese código, y el diagnóstico del registro dice «detector con salida 0», que no era cierto
de ese commit. La causa era una cita del informe que la prueba añadida para W-1 dejó sobre una línea vacía. Se
reparó en `af6dd0c`, donde el detector sale con 0. Desde entonces el asiento se hace sólo después de ver los
códigos.

## Regla del archivo

La parte con carga de revisión —la fusión de los deltas, este informe y las entradas de la bandeja— está muy por
debajo de 800 líneas; el resto del commit es la mudanza de la carpeta. El commit contiene sólo este cambio.
