# Diseño: fecha de cierre de «Entregado» en la migración, con marca de origen

## Enfoque técnico

Regla pura nueva en `packages/shared` (regla invariable 13), consumida por el ejecutor; la marca de origen va en el JSON
`values` del marcador que ya existe. **Criterio rector: CERO líneas desplazadas** en `migracionTickets.ts`,
`migracionTicketsAbiertos.ts`, el `.sql` y los dos ficheros de prueba citados. Todo lo que se añade va al final de
su fichero o dentro de una línea existente. Así el barrido de la regla de mutación 4 se queda en comprobar que
las citas vivas siguen diciendo lo mismo, sin tener que renumerar ninguna.

## Decisiones

### D-1 · Regla pura al final de `packages/shared/src/migracionTickets.ts`
Las líneas 115 y siguientes son nuevas (hoy el fichero termina en `:113`). Se exportan por `packages/shared/src/index.ts:36` (`export *`).

```ts
export type OrigenCierre = 'zoho' | 'migracion'
export interface CierreMigracion { closedTime: string; origen: OrigenCierre }
/** null si la regla no cierra (statusTypeDestino !== 'Closed'): S-4. Zoho gana si trae fecha (S-3). */
export function cierreDeMigracion(eq: Equivalencia, closedTimeZoho: string | null, instante: Date): CierreMigracion | null
export interface CierresMigracion { conFechaDeZoho: number; conFechaDeMigracion: number }
/** Sólo cuenta los planes con accion 'migrar' cuya regla cierra (D-5). */
export function cierresDeMigracion(planes: readonly PlanTicket[]): CierresMigracion
```
`cierreDeMigracion` rechaza un `instante` inválido con `RangeError` (mismo patrón que `planDeTicket`, `:61`). No lee
el reloj: la cabecera `:9` («sin reloj») sigue siendo cierta.

### D-2 · Cómo llega `closed_time` al ejecutor (S-5)

| Opción | Citas que mueve | Diseño |
|---|---|---|
| A1 · `closedTime` en una línea nueva tras `:48` | +1 desde `:49`: **2 vivas** (`DEPLOY.md:684` → `:64`, `:103-104`), más las archivadas e históricas (caso B, no se tocan) y `proposal.md:61` | limpio |
| **A2 · `closedTime?: string \| null` en la MISMA línea `:48`** (`createdTime: string \| null; closedTime?: string \| null`) | **0** | un miembro más en la línea; opcional, así que los fixtures de `migracionTickets.test.ts:21` siguen compilando |
| B · mapa id→closed_time en el ejecutor | 0 en `shared`; en el ejecutor, añadir líneas antes de `:79` desplaza `:79`, `:84-90`, `:90` y `:92` (zoho-sync `spec.md:1371`, `:1381`, `:1407`; trazas `spec.md:615`; `config.yaml:4749`, `:4759`; `migracionConcurrente.integration.test.ts:204`): **≥7 vivas** | estructura paralela al plan; degrada |

**Elegida A2.** Rechazada B: mueve más citas y parte el dato del ticket en dos estructuras. A1 se rechaza sólo por
el coste del barrido. Opcional y no requerido porque `undefined` se trata como `null` (`t.closedTime ?? null`).
Lectura: `migracionTicketsAbiertos.ts:33` añade `closed_time` al `SELECT` y `:37` añade `closedTime: iso(f.closed_time)`,
las dos en la misma línea.

### D-3 · Instante de la migración (S-1)
`:64` pasa a `opts: { corte: Date; aplicar?: boolean; actor: string; ahora?: Date }` (misma línea). `:66` pasa a
`const aplicar = opts.aplicar === true, ahora = opts.ahora ?? new Date()`: uno por ejecución, igual para todos los
tickets e inyectable en las pruebas. **La ruta no cambia** (`apps/desk/server/routes/admin.ts:228`): toma el valor por
defecto, así que no se mueven las citas `admin.ts:222-232` de `DEPLOY.md:670` y `:680`. Rechazado: que la ruta pase
`new Date()`, porque duplica el valor por defecto y toca un fichero citado sin ganar nada.

