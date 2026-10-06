```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:fc637226606c9bbc78a894f0d64d19d9565d3751f006bd3106da89d22f3834a8
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 1/1
scenarios: 16/16
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:229414b9d814407b6d6c1db01ff2fb30d7275ec8c9fa88c114828deedfa8c889
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

# Verification Report — respaldo-semanal-drive (F1F-02, `cierra: no`)

**Mode**: Strict TDD · hybrid · worktree `C:\dev\Desk_2_R1.023-worktrees\respaldo-semanal-drive`, HEAD `3394e54` (árbol `a38e1e7`), base `a6e29d8`.
**Veredicto**: PASS CON AVISOS (0 CRITICAL · 4 WARNING · 3 SUGGESTION).

## Completitud
Tareas 1.1-10.2: todas `[x]` (`tasks.md:10-56`); 0 pendientes. Las seis tareas de persona están fuera del recuento, en su propia sección con dueño y destino, y dicen «Archivar NO las da por hechas» (`tasks.md:58-68`); sus destinos existen en `DEPLOY.md` §13 (credencial, bloqueo y `AbortIncompleteMultipartUpload`, líneas de `.env.example`, prueba mensual). Ninguna describe trabajo que esta tanda pudiera hacer en el repositorio.

## Ejecución (cuatro códigos, medidos en este árbol)
| Comando | Código | Resultado |
|---|---|---|
| `npx vitest run apps/desk/server/respaldo/` | 0 | 15 ficheros, 114 pruebas verdes |
| `npm test` | **0** | 233 ficheros verdes + 2 saltados (235); 3520 pruebas verdes + 7 saltadas (3527) |
| `npm run typecheck` | **0** | sin errores |
| `npx eslint .` | **0** | 165 problemas = 0 errores + 165 avisos (en el techo) |
| detector de citas `apps/desk/server/citas/cli.ts --sha HEAD` (stdin vacío) | **0** | 6026 comprobadas, línea base 0 informadas, 0 cabeceras inválidas; 13 abreviadas rotas informativas (no bloquean; la visible es `CLAUDE.md:349`, ajena al cambio) |

## Matriz escenario → prueba → resultado
Todas en `apps/desk/server/respaldo/`; resultado = verde en la ejecución anterior.
| # | Escenario | Prueba que lo cubre | Res. |
|---|---|---|---|
| 1 | Interruptor apagado | `copiaDrive.test.ts` › orden de las guardas › «apagado: no toca NADA (ni token, ni red, ni aviso)»; `configDrive.test.ts` › «nace cerrado: sólo el literal true»; `driveAuth.test.ts` › «crearlo no pide token» | OK |
| 2 | Primera pasada | `copiaDrive.test.ts` › la pasada › «primera pasada: sube los tres documentos, cifrados en DESKR1…»; `incremental.test.ts` › planificar › «primera pasada» | OK |
| 3 | Pasada incremental | mismo `it` (la segunda sólo sube lo nuevo y lo cambiado); `incremental.test.ts` › «incremental: sólo el nuevo y el de huella distinta» | OK |
| 4 | Fuera de la carpeta raíz | `driveApi.test.ts` › listarCarpeta › «sólo consulta carpetas de la raíz: no sigue accesos directos…» y «recorre subcarpetas y páginas…» | OK |
| 5 | Sin escritura en disco | `sinDisco.test.ts` › «una pasada con un documento de 12 MiB y un nativo exportado termina hecha con CERO llamadas a escritura» + 9 `it` del guardián estático (fixture sintético y ocho módulos) | OK |
| 6 | Restauración con la herramienta existente | `copiaDrive.test.ts` › «restauración: el objeto sube y se descifra con la herramienta existente»; `descifrarCli.test.ts` › «descifra con RESPALDO_CLAVE_CIFRADO y devuelve 0» | OK |
| 7 | Retención de versión superada | `retencion.test.ts` › aRetirar › «versión superada: borra la de hace más de 12 meses, conserva la de hace menos y la última»; `copiaDrive.test.ts` › «borra con ?versionId=…» | OK |
| 8 | Última copia de un documento vivo | `retencion.test.ts` › «última copia: un documento vivo que no cambia desde hace años no pierde su única copia» y «PROPIEDAD: la última versión de un documento vivo nunca es candidata…» | OK |
| 9 | Documento desaparecido de Drive | `retencion.test.ts` › «documento desaparecido hace más de 12 meses: se borran TODAS sus copias; hace menos, se conservan» | OK |
| 10 | Listado incompleto | `copiaDrive.test.ts` › «listado que falla: aviso y FIN; nada se marca desaparecido…»; `driveApi.test.ts` › «un fallo en una página o en una subcarpeta lanza: nunca devuelve un listado parcial»; `incremental.test.ts` › «con listado INCOMPLETO no marca a nadie» | OK |
| 11 | Índice ilegible | `copiaDrive.test.ts` › «índice ilegible: aviso y FIN, sin copiar ni borrar ni listar»; `indiceDrive.test.ts` › «404 = primera pasada» y «cualquier otro fallo es IndiceIlegible…» | OK |
| 12 | Borrado que falla | `copiaDrive.test.ts` › «un borrado denegado por el bloqueo avisa, la pasada sigue…»; `multiparte.test.ts` › «un 403 del bloqueo, o la red caída, devuelve el fallo sin lanzar» | OK |
| 13 | Pasada que falla | `copiaDrive.test.ts` › «una subida que falla (500 en UploadPart) se anota con Abort…», «un documento que falla se anota…», «nunca lanza, ni aunque falle el listado…y el aviso también» | OK |
| 14 | Pasada ya en curso | `copiaDrive.test.ts` › «en curso Y configuración incompleta a la vez: gana en-curso, sin aviso» (cuelga la primera en `listar`) | OK |
| 15 | Configuración incompleta | `copiaDrive.test.ts` › «configuración incompleta: un aviso que nombra la variable y NADA más»; `configDrive.test.ts` › faltantesDrive (3 `it`) | OK |
| 16 | `drive_url` fuera de la raíz | `copiaDrive.test.ts` › driveUrlsFuera › «la pasada avisa de los drive_url fuera y NO copia su contenido» y «extrae el id de cada forma de URL…» | OK |

Cobertura: 16/16 escenarios con prueba verde en tiempo de ejecución; ninguno UNTESTED ni FAILING.

## Condiciones duras
1. **Interruptor cerrado**: `configDrive.ts:31` compara `env.RESPALDO_DRIVE_HABILITADO === "true"` (literal estricto). Apagado: `copiaDrive.ts:102` devuelve antes de cualquier lectura, y el bloque final de `index.ts` ni construye ni programa nada si `!configDrive.habilitado`; `crearTokenDrive` no toca la red al crearse (`copiaDrive.ts:114`, prueba de `driveAuth.test.ts`). Orden interruptor → en curso → faltantes fijado por tres pruebas de posición (`copiaDrive.ts:100-105`, `:53-54`). OK.
2. **Sin disco**: prueba de ejecución con `node:fs`, `node:fs/promises` y `tmpdir` sustituidos por espías que lanzan (`sinDisco.test.ts:19-21` en `146b86f`) y guardián estático sobre ocho módulos (`sinDisco.test.ts:23-30` en `146b86f`). Contraste propio: `grep` de `readFile|writeFile|createWriteStream|tmpdir|mkdtemp|appendFile` sobre los ocho módulos de Drive = 0 coincidencias. Mutaciones no reproducidas (las enumera el orquestador). OK.
3. **Cifrado DESKR1, misma clave**: `copiaDrive.ts:56` y `:69` usan `claveDesdeBase64(base.claveCifrado)` y `cifrador(clave)` de `cifrado.ts`; el `it` de restauración descifra con la herramienta existente; `descifrarCli.ts` no se modificó. OK.
4. **Incremental por criterio declarado**: `huella` = `md5Checksum` o, si falta, `modifiedTime`, comparada con la última versión (`incremental.test.ts`). OK.
5. **Retención**: 12 meses de calendario UTC (`retencion.ts:11-14`); guarda explícita `ultimaDeVivo` (`retencion.ts:22,24`) con propiedad sobre 300 índices aleatorios; sin `versionId` no se borra (`copiaDrive.ts:84`); un borrado fallido avisa y continúa (`copiaDrive.ts:85-86`). OK.
6. **Aviso sin lanzar / una pasada a la vez**: `copiaDrive.ts:47-50,105` (`catch` + `finally`), un solo aviso por pasada (`copiaDrive.ts:92-95`). OK.
7. **`index.ts`**: `git diff -U0 a6e29d8` = `@@ -15 +15 @@` (sólo la línea 15, con imports añadidos al final) y `@@ -109,0 +110,9 @@` (bloque tras `main().catch`); ninguna otra línea se mueve. OK.
8. **`cifrado.ts`**: `@@ -52,0 +53,8 @@`, +8 al final, 0 borradas. OK.
9. **`DEPLOY.md` §13** (`:418-468`): las dos frases «Qué enciende» / «Qué se rompe si se pone mal» y las cinco líneas para `.env.example` están; `.env.example` no se toca (lo añade el usuario). OK.
10. **Dependencias**: `git diff a6e29d8 -- package.json package-lock.json` = 0 líneas. OK.
11. **Secretos**: sólo aparece `-----BEGIN PRIVATE KEY-----` con cuerpo `x` como dato de prueba ficticio (`configDrive.test.ts`); sin claves reales. OK.
12. **Regla invariable 13**: `git diff --stat a6e29d8 -- apps/desk/src` = vacío; el cambio es sólo de servidor. OK.

## Coherencia con el diseño y supuestos
S-1..S-7 (`design.md:144-150`): S-1 cuenta de servicio, S-2 una raíz, S-3 Office, S-4 versionado/bloqueo (sin `versionId` no se borra), S-5 domingo 5 y UTC, S-6 sin reintentos (`copiaDrive.ts:71` anota y sigue), S-7 sin ruta manual (`lanzar` sólo desde `scheduleDailyAt`). Reflejados en el código, sin contradicción.

## Hallazgos
### CRITICAL
Ninguno.

### WARNING
- **W1 · `hecho: true` con fallos sueltos** (`copiaDrive.ts:89-90,96`): `hecho` sólo vale `false` si el índice no se escribe; una descarga o subida fallida, o un borrado denegado, deja `hecho: true` con `fallos` no vacío. Es la decisión documentada (`apply-progress.md:170`) y el correo sí sale, pero el nombre engaña a quien sólo mire ese campo. No incumple ningún escenario.
- **W2 · `drive_url` de un nativo omitido aparece como «fuera»** (`driveApi.ts:68-69` omite accesos directos y nativos sin exportación, que no entran en `archivos`; `copiaDrive.ts:76` sólo conoce carpetas y archivos copiables): un equipo cuyo enlace apunta a un Form o un acceso directo DENTRO de la raíz se avisa como «fuera de la carpeta raíz, no se copia». El escenario se cumple (no se copia y se avisa) pero el texto puede confundir; ese documento ya sale en «Omitidos».
- **W3 · Partición en tres intentos (a, b1, b2) en vez de dos** (`design.md` «Partición en dos intentos»; `apply-progress.md:64,117`): (b) se partió por presupuesto. Los tres miden bajo 800 y las bases encadenan (`522da9f`, `288ae0d`, `9289c49`), pero ni `design.md` ni `tasks.md:5` se actualizaron a «tres». Documental. **Corregido por el orquestador en el commit de este informe**: `tasks.md:4` y el párrafo del corte de `design.md` dicen ya «tres», sin mover líneas.
- **W4 · Fichero existente tocado fuera del alcance** (`superficieSaliente.test.ts`, +6/-2): el invariante de superficie saliente exige etiquetar cada no-GET nuevo (`apply-progress.md:56-60`); el cambio es mínimo y necesario (título «ocho» a «doce» y cuatro etiquetas), pero no figuraba en el diseño. La prueba está en verde.

### SUGGESTION
- **S1** El guardián estático `escriturasEnDisco` es léxico: no vería una escritura por un módulo importado de forma indirecta. La red de ejecución cubre `node:fs`, `node:fs/promises` y `tmpdir`, no `child_process`. Aceptable para este cambio.
- **S2** Si `escribirIndice` falla tras borrar versiones por retención (`copiaDrive.ts:83-90`), el índice sigue listando objetos ya borrados; el borrado S3 es idempotente y se reintenta. Conviene anotarlo en el archive-report como comportamiento esperado.
- **S3** `idDeUrl` (`copiaDrive.ts:15`) sólo reconoce las formas declaradas; las demás van a «drive_url no reconocido» (seguro, informativo).

## Tareas de persona
Confirmado: fuera del recuento y escritas (`tasks.md:58-68`; `DEPLOY.md` §13 «Pendiente de persona», cinco puntos). Archivar no las da por hechas.

## Veredicto
**PASS CON AVISOS.** Suite completa y 114 pruebas del módulo verdes, cuatro códigos 0, 16/16 escenarios con prueba en ejecución, condiciones duras cumplidas, 0 CRITICAL. Siguiente: `sdd-archive`; los cuatro avisos son documentales o de nombre y ninguno bloquea.
