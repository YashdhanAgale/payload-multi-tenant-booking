import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'

const handler: NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const expire = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;'
  const cookies: string[] = [
    // clear token (server-side required if HttpOnly)
    `payload-token=; Path=/; ${expire} HttpOnly; SameSite=Lax;`,
    // client-visible theme
    `payload-theme=; Path=/; ${expire} SameSite=Lax;`,
    // HMR cookie on root and /admin
    `__next_hmr_refresh_hash__=; Path=/; ${expire} SameSite=Lax;`,
    `__next_hmr_refresh_hash__=; Path=/admin; ${expire} SameSite=Lax;`,
  ]

  res.setHeader('Set-Cookie', cookies)
  res.setHeader('Location', '/admin/login')
  return res.status(302).end()
}

export default handler
