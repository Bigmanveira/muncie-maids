function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

export async function signBookingId(bookingId: string): Promise<string> {
  const secret = Deno.env.get('BOOKING_TOKEN_SECRET')
  if (!secret) throw new Error('Missing BOOKING_TOKEN_SECRET')

  const key = await hmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(bookingId))
  return toHex(signature)
}

export async function verifyBookingToken(bookingId: string, token: string): Promise<boolean> {
  const expected = await signBookingId(bookingId)
  if (expected.length !== token.length) return false

  // Constant-time compare to avoid leaking the valid token via timing.
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  }
  return diff === 0
}
