---
tanda: F1F-05
motivo: ""
capacidad: [kpis]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: los indicadores se filtran por flujo (`filtro-indicadores-por-flujo`)

Sin exploración previa (no hay `sdd/filtro-indicadores-por-flujo/explore` en Engram). Toda cita se comprobó leyendo la
línea en el worktree sobre `8a068fe9`; lo no comprobado lleva «hipótesis». Modo `auto` (`openspec/config.yaml:26`).

## 1. Intención

Gerencia decidió (`decision/e224-indicadores-como-zoho-y-por-flujo`, consecuencia 3, `openspec/config.yaml:4946`) que
«cada indicador se puede filtrar por flujo (servicio técnico, equipo nuevo, soporte remoto)». Hoy no se puede: la
lectura de tickets (`apps/desk/server/indicadores.ts:64`) no trae `classification` —la columna existe,
`packages/zoho-sync/src/db/schema.sql:23`— y ni `GET /api/indicadores` (`apps/desk/server/routes/indicadores.ts:41-54`)
ni `POST /api/indicadores/comparacion` (`apps/desk/server/routes/indicadoresComparacion.ts:25-50`) filtran por otra cosa
que el periodo. La medición en paralelo empieza el 16/11 (`openspec/config.yaml:2659`).

**Éxito:** con un flujo elegido en «Análisis», descarga y comparación cuentan sólo sus tickets; sin elegirlo, todo igual.

## 2. Por qué `cierra: no`, `maestro: []` y `toca_maestro: no`

- `cierra: no`: F1F-05 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:129`) lleva además la población «como
  Zoho» (POR CONFIRMAR, `openspec/config.yaml:4944-4945`), la encuesta y la medición en paralelo; esto es la consecuencia 3.
- `maestro: []`: e224 registra `maestro_pasaje: "ninguno"` (`openspec/config.yaml:4948`), y en el `.md` vigente ningún
  pasaje pide filtrar por flujo: la coincidencia más cercana
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2972`) habla del flujo del proceso.
- `toca_maestro: no`: recortar la población no cambia la definición de ningún indicador del Anexo G.

## 3. Alcance

### Dentro
1. Parámetro opcional `flujo` (`servicio` | `equipo-nuevo` | `soporte-remoto`) en el `GET` (json y csv) y en el `POST`
   (en la URL, como `desde`/`hasta`, `apps/desk/server/routes/indicadoresComparacion.ts:27`). Valor desconocido → `400`
   con la forma de `validarPeriodo` (`apps/desk/server/indicadores.ts:26-38`).
2. **Sin `flujo`, el cuerpo de las dos respuestas es byte a byte el de hoy**: misma población, claves y CSV.
3. `classification` entra en la MISMA consulta (`apps/desk/server/indicadores.ts:64`): siguen siendo cuatro (RQ-KP-14,
   `openspec/specs/kpis/spec.md:501`).
4. Un predicado de `packages/shared` decide el flujo de cada ticket (§5); en la comparación, cubo «de otro flujo» (S-2).
5. Selector de flujo en «Análisis» junto a la descarga (`apps/desk/src/components/Analisis.tsx:83`), que gobierna también
   la comparación (`Analisis.tsx:91`). Las URL las arman `urlIndicadores` (`apps/desk/src/lib/indicadoresUrl.ts:5`) y
   `urlComparacion` (`apps/desk/src/lib/comparacionExportacion.ts:13`), con prueba.
6. Delta de `kpis`, sólo ADDED (§4).

### Fuera
- **La población «como Zoho»** (consecuencia 2 de e224): por confirmar y prohibido suponerla; sin `flujo` es la de hoy.
- Encuesta, correo, semáforos, umbrales, veredicto, escrituras, migraciones, variables de entorno, `jsdom` y `.tsx` probados.
- Sin cambios: `flujoDelTicket` (`packages/shared/src/flujos.ts:56-61`), `normalizar` (`:32-34`), las alarmas
  (`apps/desk/server/db/sla.ts:49`) y los KPI de `fetchAnalisis` (`Analisis.tsx:77`), que el selector no filtra.

## 4. Capacidad

- **Nuevas:** ninguna (R-2 no aplica: `kpis` está declarada y tiene spec viva).
- **Modificadas:** `kpis`, **sólo requisitos ADDED desde RQ-KP-29**, al final de la spec viva, tras RQ-KP-28
  (`openspec/specs/kpis/spec.md:1249`), para no desplazar citas. Ningún MODIFIED: RQ-KP-13, -14, -15 y -26 siguen
  siendo ciertos sin `flujo`. Si la spec necesitara uno, conservará su número de líneas.
