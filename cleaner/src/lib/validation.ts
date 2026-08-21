export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidPhone(value: string): boolean {
  return digitsOnly(value).length === 10
}
