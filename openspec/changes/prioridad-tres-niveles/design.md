# Diseño — Prioridad en tres niveles y ajuste por ticket del Director Técnico

Cambio `prioridad-tres-niveles` (`tanda: F1B-07`, `cierra: no`). Base `6344b4a`. Citas comprobadas por lectura contra
el worktree el 2026-10-07. Lo que no se pudo comprobar por lectura lleva la palabra «hipótesis».

## 1 · Enfoque

Cinco piezas, tres lotes de código y documentación, cada uno verde por sí solo:

1. **Lista asignable** `High`/`Medium` en las dos fuentes (`packages/shared/src/prioridad.ts:13`,
   `packages/shared/src/transitions.ts:84`), en sitio.
2. **Nacimiento sin tocar la fórmula.** `prioridadAlNacer` (`packages/shared/src/contratos.ts:66-69`) queda igual; el
   alta deja de pasarle `b.prioridad` y le pasa una constante de `shared`.
3. **Predicado nuevo** al final de `packages/shared/src/cargos.ts`, consumido por el `POST` y por la guarda de transición.
4. **Escalera del `POST`** sin B1, con cero líneas netas en `apps/desk/server/routes/prioridad.ts`.
5. **Cliente** consumiendo `shared`, con cero líneas netas en los cuatro `.tsx`.

Sin esquema, sin relleno, sin tocar `packages/zoho-sync/src/db/repo.ts`, nada que dependa de «valoración», sin rango
propio para Top 5.

## 2 · Decisiones

