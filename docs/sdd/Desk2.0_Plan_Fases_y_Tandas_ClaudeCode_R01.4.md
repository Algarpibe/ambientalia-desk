# Desk 2.0 — Plan de fases y tandas · revisión R01.4

**Fecha:** 2026-10-01 · **Base:** R01.3 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md`, 227 líneas), R01.2 (250 líneas, borrador) y R01.1 (628 líneas). **Ninguna se borra ni se modifica**: las tres siguen siendo el lugar de las citas `plan:NNN` existentes, y regenerarlas desplazaría medio repositorio (regla de mutación 4 de `CLAUDE.md`).

**Estado de esta revisión: VIGENTE, ESCENARIO A, con la decisión del plan A aplazada al lunes 09/11/2026** (Gerencia, 01/10, `decision/escenario-a-festivos-plan-a-01-10`; §K). La primera redacción dejaba el veredicto pendiente de la averiguación de la hoja de Google; Gerencia eligió el escenario A sin esperarla.

**Qué corrige respecto de la R01.3.**

1. Escribe, por primera vez en un §5, **todas** las filas del plan en una sola tabla (§C), incluidas las once decididas y nunca escritas: F1B-12, F1B-13, F1B-14, F0-06, F1F-05, 1G-01 a 1G-04, 1H-00 a 1H-03 y «Mapa del blueprint en la aplicación».
2. Reparte las piezas anotadas el 30/09 y el 01/10 sin fila, con el criterio de `decision/trabajo-del-01-10-antes-del-corte-sin-fila` y `decision/trabajo-del-30-09-sin-fila` (§D), y da fila a los cambios sobre lo construido (§E). Abre **doce filas nuevas** (§I).
3. Rehace la cuenta del margen con el método de la R01.3 §D, con lo cerrado desde el 24/09 y con el trabajo nuevo (§F).
4. Publica el avance con la regla de `decision/avance-cuenta-lo-planificado`, precisada por `decision/orden-ejecucion-encargo-01-10`: dos cifras, por archivo y por commit declarado, nunca sumadas (§G).

**Veredicto, por delante — corregido el 01/10 con los festivos descontados (§K).** Disponible: **8,9 semanas** (68 días, del 02/10 al examen del miércoles 09/12, menos los cuatro festivos que no se trabajan). Escenario A, sin reserva, con F1C-11 reducida a la derivación: necesario **7,8 a 8,1 semanas**, margen **+0,8 a +1,1**. **El extremo bajo queda por debajo de la semana exigida**; Gerencia no activa el plan A ahora y lo decide el **09/11** con el ritmo real (§K). «En garantía» queda fuera de la reserva.

*La tabla siguiente es la primera redacción, sin festivos, y se conserva porque la corrección la cita:*

| Escenario | Necesario | Margen | ¿Cumple la semana que exige Gerencia? |
|---|---|---|---|
| **A** · las dos filas condicionadas **fuera** (pasan a 2027) | 7,8 a 8,4 semanas | **+1,3 a +1,9** | **Sí.** Entra la primera fila de la reserva («En garantía»): margen **+1,1 a +1,7**. La segunda (SKU) no cabe |
| **B** · las dos filas condicionadas **dentro** | 9,2 a 9,8 semanas | **−0,1 a +0,5** | **No.** Se para y decide Gerencia (`decision/trabajo-del-01-10-antes-del-corte-sin-fila`, consecuencia 6): **plan A** (corte único el lunes 01/02/2027, `decision/fecha-corte` → `corregida_por`). La reserva no entra |

⚠️ **Y una advertencia que el método no recoge:** entre el 02/10 y el 09/12 caen **cuatro festivos de Colombia** (12/10, 02/11, 16/11 y 08/12). Si no se trabajan, restan **0,8 semanas** a los dos escenarios, y el A, con «En garantía» dentro, queda en **+0,3 a +0,9** — también por debajo de una semana. La R01.3 tampoco los descontaba, y en su ventana caían los mismos cuatro (§F.6, punto 1).

---

## A · Criterio y partición

**Criterio** (`decision/trabajo-del-01-10-antes-del-corte-sin-fila`, respuesta textual): antes del corte del 14/12 sólo entra lo que hace falta para no perder nada de lo que hoy da Zoho (**paridad**), y cada pieza que entra lleva **fila propia con talla**. Lo que no es paridad se declara para después del corte o 2027, **por escrito**, con su fila en su fase. No se reparten piezas en filas existentes sin medirlas.

**Partición, sin cambios respecto de la R01.3 §C.2** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:69-79`), más una ventana nueva para las filas de las Fases 2 a 4:

| Ventana | Qué entra | Examen / hito |
|---|---|---|
| **Antes del 14/12** (corte operativo) | F0 (salvo F0-06) · 1A (salvo el mapa) · 1B · 1F · la 1C de paridad (F1C-05, parte) · las correcciones del blueprint decididas antes del corte (§E) | Examen del miércoles 09/12 con **dos** condiciones: crear y mover tickets en Desk 2.0, y pruebas con servicios reales superadas (`decision/fecha-corte` → `aclarada_por`) |
| **Enero de 2027** (independencia total) | 1G · 1H | Histórico verificado y correo propio; baja de las licencias (`decision/corte-licencias-plan-a`) |
| **Después del corte, sin fecha** | F0-06 · mapa en la aplicación · las otras siete de 1C · 1D · 1E · la reserva que no quepa | — |
| **2027, en su fase** | Encuesta en tableta · indicador de cumplimiento global · disponibilidad por persona · equipos propios con preparación 17025 | Fase 2 (2027 T1) y Fase 4 (2027 S2) de la R01.1 §3 |

---

## B · Estado de cierre, medido el 01/10

Medido sobre las cabeceras R-1 de `openspec/changes/**/proposal.md` el 01/10:

| Cifra | Filas | Respaldo |
|---|---|---|
| **Cerradas por archivo** (construidas, verify PASS, archivadas, `cierra: si`) | **10** — F0-05, F1A-03, F1A-06, F1A-07, F1A-08, F1B-02, F1B-06, F1B-10, F1B-12, F1B-14 | `openspec/changes/archive/` · `decision/avance-cuenta-lo-planificado` |
| **Cerradas por commit declarado** (terminadas antes de la convención de archivo) | **9** — F0-01, F0-02, F0-03 · F0-00, F1A-01, F1A-02, F1A-04, F1A-05, F1B-01 | F0-01..03: `decision/orden-ejecucion-encargo-01-10`, punto (a). Las otras seis, nombradas a mano en el parte del 01/10 (Parte_2026-10-01.md, §3, comprobación 2; fichero sin trackear, por eso no se cita por línea) y antes en la R01.1 §3.7 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:246`) |
| **En curso** (cambios archivados con `cierra: no`, o fuera de `archive/`) | **6** — F0-04, F1B-04, F1B-07, F1B-08, F1B-11, F1C-05 | Fuera del numerador |

Las dos poblaciones de cerradas son **disjuntas** (19 filas distintas), y se publican por separado, como pide `docs/sdd/RECONCILIACION.md` («dos cifras, nunca una suma»). La lista `cierres_declarados_por_commit` **todavía no existe** en `openspec/config.yaml`: la crea el cambio pequeño del barrido (§H).

Desde la R01.3 (24/09), que contaba 9 cerradas, se han cerrado **cuatro filas por archivo**: F1B-12 (archivada el 24/09), F1B-14 (25/09), F1B-06 (29/09) y F1A-03 (01/10).

---

## C · §5 consolidado de la R01.4

Una fila por tanda: la fila `F1C-01…08` de la R01.1 se despliega en ocho. Tallas: XS < medio día · S un día · M dos o tres días · L cuatro o cinco días (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:529`). Las tallas de filas nuevas son **hipótesis** de esta revisión. Un «+» en la talla marca una ampliación medida dentro de una fila que sigue abierta (§D, §E).

