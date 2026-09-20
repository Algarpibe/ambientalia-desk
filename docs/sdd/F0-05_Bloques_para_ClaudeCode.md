# Cómo entra esto en Claude Code — bloques listos para pegar

**Fecha:** 2026-09-17 · **Acompaña a:** `F0-05_Mecanismo_de_Reconciliacion.md` y `Brecha_Maestro_R08.2_2026-09-17.md`

## Paso a paso

Nueve pasos, media hora larga. Los dos primeros son tuyos; del 3 al 6 los puedo hacer yo si me lo dices.

---

### Paso 0 · El dictamen E-001 — **DECIDIDO EL 17/09: SÍ** ✓

Gerencia dictaminó que un trabajo que hace el contenido de una fila del §5 **cuenta como esa tanda**, aunque su carpeta se llame de otra manera. De ahí salen tres cosas, y ya están aplicadas o listas:

- **F1A-08 queda cerrada** por `tercera-puerta-orden-venta`. El avance pasa a **11 / 51**, peso **19 / 107** (17,8 %). El panel ya lo refleja.
- **R-1 va firme** en el bloque 1 de más abajo, sin condicional.
- **El retroajuste de los ocho archivados** queda ratificado: seis `fuera-del-plan`, uno F1A-08, y dos a F1B-08 en parte —que no mueven la cifra, porque esa fila sigue parcial—. El único matiz que queda abierto, y tampoco cambia ningún número, es si `por-entregar-es-espera` prefieres que sea `fuera-del-plan` en lugar de F1B-08.

Registro completo en `docs/sdd/ENTRADA.md`, entrada E-001. Clave Engram a cargar: `decision/tanda-por-contenido`.

### Paso 1 · Cierra las sesiones de Claude Code *(sólo tú, 1 minuto)*

Los pasos 3 y 4 tocan `CLAUDE.md` y `openspec/config.yaml`, que una sesión abierta tiene cargados. Dos escritores sobre el mismo fichero es exactamente el modo de fallo que este mecanismo existe para cazar; no lo estrenemos provocándolo.

### Paso 2 · Sitúate en la rama correcta *(1 minuto)*

`git status` debe decir `main`. Hoy `main` va **un commit por delante de `origin`** y tiene once ficheros de `docs/sdd` sin trackear — no hace falta resolverlo ahora, pero conviene saberlo antes de tocar nada.

### Paso 3 · `openspec/config.yaml`, cuatro ediciones **de abajo arriba**

De abajo arriba porque cada inserción desplaza las líneas siguientes; empezando por el final, los números que vienen después siguen valiendo.

| Orden | Línea | Qué | Bloque |
|---|---|---|---|
| 1.º | **1260** | Cambiar `R08.1` por «del documento maestro vigente (hoy R08.2…)» | 2.e |
| 2.º | **1135** | Insertar `PF-2` al final de `premisas_falsas_corregidas`, y detrás la clave nueva `cifras_ancladas` | 2.c y 2.d |
| 3.º | **374** | Sustituir la línea `destino:` de `IV-2`. **No borres la 375 (`reasignado:`)**: el histórico se conserva | 2.b |
| 4.º | **207** | Insertar las dos capacidades al final de `capabilities`, justo antes del comentario de `pending_migration` | 2.a |

La 1135 y la 207 son líneas en blanco entre bloques: ahí es donde entra el texto, respetando la indentación de dos espacios de las entradas hermanas.

### Paso 4 · Comprueba que el YAML sigue siendo YAML *(30 segundos)*

```bash
python -c "import yaml,sys; yaml.safe_load(open('openspec/config.yaml',encoding='utf-8')); print('YAML OK')"
```

Y que las cuentas han cambiado donde debían:

```bash
grep -c "^  - name:" openspec/config.yaml     # 15 → 17
grep -c "^  - id: PF-" openspec/config.yaml   # 1 → 2
grep -n "cifras_ancladas:" openspec/config.yaml
```

### Paso 5 · `CLAUDE.md`

Inserta el bloque 1 como sección `##` propia **justo antes de la línea 411, `## Contexto SDD`**. Ahí queda pegado a «Incumplimientos vivos», que es su vecino natural: la bandeja es adonde van a parar los desvíos que esa sección registra.

