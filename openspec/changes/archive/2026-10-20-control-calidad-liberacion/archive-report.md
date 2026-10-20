# Informe de archivo — `control-calidad-liberacion` (F1C-07, `cierra: no`)

Fecha: 2026-10-20. Rama `control-calidad-liberacion`, base `e8eaea23` (Parte A en `main`:
`decision/f1c07-firma-control-calidad` y `decision/f1c07-supuestos-corregidos`). Verify: **PASS con avisos** (0 CRITICAL,
1 WARNING, 4 SUGGESTION), `verify-report.md`. Informe escrito por el orquestador con cifras medidas, no por el agente de archivo.

**Qué cubre de la fila F1C-07 (R01.4:105) y qué deja fuera, en una línea:** cubre el estado `Control de calidad` entre
`En Proceso` y `Por Facturar` con aprobado → `Por Facturar` y rechazado → `En Proceso` con prioridad alta y retrabajo
contable, el checklist y el gas patrón impuestos por el servidor y la firma por persona («nunca quien intervino»), todo detrás
de `CONTROL_CALIDAD_LIBERACION` apagado; deja fuera la foto del equipo embalado y el «checklist firmado» como guarda de salida
desde `Por Entregar` (no hay remisión de salida ni adjuntos por transición), la firma con imagen del responsable, el checklist
alimentado por los puntos que fallaron en el diagnóstico, el informe de salida y la calibración directa por QA (D11 de la
propuesta). Por eso `cierra: no`.

## 1. Fusión en las specs vivas

Sólo ADDED, añadidos al FINAL de cada spec viva por script (`fusiona-ccl.mjs`, fuera del repositorio), con comprobación de
identidad bloque a bloque tras escribir: los 16 bloques vivos son idénticos a los de la delta y el resto del fichero, intacto.

| Capacidad | Requisitos añadidos | Líneas |
|---|---|---|
| `transitions-st` | RQ-TS-46 a RQ-TS-51 | +157 |
| `permissions` | RQ-PM-32 a RQ-PM-37 | +154 |
| `derivacion-avisos` | RQ-AV-24 (con el prefijo «Requirement:», como el resto de esa spec) | +39 |
| `trazas` | RQ-TZ-22 a RQ-TZ-24 (sin el prefijo, como el resto de esa spec) | +47 |

**Cifras vivas sustituidas en su sitio, a igual número de líneas** (las cabeceras de las deltas lo anunciaban: «se reescriben
en el archive»), con un script que exige una sola coincidencia por sustitución y el mismo número de líneas antes y después:

- `transitions-st` RQ-TS-05: 23 estados; alcanzabilidad 21, 21 y 22 (medida con `tsx` sobre `TRANSITIONS`; «Previously,
  hasta F1C-07: 20, 20 y 21 sobre 22»). RQ-TS-06: las filas 4, 5 y 6 nombran el `409` del interruptor, el `403` de firmante y
  el contenido de control de calidad en su misma sentencia. RQ-TS-26: 36 / 44 / 23 («Previously, hasta F1C-07: 33 / 41 /
  22»). RQ-TS-44: 50 filas desde F1C-07 (36 de servicio); las tres nuevas, con su tipo y su fuente, en la línea de
  «Servicio», sin filas nuevas en la tabla.
- `permissions` RQ-PM-29: el escenario de las 14 Decisionales dice que son las que reciben la regla de F1C-05; las dos de firma
  de control de calidad, también Decisionales, tienen la suya (RQ-PM-35).
- `trazas` RQ-TZ-01: diez columnas (nueve hasta F1C-07), con `performed_by_id` (RQ-TZ-22).
- `openspec/config.yaml:110` (`capabilities`, descripción de `transitions-st`): «36 transiciones y 23 estados», que exige
  RQ-TS-26. Precedente: F1C-02 cambió esa misma línea en su rama (`8167a80`). La rama toca `openspec/config.yaml` sólo ahí y en
  `cifras_ancladas` (`:1361-1372`).
- **No se toca** RQ-TS-27: su tabla «antes → después» es el registro fechado de F1C-09 (caso B de la regla de mutación 4).

**Parte con carga de revisión** (regla del archivo), medida antes de aplicar la fusión: sustituciones 25 + 25, fusión 397 e
informe ≤ 200, unas 647 líneas proyectadas, bajo 800. Medida final en la §3.

