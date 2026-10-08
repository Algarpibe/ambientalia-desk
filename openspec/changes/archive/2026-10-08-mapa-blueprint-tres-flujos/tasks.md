# Tareas: el mapa generado del blueprint cubre los tres flujos

Cambio `mapa-blueprint-tres-flujos` (F1B-09, `cierra: no`). Desarrolla `design.md` (lotes 1, 2 y 3) y cumple
`specs/mapa-blueprint/spec.md` (RQ-MB-01 a RQ-MB-08). Trabajo sólo en el worktree
`C:\dev\Desk_2_R1.023-worktrees\mapa-blueprint-tres-flujos`; nada en `C:\dev\Desk_2_R1.023`.

**Convenciones del apply.**

- Strict TDD: cada prueba lleva una casilla de ROJO (escribirla y VERLA fallar por la razón esperada,
  anotando el mensaje en `apply-progress.md`) **antes** de su casilla de VERDE. P3 nace verde: es la guarda de
  R3, no lleva rojo, y se dice así en `apply-progress.md`.
- Todo lo nuevo de `packages/shared/src/mapaBlueprint.test.ts` va **al final** del fichero, importaciones
  incluidas, sin tocar una sola línea anterior (la prueba de `packages/shared/src/mapaBlueprint.test.ts` línea 168
  y la de línea 65 siguen como están). Se comprueba con `git diff` sin líneas borradas.
- `scripts/generar-mapa-blueprint.ts` conserva sus líneas 1 a 35 byte a byte; lo nuevo va desde la 36.
- Los ficheros nuevos de `docs/artefactos/` se generan con `npm run generar-mapa-blueprint`, nunca a mano.
- Las citas de `packages/shared/src/mapaBlueprint.ts` van ancladas a `a26ed48` (este cambio mueve sus líneas).
- Cada casilla de cierre de `npm test`, `npm run typecheck` y `npm run lint` anota el **código de salida**
  leído, uno a uno, no «verde» de memoria.
- Medida de líneas: `git diff --shortstat --no-renames a26ed48` más `wc -l` de lo nuevo sin trackear.
  Techo 800, válvula 720.
- Sin menciones a reuniones. Sin commits: el commit y el detector de citas son del orquestador.

---

## Lote 1 — Motor: campos opcionales, plantilla de cabecera, guarda condicionada (P1 a P3)

Requisitos: RQ-MB-01 (opcionales, sin función duplicada), RQ-MB-03 (cuatro ficheros de servicio intactos),
RQ-MB-04 (guarda sólo con fases). Decisiones: D1, D2, D8, D12.

- [x] L1.1 Base: confirmar que `HEAD` es `a26ed48`, que `git status` del worktree está limpio, y anotar
  `npm test`, `npm run typecheck` y `npm run lint` en verde antes de tocar nada (con código de salida y
  número de pruebas de partida).
- [x] L1.2 Leer `scripts/generar-mapa-blueprint.ts` líneas 1 a 35 y confirmar los nombres que D10 da por
  supuestos (la variable de la llamada de servicio, que el diseño llama `mapa`, y las líneas 26 a 35 no
  vacías, con la 27 ya vacía). Anotar el nombre real; si no es `mapa`, ajustar L2.17 y L2.18.
- [x] L1.3 Escribir **P3** al final de `packages/shared/src/mapaBlueprint.test.ts`, con las importaciones
  del bloque nuevo también al final: sin opcionales la salida de servicio tiene las cuatro claves de hoy; con
  los tres valores por defecto escritos explícitamente, la misma salida. **P3 nace verde** (guarda de R3, sin
  rojo): ejecutar y anotar que pasó sin código de producción nuevo.
- [x] L1.4 Comprobar que la importación tardía de la prueba la aceptan `vitest` y `eslint`
  (`npm run lint` sobre el fichero). Si alguno la rechaza, aplicar la alternativa del diseño §5 (fichero nuevo
  `packages/shared/src/mapaPorFlujo.test.ts` con importaciones normales, ajustando la cabecera de los flujos
  nuevos y la frase de `docs/artefactos/NOTA.md`) y anotarlo en `apply-progress.md`.
