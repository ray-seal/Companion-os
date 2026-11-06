import { createAuthClient } from '@neondatabase/auth'

const authUrl = (import.meta.env.VITE_NEON_AUTH_URL as string).replace(/\\/$/, '')

export const authClient = createAuthClient(authUrl)

export async function getCliveToken(): Promise<string> {
  const response = await fetch(`${authUrl}/token`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Please sign in to use CLIVE memory.')
  }

  const result = await response.json()
  const token = result?.token ?? result?.data?.token
  if (typeof token !== 'string' || !token) {
    throw new Error('Please sign in again to use CLIVE memory.')
  }

  return token
}
