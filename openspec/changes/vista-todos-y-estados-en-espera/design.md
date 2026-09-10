# Diseño: la vista «Todos» deja de mentir, y las esperas dejan de adivinarse

**Tanda A · F1B-08 · base `b0bb704`.** Todas las citas verificadas de disco en esta sesión. Lo no
verificado lleva **hipótesis** delante.

---

## 1 · Enfoque técnico, en una frase

Una sola petición compuesta en `App.tsx` concatena `activos ++ cerrados.items`; `applyBoardView`
(`boardView.ts:34`) deja de filtrar en `todos`, separa `default:` y consume `ESTADOS_EN_ESPERA`; el
registro compartido gana la novena espera. **`tsc` pasa a ser el detector de las vistas**, porque es
el único que alcanza los `.tsx`.

---

## 2 · Decisiones de arquitectura

### D1 · «Todos» = activos + cerrados paginados

| | |
|---|---|
| **Elegido** | Un solo `useAsync` que devuelve `{ activos, cerrados }`; la concatenación vive en `App.tsx` |
| **Descartado** | (i) dos `useAsync` independientes; (ii) un combinador en `client.ts`; (iii) acumular en `applyBoardView` |
| **Razón** | `reload` se pasa a **tres** consumidores (`App.tsx:94`, `:142`, `:159`): dos hooks lo duplican y obligan a recordar los dos para siempre. `client.ts` es transporte —una función, un endpoint (`:19-27`)— y un combinador le metería el concepto «vista». `applyBoardView` es filtro puro con pruebas; darle acumulación le cambia la naturaleza |

**Forma del estado.** `closedPage` **se reutiliza; no se añade estado**. `App.tsx:59`
(`useEffect(() => setClosedPage(1), [view])`) ya lo reinicia al cambiar de vista, así que entrar en
«Todos» empieza en página 1 y volver también. Dos contadores necesitarían dos reinicios y podrían
discrepar sin que ninguna pantalla lo enseñe.

**Corrección a la premisa del encargo: no hay «cargar más», así que no hay acumulado que decidir.**
`Pagination.tsx:5-7` pinta «Anterior»/«Siguiente», y `App.tsx:131-132` mueve `closedPage`, que es dep
de `useAsync` (`:63`): la página **se sustituye**, no se concatena. En «Todos» el bloque de activos
se mantiene y el de cerrados se cambia entero.

**Orden: activos, luego cerrados; nunca entrelazados.** Las tres consultas comparten
`ORDER BY t.created_time DESC NULLS LAST` (`repo.ts:124`, `:139`, `:159`), pero el bloque cerrado es
una **ventana** (`repo.ts:139`, `LIMIT $2 OFFSET $3`). Entrelazar por esa clave haría que la posición
de un ticket dependiera de qué página está cargada.

**Sin separador y sin tocar el rótulo: ya está resuelto.** `Pagination.tsx:6` imprime
«Página X de Y · {total} cerrados», y ese `total` es el del servidor (`tickets.ts:110` ←
`countClosedTickets`, `repo.ts:145-148`). La condición de `App.tsx:126` pasa de `isClosed` a
«hay bloque cerrado». Cero copy nuevo.

**Coste aceptado:** pasar de página en «Todos» re-pide también los activos. Es la misma consulta que
la vista de aterrizaje ya paga en cada carga (`repo.ts:115`) y que `App.tsx:63` ya re-ejecuta al
cambiar de vista.

**Consecuencia que la propuesta no vio, y hay que decidirla.** `columns.ts:6` declara por escrito:
«'Finalizado' (cierre) NO es columna: el ticket sale del tablero al cerrarse». Con «Todos» trayendo
cerrados, `columnForStatus` (`columns.ts:44-45`) los manda a `'otros'` (`:33`), que `board.ts:26`
enseña en cuanto deja de estar vacía. Esta tanda **acepta ese destino y corrige el comentario de
`columns.ts:6`**, que si no queda falso — el molde exacto del defecto que cerramos. Si `Finalizado`
merece columna propia es decisión de producto: **§6, única pregunta abierta.** Mismo alcance:
`mode === 'cuenta-regresiva'` (`App.tsx:117`) repartirá cerrados por fecha de vencimiento.

### D2 · `default:` separado, y el detector que impide repetir el descuido

`default:` es **inalcanzable desde la interfaz** (`Sidebar.tsx:118-121` sólo llama a `onSelectView`
si `FUNCTIONAL_BY_LABEL[v]` existe; `App.tsx:57` es `useState('todos')` sin persistencia). Se llega
sólo por error de programación, así que «Vista no reconocida» es cadena de error, no copy.

