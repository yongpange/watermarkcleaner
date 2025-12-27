const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTable() {
  try {
    // Create table SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT gen_random_uuid(),
        slug VARCHAR(255) UNIQUE NOT NULL,
        title JSONB NOT NULL,
        description JSONB NOT NULL,
        content JSONB NOT NULL,
        category VARCHAR(50) NOT NULL,
        author VARCHAR(100) NOT NULL,
        publish_date TIMESTAMPTZ NOT NULL,
        read_time INTEGER NOT NULL DEFAULT 5,
        featured BOOLEAN DEFAULT FALSE,
        cover_url VARCHAR(500),
        author_name VARCHAR(255) NOT NULL,
        author_avatar_url VARCHAR(500),
        locale VARCHAR(10) NOT NULL DEFAULT 'en',
        status VARCHAR(20) NOT NULL DEFAULT 'published',
        tags JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Posts table created successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createTable();