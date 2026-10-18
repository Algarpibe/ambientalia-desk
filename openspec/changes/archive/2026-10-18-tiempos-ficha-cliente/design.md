# Diseño — `tiempos-ficha-cliente` (F1F-03, `cierra: no`)

## D1 · La ventana vive en `packages/shared`

En `packages/shared/src/cierreEnCifras.ts`:

- `export const MESES_VENTANA_RESOLUCION = 6`.
- `export function inicioVentanaResolucion(ahora: Date): number`: `ahora` menos seis meses de calendario con
  `setUTCMonth`, en milisegundos (S-4).
- `resolucionPromedioMs(tickets, puestos, ahora: Date)`: el tercer parámetro es **obligatorio**, para que ningún llamador
  se quede sin ventana sin que `tsc` lo diga. Tras `cierreQueCuenta`, un `fin < inicioVentanaResolucion(ahora)` no
  cuenta. Sin límite superior (S-5).

Lo nuevo va al final del fichero o dentro del cuerpo de la función, que es lo último del fichero: ninguna línea citada
se desplaza (el barrido de `cierreEnCifras.ts:` no da ninguna cita en el repositorio).

## D2 · El servidor aplica la ventana con un `ahora` inyectable

`apps/desk/server/db/directory.ts`: `getContactDetail(db, id, ahora = new Date())`, `getAccountDetail(db, id, ahora =
new Date())` y `conResolucion(db, detalle, ahora)`, todo en sitio, sin insertar líneas (69 → 69). La ruta
(`apps/desk/server/routes/directory.ts:75`, `:78`) no cambia: usa el reloj. El contrato JSON no cambia.

## D3 · La ficha sólo pinta

`apps/desk/src/components/ClienteDetalle.tsx`, en sitio (223 → 223):

- `:2`, el import pasa a traer `MESES_VENTANA_RESOLUCION` como valor.
- `:126`, `null` → `'Sin datos'` (S-3).
- `:192`, «Últimos {MESES_VENTANA_RESOLUCION} meses».
- `:193`, `:194`, `"00:00"` → `"Sin datos"` (S-2).
- `:75`, la barra compara con `'Sin datos'` para quedarse en 0 %.

## D4 · Las pruebas existentes se fijan a un `ahora`, en sitio

Las llamadas de `packages/shared/src/cierreEnCifras.test.ts:67`, `:70`, `:71` y de
`apps/desk/server/cierreMigracionEnCifras.test.ts:68`, `:69`, `:74` reciben un `ahora` fijo dentro de la ventana de sus
fechas. Sin eso, la de shared no compila y las del servidor caducarían solas cuando el reloj real dejara sus cierres
(noviembre y diciembre de 2026) a más de seis meses. Ninguna línea se inserta.

Lo nuevo va en ficheros nuevos: `packages/shared/src/ventanaResolucion.test.ts` y
`apps/desk/server/fichaClienteVentana.test.ts`.

## D5 · Mutaciones (todas deben poner rojo y restaurarse)

| # | Mutación | Debe caer |
|---|---|---|
| M0 | control, sin mutar | nada |
| M1 | quitar el filtro de fecha de `resolucionPromedioMs` | `ventanaResolucion.test.ts` y `fichaClienteVentana.test.ts` |
| M2 | meter el cierre de la migración: `conResolucion` pasa un `Map` vacío | `fichaClienteVentana.test.ts` y `cierreMigracionEnCifras.test.ts` |
| M3 | límite estricto (`<=` en vez de `<`) | `ventanaResolucion.test.ts`, el del límite |
| M4 | el servidor ignora el `ahora` recibido y usa el reloj | `fichaClienteVentana.test.ts` |
| M5 | ventana de 7 meses | `ventanaResolucion.test.ts` |

## D6 · Regla invariable 13, decisión a decisión

| Decisión del cliente | Qué hace | Línea del servidor que la impone |
|---|---|---|
| Qué tickets entran en la media y en qué ventana | ninguna: llega hecha | `directory.ts` `conResolucion` → `resolucionPromedioMs` (`cierreEnCifras.ts`) |
| Excluir el cierre de la migración | ninguna: llega hecha | `cierreQueCuenta` dentro de `resolucionPromedioMs` (RQ-TC-69) |
| Rótulo «Últimos 6 meses» | consume `MESES_VENTANA_RESOLUCION` | la misma constante que usa el servidor (regla 13, punto 1) |
| Formato `h:mm` | presentación | no es regla de dominio |
| «Sin datos» si la media es `null` | pinta la ausencia | el `null` lo decide el servidor |
| «Sin datos» en primera respuesta y respuesta | pinta la ausencia | **sin contrapartida, y no es guarda**: no bloquea, no rellena, no avisa. Declara que no hay cifra |
| Ancho de la barra | decorativo | no es regla |
