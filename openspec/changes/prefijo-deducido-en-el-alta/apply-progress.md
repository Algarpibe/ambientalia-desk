# apply-progress — prefijo-deducido-en-el-alta (F1B-03)

## Lote 1 · `shared` (tareas 1.1 a 1.16; sin commit, lo hace el orquestador)

Partida `23d9011`. Línea base: `wc -l` `ticketCreate.ts` 49, `ticketCreate.test.ts` 89, `types.ts` 810, `CreateTicket.tsx` 455. Lint: **165 avisos, 0 errores**.
Después: `ticketCreate.ts` **52** (49 + 3 al final, ninguna línea existente se movió; la línea 6, en blanco, pasó a llevar las dos importaciones), `CreateTicket.tsx` 455 (±0).

### Rojos vistos (antes de cada verde)
- `prefijoDeducido`: 11 pruebas rojas, `TypeError: prefijoDeducido is not a function`.
- `TIPOS_SERVICIO` orden exacto de ocho: roja (Protocolo ausente).
- AAMMDD de las 20:00-05:00 bajo `TZ=UTC`: roja, `261015` en lugar de `261014`. La de las 00:30-05:00 y la de `TZ=America/Bogota` nacieron verdes con getters (esperado: no discriminan getters; la segunda discrimina `toISOString` en UTC, M-9b).
- Rojo natural de la fecha vieja: con el verde puesto, `buildCodigoServicio > arma PREFIJO_serie_modelo_AAMMDD` (`new Date(2026, 5, 4)`) dio `260603` contra `260604`. Reescrita con `new Date('2026-06-04T12:00:00-05:00')`.

### Hipótesis resueltas
- 1.10, ciclo `ticketCreate` ↔ `flujos`: **CONFIRMADA**. `ticketCreate`, `flujos` e `invariantesGrafo` (106 pruebas) cargan y pasan, con entrada por cualquiera de los dos módulos.
- `TZ` en caliente: **CONFIRMADA** (Node relee `process.env.TZ` tras cambiarlo; comprobado con `node -e`: 15 → 14). La prueba de Bogotá usa `finally`.

### Mutaciones del lote 1 (todas restauradas; `cmp` byte a byte contra el verde)
| Mutación | Prueba roja | Restaurada |
|---|---|---|
| M-1 HV | Equipo nuevo → HV, la clasificación gana, mismos predicados, alcanzables | sí |
| M-2 SR | Soporte remoto → SR, la clasificación gana, mismos predicados, alcanzables | sí |
| M-3 CG | Calibración → CG, desconocida/vacía, alcanzables | sí |
| M-4 PRO | Protocolo → PRO, desconocida/vacía, alcanzables | sí |
| M-5 MT | resto → MT, fuera de lista, desconocida, predicados, literal exacto, alcanzables | sí |
| M-6 tipo antes que clasificación | «la clasificación gana al tipo» | sí |
| M-7 predicados por `===` | «mismos predicados que el grafo» | sí |
| M-8 plegar caja del tipo | «literal exacto» | sí |
| M-9a getters locales | AAMMDD 20:00-05:00 (la de 00:30 y la de TZ Bogotá siguen verdes: no discriminan getters) | sí |
| M-9b `toISOString` (UTC) | AAMMDD 20:00-05:00 y TZ Bogotá | sí |
| M-14 sin «Protocolo» | orden de ocho; `tsc` TS2322 en `TIPO_PROTOCOLO` (`typecheck` salió 2) | sí |
| M-15 «Protocolo» tras los comodines | orden de ocho y «deja los comodines al final» | sí |

### Supuestos
- Los ficheros del árbol están en CRLF (`w/crlf`); los edité conservando CRLF para no inflar el diff.
- `ticketCreate.test.ts`: lo nuevo (AAMMDD) va al final; `describe('prefijoDeducido')` reemplaza en sitio a `defaultPrefijoFor`. `parseCodigoFromPotential` sigue (lote 3).

### Códigos de salida
`npm test` 0 (276 ficheros pasan, 4681 pruebas, 3 ficheros/11 omitidas), `npm run typecheck` 0, `npm run lint` 0 (165 avisos = línea base), `tsx apps/desk/server/citas/cli.ts` 0.