| ID | Contenido | Talla | Ventana | Estado | Decisión que la respalda |
|---|---|---|---|---|---|
| F0-00 | Auditoría del as-built (seis frentes, baseline a Engram) | M | antes del 14/12 | cerrada por commit declarado | plan R01.1 §5 |
| F0-01 | Init SDD, config, `CLAUDE.md` y export .md del maestro | S | antes del 14/12 | cerrada por commit declarado | `decision/orden-ejecucion-encargo-01-10` (a) |
| F0-02 | Specs as-built | L | antes del 14/12 | cerrada por commit declarado | `decision/orden-ejecucion-encargo-01-10` (a) |
| F0-03 | Proyecto Engram y carga de decisiones | S | antes del 14/12 | cerrada por commit declarado | `decision/orden-ejecucion-encargo-01-10` (a) |
| F0-04 | Pruebas del motor y CI (staging retirado) | M | antes del 14/12 | en curso | `decision/e013b-copia-pruebas` (retira el staging) |
| F0-05 | Mecanismo de reconciliación y bandeja de entrada | S | antes del 14/12 | cerrada por archivo | `decision/tanda-por-contenido` |
| F0-06 | Vigilancias del repaso automático (commits sin ficha; decisiones sin llegar al maestro) | S | después del corte | pendiente | `decision/barrido-comprobaciones-nuevas` · `decision/fecha-corte` → `corregida_por` |
| F1A-01 | C1 guarda del checkbox | XS | antes del 14/12 | cerrada por commit declarado | plan R01.1 §5 |
| F1A-02 | C11 SLA de Notificado y escalado | S | antes del 14/12 | cerrada por commit declarado | plan R01.1 §5 |
| F1A-03 | C12 salidas de Verificación, guarda por compuesto y gas patrón, certificado de fábrica | S | antes del 14/12 | cerrada por archivo | `decision/p38-verificacion-calidad` · `decision/f1a03-familia-y-gas-patron` · `decision/f1a03-certificado-liberacion` |
| F1A-04 | C9 bodegajes contra Ingreso a Servicio y campo | S | antes del 14/12 | cerrada por commit declarado | plan R01.1 §5 |
| F1A-05 | audit-F1A | S | antes del 14/12 | cerrada por commit declarado | plan R01.1 §5 |
| F1A-06 | Generador del mapa del blueprint | por dimensionar (R01.1) | antes del 14/12 | cerrada por archivo | plan R01.1 §5 |
| F1A-07 | IV-2 · fechas derivadas impuestas por el servidor | S | antes del 14/12 | cerrada por archivo | `decision/iv2-fechas-derivadas` |
| F1A-08 | IV-4 · tercera puerta OV ↔ ticket | S | antes del 14/12 | cerrada por archivo | `decision/tanda-por-contenido` |
| F1A-09 | Barrido de citas tras la R08.2 | S | antes del 14/12 | pendiente (§J, nota 3) | plan R01.1 §5 |
| **F1A-10** | **Mapa del blueprint en la aplicación** (SVG o dibujante bajo demanda, desde el generador de F1A-06) | XS–S por medir | después del corte | pendiente | `decision/mapa-en-la-app` · `decision/mapa-antes-o-despues-del-corte` |
| F1B-01 | Serial único y autocompletado | M | antes del 14/12 | cerrada por commit declarado | plan R01.1 §5 |
| F1B-02 | Hoja de vida, cuatro campos y enlace a Drive | M | antes del 14/12 | cerrada por archivo | `decision/p8-p54-drive` · `decision/e003b-registro-equipos` |
| F1B-03 | Tipo de servicio y ticket sin OV, guarda de remisión vigente, OVI de garantía · **+ supresión de los prefijos en tickets nuevos** (E-094) | L + XS | antes del 14/12 | en curso | `decision/ovi-garantia-autor` · prefijos: E-094 y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1170` |
| F1B-04 | Recepción unificada: rotulación y desplegables · **+ foto obligatoria en la remisión de entrada** (E-123, mitad de entrada) · **+ accesorios desde el catálogo de artículos** (E-100) | L (resta M) + S + S | antes del 14/12 | en curso | `decision/f1b04-rotulacion` · `decision/f1b04-desplegables` · `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4130-4135` |
| F1B-05 | Roles, traspaso, checkbox comercial, trazas | M | antes del 14/12 | en curso | plan R01.1 §5 |
| F1B-06 | Blueprints de equipo nuevo y soporte remoto (dos ramas) | L | antes del 14/12 | cerrada por archivo | `decision/flujos-comercial-posible-cliente` |
| F1B-07 | Prioridad y «Mis tickets» · **+ propagar el Top 5 a los tickets abiertos** · **+ lista de «Remisión creada» para Comercial** | S + S + S | antes del 14/12 | en curso | `decision/top5-manual` · `decision/e099-orden-cola-taller` · `decision/cola-del-taller-los-tres-cabos` |
| F1B-08 | Paridad de vistas con Zoho y tablero · **+ búsqueda por número de ticket y serial** | L (resta S–M) + S | antes del 14/12 | en curso | `decision/escalado-remision-creada` · `decision/p44-escritura-zoho` · `decision/anexo-3-alerta` · `decision/trabajo-del-01-10-antes-del-corte-sin-fila` (1) |
| F1B-09 | audit-F1B | S | antes del 14/12 | en curso | plan R01.1 §5 |
| F1B-10 | Orden único de precedencia entre guardas | M | antes del 14/12 | cerrada por archivo | plan R01.1 §5 |
| F1B-11 | OV ↔ ticket 1 : N, subOV de lote, registro de contrato, parche IV-11 | L (resta S) | antes del 14/12 | en curso | `decision/anexo-53-contratos` · `decision/e005b-parche-vehiculo` |
| **F1B-12** | **Calendario laboral** (jornada, festivos, día hábil) | S | antes del 14/12 | cerrada por archivo | `decision/calendario-habil` |
| **F1B-13** | **Ficha de garantía con el proveedor** (reclamación al fabricante vinculada a ticket y OVI) | S | antes del 14/12 | pendiente | `decision/anexo-7-garantia-proveedor` |
| **F1B-14** | **Alta y edición del equipo** | S–M | antes del 14/12 | cerrada por archivo | `decision/equipo-nuevo-alta-en-ticket` · `decision/edicion-datos-comerciales-equipo` |
| **F1B-15** | **Alta manual de equipo y cliente desconocidos** (§D) | M | antes del 14/12 | cerrada por archivo (`c557273`) | `decision/orden-ejecucion-encargo-01-10` (b) |
| **F1B-16** | **Remisiones sin ticket** (§D) | L | antes del 14/12 si se confirma; si no, 2027 | condicionada | `decision/trabajo-del-30-09-sin-fila` (1) |
| **F1B-17** | **Remisión de salida en la entrega, con su guarda y sus fotos** (§D) | M | antes del 14/12 si se confirma; si no, 2027 | condicionada | `decision/trabajo-del-01-10-antes-del-corte-sin-fila` (3) |
| **F1B-18** | **Aviso «En garantía»** calculado, y «Garantía sin dato» | S | reserva 1 — **fuera hasta que el margen real lo permita** (§K) | reserva | `decision/trabajo-del-30-09-sin-fila` (2) |
| F1C-01 | C2 estado `Anulado` con motivo | S–M | después del corte | pendiente | `decision/c2-anulado` |
| F1C-02 | C4 facturar ↔ entregar en dos ramas, y alarma de la fecha prevista de facturación (E-102) | S–M | después del corte | pendiente | `decision/c4-dos-ramas` · `decision/anexo-33-checkbox` |
| F1C-03 | C3 salidas de las esperas, ejecutadas por la persona a cargo (§D) | S–M | después del corte | pendiente | `decision/c3-salida-esperas` · `decision/salida-emergencia-quien-la-ejecuta` |
| F1C-04 | C5 tipo de evento en cada transición | S–M | después del corte | pendiente | `decision/c5-tipo-evento` |
| F1C-05 | C10 permisos por cargo. **Antes del corte, la parte de paridad:** motivo de lista cerrada y fecha prevista en «Liberación sin factura» (E-102). Después: Decisionales y propietario del registro | S–M (resta antes del corte: S) | antes del 14/12 la paridad · el resto después | en curso | `decision/c10-permisos-cargo` · `decision/anexo-33-checkbox` · `decision/fecha-corte` → `corregida_por` |
| F1C-06 | C7 + C9 esperas que paran el reloj del SLA | S–M | después del corte | pendiente | `decision/c7-reloj-sla` |
| F1C-07 | C6 Control de calidad antes de liberar | S–M | después del corte | pendiente | `decision/c6-qa-liberacion` |
| F1C-08 | Rutas abreviadas | S–M | después del corte | pendiente | `decision/p15-p59-rutas` |
| **F1C-09** | **Tres transiciones y la cifra anclada** (§E) | M | antes del 14/12 | cerrada por archivo (`c0d16f6`) | `decision/tres-transiciones-y-la-cifra-anclada` |
| **F1C-10** | **«Rechazo» desde Notificación cliente sólo para Comercial** (§E) | XS | antes del 14/12 | cerrada por archivo (`b16cbb4`) | E-114 · `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1616` |
| **F1C-11** | **Derivación de «Solicitud repuestos» al Director Técnico**; el respaldo al «Especialista técnico» espera al registro de ausencias (1E) y, mientras, reasigna a mano un administrador (§K) | S | antes del 14/12 | cerrada por archivo (`920b304`) | `decision/cargo-encargado-de-inventario` |
| **F1C-12** | **Registro del SKU por Comercial/Compras con aviso al técnico** | S | reserva 2 — no cabe en ningún escenario (§F.4): después del corte | reserva | `decision/trabajo-del-30-09-sin-fila` (2) |
| F1D-01 | Modelo de datos del catálogo | M | después del corte | pendiente | plan R01.1 §5 |
| F1D-02 | Importador desde Excel | M | después del corte | pendiente | plan R01.1 §5 |
| F1D-03 | Macro-fases como transiciones | M | después del corte | pendiente | `decision/p45-macro-fases` |
| F1D-04 | Captura por visita y validación por macro | L | después del corte | pendiente | plan R01.1 §5 |
| F1D-05 | Encadenamiento No OK | M | después del corte | pendiente | plan R01.1 §5 |
| F1D-06 | Criterio de falla y repuestos por etapa | M | después del corte | pendiente | plan R01.1 §5 |
| F1D-07 | Formulario de falla nueva | S | después del corte | pendiente | `decision/falla-nueva-bloqueante` |
| F1D-08 | Segundo equipo (Horiba) | S | después del corte | pendiente | plan R01.1 §5 |
| F1D-09 | audit-F1D | S | después del corte | pendiente | plan R01.1 §5 |
| F1E-01 | Modelo del informe | M | después del corte | pendiente | `decision/p14-remisiones-entrada` |
| F1E-02 | Informe de diagnóstico | M | después del corte | pendiente | plan R01.1 §5 |
| F1E-03 | Informe de salida con motivos tipificados | M | después del corte | pendiente | plan R01.1 §5 |
| F1E-04 | Validación y firma (tres firmas) | M | después del corte | pendiente | `decision/roles-validacion-informe` |
| F1E-05 | Flujo del informe en el maestro | doc | después del corte | pendiente | plan R01.1 §5 |
| F1F-01 | Migración de tickets abiertos y fecha de corte | M | antes del 14/12 | en curso | `decision/fecha-corte` · `decision/p14b-hoja-google` |
| F1F-02 | Respaldo y continuidad | M | antes del 14/12 | en curso | `decision/p55-backup` · `decision/p55b-destino-copia` |
| F1F-03 | Aceptación con servicios reales | sin talla (R01.1) | antes del 14/12 | pendiente | `decision/fecha-corte` |
| F1F-04 | Formación, Zoho a solo lectura, audit-F1 | sin talla (R01.1) | antes del 14/12 | pendiente | `decision/fecha-corte` |
| **F1F-05** | **Continuidad de los nueve indicadores de Zoho**, midiendo en paralelo desde el 16/11 | S–M | antes del 14/12 | en curso | `decision/e009-kpis` · `decision/e009b-lista-indicadores` · `decision/encuesta-entre-corte-e-independencia` |
| **1G-01** | **Backfill completo de conversaciones** | M | enero de 2027 | pendiente | `decision/fecha-corte` → `aclarada_por` |
| **1G-02** | **Persistencia de adjuntos** (gate M1) | M | enero de 2027 | pendiente | `decision/fecha-corte` → `aclarada_por` |
| **1G-03** | **Verificación de completitud** | M | enero de 2027 | pendiente | `decision/fecha-corte` → `aclarada_por` |
| **1G-04** | **Modo sin Zoho** | S | enero de 2027 | pendiente | `decision/fecha-corte` → `aclarada_por` |
| **1H-00** | **Decisiones de transporte del correo** (gate M2) | S | enero de 2027 | pendiente | `decision/fecha-corte` → `aclarada_por` |
| **1H-01** | **Salida: responder al cliente desde el ticket** (y encuesta automática) | L | enero de 2027 | pendiente | `decision/fecha-corte` → `aclarada_por` · `decision/encuesta-entre-corte-e-independencia` |
| **1H-02** | **Entrada: correo → ticket** | L (M si M2 es favorable) | enero de 2027 | pendiente | `decision/fecha-corte` → `aclarada_por` |
| **1H-03** | **Corte del buzón** | M | enero de 2027 | pendiente | `decision/fecha-corte` → `aclarada_por` |
| **F2-01** | **Encuesta de satisfacción en tableta en la entrega**, con el canal de cada calificación | M | 2027 · Fase 2 | pendiente | `decision/trabajo-del-30-09-sin-fila` (3) |
| **F2-02** | **Indicador de cumplimiento global ante el cliente** (tiempo promesa global) | L | 2027 · Fase 2 | pendiente | `decision/trabajo-del-30-09-sin-fila` (3) |
| **F2-03** | **Hojas de vida de los equipos propios y preparación 17025**, administradas por el cargo Especialista técnico | L | 2027 · Fase 2 | pendiente | `decision/trabajo-del-01-10-antes-del-corte-sin-fila` (4) · `decision/cargo-encargado-de-inventario` |
| **F4-01** | **Disponibilidad por persona** (vacaciones y ausencias) sobre el calendario laboral | S–M | 2027 · Fase 4 | pendiente | `decision/trabajo-del-30-09-sin-fila` (3) |

**78 filas, 78 tandas.** Reparto: F0 7 · F1A 10 · F1B 18 · F1C 12 · F1D 9 · F1E 5 · F1F 5 · 1G 4 · 1H 4 · Fases 2–4: 4. En negrita, las que se escriben por primera vez en un §5.

**Supuestos de nomenclatura, todos reversibles** (modo producción, `CLAUDE.md`, «Regla de ejecución»): los IDs F1A-10, F1B-15 a F1B-18, F1C-09 a F1C-12, F2-01 a F2-03 y F4-01 son los siguientes libres de su épica o fase; F1B-15 lo fija Gerencia. **F1B-13** conserva el ID que le propuso la R01.2 §A (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:25`), y F1B-12 y F1B-14 los de la R01.3 §G. El mapa va en 1A porque reutiliza el generador de F1A-06. Las correcciones del blueprint van en 1C porque son «correcciones que cambian el proceso», aunque su ventana sea anterior al corte. Las filas de 2027 usan el prefijo de su fase de la R01.1 §3, que hasta hoy no tenía IDs en este documento.

