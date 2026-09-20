---
tanda: F0-01
motivo: ""
capacidad: []
maestro: ["§4.4", "§4.7"]
cierra: si
toca_maestro: si
origen_cabecera: derivada-17/09
---

# F0-01 · Init SDD, configuración y `CLAUDE.md`

| Dato | Valor |
|---|---|
| Fase | Fase 0 — Cimientos SDD |
| Estado | **Propuesta — pendiente de visto bueno** |
| Base | commit `a3a8f03` |
| Entradas | `F0-00_Baseline_as-built.md` · `F0-00_Correcciones_desde_Maestro_R08.1.md` · `F0-00_Respuestas_Gerencia_R03.md` |
| Gate | **Ninguno.** P62 quedó cerrado el 08/09 (ver §1) |
| Talla / semana | S · S37 (plan R01.1 §5) |
| Ubicación de este fichero | Provisional. F0-01 **es** la tanda que ejecuta `sdd-init`; al fijar el almacén de artefactos se mueve con `git mv` en el mismo commit |

---

## Por qué

Desk 2.0 llega a la Fase 1 con un repositorio sano —seis frentes de siete en CONSERVAR— y sin ninguna de las tres cosas que permiten tocarlo sin romperlo: no hay contexto SDD, las reglas invariables viven en un documento que un sub-agente no lee, y el documento maestro no se puede citar por línea, que es lo que la regla de método exige.

Esta tanda no escribe código de negocio. Instala el andamiaje que hace que las siguientes puedan.

---

## 1 · P62 está cerrado: la capa as-built se conserva

Gerencia decidió el 08/09 conservarla, por dos razones: **validar el trabajo ya realizado** y **servir de comparativo contra el alcance completo para medir el avance**.

El plan R01.1 ya proponía el *dónde*, y con la decisión queda cerrado: el as-built sale del documento maestro —lo que pedía el acta del 27/08— y pasa a vivir como specs en el almacén SDD —lo que pedía la revisión posterior—; el maestro conserva sólo el **Anexo H**, apuntando a ellas.

**Consecuencia inmediata: F0-02 deja de estar bloqueada.**

### 1.1 · Unidad de medida del avance

La segunda razón exige fijar una unidad, o el porcentaje es una opinión con decimales. **Las tandas del §5 del plan, ponderadas por talla.**

Por qué esa y no las capacidades ni los módulos: una capacidad se acumula y un módulo como M1 atraviesa el proyecto entero; **ninguna de las dos se cierra nunca**. Una tanda sí. Y el §5 ya trae `Tamaño` (XS/S/M/L) y `Semana`, luego el porcentaje sale ponderado y contra calendario, no sólo contra alcance. Sus columnas `Capacidad` y `Fuente` dan además las vistas por capacidad y por módulo del maestro sin mantener nada aparte.

Tres reglas para que el número no engañe, y van escritas junto a él:

1. **El denominador se mueve.** Se registra en cada corte: «38 tandas al corte de S37, 41 al corte de S40». El crecimiento del alcance se ve, no se esconde.
2. **Se publican dos números, nunca uno:** tandas cerradas y porcentaje de esfuerzo estimado. Dos números que discrepan informan; uno solo es una afirmación.
3. **El §5 cubre Fase 0 y Fase 1.** El denominador es «hasta F1F», no «el proyecto completo». Lo que el maestro tiene como P2/P3 no tiene tandas.

**Cada spec as-built lleva escritos los IDs de tanda que la tocan**, para que el avance se derive del repositorio. Es la regla del propio Anexo H —*«el as-built no se recuerda: se verifica»*— aplicada al seguimiento y no sólo al contenido. Es la vacuna contra que H.4 vuelva a decir «vía MCP» dentro de tres revisiones.

---

## 2 · Exportar el maestro a `.md` — **primera tarea, no una de varias**

Sin el `.md` nadie puede citar líneas, y sin líneas la regla de método no se puede cumplir. Va primero.

**No hay `pandoc` en la máquina.** La conversión usada en F0-00 se hizo con un script propio **fuera del repositorio** y no es entregable. Se decide aquí entre: instalar `pandoc`, adoptar como herramienta versionada el extractor que ya funciona (`unzip -p … word/document.xml` + limpieza, verificado sobre la R08.1: 4.935 líneas), o retirar el entregable.

**Recomendación:** adoptar el extractor. Es una veintena de líneas, no añade dependencia de sistema, y ya está probado contra el fichero real.

---

