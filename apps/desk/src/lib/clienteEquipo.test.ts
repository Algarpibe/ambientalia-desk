import { describe, it, expect } from 'vitest'
import { avisoClienteSinVincular } from './clienteEquipo'

describe('avisoClienteSinVincular', () => {
  // El fallo que motivó esto: se teclea un nombre nuevo, se guarda, sale bien y no cambia nada. Ni el
  // formulario manda el texto ni el servidor lo aceptaría — `cliente_nombre` se deriva del cliente.
  it('avisa cuando se teclea un nombre distinto y no se eligió de la lista', () => {
    expect(avisoClienteSinVincular({ textoActual: 'Universidad Técnica Federico Santa María', textoOriginal: 'Universidad Federico Santa Maria', clientId: null }))
      .toMatch(/elige el cliente de la lista/i)
  })

  it('no avisa si se eligió un cliente de la lista', () => {
    expect(avisoClienteSinVincular({ textoActual: 'Gecelca S.A. E.S.P.', textoOriginal: 'GECELCA', clientId: 'cli-gec' })).toBeNull()
  })

  /**
   * Un equipo sin `client_id` cuyo cliente NO existe en Books (el caso Sensus) no se puede vincular
   * eligiendo de una lista donde no está. Si el aviso saltara por el solo hecho de que falta el id,
   * ese equipo quedaría imposible de editar para cualquier otra cosa —cambiar su serial, por ejemplo—:
   * un callejón sin salida, que es la trampa que este proyecto ya pagó dos veces en remisiones.
   */
  it('NO avisa si no se tocó el nombre, aunque el equipo siga sin cliente vinculado', () => {
    expect(avisoClienteSinVincular({ textoActual: 'Sensus S.A.S.', textoOriginal: 'Sensus S.A.S.', clientId: null })).toBeNull()
  })

  it('ignora los espacios de más al decidir si el nombre cambió', () => {
    expect(avisoClienteSinVincular({ textoActual: '  Sensus S.A.S. ', textoOriginal: 'Sensus S.A.S.', clientId: null })).toBeNull()
  })

  // En el alta no hay nombre previo, así que cualquier texto sin elegir es el mismo error. Vale más
  // decirlo aquí que dejar que el servidor conteste «El cliente es obligatorio» sobre un campo que el
  // usuario ve relleno.
  it('en un equipo nuevo, escribir sin elegir también avisa', () => {
    expect(avisoClienteSinVincular({ textoActual: 'Cliente Nuevo', textoOriginal: '', clientId: null }))
      .toMatch(/elige el cliente de la lista/i)
  })

  it('en un equipo nuevo con el campo vacío no avisa: de eso ya se encarga el campo obligatorio', () => {
    expect(avisoClienteSinVincular({ textoActual: '', textoOriginal: '', clientId: null })).toBeNull()
  })
})