---

## D · Reparto de las piezas sin fila

| Pieza (entrada) | Destino | Ventana | Respaldo |
|---|---|---|---|
| Búsqueda por número de ticket y serial en el listado (E-133) | **Dentro de F1B-08**, como **ampliación de su contenido**, medida: talla **S**. Hoy no existe: el listado no tiene caja de búsqueda y el endpoint sólo acepta `scope` y `page` (`apps/desk/server/routes/tickets.ts:105-114`) | antes del 14/12 | `decision/trabajo-del-01-10-antes-del-corte-sin-fila` (1) |
| Alta manual de equipo y cliente desconocidos (E-129) | **F1B-15**, fila nueva. **F1B-14 sigue cerrada** y no se reabre | antes del 14/12 | `decision/orden-ejecucion-encargo-01-10` (b) |
| Remisiones sin ticket (E-104) | **F1B-16**, fila propia **condicionada** a confirmar que hoy se hacen en la hoja de Google de remisiones | antes del 14/12 si se confirma; si no, 2027 | `decision/trabajo-del-30-09-sin-fila` (1) |
| Remisión de salida en la entrega (E-120), con su guarda (E-122) y sus fotos (E-123, mitad de salida) | **F1B-17**, fila propia **condicionada** a confirmar que hoy las remisiones de salida se hacen en la hoja de Google o en Zoho | antes del 14/12 si se confirma; si no, 2027 | `decision/trabajo-del-01-10-antes-del-corte-sin-fila` (3) |
| Aviso «En garantía» (E-105) | **F1B-18**, reserva 1 | §F.4 | `decision/trabajo-del-30-09-sin-fila` (2) |
| Registro del SKU con aviso al técnico (E-107, reiterada por E-113) | **F1C-12**, reserva 2 | §F.4 | `decision/trabajo-del-30-09-sin-fila` (2) |
| Encuesta en tableta (E-096) | **F2-01** | 2027 · Fase 2 | `decision/trabajo-del-30-09-sin-fila` (3) |
| Indicador de cumplimiento global (E-095) | **F2-02** | 2027 · Fase 2 | `decision/trabajo-del-30-09-sin-fila` (3) |
| Disponibilidad por persona (E-098) | **F4-01** (con M6, parámetro de carga, R01.1 §3 Fase 4) | 2027 · Fase 4 | `decision/trabajo-del-30-09-sin-fila` (3) |
| Equipos propios y preparación 17025 (E-127) | **F2-03**, una sola fila, con el cargo Especialista técnico | 2027 · Fase 2 | `decision/trabajo-del-01-10-antes-del-corte-sin-fila` (4) |
| Salida de emergencia por la persona a cargo (E-101) | **Dentro de F1C-03**; F1C-05 no se reabre | después del corte | `decision/salida-emergencia-quien-la-ejecuta` |

