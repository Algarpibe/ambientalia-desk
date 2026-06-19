# Modelo de autorización — Desk Ambientalia

> Decisión consciente (auditoría F2-07, 2026-06-19): documentar y **aceptar** el modelo actual. No es un descuido; es lo apropiado para una herramienta interna de un solo equipo.

## Contexto
Desk es una herramienta **interna y mono-tenant**: todos los usuarios son personal de Ambientalia que **colabora** sobre el mismo conjunto de tickets de servicio técnico. No hay clientes externos ni separación por organización.

## Autenticación
- Sesión por cookie `sid` (opaca, en BD, 30 días, `httpOnly`+`sameSite=lax`+`secure` en prod). `requireAuth` protege `/api/tickets/*` y los datos de negocio (clientes, equipos, contactos, actividades).
- Rate-limit en login/cambio de contraseña; helmet; errores genéricos al cliente.

## Autorización (intencional)
**1. Lectura/edición de tickets = cualquier usuario autenticado.**
Todo el staff con sesión puede ver y editar **todos** los tickets: listado (activos + cerrados paginados), detalle, creación, conversaciones, historial, estado de leído, resolución (guardar). **No hay propiedad por-ticket ni segmentación por área en la visibilidad.** Es deliberado: el equipo se cubre entre sí, reasigna y necesita ver el panorama completo. Segmentar estorbaría la operación.

**2. Gateado por ÁREA (rol):**
- **Transiciones del Blueprint** → `canExecuteTransition(areas, isAdmin, t.area)`: el usuario necesita el área de la transición (o ser admin).
- **Responder (correo saliente al cliente)** → `requireArea`: el usuario debe tener ≥1 área asignada (o ser admin). Áreas: `Comercial`, `Servicio Técnico`, `Compras`.

**3. Solo SUPERADMIN (`isAdmin`):**
- Gestión de usuarios y roles (`/api/users`, `/api/roles`).
- Operaciones destructivas: borrar equipo, borrar resolución/adjuntos.
- Análisis (`/api/analisis`) y operaciones admin (measure-attachments, backfill-*).

**4. Admin** siempre tiene permiso (cortocircuita las comprobaciones de área).

**5. Escrituras a Zoho** (reply) gateadas además por `ENABLE_WRITES`.

## Por qué NO segmentamos la visibilidad de tickets por área
- Equipo único y pequeño que colabora; la cobertura entre áreas requiere ver todo.
- Segmentar exigiría definir qué "área posee" cada ticket (ambiguo) y romper flujos de reasignación/cobertura.
- Sin ganancia de seguridad real (todos son staff de confianza de la misma org).

## Cuándo revisar esta decisión
- Si se incorporan **terceros** (contratistas externos, clientes con acceso) → ahí sí haría falta autorización por recurso/área o multi-tenant.
- Si una regulación exige separación de funciones más estricta.

Hasta entonces, el modelo "autenticado = acceso a todos los tickets; área gatea transiciones/reply; superadmin para gestión y destructivo" es la decisión vigente y aceptada.
