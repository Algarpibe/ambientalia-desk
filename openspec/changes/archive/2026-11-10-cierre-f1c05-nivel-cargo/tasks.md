# Tareas: cierre de F1C-05 en su nivel cargo

Cambio documental, sin código de producción ni delta de specs. Tres intentos del registro: planificación, verify y
archivo. Cada intento se asienta sólo con TODOS sus códigos en 0.

## 1. Planificación

- [x] 1.1 Medir la fila F1C-05 (R01.1, R01.2, R01.3, R01.4, su remanente y la nota 3), los tres cambios archivados con
  `tanda: F1C-05` y las decisiones de respaldo; escribir en `proposal.md` el contraste pieza a pieza, con ruta y línea, y el
  requisito vivo de cada pieza construida.
- [x] 1.2 Cabecera de siete campos: `tanda: F1C-05`, `cierra: si`, `origen_cabecera: declarada`, y `maestro` con «M1.9.1», la
  fuente de la fila de la R01.1 que el barrido cruza (S-1).
- [x] 1.3 `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165` y el detector de citas
  (`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`) con código 0.

## 2. Verify

- [x] 2.1 Contrastar cada cita de `proposal.md` y de este fichero contra su fichero, en su ancla: qué afirma, extremo inicial y
  final.
- [x] 2.2 Comprobar que ninguna pieza de la fila queda sin construir y archivar salvo la que saca una decisión (el propietario
  del registro, a F1C-13) y las dos restricciones que viajan con ella por el supuesto S-5, no por decisión; y que los
  Decisionales están construidos detrás del interruptor que `decision/e248-adelanto-f1c` (2) mantiene apagado (S-4). Si queda
  alguna más, parar sin archivar.
- [x] 2.3 Comprobar que cada requisito de «Las piezas, en las specs vivas» existe en la línea citada y dice lo que la tabla le
  atribuye.
- [x] 2.4 Comprobar que el cambio no toca código de producción, `openspec/specs/` ni ficheros de Supervisión
  (`git diff --name-only` contra `0e2b609b`).
- [x] 2.5 Escribir `verify-report.md` con veredicto; los cuatro códigos con código 0.

## 3. Archivo

- [x] 3.1 Medir antes de aplicar la parte revisable (`archive-report.md` y las líneas de
  `apps/desk/server/reconciliacion/registro.test.ts`) con `git diff --shortstat --no-renames`; si supera 800, parar. Abrir el
  intento con un techo de dos veces la carpeta más 800.
- [x] 3.2 Mover la carpeta a `openspec/changes/archive/<fecha>-cierre-f1c05-nivel-cargo/`; las rutas a la propia carpeta que
  sean históricas se conservan (caso B).
- [x] 3.3 Correr `apps/desk/server/reconciliacion/registro.test.ts` y ANOTAR el rojo esperado en la prueba 11f/05g
  (`apps/desk/server/reconciliacion/registro.test.ts:220` en `0e2b609b`: F1C-05 ya no está «en curso»). Si no se pone roja,
  parar: la prueba no distingue.
- [x] 3.4 Corregir en sitio, sin mover líneas y conservando el CRLF (con `perl`, no con `sed`):
  `apps/desk/server/reconciliacion/registro.test.ts:218` en `0e2b609b` (de SIETE a SEIS, con F1C-05 entre las cerradas por
  archivo del título) y `apps/desk/server/reconciliacion/registro.test.ts:220` en `0e2b609b` (la lista sin `'F1C-05'` y
  `toContain('F1C-05')` en «cerradas por archivo»); verde. Molde: `8b3c4bac`.
- [x] 3.5 Correr `npm run reconcile` y comprobar que F1C-05 pasa a «cerradas por archivo», que no entra en «cerradas sin fuente
  declarada en la R01.1» (tiene fila) ni en «marcadas sin verificar» (S-1), y que «en curso» baja de siete a seis; restaurar
  `docs/sdd/RECONCILIACION.md` sin commitearlo.
