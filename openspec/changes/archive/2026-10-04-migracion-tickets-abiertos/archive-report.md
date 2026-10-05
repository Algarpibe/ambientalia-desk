# Informe de archivo — `migracion-tickets-abiertos`

**Tanda:** F1F-01 · **`cierra: no`** · **Fecha:** 2026-10-04 · **Rama:** `migracion-tickets-abiertos`, nacida de `main` en `894efd7`. Sin fusionar.

**Cobertura de la fila (R-1):** F1F-01 cubre aquí la HERRAMIENTA (núcleo, ejecutor y ruta, en seco por defecto), su INFORME y la REVERSIÓN documentada y probada sobre pg-mem; deja fuera el cotejo una a una de la hoja de Google y la EJECUCIÓN sobre producción, que son tareas de persona. Por eso no cierra la fila.

## Qué se construyó

Los tickets de Zoho ya viven en `desk.tickets` con su estado copiado tal cual, así que migrar no es trasladar datos: es normalizar los estados que la aplicación no conoce, marcar la fila como gobernada por la aplicación y dejar traza.

- **Núcleo puro** — `packages/shared/src/migracionTickets.ts`: tabla de equivalencias («Entregado» → «Finalizado»; «Pendiente» de servicio → «En Proceso»; identidad para los demás estados del registro) y plan por ticket, con la precedencia ya gobernado → tras el corte → sin equivalencia → migrar. Consume `ESTADOS` y `esClasificacionSoporteRemoto`; no duplica ninguno (regla invariable 13).
- **Ejecutor** — `apps/desk/server/db/migracionTicketsAbiertos.ts`: una lectura, plan en memoria y, sólo al aplicar, una transacción con la fila marcador antes del `UPDATE` de cada ticket. No toca `modified_time`, `closed_time` ni `source`.
- **Ruta** — `POST /api/admin/migrar-tickets-abiertos`, sólo superadministrador, al final de `apps/desk/server/routes/admin.ts`. EN SECO POR DEFECTO: escribe sólo con `aplicar=true`. Orden de guardas `401` → `403` → `400` → `409` → escrituras. El `corte` es un parámetro (instante ISO con desfase), nunca va escrito en el código, y una fecha imposible da `400`.
- **Procedimiento y reversión** — `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`, para una persona, con su guardián `apps/desk/server/db/migracionTicketsF1F01.test.ts`.

Nada se ejecutó contra una base real: todas las pruebas corren sobre pg-mem.

## Intentos y medida

Medida de cada intento: `git diff --shortstat --no-renames` contra su commit de partida, más lo nuevo sin trackear. Coincide con el registro en los cuatro.

| Intento | Commit | Líneas | Pruebas | Mutaciones reproducidas por el orquestador |
|---|---|---|---|---|
| Planificación (fuera de intento) | `18dc1f9` | — | — | — |
| Lote 1 · núcleo | `d2e421f` | 688 | 3.248 | 5 |
| Lote 2 · ejecutor y ruta | `b686bff` | 646 | 3.281 | 12 |
| Lote 3 · procedimiento y guardián | `8d0cdd7` | 413 | 3.290 | 5, sobre el fichero vigilado |
| Verify y remediación | `e16baed` más `775a9b7` | 278 | 3.300 | 5 |

Antes de cada asiento se vieron los cuatro códigos en 0: pruebas, typecheck, lint (165 avisos, sin margen) y detector de citas. Una incidencia: el detector dio 1 sobre `e16baed` por dos citas del propio informe de verify que la remediación había desplazado; se reapuntaron a la línea de hoy en `775a9b7` y el intento se asentó con el detector en 0.

## Verify

PASS con avisos, 0 críticos, 4 requisitos y 57 escenarios. El sobre declara 57 de 57 porque el validador no admite un pase con recuentos incompletos; de ellos, los dos de atomicidad y los dos comprobados por `git diff` no tienen una prueba que los observe de verdad. Está dicho en el informe de verify.

