# Informe de archivo — `tiempos-ficha-cliente` (F1F-03, `cierra: no`)

**Qué parte de F1F-03 cubre y qué deja fuera:** cubre la caja «Tiempo promedio de operación» de la ficha de cliente, que
es contenido añadido por `decision/f1b08-cierre-sin-capturas`. Deja fuera la aceptación con cuatro servicios reales
(`decision/f1f03-criterio-aceptacion`), que es la fila, y el cálculo de la primera respuesta y de la respuesta, que
necesita una definición de Gerencia (S-2, P-2).

## Qué quedó construido

- **Ventana de seis meses en el servidor.** `resolucionPromedioMs` recibe `ahora` y sólo cuenta los cierres que cuentan
  desde `inicioVentanaResolucion(ahora)` (`packages/shared/src/cierreEnCifras.ts`, la función y su constante
  `MESES_VENTANA_RESOLUCION`, al final del fichero). El cierre de la migración sigue fuera (RQ-TC-69).
- **El servidor la aplica.** `getContactDetail` y `getAccountDetail` admiten un `ahora` inyectable, con el reloj por
  omisión (`apps/desk/server/db/directory.ts:35`, `:48`, `:67-68`). La ruta y el contrato JSON no cambian.
- **La ficha deja de inventar.** «Sin datos» en primera respuesta, respuesta y resolución `null`; el rótulo lee la constante
  de `shared` (`apps/desk/src/components/ClienteDetalle.tsx:2`, `:75`, `:126`, `:192-194`).
- **Spec.** RQ-TC-70 fusionado al final de `openspec/specs/tickets-core/spec.md` (`:4202-4258`) por script. El bloque vivo es
  idéntico al del delta, con siete escenarios. Las 4.200 líneas previas quedan intactas, comprobado con `cmp`.

## Intentos (registro de `gentle-ai sdd-attempt`, techo 800 y válvula 720 salvo el archive)

| # | Unidad | Commits | Medida (`git diff --shortstat --no-renames`) |
|---|---|---|---|
| 1 | planificación | `a9052a2` | 332 (332+/0-) contra `ac2d4ef`; 6 rojas y 1 de caracterización |
| 2 | apply | `f42dc72` | 108 (80+/28-) contra `a9052a2` |
| 3 | verify | `6be09b2`, `8d1ddea`, `586c0e8` | 83 (79+/4-) contra `f42dc72` |
| 4 | archive | este commit | parte revisable: fusión (58) + este informe; el resto es la mudanza de la carpeta |

En el verify, `6be09b2` dejó el detector en 1 por una cita del informe que nombraba dos líneas de `ClienteDetalle.tsx`
con una barra entre ellas, y el detector la leyó como fichero inexistente. `8d1ddea` la pasó a prosa. `586c0e8` corrigió
además la frase que llamaba «línea base» a las abreviadas rotas, porque la línea base está vacía.

## Códigos y bundle

- Códigos en el apply (`f42dc72`): test 0 (288 ficheros, 4.799 pruebas, 11 omitidas), typecheck 0, lint 0 (165 avisos,
  los de la partida) y detector 0.
- Bundle: `index-BqihsiwC.js`, 416.666 bytes, igual que `index-8KPDmeiY.js` de `ac2d4ef`; sólo cambia el hash. El chunk
  de la ficha, `ClientesPage`, pasa de 15.934 a 15.969 bytes (+35). En él, `00:00` pasa de 4 apariciones a 0 y «Sin datos»
  de 1 a 5.

## Avisos y sugerencias del verify

- W1 (casillas 3.1 y 3.2 sin marcar) y W2 (desglose por fichero del rojo en `apply-progress.md`): corregidos en sitio
  en `586c0e8`.
- S1 (quitar «— ROJO» de los títulos al fusionar): **no se aplica**. RQ-TC-69, la vecina viva de la misma spec, los
  conserva, y la fusión copia el bloque idéntico.
- S2 (comentario de `ClienteDetalle.tsx:123` tocado): inocuo, no mueve líneas.
- S3 («Sin datos» repetido en cuatro sitios del `.tsx`; si cambia el texto, la barra deja de ir a 0 % sin que nada se
  ponga rojo): se anota. El `.tsx` está fuera de la red de pruebas (F0-00).
- S4 (cierre con fecha futura): es el supuesto S-5, que queda para la lista semanal.

## Regla de mutación 4

`wc -l` no cambia en `directory.ts` (69), `ClienteDetalle.tsx` (223), `cierreEnCifras.test.ts` (73) ni
`cierreMigracionEnCifras.test.ts` (107). `cierreEnCifras.ts` crece de 57 a 69, todo desde `:44`, y ninguna cita del
repositorio apunta a ese fichero. RQ-TC-70 entra al final de la spec viva, así que no desplaza ninguna cita.

## Supuestos para la lista semanal (F1F-03)

S-1 la ventana va sobre el instante del cierre que cuenta · S-2 primera respuesta y respuesta: «Sin datos», sin
definición escrita · S-3 resolución `null`: «Sin datos» · S-4 seis meses de calendario en UTC, con el límite inferior
incluido · S-5 sin límite superior. Cómo se revierte cada uno: `proposal.md` §4.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño |
|---|---|---|
| P-1 | Revisar S-1 a S-5 en la lista semanal | Gerencia |
| P-2 | Definir «primera respuesta» y «respuesta» si se quieren calcular | Gerencia |
| P-3 | Verificar la ficha tras el despliegue (RQ-TC-70, último escenario) | quien despliegue |

## Para la bandeja (no se corrige aquí)

- La barra de los tiempos va al 60 % para cualquier cifra (`ClienteDetalle.tsx:75`): es decorativa.
- «Calificación de satisfacción» va fija a «0 %» (`ClienteDetalle.tsx:174`): el mismo molde que los tiempos, en otra caja.
