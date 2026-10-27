# Delta para transitions-soporte-remoto — el área de las cuatro, de supuesto a decisión (F1B-09, `cierra: no`)

Construye la consecuencia (3) de `decision/e090-areas-soporte-remoto` (Gerencia, 2026-10-25) con los supuestos S-A a S-G de
`proposal.md`. **No cambia comportamiento:** el catálogo ya declara las cuatro de trabajo como `Servicio Técnico`
(`packages/shared/src/transitions.ts:389-395`). Los dos escenarios de RQ-SR-02 ya están en verde (caracterización); bajo
`strict_tdd` la prueba de que la spec se impone es la mutación M1/M2 de `design.md`, no un rojo previo.

**Nota de fusión.** Un bloque `## MODIFIED Requirements` (RQ-SR-02) que sustituye **entero** al vivo del mismo ID, con sus
**17 líneas**: cambian la cabecera y el párrafo; la línea en blanco y los dos escenarios son copia literal del vivo. Y dos
ediciones en sitio fuera de bloques de requisito (§0 y título del §2), con su texto viejo exacto, que el script de fusión
comprueba antes de sustituir. Nada mueve ninguna línea de la spec viva.

## MODIFIED Requirements

### Requirement: RQ-SR-02 · Área Servicio Técnico por decisión de Gerencia

La fuente de diseño no da el área de las cuatro transiciones (`ÁREA_RESPONSABLE` vacía en las cuatro
filas de la hoja, §0; M1.5 tampoco). El sistema **SHALL** declarar las cuatro de trabajo como área `Servicio Técnico`,
**por decisión de Gerencia** (`decision/e090-areas-soporte-remoto`, 2026-10-25), ya no por equivalencia: un dato
por transición. **S-1 queda cerrado**: la duda de si `Asignación` era de Comercial la resolvió esa decisión.
`Anulación` es de área `Comercial` por decisión (`decision/f1c01-area-anulado`), no por equivalencia (RQ-SR-13). (Previously, hasta F1C-01: el catálogo eran sólo las cuatro. Hasta F1B-09, `areas-soporte-remoto`: área por equivalencia con el grafo de servicio y con `transitions-equipo-nuevo` RQ-EN-02, supuesto reversible S-1.)

#### Scenario: Las cuatro exigen el área Servicio Técnico
- GIVEN un usuario cuya única área es `Comercial` y un ticket `Soporte remoto` en `Solicitud Soporte`
- WHEN intenta ejecutar `Asignación`
- THEN el servidor responde `403`; y lo mismo con las otras tres desde su estado de origen

#### Scenario: Un usuario de Servicio Técnico las ejecuta
- GIVEN un usuario de `Servicio Técnico` y un ticket `Soporte remoto` en `Solicitud Soporte`
- WHEN ejecuta `Asignación`
- THEN responde `200` y el ticket pasa a `En Proceso`

## Ediciones en sitio fuera de bloques de requisito (no normativas)

Cada una conserva su número de líneas. El «Antes» es el texto de la spec viva en `094196b9`.

### `openspec/specs/transitions-soporte-remoto/spec.md:21-22` en `094196b9` · §0, la hoja de mapeo

Antes:
```text
- **La columna `ÁREA_RESPONSABLE` está VACÍA en las cuatro filas.** Por eso el área es un supuesto (S-1,
  RQ-SR-02) y no un dato: la fuente de diseño demostrablemente no la da, y M1.5 tampoco.
```

Después:
```text
- **La columna `ÁREA_RESPONSABLE` está VACÍA en las cuatro filas.** Por eso el área fue un supuesto (S-1)
  hasta que la decidió Gerencia el 2026-10-25 (`decision/e090-areas-soporte-remoto`, RQ-SR-02): la hoja no la da, y M1.5 tampoco.
```

### `openspec/specs/transitions-soporte-remoto/spec.md:76` en `094196b9` · título del §2

Antes:
```text
## 2 · Área de las cuatro — supuesto S-1
```

Después:
```text
## 2 · Área de las cuatro — decisión de Gerencia (S-1 cerrado)
```
