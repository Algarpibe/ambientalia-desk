---
tanda: F1B-04
motivo: ""
capacidad: [reconciliacion]
maestro: ["ítems 4, 10", "decisiones del 03/09", "M1.2"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: cierre de F1B-04 con lo construido

## Intención

Gerencia decidió el 2026-11-02 que el recuento de modelos sin accesorios no retiene F1B-04
(`decision/f1b04-recuento-no-retiene`, `openspec/config.yaml:5598` en `9134c04c`): «la fila queda para cerrar con lo
construido» (`openspec/config.yaml:5608` en `9134c04c`). Su consecuencia (4) dice cómo se asienta el cierre: con un cambio de
cierre propio, `tanda: F1B-04`, `cierra: si`, sin código, como `cierre-f1b08-con-lo-construido` y
`cierre-f0-04-por-dictamen` (`openspec/config.yaml:5616-5618` en `9134c04c`). La condición que ponía, que la terminal terminara
lo que quedaba de 1G-01, se cumple: `relleno-completo-conversaciones` está archivado con `cierra: si` (`75664c92`).

**Es un cambio documental.** No toca código de producción, ni `openspec/specs/`, ni el maestro. Su único efecto medible es
que, archivado, F1B-04 pasa de «en curso» a «cerradas por archivo» en el barrido de `npm run reconcile`.

Todas las citas a `openspec/config.yaml` y a `docs/sdd/ENTRADA.md` van ancladas en `9134c04c`, el commit de partida: los dos
ficheros son de Supervisión y tienen cambios sin commitear (en `openspec/config.yaml`, 61 líneas tras la 5624).

## Qué pide la fila, medido

- **La fila original**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159`: «remisión con datos de cliente y
  equipo, accesorios por lista cerrada (menú visual, ítem 21 queda como mejora), foto sólo con novedad, rotulación y
  almacenamiento […]; sustitución del texto libre por desplegables en las etapas críticas». Su fuente es «ítems 4, 10;
  decisiones del 03/09» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:501`).
- **La fila vigente**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84`: «rotulación y desplegables · + foto
  obligatoria en la remisión de entrada (E-123, mitad de entrada) · + accesorios desde el catálogo de artículos (E-100)», con
  `decision/f1b04-rotulacion` y `decision/f1b04-desplegables` de respaldo.
- **La ampliación de la foto**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:176`: «al menos una del equipo,
  una de los accesorios y una del embalaje, haya o no novedad».
- **El remanente**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:211`, que acaba en «Hipótesis: 0 d de
  construcción conocida».
- **Lo que la fila no lleva**, según la nota 3 del plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:354`):
  el alta manual y la remisión de salida, que el maestro recomendaba para F1B-04, tienen fila propia por las decisiones
  del 01/10.

## Qué cubrió cada cambio archivado (los siete llevan `tanda: F1B-04`, `cierra: no`)

| Cambio | Qué cubrió | Dónde se dice |
|---|---|---|
| `2026-09-25-foto-solo-con-novedad` | Foto sólo con novedad: la remisión no se envía sin fotos si hay novedad | `openspec/changes/archive/2026-09-25-foto-solo-con-novedad/archive-report.md:3-9` |
| `2026-10-03-recepcion-rotulacion-foto-entrada` | La confirmación «Rotulado y guardado», la lista de tipos de novedad que sustituye a la observación libre, y la foto siempre obligatoria en la entrada | `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md:8-12` |
| `2026-10-05-lista-novedades-mantenible` | La pantalla de Configuración con la que el Director Técnico mantiene la lista de novedades, impuesta por el servidor | `openspec/changes/archive/2026-10-05-lista-novedades-mantenible/archive-report.md:5` |
| `2026-10-07-accesorios-lista-por-modelo` | Accesorios de la lista del modelo con nombre oficial y SKU; sin texto libre en el catálogo; lo de fuera de lista, como novedad | `openspec/changes/archive/2026-10-07-accesorios-lista-por-modelo/archive-report.md:6-10` |
| `2026-10-12-aplica-resuelto-hacia-n8n` | La aplicación resuelve «Aplica» y lo manda a n8n | `openspec/changes/archive/2026-10-12-aplica-resuelto-hacia-n8n/archive-report.md:6-9` |
| `2026-10-12-recepcion-exencion-foto-y-casilla` | «Falta un accesorio» exenta de foto (E-165) y la casilla con traza que sustituye la foto de accesorios o de embalaje (E-166) | `openspec/changes/archive/2026-10-12-recepcion-exencion-foto-y-casilla/archive-report.md:6-10` |
| `2026-10-12-rotulado-tras-enviar` | E-167 entera: el rotulado se confirma después de enviar, con traza y sin bloquear, y hay aviso si la etiqueta no se genera | `openspec/changes/archive/2026-10-12-rotulado-tras-enviar/archive-report.md:6-8` |

