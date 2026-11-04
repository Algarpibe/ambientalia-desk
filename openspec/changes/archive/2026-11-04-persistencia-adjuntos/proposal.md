---
tanda: 1G-02
motivo: ""
capacidad: [zoho-sync]
maestro: ["M11.3"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `persistencia-adjuntos`

Construye `decision/adelanto-09-11-empezar-1g` (Gerencia, 02/11/2026; `openspec/config.yaml` → `decisiones_de_gerencia_adenda`), citada
por clave. Consecuencia (3): tras 1G-01 va 1G-02, con su puerta M1. Consecuencia (5): lo que escriba en producción va tras un interruptor
que nace cerrado y abre Alfonso.

*Sobre la cabecera.* `tanda: 1G-02`: es el contenido de su fila, «Persistencia de adjuntos: descargar bytes al destino que decida **M1**,
poblar `storage_path`, `/api/attachment` sirve de local y sólo cae a Zoho si falta. Cierra el punto 1 de `debt.md`»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:24`); el plan vigente la nombra con la misma puerta
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:131`). `maestro: ["M11.3"]`: en la épica 1G
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3445`), «Descarga los archivos adjuntos al almacenamiento
propio. La aplicación los sirve desde allí y solo los pide a Zoho si faltan, dejando registro de cada caso para saber qué queda por traer»
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3452-3453`). `cierra: si`: el alcance cubre entero el punto 1
de `debt.md` (`debt.md:572-598`): descargar y almacenar (`debt.md:585`), servir de local con caída a Zoho (`debt.md:594`) y guardar al
sincronizar conversaciones (`debt.md:597-598`); ver S-14. `toca_maestro: no`: el cambio hace lo que el pasaje describe; el anuncio de
cierre con 1G-02 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3539`) sigue siendo cierto; y «A 01/10/2026
siguen pendientes» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3477`) es cierto de su fecha; para M1
lo deja atrás la medida del 04/11, no este cambio (nota para Supervisión, §8). `zoho-sync` ya está en `capabilities`: R-2 no aplica.

## 1 · Intención

Que los documentos de clientes adjuntos a los tickets vivan en el almacenamiento propio de Desk y no sólo en Zoho, para que 1G-03 pueda
contarlos y 1G-04 apagar Zoho sin dejar enlaces rotos. Al terminar: una persona lanza un relleno que trae los adjuntos existentes, los
nuevos se guardan solos en la pasada periódica, y cada vez que la aplicación aún tiene que pedir uno a Zoho lo deja escrito en el log.

## 2 · Lo que hay hoy (medido en `d26ef8a5`)

**2.1 · Desk guarda los metadatos, no los bytes.** `attachments` tiene `size`, `content_type`, `zoho_href` y `storage_path`
(`packages/zoho-sync/src/db/schema.sql:51-55`): la columna existe y no hace falta cambio de esquema. Nace a `null`
(`packages/zoho-sync/src/db/mappers.ts:118`) y el `ON CONFLICT` de `upsertAttachment` no la reescribe
(`packages/zoho-sync/src/db/repo.ts:112-113`): una resincronización no la borra. `zoho_href` es la ruta de la API sin `/api/v1`
(`packages/zoho-sync/src/db/mappers.ts:108-111`); `size` queda nulo si Zoho no lo manda (`packages/zoho-sync/src/db/mappers.ts:117`). La
tabla no viaja por la replicación hub → desk (`DEPLOY.md:38-42`).

**2.2 · La ruta es un proxy.** `GET /api/attachment` exige sesión (`apps/desk/server/routes/attachment.ts:14`), admite sólo la forma de un
adjunto de ticket, contra SSRF (`apps/desk/server/routes/attachment.ts:17`), y reenvía a Zoho con su `content-type` y su
`content-disposition` (`apps/desk/server/routes/attachment.ts:21-30` en `d26ef8a5`). El cliente pide `/api/attachment?path=<zoho_href>`
(`apps/desk/src/components/Adjuntos.tsx:21`) con el `path` que le da `rowToMessage`, que sólo enseña adjuntos con `zoho_href`
(`packages/zoho-sync/src/db/mappers.ts:251-254`). **El cliente no cambia**: la ruta decide local o Zoho por ese mismo `path`. Ninguna cita
previa con número de línea apunta a `attachment.ts`; las de esta propuesta posteriores a su línea 20 llevan la revisión de partida.

