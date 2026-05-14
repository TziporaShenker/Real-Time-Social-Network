import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a new pool instance using the environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Event listener to confirm connection
pool.on('connect', () => {
  console.log('[Database]: Connected to PostgreSQL successfully');
});

// Event listener for unexpected errors
pool.on('error', (err) => {
  console.error('[Database]: Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;