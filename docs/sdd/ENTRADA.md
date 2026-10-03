# ENTRADA — bandeja de ideas, correcciones y hallazgos

Abierta el 2026-09-17 por decisión de Gerencia. Mecanismo en `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md`.

**Cómo se usa.** Se añade una entrada al final, con el siguiente número libre. No se borra ninguna: una entrada cerrada se marca, con su destino escrito. El fichero es el histórico de por dónde entró cada cosa.

**La regla dura.** Toda entrada acaba en **exactamente uno** de tres sitios: una fila del §5 del plan, un punto abierto del Anexo D con dueño y fecha, o un pasaje del expediente R08.x. Si no cabe en ninguno, hay una decisión de alcance pendiente y la entrada se queda como punto abierto **con dueño**, nunca en el aire.

**Estados.** `nueva` → `triada` (tiene destino propuesto) → `ruteada` (el destino la ha aceptado y está escrito ahí) → `cerrada`.

**Plantilla.**

```markdown
## E-0NN · AAAA-MM-DD · idea | correccion | decision | hallazgo
**Qué:** una frase, no un párrafo.
**De dónde viene:**
**Afecta a:**
**Estado:** nueva
**Destino:** —
```

---

## E-001 · 2026-09-17 · decision · **CERRADA**
**Qué:** Dictaminar si un trabajo que hace el contenido de una fila del §5 cuenta como esa tanda, aunque su carpeta se llame de otra manera.
**De dónde viene:** informe de brechas del 17/09, §2.3
**Afecta a:** el numerador del avance y la cabecera de la Pieza 1 de F0-05
**Estado:** cerrada
**DECISIÓN DE GERENCIA, 2026-09-17 — SÍ.** Textual: «damos F1A-08 por cerrada, aunque la carpeta se llame de otra manera. F1A-08 queda cerrada, el avance pasa a 11 de 51, y de ahora en adelante cada carpeta nueva escribe en su primera línea a qué trabajo del plan corresponde —o dice "a ninguno", y por qué».
**Consecuencias, las tres:**
1. **F1A-08 cerrada** por `tercera-puerta-orden-venta` (`79cf09b`, archivado el 17/09). Avance: **11 / 51**, peso **19 / 107** (17,8 %).
2. **R-1 queda firme** y sin condicional en `CLAUDE.md`: la cabecera `tanda:` es obligatoria, y `fuera-del-plan` exige `motivo:` no vacío.
3. **Retroajuste de los ocho archivados**, ratificado con la decisión: seis son `fuera-del-plan` (`cerrar-hallazgos-revision-f1b-01`, `mensaje-422-cliente-duplicado`, `reasignar-desvios-huerfanos`, `hook-citas-pre-push`, `detector-citas-extremos`), uno es **F1A-08** (`tercera-puerta-orden-venta`) y dos van a **F1B-08 en parte** (`vista-todos-y-estados-en-espera` y `por-entregar-es-espera`) — **F1B-08 sigue parcial y el numerador no se mueve por ellas**. Si Gerencia prefiere `por-entregar-es-espera` como `fuera-del-plan`, es el único punto que queda por matizar y tampoco cambia ninguna cifra.
**Clave Engram a cargar:** `decision/tanda-por-contenido`.

## E-002 · 2026-09-17 · hallazgo
**Qué:** `citas-verificables` y `vistas-tablero` tienen spec viva y no están declaradas en `config.yaml → capabilities` ni en el plan.
**De dónde viene:** informe de brechas del 17/09, §2.4
**Afecta a:** `openspec/config.yaml`; el preflight de cada sesión no las carga
**Estado:** triada
**Destino:** corrección de registro — declararlas en `capabilities`. No necesita tanda

## E-003 · 2026-09-17 · hallazgo · **REPLANTEADA EL 18/09**
**Qué:** `catalogo-equipos` es capacidad declarada (354 equipos sembrados, `diagnostico-checklist` depende de ella) y no tiene ni una fila en el plan.
**De dónde viene:** informe de brechas del 17/09, §2.2
**Afecta a:** toda la épica F1D, que cuelga de ella
**Estado:** triada
**Destino:** decisión de alcance — tanda propia o absorción declarada por F1D-01

**CORRECCIÓN DE GERENCIA, 18/09 — LA PREGUNTA ESTABA MAL PLANTEADA, NO SÓLO MAL ESCRITA.** Textual:
«En realidad lo que hay son tres cosas: 1. Equipos: donde se alojan las hojas de vida. Hay un equipo por
número de serie, y se corresponden a una marca, modelo, tipo, cliente y estado. A estos equipos se accede a
través de "Registro de equipos". 2. Catálogo de equipos: son 29 modelos donde se detalla marca, modelo, tipo,
nombre, categoría y SKU, y donde se aloja una ficha de cada uno de los equipos. 3. Catálogo de inspección:
que es la tercera variante, que consiste en el árbol que hay que revisar en un determinado equipo.»

**Verificado contra el código el 18/09, y la distinción es correcta:** el esquema ya separa (1) de (2) —
`apps/desk/server/db/catalogo.ts:101` consulta `equipos` por `modelo_id`, `:195` inserta en `catalogo_modelos`,
y `catalogoArticulos.ts:50,86,215-221` lleva SKU y categorías **por modelo**, no por equipo. La bisagra con (3)
es la columna `catalogo_modelos.revisar` (`catalogo.ts:87`), que marca qué modelos llevan inspección.
Quien no hacía la distinción era **el registro**: `config.yaml:154` metía (1) y (2) en una sola capacidad.

**Consecuencias, las tres:**
1. **`openspec/config.yaml` corregido** el 18/09 bajo `catalogo-equipos`, con la precisión textual de Gerencia
   y las rutas que la verifican. Sin borrar el `covers` anterior: queda el histórico y qué lo superó.
2. **Lo que falta en el §5 no es una fila, sino posiblemente dos** — una por cada entidad. Devuelto al panel
   como **dos** preguntas (`e003-catalogo-equipos` y `e003b-registro-equipos`), que pueden tener respuesta
   distinta: una puede estar terminada y la otra no.
3. **Cifra en duda, y bloquea a las otras dos:** el registro declara **35** modelos (siembra del 07/08, ya
   marcada entonces como «cifra NO reverificada») y Gerencia dice **29**. No se dirime desde el repositorio —
   el dato vive en la base de la VPS. Anotado en `config.yaml` como `cifra_en_duda_2026_09_18` y devuelto como
   tercera pregunta (`e003c-recuento-modelos`). Hasta el recuento, **ninguna de las dos cifras es citable**.

**ADENDA 21/09 — RESPUESTA DE GERENCIA A `e003c-recuento-modelos`, 17/09, TEXTUAL:** «En este momento hay 29».
Aterrizó en `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e003c-recuento-modelos`) y en `capabilities` →
`catalogo-equipos` → `cifra_de_gerencia_2026_09_17`. Cifra **declarada**, no medida por la supervisión. Las otras dos
preguntas (`e003-catalogo-equipos`, `e003b-registro-equipos`) **siguen sin respuesta**: esta entrada sigue `triada`.
**Clave Engram a cargar:** `decision/e003c-recuento-modelos`.

## E-004 · 2026-09-17 · decision
**Qué:** Servicio en sitio: el plan NO lo contempla (`grep -ci "en sitio"` = 0) y el maestro lo deja fuera de alcance como «línea a explorar» (M1.6b, nº 43). La salida que se le dio el 10/09 se apoyaba en una premisa falsa.
**De dónde viene:** informe de brechas del 17/09, §2.1
**Afecta a:** la guarda `habilitar-servicio-sin-remision`, que se aprobó sin excepción porque la excepción iba a un flujo inexistente
**Estado:** triada
**Destino:** Anexo D nº 43 (ya existe, sin dueño con fecha) + registrar **PF-2** en `premisas_falsas_corregidas`

## E-005 · 2026-09-17 · decision · **DECIDIDA 21/09 — CERRADA, y abre dos preguntas (adenda del 22/09, al final)**
**Qué:** IV-4 e IV-11 son un par: la tercera puerta impide el duplicado, y el sync puede dejar la fila incoherente igualmente (`orden_venta` en `TICKET_COLS`, `salesorder_id` fuera). Elegir salida (a) `managed_by_app` o (b) meter `salesorder_id` en `TICKET_COLS`.
**De dónde viene:** informe de brechas del 17/09, §2.8
**Afecta a:** dar IV-4 por cerrado en producción
**Estado:** cerrada — la salida elegida es la (c); quedan abiertas `e005b-parche-vehiculo` y `e005c-discrepancia-sin-espejo`
**Destino:** **F1B-11, con un parche antes** (`decision/e005-iv4-iv11`, 21/09). El vehículo del parche en el plan está por decidir

## E-006 · 2026-09-17 · correccion
**Qué:** El `destino` de IV-2 en `config.yaml` sigue diciendo «sin tanda, y a propósito» cuando el plan lo rutea a F1A-07 con clave `iv2-fechas-derivadas` desde el 10/09.
**De dónde viene:** informe de brechas del 17/09, §2.8
**Afecta a:** `openspec/config.yaml`
**Estado:** triada
**Destino:** corrección de registro. No necesita tanda

## E-007 · 2026-09-17 · hallazgo
**Qué:** El código declara DOS registros —`ESTADOS_EN_ESPERA` (once) y `ESTADOS_SIN_SALIDA` (los cuatro de M1.3.4)— con su discriminador escrito; el maestro sólo conoce uno y su glosario define «estado de espera» como los cuatro. **Corregido el 17/09 contra `packages/shared/src/estados.ts`:** la primera redacción decía que nadie lo había escrito, y es falso. C3 / nº 31 está bien dimensionado y F1C-03 no corre peligro. Lo que queda abierto: C7 (`decision/c7-reloj-sla`, F1C-06) no puede adoptar ninguno de los dos registros —el propio código avisa de que el reloj del SLA no lee la lista de la vista— y `Pendiente` sigue siendo el único de los 21 estados sin clase.
**De dónde viene:** informe de brechas del 17/09, §2.6, corregido el mismo día
**Afecta a:** la R08.4 (clase A) · F1C-06 (25/09) · la clasificación de `Pendiente`, pendiente de Servicio Técnico desde el 11/09
**Estado:** triada
**Destino:** pasaje del expediente R08.x (el maestro va por detrás) + entrada en `cifras_ancladas`. **Ya no espera fecha: la decide Gerencia en el panel**

## E-008 · 2026-09-17 · hallazgo
**Qué:** Ocho puntos del Anexo D que tocan Fase 1 no aparecen en el plan: 3, 7, 9, 43, 47, 53, 56, 61. Los tres con vencimiento cercano son el 56 (bloquea F1D-07, S47), el 47 (bloquea F1D-06, S46) y el 53 (el informe trimestral cuelga de la convención de subOV ya decidida).
**De dónde viene:** informe de brechas del 17/09, §2.7
**Afecta a:** el plan §5 y la tabla de gates
**Estado:** triada
**Destino:** triaje de Gerencia, punto a punto

## E-009 · 2026-09-17 · hallazgo
**Qué:** Ocho de las quince capacidades declaradas no tienen spec. Siete tienen tanda que la escribiría; `catalogo-equipos` y `kpis` no.
**De dónde viene:** informe de brechas del 17/09, §2.5
**Afecta a:** la trazabilidad del avance por capacidad
**Estado:** triada
**Destino:** ver E-003 (catalogo-equipos); `kpis` es Fase 2 por declaración de `config.yaml`

## E-010 · 2026-09-17 · hallazgo
**Qué:** Punto abierto nº 61 —mecanismo de incorporación de decisiones— ya se cobró una pieza: el R08.3 §B.3 registra que siete gates que R01.2 fechaba el 11/09 no tienen decisión escrita y siguen pendientes.
**De dónde viene:** informe de brechas del 17/09, §2.7
**Afecta a:** siete gates previstos para el 11/09
**Estado:** triada
**Destino:** Anexo D nº 61, con dueño y fecha. Esta bandeja es media respuesta al propio punto

## E-011 · 2026-09-17 · hallazgo
**Qué:** La decisión E-001 tiene tres costes que no se nombraron al proponerla. (1) **Cobertura parcial:** un cambio puede hacer contenido de una fila sin terminarla —`vista-todos-y-estados-en-espera` sobre F1B-08—, así que la cabecera necesita un campo `cierra: si|no` y el numerador cuenta sólo los `si`. (2) **El numerador se mueve por dos razones:** el 17/09 pasó de 10 a 11 por dictamen, no por trabajo; cada corte debe publicar el motivo del cambio, igual que el denominador va fechado. (3) **La afirmación es autocertificada:** el `tanda:` lo escribe quien hace el trabajo y `verify: pass` sólo prueba que cumplió su propio `tasks.md`, no la fila del plan.
**De dónde viene:** revisión de la propia decisión E-001, el mismo día
**Afecta a:** la Pieza 1 de F0-05 y la regla de avance de `unidad_de_avance`
**Estado:** triada
**Destino:** contenido de **F0-05**, ya escrito en `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md` (campo `cierra`, regla (d) del avance, y las dos guardas de las tareas 5b y 5c). No necesita decisión: son consecuencias de una decisión ya tomada

## E-012 · 2026-09-17 · hallazgo
**Qué:** La lista `incumplimientos_vivos` de `openspec/config.yaml` **mezcla vivos y cerrados**, así que
**contar entradas no da el número de desvíos vivos**: hoy tiene **doce** entradas y los vivos son **cinco**. Y lo que hace
frágil el recuento no es la mezcla, es **cómo se distingue**: el campo `estado` existe sólo en los CERRADOS, de modo
que «vivo» se deduce de que **falte una línea**. Un barrido que cuenta ausencias miente en cuanto alguien añade una
entrada y se olvida del campo. Medido el 2026-09-17: seis con `estado: CERRADO` (IV-1, IV-3, IV-4, IV-5, IV-7,
IV-10), uno con `estado` **en prosa** (IV-6, cerrado por F1B-01 según el comentario de cabecera) y cinco **sin el
campo**, que son los vivos (IV-2, IV-8, IV-9, IV-11, IV-12).

**Dos afirmaciones caducas que el contraste destapó, y que NO se resuelven aquí** porque reclasificar un desvío no es
mecánico: (1) el comentario de cabecera de `incumplimientos_vivos` da **IV-4 por punto abierto** («IV-2 e IV-4 →
PUNTOS ABIERTOS: ninguna tanda los cubre») cuando su entrada dice ya `estado: CERRADO`, cerrado por
`tercera-puerta-orden-venta`; (2) **IV-2 dice dos cosas según dónde se mire** — su entrada lleva
`destino: F1A-07` desde el 17/09, pero ese mismo comentario y la fila de `CLAUDE.md` siguen diciendo que
«ninguna tanda lo cubre». **Ninguna de las dos mueve el número de vivos**, y las dos las cazaría la comprobación 4 una
vez escrita: son exactamente el molde que este hallazgo describe.

**De dónde viene:** la ronda de preguntas de F0-05, al comprobar que la comprobación 4 no puede contar entradas. La
clasificación vivo/cerrado se contrastó contra el comentario que el propio fichero ya lleva y **coincide**: cinco, y los
mismos cinco que nombra `CLAUDE.md`.
**Afecta a:** la comprobación 4 de `npm run reconcile` y el registro `incumplimientos_vivos` de `openspec/config.yaml`
**Estado:** triada
**Destino:** contenido de **F0-05**. El campo `estado` se escribe en las **doce** entradas, vivas incluidas, para que
«vivo» quede **escrito y no deducido**. IV-6 es el único no mecánico —su `estado` es hoy prosa—: el valor pasa a
`CERRADO` y **la prosa se conserva en una clave propia**, porque este fichero tiene por cultura conservar el registro.
Las dos afirmaciones caducas de arriba quedan **anotadas y paradas**: no son de esta tanda

## E-013 · 2026-09-17 · hallazgo · **CERRADA 21/09** (adenda del 22/09, al final)
**Qué:** La fila **F0-04** del §5 pide **tres** cosas y sólo **dos** se verifican en el repositorio.
`plan:128` pide «completar las pruebas del motor de transiciones …; **staging sobre la VPS Hostinger con
PostgreSQL**; CI que ejecuta `test`, `typecheck` y `lint`». Las pruebas están (`apps/desk/server/permisos.test.ts`,
con el barrido «matriz área × transición, contra el servidor») y el CI está (`.github/workflows/ci.yml`, que
corre `typecheck`, `lint -- --max-warnings 158`, `test:coverage` y `build`). **El staging no tiene una sola
traza:** `grep -i staging` sobre `DEPLOY.md` da **0** y sobre `docs/runbooks/` da **0**; el barrido del
repositorio entero sólo lo encuentra en el plan **archivado** (`docs/sdd/Anteriores/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.md:109`),
que lo declara como **plan** y no como hecho, y en el maestro hablando de Hostinger frente a Supabase.

**Por qué la ausencia es la señal y no un olvido de registro:** un entorno sobre la VPS con PostgreSQL propio
dejaría rastro en `DEPLOY.md`, en variables y en un runbook, y `DEPLOY.md` es donde este proyecto escribe el
despliegue.

**Consecuencia ya aplicada:** F0-04 queda con **`cierra: no`** y se mantiene en la columna «declarados por
commit» del numerador (4 derivables de cabecera · 7 declarados por commit · 11 de 52). Es la única salida que
no afirma un hecho que nadie en el repositorio puede verificar, y **es reversible**: las otras dos escribían
una afirmación que el próximo barrido ya no cazaría, porque el registro existiría.

**Lo que queda por decidir, y es lo que hace de esto una entrada y no una nota:** si el staging **existe** —y
entonces falta documentarlo en `DEPLOY.md` y el `cierra` pasa a `si`— o si **quedó superado** por producción
directa sobre la misma VPS sin entorno intermedio —y entonces se retira del contenido de la fila, con la
decisión **fechada**—. Tomar la segunda hoy, deducida de una ausencia, sería hacerla callando: el plan
perdería contenido sin registro.

**De dónde viene:** la redacción de F0-05, al derivar el `cierra` de F0-04 contra su fila —no contra su
`proposal.md`, que se contradice consigo mismo—. El bloqueo no eran sus tres casillas de rotación de secretos,
que se resuelven por la regla del ciclo 1 y quedan declaradas aparte en `docs/runbooks/verificaciones-pendientes-F0.md:98-100`.
**Es un cuarto elemento que nadie había nombrado.**
**Afecta a:** la fila F0-04 del §5, el numerador del avance, y `docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md` si el staging fuese requisito de algo posterior
**Estado:** cerrada — Gerencia decidió el 21/09 no montar la copia de pruebas y retirar la pieza de la fila con fecha
**Dueño:** **Gerencia**
**Destino:** **punto abierto CON DUEÑO** (R-3, tercera salida). No cabe en una fila del §5 —no es trabajo de
construcción— ni en el expediente R08.x —no es un pasaje del maestro—: es una decisión de alcance sobre
contenido ya planificado, y R-3 dice que eso se queda como punto abierto con dueño, nunca en el aire


**ADENDA 21/09 — RESPUESTA DE GERENCIA A `e013-staging-f0-04`, 17/09, TEXTUAL:** «No existe copia de pruebas en el
servidor de Hostinger. Se trabaja directamente sobre la aplicación de verdad.»
Aterrizó en `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e013-staging-f0-04`). **Parcial:** confirma
`cierra: no` de F0-04 y descarta la salida «existe y falta escribirlo», pero **no elige** entre construir la copia o
retirarla de la fila con fecha. Devuelta al panel como pregunta nueva, `e013b-copia-pruebas`. **Estado:** sigue
`triada`, dueño Gerencia. **Clave Engram a cargar:** `decision/e013-staging-f0-04`.

## E-014 · 2026-09-17 · decision · **CERRADA**
**Qué:** Qué cargo de Comercial recibe el aviso cuando un ticket lleva más de 72 h en `Remisión creada` sin orden de venta (gate `decision/escalado-remision-creada`, abierto desde el 11/09).
**De dónde viene:** panel de ejecución, colección `respuestas`, documento `escalado-remision-creada`, fecha 17/09/2026
**Afecta a:** F1B-08 · la guarda de C11 · `packages/shared/src/sla.ts` · `openspec/specs/derivacion-avisos/spec.md`
**Estado:** cerrada
**RESPUESTA DE GERENCIA, 2026-09-17 — TEXTUAL:** «Tanto el que tiene cargo de director comercial como el que tiene cargo de coordinador comercial deberían recibir el aviso cuando un ticket lleva más de 72 horas en remisión creada sin orden de venta.»
**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` (el hecho, que la sesión SÍ carga) · tabla §4.5 del plan, fila `decision/escalado-remision-creada`, ahora decidida · esta entrada, que es sólo la traza.
**Tres consecuencias medidas el 2026-09-18 contra `995adbc`, anotadas y NO decididas —la respuesta se registra, no se discute—:**
1. **El destinatario es doble y el código de hoy no puede representarlo.** `destinatarioDelEscalado` (`packages/shared/src/sla.ts:92-109`) devuelve `ambiguo` en cuanto encuentra dos cargos distintos, y lo hace a propósito: «tampoco se elige el primero: eso sería inventar un orden entre dos puestos» (`sla.ts:78-82`). El tipo `DestinatarioEscalado` (`sla.ts:88-90`) lleva **un** `cargo`, no una lista. Atender la respuesta es cambiar ese tipo, no rellenar una casilla. La pregunta decía «qué cargo», en singular, y por eso la consecuencia no estaba prevista.
2. **`Director Comercial` no existe como cargo en el código.** Comando: `grep -rn "Director Comercial" packages/ apps/ --include=*.ts` → 0 aciertos. Los declarados son `Director Técnico` y `Coordinador Comercial` (`packages/shared/src/transitions.ts:276-281`).
3. **Dar entrada a `habilitar_servicio` en `DERIVACION_POR_DEFECTO` cambia un requisito vivo:** `RQ-AV-02` (`openspec/specs/derivacion-avisos/spec.md:67-70` en `011f6ea`) declara con SHALL **exactamente tres** entradas, y el recuento 34 − 3 = 31 de `:287` cuelga de ahí.

**Lo que la decisión NO desbloquea todavía:** la alarma en sí. `SLA_HORAS_POR_ESTADO` (`packages/shared/src/sla.ts:32-35` en `bb58e83`) tenía una sola entrada, `'Notificado': 24`; `Remisión creada` no está. F1B-08 sigue parcial y el numerador no se mueve.
**Clave Engram a cargar:** `decision/escalado-remision-creada`.


**ADENDA 21/09 — PRECISIÓN DE GERENCIA (`escalado-destinatario-doble`), 17/09, posterior a la respuesta de arriba, TEXTUAL:**
«En usuarios existe Nombre: Administrador, Cargo: Director Comercial, revisa. El aviso debe ir a cargo de coordinador comercial»
El aviso va a **un** cargo, `Coordinador Comercial`, que ya existe en el código (`packages/shared/src/transitions.ts:278`).
Las consecuencias 1 y 2 de arriba dejan de aplicar al destinatario; la 3 y la alarma sin construir siguen en pie. El
«Director Comercial» en usuarios es dato de la base, que la supervisión no ve. Aterrizó en `openspec/config.yaml` →
`decisiones_de_gerencia` (`decision/escalado-destinatario-doble`, y `precisada_por` en la entrada anterior) y en la fila
de §4.5. **Clave Engram a cargar:** `decision/escalado-destinatario-doble`.

## E-015 · 2026-09-18 · regla · **RUTEADA**
**Qué:** No se mencionan reuniones, ni celebradas ni previstas. Las decisiones se toman en la conversación de Cowork y en el panel; un gate pendiente se describe por qué decide, a quién corresponde y qué desbloquea.
**De dónde viene:** Gerencia, 17/09, fijada como regla de redacción no negociable y repetida en el encargo del parte
**Afecta a:** `CLAUDE.md` y toda redacción de `docs/sdd/`, el plan y el panel
**Estado:** ruteada
**Destino:** `CLAUDE.md` § «Regla de redacción» (escrita el 18/09). Barrido aplicado el mismo día a la tabla §4.5 del plan: 26 menciones de calendario de encuentros sustituidas por estado y dueño, y la columna «Sesión prevista» pasa a «Estado · a quién corresponde». **Quedan menciones heredadas fuera de §4.5** —`plan:4`, `:5`, `:14`, `:170`, `:270`, `:599` en `bbfe0a7` y `docs/sdd/R08.3_Expediente_de_cambios.md:361`—, listadas en el parte del 18/09 y no barridas aquí porque están fuera del alcance de escritura de la sesión de supervisión

> **Nota del corte del 21/09:** `openspec/config.yaml` → `decision/veto-plan-r01-1` cita como registro «`ENTRADA.md` →
> E-016», y E-016 **no existe** en este fichero. Se deja el número libre y se señala en `docs/sdd/Parte_2026-09-21.md`;
> las entradas siguientes empiezan en E-017.

## E-017 · 2026-09-17 · decision · **CERRADA**
**Qué:** Quién crea la OVI de un servicio en garantía (gate `decision/ovi-garantia-autor`).
**De dónde viene:** panel, colección `respuestas`, documento `ovi-garantia-autor`, 17/09/2026; recogida el 21/09
**Afecta a:** F1B-03 · cruza con `decision/c10-permisos-cargo` (F1C-05)
**Estado:** cerrada
**RESPUESTA DE GERENCIA, TEXTUAL:** «La OVI la crea Servicio Técnico, más concretamente el Director Técnico»
**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan §4.5, fila `decision/ovi-garantia-autor`
**Clave Engram a cargar:** `decision/ovi-garantia-autor`

## E-018 · 2026-09-17 · decision · **CERRADA**
**Qué:** Política de escritura contra Zoho (gate `decision/p44-escritura-zoho`, Anexo D nº 44).
**De dónde viene:** panel, documento `p44-escritura-zoho`, 17/09/2026; recogida el 21/09
**Afecta a:** F1B-08 · expediente R08.x (nº 44) · ramas sin fusionar `feat/mark-and-sweep` y `fix/sweep-contacts-all-types`
**Estado:** cerrada
**RESPUESTA DE GERENCIA, TEXTUAL:** «Por ahora no queremos activar la escritura contra Zoho. En caso necesario nos tocará tener un "espejo de Zoho" en nuestra app que permita comparar y escribir nosotros a mano en Zoho hasta que estemos preparados para activar la escritura en Zoho (futuro).»
**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan §4.5, fila `decision/p44-escritura-zoho` · `docs/sdd/R08.3_Expediente_de_cambios.md` §11
**El «espejo de Zoho»:** alcance **condicional** y futuro. No cabe todavía en ninguna de las tres salidas: se queda aquí **sin destino**, a propósito, hasta que Gerencia diga que es necesario.
**Clave Engram a cargar:** `decision/p44-escritura-zoho`

## E-019 · 2026-09-17 · decision · **CERRADA**
**Qué:** Si la OV y el equipo pueden ser de clientes distintos (gate `decision/titularidad-ov-equipo`, donde vive IV-8).
**De dónde viene:** panel, documento `titularidad-ov-equipo`, 17/09/2026; recogida el 21/09
**Afecta a:** F1B-11 · IV-8
**Estado:** cerrada — y la pregunta que abrió, `titularidad-mantenedor`, está respondida el 21/09 (adenda del 22/09, al final)
**RESPUESTA DE GERENCIA, TEXTUAL:** «Generalmente el titular del equipo es el que genera la orden de venta. Tenemos 1 solo caso donde el generador de la orden de venta no es el propietario del equipo es el mantenedor del equipo»
**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` y `incumplimientos_vivos` → IV-8 (`titularidad_decidida_2026_09_17`) · plan §4.5, fila `decision/titularidad-ov-equipo`
**Clave Engram a cargar:** `decision/titularidad-ov-equipo`

## E-020 · 2026-09-17 · decision · **CERRADA**
**Qué:** Si una subOV libre de un contrato vencido se puede consumir (gate `decision/vigencia-contrato`).
**De dónde viene:** panel, documento `vigencia-contrato`, 17/09/2026; recogida el 21/09
**Afecta a:** F1B-11
**Estado:** cerrada
**RESPUESTA DE GERENCIA, TEXTUAL:** «En teoría no pero si el contrato se vence antes del final del año se puede hacer una ampliación del contrato para consumir los trabajos no ejecutados. Si ya pasamos al siguiente año no se podría consumir porque la lista de precios cambia.»
**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan §4.5, fila `decision/vigencia-contrato`
**Clave Engram a cargar:** `decision/vigencia-contrato`

## E-021 · 2026-09-21 · hallazgo
**Qué:** El Código Servicio toma el día de la zona horaria del proceso, el mismo defecto que IV-2, y lo calcula el servidor.
**De dónde viene:** el analista, en la ronda de preguntas de F1A-07 (`fechas-derivadas-servidor`), 21/09; verificado de disco en `4976787`
**Afecta a:** el Código Servicio de todo ticket dado de alta en Desk sin código propio
**Estado:** triada — la hipótesis de ICU respondida (ver abajo), la del contenedor sigue pendiente
**Destino:** — (decisión de alcance pendiente; dueño: Gerencia)

**Tarea docker de A.7.1 (F1A-07, unidad A), 2026-09-21.** `docker run --rm node:22-alpine node -e
"…Intl.DateTimeFormat('en-US',{timeZone:'America/Bogota',…})…"` sobre `2026-09-10T00:30:00Z` dio
`2026-09-09`, el resultado correcto en Docker 29.6.2. **Responde la hipótesis de ICU de la propuesta
(`proposal.md:185-186`): SÍ, `node:22-alpine` trae ICU completo con su propia base de zonas — no
depende del `tzdata` de Alpine.** Quien arregle E-021 con el mismo patrón de `diaEnZona`
(`packages/shared/src/fechasDerivadas.ts`) no necesita cambiar de imagen. **Lo que esto NO responde**
es la hipótesis propia de E-021 —la zona del PROCESO en el contenedor REAL de producción, no en un
`docker run` local—: sigue pendiente como comprobación de persona, dueño quien tenga la consola de
EasyPanel, con `node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"`.

**Lo verificado.** `yymmdd` (`packages/shared/src/ticketCreate.ts:7-10`) usa `getFullYear`/`getMonth`/`getDate`, o sea la
zona del proceso que lo ejecuta. `buildCodigoServicio` (`:12-14`) lo usa, y lo llama el SERVIDOR al dar de alta un ticket
sin `codigoServicio` en el cuerpo, con `new Date()` (`apps/desk/server/services/ticketService.ts:99`). La imagen es
`node:22-alpine` (`Dockerfile:2` y `:10`), y ni el `Dockerfile`, ni `DEPLOY.md`, ni `.env.example` fijan zona horaria.

**Hipótesis, no comprobada:** el contenedor de producción corre en UTC, salvo que EasyPanel fije la zona, cosa que no se
ve desde el repositorio. Si es así, un ticket dado de alta entre las 19:00 y las 23:59 de Bogotá lleva en su código el día
siguiente.

**Por qué no lo arregla F1A-07:** está fuera de su alcance (sus tres fechas son las de IV-2). Su arreglo natural es la
función de día en zona de Bogotá que F1A-07 crea en `packages/shared`: el día que alguien lo tome, no tiene que escribir
otra.

## E-022 · 2026-09-21 · hallazgo
**Qué:** Una petición puede meter en el historial de cualquier transición un operando de bodegaje que esa transición no declara, y el KPI lo lee.
**De dónde viene:** el orquestador de F1A-07 (`fechas-derivadas-servidor`), al contrastar la decisión P-2 de su propuesta; verificado de disco en `4976787`
**Afecta a:** los tres bodegajes (`packages/shared/src/bodegaje.ts:58-80`), en cuanto tengan consumidor (F1C-06)
**Estado:** nueva
**Destino:** — (decisión de alcance pendiente; dueño: Gerencia)

**Lo verificado.** `buildTransitionPlan` sólo recorre los campos que la transición declara (`apps/desk/server/transitionExec.ts:42`),
pero el historial guarda el `values` ENTERO que llega (`packages/zoho-sync/src/db/repo.ts:285` en `17ddfec`), y `periodosDeBodegaje` lee
cada operando en cualquier paso del historial, sin mirar qué transición lo escribió (`bodegaje.ts:174`, `:186`). O sea que
`Fecha Orden De Venta`, `Fecha de Cotización`, `Fecha Orden de Compra`, `Fecha de aviso al cliente` o `Fecha Remisión de
Salida` enviadas por la API en una transición que no las pide entran en el historial y abren o cierran un bodegaje.

**Lo que F1A-07 sí cierra, y por qué sólo eso:** su P-2 descarta del `values` las TRES fechas de IV-2 cuando la transición
no las declara. Las demás son operandos de otras tandas y no son IV-2. El arreglo general —que el historial guarde sólo los
campos declarados— cambia qué registra TODA transición, y esa decisión no es de una tanda de correcciones.

## E-023 · 2026-09-21 · hallazgo
**Qué:** Las citas `ruta:línea` a `apps/desk/server/services/ticketService.ts` están caducas en masa: afirman en presente algo que la línea citada ya no dice, y el detector del pre-push no lo ve.
**De dónde viene:** la spec de F1A-07 (`fechas-derivadas-servidor`), al reanclar la tabla de RQ-TS-06 de `transitions-st`; medido por el analista el 21/09
**Afecta a:** specs vivas y `openspec/config.yaml` —lo que la sesión carga—, y el resto de documentos que citan el módulo
**Estado:** triada
**Destino propuesto:** reparación documental directa por bloques en `main`, como la de la línea base de IV-10 (P.2 de `hook-citas-pre-push`, 15/09), **fuera** de los tres bloques de `transitions-st` que reescribe el delta de F1A-07 (RQ-TS-06, RQ-TS-08 y §3.8), para no cruzarse con él. **Lo decide Gerencia.**

**La medida, del analista, sobre `4976787`** (no repetida por el orquestador): **124** citas a `ticketService.ts` sin ancla de
revisión, de las que **76 fallan** la comprobación —el texto de la línea citada en la revisión en que se escribió la cita no es
el texto de esa línea hoy—. **41** de las 76 están en specs vivas y en `config.yaml`: `derivacion-avisos` 12, `transitions-st`
11, `tickets-core` 5, `trazas` 4, `permissions` 4, `openspec/config.yaml` 4 y `remisiones` 1.

**Y es un SUELO, no el total.** Las anclas de un bloque que un archive fusionó en una spec viva no se ven con esa comprobación:
el commit del archive las reescribe con el fichero ya movido, así que en su propia revisión parecen ciertas. El caso de §3.8 de
`transitions-st` salió leyendo, no con el detector.

**Parte de la causa, verificada:** F1B-10. En `f367186` las anclas eran ciertas; `ccedf4f` (su código) desplazó las líneas de
`executeTransition` y de `createManagedTicket`, y `aa886c6` (su archive) fusionó en la spec viva anclas medidas antes de ese
desplazamiento. Ejemplo comprobado de disco: `openspec/specs/transitions-st/spec.md:327` en `a865ad3` cita la línea 145 de `ticketService.ts`
como la del actor; en `f367186` lo era, y en `4976787` esa línea es un comentario y el actor está en la 151.

**Por qué el detector no lo caza:** comprueba que la línea citada exista y no esté vacía, nunca que diga lo que la frase afirma
(`CLAUDE.md`, regla de mutación 4).

**Lo que F1A-07 sí hace, y nada más:** reancla como caso A las citas de `ticketService.ts` de los tres bloques que su delta
reescribe, y al archivar las vuelve a comprobar contra el árbol de ese momento.

---

# Adendas y entradas del corte del 2026-09-22

Se escriben al final, y no dentro de cada entrada, para no desplazar las líneas que otros documentos citan.
Las entradas de arriba llevan marcado su estado nuevo en su cabecera.

## ADENDA a E-005 · respuesta de Gerencia a `e005-iv4-iv11`, 21/09 (editada el 22/09), TEXTUAL

«Opción (c). Regla: si la orden de venta se eligió en la aplicación, manda la aplicación y el sincronizador no la pisa,
ni el número ni su fecha; si no, manda Zoho, como hoy. Descarto (a) mientras convivamos con Zoho, porque congela el
ticket entero, y (b), porque borra el identificador. Si alguien escribe en Zoho una orden distinta a la elegida en la
aplicación, no se pierde en silencio: se enseña en el espejo de Zoho para corregirla a mano. Va en F1B-11, y SÍ queremos
un parche antes de esa tanda (elegido el 22/09). Dónde se teclean hoy las órdenes —sólo en la aplicación, todavía en
Zoho, o en los dos— queda SIN CONFIRMAR: no cambia la decisión del parche.»

