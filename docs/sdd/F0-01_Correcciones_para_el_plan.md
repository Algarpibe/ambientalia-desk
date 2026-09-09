# Correcciones para el plan de fases y tandas R01.1

> **Por qué existe este fichero, y por qué es distinto del del maestro.** El maestro es la fuente de
> lo que hay que construir; el plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md`) es el
> documento que **ordena el trabajo**: dice qué tanda va antes, de dónde sale cada una y qué gate la
> bloquea. Un error de cita en el maestro es una errata que se corrige cuando toque. Un error de cita
> en el plan es una tanda que se ejecuta creyendo tener una autoridad que no tiene.
>
> Igual que el del maestro, esto es **texto listo para pegar**, no un parche: el plan es un `.md` del
> repositorio, pero lo mantiene Gerencia y ninguna tanda lo edita por su cuenta.

| Dato | Valor |
|---|---|
| Documento corregido | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` |
| Tanda que abre el fichero | **F1A-02** (entrada 1) |
| Base | commit `6ea3ca8`, rama `main` |
| Fuentes del contraste | `docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md` (480 líneas) · maestro `R08.1.md` |
| Fecha | 2026-09-09 |

---

## La de F1A-02 (1)

### 1 · El plan cita el acta del 03/09 como fuente de C11, y la sesión nunca trató C11 *(F1A-02)*

**Texto actual**, `plan:139`:

> `| F1A-02 | **C11** SLA de un día sobre Notificado, con correo redundante al cambiar de área y`
> `escalado al superior | M1.7 · P40 · **acta 03/09 (ampliada)** | Ninguno |`

**El problema.** La ampliación de C11 —correo redundante y escalado al superior— **no sale del acta**.
Sale de la **convocatoria**, que es la parte II del mismo fichero y se escribió **antes** de la
sesión:

> `acta:140` — «**C11** — SLA de un día sobre Notificado (P40). Existe en Zoho y no se implementó.
> **Ampliada: correo redundante al cambiar de área y escalado al inmediato superior.**»

Esa línea está en `II.2 · Bloque 2`, bajo el encabezado «Cierran sin discusión — las ejecuta
desarrollo», y **la casilla está sin marcar**. Es un tema que alguien quiso llevar a la mesa, no una
decisión. Es exactamente la regla que F0-03 aplicó a P10 y P62 al cargarlos como `punto-abierto/*` y
no como `decision/*`: **una casilla del orden del día no es una decisión, ni siquiera marcada.**

**Verificado por comando.** La parte III —el acta propiamente dicha, `:268-480`— **no menciona C11 ni
una sola vez**. Filtrando ese rango y contando: `C11` da **0** y `escalado` da **0**.

> ⚠️ **Cuidado con buscar «sla» sin distinguir mayúsculas sobre la parte III: da dos ocurrencias y
> las dos son falsas.** Casan dentro de «tra**sla**da»: `:437` («la sesión de seguimiento se traslada
> al viernes») y `:442` («Trasladar la siguiente sesión»). Ninguna es un SLA. Es la clase de
> comprobación que parece respaldar justo lo contrario de lo que dice.

**Dónde está la autoridad de verdad: en el maestro, no en el acta.** La ampliación es doctrina de la
**R08**, y está escrita en tres sitios:

| Línea | Qué dice |
|---|---|
| `R08.1.md:1572-1575` | «Ampliación del revisor [R08]. El SLA no debería limitarse a marcar el retraso, sino escalarlo. **Dos piezas:** … aviso redundante por correo cuando una transición cambia de área … escalado jerárquico al superarse el SLA … **Encaja con la derivación de M1.9.2**, que ya sabe a qué cargo corresponde cada etapa» |
| `R08.1.md:4561` | Anexo H: «Pendiente. **Ampliada en la R08:** correo redundante y escalado al superior» |
| `R08.1.md:4780` | «**Ampliada la corrección C11:** correo redundante y escalado jerárquico apoyado en la derivación por cargo» |

**Texto propuesto para `plan:139`:** sustituir la columna Fuente por

> `M1.7 (R08.1.md:1570-1575) · P40 · Anexo H (:4561)`

y **quitar «acta 03/09 (ampliada)»**. La ampliación la firma la R08, no la sesión.

**Por qué importa más que una errata.** F1A-02 se ejecutó creyendo que la ampliación venía de una
sesión donde tres personas la habían acordado. Venía de una casilla sin marcar de un orden del día.
El resultado técnico no cambia —la R08 sí la respalda—, pero la cadena de autoridad sí: si la única
fuente hubiera sido esa casilla, C11 tendría que haber vuelto al Anexo D como P10 y P62.

Y hay una consecuencia que sí cambió el trabajo: **`:1575` es la línea que resuelve el escalado**, y
al citar el acta en vez del maestro se llega al tema por el camino que no la contiene. La primera
lectura de F1A-02 dio por bloqueado el escalado «porque no hay jerarquía»; la línea siguiente a la
que se citó dice que no hace falta ninguna. Anotado en `openspec/specs/transitions-st/spec.md` §3.10.

