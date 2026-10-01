/**
 * PDF opcional del certificado de fábrica, en el formulario de «Liberación» (F1A-03, RQ-EN-11).
 *
 * Es comodidad y nada más (regla invariable 13): ni marca el PDF como obligatorio ni valida tipo o tamaño. Lo decide el
 * servidor al subir (`routes/certificadoFabrica.ts`: 415 si no es un PDF, 413 si pasa el límite, 409 si aún no hay
 * liberación) y el panel enseña su mensaje tal cual. El PDF no condiciona la liberación ni exime del número.
 */
export function CertificadoFabricaPdf({ archivo, onChange }: { archivo: File | null; onChange: (f: File | null) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-slate-700">PDF del certificado de fábrica</span>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="border border-slate-200 rounded p-2 text-[13px]"
      />
      <span className="text-[11px] text-slate-400">
        Opcional. {archivo ? `Se adjuntará «${archivo.name}» después de liberar.` : 'Se adjunta después de liberar.'}
      </span>
    </div>
  )
}
