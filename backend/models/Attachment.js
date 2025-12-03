const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Polymorphic fields
  attachableType: {
    type: DataTypes.ENUM('lesson', 'assignment', 'submission'),
    allowNull: false,
    field: 'attachable_type',
    comment: 'Loại đối tượng (lesson, assignment, submission)',
    validate: {
      notNull: {
        msg: 'Loại đối tượng là bắt buộc'
      },
      isIn: {
        args: [['lesson', 'assignment', 'submission']],
        msg: 'Loại đối tượng không hợp lệ'
      }
    }
  },
  attachableId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'attachable_id',
    comment: 'ID của đối tượng',
    validate: {
      notNull: {
        msg: 'ID đối tượng là bắt buộc'
      },
      isInt: {
        msg: 'ID đối tượng phải là số nguyên'
      }
    }
  },
  // File information
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name',
    comment: 'Tên file gốc',
    validate: {
      notEmpty: {
        msg: 'Tên file không được để trống'
      }
    }
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_url',
    comment: 'Đường dẫn file',
    validate: {
      notEmpty: {
        msg: 'Đường dẫn file không được để trống'
      }
    }
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size',
    comment: 'Kích thước file (bytes)',
    validate: {
      min: {
        args: [0],
        msg: 'Kích thước file không được âm'
      }
    }
  },
  fileType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'file_type',
    comment: 'Loại file (pdf, docx, mp4, etc.)',
    validate: {
      isIn: {
        args: [['pdf', 'docx', 'doc', 'pptx', 'ppt', 'mp4', 'avi', 'mkv', 'xlsx', 'xls', 'jpg', 'jpeg', 'png', 'zip', 'rar', 'txt']],
        msg: 'Loại file không được hỗ trợ'
      }
    }
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'mime_type',
    comment: 'MIME type của file'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'uploaded_by',
    comment: 'ID người upload',
    validate: {
      notNull: {
        msg: 'Người upload là bắt buộc'
      },
      isInt: {
        msg: 'ID người upload phải là số nguyên'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mô tả file'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'sort_order',
    comment: 'Thứ tự sắp xếp'
  }
}, {
  tableName: 'attachments',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['attachable_type', 'attachable_id'],
      name: 'attachments_polymorphic_index'
    },
    {
      fields: ['uploaded_by'],
      name: 'attachments_uploaded_by_index'
    },
    {
      fields: ['file_type'],
      name: 'attachments_file_type_index'
    }
  ]
});

module.exports = Attachment;