| # | Decisión | Descartado | Razón |
|---|---|---|---|
| D1 | **Se confirma la propuesta del orquestador.** La fórmula no cambia. Constante `PRIORIDAD_POR_DEFECTO: PrioridadAsignable = 'Medium'`, **al final** de `packages/shared/src/prioridad.ts` (en `6344b4a` acababa en `:114`). El alta la pasa como primer argumento en `apps/desk/server/services/ticketService.ts:106` y en la llamada a `baseSiNaceBajoTop5` de `:108`, en lugar de `b.prioridad`; el import entra en `:6`. Tres líneas modificadas, cero netas | (a) Que la fórmula devuelva `Medium` por defecto: la reversión (`packages/shared/src/prioridadPropagada.ts:47`) subiría a `Medium` los `Low` y bajaría los `Urgent`. (b) Una segunda función para la reversión: dos implementaciones de la misma noción. (c) Un cuarto parámetro | Los tres llamadores leídos: el alta (`apps/desk/server/services/ticketService.ts:106`), `baseAlNacer` (`packages/shared/src/prioridadPropagada.ts:36-38`) y `cambioPorTop5` (`:47`), que pasa la BASE. Con la constante, sin contrato ni Top 5 la fórmula devuelve el respaldo, que ya es `Medium`; `b.prioridad` deja de leerse en todo el alta (sus dos únicas lecturas eran `apps/desk/server/services/ticketService.ts:106` y `apps/desk/server/services/ticketService.ts:108` en `6344b4a`). S-I se cumple por construcción: un ticket nacido bajo Top 5 tiene base `Medium` (`apps/desk/server/db/prioridadCliente.ts:130-131`) |
| D2 | El parámetro `pedida` de `prioridadAlNacer` pasa a llamarse `respaldo`, y su comentario (`packages/shared/src/contratos.ts:65`) y los de `packages/shared/src/prioridadPropagada.ts:35` y `apps/desk/server/db/prioridadCliente.ts:127-128` se corrigen en sitio | Dejar «pedida» | El nombre afirmaría algo que ya no es cierto de ningún llamador |
| D3 | Lista en sitio: `prioridad.ts:13` y `transitions.ts:84`. La paridad la vigila `packages/shared/src/prioridad.test.ts:12-19` | — | `prioridadTop5` (`prioridad.ts:34-36`) falla cerrado con un `Low` guardado: el cliente deja de imponer. `prioridadClienteDelCuerpo` (`:51`) y `ajusteDelCuerpo` (`:70`) rechazan `Low` con `422` sin tocarlos, y su mensaje pasa solo a «High, Medium» |
| D4 | Predicado `puedeAjustarPrioridadTicket(s: SujetoDePermiso): boolean` y dato `CARGOS_AJUSTE_PRIORIDAD_TICKET: readonly Cargo[] = ['Director Técnico']`, los dos **al final** de `cargos.ts` (tras `:98`). Cuerpo: `puedeFijarPrioridadTop5(s)` o el cargo efectivo está en la lista. El administrador pasa por la primera rama | Clave nueva en `EXCEPCIONES_POR_CARGO` (`packages/shared/src/cargos.ts:27-35`): desplaza dos líneas `cargos.ts:80-83`, citado desde la decisión (`openspec/config.yaml:4148`) y desde `permissions`. Reutilizar la clave `crearOVIGarantia`: es otro acto | Molde `puedeCrearOVIGarantia` (`cargos.ts:71-74`): cargo sin área (S-F). El dato sigue siendo dato y no código. `puedeFijarPrioridadTop5` queda sólo para el `PUT` (`apps/desk/server/routes/prioridad.ts:40`) y dentro del predicado nuevo |
| D5 | `cambiaPrioridadSinPermiso` (`prioridad.ts:81-86`) consume el predicado nuevo en `:85`; import en `:10`; comentario `:77-79` en sitio. `ticketService.ts:131` no se toca | Guarda nueva en el servicio | La imposición ya vive en `shared` |
| D6 | `POST`: se retiran las dos guardas `409` (`routes/prioridad.ts:68-69` en `6344b4a`) y sus tres líneas (`routes/prioridad.ts:67-69` en `6344b4a`) se **compensan en sitio** con un comentario de tres líneas que dice qué había, hasta qué revisión y qué decisión lo levantó. `:70` pasa a «B · permiso»; `:71` sigue siendo el `403`, con el predicado nuevo; `:73-74` no se mueven | Borrar las tres líneas y barrer | 121 citas completas a ese fichero en 25 ficheros; 60 apuntan a la línea 67 o posterior. Con cero líneas netas ninguna se desplaza y `:71` sigue siendo «la guarda de permiso del ajuste» |
| D7 | Ticket sin cliente: se ajusta (S-H). `resumenDelTicket` ya lo soporta (`routes/prioridad.ts:51`: sin `clientId`, fila nula; `prioridad.ts:35` devuelve `null`) y `ajustarPrioridad` sólo usa el `ticketId` (`apps/desk/server/db/prioridadCliente.ts:91-96`) | Reponer el `409` | No hay código que escribir, sólo la prueba |
| D8 | `ajustarPrioridad` no cambia: sigue con `managed_by_app = true` (`prioridadCliente.ts:93`), S-J | Migrar a `prioridad_en_app_at` | Fuera de alcance; la prueba del sincronizador caracteriza lo que hay |
| D9 | **Hallazgo y supuesto nuevo S-K (reversible).** El servidor no valida el valor de `priority` en una transición: `apps/desk/server/transitionExec.ts:88` escribe `String(raw)`. Quien pasa la guarda B puede escribir `Low` o `Urgent` con un cuerpo hecho a mano. Se cierra con `erroresPrioridadPedida(t, valores, actual): string[]`, pura, al final de `prioridad.ts`: si la transición declara el campo y la pedida no es vacía, es distinta de la actual y no es asignable, un error. Se suma al `422` agregado de `ticketService.ts:134`, en sitio | Validar en `transitionExec.ts:88`: no conoce la prioridad actual y rompería «la MISMA prioridad pasa» (`apps/desk/server/services/guardaPrioridad.test.ts:60-64`). No hacer nada: la fila 7 del §8 queda sin línea de servidor | Regla invariable 13, punto 2. Si el orquestador lo retira, la fila 7 se registra como hueco en la bandeja y L2 baja unas 25 líneas |
| D10 | `CreateTicket.tsx` con cero líneas netas: `:47` y `:231` pasan a comentario de una línea; `:426-429` pasa a un `<span>` estático de cuatro líneas («Prioridad: la asigna el sistema») que conserva la celda de la rejilla | Borrar seis líneas y barrer | El fichero tiene citas vivas por línea (`openspec/specs/tickets-core/spec.md`, `apps/desk/server/db/equipos.test.ts`, `CLAUDE.md`) y no tiene red de pruebas. Texto estático, sin lógica |
| D11 | Pruebas nuevas en bloque **al final** de cada fichero existente; las que se invierten, en sitio conservando líneas | Insertar junto a su gemela | No desplazar pruebas citadas por línea |

