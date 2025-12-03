'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add unique constraint to code field
    await queryInterface.addConstraint('classes', {
      fields: ['code'],
      type: 'unique',
      name: 'classes_code_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove unique constraint from code field
    await queryInterface.removeConstraint('classes', 'classes_code_unique');
  }
};