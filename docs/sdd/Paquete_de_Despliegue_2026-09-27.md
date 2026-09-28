# Paquete de despliegue — 2026-09-27

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo
escribe un agente que no despliega ni commitea. La publicación es una acción manual: el CI **no
despliega** (lo verificó el paquete anterior, `docs/sdd/Paquete_de_Despliegue_2026-09-10.md:5-6`, y
`.github/workflows/ci.yml` no cambia en el rango: `git diff --stat ae5aaf4..HEAD -- .github/` → vacío).

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | `dcb5c99` (`origin/main` ya está ahí) |
| Base que hoy corre en producción | `ae5aaf4` (2026-09-10 19:20), verificada por sha256 del bundle (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:22`) |
| Commits del rango | **278** (`git log --oneline ae5aaf4..HEAD` → 278 líneas) |
| De ellos, tocan `apps/` o `packages/` | **67** (`git log --oneline ae5aaf4..HEAD -- apps packages`) |
| Ficheros de código tocados | **127**, +10.392/−410 (`git diff --stat ae5aaf4..HEAD -- apps/ packages/`) |
| Fuera de `apps/` y `packages/` con efecto en la imagen | `Dockerfile` (+3 líneas: `COPY scripts ./scripts`) y `package.json` (script `prepare`) — §4.3 |
| Build y pruebas en `dcb5c99` | `npm run build` → exit 0 · `npm test` → **143 ficheros, 1.445 pruebas en verde**, 1 fichero y 2 pruebas omitidas, exit 0 (ejecutado el 2026-09-27) |

---

## 1 · Resumen para quien publica

**Veredicto: `dcb5c99` es DESPLEGABLE.** No se ha encontrado nada de lo que haría que no lo fuera: las
migraciones son todas aditivas e idempotentes (§2), no hay ninguna variable de entorno nueva (§3), el
único cambio archivado que decía «no se despliega sin X» (F1B-06, que exigía F1A-03) tiene su X en
`main` (§7), no queda ningún estado sin salida en el flujo nuevo (§7) y build y pruebas están en verde.
Lo que sí hay son **dos riesgos que se publican a sabiendas** (§5.3) y **una cadena de tareas de
persona** (§6).

**Lo que puede sorprender al equipo, por orden de impacto.**

1. **Los tickets de clasificación «Equipo nuevo» cambian de botones.** Un ticket «Equipo nuevo» en
   `Ingresado`, `En Proceso`, `Notificado` o `Finalizado` deja de ver las transiciones del servicio
   técnico y pasa a ver sólo las del flujo de equipo nuevo (§5.1, F1B-06). Afecta también a los tickets
   **ya abiertos** que vienen de Zoho, no sólo a los nuevos. Cuántos hay hoy en esos estados **no está
   medido**.
2. **`Por Entregar` y `Por Entregar / Sin facturar` se mudan de «Tickets abiertos» a «Tickets en
   espera»**, y la pestaña «EN ESPERA» de la ficha de cliente pasa a contar muchos más estados (§5.2,
   F1B-08). Es la misma clase de sorpresa que el paquete del 2026-09-10 pidió avisar a Comercial
   (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:29-35`): tickets que nadie ha tocado cambian de lista.
3. **La remisión de entrada pregunta si el equipo llega con novedad**, y con «Sí» exige al menos una
   foto (F1B-04). Es la pantalla de campo del técnico.
4. **Se puede dar de alta un ticket «Equipo nuevo» con un equipo que aún no existe**, y la hoja de vida
   gana seis campos comerciales, un botón «Editar» y un registro de cambios (F1B-02, F1B-14).

**Las acciones de persona, en orden.**

1. **Antes del Deploy:** copia de la base (§4.1). Es la única red: no hay copia de pruebas
   (`openspec/config.yaml:1705-1707`).
2. **Deploy y comprobación de commit** (§4.2 y §4.4).
3. **Después:** el `INSERT` de los cierres de fin de año (§6.1), que **no se puede correr antes** del
   Deploy, y las comprobaciones de persona de §6.2 a §6.5.

---

## 2 · Cambios de esquema

### 2.1 · `packages/zoho-sync/src/db/schema.sql` — diez sentencias nuevas, todas al final del fichero

`git diff ae5aaf4..HEAD -- packages/zoho-sync/src/db/schema.sql` sólo **añade** líneas (+61/−0): ninguna
sentencia existente cambia. Commits: `b7c1ba8`, `3793f87`, `66df3d8`, `f0304ec`, `265cd45`.

