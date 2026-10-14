# apply-progress — prefijo-deducido-en-el-alta (F1B-03)

## Lote 1 · `shared` (tareas 1.1 a 1.16; sin commit, lo hace el orquestador)

Partida `23d9011`. Línea base: `wc -l` `ticketCreate.ts` 49, `ticketCreate.test.ts` 89, `types.ts` 810, `CreateTicket.tsx` 455. Lint: **165 avisos, 0 errores**.
Después: `ticketCreate.ts` **52** (49 + 3 al final, ninguna línea existente se movió; la línea 6, en blanco, pasó a llevar las dos importaciones), `CreateTicket.tsx` 455 (±0).

### Rojos vistos (antes de cada verde)
- `prefijoDeducido`: 11 pruebas rojas, `TypeError: prefijoDeducido is not a function`.
- `TIPOS_SERVICIO` orden exacto de ocho: roja (Protocolo ausente).
- AAMMDD de las 20:00-05:00 bajo `TZ=UTC`: roja, `261015` en lugar de `261014`. La de las 00:30-05:00 y la de `TZ=America/Bogota` nacieron verdes con getters (esperado: no discriminan getters; la segunda discrimina `toISOString` en UTC, M-9b).
- Rojo natural de la fecha vieja: con el verde puesto, `buildCodigoServicio > arma PREFIJO_serie_modelo_AAMMDD` (`new Date(2026, 5, 4)`) dio `260603` contra `260604`. Reescrita con `new Date('2026-06-04T12:00:00-05:00')`.

### Hipótesis resueltas
- 1.10, ciclo `ticketCreate` ↔ `flujos`: **CONFIRMADA**. `ticketCreate`, `flujos` e `invariantesGrafo` (106 pruebas) cargan y pasan, con entrada por cualquiera de los dos módulos.
- `TZ` en caliente: **CONFIRMADA** (Node relee `process.env.TZ` tras cambiarlo; comprobado con `node -e`: 15 → 14). La prueba de Bogotá usa `finally`.

### Mutaciones del lote 1 (todas restauradas; `cmp` byte a byte contra el verde)
| Mutación | Prueba roja | Restaurada |
|---|---|---|
| M-1 HV | Equipo nuevo → HV, la clasificación gana, mismos predicados, alcanzables | sí |
| M-2 SR | Soporte remoto → SR, la clasificación gana, mismos predicados, alcanzables | sí |
| M-3 CG | Calibración → CG, desconocida/vacía, alcanzables | sí |
| M-4 PRO | Protocolo → PRO, desconocida/vacía, alcanzables | sí |
| M-5 MT | resto → MT, fuera de lista, desconocida, predicados, literal exacto, alcanzables | sí |
| M-6 tipo antes que clasificación | «la clasificación gana al tipo» | sí |
| M-7 predicados por `===` | «mismos predicados que el grafo» | sí |
| M-8 plegar caja del tipo | «literal exacto» | sí |
| M-9a getters locales | AAMMDD 20:00-05:00 (la de 00:30 y la de TZ Bogotá siguen verdes: no discriminan getters) | sí |
| M-9b `toISOString` (UTC) | AAMMDD 20:00-05:00 y TZ Bogotá | sí |
| M-14 sin «Protocolo» | orden de ocho; `tsc` TS2322 en `TIPO_PROTOCOLO` (`typecheck` salió 2) | sí |
| M-15 «Protocolo» tras los comodines | orden de ocho y «deja los comodines al final» | sí |

### Supuestos
- Los ficheros del árbol están en CRLF (`w/crlf`); los edité conservando CRLF para no inflar el diff.
- `ticketCreate.test.ts`: lo nuevo (AAMMDD) va al final; `describe('prefijoDeducido')` reemplaza en sitio a `defaultPrefijoFor`. `parseCodigoFromPotential` sigue (lote 3).

### Códigos de salida
`npm test` 0 (276 ficheros pasan, 4681 pruebas, 3 ficheros/11 omitidas), `npm run typecheck` 0, `npm run lint` 0 (165 avisos = línea base), `tsx apps/desk/server/citas/cli.ts` 0.

---

## Lote 2 · servidor (tareas 2.1 a 2.18; sin commit, lo hace el orquestador)

