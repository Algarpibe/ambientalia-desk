# Archive · `cierre-f1b04-con-lo-construido` (F1B-04, `cierra: si`)

**Fecha:** 2026-11-03 · **Rama:** `cierre-f1b04-con-lo-construido` · **Partida:** `9134c04c` · **Informe escrito por el
orquestador**, con cifras medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué cubrió la fila F1B-04 y qué dejó fuera, en una línea (R-1):** cubrió la recepción unificada entera en siete cambios con
`cierra: no` —rotulado confirmado después de enviar, con traza y aviso si la etiqueta no se genera; lista de novedades en lugar
del texto libre, que mantiene el Director Técnico; foto obligatoria en la remisión de entrada, con sus dos exenciones;
accesorios de la lista del modelo desde el catálogo de Books, y «Aplica» resuelto hacia n8n—; dejó fuera, por su propia
fuente, la ubicación en almacén (después del corte, con M5.3), la foto por accesorio (ítem 21) y la mitad de salida de E-123 y
de E-100 (remisión de salida). Quedan de persona la lista de Kunak AIR Pro, los 106 accesorios sin artículo en Books, el nodo
de n8n y la prueba de aceptación con la primera remisión real.

## Qué decisión registra

`decision/f1b04-recuento-no-retiene` (Gerencia, 2026-11-02; `openspec/config.yaml:5598-5624` en `9134c04c`) dejó F1B-04 «para
cerrar con lo construido». Su consecuencia (4) pedía asentarlo con un cambio de cierre propio, sin código: es este. No añade
nada a `cierres_declarados_por_commit`.

## Qué quedó hecho

- **El contraste pieza a pieza de la fila** con los siete cambios archivados y sus decisiones de respaldo: ninguna pieza queda
  sin construir y archivar. Está en `proposal.md`, «Contraste pieza a pieza», y el verify (`af58984a`) leyó en su ancla las
  84 citas de la propuesta.
- **El rojo, visto antes de corregir.** Con la carpeta en `archive/`, `apps/desk/server/reconciliacion/registro.test.ts` dio
  1 fallo de 23, la prueba 11f/05g, y la única diferencia era `"F1B-04"` en «en curso».
- **La corrección, en sitio:** líneas 218 y 220. La lista pasa de NUEVE a OCHO, sin F1B-04, y la 220 añade
  `toContain('F1B-04')` en «cerradas por archivo». El fichero sigue en 248 líneas, todas CRLF, con 0 `\r` sueltos: 23 de 23.
  Es la única línea de código del cambio; la autorizó el usuario el 2026-11-03, con el molde de `bf65cd67`.
- **`npm run reconcile` sobre el árbol del archivo:** F1B-04 pasa a «cerradas por archivo» (30) y «en curso» baja a 8. F1B-04
  no queda «sin verificar», porque `maestro:` lleva «ítems 4, 10», que está en la fuente de su fila en la R01.1.
  `docs/sdd/RECONCILIACION.md` se restauró sin commitear, porque lleva el commit medido en la cabecera.
- **Barrido de la regla de mutación 4 sobre `registro.test.ts`:** no se movió ninguna línea. Las tres citas de este cambio a
  las líneas de antes de corregir quedan ancladas en `9134c04c` (`proposal.md`, dos; `verify-report.md`, una).
- **Sin código de producción, sin `openspec/specs/`, sin migración y sin cambio de bundle.**

## Intentos del registro

| Intento | Commit | Medida (`git diff --shortstat --no-renames`) | Registro |
|---|---|---|---|
| Planificación | `44ab58ab` | 207 (+207), contra `9134c04c`; 0 sin trackear | 207 · `passed` |
| Verify | `af58984a` | 61 (+57 −4), contra `44ab58ab`; 0 sin trackear | 61 · `passed` |
| Archivo | este commit | se mide al cerrar el intento, contra `af58984a` | techo 1.320 (2 × 260 + 800) |

## Supuestos reversibles — plazo de corrección: una semana desde que se publique