| # | Sentencia | Línea | Esquema de destino | ¿Calificada? | ¿Idempotente? | Tanda |
|---|---|---|---|---|---|---|
| 1 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS history_synced_at timestamptz` | `packages/zoho-sync/src/db/schema.sql:453` | `desk` | No, a propósito (`tickets` está en `DESK_TABLES`) | Sí, `IF NOT EXISTS` | fuera de tanda (historia de Zoho, worker) |
| 2-7 | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS` `fecha_adquisicion`, `fecha_factura_compra`, `fin_garantia` (`date`), `codigo_interno`, `mantenedor_id`, `drive_url` (`text`) | `packages/zoho-sync/src/db/schema.sql:466-471` | `desk` | No, a propósito (`equipos` está en `DESK_TABLES`) | Sí, `IF NOT EXISTS` | F1B-02 |
| 8 | `CREATE TABLE IF NOT EXISTS public.calendario_cierres (fecha date PRIMARY KEY, …)` | `packages/zoho-sync/src/db/schema.sql:478-483` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-12 |
| 9 | `CREATE TABLE IF NOT EXISTS public.equipos_cambios (id bigserial PRIMARY KEY, …)` | `packages/zoho-sync/src/db/schema.sql:496-505` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-14 |
| 10 | `CREATE INDEX IF NOT EXISTS idx_equipos_cambios_equipo ON public.equipos_cambios (equipo_id)` | `packages/zoho-sync/src/db/schema.sql:506` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-14 |
| 11 | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS hay_novedad boolean` | `packages/zoho-sync/src/db/schema.sql:509` en `dcb5c99` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-04 |

*(Son once filas de sentencia: la 2-7 agrupa seis `ALTER` iguales.)*

**Las dos tablas nuevas están clasificadas.** `calendario_cierres` y `equipos_cambios` entran en
`PUBLIC_TABLES` (`packages/zoho-sync/src/db/migrate.ts:70-73`), que es lo que exige el guardián de
`packages/zoho-sync/src/db/migrate.test.ts`. Las sin calificar aterrizan en `desk` por dos vías que ya
existían: `reorgToDesk` corre antes que `migrate` (`apps/desk/server/index.ts:23-24` en `dcb5c99`) y la conexión fija
`search_path=desk,public` (`packages/zoho-sync/src/db/pool.ts:5`).

**Todas son ADITIVAS.** Tablas nuevas, columnas nuevas **anulables** y sin `NOT NULL`, y un índice. No se
borra ni se renombra nada, y ninguna columna existente cambia de tipo. Consecuencia para la reversión:
§4.5.

**Ninguna toca las cuatro tablas replicadas** (`desk.activities`, `books.contacts`,
`books.sales_orders`, `books.items`, `DEPLOY.md:42`), así que la regla de orden de `DEPLOY.md:50-51`
—DDL primero en el suscriptor— **no aplica a este paquete**.

**La sentencia 11 no lleva punto y coma final** (`packages/zoho-sync/src/db/schema.sql:509` en `dcb5c99`, última
línea del fichero). Hoy no importa: `schemaStatements` trocea por el carácter y conserva el último trozo
(`packages/zoho-sync/src/db/migrate.ts:19-21`). Se anota porque la próxima sentencia que alguien añada
debajo se pegaría a ésta y **las dos fallarían**. No bloquea este despliegue.

### 2.2 · Dónde se aplican: al arrancar, y en silencio si algo falla

- **App:** `main()` llama a `migrate(pool)` en el arranque (`apps/desk/server/index.ts:24` en `dcb5c99`), sobre `desk`.
  Es lo que `DEPLOY.md:175` describe como «el server corre `migrate`».
- **Worker `hub-sync`:** `hubBootstrap` llama a `migrate(db)` sobre el hub (`apps/hub-sync/src/hubSync.ts:13`),
  con **el mismo** `schema.sql`. Así que las dos tablas `public.*` nuevas y las columnas nuevas **también
  se crean en `zoho-hub`** cuando se redespliegue el worker. Es inocuo: allí nadie las usa, igual que
  `history_synced_at` queda sin usar en `desk` (lo dice su comentario, `packages/zoho-sync/src/db/schema.sql:450`).

⚠️ **`migrate` es tolerante por sentencia** (`packages/zoho-sync/src/db/migrate.ts:28-33`): si una
sentencia falla, escribe `migrate: sentencia omitida:` en el log y **sigue arrancando**. Un fallo de
migración **no tumba el Deploy ni se ve en pantalla**: se descubre cuando una pantalla toca la columna
que falta. Por eso §4.4 incluye una consulta de sólo lectura que comprueba que las once existen.

### 2.3 · Otros ficheros SQL del rango

| Fichero | Qué añade | Dónde corre | ¿Idempotente? |
|---|---|---|---|
| `packages/zoho-sync/src/booksHub/schema-books.sql` | `CREATE TABLE IF NOT EXISTS books.retainer_invoices` (facturas de anticipo), commit `a233e1d` | Sólo en `zoho-hub`, vía `migrateBooks` (`apps/hub-sync/src/hubSync.ts:24`) | Sí |
| `packages/zoho-sync/src/crmHub/schema-crm.sql` | `ALTER TABLE crm.deals ADD COLUMN IF NOT EXISTS stage_detail_synced_at` y `… stage_history_synced_at` (`timestamptz`), commits `3fc4768` y `030efa7` | Sólo en `zoho-hub`, vía `migrateCrm` (`apps/hub-sync/src/hubSync.ts:80`) | Sí |
| `docs/sdd/Consultas_Recuentos_2026-09-25.sql`, `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` | Consultas de recuento | Nadie las ejecuta al desplegar: son documentación y `docs` no entra en la imagen (`.dockerignore`) | — |
| `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql` | El `INSERT` de los cierres | A mano, **después** del Deploy: §6.1 | Sí, `ON CONFLICT (fecha) DO NOTHING` |

`books.retainer_invoices` es tabla nueva del hub y **no está** en la replicación (`DEPLOY.md:42`): no hace
falta crearla en `desk`.

---

## 3 · Variables de entorno e interruptores

**Ninguna nueva.** Medido sobre el diff entero:

- `git diff ae5aaf4..HEAD -- apps packages` filtrado por `process.env`, `env.X`, `env[`, `import.meta.env`
  y `VITE_`: las únicas líneas añadidas son del **detector de citas y de la reconciliación**, que copian
  `process.env` para lanzar `git` y borran de la copia `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE` y
  `GIT_COMMON_DIR`. Son herramientas de repositorio: no las carga ni la App ni el worker.
- `packages/zoho-sync/src/config.ts` **no cambia** en el rango (`git diff ae5aaf4..HEAD -- packages/zoho-sync/src/config.ts` → vacío).
- Ningún `=== 'true'` nuevo fuera de pruebas: la única coincidencia añadida es un valor de formulario en
  una prueba (`hayNovedad: 'true'`).
- `.env.example` **no cambia** en el rango (`git diff --name-only ae5aaf4..HEAD` no lo lista). Su
  contenido queda fuera del alcance de lectura de esta sesión, igual que le pasó a `DEPLOY.md:169-172`:
  no se afirma nada más sobre él.

**Consecuencia:** no hay que tocar la pestaña Environment de ningún servicio. No hay interruptor nuevo
que documentar, así que la regla de secretos de `CLAUDE.md` («un flag no documentado se trata como
defecto») **no encuentra defecto en este rango**.

**Lo que sí existe y conviene no confundir:**

- `APP_ENTRYPOINT` elige qué proceso arranca la imagen (`Dockerfile:27-29`). Ya estaba en `ae5aaf4`.
- Las funciones nuevas del worker (historia de tickets, fases de CRM, facturas de anticipo) cuelgan de
  credenciales y flags **que ya existían** (`DEPLOY.md:189-198`). Detalle en §5.2.

---

## 4 · Procedimiento

### 4.1 · Copia de la base ANTES del Deploy

**Es obligatoria y no es higiene: es la única red.** Gerencia decidió no montar copia de pruebas y
aceptó por escrito que todo despliegue se prueba sobre la aplicación que usa la gente
(`openspec/config.yaml:1705-1707`, `decision/e013b-copia-pruebas`). Y decidió también que haya **copia
previa a cada cambio que se suba**, con responsable **Alfonso (Gerencia)**
(`openspec/config.yaml:2244-2250` en `6e471a8`, `decision/p55-backup`, consecuencia (1) en `:2252`).

**Cómo:** `DEPLOY.md` **no describe** ningún procedimiento de copia. Lo siguiente es **hipótesis**, no
procedimiento verificado: una copia lógica de la base `desk` con `pg_dump` desde un contenedor que llegue
al servicio `desk-db`, con la cadena de conexión que da EasyPanel en la variable `DATABASE_URL` del
servicio App —el **nombre** de la variable, nunca su valor en un chat—:

```bash
# HIPÓTESIS de procedimiento: no está en DEPLOY.md ni verificado contra EasyPanel.
pg_dump --format=custom --file=desk_antes_de_dcb5c99.dump "$DATABASE_URL"
```

Criterio de hecho, sea cual sea el método: **existe un fichero de copia con fecha de hoy, fuera del
servidor, y su tamaño no es cero.** Si la copia automática nocturna del adelanto de `p55-backup` ya está
en marcha, la copia previa sigue siendo necesaria: la nocturna puede tener horas de antigüedad.

`zoho-hub` **no necesita copia por este paquete** en el mismo sentido: sus cambios son aditivos (§2.3)
y todo su contenido se puede volver a traer de Zoho. Hipótesis: rehacerlo cuesta un backfill completo.

### 4.2 · Publicar

**`DEPLOY.md` ya cubre el mecanismo. No se repite aquí.**

- **App:** `DEPLOY.md` §5 «Desplegar» (`DEPLOY.md:174-177`) — botón **Deploy** en EasyPanel; el server corre
  `migrate` en el arranque; luego se abre el dominio.
- **Worker `hub-sync`:** `DEPLOY.md` §7 (`DEPLOY.md:183-202`). Mismo repositorio y misma imagen, arranque
  `npm run start:hub-sync`. **Esta vez sí trae cambios** (§5.2) y conviene redesplegarlo, pero es
  **independiente** de la App: la App no lee nada de lo que añade el worker en este rango. Qué versión
  corre hoy el worker **no está verificado** en ningún documento del repositorio (hipótesis: la misma
  época que la App).
- **Idempotencia de la migración:** `DEPLOY.md:224`. Cierta para este rango (§2.1), con la salvedad de la
  tolerancia por sentencia (§2.2).
- **Orden con la replicación lógica:** no aplica (§2.1).

### 4.3 · Lo que este rango cambia en la imagen y `DEPLOY.md` no dice

`f962e81` añadió al `Dockerfile` `COPY scripts ./scripts` antes del `npm ci` de la etapa de ejecución
(`Dockerfile:19-22`), porque `package.json` tiene ahora un script `prepare` que corre
`scripts/instalar-hooks.mjs` en cada `npm ci`. Ese script **nunca falla `npm ci`**: sin `.git` o sin
binario `git` sale con 0 (`scripts/instalar-hooks.mjs:19-23`), y `.git` no entra en la imagen
(`.dockerignore`). **Construida en local el 2026-09-27 sobre `10453a9`** (Docker 29.6.2, `--no-cache`, sin
publicar): salida 0; en las dos etapas `npm ci` corre `prepare` → `node scripts/instalar-hooks.mjs` sin error y
termina (167 y 562 paquetes); `docker run --rm --network none … npx tsx --version` da `tsx v4.22.4`, así que va
en la imagen. La de EasyPanel sigue sin construirse: **si el Deploy falla en el build**, mirar el `npm ci` y este `COPY`.

### 4.4 · Comprobar que producción está en el commit publicado

**Mismo método que el 2026-09-10** (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:22`): el bundle
principal que sirve producción tiene que ser **byte a byte** el que sale de construir el commit.

