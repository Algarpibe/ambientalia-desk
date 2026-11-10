---
tanda: F1C-07
motivo: ""
capacidad: [reconciliacion]
maestro: ["M9.1", "M1.7", "M2.5"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: cierre de F1C-07 con lo construido

## Intención

Gerencia decidió el 2026-11-09 que F1C-07 cierra con lo construido: «lo que falta de F1C-07 va a F1B-17 (foto del embalado y
guarda de salida) y a F1E-04 (firma con imagen), y F1C-07 cierra con lo construido» (`decision/e248-adelanto-f1c`, respuesta 1,
`openspec/config.yaml:5730` en `9223318f`). Su consecuencia (3) lo concreta: «F1C-07 cierra con lo construido, como cambio de
cierre sin código. Pasan la foto del equipo embalado y la guarda de salida a F1B-17, y la firma con imagen a F1E-04»
(`openspec/config.yaml:5734` en `9223318f`), y su `tanda_que_abre` es este cierre (`openspec/config.yaml:5739` en `9223318f`).
El orden lo fija `decision/orden-tandas-tras-e266` (1): tras E-266, los tres cierres sin código, el último F1C-07
(`openspec/config.yaml:5829` en `9223318f`). Los dos primeros están fusionados en `main`: F1B-13 (`d12fa198`) y F1C-05 (`b195b368`).

**Es un cambio documental.** No toca código de producción, ni `openspec/specs/`, ni el maestro. Su único efecto medible es
que, archivado, F1C-07 pasa de «en curso» a «cerradas por archivo» en el barrido de `npm run reconcile`. F1C-07 tiene fila en la
R01.1, con fuente «M9.1» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:180`, que el barrido toma de la cuarta
columna de la tabla en `apps/desk/server/reconciliacion/comprobaciones.ts:134-141`): el `maestro:` de la cabecera la cita, así
que el barrido no la marca «sin verificar» (`apps/desk/server/reconciliacion/comprobaciones.ts:237-239`).

Las citas a `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y al plan R01.4 van ancladas en `9223318f`, el commit de partida:
cambian en `main`. También van ancladas las de `apps/desk/server/reconciliacion/registro.test.ts` y
`docs/sdd/RECONCILIACION.md`, que cambian al archivar.

## Qué pide la fila, medido

- **Su origen**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:180`: «**C6** Etapa de QA/QC antes de la liberación,
  con retrabajo; base de las etapas de validación con firma», con el gate «Diseño conjunto con las firmas de certificados
  (27/08); depende de C12» y fuente M9.1. En el §5 de la R01.1 va en la fila colapsada `F1C-01…08`, talla S–M
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:509`). Su fila de decisión en el §4.5 de la R01.1 es la de
  `decision/c6-qa-liberacion` (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:407`), y hereda la de
  `decision/p38-verificacion-calidad` (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:395`).
- **La R01.2** no tiene fila con el ID (`grep -c F1C-07` da 0) y sólo sitúa «C6 (el estado Control de calidad)» en S48
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:131`). **La R01.3** saca del corte las siete de 1C que no son de
  paridad, entre ellas C6 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:67` y
  `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:75`).
- **La fila vigente**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:105` en `9223318f`: «C6 Control de calidad antes
  de liberar», talla S–M, después del corte, estado «pendiente», con `decision/c6-qa-liberacion` de respaldo y la nota del 09/11
  que nombra este cambio y reparte lo que falta entre F1B-17 y F1E-04.
- **Sin remanente ni nota numerada.** La fila es de después del corte y no entra en la tabla de trabajo pendiente del §F.3; en
  todo el plan R01.4 sólo la nombran tres líneas (`grep -n F1C-07`): la propia fila y las dos que reciben sus piezas.
- **Las filas que reciben las piezas**: F1B-17 «Remisión de salida en la entrega, con su guarda y sus fotos», condicionada
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:97` en `9223318f`), y F1E-04 «Validación y firma (tres firmas)»
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:123` en `9223318f`), las dos con su nota del 09/11.
- **El contenido, en la respuesta textual de su decisión** (`openspec/config.yaml:1889-1893` en `9223318f`): el estado entre
  `En Proceso` y `Por Facturar`, aprobado → `Por Facturar`, rechazado → `En Proceso` con prioridad alta y retrabajo registrado;
  checklist siempre y gas patrón cuando aplica; el checklist revisa los puntos que fallaron en el diagnóstico y alimenta el
  informe de salida; no se entrega sin foto del embalado y checklist firmado; firma el Coordinador Técnico, nunca quien hizo
  el trabajo, con la imagen del responsable.
- **El maestro**, M9.1 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3244-3256`): las cuatro piezas
  de partida (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3245-3248`) y su concreción en el estado
  de C6, dónde, salidas, qué se revisa, guardas de entrega, quién firma, rutas abreviadas y cuándo
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3249-3256`). M1.7 pone la guarda de salida desde
  `Por Entregar` (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1829`) y M2.5 iguala la firma
  «Revisó» del informe con la del Control de calidad (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2390`).

