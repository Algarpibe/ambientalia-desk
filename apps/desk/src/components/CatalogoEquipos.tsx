import { useEffect, useMemo, useState } from 'react'
import type { ArticuloLite, ArticuloModelo, CategoriaModelo, ClaseArticulo, Catalogo, CatalogoTipo, CatalogoMarca, CatalogoModelo, Conflictos, ConflictoModelo, FichaModelo, TipoDocumento } from '@ambientalia/shared'
import { TIPOS_DOCUMENTO, CLASES_ARTICULO } from '@ambientalia/shared'
import {
  ETIQUETA_COLUMNA, PREF_POR_DEFECTO, normalizarPref, moverColumna, columnasVisibles,
  type ColumnaCatalogo, type PrefColumnas,
} from '../lib/columnasCatalogo'
import { cambiosFicha, hayCambios } from '../lib/fichaModelo'

/** Dónde se guarda la preferencia de columnas. Mismo patrón que el resto de ajustes de vista. */
const CLAVE_COLUMNAS = 'catalogo:columnas'

/** En singular para los selectores, en plural para los encabezados de cada lista. */
const ETIQUETA_CLASE: Record<ClaseArticulo, string> = {
  accesorio: 'Accesorio', consumible_repuesto: 'Consumible o repuesto',
}
const ETIQUETA_CLASE_PLURAL: Record<ClaseArticulo, string> = {
  accesorio: 'Accesorios', consumible_repuesto: 'Consumibles y repuestos',
}
import {
  getCatalogo, getConflictosCatalogo,
  crearTipoCatalogo, crearMarcaCatalogo, crearModeloCatalogo,
  actualizarTipoCatalogo, actualizarMarcaCatalogo, actualizarModeloCatalogo,
  borrarEntradaCatalogo,
  getFichaModelo, urlDocumento, crearEnlaceDocumento, subirDocumento, borrarDocumentoModelo,
  buscarArticulos, getArticulosModelo, crearArticuloModelo, actualizarArticuloModelo, borrarArticuloModelo,
  getCategoriasDisponibles, getCategoriasModelo, asignarCategoriaModelo, quitarCategoriaModelo,
  ocultarArticuloModelo, mostrarArticuloModelo,
} from '../api/client'

type Seccion = 'modelos' | 'marcas' | 'tipos'

const SECCIONES: Record<Seccion, { titulo: string; alta: string }> = {
  modelos: { titulo: 'Modelos', alta: 'Nuevo modelo' },
  marcas: { titulo: 'Marcas', alta: 'Nueva marca' },
  tipos: { titulo: 'Tipos', alta: 'Nuevo tipo' },
}

