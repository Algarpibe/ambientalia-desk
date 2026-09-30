---
tanda: F1C-05
motivo: ""
capacidad: [permissions]
maestro: ["M1.9.1", "Anexo D nº 39"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: permisos por cargo (F1C-05 mínima)

Nivel CARGO de F1C-05, antes de F1B-07. Base `e591454`. Exploración en
`openspec/changes/permisos-por-cargo/exploration.md`. Modo `auto`: no hay ronda de preguntas; los supuestos
S-1…S-8 son la superficie revisable.

## Intención

- `decision/c10-permisos-cargo` (`openspec/config.yaml:1927-1947`): «la base sigue siendo el área… el cargo sólo
  restringe, con una lista corta de excepciones». `decision/c10b-gerente-director` (`:2584-2598`) cierra la
  nomenclatura: siete cargos, y «gerente comercial» ES Director Comercial.
- Hoy el permiso es sólo de área (`packages/shared/src/permissions.ts:4-7`); el admin pasa todo (`:5`).
  `liberacion_sin_factura` es de área `Comercial` a secas (`packages/shared/src/transitions.ts:246`).
- El código conoce dos cargos, como texto (`transitions.ts:276`, `:278`), y `Director Comercial` da 0 en
  `packages/` y `apps/` (`*.ts`, `*.tsx`), medido hoy.
- `public.users.cargo` (`packages/zoho-sync/src/db/schema.sql:115`) es texto libre que FIRMA la remisión
  (`apps/desk/server/auth/routes.ts:67-68`): no sirve de autoridad. Además `getSessionUser` no lo selecciona
  (`apps/desk/server/auth/sessions.ts:17`): una guarda sobre la sesión nunca vería un cargo.

## Alcance

**Dentro**
1. `packages/shared/src/cargos.ts` (nuevo): los siete cargos como lista cerrada, nombres exactos de c10b; tabla de
   excepciones como dato.
2. Columna `public.users.cargo_permiso`, separada de `users.cargo`; `ALTER TABLE public.users` calificada, al
   final de `schema.sql` (hoy 596 líneas).
3. Lectura del campo en `USER_SELECT` (`apps/desk/server/auth/users.ts:14`), `rowToPublicUser` (`:19`),
   `getSessionUser` (`sessions.ts:17`) y `UserPublic` (`packages/shared/src/types.ts:211-223`), con prueba que
   falle si la sesión no lo trae.
4. Alta y edición (`routes.ts:55-72`, `:74-114` en `e591454`): validación contra la lista en servidor (422 si no está); sólo
   admin (ya `requireAdmin`, `:55`, `:74`; se prueba el 403 de un no-admin).
5. Tres restricciones con matriz probada:
   - (a) `liberacion_sin_factura` → Director Comercial, impuesta en `apps/desk/server/services/ticketService.ts:129-131`.
   - (b) crear OVI de garantía → Director Técnico (`decision/ovi-garantia-autor`, `:1543-1558`): el acto no existe
     (F1B-03); queda la primitiva probada `puedeCrearOVIGarantia`, sin llamador.
   - (c) prioridad Top 5 → Director Comercial (`decision/top5-manual`, `:1949-1962`): el acto no existe (F1B-07);
     primitiva probada `puedeFijarPrioridadTop5`, que F1B-07 consumirá.
6. Regresión «el cargo sólo restringe» sobre la matriz de `apps/desk/server/permisos.test.ts:41-110`.
7. Cliente: `TransitionPanel.tsx:57` y `UsersAdmin.tsx` consumen `shared`.

**Fuera**
- Regla de las transiciones Decisionales: depende de F1C-04 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:177`;
  `config.yaml:1939`); `Decisional` da 0 en el código.
- Tercer nivel, propietario del registro: aplazado por c10 (`config.yaml:1936`, `:1942`). El plan promete tres
  niveles (`plan:178`): por eso `cierra: no`.
- Migrar alarmas y derivación (`destinatariosDeCargo`, `apps/desk/src/lib/personas.ts:74-78`) al cargo nuevo.
- Motivo y Fecha prevista de la Liberación sin factura (`decision/anexo-33-checkbox`, `:2373-2388`): F1C-02.
- Construir la OVI de garantía (F1B-03) y el Top 5 (F1B-07).
- `canExecuteTransition` y sus otros consumidores (`PanelOvAsociaciones.tsx:82`, `ContratosPanel.tsx:24`): no cambian.

## Capacidades

**Nueva:** ninguna. Se extiende `permissions` (`config.yaml:133-135`, «después por cargo y propietario (C10)»;
su spec ya asigna el hueco a F1C-05 en §4.1). R-2 no aplica; `config.yaml` no se toca.
**Modificada:** `permissions` — nuevo nivel de cargo (lista cerrada, dato de usuario, excepciones, matriz con
cargo); §4.1 pasa de «no distinguido» a implementado para el cargo; RQ-PM-03 gana la aserción del caso que difiere.

## Enfoque

- **Dominio puro en `shared`**: `cargos.ts` con `CARGOS` (siete), tipo `Cargo`, `EXCEPCIONES_POR_CARGO`
  (transición → cargo) y una función compuesta —área Y, si hay excepción, cargo— que `canExecuteTransition` no
  sustituye: la función de área queda intacta.
- **Servidor**: `ticketService.ts:129-131` llama a la compuesta EDITANDO EN SITIO si cabe; el 403 de cargo nombra
  el cargo que hace falta. Si se insertan líneas, barrido de la regla de mutación 4 en el cierre.
- **Regla de mutación 1**: prueba de POSICIÓN del 403 de cargo frente al 403 de área y los 409 vecinos
  (`:125`, `:126-128`) y frente al 422 de `:134`.
- **Matriz**: la prueba pura `:77-81` (60/42, área sola) queda como está. El `esperado` de la matriz HTTP (`:64`)
  consume la compuesta; se añade una aserción de que EXACTAMENTE un caso difiere de la matriz de área (Comercial ×
  `liberacion_sin_factura` sin cargo, 200 → 403), y una matriz con cargo que prueba que nunca amplía (Director
  Comercial de área técnica sigue con 403 fuera de su área).
- **Regla 13 / mutación 3**: cada decisión del cliente nombra su línea de servidor, por escrito. Los `.tsx` están
  fuera de la red de pruebas (F0-00); no se propone `jsdom`.

## Supuestos reversibles (modo `auto`)

- **S-1 · Estricto mientras nadie tenga cargo (opción A).** Sin cargo, nadie ejecuta una excepción salvo el admin
  (`permissions.ts:5`, que sigue igual). (a) Hasta que se asigne en producción, `Liberación sin factura` sólo la
  ejecutan administradores; un Comercial no admin recibe 403 que dice qué cargo hace falta. (b) y (c) no tienen
  llamador hasta F1B-03/F1B-07: hoy no cambia nada observable; al consumirse, misma regla. Se decide DISTINTO que
  el «0 destinatarios» de las alarmas (`apps/desk/server/services/alarmasSla.ts:73-77`, respaldo al área y
  `logger.warn` en `:112-115`) a propósito: un permiso con respaldo al área no restringiría nada hasta la primera
  asignación y luego mordería de golpe. *Reversión:* la tabla de excepciones es dato en `shared`.
- **S-2 · Nombre.** `cargo_permiso` en base y `cargoPermiso` en `UserPublic`: distingue autoridad de firma.
- **S-3 · Sin `CHECK` en base.** La lista vive sólo en `shared` y la valida el servidor; un valor fuera de la lista
  leído de la base se trata como «sin cargo» (falla cerrado). Un `CHECK` sería una segunda copia de la lista.
- **S-4 · `null` es válido** en alta y edición: «sin cargo». Cadena vacía → `null`, como `routes.ts:68`.
- **S-5 · Precedencia.** El 403 de cargo es escalón B, justo detrás del 403 de área y antes de todo 422 (orden
  total de F1B-10).
- **S-6 · Cliente.** `TransitionPanel.tsx:57` oculta la transición al que no tiene el cargo (comodidad legítima
  con el servidor probado); `UsersAdmin.tsx` ofrece los siete más «Sin cargo»; el campo `cargo` de firma sigue libre.
- **S-7 · Los dos literales de `transitions.ts:276`, `:278`** se tipan contra `Cargo`, sin cambio de comportamiento.
- **S-8 · Primitivas sin llamador** (b, c): exportadas y probadas; su prueba dice que hoy no las consume nadie.

## Tarea de persona (regla del ciclo 1, fuera del recuento)

Archivar no la da por hecha.
- **P.1 · Gerencia o administración**: asignar `cargo_permiso` a cada usuario real en producción, empezando por el
  Director Comercial. Dato de producción. Destino: paquete de despliegue de la tanda.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Nadie tiene cargo al desplegar: sólo el admin libera sin factura | Alta | S-1; P.1 justo después de desplegar, con el intervalo aceptado por escrito |
| La sesión no trae el campo y la guarda nunca lo ve | Media | Prueba HTTP con sesión real: Director Comercial → 200 |
| Dos «cargo» divergentes (firma/alarmas/derivación vs. permiso). *Hipótesis:* molde H5 | Media | Registrado, sin destino inventado; que lo asigne quien decida el alcance |
| Desplazar citas de `ticketService.ts` | Media | Edición en sitio; si no, barrido de la regla 4 |
| El `esperado` de la matriz se vuelve tautológico al consumir la compuesta | Media | Aserción de diferencia exacta frente a la matriz de área |

## Previsión de tamaño

Medida: `git diff --shortstat --no-renames` + nuevo sin trackear. Estimado de la exploración: ~600-700 líneas de
código y pruebas.

| Lote | Contenido | Estimación (incl. apply-progress ~60) |
|---|---|---|
| 1 · `shared` | `cargos.ts`, compuesta, primitivas, `UserPublic`, pruebas puras | ~260 |
| 2 · Servidor | Columna, `users.ts`, `sessions.ts`, `routes.ts`, `ticketService.ts`, matriz y posición | ~420 |
| 3 · Cliente y cierre | `TransitionPanel.tsx`, `UsersAdmin.tsx`, `client.ts`, regla 13 por escrito, barrido regla 4 | ~160 |

Verify (~300 del informe) y archive (dos veces la carpeta por el `git mv`, más fusión del delta y
`archive-report`) son intentos aparte; el archive supera 800.

## Nota de despliegue (obligatoria)

Precondición: la columna nueva `public.users.cargo_permiso` nace con el propio despliegue (la crea `migrate` al
arrancar), así que el cargo NO se puede asignar antes. Entre la migración y la primera asignación en la consola de
usuarios, sólo los administradores liberan sin factura. El paquete de despliegue nombra quién asigna el cargo (P.1)
y ese intervalo se acepta por escrito. Corregido por el diseño (`design.md`, «Nadie tiene cargo»).

## Rollback

Revertir los commits del lote. La columna es aditiva y sólo la lee este código; vaciar
`EXCEPCIONES_POR_CARGO` devuelve el comportamiento de área sin tocar la base.

## Criterios de éxito

- [ ] Comercial sin cargo → 403 en `liberacion_sin_factura` que nombra Director Comercial; con el cargo → 200; admin → 200.
- [ ] Matriz HTTP: exactamente un caso difiere de la de área; `:77-81` sigue 60/42.
- [ ] Director Comercial de área técnica → 403 fuera de su área (el cargo nunca amplía).
- [ ] Cargo fuera de la lista → 422 en alta y edición; no admin → 403.
- [ ] Mover el 403 de cargo delante del 409 de estado o detrás del 422 pone la suite en rojo.
- [ ] `puedeCrearOVIGarantia` y `puedeFijarPrioridadTop5` probadas por cargo y admin.

## Cierre esperado

- Línea del `archive-report`: «Cubre de F1C-05 el nivel CARGO: siete cargos en `shared`, dato de usuario
  administrable, `Liberación sin factura` impuesta al Director Comercial y primitivas probadas para OVI de
  garantía y Top 5; deja fuera la regla Decisional (F1C-04), el propietario del registro y la migración de
  alarmas y derivación al cargo nuevo.»
- `toca_maestro: si`: M1.9.1 `[AS-BUILT]` dice que el permiso es por área (`R08.2.md:1714`) y el `[ABIERTO — R05]`
  nombra al «gerente comercial» (`:1715`, `:1723`). Texto para el expediente R08.3 (Anexo D nº 39), sin tocar el `.docx`.
- Barrido de citas de la regla de mutación 4 sobre los ficheros muy citados que se toquen.
