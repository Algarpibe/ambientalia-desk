import { useState } from 'react';
import type { TicketDetail } from '@ambientalia/shared';
import { useAsync } from '../hooks/useAsync';
import { fetchEquipo } from '../api/client';
import { FichaTecnica } from './FichaTecnica';

/** Formatea "2026-05-19" o ISO a "19 May 2026" (es-CO). Vacío → null. */
function fmtDate(v?: string | null): string | null {
  if (!v) return null;
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

function cf(detail: TicketDetail, key: string): string | null {
  return detail.customFields?.[key] ?? null;
}

/** Sección colapsable del panel. */
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 py-3">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between mb-2">
        <span className="text-[13px] font-bold text-slate-700">{title}</span>
        <span className="material-symbols-outlined text-slate-400 text-[18px]">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  );
}

/** Campo etiqueta/valor. kind controla el formato. */
function Field({ label, value, kind = 'text' }: { label: string; value?: string | null; kind?: 'text' | 'date' | 'email' }) {
  const display = kind === 'date' ? fmtDate(value) : value || null;
  return (
    <div>
      <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
      {display ? (
        <div className={`text-[12px] font-medium ${kind === 'email' ? 'text-blue-600 truncate' : 'text-slate-700'}`}>{display}</div>
      ) : (
        <div className="text-[12px] text-slate-300">—</div>
      )}
    </div>
  );
}

/** Campo tipo checkbox/Sí-No. 'true'/'Sí' = marcado; 'No'/'false' = sin marcar. */
function CheckField({ detail, label, fieldKey }: { detail: TicketDetail; label: string; fieldKey: string }) {
  const raw = cf(detail, fieldKey);
  const checked = raw === 'true' || raw === 'Sí' || raw === 'si';
  return (
    <label className="flex items-start gap-2 cursor-default">
      <input type="checkbox" readOnly checked={checked} className="mt-0.5 accent-blue-600" />
      <span className="text-[12px] text-slate-600 leading-tight">{label}</span>
    </label>
  );
}

const TIME_FIELDS: Array<[string, string]> = [
  ['Fecha creación ticket', 'Fecha creación ticket'],
  ['Fecha Remisión Entrada', 'Fecha Remisión Entrada'],
  ['Fecha Revisión Informe', 'Fecha Revisión Informe'],
  ['Fecha Remisión de Salida', 'Fecha Remisión de Salida'],
  ['Fecha de Cotización', 'Fecha de Cotización'],
  ['Fecha Orden de Venta', 'Fecha Orden De Venta'],
  ['Fecha Orden de Compra', 'Fecha Orden de Compra'],
  ['Fecha Recepción de repuestos', 'Fecha Recepción de repuestos'],
  ['Fecha De Factura', 'Fecha De Factura'],
  ['Fecha Finalización ST', 'Fecha Finalización ST'],
  ['Fecha Entrada de servicio externo', 'Fecha Entrada de servicio externo'],
  ['Fecha Salida Servicio externo', 'Fecha Salida Servicio externo'],
  ['Fecha Notificación por garantía', 'Fecha Notificación por garantía'],
  ['Fecha solicitud SKU', 'Fecha solicitud SKU'],
  ['Fecha Orden de Compra Final', 'Fecha Orden de Compra Final'],
  ['Fecha Orden de Venta Final', 'Fecha Orden de Venta Final'],
];

const PROCESS_FIELDS: Array<[string, string]> = [
  ['Requiere diagnostico Adicional?', 'Requiere diagnostico Adicional?'],
  ['Sticker H.V puesto en el equipo?', 'Sticker H.V puesto en el equipo?'],
  ['Archivo de trazabilidad Actualizado?', 'Archivo de trazabilidad Actualizado?'],
  ['H. V Actualizada?', 'H. V Actualizada?'],
  ['Documentación Almacenada en el Drive?', 'Documentacion Almacenada en el Drive?'],
  ['Remisiones de equipo y/o Partes realizada?', 'Remisiones de equipo y/o Partes realizada?'],
  ['Equipo requiere servicio Técnico?', 'Equipo requiere servicio Técnico?'],
  ['Requiere envío a fábrica o diagnóstico adicional', 'Requiere envío  a fabrica o diagnostico adicional'],
  ['Liberación del ticket sin facturar', 'Liberación del ticket sin facturar'],
  ['Generar plantilla informe', 'Generar plantilla Informe'],
  ['Generar Remisión de Salida', 'Generar Remisión de Salida'],
];

