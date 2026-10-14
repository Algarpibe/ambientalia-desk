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

---

## Lote 3 · cliente, retiradas y maestro (tareas 3.1 a 3.11; sin commit, lo hace el orquestador) y cierre (4.1 a 4.4)

Partida `7031679` (lotes 1 y 2 commiteados). **`wc -l` antes → después:** `CreateTicket.tsx` **455 → 455**, `types.ts` **810 → 810**, `ticketCreate.ts` **52 → 52**, `ticketCreate.test.ts` **160 → 149** (borrado del bloque de `parseCodigoFromPotential` y de una línea en blanco sobrante; nadie cita ese fichero por línea fuera de los artefactos de este cambio), `F0-01_Correcciones_para_el_maestro.md` **1663 → 1708** (+45, todo al final; ninguna línea previa se movió). Los ficheros del árbol están en CRLF: edité por script conservando CRLF (comprobado: nº de CR = nº de líneas en los cinco).

### Rojos vistos
- **M-16 por construcción (DD-9), con `types.ts` ya recortado (3.3) y el cliente aún mandando los tres campos:** `npm run typecheck` salió **2**, `CreateTicket.tsx(232,9): TS2353 ... 'subject' does not exist in type 'CreateTicketPayload & CuerpoAltaManual'` (rojo natural de la retirada). Tras editar el cliente, `typecheck` **0**. Mutación explícita: devolver `prefijo,` al literal de `createTicket` (`CreateTicket.tsx:230`) dio **2**, `TS2353 ... 'prefijo' does not exist`. **Hipótesis de DD-9: CONFIRMADA** (con los campos fuera del tipo, mandarlos de nuevo es error de `tsc`). Restaurado (`cmp` contra la copia verde: ok).
- Retirada DD-7: se borró primero el bloque de pruebas de `parseCodigoFromPotential` (verde, 24 pruebas de `ticketCreate.test.ts`) y luego la función; `grep -rn "defaultPrefijoFor\|parseCodigoFromPotential" apps packages --include=*.ts --include=*.tsx` sólo nombra el comentario de `ticketCreate.ts:20`.
- Verde del lote: `npx vitest run packages/shared apps/desk/server apps/desk/src` dio 233 ficheros y 4317 pruebas en verde, 1 fichero omitido (4 pruebas).

### Cambios en sitio (recuento ±0)
`CreateTicket.tsx`: `:3` sin `PREFIJOS` ni `parseCodigoFromPotential`; `:46` `const prefijo = prefijoDeducido(clasificaciones, tipoServicio)`; `:83-84` comentarios en lugar de los dos estados `override`; `:154-156` comentario de vista previa reescrito (el anterior decía «acepta el valor recibido igual que hoy», falso desde el lote 2); `:157` y `:161-162` sin `override`; `:172-173` comentario (la oportunidad de CRM ya no fija el prefijo, S-3); `:230` y `:232` sin `prefijo`, `subject` ni `codigoServicio`; `:415` sólo `setTipoServicio`; `:423-425` `span` «Prefijo: {prefijo} · lo deduce el sistema»; `:434` y `:436` `readOnly` con `bg-slate-50`. `types.ts:322-326`: `ordenVenta`, `prioridad` y tres líneas de comentario. `ticketCreate.ts:20-24`: comentario de cinco líneas que remite a `968bb53`.

