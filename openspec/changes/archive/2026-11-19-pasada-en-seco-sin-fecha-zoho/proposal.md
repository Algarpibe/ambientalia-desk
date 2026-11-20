---
tanda: F1F-01
motivo: ""
capacidad: [zoho-sync]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `pasada-en-seco-sin-fecha-zoho`

## 1. Qué construye y para qué

El informe de la migración de tickets abiertos (`InformeMigracion`, `apps/desk/server/db/migracionTicketsAbiertos.ts:18-26`) gana el campo
`sinFechaDeZoho`: cuántos tickets a migrar quedarían sin fecha de Zoho por el supuesto S-11 de `marcador-migracion-lectores`, y cuáles, por regla,
para que Gerencia decida la pregunta `s11-migrados-sin-fecha-de-zoho` con el número delante antes del 12/12. Hipótesis (dato del encargo, que el
repositorio no contiene): la pregunta está en el apartado 06 del panel y dice que el número no está medido.
S-11, tal como se escribió (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:238-240`): «Un marcador que cambia el estado y
no tiene fecha de Zoho deja la secuencia ENTERA en `null`, aunque después haya transiciones reales». Lo declara `packages/shared/src/marcadorMigracion.ts:58`
y lo ejecuta `packages/shared/src/marcadorMigracion.ts:69`. Medir no es corregir: S-11 no se toca. La pasada en seco del 12/11 dio 28 migrables, todos
por identidad (`openspec/config.yaml:5646`): aquel plan habría dado `{ tickets: 0, porRegla: [] }`. El 12/12 puede variar (hipótesis).

## 2. «Entregado» → «Finalizado»: se cuenta aparte, con la misma noción

**No basta con remitir a `cierres.conFechaDeMigracion`:** la regla figura en `porRegla` con sus números, como la de «Pendiente» (D-5). Hoy coinciden
por construcción: `cierreDeMigracion` da `origen: 'zoho'` si y sólo si hay `closedTime` (`packages/shared/src/migracionTickets.ts:126-128`);
`entradaDelMarcador` fecha esa regla con `llegadaQueCuenta` (`packages/shared/src/marcadorMigracion.ts:49`), que sólo devuelve `closed_time_destino`
con `cierre_origen: 'zoho'` (`packages/shared/src/cierreEnCifras.ts:15-16`, `packages/shared/src/cierreEnCifras.ts:39-41`); y `cierresDeMigracion`
suma `conFechaDeMigracion` exactamente cuando `closedTime` es nulo (`packages/shared/src/migracionTickets.ts:137-139`), siendo ésta la única regla con
`statusTypeDestino: 'Closed'` (`packages/shared/src/migracionTickets.ts:30-39`). Pero remitir no basta: (a) `cierres` da sólo la cifra
(`packages/shared/src/migracionTickets.ts:131`) y el encargo pide los números de ticket; (b) sería una segunda noción de «sin fecha de Zoho» (`closedTime`
nulo) frente a la única, `entradaDelMarcador` (`packages/shared/src/marcadorMigracion.ts:10-11`): si `llegadaQueCuenta` cambiara, las dos se separarían sin
que nada se pusiera rojo (molde H5). S-10 ya remitía a `cierresDeMigracion` (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:235-237`):
es cierto de la cifra, no de los números. Una prueba enfrenta las dos sobre el mismo fixture y exige que coincidan (P2).

## 3. Alcance

**Dentro.** La regla pura al final de `packages/shared/src/marcadorMigracion.ts` y sus unitarias (D-1, D-2); la lectura de la historia de Zoho, sacada
de `conFechaDeZoho` al final de `apps/desk/server/db/sla.ts` (D-3); el campo, en seco y con `aplicar=true`, también con negativa (D-4); una frase en la
viñeta de la pasada en seco de `DEPLOY.md` §14 (`DEPLOY.md:672`), con su guarda (D-7). **Capacidad modificada:** `zoho-sync`, con requisitos nuevos
AL FINAL de `openspec/specs/zoho-sync/spec.md` desde RQ-ZS-68 (el último es RQ-ZS-67, `openspec/specs/zoho-sync/spec.md:3184`), que amplían el informe
del ejecutor de RQ-ZS-17 (`openspec/specs/zoho-sync/spec.md:812`). **Capacidades nuevas:** ninguna (R-2 no aplica).

**Fuera.**
- S-11 y `resolverMarcador` (`packages/shared/src/marcadorMigracion.ts:60-73`); el bucle de escritura (`apps/desk/server/db/migracionTicketsAbiertos.ts:71-91`), que ni se refactoriza ni cambia lo que escribe (D-6).
- Interruptor, variable de entorno y migración de esquema: el campo no enciende ningún escritor (D-8). El cliente (`apps/desk/src`) no se toca.
- Avisos: ni en `avisos` del informe ni a nadie; la cifra no bloquea la aplicación (S-5). Tampoco `docs/sdd/ENTRADA.md` ni `openspec/config.yaml`.