- Orientativo: RQ-KP-29 parámetro, `400` y orden de guardas · RQ-KP-30 predicado por clasificación (§5) · RQ-KP-31
  recorte del `GET` json y csv · RQ-KP-32 comparación y cubo «de otro flujo» · RQ-KP-33 cliente y regla 13.

## 5. El predicado: por clasificación, no por estado

Candidatos: `flujoDelTicket` (`packages/shared/src/flujos.ts:56-61`), que exige clasificación **y** estado del catálogo
(`:57`), o sólo la clasificación (`esClasificacionEquipoNuevo`, `:40-43`; `esClasificacionSoporteRemoto`, `:116-119`).
El catálogo de equipo nuevo cubre Ingresado, En Proceso, Notificado, Verificación, Finalizado y Anulado
(`packages/shared/src/transitions.ts:350-363`).

- **Caso 1 · «Equipo nuevo» hoy en un estado de servicio.** Toda alta que no es soporte remoto nace en `Ticket creado`
  (`flujos.ts:138-140`), fuera de ese catálogo: `flujoDelTicket` la da como `servicio` hasta que llega a `Ingresado`.
  Igual un heredado en `Rev./Diagnostico`.
- **Caso 2 · finalizado.** En `Finalizado` los dos candidatos dan `equipo-nuevo`: es el mismo ticket del caso 1, que
  con `flujoDelTicket` contó como `servicio` en `Ticket creado`. Un heredado en `Por Facturar` da `servicio`.

Ejecutado el 2026-10-22 sobre los 26 estados del registro (`packages/shared/src/estados.ts:112`; `Cerrado` no es uno de
ellos). Con `flujoDelTicket`, la misma descarga del mismo periodo cuenta poblaciones distintas según el día: su
condición de estado es una guarda de **enrutado** (`flujos.ts:50-55`), no una definición de población. **S-1:** función
nueva al final de `flujos.ts` que consume los dos `esClasificacion*` y devuelve `Flujo` (sin clasificación reconocida,
`servicio`). Que las alarmas usen `flujoDelTicket` (`apps/desk/server/db/sla.ts:49`) es coherente: miran el estado de
ahora (hipótesis razonada).

## 6. Supuestos reversibles — a la lista semanal, bajo F1F-05

Ninguno cambia el alcance de la fila, cuesta dinero, toca producción ni contradice una decisión registrada.

| ID | Supuesto | Por qué | Reversión |
|---|---|---|---|
| S-1 | El flujo de un ticket para los indicadores lo da sólo su clasificación (§5) | Estable en el tiempo | Cambiar una función |
| S-2 | Con `flujo`, un ticket del fichero que existe en Desk y es de otro flujo va a «de otro flujo», que gana a «fuera del periodo» y a «sólo en el fichero»; sin `flujo` el cubo no existe | Decir «fuera del periodo» de un ticket del periodo sería falso | Fundir el cubo |
| S-3 | Con `flujo`, «sólo en Desk» y «número distinto» cuentan sólo tickets del flujo pedido | Un ticket de otro flujo ausente del fichero está fuera de la población pedida | Quitar el recorte de esas listas |
| S-4 | `flujo` vacío, repetido u otra grafía (`Servicio`) → `400`; los válidos son las claves de `CATALOGO_POR_FLUJO` (`flujos.ts:19-22`) | Igualdad exacta y sin tercera lista | Normalizar antes de validar |
| S-5 | Con `flujo`, el JSON del `GET` y del `POST` lleva la clave `flujo`; sin él no aparece. El CSV conserva sus cabeceras (`apps/desk/server/routes/indicadores.ts:26`) y el nombre del fichero lleva el flujo | Que la descarga diga qué población es, sin tocar los bytes de hoy | Quitar clave y sufijo |
| S-6 | `400` de periodo antes que el de flujo; en el `POST`, el de flujo antes de «falta el fichero» (`indicadoresComparacion.ts:29`) | Los dos primeros son de la URL; el fichero es el cuerpo | Mover una guarda |
| S-7 | El selector gobierna descarga Y comparación; «Todos», por defecto, no envía `flujo` | Si no, el `flujo` del `POST` no se alcanza desde la pantalla | Dos selectores |
| S-8 | Las etiquetas salen de `NOMBRE_FLUJO` (`flujos.ts:127-131`), que se exporta editando su línea en su sitio | Hoy no está exportada; una sola fuente de nombres | Lista en el cliente |

## 7. Tareas de persona — fuera del recuento

Archivar no las da por hechas (regla del ciclo 1). Ninguna describe trabajo de una tanda en este repositorio.

| # | Qué | Dueño | Qué desbloquea | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Confirmar qué tickets cuenta Zoho | Gerencia | La población por defecto, en otro cambio de F1F-05 | `openspec/config.yaml` → e224 |
| P-2 | Corregir o aceptar S-1…S-8 | Gerencia | Que queden aceptados con fecha | Lista semanal de supuestos |
| P-3 | Probar en la app la descarga y la comparación con cada flujo | Quien administra la aplicación | Dar por visto el comportamiento | Lista acumulada de pruebas en la app |

