---
tanda: F1C-05
motivo: ""
capacidad: [reconciliacion]
maestro: ["M1.9.1", "Anexo D nº 39"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: cierre de F1C-05 en su nivel cargo

## Intención

Gerencia decidió el 2026-11-09 partir F1C-05: «F1C-05: se parte; el nivel cargo cierra antes del corte y el propietario del
registro va a fila nueva después» (`decision/filas-que-no-cierran-antes-del-corte`, respuesta 3,
`openspec/config.yaml:5767` en `0e2b609b`). Su consecuencia (2) lo concreta: «El nivel cargo cierra antes del corte, sin
código. El propietario del registro va a una fila nueva de después del corte» (`openspec/config.yaml:5770` en `0e2b609b`), y
la decisión abre «dos cambios de cierre sin código (F1B-13 y el nivel cargo de F1C-05)» (`openspec/config.yaml:5778` en `0e2b609b`).
La fila nueva es F1C-13 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:422` en `0e2b609b`). El orden lo fija
`decision/orden-tandas-tras-e266` (1): tras E-266, los tres cierres sin código, entre ellos «F1C-05, la paridad y el nivel
cargo» (`openspec/config.yaml:5829` en `0e2b609b`). El primero, F1B-13, está fusionado en `main` (`d12fa198`).

**Es un cambio documental.** No toca código de producción, ni `openspec/specs/`, ni el maestro. Su único efecto medible es
que, archivado, F1C-05 pasa de «en curso» a «cerradas por archivo» en el barrido de `npm run reconcile`. A diferencia de
F1B-13, F1C-05 sí tiene fila en la R01.1, con fuente «M1.9.1»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:178`, que el barrido toma de la cuarta columna de la tabla en
`apps/desk/server/reconciliacion/comprobaciones.ts:134-141`): el `maestro:` de la cabecera la cita, así que el barrido no la
marca «sin verificar» (`apps/desk/server/reconciliacion/comprobaciones.ts:237-239`).

Las citas a `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y al plan R01.4 van ancladas en `0e2b609b`, el commit de partida:
cambian en `main`. También van ancladas las de `apps/desk/server/reconciliacion/registro.test.ts` y
`docs/sdd/RECONCILIACION.md`, que cambian al archivar.

## Qué pide la fila, medido

- **Su origen**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:178`: «C10 Permisos por cargo y por propietario del
  registro (tres niveles)», con el gate P39 («matriz de cargos por transición»), «Liberación sin factura» exclusiva del Director
  Comercial y fuente M1.9.1. En el §5 de la R01.1 va en la fila colapsada `F1C-01…08`, talla S–M
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:509`). La R01.2 no tiene fila con el ID (`grep -c F1C-05` da 0) y
  sólo sitúa C10 en S49 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:132`).
- **La parte de paridad**, R01.3 §C.1: la restricción de «Liberación sin factura» por cargo se queda dentro del corte, «junto
  con la parte de `decision/c10-permisos-cargo` que la sostiene» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:65`).
- **La fila vigente**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:103` en `0e2b609b`: antes del corte, motivo de
  lista cerrada y fecha prevista en «Liberación sin factura» (E-102); después, «Decisionales y propietario del registro»; «en
  curso», con la nota del 09/11 que la parte y nombra este cambio.
- **El remanente**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:220` en `0e2b609b`: el cargo «ya está», la paridad
  quedó hecha el 05/10 y «lo que falta es de después del corte»; la nota del 09/11 pasa el propietario a F1C-13.
- **La nota 3** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:269` en `0e2b609b`): «F1C-05 no puede cerrar antes del
  corte: su parte de Decisionales depende de F1C-04, que va después». Superada (caso C, abajo).
