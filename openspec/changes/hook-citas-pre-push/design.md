# Diseño: el detector de citas vive en `apps/desk/server/citas/`, se impone en `pre-push` y se prueba sin romperse a sí mismo

**Cambio `hook-citas-pre-push` · base `773ad75` · preflight de `openspec/config.yaml:25-30` en `648432d`**

Un núcleo puro (cosecha, resolución, comprobación, línea base, informe) que no sabe nada de git, un
puerto `Repo` con un único adaptador que habla con git, y un CLI que el hook invoca con
`node_modules/.bin/tsx`. Las pruebas usan un repositorio en memoria para casi todas las mutaciones y
un repositorio git sintético sólo para lo que necesita git de verdad. Este documento cierra los huecos
de RQ-CV-17 con número, da el veredicto de la opción del ref local y fija el coste de RQ-CV-13.

> **Procedencia, en tres niveles.** (1) **Verificado de disco en este contexto**, sobre `773ad75`, con
> ruta y línea. (2) **Medido por el orquestador** el 2026-09-13 sobre `773ad75`, con el alcance de la
> spec, y entregado en el encargo de esta fase: **no reverificado aquí**, se usa para decidir. (3) Lo
> demás lleva **hipótesis** delante (`CLAUDE.md:86-88` en `648432d`).
>
> **Método: toda cifra de la tanda sale de la RUTA DISEÑADA (`git grep`), nunca de un prototipo con
> otro criterio.** Las cifras de este documento están medidas el 2026-09-13 sobre `773ad75` por esa ruta:
> `git grep -nI` sobre el sha, atribución en la misma línea física y un `git cat-file --batch` de lo
> citado, sin `openspec/changes/archive/`, `.claude/skills/superpowers-main/`, `.agent/skills/`,
> `docs/artefactos/` ni `*.csv`. Las que no se pueden medir así lo dicen.
>
> **Convenciones que este diseño se aplica.** Toda cita a `CLAUDE.md`, `openspec/config.yaml`,
> `package.json`, `DEPLOY.md` o `.gitattributes` va anclada a `648432d` en su misma línea física. No hay abreviadas. Los
> ejemplos de citas y de formatos se escriben con marcadores (`<ruta>`, `<N>`, `<rev>`), nunca con forma
> de cita. Los artefactos de la tanda se nombran por apartado o por requisito, nunca por línea.

**Qué revisar primero:** el §1 (la respuesta), el §6 (la opción del ref), el §7 (coste) y el §11
(divergencias con la spec que `sdd-tasks` tiene que llevar).

---

## 1 · La respuesta, primero

| Hueco | Decisión | El número que la sostiene |
|---|---|---|
| Atribución de abreviadas (RQ-CV-17) | **Lbc**: misma línea física, fichero anterior por índice, y la atribución **se corta** al pasar por una cita completa que no resuelve o por una barra de celda. **Sin corte por vocabulario** (decisión de Gerencia) | **34** rotas informadas y **843** huérfanas de 1.154; al menos 18 falsos positivos conocidos en las 34 |
| Ancla partida por el salto de línea (RQ-CV-17) | **No se mira la línea siguiente.** Hueco declarado, y el mensaje de bloqueo lo nombra | **0** casos entre 62 citas completas ancladas |
| Marcas ISO y horas (RQ-CV-17) | **Se descartan**: categoría «no es cita», fuera de las cuatro cifras, aplicada sólo a tokens sin `/` que no resuelven | Saltadas sin `/`: **975 → 404** con los puertos de URL; «no son citas»: **571** (501 marcas ISO, 54 horas y 16 puertos) |
| `host:puerto` (RQ-CV-16) | **Cerrado**: el puerto dentro de una URL se descarta; el host pelado sigue como saltada | **21**: 16 dentro de URL descartados, 5 siguen saltados |
| Ficheros `.csv` | **Fuera del barrido por extensión, no del índice**, declarado igual que `docs/artefactos/` | Saltadas sin `/`: **5.072 → 975**; números pelados **4.151 → 54**; la base es **51** en los dos casos |
| Opción (d), ref local | **Se declara, no se construye** (§6) | 50-60 líneas, +0,23 s, y sólo cierra el hueco en clones con validación previa |
| Coste (RQ-CV-13) | **Medido por la ruta diseñada bajo `tsx`: 1,34-1,49 s** de reloj (§7) | Margen de ~3,5 s contra 5 s y ~8,5 s contra 10 s |
| Línea base | `apps/desk/server/citas/lineaBase.jsonl`, JSON Lines, una entrada por línea, **excluida del barrido** | **51** líneas, 42 claves (fichero, cita) distintas |
| Cadenas rotas en las pruebas | Citas **construidas en tiempo de ejecución** y repositorios sintéticos; **ningún fichero de pruebas sale del barrido** | 0 exclusiones nuevas por pruebas |

⚠️ **La base es 51, no 47.** La versión anterior de este diseño decía 47, cifra de un prototipo que
descartaba como binario cualquier fichero con un byte NUL en cualquier punto. El plan
`docs/superpowers/plans/2026-08-06-catalogo-maestro-equipos.md` tiene uno en su línea 834, en el byte
39.726, dentro de un fragmento de código; `git grep -I` sólo mira los primeros 8.000 bytes, trata el
fichero como texto y cosecha sus cuatro citas rotas, las de sus líneas 1326, 1512, 1543 y 1976. Por
motivo, las 51 son 36 en línea vacía, 8 fuera de rango, 4 ambiguas rotas en todas sus candidatas y 3
con fichero inexistente (2026-09-13, `773ad75`, ruta diseñada).

---

## 2 · Enfoque técnico

**Forma: núcleo puro + puerto + adaptador.** Es el molde hexagonal aplicado a un lector de texto:

- **El núcleo** decide todo lo que dice la spec (RQ-CV-02 a RQ-CV-10) y no lanza procesos.
- **El puerto `Repo`** es lo único que el núcleo sabe de git: nombres de un árbol, líneas con candidatas,
  lectura por lote e identidades.
