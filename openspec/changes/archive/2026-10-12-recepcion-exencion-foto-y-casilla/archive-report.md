# Archive · `recepcion-exencion-foto-y-casilla` (F1B-04, `cierra: no`)

**Fecha:** 2026-10-12 · **Rama:** `recepcion-exencion-foto-y-casilla` · **Partida:** `daea6d6` · **Informe escrito por el
orquestador**, con cifras medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué cubre de la fila F1B-04 y qué deja fuera, en una línea:** cubre las dos piezas del párrafo «Detalles» de
`decision/accesorios-desde-el-catalogo` que faltaban por construir —la exención de foto de «Falta un accesorio» (E-165) y la casilla
con traza que sustituye la foto de accesorios o de embalaje (E-166)—; deja fuera mover el rotulado (E-167, que espera una
comprobación de persona en el flujo de n8n) y el recuento de modelos sin accesorios (de persona, contra producción). Por eso declara
`cierra: no`.

## Qué decisión construye

`decision/f1b04-remanente-confirmacion-12-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`, versionada en `daea6d6`),
que confirma `decision/accesorios-desde-el-catalogo`. Esta segunda está **sin versionar** a esta fecha: vive en el árbol de la sesión
de supervisión y se cita por clave. Su texto no es verificable desde el repositorio; la confirmación del 12/10, sí.

## Medición previa — lo que había antes de construir (sobre `daea6d6`)

| Punto | Resultado | Qué se hizo |
|---|---|---|
| E-165 · «Falta un accesorio» exenta de foto | No cumplía: la única exención era `excluye_demas` | Construido |
| E-166 · casilla con traza | No existía; las apariciones de «sin embalaje» eran observaciones de remisiones históricas | Construido |
| «Nada de texto libre» para accesorios | Parcial: no hay ítem libre, pero «Accesorio fuera de lista» exige texto | No se tocó (supuesto S6) |
| E-163 y E-164 | Cumplían | No se tocaron |

## Qué se construyó

- **La regla vive en shared y la impone el servidor.** `fotosQueFaltan` deja de exigir la foto mínima de una categoría con su
  casilla marcada (`packages/shared/src/recepcion.ts:139`) y la de una novedad con la marca `exentaDeFoto`
  (`packages/shared/src/recepcion.ts:141`). La puerta de `/enviar` no cambia de texto ni de sitio
  (`apps/desk/server/routes/remision.ts:289`): recibe más datos.
- **Exención por marca, no por nombre.** Columna `exenta_de_foto` en `public.catalogo_novedades`
  (`packages/zoho-sync/src/db/schema.sql:822`) y siembra idempotente de «Falta un accesorio»
  (`packages/zoho-sync/src/db/schema.sql:823`). No es editable desde el mantenimiento de novedades; una novedad nueva nace sin ella.
- **Dos casillas con traza.** «Llegó sin accesorios» y «Llegó sin embalaje»: cuatro columnas NULL-ables en `public.remisiones`
  (`packages/zoho-sync/src/db/schema.sql:825-828`), sin relleno de lo histórico. La hora la pone el servidor y el usuario es el de la
  sesión, en el mismo instante que el rotulado (`apps/desk/server/db/remisiones.ts:45`). Cada casilla añade su frase a `observaciones`,
  sin punto final (`packages/shared/src/recepcion.ts:60`).
- **Incompatibilidad.** «Llegó sin accesorios» con accesorios marcados en «Incluye» se rechaza con `422`: es el paso 7 de
  `validarRecepcion` (`packages/shared/src/recepcion.ts:102`), que sale por la guarda que ya existía
  (`apps/desk/server/routes/remision.ts:158`). En `remision.ts` cambia una sola línea
  (`apps/desk/server/routes/remision.ts:250`); no hay guardas nuevas ni reordenadas.
- **El formulario consume la regla.** Los selectores de foto salen de `selectoresDeFoto`, función pura probada de
  `apps/desk/src/lib/recepcionForm.ts`, que es literalmente «qué fotos faltan con cero fotos»; el `.tsx` sólo pinta.
