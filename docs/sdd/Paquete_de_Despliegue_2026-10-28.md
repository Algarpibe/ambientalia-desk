# Paquete de despliegue — 2026-10-28, adenda: la publicación de `949d394f` y lo publicado desde el 13/10

Adenda a los paquetes fechados anteriores, que **no se editan**. El último era
`docs/sdd/Paquete_de_Despliegue_2026-10-27.md`. Esta adenda deja constancia de la publicación de `949d394f`
(`codigo-servicio-bloqueado`) y reúne en una sola tabla lo publicado desde el 13/10, que es el hueco que supervisión
señaló (`decision/excepcion-plazo-rq-kp-26`, punto (4) de su respuesta textual; `openspec/config.yaml` →
`decisiones_de_gerencia_adenda`).

**De dónde sale cada dato.** Ninguna sesión de construcción entra en producción. Hay tres fuentes, y cada dato dice la
suya:

- **Medida del analista**, con `curl` contra producción y `cmp` contra el build local del commit: el estado de hoy (§1)
  y cada fila de §3.
- **Dato de Alfonso**: el despliegue del servidor del 28/10 (§1).
- **Medida de esta sesión**, el 2026-10-28: que cada commit de §3 existe en `main` (`git cat-file -e` y
  `git merge-base --is-ancestor`), y las rutas y líneas de §2 y §4, leídas en `949d394f`.

Lo que ninguna de las tres comprueba va marcado como **hipótesis**.

---

## 1 · Estado de hoy en producción

**Cliente.** Medida del analista, 2026-10-28 09:59: producción sirve

| Fichero | Bytes | sha256 (prefijo) |
|---|---|---|
| `assets/index-F1jDYjEU.js` | 427.510 | `5e010b12a2e6a031…` |
| `assets/index-BXv9vVDm.css` | 32.681 | `982c3dc2c9aec45a…` |

idénticos con `cmp` al build local de `main` en `949d394f` (fusión de `codigo-servicio-bloqueado`). El CSS es el mismo
que el del paquete del 27/10.

**Servidor.** Lo desplegó Alfonso el 28/10. **Hipótesis:** que se construyera desde `949d394f`. Ni el analista ni esta
sesión pueden leer con qué commit corre el servidor; el cliente sí se mide, el servidor no.

**Worker `zoho-hub-sync`.** Igual que en el paquete del 27/10: no consta que se haya redesplegado desde el 11/10, y sigue
sin constar con qué commit corre (`docs/sdd/Paquete_de_Despliegue_2026-10-10c.md:45-46`).

## 2 · Qué llevó `949d394f`

Fusión `--no-ff` de la rama `codigo-servicio-bloqueado` sobre `aea714ac`. Construye
`decision/ingreso-servicio-reescribe-codigo`: el servidor impide cambiar un código de servicio ya fijado salvo a un
administrador, guarda el valor anterior en la traza y la pantalla propone el código deducido a un ticket que no lo tiene.

- **Servidor:** la guarda `403` de escalón B en `apps/desk/server/services/ticketService.ts:131` y la traza del valor
  previo en `apps/desk/server/services/ticketService.ts:155`, con la regla en `packages/shared/src/codigoServicio.ts`.
- **Cliente:** `apps/desk/src/components/TransitionPanel.tsx:8`, `:80` y `:174` — propone el código deducido y desbloquea
  el campo al administrador. Por eso cambia el bundle a `index-F1jDYjEU.js`.
- **Sin migración, sin interruptor y sin nota en `DEPLOY.md`**
  (`openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/archive-report.md:26-27`). Desplegar cliente y servidor
  era la tarea P-5 de ese mismo informe (`openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/archive-report.md:129`,
  su §10); §1 deja constancia de lo que de ella se puede medir.
