# Diseño: el mapa generado del blueprint cubre los tres flujos

Cambio `mapa-blueprint-tres-flujos` (F1B-09, `cierra: no`). Desarrolla el enfoque A de la propuesta.
Las citas de `packages/shared/src/mapaBlueprint.ts` van ancladas a `a26ed48` porque este cambio mueve
sus líneas (**hipótesis:** el worktree parte de ese commit; lo afirma la propuesta y no se ha podido
ejecutar `git`). Nada de este documento se ha ejecutado: lo que depende de ejecutar lleva «hipótesis».

## 1. Enfoque técnico

Tres piezas, de dentro afuera:

    CATALOGO_POR_FLUJO ──► mapaPorFlujo.ts (nuevo, puro) ──► mapaBlueprint.ts (motor, puro)
      (flujos.ts)            entradaMapaDelFlujo                generarMapaBlueprint
                             mapasPorFlujo / ficherosDelMapa
                                   │
                    ┌──────────────┴──────────────┐
          scripts/generar-mapa-blueprint.ts   mapaBlueprint.test.ts (bloque nuevo, al final)
          (escribe a disco)                   (lee disco y compara)

El motor no aprende qué es un flujo: sólo gana tres campos opcionales y una guarda condicionada. El
conocimiento de «qué flujos hay» vive en un fichero nuevo, que es lo único que el guion y la prueba
consumen para escribir y para comparar.

## 2. Decisiones