export function CatalogoEquipos({ onClose }: { onClose: () => void }) {
  const [seccion, setSeccion] = useState<Seccion>('modelos')
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null)
  const [conflictos, setConflictos] = useState<Conflictos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [fichaModelo, setFichaModelo] = useState<CatalogoModelo | null>(null)

  // Preferencia de columnas: qué se ve y en qué orden. Se lee saneada — ver `normalizarPref`, que cubre
  // el caso de un guardado de una versión con otras columnas.
  const [pref, setPref] = useState<PrefColumnas>(() => {
    try { return normalizarPref(JSON.parse(localStorage.getItem(CLAVE_COLUMNAS) ?? 'null')) }
    catch { return PREF_POR_DEFECTO }
  })
  const [colsOpen, setColsOpen] = useState(false)
  const [arrastrando, setArrastrando] = useState<ColumnaCatalogo | null>(null)
  const visibles = useMemo(() => columnasVisibles(pref), [pref])

  function guardarPref(p: PrefColumnas) {
    setPref(p)
    try { localStorage.setItem(CLAVE_COLUMNAS, JSON.stringify(p)) } catch { /* modo privado: la sesión sigue */ }
  }
  const alternarColumna = (c: ColumnaCatalogo) =>
    guardarPref({ ...pref, ocultas: pref.ocultas.includes(c) ? pref.ocultas.filter((x) => x !== c) : [...pref.ocultas, c] })
  function soltarColumna(destino: ColumnaCatalogo) {
    if (arrastrando) guardarPref({ ...pref, orden: moverColumna(pref.orden, arrastrando, destino) })
    setArrastrando(null)
  }

  async function reload() {
    try {
      const [c, k] = await Promise.all([getCatalogo(), getConflictosCatalogo()])
      setCatalogo(c); setConflictos(k)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }
  useEffect(() => { reload() }, [])

  const marcaPorId = useMemo(() => new Map((catalogo?.marcas ?? []).map((m) => [m.id, m])), [catalogo])

  /**
   * Envuelve cualquier escritura del catálogo. El servidor ya redacta sus 409 en español y con el
   * conteo exacto ("En uso por 3 equipos. Desactívalo en lugar de borrarlo."): esta pantalla los
   * enseña TAL CUAL en la franja de arriba, así que ninguna acción usa `alert()` para su error — eso
   * los escondería detrás de un cuadro nativo en vez de dejarlos leíbles y quietos en pantalla.
   *
   * Devuelve si la acción salió adelante. Quien solo escribe puede ignorarlo; lo necesita quien tenga
   * que decidir DESPUÉS —la ficha, para no cantar «guardada correctamente» sobre un error.
   */
  async function ejecutar(accion: () => Promise<void>): Promise<boolean> {
    setError(null)
    try { await accion(); return true }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false }
  }

  /**
   * Fija el tipo de un modelo (o lo deja sin tipo). Corregir los equipos que ya declaran otro tipo es
   * SIEMPRE una pregunta aparte, nunca un efecto colateral de guardar (regla del catálogo): por eso
   * usa `confirm()` antes de mandar `corregirEquipos`, igual que `EquiposAdmin` lo usa para el borrado
   * — aquí no es destructivo, pero sí una decisión con consecuencias sobre datos ya registrados, y
   * el proyecto no tiene un componente de diálogo propio para eso.
   *
   * `discrepanEstimado` es el número que ya se ve en el reparto de la bandeja de conflictos (se
   * conoce sin preguntarle al servidor); en una fila normal de la tabla de Modelos no hay reparto a
   * mano, así que la pregunta es genérica y el número real —el que de verdad cambió— se enseña
   * después, en el aviso, con el que devuelve el servidor.
   */
  async function fijarTipoModelo(modelo: CatalogoModelo, tipoId: string | null, discrepanEstimado: number | null): Promise<boolean> {
    const etiqueta = `${marcaPorId.get(modelo.marcaId)?.nombre ?? '?'} ${modelo.nombre}`
    if (tipoId === null) {
      // Sin tipo elegido no hay nada que "corregir" en los equipos (el servidor ni lo intenta), así
      // que aquí solo se confirma la propia acción de vaciarlo.
      if (!confirm(`${etiqueta}: ¿dejar el modelo sin tipo?`)) return false
      return ejecutar(async () => {
        await actualizarModeloCatalogo(modelo.id, { tipoId: null })
        setAviso(`${etiqueta}: se quitó el tipo.`)
        reload()
      })
    }
    const tipoNombre = catalogo?.tipos.find((t) => t.id === tipoId)?.nombre ?? ''
    const pregunta = discrepanEstimado
      ? `${etiqueta}: ${discrepanEstimado} equipo(s) ya registrados declaran otro tipo. ¿Corregirlos también a "${tipoNombre}"? Cancelar deja el tipo del modelo fijado, pero esos equipos sin tocar.`
      : `${etiqueta}: fijar el tipo a "${tipoNombre}". Si algún equipo ya registrado declara otro tipo, ¿quieres corregirlo también?`
    const corregir = confirm(pregunta)
    return ejecutar(async () => {
      const { discrepan } = await actualizarModeloCatalogo(modelo.id, { tipoId, corregirEquipos: corregir })
      setAviso(
        corregir
          ? `${etiqueta}: tipo fijado a "${tipoNombre}". ${discrepan} equipo(s) corregido(s).`
          : discrepan > 0
            ? `${etiqueta}: tipo fijado a "${tipoNombre}". ${discrepan} equipo(s) siguen declarando otro tipo.`
            : `${etiqueta}: tipo fijado a "${tipoNombre}".`,
      )
      reload()
    })
  }

  /**
   * El contenido de una celda según su columna. Vive aquí y no en el JSX de la fila porque el orden de
   * las columnas es variable: pintarlas en un orden fijo dejaría de ser posible.
   *
   * `tipo` no es texto sino el selector que ya existía: fijar el tipo de un modelo es la acción más
   * frecuente de esta pantalla y perderla al rediseñar sería un retroceso.
   */
  function celdaModelo(mo: CatalogoModelo, c: ColumnaCatalogo) {
    switch (c) {
      case 'marca': return marcaPorId.get(mo.marcaId)?.nombre ?? '—'
      case 'modelo': return (
        <>
          {mo.nombre}
          {mo.revisar && <span className="ml-2 text-[9px] uppercase font-bold text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">Pendiente</span>}
        </>
      )
      // Texto, no un desplegable por fila: treinta y cinco selectores abiertos a la vez son ruido y
      // además invitan a cambiar el tipo sin querer. Se edita dentro de la ficha del modelo.
      case 'tipo': return mo.tipoNombre ?? <span className="text-slate-300">Sin tipo</span>
      // El guion en gris distingue «no hay dato» de «está vacío»: sin SKU no hay artículo que enseñar,
      // y con un SKU que no casa tampoco — pero eso último sí se ve, porque el SKU aparece y el nombre no.
      case 'articuloNombre': return mo.articuloNombre ?? <span className="text-slate-300">—</span>
      case 'articuloCategoria': return mo.articuloCategoria ?? <span className="text-slate-300">—</span>
      case 'sku': return mo.sku ? <span className="font-mono text-[12px]">{mo.sku}</span> : <span className="text-slate-300">—</span>
      case 'estado': return mo.activo ? 'Activo' : 'Inactivo'
    }
  }

  /** El reparto de la bandeja ya da, sin preguntarle al servidor, cuántos equipos NO son del tipo elegido. */
  function estimarDiscrepan(conflicto: ConflictoModelo, tipoId: string): number {
    const tipoNombre = catalogo?.tipos.find((t) => t.id === tipoId)?.nombre
    const total = conflicto.reparto.reduce((acc, r) => acc + r.equipos, 0)
    const delTipoElegido = conflicto.reparto.find((r) => r.tipo === tipoNombre)?.equipos ?? 0
    return total - delTipoElegido
  }

  async function toggleTipo(t: CatalogoTipo) {
    await ejecutar(async () => { await actualizarTipoCatalogo(t.id, { activo: !t.activo }); reload() })
  }
  async function toggleMarca(m: CatalogoMarca) {
    await ejecutar(async () => { await actualizarMarcaCatalogo(m.id, { activo: !m.activo }); reload() })
  }
  async function toggleModelo(mo: CatalogoModelo) {
    await ejecutar(async () => { await actualizarModeloCatalogo(mo.id, { activo: !mo.activo }); reload() })
  }

  /** Renombrar es solo de los tipos (ver el aviso de la sección Marcas): `prompt()` con el nombre
   *  actual precargado, mismo patrón que usa `UsersAdmin` para editar cargo/empresa. */
  async function renombrarTipo(t: CatalogoTipo) {
    const nombre = prompt('Nuevo nombre del tipo:', t.nombre)
    if (nombre === null) return
    const limpio = nombre.trim()
    if (!limpio || limpio === t.nombre) return
    await ejecutar(async () => { await actualizarTipoCatalogo(t.id, { nombre: limpio }); reload() })
  }

  async function eliminarTipo(t: CatalogoTipo) {
    if (!confirm(`¿Eliminar el tipo "${t.nombre}"? Solo funciona si ningún modelo lo usa.`)) return
    await ejecutar(async () => { await borrarEntradaCatalogo('tipos', t.id); reload() })
  }
  async function eliminarMarca(m: CatalogoMarca) {
    if (!confirm(`¿Eliminar la marca "${m.nombre}"? Solo funciona si ningún modelo la usa.`)) return
    await ejecutar(async () => { await borrarEntradaCatalogo('marcas', m.id); reload() })
  }
  async function eliminarModelo(mo: CatalogoModelo) {
    const etiqueta = `${marcaPorId.get(mo.marcaId)?.nombre ?? '?'} ${mo.nombre}`
    if (!confirm(`¿Eliminar el modelo "${etiqueta}"? Solo funciona si ningún equipo lo usa.`)) return
    await ejecutar(async () => { await borrarEntradaCatalogo('modelos', mo.id); reload() })
  }

  // Los modelos pendientes de revisar suben arriba: son la razón de más peso para entrar a esta
  // pantalla, y perderlos en medio de una lista larga sería justo lo que la bandeja de arriba evita.
  const modelosOrdenados = useMemo(() => {
    if (!catalogo) return []
    return [...catalogo.modelos].sort((a, b) => {
      if (a.revisar !== b.revisar) return a.revisar ? -1 : 1
      const ma = marcaPorId.get(a.marcaId)?.nombre ?? ''
      const mb = marcaPorId.get(b.marcaId)?.nombre ?? ''
      return ma.localeCompare(mb) || a.nombre.localeCompare(b.nombre)
    })
  }, [catalogo, marcaPorId])

  const hayPendientes = !!conflictos && (conflictos.modelos.length > 0 || conflictos.equiposSinModelo > 0)

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Catálogo de equipos</h1>
        <button onClick={() => setCreando(true)} className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">{SECCIONES[seccion].alta}</button>
      </div>

      <nav className="flex gap-x-6 px-4 border-b border-slate-200 shrink-0 bg-white">
        {(Object.keys(SECCIONES) as Seccion[]).map((s) => (
          <button
            key={s}
            onClick={() => setSeccion(s)}
            className={`text-[12px] font-bold py-2.5 whitespace-nowrap transition-colors ${seccion === s ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {SECCIONES[s].titulo}{catalogo && <span className="text-slate-400 font-normal"> ({catalogo[s].length})</span>}
          </button>
        ))}
      </nav>

      {error && (
        <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2 flex items-center justify-between gap-3 shrink-0">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 shrink-0">Cerrar</button>
        </div>
      )}
      {aviso && (
        <div className="bg-blue-50 text-blue-700 text-[12px] px-4 py-2 flex items-center justify-between gap-3 shrink-0">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} className="text-blue-400 hover:text-blue-700 shrink-0">Cerrar</button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {!catalogo || !conflictos ? (
          <div className="p-6 text-center text-slate-400 text-[13px]">Cargando…</div>
        ) : (
          <>
            {/* La bandeja va arriba de las tres secciones, no dentro de "Modelos": es trabajo
                pendiente de la siembra, no una sección más, y desaparece sola en cuanto se vacía. */}
            {hayPendientes && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
                <h2 className="text-[11px] font-bold text-amber-800 uppercase tracking-wide mb-2">Pendiente de revisar</h2>
                {conflictos.modelos.map((c) => (
                  <div key={c.modeloId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 border-b border-amber-100 last:border-0 text-[13px]">
                    <span className="font-bold text-slate-700 min-w-[200px]">{c.marca} {c.modelo}</span>
                    <span className="text-slate-500 flex-1 min-w-[200px]">{c.reparto.map((r) => `${r.tipo} (${r.equipos})`).join(' · ')}</span>
                    <select
                      defaultValue=""
                      className="border border-amber-300 rounded px-2 py-1 text-[12px] bg-white"
                      onChange={(e) => {
                        const tipoId = e.target.value
                        e.target.value = '' // vuelve a "Elegir…"; el modelo sale de la bandeja solo cuando recarga
                        if (!tipoId) return
                        const modelo = catalogo.modelos.find((m) => m.id === c.modeloId)
                        if (modelo) fijarTipoModelo(modelo, tipoId, estimarDiscrepan(c, tipoId))
                      }}
                    >
                      <option value="">Elegir el tipo bueno…</option>
                      {catalogo.tipos.filter((t) => t.activo).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                ))}
                {conflictos.equiposSinModelo > 0 && (
                  <p className="text-[12px] text-amber-700 mt-2">
                    {conflictos.equiposSinModelo} equipo(s) que la siembra no pudo enlazar a un modelo del catálogo (no tenían marca o modelo). Se arreglan editándolos uno a uno en Registro de equipos.
                  </p>
                )}
              </div>
            )}

            <div className="p-4">
              {seccion === 'modelos' && (
                catalogo.modelos.length === 0 ? (
                  <div className="max-w-[560px] mx-auto mt-10 p-6 text-center border border-dashed border-slate-300 rounded-lg">
                    <p className="font-bold text-slate-700 mb-1">El catálogo está vacío</p>
                    <p className="text-[13px] text-slate-500">
                      Siémbralo primero a partir de los equipos ya registrados: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[12px]">POST /api/admin/seed-catalogo</span>.
                      {' '}Hasta entonces no se puede dar de alta ningún equipo nuevo.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Selector de columnas. Se abre y se cierra; el estado va a localStorage, como el
                        resto de preferencias de vista de la app. */}
                    <div className="flex justify-end mb-2 relative">
                      <button onClick={() => setColsOpen((v) => !v)}
                        className="text-[12px] border border-slate-200 rounded px-2 py-1 bg-white hover:bg-slate-50">
                        Columnas ▾
                      </button>
                      {colsOpen && (
                        <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded shadow p-2 w-56">
                          <p className="text-[11px] text-slate-400 mb-1.5">Arrastra las cabeceras para reordenarlas.</p>
                          {pref.orden.map((c) => (
                            <label key={c} className="flex items-center gap-2 text-[12px] py-0.5 cursor-pointer">
                              <input type="checkbox" checked={!pref.ocultas.includes(c)} onChange={() => alternarColumna(c)} />
                              {ETIQUETA_COLUMNA[c]}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <table className="w-full text-[13px]">
                      <thead><tr className="text-left text-slate-500 border-b bg-slate-50">
                        {/* La miniatura va fuera del sistema de columnas: no es un dato que se oculte ni
                            se reordene, es la identidad visual de la fila — como en el listado de Books. */}
                        <th className="py-2 px-2 w-12"></th>
                        {visibles.map((c) => (
                          // Arrastrar la cabecera reordena. `onDragOver` con preventDefault es lo que
                          // marca la celda como destino válido: sin él, el navegador rechaza el soltar.
                          <th key={c} draggable
                            onDragStart={() => setArrastrando(c)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => soltarColumna(c)}
                            className={`py-2 px-2 font-bold uppercase text-[11px] tracking-wide cursor-move select-none ${arrastrando === c ? 'opacity-40' : ''}`}
                          >
                            {ETIQUETA_COLUMNA[c]}
                          </th>
                        ))}
                        <th className="py-2"></th>
                      </tr></thead>
                      <tbody>
                        {modelosOrdenados.map((mo) => (
                          <tr key={mo.id} className={`border-b hover:bg-slate-50 ${!mo.activo ? 'opacity-50' : ''} ${mo.revisar ? 'bg-amber-50' : ''}`}>
                            <td className="py-2 px-2">
                              <button onClick={() => setFichaModelo(mo)} className="block" title="Abrir la ficha del modelo">
                                {mo.fotoId ? (
                                  <img src={urlDocumento(mo.id, mo.fotoId)} alt=""
                                    className="w-10 h-10 object-contain rounded border border-slate-200 bg-white" />
                                ) : (
                                  // Marcador de posición cuando el modelo aún no tiene foto, para que la
                                  // columna no baile de altura entre filas con y sin imagen.
                                  <span className="w-10 h-10 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 text-[16px]">
                                    ▢
                                  </span>
                                )}
                              </button>
                            </td>
                            {visibles.map((c) => <td key={c} className="py-2.5 px-2 align-middle">{celdaModelo(mo, c)}</td>)}
                            <td className="text-right whitespace-nowrap px-2">
                              <button onClick={() => setFichaModelo(mo)} className="text-[12px] text-blue-600 mr-3">Ficha</button>
                              <button onClick={() => toggleModelo(mo)} className="text-[12px] text-blue-600 mr-3">{mo.activo ? 'Desactivar' : 'Activar'}</button>
                              <button onClick={() => eliminarModelo(mo)} className="text-[12px] text-red-600">Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )
              )}

              {seccion === 'marcas' && (
                <>
                  {/* Se dice en pantalla, no solo en un comentario: quien administra tiene que
                      entender por qué no hay botón de renombrar antes de ir a buscarlo. */}
                  <p className="text-[12px] text-slate-500 mb-3 max-w-[720px]">
                    Las marcas no se renombran: la remisión decide qué accesorios pide leyendo el TEXTO exacto de la marca del equipo, así que cambiarlo alteraría en silencio remisiones de equipos ya registrados. Para retirar una marca mal escrita, desactívala — sale de las altas nuevas sin tocar los equipos que ya la usan.
                  </p>
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-left text-slate-500 border-b">
                      <th className="py-2">Marca</th><th>Estado</th><th></th>
                    </tr></thead>
                    <tbody>
                      {catalogo.marcas.map((m) => (
                        <tr key={m.id} className={`border-b ${m.activo ? '' : 'opacity-50'}`}>
                          <td className="py-2 font-bold">{m.nombre}</td>
                          <td>{m.activo ? 'Activa' : 'Inactiva'}</td>
                          <td className="text-right whitespace-nowrap">
                            <button onClick={() => toggleMarca(m)} className="text-[12px] text-blue-600 mr-3">{m.activo ? 'Desactivar' : 'Activar'}</button>
                            <button onClick={() => eliminarMarca(m)} className="text-[12px] text-red-600">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                      {catalogo.marcas.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-slate-400">Sin marcas.</td></tr>}
                    </tbody>
                  </table>
                </>
              )}

              {seccion === 'tipos' && (
                <>
                  <p className="text-[12px] text-slate-500 mb-3 max-w-[720px]">
                    Los tipos sí se renombran: son una categoría propia del catálogo, no un texto que la remisión lea del equipo. Útil para retirar una variante mal escrita ("EDM 180 C" frente a "EDM180C") sin perder el histórico.
                  </p>
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-left text-slate-500 border-b">
                      <th className="py-2">Tipo</th><th>Estado</th><th></th>
                    </tr></thead>
                    <tbody>
                      {catalogo.tipos.map((t) => (
                        <tr key={t.id} className={`border-b ${t.activo ? '' : 'opacity-50'}`}>
                          <td className="py-2 font-bold">{t.nombre}</td>
                          <td>{t.activo ? 'Activo' : 'Inactivo'}</td>
                          <td className="text-right whitespace-nowrap">
                            <button onClick={() => renombrarTipo(t)} className="text-[12px] text-blue-600 mr-3">Renombrar</button>
                            <button onClick={() => toggleTipo(t)} className="text-[12px] text-blue-600 mr-3">{t.activo ? 'Desactivar' : 'Activar'}</button>
                            <button onClick={() => eliminarTipo(t)} className="text-[12px] text-red-600">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                      {catalogo.tipos.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-slate-400">Sin tipos.</td></tr>}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {creando && catalogo && (
        <NuevaEntradaModal seccion={seccion} catalogo={catalogo} onClose={() => setCreando(false)} onCreated={() => { setCreando(false); reload() }} />
      )}

      {fichaModelo && (
        <FichaModeloModal
          modelo={fichaModelo}
          etiqueta={`${marcaPorId.get(fichaModelo.marcaId)?.nombre ?? '?'} ${fichaModelo.nombre}`}
          tipos={catalogo?.tipos ?? []}
          onFijarTipo={(tipoId) => fijarTipoModelo(fichaModelo, tipoId, null)}
          onGuardado={reload}
          onClose={() => setFichaModelo(null)}
        />
      )}
    </div>
  )
}

function NuevaEntradaModal({ seccion, catalogo, onClose, onCreated }: {
  seccion: Seccion
  catalogo: Catalogo
  onClose: () => void
  onCreated: () => void
}) {
  const [nombre, setNombre] = useState('')
  const [marcaId, setMarcaId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const marcasActivas = catalogo.marcas.filter((m) => m.activo)
  const tiposActivos = catalogo.tipos.filter((t) => t.activo)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      if (seccion === 'tipos') await crearTipoCatalogo(nombre.trim())
      else if (seccion === 'marcas') await crearMarcaCatalogo(nombre.trim())
      else await crearModeloCatalogo({ marcaId, nombre: nombre.trim(), tipoId: tipoId || null })
      onCreated()
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  const field = 'border border-slate-200 rounded p-2 text-[13px]'
  const placeholder = seccion === 'tipos' ? 'Nombre del tipo' : seccion === 'marcas' ? 'Nombre de la marca' : 'Nombre del modelo'

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[420px] flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">{SECCIONES[seccion].alta}</h3>
        {seccion === 'modelos' && (
          <select className={field} value={marcaId} onChange={(e) => setMarcaId(e.target.value)} required>
            <option value="">Marca…</option>
            {marcasActivas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        )}
        <input className={field} autoFocus placeholder={placeholder} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        {seccion === 'modelos' && (
          <select className={field} value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
            <option value="">Sin tipo (se decide después)</option>
            {tiposActivos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        )}
        {seccion !== 'tipos' && (
          <p className="text-[11px] text-slate-400">El nombre no se podrá cambiar después: la remisión lo lee tal cual para decidir qué accesorios pide.</p>
        )}
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Creando…' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}

/**
 * La ficha técnica del modelo, en edición. Vive aparte del listado de Modelos porque no es una fila
 * más: SKU, foto y documentos cuelgan del modelo (35), no del equipo (354), y esta es la única
 * pantalla que los administra — `FichaTecnica` (hoja de vida y ticket) es de solo lectura.
 */
function FichaModeloModal({ modelo, etiqueta, tipos, onFijarTipo, onGuardado, onClose }: {
  modelo: CatalogoModelo
  etiqueta: string
  tipos: CatalogoTipo[]
  /**
   * Delegado al padre: arrastra la confirmación de corregir los equipos que declaren otro tipo.
   * Devuelve si llegó a aplicarse — la pregunta de «¿dejar el modelo sin tipo?» se puede cancelar.
   */
  onFijarTipo: (tipoId: string | null) => Promise<boolean>
  /** Recarga el catálogo de detrás, para que la tabla enseñe el tipo, el SKU y la foto recién guardados. */
  onGuardado: () => void
  onClose: () => void
}) {
  const [ficha, setFicha] = useState<FichaModelo | null>(null)
  // El tipo se guarda en estado local: tras fijarlo, el padre recarga el catálogo pero el `modelo` que
  // este modal recibió sigue siendo el objeto viejo, así que sin esto el selector volvería atrás.
  const [tipoId, setTipoId] = useState(modelo.tipoId ?? '')
  // Y aparte, el tipo tal como está GUARDADO. Desde que el tipo se aplica al pulsar Guardar y no al
  // elegirlo, el desplegable ya no es la verdad: hace falta contra qué comparar para saber si cambió.
  const [tipoGuardado, setTipoGuardado] = useState<string | null>(modelo.tipoId ?? null)
  const [sku, setSku] = useState('')
  // La foto ya no se sube al elegirla: espera aquí hasta Guardar, como el tipo y el SKU.
  const [fotoPendiente, setFotoPendiente] = useState<File | null>(null)
  // Un `<input type="file">` no se puede vaciar por props. Cambiar su `key` lo remonta, y es lo que
  // hace que tras guardar deje de enseñar el nombre de un archivo que ya está subido.
  const [fotoInput, setFotoInput] = useState(0)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [articulos, setArticulos] = useState<ArticuloLite[]>([])
  const [articulosOpen, setArticulosOpen] = useState(false)
  const [listaArticulos, setListaArticulos] = useState<ArticuloModelo[]>([])
  const [categorias, setCategorias] = useState<CategoriaModelo[]>([])
  const [disponibles, setDisponibles] = useState<Array<{ categoria: string; articulos: number }>>([])
  const [libre, setLibre] = useState('')
  const [claseLibre, setClaseLibre] = useState<ClaseArticulo>('accesorio')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Busca artículos mientras se teclea. Desde 2 caracteres, como el buscador de clientes: con menos, la
  // lista es ruido. El `alive` evita que una respuesta lenta pise a otra más reciente.
  useEffect(() => {
    if (sku.trim().length < 2) { setArticulos([]); return }
    let alive = true
    buscarArticulos(sku).then((r) => { if (alive) setArticulos(r) }).catch(() => {})
    return () => { alive = false }
  }, [sku])

  // Vista previa de la foto elegida pero aún sin subir. El `revoke` no es opcional: sin él, cada foto
  // que se prueba deja su blob retenido mientras la pestaña siga abierta.
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  useEffect(() => {
    if (!fotoPendiente) { setVistaPrevia(null); return }
    const url = URL.createObjectURL(fotoPendiente)
    setVistaPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [fotoPendiente])

  async function recargarArticulos() {
    const [arts, cats] = await Promise.all([getArticulosModelo(modelo.id), getCategoriasModelo(modelo.id)])
    setListaArticulos(arts)
    setCategorias(cats)
  }
  // La carga inicial va inline y no llamando a `recargarArticulos`: esa función se redefine en cada
  // render, así que como dependencia dispararía el efecto sin parar, y omitirla deja un aviso del linter.
  useEffect(() => {
    Promise.all([getArticulosModelo(modelo.id), getCategoriasModelo(modelo.id)])
      .then(([arts, cats]) => { setListaArticulos(arts); setCategorias(cats) })
      .catch(() => {})
  }, [modelo.id])
  // Las categorías disponibles son las mismas para todos los modelos, así que se piden una vez.
  useEffect(() => { getCategoriasDisponibles().then(setDisponibles).catch(() => {}) }, [])

  const anadirCat = (clase: ClaseArticulo, categoria: string) =>
    ejecutarConAviso(
      async () => { await asignarCategoriaModelo(modelo.id, clase, categoria); await recargarArticulos() },
      `Categoría «${categoria}» añadida.`,
    )

  // Quitar la categoría retira de golpe todos sus artículos, así que se confirma con el número delante.
  const quitarCat = (c: CategoriaModelo) => {
    if (!confirm(`¿Quitar «${c.categoria}»? Dejarán de aparecer sus ${c.articulos} artículo(s) en este modelo.`)) return
    return ejecutarConAviso(
      async () => { await quitarCategoriaModelo(c.id); await recargarArticulos() },
      `Categoría «${c.categoria}» quitada.`,
    )
  }

  /**
   * Alta de un artículo SUELTO de Books, la contrapartida de asignar una categoría entera.
   *
   * Solo viaja el `itemId`: el sku y el nombre los escribe el servidor leyéndolos de Books. Mandarlos
   * desde aquí dejaría que el mismo artículo acabase con dos grafías, que es justo lo que elegir de
   * Books viene a evitar.
   */
  const anadirDeBooks = (clase: ClaseArticulo, a: ArticuloLite) =>
    ejecutarConAviso(
      async () => { await crearArticuloModelo(modelo.id, { clase, itemId: a.id }); await recargarArticulos() },
      `«${a.nombre}» añadido a ${ETIQUETA_CLASE_PLURAL[clase].toLowerCase()}.`,
    )

  async function anadirLibre() {
    // El nombre se captura ANTES: la acción vacía el campo, así que leerlo después daría un aviso mudo.
    const nombre = libre.trim()
    await ejecutarConAviso(async () => {
      await crearArticuloModelo(modelo.id, { clase: claseLibre, nombre })
      setLibre('')
      await recargarArticulos()
    }, `Artículo «${nombre}» añadido.`)
  }

  // Sin selector de clase por fila: la clase la fija la categoría desde la que se deriva el artículo, y
  // los añadidos a mano la eligen al crearse. Cambiarla suelta invitaría a «arreglar» algo que se
  // recalcula al recargar.
  /** Un derivado no se borra: se marca como «no aplica a este modelo», y el mismo botón lo devuelve. */
  const alternarOculto = (a: ArticuloModelo) => {
    // La guarda va FUERA de la acción: dentro, salir por las buenas contaría como éxito y el aviso
    // diría «desactivado» sin haber desactivado nada.
    if (!a.itemId) return
    const itemId = a.itemId
    return ejecutarConAviso(async () => {
      if (a.activo) await ocultarArticuloModelo(modelo.id, itemId)
      else await mostrarArticuloModelo(modelo.id, itemId)
      await recargarArticulos()
    }, `«${a.nombre}» ${a.activo ? 'desactivado' : 'activado'} para este modelo.`)
  }

  const alternarActivo = (a: ArticuloModelo) =>
    ejecutarConAviso(
      async () => { await actualizarArticuloModelo(a.id, { activo: !a.activo }); await recargarArticulos() },
      `«${a.nombre}» ${a.activo ? 'desactivado' : 'activado'}.`,
    )

  // Desactivar es la vía normal; eliminar borra de verdad, así que se confirma.
  const quitarArticulo = (a: ArticuloModelo) => {
    if (!confirm(`¿Eliminar «${a.nombre}» de la lista? Para retirarlo sin perder el registro, desactívalo.`)) return
    return ejecutarConAviso(
      async () => { await borrarArticuloModelo(a.id); await recargarArticulos() },
      `«${a.nombre}» eliminado de la lista.`,
    )
  }

  async function recargar() {
    const f = await getFichaModelo(modelo.id)
    setFicha(f)
    setSku(f.sku ?? '')
  }
  useEffect(() => {
    getFichaModelo(modelo.id)
      .then((f) => { setFicha(f); setSku(f.sku ?? '') })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [modelo.id])

  /**
   * Igual que `ejecutar` en el componente padre: el error del servidor se enseña tal cual, sin
   * `alert()`, y devuelve si la acción salió adelante.
   */
  async function ejecutar(accion: () => Promise<void>): Promise<boolean> {
    setError(null); setBusy(true)
    try { await accion(); return true }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false }
    finally { setBusy(false) }
  }

  /**
   * Como `ejecutar`, pero además confirma en pantalla lo que se acaba de guardar.
   *
   * Lo usan las acciones de las listas —categorías, artículos, documentos—, que se aplican en el acto
   * y NO pasan por «Guardar». Ese es justo el punto: desde que el botón está arriba y cubre la ficha
   * entera, verlo en gris después de desactivar un artículo se lee como «no se ha guardado», que es lo
   * contrario de lo que pasó. El aviso es lo que cierra ese hueco.
   *
   * Solo sale si la acción salió adelante: cantarlo antes de saberlo diría «desactivado» sobre un 403.
   */
  async function ejecutarConAviso(accion: () => Promise<void>, aviso: string): Promise<boolean> {
    const ok = await ejecutar(accion)
    if (ok) setMensaje(aviso)
    return ok
  }

  const pendientes = cambiosFicha(
    { tipoId: tipoGuardado, sku: ficha?.sku ?? null },
    { tipoId, sku, fotoPendiente: fotoPendiente !== null },
  )

  /**
   * Guarda de una vez los tres campos de la ficha: tipo, foto y SKU.
   *
   * Antes cada uno se aplicaba por su cuenta —el tipo al elegirlo, la foto al soltarla, el SKU con su
   * propio botón—, y el único «Guardar» de la pantalla solo servía para el SKU. Un botón que guarda un
   * campo de tres es una trampa: parece que guarda la ficha.
   *
   * Solo se manda lo que de verdad cambió (`cambiosFicha`), así que abrir la ficha, tocar la foto y
   * guardar no reescribe el SKU ni vuelve a preguntar por los equipos del tipo.
   */
  async function guardarFicha() {
    if (!hayCambios(pendientes)) return
    setMensaje(null)
    // El tipo va aparte y primero: lo aplica el PADRE, que es quien arrastra la pregunta de corregir
    // los equipos que declaren otro tipo. Y se puede cancelar, así que el desplegable vuelve atrás.
    if ('tipoId' in pendientes) {
      const aplicado = await onFijarTipo(pendientes.tipoId ?? null)
      if (!aplicado) { setTipoId(tipoGuardado ?? ''); return }
      setTipoGuardado(pendientes.tipoId ?? null)
    }
    const ok = await ejecutar(async () => {
      if ('sku' in pendientes) await actualizarModeloCatalogo(modelo.id, { sku: pendientes.sku ?? null })
      // La foto se sube la última: es lo más lento y lo único que puede reventar por tamaño, y así un
      // 413 no deja el tipo y el SKU sin aplicar.
      if (pendientes.foto && fotoPendiente) await subirDocumento(modelo.id, 'foto', fotoPendiente.name, fotoPendiente)
      setFotoPendiente(null)
      setFotoInput((n) => n + 1)
      await recargar()
    })
    if (!ok) return
    // La tabla de detrás enseña tipo, SKU, nombre y categoría del artículo, y la miniatura: sin esto
    // habría que cerrar la ficha y volver a entrar para ver lo que se acaba de guardar.
    onGuardado()
    setMensaje('Ficha técnica guardada correctamente')
  }

  async function eliminarDocumento(docId: string, nombre: string) {
    if (!confirm('¿Eliminar este documento de la ficha?')) return
    await ejecutarConAviso(async () => {
      await borrarDocumentoModelo(modelo.id, docId)
      await recargar()
    }, `Documento «${nombre}» eliminado.`)
  }

  const field = 'border border-slate-200 rounded p-2 text-[13px]'

  return (
    <div className="fixed inset-0 z-[85] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-5 w-[600px] max-h-[90vh] overflow-y-auto flex flex-col gap-5">
        {/* El botón vive aquí arriba, junto al título, y no dentro de un campo: guarda la ficha entera,
            así que colgarlo del SKU volvería a sugerir que solo guarda ese. */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-bold text-slate-800">Ficha técnica · {etiqueta}</h3>
          <div className="flex items-center gap-2">
            <button onClick={guardarFicha} disabled={busy || !hayCambios(pendientes)}
              className="bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold disabled:opacity-50">
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><span className="material-symbols-outlined">close</span></button>
          </div>
        </div>

        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        {mensaje && <div className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-2">{mensaje}</div>}

        {!ficha ? (
          <div className="text-center text-slate-400 text-[13px] py-6">Cargando…</div>
        ) : (
          <>
            <section>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tipo</h4>
              {/* El tipo se edita aquí y no en la tabla: allí eran 35 desplegables abiertos a la vez, y
                  cambiar el tipo de un modelo puede arrastrar la corrección de sus equipos. Elegirlo ya
                  no lo aplica: espera a Guardar, con la foto y el SKU. */}
              <select className={`${field} w-full`} value={tipoId}
                onChange={(e) => { setTipoId(e.target.value); setMensaje(null) }}>
                <option value="">Sin tipo</option>
                {tipos.filter((t) => t.activo || t.id === modelo.tipoId).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </section>

            {/* La foto va con el tipo y el SKU, y no al final entre los documentos: los tres son los
                campos que cubre «Guardar», y tenerlos juntos es lo que hace evidente qué guarda. */}
            <section>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Foto</h4>
              {vistaPrevia ? (
                <img src={vistaPrevia} alt="Foto elegida, sin guardar"
                  className="w-[120px] h-[120px] object-contain rounded border border-amber-300 mb-2" />
              ) : ficha.foto ? (
                <img
                  src={ficha.foto.url ?? urlDocumento(modelo.id, ficha.foto.id)}
                  alt={ficha.foto.nombre}
                  className="w-[120px] h-[120px] object-contain rounded border border-slate-200 mb-2"
                />
              ) : (
                <p className="text-[12px] text-slate-400 mb-2">Todavía sin foto.</p>
              )}
              <input
                key={fotoInput}
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => { setFotoPendiente(e.target.files?.[0] ?? null); setMensaje(null) }}
                className="text-[12px]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {fotoPendiente
                  ? 'Elegida, sin guardar todavía: se sube al pulsar Guardar.'
                  : 'Subir una nueva sustituye la anterior: no se acumulan.'}
              </p>
            </section>

            <section>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">SKU</h4>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input className={`${field} w-full`} placeholder="Busca por código o nombre del artículo" value={sku}
                    onFocus={() => setArticulosOpen(true)} onBlur={() => setArticulosOpen(false)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setArticulosOpen(false) }}
                    onChange={(e) => { setSku(e.target.value); setArticulosOpen(true); setMensaje(null) }} />
                  {articulosOpen && articulos.length > 0 && (
                    // `onMouseDown` con preventDefault: sin él, el blur del input cierra la lista antes
                    // de que el clic llegue al botón. Mismo patrón que el buscador de clientes.
                    <ul onMouseDown={(e) => e.preventDefault()} className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
                      {articulos.map((a) => (
                        <li key={a.id}>
                          <button type="button" onClick={() => { setSku(a.sku); setArticulos([]); setArticulosOpen(false); setMensaje(null) }}
                            className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">
                            <span className="font-bold">{a.sku}</span> · {a.nombre}
                            {a.categoria ? <span className="text-slate-400"> · {a.categoria}</span> : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {/* El estado se lee de `ficha`, o sea de lo GUARDADO, no de lo que hay tecleado: mientras
                  escribes no tiene sentido decir que el código no existe. */}
              {ficha.skuArticulo ? (
                <p className="text-[11px] text-slate-500 mt-1">
                  Artículo en Books: <span className="text-slate-700">{ficha.skuArticulo.nombre}</span>
                  {ficha.skuArticulo.categoria ? ` · ${ficha.skuArticulo.categoria}` : ''}
                </p>
              ) : ficha.sku ? (
                <p className="text-[11px] text-amber-600 mt-1">
                  Ningún artículo activo de Zoho Books lleva este código. Puede ser un artículo retirado, o una errata.
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">Elige el artículo de la lista para que quede contrastado con Zoho Books.</p>
              )}
            </section>

            <section>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Accesorios, consumibles y repuestos</h4>
              <p className="text-[11px] text-slate-400 mb-2">
                La lista se calcula desde las categorías de Zoho Books que asignes: lo que se añada allí a una
                categoría aparecerá aquí solo. Un modelo de una serie lleva la categoría de la serie y, si la
                tiene, la suya propia. Y aparte puedes añadir artículos sueltos de Books, para lo que viva en
                una categoría que no le toca a este modelo.
              </p>
              {/* Sin este aviso, el botón «Guardar» en gris después de desactivar un artículo se lee como
                  «no se ha guardado». Dice qué NO pasa por el botón, que es la duda real. */}
              <p className="text-[11px] text-slate-500 mb-2">
                Lo de aquí abajo se guarda solo, al pulsarlo: no espera al botón «Guardar».
              </p>

              {CLASES_ARTICULO.map((clase) => {
                const cats = categorias.filter((c) => c.clase === clase)
                const items = listaArticulos.filter((a) => a.clase === clase)
                return (
                  <div key={clase} className="mb-3 border border-slate-100 rounded p-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">{ETIQUETA_CLASE_PLURAL[clase]}</div>

                    <div className="flex flex-wrap items-center gap-1 mb-1.5">
                      {cats.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5 text-[11px]">
                          {c.categoria} <span className="text-slate-400">({c.articulos})</span>
                          <button onClick={() => quitarCat(c)} className="text-red-600 font-bold" title="Quitar esta categoría">×</button>
                        </span>
                      ))}
                      <select className="text-[11px] border border-slate-200 rounded px-1 py-0.5" value=""
                        onChange={(e) => { if (e.target.value) anadirCat(clase, e.target.value) }}>
                        <option value="">+ categoría de Books…</option>
                        {disponibles
                          .filter((d) => !cats.some((c) => c.categoria === d.categoria))
                          .map((d) => <option key={d.categoria} value={d.categoria}>{d.categoria} ({d.articulos})</option>)}
                      </select>
                    </div>

                    {/* La otra vía de alta, y la que pidió el usuario: un artículo SUELTO de Books, para
                        lo que vive en una categoría que no le toca a este modelo. La categoría trae
                        bloques; esto trae piezas. */}
                    <BuscadorArticuloBooks
                      clase={clase}
                      yaEnLista={new Set(items.map((a) => a.sku || a.itemId || ''))}
                      bloqueado={busy}
                      onElegir={(a) => anadirDeBooks(clase, a)}
                    />

                    {items.length === 0 ? (
                      // «Cero filas» siempre significa «sin definir todavía», nunca «no lleva»: el mensaje
                      // empuja a completarlo en vez de afirmar algo que nadie ha comprobado.
                      <div className="text-[12px] text-slate-400">Sin definir todavía.</div>
                    ) : (
                      <ul className="text-[13px]">
                        {items.map((a) => (
                          <li key={a.id} className={`flex items-center gap-2 py-0.5 ${a.activo ? '' : 'opacity-50'}`}>
                            <span className="flex-1">
                              {a.sku ? <span className="font-bold">{a.sku} · </span> : null}{a.nombre}
                              {a.origen === 'categoria'
                                ? <span className="text-slate-400 text-[11px]"> · {a.categoria}</span>
                                : <span className="text-amber-600 text-[11px]"> · añadido a mano</span>}
                            </span>
                            {/* Un derivado se desactiva pero NO se elimina: no es nuestro, es de Books. La
                                exclusión es por modelo, así que otro modelo con la misma categoría lo
                                sigue viendo, y se revierte con el mismo botón. */}
                            {a.origen === 'categoria' ? (
                              <button onClick={() => alternarOculto(a)} className="text-[11px] text-blue-600">
                                {a.activo ? 'Desactivar' : 'Activar'}
                              </button>
                            ) : (
                              <>
                                <button onClick={() => alternarActivo(a)} className="text-[11px] text-blue-600">{a.activo ? 'Desactivar' : 'Activar'}</button>
                                <button onClick={() => quitarArticulo(a)} className="text-[11px] text-red-600">Eliminar</button>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}

              <div className="flex gap-2">
                <input className={`${field} flex-1`} placeholder="Añadir a mano lo que no exista en Books (p. ej. «Repuestos reemplazados»)" value={libre}
                  onChange={(e) => setLibre(e.target.value)} />
                <select className={field} value={claseLibre} onChange={(e) => setClaseLibre(e.target.value as ClaseArticulo)}>
                  {CLASES_ARTICULO.map((c) => <option key={c} value={c}>{ETIQUETA_CLASE[c]}</option>)}
                </select>
                <button onClick={anadirLibre} disabled={busy || !libre.trim()} className="border border-slate-200 px-3 py-1.5 rounded text-[13px] font-bold disabled:opacity-50">Añadir</button>
              </div>
            </section>

            <section>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Documentos</h4>
              <p className="text-[11px] text-slate-500 mb-2">
                Los documentos también se guardan solos: no esperan al botón «Guardar».
              </p>
              {ficha.documentos.length === 0 ? (
                <p className="text-[12px] text-slate-400 mb-2">Todavía sin documentos.</p>
              ) : (
                <ul className="flex flex-col gap-1 mb-3">
                  {ficha.documentos.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 text-[13px] border-b border-slate-100 pb-1">
                      <a href={d.url ?? urlDocumento(modelo.id, d.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {d.nombre}
                      </a>
                      <span className="text-[11px] text-slate-400 shrink-0">{d.tipo}</span>
                      <button onClick={() => eliminarDocumento(d.id, d.nombre)} className="text-[12px] text-red-600 shrink-0">Eliminar</button>
                    </li>
                  ))}
                </ul>
              )}
              <NuevoDocumento
                modeloId={modelo.id}
                busyExterno={busy}
                onError={setError}
                onAdded={async () => { await recargar(); setMensaje('Documento añadido.') }}
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Buscador de un artículo suelto de Zoho Books para añadirlo a una clase del modelo.
 *
 * Convive con el selector de categorías y no lo sustituye: la categoría trae **bloques** y se mantiene
 * sola cuando Books cambia; esto trae **piezas** de categorías que a este modelo no le tocan, que es lo
 * que faltaba para armar sus repuestos.
 *
 * Lo que ya está en la lista **se enseña marcado, no se esconde**: quien busca «Slides» y no lo ve
 * asume que Books no lo tiene y va a darlo de alta allí; verlo en gris con «ya está» contesta la
 * pregunta que traía.
 */
function BuscadorArticuloBooks({ clase, yaEnLista, bloqueado, onElegir }: {
  clase: ClaseArticulo
  /** SKU —o `itemId` si no tiene— de lo que ya está en ESTA clase. */
  yaEnLista: Set<string>
  bloqueado: boolean
  onElegir: (a: ArticuloLite) => void
}) {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<ArticuloLite[]>([])
  const [abierto, setAbierto] = useState(false)

  // Mismo criterio que el buscador del SKU: desde 2 caracteres, y `alive` para que una respuesta lenta
  // no pise a otra más reciente.
  useEffect(() => {
    if (q.trim().length < 2) { setResultados([]); return }
    let alive = true
    buscarArticulos(q).then((r) => { if (alive) setResultados(r) }).catch(() => {})
    return () => { alive = false }
  }, [q])

  return (
    <div className="relative mb-1.5">
      <input
        className="border border-slate-200 rounded px-2 py-1 text-[12px] w-full"
        placeholder={`+ artículo suelto de Books en ${ETIQUETA_CLASE_PLURAL[clase].toLowerCase()}: código o nombre`}
        value={q}
        disabled={bloqueado}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setAbierto(false) }}
        onChange={(e) => { setQ(e.target.value); setAbierto(true) }}
      />
      {abierto && resultados.length > 0 && (
        // `onMouseDown` con preventDefault: sin él, el blur del input cierra la lista antes de que el
        // clic llegue al botón. Mismo patrón que el buscador de clientes y el del SKU.
        <ul onMouseDown={(e) => e.preventDefault()} className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
          {resultados.map((a) => {
            const ya = yaEnLista.has(a.sku || a.id)
            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={ya}
                  onClick={() => { onElegir(a); setQ(''); setResultados([]); setAbierto(false) }}
                  className={`w-full text-left px-2 py-1.5 text-[12px] ${ya ? 'text-slate-400 cursor-default' : 'hover:bg-slate-100'}`}
                >
                  <span className="font-bold">{a.sku}</span> · {a.nombre}
                  {a.categoria ? <span className="text-slate-400"> · {a.categoria}</span> : null}
                  {ya ? <span className="text-slate-400"> · ya está en la lista</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * El alta de un documento admite dos caminos a propósito: un manual de 30 MB se ENLAZA (nadie quiere
 * guardar ese peso aquí), un instructivo propio de Ambientalia se SUBE. Nunca los dos a la vez.
 */
function NuevoDocumento({ modeloId, busyExterno, onError, onAdded }: {
  modeloId: string
  busyExterno: boolean
  onError: (e: string | null) => void
  onAdded: () => Promise<void>
}) {
  const tiposAlta = TIPOS_DOCUMENTO.filter((t) => t !== 'foto') // la foto tiene su propio bloque, arriba
  const [tipo, setTipo] = useState<TipoDocumento>('manual')
  const [nombre, setNombre] = useState('')
  const [modo, setModo] = useState<'enlace' | 'archivo'>('enlace')
  const [url, setUrl] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const field = 'border border-slate-200 rounded p-2 text-[13px]'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || (modo === 'enlace' ? !url.trim() : !archivo)) return
    setBusy(true); onError(null)
    try {
      if (modo === 'enlace') await crearEnlaceDocumento(modeloId, { tipo, nombre: nombre.trim(), url: url.trim() })
      else await subirDocumento(modeloId, tipo, nombre.trim(), archivo as File)
      setNombre(''); setUrl(''); setArchivo(null)
      await onAdded()
    } catch (err) { onError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  const bloqueado = busy || busyExterno

  return (
    <form onSubmit={submit} className="border border-slate-200 rounded p-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <select className={field} value={tipo} onChange={(e) => setTipo(e.target.value as TipoDocumento)}>
          {tiposAlta.map((t) => <option key={t} value={t}>{t === 'manual' ? 'Manual' : t === 'instructivo' ? 'Instructivo' : 'Guía'}</option>)}
        </select>
        <input className={`${field} flex-1`} placeholder="Nombre del documento" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="flex gap-4 text-[12px] text-slate-600">
        <label className="flex items-center gap-1.5"><input type="radio" checked={modo === 'enlace'} onChange={() => setModo('enlace')} /> Enlace</label>
        <label className="flex items-center gap-1.5"><input type="radio" checked={modo === 'archivo'} onChange={() => setModo('archivo')} /> Archivo</label>
      </div>
      {modo === 'enlace' ? (
        <input className={field} placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
      ) : (
        <input type="file" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} className="text-[12px]" />
      )}
      <p className="text-[11px] text-slate-400">Un manual pesado se enlaza; un instructivo propio de Ambientalia se sube.</p>
      <div className="flex justify-end">
        <button type="submit" disabled={bloqueado} className="bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold disabled:opacity-50">
          {busy ? 'Añadiendo…' : 'Añadir documento'}
        </button>
      </div>
    </form>
  )
}
