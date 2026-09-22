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

## E-005 · 2026-09-17 · decision
**Qué:** IV-4 e IV-11 son un par: la tercera puerta impide el duplicado, y el sync puede dejar la fila incoherente igualmente (`orden_venta` en `TICKET_COLS`, `salesorder_id` fuera). Elegir salida (a) `managed_by_app` o (b) meter `salesorder_id` en `TICKET_COLS`.
**De dónde viene:** informe de brechas del 17/09, §2.8
**Afecta a:** dar IV-4 por cerrado en producción
**Estado:** triada
**Destino:** decisión de alcance de Gerencia; luego tanda

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
**Qué:** Punto abierto nº 61 —mecanismo de incorporación de actas— ya se cobró una pieza: el R08.3 §B.3 registra que siete gates previstos para el 11/09 no tienen decisión escrita y siguen pendientes.
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

## E-013 · 2026-09-17 · hallazgo
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
**Estado:** triada
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
**Estado:** cerrada — y abre una pregunta nueva, `titularidad-mantenedor`
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
desplazamiento. Ejemplo comprobado de disco: `openspec/specs/transitions-st/spec.md:286` cita la línea 145 de `ticketService.ts`
como la del actor; en `f367186` lo era, y en `4976787` esa línea es un comentario y el actor está en la 151.

**Por qué el detector no lo caza:** comprueba que la línea citada exista y no esté vacía, nunca que diga lo que la frase afirma
(`CLAUDE.md`, regla de mutación 4).

**Lo que F1A-07 sí hace, y nada más:** reancla como caso A las citas de `ticketService.ts` de los tres bloques que su delta
reescribe, y al archivar las vuelve a comprobar contra el árbol de ese momento.
