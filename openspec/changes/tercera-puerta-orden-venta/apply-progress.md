# Apply-progress — `tercera-puerta-orden-venta` (desvío IV-4)

> ⚠️ **PRE-SEMBRADO ANTES DE `sdd-apply`. NINGUNA TAREA ESTÁ HECHA.**
> Este fichero existe hoy sólo para llevar hasta el `apply` un hecho que ocurrió FUERA del repositorio
> y que no vive en ningún otro artefacto que el `apply` lea. **Cuando `sdd-apply` corra, LEE esto
> primero y FUSIONA su progreso encima — no lo sobrescribas** (Apply-Progress Continuity).
> Estado de tareas a fecha de hoy: **0 de N**, porque `sdd-tasks` todavía no ha corrido.

---

## Precondición operativa — RESUELTA el 2026-09-16, y el `apply` puede seguir

`apps/desk/server/ordenVentaUnTicket.test.ts:35-46` declara la **consulta 4.1 del runbook** como
precondición de tapar la tercera puerta, y dice por qué no es un trámite: si alguien en Comercial
descubrió que remisionando sí se puede duplicar una orden, esa es hoy su vía de trabajo, y taparla sin
mirar antes «no arregla un defecto: rompe un flujo real, en producción, sin aviso» (`:42-43`).

Gerencia la ejecutó en `psql` contra producción el **2026-09-16**:

```sql
SELECT salesorder_id, COUNT(*), array_agg(number ORDER BY number)
FROM desk.tickets WHERE COALESCE(salesorder_id,'') <> ''
GROUP BY salesorder_id HAVING COUNT(*) > 1;
```

### Las dos cifras, que van siempre juntas

| Cifra | Valor |
|---|---|
| Filas devueltas (órdenes en más de un ticket) | **0** |
| Población (tickets con `salesorder_id` no vacío en toda la base) | **1** |

### La lectura, que es la parte que importa

**El alcance NO cambia. El `apply` puede seguir.** No hay histórico que romper ni flujo real que cortar.

⚠️ **Pero la precondición se cumple POR VACÍO, no por comprobación.** Con población 1 un duplicado es
aritméticamente imposible: la consulta agrupa por `salesorder_id` y filtra `HAVING COUNT(*) > 1`, y con
un solo ticket en el universo ninguna agrupación puede pasar de uno. Ese `0` **no dice que nadie esté
usando la puerta abierta**; dice que **nadie pudo**.

Es una cifra **sin poder de refutación**. Separarla de su población la convertiría en una afirmación
sobre el sistema, y es una muestra de un caso. Por eso las dos van siempre juntas, aquí y en `proposal.md`
§12.1.

**La ventana en la que ese `0` empieza a significar algo es F1F-03** (`plan:214`, aceptación con
servicios reales), cuando la población deje de ser 1. **No es un destino**: es dónde volvería a verse.

Es la misma población 1 sobre la que se midió **IV-11** (la divergencia `orden_venta`/`salesorder_id`
por sincronización, en la tabla de «Incumplimientos vivos» de `CLAUDE.md` y en
`openspec/config.yaml`), y no es casualidad: las dos cifras miran al único ticket que hoy tiene
`salesorder_id`. Cuando F1F-03 repueble esa columna, **las dos hay que remedirlas**, no sólo una.

---

## Qué NO cambia por esto

- La tercera puerta se construye igual: la decisión de Gerencia (`Decisiones_Gerencia_2026-09-10.md:137-140`)
  no dependía de esta consulta. La consulta protegía al histórico, y no hay histórico.
- Sigue sin poder usarse este `0` para argumentar que la divergencia del sync (IV-11) no ocurre. Es la
  misma población, con la misma advertencia.
- Las tres exclusiones de alcance de `proposal.md` §2 siguen en pie.