## 3 · Contratos

```ts
// packages/shared/src/prioridad.ts, al final
export const PRIORIDAD_POR_DEFECTO: PrioridadAsignable = 'Medium'
export function erroresPrioridadPedida(t: Pick<Transition, 'fields'>, valores: unknown, actual: string | null): string[]  // D9

// packages/shared/src/cargos.ts, al final
export const CARGOS_AJUSTE_PRIORIDAD_TICKET: readonly Cargo[] = ['Director Técnico']
export function puedeAjustarPrioridadTicket(s: SujetoDePermiso): boolean
```

Mensajes exactos:

| Dónde | Texto |
|---|---|
| `403` del `POST` (`routes/prioridad.ts:71`) | `Ajustar la prioridad de un ticket requiere el cargo Director Comercial con el área Comercial, o el cargo Director Técnico` |
| `MENSAJE_PRIORIDAD_BLOQUEADA` (`prioridad.ts:55`) | `La prioridad del ticket la ajustan el Director Comercial o el Director Técnico: tu cargo no puede cambiarla en esta etapa` |
| `403` del `PUT` (`routes/prioridad.ts:40`) | Sin cambio |
| `422` de lista (`prioridad.ts:51`, `:70`) y D9 | `La prioridad debe ser una de: High, Medium` (sale de la lista) |

Escalera del `POST`: A `404` (`routes/prioridad.ts:66`) < B `403` (`:71`) < C `422` (`:73-74`). El comentario de
`:47-49` se reescribe en sus tres líneas.

## 4 · Cambios fichero a fichero

### L1 — lista, nacimiento y borde de vigencia (~330 a 400)

| Fichero | Cambio | Netas |
|---|---|---|
| `packages/shared/src/prioridad.ts` | `:12-13` en sitio; constante al final | +3 |
| `packages/shared/src/transitions.ts` | `:84` en sitio | 0 |
| `packages/shared/src/contratos.ts` | `:65`, `:66`, `:68` en sitio (D2) | 0 |
| `prioridadPropagada.ts`, `prioridadCliente.ts` | Comentarios y nombre de parámetro en sitio (D2) | 0 |
| `apps/desk/server/services/ticketService.ts` | `:6`, `:106`, `:108` en sitio | **0** |
| Pruebas | §6 y §9 | — |

### L2 — predicado, `POST`, transición y sincronizador (~250 a 320)

| Fichero | Cambio | Netas |
|---|---|---|
| `packages/shared/src/cargos.ts` | Dato y predicado al final | ~+10 |
| `packages/shared/src/prioridad.ts` | `:10`, `:55`, `:77-79`, `:85` en sitio; `erroresPrioridadPedida` al final (D9) | ~+8 |
| `apps/desk/server/routes/prioridad.ts` | `:5`, `:47-49`, `:67-71` en sitio | **0** |
| `apps/desk/server/services/ticketService.ts` | `:6` y `:134` en sitio (D9) | **0** |
| Pruebas | §6 | — |

### L3 — cliente y cierre documental (~175 a 220)

| Fichero | Cambio | Netas |
|---|---|---|
| `apps/desk/src/components/CreateTicket.tsx` | D10 | **0** |
| `apps/desk/src/components/PanelPrioridad.tsx` | `:2` import; `:11-12` comentario; `:27` pasa a `!!user && puedeAjustarPrioridadTicket(user)` | 0 |
| `apps/desk/src/components/TransitionPanel.tsx` | `:8` import; `:160` con el predicado nuevo | 0 |
| `apps/desk/src/components/Top5Panel.tsx` | **Ninguno**: ya consume la lista (`:87`, `:123`) y el predicado del `PUT` (`:20`) | 0 |
| Documentos | §11 | — |

