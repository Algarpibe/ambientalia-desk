<!--
  GENERADO por `npm run generar-mapa-blueprint` (`scripts/generar-mapa-blueprint.ts`) a partir de
  `transitions.ts`, `estados.ts` y `fasesBlueprint.ts`. NO EDITAR A MANO: la prueba anti-desfase
  (`mapaBlueprint.test.ts`, RQ-MB-06) lo detecta.
-->

# Mapa del Blueprint de Servicio Técnico — fase «Entrada y remisión»

```mermaid
stateDiagram-v2
    state "Remisión creada" as e11
    state "Ingresado" as e12
    state "Rev./Diagnostico →diagnostico" as e13
    state "OV asignada" as e19
    state "Ticket creado" as e20
    e19 --> e12 : Habilitar Servicio [C]
    e20 --> e12 : Habilitar Servicio [C]
    e11 --> e12 : Habilitar Servicio [C]
    e12 --> e13 : Ingreso a Servicio [frontera] [ST]
    e20 --> e11 : Remisión creada (sin botón) [ST]
    e11 --> e20 : Remisión anulada (sin botón) [ST]
```