El bloque va tal cual: R-1 ya no lleva condicional, porque el dictamen del paso 0 la respalda.

### Paso 6 · Un commit, y que se note que es de método

```bash
git add CLAUDE.md openspec/config.yaml
git commit -m "docs(sdd): F0-05 — cabecera de proposal, dos capacidades huerfanas, PF-2 y cifras ancladas"
```

### Paso 7 · Abre la sesión con el prompt del bloque 3

Pégalo tal cual. Si el dictamen del paso 0 fue «sí», el gate que el propio prompt declara ya está cerrado y la sesión puede arrancar sin pararse.

### Paso 8 · Comprueba que ha llegado *(2 minutos, y no te lo saltes)*

Tres preguntas a la sesión recién abierta. Las tres tienen respuesta comprobable:

1. **«¿Qué dice la regla R-1 y de dónde la has sacado?»** — Si no la conoce, `CLAUDE.md` no se está cargando y el resto del mecanismo no existe.
2. **«¿Cuántas capacidades declara `config.yaml` y cuáles no tienen spec?»** — Debe decir **17** y nombrar las ocho sin spec. Si dice 15, está leyendo una copia vieja.
3. **«¿Cuál es el destino de IV-2?»** — Debe decir F1A-07. Si dice «punto abierto sin tanda», la edición del paso 3 no entró.

### Paso 9 · Lo que viene solo

El **lunes 21 a las 8:35** el primer parte medirá contra lo que haya quedado, y el panel se republicará con ello. Si los pasos anteriores están hechos, ese parte arranca limpio y la comparación del jueves ya es una comparación de verdad.

---

## El principio, primero

**Un documento no se «tiene en cuenta»: se convierte en un hecho dentro del fichero que la sesión ya lee.** Esa es exactamente la lección del informe de brechas —la §7.3 estuvo siete días sin destino *estando escrita*, y `citas-verificables` nació sin que `capabilities` se enterara—. Pasarle a Claude Code el informe como lectura obligatoria repetiría el fallo en vez de cerrarlo.

Hay tres canales, y cada uno sirve para una cosa distinta:

| Canal | Qué carga | Cuándo se lee | Qué poner ahí |
|---|---|---|---|
| **`CLAUDE.md`** (raíz del repo) | Reglas invariables | Cada sesión y cada sub-agente, automáticamente | Las **reglas** permanentes: cabecera del proposal, regla de las tres salidas, punteros |
| **`openspec/config.yaml`** | Estado del proyecto | El preflight del orquestador | Los **hechos**: capacidades, IV, premisas falsas, cifras ancladas |
| **Prompt de arranque** (§4.3 del plan) | La tanda concreta | Una vez, al abrir la sesión | El **encargo** de F0-05 |

Los hallazgos del informe se reparten así: los que son corrección de registro van al canal 2 y ya está; los que exigen decisión tuya **no entran en ningún canal todavía** —entran cuando decidas—, porque meterlos antes es inventar destino, que es el error que el propio informe documenta.

| Hallazgo | Canal | Estado |
|---|---|---|
| E-002 · dos specs huérfanas | `config.yaml → capabilities` | Bloque 2.a, listo |
| E-006 · destino caduco de IV-2 | `config.yaml → incumplimientos_vivos` | Bloque 2.b, listo |
| E-004 · servicio en sitio | `config.yaml → premisas_falsas_corregidas` (PF-2) | Bloque 2.c, listo |
| E-007 · esperas 4 / 11 | `config.yaml → cifras_ancladas` (clave nueva) | Bloque 2.d, listo |
| E-001 · dictamen de tanda | `CLAUDE.md` | **Decidido el 17/09** · bloque 1, listo |
| E-003 · `catalogo-equipos` | — | Decisión de alcance. No entra hasta que decidas |
| E-005 · par IV-4 / IV-11 | — | Decisión de alcance. No entra hasta que decidas |
| E-008 · ocho puntos del Anexo D | — | Triaje tuyo, punto a punto |

---

## Bloque 1 · Para `CLAUDE.md`

Añádelo como sección propia. Es corto a propósito: `CLAUDE.md` se carga entero en cada sesión y cada línea cuesta.