Verify: informe de ~300 a 360 líneas, en intento propio. Archivo, aparte, con la regla del archivo.

## 5 · Lotes y qué queda verde

Medida antes de cerrar cada intento: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo
nuevo sin trackear. Techo 800, válvula 720; una línea modificada cuenta dos. Cada estimación incluye
`apply-progress.md` (~45) y las casillas.

| Lote | Verde al cerrar |
|---|---|
| L1 | `npm test`, `typecheck`, `lint`. El `POST` conserva B1; el cliente aún envía `prioridad` en el alta y el servidor no la lee |
| L2 | Lo mismo, con la escalera nueva y las mutaciones M1 a M8 reproducidas |
| L3 | Lo mismo más `npm run build` y el detector de citas sin bloqueantes |

La estimación de L1 baja respecto de la propuesta (~450 a 600) porque la fórmula no cambia y 10 de los 16 ficheros de
prueba usan `Low` sólo como dato (§9). Si la medida de L1 pasa de 720, se parte en L1a (lista) y L1b (nacimiento).

## 6 · Pruebas (`strict_tdd`)

| Lote | Prueba | Dónde | Tipo |
|---|---|---|---|
| L1 | La lista es `High`, `Medium`; `Low` no es asignable; un Top 5 guardado con `Low` no impone; los dos cuerpos rechazan `Low` | `packages/shared/src/prioridad.test.ts` | ROJO |
| L1 | Sin contrato ni Top 5 nace `Medium` pidiendo `High`, `Low`, `Urgent` o nada; Top 5 `Medium` con contrato da `High`; Top 5 guardado con `Low` y sin contrato nace `Medium` | `apps/desk/server/services/ticketService.test.ts` | ROJO e INVERSIÓN |
| L1 | Nacer bajo Top 5 `High`: traza con `de` = `Medium`; desmarcar devuelve a `Medium` | `apps/desk/server/trazaTop5AlNacer.test.ts` | INVERSIÓN |
| L1 | **Borde, función pura:** con `hoyEnZona` de un instante y `estadoContrato`, el día del fin da `High`; el siguiente, `Medium`; un instante que en UTC ya es el día siguiente y en la zona sigue siendo el del fin (`packages/shared/src/fechasDerivadas.ts:13`) da `High`; con el fin movido, el día siguiente al fin original da `High` | `packages/shared/src/contratos.test.ts`, al final | CARACTERIZACIÓN |
| L1 | **Borde, servicio:** los mismos cuatro casos a través de `createManagedTicket`, con el reloj falso sólo de `Date` y la ampliación por la ruta real | Fichero nuevo `apps/desk/server/prioridadAlNacerVigencia.test.ts` | ROJO en «el siguiente, `Medium`» |
| L2 | Matriz del predicado: ocho cargos, «sin cargo» y administrador, con área Comercial, con Servicio Técnico y sin área. Tercer llamador en la prueba de llamadores (`packages/shared/src/cargos.test.ts:226-229`) | `cargos.test.ts`, al final | ROJO |
| L2 | `POST`: inversiones y posición (tabla siguiente); matriz de diez sujetos con tres aceptados | `apps/desk/server/prioridadTop5.test.ts` | INVERSIÓN y ROJO |
| L2 | Transición: Director Técnico cambia la prioridad en las dos transiciones; posición (tabla siguiente); `Low` pedida por quien tiene permiso es `422` (D9) | `apps/desk/server/services/guardaPrioridad.test.ts`, al final | ROJO |
| L2 | Sincronizador (abajo) | `prioridadTop5.test.ts`, al final | CARACTERIZACIÓN |

**El alta admite el reloj inyectado sólo por el reloj falso:** `hayContratoVigente` tiene `hoy` inyectable
(`apps/desk/server/db/contratos.ts:79-81`), pero `ticketService.ts:106` no se lo pasa. No se añade un parámetro al
alta. Hay precedente del camino completo bajo reloj falso: `apps/desk/server/ampliacionContratoPuertas.test.ts:40-41`
con el alta de `:75-79` y la ampliación de `:59-63`. Que el alta sin orden de venta se comporte igual bajo ese reloj es
hipótesis hasta el primer rojo.