- **La fila que recibe la pieza**, F1C-13 «Propietario del registro (C10)», talla por medir
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:422` en `0e2b609b`).
- **El maestro**, M1.9.1 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1934-1952`): el área es la
  base, el cargo sólo restringe, siete cargos, tres excepciones, el administrador siempre puede y la regla de las Decisionales
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1936-1944`). La tabla de los tres niveles da
  el cargo «Construido» y el propietario «Aplazado»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1960-1965`); el Anexo D nº 39 lo da «RESUELTO …
  en el nivel cargo» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5781-5784`).

## Qué cubrió cada cambio archivado (los tres llevan `tanda: F1C-05`, `cierra: no`)

| Cambio | Qué cubrió | Por qué declaró `cierra: no` | Dónde se dice |
|---|---|---|---|
| `2026-09-30-permisos-por-cargo` | Siete cargos en lista cerrada, columna de cargo de permiso separada de la firma, la Liberación sin factura exigida al Director Comercial en el servidor y dos primitivas sin llamador (OVI de garantía, Top 5) | Dejaba fuera los Decisionales, que dependían de F1C-04, y el propietario del registro, aplazado por `decision/c10-permisos-cargo` | `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:17-22` |
| `2026-10-04-liberacion-sin-factura-motivo-fecha` | La paridad: la transición deja la casilla y pide motivo de lista cerrada, fecha prevista y, con la autorización excepcional, su texto; dos columnas, la traza y la ficha | Quedaban los Decisionales y el propietario; la alarma y «Pendiente de facturar» son de F1C-02 | `openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/archive-report.md:10-13` |
| `2026-10-18-decisionales-por-cargo` | Las Decisionales por cargo, detrás de `DECISIONALES_POR_CARGO`, que nace cerrado | Quedaba el propietario del registro, aplazado por la consecuencia 5 de `decision/c10-permisos-cargo` | `openspec/changes/archive/2026-10-18-decisionales-por-cargo/archive-report.md:3-6` |

Tras el tercero, la única pieza que la fila seguía esperando era el propietario del registro; es la que la consecuencia (2)
pasa a F1C-13. Los tres se fusionaron en `main`: el primero se archivó directamente en `main` (`29f65d11`) y los otros dos por
fusión (`32e5df3a` y `da916152`).

## Contraste pieza a pieza

| Pieza | Fuente | Quién la cubre | Dónde se dice | Estado |
|---|---|---|---|---|
| Siete cargos con nombres exactos, en lista cerrada y en una columna de cargo de permiso separada de la de firma | `openspec/config.yaml:1933` en `0e2b609b` y `openspec/config.yaml:2589` en `0e2b609b` | `permisos-por-cargo` | `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:17-18` | Construida; el octavo, «Especialista técnico», lo añadió F1C-11 (`d179c122`) por `decision/cargo-encargado-de-inventario` (`openspec/config.yaml:3497-3499` en `0e2b609b`) |
| El área es la base y el cargo sólo restringe; el administrador siempre puede | `openspec/config.yaml:1932` en `0e2b609b` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1943` | `permisos-por-cargo` | El barrido «sólo restringe» de `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:56` y, para el administrador, RQ-PM-19 (`openspec/specs/permissions/spec.md:464`) | Construida |
| «Liberación sin factura» → Director Comercial, `403` en el servidor | `openspec/config.yaml:1934` en `0e2b609b`, `openspec/config.yaml:2378` en `0e2b609b` y `openspec/config.yaml:2187-2188` en `0e2b609b` | `permisos-por-cargo`: `packages/shared/src/cargos.ts:32`, aplicada en `apps/desk/server/services/ticketService.ts:131` | `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:17-19` | Construida y en vigor (`openspec/config.yaml:5733` en `0e2b609b`) |
| Asociar la OVI de garantía → Director Técnico | `openspec/config.yaml:1934` en `0e2b609b` | La primitiva, `permisos-por-cargo` (`packages/shared/src/cargos.ts:71-74`); el llamador, F1B-03 (`packages/shared/src/ordenOVI.ts:55`) | `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:18-19` | Construida, con llamador |
| Fijar la prioridad de los Top 5 → Director Comercial | `openspec/config.yaml:1934` en `0e2b609b` | La primitiva, `permisos-por-cargo` (`packages/shared/src/cargos.ts:80-83`); el llamador, F1B-07 (`apps/desk/server/routes/prioridad.ts:40`) | `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:18-19` | Construida, con llamador |
| Motivo de lista cerrada (tres, con texto obligatorio en el tercero) y fecha prevista de facturación | `openspec/config.yaml:2378` en `0e2b609b` y E-102 (`docs/sdd/ENTRADA.md:1380` en `0e2b609b`) | `liberacion-sin-factura-motivo-fecha` | `openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/archive-report.md:10-13` y `openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/archive-report.md:31-41` | Construida |
| Las liberaciones anteriores conservan su casilla | `openspec/config.yaml:2378` en `0e2b609b` | `liberacion-sin-factura-motivo-fecha` | `openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/archive-report.md:41` | Construida |
| Decisionales: sólo el Director o el Coordinador del área de la decisión | `openspec/config.yaml:1935` en `0e2b609b` y `openspec/config.yaml:5086` en `0e2b609b` | `decisionales-por-cargo` | `openspec/changes/archive/2026-10-18-decisionales-por-cargo/archive-report.md:8-23` | Construida detrás de `DECISIONALES_POR_CARGO`, apagado hasta enero (S-4, abajo) |
| Con el Coordinador Técnico vacante, el Especialista técnico ejecuta las Decisionales técnicas | `openspec/config.yaml:5086` en `0e2b609b` | `decisionales-por-cargo` | `openspec/changes/archive/2026-10-18-decisionales-por-cargo/archive-report.md:10-13` | Construida, mismo interruptor |
| Las tres «Anulación», sólo el Director o el Coordinador Comercial | `openspec/config.yaml:5074` en `0e2b609b` | `decisionales-por-cargo` | `openspec/changes/archive/2026-10-18-decisionales-por-cargo/proposal.md:63`, `:67` y `:68` (medida sobre `7ff08c8`) | Construida, mismo interruptor |
| Alarma al Director Comercial si pasa la fecha prevista en «Pendiente de facturar» | `openspec/config.yaml:2378` en `0e2b609b` | F1C-02 (`facturar-dos-ramas`), por E-102 (`docs/sdd/ENTRADA.md:1380` en `0e2b609b`) | `openspec/changes/archive/2026-10-18-facturar-dos-ramas/archive-report.md:3-6` | Construida por F1C-02, fuera de esta fila |
| Marcar el histórico de liberaciones y regularizarlo hacia adelante | `openspec/config.yaml:2378` en `0e2b609b` y `decision/p64-historico-c1` (`openspec/config.yaml:2293` en `0e2b609b`) | Nadie: la decisión la deja «sin tanda · dato de producción» (`openspec/config.yaml:2303` en `0e2b609b`) | `openspec/changes/archive/2026-10-18-facturar-dos-ramas/proposal.md:148-149` | Fuera de la fila por su decisión |
| Propietario del registro | `openspec/config.yaml:1936` en `0e2b609b` y su consecuencia (5), `openspec/config.yaml:1942` en `0e2b609b` | F1C-13 | `openspec/config.yaml:5770` en `0e2b609b` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:422` en `0e2b609b` | **Pasa a F1C-13 por decisión** |
| Reasignar sólo la persona a cargo, y Solicitud / Entrega de repuestos sólo sus dos ejecutores | `openspec/config.yaml:4011-4014` en `0e2b609b` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2037` | F1C-13, con el propietario | La primera es «la restricción por propietario» (`openspec/config.yaml:4000` en `0e2b609b`); la segunda «llega con el nivel de permisos «propietario del registro»» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1620`) | Con el propietario, a F1C-13 (supuesto S-5) |

**Decisionales: qué cuenta como construido, y con qué decisión.** El código está construido, verificado (`pass_with_warnings`,
`openspec/changes/archive/2026-10-18-decisionales-por-cargo/verify-report.md:4`), archivado y fusionado (`da916152`). Que se
construyera antes del corte y detrás de un interruptor apagado lo ordenó Gerencia: «constrúyela ahora, pero detrás de un
interruptor que nazca apagado. Se enciende en enero, no antes del 14/12» (`openspec/config.yaml:5086` en `0e2b609b`). Que
siga apagado hasta enero lo confirma `decision/e248-adelanto-f1c` (2) (`openspec/config.yaml:5733` en `0e2b609b`), que mide
además que la «Liberación sin factura» del Director Comercial no depende de ese interruptor y está en vigor. Encenderlo es una tarea de
persona con fecha, no construcción (`openspec/changes/archive/2026-10-18-decisionales-por-cargo/archive-report.md:90`). El
precedente de contarlo como construido es la misma decisión: su (1) cuenta como cerrada F1C-03
(`openspec/config.yaml:5732` en `0e2b609b`), cuyo interruptor `SALIDAS_ESPERAS` su (2) mantiene apagado. Es el supuesto S-4.

**La nota 3, superada (caso C).** Su razón era que los Decisionales dependían de F1C-04. F1C-04 está cerrada por archivo,
fusionada el 18/10 en `f409b550` (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:102` en `0e2b609b`), y los
Decisionales se construyeron ese mismo día sobre su tabla validada (`openspec/config.yaml:5090-5093` en `0e2b609b`). Lo único
que queda fuera es el propietario, que la consecuencia (2) saca de la fila. Esta rama no edita la nota: en el plan se conserva
con su texto y se le añade qué la cerró.

