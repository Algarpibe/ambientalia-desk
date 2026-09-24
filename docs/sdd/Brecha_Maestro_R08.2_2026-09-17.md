# Qué se nos está escapando respecto del maestro R08.2

**Fecha:** 2026-09-17 · **Contra qué se midió:** maestro R08.2 (Anexo D completo, M1.3.4, M1.6b, glosario), plan `Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` en su estado de hoy (51 tandas en 44 filas, tabla de gates de §4.5 ya sincronizada con el libro R01.3), `openspec/config.yaml` (capacidades, IV-1…IV-12, PF-1), los nueve `openspec/specs/*/spec.md` y los ocho cambios archivados.

**Lo que este documento NO repite.** El `R08.3_Expediente_de_cambios.md` ya cubre, y bien, la dirección repositorio → maestro: as-built que la R08.2 no refleja (C11, C9, F1B-01, F1B-08 parcial, `por-entregar-es-espera` construido y sin desplegar), decisiones de Gerencia que el maestro aún no contiene, erratas de cita, avance con denominador fechado y el versionado del libro. Nada de eso se vuelve a listar aquí. **Este informe va en la dirección contraria —maestro → plan → repositorio— y en los tres sitios donde las tres listas no se reconcilian entre sí.** Esa dirección no la hace ningún documento vivo.

---

## 1 · El resumen, si sólo se leen diez líneas

| # | Hueco | Gravedad | Qué se necesita |
|---|---|---|---|
| 1 | **Servicio en sitio (nº 43): la premisa de que el plan lo contempla es falsa** | Alta — se decidió el 10/09 apoyándose en ella | Decisión de alcance (Alfonso / Gustavo) |
| 2 | **`catalogo-equipos` es capacidad declarada y no tiene ni una fila en el plan** | Alta — 354 equipos ya sembrados, sin dueño | Asignar tanda o declarar que vive dentro de F1D-01 |
| 3 | **F1A-08 está construido y el plan no lo sabe** | Media — el numerador del avance está mal por defecto | Dictamen: ¿`tercera-puerta-orden-venta` **es** F1A-08? |
| 4 | **Dos specs vivas fuera de las dos listas: `citas-verificables` y `vistas-tablero`** | Media — el preflight de cada sesión no las ve | Declararlas en `config.yaml → capabilities` |
| 5 | **Ocho de las quince capacidades no tienen spec** | Media — es deuda conocida, pero sin fecha | Fijar en qué tanda nace cada una |
| 6 | **«Estado de espera»: el código declara dos registros y el maestro sólo uno** | Baja-media — *corregido el 17/09: C3 está bien dimensionado* | Llevarlo a la R08.4 · C7 sigue necesitando su propia lista |
| 7 | **Ocho puntos del Anexo D de Fase 1 sin tanda y sin gate** | Media | Triaje: 3, 7, 9, 43, 47, 53, 56, 61 |
| 8 | **IV-11 puede deshacer en silencio la puerta que se construyó el 16/09** | Alta — es un par, no dos desvíos sueltos | Decidir (a) o (b) de IV-11 antes de dar IV-4 por cerrado en producción |

---

## 2 · Los huecos, uno a uno

### 2.1 · Servicio en sitio — la premisa falsa que sostuvo una decisión

El 10/09, al cerrar «`Habilitar Servicio` nunca sin remisión», la salida que se dio al servicio en sitio fue *«para servicio en sitio creo que en el plan hay descrito la necesidad de crear un nuevo flujo de trabajo para este tipo de servicios»*. **No lo hay.** `grep -ci "en sitio"` sobre el plan devuelve **0**.

Y el maestro dice lo contrario de lo que esa salida supone. M1.6b, nota del revisor [R08]: *«Hoy no está en el alcance y no hay mapeo as-is de él —no se presta formalmente—, así que entra como **línea a explorar, no como flujo a construir**»*. Punto abierto **nº 43**, decide Alfonso / Gustavo.

