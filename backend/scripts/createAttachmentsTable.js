const { sequelize } = require('../config/database');

async function createAttachmentsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        attachable_type ENUM('lesson', 'assignment', 'submission') NOT NULL COMMENT 'Loại đối tượng',
        attachable_id INT NOT NULL COMMENT 'ID của đối tượng',
        file_name VARCHAR(255) NOT NULL COMMENT 'Tên file gốc',
        file_url VARCHAR(500) NOT NULL COMMENT 'Đường dẫn file',
        file_size INT NULL COMMENT 'Kích thước file (bytes)',
        file_type VARCHAR(50) NULL COMMENT 'Loại file',
        mime_type VARCHAR(100) NULL COMMENT 'MIME type của file',
        uploaded_by INT NOT NULL COMMENT 'ID người upload',
        description TEXT NULL COMMENT 'Mô tả file',
        sort_order INT NULL DEFAULT 0 COMMENT 'Thứ tự sắp xếp',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        
        CONSTRAINT fk_attachments_user 
          FOREIGN KEY (uploaded_by) REFERENCES users(id) 
          ON UPDATE CASCADE ON DELETE RESTRICT,
        
        INDEX attachments_polymorphic_index (attachable_type, attachable_id),
        INDEX attachments_uploaded_by_index (uploaded_by),
        INDEX attachments_file_type_index (file_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Bảng attachments đã được tạo thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo bảng:', error.message);
    process.exit(1);
  }
}

createAttachmentsTable();
