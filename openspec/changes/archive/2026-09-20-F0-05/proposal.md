---
tanda: F0-05
motivo: ""
capacidad: [citas-verificables, reconciliacion]
maestro: []
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `F0-05` · Mecanismo de reconciliación y bandeja de entrada

> **Esta cabecera es la primera del repositorio, y es deliberada.** F0-05 escribe la regla R-1;
> estrenarla en su propio `proposal.md` es la única forma de que la regla no nazca con una
> excepción. Sus siete valores están justificados uno a uno en §9, y es la **única** de las trece
> que puede llevar `origen_cabecera: declarada` con verdad: la escribe quien hace el trabajo.

| Dato | Valor |
|---|---|
| Fase | Fase 0 — Cimientos SDD. Tanda de **método**, no de producto, como F0-01 a F0-04 |
| Base | commit `ce93480`, rama `main`, árbol principal. **Remedido:** la redacción empezó sobre `fadcf1c`; `ce93480` aplicó la precondición documental del §8 mientras se escribía |
| Entradas | `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md` (el encargo: 3 piezas, 9 tareas) · `docs/sdd/F0-05_Bloques_para_ClaudeCode.md` (paso 0: el reparto) · `docs/sdd/Brecha_Maestro_R08.2_2026-09-17.md` · `docs/sdd/ENTRADA.md` (E-001, E-002, E-012) |
| Decisión que lo abre | `decision/tanda-por-contenido` — Gerencia, 2026-09-17 (`docs/sdd/ENTRADA.md:24`, E-001, **CERRADA**). Cargada en Engram: **obs. #737** |
| Decisión que fija el alcance | **TRECE cabeceras** con campos derivados y declarados — Gerencia, 2026-09-17, **obs. #740** |
| Depende de | `hook-citas-pre-push` (archivada el 15/09): deja el hook instalado y la capacidad `citas-verificables` declarada |
| Habilita | Que el desvío entre código, plan y maestro se **vea** sin que nadie tenga que recordarlo |
| Talla / semana | **S** propuesta por el encargo · S38 |
| Modo | `strict_tdd` |
| Preflight | **Leído de fichero**, `openspec/config.yaml:22-30`: `interactive · hybrid · ask-on-risk · 800 líneas · strict_tdd: true` |

**Las citas `ruta:línea` de este documento se leen contra `ce93480`** — pero eso es una declaración
para el lector humano y **NO ancla nada a efectos del hook**, y conviene decirlo aquí porque este
documento acaba de tropezar con ello. El detector sólo reconoce el ancla **pegada a su cita, en la
misma línea física** (constante `REVISION_RE` de `apps/desk/server/citas/cosecha.ts:63` en `ce93480`);
una declaración de cabecera como ésta es exactamente el `hallazgo_ancla_de_cabecera` que costó 15
bloqueantes en F1B-10. **Las dos delta specs de esta tanda sí llevan ancla inline en cada cita, las 24;
este proposal no.**

**Y el hallazgo es PEOR de lo que registra `hallazgo_ancla_de_cabecera`, que es la razón de que
quede escrito aquí como REGLA y no como incidencia.** Lo registrado es que una declaración de
cabecera no ancla. Lo que esta tanda ha MEDIDO es que **el ancla inline se cae sola al DAR FORMATO
al texto**: las cuatro citas que la primera pasada del criterio 16 encontró sin ancla no fueron
descuido — el `` en `ce93480` `` se había ido a la línea siguiente **al justificar el párrafo**, sin
que nadie tocara la cita. O sea que lo único que el detector lee para saber contra qué revisión
resolver **lo rompe un reflujo de texto**, y no hace falta editar la cita para invalidarla.
De ahí las dos consecuencias operativas, que no son estilo: el criterio 16 se comprueba con el
`REVISION_RE` del detector y **nunca a ojo**, y esa comprobación **se repite al cerrar cada
rebanada** (criterio 15), porque cada reescritura de párrafo puede volver a tirar un ancla al suelo.

**Consecuencia medida, y es obligación de cierre:** **20 citas** de este documento apuntan a
`openspec/config.yaml` y a `CLAUDE.md`, que son los dos ficheros que esta tanda modifica. Hoy resuelven
contra el árbol y el hook las da por buenas; **en cuanto el `apply` inserte líneas, se desfasan**. El
barrido de la regla de mutación 4 no es aquí una formalidad: es el que las repara, y va en el criterio
de aceptación 15.

---

## 0 · Precondición de topología — comprobada, no supuesta

Medido antes de redactar, con `git worktree list` y `git rev-list --left-right --count`:

| Hecho | Medida |
|---|---|
| Árbol principal | `main` en `ce93480` (era `fadcf1c` al empezar) |
| F1B-10 | aislado en `C:/dev/Desk_2_R1.023-worktrees/f1b-10-r1`, rama `f1b-10-r1` en `7daedf4`, `verify` pendiente |
| El worktree **NO** está prunable | `git worktree list` lo lista sin marca y el directorio existe |
| `main` frente a `origin/main` | **tres commits por delante** (`a756d74`, `fadcf1c`, `ce93480`), sin empujar |

**Compatible con la regla del ciclo 2 de `CLAUDE.md` mientras F1B-10 no vuelva al árbol
principal.** Una tanda SDD por árbol de trabajo: F0-05 corre en `main`, F1B-10 en su worktree, y
ninguna se imputa las líneas de la otra.

**«`main` limpio» es cierto DE LOS TRACKEADOS, y ni siquiera eso al terminar.** Hay **once ficheros
sin trackear** en `docs/sdd/`, entre ellos las tres fuentes de esta tanda y `ENTRADA.md`; y al
cerrar la redacción el libro `…R01.3.xlsx` aparece además **modificado y trackeado**, por la
edición que acompaña a `ce93480`. No rompe la regla del ciclo 2 —sigue habiendo una sola tanda SDD
por árbol—, pero sí toca su **medida**: el ledger no cuenta lo nuevo sin trackear —desvío 1 de los
tres medidos en `CLAUDE.md`— y un `.xlsx` es binario para git, que es el desvío 2. Así que el
presupuesto de §12 se estima con `git diff --shortstat --no-renames` **más** `wc -l` de lo nuevo,
y el libro no suma. Y es, literalmente, el trabajo que la comprobación 6 existe para enseñar: el
barrido nace con once entradas que ya sabemos que tiene.

---

## 1 · Intención

Hay cinco sitios donde vive la verdad de este proyecto —código, `openspec/`, plan, maestro y las
decisiones que se toman en conversación— y corren a velocidades distintas. El desvío no se ve en
un commit: se ve en el agregado. Cuando por fin se miró, salieron cuatro casos reales, y los
cuatro ya habían ocurrido.

El principio ya estaba escrito en `openspec/config.yaml:1249` en `ce93480` (`unidad_de_avance.trazabilidad`):
*«el as-built no se recuerda: se verifica»*. **Lo que faltaba era quién lo ejecuta y cada cuánto.**

**Esta tanda NO arregla ningún desvío: los hace visibles.** Es la distinción entera, y conviene
dejarla escrita antes que nada: un barrido que además corrige es un barrido en el que nadie puede
confiar, porque ya no se sabe si el número bajó porque el problema se fue o porque el barrido lo
tapó. **Esta propuesta se atiene a su propia regla**: los tres desvíos que la redacción encontró
—§13— quedan registrados y **ninguno resuelto aquí**.

---

## 2 · Alcance

### Entra — cinco piezas ejecutables, en **dos rebanadas** (§12)

**R1 «el contrato»** son las piezas 1 y 2; **R2 «el barrido»**, las piezas 3, 4 y 5. El corte es la
dependencia real del trabajo: R2 mide lo que R1 escribe.

1. **Comprobación de forma en el pre-push**, sobre el hook que `hook-citas-pre-push` ya dejó
   instalado (`.githooks/pre-push:4`, que hace `exec` de `apps/desk/server/citas/cli.ts`): todo
   `openspec/changes/<nombre>/proposal.md` lleva la cabecera R-1 con sus **siete** campos, `motivo`
   no vacío cuando `tanda` es `fuera-del-plan`, y `origen_cabecera` con uno de sus dos valores.
   Si falla, el push no sale. **Con rojo previo.**
