// import type { NextApiRequest, NextApiResponse } from 'next';
// import payload from 'payload';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'GET') return res.status(405).end();
//   try {
//     const user = (req as any).user;
//     if (!user) return res.status(401).json({ error: 'Not authenticated' });

//     // Organizer's tenant
//     const tenantId = user.tenant;
//     if (!tenantId) return res.status(400).json({ error: 'No tenant in user' });

//     // upcoming events for tenant
//     const events = await payload.find({
//       collection: 'events',
//       where: {
//         and: [
//           { tenant: { equals: tenantId } },
//           { date: { greater_than: new Date().toISOString() } },
//         ],
//       },
//       sort: 'date',
//       depth: 0,
//     });

//     // For each event, get counts
//     const eventsWithCounts = await Promise.all(
//       events.docs.map(async (ev: any) => {
//         const confirmed = await payload.find({
//           collection: 'bookings',
//           where: {
//             and: [{ event: { equals: ev.id } }, { status: { equals: 'confirmed' } }, { tenant: { equals: tenantId } }],
//           },
//           depth: 0,
//           limit: 1,
//         });
//         const waitlisted = await payload.find({
//           collection: 'bookings',
//           where: {
//             and: [{ event: { equals: ev.id } }, { status: { equals: 'waitlisted' } }, { tenant: { equals: tenantId } }],
//           },
//           depth: 0,
//           limit: 1,
//         });
//         const canceled = await payload.find({
//           collection: 'bookings',
//           where: {
//             and: [{ event: { equals: ev.id } }, { status: { equals: 'canceled' } }, { tenant: { equals: tenantId } }],
//           },
//           depth: 0,
//           limit: 1,
//         });

//         const confirmedCount = confirmed.totalDocs ?? (confirmed.docs?.length ?? 0);
//         const waitlistedCount = waitlisted.totalDocs ?? (waitlisted.docs?.length ?? 0);
//         const canceledCount = canceled.totalDocs ?? (canceled.docs?.length ?? 0);

//         const percentageFilled = ev.capacity > 0 ? (confirmedCount / ev.capacity) * 100 : 0;

//         return {
//           id: ev.id,
//           title: ev.title,
//           date: ev.date,
//           capacity: ev.capacity,
//           confirmedCount,
//           waitlistedCount,
//           canceledCount,
//           percentageFilled,
//         };
//       })
//     );

//     // Summary analytics
//     const totalEvents = events.totalDocs ?? events.docs.length;
//     const confirmedAll = await payload.find({
//       collection: 'bookings',
//       where: [{ tenant: { equals: tenantId } }, { status: { equals: 'confirmed' } }],
//       limit: 1,
//       depth: 0,
//     });
//     const waitlistedAll = await payload.find({
//       collection: 'bookings',
//       where: [{ tenant: { equals: tenantId } }, { status: { equals: 'waitlisted' } }],
//       limit: 1,
//       depth: 0,
//     });
//     const canceledAll = await payload.find({
//       collection: 'bookings',
//       where: [{ tenant: { equals: tenantId } }, { status: { equals: 'canceled' } }],
//       limit: 1,
//       depth: 0,
//     });

//     // recent activity feed: last 5 booking logs
//     const recentLogs = await payload.find({
//       collection: 'booking-logs',
//       where: { tenant: { equals: tenantId } },
//       limit: 5,
//       sort: '-createdAt',
//       depth: 2,
//     });

//     return res.status(200).json({
//       events: eventsWithCounts,
//       summary: {
//         totalEvents,
//         totalConfirmed: confirmedAll.totalDocs ?? confirmedAll.docs.length,
//         totalWaitlisted: waitlistedAll.totalDocs ?? waitlistedAll.docs.length,
//         totalCanceled: canceledAll.totalDocs ?? canceledAll.docs.length,
//       },
//       recentLogs: recentLogs.docs,
//     });
//   } catch (err: any) {
//     console.error(err);
//     return res.status(500).json({ error: err.message || 'Server error' });
//   }
// }



import type { NextApiRequest, NextApiResponse } from 'next';
import payload from 'payload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const tenantId = user.tenant;
    if (!tenantId) return res.status(400).json({ error: 'No tenant in user' });

    // Get upcoming events for this tenant
    const events = await payload.find({
      collection: 'events',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { date: { greater_than: new Date().toISOString() } },
        ],
      },
      sort: 'date',
      depth: 0,
    });

    // Add booking counts for each event
    const eventsWithCounts = await Promise.all(
      events.docs.map(async (ev: any) => {
        const [confirmed, waitlisted, canceled] = await Promise.all([
          payload.find({
            collection: 'bookings',
            where: { and: [{ event: { equals: ev.id } }, { status: { equals: 'confirmed' } }, { tenant: { equals: tenantId } }] },
            depth: 0,
            limit: 1,
          }),
          payload.find({
            collection: 'bookings',
            where: { and: [{ event: { equals: ev.id } }, { status: { equals: 'waitlisted' } }, { tenant: { equals: tenantId } }] },
            depth: 0,
            limit: 1,
          }),
          payload.find({
            collection: 'bookings',
            where: { and: [{ event: { equals: ev.id } }, { status: { equals: 'canceled' } }, { tenant: { equals: tenantId } }] },
            depth: 0,
            limit: 1,
          }),
        ]);

        const confirmedCount = confirmed.totalDocs ?? confirmed.docs.length;
        const waitlistedCount = waitlisted.totalDocs ?? waitlisted.docs.length;
        const canceledCount = canceled.totalDocs ?? canceled.docs.length;

        return {
          id: ev.id,
          title: ev.title,
          date: ev.date,
          capacity: ev.capacity,
          confirmedCount,
          waitlistedCount,
          canceledCount,
          percentageFilled: ev.capacity > 0 ? (confirmedCount / ev.capacity) * 100 : 0,
        };
      })
    );

    // Summary counts
    const [confirmedAll, waitlistedAll, canceledAll] = await Promise.all([
      payload.find({
        collection: 'bookings',
        where: { and: [{ tenant: { equals: tenantId } }, { status: { equals: 'confirmed' } }] },
        limit: 1,
        depth: 0,
      }),
      payload.find({
        collection: 'bookings',
        where: { and: [{ tenant: { equals: tenantId } }, { status: { equals: 'waitlisted' } }] },
        limit: 1,
        depth: 0,
      }),
      payload.find({
        collection: 'bookings',
        where: { and: [{ tenant: { equals: tenantId } }, { status: { equals: 'canceled' } }] },
        limit: 1,
        depth: 0,
      }),
    ]);

    // Recent booking logs
    const recentLogs = await payload.find({
      collection: 'booking-logs',
      where: { tenant: { equals: tenantId } },
      limit: 5,
      sort: '-createdAt',
      depth: 2,
    });

    return res.status(200).json({
      events: eventsWithCounts,
      summary: {
        totalEvents: events.totalDocs ?? events.docs.length,
        totalConfirmed: confirmedAll.totalDocs ?? confirmedAll.docs.length,
        totalWaitlisted: waitlistedAll.totalDocs ?? waitlistedAll.docs.length,
        totalCanceled: canceledAll.totalDocs ?? canceledAll.docs.length,
      },
      recentLogs: recentLogs.docs,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
