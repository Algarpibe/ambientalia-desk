# Verify report: nit-exentos-aviso-provisional (F1B-19, cierra: si)

Revisión verificada: `596856e` (base `ba643d9`). Este verify es **posterior al último cambio de producción** (lote 3, `596856e`): ningún commit de código se añadió después. Modo: strict TDD, hybrid. Todo se midió en esta sesión; ninguna cifra de `apply-progress.md` se repite sin remedirla.

## Veredicto: PASS CON AVISOS (0 CRITICAL, 4 WARNING, 3 SUGGESTION)

## 1. Códigos sobre `596856e`
| Orden | Código | Cifras |
|---|---|---|
| `npm test` | 0 | 262 ficheros pasan, 2 omitidos; 4322 pasan, 7 omitidas, 0 fallan |
| `npm run typecheck` | 0 | sin errores |
| `npm run lint` | 0 | 0 errores, 165 avisos (los previos) |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | no bloquea; 14 abreviadas rotas informativas (SUGGESTION 1) |

## 2. Matriz requisito → prueba
Ficheros: `AM` = `apps/desk/server/services/altaManual.test.ts` (describe «RQ-TC-57 · NIT exentos»), `SH` = `packages/shared/src/nitExentos.test.ts`, `ES` = `packages/zoho-sync/src/db/nitExentosEsquema.test.ts`, `AV` = `apps/desk/server/services/avisoProvisionalEnBooks.test.ts`.

**RQ-TC-30 (modificado):** los seis escenarios previos (alta, faltan datos, motivo vacío, NIT en Books, dos contactos, id no se confunde) siguen en las pruebas previas de `AM`, `apps/desk/server/routes/altaManual.test.ts` y `packages/shared/src/altaManual.test.ts`; el cambio sólo añade la frase de exentos, fijada por los escenarios de RQ-TC-57. Sin hallazgo.

**RQ-TC-57**
| Escenario | Prueba |
|---|---|
| Consumidor final no da 409 | `AM`: «el NIT exento sin formato, con Books que lo tiene: 201 y existen el provisional y el ticket» |
| Exento con formato | `AM`: «el NIT exento con formato «%s» también: 201» (tres formatos) |
| No exento sigue 409 | `AM`: «un NIT no exento repetido en Books sigue dando 409 con candidatos y nada escrito» |
| No salta 422 del serial | `AM`: «posición · exento + serial distinto de su confirmación → 422 del serial, no 201» |
| No salta 422 de A | `AM`: «posición · exento sin correo → 422 de A (datos que faltan), no 201» |
| **No salta la guarda de la OV** | **SIN PRUEBA exacta** (WARNING 1): inalcanzable con provisional |
| Fila inactiva | `AM`: «fila inactiva: vuelve el 409 con candidatos» |
| Lista vacía | `AM`: «lista vacía: vuelve el 409 con candidatos» |
| Siembra exacta | `ES`: «tras migrate hay UNA fila…» y «hay una sola sentencia de siembra…» |
| Sin dígitos nunca exento | `SH`: «un NIT sin dígitos («%s») nunca es exento…» |
| Base+dígito sin guion | `SH`: «base más dígito de verificación SIN guion no es exento…» y `AM`: «base más dígito SIN guion contra Books con guion: sigue el 409» |
| Dos provisionales | `AM`: «dos provisionales con el mismo NIT exento se permiten (S-2)» |

Frases sin escenario: «no salta B» no tiene prueba (WARNING 2). «Sin constante espejo»: `grep 222222222222` sobre `packages/shared/src` y `apps/desk/src` sólo devuelve `packages/shared/src/nitExentos.test.ts`.

**RQ-AV-21**
| Escenario | Prueba |
|---|---|
| Pareja avisa a Comercial | `AV`: (a); el texto literal, en «el texto trae razón social, NIT tal como se tecleó y nombre del contacto» |
| Segunda pasada no repite | `AV`: (b) |
| Dos parejas | `AV`: (c) |
| Enlazado no avisa | `AV`: (d) |
| **Al enlazar un ya avisado no se evalúa** | **SIN PRUEBA exacta**: (d) no pone marca previa (SUGGESTION 2) |
| Exento en provisional / en contacto | `AV`: (e), tres pruebas |
| Sin destinatarios | `AV`: (f) |
| Marca y avisos en una transacción | `AV`: (h), tres pruebas |
| Concurrentes | `AV`: (i) «dos pasadas concurrentes…» |
| Sin provisionales no lee contactos | `AV`: (g) «sin provisionales: UNA consulta y []» |
| Sólo bandeja | `AV`: (a) (`enviado_at: null`); que no se invoque el correo no se prueba aparte |
| Pasada no lanza | `AV`: (k), tres pruebas; (l) fija el orden en `apps/desk/server/index.ts` |
| Fallo en una pareja | `AV`: (j) |
| **El aviso no bloquea alta ni transición** | **SIN PRUEBA** (proceso aparte, sin acoplamiento; SUGGESTION 2) |

