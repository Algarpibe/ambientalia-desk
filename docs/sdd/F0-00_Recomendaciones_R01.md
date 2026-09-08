# F0-00 · Recomendaciones técnicas sobre las diez preguntas de la auditoría — R01

**Fecha:** 08/09/2026 · **Origen:** §9 de `docs/sdd/F0-00_Baseline_as-built.md` (commit `0e8f581`)
**Estado:** Propuesta de respuesta — PENDIENTE de decisión de Gerencia. Ninguna de las diez preguntas ha sido respondida todavía; lo que sigue son recomendaciones técnicas del agente, no decisiones tomadas.
**Efecto (sólo si Gerencia las aprueba):** desbloquearía F0-01, fijaría el alcance de F0-04 y añadiría una capacidad a §2.3 del plan

---

## Cómo se ordenan estas diez

No son diez decisiones del mismo tipo, y conviene no tratarlas igual:

| Tipo | Preguntas | Cómo se resuelven |
|---|---|---|
| **Corrección factual** — el código ya dio la respuesta, sólo falta ratificarla | 2 | Se propone ratificarla y anotarla. Sin coste ni riesgo |
| **Decisión técnica de Gerencia** — no necesita a nadie más | 1, 3, 4, 5, 8, 9, 10 | Se recomiendan aquí; las decide Gerencia |
| **Necesita un dato que hoy nadie tiene** | 6, 7 | Se formula la pregunta concreta, a quién y para cuándo |

Y una discrepancia con el cierre del informe: el agente señala la 3 como la que más bloquea. Bloquea el alcance de F0-04, cierto, pero **la que más mueve el plan es la 5**: añadir `catalogo-equipos` como capacidad cambia F0-02 y abarata toda la épica F1D, porque el ancla de parametrización del checklist ya existe en producción.

---

## 1 · Filtro «Tickets en espera» del tablero

**Recomendación: son las dos cosas —defecto de mecanismo y definición de negocio incompleta—, y se separan.**

El mecanismo es defecto sin discusión posible: `boardView.ts:35` clasifica con `/espera/i` sobre el nombre del estado. Eso no es una regla, es una coincidencia ortográfica. Basta renombrar un estado para que la vista cambie sin que nada avise, y hoy ya deja fuera «Solicitado» y «Servicio externo». **Se corrige en F1A** derivando la vista de una lista explícita en `packages/shared`, no de una expresión regular. No requiere decisión de negocio: es la regla invariable 1 aplicada.

La pertenencia sí es de negocio, y la definición correcta no son los cuatro estados canónicos, sino **«el ticket no avanza porque esperamos a alguien»**. Eso incluye además `Notificación cliente`, que es donde el equipo se queda esperando la orden de compra —el dolor nº 2 del documento maestro, el que bloquea la mesa de trabajo durante semanas—. Dejarlo fuera de la vista de esperas es esconder justo el que más duele.

Y conviene distinguir a quién esperamos, porque **C7 necesita exactamente esa distinción** para decidir qué esperas paran el reloj del SLA. Propongo un atributo por estado, no un booleano:

| Estado | Espera | A quién |
|---|---|---|
| `En Espera de Repuestos` | externa | Proveedor |
| `Servicio externo` | externa | Laboratorio externo |
| `Notificación cliente` | externa | Cliente (aprobación / OC) |
| `Solicitado` | interna | Almacén |
| `En espera de SKU inventario` | interna | Comercial |

La vista «Tickets en espera» muestra ambas. **C7 para el reloj sólo en las externas**, que es lo defendible ante el cliente: el reloj se detiene cuando la pelota está en el tejado de otro, no cuando está en el nuestro. Una sola lista, definida una vez, resuelve la vista, C7 y —más adelante— la traducción de estados del portal (C8).

**Para el equipo el viernes:** falta clasificar `Pendiente`. Por el grafo parece una pausa interna del técnico, pero eso lo sabe Servicio Técnico, no el código.

---

## 2 · Corrección factual del maestro (M1.9.1)

**Recomendación: sí, se corrige de diez a ocho.**