- **El adaptador `git.ts`** lo implementa con `spawnSync`, argumentos en lista y sin shell.
- **El CLI** lee el stdin de `pre-push`, llama al núcleo, imprime el informe y fija el código de salida.

**La cosecha es `git grep` sobre el sha local**, como exige RQ-CV-01, y no la lectura del alcance entero
que hacía el prototipo. Es la pieza que decide el coste (§7) y la que limita la atribución a la misma
línea física (§4, D1).

**Regla invariable 13, contestada por escrito.** El hook es una guarda **local sin contrapartida
remota**: exactamente el caso de `CLAUDE.md:76-77` en `648432d`. La contrapartida sería el job de CI con
`fetch-depth: 0`, que esta tanda no construye y cuyo disparador vigila el aviso de escalada (RQ-CV-11).
Se declara, no se disimula.

**Lo que no aplica, dicho.** La regla de mutación 3 no aplica: la tanda no toca `apps/desk/src`. Las
reglas de `rules.design` (`openspec/config.yaml:970-972` en `648432d`) tampoco: no hay esquema ni SQL.

---

## 3 · Ficheros

| Fichero | Acción | Unidad | Qué hace | Líneas (hipótesis) |
|---|---|---|---|---|
| `apps/desk/server/citas/git.ts` | Crear | 1 | Adaptador: `ls-tree -r --name-only -z`, `grep`, `cat-file --batch`, `shortlog -sne --all`, `rev-parse --verify -q`. `maxBuffer` explícito, stdin cerrado salvo en el lote | 35-50 |
| `apps/desk/server/citas/cosecha.ts` | Crear | 1 | Tokenizador por línea: completas, abreviadas con la atribución Lbc, ancla en la misma línea, «fuera del repositorio» y puerto de URL | 47-66 |
| `apps/desk/server/citas/resolucion.ts` | Crear | 1 | Índices por árbol (exacto, sufijo con frontera, directorios) y la regla de resolución en su orden (D4) | 30-45 |
| `apps/desk/server/citas/detector.ts` | Crear | 1 | Orquesta sobre `Repo`: un lote por árbol, los dos extremos, clasificación contra la base con multiplicidad | 55-80 |
| `apps/desk/server/citas/informe.ts` | Crear | 1 | El mensaje de RQ-CV-10 (§5) | 30-45 |
| `apps/desk/server/citas/cli.ts` | Crear | 1 | Modos de hook, `--sha` y `--generar-base`; aviso de escalada; código de salida. **Cabecera con las dos declaraciones de RQ-CV-18** | 30-45 |
| `apps/desk/server/testing/reposDePrueba.ts` | Crear | 1 | Arnés: `Repo` en memoria, repositorio git temporal aislado, y los constructores de citas en tiempo de ejecución (D7) | 30-45 |
| `apps/desk/server/citas/*.test.ts` | Crear | 1 y 3 | §8 | 365-520 |
| `apps/desk/server/citas/lineaBase.jsonl` | Crear | 2 | Generada con `--generar-base` | 51 |
| `CLAUDE.md` y `openspec/config.yaml` | Modificar | 2 | IV-10 y las dos frases de la regla de mutación 4, sin cambios respecto a la propuesta | 38-66 |
| `.githooks/pre-push` | Crear | 3 | Cuatro líneas (§5) | 4 |
| `scripts/instalar-hooks.mjs` | Crear | 3 | Guarda en Node y `git config core.hooksPath .githooks` (D9) | 25-35 |
| `package.json` | Modificar | 3 | Script `prepare` nuevo: `package.json:10-23` en `648432d` no lo tiene | 1 |
| `.gitattributes` | Modificar | 3 | **Nuevo respecto a la propuesta**: `.githooks/* text eol=lf` con su porqué (D10) | 3-5 |
| `DEPLOY.md` | Modificar | 3 | Comando manual para `--ignore-scripts` y `--unset` de la reversión | 3-6 |

Por qué ahí y no en `testing/`: la cobertura incluye `apps/desk/server/**` (`vitest.config.ts:53`) y
excluye `testing/` (`vitest.config.ts:57`); las pruebas entran por `vitest.config.ts:17-20` y el
typecheck por `apps/desk/tsconfig.server.json:12`. El **arnés** sí va en `testing/`, porque es arnés.

⚠️ **La talla sube respecto a la propuesta, y se dice.** Suma de esta tabla: **~750-1.065 líneas**,
contra las ~440-670 que estima la propuesta, que no contaba los cortes de atribución, los descartes,
el lote con vuelta al índice de la revisión, los guardianes del grafo de imports y del fin de línea ni
el arnés. **Hipótesis de talla, no medida.** Con Lbc en vez de Lbcm (D1) salen el corte por
vocabulario y sus dos pruebas de dos signos: unas 3-4 líneas menos en `cosecha.ts` y unas 20-25 en
las pruebas; y la base sube de 47 a 51. La versión anterior de esta tabla, con Lbcm y 47, sumaba
~770-1.090. La unidad 1 sola queda en ~565-815 contra las 800 de
`openspec/config.yaml:29` en `648432d`. La costura natural para trocearla es el puerto `Repo`:
**1a** núcleo puro con pruebas en memoria; **1b** adaptador, CLI y pruebas sintéticas. Decidirlo es de
`sdd-tasks` con `ask-on-risk`, no de este diseño.

**El criterio de corte es por INTENTO, no por tanda.** Cada intento de `sdd-apply` tiene que quedar por
debajo de las 800 líneas del ledger, no sólo la tanda en conjunto: `gentle-ai sdd-attempt` mide
`changed_lines` diffeando el árbol entero entre el principio y el final del intento (regla del ciclo 2,
`CLAUDE.md:353-356` en `648432d`), y un intento que pasa del presupuesto se para en
`blocked(maintainer_decision)` (`CLAUDE.md:360-361` en `648432d`). La costura 1a/1b hay que medirla
contra eso: cada lado, con sus pruebas, por debajo de 800.

