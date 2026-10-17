---
tanda: F1B-08
motivo: ""
capacidad: [reconciliacion]
maestro: ["ítem 22", "M1.10", "Anexo D nº 3", "M1.7", "M7.5"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: cierre de F1B-08 con lo construido

## Intención

Gerencia cerró F1B-08 «con lo construido» el 2026-10-17 (`decision/f1b08-cierre-sin-capturas`,
`openspec/config.yaml:4807`): no llegó ninguna captura de las vistas de Zoho en el plazo del 16/10, y
la propia regla de `decision/p4-vistas-equivalentes-zoho` (`openspec/config.yaml:3944`) cierra en ese caso
la mitad de paridad sin construir nada más. Lo que falte de Zoho Desk pasa a F1F-03.

Esa misma decisión dejó el cierre **sin registrar** en el avance (`openspec/config.yaml:4817-4825`):
`cierres_declarados_por_commit` no admite el caso, y nombró dos vías. Este cambio toma la primera, la que
eligió Gerencia en el encargo del 2026-10-17: **un cambio archivado con `tanda: F1B-08` y `cierra: si`**,
que es lo que el barrido cuenta «por archivo». No amplía RQ-RC-10.

**Es un cambio documental.** No toca código de producción, ni `openspec/specs/`, ni el maestro. Su único
efecto medible es que, archivado, F1B-08 pasa de «en curso» a «cerradas por archivo» en
`docs/sdd/RECONCILIACION.md`.

## Qué pide la fila, medido

`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:88`: «Paridad de vistas con Zoho y tablero ·
**+ búsqueda por número de ticket y serial**», con cuatro decisiones de respaldo:
`decision/escalado-remision-creada`, `decision/p44-escritura-zoho`, `decision/anexo-3-alerta` y
`decision/trabajo-del-01-10-antes-del-corte-sin-fila` (1). La búsqueda es ampliación medida de la fila
(`:153`). El remanente que quedaba era la paridad de vistas (`:214`, `:268`).

## Qué cubrió cada cambio archivado (los cinco llevan `tanda: F1B-08`, `cierra: no`)

| Cambio | Qué cubrió | Dónde se dice |
|---|---|---|
| `2026-09-10-vista-todos-y-estados-en-espera` | Tablero: vista «todos» con cerrados y `ESTADOS_EN_ESPERA` como fuente; cierra IV-1, IV-5 e IV-7 | `openspec/changes/archive/2026-09-10-vista-todos-y-estados-en-espera/archive-report.md:10-15` |
| `2026-09-12-por-entregar-es-espera` | Tablero: `Por Entregar` clasifica como espera (mitad clasificación; el color es IV-9, sin destino) | `openspec/changes/archive/2026-09-12-por-entregar-es-espera/archive-report.md:74` |
| `2026-09-29-alarmas-horas-habiles` | Las tres alarmas de SLA en horas hábiles, el aviso al cargo con respaldo al área y la marca «Esperando aprobación del cliente» | `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:16-20` |
| `2026-10-04-busqueda-ticket-serial` | Búsqueda del listado por número de ticket y serial (E-133) | `openspec/changes/archive/2026-10-04-busqueda-ticket-serial/archive-report.md:10-13` |
| `2026-10-08-columna-propia-dos-estados` | Columna propia para `Verificación` y `Solicitud Soporte` | `openspec/changes/archive/2026-10-08-columna-propia-dos-estados/archive-report.md:6-8` |

## Las cuatro decisiones de respaldo, contrastadas

- **`escalado-remision-creada`** (`openspec/config.yaml:1421`): la alarma de `Remisión creada` está
  construida (`packages/shared/src/sla.ts:34`, 27 h hábiles por `decision/anexo-3-alerta`). El destinatario
  doble de su respuesta lo precisó `decision/escalado-destinatario-doble` (`openspec/config.yaml:1492`) a
  UN cargo, `Coordinador Comercial`, que es el de `packages/shared/src/sla.ts:139`.
- **`p44-escritura-zoho`** (`openspec/config.yaml:1562`): «no escribir en Zoho». Su consecuencia (3) pedía
  leer `feat/mark-and-sweep` y `fix/sweep-contacts-all-types` antes de dar la política por cumplida.
  Medido: las dos están en `main` desde `cd2f6aa` (2026-07-21) y `5af8bd4`, antes de la decisión, y en
  `packages/zoho-sync/src` y `apps/hub-sync/src` las únicas peticiones que no son lectura son los `POST`
  de refresco del token OAuth (`packages/zoho-sync/src/books/booksClient.ts:32`,
  `packages/zoho-sync/src/crmHub/crmClient.ts:13`, `packages/zoho-sync/src/tokenManager.ts:25`). El
  barrido borra de la réplica local (`packages/zoho-sync/src/sweep/sweep.ts:82-84`), no de Zoho.
- **`anexo-3-alerta`**: construida por `alarmas-horas-habiles` (tabla de arriba).
- **`trabajo-del-01-10-antes-del-corte-sin-fila` (1)**: la búsqueda, construida por
  `busqueda-ticket-serial`.

**Conclusión de la medida:** no queda contenido de la fila sin construir que no cubra
`decision/f1b08-cierre-sin-capturas`. La paridad de vistas se cierra con lo construido y lo que falte
pasa a F1F-03 (`openspec/config.yaml:4815-4816`).

## Lo que sigue abierto y NO es contenido de la fila

Seis entradas de la bandeja nacidas de la búsqueda siguen abiertas (`docs/sdd/ENTRADA.md:1971-1999`,
E-195 a E-200). Son preguntas sobre supuestos reversibles ya construidos o sobre ampliaciones no
decididas, con dueño propio; no son contenido pendiente de la fila. **Pero E-198 dice que su respuesta
desbloquea «un cambio posterior dentro de F1B-08»** (`docs/sdd/ENTRADA.md:1988`): con F1B-08 cerrada,
ese destino deja de existir. Por la regla de `CLAUDE.md` («un destino es una promesa, y hay que barrerla
al cerrar la épica») se declara aquí; `docs/sdd/ENTRADA.md` es de Supervisión y no se edita en la rama.

## Alcance

### Dentro

- Este `proposal.md`, `tasks.md`, `verify-report.md` y `archive-report.md`.
- Al archivar: la carpeta pasa a `openspec/changes/archive/`, y la prueba
  `apps/desk/server/reconciliacion/registro.test.ts:218-220`, que fija la lista «en curso» del árbol
  real con F1B-08, se pone en rojo; se ve el rojo y se corrige en sitio, sin mover líneas.
- `docs/sdd/RECONCILIACION.md` regenerado sobre el commit de archivo.

### Fuera

- Código de producción, `openspec/specs/` y el maestro.
- `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y `CLAUDE.md` (ficheros de Supervisión).
- El estado de la fila en el plan R01.4 (`:88` dice «en curso»): lo actualiza Supervisión.

## Supuestos reversibles

| # | Supuesto | Alternativa |
|---|---|---|
| S-1 | `maestro:` lleva la unión de los pasajes que declararon los cinco cambios archivados de la fila; la fila del plan no nombra pasajes propios. «ítem 22» es del §3.2 `[EN REVISIÓN — R08]` y vale como procedencia, no como alcance | Dejar `maestro: []` |
| S-2 | `capacidad: [reconciliacion]`, porque el único efecto es el recuento del barrido y la prueba que lo fija | Declarar las capacidades de los cambios de la fila |
| S-3 | No se corrige `openspec/specs/reconciliacion/spec.md:347`, que dice «seis» en curso con una lista del 01/10 (hoy son nueve); corregirlo exige spec delta, y el encargo es sin delta | Un delta de RQ-RC-11 |

## Riesgos

- **Cita en prosa que caduca:** la lista de «en curso» de `registro.test.ts:220` se toca en sitio; el
  barrido de la regla 4 se hace sobre `registro.test.ts` al cerrar.
- **Registro de intentos:** el archive mide la mudanza dos veces (regla del ciclo 2, desvío 3); se abre
  con techo de la mudanza más 800 (regla del archivo).