```markdown
## Reconciliación y bandeja de entrada (F0-05, 17/09/2026)

Mecanismo completo: `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md`. Tres reglas.

**R-1 · Cabecera obligatoria del proposal.** Todo `openspec/changes/<nombre>/proposal.md`
empieza con este YAML, antes de cualquier prosa:

    ---
    tanda: F1A-08                 # ID del §5 del plan, o el literal `fuera-del-plan`
    motivo: ""                    # obligatorio y NO vacío si tanda es `fuera-del-plan`
    capacidad: [remisiones, tickets-core]
    maestro: ["M4.4", "nº 52"]    # pasajes que lo justifican; [] si ninguno
    toca_maestro: si              # si | no — ¿queda el maestro desactualizado al terminar?
    ---

Un cambio que realiza el contenido de una fila del §5 LLEVA SU ID. Si no lo lleva, es
trabajo fuera del denominador de avance y tiene que declararlo con motivo escrito.
Precedentes que esta regla cierra: `tercera-puerta-orden-venta` es F1A-08 y no lo dice;
`citas-verificables` nació como capacidad entera sin fila y sin entrada en `capabilities`.

**R-2 · Toda capacidad nueva se declara.** Si un cambio crea `openspec/specs/<nombre>/spec.md`,
en el mismo cambio se añade `<nombre>` a `openspec/config.yaml → capabilities`. Una spec que no
está en `capabilities` no la carga el preflight: existe y es invisible.

**R-3 · La bandeja tiene tres salidas y ninguna más.** Las ideas, correcciones y hallazgos
entran por `docs/sdd/ENTRADA.md`. Toda entrada acaba en EXACTAMENTE UNO de tres sitios: una
fila del §5 del plan, un punto abierto del Anexo D con dueño y fecha, o un pasaje del
expediente R08.x. Si no cabe en ninguno, hay una decisión de alcance pendiente y se queda como
punto abierto CON DUEÑO — nunca en el aire. No se inventa destino: asignar una épica de memoria
es lo que dejó cuatro desvíos huérfanos al cerrar F1A.
```

> **R-1 está respaldada por decisión de Gerencia del 17/09** (E-001, `decision/tanda-por-contenido`): un trabajo cuenta como la tanda cuyo contenido realiza. La cabecera es lo que lo hace comprobable.

---

## Bloque 2 · Para `openspec/config.yaml`

### 2.a · Dos capacidades que faltan (E-002)

Al final de la lista `capabilities:`

```yaml
  - name: citas-verificables
    covers: >
      Línea base de citas verificables, detector (apps/desk/server/citas/cli.ts) y hook
      de pre-push. Su incumplimiento vivo es IV-10.
    status_at_start: "nueva — nacida el 2026-09-15 en hook-citas-pre-push"
    declarada_en: >
      2026-09-17, corrección de registro. La spec existía desde el 15/09 y esta lista no
      la recogía, así que el preflight no la cargaba. Ver E-002 de docs/sdd/ENTRADA.md.

  - name: vistas-tablero
    covers: >
      Vistas de listado del tablero: «Todos», clasificación por ESTADOS_EN_ESPERA y
      paridad con Zoho Desk.
    status_at_start: "nueva — nacida el 2026-09-10 en vista-todos-y-estados-en-espera"
    declarada_en: "2026-09-17, corrección de registro. Ver E-002 de docs/sdd/ENTRADA.md."
```

### 2.b · Destino caduco de IV-2 (E-006)

Sustituye la línea `destino:` de la entrada `IV-2` por estas dos claves. **No borres el texto anterior**: se conserva como histórico, igual que se hizo con IV-4.

```yaml
    destino: "F1A-07 · IV-2 · Fechas derivadas impuestas por el servidor"
    reasignado_2026_09_17: >
      CORRECCIÓN DE REGISTRO. El destino anterior —«PUNTO ABIERTO PARA GERENCIA — sin tanda,
      y a propósito»— fue CIERTO hasta el 10/09 y es FALSO desde entonces, y llevaba siete
      días diciendo lo contrario de lo que dice el plan. Lo que cambió: `decision/iv2-fechas-
      derivadas` cerró la disyuntiva el 10/09 con la opción (a) —el servidor calcula las tres
      fechas derivadas e IGNORA lo que llegue del navegador, con la zona horaria fijada de
      forma explícita— y el plan abrió F1A-07 para construirla (§4.5 y §5).
      LA LECCIÓN, que vale más que la entrada: este fichero PUEDE ESTAR CADUCO también en la
      dirección optimista. Se sabía que un destino podía nombrar una épica cerrada; ahora
      consta que un «sin destino» puede sobrevivir a la decisión que le dio uno.
```

