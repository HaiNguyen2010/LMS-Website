require('dotenv').config();
const { seedClassManagementData } = require('./seedClassData');
const { testConnection, sequelize } = require('../config/database');

const runSeed = async () => {
  try {
    console.log('🚀 Bắt đầu quá trình seed dữ liệu Class Management...\n');
    
    // Test kết nối database
    await testConnection();
    
    // Chạy seed
    await seedClassManagementData();
    
    console.log('\n✅ Seed dữ liệu hoàn tất!');
    
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  } finally {
    // Đóng kết nối database
    await sequelize.close();
    console.log('🔒 Đã đóng kết nối database');
    process.exit(0);
  }
};

// Chạy seed nếu file được gọi trực tiếp
if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };