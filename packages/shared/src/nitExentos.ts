import { nitCoincide } from './altaManual'

/**
 * NIT genéricos exentos del `409` de NIT en Books (RQ-TC-57, decision/e154-nit-genericos-exentos).
 *
 * La LISTA es un dato —`public.nit_exentos`— y la lee el servidor; aquí vive sólo la regla de casar, pura. No hay
 * constante espejo de la lista: la tabla es la única fuente. La noción de «mismo NIT» es la del alta (`nitCoincide`),
 * no una segunda implementación, y su guarda del vacío hace que un NIT sin dígitos no sea nunca exento.
 */

/** ¿Es `nit` uno de los exentos? Misma noción de «mismo NIT» que el alta: `nitCoincide`. Lista vacía o NIT sin dígitos: nunca. */
export function esNitExento(nit: unknown, exentos: readonly string[]): boolean { return exentos.some((exento) => nitCoincide(nit, exento)) }
