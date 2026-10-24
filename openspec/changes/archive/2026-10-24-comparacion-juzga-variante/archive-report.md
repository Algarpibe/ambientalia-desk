# Informe de archivo — `comparacion-juzga-variante` (F1F-05, `cierra: no`)

Archivado el 2026-10-24 en la rama `comparacion-juzga-variante` (worktree hermano, base `e1a92b59`), **sin fusionar a `main`**: la tanda
para antes de fusionar. Lo escribe el orquestador con cifras medidas; `apply-progress.md` y `verify-report.md` son instantáneas de su
momento, y este informe manda sobre ellas donde difieran.

**Fila F1F-05:** cubre que la comparación con Zoho juzgue el 95 % con la variante de la fórmula de Zoho, por indicador y por ticket, y que
la pantalla la enseñe primero (`decision/f1f05-variante-juzga-el-95`); deja fuera la encuesta de satisfacción (55), que depende de la
salida de correo de 1H-01, y la medición en paralelo del 16/11 al 14/12, que es trabajo de personas. Por eso `cierra: no`.

## 1. Qué queda construido

- **Lectura por ticket de las dos lecturas** en `packages/shared/src/indicadoresComparacion.ts`: `ticketsVariante` junto a `tickets` en la
  misma línea 45; un mapa por lectura y `lecturaPorTicket` al final del fichero (`packages/shared/src/indicadoresComparacion.ts:120`). El
  criterio es el de siempre: comparado con al menos un par comparable, coincidente si coinciden todos. `tickets` sigue siendo la letra.
- **Nota nueva** (`NOTA_PORCENTAJES`, `packages/shared/src/indicadoresComparacion.ts:10`): el 95 % se juzga con la variante de la fórmula de
  Zoho, por indicador y por ticket; la letra es informativa y sus diferencias se explican por definición; la aplicación no decide si se
  aprueba. Sin umbral, semáforo ni veredicto.
- **Vista del cliente** (`apps/desk/src/lib/comparacionExportacion.ts:70`): dos tablas en orden, la variante primero con el rótulo
  `ROTULO_VARIANTE` (`apps/desk/src/lib/comparacionExportacion.ts:87`) y la letra después con `ROTULO_LETRA` (`:88`). En la tabla de la
  variante un porcentaje `null` se pinta con `MENSAJE_SIN_PARES`, importado de shared; en la de la letra sigue «—». El `.tsx` sólo recorre
  la lista (+14 −9, sin lógica).
- **Aceptación de septiembre por el `POST`** en `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts` (fichero nuevo): fixture
  sembrado con «ID» de dieciocho dígitos (el lector rechaza los no numéricos; `sembrarSeptiembre` gana el parámetro opcional `idDe` en sus
  mismas líneas) y CSV armado en memoria desde las celdas de Gerencia. Resultado: 13/13 por ticket y 100 % de la variante en 47 (11), 49 (9),
  50·53 (11), 51 (12), 54, 57, 58 y 59 (9); la 55 sin pares comparables. Una celda alterada en cualquiera de los ocho rompe el 13/13.
- **Las dos rutas no cambian de código**: ya llamaban a `compararIndicadores`.

## 2. Qué cambia en `GET /api/indicadores` (y en el `POST`)

En el JSON cambian sólo `comparacion.ticketsVariante` (clave nueva, entre `tickets` y `nota`) y el texto de `comparacion.nota`. `periodo`,
`flujo`, `tickets` del GET, `porColumna`, `mensaje`, `comparable`, `tolerancia` y, en el POST, `fichero` y `cruce` no cambian, con o sin
flujo y periodo. El CSV del GET no lleva comparación y no cambia: su caracterización sha256 (`apps/desk/server/routes/indicadores.test.ts:271`)
es la misma. Las dos de cuerpo JSON se recalcularon en `c47b6cd2`, que nombra la decisión: `apps/desk/server/routes/indicadores.test.ts:263`
(`0975f415…` → `95cb5026…`) y la línea 326 de `apps/desk/server/routes/indicadoresComparacion.test.ts` (`862d1958…` → `265b7cbf…`).

## 3. Spec viva

Fusión por script, ensayada antes en seco, en `openspec/specs/kpis/spec.md` (de 1.650 a 1.808 líneas):

- **MODIFIED en sitio, a igual longitud:** la fila SP-6 (1 → 1 línea, `openspec/specs/kpis/spec.md:32`) y RQ-KP-16 (53 → 53, `:560-612`,
  con sus seis escenarios). Cada bloque es idéntico al del delta (`diff` vacío), y las líneas 1-31, 33-559 y 613-1650 no cambian: la fusión
  no desplaza ninguna cita.
- **ADDED al final:** RQ-KP-40, RQ-KP-41 y RQ-KP-42 (157 líneas, 22 escenarios), idénticos al delta. Escenarios de la spec: 212 → 234.
- **Citas a las líneas cuyo contenido cambia** (`:32`, `:577-580`, `:582`), barridas en todo el repositorio de la rama y en los ficheros de
  Supervisión de `main`: sólo cinco, todas de este cambio. Son caso A salvo una del `design.md`, que citaba el texto viejo de la SP-6 y se
  ancló «en `e1a92b59`» (caso B) en `09666b26`, antes de la mudanza.

## 4. Mudanza