## 2. Intentos del registro (todos `passed`, medida `git diff --shortstat --no-renames` contra el commit de partida; 0 líneas
sin trackear en cada cierre; ningún binario)

| Intento | Contenido | Commit | Líneas |
|---|---|---|---|
| I1 | propuesta y deltas | `be71cd93`, `81301f27` | 617 |
| I2 | diseño y tareas | `5381b00d` | 277 |
| I3 | lote 1a: catálogo, vigilantes, `cifras_ancladas`, mapa | `5ffc930a` | 468 |
| I4 | lote 1b: regla pura `controlCalidad.ts` | `39ec96a9` | 372 |
| I5 | lote 2a: interruptor, `performed_by_id`, `409` | `8250a424`, `3eb710eb` | 268 |
| I6 | lote 2b: `403` de firmante y contenido | `e1545528` | 380 |
| I7 | lote 2c: prioridad, aviso y ruta | `b55724dc` | 242 |
| I8 | lote 3: cliente, `DEPLOY.md` §16, regla 13, barrido de citas | `18375c99` | 190 |
| I9 | verify | `389904ae` | 172 |
| I10 | archive (este) | ver §3 | ver §3 |

Ningún intento superó la válvula de 720. Techo del archive: 3.638 (2 × 1.419 de la carpeta + 800).

## 3. Códigos y medida del commit de archivo

Cadena de cierre del I10, en serie y en primer plano, el 2026-10-20, sobre el árbol del archive con este informe ya escrito
salvo esta sección:

| Código | Resultado |
|---|---|
| `npm run typecheck` | 0 (15 s) |
| `npm run lint` | 0, con 165 avisos (la cifra de partida) (18 s) |
| Detector de citas | 0 sobre un commit temporal con el árbol del archive (`git commit-tree`, sin mover la rama), y 0 otra vez con `--sha HEAD` tras el commit de archivo. Las mismas 13 abreviadas rotas informativas que en `389904ae`: ninguna nueva |
| `npm test` | 0: 305 ficheros pasan y 3 se saltan (308); 5.152 pruebas pasan y 11 se saltan (5.163); 247 s |
| `npm run build`, aparte | 0; `index-CVU9N07K.js` 422,92 kB (121,32 kB gzip), el mismo hash que en el lote 3: el archive no toca el cliente |

**Medida del commit de archivo** (`git diff --shortstat --no-renames 389904ae`): 24 ficheros, 1983 inserciones y 1444
borrados; 0 líneas sin trackear; ningún binario. Con detección de renombrado son 564 y 25. **Parte con carga de revisión**
(regla del archivo): 445 en las cuatro specs vivas (421 inserciones y 24 borrados, que son las líneas sustituidas), 2 en `openspec/config.yaml:110` y 142 de
este informe: 589, bajo 800. En cada lote anterior: `npm test` 0, `npm run typecheck` 0, `npm run lint` 0 con 165 avisos,
detector 0; `npm run build` 0 en el lote 3, con el mismo bundle.

## 4. Lo que la tanda deja al encender

- **Interruptor** `CONTROL_CALIDAD_LIBERACION`, nace cerrado (`packages/zoho-sync/src/config.ts:66`, lectura en `:125`).
  Apagado, el flujo es el de hoy: el envío a control de calidad da `409` y `finalizacion_servicio` sigue a `Por Facturar`.
  Encendido, al revés. Las dos salidas de `Control de calidad` no dependen del interruptor. Se enciende en enero junto con
  `DECISIONALES_POR_CARGO`, nunca antes del 14/12 (`DEPLOY.md` §16).
- **Migración aditiva**, al arrancar: `ALTER TABLE ticket_transitions ADD COLUMN IF NOT EXISTS performed_by_id text` (al
  final de `packages/zoho-sync/src/db/schema.sql`), sin relleno. No cambia ningún dato existente.
- **Regla 13:** tabla de nueve decisiones del cliente, cada una con la línea del servidor que la impone, en
  `apply-progress.md`; el verify la contrastó línea a línea sin desvíos.

## 5. Mutaciones

