import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string

export const authClient = createAuthClient(authUrl, {
  adapter: BetterAuthReactAdapter(),
})

export async function getCliveToken(): Promise<string> {
  const token = await authClient.getJWTToken()
  if (!token) throw new Error('Please sign in to use CLIVE memory.')
  return token
}
