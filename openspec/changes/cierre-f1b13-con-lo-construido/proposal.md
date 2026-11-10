---
tanda: F1B-13
motivo: ""
capacidad: [reconciliacion]
maestro: ["M4.4", "Anexo D nº 7"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: cierre de F1B-13 con lo construido

## Intención

Gerencia decidió el 2026-11-09 que F1B-13 cierra con lo construido: «F1B-13: la remisión sin ticket pasa a F1B-16 y la fila
cierra con lo construido» (`decision/filas-que-no-cierran-antes-del-corte`, respuesta 3,
`openspec/config.yaml:5767` en `93c29225`). Su consecuencia (1) lo concreta: el envío físico de la pieza por remisión sin
ticket pasa a F1B-16 y «F1B-13 cierra con lo construido, sin código» (`openspec/config.yaml:5769` en `93c29225`); y la
decisión abre «dos cambios de cierre sin código (F1B-13 y el nivel cargo de F1C-05)» (`openspec/config.yaml:5778` en `93c29225`).
El orden lo fija `decision/orden-tandas-tras-e266` (1): después de E-266, los tres cierres sin código, entre ellos F1B-13
(`openspec/config.yaml:5829` en `93c29225`). E-266 está fusionado en `main` (`abc632ca`).

**Es un cambio documental.** No toca código de producción, ni `openspec/specs/`, ni el maestro. Su único efecto medible es
que, archivado, F1B-13 pasa de «en curso» a «cerradas por archivo» en el barrido de `npm run reconcile`. Como F1B-13 no
tiene fila en la R01.1, el barrido la cuenta entre las «cerradas sin fuente declarada en la R01.1»
(`apps/desk/server/reconciliacion/comprobaciones.ts:257`) y no la marca «sin verificar», que sólo se juzga contra una fila
de la R01.1 (`apps/desk/server/reconciliacion/comprobaciones.ts:228-240`).

Las citas a `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y `docs/sdd/R08.4_Expediente_de_cambios.md` van ancladas en
`93c29225`, el commit de partida: son ficheros de Supervisión y cambian en `main`. También van ancladas las de
`apps/desk/server/reconciliacion/registro.test.ts` y `docs/sdd/RECONCILIACION.md`, que cambian al archivar.

## Qué pide la fila, medido

- **Su origen**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:25`: «Reclamación de garantía al fabricante»,
  capacidad `tickets-core`, fuente `decision/anexo-7-garantia-proveedor`, talla S, «junto a F1B-03». La R01.1 no la tiene
  (`grep -c F1B-13` sobre `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` da 0), y la R01.4 dice que conserva
  el ID que le propuso la R01.2 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:145`).
- **La fila vigente**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93`: «Ficha de garantía con el proveedor
  (reclamación al fabricante vinculada a ticket y OVI)», talla S, antes del 14/12, «en curso», con
  `decision/anexo-7-garantia-proveedor` de respaldo y la nota del 09/11 que nombra este cambio y pasa el envío físico a F1B-16.
- **El contenido, en la respuesta textual de esa decisión** (`openspec/config.yaml:2345` en `93c29225`): una ficha propia
  vinculada al ticket y a la OVI de garantía, fuera del blueprint; la pregunta «¿Se reclama al fabricante?» del Director
  Técnico, con tres motivos cerrados para el «no»; los datos de la ficha (fabricante, pieza con referencia y serial, ticket y
  OVI de origen, RMA, valor reclamado «tomado del costo de la OVI», estado con resultado y valor recuperado); el aviso a los
  60 días; y la medición de lo recuperado frente a lo reclamado por marca y de las piezas con fallas repetidas, «que
  alimentan la taxonomía ISO 14224».
- **El pasaje del maestro**, M4.4 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2660-2668`),
  dice lo mismo y añade una pieza que la decisión no nombra: «El envío físico de la pieza al fabricante usa la remisión sin
  ticket» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2667`).
- **El remanente**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:217`, escrito el 09/10: faltaban «el valor
  reclamado desde el costo de la OVI y las dos mediciones» y «el envío físico por remisión sin ticket, que depende de F1B-16».
- **La nota 4** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:355`): F1B-13 no es paridad, pero se mantiene
  antes del corte.
