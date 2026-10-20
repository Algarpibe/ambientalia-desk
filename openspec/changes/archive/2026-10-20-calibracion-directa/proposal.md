---
tanda: F1C-08
motivo: ""
capacidad: [transitions-st, permissions]
maestro: ["M2.1", "Anexo D nº 15", "Anexo D nº 59"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `calibracion-directa`

## 1. Qué fila atiende

F1C-08 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:106`): «Rutas abreviadas», talla S–M. Respaldo:
`decision/p15-p59-rutas` (`openspec/config.yaml:2023-2039`), precisada por `decision/f1c08-ov-calibracion`
(`openspec/config.yaml:5138-5161`). Maestro R08.4: M2.1 «Rutas abreviadas» (`R08.4.md:2285-2288`); Anexo D nº 15
(`R08.4.md:5726-5730`) y nº 59 (`R08.4.md:5841-5845`).

`cierra: si` — la fila tiene dos rutas y las dos quedan resueltas: **equipo sin novedad** no se construye por decisión
(`R08.4.md:2286`, `:5844`; decisión del 03/09 ratificada el 23/09), y la **calibración directa** entra entera con sus tres
condiciones. Lo que «sin novedad pase rápido» necesita es el checklist dinámico, que es contenido de F1D
(`openspec/config.yaml:2035`, consecuencia 5), no de esta fila.

`toca_maestro: si` — M2.1 afirma que el tipo de servicio de F1B-03 «ya oculta los pasos que no aplican» (`R08.4.md:2287`),
y es falso (§2). La corrección se entrega como texto para Gerencia; el maestro no se edita.

## 2. Intención

Cuando la orden de venta ya cubre la calibración, hoy el ticket recorre igualmente diagnóstico, cotización y aprobación:
la única salida de `Ingresado` es `ingreso_a_servicio` → `Rev./Diagnostico` (`packages/shared/src/transitions.ts:190`).
Gerencia decidió un atajo con tres condiciones: (1) sólo con la orden de venta de calibración asignada; (2) si aparece
una falla, sale a la ruta completa para cotizar; (3) pasa igualmente por el Control de calidad (`openspec/config.yaml:2029`).

**La premisa de que F1B-03 hacía parte del trabajo no se cumple.** El flujo se elige por clasificación y estado
(`packages/shared/src/flujos.ts:12-15`, `:56-71`); el tipo de servicio sólo deduce el prefijo CG
(`packages/shared/src/ticketCreate.ts:48`, `:51`) y obliga a la OVI en Garantía (`packages/shared/src/ordenOVI.ts:61-64`).
F1B-03 dejó fuera la calibración directa a propósito (`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:99`).
F1C-08 construye el atajo entero (`decision/f1c08-ov-calibracion`, consecuencia 3).

## 3. Alcance — lo que entra

| # | Pieza | Dónde |
|---|---|---|
| D1 | Transición `calibracion_directa` «Calibración directa»: `Ingresado` → `En Proceso`, Servicio Técnico, Operativo, con los campos de `ingreso_a_servicio` (`transitions.ts:191`) | en la línea final de `TRANSICIONES_BASE` (`transitions.ts:262`), sin desplazar citas |
| D2 | Transición `falla_calibracion` «Falla en calibración»: `En Proceso` → `Rev./Diagnostico`, Servicio Técnico, Operativo, con texto obligatorio «Descripción de la falla» (el `comment()` no es obligatorio, `transitions.ts:73-74`) | misma línea final |
| D3 | Interruptor: las dos dependen de `CONTROL_CALIDAD_LIBERACION` (`packages/zoho-sync/src/config.ts:125`); apagado, `409` por el mismo mecanismo (`packages/shared/src/controlCalidad.ts:103-107`, llamado en `apps/desk/server/services/ticketService.ts:128`, definido en `:285-288`) | regla pura en `shared`; sin interruptor nuevo |
| D4 | Condición (1) en el servidor: `tickets.tipo_servicio` = «Calibración» (`ticketCreate.ts:4`) **y** orden de venta asignada; no se lee el contenido de la OV | guarda nueva en `executeTransition`; escalón y fuente de «OV asignada» los fija el diseño |
| D5 | Elegibilidad del escape: interruptor encendido y tipo «Calibración» (S-4); su falla en blanco da `422` (C) | mismas guardas que D3-D4 |
| D6 | Condición (3) como propiedad del grafo: con el interruptor encendido, desde `En Proceso` no se llega a `Por Facturar` sin pasar por `Control de calidad` | prueba nueva junto a `invariantesGrafo.test.ts` |
| D7 | Cliente sólo pinta: `TransitionPanel` oculta las dos cuando no aplican, con la misma regla pura | filtro de `apps/desk/src/components/TransitionPanel.tsx:56-58` |
| D8 | `DEPLOY.md` §16 (`DEPLOY.md:776`): el interruptor enciende también la calibración directa; dos frases, qué enciende y qué se rompe | §16, sin sección nueva |
| D9 | Vigilantes y cifras (§6), mapa del blueprint regenerado | `shared`, `docs/artefactos/blueprint-*.md`, `openspec/config.yaml` → `cifras_ancladas` |
| D10 | Corrección de M2.1 (`R08.4.md:2287`) como texto para Gerencia | expediente del maestro (hipótesis: `docs/sdd/R08.4_Expediente_de_cambios.md`) |

**Fuente de «OV asignada» (para el diseño).** `habilitar_servicio` ya pide la orden de venta para llegar a `Ingresado`
(`transitions.ts:178`, `:189`), pero un ticket venido de Zoho puede llegar sin ella, y la sincronización puede vaciar
`orden_venta` dejando `salesorder_id` (IV-11, `CLAUDE.md`). Hipótesis: leer las tres vías que leen las puertas de «una OV,
un ticket» (`orden_venta`, `salesorder_id`, `public.ov_asociaciones`). Lo decide el diseño.

## 4. Lo que queda fuera

| Pieza | Por qué | Dónde cae |
|---|---|---|
| Ruta abreviada de equipo sin novedad | Decidido que no existe (`R08.4.md:2286`, nº 59) | nada que construir |
| Marcar OK por macro con el checklist dinámico | No existe el checklist dinámico | épica F1D |
| Formulario de falla nueva (qué, dónde, gravedad, foto) y aviso al Director Técnico | `decision/falla-nueva-bloqueante` (`openspec/config.yaml:2041-2057`) | F1D-07 |
| Comprobar el contenido de la OV (líneas, centro de costos) | Opción (b) descartada (`openspec/config.yaml:5146-5148`) | no se hace |
| Interruptor propio del atajo | S-1: depende del de Control de calidad | reversible |

## 5. Grafo antes y después

```
ANTES (y DESPUÉS con el interruptor apagado)
  Ingresado ──ingreso_a_servicio──► Rev./Diagnostico ──…cotizar…aprobar──► En Proceso
  [calibracion_directa: 409] [falla_calibracion: 409]

DESPUÉS, interruptor encendido, tipo Calibración con OV asignada
  Ingresado ──calibracion_directa (Operativo)──► En Proceso ──envio_control_calidad──► Control de calidad
  En Proceso ──falla_calibracion (Operativo)──► Rev./Diagnostico ──escalado_a_revision──► Notificado
      ──escalado_a_comercial──► Notificación Comercial ──notif_cliente_comercial (Fecha de Cotización)──► …
  [finalizacion_servicio: 409, ya hoy con el interruptor encendido]
```

Si el interruptor se apaga con un ticket ya en el atajo, sigue la vía existente `diagnostico_complementario`
(`transitions.ts:244`) → `notif_recotizacion` (`:261`): nadie queda varado. Ningún estado nuevo.

## 6. Cifras y vigilantes que se mueven (en la rama)

| Vigilante | Hoy | Después |
|---|---|---|
| Transiciones de servicio / estados (`packages/shared/src/invariantesGrafo.test.ts:50-53`, `packages/shared/src/cifrasAncladas.test.ts:24`, `openspec/config.yaml:1360-1373`) | 36 / 23 | 38 / 23 |
| Pasos del mapa (`cifrasAncladas.test.ts:24`, `mapaBlueprint.test.ts`) | 44 | 46 |
| Filas de tipos; servicio; recuentos totales; servicio por tipo (`packages/shared/src/tipoEvento.test.ts:43-53`) | 50; 36; 17/16/13/4; 10/11/11/4 | 52; 38; 19/16/13/4; 12/11/11/4 |
| Matriz de áreas (`apps/desk/server/permisos.test.ts:77-81`) | 108: 65 prohibidos, 43 permitidos | 114: 69 y 45 |
| Matriz compuesta (`permisos.test.ts:349-353`) | 108: 66 / 42 | 114: 70 / 44 (hipótesis: sin cargo de lista corta) |
| Cargo × área × transición (`permisos.test.ts:368`, `:458`) | 972 | 1.026 |
| Estados con una sola salida (`packages/shared/src/estados.test.ts:146-149`) | 11, entre ellos `Ingresado` | 10; la aserción `toContain('Ingresado')` de `:148` cambia y su comentario también |
| Derivación por defecto (`packages/shared/src/transitions.test.ts:123-126`) | 5 proponen, 31 heredan | 5 / 33 (S-6) |
| Campos de fecha reentrantes (`invariantesGrafo.test.ts:137-150`) | 10 | **hipótesis: 12** (§7, R-1) |
| Decisionales | 16 | 16 (las dos nuevas son Operativo) |

## 7. Hallazgo de la propuesta — el escape agranda el ciclo

`camposFechaReentrantes` cuenta los campos de las transiciones internas a una componente fuertemente conexa
(`packages/shared/src/reentrancia.ts:218-225`). Hoy `Rev./Diagnostico`, `Notificado` y `Notificación a Compras` sólo se
alcanzan desde `Ingresado`; con `falla_calibracion` entran en el ciclo de `En Proceso`. Hipótesis a medir en el diseño:
`Fecha Revisión Informe` (`transitions.ts:219`, `:221`) y `Fecha Notificación por garantía` (`:209`) pasan a reentrantes,
de 10 a 12, y la tabla de `reentrancia.test.ts` cambia. Es un efecto sobre F1C-06 y los KPI, no un adorno: la segunda
pasada pisa la fecha obligatoria. La guarda D5 lo limita en ejecución; el análisis estático del grafo no la ve.

## 8. Capacidades

- **Modificadas:** `transitions-st` (dos transiciones, interruptor, condición (1), propiedad de la condición (3), cifras,
  orden de guardas); `permissions` (elegibilidad por interruptor y tipo de servicio, visibilidad en el cliente).
- **Nuevas:** ninguna (R-2 no aplica).

## 9. Orden de guardas (F1B-10)

A existencia < B estado y permiso < C contenido < D unicidad. El `409` del interruptor va donde el de F1C-07: B, tras el
`from` (`ticketService.ts:126-128`). La condición (1) describe al ticket y no al cuerpo; hipótesis: escalón B, tras el
interruptor y antes del área (`:129`). La «Descripción de la falla» en blanco entra en el `422` agregado de `:134`. Cada
guarda nueva lleva prueba de POSICIÓN frente a su vecina (regla de mutación 1); funciones auxiliares al final del fichero.

## 10. Regla 13

| Decisión del cliente | Imposición del servidor |
|---|---|
| Ocultar las dos con el interruptor apagado | `409` de D3 |
| Ocultar el atajo sin tipo Calibración u OV asignada | guarda de D4 |
| Ocultar el escape fuera de tipo Calibración | guarda de D5 |
| Exigir la descripción de la falla | `422` de D5 |

La tabla decisión a decisión, con línea, va en el diseño.

## 11. Supuestos reversibles (lista semanal de Gerencia, grupo F1C-08)

- **S-1** El atajo y el escape dependen del MISMO interruptor que Control de calidad: sin Control de calidad no hay
  condición (3). Apagado, todo como hoy.
- **S-2** La condición (1) es una declaración: tipo «Calibración» más OV asignada, sin leer la OV
  (`decision/f1c08-ov-calibracion`, consecuencia 2). Un ticket de Zoho con otra grafía no toma el atajo.
- **S-3** El atajo es Operativo y lleva los campos de `ingreso_a_servicio`, para no perder esas fechas.
- **S-4** El escape lo ve cualquier ticket «Calibración» en `En Proceso`, no sólo los que tomaron el atajo.
- **S-5** El escape vuelve a `Rev./Diagnostico`, que es la ruta completa que lleva a cotizar.
- **S-6** Ninguna de las dos propone derivación por defecto: heredan.
- **S-7** Nombres visibles «Calibración directa» y «Falla en calibración».
- **S-8** `409` para lo que quita el interruptor, como en F1C-07.
- **S-9** Quien ejecuta el atajo «intervino» y no firma el Control de calidad
  (`controlCalidad.ts:38-43`; `decision/f1c07-supuestos-corregidos`).

## 12. Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R-1 | El escape agranda el ciclo: dos fechas más reentrantes (§7) | El diseño lo mide; si S-4 se restringe a tickets que tomaron el atajo, se reduce en ejecución; se declara en la prueba 6 |
| R-2 | S-2: una OV que no es de calibración toma el atajo | La condición (3) lo recoge en Control de calidad; reversible hacia la opción (b) |
| R-3 | «OV asignada» con una sola vía falla con IV-11 vivo | Hipótesis de las tres vías (§3); lo fija el diseño |
| R-4 | Desplazamiento de citas en `transitions.ts`, `ticketService.ts`, `controlCalidad.ts`, `estados.test.ts` | Inserción en línea existente; barrido de la regla de mutación 4 al cierre |
| R-5 | El mapa tiene prueba anti-desfase contra `docs/artefactos/` | Regenerar con `scripts/generar-mapa-blueprint.ts` en el lote 1 |
| R-6 | El encendido de enero enciende también el atajo sin que nadie lo pida | `DEPLOY.md` §16 lo dice en la primera frase (D8) |

## 13. Mutaciones obligatorias

1. El atajo sin OV asignada pasa.
2. El atajo con el interruptor apagado pasa.
3. El atajo llega a `Por Facturar` sin `Control de calidad` (ensuciando el catálogo, regla de mutación 2).
4. Sin escape ante una falla, o un escape cuyo destino no lleva a cotizar.
5. El atajo ofrecido a un tipo de servicio que no es «Calibración».
6. Posición de la guarda de la condición (1) frente al interruptor y al área (regla de mutación 1).
7. El escape con la descripción en blanco pasa.
8. Regla de mutación 4 sobre `transitions.ts`, `estados.ts` y cada fichero muy citado que se toque.

## 14. Partición por intentos (techo 800, válvula 720)

| Intento | Contenido | Estimado |
|---|---|---|
| I1 | propuesta + specs delta | ~400 |
| I2 | diseño + tareas | ~350 |
| I3 | lote 1, `shared`: catálogo, regla pura, vigilantes, cifras, mapa | ~550 |
| I4 | lote 2, servidor: guardas y sus pruebas de posición | ~450 |
| I5 | lote 3: cliente, `DEPLOY.md` §16, tabla de la regla 13, corrección de M2.1, barrido de citas | ~200 |
| I6 | verify | ~350 |
| I7 | archive | techo 2 × carpeta + 800 (regla del archivo) |

## 15. Plan de vuelta atrás

Primera línea: dejar `CONTROL_CALIDAD_LIBERACION` sin `true`; las dos transiciones dan `409` y el flujo es el de hoy. Un
ticket ya en `En Proceso` por el atajo sale por la vía existente (§5). Segunda: revertir los commits de la rama; sin
migración (hipótesis a confirmar en el diseño), no hay datos que deshacer.

## 16. Criterios de éxito

- [ ] Apagado: la suite de hoy pasa sin cambios de comportamiento; las dos nuevas dan `409`.
- [ ] Encendido, tipo Calibración con OV: `Ingresado` → `En Proceso` → `Control de calidad` → `Por Facturar`.
- [ ] Sin OV o con otro tipo: el atajo se rechaza en el servidor y no se pinta en el cliente.
- [ ] El escape lleva a `Rev./Diagnostico` y desde ahí a la Fecha de Cotización por las transiciones de hoy.
- [ ] Cada mutación de §13 pone la suite en rojo.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde; barrido de citas sin roturas nuevas.

## 17. Ronda de preguntas

No se hizo: el preflight fija `execution_mode: auto` (`openspec/config.yaml:22-30`; «Regla de ejecución», `CLAUDE.md`).
Las dudas con supuesto razonable van como S-1…S-9; ninguna cambia el alcance de la fila, cuesta dinero ni toca datos de
producción. La más cercana a subir es S-4 (R-1), por su efecto sobre los KPI.
