# Diseño — `ficha-garantia-proveedor`

Leído en el worktree `ficha-garantia-proveedor` el 2026-10-06. Los supuestos S-1…S-12 del `proposal.md` se toman
como fijados. Toda línea citada se leyó en ese árbol; lo que no, lleva «hipótesis». Los ficheros que este cambio
CREA se nombran sin línea: todavía no existen.

## 1 · Enfoque

La regla vive en `packages/shared` (puro). El servidor lee la asociación, aplica la escalera A < B < C < D y traduce
a HTTP; la base respalda la unicidad con un índice. En los ficheros muy citados se editan líneas **en sitio** o se
añade **al final**: ninguna línea existente cambia de número (§10).

    POST /api/ov-asociaciones/:id/garantia-proveedor
      asociación (A) ─► cargo (B) ─► vigente (B) ─► esOVI (C) ─► validarRespuesta (C) ─► sin respuesta previa (D) ─► INSERT
    ficha ─► PUT (editar) │ POST …/avanzar ─► UPDATE condicionado al estado leído ─► RETURNING
    pasada diaria ─► fichas sin resolver y sin marca ─► reclamacionVencida(abierta, hoy) ─► marca + avisos (1 transacción)

## 2 · Decisiones

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| D-1 | UNA tabla, una fila por asociación respondida; el «no» es una fila con `reclama = false` y su motivo | Tabla aparte para las respuestas «no» | G6 es una sola pregunta («¿esta asociación ya tiene respuesta?») y la respalda UN índice único. Con dos tablas la carrera «sí» contra «no» no la cierra ningún índice |
| D-2 | Permiso con nombre propio en `shared`: `puedeGestionarReclamacion`, que sólo llama a `puedeCrearOVIGarantia`. Servidor y cliente llaman a la nueva | Llamar a `puedeCrearOVIGarantia` desde la ruta y el panel | `packages/shared/src/cargos.test.ts:228` exige que el ÚNICO fichero que contiene esa llamada sea `ordenOVI.ts`: cada llamador nuevo la pone roja. Con el envoltorio la lista pasa a dos ficheros de `shared` y no vuelve a crecer; además S-2 se revierte en un solo sitio |
| D-3 | Los validadores devuelven `{ ok: true, valor } \| { ok: false, error }`, con el valor ya normalizado | «motivo o `null`» (redacción de trabajo del proposal §3) | La ruta necesita el valor recortado y el número convertido; devolver sólo el motivo obligaría a normalizar dos veces. Es la forma de `cargoPermisoDelCuerpo` (`packages/shared/src/cargos.ts:90`) |
| D-4 | Listas guardadas como CLAVES ASCII (`fuera_de_garantia`, `enviada`, `nota_credito`) con su etiqueta en `shared` | Guardar el texto visible | Un cambio de redacción no toca datos; las mediciones futuras agrupan por clave. Precedente: `origen` de `packages/zoho-sync/src/db/schema.sql:544` |
| D-5 | Avanzar NOMBRA el destino en el cuerpo (`a`) y el `UPDATE` va condicionado al estado leído | Avanzar «al siguiente» sin nombrarlo | Un cliente con la pantalla vieja que resuelve una ficha aún «abierta» la pasaría a «enviada» descartando el resultado. Con destino explícito G9 lo dice (`409`) y el `UPDATE … WHERE estado = $2` cierra la carrera |
| D-6 | La fecha de apertura ES `respondida_at`: no hay columna `abierta_at` | Columna propia | Un «sí» abre la ficha en el mismo acto (S-6): serían dos columnas con el mismo valor siempre |
| D-7 | Capa de datos en `apps/desk/server/db/` (molde de contratos) | En `packages/zoho-sync/src/db/` (molde de `ovAsociaciones.ts`) | Nada del sincronizador ni del worker la usa; `ovAsociaciones.ts` vive en el paquete porque `writeTransition` la llama. La prueba de que la tabla EXISTE sí va en `migrate.test.ts` |
| D-8 | «Es OVI» y «pendiente» se deciden en TypeScript con `esOVI` sobre `listarAsociaciones` | `WHERE numero ILIKE 'OVI-%'` en SQL | Sería una segunda implementación de «es OVI» (molde H5); `packages/shared/src/subOV.ts:65-67` se declara la única |
| D-9 | El fabricante propuesto lo devuelve la LECTURA (`fabricantePropuesto`, de `tickets.marca`) | Que el panel lo saque del ticket ya cargado | Queda probado en el servidor; el `.tsx` no tiene red de pruebas. `marca` es columna del ticket (`packages/zoho-sync/src/db/schema.sql:28`) |
| D-10 | La ruta traduce la carrera capturando `ReclamacionYaRespondidaError` | Añadir la clase al manejador central | `apps/desk/server/app.ts:79` no se toca; es lo que hace `apps/desk/server/routes/contratos.ts:55-61` |
| D-11 | El aviso busca destinatarios ANTES del `UPDATE` de la marca y, si no hay ninguno, no marca | Marcar siempre, haya o no destinatarios (como las alarmas) | Es un aviso ÚNICO por ficha (S-12): quemar la marca sin que nadie lo reciba lo pierde para siempre. El orden sigue siendo una transacción y un solo cliente |
| D-12 | Sin `CHECK` de listas; UN `CHECK` de coherencia sí/no (H-1) | Ningún `CHECK`, o listas en la base | Las listas viven en `shared` (precedente `packages/zoho-sync/src/db/schema.sql:601`); la coherencia entre columnas no es una lista y la base puede defenderla, como `packages/zoho-sync/src/db/schema.sql:570` |
| D-13 | El panel no se pinta si el ticket no tiene ninguna OVI | Panel siempre visible | La mayoría de los tickets no llevan OVI; lo decide la respuesta del servidor (lista vacía), no una regla del cliente |
| D-14 | Pruebas de servidor en ficheros NUEVOS; la consulta nueva de `avisos.ts` se prueba en la prueba del servicio | Añadirlas a pruebas existentes | No desplaza líneas citadas de pruebas ajenas |

