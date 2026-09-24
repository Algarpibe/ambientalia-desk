# Desk 2.0 · Estado del as-built — 09/09/2026

**Repositorio:** `C:\dev\Desk_2_R1.023` · **HEAD:** `3aaa0f1` (09/09 12:52) · **Base de la auditoría F0-00:** `a3a8f03` (21/08)
**Ventana analizada:** 41 commits en dos días (32 el 08/09, 8 el 09/09, más el baseline del 07/09) · **Contraste:** plan R01.1 y respuestas R03
**Método:** todo lo afirmado aquí está leído del repositorio hoy; lo que no se pudo verificar lleva la palabra *hipótesis*

---

## 1 · Resumen en cinco líneas

La **Fase 0 está ejecutada entera** —las cinco tandas F0-00 a F0-04— en dos días y medio, contra una semana y media prevista. El repositorio pasó de no tener `CLAUDE.md` ni specs a tener siete specs as-built, un `openspec/config.yaml` de 31 KB, el documento maestro y el acta del 03/09 citables en `.md`, y una red de pruebas que creció de 96 a 110 ficheros con siete invariantes del grafo, un registro declarado de los 21 estados, la matriz completa área × transición y la tabla de reentrancia. **F1A-01 (C1) está en curso en el árbol de trabajo, sin commitear.** Nada de la Fase 1 con gate ha arrancado, como debía ser: los gates siguen esperando al viernes 11/09. Hay tres cosas que atender antes de seguir: un árbol con 161 ficheros tocados sólo por fin de línea, los registros de estado de las tandas que van por detrás del código, y un maestro que acumula 17 correcciones documentadas y sin aplicar.

---

## 2 · Tanda por tanda: plan frente a hecho

| Tanda | Plan R01.1 | Hecho (evidencia en el repo) | Estado |
|---|---|---|---|
| **F0-00** Auditoría | S37, sin código | `docs/sdd/F0-00_Baseline_as-built.md` (622 líneas, commit `0e8f581`); siete frentes, seis CONSERVAR y uno REFACTORIZAR | **Cerrada** |
| **F0-01** Init SDD | S37 | `3d44e1e`: `CLAUDE.md` (8,8 KB: mapa, tres reglas, topología de dos esquemas, exclusión de pruebas de UI como decisión, incumplimientos vivos, contexto SDD); `openspec/config.yaml`; `docs/Manifesto/…R08.1.md` exportado; `docs/` versionado (`a5da6b8`) | **Cerrada** |
| **F0-02** Specs as-built | S38, tamaño L | Siete specs en `openspec/specs/`: `transitions-st`, `tickets-core`, `permissions`, `trazas`, `remisiones`, `derivacion-avisos`, `zoho-sync` (`38bd062` → `749d205`). Cinco correcciones al maestro salidas de aquí (`34f1b88`) | **Cerrada** (las cuatro capacidades sin código —equipo nuevo, soporte remoto, checklist, informes— no tienen spec, por diseño) |
| **F0-03** Engram | S37 | `proposal.md`, `decisiones-para-carga.md`, `git-sync-recomendacion.md`; acta del 03/09 exportada desde Notion (`da084e9`); Anexo C.10 corregido (`f51846f`); carga en Engram y convención de `topic_key` (`3aaa0f1`) | **Cerrada** |
| **F0-04** Base técnica | S38 | 20 commits de pruebas y CI: `app.test.ts` partido en siete dominios; registro de 21 estados con prueba de coherencia (`8ee48b0`); tabla de reentrancia (`719a9d8`); siete invariantes (`bd74bb0`); matriz área × transición contra el servidor (`b9707a0`); las 34 transiciones ejecutadas (`b5deda0`); dos vías de C1 en rojo (`3d7be3f`); guardián anti-drift de `schema.sql` (`ba2b6fe`); «una OV, un ticket» en sus tres puertas (`c62fb42`); trinquete de lint en 158 (`12267f5`); cobertura v8 con umbrales (`edbce13`) | **Ejecutada** — pero su `proposal.md` sigue diciendo «pendiente de visto bueno» (§5.2) |
| **F1A-01** C1 | S38 | En el árbol de trabajo, sin commit: `transitionExec.ts` mueve el chequeo de obligatorio antes de la rama del checkbox **y** cambia la condición a `asBool(raw) !== true` —dos piezas, no una línea, porque `empty` no captura `false`—; `transitionExec.test.ts` +29 y `transicionesEjecucion.test.ts` reescrito | **En curso** |
| F1A-02 · F1A-03 · F1A-05 | S38 | Sin proposal ni rama | Pendientes, **sin gate** |
| F1A-04 (C9) | S38 | Movida a F1C por la R03 (reentrancia) | Reubicada |
| F1B en adelante | S39+ | Nada, correctamente: todas tienen gate del 11/09 | Esperando decisiones |

---

## 3 · Lo que la Fase 0 dejó construido

