import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

const configuredAuthUrl = import.meta.env.VITE_NEON_AUTH_URL as string
const authUrl = configuredAuthUrl.endsWith('/') ? configuredAuthUrl.slice(0, -1) : configuredAuthUrl

export const authClient = createAuthClient(authUrl, { adapter: BetterAuthReactAdapter() })

export async function getCliveToken(): Promise<string> {
  const result = await authClient.token()
  if (result.error) throw result.error
  const token = result.data?.token
  if (typeof token !== 'string' || !token) throw new Error('Please sign in again to use CLIVE memory.')
  return token
}
