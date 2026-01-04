import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './server/database/schema.js',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'eventuser',
    password: process.env.DB_PASSWORD || 'eventpass',
    database: process.env.DB_NAME || 'eventpyramide',
  },
});
