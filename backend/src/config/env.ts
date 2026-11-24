import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '../.env' });
dotenv.config(); // also fallback to current directory

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('postgresql://listd:listd_secret@localhost:5432/listd_db?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('super_secret_jwt_key_replace_in_production'),
  CORS_ORIGIN: z.string().default('*'),
  TMDB_API_KEY: z.string().optional(),
  RAWG_API_KEY: z.string().optional(),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