---

## 4 · Decisiones de arquitectura

### D1 · Atribución de abreviadas: Lbc, como precisión del informe y sin umbral

Medido por el orquestador por la ruta diseñada, el 2026-09-13 sobre `773ad75`, sobre 1.154 abreviadas
(nivel 2):

| Opción | Qué hace | Rotas informadas | Huérfanas | ¿Cabe en `git grep`? |
|---|---|---|---|---|
| L | Misma línea, fichero anterior por índice (la regla de RQ-CV-06) | 56 | 810 | Sí |
| Lb | L, y una completa que no resuelve corta | 55 | 814 | Sí |
| **Lbc** | **Lb, y no cruza una barra de celda** | **34** | **843** | **Sí** |
| Lbcm | Lbc, y no cruza «maestro», `R08` ni `Mx.y` | 19 | 863 | Sí |
| L+D | Si no hay fichero antes, el de detrás | 128 | 699 | Sí |
| L+A | Si no, el último de la línea anterior | 164 | 584 | **No**: exige leer el alcance entero. Cifras de prototipo sobre 1.151, no medibles por la ruta diseñada |
| L+P | Si no, el último del párrafo | 195 | 453 | **No**: ídem |

**Decisión: Lbc** (decisión de Gerencia en la revisión del diseño, que sustituye a Lbcm). Cuatro razones:

1. **El corte por vocabulario es la misma heurística que se rechazó para bloquear** (decisión Q9 de la
   propuesta), y envejece: un documento externo nuevo nombrado en prosa no corta la atribución.
   **Informar no la vuelve fiable.** Los dos cortes que se quedan son sintácticos y no dependen del
   vocabulario del proyecto: una cita completa que no resuelve y una barra de celda.
2. **Ahorra código y pruebas con la talla por encima de 800** (§3): sale una expresión regular y sus
   dos pruebas de dos signos.
3. **La exhaustividad no se pierde en la comprobación.** Toda abreviada sigue siendo de lectura humana
   por la frase de Q9 en la regla de mutación 4. Las huérfanas se cuentan en la cifra de saltadas.
4. **Coste.** Las opciones de misma línea caben en `git grep`, que devuelve la línea entera con sus
   menciones. L+A y L+P obligan a leer el alcance entero: 882-1.289 ms por la ruta del prototipo,
   contra los 123-148 ms de `git grep` medidos por la ruta diseñada (§7). **L+D se descarta sin número
   de precisión**: informa 128 rotas, frente a 34 de Lbc, y ningún dato dice cuántas son reales. **Hipótesis**: «de»
   también introduce el fichero de la cláusula siguiente.

**No reabre Q9.** Ningún corte hace que algo bloquee ni entre en la base: sólo decide qué enseña una
lista informativa.

⚠️ **Hueco declarado.**
- **843 de 1.154 abreviadas (el 73 %) quedan huérfanas** y sólo las delata la cifra. Cuántas de ellas
  están rotas **no está medido**.
- **Al menos 18 de las 34 rotas informadas son falsos positivos conocidos**, así que la precisión de
  la lista es **como mucho 16 de 34**:
  - **al menos 15** son las que sólo quitaba el corte por vocabulario (34 frente a 19), clasificadas por
    script como citas al maestro nombrado en prosa, no leídas una a una;
  - **al menos 3** no las ve ningún corte: los tres casos que Gerencia verificó de disco en
    `docs/sdd/F0-01_Correcciones_para_el_plan.md` (línea 144), `openspec/specs/transitions-st/spec.md`
    (línea 33) y `openspec/specs/trazas/spec.md` (línea 325).
- **Se acepta a sabiendas:** una lista con falsos positivos declarados que no bloquea es preferible a
  una heurística de vocabulario que aparenta precisión y envejece.

### D2 · El ancla sólo se lee en la línea de la cita

| Opción | Coste | Decisión |
|---|---|---|
| Mirar también la línea siguiente | Contexto `-A1` en `git grep`, estado entre líneas y dos pruebas de dos signos, para **0 casos** | Rechazada |
| **Sólo la misma línea, y declararlo** | Nada | **Elegida** |

**Por qué el hueco es acotado:** un ancla partida degrada la cita a **cita del presente**, nunca a un
aprobado falso de algo roto hoy. Si la cita está rota en el sha local, **bloquea**, y es visible. Si está
bien, pasa con la misma protección que cualquier cita sin anclar. Lo que se pierde es la protección
futura de esa cita, en silencio. **Mitigación barata:** el mensaje de bloqueo incluye una frase que
pide juntar el ancla con su cita si va en la línea siguiente.

### D3 · Descartes: marcas ISO, horas y puertos de URL

- **Puerto de URL** (sintáctico, en la cosecha): la palabra lleva `://` y **no hay `/` entre el host y
  los dos puntos** → «no es cita». Si hay ruta detrás del host, la palabra es «fuera del repositorio»
  (RQ-CV-04). Cierra RQ-CV-16: **16** descartados; los **5** con host pelado siguen como saltadas,
  porque sintácticamente no se distinguen de un fichero sin extensión y por eso se declaran.
- **Marca ISO y número pelado** (en la resolución, **después** de que el token no resuelva ni en el
  índice local ni en el remoto, y sólo si no lleva `/`): nombre sólo de dígitos, o fecha con `T` y
  hora → «no es cita». Por construcción **nunca cambia un resultado comprobado ni bloqueante**: sólo
  reclasifica lo que ya iba a saltarse.
- **Qué sigue contando como saltada:** **404** sin `/` —las 975 menos 501 marcas ISO, 54 horas y 16
  puertos de URL, que suman **571** «no son citas»; medido por la ruta diseñada—, más las ambiguas con
  alguna candidata válida (141), los directorios y las huérfanas.
- **Por qué importa:** la cifra de saltadas sin `/` es la **única señal** del hueco de RQ-CV-11
  (renombrado empujado sin hook). Con 5.072 es ruido; con 404 una subida se puede ver.