El recuento en código es exhaustivo y reproducible; el de febrero era a mano. Cuando el código y el documento discrepan sobre un hecho contable, gana el código. Se corrige M1.9.1 en la próxima revisión del documento maestro y **se anota en el Anexo I** indicando que la corrección procede de la auditoría F0-00, no de una opinión de revisión, para que dentro de tres meses nadie tenga que volver a contarlas.

Sin coste y sin riesgo. La spec `permissions` de F0-02 y la matriz cargo×transición de F1C-05 se escriben ya sobre ocho.

---

## 3 · ¿Entra la interfaz en la red de pruebas?

**Recomendación: no en la Fase 1, y se escribe como decisión explícita. Pero con una condición que la hace segura.**

Instalar `jsdom` + `@testing-library` y cubrir 39 ficheros y 6.329 líneas son semanas que no acercan el 31/12. Y el riesgo real no es «la interfaz sin pruebas»: es **lógica de dominio viviendo en `.tsx` sin pruebas**. Son cosas distintas y sólo la segunda es grave.

El repositorio ya tiene el patrón correcto y no lo ha nombrado: la lógica pura vive en `apps/desk/src/lib/*.ts` y **esos ficheros sí los cubre vitest hoy** (`boardView.test.ts`, `valoresTransicion.test.ts` con 12 tests). Lo que falta no es infraestructura, es una regla. Por eso:

**Regla invariable 13 (nueva):** la lógica de dominio vive en `.ts`; los `.tsx` son presentación. Un `.tsx` que decide algo es un defecto de ubicación, y se corrige bajando la función a `lib/` con su prueba. Con esa regla, la cobertura de la lógica de dominio es automática con el arnés que ya existe, y el problema deja de crecer.

Sobre `TransitionPanel.tsx:57`: la comprobación de permisos en el cliente es una **comodidad** —no enseñar botones que no se pueden pulsar—, nunca la guarda. La guarda es el servidor. Lo que F0-04 tiene que demostrar de forma exhaustiva es la **matriz área × transición completa, las 34, en el servidor**, y eso se puede hacer hoy sin instalar nada. Con esa red puesta, que el `.tsx` no esté cubierto es aceptable: el peor caso es un botón visible de más, y el servidor lo rechaza.

**Se revisa en F2**, cuando llegue la app móvil/tablet (ítem 18) y la interfaz pase a ser la superficie principal del técnico. Ahí un arnés de componentes se paga solo; hoy no.

---

## 4 · Puertas de calidad del CI

**Recomendación: sí a las dos, con criterio de trinquete —nunca peor que hoy—, no de aspiración.**

Un umbral por encima del estado actual falla el primer día y acaba desactivado; un umbral clavado en el estado actual no se puede empeorar y no molesta a nadie.

- **Lint:** `--max-warnings 158` desde ya. Congela, no exige. El número baja de forma oportunista cuando una tanda toca esos ficheros. Pedir cero significa arreglar 157 `any` que nadie ha echado de menos en tres meses.
- **Cobertura:** instalar `@vitest/coverage-v8`, medir y publicar en CI. Umbral sólo sobre `packages/shared` y `apps/desk/server` —el motor—, fijado en lo que salga medido menos un margen pequeño. La interfaz queda excluida por la decisión 3, y eso se escribe en la configuración para que se lea como elección.
- **Y una tercera puerta que vale más que las dos anteriores:** las pruebas de invariantes del grafo (hallazgo e.5). Que el conjunto de estados alcanzables no cambie sin que alguien lo declare, que `Finalizado` siga siendo el único terminal, que ninguna transición apunte a un estado inexistente. Eso es lo que atrapa las regresiones de verdad; un porcentaje de cobertura no.

**Añadido a F0-04:** partir `app.test.ts` (3.010 líneas, 36 de los 40 segundos). Con el ciclo focalizado del motor en 792 ms, `strict_tdd` es cómodo; con la suite entera en 40 s, se acaba saltando.

---

## 5 · ¿Es «catálogo de equipos» una capacidad propia?

**Recomendación: sí. `catalogo-equipos` entra como capacidad en §2.3, y no se absorbe en `hojas-vida`.**