**2.3 · Tres vías guardan conversaciones**, todas por `guardarYReflejar` (`packages/zoho-sync/src/conversaciones.ts:109-140`): la pasada
periódica, que sólo existe si la App pasa la opción (`packages/zoho-sync/src/sync.ts:66`, `apps/desk/server/index.ts:23`) y corre tras
leer los modificados (`packages/zoho-sync/src/sync.ts:176`) dentro del bucle con guarda contra solapes (`apps/desk/server/index.ts:84-93`);
la lectura al abrir un ticket (`packages/zoho-sync/src/sync.ts:183-191`); y el relleno de 1G-01. El worker construye `createSync` sin la
opción (`packages/zoho-sync/src/conversaciones.ts:29-30`) y no tendrá el volumen.

**2.4 · M1 y el destino.** Consulta SQL de Alfonso sobre `desk.attachments`, 04/11 (dato de persona, no medido por la terminal): 2.422
adjuntos en 684 de los 784 tickets; 2.602 MB; el mayor, 35 MB; ninguno con `storage_path`. La regla: «disco de EasyPanel si son pocos GB,
MinIO o S3 si son decenas, `bytea` sólo si son cientos de MB» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:200`; también
`debt.md:593`) ⇒ volumen persistente de EasyPanel montado en la App (S-a). El dato no está aún en el repositorio: registrarlo es de Supervisión.

## 3 · Alcance y enfoque

**Dentro.**
1. **Guardado seguro**, común al relleno y a la pasada: id como nombre, tamaño comprobado, temporal y `rename`, y `storage_path` (S-4 a S-6).
2. **`GET /api/attachment` local primero**, tras `requireAuth` y la guarda de `apps/desk/server/routes/attachment.ts:17`, intactas; si
   falta, cae a Zoho como hoy y registra cada caída (S-10, S-11).
3. **Relleno manual** de lo existente: reanudable, idempotente, `429` con pausa y corte, guardados, fallidos y ausentes (S-2, S-3, S-7, S-8, S-12).
4. **Guardado al sincronizar**, sólo en la pasada periódica de la App (S-9).
5. **Interruptores** que nacen cerrados y directorio sin valor por defecto (S-1); **`DEPLOY.md` §22** al final, con las dos frases por
   variable y su prueba; las líneas de `.env.example`, al informe (P-5).
6. **`debt.md` §1** cerrado en sitio (S-13). **Spec:** ADDED al final de `zoho-sync`, de RQ-ZS-30 en adelante; ningún MODIFIED.

**Fuera.** MinIO, S3 y `bytea`; el volcado de Zoho (S-b); guardar lo que la ruta trae al caer a Zoho (la ruta nunca escribe); descargar
en la lectura al abrir un ticket o en el worker; la verificación de completitud (1G-03) y el modo sin Zoho (1G-04); borrar ficheros,
tampoco los de un ticket eliminado (§8); los ficheros que sube la propia app; `measure-attachments` (`apps/desk/server/routes/admin.ts:43`);
`apps/desk/src`; cambios de esquema; la copia del volumen (P-4); en la rama, `.env.example` y los seis de Supervisión (`CLAUDE.md`,
`openspec/config.yaml`, `docs/sdd/ENTRADA.md`, los dos `F0-05_*` y `docs/sdd/R08.4_Expediente_de_cambios.md`).

**Qué cubre de la fila, en una línea:** bytes al volumen y `storage_path` poblado, servir de local con caída a Zoho registrada, relleno de
lo existente, guardado de lo nuevo y el punto 1 de `debt.md`; deja fuera su ejecución en producción (P-1 a P-4) y la verificación (1G-03).

## 4 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `zoho-sync` — copia propia de los adjuntos de Zoho, servida de local con caída registrada
(RQ-ZS-30 en adelante, ADDED al final; el último vivo es RQ-ZS-29, `openspec/specs/zoho-sync/spec.md:1887`).

## 5 · Supuestos

| Id | Supuesto | Cómo se deshace |
|---|---|---|
| S-a | El destino es el volumen de EasyPanel, por M1 = 2.602 MB | Cambiar el destino |
| S-b | Vía API, no el volcado de «Copia de seguridad de datos» de Zoho (`docs/sdd/Inventario_ZohoDesk_Configuracion.md:95`); ese volcado queda como contraste para 1G-03 | — |
| S-c | 784 tickets frente a ≈986 es hipótesis; 1G-03 lo comprueba | — |
| S-1 | `RELLENO_ADJUNTOS_HABILITADO` (relleno manual) y `GUARDAR_ADJUNTOS_AL_SINCRONIZAR` (pasada periódica), `=== 'true'`, al final de `packages/zoho-sync/src/config.ts:66` y `packages/zoho-sync/src/config.ts:125`, en sitio. `ADJUNTOS_DIR`, ruta absoluta sin valor por defecto: sin ella, o si cae dentro de `dist/`, que la App sirve como estáticos (`apps/desk/server/index.ts:52-54`), ningún escritor escribe aunque su interruptor esté abierto | Quitar las variables |
| S-2 | `POST /api/admin/relleno-adjuntos` lanza en segundo plano; `GET` sólo devuelve el estado y nunca lanza; sólo superadministrador (`apps/desk/server/auth/middleware.ts:26-29`). Cerrado ⇒ `403` que nombra la variable, antes de validar parámetros; con una pasada en marcha no lanza otra. Molde: `apps/desk/server/routes/rellenoConversaciones.ts:15-23`, `apps/desk/server/rellenoConversaciones.ts:140-144` | Retirar la ruta |
| S-3 | `limite=0` sólo cuenta los pendientes (número y MB por `size`), sin Zoho ni escritura y libre de interruptor (molde `apps/desk/server/routes/rellenoConversaciones.ts:39`). `limite=N` cuenta adjuntos; `desde=<número de ticket>` reanuda | Quitar el modo |
| S-4 | Pendiente = `storage_path` nulo, o fichero ausente o de otro tamaño. Orden por número de ticket y después id; relanzar sólo trae pendientes. Sin `zoho_href`, o si no pasa la misma guarda que `apps/desk/server/routes/attachment.ts:17`, se cuenta «sin ruta» y no se pide | Cambiar la selección |
| S-5 | Nombre en disco: el id del adjunto validado como `^\d+$` (**hipótesis:** todos numéricos), sin extensión, en un directorio plano; `storage_path` guarda ese nombre relativo, nunca una ruta absoluta, y la lectura rechaza lo que resuelva fuera de `ADJUNTOS_DIR`. Temporal en el mismo directorio y `rename`; un temporal nunca se sirve | Cambiar el formato |
| S-6 | Bytes recibidos distintos de `size` ⇒ no se guarda y cuenta como fallido. Sin `size`: se compara con `Content-Length` si viene; sin ninguno, se guarda y se cuenta «sin tamaño comprobable». **Hipótesis:** `size` es el número exacto de bytes (`apps/desk/server/measure.ts:52` lo suma así); la pasada corta lo pone a prueba | Cambiar la regla |
| S-7 | `404` ⇒ «ausente en Zoho»: no se guarda y se lista por id y número de ticket. Sin columna nueva: el relleno lo reintenta al relanzarse; la pasada periódica no repite en el mismo proceso un id que dio `404` o falló por tamaño. Los adjuntos de conversaciones marcadas ausentes se intentan igual: siguen en la base y vuelven si se desmarcan (`openspec/specs/trazas/spec.md:921-923`) | Cambiar la política |
| S-8 | `429`: 2.000 ms y la misma petición hasta 3 veces (`packages/zoho-sync/src/conversaciones.ts:23-24`), antes del `404` y de `!res.ok`; agotados, corte con `cortadoEn`. Pausa de 150 ms entre adjuntos (`packages/zoho-sync/src/conversaciones.ts:26`). Otro fallo se cuenta y se sigue; un error de disco (sin espacio, sin permiso, sin directorio) corta, porque fallarían todos | Cambiar las constantes |
| S-9 | «Nuevo» = pendiente (S-4) de un ticket cuyas conversaciones acaba de guardar la pasada periódica de la App, con un tope por ciclo que fija el diseño; exige también `SYNC_CONVERSACIONES_PERIODICA`. La lectura al abrir un ticket no descarga (no retrasa la pantalla); lo que no se traiga queda para el relleno. **Hipótesis:** un comentario nuevo con adjunto mueve `modifiedTime` | Cambiar la definición |
| S-10 | Local: fila por `zoho_href` igual al `path`; si el fichero existe y mide `size`, se sirve con `Content-Type` de la fila (o `application/octet-stream`), `Content-Disposition` con el nombre codificado según RFC 5987 —`inline` sólo para imagen raster y PDF, `attachment` para el resto, HTML y SVG incluidos— y `X-Content-Type-Options: nosniff`. **Hipótesis:** qué disposición manda hoy Zoho (la reenvía `apps/desk/server/routes/attachment.ts:26-29` en `d26ef8a5`) no está medido; se mira en la app | Cambiar las cabeceras |
| S-11 | Registro: una línea del log de la App por caída a Zoho, con id del adjunto, número de ticket, motivo (sin copia, fichero ausente, tamaño distinto, sin fila, sin directorio) y estado de Zoho. «Qué queda por traer» es `limite=0` (S-3); no hay tabla nueva | Cambiar el formato |
| S-12 | Resumen en memoria y al log al terminar o cortarse: guardados, ya presentes, fallidos por motivo, ausentes, sin ruta, sin tamaño comprobable, bytes, peticiones, `429` vistos, `cortadoEn`; sólo ids y números de ticket, nunca nombre de fichero, asunto, contacto ni empresa | Cambiar el formato |
| S-13 | `debt.md` §1 se da por cerrado en sitio, sin mover líneas (`debt.md:572`, `debt.md:585`) | Revertir el commit |
| S-14 | `cierra: si`: la fila queda construida; correr el relleno es de persona (CLAUDE.md, «Regla del ciclo 1»). Si Supervisión entiende que exige el relleno hecho, pasa a `no` antes de archivar | Cambiar la cabecera |
| S-15 | El relleno recorre lo que hay en `desk.attachments`; lo que traiga después el relleno de 1G-01 lo recoge otra pasada (S-4) | — |

**Ronda de preguntas:** no aplica. El preflight es `auto` y no se da ninguna de las cinco causas de parada de la «Regla de ejecución»: la
escritura en producción la decide la consecuencia (5) y la abre Alfonso. Si el disco no alcanza (P-2), cuesta dinero: se para y se consulta.

## 6 · Criterios de aceptación

- **CA-1** Tras el relleno, un pendiente queda en `ADJUNTOS_DIR` con su id por nombre, los bytes de Zoho y `storage_path`; relanzar no lo pide.
- **CA-2** Bytes distintos de `size`: ni fichero final ni temporal ni `storage_path`; cuenta como fallido.
- **CA-3** Un fallo a mitad de escritura no deja fichero con el nombre final, y la ruta nunca sirve un temporal.
- **CA-4** Un `name` con `../` no influye en el nombre; un id no numérico es fallido sin escribir; nada se lee fuera del directorio.
- **CA-5** Con copia válida, la ruta no llama a Zoho y sirve lo local con las cabeceras de S-10; si no, cae a Zoho como hoy y registra la
  caída sin nombre de fichero. Sin sesión o fuera de la guarda, la respuesta de hoy, antes de buscar el adjunto.
- **CA-6** `404` cuenta como ausente; `429` agotado y error de disco cortan; `GET` nunca lanza y un segundo `POST` no lanza otra.
- **CA-7** Cerrados (`TRUE`, `1` o vacío incluidos) ⇒ `403` antes de validar; `limite=0` va cerrado; sin `ADJUNTOS_DIR` nada escribe.
- **CA-8** La pasada periódica de la App trae los pendientes de lo que guarda, hasta el tope; el worker y la apertura nunca descargan.
- **CA-9** Ni el resumen ni el log llevan nombres de fichero, asunto, contacto, empresa ni secretos.
- **CA-10** `DEPLOY.md` §22 y su prueba; `debt.md` §1 cerrado; `npm test`, typecheck y `npm run lint -- --max-warnings 165` en verde.

## 7 · Tareas de persona (no son tareas de esta tanda; archivar no las da por hechas)

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Crear el volumen persistente en EasyPanel y montarlo en la App | Alfonso | `DEPLOY.md` §22 |
| P-2 | Comprobar el espacio libre del VPS (`df -h`): las copias de `desk` están en ese mismo disco (dato de persona) | Alfonso | `DEPLOY.md` §22 |
| P-3 | Copia previa de `desk-db`; poner `ADJUNTOS_DIR` y abrir los interruptores; `limite=0`, pasada corta y completa; pasar el resumen al analista | Alfonso | `DEPLOY.md` §22 |
| P-4 | Incluir el volumen en las copias (B2): el respaldo abarca «todos los archivos del servidor (adjuntos, …)» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3507`) | Alfonso | informe de cierre |
| P-5 | Añadir a `.env.example` las líneas de las tres variables (molde P-1 de 1G-01) | Alfonso | informe de cierre |