## Qué cubrió el cambio archivado (uno solo lleva `tanda: F1C-07`, con `cierra: no`)

`grep -l "^tanda: F1C-07" openspec/changes/archive/*/proposal.md` da un único cambio.

| Cambio | Qué cubrió | Por qué declaró `cierra: no` | Dónde se dice |
|---|---|---|---|
| `2026-10-20-control-calidad-liberacion` | El estado `Control de calidad` con sus tres transiciones; aprobado → `Por Facturar` y rechazado → `En Proceso` con prioridad alta y retrabajo contable; el checklist y el gas patrón impuestos por el servidor; la firma por persona («nunca quien intervino»), con vacante y administrador de respaldo; el aviso a los administradores; todo detrás de `CONTROL_CALIDAD_LIBERACION`, apagado | Dejaba fuera la foto del embalado y la guarda de salida, la firma con imagen, el checklist alimentado por el diagnóstico, el informe de salida y la calibración directa por QA (D11) | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:7-13` y `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:69-77` |

Se fusionó en `main` en `afccdcf0` (20/10), con verify «PASS con avisos», 0 CRITICAL
(`openspec/changes/archive/2026-10-20-control-calidad-liberacion/verify-report.md:6`). Una pieza de D11, la calibración directa
por Control de calidad, la construyó después otra fila con su propio `tanda:` (F1C-08, abajo).

## Contraste pieza a pieza

| Pieza | Fuente | Quién la cubre | Dónde se dice | Estado |
|---|---|---|---|---|
| Estado `Control de calidad` entre `En Proceso` y `Por Facturar` | `openspec/config.yaml:1889` en `9223318f` y su (1), `openspec/config.yaml:1895` en `9223318f` | `control-calidad-liberacion`: `packages/shared/src/estados.ts:99` y las tres transiciones en `packages/shared/src/transitions.ts:262` | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:83` | Construida detrás de `CONTROL_CALIDAD_LIBERACION`, apagado hasta enero (S-4) |
| Aprobado → `Por Facturar` | `openspec/config.yaml:1889` en `9223318f` | `control-calidad-liberacion` | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:84` | Construida, mismo interruptor; las dos salidas no dependen de él |
| Rechazado → `En Proceso` con prioridad alta | `openspec/config.yaml:1889` en `9223318f` | `control-calidad-liberacion`: `prioridadTrasRechazo` (`packages/shared/src/controlCalidad.ts:92`) | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:85` | Construida |
| El retrabajo queda registrado para medirlo | `openspec/config.yaml:1889` en `9223318f` y su (5), `openspec/config.yaml:1899` en `9223318f` | `control-calidad-liberacion`: la fila de rechazo en la traza y `contarRetrabajos` (`packages/shared/src/controlCalidad.ts:98`) | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:86` | Construido el registro y su conteo; el indicador, fuera de la fila por su (5) (S-6) |
| Checklist siempre | `openspec/config.yaml:1890` en `9223318f` | `control-calidad-liberacion`: tres casillas fijas, provisionales por su S-1 | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:87` | Construida |
| Verificación con gas patrón sólo cuando la pide el tipo y hay gas, con la regla de P38 | `openspec/config.yaml:1890` en `9223318f` y su (4), `openspec/config.yaml:1898` en `9223318f` | `control-calidad-liberacion`: `exigeGasPatron` (`packages/shared/src/controlCalidad.ts:71`) | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:88` | Construida |
| Firma el Coordinador Técnico, nunca quien hizo el trabajo; guarda por persona | `openspec/config.yaml:1893` en `9223318f`, su (2) y (3), `openspec/config.yaml:1896` en `9223318f` y `openspec/config.yaml:1897` en `9223318f`; el corchete lo resuelve `openspec/config.yaml:2314` en `9223318f` | `control-calidad-liberacion`: `veredictoFirma` (`packages/shared/src/controlCalidad.ts:51`) e `intervino` (`packages/shared/src/controlCalidad.ts:38`) | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:91` | Construida |
| Con el Coordinador Técnico vacante, firma el Director Técnico o el Especialista técnico | `decision/f1c07-firma-control-calidad`, `openspec/config.yaml:5113` en `9223318f`, que responde la pregunta de `openspec/config.yaml:4499` en `9223318f` | `control-calidad-liberacion` | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:41` | Construida |
| «Intervino», el administrador de respaldo con motivo y el aviso a los administradores | `decision/f1c07-supuestos-corregidos`, `openspec/config.yaml:5134` en `9223318f` | `control-calidad-liberacion` | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:41-45` | Construida |
| El interruptor nace apagado y se enciende en enero con `DECISIONALES_POR_CARGO` | `openspec/config.yaml:5141` en `9223318f` y `decision/e248-adelanto-f1c` (2), `openspec/config.yaml:5733` en `9223318f` | `control-calidad-liberacion`: `packages/zoho-sync/src/config.ts:125` y `DEPLOY.md` §16 | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:85-88` | Construido; apagado por decisión |
| La calibración directa pasa también por Control de calidad | `decision/p15-p59-rutas` (3), `openspec/config.yaml:2033` en `9223318f`, y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3255` | F1C-08 (`calibracion-directa`, `cierra: si`), fusionada en `218d746d` | `openspec/changes/archive/2026-10-20-calibracion-directa/archive-report.md:7-11` | Construida por F1C-08, fuera de esta fila; con la lectura de su S-14 (`openspec/changes/archive/2026-10-20-calibracion-directa/archive-report.md:120-121`) |
| Foto del equipo embalado | `openspec/config.yaml:1892` en `9223318f` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3253` | F1B-17 | `openspec/config.yaml:5734` en `9223318f` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:97` en `9223318f` | **Pasa a F1B-17 por decisión** |
| Guarda de salida: no se entrega sin foto y checklist firmado | `openspec/config.yaml:1892` en `9223318f` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1829` | F1B-17 | `openspec/config.yaml:5734` en `9223318f` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:97` en `9223318f` | **Pasa a F1B-17 por decisión**; la firma del checklist, construida (S-7) |
| Firma cargada con la imagen del responsable | `openspec/config.yaml:1893` en `9223318f` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3254` | F1E-04 | `openspec/config.yaml:5734` en `9223318f` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:123` en `9223318f` | **Pasa a F1E-04 por decisión** |
| La firma «Revisó» del informe es la misma del Control de calidad, en un solo paso | `openspec/config.yaml:2310` en `9223318f` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2390` | F1E-04: `decision/roles-validacion-informe` la abre (`openspec/config.yaml:2322` en `9223318f`) | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:76` | Fuera de la fila por su decisión: no existe el informe |
| **El checklist revisa los puntos que fallaron en el diagnóstico y alimenta el informe de salida** | `openspec/config.yaml:1891` en `9223318f`, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3252` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2408` | **Nadie, y ninguna decisión la saca.** El cambio archivado la dio a «Épica 1E» (`openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:75`); su contenido coincide con el de F1E-03 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:211`) | `decision/e248-adelanto-f1c` (3) no la nombra (`openspec/config.yaml:5734` en `9223318f`) | **Sin construir y sin decisión: se trata por el supuesto S-5** (abajo) |
| Producto no conforme en el flujo de equipo nuevo | `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3248` | F1A-03: la salida rechazada de Verificación a `Notificado` (`decision/p38-verificacion-calidad` (5), `openspec/config.yaml:1981` en `9223318f`) | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:73` en `9223318f` | Fuera de la fila: es de F1A-03, cerrada por archivo |