**Las dos condicionadas dependen de una sola averiguación de persona**: quién rellena hoy la hoja de Google de remisiones y para qué. `decision/p14b-hoja-google` le puso plazo **antes del 31/10**; `decision/trabajo-del-30-09-sin-fila`, consecuencia (1), lo **adelantó a esta semana (antes del 04/10)**, porque decide estas dos filas (§J, contradicción 1). **Hasta que se haga, la R01.4 no tiene un veredicto único** (§F.4).

---

## E · Cambios sobre lo construido, como tandas con su fila

| ID | Cambio | Talla (hipótesis) | Ventana | Decisión | Lo que hay que saber antes de construir |
|---|---|---|---|---|---|
| **F1C-09** | Se quitan «Marcar como pendiente» (`packages/shared/src/transitions.ts:206` en `fd253aa`) y las dos «Servicio externo» hacia Por Facturar (`packages/shared/src/transitions.ts:230` en `fd253aa` y `packages/shared/src/transitions.ts:232` en `fd253aa`); «Diagnóstico complementario» pasa a salir de En Proceso (hoy sale de Pendiente, `packages/shared/src/transitions.ts:244` en `fd253aa`); mapa regenerado; `cifras_ancladas` pasa de **34 a 31** transiciones (`openspec/config.yaml:1367-1368`) y de **38 a 35** pasos (`openspec/config.yaml:1360-1361`); los tickets de servicio técnico en «Pendiente» pasan a En Proceso sin reescribir el historial. **Todo en una sola entrega** | M | antes del 14/12 | `decision/tres-transiciones-y-la-cifra-anclada` | La R08.4 ya dice 31 y 35 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:6454`): hasta que se construya, el maestro vigente y la cifra vigilada no coinciden. **Toca datos de producción** —la migración la ejecuta quien construye el cambio, por la propia decisión—. `transitions.ts` es fichero muy citado: barrido de la regla de mutación 4 al cerrar |
| **F1B-07** (ampliación) | (1) y (2) confirman lo construido: **sin trabajo**. (3) Al marcar un cliente Top 5, sus tickets abiertos toman la prioridad con traza por ticket; al desmarcarlo vuelven a la calculada; los ajustes manuales con motivo no se tocan. (4) Lista de «Remisión creada» para Comercial, ordenada por el tiempo en ese estado | S + S | antes del 14/12 | `decision/cola-del-taller-los-tres-cabos` | (3) invierte lo que fijan hoy las pruebas TC24-14 y TC24-15 (E-109). F1B-07 sigue abierta además por la pregunta 3.b (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:87`) |
| **F1C-11** | «Solicitud repuestos» (`packages/shared/src/transitions.ts:200`) deriva el ticket al cargo **Director Técnico**, que ejecuta «Entrega de Repuestos» (`packages/shared/src/transitions.ts:204`) y lo devuelve al técnico. Respaldo durante su **ausencia registrada**: el cargo nuevo **«Especialista técnico»** (8º cargo; hoy lo ocupa Johny Luna) | S–M | antes del 14/12 | `decision/cargo-encargado-de-inventario` | ⚠️ **Dos dependencias.** (a) El cargo no existe: la lista cerrada tiene siete (`packages/shared/src/cargos.ts:12-15`). La decisión dice que su alta «no tiene fila»; esta revisión lo mete en F1C-11 (supuesto reversible), porque el respaldo va al cargo y no al nombre. (b) **El registro de ausencias no existe en código**: `grep -rli ausencia packages apps` da trece ficheros y ninguno es un registro —todo son comentarios y pruebas ajenas (`packages/shared/src/bodegaje.ts:160`, `apps/desk/server/reconciliacion/comprobaciones.ts:257` en `840a353`, entre otros)—. Es la entidad que fijó `decision/roles-validacion-informe` para F1E-04, después del corte. **Supuesto de talla:** S–M incluye un registro mínimo de ausencias (persona, inicio, fin) que F1E-04 y F4-01 reutilizarían; si Gerencia prefiere no adelantarlo, F1C-11 baja a S y el respaldo espera a ese registro |
| **F1B-04** (ampliación) | **Foto obligatoria en la remisión de entrada**: al menos una del equipo, una de los accesorios y una del embalaje, haya o no novedad; la de novedad se añade como hasta ahora | S | antes del 14/12 | E-123 (mitad de entrada) · `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4133` | Invierte para la entrada la regla que construyó y archivó `foto-solo-con-novedad` (F1B-04, `cierra: no`); el cambio archivado no se reescribe. Va en F1B-04 y no en fila propia porque F1B-04 está abierta y su contenido literal es esa regla (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159`): supuesto reversible |
| **F1B-03** (ampliación) | **Prefijos suprimidos en los tickets nuevos** (MT, CG, HV, SR, PRO); los existentes conservan el suyo. Hoy el alta los pide (`apps/desk/src/components/CreateTicket.tsx:46` y el selector de `apps/desk/src/components/CreateTicket.tsx:423-424`) | XS | antes del 14/12 | E-094 · `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1170` | ⚠️ **Antes de construir hay que comprobar si Google Drive o alguna automatización (n8n) depende del prefijo** (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1174`). Es medición fuera del repositorio, de persona, y **nadie la ha hecho** (E-094). Va en F1B-03 porque su contenido literal son los prefijos autogenerados |
| **F1C-10** | **«Rechazo» desde Notificación cliente sólo para Comercial.** Hoy es `Comercial / Servicio Técnico` (`packages/shared/src/transitions.ts:236`); no cambian origen, destino ni las otras dos «Rechazo» | XS | antes del 14/12 | E-114 · `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1616` | No mueve cifras ancladas. La decisión dice «se construye junto con las demás correcciones del blueprint»: por R-4 (un cambio, un `tanda:`) se lee como **consecutiva** a F1C-09, no en el mismo cambio (§J, contradicción 5) |