- **La fila que recibe la pieza**, F1B-16 «Remisiones sin ticket»
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96`), con la nota del 09/11.

## Qué cubrió cada cambio archivado (los tres llevan `tanda: F1B-13`, `cierra: no`)

| Cambio | Qué cubrió | Por qué declaró `cierra: no` | Dónde se dice |
|---|---|---|---|
| `2026-10-06-ficha-garantia-proveedor` | La pregunta con sus tres motivos, la ficha con sus datos y sus tres estados, el permiso del Director Técnico, el aviso a los 60 días y el panel en el detalle del ticket | Dejaba fuera el valor reclamado del costo de la OVI, las dos mediciones y el envío físico (`openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/proposal.md:49-60`) | `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:6-10` |
| `2026-10-17-medicion-garantias-por-marca` | Las dos mediciones, calculadas en `shared`, con su `GET` y su vista; y, antes de fusionar, el acceso por cargo y el número de ticket de `decision/medicion-garantias-acceso` | Seguían fuera el valor reclamado del costo y el envío físico (`openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/proposal.md:18-19`) | `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:6-10` y `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:92-104` |
| `2026-10-26-valor-reclamado-usd` | La foto del valor reclamado en USD al abrir la ficha, su origen al editar y la moneda de todos los importes de la ficha y de la medición | Quedaban el envío físico, que depende de F1B-16, y la tarea de persona P-1 (`openspec/changes/archive/2026-10-26-valor-reclamado-usd/archive-report.md:8-11`) | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/archive-report.md:7-11` |

Tras el tercero, la única pieza de construcción que la fila seguía esperando era el envío físico; lo otro que retenía el
`cierra` era una tarea de persona, que no retiene una fila (regla del ciclo 1). El envío físico es la pieza que la
consecuencia (1) pasa a F1B-16.

## Contraste pieza a pieza

| Pieza | Fuente | Quién la cubre | Dónde se dice | Estado |
|---|---|---|---|---|
| Ficha propia vinculada al ticket y a la OVI de garantía, fuera del blueprint | `openspec/config.yaml:2345` en `93c29225` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93` | `ficha-garantia-proveedor`: tabla `public.garantia_proveedor`, capa de datos, cuatro rutas y panel | `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:19-24` | Construida |
| Vínculo con la OVI de garantía: el acto de asociarla, del que cuelga la pregunta | `decision/e157-ovi-garantia-por-cargo` (8), `openspec/config.yaml:3986` en `93c29225` | F1B-03 (`ovi-garantia-por-cargo`); la ficha lo consume | `openspec/config.yaml:6078-6080` en `93c29225` | Construido por F1B-03 |
| «¿Se reclama al fabricante?», con los tres motivos cerrados del «no» | `openspec/config.yaml:2345` en `93c29225` | `ficha-garantia-proveedor` | `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:6-7` | Construida como acto propio sobre cada OVI asociada, no «al crear la OVI» (salvedad, abajo) |
| Datos de la ficha: fabricante, pieza (referencia y serial), ticket y OVI de origen, RMA | `openspec/config.yaml:2345` en `93c29225` | `ficha-garantia-proveedor` | `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:6-8` | Construida |
| Estado abierta → enviada al fabricante → resuelta, con resultado (reposición, nota crédito o rechazada) y valor recuperado | `openspec/config.yaml:2345` en `93c29225` | `ficha-garantia-proveedor` | `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:6-8` | Construida, con tres estados (salvedad, abajo) |
| Responde y gestiona el Director Técnico | `openspec/config.yaml:2345` en `93c29225` | `ficha-garantia-proveedor`: `puedeGestionarReclamacion`, envoltorio de `puedeCrearOVIGarantia` | `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:19-20` | Construida |
| Aviso al Director Técnico si la reclamación lleva más de 60 días abierta | `openspec/config.yaml:2345` en `93c29225`; por cargo de permiso, `openspec/config.yaml:4482-4485` en `93c29225` | `ficha-garantia-proveedor` | `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:25-27` | Construida; que los días sean naturales lo confirma una persona (P-2), no es construcción |
| Valor reclamado tomado del costo | `openspec/config.yaml:2345` en `93c29225`, precisado por `decision/f1b13-valor-reclamado-usd` (`openspec/config.yaml:5448` en `93c29225` y `openspec/config.yaml:5462-5463` en `93c29225`) | `valor-reclamado-usd`: foto al abrir, cantidad × costo de catálogo, origen `ovi`, editable a mano | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/archive-report.md:22-30` | Construida |
| Moneda junto a cada importe, USD en los dos lados, conversión a mano y S-4 «en USD» | `openspec/config.yaml:5448` en `93c29225` y `openspec/config.yaml:5464` en `93c29225` | `valor-reclamado-usd` | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/archive-report.md:25-27` y `openspec/changes/archive/2026-10-26-valor-reclamado-usd/archive-report.md:31` | Construida; S-8 y S-10 aceptados (`openspec/config.yaml:5808` en `93c29225`) |
| Medición: lo recuperado frente a lo reclamado, por marca | `openspec/config.yaml:2345` en `93c29225` | `medicion-garantias-por-marca` | `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:20-23` | Construida |
| Medición: piezas con fallas repetidas | `openspec/config.yaml:2345` en `93c29225` | `medicion-garantias-por-marca` | `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:23-24` | Construida |
| Quién ve la medición (administradores y los dos directores, `403` en el servidor) y el número del ticket en las fallas repetidas | `decision/medicion-garantias-acceso`, `openspec/config.yaml:4787` en `93c29225` | La corrección de `medicion-garantias-por-marca` antes de fusionar | `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:98-104` | Construida |
| Regla general «todo importe lleva su moneda», en la parte de F1B-13 | `openspec/config.yaml:5448` en `93c29225` y `openspec/config.yaml:5465` en `93c29225` | `valor-reclamado-usd`, para los importes de la ficha y de la medición | «La parte de F1B-13 ya la cerraron S-8 y S-10» (`openspec/config.yaml:5866` en `93c29225`) | Construida; el resto de importes, fuera de la fila por `decision/e274-moneda-total-ov` (`openspec/config.yaml:5864-5865` en `93c29225`) |
| Las fallas repetidas alimentan la taxonomía ISO 14224 | `openspec/config.yaml:2345` en `93c29225` y su consecuencia (5), `openspec/config.yaml:2351` en `93c29225` | Nadie: la taxonomía la abre `decision/anexo-56-taxonomia`, con F1D-07 (`openspec/config.yaml:2486` en `93c29225`), fila de después del corte (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:117`) | «otra fila» para el segundo cambio (`openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:8-10`); ni la fila ni su remanente la nombran | Fuera de la fila por su fuente (supuesto S-4) |
| Envío físico de la pieza al fabricante por remisión sin ticket | `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2667` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:217` | F1B-16 | `openspec/config.yaml:5769` en `93c29225` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96` | **Pasa a F1B-16 por decisión** |

