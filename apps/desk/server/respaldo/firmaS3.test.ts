import { describe, it, expect } from 'vitest'
import { firmarPeticion, hashHex } from './firmaS3'

/**
 * F1F-02 (RQ-ZS-20): la firma SigV4 se prueba contra los dos ejemplos que publica la documentación de S3
 * («Signature Calculations for the Authorization Header: Transferring Payload in a Single Chunk»), con sus
 * credenciales de ejemplo. Si la firma propia se desvía en un byte, el destino rechaza la subida con 403.
 */
const CRED = { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', region: 'us-east-1' }
const FECHA = new Date('2013-05-24T00:00:00Z')
const VACIO = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

describe('firmarPeticion (SigV4, ejemplos de AWS)', () => {
  it('GET con Range: la firma publicada', () => {
    const c = firmarPeticion({ metodo: 'GET', url: new URL('https://examplebucket.s3.amazonaws.com/test.txt'), cabeceras: { Range: 'bytes=0-9' }, hashCuerpo: VACIO, fecha: FECHA }, CRED)
    expect(c.Authorization).toBe('AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request,SignedHeaders=host;range;x-amz-content-sha256;x-amz-date,Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41')
    expect(c['x-amz-date']).toBe('20130524T000000Z')
    expect(c['x-amz-content-sha256']).toBe(VACIO)
  })

  it('PUT con `$` en la clave: la ruta se codifica y la firma es la publicada', () => {
    const cuerpo = 'Welcome to Amazon S3.'
    const c = firmarPeticion({
      metodo: 'PUT', url: new URL('https://examplebucket.s3.amazonaws.com/test$file.text'),
      cabeceras: { Date: 'Fri, 24 May 2013 00:00:00 GMT', 'x-amz-storage-class': 'REDUCED_REDUNDANCY' }, hashCuerpo: hashHex(cuerpo), fecha: FECHA,
    }, CRED)
    expect(hashHex(cuerpo)).toBe('44ce7dd67c959e0d3524ffac1771dfbba87d2b6b4b4e99e42034a8b803f8b072')
    expect(c.Authorization).toBe('AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request,SignedHeaders=date;host;x-amz-content-sha256;x-amz-date;x-amz-storage-class,Signature=98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd')
  })

  it('un puerto explícito entra en host y la región entra en el ámbito', () => {
    const c = firmarPeticion({ metodo: 'PUT', url: new URL('http://localhost:9000/copias/a.enc'), cabeceras: {}, hashCuerpo: 'UNSIGNED-PAYLOAD', fecha: FECHA }, { ...CRED, region: 'auto' })
    expect(c.host).toBe('localhost:9000')
    expect(c.Authorization).toContain('/20130524/auto/s3/aws4_request,')
  })
})