### 3.1 Red de pruebas y CI

| Antes (a3a8f03) | Ahora (3aaa0f1) |
|---|---|
| 96 ficheros de prueba; `app.test.ts` de 3.010 líneas concentraba el 90 % del tiempo | **110 ficheros**; `app.test.ts` partido en `admin`, `catalogo`, `equipos`, `tickets`, `transiciones`, `remisiones` y un arnés compartido |
| 22 de las 34 transiciones sin ninguna prueba | Las 34 ejecutadas por HTTP; matriz **34 × 3 áreas** contra el servidor (`permisos.test.ts`) |
| Ningún registro de estados; los 21 se derivaban de strings | `estados.ts` declarado + prueba de que el conjunto derivado es igual al declarado; los cuatro `sin_salida` de M1.3.4 declarados |
| Ningún invariante del grafo | **Siete invariantes** (`invariantesGrafo.test.ts`): 34/21, ids únicos, `Finalizado` único terminal, from/to declarados, ocho compartidas, dos pasos sin botón fuera de `TRANSITIONS`, **diez campos de fecha reentrantes** fijados |
| C1 sin prueba | Dos vías de C1 en rojo (ahora en verde con el arreglo del árbol) |
| Lint sin techo; sin proveedor de cobertura | `--max-warnings 158`; `@vitest/coverage-v8` con umbrales **92 / 92 / 96 / 78** (líneas / sentencias / funciones / ramas) sobre `shared`, `server` y `src/lib`; `.tsx` excluido por decisión escrita |
| Guardián anti-drift `DESK_TABLES` ↔ `schema.sql` que `debt.md` daba por existente | Existe (`migrate.test.ts`), por identidad calificada |

### 3.2 Documentación operativa

`CLAUDE.md` con tres reglas (13 —dominio en `.ts`—, método —verificado o hipótesis—, secretos), la topología de dos esquemas, la exclusión de pruebas de interfaz como decisión, cinco incumplimientos vivos con destino, y una advertencia explícita de que el propio fichero puede estar caduco. `openspec/config.yaml` (31 KB) con `strict_tdd: true`, preflight de sesión, capacidades, `incumplimientos_vivos`, `premisas_falsas_corregidas`, `unidad_de_avance`, `memoria_engram` y `rules`. Siete specs as-built. El maestro R08.1 y el acta del 03/09 en `.md` citables por línea.

### 3.3 Hallazgos nuevos que la Fase 0 sacó a la luz

| Hallazgo | Dónde | Destino asignado |
|---|---|---|
| **IV-6:** 23 sentencias `ALTER TABLE` sin calificar el esquema en `schema.sql`; el guardián sólo ancla en `CREATE TABLE`. Trece tocan cinco tablas de `public`; basta una homónima en `desk` para que cambien de destino en silencio | `CLAUDE.md` §Incumplimientos | F1B-01, **antes de que F1D añada tablas** |
| «Una OV, un ticket» tiene **tres** puertas y sólo dos la comprueban: `remision.ts:189-197` escribe `salesorder_id` sin pasar por `ticketConOrdenVenta` | ídem | F1A |
| `boardView.ts:35` acierta **2 de los 8** estados `en_espera` (cuantificado en F0-02); es defecto por defecto, no por exceso | ídem | F1A, consumiendo `ESTADOS_EN_ESPERA` |
| IV-3 (espejo cliente de `canExecuteTransition`) **cerrado**: la matriz del servidor lo convierte en comodidad legítima bajo la regla 13 | ídem | — |
| **D-nuevo 4:** el histórico que C1 deja sucio —tickets que pasaron «Liberación sin factura» con la casilla sin marcar— y que el arreglo no repara | `F0-01_Correcciones_para_el_maestro.md` | Anexo D del maestro |
| Diez campos de fecha reentrantes, fijados como invariante 6; la tabla completa cruzada con G.6 vive en `reentrancia.test.ts` | `packages/shared/src/reentrancia.ts` | Entrada de F1C-02, F1C-06 y spec `kpis` |

---

## 4 · Contraste con el calendario

| Elemento | Previsto | Real | Lectura |
|---|---|---|---|
| Fase 0 completa | S37–S38 (hasta el 18/09) | 07–09/09 | **Una semana de adelanto** |
| F1A-01 | S38 | Arrancada el 09/09 | En plazo, adelantada |
| Gates del 11/09 | Sesión del viernes | Sin cambios | La velocidad de código ya supera a la de decisiones: **el cuello de botella es el viernes**, como el plan preveía |

Lo que se puede hacer **sin ninguna decisión** de aquí al viernes: cerrar F1A-01 (commit limpio, ver §5.1), F1A-02 (C11), F1A-03 (C12), la lista `ESTADOS_EN_ESPERA` en `boardView` y la tercera puerta de «una OV, un ticket» (los dos como tandas pequeñas de F1A), y `audit-F1A`. Después de eso, todo tiene gate.

