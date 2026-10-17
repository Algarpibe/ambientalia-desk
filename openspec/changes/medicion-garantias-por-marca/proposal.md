---
tanda: F1B-13
motivo: ""
capacidad: [tickets-core]
maestro: ["Anexo D nº 7"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `medicion-garantias-por-marca`

Construye la parte de medición de `decision/anexo-7-garantia-proveedor` (`openspec/config.yaml:2340`; respuesta textual
en `:2345`: «Se miden el valor recuperado frente al reclamado por marca y las piezas con fallas repetidas, que alimentan
la taxonomía ISO 14224»). Fila: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93` y `:217`. El cambio
anterior de la fila las dejó fuera (`openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:6-10`).

*Sobre la cabecera.* `cierra: no`: siguen fuera el valor reclamado tomado del costo de la OVI y el envío físico por
remisión sin ticket, que depende de F1B-16. `toca_maestro: no`: la medición es lo que el maestro ya pide. Sin capacidad
nueva: la ficha vive en `tickets-core` (RQ-TC-44 a RQ-TC-48, `openspec/specs/tickets-core/spec.md:2420-2808`).

## 1 · Intención

La ficha guarda los datos, pero nadie ve qué se recupera de cada fabricante ni qué piezas fallan una y otra vez: la
única lectura es por ticket (`apps/desk/server/routes/garantiaProveedor.ts:31`). Al terminar, cualquier usuario con
sesión abre una vista con lo reclamado frente a lo recuperado por fabricante y las piezas con fallas repetidas.

## 2 · Lo que hay hoy (medido)

- Ficha: `packages/shared/src/garantiaProveedor.ts:43-64`; tabla `packages/zoho-sync/src/db/schema.sql:727-749`. Un
  «no» no es ficha: `estado` nulo por el CHECK de `schema.sql:748`.
- `fabricante`: texto, obligatorio en un «sí» (`garantiaProveedor.ts:125-132`); `pieza_referencia` y `pieza_serial`
  opcionales (`:133-136`); `valor_reclamado` numérico opcional ≥ 0 (`:137-138`), origen `manual` (`:36-37`); `estado`
  (`:13`), `resultado` (`:14`) y `valor_recuperado` (`:60`), obligatorio al resolver y 0 en «rechazada» (`:175-185`).
- **No hay columna «marca» en la ficha.** La marca es el `fabricante`, que el panel propone desde `tickets.marca`
  (`apps/desk/server/db/garantiaProveedor.ts:145`, `:153`) y la persona puede editar. Tampoco hay modelo en la ficha;
  el ticket sí lo tiene (`packages/zoho-sync/src/db/schema.sql:28`).
- Análisis e Indicadores piden `requireAdmin` (`apps/desk/server/routes/analisis.ts:5`, `:11`;
  `apps/desk/server/routes/indicadores.ts:41`): ponerla ahí cambiaría quién la ve.

## 3 · Alcance

**Dentro**

1. Función pura en `packages/shared`: de las fichas, la medición por fabricante y las fallas repetidas (§4).
2. Lectura de todas las fichas «sí» en la capa de datos y un `GET` nuevo con `requireAuth`, sin más permiso (S-4).
3. Vista nueva de sólo lectura, con acceso desde `apps/desk/src/components/Header.tsx`, sin umbrales ni semáforos.

**Fuera — y por eso `cierra: no`**

- El valor reclamado tomado del costo de la OVI (sigue a mano; P-1 del cambio anterior).
- El envío físico de la pieza por remisión sin ticket (F1B-16).
- La carga de las fallas repetidas en la taxonomía ISO 14224 (`decision/anexo-56-taxonomia`, otra fila): sólo se
  muestran. Tampoco: migración, columna nueva, interruptor, exportación, filtros por fecha ni gráficos.

## 4 · Reglas de cómputo (la spec las escribe como requisito)

1. Sólo cuentan fichas `reclama = true`. Los «no» no entran en ninguna cifra.
2. **Reclamado** = suma de `valor_reclamado` de todas las fichas «sí», en cualquier estado.
3. **Recuperado** = suma de `valor_recuperado` de las fichas «resuelta». Las abiertas y enviadas no recuperan nada
   todavía; las rechazadas cuentan como reclamadas con 0 recuperado.
4. Las fichas sin `valor_reclamado` **se cuentan aparte** por fabricante; no suman 0 en silencio.
5. Por fabricante se dan además: número de fichas, cuántas siguen sin resolver y el desglose de resultados.
6. **Falla repetida**: misma `pieza_referencia` del mismo `fabricante` en 2 o más fichas «sí» (S-2). Las fichas sin
   referencia no cuentan.

## 5 · Enfoque — regla invariable 13

- **`packages/shared`**: la función pura, en módulo nuevo o al final de `garantiaProveedor.ts` (sin desplazar líneas
  citadas; lo decide el diseño). Agrupación, normalización y sumas viven sólo aquí.
- **Servidor**: consulta de las fichas «sí» y ruta `GET` que devuelve el resultado de la función. Molde de registro:
  `apps/desk/server/routes/garantiaProveedor.ts:28`.
- **Cliente**: el `.tsx` sólo pinta: no agrupa, no suma, no decide qué es repetido. Su única decisión, enseñar el
  acceso a todo usuario con sesión, es la que impone `requireAuth`. Fuera de la red de pruebas (F0-00): sin rojo previo.
- Sin guardas nuevas de escritura ni pruebas de posición: la única guarda de la ruta es la sesión (`401`).

## 6 · Supuestos reversibles

| # | Supuesto | Cómo se revierte |
|---|---|---|
| S-1 | «Por marca» = por `fabricante` de la ficha, recortado y sin distinguir mayúsculas; no se pliegan acentos | Agrupar por `tickets.marca`, o plegar acentos en `shared` |
| S-2 | Falla repetida: misma referencia del mismo fabricante (ambos recortados, sin mayúsculas) en ≥ 2 fichas «sí», cualquier estado, sin ventana de tiempo | Añadir el modelo del ticket a la clave; o una ventana de N meses; o el umbral |
| S-3 | Importes en pesos, sin conversión (hipótesis heredada del S-4 del cambio anterior) | Guardar moneda en la ficha |
| S-4 | Vista nueva, lectura para todo usuario con sesión, como la lectura de la ficha (`routes/garantiaProveedor.ts:18`, `:31`) | Añadir `requireAdmin` o un predicado de `shared` a la ruta y al acceso |
| S-5 | Sin umbrales, porcentajes de alarma ni colores | Añadirlos cuando Gerencia fije un umbral |
| S-6 | El cociente recuperado/reclamado sólo se da cuando lo reclamado es mayor que 0 | Otra presentación del caso vacío |

Ninguno contradice `openspec/config.yaml`: la decisión no fija qué es «falla repetida» ni ventana.

## 7 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `tickets-core` — requisitos nuevos desde RQ-TC-65 (el último hoy es RQ-TC-64,
`openspec/specs/tickets-core/spec.md:3857`): reglas de cómputo, falla repetida, lectura y permiso de la vista.

## 8 · Áreas afectadas

| Área | Impacto | Líneas estimadas |
|---|---|---|
| `packages/shared/src/` función + prueba + exportación | nuevo o añadido al final | 60 + 130 |
| `apps/desk/server/db/garantiaProveedor.ts` | consulta añadida al final | 15 |
| `apps/desk/server/routes/garantiaProveedor.ts` (o fichero nuevo) + prueba de servidor | ruta nueva | 20 + 90 |
| `apps/desk/src/api/client.ts` | función nueva | 10 |
| `apps/desk/src/components/` vista nueva | nuevo | 130 |
| `Header.tsx` y montaje de la sección | acceso nuevo | 15 |

Un lote, ~470 líneas (válvula 720). Si se insertan líneas en ficheros citados, el cierre barre sus citas (regla 4).

## 9 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| El mismo fabricante escrito de formas distintas parte su grupo | Media | S-1 normaliza; plegar acentos o catálogo, si hace falta |
| Pocas fichas en producción: cifras poco significativas al principio | Alta | Se enseñan los recuentos junto a las sumas |

## 10 · Marcha atrás

Revertir los commits: sin migración ni escritura, la tabla y las fichas no cambian.

## 11 · Criterios de éxito

- [ ] Con fichas abiertas, enviadas, resueltas y rechazadas, lo reclamado suma todas y lo recuperado sólo las resueltas.
- [ ] Una ficha sin valor reclamado aparece en su recuento aparte; un «no» no aparece en ninguna cifra.
- [ ] Dos fichas con la misma referencia del mismo fabricante salen como falla repetida; sin referencia, no.
- [ ] El `GET` responde `401` sin sesión y el mismo resultado a cualquier usuario con sesión.
- [ ] El `.tsx` no contiene agrupaciones ni sumas propias.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde.

## 12 · Ronda de preguntas

`execution_mode: auto` (`openspec/config.yaml:22-30`): no se para. Sin gate pendiente; S-1 a S-6, a la lista semanal.
