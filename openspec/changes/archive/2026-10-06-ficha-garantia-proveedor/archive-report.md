# Archive · `ficha-garantia-proveedor` (F1B-13, `cierra: no`)

**Fecha:** 2026-10-06 · **Rama:** `ficha-garantia-proveedor` · **Partida:** `77fb526` · **Informe escrito por el orquestador**, con
cifras medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-13 cubre, en una línea:** la ficha de reclamación al fabricante vinculada al ticket y a su OVI —la pregunta
«¿Se reclama al fabricante?» con sus tres motivos de «no», los datos de la ficha, los tres estados con resultado y valor recuperado, el
aviso al Director Técnico pasados 60 días y el panel en el detalle del ticket—; **deja fuera** el valor reclamado tomado del costo de
la OVI (hoy se captura a mano), las dos mediciones (recuperado frente a reclamado por marca, piezas con fallas repetidas) y el envío
físico por remisión sin ticket, así que la fila NO se cierra y el punto 7 del Anexo D tampoco.

## Qué decisión construye

`decision/anexo-7-garantia-proveedor` (Gerencia, 2026-09-24; `openspec/config.yaml` → `decisiones_de_gerencia`), sobre el acto de
asociar que fijó `decision/e157-ovi-garantia-por-cargo`. Pasaje del maestro: M4.4, líneas 2660 a 2668 de la R08.4.md.

## Qué quedó construido

- Reglas puras en `packages/shared/src/garantiaProveedor.ts`: listas cerradas, estados sólo hacia delante, validadores, el permiso
  `puedeGestionarReclamacion` (envoltorio de `puedeCrearOVIGarantia`) y `reclamacionVencida` con `DIAS_AVISO_RECLAMACION`.
- Tabla `public.garantia_proveedor`, calificada, al final de `packages/zoho-sync/src/db/schema.sql`, con índice único por asociación
  y un `CHECK` de coherencia sí/no; está en `PUBLIC_TABLES` y el guardián de `packages/zoho-sync/src/db/migrate.test.ts` la vigila.
- Capa de datos en `apps/desk/server/db/garantiaProveedor.ts` y cuatro rutas en `apps/desk/server/routes/garantiaProveedor.ts`
  (leer por ticket, responder sobre una asociación, editar, avanzar), con las guardas G1 a G14 en orden A < B < C < D.
- Aviso único por ficha en `apps/desk/server/services/avisoReclamacionProveedor.ts`, encadenado en la pasada periódica
  (`apps/desk/server/index.ts:88`): destinatarios por `cargo_permiso`, respaldo al área Servicio Técnico, marca y aviso en la misma
  transacción; sin destinatarios no marca y reintenta al día siguiente.
- Cliente: `apps/desk/src/components/PanelGarantiaProveedor.tsx`, montado junto a `PanelOvAsociaciones`. La tabla de la regla 13, con
  diez decisiones y la línea de servidor de cada una que decide algo, está en `apply-progress.md` y rehecha en `verify-report.md`.
- Sin interruptor y sin variables de entorno nuevas. No se tocaron `ticketService.ts` ni `remision.ts`.

## Supuestos anotados que quedan vivos (reversibles; detalle en `proposal.md` §6)

La pregunta es un acto propio sobre cada OVI asociada, no parte del acto de asociar (S-1); responde, edita y avanza el mismo cargo que
asocia la OVI, o un administrador (S-2); una ficha por asociación, con una pieza (S-3); valor reclamado manual, en pesos (S-4); 60 días
naturales, y avisa el 61 (S-7); la respuesta no se cambia una vez dada (S-10); las OVI asociadas antes del cambio aparecen como
«Pendiente de respuesta», sin relleno (S-11). «Rechazada» admite el valor recuperado ausente y guarda 0.

## Medida, por intento (registro de `gentle-ai sdd-attempt` = `git diff --shortstat --no-renames`)

| Intento | Commit | Registro | Git |
|---|---|---|---|
| Lote 1a · `shared`, tabla y guardián | `42b5f20` | 514 | 493 + 21 |
| Lote 1a-2 · capa de datos | `5e1d9bc` | 340 | 340 + 0 |
| Lote 1b · rutas | `50aa56d` | 587 | 570 + 17 |
| Lote 2 · aviso y cliente | `a4bb24d` | 674 | 657 + 17 |
| Verify | `4a69412` | 174 | 174 + 0 |
| Cierre | `be306ac` | 291 | 279 + 12 |