---

## 5 · Tres cosas que atender antes de seguir

### 5.1 El árbol de trabajo: 161 ficheros tocados sólo por fin de línea

`git status` muestra 164 ficheros modificados; con `--ignore-all-space` quedan **tres** con cambios reales (los de F1A-01). Los otros 161 son conversión CRLF ↔ LF: 30.357 inserciones y 30.357 borrados, cifra idéntica. Existe `.gitattributes` y `core.autocrlf` no está fijado; el churn viene, como hipótesis, de que el árbol se ha tocado desde dos entornos con convención distinta (Windows y la VM desde la que se leyó el 07/09).

Si F1A-01 se commitea tal cual, el diff de C1 —que es de 17 líneas— queda enterrado bajo 60.000 líneas de ruido y el `blame` de 195 ficheros se pierde. **Antes del commit de C1:** o bien `git add -p` sólo sobre los tres ficheros reales, o bien —mejor, porque arregla la causa— un commit aparte de normalización (`git add --renormalize .` con `.gitattributes` fijando `* text=auto eol=lf`) y después el de C1 limpio. Cinco minutos; evita un historial ilegible.

### 5.2 Los registros van por detrás del código

`openspec/changes/F0-04/proposal.md` dice «Propuesta — pendiente de visto bueno» con veinte commits de F0-04 ya en `main`. `CLAUDE.md` y `config.yaml` daban IV-3 por vivo cuando F0-04 lo había cerrado, y lo dicen ellos mismos. Y ningún cambio de `openspec/changes/` se ha archivado con `sdd-archive`: los cinco de F0 siguen abiertos aunque su trabajo está hecho.

No es grave hoy; será grave en F1C, cuando haya ocho tandas escritas esperando decisión y haya que saber de un vistazo cuáles se ejecutaron. **Conviene fijar ahora qué significa «tanda cerrada»:** `sdd-verify` en verde, campo *Estado* del `proposal.md` actualizado, `mem_session_summary`, y `sdd-archive` (o, para las de F0 que escribieron specs directamente, mover la carpeta a `openspec/changes/archive/` con una nota). Una regla de cuatro pasos en `CLAUDE.md` y el problema desaparece.

### 5.3 El maestro acumula 17 correcciones sin aplicar

`F0-01_Correcciones_para_el_maestro.md` (46 KB) enumera **cuatro puntos nuevos del Anexo D** (doble escritura Sheets/Postgres · cuatro indicadores rotos por reentrancia · rotación de secretos · histórico sucio de C1) y **trece correcciones trazables** para el Anexo I, con línea del `.md` (diez → ocho compartidas; «trece» → once indicadores en tres sitios; «vía MCP» en siete líneas, con cinco usos legítimos que no se tocan; columnas 42/43 del Anexo G; M1.9.2 fila Aprobación; M1.3.8; C.10 con la sesión celebrada, en diez ubicaciones…). Todo está documentado y nada está aplicado: el maestro sigue en R08.1 y las specs ya lo contradicen en esos puntos.

La **R09 del maestro** es trabajo documental de Gerencia, no de Claude Code, y conviene emitirla justo después del viernes, con las decisiones de la sesión encima. Mientras no exista, cada spec nueva cita un documento que sabe equivocado en 17 lugares.

---

## 6 · Lo que sigue igual: los gates del 11/09

Sin cambios respecto a la R03. Para el viernes: **P21** ingreso sin OV · **P8/P54** botón de Drive · **P45** si la transición es cada N1 del catálogo o la macro-fase que los agrupa · alcance de los flujos **comercial y posible-cliente** · **Top 5** en la prioridad automática · **P52** variantes de OV frente al «una OV, un ticket» del código (gate nuevo) · **P62** capa as-built → `openspec/` (premisa de todo lo hecho en F0-02, aún sin decidir formalmente) · clasificación de **`Pendiente`** · quién lee la hoja de **Sheets** · **C2** Anulado si da tiempo.

Y las dos verificaciones de Gerencia de esta semana, que no aparecen en el repo y por tanto siguen abiertas: qué campo escribe *Aprobación* en el blueprint de Zoho Desk, y `SYNC_CONTACTS` / `SYNC_ACTIVITIES` más `pg_stat_subscription` en producción.

---

## 7 · Veredicto

El proyecto está donde el plan decía que debía estar el 18/09, con una semana de margen ganada, y con una base más sólida que la prevista: la premisa «F0-04 completa las pruebas» resultó falsa en el buen sentido —había más pruebas de las que el plan suponía— y la tanda se convirtió en exhaustividad e invariantes, que es lo que faltaba. El riesgo no está en el código: está en que la velocidad de ejecución deje atrás a los registros (§5.2) y al documento maestro (§5.3), y en que el viernes no cierre los gates. Si el 11/09 sale con decisiones escritas, F1B arranca el lunes 14/09 en plazo.