**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e005-iv4-iv11`) · `incumplimientos_vivos`
→ IV-8 no, IV-**11**, cuyo `destino` pasa de «SIN DESTINO ASIGNADO» a «F1B-11, con un parche antes» · `CLAUDE.md`, fila de
IV-11 · `docs/sdd/Parte_2026-09-22.md`.
**Medido el 22/09 sobre `125ae3e`:** «ni el número ni su fecha» son DOS columnas, `orden_venta` (`packages/zoho-sync/src/db/repo.ts:48`)
y `fecha_orden_venta` (`:50`). **Lo que la respuesta no preveía:** hoy no hay forma de saber POR FILA que la orden se
eligió en la aplicación —la única bandera, `managed_by_app` (`repo.ts:58-59` en `17ddfec`), es del ticket entero, que es la salida (a)
descartada—, y el «espejo de Zoho» al que se manda la discrepancia no existe ni tiene fila (E-018). Las dos salen al panel
como `e005b-parche-vehiculo` y `e005c-discrepancia-sin-espejo`.
**Clave Engram a cargar:** `decision/e005-iv4-iv11`.

## ADENDA a E-013 · respuesta de Gerencia a `e013b-copia-pruebas`, 21/09, TEXTUAL

«No la montamos, y se escribe así: F0-04 se da por cerrada con esa pieza retirada y con la fecha de la decisión, y el
avance recupera 1. Cuesta que cualquier error —incluida la mudanza— se descubra ya delante de los usuarios.»

**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e013b-copia-pruebas`) · fila F0-04 del §5
del plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:128`), donde la pieza queda **tachada y fechada**, sin
borrar el texto · `docs/sdd/Parte_2026-09-22.md`.
**Lo que queda pendiente y NO lo hace esta sesión:** `openspec/changes/F0-04/proposal.md:6` sigue con `cierra: no`, y la
supervisión no toca `openspec/changes/`. Hasta que una sesión de construcción lo cambie citando esta decisión, la cifra
derivable de cabecera y la publicada difieren en 1, a propósito.
**Clave Engram a cargar:** `decision/e013b-copia-pruebas`.

## ADENDA a E-019 · respuesta de Gerencia a `titularidad-mantenedor`, 21/09, TEXTUAL

«Opción 1 — el mantenedor se apunta en la hoja de vida del equipo y sólo él puede pagar órdenes de ese equipo; cualquier
otra discrepancia se bloquea. Es la más segura; cuesta un campo más en la hoja de vida y mantenerlo al día.»

**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/titularidad-mantenedor`) y
`incumplimientos_vivos` → IV-8, cuyo `destino` pasa a **F1B-11** · plan §4.5, fila `decision/titularidad-ov-equipo` ·
`CLAUDE.md`, fila de IV-8 · `docs/sdd/R08.3_Expediente_de_cambios.md` §11 · `docs/sdd/Parte_2026-09-22.md`.
**Consecuencia que la respuesta no preveía:** el campo vive en la hoja de vida, que es contenido de F1B-02 (**S39, esta
semana**, cuatro campos declarados en `plan:157`), y la guarda vive en F1B-11 (S41). Destino del campo **propuesto**,
no escrito.
**Clave Engram a cargar:** `decision/titularidad-mantenedor`.

## ADENDA a E-018 · el «espejo de Zoho» ya tiene un uso declarado

La respuesta `e005-iv4-iv11` (21/09) manda la discrepancia de orden de venta «al espejo de Zoho». El espejo sigue **sin
fila en el §5** y sigue siendo alcance condicional, pero ya no es sólo una posibilidad futura: es donde una decisión
tomada dice que se vea algo. Se mantiene **sin destino**, a propósito, y se señala en el parte del 22/09.

## E-024 · 2026-09-21 · decision · **CERRADA**
**Qué:** Si el enlace a Drive es definitivo o el sistema sustituye a Drive (gate `decision/p8-p54-drive`, Anexo D nº 8 y 54).
**De dónde viene:** panel, colección `respuestas`, documento `p8-p54-drive`, 21/09/2026; recogida el 22/09
**Afecta a:** F1B-02 (S39) · `decision/p55-backup` (F1F-02)
**Estado:** cerrada
**RESPUESTA DE GERENCIA, TEXTUAL:** «Por cuestiones de capacidad de almacenamiento en nuestro servidor vamos a seguir teniendo enlace a Drive»
**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan §4.5, fila `decision/p8-p54-drive` · `docs/sdd/R08.3_Expediente_de_cambios.md` §11
**Consecuencia señalada, no decidida:** si los documentos viven en Drive, el respaldo de F1F-02 no los cubre por estar en el servidor.
**Clave Engram a cargar:** `decision/p8-p54-drive`

## E-025 · 2026-09-21 · decision · **CERRADA**
**Qué:** Si los flujos comercial y posible-cliente (M1.11 y M1.12) entran en Desk 2.0 en 2026 (gate `decision/flujos-comercial-posible-cliente`).
**De dónde viene:** panel, documento `flujos-comercial`, 21/09/2026; recogida el 22/09
**Afecta a:** F1B-06 (S42) · Anexo D nº 42 · `docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md`
**Estado:** cerrada
**RESPUESTA DE GERENCIA, TEXTUAL:** «Se quedan en Zoho CRM no se queda en Desk 2.0»
**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan §4.5, fila `decision/flujos-comercial-posible-cliente` · `docs/sdd/R08.3_Expediente_de_cambios.md` §11
**Lo que arrastra y queda sin responder:** de dónde sale «Preparación Cotizac.» (Anexo D nº 42) si esa rama no se construye. Medido el 22/09: `grep -rniE "posible.cliente" packages/ apps/ --include=*.ts` = 0.
**Clave Engram a cargar:** `decision/flujos-comercial-posible-cliente`

## E-026 · 2026-09-21 · decision · **PARCIAL**
**Qué:** Si los clientes Top 5 entran en el cálculo automático de prioridad (gate `decision/top5-prioridad`).
**De dónde viene:** panel, documento `top5-prioridad`, 21/09/2026; recogida el 22/09
**Afecta a:** F1B-07 (S43)
**Estado:** triada — la mitad respondida está registrada; la otra vuelve como pregunta
**RESPUESTA DE GERENCIA, TEXTUAL:** «No automático, Hay que pensar en una forma de hacerlo manual»
**Dónde aterrizó:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan §4.5, fila `decision/top5-prioridad`, ahora **parcial**
**Lo que falta:** cómo se pone a mano y qué cargo puede hacerlo —el plan promete «edición manual bloqueada para el técnico» (`plan:162`)—. Devuelto al panel como `top5-manual`. Medido el 22/09: la noción de Top 5 no existe en el código.
**Clave Engram a cargar:** `decision/top5-prioridad`

## E-027 · 2026-09-22 · hallazgo
**Qué:** Seis commits de producto entraron en `main` el 22/09 —la copia de las facturas de anticipo de Zoho Books— sin cambio de OpenSpec, sin cabecera `tanda:` y sin fila en el §5.
**De dónde viene:** corte del 22/09, `git log --first-parent 4976787..822ccbc^`
**Afecta a:** el denominador y el numerador del avance · la comprobación 2 de `npm run reconcile`, que sólo mira cabeceras de `proposal.md` · la spec viva `openspec/specs/zoho-sync/spec.md:221` en `ca56c62`, modificada en el mismo lote
**Estado:** triada
**Destino:** — **sin destino, a propósito.** Es exactamente el caso «trabajo sin fila» que F0-05 dice cerrar, y el mecanismo no lo caza: el hook comprueba cabeceras cuando hay `proposal.md`, y aquí no lo hay. Decidir si todo cambio de producto necesita ficha, o si los ajustes de sincronización pueden ir directos, es alcance de método: devuelto al panel como `trabajo-sin-ficha`.
**Lo medido (22/09, sobre `125ae3e`):** `ea3dbc1`, `a233e1d`, `7cfd198`, `8d03c0d`, `d041b1c`, `bde29fb` — 13 ficheros, +155/−18, con pruebas. No escriben en Zoho: son lectura y copia, así que no chocan con `decision/p44-escritura-zoho`.

## E-028 · 2026-09-22 · hallazgo
**Qué:** Siete sitios formatean una fecha con `toISOString().slice(0, 10)` (o el mismo idiom), que convierte a UTC antes de recortar el día — el mismo mecanismo que `packages/shared/src/bodegaje.ts:131` documenta como «día UTC puro» y que F1A-07 ya reemplazó ahí por `diaEnZona` (`packages/shared/src/fechasDerivadas.ts:63`). Los siete siguen sin migrar.
**De dónde viene:** `sdd-design` de F1B-02 (`hojas-vida`), al diseñar la lectura de las nuevas fechas de `equipos` con `fechaSolo` (`packages/zoho-sync/src/books/repo.ts:94-101`, cuyo comentario en `:89-92` documenta el mismo desplazamiento); verificado de disco originalmente en `acf2701` (base de `f1b-02-r1`)
**Actualización (`sdd-apply` de F1B-02, commit `094eaa4`):** `apps/desk/server/db/equipos.ts` **sí** lo tocó esta tanda —añadió los seis campos comerciales en otras funciones del mismo fichero—, así que la premisa «ninguno de estos siete ficheros lo toca esta tanda» ya no es cierta para éste. **El defecto en sí sigue sin corregir**: `remisionesDelEquipo` creció de línea por las inserciones de arriba y el mismo patrón `toISOString().slice(0, 10)` se desplazó de `:190` a `:223` (caso A de la regla de mutación 4 — sigue siendo cierto del árbol de hoy, se actualiza el número). Los otros seis ficheros no los tocó esta tanda (`git diff --stat ae7dcbb..094eaa4` confirma que sólo `equipos.ts` cambió de los siete).
**Afecta a:**
- `apps/desk/server/db/backfillFechaOrdenVenta.ts:27`
- `apps/desk/server/db/eliminarTicket.ts:61`
- `apps/desk/server/db/equipos.ts:223` (era `:190` antes de F1B-02; ver actualización arriba)
- `apps/desk/server/db/historial.ts:79`
- `apps/desk/server/db/remisiones.ts:14`
- `apps/desk/server/db/remisiones.ts:107`
- `apps/desk/src/components/RemisionesPage.tsx:119` — menor y distinta: no lee una fecha de base de datos, nombra el `.csv` de descarga con `new Date().toISOString().slice(0, 10)`, así que sólo se ve afectada la fecha del nombre de fichero, nunca un dato guardado
**Estado:** nueva
**Destino:** — sin destino, a propósito (R-3: dueño, no épica inventada). Dueño: Gerencia, para decidir si entra en una tanda existente o abre una nueva.
**Precedente exacto — E-021 (arriba, `:279-307`).** Es la misma familia de defecto —el día calculado sin pasar por `diaEnZona`—, pero **no el mismo mecanismo**: E-021 es `ticketCreate.ts:7-10`, que usa `getFullYear`/`getMonth`/`getDate` **locales** y depende de la zona horaria del *proceso* (UTC si nadie la fija en el contenedor); esta entrada son siete sitios que fuerzan **UTC explícito** vía `toISOString()`, sin depender de la zona del proceso. Las dos comparten la misma corrección disponible — `diaEnZona`, construida por F1A-07 — y las dos siguen sin usarla salvo en `bodegaje.ts`.
**El límite, dicho con honestidad:** está **medido el inventario de llamadas** (las siete ubicaciones de arriba, cada una releída contra el fichero). **NO está medido el impacto.** Si la columna de origen es `date` (sin componente de hora) y no `timestamptz`, pg puede no introducir el desplazamiento que sí afecta a un `timestamptz` con hora — depende de cómo el driver construye el `Date` en cada caso, y eso no se ha comprobado sitio por sitio. Que nadie lea esta entrada como defecto confirmado: es hipótesis de corrección, no un bug verificado en producción.
**Por qué F1B-02 no lo arregla, aunque toca uno de los siete ficheros.** `apps/desk/server/db/equipos.ts` es un fichero que esta tanda sí modifica (añade las seis columnas comerciales y su lectura), pero la línea `:190` pertenece a `remisionesDelEquipo`, una función que F1B-02 no toca ni necesita tocar para su alcance. **Registrado, no corregido** — es el encabezado de la sección «Incumplimientos vivos» de `CLAUDE.md`, y sin esta frase alguien podría leer mañana que se pasó por alto en una tanda que sí tenía el fichero abierto.

## E-029 · 2026-09-23 · hallazgo
**Qué:** Los lotes de E-027 metieron 7 avisos `@typescript-eslint/no-explicit-any` en `packages/zoho-sync/src/booksHub/`, rompieron el trinquete de lint del CI y lo dejaron en rojo desde el 22/09 sin que nadie lo leyera.
**De dónde viene:** medición previa al `sdd-verify` de F1B-02, 23/09. Bisect `--first-parent c45bcb1..125ae3e` con `npm run lint -- --max-warnings 158`: el padre de `ea3dbc1` da 158, `ea3dbc1` da 160, y con `a233e1d`, `7cfd198` y `8d03c0d` se llega a 165. Reparto: `mappers.ts` +1, `mappers.test.ts` +1, `sweep.test.ts` +2, `sync.test.ts` +2, `sync.ts` +1. Un checkout limpio y el árbol local dan lo mismo (165): `coverage/` no influye (`eslint.config.js:16`).
**Afecta a:** el trinquete de `.github/workflows/ci.yml:41` · la verificación de main, porque con el lint en rojo el CI no llegaba a correr `test:coverage` ni `build`
**Estado:** triada
**Destino:** — (sin destino, a propósito; dueño: Gerencia). Son dos cosas, y ninguna tiene fila:

1. **La deuda: los 7 `any`.** Gerencia decidió el 23/09 subir el techo a **165 y ni uno más** (`f7c9dc1`), porque arreglarlos es una tanda aparte. Esa tanda no existe todavía. Mientras no exista, el techo absorbe deuda ajena ya fusionada, y sólo esa: los avisos que traiga código nuevo se arreglan en su propia tanda y no suben el techo.
2. **El hallazgo de método, más grave que el número.** El trinquete no falló, falló que nadie lo lee. GitHub Actions registra **tres** ejecuciones de main en rojo, todas en el paso de lint: `bde29fb` (22/09 14:13 UTC), `125ae3e` (22/09 16:21, fusión de F1A-07) y `acf2701` (22/09 22:29, tras fusionar F1A-06). Entre medias hubo **dos** fusiones (`822ccbc`, `b69fef0`) y nadie miró el CI: los cierres comprobaban `npm run lint` a secas, que no lleva `--max-warnings` y da exit 0 con cualquier cifra. **Punto abierto: quién mira el CI de main y en qué momento del cierre.** Mientras se decide, el cierre de F1B-02 corre el lint con `--max-warnings 165`, igual que el CI.

## E-030 · 2026-09-23 · hallazgo
**Qué:** El `verify-report.md` archivado de F1A-06 no pasa hoy `gentle-ai sdd-verify-validate`, y tiene dos defectos, no uno.
**De dónde viene:** cierre de F1B-02, 23/09, al usarlo como modelo del sobre `gentle-ai.verify-result/v1`. Medido con gentle-ai 2.4.0.
**Afecta a:** `openspec/changes/archive/2026-09-22-generador-mapa-blueprint/verify-report.md` · la confianza en que un informe archivado revalide si el validador se endurece
**Estado:** triada
**Destino:** — (sin destino, a propósito; dueño: Gerencia). El informe está archivado y NO se toca: se registra.

**Lo medido.**
1. **`evidence_revision` inválido** (`:3`): pone `sha256:` delante de un SHA-1 de git de 40 caracteres, `4312d9c7…`. `sdd-verify-validate --requirements 7 --scenarios 15` → exit 1, «invalid evidence_revision in verify result envelope».
2. **Veredicto aprobatorio con evidencia incompleta.** Corrigiendo SÓLO el campo anterior por stdin, sigue rechazado: `verdict: pass` (`:4`) con `scenarios: 11/15` (`:8`) → «passing verdict contradicts failing or incomplete evidence». Tampoco valdría `pass_with_warnings`: el validador exige los escenarios completos para cualquier veredicto aprobatorio.
3. **El resto está bien.** Barrido de los **12** `verify-report.md` de `openspec/changes/archive/`, cada uno validado con los totales de su propio sobre: **11 dan `valid: true`** y sólo falla el de F1A-06.

**La lección.** El sobre de F1A-06 era el precedente a copiar para F1B-02, y copiarlo habría repetido los dos defectos. Un precedente archivado no es un modelo válido hasta que se revalida con la herramienta de hoy.

## E-031 · 2026-09-23 · hallazgo
**Qué:** El `sdd-spec` de F1B-02 (`ee0ed40`) produjo DOS defectos estructurales, y los dos sólo se vieron al intentar archivar.
**De dónde viene:** cierre de F1B-02, 23/09, con `archive: blocked` y `blockedReasons: []` tras un verify en verde. Medido con gentle-ai 2.4.0 en la rama `f1b-02-r1`.
**Afecta a:** `openspec/changes/hojas-vida/specs/hojas-vida/spec.md` · el coste de cierre de toda tanda cuya spec salga fuera de formato
**Estado:** triada
**Destino:** — (sin destino, a propósito; dueño: Gerencia).

**Los dos defectos.**
1. **Spec en la ruta viva en vez del delta.** `ee0ed40` crea `openspec/specs/hojas-vida/spec.md` (171 líneas), no `openspec/changes/hojas-vida/specs/…`. Lo reparó `b0c6b41` con un `git mv` (R100, 0 líneas de contenido).
2. **Encabezados fuera del formato de su propio skill.** En `ee0ed40` la spec tiene **0** encabezados `### Requirement:` y **8** `### RQ-HV-`; la plantilla es `### Requirement: {Requirement Name}` (`~/.claude/skills/sdd-spec/SKILL.md:116`) y así están los deltas archivados (`openspec/changes/archive/2026-09-22-generador-mapa-blueprint/specs/mapa-blueprint/spec.md:21`). `sdd-status` mide los totales en la spec (`~/.claude/skills/_shared/sdd-status-contract.md:139`), contaba 0 contra los 8/8 del sobre y dejaba archive bloqueado (`:141`) sin decir por qué. Lo reparó `0c23a34`: 8+/8−, 183 líneas antes y después. Después, `sdd-status` da `archive: ready`, `nextRecommended: archive`, `blockedReasons: []`.

**Coste medido.** Un `git mv` (`b0c6b41`). Una generación del ledger gastada en un refresco que no cambió un byte: la generación 3, «verify de refresco F1B-02», con árbol de inicio y de fin idénticos (`5248066`) y `changed_lines: 0`. Y cuatro vueltas —sobre añadido (`4a9ebb9`), refresco, diagnóstico y corrección— para encontrar una causa que estaba escrita en `sdd-status-contract.md:139-141`. La generación se gastó por inferir la causa en vez de leer el contrato; `sdd-verify-validate` daba `valid: true` porque recibe los totales de fuera y no mira la spec.

**Punto abierto.** Si el dispatcher exige ese formato para archivar, ¿por qué ninguna fase lo comprueba antes de llegar al final? Hoy `sdd-spec`, `sdd-apply` y `sdd-verify` pasan con 0 requisitos contables, y el defecto sólo aparece cuando ya no se puede avanzar.

## E-032 · 2026-09-23 · hallazgo
**Qué:** ARCHIVAR SILENCIA EL DETECTOR. `apps/desk/server/citas/cli.ts:49` excluye `openspec/changes/archive/` del barrido, así que un cambio que llega al archive con citas rotas en sus propios artefactos las entierra en vez de repararlas, y el pre-push pasa a salida 0 sin que nadie haya arreglado nada.
**De dónde viene:** cierre de F1B-02, 23/09. Sobre `afa0add` el detector daba salida 1 con 5 bloqueantes, los mismos que sobre `0c23a34`; tres estaban en artefactos del propio cambio (`proposal.md:32`, `:38` y `specs/hojas-vida/spec.md:70`). Nadie lo señaló: se vio leyendo `cli.ts:49` antes de adquirir el archive.
**Afecta a:** todo `sdd-archive` · el `exit 0` del pre-push como prueba de que un cambio archivado no deja citas rotas
**Estado:** triada
**Destino:** — (sin destino, a propósito; dueño: Gerencia).

**El mecanismo.** La exclusión es deliberada (`cli.ts:46`, RQ-CV-07): el archive es registro fechado y no se barre. Pero el `git mv` del archive saca los artefactos del alcance del detector en el mismo commit en que dejarían de repararse. Lo que estaba rojo el minuto antes pasa a verde sin cambiar un byte de contenido. Sólo sigue a la vista la copia de la spec en `openspec/specs/<capacidad>/`, que no está excluida.

**Primo de E-023, por otra vía.** E-023 registra que el commit del archive reescribe las anclas con el fichero ya movido, y en su propia revisión parecen ciertas (`:338-339`). Aquí el archive no reescribe nada: saca la ruta del barrido. Los dos acaban igual, con citas rotas que ningún detector ve después del archive.

**Qué se hizo en F1B-02.** Las cinco se repararon antes de adquirir el archive (`cb30fa1`; detector con salida 0, 2031 comprobadas). Eso lo cazó una lectura, no un mecanismo: el orden «reparar y después archivar» no lo impone nada.

**Punto abierto.** Si el detector debe correr sobre los artefactos del cambio ANTES del `git mv`, o si el propio archive debe negarse con bloqueantes vivos en la carpeta que mueve. Ninguna de las dos cosas existe hoy.


---

## Corte del 2026-09-24 — las 36 respuestas de Gerencia del 23 y 24/09

Todas entraron por el apartado 06 del panel. Cada una lleva su respuesta **textual** —no un resumen— y el
destino donde aterrizó. La decisión NO vive aquí: vive en `openspec/config.yaml` → `decisiones_de_gerencia`,
que es el fichero que las sesiones de construcción cargan. Esta bandeja guarda la traza de por dónde entró.


## E-033 · 2026-09-24 · decision · **CERRADA**
**Qué:** La alerta de no-aprobación del cliente: ¿24 o 48 horas?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-3-alerta` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1A-02 · F1B-08 · Anexo D nº 3
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-3-alerta`) · expediente R08.x
**Engram:** `decision/anexo-3-alerta` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> 4 días hábiles, para todos los clientes. Cuando un ticket lleva 4 días hábiles en Notificación cliente sin aprobación ni rechazo, se avisa al Coordinador Comercial para que haga seguimiento, y el ticket se señala en el tablero como «esperando aprobación del cliente»; no se crea un estado nuevo. Un día hábil va de lunes a viernes, de 8 a 17 h (9 horas), sin festivos de Colombia; el tiempo fuera de ese horario no cuenta. El mismo criterio se aplica a las tres alarmas de SLA_HORAS_POR_ESTADO, expresadas en días hábiles: Notificado, 1 día hábil (9 horas hábiles); Remisión creada, 3 días hábiles (27 horas hábiles); Notificación cliente, 4 días hábiles (36 horas hábiles). Esta alerta es independiente del reloj del SLA de c7: el reloj se para en Notificación cliente porque la espera es del cliente, y la alerta mide precisamente esa espera. Cierra el punto abierto nº 3.


## E-034 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Cómo se incorpora la gestión de garantía con el proveedor, hoy fuera del sistema?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-7-garantia-proveedor` · respondida por Gerencia el 24/09/2026
**Afecta a:** fila nueva junto a F1B-03 · Anexo D nº 7
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-7-garantia-proveedor`) · expediente R08.x
**Engram:** `decision/anexo-7-garantia-proveedor` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> La reclamación de garantía al fabricante se incorpora como una ficha propia vinculada al ticket y a la OVI de garantía, no como rama del blueprint: el ticket se cierra cuando el cliente queda atendido, y la reclamación sigue su curso aparte. Al crear la OVI de garantía, el Director Técnico responde «¿Se reclama al fabricante?». Si responde sí, se abre la ficha. Si responde no, elige el motivo de una lista cerrada: fuera de garantía de fábrica · daño por mal uso · el costo de envío supera el valor de la pieza. La ficha registra: fabricante, pieza (referencia y serial), ticket y OVI de origen, número de caso del fabricante (RMA), valor reclamado (tomado del costo de la OVI), estado (abierta → enviada al fabricante → resuelta: reposición, nota crédito o rechazada) y valor recuperado. Si una reclamación lleva más de [60] días abierta, se avisa al Director Técnico. Se miden el valor recuperado frente al reclamado por marca y las piezas con fallas repetidas, que alimentan la taxonomía ISO 14224. Entra en Fase 1 junto a la OVI de garantía (F1B-03), como tanda pequeña. Cierra el punto abierto nº 7.


## E-035 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Comentarios predeterminados por etapa, o textos dinámicos con consulta a la base de conocimiento?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-9-comentarios` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1D-04 · Anexo D nº 9
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-9-comentarios`) · expediente R08.x
**Engram:** `decision/anexo-9-comentarios` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Comentarios predeterminados. Cuando un ítem sale No OK, el comentario de falla de su catálogo (Grimm v1.8, Horiba v1.4) aparece escrito automáticamente. El técnico puede añadir una nota libre, pero no borrar el texto del catálogo; el sistema guarda por separado el comentario del catálogo usado y la nota, y los análisis se hacen sobre el primero. Si la falla no está en el catálogo, se usa el formulario de falla nueva ya decidido, y si el Director Técnico la incorpora, su comentario pasa a ser predeterminado en la siguiente versión del catálogo. La consulta a la base de conocimiento no se usa para escribir comentarios: cuando exista (punto abierto nº 51), mostrará al técnico casos parecidos como sugerencia al lado, sin escribir en el informe. F1D-04 se construye con esta regla y no depende de la base de conocimiento. Cierra el punto abierto nº 9.


## E-036 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Sigue «Liberación del ticket sin facturar» siendo un checkbox, o pasa a ser un campo que el motor pueda exigir?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-33-checkbox` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1C-02 · F1C-05 · Anexo D nº 33
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-33-checkbox`) · expediente R08.x
**Engram:** `decision/anexo-33-checkbox` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Deja de ser un checkbox. La transición «Liberación sin factura», que sólo ejecuta el Director Comercial, exige dos campos obligatorios en su lugar: (1) Motivo, de una lista cerrada: fecha de corte de facturación del cliente · servicio incluido en contrato con facturación periódica · autorización excepcional de Dirección Comercial, con texto obligatorio; y (2) Fecha prevista de facturación. Si esa fecha pasa y el ticket sigue en «Pendiente de facturar», el sistema avisa al Director Comercial. Las liberaciones registradas antes del arreglo del 09/09 conservan su casilla tal como se guardó y se marcan según el criterio ya decidido para el histórico (c2); no se reescriben.


## E-037 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Se acepta formalmente la pérdida de aviso en la ventana entre las dos escrituras? ¿Y es el borrado de administrador compatible con la auditoría inmutable que exige M11.4?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-36-aviso` · respondida por Gerencia el 24/09/2026
**Afecta a:** sin fila · dueño Gerencia · Anexo D nº 36
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-36-aviso`) · expediente R08.x
**Engram:** `decision/anexo-36-aviso` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> 1. Se acepta formalmente que una caída entre la escritura de la transición y la del aviso pueda perder el aviso, porque la transición y la derivación quedan siempre guardadas. Como protección, una revisión nocturna recorre las transiciones del día, recalcula a quién correspondía avisar (estado de llegada menos las áreas de quien ejecutó) y crea los avisos que falten.
> 2. El borrado de administrador se mantiene, pero sólo para tickets sin actividad real (sin remisión, sin orden de venta y sin transiciones posteriores a su creación); todo ticket con actividad se cierra con Anulado. Exige un motivo de lista cerrada (creado por error · duplicado · prueba) y, antes de borrar, escribe en un registro de borrados que nadie puede modificar ni borrar: quién, cuándo, motivo y copia completa del ticket. Los tickets traídos de Zoho no se pueden borrar. Con esto el borrado es compatible con la auditoría inmutable de M11.4 y se cierra el punto abierto nº 36.


## E-038 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Entra el servicio en sitio como cuarta rama del blueprint en 2026?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-43-en-sitio` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1B-06 (campo) · rama en 2027 T2 · Anexo D nº 43
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-43-en-sitio`) · expediente R08.x
**Engram:** `decision/anexo-43-en-sitio` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Sí, pero en 2027. El servicio en sitio entra como cuarta rama del blueprint en el segundo trimestre de 2027, no en 2026. Mientras tanto, cualquier visita a instalaciones del cliente se registra por la rama de soporte remoto (F1B-06), que no exige remisión, con un campo nuevo «Modalidad: remoto / en sitio». La regla de remisión obligatoria para habilitar un servicio técnico se mantiene sin excepciones. Las visitas registradas así son la base del levantamiento de cómo se hace hoy, que se hace al comenzar 2027 y es requisito para construir la rama. La primera versión sigue la referencia de campo del maestro: Asignado → En viaje → En sitio → En ejecución → En pausa → Validación de calidad → Cerrado. Usa un acta de visita firmada por el cliente en lugar de la remisión de entrada, y reutiliza el reloj del SLA, el control de calidad, la validación del informe y el árbol de inspección de las otras ramas. La geolocalización y el registro por NFC quedan para una segunda versión. Las visitas registradas en 2026 se quedan en soporte remoto; la rama nueva sólo aplica a los servicios que se abran desde su puesta en marcha. Si antes llegan instalaciones o puestas en marcha en sitio (por ejemplo, del proyecto de estaciones de calidad del aire), la construcción se adelanta.


## E-039 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Qué repuestos se adelantan al diagnóstico y cuáles esperan a la orden de compra?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-47-repuestos` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1D-06 · S46 · Anexo D nº 47
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-47-repuestos`) · expediente R08.x
**Engram:** `decision/anexo-47-repuestos` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Criterio en tres casos, que el sistema aplica solo cuando el técnico marca un repuesto en el diagnóstico:
>
> Si el repuesto está en inventario, se reserva desde el diagnóstico, siempre; si el cliente rechaza, la reserva se libera.
> Si no está en inventario pero es de rotación, se solicita a Compras desde el diagnóstico hasta un total de $3.000.000 COP por ticket (valor de compra, antes de IVA), sin esperar la orden del cliente; lo que exceda ese total espera a la orden. Si el cliente rechaza, la pieza entra a inventario y la consume el siguiente servicio.
> Si es un repuesto específico o de baja rotación, o supera ese valor, espera a la orden del cliente.
>
> La marca de rotación la pone Compras en cada artículo, con los consumos del Portal de Análisis de Inventario, y la revisa cada trimestre. El sistema no compra: genera la solicitud y Compras la ejecuta. Se mide cada mes el valor de los repuestos pedidos por adelantado que quedaron sin servicio; si crece, se ajustan el umbral o la lista. F1D-06 construye la mecánica con este criterio.


## E-040 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Cómo identifica el sistema que un ticket pertenece a un contrato, cómo afecta eso a la prioridad, y cómo alimentan las subOV el informe trimestral?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-53-contratos` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1B-11 · S41 · Anexo D nº 53
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-53-contratos`) · expediente R08.x
**Engram:** `decision/anexo-53-contratos` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Se añade un registro de contrato en Desk, que complementa la convención de subOV (no la sustituye): Comercial lo crea al recibir la orden de compra, con cliente, lote (OV-AAAA-NNN), fecha de inicio y fecha de fin, ampliable dentro del mismo año según lo decidido sobre vigencia.
>
> Identificación: un ticket es de contrato cuando tiene asociada una subOV de un lote registrado como contrato vigente. Nadie lo marca a mano.
> Prioridad: se toma del cliente, no del ticket. Si el cliente tiene un contrato vigente, sus tickets nacen en prioridad Alta, también los correctivos cotizados aparte. Si el cliente es además Top 5, manda la prioridad más alta de las dos.
> Informe trimestral: cada subOV del lote está libre (sin ticket), en curso (ticket abierto) o ejecutada (ticket finalizado). Por cada trimestre del contrato, contado desde su fecha de inicio, el sistema genera desde la ficha del contrato: % ejecutado (ejecutadas / creadas), lista de servicios del trimestre con equipo, serial, tipo de servicio, fecha e informe, subOV libres y días hasta el vencimiento. Si al ritmo actual no se van a consumir todas antes de la fecha de fin, avisa a Comercial para proponer la ampliación.
>
> En Fase 1 entran el registro de contrato y la prioridad (junto con F1B-11), y el informe como tabla exportable. La versión con formato para enviar al cliente queda para el portal. Cierra el punto abierto nº 53.


## E-041 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Cuál es la norma de taxonomía de fallas que se aplica?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-56-taxonomia` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1D-07 · S47 · Anexo D nº 56
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-56-taxonomia`) · expediente R08.x
**Engram:** `decision/anexo-56-taxonomia` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> La norma es la ISO 14224 (edición 2016), sobre datos de fiabilidad y mantenimiento de equipos. Se adopta la ISO 14224 simplificada, como referencia y no para certificación: sus conceptos se corresponden con las cuatro columnas del maestro (objeto = pieza mantenible, síntoma = modo de falla, causa = causa de la falla, acción = actividad de mantenimiento) y las listas de valores se ajustan a los equipos Grimm, Horiba y Environics. Es la misma norma que M3.2 usa para la jerarquía de equipos. Corrección pendiente en el maestro: en la R08.2, el párrafo de M2.4 y el punto 56 del Anexo D quedaron con «14224» donde debía decir «14024» y ya no se entienden; hay que restaurar el texto de la R08.1. Con esto se cierra el punto abierto nº 56.


## E-042 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Con qué cadencia y contra qué fuente se comprueba que todo lo decidido ha entrado en el documento maestro?
**De dónde viene:** panel de ejecución, apartado 06, clave `anexo-61-incorporacion` · respondida por Gerencia el 24/09/2026
**Afecta a:** sin fila · devuelto como pregunta · Anexo D nº 61
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/anexo-61-incorporacion`) · expediente R08.x
**Engram:** `decision/anexo-61-incorporacion` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> La fuente de lo decidido es openspec/config.yaml → decisiones_de_gerencia, donde aterrizan todas las respuestas del panel. Cada entrada lleva dos datos más: el pasaje del maestro que modifica (sección y nº del Anexo D) y la revisión del maestro en la que entró, o «pendiente». Lunes y jueves, npm run reconcile añade una comprobación que lista las decisiones pendientes de entrar al maestro con su antigüedad, y el parte la incluye. Cada dos semanas, o antes si hay 10 pendientes, la sesión de supervisión redacta una revisión R08.x que las incorpora y Gerencia la aprueba; al publicarla, cada decisión queda marcada con su revisión y su punto del Anexo D se tacha con fecha. Ninguna decisión puede llevar más de un mes pendiente: si ocurre, el parte lo señala como desvío. El panel muestra, junto a «En el plan», la marca «En el maestro R08.x». Con esto, ENTRADA.md recoge lo que entra y esta comprobación garantiza que llega al maestro. Cierra el punto abierto nº 61.


