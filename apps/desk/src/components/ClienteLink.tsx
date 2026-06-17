export type ClienteKind = 'contacto' | 'empresa'

export function ClienteLink({ label, kind, id, onOpen, className }: {
  label: string | null | undefined
  kind: ClienteKind
  id: string | null | undefined
  onOpen?: (kind: ClienteKind, id: string) => void
  className?: string
}) {
  if (!label) return null
  if (!id || !onOpen) return <span className={className}>{label}</span>
  return (
    <span role="link" tabIndex={0} onClick={(e) => { e.stopPropagation(); onOpen(kind, id) }}
      className={`text-blue-600 hover:underline cursor-pointer ${className ?? ''}`}>{label}</span>
  )
}
