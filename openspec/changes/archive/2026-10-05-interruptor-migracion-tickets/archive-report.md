# Informe de archivo — `interruptor-migracion-tickets`

**Tanda:** F1F-01 · **`cierra: no`** · **Fecha:** 2026-10-05 · **Rama:** `interruptor-migracion-tickets`, nacida de `main` en `9e5c853`. Sin fusionar al escribir este informe.

**Cobertura de la fila (R-1):** F1F-01 cubre aquí la guarda de E-231 sobre la herramienta de migración: aplicar exige `MIGRACION_TICKETS_HABILITADA=true`, que nace cerrada. Deja fuera lo mismo que dejaba `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/archive-report.md:5` —el cotejo de la hoja de Google y la ejecución sobre producción, tareas de persona— y la distinción de un rol de superadministrador real, que E-231 deja a Gerencia. Por eso no cierra la fila.

## Qué se entregó

- `packages/zoho-sync/src/config.ts:65`, `:123` — el campo y su lectura `=== 'true'`.
- `apps/desk/server/routes/admin.ts:222` — el middleware `interruptorMigracion` en la cadena de la ruta, detrás de `requireSuperAdmin`; definido en `apps/desk/server/routes/admin.ts:250-255`. Responde `403` a `aplicar=true` con la variable apagada, antes de validar `corte` y de leer la base: escalón B del orden total de F1B-10.
- `apps/desk/server/app.ts:57` — pasa el valor de la configuración a las rutas de administración.
- Pruebas: siete nuevas en `apps/desk/server/migracionTicketsAbiertosRuta.test.ts` (desde `:145`) y una en `packages/zoho-sync/src/config.test.ts:32-36`; las cuatro existentes que aplican de verdad encienden el interruptor.
- `DEPLOY.md`, apartado 11, y el paquete de despliegue del 05/10 (§1.2, §3 y §5.1) con la condición «encender sólo el día del corte y apagar después».
- RQ-ZS-19, fusionado al final de `openspec/specs/zoho-sync/spec.md` (`:1086`), bloque idéntico al delta (`fusiona.mjs`, sin `--dry`).

Ninguna línea citada de `admin.ts`, `config.ts`, `appHarness.ts` ni del fichero de pruebas de la ruta se desplazó: cada hunk es en sitio, compensado (+1/−1 absorbiendo una línea en blanco) o posterior a la última línea citada.

## Comprobaciones

- Pruebas: 3.355 pasadas y 7 omitidas; typecheck sin errores; lint sin avisos nuevos en los seis ficheros tocados (los mismos que en `main`).
- Mutaciones sobre la versión final, todas en rojo y restauradas: invertir la condición (8 rojas), moverla tras validar (1), moverla tras leer la base (2), abrir el valor por defecto (1).
- Verificación del analista sobre `01d8bb5`: quitar el middleware de la cadena pone 3 pruebas en rojo, las dos de posición incluidas; fusión de ensayo limpia.

## Intentos y medida

| Intento | Commit | Líneas |
|---|---|---|
| Construcción, **sin intento del registro** | `01d8bb5` | 217 (+203/−14, `git diff --shortstat --no-renames 9e5c853 01d8bb5`) |
| Archivo (intento 1 de `gentle-ai sdd-attempt`) | el de este informe | medida en el asiento |

**La construcción se hizo sin intento**, y el registro no la ha medido. El encargo la pedía como «cambio pequeño en su worktree», y se trató como trabajo directo con propuesta R-1 en lugar de abrir `gentle-ai sdd-attempt begin` antes de tocar código. Es un incumplimiento de la regla de ejecución, que mantiene el registro de intentos para todo cambio bajo ciclo SDD. **No se repite** porque la medida que el registro habría hecho se reproduce exacta con la orden de la tabla —el worktree sólo tiene ese commit sobre `9e5c853` y no había nada sin trackear—, y porque rehacer la construcción dentro de un intento sólo para que el registro la vea movería 217 líneas que ya verificó el analista, sin cambiar un byte. Desde ahora, un cambio con código abre su intento antes de la primera edición, también si el encargo lo llama pequeño.

## Abierto, y archivar no lo cierra

- E-231 en su mitad de rol: `requireSuperAdmin` sigue siendo un alias de `requireAdmin` (`apps/desk/server/routes/admin.ts:17`). El interruptor acota **cuándo** se puede aplicar, no **quién**.

## Tareas de personas — archivar no las da por hechas

| Tarea | Dueño | Dónde queda escrita |
|---|---|---|
| Añadir al fichero de ejemplo de entorno las dos líneas de `DEPLOY.md` apartado 11 | La persona que publica | `docs/sdd/Paquete_de_Despliegue_2026-10-05.md` §5.1 |
| Dejar la variable **ausente** en el gestor de secretos hasta el día del corte; encenderla ese día y apagarla al terminar | La persona con acceso a producción | `docs/sdd/Paquete_de_Despliegue_2026-10-05.md` §5.1 |
