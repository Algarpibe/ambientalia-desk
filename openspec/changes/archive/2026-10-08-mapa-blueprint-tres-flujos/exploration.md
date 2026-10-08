# Exploración — `mapa-blueprint-tres-flujos`

Copia literal, sin resumir, de la observación 1499 de Engram (topic key
`sdd/mapa-blueprint-tres-flujos/explore`, tipo `architecture`, creada el 2026-10-08 09:58:29). Lo que sigue
bajo la raya es el contenido tal como está guardado; las comprobaciones contra el código están en
`proposal.md`, apartado «Exploración contrastada».

---

**What**: Exploracion de F1B-09 mapa-blueprint-tres-flujos (E-222). Recomendado enfoque A: parametros OPCIONALES en EntradaMapa (nombreFlujo, ficheroCompleto), fases [] sin validacion D-1, script en bucle sobre CATALOGO_POR_FLUJO; salida de servicio byte-identica.
**Why**: decision/e222-mapa-equipo-nuevo-soporte-remoto ("Ahora, en F1B-09").
**Where**: packages/shared/src/mapaBlueprint.ts (:32-37 nombres, :54-61 cabecera, :108-122 validarFasePorEstado, :161/:209 titulos, :217-231 generar), scripts/generar-mapa-blueprint.ts:28-35, packages/shared/src/flujos.ts:19-22, mapaBlueprint.test.ts (:25,:46,:168), cifrasAncladas.test.ts:45-55 (segundo consumidor).
**Learned**: equipo-nuevo = 6 transiciones/7 aristas/5 estados; soporte-remoto = 4/4/4; ninguno tiene sinBoton, sinSalida (los 4 son de servicio) ni fases. fases:[] con fasePorEstado:{} LANZA hoy (validarFasePorEstado). Citas fuera de archive: 10 (generar-mapa-blueprint.ts:28-35 x6, mapaBlueprint.test.ts:168/:46 x3... 0 de mapaBlueprint.ts); 41 en archive (excluido del detector, cli.ts:49). ENTRADA.md:2117-2120 sigue diciendo E-222 ABIERTA/SIN DESTINO (caduco frente a la decision).
Session: manual-save-ambientalia-desk
Project: ambientalia-desk
Scope: project
Topic: sdd/mapa-blueprint-tres-flujos/explore
Duplicates: 1
Revisions: 1
Created: 2026-10-08 09:58:29
