/**
 * Lo que la ventana de borrado necesita decidir y redactar.
 *
 * Vive aquí y no en el componente porque no hay harness de componentes en este proyecto: lo que puede
 * romperse en silencio se extrae a `src/lib` y se prueba, y el componente queda como cableado.
 */
import type { ResumenEliminacion } from '@ambientalia/shared'

/** ¿Queda algo en Drive que haya que rescatar a mano antes de confirmar? */
export function hayRastroEnDrive(r: ResumenEliminacion): boolean {
  return r.drive.length > 0
}

/**
 * El resumen en texto plano, para copiarlo antes de confirmar.
 *
 * Es la copia de seguridad de verdad: la aplicación no puede borrar en Drive, así que estos enlaces
 * son lo único que localiza los documentos cuando la fila ya no exista. Se perdieron cuatro carpetas
 * por no tenerlos (`debt.md:438`).
 *
 * Las filas a cero se incluyen a propósito: en una copia, «Conversaciones: 0» y que no aparezca la
 * línea no dicen lo mismo.
 */
export function resumenEnTexto(r: ResumenEliminacion): string {
  const lineas: string[] = [
    `Ticket #${r.ticket.numero} — ${r.ticket.asunto ?? '(sin asunto)'} [${r.ticket.estado}]`,
    '',
    'Se borra:',
    ...r.filas.map((f) => `  ${f.etiqueta}: ${f.borradas}`),
  ]
  if (r.drive.length) {
    lineas.push('', 'QUEDA EN GOOGLE DRIVE (la aplicación no puede borrarlo):')
    for (const d of r.drive) {
      lineas.push(`  ${d.etiqueta}`)
      const enlaces: Array<[string, string | null]> = [
        ['Carpeta', d.carpetaUrl], ['Documento', d.documentoUrl], ['PDF', d.pdfUrl], ['Etiqueta', d.dymoUrl],
      ]
      for (const [nombre, url] of enlaces) if (url) lineas.push(`    ${nombre}: ${url}`)
    }
  }
  return lineas.join('\n')
}
