export default async function seed(payload) {
  try {
    console.log('Seed: starting...')
    
    // Create two tenants
    const t1 = await payload.create({
      collection: 'tenants',
      data: { name: 'Tenant A' },
    })

    const t2 = await payload.create({
      collection: 'tenants',
      data: { name: 'Tenant B' },
    })

    // Helper to create users
    const createUser = async (
      tenantId,
      name,
      email,
      role = 'attendee',
      password = 'Password123!',
    ) => {
      return await payload.create({
        collection: 'users',
        data: {
          name,
          email,
          password,
          role,
          tenant: tenantId,
        },
      })
    }

    // Create admin for tenant A (so you can log in to /admin)
    const adminUser = await createUser(
      t1.id,
      'Admin User',
      'admin@example.com',
      'admin',
      'Password123!',
    )
    console.log('Seed: created admin:', adminUser.email)

    // Create organizer + attendees for Tenant A
    const t1Organizer = await createUser(t1.id, 'T1 Organizer', 't1org@example.com', 'organizer')
    const t1Att1 = await createUser(t1.id, 'T1 Attendee 1', 't1a1@example.com')
    const t1Att2 = await createUser(t1.id, 'T1 Attendee 2', 't1a2@example.com')
    const t1Att3 = await createUser(t1.id, 'T1 Attendee 3', 't1a3@example.com')

    // Tenant B users
    const t2Organizer = await createUser(t2.id, 'T2 Organizer', 't2org@example.com', 'organizer')
    const t2Att1 = await createUser(t2.id, 'T2 Attendee 1', 't2a1@example.com')
    const t2Att2 = await createUser(t2.id, 'T2 Attendee 2', 't2a2@example.com')

    // Create events for tenant A
    const e1 = await payload.create({
      collection: 'events',
      data: {
        title: 'T1 Event Big (capacity 2)',
        description: 'Event 1',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        capacity: 2,
        organizer: t1Organizer.id,
        tenant: t1.id,
      },
    })

    const e2 = await payload.create({
      collection: 'events',
      data: {
        title: 'T1 Event Small (capacity 1)',
        description: 'Event 2',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        capacity: 1,
        organizer: t1Organizer.id,
        tenant: t1.id,
      },
    })

    // Create events for tenant B
    const e3 = await payload.create({
      collection: 'events',
      data: {
        title: 'T2 Event A (capacity 3)',
        description: 'Event A',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        capacity: 3,
        organizer: t2Organizer.id,
        tenant: t2.id,
      },
    })

    const e4 = await payload.create({
      collection: 'events',
      data: {
        title: 'T2 Event B (capacity 1)',
        description: 'Event B',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        capacity: 1,
        organizer: t2Organizer.id,
        tenant: t2.id,
      },
    })

    console.log('Seed: finished. Admin credentials: admin@example.com / Password123!')
  } catch (err) {
    console.error('Seed: error', err)
    throw err
  }
}
