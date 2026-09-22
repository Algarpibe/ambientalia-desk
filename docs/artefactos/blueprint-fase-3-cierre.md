<!--
  GENERADO por `npm run generar-mapa-blueprint` (`scripts/generar-mapa-blueprint.ts`) a partir de
  `transitions.ts`, `estados.ts` y `fasesBlueprint.ts`. NO EDITAR A MANO: la prueba anti-desfase
  (`mapaBlueprint.test.ts`, RQ-MB-06) lo detecta.
-->

# Mapa del Blueprint de Servicio Técnico — fase «Cierre administrativo y entrega»

```mermaid
stateDiagram-v2
    state "Notificación cliente ←diagnostico" as e03
    state "Por Entregar" as e04
    state "Por Entregar / Sin facturar" as e05
    state "Notificación Comercial ←diagnostico" as e07
    state "Liberación Comercial" as e10
    state "Rev./Diagnostico ←diagnostico" as e13
    state "Notificado ←diagnostico" as e14
    state "En Proceso ←diagnostico" as e15
    state "Por Facturar" as e17
    state "Finalizado" as e18
    state "Pendiente ←diagnostico" as e21
    e15 --> e17 : finalización de servicio [frontera] [ST]
    e21 --> e17 : Servicio externo [frontera] [ST]
    e14 --> e17 : Servicio externo [frontera] [ST]
    e07 --> e17 : Rechazo [frontera] [C][ST]
    e03 --> e17 : Rechazo [frontera] [C][ST]
    e13 --> e17 : Rechazo [frontera] [C][ST]
    e17 --> e10 : Facturado [C]
    e17 --> e18 : facturado y cierre de TK [C]
    e17 --> e05 : Liberación sin factura [C]
    e05 --> e17 : Entrega al cliente sin factura [ST]
    e04 --> e18 : Entrega al cliente [ST]
    e10 --> e04 : Habilitado para entrega [C]
```