| Nº | Decisión | Descartado | Razón |
|---|---|---|---|
| D1 | `EntradaMapa` gana tres campos opcionales: `nombreFlujo?: string`, `nombreFicheroCompleto?: string`, `fuentes?: string`. Se resuelven con `??` contra tres constantes: `'Servicio Técnico'`, `'blueprint-completo.md'` y la frase de fuentes de hoy | Un campo `titulo` con la frase entera; una segunda función generadora; un objeto `opciones` aparte | La spec del delta nombra «nombre del flujo y nombre del fichero completo». Con los valores por defecto, el título (`packages/shared/src/mapaBlueprint.ts:161` en `a26ed48`, `packages/shared/src/mapaBlueprint.ts:209` en `a26ed48`), la clave de salida (`packages/shared/src/mapaBlueprint.ts:225` en `a26ed48`) y la cabecera (`packages/shared/src/mapaBlueprint.ts:54-61` en `a26ed48`) salen byte a byte iguales. `packages/shared/src/cifrasAncladas.test.ts:45-55` sigue compilando sin editarse |
| D2 | La cabecera pasa de constante a función `cabeceraGenerado(fuentes)`: una sola plantilla, cuya segunda línea es dos espacios, `fuentes` y el texto fijo de hoy | Dos cabeceras escritas enteras (S-G al pie de la letra) | Una plantilla no puede divergir de sí misma; con el valor por defecto reproduce las seis líneas actuales. La guarda de bytes es la prueba existente de `packages/shared/src/mapaBlueprint.test.ts:168`, sin tocarla |
| D3 | El registro por flujo vive en un fichero nuevo, `packages/shared/src/mapaPorFlujo.ts`, exportado con una línea añadida tras `packages/shared/src/index.ts:39` | Ponerlo en `mapaBlueprint.ts`; ponerlo en `flujos.ts` | En `mapaBlueprint.ts` obligaría al motor a importar `flujos.ts`, dependencia que hoy no existe y que el comentario de `packages/shared/src/estados.ts:176-180` da por inexistente. `flujos.ts` es un fichero citado por línea y su asunto es el enrutado, no el dibujo |
| D4 | Sin ciclos: el fichero nuevo importa `flujos.ts`, `transitions.ts`, `estados.ts`, `fasesBlueprint.ts` y `mapaBlueprint.ts`; ninguno de los cinco lo importa a él | — | Comprobado por lectura: `packages/shared/src/flujos.ts:6-7` importa sólo `ticketCreate.ts` y `transitions.ts`; `mapaBlueprint.ts` importa `transitions.ts` y un tipo de `fasesBlueprint.ts`; `fasesBlueprint.ts` importa un tipo de `estados.ts`; `estados.ts`, `ticketCreate.ts` y `transitions.ts` no tienen ninguna sentencia de importación |
| D5 | Lo que el catálogo no puede dar se declara en una tabla `COMPLEMENTO_POR_FLUJO: Record<Flujo, ComplementoMapa>`; además, `mapasPorFlujo` lanza si una clave del catálogo no tiene complemento | Un `switch` sobre el flujo; una tabla `Record<string, …>` | Un cuarto miembro de `Flujo` rompe `tsc` en esta tabla, igual que en `packages/shared/src/flujos.ts:127-131`. El `throw` cubre a quien ejecute sin compilar (`vitest` no comprueba tipos) |
| D6 | Estados de equipo nuevo y soporte remoto: `estadosDelCatalogo(catalogo)`, primera aparición recorriendo cada transición como «sus orígenes y luego su destino» | Filtrar `ESTADOS` (`packages/shared/src/estados.ts:112`) por pertenencia; orden alfabético; lista escrita | Es la misma expresión con que `flujos.ts` decide qué estados son del catálogo (`packages/shared/src/flujos.ts:46-48`, `packages/shared/src/flujos.ts:122-124`), y da el orden del recorrido: `Ingresado, En Proceso, Notificado, Verificación, Finalizado` y `Solicitud Soporte, En Proceso, Finalizado, Pendiente` (leído en `packages/shared/src/transitions.ts:350-363` y `packages/shared/src/transitions.ts:388-397`). Filtrar `ESTADOS` daría el orden de clasificación de esperas, que no es el del flujo |
| D7 | Servicio no se deriva: su complemento lleva `ESTADOS_SERVICIO`, `ESTADOS_SIN_SALIDA`, `FASES`, `FASE_POR_ESTADO` y los dos pasos sin botón; sin campos opcionales | Derivarlo como los otros | Derivarlo cambiaría los alias `eNN` y con ellos los cuatro ficheros (R3) |
| D8 | Guarda de fase: `if (entrada.fases.length > 0) validarFasePorEstado(...)`. Con fases, la función no cambia | Condicionar por `fasePorEstado` vacío; validar siempre y tolerar el vacío dentro | Las vistas por fase son lo único que lee `fasePorEstado`; sin fases no se genera ninguna. La condición sobre `fases` es la que la prueba puede mutar en los dos sentidos |
| D9 | Guion: líneas 1 a 35 **idénticas byte a byte**; la importación nueva va **después** de la línea 35 | Añadir el nombre a una línea existente del bloque de importación (queda como alternativa) | Ver §4 |
| D10 | El guion escribe lo que devuelve `ficherosDelMapa()` (los seis). La llamada de servicio de `scripts/generar-mapa-blueprint.ts:28-35` se conserva y pasa a ser **contraste**: si su salida difiere de la del registro, el guion lanza antes de escribir | Escribir servicio desde esa llamada y sólo los nuevos desde el registro; dejar la llamada sin uso | La primera deja dos construcciones de servicio sin enfrentar (molde H5); la segunda es código muerto y `eslint` lo marca. El contraste convierte la duplicación obligada en una comprobación |
| D11 | `ficherosDelMapa` aplana los mapas de todos los flujos y **lanza si dos flujos producen el mismo nombre** | Dejar que el último gane | Un flujo nuevo sin `nombreFicheroCompleto` heredaría `blueprint-completo.md` y pisaría el de servicio en silencio: es el coste del valor por defecto de D1 |
| D12 | Pruebas nuevas al final de `packages/shared/src/mapaBlueprint.test.ts`, tras `packages/shared/src/mapaBlueprint.test.ts:188`, **con sus importaciones también al final** | Fichero de pruebas nuevo; importaciones arriba | Arriba desplazarían las líneas 46 y 168, citadas sin ancla. Un fichero nuevo obligaría a que la cabecera generada nombrara otra prueba. Ver §5 |
| D13 | La comparación con disco es una función de la prueba, `desfases(ficheros, directorio)`, que devuelve la lista de discrepancias: falta en disco, difiere, o sobra en disco (lee el directorio y filtra `blueprint-*.md`) | Un mapa fijo nombre → ruta como el de hoy | El mapa fijo es una segunda lista de ficheros: un flujo nuevo quedaría fuera sin rojo. Leer el directorio hace la prueba exhaustiva en los dos sentidos y permite P7 sin tocar disco |