- El total de «no es cita» se imprime en su propia línea, fuera de las cuatro cifras (§5): no se oculta.

### D4 · Orden de la regla de resolución

| Paso | Regla | Resultado |
|---|---|---|
| 1 | Palabra con `://` sin ruta tras el host | No es cita |
| 2 | Palabra que empieza por `~/`, por `/`, por letra de unidad con dos puntos y barra, o que lleva `://` | Fuera del repositorio |
| 3 | Coincidencia exacta en el índice local; si no, sufijo con frontera de segmento | Uno: comprueba · varios: RQ-CV-03 |
| 4 | Resuelve a un directorio del índice local | Saltada |
| 5 | Resuelve en el índice remoto | **Bloquea**: «existía en `<sha remoto>`» |
| 6 | Sin `/`, sólo dígitos o fecha ISO con hora | No es cita (D3) |
| 7 | Lleva `/` | **Bloquea**: fichero inexistente |
| 8 | Lo demás | Saltada |

El **paso 4 va antes del 7** a propósito: un token con `/` que nombra un directorio no es un fichero
inexistente. Esa posición lleva su propia prueba de posición (regla de mutación 1, §8).

### D5 · `.csv` fuera del barrido, por extensión

| Opción | Efecto | Decisión |
|---|---|---|
| Barrerlos | 5.072 saltadas sin `/`, 4.097 de ellas de `docs/analisis-tickets/Tickets.csv`; `docs/remisiones/Remision_Data.csv` aporta 0 | Rechazada |
| Excluir las dos rutas | Mismo efecto hoy; un `.csv` nuevo vuelve a ensuciar | Rechazada |
| **Excluir `*.csv`** | 975 saltadas sin `/`, base 51 igual | **Elegida** |

Un fichero de datos no hace afirmaciones del proyecto. **Fuera del barrido, no del índice**: una cita
**a** una línea de un `.csv` se sigue resolviendo y comprobando. No se extiende a `.json` ni a `.yaml`:
`openspec/config.yaml` es de los ficheros con más citas del repositorio.

### D6 · La línea base: JSON Lines, excluida del barrido, casada por (fichero, cita)

**Formato**: `apps/desk/server/citas/lineaBase.jsonl`, UTF-8 sin BOM, LF, una entrada por línea,
ordenada por fichero y línea:

```
{"fichero":"<ruta del documento>","linea":<N>,"cita":"<cita literal>","motivo":"<motivo>"}
```

- `cita` es el texto cosechado tal cual: token, dos puntos y línea o rango, más «en» y la revisión si
  va anclada.
- `linea` y `motivo` son **informativos**: dicen dónde estaba y por qué en la generación.

**Hueco 1 resuelto — la base tiene forma de cita dentro.** Tres opciones:

| Opción | Problema | Decisión |
|---|---|---|
| Formato sin forma de cita (dos puntos escapados en el JSON) | Una entrada añadida **a mano**, que es una de las dos salidas legítimas, llevaría los dos puntos sin escapar y bloquearía desde la propia base | Rechazada |
| Separar la cita en columnas | Deja de ser «cita literal», que es lo que pide RQ-CV-09 | Rechazada |
| **Excluir la ruta exacta del barrido** | Una exclusión más, nombrada | **Elegida** |

Dos signos (en el grupo de M14): el mismo texto roto, dentro de la ruta de la base → ignorado; en
otro fichero → bloquea.

**Casar por (fichero, cita) con multiplicidad, no por línea.** Si la clave llevara la línea, cualquier
inserción **encima** de una entrada en su documento dejaría la entrada caducada y la cita como rota
nueva: el push se pararía por editar un documento con una cita ya registrada. Así se acaba en
`--no-verify`. Con multiplicidad:
- menos ocurrencias rotas que entradas → **caducadas, el hook falla** (M9);
- más ocurrencias que entradas → **las de más bloquean** (M10).

⚠️ **Hueco declarado:** reparar una cita de la base y escribir **la misma cita literal rota** en otro
punto del **mismo** fichero deja la cuenta igual y pasa.

**Generación:** `--generar-base` **escribe el fichero él mismo**, no por redirección. En PowerShell 5.1
la redirección escribe UTF-16. Imprime la cifra; la guarda de 100 entradas de R-14 es una comprobación
de la tanda, no código.

### D7 · Pruebas con cadenas de forma de cita rota

**Hueco 2 resuelto.** Tres opciones:

| Opción | Qué deja de comprobarse | Decisión |
|---|---|---|
| Excluir `apps/desk/server/citas/**/*.test.ts` | Las citas reales de los comentarios de esas pruebas | Rechazada |
| Cadenas partidas a mano en cada prueba | Nada, pero cada prueba reinventa la partición y una se escapa | Rechazada |
| **Constructores en el arnés** (`cita(<ruta>, <desde>, <hasta>)`, `abreviada(<N>)`, `anclada(...)`), que concatenan en tiempo de ejecución, **más repositorios sintéticos** en un directorio temporal | **Nada del barrido.** El coste es de lectura: el fuente de la prueba no enseña la cadena literal | **Elegida** |

- **Los títulos de las pruebas van en prosa.** Si alguien escribe uno con forma de cita, el propio hook
  lo para: la regla se impone sola.
- **No hay ninguna prueba de vitest que barra el árbol real.** Pondría el CI en rojo por citas ancladas
  a revisiones que el checkout sin `fetch-depth` no tiene, y duplicaría el hook. El árbol real lo
  comprueban el hook y las dos pasadas del §8 de la propuesta.

### D8 · El aviso de escalada vive en TypeScript, no en el hook

La propuesta lo estimaba en ~10 líneas de shell. Va en `cli.ts`, por dos razones: la prueba de dos
signos (M21) corre en proceso y **cuenta en la cobertura**, y el hook se queda sin lógica.

### D9 · El instalador comprueba que el repositorio es **este** directorio

