# Exploración: derivación de «Solicitud repuestos» al Director Técnico (F1C-11)

Base: `f55b7d9`. El contenido de partida es la observación 1315 de Engram
(`sdd/derivacion-repuestos-director-tecnico/explore`); el explorador no tenía escritura. **Cada cita de
abajo se volvió a leer contra el árbol del worktree al escribir este fichero** (2026-10-03). Donde la
relectura corrigió o amplió al explorador, se dice. Lo no comprobado lleva la palabra «hipótesis».

## 1 · La letra

- **Maestro R08.4**, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1617-1620`:
  «Solicitud repuestos» la ejecuta el técnico a cargo y deriva al encargado de inventario (`:1618`);
  «Entrega de Repuestos» la ejecuta el encargado y «devuelve el ticket al técnico que lo tenía a cargo,
  como ya hace "Aprobación" con "quien tomó el ticket"» (`:1619`); la derivación «se construye ya», la
  restricción de quién ejecuta llega con el nivel «propietario del registro» (`:1620`).
- **M1.9.2**, mismo fichero `:2001-2005`: «Tres proponen a otro» (`:2005`). Tras esta tanda son cinco.
- **`decision/cargo-encargado-de-inventario`**, `openspec/config.yaml:3488-3508`, `respuesta_textual` en
  `:3494`: el encargado es el Director Técnico; no se crea cargo para él; el respaldo en ausencia va al
  «Especialista técnico», que hay que dar de alta como cargo y asignar a Johny Luna.
- **`decision/escenario-a-festivos-plan-a-01-10`**, `openspec/config.yaml:3604-3631`, punto 4 en `:3614`:
  «la derivación al Director Técnico se construye ya. El respaldo al Especialista técnico espera al
  registro de ausencias (…, 1E). Mientras tanto, reasignación manual por un administrador».
- **`decision/orden-tres-tandas-03-10`**, `openspec/config.yaml:3749-3768`: F1C-11 es la primera de tres.
- **Plan R01.4**, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:109` (fila, talla S), `:357`
  (nota 6: el alta del cargo se mete en F1C-11, supuesto reversible), `:395-397` (§K.4).

## 2 · Lo que hay hoy

| Hecho | Cita verificada |
|---|---|
| `solicitud_repuestos` (En Proceso → Solicitado, Servicio Técnico) sólo lleva `comment()` | `packages/shared/src/transitions.ts:200-201` |
| `entrega_repuestos` (Solicitado → En Proceso, Servicio Técnico), igual | `packages/shared/src/transitions.ts:204-205` |
| `DERIVACION_POR_DEFECTO` tiene tres entradas; las otras heredan | `packages/shared/src/transitions.ts:274-282` |
| El tipo de la propuesta nombra un `Cargo` de la lista cerrada | `packages/shared/src/transitions.ts:51-53` |
| La propuesta la consume SÓLO el cliente: `derivacionInicial` | `apps/desk/src/lib/personas.ts:58-82`, llamada en `apps/desk/src/components/TransitionPanel.tsx:87-94` |
| Casa por `users.cargo` (texto libre), plegando acentos, mayúsculas y espacios | `apps/desk/src/lib/personas.ts:37-38`, `:74-79` |
| Con varios titulares, la primera persona de la lista; sin ninguno, cae al heredado | `apps/desk/src/lib/personas.ts:76-79` |
| `primerDerivado` inactivo o nulo cae al heredado | `apps/desk/src/lib/personas.ts:73` |
| El servidor sólo valida que la persona exista y esté activa | `apps/desk/server/services/ticketService.ts:138-142` |
| El servidor escribe la columna tal como llega (ausente ≠ vacía) | `apps/desk/server/transitionExec.ts:58-61` |
| El aviso de derivación ya existe y se dispara si cambia el derivado | `apps/desk/server/services/avisoDerivacion.ts:30-38`, `apps/desk/server/services/ticketService.ts:169-185` |
| `primerDerivado` se reconstruye del historial | `apps/desk/server/db/primerDerivado.ts:24-34` |
| `CARGOS` son siete (lista de `cargo_permiso`, distinta del `users.cargo` de firma) | `packages/shared/src/cargos.ts:12-15`, `:8-10` |
| El desplegable de cargo de la administración recorre `CARGOS` | `apps/desk/src/components/UsersAdmin.tsx:125`, `:185` |
| «Especialista técnico» no aparece en `apps/` ni `packages/` | `grep` de `Especialista` sobre `*.ts`, `*.tsx`, `*.sql`: 0 aciertos |
| No hay registro de ausencias | `openspec/config.yaml:3500-3504` (lo afirma la decisión; **hipótesis**: no se repitió el `grep`) |
| `destinatariosDeCargo` (servidor, alarmas) recorta y baja a minúsculas, **no pliega acentos** | `apps/desk/server/db/avisos.ts:104-113` |
| El generador del mapa no lee la derivación | `grep` de `porDefecto` en `packages/shared/src/mapaBlueprint.ts`: 0 aciertos |

**Efecto lateral que el explorador nombró a medias.** `destinatarioDelEscalado`
(`packages/shared/src/sla.ts:92-109`) lee cualquier propuesta de tipo `cargo` como destinatario de
escalado. Con la entrada nueva, `En Proceso` pasa a devolver Director Técnico por la vía
`solicitud_repuestos`, aunque eso es un traspaso y no una subida. No tiene consumidor en producción:
el `grep` de `destinatarioDelEscalado` en `apps/` y `packages/` sólo da `sla.ts` y `sla.test.ts`, y el
propio módulo la declara «comprobación de coherencia» (`packages/shared/src/sla.ts:26-29`). Ningún estado
con alarma (`packages/shared/src/sla.ts:32-35`) es `En Proceso` ni `Solicitado`, así que la prueba de
coherencia de `packages/shared/src/sla.test.ts:189-192` no choca.