Son entidades distintas y confundirlas costaría caro más adelante. El **catálogo** es el modelo: tipo, marca, modelo, ficha técnica, artículos por modelo, mano de obra por modelo. La **hoja de vida** es el ejemplar concreto: serial, cliente, historial, garantía. Uno describe qué es un EDM 180; la otra, qué le ha pasado al 18A19042.

El argumento decisivo no es taxonómico: **el checklist de F1D-01 se parametriza por marca-modelo**, y esa es exactamente la entidad `modelo` del catálogo. Si el catálogo no es capacidad, la spec de `diagnostico-checklist` no tiene dónde anclar su referencia, y F1D-01 acabaría inventando un maestro de modelos paralelo al que ya está en producción con 26 tipos, 6 marcas, 35 modelos y 354 equipos. Lo mismo vale para F1D-06, que lee artículos por modelo para enseñar sólo los repuestos de la etapa.

Efectos: siete diseños de Superpowers encuentran su sitio en F0-02; `diagnostico-checklist` declara dependencia de `catalogo-equipos`; y F1D se abarata, porque el ancla de parametrización ya existe y está poblada.

---

## 6 · P14 — doble escritura de las remisiones de entrada

**Recomendación provisional: PostgreSQL es el origen del informe desde F1E-01. La hoja de Sheets sigue viva como espejo y se retira en F1F-02. Pero falta un dato antes de fijar la fecha.**

La dirección no está en duda: el acta del 27/08 dice que el aplicativo sustituye carpetas y archivos por captura en base de datos, y M11.1 quiere dejar de usar n8n y Excel. Postgres acaba siendo la fuente única.

Lo que no tiene sentido es romper ahora el flujo de n8n, que funciona y tiene siete ramas en paralelo. Así que: **F1E-01 lee de PostgreSQL, no de la hoja**; n8n sigue escribiendo la hoja hasta que el módulo de respaldo de F1F-02 la sustituya. Nada se rompe entre medias y la doble escritura deja de ser una ambigüedad para pasar a ser un espejo con fecha de caducidad.

**El dato que falta, y es la pregunta real: ¿quién más lee esa hoja hoy?** Si Comercial o Dirección tienen una vista, un filtro o un informe montado encima, retirarla tiene un coste que hay que planificar y que nadie ha contado. Si no la lee nadie más que n8n, se retira sin ceremonia.

**Pregunta para el viernes 11/09 — Gustavo:** ¿alguien consulta `Remision_Data/remisiones_entrada` en Google Sheets, aparte del propio flujo de n8n?

---

## 7 · `fecha_orden_compra_final` y `fecha_orden_venta_final`

**Hallazgo que cambia la pregunta: no son campos inventados por la app. Son campos reales del layout de Zoho Desk.**

Verificado en vivo contra Zoho Desk: existen como `cf_fecha_orden_de_compra_final` y su pareja de venta, con etiquetas «Fecha Orden de Compra Final» y «Fecha Orden de Venta Final», en el layout «Ambientalia Soporte y Servicio Técnico». La app hace lo correcto al replicarlos: espeja el layout entero.

**Por qué no están en el Anexo G:** el Anexo G se reconstruyó desde la exportación de febrero (`docs/analisis-tickets/Tickets.csv`, 640 filas), y esa exportación **no contiene esas dos columnas** —sí las de `Fecha Orden de Compra` y `Fecha Orden De Venta`, con 184 y 185 valores respectivamente—. O se crearon después de esa exportación, o salieron vacías y el export las descartó. No es un fallo de la app ni del diccionario: es un hueco de la fuente con la que se reconstruyó el anexo.

**Hipótesis sobre su semántica, a confirmar:** son la pareja definitiva tras la recotización. El bucle `Pendiente → Continuación del proceso → Notificación re cotización → Notificación Comercial` genera una segunda OC/OV, y estos dos campos serían donde se apunta la definitiva sin pisar la primera. Si es así, **no son campos muertos: son el apaño manual de exactamente el problema que C4 arregla**, y son evidencia de que el proceso necesita registrar dos vueltas. Eso los convierte en insumo de F1C-02, no en candidatos a retirada.