Este último dejó escrito por qué declaraba `cierra: no` y qué lo cambiaba: si Gerencia respondía que el recuento no retenía
la fila, «F1B-04 queda cerrada por este cambio sin construir nada más»
(`openspec/changes/archive/2026-10-12-rotulado-tras-enviar/archive-report.md:10-13`).

## Contraste pieza a pieza

| Pieza de la fila | Fuente | Quién la cubre | Dónde se dice | Estado |
|---|---|---|---|---|
| Remisión con datos de cliente y equipo | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159` | Construida y probada antes de la fila | `openspec/changes/archive/2026-09-25-foto-solo-con-novedad/archive-report.md:6-7` | Construida |
| Accesorios por lista cerrada | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159` | Construida antes de la fila; la sustituye la pieza de E-100 | `openspec/changes/archive/2026-09-25-foto-solo-con-novedad/archive-report.md:6-7` | Construida y sustituida |
| Foto sólo con novedad | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159` | `foto-solo-con-novedad`; E-123 la invierte para la entrada | `openspec/changes/archive/2026-09-25-foto-solo-con-novedad/archive-report.md:3-6` | Construida y sustituida |
| Rotulación: confirmación con persona, fecha y hora | `decision/f1b04-rotulacion`, `openspec/config.yaml:2920-2934` en `9134c04c` | `recepcion-rotulacion-foto-entrada`; `rotulado-tras-enviar` la pasa a después del envío (E-167) | `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md:8` y `openspec/changes/archive/2026-10-12-rotulado-tras-enviar/archive-report.md:6-7` | Construida |
| Rotulación: la etiqueta lleva el código del ticket | `openspec/config.yaml:2925` en `9134c04c` | La genera n8n, fuera del repositorio; no se cambia (`openspec/config.yaml:4697` en `9134c04c`) | Leído por el analista el 12/10, sin comprobar por ninguna sesión: `openspec/config.yaml:4698-4700` en `9134c04c` | Existente fuera del repositorio; comprobación de persona (E-170, punto 2) |
| Almacenamiento (ubicación) | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159` | Nadie: la decisión lo saca de la fila | Entra después del corte, con M5.3 (`openspec/config.yaml:2930` en `9134c04c`) | Fuera de la fila por decisión |
| Desplegables en las etapas críticas | `decision/f1b04-desplegables`, `openspec/config.yaml:2936-2951` en `9134c04c` | `recepcion-rotulacion-foto-entrada` (lista de novedades) y `lista-novedades-mantenible` (su mantenimiento); las otras siete listas ya estaban fijadas | `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md:8`, `openspec/changes/archive/2026-10-05-lista-novedades-mantenible/archive-report.md:5` y `openspec/config.yaml:2944` en `9134c04c` | Construida |
| Foto obligatoria en la remisión de entrada (E-123, mitad de entrada) | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:176` | `recepcion-rotulacion-foto-entrada` | `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md:8-9` | Construida, con la salvedad W3 declarada (abajo) |
| Accesorios desde el catálogo de artículos (E-100) | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4130-4132` | `accesorios-lista-por-modelo` | `openspec/changes/archive/2026-10-07-accesorios-lista-por-modelo/archive-report.md:6-8`; «la parte principal […] está construida» (`openspec/config.yaml:5818-5819` en `9134c04c`) | Construida |
| «Detalles» de `decision/accesorios-desde-el-catalogo`: E-163 a E-167 | `openspec/config.yaml:5816` en `9134c04c` | E-163 y E-164 ya se cumplían; E-165 y E-166, `recepcion-exencion-foto-y-casilla`; E-167, `rotulado-tras-enviar` | `openspec/changes/archive/2026-10-12-recepcion-exencion-foto-y-casilla/archive-report.md:22-25` y `openspec/changes/archive/2026-10-12-rotulado-tras-enviar/archive-report.md:6-7` | Construida |
| «Aplica» resuelto en la aplicación y mandado a n8n | `decision/aplica-opcion-a-esta-semana-12-10` (2), `openspec/config.yaml:4670-4671` en `9134c04c` | `aplica-resuelto-hacia-n8n` | `openspec/changes/archive/2026-10-12-aplica-resuelto-hacia-n8n/archive-report.md:6-7` | Construida en la aplicación; el nodo de n8n es tarea de persona y «no condiciona el cierre de la fila» (`openspec/changes/archive/2026-10-12-aplica-resuelto-hacia-n8n/archive-report.md:12-13`) |
| Aviso si la etiqueta no se genera | `decision/e167-rotulado-tras-enviar-12-10` (4), `openspec/config.yaml:4696` en `9134c04c` | `rotulado-tras-enviar` | `openspec/changes/archive/2026-10-12-rotulado-tras-enviar/archive-report.md:6-7` | Construida |
| Recuento de modelos sin accesorios | `openspec/config.yaml:5815` en `9134c04c` («Antes del corte, contar los modelos…») | Una persona, en producción, el 02/11 | `openspec/config.yaml:5611-5613` en `9134c04c`; ya no retiene la fila (`openspec/config.yaml:5608-5610` en `9134c04c`) | Hecho |

