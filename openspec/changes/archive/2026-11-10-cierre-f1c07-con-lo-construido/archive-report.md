# Archive · `cierre-f1c07-con-lo-construido` (F1C-07, `cierra: si`)

**Fecha:** 2026-11-10 · **Rama:** `cierre-f1c07-con-lo-construido` · **Partida:** `9223318f` · **Informe escrito por el
orquestador**, con cifras medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué cubrió la fila F1C-07 y qué dejó fuera, en una línea (R-1):** cubrió C6 entero en un cambio con `cierra: no`, `control-calidad-liberacion` (fusionado en `afccdcf0`) —el estado `Control de calidad` entre `En Proceso` y `Por Facturar`, aprobado a `Por Facturar` y rechazado a `En Proceso` con prioridad alta, el retrabajo registrado y contable, el checklist siempre y el gas patrón cuando el tipo de equipo lo pide (construido el mecanismo; su contenido son tres casillas provisionales), la firma por persona que nunca es de quien intervino, con el firmante de `decision/f1c07-firma-control-calidad` y el administrador de respaldo con aviso—, todo detrás de `CONTROL_CALIDAD_LIBERACION`, apagado hasta enero por `decision/e248-adelanto-f1c` (2) (S-4); dejó fuera, por e248 (3), la foto del equipo embalado y la guarda de salida (a F1B-17) y la firma con imagen (a F1E-04), y la firma «Revisó» del informe, a F1E-04 por `decision/roles-validacion-informe`; y, por supuesto y no por decisión, el checklist que revisa los fallos del diagnóstico y alimenta el informe de salida (S-5, a F1E-03) y el indicador de retrabajo (S-6, a `kpis`).

## Qué decisión registra

`decision/e248-adelanto-f1c` (Gerencia, 2026-11-09): «lo que falta de F1C-07 va a F1B-17 (foto del embalado y guarda de salida) y
a F1E-04 (firma con imagen), y F1C-07 cierra con lo construido» (`openspec/config.yaml:5730` en `9223318f`), y su consecuencia (3)
lo convierte en este cambio de cierre sin código (`openspec/config.yaml:5734` en `9223318f`). La fila la decidió
`decision/c6-qa-liberacion` (`openspec/config.yaml:1884` en `9223318f`). No añade nada a `cierres_declarados_por_commit`.

## Qué quedó hecho

- **El contraste pieza a pieza de la fila** con el cambio archivado y sus decisiones, en `proposal.md`, «Contraste pieza a pieza».
  Ninguna pieza queda sin construir y sin destino. Dos tienen el destino fijado por supuesto (S-5, S-6); la fila la cierra e248,
  no esos supuestos.
- **El verify** (`e9c5314a`): PASS, 0 críticos. Un agente de sólo lectura que no escribió la propuesta leyó en su ancla 136 citas
  únicas (187 apariciones); el orquestador comprobó la forma de cada una con su script (223 de 223 tras corregir) y los 17
  requisitos vivos. Siete avisos (seis distintos) y nueve sugerencias, corregidos en sitio. El más útil: S-5 condicionaba el cierre
  y chocaba con e248, que ya lo ordena.
- **El rojo, visto antes de corregir.** Con la carpeta en `archive/`, `apps/desk/server/reconciliacion/registro.test.ts` dio
  1 fallo de 23, la prueba 11f/05g, y la única diferencia era `'F1C-07'` en «en curso».
- **La corrección, en sitio:** líneas 218 y 220. La lista pasa de SEIS a CINCO, sin F1C-07; el título nombra F1C-07 en los dos
  sitios del molde (la lista «sin F1C-07, F1C-05, …» y el paréntesis de las cerradas por archivo, con su cambio), y la 220 añade
  `toContain('F1C-07')` en «cerradas por archivo». El fichero sigue en 248 líneas, todas CRLF, con 0 `\r` sueltos: 23 de 23. Es la
  única edición de código del cambio, con el molde de `8647518b`.
- **`npm run reconcile` sobre el árbol del archivo:**
  - F1C-07 pasa a «cerradas por archivo» (36) y «en curso» baja a 5: F1B-09, F1F-01, F1F-02, F1F-03 y F1F-05.
  - F1C-07 no entra en «cerradas sin fuente declarada en la R01.1» (siguen 13): tiene fila allí, con fuente «M9.1», y su
    `maestro:` la cita (S-1).
  - Las 9 «marcadas sin verificar» son las mismas que en `main`.
  - El denominador sigue en 78 y las cerradas por commit en 9.
  - `docs/sdd/RECONCILIACION.md` se restauró sin commitear.
