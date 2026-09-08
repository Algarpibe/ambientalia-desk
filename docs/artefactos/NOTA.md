# `docs/artefactos/` — nota sobre `blueprintserviciotecnico.html`

| Dato | Valor |
|---|---|
| Fichero | `docs/artefactos/blueprintserviciotecnico.html` |
| Título interno | «Blueprint de Servicio Técnico — mapa de transiciones» |
| Tamaño | 3.370.299 bytes |
| Líneas | 4.432 (la última sin salto final) |
| Generado el | 2026-08-21 |
| Generador | **No existe en el repositorio** (ver §3) |
| Atributos git | `-diff -merge` (ver §5) |

---

## 1 · Qué es

El **mapa visual de las transiciones del flujo de servicio técnico**: diagrama completo,
leyenda por área y fichas de los hallazgos. Es la fuente gráfica de §M1.3 del documento
maestro, que lo cita por su título interno en
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md:4272`.

## 2 · Es texto plano, no un contenedor de imágenes

Los 3,2 MB **no son imágenes embebidas**. El fichero contiene sólo **cinco** ocurrencias de
`data:image`, que suman **2.408 bytes (2,3 KB)**: un `svg+xml` inline, un fragmento de
cadena y tres PNG minúsculos en base64. El peso es marcado y datos.

Consecuencia práctica: **comprime muy bien**. Como blob comprimido ocupa unos **898 KiB**
(919.501 bytes con `gzip -9`; 923.043 con el nivel 6 que git usa por omisión). No es un
binario de 3 MB en el historial: es un blob de menos de 1 MB por revisión.

## 3 · NO HAY GENERADOR EN EL REPOSITORIO

Verificado el 2026-09-08 sobre el commit `a3a8f03`: **cero referencias** a
`blueprintserviciotecnico` en `apps/`, `packages/`, `scripts/` y `package.json`.

```
grep -rn "blueprintserviciotecnico" apps packages scripts package.json   # 0 resultados
```

(Las coincidencias de la palabra suelta «blueprint» en el código son otra cosa: se refieren
al *blueprint de Zoho Desk* como concepto de dominio — `historyMap.ts`, `Sidebar.tsx` —, no
a este fichero.)

Lo produjo **una conversación de agente en agosto de 2026**. No quedó script, ni plantilla,
ni entrada de `package.json`. **Hoy no existe forma de reproducirlo.**

## 4 · Cambio de alcance: F1A-05 y F1B-09 CONSTRUYEN el generador, no lo invocan

El plan `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:388` dice que este fichero
«se regenera en cada tanda `audit-*`», y sus filas `:142` (F1A-05, `audit-F1A`) y `:158`
(F1B-09, `audit-F1B`) heredan esa premisa. `F0-00_Baseline_as-built.md:564` la repite:
«para que … no se regenere sobre una cifra incorrecta».

**Es falso.** No se puede regenerar lo que no tiene generador. Las dos tandas tienen que
**CONSTRUIR el generador**, no invocarlo; y eso es trabajo de otra talla y otro alcance.

Es la misma clase de premisa falsa del baseline que ya se corrigió en **F0-04** («F0-04 no
crea la red de pruebas: la mide y la completa donde falta» — `openspec/changes/F0-04/proposal.md:18`).
La corrección queda registrada en `openspec/config.yaml`.

## 5 · Por qué se versiona pese al tamaño

Porque no hay generador. «Ignorarlo y regenerarlo cuando haga falta» **equivalía a
borrarlo**: sin generador no hay regeneración posible, y es el **único mapa visual del flujo
que existe**.

El coste se acota con `.gitattributes` en la raíz, que lo marca **`-diff -merge`**:

- `-diff` — cada revisión del fichero dejaría 4.432 líneas ilegibles en el diff, con líneas
  de hasta **324.772 caracteres** (59 superan los 10.000). Con `-diff`, el diff dice sólo
  que el binario cambió.
- `-merge` — un conflicto sobre una línea de ~300 KB no se resuelve a mano. Y hay **dos
  sesiones trabajando sobre este repositorio**, así que el conflicto no es hipotético: con
  `-merge`, git pide elegir una versión entera en vez de fabricar marcas de conflicto
  inservibles.

## 6 · Cómo actualizarlo hoy

No hay procedimiento automático. Hasta que F1A-05 construya el generador, la única vía es
producir un fichero nuevo y sustituir éste entero. Si eso ocurre, actualizar en esta nota:
tamaño, número de líneas y fecha de generación.
