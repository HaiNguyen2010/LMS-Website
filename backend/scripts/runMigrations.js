const { sequelize } = require('./config/database');
const Umzug = require('umzug');
const path = require('path');

const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, 'migrations'),
    params: [
      sequelize.getQueryInterface(),
      sequelize.constructor
    ]
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  }
});

async function runMigrations() {
  try {
    console.log('Đang chạy migrations...');
    const migrations = await umzug.up();
    console.log('Migrations hoàn thành:', migrations.map(m => m.file));
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi chạy migrations:', error);
    process.exit(1);
  }
}

runMigrations();
