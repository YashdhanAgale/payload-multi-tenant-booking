import type { CollectionConfig, Where } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      // Only show events from user's tenant
      return {
        tenant: { equals: user.tenant as string }, // type-safe
      } as Where
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return ['organizer', 'admin'].includes(user.role)
    },
    update: ({ req: { user }, id }) => {
      if (!user) return false

      if (user.role === 'admin') return true

      // Organizer can only update their own events
      return {
        and: [{ tenant: { equals: user.tenant as string } }, { organizer: { equals: user.id } }],
      } as Where
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'description',
      type: 'richText',
      required: false,
    },
    { name: 'date', type: 'date', required: true },
    { name: 'capacity', type: 'number', required: true },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
  ],
}
