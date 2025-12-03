const { sequelize } = require('../config/database');
const { Attachment, Assignment, Lesson } = require('../models');

async function seedAttachments() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công');

    // Xóa dữ liệu cũ
    console.log('🗑️  Xóa dữ liệu attachments cũ...');
    await Attachment.destroy({ where: {} });

    // Tạo attachments cho assignments
    console.log('📎 Tạo attachments cho assignments...');
    const attachmentsData = [
      // Assignment 1 - có 2 files
      {
        attachableType: 'assignment',
        attachableId: 1,
        fileName: 'Huong_dan_lam_bai.pdf',
        fileUrl: '/uploads/assignments/assignment-1730281200000-Huong_dan_lam_bai.pdf',
        fileSize: 524288, // 512KB
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedBy: 2
      },
      {
        attachableType: 'assignment',
        attachableId: 1,
        fileName: 'Vi_du_bai_lam.jpg',
        fileUrl: '/uploads/assignments/assignment-1730281200001-Vi_du_bai_lam.jpg',
        fileSize: 245760, // 240KB
        fileType: 'jpg',
        mimeType: 'image/jpeg',
        uploadedBy: 2
      },
      // Có thể thêm attachments cho lesson nếu cần
      // {
      //   attachableType: 'lesson',
      //   attachableId: 1,
      //   fileName: 'Bai_giang_toan_1.pdf',
      //   fileUrl: '/uploads/lessons/lesson-1730281200000-Bai_giang_toan_1.pdf',
      //   fileSize: 1048576, // 1MB
      //   fileType: 'pdf',
      //   mimeType: 'application/pdf',
      //   uploadedBy: 2
      // }
    ];

    const attachments = await Attachment.bulkCreate(attachmentsData);
    console.log(`✅ Đã tạo ${attachments.length} attachments`);

    // Hiển thị kết quả
    console.log('\n📊 Danh sách attachments đã tạo:');
    attachments.forEach(att => {
      console.log(`   - ID: ${att.id}`);
      console.log(`     Type: ${att.attachableType}`);
      console.log(`     TypeID: ${att.attachableId}`);
      console.log(`     File: ${att.fileName}`);
      console.log(`     Size: ${(att.fileSize / 1024).toFixed(2)} KB`);
      console.log(`     URL: ${att.fileUrl}`);
      console.log('');
    });

    console.log('✅ Seed attachments thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed attachments:', error);
    process.exit(1);
  }
}

seedAttachments();