2. **Las TRECE cabeceras**, más la de esta propuesta, ya escrita. Reparto, derivación y procedencia
   en §4. **Doce se escriben ya; la decimotercera —F0-04— espera el `cierra` de §18**, que es lo
   único que bloquea `sdd-spec`.
2b. **Cerrar el registro de F0-04** — entra por decisión de Gerencia, salida (c) de §13.1.
3. **Regla (d) de `unidad_de_avance`**: el numerador se publica con el motivo de su cambio,
   `por trabajo` o `por dictamen`. Las tres que ya existen (`config.yaml:1235`, `:1240`, `:1245`)
   **no se tocan**.
4. **Las dos guardas del autocertificado** (Pieza 1 del encargo) — §6.
5. **`npm run reconcile`** → escribe `docs/sdd/RECONCILIACION.md` con las seis comprobaciones del
   encargo, su fecha y su commit.

Y, como consecuencia **medida** de la comprobación 4: el campo `estado` en las doce entradas de
`incumplimientos_vivos` (§7).

### No entra — explícito y a propósito

- **Cambiar el §5 del plan.** El denominador pasa de 51 a 52, y eso es una **precondición
  documental** que aplica quien edita el plan (§8). Esta tanda no toca el `.md` del plan.
- ~~**Cerrar el registro de F0-04.** Es otra tanda.~~ — **RETIRADO el 17/09.** Gerencia eligió la
  salida **(c)** de §13.1: cerrar ese registro **entra en R1 como trabajo**. La línea se tacha en
  vez de borrarse porque la propuesta declaró lo contrario y el cambio de alcance tiene que ser
  legible, no silencioso.
- **Decidir destinos** de incumplimientos vivos o de entradas de `ENTRADA.md`. Se registran; no se
  rutean. R-3 de `CLAUDE.md:457-462` es explícita: no se inventa destino.
- **Reescribir el contenido de los changes existentes.** Se les **AÑADE** cabecera y nada más: el
  `git diff` de esta tanda sobre ellos **sólo añade** líneas de cabecera.
- **Tocar código de producto.** Ni `transitions.ts`, ni `estados.ts`, ni nada bajo `apps/desk/src`
  ni `apps/desk/server/routes`. Lo único que se toca de `apps/` es el detector de citas, que es
  herramienta de método y es la capacidad declarada.
- **Reclasificar los dos desvíos caducos** que la redacción destapó (§13.2). No es mecánico.

---

## 3 · Las cinco piezas, con lo que cada una exige

### 3.1 · La comprobación de forma — **siete** campos

Vive donde ya vive el detector de citas: `apps/desk/server/citas/cli.ts`, invocado por
`.githooks/pre-push:4`. **Es comprobación de FORMA, no de criterio**: existe la cabecera, están
los siete campos, `motivo` no está vacío cuando toca, y `origen_cabecera` lleva uno de sus dos
valores. No comprueba —ni puede— que el ID sea el correcto; de eso se ocupan las dos guardas de §6.

**Rojo previo obligatorio** (`strict_tdd`): un `proposal.md` sin cabecera, otro con
`fuera-del-plan` y `motivo: ""`, y otro **sin `origen_cabecera`**, los tres **rojos antes** de
escribir la comprobación.

### 3.2 · `npm run reconcile`

No existe hoy: `package.json` no tiene script `reconcile`. Mismo patrón que el detector de citas
—**lee ficheros, no interpreta**—. Escribe **un solo fichero**, `docs/sdd/RECONCILIACION.md`, con
la fecha y el commit contra el que midió.

| # | Comprueba | Qué debe reportar contra `ce93480` |
|---|---|---|
| 1 | `capabilities` (`config.yaml:104`) **vs** `openspec/specs/*/spec.md` en disco | **17 declaradas · 9 ficheros · 0 huérfanas** (medido) |
| 2 | Tandas del §5 **vs** cabeceras `tanda:` | **dos cifras separadas**, nunca una — §6 |
| 3 | Cambios `fuera-del-plan`, con su motivo | **CINCO** — §4.1 |
| 4 | IVs vivos sin destino · gates sin sesión · claves `decision/*` sin fila | **5 vivos** (`config.yaml:307`) |
| 5 | Cifras ancladas (`config.yaml:1187`) | esperas **4 / 11**, divergencia **legítima** |
| 6 | Ficheros de `docs/sdd` sin trackear | **once** hoy (§0) |

**Exit code ≠ 0 SÓLO si la 1 o la 3 encuentran algo** — las dos que significan trabajo huérfano.
Las otras cuatro informan y no bloquean: un barrido que bloquea por una divergencia legítima
enseña a saltárselo, y un barrido que se salta no existe.

**La comprobación 5 lee `packages/shared` —`estados.ts` y `transitions.ts`—, NO la
documentación.** No es preferencia de diseño: el 17/09 un hallazgo del informe de brechas salió
**falso** por leer `config.yaml` en vez del código, y la propia entrada `esperas` lo deja escrito
(`config.yaml:1187` y siguientes, clave `divergencia`, último párrafo). Leer el registro para
comprobar el registro es justo el molde del fallo.

**Determinismo: es requisito, no comodidad.** Dos pasadas seguidas sin cambios en el árbol
producen un `RECONCILIACION.md` **idéntico**, de modo que su `git diff` **sea** la lista de
desvíos nuevos desde la pasada anterior. Sin eso la pieza no sirve: un fichero que cambia solo
convierte el diff en ruido y obliga a releerlo entero cada vez, que es exactamente lo que el
mecanismo existe para evitar.

---

## 4 · Las trece cabeceras — reparto, procedencia y derivación

### 4.0 · El séptimo campo: `origen_cabecera`

    origen_cabecera: declarada        # la escribió quien hizo el trabajo
    origen_cabecera: derivada-17/09   # reconstruida en el retroajuste

**Va en la cabecera, no sólo en el informe**, y esa decisión es el campo entero. En dos semanas
nadie distinguiría una cabecera declarada de una reconstruida, y **el valor completo de R-1 es que
la afirmación la hace quien hizo el trabajo**: una cabecera derivada es una lectura de terceros
sobre un documento acabado, y vale menos. Doce de las trece van a ser derivadas. Que se vea.

**Se añade también a la definición de R-1 en `CLAUDE.md:423-434`** —la regla nace con siete campos, no
con seis y un parche— y a la comprobación de forma de la tarea 1 como séptimo campo.

### 4.1 · Los ocho archivados — y la corrección aritmética

El reparto lo ratificó Gerencia (paso 0 de `docs/sdd/F0-05_Bloques_para_ClaudeCode.md:17` y
`:311-314`, enumerado en `docs/sdd/ENTRADA.md:24`, E-001, consecuencia 3).

| # | Change archivado | `tanda:` | `cierra:` |
|---|---|---|---|
| 1 | `2026-09-09-cerrar-hallazgos-revision-f1b-01` | `fuera-del-plan` | — |
| 2 | `2026-09-10-mensaje-422-cliente-duplicado` | `fuera-del-plan` | — |
| 3 | `2026-09-10-reasignar-desvios-huerfanos` | `fuera-del-plan` | — |
| 4 | `2026-09-10-vista-todos-y-estados-en-espera` | `F1B-08` | **no** |
| 5 | `2026-09-12-por-entregar-es-espera` | `F1B-08` | **no** |
| 6 | `2026-09-15-hook-citas-pre-push` | `fuera-del-plan` | — |
| 7 | `2026-09-16-detector-citas-extremos` | `fuera-del-plan` | — |
| 8 | `2026-09-17-tercera-puerta-orden-venta` | `F1A-08` | **si** |

**Son CINCO `fuera-del-plan`, no seis.** E-001 y `Bloques:17` dicen «seis» y a la vez **nombran
cinco**; la suma no cierra —`6+1+2 = 9` sobre **8** archivados en disco—, mientras que `5+1+2 = 8`
sí. **La enumeración es correcta y exhaustiva; el numeral es un off-by-one**, y no cambia ninguna
asignación. Confirmado por Gerencia el 17/09.

**F1B-08 sigue PARCIAL.** Los dos cambios que le apuntan van con `cierra: no` y **no mueven el
numerador**. Es el caso que hizo falta el campo: sin él, «lleva el ID de la fila» y «la fila está
cerrada» serían la misma afirmación, y no lo son.

### 4.2 · Las cuatro F0-0x — `tanda:` es mecánico, los demás se derivan