**Fuera de la fila, y por eso no cuentan como pendientes:**

- La mitad abierta de E-157, «OVI sólo en garantía», sigue con dueño el Director Técnico
  (`openspec/config.yaml:6082-6083` en `93c29225`), y la bandeja la deja en F1B-03 (`docs/sdd/ENTRADA.md:1781` en `93c29225`).
- El aviso «En garantía» (E-105), que la bandeja acercaba a F1B-13 cuando F1B-13 no tenía fila
  (`docs/sdd/ENTRADA.md:1400-1401` en `93c29225`), es F1B-18 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:157`),
  cerrada por archivo (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:98`).

**Cuatro salvedades declaradas, que no son piezas sin construir:**

- **La pregunta va sobre cada OVI asociada, no «al crear la OVI».** La decisión y el maestro dicen «Al crear la OVI de
  garantía» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2663`), pero Desk no crea la OVI: el
  acto es asociarla (`openspec/config.yaml:3967-3968` en `93c29225`). Se construyó como acto propio sobre la asociación (S-1,
  `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/proposal.md:156`), y la corrección 29 lo lleva al maestro
  (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1470-1473`).
- **Tres estados, no cuatro.** La consecuencia (2) habla de «cuatro estados internos» (`openspec/config.yaml:2348` en `93c29225`)
  y la respuesta textual enumera tres; se construyeron tres, y el informe de archivo lo dejó anotado
  (`openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:83-84`).
- **El costo es el del catálogo del artículo, no el de la línea de la OVI.** Lo fija la consecuencia (2) de
  `decision/f1b13-valor-reclamado-usd` (`openspec/config.yaml:5462-5463` en `93c29225`). El maestro dice lo contrario en
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1232`, y la corrección 29 enmendada lo recoge
  (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1474-1476`).
- **Los 60 días naturales** son una interpretación registrada (`openspec/config.yaml:2350` en `93c29225`), construida como
  S-7 de `ficha-garantia-proveedor` y pendiente de confirmar por Gerencia (P-2).