- **S-1:** `maestro:` lleva la fuente de la fila en la R01.1, más M1.2.
- **S-2:** `capacidad: [reconciliacion]`.
- **S-3:** `toca_maestro: no`, como el precedente.
- **S-4:** no se corrigen las líneas 347 y 379 de `openspec/specs/reconciliacion/spec.md`.
- **S-5:** el dueño de los 106 accesorios es el Director Técnico.

Cómo se revierte cada uno: `proposal.md`, «Supuestos reversibles».

## Para Supervisión — no se editan en la rama

- **El plan.** La fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84` en `9134c04c`) sigue diciendo «en curso»,
  y su remanente (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:211` en `9134c04c`) no dice que se cerró. La nota 7
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:358` en `9134c04c`) dice que E-100 no tiene clave `decision/`, y
  la tiene desde el 06/10: `decision/e232-accesorios-lista-por-modelo`.
- **La bandeja.** Con la fila cerrada:
  - E-100 sigue «TRIADA» (`docs/sdd/ENTRADA.md:1367` en `9134c04c`).
  - E-265 nombra este cambio como destino (`docs/sdd/ENTRADA.md:2401` en `9134c04c`); las dos se pueden cerrar.
  - E-168, la clave `decision/` de la mitad de entrada de E-123 (`docs/sdd/ENTRADA.md:1833` en `9134c04c`), sigue siendo de
    Supervisión.
  - E-170 son tareas de persona (`docs/sdd/ENTRADA.md:1843` en `9134c04c`); su destino era el informe de archivo y el paquete
    de despliegue.
- **`openspec/config.yaml`.** `decision/f1b04-recuento-no-retiene` lleva en `tanda_que_abre` «ninguna (el cierre de F1B-04 va
  en un cambio de cierre, sin código)» (`openspec/config.yaml:5624` en `9134c04c`): ese cambio es este.
- **El avance.** Medido con `npm run reconcile` sobre el árbol del archivo: 30 cerradas por archivo, 9 por commit, 8 en curso.
  `docs/sdd/RECONCILIACION.md` se regenera en `main` tras la fusión.
- **El maestro.** La tabla del §3.3 marca F1B-04 «Parcial»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3853`); va con S-3. Siguen pendientes de pegar las
  correcciones que dejaron los cambios de la fila (`correccion-maestro.md` en las carpetas de
  `2026-10-12-recepcion-exencion-foto-y-casilla` y `2026-10-12-rotulado-tras-enviar`).
- **E-256.** 58 ficheros archivados citan `registro.test.ts` entre las líneas 215 y 223 sin ancla, y la línea 220 vuelve a
  cambiar con este cierre.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Destino |
|---|---|---|---|
| P-1 | Completar la lista de accesorios de Kunak AIR Pro, el único de los 29 modelos activos sin ninguno (`openspec/config.yaml:5614-5615` en `9134c04c`) | Director Técnico | Configuración → «Accesorios por modelo» |
| P-2 | Decidir qué se hace con los 106 accesorios escritos a mano sin artículo en Books, en 34 modelos, que «siguen funcionando sin SKU» (`openspec/config.yaml:5612-5613` en `9134c04c`) | Director Técnico (S-5; la decisión no nombra dueño) | Configuración → «Accesorios por modelo» |
| P-3 | Cambiar el nodo «Verifica Incluye Entrada» de n8n (`docs/sdd/TRASPASO_2026-10-08.md:1005-1008`) | Alfonso | El flujo de n8n |
| P-4 | La prueba de aceptación de F1B-04 con la primera remisión real; candidato, el ticket nº 996 (`docs/sdd/TRASPASO_2026-10-08.md:1011-1015`) | Servicio Técnico | La aplicación |
| P-5 | Las tres comprobaciones de E-170: la lista de novedades, el código del ticket en la etiqueta y el formulario | Servicio Técnico; quien administra n8n | La aplicación y n8n |
| P-6 | Revisar S-1 a S-5 en la lista semanal de supuestos (E-237) | Gerencia | La lista semanal |
