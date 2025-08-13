import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // logged-in users can read their own user; admin/organizer will see tenant users via hooks/api
    read: ({ req: { user } }) => {
      if (!user) return false;
      return true; 
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      
      return true;
    },
    create: () => false, 
    delete: ({ req: { user } }) => !!user && user.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Attendee', value: 'attendee' },
        { label: 'Organizer', value: 'organizer' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'attendee',
      required: true,
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
  ],
};
