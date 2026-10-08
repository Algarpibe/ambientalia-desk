---
tanda: F1B-19
motivo: ""
capacidad: [tickets-core, derivacion-avisos]
maestro: []
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: NIT genéricos exentos y aviso de provisional ya en Books

## Intención

El alta manual de cliente responde `409` siempre que el NIT tecleado casa con un contacto de Books
(`apps/desk/server/services/ticketService.ts:96`), y hoy no existe ninguna lista de exentos: lo dice el propio comentario de
`apps/desk/server/services/altaManual.ts:154-157`. Un NIT genérico como el de consumidor final bloquea así toda alta manual que lo
use. Y una vez creado un provisional, nada avisa si su NIT aparece después en Books: los dos registros conviven sin que nadie lo sepa.

**Cobertura de la fila:** `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:79` pide dos piezas —exentos (E-154) y aviso
(E-155)— y este cambio construye las dos. Por eso `cierra: si`. La ampliación de la lista con lo que confirme contabilidad es tarea
de persona y no forma parte del contenido construible (última sección).

**Maestro:** `maestro: []` porque las tres decisiones registran `maestro_pasaje: "ninguno (alta manual de cliente)"`. `toca_maestro:
si` porque las tres llevan `maestro_revision: "pendiente"` y el maestro describe el cliente provisional sin exentos ni aviso
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2532`); la propuesta archivada de F1B-15 declaró lo mismo.

## Qué decisiones construye

| Clave | Respuesta literal de Gerencia |
|---|---|
| `decision/e154-nit-genericos-exentos` (`openspec/config.yaml:4207`) | «Exentos el NIT de consumidor final (222222222222) y los genéricos que confirme contabilidad sobre la lista de NIT repetidos en Books.» |
| `decision/e155-aviso-provisional-en-books` (`openspec/config.yaml:4228`) | «Sí, el aviso a Comercial, sin bloquear.» |
| `decision/f1b19-nit-exentos-y-aviso-provisional` (`openspec/config.yaml:4309`) | «Autorizo la tanda 1 (F1B-03, parte OVI de garantía) en su worktree, con parada antes de fusionar. Apruebo la fila F1B-19 para E-154 y E-155, talla S, antes del corte, al final de la cadena.» |

## Alcance

### Dentro

- Tabla sembrada `public.nit_exentos` con UNA fila (`222222222222`, «Consumidor final») y su lector en `apps/desk/server/db/`.
- Función pura `esNitExento(nit, exentos)` en un fichero nuevo de `packages/shared` (propuesto: `packages/shared/src/nitExentos.ts`).
- Exención aplicada dentro de `apps/desk/server/services/ticketService.ts:96`, sin añadir ni quitar líneas.
- Tabla de marca `public.provisional_books_avisados`, servicio del aviso y pasada `pasadaProvisionalesEnBooks(pool)` en
  `apps/desk/server/index.ts:88`.
- Guardián de tablas (`packages/zoho-sync/src/db/migrate.ts:73`, `packages/zoho-sync/src/db/migrate.test.ts:282-286`).
- Deltas de spec: RQ-TC-30 `MODIFIED`, un requisito nuevo en `tickets-core` y otro en `derivacion-avisos`.

### Fuera

- `apps/desk/src` entero: ni pantalla de mantenimiento de la lista, ni cambios en el formulario.
- Cualquier otro NIT en la siembra, incluidos candidatos: sólo entra lo que Gerencia nombró.
- `nitCoincide` y `normalizarNit` (`packages/shared/src/altaManual.ts:32-35`, `packages/shared/src/altaManual.ts:46-53`): no cambian.
- Unicidad entre provisionales, corte anti-ráfaga, correo del aviso, y escritura en `books.*` o hacia Zoho.
- `docs/sdd/ENTRADA.md` y `openspec/config.yaml`: no se editan en la rama (los escribe Supervisión al fusionar).

## Capacidades

**Nuevas:** ninguna (las dos ya están en `openspec/config.yaml` → `capabilities`; R-2 no aplica).

**Modificadas:**
- `tickets-core`: RQ-TC-30 deja de afirmar que ningún NIT genérico queda exento (`openspec/specs/tickets-core/spec.md:1594-1596`);
  requisito nuevo para la lista y la exención (siguiente libre tras RQ-TC-56, según la exploración).
- `derivacion-avisos`: requisito nuevo para el aviso de provisional ya en Books (siguiente libre tras RQ-AV-20, según la exploración).

## Enfoque por pieza

1. **Lista como dato (D-1).** La consecuencia (4) de la decisión pide «un dato mantenible y no una constante»
   (`openspec/config.yaml:4221-4222`). Molde: `public.catalogo_novedades` (`packages/zoho-sync/src/db/schema.sql:682-689`, siembra en
   `packages/zoho-sync/src/db/schema.sql:690`). Columnas: `nit text PRIMARY KEY` (base normalizada, sólo dígitos), `motivo text NOT
   NULL`, `activo boolean NOT NULL DEFAULT true`, `created_at`. Se retira con `activo = false`, nunca borrando: la siembra reinsertaría
   la fila. Una sola fuente: no hay constante espejo en `packages/shared`.
2. **Cómo casa (D-2).** `esNitExento(nit, exentos)` es «algún exento casa con `nitCoincide(nit, exento)`»: la MISMA función con la
   que el alta compara contra Books (`apps/desk/server/db/clientesProvisionales.ts:69-75`). Sigue habiendo una sola implementación
   de «mismo NIT» en el repositorio (hallazgo 1 de la exploración); la exención la consume, no la duplica.
3. **Dónde se aplica (D-3).** En `apps/desk/server/services/ticketService.ts:96`: si el NIT del provisional es exento, `nitEnBooks`
   es `[]` y no se consulta Books. La exención vive en el escalón D: no salta ninguna guarda A, B o C ni la de la orden de venta.
   El comentario de `apps/desk/server/services/altaManual.ts:154-157` se reescribe en sitio, con las mismas líneas.
4. **Marca por pareja (D-5).** `public.provisional_books_avisados (provisional_id text, contacto_id text, avisado_at timestamptz
   DEFAULT now(), avisos_creados integer, PRIMARY KEY (provisional_id, contacto_id))`. Molde: `public.alarmas_avisadas`
   (`packages/zoho-sync/src/db/schema.sql:582-588`) y `apps/desk/server/services/alarmasSla.ts:37-57`: `INSERT` sin `ON CONFLICT`,
   captura de `23505`, marca y avisos en UNA `enTransaccion`. Destinatarios ANTES de la marca, y sin destinatarios no se marca
   (`apps/desk/server/services/avisoReclamacionProveedor.ts:26-44`).
5. **Qué pareja avisa (D-6).** Provisional con `enlazado_a IS NULL` × contacto de la vista `clients`
   (`packages/zoho-sync/src/db/schema.sql:169-173`) con `nitCoincide(provisional.nit, contacto.nit)`, salvo que el NIT de CUALQUIERA
   de los dos lados sea exento. Al enlazar, el provisional deja de entrar en la consulta.
6. **Dónde corre (D-7).** `pasadaProvisionalesEnBooks(pool)` entre `pasadaReclamaciones` y `pasadaRitmoContratos`, dentro de
   `apps/desk/server/index.ts:88`, y su import dentro de `apps/desk/server/index.ts:15`. Es compatible con las dos pruebas que leen
   ese fichero como texto: `apps/desk/server/services/avisoRitmoContrato.test.ts:185-195` exige que `pasadaRitmoContratos(pool)` y
   `sync.syncRecent()` sigan adyacentes, y `apps/desk/server/services/avisoReclamacionProveedor.test.ts:251-259` que
   `pasadaReclamaciones(pool)` vaya antes. Corre en cada intervalo, con salida corta si no hay provisionales sin enlazar (no lee
   los contactos). NUNCA lanza: `try/catch` propio, y un fallo en una pareja no para a las demás.
7. **Aviso sólo de bandeja (D-8).** `crearAviso` con `ticketId: null` (`apps/desk/server/db/avisos.ts:8-18`) a
   `destinatariosDeArea(q, 'Comercial', '')` (`apps/desk/server/db/avisos.ts:74-93`). Texto propuesto: «El cliente provisional
   «{razón social}» (NIT {nit}) coincide por NIT con el contacto de Books «{nombre}». Conviene enlazarlos.»

**Dos lotes de apply, cada uno su intento (D-11), bajo la válvula de 720 líneas.** Estimación, no medida:

| Lote | Contenido | Estimación (código + pruebas + casillas + `apply-progress.md`) |
|---|---|---|
| 1 · exentos | tabla y siembra, `PUBLIC_TABLES`, guardián, función pura, lector, línea 96, pruebas | ~360; hasta ~540 con margen |
| 2 · aviso | tabla de marca, guardián, lector de parejas, servicio, pasada, `index.ts`, pruebas | ~470; hasta ~700 con margen |

## Supuestos reversibles

| # | Supuesto aplicado | Reversible | Pregunta para Gerencia |
|---|---|---|---|
| S-1 | La lista se mantiene por SQL, sin pantalla (como `catalogo_novedades`) | Sí: una pantalla se añade después | ¿Basta mantener la lista por SQL, o contabilidad necesita pantalla? |
| S-2 | Dos provisionales con el mismo NIT exento se permiten; hoy nada impide dos con el mismo NIT, exento o no (`packages/zoho-sync/src/db/schema.sql:658-673`) | Sí | ¿Debe impedirse un segundo provisional con el mismo NIT, exento o no? |
| S-3 | Texto del aviso del punto 7, sin ticket asociado | Sí: es una cadena | ¿Se quiere otro texto, o enlazarlo a algún ticket del provisional? |
| S-4 | Ráfaga al desplegar aceptada, sin corte: cada pareja ya existente avisa una vez. Un corte las callaría para siempre | Sí, sólo antes de desplegar | ¿Se prefiere un corte que silencie las parejas anteriores al despliegue? |
| S-5 | Cadencia: en cada intervalo de sincronización (180000 ms por defecto, `packages/zoho-sync/src/config.ts:88`), no una vez al día, porque «sin destinatarios se reintenta» | Sí | ¿Es aceptable que el aviso llegue a los pocos minutos, o basta una vez al día? |
| S-6 | En el aviso la exención mira los DOS lados: basta que el NIT del provisional o el del contacto sea exento para no avisar | Sí | ¿De acuerdo en que un genérico no avise aunque sólo lo sea uno de los dos lados? |

## Pruebas y mutaciones previstas

**Exentos (lote 1).** Sobre `apps/desk/server/services/altaManual.test.ts:322-383`, con contacto de Books de NIT `222222222222`:
- exento sin formato y con formato («222.222.222.222», con espacios, con guion y dígito) → `201`;
- no exento repetido en Books → sigue el `409` con candidatos;
- **posición (regla de mutación 1):** exento + serial distinto → `422` del serial, igual que
  `apps/desk/server/services/altaManual.test.ts:367`; exento sin los cinco datos → `422` de A. Mover la exención por delante de
  `apps/desk/server/services/ticketService.ts:91` debe ponerlas en rojo;
- **mutación «vaciar la lista»:** con `activo = false` en la fila, o sin filas, vuelve el `409`;
- **fichero vigilado (regla de mutación 2):** quitar la siembra de `schema.sql` pone en rojo una prueba que lee la tabla tras `migrate`;
- función pura: tabla de casos en `packages/shared`, incluida la guarda del vacío (un NIT sin dígitos nunca es exento).

**Aviso (lote 2).** Se avisa una vez por pareja · una segunda pasada no repite · al enlazar deja de avisar · NIT exento (cada lado
por separado) no avisa · sin destinatarios no marca y la pasada siguiente reintenta · transacción fijada por estructura, como
`apps/desk/server/services/avisoRitmoContrato.test.ts:127-138` · con la base caída la pasada resuelve y la sincronización encadenada
corre igual · un fallo en una pareja no impide la siguiente · `index.ts` como fichero vigilado (orden entre las dos pasadas vecinas).
**Mutaciones:** quitar el `INSERT` de la marca (repite el aviso → rojo); mover la marca antes de los destinatarios (marca sin avisar
→ rojo); quitar el filtro `enlazado_a IS NULL` → rojo; quitar la pasada de `index.ts` → rojo.

## Esquema

Las dos `CREATE TABLE` van CALIFICADAS (`public.`) y AL FINAL de `packages/zoho-sync/src/db/schema.sql`, tras su línea 796 de hoy, sin
desplazar nada. Guardián: hoy 10/32/3 y 45 (`packages/zoho-sync/src/db/migrate.test.ts:282-286`); 10/33/3 y 46 tras el lote 1;
**10/34/3 y 47** tras el lote 2. Los dos nombres entran en `packages/zoho-sync/src/db/migrate.ts:73`, dentro de la misma línea.

## Ficheros muy citados y barrido de cierre

`ticketService.ts`, `index.ts`, `migrate.ts`, `migrate.test.ts` y `altaManual.ts` se editan DENTRO de línea; `schema.sql` y los
ficheros de prueba crecen sólo por el final; RQ-TC-30 se reescribe conservando su número de líneas. Aun así, al cierre de cada lote
se barre la regla de mutación 4 sobre esos ficheros y sobre `openspec/specs/tickets-core/spec.md`, comprobando cada resultado contra
el fichero.

## Regla invariable 13

No se toca `apps/desk/src` (D-10). **Ninguna decisión del cliente sobre el NIT:** según la exploración (hallazgo 8, no recontrastado
aquí: hipótesis), el cliente envía el NIT sin tocarlo y sólo enseña los candidatos del `409`. La exención y el aviso viven y se
prueban en el servidor.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Un NIT exento tecleado como base + dígito de verificación SIN guion no casa con el exento guardado sin dígito (contrato de `nitCoincide`, `packages/shared/src/altaManual.ts:46-53`) y, si Books lo tiene con guion, sigue dando `409` | Baja | Se fija con una prueba como comportamiento conocido; la salida es sembrar también esa forma, por SQL |
| Con un provisional sin enlazar, la pasada lee todos los contactos en cada intervalo. **Hipótesis:** el volumen es asumible; no hay dato en el repositorio | Media | Salida corta sin provisionales; sólo `id, name, nit`; S-5 permite pasar a diaria |
| Sin destinatarios en Comercial, un `warn` por pareja en cada intervalo | Baja | Un único `warn` por pasada; lo fija `sdd-design` |
| Ráfaga al desplegar (S-4), sin dato de cuántas parejas hay | Media | Pregunta a Gerencia antes de desplegar; es una vez por pareja |
| El lote 2 queda cerca de la válvula de 720 | Media | Medir antes de cerrar el intento; si la supera, se parten las pruebas de la pasada en un tercer intento |
| Una fila mal escrita por SQL en `nit_exentos` (con puntos o guion) | Baja | `esNitExento` normaliza los dos lados; un `CHECK` de sólo dígitos queda a `sdd-design` (**hipótesis:** pg-mem lo admite) |

## Reversión

Revertir los commits del apply devuelve el `409` universal y retira la pasada. Las dos tablas pueden quedarse: sin código que las
lea son inertes. Los avisos ya creados permanecen en la bandeja; no hay dato de Books ni de Zoho modificado.

## Tareas de personas — fuera del recuento

No son casillas de `tasks.md` y **archivar no las da por hechas** (regla del ciclo 1).

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| (i) Decidir qué NIT repetidos son genéricos y deben entrar en la lista | Contabilidad | `openspec/config.yaml` → `decisiones_de_gerencia`; la fila se añade por SQL en producción |
| (ii) Ejecutar la consulta de abajo, de sólo lectura, y entregar el resultado a contabilidad. **Ninguna sesión la ejecuta** | Una persona con acceso a producción | `docs/sdd/ENTRADA.md` → E-154 |
| (iii) Responder a las preguntas de S-1 a S-6 | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| (iv) Corregir los textos que dejarán de ser ciertos: el comentario de E-154 y E-155 en la bandeja y `tanda_que_abre` de las dos decisiones. RQ-TC-30 lo reescribe la propia tanda | Supervisión | `docs/sdd/ENTRADA.md` y `openspec/config.yaml`, al fusionar |

```sql
-- Sólo lectura. NIT repetidos en Books, por su base normalizada (lo anterior al primer guion, sólo dígitos).
SELECT regexp_replace(split_part(nit, '-', 1), '[^0-9]', '', 'g') AS nit_base,
       count(*)                                                   AS contactos,
       string_agg(contact_name, ' | ' ORDER BY contact_name)      AS nombres
  FROM books.contacts
 WHERE regexp_replace(split_part(coalesce(nit, ''), '-', 1), '[^0-9]', '', 'g') <> ''
 GROUP BY 1
