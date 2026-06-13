const ADMIN_SECRET = process.env.ADMIN_SECRET ?? ''
const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'

export function adminFetch(path: string, options: RequestInit = {}) {
  return fetch(`${WEB_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_SECRET}`,
      ...(options.headers ?? {}),
    },
  })
}