## 4. Enfoque

- **D-1 · Regla pura en `shared`** (regla invariable 13): `sinFechaDeZohoDeMigracion(planes, etapasPorTicket, instante): SinFechaDeZoho`, al final de
  `packages/shared/src/marcadorMigracion.ts`. Por cada plan `migrar` con equivalencia arma la fila del marcador como la escribe el ejecutor
  (`apps/desk/server/db/migracionTicketsAbiertos.ts:72-81`: id de la migración, `from_status` el estado, `to_status` nulo si destino = origen, `values`
  con `regla` y, si cierra, `closed_time_destino` y `cierre_origen` de `cierreDeMigracion`) y se la pasa a `entradaDelMarcador`
  (`packages/shared/src/marcadorMigracion.ts:42-52`) con las etapas de su ticket: `tipo: 'entrada'` hace figurar la regla; `desde` nulo cuenta el ticket.
  Imports en sitio en `packages/shared/src/marcadorMigracion.ts:3` en `d2a735a4`, y nada más cambia ahí; sin ciclo (`packages/shared/src/migracionTickets.ts:1-3` no importa `marcadorMigracion`), y el índice ya reexporta el módulo (`packages/shared/src/index.ts:57`).
- **D-2 · Forma:** `sinFechaDeZoho: { tickets: number; porRegla: { regla: ReglaEquivalencia; tickets: number; numeros: number[] }[] }`. Una entrada por
  regla que cambia el estado entre los migrables, por orden de primera aparición (los planes vienen por número, `apps/desk/server/db/migracionTicketsAbiertos.ts:33`),
  con `tickets: 0` y `numeros: []` si todos tienen fecha; `tickets` es la suma. Sin migrables, `{ tickets: 0, porRegla: [] }`. Identidad y «Pendiente» de soporte no figuran.
- **D-3 · Una sola lectura, sin copiarla:** `etapasDeZohoPorTicket(db, ids)`, exportada al final de `apps/desk/server/db/sla.ts`, con la consulta de
  `apps/desk/server/db/sla.ts:136` en `d2a735a4`, el mismo `json` y el mismo `etapasDesdeHistoria`; con `ids` vacío no consulta. `conFechaDeZoho` la llama:
  `apps/desk/server/db/sla.ts:135-138` en `d2a735a4` se reescriben en sitio, a igual número de líneas y con un comentario sobre quién más la usa, y
  `apps/desk/server/db/sla.ts:142` en `d2a735a4` usa el mapa. `apps/desk/server/db/sla.ts:2` no se toca.
- **D-4 · Ejecutor, en sitio o al final de línea:** el tipo al final de `apps/desk/server/db/migracionTicketsAbiertos.ts:25` en `d2a735a4`; `ahora` llega a
  `prepararInforme` (`apps/desk/server/db/migracionTicketsAbiertos.ts:41` en `d2a735a4`) desde `apps/desk/server/db/migracionTicketsAbiertos.ts:67` en `d2a735a4`
  y `apps/desk/server/db/migracionTicketsAbiertos.ts:69` en `d2a735a4`; el campo, al final de `apps/desk/server/db/migracionTicketsAbiertos.ts:58` en `d2a735a4`;
  los imports, al final de `apps/desk/server/db/migracionTicketsAbiertos.ts:5` en `d2a735a4` y de `apps/desk/server/db/migracionTicketsAbiertos.ts:8` en `d2a735a4`.
  Como `prepararInforme` corre antes de la negativa (`apps/desk/server/db/migracionTicketsAbiertos.ts:70`) y del bucle, en seco va sin transacción y, con `aplicar`, dentro de ella y antes del primer `INSERT`. No cambia `negativa`, `aplicado` ni `avisos`.
- **D-5 · «Entregado» aparte, con la misma noción** (§2). **D-6 · El bucle no se refactoriza:** la fila simulada repite `to_status`
  (`apps/desk/server/db/migracionTicketsAbiertos.ts:81`) y las claves de `values` (`apps/desk/server/db/migracionTicketsAbiertos.ts:73-76`) que lee
  `entradaDelMarcador`; la coincidencia la fija una prueba que enfrenta la predicción en seco con los marcadores reales tras aplicar (molde H5, como `apps/desk/server/db/sla.ts:118`).
- **D-7 · `DEPLOY.md`:** al final de `DEPLOY.md:673` en `d2a735a4`, una frase: qué cuenta `sinFechaDeZoho`, que no impide aplicar y que es el dato de la
  pregunta `s11-migrados-sin-fecha-de-zoho`. Guarda en fichero nuevo, con el molde de `apps/desk/server/deployPoolConexionCortada.test.ts`.
