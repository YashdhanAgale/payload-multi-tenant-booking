import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import type { CollectionSlug } from 'payload'

dotenv.config({ path: path.resolve(process.cwd(), './.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!process.env.PAYLOAD_SECRET) {
  console.error('❌ PAYLOAD_SECRET is missing from .env!')
  process.exit(1)
}
if (!process.env.DATABASE_URI) {
  console.error('❌ DATABASE_URI is missing from .env!')
  process.exit(1)
}

// ===== Helper to create Rich Text =====
function createRichText(text: string) {
  return {
    root: {
      type: 'doc',
      version: 1,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              version: 1,
              text,
            },
          ],
        },
      ],
      direction: null,
      format: '' as '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify',
      indent: 0,
    },
  }
}

async function main() {
  try {
    console.log('🚀 Manual seed: starting...')

    const { default: config } = await import('../payload.config')
    const pl = await getPayload({ config })
    console.log('✅ Payload initialized')

    // ===== Helper to create a document if it doesn't exist =====
    async function createIfNotExists(collection: CollectionSlug, where: any, data: any) {
      const found = await pl.find({ collection, where, limit: 1, depth: 0 })
      if (found?.totalDocs > 0) return found.docs[0]
      return await pl.create({ collection, data })
    }

    // ===== Tenants =====
    const t1 = await createIfNotExists(
      'tenants',
      { name: { equals: 'Tenant A' } },
      { name: 'Tenant A' },
    )
    const t2 = await createIfNotExists(
      'tenants',
      { name: { equals: 'Tenant B' } },
      { name: 'Tenant B' },
    )
    console.log('Tenants done:', t1.id, t2.id)

    // ===== Users =====
    const createUser = async (
      tenantId: string,
      name: string,
      email: string,
      role: 'attendee' | 'organizer' | 'admin' = 'attendee',
      password = 'Password123!',
    ) => {
      const found = await pl.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        depth: 0,
      })
      if (found?.totalDocs > 0) return found.docs[0]

      return await pl.create({
        collection: 'users',
        data: { name, email, password, role, tenant: tenantId } as const,
      })
    }

    const adminUser = await createUser(t1.id, 'Admin User', 'admin@example.com', 'admin')
    console.log('Created admin:', adminUser.email)

    const t1Organizer = await createUser(t1.id, 'T1 Organizer', 't1org@example.com', 'organizer')
    const t1Attendee1 = await createUser(t1.id, 'T1 Attendee 1', 't1a1@example.com')
    const t1Attendee2 = await createUser(t1.id, 'T1 Attendee 2', 't1a2@example.com')
    const t1Attendee3 = await createUser(t1.id, 'T1 Attendee 3', 't1a3@example.com')

    const t2Organizer = await createUser(t2.id, 'T2 Organizer', 't2org@example.com', 'organizer')
    const t2Attendee1 = await createUser(t2.id, 'T2 Attendee 1', 't2a1@example.com')
    const t2Attendee2 = await createUser(t2.id, 'T2 Attendee 2', 't2a2@example.com')

    // ===== Events =====
    const createEventIfNot = async (
      title: string,
      capacity: number,
      organizerId: string,
      tenantId: string,
      daysFromNow = 1,
    ) => {
      const found = await pl.find({
        collection: 'events',
        where: { title: { equals: title } },
        limit: 1,
        depth: 0,
      })
      if (found?.totalDocs > 0) return found.docs[0]

      return await pl.create({
        collection: 'events',
        data: {
          title,
          description: createRichText(title),
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * daysFromNow),
          capacity,
          organizer: organizerId,
          tenant: tenantId,
        } as any,
      })
    }

    const e1 = await createEventIfNot('T1 Event Big (capacity 2)', 2, t1Organizer.id, t1.id, 1)
    const e2 = await createEventIfNot('T1 Event Small (capacity 1)', 1, t1Organizer.id, t1.id, 2)
    const e3 = await createEventIfNot('T2 Event A (capacity 3)', 3, t2Organizer.id, t2.id, 1)
    const e4 = await createEventIfNot('T2 Event B (capacity 1)', 1, t2Organizer.id, t2.id, 2)

    console.log('Events created:', e1.title, e2.title, e3.title, e4.title)

    // ===== Bookings =====
    const createBookingIfNot = async (eventId: string, userId: string, tenantId: string) => {
      const found = await pl.find({
        collection: 'bookings',
        where: {
          event: { equals: eventId },
          user: { equals: userId },
        },
        limit: 1,
        depth: 0,
      })
      if (found?.totalDocs > 0) return found.docs[0]

      return await pl.create({
        collection: 'bookings',
        data: {
          event: eventId,
          user: userId,
          tenant: tenantId,
          status: 'confirmed',
        } as const,
      })
    }

    try {
      // T1 bookings
      await createBookingIfNot(e1.id, t1Attendee1.id, t1.id)
      await createBookingIfNot(e1.id, t1Attendee2.id, t1.id)
      await createBookingIfNot(e2.id, t1Attendee3.id, t1.id)

      // T2 bookings
      await createBookingIfNot(e3.id, t2Attendee1.id, t2.id)
      await createBookingIfNot(e3.id, t2Attendee2.id, t2.id)

      console.log('Sample bookings created successfully.')
    } catch (err: any) {
      console.warn('⚠️ Skipped creating sample bookings:', err.message || err)
    }

    console.log('✅ Manual seed completed. Admin credentials: admin@example.com / Password123!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Manual seed error:', err)
    process.exit(1)
  }
}

main()
