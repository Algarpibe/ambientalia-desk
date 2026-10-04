---
tanda: F1B-04
motivo: ""
capacidad: [remisiones]
maestro: ["M1.2", "M2.1"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: recepción con rotulado, lista de novedades y foto obligatoria en la remisión de entrada

Segundo cambio de F1B-04 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84`), **sin accesorios**
(`decision/orden-tres-tandas-03-10`, `openspec/config.yaml:3749-3768`). Exploración: `exploration.md` de esta
carpeta (Engram obs. 1323), con sus citas comprobadas en el worktree sobre `f55b7d9`.

`cierra: no`: quedan los accesorios desde el catálogo de artículos (E-100) y la mitad de salida de E-123.

## Intención

Tres cosas que la recepción no registra hoy:

1. **Nadie confirma que el equipo quedó rotulado y guardado.** No hay columna ni guarda.
2. **La observación de entrada es texto libre** (`apps/desk/src/components/CrearRemision.tsx:271-274`;
   `apps/desk/server/routes/remision.ts:249`). No se puede contar ni filtrar.
3. **La foto sólo se exige con novedad declarada** (`packages/shared/src/remision.ts:110-112`;
   `apps/desk/server/routes/remision.ts:287-293`). Gerencia lo corrigió: en la remisión de entrada es siempre
   obligatoria (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1241`, `:2278-2279`).

La letra: `decision/f1b04-rotulacion` (`openspec/config.yaml:2920-2934`), `decision/f1b04-desplegables`
(`:2936-2951`) y el maestro (`R08.4.md:1239-1241`).

## Alcance

**Dentro**

1. **Rotulado.** Confirmación «Rotulado y guardado» con persona, fecha y hora fijadas por el SERVIDOR. Sin
   ubicación.
2. **Novedades.** Lista de tipos de novedad con selección múltiple, como DATO: tabla `public.catalogo_novedades`
   sembrada con los diez de la letra. «Otro» exige texto.
3. **Foto obligatoria siempre.** Al menos una de equipo, una de accesorios y una de embalaje, más una por CADA
   novedad marcada.
4. Ruta de lectura de la lista para el formulario.
5. Formulario adaptado y delta de la spec `remisiones`.

**Fuera**

- Accesorios desde el catálogo de artículos (E-100) y remisión de salida con sus fotos (E-120, fila condicionada,
  `openspec/config.yaml:3479-3480`).
- **Pantalla y rutas de escritura para mantener la lista.** No existe mantenimiento genérico de catálogos al que
  sumarla: las rutas son específicas, con lista blanca de tres entidades
  (`apps/desk/server/routes/catalogo.ts:31-33`). Mientras tanto la lista se edita con SQL directo, como
  `public.calendario_cierres` y `public.gases_patron` (`packages/zoho-sync/src/db/schema.sql:473`, `:630`).
  Pregunta 2.
- Ubicación de almacén (M5.3, después del corte).
- El payload hacia n8n (`apps/desk/server/remisionWebhook.ts:5-24`): es contrato y no cambia.
- IV-12: no se corrige ni se reordena ninguna guarda existente del alta.
- Relleno de filas existentes: ninguno.
- Pruebas de interfaz (F0-00).

## Capacidades

- **Nuevas:** ninguna. R-2 no se activa.
- **Modificadas:** `remisiones`. RQ-RE-08 (la sexta puerta cambia de regla, siguen siendo seis), RQ-RE-13
  (categoría de la foto), RQ-RE-17, RQ-RE-18 y RQ-RE-19 (quedan como vía de legado). Requisitos nuevos: catálogo
  de novedades, rotulado, foto por categoría.

## Enfoque

### La lista es dato, no constante

Corrige al explorador. La consecuencia (5) de `decision/f1b04-desplegables` dice «Es dato mantenible, no constante
del código» (`openspec/config.yaml:2947`).

- `CREATE TABLE IF NOT EXISTS public.catalogo_novedades`, calificada, al final de `schema.sql`: `clave` (PK),
  `etiqueta`, `orden`, `activo`, `excluye_demas` y `exige_texto`. Las dos marcas son el comportamiento: «Sin
  novedad» excluye a las demás; «Otro» exige texto. El servidor decide leyendo las marcas, nunca la clave.
