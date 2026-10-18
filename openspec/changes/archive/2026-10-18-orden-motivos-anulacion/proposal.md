---
tanda: F1C-01
motivo: ""
capacidad: [transitions-st]
maestro: ["Anexo D nº 31"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `orden-motivos-anulacion`

## 1. Qué fila atiende

F1C-01 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:99`), ya cerrada por el archivo de `anulado-con-motivo`.
Respaldo: `decision/f1c01-motivos-esperas` (`openspec/config.yaml:5030-5047`), que aclara `decision/c3-salida-esperas`
(`openspec/config.yaml:1834`): desde las dos esperas externas valen los cinco motivos, y «Repuesto no disponible» y «Sin
solución técnica» se muestran primero, «sólo como comodidad de pantalla» (`:5036`). `cierra: no` (SA-1). `toca_maestro: no`:
el maestro fija la lista de motivos, no su orden en pantalla.

## 2. Medición, sobre `8f629b5`

- **La lista** es `MOTIVOS_ANULACION` (`packages/shared/src/anulacion.ts:22-28`), con «Otro» el último a propósito (`:21`).
  El campo la copia en sus `options` (`:34`) y el desplegable las pinta tal cual
  (`apps/desk/src/components/TransitionPanel.tsx:257-261`). Hoy el orden es el mismo en todos los estados.
- **El servidor** valida la pertenencia en `erroresAnulacion` (`anulacion.ts:43-55`; la comprobación, `:50`), sumada al
  `422` del escalón C (`apps/desk/server/services/ticketService.ts:134`). El orden no lo mira nadie.
- **El panel** recibe `status` (`TransitionPanel.tsx:40`) y pinta los campos en `:160-178`; `Field` (`:194-267`) no lo recibe.
- **Ojo:** «espera externa» NO es la clase `externa` de `estados.ts`: esa clase la llevan también `Notificación cliente`
  (`packages/shared/src/estados.ts:65`), que es origen de anulación, y otros cuatro. Los dos estados se nombran explícitamente.

## 3. Qué se construye

1. **`motivosAnulacionOrdenados(estado: string): string[]`**, función pura añadida AL FINAL de `anulacion.ts` (sin insertar
   líneas sobre código citado, regla de mutación 4). En `En Espera de Repuestos` y `Servicio externo` devuelve «Repuesto no
   disponible», «Sin solución técnica», y después los demás en su orden relativo, con «Otro» el último. En cualquier otro
   estado, una copia de `MOTIVOS_ANULACION`. Siempre el mismo conjunto: ni uno más ni uno menos.
2. **El `.tsx` sólo la consume**, para el campo cuya clave es `CLAVE_MOTIVO_ANULACION` (`anulacion.ts:19`), editando líneas
   existentes de `TransitionPanel.tsx` (el `import` de `:8` y el mapeo de `:160`, o lo que fije el diseño), sin insertar.
3. **Spec:** requisito ADDED `RQ-TS-41` al final de `openspec/specs/transitions-st/spec.md` (SA-4).

## 4. Regla invariable 13 — decisiones del cliente

| Decisión del cliente | ¿Bloquea o rellena? | Línea del servidor |
|---|---|---|
| Orden del desplegable del motivo | Ni bloquea ni rellena | **Ninguna, y es correcto:** el orden no es una regla, es presentación (consecuencia 2 de la decisión, `config.yaml:5041`) |
| Ofrecer sólo los cinco motivos | Limita la elección | `anulacion.ts:50` vía `ticketService.ts:134`; probado: motivo fuera de la lista → `422` en `apps/desk/server/anulacion.test.ts:80-86` |

El desplegable es comodidad legítima (regla 13, punto 3) **sólo para la pertenencia**, que el servidor impone y está probada.
No hay restricción de motivo por estado de origen (consecuencia 1, `config.yaml:5040`): el servidor no cambia.

## 5. Pruebas (strict TDD) y mutaciones que deben ponerlas en rojo

Las pruebas van en `packages/shared/src/anulacion.test.ts`, contra la función pura. El `.tsx` queda fuera de la red de
pruebas por decisión de Gerencia (`vitest.config.ts:16-20`, F0-00): su consumo se comprueba con `typecheck` y lectura.

- **M1** no reordenar en las dos esperas → rojo.
- **M2** reordenar en otro estado (p. ej. `Notificación cliente` o `Rev./Diagnostico`) → rojo.
- **M3** añadir o quitar un motivo: el conjunto debe ser igual a `MOTIVOS_ANULACION` en todo estado → rojo.
- **M4** sacar «Otro» del último puesto → rojo.

## 6. Supuestos reversibles (para la lista semanal)

| # | Supuesto | Cómo se revierte |
|---|---|---|
| SA-1 | El cambio no reabre F1C-01: `cierra: no`, la fila ya la cerró el archivo de `anulado-con-motivo` | Cambiar la cabecera si Gerencia la considera abierta |
| SA-2 | Entre los dos primeros, «Repuesto no disponible» y luego «Sin solución técnica», el orden en que los nombra Gerencia (`config.yaml:5036`) | Invertir los dos en la función y en su prueba |
| SA-3 | Los otros dos motivos conservan su orden relativo de `MOTIVOS_ANULACION` | Reordenarlos en la función |
| SA-4 | La spec va como ADDED `RQ-TS-41` (hoy el último es `RQ-TS-40`, `spec.md:2615`), no como MODIFIED de `RQ-TS-40`, para no copiar un bloque grande | Fundir `RQ-TS-41` en `RQ-TS-40` en una tanda documental |

## 7. Fuera de alcance

- Cambiar el servidor, la lista de motivos o restringir motivos por estado de origen. Pruebas de interfaz (excluidas, F0-00).
- Las cifras caducas de «31 transiciones» (van a la bandeja, `config.yaml:5036`) y S-10 (ya escrito en `anulado-con-motivo`).

## 8. Partición (cuatro intentos, cada uno ≤ 800)

| Intento | Contenido | Estimación |
|---|---|---|
| 1 | Planificación: `proposal.md`, delta de spec, `design.md`, `tasks.md` | ~300 |
| 2 | Aplicar: función, pruebas, consumo en el `.tsx` | ~150 |
| 3 | Verify: `verify-report.md` | ~200 |
| 4 | Archive: fusión del delta por script, `archive-report.md` y mudanza (la mudanza no pide techo, «Regla del archivo»; lo revisable ≤ 800) | — |

## 9. Reversión y criterios de éxito

**Reversión:** revertir el commit; el `.tsx` vuelve a pintar `f.options` y la función queda sin uso. Sin datos ni migración.
- [ ] En las dos esperas el desplegable abre con «Repuesto no disponible» y «Sin solución técnica»; en los demás, igual que hoy.
- [ ] M1-M4 ponen roja la suite; `npm test`, `npm run typecheck` y `npm run lint` en verde.
- [ ] `anulacion.ts:1-59` intacto y `TransitionPanel.tsx` con el mismo número de líneas; sin cambios en `apps/desk/server`.