**Fuera de la fila, y por eso no cuentan como pendientes:**

- Las salidas de emergencia, que adelantaban el nivel propietario, se construyen en F1C-03: «F1C-05 (permisos, archivada 30/09)
  NO se reabre» (`openspec/config.yaml:3434` en `0e2b609b`); `decision/f1c03-quien-ejecuta-salidas` retiró después la regla de la
  persona a cargo en las esperas externas (`openspec/config.yaml:5180` en `0e2b609b`).
- Los dos campos de cargo (E-092, Anexo D nº 75): una pregunta de Gerencia sin decidir, no construcción de la fila. La tarea P.3
  de `permisos-por-cargo` la dejó «sin destino asignado, a propósito»
  (`openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:111`). Es el supuesto S-6.
- El «+ Director Técnico» en «Aprobación», que la corrección 8 decía que sería alcance nuevo de F1C-05 si fuese una decisión real
  (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:410-415`): la R08.4 lo retiró
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:6921`). Caso C.
- La asignación de trabajo (E-098), que se apoya en el modelo de cargo, es de M6. Su pieza nueva, la disponibilidad por persona,
  nació sin destino (`docs/sdd/ENTRADA.md:1359` en `0e2b609b`) y E-142 la sitúa en 2027 (`docs/sdd/ENTRADA.md:1355` en `0e2b609b`
  y `docs/sdd/ENTRADA.md:1689` en `0e2b609b`).