## 3. Mutaciones propias (31; todas restauradas)
Se ejecutaron `AM`, `SH`, `ES`, `AV`, `migrate.test.ts`, `ticketService.test.ts`, `apps/desk/server/oviGarantia.test.ts` y las tres vecinas de `index.ts`, según el fichero mutado.

| # | Qué cambié | Resultado |
|---|---|---|
| P1 | `esNitExento`: sólo casa con el primer exento | ROJA: `AV` (e) «sólo el provisional» |
| P2 | `esNitExento`: argumentos de `nitCoincide` invertidos | ROJA: `AV` (e) «sólo el provisional» |
| P3 | `esNitExento`: igualdad estricta en vez de `nitCoincide` | ROJA: 10 pruebas (`SH`, `AM`, `AV`) |
| P4 | `nitExentosActivos`: `LIMIT 1` | ROJA: `AV` (e) «sólo el provisional» |
| P5 | línea 96: leer la lista también sin provisional | ROJA: «lectura · un alta sin cliente manual NO consulta…» |
| P6 | línea 96: exento pero consultando Books igual | ROJA: «lectura · con NIT exento… NO se consultan los contactos» |
| P7 | línea 96: la exención salta el conflicto de OV (`ovEnUso` nulo) | **SOBREVIVE**, equivalente (WARNING 1) |
| P8 | exento omite `validarContenidoAltaManual` (C) | ROJA: posición serial y posición clientId |
| P9 | exento omite el `422` de A | ROJA: «posición · exento sin correo» |
| P10 | exento omite `exigirCargoOVI` (B) | **SOBREVIVE** (WARNING 2) |
| P11 | siembra: motivo con un espacio de más | ROJA: `ES` «tras migrate hay UNA fila» |
| P12 | siembra: `ON CONFLICT … DO UPDATE SET activo = true` | ROJA: `ES`, dos pruebas |
| P13 | `nit_exentos.activo` por defecto `false` | ROJA: 11 pruebas |
| P14 | `avisos_creados` sin `NOT NULL` | ROJA: `ES` «avisos_creados nulo se rechaza» |
| P15 | `avisado_at` sin `DEFAULT now()` | ROJA: `ES`, misma prueba |
| P16 | `nit_exentos.motivo` sin `NOT NULL` | **SOBREVIVE** (WARNING 3) |
| Q1 | texto: «Conviene enlazar.» | ROJA: prueba del texto literal |
| Q2 | `avisos_creados` fijo en 1 | ROJA: (a) y (h) sin fallo |
| Q3 | sólo el primer destinatario recibe | ROJA: (a) y (h) |
| Q4 | `ticketId` = id del provisional | ROJA: (a) |
| Q5 | `warn` pasa a `info` | ROJA: (f) |
| Q6 | quitar la salida `parejas.length === 0` del servicio | **SOBREVIVE** (WARNING 4) |
| Q7 | orden de contactos invertido | ROJA: «el orden de las parejas…» |
| Q8 | sin dedup de ids en `parejasYaAvisadas` | SOBREVIVE, equivalente (un `IN` con ids repetidos devuelve lo mismo) |
| Q9 | contar `avisadas` aunque la marca ya existiera | **SOBREVIVE** (SUGGESTION 3) |
| Q10 | tercer argumento de `destinatariosDeArea` distinto de vacío | SOBREVIVE, equivalente (sólo excluye un id de usuario, `apps/desk/server/db/avisos.ts:74-93`) |
| Q11 | contacto sin nombre: cadena vacía en vez del id | ROJA: «el orden de las parejas… nombre por su id» |
| Q12 | consulta de marcas sólo con el primer id | ROJA: misma prueba |
| R1 | pasada de provisionales antes de la de alarmas | ROJA: (l) |
| R2 | la pasada nueva lanza dentro de la cadena de `index.ts` | SOBREVIVE (SUGGESTION 3): (l) es texto; (k) cubre la función |
| R3 | `index.ts` importa `avisarProvisionalesEnBooks` (puede lanzar) con el alias de la pasada | SOBREVIVE (SUGGESTION 3): artificial, sólo vale por el alias |

Supervivientes reales: P10, P16, Q6; con matiz Q9, R2, R3. Equivalentes: P7, Q8, Q10. Ninguno se cerró: los cierra el orquestador.

## 4. Regla de mutación 1 (posición)
P8 (saltar C) y P9 (saltar A) ponen rojas las pruebas de posición. **B no está fijada**: P10 sobrevive porque ninguna prueba combina NIT exento con una orden OVI sin cargo. El caso es alcanzable: `exigirCargoOVI` corre antes que C en `apps/desk/server/services/ticketService.ts` (el comentario «B (F1B-03)» de esa línea), así que provisional exento + OV OVI sin cargo debe dar el `403` y hoy nada lo vigila.

