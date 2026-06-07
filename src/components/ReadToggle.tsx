export function ReadToggle({ read, onToggle, className }: { read?: boolean; onToggle?: (read: boolean) => void; className?: string }) {
  return (
    <span role="button" tabIndex={0} title={read ? 'Marcar como no leído' : 'Marcar como leído'}
      onClick={(e) => { e.stopPropagation(); onToggle?.(!read) }}
      className={`material-symbols-outlined cursor-pointer text-slate-400 hover:text-slate-600 ${className ?? ''}`}>
      {read ? 'menu_book' : 'book'}
    </span>
  )
}