**Pruebas de posición: cada una activa DOS guardas.**

| # | Puerta | Dos guardas activas | Esperado | Mutación que caza |
|---|---|---|---|---|
| P1 | `POST` | Ticket inexistente Y sujeto sin cargo | `404` | Subir el `403` por encima del `404`. Existe: `prioridadTop5.test.ts:304-307` |
| P2 | `POST` | Coordinador Comercial Y sin motivo, cliente Top 5 | `403` | Bajar el `403` detrás del `422`. Existe: `:292-295` |
| P3 | `POST` | Coordinador Comercial Y sin motivo, cliente **no** Top 5 | `403` | La misma, sobre el caso nuevo. Sustituye a `:282-285` en sitio |
| P4 | `POST` | Director Técnico Y sin motivo, cliente no Top 5 | `422` | Reponer B1 (daría `409`); quitar al Director Técnico (daría `403`). Sustituye a `:287-290` en sitio |
| P5 | `POST` | Ticket inexistente Y cuerpo inválido, administrador | `404` | Validar el cuerpo antes de buscar el ticket |
| T1 | Transición | Sin área Servicio Técnico Y prioridad distinta | `403` que nombra el área | Subir la guarda de prioridad por encima del área. Existe: `guardaPrioridad.test.ts:123-128` |
| T2 | Transición | Técnico con prioridad distinta Y sin «Días de entrega» | `403` de prioridad | Bajar la guarda detrás del primer `422`. Existe: `:130-135` |
| T3 | Transición | Estado que no aplica Y prioridad distinta | `409` | Subir la guarda por encima del estado. Existe: `:137-141` |
| T4 | Transición | Director Técnico **sin** Servicio Técnico Y prioridad distinta | `403` que nombra el área | Que el cargo abra la transición |
| T5 | Transición | Director Técnico con prioridad distinta Y sin «Días de entrega» | `422`, no `403` | Quitar al Director Técnico del predicado |

**Sincronizador.** Gemela de `prioridadTop5.test.ts:320-331`, con su arnés (`ticketRowFromZoho` y `upsertTicket`,
`:322`; sujeto con `:34-38`): cliente **sin** fila en `cliente_prioridad`; dos tickets sembrados con `ticketDe`,
`managed_by_app` falso comprobado; el Director Técnico (área Servicio Técnico) ajusta el primero y recibe `200`;
`upsertTicket` con otra prioridad no lo cambia; el segundo, de control, sí cambia. La sostiene
`packages/zoho-sync/src/db/repo.ts:71`, no la marca de `:76-78`.

## 7 · Mutaciones a reproducir a mano

| # | Regla | Qué se cambia | Qué cae |
|---|---|---|---|
| M1 | 1 | El `403` de `routes/prioridad.ts:71` se baja detrás de `:74` | P2 y P3 |
| M2 | 1 | En `ticketService.ts:131`, la guarda de prioridad se sube antes de `:129` | T1 y T4 |
| M3 | 1 | La misma guarda se baja detrás del `throw` de `:134` | T2 |
| M4 | — | `CARGOS_AJUSTE_PRIORIDAD_TICKET` vacío | P4, T5, la matriz y el sincronizador |
| M5 | 2 | `Low` vuelve a una sola de las dos listas | La paridad de `prioridad.test.ts:12-19` |
| M6 | — | En `ticketService.ts:106`, la constante vuelve a ser `b.prioridad` | «Nace `Medium` pida lo que pida» |
| M7 | — | En `contratos.ts:43`, `<` pasa a `<=` | Borde: el día del fin, en las dos capas |
| M8 | — | Se retira `erroresPrioridadPedida` de `ticketService.ts:134` | «`Low` pedida con permiso es `422`» |
| M9 | 2 | Datos: fila de `cliente_prioridad` con `top5` verdadero y `Low` | Sin tocar código: el alta nace `Medium` |

## 8 · Regla invariable 13, decisión a decisión (regla de mutación 3)