- [x] L1.5 ROJO **P1**: con `fases: []` y `fasePorEstado: {}` no lanza y devuelve una sola clave. Ejecutarla
  y ver que falla porque lanza la guarda D-1; anotar el mensaje.
- [x] L1.6 ROJO **P2**: con `nombreFlujo`, `nombreFicheroCompleto` y `fuentes`, la clave de salida, el título
  y la cabecera son los pedidos y no aparece `blueprint-completo.md`. Ejecutarla y ver que devuelve la clave
  y el título de servicio (o falla de tipos por los campos que aún no existen); anotar el mensaje.
- [x] L1.7 VERDE: en `packages/shared/src/mapaBlueprint.ts`, añadir a `EntradaMapa` (líneas 23-30 en
  `a26ed48`) los campos opcionales `nombreFlujo?`, `nombreFicheroCompleto?` y `fuentes?`, resueltos con `??`
  contra tres constantes con los valores de hoy (`'Servicio Técnico'`, `'blueprint-completo.md'` y la frase de
  fuentes de hoy). Títulos de las líneas 161 y 209 y clave de la línea 225 (todas en `a26ed48`).
- [x] L1.8 VERDE: pasar la cabecera de constante a función `cabeceraGenerado(fuentes)` (líneas 54-61 en
  `a26ed48`), una sola plantilla; con el valor por defecto reproduce las seis líneas de hoy.
- [x] L1.9 VERDE: guarda D-1 condicionada, `if (entrada.fases.length > 0) validarFasePorEstado(...)`
  (definición en las líneas 108-122 y llamada en la 219, ambas en `a26ed48`). Sin cambiar la función con fases.
- [x] L1.10 Ejecutar P1, P2 y P3 en verde, y la prueba de la línea 65 y la de la línea 168 de
  `packages/shared/src/mapaBlueprint.test.ts` (sin editar) en verde.
- [x] L1.11 Comprobar R4: `git diff packages/shared/src/mapaBlueprint.test.ts` no tiene ninguna línea
  borrada (`-`) y todo lo añadido está después de la antigua línea 188.
- [x] L1.12 Comprobar R3 y R2: `git diff --stat -- docs/artefactos` vacío; `packages/shared/src/cifrasAncladas.test.ts`
  sin editar (`git diff --stat` sin esa ruta) y pasando.
- [x] L1.13 Cierre: `npm test`, anotando el código de salida.
- [x] L1.14 Cierre: `npm run typecheck`, anotando el código de salida.
- [x] L1.15 Cierre: `npm run lint`, anotando el código de salida.
- [x] L1.16 Cierre: medida `git diff --shortstat --no-renames a26ed48` más `wc -l` de lo nuevo sin trackear;
  registrar la cifra (esperada ~90 de lote) contra el techo de 800 y la válvula de 720.
- [x] L1.17 Cierre: barrido de citas de la regla de mutación 4 para cada fichero editado en el lote
  (`packages/shared/src/mapaBlueprint.ts` y `packages/shared/src/mapaBlueprint.test.ts`):
  `grep -rnoE "mapaBlueprint\.ts:[0-9]+(-[0-9]+)?"` y el equivalente de `mapaBlueprint.test.ts`, cada resultado
  contra el fichero, más el pase de la forma abreviada en los ficheros que ya citan el módulo. Las del motor
  se anclan a `a26ed48` (caso B) o se reapuntan (caso A), según lo que afirme cada frase.
- [x] L1.18 Cierre: escribir `openspec/changes/mapa-blueprint-tres-flujos/apply-progress.md` con los rojos de
  P1 y P2, que P3 nació verde, las comprobaciones L1.4 y L1.10 a L1.12 y los códigos de salida.
- [ ] L1.19 Commit del lote y detector de citas: **del orquestador** (esta rama no commitea).

---

