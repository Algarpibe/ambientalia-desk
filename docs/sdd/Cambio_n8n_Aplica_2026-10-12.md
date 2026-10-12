# Cambio en n8n: el rótulo «Aplica» pasa a venir ya decidido por la aplicación

Para quien edita el flujo de n8n y no programa. Frases cortas, pasos numerados. Cambio `aplica-resuelto-hacia-n8n` (F1B-04).

> **De dónde sale cada dato.** El «código actual» del punto 4 es el **texto literal del nodo**, leído por el analista en «Verifica Incluye Entrada» el 2026-10-12, en sólo lectura. Una versión anterior de este documento traía cuatro líneas que eran un resumen del analista, no el texto del nodo: quedan sustituidas. Lo que hace el nodo anterior también lo leyó el analista. La sesión que escribe este documento **no abrió n8n** y no comprobó ninguna de las dos cosas. Por eso el punto 3 empieza comparando.

## 1. Qué cambia y por qué

1. Hoy el nodo «Verifica Incluye Entrada» pone «Aplica: Sí» solo si la lista «Incluye» trae algo.
2. Por eso una remisión con una novedad real y sin accesorios sale con «Aplica: No». Es incoherente.
3. Desde ahora la aplicación manda el dato ya decidido, en un campo llamado `aplica` (verdadero o falso). El nodo lo usa tal cual. Si no llega, el nodo hace lo de siempre.

## 2. Dónde

1. Flujo: `Remisiones_ST_3.13_Desk`.
2. Nodo: «Verifica Incluye Entrada».
3. El flujo `Remisiones_ST_3.13` (el antiguo, el de producción de siempre) **no se toca**.

## 3. Comprobaciones ANTES de pegar

1. **El código del nodo coincide con el «código actual» del punto 4.** Abre el nodo y compáralo con el punto 4, que es su texto literal, comentarios incluidos. Da igual que cambien espacios o saltos de línea. Si cambia otra cosa, **NO pegues nada** y avisa: el cambio se diseñó sobre otro código.
2. **Guarda una copia propia.** Antes de borrar nada, copia lo que hoy tiene el nodo a un bloc de notas. Esa es la copia buena para volver atrás.
3. **El dato llega al nodo.** Abre una ejecución de prueba y mira la salida del nodo «Remision-Entrada-Salida». Junto a `Incluye` deberían aparecer los demás campos con minúscula (`remisionId`, `observaciones`). Si están, `aplica` llegará igual. Si no están, anota dónde quedan y avisa; no pegues.
4. **«Validar payload» no rechaza campos de más.** Si rechaza campos que no conoce, avisa antes de publicar la aplicación.

## 4. Código actual (texto literal del nodo, leído por el analista el 2026-10-12; compáralo con el nodo)

```js
// Verifica si el campo "Incluye" existe y es un array
// El Incluye ya no viene del formulario por marca (eliminado): lo manda la app en el webhook.
const _src = $('Remision-Entrada-Salida').first().json.Incluye;
const incluye = Array.isArray(_src) ? _src : [];

// Filtra valores no vacíos (ni undefined, ni null, ni string vacío)
const tieneValor = incluye.some(v => v && v.toString().trim() !== "");

// Devuelve "Sí" si hay al menos un valor, "No" si todos están vacíos
return [
  {
    json: {
      resultado: tieneValor ? "Sí" : "No"
    }
  }
];
```

## 5. Código nuevo (copiar y pegar completo)

```js
// «Aplica»: si la aplicación manda el dato ya resuelto (true o false), se usa tal cual.
// Si no llega, o no es true/false, vale la regla anterior: «Sí» sólo si «Incluye» trae algún valor.
const _e = $('Remision-Entrada-Salida').first().json;
const _candidatos = [_e.aplica, _e.Aplica, _e.body ? _e.body.aplica : undefined];
const _resuelto = _candidatos.find(v => typeof v === "boolean");
const _src = _e.Incluye;
const incluye = Array.isArray(_src) ? _src : [];
const tieneValor = incluye.some(v => v && v.toString().trim() !== "");
const aplica = typeof _resuelto === "boolean" ? _resuelto : tieneValor;
return [{ json: { resultado: aplica ? "Sí" : "No" } }];
```

La salida conserva su forma (`resultado`, «Sí» o «No»). Los nodos que la usan no cambian.

## 6. Cómo probarlo

Después de pegar y publicar, manda tres remisiones de prueba. En cada una mira el correo y el documento.

1. Con una novedad real (por ejemplo un rayón) y **sin accesorios**: debe decir **«Aplica: Sí»**.
2. Con **«Sin novedad»** y sin accesorios, sin marcar ninguna casilla: debe decir **«Aplica: No»**.
3. Con **accesorios** marcados en «Incluye»: debe decir **«Aplica: Sí»**.

Si alguna sale distinta, vuelve atrás (punto 7) y avisa.

## 7. Cómo volver atrás

1. Abre el nodo «Verifica Incluye Entrada».
2. Pega el código que guardaste en el punto 3, paso 2 (en su defecto, el del punto 4 si coincidía).
3. Publica. Todo vuelve a la regla de antes.

## 8. Orden de publicación

1. Publicar solo un lado **no rompe nada**. Es compatible hacia atrás.
2. Solo la aplicación nueva: manda un campo de más y el flujo lo ignora. Todo sigue como hoy.
3. Solo el nodo nuevo: no llega `aplica` y el nodo aplica la regla de antes. Todo sigue como hoy.
4. Se recomienda publicar los dos a la vez, para que la corrección se vea desde la primera remisión.
