# Informe de archivo — `prefijo-deducido-en-el-alta` (F1B-03, `cierra: si`)

Archivado el 2026-10-14 en la rama `prefijo-deducido-en-el-alta` (worktree hermano, regla del ciclo 3), sin fusionar a `main`.
Escrito por el orquestador con cifras medidas, no por el agente de archivo.

## Qué parte de la fila cubre

**F1B-03 queda terminada.** La fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:83`) pedía tipo de servicio,
ticket sin OV, guarda de remisión vigente y OVI de garantía, más los prefijos de E-094. Los tres cambios archivados antes
(`tipo-servicio-ticket-sin-ov`, `remision-creada-sin-salida`, `ovi-garantia-por-cargo`, los tres `cierra: no`) dejaban fuera
sólo los prefijos y E-158. E-158 la cerró una decisión sin construir nada (`decision/e158-equipo-nuevo-lleva-remision`), y
este cambio construye los prefijos según `decision/prefijo-de-que-se-deduce` (Gerencia, 2026-10-14). E-184 es un punto abierto
«si Gerencia lo pide», no contenido de la fila. Lo contrastó el verify (apartado 2 de `verify-report.md`).

## Qué quedó construido

- **`packages/shared/src/ticketCreate.ts`:** `prefijoDeducido(clasificacion, tipoServicio)`, pura y total, con los mismos
  predicados que enrutan el grafo (`flujos.ts`): Equipo nuevo → HV; Soporte remoto → SR; mantenimiento + Calibración → CG,
  + Protocolo → PRO, + cualquier otro → MT. «Protocolo» entra en `TIPOS_SERVICIO` en sexta posición. El AAMMDD del código sale
  del día civil de `America/Bogota`. Se retiran `defaultPrefijoFor` y `parseCodigoFromPotential`. El fichero pasa de 49 a 52
  líneas, todas añadidas al final o en la línea que estaba en blanco: ninguna línea citada se movió.
- **`apps/desk/server/services/ticketService.ts`:** el alta deduce el prefijo y construye siempre el código y el asunto; el
  `prefijo`, el `codigoServicio` y el `subject` del cuerpo se ignoran (no se rechazan: S-1). Cinco líneas editadas en sitio,
  277 → 277. «prefijo» sale de la lista de obligatorios del `422`.
- **`apps/desk/src/components/CreateTicket.tsx`:** sin desplegable de prefijo; el prefijo, el código y el asunto se muestran
  como vista previa (comodidad, regla 13 punto 3) y no se envían. 455 → 455.
- **`docs/sdd/F0-01_Correcciones_para_el_maestro.md`:** sección (35), al final, para que Gerencia pegue en el `.docx` la
  corrección de M1.1 (`R08.4.md:1170`, «no se genera automáticamente», que la decisión del 14/10 supera) y del Anexo G col. 27.
- **Sin migración de datos:** ni `schema.sql` ni migraciones tocadas. Los tickets existentes conservan su prefijo.

## Fusión del delta (por script, bloque a bloque)

`openspec/specs/tickets-core/spec.md` pasa de 3.618 a 3.844 líneas (`git diff --shortstat`: +237 −11).

| Bloque | Operación | Resultado |
|---|---|---|
| Tres filas (tabla de §0 y M-1, M-3 de §5.2) | sustituidas en su línea | sin desplazamiento |
| RQ-TC-03, RQ-TC-05, RQ-TC-10 | sustituidos conservando la cabecera viva | idénticos al delta; 20, 124 y 36 líneas; 0, 11 y 3 escenarios, los mismos títulos que la spec viva |
| RQ-TC-61, RQ-TC-62, RQ-TC-63 | añadidos al final | idénticos al delta; 16, 8 y 4 escenarios |

Las primeras 3.617 líneas conservan su número: sólo once cambian lo que dicen (33, 80, 82, 86-87, 138, 165, 563-564, 1463 y
1465). Las citas por línea a esas once están todas en los artefactos de este cambio, que declaran describir `968bb53`
(caso B). No hay capacidad nueva, así que `capabilities` no cambia (R-2). El guardián de la reconciliación sobre los ficheros reales
(`apps/desk/server/reconciliacion/registro.test.ts`, «en curso son exactamente DIEZ») se puso rojo al archivar, como debe: con
F1B-03 cerrada son NUEVE. Se actualizó en sitio, sin cambiar su recuento, como en los cierres de F1B-05, F1B-07 y F1B-11. Antes de fusionar se corrigió W-1 del verify: la nota
de fusión del delta decía que RQ-TC-05 conservaba 13 escenarios; son 11.

## Registro de intentos

| Intento | Contenido | Líneas registradas |
|---|---|---|
| 1 | propuesta | 161 |
| 2 | spec delta | 480 |
| 3 | diseño y tareas | 356 |
| 4 | lote 1 (`shared`) | 181 |
| 5 | lote 2 (servidor) | 338 |
| 6 | lote 3 (cliente, retiradas y corrección del maestro) | 205 |
| 7 | remediación: tres citas que el detector bloqueaba sobre `HEAD` | 6 |
| 8 | verify | 85 |
| 9 | este archivo | abierto con techo 3.400 por la regla del archivo |

Cada cifra coincidió con `git diff --shortstat --no-renames` contra el commit de partida del intento. Ninguno superó la válvula
de 720. No hay ficheros binarios.

**Dos incidencias de proceso, contadas.** (1) En el lote 1, `npm test` salió dos veces con 1 por
`[vitest-worker]: Timeout calling "onTaskUpdate"` con todas las pruebas verdes; la base `23d9011` daba lo mismo en el worktree
recién instalado y `main` daba 0; la tercera corrida dio 0. (2) El lote 3 se asentó con el detector `--sha HEAD` en 1, porque la
cadena se escribió con `;`; las tres citas bloqueantes (nombre de fichero mal escrito, una cita a línea vacía sin ancla y una
hora leída como cita) se repararon en el intento 7, y desde ahí cada asiento va en una cadena con `&&`.

## Medida de este archivo (regla del archivo)

Parte con carga de revisión, medida antes de aplicar en una copia de ensayo: fusión del delta, 248 (237 + 11), y este informe.
Bajo 800. La mudanza de la carpeta (1.245 líneas) no tiene carga de revisión.

## Cierre: los cinco códigos

Sobre la punta de la rama antes de este archivo (`1267bb1`), corridos por el orquestador y por el verify: `npm test` 0
(4.695 pruebas pasan, 11 se omiten), `npm run typecheck` 0, `npm run lint` 0 (165 avisos, la misma línea base), `npm run build`
0 (bundle `index-t1QFmlpr.js`), detector `--sha HEAD` 0. Verify: PASS WITH WARNINGS, 0 CRITICAL, sin supervivientes.

## Supuestos reversibles — plazo de corrección: una semana desde su publicación

S-1 el cuerpo con `prefijo`/`codigoServicio`/`subject` se ignora, no se rechaza · S-2 el asunto deja de ser editable · S-3 el
prefijo de la oportunidad de CRM deja de leerse, sin aviso · S-4 el AAMMDD es el día civil de Bogotá · S-5 una clasificación
desconocida va a la rama de mantenimiento, y la caja y los espacios se pliegan · S-6 el tipo de servicio se compara por literal
exacto · S-7 «Protocolo» va en sexta posición. Cómo se revierte cada uno: tabla de `proposal.md`.

## Tareas de persona — fuera del recuento; archivar no las da por hechas

| Id | Qué | Dueño |
|---|---|---|
| P-1 | Verificar en la aplicación, tras desplegar, los tres escenarios manuales de RQ-TC-63 | quien despliega, con Gerencia |
| P-2 | Pegar en el `.docx` la sección (35) de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` | Gerencia |
| P-3 | Decidir si «Ingreso a Servicio» puede seguir reescribiendo el código con cualquier prefijo (H-1: su campo de texto libre «Código Servicio», `packages/shared/src/transitions.ts:191`) | Gerencia |
| P-4 | Confirmar que n8n trata «Protocolo» como texto libre (hipótesis) | quien administra n8n |

## Para Supervisión (ficheros que esta rama no toca)

- `openspec/config.yaml` en `968bb53`, dentro de `decision/prefijo-de-que-se-deduce`: la cita a `ticketService.ts:87` («hoy el
  servidor exige el prefijo») y la de `ticketCreate.ts:46-49` en `968bb53` (`defaultPrefijoFor`) pasan a describir el pasado: caso B, anclar
  a `968bb53`. Mismo caso para las citas de `docs/sdd/ENTRADA.md` que el apply listó en E-021.
- La entrada de bandeja de H-1 (P-3) la registra Supervisión.

## Qué verá quien da de alta un ticket

El formulario ya no tiene desplegable de prefijo. El prefijo, el código de servicio y el asunto se muestran ya calculados y no se
pueden editar. «Protocolo» aparece en la lista de tipos de servicio. Al crear, el ticket queda con el prefijo que corresponde a
su clasificación y su tipo, aunque una pestaña con la versión anterior mande otro.
