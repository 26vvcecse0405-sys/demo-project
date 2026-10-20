export function cleanText(input: string, max: number): string {
  return input.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
}

export function normalizeSkillToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, '').trim()
}
