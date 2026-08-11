import { describe, it, expect } from 'vitest'
import { moverEnLista } from './mover'

describe('moverEnLista', () => {
  /**
   * Las dos direcciones importan y no son simétricas. Quien arrastra hacia ABAJO espera que el
   * elemento quede DESPUÉS del destino; hacia ARRIBA, antes. Sale del desfase de uno: el índice se
   * toma de la lista original y se inserta en la lista ya recortada.
   */
  it('arrastrar hacia abajo deja el elemento después del destino', () => {
    expect(moverEnLista(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual(['b', 'c', 'a', 'd'])
  })

  it('arrastrar hacia arriba lo deja antes del destino', () => {
    expect(moverEnLista(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual(['a', 'd', 'b', 'c'])
  })

  it('soltar sobre sí mismo no cambia nada', () => {
    const l = ['a', 'b', 'c']
    expect(moverEnLista(l, 'b', 'b')).toEqual(['a', 'b', 'c'])
  })

  // Una lista que llegó de fuera puede no tener el elemento: devolverla intacta es preferible a
  // insertar un fantasma o perder uno.
  it('devuelve la lista intacta si alguno de los dos no está', () => {
    expect(moverEnLista(['a', 'b'], 'z', 'a')).toEqual(['a', 'b'])
    expect(moverEnLista(['a', 'b'], 'a', 'z')).toEqual(['a', 'b'])
  })

  it('no muta la lista original', () => {
    const l = ['a', 'b', 'c']
    moverEnLista(l, 'a', 'c')
    expect(l).toEqual(['a', 'b', 'c'])
  })
})
