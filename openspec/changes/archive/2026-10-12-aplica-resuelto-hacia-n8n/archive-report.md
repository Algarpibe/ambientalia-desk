# Archive · `aplica-resuelto-hacia-n8n` (F1B-04, `cierra: no`)

**Fecha:** 2026-10-12 · **Rama:** `aplica-resuelto-hacia-n8n` · **Partida:** `b9d5e71` · **Informe escrito por el orquestador**,
con cifras medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué cubre de la fila F1B-04 y qué deja fuera, en una línea:** cubre el contenido que le añadió
`decision/aplica-opcion-a-esta-semana-12-10` —la aplicación resuelve «Aplica» y lo manda a n8n—; deja fuera decidir y, en su caso,
mover el rotulado (E-167, abierta en `docs/sdd/ENTRADA.md`) y el recuento de modelos sin accesorios, que es de persona contra
producción. Por eso declara `cierra: no`.

**Qué falta exactamente para cerrar la fila:** (1) que Gerencia decida E-167 y, si la casilla del rotulado se mueve, construirlo;
(2) que Servicio Técnico haga el recuento de modelos sin accesorios. El cambio del nodo de n8n es tarea de persona de ESTE cambio y
no condiciona el cierre de la fila, pero sin él lo construido no se ve en el documento.

## Qué decisiones construye

`decision/aplica-si-no-remision-12-10` (la definición de «Sí») y `decision/aplica-opcion-a-esta-semana-12-10` (se construye ya, con
esta tanda, y se publica junto con n8n). Las dos están versionadas en `openspec/config.yaml` → `decisiones_de_gerencia_adenda`.

## Qué se construyó

- **La regla vive en shared.** `aplicaDeRemision` (`packages/shared/src/recepcion.ts:202`, añadida al final del fichero) devuelve
  verdadero si «Incluye» trae algún elemento no vacío, o `hayNovedad` guardado es verdadero, o hay traza de «Llegó sin accesorios»
  o de «Llegó sin embalaje». `hayNovedad` ya se decidió en el alta por la marca del catálogo
  (`packages/shared/src/recepcion.ts:109`): la regla no mira claves ni etiquetas, y no lee el catálogo al enviar.
- **Legado.** Con `novedades` NULL o ausente devuelve `null` y el payload **omite** la clave: esas remisiones salen como hoy.
- **El servidor la manda resuelta.** `buildRemisionPayload` añade `aplica` (`apps/desk/server/remisionWebhook.ts:46`). Cinco
  líneas editadas en sitio; el fichero conserva sus 108 líneas.
- **Entregable para Alfonso:** `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md`, con el código nuevo del nodo «Verifica Incluye
  Entrada», compatible hacia atrás.
- **Sin migración.** No cambian la columna `hay_novedad`, el esquema, `apps/desk/server/routes/remision.ts` ni el cliente React.

## Regla invariable 13 y regla de mutación 3

El cliente React no toma ninguna decisión nueva: `git diff --stat b9d5e71 -- apps/desk/src` sale vacío. n8n consume el dato
resuelto; su respaldo, cuando el dato no llega, es la regla de antes y no una segunda copia de la nueva.

## Pruebas

- Regla: AP-1 a AP-10, desde `packages/shared/src/recepcion.test.ts:425`.
- Payload: BP-1 a BP-3, desde `apps/desk/server/remisionWebhook.test.ts:96`.
- Por la ruta: PA-A1, PA-A2 y PA-A3, desde `apps/desk/server/recepcion.test.ts:747`.
- **Tres pruebas cambiadas a propósito, de diez claves a once**, editadas en sitio: `apps/desk/server/recepcion.test.ts:424`
  (verdadero por la novedad), `apps/desk/server/recepcion.test.ts:727` (sólo por las casillas) y
  `apps/desk/server/accesoriosRemision.test.ts:191` (sólo por «Incluye»).