## E-043 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿Qué motivos tipificados tiene «Anulado», y qué se hace con el histórico cerrado como Finalizado que en realidad se abandonó?
**De dónde viene:** panel de ejecución, apartado 06, clave `c2-anulado` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1C-01 · S40 · Anexo D nº 32
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/c2-anulado`) · plan §4.5, fila `decision/c2-anulado`
**Engram:** `decision/c2-anulado` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> Motivos de Anulado, la misma lista que usa el informe de salida: (1) el cliente no aprueba o se echa atrás, (2) sin solución técnica, (3) repuesto no disponible, (4) caducidad de espera: el cliente no responde ni retira el equipo, (5) otro, con texto obligatorio. No entra «creado por error» ni «duplicado»: eso se borra, no se anula, para no contaminar la cifra de abandonos.
> Histórico: se marca, no se reescribe. Los candidatos se sacan por la huella que dejó el apaño —tickets que pasaron por Rechazo y terminaron en Finalizado— y una persona los confirma. Los confirmados siguen como Finalizado, como se registraron, pero llevan la marca «abandonado» con su motivo, y las tres métricas los excluyen. No se cambia el estado de tickets cerrados, por la auditoría inmutable de M11.4. Antes de empezar se cuenta cuántos candidatos hay. El mismo criterio de marcar se aplica a las filas de «Liberación sin factura» escritas antes del arreglo de C1.


## E-044 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿A dónde sale cada una de las cuatro esperas —a Por Facturar cobrando el diagnóstico, o a Anulado— y con qué caducidad?
**De dónde viene:** panel de ejecución, apartado 06, clave `c3-salida-esperas` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1C-03 · S42 · Anexo D nº 31
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/c3-salida-esperas`) · plan §4.5, fila `decision/c3-salida-esperas`
**Engram:** `decision/c3-salida-esperas` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> Las cuatro esperas no se tratan igual: dos esperan a terceros y dos a nosotros.
> En espera de repuestos y Servicio externo (proveedor y laboratorio externo): tienen dos salidas y decide Comercial en cada caso, porque cobrar o no el diagnóstico depende del cliente y de quién falló. O se cobra el diagnóstico → Por Facturar, o se anula → Anulado, con motivo repuesto no disponible o sin solución técnica.
> Solicitado (nuestro almacén): no se abandona. Si no hay pieza, vuelve a En espera de repuestos para pedirla fuera.
> En espera de SKU (trámite nuestro): no se abandona ni se anula. Si se retrasa, se avisa a Comercial para que cree el SKU.
> Caducidad: nunca ejecuta sola una salida. En las externas sugiere la salida a Comercial; en las internas escala al área responsable. El plazo de cada una se fija con datos: lo que hoy tarda el 90 % de los tickets en ese estado, medido en el historial. Se conserva la vía de escape manual con traza acordada el 27/08.


## E-045 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿«Facturado» es un estado propio del flujo o un atributo del ticket?
**De dónde viene:** panel de ejecución, apartado 06, clave `c4-dos-ramas` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1C-02 · S41 · Anexo D nº 34
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/c4-dos-ramas`) · plan §4.5, fila `decision/c4-dos-ramas`
**Engram:** `decision/c4-dos-ramas` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> Facturado es un atributo del ticket, no un estado. Adoptamos las dos ramas que propone la R08 para eliminar el ciclo facturar↔entregar, con un cambio: en la rama sin factura, Pendiente de facturar sí es estado —ahí vive el equipo entregado y no facturado, y su antigüedad se mide—, pero de ahí se sale con la transición Facturar, que registra la factura y su fecha, directamente a Finalizado, sin un estado «Facturado» intermedio. El hecho de estar facturado vive en el campo fecha_factura, que ya existe, y así no hay dos sitios que puedan decir cosas distintas. El ticket termina al facturar; el cobro se sigue en contabilidad, no en el ticket.


## E-046 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿Cómo se desambigua «Creación de informe», que hoy cae en tres categorías a la vez?
**De dónde viene:** panel de ejecución, apartado 06, clave `c5-tipo-evento` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1C-04 · S43 · Anexo D nº 35
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/c5-tipo-evento`) · plan §4.5, fila `decision/c5-tipo-evento`
**Engram:** `decision/c5-tipo-evento` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> No bloquea la aplicación del tipo de evento. Medido el 23/09: ninguna de las transiciones de la aplicación es «Creación de informe»; el informe sólo aparece como el campo «Fecha Revisión Informe» dentro de otras transiciones (packages/shared/src/transitions.ts:218-221), y hoy se hace fuera del flujo. F1C-04 puede aplicar el tipo de evento a todas las transiciones ya, sin esperar a esto.
> La desambiguación se aplica en F1E, cuando el informe entre en el flujo. «Operativo manual» y «Operativo digital» son la misma categoría desde el 17/02, así que el solape se reduce a dos, y se resuelve nombrando distinto cada acto: Elaboración del informe → Operativo (redactarlo y generarlo); Emisión del informe → Administrativo (cerrarlo como soporte del servicio facturable). La validación por dos personas de F1E-04 va a Decisional, como Aprobación técnica. El informe pasa por tres categorías porque son tres actos distintos, cada uno con su nombre.


## E-047 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿Cómo es la etapa de control de calidad antes de liberar, y quién firma?
**De dónde viene:** panel de ejecución, apartado 06, clave `c6-qa-liberacion` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1C-07 · S47
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/c6-qa-liberacion`) · plan §4.5, fila `decision/c6-qa-liberacion`
**Engram:** `decision/c6-qa-liberacion` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> Se añade un estado Control de calidad entre En Proceso y Por Facturar. Aprobado → Por Facturar; rechazado → vuelve a En Proceso con prioridad alta, y el retrabajo queda registrado para medirlo.
> Se aplica la misma regla que la Verificación decidida hoy: el checklist se hace siempre; la verificación con gas patrón, sólo cuando la pide el tipo de equipo y tenemos el gas.
> El checklist revisa los puntos que fallaron en el diagnóstico y alimenta el informe de salida.
> No se entrega el equipo sin foto del equipo embalado y checklist firmado.
> Firma [el Coordinador Técnico / Calidad], nunca el técnico que hizo el trabajo. La firma se carga automáticamente con la imagen del responsable, como se decidió el 27/08.


## E-048 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿Qué estados paran el reloj del SLA?
**De dónde viene:** panel de ejecución, apartado 06, clave `c7-reloj-sla` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1C-06 · S45
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/c7-reloj-sla`) · plan §4.5, fila `decision/c7-reloj-sla`
**Engram:** `decision/c7-reloj-sla` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> El reloj del SLA se para sólo cuando la demora no es de Ambientalia: cuando esperamos al cliente o a alguien de fuera. Nunca por esperas internas, que son demora nuestra.
> Se para en: Notificación cliente, Por Entregar y Por Entregar / Sin facturar (esperamos al cliente); En espera de repuestos (al proveedor) y Servicio externo (al laboratorio externo).
> Sigue corriendo en las seis esperas internas: Notificación a Compras, Notificación Comercial, En espera de SKU, Solicitado, Liberación Comercial y Remisión creada.
> La lista se declara propia del reloj, aunque hoy coincida con las esperas «externas» de la vista: no se deriva de ella, para que un cambio en el tablero no mueva el SLA.
> Pendiente queda fuera hasta que Servicio Técnico diga qué espera; mientras tanto, el reloj corre.
> El cuadro de mando enseña dos tiempos: el del SLA (sin pausas) y el total que esperó el cliente.


## E-049 · 2026-09-23 · decision · **CERRADA**
**Qué:** La matriz cargo × transición: ¿qué cargos existen y qué puede ejecutar cada uno?
**De dónde viene:** panel de ejecución, apartado 06, clave `c10-permisos-cargo` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1C-05 · S44 · Anexo D nº 39
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/c10-permisos-cargo`) · plan §4.5, fila `decision/c10-permisos-cargo`
**Engram:** `decision/c10-permisos-cargo` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> La base sigue siendo el área, como hoy: cualquiera de un área ejecuta sus transiciones. El cargo sólo restringe, con una lista corta de excepciones; lo que no está en la lista no cambia.
> Cargos: Director Técnico, Coordinador Técnico, Técnico, Técnico de campo, Director Comercial, Coordinador Comercial y Asistente Comercial. «Gerente comercial» y «Director Comercial» son [el mismo cargo / cargos distintos].
> Restricciones ya decididas: Liberación sin factura → Director Comercial. Crear OVI de garantía → Director Técnico. Prioridad de los Top 5 → Director Comercial.
> Regla para el resto: las transiciones que F1C-04 clasifique como Decisionales sólo las ejecuta el Director o el Coordinador del área correspondiente; las demás, cualquiera del área.
> Propietario del registro: se decide más adelante, cuando la restricción por cargo esté funcionando.


## E-050 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿De dónde sale `remisiones_entrada`: de la plataforma de hojas de vida o de la aplicación?
**De dónde viene:** panel de ejecución, apartado 06, clave `p14-remisiones-entrada` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1E-01 · S46 · Anexo D nº 14
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/p14-remisiones-entrada`) · plan §4.5, fila `decision/p14-remisiones-entrada`
**Engram:** `decision/p14-remisiones-entrada` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> De la aplicación. remisiones_entrada era una pestaña de una hoja de Google (no la plataforma de hojas de vida). Sus 149 remisiones (29/01/2025–24/07/2026) se importaron una sola vez el 04/08, y desde entonces las remisiones de entrada se crean y viven en la aplicación, con su checklist y sus fotos; ningún proceso vuelve a leer la hoja. El punto 14 queda resuelto y F1E-01 se apoya en las remisiones de la aplicación. La hoja de Google [ya no se usa / se sigue usando y se cierra a partir de hoy]. Las remisiones históricas conservan como texto libre lo que traía el equipo; los informes de esos tickets mostrarán el estado inicial sólo como texto.


## E-051 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿Se rehabilitan las rutas abreviadas para equipo sin novedad y calibración directa?
**De dónde viene:** panel de ejecución, apartado 06, clave `p15-p59-rutas` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1C-08 · S48 · y F1B-03 · Anexo D nº 15 y 59
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/p15-p59-rutas`) · plan §4.5, fila `decision/p15-p59-rutas`
**Engram:** `decision/p15-p59-rutas` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> Equipo sin novedad: no se rehabilita la ruta abreviada. Ya se decidió el 03/09: debe recorrer igualmente las etapas macro. Con el checklist dinámico pasa rápido —marca OK en cada macro y no despliega detalle— y queda constancia de que se revisó. Hay que registrar aquí esa decisión del 03/09, que no había llegado al plan.
> Calibración directa: sí. Cuando la orden de venta ya cubre la calibración, el ticket salta diagnóstico, cotización y aprobación y pasa directamente al trabajo. Tres condiciones: (1) sólo con la orden de venta de calibración asignada; (2) si aparece una falla, sale a la ruta completa para cotizar; (3) pasa igualmente por el Control de calidad. Se construye preferentemente con el tipo de servicio de F1B-03, que ya oculta los pasos que no aplican; F1C-08 se queda con lo que F1B-03 no cubra.


## E-052 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿La Verificación es obligatoria por familia de equipo? ¿Qué pasó con el lote AP-370 de 2024? ¿La salida rechazada va a Notificado?
**De dónde viene:** panel de ejecución, apartado 06, clave `p38-verificacion-calidad` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1A-03 · F1B-06 · F1C-07 · Anexo D nº 38
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/p38-verificacion-calidad`) · plan §4.5, fila `decision/p38-verificacion-calidad`
**Engram:** `decision/p38-verificacion-calidad` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> 1. Sí: la Verificación es obligatoria por tipo de equipo, sea cual sea su marca: para analizadores de gases y convertidores, y no para el resto. Es la regla que ya se sigue: en 181 tickets, todos los AP-370 fuera de un solo lote y 7 de 8 convertidores pasaron por ella; GRIMM, dataloggers, shelters y Environics, nunca. Se convierte en guarda: no se puede liberar un equipo de esos tipos sin pasar por Verificación.
> 2. La guarda sólo la exige cuando disponemos del gas patrón que esa verificación necesita. El lote AP-370 de 2024 (#601–#622 y #653–#654) no pasó por Verificación porque son analizadores de H2S, TRS y NH3, y no tenemos gas patrón de esos compuestos: no fue un error, es el criterio. Los convertidores sí se verifican, porque se les pasa un gas que sí tenemos. La lista de gases patrón disponibles se mantiene como dato que se puede cambiar: si conseguimos gas patrón de H2S, TRS o NH3, la Verificación pasa a ser obligatoria también para esos analizadores.
> 3. Sí, la salida rechazada va a Notificado, igual que el único caso de producto no conforme registrado. El volumen esperado es casi nulo; lo que importa es que exista.
> Respondo por Gerencia; Calidad lo ha validado.


## E-053 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿Un juego de macro-fases común a todas las marcas, o uno por marca-modelo? Y antes: ¿está este punto resuelto o no?
**De dónde viene:** panel de ejecución, apartado 06, clave `p45-macro-fases` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1D-03 · S44 · Anexo D nº 45
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/p45-macro-fases`) · plan §4.5, fila `decision/p45-macro-fases`
**Engram:** `decision/p45-macro-fases` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> Los N1 son propios de cada marca, no comunes a todas. El Grimm EDM180 conserva sus 8 N1 y el Horiba sus 10 N1, tal como están en los catálogos (Grimm v1.8, Horiba v1.4). Dentro de una misma familia tecnológica los N1 sí son comunes: los 10 del Horiba valen para los cuatro AP-370. Lo que hace del diagnóstico una plataforma es que el motor es uno y cada equipo entra como datos importados de su catálogo; F1D-03 genera las transiciones desde los N1 de cada catálogo. Las cuatro macro-fases del 27/08 quedan superadas, y se corrige el maestro, que en el punto 45 hablaba de un juego común a todas las marcas. Si más adelante el análisis de tiempos necesita comparar fases entre marcas, se añade al catálogo una columna opcional de categoría común, sin tocar los N1. Correcciones dentro del Horiba: en el APNA, «Conexiones neumáticas traseras» pasa de Gabinete a Línea de muestreo, y se unifican entre los cuatro modelos los nombres de N2 que designan lo mismo.


## E-054 · 2026-09-23 · decision · **CERRADA**
**Qué:** ¿El formulario de falla nueva bloquea la transición o sólo avisa?
**De dónde viene:** panel de ejecución, apartado 06, clave `falla-nueva-bloqueante` · respondida por Gerencia el 23/09/2026
**Afecta a:** F1D-07 · S47
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/falla-nueva-bloqueante`) · plan §4.5, fila `decision/falla-nueva-bloqueante`
**Engram:** `decision/falla-nueva-bloqueante` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (23/09/2026):**

> Son dos cosas. Rellenar el formulario es obligatorio: si el técnico encuentra una falla que no está en el catálogo, no puede avanzar sin describirla. El formulario es corto —qué es, dónde está, gravedad y foto— para que no desanime a reportar. Si la falla bloquea la liberación depende de su gravedad, igual que las del catálogo: el técnico le asigna Alerta, Cobrable o Bloqueante, y tiene el mismo efecto que en el catálogo (se registra, se cotiza, o impide liberar el equipo). Toda falla nueva genera un aviso al [Director Técnico], que confirma la gravedad y decide si se incorpora al catálogo en su siguiente versión.


## E-055 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Desde qué fecha los tickets nacen en la aplicación y no en Zoho Desk?
**De dónde viene:** panel de ejecución, apartado 06, clave `fecha-corte` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1F-01 · S50
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/fecha-corte`) · plan §4.5, fila `decision/fecha-corte`
**Engram:** `decision/fecha-corte` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Los tickets nacen en la aplicación desde el lunes 14 de diciembre de 2026. Es un corte en seco: desde ese día nadie crea ni edita tickets en Zoho Desk, y ningún ticket se registra en los dos sistemas. El fin de semana anterior (12–13 de diciembre) los tickets abiertos de Zoho pasan a la aplicación en su estado equivalente, y Zoho queda en solo lectura. Las pruebas con dos o tres servicios reales se hacen antes del corte, no después. La fecha se confirma el miércoles 9 de diciembre si están listos: creación y movimiento de tickets, respuestas al cliente por correo sin pasar por Zoho, histórico completo verificado y pruebas superadas. Si algo falta, el corte pasa al lunes 21 de diciembre, que es la última fecha posible: después hace falta una semana de funcionamiento sin Zoho, con Zoho todavía contratado, antes de darlo de baja en la fecha de renovación de las licencias.


## E-056 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Quién es responsable del respaldo, con qué alcance y con qué periodicidad?
**De dónde viene:** panel de ejecución, apartado 06, clave `p55-backup` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1F-02 · S51 · con adelanto inmediato · Anexo D nº 55
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/p55-backup`) · plan §4.5, fila `decision/p55-backup`
**Engram:** `decision/p55-backup` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Responsable: Alfonso (Gerencia). La copia es automática; el responsable recibe un aviso por correo si una copia falla y revisa cada mes el resultado de la prueba de restauración. Alcance: la base de datos completa y todos los archivos (adjuntos, fotos, informes emitidos, firmas), guardados cifrados fuera del servidor de Hostinger, en [Google Drive de la empresa / otro destino]. Las claves de acceso se guardan aparte, también cifradas. Periodicidad: una copia cada noche, y una copia extra antes de cada cambio que se suba a la aplicación. Se conservan las 7 últimas diarias, 4 semanales y 12 mensuales. Una vez al mes se restaura una copia en una base aparte y se comprueba que los tickets coinciden; el resultado queda anotado en el parte.
> Como se trabaja directamente sobre la aplicación en uso, la copia nocturna y la previa a cada cambio se adelantan y se ponen en marcha ya, sin esperar a diciembre; el resto de la tanda F1F-02 sigue en su fecha.


## E-057 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Se retira la capa as-built o se mantiene el Anexo H?
**De dónde viene:** panel de ejecución, apartado 06, clave `p62-capa-as-built` · respondida por Gerencia el 24/09/2026
**Afecta a:** premisa de F0-02 · sin tanda · Anexo D nº 62
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/p62-capa-as-built`) · plan §4.5, fila `decision/p62-capa-as-built`
**Engram:** `decision/p62-capa-as-built` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Se aplican los dos criterios, cada uno en su sitio. El cuerpo del maestro (M1–M12) describe cómo debe funcionar el sistema: se retiran las marcas [AS-BUILT], las rutas de ficheros y los números de línea. Los pasajes as-built que contienen una regla decidida no se borran: se reescriben como regla de negocio, sin referencia al código. El Anexo H se mantiene como único lugar del maestro donde se compara lo planificado con lo construido, pero deja de redactarse a mano: en cada revisión R08.x se genera a partir de docs/sdd/RECONCILIACION.md (npm run reconcile), con la fecha y el commit contra el que se midió. Donde decía «demostrador», se actualiza: la aplicación ya está en uso. La limpieza se hace en la próxima revisión del maestro. Cierra el punto abierto nº 62.


## E-058 · 2026-09-24 · decision · **CERRADA**
**Qué:** Las filas de «Liberación sin factura» escritas antes del arreglo de C1: ¿se corrigen, se marcan, o se excluyen del indicador?
**De dónde viene:** panel de ejecución, apartado 06, clave `p64-historico-c1` · respondida por Gerencia el 24/09/2026
**Afecta a:** sin tanda · dato de producción · Anexo D nº 64
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/p64-historico-c1`) · plan §4.5, fila `decision/p64-historico-c1`
**Engram:** `decision/p64-historico-c1` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Se marcan; no se corrigen ni se excluyen, según el criterio ya decidido en c2. Las liberaciones sin factura registradas antes del arreglo de C1 conservan sus valores tal como se guardaron en ticket_transitions.values y llevan la marca «anterior al arreglo de C1 — sin afirmación registrada». Cuentan en el recuento de liberaciones sin factura y quedan fuera sólo de los indicadores que dependen del motivo o de la fecha prevista de facturación, porque no los tienen. Las que correspondan a tickets que siguen en Pendiente de facturar se regularizan hacia adelante: el Director Comercial registra ahora motivo y fecha prevista como un evento nuevo, con su nombre y fecha, sin modificar la fila original; desde ese momento les aplica la alarma del punto 33. Claude Code prepara la consulta de solo lectura que cuenta estas filas y separa las que siguen sin facturar; la ejecuta contra producción [nombre de la persona].


## E-059 · 2026-09-24 · decision · **CERRADA**
**Qué:** ¿Qué dos roles validan un informe antes de emitirse?
**De dónde viene:** panel de ejecución, apartado 06, clave `roles-validacion-informe` · respondida por Gerencia el 24/09/2026
**Afecta a:** F1E-04 · S49 · Anexo D nº 10
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/roles-validacion-informe`) · plan §4.5, fila `decision/roles-validacion-informe`
**Engram:** `decision/roles-validacion-informe` — la carga la sesión de construcción; esta supervisión no carga Engram.

**Respuesta textual de Gerencia (24/09/2026):**

> Un informe lleva tres firmas: Elaboró (el técnico que hizo el trabajo), Revisó (el Coordinador Técnico) y Aprobó (el Director Técnico). Las dos validaciones antes de emitir son las del Coordinador Técnico y el Director Técnico. La revisión del Coordinador es la misma firma del Control de calidad: se hace en un solo paso y no se pide dos veces. Nadie valida un informe que él mismo elaboró. Si el autor es el Coordinador Técnico, el Director Técnico revisa y aprueba en un solo paso. Si el Director Técnico no está disponible, el Coordinador Técnico revisa y aprueba en un solo paso. En ambos casos el informe se emite con una sola validación y queda marcado como «validación única». Si el autor es el Coordinador Técnico y el Director no está, el informe espera al regreso del Director. El área Comercial no valida informes. Una vez aprobado, el informe se emite con la imagen de las firmas cargada automáticamente y ya no se puede modificar.
> La ausencia del Director Técnico se registra en el sistema con fecha de inicio y fin; sólo mientras esté vigente se permite que el Coordinador apruebe.


---

## Adendas a entradas ya abiertas — corte del 2026-09-24


### E-001 · **CERRADA 24/09.** Respondida por Gerencia el 24/09/2026, clave `e001-por-entregar`

**Respuesta textual:**

> Fuera del plan. Según el dictamen del 17/09, un cambio cuenta como una tanda cuando realiza el contenido de su fila, y la fila de F1B-08 es paridad de listado y ficha con Zoho Desk y política de escritura; clasificar Por Entregar como espera no es paridad con Zoho. Tampoco realiza F1C-06: la lista de estados que paran el reloj del SLA es propia y no se deriva de la del tablero (c7). Se registra con tanda: fuera-del-plan y motivo: «Por Entregar se muestra en el tablero como espera del cliente; coherente con la lista del reloj de c7, pero independiente de ella». No mueve cifras: F1B-08 sigue parcial. Regla general que queda escrita: no existe «cuenta en parte»; cada cambio lleva un único ID de tanda o fuera-del-plan con motivo.

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e001-por-entregar`). openspec/config.yaml → unidad_de_avance (regla e) · CLAUDE.md → R-4 · docs/sdd/ENTRADA.md → E-001 (cerrada) · docs/sdd/Parte_2026-09-24.md
**Engram:** `decision/e001-por-entregar`.

### E-009 · **CERRADA 24/09.** Respondida por Gerencia el 24/09/2026, clave `e009-kpis`

**Respuesta textual:**

> Adelanta una sola pieza a Fase 1: la continuidad de los indicadores que hoy calcula Zoho Desk. Antes del corte del 14/12, Desk 2.0 calcula sobre las marcas de tiempo de las transiciones (base ya hecha en F1A-04) los indicadores del Anexo G que hoy se usan: [cumplimiento del tiempo promesa, tiempo de servicio, tiempo de diagnóstico, satisfacción del cliente…]. Se entregan como tabla exportable, sin tablero, semáforos ni umbrales, y se calculan en paralelo con Zoho durante las semanas previas al corte para comprobar que coinciden. La encuesta de satisfacción que hoy envía Zoho al finalizar el ticket pasa a enviarla Desk 2.0 desde el corte, para que el reporte trimestral no se quede sin datos. Se crea una tanda nueva en la épica 1F (tamaño S–M, capacidad kpis). Todo lo demás de kpis —tablero Kanban, OTD y lead times con semáforo, dashboards por rol— se queda en Fase 2 como está planificado.

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e009-kpis`). openspec/config.yaml → capabilities (kpis) · docs/sdd/ENTRADA.md → E-009, cerrada · docs/sdd/R08.3_Expediente_de_cambios.md §11.2
**Engram:** `decision/e009-kpis`.

### E-026 · **CERRADA 23/09.** Respondida por Gerencia el 23/09/2026, clave `top5-manual`

**Respuesta textual:**

> La prioridad automática sigue para todos los clientes; los Top 5 son la excepción y su prioridad se pone a mano. Se pone sobre el cliente, no sobre cada ticket: se fija una vez y todos sus tickets la heredan, para que ningún ticket de un Top 5 se quede sin prioridad porque alguien se olvidó. La pone el [Director Comercial], que también mantiene la lista de quiénes son Top 5. El técnico sigue sin poder editarla, como dice el plan: el bloqueo es para el técnico, no para ese cargo. Si hace falta que un ticket concreto de un Top 5 vaya distinto, ese mismo cargo puede ajustarlo en el ticket con motivo escrito.

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/top5-manual`). openspec/config.yaml → decisiones_de_gerencia (decision/top5-manual) · plan §4.5, fila decision/top5-prioridad, ahora cerrada · docs/sdd/ENTRADA.md → E-026, cerrada
**Engram:** `decision/top5-manual`.

### E-027 · **CERRADA 23/09.** Respondida por Gerencia el 23/09/2026, clave `trabajo-sin-ficha`

**Respuesta textual:**

> Ninguna de las tres tal cual. El problema no es la política sino que nada compara los commits con las fichas: la opción 1 sería una regla sin quien la haga cumplir. Primero, una comprobación nueva en npm run reconcile: commits en main que tocan apps/ o packages/ y que ninguna ficha reclama se listan en el parte. Es barato — el cli.ts ya hace las llamadas a git y el núcleo está hecho para añadir comprobaciones. Y con eso, la regla: si un cambio toca openspec/specs/, lleva ficha; si no, puede ir directo y el barrido lo lista. Este cambio tocaba specs/zoho-sync/spec.md:221, así que debió llevarla, y se le hace una ficha retroactiva. Asumo que cada corte traerá una lista de trabajo sin ficha que hay que leer: si nadie la lee, volvemos al punto de partida.

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/trabajo-sin-ficha`). CLAUDE.md → R-5 · docs/sdd/ENTRADA.md → E-027, cerrada · docs/sdd/R08.3_Expediente_de_cambios.md §11.2 La cita a la línea 221 de la spec de zoho-sync que hace la respuesta de Gerencia de arriba se lee contra `e2de125`, la revisión en que se escribió: `openspec/specs/zoho-sync/spec.md:221` en `e2de125` (fila «Zoho Books (rico)»).
**Engram:** `decision/trabajo-sin-ficha`.

### E-003 · adenda del 2026-09-24

**`e003-catalogo-equipos` — respondida el 23/09/2026. Textual:**

> Ya está: no necesita fila propia. Medido contra el código el 23/09 — los tres catálogos con su API y su pantalla, artículos por modelo con SKU y categorías, mano de obra como una de las tres clases de artículo (packages/shared/src/types.ts:239), y la columna revisar que marca qué modelos llevan inspección. Se escribe que F1D-01 lo da por hecho y el hueco se cierra sin mover el denominador, que sigue en 52. Lo que queda no es construcción sino datos: hay que comprobar contra la base cuántos de los modelos llevan inspección y cuántos tienen sus artículos y su mano de obra cargados, porque eso no se ve desde el repositorio. Va junto con el recuento de modelos, en la misma comprobación.

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e003-catalogo-equipos`). **Engram:** `decision/e003-catalogo-equipos`.

**`e003b-registro-equipos` — respondida el 23/09/2026. Textual:**

> Le queda trabajo, y ya tiene fila: F1B-02, S39, sin empezar. No hace falta fila nueva y el denominador se queda en 52. Medido contra el código el 23/09: la tabla equipos existe con serial, marca, modelo, tipo, cliente y estado (packages/zoho-sync/src/db/schema.sql:189-208), pero no tiene ninguno de los cuatro campos de la hoja de vida ni el enlace a Drive — están todos por construir en F1B-02. Ojo: codigo_interno y fecha_factura aparecen en el código pero son de la tabla de tickets, no de equipos; no cuentan. Con la decisión del mantenedor, F1B-02 pasa de cuatro campos a cinco. Se escribe que la capacidad catalogo-equipos, en su parte de registro de equipos, queda cubierta por F1B-02.

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e003b-registro-equipos`). **Engram:** `decision/e003b-registro-equipos`.

### E-005 · adenda del 2026-09-24

**`e005b-parche-vehiculo` — respondida el 23/09/2026. Textual:**

> Ninguna de las dos: el parche se declara como parte de F1B-11, sin cerrarla (tanda: F1B-11, cierra: no), igual que los dos parciales que ya tiene F1B-08. El total sigue en 52 y el avance no se mueve hasta que F1B-11 cierre. Y con esto IV-11 deja de estar sin destino: su destino es F1B-11, que es donde el problema desaparece de raíz al existir la tabla de asociación propia. Hay que anotar en la fila de F1B-11, con fecha, que también cubre IV-11. Asumo que si F1B-11 se retrasa, el parche no se verá en el avance mientras tanto.

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e005b-parche-vehiculo`). **Engram:** `decision/e005b-parche-vehiculo`.

**`e005c-discrepancia-sin-espejo` — respondida el 23/09/2026. Textual:**

> Opción 1, y no hace falta esperar al espejo: el mecanismo de avisos ya existe y se usa —apps/desk/server/db/avisos.ts, /api/avisos y la bandeja de la cabecera, lo mismo que dispara el escalado del SLA—, así que enseñar la discrepancia es una llamada más, no una pantalla nueva. Cuando la sincronización traiga una orden distinta a la elegida en la aplicación: se protege el dato, y se crea un aviso al área Comercial sobre ese ticket, diciendo qué orden trae Zoho y cuál tiene la aplicación, para corregirlo a mano. Un solo aviso por ticket mientras la discrepancia no cambie; sólo se vuelve a avisar si el valor que trae Zoho es otro. Cuando exista el espejo de Zoho, esa misma información se mostrará allí y el aviso podrá retirarse.

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/e005c-discrepancia-sin-espejo`). **Engram:** `decision/e005c-discrepancia-sin-espejo`.

### E-019 · adenda del 2026-09-24

**`mantenedor-campo-cuando` — respondida el 23/09/2026. Textual:**

> Opción 1: el campo entra ahora, en la hoja de vida. Es opcional, y vacío significa que paga el dueño del equipo, que es como funciona hoy: mientras nadie lo rellene no bloquea nada. Sólo se apuntan las excepciones, no los 354 equipos. Lo que ganamos son tres semanas para ir descubriendo los casos que no tenemos en la lista —hoy conocemos uno— antes de que el control empiece a bloquear en S41. La fila de la hoja de vida pasa de cuatro campos a cinco: queda anotado como cambio de alcance con fecha de hoy, no colado. El control de quién puede pagar sigue en la tanda de las órdenes de venta, sin cambios.

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/mantenedor-campo-cuando`). **Engram:** `decision/mantenedor-campo-cuando`.

---

## E-060 · 2026-09-24 · hallazgo · **CERRADA el 24/09 (segundo corte)**
**Qué:** Las DOS comprobaciones nuevas que Gerencia pidió para `npm run reconcile` no tienen fila, porque F0-05 —la tanda que construyó el barrido— está archivada y cerrada desde el 20/09.
**De dónde viene:** consecuencia medida de dos respuestas del propio corte: `decision/trabajo-sin-ficha` (23/09) pide listar los commits de `main` que tocan `apps/` o `packages/` y que ninguna ficha reclama; `decision/anexo-61-incorporacion` (24/09) pide listar las decisiones pendientes de entrar al maestro con su antigüedad.
**Afecta a:** `apps/desk/server/reconciliacion/cli.ts` · el propio mecanismo de F0-05 · el parte de cada corte
**Estado:** triada
**Destino:** ~~sin destino~~ → **F0-06, fila nueva de Fase 0, talla S** (Gerencia, 24/09, `decision/barrido-comprobaciones-nuevas`, E-064). La fila **no está escrita en el §5**: la escribe quien fije el alcance. Denominador 52 → 53 (54 con el calendario laboral).
**Lo medido, para que no se lea como trámite.** La ventana sigue abierta mientras tanto: entre el 22/09 y el 24/09 entraron CINCO commits de producto sin ficha —`b7c1ba8`, `42172d7`, `244c237`, `3951ad0`, `3385281`, la historia de tickets desde Zoho sobre `packages/`—, después de que Gerencia decidiera la regla el 23/09 y antes de que exista nada que la haga cumplir. Es el segundo lote en tres días, tras los seis commits del 22/09.

## E-061 · 2026-09-24 · hallazgo · **CERRADA el 24/09 (segundo corte)**
**Qué:** Contar en DÍAS HÁBILES exige un calendario laboral —L-V de 8 a 17, festivos de Colombia— que la aplicación no tiene, y de él dependen las tres alarmas de `SLA_HORAS_POR_ESTADO`, el escalado de C11 y el reloj del SLA de `c7`.
**De dónde viene:** consecuencia no prevista de `decision/anexo-3-alerta` (24/09), que fija las tres alarmas en 9, 27 y 36 horas **hábiles**.
**Afecta a:** `packages/shared/src/sla.ts:32-35` en `bb58e83` (entonces una sola entrada, `'Notificado': 24`, y son horas de reloj, no hábiles) · F1A-02 (cerrada) · F1B-08 (S44) · F1C-06 (S45)
**Estado:** triada
**Destino:** ~~sin destino~~ → **fila nueva propia, talla S** (Gerencia, 24/09, `decision/calendario-habil`, E-063), que **precede** a las alarmas y al reloj del SLA. La fila **no está escrita en el §5**.
**Medido el 2026-09-24 sobre `3f30710`:** ~~`grep -rniE "festivo|habil|holiday" packages/ apps/ --include=*.ts` = **0 aciertos**~~ — **CITA CORREGIDA el 24/09 en el segundo corte: ese comando da 126, no 0**, porque `habil` acierta dentro de `habilitar`/`habilitarServicio` (125 de los 126). El comando que sostiene la afirmación es `grep -rniE "festivo|holiday" packages/ apps/ --include=*.ts` = **0 aciertos**. La conclusión no cambia; la cita no era reproducible, y se conserva tachada porque el registro no se borra. No es cambiar un número: es una pieza nueva de la que cuelgan tres alarmas y un reloj.

## E-062 · 2026-09-24 · hallazgo
**Qué:** `.git/index.lock` quedó huérfano en el repositorio, creado por una orden de git de SOLO LECTURA de esta supervisión, y no se puede borrar desde aquí.
**De dónde viene:** corte del 24/09. `git status --porcelain docs/sdd` devolvió `warning: unable to unlink '.git/index.lock': Operation not permitted`. El fichero existe, 0 bytes, con fecha 24/09 12:29.
**Afecta a:** cualquier orden de git que tome el índice en este repositorio, desde Windows o desde donde sea
**Estado:** triada
**Destino:** — tarea de persona, **no tanda**. Lo borra Alfonso desde Windows: `del C:\dev\Desk_2_R1.023\.git\index.lock`.
**Por qué pasó, y no es un fallo de git.** La carpeta se monta en la sesión con el borrado deshabilitado por defecto, así que `git status` pudo CREAR el lock y no pudo RETIRARLO. Es un efecto del montaje, no del repositorio, y se repetirá en cada corte mientras el borrado siga deshabilitado. No se ha borrado desde aquí, por la regla del parte: un `index.lock` huérfano se dice, no se borra.

## E-063 · 2026-09-24 · decision · **CERRADA**
**Qué:** De dónde sale el calendario laboral que exigen las alarmas en días hábiles.
**De dónde viene:** panel, apartado 06, `calendario-habil` · respondida por Gerencia el 24/09
**Afecta a:** `packages/shared/src/sla.ts:32-35` · F1A-02 (cerrada) · F1B-08 · F1C-06 · Anexo D nº 3 y nº 33 · `e009b-lista-indicadores`
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/calendario-habil`) · plan §4.5, fila nueva
**Respuesta textual:** «Opción 2: el calendario laboral se construye ahora como pieza propia, antes de cualquier alarma, en una tanda nueva de tamaño S. […] Ninguna otra tanda construye su propio cálculo de horas hábiles. La entrada actual 'Notificado': 24 horas de reloj pasa a 9 horas hábiles cuando la pieza exista. Se acepta que el avance baje una fila al crearla. Cierra la entrada E-061.»
**Cierra E-061.**

## E-064 · 2026-09-24 · decision · **CERRADA**
**Qué:** De dónde sale el trabajo de las dos vigilancias nuevas del barrido, con F0-05 ya cerrada.
**De dónde viene:** panel, apartado 06, `barrido-comprobaciones-nuevas` · respondida por Gerencia el 24/09
**Afecta a:** `apps/desk/server/reconciliacion/cli.ts` · R-5 de `CLAUDE.md` · `decision/anexo-61-incorporacion` · el denominador del avance
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/barrido-comprobaciones-nuevas`) · plan §4.5, fila nueva **F0-06**
**Respuesta textual:** «Opción 1: fila nueva F0-06, «Vigilancias del repaso automático», tamaño S, en la cola de inmediato. […] Se acepta que el total pase a 53 (54 con la tanda del calendario laboral) […] Independientemente de la tanda, la primera revisión R08.x que incorpora las decisiones pendientes se publica antes del 17/10.»
**Cierra E-060.**