## 8 · Riesgos

- **Disco.** 2.602 MB en el disco que guarda las copias de `desk` (dato de persona); si no alcanza, ampliar cuesta dinero (P-2).
- **`size` inexacto** (S-6): todo saldría fallido; la pasada corta lo enseña antes de la completa.
- **Cuota de Zoho (E-254, sin medir).** **Hipótesis:** una petición por adjunto, unas 2.422; lo acotan la pausa, el corte y `limite`.
- **Ciclo periódico más largo:** las descargas alargan el ciclo de `apps/desk/server/index.ts:88`, que también evalúa alarmas; la guarda
  de `apps/desk/server/index.ts:86` evita solapes y el tope por ciclo (S-9) lo acota.
- **Volumen sin montar.** **Hipótesis:** lo escrito fuera del volumen se pierde al redesplegar; la ruta cae a Zoho y el relleno lo repone (S-4).
- **Tipos activos servidos desde nuestro origen** (HTML, SVG): `attachment` y `nosniff` (S-10).
- **Ticket eliminado:** `apps/desk/server/db/eliminarTicket.ts:51` borra sus filas y sus ficheros quedan en el volumen; va a la bandeja (R-3).
- **Para Supervisión:** registrar M1 (§2.4) y la desactualización de `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3477`.

## 9 · Vuelta atrás