## 3 · `packages/shared/src/garantiaProveedor.ts` (nuevo, lote 1a)

Se exporta añadiendo `; export * from './garantiaProveedor'` a `packages/shared/src/index.ts:37` (la última línea).

    export const MOTIVOS_NO_RECLAMA = ['fuera_de_garantia', 'mal_uso', 'costo_envio'] as const
    export const ESTADOS_RECLAMACION = ['abierta', 'enviada', 'resuelta'] as const
    export const RESULTADOS_RECLAMACION = ['reposicion', 'nota_credito', 'rechazada'] as const
    export const ETIQUETA_MOTIVO_NO_RECLAMA / ETIQUETA_ESTADO_RECLAMACION / ETIQUETA_RESULTADO_RECLAMACION   // Record<clave, texto>
    export const ORIGEN_VALOR_MANUAL = 'manual'
    export const DIAS_AVISO_RECLAMACION = 60
    export const MENSAJE_SIN_CARGO_RECLAMACION   // nombra EXCEPCIONES_POR_CARGO.crearOVIGarantia
    export interface GarantiaProveedor { id; asociacionId; ticketId; oviNumero; reclama; motivoNoReclama; respondidaPor; respondidaAt;
      fabricante; piezaReferencia; piezaSerial; rma; valorReclamado; origenValorReclamado; estado; resultado; valorRecuperado;
      enviadaAt; resueltaAt; aviso60At }
    export function puedeGestionarReclamacion(s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>): boolean
    export function siguienteEstado(estado: unknown): EstadoReclamacion | null
    export function motivoPasoNoPermitido(estado: unknown, a: unknown): string | null
    export function validarRespuesta(cuerpo: unknown): Validado<RespuestaReclamacion>
    export function validarDatosFicha(cuerpo: unknown): Validado<DatosFicha>
    export function validarPaso(a: EstadoReclamacion, cuerpo: unknown): Validado<PasoReclamacion>
    export function reclamacionVencida(abiertaEl: DiaCivil, hoy: DiaCivil): boolean

- `siguienteEstado`: `abierta → enviada → resuelta → null`; cualquier otra cosa, `null`. Sin retrocesos ni saltos (S-6).
- `motivoPasoNoPermitido`: `null` sólo si `a === siguienteEstado(estado)`. Un destino desconocido tampoco es el
  siguiente: lo responde G9 (`409`), no el contenido.
- `validarRespuesta`: `reclama` tiene que ser booleano. Con `false`, `motivo` ∈ `MOTIVOS_NO_RECLAMA` y lo demás se
  ignora. Con `true`: `fabricante` recortado no vacío; `piezaReferencia` y `piezaSerial` texto o `null`;
  `valorReclamado` ausente → `null`, o número finito ≥ 0.
