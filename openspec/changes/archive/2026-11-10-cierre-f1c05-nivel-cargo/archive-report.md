# Archive · `cierre-f1c05-nivel-cargo` (F1C-05, `cierra: si`)

**Fecha:** 2026-11-10 · **Rama:** `cierre-f1c05-nivel-cargo` · **Partida:** `0e2b609b` · **Informe escrito por el
orquestador**, con cifras medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué cubrió la fila F1C-05 y qué dejó fuera, en una línea (R-1):** cubrió el nivel cargo de C10 entero en tres cambios con `cierra: no` —los cargos de permiso en lista cerrada y en una columna separada de la firma, con el área como base, el cargo que sólo restringe y el administrador que siempre puede; la «Liberación sin factura» exigida al Director Comercial en el servidor y las primitivas de la OVI de garantía y del Top 5, hoy con llamador; la paridad de esa liberación, con motivo de lista cerrada, fecha prevista y texto; y las Decisionales por cargo, con las tres «Anulación», detrás de `DECISIONALES_POR_CARGO`, apagado hasta enero por `decision/e248-adelanto-f1c` (2)—; dejó fuera el propietario del registro, que pasa a F1C-13 por `decision/filas-que-no-cierran-antes-del-corte` (2), y con él, por el supuesto S-5, la reasignación sólo por la persona a cargo y la restricción de Solicitud / Entrega de repuestos; la alarma por fecha vencida la construyó F1C-02 (E-102) y el histórico de liberaciones queda sin tanda por `decision/p64-historico-c1`.

## Qué decisión registra

`decision/filas-que-no-cierran-antes-del-corte` (Gerencia, 2026-11-09; `openspec/config.yaml:5761-5778` en `0e2b609b`): «F1C-05:
se parte; el nivel cargo cierra antes del corte y el propietario del registro va a fila nueva después»
(`openspec/config.yaml:5767` en `0e2b609b`). Su consecuencia (2) pide el cierre sin código
(`openspec/config.yaml:5770` en `0e2b609b`), y `decision/orden-tandas-tras-e266` (1) lo pone detrás de E-266 y del cierre de
F1B-13 (`openspec/config.yaml:5829` en `0e2b609b`). No añade nada a `cierres_declarados_por_commit`.

## Qué quedó hecho

- **El contraste pieza a pieza de la fila** con los tres cambios archivados y sus decisiones de respaldo, en `proposal.md`,
  «Contraste pieza a pieza». Ninguna pieza de la fila queda sin construir y archivar sin que la saque una decisión. Los
  Decisionales cuentan como construidos con su interruptor apagado por decisión (S-4), como F1C-03 en e248 (1).
- **El verify** (`daaf3c60`): PASS, 0 críticos. Un agente de sólo lectura que no escribió la propuesta leyó en su ancla las 193
  citas de la propuesta y de `tasks.md`; el orquestador comprobó la forma de cada una con su script y los 23 requisitos vivos.
  Seis avisos y cuatro sugerencias, corregidos en sitio; el más útil, que la pieza nueva de E-098 no estaba «sin destino»: E-142
  la manda a 2027.
- **El rojo, visto antes de corregir.** Con la carpeta en `archive/`, `apps/desk/server/reconciliacion/registro.test.ts` dio
  1 fallo de 23, la prueba 11f/05g, y la única diferencia era `'F1C-05'` en «en curso».
- **La corrección, en sitio:** líneas 218 y 220. La lista pasa de SIETE a SEIS, sin F1C-05; el título nombra F1C-05 entre las
  cerradas por archivo, con su cambio, y la 220 añade `toContain('F1C-05')` en «cerradas por archivo». El fichero sigue en 248
  líneas, todas CRLF, con 0 `\r` sueltos: 23 de 23. Es la única edición de código del cambio, con el molde de `8b3c4bac`.
- **`npm run reconcile` sobre el árbol del archivo:**
  - F1C-05 pasa a «cerradas por archivo» (35) y «en curso» baja a 6: F1B-09, F1C-07, F1F-01, F1F-02, F1F-03 y F1F-05.
  - F1C-05 no entra en «cerradas sin fuente declarada en la R01.1» (siguen 13): tiene fila allí, con fuente «M1.9.1», y su
    `maestro:` la cita (S-1).
  - Las 9 «marcadas sin verificar» son las mismas que en `main`.
  - El denominador sigue en 78 y las cerradas por commit en 9.
  - `docs/sdd/RECONCILIACION.md` se restauró sin commitear.