- **D-8 · Sin interruptor, migración de esquema, variable de entorno ni cliente.** **D-9 · Pruebas nuevas en ficheros nuevos:** la única existente que
  cambia es `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56` en `d2a735a4`, en sitio, como cuando ganó `'cierres'` (`openspec/changes/archive/2026-10-16-fecha-cierre-migracion/design.md:80`).

**Ejemplo.** Corte `2026-12-01T05:00:00Z`, historia sembrada como `cambioDeZoho` (`apps/desk/server/migracionMarcadorLectores.test.ts:102-108`): 4100
«Entregado» sin `closed_time`; 4200 «Entregado» con `closed_time`; 4300 «Pendiente» de servicio sin entrada a «Pendiente» en Zoho; 4400 el mismo con un
`TicketUpdated` hacia «Pendiente»; 4500 identidad; 4600 «Pendiente» de soporte remoto; 4700 y 4800 «Pendiente» de servicio, ya gobernado y creado tras el
corte. El seco trae `cierres: { conFechaDeZoho: 1, conFechaDeMigracion: 1 }`, que coincide con la primera entrada (P2), y
`sinFechaDeZoho: { tickets: 2, porRegla: [{ regla: 'entregado-a-finalizado', tickets: 1, numeros: [4100] }, { regla: 'pendiente-servicio-a-en-proceso', tickets: 1, numeros: [4300] }] }`.

## 5. Ficheros citados y dónde se edita

| Fichero (`wc -l`) | Citas a lo que se edita, contadas en `d2a735a4` (todas siguen ciertas: caso A) | Dónde se edita |
|---|---|---|
| `apps/desk/server/db/migracionTicketsAbiertos.ts` (106) | bucle, 65; líneas 8, 25, 41, 58 y 69, ninguna; línea 5, tres («importa `normalizarEstado`»); línea 67, una («el seco no abre transacción») | en sitio o al final de línea; ninguna línea nueva |
| `apps/desk/server/db/sla.ts` (146) | de la 127 en adelante, sólo la 132; las que nombran las líneas 137 a 141 de un `sla.ts` sin directorio son del de `shared`: hablan de las alarmas, que viven allí | 135-138 y 142 en sitio, a igual número de líneas; función nueva al final |
| `packages/shared/src/marcadorMigracion.ts` (103) | 42, 60, 69 y 75, una cada una; la 3, ninguna | la 3 en sitio; función nueva al final |
| `apps/desk/server/db/migracionTicketsAbiertos.test.ts` (243) | la 56, dos (qué claves trae el informe) | la 56 en sitio |
| `DEPLOY.md` (1.196) | la 673, una (que cita las líneas 22 y 24 del ejecutor) | al final de la 673; §14 no es la última sección y ninguna `deploy*.test.ts` la fija |
| `openspec/specs/zoho-sync/spec.md` (3.216) | — | requisitos nuevos al final, al archivar |

## 6. Supuestos reversibles (para la lista semanal)

- **S-1** Nombre y forma del campo (D-2), con entrada a cero para cada regla que cambia el estado. *Lo deshace:* el tipo y la regla pura.
- **S-2** «Entregado» se cuenta aparte con la misma noción (D-5). *Lo deshace:* quitar esa regla de `porRegla` y remitir a `cierres`.
- **S-3** La lectura vive al final de `apps/desk/server/db/sla.ts`, no en un módulo nuevo (D-3). *Lo deshace:* moverla, sin copiarla.
- **S-4** El bucle no se refactoriza; la coincidencia la fija P4 (D-6). *Lo deshace:* una función de la fila del marcador que usen el bucle y la regla.
- **S-5** El campo no bloquea la aplicación ni añade aviso: es el dato de la pregunta. *Lo deshace:* un aviso en `avisos` o una negativa nueva.
- **S-6** La historia se lee sólo de los migrables (`apps/desk/server/db/migracionTicketsAbiertos.ts:44`). *Lo deshace:* la lista de `ids`.
- **S-7** Cuenta la pasada en seco inmediatamente anterior a aplicar, ya con Zoho en sólo lectura y tras la sincronización completa (orden de `decision/migracion-e207-e212`, `DEPLOY.md:671`): la historia puede cambiar hasta entonces. *Lo deshace:* fijar en `DEPLOY.md` otra pasada de referencia.

## 7. Criterios de aceptación