### Interfaz del fichero nuevo

```ts
type ComplementoMapa = Omit<EntradaMapa, 'transiciones' | 'estados'> & { estados?: readonly string[] }

export function estadosDelCatalogo(catalogo: readonly Transition[]): string[]
export function entradaMapaDelFlujo(flujo: Flujo, catalogo?: readonly Transition[]): EntradaMapa
export function mapasPorFlujo(catalogos?: Readonly<Record<Flujo, readonly Transition[]>>): Record<Flujo, Record<string, string>>
export function ficherosDelMapa(mapas?: Readonly<Record<string, Record<string, string>>>): Record<string, string>
```

`mapasPorFlujo` recorre `Object.keys(catalogos)` (R1); los parámetros por defecto son
`CATALOGO_POR_FLUJO[flujo]`, `CATALOGO_POR_FLUJO` y `mapasPorFlujo()`. Los parámetros existen para que
la prueba inyecte un catálogo mutado sin tocar disco. Complemento de los flujos nuevos: `sinBoton: []`,
`sinSalida: []`, `fases: []`, `fasePorEstado: {}`, `nombreFlujo` (`'Equipo nuevo'`, `'Soporte remoto'`,
los textos de `packages/shared/src/flujos.ts:29` y `packages/shared/src/flujos.ts:113`),
`nombreFicheroCompleto` (S-A) y `fuentes` (el catálogo de `transitions.ts` vía `CATALOGO_POR_FLUJO`).

## 3. Guarda de fase

Hoy la guarda (`packages/shared/src/mapaBlueprint.ts:108-122` en `a26ed48`) se llama siempre
(`packages/shared/src/mapaBlueprint.ts:219` en `a26ed48`) y, con `fasePorEstado` vacío, lanza para el
primer estado: leído, no ejecutado. Con D8 se ejecuta sólo con fases declaradas; con fases sigue
lanzando, y lo sigue probando `packages/shared/src/mapaBlueprint.test.ts:65` sin editarse.

## 4. El guion, línea a línea

**Lo que se conserva.** Las líneas 1 a 35 no cambian ni un byte. De ellas están citadas sin ancla,
desde ficheros que la rama no edita, la 28, la 29, la 31 y el rango de la 28 a la 31; la auditoría cita
además el rango de la 28 a la 35. **Precisión sobre el encargo:** la línea 27 **ya está vacía hoy** y
ninguna cita cae en ella, así que «de la 26 a la 35, no vacías» se cumple en todo lo citado y la 27
queda como está. La línea 26 (`scripts/generar-mapa-blueprint.ts:26`) también se conserva.

**El bloque de importación no gana líneas** (`scripts/generar-mapa-blueprint.ts:14-24`): un nombre más
en su propia línea bajaría una posición todo lo citado. Se resuelve con una segunda sentencia de
importación después de la línea 35. En ESM las importaciones se elevan, así que es válido en cualquier
punto del módulo. **Hipótesis (no ejecutada):** `eslint` lo acepta —`eslint.config.js:17-33` no carga
ninguna regla de orden de importaciones ni `no-duplicate-imports`— y `tsx` lo ejecuta. `scripts/` no
entra en `npm run typecheck` (`tsconfig.json:3-7` sólo referencia `apps/`), así que su comprobación es
`npm run lint` más ejecutar el guion. **Alternativa si falla:** añadir `ficherosDelMapa,` a la línea 22,
junto a `generarMapaBlueprint,`; cero líneas netas y las citadas intactas, a cambio de un diff antes de
la línea 36.

Contenido propuesto desde la línea 36 (las líneas 1 a 35, las de hoy):