**Por qué importa y no es una nota de pie.** La guarda de `habilitar-servicio-sin-remision` se aprobó para los **tres** orígenes, sin excepción, porque la excepción —el servicio en sitio, donde no hay equipo que remisionar— se mandó a un flujo que no existe, no está planificado y el maestro deja fuera de alcance. Si llega un servicio en sitio antes de que exista esa cuarta rama, el sistema no tendrá ni la excepción ni el flujo.

**Esto es una premisa falsa en el sentido de `premisas_falsas_corregidas`, y debería registrarse como PF-2**, al lado de PF-1. Con su corrección: *la cuarta rama no está en el plan; hasta que nº 43 se decida, el servicio en sitio no tiene ruta en Desk 2.0 y la guarda de remisión no admite excepción por ese motivo.*

### 2.2 · `catalogo-equipos` — capacidad declarada, cero filas

`openspec/config.yaml` declara `catalogo-equipos` como capacidad propia —«#15 de la lista», **separada de `diagnostico-checklist` por decisión de Gerencia** (obs. #236, F0-00)— y anota que ya está sembrada: 26 tipos, 6 marcas, 35 modelos, **354 equipos**, 0 conflictos.

`grep -ci "catalogo-equipos"` sobre el plan devuelve **0**. No hay tanda, no hay gate, no hay spec.

La confusión es previsible: F1D-01 se llama «Modelo de datos del catálogo», pero su capacidad declarada es `diagnostico-checklist` y el propio `config.yaml` avisa de que el «catálogo» de esa capacidad **se renombró a «árbol de inspección» para no confundirse con éste**. Es decir: el fichero ya previó el error y el plan lo cometió igualmente, por omisión.

Y hay dependencia declarada: `diagnostico-checklist depends_on: [catalogo-equipos]`, porque el árbol se parametriza por marca-modelo. **Toda la épica F1D cuelga de una capacidad que no tiene fila.**

### 2.3 · F1A-08 está hecho, y ni el plan ni el avance lo registran

`openspec/changes/archive/2026-09-17-tercera-puerta-orden-venta/` — `verify_verdict: pass`, 4/4 escenarios, 28/28 tareas, `RQ-RE-16` fusionado en `specs/remisiones/spec.md`, construcción en `79cf09b`. Cierra **IV-4**.

El plan §5 dice: `F1A-08 | IV-4 · Tercera puerta de la asociación OV ↔ ticket | remisiones, tickets-core | S | S38`.

**Es el mismo trabajo, con dos nombres.** El cambio no lleva el ID de la tanda en ninguna parte, así que:

- el §8.1 del R08.3 lo listará como «trabajo fuera del §5 del plan, sin fila propia» —que es lo que se hizo con los otros siete— cuando aquí **sí hay fila propia**;
- el avance sigue en **10 / 51**, cuando debería ser **11 / 51** (peso 19/107 en lugar de 18/107);
- F1A-08 seguirá figurando entre las «nueve tandas sin código».

Esto no lo arreglo yo: es un dictamen de Gerencia sobre si un cambio que hace el contenido de una tanda **cuenta como esa tanda**. Pero si la respuesta es sí —y no veo con qué criterio sería no—, hay que escribirla, porque es el primer caso y va a repetirse: `orden-precedencia-guardas` es F1B-10 con el mismo patrón, y está en curso.

**Regla que propongo, de una línea:** *todo `openspec/changes/<nombre>` que realice el contenido de una fila del §5 escribe el ID de esa tanda en su `proposal.md`; el archivo sin ID es trabajo fuera del denominador.*

### 2.4 · Dos capacidades vivas que ninguna de las dos listas declara

| Spec en disco | ¿En `config.yaml → capabilities`? | ¿En el plan? |
|---|---|---|
| `openspec/specs/citas-verificables/spec.md` | **No** | **No** |
| `openspec/specs/vistas-tablero/spec.md` | **No** | **No** |

