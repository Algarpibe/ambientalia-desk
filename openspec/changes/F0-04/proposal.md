# F0-04 · Base técnica: red de seguridad del motor, staging y puertas de CI

| Dato | Valor |
|---|---|
| Fase | Fase 0 — Cimientos SDD |
| Estado | **Propuesta — pendiente de visto bueno** |
| Base | commit `a3a8f03` |
| Entradas | `F0-00_Baseline_as-built.md` · `F0-00_Correcciones_desde_Maestro_R08.1.md` · `F0-00_Respuestas_Gerencia_R03.md` |
| Depende de | F0-00 (hecha). No depende de F0-01 |
| Habilita | F1A-01 · F1B-06 · F1C-02 · **F1C-04 (C7)** · **F1C-05** · **F1C-06** · **F1A-04→F1C (C9)** · spec `kpis` |
| Talla / semana | M · S38 (plan R01.1 §5) |
| Modo | `strict_tdd` |

---

## Por qué

La frase del plan —«F0-04 no crea la red de pruebas: la mide y la completa donde falta»— **es falsa en su premisa**. El motor y los permisos ya tienen 34 pruebas entre unidad y HTTP, con 400 por transición desconocida, 409 por estado de origen equivocado, 422 por obligatorio ausente y 403/200 por área. Lo que falta no es existencia: es **exhaustividad**, y una tabla que hoy no existe.

Cinco tandas de la Fase 1 tocan el fichero más sensible del proyecto sin red debajo:

- **F1A-01** arregla C1 y no hay ninguna prueba que ejercite el camino del checkbox obligatorio.
- **F1B-06** añade dos grafos y **puede romper el de servicio técnico sin que nada dé rojo**.
- **F1C-02** rediseña C4 sobre nueve casos reentrantes, no uno.
- **F1C-05** cambia `permissions.ts` —siete líneas— sin batería de regresión por área.
- **C9 y C7** dependen de una enumeración que nadie ha hecho (§3).

Esta tanda pone esa red y produce esa tabla. **No cambia comportamiento.**

> **Corrección retirada.** Una versión anterior de este proposal advertía de que el invariante numérico nacería roto porque las macro-fases de diagnóstico variarían por modelo. **Es falso.** M2.1, «arquitectura híbrida» `[DECIDIDO 27/08]`: las macro-fases son transición de estado y **no varían por marca-modelo**; lo que varía es el contenido del checklist, que es dato de configuración. *«El flujo no se rediseña: se parametriza.»* El grafo crece en cantidad acotada e independiente del modelo.

---

## 1 · Registro de estados, con prueba de coherencia

Hoy **no existe**: los 21 estados se derivan de los strings `from`/`to` de las 34 transiciones, y sólo tres tienen constante (`transitions.ts:142-144`).

### 1.1 · Tres criterios distintos, y se nombran distinto

Es la corrección más importante que trae la R03. Tres fuentes usan «espera» con tres sentidos, y mezclarlos en una spec habría metido la misma palabra significando lo contrario en dos párrafos:

| Nombre en la spec | Criterio | Fuente | Alcance |
|---|---|---|---|
| `sin_salida` | *«Su única transición de salida depende de algo que la aplicación no controla»* | M1.3.4 | **4 estados**. Excluye a propósito `Notificación cliente`, que sí tiene salida de escape |
| `en_espera` | El ticket está parado esperando el acto de un tercero y el área dueña no puede hacer nada por su cuenta | Vista del tablero | **8 estados** |
| `bodegaje` | *«El tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente — tiempo que no depende de nosotros»* | M1.10 `[DEFINIDO — R08]` | **3 periodos entre fechas**, no estados |

### 1.2 · La clasificación `en_espera`, para la vista

| Valor | Estados |
|---|---|
| **externa** (3) | `En Espera de Repuestos` · `Servicio externo` · `Notificación cliente` |
| **interna** (5) | `Notificación a Compras` · `Notificación Comercial` · `En espera de SKU inventario` · `Solicitado` · `Liberación Comercial` |
| **ninguna** (12) | `Ingresado` · `Rev./Diagnostico` · `Notificado` · `En Proceso` · `Continuación del proceso` · `Por Facturar` · `Por Entregar` · `Por Entregar / Sin facturar` · `Finalizado` · `OV asignada` · `Ticket creado` · `Remisión creada` |
| **sin clasificar** (1) | `Pendiente` — pendiente de Servicio Técnico (11/09) |

3 + 5 + 12 + 1 = 21. `Liberación Comercial` entra por evidencia del propio maestro: el Anexo B.1 la lista bajo Comercial, y entra por `facturado` y sale por `habilitado_para_entrega`, ambas de Comercial — Servicio Técnico no puede moverla.

**El discriminador va escrito en la spec, no sólo la lista**, para que el próximo estado se clasifique solo y no haya que discutirlo estado a estado.