**Conclusión de la medida:** ninguna pieza de la fila queda sin construir y archivar sin que la saque una decisión. De las
tres que el remanente daba por pendientes (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:217`), dos se
construyeron y archivaron después (`medicion-garantias-por-marca` y `valor-reclamado-usd`), y la tercera, el envío físico,
la pasa a F1B-16 la consecuencia (1). Queda **una** pieza de la decisión de respaldo sin construir, la carga de las fallas
repetidas en la ISO 14224. La fila no la nombra, la decisión la engancha a otra (`decision/anexo-56-taxonomia`) y ninguna
respuesta de Gerencia la nombra al cerrar: se trata como fuera de la fila (S-4) y se escribe aquí para que se pueda
corregir. Lo demás son tareas de persona y supuestos.

## Las piezas, en las specs vivas

Para el verify: cada pieza construida, con el requisito vivo que la impone.

| Pieza | Requisitos |
|---|---|
| Respuesta, ficha y lectura por ticket | `openspec/specs/tickets-core/spec.md:2420` (RQ-TC-44), `openspec/specs/tickets-core/spec.md:2542` (RQ-TC-45) y `openspec/specs/tickets-core/spec.md:2738` (RQ-TC-48) |
| Estados y edición | `openspec/specs/tickets-core/spec.md:2600` (RQ-TC-46) y `openspec/specs/tickets-core/spec.md:2675` (RQ-TC-47) |
| Panel en el detalle del ticket, regla 13 | `openspec/specs/tickets-core/spec.md:2788` (RQ-TC-49) |
| Permiso del Director Técnico | `openspec/specs/permissions/spec.md:769` (RQ-PM-26), sobre el de asociar la OVI, `openspec/specs/permissions/spec.md:698` (RQ-PM-24, F1B-03) |
| Aviso a los 60 días | `openspec/specs/derivacion-avisos/spec.md:786` (RQ-AV-19) |
| Medición por marca y fallas repetidas | `openspec/specs/tickets-core/spec.md:3917` (RQ-TC-65) y `openspec/specs/tickets-core/spec.md:3998` (RQ-TC-66) |
| Acceso a la medición y vista | `openspec/specs/tickets-core/spec.md:4046` (RQ-TC-67) y `openspec/specs/tickets-core/spec.md:4095` (RQ-TC-68) |
| Valor reclamado del costo y su origen | `openspec/specs/tickets-core/spec.md:4524` (RQ-TC-78) y `openspec/specs/tickets-core/spec.md:4594` (RQ-TC-79) |
| Moneda en todos los importes | `openspec/specs/tickets-core/spec.md:4626` (RQ-TC-80) |

## Las decisiones de respaldo, contrastadas

- **`decision/anexo-7-garantia-proveedor`** (`openspec/config.yaml:2340-2355` en `93c29225`): construida, salvo la carga en la
  ISO 14224 (S-4). El envío físico no está en la decisión sino en el maestro, y pasa a F1B-16.
- **`decision/e157-ovi-garantia-por-cargo`** (`openspec/config.yaml:3954-3990` en `93c29225`) y su registro de panel
  **`decision/ovi-garantia-que-es-en-desk`** (`openspec/config.yaml:6062-6087` en `93c29225`): el acto de asociar la OVI lo
  construyó F1B-03, y «detrás, F1B-13» (`openspec/config.yaml:6078-6080` en `93c29225`).
- **`decision/orden-ocho-tandas-06-10`** (`openspec/config.yaml:4288-4308` en `93c29225`): sólo el orden, con F1B-13 en
  segundo lugar (`openspec/config.yaml:4295` en `93c29225`); no añade contenido.
- **`decision/tabla-de-cargos-y-personas-10-10`** (`openspec/config.yaml:4438` en `93c29225`): su consecuencia (4) mide que el
  aviso de 60 días usa el cargo de permiso (`openspec/config.yaml:4482-4485` en `93c29225`), que es lo construido.
- **`decision/medicion-garantias-acceso`** (`openspec/config.yaml:4780-4800` en `93c29225`): construida antes de fusionar
  `medicion-garantias-por-marca`.
- **`decision/f1b13-valor-reclamado-usd`** (`openspec/config.yaml:5443-5469` en `93c29225`): construida. Su (1) cierra la P-1 de
  `ficha-garantia-proveedor` (`openspec/config.yaml:5459-5461` en `93c29225`).
- **`decision/supuestos-02-11-aceptados`** (`openspec/config.yaml:5801-5815` en `93c29225`): acepta los 54 supuestos de la
  lista del 02/11, «incluidos F1B-13 S-8 y S-10» (`openspec/config.yaml:5808` en `93c29225`); de ellos, 21 filas son de F1B-13
  (`docs/sdd/Supuestos_semana_2026-11-02.md:182`).
- **`decision/e274-moneda-total-ov`** (`openspec/config.yaml:5855-5871` en `93c29225`): la parte de F1B-13 ya está cerrada; el
  total de la orden de venta va a una tanda corta después del corte, y los otros 32 importes se quedan como copia de Zoho
  (`openspec/config.yaml:5864-5866` en `93c29225`).
- **`decision/filas-que-no-cierran-antes-del-corte`** (`openspec/config.yaml:5761-5778` en `93c29225`): este cambio es su
  consecuencia (1).
- **`decision/orden-tandas-tras-e266`** (`openspec/config.yaml:5820-5836` en `93c29225`): pone este cierre detrás de E-266.
- **`decision/margen-corte-09-11`**: su (2) cuenta F1B-13 entre las ocho filas de antes del corte que quedaban
  (`openspec/config.yaml:5751` en `93c29225`). Con este cierre quedan siete.

## Lo que sigue abierto y NO es contenido de la fila

- **F1B-16 recibe el envío físico de la pieza** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96`). Es la fila de
  E-104, cuya lista de motivos ya incluye «envío al fabricante por garantía» (`docs/sdd/ENTRADA.md:1392` en `93c29225`).
