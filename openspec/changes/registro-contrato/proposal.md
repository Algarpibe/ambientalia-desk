---
tanda: F1B-11
motivo: ""
capacidad: [tickets-core, transitions-st, remisiones, zoho-sync, derivacion-avisos]
maestro: ["Anexo D nº 53", "M4.4", "M1.9.1"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: registro de contrato, prioridad por contrato e informe trimestral

Cambio **3 de 3** de F1B-11. El 1 (`parche-iv11-orden-venta`) puso la marca de fila; el 2 (`asociacion-ov-ticket`) creó
`public.ov_asociaciones` y la subOV de lote. Éste construye el contenido que `decision/anexo-53-contratos`
(`openspec/config.yaml:2448-2469`, respuesta textual `:2452-2459`) añadió a la fila (plan R01.2, `:38` y `:64`).
El cambio 2 lo daba por el que cerraba la fila; **ya no la cierra**: la ampliación queda pendiente de E-086.

## Intención

- Hoy el sistema no sabe que un ticket es de contrato, y el maestro lo exige: de ahí sale su prioridad alta (R08.2 §M4.4,
  `:2150`; §M1.9.1, `:1700-1702`). El Anexo D nº 53 (`:4198-4201`) pide cómo se identifica, cómo afecta a la prioridad y
  cómo alimentan las subOV el informe trimestral; Gerencia lo respondió (`config.yaml:2452-2459`).
- El código no guarda ni inicio ni fin de contrato (`config.yaml:1620-1623`; maestro `:2185`, «[ABIERTO] … no tiene
  dónde guardar un fin de contrato»). Sin eso no se puede aplicar `decision/vigencia-contrato` (`config.yaml:1609-1612`):
  una subOV libre de un contrato vencido «en teoría no» se consume.
- La prioridad al nacer es hoy la que traiga el cuerpo, o nada: `apps/desk/server/services/ticketService.ts:106`
  (`b.prioridad`), que el formulario deja opcional (`apps/desk/src/components/CreateTicket.tsx:426-429`).
- Comercial hace a mano la correlación subOV ↔ servicio para el informe al cliente (maestro `:2147`).

## Alcance

**Dentro**
1. **Registro de contrato** en Desk: cliente, lote `OV-AAAA-NNN`, fecha de inicio, fecha de fin. Lo crea el área
   Comercial (S-2). Ficha del contrato con sus subOV.
2. **Ticket de contrato, DERIVADO**: un ticket lo es cuando tiene una asociación vigente (`public.ov_asociaciones`,
   `packages/zoho-sync/src/db/schema.sql:539-551`) a una subOV cuyo lote (`clasificarOV`,
   `packages/shared/src/subOV.ts:32-36`) está registrado como contrato vigente en ese momento. Nadie lo marca; se calcula
   al leer, no se guarda (S-3). La ficha del ticket lo enseña.
3. **Prioridad al nacer**: si el CLIENTE del ticket tiene un contrato vigente, el ticket nace en `High` (S-4), también
   los correctivos cotizados aparte. La impone el servidor en `createManagedTicket`, único camino de alta
   (`ticketService.ts:21`; `apps/desk/server/services/equipoNuevo.ts:90`).
4. **Guarda de contrato vencido**: una subOV de un lote cuyo contrato tiene la fecha de fin pasada NO se consume; las
   tres puertas la rechazan (S-5): alta (`ticketService.ts:96`), transición (`:134`, `:148-152`) y remisión
   (`apps/desk/server/routes/remision.ts:220`, `:230-234`).
5. **Informe trimestral como tabla exportable** desde la ficha: estado de cada subOV (libre / en curso / ejecutada),
   por trimestre del contrato: % ejecutado, servicios del trimestre, subOV libres y días hasta el vencimiento.
6. **Aviso de ritmo** a Comercial cuando al ritmo actual no se consumirán las subOV antes de la fecha de fin (S-8).

**Fuera**
- **Ampliación del contrato**: pendiente de E-086 (`docs/sdd/ENTRADA.md:1222-1228`), por eso `cierra: no`.
- **Top 5 y «manda la prioridad más alta de las dos»** → F1B-07. Lo que manda aquí es la **respuesta textual** y el
  **`tanda_que_abre`**, no las consecuencias: `decision/anexo-53-contratos` abre «F1B-11 · S41» (`config.yaml:2469`) y
  su respuesta pone la prioridad por contrato en Fase 1 «junto con F1B-11» (`:2459`); `decision/top5-manual` abre
  «F1B-07 · S43» (`:1965`). La regla de las dos se aplica cuando exista la lista de Top 5, que hoy no existe (`:1961`).
- Bloquear la edición de prioridad al técnico (maestro `:1695`): hoy `escalado_a_revision` y
  `devolucion_a_correccion` la piden (`packages/shared/src/transitions.ts:193`, `:195`). Es F1B-07.
- La versión con formato para el cliente (portal, `config.yaml:2459`). Relleno retroactivo (P.2 del cambio 2).
- Cargos: los siete de `decision/c10-permisos-cargo` / `c10b-gerente-director` (`config.yaml:1933`, `:2589`) no existen
  en el código (`grep -rn "Director Comercial" apps/ packages/ --include=*.ts` = 0). Son F1C-05.

## Capacidades

**Nueva:** ninguna (S-10). El registro, la vigencia y el ticket de contrato derivado entran en `tickets-core`, junto al
modelo de asociación (RQ-TC-17); el informe trimestral, en `zoho-sync`, junto al saldo por lote (RQ-ZS-14).
**Modificadas:**
- `tickets-core`: prioridad al nacer; guarda de vencido en el alta; la ficha enseña el contrato.
- `transitions-st`: guarda de vencido en `habilitar_servicio` y en las OV añadidas en `Aprobación`; §3.8 la escalona.
- `remisiones`: RQ-RE-16 gana la guarda de vencido antes de la unicidad.
- `derivacion-avisos`: nueva clase de aviso, ritmo de contrato.
- `zoho-sync`: requisito nuevo del informe trimestral; el saldo por lote (RQ-ZS-14) y su `consumido` quedan igual.

## Enfoque

- **Tabla nueva `public.contratos`** (nombre, S-1), calificada y al final de `schema.sql`, en `PUBLIC_TABLES`, como
  `ov_asociaciones`. Cliente = id de `public.clients`, vista sobre `books.contacts` con `id` = `contact_id text`
  (`schema.sql:169-170`), sin FK (réplica). Lote único.
- **Dominio puro en `packages/shared`**: vigencia por fecha, trimestres del contrato contados desde su inicio
  (`config.yaml:2465`), estado de cada subOV, % ejecutado y regla de ritmo. Sin base de datos: se prueba sola.
- **Ejecutada ≠ consumida.** «Ejecutada» = subOV con asociación vigente a un ticket en `Finalizado` (S-6). El
  `consumido` del cambio 2 (`packages/zoho-sync/src/books/subOV.ts:22`, `:33-48`) cuenta asociaciones vigentes: una
  subOV en curso está consumida y no ejecutada. El % ejecutado del informe es ejecutadas / creadas
  (`config.yaml:2457`), con las mismas «creadas» del saldo (`subOV.ts:36-40`). El maestro `:2182` dice «consumidas /
  creadas»: es la divergencia que justifica `toca_maestro`.
- **Precedencia (F1B-10).** La guarda de vencido es **escalón C**, no B: B es «estado y permiso del **sujeto**»
  (`openspec/specs/transitions-st/spec.md:835`), el ticket; aquí se juzga un **valor aportado**, la subOV. Es el mismo
  caso que la derivación a una persona que existe pero está de baja, que la spec ya clasifica C (`:843-844`). Dentro de
  C va **después de la cuarentena** por dependencia de datos: sin subOV canónica no hay lote (`subOV.ts:36`). Y antes
  de D (unicidad). En la remisión va entre `:220` y `:230`, sin reordenar lo demás (IV-12 intacto).
- **Informe.** El servidor calcula la tabla; el cliente la exporta a CSV con el patrón existente
  (`apps/desk/src/components/RemisionesPage.tsx:107-115`, BOM y `text/csv`). Hipótesis: no hay librería de xlsx en el
  código (sólo aparece en comentarios). Datos por servicio: equipo, serial y tipo de servicio existen
  (`schema.sql:28`); la fecha sale de `ticket_transitions.performed_at` con `to_status = 'Finalizado'`
  (`schema.sql:57-60`). **Hueco declarado:** del «informe» sólo existe `fecha_revision_informe` (`schema.sql:32`); el
  documento no está en los datos, y la capacidad `informes` no tiene spec (`config.yaml:230-234`). No se inventa.
- **Aviso** con `crearAviso` / `destinatariosDeArea` (`apps/desk/server/db/avisos.ts:8`, `:74`), anti-ruido una vez por
  contrato y trimestre.
- **Regla 13.** Bloquear, priorizar y avisar lo impone el servidor; el cliente muestra. Permiso por área, patrón de
  `apps/desk/server/routes/ovAsociaciones.ts:47`.

## Supuestos reversibles (modo `auto`)

- **S-1** Tabla `public.contratos`; un contrato por lote; el lote puede no existir aún en Books (creadas = 0).
- **S-2** Crea y edita el área Comercial (con administradores). Reversible cuando F1C-05 construya cargos.
- **S-3** «Ticket de contrato» se calcula al leer, no se guarda en `tickets`.
- **S-4** «Alta» del maestro ≡ el literal `High` (`transitions.ts:84`, `CreateTicket.tsx:428`). Con contrato vigente el
  servidor pone `High` aunque el cuerpo traiga otra; sin contrato, queda como hoy. Vigente = hoy dentro de
  [inicio, fin], extremos incluidos; la zona horaria la fija el diseño. Se evalúa sobre el cliente ya resuelto (`:89`).
- **S-5** Vencido = fecha de fin anterior a hoy. Se rechaza (no se avisa). Un contrato aún no iniciado no bloquea.
  Una subOV cuyo lote no tiene contrato se consume como hoy.
- **S-6** Ejecutada = ticket con `status = 'Finalizado'`: el único estado sin salida
  (`packages/shared/src/invariantesGrafo.test.ts:65`) y el único cerrado del motor
  (`apps/desk/server/transitionExec.ts:5`). No se usa `status_type = 'Closed'`, que en tickets de Zoho viene de Zoho
  (`packages/zoho-sync/src/db/repo.ts:166`); hipótesis: coinciden.
- **S-7** % ejecutado por trimestre = acumulado a su cierre (ejecutadas hasta el fin del trimestre / creadas). Los
  servicios del trimestre son los que llegaron a `Finalizado` dentro de él.
- **S-8** Ritmo: desde el fin del primer trimestre del contrato, si `ejecutadas + (ejecutadas / días transcurridos) ×
  días restantes < creadas`, un aviso a Comercial por contrato y trimestre. Se evalúa en la pasada periódica del
  servidor (`apps/desk/server/index.ts:85`) o al leer; lo elige el diseño.
- **S-9** El contrato y el ticket pueden tener clientes distintos (mantenedor, IV-8): la prioridad mira el cliente del
  ticket; el «ticket de contrato» mira la subOV. No se añade guarda cliente-contrato.
- **S-10** Sin capacidad nueva. Declarar `contratos` exigiría insertar una entrada en `openspec/config.yaml → capabilities`
  (tras `:312`), a mitad del fichero, y desplazaría **72 de las 103** citas vivas `config.yaml:NNN` (medido el 2026-09-28
  sobre `77b498c`). Los requisitos van a `tickets-core` y `zoho-sync`, que ya existen: `config.yaml` no se toca. Si Gerencia
  quiere la capacidad propia, cuesta ese barrido (regla de mutación 4) y se hace en un cambio documental aparte.

## Tareas de persona (regla del ciclo 1, fuera del recuento)

- **P.1 · Alfonso** (del cambio 2): consulta de formato de subOV. **P.4 · Alfonso** (del cambio 2): literales
  `draft`/`void` de Books; de ellos dependen las «creadas» del % ejecutado.
- **P.5 · Gerencia**: responder E-086 (año y tope de la ampliación). Desbloquea la ampliación y el cierre de la fila.
- **P.6 · Comercial**: tras desplegar, registrar un contrato real y comprobar en la app prioridad, bloqueo y CSV.
- **P.7 · Comercial**: dar de alta los contratos vigentes hoy (dato de producción, sin relleno automático).

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Una capacidad nueva desfasaría 72 citas `config.yaml:NNN` | Evitado | S-10: sin capacidad nueva; `config.yaml` no se toca |
| Un técnico baja la prioridad de un ticket de contrato (`transitions.ts:193`, `:195`) | Media | Declarado; es F1B-07 |
| Contratos vivos sin registrar el día uno: prioridad y bloqueo no actúan | Alta | P.7; el informe lo hace visible |
| La guarda de vencido en posición equivocada pasa en verde | Media | Regla de mutación 1: pruebas de vencido frente a la guarda C anterior y frente al 409 (D); cuarentena y vencido son excluyentes por construcción (`subOV.ts:36`) |
| Tamaño: el cambio 1 estimó ~350 y midió 1.178 (`config.yaml:3128`) | Alta | Seis lotes, cada uno bajo 800 |

## Previsión de tamaño

**~3.300 líneas de apply en seis lotes** (`--no-renames` + nuevo sin trackear; la versión anterior decía ~2.300-2.700 en cuatro, y no caben bajo 800 con pruebas y `apply-progress`). El detalle vive en `design.md` §10.

| Lote | Contenido | Estimación (incl. pruebas y apply-progress ~60) |
|---|---|---|
| 1 · Modelo y vigencia | Tabla, `shared/contratos.ts` (vigencia), acceso a datos | ~590 |
| 2 · Prioridad y guarda | `High` al nacer, guarda C de vencido en las tres puertas y pruebas de posición | ~540 |
| 3 · API y ticket de contrato | Rutas alta/lista/ficha (Comercial), ticket de contrato derivado | ~540 |
| 4 · Informe trimestral | Trimestres, estados de subOV, % ejecutado, servicios, ruta del informe | ~630 |
| 5 · Ritmo y CSV | Aviso de ritmo y neutralización de fórmulas del CSV | ~455 |
| 6 · Interfaz y cierre | Ficha, tabla y CSV, marca en la ficha del ticket, texto para el expediente | ~570 |

Verify y archive son intentos aparte; el archive supera 800 por el `git mv` (regla del ciclo 2).

## Rollback

Revertir los commits del lote. `public.contratos` es nueva y sólo la lee este código; sin filas, prioridad y puertas se
comportan como hoy.

## Criterios de éxito

- [ ] Cliente con contrato vigente → ticket nuevo en `High` aunque el cuerpo traiga `Low`; sin contrato, sin cambio.
- [ ] SubOV de contrato vencido → rechazada en las tres puertas; vencido gana a la guarda C anterior y al 409 (D); cuarentena y vencido son excluyentes por construcción (`subOV.ts:36`).
- [ ] Ticket con subOV de contrato vigente → la ficha lo enseña de contrato; con el contrato vencido, deja de serlo.
- [ ] Lote de 10 subOV con 3 finalizadas y 2 en curso → 30 % ejecutado y `consumido` 50 %, los dos a la vez.
- [ ] Informe por trimestre del contrato, exportable a CSV, con el hueco del informe declarado en la tabla.
- [ ] Ritmo insuficiente → un aviso a Comercial; segunda evaluación del mismo trimestre → cero.
- [ ] `remisiones.test.ts:988` y `ordenVentaUnTicket.test.ts` en verde sin cambios en sus casos existentes.

## Cierre esperado

- `cierra: no`: la ampliación (E-086) sigue fuera. El `archive-report` dice qué parte de la fila cubre.
- `toca_maestro: si`: `R08.2.md:2182` define % ejecutado como «consumidas / creadas», y Gerencia lo definió como
  ejecutadas (ticket finalizado) / creadas (`config.yaml:2457`); `:2185` sigue diciendo que el modelo no tiene dónde
  guardar el fin de contrato. El expediente R08.3 recoge el nº 53 (`docs/sdd/R08.3_Expediente_de_cambios.md:547`) pero
  no la fórmula: se entrega como texto para el expediente, sin tocar el `.docx`.
- Barrido de citas de la regla de mutación 4 sobre `config.yaml`, `schema.sql`, `ticketService.ts` y `remision.ts`.
