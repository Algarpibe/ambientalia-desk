# Archive · `accesorios-lista-por-modelo` (F1B-04, `cierra: no`)

**Fecha:** 2026-10-07 · **Rama:** `accesorios-lista-por-modelo` · **Partida:** `f574d12` · **Informe escrito por el orquestador**, con
cifras medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-04 cubre, en una línea:** la mitad de accesorios de la recepción —el formulario de entrada enseña el nombre
oficial y el SKU de cada accesorio de la lista del modelo, un accesorio ya no nace de texto libre en ninguna de las tres vías del
catálogo, lo que llega fuera de lista se anota como novedad y el Director Técnico lo añade a la lista—. **Deja fuera**, y por eso el
cambio declara `cierra: no`: la mitad de salida de E-123 (fotos obligatorias en la remisión de salida), la foto por accesorio (no hay
dónde guardarla), la confirmación de que el SKU es el número de parte, y las preguntas abiertas E-163 a E-167.

## Qué decisión construye

`decision/e232-accesorios-lista-por-modelo` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), de 2026-10-06: «Los accesorios
salen de la lista por modelo que ya existe en el catálogo de modelos, con nombre oficial y número de parte cuando lo haya. […] Nada de
texto libre: un accesorio fuera de lista es novedad y lo añade el Director Técnico.»

## Qué quedó construido

- **La lista por modelo no se duplicó.** Sigue siendo la que arma `checklistDeRemision`; gana un campo aditivo `detalle`, y el
  formulario lo recibe como `incluyeDetalle` (`apps/desk/server/routes/remision.ts:68`). `incluye` sigue siendo la lista de nombres
  y el alta la valida como antes (`apps/desk/server/routes/remision.ts:194-197`). El diff de ese fichero en toda la rama es **una
  línea**: ninguna guarda del alta cambió de sitio, así que IV-12 ni se amplía ni se corrige.
- **Regla en `packages/shared`** (`packages/shared/src/accesoriosLista.ts`): un accesorio exige artículo de Books; el permiso del
  Director Técnico es `puedeMantenerNovedades` consumido tal cual; el detalle se deduplica por nombre.
- **Cierre del texto libre en el catálogo, en tres vías:** el alta (`apps/desk/server/routes/catalogo.ts:220`), el cambio de clase
  por `PATCH` de una fila sin artículo (`apps/desk/server/routes/catalogo.ts:294`) y la copia entre modelos, que omite esas filas y
  las cuenta aparte en `sinBooks` (`apps/desk/server/db/catalogoArticulos.ts:166`, `apps/desk/server/db/catalogoArticulos.ts:190`).
  Las demás clases siguen admitiendo texto libre.
- **Novedad sembrada «Accesorio fuera de lista»** (`packages/zoho-sync/src/db/schema.sql:768`), con texto obligatorio; las novedades
  sembradas pasan de diez a once. Pasa por la validación de recepción que ya existía, sin guarda nueva en el alta.
- **Ruta del Director Técnico**, en fichero nuevo, `POST /api/catalogo/modelos/:id/accesorios`: existencia
  (`apps/desk/server/routes/accesoriosModelo.ts:24`), permiso (`apps/desk/server/routes/accesoriosModelo.ts:25`), contenido
  (`apps/desk/server/routes/accesoriosModelo.ts:27`, `apps/desk/server/routes/accesoriosModelo.ts:29`) y unicidad
  (`apps/desk/server/routes/accesoriosModelo.ts:33`). La clase la fija el servidor; nombre y SKU salen de Books.
- **Cliente:** SKU junto al nombre en `CrearRemision.tsx`, panel «Accesorios por modelo» en Configuración, y el alta «a mano» del
  catálogo deja de ofrecer la clase accesorio. Los `.tsx` quedan fuera de la red de pruebas por decisión de Gerencia (F0-00).
- **Consulta de sólo lectura** «modelos sin ningún accesorio activo»: `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql`.
  Ninguna sesión la ejecutó; que PostgreSQL de producción la acepte tal cual es hipótesis.

## Lo que no se construyó, y por qué

- **La foto de cada accesorio.** Los documentos cuelgan del modelo, no del artículo, y la réplica de Books no trae imagen.
- **El número de parte como dato propio.** Se enseña el SKU; que sea el número de parte sigue siendo hipótesis (S-1).
- **El SKU en la remisión guardada.** La remisión guarda nombres; el SKU es dato de presentación del formulario (S-8).
- **Reactivar, retirar, reordenar o copiar desde la pantalla del Director Técnico.** Sólo añade (S-3).

