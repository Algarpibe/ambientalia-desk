import { createHash } from 'node:crypto'

export interface EquipoRow {
  id: string
  serial: string
  marca: string | null
  modelo: string | null
  tipo: string | null
  cliente_nombre: string | null
  source: string
  raw: unknown
}

function equipoId(serial: string, cliente: string, modelo: string): string {
  return 'eq-' + createHash('sha1').update(`${serial}|${cliente}|${modelo}`).digest('hex').slice(0, 16)
}

export function parseEquiposCsv(text: string): EquipoRow[] {
  const out: EquipoRow[] = []
  const seen = new Set<string>()
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split(';')
    const cliente = (cols[0] ?? '').trim()
    const marca = (cols[1] ?? '').trim()
    const modelo = (cols[2] ?? '').trim()
    const serial = (cols[3] ?? '').trim()
    const tipo = (cols[4] ?? '').trim()
    if (!serial) continue
    if (serial.toLowerCase() === 'numero serie') continue
    if (/prueba/i.test(serial)) continue
    const id = equipoId(serial, cliente, modelo)
    if (seen.has(id)) continue
    seen.add(id)
    out.push({
      id, serial, marca: marca || null, modelo: modelo || null, tipo: tipo || null,
      cliente_nombre: cliente || null, source: 'seed', raw: { cliente, marca, modelo, serial, tipo },
    })
  }
  return out
}
