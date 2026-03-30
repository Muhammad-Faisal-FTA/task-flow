// Test login with actual service
// Usage: node test-login.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function testLogin() {
  try {
    console.log('🧪 Testing login with actual service...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    // Import the actual service
    const { loginUser } = await import('./services/authService.js');
    
    // Test with the verified user
    const testEmail = 'zumuhammad65@gmail.com';
    const testPassword = 'Test123!';
    
    console.log(`Testing login for: ${testEmail}`);
    console.log(`Password: ${testPassword}\n`);
    
    try {
      const result = await loginUser({
        email: testEmail,
        password: testPassword
      });
      
      console.log('✅ Login successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
      
    } catch (loginError) {
      console.log('❌ Login failed:');
      console.log('Error:', loginError.message);
      console.log('Stack:', loginError.stack);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

testLogin();