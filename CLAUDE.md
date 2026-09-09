# Desk 2.0 — Ambientalia

Contexto permanente del repositorio. Lo lee Claude Code en cada sesión, **también los sub-agentes**,
que no leen el documento maestro. Lo que tenga que aplicarse siempre vive aquí, no sólo en el maestro.

Idioma: **español**, registro neutro y profesional. Documentación, `debt.md` y comentarios del código
están en español. Identificadores, rutas, claves de configuración y nombres de capacidad se quedan en
su forma original.

---

## Mapa del proyecto

Monorepo TypeScript con `npm workspaces` (`packages/*`, `apps/*`), paquete raíz `desk-ambientalia`.

| Ruta | Qué es |
|---|---|
| `apps/desk/src` | Cliente React 19 + Vite 6 + Tailwind 3.4 |
| `apps/desk/server` | API Express 5. Sirve además el `dist/` compilado, en el mismo puerto |
| `apps/hub-sync` | Worker de sincronización contra el hub Zoho (Desk, Books, CRM) |
| `packages/shared` | **Núcleo de dominio.** Transiciones, permisos, tipos. Fuente única de reglas |
| `packages/zoho-sync` | Sincronización Zoho Desk ↔ PostgreSQL, configuración y capa de acceso a datos |

### Comandos

```bash
npm test         # vitest run
npm run typecheck  # tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit
npm run lint     # eslint .
npm run build    # build del cliente
```

### El documento maestro citable

El maestro es un `.docx` y **no se edita desde el repositorio**. La copia citable por línea es:

    docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md   (4.935 líneas)

Se regenera con `scripts/docx2md.sh <entrada.docx> [salida.md]`. No hay `pandoc` en las máquinas del
equipo: el script son veinte líneas sobre `unzip` y `sed`. Cada revisión del maestro se vuelve a
exportar; el `.docx` sigue siendo el original editable.

Las correcciones que el maestro necesita **no se aplican al `.docx`**: se entregan como texto en
`docs/sdd/F0-01_Correcciones_para_el_maestro.md` para que Gerencia las pegue.

---

## Las tres reglas

### Regla invariable 13 — dónde vive la lógica de dominio

> 1. Si una regla existe en `packages/shared`, el cliente la **consume**; nunca la reescribe.
> 2. Si una decisión **no tiene contrapartida en el servidor**, el cliente no es un espejo: es la
>    guarda. Y una guarda en el cliente no es una guarda.
> 3. Un espejo sólo es legítimo cuando la imposición del servidor **está probada**.

*Por qué existe:* un espejo sin prueba en el servidor no es redundancia defensiva, es la única
comprobación que hay, y vive en el sitio donde no se puede confiar en ella. La regla obliga a decir
cuál de los dos casos es cada vez.

### Regla de método — verificado o hipótesis

> Toda afirmación sobre el comportamiento del código lleva **ruta y línea**; toda afirmación sobre el
> maestro lleva **apartado y línea del `.md`**; lo demás lleva la palabra **«hipótesis»** delante.
> **Una cita de segunda mano es una hipótesis, aunque venga de un documento propio.**

*Por qué existe:* cuatro afirmaciones de las respuestas R01/R02 salieron falsas por citar el maestro
desde el baseline en vez de desde el maestro. La segunda frase no es retórica: es exactamente el
fallo que se produjo.

### Regla de secretos

> Un secreto no entra nunca en un chat, una captura o un prompt. Si aparece en uno, **está quemado**:
> se rota, no se reutiliza. Los valores viven sólo en el gestor de secretos del despliegue.
> Un interruptor que enciende un escritor **nace cerrado** (`=== 'true'`), y va en `.env.example` y
> `DEPLOY.md` con dos frases: qué enciende y qué se rompe si se pone mal. Un flag no documentado se
> trata como defecto, no como configuración.

*Por qué existe:* quince credenciales del proyecto se filtraron por ese canal —chats y capturas—
(`debt.md:31`, `debt.md:840`). Rotarlas y seguir pegándolas en chats es teatro.

---

## Topología de dos esquemas

PostgreSQL con **dos esquemas** en la base `desk`:

| Esquema | Tablas |
|---|---|
| `desk` | `tickets`, `ticket_transitions`, `activities`, `contacts`, `accounts`, `agents`, `conversations`, `attachments`, `ticket_history`, `equipos` |
| `public` | `catalogo_*`, `remisiones*`, `avisos`, `users`, `roles`, `sessions` |

**Regla dura: toda sentencia de creación de tabla califica el esquema explícitamente**
(`CREATE TABLE ... desk.x` o `public.x`). Un `CREATE` sin calificar ya aterrizó una tabla en el
esquema equivocado en producción.

Hay además una **segunda base de datos**, `zoho-hub`, que publica cuatro tablas hacia `desk` por
replicación lógica. Ver `DEPLOY.md`.

---