- [x] 3.6 Barrido de la regla de mutación 4 sobre `apps/desk/server/reconciliacion/registro.test.ts` y pase de abreviadas; las
  citas de este cambio a las líneas de antes de corregir quedan ancladas en `0e2b609b`.
- [x] 3.7 Escribir `archive-report.md` con la línea de R-1 (qué parte de la fila cubrió y qué dejó fuera), los intentos y la
  lista para Supervisión de `proposal.md`.
- [x] 3.8 Cuatro códigos con código 0; `git show --numstat` del commit con sólo este cambio.

## Tareas de personas — fuera del recuento

No son casillas, y **archivar no las da por hechas** (regla del ciclo 1). Las ya hechas no se listan: la asignación de cargos
(P.1 de `permisos-por-cargo`) consta hecha el 10/10 (`openspec/config.yaml:4434` en `0e2b609b`), E-206 está despejada
(`docs/sdd/ENTRADA.md:2032` en `0e2b609b`), las dos ramas están fusionadas (`32e5df3a`, `da916152`) y la línea de
`DECISIONALES_POR_CARGO` que pedía `openspec/changes/archive/2026-10-18-decisionales-por-cargo/archive-report.md:89` ya está en
el fichero de ejemplo de entorno (`.env.example:40-41`).

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Verificar en la aplicación el botón de la Liberación sin factura por cargo, oculto sin cargo, visible con él y siempre para el administrador (P.2 de `permisos-por-cargo`) y las cinco comprobaciones de motivo y fecha de `liberacion-sin-factura-motivo-fecha`; que estén hechas es hipótesis | Comercial, Gerencia o quien opere la aplicación | La lista acumulada de pruebas en la aplicación | `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:110` y `openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/archive-report.md:93` |
| Decidir si los dos campos de cargo se unifican (P.3 de `permisos-por-cargo`, E-092, Anexo D nº 75; S-6) | Gerencia | Sin destino asignado, a propósito | `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:111` y `docs/sdd/ENTRADA.md:1275` en `0e2b609b` |
| Responder E-201 a E-205, los supuestos aplicados de la paridad | Gerencia | Punto abierto con dueño (R-3) | `openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/archive-report.md:94` y `docs/sdd/ENTRADA.md:2002-2025` en `0e2b609b` |
| Pegar en el maestro la corrección 25, sin su última frase, que ya no es cierta | Gerencia | El `.docx` del maestro | `openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/archive-report.md:87` y `docs/sdd/F0-01_Correcciones_para_el_maestro.md:1351` |
| Comprobar, antes de encender, el cargo de permiso del Director Técnico, el Especialista técnico, el Director Comercial y la Coordinadora Comercial | Administrador de la aplicación | Antes de encender | `openspec/changes/archive/2026-10-18-decisionales-por-cargo/archive-report.md:88` |
| Encender `DECISIONALES_POR_CARGO`, no antes del 14/12/2026, y verificarlo en la aplicación | Persona con acceso a producción, por orden de Gerencia | Enero de 2027 (`openspec/config.yaml:5733` en `0e2b609b`) | `openspec/changes/archive/2026-10-18-decisionales-por-cargo/archive-report.md:90` y `openspec/changes/archive/2026-10-18-decisionales-por-cargo/archive-report.md:93` |
| Actualizar M1.9 del maestro al encender | Supervisión → Gerencia | El expediente siguiente | `openspec/changes/archive/2026-10-18-decisionales-por-cargo/archive-report.md:91` |
| Decidir en qué lista entran los S-1 a S-6 de `decisionales-por-cargo` | Supervisión | La lista semanal (E-237) | `docs/sdd/Supuestos_semana_2026-11-02.md:219` |
| Revisar S-1 a S-6 de este cambio en la lista semanal de supuestos (E-237) | Gerencia | La lista semanal | `proposal.md`, «Supuestos reversibles» |