| Familia | Coste | Alcance |
|---|---|---|
| **(a) `tsc` exhaustivo** sobre unión derivada de `FUNCTIONAL_VIEWS` | Estrechar `key` en `boardView.ts:6,18,21,34`, `App.tsx:57`, `Sidebar.tsx:82` | `.ts` **y `.tsx`** |
| (b) Prueba que recorre `FUNCTIONAL_VIEWS` | Un fixture con un ticket que active cada vista | sólo `.ts` |

**Elegido: (a). (b) no queda como prueba permanente, sino como ejecución de control.** Dos razones,
las dos verificables:

1. **(a) alcanza donde ninguna prueba puede.** `vitest.config.ts:16-20` incluye sólo `*.test.ts`, así
   que `App.tsx` y `Sidebar.tsx` están fuera de la red por decisión de Gerencia. `npm run typecheck`
   es el **único** detector automático que los toca. (b) no llegaría nunca.
2. **(b) falla justo cuando haría falta.** Para distinguir «atendida por un `case`» de «cayó al
   `default`» necesita un fixture no vacío por vista — `mios` sin usuario devuelve `[]` legítimamente
   (`boardView.ts:40-42`). Ese fixture hay que ampliarlo al añadir una vista: la misma omisión que
   pretende cazar, un piso más arriba.

Coste medido por `grep`, no estimado: `applyBoardView` tiene **un** consumidor (`App.tsx:70`),
`viewLabel` **uno** (`:93`), `FUNCTIONAL_BY_LABEL` **uno** (`Sidebar.tsx:118`) y `BoardViewDef`
**ninguno** fuera de `boardView.ts:3,6`.

```ts
export const FUNCTIONAL_VIEWS = [ /* … */ ] as const satisfies readonly BoardViewDef[]
export type VistaKey = typeof FUNCTIONAL_VIEWS[number]['key']

/** Si `tsc` se queja aquí, alguien añadió una vista y olvidó su `case`. */
function vistaNoReconocida(_key: never): Ticket[] { return [] }
// …
    case 'todos': return tickets
    default: return vistaNoReconocida(key)
```

`as const satisfies` tiene precedente en el repositorio: `estados.ts:97`. La única prueba que ejerce
`default:` necesita un cast (`'zzz' as VistaKey`), confinado a una línea y **ése es su objeto**.

### D3 · Punto de consumo: la LISTA, no el accesor — la propuesta se corrige

`proposal.md:111` propone `enEsperaDe` porque acepta `string` y evita el cast. Es cierto que evita el
cast y **falso que evite la reimplementación**: `enEsperaDe` devuelve la *clase*
(`estados.ts:158-162`), así que el cliente tendría que volver a escribir «externa o interna», que es
exactamente la regla que `estados.ts:111-114` ya posee. Eso es el desvío de IV-1 movido un metro.

Y la formulación alternativa es **incorrecta**, con contraejemplo de disco: `enEsperaDe(s) !== 'ninguna'`
metería `Pendiente` (`estados.ts:96`, `sin_clasificar`) en la vista, cuando `:113` lo excluye.

**Elegido:** `(ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')`. Un cast **ensancha
un tipo; no reescribe una regla**. Precedente en el repositorio: `estados.test.ts:179`.

### D4 · `Remisión creada` → `interna`, derivado paso a paso

1. Discriminador escrito (`estados.ts:46-47`): parado esperando el acto de un tercero, y el área
   dueña no puede sola.
2. Su única salida es `habilitar_servicio` (`transitions.ts:178`, `from` incluye
   `STATUS_REMISION_CREADA`), **área `Comercial`**.
3. Servicio Técnico no puede moverla → está parado esperando a un tercero. ✔
4. Ese tercero es «otra área de la casa» (`estados.ts:67`), no alguien de fuera (`:60`) → **`interna`**.
5. Precedente idéntico y razonado: `'Liberación Comercial': 'interna'` (`estados.ts:74`, motivo en
   `:72-74`). Mandato: `Decisiones:326-329`, «con área **Comercial**».

**Colocación: al final del bloque `interna`, tras `estados.ts:74`.** `ESTADOS` conserva el orden de
declaración (`:103`), así que las listas de las pruebas siguen siendo prefijos y el diff es mínimo.
`ESTADOS_EN_ESPERA` pasa a nueve **sin segunda edición**: se deriva (`:111-114`).