**Lo construido detrás de un interruptor apagado, y con qué decisión cuenta.** El código está construido, verificado, archivado
y fusionado (`afccdcf0`). Que siga apagado hasta enero lo decide `decision/e248-adelanto-f1c` (2)
(`openspec/config.yaml:5733` en `9223318f`), y la misma decisión, en su (3), dice que F1C-07 «cierra con lo construido»
(`openspec/config.yaml:5734` en `9223318f`): a diferencia de F1C-05, aquí no hay que deducirlo de un precedente, lo dice la
decisión que abre este cambio. Encenderlo es una tarea de persona con fecha, no construcción. Es el supuesto S-4.

**Fuera de la fila, y por eso no cuentan como pendientes:**

- La calibración directa por Control de calidad, que D11 dejaba fuera porque la ruta abreviada no existía, la construyó F1C-08
  detrás del mismo interruptor (`openspec/specs/transitions-st/spec.md:3215`, RQ-TS-56). F1C-08 está cerrada por archivo
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:106` en `9223318f`).
- La pregunta de quién firma con el Coordinador Técnico vacante, que `decision/tabla-de-cargos-y-personas-10-10` (7) dejó para
  esta tanda (`openspec/config.yaml:4512` en `9223318f`), la respondió `decision/f1c07-firma-control-calidad` y está construida.
- El indicador de retrabajo de M7.1 («Rechazos en Control de calidad»,
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2849`): la consecuencia (5) de la propia decisión lo
  pone con la tanda de `kpis` (`openspec/config.yaml:1899` en `9223318f`), y no está entre los nueve que adelanta F1F-05
  (`decision/e009b-lista-indicadores`, `openspec/config.yaml:2655` en `9223318f`). Es el supuesto S-6.

