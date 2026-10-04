# Exploración — `remision-creada-sin-salida` (F1B-03, `cierra: no`)

Medido en el worktree del cambio, sobre `main` en `2a74fdc`. El contenido es el informe de la fase de exploración,
volcado a fichero por el orquestador porque el agente de exploración no tiene herramienta de escritura. También
está en Engram (`sdd/remision-creada-sin-salida/explore`).

## 1 · El caso

- `habilitar_servicio` sale de tres estados: «OV asignada», «Ticket creado» y «Remisión creada»
  (`packages/shared/src/transitions.ts:178`).
- La guarda es `exigirRemisionVigente` (`apps/desk/server/services/ticketService.ts:273-277`, llamada en `:131`).
  Usa `motivoSinRemisionVigente` (`packages/shared/src/remision.ts:131-135`).
- «Vigente» es `tipo === 'entrada'` y no anulada, con cualquier estado de envío
  (`packages/shared/src/remision.ts:126-128`; RQ-RE-20 de `openspec/specs/remisiones/spec.md`). Una remisión
  pendiente o en error cuenta como vigente.
- El botón «Crear remisión» sólo aparece en «OV asignada» y «Ticket creado»: `puedeCrearRemisionDeEntrada`
  (`packages/shared/src/transitions.ts:163-165`), que consume `apps/desk/src/lib/botonRemision.ts:31`, y a éste
  `apps/desk/src/components/TransitionPanel.tsx:54`. No hay otro consumidor.
- Resultado: un ticket en «Remisión creada» sin remisión de entrada vigente recibe el `422` de la guarda, que le
  manda crear la remisión, y no tiene botón para crearla.

## 2 · Qué impone el servidor

- `POST /api/remisiones` (`apps/desk/server/routes/remision.ts:120-264`) **no mira el estado del ticket**; tampoco
  `GET /api/remisiones/nueva` (`:39-73`). El alta no ejecuta ninguna transición: sólo `createRemision` (`:246`).
- El ticket se mueve por la sincronización `sincronizarEstadoPorRemision`
  (`apps/desk/server/db/estadoPorRemision.ts:36-61`), que llaman el callback de envío (`remision.ts:374`), la
  anulación (`:336`) y la restauración (`:346`).
- **Regla invariable 13, punto 2:** «sólo se crea remisión en la fase inicial» no tiene contrapartida en el
  servidor; el botón es hoy la única guarda de esa restricción, y ya lo era antes de esta tanda. Dicho al revés,
  que es lo que importa aquí: **la salida ya existe en el servidor** para los tres orígenes; lo que la tapa es el
  predicado compartido que consume el cliente.

## 3 · De dónde sale un ticket así

- Por las rutas de la aplicación casi no se puede. La única escritura de «Remisión creada» es la sincronización,
  que exige al menos una remisión confirmada; con cero confirmadas aplica la retirada y el ticket vuelve a «Ticket
  creado» (`apps/desk/server/db/estadoPorRemision.ts:49-50`). Anular la última remisión, por tanto, **devuelve el
  ticket atrás**.
- **«Venido de Zoho» no se sostiene por el código.** La fase no existe en Zoho
  (`docs/blueprint-servicio-tecnico.md:73`), la spec prohíbe que un ticket de Zoho entre en ella (RQ-TS-02 de
  `openspec/specs/transitions-st/spec.md`) y el corte está en `apps/desk/server/db/estadoPorRemision.ts:41`.
- Lo que queda es **hipótesis**, sin comprobar en producción:
  1. SQL directo, siembras o importaciones (`apps/desk/server/testing/remisionDePrueba.ts:11` ya avisa de que un
     `INSERT` directo no sincroniza).
  2. Una petición caída entre la anulación (`apps/desk/server/routes/remision.ts:333`) y su sincronización (`:336`),
     que no van en una transacción.
  3. Una remisión confirmada de tipo distinto de entrada: el recuento de la sincronización no filtra el tipo
     (`apps/desk/server/db/estadoPorRemision.ts:43-47`) y la guarda sí. Hoy no existe otro tipo; lo traerá la
     remisión de salida.
- Los recuentos de producción (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`) no se han
  ejecutado: no se sabe si el caso existe hoy. No cambia el arreglo, sólo su urgencia.

## 4 · Enfoques

| Enfoque | Qué hace | Veredicto |
|---|---|---|
| (a) | `puedeCrearRemisionDeEntrada` admite también «Remisión creada», en su misma línea. `botonRemision` ya esconde el botón con una confirmada vigente y lo reetiqueta con una pendiente | **Recomendado** |
| (a') | (a) más una guarda de estado nueva en el alta (escalón B) | No en esta tanda: sumaría un punto a IV-12 y es alcance |
| (b) | Botón de vuelta «Remisión creada» → «Ticket creado» | Descartado: cambia el blueprint (RQ-TS-03 prohíbe esa transición en `TRANSITIONS`) y rompe las cifras ancladas |
| (c) | Sólo cambiar el mensaje | Descartado: no desbloquea nada |
| (d) | Reconciliar datos en producción | Descartado: toca datos de producción |

**Recomendación: (a), con una protección.** `botonRemision` debe devolver «no visible» en «Remisión creada» mientras
las remisiones no han cargado (`null`): sin ella, todo ticket sano en ese estado enseñaría «Crear remisión» durante
la carga, y de forma permanente si la petición falla. `botonRemision.ts` es `.ts` y sí tiene red de pruebas.

En un ticket atascado, crear la remisión habilita de inmediato (la pendiente ya es vigente). Si el envío responde
con error, la sincronización devuelve el ticket a «Ticket creado»: correcto, pero visible. **Hipótesis:** ninguna
prueba recorre hoy esa cadena completa.

## 5 · Pruebas

- A invertir: `packages/shared/src/transitions.test.ts:102` y `apps/desk/src/lib/botonRemision.test.ts:19`.
- Nuevas: `botonRemision` en «Remisión creada» con lista vacía, sin cargar, con confirmada, con pendiente y con
  error; y, en el servidor, que desde cada uno de los tres orígenes de `habilitar_servicio` un ticket sin remisión
  vigente puede crear la remisión y después habilitarse.
- No se tocan: las de la guarda (`apps/desk/server/services/ticketService.test.ts:1280-1310`), las de vigencia, las
  de la sincronización, `invariantesGrafo.test.ts`, `cifrasAncladas.test.ts` y `mapaBlueprint.test.ts`.

## 6 · Decisiones y límites

- La guarda «se mantiene sin excepciones» (`openspec/config.yaml:2417`): (a) no la toca.
- No se encontró ninguna decisión de Gerencia que prohíba el botón en «Remisión creada»; lo dicen comentarios y
  pruebas anteriores a F1B-03. **Hipótesis:** la búsqueda en `openspec/config.yaml` no fue exhaustiva.
- E-158 e IV-12 quedan fuera. (a) no añade ninguna guarda al alta.

## 7 · Tamaño y citas

- Código ~10 líneas, pruebas ~40-80, delta de spec ~30-50. Muy por debajo de 800.
- `packages/shared/src/transitions.ts` y `apps/desk/src/lib/botonRemision.ts` son ficheros citados: conviene no
  cambiar su número de líneas.

## 8 · Dudas

Ninguna para la cadena. Quedan anotadas dos, sin parada: si el caso existe en producción, y si Gerencia quiere que
el servidor imponga además la fase del alta (a').