---

## F · La cuenta del margen, con el método de la R01.3 §D

### F.1 · Filas

| | Escenario A (condicionadas fuera) | Escenario B (condicionadas dentro) |
|---|---|---|
| Total R01.3 | 66 | 66 |
| + filas nuevas de la R01.4 (§I) | +12 | +12 |
| **Total R01.4** | **78** | **78** |
| Después del corte, sin fecha (F0-06 · F1A-10 · siete de 1C · 1D 9 · 1E 5) | −23 | −23 |
| Enero de 2027 (1G 4 · 1H 4) | −8 | −8 |
| 2027 en su fase (F2-01..03 · F4-01) | −4 | −4 |
| Reserva que no entra | −1 (F1C-12) | −2 (F1B-18, F1C-12) |
| Condicionadas que pasan a 2027 | −2 | — |
| **Antes del corte** | **40** | **41** |
| Cerradas (10 por archivo + 9 por commit declarado) | −19 | −19 |
| **Pendientes antes del corte** | **21** (6 en curso), al 01/10 · *Recalculado el 2026-10-05 sobre la tabla del §5, con las once filas en curso (F0-04, F1B-03, F1B-04, F1B-05, F1B-07, F1B-08, F1B-09, F1B-11, F1C-05, F1F-01, F1F-05): **17** (11 en curso), porque las cerradas son ya **23** (14 por archivo + 9 por commit), no las 19 de la fila anterior* | **22** (6 en curso), al 01/10 · *2026-10-05: **18** (11 en curso)* |

### F.2 · Tiempo disponible, medido

Del **viernes 02/10/2026** al examen del **miércoles 09/12/2026**: **68 días = 9,7 semanas**, contando como la R01.3 (diferencia de fechas entre siete). En días laborables son **48** de lunes a viernes antes del examen, y **44 hábiles** descontando los cuatro festivos que calcula el propio calendario de F1B-12 (`packages/shared/src/calendarioLaboral.ts:108` y `packages/shared/src/calendarioLaboral.ts:196`, ejecutado el 01/10): 12/10, 02/11, 16/11 y 08/12. **La cuenta usa 9,7**, para ser comparable con la R01.3; los festivos van en §F.6.

### F.3 · Trabajo pendiente antes del corte, ponderado por talla

**Hipótesis declarada, la misma de la R01.3:** las tallas son estimaciones, no medidas. XS ≈ 0,5 d · S ≈ 1 d · M ≈ 2,5 d · L ≈ 4,5 d, 5 días por semana. Para las filas en curso se cuenta **sólo lo que les falta**, según el `archive-report.md` de su último cambio.

| Fila | Lo que falta | Días |
|---|---|---|
| F1B-03 | Fila entera (L) + prefijos (XS) | 5,0 |
| F1B-04 | Rotulación y desplegables (resto, M; hipótesis) + foto de entrada (S) + accesorios del catálogo (S). Lo construido, en `openspec/changes/archive/2026-09-25-foto-solo-con-novedad/archive-report.md:3-9` | 4,5 |
| F1B-05 | Fila entera (M) al 01/10 · *2026-10-05, en curso: falta la visibilidad por área, que espera E-089, y el protocolo de traspaso con motivo (S + XS; hipótesis), `openspec/changes/archive/2026-10-05-traspaso-y-trazas/archive-report.md:5`* | 2,5 → *1,5* |
| F1B-07 | Propagar Top 5 (S) + lista de «Remisión creada» (S). Lo construido, en `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:9-17` | 2,0 |
| F1B-08 | Mitad de paridad de vistas (S–M; hipótesis) + búsqueda (S). Las tres alarmas ya están, `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:16-20` | 2,0 a 3,5 |
| F1B-09 | audit-F1B (S) al 01/10 · *2026-10-05, en curso: falta el repaso al cerrar la épica 1B y extender el mapa generado a los dos flujos nuevos, E-222 (XS + XS; hipótesis), `openspec/changes/archive/2026-10-05-audit-f1b/archive-report.md:5`* | 1,0 → *1,0* |
| F1B-11 | Sólo la ampliación del contrato (S; hipótesis), esperando E-086 (`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:15-23`) | 1,0 |
| F1B-13 | Ficha de garantía (S) | 1,0 |
| F1B-15 | Alta manual (M) | 2,5 |
| **Subtotal 1B** | | **21,5 a 23,0** |
| F1C-05 | Parte de paridad: motivo y fecha prevista (S). El cargo ya está (`openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:17-21`) | 1,0 |
| F1C-09 | Tres transiciones y cifra anclada (M) | 2,5 |
| F1C-10 | «Rechazo» sólo Comercial (XS) | 0,5 |
| F1C-11 | Sólo la derivación al Director Técnico (S): el respaldo espera a 1E (§K) | 1,0 |
| **Subtotal 1C** | | **5,0** (era 5,0 a 6,5 con F1C-11 en S–M) |
| 1F | F1F-01..05, la cifra de bloque de la R01.3 §D.3 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:111`), sin descontar la encuesta automática que salió de la cuenta · *2026-10-05: F1F-01 y F1F-05 están en curso. A F1F-01 sólo le falta construir el interruptor de E-231 (XS; el cotejo y la ejecución son tareas de persona), `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/archive-report.md:5`; a F1F-05, los indicadores 51 y 55, que esperan hito y decisión (de S–M a S), `openspec/changes/archive/2026-10-03-continuidad-indicadores/archive-report.md:10-13`. Se descuentan 2,0 por F1F-01 y 0,5 a 1,0 por F1F-05 (hipótesis: el bloque de la R01.3 no desglosa por fila)* | 12,5 → *9,5 a 10,0* |
| F0-04 · F1A-09 | Nada que construir (§J, notas 2 y 3) | 0 |
| **Total, escenario A sin reserva** | | **39,0 a 40,5 d = 7,8 a 8,1 semanas** (era 39,0 a 42,0 = 7,8 a 8,4) |
| F1B-16 Remisiones sin ticket (L) + F1B-17 Remisión de salida (M) | | +7,0 |
| **Total, escenario B** (no rige: Gerencia eligió el A) | | **46,0 a 47,5 d = 9,2 a 9,5 semanas** (era 46,0 a 49,0) |

### F.4 · El veredicto, con el número delante

> **Primera redacción, sin festivos y con F1C-11 en S–M.** Se conserva porque la corrección del 01/10 la cita; **la cuenta vigente está en §K.2**.

```
Disponible:   9,7 semanas (68 días, 02/10 → examen del miércoles 09/12)
Margen exigido por Gerencia: más de 1 semana

ESCENARIO A — condicionadas FUERA (pasan a 2027)
  Necesario:          7,8 a 8,4 semanas
  MARGEN:            +1,3 a +1,9          → se cumple; entra la reserva en su orden
  + F1B-18 «En garantía» (S, 1 d):
    Necesario:        8,0 a 8,6 semanas
    MARGEN:          +1,1 a +1,7          → ENTRA (deja más de 1 semana en los dos extremos)
  + F1C-12 SKU (S, 1 d):
    Necesario:        8,2 a 8,8 semanas
    MARGEN:          +0,9 a +1,5          → NO ENTRA (el extremo bajo queda por debajo de 1)

