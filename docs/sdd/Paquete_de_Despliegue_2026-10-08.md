# Paquete de despliegue — 2026-10-08 (adenda: fusión de `indicadores-51-55` y traspaso)

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada.** La publicación es una
acción manual: el CI no despliega, sólo verifica.

**Esta adenda es INCREMENTAL y NO sustituye al paquete del 2026-10-06**
(`docs/sdd/Paquete_de_Despliegue_2026-10-06.md`, que desde hoy **no se edita más**). Lo complementa con la medición del
rango que entró en `main` al fusionar `indicadores-51-55` y con el traspaso de esa tanda. El detalle de qué entra, el
despliegue y las tareas de persona P-1 a P-3 están en el apartado 14 de aquel paquete y aquí no se repiten.

## 0 · Medición del rango

| Dato | Valor |
|---|---|
| Cabeza medida | `2f208ce`, fusión `--no-ff` de la rama `indicadores-51-55` (cabeza `6217d40`) sobre `a13362d` |
| Rango | `42a4828..2f208ce`, **11 commits** (`git rev-list --count`): 9 de la rama, la reparación documental `a13362d` y la fusión |
| `git diff --shortstat 42a4828 2f208ce` | 35 files changed, 4598 insertions(+), 112 deletions(-) |
| Código (`-- apps packages`) | **18 ficheros, +1.419/−64**; sin pruebas: **10 ficheros, +358/−24** |
| Cliente (`-- apps/desk/src`) | **sin cambios** |
| Esquema (`packages/zoho-sync/src/db/schema.sql`) | **+14 líneas**: la tabla nueva `public.encuesta_respuestas`, que nace vacía |
| `Dockerfile`, `package.json`, `package-lock.json`, `.env.example` | **sin cambios**: ninguna dependencia ni variable nueva |
| `DEPLOY.md` | +45/−5 |
| Comprobaciones sobre `2f208ce` antes del push | 4.187 pruebas en verde (7 saltadas), `typecheck` 0, `lint` 0 errores y 165 avisos, detector de citas 0 bloqueantes |
| CI de `2f208ce` | verde |

`a13362d` es documental: deja escrito en `CLAUDE.md` y en `openspec/config.yaml` que los dos desvíos que apuntaban a
F1B-11 quedan **sin destino asignado** desde el 2026-10-07, porque F1B-11 se cerró con `ampliacion-contrato` sin
resolverlos. No cambia nada de lo que se publica.

## 1 · Traspaso de `indicadores-51-55` — para Gerencia y para Supervisión

`indicadores-51-55` lleva `tanda: F1F-05` y `cierra: no`: la fila F1F-05 **sigue en curso** y no suma al avance
(`docs/sdd/RECONCILIACION.md`, regenerada sobre `2f208ce`).

### 1.1 · El indicador 55 está construido sobre un formato SUPUESTO y NO validado

El analizador del fichero de respuestas de la encuesta lee un formato que nadie ha visto: no hay muestra real. Lo
declara su propia cabecera (`apps/desk/server/encuesta/analizarRespuestas.ts:1-2`: «TODO el formato que lee es
SUPUESTO»). Son supuestos, entre otros, que el fichero trae el número de ticket, qué columnas tiene y que la fecha viene
con el día primero.

**Consecuencia:** el 55 no se puede dar por bueno todavía. Las pruebas en verde demuestran que el analizador lee el
formato que se le supuso, no que ese formato sea el de la exportación real.

**Qué hace falta, y es tarea de persona:** que Comercial entregue **un fichero real de respuestas** (P-1 del apartado
14 del paquete del 06/10). Con él se confirma el analizador o se sustituye; ese módulo es lo único que cambiaría, la
tabla y la huella de cada respuesta no. Hasta entonces no se carga ninguna respuesta en producción (P-2 depende de P-1).

### 1.2 · Hallazgo — `instanteDeJornada` devuelve un día de menos para las horas 0 a 4

`instanteDeJornada` (`packages/shared/src/calendarioLaboral.ts:155`) devuelve un instante 24 horas anterior al debido
cuando la hora pedida está entre 0 y 4. Medido en la tanda, con el día `2027-01-12`: hora 0 →
`2027-01-11T05:00:00.000Z` (lo correcto sería `2027-01-12T05:00:00.000Z`); hora 8 → `2027-01-12T13:00:00.000Z`, correcta.

- **Causa:** hipótesis, a partir de la lectura de `packages/shared/src/calendarioLaboral.ts:155-167`: la hora deseada
  se trata como UTC, al formatearla en la zona de negocio cae en el día anterior, y la diferencia que se aplica no
  contempla el cambio de día.
- **A quién afecta hoy:** hipótesis: a nadie, porque sus llamadores piden las 08:00 y las 17:00. No se ha barrido cada
  llamador en esta adenda.
- **Qué hizo la tanda:** no la corrige. El analizador la esquiva midiendo el desplazamiento del día a mediodía
  (`apps/desk/server/encuesta/analizarRespuestas.ts:146`) y aplicándolo a cualquier hora.
- **Destino:** **sin destino asignado**, a propósito. Corresponde a Supervisión abrirle entrada en la bandeja y a
  Gerencia situarlo; la redacción propuesta está en el apartado 14 del paquete del 06/10.

### 1.3 · Lo demás que queda abierto

Las tres preguntas (S-D, S-E y S-G), los otros dos hallazgos y la nota sobre las citas de `openspec/config.yaml` que
son caso B siguen como las dejó el apartado 14 del paquete del 06/10: redactadas para la bandeja, sin número, y sin
abrir por esta sesión.