### 2.c · Premisa falsa nº 2 (E-004)

Al final de `premisas_falsas_corregidas:`

```yaml
  - id: PF-2
    corregida_en: "docs/sdd/Brecha_Maestro_R08.2_2026-09-17.md §2.1"
    fecha: "2026-09-17"
    afecta_a: ["decision/habilitar-servicio-sin-remision", "F1B-03"]
    premisa_del_baseline: >
      Al cerrar «Habilitar Servicio nunca sin remisión» (docs/sdd/Decisiones_Gerencia_
      2026-09-10.md §7.3) se dio salida al servicio en sitio suponiendo que «en el plan hay
      descrito la necesidad de crear un nuevo flujo de trabajo para este tipo de servicios».
    verificacion: >
      FALSA, por los dos lados. (1) `grep -ci "en sitio"` sobre
      docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md devuelve 0: ninguna fila, ningún
      gate, ninguna mención. (2) El maestro dice lo contrario de lo que la premisa supone —M1.6b,
      nota del revisor [R08]: el servicio en sitio «hoy no está en el alcance y no hay mapeo
      as-is de él», entra «como línea a explorar, no como flujo a construir». Punto abierto nº 43.
    correccion: >
      La guarda de remisión NO admite excepción por servicio en sitio, porque la rama a la que
      esa excepción derivaría no existe ni está planificada. Mientras nº 43 no se decida, un
      servicio en sitio no tiene ruta en Desk 2.0, y ninguna tanda puede prometer que «va por
      el flujo de servicio en sitio». Si nº 43 se decide que sí, el maestro exige levantar
      primero su as-is —el orden que siguieron las otras tres ramas—, y eso es una tanda de
      campo que hoy no existe en el plan.
```

### 2.d · Cifras ancladas — clave nueva (E-007)

Va como clave de primer nivel, junto a `premisas_falsas_corregidas` y `unidad_de_avance`.

```yaml
# Números que el documento maestro fija a mano y que el código puede haber movido sin que
# nadie lo note. Los recomprueba la comprobación 5 de `npm run reconcile`
# (docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md). Divergir NO siempre es un error: la clave
# `divergencia` dice qué significa en cada caso, y esa distinción es la mitad del valor.
cifras_ancladas:
  - id: esperas
    maestro: "4 — M1.3.4 y glosario del Anexo E («Estado de espera … Hay cuatro»)"
    codigo: >
      DOS registros, no uno. packages/shared/src/estados.ts declara `ESTADOS_EN_ESPERA` (ONCE:
      5 externa + 6 interna) y `ESTADOS_SIN_SALIDA` (los CUATRO de M1.3.4), con el discriminador
      escrito y una prueba de coherencia en estados.test.ts.
    divergencia: >
      EL CÓDIGO VA POR DELANTE DEL MAESTRO, y ése es todo el desvío. Medido el 2026-09-17 contra
      estados.ts: el código ya distingue los dos criterios —espera externa frente a sin salida de
      emergencia—, los declara por separado y razona por qué `Liberación Comercial` y `Remisión
      creada` no entran en los cuatro pese a tener salida única. Quien no lo ha recogido es el
      maestro, cuyo glosario sigue definiendo «estado de espera» como los cuatro. Material de
      CLASE A para la R08.4; NO es un hueco de planificación.
      LO QUE SÍ SIGUE ABIERTO: `decision/c7-reloj-sla` (F1C-06) no puede adoptar ninguno de los dos
      registros —el comentario de ESTADOS_EN_ESPERA avisa de que «es la lista de la VISTA; el reloj
      del SLA no la lee»— y tiene que decidir el suyo. Y `Pendiente` es el único de los 21 estados
      bajo «sin clasificar», esperando a Servicio Técnico desde el 11/09.
      POR QUÉ ESTA ENTRADA EXISTE, aunque su divergencia sea legítima: la primera redacción del
      informe de brechas afirmó que nadie había escrito la distinción, y el error salió de leer
      este config.yaml en vez del código. Esta comprobación lee `packages/shared`.
  - id: pasos_del_mapa
    maestro: "38 — M1.3, ya marcado «en revisión» en la R08.2 con su hipótesis escrita"
    codigo: "transiciones con botón de transitions.ts + las 2 sin botón de estadoPorRemision.ts — 36 el 2026-09-08"
    divergencia: >
      ERROR PENDIENTE. La R08.2 ya lo declara y aventura que el mapa cuenta CAMINOS y no
      transiciones. Lo cierra F1A-06 al generar el mapa desde el código: es la única cosa que
      lo zanja con un número en vez de con una hipótesis.
  - id: transiciones
    maestro: "34"
    codigo: "cuenta de transiciones en packages/shared/src/transitions.ts"
    divergencia: "ERROR si difiere. No hay criterio alternativo que lo justifique."
  - id: estados
    maestro: "21"
    codigo: "cuenta de estados en packages/shared/src/estados.ts"
    divergencia: "ERROR si difiere. No hay criterio alternativo que lo justifique."
```

