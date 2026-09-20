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
**Destino:** pasaje del expediente R08.x (el maestro va por detrás) + entrada en `cifras_ancladas`. **Ya NO va a la sesión del 18/09**

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
**Qué:** Punto abierto nº 61 —mecanismo de incorporación de actas— ya se cobró una pieza: el R08.3 §B.3 registra que de la sesión del 11/09 no hay evidencia de que se celebrara, y sus siete gates siguen pendientes.
**De dónde viene:** informe de brechas del 17/09, §2.7
**Afecta a:** siete gates con sesión prevista el 11/09
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

## E-015 · 2026-09-18 · regla · **RUTEADA**
**Qué:** No se mencionan reuniones, ni celebradas ni previstas. Las decisiones se toman en la conversación de Cowork y en el panel; un gate pendiente se describe por qué decide, a quién corresponde y qué desbloquea.
**De dónde viene:** Gerencia, 17/09, fijada como regla de redacción no negociable y repetida en el encargo del parte
**Afecta a:** `CLAUDE.md` y toda redacción de `docs/sdd/`, el plan y el panel
**Estado:** ruteada
**Destino:** `CLAUDE.md` § «Regla de redacción» (escrita el 18/09). Barrido aplicado el mismo día a la tabla §4.5 del plan: 26 menciones de calendario de encuentros sustituidas por estado y dueño, y la columna «Sesión prevista» pasa a «Estado · a quién corresponde». **Quedan menciones heredadas fuera de §4.5** —`plan:4`, `:5`, `:14`, `:170`, `:270`, `:599` y `docs/sdd/R08.3_Expediente_de_cambios.md:360`—, listadas en el parte del 18/09 y no barridas aquí porque están fuera del alcance de escritura de la sesión de supervisión
