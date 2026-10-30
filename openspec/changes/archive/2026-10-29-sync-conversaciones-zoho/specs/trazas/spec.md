# Delta para trazas — el relato de conversaciones no enseña lo que Zoho ya no tiene (1G-01, `cierra: no`)

Construye `decision/adelanto-1g01-sincronizacion-conversaciones` (Gerencia, 29/10/2026), supuesto S-13 de `proposal.md`.
Numeración comprobada contra `openspec/specs/trazas/spec.md` en `b4255928`: el último requisito vivo es RQ-TZ-24; el nuevo es
RQ-TZ-25. **Nota de fusión:** sólo `## ADDED Requirements`, al final de la spec viva; ninguna línea viva se mueve. La marca la
pone la sincronización (`zoho-sync` RQ-ZS-26).

## ADDED Requirements

### RQ-TZ-25 · El hilo no enseña las conversaciones que Zoho ya no tiene, ni sus adjuntos

El relato de CONVERSACIONES (`getConversacionTicket`, `apps/desk/server/db/conversacion.ts:132`) **MUST NOT** incluir las filas
de `conversations` con `ausente_en_zoho_at` no nulo, **ni sus adjuntos**. El filtro **SHALL** vivir en el lector
`getConversations` (`packages/zoho-sync/src/db/repo.ts:218-227`), que es su único consumidor. Ocultar no es borrar: la fila y
sus adjuntos **SHALL** seguir en la base, y una fila desmarcada **SHALL** volver a enseñarse con sus adjuntos. Las entradas que
compone la App —creación, transiciones y remisiones— **MUST NOT** cambiar.

#### Scenario: una conversación marcada desaparece del hilo con su adjunto — ROJO
- GIVEN un ticket con dos conversaciones de Zoho, cada una con un adjunto, y una de ellas marcada como ausente
- WHEN se compone su hilo
- THEN sale sólo la no marcada, con su adjunto, y el adjunto de la marcada no sale en ninguna entrada
- AND las dos filas y los dos adjuntos siguen en la base

#### Scenario: al desmarcarse vuelve con su adjunto — ROJO
- GIVEN la conversación marcada del escenario anterior, ya desmarcada
- WHEN se compone el hilo otra vez
- THEN salen las dos, cada una con su adjunto

#### Scenario: lo que compone la App no cambia — CARACTERIZACIÓN
- GIVEN un ticket con una transición con comentario, una remisión vigente y una conversación de Zoho marcada
- WHEN se compone su hilo
- THEN salen la transición, la remisión y el comentario de la App, y no sale la de Zoho marcada
