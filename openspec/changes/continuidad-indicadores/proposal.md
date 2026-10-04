---
tanda: F1F-05
motivo: ""
capacidad: [kpis]
maestro: ["Anexo G.6", "Anexo G.6b", "Anexo D nº 66"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: continuidad de los nueve indicadores de Zoho (`continuidad-indicadores`)

Exploración contrastada: `openspec/changes/continuidad-indicadores/exploration.md`. Toda cita de esta
propuesta se comprobó contra el árbol de `f55b7d9`; lo no comprobado lleva la palabra «hipótesis».

## 1. Intención

Antes del corte del 14/12 Zoho deja de calcular los indicadores que Gerencia usa. La aplicación tiene
que calcularlos «sobre las marcas de tiempo de las transiciones» y entregarlos como «tabla exportable,
sin tablero, semáforos ni umbrales» (`openspec/config.yaml:2526-2527`), y durante las cuatro semanas
previas al corte tienen que poder compararse con los de Zoho «sobre los mismos tickets», con el
criterio de ≥ 95 % y un día de tolerancia (`openspec/config.yaml:2654-2655`). La fila es
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:129`; tiene que estar midiendo el 16/11
(`:270` del mismo plan).

Hoy no hay módulo de indicadores ni spec `kpis` (exploración §2). Éxito: un administrador descarga la
tabla de los nueve por ticket, y la misma tabla dice cuántos coinciden con Zoho y por qué no los demás.

## 2. Alcance

### Dentro

1. **Módulo puro en `packages/shared`** que calcula los indicadores de un ticket a la letra, y marca en
   cada valor **de qué fuente salió cada hito** (transición de la aplicación o columna de fecha
   heredada) y si el ticket es **reentrante**.
2. **Variante «fórmula de Zoho»** de cada indicador que difiere de la letra, y el **valor que Zoho
   calculó** cuando llegue en los datos sincronizados (§6, tarea de persona P-1).
3. **Lectura en servidor y ruta de sólo lectura para administradores**, con salida JSON y CSV.
4. **Comparación**: función pura que recibe pares (valor de la aplicación, valor de Zoho) y devuelve el
   porcentaje de tickets que coinciden con tolerancia de un día y la lista de diferencias mayores con
   el dato que las explica (festivos del intervalo, hito distinto, fuente del hito, reentrancia). La
   ruta la resume **sólo cuando el valor de Zoho está en los datos sincronizados**; si no llega, el
   resumen dice «sin valor de Zoho con que comparar» y no da ninguna coincidencia.
5. **Cliente:** un enlace de descarga visible para administradores. El `.tsx` sólo pinta.

### Fuera — y cualquiera de estas cosas es motivo de parada si el diseño la necesitara

Tabla de fotos periódicas o cualquier escritor nuevo · leer el export de Zoho o cualquier entrada con
cuerpo para cargarlo (pregunta de la bandeja, §15) · calcular el 51 o el 55 · escritura contra Zoho · envío de correo o de la
encuesta · relleno de datos de producción · cambios al sincronizador · tablero, semáforos y umbrales
(`R08.4.md:2959`) · el décimo indicador (`R08.4.md:2960`) · corregir la reentrancia (punto 66,
`R08.4.md:2961`) · corregir IV-11 o IV-12 · tocar `computeAnalisis`
(`packages/shared/src/analisis.ts:17-95`), que es otro cálculo.

## 3. Capacidades

### Nuevas
- `kpis`: crea `openspec/specs/kpis/spec.md`. **Ya está declarada** en `openspec/config.yaml:240`, así
  que R-2 se cumple sin tocar `capabilities`; el archivo deberá poner al día su texto de avance, que hoy
  dice que la capacidad no tiene spec (`openspec/config.yaml:263-265`).

### Modificadas
- Ninguna. `calendario-laboral` y `permissions` se **consumen** sin cambiar sus requisitos.

## 4. Los nueve, uno a uno

«Letra» es lo que se construye como valor principal. «Zoho» es la variante que se calcula al lado para
explicar la diferencia; sus fórmulas salen del export (exploración §4) y son **hipótesis sobre las 640
filas** hasta que el apply las verifique con un script.

| Col. | Letra (valor principal) | Variante de Zoho | Estado |
|---|---|---|---|
| 47 | Remisión de entrada → remisión de salida, días naturales (`R08.4.md:6287`) | **«sin dato — falta el hito»**: Zoho lo calcula hasta la hora del último cambio de estado (H-1) | La letra se calcula; la variante no |
| 49 | Marca de `ingreso_a_servicio` (`packages/shared/src/bodegaje.ts:225-226`) → revisión del informe, **días hábiles del calendario laboral** (`R08.4.md:6293`) | Fecha de creación → revisión del informe, lunes a viernes sin festivos | Calculable (S-2) |
| 50·53 | `diasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:196`) desde la orden de venta —o la recepción de repuestos si la hay— hasta la finalización; 0 si es negativo o no hay finalización (`R08.4.md:6296`) | Lo mismo, lunes a viernes sin festivos | Calculable |
| 51 | **«sin dato — falta el hito, pendiente de decisión»**. La letra lo define como hora de actualización del estado menos finalización (`R08.4.md:6299`) | «sin dato», por el mismo hito | **Falta el hito H-1; no se calcula** |
| 54 | «Cumple» si el 53 no supera el 52, «No cumple» si lo supera (`R08.4.md:6302`, `R08.4.md:6341`). Sin finalización el 53 vale 0 por la letra (`R08.4.md:6296`), luego sale «Cumple», con la marca **«sin finalizar»** al lado. **Sin tiempo promesa la letra no dice nada: «sin dato — pendiente de decisión»** | «Cumple» también sin tiempo promesa | Calculable salvo sin tiempo promesa (pregunta, §15) |
| 55 | **«sin dato»**; si el valor de Zoho ya llega sincronizado, va en la columna del valor de Zoho (`valorZoho`), nunca en `valor` | — | **Falta el hito H-2** |
| 57 | Revisión del informe → cotización, días naturales con signo (`R08.4.md:6308`) | Igual | Calculable |
| 58 | Cotización → orden de compra, días naturales con signo (`R08.4.md:6311`) | Igual | Calculable |
| 59 | Cotización → orden de venta, días naturales con signo (S-1) | Igual | Calculable (S-1) |

**Fuente de cada hito.** Para un ticket llevado por la aplicación, las fechas salen de
`ticket_transitions.values` (`packages/zoho-sync/src/db/schema.sql:57-61`), como manda
`packages/shared/src/reentrancia.ts:24`. Para un ticket heredado no hay filas ahí
(`apps/desk/server/db/equipos.ts:297-298`) y se usan las columnas `fecha_*`
(`packages/zoho-sync/src/db/schema.sql:32-37`). Cada valor dice cuál de las dos usó.

### Hitos que faltan — dichos antes de construir, como pide la letra

- **H-1 · Hora del último cambio de estado.** La aplicación no la guarda como columna
  (`packages/shared/src/transitions.ts:252-255` ya lo anota). La define el 51 del maestro y la usa el 47
  real de Zoho. La letra manda que un hito que falta «se dice antes de construir y se decide aparte»
  (`openspec/config.yaml:2655`), así que **no se aplica ningún supuesto**: el 51 y la variante de Zoho
  del 47 salen «sin dato — falta el hito, pendiente de decisión». El módulo recibe ese hito como una
  entrada opcional, hoy siempre vacía, para enchufarlo cuando se decida sin rehacer el cálculo. Opciones
  a decidir: la remisión de salida, la última transición registrada, o guardar la hora del cambio de
  estado (esta última es un escritor nuevo y queda fuera de este cambio).
- **H-2 · Satisfacción del cliente.** No existe en la aplicación
  (`apps/desk/src/components/ClienteDetalle.tsx:174` es un rótulo fijo). La encuesta es manual y la
  carga es de enero, sin fila (`openspec/config.yaml:2857-2858`; `docs/sdd/ENTRADA.md:1212-1217`).

## 5. Supuestos aplicados — razonables y reversibles

Cada uno es un parámetro del módulo puro: cambiarlo es cambiar una línea y sus pruebas.

| # | Supuesto | Por qué | Pregunta para la bandeja |
|---|---|---|---|
| S-1 | El 59 es orden de venta menos cotización, días naturales con signo | El maestro no da fórmula (`R08.4.md:6314`); ocho filas del export lo confirman (exploración §4). Hipótesis para el resto del fichero | ¿Es ésa la definición del 59? |
| S-2 | El 49 se mide en días hábiles del calendario laboral | Zoho lo mide en días de lunes a viernes (seis filas), y `decision/calendario-habil` prohíbe otro cálculo de hábiles (`openspec/config.yaml:2554-2555`). La letra sólo nombra «días hábiles» para el 50·53 | ¿El 49 va en hábiles o en naturales? |
| S-5 | Reentrancia: último valor escrito más marca de «reentrante» | Es lo que hace Zoho; el punto 66 sigue abierto (`R08.4.md:2961`) y no se resuelve aquí | — (ya es el punto 66) |
| S-7 | Unidades: días naturales para 47, 57, 58 y 59; hábiles para 49 y 50·53 | Lo que Zoho calcula hoy (exploración §4) | Va con S-2 |
| S-8 | La comparación publica **dos** porcentajes: letra contra Zoho, y variante de Zoho contra Zoho | El segundo dice si la diferencia del primero es de fórmula o de dato. Sin él, un 80 % no se puede explicar por escrito | — |

Los números S-3, S-4 y S-6 quedan sin usar a propósito: eran supuestos y dejaron de serlo.

**Lo que NO es supuesto:**

- Los días hábiles del 50·53 se construyen a la letra, con festivos, aunque bajen la coincidencia. La
  variante de Zoho va al lado para explicarlo.
- El 54 es el 53 contra el 52 porque lo dice el maestro (`R08.4.md:6302`, `R08.4.md:6341`), y sin
  finalización sale «Cumple» porque el maestro hace valer 0 al 53 (`R08.4.md:6296`). Se construye así,
  con la marca «sin finalizar», y se pregunta si es lo que se quiere.
- El 54 sin tiempo promesa, el 51 y el 55 **no se suponen**: salen «sin dato» y van a la bandeja.

## 6. Tareas de persona — fuera del recuento

Archivar el cambio **no las da por hechas** (regla del ciclo 1).

| # | Qué | Dueño | Qué desbloquea | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Consulta de sólo lectura en producción: ¿llegan los valores de las columnas 47 a 59, y la satisfacción, en `desk.tickets.custom_fields` o en `raw`? | Quien administra el despliegue | Saber si el resumen de comparación tendrá valor de Zoho; si no llega, abre la pregunta de cómo se compara (§15) | `docs/sdd/ENTRADA.md`, entrada nueva |
| P-2 | Desplegar antes del 13/11 para que mida desde el 16/11 | Quien administra el despliegue | La comprobación de cuatro semanas | Ídem |
| P-3 | Comprobar las cuatro semanas y explicar por escrito cada diferencia mayor de un día | Gerencia, con Servicio Técnico y Comercial | Dar los nueve por buenos | Ídem |
| P-4 | Responder S-1, S-2, H-1, H-2 y las dos preguntas del 54 | Gerencia | Cerrar la fila | Ídem |

## 7. Enfoque

- **Dominio puro** en `packages/shared/src/indicadores.ts`: entra un ticket con sus fechas y su
  historial, salen los nueve valores con fuente, variante y marcas. Reutiliza `diasHabilesEntre`,
  `diaEnZona` (`packages/shared/src/fechasDerivadas.ts:63`) y `marcaIngresoAServicio`. Los cierres de
  empresa entran como parámetro.
- **Lectura** en `apps/desk/server/indicadores.ts`, con el molde de `apps/desk/server/analisis.ts:11-32`:
  **tres consultas en total** —tickets del periodo, todas sus transiciones de una vez agrupadas en
  memoria por `ticket_id` (índice en `packages/zoho-sync/src/db/schema.sql:78`), y los cierres
  (`apps/desk/server/db/calendarioCierres.ts:31-34`)—. Ninguna consulta por ticket: no hay N+1.
  Volumen, **hipótesis**: cientos de tickets y unos miles de transiciones. El periodo va como parámetro
  ligado, nunca concatenado.
- **Ruta** `GET /api/indicadores` con `?formato=csv`, registrada como `apps/desk/server/app.ts:56`.
- **CSV generado en el servidor**, para que el escapado se pruebe en `.ts`: comillas duplicadas, y
  apóstrofo delante de toda celda que empiece por `=`, `+`, `-` o `@`. Los negativos numéricos (57, 58,
  59) se emiten como número, y esa excepción lleva su prueba.
- **Comparación** pura en `packages/shared`: recibe pares (valor de la aplicación, valor de Zoho). Un
  par sin valor de Zoho, o con «sin dato» en cualquiera de los dos lados, **no cuenta como
  coincidencia ni como diferencia**: se cuenta aparte como «sin comparar». La ruta sólo arma pares con
  lo que ya esté en los datos sincronizados; no lee ningún fichero.

### Regla 13 — casilla marcada

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Mostrar el enlace sólo a administradores (molde: `apps/desk/src/components/Header.tsx:90`) | `requireAuth` (`apps/desk/server/auth/middleware.ts:14-23`) y `requireAdmin` (`:26-29`), delante de la consulta, como en `apps/desk/server/routes/analisis.ts:11`. La línea de la ruta nueva se cita al construirla y la prueba el lote 3 |

El cliente no calcula, no filtra y no formatea nada.

## 8. Lotes y estimación

Código y pruebas por separado, pruebas ×1,8, más casillas de `tasks.md` y `apply-progress.md`. La
tanda anterior midió 1,6 veces lo estimado, así que cada lote se dimensiona para caber en la válvula de
720 **después** de aplicar ese factor.

| Lote | Contenido | Código | Pruebas | Casillas | Estimado | ×1,6 |
|---|---|---|---|---|---|---|
| 1 | Tipos, hitos con su fuente, tiempos naturales (47, 57, 58, 59), reentrancia, y el 51 y el 55 como «sin dato» con su entrada opcional | 115 | 205 | 25 | 345 | 552 |
| 2 | Hábiles (49, 50·53), 54 con sus dos marcas, variantes de Zoho (la del 47, «sin dato») | 125 | 225 | 25 | 375 | 600 |
| 3 | Lectura en servidor y ruta JSON con permiso | 120 | 215 | 20 | 355 | 568 |
| 4 | CSV con escapado, salida CSV de la ruta y enlace en el cliente | 100 | 180 | 20 | 300 | 480 |
| 5 | Comparación pura por pares y resumen en la ruta, con el caso «sin valor de Zoho con que comparar» | 110 | 200 | 20 | 330 | 528 |

Total estimado 1.705; ninguno pasa de 720 con el factor aplicado. Los artefactos de planificación se
commitean aparte.

### Mutaciones que la tanda tiene que reproducir

- **De posición (regla 1):** mover `requireAdmin` detrás de la consulta, y `requireAuth` detrás de
  `requireAdmin`; una prueba con usuario sin rol debe comprobar que la base no se leyó.
- **De fórmula:** cambiar hábiles por naturales en el 50·53; quitar un festivo del intervalo; invertir
  un hito (desde por hasta) en cada tiempo; cambiar `(desde, hasta]` por `[desde, hasta]`; preferir la
  orden de venta a los repuestos cuando hay los dos; quitar el tope en 0 del 50; tomar el primer valor
  en vez del último en un ticket reentrante; leer la columna en vez del historial.
- **De hito faltante:** hacer que el 51 devuelva un número con la entrada opcional vacía; hacer que la
  variante de Zoho del 47 caiga en la remisión de salida; quitar la marca «sin finalizar» del 54; dar
  «Cumple» sin tiempo promesa.
- **De comparación:** subir la tolerancia de 1 a 2; contar como coincidente un «sin dato»; contar como
  coincidente un par sin valor de Zoho.
- **Del CSV:** quitar el escapado de cada uno de los cuatro caracteres, y el de las comillas.
- **Del fichero vigilado (regla 2):** no aplica; ningún guardián de esta tanda lee un fichero de datos.

## 9. Áreas afectadas

| Área | Impacto | Qué cambia |
|---|---|---|
| `packages/shared/src/indicadores.ts` (+ prueba) | Nuevo | Cálculo, variantes y comparación |
| `apps/desk/server/indicadores.ts`, `apps/desk/server/routes/indicadores.ts` (+ pruebas) | Nuevo | Lectura, ruta, CSV |
| `apps/desk/server/app.ts` | Modificado | Registro de la ruta |
| `apps/desk/src/api/client.ts`, un componente de análisis | Modificado | Enlace de descarga |
| `openspec/specs/kpis/spec.md` | Nuevo | Spec de la capacidad |

`app.ts` y `client.ts` reciben líneas nuevas: el cierre barre sus citas (regla de mutación 4).

## 10. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Los valores de Zoho no llegan sincronizados y la comparación no tiene con qué comparar | Alta (hipótesis: son columnas de informe) | P-1 cuanto antes; el resumen lo dice en vez de inventar una coincidencia; cómo se compara entonces es pregunta de la bandeja y otro cambio |
| La coincidencia a la letra queda por debajo del 95 % por los festivos y por el 47 | Alta | S-8: el segundo porcentaje y la lista de diferencias dan la explicación escrita que la letra pide |
| La tabla se despliega con dos de los nueve «sin dato» y sin comparación posible | Alta | `cierra: no`; H-1, H-2 y la pregunta de la comparación en la bandeja, con dueño |
| IV-11: el sincronizador reescribe `fecha_orden_venta` y mueve el 50·53 y el 59 | Baja | Se anota la fuente del hito; no se corrige aquí |
| Reentrancia en tres de los nueve | Media | Marca por ticket; punto 66 sigue abierto |
| No llegar al 13/11 | Media | Lotes 1 a 4 entregan la tabla; el 5, la comparación |

## 11. Reversión

No hay migración, ni escritor, ni dato nuevo. Revertir es retirar el registro de la ruta en `app.ts` y
el enlace del cliente, o revertir el commit de fusión. Nada queda en la base.

## 12. Dependencias

- Calendario laboral (F1B-12), construido: `packages/shared/src/calendarioLaboral.ts:196`.
- P-1, para saber si el resumen de comparación tendrá valor de Zoho. No bloquea construir.

## 13. Criterios de éxito

- [ ] Un administrador obtiene la tabla de los nueve en JSON y en CSV; un usuario sin rol recibe 403 y
      la base no se consulta.
- [ ] Cada valor dice de qué fuente salió su hito y si el ticket es reentrante.
- [ ] El 50·53 usa el calendario laboral y su variante de Zoho no: una prueba con un festivo en el
      intervalo da dos números distintos.
- [ ] El 51, el 55 y la variante de Zoho del 47 salen «sin dato» y dicen por qué; no hay ninguna
      lectura inventada, y el hito del 51 se puede enchufar sin tocar el resto del cálculo.
- [ ] El 54 sin tiempo promesa sale «sin dato», y sin finalización lleva la marca «sin finalizar».
- [ ] Con valor de Zoho, el resumen da los dos porcentajes y la lista de diferencias mayores de un día
      con su causa; sin él, dice «sin valor de Zoho con que comparar» y no da porcentaje.
- [ ] El CSV neutraliza `=`, `+`, `-`, `@` y las comillas.
- [ ] Las mutaciones de §8 se reproducen y cada una se pone roja.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde; cada lote por debajo de 800 medido.

## 14. Por qué `cierra: no`

La fila pide **nueve** indicadores. Esta tanda calcula **siete** (47, 49, 50·53, 54, 57, 58 y 59); el
51 y el 55 salen «sin dato» porque a la aplicación le falta el hito, y la letra manda decidirlos
aparte. Además la comparación puede quedarse sin valor de Zoho, y la comprobación de las cuatro semanas
es de personas. Decir `cierra: si` contaría en el avance una fila cuya letra no se cumple entera. La
cierra un cambio posterior con `tanda: F1F-05`, una vez decididos H-1 y H-2.

## 15. Ronda de preguntas de la propuesta

El modo es `auto` (`openspec/config.yaml:25-30`): no se paró a preguntar. Las preguntas quedan aquí y
van a `docs/sdd/ENTRADA.md` a partir de la **E-171** (en este árbol la última es la E-159,
`docs/sdd/ENTRADA.md:1787`; las E-160 a E-170 las usan otras ramas).

1. **E-171 · H-1 / 51:** falta la hora de actualización del estado. ¿Con qué hito se calcula el tiempo
   de recogida: la remisión de salida, la última transición registrada, o se empieza a guardar la hora
   del cambio de estado? Hasta la respuesta sale «sin dato».
2. **E-172 · H-2 / 55:** la aplicación no tiene la satisfacción. ¿La fila espera a la carga de enero, o
   se decide otra fuente?
3. **E-173 · comparación:** si los valores de Zoho no llegan por el sincronizador (P-1), ¿se compara
   cargando el export en memoria, o de otra forma? Hoy el resumen diría «sin valor de Zoho con que
   comparar».
4. **E-174 · 47:** Zoho lo calcula hasta el último cambio de estado y no hasta la remisión de salida.
   ¿Se da por buena la diferencia, explicada una vez? (Su variante depende de H-1.)
5. **E-175 · 54 sin tiempo promesa:** la letra no lo define y Zoho dice «Cumple». ¿Qué debe decir?
6. **E-176 · 54 sin finalización:** a la letra sale «Cumple», porque el 53 vale 0. ¿Se mantiene, o
   pasa a «sin dato»?
7. **E-177 · S-2:** ¿el tiempo de diagnóstico va en días hábiles?
8. **E-178 · S-1:** ¿el tiempo de orden de venta es orden de venta menos cotización?

## 16. Lo que el maestro necesita

`toca_maestro: si`. Al archivar: el Anexo H deja de decir «sin empezar» (`R08.4.md:6560`); el G.6
debería recoger que el 47 de Zoho no usa la remisión de salida, que el 59 tiene fórmula y que el 51
depende de un dato que Desk 2.0 no guarda. Va como texto a
`docs/sdd/F0-01_Correcciones_para_el_maestro.md`, no al `.docx`.
