import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { claveDesdeBase64, descifrarFichero } from './cifrado'

/**
 * Prueba de restauración (F1F-02, RQ-ZS-20): descifra un objeto bajado del almacenamiento a un volcado de `pg_dump`
 * que luego se restaura con `pg_restore` en una base APARTE. La clave llega por `RESPALDO_CLAVE_CIFRADO`, nunca por
 * argumento, para que no quede en el historial de la consola.
 *
 *     RESPALDO_CLAVE_CIFRADO=… npx tsx apps/desk/server/respaldo/descifrarCli.ts <objeto.dump.enc> <salida.dump>
 */
export async function principal(argv: string[], env: Record<string, string | undefined>): Promise<number> {
  const [entrada, salida] = argv
  if (!entrada || !salida || !env.RESPALDO_CLAVE_CIFRADO) {
    console.error('Uso: RESPALDO_CLAVE_CIFRADO=… npx tsx apps/desk/server/respaldo/descifrarCli.ts <objeto.dump.enc> <salida.dump>')
    return 2
  }
  try {
    await descifrarFichero(entrada, salida, claveDesdeBase64(env.RESPALDO_CLAVE_CIFRADO))
    console.log(`Descifrado: ${salida}`)
    return 0
  } catch (e) {
    console.error(`No se pudo descifrar: ${e instanceof Error ? e.message : String(e)}`)
    return 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  principal(process.argv.slice(2), process.env).then((codigo) => process.exit(codigo))
}