Los números de línea del servidor no cambian: todas sus ediciones son en sitio.

| # | Decisión del cliente | Dónde | Línea del servidor que la impone |
|---|---|---|---|
| 1 | Qué prioridades ofrece al fijar un Top 5 | `apps/desk/src/components/Top5Panel.tsx:87`, `:123` | `422`, `apps/desk/server/routes/prioridad.ts:42-43` |
| 2 | Qué prioridades ofrece al ajustar un ticket | `apps/desk/src/components/PanelPrioridad.tsx:67` | `422`, `routes/prioridad.ts:73-74` |
| 3 | A quién enseña «Ajustar» | `PanelPrioridad.tsx:27` | `403`, `routes/prioridad.ts:71` |
| 4 | A quién enseña el campo de prioridad en una transición | `apps/desk/src/components/TransitionPanel.tsx:160` | `403`, `ticketService.ts:131` |
| 5 | No ofrecer prioridad en el alta | `apps/desk/src/components/CreateTicket.tsx:426-429` | `ticketService.ts:106`: no se lee |
| 6 | A quién enseña los controles del Top 5 | `Top5Panel.tsx:20` | `403`, `routes/prioridad.ts:40` |
| 7 | Qué prioridades ofrece el campo de una transición (hipótesis: el formulario pinta las opciones de `transitions.ts:84`) | Formulario de transición | **Hoy ninguna** (`transitionExec.ts:88`). Con D9: `422`, `ticketService.ts:134` |

Ningún `.tsx` gana lógica: cambian un predicado importado y un bloque estático.

## 9 · Pruebas existentes y la retirada de `Low`

Medido con búsqueda del literal entre comillas: **204 apariciones en 20 ficheros** de `apps/` y `packages/`; **199 en
16 ficheros de prueba**.

**Cambian de significado (6 ficheros, unas 34 pruebas o filas):**

| Fichero | Qué |
|---|---|
| `packages/shared/src/prioridad.test.ts` | `:10`, `:23`, `:52`, `:112-116`, `:137`; `:153` gana «Director Técnico» |
| `packages/shared/src/prioridadPropagada.test.ts` | `:45-47` y `:51-55` asignan `Low` como Top 5: dejan de compilar (`packages/shared/tsconfig.json:1` incluye las pruebas). Pasan a `Medium` |
| `apps/desk/server/services/ticketService.test.ts` | Filas sin contrato de `:962-970`; `:977-982`; `:1127-1131`; `:1133-1140`; `:1142-1146`; `:1148-1152` (el Top 5 del cliente A pasa a `High` para que discrimine); `:1160-1164`; `:1166-1171` |
| `apps/desk/server/trazaTop5AlNacer.test.ts` | `:30-37`, `:39-45`, `:47-53`, `:55-60`, `:77-82`, `:84-88`, `:100-108` |
| `apps/desk/server/prioridadTop5.test.ts` | `:113-123` (fija `Low`: hoy sería `422`), `:247-251`; en L2: `:260-267`, `:269-273`, `:282-285`, `:287-290`, `:359-375` |
| `apps/desk/server/propagarTop5.test.ts` | `:76-82` y `:84-88` marcan con `Low` |

**Sólo usan `Low` como dato y no se editan (10 ficheros):** `guardaPrioridad.test.ts`, `misTickets.test.ts`,
`busquedaTickets.test.ts`, `listaRemisionCreada.test.ts`, `propagarTop5Atomica.test.ts`, `listaPorEntrada.test.ts`,
`repoPrioridadEnApp.test.ts`, `migrate.test.ts`, `board.test.ts` y `contratos.test.ts`.

**Verdes sin editarse, y son las que sostienen S-I:** `packages/shared/src/contratos.test.ts:75-80` y `:219-236`;
`prioridadPropagada.test.ts:48-50` y `:81-88`; `prioridadTop5.test.ts:179-194`; `propagarTop5.test.ts:99-106`,
`:108-114` y `:174-184`. Un ticket que tenía `Low` antes del Top 5 vuelve a `Low`.

## 10 · Matriz de amenazas