1. Construcción local de `dcb5c99`, hecha el 2026-09-27 con `npm run build`:
   - fichero: `dist/assets/index-D7NU2gnW.js`
   - sha256: `62b4dedd81fe590afd2cafe02210dd4b2bb484b591c5127f1997472f0989c1b7`
2. En producción, abrir `https://ambientalia-desk.ambientalia.cloud/`, ver en el código fuente de la
   página qué `index-*.js` carga, descargarlo y calcular su sha256.
3. **Nombre y sha256 iguales ⇒ producción ≡ `dcb5c99`.** Desde ese momento, «sin desplegar» se cuenta desde
   `dcb5c99` y no desde `ae5aaf4`.

*Límite del método, escrito para que nadie lo lea como más de lo que es:* la construcción de referencia se
hizo en Windows y la de producción en `node:22-alpine`. Que den los mismos bytes es **hipótesis**; el
2026-09-10 salieron iguales para `ae5aaf4`. Si el nombre coincide y el sha256 no, no concluir nada:
reconstruir en Linux antes. Y el bundle **sólo prueba el cliente**: el servidor sale de la misma imagen
(`Dockerfile:1-29`), así que hoy se infiere, como el 2026-09-10.

**Y que la migración entró.** En la consola de PostgreSQL de producción, base `desk`, **sólo lectura**:

```sql
SELECT to_regclass('public.calendario_cierres') AS cierres,
       to_regclass('public.equipos_cambios')    AS cambios;
-- Deben salir los dos nombres, no NULL.

SELECT table_schema, table_name, column_name
  FROM information_schema.columns
 WHERE (table_schema, table_name, column_name) IN (
        ('desk','tickets','history_synced_at'),
        ('desk','equipos','fecha_adquisicion'), ('desk','equipos','fecha_factura_compra'),
        ('desk','equipos','fin_garantia'),      ('desk','equipos','codigo_interno'),
        ('desk','equipos','mantenedor_id'),     ('desk','equipos','drive_url'),
        ('public','remisiones','hay_novedad'))
 ORDER BY 1, 2, 3;
-- Deben salir 8 filas.
```