Partida `88b736a` (lote 1 ya commiteado). **`wc -l` antes → después:** `ticketService.ts` **277 → 277**, `ticketService.test.ts` **1511 → 1511** (ninguna línea citada se movió). Fichero nuevo `prefijoDeducidoAlta.test.ts`: ver la medida al final. Los ficheros del árbol están en CRLF: edité en sitio por script conservando CRLF.

### Rojos vistos (antes de cada verde, con `ticketService.ts` aún sin tocar)
- `prefijoDeducidoAlta.test.ts`: **14 de 15 rojas**. Las nueve que no mandan `prefijo` caen en `Faltan campos obligatorios: prefijo`; «el prefijo del cuerpo se ignora» recibió `CG_SN-NUEVO-1_EDM180C_261014` en lugar de `HV_`; «cliente viejo sobre Soporte remoto» recibió `MT_a_b_260101` (el código del cuerpo) en lugar de `SR_`; (b) recibió el mensaje CON «prefijo»; (c) recibió `422` en lugar de `409`. Sólo (a) nació verde. **Desvío del plan (2.4):** se esperaba que (b) y (c) nacieran verdes; nacieron rojas porque la guarda del prefijo SÍ existía en el árbol de partida (un `prefijo: 'XX'` daba 422). Es un rojo natural más fuerte que el previsto; el rojo por mutación (M-17) se hizo igual.
- `ticketService.test.ts` en sitio: **5 rojas** (los obligatorios que faltan son 422; la inversión del prefijo `'XXX'` que ahora crea; los obligatorios ganan a la OV ya usada; los obligatorios ganan al cliente inexistente; N2), todas por «prefijo» en el mensaje o por el 422 viejo.
- Verde tras tocar las cinco líneas de `ticketService.ts`: 20 ficheros, 593 pruebas (`services`, `tickets`, `remisiones`, `flujoSoporteRemoto`).

### Cambios en sitio de `ticketService.ts` (recuento ±0)
Línea 6: `prefijoDeducido` en lugar de `PREFIJOS` (sin importación huérfana; `PREFIJOS` sólo se usaba en la 87). Línea 82: `prefijoDeducido(clasificaciones, tipoServicio)`. Línea 87: comentario. Línea 101: `buildCodigoServicio` siempre. Línea 102: `buildSubject` siempre. En `ticketService.test.ts`: las cuatro aserciones sin «, prefijo» (278, 353, 367, 428), el comentario de 348, y las seis líneas 281-286 invertidas (el `'XXX'` crea con `MT_`); 252 conserva `prefijo: 'MT'`.

### Mutaciones del lote 2 (cada una restaurada; `cmp` contra el verde guardado, «cmp ok» en todas)
| Mutación | Prueba roja | Restaurada |
|---|---|---|
| M-1 HV→MT en `prefijoDeducido` | alta: `Equipo nuevo → HV_`; el prefijo del cuerpo se ignora; el código del cuerpo se ignora | sí |
| M-2 SR→MT | alta: `Soporte remoto → SR_`; cliente viejo sobre Soporte remoto | sí |
| M-3 CG→MT | alta: `Calibración → CG_` | sí |
| M-4 PRO→MT | alta: `Protocolo → PRO_S1_M1_261014` | sí |
| M-5 MT→CG | alta: `Reparación → MT_`; día de Bogotá; asunto ignorado; `XX` crea; sin prefijo crea | sí |
| M-9a `yymmdd` con getters locales | alta: día de Bogotá a las 20:00-05:00 (la de 00:30 no discrimina getters) | sí |
| M-9b `yymmdd` con `toISOString` (UTC) | alta: día de Bogotá | sí |
| M-10 la línea 82 vuelve a leer `b.prefijo` (el cuerpo gana) | prefijo del cuerpo se ignora; `XX` crea; cliente viejo crea con `SR_`; la inversión de `'XXX'` de `ticketService.test.ts` | sí |
| M-11 la línea 101 vuelve a leer `b.codigoServicio` | código del cuerpo se ignora; asunto ignorado; cliente viejo | sí |
| M-12 la línea 102 vuelve a leer `b.subject` | asunto del cuerpo se ignora | sí |
| M-13 la línea 87 vuelve a empujar «prefijo» | 13 rojas: las cinco ramas y el día, código y asunto ignorados, el 422 exacto sin «prefijo» y las cuatro de `ticketService.test.ts` (278, 353, 367 y N2) | sí |
| M-17.1 guarda de prefijo ANTES de equipo↔cliente | (a), (b), (c), `XX` crea, inversión de `'XXX'` | sí |
| M-17.2 guarda ENTRE obligatorios y cliente | (c), `XX` crea, inversión de `'XXX'`; **(b) sola seguía verde** (hallazgo, abajo); con (b2) también (b2) | sí |
| M-17.3 guarda ANTES del 409 | (c), `XX` crea, inversión de `'XXX'` | sí |
| 2.13 mutante equivalente: `prefijoDeducido` calculada al principio de `createManagedTicket` y la línea 82 la lee | **VERDE (equivalente, sigue verde)**: 18 ficheros, 497 pruebas. Lo esperado: pura, total, sin `throw` | sí |