**Conclusión de la medida:** de las piezas de la fila, ninguna queda sin construir y archivar sin que la saque una decisión. El
propietario del registro lo saca la consecuencia (2) hacia F1C-13; la alarma la saca E-102 hacia F1C-02, que la construyó; el
histórico lo saca `decision/p64-historico-c1`, sin tanda. Los Decisionales están construidos y apagados por decisión. Lo que no
saca una decisión escrita, y se trata por supuesto para que se pueda corregir, son dos lecturas: que las dos restricciones que
se nombran «propietario del registro» viajan con él (S-5) y que E-092 no es pieza de la fila (S-6). **No hay bloqueo.**

## Las piezas, en las specs vivas

Para el verify: cada pieza construida, con el requisito vivo que la impone.

| Pieza | Requisitos |
|---|---|
| Lista cerrada, columna, fuera de lista, alta y edición, sesión (RQ-PM-12 dice hoy «Ocho cargos»: el octavo es de F1C-11) | `openspec/specs/permissions/spec.md:306` (RQ-PM-12), `openspec/specs/permissions/spec.md:349` (RQ-PM-13), `openspec/specs/permissions/spec.md:372` (RQ-PM-14), `openspec/specs/permissions/spec.md:382` (RQ-PM-15) y `openspec/specs/permissions/spec.md:403` (RQ-PM-16) |
| Liberación sin factura → Director Comercial, su posición y el administrador | `openspec/specs/permissions/spec.md:413` (RQ-PM-17), `openspec/specs/permissions/spec.md:434` (RQ-PM-18) y `openspec/specs/permissions/spec.md:464` (RQ-PM-19) |
| Primitivas con llamador; el cargo sólo restringe; estricto sin cargo | `openspec/specs/permissions/spec.md:474` (RQ-PM-20), `openspec/specs/permissions/spec.md:506` (RQ-PM-21) y `openspec/specs/permissions/spec.md:531` (RQ-PM-22) |
| Top 5 y OVI con sus llamadores | `openspec/specs/permissions/spec.md:543` (RQ-PM-23, F1B-07), `openspec/specs/permissions/spec.md:698` (RQ-PM-24, F1B-03) y `openspec/specs/transitions-st/spec.md:2475` (RQ-TS-36, F1B-03) |
| Motivo, fecha prevista y texto, con su guarda | `openspec/specs/transitions-st/spec.md:2177` (RQ-TS-35), sobre `openspec/specs/transitions-st/spec.md:202` (RQ-TS-06), `openspec/specs/transitions-st/spec.md:314` (RQ-TS-08) y `openspec/specs/transitions-st/spec.md:364` (RQ-TS-09) |
| Decisionales por cargo: interruptor, regla, servidor y cliente; las tres «Anulación» no tienen escenario propio y las cubre la regla general de RQ-PM-29, con el área Comercial que les da `decision/f1c04-tabla-tipos-validada` (4) | `openspec/specs/permissions/spec.md:894` (RQ-PM-28), `openspec/specs/permissions/spec.md:921` (RQ-PM-29), `openspec/specs/permissions/spec.md:980` (RQ-PM-30) y `openspec/specs/permissions/spec.md:1021` (RQ-PM-31) |
| La alarma, fuera de la fila (F1C-02) | `openspec/specs/derivacion-avisos/spec.md:1174` (RQ-AV-23) |