**Y la regla que separa vista de reloj, explícita o F1C-06 la pierde:** la vista muestra las ocho; el reloj del SLA **no lee esta clasificación**. Para en los tres bodegajes de M1.10, que son periodos entre fechas.

### 1.3 · La condición innegociable

Una prueba comprueba que el conjunto de estados **derivado** de los `from`/`to` es idéntico al **declarado**. Sin ella se cambia una regex frágil por una lista frágil, que es peor porque parece rigurosa. `sin clasificar` es valor válido.

---

## 2 · Invariantes del grafo

Ninguno existe. `transitions.test.ts:25-27` es lo más cercano y **prueba el caso equivocado**.

| Invariante | Qué atrapa |
|---|---|
| Estados declarados == derivados | Un estado nuevo sin clasificar, un `to` mal escrito |
| 34 transiciones · 21 estados | Una transición perdida al editar el array |
| `Finalizado` es el único sin salida | Un callejón introducido por descuido |
| Ninguna transición apunta a estado no declarado | Un typo en un `to` |
| **El conjunto de las 8 compartidas, emparejado id → área** | Fija M1.9.1 (diez → ocho) de forma no repetible |
| La lista de campos de fecha reentrantes no crece sin declararlo | Ver §3 |
| **El conjunto de salientes HTTP no-GET** | Convierte la regla invariable 6 en prueba (ver §6) |

**Tres precisiones sobre cómo se escriben**, o el invariante vale la mitad:

1. **Afirmar el conjunto, no el número.** «Exactamente 8» pasa igual si alguien cambia `rechazo_cliente` de `Comercial / Servicio Técnico` a `Comercial / Compras`: siguen siendo ocho, con otro significado, y la matriz de F1C-05 se construye mal. Se afirman los ocho ids con su área.
2. **Afirmar sobre `TRANSITIONS`, no sobre `TRANSICIONES_BASE`.** `TRANSITIONS = TRANSICIONES_BASE.map(...)` (`:288-291`) y es lo que consumen `transitionsForStatus` y `transitionById` (`:293-300`), o sea lo que ejecuta el servidor. Hoy son idénticas; el comentario de `:286` **ya contempla que ese `map` lleve algún día un `Set` de excepciones**, luego la divergencia no es hipotética.
3. **Excluir explícitamente, con su motivo escrito, las dos sin botón.** `TRANSICION_REMISION_CONFIRMADA` y `TRANSICION_REMISION_RETIRADA` (`:150-151`) tienen `area` pero **no tienen `from` ni `to`**. Ambas son `Servicio Técnico`, luego no mueven el ocho.

---

## 3 · La tabla de reentrancia — **el entregable nuevo**

Es la entrada de F1C-02, F1C-06, C9 y la spec `kpis`. Tres columnas: **ciclos del grafo × campos de fecha escritos dentro × indicadores de G.6 que los consumen.**

### 3.1 · Lo ya calculado (Tarjan sobre `transitions.ts`, reproducible)

| Componente | Estados | Transiciones reentrantes con fecha |
|---|---|---|
| **C1** — ciclo de facturación | `Por Facturar` ⇄ `Por Entregar / Sin facturar` | 1 |
| **C2** — diagnóstico / cotización / repuestos / servicio externo | 9 estados | **8** |
| **C3** — devolución a corrección | `Notificado` ⇄ `Rev./Diagnostico` | 0 |

Diez campos de fecha, **ocho obligatorios** (`cfDate` es `required = true` por defecto, `:74`). En un obligatorio la segunda pasada no *puede* pisar: **pisa siempre**.

### 3.2 · Lo que rompe, cruzado con G.6

| Col. | Indicador | Campos reentrantes que usa | ¿En alcance de C4 o C9? |
|---|---|---|---|
| 47 | Tiempo permanencia | `Fecha Remisión de Salida` | Sí, C4 |
| 48 · 49 · 56 | Inicio de servicio · diagnóstico · bodegaje de ingreso | — (rotos por creación anticipada) | Sí, C9 |
| **50 · 53** | Tiempo de servicio | `Fecha Orden De Venta` · `Fecha Recepción de repuestos` | **No** |
| **57** | Tiempo de cotización | `Fecha de Cotización` | **No** |
| **58** | Tiempo de orden de compra | `Fecha Orden de Compra` · `Fecha de Cotización` | **No** |

G.8 limita C4 a una fila y C9 a tres columnas. **Cuatro indicadores más están rotos y no tienen dueño.**

Los peores no eran los conocidos: `notif_cliente_comercial` y `notif_cliente_sku` escriben ambos «Fecha de Cotización» y ambos aterrizan en `Notificación cliente`, luego **una recotización borra la fecha de la primera cotización**.