### 2.e · Una errata que sale de paso

`config.yaml → rules.proposal` dice: *«Cada propuesta cita el apartado del documento maestro **R08.1**…»*. La revisión vigente es la **R08.2** y la R08.3 está en expediente. Toda propuesta escrita desde entonces ha citado una revisión que ya no manda. Corregir a «del documento maestro vigente (hoy R08.2; ver `docs/sdd/R08.3_Expediente_de_cambios.md` para lo que ya está superado)».

---

## Bloque 3 · Prompt de arranque de F0-05

Formato del §4.3 del plan. Pégalo tal cual. Está al día al 17/09: recoge el dictamen ya tomado y descuenta lo que Gerencia aplicó esa tarde.

```
Tanda: F0-05-mecanismo-de-reconciliacion
Fase/épica: Fase 0 · Cimientos SDD (tanda de método, no de producto — como F0-01 a F0-04)
Capacidad: ninguna de producto. Toca el hook de pre-push, los changes archivados y añade
un script de repositorio.

Hazlo con SDD. Antes de proponer, recupera contexto con Engram (mem_context y mem_search
"reconciliacion") y lee el encargo entero.

Fuente: docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md (el encargo: tres piezas, nueve
tareas) y docs/sdd/Brecha_Maestro_R08.2_2026-09-17.md (de dónde salen los casos). La
decisión que lo abre es decision/tanda-por-contenido, 2026-09-17, registrada como E-001 en
docs/sdd/ENTRADA.md: un trabajo cuenta como la tanda cuyo contenido realiza, aunque su
carpeta se llame de otra manera.

YA ESTÁ HECHO Y NO SE VUELVE A HACER. Gerencia lo aplicó el 17/09. Compruébalo antes de
proponer y NO lo repitas ni lo reescribas:
- CLAUDE.md lleva la sección «Reconciliación y bandeja de entrada» con R-1, R-2 y R-3.
- openspec/config.yaml: citas-verificables y vistas-tablero declaradas (17 capacidades,
  cero huérfanas); destino de IV-2 → F1A-07; PF-2 en premisas_falsas_corregidas; clave
  nueva cifras_ancladas; rules.proposal ya no cita la R08.1.
- docs/sdd/ENTRADA.md existe y está sembrada con once entradas.
- La tarea programada del parte (lunes y jueves) vive fuera del repositorio.

Objetivo: lo que falta, que es todo lo ejecutable.
1. Comprobación de forma en el hook de pre-push que hook-citas-pre-push ya dejó instalado:
   todo openspec/changes/<nombre>/proposal.md tiene la cabecera de R-1 con sus seis campos,
   y `motivo` no vacío cuando `tanda` es `fuera-del-plan`. Si falla, el push no sale.
2. Retroajuste de los ocho changes de openspec/changes/archive/ con su cabecera. El reparto
   lo ratificó Gerencia y está en el paso 0 de docs/sdd/F0-05_Bloques_para_ClaudeCode.md:
   seis `fuera-del-plan` con motivo escrito; `tercera-puerta-orden-venta` → F1A-08 con
   `cierra: si`; `vista-todos-y-estados-en-espera` y `por-entregar-es-espera` → F1B-08 con
   `cierra: no`.
3. Regla (d) de unidad_de_avance en config.yaml: el numerador se publica con el motivo de
   su cambio, `por trabajo` o `por dictamen`. Las tres reglas que ya hay no se tocan.
4. Las dos guardas del autocertificado (Pieza 1 del encargo): el archive-report.md de todo
   cambio con `tanda:` declara en UNA línea qué parte del contenido de esa fila cubrió y
   qué dejó fuera; y la comprobación 2 marca «sin verificar» toda fila dada por cerrada
   cuya `maestro:` no cite ninguna de las fuentes que el §5 declara para ella.
5. `npm run reconcile`: escribe docs/sdd/RECONCILIACION.md con las seis comprobaciones del
   encargo, con su fecha y su commit.

Fuera de alcance: cambiar el §5 del plan, decidir destinos de IV o de entradas de
ENTRADA.md, tocar código de producto, y reescribir el contenido de los changes archivados
—a los ocho se les AÑADE cabecera y nada más—. Esta tanda no arregla ningún desvío: los
hace visibles.

Gates: ninguno abierto. decision/tanda-por-contenido está cerrada y es la que sostiene R-1.
Cárgala en Engram si no está.

OJO A UN HUECO DEL PROPIO ENCARGO, y resuélvelo en la propuesta en vez de esconderlo: el
numerador NO es derivable sólo de las cabeceras. De las once tandas cerradas, diez lo están
por commits anteriores a esta tanda (F0-00 a F0-04, F1A-01/02/04/05, F1B-01) y no tienen
change archivado con cabecera; sólo F1A-08 lo tiene. La comprobación 2 debe publicar por
tanto DOS cifras y no una —cierres derivables de cabecera, y cierres declarados por
commit—, y listar los segundos por su nombre. Inventar una cabecera retroactiva para esos
diez sería fabricar evidencia; contarlos sin decirlo, esconder de dónde sale el número.

Criterios de aceptación mínimos (amplíalos en la spec):
- Un proposal.md sin cabecera, o con `fuera-del-plan` y `motivo` vacío, no pasa el
  pre-push. Con rojo previo que lo demuestre.
- Los ocho changes archivados tienen cabecera válida y no cambian en nada más: el git diff
  de esta tanda sobre archive/ sólo añade líneas de cabecera.
- `npm run reconcile` sale con código ≠ 0 si hay una capacidad huérfana (comprobación 1) o
  un cambio fuera del plan sin motivo (comprobación 3), y con 0 en cualquier otro caso.
- Dos pasadas seguidas sin cambios en el árbol producen un RECONCILIACION.md IDÉNTICO, de
  modo que su git diff SEA la lista de desvíos nuevos. Es requisito, no comodidad.
- La comprobación 5 lee packages/shared —estados.ts y transitions.ts— y compara contra
  cifras_ancladas. NO lee la documentación: el 17/09 un hallazgo salió falso por fiarse de
  config.yaml, y está escrito en la propia entrada `esperas`.
- Contra el árbol de hoy, reconcile reporta: 17 capacidades declaradas · 9 specs · 0
  huérfanas · 1 tanda cerrada derivable de cabecera y 10 declaradas por commit · 7 cambios
  fuera del plan · 5 incumplimientos vivos · esperas 4 frente a 11, divergencia legítima.
- Nada de lo anterior modifica transitions.ts, estados.ts ni ningún fichero de apps/.

Reglas invariables: las de CLAUDE.md, incluidas las tres nuevas. Presenta la propuesta y
espera mi aprobación antes de la spec.
```

## Orden de aplicación

1. ~~Dictamen E-001~~ — **hecho el 17/09: sí.**
2. ~~Los cuatro bloques de `config.yaml` y la errata~~ — **aplicados el 17/09.** YAML validado; 17 capacidades, cero huérfanas.
3. ~~El bloque 1 en `CLAUDE.md`~~ — **aplicado el 17/09**, sección propia antes de «Contexto SDD», con el campo `cierra` incluido.
4. **Tú:** revisar con `git diff` y commitear los dos ficheros. Vinieron limpios, así que `git checkout --` los revierte si algo no cuadra.
5. **Claude Code:** el prompt del bloque 3.
6. **El lunes 21 a las 8:30** el primer parte medirá contra lo que haya entonces.
