import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import type { Resolution, ResolutionAttachment } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchResolution, saveResolution, uploadResolutionImage, deleteResolutionImage, deleteResolution } from '../api/client'

export function ResolucionPanel({ ticketId }: { ticketId: string }) {
  const { data, loading, reload } = useAsync<Resolution>(() => fetchResolution(ticketId), [ticketId])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [atts, setAtts] = useState<ResolutionAttachment[]>([])
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setAtts(data?.attachments ?? []) }, [data])
  useEffect(() => { if (editing && editorRef.current) editorRef.current.innerHTML = DOMPurify.sanitize(data?.html ?? '') }, [editing, data])

  const attUrl = (a: ResolutionAttachment) => `/api/tickets/${ticketId}/resolution/attachments/${a.id}`
  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val)

  async function onSave() {
    setSaving(true); setError(null)
    try { await saveResolution(ticketId, editorRef.current?.innerHTML ?? ''); setEditing(false); reload() }
    catch (e) { setError(String(e)) } finally { setSaving(false) }
  }
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    try { const meta = await uploadResolutionImage(ticketId, f); setAtts((p) => [...p, meta]) } catch (err) { setError(String(err)) }
    if (fileRef.current) fileRef.current.value = ''
  }
  async function onDelete(a: ResolutionAttachment) {
    try { await deleteResolutionImage(ticketId, a.id); setAtts((p) => p.filter((x) => x.id !== a.id)) } catch (err) { setError(String(err)) }
  }
  async function onDeleteResolution() {
    if (!window.confirm('¿Eliminar la resolución y todas sus imágenes?')) return
    try { await deleteResolution(ticketId); reload() } catch (e) { setError(String(e)) }
  }

  if (loading && !data) return <div className="p-4 text-[13px] text-slate-400">Cargando…</div>

  if (!editing) {
    return (
      <div className="p-4 max-w-[900px]">
        {error && <div className="text-[12px] text-red-600 mb-2">{error}</div>}
        {data?.html
          ? <div className="text-[13px] text-slate-700 leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_a]:text-blue-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.html) }} />
          : <div className="text-[13px] text-slate-400">Sin resolución registrada.</div>}
        {atts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {atts.map((a) => (
              <a key={a.id} href={attUrl(a)} target="_blank" rel="noreferrer">
                <img src={attUrl(a)} alt={a.filename} className="h-24 w-24 object-cover rounded border border-slate-200" />
              </a>
            ))}
          </div>
        )}
        {data?.updatedBy && <div className="text-[11px] text-slate-400 mt-3">Actualizado por {data.updatedBy}</div>}
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setEditing(true)} className="bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">{data?.html ? 'Editar' : 'Agregar resolución'}</button>
          {(data?.html || atts.length > 0) && (
            <button onClick={onDeleteResolution} className="border border-red-300 text-red-600 px-3 py-1.5 rounded text-[13px] hover:bg-red-50">Eliminar</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-[900px]">
      {error && <div className="text-[12px] text-red-600 mb-2">{error}</div>}
      <div className="flex items-center gap-1 mb-2 border border-slate-200 rounded p-1 bg-slate-50">
        <button onMouseDown={(e) => { e.preventDefault(); exec('bold') }} className="px-2 py-1 hover:bg-slate-200 rounded font-bold text-[13px]">B</button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('italic') }} className="px-2 py-1 hover:bg-slate-200 rounded italic text-[13px]">I</button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList') }} className="px-2 py-1 hover:bg-slate-200 rounded text-[13px]">• Lista</button>
        <button onMouseDown={(e) => { e.preventDefault(); const u = prompt('URL del enlace:'); if (u) exec('createLink', u) }} className="px-2 py-1 hover:bg-slate-200 rounded text-[13px]">Enlace</button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning className="min-h-[160px] border border-slate-200 rounded p-3 text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300 [&_ul]:list-disc [&_ul]:ml-5 [&_a]:text-blue-600 [&_a]:underline" />
      <div className="flex flex-wrap gap-2 mt-3">
        {atts.map((a) => (
          <div key={a.id} className="relative">
            <img src={attUrl(a)} alt={a.filename} className="h-20 w-20 object-cover rounded border border-slate-200" />
            <button onClick={() => onDelete(a)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] leading-none flex items-center justify-center">×</button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="border border-slate-300 px-3 py-1.5 rounded text-[13px]">Adjuntar imagen</button>
        <button onClick={onSave} disabled={saving} className="bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
        <button onClick={() => { setEditing(false); reload() }} className="text-[13px] text-slate-500">Cancelar</button>
      </div>
    </div>
  )
}
