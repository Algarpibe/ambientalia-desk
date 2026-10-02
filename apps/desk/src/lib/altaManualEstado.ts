import type { Catalogo } from '@ambientalia/shared'
import type { CuerpoAltaManual } from '../api/client'

/** Estado y cuerpo del formulario del alta manual (F1B-15, lote 4). Sólo presentación y transporte: el servidor exige y rechaza. */
export interface AltaManualEstado {
  cliente: boolean
  equipo: boolean
  c: { razonSocial: string; nit: string; contacto: string; telefono: string; correo: string; motivo: string }
  e: { serial: string; confirmacionSerial: string; modeloId: string; noCatalogado: boolean; marca: string; modeloTexto: string; tipo: string; motivo: string; fechaFacturaCompra: string }
}

export const ALTA_MANUAL_VACIA: AltaManualEstado = {
  cliente: false,
  equipo: false,
  c: { razonSocial: '', nit: '', contacto: '', telefono: '', correo: '', motivo: '' },
  e: { serial: '', confirmacionSerial: '', modeloId: '', noCatalogado: false, marca: '', modeloTexto: '', tipo: '', motivo: '', fechaFacturaCompra: '' },
}

/** Nombre y tipo del modelo para la vista previa del código y del asunto (comodidad: el servidor acepta el valor recibido). */
export function modeloManual(m: AltaManualEstado, catalogo: Catalogo | null): { nombre: string; tipo: string } {
  if (m.e.noCatalogado) return { nombre: m.e.modeloTexto.trim(), tipo: m.e.tipo.trim() }
  const mo = catalogo?.modelos.find((x) => x.id === m.e.modeloId)
  return { nombre: mo?.nombre ?? '', tipo: mo?.tipoNombre ?? '' }
}

/** El trozo del cuerpo del alta que añade el modo manual; vacío si ninguno está activo. */
export function cuerpoAltaManual(m: AltaManualEstado, activos: { cliente: boolean; equipo: boolean; enEquipoNuevo: boolean }): CuerpoAltaManual {
  const t = (s: string) => s.trim()
  return {
    ...(activos.cliente ? { clienteManual: { razonSocial: t(m.c.razonSocial), nit: t(m.c.nit), contacto: t(m.c.contacto), telefono: t(m.c.telefono), correo: t(m.c.correo), motivo: t(m.c.motivo) } } : {}),
    ...(activos.equipo ? { equipoManual: {
      serial: t(m.e.serial), confirmacionSerial: t(m.e.confirmacionSerial), motivo: t(m.e.motivo),
      ...(m.e.noCatalogado ? { marca: t(m.e.marca), modeloTexto: t(m.e.modeloTexto), tipo: t(m.e.tipo) } : { modeloId: m.e.modeloId }),
      // Fuera de «Equipo nuevo» no se manda: es de Comercial y el servidor lo rechaza (RQ-HV-17, C-1).
      ...(activos.enEquipoNuevo ? { fechaFacturaCompra: m.e.fechaFacturaCompra } : {}),
    } } : {}),
  }
}