Si falta alguna, buscar `migrate: sentencia omitida` en el log del servicio App (§2.2).

### 4.5 · Reversión

**Volver atrás = redesplegar `ae5aaf4` desde EasyPanel** (`DEPLOY.md` §5). **La base no hay que
tocarla**: todos los cambios de esquema son aditivos y anulables (§2.1), así que el código de `ae5aaf4`
—que ni lee ni escribe esas columnas y tablas— funciona sobre el esquema nuevo. Su propio `migrate` sólo
reaplica su `schema.sql`, que es un subconjunto del nuevo.

**Lo que la reversión NO deshace, y hay que saberlo antes de pulsar:**

- **Un ticket que haya llegado a `Verificación` se queda sin salida.** En `ae5aaf4`,
  `packages/shared/src/transitions.ts` no menciona `Verificación` ni una vez
  (`git show ae5aaf4:packages/shared/src/transitions.ts`, 0 coincidencias). Si se revierte con tickets en
  ese estado, nadie puede moverlos hasta volver a publicar o hasta una corrección directa en la base. Por
  eso la reversión, si se decide, conviene **antes** de que alguien use la transición «Verificación».
- **Los datos escritos por la versión nueva se quedan** y la vieja no los enseña: los seis campos
  comerciales del equipo, el registro de `public.equipos_cambios`, la respuesta de novedad de las
  remisiones y los cierres de `public.calendario_cierres`. No se pierden; vuelven a verse al republicar.
- Un ticket «Equipo nuevo» que avanzó por el flujo nuevo hasta `En Proceso` vuelve a ver las transiciones
  de servicio de `En Proceso` (en `ae5aaf4` las hay: `git show ae5aaf4:packages/shared/src/transitions.ts`,
  líneas 200, 206, 222 y 224). No se queda varado, pero cambia de camino a mitad.

**Señales que obligan a volver atrás:**

| Señal observable | Dónde se ve | Qué significa |
|---|---|---|
| El tablero se queda en blanco tras el Deploy | Cualquier vista | Fallo de arranque o del `dist/`. Revisar logs del servicio App |
| El build falla en EasyPanel | Pestaña de despliegue | Ver §4.3. Producción sigue en `ae5aaf4`: no hay nada que revertir |
| **No se puede crear ninguna remisión** | Ficha de ticket → «Crear remisión» | La guarda nueva de novedad (`apps/desk/server/routes/remision.ts:286-287` en `dcb5c99`) o la pregunta obligatoria del formulario (`apps/desk/src/components/CrearRemision.tsx:100`) bloquean de más |
| **No se puede crear ningún ticket** | Alta de ticket → Guardar | La rama de equipo nuevo del alta (`apps/desk/server/services/ticketService.ts:24`) está rechazando lo que no debe |
| **Un ticket de servicio NO «Equipo nuevo» ve los botones del flujo de equipo nuevo** | Ficha del ticket | El enrutado de flujos (`packages/shared/src/flujos.ts:56-61`) está fallando |
| Errores 500 al guardar un equipo | Equipos → Editar | Falta una columna de §2.1: comprobar con la consulta de §4.4 |

**Señales que NO son motivo de reversión:** un ticket «Equipo nuevo» que ya no ofrece «Ingreso a Servicio»
sino «Ingreso equipo nuevo» (§5.1, es lo que se publica); un ticket en `Verificación` que cae en la
columna «Otros» del tablero (es lo esperado, §6.4); el 422 «El equipo llegó con novedad y la remisión no
tiene fotos» (es la regla nueva).

---

## 5 · Cambios de comportamiento

Producción no tiene **ninguno** de los de esta sección.

### 5.1 · Las cinco tandas del encargo

La tanda de cada cambio sale de la cabecera `tanda:` de su `proposal.md` archivado.

