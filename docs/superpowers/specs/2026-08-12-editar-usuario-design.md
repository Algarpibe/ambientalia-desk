# Editar usuarios — diseño

**Fecha:** 2026-08-12
**Estado:** aprobado por el usuario, pendiente de plan de implementación
**Continúa:** `2026-08-12-rol-en-alta-usuario-design.md` y `2026-08-12-cargo-empresa-en-alta-usuario-design.md`
(mismo subsistema, misma sesión).

## El problema

La pantalla de Usuarios deja desactivar, hacer administrador, cambiar el rol y resetear la contraseña,
pero **no deja editar a la persona**. En concreto:

- **El nombre no se puede cambiar desde la aplicación.** El servidor sí lo acepta en el PATCH, pero
  ninguna pantalla lo llama: una errata al dar de alta se queda para siempre.
- **El correo no lo acepta ni el servidor.** Corregir «algarpibe@gmial.com» obliga a crear otro usuario
  y desactivar el viejo, que deja basura y rompe la trazabilidad de sus tickets.
- **Cargo y empresa se editan con `prompt()` del navegador**, un cuadro de texto pelado que no valida
  nada y solo deja un campo a la vez.

## Decisiones tomadas

Del usuario, en la sesión del 2026-08-12:

| Decisión | Elegida | Descartada |
|---|---|---|
| Correo | **Editable**, con normalización y 409 si otro lo tiene | Fijo: una errata obligaría a recrear el usuario |
| Cargo y empresa | **Pasan a la ventana de edición**; se retiran los `prompt()` | Dejarlos en la celda: dos formas de editar lo mismo conviviendo |

## Qué cambia

### Servidor (con TDD y mutación posterior)

1. **`apps/desk/server/auth/users.ts`** — el patch de `updateUser` gana `email?: string`, y el `UPDATE`
   lo escribe como una columna más.
2. **`apps/desk/server/auth/routes.ts`** — el PATCH acepta `email`: se normaliza igual que en el alta
   (recortado y en minúsculas), vacío da 422, y **duplicado da 409**.

   ⚠️ **La comprobación de unicidad excluye al propio usuario.** Es el fallo clásico de este endpoint:
   si se pregunta «¿existe alguien con este correo?» sin excluirse, guardar la ficha sin haber tocado
   el correo se rechaza a sí mismo con un 409 y el usuario no puede cambiar ni el nombre. El test lo
   cubre explícitamente, no de refilón.

3. **Cambiar el correo NO cierra la sesión.** Las sesiones van por id de usuario, así que la persona
   sigue dentro y la próxima vez entra con el correo nuevo. Es deliberado: hoy solo se cierran sesiones
   al desactivar a alguien o al cambiarle la contraseña, que son acciones de seguridad; corregirle una
   errata a un compañero no lo es, y echarlo de la sesión sería un daño gratuito. Conviene avisar a la
   persona de que su correo de acceso cambió — eso queda fuera de la aplicación.

### Interfaz (cableado, sin tests propios)

4. **Una ventana «Editar»** con correo, nombre, cargo y empresa, con la misma forma que la de alta.
5. **Se retiran los `prompt()`**: `editarCampo` desaparece y Cargo y Empresa pasan a ser texto normal
   en la tabla. El «Sin definir» en gris cursiva se conserva: sigue diciendo que falta el dato.
6. **La ventana no toca Admin, Activo ni Rol.** Esos tres ya tienen su propio control en la fila, y
   repetirlos en la ventana serían dos formas de hacer lo mismo, con el riesgo de que una pisara a la
   otra. La ventana edita **quién es la persona**; los controles de la fila, **qué puede hacer**.

## Errores

- Correo vacío → 422 «El correo es obligatorio».
- Correo de otro usuario → 409, con el mismo mensaje que ya usa el alta.
- Los dos caen en el aviso de error que la ventana ya tendrá, igual que en la de alta.

## Verificación

Suite completa (tests nuevos de repo y de ruta), typecheck, lint (158 warnings exactos) y build, en
secuencia. Prueba manual del usuario al desplegar:

1. Editar el nombre y el cargo de alguien → la tabla los muestra al cerrar.
2. Corregir un correo → la persona aparece con el nuevo y puede entrar con él.
3. **Guardar sin tocar el correo → debe funcionar**, no dar 409.
4. Poner el correo de otro usuario → 409 con mensaje claro.
5. Cargo y empresa ya no se editan pinchando en la celda; se editan desde «Editar».
