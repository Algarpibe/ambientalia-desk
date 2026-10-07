# Archive · `ampliacion-contrato` (F1B-11, `cierra: si`)

**Fecha:** 2026-10-07 · **Rama:** `ampliacion-contrato` · **Partida:** `351c046` · **Informe escrito por el orquestador**, con cifras
medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-11 cubre, en una línea:** la ampliación del contrato —Comercial alarga la fecha de fin hasta el 31/12 del
año natural del vencimiento, con traza y sin borrar la fecha original—, que era lo único que le faltaba a la fila tras
`parche-iv11-orden-venta`, `asociacion-ov-ticket` y `registro-contrato`. **No deja nada de la fila fuera**, y por eso declara
`cierra: si`. Lo que queda abierto son supuestos para Gerencia y tareas de persona (al final), no contenido de la fila.

## Qué decisión construye

`decision/e086-ampliacion-contrato` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), de 2026-10-06: «Año natural del
vencimiento. Ampliación hasta el 31/12 de ese año, porque el 1/1 cambia la lista de precios. La registra Comercial, con traza.»

## Qué quedó construido

- **Regla en `packages/shared`**, añadida al final del módulo de contratos: el tope es el 31/12 del año del vencimiento, leído de los
  cuatro primeros caracteres de la fecha y no a través de un instante (`packages/shared/src/contratos.ts:259`); el rechazo se decide
  en un solo sitio y en orden fijo —fecha inválida, no posterior a la vigente, pasa del tope, plazo cerrado—
  (`packages/shared/src/contratos.ts:264`). «Hoy» es el día en la zona de negocio. Como el tope cae en el mismo año que el
  vencimiento, ampliar varias veces no lo mueve.
- **Tabla de traza `public.contrato_ampliaciones`**, con `CREATE` calificado y al final del esquema
  (`packages/zoho-sync/src/db/schema.sql:773`) y su índice por contrato (`packages/zoho-sync/src/db/schema.sql:782`): fecha anterior,
  fecha nueva, motivo, quién y cuándo. Sin clave foránea y sin ninguna `ALTER`. Declarada en `PUBLIC_TABLES`
  (`packages/zoho-sync/src/db/migrate.ts:73`).
- **Escritura en una transacción:** el `UPDATE` de la fecha de fin va condicionado a la fecha que leyó la ruta
  (`apps/desk/server/db/contratos.ts:133`) y, si no casa, no se escribe nada y se lanza el error de carrera
  (`apps/desk/server/db/contratos.ts:136`); después se inserta la fila de traza. La fecha de fin pasa a ser la vigente; la original es
  la fecha anterior de la primera fila de traza.
- **Ruta `POST /api/contratos/:id/ampliar`**, con la escalera en su orden: existencia `404`
  (`apps/desk/server/routes/contratos.ts:78`), permiso `403` con el mismo predicado del alta y antes de leer el cuerpo
  (`apps/desk/server/routes/contratos.ts:79`), contenido `422` (`apps/desk/server/routes/contratos.ts:81`) y carrera `409`
  (`apps/desk/server/routes/contratos.ts:87`). Quien amplía es el usuario de la sesión, nunca el del cuerpo.
- **Dónde se lee la traza:** `GET /api/contratos/:id` devuelve además `ampliaciones` y `fechaFinOriginal`
  (`apps/desk/server/routes/contratos.ts:33`), y la ficha del contrato las pinta.
- **Las tres puertas no se tocaron.** `apps/desk/server/services/ticketService.ts` y `apps/desk/server/routes/remision.ts` no
  aparecen en el diff de la rama: el alta, las transiciones y la remisión leen la fecha vigente, así que un contrato ampliado deja de
  dar «contrato vencido» hasta la nueva fecha y vuelve a bloquear al día siguiente. Lo fija
  `apps/desk/server/ampliacionContratoPuertas.test.ts`, que amplía por la ruta real. IV-12 ni se amplía ni se corrige.
- **Cliente:** la ficha enseña el vencimiento original, la lista de ampliaciones y, a Comercial o a un administrador y sólo si queda
  sitio, el formulario «Ampliar» (`apps/desk/src/components/ContratoFicha.tsx:27`). No valida nada: enseña el error del servidor. Los
  `.tsx` quedan fuera de la red de pruebas por decisión de Gerencia (F0-00).

## Lo que no se construyó, y por qué

- **Editar o borrar un contrato, o acortar su fecha.** Una ampliación sólo alarga (S-3); la baja y la edición siguen fuera (E-088).
- **Aviso al ampliar** (S-5) y **reinicio de la marca del aviso de ritmo** (S-4): ninguna fuente los pide.
- **Prueba de la atomicidad contra PostgreSQL real.** Sin un pool, el envoltorio de transacción no abre transacción en las pruebas;
  el orden y la condición del `UPDATE` están probados por estructura y por mutación. Queda en la tarea P.8.

