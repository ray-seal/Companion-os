import { neon } from '@neondatabase/serverless'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const AUTH_URL = 'https://ep-little-tooth-zaq7ljaz.neonauth.c-2.eu-west-2.aws.neon.tech/clive/auth'
const JWKS = createRemoteJWKSet(new URL(AUTH_URL + '/.well-known/jwks.json'))

async function authenticatedUser(req: any): Promise<string> {
  const header = String(req.headers?.authorization || '')
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw new Error('Sign in to access your private memories.')
  const { payload } = await jwtVerify(token, JWKS, { issuer: AUTH_URL })
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Your sign-in token did not contain a user identity.')
  return payload.sub
}

export default async function handler(req:any,res:any) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Use POST.'}) }
  const env=(globalThis as any).process?.env||{}
  if (!env.DATABASE_URL) return res.status(503).json({error:"My memory cupboard isn't connected to its database yet."})
  try {
    const userId = await authenticatedUser(req)
    const sql=neon(env.DATABASE_URL)
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body
    const action=String(body?.action||'')
    if(action==='save') {
      const project=String(body.project||'General').trim().slice(0,80)||'General'
      const note=String(body.note||'').trim().slice(0,2000)
      if(!note) return res.status(400).json({error:'Give me an actual note to remember.'})
      const rows=await sql`INSERT INTO clive_user_notes (user_id,project,note) VALUES (${userId},${project},${note}) RETURNING id,project,note,created_at`
      return res.status(200).json({ok:true,note:rows[0]})
    }
    if(action==='list') {
      const project=String(body.project||'').trim().slice(0,80)
      const rows=project
        ? await sql`SELECT id,project,note,created_at FROM clive_user_notes WHERE user_id=${userId} AND archived=false AND LOWER(project)=LOWER(${project}) ORDER BY created_at DESC LIMIT 100`
        : await sql`SELECT id,project,note,created_at FROM clive_user_notes WHERE user_id=${userId} AND archived=false ORDER BY created_at DESC LIMIT 100`
      return res.status(200).json({notes:rows})
    }
    return res.status(400).json({error:'Unknown memory action.'})
  } catch(error) {
    if (error instanceof Error && /token|sign in|identity|jwt/i.test(error.message)) return res.status(401).json({error:'Please sign in again to access your memories.'})
    console.error('CLIVE memory error',error)
    return res.status(500).json({error:'My memory cupboard jammed. Try again in a moment.'})
  }
}