- **Barrido de la regla de mutación 4 sobre `registro.test.ts`:** no se movió ninguna línea. En el repositorio hay 114 citas a sus
  líneas 215 a 223.
  - Las de este cambio, siete, van ancladas en `0e2b609b`.
  - Fuera de `archive/` hay dos, y las dos son de caso B: la traza de E-256 (`docs/sdd/ENTRADA.md:2344` en `0e2b609b`) y el
    informe de F1B-09 (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:292`), que habla de cuando la lista contaba diez.
  - Las demás están en carpetas de `archive/`, sin ancla: es la clase que ya registra E-256, y este cierre vuelve a cambiar lo que
    dicen la 218 y la 220.
- **Dos anclas partidas, corregidas en este commit.** En `verify-report.md`, las anclas de la cita a `docs/sdd/ENTRADA.md:1359` y
  de la cita a `openspec/config.yaml:4302` habían quedado en la línea física siguiente; ahora van en la misma. El detector no las
  habría visto, porque no lee `archive/`, y el pase de F1B-13 tampoco: sólo buscaba «` en» al final de línea, no el ancla que
  empieza la línea siguiente.
- **La única ruta a la propia carpeta**, en `verify-report.md`, comprobación 7, es histórica (lo que tocó `bf8de7ea`) y se
  conserva (caso B).
- **Sin código de producción, sin `openspec/specs/`, sin migración y sin cambio de bundle.**

## Intentos del registro

| Intento | Commit | Medida (`git diff --shortstat --no-renames`) | Registro |
|---|---|---|---|
| Planificación | `bf8de7ea` | 326 (+326), contra `0e2b609b`; 0 sin trackear | `passed` |
| Verify | `daaf3c60` | 121 (+101 −20), contra `bf8de7ea`; 0 sin trackear | `passed` |
| Archivo | este commit | se mide al cerrar el intento, contra `daaf3c60` | techo 1.900 (dos veces la carpeta más 800, redondeado) |

## Supuestos reversibles — plazo de corrección: una semana desde que se publique

- **S-1:** `maestro: ["M1.9.1", "Anexo D nº 39"]`, el de `permisos-por-cargo`.
- **S-2:** `capacidad: [reconciliacion]`.
- **S-3:** `toca_maestro: no`, como los cierres sin código de F1B-04 y F1B-13.
- **S-4:** lo construido detrás de un interruptor que una decisión mantiene apagado cuenta como construido.
- **S-5:** la reasignación sólo por la persona a cargo y la restricción de Solicitud / Entrega de repuestos son nivel propietario
  del registro y van con él a F1C-13.
- **S-6:** los dos campos de cargo (E-092, Anexo D nº 75) son una pregunta de Gerencia, no pieza de la fila.

Cómo se revierte cada uno: `proposal.md`, «Supuestos reversibles».

## Para Supervisión — no se editan en la rama

- **El plan.**
  - La fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:103` en `0e2b609b`) lleva la nota del 09/11 con este
    cambio, pero su celda de estado sigue diciendo «en curso».
  - Su remanente (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:220` en `0e2b609b`) ya dice que la paridad está
    hecha; le falta que el nivel cargo cerró con este cambio.
  - La nota 3 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:269` en `0e2b609b`) dice que F1C-05 no puede cerrar
    antes del corte; queda superada (caso C) por la fusión de F1C-04 (`f409b550`) y de `decisionales-por-cargo` (`da916152`).
  - Si se acepta S-5, la fila F1C-13 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:422` en `0e2b609b`) puede
    nombrar las dos restricciones que recibe.
