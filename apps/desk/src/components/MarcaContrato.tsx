import { useAsync } from '../hooks/useAsync'
import { contratoDelTicket, type TicketDeContrato } from '../api/client'

/**
 * Marca «de contrato» en la ficha del ticket (registro-contrato, lote 6; `tickets-core` RQ-TC-23).
 *
 * REGLA 13: la marca sale SÓLO de `GET /api/tickets/:id/contrato` (`contratoDelTicket`, que la deriva al leer). El
 * cliente no mira la orden de venta, ni el lote, ni la vigencia, y no hay ningún control para ponerla o quitarla:
 * nadie la marca a mano (`decision/anexo-53-contratos`). Si la petición falla, no se enseña nada.
 */
export function MarcaContrato({ ticketId }: { ticketId: string }) {
  const { data } = useAsync<TicketDeContrato>(() => contratoDelTicket(ticketId), [ticketId])
  if (!data?.deContrato || !data.contrato) return null
  return (
    <div className="border-t border-slate-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800 shrink-0">
      <span className="font-bold">DE CONTRATO</span> · lote {data.contrato.lote} (subOV {data.subOV}) · contrato nº {data.contrato.id}, vigente hasta el {data.contrato.fechaFin}
    </div>
  )
}
