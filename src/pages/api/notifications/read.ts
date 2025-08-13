// import type { NextApiRequest, NextApiResponse } from 'next';
// import payload from 'payload';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') return res.status(405).end();
//   try {
//     const user = (req as any).user;
//     if (!user) return res.status(401).json({ error: 'Not authenticated' });

//     const { id } = req.query as { id: string };

//     // fetch notification
//     const nRes = await payload.find({
//       collection: 'notifications',
//       where: { id: { equals: id } },
//       limit: 1,
//       depth: 0,
//     });
//     const note = nRes.docs?.[0];
//     if (!note) return res.status(404).json({ error: 'Notification not found' });

//     if (note.user !== user.id) return res.status(403).json({ error: 'Forbidden' });

//     const updated = await payload.update({
//       collection: 'notifications',
//       id,
//       data: { read: true },
//       req,
//     });

//     return res.status(200).json(updated);
//   } catch (err: any) {
//     console.error(err);
//     return res.status(500).json({ error: err.message || 'Server error' });
//   }
// }




import type { NextApiRequest, NextApiResponse } from 'next';
import payload from 'payload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { id } = req.query as { id: string };

    // fetch notification
    const nRes = await payload.find({
      collection: 'notifications',
      where: { id: { equals: id } },
      limit: 1,
      depth: 0,
    });
    const note = nRes.docs?.[0];
    if (!note) return res.status(404).json({ error: 'Notification not found' });

    if (note.user !== user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await payload.update({
      collection: 'notifications',
      id,
      data: { read: true },
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
