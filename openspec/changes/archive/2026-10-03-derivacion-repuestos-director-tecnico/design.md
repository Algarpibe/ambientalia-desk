# Diseño: derivación de «Solicitud repuestos» al Director Técnico (F1C-11)

Base `f55b7d9`. Todo lo citado se leyó en el worktree el 2026-10-03. **Límite de esta fase:** no hubo
terminal, así que nada de lo de abajo se ejecutó; lo que depende de ejecutar lleva «hipótesis».

## Enfoque

Cambio de **dato**, sin lógica nueva: dos entradas en un mapa y un literal en una lista. Todo el trabajo
está en (a) no mover una sola línea de los ficheros muy citados y (b) las pruebas que fijan cifras a mano.

## D-1 · Forma exacta de las líneas (cero netas)

**Formateador: no hay.** No existe `.prettierrc*`, `prettier.config.*` ni `.editorconfig`; `prettier` no
figura en ningún `package.json` (búsqueda: 0 aciertos); los guiones de `package.json:10-26` no formatean; y
`eslint.config.js:19-24` sólo extiende conjuntos «recommended», sin reglas de estilo ni de longitud. Nada
deshace dos entradas en una línea, y hay precedente: `packages/shared/src/estados.ts:105` (tres entradas) y
`packages/shared/src/cargos.ts:13` (cuatro literales). **Hipótesis:** `npm run lint` sigue en su techo; se
comprueba en apply.

| Opción | Coste | Decisión |
|---|---|---|
| (a) Entrada nueva en la línea de la que comparte destino | Líneas de ~135 caracteres | **Elegida**: ninguna línea citada cambia lo que dice |
| (b) Cinco líneas, fundiendo el comentario de `:279-280` | La `:281` deja de ser `aprobacion` | Rechazada |
| (c) Absorber líneas del bloque de cabecera | Desplaza `:276` y `:278` (21 citas) | Rechazada |

`packages/shared/src/transitions.ts` — seis líneas reescritas en sitio, el resto intacto:

```ts
269   * anterior —lo que hacen las otras 26— lo dejaría justo en manos de quien deja de tocarle.
272   * cinco entradas se ve de un vistazo cuáles pisan lo heredado, y en 31 declaraciones no.
275   // Rev./Diagnostico → Notificado: escalar una revisión es subirla al inmediato superior. En Proceso → Solicitado: al encargado de inventario, que es ese mismo cargo.
276   escalado_a_revision: { tipo: 'cargo', cargo: 'Director Técnico' }, solicitud_repuestos: { tipo: 'cargo', cargo: 'Director Técnico' },
280   // puesto fijo al que mandarlo — hay que devolvérselo a quien tomó ese ticket. Solicitado → En Proceso: entregadas las piezas, vuelve a ese mismo técnico.
281   aprobacion: { tipo: 'primerDerivado' }, entrega_repuestos: { tipo: 'primerDerivado' },
```

La `:275` conserva «subirla al inmediato superior»; la `:276` conserva su primer literal en la columna 41
(la mutación archivada de F1C-05 da `TS2820` en `transitions.ts(276,41)`); `:277-279` no se tocan.

`packages/shared/src/cargos.ts` — tres líneas en sitio:

```ts
 9   * firma (texto libre, alarmas y derivación). Son los siete de `decision/c10b-gerente-director` más el de
10   * `decision/cargo-encargado-de-inventario` (`openspec/config.yaml`); `cargos.test.ts` lee las dos para no divergir.
14    'Director Comercial', 'Coordinador Comercial', 'Asistente Comercial', 'Especialista técnico',
```

El literal lleva «técnico» en minúscula: es como lo escribe la decisión (`openspec/config.yaml:3494`) y el
guardián compara exacto.

**Cero netas también en los ficheros de prueba que ya existen** (37 citas a esos ficheros fuera de
`openspec/changes/`): lo existente se edita en sitio y lo nuevo va **al final del fichero**.

## D-2 · Pruebas (rojo → verde)

Orden: R1-R8 se escriben y se ven fallar con el dato viejo; después D-1; después verde.

