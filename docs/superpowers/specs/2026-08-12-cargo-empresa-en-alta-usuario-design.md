# Cargo y empresa en el alta de usuario — diseño

**Fecha:** 2026-08-12
**Estado:** aprobado por el usuario, pendiente de plan de implementación
**Continúa:** `2026-08-12-rol-en-alta-usuario-design.md` (mismo formulario, sesión anterior del mismo día).

## El problema

Cargo y empresa se imprimen en el documento de remisión — son los datos con los que firma quien la crea.
Hoy solo se pueden poner editándolos en la tabla de usuarios después del alta, con los botones «Sin
definir». Un usuario recién creado que firme una remisión antes de ese segundo paso la firma con los
campos en blanco. Es el mismo patrón de dos pasos que acabamos de quitar para el rol.

## Diferencia con el caso del rol

El rol era solo frontend porque el servidor ya lo aceptaba. Aquí no: las columnas existen y el PATCH
las edita, pero **`createUser` no las incluye en el INSERT y el POST no las lee**. Esto toca servidor,
y donde hay lógica de servidor hay TDD.

## Decisiones tomadas

Del usuario, en la sesión del 2026-08-12:

| Decisión | Elegida | Descartadas |
|---|---|---|
| Empresa en el alta | **Prellenada con «Ambientalia S.A.S.», editable** — ahorra teclearla en el caso común | Vacía como Cargo |
| Dónde vive el cambio | **Servidor acepta los campos en el POST** | Solo frontend (crear + PATCH inmediato: dos peticiones donde cabe una y una ventana con el usuario a medias) |

## Qué cambia

### Servidor (con TDD y mutación posterior)

1. **`apps/desk/server/auth/users.ts`** — el input de `createUser` gana `cargo?: string | null` y
   `empresa?: string | null`; el INSERT añade las dos columnas (default `null`). La tabla ya las tiene
   y `USER_SELECT` ya las devuelve.
2. **`apps/desk/server/auth/routes.ts`** — `POST /api/users` lee `cargo` y `empresa` con la misma
   regla que ya usa el PATCH: `String(...).trim() || null`. Vacío se guarda como NULL para que el
   documento de remisión no imprima una cadena en blanco. La normalización vive en el servidor, como
   todas las puertas de este proyecto; el cliente manda el texto tal cual.
3. **Tests primero:** en `users.test.ts` (createUser persiste cargo/empresa; sin ellos quedan null) y
   en `routes.test.ts` (POST con los campos los devuelve; cadena vacía o espacios → null). Tras verlos
   pasar, mutación para comprobar que muerden.

### Frontend (cableado puro, sin tests — convención del proyecto)

4. **`apps/desk/src/api/client.ts`** — `NewUser` gana `cargo: string; empresa: string`.
5. **`apps/desk/src/components/UsersAdmin.tsx`** — dos inputs de texto tras «Nombre»: «Cargo
   (opcional)» vacío y «Empresa» con valor inicial `Ambientalia S.A.S.`, editable. Orden final del
   formulario: Correo, Nombre, Cargo, Empresa, Contraseña, Rol, Administrador — los datos de la
   persona juntos, credenciales y permisos al final.

## Errores

Nada nuevo: los campos son opcionales y el aviso de error existente del formulario cubre cualquier
4xx del servidor.

## Verificación

Suite completa (hay tests nuevos de servidor), typecheck, lint (158 warnings exactos), build — en
secuencia, nunca a la vez. Prueba manual del usuario al desplegar:

1. Crear un usuario con cargo y empresa → la tabla los muestra.
2. Crear borrando la empresa prellenada → queda «Sin definir» (NULL, no cadena vacía).
3. Una remisión firmada por el usuario nuevo imprime su cargo y empresa.