ESCENARIO B — condicionadas DENTRO
  Necesario:          9,2 a 9,8 semanas
  MARGEN:            −0,1 a +0,5          → POR DEBAJO DE 1 SEMANA
  → pendiente de decisión de Gerencia: plan A. La lista de reserva NO entra.
```

**Lectura.** Lo que separa los dos escenarios son **7 días de trabajo**: las dos filas condicionadas, una L y una M. Con ellas dentro, el 14/12 no conserva la semana que exige `decision/fecha-corte` → `corregida_por`, y la propia regla de esa corrección activa el plan A salvo que Gerencia decida otra cosa —recortar, mover alguna fila o aceptar menos margen—. **No elijo entre esas salidas**: es decisión de alcance.

**Y lo que puede inclinarlo, a favor:** la averiguación de la hoja de Google puede confirmar sólo una de las dos condicionadas (cada una tiene su condición). Con sólo F1B-17 dentro (M), el necesario sería 8,3 a 8,9 semanas y el margen **+0,8 a +1,4**: el extremo bajo sigue por debajo de una semana. Con sólo F1B-16 dentro (L), **+0,4 a +1,0**. Ningún caso parcial cumple en los dos extremos.

### F.5 · Contraste con el ritmo observado

Filas cerradas por archivo, por la fecha de su carpeta en `openspec/changes/archive/`: **10 entre el 09/09 y el 01/10** (17/09, 20/09, 21/09, 22/09 dos, 23/09, 24/09, 25/09, 29/09 y 01/10). Son 22 días: **3,2 filas por semana**. Desde la R01.3 (24/09) han sido 4 en 7 días. En el mismo periodo se archivaron 28 cambios, 22 de ellos de filas del plan.

Contado por filas, a 3,2 por semana: escenario A, 21 pendientes → **6,6 semanas** (margen +3,1); escenario B, 22 → **6,9 semanas** (margen +2,8). **El conteo por filas da más margen que la ponderación, y es la ponderación la que manda**, por tres razones medibles: dos de las pendientes pesan cero (F0-04, F1A-09) y engordan el divisor del ritmo; las que quedan incluyen las dos L más grandes del corte (F1B-03, F1B-16); y 1F son 12,5 días repartidos en cinco filas que todavía no han empezado. La R01.3 vio lo mismo y concluyó lo mismo (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:129`). *Recalculado el 2026-10-05 con el mismo ritmo de 3,2 y el tiempo que queda del 05/10 al 09/12 (65 días = 9,3 semanas): escenario A, **17** pendientes (11 en curso) → **5,3 semanas** (margen +4,0); escenario B, **18** → **5,6 semanas** (margen +3,7). La conclusión no cambia: manda la ponderación, y los subtotales del §F.3 y el veredicto del §F.4 siguen siendo los del 01/10, sin recalcular aquí.*

### F.6 · Lo que esta cuenta no cubre, y puede comerse el margen