| # | Prueba | Cambio | Cifra, por cálculo |
|---|---|---|---|
| R1 | `packages/shared/src/transitions.test.ts:79-93` (+ comentario `:73`) | Mapa de cinco; las dos nuevas comparten línea con `:87` y `:91` | 31 − 5 = 26 |
| R2 | `packages/shared/src/sla.test.ts:112-119` | Mismas 8 líneas: comentario de 3, y tres aserciones — `En Proceso` → `{ hay: true, cargo: 'Director Técnico', via: ['solicitud_repuestos'] }`; `Solicitado` y `Por Facturar` → `ningun_cargo` | Única saliente de `En Proceso` con propuesta: `transitions.ts:200` |
| R3 | `packages/shared/src/sla.test.ts:178-182` | `['Rev./Diagnostico', 'Notificado', 'En Proceso']`, «tres» | Orden de `ESTADOS`: `packages/shared/src/estados.ts:90-92`, `:112` |
| R4 | `packages/shared/src/cargos.test.ts:22-30` | Octavo literal en `:26`; `toHaveLength(8)` | 7 + 1 |
| R5 | `packages/shared/src/cargos.test.ts:57-62` | Ver D-3 | 8 |
| R6 | `packages/shared/src/cargos.test.ts:204-205` | `1870` | 5 × (8 + 3) × (31 + 3) = 1.870 |
| R7 | `apps/desk/server/permisos.test.ts:356`, `:368`, `:446`, `:458` | `837` | 31 × 3 × (8 + 1) = 837 |
| R8 | `apps/desk/server/prioridadTop5.test.ts:150`, `:157`, `:359`, `:366` | «diez … ocho cargos», `toHaveLength(10)`; `aceptados` sigue en 2 | 8 + 1 + 1 = 10 |

Nuevas, todas al final de su fichero:

| # | Dónde | Qué | Rojo previo |
|---|---|---|---|
| N1 | `apps/desk/src/lib/personas.test.ts` | `derivacionInicial` con el `porDefecto` **real** de `TRANSITIONS`: `solicitud_repuestos` gana al heredado (cargo «director tecnico» plegado), primero de dos titulares, y cae al heredado sin titular; `entrega_repuestos` devuelve al primer derivado y cae al heredado si es nulo o inactivo. La caída va en el mismo `it` que el caso positivo | Sí: `porDefecto` es `undefined` y devuelve el heredado |
| N2 | `packages/shared/src/cargos.test.ts` | `esCargo('Especialista técnico')`, `cargoPermisoDelCuerpo` lo acepta, y sus veredictos sobre las 31 son los de `Técnico` | Sí, por las dos primeras |
| N3 | `apps/desk/server/cargoPermiso.test.ts` | Alta y edición por HTTP con `cargoPermiso: 'Especialista técnico'` | Sí: `422` |
| N4 | `apps/desk/server/transiciones.test.ts`, `describe` nuevo | Ticket en `En Proceso` derivado al técnico y con historial previo (patrón de `:97-112`): `solicitud_repuestos` con el Director Técnico → `200`, `Solicitado`, aviso sólo a él («… te derivó el ticket #N en «Solicitud repuestos»», patrón de `:166-187`); después `entrega_repuestos` con el `primerDerivado` del detalle → `200`, `En Proceso`, aviso al técnico | Sólo por su primera aserción (el `porDefecto` de las dos etapas) |
| N5 | mismo `describe` | `derivado_a` de una persona activa que no es el Director Técnico → `200`; de una dada de baja → `422` | **No: nace verde.** Es caracterización —el servidor no cambia—; su detector es M7 |

No se importa `derivacionInicial` desde una prueba del servidor: no hay precedente (0 aciertos) y
`apps/desk/tsconfig.server.json:12` sólo incluye `server/**`.

## D-3 · El guardián de dos decisiones

Se conserva `cargosDeLaDecision()` (`cargos.test.ts:45-55`) tal cual y se añade, **al final del fichero**,
una `function cargoDeRespaldoDeLaDecision(): string` de ámbito de módulo (se iza): localiza
`clave: "decision/cargo-encargado-de-inventario"`, corta el bloque en el siguiente `- clave:`, se queda con
lo que hay entre `respuesta_textual:` y `consecuencias:` (para no leer el «Especialista técnico» de las
consecuencias), pliega espacios y aplica
`/«([^«»]+)» no está entre los siete cargos decididos el 24\/09/`. Sin acierto, lanza «Guardián sin objeto».
La prueba de `:57-62` pasa a comparar `[...cargosDeLaDecision(), cargoDeRespaldoDeLaDecision()]` con
`[...CARGOS]` (orden y conjunto) y longitud 8. **Ninguna `respuesta_textual` se edita**: la de
`openspec/config.yaml:2589` sigue diciendo «son siete» y la de `:3494` aporta el octavo.

*Reproducir la mutación (regla 2):* en `openspec/config.yaml:3494`, cambiar «Especialista técnico» por
«Especialista tecnico» → rojo por desigualdad; quitar «no está entre los siete cargos» → rojo por «sin
objeto». Revertir y comprobar con `git diff --stat openspec/config.yaml` que la línea queda idéntica.

## D-4 · Mutaciones

| # | Mutación | Se pone roja |
|---|---|---|
| M1 | Quitar `solicitud_repuestos` | R1, R2, R3, N1, N4 |
| M2 | Quitar `entrega_repuestos` / cambiarla a `cargo` | R1, N1, N4; a `cargo`, además R2 y R3 (la lista gana `Solicitado` delante: `estados.ts:79`) |
| M3 | Otro cargo en `solicitud_repuestos` | R1, R2, N1, N4 |
| M4 | Mover «Especialista técnico» en `CARGOS` | R4, R5 |
| M5 | Alterar la `respuesta_textual` de `:3494` | R5 |
| M6 | Quitar el octavo | R4, R5, R6, R7, R8, N2, N3 |
| M7 (añadida) | Rechazar en `ticketService.ts` un derivado distinto del propuesto | N5 |

## D-5 · Regla 13

| Decisión del cliente | Servidor | Veredicto |
|---|---|---|
| Rellena «Derivado a» (`apps/desk/src/components/TransitionPanel.tsx:87-94`, vía `apps/desk/src/lib/personas.ts:73-79`) | **Ninguna línea la impone.** `apps/desk/server/services/ticketService.ts:138-142` sólo exige persona activa; N5 lo deja escrito | Comodidad, no guarda |
| Ofrece el octavo cargo en la administración | La lista cerrada es la misma de `shared`; N3 prueba el `422`/aceptación | Espejo legítimo |
| Bloquea / avisa algo nuevo | — | Nada |

## D-6 · Barrido de citas al cierre

1. `transitions\.ts:[0-9]+(-[0-9]+)?` y `cargos\.ts:[0-9]+(-[0-9]+)?` sobre todo el árbol, **con**
   `openspec/changes/archive/`; con cero netas se comprueba que ninguna línea citada cambió de contenido.
2. Pase de abreviadas en los ficheros que citan esos módulos.
3. `sla.ts`, `sla.test.ts`, `cargos.test.ts`, `transitions.test.ts`: `wc -l` igual que en `f55b7d9`.

| Afirmación que pasa a ser falsa | Dónde | Caso |
|---|---|---|
| «tres entradas», «28 heredan» | `openspec/specs/derivacion-avisos/spec.md:78-111` | A — lo corrige el delta al archivar |
| «siete cargos» | `openspec/specs/permissions/spec.md:284`, `:422`, `:462` | A — delta |
| «siete», «tres» en pruebas y comentarios | R1, R4, R8, `cargos.ts:9-10`, `transitions.ts:269-272` | A — esta tanda |
| «tres entradas» de `transitions-st` | `openspec/specs/transitions-st/spec.md:1313` (apartado «a corregir en F1B-06», `:1304`) | C — superado, no se toca; `:730` (alarmas) y `:1516` (retiradas) hablan de otras «tres» |
| «siete cargos» de la consecuencia de c10b | `openspec/config.yaml:2594` | B — fechada; la supera `:3497` |
| «son tres», «siete cargos» en `docs/sdd/F0-*`, paquetes de despliegue y `archive/` | varios | B — registros fechados, no se editan |
| «estas tres proponen a otro» | `docs/artefactos/blueprintserviciotecnico.html:390` | A, **fuera de alcance**: va a `docs/sdd/ENTRADA.md` |

**Desfase ajeno**, sólo en ficheros que la tanda edita: el rango viejo 267-276 pasa a `:274-282` en
`sla.test.ts:93` (y su abreviada de `:95` a `:275`); en `sla.ts:66` el 268 pasa a `:275` y en `sla.ts:70` el
271 a `:278`. Los dos de `derivacion-avisos/spec.md` (`:81`, `:656`): el `:81` lo arregla el delta; el `:656`
se corrige en la fusión del archivo. `F0-03/decisiones-para-carga.md:113` no se toca (B).

## D-7 · Lotes

| Sumando | Líneas |
|---|---|
| Código (`transitions.ts` 12, `cargos.ts` 6, `sla.ts` 4) | 22 |
| Pruebas: ~203 brutas (en sitio ~62, nuevas ~141) × 1,8 | ~365 |
| Casillas de `tasks.md` | ~60 |
| `apply-progress.md` | ~100 |
| `ENTRADA.md` (pregunta, dos tareas de persona, hallazgo del HTML) + texto para M1.9.2 en el expediente | ~40 |
| **Total (hipótesis)** | **~587** |

Cabe bajo 720: **un lote**. Válvula: si tras las pruebas la medida real
(`git diff --shortstat --no-renames f55b7d9` más `wc -l` de lo nuevo) supera 560, la documentación pasa a
un segundo lote.

## Matriz de amenazas

N/A — sin rutas, shell, subprocesos ni automatización de VCS.

## Migración

Ninguna. **Hipótesis** (segunda mano, `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:187`): la columna
`cargo_permiso` no tiene `CHECK`; N3 lo confirma al escribir la fila.

## Preguntas abiertas

- [ ] El delta de `derivacion-avisos` (`specs/derivacion-avisos/spec.md:8-9`, `:103`) dice «cinco líneas»;
  con D-1 son cinco **entradas** en tres líneas. Hay que ajustar esas dos frases antes de `sdd-tasks`.
- [ ] El artefacto HTML del blueprint queda diciendo «tres»: ¿quién lo regenera? (**hipótesis**: no lo
  produce `generar-mapa-blueprint`).