## Lote 2 — Registro por flujo, guion, dos ficheros generados, P4 a P10 y mutaciones

Requisitos: RQ-MB-01, RQ-MB-03, RQ-MB-05, RQ-MB-06, RQ-MB-08. Decisiones: D3 a D7, D9 a D11, D13.

### Esqueleto y pruebas en rojo

- [x] L2.1 Crear `packages/shared/src/mapaPorFlujo.ts` con las cuatro firmas de la interfaz del diseño
  (`estadosDelCatalogo`, `entradaMapaDelFlujo`, `mapasPorFlujo`, `ficherosDelMapa`) como esqueleto que lanza
  «no implementado». Sin él, importar un módulo inexistente rompería todo el fichero de pruebas en la recolección
  y los rojos no serían uno por prueba. Imports sólo de `flujos.ts`, `transitions.ts`, `estados.ts`,
  `fasesBlueprint.ts` y `mapaBlueprint.ts` (sin ciclos, D4).
- [x] L2.2 Añadir al final de `packages/shared/src/index.ts` una sola línea que exporte `mapaPorFlujo.ts`,
  tras la línea 39; las citas a la línea 6 de ese fichero no se mueven.
- [x] L2.3 ROJO **P4**: las claves de `mapasPorFlujo()` son las de `Object.keys(CATALOGO_POR_FLUJO)` y cada
  flujo aporta al menos un fichero. Ver que falla por «no implementado»; anotar el mensaje.
- [x] L2.4 ROJO **P5**: equipo nuevo con 5 estados en su orden (`Ingresado, En Proceso, Notificado,
  Verificación, Finalizado`), 7 aristas y un fichero con su nombre; soporte remoto con 4 estados (`Solicitud
  Soporte, En Proceso, Finalizado, Pendiente`) y 4 aristas; ninguno contiene `(sin botón)`, `·espera·` ni
  `[frontera]`; los dos llevan la leyenda de las tres áreas. Ver el rojo y anotar el mensaje.
- [x] L2.5 ROJO **P5b**: cada estado derivado enruta a su flujo con `flujoDelTicket` y la clasificación del
  flujo (enfrenta la derivación nueva con la de `packages/shared/src/flujos.ts` líneas 46-48 y 122-124).
  Ver el rojo y anotar el mensaje.
- [x] L2.6 ROJO **P5c**: la entrada de servicio del registro lleva `ESTADOS_SERVICIO` (identidad) y genera lo
  mismo que la entrada escrita a mano en `packages/shared/src/mapaBlueprint.test.ts` líneas 13-22. Ver el rojo.
- [x] L2.7 ROJO **P9**: un catálogo de un flujo nuevo con una transición hacia un estado inexistente hasta
  ahora: el estado aparece en `estados` y como nodo del mapa. Ver el rojo.
- [x] L2.8 ROJO **P10**: `ficherosDelMapa` lanza si dos flujos producen el mismo nombre; `mapasPorFlujo` lanza,
  nombrando la clave, ante un flujo sin complemento. Ver el rojo.

### Código en verde

- [x] L2.9 VERDE: `estadosDelCatalogo(catalogo)`, primera aparición recorriendo cada transición como «sus
  orígenes y luego su destino» (D6). P9 y la parte de estados de P5 y P5b, en verde.
- [x] L2.10 VERDE: `COMPLEMENTO_POR_FLUJO: Record<Flujo, ComplementoMapa>` (D5): servicio con
  `ESTADOS_SERVICIO`, `ESTADOS_SIN_SALIDA`, `FASES`, `FASE_POR_ESTADO` y los dos pasos sin botón; los dos
  flujos nuevos con `sinBoton: []`, `sinSalida: []`, `fases: []`, `fasePorEstado: {}`, `nombreFlujo`
  (`'Equipo nuevo'`, `'Soporte remoto'`), `nombreFicheroCompleto` (S-A) y `fuentes` (S-G). Sin lista de
  transiciones ni de estados escrita a mano para los flujos nuevos.