- **Barrido de la regla de mutación 4 sobre `registro.test.ts`:** no se movió ninguna línea. En el repositorio hay 127 citas a sus
  líneas 215 a 223.
  - Las de este cambio, ocho, van ancladas en `9223318f`.
  - Fuera de `archive/` hay dos, y las dos son de caso B: la traza de E-256 (`docs/sdd/ENTRADA.md:2344` en `9223318f`) y el
    informe de F1B-09 (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:292`), que habla de cuando la lista contaba diez.
  - Las demás están en carpetas de `archive/`, sin ancla: es la clase que ya registra E-256, y este cierre vuelve a cambiar lo que
    dicen la 218 y la 220.
- **La única ruta a la propia carpeta**, en `verify-report.md`, comprobación 7, es histórica (lo que tocó `a3742320`) y se
  conserva (caso B).
- **Sin código de producción, sin `openspec/specs/`, sin migración y sin cambio de bundle.**

## Intentos del registro

| Intento | Commit | Medida (`git diff --shortstat --no-renames`) | Registro |
|---|---|---|---|
| Planificación | `a3742320` | 329 (+329), contra `9223318f`; 0 sin trackear | `passed`, 329 |
| Verify | `e9c5314a` | 199 (+150 −49), contra `a3742320`; 0 sin trackear | `passed`, 199 |
| Archivo | este commit | se mide al cerrar el intento, contra `e9c5314a` | techo 1.700 (dos veces la carpeta, 430 líneas, más 800, redondeado) |

## Supuestos reversibles — plazo de corrección: una semana desde que se publique

- **S-1:** `maestro: ["M9.1", "M1.7", "M2.5"]`, el de `control-calidad-liberacion`.
- **S-2:** `capacidad: [reconciliacion]`.
- **S-3:** `toca_maestro: no`, como los cierres sin código de F1B-04, F1B-13 y F1C-05, aunque M9.1, M1.7 y el §3.3 quedan
  desactualizados.
- **S-4:** lo construido detrás de `CONTROL_CALIDAD_LIBERACION`, apagado por e248 (2), cuenta como construido.
- **S-5:** el checklist que revisa los fallos del diagnóstico y alimenta el informe de salida va a F1E-03.
- **S-6:** el indicador de retrabajo de M7.1 va a `kpis` (Fase 2), no a F1F-05.
- **S-7:** el «checklist firmado» está construido como la firma registrada en la traza; a F1B-17 pasa exigirlo al salir de
  `Por Entregar`.

S-5 y S-6 fijan sólo un destino: si Gerencia los corrige, cambia ese destino y la fila sigue cerrada por e248. Cómo se revierte
cada uno: `proposal.md`, «Supuestos reversibles».

## Para Supervisión — no se editan en la rama

- **El plan.**
  - La fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:105` en `9223318f`) lleva la nota del 09/11 con este
    cambio, pero su celda de estado sigue diciendo «pendiente».
  - La población «después del corte sin fecha» del §G
    (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:290` en `9223318f`) pasa de 6/25 a 7/25.
  - Si se acepta S-5, la fila F1E-03 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:122` en `9223318f`) puede nombrar
    la pieza que recibe; con S-6, el indicador de retrabajo queda con `kpis`, sin fila del plan.
- **`openspec/config.yaml`.** `decision/tabla-de-cargos-y-personas-10-10` deja «una pregunta para F1C-07»
  (`openspec/config.yaml:4512` en `9223318f`) que ya respondió `decision/f1c07-firma-control-calidad`
  (`openspec/config.yaml:5113` en `9223318f`); y `decision/c6-qa-liberacion` no dice dónde cae su frase del checklist de
  diagnóstico (`openspec/config.yaml:1891` en `9223318f`). Las decisiones no se reescriben: a lo sumo, una nota de precisión.
- **La bandeja.** E-047 (`docs/sdd/ENTRADA.md:735` en `9223318f`), E-052 y E-082 nombran la fila y están cerradas; E-248 ya está
  cerrada con la decisión (`docs/sdd/ENTRADA.md:2289` en `9223318f`). E-256 crece con este cierre: la 218 y la 220 de
  `registro.test.ts` vuelven a cambiar.
- **El avance.** Medido con `npm run reconcile` sobre el árbol del archivo: 36 cerradas por archivo, 9 por commit, 5 en curso,
  denominador 78. `docs/sdd/RECONCILIACION.md` se regenera en `main` tras la fusión.
- **El maestro, para el expediente.** La guarda de salida y la foto que la R08.4 sitúa en F1C-07
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1829` y
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3253`) son ahora de F1B-17, y la imagen de firma
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3254`) de F1E-04. El «Cuándo» de M9.1
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3256`), el §3.3 y las dos listas de estados «sin
  construir» pueden decir «construido detrás de un interruptor apagado hasta enero». M1.7 y el glosario
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1843` y
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5907`) siguen siendo ciertos hasta el encendido.
  Va con S-3.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Destino |
|---|---|---|---|
| P-1 | Confirmar o corregir el destino de las dos piezas sin respuesta: el checklist del diagnóstico (S-5, F1E-03) y el indicador de retrabajo (S-6, `kpis`) | Gerencia | La lista semanal (E-237) |
| P-2 | Asignar el cargo de permiso al Coordinador Técnico o, mientras no lo haya, comprobar el del Director Técnico y el Especialista técnico, antes de encender | Administrador de la aplicación | Antes de encender |
| P-3 | Encender `CONTROL_CALIDAD_LIBERACION`, junto con `DECISIONALES_POR_CARGO` y no antes del 14/12/2026 | Persona con acceso a producción, por orden de Gerencia | Enero de 2027 |
| P-4 | Probar en la aplicación con el interruptor apagado y encendido; que esté hecho es hipótesis | Gerencia (ronda final) | La lista acumulada de pruebas en la aplicación |
| P-5 | Decidir en qué lista entran los S-1 a S-18 de `control-calidad-liberacion` | Supervisión | La lista semanal (E-237) |
| P-6 | Cambiar en el maestro la fila de la foto, la guarda y la imagen de firma (M9.1, M1.7), debido desde el 09/11 | Supervisión → Gerencia | El expediente siguiente |
| P-7 | Al encender, actualizar M1.7, el glosario y el §3.3 del maestro | Supervisión → Gerencia | El expediente que siga al encendido |
| P-8 | Revisar S-1 a S-7 de este cambio en la lista semanal de supuestos (E-237) | Gerencia | La lista semanal |
