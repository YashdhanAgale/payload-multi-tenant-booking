import type { NextApiRequest, NextApiResponse } from 'next';
import payload from 'payload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const notifications = await payload.find({
      collection: 'notifications',
      where: { and: [{ user: { equals: user.id } }, { read: { equals: false } }] },
      sort: '-createdAt',
      depth: 1,
    });

    return res.status(200).json(notifications);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
