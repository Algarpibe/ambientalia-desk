---
tanda: F1B-04
motivo: ""
capacidad: [remisiones]
maestro: ["M1.2"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# La lista de novedades de entrada se mantiene desde la aplicación

## Por qué

`decision/f1b04-desplegables` fija la lista de tipos de novedad de la remisión de entrada y quién la cambia: «Servicio
Técnico puede ajustar la lista antes de construirla; después, los cambios los hace el Director Técnico». Su consecuencia
(5) la declara «dato mantenible, no constante del código». `recepcion-rotulacion-foto-entrada` la guardó en
`public.catalogo_novedades` y dejó fuera la pantalla
(`openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md`): hoy sólo se cambia por SQL,
es decir, la cambia quien tenga la base y no el Director Técnico.

## Qué cambia

- **La regla, en `packages/shared`** (fichero nuevo, `mantenimientoNovedades.ts`): mantiene la lista quien tenga el área
  Servicio Técnico **y** el cargo Director Técnico; el administrador pasa. Es la misma forma que `puedeCrearOVIGarantia`.
  Valida el alta y el cambio: la clave no se cambia nunca, «Sin novedad» (la que excluye a las demás) no se retira ni
  cambia su marca, nada se borra —una novedad se **retira** con `activo = false`, como ya pedía el esquema—, y ni la clave
  ni la etiqueta se repiten.
- **El servidor lo impone** en tres rutas nuevas junto a la de lectura: la lista entera (activas y retiradas) para la
  pantalla, el alta y el cambio. Orden de guardas de F1B-10: existencia (`404`) → permiso (`403`) → contenido (`422`) →
  unicidad (`409`).
- **La pantalla** (`.tsx`, fuera de la red de pruebas por F0-00) consume la regla compartida para mostrarse u ocultarse;
  la guarda es el servidor (regla invariable 13, con la tabla por escrito en `tasks.md`).

## Diseño

La regla no va en `EXCEPCIONES_POR_CARGO` de `packages/shared/src/cargos.ts` aunque sea su sitio natural: añadir una
entrada desplazaría ese fichero, citado línea a línea más de treinta veces (regla de mutación 4). Va en un fichero propio
que reutiliza `esCargo` y lo dice en su cabecera.

## Qué no cambia

La lectura de la lista para el formulario (`GET /api/novedades-remision`, sólo activas), la siembra del esquema y cómo
una remisión valida las novedades marcadas.

## Supuestos (regla de ejecución, reversibles)

- S-1 · El área del acto es Servicio Técnico, como en la OVI de garantía (supuesto S-9 de `cargos.ts`).
- S-2 · El administrador también puede, como en todos los actos con excepción por cargo.
- S-3 · La marca «excluye a las demás» no se edita desde la pantalla: es comportamiento, y hoy sólo la tiene «Sin
  novedad». «Exige texto» sí, porque Gerencia ya la usa como opción de lista («Otro (texto obligatorio)»).
- S-4 · F1B-04 tiene más contenido pendiente (accesorios, E-100), así que `cierra: no`.