`citas-verificables` no es un detalle: tiene spec propia, **tres cambios archivados** (`hook-citas-pre-push` 15/09, `detector-citas-extremos` 16/09, más la reparación de la línea base), un incumplimiento vivo propio (**IV-10**, `apps/desk/server/citas/lineaBase.jsonl`), un documento de triaje de 63 KB y un hallazgo estructural registrado (el falso verde de las seis exclusiones del detector). Es una capacidad de pleno derecho que nació en la semana del 15/09 y **no está declarada en ningún inventario de capacidades**.

`vistas-tablero` salió de F1B-08 y está en el mismo sitio.

**El efecto concreto:** `session_preflight` y el `context` de `config.yaml` son lo que cada sesión y cada sub-agente cargan como verdad del proyecto. Una capacidad que no está en `capabilities` no se carga, no se cita y no se hereda. Es el mismo modo de fallo que la regla de barrido de CLAUDE.md describe para los destinos huérfanos, aplicado a las capacidades en lugar de a los desvíos.

### 2.5 · Ocho de quince capacidades sin spec

`config.yaml` declara quince capacidades. Hay nueve ficheros `spec.md`, y dos de ellos no están declarados (§2.4). Sin spec:

| Capacidad | Tanda que la escribiría | Semana |
|---|---|---|
| `transitions-equipo-nuevo` | F1B-06 | S42 |
| `transitions-soporte-remoto` | F1B-06 | S42 |
| `hojas-vida` | F1B-02 | S39 |
| `catalogo-equipos` | **ninguna** (§2.2) | — |
| `diagnostico-checklist` | F1D-01 | S42 |
| `informes` | F1E-01 | S46 |
| `inventario-lectura` | F1D-06 | S46 |
| `kpis` | **ninguna en Fase 1** — `config.yaml` la declara «fase 2»; F1A-04 sólo adelantó la pieza de dominio de C9 | — |

No es un hueco de planificación —siete de las ocho tienen tanda—, pero sí un dato que no está publicado en ningún sitio: **a día de hoy el proyecto tiene spec de menos de la mitad de lo que declara**, y las dos sin tanda son precisamente la base de F1D (`catalogo-equipos`) y la de todo el eje ② (`kpis`).

### 2.6 · «Estado de espera»: el código lo resolvió, el maestro no se ha enterado

> **⚠️ Apartado corregido el 17/09 tras medirlo contra `packages/shared/src/estados.ts`.** La primera versión afirmaba que los dos criterios llevaban el mismo nombre y que «nadie lo ha escrito». **Es falso, y quien lo desmiente es el código.** Se conserva la corrección a la vista, no se reescribe en silencio.

| Fuente | Qué declara |
|---|---|
| Maestro M1.3.4 y glosario del Anexo E | «Estado de espera … **Hay cuatro**» — un solo concepto, cuatro miembros |
| `packages/shared/src/estados.ts` | **Dos registros distintos**: `ESTADOS_EN_ESPERA` (**once**: 5 externa + 6 interna) y `ESTADOS_SIN_SALIDA` (**los cuatro** de M1.3.4) |

`estados.ts` declara los cuatro `sin_salida` por separado, escribe el discriminador —*«el suceso del que depende la única salida ocurre FUERA de la aplicación —una entrega física, un retorno de laboratorio, un alta en otro sistema—, frente a un acto que alguien realiza DENTRO de la aplicación»*— y razona por qué `Liberación Comercial` y `Remisión creada` **no** entran pese a tener salida única: sus salidas son un botón que alguien pulsa, no un camión que llega. Incluso deja la lección de método: «salida única» no es proxy de nada —hay **doce** estados con una sola transición de salida, entre ellos `Ingresado` y `Ticket creado`—, y por eso `estados.test.ts` comprueba que los cuatro son estados **declarados** en vez de intentar derivarlos.

**Lo que sí queda abierto, que es menos de lo que este informe afirmaba y distinto:**