### D-4 · Escritura (sin desplazar `:73-90`)
- `:72`: `if (!eq) continue; const cierre = cierreDeMigracion(eq, t.closedTime ?? null, ahora)`.
- `:75`: al final del objeto, `...(cierre && { closed_time_previo: t.closedTime ?? null, closed_time_destino: cierre.closedTime, cierre_origen: cierre.origen })`.
  Sólo la regla que cierra lleva las claves: el `toEqual` de identidad en `migracionTicketsAbiertos.test.ts:80` sigue en verde y fija S-4.
  Se incluye `closed_time_destino` por simetría con el par `estado_previo`/`estado_destino`: el marcador describe por sí mismo qué escribió.
- `:85`: `UPDATE tickets SET status = $2, status_type = COALESCE($3::text, status_type), closed_time = COALESCE($4::timestamptz, closed_time),`
- `:88`: `[t.id, eq.destino, eq.statusTypeDestino, cierre?.closedTime ?? null]`.
  En la rama Zoho se reescribe el mismo instante (`iso()` de `:28`): queda igual en la práctica.

### D-5 · Informe en seco
Campo `cierres: CierresMigracion` en `InformeMigracion`, añadido en la MISMA línea `:25` (`avisos: string[]; cierres: CierresMigracion`).
Así no se mueven `:21`, `:22` ni `:24`, que cita `DEPLOY.md:673` y `:683`. Se rellena en `:58`:
`..., avisos, cierres: cierresDeMigracion(planes),`. Es igual en seco, al aplicar y con negativa.
Se cuenta en `shared` y no en el ejecutor: la regla de origen tiene una sola implementación (molde H5).
Rechazado: ampliar `resumenDeMigracion`, porque desplaza `:89-113` y con ello `DEPLOY.md:684` (`:103-104`).

### D-6 · Reversión
- `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:76` (sólo la del UPDATE de `entregado-a-finalizado`; la `:81` es
  textualmente igual y NO se toca) gana `closed_time = (m."values"->>'closed_time_previo')::timestamptz,`.
- `:65`: «No toca closed_time» pasa a «Sólo entregado-a-finalizado restaura closed_time desde closed_time_previo; no toca modified_time».
  Se edita en la misma línea.
- `:14`: la lista de `values` gana las tres claves, en la misma línea.
- **Hipótesis:** el cast `::timestamptz` sobre `NULL` funciona igual en pg-mem y en PostgreSQL; la prueba lo ejecuta en pg-mem.

**Pruebas que cambian** (edición en la misma línea, sin desplazar):
- `migracionTicketsF1F01.test.ts:93`: el título pasa a «restaura closed_time». El cuerpo (`:101-103`) ya compara `closed_time`
  (`fotoTickets`, `:56`) y pasa a discriminar: `e2` (`:63`, sin fecha) cierra con la fecha de la migración y vuelve a NULL.
- `migracionTicketsF1F01.test.ts:188-191`, prueba (i): `modified_time` sigue prohibido y `closed_time` sólo puede aparecer
  en la sentencia de `entregado-a-finalizado`. Se reescribe en `:191`, misma línea.
- `migracionTicketsAbiertos.test.ts:85`: **NO se invierte, a diferencia de lo que decía la propuesta.** El fixture `:74`
  da a `t1` el valor `closed: '2026-08-01…'`, rama Zoho, que se conserva. Sigue verde y pasa a ser el detector de
  precedencia de D-7.
- `migracionTicketsAbiertos.test.ts:56`: la lista de claves gana `'cierres'`, en la misma línea.

### D-7 · Mutaciones, por escrito
- **Regla 1:** no hay guarda nueva. Se muta la PRECEDENCIA (la migración gana a Zoho): se ponen rojas `migracionTicketsAbiertos.test.ts:85`
  y la prueba unitaria de la rama Zoho. Se muta el FILTRO (quitar `statusTypeDestino === 'Closed'`): se ponen rojas `:80` (claves
  de más en identidad) y la prueba nueva «Pendiente e identidad no tocan closed_time».
