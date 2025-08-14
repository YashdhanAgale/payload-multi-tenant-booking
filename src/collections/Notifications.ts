import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return { user: { equals: user.id } } // Users only see their own notifications
    },
    update: ({ req: { user }, id }) => {
      if (!user) return false
      return { user: { equals: user.id } } // Users can only mark their own as read
    },
    create: () => false, // Only created via hooks
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: false,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Booking Confirmed', value: 'booking_confirmed' },
        { label: 'Waitlisted', value: 'waitlisted' },
        { label: 'Waitlist Promoted', value: 'waitlist_promoted' },
        { label: 'Booking Cancelled', value: 'booking_canceled' },
      ],
      required: true,
    },
    { name: 'title', type: 'text', required: true },
    { name: 'message', type: 'textarea', required: true },
    { name: 'read', type: 'checkbox', defaultValue: false },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
  ],
}
