#!/usr/bin/env node
/**
 * Instalador del hook de citas (capacidad `citas-verificables`, RQ-CV-12, D9).
 *
 * Va en un `.mjs` con `spawnSync`, no en una línea de `sh` dentro de `package.json`: la guarda en
 * línea (`git rev-parse --git-dir >/dev/null 2>&1 || exit 0`) deja `npm ci` en verde y el hook SIN
 * INSTALAR, en silencio — medido con las tres variantes de sintaxis (Pieza 5 de la propuesta). La
 * mutación de UN signo («sin `.git` → sale 0») la pasan las tres; sólo el signo positivo («con
 * `.git` → instala de verdad») discrimina, y eso exige comprobarlo con `git config --get`, no sólo
 * con el código de salida.
 *
 * Nunca falla `npm ci`: sin `.git`, sin binario `git`, o con `git config` roto, sale con 0 (D4.1,
 * D4.2). Un fallo de `git config` con repositorio presente SÍ se imprime, en voz alta, para que no
 * desaparezca en silencio.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const gitDir = spawnSync('git', ['rev-parse', '--git-dir'], { encoding: 'utf8' })
if (gitDir.status !== 0) {
  // Sin `.git` (status !== 0) o sin binario `git` (status === null): no instala, sale 0.
  process.exit(0)
}

// D9: el repositorio tiene que ser ESTE directorio, no uno anidado dentro de OTRO repositorio. Sin
// esto, un `npm ci` en un directorio sin `.git` propio pero dentro de otro repositorio instalaría
// el hook en la configuración de ese otro.
const toplevel = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' })
if (toplevel.status !== 0) {
  process.exit(0)
}
const normaliza = (p) => path.resolve(p).replace(/\\/g, '/').toLowerCase()
const raizRepo = normaliza(toplevel.stdout.trim())
const cwdActual = normaliza(process.cwd())
if (raizRepo !== cwdActual) {
  console.log(`instalar-hooks: este directorio (${cwdActual}) no es la raíz del repositorio (${raizRepo}); no se instala.`)
  process.exit(0)
}

const config = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { encoding: 'utf8' })
if (config.status !== 0) {
  // D4.2: el fallo se dice en voz alta y `npm ci` SIGUE EN VERDE — un fallo silencioso aquí es
  // exactamente el defecto que este instalador viene a evitar.
  console.log(`instalar-hooks: no se pudo fijar core.hooksPath (${config.stderr.trim()}); npm ci sigue.`)
}
process.exit(0)