## Compatibilidad

Sin migración y sin escribir datos. Las remisiones ya guardadas con ítems de texto libre se leen y se reenvían igual, porque
`incluye` sigue siendo una lista de nombres. Las filas de catálogo sin artículo de Books que ya existen se siguen ofreciendo en el
formulario y el alta las acepta; se pueden desactivar, reactivar, reordenar y borrar. La lista por perfil de los tickets sin equipo
enlazado no cambia. Lo prueban `apps/desk/server/accesoriosRemision.test.ts` y la sección de legado de
`apps/desk/server/accesoriosCatalogo.test.ts`.

## Supuestos anotados que quedan vivos (reversibles; para Gerencia en el §11.1 del paquete de despliegue)

S-1 (el SKU hace de número de parte) · S-2 (el permiso es área Servicio Técnico más cargo Director Técnico) · S-3 (sólo añade, y sólo
artículos de Books) · S-4 (un accesorio real que no sea artículo de Books ya no se puede añadir) · S-5 (el nombre del accesorio fuera
de lista viaja en el texto de la novedad) · S-7 («modelos sin categoría de accesorios» se lee como «sin ningún accesorio activo») ·
S-9 (la copia entre modelos omite los accesorios sin artículo; no estaba en el encargo) · S-10 (un solo texto por remisión: «Otro» y
la novedad nueva lo comparten).

## Medida, por intento (registro de `gentle-ai sdd-attempt` = `git diff --shortstat --no-renames` más lo nuevo sin trackear)

| Ordinal | Unidad | Commit | Registro | Git |
|---|---|---|---|---|
| — | Planificación (propuesta, delta, diseño, tareas), **sin intento** | `0e8ea70` | — | 1.297 |
| 1 | Lote 1a · regla compartida | `42bcdf9` | 275 | 275 |
| 2 | Lote 1b · cierre del catálogo | `466be1d` | 309 | 309 |
| 3 | Lote 2 · detalle, novedad sembrada, compatibilidad | `7cd4c15` | 357 | 357 |
| 4 | Lote 3 · ruta del Director Técnico | `1867a22` | 307 | 307 |
| 5 | Lote 4 · cliente | `c7a6812` y `3100093` | 236 | 236 |
| 6 | Lote 5 · cierre documental | `23cf1a9` | 313 | 313 |
| 7 | Verify | `47c3368` | 367 | 367 |
| 8 | Cierre tras el verify | `f83fe3a` | 124 | 124 |

Techo 800 en todos; ninguno llegó a la válvula de 720. Sin binarios. La planificación se commiteó sin intento, como en las tandas
anteriores: el intento del lote 1a se abrió antes de la primera edición de código.

## Verificación

- **Veredicto del verify (en `23cf1a9`): PASS WITH WARNINGS**, 0 CRITICAL, 5 WARNING, 4 SUGGESTION. 49 escenarios: 46 conformes y 3
  parciales.
- **Mutaciones propias del verificador: 64** — 60 rojas, 2 equivalentes (los pares «clase desconocida» frente a la guarda de
  accesorio, que no se pueden activar a la vez) y **2 supervivientes reales**.
- **Los supervivientes se cubrieron en el cierre (`f83fe3a`)** con seis pruebas nuevas y siete mutaciones en rojo: el alta con
  `itemId` vacío o nulo, el `item_id` guardado por la ruta del Director Técnico, la siembra que no pisa lo editado (ahora por
  comportamiento y no sólo por texto) y la gestión de una fila de legado. Una variante de la segunda mutación es equivalente y queda
  declarada como tal en `apply-progress.md`.
- **Sobre `f83fe3a`:** 3.977 pruebas, typecheck 0, lint 0 (165 avisos), build 0 y detector 0.
- **Regla 13:** la tabla decisión del cliente → línea del servidor está cerrada en `tasks.md` con las líneas reales y contrastada por
  el verificador; ninguna decisión del cliente que bloquee queda sin imposición probada en el servidor.

## Incidencias de proceso

- **Lote 2:** el agente se cortó por un fallo de red a mitad de trabajo. Se reanudó con su contexto y lo primero fue comprobar, fichero
  a fichero, que no quedaba ninguna mutación a medio restaurar.