## Las decisiones de respaldo, contrastadas

- **`decision/c10-permisos-cargo`** (`openspec/config.yaml:1927-1947` en `0e2b609b`): construida en sus tres restricciones y en la
  regla de las Decisionales; su propietario, aplazado por (5), pasa a F1C-13.
- **`decision/c10b-gerente-director`** (`openspec/config.yaml:2584-2598` en `0e2b609b`): los siete nombres, construidos; su (3), «Es
  contenido de F1C-05» (`openspec/config.yaml:2593` en `0e2b609b`), lo cerró `permisos-por-cargo`.
- **`decision/anexo-33-checkbox`** (`openspec/config.yaml:2373-2388` en `0e2b609b`): su parte de F1C-05, la restricción de cargo, la
  dice su (2) (`openspec/config.yaml:2381` en `0e2b609b`), y está construida con el motivo y la fecha; la alarma es de F1C-02.
- **`decision/fecha-corte` → `corregida_por`** (`openspec/config.yaml:2178-2192` en `0e2b609b`): «Antes del 14/12 entra la paridad
  operativa con Zoho más la restricción de liberar sin factura por cargo» (`openspec/config.yaml:2187-2188` en `0e2b609b`). Construida.
- **E-102** (`docs/sdd/ENTRADA.md:1379-1383` en `0e2b609b`): parte la liberación en dos momentos; el de antes del corte está
  construido y la alarma «llega con F1C-02» (`docs/sdd/ENTRADA.md:1380` en `0e2b609b`).
- **`decision/f1c04-tabla-tipos-validada`** (`openspec/config.yaml:5058-5078` en `0e2b609b`): su (4), las tres «Anulación» para el
  Director o el Coordinador Comercial, construida en `decisionales-por-cargo`.