- **El maestro es el que va por detrás.** Su glosario define «estado de espera» como los cuatro, cuando el código tiene once bajo ese nombre y cuatro bajo otro. Es material de **clase A para la R08.4** —as-built que el maestro no refleja—, no un hueco de planificación.
- **C3 / nº 31 está bien dimensionado.** Se refiere a los cuatro `sin_salida`, y ésos son exactamente los cuatro del registro. **Retiro la advertencia sobre F1C-03**: la sesión del 18/09 puede llevarlo como «los cuatro» sin riesgo.
- **C7 sigue necesitando su propia lista, y el código lo dice con todas las letras.** El comentario de `ESTADOS_EN_ESPERA` avisa: *«Es la lista de la VISTA. El reloj del SLA no la lee — para en los tres bodegajes de M1.10, que son periodos entre fechas»*. `decision/c7-reloj-sla` (F1C-06, 25/09) no puede limitarse a adoptar ninguno de los dos registros: tiene que decidir el suyo. Y `SLA_HORAS_POR_ESTADO` (`sla.ts:32`) sigue con **una sola entrada**, la de C11.
- **`Pendiente` es el único de los 21 estados sin clase.** `estados.ts` lo deja bajo «sin clasificar (1)», esperando a Servicio Técnico desde el 11/09 — la misma sesión de la que el R08.3 §B.3 dice que no hay evidencia de que se celebrara.

**Lo que esto enseña sobre el propio mecanismo.** El error de la primera versión salió de leer `openspec/config.yaml` en vez del código, y es exactamente el modo de fallo que el propio fichero declara de sí mismo: *«este fichero PUEDE ESTAR CADUCO; antes de citarlo como autoridad sobre el estado del código, hay que comprobarlo contra el código»*. Va anotado: la comprobación de cifras ancladas del barrido **lee `packages/shared`**, no la documentación.

*(La otra discrepancia de conteo conocida —38 pasos del mapa frente a 36 del código— **no** es un hueco: la R08.2 ya la marca en revisión, con hipótesis escrita, y la cierra F1A-06 al generar el mapa desde `transitions.ts`. Se menciona sólo para que no se cuente dos veces.)*

### 2.7 · Puntos del Anexo D de Fase 1 sin tanda y sin gate

Barrido de los 62 puntos existentes (19 y 22 no existen) contra todas las menciones `P<n>` / `nº <n>` del plan. Descontando los resueltos y los que pertenecen a módulos de Fase 2 y posteriores —que por la regla (c) de `unidad_de_avance` **no deben** tener tanda—, quedan **ocho** que sí tocan Fase 1 y no aparecen:

| Nº | Punto | Módulo | Dónde debería enganchar | Quién decide |
|---|---|---|---|---|
| **3** | Plazo exacto de la alerta de no-aprobación del cliente: ¿24 o 48 h? | M4 | Misma familia que C11 y que la alarma de 72 h de `Remisión creada`; las tres viven en `SLA_HORAS_POR_ESTADO`, que hoy tiene **una** entrada | Alfonso / Comercial |
| **7** | Gestión de garantía **con el proveedor**, hoy fuera del sistema | M1 / M3 | Contiguo a lo decidido el 10/09 (OVI de garantía, F1B-03), y no es lo mismo: aquello es la salida de stock, esto es la reclamación al fabricante | Gustavo |
| **9** | Comentarios predeterminados por etapa **o** textos dinámicos con consulta a la KB | M2 | F1D-04 (captura por visita) escribe comentarios; el punto decide con qué | Gustavo |
| **43** | Servicio en sitio como cuarta rama | M1.6b | §2.1 de este informe | Alfonso / Gustavo |
| **47** | Qué repuestos se adelantan al diagnóstico y cuáles esperan a la OC (riesgo del 10 % de cotizaciones no aprobadas) | M5.1 | **F1D-06** (repuestos por etapa, S46) construye la mecánica; este punto fija el criterio | Comercial / Compras |
| **53** | Cómo identifica el sistema que un ticket **pertenece a un contrato**, cómo se refleja en la prioridad, y cómo las subórdenes alimentan el **informe trimestral de avance** | M4.4 · M1.9.1 | **Medio cubierto:** F1B-11 lleva `vigencia-contrato`, que sólo resuelve si una subOV de contrato vencido se consume. La identificación del contrato, la prioridad y el informe trimestral no están: `grep -ci "trimestr"` sobre el plan = **0**. Y la convención `OV-AAAA-NNN-SS` decidida el 10/09 **es** el mecanismo que este punto dice que alimenta el informe — nadie ha unido las dos cosas | Comercial / Gustavo |
| **56** | Norma de taxonomía de fallas (ISO 14224) | M2.4 | **F1D-07** (formulario de falla nueva, S47) necesita la taxonomía para existir; `grep -c "14224"` sobre el plan = **0** | Gustavo |
| **61** | Mecanismo de incorporación de actas al maestro: quién avisa, con qué cadencia, contra qué fuente se comprueba que no falta ninguna | §1.11 | **Este punto ya se cobró una pieza:** el R08.3 §B.3 registra que de la sesión del 11/09 «no hay evidencia de que se celebrara», y sus siete gates siguen pendientes. Eso es exactamente el fallo que nº 61 describe, ocurriendo | Alfonso |

