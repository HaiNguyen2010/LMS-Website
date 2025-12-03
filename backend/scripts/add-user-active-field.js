const { sequelize } = require('../config/database');

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add isActive field to users...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Add isActive column
    await queryInterface.addColumn('users', 'isActive', {
      type: sequelize.Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Trạng thái kích hoạt tài khoản, mặc định là false, admin có thể thay đổi',
      after: 'address'
    });
    console.log('✅ Added isActive column');

    // Update existing users to have isActive = true (for existing accounts)
    await sequelize.query('UPDATE users SET isActive = true WHERE role = "admin"');
    console.log('✅ Set all admin accounts to active');

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