### Regla de mutación 1 — posición (por escrito)
Hallazgo: la prueba (b) del diseño (prefijo inválido + obligatorios que faltan) no discrimina una guarda puesta entre los obligatorios y el cliente, porque el 422 de obligatorios ya se lanzó antes de llegar a ella. Lo atrapaban (c) y «`XX` crea», pero no el PAR. **Refuerzo:** prueba (b2) nueva, prefijo `XX` + cliente que no está en Books → `Cliente no encontrado`; con M-17.2 se pone roja.

| Posición probada | Guarda vecina | Prueba que activa las dos | Rojo visto |
|---|---|---|---|
| antes de equipo↔cliente | equipo↔cliente (escalón C, `ticketService.ts:61-79`) | (a) | sí, M-17.1 |
| antes de los obligatorios (misma mutación 17.1) | obligatorios (`ticketService.ts:83-88`) | (b) | sí, M-17.1 |
| entre obligatorios y cliente | cliente en Books (`ticketService.ts:89-90`) | (b2) | sí, M-17.2 |
| antes del 409 | 409 de la OV (`ticketService.ts:97-100`) | (c) | sí, M-17.3 |
| después del 409 (cualquier sitio alcanzable) | — | «`XX` crea con el deducido» | sí, en las tres |
| mover la LLAMADA pura a `prefijoDeducido` | cualquiera | ninguna | verde: equivalente (2.13) |

### Regla de mutación 3, parte servidor — decisión a decisión (líneas leídas del fichero ya editado)
| Decisión del cliente | Línea del servidor | Qué DICE esa línea (comprobado) | Prueba `.ts` |
|---|---|---|---|
| Prefijo mostrado | `ticketService.ts:82` | `const prefijo = prefijoDeducido(clasificaciones, tipoServicio)` con comentario RQ-TC-61/62: deduce, no lee `b` | `prefijoDeducidoAlta.test.ts` (cinco ramas), M-10 |
| Código mostrado | `ticketService.ts:101` | `buildCodigoServicio({ prefijo, serie, modelo, fecha: new Date() })`, sin leer `b.codigoServicio` | «el código del cuerpo se ignora», M-11 |
| Asunto mostrado | `ticketService.ts:102` | `buildSubject({ …, codigo: codigoServicio })`, sin leer `b.subject` | «el asunto del cuerpo se ignora», M-12 |
| Código y asunto no editables | `ticketService.ts:101-102` | las dos dejan de leer `b` | las dos anteriores |
| Cliente viejo con los tres campos | `ticketService.ts:82`, `:101`, `:102` | los tres se ignoran | «cliente viejo sobre Soporte remoto crea con `SR_`» (rojo en M-10 y M-11) |
| Prefijo ya no obligatorio | `ticketService.ts:87` | comentario; no empuja «prefijo» | `422` exacto sin «prefijo», M-13 |
| Lista de tipos (con «Protocolo») | **ninguna**: `ticketService.ts:85` acepta cualquier texto no vacío | `if (!tipoServicio) missing.push('tipo de servicio')` | ninguna: carencia preexistente, fuera de alcance, declarada (RQ-TC-63) |
| Lista de clasificaciones | **ninguna**: `ticketService.ts:86` | `if (!clasificaciones) missing.push('clasificaciones')` | ninguna: ídem |