- [x] L2.11 VERDE: `entradaMapaDelFlujo(flujo, catalogo?)`. P5c en verde.
- [x] L2.12 VERDE: `mapasPorFlujo(catalogos?)` recorriendo `Object.keys(catalogos)` (R1) y lanzando, con la
  clave en el mensaje, si falta el complemento (D5). P4 y P5 en verde.
- [x] L2.13 VERDE: `ficherosDelMapa(mapas?)` aplanando todos los flujos y lanzando si dos producen el mismo
  nombre (D11). P10 en verde.

### Anti-desfase, guion y ficheros generados

- [x] L2.14 ROJO **P7**: añadiendo un fichero sintético a lo esperado, `desfases(ficheros, directorio)` devuelve
  exactamente «falta en disco» para él. Escribir la prueba con `desfases` aún sin definir; ver el rojo
  (`desfases` no existe) y anotar el mensaje.
- [x] L2.15 ROJO **P6**: `desfases(ficherosDelMapa(), directorio)` es la lista vacía y hay seis ficheros.
  Definir `desfases` en el bloque final de la prueba (D13: falta en disco, difiere, sobra en disco; lee el
  directorio y filtra `blueprint-*.md`). Ver el rojo porque faltan los dos ficheros nuevos en disco; anotar el
  mensaje. P7 pasa a verde con `desfases` definida: anotarlo.
- [x] L2.16 ROJO **P8** (`it.each`, tres): con un catálogo mutado de un flujo, el fichero completo de ese flujo
  sale en `desfases` como «difiere», contiene el **nombre** de la transición inyectada, y los ficheros de los
  otros flujos no salen. Ver el rojo si el catálogo inyectado no se propaga; si ya pasa tras L2.12, anotarlo y
  confirmar su valor con la mutación (a) de más abajo.
- [x] L2.17 Guion: dejar `scripts/generar-mapa-blueprint.ts` líneas 1 a 35 sin tocar (comprobar con
  `git diff` que no hay cambios antes de la línea 36) y añadir desde la 36 el contenido de la tabla del diseño
  §4: la importación tardía `import { ficherosDelMapa } from '@ambientalia/shared'`, `const ficheros =
  ficherosDelMapa()`, el contraste de la llamada de servicio (lanza antes de escribir si difiere del registro),
  el bucle de escritura y la línea final con `Object.keys(ficheros)`. El bloque de importación (líneas 14-24)
  no gana líneas.
- [x] L2.18 Comprobar la importación tardía del guion con `npm run lint` y ejecutando el guion con `tsx`. Si
  alguno la rechaza, aplicar la alternativa del diseño §4 (añadir `ficherosDelMapa,` a la línea 22, cero
  líneas netas, líneas citadas intactas) y anotarlo en `apply-progress.md`.
- [x] L2.19 Generar con `npm run generar-mapa-blueprint` (nunca a mano). Comprobar que aparecen
  `docs/artefactos/blueprint-equipo-nuevo.md` y `docs/artefactos/blueprint-soporte-remoto.md`.
- [x] L2.20 Comprobar R3: `git diff --stat -- docs/artefactos` muestra sólo los dos ficheros nuevos y ningún
  cambio en los cuatro de servicio.
- [x] L2.21 Comprobar el contenido de los dos ficheros nuevos: equipo nuevo 5 estados y 7 aristas, soporte
  remoto 4 y 4, leyenda de las tres áreas, sin `(sin botón)` ni `·espera·`, cabecera de generado que nombra
  fuentes reales (S-G).
- [x] L2.22 VERDE: P6, P7, P8, P9, P10, P4, P5, P5b y P5c, todas en verde; anotar el número de pruebas.

### Mutaciones (se aplican a mano, se registran en `apply-progress.md`)