N/A: no hay comandos de shell, subprocesos, automatización de control de versiones ni clasificación de ejecutables.
No se añade ninguna ruta HTTP.

## 11 · Cierre documental (L3)

**Barrido (regla de mutación 4).** `git diff --numstat` con inserciones = borrados en `ticketService.ts`,
`routes/prioridad.ts`, `contratos.ts`, `transitions.ts` y los cuatro `.tsx`. `cargos.ts` y `prioridad.ts` sólo crecen
por el final. Aun sin desplazamiento, se lee qué **afirma** cada cita viva de `routes/prioridad.ts` sobre las líneas 67
a 71 y de `prioridad.ts` sobre las líneas 13, 55 y 77 a 85; las abreviadas, en segundo pase.

**Caso C en `openspec/config.yaml`, cuatro citas, ancladas a `6344b4a` con qué las cerró:** `:4143`
(`prioridad.ts:13`), `:4150` (`prioridad.ts:79`), `:4151` (`routes/prioridad.ts:71`) y `:4153`
(`routes/prioridad.ts:69`). La de `:4148` sigue siendo cierta y no se toca. Se editan en sitio, sin mover líneas.

**Texto para `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, entrada nueva al final** (molde de `:1322-1344`),
M1.9.1, sobre la R08.4:

- `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1982` — «La que fije el Director Comercial
  (Alta, Media o Baja)» → «La que fije el Director Comercial (Alta o Media)».
- `:1986-1987` — «Media o Baja» según la calificación → «Media. [DECIDIDO 06/10/2026] Sin «baja» por ahora. [ABIERTO] El
  nivel que dependa de la valoración del cliente no está definido».
- `:1990` — «Ajuste por ticket: solo en tickets de clientes Top 5 […] por el Director Comercial o un administrador» →
  «Ajuste por ticket: en cualquier ticket, con motivo obligatorio, por el Director Comercial, el Director Técnico o un
  administrador», retirando el «[ABIERTO] Quién ajusta fuera de los Top 5».
- Lo que la entrada no pide: no da por decididos S-A a S-K.

**Entradas propuestas para `docs/sdd/ENTRADA.md`, SIN número** (las asigna Supervisión): las cuatro preguntas del §14
de la propuesta, más:

- *pregunta* — Una prioridad pedida en una transición fuera de la lista se rechaza con `422` (S-K, D9). ¿Se mantiene?
- *hallazgo* — `GET /api/top5` sigue listando a un cliente Top 5 guardado con `Low`, aunque ya no imponga nada: dos
  lecturas de «es Top 5» que divergen para ese dato. Sin destino asignado.
- *hallazgo* — La columna `Low` del tablero por prioridad sigue existiendo para los tickets que ya la tienen.

**Adenda a `docs/sdd/Paquete_de_Despliegue_2026-10-08.md`, apartado nuevo al final:** qué entra (sin esquema, sin
variables, sin relleno); la consulta de sólo lectura del §8 de la propuesta, tal cual y marcada «no ejecutada»; la
condición (un Top 5 guardado con `Low` deja de imponer hasta volver a guardarlo); y las tareas de persona P-1, P-2 y P-6.

## 12 · Lo que la especificación tiene que recoger, además de la tabla de la propuesta

- `tickets-core` RQ-TC-38 (`openspec/specs/tickets-core/spec.md:1905-1908`): la base al nacer deja de ser «la pedida»
  y pasa a ser la prioridad por defecto.
- `tickets-core` RQ-TC-36, escenario de `:1811` y `:1813`: un ticket nacido bajo Top 5 vuelve a `Medium`.
- `permissions` RQ-PM-21 (`openspec/specs/permissions/spec.md:495-498`): el predicado nuevo es la segunda primitiva sin
  área. Queda fuera del barrido «el cargo sólo restringe» (`packages/shared/src/cargos.test.ts:177-207`), como
  `puedeCrearOVIGarantia` (`:185`).
- `transitions-st` RQ-TS-20: escenario nuevo de D9, si se mantiene.

## 13 · Preguntas abiertas

Ninguna bloquea. S-K (D9) es el único supuesto que este diseño añade.
