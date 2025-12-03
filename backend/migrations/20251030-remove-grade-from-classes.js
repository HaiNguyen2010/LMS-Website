'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the grade column from classes table
    await queryInterface.removeColumn('classes', 'grade');
    
    // Remove the index on grade if it exists
    try {
      await queryInterface.removeIndex('classes', ['grade']);
    } catch (error) {
      // Index might not exist, that's okay
      console.log('Grade index does not exist, skipping removal');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add the grade column
    await queryInterface.addColumn('classes', 'grade', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isInt: {
          msg: 'Khối phải là số nguyên'
        },
        min: {
          args: [1],
          msg: 'Khối phải lớn hơn 0'
        },
        max: {
          args: [12],
          msg: 'Khối không được lớn hơn 12'
        }
      }
    });
    
    // Re-add the index on grade
    await queryInterface.addIndex('classes', ['grade']);
  }
};