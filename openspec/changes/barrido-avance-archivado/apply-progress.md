# apply-progress: barrido-avance-archivado (un solo lote, 30/30 tareas)

Base de la medida `3922433`. Modo strict TDD. Todas las citas a `comprobaciones.ts` sin revisión se leen en `840a353`.

## Evidencia TDD

| Fase | RED (rojo natural) | GREEN |
|---|---|---|
| 1 · `comprobaciones.test.ts` | 29 de 43 en rojo: las etiquetas `cerradas por archivo` y `denominador` no existían, y hoy un `cierra: si` sin archivar cuenta como «derivable» | 65/65 en `reconciliacion` |
| 3 · `registro.test.ts` | 4 de 23 en rojo: la clave `cierres_declarados_por_commit` no existe, «en curso» da nueve (F0-01..03 incluidas) | 73/73 con el bloque YAML al final |

Safety net antes de tocar: 35/35 en `reconciliacion`; `npm test` 2363 pasan. Después: 2401 pasan, 2 saltadas (+38).
Guardas sin rojo previo posible (caracterización, pasan antes y después): 01b y 06c-`Anexo H`.

## Mutaciones reproducidas (todas se ponen rojas, copia restaurada y comprobada con `cmp`)

| Mutación | Rojas |
|---|---|
| D1 `includes('archive/')` en vez de prefijo | 1 |
| P1 quitar la resta de `porCommit` en «en curso» | 3 |
| quitar la resta de `porArchivo` | 2 |
| P2 restar antes de filtrar defectos (los incompletos cuentan) | 4 |
| D5 ensanchado a `F\d` | 1 |
| D5 sin negrita | 4 |
| D5 estrechado sin `1[GH]` | 4 |
| `tramoDelPlan` sin cortar en `---` | 2 |
| sin §C se cae al fichero entero | 6 |

## Medidas

`npm run reconcile`: 10 por archivo, 3 por commit (F0-01..03), 6 en curso, denominador 78, código 0, sin línea de suma,
desaparece «sin declarar». Medidos: 5 «sin verificar» (F0-02, F0-05, F1A-03, F1A-06, F1B-10) y 2 «sin fuente» (F1B-12, F1B-14).
Las secciones 1, 3 y 6 del informe cambian respecto del fichero commiteado porque éste estaba caduco (20 declaradas, 6 fuera del plan), no por este cambio.
3.1: `git show --stat` confirma `3d44e1e` (7 ficheros), `fa445ac` (3 specs) con su hijo `749d205` (zoho-sync) y `3aaa0f1` (5 ficheros); las tres pruebas dicen lo que se les atribuye.

## Barrido de citas (regla de mutación 4)

`grep -rnoE "comprobaciones\.ts:[0-9]+(-[0-9]+)?"` fuera de `archive/`: 13 citas, todas con `en 840a353` en su línea física, leídas contra `git show 840a353:…`.
R01.4 `:294` (caso C, con «Superado»), R01.4 `:175` (B), `config.yaml:3339` (C), `Parte_2026-09-21.md:35` (B), siete de `proposal.md` (B).
Abreviadas de esas líneas heredan el ancla. Las tres pruebas del bloque YAML no llevan comillas invertidas: el detector no las ve, y se leyeron a mano (`Estado_As-Built_2026-09-09.md:20-22` y `F0-03/proposal.md:21`).

## Supuestos y desvíos

- D8 (supuesto reversible): §C ausente informa con hallazgo y no cambia el código de salida; la spec decía «fallar» y se corrigió en RQ-RC-12 y su escenario (tarea 6.1).
- `tasks.md` anuncia 41 tareas y la matriz 28/28; las casillas con ID son 30. Se marcaron las 30, la matriz no cambia.
- `RECONCILIACION.md` se regeneró con el árbol sin commitear: su cabecera dice `3922433` y «CON CAMBIOS».

## Medida del ledger (`git diff --shortstat --no-renames 3922433` + `wc -l` sin trackear)
Rastreados `10 files changed, 596 insertions(+), 119 deletions(-)` = 715; sin trackear `apply-progress.md` 51 = **766** de 800.
Por fichero (+/−): `comprobaciones.ts` 103/26 · `comprobaciones.test.ts` 318/26 · `registro.test.ts` 91/0 · `config.yaml` 23/1 · `RECONCILIACION.md` 17/23 ·
`tasks.md` 30/30 (casillas) · `proposal.md` 7/7 · spec delta 4/3 · R01.4 2/2 · `Parte_2026-09-21.md` 1/1. Binarios: ninguno. Punto de control tras la Fase 3: 586.
