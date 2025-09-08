import * as bcrypt from 'bcrypt';
import * as mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

async function addAdminUser() {
  let connection: mysql.Connection | null = null;
  
  try {
    // Create direct MySQL connection to avoid TypeORM schema sync
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });
    
    console.log('Database connection established');
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const email = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
    const password = args.find(arg => arg.startsWith('--password='))?.split('=')[1];
    const firstName = args.find(arg => arg.startsWith('--firstName='))?.split('=')[1];
    const lastName = args.find(arg => arg.startsWith('--lastName='))?.split('=')[1];
    
    if (!email || !password) {
      console.error('❌ Error: Email and password are required');
      console.log('Usage: npm run add:admin -- --email=admin@example.com --password=password123 [--firstName=John] [--lastName=Doe]');
      process.exit(1);
    }
    
    if (password.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters long');
      process.exit(1);
    }
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      console.error(`❌ Error: User with email ${email} already exists`);
      process.exit(1);
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate UUID for the user
    const userId = require('crypto').randomUUID();
    
    // Create admin user directly using query
    await connection.execute(`
      INSERT INTO users (
        id, email, password, role, first_name, last_name, 
        is_active, email_verified, created_at, updated_at
      ) VALUES (
        ?, ?, ?, 'admin', ?, ?, 
        true, true, NOW(), NOW()
      )
    `, [userId, email, hashedPassword, firstName || null, lastName || null]);
    
    // Get the created user to display info
    const [users] = await connection.execute(
      'SELECT id, email, role, first_name, last_name FROM users WHERE email = ?',
      [email]
    );
    
    const savedUser = Array.isArray(users) && users.length > 0 ? users[0] as any : null;
    
    if (!savedUser) {
      throw new Error('Failed to retrieve created user');
    }
    
    const fullName = [savedUser.first_name, savedUser.last_name].filter(Boolean).join(' ');
    
    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${savedUser.email}`);
    console.log(`Role: ${savedUser.role}`);
    console.log(`Name: ${fullName || 'Not provided'}`);
    console.log(`User ID: ${savedUser.id}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addAdminUser();