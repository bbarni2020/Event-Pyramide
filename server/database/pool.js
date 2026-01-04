import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema.js';

dotenv.config();

const connectionString = `postgres://${process.env.DB_USER || 'eventuser'}:${process.env.DB_PASSWORD || 'eventpass'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'eventpyramide'}`;

const client = postgres(connectionString, {
  max: 20, // max pool size
  idle_timeout: 20, // close idle connections after 20 seconds
  connect_timeout: 10, // timeout for connecting
  prepare: true, // use prepared statements for better performance
});

const db = drizzle(client, { schema });

export default db;
