import type { NextApiRequest, NextApiResponse } from 'next'
import payload from 'payload'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const user = (req as any).user || req.body.user
    if (!user) return res.status(401).json({ error: 'Not authenticated' })

    const { eventId } = req.body
    if (!eventId) return res.status(400).json({ error: 'eventId required' })

    // Find event to get tenant
    const ev = await payload.find({
      collection: 'events',
      where: { id: { equals: eventId } },
      limit: 1,
      depth: 0,
    })

    const event = ev.docs[0]
    if (!event) return res.status(404).json({ error: 'Event not found' })

    // Create booking
    const newBooking = await payload.create({
      collection: 'bookings',
      data: {
        event: eventId,
        user: user.id,
        tenant: event.tenant,
        status: 'waitlisted',
      },
    })

    return res.status(201).json(newBooking)
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