1. **Los cuatro festivos (−0,8 semanas).** Con ellos, el escenario A queda en +0,5 a +1,1 sin reserva y en +0,3 a +0,9 con «En garantía»; el B, en −0,9 a −0,3. Si se cuentan, **«En garantía» es lo primero que sale** y el escenario A también se queda por debajo de la semana. La R01.3 tampoco los descontaba, y en su ventana caían los mismos cuatro.
2. **Remanentes que esperan una respuesta de Gerencia**, y que sin ella no se pueden cerrar aunque haya tiempo: F1B-07 (pregunta 3.b), F1B-08 (pregunta 4, «vistas equivalentes a Zoho», `docs/sdd/Preguntas_Gerencia_2026-09-29.md:93`), F1B-11 (ampliación del contrato, E-086) y F1C-11 (registro de ausencias, §E). Las tallas de esos remanentes son hipótesis.
3. **F1C-05 no puede cerrar antes del corte**: su parte de Decisionales depende de F1C-04, que va después. Cuenta en la población de antes del corte, como en la R01.3, pero el numerador de esa población no llegará al 100 %.
4. **F1F-05 tiene fecha, no sólo talla**: tiene que estar midiendo el **16/11** (S47), las cuatro semanas previas al corte (`decision/e009b-lista-indicadores`, consecuencia 3). Desde el 02/10 son 6,4 semanas. No cambia el volumen; restringe el orden.
5. **Migraciones sobre producción sin copia donde ensayar** (`decision/e013b-copia-pruebas`): los tickets en «Pendiente» de F1C-09; la regla «Entregado → Finalizado» que E-097 añade a F1F-01; y el cotejo uno a uno de la hoja de Google el 14/12, que `decision/p14b-hoja-google` (consecuencia 2) dice que no está en el contenido de F1F-01. Ninguna tiene talla propia.
6. **Tareas de persona que bloquean tandas**: la averiguación de la hoja de Google (antes del 04/10); la comprobación de Drive y n8n sobre los prefijos (antes de F1B-03); la lista de gases patrón del Director Técnico (P.1 de F1A-03, `decision/archivo-f1a03-y-worktrees-01-10`); y M1, M2 y M3, que a 01/10 siguen sin resultado (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4273`).
7. **El cambio pequeño del barrido** (§H) consume tiempo antes de la primera tanda y no es fila (hipótesis: XS, 0,1 semanas).
8. **«Se registran en el ticket»** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:171`): sigue sin medir; si hace falta una fila S, resta 0,2 semanas.
9. **Enero depende de empezar antes.** 1G y 1H suman de 5 a 7 semanas (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:109`). En el escenario B no cabe nada de ellas antes del corte; en el A, lo único que podría adelantarlas es la holgura por encima de la semana exigida (0,1 a 0,7 semanas con «En garantía» dentro). Si nada arranca antes del 14/12, la independencia se va a finales de enero o febrero, con las dos licencias mensuales de `decision/corte-licencias-plan-a` corriendo.
10. **La carga de enero de las encuestas del formulario de Google** sigue sin fila (`decision/encuesta-entre-corte-e-independencia`, consecuencia 2; E-085). No es de antes del corte, pero es trabajo con fecha.

---

## G · Avance con el denominador R01.4

| | Por archivo | Por commit declarado |
|---|---|---|
| **Sobre el proyecto** (78 tandas) | **10/78 = 12,8 %** | **9/78 = 11,5 %** |
| **Sobre lo que entra antes del corte**, escenario A (40) | **10/40 = 25,0 %** | **9/40 = 22,5 %** |
| **Sobre lo que entra antes del corte**, escenario B (41) | **10/41 = 24,4 %** | **9/41 = 22,0 %** |

**En curso, aparte, sin sumar a ninguna cifra:** 6 filas — F0-04, F1B-04, F1B-07, F1B-08, F1B-11 y F1C-05. ⚠️ *Esta cifra es **falsa desde el 04/10**: `fed9532` pasó F1B-03 y F1F-05 a «en curso» en la tabla del §5 sin tocar esta línea, y `0095665` (05/10) añadió F1B-05, F1B-09 y F1F-01 sin tocarla tampoco. Recalculado el 2026-10-05: **11 filas** — F0-04, F1B-03, F1B-04, F1B-05, F1B-07, F1B-08, F1B-09, F1B-11, F1C-05, F1F-01 y F1F-05. Las cifras de cerradas de la tabla de arriba siguen siendo las del 01/10 (hoy son 14 por archivo).*

**El resto de las poblaciones:** enero de 2027, **0/8** · después del corte sin fecha, **0/23** (más la reserva que no entre) · 2027 en su fase, **0/4**.

**El denominador sube de 66 a 78 por alcance nuevo, no por trabajo**: doce filas, todas decididas el 30/09 o el 01/10. Si se quiere comparar con la R01.3 sobre la misma base (Fases 0 y 1 más 1G y 1H, sin las cuatro de 2027), el denominador es 74.

⚠️ **El barrido no verá este denominador.** `npm run reconcile` lee el §5 de la **R01.1** (`apps/desk/server/reconciliacion/comprobaciones.ts:46` en `840a353`) y sólo reconoce IDs de la forma `F0`/`F1x` (`apps/desk/server/reconciliacion/comprobaciones.ts:133` en `840a353`): seguirá imprimiendo 52 tandas. Apuntarlo a la R01.4 exigiría adaptar ese patrón —no reconoce 1G, 1H ni F2/F4— y la columna que toma como «fuente», que en esta tabla es la ventana. Se señala; no es trabajo de esta revisión. **Superado:** lo cierra el cambio `barrido-avance-archivado` (`tanda: fuera-del-plan`): el barrido lee hoy el §C de esta tabla, con 1G, 1H, F2 y F4.

---

## H · Las tres próximas tandas

**Antes de ellas, ya decidido y fuera del §5:** el cambio pequeño del barrido de reconciliación (`decision/orden-ejecucion-encargo-01-10`, punto 4): que la comprobación 2 cuente sólo lo archivado con `cierra: si` más F0-01..03 por commit declarado, y que cree `cierres_declarados_por_commit`. **No es tanda del §5 ni contenido de F0-06**: F0-06 son dos comprobaciones nuevas —commits sin ficha y decisiones sin llegar al maestro— (`decision/barrido-comprobaciones-nuevas`), y este cambio ajusta una que ya existe. Va con `tanda: fuera-del-plan` y su motivo, como dice `decision/avance-cuenta-lo-planificado` («ajuste de la comprobación 2, sin fila»).

**Y en paralelo, de persona:** la averiguación de la hoja de Google (antes del 04/10), que decide qué escenario rige, y la comprobación de Drive y n8n sobre los prefijos, que libera F1B-03.

| Orden | Tanda | Por qué va aquí |
|---|---|---|
| **1** | **F1C-09 · Tres transiciones y la cifra anclada** (M) | **Dependencias:** cambia el catálogo de transiciones sobre el que construyen F1C-10, F1C-11, F1B-03 (que relaja el invariante 3) y el mapeo de estados de la migración F1F-01; hacerla primero evita rehacer pruebas y mapa varias veces. **Riesgo:** toca `packages/shared/src/transitions.ts`, el fichero más citado, y una migración de producción: cuanto antes, menos tickets en «Pendiente» que mover y un solo barrido de citas para todo el bloque. **Coherencia:** desde el 01/10 el maestro vigente dice 31 y 35 y la cifra vigilada dice 34 y 38; cada día que pasa es un día de desvío declarado. **Fecha:** antes del corte, sin gate |
| **2** | **F1C-10 · «Rechazo» sólo para Comercial** (XS) | **Dependencias:** la decisión pide construirla «junto con» las demás correcciones del blueprint; consecutiva a F1C-09 reutiliza su mapa regenerado y su barrido. **Riesgo:** mínimo —cambia un área, no una cifra—, y deja el bloque del blueprint cerrado salvo F1C-11. **Fecha:** antes del corte |
| **3** | **F1B-15 · Alta manual de equipo y cliente desconocidos** (M) | **Paridad:** sin ella la recepción se bloquea con clientes nuevos (E-129), y es la única pieza nueva de antes del corte que no depende de ninguna averiguación. **Riesgo:** añade una guarda a «Habilitar Servicio», la misma transición en la que F1B-03 añadirá la de remisión vigente: hacerla antes fija una de las dos y deja a F1B-03 la prueba de posición entre ambas (regla de mutación 1). **Fecha:** antes del corte; tras ella, F1B-03 (L), que ya tendrá hecha la comprobación de los prefijos |
| **4** | **F1B-03 · Tipo de servicio y ticket sin OV, guarda de remisión vigente, OVI de garantía** (parte L) | **Decisión:** `decision/cuarta-tanda-f1b03-parte-l` (2026-10-03). Se construye la parte L, con `tanda: F1B-03` y `cierra: no`. **Fuera de este cambio:** la supresión de los prefijos (XS, E-094), que va en un segundo cambio de la misma fila cuando esté hecha la comprobación de Drive y n8n (dueño Gerencia). **Riesgo:** añade la guarda de remisión vigente a «Habilitar Servicio», donde F1B-15 ya dejó la suya: prueba de posición entre las dos (regla de mutación 1). **Fecha:** antes del corte |

**Por qué no F1C-11 en tercer lugar**, aunque pertenezca al mismo bloque: dependía de una respuesta —si se construye ya el registro mínimo de ausencias o el respaldo espera— que no estaba dada (§E) al fijar este orden; **§K.4 la dio después: la derivación se construye ya y el respaldo espera a 1E**, y `decision/orden-tres-tandas-03-10` (2026-10-03) la pone la primera de las tres siguientes. **Por qué no F1F-05:** tiene fecha dura el 16/11 y cabe después de estas tres sin comprometerla.

---

## I · Filas nuevas de esta revisión

**Doce filas que suben el denominador** (de 66 a 78):

| ID | Talla | Ventana |
|---|---|---|
| F1B-15 · Alta manual de equipo y cliente desconocidos | M | antes del 14/12 |
| F1B-16 · Remisiones sin ticket | L | antes del 14/12, condicionada; si no, 2027 |
| F1B-17 · Remisión de salida en la entrega, con guarda y fotos | M | antes del 14/12, condicionada; si no, 2027 |
| F1B-18 · Aviso «En garantía» | S | reserva 1: fuera hasta que el margen real lo permita (§K) |
| F1C-09 · Tres transiciones y la cifra anclada | M | antes del 14/12 |
| F1C-10 · «Rechazo» desde Notificación cliente sólo Comercial | XS | antes del 14/12 |
| F1C-11 · Derivación de «Solicitud repuestos» al Director Técnico (respaldo, con 1E) | S | antes del 14/12 |
| F1C-12 · Registro del SKU con aviso al técnico | S | reserva 2: después del corte |
| F2-01 · Encuesta en tableta en la entrega | M | 2027 · Fase 2 |
| F2-02 · Indicador de cumplimiento global ante el cliente | L | 2027 · Fase 2 |
| F2-03 · Equipos propios y preparación 17025 | L | 2027 · Fase 2 |
| F4-01 · Disponibilidad por persona | S–M | 2027 · Fase 4 |

**Once filas ya contadas en la R01.3 que se escriben por primera vez en un §5** (no mueven el denominador): F0-06 (S, después del corte) · F1A-10 «Mapa del blueprint en la aplicación» (XS–S por medir, después del corte; ID nuevo) · F1B-12 (S, cerrada) · F1B-13 «Ficha de garantía con el proveedor» (S, antes del 14/12) · F1B-14 (S–M, cerrada) · F1F-05 (S–M, antes del 14/12) · 1G-01..04 y 1H-00..03 (enero de 2027; se cuentan como ocho, aunque aquí van en una línea).

**Ampliaciones medidas dentro de filas abiertas** (no son filas): F1B-03 + prefijos (XS) · F1B-04 + foto de entrada (S) y accesorios (S) · F1B-07 + Top 5 a abiertos (S) y lista de «Remisión creada» (S) · F1B-08 + búsqueda (S) · F1C-03 + quién ejecuta la salida de emergencia (sin talla aparte: después del corte).

---

## J · Hipótesis y contradicciones entre fuentes, señaladas sin resolver

**Hipótesis de esta revisión** (además de la conversión de tallas de §F.3): todas las tallas de filas nuevas y de ampliaciones; los remanentes de F1B-04 (M), F1B-08 (S–M) y F1B-11 (S); la ubicación del alta del cargo Especialista técnico dentro de F1C-11; y los IDs nuevos (§C).

**Notas de estado:**

1. **Dos cifras, no una.** `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4273` habla de «19 filas cerradas» a 01/10: es la suma de las dos poblaciones de §B. Esta revisión no la publica sumada.
2. **F0-04 está ejecutada y no cuenta en ninguna cifra.** Su proposal declara `cierra: no` y que le falta «constancia de staging» (`openspec/changes/F0-04/proposal.md:16`), y el staging lo retiró Gerencia el 21/09 (`decision/e013b-copia-pruebas`; `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:128`). Es candidata a `cierres_declarados_por_commit`; lo decide quien ajuste el barrido. Pesa 0 días en §F.
3. **F1A-09: dos fuentes no coinciden.** La R01.3 §E la da por «construida y archivada sin cabecera» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:190`), pero la lista de commit declarado de los partes es F0-00, F1A-01, F1A-02, F1A-04, F1A-05 y F1B-01 —con F0-00 y sin F1A-09— (parte del 01/10, Parte_2026-10-01.md, §3, comprobación 2, sin trackear). Esta revisión sigue la lista de los partes: F1A-09 queda «pendiente» con 0 días hasta que alguien la declare o la descarte.

