# Archive · `rotulado-tras-enviar` (F1B-04, `cierra: no`)

**Fecha:** 2026-10-12 · **Rama:** `rotulado-tras-enviar` · **Partida:** `a947b48` · **Informe escrito por el orquestador**, con
cifras medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué cubre de la fila F1B-04 y qué deja fuera, en una línea:** cubre E-167 entera —el rotulado deja de exigirse en el alta y en el
envío y se confirma después, con traza, sin bloquear nada, y hay aviso si la etiqueta no se genera—; deja fuera el recuento de
modelos sin accesorios, que es tarea de persona contra producción. Declara `cierra: no`.

**Por qué `cierra: no`, si lo que queda es de persona.** Por la regla del ciclo 1 el recuento no es una unidad de trabajo y no
impediría cerrar. Pero la consecuencia (3) de `decision/aplica-opcion-a-esta-semana-12-10`, versionada, dice que si el recuento sigue
abierto el cierre es «no». Declarar «sí» contradiría un texto registrado: **lo decide Gerencia**. Si responde que el recuento no
retiene la fila, F1B-04 queda cerrada por este cambio sin construir nada más.

## Qué decisión construye

`decision/e167-rotulado-tras-enviar-12-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`). En la conversación de
construcción, el mismo día, Gerencia aprobó además las dos columnas nuevas y los supuestos G1 y G2; eso no tiene clave propia.

## Qué se construyó

- **El alta y el envío ya no exigen el rotulado.** Las dos guardas se retiraron en sitio, sin reordenar las demás
  (`packages/shared/src/recepcion.ts:101` y `packages/shared/src/recepcion.ts:155`; el fichero conserva sus 206 líneas). Un
  `rotulado: true` del cuerpo se ignora y no escribe traza. IV-12 ni gana ni pierde punto.
- **La traza de las casillas** «Llegó sin accesorios» y «Llegó sin embalaje» sale del usuario y la hora del alta (G2).
- **Confirmar el rotulado** es una acción nueva del servidor, `POST /api/remisiones/:id/rotulado`
  (`apps/desk/server/routes/remision.ts:406`): sólo sobre una remisión del formulario nuevo, enviada con éxito y no anulada; escribe
  `rotulado_at` y `rotulado_por` una sola vez (`apps/desk/server/db/remisiones.ts:247`). Orden total de guardas:
  401 < 404 < 403 < 409 anulada < 422 legado < 422 sin envío con éxito < 409 ya confirmada.
- **«Pendiente de rotular»** la calcula el servidor (`pendienteDeRotular`, en `packages/shared/src/rotulado.ts`) y viaja en la
  remisión como `pendienteRotular`. **No la lee ninguna transición, alarma, vista del tablero ni indicador.**
- **El envío guarda quién envía** (`enviado_por_id`), en el mismo `UPDATE` que gana la reclamación
  (`apps/desk/server/db/remisiones.ts:174`); si el disparo no sale, se limpia.
- **Aviso de etiqueta no generada** (`apps/desk/server/services/avisoEtiquetaNoGenerada.ts`): al llegar un callback `ok` u
  `ok_con_avisos` con `dymoId` vacío, a quien envió y al Director Técnico, con respaldo al área Servicio Técnico. Una vez por
  remisión, sólo bandeja, y no puede tumbar el callback. No decide por el texto de ningún paso del flujo.
- **Cliente:** la casilla sale del alta y la confirmación aparece en la pantalla de resultado y en la tarjeta de la remisión.
- **Dos comentarios y un texto de pantalla** que decían que `ok_con_avisos` era sólo «falló el aviso», corregidos en sitio.

## Migración

Dos sentencias, al final de `packages/zoho-sync/src/db/schema.sql` (líneas 831 y 832), calificadas con `public.`, sobre
`public.remisiones`: `enviado_por_id text` y `aviso_sin_etiqueta_at timestamptz`. Anulables, sin relleno de datos. La comprobación
tras desplegar y la vuelta atrás están en `DEPLOY.md`, en su última sección.

## Qué verá el técnico

- **Antes de enviar:** el formulario ya no trae la casilla; una nota dice que el rotulado se confirma después de enviar.
- **Tras enviar, sin confirmar:** la pantalla de resultado y la tarjeta de la remisión dicen «Pendiente de rotular» y ofrecen
  «Confirmar rotulado y guardado». Cerrar sin confirmar no bloquea nada.
- **Tras confirmar:** «Rotulado y guardado: lo confirmó {nombre} el {fecha y hora}».
- **Quien no tiene el área Servicio Técnico ni es administrador:** ve la marca y «Lo confirma Servicio Técnico», sin botón.

Los `.tsx` están fuera de la red de pruebas: esto lo comprueba una persona en la aplicación.

## El texto del aviso