- **Regla 2:** se ensucia el `.sql` quitando la restauración de `:76`. Se ponen rojas la (a) (`e2` queda con la fecha de la
  migración) y la (i) reescrita. Además se pone la restauración en la `:81`, y la (i) también se pone roja.
- **Regla 3 / regla 13:** sin cambios en `apps/desk/src`. El cliente no toma ninguna decisión nueva, así que no hay espejo que justificar.
- **Regla 4:** las citas se barren al cierre (D-9).

### D-8 · Pruebas nuevas, todas al FINAL de su fichero
- `packages/shared/src/migracionTickets.test.ts`: las dos ramas de `cierreDeMigracion`, `null` en las otras tres reglas, el `RangeError`
  y `cierresDeMigracion` (sólo `migrar`, sólo las reglas que cierran).
- `migracionTicketsAbiertos.test.ts`: un «Entregado» sin `closed_time` y con `ahora` inyectado queda con ese instante y `cierre_origen: 'migracion'`.
  Otro con fecha conserva la suya y lleva `cierre_origen: 'zoho'`. Un «Pendiente» y una identidad no tocan `closed_time`.
  En seco, `cierres` cuenta las dos ramas.
- `migracionTicketsF1F01.test.ts`: la restauración de `closed_time` aparece en una sola sentencia, la de `entregado-a-finalizado`.

### D-9 · Barrido al cierre (regla 4)
Si el apply cumple «cero desplazadas», el barrido comprueba lo que AFIRMAN las citas, no sus números:
- `config.yaml:4749` (`:84-88`) y `:4759` (`:86-87`): las frases describen el `UPDATE` sin `closed_time`, que pasa a ser falso.
  Son caso B o C, y las anota quien tenga permiso sobre `config.yaml`, no esta tanda.
- zoho-sync `spec.md:1381` (`:84-90`): la reescribe el delta del agente de specs.

Hay que hacer el segundo pase de la forma abreviada en `DEPLOY.md`, en los dos `.test.ts` y en el `.sql`.

## Flujo de datos

    SELECT … closed_time (:33) → TicketParaMigrar.closedTime (:37) → planDeTicket
      ├─ seco/aplicar: cierresDeMigracion(planes) → informe.cierres (:58)
      └─ aplicar: cierreDeMigracion(eq, closedTime, ahora) (:72) → values del marcador (:75) → UPDATE … closed_time (:85, :88)
    Reversión (.sql:76) ← values.closed_time_previo

## Ficheros

| Fichero | Acción |
|---|---|
| `packages/shared/src/migracionTickets.ts` | `:48` en la misma línea; funciones al final |
| `apps/desk/server/db/migracionTicketsAbiertos.ts` | `:25`, `:33`, `:37`, `:58`, `:64`, `:66`, `:72`, `:75`, `:85`, `:88`, todas en la misma línea |
| `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` | `:14`, `:65`, `:76`, todas en la misma línea |
| los tres `*.test.ts` | ediciones en la misma línea y pruebas nuevas al final |
| `apps/desk/server/routes/admin.ts`, `apps/desk/src` | sin cambios |

## Matriz de amenazas
N/A: no hay enrutamiento, shell, subprocesos, automatización de VCS/PR ni integración de procesos nuevos. La ruta no cambia.

## Migración / despliegue
Sin `ALTER` ni variable nueva. La migración no se ha aplicado en producción (E-211). **Riesgo:** un marcador escrito por
el ejecutor anterior no tiene `closed_time_previo`, y la reversión le pondría `closed_time` a NULL. Hoy no existe
ninguno en producción (hipótesis apoyada en E-211 pendiente). Si existiera, lo detecta el `SELECT` 1b.

## Preguntas abiertas
- H-1 (de la propuesta): excluir de Análisis y de la ficha las fechas con `cierre_origen: 'migracion'`. Corresponde a Gerencia y no bloquea el diseño.
