<!--
  GENERADO por `npm run generar-mapa-blueprint` (`scripts/generar-mapa-blueprint.ts`) a partir de
  `TRANSITIONS_EQUIPO_NUEVO` de `transitions.ts`, a través de `CATALOGO_POR_FLUJO` de `flujos.ts`. NO EDITAR A MANO: la prueba anti-desfase
  (`mapaBlueprint.test.ts`, RQ-MB-06) lo detecta.
-->

# Mapa del Blueprint de Equipo nuevo — diagrama completo

```mermaid
stateDiagram-v2
    state "Ingresado" as e01
    state "En Proceso" as e02
    state "Notificado" as e03
    state "Verificación" as e04
    state "Finalizado" as e05
    e01 --> e02 : Ingreso equipo nuevo [ST]
    e02 --> e03 : Producto no conforme [ST]
    e03 --> e01 : Análisis y acciones [ST]
    e02 --> e04 : Verificación [ST]
    e02 --> e05 : Liberación [ST]
    e04 --> e05 : Liberación [ST]
    e04 --> e03 : Rechazo de verificación [ST]
```

## Leyenda de áreas

- **[C]** — Comercial
- **[ST]** — Servicio Técnico
- **[CO]** — Compras

Una transición de área compartida (p. ej. `Comercial / Compras`) lleva las dos marcas, una por
cada área que interviene.
