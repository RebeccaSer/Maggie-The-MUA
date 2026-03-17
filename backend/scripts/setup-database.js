const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default database first
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting HER BY MAGGIE database setup...');
    
    // Check if database exists
    const dbName = process.env.DB_NAME || 'makeup_artist';
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`📁 Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Database created successfully');
    } else {
      console.log(`✅ Database ${dbName} already exists`);
    }

    // Switch to the target database
    await client.release();
    pool.end();

    const targetPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });

    const targetClient = await targetPool.connect();

    // Read and execute the initialization script
    const initScript = fs.readFileSync(
      path.join(__dirname, 'init-database.sql'), 
      'utf8'
    );
    
    console.log('📊 Creating tables and inserting sample data...');
    await targetClient.query(initScript);
    console.log('✅ Database initialization completed successfully!');
    
    console.log('\n🎉 HER BY MAGGIE database setup complete!');
    console.log('📋 Next steps:');
    console.log('   1. Start your backend server: npm run dev');
    console.log('   2. Start your frontend server: cd frontend && npm start');
    console.log('   3. Access the application at http://localhost:3000');
    console.log('   4. Admin login: admin@maggiethe-mua.com / admin123');
    
    await targetClient.release();
    await targetPool.end();

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();