## Pruebas de interfaz: excluidas por decisión, no por olvido

`vitest.config.ts:16` fija `environment: 'node'`; `vitest.config.ts:17-20` incluye sólo
`apps/**/*.test.ts` y `packages/**/*.test.ts`. Los 39 ficheros `.tsx` (6.329 líneas) de
`apps/desk/src` quedan fuera de la red de pruebas **por decisión explícita de Gerencia**
(F0-00, 2026-09-08).

**No proponer instalar `jsdom` ni `@testing-library`**, ni ampliar `vitest.config.ts` a `*.test.tsx`,
ni registrar esto como carencia o riesgo en fases posteriores, sin una decisión de Gerencia que
reabra el punto.

---

## Incumplimientos vivos — registrados, no corregidos

**Cinco** desvíos vivos. Están anotados para que no se pierdan; **corregirlos no es tarea de la tanda
que los encuentre**, salvo que su destino sea esa tanda. La lista completa, con la misma información,
está también en `openspec/config.yaml` (`incumplimientos_vivos`).

| Regla | Incumplimiento | Destino |
|---|---|---|
| 1 | `apps/desk/src/lib/boardView.ts:35` clasifica esperas por regex sobre el nombre del estado (`/espera/i`) y diverge del registro de `estados.ts`. **Cuantificado en F0-02: acierta 2 de los 8 estados `en_espera` y no tiene ningún falso positivo.** Se le escapan `Servicio externo`, `Notificación cliente`, `Notificación a Compras`, `Notificación Comercial`, `Solicitado` y `Liberación Comercial`. Es defecto **por defecto**, no por exceso: no hay que estrechar el criterio, hay que sustituirlo por `ESTADOS_EN_ESPERA` | F1A, consumiendo el registro de estados de F0-04 |
| 1 | `apps/desk/src/lib/valoresTransicion.ts` — regla de dominio sólo en cliente (declarada en el bloque de cabecera `:3-17`, implementada en `valoresConocidos`, `:49-79`) | F1A o F1C, decisión de alcance |
| — | `apps/desk/server/routes/remision.ts:189-197` escribe `salesorder_id` sin llamar a `ticketConOrdenVenta` — la regla «una OV, un ticket» tiene **tres** puertas y sólo **dos** la comprueban | F1A |
| — | `apps/desk/src/components/TicketCard.tsx:14-23` — mapa de colores muerto: claves en mayúsculas (`INGRESADO`, `PROCESO`…) que sólo casan con `mockData.ts`, nunca con los estados reales | F1A, cosmético |
| — | `packages/zoho-sync/src/db/schema.sql` — **23** sentencias `ALTER TABLE` sin calificar el esquema (28 totales − 5 calificadas, `:154-158`). El guardián de F0-04 no las ve porque su extractor ancla en `^CREATE TABLE` (`migrate.test.ts:245`). Trece tocan cinco tablas de `public` —`remisiones`, `users`, `roles`, `avisos`, `catalogo_modelos`— y basta una homónima en `desk` para que cambien de destino en silencio. **Las 10 `CREATE` sin calificar NO son desvío**: son exactamente las de `DESK_TABLES` (`migrate.ts:63-64`), deliberadas y probadas (`migrate.test.ts:266`, `:282`). El arreglo es extender el guardián a `^ALTER TABLE`, no reescribir 23 sentencias | F1B-01, antes de que F1D añada tablas |

**IV-3 está CERRADO y ya no cuenta.** Era el espejo de `canExecuteTransition` en
`apps/desk/src/components/TransitionPanel.tsx:56-58`. F0-04 lo cerró:
`apps/desk/server/permisos.test.ts:41-110` barre las 34 transiciones × 3 áreas contra el servidor, y
`:35-39` declara el efecto —el filtro del navegador pasa a ser **comodidad legítima** bajo la regla
invariable 13, porque la imposición del servidor está probada—. Se deja escrito aquí para que nadie lo
vuelva a anotar como vivo.

> **La lección de método, que vale más que las dos entradas.** Este fichero y `openspec/config.yaml`
> **pueden estar caducos**: los dos daban IV-3 por vivo cuando F0-04 llevaba días habiéndolo cerrado.
> Antes de citar cualquiera de los dos como autoridad sobre el estado del código, **compruébalo contra
> el código**. Es la regla de método aplicada a los propios registros del proyecto.

---

## Contexto SDD

- Configuración: `openspec/config.yaml` (capacidades, preflight, reglas por fase, unidad de avance).
- Propuestas: `openspec/changes/<ID>/proposal.md`.
- Baseline as-built de partida: `docs/sdd/F0-00_Baseline_as-built.md`.
- La unidad de avance son **las tandas del §5 del plan, ponderadas por talla**. Se publican siempre
  dos cifras —tandas cerradas y % de esfuerzo estimado— con el denominador fechado. Detalle en
  `openspec/config.yaml` (`unidad_de_avance`).
