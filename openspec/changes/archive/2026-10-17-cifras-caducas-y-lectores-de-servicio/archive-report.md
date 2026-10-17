# Informe de archivo — `cifras-caducas-y-lectores-de-servicio` (F1B-09, `cierra: no`)

**Cobertura de la fila:** de F1B-09 cubre E-228 y la parte construible de E-227 (los dos lectores del catálogo de
servicio, anotados y vigilados); deja fuera el repaso de cierre de la épica 1B, E-222, E-223, E-224, E-226, el texto de
E-230 para el maestro y lo que es de Supervisión.

## 1. Lo que se archiva

| Commit | Qué |
|---|---|
| `464dea8`, `b68f9ac` | Planificación: propuesta con la clasificación de E-223 a E-230, delta de RQ-TZ-01, diseño y tareas |
| `87ea391` | Apply: `packages/shared/src/comentariosVigilados.test.ts` (nuevo, 92 líneas) y sustituciones en sitio |
| `00af3a4` | Verify PASS (0 críticos, 2 avisos, 2 sugerencias); W-1 corregido en sitio en el mismo commit |
| `6c5bcd5` | Barrido de citas: la tabla §7.3 de `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` anclada en `3187e42` (caso C) |
| este commit | Fusión del delta en `openspec/specs/trazas/spec.md` y mudanza de la carpeta |

## 2. Fusión del delta

Un solo requisito, `MODIFIED`: RQ-TZ-01 (`openspec/specs/trazas/spec.md:38-55`). Fusionado por script: el bloque vivo es
idéntico, línea a línea, al del delta (18 líneas, con la cabecera en el estilo de la spec viva). La spec conserva sus
823 líneas; el diff son 3 inserciones y 3 borrados en `:51-53`. Ninguna cita a la spec se desplaza.

**Parte revisable, medida antes de aplicar:** 6 líneas de fusión más este informe; por debajo de 800.

## 3. Estado al cerrar

- Códigos en `6c5bcd5`, en una cadena: `npm test` 0 (282 ficheros, 4.769 pruebas pasan, 11 omitidas), `npm run typecheck` 0,
  `npm run lint` 0 (0 errores, 165 avisos, igual que la partida), detector de citas `--sha HEAD` 0.
- Ninguna línea insertada ni borrada en un fichero existente: `wc -l` igual en `3187e42` y en `6c5bcd5` para los once
  ficheros tocados (verify §2 para diez; la auditoría, 358 antes y después).
- Mutaciones del guardián reproducidas por el apply (tres) y por el verify (seis), todas en rojo y restauradas.

## 4. Lo que queda fuera, anotado

- **E-227, sin cambio:** `periodosDeBodegaje` (llamador interno, `packages/shared/src/bodegaje.ts:209`) y `diasDeBodegaje`,
  destino F1C-06; `puedeLiberarSinFactura`, sin destino; `puedeCrearOVIGarantia` ya tenía llamadores (`d6a2957`, `42b5f20`).
- **E-228, caso B:** las tablas fechadas con «34» («Verificado en esta tanda», filas M-x, citas en `fd253aa`) no se renumeran.
- **Supuesto S-1** (quitar la cifra de `packages/shared/src/transitions.ts:67`): a la lista semanal de supuestos.
- **Tareas de personas** (`tasks.md`): P-1 textos para Supervisión, P-2 revisión de S-1, P-3 decisiones de E-223, E-224 y
  E-226. Archivar no las da por hechas.