### 3.3 · Y un defecto que no es sobreescritura

La columna 58 **es el bodegaje de proceso** (M1.10) y se calcula sobre `fecha_orden_compra`. La rama sin repuestos (`aprobacion`) escribe `Fecha Orden de Compra **Final**` y deja la 42 vacía:

> **El bodegaje de proceso no es calculable para ningún ticket aprobado sin repuestos.** No se pisa el valor: se escribe en la columna equivocada.

### 3.4 · Lo que salva el caso, y por qué esto no es diseño

`ticket_transitions.values` es `jsonb` y guarda **todos** los valores de cada transición (`schema.sql:57-61`, `repo.ts:283-286`). No se pierde ningún dato: **las columnas guardan el último valor; el historial guarda todos.**

P34 ya nombra la solución —*«campo nuevo que no se sobreescriba, o evento en el historial»*— y la segunda escala a los diez campos sin añadir diez columnas. Es además la propuesta de Gerencia para C7: en el as-built toda pausa es un estado pleno, luego **el periodo queda delimitado por dos filas de `ticket_transitions`**, y calcular los bodegajes sobre ese registro *append-only* implementa M1.10 al pie de la letra y arregla la reentrancia en el mismo movimiento.

**Esta tanda no diseña nada de eso.** Produce la tabla y la deja como prueba permanente, para que un ciclo nuevo introducido por F1B-06 aparezca en rojo.

---

## 4 · Matriz área × transición completa (las 34), en servidor

`permissions.test.ts:13-26` tiene cuatro casos sintéticos; `app.test.ts:1806,1813` prueba una sola transición real; `auth/middleware.ts:14-35` no se importa en ningún test.

Para cada una de las 34, un usuario de cada área, contra `ticketService.ts:89` —que lanza `HttpError(403)`—. Más pruebas directas de `requireAuth`, `requireAdmin` y `requireArea`.

**Efecto de segundo orden:** con esta matriz probada, `TransitionPanel.tsx:56-57` deja de ser un espejo sin comprobar y pasa a ser comodidad legítima bajo la regla invariable 13. **Antes de esta tanda, no.**

---

## 5 · Cubrir las 22 transiciones huérfanas

Por consecuencia:

1. **Las cuatro salidas únicas de los estados de espera** — gate de F1C-03, las cuatro huérfanas.
2. **Las dos ramas del ciclo de facturación** — gate de F1C-02.
3. **Prueba en rojo de C1.** `transitionExec.ts:63-70` hace `continue` en la rama del checkbox antes del chequeo de obligatorio; `transitionExec.test.ts:82-86` usa un campo de texto. El único checkbox `required: true` es `:247`. **Sin ella F1A-01 no puede arrancar.**
4. Las 16 restantes.

---

## 6 · Puertas de CI, con criterio de trinquete

Nunca peor que hoy. Un umbral por encima del estado actual falla el primer día y acaba desactivado.

- **Lint:** `--max-warnings 158` en `ci.yml:27`, que hoy corre `eslint .` sin techo. Congela, no exige. *No es control de calidad: es un tope de crecimiento* — 158 es un total global, así que una tanda que arregle diez avisos e introduzca diez lo deja igual.
- **Cobertura:** instalar `@vitest/coverage-v8`, medir y publicar. Umbral **sólo** sobre `packages/shared` y `apps/desk/server`, en **lo medido menos un margen pequeño** —sin margen, un refactor que borre código bien cubierto rompe el CI sin que nada haya empeorado—. Excluir `**/*.tsx` del denominador; **no** excluir `apps/desk/src/lib/*.ts` ni `board.ts`, que son lógica de dominio y están probados.

  Y **junto al umbral, escrito, qué no puede ver:** `permissions.ts` son 7 líneas y ya están al 100 % con los cuatro casos actuales; `transitions.ts` son 327 de las que 86 son el array de datos, «cubierto» por cualquier test que lo importe. **Todo lo que esta tanda añade suma cero puntos de cobertura.** El hueco de este repositorio no son líneas sin ejecutar: son casos sin nombrar.

- **Invariantes del grafo** (§2). Valen más que las dos anteriores.
- **Superficie saliente**, que convierte la regla invariable 6 en prueba. El conjunto de llamadas HTTP no-GET en código de producción debe ser exactamente seis, etiquetadas: `tokenManager.ts:25` · `booksClient.ts:32` · `crmClient.ts:13` (OAuth) · `avisosWebhook.ts:81` · `remisionWebhook.ts:84` (n8n) · `tickets.ts:204` (reply Zoho, gateado). Verificado completo para **todos** los verbos, no sólo POST.

---

## 7 · Partir `apps/desk/server/app.test.ts`