## Supuestos anotados que quedan vivos (reversibles; para Gerencia en el §13.1 del paquete de despliegue)

S-1 (**el motivo es obligatorio; la fuente no lo exige**: se pide por coherencia con liberar y reasignar, lo impone
`packages/shared/src/contratos.ts:288` y la columna es anulable, así que quitarlo es retirar una guarda) · S-2 (se puede ampliar más
de una vez dentro del tope) · S-3 (sólo alarga) · S-4 (no reinicia la marca del aviso de ritmo; una ampliación corta alarga el
trimestre ya avisado y en ese tramo no habrá aviso nuevo) · S-5 (sin aviso al ampliar) · S-6 (la traza la lee cualquier usuario con
sesión) · S-7 (un contrato aún no iniciado también se amplía) · S-8 (sin ampliaciones, la fecha original es la de fin) · S-9 (motivo
recortado y sin límite de longitud) · S-10 (el 31/12 entero se puede ampliar).

## Medida, por intento (registro de `gentle-ai sdd-attempt` = `git diff --shortstat --no-renames` más lo nuevo sin trackear)

| Ordinal | Unidad | Commit | Registro | Git |
|---|---|---|---|---|
| — | Planificación (propuesta, delta, diseño, tareas), **sin intento** | `6d42654` | — | 1.301 |
| 1 | Lote 1 · regla compartida | `695ed23` | 251 | 251 |
| 2 | Lote 2 · tabla de traza y capa de datos | `e75ed5c` | 268 | 268 |
| 3 | Lote 3 · ruta y ficha | `3a5a88b` | 291 | 291 |
| 4 | Lote 4 · efecto en las tres puertas | `1b7c2a4` | 203 | 203 |
| 5 | Lote 5 · cliente y cierre documental | `dd248aa` | 313 | 313 |
| 6 | Verify | `b85990c` | 264 | 264 |
| 7 | Cierre tras el verify | `4543f8d` | 89 | 89 |

Techo 800 en todos; ninguno llegó a la válvula de 720. Sin binarios. La planificación se commiteó sin intento, como en las tandas
anteriores: el intento del lote 1 se abrió antes de la primera edición de código.

## Verificación

- **Veredicto del verify (sobre `dd248aa`): PASS WITH WARNINGS**, 0 CRITICAL, 3 WARNING, 6 SUGGESTION.
- **Mutaciones propias del verificador: 97** — 84 rojas, 6 equivalentes y **7 con prueba que faltaba**. Ninguna escondía un defecto
  vivo: el código era correcto y faltaba la prueba que lo fijara.
- **Las siete se cubrieron en el cierre (`4543f8d`)** con seis pruebas nuevas, cada una vista en rojo al reproducir su mutación: el
  motivo largo llega entero a la base y a la ficha; el cuerpo no manda ni sobre «hoy» ni sobre qué contrato se amplía; la fecha se
  devuelve normalizada; el motivo nulo se sirve nulo; y las columnas de fecha rechazan un texto que no es fecha. Además, el escenario
  de tres ampliaciones sobre el mismo contrato por la ruta.
- **Contraste del orquestador sobre `4543f8d`:** seis mutaciones propias, las seis rojas y restauradas —tope un día antes, plazo
  cerrado un día antes, permiso antes de existencia, `UPDATE` sin condición, `CREATE` sin calificar en el esquema y fecha original
  tomada de la última fila—.
- **Sobre `4543f8d`:** 4.066 pruebas, typecheck 0, lint 0 (165 avisos) y detector 0. El build dio 0 sobre `dd248aa`; el cierre sólo
  añadió pruebas y tres líneas de un documento.
- **Regla 13:** la tabla decisión del cliente → línea del servidor está cerrada en `tasks.md` con las líneas reales y contrastada por
  el verificador; ninguna decisión del cliente queda sin imposición probada en el servidor.
- **Avisos del verify que quedan declarados, no corregidos:** el tercero (siguiente apartado, citas de caso B).

## Incidencias de proceso

- **Verify:** el primer verificador se cayó por un fallo de red sin dejar nada escrito. Antes de relanzarlo se comprobó que el árbol
  estaba limpio y en el commit del lote 5; el intento del registro siguió abierto y lo cerró el segundo.
- **Delta:** el RQ-TC-21 modificado se escribió con el mismo número de líneas que el vivo, y el orquestador corrigió en sitio una
  segunda frase que seguía diciendo que la ampliación quedaba fuera.

## Fusión de los deltas (por script, bloque a bloque)

