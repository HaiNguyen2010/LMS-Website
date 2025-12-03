const { sequelize } = require('../config/database');

async function removeFileColumns() {
  try {
    console.log('🔧 Bắt đầu xóa các cột file cũ...\n');

    // Xóa các cột từ bảng lessons
    console.log('📖 Xóa cột file từ bảng lessons...');
    await sequelize.query('ALTER TABLE lessons DROP COLUMN IF EXISTS file_url');
    await sequelize.query('ALTER TABLE lessons DROP COLUMN IF EXISTS file_name');
    await sequelize.query('ALTER TABLE lessons DROP COLUMN IF EXISTS file_size');
    await sequelize.query('ALTER TABLE lessons DROP COLUMN IF EXISTS file_type');
    console.log('   ✓ Đã xóa các cột file từ bảng lessons');

    // Xóa các cột từ bảng submissions
    console.log('📤 Xóa cột file từ bảng submissions...');
    await sequelize.query('ALTER TABLE submissions DROP COLUMN IF EXISTS file_url');
    await sequelize.query('ALTER TABLE submissions DROP COLUMN IF EXISTS file_name');
    await sequelize.query('ALTER TABLE submissions DROP COLUMN IF EXISTS file_size');
    await sequelize.query('ALTER TABLE submissions DROP COLUMN IF EXISTS file_type');
    console.log('   ✓ Đã xóa các cột file từ bảng submissions');

    console.log('\n✅ Hoàn tất! Các cột file cũ đã được xóa.');
    console.log('📎 Giờ hệ thống chỉ sử dụng bảng attachments cho multiple files.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi xóa cột:', error.message);
    process.exit(1);
  }
}

removeFileColumns();
