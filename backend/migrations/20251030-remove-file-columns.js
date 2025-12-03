'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Xóa các cột file từ bảng lessons
    await queryInterface.removeColumn('lessons', 'file_url');
    await queryInterface.removeColumn('lessons', 'file_name');
    await queryInterface.removeColumn('lessons', 'file_size');
    await queryInterface.removeColumn('lessons', 'file_type');

    // Xóa các cột file từ bảng submissions
    await queryInterface.removeColumn('submissions', 'file_url');
    await queryInterface.removeColumn('submissions', 'file_name');
    await queryInterface.removeColumn('submissions', 'file_size');
    await queryInterface.removeColumn('submissions', 'file_type');

    console.log('✅ Đã xóa các cột file cũ từ lessons và submissions');
  },

  down: async (queryInterface, Sequelize) => {
    // Khôi phục các cột file cho bảng lessons
    await queryInterface.addColumn('lessons', 'file_url', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.addColumn('lessons', 'file_name', {
      type: Sequelize.STRING(200),
      allowNull: true
    });
    await queryInterface.addColumn('lessons', 'file_size', {
      type: Sequelize.BIGINT,
      allowNull: true
    });
    await queryInterface.addColumn('lessons', 'file_type', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    // Khôi phục các cột file cho bảng submissions
    await queryInterface.addColumn('submissions', 'file_url', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.addColumn('submissions', 'file_name', {
      type: Sequelize.STRING(200),
      allowNull: true
    });
    await queryInterface.addColumn('submissions', 'file_size', {
      type: Sequelize.BIGINT,
      allowNull: true
    });
    await queryInterface.addColumn('submissions', 'file_type', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    console.log('✅ Đã khôi phục các cột file cho lessons và submissions');
  }
};
