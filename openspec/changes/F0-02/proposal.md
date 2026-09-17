# F0-02 · Specs as-built de siete capacidades

| Dato | Valor |
|---|---|
| Fase | Fase 0 — Cimientos SDD |
| Estado | **Propuesta — pendiente de visto bueno** |
| Base | commit `ad1875b`, rama `main`. **Las citas de línea al plan (`plan:NNN` y `…ClaudeCode_R01.1.md:NNN`) de este documento se leen contra el plan en `a5da6b8` (539 líneas), NO contra el de hoy** (caso B/C de la regla de mutación 4 de `CLAUDE.md`): el plan creció a 598 líneas el 2026-09-17 al sincronizarse con el libro R01.3, y renumerarlas volvería falsas las frases que citan texto ya corregido. |
| Apartado del maestro | **Anexo H** (`R08.1.md:4477-4512`), con su regla en H.1 (`:4485`) y la fila de servicio técnico en H.2 (`:4493-4496`) |
| Entradas | los 52 diseños de `docs/superpowers/specs/` (02/06–12/08/2026) · `docs/sdd/F0-00_Baseline_as-built.md` · `openspec/config.yaml` |
| Depende de | F0-00 (hecha) · F0-01 (hecha) · F0-04 (hecha: 110 ficheros / 931 pruebas, 109 en verde y 1 saltado, medido en esta tanda sobre `ad1875b`) |
| Habilita | toda la Fase 1: ninguna tanda funcional debería tocar el motor sin su spec delante |
| Talla / semana | L · S37–S38 (plan R01.1 §5) |
| Modo | Sin código. `strict_tdd` no aplica; la disciplina equivalente es el contraste con ruta y línea |

---

## Por qué

El Anexo H dice, en H.1 (`R08.1.md:4485`), la frase que gobierna esta tanda:

> «La regla es que el as-built no se recuerda: se verifica. […] durante tres revisiones el documento
> describió un flujo que no era el implementado, y nadie lo notó porque una tabla mal resumida se lee
> igual de bien que una correcta.»

El Anexo H es esa verificación, pero vive en un `.docx` que no se edita desde el repositorio. F0-02 le
pone espejo dentro: `openspec/specs/` pasa a ser la verdad, y los 52 diseños de
`docs/superpowers/specs/` quedan archivados como histórico —materia prima fechada en junio y agosto,
no autoridad.

`openspec/specs/` existe y está **vacío**. Esta tanda no añade specs a un conjunto: lo estrena. La
primera spec fija el formato de las otras seis, y por eso se escribe sola y se somete a visto bueno
antes de las demás.

---

## 1 · Alcance: siete capacidades, y sólo siete

| # | Capacidad | `covers` en `config.yaml` | `status_at_start` | Diseño de partida |
|---|---|---|---|---|
| 1 | `transitions-st` | `:87-89` | as-built completo | `2026-06-04-subsistema-b-transiciones-postgres-design.md` |
| 2 | `tickets-core` | `:83-85` | as-built parcial | `2026-06-04-subsistema-c-creacion-tickets-design.md` · `…-subsistema-a-modelo-datos-design.md` |
| 3 | `permissions` | `:110-112` | as-built por área | `2026-06-04-subsistema-h2-roles-permisos-design.md` · `…-h1-auth-usuarios-design.md` |
| 4 | `trazas` | `:122-124` | as-built parcial | `2026-06-05-historia-ticket-design.md` · `2026-08-05-historia-unificada-ticket-design.md` |
| 5 | `remisiones` | `:106-108` | as-built parcial | `2026-08-04-remision-entrada-desenlace-design.md` |
| 6 | `derivacion-avisos` | `:118-120` | as-built | `2026-08-12-avisos-por-correo-design.md` |
| 7 | `zoho-sync` | `:114-116` | as-built (cron 3 min) | `2026-06-06-zoho-hub-sp1-sync-service-design.md` · `…-sp2-replica-referencia-design.md` · `2026-06-18-paquete-lectura-hub-design.md` |

Las **otras ocho** capacidades de `config.yaml` no son de esta tanda:
`transitions-equipo-nuevo`, `transitions-soporte-remoto`, `hojas-vida`, `catalogo-equipos`,
`diagnostico-checklist`, `informes`, `inventario-lectura`, `kpis`.

### 1.1 · Por qué este orden

No es el orden de la lista del plan. Es el orden de las dependencias de referencia:

1. **`transitions-st` primera** porque es la que tiene la evidencia as-built más rica contra la que
   contrastar —34 transiciones, 21 estados, el registro de `estados.ts` y los siete invariantes que
   F0-04 dejó probados— y porque las otras seis la referencian. Se confirma la elección del encargo:
   `tickets-core` es la alternativa razonable, pero su ciclo de vida **es** el grafo de
   `transitions-st`, así que escribirla antes obligaría a adelantar el grafo dentro de ella.
2. `tickets-core`, `permissions` y `trazas` describen tres cortes del mismo acto —el ticket, quién
   puede moverlo, qué queda escrito— y las tres citan a `transitions-st`.
3. `remisiones` y `derivacion-avisos` cuelgan de la ejecución de la transición.
4. `zoho-sync` va última: es la única que no participa del acto de transicionar, y su regla dura
   —las dos entradas no se cruzan— sale ya escrita de `transitions-st`.

---

## 2 · Formato, fijado por la primera spec

Rige `config.yaml`, `rules.specs`. Lo que la primera spec añade y las seis siguientes heredan:

