export const MAP_COLOR_SCALE = [
  '#e8f0fe', '#c5d9f9', '#9dbef3', '#6fa0ec',
  '#4a85e0', '#2e6bd4', '#1a53b8', '#103d8f',
]

export function getMapColor(count: number, maxCount: number): string {
  if (maxCount === 0 || count === 0) return '#f4f4f5'
  const ratio = count / maxCount
  const idx = Math.min(Math.floor(ratio * MAP_COLOR_SCALE.length), MAP_COLOR_SCALE.length - 1)
  return MAP_COLOR_SCALE[idx]
}
