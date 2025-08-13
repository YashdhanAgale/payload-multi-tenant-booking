import type { NextApiRequest, NextApiResponse } from 'next';
import payload from 'payload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const bookings = await payload.find({
      collection: 'bookings',
      where: { user: { equals: user.id } },
      depth: 2,
      sort: '-createdAt',
    });

    return res.status(200).json(bookings);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