- **Va `fuera-del-plan` y no cuenta en F1B-03.** Era el supuesto S-1 de su propuesta
  (`openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:78`) y la tarea P-1 de su informe de archivo
  (`openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/archive-report.md:125`). Gerencia lo aceptó el 28/10
  (dato del analista; todavía no consta en `openspec/config.yaml`). El motivo es la corrección que Gerencia ordenó en
  `decision/excepcion-plazo-rq-kp-26`, punto (3) de su respuesta textual, **sin excepción nueva**.

## 3 · Publicaciones desde el 13/10

Todas son medidas del analista (`curl` + `cmp` contra el build local del commit). Esta sesión sólo comprobó que cada
commit existe y es antecesor de `main`; los doce lo son.

La publicación del 11/10 (`4f30c12`, `index-FJaDfP7i.js`) es **anterior al 13/10** y figura en
`docs/sdd/Paquete_de_Despliegue_2026-10-27.md:56`; no se repite aquí.

| Fecha | Commit de `main` | Bundle | Qué llevó |
|---|---|---|---|
| 17/10 | `50eef3e` | `index-BcnKpGtZ.js` | F1F-05 comparación; F1B-03 prefijo deducido; F1F-01 cierre de migrados; F1B-13 vista Garantías |
| 18/10 | `ac2d4ef` | `index-8KPDmeiY.js` | Búsqueda por cliente y código (E-226) |
| 18/10 | `b0b1353` | `index-BqihsiwC.js` | `tiempos-ficha-cliente` |
| 18/10 | `37817ef` | `index-JtLEpPmB.js` | F1C-01 Anulado |
| 21/10 | `ca373dca` | `index-C4Y09m4Y.js` | Bloque 1C: F1C-02, 04, 05, 06, 07 y 08. Migraciones aditivas `tickets.facturacion_avisada_para` y `ticket_transitions.performed_by_id` |
| 22/10 | `63604b9b` | `index-BpbCtGfB.js` | F1C-03 y PR #6 (`history_synced_status` en el hub) |
| 22/10 | `48ee82ac` | `index-eZJekTNg.js` | F1F-05, filtro por flujo |
| 23/10 | `80083efb` | `index-DSTLJ8Eq.js` | F1F-05, población por cierre y variante del 47 y del 51 |
| 24/10 | `c56efc8d` | `index-Hz9CFuzO.js` | F1F-05, la comparación juzga con la variante |
| 26/10 | `4f7c3803` | — (sólo servidor) | F1F-01, normalizar estados. 0 estados irregulares en `desk.tickets` por SQL, que **no es una prueba que distinga** |
| 26/10 | `094196b9` | `index-BFrlA0VZ.js` | F1B-13, valor reclamado en USD |
| 28/10 | `949d394f` | `index-F1jDYjEU.js` | Código de servicio bloqueado salvo administrador (servidor y cliente) |

## 4 · Qué falta probar en la app

Gerencia, 18/10: **todas las pruebas en la app quedan para el final**. Esta adenda añade a esa lista acumulada los tres
escenarios de RQ-TC-83 marcados «VERIFICACIÓN MANUAL», porque `TransitionPanel.tsx` queda fuera de la red de pruebas
(F0-00):

- un ticket sin código ve la propuesta en un campo editable (`openspec/specs/tickets-core/spec.md:4788`);
- un ticket con código lo ve bloqueado para quien no es administrador (`openspec/specs/tickets-core/spec.md:4793`);
- el administrador ve el campo desbloqueado (`openspec/specs/tickets-core/spec.md:4798`).

## 5 · Pendientes de persona

Los dos del paquete del 27/10, que siguen abiertos; esta adenda no añade ninguno.

| Tarea | Dueño |
|---|---|
| Averiguar con qué commit corren el servidor y el worker | Persona con acceso a producción |
| Redesplegar el worker con las condiciones (h) e (i) y `SWEEP_DRY_RUN=true` (`docs/sdd/Paquete_de_Despliegue_2026-10-10c.md:48-62`) | Alfonso |
