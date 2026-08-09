import multer from 'multer'

// El límite vive aquí y no en cada ruta porque el manejador central de errores tiene que NOMBRARLO al
// rechazar un fichero. Con un literal por ruta, el mensaje y el límite se desincronizan en cuanto
// alguien cambie uno solo, y el usuario leería un número que no es el que aplica.
export const LIMITE_SUBIDA_BYTES = 10 * 1024 * 1024
export const LIMITE_SUBIDA_MB = LIMITE_SUBIDA_BYTES / 1024 / 1024

/** Multer en memoria con el límite común a las tres puertas que aceptan ficheros. */
export const crearSubida = () =>
  multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITE_SUBIDA_BYTES } })
