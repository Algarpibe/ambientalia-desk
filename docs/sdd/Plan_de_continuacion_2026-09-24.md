# Plan de continuación · 2026-09-24

**Estado medido:** `main` = `origin/main` = `be78ef9`. Avance **9/56** con el denominador nuevo de la R01.2 (era 9/52). Corte: **lunes 14/12/2026**, plan B 21/12.

---

## i · Las tres próximas tandas, en orden

### 1. **F1B-12 · Calendario laboral** (S, capacidad `kpis`)

**Por qué va primera:** es dependencia dura de todo lo que cuenta tiempo, y hay dos decisiones cerradas esperándola. `decision/anexo-3-alerta` fija la alerta en **4 días hábiles** y `decision/c7-reloj-sla` para el reloj según de quién sea la demora — y sin calendario no existe «día hábil» que contar. La propia decisión dice que se construye **antes de cualquier alarma** (`config.yaml:2465-2480`). Construir una alarma antes que ella sería construirla sobre una noción que no existe.

### 2. **F1F-05 · Continuidad de los indicadores** (S–M, capacidad `kpis`)

**Por qué va segunda y no en su épica:** su criterio de aceptación exige **cuatro semanas de medición en paralelo antes del corte, del 16/11 (S47) al 14/12** (`config.yaml:2574`). Si empieza cuando le toca por épica (S50), no hay cuatro semanas: hay dos. Es la única tanda del plan cuya fecha de inicio está fijada por su propio criterio de aceptación y no por su posición. Depende de F1B-12 para el tiempo de servicio.

### 3. **F0-06 · Vigilancias del repaso automático** (S, misma semana que F1B-12)

**Por qué va tercera y no F1B-06:** porque el criterio del 24/09 ya resolvió la duda que tenía F1B-06. Esa tanda era a la vez la que desbloquea F1A-03 y la primera candidata a recorte, y **el criterio la deja entera** —Zoho tiene hoy los cuatro grafos, así que sus dos ramas son «lo que hoy hace Zoho»—. Deja de ser decisión y pasa a ser S43 en el calendario.

F0-06 sube al tercer puesto porque es **S, está decidida con ID y talla por Gerencia**, y cierra el agujero de la regla R-5: hoy la regla dice que el barrido lista los commits que ninguna ficha reclama, y **ese barrido no existe** (E-060). Una regla que no se comprueba no es una regla.

> **F1B-06 sigue siendo importante y va en S43**, donde desbloquea **F1A-03** —parada desde que su gate P38 se cerró el 23/09— y **F1B-09**, que no puede auditar flujos que no existen.

---

## ii · Decisiones abiertas que bloquean algo

> **Actualizado con el criterio de Gerencia del 24/09.** El calendario ya está cuadrado y el recorte elegido: **1D y 1E enteras pasan a enero–febrero de 2027**; el 21/12 queda como reserva, no como plan. Lo que sigue abierto es otra cosa.

| Qué | Quién decide | Qué bloquea |
|---|---|---|
| **⚠️ Correo propio — respuesta al cliente sin Zoho** | Gerencia | **Es CONDICIÓN del examen del 9/12** (`config.yaml:2170`) y **no tiene fila**. La decisión n8n vs Gmail API vive en un fichero **sin trackear**. Sin fila no hay semana, y sin semana no hay examen que pasar |
| **⚠️ Repatriación del histórico** | Gerencia | **Es CONDICIÓN del examen del 9/12** y **no tiene fila ni decisión**: la palabra no aparece ni en `config.yaml` ni en `ENTRADA.md`, sólo en tres ficheros sin trackear |
| **⚠️ Encuesta de satisfacción** | Gerencia | Entra en el criterio junto a los indicadores, pero `config.yaml:2457` la declara «alcance que la pregunta no contenía» y `:2565` dice que es **pieza sin fila hoy**. Cruza con el correo propio |
| **P44 · escritura contra Zoho** | Gerencia | La mitad de **paridad Zoho** de F1B-08. Decidido «no por ahora», así que esa mitad no se puede construir |
| **`equipo-nuevo-alta-en-ticket`** | Gerencia | Destino *propuesto* F1B-06, no escrito (`ENTRADA.md:1089`). Sin decisión no entra en ninguna fila |
| **`edicion-datos-comerciales-equipo`** | Gerencia | **Sin destino.** Es además decisión de permiso (`ENTRADA.md:1097`) |
| **`mapa-en-la-app`** | Gerencia | **Sin destino.** F1A-06 está archivada y F1B-09 es auditoría: ninguna fila viva lo contiene (`ENTRADA.md:1105`) |

**Y cuatro incumplimientos vivos**, dos ya con destino escrito y dos sin él: **IV-8** e **IV-11** → F1B-11; **IV-9** (color de esperas) e **IV-12** (orden de precedencia en el alta de remisión) siguen **sin destino asignado**, a propósito.

---

## iii · Tareas de persona, con fecha

Ninguna la da por hecha archivar nada (regla del ciclo 1).

| Tarea | Dueño | Fecha |
|---|---|---|
| **Los tres recuentos contra producción** (histórico C1, liberaciones sin factura y el tercero) | Alfonso | **viernes 25/09/2026** — decidido en `decision/p64b-quien-ejecuta` (`config.yaml:2548-2563`). Claude Code prepara antes **un único fichero con las consultas** |
| **Carga retroactiva de los seis campos comerciales** del parque ya sembrado | Comercial | **sin fecha.** Declarada al archivar F1B-02: los campos nacen opcionales y se rellenan cuando el equipo pasa por servicio |
| **Las dos comprobaciones de persona de RQ-HV-07** (hoja de vida con los seis campos vacíos y poblados) | Comercial / Gerencia | **sin fecha.** Fuera de la red de pruebas por F0-00; archivar F1B-02 **no las dio por hechas** |
| **Remedición de IV-11 en producción** | Gerencia | cae en **F1F-03**, que no es destino sino dónde volvería a verse. La medición del 16/09 fue divergencia 0 sobre población 1 |

---

## Lo que no he hecho, y por qué

- **No he creado filas para `equipo-nuevo-alta-en-ticket`, `edicion-datos-comerciales-equipo` ni `mapa-en-la-app`.** Están en la bandeja y no en `decisiones_de_gerencia`, y `CLAUDE.md` dice que *«una decisión que sólo esté en la bandeja no ha llegado: trátala como pendiente y dilo»*. Escribirles fila sería inventar destino.
- **No he elegido qué se recorta.** Hay cuatro salidas enumeradas en §D.5 de la R01.2 y el criterio que falta —llegar al 14/12 con menos, o mover a 21/12 con todo— es de Gerencia.
- **No he commiteado la R01.2**, como pediste.