- **CA-1 (P1)** Seco, sobre el fixture de §4: el campo del ejemplo, sin `BEGIN` ni escrituras (espía como `apps/desk/server/db/migracionTicketsAbiertos.test.ts:34-44`).
- **CA-2 (P2)** La entrada de «entregado-a-finalizado» y `cierres.conFechaDeMigracion` coinciden, enfrentadas sobre el mismo fixture.
- **CA-3 (P3)** Con `aplicar=true`, el mismo campo que en seco; por el espía, la lectura de `ticket_history` va antes del primer `INSERT INTO ticket_transitions`.
- **CA-4 (P4)** Predicción = realidad: tras aplicar, `entradaDelMarcador` sobre los marcadores reales y la historia da los números sin fecha del seco previo.
- **CA-5 (P5, P6, P7)** Con negativa, `aplicar=true` devuelve el campo y no escribe; sin migrables, `{ tickets: 0, porRegla: [] }`; una regla con todos fechados figura con `tickets: 0, numeros: []`.
- **CA-6 (P8)** La viñeta de la pasada en seco de `DEPLOY.md` §14 nombra `sinFechaDeZoho`, y la guarda nueva lo exige.
- **CA-7** Unitarias de la regla pura en un fichero nuevo de `packages/shared/src/`: filtro `migrar`, entrada a «Pendiente», identidad, soporte y «Entregado»
  con y sin cierre. `conFechaDeZoho` no cambia: lo caracterizan las pruebas existentes de `apps/desk/server/migracionMarcadorLectores.test.ts`.
- **CA-8** Cada mutación pone algo rojo y se restaura con `perl -i -pe` (nunca `sed -i`), con `file` en CRLF y `git diff` vacío: M1 sin el cálculo del
  campo; M2 `entradaDelMarcador` siempre con fecha (`packages/shared/src/marcadorMigracion.ts:51`); M3 la regla ignora la historia (cuenta el 4400); M4 sin
  el filtro `migrar` (cuenta el 4700 y el 4800); M5 `to_status` simulado siempre el destino (cuenta la identidad; P4 en rojo); M6 POSICIÓN, el campo tras el
  bucle (P3 en rojo, regla de mutación 1); M7 sin el nombre en `DEPLOY.md` (P8 en rojo, regla de mutación 2); M8 `etapasDeZohoPorTicket` con el mapa vacío (rojas las nuevas y las de `conFechaDeZoho`: la lectura es una sola).
- **CA-9** Barrido de la regla de mutación 4 al cerrar (casos A, B y C) sobre los ficheros de §5, con las formas cortas y las citas ancladas de esta propuesta.
- **CA-10** Las cinco comprobaciones en 0: `npm run typecheck`, `npm run lint -- --max-warnings 165` (sin `eslint-disable` ni `any` nuevos), el detector de
  citas (`apps/desk/server/citas/cli.ts`), `npm test` y `npm run build` con el bundle `index-F1jDYjEU.js`; sin cambios en `apps/desk/src`; intento bajo 800.

## 8. Qué hay que desplegar

Sólo el servidor, sin migración de base, sin variables y sin interruptor, antes del 12/12, para que la pasada en seco previa a la migración ya traiga el
campo. No hay datos que tocar. Hipótesis hasta compilar: el bundle no cambia, porque `apps/desk/src` no nombra ningún símbolo de `packages/shared/src/marcadorMigracion.ts`.

## 9. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| La fila simulada se separa de la que escribe el bucle | Baja | P4 las enfrenta; M5 lo demuestra |
| Sacar la lectura de `conFechaDeZoho` altera el reloj o las alarmas | Baja | en sitio, a igual número de líneas; M8 pone rojas sus pruebas |
| Otra prueba fija las claves exactas del informe | Baja | suite entera; la conocida se edita en sitio (D-9) |
| Mover líneas de ficheros muy citados | Media | sólo en sitio o al final; CA-9 |
| La historia de Zoho cambia hasta el 12/12 | Media (hipótesis) | S-7: cuenta la pasada inmediatamente anterior a aplicar |

## 10. Vuelta atrás

Revertir la fusión y redesplegar el servidor. No hay escritura ni esquema nuevos: el campo desaparece del informe y nada queda en la base.

## 11. Ronda de preguntas

No se hace: `execution_mode: auto` (`openspec/config.yaml:26`), y ninguna duda cumple los cinco motivos de parada de la «Regla de ejecución» de `CLAUDE.md`:
(1) no cambia el alcance de la fila, que sigue «en curso» con `cierra: no` (`apps/desk/server/reconciliacion/registro.test.ts:220`); (2) no cuesta dinero;
(3) no toca datos de producción: en seco no escribe (`apps/desk/server/db/migracionTicketsAbiertos.ts:15`) y con `aplicar` el campo sólo lee; (4) no contradice
ninguna decisión: la pregunta no tiene respuesta registrada y S-11 no se toca; (5) toda duda tiene supuesto razonable y reversible (§6). Gerencia puede corregir S-1, S-2 y S-5 en la lista semanal.