**Fuera de la fila por su propia fuente, y por eso no cuentan como pendientes:**

- La foto de cada accesorio va con el ítem 21: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1237`
  y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4130`. La fila original ya lo decía
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159`).
- La mitad de salida de E-123 y de E-100 va a la remisión de salida, que tiene fila propia
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:211`).

**Dos salvedades declaradas, que no son piezas sin construir:**

- **W3:** la foto obligatoria sólo se impone al formulario nuevo. Un alta que omite el campo de novedades entra por la vía
  anterior. Se declaró sin corregir, con E-081, IV-12 y E-169
  (`openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md:76`). El hueco del servidor es
  E-081, y su destino es la tanda que reordene el alta (`docs/sdd/ENTRADA.md:1188` en `9134c04c`), no F1B-04. Gerencia decidió
  los dos cierres posteriores sabiendo lo que quedaba: `decision/aplica-opcion-a-esta-semana-12-10` (3) sólo nombraba E-167
  y el recuento (`openspec/config.yaml:4672-4674` en `9134c04c`).
- **Número de parte:** que el SKU de Books sea el número de parte es hipótesis (`openspec/config.yaml:4037-4040` en
  `9134c04c`). La respuesta de Gerencia lo pide «cuando lo tenga» (`openspec/config.yaml:5815` en `9134c04c`).