Poner `tanda: F0-01` en `openspec/changes/F0-01/` **no es repartir**: es leer el nombre de la
carpeta contra una fila que existe (`plan:455-458`, con su detalle en `plan:125-128`). Los otros
campos sí son juicio, y **se derivan leyendo cada documento. Lo que no se deduce, se para.**

| Campo | F0-01 | F0-02 | F0-03 | F0-04 |
|---|---|---|---|---|
| `tanda` | `F0-01` | `F0-02` | `F0-03` | `F0-04` |
| `motivo` | `""` | `""` | `""` | `""` |
| `capacidad` | `[]` | las **siete** as-built | `[]` | ⛔ |
| `maestro` | `["§4.4", "§4.7"]` ⚠️ | `["Anexo H"]` ⚠️ | `["§1.8", "Anexo C.10"]` | ⛔ **no deriva** |
| `cierra` | `si` ⚠️ | `si` | `si` | ⛔ **no deriva** |
| `toca_maestro` | `si` | `si` | `si` | ⛔ **no deriva** |
| `origen_cabecera` | `derivada-17/09` | `derivada-17/09` | `derivada-17/09` | ⛔ |

**La evidencia de cada derivación, para que se pueda discutir sin releer los cuatro documentos:**

- **F0-01 · `capacidad: []`** — §10 dice «Ninguna spec (eso es F0-02)» y no toca `packages/shared`,
  `apps/desk/server` ni `packages/zoho-sync`. La columna de capacidades de `plan:455` es `—`.
