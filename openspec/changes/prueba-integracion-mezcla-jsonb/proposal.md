---
tanda: fuera-del-plan
motivo: "E-206 (aviso W2 del verify de F1C-05): prueba contra PostgreSQL real una sentencia del motor que ya existía; no realiza contenido de ninguna fila del §5"
capacidad: []
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — Prueba de integración de la mezcla de `custom_fields` contra PostgreSQL real

**Qué.** Una prueba que ejecuta `applyTransition` con el plan de «Liberación sin factura» sobre un PostgreSQL
real y lee la fila de vuelta: `packages/zoho-sync/src/db/liberacion.integration.test.ts`.

**Por qué.** `writeTransition` mezcla los campos libres con `custom_fields || $N::jsonb`
(`packages/zoho-sync/src/db/repo.ts:309`). pg-mem no soporta esa mezcla y el arnés la emula con
`{...actual, ...nuevos}` (`apps/desk/server/testing/appHarness.ts:105-117`). Desde F1C-05 la liberación la usa
siempre (`apps/desk/server/services/ticketService.ts:133`), y que el operador real hiciera lo mismo que la
emulación era hipótesis: `docs/sdd/ENTRADA.md:2026-2029` (E-206) y el aviso W2 de
`openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/verify-report.md:298-301`.

**Alcance.** Dos ficheros nuevos: la prueba y esta propuesta. La prueba se omite sin `TEST_DATABASE_URL`, como
`packages/zoho-sync/src/db/migrate.integration.test.ts:5-6`, y crea su propia base de datos en el servidor para
no cruzarse con el `DROP SCHEMA desk CASCADE` de ese fichero (`:13`).

**Qué NO hace.** No toca código de producción, ni el arnés, ni specs, ni el CI: `.github/workflows/ci.yml:45-47`
ya define `TEST_DATABASE_URL` en el paso de la suite, así que allí la prueba CORRE. No cierra E-206 por sí sola.

**Resultado.** Sin defecto: el operador real coincide con la emulación en todo estado que el código produce.
- Las claves previas se conservan y la del texto se sobrescribe.
- Una segunda liberación sin texto manda `{"Texto de la autorización": null}` (`textoAutorizacionAGuardar`,
  `packages/shared/src/liberacionSinFactura.ts:40-44`) y la clave queda PRESENTE con `null` de JSON.
- `custom_fields` NULL de SQL no es alcanzable: la columna es `NOT NULL DEFAULT '{}'`
  (`packages/zoho-sync/src/db/schema.sql:40`) y PostgreSQL rechaza el `INSERT` y el `UPDATE` (código 23502).
- Una divergencia, fuera de lo alcanzable: sobre un `custom_fields` con `null` de JSON, que sólo cabe escribir a
  mano, el operador deja un array y la emulación daría un objeto. Queda fijada como caracterización, caso (d).

**Cómo se verificó.** Contra PostgreSQL 17.11 en un contenedor desechable. Sin la variable: 5 omitidas, salida 0.
Con la variable, `packages/zoho-sync/src/db/` entero tres veces seguidas: 14 ficheros y 175 pruebas en verde las
tres, junto a `migrate.integration.test.ts`. Mutando lo vigilado (`repo.ts:309`): sustitución en vez de mezcla,
3 rojas; operandos invertidos, 3 rojas; mezcla con `jsonb_strip_nulls`, 2 rojas. `repo.ts` restaurado.

**Supuestos.** (1) El plan se arma en la prueba con las piezas reales (`transicionPorId`,
`textoAutorizacionAGuardar`, `PROMOTED_COLUMNS`) porque `buildTransitionPlan` vive en `apps/` y el paquete no
puede importarlo; su forma la fija `apps/desk/server/liberacionVerificacion.test.ts:9-12`. (2) El usuario de
`TEST_DATABASE_URL` puede crear y borrar bases de datos.

**Alternativa descartada.** `tanda: F1C-05` con `cierra: no`: la sentencia vigilada es anterior a esa fila y la
prueba no realiza contenido suyo (R-1). Base: `main` en `f619d04`.
