# Paquete de despliegue — 2026-10-10, adenda: asignación de cargos

Adenda corta a `docs/sdd/Paquete_de_Despliegue_2026-10-09.md` y a `docs/sdd/Paquete_de_Despliegue_2026-10-09b.md`,
que **no se editan**. Recoge la tabla de cargos y personas que Gerencia entregó el 2026-10-10 y la convierte en un
procedimiento que se puede seguir sin leer código. Sustituye al §4 de la adenda (b), que daba la tabla por pendiente,
y completa su §3.

**Este documento no publica nada y ninguna sesión ejecuta su consulta.** La respuesta está registrada, literal, en
`openspec/config.yaml` → `decisiones_de_gerencia_adenda` → `decision/tabla-de-cargos-y-personas-10-10`. Lo que se
dice del código se leyó en el árbol de `5ebc612`, cuyo código es el de `509b905`. Lo que no se puede leer desde el
repositorio lleva la palabra **hipótesis**.

---

## 1 · Antes de empezar: hay dos campos, y no son el mismo

En la ventana «Editar usuario» de la pantalla «Usuarios» hay **dos** campos que hablan de cargo:

| Campo en pantalla | Qué es | Para qué sirve |
|---|---|---|
| Desplegable **«Cargo de permiso»** | Una lista cerrada de ocho textos (`packages/shared/src/cargos.ts:12-15`) | **Da permisos.** Se elige; no se teclea |
| Casilla de texto **«Cargo (opcional)»** | Texto libre | Es la **firma de la remisión**. Y además lo leen la derivación propuesta y las alarmas de plazo, que **no miran el desplegable** |

Bajo la casilla de texto la pantalla dice «El cargo aparece en la remisión; no da permisos». Es cierto, pero
incompleto: en **dos** personas —Director Técnico y Coordinador Comercial— ese texto decide además a quién se propone
un ticket y quién recibe las alarmas. Por eso en esas dos filas hay que rellenar **los dos campos**, y el texto tiene
que ir **escrito exactamente como aparece abajo**.

La nota que la pantalla pone bajo el desplegable —«hoy, sólo Director Comercial ejecuta Liberación sin factura»
(`apps/desk/src/components/UsersAdmin.tsx:127`)— está desfasada: el Director Técnico también tiene actos propios
(adenda b, §3). No se corrige aquí.

## 2 · Procedimiento, fila a fila

**Cuándo:** justo después de publicar, fuera del horario de trabajo y antes de abrir la aplicación al equipo.
**Quién:** Gerencia, con su cuenta de administrador.

**Para cada fila:** abrir la pantalla «Usuarios», localizar a la persona **por su nombre**, abrir «Editar usuario»,
rellenar los dos campos como dice la tabla y guardar. Si una persona no aparece en la lista o está inactiva,
**parar en esa fila y anotarlo**: no crear una cuenta nueva sobre la marcha.

| # | Usuario (por su nombre) | Desplegable «Cargo de permiso» | Casilla de texto «Cargo» | ¿Hace falta el texto para algo más que la firma? |
|---|---|---|---|---|
| 1 | **Gustavo A. Novoa Guzmán** | `Director Técnico` | **`Director Técnico`**, exacto | **Sí.** Con ese texto se le proponen los tickets de «Solicitud repuestos» y de «Escalado a Revisión» |
| 2 | **Johny A. Luna Roa** | `Especialista técnico` | El que deba aparecer en sus remisiones | No. Sólo es la firma |
| 3 | **N. Julián Maya González** | `Técnico` | El que deba aparecer en sus remisiones | No. Sólo es la firma |
| 4 | **Miguel A. Gutiérrez Arandia** | `Técnico` | El que deba aparecer en sus remisiones | No. Sólo es la firma |
| 5 | **José Manuel Méndez Gutiérrez** | `Técnico de campo` | El que deba aparecer en sus remisiones | No. Sólo es la firma |
| 6 | **Alfonso García del Pino Beneitez** | `Director Comercial` | El que deba aparecer en sus remisiones | No. Sólo es la firma |
| 7 | **Ángela Mora Borja** — puede figurar como «Luz Ángela Mora Borja»; es la misma persona | `Coordinador Comercial` | **`Coordinador Comercial`**, exacto | **Sí.** Con ese texto recibe las tres alarmas de plazo y se le proponen los tickets de «Escalado a comercial» |

**No se asigna a nadie:** `Coordinador Técnico` ni `Asistente Comercial`. Quedan vacantes y no se rompe nada: ninguna
regla del código que se publica los consulta.

**Sobre las filas 3 y 4.** Julián Maya y Miguel Gutiérrez son «técnicos de mantenimiento», y en la aplicación los dos
llevan el cargo de permiso `Técnico`: no existe ni se crea otro. La casilla de texto, en cambio, es libre: lo que se
escriba ahí es lo que firma sus remisiones. **Qué texto poner es decisión de Gerencia**; el código no exige ninguno.

