# Informe de archivo: `alarmas-horas-habiles`

**Fecha de cierre:** 2026-09-29 · **Carpeta:** `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/`

```yaml
tanda: F1B-08
cierra: no
capacidad: [transitions-st, derivacion-avisos, vistas-tablero]
maestro: ["Anexo D nº 3", "M1.7"]
toca_maestro: si
origen_cabecera: declarada
```

## Cobertura de la fila (R-1)

**F1B-08, `cierra: no`. Cubre las tres alarmas de SLA en horas hábiles (`Notificado` 9 h, `Remisión creada` 27 h sólo
sin orden de venta, `Notificación cliente` 36 h), el aviso al cargo declarado con respaldo al área, la marca
anti-duplicado por entrada, el corte de la primera pasada y la marca de tablero «Esperando aprobación del cliente»;
deja fuera la mitad de paridad de la fila, las «vistas equivalentes a Zoho», que sigue pendiente de la pregunta 4 de
Gerencia (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:93`).**

El numerador del avance no se mueve: la fila F1B-08 sigue abierta.

## Veredicto del verify

`verify-report.md:219`: **PASS WITH WARNINGS** sobre `1843dff`, 8/8 requisitos, 46/46 escenarios (**43 PASS,
2 PARTIAL, 1 MANUAL**), 0 críticos, 7 avisos, 4 sugerencias. Los ocho criterios de éxito de `proposal.md:164-173`,
cumplidos (`verify-report.md:173-183`).

### Escenarios que no son PASS — declarados, no cerrados

| Escenario | Estado | Qué falta | Quién lo cubre |
|---|---|---|---|
| **S27** · config de correo vacía es un no-op explícito (RQ-AV-15) | PARTIAL (`verify-report.md:103`) | La unidad está probada (`avisosWebhook.test.ts:33-38`); a nivel de pasada no hay prueba, porque la prueba de la pasada fija siempre una URL. Composición de piezas probadas, no defecto (W3) | Deuda de prueba declarada; sin destino en esta tanda |
| **S33** · lo vencido antes del corte se marca sin avisar; lo posterior avisa (RQ-AV-16) | PARTIAL (`verify-report.md:113`) | Marca con 0 avisos y 0 correos, probado. **Sin prueba** de que esa marca silenciosa saque la señal de tablero (W3, S4) | Paso 6 de P.2, abajo |
| **S45** · la tarjeta muestra «Esperando aprobación del cliente» (RQ-VT-08) | MANUAL (`verify-report.md:138`) | `TicketCard.tsx` está fuera de la red de pruebas por decisión de Gerencia F0-00 (`vitest.config.ts:16-20`) | P.2 |

| Aviso | Estado al archivar |
|---|---|
| **W1** · el delta de RQ-AV-16 decía `INSERT … ON CONFLICT DO NOTHING RETURNING` | **Corregido en este archivo, antes de la fusión.** El delta y la spec viva (`derivacion-avisos/spec.md:454`) dicen hoy: la primera sentencia es un `INSERT` sin `ON CONFLICT`, y el `23505` significa «ya avisado», como el código (`alarmasSla.ts:44-55`) |
| **W2** · `migrate.test.ts:478` decía «`SELECT` previo» | **Corregido en su sitio**, misma línea, sin desplazar el fichero |
| **W3** · pruebas de pasada pedidas y no escritas | Abierto; de ahí S27 y S33 |
| **W4** · atomicidad probada por estructura (pg-mem no revierte `ROLLBACK`) | Abierto; lo comprueba Postgres real en P.2 |
| **W5** · el prefiltro de marcas (`alarmasSla.ts:88-94`) no lo detecta ninguna prueba | Superviviente declarado (optimización) |
| **W6** · `tasks.md` sin commitear | Cerrado por `2d2805c` antes del archivo |
| **W7** · timeout intermitente del worker de vitest | Anotado; no se reprodujo en la re-ejecución de abajo |
| **S1** · `tasks.md:318` decía «siete» criterios | **Corregido**: «ocho», `proposal.md:164-173` |

## Cifras re-ejecutadas por el orquestador

Sobre el árbol del archivo (`2d2805c` más la fusión y las correcciones), el 2026-09-29:

| Comando | Resultado |
|---|---|
| `npm test` | 159 ficheros pasan y 1 omitido (160); **1.990 pruebas pasan** y 2 omitidas (1.992). Salida 0, a la primera |
| `npm run typecheck` | limpio. Salida 0 |
| `npm run lint` | 0 errores, 165 avisos (el techo). Salida 0 |
| `npm run build` | compila. Salida 0 |

Coinciden con las del verify (1.990 verdes, `verify-report.md:39-50`).

## Fusión de los deltas

Por ID de requisito contra los encabezados de las specs vivas. En las MODIFIED se conserva el título vivo; las ADDED
entran al final de su sección de requisitos, con el formato de encabezado de cada spec. Los «Fuera de alcance de este
delta» no se fusionan. **Cuerpos comprobados verbatim contra el delta, bloque a bloque, por programa** (8 de 8
idénticos).

| Spec viva | Requisito | Operación | Encabezado hoy |
|---|---|---|---|
| `transitions-st` | RQ-TS-15, RQ-TS-16 | MODIFIED | `:553`, `:657` |
| `transitions-st` | RQ-TS-19 | ADDED | `:699` |
| `derivacion-avisos` | RQ-AV-15, RQ-AV-16, RQ-AV-17 | ADDED | `:398`, `:454`, `:515` |
| `vistas-tablero` | RQ-VT-07, RQ-VT-08 | ADDED | `:237`, `:285` |

Sin capacidad nueva: R-2 no aplica.

**Cabeceras de recuento.** `transitions-st/spec.md:9` decía «**16** requisitos (`RQ-TS-01`…`RQ-TS-16`)»; ya estaba
desfasada antes de este cambio, porque RQ-TS-17 y RQ-TS-18 existían. Contados los encabezados tras la fusión, son
**19** (`RQ-TS-01`…`RQ-TS-19`). `derivacion-avisos/spec.md:9` decía **12** con RQ-AV-13 y RQ-AV-14 ya dentro: hoy
**17** (`RQ-AV-01`…`RQ-AV-17`).

**Corrección documental que el delta dejó al archivo** (su «Fuera de alcance»). Las dos entradas narran algo cierto
en su fecha (caso C): se conservan y se añade qué las cerró.

- §3.7 (`transitions-st/spec.md:960-963`): nota fechada; desde F1B-08 hay tres estados con alarma, dos de ellos
  (`interna` y `externa`) dentro de `ESTADOS_EN_ESPERA` (`estados.ts:120-123`), y el reloj sigue sin leer esa lista.
- §3.10 (`transitions-st/spec.md:1166`): C11 cerrado. El disparo existe (`index.ts:88`) y el destinatario lo declara
  `ALARMAS_SLA`; en la tabla «Qué hace falta para cerrar C11», las filas del disparo y de la extensión a otros
  estados pasan a hechas.

## Barrido de citas del movimiento y de la fusión

- **Fusión.** Tres citas de otros ficheros caían en la zona desplazada de `transitions-st` (+103 por la fusión y
  +5 por §3.7), todas a la tabla canónica de escalones y todas de caso A:
  `openspec/specs/hojas-vida/spec.md:185` → `transitions-st/spec.md:995-1000`; `:190` → `:1003-1005`
  (excepción A/C); y `docs/sdd/ENTRADA.md:1146` → `:995-1000`. Esta última **ya era errónea antes de este cambio**:
  se escribió contra `a2cbeb2`, donde la tabla ocupaba esa posición, y el archivo de `registro-contrato` no la movió.
  Hoy dice lo mismo que entonces: el escalón A es la existencia. Ninguna cita a `derivacion-avisos` ni a
  `vistas-tablero` cae detrás de las inserciones. `openspec/config.yaml` y `CLAUDE.md` no citan líneas desplazadas
  y no se tocan.
- **Movimiento.** Ninguna ruta del repositorio fuera de la carpeta archivada apunta a
  `openspec/changes/alarmas-horas-habiles/`.
- **La cita nueva de §3.7** se escribe completa (`estados.ts:91`, no la forma abreviada) para que el detector la lea.

## Adenda a E-087

Las alarmas son el segundo dependiente de la pasada de sincronización con Zoho (`apps/desk/server/index.ts:88`):
si esa pasada se retira sin trasladar la llamada, las alarmas callan sin que nada se ponga rojo (RQ-AV-17). La adenda
está escrita en `docs/sdd/ENTRADA.md:1269`.

## Nota del paquete de despliegue (literal de `tasks.md:324-333`)

Antes de desplegar hace falta un paquete de despliegue NUEVO (`docs/sdd/Paquete_de_Despliegue_2026-09-29.md` es un registro fechado y no se edita). Recoge `tickets.modalidad` (`packages/zoho-sync/src/db/schema.sql:576`) y S-6 de `blueprint-soporte-remoto` con el recuento de su P.1 (o «sin medir»), y de esta tanda:

1. **Dos tablas nuevas**, sin relleno: `public.alarmas_avisadas` (marca anti-duplicado; clave primaria ticket, estado, instante de entrada) y `public.alarmas_corte` (una fila: el corte de la primera pasada).
2. **Cambio visible de `Notificado`:** pasa de 24 h de reloj a 9 h HÁBILES (jornada 08:00-17:00, sin fines de semana, festivos ni cierres). En días laborables avisa antes; en fin de semana, más tarde.
3. **Dos alarmas nuevas:** `Remisión creada` a las 27 h hábiles (sólo si el ticket no tiene orden de venta por ninguna vía) y `Notificación cliente` a las 36 h hábiles (además, marca el ticket en el tablero «Esperando aprobación del cliente»).
4. **El día del despliegue (corte de S-13):** la primera pasada fija el corte; lo que YA estaba vencido se marca y NO se avisa (sale la marca del tablero, no el correo). Lo que venza después avisa normal. Un reinicio o un redespliegue no mueven el corte.
5. **A quién:** al usuario activo con cargo `Coordinador Comercial`; si no hay ninguno, al área Comercial, con un `warn` «Alarma de SLA sin Coordinador Comercial» en el log.
6. **Pendientes de persona que acompañan al paquete:** P.1 (que exista en producción el cargo `Coordinador Comercial`; no bloquea); P.3 (Gerencia: si quiere la ráfaga de lo vencido antes del despliegue; por defecto, apagada); P.4 (Gerencia: confirmar que `Notificado` escala al Coordinador Comercial).

Se despliegan los cuatro lotes juntos. Rollback: revertir; las tablas son nuevas y sólo las lee este código (el corte ya escrito no se reescribe al volver a desplegar), y sin la llamada en `index.ts:88` no hay avisos ni marca. La pasada de alarmas depende de la sincronización con Zoho (adenda a E-087).

## Tareas de persona — fuera del recuento (regla del ciclo 1)

No las puede hacer una tanda en este repositorio: piden consultar producción, desplegar o decidir. **Archivar NO las
da por hechas.** Texto completo en `tasks.md:398-414`. Ninguna tiene resultado todavía.

| Tarea | Dueño | Qué | Destino | Escrita en |
|---|---|---|---|---|
| P.1 | Alfonso (administración) | Comprobar que hay al menos un usuario activo con `cargo = 'Coordinador Comercial'` (consulta de sólo lectura en `tasks.md:398`). No bloquea: sin él, las alarmas van al área Comercial con un `warn` | Paquete de despliegue | `tasks.md:398`, `proposal.md`, este informe |
| P.2 | Alfonso / Comercial | Verificación en la app tras desplegar los cuatro lotes, en `ambientalia-desk.ambientalia.cloud`: los pasos 1-5 de `tasks.md:404` **y el paso 6 de abajo** | Verificación en la app (S45, S33, W4) | `tasks.md:404`, `proposal.md`, este informe |
| P.3 | Gerencia | ¿Se enciende la ráfaga de lo vencido antes del despliegue? Por defecto, apagada | `openspec/config.yaml` → `decisiones_de_gerencia`; sin respuesta, se despliega apagada | `tasks.md:406`, nota de despliegue, este informe |
| P.4 | Gerencia | Confirmar que `Notificado` escala al `Coordinador Comercial` (S-3) | Si es otro cargo, se cambia un literal de `ALARMAS_SLA` y su prueba | `tasks.md:414`, este informe |

**Paso 6 de P.2 — cubre el PARTIAL de S33.** En `ambientalia-desk.ambientalia.cloud`, el día del despliegue: localizar
un ticket que **ya estuviera vencido** en `Notificación cliente` (más de 36 h hábiles desde su entrada) antes de la
primera pasada. Tras esa pasada, comprobar que **su tarjeta del tablero muestra «Esperando aprobación del cliente»** y
que **no ha generado aviso en la campana ni correo** a nadie. Anotar el número de ticket y el resultado.