- **Siembra** en el propio `schema.sql`, idempotente por `clave`: no reinserta ni pisa lo que alguien haya editado.
  Hoy el fichero no tiene ningún `INSERT`, pero sí una sentencia de datos idempotente (`schema.sql:320`). La forma
  exacta (`ON CONFLICT DO NOTHING` o `WHERE NOT EXISTS`) la decide el diseño: que pg-mem acepte la primera es
  **hipótesis** (`apps/desk/server/db/catalogo.ts:157-158`).
- Una novedad se RETIRA con `activo = false`, no borrando la fila: una fila borrada volvería en el siguiente
  arranque.
- La remisión guarda una **instantánea** (clave y etiqueta) de lo marcado: es un documento, no una vista (RQ-RE-01).
- `PUBLIC_TABLES` gana el nombre (`packages/zoho-sync/src/db/migrate.ts:70-73`).

### Columnas, todas aditivas, `NULL`-ables y sin relleno

`public.remisiones`: `novedades jsonb`, `novedad_otro text`, `rotulado_at timestamptz`, `rotulado_por text`.
`public.remision_fotos`: `categoria text`, `novedad text`. Seis `ALTER` calificadas, al final del fichero.

### Marcador de «formulario nuevo»

`novedades` presente en el cuerpo del alta (y `novedades IS NOT NULL` en la fila) activa las reglas nuevas. Ausente
= legado: sigue la regla anterior (`faltaFotoPorNovedad`). Cubre remisiones históricas, pendientes previas al
despliegue y un cliente viejo en caché.

**Agujero declarado:** una petición que omita `novedades` evita rotulado, lista y fotos mínimas. Es E-081
(`docs/sdd/ENTRADA.md:1182-1188`) e IV-12. No se corrige aquí. Lo que sí mejora: con el campo presente, una lista
vacía se rechaza, así que «sin contestar» y «Sin novedad» dejan de confundirse.

### Regla 13, decisión a decisión

| Decisión | La impone el servidor en | El cliente |
|---|---|---|
| Claves de novedad válidas y activas | alta, sustitución de la línea vacía 158 de `routes/remision.ts` | comodidad: pinta la lista servida |
| Lista vacía rechazada | ídem | comodidad |
| «Sin novedad» no convive con otras | ídem, por `excluye_demas` | comodidad: desmarca |
| «Otro» exige texto | ídem, por `exige_texto` | comodidad |
| Rotulado obligatorio | alta (ídem) y `/enviar` (`:287-293`, sustitución en sitio) | comodidad |
| Persona, fecha y hora del rotulado | alta: `req.user` y `now()`; nada del cuerpo | no decide |
| `hay_novedad` y `observaciones` | alta (`:249-250`, en sitio): derivados; lo que mande el cuerpo se ignora | no decide |
| Fotos mínimas y una por novedad | `/enviar` (`:287-293`), antes de `reclamarEnvio` (`:297`) | comodidad: no deja crear ni «continuar sin fotos» |
| Categoría válida; novedad de la foto marcada en la remisión | subida (`:384-387`, en sitio) | comodidad |

Ninguna queda sólo en el cliente. Toda la lógica vive en un módulo nuevo de `packages/shared`, que consumen las
dos orillas.

### Orden de guardas (escalón C)

- **Alta:** forma de las novedades y rotulado, DESPUÉS del serial (A, `routes/remision.ts:154-157`) y ANTES del
  `409` de remisión pendiente (D, `:174-183`). Cumple A < C < D sin mover ninguna guarda existente. Los dos puntos
  de IV-12 (`:127`, `:220`) quedan como están.
- **`/enviar`:** una sola puerta, la sexta, con orden interno fijo: rotulado → fotos mínimas → foto por novedad.
  Detrás de anulada y ya enviada (B, `:279-286`), delante de `reclamarEnvio` (D, `:297`).
- **Subida:** la categoría, detrás del `415` (`:383`).

### `faltaFotoPorNovedad` y la sexta puerta

Se conservan para las filas de legado. La puerta sigue siendo una: llama a un predicado nuevo que delega en el
viejo cuando `novedades` es `NULL`. El texto del `422` de legado no cambia. E-123 supera la regla para las
remisiones del formulario nuevo; el cambio archivado se queda como está.

