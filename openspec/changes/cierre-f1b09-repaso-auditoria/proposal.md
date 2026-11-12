---
tanda: F1B-09
motivo: ""
capacidad: [reconciliacion, transitions-soporte-remoto, transitions-equipo-nuevo]
maestro: ["M11.6"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: cierre de F1B-09 con el repaso de la auditoría

## Intención

Gerencia decidió el 2026-11-12 cómo se cierra F1B-09 (`decision/f1b09-epica-1b-antes-del-corte`; Supervisión la registra en
paralelo y a la hora de escribir esto no está en `origin/main`, así que se cita por su clave y no por línea). Texto:

> «F1B-09: opción (a). «Cerrar la épica 1B» se entiende, para el repaso de la auditoría, como sus filas de antes del corte,
> todas cerradas salvo F1B-09; las de 2027 (F1B-16, F1B-17, F1B-20) tendrán su propia auditoría en su hito, como manda el
> maestro. Las tres decisiones de config.yaml (:3804-3805, :4177, :5619) se conservan y reciben una nota fechada 12/11 con esta
> lectura, sin reescribirlas. Encargo: repaso de la auditoría sobre el código de hoy (52 transiciones), corrección de las dos
> referencias de las especificaciones que aún mandan a F1B-09 trabajo hecho, y la línea de prueba que la marca en curso. El
> repaso entrega una lista de discrepancias, cada una con destino: bandeja o fila de 2027. Con eso F1B-09 cierra antes del
> 14/12 y siguen siendo 8 las filas de antes del corte.»

Las tres decisiones que mantenían el `cierra: no` son, por su clave: `decision/orden-tres-tandas-04-10`, consecuencia (2)
(`openspec/config.yaml:3804-3805` en `87510cbf`); `decision/e222-mapa-equipo-nuevo-soporte-remoto`, consecuencia (5)
(`openspec/config.yaml:4177` en `87510cbf`); y `decision/f1b04-recuento-no-retiene`, consecuencia (5)
(`openspec/config.yaml:5619` en `87510cbf`). Las tres decían lo mismo: el repaso de la auditoría se hace al cerrar la épica 1B.
La nota del 12/11 es de Supervisión; este cambio no toca `openspec/config.yaml`.

**La condición se cumple, medida.** El barrido de `main` cuenta como cerradas todas las filas de 1B de antes del corte menos
F1B-09: F1B-01 por commit declarado, y F1B-02 a F1B-08, F1B-10 a F1B-15, F1B-18 y F1B-19 por archivo
(`docs/sdd/RECONCILIACION.md:19-21` en `87510cbf`). F1B-09 es la única de 1B «en curso». Las tres de 2027 son F1B-16
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96`), F1B-17
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:97`) y F1B-20
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:423`).

Las citas a `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `docs/sdd/R08.4_Expediente_de_cambios.md` y
`docs/sdd/RECONCILIACION.md` van ancladas en `87510cbf`, el commit de partida: son ficheros de Supervisión o se regeneran en
`main`. También van ancladas las de `apps/desk/server/reconciliacion/registro.test.ts` y las de las dos líneas de spec que este
cambio corrige, porque cambian al archivar.

## Qué pide la fila, medido

- **Su origen**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:166`: «Auditoría de blueprint de los tres flujos
  (`audit-F1B`); extensión a equipo nuevo y soporte remoto como pide M11.6». La columna de fuente de esa fila es «—», así que el
  barrido no cruza su `maestro:` y, archivada, la cuenta entre las «cerradas sin fuente declarada en la R01.1»
  (`apps/desk/server/reconciliacion/comprobaciones.ts:231-234`).
- **La fila vigente**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:89`: talla S, antes del 14/12, «en curso».
- **El remanente**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:215`, escrito el 09/10: «falta el repaso al cerrar
  la épica 1B (XS; hipótesis) y E-223 a E-230, sin talla».
- **El pasaje del maestro**, M11.6 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3521`): la lectura
  del código del flujo «conviene repetirla en cada hito del desarrollo», y «la extensión a los tres flujos […] es la tanda
  F1B-09, sin empezar».
