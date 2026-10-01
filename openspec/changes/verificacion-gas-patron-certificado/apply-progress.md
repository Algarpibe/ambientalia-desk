# Apply progress — `verificacion-gas-patron-certificado` (F1A-03)

## Lote 1 · Dato — 2026-10-01, sobre `b85cdcc`

**Hecho:** 0.1-0.7 y 1.1-1.18 (25 casillas). Línea base: 165 ficheros / 2.206 pruebas, lint 165 avisos.
Cierre: 166 ficheros / 2.283 pruebas (+77), typecheck limpio, lint 165 avisos, 0 errores, ninguno nuevo.

**Ficheros:** `gasPatron.ts` (nuevo, 56) y su prueba (110); `index.ts` +1; `types.ts` 1/1; `schema.sql` +32
(622 → 654, −0); `migrate.ts` 1/1; `migrate.test.ts` 132/12; `db/equipos.ts` 20/9 (409 → 420: ayudante al
final); `routes/equipos.ts` 5/5 (211); `db/equipos.test.ts` +60; `equipos.test.ts` +171; `equipoNuevo.test.ts`
+58; `registro.test.ts` 1/1; `config.yaml` 3/3 en `:313-315`.

**R-2:** `gases-patron` declarada DENTRO de `capabilities` (`config.yaml:313-314`), sin desplazar líneas.
`npm run reconcile`: 21 declaradas, 0 huérfanas. Discriminación: con la spec copiada a `openspec/specs/` y la
declaración comentada, 20 declaradas y 1 huérfana (`gases-patron`). Informe devuelto a HEAD.

**Rojo natural:** 1.2 `Failed to load url ./gasPatron`; 1.6 `[10, 24, 3]` ≠ `[10, 26, 3]`, 41 ≠ 43 `ALTER`,
120 ≠ 126 sentencias; 1.12 `{ compuesto: null }` ≠ `'NOₓ'` (HV14-3) y `'SO₂'` (HV14-2); 1.16 `'20 declaradas'`.

**Nacen verdes (declarados):** EN12-2; `creates[36]` de `migrate.test.ts:537` y `:545`; HV13-1, HV13-2, HV13-3, HV14-4, HV14-7;
HV15-7 y HV15-8 (equipo preparado por SQL tras ver el rojo). Se discriminan con m-7g, m-8, m-9d.

**Hipótesis 1.6:** confirmada. pg-mem admite `CREATE UNIQUE INDEX IF NOT EXISTS`, `bigserial` y
`ON CONFLICT (cilindro) DO NOTHING`; sin plan B. HV13-3 se prueba con pg-mem y `createManagedTicket`
(`equipoNuevo.test.ts` usaba un rastreador sin base): el «201» se afirma como «resuelve sin `HttpError`».

**Mutaciones (ejecutor):** m-3a, m-3b, m-4, m-4b, m-7a..h, m-8, m-8b, m-9a..d: todas ROJO y revertidas.
**Reproducidas por el orquestador:** m-4 (GP01-4), m-3b (GP03-1, GP03-4), m-4b (GP01-3), m-7a (clasificación
de tablas), m-7b y m-7c (`ALTER` calificadas/sin calificar), m-9a (HV15-5 ×2, HV15-6), m-8 (herencia, 6 rojas).

**«Vigente»:** `patronVigente` recibe `hoy: DiaCivil`; la prueba del borde usa `hoyEnZona` de `contratos.ts`
(`2026-10-02T03:00:00Z` → `2026-10-01`, vence ese día: cuenta). No se reimplementa el día civil.

**Barrido regla 4:** todas las ediciones en sitio o al final; ninguna cita se desplaza. Caso B anclado
(`db/equipos.ts:142-152` en `a3a8f03`), caso A vigentes (`migrate.ts:70-73`, `:63-80`, `:73`). Matiz B: el
paquete del 10-01 `:230` dice «las dos últimas» de `PUBLIC_TABLES`; es registro fechado, no se edita.

**Medida:** 733 de código, pruebas, casillas y `config.yaml` + este fichero. Supera la válvula de 720 (las
pruebas salieron ~480 frente a ~335 estimadas), queda bajo el techo de 800: se declara y no se parte.