Del encargo, todas cazadas en el apply y REPRODUCIDAS en el verify (23, una a una, `git diff --exit-code` en 0 tras cada una):
interruptor encendido por defecto; con el interruptor apagado aparece el estado; firma el técnico asignado; firma el autor de
una Operativa; una Decisional o de Compras / Logístico cuenta como intervención; firma el Especialista con un Coordinador
activo; firma un Técnico; el administrador firma habiendo otro habilitado; el administrador firma sin motivo; el aviso va al
Director Técnico; el aviso no sale; el rechazo no sube la prioridad; el retrabajo no se registra; aprobado no lleva a
`Por Facturar`; y posición de las guardas nuevas frente a sus vecinas (CC-1 a CC-4). **No observables**, declarado: la firma
frente a las fechas derivadas, a la prioridad, a la OVI y a la verificación (las dos de firma no llevan esos campos), y el
contenido frente a la persona derivada.

## 6. Barrido de citas (regla de mutación 4)

Sobre todo lo que tocó la rama (lote 3, `apply-progress.md`): 1.169 citas a líneas cambiadas o desplazadas; 987 en
`openspec/changes/archive/` (caso B, no se tocan) y 182 fuera, caso A todavía cierto o caso B fechado. Reparados tres
comentarios de cuentas: `packages/shared/src/estados.ts:111`, `:187` y `packages/shared/src/fasesBlueprint.ts:29`. Las 96 citas
a `ticketService.ts` se leyeron por muestreo, no una a una. El archive añade al final de las specs vivas (no desplaza) y
sustituye a igual longitud.

## 7. Supuestos para la lista semanal de Gerencia (reversibles)

S-1 ítems del checklist (provisionales); S-2 nombres de las transiciones; S-3 aprobado y rechazado, Decisional; S-4 el
administrador tampoco firma si intervino (si intervinieron todos los habilitados y todos los administradores activos, nadie
firma y el ticket espera; el aviso sí sale); S-5 en filas viejas de la traza, comparación por nombre exacto; S-6 en tickets de
Zoho sólo cuenta lo registrado en Desk y `derivado_a`; S-7 `409` para la salida que quita el interruptor; S-8 las salidas de
QA no dependen del interruptor; S-9 quien envía a QA intervino; S-10 el rechazo no rebaja `Urgent`; S-11 en el rechazo, el
«Motivo del rechazo» hace de motivo del administrador; S-12 quien envía no recibe el aviso; S-13 aviso sólo de bandeja;
S-14 fase `diagnostico` y columna entre `Liberación Comercial` y `Por Facturar`; S-15 sin SLA propio; S-16 al reenviar tras un
rechazo, «Fecha Finalización ST» queda bloqueada con la primera fecha; S-17 checklist, gas y motivos sólo en la traza;
S-18 si el aviso falla, el envío responde 200.

## 8. Fuera del recuento — de personas, no de esta tanda (regla del ciclo 1; archivar NO los da por hechos)

| Pendiente | Dueño | Dónde queda escrito |
|---|---|---|
| Línea `CONTROL_CALIDAD_LIBERACION=` en `.env.example` (W-1 del verify; la sesión no pudo leer ese fichero). Tampoco está la de `DECISIONALES_POR_CARGO` | Supervisión | este informe; `DEPLOY.md` §16 ya la documenta |
| Encender el interruptor en enero, junto con `DECISIONALES_POR_CARGO` | Gerencia | `decision/f1c07-supuestos-corregidos`; `DEPLOY.md` §16 |
| Asignar `cargo_permiso` (Coordinador, Director, Especialista técnico) antes de encender | Administrador | `DEPLOY.md` §16 |
| Supuestos S-1 a S-18 | Gerencia (lista semanal) | §7 |
| Las piezas de D11 (foto embalado, firma con imagen, checklist de diagnóstico, informe de salida, calibración directa) | Gerencia: sitúa su tanda | propuesta §4 |
| Pruebas en la app con el interruptor apagado y encendido | Gerencia (ronda final) | lista de pruebas pendientes |

## 9. SUGGESTION del verify, no corregidas

S-1 no hay caso de firma con la app apagada en `apps/desk/server/controlCalidad.test.ts` (lo cubren los barridos de
`permisos.test.ts` y `transicionesEjecucion.test.ts`); S-2 «falta una casilla» se prueba con una sola; S-3 CC-5 y CC-6 no
tienen prueba de su par exacto; S-4 tres escenarios sin prueba con su nombre (ticket de Zoho sin traza, vacante con Director
libre en el aviso, envío rechazado que no avisa), cubiertos por la regla pura. Nota TDD: el rojo de `DEPLOY.md` §16 se obtuvo
mutando el fichero vigilado después de escribir el texto.