- **La auditoría que se repasa**, `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` (05/10, árbol `0d1a40b`). Ella misma pide
  que el repaso de cierre se haga sobre `main` (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:325-326`).

## Qué cubrieron los cinco cambios archivados con `tanda: F1B-09` (todos `cierra: no`)

| Cambio | Fusión en `main` | Qué cubrió | Dónde se dice |
|---|---|---|---|
| `2026-10-05-audit-f1b` | `64a3797d` | La auditoría de los tres flujos, con sus hallazgos en la bandeja (E-222 a E-230) | `openspec/changes/archive/2026-10-05-audit-f1b/archive-report.md:5` |
| `2026-10-08-mapa-blueprint-tres-flujos` | `60b171fb` | El mapa generado y su prueba contra el desfase, en los tres flujos (E-222) | `openspec/changes/archive/2026-10-08-mapa-blueprint-tres-flujos/archive-report.md:6-8` |
| `2026-10-17-cifras-caducas-y-lectores-de-servicio` | `1029c903` | E-228 y la parte construible de E-227 | `openspec/changes/archive/2026-10-17-cifras-caducas-y-lectores-de-servicio/archive-report.md:3-5` |
| `2026-10-17-espera-y-areas-equipo-nuevo` | `8d132564` | Lo que abre `decision/e226-espera-y-areas-equipo-nuevo`: la clase de espera de tres estados y el área de las seis de equipo nuevo | `openspec/changes/archive/2026-10-17-espera-y-areas-equipo-nuevo/archive-report.md:3-5` |
| `2026-10-27-areas-soporte-remoto` | `3ac80f32` | El área de las cuatro transiciones de soporte remoto, de supuesto a `decision/e090-areas-soporte-remoto` | `openspec/changes/archive/2026-10-27-areas-soporte-remoto/archive-report.md:3-5` |

Los cinco dejan fuera lo mismo: el repaso de la auditoría al cerrar la épica 1B. Es la primera pieza de este cambio.

## Las tres piezas, y ninguna más

### (a) El repaso de la auditoría sobre el código de hoy

Un documento nuevo, `docs/sdd/F1B-09_Repaso_auditoria_2026-11.md`. La auditoría del 05/10 no se edita: es un registro fechado
y está citada desde quince ficheros. El repaso:

1. Mide desde el código las transiciones de hoy por flujo y las compara con las que contó la auditoría. **Medido en esta
   planificación, sobre `87510cbf`: 40 + 7 + 5 = 52** (54 con las dos que aplica el servidor). En el árbol auditado,
   `0d1a40b`, la misma medida da 31 + 6 + 4 = 41 (43). La hipótesis del analista se confirma. Lo fijan como pruebas
   `packages/shared/src/invariantesGrafo.test.ts:50` (40 de servicio) y `packages/shared/src/invariantesGrafo.test.ts:172`
   (52 en la unión, con ids únicos).
2. Contrasta con `main` cada afirmación de estado de la auditoría (§1 a §7 y su resumen de §9) y cada punto de lo que declaró
   no haber hecho (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:323-339`).
3. Entrega una lista de discrepancias. Cada una lleva ruta y línea y UN destino: «bandeja» (la lista para Supervisión, que la
   registra en `docs/sdd/ENTRADA.md`) o una fila de 2027 (F1B-16, F1B-17 o F1B-20) si cae en su alcance. Si alguna no cabe en
   ninguno, es una pregunta de alcance y se para antes de seguir.

No corrige ninguna discrepancia: sólo las lista.

### (b) Las dos referencias de las especificaciones (T-P4)

La tarea de persona T-P4 de `mapa-blueprint-tres-flujos`
(`openspec/changes/archive/2026-10-08-mapa-blueprint-tres-flujos/tasks.md:274`; el encargo la sitúa en la 273, que es T-P3, y
el fichero no ha cambiado desde su archivo, `b2882af5`) pedía actualizar las notas de las specs de equipo nuevo y soporte
remoto que remiten a F1B-09. Siguen remitiendo trabajo ya hecho:

- `openspec/specs/transitions-soporte-remoto/spec.md:322` en `87510cbf`: «Columna propia de tablero para `Solicitud Soporte` y
  mapa generado de los tres flujos → F1B-09».
- `openspec/specs/transitions-equipo-nuevo/spec.md:553` en `87510cbf`: «Columna propia de tablero para `Verificación`; mapa
  generado de los tres flujos → F1B-09».

Las dos piezas están hechas:

- **La columna propia** de los dos estados, por F1B-08 con `columna-propia-dos-estados`: fusión `ae2e5223`, archivo
  `7de0e787`. Hoy están en `packages/shared/src/columns.ts:15` y `packages/shared/src/columns.ts:20`.
- **El mapa generado de los tres flujos**, por F1B-09 con `mapa-blueprint-tres-flujos`: fusión `60b171fb`, archivo `b2882af5`.

Se corrigen por delta, una línea por una línea, en sitio y sin mover ninguna otra. La delta va en
`specs/transitions-soporte-remoto/spec.md` y `specs/transitions-equipo-nuevo/spec.md` de este cambio y se fusiona por script al
archivar.

### (c) La línea de prueba que marca F1B-09 «en curso»

`apps/desk/server/reconciliacion/registro.test.ts:218` en `87510cbf` y `apps/desk/server/reconciliacion/registro.test.ts:220`
en `87510cbf` fijan la lista «en curso» del árbol real en CINCO, con F1B-09. Al archivar este cambio con `cierra: si`, el
barrido la cuenta «por archivo» y la prueba tiene que ponerse roja. Se ve el rojo y se corrige en sitio, sin mover líneas: de
CINCO a CUATRO, sin F1B-09, con `toContain('F1B-09')` en «cerradas por archivo». Es la única edición de código del cambio, con
el molde de `openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido` (`8b3c4bac`).

## Alcance

### Dentro

