---
tanda: F1F-05
motivo: ""
capacidad: [kpis]
maestro: ["Anexo G.6", "Anexo G.6b"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: la comparación de los nueve indicadores lee la exportación de Zoho (`comparacion-exportacion-zoho`)

Sin exploración previa: no hay artefacto `explore` de este cambio. Toda cita de esta propuesta se comprobó
leyendo la línea en el árbol de `62181fc`; lo no comprobado lleva la palabra «hipótesis». `R08.4.md` es
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`. «El fichero de muestra» es
`docs/analisis-tickets/Tickets.csv`.

## 1. Intención

Gerencia decidió con qué se compara (`openspec/config.yaml:4092`): «Comparación: con la exportación de
Zoho». Hoy `GET /api/indicadores` arma los pares sólo con lo ya sincronizado en `custom_fields`
(`apps/desk/server/routes/indicadores.ts:52-53`), leído por `valorDeZoho`
(`packages/shared/src/indicadores.ts:109`). Si esos valores no llegan por el sincronizador, el resumen
dice «sin valor de Zoho con que comparar» y la comprobación del G.6b (`R08.4.md:6317`) no puede hacerse.

Éxito: un administrador sube la exportación de Zoho Desk de la semana y recibe, sin que nada se guarde,
el resumen de comparación de los nueve indicadores contra ese fichero, con los tickets que no cruzan
contados y listados en los dos sentidos.

**Qué parte de la fila cubre:** la tercera parte de `decision/e171-e172-e173-indicadores-51-55`
(`openspec/config.yaml:4083`), el cargador de la exportación. **Qué deja fuera:** la medición en paralelo
de cuatro semanas desde el 16/11, que es tarea de personas (§5, §14).

## 2. Alcance

### Dentro

1. **Lector de la exportación**, módulo puro: entra el texto del fichero, salen la cabecera validada, una
   bolsa de campos por fila (sólo clave e indicadores) y las filas rechazadas con número de fila y motivo.
2. **Columnas exigidas, doce:** «ID», «ID de la solicitud» y las diez de indicadores («Tiempo
   permanecía», «Tiempo de diagnóstico», «Tiempo de servicio», «Tiempo total servicio», «Tiempo recogida
   del equipo», «Cumplimiento del tiempo  promesa», «Calificación de satisfacción», «Tiempo de
   cotización», «Tiempo de orden de compra», «Tiempo de orden de Venta»), reconocidas por nombre
   normalizado. Si falta alguna, la carga se **rechaza con `400`** y el mensaje **nombra** las que faltan.
   Nunca «sin valor de Zoho» en silencio por un fichero de otro formato: es lo que hace verificable S1.
3. **Cruce** por «ID» ↔ `desk.tickets.id`. «ID de la solicitud» sólo nombra al ticket en los listados y
   detecta la discrepancia de número (§4, a). Una clave que no sea sólo dígitos es fila rechazada con
   motivo; nunca se cruza aproximando.
4. **Tickets que no cruzan, en los dos sentidos:** del fichero que no están en Desk, y de Desk del
   periodo que no están en el fichero. Se cuentan y se listan.
5. **Ruta nueva sólo para administradores**, con la escalera de la actual
   (`apps/desk/server/routes/indicadores.ts:40`): sesión `401` < administrador `403` < parámetros o
   fichero `400`. Multer en memoria detrás de las dos guardas (molde
   `apps/desk/server/routes/encuestaRespuestas.ts:19`), con el límite común `LIMITE_SUBIDA_BYTES`
   (`apps/desk/server/util/subida.ts:6`, 10 MB) y el `413` del manejador central
   (`apps/desk/server/app.ts:86`). El límite se declara en la spec y se prueba.
6. **Los valores del fichero entran por el mismo camino que hoy**: la fila como bolsa de campos de
   `valorDeZoho`, y el resumen lo arma `compararIndicadores`
   (`packages/shared/src/indicadoresComparacion.ts:90`). Sin segunda implementación de la comparación,
   sin veredicto y con la tolerancia de un día (`packages/shared/src/indicadoresComparacion.ts:7`).
7. **Privacidad:** el fichero lleva nombre y correo del contacto. No se guardan, no se registran en logs
   y no se devuelven. Sólo se leen la clave y las columnas de indicadores; el motivo de una fila
   rechazada nombra fila y columna, nunca el contenido de la celda.
8. **Cliente:** en «Análisis», junto al enlace de hoy (`apps/desk/src/components/Analisis.tsx:83`), un
   selector de fichero que lo sube y pinta el resumen. Lo decidible va en `apps/desk/src/lib/*.ts`.
9. **`DEPLOY.md` §9** (`DEPLOY.md:263`): cómo se exporta y se sube, el límite y qué no se guarda.
10. **Delta de `kpis`** (§3).

### Fuera — cualquiera de estas cosas es motivo de parada si el diseño la necesitara

Guardar el fichero o sus filas (sin tabla, sin migración, sin variables de entorno) · el cálculo del 55 ·
el 47 y la lectura de la columna 12 (§4, c) · reordenar o cambiar las fórmulas de los otros ocho ·
veredicto, semáforo o umbral del 95 % · las preguntas E-174 a E-180 y E-182 de `docs/sdd/ENTRADA.md`
(E-174 en `docs/sdd/ENTRADA.md:1864`), que siguen abiertas en Gerencia · n8n · el sincronizador ·
`jsdom` o pruebas de `.tsx`.

## 3. Capacidades

### Nuevas
- Ninguna. R-2 no aplica: `kpis` ya está declarada (`openspec/config.yaml:240`) y tiene spec viva.

### Modificadas
- `kpis` — delta sobre `openspec/specs/kpis/spec.md`. La decisión cita la línea 257 de esa spec
  (`openspec/config.yaml:4107`) y esa línea ya no dice la prohibición: se buscó por contenido.

| Requisito | Qué cambia |
|---|---|
| RQ-KP-14 (`openspec/specs/kpis/spec.md:492-497`) | «Ni leer ningún fichero» se acota al `GET`, que sigue igual: cuatro consultas, sólo lectura, ningún fichero |
| RQ-KP-17 (`openspec/specs/kpis/spec.md:599-602`) | El `GET` sigue armando pares sólo con lo sincronizado. «**MUST NOT** leer ningún fichero ni cargar el export de Zoho» deja de valer para la capacidad: lo hace la ruta nueva |
| RQ-KP-18 (`openspec/specs/kpis/spec.md:616`) | Cae «**MUST NOT** añadir pantalla de carga en el cliente» (`openspec/specs/kpis/spec.md:627`) y «el cliente **MUST** limitarse a un enlace de descarga» (`openspec/specs/kpis/spec.md:625-626`): enlace más carga de la comparación. Se mantiene todo lo demás: la única escritura admitida sigue siendo la de la encuesta |
| Tabla de supuestos | SP-9 (`openspec/specs/kpis/spec.md:34`) se acota al `GET`; entran S1 a S9 |

| Requisito nuevo | Contenido |
|---|---|
| RQ-KP-23 | Lector de la exportación: formato, doce columnas por nombre, `400` que nombra las que faltan, filas rechazadas con motivo |
| RQ-KP-24 | Clave de cruce: «ID» ↔ `tickets.id`, sólo dígitos; discrepancia de número; ID repetido |
| RQ-KP-25 | No cruzados en los dos sentidos, contados y listados |
| RQ-KP-26 | Ruta de comparación: permiso, escalera, límite, forma de la respuesta, sólo lectura |
| RQ-KP-27 | Privacidad: qué se lee, y qué no se guarda, registra ni devuelve |
| RQ-KP-28 | Cliente: sube y pinta; sin color, meta ni veredicto |

## 4. Mediciones previas

Hechas por quien encarga sobre las 640 filas del fichero de muestra; aquí se comprobó la parte de código
y la cabecera (59 columnas, primera línea del fichero). Los recuentos de filas no se repitieron: son
**hipótesis** de segunda mano hasta que el diseño los remida.

**a) Clave de cruce.** El fichero trae «ID» (columna 1, 18 dígitos, 640 únicos) e «ID de la solicitud»
(columna 8, enteros de 171 a 873, 640 únicos). El sincronizador mapea `id: raw.id` y
`number: Number(raw.ticketNumber)` (`packages/zoho-sync/src/db/mappers.ts:46`); en el esquema son
`id text PRIMARY KEY` (`packages/zoho-sync/src/db/schema.sql:21`) y `number integer UNIQUE NOT NULL`
(`packages/zoho-sync/src/db/schema.sql:22`). Verificado por código: «ID» ↔ `desk.tickets.id`. Que «ID de
la solicitud» sea `ticketNumber` es **hipótesis** apoyada en los valores: ninguna línea de código nombra
esa cabecera. Por eso se cruza por «ID», y el número sólo se contrasta: si el `id` cruza y el número no
coincide con `tickets.number`, se cuenta y se lista; el par se compara igual, porque la clave es el `id`.

**b) Qué prohíbe hoy leer un fichero.** Tres requisitos: RQ-KP-14, RQ-KP-17 y RQ-KP-18, en las líneas
de §3. Los tres se modifican; el `GET` no cambia de comportamiento.

**c) Columna 12 y el 47 (E-174) — hallazgo, no alcance.** «Tiempo permanecía» (col. 47) es el día de
«Hora de actualización del estado» (col. 12) menos «Fecha Remisión Entrada» (col. 39), exacto en 201 de
202 filas comparables y dentro de un día en 202 de 202; la col. 12 no viene vacía en ninguna fila. Es el
dato que le falta a la variante «fórmula de Zoho» del 47, que hoy sale «sin dato»
(`packages/shared/src/indicadores.ts:238`). **Esta tanda no cambia el 47 ni lee la columna 12**: se
anota para Gerencia y el cambio siguiente (§13).

**d) Nombres.** Los nombres buscados están en `NOMBRES_ZOHO` (`packages/shared/src/indicadores.ts:65-75`)
y `valorDeZoho` normaliza tildes, mayúsculas y espacios (`packages/shared/src/indicadores.ts:92`,
`packages/shared/src/indicadores.ts:110`): «Tiempo permanecía» casa con «Tiempo permanecia» y los dos
espacios de «Cumplimiento del tiempo  promesa» se colapsan. Las diez cabeceras del fichero casan sin
tocar `NOMBRES_ZOHO`. Límite conocido: un número sólo se acepta si es entero
(`packages/shared/src/indicadores.ts:117`).

## 5. Supuestos aplicados — razonables y reversibles

Modo `auto` (`openspec/config.yaml:26`). Ninguno cambia el alcance de la fila, cuesta dinero, toca datos
de producción ni contradice una decisión registrada. **Van a la lista semanal de supuestos para
Gerencia**, agrupados bajo F1F-05. S1 y S2 son de quien encarga; S3 a S9, de esta propuesta.

| # | Supuesto | Por qué | Cómo se revierte |
|---|---|---|---|
| S1 | La exportación de noviembre trae las mismas columnas que el fichero de muestra: 59, separador coma, comillas, BOM UTF-8, CRLF | Es la única muestra del repositorio | Si falta una de las doce, el `400` la nombra; se ajusta el lector, no la ruta |
| S2 | El fichero se sube, se compara y **no se guarda** | La decisión pide comparar, no archivar; lleva datos de contacto | Tabla calificada en `public`, con tanda propia |
| S3 | Se exigen las doce columnas que se leen, no las 59 | Verifica S1 donde importa y no ata la carga a columnas que no se usan | Ampliar la lista del lector |
| S4 | En esta ruta el valor de Zoho sale **sólo** del fichero; un ticket del periodo ausente del fichero no se completa con `custom_fields` | Mezclar dos fuentes haría indistinguible de dónde sale cada par | Añadir la bolsa sincronizada detrás de la del fichero |
| S5 | Un «ID» repetido en el fichero: vale la primera fila y las siguientes se rechazan con motivo | En la muestra no hay repetidos; no se elige en silencio | Una línea del lector |
| S6 | Un ticket del fichero que existe en Desk pero fuera del periodo pedido se cuenta **aparte** de «no está en Desk» | Decir «no está» de un ticket que sí está sería falso. Cuesta una consulta de lectura más, constante | Quitar la consulta y fundir las dos listas |
| S7 | El periodo va por los mismos parámetros `desde` y `hasta` del `GET`, validados por `validarPeriodo` (`apps/desk/server/indicadores.ts:26`); el `400` de parámetros precede al del fichero | Una sola noción de periodo | Orden de dos guardas |
| S8 | Una celda de indicador no vacía que `valorDeZoho` no acepta (un decimal, un texto) se cuenta y se lista por columna como «valor ilegible» | Si no, pasaría a «sin comparar» en silencio | Quitar el listado |
| S9 | Los listados salen completos, sin paginar | 640 filas en la muestra | Tope con recuento total |

**Lo que NO es supuesto:** que la comparación se haga con la exportación es letra de la decisión; que
no lleve veredicto es RQ-KP-16 (`openspec/specs/kpis/spec.md:567`).

## 6. Tareas de persona — fuera del recuento

Archivar el cambio **no las da por hechas** (regla del ciclo 1). Ninguna describe trabajo que una tanda
pueda hacer en este repositorio.

| # | Qué | Dueño | Qué desbloquea | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Exportar el fichero de Zoho Desk cada semana desde el 16/11 y subirlo, sin pasarlo por una hoja de cálculo | Quien administra la aplicación | Que haya comparación con datos reales | `DEPLOY.md` §9 y `docs/sdd/ENTRADA.md`, en el cierre |
| P-2 | Juzgar el 95 % y explicar por escrito cada diferencia mayor (`R08.4.md:6317`) | Gerencia | Cerrar la fila F1F-05 | Ídem |
| P-3 | Desplegar antes del 13/11 (`DEPLOY.md:270`) | Quien administra el despliegue | Que la ruta exista en producción | `DEPLOY.md` |

## 7. Enfoque

Sin diseñar en detalle: eso es de `sdd-design`.

- **Lector y cruce, puros.** En `packages/shared`, junto a la comparación. Lee CSV con comillas, comillas
  dobladas y saltos de línea dentro de un campo (la columna «Descripción» es texto libre). No conoce la
  base. Devuelve por fila sólo la clave, el número y las diez celdas de indicadores: lo demás no sale
  del lector, que es lo que sostiene la privacidad por construcción.
- **Decodificación.** Reutiliza `decodificarFichero`
  (`apps/desk/server/encuesta/analizarRespuestas.ts:27`). Si el lector de CSV de la encuesta sirve para
  este fichero es **hipótesis**: el diseño decide entre extraer uno común o declarar los dos, para no
  dejar dos implementaciones de la misma noción sin enfrentar (molde H5).
- **Ruta.** Fichero nuevo bajo `apps/desk/server/routes/`, registrado en `apps/desk/server/app.ts:61`
  sin insertar líneas. `requireAuth` y `requireAdmin` (`apps/desk/server/auth/middleware.ts:14`,
  `apps/desk/server/auth/middleware.ts:26`) delante de multer. Reutiliza `leerEntradasIndicadores`
  (`apps/desk/server/indicadores.ts:56`) y `tablaIndicadores` (`apps/desk/server/indicadores.ts:94`); el
  valor de Zoho de cada par se sustituye por el de la fila del fichero antes de `compararIndicadores`.
  Una fila mala **no** es `400`: va a rechazadas y las demás se comparan.
- **Respuesta, forma orientativa:** periodo; recuento del fichero (leídas, rechazadas con motivo);
  cruce (cruzados, sólo en el fichero, en Desk fuera del periodo, sólo en Desk, número distinto, valores
  ilegibles); y `comparacion` con la forma de hoy.
- **Cliente.** Una función en `apps/desk/src/lib/` arma la petición y otra decide qué se muestra; el
  `.tsx` sólo sube y pinta.

### Regla 13 — decisiones del cliente (regla de mutación 3)

La línea del servidor de las guardas nuevas **se rellena al aplicar**; las que ya existen se citan hoy.

| # | Decisión del cliente | Tipo | Línea del servidor que la impone |
|---|---|---|---|
| C1 | Muestra el control de carga sólo a administradores | bloquea | `apps/desk/server/auth/middleware.ts:27` (`403`); el registro de la ruta nueva, al aplicar |
| C2 | Deshabilita «Comparar» sin fichero elegido | bloquea | `400` «falta el fichero» de la ruta nueva — al aplicar |
| C3 | Limita el selector a `.csv` | rellena | `400` de cabecera que nombra las columnas — al aplicar |
| C4 | Avisa de fichero demasiado grande | avisa | `apps/desk/server/app.ts:86` (`413`) |
| C5 | Envía `desde` y `hasta` tal como se escriben | — | `apps/desk/server/indicadores.ts:26` (`400`) |
| C6 | Pinta recuentos, porcentajes y listados sin color, meta ni veredicto | — | La respuesta no trae ninguno: RQ-KP-16; línea de la ruta, al aplicar |

El cliente no lee el fichero, no cruza y no calcula ningún porcentaje.

## 8. Lotes y estimación

Pruebas ×1,8 sobre el código. Techo de cada intento 800, válvula 720: el lote que la alcance se parte.
Se mide antes de cerrar cada intento con `git diff --shortstat --no-renames` contra el commit de partida
más las líneas de lo nuevo sin trackear. Cada intento en este worktree (regla del ciclo 3).

| Lote | Contenido | Estimado |
|---|---|---|
| L1 | Lector de la exportación, cruce y fixture sintético, en `packages/shared` | ~520 |
| L2 | Ruta de comparación, registro, consulta de S6 y sus pruebas | ~480 |
| L3 | Cliente (`lib` con prueba, `Analisis.tsx`) y `DEPLOY.md` §9 | ~330 |
| Cierre documental | Barrido de citas (regla de mutación 4), `openspec/config.yaml`, `docs/sdd/ENTRADA.md` | aparte |
| `verify` y `archive` | Intentos propios; el informe que cada fase genera es sumando obligatorio | aparte |

**Fixture.** Un CSV sintético pequeño con la cabecera **real** de 59 columnas, con BOM, CRLF, un campo
entrecomillado con coma y otro con salto de línea. No depende de las 640 filas ni copia datos de
contactos: nombres y correos inventados.

### Mutaciones que la tanda tiene que reproducir

- **De posición (regla 1):** mover `requireAdmin` detrás de multer, y la sesión detrás del
  administrador; mover el `400` del periodo detrás del `400` del fichero; mover la validación de la
  cabecera detrás de la lectura de tickets. Con usuario sin rol, la prueba comprueba que no se ejecutó
  ninguna consulta de tickets (la de la sesión es de `requireAuth`).
- **Del fichero vigilado (regla 2), ensuciando el fixture:** quitar una columna exigida (y dos, para
  ver que el mensaje nombra las dos); renombrarla; dejar una clave vacía; ponerla en notación
  científica; repetir un «ID»; poner un valor no numérico en una columna de tiempo; cambiar el número de
  un ticket que cruza.
- **De la clave:** cruzar por número en vez de por «ID»; aceptar una clave no numérica.
- **De los dos sentidos:** vaciar una de las dos listas de no cruzados; fundir «fuera del periodo» con
  «no está en Desk».
- **De la privacidad:** devolver una columna de contacto en la respuesta o en un motivo de rechazo;
  ejecutar una sentencia que no sea de lectura.
- **Del camino único:** leer el valor del fichero sin pasar por `valorDeZoho`.
- **Regla 3:** la tabla de §7, rellena línea a línea antes de cerrar.

## 9. Áreas afectadas

| Área | Impacto | Qué cambia |
|---|---|---|
| `packages/shared/src/` (+ prueba y fixture) | Nuevo | Lector de la exportación y cruce |
| `packages/shared/src/indicadores.ts` | **Sin cambios** previstos | `valorDeZoho` y `NOMBRES_ZOHO` se consumen tal cual |
| `packages/shared/src/indicadoresComparacion.ts` | **Sin cambios** previstos | `compararIndicadores` se consume tal cual |
| `apps/desk/server/routes/` (+ prueba) | Nuevo | Ruta de comparación con fichero |
| `apps/desk/server/routes/indicadores.ts` | Sin cambio de comportamiento | El comentario de la línea 52 se revisa en el cierre |
| `apps/desk/server/app.ts` | Modificado | Registro de la ruta, sin insertar líneas |
| `apps/desk/src/lib/` (+ prueba), `apps/desk/src/components/Analisis.tsx` | Nuevo / modificado | Carga y pintado del resumen |
| `DEPLOY.md` | Modificado | §9 |
| `openspec/specs/kpis/spec.md` | Modificado al archivar | Delta de §3 |
| `packages/zoho-sync/src/db/schema.sql`, `.env.example` | **Sin cambios** | Sin migración ni variables |

## 10. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Una hoja de cálculo reescribe el fichero y convierte el «ID» de 18 dígitos en notación científica | Alta si se abre antes de subir | Clave que no sea sólo dígitos: fila rechazada con motivo que lo explica; `DEPLOY.md` dice subirlo tal cual. Nunca se cruza aproximando |
| La exportación de noviembre no trae las mismas columnas (S1) | Media | `400` que nombra las que faltan; el lector está aislado |
| «ID de la solicitud» no es `ticketNumber` (hipótesis de §4, a) | Baja | No es clave: sólo generaría la lista de «número distinto», que lo delataría entero |
| Datos de contacto en logs por un error no previsto | Baja | El lector no devuelve esas columnas; los mensajes no citan celdas; prueba de mutación de privacidad |
| El 55 del fichero («Good») y la calificación cargada de la encuesta no usan la misma escala (**hipótesis**) | Media | Saldrían como diferencias de texto, visibles; el 55 no se toca aquí y se anota (§13) |
| Las columnas 50 y 53 difieren en alguna fila y `valorDeZoho` toma la primera que encuentra (**hipótesis**, no medido) | Baja | El diseño lo mide sobre la muestra antes de fijar el escenario |
| Dos lectores de CSV en el servidor (molde H5) | Media | Decisión explícita del diseño (§7) |
| Fichero mayor de 10 MB | Baja | `413` con el límite en el mensaje; probado |
| La tanda se lee como fila cerrada | Baja | `cierra: no` y §14 |

## 11. Reversión

Revertir el commit de fusión retira la ruta, el lector y el control de «Análisis». El `GET` y el enlace
de descarga no cambian en ningún momento, así que no hay nada que restaurar. No queda ninguna tabla ni
dato: el fichero nunca se guardó. La spec vuelve a su texto anterior revirtiendo el archivo.

## 12. Dependencias y criterios de éxito

Dependencias: `continuidad-indicadores` e `indicadores-51-55`, archivados. Ninguna tarea de persona
bloquea construir.

- [ ] Sin sesión `401`, sin rol `403`, periodo malo `400`, sin fichero `400`, en ese orden, y en ningún
      caso de esos cuatro se ejecuta una consulta de tickets.
- [ ] Un fichero al que le falta una columna exigida da `400` y el mensaje la nombra; con dos, nombra las dos.
- [ ] Un fichero mayor que el límite da `413` y el mensaje dice el límite.
- [ ] Una fila con clave vacía, no numérica o repetida va a rechazadas con su motivo; las demás se comparan.
- [ ] Los no cruzados salen contados y listados en los dos sentidos; un ticket fuera del periodo no se
      cuenta como ausente de Desk.
- [ ] Un `id` que cruza con número distinto se lista como discrepancia y se compara por el `id`.
- [ ] El resumen sale de `compararIndicadores`, con tolerancia de un día y sin veredicto.
- [ ] La respuesta y los motivos no contienen nombre ni correo de contacto; todas las sentencias son de
      lectura y no se escribe ningún fichero.
- [ ] `GET /api/indicadores` responde lo mismo que antes, con cuatro consultas.
- [ ] La tabla de la regla 13 (§7) tiene línea de servidor en cada fila.
- [ ] Las mutaciones de §8 se reproducen y cada una se pone roja.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde; cada lote por debajo de 800 medido.

## 13. Ronda de preguntas de la propuesta

El modo es `auto`: no se paró a preguntar. Ninguna frena la construcción; van a `docs/sdd/ENTRADA.md`
en el cierre, con el primer número libre de ese momento, y los supuestos a la lista semanal.

1. **Hallazgo para E-174:** la exportación trae en la columna 12 el dato que le falta a la variante de
   Zoho del 47 (§4, c). ¿Se quiere que un cambio siguiente la lea para dar esa variante?
2. **S4:** al comparar con el fichero, ¿un ticket ausente de él debe completarse con lo sincronizado, o
   quedar como «no está en el fichero»?
3. **55:** ¿la calificación de Zoho («Good») y la de la encuesta cargada usan la misma escala, o hace
   falta una equivalencia antes de compararlas?
4. **S2:** ¿basta con no guardar el fichero, o se quiere conservar el resumen de cada semana como
   evidencia de la comprobación?

## 14. Por qué `cierra: no` y `toca_maestro: no`

`cierra: no`: la fila pide además medir en paralelo desde el 16/11
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:129`), que hacen P-1 y P-2. Este cambio deja
construido lo que esa medición necesita; no la sustituye.

`toca_maestro: no`: el G.6b fija qué se comprueba y con qué criterio (`R08.4.md:6317`) y no dice por qué
medio llegan los valores de Zoho; cargar la exportación no lo contradice ni lo deja corto.
