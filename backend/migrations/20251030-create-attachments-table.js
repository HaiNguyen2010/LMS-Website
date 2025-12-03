'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attachments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      attachable_type: {
        type: Sequelize.ENUM('lesson', 'assignment', 'submission'),
        allowNull: false,
        comment: 'Loại đối tượng (lesson, assignment, submission)'
      },
      attachable_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID của đối tượng'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Tên file gốc'
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Đường dẫn file'
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Kích thước file (bytes)'
      },
      file_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Loại file (pdf, docx, mp4, etc.)'
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'MIME type của file'
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID người upload',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả file'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Thứ tự sắp xếp'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Tạo indexes
    await queryInterface.addIndex('attachments', ['attachable_type', 'attachable_id'], {
      name: 'attachments_polymorphic_index'
    });

    await queryInterface.addIndex('attachments', ['uploaded_by'], {
      name: 'attachments_uploaded_by_index'
    });

    await queryInterface.addIndex('attachments', ['file_type'], {
      name: 'attachments_file_type_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('attachments');
  }
};
