# Apply-progress · `orden-motivos-anulacion` (intento 2, tareas 2.1-2.4)

## Ficheros (líneas antes → después)
| Fichero | Antes | Después |
|---|---|---|
| `packages/shared/src/anulacion.ts` | 59 | 72 (1-59 intactas; función y 2 constantes al final) |
| `packages/shared/src/anulacion.test.ts` | 186 | 220 (import ampliado en `:4`; `describe` nuevo al final) |
| `apps/desk/src/components/TransitionPanel.tsx` | 267 | 267 (editadas `:8` y `:163`) |

## Rojo (2.1)
`npx vitest run packages/shared/src/anulacion.test.ts`: 23 fallan, 38 pasan (61). Todas por
`TypeError: motivosAnulacionOrdenados is not a function`. Sólo pasaba la prueba del `from` de `anulacion`.

## Verde (2.2)
61/61 en verde con la función añadida.

## Mutaciones (2.3), una a una, restauradas (`cmp` idéntico)
| Mutación | Pruebas que caen | Restaurada |
|---|---|---|
| M1 no reordenar en las esperas | «en %s van primero…» (las 2 esperas) | sí |
| M2a reordenar siempre | «el orden es el base» en 5 estados no espera | sí |
| M2b incluir `Notificación cliente` | «el orden es el base» en `Notificación cliente` | sí |
| M3a sexto motivo | 19 (cinco motivos exactos, orden base, «Otro» último) | sí |
| M3b quitar un motivo | 15 (las mismas) | sí |
| M4 «Otro» fuera del último puesto (no esperas) | 10 («Otro» último, orden base) | sí |
| M4b «Otro» primero en esperas | 4 («Otro» último y orden de esperas) | sí |
| M5 devolver `MOTIVOS_ANULACION` sin copiar | «mutar el resultado en "Notificación cliente"…» | sí |
Ninguna se quedó en verde; no hizo falta reforzar pruebas. Nota: en M3a la constante de esperas llevaba además un
motivo extra por el orden de los `sed`; sigue siendo "añadir un motivo".
Limitación: M5 sólo la caza la prueba de fuera de esperas (dentro de esperas el resultado ya es una lista nueva).

## Consumo (2.4)
`TransitionPanel.tsx`: nombres añadidos al import de `:8` y `f={...}` en `:163` según D3. Sigue en 267 líneas.

## Códigos de salida
- `npm run typecheck`: 0 · `npm run lint`: 0
- `npm test`: 0 · 292 ficheros pasan, 3 omitidos · 4909 pruebas pasan, 11 omitidas
