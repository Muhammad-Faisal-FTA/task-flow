// Debug script to test login functionality
// Run with: node debug-login.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Import models and services
import { UserModel } from './models/user.model.js';
import { connectDB } from './lib/mongoose.js';
import { loginUser } from './services/authService.js';

dotenv.config();

async function debugLogin() {
  try {
    console.log('🔍 Starting login debug...\n');

    // 1. Connect to database
    console.log('1. Connecting to database...');
    await connectDB();
    console.log(' Database connected\n');

    // 2. Check if users exist
    console.log('2. Checking existing users...');
    const users = await UserModel.find({}, { email: 1, isVerified: 1, password: 1 }).limit(5);
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Verified: ${user.isVerified}`);
    });
    console.log();

    // 3. Test login with sample credentials
    if (users.length > 0) {
      console.log('3. Testing login with first user...');
      const testUser = users[0];
      
      try {
        const result = await loginUser({
          email: testUser.email,
          password: 'test123' // Try a common test password
        });
        console.log('✅ Login successful:', result);
      } catch (loginError) {
        console.log('❌ Login failed:', loginError.message);
        
        // 4. Test password comparison directly
        console.log('\n4. Testing password comparison...');
        const testPasswords = ['test123', 'password', '123456', testUser.email.split('@')[0]];
        
        for (const pwd of testPasswords) {
          try {
            const isMatch = await testUser.comparePassword(pwd);
            console.log(`Password "${pwd}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
          } catch (compareError) {
            console.log(`Password "${pwd}": ❌ ERROR - ${compareError.message}`);
          }
        }
      }
    }

    // 5. Test JWT secrets
    console.log('\n5. Testing JWT secrets...');
    const secrets = {
      ACCESS: process.env.JWT_ACCESS_SECRET,
      REFRESH: process.env.JWT_REFRESH_SECRET,
      EMAIL: process.env.JWT_EMAIL_SECRET
    };

    Object.entries(secrets).forEach(([key, secret]) => {
      console.log(`${key}: ${secret ? '✅ SET' : '❌ MISSING'}`);
      if (secret) {
        console.log(`   Length: ${secret.length} chars`);
      }
    });

    console.log('\n🔍 Debug complete!');

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

debugLogin();