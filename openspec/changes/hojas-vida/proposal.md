---
tanda: F1B-02
motivo: ""
capacidad: [hojas-vida]
maestro: ["ítem 9", "P8"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: hoja de vida con cinco campos y enlace a Drive (F1B-02)

## Intención

La hoja de vida existe (`apps/desk/src/components/HojaDeVida.tsx:145-212`), pero su cabecera sólo
enseña marca, modelo, tipo, serie, cliente y estado (`:159-165`). Faltan los datos comerciales que el
plan pide (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:157`) y el acceso a la carpeta
de Drive del equipo. `equipos` no tiene ninguna de esas columnas (`packages/zoho-sync/src/db/schema.sql:189-201`,
`:208`, `:354`), ni los tipos (`packages/shared/src/types.ts:329-352`).

Procedencia: ítem 9 del §3.2 del maestro (`R08.2.md:3012-3013`), apartado `[EN REVISIÓN — R08]`: vale
como procedencia, no como alcance. La justificación operativa es la fila del plan (`plan:157`) y las
decisiones de Gerencia `decision/p8-p54-drive` (`openspec/config.yaml:1607-1626`) y
`decision/titularidad-mantenedor` (`:1667-1689`), más las cuatro respuestas de alcance de esta tanda.

## Alcance

### Dentro
- Cinco columnas nuevas en `equipos`, todas **opcionales (nullable)**: fecha de adquisición, fecha de
  factura de COMPRA, fin de garantía, `codigo_interno` y mantenedor; y una sexta para el enlace a Drive.
  `ALTER TABLE` sin calificar, correcto porque `equipos` está en `DESK_TABLES` (`migrate.ts:63-64`).
- Tipos compartidos, lectura (`toLite`/`toFull`, `apps/desk/server/db/equipos.ts:38-43` en `acf2701`, `:96-102`) y
  escritura extendiendo el `PATCH` y el `POST` existentes (`apps/desk/server/routes/equipos.ts:47-92`,
  `updateEquipo` en `db/equipos.ts:114-126`). Sin endpoint nuevo. El servidor valida lo que se guarda
  (regla 13): fechas, enlace de Drive **sólo `https://`** consumiendo `urlSegura`
  (`packages/shared/src/remision.ts:100-102`, ya usada en 20 sitios fuera de su fichero — no se
  escribe un validador nuevo, regla 13.1) y mantenedor contra Books, como ya hace con `clientId`
  (`routes/equipos.ts:79-83`).
- `codigo_interno` como identificador secundario: `searchEquipos` (`db/equipos.ts:58-73`) también busca por él.
- Cabecera de `HojaDeVida` con los cinco campos y el botón «Ver en Google Drive»; `EquipoForm`
  (`apps/desk/src/components/EquiposAdmin.tsx:95`) los pide en alta y edición.

### Fuera
- Carga retroactiva del parque ya sembrado (ver comprobaciones de persona).
- La guarda del mantenedor sobre la OV: es **F1B-11** (`config.yaml:1677-1679`). **IV-8 NO se cierra aquí.**
- `tickets.codigo_interno`, `tickets.fecha_factura` y `tickets.doc_almacenada_drive`
  (`packages/zoho-sync/src/db/repo.ts:47`, `:50`, `:53`): no se tocan, renombran ni referencian.
  `fecha_factura` del ticket es la del servicio; `doc_almacenada_drive` es una casilla por transición
  (`packages/shared/src/transitions.ts:223`).
- `tickets.codigo_interno` **es** el código del cliente, confirmado — no hay dos nociones en pugna.
  El glosario del maestro distingue dos columnas consecutivas: columna 32 «Código Servicio» →
  `Tiposervicio_NumeroSerie_Modelo_aammdd` y columna 33 «Código Interno» → «Código que el cliente
  asigna a su equipo» (`R08.2.md:4498-4503`). La fila de M3.1 «Código interno · Existe · incluye
  serial y modelo; se mantiene por ISO 9001» (`R08.2.md:2025-2027`) describe, por su propio contenido,
  la columna 32: lo único que incluye serial y modelo es `codigo_servicio`, columna distinta de
  `codigo_interno` en el propio esquema (`packages/zoho-sync/src/db/schema.sql:28-29`) y construida
  literalmente con ese formato por `buildCodigoServicio` (`packages/shared/src/ticketCreate.ts:12-13`,
  `[prefijo, serie, modelo, yymmdd].join('_')`). M3.1 usa una etiqueta floja para la columna 32; no
  nombra la 33. El «Falta» de la fila «Código interno del cliente» de M3.1 (`:2047-2049`) no es un
  campo ausente del esquema: es el listado que Alfonso debe extraer y entregar para poblarlo — el
  mismo trabajo que la comprobación de persona de la carga retroactiva, más abajo.
- Cálculo automático de garantía y alertas (`R08.2.md:2043`, `:2046`); marca de visibilidad por campo
  para el portal (`R08.2.md:2052`); almacenamiento propio de documentos (gate cerrado, `config.yaml:1616-1617`).
- Restringir por área quién escribe equipos: hoy basta `requireAuth` (`routes/equipos.ts:47`, `:66`).

## Capacidades

### Nuevas
- `hojas-vida`: ya declarada en `openspec/config.yaml:149-151` (R-2 satisfecha). Su spec se escribe como delta DENTRO del cambio, en `openspec/changes/hojas-vida/specs/hojas-vida/spec.md`; la spec viva `openspec/specs/hojas-vida/` no se crea a mano: aparece al archivar, cuando `sdd-archive` fusiona el delta. *(Corregido el 2026-09-23: esta línea decía «falta crear `openspec/specs/hojas-vida/`», `ee0ed40` la creó ahí directamente y el dispatcher dejó de ver la spec — `specs: missing`, verify bloqueado.)*

### Modificadas
- Ninguna.

## Enfoque

Extender la cadena existente capa a capa, con prueba roja primero en servidor (`apps/desk/server/equipos.test.ts`).
Los `.tsx` quedan fuera de la red por decisión (F0-00), así que toda regla vive en servidor o en
`packages/shared`, y el cliente la consume.

## Justificación de la cabecera

- **`cierra: si`**: se entrega todo el contenido de `plan:157` —campos, identificador secundario, botón
  de Drive y alta al conocer el serial—. La carga retroactiva es trabajo de persona (regla del ciclo 1),
  y la guarda del mantenedor pertenece a F1B-11, no a esta fila.
- **`toca_maestro: si`**: el ítem 9 (`R08.2.md:3013`), M3.1 (`:2038-2049`) y el Anexo H (`:4724`)
  hablan de cuatro campos y no nombran al mantenedor. Al archivar hay que actualizar el Anexo H
  (`config.yaml:1846`).

## Áreas afectadas

| Área | Impacto |
|---|---|
| `packages/zoho-sync/src/db/schema.sql` | Modificada: seis `ALTER` |
| `packages/shared/src/types.ts` | Modificada |
| `apps/desk/server/db/equipos.ts`, `routes/equipos.ts`, `equipos.test.ts` | Modificadas |
| `apps/desk/src/components/HojaDeVida.tsx`, `EquiposAdmin.tsx` | Modificadas |

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| «Alta por Comercial» leído como permiso y no como flujo: `cierra` pasaría a `no` | Baja | Fuera de alcance por escrito |
| Presupuesto de 800: código, pruebas, artefactos e informes de verify/archive | Media | Lo decide `sdd-tasks` |

## Plan de vuelta atrás

Columnas nullable y aditivas: revertir el commit deja las columnas sin lector ni escritor. Los demás
escritores de `equipos` sólo tocan columnas existentes (`apps/desk/server/backfillClientId.ts:135`,
`apps/desk/server/db/catalogo.ts:273`, `apps/desk/server/db/catalogoSeed.ts:170`).

## Dependencias

- Ninguna tanda previa. F1B-11 depende de esta.

## Criterios de éxito

- [ ] `PATCH` guarda y devuelve los seis datos; un valor inválido da `422` sin escribir nada.
- [ ] Un equipo sin los campos sigue operando igual (alta, desactivar, tickets).
- [ ] Buscar por `codigo_interno` devuelve el mismo equipo que por serial.
- [ ] La hoja de vida enseña los campos y abre la carpeta de Drive.

## Comprobaciones de persona — no son tareas

Archivar esta propuesta **no las da por hechas**.

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Carga retroactiva de los campos en el parque ya sembrado; su tamaño se mide con `SELECT count(*) FROM equipos` (hipótesis: cifra no remedida) | Comercial / Gerencia | `archive-report.md` de esta tanda |
| Apuntar el mantenedor del caso conocido (`config.yaml:1687-1688`) | Comercial | ídem |
