# Roadmap — Reemplazar Zoho Desk por una app independiente

**Objetivo:** que la app + Postgres sustituyan a Zoho Desk por completo (estados, transiciones,
creación de tickets y entrada/salida de correos). Postgres pasa a ser **el sistema de registro**
(fuente de verdad); hoy es solo una réplica de lectura sincronizada desde Zoho.

## Principio rector
Cada subsistema es un **subproyecto** con su propio ciclo diseño → plan → implementación.
Vamos por fases, validando lo más riesgoso (correo) pronto.

## Qué se reaprovecha de lo ya construido
- Postgres + despliegue en EasyPanel/VPS.
- Tablero, detalle de ticket, panel de propiedades, hilo de conversaciones.
- **Motor de transiciones** (config de 34 transiciones + validación + formulario UI). Solo cambia
  el destino de escritura: de Zoho → a Postgres.

## Subsistemas

| # | Subsistema | Riesgo | Depende de | Notas |
|---|---|---|---|---|
| **A** | Datos propios (escribibles) | Bajo | — | Esquema propio: tickets, comentarios, contactos, empresas, adjuntos; numeración de tickets; historial/auditoría de transiciones. Postgres deja de ser solo `raw jsonb` de Zoho. **Cimiento.** |
| **B** | Transiciones sobre Postgres | Bajo | A | Reusar el motor; ejecutar la transición escribiendo en Postgres (estado + campos + comentario + historial). |
| **C** | Creación de tickets en la app | Bajo | A | Formulario de alta: asunto estandarizado (prefijos MT/CG/HV/SR/PRO), clasificación, contacto/empresa, OV. |
| **D** | **Canal de correo** | **Alto** | A | Recibir correos de clientes → crear ticket/hilo en Postgres (IMAP o servicio de email + webhook); **enviar respuestas** (SMTP) con buena entregabilidad; adjuntos, threading, spam. **El corazón de Zoho y lo más difícil.** |
| **E** | Contactos / empresas en la app | Medio | A | Hoy vienen de Zoho; gestionarlos localmente (CRUD + asociación a tickets). |
| **F** | Migración / corte (cutover) | Medio | A–E | Importar todo Zoho una vez al esquema nuevo, apagar el sync, periodo en paralelo, y el switch de fuente de verdad. |
| **G** | Futuro (opcional) | — | — | Portal de cliente, roles/permisos por área (el Blueprint define área responsable por transición), reportería sobre el modelo propio. |

## Secuencia recomendada
1. **A** — modelo de datos propio (cimiento).
2. **D (spike)** — validación temprana del correo (prueba pequeña: recibir 1 correo → ticket, enviar
   1 respuesta). De-riesga el objetivo antes de invertir en el resto. *No* el build completo aún.
3. **B** — transiciones a Postgres (reusa el motor).
4. **C** — creación de tickets.
5. **D (completo)** — canal de correo entrante/saliente.
6. **E** — contactos/empresas.
7. **F** — migración y corte definitivo.

## Riesgos clave
- **Correo (D):** entregabilidad (SPF/DKIM/DMARC), threading de respuestas, adjuntos, spam. Si no se
  resuelve bien, "reemplazar del todo" no es viable → por eso el spike temprano.
- **Numeración de tickets:** hoy la asigna Zoho; al independizarnos, la genera Postgres (secuencia).
  Durante el cutover hay que evitar colisiones con los números existentes de Zoho.
- **Doble fuente de verdad durante la transición:** mientras convivan Zoho y la app, definir quién
  manda para cada ticket (p.ej. "tickets gestionados por la app" dejan de sincronizarse desde Zoho).
- **Sync actual:** `syncRecent` sobrescribiría cambios locales. Al pasar a fuente de verdad propia,
  hay que apagar/ajustar el sync (que no pise lo que gestiona la app).

## Modelo de corte (cutover) — confirmado
- **Durante la construcción:** el sync **sigue alimentando** Postgres desde Zoho (datos reales).
- **Al completar la app:** se **desconecta Zoho definitivamente**; Postgres = única fuente de verdad.
- **Convivencia sin conflicto:** marca por ticket `gestionado_por_app`. Cuando la app modifica un
  ticket (transición/edición/creación), ese ticket queda "propiedad de la app" y el **sync deja de
  sobrescribirlo** (sigue trayendo de Zoho solo los nuevos/no tocados). En el corte, se apaga el
  sync y todos los tickets quedan gestionados por la app. Esto es parte del diseño del subsistema A.

## Estado
- Fase 0 (réplica de lectura + tablero/detalle) ✅ en producción.
- Próximo: **diseñar el subsistema A** (modelo de datos propio), incluyendo la marca `gestionado_por_app`.