- **`decision/f1c05-decisionales-por-cargo`** (`openspec/config.yaml:5080-5106` en `0e2b609b`): construida detrás del interruptor; su
  `tanda_que_abre` dice «el propietario del registro sigue aplazado» (`openspec/config.yaml:5106` en `0e2b609b`).
- **`decision/e248-adelanto-f1c`** (`openspec/config.yaml:5724-5739` en `0e2b609b`): su (2) mantiene `DECISIONALES_POR_CARGO` apagado
  hasta enero de 2027 y da en vigor la Liberación sin factura del Director Comercial (`openspec/config.yaml:5733` en `0e2b609b`).
- **`decision/e089-e220-visibilidad-y-traspaso`** (`openspec/config.yaml:3992-4019` en `0e2b609b`): su respuesta pone «la
  restricción por propietario después del corte con F1C-05» (`openspec/config.yaml:4000` en `0e2b609b`), y su (4) la desarrolla
  (`openspec/config.yaml:4011-4014` en `0e2b609b`); va con el propietario (S-5).
- **`decision/salida-emergencia-quien-la-ejecuta`** (`openspec/config.yaml:3426-3440` en `0e2b609b`): F1C-03, sin reabrir F1C-05.
- **`decision/cargo-encargado-de-inventario`** (`openspec/config.yaml:3488-3508` en `0e2b609b`): el octavo cargo, «sin fila»; lo
  construyó F1C-11.
- **`decision/cargos-se-asignan-tras-publicar-fuera-de-horario`** (`openspec/config.yaml:4402-4434` en `0e2b609b`) y
  **`decision/tabla-de-cargos-y-personas-10-10`** (`openspec/config.yaml:4438-4512` en `0e2b609b`): tareas de persona; los cargos
  «se asignaron el 2026-10-10, tras publicar», según un dato de producción (`openspec/config.yaml:4434` en `0e2b609b`).
- **`decision/margen-corte-09-11`**: su (2) cuenta F1C-05 entre las ocho filas de antes del corte que quedaban
  (`openspec/config.yaml:5751` en `0e2b609b`). Cerrada F1B-13, quedaban siete; con este cierre, seis.
- **`decision/filas-que-no-cierran-antes-del-corte`** (`openspec/config.yaml:5761-5778` en `0e2b609b`): este cambio es su (2).
- **`decision/orden-tandas-tras-e266`** (`openspec/config.yaml:5820-5836` en `0e2b609b`): pone este cierre tras E-266.

## Lo que sigue abierto y NO es contenido de la fila

- **F1C-13 recibe el propietario del registro**, con talla por medir y nombre como supuesto de nomenclatura
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:428` en `0e2b609b`).
- **Encender `DECISIONALES_POR_CARGO` en enero**, con los cargos asignados antes (`DEPLOY.md:754-774`). La línea del interruptor ya
  está en el fichero de ejemplo de entorno (`.env.example:40-41`).
- **Las preguntas de la paridad.** E-201 a E-205 siguen abiertas en la bandeja, con dueño Gerencia
  (`docs/sdd/ENTRADA.md:2002-2025` en `0e2b609b`). E-206 tiene su hipótesis despejada (`docs/sdd/ENTRADA.md:2032` en `0e2b609b`),
  pero su encabezado sigue diciendo «ABIERTA» (`docs/sdd/ENTRADA.md:2027` en `0e2b609b`).
- **Supuestos de la fila sin lista aceptada.** Los S-1 a S-6 de `decisionales-por-cargo` están en el anexo de «tomados y nunca
  publicados» (`docs/sdd/Supuestos_semana_2026-11-02.md:219`); los de `permisos-por-cargo` constan aceptados en su informe
  (`openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:79-83`).
- **El maestro.** La corrección 25 sigue sin pegar: su texto propuesto no aparece en la R08.4 (`grep -c "ya no lleva casilla"` da
  0), y su última frase, «La alarma por fecha vencida sigue pendiente (F1C-02)»
  (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1363-1364`), ya no es cierta: F1C-02 la construyó. M1.9.1 dice «La fila
  F1C-05 sigue abierta por el nivel «propietario del registro»»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1952`) y el §3.3 la marca «Parcial»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3930-3934`). Va con S-3.
