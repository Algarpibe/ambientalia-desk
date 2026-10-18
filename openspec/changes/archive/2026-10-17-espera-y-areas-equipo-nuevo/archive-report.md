# Informe de archivo — `espera-y-areas-equipo-nuevo` (F1B-09, `cierra: no`)

**Cobertura de la fila:** de F1B-09 cubre lo que abre `decision/e226-espera-y-areas-equipo-nuevo` (clase de espera de
`Pendiente`, `Verificación` y `Solicitud Soporte`; área de las seis de equipo nuevo); deja fuera el repaso al cerrar la
épica 1B (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:215`) y las áreas de soporte remoto (E-090).

## 1. Lo que se archiva

| Commit | Qué |
|---|---|
| `5b98440` | Planificación: medición, cuatro deltas, diseño, tareas y siete pruebas en rojo |
| `0f5e2b6` | Apply: `estados.ts:101-105` y comentarios en sitio, docblock de equipo nuevo, `export` de `esperasDelCodigo`; M0-M7 |
| `3421e2f` | Verify PASS (0 críticos, 1 aviso, 3 sugerencias) |
| este commit | Fusión de los deltas en las specs vivas, ajustes en sitio y mudanza de la carpeta |

## 2. Fusión

Por script (`herramientas/fusiona.mjs`), con comprobación de identidad bloque a bloque (11 bloques). **Ningún bloque
MODIFIED cambia de número de líneas salvo los dos que van detrás de toda cita**, para no desplazar las citas a estas
specs (`hojas-vida/spec.md:185`, `:190`; `transitions-equipo-nuevo/spec.md:290`, `:532`, `:536`; las de
`openspec/config.yaml` y del plan): se comprobó línea a línea que los rangos citados dicen hoy lo mismo que en `3421e2f`.
Por eso el delta se reajustó en este paso —el contenido nuevo de RQ-RC-04 y RQ-EN-02 pasó a RQ-RC-13 y RQ-EN-13, añadidos
al final—, sin cambiar lo que se exige.

| Spec | Bloques | Líneas |
|---|---|---|
| `transitions-st` | RQ-TS-17, RQ-TS-25, RQ-TS-26 en sitio (neto 0); RQ-TS-39 al final | 2.573 → 2.613 |
| `transitions-equipo-nuevo` | RQ-EN-02 en sitio (neto 0); RQ-EN-07 +5 (nada citado detrás); RQ-EN-13 al final | 552 → 568 |
| `transitions-soporte-remoto` | RQ-SR-03 en sitio (neto 0); RQ-SR-12 +6 (final del fichero) | 349 → 355 |
| `reconciliacion` | RQ-RC-04 en sitio (neto 0); RQ-RC-13 al final | 523 → 541 |

**En sitio, fuera de bloques RQ:** `transitions-st` §3.7 (`:1188` 12 estados, `:1191` «las doce», `:1209-1211` `Pendiente`
`externa`), `:1059` y `:1199`; `transitions-equipo-nuevo:109`, rótulo de §2 sin s2.

**Parte revisable, medida antes de commitear:** 112 inserciones y 32 borrados en `openspec/specs/`, más este informe; por
debajo de 800.

## 3. Estado al cerrar

- Códigos en `3421e2f`: `npm test` 0 (286 ficheros, 4.792 pruebas, 11 omitidas), `npm run typecheck` 0, `npm run lint` 0
  (165 avisos, los de la partida), detector `--sha HEAD` 0 (13 abreviadas informativas, la línea base).
- `wc -l` igual en `4124fb5` y `0f5e2b6` para todo fichero existente tocado salvo `comentariosVigilados.test.ts` (92 → 100,
  el caso (f) añadido al final: aviso W1 del verify; sus citas, `:33-34` y `:54-65`, son anteriores y no se mueven).
- Mutaciones M0-M7 en el apply y reproducidas por el verify; M1 sólo la caza la prueba nueva de la comprobación 5.
- Intentos: planificación 564, apply 98, verify 101, todos con techo 800.
- Bundle: `index-DUWvYLlB.js` (416,69 kB, `4124fb5`) → `index-8KPDmeiY.js` (416,67 kB). Sin migración.

## 4. Lo que queda fuera, anotado

- **Supervisión** (no se edita en la rama; `main` los tiene modificados): `CLAUDE.md` IV-9 pasa a «2 aciertos y 10 fallos
  sobre 12»; `openspec/config.yaml` `cifras_ancladas.esperas` pasa a «DOCE: 6 externa + 6 interna», y su frase sobre
  `Pendiente` `sin_clasificar` caduca; `docs/sdd/ENTRADA.md` E-226, atendida en esta rama.
- **Supuestos S-1 a S-5** (`proposal.md` §4) a la lista semanal.
- **F1C-06:** el reloj de `decision/c7-reloj-sla` no está construido; con E-226 `Pendiente` cumple su criterio de parada
  («esperamos a alguien de fuera»), y lo decide esa tanda.
- **Avance:** F1B-09 ya estaba en curso; no cambia ninguna cifra (`cierra: no`).
- **Tareas de personas** (`tasks.md`): P-1, revisar los supuestos; P-2, los textos de Supervisión. Archivar no las da por
  hechas.