3.010 líneas, 185 tests, **36,4 s de los 40,4 s** de la suite; sin él, 11,4 s (medido). Se parte por dominio: tickets, remisiones, catálogo, admin, auth. **Va antes de añadirle pruebas nuevas**: con el ciclo focalizado del motor en 792 ms `strict_tdd` es cómodo; con 40 s se acaba saltando, y la disciplina pasa a ser nominal.

---

## 8 · Staging y rotación coordinada de secretos

Staging sobre la VPS Hostinger con PostgreSQL propio (fila F0-04 del plan). Es lo que hace de esta tanda el momento de la rotación coordinada: ya se toca la superficie de credenciales.

**La lista se deriva de `config.ts`, no de la prosa de `debt.md`** — que tenía doce y le faltaban tres. Aquí va sólo lo coordinado; la parte barata es de esta semana (runbook §2.2):

- [ ] `ZOHO_CLIENT_SECRET` + los tres refresh tokens. **Operación atómica**: rotar el secret invalida los tokens.
- [ ] Los tres passwords de BD.
- [ ] **`hub_reader` — después del bloque 1 del runbook.** Si es el usuario con el que la suscripción conecta al hub, rotarlo sin `ALTER SUBSCRIPTION … CONNECTION` **rompe la replicación**.

---

## 9 · Pruebas que faltan por fichero

- `estadoPorRemision.ts` no tiene fichero de prueba. **La regla invariable 7** (`:41`, las dos entradas no se cruzan) no tiene ninguna que la nombre.
- `ticketService.ts` — `executeTransition` y `createManagedTicket` sólo se prueban por HTTP.
- Guard anti-drift `DESK_TABLES` ↔ `schema.sql`: no existe.
- Traza en las 34: `app.test.ts:1793` la verifica en una sola. M1.10 `[DECIDIDO — R08]` la exige *«sin excepciones»*.
- **La regla «una OV, un ticket» en sus tres puertas.** Se comprueba en `ticketService.ts:45-49` y `:99-102`, y **no** en `remision.ts:188-196`. La prueba nombra las tres; el arreglo es F1A, tras la consulta 4.1 del runbook.

---

## 10 · Orden de ejecución

1. Partir `app.test.ts` (§7) — antes de añadir nada
2. Registro de estados + prueba de coherencia (§1)
3. Invariantes del grafo (§2) — necesita el registro
4. **Tabla de reentrancia (§3)** — desbloquea C9, C7 y F1C-02
5. Matriz área × transición (§4)
6. Prueba en rojo de C1 y las 22 huérfanas (§5)
7. Pruebas por fichero (§9)
8. Puertas de CI (§6) — al final, cuando hay qué medir
9. Staging y rotación (§8) — en paralelo, no bloquean

---

## 11 · Criterio de hecho

1. Estados declarados == derivados, con prueba, y los tres criterios nombrados distinto en la spec.
2. Los siete invariantes en verde, afirmando conjuntos y sobre `TRANSITIONS`.
3. **La tabla de reentrancia existe**, reporta los nueve casos y los cinco indicadores afectados, y un caso nuevo da rojo.
4. Las 34 transiciones tienen fila en la matriz área × transición contra el servidor.
5. Existe una prueba **en rojo** que documenta C1, lista para que F1A-01 la ponga en verde.
6. Las 22 huérfanas bajan a cero.
7. `app.test.ts` partido; el ciclo focalizado del motor sigue por debajo de 1 s.
8. CI con `--max-warnings 158`, cobertura publicada con su umbral y su nota de qué no ve, invariantes y superficie saliente.
9. Staging levantado; los secretos coordinados rotados.

## 12 · Qué NO hace

**Ningún cambio de comportamiento del motor.** C1, C4 y C3 se **prueban tal como están**; arreglarlos es F1A-01, F1C-02 y F1C-03. No se diseña C7 ni C9 — se produce su dato de entrada. No se instala `jsdom` ni `@testing-library` (respuesta 3; se revisa antes de F1D-04). No se corrige `boardView.ts:35` ni la tercera puerta de la OV: eso es F1A, consumiendo lo que esta tanda deja.

## 13 · Riesgos

| Riesgo | Mitigación |
|---|---|
| Partir `app.test.ts` rompe pruebas por dependencias ocultas entre tests | Va primero, con la suite en verde antes y después, sin tocar el contenido de ningún test |
| La prueba en rojo de C1 contamina el CI | Se marca como fallo esperado y documentado hasta F1A-01; el criterio de hecho lo exige explícito |
| El umbral de cobertura se fija alto y bloquea F1A | Lo medido menos margen, nunca una aspiración |
| Clasificar `Pendiente` sin Servicio Técnico | `sin clasificar` es valor válido en la prueba de coherencia |
| La tabla de reentrancia se lee como diseño de C4 | §3 dice explícitamente que esta tanda no diseña; el diseño es F1C-02 desde M1.3.5 y P34 |
