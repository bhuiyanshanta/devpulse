import { Pool } from 'pg';
import config from './config';

// connectionString ব্যবহার করে সরাসরি নিয়ন ডিবির সাথে কানেক্ট করা হলো
const pool = new Pool({
  connectionString: config.database_url,
  ssl: {
    rejectUnauthorized: false, // নিয়ন ডিবির নিরাপদ ক্লাউড কানেকশনের জন্য এটি জরুরি
  }
});

pool.on('connect', () => {
  console.log('Neon PostgreSQL Database connected successfully! ');
});

export default pool;
