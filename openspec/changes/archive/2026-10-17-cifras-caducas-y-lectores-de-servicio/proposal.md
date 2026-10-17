---
tanda: F1B-09
motivo: ""
capacidad: [trazas, transitions-st, remisiones, tickets-core, zoho-sync, derivacion-avisos]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `cifras-caducas-y-lectores-de-servicio`

## 1. Qué fila atiende y qué parte

F1B-09 (`audit-F1B`) no se puede cerrar mientras F1B-04 y F1B-13 sigan abiertas: el repaso se hace al cerrar
la épica 1B. Este cambio atiende **sólo lo construible en el repositorio** de las entradas E-223 a E-230 de
`docs/sdd/ENTRADA.md` (`:2122-2162` en `3187e42`), sin tocar los ficheros de Supervisión. Por eso `cierra: no`.

**Cobertura de la fila:** de F1B-09 cubre E-228 (cifras caducas en el código y en las specs vivas) y la parte de
E-227 que no depende de otra fila (los dos lectores del catálogo de servicio); deja fuera el repaso de cierre de
la épica, E-222, las preguntas E-223 y E-226, E-224, el texto para el maestro (E-230) y lo que es de Supervisión.

## 2. Clasificación de E-223 a E-230 (medida en `3187e42`)

| Entrada | Casilla | Por qué, con ruta y línea |
|---|---|---|
| E-223 | (c) | Pregunta: si la anulación alcanza a equipo nuevo y soporte remoto. Ningún catálogo tiene anulación (`packages/shared/src/transitions.ts:350-363`, `:388-397`) y no hay decisión registrada (cero apariciones de `E-223` en `openspec/config.yaml`). Decide Gerencia; desbloquea el alcance de F1C-01 |
| E-224 | (c) | Si los indicadores aplican a los flujos nuevos es una decisión de alcance (dueño propuesto: Gerencia, `docs/sdd/ENTRADA.md:2130` en `3187e42`); sin ella, filtrar por flujo sería inventar la regla. Cero apariciones de `E-224` en `openspec/config.yaml` |
| E-225 | (d) | Lo resolvió `columna-propia-dos-estados` (F1B-08, archivado en `7de0e78`): `packages/shared/src/columns.ts:15` y `:20` dan columna a `Solicitud Soporte` y `Verificación`. Lo que queda (color de la tarjeta, `apps/desk/src/components/TicketCard.tsx:14-23`) lo dejó fuera esa misma decisión, consecuencia 4 (`openspec/config.yaml:4200-4201`) |
| E-226 | (c) | Pregunta: clase de espera de tres estados (`packages/shared/src/estados.ts:105`) y áreas de equipo nuevo (`packages/shared/src/transitions.ts:347`). Servicio Técnico y Gerencia; sin respuesta registrada |
| E-227 | (a) | Ver §3. `puedeCrearOVIGarantia` ya tiene llamadores (`packages/shared/src/garantiaProveedor.ts:91`, `packages/shared/src/ordenOVI.ts:55`; F1B-03 `d6a2957` y F1B-13 `42b5f20`) |
| E-228 | (a) | Ver §3 |
| E-229 | (d) | La adenda llegó a `main` con `0095665`: `CLAUDE.md` en `3187e42` lleva las cinco correcciones, y `decision/mapa-blueprint-generado` está en `openspec/config.yaml:3816`. Lo que la adenda dejó sin remedir va como texto para Supervisión |
| E-230 | (b) | Es un pasaje del maestro (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3521`); se entrega como texto para el expediente |

## 3. Qué se construye

**E-228 — cifras caducas, con los tres casos de la regla de mutación 4.**

- En el código, todo **caso A** (afirmación sobre el presente), medido en `3187e42`:
  - `packages/shared/src/estados.ts:145`: cruzar «salida única» con `en_espera` «da SEIS»; da **ocho** (los
    doce de salida única de servicio cruzados con los once `en_espera`). El «DOCE» de `:142` sigue siendo cierto.
  - `packages/shared/src/estados.ts:83`: `Remisión creada` «entra por `facturado`/similar»; entra por la
    transición sin botón `remision_confirmada` (`packages/shared/src/transitions.ts:150`).
  - `apps/desk/server/services/ticketService.ts:238`: «las otras 43 transiciones»; la unión tiene 41, son **40**.
  - `packages/shared/src/transitions.ts:67`: «las 32 etapas»; `comment()` lo llevan las 41.
  - `packages/shared/src/transitions.ts:348`: equipo nuevo «Campos: sólo `comment()`»; llevan `derivacion()` y
    `liberacion` declara además el certificado de fábrica (`packages/shared/src/transitions.ts:360`).
- En las specs, «las 34 transiciones» en presente: un requisito (`openspec/specs/trazas/spec.md:51`, RQ-TZ-01,
  va por delta) y seis frases que no son requisito, caso A: `openspec/specs/remisiones/spec.md:752`,
  `openspec/specs/tickets-core/spec.md:1753`, `openspec/specs/zoho-sync/spec.md:789`,
  `openspec/specs/derivacion-avisos/spec.md:732`, `openspec/specs/transitions-st/spec.md:1360`, `:1367` y `:1385`,
  y **una que E-228 no listaba**, del mismo molde: `openspec/specs/trazas/spec.md:516`.
- **Fuera, caso B:** las tablas de verificación fechadas («Verificado en esta tanda», filas M-x, citas ancladas en
  `fd253aa`) afirman algo cierto de su revisión; no se renumeran.
- **Lo que E-228 denuncia es que nada las vigila.** Las cifras que sí informan quedan fijadas por un guardián que
  lee el fichero vigilado (regla de mutación 2); la que no informa se quita.

**E-227 — los dos lectores del catálogo de servicio se ANOTAN, no se retiran.** `transitionsForStatus`
(`packages/shared/src/transitions.ts:301`) y `transitionById` (`:305`) no tienen llamador de producción;
`transitionById` tiene más de cuarenta llamadas en pruebas de ocho ficheros. Retirarlas es churn sin ganancia de
comportamiento, y la entrada pone la retirada en manos de Gerencia. Se anotan en su propio comentario y un guardián
impide que entre un llamador de producción. `periodosDeBodegaje`, `diasDeBodegaje` (destino F1C-06) y
`puedeLiberarSinFactura` (sin destino) se anotan en el informe, sin cambio.

**Además, del mismo molde y en el fichero que cita RQ-TZ-01:** `apps/desk/server/transicionesEjecucion.test.ts:290`,
`:292` y `:311` dicen «cinco» transiciones de equipo nuevo; el catálogo y la tabla de casos tienen seis.

## 4. Fuera de alcance

- `CLAUDE.md`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, el expediente y los demás ficheros de Supervisión.
- `apps/desk/src`: no se edita (la regla 13 no aplica).
- Retirar código, cambiar comportamiento o reordenar guardas.

## 5. Riesgos

- Desplazar citas: todas las ediciones sustituyen texto en la misma línea física; lo nuevo va en un fichero nuevo.
- Supuesto reversible S-1: «quitar la cifra» es la reparación de caso A cuando el número no informa
  (`transitions.ts:67`); se publica en la lista semanal de supuestos.
