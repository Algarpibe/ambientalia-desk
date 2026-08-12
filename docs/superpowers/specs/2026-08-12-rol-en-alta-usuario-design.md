# Rol en el alta de usuario — diseño

**Fecha:** 2026-08-12
**Estado:** aprobado por el usuario, pendiente de plan de implementación

## El problema

Crear un usuario hoy son dos pasos: darlo de alta (correo, nombre, contraseña, casilla de admin) y
después buscarlo en la tabla para asignarle el rol. Mientras tanto el usuario existe «sin rol», que en
este sistema significa sin áreas: no puede ejecutar transiciones ni responder correo. El segundo paso
se olvida con facilidad porque nada lo pide.

## El hallazgo que reduce el alcance

**El servidor ya lo soporta.** `POST /api/users` acepta `roleId`, valida que el rol exista (422 «Rol no
encontrado») y tiene test propio (`routes.test.ts`). El hueco es solo del frontend: la interfaz `NewUser`
del cliente no lleva `roleId` y el formulario `CreateUser` no ofrece el desplegable. Es cableado puro.

## Decisión de diseño

Del usuario, en la sesión del 2026-08-12: **desplegable de rol + casilla de admin, que se desactiva al
marcar Administrador**. Se eligió frente a un desplegable unificado (rol y admin en la misma lista, que
diverge del modelo del API donde `isAdmin` es un booleano aparte) y frente a dejarlos independientes
(permitiría la combinación confusa «admin con rol», que el sistema ignora).

Es el mismo comportamiento que ya tiene la tabla de usuarios: cuando alguien es admin, la celda de rol
muestra «Acceso total (Admin)» porque el admin cortocircuita los roles.

## Qué cambia

Solo frontend, dos ficheros:

1. **`apps/desk/src/api/client.ts`** — `NewUser` gana `roleId: string | null`. `createUser` ya
   serializa el body completo, así que el campo viaja sin más cambios.
2. **`apps/desk/src/components/UsersAdmin.tsx`** — `UsersAdmin` ya carga los roles al montar; se los
   pasa como prop a `CreateUser`. El formulario gana un estado `roleId` (`''` = sin rol) y un `<select>`
   entre la contraseña y la casilla, con «— Sin rol —» y los roles activos — mismo filtro (`r.active`)
   y estilos que el desplegable de la tabla.

   Con Administrador marcado, el select se desactiva y muestra únicamente «Acceso total (Admin)». Al
   enviar, si es admin se manda `roleId: null`: nunca se crea un admin con rol residual, aunque se
   hubiera elegido un rol antes de marcar la casilla.

## Errores

El 422 «Rol no encontrado» (caso raro: alguien borra el rol entre que se abre el formulario y se envía)
cae en el aviso de error que el formulario ya tiene. Nada nuevo.

## Verificación

No hay lógica extraíble a `apps/desk/src/lib/` — es un select y un ternario. Aplica el patrón del
proyecto para cableado de componentes: typecheck + lint + build, y prueba manual del usuario al
desplegar:

1. Crear un usuario eligiendo rol → aparece en la tabla con ese rol.
2. Marcar Administrador → el select se desactiva con «Acceso total (Admin)»; el usuario creado queda
   admin y sin rol.
3. Crear sin tocar el desplegable → usuario sin rol, como hasta ahora.

El test del servidor para `roleId` en el POST ya existe y no se toca.
