export const fmt = (n: number) =>
  Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export const showDelta = (d: number) => Math.abs(d) >= 0.3