## 3 · Pruebas que se ponen rojas (comprobado contra el fichero)

| Prueba | Por qué |
|---|---|
| `packages/shared/src/transitions.test.ts:79-93` | Fija el mapa entero con tres entradas |
| `packages/shared/src/sla.test.ts:117` | `En Proceso` deja de ser `ningun_cargo` |
| `packages/shared/src/sla.test.ts:179-182` | La lista de estados con destinatario pasa de dos a tres (el orden exacto, **hipótesis**: depende de `ESTADOS`) |
| `packages/shared/src/cargos.test.ts:22-30` | «Son siete, en orden» y `toHaveLength(7)` |
| `packages/shared/src/cargos.test.ts:57-62` | El guardián compara `CARGOS` con la frase de siete de `decision/c10b-gerente-director` |
| `packages/shared/src/cargos.test.ts:204-205` | **No lo nombraba el explorador.** 5 × 10 × 34 = 1.700 pasa a 5 × 11 × 34 = 1.870 |
| `apps/desk/server/permisos.test.ts:356-369` y `:446-460` | **No lo nombraba.** 31 × 3 × 8 = 744 pasa a 31 × 3 × 9 = 837, dos veces |
| `apps/desk/server/prioridadTop5.test.ts:150-157` y `:359-366` | **No lo nombraba.** «Nueve sujetos» pasa a diez, dos veces |

Corrección al explorador: el rango `cargos.test.ts:22-62` es cierto, pero el alta del cargo rompe además
cuatro cifras contadas a mano en otros tres puntos. El alta del octavo cargo es la mitad cara de la tanda.

## 4 · Citas a `transitions.ts` (regla de mutación 4), medido

- `transitions\.ts:[0-9]+(-[0-9]+)?` sobre el worktree entero, con `openspec/changes/archive/`:
  **595 apariciones en 170 ficheros** (el explorador decía «~60»: era corto por un orden de magnitud).
- Con línea inicial en 300 o más: **139 en 60 ficheros**. Con línea inicial en 274-299: **41 en 24**.
  Insertar dos líneas dentro del bloque desplazaría todas las posteriores a `:282`.
- Dentro del bloque, **21** citas apuntan a una línea concreta: `:276` (la entrada de
  `escalado_a_revision`) y `:278` (la de `escalado_a_comercial`); varias más citan `:276-281` y `:274-282`
  como «las tres entradas» (`openspec/config.yaml:1427`, `:1443`, `:1940`, `:2400`, `:2593`;
  `docs/sdd/ENTRADA.md:216`, `:1044`).
- **Desfase que ya existe y no es de esta tanda:** la spec viva `openspec/specs/derivacion-avisos/spec.md:81`
  y `:656`, y `packages/shared/src/sla.test.ts:93`, citan el bloque como `transitions.ts:267-276`; y
  `packages/shared/src/sla.ts:66` y `:70` citan `:268` y `:271`. Hoy el bloque es `:274-282` y la frase
  «subirla al inmediato superior» está en `:275`. Nada se puso rojo porque las líneas existen y tienen texto.
- `cargos\.ts:[0-9]+`: **57 apariciones en 20 ficheros**.

## 5 · Ambigüedades y lectura elegida

| # | Ambigüedad | Lectura |
|---|---|---|
| A1 | «deriva» ¿propone o impone? | Propone, como las tres existentes; el maestro usa «proponen» (`R08.4.md:2005`). Pregunta para Gerencia |
| A2 | ¿`users.cargo` o `cargo_permiso`? | `users.cargo`, el mecanismo existente. Riesgo: dato de producción no verificable desde aquí |
| A3 | «reasignación manual por un administrador» | Cambiar la casilla al ejecutar una transición. No hay operación de reasignar en sitio |
| A4 | «al técnico que lo tenía» | `primerDerivado`, que el maestro iguala a Aprobación (`R08.4.md:1619`). No es literalmente «el derivado anterior a la solicitud» |
| A5 | Sin Director Técnico activo | Cae al heredado: derivar no frena un ticket (`packages/shared/src/transitions.ts:96`) |
| A6 | Varios Directores Técnicos | El primero por nombre (`apps/desk/src/lib/personas.ts:76-79`) |
| A7 | El cargo nuevo no tiene consumidor todavía | Lo pide la decisión y la nota 6 del plan; habilita que el respaldo de 1E nombre el cargo en el tipo |
| A8 | La fila dice sólo «Solicitud repuestos» | La letra de Gerencia y `R08.4.md:1619` incluyen el retorno en «Entrega de Repuestos» |

## 6 · Regla 13, decisión a decisión

Una sola decisión del cliente: **rellenar** la casilla «Derivado a» al abrir el formulario
(`apps/desk/src/components/TransitionPanel.tsx:87-94`). Línea del servidor que la impone: **ninguna**; el
servidor valida que la persona enviada esté activa (`apps/desk/server/services/ticketService.ts:138-142`)
y nada sobre quién es. Es comodidad, no guarda, igual que las tres propuestas ya construidas. El cliente
no bloquea ni avisa nada nuevo.