## 3 · Las tres reglas nuevas, en `CLAUDE.md` y en §4.4 del maestro

Van en `CLAUDE.md` y no sólo en el maestro **porque un sub-agente lee `CLAUDE.md` y no lee el maestro**. El riesgo está registrado en el propio plan.

### Regla invariable 13 — dónde vive la lógica de dominio

> 1. Si una regla existe en `packages/shared`, el cliente la **consume**; nunca la reescribe.
> 2. Si una decisión **no tiene contrapartida en el servidor**, el cliente no es un espejo: es la guarda. Y una guarda en el cliente no es una guarda.
> 3. Un espejo sólo es legítimo cuando la imposición del servidor **está probada**.

### Regla de método — verificado o hipótesis

> Toda afirmación sobre el comportamiento del código lleva **ruta y línea**; toda afirmación sobre el maestro lleva **apartado y línea del `.md`**; lo demás lleva la palabra **«hipótesis»** delante.
> **Una cita de segunda mano es una hipótesis, aunque venga de un documento propio.**

La segunda frase no es retórica: cuatro afirmaciones de las respuestas R01/R02 salieron falsas por citar el maestro desde el baseline en vez de desde el maestro.

### Regla de secretos

> Un secreto no entra nunca en un chat, una captura o un prompt. Si aparece en uno, **está quemado**: se rota, no se reutiliza. Los valores viven sólo en el gestor de secretos del despliegue.
> Un interruptor que enciende un escritor **nace cerrado** (`=== 'true'`), y va en `.env.example` y `DEPLOY.md` con dos frases: qué enciende y qué se rompe si se pone mal. Un flag no documentado se trata como defecto, no como configuración.

Las quince credenciales de la lista se filtraron por ese canal (`debt.md:31`, `:840`). Rotarlas y seguir pegándolas en chats es teatro.

---

## 4 · Inicializar el contexto SDD

`sdd-init` sobre el monorepo; fijar el almacén de artefactos. Declarar las **quince** capacidades:

`tickets-core` · `transitions-st` · `transitions-equipo-nuevo` · `transitions-soporte-remoto` · `remisiones` · `permissions` · `zoho-sync` · `derivacion-avisos` · `trazas` · `hojas-vida` · **`catalogo-equipos`** · `diagnostico-checklist` · `informes` · `inventario-lectura` · `kpis`

**`catalogo-equipos` (nueva).** Tipo, marca, modelo, ficha técnica, artículos por modelo, mano de obra por modelo. `hojas-vida` conserva el ejemplar concreto. La consumen hoy tres capacidades —`hojas-vida` (`equipos.ts`, `fichaModelo.ts`), `remisiones` (`checklistRemision.ts`), `inventario-lectura` (`catalogoArticulos.ts`)— y una cuarta con F1D, porque el árbol de inspección enlaza cada ítem con un SKU de Books vía `catalogo_articulos`.

**Colisión de nombres a resolver aquí.** §2.3 llama «Catálogo (fase → macro → subnivel → ítem)» a lo de `diagnostico-checklist`. Pasa a llamarse **«árbol de inspección (N1 macro → N2 subnivel → N3 ítem)»**, que es la nomenclatura de las fuentes reales en `docs/inspecciones/`. Y son **tres niveles bajo una fase**, no cuatro: la fase es la etapa del flujo, no un nivel del árbol.

### 4.1 · El inventario de fuentes de F0-02 estaba incompleto

El baseline afirma que cuatro capacidades no tienen diseño y que sus specs «se escriben, no se destilan». **Es falso para las cuatro**, y la causa fue de alcance: la auditoría leyó `docs/superpowers/` y `debt.md`, y no leyó `docs/analisis-tickets/` ni `docs/inspecciones/`.

| Capacidad | Fuente que la auditoría no miró |
|---|---|
| `diagnostico-checklist` | `docs/inspecciones/` — Grimm EDM180 (8 macro / 27 subniveles / 103 ítems, criterio de falla por ítem, 84 enlaces de encadenamiento) y Horiba AP370 (332 ítems en cuatro modelos, con esquema de columnas explícito) |
| `informes` | Columna «Comentario de falla (informe al cliente)», 103 textos |
| `transitions-equipo-nuevo` · `transitions-soporte-remoto` | `docs/analisis-tickets/DF-*-030226.xlsx`, con el mismo esquema de columnas que `transitions.ts` |

