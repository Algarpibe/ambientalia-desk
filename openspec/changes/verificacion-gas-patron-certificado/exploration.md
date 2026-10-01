# Exploración: verificacion-gas-patron-certificado (F1A-03, HEAD f5255d2)

Fase `sdd-explore`, 2026-10-01. Texto del informe del explorador, persistido por el orquestador (el explorador no
tenía escritura y Engram, obs. #1218, guardó sólo un resumen). Las líneas son de `f5255d2`.

## 1. ¿Cierra la fila?
- Plan §3 `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:142`: C12 «salidas aprobada/rechazada de
  Verificación» + GUARDA por familia (§5 `:490`). R01.2 `:60`: depende de F1B-06 (ya archivada 2026-09-25).
- Hecho por `salidas-verificacion` (`archive-report.md:9-18`): E1 `liberacion.from` ampliado (`transitions.ts:359`) y E2
  `rechazo_verificacion` (`:361`), invariante sinSalida=`['Finalizado']`. Dejó fuera E3/E4 (guarda + lista de gases →
  E-082) y E5 (certificado → E-083), por eso `cierra: no`.
- Decidido: E-082 y E-083 cerradas el 28/09 (`config.yaml:2887`, `:2904`; adendas en `ENTRADA.md`). Plan §4.5: F1A-03
  «segunda parte», «no abre fila».
- Tras este cambio no queda contenido de la fila fuera. **Recomendación `cierra: si`**: E1+E2 (cambio previo) + E3+E4+E5
  (este) = las cinco partes. La siembra en producción es tarea de persona (Alfonso, `config.yaml:2897`), fuera del
  recuento (regla del ciclo 1); archivar no la da por hecha. Si Gerencia quisiera que «cierra» exigiera la siembra hecha,
  sería `no`; no hay base escrita para eso.

## 2. Guarda por familia + gas patrón vigente
- Transición: `liberacion` (`transitions.ts:359`, from `['En Proceso','Verificación']`, fields sólo `comment()` +
  `derivacion()`). La guarda aplica **sólo cuando el origen es `En Proceso`** (liberar sin Verificación); desde
  Verificación ya pasó. `verificacion` (`:357`) queda voluntaria.
- Familia hoy: no existe. `equipos.tipo` es texto libre (`schema.sql:194`), `catalogo_tipos` sin marca de familia
  (`:323-328`). Las pruebas usan tipos por analito («Analizador de SO2», «Analizador de Ozono», «Calibrador Multigas»,
  `catalogoSeed.test.ts:20-21`, `:39`). No hay tipo «Convertidor» en el repo (hipótesis: los nombres reales sólo están
  en producción).
- **Propuesta (s1): familia = `compuesto` no nulo**, sin comparar tipos de texto libre.
- Compuesto: `grep gas.?patron|compuesto packages/shared/src` = 0 (`config.yaml:2895`). Columna nueva en
  `public.catalogo_modelos` (valor por defecto) y en `equipos` (hoja de vida, heredada al alta). Moldes: `ALTER … ADD
  COLUMN IF NOT EXISTS` de `schema.sql:466-471` (mantenedor) y `:374` (sku en modelos). Escrituras: `createEquipo`
  (`apps/desk/server/db/equipos.ts:119-131`), `updateEquipo` (`:133-150`), `crearModelo` (`db/catalogo.ts:183-195`),
  `actualizarModelo` (`:253`), alta desde ticket `services/equipoNuevo.ts`.
- Escalón **B** (409). Tabla canónica `openspec/specs/transitions-st/spec.md:1106-1111`. Vecinas en `ticketService.ts`:
  `:126-128` estado de origen (B), `:129-131` área, cargo y prioridad (B), `:132-134` valores y obligatorios (C).
  Inserción: tras `:131`, antes de `:132`; función aparte al final del fichero, molde `exigirMismoFlujo` (`:231`).
- Regla de mutación 1: una prueba que active a la vez la guarda nueva y el 422 de obligatorios
  (`transitionExec.ts:77`) y exija 409; otra contra `:126-128`.
- `buildTransitionPlan(t, values)` (`transitionExec.ts:37`) no recibe ticket ni equipo: la guarda va en
  `executeTransition`, con consulta a BD.

## 3. «Finalizado» único sin salida
- Invariante en `packages/shared/src/invariantesGrafo.test.ts:62-65` y `:177-180`; fila `liberacion` en `:206`. El
  cambio no altera el grafo (campo + guarda): no lo arriesga. Sólo lo haría una transición nueva, que no se propone.

## 4. Certificado de fábrica
- `liberacion` sale de `En Proceso` y de `Verificación` (`transitions.ts:359`): la misma transición para los dos casos.
- Campo de texto con el helper `cfText` (`:77`); el servidor exige `required` en `transitionExec.ts:76-77` (422). Se
  guarda en `ticket_transitions.values` (`schema.sql:57-61`, `repo.ts:317`) y `tickets.custom_fields` (`repo.ts:307-310`).
  Precedentes: `Serial` (`:189`), `Código Servicio` (`:191`).
- Ambigüedad (s2): un `required` estático alcanza toda liberación de equipo nuevo, incluidos equipos que no son
  analizadores ni convertidores. Alternativas: exigirlo sólo con compuesto (guarda 422 de servidor) o universal.
- PDF opcional: no hay `FieldKind` de archivo (`transitions.ts:14`; `:168` «adjuntos = deuda»). Mecanismos: multer en
  memoria `apps/desk/server/util/subida.ts:10` (10 MB), base64 en `resolution_attachments` (`schema.sql:232-242`,
  `db/resolutions.ts:27-47`), ruta `routes/tickets.ts:53-66` (sólo imágenes).
- Tickets ya en Verificación al desplegar: producción ≡ `ae5aaf4` y F1B-06 sin desplegar (hipótesis: no hay tickets del
  flujo de la app en Verificación; puede haber sincronizados de Zoho). Al liberar se les pedirá el certificado: cambio
  visible. Contarlos antes (SELECT en el script). No retroactivo para lo ya liberado.

## 5. Tabla de gases patrón
- Esquema mínimo: `public.gases_patron` (compuesto, disponible, vence, cilindro, alta). «Vigente» = disponible y vence ≥
  hoy; varias filas por compuesto.
- `CREATE TABLE IF NOT EXISTS public.gases_patron` calificado; `'gases_patron'` en `PUBLIC_TABLES` (`migrate.ts:70-73`)
  o el guardián de `migrate.test.ts` se pone rojo. Sin `;` en comentarios de `schema.sql` (`:464-465`). Sin `CHECK`
  sobre listas (pg-mem, `:358`).
- Alta directa por SQL, sin UI («al principio por alta directa»).
- **Tabla vacía:** la lectura literal es que no bloquea («si no existe, se libera y queda registrado el motivo»). Riesgo
  «0 destinatarios»: hasta la siembra, la guarda no se nota. Supuesto s3: no bloquea; el motivo se escribe en `values`.
- Riesgo H5: comparar `compuesto` como texto libre entre `equipos`, `catalogo_modelos` y `gases_patron` («SO2» frente a
  «SO₂») falla en silencio hacia abierto. Mitigación s4: lista cerrada `COMPUESTOS` en `packages/shared`.

## 6. Siembra
- Datos: compuesto por modelo (APSA-370 SO₂, APNA-370 NOₓ, APMA-370 CO, APOA-370 O₃, convertidores: el que convierten);
  relleno de `equipos` desde su modelo (`modelo_id`, `schema.sql:354`); excepciones de los tickets #601–#622 y
  #653–#654 (mapeo ticket→equipo por `tickets.equipo_id`, `schema.sql:206`); gases patrón actuales.
- Los nombres reales del catálogo sólo están en producción (hipótesis). El script empieza con SELECT de comprobación y
  es idempotente. Precedente de formato: `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:1-40`.

## 7. Ficheros muy citados (líneas medidas hoy)
- `ticketService.ts` 234 (muy citado): función al final + llamada en línea sobre `:131`, sin añadir líneas.
- `transitions.ts` 397: editar `:359` en su sitio; nada se inserta antes.
- `transitionExec.ts` 99, `flujos.ts` 163, `estados.ts` 190 (no tocar), `schema.sql` 622 (sólo al final),
  `migrate.ts` 131 (`:70-73` en línea), `repo.ts` 452, `db/equipos.ts` 409, `routes/equipos.ts` 211.

## 8. Talla y lotes
- Hipótesis: ~900-1.300 líneas con pruebas e informes → tres lotes de 800 como máximo (válvula 720, casillas y
  `apply-progress` dentro): dato (compuestos, esquema, herencia); guardas (409, motivo, certificado, posición); PDF,
  script de siembra y cierre.

## Supuestos propuestos
s1 familia = compuesto no nulo · s2 alcance del certificado · s3 tabla vacía no bloquea · s4 lista cerrada de
compuestos · s5 vigencia = disponible y vence ≥ hoy · s6 sin equipo o sin compuesto, sin guarda · s7 sin UI de gases ·
s8 certificado en la transición.