- `validarDatosFicha`: reemplazo completo de los cinco datos editables (`fabricante`, `piezaReferencia`,
  `piezaSerial`, `rma`, `valorReclamado`), con las mismas reglas.
- `validarPaso`: a `enviada` no exige nada. A `resuelta`: `resultado` ∈ `RESULTADOS_RECLAMACION`; con `rechazada`,
  `valorRecuperado` ausente o `0` (se guarda `0`) y cualquier otro valor es error; con los otros dos, número finito ≥ 0
  obligatorio.
- `reclamacionVencida`: `diasEntre(abiertaEl, hoy) > DIAS_AVISO_RECLAMACION`, con `diasEntre` de
  `packages/shared/src/contratos.ts:123-125`. Estricto: el día 60 no avisa, el 61 sí (S-7, días naturales).

**`packages/shared/src/cargos.test.ts:226-228`, en sitio (dos líneas):** el título y la lista esperada pasan a
`['shared/src/garantiaProveedor.ts', 'shared/src/ordenOVI.ts']`. Ojo: la prueba busca el nombre seguido del
paréntesis de apertura en CUALQUIER parte del fichero, comentarios incluidos; fuera de esos dos ficheros la primitiva
se nombra sin paréntesis.

## 4 · Esquema (lote 1a)