**Frontera para F0-02: estructura sí, contenido no.** La spec captura la forma —esquema de campos, tres niveles de criterio de falla, N1/N2/N3, encadenamiento, captura tipada, foto por novedad, enlace ítem→SKU—. No captura los 103/332 ítems ni qué ítem es Bloqueante: eso es dato semilla y entra en F1D como migración.

Funciona porque **ST revisa contenido, no forma**, y la forma ya la fijó el maestro (M2.2/M2.3 y acta 03/09 nombran Alerta/Cobrable/Bloqueante). Además M2.1 respalda *«alimentar los checklists desde plantillas en Excel en lugar de desde una pantalla de administración»*: esos libros son el mecanismo de entrega previsto.

**Tripwire:** la spec declara su origen como propuesta y nombra las dos cosas que la invalidarían — un cuarto nivel de criterio de falla, o la retirada del encadenamiento condicional. Cualquier otro cambio de ST es dato.

---

## 5 · Registrar los incumplimientos vivos

No se corrigen aquí. Se anotan para que no se pierdan.

| Regla | Incumplimiento | Destino |
|---|---|---|
| 1 | `boardView.ts:35` clasifica esperas por regex sobre el nombre del estado y **diverge del grafo** | F1A, consumiendo el registro de estados de F0-04 |
| 1 | `valoresTransicion.ts` — regla de dominio sólo en cliente. **Se citan las dos mitades, porque una sola cuenta media historia:** `:3-17` es el JSDoc de cabecera que **declara** el incumplimiento —vale como evidencia de que está reconocido, no como implementación— y `:49-79` (`valoresConocidos`) es la **regla ejecutable**, que es lo que hay que mover a `packages/shared` | F1A o F1C, decisión de alcance |
| 13 | `TransitionPanel.tsx:56-57` — espejo de `canExecuteTransition`. **Se queda** en cuanto F0-04 pruebe la matriz área × transición; hasta entonces es un espejo sin comprobar | F0-04 lo habilita |
| — | **`remision.ts:189-197` escribe `salesorder_id` sin llamar a `ticketConOrdenVenta`** — la regla «una OV, un ticket» tiene tres puertas y sólo dos la comprueban. *Evidencia:* `ticketConOrdenVenta` sólo se llama en `ticketService.ts:45` y `:100`; el `UPDATE` de esta tercera puerta está en `remision.ts:192-196` | F1A, tras la consulta 4.1 del runbook |
| — | `TicketCard.tsx:14-23` — mapa de colores muerto, claves en mayúsculas que nunca casan | F1A, cosmético |

---

## 6 · Higiene de configuración

- `.gitignore`: añadir `.codegraph/` y `.atl/`.
- `.env.example` y `DEPLOY.md`: documentar `SYNC_CONTACTS` y `SYNC_ACTIVITIES` —hoy `true` por defecto (`config.ts:89-90`) y ausentes de ambos—, con qué encienden y qué rompen. **Fijarlos a `false` depende del bloque 1 del runbook**, no de esta tanda.
- `DEPLOY.md` no menciona `apps/hub-sync` ni la topología de dos bases. Corregirlo.
- **Versionar `docs/`.** 49 de los 187 ficheros de `docs/` no están en el repositorio: `docs/inspecciones/`, `docs/Manifesto/`, `docs/analisis-tickets/`, `docs/artefactos/`, `docs/remisiones/` y casi todo `docs/sdd/`. Además `docs/flujo/` → `docs/analisis-tickets/` es un renombrado **sin escenificar**: 18 borrados sin commitear y el directorio nuevo sin versionar.

  **La consecuencia concreta:** `git ls-files docs/analisis-tickets/` devuelve **vacío** —ni un solo fichero— y el baseline, commiteado en `0e8f581`, apoya en ese directorio la evidencia de **tres hallazgos distintos**: b.2 (los 11 indicadores sin fórmula), la fila H.4·M7 de la tabla de desvíos, y el estado de `transitions-equipo-nuevo` / `transitions-soporte-remoto`. Quien clone el repositorio no puede verificar ninguno de los tres.

---

## 7 · Registrar en el Anexo D y en el Anexo I

**Anexo D — puntos nuevos:**

- La doble escritura Sheets/Postgres, que hoy sólo vive en `debt.md:419-420`. **No es P14**: P14 pregunta si `remisiones_entrada` viene de la plataforma de hojas de vida, lo decide Desarrollo, y la auditoría respondió que no. Cerrado.
- Los cuatro indicadores rotos por reentrancia que no están en el alcance de C4 ni de C9: columnas **47, 50/53, 57 y 58** del Anexo G.
- Rotación de secretos: dueño Alfonso. La parte barata es de esta semana (runbook §2.2); la coordinada, de F0-04.

