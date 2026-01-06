import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema.js';

dotenv.config();

const connectionString = `postgres://${process.env.DB_USER || 'eventuser'}:${process.env.DB_PASSWORD || 'eventpass'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'eventpyramide'}`;

const client = postgres(connectionString, {
  max: 50,
  idle_timeout: 5,
  connect_timeout: 5,
  prepare: true,
  query_timeout: 5000,
  statement_timeout: 5000,
  socket_timeout: 5000,
  // Enable TCP keepalive
  keep_alive: { enabled: true, idle_in_transaction_session_timeout: 30000 }
});

const db = drizzle(client, { schema });

export default db;


