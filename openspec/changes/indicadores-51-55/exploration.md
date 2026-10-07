# Exploración: indicadores 51 y 55 (`indicadores-51-55`, F1F-05)

Origen: observación 1479 de Engram (`sdd/indicadores-51-55/explore`). El explorador no pudo escribir
fichero; este documento recoge sus hallazgos **después de comprobar cada cita contra el árbol de
`42a4828`**. Lo que no se pudo comprobar lleva la palabra «hipótesis». El resultado de la comprobación
está en §7.

`R08.4.md` es `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`.

## 1. Qué decide Gerencia

- `decision/e171-e172-e173-indicadores-51-55` (`openspec/config.yaml:4083-4112`). Respuesta textual
  (`openspec/config.yaml:4092`): «51: la transición de entrega. 55: las respuestas cargadas de la
  encuesta. Comparación: con la exportación de Zoho.»
- `decision/encuesta-entre-corte-e-independencia` (`openspec/config.yaml:2853-2864`): las respuestas del
  formulario de Google «se cargan en Desk 2.0 asociadas a su ticket» (`openspec/config.yaml:2858`), y esa
  carga «hoy no tiene fila» (`openspec/config.yaml:2861`).
- La fila es `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:129`.

## 2. Estado de partida del 51

- Hoy sale «sin dato»: el motivo está en `packages/shared/src/indicadores.ts:88` y el cálculo en
  `packages/shared/src/indicadores.ts:228-232` en `42a4828`, que sólo da número si llega la entrada opcional
  `horaActualizacionEstado` (`packages/shared/src/indicadores.ts:46` en `42a4828`).
- Nadie aporta esa entrada: `apps/desk/server/indicadores.ts:92` en `42a4828` llama al cálculo sólo con los cierres.
  Fuera de las pruebas, `horaActualizacionEstado` aparece únicamente en
  `packages/shared/src/indicadores.ts:46` en `42a4828` y `packages/shared/src/indicadores.ts:229` en `42a4828`, y en el comentario
  de `apps/desk/server/indicadores.ts:90` en `42a4828`.
- La letra del maestro: «Hora de actualización del estado − Fecha Finalización ST» (`R08.4.md:6299`).
- «La transición de entrega» son dos en el catálogo: `entrega_sin_factura` y `entrega_al_cliente`
  (`packages/shared/src/transitions.ts:248-251`). Las dos piden `Fecha Remisión de Salida`.
- La hora de cada transición se guarda en `ticket_transitions.performed_at`
  (`packages/zoho-sync/src/db/schema.sql:57-61`), y la lectura ya trae `transition_id` y `performed_at`
  de todo el historial (`apps/desk/server/indicadores.ts:76`, `apps/desk/server/indicadores.ts:82`). No
  hace falta ninguna consulta nueva para el 51.
- Molde a seguir: el 49 deriva su marca del historial dentro del módulo puro
  (`packages/shared/src/indicadores.ts:123-128`, enchufada en `packages/shared/src/indicadores.ts:133` en `42a4828`),
  apoyándose en `marcaIngresoAServicio` (`packages/shared/src/bodegaje.ts:225-226`).
- Límite que la decisión declara (`openspec/config.yaml:4100`): un ticket movido sólo en Zoho no tiene
  fila de entrega y su 51 seguirá «sin dato».

## 3. Estado de partida del 55

- Sin fuente: la lista de hitos del 55 está vacía (`packages/shared/src/indicadores.ts:58`), el motivo
  es `packages/shared/src/indicadores.ts:89` y el valor sólo aparece si llega la entrada opcional
  `calificacionSatisfaccion` (`packages/shared/src/indicadores.ts:48`,
  `packages/shared/src/indicadores.ts:233`).
- No hay tabla ni cargador de respuestas, y **el formato del fichero no está en el repositorio**
  (`openspec/config.yaml:4101-4103`). No hay muestra.
- El ticket tiene un número único (`packages/zoho-sync/src/db/schema.sql:22`), candidato a identificarlo
  en el fichero. Que el formulario lo recoja es **hipótesis**.
- El maestro pide además que cada calificación guarde su canal (`R08.4.md:2969`), y difiere la versión
  integrada de la tableta a después del corte (`R08.4.md:2970`).

## 4. Piezas reutilizables