`git rev-parse --show-toplevel` sube por los directorios padre. Un `npm ci` en un directorio sin `.git`
**dentro de otro repositorio** instalaría el hook en la configuración de ese otro. Por eso:
- el instalador compara la raíz devuelta con el directorio actual, normalizando barras y mayúsculas en
  Windows;
- si no coinciden, **sale 0 sin instalar** y lo dice.

Cuesta tres líneas y una prueba, y hace que M11 discrimine también en ese caso.

### D10 · `.githooks/* text eol=lf`

`.gitattributes:29` en `648432d` fija `* text=auto`, y `.gitattributes:31-33` en `648432d` explica
que un script con CRLF no se ejecuta. `.gitattributes:36` en `648432d` sólo protege `*.sh`, y
`.githooks/pre-push` no tiene extensión.

**`.gitattributes` se suma a los ficheros que la tanda modifica** (unidad 3), así que, por la
convención de anclaje de Q7a, toda cita a él en los artefactos de la tanda va anclada a `648432d` en
la misma línea física. Su contenido no ha cambiado entre `648432d` y `773ad75`.

**Hipótesis:** con `core.autocrlf=true` el hook sale con CRLF en el árbol de trabajo y `sh` falla, o
peor, recibe un argumento con retorno de carro. La línea nueva elimina la clase entera.

**Guardián:** `git check-attr eol` sobre la ruta debe devolver `lf`. Dos signos: repositorio sintético
sin la línea → rojo.

**El bit de ejecución, declarado y sin guardián:** el hook se añade con `git add --chmod=+x`. Con
`core.fileMode=false` el índice conserva el modo en ediciones posteriores (**hipótesis**). Un clon Linux
o macOS con el modo perdido **ignoraría el hook sin parar el push**, y hoy no hay ninguno.

### D11 · Un lote por árbol, compartido entre el sha local y las anclas

- **Un solo `git cat-file --batch` por árbol** con todos los objetos pedidos:
  - los `<sha>:<ruta>` de los ficheros citados en el sha local;
  - los `<rev>:<ruta>` de las anclas;
  - un `<rev>^{commit}` por revisión distinta, para distinguir revisión inexistente o ambigua de fichero
    ausente.
- **La salida se parte sobre `Buffer`**, porque los tamaños van en bytes.
- **Resolución de una anclada:** con el índice del sha local. Si el fichero no está en esa revisión, con
  el índice de la propia revisión, que se construye **sólo en ese caso**.
- **Hipótesis:** casi todas las anclas apuntan a rutas que no cambiaron (`CLAUDE.md`,
  `openspec/config.yaml`). Cuántas revisiones distintas hay es medición pendiente.

### D12 · Varias referencias, borrados y fallos

| Situación | Comportamiento |
|---|---|
| Varias líneas en stdin | Se pela cada sha local a su árbol y **se deduplica por árbol**. Un árbol con varios shas remotos usa la unión de sus índices. Cada árbol distinto cuesta un barrido entero (§7) |
| sha local en ceros (borrado) o stdin vacío | Salida 0 con una línea que lo dice |
| sha local que no pela a árbol (una etiqueta a un blob) | Se informa «no comprobado» y no bloquea: no hay árbol que barrer |
| sha remoto en ceros | Índice de `origin/main`; si no existe, «índice remoto: NO HECHO» |
| Objeto remoto ausente del clon | «índice remoto: NO HECHO: objeto ausente» |
| git falla, base ilegible o línea de stdin mal formada | **Salida 2 y mensaje.** Falla cerrado: un hook que pasa sin haber comprobado es el defecto de M16 |

**Códigos de salida:** 0, pasa · 1, bloqueo (citas rotas nuevas o entradas caducadas) · 2, fallo
operativo.

---

## 5 · Contratos

**El puerto** (lo que el núcleo sabe de git):

```ts
export interface Repo {
  /** Rutas trackeadas de un árbol. `null` si el objeto no está en el clon. */
  rutas(rev: string): string[] | null
  /** Líneas con candidatas del árbol, ya sin las exclusiones del barrido. */
  lineas(arbol: string, exclusiones: readonly string[]): { fichero: string; n: number; texto: string }[]
  /** Muchos objetos en UNA lectura. `null` = ausente o ambiguo. */
  leerLote(objetos: readonly string[]): Map<string, string | null>
  /** `null` si la revisión no pela a árbol. */
  arbol(rev: string): string | null
  identidades(): string[]
}
```

**El adaptador** implementa `lineas` con `git grep --null -n -I -E` y un patrón de dos puntos seguidos
de dígito, con pathspecs de exclusión. **Hipótesis:** el formato exacto de la salida con `--null` sobre
un árbol lo fija la primera prueba sintética.

**Exclusiones del barrido** (una constante):
- `openspec/changes/archive/`
- `.claude/skills/superpowers-main/`
- `.agent/skills/`
- `docs/artefactos/`
- `*.csv`
- `apps/desk/server/citas/lineaBase.jsonl`

**El CLI:**

| Modo | Uso |
|---|---|
| Sin argumentos | Hook: lee el stdin de `pre-push` |
| `--sha <rev>` | Comprobación manual del §8 de la propuesta; índice remoto de `origin/main`. En PowerShell se invoca con `npx --no tsx`, porque el shim de `.bin` es un script `sh` |
| `--generar-base` | Escribe `lineaBase.jsonl` para el árbol de `HEAD` |

`cli.ts` exporta `ejecutar({ argv, entrada, cwd })` y sólo se autoejecuta cuando es el punto de
entrada. Así las pruebas lo llaman **en proceso** y el adaptador y el CLI **cuentan en la cobertura**:
la cobertura v8 no ve procesos hijos.

**El hook:**

```sh
#!/bin/sh
# Detector de citas: toda la lógica está en apps/desk/server/citas/cli.ts
[ -f node_modules/.bin/tsx ] || { echo "pre-push: falta node_modules/.bin/tsx (npm ci). El push se para sin comprobar." >&2; exit 1; }
exec node_modules/.bin/tsx apps/desk/server/citas/cli.ts "$@"
```