`git mv` de la carpeta a `openspec/changes/archive/2026-10-24-comparacion-juzga-variante/`, sin cambiar ningún byte de los seis artefactos.
Antes de moverla, en `09666b26`: la única cita completa a la ruta vieja del cambio (W1 del `verify-report.md`) pasó a prosa, para que la
mudanza no la dejara apuntando a un fichero inexistente.

## 5. Registro de intentos (`gentle-ai sdd-attempt`), medida = `git diff --shortstat --no-renames` + sin trackear

| # | Unidad | Base → final | Líneas | Registro |
|---|---|---|---|---|
| 1 | propuesta + spec | `e1a92b59` → `75792abe` | 404 | 404 |
| 2 | diseño + tareas (+ fila SP-6 del delta) | `75792abe` → `5a454f76` | 325 | 325 |
| 3 | apply L1 (shared, aceptación, sha256) | `5a454f76` → `9924cf70` | 311 | 311 |
| 4 | apply L2 (cliente, anclas, barrido) | `9924cf70` → `0c68801c` | 255 | 255 |
| 5 | verify | `0c68801c` → `fbb7e85e` | 136 | 136 |
| 6 | archive | `fbb7e85e` → este commit | mudanza + revisable 288 (fusión 170, informe 114, anclas previas 4) | al asentar |

Las cifras de L1 y L2 que el `apply-progress.md` remitía al informe del lote (W1 del verify) son las de las filas 3 y 4. Ningún intento pasó
de la válvula de 720 y todos se asentaron con medida = registro. La parte revisable del archive se midió antes de commitear (regla del archivo).

## 6. Verify y ejecución

Verify **PASS CON AVISOS**: 0 CRITICAL, 1 WARNING (resuelto en §5) y 3 SUGGESTION; 5 requisitos y 28 escenarios COMPLIANT. Mutaciones de la
propuesta, todas en rojo y revertidas byte a byte: M1 y M2 las reprodujo también el orquestador (12 y 1 pruebas rojas); M3, M4 y M8, el
verificador; M5, M6, M7, M9 y M10 constan en el `apply-progress.md`. `npm test` en primer plano, salida 0: 317 ficheros y 5.520 pruebas sobre
`0c68801c` (eran 316 y 5.482 en la base). typecheck 0, lint 0 (165 avisos, los de siempre), detector 0.

## 7. Bundle

`dist/assets/index-Hz9CFuzO.js`, 426.836 B (producción hoy: `index-DSTLJ8Eq.js`, 426.563 B): +273 B, la segunda tabla y los dos rótulos.
Hoja de estilos sin cambio (`index-BXv9vVDm.css`, 32.681 B). Build 0.

## 8. Pendiente fuera de la rama (la rama no toca `openspec/config.yaml`)

- Supervisión tiene en `main`, sin commitear, un bloque de +9 líneas en `openspec/config.yaml` tras la línea 4733. Cuando se commitee,
  desplazará +9 todas las citas `openspec/config.yaml:NNNN` posteriores, y entre ellas las 13 de este cambio y de la spec viva. Es el
  barrido de la regla de mutación 4 de ese commit.
- Dos citas de hash del archivo de `poblacion-cierre-variante-47-51` quedaron ancladas «en `e1a92b59`» en `41263329` (caso B); viajan con la
  fusión.

## 9. Supuestos reversibles — a la lista semanal, bajo F1F-05

S-1 `ticketsVariante` con la forma de `tickets`, que sigue siendo la letra · S-2 la tabla de la variante pinta «sin pares comparables» donde
no hay porcentaje (la premisa del encargo, «que siga diciéndolo», era falsa: hoy ninguna fila lo decía) y la letra sigue con «—» · S-3
rótulos «Variante de la fórmula de Zoho · cuenta para el 95 %» y «Letra de la aplicación · informativa» · S-4 aceptación por el `POST` con
CSV en memoria · S-5 cambian dos sha256, no tres: la del CSV se queda · S-6 sólo cambian dos claves del JSON · S-7 la fila de tickets no
trae «Difieren» ni «Sin comparar» porque el servidor no los da. Y uno de esta tanda: el «ID» del CSV de prueba es sintético de dieciocho
dígitos, no el id del fixture.

## 10. Tareas de persona — fuera del recuento (archivar no las da por hechas)

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Corregir, si procede, S-1 a S-7 | Gerencia | lista semanal de supuestos (regla E-237) |
| P-2 | Repetir la comparación de septiembre del 01/09 al 30/09 y pasar el «Sólo en Desk» | Gerencia | `decision/f1f05-variante-juzga-el-95` |
| P-3 | Probar en la aplicación la tabla de la variante | Gerencia / analista | lista acumulada de pruebas en la app |

## 11. Qué se verá en «Análisis» (sólo administradores; P-3)

Tras subir el fichero de Zoho, la pantalla enseña **dos tablas**. Primero, «Variante de la fórmula de Zoho · cuenta para el 95 %»: por
indicador, comparados, coinciden, difieren, sin comparar y porcentaje, y una fila «Tickets» con comparados, coinciden y porcentaje. Donde no
hay nada que comparar, como en la 55 hasta enero, dice «sin pares comparables». Debajo, «Letra de la aplicación · informativa», con las
mismas columnas y «—» donde no hay porcentaje. La nota del pie dice que el 95 % se juzga con la variante y que la aplicación no decide el
aprobado. Con septiembre, la variante debería dar 13 de 13 tickets (100 %).

Engram: propuesta 1843, spec 1844, diseño 1845, tareas 1846, apply-progress 1847, verify 1850.