**Anexo I — correcciones trazables, todas procedentes de F0-00:**

| Corrección | Dónde |
|---|---|
| M1.9.1: diez → **ocho** transiciones compartidas | Maestro |
| H.4 fila M7: «trece indicadores» → **once** (G.6 tiene once) | Anexo H |
| H.4 fila M11: «vía MCP» → cliente REST propio con OAuth2 | Anexo H |
| c.7 del baseline: las suscritas son `desk.activities`, `books.contacts`, `books.sales_orders`, `books.items` — **no hay un `contacts` del lado desk** | Baseline |
| §3.e.3 y §8 del baseline: `vitest.config.ts:14,16-19` → **`:16`** (environment) y **`:17-20`** (include) | Baseline |
| G.5 col. 42: `habilitar_servicio` **no** escribe `Fecha Orden de Compra` (`transitions.ts:179-180`, divergencia documentada y razonada); col. 43 incompleta —también la escribe `aprobacion_y_repuestos` | Anexo G |
| §6.5 y §8 del baseline: las cuatro capacidades «sin diseño» sí tienen fuentes (§4.1) | Baseline |

---

## 8 · Tareas

- [ ] Exportar el maestro a `.md` y versionar el extractor **(primero)**
- [ ] `sdd-init`; almacén de artefactos; `git mv` de este proposal
- [ ] Declarar las 15 capacidades, con la dependencia `diagnostico-checklist → catalogo-equipos`
- [ ] Renombrar en §2.3 el «Catálogo» del checklist a «árbol de inspección (N1 → N2 → N3)»
- [ ] Marcar el inventario de fuentes corregido y la frontera estructura/contenido
- [ ] Las tres reglas en `CLAUDE.md` y en §4.4
- [ ] Registrar los cinco incumplimientos vivos
- [ ] Fijar la unidad de avance (tandas §5 ponderadas) y las tres reglas de lectura del porcentaje
- [ ] `.gitignore`, `.env.example`, `DEPLOY.md`
- [ ] Decidir y ejecutar el versionado de `docs/`
- [ ] Anexo D: tres puntos nuevos · Anexo I: siete correcciones

---

## 9 · Criterio de hecho

1. El maestro está exportado a `.md` **en el repositorio**, y el extractor versionado.
2. `sdd-init` completado; 15 capacidades declaradas con su dependencia explícita.
3. Las tres reglas están en `CLAUDE.md`, no sólo en el maestro.
4. `git status` limpio de `.codegraph/` y `.atl/`, y `docs/` con su situación resuelta.
5. Existe una cifra de avance publicada con sus dos números y su denominador fechado.
6. Las cuatro puertas siguen en verde: `typecheck`, `lint`, `test`, `build`.
7. **`.env.example` queda PENDIENTE, y lo hace el usuario a mano.** Una regla de permisos del entorno bloquea todo acceso a `.env*` —lectura y escritura, tanto para el orquestador como para los sub-agentes—, así que ninguna sesión de agente puede tocarlo. `SYNC_CONTACTS` y `SYNC_ACTIVITIES` quedan documentados en `DEPLOY.md §4.1` pero **no** en `.env.example`. **El texto está en `DEPLOY.md §4.1`, listo para copiar.** Este punto no se marca como hecho hasta que el usuario lo pegue.

## 10 · Qué NO hace

Ningún fichero de `packages/shared`, `apps/desk/server` ni `packages/zoho-sync`. Ninguna prueba nueva (eso es F0-04). Ninguna spec (eso es F0-02). Los cinco incumplimientos se **registran**, no se corrigen. La rotación coordinada de secretos es de F0-04.

## 11 · Riesgos

| Riesgo | Mitigación |
|---|---|
| Declarar 15 capacidades y que F0-02 vea que el reparto no encaja | El reparto de los 52 diseños se valida en F0-02, no aquí |
| Las reglas en `CLAUDE.md` no se aplican solas | La 13 la hace exigible F0-04 (matriz área × transición); la de secretos, el runbook; la de método es revisión humana |
| La cifra de avance se lee como promesa | Las tres reglas de §1.1 van escritas junto al número, no en un anexo |
| Versionar `docs/` mete binarios pesados en el repo | Decidir por carpeta: los `.md` y `.csv` sí; los `.docx`/`.xlsx` según tamaño, con el `.md` exportado como la fuente citable |