«Ticket #1234: la remisión de entrada se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo (serial ABC123)
sigue sin etiqueta para rotular: hay que generarla a mano.» Sin ticket empieza por «La remisión de entrada del {fecha}»; sin serial
dice «(sin serial registrado)»; si n8n informó algo, se añade «Lo que informó n8n: {paso} — {mensaje}».

## Pruebas y mutaciones

Sobre la rama: 271 ficheros pasan y 3 se omiten; 4.545 pruebas pasan y 11 se omiten (las de integración, sin PostgreSQL local).
Mutaciones reproducidas en los cuatro lotes, y doce más por el verificador, todas con alguna prueba en rojo. Los seis intercambios
de guardas vecinas de la acción pusieron en rojo, cada uno, sólo la prueba de posición de su par.

## Avisos del verify que quedan abiertos

- **W2.** Que la marca y los avisos se deshagan juntos si algo falla no tiene prueba contra PostgreSQL real: el simulador no
  revierte, y la prueba no afirma que la marca no quede. La garantía es de estructura.
- **W3.** Que `dymoId` llegue vacío cuando la etiqueta falla lo leyó el analista en el flujo, sin una ejecución real.
- **W1, cerrado en este archivo:** `DEPLOY.md` documenta ya las dos columnas y su frase sobre el `INSERT` del alta está corregida.
- Sugerencias: dos pruebas de `apps/desk/server/recepcion.test.ts` (líneas 161 y 273) siguen verdes pero ya no fijan nada.

## Fusión de los deltas

Por script, con comprobación de identidad bloque a bloque: once bloques idénticos al delta.

| Capacidad | Requisito | Qué | Líneas vivas |
|---|---|---|---|
| `remisiones` | RQ-RE-05, 08, 19, 23, 24, 26 y 38 | Modificados | Las mismas: neto 0 en los siete |
| `remisiones` | RQ-RE-40, 41 y 42 | Nuevos, al final | Desde la 2036 |
| `derivacion-avisos` | RQ-AV-22 | Nuevo, al final | Desde la 1081 |

Los siete modificados conservan su número de líneas: ninguna cita a `openspec/specs/remisiones/spec.md` cambia de línea.

## Medida por intento

| Intento | Registro | Medida propia |
|---|---|---|
| 1 · propuesta y corrección del maestro | 214 | 214 |
| 2 · deltas de especificación | 660 | 660 |
| 3 · diseño y tareas | 311 | 311 |
| 4 · apply 1a | 332 | 332 |
| 5 · apply 1b | 346 | 346 |
| 6 · apply 2 | 394 | 394 |
| 7 · apply 3 | 252 | 252 |
| 8 · verify | 118 | 118 |
| 9 · archive | el del asiento | lo revisable: fusión, este informe y `DEPLOY.md`; la mudanza no cuenta (regla del archivo) |

La planificación se partió en tres intentos porque propuesta y especificación juntas daban 874 líneas, por encima del techo.

## Supuestos reversibles — plazo de corrección: 2026-10-19

G1 y G2, aprobados por Gerencia. S1 confirma el área Servicio Técnico o un administrador (**más estricto que crear y enviar, que
sólo piden sesión**) · S2 no se deshace · S3 la marca va en la tarjeta y en el resultado, no en el tablero · S4 sin
`enviado_por_id`, sólo Director Técnico · S5 lo creado antes del despliegue conserva su rotulado · S6 no se repite el aviso · S7 un
aviso por persona · S8 respaldo al área; sin destinatarios se reintenta · S9 sólo bandeja · S10 el legado no se marca ni admite la
confirmación · S11 un callback de error no borra la confirmación · S12 se corrigió también el segundo comentario.

## Citas que afirman algo que ya no es cierto

Ninguna línea existente cambió de número. La única de caso A, en `DEPLOY.md`, está corregida. La de E-167 en
`docs/sdd/ENTRADA.md` es caso C y la marca Supervisión. Las de los paquetes de despliegue fechados y de los cambios archivados son
caso B: no se renumeran.

## Tareas de personas — archivar NO las da por hechas

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Decidir si el recuento de modelos sin accesorios retiene la fila, y hacer el recuento | Gerencia · Servicio Técnico | Este informe |
| Contrastar con una ejecución real qué llega en `dymoId` cuando la etiqueta sale y cuando no | Quien administra n8n | `DEPLOY.md` |
| Comprobar en la aplicación, tras desplegar, lo que verá el técnico | Servicio Técnico | Este informe |
| Pegar la corrección del maestro | Gerencia | `correccion-maestro.md`, en esta carpeta |
| Marcar E-167 como cerrada y actualizar E-163 a E-166 | Sesión de supervisión | `docs/sdd/ENTRADA.md` |
| Corregir, si procede, S1 a S12 antes del 2026-10-19 | Gerencia | Lista semanal de supuestos (E-237) |
| Desplegar `ambientalia-desk`, con copia previa | Gerencia | `DEPLOY.md` |