- Mutaciones: ocho en el apply (M1 a M8) y seis reproducidas por el verificador; todas pusieron alguna prueba en rojo.
- Totales sobre la rama: 267 ficheros pasan y 3 se omiten; 4.468 pruebas pasan y 11 se omiten (las de integración, sin
  PostgreSQL local).

## Avisos del verify que quedan abiertos

- **W-1.** El escenario del reenvío pide cambiar el catálogo entre dos envíos, y PA-A3 sólo reintenta tras un rechazo. La garantía
  es estructural —la regla no recibe el catálogo— y ninguna prueba la fija.
- **W-2.** Dos citas a las líneas 45 y 46 de `apps/desk/server/remisionWebhook.ts` afirman «sólo viajan observaciones e incluye»:
  la de `proposal.md` de este cambio y la de la sección «2026-10-12 (c)» de `docs/sdd/TRASPASO_2026-10-08.md`. Son caso B: ciertas
  de `b9d5e71`, que es la revisión que cada una nombra. No se renumeran ni se reescriben.
- Sugerencias: el legado sólo se prueba con `hayNovedad` verdadero; el nodo acepta además `Aplica` y `body.aplica`, que son
  candidatos especulativos e inocuos.

## Fusión del delta

Por script (`fusiona.mjs`), con comprobación de identidad bloque a bloque: tres bloques idénticos al delta.

| Requisito | Qué | Líneas vivas |
|---|---|---|
| RQ-RE-17 | Modificado: el payload sólo gana `aplica` | 505-545, las mismas 41 |
| RQ-RE-38 | Modificado: las casillas no añaden claves propias | 1887-1943, las mismas 57 |
| RQ-RE-39 | Nuevo, al final | 90 líneas desde la 1945 |

Antes de fusionar se reajustó el delta para que los dos requisitos modificados conservaran su número de líneas: así ninguna cita a
`openspec/specs/remisiones/spec.md` cambia de línea. La spec viva pasa de 1.943 a 2.034 líneas.

## Medida por intento

| Intento | Registro | Medida propia |
|---|---|---|
| 1 · planificación | 513 | 513 |
| 2 · apply, lote único | 327 | 327 |
| 3 · verify | 113 | 113 |
| 4 · archive | ver el asiento | revisable: fusión, informe y ajuste del delta; la mudanza de carpetas no cuenta (regla del archivo) |

## Supuestos reversibles — plazo de corrección: 2026-10-19

S1 el campo se llama `aplica` y es booleano · S2 se manda resuelto, no un «hay novedad» suelto · **S3 las dos casillas cuentan como
novedad real: no es texto literal de Gerencia** · S4 en legado la clave se omite · S5 el reenvío calcula con lo guardado · S6 el
código de n8n es compatible hacia atrás · S7 un elemento de «Incluye» vacío no cuenta.

## Tareas de personas — archivar NO las da por hechas

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Cambiar a mano el nodo de n8n, comprobando antes que su código coincide con el del documento | Alfonso | `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md` |
| Publicar la aplicación y el flujo a la vez, y probar con tres remisiones | Alfonso | El mismo documento, puntos 6 y 8 |
| Corregir, si procede, S1 a S7 antes del 2026-10-19; en especial S3 | Gerencia | Lista semanal de supuestos (E-237) |
| Decidir E-167 | Gerencia | `docs/sdd/ENTRADA.md` |
| Recontar los modelos sin accesorios | Servicio Técnico, contra producción | `docs/sdd/TRASPASO_2026-10-08.md` |
| Versionar su entrada de bandeja y su parte | Sesión de supervisión | `docs/sdd/ENTRADA.md` |

## Hipótesis que siguen sin comprobar

El código actual del nodo y el comportamiento del nodo anterior son datos del analista: esta tanda no abrió n8n. La plantilla del
documento de Google Docs no se pudo leer. El flujo no conserva ejecuciones.