| Línea | Contenido |
|---|---|
| 36 | *(vacía, como hoy)* |
| 37 | ``// F1B-09 (`mapa-blueprint-tres-flujos`): lo que se ESCRIBE sale del registro por flujo de`` |
| 38 | ``// `packages/shared` (`mapaPorFlujo.ts`), el mismo que compara la prueba anti-desfase. Esta`` |
| 39 | `// importación va aquí, y no en el bloque de arriba, para no mover las líneas 26 a 35: están` |
| 40 | ``// citadas por número desde ficheros que esta tanda no edita (regla de mutación 4 de `CLAUDE.md`).`` |
| 41 | `import { ficherosDelMapa } from '@ambientalia/shared'` |
| 42 | *(vacía)* |
| 43 | `const ficheros = ficherosDelMapa()` |
| 44 | *(vacía)* |
| 45 | `// La llamada de servicio de arriba queda como contraste, no como fuente: si deja de decir lo` |
| 46 | `// mismo que el registro, se para aquí, antes de escribir nada.` |
| 47 | `for (const [nombre, contenido] of Object.entries(mapa)) {` |
| 48 | `  if (ficheros[nombre] !== contenido) {` |
| 49 | ``    throw new Error(`generar-mapa-blueprint: ${nombre} difiere entre la llamada de servicio y el registro por flujo`)`` |
| 50 | `  }` |
| 51 | `}` |
| 52 | *(vacía)* |
| 53 | `const raiz = process.cwd()` |
| 54 | `for (const [nombre, contenido] of Object.entries(ficheros)) {` |
| 55 y 56 | *(las dos líneas de comentario de hoy sobre la redirección de shell, sin cambios)* |
| 57 | `  writeFileSync(path.join(raiz, 'docs/artefactos', nombre), contenido, 'utf8')` |
| 58 | `}` |
| 59 | *(vacía)* |
| 60 | La línea final de hoy, con `Object.keys(ficheros)` en lugar de `Object.keys(mapa)` |

Comprobación: de la 26 a la 35 todo lo citado tiene texto y dice lo mismo, porque no se toca. El guion
sigue sin construir datos del grafo: pasa referencias, compara cadenas y escribe.

## 5. Pruebas: dónde van

Todo lo nuevo va **después** de `packages/shared/src/mapaBlueprint.test.ts:188`; el diff de ese fichero
no tiene ninguna línea borrada. El bloque RQ-MB-06 existente
(`packages/shared/src/mapaBlueprint.test.ts:154-178`) **sigue como está**: vigila los cuatro ficheros de
servicio desde la entrada construida a mano de `packages/shared/src/mapaBlueprint.test.ts:13-22`. Lo
nuevo, al final, cubre los tres flujos desde el registro, y una aserción enfrenta las dos
construcciones de servicio (P5c). Las importaciones nuevas (`readdirSync`, `flujos.ts`,
`mapaPorFlujo.ts`, los dos catálogos) abren el bloque nuevo. **Hipótesis:** `vitest` y `eslint` aceptan
la importación tardía, por lo mismo que en §4. **Alternativa:** fichero nuevo
`packages/shared/src/mapaPorFlujo.test.ts` con importaciones normales; obliga a que la cabecera de los
flujos nuevos nombre esa prueba y a ajustar la frase de `docs/artefactos/NOTA.md`.

## 6. Ficheros

