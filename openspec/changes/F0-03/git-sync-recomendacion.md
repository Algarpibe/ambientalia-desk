# F0-03 · Git Sync de Engram — evaluación y recomendación

**Veredicto: NO configurarlo hoy.** Esta tanda entrega una recomendación con su porqué, no una
instalación. Instalarlo mueve datos del proyecto entre equipos, y eso es decisión de Gerencia bajo la
regla de secretos de `CLAUDE.md`.

El plan R01.1 lo encarga como «evaluar Git Sync» (`:125`). Esto es la evaluación.

---

## 1 · Qué es exactamente

No es una función de sincronización con un servidor: es **exportar la memoria a ficheros dentro del
repositorio y dejar que git los transporte**. Lo dice la propia ayuda de la herramienta
(`engram --help`, v1.20.0):

```
sync   Export new memories as compressed chunk to .engram/
         --import   Import new chunks from .engram/ into local DB
         --status   Show sync status
         --project  Filter export to a specific project
         --all      Export ALL projects (ignore directory-based filter)
         --cloud    Run sync against configured cloud endpoint
```

Es decir: `engram sync` escribe un **chunk comprimido** en `.engram/`, el repositorio lo versiona, y
en el otro equipo `engram sync --import` lo mete en su base local.

## 2 · El estado hoy, verificado

| Qué | Comando | Resultado |
|---|---|---|
| Chunks generados | `engram sync --status` | `Local chunks: 0 · Remote chunks: 0 · Pending import: 0` |
| Carpeta en el repositorio | `ls -a` sobre la raíz | **No existe** `.engram/` |
| Exclusión declarada | `grep -n engram .gitignore` | **Sin coincidencias** — no está ni activado ni excluido |
| Endpoint remoto | `engram cloud status` | `not configured` |
| Dónde vive la memoria | `ls -a ~/.engram/` | `engram.db`, `engram.db-wal`, `engram.db-shm`, `protocol-mode.json`. **No hay `.git`** |

**Está sin configurar y sin decidir.** No es un ajuste roto: es una decisión que nadie ha tomado.

## 3 · El problema que sí resolvería

Es real y conviene no minimizarlo: **la memoria es un fichero local de un solo equipo**. Si ese equipo
se pierde, se pierde el trabajo de F0-00, F0-02 y F0-03 —las 96 observaciones del proyecto—, y con
ellas la carga de esta tanda. No hay copia.

## 4 · Los tres motivos para no hacerlo hoy

**① La base es de once proyectos, no de uno.** `engram projects list` da 329 observaciones repartidas
en once proyectos, de las que **96 son de `ambientalia-desk`**: el 71 % del contenido es de otros
—`ambientalia-web-k`, `kbi-app`, `ambientalia-portal`, `st-wiki`, `salestracker-pro`…—. Un `sync`
mal acotado (`--all`, o el filtro por directorio fallando) mete material de otros clientes en este
repositorio. El flag `--project` existe, pero el modo por defecto depende del directorio, no de una
declaración explícita.

**② Un chunk comprimido no se revisa por diff.** La ayuda lo dice: *compressed chunk*. Un fichero
binario en git es un canal que **no se puede leer línea a línea antes de empujarlo**. Y la regla de
secretos del proyecto nació precisamente de un canal no revisable: quince credenciales se filtraron
por chats y capturas (`debt.md:31`, `debt.md:840`). Añadir un segundo canal opaco antes de tener la
disciplina escrita de qué entra en una observación es repetir el patrón, no corregirlo.

**③ Hoy no hay quien lo importe.** El equipo trabaja este repositorio desde un solo equipo. Un
mecanismo de sincronización sin segundo extremo es coste de mantenimiento sin beneficio: lo que hace
falta es **copia de seguridad**, y sincronizar no es lo mismo que respaldar.

## 5 · Las tres condiciones, si Gerencia decide activarlo

1. **Siempre `--project ambientalia-desk`, nunca `--all`**, y escrito en `DEPLOY.md` junto a lo que se
   rompe si se pone mal — el mismo trato que la regla de secretos da a cualquier interruptor.
2. **Una regla previa de qué NO entra en una observación**: ni credenciales, ni cadenas de conexión,
   ni volcados de `.env`. Escrita antes de activar nada, porque después el chunk ya viajó.
3. **`.engram/` declarado en `.gitattributes` como `-diff -merge`**, igual que se hizo con el
   artefacto de 3.370.299 bytes (`openspec/config.yaml`, `repo_state`): un binario versionado que
   git no intente fusionar.

## 6 · La alternativa mientras tanto, que sí resuelve el riesgo real

El riesgo del §3 es **pérdida**, no falta de sincronía. Se cubre con una copia, no con un mecanismo:

```
engram export <destino>.json
```

Un JSON legible, revisable y restaurable con `engram import`. Con dos cautelas verificadas:

- **`export` no tiene filtro por proyecto.** Se comprobó en esta tanda: la orden exportó las 329
  observaciones de los once proyectos, 1,24 MB. Hay que filtrarlo a mano antes de guardarlo en
  ningún sitio compartido.
- **No va al repositorio.** Guardarlo donde Gerencia guarde las copias del proyecto, fuera de git,
  hasta que exista la regla de qué entra en una observación.

## 7 · Lo que esta tanda NO hizo

- No ejecutó `engram sync` ni creó `.engram/`.
- No tocó `.gitignore` ni `.gitattributes`.
- No configuró `engram cloud`.
- No guardó ninguna copia de la memoria fuera del equipo: el `engram export` que se usó para verificar
  los recuentos se escribió en el directorio temporal de la sesión y no se versiona.
