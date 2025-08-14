import type { CollectionConfig } from 'payload'

export const BookingLogs: CollectionConfig = {
  slug: 'booking-logs',
  admin: {
    useAsTitle: 'action',
  },
  // access: {
  //   read: ({ req: { user } }) => !!user,
  //   create: () => true,
  //   delete: ({ req: { user } }) => !!user && user.role === 'admin',
  // },

  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return { tenant: { equals: user.tenant } }
    },
    create: () => false,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },

  fields: [
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: false,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: false,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'action',
      type: 'select',
      options: [
        { label: 'Create Request', value: 'create_request' },
        { label: 'Auto Waitlist', value: 'auto_waitlist' },
        { label: 'Auto Confirm', value: 'auto_confirm' },
        { label: 'Promote From Waitlist', value: 'promote_from_waitlist' },
        { label: 'Cancel Confirmed', value: 'cancel_confirmed' },
      ],
      required: true,
    },
    {
      name: 'note',
      type: 'text',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
  ],
}
