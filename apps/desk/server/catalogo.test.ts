import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

describe('GET /api/articulos (Books)', () => {
  const articulo = (id: string, nombre: string, sku: string, categoria: string, status = 'active') =>
    db.query('INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ($1,$2,$3,$4,$5)', [id, nombre, sku, categoria, status])

  it('busca por SKU y por nombre, y devuelve la categoría', async () => {
    const cookie = await adminCookie()
    await articulo('i1', 'Filtro PM10', 'F-001', 'C&R EDM 180')
    await articulo('i2', 'Bomba de vacío', 'B-002', 'C&R AP Series')
    const { app } = appWith()

    const porSku = await request(app).get('/api/articulos?search=F-001').set('Cookie', cookie)
    expect(porSku.status).toBe(200)
    expect(porSku.body).toEqual([{ id: 'i1', sku: 'F-001', nombre: 'Filtro PM10', categoria: 'C&R EDM 180' }])

    const porNombre = await request(app).get('/api/articulos?search=bomba').set('Cookie', cookie)
    expect(porNombre.body.map((a: { sku: string }) => a.sku)).toEqual(['B-002'])
  })

  // Un artículo retirado en Books no debe ofrecerse para elegir: sería proponer algo que ya no se vende.
  it('no ofrece artículos inactivos', async () => {
    const cookie = await adminCookie()
    await articulo('i-viejo', 'Filtro descatalogado', 'F-OLD', 'C&R EDM 180', 'inactive')
    const { app } = appWith()

    expect((await request(app).get('/api/articulos?search=F-OLD').set('Cookie', cookie)).body).toEqual([])
  })

  it('GET /api/articulos sin sesión → 401', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/articulos?search=x')).status).toBe(401)
  })

  /**
   * El SKU de la ficha era una cadena que alguien tecleaba y no se contrastaba con nada. Ahora la ficha
   * dice **a qué artículo corresponde**, y la pantalla puede enseñarlo o avisar de que no existe.
   *
   * Se resuelve en el servidor y no en el navegador para que la comparación exacta —incluido el no
   * distinguir mayúsculas— viva en un solo sitio.
   */
  it('la ficha del modelo resuelve el artículo de su SKU, o null si ninguno lo lleva', async () => {
    const cookie = await adminCookie()
    await articulo('i1', 'Filtro PM10', 'F-001', 'C&R EDM 180')
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,sku) VALUES ('cmod-1','cmar-1','EDM180C','f-001')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,sku) VALUES ('cmod-2','cmar-1','EDM180D','NO-EXISTE')")
    const { app } = appWith()

    // El SKU se guardó en minúsculas y el artículo lo tiene en mayúsculas: debe casar igual.
    const casa = await request(app).get('/api/catalogo/modelos/cmod-1/ficha').set('Cookie', cookie)
    expect(casa.status).toBe(200)
    expect(casa.body.skuArticulo).toEqual({ id: 'i1', sku: 'F-001', nombre: 'Filtro PM10', categoria: 'C&R EDM 180' })

    const noCasa = await request(app).get('/api/catalogo/modelos/cmod-2/ficha').set('Cookie', cookie)
    expect(noCasa.body.sku).toBe('NO-EXISTE')
    expect(noCasa.body.skuArticulo).toBeNull()
  })
})

