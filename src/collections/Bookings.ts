import type { CollectionConfig } from 'payload';

const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  WAITLISTED: 'waitlisted',
  CANCELED: 'canceled',
} as const;

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'id',
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user && user.role === 'admin',
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events', 
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users', 
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Confirmed', value: BOOKING_STATUS.CONFIRMED },
        { label: 'Waitlisted', value: BOOKING_STATUS.WAITLISTED },
        { label: 'Canceled', value: BOOKING_STATUS.CANCELED },
      ],
      defaultValue: BOOKING_STATUS.WAITLISTED,
      required: true,
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants', 
      required: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ req, data, operation }) => {
        if (operation !== 'create') return data;

        const { event: eventId, tenant: tenantId } = data as any;

        // Get event doc
        const ev = await req.payload.find({
          collection: 'events',
          where: { id: { equals: eventId } },
          depth: 0,
          limit: 1,
        });

        const eventDoc = ev.docs?.[0];
        if (!eventDoc) throw new Error('Event not found');

        // Count confirmed bookings
        const confirmed = await req.payload.find({
          collection: 'bookings',
          where: {
            and: [
              { event: { equals: eventId } },
              { status: { equals: BOOKING_STATUS.CONFIRMED } },
              { tenant: { equals: tenantId } },
            ],
          },
          depth: 0,
        });

        const confirmedCount = confirmed.totalDocs ?? confirmed.docs.length;

        data.status =
          confirmedCount < eventDoc.capacity
            ? BOOKING_STATUS.CONFIRMED
            : BOOKING_STATUS.WAITLISTED;

        return data;
      },
    ],
    afterChange: [
      async ({ req, doc, previousDoc, operation }) => {
        const oldStatus = previousDoc?.status;
        const newStatus = (doc as any).status;

        const createNotification = async (
          userId: string,
          bookingId: string,
          tenantId: string,
          type: 'booking_confirmed' | 'waitlisted' | 'waitlist_promoted' | 'booking_canceled',
          title: string,
          message: string
        ) => {
          await req.payload.create({
            collection: 'notifications',
            data: {
              user: userId,
              booking: bookingId,
              type,
              title,
              message,
              tenant: tenantId,
            },
          });
        };

        const createLog = async (action: string, note?: string) => {
          await req.payload.create({
            collection: 'booking-logs',
            data: {
              booking: doc.id,
              event: (doc as any).event,
              user: (doc as any).user,
              action,
              note: note || '',
              tenant: (doc as any).tenant,
            },
          });
        };

        if (operation === 'create') {
          if (newStatus === BOOKING_STATUS.CONFIRMED) {
            await createNotification(
              (doc as any).user,
              doc.id,
              (doc as any).tenant,
              'booking_confirmed',
              'Booking Confirmed',
              'Your booking has been confirmed.'
            );
            await createLog('auto_confirm', 'Automatically confirmed on create');
          } else if (newStatus === BOOKING_STATUS.WAITLISTED) {
            await createNotification(
              (doc as any).user,
              doc.id,
              (doc as any).tenant,
              'waitlisted',
              'You are on the waitlist',
              'Event full — you are on the waitlist.'
            );
            await createLog('auto_waitlist', 'Automatically waitlisted on create');
          }
          return;
        }

        if (oldStatus !== newStatus) {
          if (newStatus === BOOKING_STATUS.CONFIRMED) {
            await createNotification(
              (doc as any).user,
              doc.id,
              (doc as any).tenant,
              'booking_confirmed',
              'Booking Confirmed',
              'Your booking has been confirmed.'
            );
            await createLog('auto_confirm', 'Promoted/confirmed');
          } else if (newStatus === BOOKING_STATUS.WAITLISTED) {
            await createNotification(
              (doc as any).user,
              doc.id,
              (doc as any).tenant,
              'waitlisted',
              'You are on the waitlist',
              'Event full — you are on the waitlist.'
            );
            await createLog('auto_waitlist', 'Moved to waitlist');
          } else if (newStatus === BOOKING_STATUS.CANCELED) {
            await createNotification(
              (doc as any).user,
              doc.id,
              (doc as any).tenant,
              'booking_canceled',
              'Booking Cancelled',
              'Your booking was cancelled.'
            );
            await createLog('cancel_confirmed', 'Booking cancelled');
          }
        }
      },
    ],
  },
};
