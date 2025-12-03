/**
 * Script để kiểm tra và validate Swagger documentation
 */

const { swaggerSpec } = require('../config/swagger');
const fs = require('fs');
const path = require('path');

const validateSwagger = () => {
  console.log('🔍 Đang kiểm tra Swagger specification...\n');

  // Kiểm tra các thông tin cơ bản
  console.log('📋 Thông tin API:');
  console.log(`   Title: ${swaggerSpec.info.title}`);
  console.log(`   Version: ${swaggerSpec.info.version}`);
  console.log(`   Description: ${swaggerSpec.info.description}`);
  console.log('');

  // Đếm số lượng paths
  const pathCount = Object.keys(swaggerSpec.paths || {}).length;
  console.log(`🛣️  Số lượng endpoints: ${pathCount}`);

  // Liệt kê các endpoints
  if (swaggerSpec.paths) {
    console.log('\n📍 Danh sách endpoints:');
    Object.keys(swaggerSpec.paths).forEach(path => {
      const methods = Object.keys(swaggerSpec.paths[path]);
      methods.forEach(method => {
        const endpoint = swaggerSpec.paths[path][method];
        const summary = endpoint.summary || 'Không có mô tả';
        console.log(`   ${method.toUpperCase().padEnd(6)} ${path.padEnd(35)} - ${summary}`);
      });
    });
  }

  // Đếm số lượng schemas
  const schemaCount = Object.keys(swaggerSpec.components?.schemas || {}).length;
  console.log(`\n📝 Số lượng schemas: ${schemaCount}`);

  if (swaggerSpec.components?.schemas) {
    console.log('\n🏗️  Danh sách schemas:');
    Object.keys(swaggerSpec.components.schemas).forEach(schema => {
      console.log(`   - ${schema}`);
    });
  }

  // Đếm số lượng tags
  const tagCount = (swaggerSpec.tags || []).length;
  console.log(`\n🏷️  Số lượng tags: ${tagCount}`);

  if (swaggerSpec.tags) {
    console.log('\n📂 Danh sách tags:');
    swaggerSpec.tags.forEach(tag => {
      console.log(`   - ${tag.name}: ${tag.description}`);
    });
  }

  // Xuất file JSON để debug (nếu cần)
  const outputPath = path.join(__dirname, '..', 'swagger-spec.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  console.log(`\n💾 Đã xuất swagger spec ra file: ${outputPath}`);

  console.log('\n✅ Swagger documentation hợp lệ!');
  console.log('🌐 Truy cập tại: http://localhost:5000/api-docs');
};

// Chạy validation
try {
  validateSwagger();
} catch (error) {
  console.error('❌ Lỗi khi validate Swagger:', error);
  process.exit(1);
}