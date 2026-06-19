export function Pagination({ page, pageSize, total, onPrev, onNext }: { page: number; pageSize: number; total: number; onPrev: () => void; onNext: () => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-center gap-3 py-3 text-[13px] text-slate-600">
      <button className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40" disabled={page <= 1} onClick={onPrev}>Anterior</button>
      <span>Página {page} de {pages} · {total} cerrados</span>
      <button className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40" disabled={page >= pages} onClick={onNext}>Siguiente</button>
    </div>
  )
}