HAVING count(*) > 1
 ORDER BY contactos DESC, nit_base;
```

## Criterios de aceptación

1. Un alta manual con NIT `222222222222`, con o sin formato, responde `201` aunque Books tenga contactos con ese NIT.
2. Un NIT no exento que casa con Books sigue respondiendo `409` con todos los candidatos.
3. La exención no salta ninguna guarda de A, B o C: lo fijan las pruebas de posición y su mutación.
4. Con la lista vacía o la fila inactiva vuelve el `409`; quitar la siembra de `schema.sql` pone rojo.
5. Cada pareja provisional sin enlazar × contacto con el mismo NIT produce un aviso de bandeja a Comercial, una sola vez.
6. Un provisional enlazado, o una pareja con NIT exento en cualquiera de los dos lados, no avisa.
7. Sin destinatarios no hay marca, y la pasada siguiente avisa en cuanto los hay.
8. La pasada nunca lanza y la sincronización corre aunque falle; ningún alta ni transición se bloquea por el aviso.
9. El guardián cuenta 10/34/3 y 47; las dos tablas van calificadas y al final de `schema.sql`.
10. `git diff --stat` de los dos lotes no contiene ningún fichero bajo `apps/desk/src`.
11. `npm test`, `npm run typecheck` y `npm run lint` en verde; medida de cada intento por debajo de 720.
12. Barrido de la regla de mutación 4 hecho y comprobado contra los ficheros al cierre de cada lote.
