'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'phoneNumber', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'role'
    });

    await queryInterface.addColumn('users', 'code', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'Mã số sinh viên hoặc mã số giáo viên',
      after: 'phoneNumber'
    });

    await queryInterface.addColumn('users', 'address', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'code'
    });

    // Add index for code for faster lookups
    await queryInterface.addIndex('users', ['code'], {
      name: 'idx_users_code',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', 'idx_users_code');
    await queryInterface.removeColumn('users', 'address');
    await queryInterface.removeColumn('users', 'code');
    await queryInterface.removeColumn('users', 'phoneNumber');
  }
};
