---
tanda: F1C-07
motivo: ""
capacidad: [transitions-st, permissions, derivacion-avisos, trazas]
maestro: ["M9.1", "M1.7", "M2.5"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `control-calidad-liberacion`

## 1. Qué fila atiende

F1C-07 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:105`): «C6 Control de calidad antes de liberar», talla
S–M. Respaldo: `decision/c6-qa-liberacion` (`openspec/config.yaml:1884-1903`), precisada por
`decision/f1c07-firma-control-calidad` (`:5099-5117`) y `decision/f1c07-supuestos-corregidos` (`:5119-5136`). Maestro
R08.4: M9.1 (`R08.4.md:3244-3256`), M1.7 (`:1829`), M2.5 (`:2390`, `:2408`), glosario (`:5906-5907`).

`cierra: no` — lo sostiene §4 (D11): la foto del equipo embalado, la firma con imagen, el checklist alimentado por el
diagnóstico, el informe de salida y la calibración directa dependen de entidades que hoy no existen.
`toca_maestro: no` — con el interruptor apagado el flujo es exactamente el de hoy, y M1.7 (`:1843`, «[CONSTRUIDO] Hoy no
hay control de calidad intermedio») sigue siendo cierto hasta el encendido (ver riesgo R-6).

## 2. Intención

Hoy un ticket pasa de `En Proceso` a `Por Facturar` por `finalizacion_servicio` sin ninguna revisión
(`packages/shared/src/transitions.ts:222-223`): nadie distinto del técnico confirma que el equipo funciona y está completo
antes de facturarlo. C6 intercala un estado `Control de calidad` con checklist obligatorio, verificación con gas patrón
cuando aplica, firma de una persona que NO intervino en el trabajo, y retrabajo con prioridad alta y medible.
Se construye apagado (`CONTROL_CALIDAD_LIBERACION`) y se enciende en enero junto con `DECISIONALES_POR_CARGO`
(`decision/f1c07-supuestos-corregidos`, consecuencia 3).

## 3. Alcance — lo que entra (D1-D10 del pliego)

| # | Pieza | Dónde |
|---|---|---|
| D1 | Interruptor `CONTROL_CALIDAD_LIBERACION`, nace cerrado (`=== 'true'`), junto a `decisionalesPorCargo` | `packages/zoho-sync/src/config.ts:66` (campo), `:124` (lectura); `DEPLOY.md` §16 nueva tras §15 (`:754-775`) |
| D2 | Estado `Control de calidad` (`'ninguna'`) y tres transiciones en la MISMA línea final de los arrays | `estados.ts:99`, `transitions.ts:262`, `fasesBlueprint.ts:67`, `columns.ts:33` |
| D3 | El interruptor gobierna sólo la ENTRADA: apagado → `envio_control_calidad` da `409`; encendido → `finalizacion_servicio` da `409`. Las dos salidas no dependen de él | escalón B, tras el `from` (`ticketService.ts:126-128`) |
| D4 | Regla pura de firmante, servidor y cliente | `packages/shared/src/controlCalidad.ts` (nuevo); `403` B tras Decisionales (`ticketService.ts:131`) |
| D5 | F1C-05 no se aplica a las dos de QA (`cargosQueFaltanParaDecisional` → `null`): su regla es más estricta | `packages/shared/src/decisionales.ts:39-50`; la tabla de 14 de `decisionales.test.ts:17-23` pasa a 16 |
| D6 | Columna aditiva `ticket_transitions.performed_by_id text`, sin relleno; `applyTransition` la escribe con `user.id` | `schema.sql` al final; `ALTER TABLE` sin calificar, correcto para `DESK_TABLES` (`migrate.ts:63-64`) |
| D7 | Rechazo: el servidor fija `priority = 'High'`; retrabajo = la propia fila de traza, contable con `contarRetrabajos(traza)` | `prioridad.ts:13`; `repo.ts:300` |
| D8 | Aviso de bandeja a los ADMINISTRADORES activos tras `envio_control_calidad` si no queda habilitado sin intervención; función nueva `destinatariosAdministradores` | molde `ticketService.ts:196-207`; `apps/desk/server/db/avisos.ts` (junto a `:121-127`) |
| D9 | Las tres casillas se exigen marcadas siempre; la de gas, sólo si el compuesto del equipo tiene patrón vigente (`422`, C) | `gasPatron.ts:43` (`tienePatronVigente`), `apps/desk/server/db/gasesPatron.ts:14` (`leerContextoGas`); `422` agregado de `ticketService.ts:134` |
| D10 | Cliente sólo pinta: `GET /api/permisos/control-calidad` → `{ activo }`; `TransitionPanel` oculta `envio_control_calidad` apagado y `finalizacion_servicio` encendido | molde `routes/permisosDecisionales.ts:16`, `TransitionPanel.tsx:55-57` |

**Las tres transiciones (D2).** Las tres son de Servicio Técnico.

| id | Nombre | De → a | Tipo | Campos |
|---|---|---|---|---|
| `envio_control_calidad` | Envío a control de calidad | En Proceso → Control de calidad | Operativo | los de `finalizacion_servicio` (`transitions.ts:223`) |
| `aprobacion_control_calidad` | Control de calidad aprobado | Control de calidad → Por Facturar | Decisional | comentario; tres casillas de checklist (S-1); casilla de gas; texto «Motivo de la firma del administrador» (lo exige el servidor) |
| `rechazo_control_calidad` | Control de calidad rechazado | Control de calidad → En Proceso | Decisional | comentario; texto obligatorio «Motivo del rechazo» |

**Regla de firmante (D4), entera.** Habilitados = usuarios activos con `cargo_permiso` Coordinador Técnico; si no hay
ninguno (vacante, mismo criterio que `apps/desk/server/services/decisionales.ts:12`), los activos con Director Técnico o
Especialista técnico. Intervino = es `tickets.derivado_a` (id, `schema.sql:123`) o autor de una fila de traza cuyo
`tipoEventoDeTransicion` es `Operativo`. Firma un habilitado que no intervino. Un administrador SÓLO si no queda ningún
habilitado sin intervención y él no intervino; entonces el motivo es obligatorio (`422`, C) y queda en `values`. Aplica a
las dos salidas, con el interruptor encendido o apagado.

**Cifras que se mueven (en la rama, sólo `cifras_ancladas`, precedente F1C-02).** Servicio: 33 → 36 transiciones,
22 → 23 estados, 41 → 44 pasos del mapa (`cifrasAncladas.test.ts:24`); tipos 47 → 50 (`tipoEvento.test.ts:45`):
17 Operativo · 16 Decisional · 13 Compras / Logístico · 4 Administrativo. `Control de calidad` no entra en
`ESTADOS_DE_CIERRE` (`invariantesGrafo.test.ts:339`): el ciclo `Control de calidad ⇄ En Proceso` no toca cierre (`:357-358`).

## 4. Lo que queda fuera (D11) — por eso `cierra: no`

| Pieza del maestro | Por qué no entra | Dónde caerá |
|---|---|---|
| Foto del equipo embalado (M9.1 `:3253`; M1.7 `:1829`) | No hay remisión de salida en la app (`apps/desk/server/db/remisiones.ts:48` escribe sólo `'entrada'`) ni adjuntos por transición (`transitions.ts:14`, `:168`); el maestro dice que son las fotos de la remisión de salida (`R08.4.md:2280`) | Remisión de salida (M2.1); sin fila asignada en esta propuesta |
| Firma con imagen del responsable (`:3254`) | No existe imagen de firma de usuario (`schema.sql:82-92`) | F1E-04 |
| Checklist que revisa «los puntos que fallaron en el diagnóstico» y alimenta el informe de salida (`:2408`) | No existe checklist de diagnóstico ni informe de salida | Épica 1E (`R08.4.md:2410`) |
| Firma «Revisó» del informe en un solo paso (`:2390`) | No existe el informe | 1E / F1E-04 |
| Calibración directa por Control de calidad (`:1608`, `:3255`) | No existe la ruta abreviada | F1B-03 / F1C-08 |

## 5. Qué parte de la fila cubre

| Contenido de `decision/c6-qa-liberacion` | Esta tanda |
|---|---|
| Estado entre En Proceso y Por Facturar | Cubre (D2) |
| Aprobado → Por Facturar | Cubre (D2) |
| Rechazado → En Proceso con prioridad alta | Cubre (D7) |
| Retrabajo registrado para medirlo | Cubre el registro y la función de conteo; el indicador de M7.1 es de la tanda de KPI |
| Checklist siempre | Cubre con tres casillas fijas y provisionales (S-1) |
| Gas patrón sólo cuando aplica | Cubre (D9) |
| Checklist sobre los puntos del diagnóstico; alimenta el informe | No cubre (§4) |
| No se entrega sin foto embalado y checklist firmado | No cubre: la guarda de salida desde Por Entregar va con la foto (§4) |
| Firma el Coordinador, nunca quien hizo el trabajo | Cubre, con vacante y administrador de respaldo (D4) |
| Firma con imagen | No cubre (§4) |

Línea para el `archive-report`: cubre estado, transiciones, firmante, checklist propio, gas, retrabajo y prioridad; deja
foto, imagen de firma, checklist de diagnóstico, informe y guarda de entrega.

## 6. Grafo antes y después

```
ANTES (y DESPUÉS con el interruptor apagado)
  En Proceso ──finalizacion_servicio (Operativo)──► Por Facturar
  [envio_control_calidad: 409]

DESPUÉS, interruptor encendido
  En Proceso ──envio_control_calidad (Operativo)──► Control de calidad
  Control de calidad ──aprobacion_control_calidad (Decisional, firmante D4)──► Por Facturar
  Control de calidad ──rechazo_control_calidad (Decisional, firmante D4, priority=High)──► En Proceso
  [finalizacion_servicio: 409]

Las dos salidas de Control de calidad existen siempre: apagar con tickets dentro no los deja varados (D3, S-8).
```

Ningún estado desaparece; ningún ticket existente queda en un estado no declarado. Los tres `Rechazo` que llegan a
`Por Facturar` (`transitions.ts:234-239`) no pasan por Control de calidad (hipótesis: son devoluciones sin reparar).

## 7. Capacidades

- **Modificadas:** `transitions-st` (estado, tres transiciones, gating, cifras, orden de guardas); `permissions` (regla
  de firmante, exclusión de F1C-05, interruptor); `derivacion-avisos` (aviso a administradores); `trazas`
  (`performed_by_id`, junto a RQ-TZ-01 y RQ-TZ-16).
- **Nuevas:** ninguna.

## 8. Orden de guardas (F1B-10, D12)

A existencia < B estado y permiso < C contenido < D unicidad. `409` del interruptor: B, tras el `from`
(`ticketService.ts:126-128`). `403` de firmante: B, tras Decisionales (`:131`). Checklist, gas, motivo del
administrador y motivo del rechazo: el `422` agregado de `:134`. Cada guarda nueva lleva prueba de POSICIÓN frente a
su vecina (regla de mutación 1). Funciones auxiliares al final de `ticketService.ts`, guardas en las líneas `:131` y
`:134` (regla de mutación 4).

## 9. Regla 13 (resumen; la tabla decisión a decisión va en el diseño)

| Decisión del cliente | Imposición del servidor |
|---|---|
| Ocultar `envio_control_calidad` apagado / `finalizacion_servicio` encendido | `409` de D3 |
| Firmante, checklist, gas, motivos, prioridad | No los decide el cliente: `403` de D4, `422` de D9, `priority` de D7 |

## 10. Supuestos de producto (reversibles; van a la lista semanal de Gerencia)

- **S-1** Los tres ítems del checklist son provisionales.
- **S-2** Nombres de las tres transiciones.
- **S-3** Aprobación y rechazo son ambos Decisional.
- **S-4** El administrador tampoco firma si intervino.
- **S-5** En filas viejas de la traza (sin `performed_by_id`) se compara por nombre.
- **S-6** Tickets de Zoho: sólo cuenta lo registrado en Desk y `derivado_a` (`etapasDesdeHistoria.ts:19-21`).
- **S-7** `409` para la transición que el interruptor quita.
- **S-8** Las salidas de Control de calidad no dependen del interruptor.
- **S-9** El envío a QA es Operativo, así que quien lo ejecuta «intervino».

## 11. Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R-1 | Homónimos en filas viejas: `users.name` no es único (`schema.sql:85`) | Falla cerrada: un homónimo bloquea, nunca habilita; desde hoy se compara por id |
| R-2 | Encender sin asignar `cargo_permiso` deja sin habilitados: sólo firman administradores, con motivo | La segunda frase de §16 de `DEPLOY.md` lo dice; encendido junto con F1C-05, que exige lo mismo (`DEPLOY.md:766-768`) |
| R-3 | Desplazamiento de citas en ficheros muy citados | Inserción en la misma línea (`estados.ts:99`, `transitions.ts:262`, `fasesBlueprint.ts:67`, `columns.ts:33`, `config.ts:66`, `ticketService.ts:131/:134`); barrido de la regla de mutación 4 al cierre |
| R-4 | El mapa del blueprint tiene prueba anti-desfase contra `docs/artefactos/` | Regenerar con `scripts/generar-mapa-blueprint.ts` en el lote 1 |
| R-5 | Una caída entre la transición y el aviso pierde el aviso | Aceptado, mismo molde que `ticketService.ts:157-164` |
| R-6 | El día del encendido, M1.7 (`R08.4.md:1843`) y el glosario (`:5907`) quedan desactualizados | Anotarlo para el expediente del maestro al encender, no en esta tanda |

## 12. Mutaciones mínimas (las exige el pliego)

Interruptor encendido por defecto; con él apagado aparece el estado; firma quien intervino (técnico asignado; autor de
una Operativo); una Decisional o de Compras / Logístico cuenta como intervención; firma el Especialista con Coordinador
activo; firma un Técnico; el administrador firma habiendo otro habilitado; el administrador firma sin motivo; el aviso va
al Director Técnico o no sale; el rechazo no sube la prioridad o no registra el retrabajo; aprobado no lleva a Por
Facturar; posición de cada guarda nueva frente a su vecina.

## 13. Partición por intentos (techo 800, válvula 720)

| Intento | Contenido | Estimado |
|---|---|---|
| I1 | propuesta + specs delta | ~450 |
| I2 | diseño + tareas | ~300 |
| I3 | lote 1, `shared`: catálogo, regla, F1C-05, vigilantes, cifras, mapa | ~650 |
| I4 | lote 2, servidor: interruptor, columna, guardas, rechazo, aviso, ruta | ~700 |
| I5 | lote 3: cliente, `DEPLOY.md`, barrido de citas | ~200 |
| I6 | verify | ~350 |
| I7 | archive | techo 2 × carpeta + 800 |

## 14. Plan de vuelta atrás

Primera línea: dejar `CONTROL_CALIDAD_LIBERACION` sin `true` → flujo de hoy. Si hay tickets dentro de `Control de
calidad`, sus dos salidas siguen disponibles (D3). Segunda: revertir los commits de la rama; la columna
`performed_by_id` es aditiva y sin relleno, y puede quedarse sin efecto.

## 15. Criterios de éxito

- [ ] Apagado: la suite de hoy pasa sin cambios de comportamiento; `envio_control_calidad` da `409`.
- [ ] Encendido: `finalizacion_servicio` da `409`; el ciclo envío → aprobado llega a `Por Facturar`.
- [ ] Rechazo: vuelve a `En Proceso` con `priority = 'High'` y `contarRetrabajos` lo cuenta.
- [ ] Ninguna persona que intervino firma; el administrador sólo firma sin habilitado libre y con motivo.
- [ ] Las mutaciones de §12 ponen la suite en rojo, cada una.
- [ ] `npm test`, `npm run typecheck`, `npm run lint` en verde; barrido de citas sin roturas nuevas.
