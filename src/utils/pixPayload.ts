function f(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

function crc16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Remove acentos e caracteres não-ASCII (exigência do padrão BRCode)
function sanitize(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '')
}

export interface PixPayloadParams {
  pixKey: string
  merchantName: string
  merchantCity?: string
  amount?: number
  txId?: string
  description?: string
}

export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity = 'BRASIL',
  amount,
  txId = 'KLOT',
  description,
}: PixPayloadParams): string {
  const name = sanitize(merchantName).substring(0, 25).toUpperCase()
  const city = sanitize(merchantCity).substring(0, 15).toUpperCase()

  // Campo 26 — identificação do arranjo PIX
  let pixInfo = f('00', 'BR.GOV.BCB.PIX') + f('01', pixKey)
  if (description) pixInfo += f('02', sanitize(description).substring(0, 72))
  const f26 = f('26', pixInfo)

  // Campo 62 — dados adicionais (Reference Label obrigatório, deve ser alfanumérico)
  const safeRef = txId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || 'KLOT'
  const f62 = f('62', f('05', safeRef))

  let payload = f('00', '01')
  // Sempre "11" (reutilizável) para QR estático — "12" causa rejeição em alguns
  // bancos (ex: Bradesco) que o tratam como QR dinâmico e tentam validar servidor
  payload += f('01', '11')
  payload += f26
  payload += f('52', '0000')
  payload += f('53', '986')
  if (amount !== undefined) payload += f('54', amount.toFixed(2))
  payload += f('58', 'BR')
  payload += f('59', name)
  payload += f('60', city)
  payload += f62
  // Appended "6304" antes do CRC para que ele entre no cálculo
  payload += '6304'
  payload += crc16(payload)

  return payload
}