**No entra en `ESTADOS_SIN_SALIDA`, y eso confirma el criterio.** Su salida es un acto ejecutado en
la aplicación —alguien pulsa el botón—, que es literalmente por lo que `Liberación Comercial` queda
fuera (`estados.ts:126-130`). `estados.test.ts:176-185` pasa de «la quinta» a «las dos que sobran»
con la misma derivación, y **añade la aserción paralela** de salidas para `Remisión creada`, igual
que `:183-184` la tiene para `Liberación Comercial`. Sin esa aserción, seis sería una cifra; con
ella, es un segundo caso que distingue.

### D5 · `TicketCard`: reclavar el mapa, no retirarlo

Las ocho claves de `TicketCard.tsx:14-23` son los valores de `status` del array simulado
(`mockData.ts:11,48,60,85,97,110,122,134`), no del dominio; `:26` cae siempre en `bg-slate-100`.
**No es el import**: `mockData.ts:1-2` reexporta el `Ticket` de `@ambientalia/shared`, así que el tipo
ya es el mismo — enderezar `TicketCard.tsx:2` es **higiene declarada, no arreglo**.

**Elegido: reclavar con los nombres reales del registro y borrar el campo `label`.** Las ocho
etiquetas ya nombran estados reales, siete literales y una truncada (`:22`,
`'En Espera de Repues...'` frente a `estados.ts:61`). Retirar el mapa descartaría una decisión de
producto que alguien tomó; reclavarlo la ejecuta, **y de paso mata la truncadura**, que es el defecto
peor del fichero. El chip pasa a pintar siempre `ticket.status` verbatim, con el respaldo neutro
intacto para lo que no tenga entrada.

**Sin detector automático posible** (`vitest.config.ts:16-20,57`, decisión de Gerencia F0-00). No se
registra como carencia ni como riesgo. Criterio **manual**, cuatro comprobaciones sobre
`ambientalia-desk.ambientalia.cloud`, modo «estado», anotadas con persona y fecha:

- [ ] `En Proceso` pinta azul (`#EBF8FF` / `#3182CE`), no `bg-slate-100`.
- [ ] `Notificación cliente` pinta ámbar (`#FFF9E6` / `#D97706`).
- [ ] `En Espera de Repuestos` se lee **entero**, sin `...`.
- [ ] Un estado sin entrada (p. ej. `Finalizado`, visible ya en «Todos») conserva el chip neutro con
      su nombre completo.

Las dos últimas son las que discriminan: prueban que la truncadura se fue y que el respaldo sobrevive.

---

## 3 · Flujo de datos

```
Sidebar.tsx:118-121 ──onSelectView(VistaKey)──► App.tsx:57  view
                                                   │
                    useAsync deps [user.id, view, closedPage]   (App.tsx:63)
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        fetchActiveTickets()                  fetchClosedTickets(closedPage)
        client.ts:19  GET /api/tickets        client.ts:25  ?scope=closed&page=N
        repo.ts:115  (sin cerrados)           tickets.ts:105-111  pageSize 50
                    └──────────► { activos, cerrados } ◄──┘
                                        │
              tickets = [...activos, ...(cerrados?.items ?? [])]     App.tsx:65
                                        │
              applyBoardView(tickets, view, now, user.id)            boardView.ts:34
                                        │
              Kanban / List / Table (App.tsx:111-125)  +  Pagination (:126-134)
```

`cerrados` es `null` salvo en `todos` y `cerrados`; `activos` es `[]` en `cerrados`. Con eso **la
regla de concatenación es única para las seis vistas** y la diferencia se reduce a qué se pide.

---

## 4 · Ficheros

| Fichero | Acción | Qué cambia |
|---|---|---|
| `packages/shared/src/estados.ts` | Modificar | `Remisión creada` de `:90` al final del bloque `interna` (tras `:74`), con su derivación escrita |
| `packages/shared/src/estados.test.ts` | Modificar | `:33-41`, `:43-58`, `:84-95`, `:176-185` al nuevo reparto + aserción de salidas; se retira el tripwire falso `:101-121` |
| `packages/shared/src/columns.ts` | Modificar | Sólo `:6`: el comentario deja de afirmar que el cerrado sale del tablero |
| `apps/desk/src/lib/boardView.ts` | Modificar | `VistaKey` derivada; `:35` consume la lista; `todos` deja de filtrar; `default:` separado con guarda `never` |
| `apps/desk/src/lib/boardView.test.ts` | Modificar | Fixture `:11` corregido; tripwire real de IV-1; `todos`, `default`, y el `Closed` en espera de P2 |
| `apps/desk/src/App.tsx` | Modificar | Petición compuesta, concatenación, `VistaKey`, `Pagination` también en «Todos» |
| `apps/desk/src/components/Sidebar.tsx` | Modificar | Sólo tipos: `activeView`/`onSelectView` a `VistaKey` (`:82`) |
| `apps/desk/src/components/TicketCard.tsx` | Modificar | Mapa reclavado, `label` borrado, import a `@ambientalia/shared` (higiene) |
| `apps/desk/src/api/client.ts` | **Sin cambios** | `fetchClosedTickets` (`:25`) y `ClosedPage` (`:23`) sirven tal cual |