Al FINAL de `packages/zoho-sync/src/db/schema.sql` (hoy acaba en `packages/zoho-sync/src/db/schema.sql:724`).
Comentarios sin punto y coma: `schemaStatements` trocea por ese carácter (`packages/zoho-sync/src/db/migrate.ts:20`).
Sin claves foráneas, como `packages/zoho-sync/src/db/schema.sql:539-554`.

    CREATE TABLE IF NOT EXISTS public.garantia_proveedor (
      id bigserial PRIMARY KEY,
      asociacion_id bigint NOT NULL,           -- ov_asociaciones.id, sin FK
      ticket_id text NOT NULL,                 -- copiado de la asociacion
      ovi_numero text NOT NULL,                -- copiado y congelado (S-8)
      reclama boolean NOT NULL,
      motivo_no_reclama text,                  -- clave de MOTIVOS_NO_RECLAMA, sin CHECK de lista
      respondida_por text NOT NULL,
      respondida_at timestamptz NOT NULL DEFAULT now(),   -- en un si, es la apertura de la ficha
      fabricante text,
      pieza_referencia text,
      pieza_serial text,
      rma text,
      valor_reclamado numeric,
      origen_valor_reclamado text,             -- manual (S-4)
      estado text,                             -- abierta | enviada | resuelta, NULL en un no
      resultado text,
      valor_recuperado numeric,
      enviada_at timestamptz,
      resuelta_at timestamptz,
      aviso_60_at timestamptz,                 -- marca anti-ruido del aviso (S-12)
      CONSTRAINT garantia_proveedor_si_o_no CHECK ((reclama AND estado IS NOT NULL AND motivo_no_reclama IS NULL) OR (NOT reclama AND estado IS NULL AND motivo_no_reclama IS NOT NULL))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_garantia_proveedor_asociacion ON public.garantia_proveedor (asociacion_id);
    CREATE INDEX IF NOT EXISTS idx_garantia_proveedor_ticket ON public.garantia_proveedor (ticket_id);

- `packages/zoho-sync/src/db/migrate.ts:73`: se añade `, 'garantia_proveedor'` dentro de esa misma línea.
- `packages/zoho-sync/src/db/migrate.test.ts:282-286`, en sitio: 41 → 42 (título y tres aserciones) y `[10, 28, 3]` →
  `[10, 29, 3]`. El recuento de `ALTER` de la línea 374 del mismo fichero NO cambia: no se añade ninguna.
- Prueba nueva al FINAL de `migrate.test.ts` (acaba en `packages/zoho-sync/src/db/migrate.test.ts:444`): la tabla
  existe tras `migrate` y un segundo `INSERT` con el mismo `asociacion_id` da `23505`.

**H-1 (hipótesis):** que pg-mem acepte el `CHECK` compuesto. Si no, `migrate` omite la sentencia entera
(`packages/zoho-sync/src/db/migrate.ts:29-35`) y la prueba de la tabla se pone roja: se ve en el primer rojo del
lote. Respaldo: quitar el `CHECK` y anotarlo; la guarda es el servidor.

**Regla de mutación 2 — se ensucia `schema.sql`, no el guardián:** (a) quitar `public.` del `CREATE` → roja
`packages/zoho-sync/src/db/migrate.test.ts:266`; (b) quitar la entrada de `PUBLIC_TABLES` → roja la misma; (c) borrar
el `CREATE UNIQUE INDEX` → roja la prueba nueva del `23505`; (d) escribir un punto y coma dentro de un comentario del
`CREATE` → roja la prueba de la tabla.

## 5 · Capa de datos: `apps/desk/server/db/garantiaProveedor.ts` (nuevo, lote 1a)

Consultas sin calificar, como `apps/desk/server/db/contratos.ts:26-41` (la tabla sólo existe en `public`).

    export class ReclamacionYaRespondidaError extends Error            // el 23505 traducido
    export interface AsociacionParaReclamar { id: number; ticketId: string; numero: string; liberada: boolean }
    export async function asociacionPorId(db, id: number): Promise<AsociacionParaReclamar | null>
    export async function respuestaDeAsociacion(db, asociacionId: number): Promise<GarantiaProveedor | null>
    export async function registrarRespuesta(db, a: { asociacion: AsociacionParaReclamar; respuesta: RespuestaReclamacion; por: string }): Promise<GarantiaProveedor>
    export async function reclamacionPorId(db, id: number): Promise<GarantiaProveedor | null>
    export async function editarFicha(db, id: number, datos: DatosFicha): Promise<GarantiaProveedor | null>
    export async function avanzarFicha(db, id: number, desde: EstadoReclamacion, paso: PasoReclamacion): Promise<GarantiaProveedor | null>
    export async function garantiaDelTicket(db, ticketId: string): Promise<GarantiaDelTicket>
    export async function fichasSinResolverNiAvisar(db): Promise<GarantiaProveedor[]>

- `registrarRespuesta`: un `INSERT … RETURNING`; copia `ticket_id` y `numero` de la asociación; un «sí» nace con
  `estado = 'abierta'` y `origen_valor_reclamado = 'manual'`. `23505` → `ReclamacionYaRespondidaError`
  (molde `apps/desk/server/db/contratos.ts:50-52`).
- `editarFicha`: `UPDATE … WHERE id = $1 AND reclama = true AND estado <> 'resuelta' RETURNING`; `null` si no tocó nada.
- `avanzarFicha`: `UPDATE … WHERE id = $1 AND estado = $2 RETURNING`; pone `enviada_at` o `resuelta_at` con `now()`.
- `garantiaDelTicket`: `listarAsociaciones` (`packages/zoho-sync/src/db/ovAsociaciones.ts:81-84`) filtrada con
  `esOVI`, más las filas de la tabla por `ticket_id`, más `SELECT marca FROM tickets WHERE id = $1`. Devuelve
  `{ fabricantePropuesto, ovis: [{ asociacionId, numero, liberada, respuesta, pendiente }] }`, con
  `pendiente = !liberada && respuesta === null`. Una OVI liberada SIN respuesta no sale (S-11); liberada CON respuesta
  sí, con su ficha intacta (S-8).
- El mapeador pasa los `numeric` por `Number()` y los instantes a ISO, como
  `apps/desk/server/db/contratos.ts:30` y `apps/desk/server/db/contratos.ts:36`. **H-2 (hipótesis):** que pg-mem
  devuelva `numeric` como número y node-postgres como texto; el mapeador cubre los dos y la prueba de ida y vuelta lo fija.

## 6 · Rutas: `apps/desk/server/routes/garantiaProveedor.ts` (nuevo, lote 1b)

`registerGarantiaProveedorRoutes(app, { db })`. Registro, en sitio: `apps/desk/server/app.ts:22` gana la importación
al final y `apps/desk/server/app.ts:61` la llamada al final. Todas con `requireAuth(db)`; el sujeto es `req.user`
(`apps/desk/server/auth/middleware.ts:9`). Un id no numérico no llega a la base
(`apps/desk/server/routes/ovAsociaciones.ts:44`).

| Verbo y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /api/tickets/:id/garantia-proveedor` | — | `200` `GarantiaDelTicket`; sin guarda propia (S-2) |
| `POST /api/ov-asociaciones/:id/garantia-proveedor` | `{ reclama, motivo?, fabricante?, piezaReferencia?, piezaSerial?, valorReclamado? }` | `201` `GarantiaProveedor` |
| `PUT /api/garantia-proveedor/:id` | `{ fabricante, piezaReferencia, piezaSerial, rma, valorReclamado }` | `200` `GarantiaProveedor` |
| `POST /api/garantia-proveedor/:id/avanzar` | `{ a, resultado?, valorRecuperado? }` | `200` `GarantiaProveedor` |

**Orden exacto de cada manejador:**

| Acto | Orden | Código y texto |
|---|---|---|
| Responder | G1 `asociacionPorId` nula | `404` «Asociación no encontrada» |
| | G2 `!puedeGestionarReclamacion(user)` | `403` `MENSAJE_SIN_CARGO_RECLAMACION` |
| | G3 `asociacion.liberada` | `409` «La orden de venta ya está liberada de este ticket: no admite respuesta» |
| | G4 `!esOVI(asociacion.numero)` | `422` «La orden de venta N no es una OVI: la reclamación al fabricante sólo se responde sobre una OVI» |
| | G5 `validarRespuesta` | `422` con su texto |
| | G6 `respuestaDeAsociacion` no nula; y la carrera, por `ReclamacionYaRespondidaError` | `409` «La orden de venta N ya tiene respuesta sobre la reclamación al fabricante» |
| Avanzar | G7 fila nula o `reclama === false` | `404` «Reclamación no encontrada» |
| | G8 sin cargo | `403` |
| | G9 `motivoPasoNoPermitido(estado, a)` | `409` con su texto |
| | G10 `validarPaso(a, cuerpo)` | `422` |
| | `avanzarFicha` devuelve `null` (carrera) | `409`, el texto de G9 |
| Editar | G11 fila nula o `reclama === false` | `404` |
| | G12 sin cargo | `403` |
| | G13 `estado === 'resuelta'` | `409` «La reclamación está resuelta y ya no se edita» |
| | G14 `validarDatosFicha` | `422` |
| | `editarFicha` devuelve `null` (carrera) | `409`, el texto de G13 |

**Pares cuya POSICIÓN se prueba** (regla de mutación 1; cada caso activa las dos guardas a la vez):

| Id | Caso | Espera | Fija |
|---|---|---|---|
| POS-RS-1 | id inexistente, sin cargo | `404` | G1 < G2 |
| POS-RS-2 | asociación liberada, sin cargo | `403` | G2 < G3 |
| POS-RS-3 | liberada y `OV-` ordinaria, con cargo | `409` | G3 < G4 |
| POS-RS-4 | `OV-` ordinaria y cuerpo inválido | `422` con el texto de «no es una OVI» | G4 < G5 |
| POS-RS-5 | ya respondida y cuerpo inválido | `422` | G5 < G6 |
| POS-RS-6 | ya respondida, sin cargo | `403` | G2 < G6 |
| POS-RS-7 | liberada y ya respondida, con cargo | `409` con el texto de liberada | G3 < G6, por el texto |
| POS-AV-1 | id inexistente, sin cargo; y una respuesta «no», sin cargo | `404` | G7 < G8 |
| POS-AV-2 | sin cargo y paso no permitido | `403` | G8 < G9 |
| POS-AV-3 | ficha «abierta», `a: 'resuelta'` con resultado fuera de la lista | `409` | G9 < G10 |
| POS-ED-1 | id inexistente, sin cargo | `404` | G11 < G12 |
| POS-ED-2 | ficha resuelta, sin cargo | `403` | G12 < G13 |
| POS-ED-3 | ficha resuelta y fabricante vacío | `409` | G13 < G14 |

No observables, y no se fingen (proposal §4): G1 frente a G3–G6, G7 frente a G9–G10, G11 frente a G13–G14.

## 7 · Aviso de 60 días (lote 2)

**`apps/desk/server/db/avisos.ts`, al FINAL** (acaba en `apps/desk/server/db/avisos.ts:113`):
`destinatariosDeCargoPermiso(db, cargo: Cargo)`, con `SELECT id, email, name FROM users WHERE active = true AND
cargo_permiso = $1`. Igualdad exacta en SQL: el cargo de permiso es lista cerrada y `esCargo` no pliega nada
(`packages/shared/src/cargos.ts:19-22`); `destinatariosDeCargo` no sirve porque filtra la firma
(`apps/desk/server/db/avisos.ts:109`).

**`apps/desk/server/services/avisoReclamacionProveedor.ts` (nuevo):**

    export async function marcarYAvisarReclamacion(db, f: GarantiaProveedor, texto: string): Promise<boolean>
    export async function avisarReclamacionesVencidas(db, hoy: DiaCivil): Promise<number>
    export async function pasadaReclamaciones(db, hoy: DiaCivil = hoyEnZona()): Promise<void>

- `marcarYAvisarReclamacion`, dentro de `enTransaccion` (`apps/desk/server/db/transaccion.ts:13-28`) y todo por el
  cliente `q`: (1) destinatarios por `EXCEPCIONES_POR_CARGO.crearOVIGarantia`; si no hay ninguno,
  `destinatariosDeArea(q, 'Servicio Técnico', '')` (`apps/desk/server/db/avisos.ts:74`; patrón de
  `apps/desk/server/services/alarmasSla.ts:73-77`); si tampoco, `false` sin marcar y un `warn` (D-11).
  (2) `UPDATE garantia_proveedor SET aviso_60_at = now() WHERE id = $1 AND aviso_60_at IS NULL AND estado <> 'resuelta'
  RETURNING id`; cero filas → `false`. (3) un `crearAviso` por destinatario, con el `ticket_id` de la ficha.
  Mismo esqueleto que `apps/desk/server/services/avisoRitmoContrato.ts:25-37`.
- `avisarReclamacionesVencidas`: recorre `fichasSinResolverNiAvisar`, calcula `reclamacionVencida(diaEnZona(respondidaAt), hoy)`
  (`packages/shared/src/fechasDerivadas.ts:63`) y avisa; un fallo en una ficha se registra y no para a las demás.
- `pasadaReclamaciones`: una evaluación por día civil y proceso, y NUNCA lanza
  (`apps/desk/server/services/avisoRitmoContrato.ts:67-75`).
- Texto: `La reclamación al fabricante ${fabricante} por la orden ${oviNumero} lleva más de ${DIAS_AVISO_RECLAMACION}
  días abierta: se abrió el ${día} y sigue «${etiqueta del estado}».` Sólo de bandeja (S-9).

**`apps/desk/server/index.ts`, dos líneas en sitio.** `apps/desk/server/index.ts:15` gana la importación al final.
`apps/desk/server/index.ts:88` pasa a:

    let p: Promise<unknown> = pasadaAlarmas(pool, config).then(() => pasadaReclamaciones(pool)).then(() => pasadaRitmoContratos(pool).then(() => sync.syncRecent()))

La forma no es libre: `apps/desk/server/services/avisoRitmoContrato.test.ts:194` exige el texto
`pasadaRitmoContratos(pool).then(() => sync.syncRecent())` y `apps/desk/server/services/alarmasSla.test.ts:260`
exige alarmas → ritmo → sincronización en esa línea. Las dos siguen verdes. Una prueba nueva del mismo molde
(fichero vigilado) fija que `pasadaReclamaciones(pool)` está en esa línea y antes de `sync.syncRecent()`.

## 8 · Cliente (lote 2)

- `apps/desk/src/api/client.ts`, al FINAL: `garantiaDelTicket`, `responderReclamacion`, `editarReclamacion`,
  `avanzarReclamacion` y el tipo `GarantiaDelTicket`; los errores se enseñan con `mensajeDelServidor`
  (`apps/desk/src/api/client.ts:660-670`).
- `apps/desk/src/components/PanelGarantiaProveedor.tsx` (nuevo), hermano de `PanelOvAsociaciones`
  (`apps/desk/src/components/PanelOvAsociaciones.tsx:78-102`): plegado, cabecera «RECLAMACIÓN AL FABRICANTE (n
  pendientes de respuesta)», una fila por OVI con la pregunta «¿Se reclama al fabricante?» (Sí / No), el formulario
  de la ficha, el botón del paso siguiente («Marcar como enviada al fabricante», «Resolver») y la marca «Pendiente
  de respuesta».
- Montaje en sitio: `apps/desk/src/components/TicketDetailView.tsx:15` gana la importación al final y
  `apps/desk/src/components/TicketDetailView.tsx:320` gana `{ticket && <PanelGarantiaProveedor ticketId={ticketId} />}`
  detrás de `PanelOvAsociaciones`.
- Límite conocido: liberar una orden en `PanelOvAsociaciones` no recarga este panel hasta volver a abrir el ticket.

**Regla invariable 13 — decisión a decisión.** La línea del servidor se escribe al cerrar el lote 2 (regla de mutación 3).

| # | Decisión del cliente | Qué consume | La impone |
|---|---|---|---|
| 1 | Enseña la pregunta, el formulario y los botones sólo a quien tiene el cargo | `puedeGestionarReclamacion` | G2, G8, G12 |
| 2 | Ofrece la pregunta sólo en las filas con `pendiente` | la lectura del servidor | G3, G4, G6 |
| 3 | Las tres opciones del «no» | `MOTIVOS_NO_RECLAMA` y sus etiquetas | G5 |
| 4 | Ofrece sólo el paso siguiente | `siguienteEstado` | G9 |
| 5 | Rellena el fabricante con `fabricantePropuesto` | la lectura del servidor | nada: es relleno; el servidor sólo exige que no esté vacío (G5, G14) |
| 6 | Pinta «Pendiente de respuesta» | la lectura del servidor | no decide nada |
| 7 | Oculta el formulario de edición en una ficha resuelta | `estado` de la lectura | G13 |
| 8 | Al resolver como «rechazada» no pide valor recuperado | `RESULTADOS_RECLAMACION` | G10 |
| 9 | No pinta el panel si no hay OVI | la lectura del servidor (lista vacía) | no decide nada |

El cliente NO valida números ni textos: manda y enseña el `422`. Los `.tsx` no llevan rojo previo.

## 9 · Pruebas (strict_tdd) y mutaciones

| Fichero | Lote | Qué prueba | Cómo |
|---|---|---|---|
| `packages/shared/src/garantiaProveedor.test.ts` | 1a | listas (tres y tres y tres, etiqueta por clave), `siguienteEstado`, `motivoPasoNoPermitido`, los tres validadores por tabla, `reclamacionVencida` en los días 59, 60 y 61, `puedeGestionarReclamacion` igual a `puedeCrearOVIGarantia` para los ocho cargos, sin cargo y administrador | puro |
| `packages/shared/src/cargos.test.ts` | 1a | la lista de llamadores (§3) | en sitio |
| `packages/zoho-sync/src/db/migrate.test.ts` | 1a | recuento 29 y 42; tabla e índice único | pg-mem |
| `apps/desk/server/db/garantiaProveedor.test.ts` | 1a | ida y vuelta de un «sí» y de un «no»; `23505` traducido; el `CHECK` por `INSERT` directo; `editarFicha` y `avanzarFicha` condicionados; `garantiaDelTicket` (pendiente, liberada con y sin respuesta, `OV-` ordinaria fuera, `fabricantePropuesto`) | pg-mem con `migrate`, molde `apps/desk/server/db/contratos.test.ts:12-13` |
| `apps/desk/server/routes/garantiaProveedor.test.ts` | 1b | matriz por rol de las cuatro rutas (sin sesión `401`; sin cargo `403` y lectura `200`; Director Técnico con área Comercial; administrador), los trece POS de §6, el camino feliz completo, liberar deja la ficha intacta (S-8), segunda respuesta `409` (S-10) | `supertest` con `instalarArnes` y `userCookie(areas, cargo)` (`apps/desk/server/testing/appHarness.ts:34-40`, `apps/desk/server/testing/appHarness.ts:91-95`) |
| `apps/desk/server/services/avisoReclamacionProveedor.test.ts` | 2 | día 60 no y 61 sí; resuelta no avisa; un solo aviso; destinatarios por cargo de permiso, respaldo al área, inactivo fuera, sin nadie no marca; atomicidad por estructura; la pasada una vez por día y sin lanzar; `index.ts` vigilado | pg-mem, más el rastreador de `apps/desk/server/services/avisoRitmoContrato.test.ts:113-125` |

Una sola sesión por prueba HTTP: `userCookie` crea siempre el mismo correo (`apps/desk/server/testing/appHarness.ts:93`).

**Mutaciones previstas para el verify** (cada una se ve roja y se revierte):

| Id | Clase | Mutación | Debe ponerse roja |
|---|---|---|---|
| M-POS-1…13 | posición | intercambiar las dos guardas de cada par de §6 | su POS-* |
| M-SH-1 | condición | `>` por `>=` en `reclamacionVencida` | día 60 |
| M-SH-2 | condición | `siguienteEstado('abierta')` devuelve `resuelta` | salto de estado |
| M-SH-3 | condición | quitar el recorte del fabricante | fabricante de sólo espacios |
| M-SH-4 | condición | `rechazada` admite valor recuperado positivo | caso de `validarPaso` |
| M-DB-1 | condición | quitar la traducción del `23505` | prueba del error traducido |
| M-DB-2 | condición | quitar `AND estado = $2` de `avanzarFicha` | avance con estado viejo |
| M-DB-3 | condición | `pendiente` sin mirar `liberada` | liberada sin respuesta no sale |
| M-RT-1 | condición | G7 y G11 sin mirar `reclama` | una respuesta «no» da `404` |
| M-AV-1 | condición | quitar `aviso_60_at IS NULL` del `UPDATE` | un solo aviso |
| M-AV-2 | condición | marcar antes de buscar destinatarios | sin nadie no marca |
| M-AV-3 | condición | `destinatariosDeCargoPermiso` filtrando por `cargo` | destinatarios por cargo de permiso |
| M-FV-1…4 | fichero vigilado | las cuatro de §4 sobre `schema.sql` | guardián y prueba de la tabla |
| M-FV-5 | fichero vigilado | quitar `pasadaReclamaciones(pool)` de la cadena de `index.ts` | prueba de `index.ts` |

## 10 · Ficheros muy citados

| Fichero | Edición | ¿Desplaza líneas? |
|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` | añadido al final | no |
| `packages/zoho-sync/src/db/migrate.ts` | 1 línea en sitio | no |
| `packages/zoho-sync/src/db/migrate.test.ts` | 5 en sitio y añadido al final | no |
| `packages/shared/src/index.ts`, `packages/shared/src/cargos.test.ts` | 1 y 2 en sitio | no |
| `apps/desk/server/app.ts`, `apps/desk/server/index.ts` | 2 y 2 en sitio | no |
| `apps/desk/server/db/avisos.ts`, `apps/desk/src/api/client.ts` | añadido al final | no |
| `apps/desk/src/components/TicketDetailView.tsx` | 2 en sitio | no |

Ninguna cita cambia de número. El cierre SÍ relee qué AFIRMA cada cita que apunte a una línea cuyo CONTENIDO cambia
(regla de mutación 4): `app.ts` 22 y 61, `index.ts` 15 y 88, `migrate.ts` 73, `migrate.test.ts` 282 a 286,
`cargos.test.ts` 226 a 228, `shared/src/index.ts` 37 y `TicketDetailView.tsx` 15 y 320. Si el apply necesitara
insertar una línea en medio de alguno, el barrido completo pasa a ser obligatorio.

## 11 · Lotes de apply

Estimación en líneas medidas (`git diff --shortstat --no-renames` más `wc -l` de lo nuevo); una línea reescrita cuenta dos.

| Lote | Ficheros | Estimado |
|---|---|---|
| **1a** | `garantiaProveedor.ts` de `shared` 95 + prueba 120; `index.ts` 2; `cargos.test.ts` 4; `schema.sql` 28; `migrate.ts` 2; `migrate.test.ts` 22; capa de datos 105 + prueba 110 | **488** |
| **1b** | rutas 105; `app.ts` 4; prueba de rutas 250 | **359** |
| **2** | `avisos.ts` 14; servicio 75 + prueba 160; `index.ts` 4; `client.ts` 45; panel 190; `TicketDetailView.tsx` 4 | **492** |

Los tres caben bajo 720. Cada uno cierra solo con los cuatro códigos en verde (`npm test`, `npm run typecheck`,
`npm run lint`, detector de citas): 1a deja regla, tabla y datos sin llamador de producto; 1b añade las rutas; 2 el
aviso y el panel. Válvula si 1a se desvía: la capa de datos y su prueba (215) pasan a 1b, que quedaría en 574.

## 12 · Matriz de amenazas, migración y preguntas abiertas

Matriz de amenazas: no aplica. Las rutas son HTTP de la aplicación; no hay intérprete de órdenes, subprocesos,
automatización de VCS o de PR ni clasificación de ficheros ejecutables. Migración: la tabla la crea `migrate` al
arrancar, sin relleno (S-11). Marcha atrás: `revert`; la tabla se queda sin lector.

- [ ] H-1: el `CHECK` compuesto en pg-mem (respaldo decidido en §4).
- [ ] H-2: forma de `numeric` en pg-mem y en node-postgres (cubierta por el mapeador).
