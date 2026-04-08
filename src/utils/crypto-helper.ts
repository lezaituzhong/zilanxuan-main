// Helper to array buffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return window.btoa(binary)
}

// Helper to format PEM
function formatPEM(b64: string, type: 'PUBLIC' | 'PRIVATE'): string {
  const label = type === 'PUBLIC' ? 'PUBLIC KEY' : 'PRIVATE KEY'
  let pem = `-----BEGIN ${label}-----\n`
  for (let i = 0; i < b64.length; i += 64) {
    pem += b64.substring(i, i + 64) + '\n'
  }
  pem += `-----END ${label}-----\n`
  return pem
}

export interface KeyPairResult {
  publicKey: string | JsonWebKey
  privateKey: string | JsonWebKey
  format: 'PEM' | 'JWK'
  algorithm: string
  timestamp: string
}

export async function generateKeyPair(
  algo: 'RSA' | 'ECC' | 'Ed25519',
  options: { length?: number; curve?: string },
  format: 'PEM' | 'JWK'
): Promise<KeyPairResult> {
  let algorithm: AlgorithmIdentifier | RsaHashedKeyGenParams | EcKeyGenParams
  let usages: KeyUsage[] = ['sign', 'verify'] // Default usages

  if (algo === 'RSA') {
    algorithm = {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: options.length || 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    } as RsaHashedKeyGenParams
  } else if (algo === 'ECC') {
    algorithm = {
      name: 'ECDSA',
      namedCurve: options.curve || 'P-256'
    } as EcKeyGenParams
  } else {
    algorithm = {
      name: 'Ed25519'
    }
  }

  try {
    const keyPair = await window.crypto.subtle.generateKey(
      algorithm,
      true, // extractable
      usages
    ) as CryptoKeyPair

    let pub: string | JsonWebKey
    let priv: string | JsonWebKey

    if (format === 'JWK') {
      pub = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey)
      priv = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey)
    } else {
      const pubBuf = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
      const privBuf = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
      
      pub = formatPEM(arrayBufferToBase64(pubBuf), 'PUBLIC')
      priv = formatPEM(arrayBufferToBase64(privBuf), 'PRIVATE')
    }

    return {
      publicKey: pub,
      privateKey: priv,
      format,
      algorithm: algo,
      timestamp: new Date().toISOString()
    }
  } catch (e: any) {
    throw new Error(`Key generation failed: ${e.message}`)
  }
}
