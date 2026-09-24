> **Documento de trabajo: no contiene decisiones de Gerencia.**

# Cómo entran los hallazgos nuevos sin descarrilar lo que está corriendo

**Fecha:** 09/09/2026 · **Situación:** F1A-02 (C11) en curso en Claude Code CLI con Gentle-AI/Engram, y Claude Code en Antigravity revisando las salidas del CLI
**Problema:** en dos días han aparecido un objetivo nuevo (independencia de Zoho al 31/12), dos épicas nuevas, una decisión de arquitectura (n8n) y un inventario de configuración con tres hallazgos. Nada de eso puede entrar de golpe en una tanda en vuelo

**La regla que ordena todo esto:** un hallazgo entra en la tanda que está corriendo **sólo si cambia lo que esa tanda va a construir**. Todo lo demás espera al cierre. Hoy, de todo lo nuevo, **sólo uno cumple esa condición** — y justamente afecta a C11.

---

## 1 · Ahora mismo, en la sesión del CLI: el único hallazgo que toca C11

C11 se está implementando sobre esta frase del maestro: *«Recuperar el SLA de un día sobre Notificado que existe en Zoho y no se implementó.»*

**Esa frase es una cita de segunda mano sobre Zoho, y nadie la ha verificado en Zoho.** Por la regla de método que adoptamos en la R03 —*una cita de segunda mano es una hipótesis, aunque venga de un documento propio*—, C11 se está construyendo hoy sobre una hipótesis.

Y el inventario del panel de administración dice que la superficie real es esta:

| SLA | Qué es |
|---|---|
| Basados en prioridades | Plantilla de fábrica. Resolución: Alto 6 h · Medio 24 h · Bajo 2 días |
| Gold | Plantilla de fábrica. Alto 4 h · Medio 12 h · Bajo 24 h |
| Silver | Plantilla de fábrica, **todavía en inglés** — nunca se tocó |
| Bronze | Plantilla de fábrica, **todavía en inglés** — nunca se tocó |
| **`nivel 1`** | **La única propia.** Se ejecuta al crear o actualizar |

Ninguno de los cuatro de fábrica es «un día sobre Notificado»: son tiempos de resolución por prioridad. **Si esa regla existe, está dentro de `nivel 1` o es un escalado dentro del SLA por prioridades.** No lo pude abrir desde el navegador —las filas no responden al clic—, así que es una comprobación manual tuya de dos minutos: Setup → Automatización → SLA → `nivel 1`, y anotar condición, umbral y acción de escalado.

**Texto para pegar en el CLI, sin parar la tanda:**

```
Corrección de premisa para F1A-02, antes de dar la implementación por buena.

La frase del maestro sobre C11 —«el SLA de un día sobre Notificado que existe en
Zoho»— es una cita de segunda mano y nadie la ha verificado contra Zoho. Bajo la
regla de método de la R03, es una hipótesis, no un hecho.

Lo verificado hoy en el panel de administración de Zoho Desk (docs/sdd/
Inventario_ZohoDesk_Configuracion.md §3): hay cinco SLA. Cuatro son plantillas de
fábrica basadas en prioridad —dos de ellas todavía en inglés, nunca tocadas— y
NINGUNA es «un día sobre Notificado». La única propia se llama «nivel 1» y se
ejecuta al crear o actualizar; su condición exacta está pendiente de leer.

Efecto sobre la tanda:
- La parte AMPLIADA de C11 —correo redundante al cambiar de área y escalado al
  inmediato superior, acordada el 03/09— no depende de Zoho y sigue igual.
- La parte de RECUPERAR el SLA de Zoho queda marcada como hipótesis en la spec
  hasta que se lea «nivel 1». No la implementes contra el valor del maestro: deja
  el umbral parametrizado y un escenario Dado/Cuando/Entonces que lo cite como
  pendiente de verificación.
- En la spec, la fuente se cita como «Inventario Zoho 09/09/2026 §3», no como
  M1.7, porque M1.7 es la cita de segunda mano.

Guarda en Engram: hallazgo/sla-zoho-superficie-real.
```

**Y el resto de lo nuevo no toca esta tanda.** Las épicas 1G y 1H, la decisión de n8n y la discrepancia de transiciones no cambian una línea de C11. No las metas ahora.

---

## 2 · Al cerrar F1A-02, antes de abrir la siguiente tanda

Es el momento correcto para todo lo demás, porque `CLAUDE.md`, `openspec/config.yaml` y Engram se leen **al arrancar sesión**: un cambio ahí no llega a una sesión ya en marcha, pero sí a la siguiente.

