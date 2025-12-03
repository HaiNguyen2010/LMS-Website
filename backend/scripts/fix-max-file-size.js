const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'lms_database',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log,
  }
);

async function fixMaxFileSize() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Update all assignments where maxFileSize > 1000 (likely in bytes)
    // Convert bytes to MB (divide by 1048576)
    const [results] = await sequelize.query(`
      UPDATE assignments 
      SET maxFileSize = ROUND(maxFileSize / 1048576)
      WHERE maxFileSize > 1000;
    `);

    console.log(`✅ Updated ${results.affectedRows} assignments`);
    console.log('✅ maxFileSize values have been converted from bytes to MB');

    // Show some examples
    const [assignments] = await sequelize.query(`
      SELECT id, title, maxFileSize 
      FROM assignments 
      LIMIT 10;
    `);

    console.log('\n📋 Sample assignments after update:');
    console.table(assignments);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixMaxFileSize();