| Fichero | Acción | Citas completas fuera de `archive` | Cómo no se desplazan |
|---|---|---|---|
| `packages/shared/src/mapaBlueprint.ts` | Modificar | 0 fuera de este cambio; la propuesta cita ocho pasajes | Sus líneas se mueven: las citas de la propuesta se anclan a `a26ed48` en el lote 3 |
| `packages/shared/src/mapaPorFlujo.ts` | Crear | — | — |
| `packages/shared/src/index.ts` | Modificar | 1, a la línea 6 | Una línea añadida al final |
| `packages/shared/src/mapaBlueprint.test.ts` | Modificar | 3, a las líneas 46 y 168 | Sólo se añade al final, importaciones incluidas |
| `scripts/generar-mapa-blueprint.ts` | Modificar | 7, todas entre las líneas 28 y 35 | Líneas 1 a 35 idénticas |
| `docs/artefactos/blueprint-equipo-nuevo.md`, `docs/artefactos/blueprint-soporte-remoto.md` | Crear (generados por el guion, nunca a mano) | — | — |
| `docs/artefactos/NOTA.md` | Modificar | 11, todas hasta la línea 56 | `docs/artefactos/NOTA.md:135-139` se reescribe en sitio, cinco líneas por cinco: «seis ficheros», los dos nombres nuevos y «desde `CATALOGO_POR_FLUJO`». El bloque fechado de `docs/artefactos/NOTA.md:48-59` no se toca (caso B) |
| `packages/shared/src/estados.ts` | Modificar | 95 | `packages/shared/src/estados.ts:176-180` en sitio, cinco líneas por cinco: «mapa generado de servicio» y la mención de su mapa propio. `packages/shared/src/estados.ts:182` no se mueve |
| `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` | Modificar | 1 desde fuera (`CLAUDE.md`, a su línea 310) | Las seis citas se anclan a `a26ed48` **dentro de su línea**; la nota de «superado por este cambio» va en la misma línea. Una línea añadida desplazaría la 310 |
| `openspec/changes/mapa-blueprint-tres-flujos/proposal.md` | Modificar | — | Anclar a `a26ed48` sus citas de `mapaBlueprint.ts`, en sitio |

No se tocan `flujos.ts`, `transitions.ts`, `fasesBlueprint.ts`, `cifrasAncladas.test.ts`,
`openspec/config.yaml` ni `docs/sdd/ENTRADA.md`.

## 7. Plan de pruebas (strict TDD)

| Nº | Prueba (todas en el bloque final) | Rojo previo |
|---|---|---|
| P1 | Con `fases: []` y `fasePorEstado: {}` no lanza y devuelve una sola clave | Lanza la guarda |
| P2 | Con `nombreFlujo`, `nombreFicheroCompleto` y `fuentes`, la clave, el título y la cabecera son los pedidos, y no aparece la clave por defecto | Devuelve `blueprint-completo.md` con el título de servicio |
| P3 | Sin opcionales: las cuatro claves; con los tres valores por defecto escritos, la misma salida | Verde desde el principio: guarda de R3, no lleva rojo |
| P4 | Las claves de `mapasPorFlujo()` son las de `CATALOGO_POR_FLUJO` y cada flujo aporta al menos un fichero | La función no existe |
| P5 | Equipo nuevo: los 5 estados en su orden, 7 aristas, un fichero con su nombre. Soporte remoto: 4 y 4. Ninguno contiene `(sin botón)`, `·espera·` ni `[frontera]`; los dos llevan la leyenda de tres áreas | La función no existe |
| P5b | Cada estado derivado enruta a su flujo con `flujoDelTicket` y la clasificación del flujo: enfrenta la derivación nueva con la de `flujos.ts` | La función no existe |
| P5c | La entrada de servicio del registro lleva `ESTADOS_SERVICIO` (identidad) y genera lo mismo que la entrada escrita a mano de la prueba | La función no existe |
| P6 | `desfases(ficherosDelMapa(), directorio)` es la lista vacía; hay seis ficheros | Faltan dos ficheros en disco |
| P7 | Añadiendo un fichero sintético a lo esperado, `desfases` devuelve exactamente «falta en disco» para él | `desfases` no existe |
| P8 | Catálogo mutado, una prueba por flujo (`it.each`, tres): el fichero completo de ese flujo sale en `desfases` como «difiere», contiene el **nombre** de la transición inyectada, y los ficheros de los otros flujos no salen | La función no existe |
| P9 | Catálogo de un flujo nuevo con una transición hacia un estado inexistente hasta ahora: el estado aparece en `estados` y como nodo del mapa | La función no existe |
| P10 | `ficherosDelMapa` lanza si dos flujos producen el mismo nombre; `mapasPorFlujo` lanza, nombrando la clave, ante un flujo sin complemento | La función no existe |

### Mutaciones a reproducir a mano (se registran en `apply-progress.md`)