**Contradicciones:**

1. **Plazo de la averiguación de la hoja de Google.** El encargo de esta revisión y `decision/p14b-hoja-google` dicen «antes del 31/10»; `decision/trabajo-del-30-09-sin-fila`, consecuencia (1), lo adelanta a «esta semana (antes del 04/10)». La R08.4 conserva el 31/10 en su calendario (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4227` y siguientes). Esta revisión usa el 04/10, que es la decisión más reciente.
2. **«En garantía» y SKU: antes del corte o reserva.** El maestro vigente dice que las dos «van antes del corte del 14/12» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1628`); `decision/trabajo-del-30-09-sin-fila` las pone en reserva condicionada al margen. Manda la decisión (es la autoridad que `CLAUDE.md` declara), y el maestro queda desfasado en ese punto.
3. **El maestro recomienda otros destinos** para el alta manual y la remisión de salida (F1B-04, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4148-4153`) y una sola fila para todas las correcciones del blueprint (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4159`). Las decisiones del 01/10 dan fila propia a cada pieza; esta revisión sigue las decisiones.
4. **F1B-13 no es paridad.** La ficha de garantía con el proveedor es gestión que hoy está «fuera del sistema» (`decision/anexo-7-garantia-proveedor`), así que el criterio del 01/10 la mandaría después del corte; la propia decisión la sitúa «en Fase 1 junto a la OVI de garantía (F1B-03)», y la R01.3 la contó antes del corte. Se mantiene antes del corte. Si saliera, el margen ganaría 0,2 semanas.
5. **«Junto con» frente a R-4.** E-114 y `decision/cargo-encargado-de-inventario` piden construir «Rechazo» y la derivación «junto con» las correcciones del blueprint; R-4 dice que un cambio lleva un solo `tanda:`. Con filas propias, «junto con» se lee como consecutivas. Si Gerencia prefiere un solo cambio, F1C-09, F1C-10 y F1C-11 se funden en una fila y el denominador baja dos.
6. **El alta del cargo Especialista técnico «no tiene fila»** según su decisión, y esta revisión la mete en F1C-11 (supuesto reversible), porque sin el cargo el respaldo no tiene a quién derivar.
7. **E-100 (accesorios desde el catálogo de artículos)** se cuenta en F1B-04 con talla S porque el maestro vigente lo pone ahí antes del corte (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4130-4132`), pero **no tiene clave `decision/…`**: está triada en la bandeja. Si Gerencia la saca, F1B-04 baja un día.
8. **La discrepancia de la fuente de 1G y 1H sigue abierta**: «tres son L» frente a las dos de sus tablas (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:109`), como ya anotó la R01.3.

---

## K · Decisión de Gerencia sobre esta revisión (01/10/2026) y cuenta vigente

Respuesta registrada en `openspec/config.yaml` → `decisiones_de_gerencia_adenda` → `decision/escenario-a-festivos-plan-a-01-10` (E-149). **Prevalece sobre lo escrito arriba**, que se conserva como primera redacción.

### K.1 · Escenario A, y la hoja de Google como salida si se confirma

**Rige el escenario A**: F1B-16 (remisiones sin ticket) y F1B-17 (remisión de salida) quedan **fuera del corte** hasta la averiguación de la hoja de Google. **Si la averiguación confirma que hoy se hacen en la hoja, la salida NO es construirlas antes del corte**: la hoja de Google **sigue abierta después del 14/12 sólo para remisiones de salida y remisiones sin ticket**, hasta que esas dos filas se construyan en 2027. Es una **excepción acotada** a `decision/p14b-hoja-google`, que fijaba su cierre el día del corte. Las dos filas pasan a ventana **2027**.

⚠️ *Lo que la respuesta no cubría, anotado sin resolver:* si la averiguación encuentra que esas remisiones se hacen hoy **en Zoho** (que queda en sólo lectura el 14/12) y no en la hoja, la excepción no las alcanza.

**Resuelto el mismo día** (`decision/archivo-barrido-y-regla-del-archivo-01-10`, punto 3, E-150): si se hacen hoy en Zoho, **desde el 14/12 se registran en la hoja de Google**, que sigue abierta para esos dos usos hasta que se construyan F1B-16 y F1B-17. La excepción vale, pues, en los dos casos.

### K.2 · Cuenta vigente, con los festivos descontados

Gerencia: los cuatro festivos (**12/10, 02/11, 16/11 y 08/12**) **no se trabajan y se descuentan siempre**. Y F1C-11 queda reducida a la derivación (S), §K.4.

```
Disponible:   9,7 semanas (68 días, 02/10 → examen del 09/12)
              − 0,8 (cuatro festivos)
            = 8,9 semanas
Necesario (escenario A, sin reserva):  39,0 a 40,5 días = 7,8 a 8,1 semanas
MARGEN:      +0,8 a +1,1 semanas
Margen exigido: 1 semana  →  el extremo bajo NO lo cumple
Con F1B-18 «En garantía»:  +0,6 a +0,9  →  no entra
```

**«En garantía» (F1B-18) queda fuera de la reserva hasta que el margen real lo permita.** El SKU (F1C-12), también.

### K.3 · Plan A: decisión aplazada al lunes 09/11/2026

**El plan A no se activa ahora.** El **lunes 09/11/2026** se rehace el margen con el **ritmo real de las tandas cerradas desde el 01/10**. Si ese día no queda **al menos una semana**, se pasa al **corte único del 01/02/2027** (`decision/fecha-corte` → `corregida_por`).

### K.4 · F1C-11: la derivación ya; el respaldo, con el registro de ausencias

La derivación de «Solicitud repuestos» al cargo **Director Técnico** se construye ya. El respaldo al **Especialista técnico** espera al registro de ausencias, que llega con la validación de informes (**1E**). **Mientras tanto, la reasignación la hace a mano un administrador.** Talla S.

### K.5 · Las demás contradicciones de §J

- **«En garantía» y SKU** (§J, contradicción 2): **manda la decisión** (reserva). Anotado para corregir el maestro en la **R08.5** (`docs/sdd/R08.4_Expediente_de_cambios.md`).
- **Barrido** (§G, último párrafo): el cambio pequeño debe **leer el §5 de esta R01.4** y reconocer los ID **1G**, **1H** y **F1A-10**.
- **Las otras nueve** quedan registradas tal cual; Gerencia las revisa en la próxima revisión del maestro.

### K.6 · Orden aprobado

Cambio del barrido (`fuera-del-plan`) → **F1C-09** → **F1C-10** → **F1B-15**. Cada uno en su propio worktree (`CLAUDE.md`, «Regla del ciclo 3»), en modo producción.

### K.7 · Avance con la cuenta vigente

Antes del corte, escenario A, sin reserva: **39** filas (40 − F1B-18). **Por archivo 10/39 = 25,6 %** · **por commit declarado 9/39 = 23,1 %**, publicadas por separado. Sobre el proyecto, sin cambio: 10/78 y 9/78.