Cada casilla: aplicar la mutación, ejecutar `npm test` (y `npm run typecheck` cuando la fila lo cite), **ver
el rojo**, anotar qué pruebas caen y cuántas, restaurar con `git checkout -- <fichero>` (o borrar el fichero
añadido) y comprobar con `git status` que la mutación no deja rastro. Las del catálogo de CADA uno de los tres
flujos y las del fichero vigilado de CADA flujo son obligatorias (regla de mutación 2 de `CLAUDE.md`). Antes
de empezar, listar `docs/artefactos/blueprint-fase-*.md` para fijar los nombres reales de los tres ficheros
por fase.

- [x] L2.23 Mutación **(a1)**: añadir una transición a `TRANSITIONS`, sin regenerar. Debe caer P6 en los
  ficheros de servicio, la prueba de la línea 168 de `packages/shared/src/mapaBlueprint.test.ts` y
  `packages/shared/src/cifrasAncladas.test.ts`.
- [x] L2.24 Mutación **(a2)**: cambiar el `to` de una transición de `TRANSITIONS_EQUIPO_NUEVO`, sin
  regenerar. Debe caer P6 en `docs/artefactos/blueprint-equipo-nuevo.md` (y P5 por las cifras).
- [x] L2.25 Mutación **(a3)**: quitar una transición de `TRANSITIONS_SOPORTE_REMOTO`, sin regenerar. Debe
  caer P6 en `docs/artefactos/blueprint-soporte-remoto.md` (y P5).
- [x] L2.26 Mutación **(b)** 1 de 6: ensuciar a mano `docs/artefactos/blueprint-completo.md`. Deben caer la
  prueba de la línea 168 de `packages/shared/src/mapaBlueprint.test.ts` y P6.
- [x] L2.27 Mutación **(b)** 2 de 6: ensuciar a mano el primer `docs/artefactos/blueprint-fase-*.md`. Deben
  caer la prueba de la línea 168 y P6.
- [x] L2.28 Mutación **(b)** 3 de 6: ídem con el segundo `docs/artefactos/blueprint-fase-*.md`.
- [x] L2.29 Mutación **(b)** 4 de 6: ídem con el tercero.
- [x] L2.30 Mutación **(b)** 5 de 6: ensuciar a mano `docs/artefactos/blueprint-equipo-nuevo.md`. Debe caer P6.
- [x] L2.31 Mutación **(b)** 6 de 6: ensuciar a mano `docs/artefactos/blueprint-soporte-remoto.md`. Debe caer P6.
- [x] L2.32 Mutación **(b′)**: dejar en `docs/artefactos/` un `blueprint-sobra.md` que ningún flujo genera.
  Debe caer P6 con «sobra en disco». Restaurar borrando el fichero.
- [x] L2.33 Mutación **(c)**: quitar la llamada a la guarda habiendo fases. Debe caer la prueba de la
  línea 65 de `packages/shared/src/mapaBlueprint.test.ts`.
- [x] L2.34 Mutación **(d)**: hacer la guarda incondicional. Deben caer P1 y, porque los flujos nuevos dejan de
  generarse, P4, P5 y P6.
- [x] L2.35 Mutación **(e)**: añadir una clave a `Flujo` y a `CATALOGO_POR_FLUJO` sin complemento ni fichero.
  Debe fallar `npm run typecheck` en `COMPLEMENTO_POR_FLUJO` y en `packages/shared/src/flujos.ts` líneas
  127-131, y en `npm test` P4 y P6 por el `throw` de D5. Segunda pasada, con complemento y sin regenerar: P6,
  «falta en disco».
- [x] L2.36 Mutación **(f)**: sustituir en el registro la derivación de un flujo nuevo por su lista de estados
  escrita. Debe caer **sólo P9**; anotar que P5 y P6 siguen verdes (es la razón de que P9 sea obligatoria).
- [x] L2.37 Mutación **(g)**: quitar el `throw` de colisión de nombres de `ficherosDelMapa`. Debe caer P10.
- [x] L2.38 Tras todas las mutaciones: `git status` y `git diff --stat` coinciden con lo esperado del lote
  (sin restos de mutaciones) y los ficheros generados siguen idénticos a su regeneración (`npm run
  generar-mapa-blueprint` no deja diff).