- `proposal.md`, `design.md`, las dos deltas, `tasks.md`, `apply-progress.md`, `verify-report.md` y `archive-report.md`.
- `docs/sdd/F1B-09_Repaso_auditoria_2026-11.md`, nuevo.
- Al archivar: la fusión de las dos deltas en `openspec/specs/transitions-soporte-remoto/spec.md` y
  `openspec/specs/transitions-equipo-nuevo/spec.md`, y las líneas 218 y 220 de
  `apps/desk/server/reconciliacion/registro.test.ts`.

### Fuera

- Código de producción y cualquier otra línea de `openspec/specs/`, aunque el repaso la encuentre desfasada.
- `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md`.
- Los seis ficheros de Supervisión, entre ellos `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `CLAUDE.md` y
  `docs/sdd/R08.4_Expediente_de_cambios.md`. Lo suyo va en la lista para Supervisión: las trazas caducas de E-223, E-226 y
  E-090, lo que queda sin destino de E-227 y el texto nuevo para M11.6.
- El maestro: `toca_maestro: si`, porque M11.6 sigue diciendo «sin empezar»; el texto se entrega en la lista para Supervisión,
  que lo lleva al expediente.
- El plan R01.4 y `docs/sdd/RECONCILIACION.md`: se ponen al día en `main` después de fusionar, fuera de esta rama. En la rama,
  `RECONCILIACION.md` se regenera para comprobar el efecto y se restaura sin commitear.
- Producción.

## Supuestos reversibles

| # | Supuesto | Alternativa |
|---|---|---|
| S-1 | Es **discrepancia** todo punto en que lo que afirma la auditoría, o un registro vivo que la sigue (bandeja, spec, comentario o título de prueba, maestro), no coincide con `main`, y todo hallazgo que siga abierto con un destino que ya no lo es (una fila cerrada). No lo es lo que la auditoría afirmó y `main` confirma, ni lo superado que su registro ya da por cerrado: eso va en el contraste, no en la lista | Listar también como discrepancia todo lo superado, aunque su registro ya esté al día |
| S-2 | *Corregido en el verify.* El flujo de la remisión que la auditoría no revisó (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:339`) no es sólo de la remisión de entrada: el envío a n8n rechaza la remisión sin ticket (`apps/desk/server/routes/remision.ts:302`), y anular, restaurar y el callback no distinguen el tipo (`apps/desk/server/db/estadoPorRemision.ts:43-46`). Por eso esa discrepancia se parte en dos: la mitad del envío va a F1B-16 y la del callback y la anulación a F1B-17, cuyas auditorías de hito pone la decisión. Las demás no caen en el alcance de ninguna fila de 2027 y van a «bandeja» | Que las dos vayan a «bandeja» y Supervisión las sitúe |
| S-3 | La corrección de (b) va por delta aunque las dos líneas no son requisitos: la delta escribe la línea viva y la nueva, y el archivo la fusiona por script, una por una. El precedente de `cifras-caducas-y-lectores-de-servicio` editó en sitio, sin delta, las frases sin SHALL (`openspec/changes/archive/2026-10-17-cifras-caducas-y-lectores-de-servicio/design.md:49`); aquí el encargo pide delta | Editarlas en sitio en el apply, sin delta, como aquel precedente |
| S-4 | Los commits que se citan para la columna y el mapa son las fusiones en la línea principal de `main` (`ae2e5223` y `60b171fb`); el archivo de cada uno se cita al lado | Citar sólo el commit de archivo |
| S-5 | Las otras cuatro líneas desfasadas de las mismas dos secciones «Fuera de alcance» no se tocan: el encargo limita (b) a dos, y `areas-soporte-remoto` dejó una de ellas a propósito por ser foto de lo que su tanda dejó fuera (`openspec/changes/archive/2026-10-27-areas-soporte-remoto/archive-report.md:35-36`). Van a la lista como discrepancia | Corregirlas en el mismo delta |
| S-6 | El repaso no rehace lo que la auditoría declaró no haber hecho y sigue fuera de una lectura del árbol: la aplicación desplegada, el cliente `.tsx` entero, «cliente sin ruta», la ejecución de B-3, el contraste de cada tanda con su informe y el flujo de la remisión. Dice, para cada punto, si sigue igual y por qué | Ampliar el repaso a alguno de esos puntos, con otra talla |

## Riesgos

- **Una discrepancia sin destino posible** pararía la tanda antes de fusionar. Medido en la planificación: ninguna lo está.
- **Citas que caducan al archivar:** la 218 y la 220 de `registro.test.ts` y las dos líneas de spec cambian de texto, no de
  número. Al cerrar se barre la regla de mutación 4 sobre esos tres ficheros, también la forma abreviada.
- **Un MODIFIED que creciera a mitad de una spec viva** desplazaría sus citas. Las dos deltas sustituyen una línea por una
  línea; el archivo comprueba con `cmp` que el resto del fichero no cambia.
- **Registro de intentos:** el archivo mide la mudanza dos veces (regla del ciclo 2, desvío 3); se abre con un techo de dos
  veces la carpeta más 800 (regla del archivo).
- **`docs/sdd/RECONCILIACION.md`** lleva el commit medido en la cabecera: se regenera para comprobar y se restaura sin
  commitear.