- **El plan.** La fila sigue «en curso» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:103` en `0e2b609b`) y la nota 3
  sigue diciendo que no puede cerrar (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:269` en `0e2b609b`).
- **Las tareas de persona** de los tres cambios: en `tasks.md`, «Tareas de personas — fuera del recuento».

## Para Supervisión

Texto para los ficheros que esta rama no edita. Ninguno es contenido de la fila.

1. **Plan R01.4.** Al fusionar, la fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:103` en `0e2b609b`) pasa a
   «cerrada por archivo» con este cambio, y su remanente (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:220` en `0e2b609b`)
   gana la nota de que el nivel cargo cerró y el propietario está en F1C-13. La nota 3
   (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:269` en `0e2b609b`) queda superada, caso C, por la fusión de F1C-04
   (`f409b550`) y de `decisionales-por-cargo` (`da916152`). Si se acepta S-5, la fila de F1C-13
   (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:422` en `0e2b609b`) puede nombrar las dos restricciones que recibe.
2. **`openspec/config.yaml`.** `decision/e089-e220-visibilidad-y-traspaso` dice «la restricción por propietario, en F1C-05 después
   del corte» (`openspec/config.yaml:4019` en `0e2b609b`), como el título de su (4) (`openspec/config.yaml:4011` en `0e2b609b`), y
   `decision/orden-ocho-tandas-06-10` (3) dice «propietario (F1C-05, después del corte)» (`openspec/config.yaml:4302` en `0e2b609b`);
   desde la consecuencia (2), esa fila es F1C-13. Las decisiones no se reescriben: si hace falta, una nota de precisión.
3. **`docs/sdd/ENTRADA.md`.** E-092 «Afecta a: fila F1C-05» (`docs/sdd/ENTRADA.md:1279` en `0e2b609b`) y E-201 a E-206 llevan
   «F1C-05» en el título: con la fila cerrada, quien triage decide si su destino pasa a F1C-13 o a un punto abierto con dueño. El
   encabezado de E-206 puede pasar a cerrada por su propia actualización.
4. **Maestro, para el expediente.** Donde la R08.4 nombra F1C-05 por el propietario del registro
   (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1952`, `:3934` y `:4184`) y el Anexo D nº 75
   (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5587`), la fila es ahora F1C-13. Las correcciones 27 y
   30 dicen lo mismo con F1C-05 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1417-1419` y
   `docs/sdd/F0-01_Correcciones_para_el_maestro.md:1509-1510`). Y la 25 necesita perder su última frase antes de pegarse.
5. **`CLAUDE.md`, `docs/sdd/F0-05_Bloques_para_ClaudeCode.md` y `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md`:** no nombran F1C-05
   (`grep -n F1C-05` no da nada); sin texto.

## Alcance

### Dentro

- Este `proposal.md`, `tasks.md`, `verify-report.md` y `archive-report.md`.
- Al archivar, la carpeta pasa a `openspec/changes/archive/`. La prueba 11f/05g fija la lista «en curso» del árbol real con
  F1C-05 (`apps/desk/server/reconciliacion/registro.test.ts:218` en `0e2b609b` y
  `apps/desk/server/reconciliacion/registro.test.ts:220` en `0e2b609b`), y tiene que ponerse en rojo. Se ve el rojo y se corrige
  en sitio, sin mover líneas: de SIETE a SEIS, sin F1C-05, con `toContain('F1C-05')` en «cerradas por archivo». Es la única
  edición de código del cambio, con el molde de `8b3c4bac`, que hizo lo mismo con F1B-13.

### Fuera

- Código de producción, `openspec/specs/` y el maestro.
- Los seis ficheros de Supervisión, entre ellos `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `CLAUDE.md` y el expediente R08.4.
- El estado de la fila en el plan R01.4: se pone al día después del archivo, fuera de esta rama.
- `docs/sdd/RECONCILIACION.md`: se regenera para comprobar el efecto y se restaura sin commitear, porque lleva el commit medido
  en la cabecera. A la partida da siete «en curso» con F1C-05 (`docs/sdd/RECONCILIACION.md:21` en `0e2b609b`).