describe('Artículos por modelo (accesorios / consumibles / repuestos)', () => {
  const prepararModelo = async () => {
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i1','Filtro PM10','F-001','C&R EDM 180','active')")
  }

  /**
   * Misma regla que el alta de equipos desde el catálogo: lo que identifica al artículo lo escribe el
   * SERVIDOR leyéndolo de Books, no el navegador. Si el nombre viajara desde el cliente, el mismo
   * artículo acabaría con dos grafías y volveríamos al problema que Books viene a resolver.
   */
  it('el alta desde Books toma sku y nombre del artículo, ignorando lo que mande el navegador', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    const { app } = appWith()

    const res = await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
      .send({ clase: 'consumible_repuesto', itemId: 'i1', sku: 'INVENTADO', nombre: 'Nombre inventado' })
    expect(res.status).toBe(201)

    const lista = await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
    expect(lista.body).toEqual([
      { id: expect.any(String), clase: 'consumible_repuesto', origen: 'manual', itemId: 'i1', sku: 'F-001', nombre: 'Filtro PM10', orden: 0, activo: true },
    ])
  })

  /**
   * El corazón del rediseño: el modelo guarda las CATEGORÍAS que le aplican y la lista se deriva de
   * Books. Un APMA-370 lleva `Opcional AP Series` de accesorios y `C&R AP Series` + `C&R APMA-370` de
   * consumibles/repuestos — la de la serie y la del modelo, sumadas.
   */
  it('asigna categorías de consumibles y repuestos, y deriva de ellas la lista', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i2','Maletín','M-1','Opcional AP Series','active')")
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i3','Filtro de serie','S-1','C&R AP Series','active')")
    const { app } = appWith()
    const asignar = (clase: string, categoria: string) =>
      request(app).post('/api/catalogo/modelos/cmod-1/categorias').set('Cookie', cookie).send({ clase, categoria })

    // La vía de bloque queda solo para consumibles y repuestos: accesorios y mano de obra se eligen
    // artículo a artículo, y la puerta se cierra en el SERVIDOR, no solo escondiendo el desplegable.
    expect((await asignar('accesorio', 'Opcional AP Series')).status).toBe(422)
    expect((await asignar('mano_obra', 'Opcional AP Series')).status).toBe(422)
    expect((await asignar('consumible_repuesto', 'C&R AP Series')).status).toBe(201)
    expect((await asignar('consumible_repuesto', 'C&R AP Series')).status).toBe(409) // repetida

    const cats = await request(app).get('/api/catalogo/modelos/cmod-1/categorias').set('Cookie', cookie)
    expect(cats.body).toEqual([
      { id: expect.any(String), clase: 'consumible_repuesto', categoria: 'C&R AP Series', articulos: 1 },
    ])

    // El maletín NO entra: su categoría no llegó a asignarse, así que no lo deriva nadie.
    const lista = await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
    expect(lista.body.map((a: { sku: string; origen: string }) => [a.sku, a.origen])).toEqual([['S-1', 'categoria']])

    // Quitar la categoría retira sus artículos: no hay que borrarlos uno a uno.
    expect((await request(app).delete(`/api/catalogo/categorias/${cats.body[0].id}`).set('Cookie', cookie)).status).toBe(204)
    expect((await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)).body).toEqual([])
  })

  // El selector necesita saber qué categorías existen. Se ofrecen TODAS, no solo las de prefijo `C&R`
  // y `Opcional`: hay artículos relevantes en `Accesorios`, `Meteorología` o `Kunak Air Series`.
  it('lista las categorías disponibles de Books con su conteo', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i2','Tubo','T-1','Accesorios','active')")
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i3','Viejo','V-1','Accesorios','inactive')")
    const { app } = appWith()

    const res = await request(app).get('/api/articulos/categorias').set('Cookie', cookie)
    expect(res.status).toBe(200)
    // Solo cuenta los activos, que son los que la lista derivada acabará mostrando.
    expect(res.body).toEqual([
      { categoria: 'Accesorios', articulos: 1 },
      { categoria: 'C&R EDM 180', articulos: 1 },
    ])
  })

  it('acepta ítems de texto libre, que son los que no tienen artículo en Books', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    const { app } = appWith()

    expect((await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
      .send({ clase: 'accesorio', nombre: 'Manuales' })).status).toBe(201)

    const lista = await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
    expect(lista.body[0]).toMatchObject({ clase: 'accesorio', nombre: 'Manuales' })
    expect(lista.body[0].itemId).toBeUndefined()
  })

  it('rechaza clase desconocida, nombre vacío, artículo inexistente y repetido', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    const { app } = appWith()
    const alta = (body: Record<string, unknown>) =>
      request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie).send(body)

    expect((await alta({ clase: 'inventada', nombre: 'X' })).status).toBe(422)
    expect((await alta({ clase: 'accesorio', nombre: '   ' })).status).toBe(422)
    expect((await alta({ clase: 'consumible_repuesto', itemId: 'no-existe' })).status).toBe(422)
    expect((await alta({ clase: 'accesorio', nombre: 'Manuales' })).status).toBe(201)
    expect((await alta({ clase: 'accesorio', nombre: 'Manuales' })).status).toBe(409)
  })

  it('mueve de clase, desactiva y borra; 404 si el modelo no existe', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    const { app } = appWith()
    const creado = await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
      .send({ clase: 'consumible_repuesto', itemId: 'i1' })
    const id = creado.body.id

    expect((await request(app).patch(`/api/catalogo/articulos/${id}`).set('Cookie', cookie).send({ clase: 'accesorio', activo: false })).status).toBe(200)
    const tras = await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
    expect(tras.body[0]).toMatchObject({ clase: 'accesorio', activo: false })

    expect((await request(app).delete(`/api/catalogo/articulos/${id}`).set('Cookie', cookie)).status).toBe(204)
    expect((await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)).body).toEqual([])

    expect((await request(app).get('/api/catalogo/modelos/no-existe/articulos').set('Cookie', cookie)).status).toBe(404)
  })

  // Leer lo necesita el técnico que prepara una remisión; administrar la lista es otra cosa.
  it('leer exige sesión; escribir exige super administrador', async () => {
    const admin = await adminCookie()
    await prepararModelo()
    const op = await userCookie([])
    const { app } = appWith()

    expect((await request(app).get('/api/catalogo/modelos/cmod-1/articulos')).status).toBe(401)
    expect((await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', op)).status).toBe(200)
    expect((await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', op).send({ clase: 'accesorio', nombre: 'X' })).status).toBe(403)
    expect((await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', admin).send({ clase: 'accesorio', nombre: 'X' })).status).toBe(201)
  })
})

describe('Catálogo maestro de equipos', () => {
  /** Alta por la API, que es el camino que se quiere probar. */
  async function altaBasica(app: ReturnType<typeof appWith>['app'], cookie: string) {
    const tipoId = (await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Analizador de SO2' })).body.id
    const marcaId = (await request(app).post('/api/catalogo/marcas').set('Cookie', cookie).send({ nombre: 'Horiba' })).body.id
    const modeloId = (await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId, nombre: 'APSA-370', tipoId })).body.id
    return { tipoId, marcaId, modeloId }
  }

  it('alta de tipo, marca y modelo; GET los devuelve con el tipo resuelto', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    expect(modeloId).toMatch(/^cmod-/)
    const c = await request(app).get('/api/catalogo').set('Cookie', cookie)
    expect(c.status).toBe(200)
    expect(c.body.modelos[0]).toMatchObject({ nombre: 'APSA-370', tipoNombre: 'Analizador de SO2' })
  })

  it('409 al repetir el nombre de un tipo', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Analizador de SO2' })
    const dup = await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Analizador de SO2' })
    expect(dup.status).toBe(409)
  })

  // Sin claves foráneas en el esquema, la ruta es la única red contra un modelo colgando de nada.
  it('422 si la marca o el tipo del modelo no existen', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { marcaId } = await altaBasica(app, cookie)
    const sinMarca = await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId: 'cmar-inventada', nombre: 'X' })
    expect(sinMarca.status).toBe(422)
    const sinTipo = await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId, nombre: 'Y', tipoId: 'ctip-inventado' })
    expect(sinTipo.status).toBe(422)
  })

  it('409 al borrar un modelo en uso, con el conteo en el mensaje', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    await db.query("INSERT INTO equipos (id,serial,modelo_id) VALUES ('eq-u','A',$1)", [modeloId])
    const res = await request(app).delete(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('1')
  })

  it('PATCH del modelo fija el tipo y devuelve cuántos equipos discrepan', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    const otro = (await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Calibrador Multigas' })).body.id
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-d','A','Horiba','APSA-370','Analizador de SO2',$1)", [modeloId])
    const res = await request(app).patch(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie).send({ tipoId: otro, corregirEquipos: true })
    expect(res.status).toBe(200)
    expect(res.body.discrepan).toBe(1)
    const eq = await db.query("SELECT tipo FROM equipos WHERE id='eq-d'")
    expect(eq.rows[0].tipo).toBe('Calibrador Multigas')
  })

  // `?incluir=` es lo que evita que editar un equipo con un modelo ya desactivado deje el campo en
  // blanco: sin el modelo en la lista, el desplegable no tendría cómo mostrar el valor actual.
  it('?incluir= trae un modelo desactivado que de otro modo no saldría en el listado', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    await request(app).patch(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie).send({ activo: false })

    const sinIncluir = await request(app).get('/api/catalogo').set('Cookie', cookie)
    expect(sinIncluir.body.modelos.find((m: { id: string }) => m.id === modeloId)).toBeUndefined()

    const conIncluir = await request(app).get(`/api/catalogo?incluir=${modeloId}`).set('Cookie', cookie)
    expect(conIncluir.body.modelos.find((m: { id: string }) => m.id === modeloId)).toBeDefined()
  })

  // Esconder el botón no protege el dato: la frontera es el endpoint. Se comprueba en TODAS las
  // rutas de escritura, no en una de muestra.
  it('escribir exige super administrador; leer solo exige sesión', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const { marcaId, modeloId, tipoId } = await altaBasica(app, admin)
    const op = await userCookie(['Servicio Técnico'])

    // El método se resuelve con una cadena de ternarios (no un índice dinámico `obj[metodo]`) para no
    // necesitar `as any`: cada rama llama al método de supertest ya tipado.
    const escrituras: Array<['post' | 'patch' | 'delete', string, object]> = [
      ['post', '/api/catalogo/tipos', { nombre: 'X' }],
      ['post', '/api/catalogo/marcas', { nombre: 'Y' }],
      ['post', '/api/catalogo/modelos', { marcaId, nombre: 'Z', tipoId }],
      ['patch', `/api/catalogo/tipos/${tipoId}`, { nombre: 'W' }],
      ['patch', `/api/catalogo/marcas/${marcaId}`, { activo: false }],
      ['patch', `/api/catalogo/modelos/${modeloId}`, { activo: false }],
      ['delete', `/api/catalogo/modelos/${modeloId}`, {}],
    ]
    const pedir = (metodo: 'post' | 'patch' | 'delete', ruta: string, cuerpo: object, cookie?: string) => {
      const req = metodo === 'post' ? request(app).post(ruta) : metodo === 'patch' ? request(app).patch(ruta) : request(app).delete(ruta)
      return cookie ? req.set('Cookie', cookie).send(cuerpo) : req.send(cuerpo)
    }
    for (const [metodo, ruta, cuerpo] of escrituras) {
      const sinRol = await pedir(metodo, ruta, cuerpo, op)
      expect([metodo, ruta, sinRol.status]).toEqual([metodo, ruta, 403])
      const sinSesion = await pedir(metodo, ruta, cuerpo)
      expect([metodo, ruta, sinSesion.status]).toEqual([metodo, ruta, 401])
    }
    expect((await request(app).get('/api/catalogo').set('Cookie', op)).status).toBe(200)
    expect((await request(app).get('/api/catalogo')).status).toBe(401)
    expect((await request(app).get('/api/catalogo/conflictos').set('Cookie', op)).status).toBe(403)
  })

  // La siembra se dispara a mano UNA vez tras desplegar. Hasta que corre, el catálogo está vacío y
  // no se puede dar de alta ningún equipo, así que es el primer botón que toca alguien en producción.
  it('la siembra puebla el catálogo desde los equipos; 403 no-admin; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ('eq-s1','A','Horiba','APSA-370','Analizador de SO2')")
    const { app } = appWith()

    const res = await request(app).post('/api/admin/seed-catalogo').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ marcasCreadas: 1, tiposCreados: 1, modelosCreados: 1, equiposEnlazados: 1, modelosPorRevisar: 0 })
    expect((await request(app).get('/api/catalogo').set('Cookie', cookie)).body.modelos[0].nombre).toBe('APSA-370')

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/seed-catalogo').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/seed-catalogo')).status).toBe(401)
  })

  // Reejecutarla es el caso real: alguien la dispara dos veces por si acaso. Los deltas se agotan,
  // pero `modelosPorRevisar` tiene que seguir diciendo cuánto queda pendiente — si devolviera 0 se
  // leería como "no hay nada que revisar" justo cuando sí lo hay.
  it('reejecutar la siembra agota los deltas pero sigue contando lo que queda por revisar', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ('eq-a','A','Horiba','APSA-370','Analizador de SO2')")
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ('eq-b','B','Horiba','APSA-370','Calibrador Multigas')")
    const { app } = appWith()

    const primera = await request(app).post('/api/admin/seed-catalogo').set('Cookie', cookie)
    expect(primera.body).toMatchObject({ modelosCreados: 1, conflictosNuevos: 1, modelosPorRevisar: 1 })

    const segunda = await request(app).post('/api/admin/seed-catalogo').set('Cookie', cookie)
    expect(segunda.body).toMatchObject({ modelosCreados: 0, conflictosNuevos: 0, modelosPorRevisar: 1 })
  })

  /** Modelo listo para colgarle ficha. Devuelve su id. */
  async function modeloParaFicha(app: ReturnType<typeof appWith>['app'], cookie: string): Promise<string> {
    const marcaId = (await request(app).post('/api/catalogo/marcas').set('Cookie', cookie).send({ nombre: 'Horiba' })).body.id
    return (await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId, nombre: 'APSA-370' })).body.id
  }

  it('alta de enlace y de fichero; la ficha los devuelve y el proxy sirve el fichero', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)

    const enlace = await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .send({ tipo: 'manual', nombre: 'Manual de usuario', url: 'https://ejemplo/m.pdf' })
    expect(enlace.status).toBe(201)

    const subida = await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .field('tipo', 'foto').field('nombre', 'Vista frontal')
      .attach('archivo', Buffer.from('imagen'), { filename: 'f.png', contentType: 'image/png' })
    expect(subida.status).toBe(201)

    const ficha = await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`).set('Cookie', cookie)
    expect(ficha.status).toBe(200)
    expect(ficha.body.foto).toMatchObject({ nombre: 'Vista frontal', url: null })
    expect(ficha.body.documentos.map((d: { nombre: string }) => d.nombre)).toEqual(['Manual de usuario'])

    const contenido = await request(app).get(`/api/catalogo/modelos/${modeloId}/documentos/${ficha.body.foto.id}/contenido`).set('Cookie', cookie)
    expect(contenido.status).toBe(200)
    expect(contenido.headers['content-type']).toContain('image/png')
    // `image/png` lo parsea supertest como binario: llega en `.body` (Buffer), no en `.text`
    // (que se queda `undefined` para cualquier tipo que superagent trate como binario).
    expect(contenido.body).toEqual(Buffer.from('imagen'))
  })

  // Un enlace no tiene fichero que servir.
  it('404 al pedir el contenido de un documento que es un enlace', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    const id = (await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .send({ tipo: 'manual', nombre: 'M', url: 'https://x' })).body.id
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/documentos/${id}/contenido`).set('Cookie', cookie)).status).toBe(404)
  })

  it('422 sin nombre, sin url ni fichero, o con un tipo que no existe', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    const post = (body: object) => request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie).send(body)
    expect((await post({ tipo: 'manual', nombre: '', url: 'https://x' })).status).toBe(422)
    expect((await post({ tipo: 'manual', nombre: 'M' })).status).toBe(422)
    expect((await post({ tipo: 'inventado', nombre: 'M', url: 'https://x' })).status).toBe(422)
  })

  it('el sku se guarda por el PATCH del modelo y sale en la ficha', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    expect((await request(app).patch(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie).send({ sku: 'SKU-9' })).status).toBe(200)
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`).set('Cookie', cookie)).body.sku).toBe('SKU-9')
  })

  // Es la regresión más fácil de introducir y la más difícil de notar: todo seguiría funcionando,
  // solo más lento cada día que pasara.
  it('GET /api/catalogo sigue sin devolver documentos ni base64', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .field('tipo', 'foto').field('nombre', 'F')
      .attach('archivo', Buffer.from('IMAGENSECRETA'), { filename: 'f.png', contentType: 'image/png' })

    const c = await request(app).get('/api/catalogo').set('Cookie', cookie)
    expect(JSON.stringify(c.body)).not.toContain('IMAGENSECRETA')
    expect(JSON.stringify(c.body)).not.toContain('documentos')
  })

  it('leer la ficha exige sesión; escribir exige super administrador', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, admin)
    const docId = (await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', admin)
      .send({ tipo: 'manual', nombre: 'M', url: 'https://x' })).body.id
    const op = await userCookie(['Servicio Técnico'])

    // Leer: cualquiera con sesión. El técnico tiene que poder abrir el manual.
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`).set('Cookie', op)).status).toBe(200)
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`)).status).toBe(401)

    // Escribir: solo super administrador.
    const alta = `/api/catalogo/modelos/${modeloId}/documentos`
    expect((await request(app).post(alta).set('Cookie', op).send({ tipo: 'manual', nombre: 'X', url: 'https://y' })).status).toBe(403)
    expect((await request(app).post(alta).send({ tipo: 'manual', nombre: 'X', url: 'https://y' })).status).toBe(401)
    const baja = `/api/catalogo/modelos/${modeloId}/documentos/${docId}`
    expect((await request(app).delete(baja).set('Cookie', op)).status).toBe(403)
    expect((await request(app).delete(baja)).status).toBe(401)
    expect((await request(app).delete(baja).set('Cookie', admin)).status).toBe(200)
  })

  // El código ya los maneja bien (leerFicha, existeEnCatalogo y borrarDocumento devuelven todos un
  // "no" limpio), pero solo estaba probado a nivel de repo — nunca por HTTP.
  it('404 sobre un modelo o un documento que no existen', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).get('/api/catalogo/modelos/cmod-inventado/ficha').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).post('/api/catalogo/modelos/cmod-inventado/documentos').set('Cookie', cookie)
      .send({ tipo: 'manual', nombre: 'M', url: 'https://x' })).status).toBe(404)

    const modeloId = await modeloParaFicha(app, cookie)
    expect((await request(app).delete(`/api/catalogo/modelos/${modeloId}/documentos/cdoc-inventado`).set('Cookie', cookie)).status).toBe(404)
  })
})

/**
 * El segundo disparador de avisos: el ticket entra en una fase que le toca a OTRA área. No es la
 * derivación —ahí se nombra a una persona—; aquí el testigo pasa a un cargo.
 */
