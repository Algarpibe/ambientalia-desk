---
tanda: F1F-03
motivo: ""
capacidad: [tickets-core]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `tiempos-ficha-cliente`

## 1. Qué fila atiende y qué parte

F1F-03 (aceptación con servicios reales), contenido que añadió `decision/f1b08-cierre-sin-capturas` (Gerencia, 17/10):
lo que falte o difiera de Zoho Desk se corrige antes del 09/12. Aquí, la caja «Tiempo promedio de operación» de la ficha
de cliente, anotada para la bandeja en `docs/sdd/TRASPASO_2026-10-08.md:1243-1246` (P-3 del informe de archivo de
`fecha-migracion-fuera-de-cifras`). `cierra: no`: F1F-03 es la aceptación con cuatro servicios reales
(`decision/f1f03-criterio-aceptacion`), que sigue pendiente.

## 2. Medición (antes de proponer), sobre `ac2d4ef`

**El cliente.** `apps/desk/src/components/ClienteDetalle.tsx:192` rotula «Últimos 6 meses». `:193` y `:194` pintan
«Tiempo de primera respuesta» y «Tiempo de respuesta» con el literal `"00:00"`: no hay cálculo detrás. `:195` pinta
`resolucion`, que se formatea en `:124-128` desde `data.resolucionPromedioMs`; si llega `null`, `:126` también pinta
`'00:00'`. La barra de `Tiempo` (`:75`) decide su ancho comparando con `'00:00'`.

**El servidor.** `apps/desk/server/db/directory.ts:67-68` (`conResolucion`) llama a `resolucionPromedioMs`
(`packages/shared/src/cierreEnCifras.ts:45-57`) con TODOS los tickets del contacto o de la cuenta
(`directory.ts:21-30`, `ticketsLite`: `WHERE contact_id|account_id = $1`, **sin filtro de fecha**). La función se queda
con los `statusType === 'Closed'` (`cierreEnCifras.ts:51`), descarta el cierre puesto por la migración
(`:52`, `cierreQueCuenta`, RQ-TC-69) y promedia `cierre − creación`. **No filtra por fecha**: el rótulo «Últimos 6
meses» promete algo que el servidor no hace.

**Datos para la primera respuesta y la respuesta.** En la base hay materia prima: `conversations` con `author_type`,
`kind`, `is_public` y `commented_time` (`packages/zoho-sync/src/db/schema.sql:45-49`), `activities`
(`:210-225`) y `ticket_history` con `event_name` y `event_time` (`:244-253`). **Lo que no consta es la definición:**
ningún fichero del repositorio ni del maestro dice qué es «primera respuesta» ni «respuesta» ni cómo las medía Zoho
(barrido de `first_response`, `primera respuesta`, `responseDue`, `tiempo de respuesta` en `apps/`, `packages/`,
`openspec/`, `docs/sdd/` y la R08.4.md). Lo único que el maestro dice de una columna parecida es que la descarta: G.7
lista la columna 10, «tiempo de respuesta del cliente», entre las doce no relevantes
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:6366`). Hipótesis no comprobable desde aquí:
Zoho las calculaba con su API de métricas por ticket; no hay acceso local a la base ni a Zoho para contrastarlo.

## 3. Qué se construye

1. **La ventana de seis meses se aplica en el servidor** (S-1). `resolucionPromedioMs` recibe `ahora` y sólo promedia los
   tickets cuyo cierre que cuenta cae en los últimos `MESES_VENTANA_RESOLUCION = 6` meses. El cierre de la migración
   sigue fuera (RQ-TC-69), también dentro de la ventana.
2. **Primera respuesta y respuesta: «Sin datos»** (S-2). No se calculan: no hay definición escrita que lo sostenga, y
   una cifra inventada sería peor que el `00:00` actual. La ficha deja de mostrar un `00:00` falso.
3. **Resolución sin cierres en la ventana: «Sin datos»** (S-3), no `00:00`: hoy un `null` del servidor se pinta como una
   media de cero horas.
4. **El rótulo sale de `packages/shared`**: la ficha pinta «Últimos {MESES_VENTANA_RESOLUCION} meses», la misma constante
   que usa el servidor.

**Por qué el filtro en el servidor y no cambiar el rótulo.** Las dos vías son pequeñas, pero no son iguales:

- Cambiar el rótulo es una línea de un `.tsx`, que está fuera de la red de pruebas (F0-00): no admite rojo previo bajo
  `strict_tdd`, y la mutación «quitar el filtro de fecha» que pide el encargo no tendría nada que mutar. Además rompe la
  paridad con Zoho Desk, que es lo que la fila persigue.
- El filtro son unas líneas en `packages/shared` con prueba, un parámetro con valor por omisión en dos funciones del
  servidor y ningún cambio de ruta ni de contrato JSON. Cumple lo que el rótulo ya promete.

Gana el filtro: es poco más código y el único de los dos que se puede probar.

## 4. Supuestos reversibles (para la lista semanal)

| # | Supuesto | Cómo se revierte |
|---|---|---|
| S-1 | La ventana se aplica en el servidor sobre el **instante del cierre que cuenta**, no sobre la creación del ticket | Cambiar en `resolucionPromedioMs` el instante que se compara con el inicio de la ventana |
| S-2 | Primera respuesta y respuesta muestran «Sin datos»: no hay definición escrita en el repositorio ni en el maestro | Con una definición de Gerencia, calcularlas en `packages/shared` y enviarlas en el detalle |
| S-3 | La resolución sin cierres en la ventana muestra «Sin datos», no `00:00` | El literal de `ClienteDetalle.tsx:126` |
| S-4 | «Seis meses» son seis meses de calendario hacia atrás desde `ahora`, en UTC, con el límite inferior incluido | `inicioVentanaResolucion` en `cierreEnCifras.ts` |
| S-5 | Sin límite superior: un cierre con fecha futura (dato erróneo) cuenta | Añadir `fin <= ahora` en la misma función |

## 5. Fuera de alcance

- Calcular primera respuesta y respuesta: necesita una definición de Gerencia (S-2).
- El ancho fijo de la barra (60 % para cualquier cifra, `ClienteDetalle.tsx:75`): es decorativo; se anota para la bandeja.
- La «Calificación de satisfacción» fija a «0 %» (`ClienteDetalle.tsx:174`): mismo molde que los tiempos, otra caja; se
  anota para la bandeja.
- Análisis, indicadores e informe de contrato: no leen `resolucionPromedioMs`.