Ningún intento pasó de la válvula de 720. El lote 1a se partió por ella: con la capa de datos medía 751. La planificación
(`a64c6c8`, 1.515 líneas) fue sin intento, como en `ovi-garantia-por-cargo`. Producto y pruebas contra la partida: 20 ficheros, 1.961
inserciones y 20 borrados (`git diff --shortstat --no-renames 77fb526 be306ac -- apps packages`).

**Ficheros existentes editados en sitio, mismas líneas antes y después:** `apps/desk/server/app.ts` (96), `apps/desk/server/index.ts`
(118), `apps/desk/src/components/TicketDetailView.tsx` (420), `packages/zoho-sync/src/db/migrate.ts` (131),
`packages/shared/src/index.ts` (37) y `packages/shared/src/cargos.test.ts` (273). Crecen sólo por el final
`apps/desk/src/api/client.ts` (825 → 864) y `apps/desk/server/db/avisos.ts` (113 → 127). Ninguna cita cambia de número.

## Verificación

- `verify-report.md`: PASS WITH WARNINGS, 0 CRITICAL, 3 WARNING y 7 SUGGESTION. De 77 escenarios, 71 con prueba en ejecución, 3 por
  mutación o lectura y 3 parciales. 99 mutaciones propias del verificador: 83 rojas, 7 equivalentes y 9 supervivientes reales.
- El cierre (`be306ac`) cubrió los supervivientes con pruebas nuevas, cada una vista en rojo con su mutación: quién respondió (W-1),
  aviso a cada destinatario con dos del cargo y con dos del área (W-2), carreras de editar y de avanzar (W-3), tres validaciones de
  `shared` (S-1), ficha resuelta entre la selección y la marca del aviso (S-2), origen `manual` (S-3) y que `403`, `422` y `404` de
  responder no escriben fila (S-7). El panel pasó a enseñar el día con `diaEnZona`, el mismo que nombra el aviso (S-5).
- Cuatro códigos repetidos por el orquestador tras cada lote y tras el cierre, con salida 0; en el cierre, 3.745 pruebas, y además
  `npm run build`.
- **Un fallo de proceso, corregido:** el intento del verify se asentó sin mirar el código de salida del detector, que daba 1 en
  `4a69412` por cinco citas del informe a la capa de datos numeradas 107 líneas de más. Se reapuntaron por contenido, y una sexta
  abreviada del mismo molde, en `be306ac`; desde ahí el detector da 0.

## Fusión de los deltas (por script, bloque a bloque)

`fusiona.mjs`: 8 bloques, los 8 idénticos al delta, todos ADDED al final de su spec (`RQ-TC-44` a `RQ-TC-49`, `RQ-PM-26`,
`RQ-AV-19`). Specs vivas: 576 inserciones y ningún borrado (`tickets-core` 2.306 → 2.711, `permissions` 704 → 760,
`derivacion-avisos` 784 → 899). No hay capacidad nueva: `capabilities` no cambia.

## Lo que queda abierto

- **Límites conocidos:** liberar una orden no recarga el panel hasta reabrir el ticket; la lectura por ticket devuelve una lista vacía
  para un ticket inexistente; el aviso depende de la pasada periódica de sincronización, igual que el de ritmo de contratos.
- **Discrepancia de la fuente, anotada:** la consecuencia (2) de la decisión habla de cuatro estados internos; la respuesta textual y
  el maestro enumeran tres estados y tres resultados, que es lo construido.
- **Corrección 29 del maestro** entregada en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`; condición de despliegue en el §7 de
  `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` y nota en `DEPLOY.md`.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas

| # | Dueño | Qué |
|---|---|---|
| P-1 | Gerencia, con acceso a producción | Comprobar si las líneas de una OVI traen costo en Books y en qué moneda: de eso depende el valor reclamado automático |
| P-2 | Gerencia | Confirmar los 60 días y que son naturales |
| P-3 | Gerencia | Asignar el cargo Director Técnico antes de publicar (ya registrado por `ovi-garantia-por-cargo`) |
| P-4 | Gerencia | Pegar en el maestro la corrección 29, que recoge que la pregunta se responde después de asociar la OVI (S-1) |

Quedan escritas en `proposal.md` §14 y en el paquete de despliegue. P-1 no tiene todavía entrada en `docs/sdd/ENTRADA.md`: el
fichero tenía cambios de Supervisión sin commitear al cerrar, así que la entrada la abre Supervisión.