---

## El barrido: todas las filas del plan que citan el acta del 03/09

Mismo método que el de las casillas de F0-03, aplicado al plan. **«Respaldada»** significa que la
parte III (`:268-480`) la sostiene; **«convocatoria»**, que sólo está en las partes I y II.

El comando que produce la lista, sobre `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md`:
contar las líneas que contienen `03/09`. Devuelve **27**. Y las tres cifras del contraste, filtrando
la parte III (`:268-480`) del acta: `C11` → **0**, `escalado` → **0**, `sla` sin distinguir
mayúsculas → **2**, y las dos son los falsos positivos de «traslada» que se explican arriba.

| Línea del plan | Tanda / apartado | Qué cita | Respaldo en la parte III | Veredicto |
|---|---|---|---|---|
| `:125` | F0-03 | «decisiones cerradas … y acta 03/09» | Los siete bloques `Decisiones tomadas:` | **Respaldada** |
| `:139` | **F1A-02 (C11)** | «acta 03/09 (ampliada)» | **Ninguno.** Cero menciones de C11 | ⛔ **Convocatoria** (`:140`, sin marcar) |
| `:153` | F1B-04 | «la "recepción unificada" del acta 03/09» | `:324`, tema 2 | **Respaldada** |
| `:183` | F1D-01 | «acta 03/09 tema 3» | Decisiones en `:350-351` | **Respaldada** |
| `:186` | F1D-04 | «Acta 03/09 "flujo de validación por niveles"» | Decisión en `:351` | **Respaldada** |
| `:188` | **F1D-06** | «acta 03/09 **tema 4**» | El tema 4 se trató y **NO dejó decisión**: sólo tarea (`:368-370`) | ⚠️ **Tratada, sin decisión** |
| `:189` | F1D-07 | «Acta 03/09 tema 5» | Decisión en `:382` | **Respaldada** |
| `:190` | F1D-08 | «los macros coinciden entre modelos Horiba» | `:344`, **resumen de la discusión**, no decisión | ⚠️ **Hecho constatado, no decidido** |
| `:193` | Fuera de Fase 1 | «decidido 03/09: tras ~90 tickets» · «aplazado 03/09» | Decisiones `:403` y `:404` | **Respaldadas** |
| `:197` | Épica 1E | «Segunda adición, decidida el 03/09» | Decisión `:402` | **Respaldada** |
| `:201` | F1E-01 | «Acta 03/09 tema 6» | Decisiones `:402-405` | **Respaldada** |
| `:202` | F1E-02 | «M2.5, acta 03/09» | Decisión `:405` | **Respaldada** |
| `:218` | Fase 2 | «comentarios predefinidos … (decisión 03/09)» | Decisión `:403` | **Respaldada** |
| `:298` | Prompt de F1D-06 | «Acta 03/09/2026 tema 4 ("Encadenamiento **pendiente**")» | Lo cita **como pendiente**, que es correcto | **Correcta** |
| `:312` | Prompt de F1D-04 | «validación por nivel macro (acta 03/09)» | Decisión `:351` | **Respaldada** |
| `:453` | Riesgos | «cuello de botella declarado el 03/09» | `:456`, conclusiones | **Respaldada** |
| `:162` | Épica 1B | «la "regla de la sesión" de la **convocatoria** del 03/09» | Cita la convocatoria **y lo dice** | **Correcta** |
| `:4`, `:12`, `:179` | Cabecera y relato | El acta como fuente documental | Parte III | **Respaldadas** |
| `:406`, `:416`, `:423`, `:426`, `:429`, `:430`, `:432` | Tabla §5 | Duplican las filas de arriba | — | Igual que su fila |

**Dos hallazgos, y sólo uno es un defecto.**

1. **`plan:139` (C11) es el único caso de cita a una fuente que no existe**: la parte III no trata el
   tema. Es la entrada 1 de este fichero.
2. **`plan:188` (F1D-06) cita el tema 4 sin decir que salió sin decisión.** No es una cita falsa —el
   tema sí se trató— pero el plan lo presenta como fuente cerrada, y es justo el tema que F0-03 cargó
   como `punto-abierto/encadenamiento-diagnostico`. **Texto propuesto:** añadir a la columna Fuente
   «(tema tratado **sin decisión**: sólo tarea, `acta:368-370`)». No cambia la tanda; cambia lo que
   quien la ejecute espera encontrarse.

**Y una observación de método que el barrido deja clara:** `plan:162` cita «la regla de la sesión de
la **convocatoria** del 03/09» y acierta, porque esa regla **sí** está en la convocatoria (`:114-116`)
y el plan lo dice. La distinción entre las dos partes del fichero no es una sutileza de archivo: es
la diferencia entre citar bien y citar mal, y el plan la maneja bien en un sitio y mal en otro.

---

## Qué NO contiene este fichero

- No edita el plan. Es texto propuesto.
- No reordena tandas ni cambia gates: eso es de Gerencia.
- Las correcciones al **maestro** van en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, que es
  otro canal y otro documento.