## E-065 · 2026-09-24 · decision · **CERRADA**
**Qué:** Si «gerente comercial» y «Director Comercial» son el mismo cargo.
**De dónde viene:** panel, apartado 06, `c10b-gerente-director` · corchete de `decision/c10-permisos-cargo`
**Afecta a:** plan `:178` (fila F1C-05) y §4.5 · F1C-05 · `packages/shared/src/transitions.ts:276-281`
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan `:178` **corregido** y §4.5 sin fleco
**Respuesta textual:** «Son el mismo cargo. […] el cargo es Director Comercial. Se corrige la línea 162 del plan […] Los cargos son siete: Director Técnico, Coordinador Técnico, Técnico, Técnico de campo, Director Comercial, Coordinador Comercial y Asistente Comercial.»
**Nota de la supervisión:** la línea es la **178** en el fichero de hoy, no la 162; el texto corregido es el que Gerencia describe y queda con su nota de procedencia, sin borrar el superado.

## E-066 · 2026-09-24 · decision · **CERRADA**
**Qué:** Si alguien sigue rellenando la hoja de Google de remisiones de entrada.
**De dónde viene:** panel, apartado 06, `p14b-hoja-google` · corchete de `decision/p14-remisiones-entrada`
**Afecta a:** F1E-01 · F1F-01 · Anexo D nº 14
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan §4.5 (fila `p14-remisiones-entrada`) · R08.3 §11.3
**Respuesta textual:** «Se sigue usando y se cierra con la migración completa a Desk 2.0, el día del corte (14/12/2026). Mientras convivan, la aplicación es la que manda […] Antes del 31/10 se averigua quién la rellena y para qué […] El día del corte, las filas apuntadas en la hoja después del 24/07/2026 se comparan una a una contra las remisiones de la aplicación […] Después, la hoja pasa a solo lectura.»

## E-067 · 2026-09-24 · decision · **CERRADA**
**Qué:** Destino de las copias de seguridad, y si el respaldo alcanza a los documentos de Drive.
**De dónde viene:** panel, apartado 06, `p55b-destino-copia` · corchete de `decision/p55-backup` y advertencia de `decision/p8-p54-drive`
**Afecta a:** F1F-02 · el adelanto inmediato de la copia nocturna, que sigue sin fila
**Estado:** cerrada **en parte** — el proveedor sigue entre corchetes
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan §4.5 (fila `p55-backup`) · R08.3 §11.3 · devuelto como `p55c-proveedor-copia`
**Respuesta textual:** «Destino: un almacenamiento de objetos de un proveedor distinto de Google y de Hostinger ([Backblaze B2 / Cloudflare R2 / Amazon S3]), con credenciales propias que no se usan para trabajar y con bloqueo de borrado durante el periodo de retención […] el respaldo alcanza a la carpeta de documentación de servicio de Google Drive a la que enlaza Desk 2.0 […] una vez por semana, con copia incremental y retención de 12 meses […] La prueba mensual de restauración incluye recuperar un documento de esa carpeta.»