### Regla de mutación 3, parte cliente — decisión a decisión (líneas leídas de los ficheros ya editados)
| Decisión del cliente | Línea del cliente | Línea del servidor que la impone | Qué DICE esa línea (comprobado) | Prueba `.ts` y mutación vista en rojo |
|---|---|---|---|---|
| Prefijo mostrado (rellena solo) | `CreateTicket.tsx:46`, `:423-425` | `ticketService.ts:82` | `const prefijo = prefijoDeducido(clasificaciones, tipoServicio)`: deduce, no lee `b.prefijo` | `prefijoDeducidoAlta.test.ts` (cinco ramas); quitar la deducción (la línea 82 pasa a `'MT'`): **7 rojas**; M-10 del lote 2 |
| Código mostrado (rellena solo) | `CreateTicket.tsx:157-159` | `ticketService.ts:101` | `buildCodigoServicio({ prefijo, serie: equipo.serial, modelo: equipo.modelo ?? '', fecha: new Date() })`, sin `b.codigoServicio` | «el código del cuerpo se ignora»; quitar (la línea 101 pasa a un literal): **13 rojas**; M-11 |
| Asunto mostrado (rellena solo) | `CreateTicket.tsx:160-163` | `ticketService.ts:102` | `buildSubject({ ..., codigo: codigoServicio })`, sin `b.subject` | «el asunto del cuerpo se ignora»; quitar (la línea 102 pasa a un literal): **1 roja**; M-12 |
| Código y asunto no editables (bloquea) | `CreateTicket.tsx:434`, `:436` | `ticketService.ts:101-102` | las dos dejan de leer `b` | las dos anteriores |
| Ya no manda `prefijo`, `codigoServicio`, `subject` | `CreateTicket.tsx:230`, `:232`; `types.ts:324-326` | `ticketService.ts:82`, `:101`, `:102` | los tres se ignoran si llegan | «cliente viejo con los tres campos sobre `Soporte remoto` crea con `SR_`»; M-16 (`tsc`) impide volver a mandarlos |
| La oportunidad de CRM ya no fija el prefijo | `CreateTicket.tsx:172-173` | ninguna: el servidor no lee `potentialName` (`grep potentialName ticketService.ts` da 0) | — | no hay decisión del cliente que imponer; S-3 |
| Lista de tipos (con «Protocolo») | `CreateTicket.tsx:417` | **ninguna**: `ticketService.ts:85` es `if (!tipoServicio) missing.push('tipo de servicio')` | acepta cualquier texto no vacío | ninguna: carencia preexistente, fuera de alcance, **declarada** (RQ-TC-63) |
| Lista de clasificaciones | `CreateTicket.tsx:421` | **ninguna**: `ticketService.ts:86` | ídem | ninguna: ídem, **declarada** |

Las tres mutaciones de «quitar» se corrieron sobre `prefijoDeducidoAlta.test.ts` y `ticketService.test.ts` y cada una se restauró (`cmp` contra la copia verde: ok; `git diff` de `ticketService.ts` contra `7031679` vacío). Ninguna fila queda como «hipótesis»: las seis con contrapartida (o sin decisión que imponer) tienen línea y prueba; las dos sin contrapartida están declaradas.

### Corrección para el maestro (3.8)
Leí `R08.4.md:1170` y lo que dice de verdad: **no** es una fila de tabla sino la decisión **«[DECIDIDO 30/09/2026 — R08.4] Se suprimen los cinco prefijos en los tickets nuevos»**, y el asunto «sin prefijo» va en `:1171`. Anexo G col. 27 está en `:6183` (seis valores) y se repite en M1.2 `:1208`. Nueva sección **(35)** al final de `F0-01_Correcciones_para_el_maestro.md` (la numeración (24) del encargo y de P-2 ya estaba ocupada por F1B-07; la última existente era la (34), así que la nueva es la **(35)** y se corrigió P-2 en `tasks.md`). Cubre `:1170`, `:1171`, `:1144` (aviso de M1.1 que remite a la supresión), `:1208`, `:6183` y `:6149` (nombre del ticket «sin prefijo»), con texto actual, texto propuesto y lo que NO pide (segunda vía de escritura de «Ingreso a Servicio», `transitions.ts:191`). Sin menciones a reuniones.