### Cierre del lote 2

- [x] L2.39 Comprobar R4 de nuevo: `git diff packages/shared/src/mapaBlueprint.test.ts` sin líneas borradas y
  todo lo nuevo, importaciones incluidas, al final.
- [x] L2.40 Comprobar R5: `git diff scripts/generar-mapa-blueprint.ts` sin cambios antes de la línea 36; las
  líneas 26 a 35 siguen no vacías.
- [x] L2.41 Cierre: `npm test`, anotando el código de salida.
- [x] L2.42 Cierre: `npm run typecheck`, anotando el código de salida.
- [x] L2.43 Cierre: `npm run lint`, anotando el código de salida (incluye el guion).
- [x] L2.44 Punto de control del diseño: medir `git diff --shortstat --no-renames a26ed48` más `wc -l` de lo
  nuevo sin trackear (los dos ficheros generados y `mapaPorFlujo.ts` cuentan). Esperado ~475 con el progreso
  escrito hasta ahí; **si supera 620, el lote 3 pasa a un intento propio** (parar y avisar al orquestador).
- [x] L2.45 Cierre: barrido de citas de la regla de mutación 4 para cada fichero editado en el lote
  (`packages/shared/src/index.ts`, `packages/shared/src/mapaBlueprint.test.ts`,
  `scripts/generar-mapa-blueprint.ts`, `packages/shared/src/mapaBlueprint.ts`): cada resultado del grep contra el
  fichero, leyendo qué afirma la frase; rangos por los dos extremos; pase de la forma abreviada.
- [x] L2.46 Cierre: actualizar `apply-progress.md` con los rojos P4 a P10, los quince rojos de mutación (qué
  pruebas caen y cuántas), las alternativas de importación tardía si se aplicaron y los códigos de salida.
- [ ] L2.47 Commit del lote y detector de citas: **del orquestador**.

---

## Lote 3 — Cierre documental (todo en sitio, sin mover líneas)

Requisitos: RQ-MB-03 (nota de `docs/artefactos/NOTA.md`), cierre de la regla de mutación 4. Decisiones: S-H.

- [x] L3.1 `docs/artefactos/NOTA.md` líneas 135-139: reescribir **en sitio, cinco líneas por cinco**
  («seis ficheros», los dos nombres nuevos y «desde `CATALOGO_POR_FLUJO`»), a cero líneas netas. No tocar el
  bloque fechado de `docs/artefactos/NOTA.md` líneas 48-59 (caso B). Comprobar con `git diff --stat` el mismo
  número de líneas.
- [x] L3.2 `packages/shared/src/estados.ts` líneas 176-180: precisar «mapa generado de servicio» y mencionar
  su mapa propio, **cinco líneas por cinco**, a cero líneas netas; la línea 182 no se mueve. Comprobar con
  `git diff --stat`.
- [x] L3.3 `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md`: anclar a `a26ed48` **dentro de su línea**, sin
  añadir líneas, las citas de las líneas 30, 31, 33, 249 y 283, y la de la 35 si se aplicó S-H (la nota de
  «superado por este cambio» va en la misma línea). La línea 310 de ese fichero, citada desde `CLAUDE.md`, no
  se mueve. Comprobar con `git diff --stat` que el número de líneas del fichero no cambia.
- [x] L3.4 `openspec/changes/mapa-blueprint-tres-flujos/proposal.md`: anclar a `a26ed48`, en sitio, sus citas
  de `packages/shared/src/mapaBlueprint.ts` (ocho pasajes según el diseño §6).
- [x] L3.5 Añadir **al final** de `docs/sdd/Paquete_de_Despliegue_2026-10-08.md` un apartado nuevo, el 4:
  qué entra (motor, `mapaPorFlujo.ts`, guion, dos mapas generados, pruebas); que **no hay esquema, ni variables
  de entorno, ni relleno de datos**; y lo que queda para Supervisión: marcar E-222 como resuelta y anclar al
  guion y a la prueba las citas sin ancla de `openspec/config.yaml` y `docs/sdd/ENTRADA.md`. No tocar los
  apartados anteriores.
