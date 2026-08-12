import { describe, it, expect } from 'vitest'
import { clasePropuesta, admiteCategorias } from './articulos'

describe('clasePropuesta', () => {
  // Books agrupa consumibles y repuestos bajo `C&R`, así que de ahí solo se puede sacar «uno de los
  // dos». Se propone consumible por ser el caso frecuente, y el humano lo cambia de un clic.
  it('propone accesorio para las categorías «Opcional …» y consumible para las «C&R …»', () => {
    expect(clasePropuesta('Opcional AP Series')).toBe('accesorio')
    expect(clasePropuesta('C&R EDM 180')).toBe('consumible_repuesto')
  })

  // Las categorías sin prefijo son el equipo en sí, alquileres o catálogo general: no dicen nada sobre
  // el papel del artículo dentro de un modelo. Se cae a accesorio, que es la lista que hoy se usa de
  // verdad —el checklist de la remisión— y por tanto donde antes se notará una clasificación errónea.
  it('cae en accesorio cuando la categoría no dice nada', () => {
    expect(clasePropuesta('Electrodos LAQUA')).toBe('accesorio')
    expect(clasePropuesta('')).toBe('accesorio')
    expect(clasePropuesta(undefined)).toBe('accesorio')
  })

  // El prefijo se compara sin distinguir mayúsculas ni espacios sobrantes: son categorías tecleadas por
  // personas en Books, no un enumerado.
  it('reconoce el prefijo aunque cambie la caja o sobren espacios', () => {
    expect(clasePropuesta('  c&r ocma-500')).toBe('consumible_repuesto')
    expect(clasePropuesta('OPCIONAL NANO')).toBe('accesorio')
  })

  // «C&R» debe ser el PREFIJO, no aparecer en cualquier parte: un artículo llamado «Kit C&R» dentro de
  // otra categoría no es lo mismo que pertenecer a la de consumibles y repuestos de un modelo.
  it('exige que el prefijo esté al principio', () => {
    expect(clasePropuesta('Accesorios C&R varios')).toBe('accesorio')
  })
})

describe('admiteCategorias', () => {
  // La categoría trae BLOQUES: decenas de artículos de una serie entera. Sirve para consumibles y
  // repuestos, donde la lista es la misma para toda la serie.
  it('los consumibles y repuestos se derivan de categorías', () => {
    expect(admiteCategorias('consumible_repuesto')).toBe(true)
  })

  // Accesorios y mano de obra se eligen PIEZA a pieza: de una categoría de serie la mayoría no aplica
  // a la variante concreta, y acababa desactivándose uno a uno.
  it('los accesorios y la mano de obra se eligen artículo a artículo', () => {
    expect(admiteCategorias('accesorio')).toBe(false)
    expect(admiteCategorias('mano_obra')).toBe(false)
  })
})
