# Informe de archivo — `persistencia-adjuntos` (`tanda: 1G-02`, `cierra: si`)

Archivado el 2026-11-04 en la rama `persistencia-adjuntos` (worktree hermano, partida `d26ef8a5`) y **sin fusionar a `main`**: la tanda
para antes de fusionar. Lo escribe el orquestador con cifras medidas. `apply-progress.md` y `verify-report.md` son instantáneas de su
momento; donde difieran, manda este informe. Decisión que construye, citada por clave (`openspec/config.yaml` →
`decisiones_de_gerencia_adenda`, sólo en la copia de trabajo de `main`): `decision/adelanto-09-11-empezar-1g`.

**Cobertura de la fila 1G-02, en una línea (R-1):** cubrió descargar los bytes de los adjuntos al destino que decidió M1 (un volumen de la
App, `ADJUNTOS_DIR`), poblar `storage_path` tras un guardado seguro (id como nombre, tamaño comprobado, temporal y `rename`), que
`/api/attachment` sirva la copia local y sólo caiga a Zoho si falta, dejando una línea de log por caída, el relleno manual de lo existente,
el guardado de lo nuevo en la pasada periódica y el punto 1 de `debt.md` cerrado; dejó fuera su ejecución en producción (P-1 a P-4, de
persona), las líneas de `.env.example` (P-5) y la verificación de completitud entre Zoho y Desk (1G-03). La fila es
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:24`. Archivar no da por hechas P-1 a P-5.

## 1. Qué queda construido

`git diff --shortstat --no-renames d26ef8a5 9dcc8f16`: 32 ficheros, +3.710 −34; fuera de `openspec/`: 26 ficheros, +2.458 −34.

| Pieza | Dónde |
|---|---|
| Guardado seguro: id `^\d+$` como nombre, `zoho_href` contra la guarda de la ruta, bytes contra `size` (o `Content-Length`), temporal `wx` y `rename`, `storage_path` sólo después; `ErrorDisco` corta | `apps/desk/server/adjuntos/almacen.ts:72` (`guardarAdjunto`; fichero nuevo, 131 líneas) |
| Estado de la copia y directorio: `sinCopia`, `ausente`, `otroTamano`, `presente`; `ADJUNTOS_DIR` absoluta y fuera de `dist/` | `apps/desk/server/adjuntos/almacen.ts:107`, `apps/desk/server/adjuntos/almacen.ts:125` |
| La ruta sirve lo local primero: fila por `zoho_href`, cabeceras (tipo base, `inline` sólo raster y PDF, RFC 5987, `nosniff`), y una línea de log por caída a Zoho sin nombre de fichero | `apps/desk/server/adjuntos/servir.ts:28`, `:62`, `:70`, `:80` (nuevo, 82); `apps/desk/server/routes/attachment.ts:14` y `:17` intactas, lo nuevo desde la 21 |
| Motor del relleno: orden por ticket e id, `desde` y `limite`, `429` con pausa y corte, `404` ausente, disco corta, resumen sin datos de cliente | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:61` (nuevo, 191) |
| Gancho de la pasada periódica: `trasGuardar` al final del ciclo, tope de 20 peticiones, memoria de `404` y tamaño, nunca rechaza | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:18`, `:28` (nuevo, 78); `packages/zoho-sync/src/conversaciones.ts:34`, `:163`, `:173`; `packages/zoho-sync/src/sync.ts:66`; `apps/desk/server/index.ts:23` |
| `POST` y `GET /api/admin/relleno-adjuntos`, sólo superadministrador; interruptor y directorio antes de validar; `limite=0` sólo cuenta; `GET` nunca lanza | `apps/desk/server/routes/rellenoAdjuntos.ts:17`, `:43`, `:53` (nuevo, 56) |
| Variables `RELLENO_ADJUNTOS_HABILITADO` y `GUARDAR_ADJUNTOS_AL_SINCRONIZAR` (`=== 'true'`) y `ADJUNTOS_DIR` (sin valor por defecto) | `packages/zoho-sync/src/config.ts:66`, `:125` (en sitio) |
| Cableado en la App y en el arnés | `apps/desk/server/app.ts:9`, `:22`, `:50`, `:57`, `:58`; `apps/desk/server/testing/appHarness.ts:46`, `:49` (en sitio) |
| Despliegue | `DEPLOY.md:914` (§22, al final): tres apartados con sus dos frases y su línea de entorno vacía (`DEPLOY.md:933`, `:953`, `:970`) y los pasos de persona |
| Punto 1 de `debt.md`, cerrado | `debt.md:572`, `:582`, `:585`, `:597-598` (en sitio) |
| Pruebas nuevas, en `apps/desk/server/adjuntos/` | `almacen.test.ts` (247), `rutaAdjunto.test.ts` (81), `servirLocal.test.ts` (323), `rellenoAdjuntos.test.ts` (386), `guardadoAlSincronizar.test.ts` (281), `rellenoAdjuntosRutas.test.ts` (251) |
| Pruebas nuevas, fuera | `apps/desk/server/deployRellenoAdjuntos.test.ts` (75), `packages/zoho-sync/src/conversacionesTrasGuardar.test.ts` (129); +34 al final de `packages/zoho-sync/src/config.test.ts` |

**Colocación:** inserciones = borrados en todos los ficheros muy citados editados en sitio (`conversaciones.ts` 6/6, `sync.ts` 1/1,
`config.ts` 2/2, `index.ts` 2/2, `app.ts` 5/5, `appHarness.ts` 2/2, `opcionesConversaciones.test.ts` 1/1,
`deployRellenoConversaciones.test.ts` 4/4, `debt.md` 5/5 y, en el archivo, `registro.test.ts` 2/2): ninguna línea existente cambió de
número. `attachment.ts` es la única con inserción (+8 −4) y lo nuevo va desde su línea 21; las citas a sus líneas posteriores llevan
`en d26ef8a5`. `DEPLOY.md` y `config.test.ts` sólo añaden al final. **Cliente:** ningún fichero de `apps/desk/src`; local o Zoho,
cabeceras, rol, interruptores, directorio y tope los decide el servidor (regla 13).

**Guardas que cuentan el árbol**, corregidas en sitio con su molde: `apps/desk/server/opcionesConversaciones.test.ts:25` (L4, exige el
gancho en `index.ts:23`), `apps/desk/server/deployRellenoConversaciones.test.ts:19` y `:25` (L5: la §21 deja de ser la última y su tramo
para en la §22; rojo medido 1 de 4 al añadir la §22) y `apps/desk/server/reconciliacion/registro.test.ts:218`, `:220` (i1 metió 1G-02 en
«en curso»; aquí sale al archivar, con rojo medido al mover la carpeta: 1 de 23, y verde tras corregirla: 23 de 23).

## 2. Intentos del registro, medidas y códigos

Medida = `git diff --shortstat --no-renames` contra la partida del intento + `wc -l` de lo nuevo sin trackear (0 al asentar en todos). La
medida del registro coincidió con la propia en los ocho. Sin compuerta de memoria desde el 04/11: se anota la memoria libre al arrancar.

| Intento | Commits | Medida | Qué | Códigos (typecheck · lint · citas · build · test) | `npm test` |
|---|---|---|---|---|---|
| i1 | `ad404b30` | 665 | planificación | 0 · 0 · 0 · 0 · 0 | 12.977 MB, 499 s |
| i2 | `b0cbae47`, `103e5f6d` | 557 | L1: guardado seguro y estado de la copia | 0 · 0 · 0 · 0 · 0 | 10.863 MB, 463 s |
| i3 | `a770f4e8`, `0cf5333b`, `da5c85ca` | 584 | L2: la ruta sirve de local; configuración | 0 · 0 · 0 · 0 · 0 (el detector dio 1 por dos citas propias; reparadas en `0cf5333b`) | 9.288 MB, 436 s |
| i4 | `3daa344e`, `9a5f1890` | 663 | L3: motor del relleno | 0 · 0 · 0 · 0 · 0 | 9.810 MB, 437 s |
| i5 | `9f5f3512`, `c9354e12` | 609 | L4: gancho al sincronizar | 0 · 0 · 0 · 0 · 0 | 7.721 MB, 438 s |
| i6 | `f876bd43`, `25328436` | 605 | L5: rutas, §22 y `debt.md` | 0 · 0 · 0 · 0 · 0 | 17.360 MB, 350 s |
| i7 | `1e2198c7`, `9dcc8f16` | 181 | verify | 0 · 0 · 0 · 0 · 0 | 16.692 MB, 323 s |
| i8 | este commit | ver §3 | archivo | ver §3 | ver §3 |

Lint, siempre 165 avisos contra 165. Cada pasada lanzada de `npm test` salió 0 a la primera (en i1 e i2 una lectura previa, con la
compuerta de 12 GB aún vigente, no la lanzó: 10.161 y 9.160 MB). La sesión que llevó i1 a i5 se cerró sin querer con i6 abierto y sin
empezar; la siguiente lo asentó con el token guardado de su `acquire`, sin abrir otro. Duraciones de reloj.

## 3. Archivo (i8)

**Parte revisable, medida antes de asentar:** la fusión, +147 −0, y este informe, +146: 293, por debajo de 800. Fusión por
script propio (sólo ADDED, al final, con identidad bloque a bloque y los 29 bloques viejos intactos): `openspec/specs/zoho-sync/spec.md`
1.941 → 2.088 (RQ-ZS-30 desde `openspec/specs/zoho-sync/spec.md:1943`, 32 líneas; RQ-ZS-31 desde `:1976`, 33; RQ-ZS-32 desde `:2010`, 51;
RQ-ZS-33 desde `:2062`, 27). Se conserva CRLF y ninguna línea viva se mueve. La capacidad ya estaba en `capabilities`, así que R-2 no
aplica. La rama no toca `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`.

La carpeta pasa a `openspec/changes/archive/2026-11-04-persistencia-adjuntos/`. Las siete citas con línea que `verify-report.md` (seis) y
`apply-progress.md` (una) hacían por la ruta vieja se reapuntan a la nueva (caso A: mismo contenido, mismas líneas). Las menciones
sin línea de la ruta vieja son históricas y se quedan (caso B).

Las cinco comprobaciones sobre el árbol archivado: COMPROBACIONES_I8. Medida del intento contra `9dcc8f16`: +1.547 −1.254 = 2.801 sin renombrado (con renombrado, +303 −10), 0 sin trackear, con
un techo de 3.304, que es dos veces la carpeta (1.252) más 800.

## 4. Verificación y mutaciones

`verify-report.md` (sobre `25328436`) da **PASS**: 0 CRITICAL, 0 WARNING y 7 SUGGESTION. Los 22 escenarios de RQ-ZS-30 a RQ-ZS-33 tienen
prueba que los fija. De 48 mutaciones reproducidas (38 de D13 y de `apply-progress.md`, 10 propias del verificador), 47 pusieron algo en
rojo y una es equivalente (X4: la cláusula `rel === ''` de `apps/desk/server/adjuntos/almacen.ts:129` ya la cubre la rama general). El
orquestador reprodujo por su cuenta al menos una por intento: M3 y M7b (L1), P1b (L2), M5 (L3), M9 y M8c (L4), P2b y M7b de la §21 (L5) y,
en el verify, `\d+` → `\w+` en `apps/desk/server/routes/attachment.ts:17` (4 rojas, todas en la tabla H5) y el razonamiento de X4. Todas
restauradas con el fichero idéntico (`cmp` o `git diff` vacío) y CRLF.

Mutaciones de `design.md` D13, todas en rojo: los interruptores con `!== 'false'` (M1), el nombre desde `name` y la escritura sin temporal
(M2), no comparar con `size` y la ruta que escribe (M3), la apertura y el worker que descargan (M4), no cortar ante `429` (M5), el nombre de
fichero en el log y en el resumen (M6), los ficheros vigilados (M7: la §22, la §21 y la guarda de rutas), el tope, la memoria y el gancho
(M8) y el cableado de `index.ts:23` (M9). Posiciones: la copia antes de `requireAuth` o de la guarda (P1), los interruptores tras validar
(P2), el `429` y el `404` tras `!res.ok` (P3), `storage_path` antes del `rename` (P4), `enMarcha` y `guardados.push` adelantados (P5).

## 5. Reglas del encargo

- **`strict_tdd`:** el rojo se midió antes del verde en los cinco lotes, en los apartados «Rojo medido» de
  `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:10`, `:90`, `:182`, `:251` y `:330`.
- **Regla 13 y regla de mutación 3:** nada bajo `apps/desk/src`; la comparación decisión a decisión está en
  `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:149` y `:385`.
- **Interruptores:** nacen cerrados, con sus dos frases en la §22. Las líneas de `.env.example` las añade Alfonso (P-5).
- **Ficheros de Supervisión:** la rama no toca ninguno de los seis.
- **Regla de mutación 4:** barrido por lote, en `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:78`, `:172`,
  `:238`, `:317` y `:415`; al archivar no se mueve ninguna línea citada (la fusión va al final y `registro.test.ts` se edita en sitio).
- **Seguridad (los adjuntos son documentos de clientes):** lo de D2, D3 y D6 no se relajó; el verify lo comprobó línea a línea.
- **Commits:** convencionales y sin línea de coautoría, por instrucción del encargo.

## 6. Supuestos

S-a a S-c y S-1 a S-15 están en `proposal.md`; los de cada lote, en los apartados «Supuestos» de `apply-progress.md`. Los de más peso:
- **S-5:** los ids de adjunto son numéricos (hipótesis); uno que no lo sea cuenta `fallido:id` y no se escribe.
- **S-6:** `size` es el número exacto de bytes (hipótesis); la pasada corta lo pone a prueba antes de la completa.
- **S-9:** un comentario nuevo con adjunto mueve `modifiedTime` (hipótesis).
- **L4, supuesto 1:** en la pasada periódica un `429` corta el guardado del ciclo sin reintentar; el ciclo siguiente lo repite.
- **L5, supuesto 2 y 3:** con el interruptor cerrado y sin directorio, el `403` nombra la variable; `limite=0` salta las dos guardas.
- **L5, supuesto 5:** el paso 9 de la §22 recomienda abrir `GUARDAR_ADJUNTOS_AL_SINCRONIZAR` tras el relleno completo; es reversible.
- **M0 de L5:** se reutilizó la pasada de cierre de L4 en `9f5f3512` (código de L4; `c9354e12` sólo documentos), como en L3.1 y L4.1.
- **`evidence_revision` del verify:** la línea de cabecera de `verify-report.md` es la receta propia del verificador; la del registro es
  el `sha256` del fichero de evidencia de cada intento.

Ninguno cambia el alcance de la fila, cuesta dinero, toca datos de producción o contradice una decisión registrada.

## 7. Tareas de persona — fuera del recuento; archivar NO las da por hechas

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Crear el volumen persistente en EasyPanel, montarlo en la App y poner su ruta en `ADJUNTOS_DIR` | Alfonso | `DEPLOY.md` §22, paso 1 |
| P-2 | `df -h` sobre esa ruta (las copias de `desk` están en ese disco); si no alcanza, se para: ampliar cuesta dinero | Alfonso | `DEPLOY.md` §22, paso 2 |
| P-3 | Copia previa de `desk-db`; abrir `RELLENO_ADJUNTOS_HABILITADO`; `limite=0`, pasada corta, la completa y `desde` si se corta; abrir `GUARDAR_ADJUNTOS_AL_SINCRONIZAR`; resumen al analista | Alfonso | `DEPLOY.md` §22, pasos 3 a 10 |
| P-4 | Incluir el volumen en las copias (B2) | Alfonso | este informe |
| P-5 | Añadir a `.env.example` `ADJUNTOS_DIR=`, `RELLENO_ADJUNTOS_HABILITADO=` y `GUARDAR_ADJUNTOS_AL_SINCRONIZAR=` | Alfonso | este informe y `DEPLOY.md:933`, `:953`, `:970` |

## 8. Para Supervisión y la bandeja (R-3)

- **M1:** el dato de Alfonso del 04/11 (2.422 adjuntos en 684 tickets, 2.602 MB, el mayor de 35 MB, ninguno con `storage_path`;
  `proposal.md` §2.4) no está en el repositorio: registrarlo es de Supervisión.
- **El maestro:** «A 01/10/2026 siguen pendientes»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3477`) es cierto de su fecha; para M1 lo deja atrás la
  medida del 04/11, no este cambio.
- **Ticket eliminado:** `apps/desk/server/db/eliminarTicket.ts:51` borra sus filas de `attachments` y sus ficheros quedan en el volumen.
- **S-6 del verify:** `estado.error` y el log del gancho guardan el `message` de una excepción inesperada
  (`apps/desk/server/adjuntos/rellenoAdjuntos.ts:153`); hipótesis: un mensaje de `pg` podría traer el host de la base. Sólo lo ve un
  superadministrador; no lleva datos de cliente.
- **S-3 del verify:** la rigidez de dígitos de la guarda anti-SSRF sólo la fija la tabla H5 (`rutaAdjunto.test.ts`), no una prueba HTTP.
- **Cuota de la API de Zoho (E-254):** sin medir. **Hipótesis:** unas 2.422 peticiones para el relleno completo.