**Sobre las filas 1 y 7 — por qué «exacto».** El texto se compara sin exigir mayúsculas, pero las alarmas no perdonan
un espacio de más en medio ni una palabra distinta. «Director de Servicio Técnico» o «Coordinadora Comercial» **no
sirven**: la persona conservaría sus permisos, pero dejaría de recibir la propuesta y las alarmas. Si el campo ya
tiene otro texto, **se sustituye**. Si se deja mal no falla nada a la vista: el ticket se propone a quien lo tenía y
la alarma se reparte entre toda el área Comercial (`apps/desk/server/services/alarmasSla.ts:74-76`).

**Lo que este procedimiento no toca: el rol.** El área de cada persona viene de su rol, no del cargo, y se mira en la
misma ventana. Dos comprobaciones:

- **Gustavo A. Novoa Guzmán** necesita un rol con el área **Servicio Técnico** para mantener la lista de novedades y
  añadir accesorios a un modelo (`packages/shared/src/mantenimientoNovedades.ts:15-18`).
- **Alfonso García del Pino Beneitez** necesita el área **Comercial** para fijar el Top 5
  (`packages/shared/src/cargos.ts:80-83`), salvo que su cuenta sea de administrador: el administrador pasa siempre.

## 3 · Comprobación tras asignar

### 3.1 · Una lectura

En la base `desk`, de sólo lectura:

```sql
BEGIN READ ONLY;

SELECT u.name          AS usuario,
       u.cargo         AS cargo_texto_libre,
       u.cargo_permiso AS cargo_de_permiso,
       u.active        AS activo,
       u.is_admin      AS administrador,
       r.name          AS rol,
       r.areas         AS areas_del_rol
  FROM public.users u
  LEFT JOIN public.roles r ON r.id = u.role_id
 ORDER BY u.cargo_permiso NULLS LAST, u.name;

ROLLBACK;
```

Qué tiene que verse:

1. Las **siete** personas de la tabla, activas, cada una con el cargo de permiso de su fila.
2. En **Gustavo A. Novoa Guzmán**, `Director Técnico` en las **dos** columnas de cargo, y `Servicio Técnico` entre
   las áreas de su rol.
3. En **Ángela Mora Borja**, `Coordinador Comercial` en las **dos** columnas de cargo.
4. **Nadie** con `Coordinador Técnico` ni con `Asistente Comercial` como cargo de permiso.
5. **Nadie más** con `Director Técnico` ni `Coordinador Comercial` en la columna de texto libre: una segunda persona
   con ese texto recibiría también las alarmas, y la propuesta iría a la primera por orden de nombre
   (`apps/desk/src/lib/personas.ts:74-79`).

La salida lleva nombres de personas: se devuelve como «coincide» o «no coincide, y en qué», sin pegarla en ningún
chat. La consulta **no se ha ejecutado**: que corra tal cual con el rol con que se lance es **hipótesis**.

### 3.2 · Dos comprobaciones en pantalla

Lo que «se ve» está leído en el código y no probado: las pantallas quedan fuera de la red de pruebas por decisión
de Gerencia (hipótesis 17 del consolidado).

1. **A quién se propone «Solicitud repuestos».** En un ticket de prueba en estado `En Proceso`, con un usuario de
   Servicio Técnico, abrir la transición «Solicitud repuestos» (`packages/shared/src/transitions.ts:200`) **sin
   ejecutarla**. La persona propuesta tiene que ser **Gustavo A. Novoa Guzmán**. Si propone a otra, o a quien ya
   tenía el ticket, falta o está mal escrita la casilla de texto de la fila 1.
2. **Quién ve el botón de ajustar la prioridad.** En el panel de prioridad de un ticket, el botón «Ajustar» lo ven
   **Gustavo A. Novoa Guzmán** (Director Técnico), **Alfonso García del Pino Beneitez** (Director Comercial con área
   Comercial) y los administradores (`apps/desk/src/components/PanelPrioridad.tsx:27`,
   `packages/shared/src/cargos.ts:104-107`). **No** lo ven Johny A. Luna Roa, los dos técnicos, José Manuel Méndez
   Gutiérrez ni Ángela Mora Borja. Si uno de los dos primeros no lo ve, falta su cargo de permiso; si lo ve alguien
   de los segundos, tiene un cargo que no es el suyo o es administrador.

Con las tres comprobaciones bien, y sólo entonces, se avisa al equipo.

## 4 · Lo que la tabla deja abierto

- **Qué texto firma las remisiones de las filas 2 a 6.** Es de Gerencia y no condiciona el despliegue.
- **«Especialista técnico» no abre hoy ningún acto.** `decision/cargo-encargado-de-inventario` le da un papel
  —recibir «Solicitud repuestos» cuando el Director Técnico esté ausente—, pero ese respaldo no está construido:
  depende de un registro de ausencias que no existe. Hasta entonces, asignar el cargo es dejarlo preparado.
- **F1C-07, después del corte.** La firma del Control de calidad está fijada para el Coordinador Técnico
  (`decision/c6-qa-liberacion` y `decision/roles-validacion-informe`), que queda vacante. Cuando llegue esa tanda,
  Gerencia nombra a alguien o decide quién firma mientras siga vacante. La misma vacante alcanza a la firma «Revisó»
  de los informes.
- **Que las siete personas tengan cuenta activa en producción, y con qué nombre figuran**, es **hipótesis**: se sabe
  al abrir la pantalla «Usuarios».