Los demás sin tanda —5, 11, 13, 16, 17, 18, 20, 23, 24, 25, 26, 28, 29, 30, 48, 49, 50, 51, 57, 58, 63— pertenecen a M6, M7, M8, M9, M10 y M12 o son documentales, y **su ausencia del plan es correcta**. Dos merecen una línea aun así: el **57** (seguridad del portal, «hoy sin dueño y **condicionante de la puesta en producción**») porque su condicionalidad es de Fase 1 aunque su módulo no lo sea; y el **42**, que queda cubierto por contenido en el gate `flujos-comercial-posible-cliente` (F1B-06) pero no por nombre, y conviene anotarlo ahí para que no se pierda.

### 2.8 · Los cinco incumplimientos vivos, y el par que nadie ha emparejado

| IV | Estado | Destino | Qué le falta |
|---|---|---|---|
| **IV-2** | vivo | «Punto abierto para Gerencia — sin tanda, y a propósito» | **Ya no es cierto que no tenga tanda:** se decidió el 10/09 (opción a) y el plan lo rutea a **F1A-07** con clave `iv2-fechas-derivadas`. `config.yaml` sigue diciendo que no tiene destino. Corregir el registro |
| **IV-8** | vivo | sin destino, a propósito | Espera `decision/titularidad-ov-equipo` (F1B-11, sesión 11/09 — que no consta celebrada) |
| **IV-9** | vivo | sin destino, a propósito | Dos predicados de color con variantes distintas (`/espera/i` y `/espera|hold/i`). El arreglo correcto es «una sola fuente de color, `TicketCard.tsx:14`», y no admite rojo previo porque `.tsx` está fuera de la red de pruebas por decisión de F0-00 |
| **IV-11** | vivo | sin destino, a propósito | Ver abajo |
| **IV-12** | vivo | sin destino, a propósito | Dos incumplimientos observables del orden de precedencia en el alta de remisión. Lo declara F1B-10, que no lo toca |

**El par IV-4 / IV-11, que es lo que de verdad está escapándose.** El 16/09 se construyó la tercera puerta: la remisión de entrada ya no puede escribir una OV que pertenece a otro ticket. Y el 16/09 la exploración de esa misma tanda encontró **IV-11**: `upsertTicket` reescribe `orden_venta` y `fecha_orden_venta` porque están en `TICKET_COLS`, pero **no** `salesorder_id`, que entró después por `ALTER`. El `UPDATE` de la remisión no pone `managed_by_app = true`. El sync pasa cada 180 s.

Consecuencia en una frase: **la puerta impide crear el duplicado, y el sync puede crear el estado inconsistente igualmente**, dejando `orden_venta` vacía y `salesorder_id` viva. Y entonces la **puerta 2** —que comprueba sólo por número (`ticketService.ts:134`)— tampoco encuentra ese ticket.