| Pieza | Dónde | Para qué |
|---|---|---|
| Multer en memoria con límite común | `apps/desk/server/util/subida.ts:10-11` | Recibir el fichero sin tocar disco |
| Precedente de subida con escalera propia | `apps/desk/server/routes/certificadoFabrica.ts:23-28` | Molde de la ruta de carga |
| Mensaje central del límite de tamaño | `apps/desk/server/app.ts:84` | El `413` no hay que escribirlo |
| Sesión y administrador | `apps/desk/server/auth/middleware.ts:14-23`, `apps/desk/server/auth/middleware.ts:26-29` | 401 y 403 |
| Ruta de lectura actual | `apps/desk/server/routes/indicadores.ts:41` | Molde de la escalera 401 < 403 < 400 |
| Registro de rutas | `apps/desk/server/app.ts:61` | Una llamada más en la misma línea |

## 5. Qué se toca

- `packages/shared/src/indicadores.ts`: opciones (`:46`, `:48` de ese fichero), hitos del 51
  (`packages/shared/src/indicadores.ts:56`), motivo (`packages/shared/src/indicadores.ts:88`), cálculo
  (`packages/shared/src/indicadores.ts:228-233`) y armado del 51 y del 55
  (`packages/shared/src/indicadores.ts:241` en `42a4828`, `packages/shared/src/indicadores.ts:246` en `42a4828`).
- `apps/desk/server/indicadores.ts:56-86` en `42a4828`: la lectura pasa de tres a cuatro consultas. Lo fijan hoy en
  tres `apps/desk/server/indicadores.test.ts:53-60` y `apps/desk/server/routes/indicadores.test.ts:186-192`.
- `packages/zoho-sync/src/db/schema.sql`: tabla nueva **al final** (el fichero acaba en la línea 782; el
  último bloque es `packages/zoho-sync/src/db/schema.sql:773-782`), calificada `public`.
- `packages/zoho-sync/src/db/migrate.ts:70-73`: un nombre más en `PUBLIC_TABLES`, añadido en la línea 73
  sin insertar líneas. El recuento de `packages/zoho-sync/src/db/migrate.test.ts:282-287` pasa de 44 a 45
  tablas y de 31 a 32 en `public`.
- Spec viva `openspec/specs/kpis/spec.md`: hoy prohíbe que la ruta aporte esas entradas
  (`openspec/specs/kpis/spec.md:257`) y que el módulo tenga migración o escritor
  (`openspec/specs/kpis/spec.md:509`); el escenario «Diez tickets, tres consultas» es
  `openspec/specs/kpis/spec.md:395`.

## 6. Riesgos vistos

1. **Formato del fichero desconocido.** Es el riesgo principal. Mitigación: analizador aislado en un
   módulo propio, sustituible sin tocar almacén, ruta ni cálculo.
2. **Ficheros muy citados.** Medición del explorador, **no repetida aquí (hipótesis)**: 546 citas a
   `schema.sql` en 165 ficheros, 210 a `migrate.ts` en 94 y 45 a `indicadores.ts`. Mitigación: añadir al
   final y no insertar líneas en `schema.sql` ni en `migrate.ts`; barrido de la regla de mutación 4 en el
   cierre para `indicadores.ts`, que sí se desplaza.
3. **El número de ticket puede no estar en el formulario** (hipótesis). Si el formulario identifica el
   servicio de otra forma, cambia sólo el analizador.
4. Sin criterio de parada activado por la «Regla de ejecución»: no cambia el alcance de la fila, no
   cuesta dinero, no toca datos de producción (tabla nueva vacía) y no contradice una decisión.

## 7. Resultado de comprobar las citas de la exploración

Ninguna cita de la observación 1479 resultó **falsa**. Dos eran **imprecisas** y aquí van corregidas:

| Cita de la exploración | Qué hay en el fichero | Cómo queda aquí |
|---|---|---|
| El rango 6-11 de `util/subida.ts` como «crearSubida» | Las líneas 6-7 son las constantes del límite; `crearSubida` es `apps/desk/server/util/subida.ts:10-11` | `:10-11` |
| El rango 123-134 de `indicadores.ts` como «el 49 derivado del historial» | El rango abarca dos funciones: `hitoMarcaIngreso` (`packages/shared/src/indicadores.ts:123-128`) y el principio de `hitosDe`; la línea que enchufa la marca es la 133 | dos citas |

Y una **cita de la decisión** que hay que leer con cuidado: `openspec/config.yaml:4096` cita las líneas
88-89 de `indicadores.ts` como «el 51 sale sin dato»; la 88 es el motivo del 51 y la 89 es el del 55.
Cierta en `42a4828`, y se desplazará cuando esta tanda edite el fichero: es caso B y el cierre la ancla a
esa revisión.

Las cifras de citas del riesgo 2 no se repitieron: quedan como hipótesis hasta el barrido del cierre.
