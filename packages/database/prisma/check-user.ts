import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  if (!user) {
    console.log('❌ User not found in database');
    return;
  }

  console.log('✅ User found:');
  console.log('   Email:', user.email);
  console.log('   Name:', user.name);
  console.log('   Role:', user.role);
  console.log('   Password hash:', user.passwordHash.substring(0, 20) + '...');

  // Test password
  const testPassword = 'password123';
  const isValid = await bcrypt.compare(testPassword, user.passwordHash);
  console.log('\n🔐 Password test:');
  console.log('   Input:', testPassword);
  console.log('   Valid:', isValid ? '✅ YES' : '❌ NO');

  if (!isValid) {
    console.log('\n🔧 Creating new hash...');
    const newHash = await bcrypt.hash(testPassword, 10);
    await prisma.user.update({
      where: { email: 'test@example.com' },
      data: { passwordHash: newHash },
    });
    console.log('✅ Password updated successfully');
  }
}

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