export function TicketProperties({ detail, width = 300 }: { detail: TicketDetail; width?: number }) {
  // El detalle del ticket trae `equipoId` pero no `modeloId`: hace falta el equipo completo para
  // resolverlo y pintar la ficha técnica. Sin `equipoId` no se pide nada.
  const equipoId = detail.equipoId ?? null;
  const { data: equipo } = useAsync(() => (equipoId ? fetchEquipo(equipoId) : Promise.resolve(null)), [equipoId]);
  const modeloId = equipo?.modeloId ?? null;

  return (
    <div style={{ width }} className="border-r border-slate-200 overflow-y-auto bg-white p-4 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-bold text-slate-800">Propiedades de Ticket</h3>
        <span className="material-symbols-outlined text-slate-400 text-[18px]">mode_edit</span>
      </div>

      <Section title="Información de Contacto">
        <div className="text-[14px] font-bold text-slate-800">{detail.contactName || '—'}</div>
        {detail.company && <div className="text-[12px] text-slate-500">{detail.company}</div>}
        {detail.email && <div className="text-[12px] text-blue-600 truncate">{detail.email}</div>}
        {detail.phone && <div className="text-[12px] text-slate-500">{detail.phone}</div>}
      </Section>

      <Section title="Información clave">
        <Field label="Propietario de Ticket" value={detail.ownerName} />
        <div>
          <div className="text-[11px] text-slate-400 mb-0.5">Estado</div>
          <span className="text-[11px] text-orange-600 px-2 py-0.5 bg-orange-50 border border-orange-100 rounded font-bold">{detail.status}</span>
        </div>
        <Field label="Tiempo en espera" value={detail.onholdSince} />
      </Section>

      <Section title="Campos Criterio">
        <Field label="Último Servicio" value={detail.title} />
        {detail.classification && (
          <div>
            <div className="text-[11px] text-slate-400 mb-0.5">Clasificaciones</div>
            <span className="text-[11px] text-orange-600 px-2 py-0.5 bg-orange-50 rounded-full font-bold">{detail.classification}</span>
          </div>
        )}
      </Section>

      <Section title="Información de Ticket">
        <Field label="Código Servicio" value={cf(detail, 'Código Servicio')} />
        <Field label="Nombre de empresa" value={detail.company} />
        <Field label="Correo electrónico" value={detail.email} kind="email" />
        <Field label="NIT." value={cf(detail, 'NIT.')} />
        <Field label="Ciudad" value={cf(detail, 'Ciudad')} />
        <Field label="Dirección" value={cf(detail, 'Dirección')} />
        <Field label="Número de teléfono" value={cf(detail, 'Número de teléfono')} />
        <Field label="Encargado" value={cf(detail, 'Encargado')} />
        <Field label="Orden de Venta" value={cf(detail, 'Orden de Venta')} />
        <Field label="Correo Encargado" value={cf(detail, 'Correo Encargado')} kind="email" />
      </Section>

      <Section title="Información sobre el equipo">
        <Field label="Equipo" value={cf(detail, 'Equipo')} />
        <Field label="Tipo de Servicio" value={cf(detail, 'Tipo de Servicio')} />
        <Field label="Marca" value={cf(detail, 'Marca')} />
        <Field label="Modelo de equipo" value={cf(detail, 'Modelo de equipo')} />
        <Field label="Serial" value={cf(detail, 'Serial')} />
        <Field label="Código Interno" value={cf(detail, 'Código Interno')} />
        <CheckField detail={detail} label="Servicio ejecutado in Situ!" fieldKey="Servicio ejecutado in Situ!" />
      </Section>

      <Section title="Control de tiempos" defaultOpen={false}>
        {TIME_FIELDS.map(([label, key]) => (
          <Field key={key} label={label} value={cf(detail, key)} kind="date" />
        ))}
      </Section>

      <Section title="Información adicional">
        <Field label="Prioridad" value={detail.priority} />
        <Field label="Canal" value={detail.channel} />
        <Field label="Días de entrega" value={cf(detail, 'Días de entrega')} />
        <Field label="Conformidad" value={cf(detail, 'Conformidad')} />
        <Field label="ID Remisión Creator" value={cf(detail, 'ID Remisión Creator')} />
        <CheckField detail={detail} label="Cumple condiciones comerciales" fieldKey="Cumple condiciones comerciales" />
      </Section>

      <Section title="Verificación de procesos" defaultOpen={false}>
        {PROCESS_FIELDS.map(([label, key]) => (
          <CheckField key={key} detail={detail} label={label} fieldKey={key} />
        ))}
        <Field label="Aprobó Test Report?" value={cf(detail, 'Aprobó Test Report?')} />
        <Field label="Equipo y/o partes listas para entrega al cliente?" value={cf(detail, 'Equipo y/o partes listas para entrega al cliente?')} />
      </Section>

      {/* Al final del panel, compacta: el detalle del ticket ya tiene bastantes pestañas, así que
          esto no es una más, sino un bloque más dentro de Propiedades. */}
      {modeloId && <FichaTecnica modeloId={modeloId} compacto />}
    </div>
  );
}