`fusiona.mjs` sustituyó el requisito MODIFIED por su bloque del delta y añadió los ADDED al final de la spec, y comprobó que cada
bloque vivo es idéntico línea a línea al del delta: **4 bloques, 4 idénticos**.

| Capacidad | MODIFIED | ADDED | Líneas vivas |
|---|---|---|---|
| `tickets-core` | RQ-TC-21 (mismas líneas; tres líneas cambian de texto) | RQ-TC-53, RQ-TC-54, RQ-TC-55 | 2.945 → 3.207 |

Sin capacidad nueva: `openspec/config.yaml` → `capabilities` no cambia (R-2).

## Citas (regla de mutación 4)

- **Sólo un fichero recibió inserciones por dentro:** `apps/desk/src/components/ContratoFicha.tsx`. Los demás crecieron al final o
  cambiaron en sitio sin variar su número de líneas; en la spec viva, RQ-TC-21 ocupa las mismas líneas y los tres requisitos nuevos
  van al final.
- **Citas históricas a la ficha (caso B, no se renumeran):** siete líneas de los paquetes de despliegue fechados el 2026-09-29, el
  2026-09-30 y el 2026-10-01 citan líneas de la ficha tal como eran entonces. Son registros fechados y no se editan; el detector no
  las marca porque las líneas siguen existiendo, pero ya no dicen lo que la frase afirmaba.
- **Cita que afirma el estado de partida (caso C, superada por este cambio):** la consecuencia (3) de
  `decision/e086-ampliacion-contrato` dice que un contrato no se puede modificar y cita la cabecera de la capa de datos. Era cierto el
  2026-10-06; hoy esa línea dice que hay dos `UPDATE`, la marca de ritmo y la ampliación (`apps/desk/server/db/contratos.ts:8`). No se
  editó: `openspec/config.yaml` no se toca en esta rama.
- **Guardianes de `migrate.test.ts`:** los recuentos de tablas y de sentencias y la posición de las últimas sentencias cambiaron de
  valor en sitio. Las citas archivadas a esas líneas afirman el recuento de su fecha y no se renumeran.

## Medida de este archivo (regla del archivo)

Parte con carga de revisión, medida antes de commitear: la fusión del delta en `openspec/specs/tickets-core/spec.md` (265 inserciones
y 3 borrados) más este informe. Queda por debajo de 800. El resto es la mudanza de la carpeta, que sin detección de renombrado cuenta
dos veces cada línea movida.

## Consecuencia en el avance

**F1B-11 queda cerrada por archivo** cuando esta rama se fusione a `main`: el cambio que la cierra está construido, con verify PASS,
archivado y con `cierra: si`. La fila del plan R01.4 se marca después de este commit, en la misma rama, y
`docs/sdd/RECONCILIACION.md` se regenera en `main` tras la fusión. El guardián de la reconciliación
(`apps/desk/server/reconciliacion/registro.test.ts`) se ajustó en sitio en este mismo commit: las tandas «en curso» pasan de doce a
once, sin F1B-11, igual que hizo el cierre de F1B-05.

## Tareas de persona — fuera del recuento; archivar no las da por hechas

**No tienen entrada en `docs/sdd/ENTRADA.md`**: el fichero tiene cambios de Supervisión sin commitear y esta rama no lo toca; la
entrada la abre Supervisión. **Cerrar F1B-11 no da por hecha ninguna.**

| # | Dueño | Qué | Dónde queda escrito |
|---|---|---|---|
| P.1 | Alfonso | Consulta de formato de subOV en producción (heredada de `registro-contrato`) | informe de archivo de `registro-contrato` |
| P.4 | Alfonso | Literales de borrador y anulada en Books (heredada) | el mismo informe |
| P.6 | Comercial | Verificar en la aplicación prioridad, bloqueo, informe, CSV y pasada de ritmo (heredada) | el mismo informe |
| P.7 | Comercial | Dar de alta los contratos vigentes (heredada) | el mismo informe |
| P.8 | Comercial | Tras desplegar, ampliar un contrato real y comprobar traza, desbloqueo y rechazo fuera del tope | `docs/sdd/Paquete_de_Despliegue_2026-10-06.md`, §13.3 |
| P.9 | Gerencia | Pegar en el maestro la corrección 32 | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| P.10 | Supervisión | Actualizar el estado de E-086 y abrir las entradas que salen de esta tanda | el mismo paquete, §13.3, con el texto propuesto |
| P.11 | Gerencia | Responder: ¿motivo obligatorio? (S-1) · ¿más de una ampliación? (S-2) · ¿reevaluar el aviso de ritmo tras ampliar? (S-4) | el mismo paquete, §13.1 |