La medición de Gerencia del 16/09 —divergencia 0 sobre población 1— va con su advertencia pegada en el propio fichero, y hace bien: con población 1 un duplicado es aritméticamente imposible. **Ese 0 no dice nada.**

Las dos salidas están escritas en `config.yaml` y no son equivalentes: (a) que el escritor de la remisión ponga `managed_by_app = true` —conserva la orden, pero saca ese ticket del sync para **todas** sus columnas—; (b) que `salesorder_id` entre en `TICKET_COLS` —deja la fila coherente, a cambio de perder el id en cada pasada—. **Es decisión de alcance, no técnica, y debería tomarse antes de dar IV-4 por cerrado en producción, no después.** Hoy IV-4 figura CERRADO y IV-11 SIN DESTINO, en el mismo fichero, sin que nada los una.

---

## 3 · Lo que hay que hacer, en orden

**Esta semana, antes de la sesión del 18/09:**

1. ~~Recontar los estados de espera~~ — **hecho el 17/09 contra `estados.ts`, y el resultado retira la alarma**: `ESTADOS_SIN_SALIDA` ya declara exactamente los cuatro de C3, así que F1C-03 puede ir a la sesión del 18/09 tal cual. Lo que queda es de otra índole: `decision/c7-reloj-sla` (F1C-06, 25/09) no puede adoptar ninguno de los dos registros y tiene que decidir el suyo (§2.6).
2. **Decidir el par IV-4 / IV-11** (§2.8), opción (a) o (b). La puerta recién construida depende de ello.
3. **Dictaminar si `tercera-puerta-orden-venta` es F1A-08** (§2.3) y escribir la regla del ID de tanda en el `proposal.md`. Si es que sí, el avance pasa a 11/51.

**Correcciones de registro, sin decisión de por medio:**

4. Declarar `citas-verificables` y `vistas-tablero` en `config.yaml → capabilities` (§2.4).
5. Corregir el `destino` de **IV-2**, que sigue diciendo «sin tanda» cuando el plan lo rutea a F1A-07 (§2.8).
6. Registrar **PF-2** —la cuarta rama del blueprint no está en el plan— junto a PF-1 (§2.1).

**Decisiones de Gerencia a fechar:**

7. **Nº 43**, servicio en sitio: dentro o fuera del alcance de 2026. Si es dentro, el maestro exige levantar el as-is primero, y eso es una tanda de campo que hoy no existe.
8. **`catalogo-equipos`**: tanda propia o absorción declarada por F1D-01 (§2.2). No puede quedar como está, con 354 equipos sembrados y sin dueño.
9. **Triaje de los ocho puntos** de §2.7: cuáles entran en Fase 1 con tanda, cuáles se declaran Fase 2 por escrito. Los tres con fecha de vencimiento cercana son el **56** (bloquea F1D-07, S47), el **47** (bloquea el criterio de F1D-06, S46) y el **53** (el informe trimestral cuelga de la convención de subOV ya decidida).
10. **Nº 61**, mecanismo de incorporación de actas. Es el punto que habría cazado la sesión del 11/09 que no consta.

---

## 4 · Nota de método

Las cifras de este informe son comprobables con un comando cada una: `grep -ci "en sitio"` y `grep -ci "catalogo-equipos"` sobre el plan devuelven 0; `grep -c "14224"` y `grep -ci "trimestr"` devuelven 0; el cruce de `openspec/specs/*/spec.md` contra `config.yaml → capabilities` da 9 ficheros frente a 15 nombres, con 2 ficheros fuera de la lista; el barrido de puntos del Anexo D contra el plan se hizo sobre todas las apariciones de `P<n>` y `nº <n>`.

Las tres cosas que este informe **no** afirma, y conviene que se vean: que los siete estados de espera extra carezcan de salida —no se ha comprobado, sólo se ha comprobado que nadie lo ha comprobado—; que IV-11 haya ocurrido en producción —la medición del 16/09 tiene población 1 y no dice nada—; y que la lista de §2.7 esté completa en su clasificación por fase, que es un triaje y lo firma quien decide el alcance, no quien lo barre.
