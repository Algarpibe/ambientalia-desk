# Informe de archivo — `reloj-sla-esperas` (F1C-06, `cierra: si`)

**Qué parte de F1C-06 cubre y qué deja fuera:** cubre la fila «C7 + C9 esperas que paran el reloj del SLA»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:104`): la lista propia del reloj de `decision/c7-reloj-sla`, el
cálculo de los dos tiempos (SLA sin pausas y total que esperó el cliente) y su presentación en el cuadro de mando (Análisis).
La parte técnica de C9 ya estaba cerrada por F1A-04, y las dos piezas de C9 que el maestro da por abiertas ya existen en el
código (`proposal.md` §8, R-1; supuesto S-9). Deja fuera, a propósito: las alarmas (independientes del reloj, maestro M1.7),
el tablero, la ficha de cliente, `/api/indicadores` y el OTD global que descontará las esperas, que es funcionalidad nueva.

## Qué quedó construido

- **Regla pura** `packages/shared/src/relojSla.ts` (nueva, exportada al final de `index.ts`): `ESTADOS_QUE_PARAN_EL_RELOJ`
  declarada a mano con las cinco de c7 (`packages/shared/src/relojSla.ts:24`), sin ningún valor de la vista (sólo
  `import type { Estado }`); `Finalizado` y `Anulado` como terminales; y `tiemposDelReloj` (`:50`), que mide cada tramo con
  `horasHabilesEntre` y devuelve horas hábiles del SLA y del total, o `null` sin entradas. `Pendiente` y `Pendiente de
  facturar` corren.
- **Servidor** `apps/desk/server/db/relojSla.ts` (nuevo): `secuenciaDelReloj` (`apps/desk/server/db/relojSla.ts:36`) junta
  la época de la app (`ticket_transitions`, con la foto de creación como estado inicial) y la de Zoho (`ticket_history`, vía
  `etapasDesdeHistoria`), y da `null` si la historia no llega al estado actual; `tiemposDelRelojPorTicket` (`:65`) hace tres
  consultas fijas y sólo para los cerrados en estado terminal (S-D1, S-D2).
- **Análisis:** `getAnalisisRows` añade `slaHoras` y `totalHoras` en sitio; `computeAnalisis` promedia sobre los mismos
  tickets que `tiempoPromedioDias`, en días de 9 h a un decimal (`mediasDelReloj`, `packages/shared/src/analisis.ts:99`);
  la pantalla pinta «Tiempo prom. SLA (sin pausas)» y «Tiempo prom. total del cliente» (`apps/desk/src/components/Analisis.tsx:99`
  y `:100`). `tiempoPromedioDias` no cambia.
- **`estados.ts`:** los comentarios que decían que el reloj para en los bodegajes (`:30-33` y `:117-118` en `db73518`)
  dicen hoy que tiene su propia lista, en sitio y con el mismo número de líneas.

## Specs vivas

`openspec/specs/tickets-core/spec.md`: RQ-TC-73 a RQ-TC-77 añadidos **al final** (4.323 → 4.522 líneas, +199 −0; RQ-TC-73
empieza en `openspec/specs/tickets-core/spec.md:4325`). Fusión con un script de un solo uso (`herramientas/fusiona-rse.mjs`,
fuera del repositorio), ensayada con `--dry` y comprobada bloque a bloque: los cinco bloques vivos son idénticos a los de la
delta y el prefijo de la spec queda intacto. Ninguna capacidad nueva (R-2). Ninguna cita existente apunta más allá de la
línea 4.323, así que nada se desfasa.

## Regla de mutación 4

`estados.ts` 6/6, `types.ts` 2/2 y `apps/desk/server/analisis.ts` 4/4 (inserciones = borrados); `packages/shared/src/analisis.ts`
4 en sitio y 8 al final; `index.ts` y la spec viva sólo crecen al final; `Analisis.tsx` añade dos líneas tras la última cita
viva. `registro.test.ts` cambia 2/2 en sitio y vuelve a «ocho en curso», con F1C-06 cerrada por archivo.

## Intentos (registro de `gentle-ai sdd-attempt`)

| # | Unidad | Commits | Medida (`--no-renames`) |
|---|---|---|---|
| 1 | planificación 1 | `6a4f76e` | 377 contra `db73518` |
| 2 | planificación 2 | `26a86a2` | 219 |
| 3 | lote 1 (shared) | `bef8ae3` | 466 |
| 4 | lote 2 (servidor y cliente) | `d2b530b` | 429 |
| 5 | verify | `3cc1c25`, `46dfc2c` | 207 |
| 6 | archive | este commit y el de la reconciliación | revisable: la fusión (199) y este informe; el resto es la mudanza |

En cada uno el registro anotó la misma cifra que la medida; ninguno pasó de la válvula de 720; nada sin trackear.

## Códigos, mutaciones, paquete y migración

- Typecheck, lint (0 errores; los 165 avisos de partida) y detector de citas en 0 en cada intento de código. `npx vitest run`
  salió 0 al cerrar el lote 2 y en la corrida que fija el sobre del verify (5.054 en verde); otras corridas salieron 1 SIN
  ninguna aserción rota, por «Test timed out in 5000ms» de `apps/desk/server/citas/cli.test.ts` (sola pasa) o por el error del
  trabajador «Timeout calling onTaskUpdate». `main` (`db73518`) sale igual el mismo día: es carga de la máquina (verify §11).
- Mutaciones: 18 del lote 1, todas rojas; 18 del lote 2, 17 rojas y M14b equivalente (las consultas ya filtran los cerrados);
  11 propias del verify con un control verde, dos supervivientes (V4 redondeo, V6 destino nulo) que cerraron dos pruebas en
  `3cc1c25`. Las seis del encargo están entre ellas.
- Paquete: `index-BOdjeBia.js` 420.931 bytes → `index-BcuUoQJz.js` 420.931 (+0); el trozo de Análisis, 8,82 kB → 9.040 bytes.
- **Sin migración, sin escritura nueva, sin interruptor.**

## Verify

PASS WITH WARNINGS, 0 CRITICAL: 5/5 requisitos y 24/24 escenarios (23 por prueba, 1 por caracterización). W1 y W2 cerrados;
S1 (continuidad entre épocas), S2 (agregación cuadrática por ticket, irrelevante hoy) y S4 quedan como sugerencias.

## Tareas de persona (no se dan por hechas al archivar)

Medir en producción, sólo lectura, cuántos tickets cerrados tienen historia que llega a su estado actual; actualizar el
maestro (M1.6, Anexo B.4 y los pasajes que dicen que C7 se construye después del corte); revisar S-1 a S-9, S-D1 y S-D2 en
la lista semanal. Dueños y destino en `proposal.md` §10.