- **Sin cambios en el contrato con n8n.** `apps/desk/server/remisionWebhook.ts` no se tocó; la prueba PW-1 fija que el payload no
  gana campos con las dos casillas marcadas.

## Delta fusionado

`remisiones`: **RQ-RE-26 MODIFIED** (bloque vivo de 78 líneas sustituido por 115, neto +37) y **RQ-RE-37** y **RQ-RE-38 ADDED** al
final, por script, los tres bloques idénticos al delta. La spec viva pasa de 1.814 a 1.943 líneas. El MODIFIED desplaza +37 todo lo
posterior a la línea 1170: fuera de `archive/` no había ninguna cita con línea a ese tramo salvo las de la propuesta de este cambio,
que quedan ancladas a `daea6d6` (caso B).

## Medida por intento

Medido con `git diff --shortstat --no-renames` contra el commit de partida de cada intento más `wc -l` de lo nuevo sin trackear.
Techo 800, válvula 720. Sin binarios.

| Intento | Contenido | Líneas |
|---|---|---|
| 1 | Propuesta, delta, diseño y tareas | 555 |
| 2 | Apply, lote 1: esquema, shared y servidor | 636 |
| 3 | Apply, lote 2: formulario de entrada | 209 |
| 4 | Verify | 129 |
| 5 | Archive | 242 revisables (fusión del delta 139, este informe 99, anclas en la propuesta 4); 1.852 con la mudanza de la carpeta, que el registro mide sin detección de renombrado y la regla del archivo deja fuera del techo |

## Verify

PASS con avisos: 0 CRITICAL, 3 WARNING. El aviso 1 (una frase del delta con punto final) se corrigió antes de fusionar. El aviso 2
es la medida acumulada de la tanda, que no es la del techo: el techo es por intento. El aviso 3 es una estimación del diseño que no
se cumplió (el `.tsx` desplaza +2 líneas, no +7), sin efecto en el código.

## Desvío IV-12 — se amplía, no se abre uno nuevo

El rechazo de «Llegó sin accesorios» con «Incluye» vive en la guarda de recepción, escalón C, que corre antes de «Orden de venta no
encontrada» (A) y del `409` de remisión pendiente (D). Hereda el punto (3) del desvío, ya registrado. Las pruebas PA-4, PA-5 y PA-6
fijan su posición. Anotarlo en la ficha del desvío es de la sesión de supervisión: este cambio no edita `CLAUDE.md` ni
`openspec/config.yaml`.

## Supuestos reversibles — plazo de corrección: 2026-10-19

S1 dos casillas independientes · S2 traza en el alta · S3 frase en `observaciones` · S4 incompatibilidad con «Incluye» · S5 marca no
editable · S6 «Accesorio fuera de lista» conserva texto y foto · S7 legado y remisiones ya creadas sin cambio. Añadidos al aplicar:
S8 una remisión de legado que traiga la casilla la ignora; S9 «Llegó sin embalaje» no es incompatible con la novedad «Embalaje
inadecuado o dañado»; S10 con la casilla marcada el servidor sigue aceptando una foto de esa categoría, sólo deja de exigirla.

## Tareas de personas — archivar NO las da por hechas

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Versionar `decision/accesorios-desde-el-catalogo` | Sesión de supervisión | `openspec/config.yaml` |
| Pegar en el maestro la corrección de su línea 1241 | Gerencia | `correccion-maestro.md`, en esta carpeta |
| Comprobar en n8n que la etiqueta sale en el envío (E-167) | Persona con acceso al flujo | `docs/sdd/ENTRADA.md` |
| Contar los modelos sin categoría de accesorios | Persona, contra producción | `docs/sdd/ENTRADA.md` |
| Anotar en IV-12 que su punto (3) gana un caso | Sesión de supervisión | `CLAUDE.md` y `openspec/config.yaml` |
| En el primer despliegue: comprobar que `exenta_de_foto` queda en `true` sólo en «Falta un accesorio» | Quien despliegue | Este informe |
| Desplegar el servicio `ambientalia-desk`, con copia previa | Gerencia | Este informe |
