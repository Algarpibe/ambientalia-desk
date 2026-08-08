import { useEffect, useMemo, useState } from 'react'
import type { Catalogo, CatalogoTipo, CatalogoMarca, CatalogoModelo, Conflictos, ConflictoModelo } from '@ambientalia/shared'
import {
  getCatalogo, getConflictosCatalogo,
  crearTipoCatalogo, crearMarcaCatalogo, crearModeloCatalogo,
  actualizarTipoCatalogo, actualizarMarcaCatalogo, actualizarModeloCatalogo,
  borrarEntradaCatalogo,
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
   */
  async function ejecutar(accion: () => Promise<void>) {
    setError(null)
    try { await accion() }
    catch (e) { setError(e instanceof Error ? e.message : String(e)) }
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
  async function fijarTipoModelo(modelo: CatalogoModelo, tipoId: string | null, discrepanEstimado: number | null) {
    const etiqueta = `${marcaPorId.get(modelo.marcaId)?.nombre ?? '?'} ${modelo.nombre}`
    if (tipoId === null) {
      // Sin tipo elegido no hay nada que "corregir" en los equipos (el servidor ni lo intenta), así
      // que aquí solo se confirma la propia acción de vaciarlo.
      if (!confirm(`${etiqueta}: ¿dejar el modelo sin tipo?`)) return
      await ejecutar(async () => {
        await actualizarModeloCatalogo(modelo.id, { tipoId: null })
        setAviso(`${etiqueta}: se quitó el tipo.`)
        reload()
      })
      return
    }
    const tipoNombre = catalogo?.tipos.find((t) => t.id === tipoId)?.nombre ?? ''
    const pregunta = discrepanEstimado
      ? `${etiqueta}: ${discrepanEstimado} equipo(s) ya registrados declaran otro tipo. ¿Corregirlos también a "${tipoNombre}"? Cancelar deja el tipo del modelo fijado, pero esos equipos sin tocar.`
      : `${etiqueta}: fijar el tipo a "${tipoNombre}". Si algún equipo ya registrado declara otro tipo, ¿quieres corregirlo también?`
    const corregir = confirm(pregunta)
    await ejecutar(async () => {
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
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-left text-slate-500 border-b">
                      <th className="py-2">Marca</th><th>Modelo</th><th>Tipo</th><th>Estado</th><th></th>
                    </tr></thead>
                    <tbody>
                      {modelosOrdenados.map((mo) => (
                        <tr key={mo.id} className={`border-b ${!mo.activo ? 'opacity-50' : ''} ${mo.revisar ? 'bg-amber-50' : ''}`}>
                          <td className="py-2">{marcaPorId.get(mo.marcaId)?.nombre ?? '—'}</td>
                          <td>
                            {mo.nombre}
                            {mo.revisar && <span className="ml-2 text-[9px] uppercase font-bold text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">Pendiente</span>}
                          </td>
                          <td>
                            <select
                              value={mo.tipoId ?? ''}
                              onChange={(e) => fijarTipoModelo(mo, e.target.value || null, null)}
                              className="border border-slate-200 rounded px-1.5 py-1 text-[12px] bg-white"
                            >
                              <option value="">Sin tipo</option>
                              {catalogo.tipos.filter((t) => t.activo || t.id === mo.tipoId).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                          </td>
                          <td>{mo.activo ? 'Activo' : 'Inactivo'}</td>
                          <td className="text-right whitespace-nowrap">
                            <button onClick={() => toggleModelo(mo)} className="text-[12px] text-blue-600 mr-3">{mo.activo ? 'Desactivar' : 'Activar'}</button>
                            <button onClick={() => eliminarModelo(mo)} className="text-[12px] text-red-600">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