- [x] L3.6 Comprobar que la rama **no** toca `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`
  (`git diff --stat a26ed48 -- openspec/config.yaml docs/sdd/ENTRADA.md` vacío).
- [x] L3.7 Comprobar `git diff --stat -- docs/artefactos`: sólo los dos ficheros nuevos y `NOTA.md`; los
  cuatro de servicio sin cambios.
- [x] L3.8 Cierre: `npm test`, anotando el código de salida.
- [x] L3.9 Cierre: `npm run typecheck`, anotando el código de salida.
- [x] L3.10 Cierre: `npm run lint`, anotando el código de salida.
- [x] L3.11 Cierre: medida final `git diff --shortstat --no-renames a26ed48` más `wc -l` de lo nuevo sin
  trackear, incluido `apply-progress.md`; registrar frente a techo 800 y válvula 720 (estimación ~565).
- [x] L3.12 Cierre: barrido de citas de la regla de mutación 4 para cada fichero editado en el lote
  (`docs/artefactos/NOTA.md`, `packages/shared/src/estados.ts`,
  `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md`, `docs/sdd/Paquete_de_Despliegue_2026-10-08.md`,
  `openspec/changes/mapa-blueprint-tres-flujos/proposal.md`): grep de cada fichero, cada resultado contra el
  fichero, rangos por los dos extremos y pase de la forma abreviada.
- [x] L3.13 Cierre: completar `apply-progress.md` (rojos, mutaciones, medidas por lote, alternativas aplicadas,
  códigos de salida, y una línea de qué parte de F1B-09 cubrió el cambio y qué dejó fuera, para el
  `archive-report.md`).
- [ ] L3.14 Commit final, detector de citas, `verify` y archivo: **del orquestador**.

---

## Tareas de personas — FUERA del recuento

Regla del ciclo 1. Estas tareas no tienen casilla: su dueño está fuera del repositorio y ninguna tanda las
marca. **Archivar el cambio NO las da por hechas.** Ninguna describe trabajo que esta rama pueda hacer en el
repositorio (la rama no toca `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`). Quedan escritas en
`openspec/changes/mapa-blueprint-tres-flujos/proposal.md` §15 y se repiten en el apartado 4 de
`docs/sdd/Paquete_de_Despliegue_2026-10-08.md` (las dos primeras).

| Nº | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| T-P1 | Marcar E-222 como resuelta y anclar las citas sin ancla de `openspec/config.yaml` y `docs/sdd/ENTRADA.md` al guion y a la prueba | Supervisión | `docs/sdd/ENTRADA.md` y `openspec/config.yaml`, en `main` | Proposal §10 y §15; apartado 4 del paquete de despliegue |
| T-P2 | Añadir a la corrección de M11.6 (E-230) que el mapa generado cubre los tres flujos | Gerencia | Expediente del maestro | Proposal §15; apartado 4 del paquete de despliegue |
| T-P3 | Situar E-223, E-224, E-226, E-227 y E-228, que siguen sin decisión | Gerencia | `docs/sdd/ENTRADA.md` (regla R-3) | Proposal §2 y §15 |
| T-P4 | Actualizar las notas de pendientes de las specs de equipo nuevo y soporte remoto que remiten a F1B-09 | Supervisión, con el cambio de F1B-08 | Ese cambio | Proposal §3 y §15 |
| T-P5 | Revisar a la vista los dos mapas nuevos renderizados | Analista, antes de fusionar | Parte de la tanda | Proposal §15 |

---

## Resumen de casillas

| Lote | Casillas | De ellas, del orquestador |
|---|---|---|
| 1 | 19 (L1.1 a L1.19) | 1 |
| 2 | 47 (L2.1 a L2.47) | 1 |
| 3 | 14 (L3.1 a L3.14) | 1 |
| **Total** | **80** | 3 |