### Regla de mutación 4

Medido con `grep` sobre el worktree, sin excluir `archive/`: `routes/remision\.ts:[0-9]+` da 182 apariciones en 69
ficheros; `remision\.ts:[0-9]+` (suma el homónimo de `packages/shared`), 371 en 101;
`remisiones\.test\.ts:[0-9]+`, 136 en 58.

Estrategia: **cero líneas desplazadas** en los ficheros citados.

- Lógica nueva en ficheros nuevos (shared, `db`, `services`, ruta de lectura).
- Pruebas nuevas en fichero nuevo. `remisiones.test.ts`, `fotoNovedad.test.ts` y `packages/shared/src/remision.ts`
  no se editan.
- `routes/remision.ts`, `db/remisiones.ts`, `types.ts`, `migrate.ts`, `migrate.test.ts`, `app.ts`: sustitución en
  sitio, línea por línea. `schema.sql`: sólo al final.
- **Cierre:** `git diff --numstat` de cada fichero citado con inserciones = borrados, y `wc -l` igual que en
  `f55b7d9`. Si alguno difiere, barrido completo de sus citas contra el fichero, más el pase de las abreviadas de
  `openspec/specs/remisiones/spec.md`.

## Supuestos aplicados (reversibles)

- **(s1) La casilla va en el formulario y bloquea crear y enviar.** «Completar la recepción» no tiene evento en
  el código; la remisión enviada es lo que mueve el ticket. Reversible: pasaría a ser un acto posterior.
- **(s2) «Sin novedad» excluye a las demás.** Marcar las dos es contradictorio. Es una marca de la tabla.
- **(s3) La categoría de la foto no viaja a n8n.** El flujo `Remisiones_ST_3.13` es producción y su contrato no
  se toca.
- **(s4) El texto libre de observaciones desaparece del formulario nuevo**, salvo el de «Otro». Es la letra:
  «pasa a una lista».
- **(s5) La lista se edita por SQL** hasta que haya pantalla (precedentes citados).

## Ronda de preguntas de la propuesta (para `docs/sdd/ENTRADA.md`; no bloquean)

1. **¿Una foto por cada novedad marcada, o basta una foto de novedad?** El maestro dice «la foto de cada novedad
   marcada» (`R08.4.md:1241`); `decision/f1b04-desplegables` dice «cuando se marca cualquier novedad». Se
   construye la más estricta. **No es supuesto.**
2. **¿Quién edita la lista, y dónde, hasta que haya pantalla?** Opción barata para después: una ruta con el
   permiso por cargo que ya existe (`packages/shared/src/cargos.ts:27-35`).
3. **«Falta un accesorio» ¿exige foto?** Fotografiar una ausencia es raro. Se construye a la letra: sí.
4. **Equipo que llega sin accesorios o sin embalaje:** ¿se exige igual la foto de esa categoría? A la letra: sí.
5. **¿El rotulado se confirma antes de enviar?** La etiqueta la genera el flujo AL enviar
   (`packages/shared/src/types.ts:637-641`), así que hoy se confirmaría antes de imprimirla.

## Tareas de persona (fuera del recuento; archivar no las da por hechas)

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Confirmar la lista de diez antes de publicarla | Servicio Técnico | `docs/sdd/ENTRADA.md` |
| Comprobar que la etiqueta `.dymo` lleva el código del ticket | quien administra el flujo n8n | `docs/sdd/ENTRADA.md` |
| Comprobar el formulario en la aplicación (`.tsx` sin red de pruebas) | Servicio Técnico | comprobaciones de persona de la spec |

## Estimación y lotes (válvula 720 por lote, techo 800 por intento)

Los artefactos de planificación se commitean aparte, antes del primer intento, y no cuentan.

| Lote | Contenido | Código | Pruebas (×1,8) | Casillas y progreso | Total |
|---|---|---|---|---|---|
| L1 | Tabla, siembra, columnas, guardián, lectura de la lista y su ruta | 95 | 170 | 50 | ≈ 315 |
| L2 | Alta: novedades, rotulado, derivados, posición | 120 | 215 | 55 | ≈ 390 |
| L3 | Fotos por categoría, puerta de `/enviar`, posición | 95 | 190 | 55 | ≈ 340 |
| L4 | Cliente: `client.ts` y `CrearRemision.tsx` (170, sin pruebas) y ayuda pura probada (30) | 200 | 55 | 40 | ≈ 295 |

