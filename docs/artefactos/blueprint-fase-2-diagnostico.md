<!--
  GENERADO por `npm run generar-mapa-blueprint` (`scripts/generar-mapa-blueprint.ts`) a partir de
  `transitions.ts`, `estados.ts` y `fasesBlueprint.ts`. NO EDITAR A MANO: la prueba anti-desfase
  (`mapaBlueprint.test.ts`, RQ-MB-06) lo detecta.
-->

# Mapa del Blueprint de Servicio Técnico — fase «Diagnóstico, cotización y ejecución»

```mermaid
stateDiagram-v2
    state "En Espera de Repuestos ·espera·" as e01
    state "Servicio externo ·espera·" as e02
    state "Notificación cliente" as e03
    state "Notificación a Compras" as e06
    state "Notificación Comercial" as e07
    state "En espera de SKU inventario ·espera·" as e08
    state "Solicitado ·espera·" as e09
    state "Ingresado ←entrada" as e12
    state "Rev./Diagnostico" as e13
    state "Notificado" as e14
    state "En Proceso" as e15
    state "Continuación del proceso" as e16
    state "Por Facturar →cierre" as e17
    state "Pendiente" as e21
    e12 --> e13 : Ingreso a Servicio [frontera] [ST]
    e13 --> e14 : Escalado a Revisión [ST]
    e14 --> e13 : Devolución a corrección [ST]
    e01 --> e15 : Llegada de repuestos [C][CO]
    e03 --> e01 : Aprobación y S. Repuestos [C][CO]
    e15 --> e09 : Solicitud repuestos [ST]
    e03 --> e15 : Aprobación [C]
    e09 --> e15 : Entrega de Repuestos [ST]
    e15 --> e21 : Marcar como pendiente [ST]
    e06 --> e01 : Notificación por garantía [C][CO]
    e07 --> e03 : Notificación cliente [C]
    e08 --> e03 : Notificación cliente (SKU) [C]
    e06 --> e07 : Rechazo de garantía [C][CO]
    e07 --> e08 : Solicitud SKU [C][CO]
    e14 --> e06 : Reporte por garantía [ST]
    e14 --> e07 : Escalado a comercial [ST]
    e15 --> e17 : finalización de servicio [frontera] [ST]
    e15 --> e02 : Calibración de sensores ext. [ST]
    e13 --> e02 : Calibración de sensores ext. [ST]
    e02 --> e15 : Retorno de servicios externos [ST]
    e21 --> e17 : Servicio externo [frontera] [ST]
    e14 --> e17 : Servicio externo [frontera] [ST]
    e07 --> e17 : Rechazo [frontera] [C][ST]
    e03 --> e17 : Rechazo [frontera] [C][ST]
    e13 --> e17 : Rechazo [frontera] [C][ST]
    e21 --> e16 : Diagnóstico complementario [ST]
    e16 --> e07 : Notificación re cotización [C]
```