`exec` hereda el stdin. **Git lanza el hook desde la raíz del árbol de trabajo, y está documentado:**
la documentación local de Git 2.52.0 (`/c/Program Files/Git/mingw64/share/doc/git-doc/githooks.html`,
línea 473 del HTML) dice «Before Git invokes a hook, it changes its working directory to either
$GIT_DIR in a bare repository or the root of the working tree in a non-bare repository». La excepción
que nombra la misma documentación —pre-receive, update, post-receive, post-update y push-to-checkout,
que corren siempre en `$GIT_DIR`— son hooks del lado servidor; `pre-push` no está entre ellos. Por eso
las rutas relativas del hook (`node_modules/.bin/tsx`, `apps/desk/server/citas/cli.ts`) resuelven
contra la raíz.

**El informe** (todo a stderr, un bloque por árbol comprobado):

```
citas · <sha corto> · <ref local>
  comprobadas ............ <N>
  saltadas ............... <N>   (sin barra y sin resolver <N> · ambiguas con alguna candidata válida <N> · directorios <N> · abreviadas huérfanas <N>)
  fuera del repositorio .. <N>
  abreviadas rotas ....... <N>   (informativas: no bloquean)
  no son citas ........... <N>   (marcas de hora ISO, horas y puertos de URL; fuera de las cuatro cifras)
  texto que git cree binario .. <N>   (no barridos)
  índice remoto .......... <sha corto> | origin/main | NO HECHO: <motivo>
  línea base ............. <N> informadas · <N> caducadas
```

**La línea `texto que git cree binario`** (RQ-CV-10, decisión de Gerencia del 2026-09-13) cuenta los
ficheros trackeados con extensión de texto que `git grep -I` se salta en silencio: sale del `--numstat`
de `git diff` desde el árbol vacío contra el sha local, con la misma lista de extensiones que el
guardián de las pruebas, y esa función vive en `git.ts`. Cuesta **182-194 ms** por ejecución (tres
tomas sobre `ef08129`), dentro del margen de RQ-CV-13 que mide el §7.

Detrás van las listas, cada elemento con el documento que cita, la línea de la cita, la cita y el motivo:
- **abreviadas rotas**;
- **bloqueantes**, con **cuál** extremo falla;
- **caducadas**.

Y las frases fijas:
1. **Qué NO comprueba:** que la línea diga lo que la frase afirma.
2. **Por qué las abreviadas no bloquean:** su referente lo decide quien lee el contexto, no la sintaxis.
3. **Las dos salidas legítimas:** reparar la cita, o añadirla **a mano** a la base.
4. **Si el ancla va en la línea siguiente,** juntarla con su cita (D2).

El aviso de escalada va al final, sin tocar el código de salida. `--no-verify` no aparece en ningún
texto, y hay una prueba que lo afirma.

---

## 6 · Opción (d): ref local con el último árbol validado — **se declara, no se construye**

| Aspecto | Análisis |
|---|---|
| **Estado que añade** | Un ref por clon, `refs/citas/validado`, fuera de `refs/heads` y `refs/tags`: un push normal no lo empuja. **Sí viaja con `git push --mirror`.** Se escribiría con `git update-ref` al final de cada ejecución en verde |
| **`pre-push` corre antes de que el remoto acepte** | El ref puede apuntar a un sha que el remoto rechazó. Eso no falsea lo que aporta: sólo añade nombres que existieron en un árbol que este clon validó. Pero **abre una clase nueva de bloqueo**: una cita pelada a un fichero que sólo existió en **otra rama** validada pasa de saltada a bloqueante. Q2 decidió no bloquear lo que no resuelve sin `/`, y esto lo reabre de lado |
| **Clon nuevo** | No hay ref. El hueco sigue abierto en todo clon que no validara un sha anterior al renombrado |
| **Varias referencias** | Un único ref guarda el último árbol validado y pierde los otros. Un ref por referencia remota multiplica estado y lecturas |
| **Dos signos** | Repositorio sintético con remoto desnudo: validar S1, que tiene el fichero; empujar sin hook S2, que lo renombra; empujar con hook S3, con una cita pelada a él → con el ref **bloquea** «existía en S1»; sin el ref en el índice → **saltada**, sale 0 y la prueba se pone roja. Otro signo: clon nuevo → saltada, y el mensaje dice que no hay ref |
| **Coste** | 99 ms en proceso + 115-132 ms por `update-ref` (medido desde Git Bash) ≈ **+0,23 s**. **~15 líneas de código y ~35-45 de prueba: 50-60** |

**Veredicto: se declara.** Cierra el hueco sólo en parte, a cambio de:
- estado nuevo por clon, que además viaja con `--mirror`;
- una clase nueva de bloqueo cruzado entre ramas;
- entre 50 y 60 líneas, cuando la unidad 1 ya roza el presupuesto (§3).

La probabilidad del caso es baja: una sola identidad, y el hook se instala solo con `prepare`. Y los
descartes de D3 y D5 dejan la señal que lo delata (saltadas sin `/`) en torno a 400 en vez de 5.072.
El hueco de RQ-CV-11 queda como está en la spec.

**Alternativa rechazada:** un índice con todos los nombres de la historia (`git log --all --name-only`).
Cerraría también el clon nuevo, pero convierte en bloqueo toda cita pelada a cualquier nombre histórico
y **reabriría la base de 51 sin medir**. R-14 está cerrado.

---

## 7 · Coste de RQ-CV-13 bajo `tsx`

**Medido por la ruta diseñada**, el 2026-09-13 sobre `773ad75` (nivel 2): cosecha con `git grep -nI`
sobre el sha, con las exclusiones del §5 salvo la base (que aún no existe), atribución en la misma
línea, un `cat-file --batch` de lo citado, `shortlog` e índice remoto. Invocado como lo haría el hook:
desde `sh`, con `node_modules/.bin/tsx` y la entrada de `pre-push` por stdin. Cinco intentos.

