import type { NextApiRequest, NextApiResponse } from 'next'
import payload from 'payload'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const user = (req as any).user || req.body.user
    if (!user) return res.status(401).json({ error: 'Not authenticated' })

    const { bookingId } = req.body
    if (!bookingId) return res.status(400).json({ error: 'bookingId required' })

    // get booking
    const bRes = await payload.find({
      collection: 'bookings',
      where: { id: { equals: bookingId } },
      limit: 1,
      depth: 0,
    })

    const booking = bRes.docs[0]
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    // ensure same tenant or requester is admin in tenant
    if (booking.tenant !== user.tenant && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // mark booking canceled
    await payload.update({
      collection: 'bookings',
      id: bookingId,
      data: { status: 'canceled' },
    })

    // Find oldest waitlisted booking for same event in same tenant
    const waitlisted = await payload.find({
      collection: 'bookings',
      where: {
        and: [
          { event: { equals: booking.event } },
          { status: { equals: 'waitlisted' } },
          { tenant: { equals: booking.tenant } },
        ],
      },
      sort: 'createdAt',
      limit: 1,
      depth: 0,
    })

    const oldest = waitlisted.docs?.[0]

    if (oldest) {
      // promote it
      await payload.update({
        collection: 'bookings',
        id: oldest.id,
        data: { status: 'confirmed' },
      })
    }

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
