# Delta para `remisiones`

## ADDED Requirements

### Requirement: RQ-RE-29 · La lista de novedades de entrada la mantiene el Director Técnico desde la aplicación

`public.catalogo_novedades` (RQ-RE-21) **SHALL** poder mantenerse sin SQL: listar todas las novedades —activas y
retiradas—, dar de alta una nueva y cambiar la etiqueta, el orden, si está activa y si exige texto
(`decision/f1b04-desplegables`). Sólo **MAY** hacerlo quien tenga el área Servicio Técnico y el cargo Director Técnico,
o un administrador; la regla vive en `packages/shared` y el servidor la impone.

**Lo que no se puede.** La clave **MUST NOT** cambiar ni repetirse. Ninguna novedad se borra: se retira con
`activo = false`. La que excluye a las demás («Sin novedad») **MUST NOT** retirarse ni perder esa marca, y ninguna otra
la gana. Dos novedades **MUST NOT** tener la misma etiqueta, sin distinguir mayúsculas ni espacios de los extremos.

**Orden de guardas** (F1B-10): existencia (`404`) → permiso (`403`) → contenido (`422`) → unicidad (`409`).

#### Scenario: El Director Técnico da de alta una novedad
- GIVEN un usuario con área Servicio Técnico y cargo Director Técnico
- WHEN da de alta la clave `tapa_suelta` con la etiqueta «Tapa suelta»
- THEN responde `201` y la novedad aparece activa en la lista del formulario

#### Scenario: Otro cargo no puede
- GIVEN un usuario de Servicio Técnico con cargo Técnico
- WHEN intenta dar de alta o cambiar una novedad
- THEN responde `403` y la tabla no cambia

#### Scenario: Retirar en vez de borrar
- GIVEN la novedad `sello_roto` activa
- WHEN el Director Técnico la marca como no activa
- THEN deja de servirse al formulario y sigue en la tabla, legible para las remisiones que ya la marcaron

#### Scenario: «Sin novedad» no se retira
- GIVEN la novedad que excluye a las demás
- WHEN alguien intenta retirarla o quitarle la marca
- THEN responde `422` y la tabla no cambia

#### Scenario: Unicidad
- GIVEN la etiqueta «Otro» ya existe
- WHEN se da de alta otra con la etiqueta « otro »
- THEN responde `409`