---

## 5 · Regla invariable 13 · casilla marcada, decisión a decisión

Verificada línea a línea de disco, no heredada de `proposal.md` §4. **Fila 7 es nueva.**

| # | Decide el cliente | Línea del servidor que lo impone | Veredicto |
|---|---|---|---|
| 1 | Qué tickets enseña cada vista (`boardView.ts:34`) | **Ninguna** — `tickets.ts:104-116` da la misma lista a todo autenticado | **Comodidad ya adjudicada.** No hay nada que guardar: `permissions/spec.md:267-271` lo declara correcto |
| 2 | Qué es «en espera» (`ESTADOS_EN_ESPERA`) | **Ninguna, y no hace falta** | **Consumo de dominio (punto 1).** Ninguna conducta del servidor depende de esta lista |
| 3 | Tamaño de página del bloque cerrado | `tickets.ts:106` (`pageSize = 50`), `:107` (clamp) | **Imposición probada**: `tickets.test.ts:84` |
| 4 | Qué es «cerrado» (`statusType === 'Closed'`, `boardView.ts:37`) | `repo.ts:139` y `repo.ts:124` | **Espejo legítimo (punto 3)**: probado en `tickets.test.ts:72`, `:87` |
| 5 | Qué devuelve una clave desconocida (`default:`) | **Ninguna** | **Presentación.** El servidor no conoce el concepto «vista» |
| 6 | El color de la tarjeta (`TicketCard.tsx:14-26`) | **Ninguna** | **Presentación pura** |
| 7 | **Pedir además `?scope=closed&page=N` en «Todos»** | `tickets.ts:105` (rama `closed`), `:107` (clamp de página) | **Imposición probada**: `tickets.test.ts:90-99` — página 99 devuelve `items: []` con `total` correcto; el cliente no puede paginarse fuera del conjunto |

**Conclusión:** siete decisiones, tres con línea de servidor probada (3, 4, 7), cuatro sin ella, y
**ninguna de las cuatro es una guarda**: no hay regla de servidor que puedan estar esquivando. Esta
tanda no crea ni una guarda en el cliente.

---

## 6 · Pregunta abierta — una

- [ ] **¿`Finalizado` merece columna propia en el modo «estado»?** Con «Todos» trayendo cerrados caen
      en `'otros'` (`columns.ts:33,44-45`). **Supuesto vigente si no hay respuesta:** se quedan en
      «Otros» y se corrige el comentario de `columns.ts:6`. Añadir la columna es mecánico —el estado
      existe (`estados.ts:85`) y la página lo acota a 50— pero es juicio de producto.

*(Q1 y Q2 de la propuesta quedan resueltas aquí: rótulo «Vista no reconocida» y sin separador. Q3 y
Q4 no son de esta fase.)*

---

## 7 · Estrategia de pruebas y orden bajo `strict_tdd`

Los rojos existentes **no se inventan**; se reescriben a la conducta nueva, que es el rojo.

| Paso | Rojo | Verde |
|---|---|---|
| **0** | **Control P2, antes de tocar nada:** quitar `statusType !== 'Closed'` de `boardView.ts:44` y correr `npm test` | Sigue **verde** → el hueco existe. Revertir |
| **1** | `estados.test.ts:33-41`, `:43-58`, `:84-95`, `:176-185` al nuevo reparto + salidas de `Remisión creada` | Mover `estados.ts:90` al final del bloque `interna` |
| **2** | `boardView.test.ts`: fixture `:11` → `'En Espera de Repuestos'`; caso `'Notificación cliente'` **en** espera; ticket `Closed` + `'Servicio externo'` **fuera** de espera | `boardView.ts:35` consume `ESTADOS_EN_ESPERA`. Después, retirar `estados.test.ts:101-121` |
| **3** | `boardView.test.ts:23` → `[]`; `:56` → `'Vista no reconocida'` | Separar `default:`, derivar `VistaKey`, guarda `never`, propagar a `App.tsx`/`Sidebar.tsx` |
| **4** | `boardView.test.ts:18` → `['a','b','c','d']` | `case 'todos': return tickets`. Luego `App.tsx` (sin detector: `.tsx`) |
| **5** | — | `TicketCard.tsx`. Control: contar ficheros y pruebas de `npm test` antes y después → **idéntico** |

