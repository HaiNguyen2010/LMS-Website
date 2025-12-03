'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thêm cột code và maxStudents
    await queryInterface.addColumn('classes', 'code', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: '2024-2025'
    });

    await queryInterface.addColumn('classes', 'maxStudents', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Xóa cột grade
    await queryInterface.removeColumn('classes', 'grade');

    // Xóa index cũ của grade
    try {
      await queryInterface.removeIndex('classes', ['grade']);
    } catch (error) {
      // Index có thể không tồn tại, bỏ qua lỗi
      console.log('Grade index not found, skipping removal');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Thêm lại cột grade
    await queryInterface.addColumn('classes', 'grade', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    // Tạo lại index cho grade
    await queryInterface.addIndex('classes', ['grade']);

    // Xóa các cột đã thêm
    await queryInterface.removeColumn('classes', 'maxStudents');
    await queryInterface.removeColumn('classes', 'code');
  }
};