- **La carga de las fallas repetidas en la ISO 14224**: la P-3 de `medicion-garantias-por-marca` pide que Gerencia sitúe la
  fila (`openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:90`). Ningún fichero de `apps` ni
  de `packages` nombra la norma (`git grep -c 14224 -- apps packages` no da nada en `93c29225`); que la taxonomía no exista
  todavía en el código es hipótesis.
- **La bandeja.** Ninguna entrada tiene F1B-13 por destino: `grep -n F1B-13 docs/sdd/ENTRADA.md` da siete líneas, todas en
  tres entradas.
  - E-105 la nombra como «la fila más próxima» (`docs/sdd/ENTRADA.md:1400-1401` en `93c29225`); se decidió como F1B-18.
  - E-157 está cerrada; su mitad abierta es de F1B-03 (`docs/sdd/ENTRADA.md:1781` en `93c29225`).
  - E-274 está ruteada, y su parte de F1B-13 la cerraron S-8 y S-10 (`docs/sdd/ENTRADA.md:2468-2469` en `93c29225`).
  - E-034 es el origen de la decisión, cerrada (`docs/sdd/ENTRADA.md:544-549` en `93c29225`).
  - La P-1 de `valor-reclamado-usd` iba a tener entrada «en `main` al fusionar»
    (`openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:192`), y no la tiene:
    `grep -n -i "en pesos" docs/sdd/ENTRADA.md` no da nada en `93c29225`.

  `docs/sdd/ENTRADA.md` es de Supervisión y no se edita en la rama: va en la lista para Supervisión.
- **Supuestos de la fila sin lista aceptada.** Los de `medicion-garantias-por-marca` están en el anexo de supuestos «tomados y
  nunca publicados» (`docs/sdd/Supuestos_semana_2026-11-02.md:217`). Los S-1 a S-12 de `ficha-garantia-proveedor` no aparecen
  en ninguna lista: el anexo sólo recoge cambios archivados desde el 2026-10-09
  (`docs/sdd/Supuestos_semana_2026-11-02.md:192`), y que nunca se publicaran es hipótesis.
- **El maestro.** La tabla del §3.3 marca F1B-13 «Sin empezar»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3894-3898`). La corrección 29 sigue sin pegar
  (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1456`): su punto 3 dice que el envío físico «queda fuera» y retira «Cierra
  el punto 7 del Anexo D» (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1477-1480`), y su párrafo final dice que no cierra
  el punto 7 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1482-1486`). El expediente la recoge en su §18
  (`docs/sdd/R08.4_Expediente_de_cambios.md:363` en `93c29225`). Va con S-3.
- **El plan.** La fila sigue «en curso» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93`) y el remanente da por
  pendientes dos piezas construidas (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:217`).
- **F1B-09** espera al cierre de la épica 1B, en la que seguían abiertas F1B-13 y las filas de 2027
  (`openspec/config.yaml:5619` en `93c29225`).
- **Las tareas de persona** de los tres cambios: en `tasks.md`, «Tareas de personas — fuera del recuento».

## Alcance

### Dentro