| Elemento | Regla |
|---|---|
| Ruta | `openspec/specs/<capacidad>/spec.md`, un directorio por capacidad |
| Cabecera | Tabla de datos: capacidad, estado, base (commit), diseño de procedencia, apartados del maestro, tandas que la tocan |
| Procedencia | Tabla explícita **diseño ↔ maestro ↔ código**, antes de los requisitos |
| Requisitos | `RQ-<CAP>-nn`, título en una línea, RFC 2119 en **MAYÚSCULAS**, evidencia `ruta:línea` en cada afirmación |
| Escenarios | Given/When/Then, sólo donde el requisito tiene un modo de fallo observable |
| Comportamiento actual | Sección aparte, cada entrada marcada **«comportamiento actual, a corregir en Cx»** con su tanda destino |
| Discrepancias | Sección aparte: **diseño↔código** y **maestro↔código**, con las dos citas enfrentadas |
| Fuera de alcance | Sección de cierre: qué NO dice esta spec y qué spec lo dice |
| Idioma | Español neutro. Identificadores, rutas, nombres de capacidad y palabras RFC 2119 en su forma original |

**La regla de método, aplicada al formato.** Ninguna afirmación de una spec cita el maestro a través
del baseline, del `config.yaml` ni de otra spec. Se cita el `.md` exportado por apartado y línea, o
lleva la palabra **hipótesis** delante. Es la regla de `CLAUDE.md`, y en F0-00 falló exactamente por
la vía de la cita de segunda mano.

---

## 3 · Qué recoge y no corrige

F0-02 **no arregla nada**. Los desvíos van a la spec como comportamiento actual, con su destino:

- Los `incumplimientos_vivos` de `config.yaml` y de la tabla de `CLAUDE.md` — **cuatro** vivos, más IV-3 cerrado por F0-04.
- Las doce correcciones C1–C12 del Anexo H.3 (`R08.1.md:4513`) que toquen la capacidad.
- Los puntos abiertos del Anexo D que la capacidad nombre.
- Los que aparezcan nuevos al destilar. Se anotan, no se corrigen, y se dice de quién son.

**Y no repite lo que el baseline dijo mal.** Las correcciones vivas están en los campos `correction:`
de las capacidades de `config.yaml` y en `premisas_falsas_corregidas`. Toda spec que toque
un punto ahí registrado lo cita desde el código, nunca desde el baseline.

---

## 4 · Criterio de hecho

1. Existen siete ficheros `openspec/specs/<capacidad>/spec.md`, uno por capacidad del §1.
2. Cada requisito lleva RFC 2119 en mayúsculas y **al menos una evidencia `ruta:línea`**; lo que no
   la tenga lleva «hipótesis» delante.
3. Cada spec cita su diseño de `docs/superpowers/specs/` **y** el apartado del maestro por línea del
   `.md` exportado.
4. Cada spec tiene sección de comportamiento actual, con cada entrada marcada «a corregir en Cx» y
   su tanda destino.
5. Cada spec tiene sección de discrepancias **diseño↔código** y **maestro↔código**, con las dos
   citas enfrentadas. Una spec sin discrepancias lo dice explícitamente, no lo deja en blanco.
6. Cada spec lleva escritos los IDs de tanda que la tocan (`config.yaml`, `unidad_de_avance.trazabilidad`).
7. Las siete usan el mismo formato del §2, y `transitions-st` es la que lo fija.
8. `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` siguen igual que antes de la
   tanda: F0-02 no toca código, así que cualquier cambio en esas cuatro cifras es un defecto de la
   tanda.

---

## 5 · Qué NO hace

- **No toca código.** Ni el motor, ni el cliente, ni las pruebas. `strict_tdd: true` sigue activo y
  aquí no hay nada que probar: lo que sustituye a la prueba es la cita con ruta y línea.
- No instala nada. No amplía `vitest.config.ts` a `*.test.tsx` (`config.yaml`, `rules.apply.guidelines`).
- No corrige C1, ni la tercera puerta de la OV, ni `boardView.ts:35`, ni ningún otro desvío vivo.
- No edita el `.docx` del maestro. Las correcciones que el maestro necesite se entregan como texto en
  `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, que es el canal que el propio `CLAUDE.md` fija.
- No escribe las specs de las ocho capacidades restantes.

---

## 6 · Riesgos

| Riesgo | Mitigación |
|---|---|
| **El maestro tiene abierto si la capa as-built se retira.** El 27/08 se acordó retirar las referencias a lo construido; la revisión posterior encargó el Anexo H. Son criterios opuestos y el propio maestro lo deja a la vista (`R08.1.md:215`, `:4099`, punto abierto nº 62) | Se nombra aquí y no se resuelve. F0-02 escribe el espejo del Anexo H en el repositorio, que es lo que el plan encarga (plan:124); si la sesión decide retirar la capa as-built del `.docx`, las specs del repositorio **son** entonces la única copia, no una duplicada |
| Los diseños son de junio y el código de septiembre: el riesgo real es escribir la spec del diseño creyendo que es la del código | El diseño no manda nunca. Cuando discrepan, manda el código y la discrepancia se **escribe**. El §2 lo hace obligatorio: sección propia, con las dos citas enfrentadas |
| Siete specs con un formato equivocado son siete reescrituras | Se escribe **una** —`transitions-st`— y se para a visto bueno antes de las otras seis |
| Una spec as-built envejece en cuanto la Fase 1 corrige lo que describe | Cada requisito que describe un defecto lleva su tanda destino escrita, así que la tanda que lo cierre sabe qué párrafo le toca reescribir |