- **Remediado en el mismo intento:** W6, un defecto real —la ruta aceptaba fechas imposibles y el motor las desplazaba en silencio (el 31 de febrero pasaba a ser 2 de marzo)—, con rojo antes; W2, W3 y W5, huecos de prueba; W4 y W7, texto.
- **Queda abierto, y archivar no lo cierra:**
  - W1 — la atomicidad se comprueba por un espía de SQL, porque pg-mem no revierte de verdad. Que un fallo a media pasada no deje tickets marcados no está observado sobre una base real.
  - La reversión del `.sql` sólo ha corrido sobre pg-mem, con un envoltorio que califica el esquema. Su primera ejecución real será la de la persona.
  - La posición del `401` frente al `400` tiene prueba, pero no mutación de posición reproducida.
  - S3 — el `UPDATE` no comprueba que el estado siga siendo el que se leyó; hoy lo cubre el requisito de aplicar con la aplicación en reposo.
  - S1, S2 y S5, menores, descritos en el informe de verify.

## Desviaciones respecto al diseño

- El guardián del `.sql` vive en `apps/desk/server/db/` y no en `packages/zoho-sync`: necesita el ejecutor, y un paquete no importa de `apps/`.
- La reversión filtra por la regla del marcador y restaura el `status_type` previo; el diseño decía filtrar por ese valor. Delta y diseño quedaron realineados.
- Tres lotes en vez de los dos de la propuesta.
- `apps/desk/server/reconciliacion/registro.test.ts` pasa de ocho a nueve tandas «en curso»: entra F1F-01.

## Supuestos aplicados, todos reversibles

La sincronización de tickets sigue encendida y las filas migradas quedan protegidas por `managed_by_app`; «Entregado» pasa a `Closed` sin tocar la fecha de cierre; los tickets nacidos en Zoho tras el corte y los abiertos sin remisión de entrada vigente sólo se listan; la negativa total la disparan los estados sin equivalencia entre lo que se migraría. Cada uno está en la propuesta con su forma de revertirlo, y los que necesitan respuesta están en la bandeja.

## Specs vivas

Cuatro bloques ADDED, fusionados por script al final de cada spec viva con comprobación de identidad contra el delta: RQ-TC-40 y RQ-TC-41 en `openspec/specs/tickets-core/spec.md`; RQ-ZS-17 y RQ-ZS-18 en `openspec/specs/zoho-sync/spec.md`. Ningún MODIFIED, así que ninguna línea ya citada de las specs vivas se desplaza y no hay barrido de anclas. No se crea ninguna capacidad nueva (R-2 no aplica) y no hay corrección del maestro (`toca_maestro: no`).

## Bandeja

`docs/sdd/ENTRADA.md`, E-207 a E-218, todas con dueño Gerencia y sin destino inventado (R-3): seis preguntas que condicionan la ejecución (E-207 a E-212), cinco efectos visibles de la fila marcador que no se corrigen aquí (E-213 a E-217) y la averiguación de la hoja de Google, sin constancia de hecha y con el plazo vencido (E-218). Siguiente entrada libre: E-219.

## Tareas de personas — archivar no las da por hechas

| Tarea | Dueño | Qué desbloquea |
|---|---|---|
| Copia de la base antes de aplicar | La persona con acceso a producción | Poder aplicar |
| Sincronización completa y reciente justo antes | La que Gerencia designe (E-208) | Que no se congele un dato viejo |
| Pasada en seco y lectura del informe: `negativa` nula y `numeracion.arrastra` falso | La persona con acceso a producción | Poder aplicar; si `arrastra` es verdadero, no aplicar y consultar |
| Pasada con `aplicar=true`, con la aplicación en reposo y la fecha de corte que fije Gerencia | La persona con acceso a producción | La migración |
| Averiguación de la hoja de Google y cotejo una a una | Gerencia (E-218) | El cierre de F1F-01 |

## Para el paquete de despliegue

Sin sentencias de esquema y sin variables de entorno nuevas (el `grep` de `process.env` sobre el diff contra `894efd7` sale vacío). Una ruta nueva de superadministrador, inerte hasta que alguien la llame. El `.sql` no se despliega. `apps/desk/src` no se toca: el cambio no añade ninguna decisión de cliente (regla de mutación 3).
