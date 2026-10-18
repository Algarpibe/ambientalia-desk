---
tanda: F1B-09
motivo: ""
capacidad: [transitions-st, transitions-equipo-nuevo, transitions-soporte-remoto, reconciliacion]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `espera-y-areas-equipo-nuevo`

## 1. Qué fila atiende y qué parte

F1B-09 (`audit-F1B`), la parte que abre `decision/e226-espera-y-areas-equipo-nuevo` (Gerencia, 17/10; E-226 de
`docs/sdd/ENTRADA.md`, B-5 de la auditoría F1B-09): la clase de espera de los tres estados que hoy son `sin_clasificar`
y el área de las seis transiciones de equipo nuevo. `cierra: no`: el repaso al cerrar la épica 1B sigue pendiente
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:215`). Las áreas de soporte remoto siguen en E-090, que la
respuesta no toca (consecuencia 5 de la decisión).

## 2. Medición (antes de proponer)

**El registro.** `EnEspera` admite `externa`, `interna`, `ninguna` y `sin_clasificar` (`packages/shared/src/estados.ts:40`).
Los tres estados están hoy en una sola línea, `sin_clasificar`, `packages/shared/src/estados.ts:105`, bajo el bloque
«sin clasificar (3)» de `:101-104`. `ESTADOS_EN_ESPERA` es `externa` + `interna` (`:120-123`): once.

**Quién lee la clasificación, y qué cambia en cada uno:**

| Lector | Línea | Efecto |
|---|---|---|
| `ESTADOS_EN_ESPERA` | `packages/shared/src/estados.ts:120-123` | De 11 a 12; `Pendiente` entra, la última (orden del registro) |
| `enEsperaDe` | `estados.ts:169-173` | `Pendiente` → `externa`; `Verificación` y `Solicitud Soporte` → `ninguna` |
| `esEstadoEnEspera` | `apps/desk/src/lib/enEspera.ts:14-15` | `Pendiente` pasa a `true`; los otros dos siguen `false` (`sin_clasificar` ya era `false`) |
| Vistas «Abiertos» y «Espera» | `apps/desk/src/lib/boardView.ts:39`, `:47`, `:48` | Un ticket en `Pendiente` sale de «Abiertos» y entra en «Espera». `Verificación` y `Solicitud Soporte` siguen en «Abiertos» |
| Ficha del cliente | `apps/desk/src/components/ClienteDetalle.tsx:36` | Cuenta `Pendiente` como espera. El color (`:41`, `/espera/i`) no cambia: IV-9 pasa a 2 aciertos y 10 fallos sobre 12 |
| Barrido de reconciliación, comprobación 5 | `apps/desk/server/reconciliacion/comprobaciones.ts:154-165` | Lee `estados.ts` COMO TEXTO y cuenta sólo las líneas `'X': 'externa'` solas (`:162`). Pasa de 11 a 12 SÓLO si `Pendiente` va en línea propia y sin comentario detrás |
| Indicadores | — | Ninguno lee `ESTADOS_EN_ESPERA` ni `enEsperaDe` (barrido de `apps/` y `packages/`): sin cambio |
| SLA y alarmas | `packages/shared/src/sla.ts:32`, `:137-141` | Lista propia, declarada: no leen la clasificación. Sin cambio. `sla.test.ts:51-55` sigue probando la independencia |
| Mapa y fases | `ESTADOS_SIN_SALIDA` (`estados.ts:151-160`) | Leen `sin_salida`, no `en_espera`. Sin cambio |

El reloj de `decision/c7-reloj-sla` (F1C-06) todavía no está construido; su lista será propia y no se deriva de ésta.

**Áreas.** Las seis de `TRANSITIONS_EQUIPO_NUEVO` son hoy `Servicio Técnico` (`packages/shared/src/transitions.ts:351-362`),
por el supuesto s2 del docblock (`:347-348`). En el flujo de servicio las liberaciones son de Comercial —`facturado`
(`:240`), `liberacion_sin_factura` (`:246`), `habilitado_para_entrega` (`:259`)—, y son liberaciones COMERCIALES:
dependen de la factura o la habilitan.

## 3. Qué se construye

1. `Pendiente` → `externa` («depende de alguien de fuera»; Gerencia: «sólo tickets antiguos»).
2. `Verificación` → `ninguna`.
3. `Solicitud Soporte` → `ninguna` (supuesto del analista registrado en la decisión, consecuencia 3: es el estado de
   nacimiento del soporte remoto y cola propia).
4. Áreas: las seis siguen en `Servicio Técnico`, ahora por decisión y no por equivalencia. Ningún área cambia, así que
   no se toca ningún permiso.
5. El docblock de `TRANSITIONS_EQUIPO_NUEVO` (`transitions.ts:347-348`) deja de nombrar el supuesto s2, en sitio.

**El razonamiento de `liberacion`.** La regla de Gerencia es Servicio Técnico salvo entrega o facturación al cliente. La
liberación de equipo nuevo no es ninguna de las dos: es la salida del control técnico —desde `En Proceso` o tras la
verificación con gas patrón— y exige el número del certificado de fábrica (M1.4, `R08.4.md:1693`, `:1698`, `:5779`; en el
código, `transitions.ts:359-360`). No entrega nada al cliente ni toca una factura. Las liberaciones de servicio que son de
Comercial lo son porque dependen de la factura (`transitions.ts:240`, `:246`, `:259`); por eso no se aplica la analogía
que la hipótesis de RQ-EN-02 dejaba abierta. Supuesto reversible: Servicio Técnico.

## 4. Supuestos (a la lista semanal, `decision/supuestos-semanales-aceptacion`)

- **S-1.** `Solicitud Soporte` no es espera (cola propia). Ya registrado por el analista; se repite para la lista.
- **S-2.** `liberacion` de equipo nuevo es de Servicio Técnico, porque es la liberación técnica con certificado de fábrica.
- **S-3.** La lista de áreas de las seis, todas `Servicio Técnico`: `ingreso_equipo_nuevo`, `producto_no_conforme`,
  `analisis_y_acciones`, `verificacion`, `liberacion`, `rechazo_verificacion`.
- **S-4.** `Pendiente` va `externa` y no `interna`: Gerencia lo define como espera de alguien de fuera.
- **S-5.** Las tres entradas se quedan en sus líneas (`estados.ts:103-105`) y no se mudan a sus bloques: el fichero está
  muy citado y la convención de agrupar por clase (`:56-57`) cede ante la regla de mutación 4, con la excepción escrita.

## 5. Fuera de alcance

- `CLAUDE.md` y `openspec/config.yaml` (`cifras_ancladas.esperas`, «ONCE»): son de Supervisión; las cifras nuevas se
  entregan como texto.
- El color de IV-9 (`ClienteDetalle.tsx:41`, `TicketDetailView.tsx:245`): sin destino, no lo toca esta tanda.
- Áreas de soporte remoto (E-090).
- La lista del reloj de F1C-06.
