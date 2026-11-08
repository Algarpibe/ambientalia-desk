# apply-progress — `modo-sin-zoho` (1G-04)

## Lote L1 — puerta, error, registro y configuración (intento i3) · L1.1 a L1.9 hechas; L1.10 es del orquestador
Partida `2a5602a7`. M0 (L1.1): `npm test` 0, 6199 verdes y 26 omitidas, 236 s (medido por el orquestador).

### Rojo medido (L1.4), sobre el módulo-esqueleto (firmas finales, cuerpos que no cumplen)
Corrida de las tres pruebas con el esqueleto: 52 rojas y 29 verdes de 81 (las verdes son guardas de lo existente o de vacío legítimo).
| Fichero › prueba | Aserción que falla |
|---|---|
| `modoSinZoho.test.ts` › ErrorModoSinZohoDesk › mensaje FIJO y marca | `expected 'sin implementar' to be 'modo sin Zoho Desk: la petición a Zoho Desk no salió'` |
| › acepta la marca de otra copia y rechaza lo que no es corte | `expected false to be true` |
| › recursoDeRuta (4 pruebas + 14 segmentos) | `expected '' to be 'GET /tickets/{x}'` y análogas |
| › llamadorDeLaPila (8 pruebas, pilas sintéticas y REAL) | `expected '' to be 'packages/zoho-sync/src/sync.ts · fetchTicket'` y análogas |
| › registro · cortar (cuenta, primera/última, tragado, orden, copia, reloj) | `expected Error: sin implementar to be an instance of ErrorModoSinZohoDesk`; `expected [] to deeply equal [ {…} ]` |
| › registro · rechazos y marcadores | `expected { cortes: [], rechazos: [] } to deeply equal { …rechazos: [2] }` |
| › registro · avisar (4 pruebas) | `expected [] to deeply equal [ …(2) ]` |
| `zohoClientModoSinZoho.test.ts` › abierto (6 pruebas) | `promise resolved "Response { status: 401 …"` (el transporte SÍ salió); `expected undefined to be an instance of ErrorModoSinZohoDesk` |
| › cerrado `TRUE`, `1`, vacío, ausente, `false` | `expected undefined to be false` (el campo no existe aún) |
| `config.test.ts` › modoSinZohoDesk nace cerrado | `expected undefined to be false` |
Verdes en el esqueleto, a propósito: «cerrado y con 401 reintenta» (puerta de hoy), «abierto exige credenciales» (S-g) y «registro vacío lee vacío».

### Verde (L1.5 a L1.7)
Focal `modoSinZoho.test.ts` + `zohoClientModoSinZoho.test.ts` + `zohoClient.test.ts` + `config.test.ts`: 4 ficheros, 83 pruebas verdes (`zohoClient.test.ts` intacto). `npm run typecheck` salida 0.
`npm run lint -- --max-warnings 165` salida 0, «165 problems (0 errors, 165 warnings)».
Ediciones en sitio: `zohoClient.ts` 4/4 (`:2`, `:11`, `:14`, `:29`), `config.ts` 2/2 (`:66`, `:125`); `config.test.ts` +16 al final. Finales de línea CRLF conservados.

### Mutaciones (L1.8), `perl -i -pe '… if $. == N'`, restauración con la sustitución inversa
| # | Mutación | Pruebas rojas | Restaurado (sha256 igual) |
|---|---|---|---|
| M1 | `config.ts:125` `=== 'true'` → `!== 'false'` | config › nace cerrado; zohoClientModoSinZoho › cerrado `TRUE`, `1`, vacío, ausente, y «cerrado con 401» (6) | sí, `dcc28c31e9b56c1c` |
| M2 | el `if` de `zohoClient.ts:29` movido tras `:30` (`getAccessToken`) | abierto › no sale transporte ni token; › 401 sin reintento; › sin registro inyectado (3) | sí, `a9ff91203d137c41` |
| M3 | quitar el corte de `zohoClient.ts:29` | las cinco de «abierto» salvo la de configuración (5) | sí, `a9ff91203d137c41` |
| M4 | en `cortar`, la cuenta tras el `throw` | cortar CUENTA…, dos cortes, tragado, orden, copia, reloj, avisar×2, marcadores, sin etiqueta y la del registro inyectado (11) | sí, `7e3f76d4aace68a2` |
| M5a | `recursoDeRuta` sin `{x}` | reduce el verbo…, casi-inventario, marcadores y las que usan `/tickets/{x}` (10) | sí |
| M5b | `recursoDeRuta` sin quitar la query | reduce el verbo…, marcadores (2) | sí |
| M6 | `llamadorDeLaPila` sin recortar | las 8 de llamadorDeLaPila salvo `desconocido`, más 5 del registro (13) | sí |
| M7 | `esCorteModoSinZoho` = `instanceof Error` | acepta la marca… y rechaza lo que no es un corte (1) | sí |
| M8 | `avisar` en cada corte | avisa UNA vez por origen nuevo (1) | sí |
Tras cada una, `file` conserva «CRLF line terminators» y `git diff --numstat` vuelve a 4/4, 2/2.

### Regla 13 (L1.9) y medida
`git diff --name-only` no contiene nada bajo `apps/desk/src`. El código nuevo no tiene `method:` literal ni `{ method,`; `MODO_SIN_ZOHO_DESK` sólo está en `config.ts` y en pruebas.
Medida antes de este fichero: `git diff --shortstat --no-renames HEAD` 22 inserciones y 6 borrados (28) + `wc -l` de lo nuevo 622 (146 + 344 + 132) = 650.
Desviación: ninguna del diseño. `recursoDeRuta` conserva las barras y deja `{x}` por segmento; el verbo se lee por acceso (`init?.method`).

### Contraste del orquestador y cierre (L1.10)
Informe contrastado dato a dato: `git diff --numstat` 4/4, 2/2, +16, 9/9; `wc -l` 146 + 344 + 132 + 44; CRLF en los `.ts`; focal repetida, 83 verdes. M3 reproducida por el orquestador (quitar el corte de `zohoClient.ts:29`: 5 rojas de 12, sha256 restaurado `a9ff91203d137c41`, CRLF). Barrido B.1: 15 citas a `zohoClient.ts` (`:2`, `:18`, `:29`, `:29-37`, `:30`, `:33`) y 111 a `config.ts:66`/`:125`, en todo el repositorio con `archive/` y `docs/`; ninguna queda falseada (la edición sólo añade al final de la línea; las de `archive/` son registros fechados, caso B). Las cinco comprobaciones y la medida del intento, en `msz-i3-codes.txt`.