Cerrar los interruptores detiene toda escritura y la ruta sigue cayendo a Zoho por lo que falte. `UPDATE attachments SET storage_path = NULL`,
con copia previa, devuelve el comportamiento de hoy. Revertir el commit retira el relleno, el guardado periódico, la lectura local y la §22.

## 10 · Método y cierre

Worktree propio desde `d26ef8a5`; `strict_tdd` con rojo previo. Lo nuevo va en ficheros nuevos; los muy citados (`repo.ts`, `mappers.ts`,
`rows.ts`, `config.ts`, `app.ts`, `index.ts`, `sync.ts`, `conversaciones.ts`, `appHarness.ts`, `DEPLOY.md`, `debt.md`) sólo en sitio o al
final. La guarda de `apps/desk/server/routes/attachment.ts:17` se repite en el relleno con una prueba que enfrenta las dos (molde H5).
Mutaciones con rojo esperado: `!== 'false'` en un interruptor; nombre desde `name`; escribir sin temporal; no comparar con `size`; la ruta
que escribe; el worker o la apertura que descargan; no cortar ante `429` agotado; un nombre de fichero en el log. Posiciones: `requireAuth`
y la guarda antes de buscar el adjunto; el interruptor antes de validar; el `429` antes del `404` y de `!res.ok`; `storage_path` tras el
`rename`. Guardas que cuentan el árbol, previstas en `tasks.md`: `apps/desk/server/reconciliacion/registro.test.ts:218` y
`apps/desk/server/reconciliacion/registro.test.ts:220` (con esta propuesta fuera de `archive/`, 1G-02 entra en «en curso»; en sitio, mismo
número de líneas); la §22 hace que la §21 deje de ser la última (`apps/desk/server/deployRellenoConversaciones.test.ts:19`,
`apps/desk/server/deployRellenoConversaciones.test.ts:25`; molde `apps/desk/server/deployConversaciones.test.ts:20`); `migrate.test.ts` no
se toca (sin cambio de esquema). Regla 13: el cliente no toma ninguna decisión nueva. Barrido de la regla de mutación 4 al cerrar.
Intentos ≤ 800 líneas medidas con `git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear.