- **F0-01 · `toca_maestro: si`** — §3 titula «Las tres reglas nuevas, en `CLAUDE.md` **y en §4.4 del
  maestro**» (`:57`, repetido en la lista de tareas `:165`), y las correcciones salen por el canal
  `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, que existe por esta tanda.
- **F0-02 · `capacidad`** — la tabla de su §1 nombra las siete una a una: `transitions-st`,
  `tickets-core`, `permissions`, `trazas`, `remisiones`, `derivacion-avisos`, `zoho-sync`, y dice
  expresamente que las otras ocho **no son de esta tanda**.
- **F0-02 · `cierra: si`** — su §4 enumera el criterio de hecho y la cabecera de F0-03 lo confirma
  desde fuera: «F0-02 (hecha: siete specs, commit `fa445ac`)».
- **F0-02 · `toca_maestro: si`** — §5 «No edita el `.docx` del maestro», y el criterio 5 de su §4
  obliga a que cada spec lleve sección de discrepancias **maestro↔código**: la tanda produce
  desactualización del maestro por diseño.
- **F0-03 · `capacidad: []`** — §2.3 «**No toca código**»; la columna de `plan:457` es `—`.
- **F0-03 · `cierra: si`** — su cabecera dice «**Aprobada y ejecutada el 2026-09-09**» y el criterio
  de hecho está medido dos veces, al abrir y al cerrar, con las cuatro puertas idénticas.
- **F0-03 · `toca_maestro: si`** — criterio de hecho 8: la entrada 13 de
  `F0-01_Correcciones_para_el_maestro.md` recoge **diez** ubicaciones en las que el maestro arrastra
  una frase caduca, con texto propuesto para el Anexo C.10, M2.1 y M2.5.

### 4.3 · Los tres avisos de la derivación — ⚠️ en la tabla

**No son bloqueantes y no cambian ningún valor, pero van escritos porque el campo `origen_cabecera`
existe justamente para que una derivación se pueda auditar.**

1. **F0-01 · `maestro` sale de DOS sitios, no de uno.** `§4.4` se deriva del documento (`:57`,
   `:165`). **`§4.7` NO aparece en el documento**: sale de `plan:125` («`CLAUDE.md` con las reglas
   invariables (§4.4) y el mapa documental de §4.7») y de la columna de `plan:455`. Se escribe
   porque la fila del plan es fuente legítima para el campo, pero **no es derivación pura del
   proposal** y por eso queda dicho.
2. **F0-02 · `maestro` DIVERGE de la fila del plan, y es el primer disparo real de la guarda (b).**
   El documento es inequívoco —su §Por qué abre con «El **Anexo H** dice, en H.1 (`R08.1.md:4485`),
   **la frase que gobierna esta tanda**», y su cabecera repite Anexo H—, mientras que la columna de
   `plan:456` declara **M1.3, M1.9, Anexo G**. No hay intersección.
   **Consecuencia, y es sana:** la guarda (b) de §6 marcará F0-02 como **«sin verificar»** el primer
   día que corra. Es exactamente lo que se pedía de ella —enseñar, no rechazar— y aparece antes
   incluso de estar construida. Se registra; **no se arregla aquí**: cuadrar el plan con el
   documento es decidir cuál de los dos manda, y eso no es de esta tanda.
3. **F0-01 · `cierra: si` con un criterio de hecho PERSONAL sin marcar.** Su criterio 7 dice
   literalmente que `.env.example` «queda **PENDIENTE**, y lo hace el usuario a mano», porque una
   regla de permisos del entorno bloquea todo acceso a `.env*`. Bajo la **regla del ciclo 1** de
   `CLAUDE.md` eso **no impide** el `cierra: si` —una casilla cuyo dueño está fuera del repositorio
   se declara aparte y no se cuenta como tarea—, pero tampoco se esconde.

### 4.4 · Procedencia de las trece

| `origen_cabecera` | Cuántas | Cuáles |
|---|---|---|
| `declarada` | **1** | `F0-05` — la escribe quien hace el trabajo |
| `derivada-17/09` | **12** | los **ocho** archivados · `F0-01`, `F0-02`, `F0-03` · `orden-precedencia-guardas` |

`orden-precedencia-guardas` es **derivada** aunque su tanda esté en vuelo: la escribe F0-05, no el
agente que hizo F1B-10, y el campo dice quién la escribió, no en qué estado está la tanda.

---

## 5 · Las dos cabeceras que necesitan trato propio

### 5.1 · La novena va en DOS sitios

`orden-precedencia-guardas/proposal.md` **no tiene cabecera ni en `main` ni en la rama**
(comprobado en los dos árboles). La tarea 1 comprueba **todo**
`openspec/changes/<nombre>/proposal.md`: en cuanto entre, **bloquea el push de una rama publicada y
sin fusionar**.

**La cabecera va en los dos sitios —`main` y `f1b-10-r1`— como TAREA CON CASILLA PROPIA, no como
nota.** Es donde esto se deshace solo: un artefacto escrito en `main` queda congelado mientras las
reparaciones de la tanda viven en su rama, y **si entra sólo en `main`, la fusión reintroduce el
bloqueo**. El worktree no está prunable (§0), así que la segunda copia entra **por el worktree**,
sin checkout nuevo y sin sacar F1B-10 de su aislamiento.

### 5.2 · `cierra: si` se escribe como INTENCIÓN, no como hecho

Lo confirma después el `archive-report` por la guarda (a) de §6. Y el propio F1B-10 es el caso que
lo enseña: **declara el orden total en su spec pero NO toca el alta de remisión** —eso es IV-12,
registrado y sin destino (`openspec/config.yaml:1104`)—. Así que

> «cierra la fila» y «no quedan desvíos en su territorio» son **dos afirmaciones distintas**,

y el informe de archivo tiene que decir **las dos**. Un `cierra: si` que se leyera como «aquí ya no
hay nada» convertiría cada fila cerrada en una promesa que nadie hizo.

### 5.3 · ⛔ F0-04 se PARA — primer caso real de la cláusula «si no se deduce, se pregunta»

`openspec/changes/F0-04/proposal.md:6` dice, literal:

    | Estado | **Propuesta — pendiente de visto bueno** |

…mientras la tanda está **ejecutada**, con sus pruebas y su CI en el árbol. El libro R01.3 ya lo
registra en su fila R6, columnas Q y R: «Ejecutada · `proposal.md` sin actualizar … Su
`proposal.md` sigue diciendo "pendiente de visto bueno": cerrar el registro».

**Escribir ahí `cierra: si` sería juzgar un fichero que se contradice con la realidad**, que es
justo lo que la cláusula prohíbe. **ACTUALIZADO el 17/09:** Gerencia eligió la salida **(c)** y
cerrar ese registro **entra en R1** — pero el `cierra` sigue sin deducirse, ahora por el staging de
su fila y no por sus casillas de secretos. Todo el análisis está en §13.1, y la pregunta en §18.

**Y no es sólo `cierra`.** Al derivar los otros campos, F0-04 falla en tres, no en uno:

- **`maestro` no deriva.** Barrido el documento entero: **no cita ningún pasaje del maestro como
  justificación**. Sus únicas dos menciones son `F0-00_Correcciones_desde_Maestro_R08.1.md` como
  fichero de entrada (`:8`) y un `Anexo B.1` usado como **evidencia** para clasificar un estado
  (`:57`) — ninguna es «pasaje que lo justifica». El `M11.5` de la columna de `plan:458` es la única
  fuente, y **el plan solo no basta** cuando el documento calla.
- **`toca_maestro` no deriva.** Su §12 dice «Ningún cambio de comportamiento del motor», pero la
  tanda produce el dato de entrada de C7 y C9; nada en el documento dice si el maestro queda
  desactualizado.
- **`capacidad` sólo deriva a medias.** `plan:458` declara `transitions-st`, pero su §4 construye la
  «Matriz área × transición completa (las 34), en servidor», que es `permissions`. El documento
  sostiene las dos y el plan sólo una.

---

## 6 · Las dos guardas del autocertificado

El `tanda:` lo escribe el mismo agente que hace el trabajo, y nada lo comprueba: `verify: pass`
demuestra que el cambio cumplió **su propio** `tasks.md`, no lo que pide la fila del plan. Son dos
documentos y nadie los enfrenta. Antes del dictamen no importaba, porque reclamar un ID no daba
nada; **ahora da una tanda cerrada**.

- **(a)** El `archive-report.md` de todo cambio con `tanda:` declara **en una línea** qué parte del
  contenido de esa fila cubrió y qué dejó fuera. Es lo que sostiene el `cierra`.
- **(b)** La comprobación 2 marca **«sin verificar»** toda fila dada por cerrada cuya `maestro:` no
  cite ninguna de las fuentes que el §5 declara para ella. **No la rechaza: la enseña**, que es lo
  que hace un barrido. **Ya tiene su primer caso antes de existir: F0-02** (§4.3, aviso 2).

### 6.1 · El numerador son DOS cifras, y ninguna deriva sola

De las **once** tandas cerradas, sólo cuatro son derivables de cabecera. Las otras siete están
cerradas por commits anteriores a esta tanda y **no tienen change archivado con cabecera**:

**FIJADO por la decisión de §18 (`cierra: no` para F0-04):**

    4  derivables de cabecera .... F0-01, F0-02, F0-03, F1A-08
    7  declarados por commit ..... F0-00, F0-04, F1A-01, F1A-02, F1A-04, F1A-05, F1B-01
    ─────────────────────────────────────────────────────────────────────────────────
    11 de 52

**F0-04 tiene cabecera pero no cruza de columna**, y ésa es justamente la distinción que el campo
`cierra` existe para sostener: llevar el ID de una fila y cerrarla son afirmaciones distintas. El
total, **11 de 52**, no dependía de la respuesta — y esa invariancia es la comprobación de que la
partición está bien hecha: mover una tanda de columna no puede cambiar cuántas hay cerradas.

**`F0-00` no tiene carpeta de change, y no es un olvido:** es tanda sin código —auditoría del
as-built—, así que **nunca tendrá cabecera**. Se dice aquí porque una ausencia sin explicación en
una lista de once parece un descuido, y el propósito entero de la comprobación 2 es que no haya
números sin procedencia.

**NINGUNA cabecera retroactiva para los siete declarados por commit.** Inventarla sería fabricar
evidencia; contarlos sin decirlo, esconder de dónde sale el número. Por eso son dos cifras y no
una suma.

---

## 7 · El campo `estado` en las DOCE entradas de `incumplimientos_vivos`

Medido el 2026-09-17 sobre `openspec/config.yaml:307` en `995adbc` y siguientes. **Doce entradas; cinco vivos.**
Hoy el campo `estado` existe **sólo en los cerrados**, así que «vivo» se deduce de que **falte una
línea** — y un barrido que cuenta ausencias miente en cuanto alguien añade una entrada y se olvida
del campo.

| Distribución real | Entradas | Dónde |
|---|---|---|
| `estado: CERRADO` | IV-1, IV-3, IV-4, IV-5, IV-7, IV-10 (**seis**) | `:312`, `:434`, `:474`, `:554`, `:675`, `:874` |
| `estado` en **prosa** | IV-6 (**uno**, cerrado por F1B-01) | `:652` |
| **sin el campo** | IV-2, IV-8, IV-9, IV-11, IV-12 (**cinco** — los vivos) | `:376`, `:733`, `:783`, `:978`, `:1057` |

**Tres condiciones, las tres de Gerencia:**

1. El campo va en **las doce**, vivas incluidas, para que «vivo» quede **escrito y no deducido**.
2. **IV-6 es el único no mecánico**: su `estado` es hoy prosa. El valor pasa a `CERRADO` y **la
   prosa se conserva en una clave propia**. No se borra nada — este fichero tiene por cultura
   conservar el registro.
3. **Contraste hecho y coincide**: cinco vivos, y son los mismos cinco que nombra `CLAUDE.md`.

---

## 8 · Precondición documental — **APLICADA por `ce93480`** mientras se redactaba

**Esta sección es Caso C de la regla de mutación 4: afirmaba algo cierto de `fadcf1c` que otra
tanda cerró.** Se conserva con lo que era y con lo que lo cerró, porque el aviso que contiene
—cómo se renumera sin corromper el documento— sigue valiendo la próxima vez.

**Lo que era, contra `fadcf1c`:** F0-05 no tenía fila en el §5. `grep -c "^| F0-05"` daba **0**;
las filas F0 eran F0-00 a F0-04. Escribir `tanda: F0-05` sin más habría estrenado R-1 **reclamando
una fila inexistente** — lo contrario de lo que la regla existe para hacer.

**Lo que lo cerró:** el commit `ce93480`, *«docs(plan): fila F0-05 y denominador 51 → 52, fechado
en el corte de S38»*. Hoy, contra `ce93480`:

| Comprobación | Resultado |
|---|---|
| `grep -c "^| F0-05"` | **1** — la fila está en `plan:459` |
| Denominador | **52 tandas**, `F0 6`, en `plan:7` |
| Recuento | **45 filas / 52 tandas**, `R2`–`R53`, 70 con F2–F5, en `plan:502` |
| Columna `Capacidad` de la fila | `citas-verificables` — **coincide** con el `capacidad:` de esta cabecera, derivado por separado (§9) |
| Columna `Fuente` de la fila | `Brecha 17/09 · E-001 · F0-05_Mecanismo_de_Reconciliacion.md` — ningún pasaje del maestro, que es lo que sostiene `maestro: []` |

**La precondición ya no bloquea, y `tanda: F0-05` es hoy una afirmación verdadera.** El avance del
corte de S38 es **11 de 52**, motivo «fila nueva F0-05». Esta tanda sigue **sin tocar el §5**.

### 8.1 · El aviso que se conserva: eran TRECE OCURRENCIAS en dos líneas

Medido sobre `fadcf1c` antes del cambio, con `grep -o`, ocurrencia a ocurrencia. Se conserva porque
es el método, no el número:

| Línea (en `fadcf1c`) | Ocurrencias | Qué había que mover |
|---|---|---|
| `plan:7` | **3** | `51`→`52` · `F0 5`→`6` · `69`→`70` |
| `plan:501` (hoy `:502`) | **10** | `51`→`52` **cinco veces** · `44`→`45` **dos veces** · `F0 5`→`6` · `R2–R52`→`R2–R53` · `69`→`70` |

> ⚠️ **La trampa:** `5` aparecía **dos veces** en cada línea y **sólo una era la de F0**. La otra es
> `F1E 5`, que no cambia. Un `sed` sobre «5» habría corrompido F1E en las dos, y mover sólo «51»
> habría dejado el documento diciendo que **45 filas contienen 51 tandas**.
>
> **Comprobado contra `ce93480`: `F1E 5` sigue intacto en las dos líneas** (`grep -oE 'F1E \*{0,2}5'`
> sobre `plan:7` y `plan:502` da 2). La renumeración sorteó la trampa.

> ⚠️ **Y una segunda trampa, que se descubrió al revisar la aplicación: contar `51` da un falso
> positivo.** Un `grep -c "\b51\b"` sobre `plan:502` sigue devolviendo resultados después de
> `ce93480`, y eso **no** es una renumeración a medias: los dos `51` que sobreviven son
> **deliberados y Caso B** —«el denominador se movió el 17/09: **de 51 a 52**» y «**51 tandas** al
> corte de S37–S38»—. Renumerarlos volvería **falso** el registro del propio movimiento.
> **Es la regla de mutación 4 aplicada a su propia comprobación:** el barrido se valida leyendo
> qué **afirma** la frase, nunca contando ocurrencias. Contar es lo que produce el falso positivo.

### 8.2 · CORRECCIÓN — el libro R01.3 **SÍ está versionado**

**Lo escrito en la primera redacción de esta propuesta era falso**, y la corrección va aquí en vez
de borrarse porque el modo de fallo es el que la regla de método nombra: se dio por buena una
afirmación de segunda mano —«el libro sigue sin versionar, pendiente 6 del R08.3»— sin comprobarla
contra el repositorio.

**Medido:** `git ls-files` lo encuentra, y su historia empieza en `52e9ef7`, *«docs(sdd): versionar
la R08.2 y el libro R01.3…»*, que ya estaba en el árbol cuando se redactó. El pendiente 6 del R08.3
**estaba cerrado antes de que esta propuesta lo declarara bloqueante**.

Lo que sí queda dicho, porque no cambia: `plan:7` declara que «el libro es la fuente, este documento
el destino, y **las dos cifras salen de contar filas de la hoja "Tandas"**», y `ce93480` respetó ese
orden —la fila entró primero como `R53` en la hoja y después en el `.md`, y `plan:502` lo deja
escrito—. **La cifra es reproducible desde el repositorio**, que es lo que `plan:7` promete.

**Lo único vivo** es que el `.xlsx` figura hoy **modificado y sin confirmar** en el árbol (§0). Es
material de la comprobación 6, no un bloqueo de esta tanda.

---

## 9 · La cabecera de esta propuesta, campo a campo

| Campo | Valor | Por qué |
|---|---|---|
| `tanda` | `F0-05` | Por la precondición de §8. Hoy la fila no existe; **la cabecera es válida sólo después** de que el plan la incorpore, y eso es lo que la hace precondición y no nota |
| `motivo` | `""` | Vacío es correcto: sólo es obligatorio si `tanda` es `fuera-del-plan` |
| `capacidad` | `[citas-verificables, reconciliacion]` | **No es `[]`, y son DOS.** `citas-verificables` porque su `covers` dice literalmente «Línea base de citas verificables, detector (`apps/desk/server/citas/cli.ts`) y hook de pre-push» (`config.yaml:208-211`) y la tarea 1 modifica ese hook; `reconciliacion` porque R2 no cabe ahí sin volver falso ese `covers` (§10) |
| `maestro` | `[]` | Tanda de método: ningún pasaje del maestro la justifica, y fingir uno sería el primer uso falso del campo |
| `cierra` | `si` | Deja la fila F0-05 terminada. Como **intención**, según §5.2 |
| `toca_maestro` | `no` | El maestro no queda desactualizado: esta tanda no cambia comportamiento de producto |
| `origen_cabecera` | `declarada` | La escribe quien hace el trabajo. Es la **única** de las trece que puede decirlo con verdad |

---

## 10 · Capacidades — contrato con `sdd-spec`

### Modificadas
- **`citas-verificables`** — el detector y el hook de pre-push ganan la comprobación de forma de la
  cabecera R-1, con sus siete campos. Ya está declarada (`config.yaml:208`).

### Nuevas — ⚠️ **CAMBIO sobre lo aprobado, y se señala en vez de hacerse callando**
- **`reconciliacion`** — el barrido de seis comprobaciones, la regla (d) del avance y las dos guardas
  del autocertificado. **Es todo R2.**

**Lo que decía esta sección al aprobarse:** «Nuevas: Ninguna. Y eso es deliberado: F0-05 es método, no
producto». **El argumento no se sostuvo al escribir la spec**, por dos razones medidas:

1. **La premisa era falsa.** «Método» no es motivo para no tener capacidad: `citas-verificables` **es
   una capacidad de método** y tiene spec completa con 18 requisitos, y su propia ficha se define como
   «una herramienta de infraestructura sin lógica de negocio». El precedente existe y va en el sentido
   contrario al que la sección invocaba.
2. **Meterlo todo en `citas-verificables` volvería FALSO su `covers`.** Dice «línea base de citas
   verificables, detector y hook de pre-push» (`config.yaml:208-211`), y su spec fija un límite
   explícito: «esta capacidad no cubre lo semántico». El barrido compara cifras del maestro contra
   `packages/shared` — que es exactamente lo semántico— y no tiene nada que ver con citas. Estirarla
   haría que la capacidad significase «todo el utillaje de método», y una capacidad que significa eso
   no significa nada.

**R-2 se cumple en el mismo cambio:** `reconciliacion` se añade a `openspec/config.yaml → capabilities`
como tarea de R2, en el acto de crear su spec. Una spec que no está en `capabilities` existe y es
invisible — y es justo lo que la comprobación 1 de esta misma tanda caza.

**El corte R1/R2 sale reforzado, no tocado:** cada rebanada tiene ahora exactamente una capacidad.

---

## 11 · Áreas afectadas

| Área | Qué cambia |
|---|---|
| `apps/desk/server/citas/` | La comprobación de forma —siete campos— y sus pruebas |
| `openspec/changes/**/proposal.md` | **Doce cabeceras**, sólo añadidas (F0-04 parada) |
| `openspec/config.yaml` | Regla (d) de `unidad_de_avance`; campo `estado` en las doce IV |
| `CLAUDE.md:423-434` | R-1 pasa a siete campos, con `origen_cabecera` |
| `docs/sdd/RECONCILIACION.md` | Fichero nuevo, generado |
| `package.json` | Script `reconcile` |
| `C:/dev/Desk_2_R1.023-worktrees/f1b-10-r1` | **Segunda copia de la cabecera de `orden-precedencia-guardas`** (§5.1) |

**Nada de lo anterior modifica `transitions.ts`, `estados.ts` ni ningún fichero de `apps/desk/src`.**

---

## 12 · Entrega — **DOS REBANADAS**, cortadas por naturaleza

Techo del preflight: **800 líneas** (`config.yaml:22-30`), leído de fichero. La suma estimada era
**≈795**, margen de una línea por cada ciento cincuenta. **Decisión de Gerencia, obs. #743: dos
rebanadas.**

| Rebanada | Tareas | Qué entrega |
|---|---|---|
| **R1 · «el contrato»** | 1 · la comprobación de forma en el pre-push<br>2 · las **trece** cabeceras<br>2b · **cerrar el registro de F0-04** (§13.1, salida (c)) | La regla existe y se impone |
| **R2 · «el barrido»** | 3 · la regla (d) de `unidad_de_avance`<br>4 · las dos guardas del autocertificado<br>5 · `npm run reconcile` + `RECONCILIACION.md` | La regla se mide |

**El corte NO es presupuestario: es la dependencia real del trabajo.** R1 **establece el contrato**
y R2 **lo mide**, y **R2 no puede medir cabeceras que R1 todavía no ha escrito**. La comprobación 2
del barrido lee `tanda:` de los `proposal.md`; sobre el árbol de hoy leería trece ausencias y un
informe entero de ruido. Es el mismo criterio con el que se cortó F1B-10: se parte por dónde el
trabajo depende de sí mismo, no por dónde se acaba el presupuesto.

### 12.1 · Las dos salidas descartadas, con su razón

- **Techo ampliado sobre medición — NO.** El precedente de 5.000 líneas (`sdd-archive` de
  `detector-citas-extremos`) se justificó porque **4.062 de sus 4.502 líneas eran un `git mv`
  verbatim, con carga de revisión CERO**; lo realmente revisable eran 440. **Aquí no hay nada de
  eso:** trece cabeceras derivadas, un script nuevo y dos guardas se revisan línea a línea. **El
  techo existe para partir esto, no para ampliarse ante esto.**
- **El disparador en 420 líneas — RETIRADO.** Decía **dónde** cortar, no **cuánto** cuesta el
  total. Cortar cuando el contador lo pide deja que el punto de corte lo elija el cansancio en vez
  de la naturaleza del trabajo, y el corte que sale de ahí no tiene por qué coincidir con una
  frontera de dependencia. Lo sustituye el corte R1/R2, que es el mismo siempre.

### 12.2 · Cómo se mide, y cuándo se pide algo

**Cada rebanada se mide POR SEPARADO y antes de pedir nada**, en worktree aislado, con
`git diff --shortstat --no-renames` contra el commit de partida **más** `wc -l` de lo nuevo sin
trackear. Las dos partes hacen falta: el ledger no cuenta lo nuevo sin trackear y mide sin
detección de renombrado, y los tres desvíos están medidos en `CLAUDE.md`.

La lección de estimación aplica y está contada: **el informe que `verify` o `archive` generan es un
sumando obligatorio**, no un extra, y **no entra en las cifras de arriba** porque el objetivo de
esta tanda llega hasta `apply`.

---

## 13 · Puntos abiertos — dueño **GERENCIA**, y NO son requisitos de esta tanda

### 13.1 · ⛔ F0-04 falla en CUATRO de los SEIS campos — **la pregunta que bloquea `sdd-spec`**

**No es un caso límite: es el argumento de que cerrar su registro merece tanda propia.** De los seis
campos que R-1 traía, sólo dos son mecánicos y **los otros cuatro fallan**:

| Campo | Estado | Evidencia |
|---|---|---|
| `tanda` | ✅ mecánico | El nombre de la carpeta contra `plan:458` |
| `motivo` | ✅ mecánico | `""`, porque `tanda` no es `fuera-del-plan` |
| `capacidad` | ⚠️ **a medias** | `plan:458` dice `transitions-st`; su §4 construye la «Matriz área × transición completa (las 34), en servidor», que es `permissions`. El documento sostiene las dos, el plan sólo una |
| `maestro` | ⛔ **no deriva** | Barrido entero: **no cita ningún pasaje del maestro como justificación**. Sólo `F0-00_Correcciones_desde_Maestro_R08.1.md` como entrada (`:8`) y `Anexo B.1` como evidencia de clasificación (`:57`). `M11.5` sale sólo de `plan:458` |
| `cierra` | ⛔ **no deriva** | `proposal.md:6` dice «Propuesta — pendiente de visto bueno» con la tanda ejecutada. **Y hay más:** su §8 tiene **3 casillas sin marcar y 0 marcadas** (`:182-184`, rotación coordinada de secretos), que son exactamente lo que exige su criterio de hecho 9 |
| `toca_maestro` | ⛔ **no deriva** | Nada en el documento dice si el maestro queda desactualizado |
| `origen_cabecera` | ✅ mecánico | `derivada-17/09` |

El séptimo campo no salva el balance: **lo que falla es todo lo que exige leer el documento.** Y las
tres casillas sin marcar son la prueba de que el problema no es una línea de `Estado` desactualizada
—eso se arregla editándola— sino que **nadie ha decidido si ese trabajo está hecho, diferido o
pendiente**. El libro R01.3 ya lo lleva anotado en su fila R6, columnas Q y R.

**Por qué bloquea:** el hook de la tarea 1 exige cabecera válida en los **trece**. Sin resolver
F0-04, **la tarea 1 no se puede declarar hecha**, y con ella R1 entera.

#### DECIDIDO — salida **(c)**: cerrar el registro de F0-04 entra en R1

**Decisión de Gerencia, 17/09, obs. #746.** Y se escribe con sus **dos mitades**, porque las dos son
ciertas a la vez: **(c) es la única de las cuatro que resuelve el problema en vez de administrarlo,
y también la única que mete juicio sobre una tanda ajena desde una tanda de método.** Lo segundo no
es una objeción vencida: es el coste que se acepta al elegirla, y por eso §2 tacha —no borra— la
línea que declaraba esto fuera de alcance.

**Lo que la abarata frente a su propia ficha: las tres casillas no exigen un juicio de alcance,
exigen aplicar una regla que ya existe.** Las tres (`F0-04/proposal.md:182-184`) son la rotación
coordinada de secretos, y **rotar secretos de producción vive en el gestor de secretos del
despliegue, fuera del repositorio** — lo dice la propia regla de secretos de `CLAUDE.md`: «los
valores viven sólo en el gestor de secretos del despliegue». Ninguna tanda las marca desde aquí. Es
el caso de manual de la **regla del ciclo 1**: se sacan del recuento y se declaran aparte.

**La cláusula inversa NO se activa, y está comprobada antes de escribirlo** — es la frase que separa
aplicar la regla de maquillar el contador. Ninguna de las tres describe trabajo que una tanda pueda
hacer en este repositorio:

| Casilla | Dónde se ejecuta | ¿Trabajo de repositorio? |
|---|---|---|
| `ZOHO_CLIENT_SECRET` + los 3 refresh tokens (atómica) | gestor de secretos del despliegue | **No.** El valor nunca vive en el repo |
| Los 3 passwords de BD | gestor de secretos del despliegue | **No** |
| `hub_reader`, con su `ALTER SUBSCRIPTION … CONNECTION` | PostgreSQL de **producción** | **No.** Es una operación sobre la base viva |

**Dónde queda escrito:** `docs/runbooks/verificaciones-pendientes-F0.md:98-100`, que lleva las mismas
tres con su orden y su aviso de atomicidad. **Y se dice explícitamente: archivar NO las da por
hechas.** Dueño: Gerencia. Destino: el runbook, que es donde ya viven.

#### Por qué NO las otras tres — escrito para que nadie las reabra

- **(a) y (b) hacen que R-1 NAZCA CON UN AGUJERO.** En (a) el repositorio afirmaría que los trece
  cumplen cuando uno no afirma nada: una cabecera con cuatro de seis campos indeterminados es **un
  hueco con formato**, y además la salida cómoda de la próxima cabecera incómoda, porque **pasa el
  hook igual que una verdadera**. En (b) la regla se cumple en **doce**, y el precedente de
  `apps/desk/server/citas/lineaBase.jsonl` avisa de que una excepción sin tanda que la retire **se
  queda**: IV-10 necesitó cuatro bloques y una decisión de Gerencia para llegar a cero.
- **(d) es la más silenciosa de las cuatro.** Cambia R-1 de garantía **sobre el estado** a garantía
  **sobre el diff** —de «todo `proposal.md`» a «todo el que toques»— y **nada en el repositorio lo
  señala después**.

#### Lo que (c) obliga — tres cosas, y la tercera es la que no estaba prevista

1. **Retirar del §2** la línea que declaraba esto fuera de alcance, con el motivo escrito. **Hecho**,
   tachada y no borrada.
2. **Declarar las tres casillas aparte**, con dueño, destino y dónde queda escrito, y con la frase de
   que archivar no las da por hechas. **Resuelto arriba.**
3. **Decidir el `cierra` de F0-04 contra el contenido de su FILA** —`plan:458` y `plan:128`—, **no
   contra su `proposal.md`**, que es justo el documento que se contradice consigo mismo.

#### ⛔ Y contra la fila TAMPOCO se deduce — la cláusula sigue viva

**Medido, y es un resultado distinto del que la decisión anticipaba.** La fila de F0-04 **no menciona
secretos en ninguna de sus dos líneas** (`grep -ci "secreto\|rotaci"` sobre `plan:128` y `plan:458`
da **0**), lo cual confirma que las tres casillas quedan fuera de su contenido. Pero la fila pide
**tres cosas**, y sólo dos se verifican:

| Contenido de la fila (`plan:128`) | ¿Se verifica en el repositorio? |
|---|---|
| Completar las pruebas del motor de transiciones | ✅ **Sí.** `apps/desk/server/permisos.test.ts` lleva el barrido «matriz área × transición, contra el servidor» |
| CI que ejecuta `test`, `typecheck` y `lint` | ✅ **Sí.** `.github/workflows/ci.yml` corre `typecheck`, `lint -- --max-warnings 158`, `test:coverage` y `build` |
| **Staging sobre la VPS Hostinger con PostgreSQL** | ⛔ **NO. Cero trazas en todo el repositorio** |

**La tercera se buscó a fondo antes de darla por ausente**, porque declarar un hueco que existe es
tan malo como no verlo: `grep -i staging` sobre `DEPLOY.md` da **0**, sobre `docs/runbooks/` da
**0**, y el barrido del repositorio entero sólo lo encuentra en dos sitios que no sirven — el plan
**archivado** `docs/sdd/Anteriores/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.md:109`, que lo declara como **plan** y no como hecho, y el
maestro hablando de Hostinger frente a Supabase.

**Así que `cierra` no deriva tampoco contra la fila, y por una razón que nadie había nombrado:** no
son las tres casillas de secretos —ésas se resuelven limpiamente por la regla del ciclo 1— sino un
**cuarto elemento**, el staging, que es contenido de la fila y del que **el repositorio no dice ni
que exista ni que no**.

**Se para y se pregunta**, que es lo que la cláusula ordena. La pregunta va al final de este
documento, en §18.

### 13.2 · Dos afirmaciones caducas — anotadas y PARADAS

Las destapó el contraste de §7. **Ninguna mueve el número de vivos**, y **las dos las cazaría la
comprobación 4 una vez escrita** — son exactamente el molde que el mecanismo describe. No se tocan
aquí porque reclasificar un desvío no es mecánico:

1. El comentario de cabecera de `incumplimientos_vivos` da **IV-4 por punto abierto** («IV-2 e IV-4
   → PUNTOS ABIERTOS: ninguna tanda los cubre») cuando su entrada ya dice `estado: CERRADO`
   (`config.yaml:474`), cerrado por `tercera-puerta-orden-venta`.
2. **IV-2 dice dos cosas según dónde se mire**: su entrada lleva `destino: F1A-07` desde el 17/09
   (`config.yaml:390`), pero ese mismo comentario y la fila de `CLAUDE.md` siguen diciendo que
   «ninguna tanda lo cubre».

### 13.3 · F0-02: el `maestro:` del documento no es el del plan

Detallado en §4.3, aviso 2. El documento dice **Anexo H**; `plan:456` dice **M1.3, M1.9, Anexo G**.
Sin intersección. **La guarda (b) lo marcará «sin verificar» el primer día**, que es su trabajo.
Cuadrarlos es decidir cuál de los dos manda, y eso no es de esta tanda.

### 13.4 · El matiz que E-001 dejó abierto

Si Gerencia prefiere `por-entregar-es-espera` como `fuera-del-plan` en lugar de `F1B-08`. **No
cambia ninguna cifra** —F1B-08 sigue parcial y el numerador no se mueve por ella— y por eso no
bloquea esta tanda.

---

## 14 · Criterios de aceptación

Mínimos del encargo, **ampliables en la spec**:

1. Un `proposal.md` sin cabecera, con `fuera-del-plan` y `motivo` vacío, **o sin `origen_cabecera`**,
   **no pasa el pre-push**. Con **rojo previo** que lo demuestre, uno por caso.
2. Los changes existentes tienen cabecera válida y **no cambian en nada más**: el `git diff` de esta
   tanda sobre ellos **sólo añade** líneas de cabecera.
3. Se escriben las **trece** cabeceras: ocho archivadas, `F0-01`, `F0-02`, `F0-03`,
   `orden-precedencia-guardas` y **`F0-04` con `cierra: no`** (§18). Con las trece, el barrido
   completo va en verde y la tarea 1 puede declararse hecha.
3b. El registro de F0-04 queda cerrado: su `Estado` deja de decir «pendiente de visto bueno», y sus
   **tres casillas** de rotación de secretos quedan **declaradas aparte**, con dueño (Gerencia),
   destino (`docs/runbooks/verificaciones-pendientes-F0.md:98-100`) y la frase explícita de que
   **archivar no las da por hechas**.
4. Las doce llevan `origen_cabecera: derivada-17/09`; la de F0-05, `declarada`. **Trece en total.**
5. La de `orden-precedencia-guardas` existe en **los dos árboles**, `main` y `f1b-10-r1`, cada uno
   con su casilla propia.
6. `npm run reconcile` sale con **código ≠ 0** si hay capacidad huérfana (comprobación 1) o cambio
   fuera del plan sin motivo (comprobación 3), y **0** en cualquier otro caso.
7. **Dos pasadas seguidas sin cambios en el árbol producen un `RECONCILIACION.md` IDÉNTICO**, de
   modo que su `git diff` **sea** la lista de desvíos nuevos. Requisito, no comodidad.
8. La comprobación 5 lee `packages/shared` —`estados.ts` y `transitions.ts`— y compara contra
   `cifras_ancladas` (`config.yaml:1187`). **No lee la documentación.**
9. **Al cerrar la tanda**, `reconcile` reporta: **18 capacidades · 9 specs · 0 huérfanas** ·
   **CINCO cambios fuera del plan** · **5 incumplimientos vivos** · **esperas 4 frente a 11,
   divergencia legítima** · **once ficheros de `docs/sdd` sin trackear**. Y el numerador en dos
   cifras: **4 derivables de cabecera y 7 declarados por commit, total 11 de 52** (§18).
   **Son 18 y no 17 porque `RQ-RC-09` declara `reconciliacion` en `capabilities` dentro de esta
   misma tanda**: la cifra la mueve el propio trabajo, y medirla contra el 17 de partida la volvería
   falsa el día que se comprueba. **Los 9 specs, en cambio, NO se mueven aquí**:
   `openspec/specs/reconciliacion/spec.md` todavía no existe al cerrar —las delta specs se funden en
   `sdd-archive`, no en `apply`—, así que pasan a **10** después de archivar y no antes.
   **Ninguno de los dos movimientos es una huérfana ni, por tanto, un defecto**: huérfana es spec sin
   declaración y esto es al revés, que es lo que ya fijan `RQ-RC-01` y el escenario de `RQ-RC-09`, de
   modo que la comprobación 1 sigue saliendo con **código 0**. Y las dos tablas —§3.2 y la de
   `RQ-RC-01`— **siguen diciendo 17 a propósito**, porque van ancladas a `ce93480`: renumerarlas a 18
   las volvería falsas sobre su propia revisión, que es el **caso B** de la regla de mutación 4.
10. La comprobación 2 marca **F0-02 como «sin verificar»** por la guarda (b) (§13.3). Es resultado
    esperado, no defecto.
11. Las **doce** entradas de `incumplimientos_vivos` llevan `estado`, y la prosa de IV-6 sigue en el
    fichero, en clave propia.
12. `unidad_de_avance` tiene **cuatro** reglas de lectura; las tres anteriores intactas.
13. `CLAUDE.md:423-434` define R-1 con **siete** campos.
14. **Nada de lo anterior modifica `transitions.ts`, `estados.ts` ni ningún fichero de `apps/desk/src`.**
15. **Barrido de la regla de mutación 4 como CIERRE**: esta tanda inserta líneas en
    `openspec/config.yaml` y en `CLAUDE.md`, los dos muy citados.
    `grep -rnoE "(config\.yaml|CLAUDE\.md):[0-9]+(-[0-9]+)?"` sobre el repositorio, **cada resultado
    comprobado contra el fichero** —leyendo qué afirma la frase, no sólo que la línea exista— y un
    segundo pase para las abreviadas. **Las 20 citas de este propio `proposal.md` entran en ese
    barrido**, porque no llevan ancla inline y se desfasarán con el `apply`.
    **Y el barrido va AL CERRAR CADA REBANADA, no una sola vez al final.** R1 ya inserta líneas en
    `CLAUDE.md` y en `openspec/config.yaml`: las 20 citas que hoy resuelven quedan desfasadas **antes**
    de que R2 empiece, y un barrido único al final mediría el desfase acumulado de las dos contra un
    documento que ya nadie ha vuelto a leer. **Con él va la medición de anclaje del criterio 16**, con
    el mismo `REVISION_RE` y nunca a ojo, sobre los artefactos que esa rebanada entregue.
16. **Las dos delta specs pasan el detector con CERO citas sin anclar.** Comprobado con el mismo
    `REVISION_RE` del detector antes de entregarlas: 5 anclas en `citas-verificables`, 19 en
    `reconciliacion`. **La primera pasada encontró CUATRO sin ancla** —el `` en `ce93480` `` se había
    ido a la línea siguiente al justificar el párrafo—, que es literalmente el modo de fallo de los 15
    bloqueantes. El criterio es que vuelva a comprobarse así, y no a ojo.

---

## 15 · Riesgos

| Riesgo | Mitigación |
|---|---|
| **La comprobación no puede ir en verde** mientras F0-04 no tenga cabecera | §13.1. **Es el riesgo vivo de esta tanda**, y su salida (a) es una excepción con caducidad escrita |
| **El `apply` roza el techo de 800** (≈795 estimadas) | §12: **dos rebanadas**, R1 «el contrato» y R2 «el barrido», cortadas por la dependencia del trabajo y no por el contador |
| `RECONCILIACION.md` no determinista | Criterio 7, con prueba de dos pasadas |
| La cabecera de `orden-precedencia-guardas` entra sólo en `main` y la fusión reintroduce el bloqueo | §5.1: casilla propia por árbol, no una nota |
| Renumerar el plan con `sed` y corromper `F1E` | §8.1: las trece ocurrencias van contadas y la trampa nombrada |
| **Una cabecera derivada se lea como declarada** | El séptimo campo, §4.0. Es la razón entera de que exista |
| La cabecera se crea comprobada por existir | §6: la forma se comprueba; el criterio, no. Las dos guardas lo dicen por escrito |

---

## 16 · Plan de reversión

Cada pieza revierte sola y ninguna deja estado: la comprobación de forma es un commit sobre
`citas/`, las cabeceras son líneas añadidas, `reconcile` es un script nuevo más una entrada en
`package.json`, y `RECONCILIACION.md` es generado. **La única reversión con coste es la segunda
copia de la cabecera de `orden-precedencia-guardas`**, que vive en otro árbol: si se revierte en
`main`, hay que revertirla también en `f1b-10-r1`, y por eso es tarea con casilla y no nota.

---

## 17 · Dependencias

- **`hook-citas-pre-push`** (archivada): el hook y la capacidad `citas-verificables`.
- ~~La respuesta a la pregunta de §13.1 sobre qué hacer con F0-04~~ — **RESUELTA**: salida **(c)**,
  obs. #746.
- ~~El `cierra` de F0-04~~ — **RESUELTO**: `cierra: no`, obs. #749 (§18).
- **Ninguna dependencia viva.** La propuesta queda cerrada y `sdd-spec` desbloqueada.
- ~~La fila F0-05 en el §5 y en la hoja «Tandas» del R01.3~~ — **SATISFECHA** por `ce93480` (§8).
- ~~El libro R01.3 versionado en git~~ — **nunca fue una dependencia**: está versionado desde
  `52e9ef7` (§8.2, corrección).
- **Que F1B-10 no vuelva al árbol principal** mientras F0-05 corre (§0, regla del ciclo 2).

---

## 18 · El `cierra` de F0-04 — **RESUELTO: `cierra: no`**

**Decisión de Gerencia, 17/09, obs. #749: salida (2).** F0-04 se queda en «declarados por commit»;
el numerador queda en **4 derivables de cabecera · 7 declarados por commit**, total **11 de 52**.

**Las tres razones:**

1. **Es la única que no afirma un hecho que nadie en el repositorio puede verificar.** Dice
   exactamente lo que la evidencia muestra: la fila pide tres cosas y dos están.
2. **Es reversible.** Si el staging existe, o si se decide que quedó superado, el `cierra` cambia
   después con su razón escrita y fechada. **(1) y (3) escriben una afirmación que el próximo
   barrido ya NO caza**, porque el registro existiría y la comprobación lo daría por bueno.
3. **La evidencia apunta fuerte a que nunca se levantó.** Un entorno sobre la VPS con PostgreSQL
   propio dejaría rastro en `DEPLOY.md`, en variables y en un runbook. **`DEPLOY.md` es donde este
   proyecto escribe el despliegue: la ausencia ahí no es un olvido de registro, es la señal.**

### 18.1 · El desvío NO queda huérfano: queda encolado

La ficha de la salida (2) objetaba que el desvío «nacería sin dueño porque esta tanda no rutea
destinos». **Esa pega está corregida, y por la propia R-3:** si algo no cabe en ninguna de las tres
salidas, **se queda como punto abierto CON DUEÑO** — que es una salida, no un limbo.

Así que el desvío entra en `docs/sdd/ENTRADA.md` como **E-013**, tipo hallazgo, dueño **Gerencia**,
fecha **2026-09-17**, y **la escribe esta tanda**. Va al final del fichero, así que no desplaza citas
y no hay barrido que hacer por ella.

**Que la tanda se coma su propia comida otra vez:** F0-05 construye la bandeja de entrada, y el
primer hallazgo que ella misma produce entra por la bandeja en vez de por una nota al margen.

### 18.2 · La salida (3) sigue disponible, y mejor hecha

**Retirar el staging del contenido de la fila por superado** —producción directa sobre la misma VPS,
sin entorno intermedio— **es legítimo**. No se toma hoy por una razón que su propia ficha ya decía:
exige que **se decida y se feche**. Tomarla ahora, **deducida de una ausencia**, sería hacerla
callando, y entonces el plan pierde contenido sin registro.

Se deja escrito para que quien la tome después sepa **que está disponible y por qué no se tomó hoy**.

---

### 18.3 · El registro de cómo se llegó aquí

La salida (c) de §13.1 quedó decidida y dos de sus tres obligaciones se cumplieron en el acto. La
tercera —decidir el `cierra` contra la fila— **no se dedujo**, y la cláusula «si no se deduce, se
para y se pregunta» se disparó. Esto es lo que se midió y lo que se preguntó.

**El estado exacto, medido:**

| Contenido de la fila (`plan:128`) | Evidencia en el repositorio |
|---|---|
| Pruebas del motor de transiciones | ✅ `apps/desk/server/permisos.test.ts` |
| CI con `test`, `typecheck`, `lint` | ✅ `.github/workflows/ci.yml` |
| **Staging sobre la VPS Hostinger con PostgreSQL** | ⛔ **cero trazas** en `DEPLOY.md`, en `docs/runbooks/` y en el repositorio entero |

**Dos tercios de la fila están hechos y verificados. Del tercero, el repositorio no dice ni que
exista ni que no**, y no es una casilla de secretos: es contenido de la fila.

### Las salidas

**(1) · El staging EXISTE y sólo le falta quedar escrito.** → `cierra: si`, y la tanda que cierra el
registro **documenta el staging en `DEPLOY.md`** en el mismo acto.
- **Toca:** `F0-04/proposal.md` (cabecera y `Estado`) y `DEPLOY.md`.
- **NO toca:** el numerador total, que sigue en 11 de 52; F0-04 sólo cruza de columna, a **5 y 6**.
- **Queda afirmando algo que no es verdad** si el staging no está realmente en pie: una fila cerrada
  sobre un entorno que nadie ha visto. **Sólo Gerencia puede confirmarlo: está fuera del repositorio.**

**(2) · El staging NO existe, y la fila está incompleta.** → `cierra: no`, y F0-04 se queda en
«declarados por commit».
- **Toca:** la cabecera de F0-04 y el numerador, que se queda en **4 y 7**.
- **NO toca:** `DEPLOY.md`, ni el total de 11 de 52.
- **Queda afirmando algo que no es verdad:** nada — pero abre un desvío nuevo, porque una fila del §5
  dada por cerrada por commit con contenido sin hacer **es exactamente lo que la comprobación 2 y su
  guarda (b) existen para enseñar**. Habría que registrarlo, y esta tanda no rutea destinos.

**(3) · El staging se retira del contenido de la fila**, por haber quedado superado —producción
sobre la misma VPS, sin entorno intermedio—. → `cierra: si`, sin documentar nada que no exista.
- **Toca:** el §5 del plan, `plan:128`. **Y eso está fuera del alcance de esta tanda** (§2), así que
  sería una segunda precondición documental como la de §8.
- **NO toca:** `DEPLOY.md` ni F0-04 más allá de su cabecera.
- **Queda afirmando algo que no es verdad:** nada, **si** la retirada se decide y se fecha. Si se
  hace callando, el plan pierde un contenido sin que quede registro de por qué.

**No la contesto.** Las tres dependen de un hecho que **no está en el repositorio** —si hay o no un
staging en pie sobre la VPS— y ese hecho sólo lo tiene Gerencia. Es, además, el mismo molde que la
comprobación 6 del barrido: algo que existe o no fuera del alcance de git y que nadie había escrito.