**Conclusión de la medida:** ninguna pieza de la fila queda sin construir y archivar. Lo que queda son tareas de persona,
comprobaciones fuera del repositorio y piezas que la fila no lleva. El plan da el remanente por «0 d de construcción
conocida» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:211`).

## Las decisiones de respaldo, contrastadas

- **`decision/f1b04-rotulacion`** (`openspec/config.yaml:2920-2934` en `9134c04c`): construida salvo la ubicación, que la
  propia decisión aplaza con M5.3 (consecuencia (4)), y la etiqueta, que es de n8n.
- **`decision/f1b04-desplegables`** (`openspec/config.yaml:2936-2951` en `9134c04c`): construida. La consecuencia (4), E-081,
  queda apuntada como IV-12 y no es contenido de la fila (`openspec/config.yaml:2946` en `9134c04c`).
- **`decision/aplica-opcion-a-esta-semana-12-10`** (`openspec/config.yaml:4659-4681` en `9134c04c`): su (2) está construida.
  Su (3) retenía la fila por E-167 o por el recuento: E-167 lo cerró `rotulado-tras-enviar`, y el recuento lo levanta
  `decision/f1b04-recuento-no-retiene` (1).
- **`decision/f1b04-recuento-no-retiene`** (`openspec/config.yaml:5598-5624` en `9134c04c`): este cambio es su consecuencia (4).

## Lo que sigue abierto y NO es contenido de la fila

- **E-081, E-169 e IV-12** (`docs/sdd/ENTRADA.md:1182` y `docs/sdd/ENTRADA.md:1838` en `9134c04c`): hallazgos sobre el
  orden y las guardas del alta de remisión, sin destino asignado. Cerrar F1B-04 no los arregla ni les quita destino: ninguno
  nombraba F1B-04.
- **Entradas de la bandeja con destino F1B-04** (por la regla de `CLAUDE.md`: «un destino es una promesa»):
  - E-100 sigue «TRIADA» (`docs/sdd/ENTRADA.md:1367` en `9134c04c`), aunque está construida;
  - E-168 pide la clave `decision/` de la mitad de entrada de E-123 (`docs/sdd/ENTRADA.md:1833` en `9134c04c`);
  - E-170 son tareas de persona (`docs/sdd/ENTRADA.md:1843` en `9134c04c`);
  - E-265 nombra este cambio como destino (`docs/sdd/ENTRADA.md:2401` en `9134c04c`).

  `docs/sdd/ENTRADA.md` es de Supervisión y no se edita en la rama: van en la lista para Supervisión.
- **La prueba de aceptación con la primera remisión real**, el ticket nº 996 (`docs/sdd/TRASPASO_2026-10-08.md:1011-1015`),
  y el nodo «Verifica Incluye Entrada» de n8n (`docs/sdd/TRASPASO_2026-10-08.md:1005-1008`): son de persona.

## Alcance

### Dentro

- Este `proposal.md`, `tasks.md`, `verify-report.md` y `archive-report.md`.
- Al archivar, la carpeta pasa a `openspec/changes/archive/`. La prueba
  `apps/desk/server/reconciliacion/registro.test.ts:218-220` en `9134c04c` fija la lista «en curso» del árbol real con F1B-04, y se pone en
  rojo. Se ve el rojo y se corrige en sitio, sin mover líneas (autorizado por el usuario el 2026-11-03, como en `80a8dcbf`).

### Fuera

- Código de producción, `openspec/specs/` y el maestro.
- Los seis ficheros de Supervisión, entre ellos `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y `CLAUDE.md`.
- El estado de la fila en el plan R01.4 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84` dice «en curso»): lo
  actualiza Supervisión.
- `docs/sdd/RECONCILIACION.md`: se regenera para comprobar el efecto y no se commitea. Lleva el commit medido en la cabecera, y
  el encargo pide tres commits.

## Supuestos reversibles

| # | Supuesto | Alternativa |
|---|---|---|
| S-1 | `maestro:` lleva la fuente de la fila en la R01.1 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:501`), que es lo que cruza el barrido, más M1.2, el pasaje de la R08.4 que nombran las decisiones de la fila. Los ítems 4 y 10 son del §3.2 `[EN REVISIÓN — R08]` y valen como procedencia, no como alcance | Sólo la fuente de la R01.1, como el precedente |
| S-2 | `capacidad: [reconciliacion]`, porque el único efecto es el recuento del barrido y la prueba que lo fija; la R01.1 da `remisiones, tickets-core`, que son las de los cambios que construyeron la fila | `capacidad: [remisiones, tickets-core]` |
| S-3 | `toca_maestro: no`, como el precedente. La tabla del §3.3 del maestro marca F1B-04 «Parcial» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3853`), igual que marcaba F1B-08 al cerrarla (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3873`). Esa columna es una foto de la revisión, y las correcciones de contenido de la fila ya están entregadas por sus cambios | `toca_maestro: si`, con el texto del estado nuevo para Gerencia |
| S-4 | No se corrige `openspec/specs/reconciliacion/spec.md:347` ni su escenario de `openspec/specs/reconciliacion/spec.md:379`, que dan seis «en curso» con la lista del 01/10 y nombran F1B-04; corregirlo exige delta de specs, y el encargo es sin delta | Un delta de RQ-RC-11 |
| S-5 | El dueño de los 106 accesorios escritos a mano es el Director Técnico, porque es quien añade a la lista del modelo (`openspec/config.yaml:4052-4054` en `9134c04c`); la decisión no nombra dueño ni acción | Que Gerencia nombre otro dueño, o ninguna acción («siguen funcionando sin SKU») |

## Riesgos

- **Cita en prosa que caduca:** la lista «en curso» de `apps/desk/server/reconciliacion/registro.test.ts:220` en `9134c04c` se toca en
  sitio; al cerrar se barre la regla 4 sobre ese fichero.
- **Registro de intentos:** el archivo mide la mudanza dos veces (regla del ciclo 2, desvío 3); se abre con un techo de dos
  veces la carpeta más 800 (regla del archivo).
