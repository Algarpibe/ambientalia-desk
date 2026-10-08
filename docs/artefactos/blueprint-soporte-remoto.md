<!--
  GENERADO por `npm run generar-mapa-blueprint` (`scripts/generar-mapa-blueprint.ts`) a partir de
  `TRANSITIONS_SOPORTE_REMOTO` de `transitions.ts`, a través de `CATALOGO_POR_FLUJO` de `flujos.ts`. NO EDITAR A MANO: la prueba anti-desfase
  (`mapaBlueprint.test.ts`, RQ-MB-06) lo detecta.
-->

# Mapa del Blueprint de Soporte remoto — diagrama completo

```mermaid
stateDiagram-v2
    state "Solicitud Soporte" as e01
    state "En Proceso" as e02
    state "Finalizado" as e03
    state "Pendiente" as e04
    e01 --> e02 : Asignación [ST]
    e02 --> e03 : Ejecutar [ST]
    e02 --> e04 : Soporte pendiente [ST]
    e04 --> e02 : Continuación soporte [ST]
```

## Leyenda de áreas

- **[C]** — Comercial
- **[ST]** — Servicio Técnico
- **[CO]** — Compras

Una transición de área compartida (p. ej. `Comercial / Compras`) lleva las dos marcas, una por
cada área que interviene.
