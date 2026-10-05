---
tanda: F1F-01
motivo: ""
capacidad: [zoho-sync]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Interruptor de entorno para aplicar la migración de tickets abiertos (E-231)

## Por qué

E-231 (`docs/sdd/ENTRADA.md`): `POST /api/admin/migrar-tickets-abiertos` está detrás de `requireSuperAdmin`, que en
`apps/desk/server/routes/admin.ts` es un alias de `requireAdmin` (`apps/desk/server/auth/middleware.ts:26-29`). Cualquier
administrador puede, por tanto, aplicar una migración que toca todos los tickets abiertos de producción. La regla de
secretos de `CLAUDE.md` pide que un interruptor que enciende un escritor **nazca cerrado**.

## Qué cambia

- Variable `MIGRACION_TICKETS_HABILITADA`, leída en `packages/zoho-sync/src/config.ts` como `=== 'true'`: ausente o con
  cualquier otro valor, apagada.
- Con la variable apagada, la ruta sigue respondiendo la pasada en seco; con `aplicar=true` responde `403` con un mensaje
  que nombra la variable, **sin leer ni escribir** la base.
- Posición en el orden total de F1B-10: la comprobación es escalón **B** (permiso), así que corre detrás de la sesión y del
  rol y **delante** de la validación de `corte` y `aplicar` (escalón C) y de cualquier lectura de la base.
- `DEPLOY.md` documenta la variable (qué enciende, qué se rompe si se pone mal, y la línea que hay que añadir al fichero de
  ejemplo de entorno). El paquete de despliegue del 05/10 gana la condición «encender sólo el día del corte y apagar
  después».

## Qué no cambia

El ejecutor (`apps/desk/server/db/migracionTicketsAbiertos.ts`), el `409` de la negativa y la pasada en seco. No toca
`openspec/specs/`: el delta de este cambio añade RQ-ZS-19, que se fusiona al archivar.

## Diseño

El interruptor es un middleware (`interruptorMigracion`) en la cadena de la ruta, detrás de `requireSuperAdmin` y delante
del manejador, definido al final de `apps/desk/server/routes/admin.ts`. Así ninguna línea citada de `admin.ts`, `config.ts`,
`appHarness.ts` ni del fichero de pruebas de la ruta se desplaza (regla de mutación 4): todo hunk es en sitio, compensado
(+1/−1 absorbiendo una línea en blanco) o posterior a la última línea citada.

## Supuestos (regla de ejecución, reversibles)

- S-1 · `tanda: F1F-01` con `cierra: no`: es una guarda de la herramienta de F1F-01, no trabajo fuera del plan.
- S-2 · El interruptor sólo gobierna `aplicar=true`; la pasada en seco queda libre porque no escribe.
- S-3 · `aplicar` con un valor inválido sigue dando `400`: el interruptor sólo se mira cuando se pide aplicar de verdad.

## Fuera de alcance

Distinguir un rol de superadministrador real (E-231 lo deja abierto: decide Gerencia). La edición del fichero de ejemplo de
entorno la hace la persona, con la línea que da `DEPLOY.md`.