**Recomendación provisional:** no se retiran en F0-02. Se documentan en el Anexo G como campos del layout de Zoho con semántica pendiente de confirmar, se mantienen en el espejo —coste cero, ya se sincronizan— y su destino se decide en F1C-02, al diseñar C4.

**Pregunta para el viernes — Gustavo y Comercial:** ¿qué se apuntaba en «Fecha Orden de Compra Final» y «Fecha Orden de Venta Final»? ¿Es la OC/OV tras recotizar? Y de paso: existe un tercer campo de la misma familia, `cf_fecha_de_actualizacion_de_ov` («Fecha de actualización de OV»), que tampoco está en el Anexo G.

---

## 8 · Rotación de secretos: dueño y fecha

**Recomendación: el dueño soy yo, y el momento es F0-04, no F1F.**

F1F es demasiado tarde por una razón simple: si alguno de esos secretos está expuesto, la ventana de exposición es **ahora**, y de aquí a F1F hay cuatro meses. Y F0-04 es el momento natural porque monta el entorno de staging, que necesita sus propias credenciales de todas formas: ya se va a tocar la superficie de credenciales, se toca entera.

Alcance, una o dos horas: rotar `ZOHO_CLIENT_SECRET`, regenerar los tres refresh tokens (Desk, Books, CRM), cambiar la contraseña de `hub_reader`, y revocar los dos PAT de GitHub sustituyéndolos por tokens de alcance fino limitados a este repositorio.

**Y una comprobación previa que decide la urgencia:** buscar en el historial de git si alguno de esos valores llegó a commitearse alguna vez (`git log -S` sobre los nombres, o un escaneo del historial). Si aparece, la rotación deja de ser higiene y pasa a ser urgente, y hay que asumir que el secreto es público.

Se registra además en el Anexo D, porque hoy no está en ninguna parte y por eso lleva meses sin dueño.

---

## 9 · Dos lectores independientes de Zoho Desk

**Recomendación: se acepta hoy. Se resuelve en F1F por desaparición, no por refactorización.**

Los dos funcionan. El coste es cuota de API, y refactorizar ahora a un lector único es trabajo que se tira a la basura: después de F1F, Zoho Desk queda en solo lectura y acaba apagándose, con lo que uno de los dos lectores desaparece solo.

**Lo único que sí hay que hacer ahora, y es barato:** medir el consumo real de cuota en el panel de Zoho y poner un aviso. Si estamos por debajo de la mitad del límite diario, esto es optimización prematura y se queda como está. Si estamos por encima del 60 %, cambia la respuesta —porque durante la migración de F1F-01 habrá un pico y es justo el peor momento para descubrir que la cuota se agota.

**Una nota para la spec `zoho-sync` de F0-02:** dos lectores son dos definiciones de qué es un ticket. Hoy coinciden; conviene que la spec diga explícitamente que el mapeo es uno solo y compartido, para que no diverjan sin que nadie lo note.

---

## 10 · P44 — política de escritura contra Zoho

**Recomendación: cero escritura contra Zoho en la Fase 1. La regla invariable 6 se mantiene sin excepción.**

La auditoría confirma que hoy no existe ningún código de escritura hacia el CRM. Mantenerlo así cuesta nada; construir la excepción cuesta una tanda y, sobre todo, **introduce un modo de fallo nuevo**: una escritura defectuosa contamina la fuente comercial de verdad, y toda la premisa de Desk 2.0 es que su dato está limpio. No merece la pena para ahorrar unos copiar-pegar.

Para el flujo de cotización de F1D-06: el diagnóstico genera las líneas de cotización **dentro de Desk 2.0**, y Comercial las lleva al CRM a mano o por exportación. En 2026 el volumen lo permite, y de paso deja a una persona en medio de un compromiso comercial, que es coherente con el principio de diseño nº 8 —el cálculo es determinista y la máquina no adquiere compromisos—.

**Se revisa en F2 con un disparador concreto**, no por calendario: cuando el número de cotizaciones por semana convierta el copiado manual en cuello de botella, y cuando el dato de Desk 2.0 lleve un trimestre demostrando estar limpio.

La única escritura existente —el reply de correo, ya gateado— se queda como está: es una comunicación, no una escritura de datos.