## Supuestos reversibles

| # | Supuesto | Alternativa |
|---|---|---|
| S-1 | `maestro: ["M1.9.1", "Anexo D nº 39"]`, el de `permisos-por-cargo` (`openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:10`). «M1.9.1» es la fuente de la fila de la R01.1 y el barrido la cruza (`apps/desk/server/reconciliacion/comprobaciones.ts:238`); con sólo «Anexo D nº 39», F1C-05 saldría «sin verificar» | `["M1.9", "Anexo D nº 39"]`, el de `decisionales-por-cargo`, que también cruza porque «M1.9» está dentro de «M1.9.1» |
| S-2 | `capacidad: [reconciliacion]`, porque el único efecto es el recuento del barrido y la prueba que lo fija; los tres cambios de la fila declararon `permissions`, `transitions-st` y `trazas` | `capacidad: [permissions, transitions-st, trazas]` |
| S-3 | `toca_maestro: no`, como los cierres sin código de F1B-04 y F1B-13. Lo que el maestro dice de F1C-05 es una foto de la revisión: el contenido no cambia, sólo el ID de la fila del propietario. El texto va en «Para Supervisión», punto 4 | `toca_maestro: si`, con el texto nuevo de M1.9.1, del §3.3 y del Anexo D para Gerencia |
| S-4 | Lo construido, verificado y archivado detrás de un interruptor que una decisión mantiene apagado cuenta como construido: Gerencia lo pidió así (`openspec/config.yaml:5086` en `0e2b609b`) y `decision/e248-adelanto-f1c` (1) cuenta igual F1C-03 (`openspec/config.yaml:5732` en `0e2b609b`) | Que la fila no cierre hasta encender `DECISIONALES_POR_CARGO` en enero; contradiría la consecuencia (2), que la cierra antes del corte |
| S-5 | Reasignar sólo la persona a cargo (`openspec/config.yaml:4011-4014` en `0e2b609b`) y Solicitud / Entrega de repuestos sólo sus dos ejecutores (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2037`) son nivel propietario del registro y van con él a F1C-13, aunque la fila de F1C-13 no las nombre (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:422` en `0e2b609b`) | Que Gerencia las sitúe en otra fila |
| S-6 | Los dos campos de cargo (E-092, Anexo D nº 75) son una pregunta de Gerencia, no pieza de la fila: ni la fila ni sus decisiones de respaldo los nombran, aunque E-092 (`docs/sdd/ENTRADA.md:1279` en `0e2b609b`) y el Anexo D nº 75 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5587`) los atan a F1C-05; por eso es supuesto y no hecho. Si la respuesta pide unificarlos, es trabajo nuevo con su fila | Que Gerencia la asigne a F1C-13 |

## Riesgos

- **Cita en prosa que caduca:** las líneas 218 y 220 de `apps/desk/server/reconciliacion/registro.test.ts`, contadas en `0e2b609b`, se reescriben en
  sitio; al cerrar se barre la regla de mutación 4 sobre ese fichero.
- **Otro cierre sin código a la vez:** el de F1C-07 va en el mismo orden (`openspec/config.yaml:5829` en `0e2b609b`). Si se archiva
  antes con `cierra: si`, cambia la misma lista; entonces se corrige contra la del árbol de ese momento, conservando las dos bajas.
- **Registro de intentos:** el archivo mide la mudanza dos veces (regla del ciclo 2, desvío 3); se abre con un techo de dos
  veces la carpeta más 800 (regla del archivo).
