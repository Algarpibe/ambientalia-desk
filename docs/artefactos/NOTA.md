# `docs/artefactos/` — nota sobre `blueprintserviciotecnico.html`

| Dato | Valor |
|---|---|
| Fichero | `docs/artefactos/blueprintserviciotecnico.html` |
| Título interno | «Blueprint de Servicio Técnico — mapa de transiciones» |
| Tamaño | 3.371.770 bytes (eran 3.370.299; +1.471 del aviso de caducidad, §7) |
| Líneas | 4.432 (la última sin salto final) |
| Generado el | 2026-08-21 (contenido). Aviso de caducidad añadido el 2026-09-09 por F1A-05, §7 |
| Generador | **No existe en el repositorio** (ver §3). Reverificado en F1A-05 sobre `43821b8` |
| Atributos git | `-diff -merge` (ver §5) |

---

## 1 · Qué es

El **mapa visual de las transiciones del flujo de servicio técnico**: diagrama completo,
leyenda por área y fichas de los hallazgos. Es la fuente gráfica de §M1.3 del documento
maestro, que lo cita por su título interno en
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md:4272`.

## 2 · Es texto plano, no un contenedor de imágenes

Los 3,2 MB **no son imágenes embebidas**. El fichero contiene sólo **cinco** ocurrencias de
`data:image`, que suman **2.408 bytes (2,3 KB)**: un `svg+xml` inline, un fragmento de
cadena y tres PNG minúsculos en base64. El peso es marcado y datos.

Consecuencia práctica: **comprime muy bien**. Como blob comprimido ocupa unos **898 KiB**
(919.501 bytes con `gzip -9`; 923.043 con el nivel 6 que git usa por omisión). No es un
binario de 3 MB en el historial: es un blob de menos de 1 MB por revisión.

## 3 · NO HAY GENERADOR EN EL REPOSITORIO

Verificado el 2026-09-08 sobre el commit `a3a8f03`: **cero referencias** a
`blueprintserviciotecnico` en `apps/`, `packages/`, `scripts/` y `package.json`.

```
grep -rn "blueprintserviciotecnico" apps packages scripts package.json   # 0 resultados
```

(Las coincidencias de la palabra suelta «blueprint» en el código son otra cosa: se refieren
al *blueprint de Zoho Desk* como concepto de dominio — `historyMap.ts`, `Sidebar.tsx` —, no
a este fichero.)

Lo produjo **una conversación de agente en agosto de 2026**. No quedó script, ni plantilla,
ni entrada de `package.json`. **Hoy no existe forma de reproducirlo.**

> **⚠️ PRECISIÓN DE F1A-06 (2026-09-22): sigue sin haber generador para ESTE fichero, y ahora SÍ
> hay uno para el mapa vigente.** Nada de lo de arriba se retira: `blueprintserviciotecnico.html`
> queda **histórico congelado** en el commit `a3a8f03` (decisión heredada H-1 de la propuesta
> `generador-mapa-blueprint`), y sigue siendo cierto que este `.html` concreto no tiene ni tendrá
> generador. Lo que cambia es que el flujo tiene, desde esta tanda, un mapa **generado y
> reproducible**, como sustituto vigente: función pura en
> `packages/shared/src/mapaBlueprint.ts`, CLI en `scripts/generar-mapa-blueprint.ts`
> (`npm run generar-mapa-blueprint`), y salida en cuatro ficheros —
> `docs/artefactos/blueprint-completo.md` más una vista por cada una de las tres fases de
> M1.3.1—, con una prueba anti-desfase que se pone roja si el fichero commiteado y el grafo dejan
> de decir lo mismo (`packages/shared/src/mapaBlueprint.test.ts`). Detalle del procedimiento en
> §6.

## 4 · Cambio de alcance: las tandas `audit-*` NO regeneran este fichero

El plan `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:388` **en `a5da6b8`** decía que este
fichero «se regenera en cada tanda `audit-*`», y sus filas `:142` (F1A-05, `audit-F1A`) y `:158`
(F1B-09, `audit-F1B`) heredaban esa premisa, con talla **S** en `:412` y `:421` — **las cinco citas
son de `a5da6b8` y NO se renumeran a hoy** (caso C de la regla de mutación 4 de `CLAUDE.md`):
renumerarlas volvería falsa la frase, porque el plan de hoy dice justo lo contrario en esa fila.
Revisión nombrada el 2026-09-17, al sincronizar el plan con el libro R01.3.
`F0-00_Baseline_as-built.md:564` la repite: «para que … no se regenere sobre una cifra incorrecta».

**Es falso.** No se puede regenerar lo que no tiene generador.

> **⚠️ CORREGIDO POR F1A-05 (2026-09-09).** La versión anterior de este apartado concluía que «las
> dos tandas tienen que CONSTRUIR el generador». **No es eso.** F1A-05 se ejecutó y produjo
> `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md` —cinco hallazgos nuevos— **leyendo el código,
> sin este fichero**. Lo que eso demuestra es que había **dos trabajos** metidos en una fila:
>
> - **auditar el flujo** — no necesita el artefacto, y su talla **S** es correcta;
> - **construir el generador** del mapa visual — es una tanda propia, **sin dimensionar**, y no es
>   requisito de ninguna auditoría.
>
> Corrección al plan redactada como **entrada 4** de `docs/sdd/F0-01_Correcciones_para_el_plan.md`.

**Y para qué sirve el fichero, ya que la auditoría se sabe hacer sin él.** Lo dice el maestro en su
**Anexo F — Fuentes** (`R08.1.md:4201`), línea `:4272`:

> «Artefacto de apoyo. El mapa visual del blueprint —diagrama completo, leyenda por área y fichas de
> los hallazgos— vive como artefacto interactivo bajo el título «Blueprint de Servicio Técnico — mapa
> de transiciones». **Es la fuente gráfica de §M1.3 y se actualiza con cada auditoría del código.**»

El `<title>` de este fichero es exactamente esa cadena, así que la identificación no es inferencia.
**Es un entregable para personas con función declarada y dueño documental**, no el andamio de una
conversación de agosto: la parte que el documento de auditoría NO cubre es la visual —diagrama,
leyenda por área, fichas—, y hoy no la cubre nada más. `docs/blueprint-servicio-tecnico.md` es texto,
es anterior a la app y el maestro no lo cita.

Lo que sigue abierto no es «para qué sirve» —el Anexo F lo dice— sino **quién lo abre y con qué
frecuencia**, que es lo que decide si construir el generador merece una tanda o el artefacto se
congela como histórico. Eso es agenda de Gerencia, no de una tanda.

Es la misma clase de premisa falsa del baseline que ya se corrigió en **F0-04** («F0-04 no
crea la red de pruebas: la mide y la completa donde falta» — `openspec/changes/F0-04/proposal.md:28`).
La corrección queda registrada en `openspec/config.yaml`.
## 5 · Por qué se versiona pese al tamaño

Porque no hay generador. «Ignorarlo y regenerarlo cuando haga falta» **equivalía a
borrarlo**: sin generador no hay regeneración posible, y es el **único mapa visual del flujo
que existe**.

El coste se acota con `.gitattributes` en la raíz, que lo marca **`-diff -merge`**:

- `-diff` — cada revisión del fichero dejaría 4.432 líneas ilegibles en el diff, con líneas
  de hasta **324.772 caracteres** (59 superan los 10.000). Con `-diff`, el diff dice sólo
  que el binario cambió.
- `-merge` — un conflicto sobre una línea de ~300 KB no se resuelve a mano. Y hay **dos
  sesiones trabajando sobre este repositorio**, así que el conflicto no es hipotético: con
  `-merge`, git pide elegir una versión entera en vez de fabricar marcas de conflicto
  inservibles.

## 6 · Cómo actualizarlo hoy

**Para ESTE fichero, `blueprintserviciotecnico.html`, nada cambió: sigue sin procedimiento
automático**, y **F1A-05 no construyó el generador** — es histórico congelado (§3) y no se
regenera. Si algún día se sustituyera entero por un fichero nuevo, tocaría actualizar en esta nota
tamaño, número de líneas y fecha de generación, y retirar el aviso de caducidad (§7); pero eso no
es lo que hizo F1A-06.

**Para el mapa vigente del flujo, desde F1A-06 (2026-09-22) SÍ hay procedimiento automático, y es
éste:**

```
npm run generar-mapa-blueprint
```

Regenera los cuatro ficheros de `docs/artefactos/blueprint-*.md` (el completo y las tres vistas por
fase de M1.3.1) desde `TRANSITIONS`/`ESTADOS` en `packages/shared/src`, de forma determinista —dos
ejecuciones seguidas producen bytes idénticos—. La prueba `mapaBlueprint.test.ts` compara la salida
regenerada contra lo commiteado y falla si alguien edita uno de esos cuatro ficheros a mano o si el
grafo cambia sin volver a correr el script: no hace falta acordarse de regenerar, el CI lo impone.
El aviso de caducidad del `.html` (§7) sigue vigente y **no se retira** por esto: avisa de un
fichero distinto, que sigue congelado.

## 7 · El aviso de caducidad que lleva incrustado

Desde F1A-05 (2026-09-09), el fichero abre con un bloque rojo inmediatamente después de `<body>`, con
`id="aviso-caducidad-f1a-05"`. Dice, en la propia página, que el mapa describe el flujo **anterior**
a C1 (`ec0ed1f`), C11 (`6ea3ca8`, `5218d11`) y C9 (`e8c5e90`), que no hay generador, y a dónde ir
para leer el flujo vigente.

**Por qué va dentro del `.html` y no sólo aquí.** El riesgo no es que alguien lea esta nota y se
confunda: es que alguien **abra el mapa** y lea comportamiento que ya no existe. Una advertencia que
vive en otro fichero no protege de eso. El artefacto se abre solo; la nota, no.

**Coste, dicho para que nadie lo descubra después.** El fichero es `-diff -merge` (§5) y pesa ~898 KiB
comprimido, así que **este aviso añade un blob más de ese tamaño al historial**. Se acepta a
sabiendas: el cambio es de **1.471 bytes en la línea 1** —verificado byte a byte: todo desde la
línea 2 es idéntico— y la alternativa era dejar circulando un mapa que miente sin decirlo.

**Al regenerar, el bloque se retira entero.** No se edita ni se actualiza: el fichero nuevo ya
describirá el flujo vigente y el aviso dejaría de ser cierto.