## 8. Enfoque

- **Validación y recorte.** `validarFlujo` y una función pura de recorte, nuevas AL FINAL de
  `apps/desk/server/indicadores.ts`; `validarPeriodo` no se toca. Con `flujo` ausente el recorte devuelve la MISMA
  entrada, que es lo que garantiza los bytes de hoy; va después de leer, así que siguen siendo cuatro consultas.
- **Lectura.** `:64` gana `t.classification` y `:73` la pasa al ticket, editadas en su sitio. Si el ticket lleva su
  `Flujo` resuelto o su clasificación lo decide `sdd-design`, sin tocar más líneas de `:1-96`.
- **`POST`.** Se cruza contra TODOS los tickets del periodo (`apps/desk/server/comparacion/cruzarExportacion.ts:20-31`)
  y después se reparte: recortar antes llevaría un ticket de otro flujo del periodo a «fuera del periodo»
  (`cruzarExportacion.ts:39`). La clasificación de los de fuera del periodo sale de la misma consulta por bloques de
  `numerosDeTickets` (`apps/desk/server/db/ticketsPorId.ts:15`), con una columna más. `ComparacionExportacion`
  (`packages/shared/src/indicadoresExportacion.ts:15-28`) gana `flujo` y `deOtroFlujo` opcionales, ausentes sin `flujo`.
- **Cliente.** `urlIndicadores` y `urlComparacion` ganan un `flujo` opcional (omitido = sin parámetro); `vistaComparacion`
  (`comparacionExportacion.ts:51-83`) añade «De otro flujo» sólo si la respuesta lo trae. `Analisis.tsx` guarda el flujo
  y lo pasa a `<ComparacionExportacion />`, hoy sin props (`apps/desk/src/components/ComparacionExportacion.tsx:9`).

## 9. Regla 13 — decisiones del cliente (regla de mutación 3)

| # | Decisión del cliente | Tipo | Línea del servidor que la impone |
|---|---|---|---|
| C1 | Muestra el selector sólo a administradores | bloquea | `requireAdmin`: `apps/desk/server/routes/indicadores.ts:41`, `apps/desk/server/routes/indicadoresComparacion.ts:25` (`403`) |
| C2 | Ofrece sólo «Todos» y los tres flujos | bloquea | `400` de `validarFlujo` en las dos rutas — línea al aplicar |
| C3 | «Todos» no envía `flujo` | rellena | Sin parámetro, el único corte es el del periodo: `apps/desk/server/indicadores.ts:70` |
| C4 | La descarga lleva el flujo elegido | — | Recorte del `GET`, tras `apps/desk/server/routes/indicadores.ts:44` — línea al aplicar |
| C5 | La comparación lleva el mismo flujo | — | Reparto del `POST`, hoy `apps/desk/server/routes/indicadoresComparacion.ts:34-36` — línea al aplicar |
| C6 | Pinta el flujo y «de otro flujo» tal como llegan | — | Serialización de la respuesta — línea al aplicar. El cliente no clasifica, no recorta y no valida |

## 10. Mutaciones — cada una pone algo en rojo

| M | Mutación | Prueba que se pone roja |
|---|---|---|
| M1 | El recorte devuelve todos los tickets | `GET` json con `flujo=equipo-nuevo` sobre un fixture con los tres flujos |
| M2 | Sin `flujo` cambia la respuesta (recortar a `servicio`, o emitir `flujo: null`) | Caracterización de los bytes del `GET` (json y csv) y del `POST` sin parámetro, escrita ANTES del cambio y verde a propósito; y las pruebas de hoy, sin editar |
| M3 | Un flujo inválido pasa sin `400` | `otro`, vacío, repetido y `Servicio` → `400` que nombra «flujo» |
| M4 | Un ticket de otro flujo cae en «sólo en el fichero» o «fuera del periodo» | Comparación con uno de otro flujo dentro del periodo y otro fuera |
| M5 | El CSV ignora el recorte | `GET` csv con `flujo` |
| M6 | El predicado se cambia por `flujoDelTicket` | §5: «Equipo nuevo» en `Ticket creado` y heredado en `Por Facturar` salen con `flujo=equipo-nuevo` |
| M7 | `urlIndicadores` pierde el parámetro | `apps/desk/src/lib/indicadoresUrl.test.ts` |
| M8 | Posición (regla 1): flujo antes que periodo; en el `POST`, flujo detrás de «falta el fichero» | Petición con las dos cosas mal a la vez, en cada ruta |
| M9 | `urlComparacion` pierde el parámetro | `apps/desk/src/lib/comparacionExportacion.test.ts` |
| M10 | La clasificación se lee con una consulta más | `apps/desk/server/indicadores.test.ts:58` (cuatro consultas) y su par en la comparación |
| M11 | `vistaComparacion` pinta el cubo sin que venga, o lo calcula | `comparacionExportacion.test.ts` |
| M12 | Fichero vigilado (regla 2): el fixture trae «Equipo Nuevo» y una clasificación `null` | Deben dar `equipo-nuevo` y `servicio`; un predicado que compare sin normalizar se pone rojo |

