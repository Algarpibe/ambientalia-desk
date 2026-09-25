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
3. **Dar entrada a `habilitar_servicio` en `DERIVACION_POR_DEFECTO` cambia un requisito vivo:** `RQ-AV-02` (`openspec/specs/derivacion-avisos/spec.md:67-70`) declara con SHALL **exactamente tres** entradas, y el recuento 34 − 3 = 31 de `:287` cuelga de ahí.

**Lo que la decisión NO desbloquea todavía:** la alarma en sí. `SLA_HORAS_POR_ESTADO` (`packages/shared/src/sla.ts:32-35`) tiene una sola entrada, `'Notificado': 24`; `Remisión creada` no está. F1B-08 sigue parcial y el numerador no se mueve.
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
**Destino:** `CLAUDE.md` § «Regla de redacción» (escrita el 18/09). Barrido aplicado el mismo día a la tabla §4.5 del plan: 26 menciones de calendario de encuentros sustituidas por estado y dueño, y la columna «Sesión prevista» pasa a «Estado · a quién corresponde». **Quedan menciones heredadas fuera de §4.5** —`plan:4`, `:5`, `:14`, `:170`, `:270`, `:599` y `docs/sdd/R08.3_Expediente_de_cambios.md:361`—, listadas en el parte del 18/09 y no barridas aquí porque están fuera del alcance de escritura de la sesión de supervisión

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
pero el historial guarda el `values` ENTERO que llega (`packages/zoho-sync/src/db/repo.ts:285`), y `periodosDeBodegaje` lee
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
eligió en la aplicación —la única bandera, `managed_by_app` (`repo.ts:58-59`), es del ticket entero, que es la salida (a)
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
**Afecta a:** el denominador y el numerador del avance · la comprobación 2 de `npm run reconcile`, que sólo mira cabeceras de `proposal.md` · la spec viva `openspec/specs/zoho-sync/spec.md:221`, modificada en el mismo lote
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

**Destino:** `openspec/config.yaml` → `decisiones_de_gerencia` (`decision/trabajo-sin-ficha`). CLAUDE.md → R-5 · docs/sdd/ENTRADA.md → E-027, cerrada · docs/sdd/R08.3_Expediente_de_cambios.md §11.2
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
**Afecta a:** `packages/shared/src/sla.ts:32-35` (hoy una sola entrada, `'Notificado': 24`, y son horas de reloj, no hábiles) · F1A-02 (cerrada) · F1B-08 (S44) · F1C-06 (S45)
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

## E-075 · 2026-09-25 · correccion · **NUEVA**
**Qué:** Errata en el registro de `decision/edicion-datos-comerciales-equipo`: su `maestro_pasaje` dice «M3.2 (registro de equipos)» (`openspec/config.yaml:2788`), y la fila del expediente repite «M3.2» (`docs/sdd/R08.3_Expediente_de_cambios.md:611`). En la R08.2, M3.2 es «Taxonomía jerárquica ISO 14224» (`Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:2054`); los seis campos del equipo están en M3.1 «Estructura de datos» (`:2021-2053`). Hipótesis: el pasaje que corresponde es M3.1 (ni M3.1 ni M3.3 hablan literalmente de editar ni de registrar cambios; M3.1 define los campos y quién los da de alta, `:2053`).
**De dónde viene:** propuesta de `edicion-comercial-equipo` (F1B-14), supuesto (c6), 2026-09-25.
**Afecta a:** fila `decision/edicion-datos-comerciales-equipo` de `docs/sdd/R08.3_Expediente_de_cambios.md` (§11.4) · campo `maestro_pasaje` de esa decisión en `openspec/config.yaml`.
**Estado:** nueva
**Destino propuesto:** pasaje del expediente R08.3, como corrección pendiente. **Dueño propuesto:** Gerencia. `openspec/config.yaml` NO se toca desde una tanda: es un campo de una decisión de Gerencia.
**Y una segunda, en la misma decisión:** su consecuencia (3) afirma que `apps/desk/server/routes/equipos.ts:73` «deja hoy editar los seis campos a cualquier usuario con sesión». Era cierto en `0807a77`; desde `edicion-comercial-equipo` ya no (tres de los seis exigen Comercial o administrador). Es un caso B de la regla de mutación 4 —hay que nombrar la revisión en la cita—, y por la misma razón tampoco se corrige desde la tanda: queda para quien mantenga el registro de la decisión.

## E-076 · 2026-09-25 · hallazgo · **NUEVA**
**Qué:** El comentario de `apps/desk/server/services/equipoNuevo.ts:63` llama «Validación C» al bloque que reutiliza `camposHojaDeVida`, pero la parte del mantenedor («Mantenedor no encontrado») es una comprobación de existencia de un identificador aportado tal cual, que la tabla canónica clasifica como escalón **A** (`openspec/specs/transitions-st/spec.md:755-767`). El `PATCH` de equipos, desde `edicion-comercial-equipo`, ya la trata como A. La misma guarda queda con dos etiquetas según la puerta.
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
