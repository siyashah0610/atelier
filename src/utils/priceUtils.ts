export function normalizePrice(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  if (value && typeof value === 'object') {
    const candidate = (value as any).min ?? (value as any).price ?? (value as any).amount ?? (value as any).value
    const n = typeof candidate === 'number' ? candidate : Number(String(candidate ?? ''))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export function formatPrice(value: unknown): string {
  return normalizePrice(value).toFixed(2)
}