| Pieza | Tiempo |
|---|---|
| **Total, reloj de pared** | **1,34-1,49 s** |
| de ello: arranque de `tsx` en esa misma serie | 768-936 ms |
| de ello: proceso interno | 465-589 ms |
| · `git grep` sobre el sha | 123-148 ms |
| · `cat-file --batch` de lo citado | 121-194 ms |
| · `shortlog -sne --all` | 68-113 ms |
| · índice local (`ls-tree` y mapa) | 38-72 ms |
| · índice remoto (`ls-tree` y mapa) | 44-63 ms |
| · cosecha y atribución en Node | 21-29 ms |
| Opción (d) (no elegida) | +0,23 s (§6) |

**Total declarado: 1,34-1,49 s** → margen de **~3,5 s** contra 5 s y de **~8,5 s** contra 10 s.

- **La serie se midió con la atribución Lbcm, no con Lbc.** La diferencia es una comprobación de
  expresión regular por abreviada (1.154 en total), despreciable frente a los 21-29 ms de toda la
  cosecha.
- *(Nota histórica, otra ruta y no la diseñada: el prototipo que leía el alcance entero con un
  `cat-file --batch` costaba 2,84-3,74 s bajo `tsx`, de ellos 882-1.289 ms sólo en esa lectura; con
  `.csv`, 3,64-3,85 s. La versión anterior de este apartado estimaba la ruta diseñada en ≤ 2,66 s
  restando esa lectura al techo del prototipo; la medición la sustituye.)*

⚠️ **Dos cosas que ese total no incluye, y se dicen.**
1. **Hipótesis sin medir:** la transformación de `tsx` con seis módulos `.ts` en vez de un `.mjs`, y
   la vuelta al índice de la revisión en las anclas (D11). **Lo decide M19 en la tanda.**
2. **Un push con varios árboles distintos cuesta un barrido por árbol** (D12). El push típico lleva uno.

---

## 8 · Estrategia de pruebas

**Cuatro tipos:**
- **Memoria:** `Repo` en memoria, rápido.
- **Sintético:** git temporal. El arnés vacía `GIT_DIR`, `GIT_WORK_TREE` y `GIT_INDEX_FILE`; fija
  `GIT_CONFIG_NOSYSTEM`, un `GIT_CONFIG_GLOBAL` vacío, `GIT_CEILING_DIRECTORIES` e identidad por
  entorno; usa `core.autocrlf=false`; y amplía el tiempo límite por fichero.
- **Estático:** lee el fichero vigilado.
- **Manual:** se ejecuta una vez y se registra.

| Mutación o control | Fichero de prueba | Tipo |
|---|---|---|
| M2, M3, M4 (las dos direcciones), M9, M10, M17, M22, M30; la base sin abreviadas; **un solo `leerLote` por árbol**; la vuelta del ancla al índice de la revisión | `detector.test.ts` | Memoria |
| M24, M25, M26, M27; **los dos cortes de Lbc —cita completa que no resuelve y barra de celda—, cada uno con dos signos** (sin pruebas de corte por vocabulario, que D1 no construye); puerto de URL frente a cita real; las formas de «fuera del repositorio» | `cosecha.test.ts` | Memoria |
| M15, M23, M28; **posición del paso de directorio antes del de `/`** (regla de mutación 1); marca ISO descartada frente a fichero trackeado con nombre de dígitos, **comprobado** | `resolucion.test.ts` | Memoria |
| RQ-CV-10: cuatro cifras, desglose, frases fijas, dos salidas, ausencia de `--no-verify`; texto del aviso | `informe.test.ts` | Memoria |
| M1, rojo g y M7, M8, M20, M21, M29; M5 (el control es **`git add` y commit**, §11); **M14 con seis exclusiones**; borrado de rama; rama nueva con y sin `origin/main`; ruta no ASCII; salida de `git grep` por encima de 1 MB; dos referencias al mismo árbol; **un `.md` con un NUL: cifra de texto que git cree binario, con y sin el NUL** | `hook.test.ts` | Sintético |
| M16 estático con las tres formas sucias (`npx tsx`, `npm exec tsx`, `npm x tsx`) sobre el contenido real de `.githooks/pre-push`, y el real en verde; **grafo de imports**: el recorrido desde `apps/desk/server/index.ts` (primer import relativo en `apps/desk/server/index.ts:10`) no alcanza `citas/`, y un grafo en memoria donde un módulo de producción importa `citas/` se pone rojo; **`eol=lf`** real y sintético | `guardianes.test.ts` | Estático y sintético |
| M11 (dos signos), M12 (`PATH` vacío con `process.execPath`), M13 (un directorio llamado `config.lock` dentro de `.git` hace fallar `git config`), D9 (directorio anidado en otro repositorio) | `instalador.test.ts` | Proceso hijo del `.mjs` |
| M16 en ejecución (sin `node_modules`), M18 (orden de la tanda), M19 (coste) | — | **Manual**, registrado en verify |

- **Grafo de imports:** sigue sólo especificadores relativos (`import`, `export … from` e `import()`
  literal). **Hipótesis declarada:** nada de `packages/` importa el servidor por ruta relativa.
- **M16 en ejecución queda manual.** Invocar `sh` desde vitest en Windows depende de que Git Bash esté
  en `PATH`, y un salto silencioso sería peor. El control automatizado de M16 es el guardián estático,
  que es el que exige la spec.

---

## 9 · Matriz de amenazas

