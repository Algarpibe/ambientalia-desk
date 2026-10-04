# Exploración: F1B-04 sin accesorios — rotulación, lista de novedades y foto obligatoria de entrada

Origen: Engram `sdd/recepcion-rotulacion-foto-entrada/explore` (obs. 1323, 2026-10-03). El explorador no tenía
escritura. Este fichero lo transcribe la fase de propuesta, **con cada cita comprobada contra el árbol del
worktree** (rama `recepcion-rotulacion-foto-entrada`, de `f55b7d9`). Lo que la comprobación cambió va marcado
**[CORREGIDO]**. Lo que no se pudo comprobar lleva la palabra «hipótesis».

## 1. La letra

- **Rotulación** — `decision/f1b04-rotulacion` (`openspec/config.yaml:2920-2934`): «La recepción registra una
  confirmación «Rotulado y guardado» con persona, fecha y hora; es obligatoria para completar la recepción. La
  etiqueta física lleva el código del ticket […] La ubicación no se registra antes del corte». Maestro:
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1239`.
- **Lista de novedades** — `decision/f1b04-desplegables` (`openspec/config.yaml:2936-2951`): la observación de la
  remisión de entrada pasa a lista de tipos de novedad con selección múltiple: Sin novedad · Golpe o abolladura en
  la carcasa · Rayón o daño estético · Pantalla o display dañado · Conector o puerto dañado · Falta un accesorio ·
  Embalaje inadecuado o dañado · Humedad, suciedad o contaminación visible · Sello o precinto roto · Otro (texto
  obligatorio). «Servicio Técnico puede ajustar la lista antes de construirla; después, los cambios los hace el
  Director Técnico.» Maestro: `R08.4.md:1240`. La consecuencia (5) de esa decisión dice: «Es dato mantenible, no
  constante del código» (`openspec/config.yaml:2947`).
- **Foto obligatoria** — E-123 (`docs/sdd/ENTRADA.md:1514-1521`): «En la remisión de entrada, el registro
  fotográfico es siempre obligatorio, haya o no novedad: al menos una foto del equipo, una de los accesorios y una
  del embalaje con el que llegó. Si se marca una novedad, se añade su foto como hasta ahora.» Maestro:
  `R08.4.md:1241` («más la foto de cada novedad marcada») y `R08.4.md:2276-2281`. La mitad de SALIDA queda fuera
  (fila condicionada, `openspec/config.yaml:3479-3480`).
- **Orden de ejecución** — `decision/orden-tres-tandas-03-10` (`openspec/config.yaml:3749-3768`): F1B-04 SIN
  accesorios; «si el cambio no termina la fila, lleva `cierra: no`».
- **Fila del plan** — `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84`.

**[CORREGIDO] La mitad de entrada de E-123 no tiene clave `decision/` propia en `openspec/config.yaml`.** El
explorador la daba por cerrada por E-143. Comprobado: `decision/trabajo-del-01-10-antes-del-corte-sin-fila`
(`openspec/config.yaml:3463-3484`) sólo nombra la mitad de salida (`:3479`, `:3483`), y una búsqueda de «E-123» en
el fichero da esas dos líneas y ninguna más. Lo que sostiene la mitad de entrada es el maestro vigente
(`R08.4.md:1241`, `:2278-2279`), la fila del plan (línea 84 del plan R01.4, citada arriba) y la consecuencia (2) de
`decision/orden-tres-tandas-03-10` (`openspec/config.yaml:3759-3761`). No contradice ninguna decisión cargada,
pero el literal de Gerencia vive sólo en la bandeja y en el maestro.

## 2. Lo ya construido (`openspec/changes/archive/2026-09-25-foto-solo-con-novedad/`, F1B-04, `cierra: no`)

- Columna `public.remisiones.hay_novedad` (`packages/zoho-sync/src/db/schema.sql:509`).
- Predicado `faltaFotoPorNovedad` (`packages/shared/src/remision.ts:104-112`).
- Sexta puerta de `/enviar` (`apps/desk/server/routes/remision.ts:287-293`), antes de `reclamarEnvio` (`:297`).
- Pregunta Sí/No en el formulario (`apps/desk/src/components/CrearRemision.tsx:276-290`), sin guarda de servidor
  para la obligación de contestar: declarado como regla 13, punto 2 (`CrearRemision.tsx:97-101`).
- Pruebas: `apps/desk/server/fotoNovedad.test.ts`.
- Accesorios por lista cerrada del modelo, ya construidos (`apps/desk/server/routes/remision.ts:55-58`,
  `:191-197`).

Resta de la fila: rotulación, lista de novedades, foto obligatoria por categoría. Los accesorios desde el catálogo
de artículos (E-100) quedan fuera.

## 3. Lo que NO existe hoy

- Ninguna columna ni guarda de rotulación.
- Ninguna lista de novedades: `observaciones` es texto libre (`CrearRemision.tsx:271-274`;
  `apps/desk/server/routes/remision.ts:249`).
- Ninguna categoría de foto: `public.remision_fotos` no tiene la columna
  (`packages/zoho-sync/src/db/schema.sql:294-302`); `addFoto` no la recibe
  (`apps/desk/server/db/remisiones.ts:189-199`); la ruta de subida tampoco
  (`apps/desk/server/routes/remision.ts:378-388`).

## 4. Diseño recomendado por el explorador, punto por punto

1. **[CORREGIDO — no se adopta]** Lista como constante en `packages/shared`. Contradice la consecuencia (5) de
   `decision/f1b04-desplegables`. La propuesta la diseña como dato: tabla `public.catalogo_novedades`.
2. Columnas nuevas, aditivas y `NULL`-ables: `public.remisiones` gana `novedades jsonb`, `novedad_otro text`,
   `rotulado_at timestamptz`, `rotulado_por text`; `public.remision_fotos` gana `categoria text` y `novedad text`.
   Seis `ALTER` calificadas. El recuento del guardián (`packages/zoho-sync/src/db/migrate.test.ts:374-386`) pasa
   de 44 a 50, calificadas de 21 a 27 (las de `public`, de 16 a 22). Sin relleno. **[CORREGIDO]** El explorador
   decía «sin tablas nuevas»: con la lista como dato hay UNA tabla nueva, y el recuento de
   `migrate.test.ts:282-287` pasa de 40 a 41 (`public`, de 27 a 28) y `PUBLIC_TABLES`
   (`packages/zoho-sync/src/db/migrate.ts:70-73`) gana un nombre.
3. `hay_novedad` derivado en el servidor desde las novedades. `observaciones` se COMPONE con las etiquetas más
   «Otro: …», para que listado, CSV, hilo y documento sigan igual. El payload hacia n8n
   (`apps/desk/server/remisionWebhook.ts:5-24`, `:45`) no gana campos.
4. Marcador de «formulario nuevo»: `novedades IS NOT NULL`. `NULL` = legado o sin declarar → exento, mismo molde
   que RQ-RE-17. Se conserva `faltaFotoPorNovedad` para el cliente viejo en caché. Agujero declarado: omitir
   `novedades` en la API evita las guardas nuevas (es E-081, `docs/sdd/ENTRADA.md:1182-1188`, e IV-12).
   **[CORREGIDO]** El explorador contaba «22 pruebas de `/enviar` (11 + 11)»: son 22 apariciones del texto
   «/enviar» en los dos ficheros, no 22 pruebas. `fotoNovedad.test.ts` tiene 6 `it` en 3 `describe`;
   `remisiones.test.ts` tiene 70 apariciones de `it(`.
5. Guardas de contenido en `/enviar` (escalón C, donde hoy está la sexta puerta, antes de `reclamarEnvio`): fotos
   por categoría y rotulado. En el alta, sólo validación de forma, colocada A < C < D: tras el serial
   (`apps/desk/server/routes/remision.ts:154-157`) y antes del `409` (`:174-183`). Sin tocar IV-12 (`:127`,
   `:155`, `:197`, `:220`).
6. Rotulado: casilla en el formulario; el servidor fija `rotulado_por = req.user.name` y `rotulado_at = now()`.
7. No desplazar citas: lógica nueva en módulos nuevos, pruebas en fichero nuevo, sustitución línea a línea.
   **[CORREGIDO — remedido]** El explorador contaba 142 citas en 32 ficheros y 37 de la prueba. Medido con `grep`
   sobre el worktree entero, sin excluir `archive/`: el patrón `routes/remision\.ts:[0-9]+` da **182 apariciones
   en 69 ficheros**; `remision\.ts:[0-9]+` (que suma el homónimo de `packages/shared`) da **371 en 101**;
   `remisiones\.test\.ts:[0-9]+` da **136 en 58**.

## 5. Patrón de catálogos existente (comprobado para la corrección del punto 1)

- Las tablas `public.catalogo_*` se crean calificadas (`packages/zoho-sync/src/db/schema.sql:323`, `:330`, `:339`,
  `:359`, `:392`, `:410`, `:423`).
- `schema.sql` **no contiene ningún `INSERT`**; sí contiene una sentencia de datos, un `UPDATE` idempotente
  (`:320`). `migrate` parte el fichero por punto y coma y es tolerante por sentencia
  (`packages/zoho-sync/src/db/migrate.ts:19-36`): una sentencia que falla se salta con un `console.error`.
- Las rutas de administración del catálogo son específicas, no genéricas: lista blanca de tres entidades
  (`apps/desk/server/routes/catalogo.ts:31-33`), escritura sólo de super administrador (`:68`, `:79`, `:92`),
  lectura de sesión (`:58-61`). No hay ruta ni pantalla genérica a la que sumar una lista nueva.
- Precedentes de dato mantenible SIN pantalla: `public.calendario_cierres` («el INSERT lo hace Alfonso
  directamente en la base», `schema.sql:473`) y `public.gases_patron` («alta directa del Director Tecnico (sin
  pantalla)», `schema.sql:630`).
- Existe un mecanismo de permiso por cargo que nombra al Director Técnico
  (`packages/shared/src/cargos.ts:27-35`), reutilizable para una futura ruta de mantenimiento.
- La unicidad en los catálogos se comprueba con `SELECT` previo y no con `ON CONFLICT`, por una limitación de
  pg-mem con `INSERT … SELECT $n` (`apps/desk/server/db/catalogo.ts:157-158`). Que pg-mem acepte `ON CONFLICT`
  con valores literales en `schema.sql` es **hipótesis**.

## 6. Ambigüedades

- (a) ¿Una foto por CADA novedad marcada (`R08.4.md:1241`) o al menos una foto de novedad
  (`decision/f1b04-desplegables`: «obligatoria cuando se marca cualquier novedad»)? Se construye a la letra más
  estricta y se apunta la pregunta. No es supuesto.
- (b) Cuándo se confirma «Rotulado y guardado»: en el formulario antes de enviar, o como acto posterior. La
  etiqueta `.dymo` la emite n8n al enviar (`packages/shared/src/types.ts:637-641`), así que el orden cronológico
  es dudoso. Supuesto: casilla en el formulario.
- (c) «Completar la recepción» no tiene evento en el código. Supuesto: es enviar la remisión.
- (d) «Sin novedad» excluye a las demás. Supuesto: sí.
- (e) Que la etiqueta lleve el código del ticket es del flujo n8n: no verificable desde el repositorio.
- (f) «Falta un accesorio» solapa con el checklist «Incluye».
- (g) Quién edita la lista después de construirla, y dónde: no hay pantalla.
- (h) La categoría de la foto no viaja a n8n: Drive no la ve.

## 7. Paradas

Ninguna. No toca datos existentes de producción (tabla nueva y columnas nuevas sin relleno), no cuesta dinero y no
contradice ninguna decisión de `openspec/config.yaml`.

## 8. Estimación del explorador

Código ≈ 350 (≈ 140 en `.tsx`, sin red de pruebas), pruebas ≈ 380, barrido de citas ≈ 40. Tres lotes. La
propuesta la rehace con la tabla de catálogo, que el explorador no contaba.