**Controles de mutación obligatorios** (además de la tabla §5 de la propuesta):

- **D2:** añadir una séptima clave a `FUNCTIONAL_VIEWS` sin su `case` y correr `npm run typecheck` →
  debe **fallar**. Revertir. Sin esta ejecución, (a) es una declaración, no un detector.
- **D3:** restaurar `/espera/i` con el registro ya consumido → el tripwire nuevo **rojo** y el viejo
  (`estados.test.ts:113-121`, aún presente en ese instante) **verde**. Que discrepen es la prueba.
- **D4:** devolver `estados.ts` a `'ninguna'` → `estados.test.ts:71-75` (la suma `3+5+12+1`) sigue
  **verde**. Confirma que la suma no es el detector.

**Sin cobertura automática, declarado:** `App.tsx`, `Sidebar.tsx` y `TicketCard.tsx` son `.tsx`
(`vitest.config.ts:17-20,57`). Su única red automática es `npm run typecheck` —razón de D2— y la
verificación manual de §2·D5.

---

## 8 · Citas que se descuelgan

Verificado de disco: `permissions/spec.md:270` cita `boardView.ts:34-52` y `:274` cita
`boardView.ts:35`. **Los dos se descuelgan**: el rango crece y se desplaza, y la línea `:35` deja de
existir como regex.

| Dónde | Qué hacer |
|---|---|
| `permissions/spec.md:270` | Reanclar al nuevo rango de `applyBoardView` |
| `permissions/spec.md:273-274` | **Reescribir, no reanclar**: la frase afirma que la regex es un desvío vivo; IV-1 queda cerrado |
| `openspec/config.yaml` e `CLAUDE.md`, filas IV-1 e IV-5 | Cerrarlas en `sdd-archive`. «Un destino es una promesa» (`CLAUDE.md`) |

Precedente de reanclaje en el propio repositorio: commit `4e0b542`.

---

## 9 · Reversión, pieza a pieza

**Se revierte en orden inverso al de implementación**, porque los pasos 3 y 4 tocan las mismas líneas
de `App.tsx` y `boardView.ts`.

| Pieza | Reversión | Riesgo |
|---|---|---|
| 5 · `TicketCard` | `git revert` del fichero; vuelve el respaldo neutro | Nulo |
| 4 · «Todos» trae cerrados | Revertir `App.tsx` y el `case 'todos'` | Nulo: es lectura |
| 3 · `default:` + `VistaKey` | **Tres ficheros a la vez** (`boardView.ts`, `App.tsx`, `Sidebar.tsx`): el estrechamiento de tipo no es independiente | Único acoplamiento de la tanda |
| 2 · consumo de `ESTADOS_EN_ESPERA` | Revertir `boardView.ts:35` y su prueba | Nulo |
| 1 · `Remisión creada` → `interna` | Devolver la entrada al bloque `ninguna` y las cuatro pruebas | **Sin efecto en datos**: la clasificación es dato en código, no columna |

Ninguna pieza toca esquema, escribe hacia Zoho ni depende de `ENABLE_WRITES`. No hay migración.

---

## 10 · Matriz de amenazas

**N/A** — no hay definición de rutas, shell, subprocesos, automatización de VCS/PR, clasificación de
ficheros ejecutables ni integración de procesos. La tanda consume un endpoint `GET` ya existente
(`tickets.ts:104-116`) y no añade ninguno.

---

## 11 · Dependencias salientes

- **`sla.test.ts` NO se toca.** Su `:50-54` afirma que vista y reloj son **disjuntas**, más fuerte
  que la regla escrita (`estados.ts:26-33`), que sólo exige **independencia**. Hoy queda verde. Se
  reformula en la tanda de la alarma de 72 h de P21 (`Decisiones:331-337`), no en ésta.
- **`transitions-st`** §3.6, §3.7 y `RQ-TS-15`: los escribe `sdd-spec`, en paralelo.
- **Partición y presupuesto:** tras `sdd-tasks` (`ask-on-risk`).
