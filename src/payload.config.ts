
import { buildConfig } from 'payload';
import path from 'path';
import { fileURLToPath } from 'url';

import { Tenants } from './collections/Tenants';
import { Users } from './collections/Users';
import { Events } from './collections/Events';
import { Bookings } from './collections/Bookings';
import { Notifications } from './collections/Notifications';
import { BookingLogs } from './collections/BookingLogs';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { mongooseAdapter } from '@payloadcms/db-mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Tenants, Users, Events, Bookings, Notifications, BookingLogs],
  editor: lexicalEditor(),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI as string,
  }),
  secret: process.env.PAYLOAD_SECRET as string, 
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
});
