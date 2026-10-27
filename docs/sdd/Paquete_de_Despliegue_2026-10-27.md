# Paquete de despliegue — 2026-10-27, adenda: lo que hay hoy en producción y lo publicado desde el 10/10

Adenda a los paquetes fechados anteriores, que **no se editan**. El último era
`docs/sdd/Paquete_de_Despliegue_2026-10-10c.md`; desde entonces no había constancia escrita de ninguna publicación. Esta
adenda la deja, para que la comparación semanal pueda juzgarse en producción con una base conocida.

**De dónde sale cada dato.** Ninguna sesión de construcción entra en producción. Hay tres fuentes, y cada dato dice la
suya:

- **Medida del analista**, con `curl` contra producción y `cmp` contra el build local del commit: el estado de hoy (§1)
  y cada fila de §3.
- **Dato de Alfonso**: el despliegue del servidor del 26/10 y los interruptores ausentes en EasyPanel (§1 y §4).
- **Medida de esta sesión**, el 2026-10-27: que cada commit de §3 existe en `main` (`git cat-file -e` y
  `git merge-base --is-ancestor`), y el build local de `main` en `5f5393bb` (§2).

Lo que ninguna de las tres comprueba va marcado como **hipótesis**.

---

## 1 · Estado de hoy en producción

**Cliente.** Medida del analista, 2026-10-27 10:42: producción sirve

| Fichero | Bytes | sha256 (prefijo) |
|---|---|---|
| `assets/index-BFrlA0VZ.js` | 427.122 | `ab4912d5dccfd929…` |
| `assets/index-BXv9vVDm.css` | 32.681 | `982c3dc2c9aec45a…` |

idénticos con `cmp` al build local de `main` en `094196b9` (F1B-13, valor reclamado en USD).

**Servidor.** Lo desplegó Alfonso el 26/10. **Hipótesis:** que se construyera desde `094196b9`. Ni el analista ni esta
sesión pueden leer con qué commit corre el servidor; el cliente sí se mide, el servidor no.

**Worker `zoho-hub-sync`.** No consta que se haya redesplegado desde el 11/10. Sigue sin constar con qué commit corre
(`docs/sdd/Paquete_de_Despliegue_2026-10-10c.md:45-46`).

## 2 · `main` hoy, y por qué no hace falta desplegar

`main` era `c69a71d9` al empezar el día (fusión de `areas-soporte-remoto`, F1B-09, `cierra: no`). Sobre `094196b9` sólo
añade spec, pruebas y una línea de comentario en `packages/shared/src/transitions.ts` (`git diff --stat 094196b9 c69a71d9
-- apps packages`: cuatro ficheros, tres de ellos pruebas): el bundle es el mismo. Los commits de esta adenda tampoco
tocan el cliente ni el código del servidor: un registro y una corrección en `openspec/config.yaml`, el plazo propio de
una prueba (`0be87fe0`) y esta adenda.

*Medida de esta sesión:* `npm run build` sobre `5f5393bb` produce `index-BFrlA0VZ.js` (427.122 B, sha256
`ab4912d5dccfd929…`) e `index-BXv9vVDm.css` (32.681 B, sha256 `982c3dc2c9aec45a…`): los mismos prefijos que el analista
midió en producción. **No hace falta desplegar.**

## 3 · Publicaciones desde el último paquete

Todas son medidas del analista (`curl` + `cmp` contra el build local del commit). Esta sesión sólo comprobó que cada
commit existe y es antecesor de `main`; los doce lo son.

| Fecha | Commit de `main` | Bundle | Qué llevó |
|---|---|---|---|
| 11/10 | `4f30c12` | `index-FJaDfP7i.js` | F1B-18 «En garantía»; el 409 de la migración |
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

## 4 · Interruptores

`DECISIONALES_POR_CARGO`, `CONTROL_CALIDAD_LIBERACION` y `SALIDAS_ESPERAS` están **ausentes en EasyPanel hasta enero**.
Es dato de Alfonso: la construcción no ve las variables de producción. Ausentes equivale a apagados: los tres nacen
cerrados (`.env.example:40-45`). Qué enciende cada uno, y qué se rompe si se pone mal, está en `DEPLOY.md` §15
(`DEPLOY.md:754`), §16 (`DEPLOY.md:776`) y §17 (`DEPLOY.md:812`).

## 5 · Qué falta probar en la app

Gerencia, 18/10: **todas las pruebas en la app quedan para el final**. Esta adenda no añade ninguna.

## 6 · Pendientes de persona

| Tarea | Dueño |
|---|---|
| Averiguar con qué commit corren el servidor y el worker | Persona con acceso a producción |
| Redesplegar el worker con las condiciones (h) e (i) y `SWEEP_DRY_RUN=true` (`docs/sdd/Paquete_de_Despliegue_2026-10-10c.md:48-62`) | Alfonso |