| Nº | Mutación | Prueba que cae |
|---|---|---|
| (a1) | Añadir una transición a `TRANSITIONS`, sin regenerar | P6 en los ficheros de servicio; también la existente de `packages/shared/src/mapaBlueprint.test.ts:168` y `cifrasAncladas.test.ts` |
| (a2) | Cambiar el `to` de una transición de `TRANSITIONS_EQUIPO_NUEVO`, sin regenerar | P6 en `blueprint-equipo-nuevo.md` (y P5 por las cifras) |
| (a3) | Quitar una transición de `TRANSITIONS_SOPORTE_REMOTO`, sin regenerar | P6 en `blueprint-soporte-remoto.md` (y P5) |
| (b) ×6 | Ensuciar un fichero vigilado por ejecución | Los cuatro de servicio: la existente de la línea 168 **y** P6. Los dos nuevos: P6 |
| (b′) | Dejar en `docs/artefactos/` un `blueprint-sobra.md` que ningún flujo genera | P6, «sobra en disco» |
| (c) | Quitar la llamada a la guarda habiendo fases | La existente de `packages/shared/src/mapaBlueprint.test.ts:65` |
| (d) | Hacer la guarda incondicional | P1; y P4, P5 y P6, porque los flujos nuevos dejan de generarse |
| (e) | Clave nueva en `Flujo` y en `CATALOGO_POR_FLUJO`, sin complemento ni fichero | `tsc` en `COMPLEMENTO_POR_FLUJO` y en `packages/shared/src/flujos.ts:127-131`; en `npm test`, P4 y P6 por el `throw` de D5. Con complemento y sin regenerar: P6, «falta en disco» |
| (f) | Sustituir en el registro la derivación de un flujo nuevo por su lista de estados escrita | **Sólo P9.** Con datos reales la lista escrita coincide, y P5 y P6 siguen verdes: por eso P9 es obligatoria |
| (g) | Quitar el `throw` de colisión de nombres | P10 |

## 8. Lotes y estimación

| Lote | Contenido | Líneas |
|---|---|---|
| 1 | Motor: tres campos, plantilla de cabecera, guarda condicionada (~32); P1 a P3 (~55) | ~90 |
| 2 | `mapaPorFlujo.ts` (~95), `index.ts` (1), guion (~20), dos ficheros generados (~60), P4 a P10 (~140) | ~315 |
| 3 | Cierre: `NOTA.md` (10), `estados.ts` (10), auditoría (12), anclas de la propuesta (~16) | ~50 |
| — | `apply-progress.md`: rojos y dieciséis ejecuciones de mutación | ~110 |
| | **Total** | **~565** |

Un solo intento, bajo la válvula de 720. Punto de control: medir al cerrar el lote 2 (esperado ~475 con
el progreso escrito hasta ahí); si la medida supera 620, el lote 3 pasa a un intento propio.

## 9. Matriz de amenazas

No aplica: no hay enrutado, comandos de shell, subprocesos, automatización de VCS ni clasificación de
ejecutables. El guion sigue escribiendo en `docs/artefactos/` con nombres que salen de constantes.

## 10. Migración

Ninguna. Sin esquema, datos ni configuración de despliegue.

## 11. Puntos abiertos

- [ ] **Tensión entre la spec del delta y R5.** RQ-MB-01 del delta dice que la CLI no construye la
  entrada de ningún flujo; R5 obliga a conservar la llamada de servicio del guion. D10 la deja como
  contraste y escribe desde el registro. Conviene que la spec lo diga así, o que las tareas lo anoten.
- [ ] Cuando Supervisión ancle las citas sin ancla (T-P1), la llamada de servicio del guion y el
  contraste pueden retirarse en un cambio posterior.
- [ ] Las dos importaciones tardías (guion y prueba) son hipótesis hasta ejecutar `npm run lint` y
  `npm test`; cada una tiene su alternativa escrita (§4, §5).
- [ ] El nombre del flujo se escribe en dos sitios: `COMPLEMENTO_POR_FLUJO` y la tabla privada de
  `packages/shared/src/flujos.ts:127-131`. Unificarlos exige exportar esa tabla; se deja fuera.
