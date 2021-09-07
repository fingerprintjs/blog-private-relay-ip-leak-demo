export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * @see https://stackoverflow.com/a/33790357/1118709
 */
export function humanizeIp(rawIp: string): string {
  if (rawIp.startsWith('::ffff:')) {
    return rawIp.slice(7)
  }
  return rawIp
}