| Frontera | Aplicabilidad | Respuesta de diseño | Rojo previsto |
|---|---|---|---|
| Rutas con apariencia de documento o dato y ficheros ejecutables sin extensión | **Aplica**: `.githooks/pre-push` sin extensión bajo `* text=auto`; `.csv`; la base `.jsonl` con forma de cita | `eol=lf` para `.githooks/*` (D10); `*.csv` y la base fuera del barrido (D5, D6) | Guardián `eol` con dos signos; M14 con `.csv` y base |
| Selección de repositorio | **Aplica**: el hook corre en la raíz del árbol de trabajo (documentado en githooks.html de Git 2.52.0, §5); las pruebas crean repositorios temporales; `rev-parse` sube a los padres | El CLI hereda el entorno de git y usa el directorio de trabajo; el arnés aísla `GIT_*`, la configuración global y el techo de directorios; el instalador compara la raíz (D9) | Arnés con `GIT_DIR` hostil en el entorno padre; D9 anidado |
| Estado del commit | **Aplica**: árbol de trabajo, índice y ficheros sin trackear frente a lo que se empuja | Todo se lee del árbol del sha local, nunca del árbol de trabajo | M8; M5 con commit |
| Estado del push | **Aplica**: primer push, borrado, varias referencias, etiquetas, remoto ausente | D12 | Borrado; rama nueva con y sin `origin/main`; dos referencias; objeto remoto ausente |
| Órdenes de PR | **N/A**: la tanda no automatiza PR | — | — |
| Integración de proceso (fila añadida) | **Aplica**: stdin del hook, búferes, codificación | Los hijos de git con stdin cerrado (`git shortlog` lee stdin si no ve revisiones); `maxBuffer` explícito; rutas con `-z` o `--null` sin comillas de `core.quotePath`; salida del lote sobre `Buffer`; la base escrita por el CLI, no por redirección | Salida por encima de 1 MB; ruta no ASCII; base UTF-8 sin BOM |

---

## 10 · Despliegue

Sin migración de datos. El orden es criterio de aceptación (M18):
1. **Unidad 1:** detector y pruebas.
2. **Unidad 2:** base generada e IV-10.
3. **Unidad 3:** hook, instalador, `.gitattributes` y `DEPLOY.md`.

**Una sola tanda SDD por árbol** (`CLAUDE.md:353-356` en `648432d`), y los artefactos commiteados antes
de adquirir el intento de `sdd-apply`.

**Por qué `tsx` basta en producción y en CI:** `tsx` está en `dependencies`
(`package.json:41` en `648432d`), no en `devDependencies`, así que el hook no depende de instalar las
de desarrollo.

---

## 11 · Divergencias con la spec y la propuesta que `sdd-tasks` tiene que llevar

| # | Dónde | Qué cambia el diseño | Por qué |
|---|---|---|---|
| 1 | RQ-CV-07, escenario del fichero sin trackear (M5) | El control del otro signo es **`git add` y commit**, no sólo `git add` | RQ-CV-01 lee el sha local: lo que sólo está en el índice no viaja en el push |
| 2 | RQ-CV-07 y M14 | **Seis exclusiones**, no cuatro: `*.csv` y la base | D5 y D6 |
| 3 | RQ-CV-16 | Cerrado: puerto de URL descartado; 5 con host pelado siguen saltados | D3 |
| 4 | RQ-CV-10 | Las cuatro cifras se mantienen; se añaden el desglose de saltadas y la línea «no son citas» | D3 |
| 5 | RQ-CV-09 | La base casa por (fichero, cita) con multiplicidad; la línea es informativa | D6 |
| 6 | Propuesta, §11 | El aviso de escalada va en TypeScript; `.gitattributes` entra en la unidad 3; la talla sube | D8, D10, §3 |
| 7 | RQ-CV-12, M16 | La ejecución sin `node_modules` queda manual; el guardián estático se automatiza | §8 |
| 8 | D11 y §5 (puerto `Repo`), corte 1a | Una cita anclada se lee por su ruta literal en el árbol de su revisión, sin consultar antes el índice del sha local ni resolver sufijo o ambigüedad dentro del ancla. El puerto `Repo` se declara en `detector.ts`, no en un fichero propio | En el corte 1a la única prueba en memoria de la vuelta del ancla pasa con la lectura directa, y el diseño no fija dónde vive el puerto. No se refactoriza, por decisión de Gerencia (2026-09-13): el coste se mide en el corte 1b, donde hay git de verdad |

---

## 12 · Mediciones pendientes (hipótesis hasta medirlas)

Medidas por el orquestador el 2026-09-13 sobre `773ad75` por la ruta diseñada. Las cerradas llevan su
resultado.

1. **CERRADA.** Las citas nuevas de este diseño a ficheros anclados (la regla invariable 13, la regla de
   método, `rules.design` y la línea de `tsx` de `package.json`), verificadas contra `648432d`: dicen lo
   que el diseño afirma.
2. Cuántas revisiones distintas hay entre las 62 citas completas ancladas, y cuántas no resuelven por el
   índice local (coste de D11).
3. **CERRADA.** `git grep` con el patrón y las exclusiones, lanzado desde Node: **123-148 ms**; recorrido
   de su salida con la atribución: **21-29 ms** (§7).
4. **ABIERTA.** Coste de transformación de `tsx` con seis módulos, en frío y con caché.
5. **CERRADA.** Saltadas sin `/` con los descartes de D3: **404**; «no son citas»: **571** (501 marcas
   ISO, 54 horas y 16 puertos de URL).
6. **CERRADA, con la atribución que decide D1.** Lbc con `*.csv` excluido: **34** rotas informadas y
   **843** huérfanas de 1.154 (la base aún no existe, así que su exclusión no cambia nada).
7. **CERRADA.** Claves (fichero, cita) distintas entre las 51 entradas: **42** (multiplicidad de D6).
8. Duración actual de `npm test` y lo que añaden las pruebas sintéticas en Windows.
9. **ABIERTA.** Coste de un push con dos árboles distintos.
10. Talla real de la unidad 1 frente a las 800 líneas (§3), por intento de `sdd-apply`.

## 13 · Preguntas abiertas

- [ ] **Ninguna bloquea el diseño.** La talla frente al presupuesto (§3) es decisión de `sdd-tasks` con
      `ask-on-risk`.