**Conclusión de la medida: hay UNA pieza sin construir y sin una decisión escrita que la saque.** Es «el checklist revisa los
puntos que fallaron en el diagnóstico y alimenta el informe de salida» (`openspec/config.yaml:1891` en `9223318f`). La foto y la
guarda las saca `decision/e248-adelanto-f1c` (3) hacia F1B-17; la firma con imagen, hacia F1E-04; la firma «Revisó», que es
contenido de F1E-04, `decision/roles-validacion-informe`; la calibración directa la construyó F1C-08. La pieza del checklist de
diagnóstico no la nombra ninguna de esas respuestas. No se disimula: no se puede construir sin el checklist de diagnóstico
(épica 1D) ni sin el informe de salida (F1E-03, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:122` en `9223318f`),
que van después del corte, en 2027 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2410`); su
contenido es el de la fila F1E-03 de la R01.1 («los puntos rojos pasan a verde si se corrigieron o quedan en rojo con motivo
tipificado», `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:211`), que el maestro describe como «el mismo checklist
del diagnóstico, releído al cierre» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2407`); y la
respuesta de Gerencia, al enumerar «lo que falta de F1C-07», sólo nombra dos destinos y ordena el cierre. Se trata como
**supuesto reversible S-5** —la pieza viaja con F1E-03— y **el cierre queda condicionado a que el orquestador lo acepte o a que
Gerencia lo sitúe**; si se rechaza, se para sin archivar.

## Las piezas, en las specs vivas

Para el verify: cada pieza construida, con el requisito vivo que la impone.

| Pieza | Requisitos |
|---|---|
| Estado y tres transiciones de Servicio Técnico | `openspec/specs/transitions-st/spec.md:2940` (RQ-TS-46) |
| El interruptor: nace cerrado, quita una entrada u otra; las salidas no dependen de él; el cliente sólo pinta | `openspec/specs/transitions-st/spec.md:2967` (RQ-TS-47), `openspec/specs/permissions/spec.md:1036` (RQ-PM-32) y `openspec/specs/permissions/spec.md:1171` (RQ-PM-37) |
| Checklist, gas patrón y motivos, `422` de contenido | `openspec/specs/transitions-st/spec.md:2996` (RQ-TS-48) |
| Aprobado → `Por Facturar`; rechazo → `En Proceso` con prioridad `High` | `openspec/specs/transitions-st/spec.md:3025` (RQ-TS-49) |
| Cifras y orden de las guardas nuevas | `openspec/specs/transitions-st/spec.md:3049` (RQ-TS-50) y `openspec/specs/transitions-st/spec.md:3063` (RQ-TS-51) |
| Firmante: habilitado que no intervino; administrador de respaldo; fuera de la regla de Decisionales; impuesto en el servidor | `openspec/specs/permissions/spec.md:1055` (RQ-PM-33), `openspec/specs/permissions/spec.md:1099` (RQ-PM-34), `openspec/specs/permissions/spec.md:1128` (RQ-PM-35) y `openspec/specs/permissions/spec.md:1147` (RQ-PM-36) |
| Aviso a los administradores sin firmante libre | `openspec/specs/derivacion-avisos/spec.md:1253` (RQ-AV-24) |
| Traza: id de la persona, quién firmó y con qué motivo, retrabajo contable | `openspec/specs/trazas/spec.md:871` (RQ-TZ-22), `openspec/specs/trazas/spec.md:890` (RQ-TZ-23) y `openspec/specs/trazas/spec.md:904` (RQ-TZ-24) |
| La calibración directa pasa por Control de calidad, fuera de la fila (F1C-08) | `openspec/specs/transitions-st/spec.md:3215` (RQ-TS-56) |

## Las decisiones de respaldo, contrastadas

- **`decision/c6-qa-liberacion`** (`openspec/config.yaml:1884-1903` en `9223318f`): construida en estado, salidas, retrabajo,
  checklist, gas y firma por persona; la foto y la guarda pasan a F1B-17 y la imagen de firma a F1E-04; el checklist de
  diagnóstico, sin destino escrito (S-5); el indicador de retrabajo, con `kpis` por su (5) (S-6).
- **`decision/p38-verificacion-calidad`** (`openspec/config.yaml:1967-1986` en `9223318f`): la regla del gas patrón, heredada y
  construida; la salida rechazada a `Notificado` es de F1A-03.
- **`decision/roles-validacion-informe`** (`openspec/config.yaml:2305-2322` en `9223318f`): su (2) resuelve el corchete del
  firmante (`openspec/config.yaml:2314` en `9223318f`), construido; la firma «Revisó» y la imagen de firma, su (6)
  (`openspec/config.yaml:2318` en `9223318f`), son de F1E-04, la tanda que abre.
- **`decision/tabla-de-cargos-y-personas-10-10`** (7) (`openspec/config.yaml:4499-4505` en `9223318f`): dejaba a F1C-07 la pregunta
  del firmante con la vacante; respondida y construida.
- **`decision/f1c07-firma-control-calidad`** (`openspec/config.yaml:5108-5126` en `9223318f`) y
  **`decision/f1c07-supuestos-corregidos`** (`openspec/config.yaml:5128-5145` en `9223318f`): construidas enteras.
- **`decision/p15-p59-rutas`** (3) (`openspec/config.yaml:2033` en `9223318f`): construida por F1C-08.
- **`decision/e248-adelanto-f1c`** (`openspec/config.yaml:5724-5739` en `9223318f`): su (2) mantiene el interruptor apagado
  hasta enero de 2027; su (3) es este cambio.
- **`decision/orden-tandas-tras-e266`** (`openspec/config.yaml:5820-5836` en `9223318f`): pone este cierre tras E-266, el último
  de los tres sin código.

## Lo que sigue abierto y NO es contenido de la fila

- **F1B-17 recibe la foto del embalado y la guarda de salida**, condicionada a la averiguación de la hoja de Google
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:156` en `9223318f`). **F1E-04 recibe la firma con imagen.**
- **Encender `CONTROL_CALIDAD_LIBERACION` en enero**, junto con `DECISIONALES_POR_CARGO` y nunca antes del 14/12, con el cargo de
  permiso asignado antes (`DEPLOY.md:794-796`). La línea del interruptor en el fichero de ejemplo de entorno, que pedía W-1 del
  verify (`openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:129`), la añadió `812ec0c4`
  (`git show --stat`: cinco líneas en ese fichero, con las dos variables).
