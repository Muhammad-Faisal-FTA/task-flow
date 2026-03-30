// Script to reset password for testing
// Usage: node reset-test-password.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function resetPassword() {
  try {
    console.log('🔧 Resetting password for test user...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    // Direct database update without schema
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find the user
    const user = await usersCollection.findOne({ email: 'zumuhammad65@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Verified: ${user.isVerified}\n`);

    // Set new password
    const newPassword = 'Test123!';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password directly
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Password reset successful!');
    console.log(`New password: ${newPassword}`);
    console.log('\n📝 You can now test login with:');
    console.log(`Email: zumuhammad65@gmail.com`);
    console.log(`Password: ${newPassword}`);

  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

resetPassword();