Las dos últimas filas son guardas que viven sólo en el cliente; la regla 13, punto 2, se cumple declarándolas.

### Barrido de la regla de mutación 4 para `ticketService.ts` (2.17)
Ninguna línea se movió; cinco cambiaron lo que dicen. Corrí el primer comando del diseño §4 (82 resultados en 50 ficheros) y, porque ese patrón sólo caza rangos que EMPIEZAN en 82-102, un cálculo de cobertura sobre TODAS las citas `ticketService.ts:N(-M)` (1.255) para los rangos que contienen 6, 82, 87, 101 o 102: **69 citas**, 47 en `openspec/changes/archive/` y 22 fuera.
- **Archivadas (47) → B, histórico:** fechadas y ancladas por carpeta; no se tocan.
- **Propuesta, diseño y delta de este cambio (14 de las 22) → B:** describen «hoy» = `968bb53`, que declara la cabecera del diseño. No se tocan.
- **`apps/desk/server/services/ticketService.test.ts:251`** (`ticketService.ts:83-90`, «el bloque de obligatorios y el de cliente»): **A y sigue cierta** (83-88 y 89-90 siguen siendo esos bloques; la 87 es ahora comentario). Sin cambio.
- **`openspec/specs/tickets-core/spec.md:129`** (`:21-111`, rango de la función): **A y sigue cierta**.
- **`apps/desk/src/components/CreateTicket.tsx:156`** (`ticketService.ts:101-102`, «acepta el valor recibido igual que hoy»): **hoy FALSA**; la reescribe la tarea 3.4 (líneas 154-156). **Se deja para el lote 3, a propósito.**
- **Para Supervisión (ficheros que esta rama no edita):** `openspec/config.yaml:4724` (`ticketService.ts:87`, «Hoy el servidor exige el prefijo en el cuerpo»): **B**, anclar a `968bb53`. `openspec/specs/tickets-core/spec.md:165` (abreviada `:87`, «el prefijo SHALL validarse contra `PREFIJOS`»): la **cubre el delta** (RQ-TC-05 modificado, con `(Previously:)`) al archivar; `:179`, `:633` y `:646` de esa spec son `(Previously:)` ya fechados (B).
- **Ya desfasadas ANTES de este cambio y ajenas a él** (citan guardas de otra época del fichero, no las cinco líneas): `docs/sdd/F0-01_Correcciones_para_el_plan.md:255` y `openspec/specs/permissions/spec.md:663` (`:86-88`), `docs/sdd/Paquete_de_Despliegue_2026-09-10.md:72` (`:69-82`), `docs/sdd/F0-00_Baseline_as_built.md:175` (`:74-181`), `docs/runbooks/verificaciones-pendientes-F0.md:148` y `openspec/changes/F0-04/proposal.md:204` (`:99-102`). Sólo se listan.
- **Segundo pase (forma abreviada) en los ficheros que citan el módulo:** ninguna otra abreviada `:82`, `:87`, `:101` o `:102` apunta a `ticketService.ts` fuera de las ya citadas (las demás coincidencias son de otros módulos: `derivacion-avisos`, `remisiones`, `transitions-st`, Paquetes de despliegue).
- **`ticketCreate.ts`:** sin cambios en el lote 2.

### Códigos de salida (capturados con `; echo "x=$?"` pegado a cada comando)
`npm test` **x=0** (277 ficheros pasan, 3 omitidos; 4697 pruebas pasan, 11 omitidas; una sola corrida, sin el `Timeout calling "onTaskUpdate"`), `npm run typecheck` **x=0**, `npm run lint` **x=0** (165 avisos = línea base, ninguno nuevo), `node_modules/.bin/tsx apps/desk/server/citas/cli.ts` **x=0**.

### Medida (2.16)
`git diff --shortstat --no-renames 88b736a`: 4 ficheros, +105 -31 (incluye este informe y las marcas de `tasks.md`) y `prefijoDeducidoAlta.test.ts` sin trackear: 199 líneas por `wc -l`. Total del lote 2: **~335**, muy por debajo de 720 (techo 800). Binarios: ninguno.
