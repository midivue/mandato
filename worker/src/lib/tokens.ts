import groupNames from '../db/group-names.json'

export function generateToken(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateAnonymousName(): string {
  const random = Math.floor(1000 + Math.random() * 9000)
  return `Anonymous${random}`
}

export function generateGroupName(): string {
  const name = groupNames[Math.floor(Math.random() * groupNames.length)]
  const suffix = String(Math.floor(10 + Math.random() * 90))
  return `${name} ${suffix}`
}