---

## Lo que cambia en el plan con estas respuestas

| Cambio | Dónde | Efecto |
|---|---|---|
| `catalogo-equipos` entra como capacidad #15 | §2.3 · F0-02 · F1D-01 · F1D-06 | Siete diseños de Superpowers encuentran destino; F1D se abarata |
| Regla invariable 13: dominio en `.ts`, presentación en `.tsx` | §4.4 · `CLAUDE.md` (F0-01) | Cierra la pregunta 3 sin instalar arnés de React |
| Atributo de espera interna/externa por estado | F1A (nueva tanda pequeña) · C7 · C8 | Una lista resuelve la vista, el reloj del SLA y el portal |
| Matriz área × transición completa (34) en servidor | F0-04 | Alcance concreto; sustituye a «completar pruebas» |
| Trinquete de lint y cobertura + invariantes del grafo | F0-04 · `ci.yml` | Definición de «hecho» de F0-04 |
| Partir `app.test.ts` | F0-04 | `strict_tdd` viable en la práctica, no sólo en teoría |
| Rotación de secretos | F0-04 (no F1F) + Anexo D | Deja de ser un frente sin dueño |
| M1.9.1: diez → ocho | Documento maestro + Anexo I | Corrección factual trazable |
| Postgres como origen del informe; Sheets se retira en F1F-02 | F1E-01 · F1F-02 | Cierra P14 salvo la fecha |
| Los dos campos «Final» se documentan, no se retiran | Anexo G · F1C-02 | Posible evidencia del bucle de recotización |

**Tres preguntas salen de aquí hacia el equipo el viernes 11/09:** quién lee la hoja de Sheets (Gustavo), qué se apuntaba en los campos «Final» (Gustavo y Comercial), y cómo se clasifica el estado `Pendiente` (Servicio Técnico).

---

## Texto para pegar en Claude Code — SÓLO cuando Gerencia haya decidido

