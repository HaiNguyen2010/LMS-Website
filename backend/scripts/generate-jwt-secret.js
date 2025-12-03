/**
 * Script để generate JWT secret ngẫu nhiên
 */

const crypto = require('crypto');

const generateJWTSecret = () => {
  // Tạo JWT secret ngẫu nhiên 64 bytes
  const secret = crypto.randomBytes(64).toString('hex');
  
  console.log('🔐 JWT Secret đã được tạo:');
  console.log(`   ${secret}`);
  console.log('');
  console.log('📋 Sao chép dòng dưới đây vào file .env:');
  console.log(`   JWT_SECRET=${secret}`);
  console.log('');
  console.log('⚠️  Lưu ý: Giữ secret này bí mật và không commit vào git!');
  
  return secret;
};

// Chạy script
generateJWTSecret();