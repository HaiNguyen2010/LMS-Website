const { sequelize } = require('../models');

async function fixSubjectsTable() {
  try {
    console.log('🔧 Bắt đầu fix bảng subjects...');

    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('✅ Đã tắt foreign key checks');

    // Drop các bảng liên quan trước
    await sequelize.query('DROP TABLE IF EXISTS teacherassignments;');
    await sequelize.query('DROP TABLE IF EXISTS subjects;');
    console.log('✅ Đã xóa bảng subjects và teacherassignments');

    // Enable foreign key checks lại
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ Đã bật lại foreign key checks');

    console.log('🎉 Fix bảng subjects thành công! Hãy restart server để recreate tables.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi fix bảng subjects:', error);
    process.exit(1);
  }
}

fixSubjectsTable();