- **`openspec/config.yaml`.** Siguen poniendo el propietario en F1C-05 `decision/e089-e220-visibilidad-y-traspaso`, en el título
  de su (4) (`openspec/config.yaml:4011` en `0e2b609b`) y en su `tanda_que_abre` (`openspec/config.yaml:4019` en `0e2b609b`), y
  `decision/orden-ocho-tandas-06-10` (3) (`openspec/config.yaml:4302` en `0e2b609b`). Desde la consecuencia (2), esa fila es
  F1C-13; las decisiones no se reescriben, a lo sumo llevan una nota de precisión. Y `decision/filas-que-no-cierran-antes-del-corte`
  pide en su `tanda_que_abre` «dos cambios de cierre sin código (F1B-13 y el nivel cargo de F1C-05)»
  (`openspec/config.yaml:5778` en `0e2b609b`): con este, los dos están hechos.
- **La bandeja.** E-092 dice «Afecta a: fila F1C-05» (`docs/sdd/ENTRADA.md:1279` en `0e2b609b`) y E-201 a E-206 llevan F1C-05
  en el título: con la fila cerrada, su destino pasa a F1C-13 o a un punto abierto con dueño. El encabezado de E-206 sigue
  diciendo «ABIERTA» (`docs/sdd/ENTRADA.md:2027` en `0e2b609b`) con la hipótesis despejada
  (`docs/sdd/ENTRADA.md:2032` en `0e2b609b`). E-256 crece con este cierre: la 218 y la 220 de `registro.test.ts` vuelven a
  cambiar.
- **Los supuestos de la fila sin lista aceptada.** Los S-1 a S-6 de `decisionales-por-cargo` están en el anexo de supuestos nunca
  publicados (`docs/sdd/Supuestos_semana_2026-11-02.md:219`).
- **El avance.** Medido con `npm run reconcile` sobre el árbol del archivo: 35 cerradas por archivo, 9 por commit, 6 en curso,
  denominador 78. `docs/sdd/RECONCILIACION.md` se regenera en `main` tras la fusión. De las ocho filas de antes del corte que
  contaba `decision/margen-corte-09-11` (2) (`openspec/config.yaml:5751` en `0e2b609b`), con F1B-13 y F1C-05 cerradas quedan seis.
- **El maestro, para el expediente.** M1.9.1 dice «La fila F1C-05 sigue abierta por el nivel «propietario del registro»»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1952`), y lo mismo `:3934` y `:4184`; el Anexo D
  nº 75 tiene por fuente F1C-05 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5587`). Desde la
  consecuencia (2), la fila del propietario es F1C-13; va con S-3. Las correcciones 27 y 30 dicen lo mismo con F1C-05
  (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1417-1419` en `0faa8832` y `docs/sdd/F0-01_Correcciones_para_el_maestro.md:1509-1510` en `0faa8832`), y
  la 25 tiene que perder su última frase antes de pegarse
  (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1363-1364` en `0faa8832`).

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Destino |
|---|---|---|---|
| P-1 | Verificar en la aplicación el botón de la Liberación sin factura por cargo (P.2 de `permisos-por-cargo`) y las cinco comprobaciones de motivo y fecha | Comercial, Gerencia o quien opere la aplicación | La lista acumulada de pruebas en la aplicación |
| P-2 | Decidir si los dos campos de cargo se unifican (E-092, Anexo D nº 75; S-6) | Gerencia | Sin destino asignado, a propósito |
| P-3 | Responder E-201 a E-205, los supuestos aplicados de la paridad | Gerencia | Punto abierto con dueño (R-3) |
| P-4 | Pegar en el maestro la corrección 25, sin su última frase | Gerencia | El `.docx` del maestro |
| P-5 | Comprobar, antes de encender, el cargo de permiso del Director Técnico, el Especialista técnico, el Director Comercial y la Coordinadora Comercial | Administrador de la aplicación | Antes de encender |
| P-6 | Encender `DECISIONALES_POR_CARGO`, no antes del 14/12/2026, y verificarlo en la aplicación | Persona con acceso a producción, por orden de Gerencia | Enero de 2027 |
| P-7 | Actualizar M1.9 del maestro al encender | Supervisión → Gerencia | El expediente siguiente |
| P-8 | Decidir en qué lista entran los S-1 a S-6 de `decisionales-por-cargo` | Supervisión | La lista semanal (E-237) |
| P-9 | Revisar S-1 a S-6 de este cambio en la lista semanal de supuestos (E-237) | Gerencia | La lista semanal |