| Tanda | Cambio archivado (`cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|---|
| **F1B-12** | `2026-09-24-calendario-laboral` (`cierra: si`) | **Nada todavía.** Hay módulo de calendario hábil, tabla de cierres y lector, pero **ningún consumidor**: el SLA sigue en horas de reloj y su paso a horas hábiles quedó para otra tanda (`openspec/changes/archive/2026-09-24-calendario-laboral/archive-report.md:15-19`). Con la tabla vacía no se nota nada | Lector: `apps/desk/server/db/calendarioCierres.ts:31-34`. Módulo: `packages/shared/src/calendarioLaboral.ts` |
| **F1B-14** (1) | `2026-09-24-alta-equipo-nuevo-en-ticket` (`cierra: no`) | **Alta de ticket con equipo que aún no existe.** Con clasificación «Equipo nuevo» y sin equipo elegido aparece el bloque «Equipo nuevo» (Serie, Modelo del catálogo y Factura de compra obligatorios; Adquisición, Fin de garantía, Código interno, Drive y Mantenedor opcionales), con el aviso «Si la serie ya está registrada, el servidor reutiliza ese equipo en vez de duplicarlo». Errores nuevos: «Faltan datos del equipo nuevo: …» y «Modelo no encontrado» (422) | Cliente: `apps/desk/src/components/CreateTicket.tsx:55`, bloque `:367-409`. Servidor: `apps/desk/server/services/ticketService.ts:24`, `apps/desk/server/services/equipoNuevo.ts:41` y `:44` |
| **F1B-14** (2) | `2026-09-25-edicion-comercial-equipo` (`cierra: si`) | **Botón «Editar» en la hoja de vida y sección «Cambios».** Sin área Comercial ni administrador, Factura de compra, Fin de garantía y Mantenedor salen en sólo lectura, y el servidor responde 403 «Sólo el área Comercial o un administrador puede cambiar fecha de factura, fin de garantía o mantenedor». Cada cambio queda registrado con quién y cuándo | Cliente: `apps/desk/src/components/HojaDeVida.tsx:204` (botón), `:162` (sección). Servidor: `apps/desk/server/routes/equipos.ts:107-108` (403) y `:115` (registro) |
| **F1B-04** | `2026-09-25-foto-solo-con-novedad` (`cierra: no`) | **La remisión de entrada pregunta «¿El equipo llega con novedad?»**, sin respuesta preseleccionada. Sin contestar: «Indica si el equipo llega con novedad.» Con «Sí» y sin fotos: «El equipo llega con novedad: sube al menos una foto antes de crear la remisión.» El servidor rechaza el envío con 422 «El equipo llegó con novedad y la remisión no tiene fotos: sube al menos una antes de enviarla.» Con «No», la foto deja de ser obligatoria | Cliente: `apps/desk/src/components/CrearRemision.tsx:61`, `:100`, `:101`, `:353`. Servidor: `apps/desk/server/routes/remision.ts:286-287` en `dcb5c99` |
| **F1B-06** | `2026-09-25-blueprint-equipo-nuevo` (`cierra: no`) | **Flujo propio para los tickets «Equipo nuevo».** Un ticket va a este flujo si su clasificación es exactamente «Equipo nuevo» **y** su estado es uno de los cinco del flujo (`Ingresado`, `En Proceso`, `Notificado`, `Verificación`, `Finalizado`). Entonces ve sólo estos botones: «Ingreso equipo nuevo», «Producto no conforme», «Análisis y acciones», «Verificación» y «Liberación», todos de Servicio Técnico. Un ticket en otro estado —por ejemplo `Rev./Diagnostico`— sigue en el flujo de servicio. `Verificación` es estado nuevo y cae en la columna «Otros» del tablero. Ejecutar una transición del otro flujo da 409 con mensaje que nombra los dos flujos | Enrutado: `packages/shared/src/flujos.ts:56-61`. Catálogo: `packages/shared/src/transitions.ts:350-363`. Botones: `apps/desk/src/components/TransitionPanel.tsx:56`. Guarda del servidor: `apps/desk/server/services/ticketService.ts:125`. Columna: `packages/shared/src/estados.ts:105`. El SLA no se aplica a este flujo: `apps/desk/server/db/sla.ts:49` |
| **F1A-03** | `2026-09-27-salidas-verificacion` (`cierra: no`) | **`Verificación` tiene dos salidas:** «Liberación» hacia `Finalizado` y, nueva, «Rechazo de verificación» hacia `Notificado`. Las dos, de Servicio Técnico | `packages/shared/src/transitions.ts:359` (`liberacion`, origen ampliado) y `:361` (`rechazo_verificacion`) |

*(La tabla tiene seis filas porque F1B-14 son dos cambios archivados; el encargo pedía cinco tandas y lo
son.)*

**Y F1B-02, que el encargo no nombraba pero va en el mismo rango** (`2026-09-23-hojas-vida`, `cierra: si`):
la hoja de vida enseña seis campos comerciales —con «—» si están vacíos y el enlace «Ver en Google Drive»
sólo si la dirección empieza por `https://`— (`apps/desk/src/components/HojaDeVida.tsx:210-222`), y el
servidor valida mantenedor, fechas y enlace con 422 (el de Drive en `apps/desk/server/routes/equipos.ts:206`).
Las columnas son las 2-7 de §2.1.

### 5.2 · Los demás cambios del rango que tocan `apps/` o `packages/`

**Con efecto visible en la App — cuatro:**

| Tanda | Cambio archivado (`cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|---|
| **F1B-08** | `2026-09-12-por-entregar-es-espera` (`cierra: no`) | **`Por Entregar` y `Por Entregar / Sin facturar` se mudan de «Tickets abiertos» a «Tickets en espera».** En `ae5aaf4` eran `ninguna` (`packages/shared/src/estados.ts:87-88` en `ae5aaf4`). Y la pestaña «EN ESPERA» de la **ficha de cliente** cambia de criterio: antes contaba los estados cuyo nombre contiene «espera» (`apps/desk/src/components/ClienteDetalle.tsx:18` en `ae5aaf4`), ahora cuenta los once de la lista, así que entran también `Servicio externo`, `Notificación cliente`, `Solicitado`, `Liberación Comercial` o `Remisión creada`. El **color** del estado no cambia, a propósito (IV-9) | `packages/shared/src/estados.ts:72-73`. Ficha de cliente: `apps/desk/src/components/ClienteDetalle.tsx:36` y `:115`, vía `apps/desk/src/lib/enEspera.ts:14`. Color sin cambio: `apps/desk/src/components/ClienteDetalle.tsx:41` |
| **F1A-08** | `2026-09-17-tercera-puerta-orden-venta` (`cierra: si`) | **Crear una remisión con una orden de venta que ya está en otro ticket da 409** «La orden de venta N ya está asociada al ticket #M» y no escribe nada. En producción hoy responde 201 y la orden queda en los dos tickets | `apps/desk/server/routes/remision.ts:230-233` |
| **F1B-10** | `2026-09-21-orden-precedencia-guardas` (`cierra: si`) | **Cambia qué error sale primero cuando hay varios.** En el alta de ticket y en «Habilitar Servicio», el 409 de «orden de venta ya asociada» pasa a salir **después** de los 422 de contenido: un formulario incompleto con una orden ya usada enseñaba el error de la orden y ahora enseña el de los campos. El alta de remisión no cambia (IV-12) | Alta: 422 equipo↔cliente `apps/desk/server/services/ticketService.ts:78`, obligatorios `:88`, y el 409 después, `:96`. Transición: 422 de plan y fechas `:134`, persona derivada `:141`, orden de venta `:149` |
| **F1A-07** | `2026-09-22-fechas-derivadas-servidor` (`cierra: si`) | **El servidor fija tres fechas derivadas** —`Fecha creación ticket`, `Fecha Remisión Entrada` y `Fecha Revisión Informe`— cuando tiene de dónde sacarlas, y **pisa lo que se teclee**; el día se calcula en `America/Bogota`. Sin fuente, valida lo tecleado y responde 422 «Fecha inválida en el campo: …». En el panel de transición, el prellenado da ahora prioridad a lo derivado sobre lo guardado | `apps/desk/server/services/ticketService.ts:132`. Fórmula y mensaje: `packages/shared/src/fechasDerivadas.ts:63` y `:130`. Cliente: `apps/desk/src/lib/valoresTransicion.ts:42` |

**Sin efecto visible en la App:**

| Qué | Commits o cambio archivado | Por qué no se ve |
|---|---|---|
| F1A-06, generador del mapa del blueprint | `2026-09-22-generador-mapa-blueprint` | El generador sólo lo usan su script (`package.json:25`) y sus pruebas. Lo que toca en `transitions.ts` —`from`/`to` en las dos constantes de remisión— deja igual el comportamiento de `apps/desk/server/db/estadoPorRemision.ts` |
| Detector de citas y hook `pre-push` | `2026-09-15-hook-citas-pre-push`, `2026-09-16-detector-citas-extremos`, `2026-09-24-rq-rc-07-regla-e` y sus commits `7625921`…`f92c532` | Código de `apps/desk/server/citas/`: no lo importa el servidor. Su único efecto en la imagen es el `prepare` de §4.3 |
| Reconciliación (`npm run reconcile`) | `2026-09-20-F0-05` (`1a51ba0`, `4199ce8`, `0e4049f`, `ab2e8e4`, `54d00f1`) | Comando de línea (`package.json:20`) en `apps/desk/server/reconciliacion/`: no lo importa el servidor |
| Pruebas y comentarios | `f337a96`, `62140e4`, `0808fdf`, `5ce8e2c`, `094eaa4` y los barridos de citas | Sólo pruebas o comentarios |

**Sólo en el worker `hub-sync` — sin archivo, escriben en `zoho-hub` y la App no los lee:**

| Qué | Commits | Qué hace | ¿Configuración nueva? |
|---|---|---|---|
| Facturas de anticipo de Books | `ea3dbc1`, `a233e1d`, `7cfd198`, `8d03c0d`, `d041b1c` | Trae `/retainerinvoices` a `books.retainer_invoices`: relleno si la tabla está vacía (`apps/hub-sync/src/hubSync.ts:67-77`), incremental y barrido diario. `DEPLOY.md:35` ya lo menciona | No: cuelga de `SYNC_BOOKS_RICH` y las credenciales de Books, que ya existían (`packages/zoho-sync/src/config.ts:92`) |
| Historia pendiente de tickets | `b7c1ba8`, `42172d7`, `244c237` | Trae la historia de Zoho de hasta 50 tickets por ciclo y la marca con `tickets.history_synced_at` (`apps/hub-sync/src/hubSync.ts:96`) | No: corre en cada ciclo de `SYNC_INTERVAL_MS` (`packages/zoho-sync/src/config.ts:88`) |
| Hora de entrada en la fase ganada, CRM | `3fc4768`, `226f98e`, `d598146`, `0a38911`, `030efa7` | Rellena `crm.deals.stage_modified_time` desde el historial de fases (`apps/hub-sync/src/hubSync.ts:107-113`). Su consumidor es SalesTracker, no Desk: `FASES_GANADAS` tiene que coincidir con el `WON_DEAL_STAGES` de SalesTracker (`packages/zoho-sync/src/crmHub/sync.ts:189`) | No: cuelga de `SYNC_CRM`, que ya existía (`packages/zoho-sync/src/config.ts:109`) |

Estos commits no tienen `archive-report.md`, así que no traen riesgos ni tareas de persona registrados.
Hipótesis sin verificar: que el token de Books de producción tenga permiso sobre `/retainerinvoices`. Si no
lo tiene, el relleno inicial falla con un error en el log y no tumba el worker
(`apps/hub-sync/src/hubSync.ts:74-76`).

### 5.3 · Riesgos que se publican a sabiendas

**R1 · Se puede liberar un analizador sin pasar por Verificación (E3 sin construir).** Gerencia decidió
que la Verificación es obligatoria para analizadores de gases y convertidores cuando hay gas patrón de lo
que miden (`openspec/config.yaml:1972-1973`). La guarda **no existe**: le faltan dos datos que hoy no
están en ningún sitio —la familia y el compuesto de cada equipo, y la lista de gases patrón—
(`docs/sdd/ENTRADA.md:1187-1192` en `6e471a8`, E-082). El riesgo lo registra la propuesta de F1A-03 con probabilidad
media, «igual que en Zoho hoy, donde la regla es costumbre»
(`openspec/changes/archive/2026-09-27-salidas-verificacion/proposal.md:89`). **Qué significa en la app:**
«Liberación» desde `En Proceso` está disponible para cualquier «Equipo nuevo» (`packages/shared/src/transitions.ts:359`).
No es una regresión —hoy producción ni siquiera tiene el flujo—, pero **la app no impide lo que Gerencia
decidió impedir**.

**R2 · Tampoco hay guarda de certificado en Liberación desde Verificación.** Está sin decidir si se exige
(`docs/sdd/ENTRADA.md:1194-1199` en `6e471a8`, E-083).

**R3 · Tickets «Equipo nuevo» ya abiertos cambian de flujo el día del Deploy.** El enrutado mira la
clasificación y el estado actual (`packages/shared/src/flujos.ts:56-61`), no la fecha de alta. Un ticket
de Zoho «Equipo nuevo» en `Notificado` deja de ver las salidas de servicio de `Notificado` y sólo ve
«Análisis y acciones». La propuesta de F1B-06 lo registra como riesgo de cambiar el grafo de un ticket en
curso (`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/proposal.md:106`). **Cuántos tickets
hay hoy en ese caso no está medido.** Hipótesis de consulta, de sólo lectura, para quien tenga acceso:

```sql
SELECT status, count(*) FROM desk.tickets
 WHERE lower(classification) = 'equipo nuevo'
   AND status IN ('Ingresado','En Proceso','Notificado','Verificación')
 GROUP BY status;
```

*(Hipótesis: el enrutado normaliza la clasificación con más que `lower` —`packages/shared/src/flujos.ts:40-43`—,
así que la consulta puede contar de menos.)*

**R4 · Sólo Servicio Técnico mueve el flujo de equipo nuevo.** Las seis transiciones son de Servicio
Técnico (`packages/shared/src/transitions.ts:347`); un usuario sólo de Comercial no ve ningún botón en
esos estados (`apps/desk/src/components/TransitionPanel.tsx:56-58`). El área es un supuesto de la tanda
(s2), no una decisión (`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/proposal.md:104`).

**R5 · Riesgos menores anotados en los archivos**, que no piden acción al publicar:

- Dos altas simultáneas con la misma serie pueden duplicar el equipo: `equipos.serial` no es único
  (`openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket/proposal.md:81`).
- Dos ediciones simultáneas del mismo equipo pueden registrar un «valor anterior» desfasado
  (`openspec/changes/archive/2026-09-25-edicion-comercial-equipo/design.md:185`).
- Contestar la pregunta de novedad sólo lo exige el cliente; el servidor sólo exige la foto cuando la
  respuesta es «Sí» (`openspec/changes/archive/2026-09-25-foto-solo-con-novedad/proposal.md:79-82`). Las
  remisiones anteriores al Deploy quedan con `hay_novedad` a `NULL`, que no exige foto.
- Una remisión pendiente con novedad y sin fotos sólo sale reintentando la subida o con anulación de un
  administrador (`openspec/changes/archive/2026-09-25-foto-solo-con-novedad/proposal.md:84-87`).

---

## 6 · Tareas de persona después del Deploy

Todas se hacen sobre `https://ambientalia-desk.ambientalia.cloud/`, con sesión iniciada, salvo la §6.1,
que es en la base. **Archivar los cambios no las dio por hechas** (regla del ciclo 1 de `CLAUDE.md`). No
hay copia de pruebas: donde los artefactos dicen «staging», se hace en la aplicación en uso
(`openspec/config.yaml:1705-1707`).

### 6.1 · El `INSERT` de los cierres de fin de año — Alfonso

| Dato | Valor |
|---|---|
| Fichero | `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql` (commit `ea23634`) |
| Quién | **Alfonso** (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:2`; la propuesta de F1B-12 lo fija: sin pantalla de alta, el `INSERT` lo hace él, comentario en `packages/zoho-sync/src/db/schema.sql:473`) |
| Dónde | Consola de PostgreSQL de producción, base `desk` (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:12`) |
| Cuándo | **Después** del Deploy y de §4.4. Antes, la tabla no existe (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:7-10`) |
| ¿Idempotente? | **Sí.** `ON CONFLICT (fecha) DO NOTHING` (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:28`), dentro de una transacción (`:20` y `:36`) |
| Qué da de alta | Cinco fechas: 24/12, 30/12 y 31/12 de 2026, y 01/01 y 02/01 de 2027 (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:22-27`) |

Paso a paso, que es el del propio fichero:

1. Ejecutar la comprobación `SELECT to_regclass('public.calendario_cierres') AS tabla;`
   (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:17`). **Si devuelve NULL, parar**: el Deploy no entró o la
   sentencia 8 de §2.1 se omitió; ver §4.4.
2. Ejecutar el bloque `BEGIN` … `INSERT` (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:20-28`).
3. Ejecutar el `SELECT` de comprobación (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:31-33`): **deben salir
   cinco filas**, de 2026-12-24 a 2027-01-02.
4. Si salen las cinco, `COMMIT;`. Si no, `ROLLBACK;` (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:35-36`).

**Cómo se verifica que surtió efecto: en la app, hoy, no se puede.** Ninguna pantalla ni cálculo consume
todavía la tabla (§5.1, fila F1B-12). La única comprobación es el `SELECT` del paso 3, repetido fuera de la
transacción. Como el efecto aparecerá cuando alguna tanda use el calendario, no hay prisa operativa, pero
tampoco motivo para retrasarlo.

*Discrepancia entre documentos, anotada:* el `archive-report.md` de F1B-12 dice que no había ninguna fecha
decidida (`openspec/changes/archive/2026-09-24-calendario-laboral/archive-report.md:54`); el `.sql` recoge
la respuesta de Gerencia del 24/09 (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:3-5`). El informe es
anterior a esa respuesta: el que manda es el `.sql`.

### 6.2 · Las 3 comprobaciones de RQ-HV-12 (botón «Editar» de la hoja de vida) — Comercial / Gerencia

Fuente: `openspec/specs/hojas-vida/spec.md:298-309`. Dueño: Comercial/Gerencia (`:301-302`).

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Equipos → abrir la hoja de vida de cualquier equipo | Hay un botón «Editar», y abre el formulario (`openspec/specs/hojas-vida/spec.md:304-305`) |
| 2 | Entrar con un usuario **sin** área Comercial y **sin** administrador → hoja de vida → «Editar» | Factura de compra, Fin de garantía y Mantenedor están en sólo lectura (`openspec/specs/hojas-vida/spec.md:306-307`) |
| 3 | Con un usuario Comercial, cambiar un campo de un equipo y guardar → volver a abrir su hoja de vida | La sección «Cambios» enseña la fila del cambio (`openspec/specs/hojas-vida/spec.md:308-309`) |

La 3 escribe un cambio real en un equipo real: usar un valor que se pueda devolver a su estado, y saber
que **las dos ediciones quedan registradas** (la tabla es de sólo inserción, `packages/zoho-sync/src/db/schema.sql:486-488`).

### 6.3 · Las 3 comprobaciones del formulario de novedad (RQ-RE-19, F1B-04) — Servicio Técnico

Fuente: `openspec/specs/remisiones/spec.md:476-485` en `ca56c62`. Dueño: Servicio Técnico, en la app (`:478`).

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Ficha de un ticket → «Crear remisión» | La pregunta «¿El equipo llega con novedad?» está visible y **sin** opción preseleccionada (`openspec/specs/remisiones/spec.md:480-481` en `ca56c62`) |
| 2 | Marcar «Sí», no subir ninguna foto, intentar crear o continuar | El formulario lo impide, con «El equipo llega con novedad: sube al menos una foto antes de crear la remisión.» (`openspec/specs/remisiones/spec.md:482-483` en `ca56c62`) |
| 3 | Leer el mensaje del 422 de envío: «El equipo llegó con novedad y la remisión no tiene fotos: sube al menos una antes de enviarla.» | El técnico lo entiende sin explicación (`openspec/specs/remisiones/spec.md:484-485` en `ca56c62`) |

La 3 no hace falta provocarla en un ticket real: basta con que el técnico lea el texto, que es literal de
`apps/desk/server/routes/remision.ts:287` en `dcb5c99`.

### 6.4 · La comprobación 2 de F1B-06 — Servicio Técnico

Fuente: `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:84-89`, dueño
«Servicio Técnico, en la app» (`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/tasks.md:417-419`).
F1A-03 la hereda con estado «Re-observar»
(`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:89`).

| Paso a paso | Resultado esperado |
|---|---|
| Tablero → localizar un ticket «Equipo nuevo» en `Verificación` (si no hay ninguno, llevar uno de prueba con «Verificación» desde `En Proceso`) | Cae en la columna **«Otros»**: `Verificación` no tiene columna propia (`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:86`; clasificación en `packages/shared/src/estados.ts:105`) |

Las otras dos de F1B-06 (`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:85` y `:87`) van con el mismo dueño y conviene hacerlas en la
misma pasada: un «Equipo nuevo» en `Ingresado` sólo ve «Ingreso equipo nuevo», y el 409 de mezclar flujos
se entiende sin explicación.

### 6.5 · Verificación en la app de F1A-03 — Servicio Técnico / Gerencia

Registrada sin pasos concretos: «Seguir convención in-app post-despliegue»
(`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:88`). Los resultados esperados
salen de los criterios de éxito de la propuesta
(`openspec/changes/archive/2026-09-27-salidas-verificacion/proposal.md:110-112`).

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Con un usuario de **Servicio Técnico**, abrir un ticket «Equipo nuevo» en `Verificación` | El panel de transiciones ofrece **dos** botones: «Liberación» y «Rechazo de verificación» |
| 2 | Pulsar «Liberación» (en un ticket que de verdad haya que liberar) | El ticket pasa a `Finalizado` |
| 3 | En otro ticket en `Verificación`, pulsar «Rechazo de verificación» | El ticket pasa a `Notificado`, y desde ahí ve «Análisis y acciones» |
| 4 | Con un usuario **sólo de Comercial**, abrir un ticket en `Verificación` | No ve ninguno de los dos botones (el servidor respondería 403) |

⚠️ Los pasos 2 y 3 **mueven tickets reales** y no hay «deshacer» de una transición. Si no hay un ticket
que de verdad deba liberarse o rechazarse, crear uno de prueba y **borrarlo al terminar** con «Eliminar
ticket» (sólo administrador), como se hizo con el #10002
(`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:459-467`).

### 6.6 · Pendientes de persona del mismo rango que el encargo no nombraba

No bloquean nada; se listan para que no se pierdan.

- F1B-14 (1): probar en la app el alta con serie nueva y con serie ya registrada
  (`openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket/tasks.md:46`), y medir las series
  duplicadas de producción (`openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket/tasks.md:225`).
  Sin dueño con nombre.
- F1B-02: comprobaciones de RQ-HV-07 y la carga retroactiva de los seis campos del parque ya sembrado,
  dueño Comercial/Gerencia (`openspec/changes/archive/2026-09-23-hojas-vida/archive-report.md:78-90`).
- F1A-03: E-082 y E-083, decisiones de Gerencia con Calidad
  (`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:86-87`).
- F1B-08: en la ficha de un cliente, pestaña «EN ESPERA», comprobar que un ticket en `Por Entregar`
  aparece ahí. Sin dueño asignado («QA / quien despliegue»)
  (`openspec/changes/archive/2026-09-12-por-entregar-es-espera/archive-report.md:72-79`).
- F1A-07: comprobar en el contenedor real que la zona `America/Bogota` se resuelve —dueño: quien tenga la
  consola de EasyPanel— y contar en `desk.ticket_transitions.values` los instantes sin desplazamiento
  horario —dueño: quien tenga acceso a la base—
  (`openspec/changes/archive/2026-09-22-fechas-derivadas-servidor/archive-report.md:126-133`).

---

## 7 · Lo que NO es desplegable

**Nada en `dcb5c99`.** Lo comprobado, una condición por fila:

| Condición que haría `dcb5c99` no desplegable | Resultado | Evidencia |
|---|---|---|
| Una migración no idempotente | **No hay.** Las once sentencias nuevas llevan `IF NOT EXISTS` | §2.1 |
| Un interruptor de escritor sin documentar | **No hay.** Ninguna variable de entorno nueva | §3 |
| Un estado sin salida | **No hay.** En el flujo de equipo nuevo, el único estado sin salida es `Finalizado`, y lo fija una prueba | `packages/shared/src/invariantesGrafo.test.ts:177-181` |
| Un build o una suite en rojo | **No.** Build exit 0; 1.445 pruebas en verde | cabecera de este documento |
| Un cambio archivado «no se despliega sin X» con X fuera de `main` | **No.** El único es F1B-06: «Este cambio NO se despliega a producción sin F1A-03» (`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:32`). F1A-03 es `c373bcc`, que está en `main` (`git branch --contains c373bcc` → `main`), y su archivo levanta el bloqueo (`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:30`) | barrido de `no se despliega`, `NO se despliega` y `despliegue` en los `archive-report.md` del rango |

**El orden importa, y por eso se escribe.** Publicar F1B-06 sin F1A-03 dejaba los tickets en
`Verificación` sin ninguna transición. Los dos van juntos en `dcb5c99`, así que el paquete es seguro
**entero**. **No publicar un commit intermedio** entre `1b90a80` (F1B-06) y `c373bcc` (F1A-03).

**Lo que no bloquea pero no se ha podido comprobar:** la versión que corre hoy el worker (§4.2). La imagen
con el `Dockerfile` nuevo SÍ se construyó en local sobre `10453a9`, con salida 0 (§4.3).

---

## 8 · Nota de método

Las citas `ruta:línea` de este documento se comprobaron contra el árbol en `dcb5c99`, leyendo la línea. Las
de `ae5aaf4` llevan la revisión escrita. Las cifras de build y pruebas son de una ejecución local del
2026-09-27. Todo lo que no se pudo comprobar lleva «hipótesis» o dice «no está medido»: el recuento de
tickets de R3, la versión del worker, la construcción de la imagen, el procedimiento de copia y la
igualdad de bytes entre la construcción de Windows y la de Alpine.