## 11. Estabilidad de líneas (regla de mutación 4)

- `apps/desk/server/indicadores.ts` (96 líneas; 68 líneas del repositorio la citan, medido hoy): edición EN SU SITIO en
  `:1-96`, sin insertar ni borrar; lo nuevo, al final. `packages/shared/src/flujos.ts` (163 líneas): lo nuevo, al final.
- Las rutas, `cruzarExportacion.ts`, `ticketsPorId.ts`, `indicadoresExportacion.ts`, los `lib` y `Analisis.tsx` también se
  citan: en su sitio o al final; lo que inserte líneas entra en el barrido de cierre (`grep -rnoE` y pase de abreviadas).

## 12. Intentos y estimación (bruta ×1,8)

Válvula 720 por intento, medida antes de cerrarlo con `git diff --shortstat --no-renames` contra el commit de partida
más `wc -l` de lo nuevo sin trackear; el que la alcance se parte. Todo en este worktree (regla del ciclo 3). Se asienta
sólo si `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` salen con código 0. Parada antes de fusionar.

| Intento | Contenido | Bruto | ×1,8 |
|---|---|---|---|
| 1 (en curso) | Propuesta (se mide) + spec ADDED RQ-KP-29…33 | spec ~230 | propuesta + ~415 |
| 2 | Diseño + tareas | ~220 + ~110 | ~595 |
| 3 · apply L1 | Predicado y prueba en `shared`; `indicadores.ts`, rutas, `ticketsPorId.ts`, tipo; pruebas de servidor; `apply-progress` | ~320 | ~575 |
| 4 · apply L2 | `lib` del cliente y pruebas, `.tsx`, mutaciones restantes, barrido de citas, `docs/sdd/RECONCILIACION.md` regenerado (se mide) | ~150 | ~270 + reconciliación |
| 5 · verify | `verify-report.md`, sumando obligatorio | ~300 | ~540 |
| 6 · archive | Mudanza + fusión del delta + `archive-report.md` | techo = 2 × carpeta + 800 | revisable ≤ 800, medido antes |

## 13. Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Grafías reales no previstas (p. ej. «Equipo nuevo usado») cuentan como `servicio`; la distribución real por flujo no está medida (hipótesis) | Media | Igualdad normalizada (`flujos.ts:31-34`); P-3 lo ve en la app |
| Dos nociones de «flujo» en el código (población por clasificación; enrutado y alarmas por clasificación y estado), molde H5 | Media | Deliberado y escrito en RQ-KP-30; M6 las enfrenta |
| Un cambio accidental en los bytes sin parámetro, o citas desfasadas | Baja | M2 con caracterización previa; §11 y barrido de cierre |
| La población «como Zoho», al confirmarse, tiene que componer con el filtro | Media | El recorte va aparte de la lectura (hipótesis: compone sin rehacerlo) |
| Fecha del 16/11 | Media | Lotes pequeños; sin `flujo` la medición no depende de este cambio |

## 14. Reversión

Revertir el commit de fusión: sin migración, variables ni datos, y sin `flujo` nada cambió; la spec vuelve con el archivo.

## 15. Criterios de éxito

- [ ] Sin `flujo`, los cuerpos del `GET` (json y csv) y del `POST` son los de antes byte a byte, con cuatro consultas.
- [ ] Con cada `flujo`, json y csv traen sólo tickets cuya clasificación decide ese flujo, y la respuesta dice cuál.
- [ ] `flujo` inválido → `400` que lo nombra, y gana el de periodo; un ticket de otro flujo nunca cae en «sólo en el
      fichero» ni en «fuera del periodo».
- [ ] Predicado en `packages/shared`, que consume los dos `esClasificacion*`; `normalizar` y `flujoDelTicket` intactos.
- [ ] Las URL las arman `urlIndicadores` y `urlComparacion`, con prueba; los `.tsx` sólo pintan; §9 con línea en cada fila.
- [ ] M1–M12 rojas; `apps/desk/server/indicadores.ts:1-96` sin líneas insertadas ni borradas; barrido de la regla 4
      hecho; cada intento por debajo de 720 medido; test, typecheck, lint y build en verde.