### Barrido de la regla de mutación 4 (3.11 y 4.3)
Ninguna línea de los tres ficheros muy citados se movió (`wc -l` igual), pero cambiaron de significado las del cliente y `ticketCreate.ts:20-24`. Comandos del diseño §4 (segundo, tercero y cuarto) y segundo pase de las abreviadas en los ficheros que citan los módulos.
- **`ticketCreate.ts:7-10` / `:7-9` (getters locales):** `docs/sdd/F0-00_Baseline_as-built.md:314` es **C, reparada en la rama:** anclada a `968bb53` («cerrado por `prefijo-deducido-en-el-alta`», DD-6). `docs/sdd/ENTRADA.md:296` y `:463` (E-021) son **B/C, para Supervisión** (la rama no toca la bandeja): anclar a `968bb53` y anotar que lo cerró este cambio.
- **`CreateTicket.tsx:46` y `:423-424`, «Hoy el alta los pide»:** `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:177` es **B, reparada en la rama:** anclada a `968bb53` y con la nota de que ya no es así.
- **Sin cambio:** `CreateTicket.tsx:148-151` (`CLAUDE.md:215`, H1, ya a `607e26a`), `:141-149` y `:234-239` (`equipos.test.ts:451`, `:482`), `:117-127` (propio comentario), `:45` y `:422` (Paquetes de despliegue) y `:306` (`F0-00_Baseline_as-built.md:141`): líneas que esta rama NO tocó o citas ya históricas. `F1B-01_Serial_llave_de_entrada.md:79` (`:83-93`) ya estaba desfasada antes (B, no es de esta rama).
- **Ficheros que la rama no edita, para Supervisión:** `openspec/config.yaml:4714` (`ticketCreate.ts:46-49`, «`defaultPrefijoFor` sólo da CG o MT») es **B, anclar a `968bb53`**; `openspec/config.yaml:4724` (`ticketService.ts:87`, «Hoy el servidor exige el prefijo en el cuerpo») es **B, anclar a `968bb53`** (ya conocida); `openspec/config.yaml:4726` (`ticketCreate.ts:4`, la lista de tipos) es **A, sigue cierta**. `openspec/specs/tickets-core/spec.md:564` y `:2371` (`ticketCreate.ts:4`) son A y siguen ciertas; `:557` y `:1419` (`ticketCreate.ts:5`) son A, intactas; `:82` (`defaultPrefijoFor`, `:47-49`) y `:1463` (Anexo G col. 27, «seis», `:4337-4338`) son **C, superadas**: las cubre el delta (RQ-TC-03 modificado) al archivar. `debt.md:765-771` (M-7, M-8) es **C, cerrado por este cambio** (lo anota Supervisión).
- **Abreviadas** (`:46`, `:83-84`, `:154-157`, `:161-162`, `:172-173`, `:230`, `:232`, `:415`, `:423-425`, `:434-436`) en los ficheros que citan `CreateTicket.tsx`: las coincidencias son de otros módulos (remisión, Paquetes de despliegue) o de este cambio; ninguna abreviada apunta a estas líneas del cliente.
- Citas a `ticketCreate.test.ts` fuera de este cambio: ninguna. A `types.ts:316-329`: ninguna salvo `openspec/specs/tickets-core/spec.md:1466` (`types.ts:329-350`, `EquipoLite`, histórica B y fuera de las líneas editadas).

### Códigos de salida (capturados con `; echo "x=$?"` pegado a cada comando, uno por uno)
`npm test` **x=0** (277 ficheros pasan, 3 omitidos; 4695 pruebas pasan, 11 omitidas; una sola corrida, sin `Timeout calling "onTaskUpdate"`; 2 menos que en el lote 2 por las dos pruebas retiradas), `npm run typecheck` **x=0**, `npm run lint` **x=0** (165 avisos, 0 errores = línea base, ninguno nuevo), `npm run build` **x=0**, bundle **`index-t1QFmlpr.js`**, `node_modules/.bin/tsx apps/desk/server/citas/cli.ts` **x=0**. Medidos sobre el árbol de trabajo, con los lotes 1 y 2 ya commiteados y el lote 3 sin commit (lo hace el orquestador).

### 4.2 Sin diff
`git diff --stat 7031679` sobre `docs/sdd/ENTRADA.md`, `openspec/config.yaml`, `CLAUDE.md`, `openspec/specs/` y `packages/zoho-sync/src/db/schema.sql`: vacío. `.env.example` no figura en `git status` (su lectura está denegada por regla; el estado limpio lo prueba). Ficheros fuera del encargo literal que sí se tocaron, por el barrido: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:177` y `docs/sdd/F0-00_Baseline_as-built.md:314`, una línea cada uno, mismo recuento.

### Hipótesis resueltas (4.4)
DD-3 (ciclo `ticketCreate` ↔ `flujos`): CONFIRMADA (lote 1). DD-9 (propiedad sobrante rompe `tsc`): CONFIRMADA (arriba). `TZ` en caliente: CONFIRMADA (lote 1). Mutaciones M-1 a M-17 completas en las tablas de los lotes 1 y 2; M-16 aquí.
