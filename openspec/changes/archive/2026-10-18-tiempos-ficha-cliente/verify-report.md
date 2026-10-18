# Informe de verify — `tiempos-ficha-cliente` (F1F-03, `cierra: no`)

Verificado sobre `f42dc72` (partida `ac2d4ef`, planificación `a9052a2`), en el worktree de la rama. **Veredicto: PASS.**
0 CRITICAL · 2 WARNING · 4 SUGGESTION. Modo: strict TDD (`npm test`, vitest).

## 1. Códigos

| Código | Resultado |
|---|---|
| `npm test` | 0 · 288 ficheros pasan (3 omitidos), 4.799 pruebas pasan (11 omitidas) |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 · 0 errores, 165 avisos (el tope de partida) |
| detector de citas `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 · 13 abreviadas rotas informativas (no bloquean; la línea base de citas está vacía; ninguna de los ficheros tocados) |

## 2. Escenario → prueba (RQ-TC-70, 7 escenarios; todos con prueba que pasó en tiempo de ejecución salvo los declarados de persona)

| Escenario | Evidencia |
|---|---|
| Cierre de hace más de seis meses no entra | `packages/shared/src/ventanaResolucion.test.ts:15-21`; M1, M5 |
| El límite inferior cuenta; un ms antes, no | `ventanaResolucion.test.ts:22-28`; M3 |
| Cierre de la migración no cuenta dentro de la ventana | `ventanaResolucion.test.ts:29-36`; servidor: `apps/desk/server/fichaClienteVentana.test.ts:33-41`; M2 |
| Sin cierres en la ventana, `null` | `fichaClienteVentana.test.ts:42-46`; `ventanaResolucion.test.ts:37-39` |
| Contacto y cuenta aplican la ventana con el `ahora` que reciben | `fichaClienteVentana.test.ts:33-41` (cuenta y contacto); M1, M4, M5 |
| Ventana de seis meses; el rótulo lee la constante | constante en 6: `ventanaResolucion.test.ts:11-14`; consumo en la ficha: **verificación de persona** declarada (`ClienteDetalle.tsx` fuera de la red, F0-00; tarea P-3) |
| La ficha no inventa cifras | **verificación de persona** declarada (P-3); el `null` del servidor lo prueban las dos de arriba |

## 3. Evidencia TDD (rojo reproducido)

Worktree temporal sobre `a9052a2` con `node_modules` por junction (el alias de `vitest.config.ts:12` lee el código local, no el del worktree de apply):
`npx vitest run packages/shared/src/ventanaResolucion.test.ts apps/desk/server/fichaClienteVentana.test.ts` → **6 caen, 1 pasa** (7 en total).
Caen 4 de `ventanaResolucion.test.ts` (constante/inicio, fuera de ventana, límite, sin cierres) y las 2 de `fichaClienteVentana.test.ts`; pasa la de «el cierre de la migración» (caracterización: sin ventana, ese ticket ya quedaba fuera). Carpeta y worktree eliminados (`git worktree list` sólo muestra main y la rama).

## 4. Mutaciones reproducidas (`mut.mjs`, cuatro ficheros de prueba, 22 pruebas; restauradas, `git status --short` vacío)

| # | Resultado |
|---|---|
| M0 control | 22 de 22 en verde |
| M1 sin filtro de fecha (`cierreEnCifras.ts:55`) | rojo: 3 de `ventanaResolucion.test.ts` + 2 de `fichaClienteVentana.test.ts` |
| M2 `conResolucion` pasa `new Map()` (`directory.ts:68`) | rojo: 1 de `fichaClienteVentana.test.ts` + 2 de `cierreMigracionEnCifras.test.ts` |
| M3 límite `<=` | rojo: sólo «el límite inferior cuenta» (`ventanaResolucion.test.ts`) |
| M4 el servidor usa `new Date()` y no el `ahora` | rojo: 2 de `fichaClienteVentana.test.ts` |
| M5 ventana de 7 meses | rojo: 4 de `ventanaResolucion.test.ts` + 2 de `fichaClienteVentana.test.ts` |

Ninguna sobrevivió; coincide con `apply-progress.md`.

## 5. Regla invariable 13 (tabla D6 contra `ClienteDetalle.tsx`)

El `.tsx` no filtra, no resta, no promedia: `:124-128` sólo formatea `data.resolucionPromedioMs` (`h:mm`), `null` → «Sin datos» (`:126`); el rótulo sale de `MESES_VENTANA_RESOLUCION` importado de shared como valor (`:2`, `:192`); la barra compara con el literal «Sin datos» (`:75`, decorativa). La ventana y el cierre de la migración los impone el servidor: `cierreEnCifras.ts:50,55` vía `directory.ts:68`, con prueba (§2). «Sin datos» fijo en primera respuesta y respuesta (`:193-194`) es ausencia declarada, no guarda (D6, S-2). Coincide decisión a decisión con D6.

## 6. Líneas y citas (regla de mutación 4)

`wc -l` frente a `ac2d4ef`: `directory.ts` 69→69, `ClienteDetalle.tsx` 223→223, `cierreEnCifras.test.ts` 73→73, `cierreMigracionEnCifras.test.ts` 107→107; `cierreEnCifras.ts` 57→69 (lo nuevo desde `:44`, el docblock, y `:50`, `:55`, `:60-69`).
Barrido `grep -rnoE` (incluido `openspec/changes/archive/`): ninguna cita a `cierreEnCifras.ts:`, `cierreEnCifras.test.ts:` ni `cierreMigracionEnCifras.test.ts:`. Las de `directory.ts:` son, salvo dos, de `routes/directory.ts` (otro fichero, intacto); las dos de `db/directory.ts` (`TRASPASO_2026-10-08.md:1108` → `:23`, `Paquete_de_Despliegue_2026-09-29/30/10-01` → `:57`) apuntan a líneas no editadas y el fichero conserva su longitud. Las de `ClienteDetalle.tsx:36` y `:41` (CLAUDE.md:347 y otras) apuntan a líneas no editadas (`:36` `esEspera`, `:41` `/espera/i`). `TRASPASO_2026-10-08.md:1152` cita `ClienteDetalle.tsx:124-126` **en `73bd52f`** (Caso B, ancla de revisión): el `:126` de hoy cambió de `'00:00'` a `'Sin datos'`, la cita fechada sigue siendo cierta de su revisión. Las citas de los archivados a las líneas 18 y 22 de `ClienteDetalle.tsx` son anteriores (Caso B/C). **Ninguna cita de hoy sin ancla se desplazó.** Las abreviadas no se barren con `grep` (hipótesis: ninguna relevante; el detector da 13 abreviadas rotas informativas, que no bloquean).

## 7. Cabecera R-1 y capacidad

`proposal.md:1-9`: siete campos (`tanda: F1F-03`, `motivo: ""`, `capacidad: [tickets-core]`, `maestro: []`, `cierra: no`, `toca_maestro: no`, `origen_cabecera: declarada`). `tickets-core` está en `openspec/config.yaml:105` (`capabilities`); el cambio no crea capacidad nueva (R-2 no aplica).

## 8. Hallazgos

**CRITICAL:** ninguno.

**WARNING**
- W1 · `tasks.md` 3.1, 3.2, 3.3 siguen sin marcar. 3.1 (barrido) y 3.2 (este informe) quedan hechos aquí; 3.3 es el archive. Son tareas de cierre posteriores al verify, no trabajo pendiente del apply; marcar 3.1 y 3.2 al asentar.
- W2 · `apply-progress.md` («Rojo antes del verde») dice «cinco de `ventanaResolucion.test.ts`» en rojo y «1 de caracterización en verde»: el reproducido es 4 de shared + 2 de servidor = 6 en rojo y 1 en verde (la de shared de la migración). El total (6 y 1) es correcto; el desglose por fichero no.

**SUGGESTION**
- S1 · El delta `specs/tickets-core/spec.md` lleva «— ROJO» en cinco títulos de escenario (marca de planificación). Quitarlas al fusionar en `openspec/specs/tickets-core/spec.md`.
- S2 · `ClienteDetalle.tsx:123` (comentario) se tocó además de lo que dice D3; en sitio, sin mover líneas. Inocuo.
- S3 · El literal «Sin datos» está duplicado en `:75`, `:126`, `:193`, `:194`; si cambia el texto, la barra deja de ir a 0 % sin que nada se ponga rojo (`.tsx` fuera de la red). Candidato a constante local; fuera de alcance.
- S4 · Sin límite superior (S-5): un cierre con fecha futura cuenta. Ya está en la lista de supuestos (P-1); ninguna prueba lo fija a propósito.

## 9. Tareas de personas (no se dan por hechas al archivar)

P-1 (revisar S-1..S-5), P-2 (definir primera respuesta y respuesta), P-3 (verificación de persona de la ficha tras el despliegue: «Sin datos» ×2, rótulo «Últimos 6 meses», resolución «Sin datos» sin cierres en la ventana).