- **Los supuestos S-1 a S-18 de `control-calidad-liberacion`**, sin lista aceptada: están en el anexo de «tomados y nunca
  publicados» (`docs/sdd/Supuestos_semana_2026-11-02.md:226`).
- **El maestro.** M9.1 sigue diciendo «Cuándo: tanda F1C-07, después del corte»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3256`), M1.7 pone la guarda en F1C-07
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1829`) y el §3.3 la marca «Sin empezar»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3944`). Va con S-3.
- **El plan.** La fila sigue «pendiente» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:105` en `9223318f`), aunque el
  barrido ya la cuenta «en curso» (`docs/sdd/RECONCILIACION.md:21` en `9223318f`).
- **Las tareas de persona** del cambio archivado: en `tasks.md`, «Tareas de personas — fuera del recuento».

## Para Supervisión — no se editan en la rama

Texto para los ficheros que esta rama no edita. Ninguno es contenido de la fila.

1. **Plan R01.4.** Al fusionar, la fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:105` en `9223318f`) pasa de
   «pendiente» a «cerrada por archivo» con este cambio. La población «después del corte sin fecha» del §G
   (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:290` en `9223318f`, que da **6/25**) pasa a **7/25**, con F1C-07 por
   archivo y por `decision/e248-adelanto-f1c` (3). Si se acepta S-5, la fila F1E-03
   (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:122` en `9223318f`) puede nombrar que recibe el checklist que revisa
   los puntos del diagnóstico y alimenta el informe de salida. Las filas F1B-17 y F1E-04 ya llevan su nota del 09/11.
2. **`openspec/config.yaml`.** `decision/tabla-de-cargos-y-personas-10-10` dice en su `tanda_que_abre` que «deja una pregunta para
   F1C-07» (`openspec/config.yaml:4512` en `9223318f`): la respondió `decision/f1c07-firma-control-calidad`
   (`openspec/config.yaml:5113` en `9223318f`). Y `decision/c6-qa-liberacion` no dice dónde cae la frase de su respuesta sobre el
   checklist de diagnóstico (`openspec/config.yaml:1891` en `9223318f`). Las decisiones no se reescriben: si hace falta, una nota de
   precisión en cada una.
3. **`docs/sdd/ENTRADA.md`.** E-047 «Afecta a: F1C-07 · S47» (`docs/sdd/ENTRADA.md:735` en `9223318f`), E-052
   (`docs/sdd/ENTRADA.md:814` en `9223318f`) y E-082 (`docs/sdd/ENTRADA.md:1193` en `9223318f`) nombran la fila; las tres están
   cerradas y no piden texto. E-248 ya está cerrada con la decisión (`docs/sdd/ENTRADA.md:2289` en `9223318f`).
4. **Maestro, para el expediente.** Donde la R08.4 sitúa en F1C-07 la guarda de salida y la foto
   (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1829` y
   `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3253`), la fila es ahora F1B-17; la imagen de firma
   (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3254`) es F1E-04. El «Cuándo» de M9.1
   (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3256`), el §3.3
   (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3940-3944`) y las dos listas de estados «sin
   construir» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1266` y
   `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4507`) pueden decir «construido detrás de un
   interruptor apagado hasta enero». M1.7 «[CONSTRUIDO] Hoy no hay control de calidad intermedio»
   (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1843`) sigue siendo cierto hasta el encendido (R-6 de
   `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:159`).
5. **`CLAUDE.md`, `docs/sdd/F0-05_Bloques_para_ClaudeCode.md`, `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md` y
   `docs/sdd/F0-01_Correcciones_para_el_maestro.md`:** no nombran F1C-07 (`grep -c F1C-07` da 0 en los cuatro); sin texto.

## Alcance

### Dentro

- Este `proposal.md`, `tasks.md`, `verify-report.md` y `archive-report.md`.
- Al archivar, la carpeta pasa a `openspec/changes/archive/`. La prueba 11f/05g fija la lista «en curso» del árbol real con
  F1C-07 (`apps/desk/server/reconciliacion/registro.test.ts:218` en `9223318f` y
  `apps/desk/server/reconciliacion/registro.test.ts:220` en `9223318f`), y tiene que ponerse en rojo. Se ve el rojo y se corrige
  en sitio, sin mover líneas: de SEIS a CINCO, sin F1C-07, con `toContain('F1C-07')` en «cerradas por archivo». Es la única
  edición de código del cambio, con el molde de `8647518b`, que hizo lo mismo con F1C-05.

### Fuera

- Código de producción, `openspec/specs/` y el maestro.
- Los ficheros de Supervisión, entre ellos `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `CLAUDE.md` y el expediente R08.4.
- El estado de la fila en el plan R01.4: se pone al día después del archivo, fuera de esta rama.
- `docs/sdd/RECONCILIACION.md`: se regenera para comprobar el efecto y se restaura sin commitear, porque lleva el commit medido
  en la cabecera. A la partida da seis «en curso» con F1C-07 (`docs/sdd/RECONCILIACION.md:21` en `9223318f`).

## Supuestos reversibles

| # | Supuesto | Cómo se revierte |
|---|---|---|
| S-1 | `maestro: ["M9.1", "M1.7", "M2.5"]`, el de `control-calidad-liberacion` (`openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:4`). «M9.1» es la fuente de la fila de la R01.1 y el barrido la cruza (`apps/desk/server/reconciliacion/comprobaciones.ts:238`) | `maestro: ["M9.1"]`, que también cruza; sin «M9.1», F1C-07 saldría «sin verificar» |
| S-2 | `capacidad: [reconciliacion]`, porque el único efecto es el recuento del barrido y la prueba que lo fija; el cambio de la fila declaró `transitions-st`, `permissions`, `derivacion-avisos` y `trazas` | `capacidad: [transitions-st, permissions, derivacion-avisos, trazas]` |
| S-3 | `toca_maestro: no`, como los cierres sin código de F1B-13 y F1C-05. Lo que el maestro dice de F1C-07 es una foto de la revisión: el contenido no cambia, sólo la fila de la foto, la guarda y la imagen de firma. El texto va en «Para Supervisión», punto 4 | `toca_maestro: si`, con el texto nuevo de M9.1, M1.7 y el §3.3 para Gerencia |
| S-4 | Lo construido, verificado y archivado detrás de `CONTROL_CALIDAD_LIBERACION`, que `decision/e248-adelanto-f1c` (2) mantiene apagado, cuenta como construido: la misma decisión, en su (3), ordena cerrar con lo construido (`openspec/config.yaml:5734` en `9223318f`) | Que la fila no cierre hasta encender en enero; contradiría la (3) |
| S-5 | **«El checklist revisa los puntos que fallaron en el diagnóstico y alimenta el informe de salida»** (`openspec/config.yaml:1891` en `9223318f`) viaja con F1E-03, cuyo contenido es (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:211`), y depende del checklist de diagnóstico de 1D. Ninguna decisión lo dice; por eso es supuesto y no hecho | Que Gerencia la sitúe en otra fila; o que la considere de F1C-07, y entonces la fila no cierra: se para sin archivar |
| S-6 | El indicador de retrabajo de M7.1 es de `kpis` (Fase 2), por la consecuencia (5) de la decisión (`openspec/config.yaml:1899` en `9223318f`), y no de F1F-05, que tiene lista cerrada de nueve sin él (`openspec/config.yaml:2655` en `9223318f`). F1C-07 deja el registro y el conteo | Que Gerencia lo sume a F1F-05 o le dé fila propia |
| S-7 | El «checklist firmado» de la guarda (`openspec/config.yaml:1892` en `9223318f`) está construido como la firma de `aprobacion_control_calidad` en la traza (RQ-TZ-23); lo que pasa a F1B-17 es exigirlo al salir de `Por Entregar` | Que Gerencia entienda por «firmado» la firma con imagen, que va a F1E-04 |

## Riesgos

- **Cita en prosa que caduca:** las líneas 218 y 220 de `apps/desk/server/reconciliacion/registro.test.ts`, contadas en `9223318f`,
  se reescriben en sitio; al cerrar se barre la regla de mutación 4 sobre ese fichero.
- **S-5 no tiene respaldo escrito:** si el verify o Gerencia lo rechazan, el cierre se para; la propuesta lo dice antes de archivar
  para que no parezca resuelto.
- **Registro de intentos:** el archivo mide la mudanza dos veces (regla del ciclo 2, desvío 3); se abre con un techo de dos veces
  la carpeta más 800 (regla del archivo).