- **Lote 4:** el detector bloqueó una cita del progreso cuyo final caía en línea vacía. Se vio antes de asentar; se reparó en
  `3100093` y el intento se asentó después, con el detector en 0.
- **Delta:** el RQ-RE-21 modificado tenía una línea más que el vivo. Se reajustó el corte de un párrafo (mismo texto) para que la
  fusión no desplazara nada en la spec viva.

## Límites declarados

Están en el §11.2 del paquete de despliegue: el Director Técnico recibe `409` ante un accesorio desactivado y no puede reactivarlo; la
ruta no rechaza un modelo inactivo; `PATCH` con un id inexistente responde `200`, como antes; el buscador de artículos descarta los de
Books sin SKU, así que no se pueden añadir desde la pantalla aunque el servidor los aceptaría; y las citas archivadas a líneas de
`migrate.test.ts` que cambiaron en sitio son históricas y no se renumeran.

## Fusión de los deltas (por script, bloque a bloque)

`fusiona.mjs` sustituyó el requisito MODIFIED por su bloque del delta y añadió los ADDED al final de la spec, y comprobó que cada
bloque vivo es idéntico línea a línea al del delta: **6 bloques, 6 idénticos**.

| Capacidad | MODIFIED | ADDED | Líneas vivas |
|---|---|---|---|
| `remisiones` | RQ-RE-21 (mismas líneas) | RQ-RE-32, RQ-RE-33, RQ-RE-34, RQ-RE-35, RQ-RE-36 | 1.466 → 1.814 |

RQ-RE-21 no estaba en la propuesta: lo destapó el diseño, porque fijaba «diez» novedades sembradas.

## Citas (regla de mutación 4)

- **Ninguna línea se desplazó** en los ficheros citados: `remision.ts`, `catalogo.ts`, `types.ts`, `checklistRemision.ts`, `app.ts` y
  los `.tsx` conservan su número de líneas; los que crecieron lo hicieron sólo al final. En la spec viva, RQ-RE-21 ocupa las mismas
  líneas y los cinco requisitos nuevos van al final.
- **Citas que afirman el estado de partida (caso C, superadas por este cambio):** las consecuencias (2), (6) y (7) de
  `decision/e232-accesorios-lista-por-modelo` dicen que el formulario enseña sólo el nombre, que el catálogo admite un accesorio
  escrito a mano y que sólo escribe el catálogo el super administrador. Eran ciertas el 2026-10-06; las cierra este cambio. No se
  editaron: `openspec/config.yaml` no se toca en esta rama.
- **Citas históricas (caso B):** dos paquetes de despliegue fechados el 2026-10-04 citan tramos de `DEPLOY.md` que decían «diez
  filas», y siete citas archivadas apuntan a la línea del recuento de sentencias de `migrate.test.ts`. No se renumeran.

## Medida de este archivo (regla del archivo)

Parte con carga de revisión, medida antes de commitear: la fusión del delta en `openspec/specs/remisiones/spec.md` (359 inserciones
y 11 borrados) más este informe. Queda por debajo de 800. El resto es la mudanza de la carpeta, que sin detección de renombrado
cuenta dos veces cada línea movida.

## Consecuencia en el avance

Ninguna: `cierra: no`. F1B-04 sigue «en curso» y no suma. `docs/sdd/RECONCILIACION.md` se regenera en `main` tras la fusión.

## Tareas de persona — fuera del recuento; archivar no las da por hechas

**No tienen entrada en `docs/sdd/ENTRADA.md`**: el fichero tiene cambios de Supervisión sin commitear y esta rama no lo toca; la
entrada la abre Supervisión.

| # | Dueño | Qué | Dónde queda escrito |
|---|---|---|---|
| P-1 | Una persona con acceso a producción | Correr la consulta de modelos sin accesorios antes del corte | `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql` |
| P-2 | Director Técnico | Completar la lista de los modelos que salgan vacíos | `docs/sdd/Paquete_de_Despliegue_2026-10-06.md`, §11.3 |
| P-3 | Gerencia | Confirmar o corregir los supuestos | el mismo paquete, §11.1 |
| P-4 | Gerencia | Pegar la corrección 31 en el maestro | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| P-5 | Analista | Verificar en la aplicación el formulario, el panel y la novedad | el mismo paquete, §11.3 |
| P-6 | Mantenedor | Desplegar y comprobar que existe la novedad `accesorio_fuera_de_lista` | `DEPLOY.md` |