Cuatro lotes. L1 + L2 juntos darían ≈ 705: demasiado cerca de la válvula. Verify y archive van en intentos propios.

## Pruebas existentes que se pondrán rojas

- `packages/zoho-sync/src/db/migrate.test.ts:282-287`: 40 tablas → 41; `public`, 27 → 28.
- `packages/zoho-sync/src/db/migrate.test.ts:374-386`: 44 `ALTER` → 50; calificadas 21 → 27; las identidades
  calificadas ganan `public.remision_fotos`.
- **Hipótesis:** `remisiones.test.ts` y `fotoNovedad.test.ts` siguen verdes por la vía de legado. Se comprueba en
  L2 y L3 antes de escribir código.

## Mutaciones que la tanda reproduce

- **Posición (1):** novedades antes del serial; novedades después del `409`; puerta de `/enviar` después de
  `reclamarEnvio` (tras el `422`, corregir y reenviar de inmediato da éxito y `enviado_at` sigue `NULL`); puerta
  antes de anulada y ya enviada; permutar el orden interno; categoría antes del `415`.
- **Fichero vigilado (2), ensuciando `schema.sql`:** quitar `public.` al `CREATE` de la tabla; quitarlo a una
  `ALTER` de `remision_fotos`; borrar una fila de la siembra; cambiar una marca; añadir un `UPDATE` de relleno.
- **Dato:** apagar `exige_texto` de «Otro» o desactivar una fila EN LA TABLA cambia lo que el servidor acepta.
  Prueba que se lee el dato y no una constante.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| La siembra falla en silencio (`migrate` es tolerante) y la lista queda vacía | Media | Prueba de las diez filas tras `migrate`; con lista vacía el alta responde con error explícito |
| Remisión creada que no puede completar sus fotos | Media | El cliente no deja crear sin ellas; reintento de subida; anulación por administrador |
| La mitad de entrada de E-123 no tiene clave `decision/` en `config.yaml` | — | Señalado a supervisión; la sostienen el maestro, el plan y `orden-tres-tandas` |
| Desplazamiento de citas | Alta si se descuida | Cero líneas desplazadas, comprobado al cierre |
| Lista publicada sin confirmar por Servicio Técnico | Media | Tarea de persona; corregir después es SQL sobre una tabla nueva |

## Plan de vuelta atrás

Revertir los commits. Tabla y columnas son aditivas: quedan sin uso y sin efecto. El cliente viejo sigue
funcionando por la vía de legado. `DROP` sólo si Gerencia lo pide.

## Criterios de aceptación (strict TDD)

- [ ] Tras `migrate`: diez novedades, en orden, con las dos marcas donde tocan; reaplicar no duplica.
- [ ] Alta con novedades: clave desconocida o inactiva, lista vacía, «Sin novedad» con otra, «Otro» sin texto y
      rotulado ausente dan `422`; correcto, guarda instantánea, `observaciones` compuesta y `hay_novedad` derivado.
- [ ] Persona y hora del rotulado salen del servidor aunque el cuerpo traiga otras.
- [ ] `/enviar` con formulario nuevo: sin las tres fotos mínimas o sin la de alguna novedad, `422` sin reclamar.
- [ ] Remisión de legado: se comporta como hoy.
- [ ] El cuerpo enviado a n8n no gana ninguna clave.
- [ ] Posición y mutaciones de arriba, reproducidas y anotadas.
- [ ] Ningún fichero citado cambia de número de líneas.

## Nota sobre `toca_maestro: si`

El explorador proponía `no`. El maestro ya recoge las tres reglas, pero dice de la foto «se ajusta antes del
corte» (`R08.4.md:1241`, `:2281`) y marca lo construido con `[CONSTRUIDO]` (`:1242`): al terminar, esas marcas de
estado quedan atrás. Sólo es eso; el texto se entrega al expediente, no al `.docx`. La sección M1.2 de la cabecera
sale del `maestro_pasaje` de la decisión: **hipótesis**, no se remidió el encabezado.