## 5. Ficheros muy citados y regla 13
`git diff ba643d9 596856e --stat -- apps/desk/src` está vacío. Líneas antes → después: `ticketService.ts` 277 → 277, `altaManual.ts` 161 → 161, `index.ts` 118 → 118, `migrate.ts` 131 → 131, `migrate.test.ts` 911 → 911, `packages/shared/src/index.ts` 40 → 40. `schema.sql` 796 → 818 y `DEPLOY.md` 628 → 661: el `git diff` de ambos no tiene ninguna línea `-`. En `index.ts` y `ticketService.ts` los hunks son de sustitución dentro de la misma línea. Regla 13: la exención y la lista sólo viven en el servidor.

## 6. Datos inventados
El único NIT en `schema.sql` es `222222222222` (`packages/zoho-sync/src/db/schema.sql:807`, el de Gerencia). `DEPLOY.md` sólo lo repite y usa el marcador `<NIT que confirme contabilidad>`; el otro número que casa el patrón (`DEPLOY.md:85`, `ZOHO_ORG_ID`) es previo. Los NIT de las pruebas (`900123456`, `9001234567`, `800.111.222-3`, `2222222222221`…) son ficticios de prueba.

## 7. Coherencia spec ↔ código
Cumple: texto literal del aviso, `ticketId` nulo, `enviado_at` nulo, destinatarios antes de la marca, una advertencia por pasada, cadencia sin cerrojo diario, salidas cortas, exención por los dos lados, `INSERT` sin `ON CONFLICT` con captura de `23505`. Divergencias:
- RQ-TC-57 pide «una orden de venta ya asociada a otro ticket → 409 de OV» con NIT exento; con provisional es inalcanzable, porque C responde `422` (prueba previa de `AM` «un provisional con orden de venta ya usada y NIT en Books: 422 de C…»). La spec describe un escenario que el código no puede producir.
- El código descarta provisionales exentos antes de leer los contactos (consistente con «salidas cortas»; la spec no lo dice).

## 8. Hallazgos
**CRITICAL:** ninguno.

**WARNING**
1. Escenario «La exención no salta la guarda de la orden de venta» de RQ-TC-57 inalcanzable y sin prueba (P7 equivalente). Reescribir o borrar el escenario, o declarar la guarda inerte para provisionales.
2. «No salta B» sin prueba (P10): falta una de posición con NIT exento + OVI sin cargo.
3. `public.nit_exentos.motivo` es «obligatorio» en la spec y nada prueba el `NOT NULL` (P16, regla de mutación 2).
4. Sin parejas y sin destinatarios, quitar la salida del servicio emitiría un aviso de advertencia espurio en cada intervalo (Q6); ninguna prueba lo vigila.

**SUGGESTION**
1. `openspec/changes/nit-exentos-aviso-provisional/apply-progress.md`, línea 110, trae una cita abreviada que el detector marca rota (informativa, no bloquea): reescribirla en prosa.
2. Falta la variante con marca previa de «al enlazar deja de avisar» y no hay prueba de «no bloquea ningún alta».
3. Q9, R2, R3: (l) lee `index.ts` como texto; el cableado real a una función que lance sólo lo cubre (k). Considerar que (l) exija el nombre importado de su módulo.

## 9. Estado final
`git status --short`: sólo `apply-progress.md` (retoque previo del orquestador) y este `verify-report.md`.

## Adenda del orquestador — remediación posterior al verify

Escrita tras el verify. **El verify formal sigue siendo sobre `596856e`:** después sólo cambiaron pruebas y un escenario del delta de
spec; ningún fichero de producción.

- **Cerrados con prueba nueva**, cada una en rojo con la mutación del verify y verde al restaurar: P10 (NIT exento con orden OVI y
  usuario sin el cargo responde el `403` del escalón B), P16 (`motivo` sin valor se rechaza), Q6 (sin parejas no hay advertencia ni se
  consultan destinatarios), Q9 (el valor devuelto cuenta sólo las parejas realmente avisadas) y el enlace tras un aviso (SUGGESTION 2).
- **WARNING 1:** el escenario inalcanzable de RQ-TC-57 se reescribió en el delta: con cliente provisional y orden de venta responde el
  `422` del escalón C, con NIT exento o sin él. Se añadió el escenario del `403` del escalón B.
- **Siguen sin prueba, declarados:** R2 y R3 (la cadena de `apps/desk/server/index.ts` se prueba como texto: orden e import, no
  ejecución) y «el aviso no bloquea ningún alta ni transición» (el servicio no tiene ninguna entrada desde las rutas; se sostiene por
  estructura, no por prueba). P7, Q8 y Q10 son mutantes equivalentes.
- Cuatro códigos tras la remediación: `npm test` 0 (4.327 pasan, 7 saltadas), `npm run typecheck` 0, `npm run lint` 0 (0 errores, 165
  avisos), detector de citas 0.