**Cuatro cosas, en este orden:**

**a) Un punto nuevo en el Anexo D, y es el más serio.** Zoho dice **31 transiciones** en el «Blueprint estado del Servicio»; nuestro código declara **34**, y el blueprint se modificó el **09 de marzo**, después del mapeo de febrero sobre el que se construyó todo el as-built. Dos de las tres de diferencia se explican por las entradas propias de la app (`Ticket creado` y `Remisión creada`, que M1.3.9 dice que no existen en Zoho). **La tercera no está explicada.** Esto afecta a la spec `transitions-st` que F0-02 ya archivó, y a cualquier afirmación de paridad. Resolverlo es abrir el blueprint y listar sus 31 transiciones: media hora.

**b) Regla invariable 14 en `CLAUDE.md`**, del documento de decisión sobre n8n: *«En n8n va el transporte, nunca una decisión ni un estado.»* Se escribe ahora aunque 1H sea de 2027, porque el coste es cero y evita que alguien meta una regla en un lienzo mientras tanto.

**c) La convención que al proyecto le falta: cómo se citan los hechos externos.** La regla de método cubre dos casos —código con ruta y línea, documento con apartado— y **no cubre un tercero que acaba de aparecer: lo verificado en un sistema de terceros por navegador.** Propuesta:

> Un hecho leído en un sistema externo se cita como `[Inventario <sistema> <fecha> §<apartado>]` y vive en un fichero de `docs/sdd/`. **Caduca:** un panel de administración cambia sin avisar, así que la cita lleva fecha y, pasados tres meses, vuelve a ser hipótesis hasta que alguien la reverifique.

Esa caducidad no es teórica: el blueprint se modificó el 09 de marzo y nadie se enteró en seis meses.

**d) Engram y `config.yaml`** con las decisiones nuevas: objetivo de independencia, épicas 1G y 1H, n8n como transporte, y los tres hallazgos del inventario.

---

## 3 · Lo que va al plan (R02) y al viernes, no a una sesión

Las épicas **1G Repatriación** y **1H Correo propio**, las tres salidas de calendario, y las preguntas que abrió el inventario: qué se usa de las cinco extensiones instaladas, si hay una regla de reenvío en Workspace, y si la copia de seguridad nativa de Zoho sirve para 1G-02.

**Con una noticia buena que conviene decir el viernes:** el inventario encogió el trabajo. No hay correo entrante que replicar, no hay macros, hay un solo flujo activo y un solo SLA propio. La frase «replicar toda la funcionalidad de Zoho Desk» sonaba a mucho y ha resultado ser tres blueprints, una función y una regla.

---

## 4 · Cómo llega todo esto al revisor de Antigravity

Es la parte que conviene no dejar implícita, porque hay dos agentes y **sólo uno de los canales es fiable entre ambos.**

| Canal | ¿Lo ven los dos? |
|---|---|
| **El repositorio** (`docs/sdd/`, `CLAUDE.md`, `openspec/`) | **Sí.** Es el canal fiable, y todo lo de estos dos días ya está commiteado ahí |
| **Engram** | Sólo si ambos corren en la misma máquina contra el mismo `~/.engram/engram.db`. Si Antigravity corre en otro sitio, **el revisor no ve nada de lo que el CLI guarde** |
| **El chat de cada sesión** | No. Lo que pego en el CLI no lo ve el revisor |

De ahí una consecuencia práctica: **lo que pegue en el CLI sobre C11 hay que pegárselo también al revisor**, o el revisor validará la implementación contra la premisa vieja y la dará por buena. Un revisor que no comparte contexto con el constructor no revisa: ratifica.

Y merece la pena comprobar si los dos comparten Engram. Si no lo comparten, el revisor debería arrancar cada sesión leyendo `CLAUDE.md` y el `proposal.md` de la tanda que revisa —eso sí está en el repo— en lugar de fiarse de su memoria.

---

## 5 · Resumen operativo

| Cuándo | Qué |
|---|---|
| **Ahora, al CLI y al revisor** | La corrección de premisa de C11 (§1) |
| **Tú, hoy, dos minutos** | Leer `nivel 1` en Setup → Automatización → SLA |
| **Al cerrar F1A-02** | Anexo D con la discrepancia 31/34 · regla 14 · convención de citas externas · Engram y `config.yaml` |
| **Antes del viernes** | Las tres medidas del plan de independencia, ya reducidas a dos: adjuntos y extensiones. La del correo está respondida |
| **El viernes** | Épicas 1G y 1H, elección de calendario, y las preguntas del inventario |