- Este `proposal.md`, `tasks.md`, `verify-report.md` y `archive-report.md`.
- Al archivar, la carpeta pasa a `openspec/changes/archive/`. La prueba 11f/05g fija la lista «en curso» del árbol real con
  F1B-13 (`apps/desk/server/reconciliacion/registro.test.ts:218` en `93c29225` y
  `apps/desk/server/reconciliacion/registro.test.ts:220` en `93c29225`), y tiene que ponerse en rojo. Se ve el rojo y se
  corrige en sitio, sin mover líneas: de OCHO a SIETE, sin F1B-13, con `toContain('F1B-13')` en «cerradas por archivo». Es
  la única edición de código del cambio, con el molde de `f275d5da`, que hizo lo mismo con F1B-04.

### Fuera

- Código de producción, `openspec/specs/` y el maestro.
- Los seis ficheros de Supervisión, entre ellos `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `CLAUDE.md` y
  `docs/sdd/R08.4_Expediente_de_cambios.md`.
- El estado de la fila en el plan R01.4 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93` dice «en curso»): se
  pone al día después del archivo, fuera de esta rama.
- `docs/sdd/RECONCILIACION.md`: se regenera para comprobar el efecto y se restaura sin commitear, porque lleva el commit medido
  en la cabecera. A la partida da ocho «en curso» con F1B-13 (`docs/sdd/RECONCILIACION.md:21` en `93c29225`).

## Supuestos reversibles

| # | Supuesto | Alternativa |
|---|---|---|
| S-1 | `maestro: ["M4.4", "Anexo D nº 7"]`, el de `ficha-garantia-proveedor`, que leyó el pasaje de M4.4 y lo emparejó con el nº 7 (`openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/proposal.md:18-21`); los otros dos cambios llevan sólo «Anexo D nº 7» (`openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/proposal.md:5` y `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:5`). Como F1B-13 no tiene fila en la R01.1, el barrido no lo cruza (`apps/desk/server/reconciliacion/comprobaciones.ts:228-240`) | `maestro: ["Anexo D nº 7"]`, como los dos últimos cambios |
| S-2 | `capacidad: [reconciliacion]`, porque el único efecto es el recuento del barrido y la prueba que lo fija; la R01.2 da `tickets-core` (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:25`), y el primer cambio de la fila declaró tres (`openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/proposal.md:4`) | `capacidad: [tickets-core, permissions, derivacion-avisos]` |
| S-3 | `toca_maestro: no`, como el precedente de F1B-04. La columna «Sin empezar» del §3.3 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3894-3898`) es una foto de la revisión, y la corrección de contenido ya está entregada en la 29 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1456`). Que su punto 3 deba decir que el envío físico pasa a F1B-16 lo decide quien la pegue | `toca_maestro: si`, con el texto nuevo del §3.3 y del punto 3 de la corrección 29 para Gerencia |
| S-4 | La carga de las fallas repetidas en la ISO 14224 no es contenido de la fila: ni la fila ni su remanente la nombran, la decisión la engancha a `decision/anexo-56-taxonomia` (`openspec/config.yaml:2351` en `93c29225`), cuya tanda es F1D-07 (`openspec/config.yaml:2486` en `93c29225`), y Gerencia dio la fila por cerrada «con lo construido» | Que Gerencia la asigne a F1B-13 y la fila no cierre hasta que exista la taxonomía, o que la sitúe por escrito en F1D-07 |
| S-5 | La P-1 de `valor-reclamado-usd` (contar las fichas previas con importe, por si alguna se anotó en pesos) sigue abierta, con su dueño, aunque S-8 está aceptado | Que Gerencia la dé por cerrada con S-8 |

## Riesgos

- **Cita en prosa que caduca:** las líneas 218 y 220 de `apps/desk/server/reconciliacion/registro.test.ts` se reescriben en
  sitio; al cerrar se barre la regla de mutación 4 sobre ese fichero.
- **Otro cierre sin código a la vez:** los de F1C-05 y F1C-07 van en el mismo orden (`openspec/config.yaml:5829` en `93c29225`).
  Si uno se archiva antes con `cierra: si`, cambia la misma lista (hipótesis para F1C-05, cuya fila se parte); entonces la
  lista se corrige contra la del árbol de ese momento, conservando las dos bajas.
- **Registro de intentos:** el archivo mide la mudanza dos veces (regla del ciclo 2, desvío 3); se abre con un techo de dos
  veces la carpeta más 800 (regla del archivo).
