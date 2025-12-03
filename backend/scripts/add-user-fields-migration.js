const { sequelize } = require('../config/database');

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add user fields (phoneNumber, code, address)...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Add phoneNumber column
    await queryInterface.addColumn('users', 'phoneNumber', {
      type: sequelize.Sequelize.STRING(20),
      allowNull: true,
      after: 'role'
    });
    console.log('✅ Added phoneNumber column');

    // Add code column
    await queryInterface.addColumn('users', 'code', {
      type: sequelize.Sequelize.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'Mã số sinh viên hoặc mã số giáo viên',
      after: 'phoneNumber'
    });
    console.log('✅ Added code column');

    // Add address column
    await queryInterface.addColumn('users', 'address', {
      type: sequelize.Sequelize.TEXT,
      allowNull: true,
      after: 'code'
    });
    console.log('✅ Added address column');

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