```
Respuestas a las diez preguntas de F0-00. Guárdalas en Engram como
decision/* con topic_key estable, incorpóralas al proposal.md de F0-01 y
crea docs/sdd/F0-00_Respuestas_Gerencia.md con este contenido.
(Plantilla: no refleja ninguna decisión tomada.)

1. FILTRO «TICKETS EN ESPERA» — las dos cosas. El mecanismo es defecto:
   la regex sobre el nombre del estado se sustituye por una lista explícita
   en packages/shared (regla invariable 1). Va en F1A. La definición de
   negocio es «el ticket no avanza porque esperamos a alguien» e incluye
   además Notificación cliente. Añade a cada estado un atributo
   espera: null | 'interna' | 'externa':
     externa → En Espera de Repuestos, Servicio externo, Notificación cliente
     interna → Solicitado, En espera de SKU inventario
   La vista muestra ambas; C7 para el reloj del SLA sólo en las externas.
   Pendiente: clasificar el estado «Pendiente», lo confirma Servicio Técnico.

2. M1.9.1 — sí, se corrige de diez a ocho. Gana el código. Se anota en el
   Anexo I como corrección procedente de la auditoría F0-00. Las specs de
   permissions y la matriz de F1C-05 se escriben sobre ocho.

3. INTERFAZ EN PRUEBAS — no en Fase 1, y es decisión explícita, no olvido.
   No se instala jsdom ni testing-library. En su lugar, regla invariable 13:
   la lógica de dominio vive en .ts (que vitest ya cubre) y los .tsx son
   presentación; un .tsx que decide algo es defecto de ubicación y se corrige
   bajando la función a lib/ con su prueba. La comprobación de permisos en
   TransitionPanel.tsx es comodidad, no guarda: lo que F0-04 debe demostrar
   es la matriz área × transición completa (las 34) en el servidor. Se
   revisa en F2 con la app móvil. Escribe la exclusión en vitest.config.ts
   como comentario de decisión.

4. PUERTAS DE CI — sí, con criterio de trinquete, nunca peor que hoy:
   lint con --max-warnings 158 (congela, no exige); instalar
   @vitest/coverage-v8, medir, publicar, y poner umbral sólo sobre
   packages/shared y apps/desk/server en el valor medido menos un margen
   pequeño. Añade una tercera puerta que vale más: pruebas de invariantes
   del grafo (conjunto de estados alcanzables, Finalizado único terminal,
   ninguna transición a estado inexistente). Y parte app.test.ts.

5. CATÁLOGO DE EQUIPOS — sí, capacidad propia: catalogo-equipos, número 15
   de §2.3. Cubre tipo, marca, modelo, ficha técnica, artículos por modelo y
   mano de obra por modelo. hojas-vida sigue siendo el ejemplar concreto
   (serial, cliente, historial, garantía). diagnostico-checklist declara
   dependencia de catalogo-equipos: el checklist se parametriza por
   marca-modelo, que es la entidad modelo del catálogo. Los siete diseños de
   Superpowers de ese dominio van a esta capacidad en F0-02.

6. P14 DOBLE ESCRITURA — dirección decidida, fecha pendiente de un dato.
   F1E-01 lee de PostgreSQL, no de la hoja. n8n sigue escribiendo la hoja
   hasta F1F-02, donde el módulo de respaldo la sustituye. Antes de fijar la
   fecha hay que saber quién más lee Remision_Data/remisiones_entrada además
   de n8n; se pregunta a Gustavo el 11/09. Deja el punto abierto en el
   Anexo D con esa formulación.

7. CAMPOS «FINAL» — no se retiran. Verificado contra Zoho Desk en vivo:
   existen como cf_fecha_orden_de_compra_final y su pareja de venta, en el
   layout «Ambientalia Soporte y Servicio Técnico»; la app hace bien en
   espejarlos. No están en el Anexo G porque la exportación de febrero
   (docs/analisis-tickets/Tickets.csv) no los contiene. Documéntalos en el
   Anexo G como campos del layout con semántica pendiente de confirmar.
   Hipótesis a validar: son la OC/OV definitiva tras recotizar, es decir el
   apaño manual del problema que arregla C4 — llévalos como insumo a F1C-02.
   Existe un tercer campo de la misma familia también ausente del Anexo G:
   cf_fecha_de_actualizacion_de_ov.

8. ROTACIÓN DE SECRETOS — dueño: Alfonso. Momento: F0-04, no F1F, porque
   esa tanda ya monta staging con credenciales propias y porque cuatro meses
   de ventana de exposición es demasiado. Alcance: ZOHO_CLIENT_SECRET, los
   tres refresh tokens (Desk, Books, CRM), la contraseña de hub_reader y los
   dos PAT de GitHub (a tokens de alcance fino sobre este repo). Antes,
   comprobación que decide la urgencia: buscar en el historial de git si
   alguno de esos valores llegó a commitearse. Registra el frente en el
   Anexo D.

9. DOS LECTORES DE ZOHO DESK — se acepta hoy; se resuelve en F1F por
   desaparición, no por refactorización: tras F1F Zoho Desk queda en solo
   lectura y uno de los dos lectores se va solo. Lo único a hacer ahora:
   medir el consumo real de cuota en el panel de Zoho y poner un aviso; si
   supera el 60 % del límite diario, esta respuesta cambia, porque F1F-01
   provocará un pico. En la spec zoho-sync de F0-02, declara explícitamente
   que el mapeo de ticket es uno solo y compartido por ambos lectores.

10. P44 ESCRITURA CONTRA ZOHO — cero escritura en Fase 1; la regla
    invariable 6 se mantiene sin excepción. Construir la excepción cuesta una
    tanda e introduce un modo de fallo que contamina la fuente comercial. En
    F1D-06 las líneas de cotización se generan dentro de Desk 2.0 y Comercial
    las lleva al CRM a mano o por exportación. Se revisa en F2 con disparador
    concreto: cuando el copiado manual sea cuello de botella y el dato lleve
    un trimestre limpio. El reply de correo ya gateado se queda como está.

Con esto, actualiza el proposal.md de F0-01 (añade la regla invariable 13, la
capacidad catalogo-equipos y la rotación de secretos), y prepara F0-04 con el
alcance que sale de las respuestas 3, 4 y 8. No ejecutes todavía: enséñame el
proposal.
```