## E-068 · 2026-09-24 · decision · **CERRADA**
**Qué:** Quién ejecuta los tres recuentos contra la base de producción, y para cuándo.
**De dónde viene:** panel, apartado 06, `p64b-quien-ejecuta` · corchete de `decision/p64-historico-c1`
**Afecta a:** F1C-01 (empieza el 28/09) · F1D · Anexo D nº 64 · las tres mediciones que los tres últimos cortes venían nombrando sin dueño
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` · plan §4.5 (fila `p64-historico-c1`) · R08.3 §11.3
**Respuesta textual:** «Los hace Alfonso, los tres juntos, el viernes 25/09. Claude Code prepara antes un único fichero con las tres consultas de solo lectura […] Plazos límite […] el recuento de tickets Rechazo → Finalizado, el viernes 25/09 […] el del catálogo de modelos, el 09/10 […] el de liberaciones sin factura anteriores al arreglo, el 02/10. Con esto se rellena también el nombre pendiente del punto 64: lo ejecuta Alfonso.»
**Medido el 2026-09-24 sobre `3f30710`:** el fichero con las tres consultas **no existe** — `ls docs/sdd/*consulta* scripts/*consulta*` sin aciertos. Es la única parte de esta respuesta que vence hoy.

## E-069 · 2026-09-24 · decision · **CERRADA**
**Qué:** La lista cerrada de indicadores que la aplicación tiene que calcular antes del corte.
**De dónde viene:** panel, apartado 06, `e009b-lista-indicadores` · corchete de `decision/e009-kpis`
**Afecta a:** la fila nueva de la épica 1F (capacidad `kpis`) · F1A-04 (cerrada) · `calendario-habil` · `docs/sdd/Decision_Correo_n8n_vs_GmailAPI.md` · Anexo G
**Estado:** cerrada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` · R08.3 §11.3
**Respuesta textual:** «La lista cerrada son nueve indicadores del Anexo G: tiempo de permanencia (47), tiempo de diagnóstico (49), tiempo de servicio en días hábiles (50·53), tiempo de recogida del equipo (51), cumplimiento del tiempo promesa (54 […]), satisfacción del cliente (55), tiempo de cotización (57), tiempo de orden de compra (58) y tiempo de orden de venta (59) […] se dan por buenos si coinciden en al menos el 95 % de los tickets, con diferencia máxima de un día […] el tiempo de servicio necesita el calendario laboral, y la satisfacción necesita que la aplicación envíe la encuesta por la salida de correo propia antes del 14/12.»
**Lo medido, y es lo que hay que mirar:** la comprobación dura las **cuatro semanas previas al corte** —del 16/11 (S47) al 14/12— y el §5 sitúa la épica 1F en **S50–S52** (`:259-261`). Para comparar cuatro semanas contra Zoho, lo calculado tiene que funcionar **tres semanas antes** de donde el plan pone la épica.

## E-070 · 2026-09-24 · idea · **CERRADA el 24/09 (tercer corte)**
**Qué:** En un ticket de «Equipo nuevo» el equipo todavía no existe: el alta del ticket debe permitir **registrarlo en ese mismo paso** —serial, modelo del catálogo, cliente, fecha de factura y los demás datos del registro— en lugar de exigir elegir uno existente. Para mantenimiento y soporte remoto se mantiene la regla actual. Y las fichas del panel que aún no están construidas llevan la marca visible «Aún no construido».
**De dónde viene:** panel, apartado 07, idea `25i881jbkytb1kqj0wqb` · Gerencia, 24/09
**Afecta a:** `apps/desk/server/services/ticketService.ts:22-24` · F1B-06 (S42, talla L) · capacidad `catalogo-equipos` · el propio panel
**Estado:** cerrada
**Destino:** **FILA PROPIA**, «Alta y edición del equipo», talla **S–M**, antes de S42 y **sin depender de F1B-06**. Decidido por Gerencia el 24/09 (`decision/equipo-nuevo-alta-en-ticket`), que descarta expresamente meterla en F1B-06: «si F1B-06 se recorta, esta pieza se mantiene». La fila **no se escribe en el §5** aquí: esta supervisión no escribe alcance. Registro en `openspec/config.yaml` → `decisiones_de_gerencia` y fila en el §4.5.
**Respuesta textual (Gerencia, 24/09):** «Opción 2: fila propia, tamaño S, que puede ir antes de S42 y no depende de F1B-06 […] serial, modelo del catálogo, cliente y fecha de factura como obligatorios; fecha de adquisición, fin de garantía, código interno, Drive y mantenedor como opcionales […] Si el serial ya existe en el registro, no se crea otro: se ofrece el equipo existente […] Se acepta que el total suba una fila y el porcentaje baje el día que se cree. Si F1B-06 se recorta, esta pieza se mantiene.» La segunda mitad de la idea —la marca «Aún no construido»— ya aterrizó en `CLAUDE.md` → **R-6** en el segundo corte.
**Medido el 2026-09-24 sobre `3f30710`:** el alta exige equipo existente — `apps/desk/server/services/ticketService.ts:22-24`, `if (!equipoId) throw new HttpError(422, { error: 'Falta el equipo' })` y `getEquipo` a continuación. La segunda mitad de la idea, la marca «Aún no construido», es regla de redacción del panel y aterriza en `CLAUDE.md` → **R-6**; aplicada en el panel en este mismo corte.

## E-071 · 2026-09-24 · idea · **CERRADA el 24/09 (tercer corte)**
**Qué:** Dos cosas sobre la hoja de vida. (a) Poder **editar** los seis campos comerciales desde la propia hoja de vida, con un botón «Editar» en su cabecera, sin volver a la lista de Equipos. (b) Decidir si la edición de fecha de factura, fin de garantía y mantenedor **se restringe a Comercial**, que es quien da de alta los equipos según lo decidido el 20/08.
**De dónde viene:** panel, apartado 07, idea `80h92fw43v6mj1979cjr` · Gerencia, 24/09
**Afecta a:** `apps/desk/src/components/HojaDeVida.tsx` · `apps/desk/server/routes/equipos.ts:73` · F1B-02 (**cerrada** el 23/09) · F1B-05 y F1C-05 (permisos) · `decision/c10-permisos-cargo`
**Estado:** cerrada
**Destino:** **la misma fila que E-070**, que por esta decisión pasa a llamarse «Alta y edición del equipo» y de S a **S–M**. Decidido por Gerencia el 24/09 (`decision/edicion-datos-comerciales-equipo`): restricción **por área, no por cargo** —Comercial y administradores para factura, fin de garantía y mantenedor; cualquiera con sesión para adquisición, código interno y Drive—, con registro de cambios visible en la hoja de vida y la restricción **aplicada en el servidor**. El denominador sube **una sola vez** por E-070 y E-071 juntas.
**Respuesta textual (Gerencia, 24/09):** «Se reserva, por área y no por cargo […] porque deciden si un servicio se cobra y quién puede pagarlo […] Todo cambio en cualquiera de los seis campos queda registrado con persona, fecha y hora, valor anterior y valor nuevo, y se ve en la hoja de vida […] el servidor aplica la restricción, no solo la pantalla. Se construye en la misma fila que el alta del equipo desde el ticket de equipo nuevo, que pasa a llamarse «Alta y edición del equipo» (tamaño S–M), en lugar de abrir una fila más.» ⚠️ **Alcance nuevo que F1B-02 no construyó:** el historial de cambios de los seis campos. F1B-02 hizo los campos, no su registro.
**Medido el 2026-09-24 sobre `3f30710`:** Gerencia tiene razón en las dos mitades. `apps/desk/server/routes/equipos.ts:73` es `app.patch('/api/equipos/:id', requireAuth(db), …)`: **cualquier sesión válida** puede cambiar los datos comerciales, sin comprobación de área ni de cargo. Y `apps/desk/src/components/HojaDeVida.tsx` no tiene ningún control de edición — `grep -n "Editar|onSave" ` sin aciertos: hoy la hoja de vida sólo muestra.

## E-072 · 2026-09-24 · idea · **CERRADA el 24/09 (tercer corte)**
**Qué:** Mostrar el mapa del blueprint **dentro de la aplicación**, en la entrada «Blueprint (estados y transiciones)» de Configuración que hoy está reservada. Que el generador de F1A-06 produzca además una imagen SVG en cada compilación y la pantalla la muestre, sin añadir Mermaid a la aplicación y vigilada por la misma prueba. Motivo: Servicio Técnico y Comercial no abren GitHub ni VS Code. Tamaño estimado XS–S.
**De dónde viene:** panel, apartado 07, idea `j217i4hewc63g8atuh37` · Gerencia, 24/09
**Afecta a:** `apps/desk/src/components/Configuracion.tsx:118` · `scripts/generar-mapa-blueprint.ts` · capacidad `mapa-blueprint` · F1A-06 (**archivada** el 22/09) · F1B-09 (auditoría, no visualización)
**Estado:** cerrada
**Destino:** **FILA PROPIA**, «Mapa del blueprint en la aplicación», **antes de F1B-06**, con **talla XS–S por medir**: la primera tarea de la tanda es comprobar si la compilación puede producir la imagen, y de esa medición sale la talla. Decidido por Gerencia el 24/09 (`decision/mapa-en-la-app`). La fila **no se escribe en el §5** aquí.
**Respuesta textual (Gerencia, 24/09):** «Fila propia, "Mapa del blueprint en la aplicación", que va antes de F1B-06 para que las ramas de equipo nuevo y soporte remoto se vean en la aplicación desde el día en que se construyan. Primer paso de la tanda, antes de fijar la talla: comprobar si la compilación puede producir la imagen del diagrama […] En los dos casos el diagrama sale del código, lo vigila la prueba que ya existe, y la entrada deja de estar marcada como "próximamente".» ⚠️ **Contradicción abierta con la corrección de `fecha-corte` del mismo día** (E-073), que sitúa el mapa **después** del corte del 14/12 mientras F1B-06 está **antes**. Devuelta como pregunta `mapa-antes-o-despues-del-corte`.
**Medido el 2026-09-24 sobre `3f30710`:** la entrada existe y está reservada — `apps/desk/src/components/Configuracion.tsx:118`, `{ label: 'Blueprint (estados y transiciones)', soon: true }`. Y el generador **hoy no produce SVG**: `scripts/generar-mapa-blueprint.ts` (44 líneas) no menciona `svg` ni una sola vez; escribe los cuatro `docs/artefactos/blueprint-*.md` en Mermaid. La vía que Gerencia propone —SVG en compilación, sin Mermaid en la aplicación— es **observada, no medida**: no se ha comprobado que el entorno de compilación pueda renderizar Mermaid a SVG. Comprobarlo es una tarea de minutos y hay que hacerla **antes** de dar por buena la talla XS–S.

## E-073 · 2026-09-24 · correccion · **RUTEADA**
**Qué:** Corrección de Gerencia a `decision/fecha-corte`: el corte **se hace en dos tiempos**. (1) **14/12/2026, corte operativo** — los tickets nacen en Desk 2.0 y Zoho Desk queda en solo lectura; hasta que exista el correo propio (1H), las respuestas al cliente salen del **correo corporativo** y se registran en el ticket. (2) **Independencia total en enero de 2027**, cuando 1G (repatriación del histórico) y 1H (correo propio) estén verificadas: entonces se deja de consultar Zoho y se dan de baja las licencias. Antes del 14/12, paridad operativa **más** la restricción de liberar sin factura por cargo; las otras siete correcciones 1C, F0-06 y el mapa en la aplicación van **después** del corte. **Plan A si no hay una semana de margen: corte único el lunes 01/02/2027.**
**De dónde viene:** panel, apartado 07, `correccion-fecha-corte-dos-tiempos` (y su duplicado `qm27sclpaheoq43q3k3k`, mismo texto, 8 minutos antes) · Gerencia, 24/09 · respuesta a la medición de `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md` §D
**Afecta a:** `openspec/config.yaml` → `decision/fecha-corte` · plan §4.5, fila `decision/fecha-corte` · épicas **1G** y **1H** (R01.3 §A) · `decision/anexo-33-checkbox` · `decision/mapa-en-la-app` · `docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md` (M1, M2, M3) · F1F-01
**Estado:** ruteada
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` → `decision/fecha-corte` → **`corregida_por`**, escrito **sin borrar** la decisión original de esa mañana, que es lo que citan el plan y el expediente · `docs/sdd/R08.3_Expediente_de_cambios.md` §11.4 · plan §4.5, fila `decision/fecha-corte`. **No abre fila nueva:** reordena las que ya existen.
**Por qué llega, medido:** la R01.3 midió el 24/09 un **déficit de 3,6 a 5,6 semanas** para el 14/12 con 1G y 1H dentro (10,9 semanas disponibles frente a 13,5–15,5 necesarias), y el propio documento dijo «no recorto más: la alternativa la decide Gerencia». Esta corrección **es** esa alternativa.
**Lo que la corrección deja abierto, y se devuelve como pregunta:**
· **`corte-licencias-plan-a`** — el plan A del 01/02/2027 supera el tope del 21/12 que fijaba la renovación de licencias de Zoho. Si las licencias vencen antes del 01/02/2027, el plan A cuesta una renovación. **No está medido** y nadie ha mirado el contrato.
· **`mapa-antes-o-despues-del-corte`** — esta corrección sitúa el mapa en la aplicación **después** del corte; `decision/mapa-en-la-app`, del mismo día, lo sitúa **antes de F1B-06**, que está antes del corte. Las dos no pueden ser ciertas a la vez.

## E-074 · 2026-09-24 · correccion · **RUTEADA**
**Qué:** Aclaración de Gerencia a la corrección de `decision/fecha-corte` (E-073). Del examen del 9/12 salen **dos** condiciones, no una: la respuesta al cliente por correo sin Zoho **y** el histórico completo verificado. Las dos pasan a la independencia total de enero, junto con 1G y 1H. El examen del 9/12 queda con dos condiciones: crear y mover tickets en Desk 2.0, y pruebas con servicios reales superadas. Y `mapa-antes-o-despues-del-corte` queda decidido: **después del corte**; el «va antes de F1B-06» de `mapa-en-la-app` queda sin efecto.
**De dónde viene:** Gerencia, 24/09, posterior al tercer corte del día; la trae el usuario a la sesión de análisis.
**Afecta a:** `openspec/config.yaml` → `decision/fecha-corte` y `decision/mapa-en-la-app` · plan §4.5, filas `decision/fecha-corte` y `decision/mapa-en-la-app` · R01.3 §C y §D · épicas 1G y 1H
**Estado:** ruteada
**Destino:** `openspec/config.yaml` → `decision/fecha-corte` → **`aclarada_por`** y `decision/mapa-en-la-app` → **`aclarada_por`**, escritos **sin borrar** ni la decisión ni la corrección · plan §4.5, las dos filas precisadas · R01.3 cerrada con el margen.
**Por qué importa, medido:** la corrección decía «la **tercera** condición deja de ser bloqueante» y describía el correo, que en la enumeración original (`decision/fecha-corte`, consecuencia (3)) es la **segunda**; la tercera es el histórico. Al pie de la letra, 1G seguía dentro del examen, y con 1G dentro el margen era negativo. Con la aclaración, la R01.3 §D da **+1,9 a +2,2 semanas** contra el umbral de una: el plan A no se activa.
**Cierra:** la pregunta `mapa-antes-o-despues-del-corte` (E-073).
**Lo que deja abierto, y se devuelve como pregunta:**
· **`corte-licencias-plan-a`** — sigue como la dejó E-073.
· **`encuesta-entre-corte-e-independencia`** — la encuesta de satisfacción va dentro de F1F-05 y depende de la salida de correo de 1H-01 (R01.3 §B). Con 1H en enero y Zoho en solo lectura desde el 14/12, nada dice cómo sale la encuesta entre el corte y la independencia.

**Adenda del 28/09 (corte de los desvíos) — la pregunta `mapa-antes-o-despues-del-corte` queda CERRADA con respuesta textual de Gerencia (24/09), recogida del panel:** «Después del corte (opción 2), como ya quedó registrado en la aclaración de Gerencia del 24/09 a la enmienda de fecha-corte. La frase «va antes de F1B-06» de mapa-en-la-app queda sin efecto. Antes del corte solo entra lo necesario para no perder nada de lo que Zoho ya daba.» Registrada con clave propia en `openspec/config.yaml` → `decisiones_de_gerencia` → `decision/mapa-antes-o-despues-del-corte`, que es lo que faltaba: la aclaración ya estaba escrita en `aclarada_por` de dos decisiones, pero sin clave `decision/*` que una sesión de construcción pudiera cargar. Clave Engram: `decision/mapa-antes-o-despues-del-corte`. **Coste ya pagado y medible:** `blueprint-equipo-nuevo` (F1B-06, `cierra: no`) se archivó el 25/09 en `a2cbeb2` sin mapa en la aplicación — `git show --stat a2cbeb2` — así que las ramas de equipo nuevo ya nacieron sin recorrido dibujado, que es exactamente el coste que la consecuencia (3) de `decision/mapa-en-la-app` anunciaba.
**La otra pregunta que E-074 dejaba abierta, `corte-licencias-plan-a`, queda cerrada en E-084; la que abría, `encuesta-entre-corte-e-independencia`, en E-085.**

## E-075 · 2026-09-25 · correccion · **NUEVA**
**Qué:** Errata en el registro de `decision/edicion-datos-comerciales-equipo`: su `maestro_pasaje` dice «M3.2 (registro de equipos)» (`openspec/config.yaml:2808`), y la fila del expediente repite «M3.2» (`docs/sdd/R08.3_Expediente_de_cambios.md:611`). En la R08.2, M3.2 es «Taxonomía jerárquica ISO 14224» (`Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:2054`); los seis campos del equipo están en M3.1 «Estructura de datos» (`:2021-2053`). Hipótesis: el pasaje que corresponde es M3.1 (ni M3.1 ni M3.3 hablan literalmente de editar ni de registrar cambios; M3.1 define los campos y quién los da de alta, `:2053`).
**De dónde viene:** propuesta de `edicion-comercial-equipo` (F1B-14), supuesto (c6), 2026-09-25.
**Afecta a:** fila `decision/edicion-datos-comerciales-equipo` de `docs/sdd/R08.3_Expediente_de_cambios.md` (§11.4) · campo `maestro_pasaje` de esa decisión en `openspec/config.yaml`.
**Estado:** nueva
**Destino propuesto:** pasaje del expediente R08.3, como corrección pendiente. **Dueño propuesto:** Gerencia. `openspec/config.yaml` NO se toca desde una tanda: es un campo de una decisión de Gerencia.
**Y una segunda, en la misma decisión:** su consecuencia (3) afirma que `apps/desk/server/routes/equipos.ts:73` «deja hoy editar los seis campos a cualquier usuario con sesión». Era cierto en `0807a77`; desde `edicion-comercial-equipo` ya no (tres de los seis exigen Comercial o administrador). Es un caso B de la regla de mutación 4 —hay que nombrar la revisión en la cita—, y por la misma razón tampoco se corrige desde la tanda: queda para quien mantenga el registro de la decisión.

## E-076 · 2026-09-25 · hallazgo · **NUEVA**
**Qué:** El comentario de `apps/desk/server/services/equipoNuevo.ts:63` llama «Validación C» al bloque que reutiliza `camposHojaDeVida`, pero la parte del mantenedor («Mantenedor no encontrado») es una comprobación de existencia de un identificador aportado tal cual, que la tabla canónica clasifica como escalón **A** (`openspec/specs/transitions-st/spec.md:1106-1111` en `011f6ea`). El `PATCH` de equipos, desde `edicion-comercial-equipo`, ya la trata como A. La misma guarda queda con dos etiquetas según la puerta.
**De dónde viene:** validación de diseño de `edicion-comercial-equipo` (F1B-14), 2026-09-25. Es preexistente: no lo introduce ese cambio, y no lo corrige.
**Afecta a:** `apps/desk/server/services/equipoNuevo.ts` (comentario y, si se reordena algo, el orden de guardas de la vía del ticket, `tickets-core` RQ-TC-05/RQ-TC-15).
**Estado:** nueva
**Destino propuesto:** la próxima tanda que toque la rama «Equipo nuevo» del alta de ticket (propuesta: F1B-06). **Dueño propuesto:** quien decida el alcance de F1B-06. Antes de cambiarlo hay que comprobar si es sólo el comentario o también el orden observable.

## E-077 · 2026-09-25 · hallazgo · **NUEVA**
**Qué:** Dependencia invertida: `camposHojaDeVida` vive en la capa de rutas (`apps/desk/server/routes/equipos.ts:144`) y la importa un servicio (`apps/desk/server/services/equipoNuevo.ts:6`). No hay ciclo de imports, pero un servicio depende de una ruta.
**De dónde viene:** deuda que dejó `alta-equipo-nuevo-en-ticket` (F1B-14, primer cambio); `edicion-comercial-equipo` decidió en su diseño NO moverla (moverla desplaza citas muy usadas y cuesta presupuesto de revisión sin cambiar comportamiento).
**Afecta a:** `apps/desk/server/routes/equipos.ts`, `apps/desk/server/services/equipoNuevo.ts` y las citas a `routes/equipos.ts:144-189` (barrido de la regla de mutación 4 al moverla).
**Estado:** nueva
**Destino propuesto:** tanda de refactor propia o la siguiente que ya toque ambos ficheros. **Dueño propuesto:** quien decida el alcance; no se asigna épica de memoria.

## E-078 · 2026-09-25 · propuesta · **CERRADA 28/09 — respuesta textual en la adenda del 01/10, al final**
**Qué:** Propuesta de regla para el ledger de `gentle-ai sdd-attempt`: **antes de cada `settle` de un apply, `git add -N` (intent-to-add) de todos los ficheros nuevos del intento**, para que el techo de líneas los cuente. Hoy el ledger mide el árbol trackeado y deja fuera lo nuevo sin trackear, así que el techo de 800 no protege esa parte: dos applies lo pasaron en real sin que el ledger lo viera —`alta-equipo-nuevo-en-ticket`, 1.110 reales con 555 en el ledger; `edicion-comercial-equipo` lote 1, 926 reales con 453—.
**Medición (2026-09-25, gentle-ai 2.4.0):** en un clon local desechable de `ac13405` —no en un worktree: el ledger vive en `.git/gentle-ai/sdd-runtime`, que un worktree comparte con el repositorio real—, dos intentos idénticos: un fichero nuevo de 100 líneas y 10 líneas añadidas a un fichero trackeado. **Control, sin `add -N`: el ledger registró 10.** **Con `git add -N` del fichero nuevo antes del `settle`: registró 110**, lo mismo que `git diff --shortstat --no-renames HEAD`. El clon se borró después; el ledger real no tiene rastro de los dos intentos (0 coincidencias en `.git/gentle-ai/sdd-runtime`).
**Límites de lo medido:** sólo se probó el `add -N` hecho antes del `settle`, con un fichero de texto; no se probó un fichero binario. `add -N` no mete el contenido en el índice (el commit posterior sigue necesitando `git add`), así que no cambia qué se commitea.
**De dónde viene:** encargo de la sesión de supervisión, 2026-09-25, tras cerrar F1B-14.
**Afecta a:** `CLAUDE.md`, regla del ciclo 2 (el desvío (1), «lo nuevo sin trackear no cuenta», pasaría a tener remedio) · procedimiento de apply de toda tanda SDD.
**Estado:** nueva
**Destino propuesto:** regla del ciclo 2 de `CLAUDE.md`, como remedio del desvío (1). **Dueño propuesto:** Gerencia. Mientras no se decida, el orquestador lo aplica en sus applies como medida propia y lo declara en el parte.

## E-079 · 2026-09-25 · pregunta · **CERRADA 28/09 — respuesta textual en la adenda del 01/10, al final**
**Qué:** F1B-04 incluye «rotulación y almacenamiento» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159`), pero no hay nada que decir qué se registra en la aplicación. El acta lo describe como pasos físicos de la recepción unificada (`docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md:324`) y el maestro igual, sin campo asociado (`Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:3893`); el código no tiene rastro (`grep -rni "rotulaci\|almacenami" apps/desk` sin aciertos del concepto). **Pregunta:** ¿la aplicación tiene que registrar algo de la rotulación y el almacenamiento (una confirmación, una ubicación de un catálogo, una etiqueta) o basta con el paso físico? Sin respuesta, no construir nada deja fuera un elemento de la fila, y construir cualquier cosa es inventar el dato.
**De dónde viene:** exploración de F1B-04, 2026-09-25 (Engram `sdd/recepcion-unificada/explore`). El usuario eligió construir ahora sólo «foto sólo con novedad» y llevar esto a Gerencia.
**Afecta a:** fila F1B-04 (no se puede cerrar sin esto) · capacidad `remisiones`.
**Estado:** nueva
**Destino propuesto:** fila F1B-04 del §5 del plan. **Dueño propuesto:** Gerencia.

## E-080 · 2026-09-25 · pregunta · **CERRADA 28/09 — respuesta textual en la adenda del 01/10, al final**
**Qué:** F1B-04 pide «sustitución del texto libre por desplegables en las etapas críticas» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159`), y ningún documento dice cuáles son esas etapas ni qué lista de valores sustituiría al texto. En la recepción, el único texto libre es la observación de la remisión (`apps/desk/src/components/CrearRemision.tsx:273`, reapuntada por `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935` como `:264`); no existe una lista cerrada de tipos de novedad (golpe, rayón, falta de accesorio…) en el maestro, en el acta ni en `openspec/config.yaml`. La procedencia del plan son los ítems 4 y 10 de la tabla §3.2 del maestro, que está `[EN REVISIÓN — R08]` y vale como procedencia, no como alcance. **Pregunta:** ¿qué etapas son las críticas y, para cada una, qué lista de valores sustituye al texto libre? Sin respuesta, reducirlo a la observación de la recepción recorta la fila.
**De dónde viene:** exploración de F1B-04, 2026-09-25 (Engram `sdd/recepcion-unificada/explore`).
**Afecta a:** fila F1B-04 (no se puede cerrar sin esto) · capacidades `remisiones` y `tickets-core`.
**Estado:** nueva
**Destino propuesto:** fila F1B-04 del §5 del plan. **Dueño propuesto:** Gerencia.

## E-081 · 2026-09-25 · hallazgo · **NUEVA**
**Qué:** El servidor no obliga a contestar «¿El equipo llega con novedad?». `POST /api/remisiones` guarda `hayNovedad` como `null` cuando el cuerpo no trae un booleano (`apps/desk/server/routes/remision.ts:246` en `17ddfec`: `typeof b.hayNovedad === 'boolean' ? b.hayNovedad : null`), y con `null` el envío no exige foto (`packages/shared/src/remision.ts:110-111`: sólo `hayNovedad === true` la exige). La obligación de contestar vive sólo en el formulario (`apps/desk/src/components/CrearRemision.tsx`), declarada así en RQ-RE-19 como regla invariable 13, punto 2: una petición que no pase por el formulario crea una remisión que se envía sin foto aunque el equipo llegue con novedad.
**Por qué no se arregló:** exigir la respuesta en el servidor al CREAR no afecta a las remisiones antiguas (se quedan en `null` y siguen sin exigir foto), pero añade una guarda al alta de remisión, cuyo orden de guardas está pendiente de decisión (IV-12, `openspec/config.yaml` → `incumplimientos_vivos`). Se decidió en `foto-solo-con-novedad` (F1B-04) no tocar el alta.
**De dónde viene:** encargo de la sesión de supervisión, 2026-09-25, tras archivar `foto-solo-con-novedad`.
**Afecta a:** `apps/desk/server/routes/remision.ts` (alta) · RQ-RE-19 de `openspec/specs/remisiones/spec.md` · IV-12.
**Estado:** nueva
**Destino propuesto:** la tanda que decida y reordene el alta de remisión (IV-12). **Dueño propuesto:** quien decida IV-12. No se arregla en esta tanda.

## E-082 · 2026-09-27 · pregunta · **CERRADA 28/09 — respuesta textual en la adenda del 01/10, al final**
**Qué:** La guarda «no se libera un analizador de gases ni un convertidor sin pasar por Verificación, si hay gas patrón de lo que mide» está decidida (`openspec/config.yaml:1972-1973`, consecuencia 4 en `:1980`) y no se puede construir sin dos datos que no existen. (1) **Cómo sabe la aplicación la familia y el compuesto de un equipo concreto.** El mismo modelo AP-370 se verifica o no según el gas que mide (H2S, TRS y NH3 quedan exentos, `openspec/config.yaml:1973`). `equipos.tipo` es texto libre (`packages/zoho-sync/src/db/schema.sql:194`), `public.catalogo_tipos` no tiene marca de familia (`:323-328`) y ningún campo registra el compuesto. (2) **Dónde vive la lista de gases patrón disponibles y quién la mantiene.** Es «dato que se puede cambiar» (`openspec/config.yaml:1973`), y no existe: `grep -rniE "gas.?patron|gas patrón" packages/ apps/ --include=*.ts` = 0 (`openspec/config.yaml:1980`). Además, sembrar qué tipos o equipos la exigen toca datos de producción.
**De dónde viene:** propuesta de `salidas-verificacion` (F1A-03), 2026-09-27. Esa tanda construye las dos salidas de `Verificación` y deja fuera la guarda, por eso lleva `cierra: no`.
**Afecta a:** fila F1A-03 (no se cierra sin esto) · F1C-07, que hereda la misma regla para `Control de calidad` (`decision/c6-qa-liberacion`, `openspec/config.yaml:1890`, consecuencia 4 en `:1898`) y reutilizará el mismo dato · capacidades `transitions-equipo-nuevo` y `hojas-vida` (hipótesis: si el compuesto se guarda en el equipo).
**Estado:** nueva
**Destino propuesto:** fila F1A-03 del §5 del plan, segunda parte. **Dueño propuesto:** Gerencia, con validación de Calidad, igual que `decision/p38-verificacion-calidad`. Hay que decidir: de dónde sale la familia y el compuesto de cada equipo (catálogo de modelos, campo del equipo u otra fuente) y dónde se guarda la lista de gases patrón y quién la actualiza.

## E-083 · 2026-09-27 · pregunta · **CERRADA 28/09 — respuesta textual en la adenda del 01/10, al final**
**Qué:** El maestro pone entre lo pendiente del nº 38 «la guarda de certificado en Liberación desde Verificación» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1520`). La respuesta que cierra el nº 38 no la menciona (`openspec/config.yaml:1971-1975`). Tampoco la recogen el Anexo D (`R08.2.md:4139`) ni la fila del expediente (`docs/sdd/R08.3_Expediente_de_cambios.md:552`). **Pregunta:** ¿`Liberación` desde `Verificación` tiene que exigir un certificado (adjunto, número o casilla), o la mención de `R08.2.md:1520` se retira? Sin respuesta, construirla es inventar el dato, y no construirla deja la mención del maestro sin destino.
**De dónde viene:** propuesta de `salidas-verificacion` (F1A-03), 2026-09-27, que construye `Liberación` desde `Verificación` sin esa guarda.
**Afecta a:** transición `liberacion` del catálogo de equipo nuevo (`packages/shared/src/transitions.ts:359`) · capacidad `transitions-equipo-nuevo` · pasaje M1.4 del maestro.
**Estado:** nueva
**Destino propuesto:** si se exige, fila F1A-03 del §5 del plan; si no, pasaje del expediente R08.3 que retire la mención de `:1520`. **Dueño propuesto:** Gerencia (Calidad).
## E-084 · 2026-09-28 · decision · **CERRADA**
**Qué:** Cierre de la pregunta `corte-licencias-plan-a`, que E-073 dejó abierta y E-074 mantuvo: el plan A del 01/02/2027 superaba el tope del 21/12 que fijaba la renovación de las licencias de Zoho, y nadie había mirado el contrato.
**De dónde viene:** panel, apartado 06, `respuestas/corte-licencias-plan-a` · Gerencia, 24/09
**Afecta a:** `openspec/config.yaml` → `decision/fecha-corte` → `precisada_por` · plan §4.5, fila `decision/fecha-corte` · F1F-01 · épicas 1G y 1H
**Estado:** cerrada
**Respuesta textual (Gerencia, 24/09):** «Antes del 21/12 se revisa la suscripción de Zoho Desk y se renueva solo lo mínimo: 2 licencias de agente, en facturación mensual, suficientes para consultar el histórico en solo lectura. Se dan de baja en cuanto 1G y 1H estén verificadas. No se renueva en anual.»
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` → `decision/corte-licencias-plan-a`, y `decision/fecha-corte` → `precisada_por` · plan §4.5, fila `decision/fecha-corte`, precisada · `docs/sdd/R08.3_Expediente_de_cambios.md` §11.5. **No abre fila:** es tarea de persona con fecha límite **21/12/2026** (Gerencia). Clave Engram: `decision/corte-licencias-plan-a`.
**Lo que deja anotado, y no está medido:** con 2 licencias de solo lectura, entre el 14/12 y enero el histórico de Zoho se consulta con **dos asientos**, no con los de todo el equipo. Nadie ha medido cuántas personas lo consultan hoy a la vez. Si fueran más de dos, harían falta más licencias o que 1G llegue antes.

## E-085 · 2026-09-28 · decision · **CERRADA (con un fleco SIN DESTINO)**
**Qué:** Cierre de la pregunta `encuesta-entre-corte-e-independencia`, que abrió E-074: con 1H (correo propio) en enero y Zoho en solo lectura desde el 14/12, nada decía cómo sale la encuesta de satisfacción en esas semanas.
**De dónde viene:** panel, apartado 06, `respuestas/encuesta-entre-corte-e-independencia` · Gerencia, 24/09
**Afecta a:** `openspec/config.yaml` → `decision/e009-kpis` → `precisada_por` · `decision/e009b-lista-indicadores` (indicador nº 55 del Anexo G) · F1F-05 · 1H-01
**Estado:** cerrada
**Respuesta textual (Gerencia, 24/09):** «Entre el 14/12 y la independencia total, la encuesta se envía a mano: al finalizar cada servicio, Comercial manda desde el correo corporativo un enlace a un formulario de Google con las mismas preguntas. En enero, las respuestas se cargan en Desk 2.0 asociadas a su ticket, para que el reporte trimestral no tenga hueco. La encuesta automática desde Desk 2.0 entra con el correo propio (1H) y sale de la cuenta de antes del corte.»
**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` → `decision/encuesta-entre-corte-e-independencia`, y `decision/e009-kpis` → `precisada_por` · `docs/sdd/R08.3_Expediente_de_cambios.md` §11.5 (Anexo G, indicador 55). Clave Engram: `decision/encuesta-entre-corte-e-independencia`.
**Qué desbloquea, medido contra el registro:** `decision/e009b-lista-indicadores` declaraba como dependencia «la satisfacción necesita que la aplicación envíe la encuesta por la salida de correo propia antes del 14/12». Con el envío manual, esa dependencia queda sustituida y el indicador **nº 55** deja de bloquear el corte del 14/12.
**FLECO SIN DESTINO, y se dice por qué:** «en enero las respuestas se cargan en Desk 2.0 asociadas a su ticket» es una **importación pequeña con fecha** (enero de 2027) que **ninguna fila del §5 reclama** hoy. No se le asigna destino porque asignarlo sería decidir alcance, y eso no lo hace esta supervisión. Dueño propuesto: Gerencia.

## E-086 · 2026-09-28 · pregunta · **NUEVA**
**Qué:** En «ampliación dentro del mismo año» (`decision/vigencia-contrato`, `openspec/config.yaml:1605-1623`), ¿qué año cuenta —el natural, el de la fecha de inicio del contrato o el de su fecha de fin— y cuál es el tope de la nueva fecha de fin? Hoy la lectura «año natural» es una **interpretación** declarada en la consecuencia (1) de esa decisión (`openspec/config.yaml:1615-1616`), no algo dicho; y la respuesta textual no fija el tope.
**Qué decide:** hasta qué fecha puede ampliarse un contrato para consumir sus subOV libres, y por tanto cuándo una subOV de un contrato vencido deja de poder consumirse del todo. Con contratos que empiezan a mitad de año, las tres lecturas dan topes distintos.
**De dónde viene:** planificación del cambio 3 de F1B-11 (registro de contrato), 2026-09-28. `decision/anexo-53-contratos` (`openspec/config.yaml:2448`) hace el registro «ampliable dentro del mismo año según lo decidido sobre vigencia».
**Afecta a:** fila F1B-11 del §5 del plan · el cambio 3 construye el registro, la vigencia y la guarda de contrato vencido, y deja la ampliación FUERA hasta esta respuesta.
**Estado:** nueva
**Destino propuesto:** `openspec/config.yaml` → `decisiones_de_gerencia`, como precisión de `decision/vigencia-contrato`. **Dueño propuesto:** Gerencia. **Qué desbloquea:** la ampliación del contrato y, con ella, el cierre de la fila F1B-11 (el cambio 3 lleva `cierra: no` por esto).

## E-087 · 2026-09-28 · hallazgo · **NUEVA**
**Qué:** El aviso de ritmo del contrato (cambio 3 de F1B-11, `registro-contrato`, lote 5) se evalúa **dentro de la pasada periódica de la sincronización con Zoho** (`apps/desk/server/index.ts:85-93`), que es el único `setInterval` del proceso. Hoy esa pasada corre siempre, así que el aviso funciona. **Con la independencia de Zoho (enero de 2027) la pasada desaparece, y el aviso moriría en silencio**: nada falla, nada se pone rojo, simplemente deja de evaluarse.
**Nota para quien retire la sincronización:** el aviso de ritmo necesita **otra pasada periódica** propia antes de quitar la de Zoho. Declarado como dependencia en `openspec/changes/archive/2026-09-29-registro-contrato/design.md` §7.
**De dónde viene:** revisión de la planificación de `registro-contrato`, 2026-09-28, al abrir su lote 1.
**Afecta a:** `apps/desk/server/index.ts` (pasada periódica) · aviso de ritmo del contrato (`derivacion-avisos`) · la tanda que retire la sincronización con Zoho.
**Estado:** nueva
**Destino:** **SIN DESTINO ASIGNADO**, a propósito: ninguna fila del §5 reclama hoy la retirada de la sincronización, y asignarle una sería decidir alcance. **Dueño propuesto:** Gerencia.

## E-088 · 2026-09-29 · hallazgo · **NUEVA**
**Qué:** No existe forma de corregir un contrato mal dado de alta —lote o cliente equivocados— salvo en la base de datos. Las rutas de contratos son cuatro lecturas y un alta (`apps/desk/server/routes/contratos.ts:24`, `:28`, `:36`, `:40`, `:65`); no hay edición ni borrado, y la única escritura posterior sobre la tabla es la marca del aviso de ritmo (`apps/desk/server/services/avisoRitmoContrato.ts:28`). Y el error no se queda en el dato: el índice único por lote (`packages/zoho-sync/src/db/schema.sql:572`) deja **ocupado** el lote equivocado, de modo que su contrato verdadero ya no se puede registrar. La fecha de fin es otra cosa y es E-086; esto no.
**De dónde viene:** preparación del paquete de despliegue del 2026-09-29 (`docs/sdd/Paquete_de_Despliegue_2026-09-29.md`, riesgos de §5.3).
**Por qué es probable y no teórico:** la tarea de persona P.7 de `registro-contrato` da de alta **todos los contratos vigentes el mismo día del despliegue**, a mano y sin relleno automático. Es el momento de más altas en menos tiempo, y un lote mal tecleado entonces sólo se arregla en la base.
**Afecta a:** capacidad `tickets-core` (RQ-TC-21, registro de contrato) · `apps/desk/server/routes/contratos.ts` · tarea P.7 de `registro-contrato`.
**Estado:** nueva
**Destino:** **SIN DESTINO ASIGNADO**, a propósito: ninguna fila del §5 reclama hoy la edición del contrato, y asignársela a una sería decidir alcance. **Dueño propuesto:** Gerencia.

## E-089 · 2026-09-29 · pregunta · **NUEVA**
**Qué:** Qué estados ve cada área. El maestro lo da por decidido («Cada usuario ve solo los estados y transiciones de su rol», M1.9.1, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1693`) y el código decidió lo contrario, por escrito y a propósito: todo el personal con sesión ve todos los tickets (`docs/modelo-autorizacion.md:14`); sólo las transiciones se filtran por área.
**De dónde viene:** hasta hoy la pregunta sólo estaba escrita en una spec (`openspec/specs/permissions/spec.md:463-475` en `011f6ea`), que ninguna sesión carga al arrancar. Se reunió con las demás en `docs/sdd/Preguntas_Gerencia_2026-09-29.md`, pregunta 2, con sus tres opciones y su consecuencia.
**Afecta a:** fila F1B-05 del §5 del plan (mitad de visibilidad) · capacidad `permissions`.
**Estado:** nueva
**Destino propuesto:** `openspec/config.yaml` → `decisiones_de_gerencia`; si la respuesta es segmentar, contenido de F1B-05. **Dueño propuesto:** Gerencia. **Qué desbloquea:** el cierre de F1B-05, que sin esta respuesta puede construir el resto de su contenido pero no cerrarse.

## E-090 · 2026-09-29 · pregunta · **NUEVA**
**Qué:** ¿De qué área son las cuatro transiciones del flujo de soporte remoto —«Asignación», «Ejecutar», «Soporte pendiente» y «Continuación soporte»—? Hoy las cuatro son de **Servicio Técnico** por supuesto (S-1 de `blueprint-soporte-remoto`), no por decisión: la hoja `docs/analisis-tickets/DF-soporte-remoto-030226.xlsx` trae el área responsable vacía y M1.5 no la dice (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1551-1568`). La duda concreta es «Asignación», que podría ser de Comercial, el área que recibe la solicitud.
**Qué decide:** quién puede ejecutar cada una de las cuatro. Hoy un usuario sólo de Comercial recibe `403` en las cuatro (`apps/desk/server/permisos.test.ts:306`); el dato vive en el catálogo (`packages/shared/src/transitions.ts:389`, una propiedad `area` por transición).
**De dónde viene:** tarea de persona P.3 de `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md` (F1B-06, cambio 2 de 2), y aviso W2 de su `verify-report.md`.
**Afecta a:** fila F1B-06 del §5 del plan · capacidad `transitions-soporte-remoto` (RQ-SR-02).
**Estado:** nueva
**Destino propuesto:** `openspec/config.yaml` → `decisiones_de_gerencia`. **Dueño propuesto:** Gerencia / Servicio Técnico. **Qué desbloquea:** cerrar S-1 como decisión y no como supuesto; si la respuesta es Comercial para alguna, se cambia UN dato por transición y la matriz de `permisos.test.ts`, sin tocar el flujo. No bloquea el archive ni el despliegue: con la respuesta pendiente, el sistema funciona con Servicio Técnico.

## E-091 · 2026-09-29 · hallazgo · **NUEVA**
**Qué:** En una pasada completa de `npm test` (archive de `blueprint-soporte-remoto`, 2026-09-29) la prueba `apps/desk/server/auth/routes.test.ts:116` («el PATCH cambia el correo…») dio *timeout*: **5411 ms contra 5000** (el valor por defecto de vitest; `vitest.config.ts` no fija `testTimeout`). Aislada pasó 14/14 y la pasada completa siguiente salió verde.
**Medido (5 pasadas completas seguidas, reporter JSON, 2026-09-29):** esa prueba tardó 657, 373, 430, 1013 y 796 ms (mediana 657); la más lenta del fichero, 578-1574 ms; el fichero entero, 5,5-9,9 s; la suite, 144-174 s; **0 rojos** en las cinco. Los 5411 ms fueron un pico de 5 a 14 veces lo habitual, no una prueba lenta.
**Qué arriesga:** un CI rojo intermitente sin causa de código, que se lee como regresión o se «arregla» a ciegas. No hay rojo de CI registrado por esto a hoy.
**Lo que NO se hace:** subir el *timeout*. Con la medida no hay base: la prueba va a un 20 % del límite en el peor caso medido, y subirlo ocultaría el pico en vez de explicarlo. Si vuelve a pasar, anotar aquí la fecha y la carga de la máquina antes de tocar nada.
**Estado:** nueva
**Destino:** **SIN DESTINO ASIGNADO**, a propósito: no hay fila del §5 de fiabilidad de la suite. **Dueño propuesto:** quien mantenga el CI.

## Adenda a E-087 · 2026-09-29 · segundo dependiente de la pasada de Zoho
**Qué:** Las alarmas de SLA en horas hábiles (`alarmas-horas-habiles`, F1B-08, lote 3) se evalúan en la MISMA pasada periódica de la sincronización con Zoho que el aviso de ritmo: `apps/desk/server/index.ts:88` encadena `pasadaAlarmas` → `pasadaRitmoContratos` → `sync.syncRecent()` dentro del único `setInterval` del proceso. Si esa pasada se retira con la independencia de Zoho, las alarmas dejan de evaluarse **sin que nada falle**: `pasadaAlarmas` nunca lanza (`apps/desk/server/services/alarmasSla.ts:141-145`).
**Nota para quien retire la sincronización:** hay que trasladar las DOS llamadas a otra pasada periódica propia. Los guardianes que leen `index.ts` (`apps/desk/server/services/alarmasSla.test.ts:246` y `apps/desk/server/services/avisoRitmoContrato.test.ts:185`) se pondrán rojos si se quitan sin moverlas: esa es la alarma, no un obstáculo que sortear.
**Estado y destino:** los de E-087 — sin destino asignado, a propósito; dueño propuesto: Gerencia.

## E-092 · 2026-09-30 · hallazgo · **NUEVA**
**Qué:** Conviven dos «cargo» en `public.users` y ninguna regla dice cuál manda para qué. `users.cargo` es texto libre, es el que firma la remisión y el que leen las alarmas (`apps/desk/server/db/avisos.ts:106-111`, que lo compara recortado y en minúsculas) y la derivación de personas (`apps/desk/src/lib/personas.ts:74-78`). `users.cargo_permiso` es una lista cerrada de siete y es el que restringe acciones (`packages/shared/src/cargos.ts`, `apps/desk/server/auth/users.ts:30`). Una persona puede ser «Coordinador Comercial» en uno y otro cargo (o ninguno) en el otro, sin aviso.
**Qué decide:** si los dos deben unificarse (el de firma pasa a salir de la lista cerrada, o el de permiso se deriva del de firma), o si se quedan separados a propósito y basta con la ayuda escrita en la consola de usuarios.
**De dónde viene:** riesgo H5 de `openspec/changes/archive/2026-09-30-permisos-por-cargo/design.md` §11 y tarea de persona P.3 de su `tasks.md`; molde H5 (dos implementaciones de la misma noción, ninguna rota por separado), que las cuatro reglas de mutación no cazan.
**Afecta a:** fila F1C-05 del §5 del plan · capacidades `permissions` y `derivacion-avisos`.
**Estado:** nueva
**Destino:** **SIN DESTINO ASIGNADO**, a propósito: asignar una épica de memoria es lo que dejó cuatro desvíos huérfanos al cerrar F1A. **Dueño propuesto:** Gerencia. **Qué desbloquea:** que la derivación y las alarmas dejen de depender de un texto libre, y que un cambio del cargo de firma no pueda parecer un cambio de permiso.

## E-093 · 2026-10-01 · pregunta · **RESUELTA EN PARTE 01/10** (E-099 y E-095)
**Qué:** Qué es la «fecha promesa» y de dónde sale. El maestro dice que el sistema ordena «Mis Tickets» de más a menos urgente — «FIFO inteligente por fecha promesa» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1711`, M1.9.1), pero no define el término en ningún sitio.
**Medido el 2026-10-01 sobre `e27f9da`:** `git grep -n "fecha promesa\|fechaPromesa\|fecha_promesa" -- apps packages` = **0**. Lo más cercano que existe es el indicador «Cumplimiento promesa» (`apps/desk/src/components/Analisis.tsx:95`), que toma como promesa los **Días de entrega** contados desde la creación del ticket (`packages/shared/src/analisis.ts:66`). Hipótesis, sin confirmar: la fecha promesa sería la fecha de creación más los Días de entrega; pero un ticket no tiene Días de entrega hasta el escalado, así que tampoco ordenaría los tickets que aún no los tienen.
**Qué decide:** el desempate dentro de una misma prioridad en «Mis Tickets». `prioridad-top5-cliente` (F1B-07) ordena por prioridad en el servidor y, dentro de la misma prioridad, deja el orden de hoy (supuesto S-10 de su `proposal.md`).
**Apéndice de** la pregunta 3 de `docs/sdd/Preguntas_Gerencia_2026-09-29.md` (§3.b, `:69-89`), que ya nombraba el orden de «Mis tickets» como algo que la calificación desbloquea (`:81`). Ese documento es un registro fechado y no se edita: esta entrada lo completa.
**Afecta a:** fila F1B-07 del §5 del plan · capacidad `vistas-tablero`.
**Estado:** resuelta en parte el 01/10. **El desempate lo resuelve E-099** (`decision/e099-orden-cola-taller`): dentro de una misma prioridad manda la fecha y hora de «Habilitar Servicio». **El tiempo promesa lo define E-095** (diagnóstico + días de entrega, después del corte, sin destino). **Sigue abierta sólo en esto:** si la «fecha promesa» del maestro (M1.9.1) es ese tiempo promesa global de E-095 y, por tanto, qué expediente R08.x corrige la frase «FIFO inteligente por fecha promesa».
**Destino:** el desempate, F1B-07 (lote 2b); lo que sigue abierto, **SIN DESTINO ASIGNADO**, a propósito. **Dueño:** Gerencia. **Qué desbloquea:** el desempate por fecha promesa de «Mis Tickets»; sin respuesta, el orden dentro de una prioridad sigue siendo el de hoy.

---

# Adendas del corte del 2026-10-01 — las cinco respuestas del 28/09, con su texto literal

Las cinco preguntas de arriba (E-078, E-079, E-080, E-082, E-083) se marcan **CERRADA** en su propia
cabecera y su respuesta textual se escribe **aquí al final**, no dentro de la entrada, para no desplazar
las líneas que otros documentos citan (regla de mutación 4 de `CLAUDE.md`: `ENTRADA.md:1190` y `:1197`
están citadas en `docs/sdd/Paquete_de_Despliegue_2026-09-29.md:868` y `2026-09-30.md:780`).

## Adenda a E-078 · 2026-10-01 · CERRADA por Gerencia el 28/09 · `decision/ledger-ficheros-nuevos`
**Respuesta textual:** «Opción 1: se arregla la cuenta. Antes de cerrar cada intento se ejecuta la orden de git ya probada, para que el contador incluya los ficheros nuevos y registre lo mismo que mide git. Los ficheros binarios no cuentan líneas: quedan fuera del tope y se anotan aparte en el intento. El tope sigue en 800 líneas; el intento que lo supere se parte. Se aplica a partir del próximo intento, sin rehacer los ya cerrados, y el alta del equipo (1.110 líneas) y la edición comercial (926) quedan anotadas en el ledger como intentos que superaron el tope sin detectarse.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/ledger-ficheros-nuevos`) y → `presupuesto_del_ledger` → `obligacion_antes_de_cerrar` y `excedidos_sin_detectar` (claves nuevas) · `CLAUDE.md` → regla del ciclo 2, adenda de Gerencia del 28/09. **No es la propuesta que esta entrada hacía:** la medición de E-078 probó `git add -N`, y Gerencia elige ejecutar la medida ya escrita en `presupuesto_del_ledger → medida` en vez de alterar el índice. **Clave Engram:** `decision/ledger-ficheros-nuevos`.

## Adenda a E-079 · 2026-10-01 · CERRADA por Gerencia el 28/09 · `decision/f1b04-rotulacion`
**Respuesta textual:** «Opción 1. La recepción registra una confirmación «Rotulado y guardado» con persona, fecha y hora; es obligatoria para completar la recepción. La etiqueta física lleva el código del ticket, para que cualquier equipo en la estantería se pueda buscar en la aplicación. La ubicación no se registra antes del corte: una ubicación que solo se apunta al recibir queda desactualizada en cuanto el equipo se mueve. Entra después del corte junto con las ubicaciones de almacén (maestro M5.3, aplazado en la R08), con actualización en cada movimiento. Con esto, el elemento de rotulación y almacenamiento de F1B-04 queda definido y la fila se puede cerrar.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decision/f1b04-rotulacion` · plan §4.5, fila nueva · fila **F1B-04** del §5. **Clave Engram:** `decision/f1b04-rotulacion`.

## Adenda a E-080 · 2026-10-01 · CERRADA por Gerencia el 28/09 · `decision/f1b04-desplegables`
**Respuesta textual:** «Opción 1, y no es un recorte: las demás etapas críticas ya tienen lista cerrada por decisiones anteriores (comentarios del catálogo en diagnóstico, falla nueva, motivos de Anulado, motivos de liberación sin factura, motivos del informe de salida, lista de accesorios y motivos de no reclamar al fabricante). La observación de la remisión de entrada pasa a una lista de tipos de novedad, con selección múltiple: Sin novedad · Golpe o abolladura en la carcasa · Rayón o daño estético · Pantalla o display dañado · Conector o puerto dañado · Falta un accesorio · Embalaje inadecuado o dañado · Humedad, suciedad o contaminación visible · Sello o precinto roto · Otro (texto obligatorio). La foto es obligatoria cuando se marca cualquier novedad distinta de «Sin novedad», como ya estaba decidido. Servicio Técnico puede ajustar la lista antes de construirla; después, los cambios los hace el Director Técnico. Con esto el elemento de F1B-04 queda definido y la fila puede cerrarse.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decision/f1b04-desplegables` · plan §4.5, fila nueva · fila **F1B-04** del §5. **Lo que NO cierra:** E-081 sigue viva — el servidor no exige contestar «¿llega con novedad?». **Clave Engram:** `decision/f1b04-desplegables`.

## Adenda a E-082 · 2026-10-01 · CERRADA por Gerencia el 28/09 · `decision/f1a03-familia-y-gas-patron`
**Respuesta textual:** «Opción 1 con valor heredado del modelo. El compuesto medido vive en cada equipo (hoja de vida) y se hereda del modelo al darlo de alta: cada modelo del catálogo lleva su compuesto por defecto (APSA-370 SO₂, APNA-370 NOₓ, APMA-370 CO, APOA-370 O₃, y los convertidores el compuesto que convierten). Cuando un equipo mide otra cosa, como los AP-370 configurados para H₂S, TRS o NH₃, se corrige en su hoja de vida. Los equipos existentes se rellenan con el valor de su modelo, y a mano solo se corrigen las excepciones conocidas (lote de 2024, tickets #601–#622 y #653–#654). La lista de gases patrón es una tabla en la base con compuesto, disponibilidad y fecha de vencimiento del certificado del cilindro; la mantiene el Director Técnico, al principio por alta directa. La guarda: un analizador de gases o un convertidor no se libera sin Verificación si existe un patrón vigente de su compuesto; si no existe, se libera y queda registrado el motivo. Claude Code prepara el script de siembra (compuestos por modelo, excepciones y gases patrón actuales) y Alfonso lo ejecuta en producción.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decision/f1a03-familia-y-gas-patron` · plan §4.5, fila nueva · fila **F1A-03** del §5, segunda parte · `docs/sdd/R08.4_Expediente_de_cambios.md` §1. **Tarea de persona, con dueño:** la siembra en producción la ejecuta **Alfonso**. **Clave Engram:** `decision/f1a03-familia-y-gas-patron`.

## Adenda a E-083 · 2026-10-01 · CERRADA por Gerencia el 28/09 · `decision/f1a03-certificado-liberacion`
**Respuesta textual:** «Sí, con la forma más ligera. La transición «Liberación» desde Verificación exige el número del certificado de calibración de fábrica del equipo (campo de texto obligatorio), con opción de adjuntar el PDF. Se aplica tanto si el equipo pasó por Verificación como si se liberó sin ella por falta de patrón vigente. No se exige el certificado propio de Ambientalia, que llegará con el módulo de informes y sus tres firmas en 2027. No es retroactiva: los equipos liberados antes de construirla no se marcan ni se corrigen. La frase del maestro (R08.2:1520) se mantiene, precisando que se refiere al certificado de fábrica.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decision/f1a03-certificado-liberacion` · plan §4.5, fila nueva · fila **F1A-03** del §5 · `docs/sdd/R08.4_Expediente_de_cambios.md` §1 (la mención de `R08.2.md:1520` **no se retira: se precisa**). **Clave Engram:** `decision/f1a03-certificado-liberacion`.

---

# Entradas nuevas del corte del 2026-10-01 — las catorce que Gerencia anotó el 30/09

Las catorce vienen del apartado 07 del panel, escritas entre las **15:22 y las 17:21 UTC del 30/09**.
Cinco son `idea` (alcance) y nueve `correccion`. **Ninguna es `regla`**, así que este corte no añade
nada a `CLAUDE.md` por esa vía. Las nueve correcciones tocan el **maestro** o el **plan**; las que
tocan el maestro se anotan en `docs/sdd/R08.4_Expediente_de_cambios.md` y **no se escribe en el
maestro desde aquí**.

## E-094 · 2026-09-30 · correccion · **TRIADA**
**Qué (literal de Gerencia):** «Corrección al punto abierto nº 37 y a F1B-03. Se suprimen los cinco prefijos (MT, CG, HV, SR, PRO) en los tickets nuevos: el campo prefijo deja de existir en el alta y deja de ser obligatorio, y no se genera automáticamente. Sustituye a lo decidido en la R08 («el prefijo se conserva por legibilidad y se deriva de la clasificación»), que queda superado con esta fecha sin borrarse del histórico. La rama del ticket la indica solo el desplegable de clasificación. La convención de asunto normalizado se mantiene, sin prefijo. Los tickets existentes, tanto los traídos de Zoho como los ya creados en Desk 2.0, conservan su prefijo tal como están: no se reescriben. Antes de construir, comprobar si alguna automatización o nombre de carpeta en Google Drive depende del prefijo, y avisar si es así. Corrección para el expediente del maestro: M1.1 y el punto 37 del Anexo D.»
**De dónde viene:** panel, apartado 07, 30/09 15:22 UTC.
**Afecta a:** fila **F1B-03** del §5 · punto abierto **nº 37** del Anexo D · **M1.1** del maestro · capacidad `tickets-core`.
**Estado:** triada · **Destino propuesto:** `docs/sdd/R08.4_Expediente_de_cambios.md` §2 (clase B, decisión que el maestro no contiene) **y** contenido de **F1B-03**, que ya tiene fila. **Esta supervisión NO toca el maestro.** **Dueño de la comprobación previa sobre Drive:** Gerencia — es una medición fuera del repositorio y **nadie la ha hecho**; queda anotada sin fecha.

## E-095 · 2026-09-30 · correccion · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-142**
**Qué (literal de Gerencia):** «Corrección al maestro M4.1–M4.2 (compromiso de fecha y CTP) y al indicador de cumplimiento del tiempo promesa. Hoy el Tiempo promesa lo fija Servicio Técnico en «Escalado a Revisión», cuando el diagnóstico ya está hecho, y por eso no incluye el tiempo de diagnóstico. En Desk 2.0: (1) el tiempo de diagnóstico se mide siempre, desde la marca de tiempo de las transiciones (ya construido en F1A-04 e incluido en los indicadores de F1F-05); (2) al cliente se le comunica un tiempo promesa global = tiempo de diagnóstico + días de entrega que fija el técnico en «Escalado a Revisión». Antes del diagnóstico, el tramo de diagnóstico se estima con lo que tarda hoy ese modelo según el historial; al escalar a revisión se sustituye por el tiempo real. El plazo global se cuenta en días hábiles y excluye las esperas ajenas a Ambientalia definidas en c7 (aprobación del cliente, proveedor y servicio externo). Se mantienen dos indicadores: el cumplimiento del taller (el actual, columna 54) y el cumplimiento global ante el cliente. El técnico sigue fijando los días de entrega. Funcionalidad nueva: va después del corte del 14/12. El CTP sigue en su fase y partirá de este tiempo promesa global.»
**De dónde viene:** panel, apartado 07, 30/09 15:24 UTC.
**Afecta a:** **M4.1–M4.2** del maestro · indicador **54** del Anexo G (`decision/e009b-lista-indicadores`) · **F1F-05** · **F1B-12** (días hábiles) · `decision/c7-reloj-sla`.
**Estado:** triada · **Destino propuesto:** `docs/sdd/R08.4_Expediente_de_cambios.md` §2 · **segundo indicador nuevo SIN FILA**: la lista cerrada de nueve de `decision/e009b-lista-indicadores` no contiene «cumplimiento global ante el cliente», así que esto **amplía** esa lista a diez y **ninguna fila del §5 lo reclama**. Se anota **SIN DESTINO** a propósito. **Dueño propuesto:** Gerencia. **Devuelto como pregunta** al apartado 06.

## E-096 · 2026-09-30 · idea · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-142**
**Qué (literal de Gerencia):** «Encuesta de satisfacción en la entrega, como complemento de la de correo. Además del envío por correo al finalizar el servicio, cuando quien recoge el equipo es el propio cliente se le ofrece en una tableta en recepción un formulario breve y amigable para calificar el servicio. No sustituye a la encuesta por correo: la complementa. Si recoge una transportadora, no se ofrece, porque no tiene criterio para valorar el servicio. Para ello, la remisión de salida registra quién recoge: cliente o transportadora. Cada calificación guarda su canal (correo o tableta) y queda asociada al ticket; el indicador de satisfacción se muestra por canal y con el número de servicios que tienen al menos una calificación. Mientras no esté construido, se usa en la tableta el mismo formulario de Google previsto para el periodo entre el corte y la independencia total. La versión integrada en Desk 2.0 es funcionalidad nueva y va después del corte del 14/12.»
**De dónde viene:** panel, apartado 07, 30/09 16:06 UTC.
**Afecta a:** indicador **55** del Anexo G · `decision/encuesta-entre-corte-e-independencia` · capacidades `remisiones` (quién recoge) y `kpis`.
**Estado:** triada · **Destino propuesto:** las tres salidas de R-3 no la admiten sin decisión de alcance: **no hay fila** del §5 para la encuesta integrada y la fila de la encuesta que `decision/e009-kpis` abrió en la épica 1F es la del **envío por correo**. Se anota **SIN DESTINO** y se devuelve como **pregunta** al apartado 06. **Dueño propuesto:** Gerencia. **Pieza que sí cabe antes del corte y hoy no tiene nadie:** «la remisión de salida registra quién recoge» es un campo de `remisiones`, no de la encuesta.

## E-097 · 2026-09-30 · correccion · **TRIADA**
**Qué (literal de Gerencia):** «Corrección al maestro (estado «Entregado», M1.3 y guardas de M1.7). «Entregado» es un estado obsoleto del blueprint de Zoho Desk, que sigue ahí solo porque Zoho no permite eliminar estados y transiciones que alguna vez se usaron. No existe ni se crea en Desk 2.0 (comprobado en el código a 30/09). El maestro lo registra como obsoleto con esta fecha, sin borrar su descripción histórica. La guarda propuesta «No se puede pasar a Entregado sin la foto del equipo embalado…» se refiere en Desk 2.0 a la salida del equipo desde Por Entregar. Los tickets de Zoho que pasaron por «Entregado» conservan ese paso en su historial tal como está, sin reescribirlo; si en la migración de tickets abiertos (F1F-01) aparece alguno todavía en «Entregado», pasa a Finalizado.»
**De dónde viene:** panel, apartado 07, 30/09 16:08 UTC.
**Afecta a:** **M1.3** y guardas de **M1.7** del maestro · **F1F-01** (migración) · `decision/c6-qa-liberacion` (la foto del equipo embalado).
**Estado:** triada · **Destino propuesto:** `docs/sdd/R08.4_Expediente_de_cambios.md` §2, y **regla de migración** para F1F-01, que ya tiene fila. **Comprobado por esta supervisión el 01/10 sobre `1550b07`:** `Entregado` no está entre las 23 claves de `CLASIFICACION_EN_ESPERA` (`packages/shared/src/estados.ts:59`) — la afirmación de Gerencia se sostiene contra el código.

## E-098 · 2026-09-30 · correccion · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-142**
**Qué (literal de Gerencia):** «Corrección al maestro M6 (planificación, capacidad y asignación de trabajo). La asignación de trabajo depende de los usuarios y roles que existan en el sistema: se construye sobre el modelo de usuario, área y cargo (F1C-05) y sobre la derivación de M1.9.2, no como pieza independiente. En consecuencia: (1) el parámetro de carga se define por usuario (horas disponibles por técnico) y no por área; (2) el calendario de capacidad se compone del calendario laboral de la empresa, ya construido en F1B-12, más la disponibilidad de cada usuario (vacaciones y ausencias), que queda pendiente; (3) el enrutamiento automático de tickets por especialidad o carga (hoy propuesto) solo puede asignar a usuarios con el área y el cargo que permiten ejecutar la transición siguiente. Queda ligado al nivel «propietario del registro» del modelo de permisos, que se decidió dejar para después de la restricción por cargo. No cambia el calendario: M6 sigue después del corte y es condición previa del CTP.»
**De dónde viene:** panel, apartado 07, 30/09 16:13 UTC.
**Afecta a:** **M6** del maestro · **F1C-05** (archivada el 30/09, `cierra: no`) · **F1B-12** · `decision/c10-permisos-cargo` (nivel «propietario del registro», aplazado).
**Estado:** triada · **Destino propuesto:** `docs/sdd/R08.4_Expediente_de_cambios.md` §2. **Pieza nueva sin fila:** «la disponibilidad de cada usuario (vacaciones y ausencias), que queda pendiente» — Gerencia misma la declara pendiente y **ninguna fila la reclama**. Se anota **SIN DESTINO**. **Dueño propuesto:** Gerencia.

## E-099 · 2026-09-30 · idea · **CERRADA 01/10**
**Qué (literal de Gerencia):** «Orden de la cola del taller según la habilitación comercial. El equipo que llega sin orden de venta se recibe, se hace su remisión de entrada, queda físicamente en el almacén y en el sistema permanece en «Remisión creada», el estado de espera decidido el 10/09 (área Comercial, alarma a los 3 días hábiles). Mientras está ahí no puede iniciarse el servicio. Nuevo: cuando varios equipos salen de esa espera, la cola de trabajo del taller («Mis tickets» y el tablero) los ordena por la fecha y hora en que Comercial los habilitó («Habilitar Servicio»), no por la fecha de llegada. Este orden se aplica dentro de cada nivel de prioridad: primero la prioridad (contrato, Top 5, valoración del cliente) y, entre tickets de la misma prioridad, el orden de habilitación comercial. La lista de equipos en «Remisión creada» se muestra a Comercial ordenada por antigüedad, para que habilite primero los que más llevan esperando. Se confirma también que el bodegaje se mide en días naturales, no hábiles.»
**De dónde viene:** panel, apartado 07, 30/09 16:25 UTC.
**Afecta a:** fila **F1B-07** del §5 (prioridad y orden de «Mis tickets», **en curso hoy**) · capacidad `vistas-tablero` · los tres bodegajes de **F1A-04**.
**Estado:** cerrada el 01/10 · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` (`decision/e099-orden-cola-taller`), al final del fichero para no desplazar citas; construida en `prioridad-top5-cliente` (F1B-07, lote 2b). **Triaje original:** contenido de **F1B-07**, que ya tiene fila y está abierta en este mismo momento (`prioridad-top5-cliente`, `cierra: no`). **Y RESUELVE E-093 SIN HABERLA LEÍDO:** E-093 (01/10) pregunta cuál es el desempate dentro de una misma prioridad en «Mis tickets», y esta entrada lo fija — **la fecha y hora de «Habilitar Servicio»**, no la «fecha promesa» que el maestro nombra en M1.9.1 y que no existe en el código (`git grep -n "fecha promesa\|fechaPromesa\|fecha_promesa" -- apps packages` = **0**, medido el 01/10). **Esto hay que decírselo a la tanda abierta:** sin ello, F1B-07 cierra con el orden de hoy. **Dueño:** quien decida F1B-07.

## E-100 · 2026-09-30 · correccion · **TRIADA**
**Qué (literal de Gerencia):** «Corrección a la selección de accesorios en las remisiones de entrada y de salida (maestro, recepción de accesorios [R08]; F1B-04; ítem 21). El menú de accesorios no es solo visual: cada accesorio se muestra con su foto, su nombre oficial y su número de parte, que ya existen en el inventario. Los datos se toman del catálogo de artículos sincronizado desde Zoho Books (nombre y SKU, y la imagen si la sincronización la trae; si no la trae, se añade), sin mantener una lista aparte. Solo se ofrecen los accesorios asociados al modelo del equipo en el catálogo de modelos. Se aplica igual en la remisión de entrada y en la de salida, y la de salida parte de lo registrado a la entrada para que se vea qué vuelve y qué no. Antes del corte, la lista cerrada de F1B-04 muestra ya nombre y número de parte desde el inventario; la foto se incorpora con el ítem 21 cuando esté disponible en el origen. Sustituye a «menú visual con fotos, en lugar de un listado de texto», que queda superado con esta fecha.»
**De dónde viene:** panel, apartado 07, 30/09 16:30 UTC.
**Afecta a:** fila **F1B-04** del §5 (la fila que las dos respuestas del 28/09 acaban de dejar construible) · **ítem 21** · capacidades `remisiones` y `catalogo-equipos`.
**Estado:** triada · **Destino propuesto:** contenido de **F1B-04**, que ya tiene fila, **más** `docs/sdd/R08.4_Expediente_de_cambios.md` §2 por la frase del maestro que queda superada. ⚠️ **Amplía F1B-04 el mismo día en que quedó definida**: la fila es talla **L** y esto le añade el catálogo de accesorios por modelo y la remisión de salida partiendo de la de entrada. **Dueño propuesto:** Gerencia, si la talla cambia.

## E-101 · 2026-09-30 · correccion · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-141 y E-142**
**Qué (literal de Gerencia):** «Corrección a C3 y al punto abierto nº 31 (salidas de emergencia de los estados de espera). Se mantiene lo decidido el 23/09: la caducidad nunca ejecuta sola una salida. Al cumplirse el plazo, el sistema notifica y sugiere la salida que corresponde (Por Facturar cobrando el diagnóstico, o Anulado con su motivo). La transición de salida la ejecuta únicamente la persona a cargo de esa etapa, es decir, a quien está derivado el ticket en ese momento, y no cualquier usuario del área. En las dos esperas externas (En espera de repuestos y Servicio externo), donde la salida implica decidir si se cobra al cliente, la persona a cargo es de Comercial, como fijó c3. Si la persona a cargo no está disponible, puede ejecutarla el Director o el Coordinador del área, dejando registro. Esto adelanta el nivel de permisos «propietario del registro» solo para las salidas de emergencia; el resto de transiciones siguen por área y cargo.»
**De dónde viene:** panel, apartado 07, 30/09 16:37 UTC.
**Afecta a:** `decision/c3-salida-esperas` · punto abierto **nº 31** · `decision/c10-permisos-cargo` (adelanta el nivel «propietario del registro», que esa decisión aplazó) · **F1C-01** · capacidad `permissions`.
**Estado:** triada · **Destino propuesto:** `openspec/config.yaml` → `decision/c3-salida-esperas` → `precisada_por`, **que esta supervisión NO escribe porque es un campo de una decisión de Gerencia y la corrección no lo nombra**; y `docs/sdd/R08.4_Expediente_de_cambios.md` §2 por el punto 31. ⚠️ **Adelanta un nivel de permisos que `c10` dejó para después, y lo hace sólo para dos transiciones:** eso es alcance nuevo en `permissions`, capacidad cuya fila **F1C-05** se archivó el 30/09 **sin cerrar**. **Devuelto como pregunta** al apartado 06: si esto entra en F1C-05 o abre fila.

## E-102 · 2026-09-30 · correccion · **TRIADA**
**Qué (literal de Gerencia):** «Corrección al plan R01.3 sobre el punto 33 y F1C-02. La liberación sin factura se divide en dos momentos. Antes del corte del 14/12 entra lo que es paridad con Zoho: solo la ejecuta el Director Comercial, y exige motivo de la lista cerrada y fecha prevista de facturación. La alarma «si pasa la fecha prevista y el ticket sigue en Pendiente de facturar, avisar al Director Comercial» llega con F1C-02, cuando exista el estado Pendiente de facturar (c4), después del corte. Como la fecha prevista se registra desde el 14/12, al construirse F1C-02 la alarma se aplica también a los equipos liberados sin factura en ese intervalo. F1C-02 sigue después del corte, sin fecha, a la espera de la medida M3.»
**De dónde viene:** panel, apartado 07, 30/09 16:41 UTC.
**Afecta a:** **plan R01.3** §C.1 (la excepción de 1C que se queda dentro del corte) · punto abierto **nº 33** · fila **F1C-02** · `decision/anexo-33-checkbox` · `decision/c4-dos-ramas`.
**Estado:** triada · **Destino propuesto:** es la única de las nueve que corrige **el plan y no el maestro**: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md` §C.1, que hoy mete «la restricción de liberar sin factura por cargo» antes del corte sin partir la alarma. **Esta supervisión la anota aquí y no reescribe la R01.3**, porque partir una fila en dos momentos es alcance. **Dueño propuesto:** Gerencia. **Nota medida:** la restricción por cargo **ya está construida** — `permisos-por-cargo` (F1C-05, 30/09) devuelve `403` en «Liberación sin factura» sin Director Comercial (`d201fe4`); lo que falta antes del corte es el **motivo de lista cerrada y la fecha prevista**.

## E-103 · 2026-09-30 · correccion · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-140**
**Qué (literal de Gerencia):** «Corrección al blueprint de servicio técnico: estado «Pendiente» (a propuesta de GN). En la rama de servicio técnico, «Pendiente» no tiene un objetivo claro y se elimina como paso intermedio: se retira la transición «Marcar como pendiente» (En Proceso → Pendiente). La transición «Diagnóstico complementario» pasa a salir directamente de En Proceso hacia Continuación del proceso, para conservar el circuito de recotización y el indicador de precisión del diagnóstico. La transición «Servicio externo» (Pendiente → Por Facturar) se retira salvo que Servicio Técnico confirme para qué se usa; si lo confirma, se reubica con su origen correcto. En la rama de soporte remoto, «Pendiente» se mantiene con sus dos transiciones, porque ahí sí significa soporte en pausa. Los pasos por Pendiente del historial se conservan tal como están; si en la migración de tickets abiertos aparece alguno de servicio técnico en Pendiente, pasa a En Proceso. Actualizar el mapa del blueprint, M1.3 del maestro y la lista del reloj del SLA (c7), donde Pendiente de servicio técnico deja de existir.»
**De dónde viene:** panel, apartado 07, 30/09 16:43 UTC.
**Afecta a:** **M1.3** del maestro · `packages/shared/src/transitions.ts` · `decision/c7-reloj-sla` · **cifra anclada `estados`** y **cifra anclada `transiciones`** · **F1F-01** (migración) · **F1C-06**.
**Estado:** triada · **Destino propuesto:** `docs/sdd/R08.4_Expediente_de_cambios.md` §2 **y** contenido de la tanda que toque el catálogo de transiciones. ⚠️ **MUEVE DOS CIFRAS ANCLADAS Y NINGUNA FILA LO RECLAMA.** Medido el 01/10 sobre `1550b07`: `Pendiente` es una de las **23** claves de `CLASIFICACION_EN_ESPERA` y una de las **3** en `sin_clasificar`; retirarlo de la rama de servicio técnico sin retirarlo de la de soporte remoto **no baja la cuenta de estados** pero sí cambia su significado, y retirar dos transiciones baja `TRANSICIONES_BASE` de **34** (hoy cuadra con el maestro) a **32** (dejaría de cuadrar). **Devuelto como pregunta** al apartado 06, junto con E-106, que la completa. **Dueño propuesto:** Gerencia + Servicio Técnico.

## E-104 · 2026-09-30 · idea · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-142**
**Qué (literal de Gerencia):** «Remisiones independientes, sin ticket. No todo lo que se remisiona es un servicio técnico. Para equipos, insumos o elementos que entran o salen con otro fin, por trazabilidad, se crean remisiones de entrada y de salida sin ticket, con acceso directo desde el menú «Remisiones» → «Crear remisión de entrada» / «Crear remisión de salida», sin pasar por el flujo del ticket. Cada una lleva un motivo de lista cerrada (préstamo o demostración · devolución o envío a proveedor · envío al fabricante por garantía · insumo o material · consignación · otro, con texto obligatorio), el cliente o proveedor de los contactos de Zoho Books, y los elementos con nombre y número de parte del inventario. Usan la misma numeración que las demás remisiones, marcadas «sin ticket». Una remisión de salida puede enlazarse con su entrada, y existe una lista de lo que salió y no ha vuelto. No cambian el estado de ningún ticket ni sirven para habilitar un servicio; si lo recibido pasa a ser un servicio, se abre el ticket y se enlaza la remisión existente. Va antes del corte del 14/12, porque puede ser el uso que mantiene viva la hoja de Google de remisiones, que se cierra con la migración.»
**De dónde viene:** panel, apartado 07, 30/09 16:55 UTC.
**Afecta a:** capacidad `remisiones` · `decision/p14b-hoja-google` (el «antes del 31/10 se averigua quién la rellena y para qué») · **F1E-01**.
**Estado:** triada · **Destino propuesto:** **SIN DESTINO** a propósito: es una **capacidad nueva entera** —remisiones que no cuelgan de un ticket— y **ninguna fila del §5 la reclama**, con fecha «antes del 14/12». Es la pieza más grande de las catorce. **Devuelta como pregunta** al apartado 06. **Dueño propuesto:** Gerencia. **Lo que sí aporta ya, y es medible:** da una hipótesis con nombre a la pregunta abierta de `p14b-hoja-google` —qué uso mantiene viva la hoja de Google—, cuyo plazo vence **el 31/10**.

## E-105 · 2026-09-30 · idea · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-142**
**Qué (literal de Gerencia):** «Aviso visible de equipo en garantía. Cuando se crea un ticket de un equipo cuya garantía sigue vigente, debe verse. No es un estado del flujo, sino un distintivo «En garantía» calculado: el ticket está en garantía si su fecha de creación es anterior o igual al fin de garantía registrado en la hoja de vida del equipo. Se muestra como aviso al elegir el equipo al crear el ticket, en la cabecera del ticket y en la lista y el tablero. En Notificado, si el equipo está en garantía, la aplicación sugiere «Reporte por garantía» como salida, sin obligar: quien decide puede considerar que la falla no está cubierta. Si el equipo no tiene fin de garantía registrado, se muestra «Garantía sin dato» para que Comercial lo complete. Es pequeño y el dato ya existe (F1B-02): va antes del corte del 14/12.»
**De dónde viene:** panel, apartado 07, 30/09 17:08 UTC.
**Afecta a:** capacidades `tickets-core` y `vistas-tablero` · **F1B-02** (el campo `fin de garantía`, construido el 23/09) · **F1B-13** (reclamación de garantía al fabricante, fila propuesta en la R01.2 y no escrita en el §5).
**Estado:** triada · **Destino propuesto:** **SIN DESTINO** a propósito. Gerencia da talla («es pequeño») y fecha («antes del corte») pero **no fila**, y la fila más próxima —**F1B-13**— está propuesta en la R01.2 y **no existe en el §5 que el barrido lee**. **Devuelta como pregunta** al apartado 06, en la misma pregunta que E-096, E-104 y E-095. **Dueño propuesto:** Gerencia.

## E-106 · 2026-09-30 · correccion · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-140**
**Qué (literal de Gerencia):** «Corrección al blueprint de servicio técnico: transiciones «Servicio externo» hacia Por Facturar. Las transiciones de servicio externo están pensadas para servicios que se hacen con un tercero y vuelven al área de Servicio Técnico para continuar o alistar el equipo. Ese camino ya existe y se mantiene: «Calibración de sensores ext.» (desde En Proceso o Rev./Diagnóstico) → Servicio externo → «Retorno de servicios externos» → En Proceso. Se retiran las dos transiciones llamadas «Servicio externo» que llevan a Por Facturar, desde Notificado y desde Pendiente, porque no corresponden a ese concepto. Esto completa la corrección sobre «Pendiente» del mismo día, que dejaba la segunda pendiente de confirmar. Cuando un equipo enviado a un tercero no vuelve para reparación, se sale del estado Servicio externo por su salida de emergencia decidida en c3 (Por Facturar cobrando el diagnóstico, o Anulado con motivo), que ejecuta Comercial. Los pasos por estas dos transiciones en el historial se conservan tal como están. Actualizar el mapa del blueprint y M1.3 del maestro.»
**De dónde viene:** panel, apartado 07, 30/09 17:10 UTC.
**Afecta a:** **M1.3** del maestro · `packages/shared/src/transitions.ts` · **cifra anclada `transiciones`** · `decision/c3-salida-esperas`.
**Estado:** triada · **Destino propuesto:** el mismo que **E-103**, que esta entrada completa: `docs/sdd/R08.4_Expediente_de_cambios.md` §2 y la tanda que toque el catálogo. ⚠️ **Con E-103 son TRES transiciones retiradas**, y la cifra anclada `transiciones` pasaría de **34 — que hoy cuadra con el maestro** — a **31**. Es el movimiento de cifra anclada más grande que ha traído una sola jornada de correcciones. **Van juntas en la misma pregunta del apartado 06.**

## E-107 · 2026-09-30 · correccion · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-142**
**Qué (literal de Gerencia):** «Corrección al paso «En espera de SKU inventario» → «Notificación cliente (SKU)». Hoy, cuando Comercial/Compras consigue el SKU, pide a Servicio Técnico que actualice la tabla de insumos y repuestos del informe, y después cotiza. En Desk 2.0 no se vuelve al técnico: Comercial/Compras registra el SKU en la tabla de repuestos del informe, genera la cotización y ejecuta «Notificación cliente (SKU)»; al hacerlo, la aplicación avisa al técnico del ticket de que la pieza ya tiene SKU y se ha añadido al informe. Comercial/Compras solo completa el SKU (código y precio) de las piezas que el técnico ya identificó; no añade, quita ni cambia piezas o cantidades. Si hace falta cambiar una pieza, el ticket vuelve a Servicio Técnico. Antes del corte entra el registro del SKU en la transición y el aviso al técnico; la edición directa de la tabla del informe llega con el módulo de informes (F1E-01), en 2027. Actualizar M4.4 del maestro y el diseño de F1E-01.»
**De dónde viene:** panel, apartado 07, 30/09 17:21 UTC — la última de las catorce, y **el mismo minuto** en que aparece en disco `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.3.docx`.
**Afecta a:** **M4.4** del maestro · **F1E-01** (diseño) · capacidades `transitions-st` y `derivacion-avisos` · estado `En espera de SKU inventario`, una de las **6** esperas internas de `decision/c7-reloj-sla`.
**Estado:** triada · **Destino propuesto:** `docs/sdd/R08.4_Expediente_de_cambios.md` §2 **y** contenido de la tanda que construya la transición «Notificación cliente (SKU)» con su aviso. **Parte antes del corte sin fila:** «el registro del SKU en la transición y el aviso al técnico». **Dueño propuesto:** Gerencia. Va en la misma pregunta del apartado 06 que E-095, E-096, E-104 y E-105.

## E-108 · 2026-10-01 · idea · **NUEVA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-139**
**Qué (literal de Gerencia, parte de E-099):** «La lista de equipos en «Remisión creada» se muestra a Comercial ordenada por antigüedad, para que habilite primero los que más llevan esperando.»
**De dónde viene:** E-099 (panel, apartado 07, 30/09 16:25 UTC), cerrada el 01/10 en `decision/e099-orden-cola-taller` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`). La cola del taller se construyó en `prioridad-top5-cliente` (F1B-07, lote 2b, `5aab12c`); **esta frase NO**: es otra vista —la de Comercial sobre la espera «Remisión creada»—, no la cola del taller. Se separa en entrada propia para que no se pierda al archivar el cambio, que sólo la menciona en `proposal.md` («Fuera»).
**Afecta a:** capacidad `vistas-tablero` · estado «Remisión creada» (la espera de área Comercial decidida el 10/09, según la propia E-099) · hipótesis: fila F1B-07 o la de la vista comercial; ninguna fila del §5 la reclama por escrito.
**Medido el 2026-10-01 sobre `5aab12c`:** no hay vista de «Remisión creada» para Comercial: las vistas funcionales son seis y ninguna filtra por ese estado (`apps/desk/src/lib/boardView.ts:7-16`), y el orden de la lista de activos es el de la cola del taller (`apps/desk/server/routes/tickets.ts:115`), no la antigüedad en la espera.
**Estado:** nueva
**Destino:** **SIN DESTINO ASIGNADO**, a propósito (R-3: no se inventa destino). **Dueño propuesto:** Gerencia, o quien decida el cierre de F1B-07. **Qué desbloquea:** que Comercial habilite primero los equipos que más llevan esperando; qué cuenta como «antigüedad» (llegada, remisión de entrada o entrada en el estado) queda por decir.

## E-109 · 2026-10-01 · idea · **NUEVA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-139**
**Qué (hallazgo de `prioridad-top5-cliente`, S-1; no es una frase de Gerencia):** cuando un cliente se marca Top 5, **los tickets abiertos que ya existen NO heredan** su prioridad: sólo la heredan los que nazcan después. Para los abiertos queda el ajuste por ticket, con motivo, que hace el Director Comercial. Propagarla a los abiertos al marcar el cliente es una decisión que nadie ha tomado.
**De dónde viene:** el diseño de `prioridad-top5-cliente` (`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/design.md` §7, S-1) y la nota de despliegue de F1B-07 (cambio visible (d)). La decisión `top5-manual` (`openspec/config.yaml:1954`) dice «sus tickets la heredan» sin precisar si es sólo al nacer o también retroactiva.
**Afecta a:** capacidad `tickets-core` · fila F1B-07 · tabla `public.prioridad_ajustes` (cada propagación dejaría una traza por ticket).
**Medido el 2026-10-01:** marcar o desmarcar un cliente sólo escribe en `public.cliente_prioridad` (`apps/desk/server/db/prioridadCliente.ts`, `fijarPrioridadCliente`); ninguna consulta toca `tickets.priority`. Lo fijan las pruebas TC24-14 y TC24-15 de `apps/desk/server/prioridadTop5.test.ts` y de `apps/desk/server/services/ticketService.test.ts`.
**Estado:** nueva
**Destino:** **SIN DESTINO ASIGNADO**, a propósito (R-3: no se inventa destino). **Dueño propuesto:** Gerencia. **Qué desbloquea:** que un cliente recién marcado Top 5 tenga ya su prioridad en los tickets que tiene abiertos, sin ajustarlos uno a uno; si la respuesta es sí, un `UPDATE` más una traza por ticket sería aditivo. Dato de producción: decidir también si se hace una sola vez al marcar o cada vez que cambie la prioridad del cliente.

## E-110 · 2026-10-01 · pregunta · **NUEVA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-139**
**Qué:** Dos puntos de `decision/e099-orden-cola-taller` que su texto literal no cierra, y que `prioridad-top5-cliente` (F1B-07) resolvió como supuesto al construir la cola del taller (`5aab12c`). Los señaló su `verify-report.md` (S1).
**(1) Tickets sin habilitación.** La respuesta ordena «por la fecha y hora en que Comercial los habilitó […], no por la fecha de llegada», pero no dice qué hacer con los tickets que nunca ejecutaron «Habilitar Servicio» (los traídos de Zoho y los que no pasaron por la espera comercial). Hoy cuentan por su **fecha de creación** (supuesto S-10b; `packages/shared/src/prioridad.ts:95-98`, `instanteDeCola`), y sin ninguna fecha van al final de su prioridad. Eso queda en tensión con «no por la fecha de llegada». **¿Se confirma, o se prefiere otra cosa** (p. ej. que vayan siempre detrás de los habilitados)?
**(2) Qué habilitación cuenta.** La respuesta describe la salida de la espera «Remisión creada», pero `habilitar_servicio` sale de tres estados (`packages/shared/src/transitions.ts:178`: OV asignada, Ticket creado y Remisión creada), y el código cuenta **cualquier** ejecución de esa transición, la última si hay varias (supuesto S-10a; `apps/desk/server/db/colaTaller.ts:14`). **¿Es lo que se quería**, o sólo debe contar la salida de «Remisión creada»?
**De dónde viene:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` → `decision/e099-orden-cola-taller`; supuestos S-10a y S-10b de `prioridad-top5-cliente/proposal.md`.
**Afecta a:** fila F1B-07 del §5 del plan · capacidad `vistas-tablero` (RQ-VT-09).
**Estado:** nueva
**Destino:** **SIN DESTINO ASIGNADO**, a propósito (R-3: no se inventa destino). **Dueño:** Gerencia. **Qué desbloquea:** convertir S-10a y S-10b de supuestos en decisión; si la respuesta cambia alguno, el cambio es una función pura de `packages/shared` (`ordenarColaTaller`) o la consulta de `colaTaller.ts`, con sus pruebas.

## E-111 · 2026-10-01 · respuesta · **CERRADA 01/10** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-138 (precisada: vigente R08.4)**
**Qué:** cuál de las dos revisiones del maestro es la publicada, que el §0 de `docs/sdd/R08.4_Expediente_de_cambios.md` declaraba «premisa medida pero no confirmada» y el corte de las 13:55 devolvió como pregunta.
**Respuesta textual de Gerencia (panel, 01/10 16:00 UTC):** «Sí, la R08.3 es la línea buena del maestro, pero está en construcción y revisión: todavía no es la versión vigente. Mientras tanto se guarda en el control de versiones como borrador, con una primera línea «R08.3 · BORRADOR en revisión, no vigente», para que no se pierda y deje de aparecer como fichero sin registrar; no se saca copia citable ni se marca ninguna decisión como incorporada. La versión vigente sigue siendo la R08.2. Cuando Gerencia entregue la R08.3 definitiva, se revisa, se versiona como vigente, se saca su copia citable y se marcan una a una las decisiones que incorpora. El objetivo es tenerla antes del 17/10, para cumplir el plazo de un mes fijado el 24/09.»
**De dónde viene:** panel, apartado 06, respuesta a la pregunta abierta por el corte de hoy a las 13:55.
**Afecta a:** toda cita `:NNNN` al maestro (siguen apuntando a la **R08.2**, y no se reapunta ninguna) · las **74** entradas de `decisiones_de_gerencia` con `maestro_revision: "pendiente"` · el plazo del **17/10** de `decision/barrido-comprobaciones-nuevas` · la tarea 9 de F0-05 (versionar `docs/Manifesto`, de Gerencia).
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` (`decision/maestro-r08-3-publicada`) · plan §4.5, fila nueva · `docs/sdd/R08.4_Expediente_de_cambios.md` §0 y §5. **Clave Engram:** `decision/maestro-r08-3-publicada`.
**⚠️ Medido después de la respuesta, y es el desvío grande de este corte:** a las **20:43 UTC** de hoy —cuatro horas y media después— aparecen en disco `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.docx` (368.057 bytes) **y su `.md` citable** (645.793 bytes), cuya cabecera dice «**R08.4 — documento definitivo del plan de desarrollo**: incorpora las decisiones de Gerencia del 17/09 al 01/10/2026, las correcciones al blueprint, la revisión de GN y el plan de fases R01.3». Ninguno de los dos está trackeado. Comprueba: `ls -l docs/Manifesto/ ; head -14 docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md ; git status --porcelain docs/Manifesto/`. **Devuelto como pregunta `maestro-cual-es-la-vigente`.**

## E-112 · 2026-10-01 · regla · **RUTEADA 01/10 → `CLAUDE.md`**
**Qué (literal de Gerencia):** «Por ahora no se usa la linealidad (R²) entre el candidato y el patrón como criterio de aprobación de la calibración. La calibración se sigue aprobando con los lineamientos del fabricante para cada marca y modelo, tal como se enseñan en los entrenamientos. En Desk 2.0, esos lineamientos son los valores esperados y las tolerancias que lleva cada ítem de calibración en el catálogo del equipo (campos de valor con rango), y el técnico no aprueba fuera de ellos. La R² puede registrarse como dato informativo si el equipo la calcula, pero no decide la aprobación. Se podrá revisar más adelante con datos de varias calibraciones. El punto M2.7 de la R08.3 pasa de [EN DISCUSIÓN] a decidido, y cierra el punto abierto nº 46 en lo que respecta a la R².»
**De dónde viene:** panel, apartado 07, 01/10 17:50 UTC · marcada por Gerencia como **`regla`**.
**Afecta a:** **M2.7** del maestro · **punto abierto nº 46** del Anexo D · el modelo de datos del catálogo de calibración (campos de valor con rango), que es contenido de **F1D-01**.
**Estado:** ruteada · **Destino:** **`CLAUDE.md`**, sección «Regla de dominio — la calibración se aprueba por los lineamientos del fabricante», con fecha y procedencia, por ser del tipo `regla`. **Y además** anotada para el expediente del maestro (§5 de `R08.4_Expediente_de_cambios.md`).
**⚠️ Consecuencia que la regla no previó, y se señala sin discutirla:** su contenido es de **negocio**, no de método, y `CLAUDE.md` se carga **entero** en cada sesión de construcción. Queda escrita en cuatro líneas. **Medido el 01/10 sobre `b85cdcc`:** `grep -rniE "R2|linealidad|r_cuadrado" packages/shared/src apps/desk/server --include=*.ts` = **0 aciertos del concepto**, así que la regla no retira nada construido: prohíbe un criterio que nunca entró. **Medido también:** la R08.4 que está en disco ya la lleva escrita como decisión (`Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2420` y `:5719`, «RESUELTO 01/10 — R08.4»).

## E-113 · 2026-10-01 · correccion · **RUTEADA 01/10 — reitera E-107**
**Qué (literal de Gerencia):** «Cuando Comercial/Compras consigue el SKU de una pieza en «En espera de SKU inventario», ya no pide a Servicio Técnico que actualice la tabla de insumos y repuestos del informe. Comercial/Compras registra el SKU en esa tabla, genera la cotización y ejecuta «Notificación cliente (SKU)»; la aplicación avisa al técnico del ticket de que la pieza ya tiene SKU y se ha añadido al informe. Comercial/Compras solo completa el SKU (código y precio) de las piezas que el técnico ya identificó; no añade, quita ni cambia piezas o cantidades. Si hace falta cambiar una pieza, el ticket vuelve a Servicio Técnico. Antes del corte entra el registro del SKU en la transición y el aviso al técnico; la edición directa de la tabla del informe llega con el módulo de informes en 2027.»
**De dónde viene:** panel, apartado 07, 01/10 15:32 UTC.
**Afecta a:** lo mismo que **E-107** (30/09): **M4.4** del maestro, **F1E-01**, capacidades `transitions-st` y `derivacion-avisos`.
**Estado:** ruteada · **Destino:** el **mismo que E-107**, que esta entrada reitera con otras palabras y sin añadir nada nuevo: `docs/sdd/R08.4_Expediente_de_cambios.md` §2.9 y §5. **No se cuenta dos veces** en el expediente. Se registra como entrada propia porque toda anotación de Gerencia entra con su `E-NNN`, y para que el corte siguiente no la reprocese.

## E-114 · 2026-10-01 · correccion · **TRIADA**
**Qué (literal de Gerencia):** «Corrección al blueprint de servicio técnico: transición «Rechazo» desde Notificación cliente (a propuesta de GN). Hoy la pueden ejecutar Comercial y Servicio Técnico. Pasa a ejecutarla solo el área Comercial, que es la que recibe del cliente la aprobación o el rechazo de la cotización. No cambia su origen ni su destino (Notificación cliente → Por Facturar), ni las otras dos transiciones «Rechazo», que mantienen su área actual. Se construye junto con las demás correcciones del blueprint de servicio técnico del 30/09. Actualizar la tabla de transiciones del maestro (M1.3) y el mapa del blueprint.»
**De dónde viene:** panel, apartado 07, 01/10 15:37 UTC.
**Afecta a:** **M1.3** del maestro · `packages/shared/src/transitions.ts` · el mapa del blueprint (`docs/artefactos/blueprint-*.md`, generados) · capacidad `transitions-st`.
**Estado:** triada · **Destino propuesto:** `docs/sdd/R08.4_Expediente_de_cambios.md` §5, **junto al bloque de correcciones del blueprint del 30/09** que Gerencia nombra expresamente («se construye junto con las demás»). **No mueve ninguna cifra anclada:** cambia el `area` de una transición, no su número. **Dueño propuesto:** Gerencia, para que el bloque entero tenga una fila.

## E-115 · 2026-10-01 · correccion · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-144**
**Qué (literal de Gerencia):** «Corrección al blueprint de servicio técnico: transiciones «Solicitud repuestos» y «Entrega de Repuestos» (a propuesta de GN). Son un traspaso interno de Servicio Técnico. «Solicitud repuestos» (En Proceso → Solicitado) la ejecuta el técnico a cargo del ticket y deriva el ticket al [cargo «Encargado de inventario» / persona: ___], que es quien entrega los repuestos. «Entrega de Repuestos» (Solicitado → En Proceso) la ejecuta el encargado de inventario y devuelve el ticket al técnico que lo tenía, como ya hace «Aprobación» con «quien tomó el ticket». La derivación se construye ya. La restricción de que solo ellos dos puedan ejecutar cada paso llega con el nivel de permisos «propietario del registro», todavía pendiente. Se mantiene lo decidido en c3: si no hay pieza en el almacén, el ticket pasa a «En espera de repuestos» para pedirla fuera.»
**De dónde viene:** panel, apartado 07, 01/10 15:46 UTC.
**Afecta a:** **M1.3** y **M1.9.2** del maestro · el mapa del blueprint · `decision/c3-salida-esperas` (que se mantiene) · `decision/c10-permisos-cargo` (los siete cargos) · nivel «propietario del registro», que `c10` dejó «para más adelante».
**Estado:** triada · **PARCIAL, y falta algo que Gerencia dejó entre corchetes:** el destinatario de la derivación está escrito como «[cargo «Encargado de inventario» / persona: ___]». **Medido el 01/10 sobre `b85cdcc`:** `grep -n "Encargado de inventario" openspec/config.yaml packages/shared/src/*.ts` = **0 aciertos** — los cargos declarados en `decision/c10b-gerente-director` son **siete** y «Encargado de inventario» **no es uno de ellos**. **Destino propuesto:** `R08.4_Expediente_de_cambios.md` §5 para la parte decidida (el traspaso y «la derivación se construye ya»); el corchete se **devuelve como pregunta** `cargo-encargado-de-inventario`. **Dueño:** Gerencia.

## E-116 · 2026-10-01 · correccion · **RUTEADA 01/10 — reitera E-103** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-140**
**Qué (literal de Gerencia):** «"Marcar como pendiente" (En Proceso → Pendiente) se elimina de la rama de servicio técnico: el estado no tiene un objetivo claro. "Diagnóstico complementario" pasa a salir directamente de En Proceso hacia Continuación del proceso, para conservar el circuito de recotización. En la rama de soporte remoto, "Pendiente" se mantiene, porque allí significa soporte en pausa.»
**De dónde viene:** panel, apartado 07, 01/10 15:51 UTC.
**Afecta a:** lo mismo que **E-103** (30/09).
**Estado:** ruteada · **Destino:** el **mismo que E-103**: `R08.4_Expediente_de_cambios.md` §2.7 y §4 (cifra anclada `transiciones`). Resumen de la misma corrección, sin contenido nuevo. **No se cuenta dos veces** en el expediente ni en el movimiento de la cifra anclada.

## E-117 · 2026-10-01 · correccion · **RUTEADA 01/10 — reitera E-115** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-144**
**Qué (literal de Gerencia):** «"Entrega de Repuestos" (Solicitado → En Proceso): traspaso interno de Servicio Técnico. La ejecuta el encargado de inventario al entregar las piezas y devuelve el ticket al técnico que lo tenía a cargo.»
**De dónde viene:** panel, apartado 07, 01/10 15:51 UTC.
**Afecta a:** lo mismo que **E-115**, del que es la mitad.
**Estado:** ruteada · **Destino:** el **mismo que E-115**. Sin contenido nuevo; el corchete del cargo sigue siendo el de E-115.

## E-118 · 2026-10-01 · correccion · **RUTEADA 01/10 — reitera E-106** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-140**
**Qué (literal de Gerencia):** «Se elimina la transición "Servicio externo" (Pendiente → Por Facturar). No se entiende qué busca ni a qué estado lleva. El servicio externo es solo ida y vuelta con un tercero. Si el equipo no vuelve, el ticket sale por la salida de emergencia del estado Servicio externo (c3). Ya está recogido en la corrección del 30/09 (E-106).»
**De dónde viene:** panel, apartado 07, 01/10 15:51 UTC. **Gerencia misma dice que reitera E-106.**
**Estado:** ruteada · **Destino:** el **mismo que E-106**: `R08.4_Expediente_de_cambios.md` §2.8 y §4. **No se cuenta dos veces.**

## E-119 · 2026-10-01 · correccion · **RUTEADA 01/10 — reitera E-103** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-140**
**Qué (literal de Gerencia):** «"Diagnóstico complementario" deja de salir de Pendiente y pasa a salir de En Proceso hacia Continuación del proceso. Se usa cuando, durante la reparación, el técnico ve que hay que volver a diagnosticar. Ya está recogido en la corrección del 30/09 sobre el estado Pendiente (E-103).»
**De dónde viene:** panel, apartado 07, 01/10 15:59 UTC. **Gerencia misma dice que reitera E-103.**
**Estado:** ruteada · **Destino:** el **mismo que E-103**. Añade **el para qué** («cuando, durante la reparación, el técnico ve que hay que volver a diagnosticar»), que se anota en el §5 del expediente como precisión del motivo, no como cambio de alcance.

## E-120 · 2026-10-01 · idea · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-143**
**Qué (literal de Gerencia):** «Remisión de salida en las transiciones de entrega («Entrega al cliente», Por Entregar → Finalizado, y su equivalente en la vía sin factura). Al ejecutar la entrega, el sistema permite crear desde el propio ticket la remisión de salida del equipo y de los accesorios con los que ingresó, partiendo de lo registrado en la remisión de entrada (complementa E-100). Ampliación: la remisión de salida lista también las partes autorizadas por el cliente que se reemplazaron durante el servicio, tomadas de la cotización aprobada. Para el sistema, esa remisión confirma que esas partes se entregaron al cliente, y el inventario les da salida automáticamente. Condición: cada pieza se descuenta del inventario una sola vez. Hay que definir cómo se reparte esto con «Entrega de Repuestos», donde la pieza pasa del almacén al técnico, y con la factura de Zoho Books mientras siga descontando inventario. Una propuesta: la entrega al técnico la deja asignada al ticket, y la remisión de salida confirma el consumo. La remisión de salida desde la transición va antes del corte del 14/12. Las partes en la remisión y la salida automática de inventario son una mejora posterior al corte.»
**De dónde viene:** panel, apartado 07, 01/10 16:00 UTC.
**Afecta a:** capacidad `remisiones` · transiciones de entrega (`packages/shared/src/transitions.ts:249` y `:251`) · **F1B-04** (que construyó la remisión de entrada) · `decision/c6-qa-liberacion` (foto del equipo embalado) · inventario y Zoho Books.
**Medido el 2026-10-01 sobre `b85cdcc`, y es la consecuencia que la idea no previó:** **la aplicación NO crea remisiones de salida hoy.** La tabla las admite (`packages/zoho-sync/src/db/schema.sql:273`, `tipo text NOT NULL DEFAULT 'entrada'`), pero `tipo: 'salida'` aparece **sólo en pruebas** —`apps/desk/server/db/historial.test.ts:124`, `apps/desk/server/services/valoresDeTransicion.test.ts:107`, `packages/shared/src/bodegaje.test.ts:46`— y **ninguna ruta ni pantalla la escribe**: la única pantalla de alta se titula «Remisión de entrada» (`apps/desk/src/components/CrearRemision.tsx:167`). Lo que hoy existe de la salida es **sólo su fecha**, como campo de dos transiciones («Fecha Remisión de Salida», `transitions.ts:249` y `:251`). Comprueba: `grep -rn "'salida'" apps/desk/server apps/desk/src packages --include=*.ts --include=*.tsx | grep -i remis`.
**Estado:** triada · **Destino:** **SIN DESTINO ASIGNADO**, a propósito. Gerencia da fecha («antes del corte del 14/12») y no fila, y **ninguna fila del §5 reclama la creación de la remisión de salida**. No es un ajuste de F1B-04: es una pieza que no existe. **Dueño propuesto:** Gerencia. **Devuelta como pregunta** en `trabajo-del-01-10-antes-del-corte-sin-fila`.

## E-121 · 2026-10-01 · correccion · **TRIADA**
**Qué (literal de Gerencia):** «Se aprueba la corrección C5 (punto abierto nº 35): cada transición del blueprint lleva un tipo de evento, además de su área y sus campos, para poder analizar los tiempos por tipo de evento (M7.3). Se aplica la clasificación de M1.8 con la fusión del 17/02, en cuatro tipos: Operativo: diagnóstico, calibración, reparación, informes. Decisional: aprobación, rechazo, escalado a revisión, autorización de liberación sin factura. Compras / Logístico: solicitud y llegada de repuestos, SKU, servicio externo, entrega de repuestos, remisiones. Administrativo: por facturar, liberación comercial, facturación y cierre. Cada transición tiene un solo tipo, y así se resuelve el solape de «informes» que señalaba el punto 35. Claude Code propone la tabla de las transiciones con su tipo, y Gerencia la valida en el panel antes de aplicarla. Va con el bloque de correcciones (1C), después del corte. Como el tipo es una propiedad de la transición, los movimientos registrados antes de esa fecha quedan clasificados igual y no se pierde historial.»
**De dónde viene:** panel, apartado 07, 01/10 16:03 UTC.
**Afecta a:** **punto abierto nº 35** del Anexo D · **M1.8** y **M7.3** del maestro · `decision/c5-tipo-evento` (23/09), que decía que esto **no bloquea** y que F1C-04 podía aplicar el tipo de evento ya · **F1C-04** · `packages/shared/src/transitions.ts`.
**Estado:** triada · **Destino propuesto:** `R08.4_Expediente_de_cambios.md` §5 (cierra el punto nº 35) **y** contenido de **F1C-04**, que es la fila que `decision/c5-tipo-evento` ya nombró. Es la **única** de las 24 anotaciones de hoy que cae en una fila existente sin discusión. **Tarea de persona que crea:** «Claude Code propone la tabla de las transiciones con su tipo, y Gerencia la valida en el panel antes de aplicarla» — una validación en el panel que hoy no existe y que **no tiene fila**; se anota, no se inventa.

## E-122 · 2026-10-01 · idea · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-143**
**Qué (literal de Gerencia):** «Guarda en la entrega: el sistema no permite ejecutar «Entrega al cliente» (Por Entregar → Finalizado) ni su equivalente en la rama sin factura (Por Entregar / Sin facturar → Pendiente de facturar) si el ticket no tiene una remisión de salida vigente, es decir, creada y no anulada. La remisión de salida se puede crear desde la propia transición, y su fecha es la «Fecha Remisión de Salida», que se escribe una sola vez (C4). Esta guarda se suma a las de C6 (foto del equipo embalado y checklist de QA firmado), que llegan con el estado Control de calidad. Si la remisión de salida ya se crea dentro de la aplicación, la guarda entra antes del corte del 14/12. Si no, entra junto con la creación de la remisión desde la transición.»
**De dónde viene:** panel, apartado 07, 01/10 16:14 UTC.
**Afecta a:** capacidad `remisiones` y `transitions-st` · `decision/c4-dos-ramas` · `decision/c6-qa-liberacion`.
**Medido el 2026-10-01 sobre `b85cdcc`:** la condición que Gerencia pone —«si la remisión de salida ya se crea dentro de la aplicación»— **no se cumple** (medición completa en **E-120**). Por tanto, **por la propia regla de Gerencia**, esta guarda **no entra antes del corte**: entra «junto con la creación de la remisión desde la transición», que es E-120 y **no tiene fila**. La idea trae su propio condicional y la medición lo resuelve: es la rama segunda.
**Estado:** triada · **Destino:** **SIN DESTINO ASIGNADO**, encadenada a **E-120**. No se devuelve como pregunta propia —su condicional ya está resuelto por medición—, pero **va nombrada** en `trabajo-del-01-10-antes-del-corte-sin-fila`, porque es lo que E-120 arrastra. **Dueño propuesto:** Gerencia.

## E-123 · 2026-10-01 · correccion · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-143**
**Qué (literal de Gerencia):** «Corrección a la regla «foto solo con novedad» (F1B-04 y decision/f1b04-desplegables). En la remisión de entrada, el registro fotográfico es siempre obligatorio, haya o no novedad: al menos una foto del equipo, una de los accesorios y una del embalaje con el que llegó. Si se marca una novedad, se añade su foto como hasta ahora. En la remisión de salida también es obligatorio, como soporte de entrega ante el cliente: equipo, accesorios y embalaje. Esas fotos de salida son las mismas que exige C6 («no se entrega sin foto del equipo embalado»), sin pedirlas dos veces. La regla «foto solo con novedad» se mantiene únicamente en la inspección visual del diagnóstico (antes de energizar) y en los checklists del catálogo. Antes del corte del 14/12: se ajusta la remisión de entrada ya construida y se añaden las fotos a la remisión de salida. Actualizar en el maestro el apartado de la inspección visual previa para distinguir los dos momentos.»
**De dónde viene:** panel, apartado 07, 01/10 16:58 UTC.
**Afecta a:** **F1B-04** · `decision/f1b04-desplegables` (28/09, aterrizada hoy a las 13:50) · el cambio archivado `foto-solo-con-novedad` (F1B-04, `cierra: no`, 25/09) · **IV-12** · el maestro (inspección visual previa).
**Estado:** triada · **DOS DESTINOS DISTINTOS, y por eso se parte:**
· **La remisión de ENTRADA** —«se ajusta la remisión de entrada ya construida»— **sí tiene dónde ir**: es contenido de **F1B-04**, la fila que `f1b04-rotulacion` y `f1b04-desplegables` dejaron construible entera. **Destino propuesto: F1B-04.** ⚠️ **Retira una regla construida y archivada:** `foto-solo-con-novedad` hizo exactamente lo contrario —foto sólo con novedad— y esta corrección la invierte para la remisión de entrada. **No se borra el histórico:** el cambio archivado se queda como está y esta corrección lo supera con fecha 01/10.
· **La remisión de SALIDA** —«se añaden las fotos a la remisión de salida»— **no tiene dónde ir**: la remisión de salida no se crea hoy (**E-120**). **SIN DESTINO**, encadenada a E-120.
**Dueño propuesto:** Gerencia, para la mitad sin destino.

## E-124 · 2026-10-01 · idea · **TRIADA**
**Qué (literal de Gerencia):** «Repuestos preventivos durante el diagnóstico y la reparación (amplía M2.3). Además de las piezas que salen de una prueba No OK, el técnico puede agregar en cualquier etapa del flujo un repuesto como cambio preventivo cuando la prueba se supera pero, por su experiencia, ve un desgaste que anticipa una falla en campo. Requisitos: La línea queda marcada como «Preventivo», con la etapa y la prueba en la que se detectó, y un motivo breve. La evidencia es obligatoria: foto o valor medido que muestre el desgaste. Se ofrecen los repuestos de esa etapa, igual que en las No OK. En la cotización, las líneas preventivas van separadas de las correctivas, como recomendación que el cliente puede aprobar o no sin que eso bloquee la liberación del equipo. Si se agrega cuando el cliente ya aprobó la cotización, el ticket pasa por «Diagnóstico complementario» para recotizar. Las piezas preventivas que se reemplacen aparecen en el informe y en la remisión de salida como las demás, y se puede medir cuántas recomendaciones preventivas aprueban los clientes. Va con la épica del diagnóstico (1D), después del corte.»
**De dónde viene:** panel, apartado 07, 01/10 17:42 UTC.
**Afecta a:** **M2.3** del maestro · épica **1D** · `decision/anexo-9-comentarios` (catálogo de fallas) · `decision/falla-nueva-bloqueante` (las tres gravedades) · la remisión de salida (**E-120**).
**Estado:** triada · **Destino propuesto:** épica **1D**, **después del corte**, que es lo que Gerencia escribe. ⚠️ **No nombra una fila**, y la épica 1D tiene ocho: **F1D-04** (comentarios del catálogo) y **F1D-05** (encadenamiento No OK) son las candidatas por contenido, pero asignarlas sería inventar destino (R-3). **Se anota con épica y sin fila.** **Dueño propuesto:** Gerencia. Depende además de E-124 abajo: la línea preventiva aparece «en la remisión de salida», que no existe.

## E-125 · 2026-10-01 · idea · **TRIADA**
**Qué (literal de Gerencia):** «Árbol de fallas RCM por clase de activo (M2, [PROPUESTO]). Antes de decidir si se construye, preparar una estructura de ejemplo para evaluarla sobre los equipos del portafolio. Como mínimo, una clase de activo completa (Grimm EDM180) y una parcial (Horiba AP-370), con los niveles: clase de activo → función → falla funcional → modo de falla → efecto → consecuencia → tarea de mantenimiento → frecuencia. Cada modo de falla se enlaza con los ítems del catálogo de inspección que lo detectan y con su criterio de falla. Fuentes: catálogos Grimm v1.8 y Horiba v1.4, manuales del fabricante y la taxonomía ISO 14224 (punto 56). Es un documento de análisis, no desarrollo: no entra en el plan de tandas hasta que Gerencia y Servicio Técnico decidan si se adopta y para qué (plan de mantenimiento de contratos, cambios preventivos, análisis de fallas recurrentes).»
**De dónde viene:** panel, apartado 07, 01/10 17:45 UTC.
**Afecta a:** **M2** del maestro · `decision/anexo-56-taxonomia` (ISO 14224:2016 simplificada, 24/09) · `decision/p45-macro-fases` (los N1 propios de cada marca, 23/09).
**Estado:** triada · **Destino:** **ninguno en el plan de tandas, y lo dice Gerencia misma**: «es un documento de análisis, no desarrollo: no entra en el plan de tandas hasta que Gerencia y Servicio Técnico decidan si se adopta». Es la **única** de las 24 anotaciones de hoy que **viene con su propia regla de no-ruteo**, y se respeta. **Destino propuesto: `R08.4_Expediente_de_cambios.md` §5 como punto abierto con dueño** (Gerencia + Servicio Técnico), que es la salida 2 de las tres de F0-05. **No se devuelve como pregunta:** la decisión que falta ya está nombrada en su propio texto.

## E-126 · 2026-10-01 · correccion · **TRIADA**
**Qué (literal de Gerencia):** «M2.5, informes de servicio, paso 1 (punto nº 14): la tabla de remisiones de entrada la escribe Desk 2.0 y vive en su propia base de datos; no llega de la plataforma de hojas de vida. Confirma lo decidido el 23/09/2026 (decision/p14-remisiones-entrada) y el cierre de la hoja de Google el 14/12 (decision/p14b-hoja-google). La fecha de remisión de entrada, que arranca el bodegaje (M1.10), es la que registra la aplicación. En la R08.3, el apartado M2.5 pasa de [ABIERTO] a cerrado. Recordatorio: antes del 31/10 hay que averiguar quién sigue rellenando la hoja de Google y para qué, y comprobar si ese uso queda cubierto por las remisiones sin ticket (E-104).»
**De dónde viene:** panel, apartado 07, 01/10 17:47 UTC.
**Afecta a:** **M2.5** y **M1.10** del maestro · **punto nº 14** del Anexo D · `decision/p14-remisiones-entrada` y `decision/p14b-hoja-google` (los dos **confirmados**, no cambiados) · **F1E-01** · **E-104** (remisiones sin ticket).
**Estado:** triada · **Destino propuesto:** `R08.4_Expediente_de_cambios.md` §5: cierra **M2.5** y **no cambia ninguna decisión** — las confirma. ⚠️ **Lo único con fecha propia es una tarea de persona:** «antes del **31/10** hay que averiguar quién sigue rellenando la hoja de Google y para qué». Ya estaba fijada por `decision/p14b-hoja-google` el 24/09 con la **misma fecha**, y hoy sigue sin ejecutarse: **séptimo día de los treinta y siete**. No es fila del §5; es tarea de Gerencia con vencimiento. **Se cuenta en el parte como plazo vivo.**

## E-127 · 2026-10-01 · idea · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-143**
**Qué (literal de Gerencia):** «Hojas de vida de los equipos propios de Ambientalia (amplía M3). El módulo de hojas de vida admite también los equipos internos: patrones de referencia y gases patrón, instrumentos de medición, herramientas de taller y equipos de demostración o préstamo. Requisitos: Alta y administración. Los da de alta y los administra el cargo Especialista técnico desde una vista propia de «Equipos internos», sin depender de Comercial. El propietario es Ambientalia y no llevan datos de facturación ni garantía de cliente. Plan de mantenimiento y calibración por equipo. Cada tarea tiene su tipo (calibración externa, verificación interna o mantenimiento), su periodicidad y su responsable. Alertas. Aviso al Especialista técnico con antelación configurable antes de cada vencimiento, y escalado a Dirección Técnica si la tarea se vence sin ejecutar. Ejecución con evidencia. Cada tarea se registra con su fecha, quién la hizo, el resultado y el soporte adjunto (certificado del laboratorio externo o registro de la verificación interna). Con eso se recalcula el siguiente vencimiento. Trazabilidad con el servicio. En cada calibración a un cliente se registra qué patrón o instrumento propio se usó, y el sistema no permite seleccionar uno con la calibración vencida. Salidas a calibración externa. Cuando un equipo propio sale a un laboratorio, se usa la remisión sin ticket (E-104). Es funcionalidad nueva y va después del corte del 14/12. Si el cargo Especialista técnico no existe aún en los permisos por cargo (F1C-05), se añade.»
**De dónde viene:** panel, apartado 07, 01/10 17:52 UTC.
**Afecta a:** **M3** del maestro · capacidad `hojas-vida` · **F1B-02** (hoja de vida construida el 23/09) · **F1C-05** (permisos por cargo, archivada el 30/09) · `decision/f1a03-familia-y-gas-patron` (la tabla de gases patrón con disponibilidad y vencimiento, que **es** una de las piezas que esta idea reclama) · **E-104** (remisiones sin ticket, SIN DESTINO desde el corte anterior).
**Medido el 2026-10-01 sobre `b85cdcc`:** el cargo **«Especialista técnico» no existe**: `decision/c10b-gerente-director` declara **siete** cargos y no está entre ellos, y `grep -n "Especialista" openspec/config.yaml packages/shared/src/*.ts` = **0 aciertos**. **F1C-05 está archivada**, así que «si no existe, se añade» es trabajo sobre una tanda cerrada.
**Estado:** triada · **Destino:** **SIN DESTINO ASIGNADO**, a propósito. Es **capacidad nueva entera** —segunda del corte anterior (E-104) y de este—, con fecha («después del corte») y sin fila. **Dueño propuesto:** Gerencia. **Devuelta como pregunta** en `trabajo-del-01-10-antes-del-corte-sin-fila`, en su apartado de lo posterior al corte. ⚠️ **Encadena dos piezas que ya están sin destino:** E-104 (remisiones sin ticket) y el cargo nuevo sobre F1C-05 cerrada.

## E-128 · 2026-10-01 · idea · **TRIADA**
**Qué (literal de Gerencia):** «Versión imprimible de la hoja de vida (amplía M3). Desde la hoja de vida de cualquier equipo se puede generar un PDF para adjuntar o compartir como soporte cuando el cliente lo solicite. Requisitos: Contenido para el cliente. Solo incluye los campos marcados como visibles para el cliente (marca de visibilidad de M8.3). Lo que es solo interno no aparece nunca en el PDF. Datos del documento. Lleva identificación del equipo (modelo, serial, código interno del cliente), datos de garantía, historial de intervenciones con fecha y tipo, y certificados de calibración vigentes. Fecha de corte y registro. Se indica «emitida el [fecha], con información hasta esa fecha», y queda guardado quién la generó y para quién. Versión completa interna. Hay también una versión completa para uso interno y auditorías, con todos los campos, que solo pueden generar los cargos autorizados. Equipos propios. Aplica igual a los equipos propios de Ambientalia (idea del 01/10), como soporte ante auditorías ISO.»
**De dónde viene:** panel, apartado 07, 01/10 17:53 UTC.
**Afecta a:** **M3** y **M8.3** del maestro · capacidad `hojas-vida` · **E-127** (equipos propios) y **E-134** (el PDF del portal, que Gerencia declara **el mismo documento**).
**Estado:** triada · **Destino:** **SIN DESTINO ASIGNADO**, a propósito. No trae fecha —ni «antes» ni «después» del corte—, lo que la deja **sin situar en el calendario** además de sin fila. **Dueño propuesto:** Gerencia. ⚠️ **Depende de una marca que no existe:** «los campos marcados como visibles para el cliente (marca de visibilidad de M8.3)». **Medido el 01/10:** `grep -rn "visible_cliente\|visibleCliente\|visibilidad" packages/zoho-sync/src/db/schema.sql apps/desk/server --include=*.ts` = **0 aciertos del concepto** — la marca de visibilidad es alcance del portal (M8), que va después del corte, así que esta pieza **no puede entrar antes que ella**.

## E-129 · 2026-10-01 · correccion · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-143**
**Qué (literal de Gerencia):** «Corrección al OCR en recepción y a la regla del 24/09 («el equipo tiene que existir» en mantenimiento y soporte remoto). Cuando ni el equipo ni el cliente aparecen en las bases de Ambientalia, tras buscar por OCR, por serial y por cliente, el sistema permite registrarlos a mano en la recepción, en cualquier tipo de servicio: Equipo: serial, marca, modelo del catálogo (o «modelo no catalogado» con texto) y tipo. El serial manual se teclea dos veces y debe coincidir. Si el serial ya existe, se ofrece el equipo existente y no se crea otro. Cliente: si no está en los contactos de Zoho Books, se registra como cliente provisional con razón social, NIT, contacto, teléfono y correo. Validación: el equipo y el cliente quedan marcados «pendiente de validar». Comercial enlaza el cliente con su contacto de Zoho Books (o lo crea allí) y completa los datos comerciales del equipo (fecha de factura, garantía, mantenedor), que siguen reservados a Comercial. No se puede ejecutar «Habilitar Servicio» mientras siga pendiente. Trazabilidad: queda registrado quién hizo el alta manual y por qué no se pudo usar el OCR ni el autocompletado. Va antes del corte del 14/12: es paridad con Zoho Desk, que hoy permite registrar cualquier equipo, y sin ella la recepción se bloquea con clientes nuevos.»
**De dónde viene:** panel, apartado 07, 01/10 17:55 UTC.
**Afecta a:** **corrige dos decisiones de Gerencia del 24/09**: `decision/equipo-nuevo-alta-en-ticket` («Para mantenimiento y soporte remoto se mantiene la regla actual: el equipo tiene que existir») y `decision/edicion-datos-comerciales-equipo` (los campos reservados a Comercial, que **se mantienen**) · capacidad `tickets-core` y `hojas-vida` · la fila nueva «Alta y edición del equipo» (S–M), decidida el 24/09 y **todavía sin escribir en el §5**.
**Estado:** triada · **Destino propuesto:** la **fila nueva «Alta y edición del equipo»** que `decision/equipo-nuevo-alta-en-ticket` creó el 24/09 — es la única fila cuyo contenido esta corrección amplía, y Gerencia la describe como la misma pantalla. ⚠️ **Esa fila es una de las cuatro decididas y nunca escritas en el §5**, que este parte cuenta por **cuarto corte consecutivo**: proponer un destino que no existe en el plan es exactamente lo que F0-05 llama «trabajo sin fila». **Se propone el destino y se dice que la fila no está escrita.** **Lo nuevo que la corrección añade y la fila del 24/09 no cubre:** el **cliente provisional** con enlace posterior a Zoho Books, la marca «pendiente de validar» y la **guarda sobre «Habilitar Servicio»**. Eso último toca la transición que **E-099** acaba de convertir en el ordenador de la cola del taller (F1B-07, archivada hoy): dos decisiones sobre la misma transición en dos días. **Dueño propuesto:** Gerencia.

## E-130 · 2026-10-01 · idea · **TRIADA**
**Qué (literal de Gerencia):** «Carga masiva del histórico documental a las hojas de vida (amplía M3 y la migración del histórico ya decidida). Objetivo: que el historial que hoy está en PDF en las carpetas de Drive por serial se vea en orden cronológico en la hoja de vida de cada equipo y en el resto del sistema (indicadores, portal). Lo decidido el 21/09 se mantiene: los PDF siguen en Drive y en la base de datos entran los datos extraídos con un enlace a su documento. El proceso tiene dos pasos: Preprocesado fuera de la aplicación, con la herramienta independiente de IA ya prevista. Lee los PDF y consolida una tabla estándar: serial, fecha, tipo de intervención, ticket o informe de origen, hallazgos, repuestos, resultado de calibración y enlace al PDF. Una persona de Servicio Técnico revisa la tabla antes de cargarla. Importador en Desk 2.0 de esa tabla. Valida el formato, rechaza filas con serial desconocido o datos incompletos (con un informe de rechazos), no duplica eventos ya existentes y marca cada evento como «histórico importado». Más adelante se puede añadir un módulo dentro de la aplicación que interprete archivos sueltos y use el mismo importador. Hay que tenerlo en cuenta en la regla de apertura del portal (M8.6): un equipo solo se muestra al cliente cuando su historial está cargado y revisado. Va después del corte del 14/12; el preprocesado puede adelantarse en paralelo porque no consume desarrollo de la aplicación.»
**De dónde viene:** panel, apartado 07, 01/10 17:58 UTC.
**Afecta a:** **M3** y **M8.6** del maestro · capacidad `hojas-vida` · `decision/p8-p54-drive` (21/09: «seguimos teniendo enlace a Drive», que **se mantiene**) · **1G** (repatriación del histórico, del plan de independencia) · el portal (M8).
**Estado:** triada · **Destino:** **SIN DESTINO ASIGNADO**, a propósito. ⚠️ **No es lo mismo que 1G**, y conviene decirlo porque se parecen: **1G** repatria el histórico de **tickets de Zoho Desk**; esto importa el histórico **documental de los PDF de Drive**, que son dos orígenes distintos. Confundirlos daría a esta idea una fila que no le corresponde. **Dueño propuesto:** Gerencia. **Lo que sí tiene camino propio y no consume desarrollo:** el preprocesado con la herramienta de IA, que Gerencia autoriza a adelantar en paralelo — tarea de persona, sin fila.

## E-131 · 2026-10-01 · correccion · **TRIADA**
**Qué (literal de Gerencia):** «Corrección al umbral del indicador «% Cumplimiento fecha comprometida (OTD)» (M7, tabla de indicadores). La meta es un cumplimiento superior al 75 %, global y por cliente, no ≥ 90 %. Se aplica [a los dos indicadores de cumplimiento decididos el 30/09: el del taller y el global ante el cliente]. El umbral es un parámetro configurable y no está fijado en el código, para poder subirlo cuando el proceso mejore. No mueve el plan: los semáforos y umbrales de los indicadores van en Fase 2. Antes del corte, la continuidad de indicadores se entrega sin umbrales (decision/e009-kpis).»
**De dónde viene:** panel, apartado 07, 01/10 18:00 UTC.
**Afecta a:** **M7** del maestro (tabla de indicadores) · **E-095** (los dos indicadores de cumplimiento, 30/09) · `decision/e009-kpis` y `decision/e009b-lista-indicadores` (la lista cerrada de **nueve**, que **no incluye** el décimo que E-095 añadía) · Fase 2.
**Estado:** triada · **Destino propuesto:** `R08.4_Expediente_de_cambios.md` §5 (corrección al maestro, M7). **No mueve el plan y Gerencia lo dice:** los umbrales van en Fase 2 y antes del corte los indicadores se entregan sin umbral. ⚠️ **Lo que queda entre corchetes es a qué indicadores se aplica:** «[a los dos indicadores de cumplimiento decididos el 30/09]». El corchete lo abre Gerencia misma. **No se fuerza:** el segundo de esos dos —el cumplimiento global ante el cliente— es el **décimo** indicador que **E-095** añade a una lista que `decision/e009b-lista-indicadores` declaró **cerrada en nueve**, y que el corte de las 13:55 ya devolvió como pregunta sin respuesta. Mientras ese décimo no esté decidido, el umbral del 75 % **se aplica con seguridad sólo al indicador nº 54**, que es el que existe. Se registra así y **se nombra en la pregunta de E-095, que sigue abierta**.

## E-132 · 2026-10-01 · idea · **TRIADA**
**Qué (literal de Gerencia):** «Mantenimiento predictivo a partir de los protocolos de servicio (complementa las dos cautelas del 27/08 sobre los datos de logger). En lugar de depender de equipos conectados, la predicción se basa en los valores que el técnico registra en los campos de valor del catálogo de diagnóstico de cada equipo que ingresa al taller. Requisitos: Desde ya, en el modelo de datos del catálogo (F1D-01): cada valor medido se guarda como dato numérico con su unidad, ligado a equipo, modelo, ítem del catálogo, fecha y ticket, y con dos lecturas cuando hay ajuste: «como se encontró» y «como se dejó». Umbral para analizar: cuando un modelo acumule datos de más de 6 meses y de más de 30 equipos, se analiza por modelo. Se buscan las tendencias de cada función interna, los valores que anticipan una falla, la vida útil típica de los repuestos y las diferencias entre equipos. Uso de los resultados: primero como informe para Dirección Técnica. Si las tendencias se confirman, alimentan las recomendaciones de cambio preventivo (idea del 01/10), los planes de mantenimiento de los contratos y, más adelante, el servicio premium. Solo el punto 1 afecta al desarrollo, y entra en la épica 1D (después del corte). El análisis no es desarrollo hasta que haya datos suficientes.»
**De dónde viene:** panel, apartado 07, 01/10 18:05 UTC.
**Afecta a:** épica **1D**, y **nombra su fila**: **F1D-01** (modelo de datos del catálogo) · **E-124** (repuestos preventivos) · **E-112** (la regla del R², que fija que las tolerancias del catálogo son el criterio) · M2.
**Estado:** triada · **Destino propuesto: F1D-01**, y es **la única de las 24 anotaciones de hoy que nombra su propia fila del §5 por su identificador**. Gerencia acota ella misma el alcance de desarrollo: «solo el punto 1 afecta al desarrollo», y el resto —el umbral de análisis y el uso de los resultados— **no es desarrollo** y queda como punto abierto con dueño (Dirección Técnica), que es la salida 2 de las tres de F0-05. ⚠️ **Lo que F1D-01 tendría que ampliar:** guardar cada valor como **dato numérico con unidad** y **dos lecturas** («como se encontró» / «como se dejó»). **Medido el 01/10:** no hay tabla de valores de catálogo en `packages/zoho-sync/src/db/schema.sql` (`grep -n "valor_medido\|como_se_encontro\|catalogo_valores" packages/zoho-sync/src/db/schema.sql` = **0**), así que es estructura nueva dentro de una fila que existe, no un campo más.

## E-133 · 2026-10-01 · idea · **TRIADA** · **DECIDIDA POR GERENCIA 01/10 (noche) → E-143**
**Qué (literal de Gerencia):** «Filtros del cuadro de mando y de los listados (M7): se añaden «número de ticket» y «serial del equipo» a los ya previstos (fecha, prioridad, cliente, tipo de activo, contrato, técnico, categoría y causa). El serial se filtra con búsqueda parcial (por ejemplo, los últimos dígitos), con la misma lógica que el autocompletado por serial de la recepción. En el listado de tickets, la búsqueda por número de ticket y por serial es paridad con Zoho Desk y debe estar antes del corte del 14/12; si ya existe, solo se confirma. En el cuadro de mando con indicadores entra con el resto de los filtros, en Fase 2.»
**De dónde viene:** panel, apartado 07, 01/10 19:57 UTC.
**Afecta a:** **M7** del maestro · capacidad `vistas-tablero` · **F1B-08** (paridad de listado y ficha con Zoho Desk) · Fase 2 (el cuadro de mando).
**Medido el 2026-10-01 sobre `b85cdcc`, porque Gerencia pide confirmarlo: NO existe.** El listado de tickets **no tiene ninguna caja de búsqueda**: `grep -rn 'placeholder="[^"]*[Bb]usc' apps/desk/src/` da nueve aciertos y **ninguno** está en `TicketList.tsx`, `TicketTable.tsx` ni `KanbanBoard.tsx` —los hay en Equipos (`EquiposAdmin.tsx:48`, «Buscar por serie, cliente, marca, modelo, tipo…»), Clientes, Contratos, Actividades y el alta de ticket—. Y el endpoint del listado acepta **sólo** `scope` y `page` como parámetros (`apps/desk/server/routes/tickets.ts:105-114`): no hay `q` ni serial. Comprueba: `grep -rn "req.query" apps/desk/server/routes/tickets.ts`.
**Estado:** triada · **Destino propuesto:** **F1B-08**, por contenido —«paridad de listado y ficha equivalentes a las de Zoho Desk» es literalmente su fila— y porque Gerencia misma lo llama «paridad con Zoho Desk» y lo sitúa **antes del corte**. ⚠️ **F1B-08 sigue parcial** y acumula ya tres cambios sin cerrarla. **Es la única pieza de hoy con fecha previa al corte que encaja en una fila existente**, y por eso se propone destino en vez de dejarla sin él.

## E-134 · 2026-10-01 · idea · **TRIADA**
**Qué (literal de Gerencia):** «Historial completo de intervenciones descargable en el portal (M8.3). En el nivel completo (clientes con contrato), el cliente puede descargar en PDF el historial completo de intervenciones de sus equipos, además de verlo en pantalla. En el nivel básico se mantiene lo decidido: se indica que el historial existe, pero no se abre ni se descarga. El PDF es el mismo que genera la versión imprimible de la hoja de vida (idea del 01/10): incluye solo los campos visibles para el cliente y lleva la fecha de emisión. Queda registrado qué cliente lo descargó y cuándo. Va con el portal del cliente, después del corte.»
**De dónde viene:** panel, apartado 07, 01/10 20:01 UTC.
**Afecta a:** **M8.3** del maestro · el portal del cliente (M8), **después del corte** · **E-128**, que Gerencia declara **el mismo documento**.
**Estado:** triada · **Destino:** **SIN DESTINO ASIGNADO**, encadenada a **E-128**: es su misma pieza vista desde el portal, y Gerencia lo escribe («el PDF es el mismo»). No se duplica: **una pieza, dos entradas**, y la que decide es E-128. **Dueño propuesto:** Gerencia. No se devuelve como pregunta propia; va nombrada con E-128.

## E-135 · 2026-10-01 · idea · **TRIADA**
**Qué (literal de Gerencia):** «Formato único para el contenido técnico publicado: «Technical Notes» (amplía M8.4 y M12, junto a «versión y fecha visibles en cada pieza publicada»). Todo instructivo o procedimiento que se publique, en la base externa para clientes o en la interna, usa una sola plantilla con nombre transversal, «Technical Note» (TN). Cada TN lleva: Identificación: código único (por ejemplo, TN-marca-número), título, versión, fecha de publicación y responsable de la aprobación. A qué equipo va dirigida: marca, modelo o familia y, si aplica, versión de firmware. Contenido: objetivo de la acción, precauciones de seguridad, herramientas o materiales, paso a paso numerado, cómo verificar que quedó bien y documentos de referencia (manual del fabricante, otras TN). Audiencia: interna, externa o ambas, marcada desde que se crea, como ya está decidido para los vídeos.»
**De dónde viene:** panel, apartado 07, 01/10 20:09 UTC. **La última de las veinticuatro**, y la escrita **34 minutos antes** de que apareciera en disco la R08.4 del maestro, que ya la lleva dentro (`…R08.4.md`, «Technical Note (TN)» y «TN-», tres apariciones del código).
**Afecta a:** **M8.4** y **M12** del maestro · base de conocimiento (punto abierto nº 51) · Fase 2 o posterior; Gerencia **no le pone fecha**.
**Estado:** triada · **Destino:** **SIN DESTINO ASIGNADO**, a propósito. No hay ninguna fila del §5 de base de conocimiento ni de contenido publicado: `grep -n "base de conocimiento\|Technical" docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` = **0 aciertos en el §5**. Es **formato documental**, no funcionalidad: puede no necesitar fila nunca. **Dueño propuesto:** Gerencia + Dirección Técnica. **No se devuelve como pregunta:** sin fecha y sin desarrollo asociado, no bloquea nada, y preguntarlo gastaría una pregunta del panel en lo que no corre prisa. Se deja anotada con dueño, que es la salida 2 de F0-05.

---

> **Cierre del lote del 01/10 (segundo corte del día, 20:47–21:5x UTC).** Veinticinco documentos de Gerencia
> recogidos: **1 respuesta** (E-111) y **24 anotaciones** (E-112 a E-135) — **1 `regla`**, **12
> `correccion`** y **11 `idea`**. De las 24: **5 reiteran** entradas ya ruteadas del 30/09 (E-113→E-107,
> E-116 y E-119→E-103, E-117→E-115, E-118→E-106) y **no se cuentan dos veces**; **4 traen destino
> propuesto a una fila existente** (E-121→F1C-04, E-132→F1D-01, E-133→F1B-08, E-123 su mitad de
> entrada→F1B-04); **1 trae su propia regla de no-ruteo** (E-125) y **12 quedan SIN DESTINO a
> propósito**. Ninguna se convierte en tanda desde aquí: eso lo decide quien decide el alcance.

---

> **PASADA EXTRAORDINARIA DEL 01/10, 21:30 UTC — no recoge nada, y se escribe por qué.**
> Se pidió una pasada extra para recoger «24 entradas del 01/10 en estado nueva». **Ya estaban
> recogidas:** son exactamente **E-112 a E-135**, aterrizadas y marcadas en el corte que cerró a las
> **21:05**, veinticinco minutos antes. Comprobado antes de tocar nada: las **43** anotaciones del panel
> están en `estado: "recogida"` con su `donde`, y las **69** respuestas en `estado: "aterrizada"` — **0
> pendientes en las dos colecciones**. Reprocesarlas habría creado **E-136 a E-159 duplicando E-112 a
> E-135** y habría sobrescrito las marcas del panel. **La marca hizo su trabajo**: para esto existe la
> regla de acuse del 18/09 —lo que aterriza se marca, no se borra—, y es la primera vez que esa regla
> evita un trabajo duplicado en vez de sólo documentarlo.
>
> **Lo que sí añade esta pasada son tres mediciones sobre el borrador R08.4 del maestro, que nadie tenía
> registradas.** Comprobadas sobre `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`
> (645.793 bytes, 20:43, **sin trackear**):
>
> 1. **Las 24 anotaciones del 01/10 están dentro, una a una.** Se buscó una frase distintiva de cada una
>    y las **21** comprobables aparecen (las otras 3 son reiteraciones de E-103, E-106 y E-107, ya
>    contadas): la linealidad del R² `:2064`, los repuestos preventivos `:1956`, los equipos propios
>    `:2076` y `:2115`, el alta manual («pendiente de validar», 3 apariciones), las Technical Notes (16),
>    el traspaso de repuestos `:1035` y `:1554`, el registro fotográfico (2), el histórico importado (1),
>    el serial en los filtros (1). El documento declara **150** marcas `[DECIDIDO … R08.4]`.
>    **Esto NO convierte ninguna decisión en incorporada:** `decision/maestro-r08-3-publicada` (hoy,
>    16:00) dice que la vigente es la **R08.2** y que **no se marca ninguna decisión**, y una pasada
>    extraordinaria no sustituye a una respuesta del panel. Las 72 siguen `maestro_revision: "pendiente"`.
> 2. **⚠️ EL BORRADOR R08.4 NO SÓLO INCORPORA: ABRE 29 PUNTOS NUEVOS, Y ESO NO ESTABA REGISTRADO.** Su
>    Anexo D tiene **89 filas numeradas del 1 al 91** —faltan el 19 y el 22, como siempre— frente a los
>    **62** del vigente, y **29 son nuevas: de la nº 63 a la nº 91**. Reparto medido: **50 ABIERTOS**, 37
>    RESUELTOS, 1 PARCIAL, 1 SUSTITUIDO. Hoy el panel publica **27 abiertos sobre 62**. Si la R08.4 pasa
>    a vigente, los puntos abiertos **pasan de 27 a 50** sin que nadie haya decidido nada: es una
>    consecuencia que la pregunta `maestro-cual-es-la-vigente` no tenía escrita y que cambia el precio de
>    su opción 1. Comprueba:
>    `python3 -c "import re;t=open('docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md',encoding='utf-8').read();i=t.find('## Anexo D --- Puntos abiertos');s=t[i:i+t[i+10:].find(chr(10)+'## ')+10];f=re.findall(r'^\| (\d{1,3}) \|(.*)$',s,re.M);print(len(f),max(int(n) for n,_ in f),sum(1 for n,r in f if 'ABIERTO' in r))"`
> 3. **El corchete de E-115 tampoco lo cierra el borrador: lo convierte en el punto nº 76.** La fila 76
>    del Anexo D de la R08.4 dice «Cargo o persona "Encargado de inventario" … **ABIERTO — R08.4**. La
>    derivación se construye ya; la restricción espera», y `:1035` lo marca `[ABIERTO]` en el cuerpo. Es
>    decir: el maestro **coincide con esta supervisión** en que falta por decidir, y la pregunta
>    `cargo-encargado-de-inventario` queda confirmada por una segunda fuente, no retirada.
>
> **No se toca el `.docx`, no se trackea nada, no se escribe el plan.** La actualización del plan a una
> R01.4 —filas del §5 y recuento del margen— se declaró en esta pasada como encargo a una sesión de
> construcción. **Eso no consta en el panel y aquí se registra como declarado, no como decidido:** si
> Gerencia lo confirma en el panel, se registra como decisión con su clave; mientras no, esta supervisión
> ni lo ejecuta ni lo da por encargado.

---

## E-136 · 2026-10-01 · correccion · **RUTEADA 01/10 (noche)**
**Qué (literal de Gerencia):** «Corrección a decision/maestro-r08-3-publicada (Gerencia, 01/10/2026, tarde). La versión vigente del maestro es la R08.4 (docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.docx y su .md). La R08.3 fue el borrador de revisión de GN sobre la R08.2 y queda como tal en el histórico, marcada «borrador, no vigente». La R08.4 se generó por encargo expreso de Gerencia, a partir de esa R08.3, como documento definitivo del plan de desarrollo. Se versiona como vigente y su .md pasa a ser la copia citable (CLAUDE.md). Las decisiones que la R08.4 recoge (ver su Anexo C.12 y su Anexo I.3) se marcan con maestro_revision «R08.4». Las veinticuatro notas de GN del 01/10 ya están redactadas en la R08.4, pero siguen necesitando su traza en ENTRADA.md y su destino en el plan, como cualquier entrada. Lo que la respuesta de las 16:00 decía de la R08.3 («no vigente, no marcar decisiones») sigue siendo cierto para la R08.3. La pregunta de qué versión es la vigente queda resuelta a favor de la R08.4.»
**De dónde viene:** panel, apartado 07, documento `maestro-vigente-r08-4`, 01/10.
**Afecta a:** `decision/maestro-r08-3-publicada` · `CLAUDE.md` (copia citable) · las entradas con `maestro_revision: "pendiente"`.
**Estado:** ruteada · **Destino:** corregido sin borrar el histórico en `openspec/config.yaml` → `decision/maestro-r08-3-publicada` → campo `precisada_por`, y en `CLAUDE.md` (fila de la R08.2 de la tabla «El documento maestro citable» y sección «Corrección de Gerencia — el maestro vigente es la R08.4»). **No se versiona el documento ni se marca ninguna `maestro_revision` desde aquí:** por encargo de Gerencia lo hace la sesión de construcción. Las 24 notas del 01/10 ya tienen su traza (E-112 a E-135); su destino en el plan lo fijan E-142 y E-143.

## E-137 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)**
**Qué:** pregunta `avance-cuenta-lo-planificado` — qué cuenta como tanda hecha en el avance.
**Respuesta textual de Gerencia:** «[Gerencia, 01/10/2026] El avance del plan cuenta una tanda solo cuando el cambio que la cierra está construido, verificado (verify PASS), archivado y declarado como cierre de su fila. Un plan commiteado, una propuesta o un código en curso no suman al avance. Lo que está en marcha se publica aparte como cifra de «en curso». La subida del 01/10 por el plan de F1A-03 (guarda del gas patrón) se corrige en el próximo recuento, y F1A-03 cuenta cuando su código quede verificado y archivado. Si el barrido de reconciliación cuenta cabeceras de cambios no archivados, se ajusta para que solo cuente los archivados con cierre declarado.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` · `CLAUDE.md` («Regla de avance — sólo cuenta lo archivado»). **Engram:** `decision/avance-cuenta-lo-planificado`. **Señalado:** F0-01..F0-03 viven fuera de `archive/` con `cierra: si`.

## E-138 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)**
**Qué:** pregunta `maestro-cual-es-la-vigente`.
**Respuesta textual de Gerencia:** «La versión vigente es la R08.4. Las dos cosas son ciertas porque hablan de documentos distintos: R08.3: es el borrador de revisión que GN hizo sobre la R08.2. Lo dicho a las cuatro sigue valiendo para ella: no es vigente, se guarda como borrador y no se marca ninguna decisión como incorporada. R08.4: la generé después, cuando me pediste que, partiendo de esa R08.3, preparara la versión definitiva del plan de desarrollo con todo lo decidido. Por eso dice «documento definitivo» y ya incluye las 24 notas de hoy. Sustituye a la R08.2 como vigente.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` · `CLAUDE.md` · `R08.4_Expediente_de_cambios.md` §8. **Engram:** `decision/maestro-cual-es-la-vigente`.

## E-139 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — cierra E-108, E-109 y E-110
**Qué:** pregunta `cola-del-taller-los-tres-cabos`.
**Respuesta textual de Gerencia:** «(1) Se confirma. Los tickets que nunca pasaron por «Habilitar Servicio» (traídos de Zoho o sin espera de orden de venta) se ordenan por su fecha de creación dentro de su prioridad, y los que no tienen ninguna fecha van al final. No se mandan siempre detrás de los habilitados, para no castigar a los tickets migrados el día del corte. (2) Se confirma. Cuenta cualquier «Habilitar Servicio», venga del estado que venga, y si hubo varias, la última. (3) Se cambia. Al marcar un cliente como Top 5, sus tickets abiertos toman la nueva prioridad, cada uno con su traza; al desmarcarlo, vuelven a la prioridad calculada. En ningún caso se tocan los tickets con un ajuste manual con motivo, que mantienen el suyo. (4) Se construye. La lista de equipos en «Remisión creada» para Comercial se ordena por el tiempo transcurrido desde que el ticket entró en ese estado, que es el mismo reloj de la alarma de 3 días hábiles. Va antes del corte del 14/12.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda`; (3) y (4) son contenido pendiente de **F1B-07** (archivada `cierra: no`). **Engram:** `decision/cola-del-taller-los-tres-cabos`.

## E-140 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — cierra E-103, E-106, E-116, E-118 y E-119
**Qué:** pregunta `tres-transiciones-y-la-cifra-anclada`.
**Respuesta textual de Gerencia:** «A la vez, en una sola entrega. Se registra la R08.4 como maestro vigente (ya dice 31 caminos y 35 pasos). En el mismo cambio se quitan del programa «Marcar como pendiente» y las dos «Servicio externo» hacia Por Facturar, «Diagnóstico complementario» pasa a salir de En Proceso, se regenera el mapa y la cifra vigilada pasa de 34 a 31 caminos (y de 38 a 35 pasos). Los tickets de servicio técnico que estén en «Pendiente» pasan a En Proceso, y el historial se conserva sin reescribir. Va antes del corte del 14/12.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda`; `cifras_ancladas` se mueve **en el mismo commit que el código**, no antes. Fila nueva con talla en la R01.4. **Engram:** `decision/tres-transiciones-y-la-cifra-anclada`.

## E-141 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — cierra E-101
**Qué:** pregunta `salida-emergencia-quien-la-ejecuta`.
**Respuesta textual de Gerencia:** «Se construye dentro de F1C-03 (salidas de emergencia de las esperas, C3), no reabriendo la tanda de permisos. La regla aplica solo a esas salidas: las ejecuta la persona a quien está derivado el ticket en ese momento; en las dos esperas externas, esa persona es de Comercial. Si no está disponible, la ejecuta el Director o el Coordinador de su área, y queda registrado quién lo hizo y por qué. El nivel general de «propietario del registro» para el resto de transiciones sigue pendiente en la fila de permisos. F1C-03 va después del corte del 14/12, como ya estaba previsto.»
**Estado:** cerrada · **Destino:** **F1C-03**, después del 14/12 · `R08.4_Expediente_de_cambios.md` §8 (Anexo D nº 31). **Engram:** `decision/salida-emergencia-quien-la-ejecuta`.

## E-142 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — cierra E-095, E-096, E-098, E-101, E-104, E-105 y E-107
**Qué:** pregunta `trabajo-del-30-09-sin-fila`.
**Respuesta textual de Gerencia:** «Mismo criterio que para las piezas del 01/10: antes del 14/12 solo entra lo que hace falta para no perder nada de lo que hoy da Zoho, y cada pieza tiene fila propia con talla. (1) Remisiones sin ticket: fila propia antes del corte, si se confirma que hoy se hacen en la hoja de Google de remisiones, que se cierra el 14/12; si no, 2027. (2) Aviso «En garantía» y (6) registro del número de pieza con aviso al técnico: filas propias pequeñas en una lista de reserva, en ese orden; entran antes del corte solo si el margen recalculado deja más de una semana, y si no, después del corte. (3) Encuesta en tableta, (4) indicador de cumplimiento global y (5) disponibilidad por persona: filas propias en 2027, en sus fases. (7) Salida de emergencia por la persona a cargo: dentro de F1C-03. Se adelanta a esta semana la averiguación de quién rellena la hoja de Google de remisiones y para qué, porque decide esta pieza (1) y la remisión de salida del 01/10.»
**Estado:** cerrada · **Destino por pieza:** E-104 → fila propia condicionada a la averiguación de la hoja de Google (**esta semana**, tarea de persona de Gerencia) · E-105, E-107 → reserva, en ese orden · E-096, E-095, E-098 → 2027 · E-101 → F1C-03. Las filas las escribe la R01.4. **Engram:** `decision/trabajo-del-30-09-sin-fila`.

## E-143 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — cierra E-120, E-122, E-123 (mitad de salida), E-127, E-129 y E-133
**Qué:** pregunta `trabajo-del-01-10-antes-del-corte-sin-fila`.
**Respuesta textual de Gerencia:** «Criterio para todo lo anotado con fecha y sin fila (las diez piezas del 30/09 y el 01/10): antes del corte del 14/12 solo entra lo que hace falta para no perder nada de lo que hoy da Zoho (paridad), y cada pieza que entra lleva fila propia con talla. Lo que no es paridad se declara para 2027 por escrito. No se reparten piezas en filas existentes sin medirlas. Aplicado a las de hoy: (1) la búsqueda por número de ticket y serial entra en F1B-08, antes del corte; (2) el alta a mano de equipo y cliente desconocidos entra en F1B-14, que se escribe ya en el plan junto con las otras tres filas decididas el 24/09; (3) la remisión de salida desde la entrega, con su guarda y sus fotos, tiene fila propia antes del corte si se confirma que hoy las remisiones de salida se hacen en la hoja de Google o en Zoho, que dejan de estar disponibles el 14/12, y si no, pasa a 2027; (4) las hojas de vida de los equipos propios, con el cargo Especialista técnico, son capacidad nueva: fila propia en 2027, junto con la preparación para la 17025. Las demás piezas se clasifican con la misma regla en la R01.4 del plan, que rehace la cuenta del margen; si queda por debajo de una semana, se para y decide Gerencia.»
**Estado:** cerrada · **Destino por pieza:** E-133 → F1B-08 · E-129 → F1B-14 · E-120, E-122 y la mitad de salida de E-123 → fila condicionada · E-127 → 2027. ⚠️ **F1B-14 ya cuenta como cerrada** (`2026-09-25-edicion-comercial-equipo`, `cierra: si`): meter E-129 la reabre. **Engram:** `decision/trabajo-del-01-10-antes-del-corte-sin-fila`.

## E-144 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — cierra E-115 y E-117
**Qué:** pregunta `cargo-encargado-de-inventario`.
**Respuesta textual de Gerencia:** «El encargado del inventario es el Director Técnico. No se crea un cargo nuevo: «Solicitud repuestos» deriva el ticket a quien tenga el cargo Director Técnico, que entrega las piezas y ejecuta «Entrega de Repuestos», devolviendo el ticket al técnico que lo tenía. Cuando el Director Técnico está ausente (ausencia registrada con fechas, como en la validación de informes), se deriva al especialista técnico Johny Luna. Nota para quien lo registre: «Especialista técnico» no está entre los siete cargos decididos el 24/09; es el mismo cargo que necesitan las hojas de vida de los equipos propios (01/10). Hay que darlo de alta como cargo y asignárselo a Johny Luna, de modo que la derivación de respaldo vaya al cargo y no al nombre.»
**Nota de procedencia:** Gerencia avisó de que la respuesta de la cola del taller estaba pegada por error en esta pregunta y se movió a su clave; ésta es la nueva (versión 2 del documento del panel).
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` · `R08.4_Expediente_de_cambios.md` §8 (Anexo D nº 76). Cargos: de siete a ocho. **Engram:** `decision/cargo-encargado-de-inventario`.

## E-145 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — precisa E-137 y E-143
**Qué:** orden de ejecución del encargo del 01/10 y las dos consecuencias del parte `Parte_2026-10-01c.md` §2 (numerador 12 → 9; F1B-14 reabierta por E-129).
**Respuesta textual de Gerencia:** «ORDEN DE EJECUCIÓN — sí, así: 1. Commitea primero las 294 líneas de la supervisión, como commit documental aparte. No cuentan contra el tope de 800 de ninguna tanda. 2. Termina F1A-03 (verificación del gas patrón) antes de abrir cualquier tanda nueva, respetando la regla del ciclo 2. 3. Después, los puntos 1, 2 y 4 del encargo (versionar la R08.4, memoria Engram, plan R01.4 con el margen). Son trabajo documental; si alguno exige tocar código, va como tanda propia. 4. El punto 3 (corregir el barrido de reconciliación) va como cambio pequeño propio, después de la R01.4. 5. Luego, las tandas en el orden que fije la R01.4. LAS DOS CONSECUENCIAS DEL PARTE: a) Numerador 12 → 9. La regla de avance pide que el trabajo esté TERMINADO y verificado, no que esté dentro de archive/. F0-01, F0-02 y F0-03 son trabajo terminado anterior a la convención de archivo: regístralas en cierres_declarados_por_commit, con el commit que las cierra y la prueba de que están hechas. Publica siempre las dos cifras (por archivo y por commit declarado), como hasta ahora. Lo que la regla excluye es lo planificado o a medias, no lo terminado antes de que existiera archive/. b) E-129 (alta manual de equipo y cliente desconocidos): NO reabras F1B-14. Una fila cerrada se queda cerrada. Crea una fila nueva, F1B-15 «Alta manual de equipo y cliente desconocidos», antes del corte (es paridad con Zoho), con su talla. Es el mismo criterio de fila propia por pieza decidido hoy. La ubicación en decisiones_de_gerencia_adenda está bien; no muevas nada.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` · F1B-15 → la escribe la R01.4 · F0-01..03 → `cierres_declarados_por_commit`, con el cambio del barrido. Commit de la supervisión: `aa11b1c`. **Engram:** `decision/orden-ejecucion-encargo-01-10`.

## E-146 · 2026-10-01 · decision · **CERRADA 01/10 (noche)** — reset de mantenedor del intento 1 de F1A-03
**Qué:** cerrar el intento del lote 1 de `verificacion-gas-patron-certificado` declarando su medida real y hacer el reset de mantenedor cuando el registro lo bloquee.
**Respuesta textual de Gerencia (mantenedor):** «1. AUTORIZADO. Cierra el intento del lote 1 de F1A-03 declarando la medida real: 772 líneas (084875c), por debajo del techo de 800. Cuando el registro lo deje en blocked(maintainer_decision), ejecuta tú gentle-ai sdd-attempt reset con esta autorización expresa de Gerencia como mantenedor, y sigue con los lotes 2 y siguientes de F1A-03. 2. Regístralo antes del reset: una decisión en decisiones_de_gerencia_adenda (decision/reset-intento-f1a03-01-10); su entrada en ENTRADA.md; la tabla de medida: 772 de la tanda; 55 de booksHub; 429 + 355 de supervisión; 1.579 que ve el registro. Indica que sigue el precedente del 10/09 de la regla del ciclo 2. 3. Hallazgo a registrar (sin destino; lo decido después de ver tu propuesta): el registro de intentos mide el árbol entero desde que arranca el intento, así que los commits de supervisión y los ajenos a la tanda se le cargan. Propón cómo evitarlo, por ejemplo midiendo solo los commits con la cabecera de la tanda, o que la supervisión no commitee en main mientras haya un intento abierto. No lo apliques todavía. 4. Los dos commits de booksHub sin ficha (afa4252, a1cfe07): decláralos fuera-del-plan con su motivo, si no lo están ya.»

| Commit | Qué | Líneas |
|---|---|---|
| `084875c` | lote 1 de F1A-03 (la tanda) | **772** |
| `afa4252`, `a1cfe07` | booksHub, sin ficha | 55 |
| `bff215a` | supervisión 01/10 | 429 |
| `aa11b1c`, `ee9989f` | supervisión 01/10 noche y E-145 | 355 |
| | **lo que ve el registro** (`b85cdcc` → HEAD) | **1.579** |

Sigue el **precedente del 10/09 de la regla del ciclo 2** (1.718 imputadas frente a 73 propias). **Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` y `trabajo_sin_ficha_declarado` (booksHub, `fuera-del-plan`). **Engram:** `decision/reset-intento-f1a03-01-10`.

## E-147 · 2026-10-01 · hallazgo · **CERRADA 01/10 (noche) — opción 1 (E-148)**
**Qué:** el registro de intentos (`gentle-ai sdd-attempt`) mide el diff del ÁRBOL entre el principio y el final del intento, así que todo commit que entre en `main` mientras el intento está abierto —supervisión, trabajo sin ficha— se le carga a la tanda. Van tres veces (10/09, 28/09, 01/10), y cada vez para la tanda hasta que un mantenedor hace reset.
**Por qué no basta la regla del ciclo 2 tal como está:** prohíbe dos tandas SDD a la vez sobre el mismo árbol, pero la supervisión y los commits directos (R-5) no son tandas SDD, y entran igual.
**Tres salidas, con su coste:**
1. **Cada intento corre en su propio worktree** (`gentle-ai sdd-attempt handoff` ya mueve un intento a un worktree enlazado). La rama de la tanda sólo recibe sus commits; supervisión y R-5 siguen en `main`. Se fusiona a `main` DESPUÉS del `settle`, nunca durante. Coste: una fusión por tanda, con conflictos previsibles en `openspec/config.yaml` y `ENTRADA.md` (los dos se escriben al final). **Es la recomendada:** el registro mide bien por construcción, sin tocar la herramienta ni frenar a la supervisión.
2. **La supervisión no commitea en `main` con un intento abierto** (rama `supervision/<fecha>`, fusionada tras el `settle`). Coste: lo que la supervisión aterriza no lo ven las sesiones que leen `main` hasta la fusión, así que «toda respuesta aterriza en un fichero que la sesión CARGA» se retrasa; y no cubre los commits R-5.
3. **Medir sólo los commits con la cabecera de la tanda** (un trailer `Tanda: F1A-03` y un script de suma). Coste: el registro es nativo de `gentle-ai` y no se cambia desde este repositorio; la medida buena quedaría al lado de la mala y cada discrepancia seguiría exigiendo reset. Sirve como comprobación, no como solución.
**Afecta a:** toda tanda bajo SDD y a la regla del ciclo 2 de `CLAUDE.md`. **Destino:** ninguno hasta que Gerencia elija.

**Adenda a E-146 (01/10, noche):** el `settle` registró **1.651**, no 1.579. Los 72 de más son el propio commit de E-146/E-147 (`f6f1b5b`), hecho antes del `settle` como se ordenó: el fenómeno de E-147 una vez más. Reset hecho; lotes 2 (`f644027`, 594), 3 (`5251896`, 535) y verify (`15e7bce`, 149, PASS WITH WARNINGS) cerrados cada uno en su intento, bajo 800.

## E-148 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — cierra E-147
**Qué:** techo del archive de F1A-03, las tres desviaciones del diseño, la salida de E-147 y P.1.
**Respuesta textual de Gerencia (mantenedor):** «1. APROBADO un techo de 6.000 líneas para el archivo de verificacion-gas-patron-certificado. Regístralo en aprobaciones_de_techo_del_ledger con fecha y motivo (mudanza de carpetas sin carga de revisión). Condición: el agente de archivo mide antes de aplicar la parte con carga de revisión (fusión de las tres specs en las vivas + archive-report). Si esa parte supera 850 líneas, PARA y avísame. Después cierra F1A-03. 2. Las tres desviaciones del diseño se ACEPTAN y se registran como decisiones de diseño: número de certificado solo en la traza de la transición; PDF servido con tipo fijo; el veredicto bloqueante también exige certificado. 3. E-147: se adopta la OPCIÓN 1. Cada intento SDD trabaja en su propio worktree y se fusiona a main al cerrar. Aplica desde la próxima tanda y anótalo en CLAUDE.md como regla del ciclo, con fecha. 4. P.1: anota como pendiente de persona, con dueño Director Técnico, la entrega de la lista de gases patrón (compuesto, disponibilidad, vencimiento del certificado del cilindro). El script de siembra no se ejecuta hasta tenerla. 5. Sigue con el orden: versionar la R08.4 (con eso se desbloquea el hook de citas), memoria Engram y R01.4. Avísame cuando la R08.4 esté versionada y el hook pase, y hago yo el push.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` (`decision/archivo-f1a03-y-worktrees-01-10`) y `aprobaciones_de_techo_del_ledger_adenda` (al final: insertar dentro del bloque original desplazaría `config.yaml:3269`, citado por un verify-report archivado) · `CLAUDE.md` → «Regla del ciclo 3» · `design.md` del cambio → decisiones aceptadas · P.1 pendiente de persona, dueño Director Técnico. **Engram:** `decision/archivo-f1a03-y-worktrees-01-10`.

## E-149 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — precisa `p14b-hoja-google`, `fecha-corte` y `cargo-encargado-de-inventario`
**Qué:** escenario de la R01.4, festivos, plan A y las contradicciones de su §J.
**Respuesta textual de Gerencia:** «1. ESCENARIO A. F1B-16 y F1B-17 quedan fuera hasta la comprobación de la hoja de Google. Si la comprobación confirma que hoy se hacen ahí, la salida NO es construirlas antes del corte: la hoja de Google sigue abierta después del 14/12 SOLO para remisiones de salida y remisiones sin ticket, hasta que esas filas se construyan (2027). Es una excepción acotada a decision/p14b-hoja-google. Regístralo como decisión. 2. FESTIVOS: se descuentan siempre (12/10, 02/11, 16/11 y 08/12 no se trabajan). Corrige la cuenta de la R01.4 con ellos. «En garantía» queda fuera de la reserva hasta que el margen real lo permita. 3. PLAN A: no se activa ahora. Fecha de decisión: lunes 09/11/2026. Ese día se rehace el margen con el ritmo real de las tandas cerradas desde hoy. Si no queda al menos una semana, se pasa al corte único del 01/02/2027. Anótalo en la R01.4 y en decisiones. 4. CONTRADICCIONES DE §J: «En garantía» y SKU: manda la decisión (reserva). Anótalo para corregir el maestro en la R08.5. F1C-11: la derivación al Director Técnico se construye ya. El respaldo al Especialista técnico espera al registro de ausencias (llega con la validación de informes, 1E). Mientras tanto, reasignación manual por un administrador. Barrido: el cambio pequeño debe leer el §5 de la R01.4 y reconocer los ID 1G, 1H y F1A-10. 5. ORDEN APROBADO: cambio del barrido (fuera-del-plan) → F1C-09 → F1C-10 → F1B-15. Cada uno en su propio worktree (regla del ciclo 3). Sigue en modo producción. 6. Las otras nueve contradicciones de §J: déjalas registradas; las reviso en la próxima revisión del maestro.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` · R01.4 §K (cuenta vigente: margen **+0,8 a +1,1**, extremo bajo bajo la semana; plan A se decide el **09/11/2026**) · expediente R08.4 §10 (para la R08.5). **Engram:** `decision/escenario-a-festivos-plan-a-01-10`.

## E-150 · 2026-10-01 · respuesta · **CERRADA 01/10 (noche)** — amplía E-149
**Qué:** techo del archive de `barrido-avance-archivado`, regla permanente del archivo, el hueco de Zoho de la R01.4 §K.1 y las seis tandas declaradas por commit.
**Respuesta textual de Gerencia (mantenedor):** «1. APROBADO techo de 3.000 líneas para el archivo de barrido-avance-archivado, con la condición de que la parte con carga de revisión (fusión en la spec de reconciliación + informe) no supere 600. Si la supera, PARA. Después fusiona la rama en main y sigue con F1C-09. 2. REGLA PERMANENTE (anótala en CLAUDE.md y en aprobaciones_de_techo_del_ledger_adenda): el archivo de cualquier cambio puede superar 800 líneas por la mudanza de carpetas, sin pedir aprobación, siempre que la parte con carga de revisión no supere 800. Se mide antes de aplicar; si la supera, PARA y consulta. Revisa siempre que el commit de archivo contenga solo el cambio archivado. 3. HUECO DE ZOHO (R01.4 §K.1): si la comprobación encuentra que las remisiones de salida o sin ticket se hacen hoy en Zoho, desde el 14/12 se registran en la hoja de Google, que sigue abierta para esos dos usos hasta que se construyan F1B-16 y F1B-17. Amplía así la excepción de decision/escenario-a-festivos-plan-a-01-10. 4. CIERRES POR COMMIT: registra F0-00, F1A-01, F1A-02, F1A-04, F1A-05 y F1B-01 en cierres_declarados_por_commit, cada una con el commit que la cierra y la prueba (verificación o test que lo demuestra), como ya se hizo en el expediente R08.3 (6ea3ca8, 5218d11, e8c5e90, 43821b8, 607e26a y los que correspondan). Verifica cada una antes de registrarla; si alguna no tiene prueba, déjala fuera y dímelo.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` y `aprobaciones_de_techo_del_ledger_adenda` · `CLAUDE.md` → «Regla del archivo» · R01.4 §K.1 · las seis, dentro de `barrido-avance-archivado` antes de archivarlo. **Engram:** `decision/archivo-barrido-y-regla-del-archivo-01-10`.

## E-151 · 2026-10-02 · decision · **CERRADA 02/10** — condición de despliegue de F1C-09
**Qué:** condición previa para desplegar F1C-09 (`0070ef1`) y ejecutar su migración de los tickets en «Pendiente».
**Respuesta textual de Gerencia:** «No despliegues F1C-09 sin copia previa de la base.»
**Estado:** cerrada · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia_adenda` (`decision/f1c09-copia-antes-de-desplegar`) · tarea de persona de Alfonso antes del despliegue. **Medido el 02/10:** 0 tickets en «Pendiente» entre los 250 no archivados de Zoho Desk. **Engram:** `decision/f1c09-copia-antes-de-desplegar`.

## E-152 · 2026-10-02 · decision · **CERRADA 02/10** — F1B-15: clientes provisionales sin tocar la vista
**Qué:** cómo aparecen los clientes provisionales de F1B-15 junto a los de Books, tras fallar el sondeo de pg-mem sobre `CREATE OR REPLACE VIEW` en una vista existente.
**Respuesta de Gerencia (opción elegida):** «Sin tocar la vista (Recomendado)»: la vista `public.clients` no cambia; el servidor de la app consulta también la tabla de provisionales, sin tocar el worker del hub.
**Estado:** cerrada · **Destino:** replanificación de `alta-manual-equipo-cliente` (F1B-15) · `openspec/config.yaml` → `decisiones_de_gerencia_adenda`. **Engram:** `decision/f1b15-clientes-provisionales-sin-tocar-la-vista`.

## E-153 · 2026-10-02 · decision · **CERRADA 02/10** — F1B-15: el alta manual rechaza un NIT que ya está en Books (P-B)
**Qué:** si el pendiente P-B de `alta-manual-equipo-cliente` (`design.md` §4.6) entra en la tanda: comprobar el NIT del cliente provisional contra Books en el alta.
**Respuesta textual:** «2. Sí, que entre»
**Estado:** cerrada · **Destino:** lote 2 de `alta-manual-equipo-cliente` (F1B-15) · `openspec/config.yaml` → `decisiones_de_gerencia_adenda` (`decision/f1b15-p-b-nit-en-books`). P-A queda pendiente en `tasks.md`. **Engram:** `decision/f1b15-p-b-nit-en-books`.

## E-154 · 2026-10-02 · pendiente · **ABIERTA** — F1B-15: NIT genéricos que no deben bloquear el alta manual
**Qué:** el alta manual compara el NIT del cliente provisional con los de Books y, si casa, responde `409` con los candidatos (E-153). Si varios contactos comparten el NIT normalizado (sucursales, o un NIT genérico como el de consumidor final `222222222222`; hipótesis sobre datos reales, sin verificar), el `409` los devuelve todos y el técnico tiene que elegir uno. **¿Hay NIT genéricos que NO deban bloquear el alta manual?** Hoy bloquean todos: el código no lleva ninguna lista de NIT exentos, porque inventarla sería una decisión de alcance.
**Dueño:** Gerencia. **Qué desbloquea:** decidir si el servidor exime una lista cerrada de NIT genéricos (y cuáles) o si el `409` con candidatos basta; hasta entonces un cliente nuevo sin NIT propio no puede darse de alta como provisional con un NIT genérico.
**Estado:** abierta · **Destino:** `openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/design.md` §4.6 (supuesto reversible de los candidatos múltiples) · se resuelve en una fila del §5 del plan o en un punto abierto del Anexo D, según el alcance que decida Gerencia.

## E-155 · 2026-10-03 · pendiente · **ABIERTA** — F1B-15 (P-A): nadie avisa de que el cliente provisional ya está en Books
**Qué:** el alta manual de F1B-15 crea un cliente provisional, y la unión con el contacto de Books es un **enlace manual** de Comercial. Si el contacto llega a Books **después** del alta y nadie enlaza, conviven los dos y los tickets nuevos pueden seguir yendo al provisional: P-B (E-153) no lo impide, porque sólo compara el NIT en el momento del alta. Salida posible: **un aviso a Comercial cuando un contacto de Books comparta NIT con un provisional sin enlazar**. No es E-154, que trata los NIT genéricos del `409` del alta.
**Origen:** `openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/design.md` §4.6 («Lo que este cambio NO resuelve», P-A), recogido como tarea de persona en el `tasks.md` y en el `archive-report.md` del mismo cambio, archivado en `c557273`.
**Dueño:** Gerencia (alcance y destino). **Qué desbloquea:** decidir si el aviso se construye y en qué fila; hasta entonces el enlace depende de que alguien se acuerde.
**Estado:** abierta · **Destino:** sin asignar — una fila del §5 del plan o un punto abierto del Anexo D, según el alcance que decida Gerencia (R-3).

## E-156 · 2026-10-03 · decision · **CERRADA 03/10** — la cuarta tanda es F1B-03, por su parte L
**Qué:** qué tanda sigue a F1B-15, una vez agotado el orden aprobado en E-149 (punto 5) y con la R01.4 §H fijando sólo tres filas.
**Respuesta textual:** «sí, ejecútalo. la cuarta tanda es F1B-03 por su parte L; los prefijos van en un segundo cambio. Ejecútalo.»
**Estado:** cerrada · **Destino:** fila F1B-03 del §C de la R01.4 (parte L, `cierra: no`) y fila 4 de su §H · `openspec/config.yaml` → `decisiones_de_gerencia_adenda` (`decision/cuarta-tanda-f1b03-parte-l`). Los prefijos (XS, E-094) quedan para un segundo cambio con el mismo `tanda:`, a la espera de la comprobación de Drive y n8n (dueño Gerencia).

## E-157 · 2026-10-03 · pendiente · **ABIERTA** — F1B-03: qué es «crear la OVI de garantía» en Desk, y cinco preguntas que cuelgan de ella
**Qué:** `decision/ovi-garantia-autor` dice quién crea la OVI («La OVI la crea Servicio Técnico, más concretamente el Director Técnico»), pero Desk no escribe en Zoho (`decision/p44-escritura-zoho`) y hoy las OVI se crean en Books: falta decir qué es ese acto DENTRO de Desk. Opciones que trae la propuesta del cambio `tipo-servicio-ticket-sin-ov` (§6, Q1): **(A)** restringir a Director Técnico o administrador el ASOCIAR una orden `OVI-` a un ticket, en todas las entradas de una orden; **(B)** un registro propio de OVI en Desk, que es alcance nuevo y pediría cambio propio; **(C)** escribir en Books, que contradice `decision/p44-escritura-zoho`. Y, si la respuesta es (A), las cinco del diseño (§10): **(1)** área del acto: `puedeCrearOVIGarantia` exige área Servicio Técnico y «Habilitar Servicio» es de área Comercial, así que con el permiso tal cual la OVI sólo entraría por el alta o por la remisión; ¿se mantiene el área o basta el cargo?; **(2)** ¿la restricción alcanza a la «OV adicional» de las dos aprobaciones?; **(3)** un ticket venido de Zoho que ya trae la OVI: ¿reconfirmarla en «Habilitar Servicio» cuenta como asociar?; **(4)** sin cargos de permiso asignados sólo pasa el administrador: ¿es aceptable el día de publicar, o se asignan antes?; **(5)** ¿un ticket de tipo de servicio «Garantía» debe llevar OVI, y una OVI sólo puede ir en tickets de garantía?
**Dueño:** Gerencia, con el Director Técnico. **Qué desbloquea:** el lote 3 (OVI de garantía) de F1B-03 y, detrás, F1B-13 (la ficha de reclamación al fabricante cuelga de ese acto). **Mientras no haya respuesta:** el lote 3 no se construye y no entra en el cambio `tipo-servicio-ticket-sin-ov`; la guarda de remisión no depende de esto.
**Estado:** abierta · **Destino:** contenido de la fila F1B-03 del §C de la R01.4 (su parte de OVI), en un cambio posterior con el mismo `tanda:`.

## E-158 · 2026-10-03 · pendiente · **ABIERTA** — F1B-03: ¿la guarda de remisión alcanza a los tickets de «Equipo nuevo»? Condición de publicación
**Qué:** la guarda de remisión de entrada vigente en «Habilitar Servicio» se construye **sin excepciones** (`decision/anexo-43-en-sitio`: «La regla de remisión obligatoria para habilitar un servicio técnico se mantiene sin excepciones»), y por eso alcanza también a los tickets de clasificación «Equipo nuevo», que nacen en `Ticket creado` y pasan por la misma transición. La respuesta textual habla de «un servicio técnico»: si en la práctica un equipo nuevo no lleva remisión de entrada, esos tickets quedarían bloqueados el día que se publique. Es el supuesto S-3 del cambio `tipo-servicio-ticket-sin-ov` (propuesta §6, Q5): aplicado y reversible, **no decidido**.
**Dueño:** Gerencia, con Servicio Técnico. **Qué desbloquea:** PUBLICAR la guarda. No bloquea construirla.
**Estado:** abierta · **Destino:** condición previa del paquete de despliegue que incluya F1B-03; si la respuesta es que no alcanza, es una excepción por clasificación en la guarda y va en un cambio con `tanda: F1B-03`.

## E-159 · 2026-10-03 · hallazgo · **ABIERTA** — la decisión de la guarda de remisión no está en `openspec/config.yaml`
**Qué:** la decisión que sostiene la guarda de F1B-03 —«`Habilitar Servicio` sin remisión: nunca», `docs/sdd/Decisiones_Gerencia_2026-09-10.md:353-377`, que la R01.1 nombra `decision/habilitar-servicio-sin-remision`— **no existe como `clave:` en `openspec/config.yaml`** (el 2026-10-03, `grep -n 'clave: "decision/habilitar' openspec/config.yaml` da 0; el fichero sólo la MENCIONA tres veces, en PF-2 y en `decision/anexo-43-en-sitio`, como si estuviera registrada). Lo mismo le pasa a `decision/p21-ingreso-sin-ov`, que ni siquiera se menciona. Una decisión que no está en `decisiones_de_gerencia` no la carga la sesión (R-3, «la bandeja no es fuente»): hoy la guarda se apoya en el documento de decisiones del 10/09 y en el maestro, leídos directamente.
**Dueño:** la sesión de supervisión. **Qué desbloquea:** que la decisión se cargue en cada sesión. **No la registra la sesión de construcción**, para no escribir como `respuesta_textual` un texto que no sea el literal.
**Estado:** abierta · **Destino:** `openspec/config.yaml` → `decisiones_de_gerencia`, con su respuesta textual tomada del documento del 10/09.
